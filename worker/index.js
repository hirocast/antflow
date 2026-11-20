// File: worker/index.js
// Cloudflare Workers: アントフロー 無登録1タップ投稿中継API

const REPO_OWNER = 'hirocast';
const REPO_NAME = 'antflow';
const SITE_URL = 'https://hirocast.github.io/antflow/';
const RATE_LIMIT_SEC = 60;
const BURST_WINDOW_MS = 60 * 1000;
const BURST_MAX_REQ = 24;

const FORBIDDEN_KEYS = new Set([
  '__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty'
]);

const NG_WORDS = [
  '死ね', 'しね', '殺す', 'ころす', 'バカ', 'ばか', 'アホ', 'あほ', 'クズ', 'くず',
  'キモ', 'きも', 'うざ', 'ウザ', 'ちん', 'まん', 'せっくす', 'セックス', 'エロ', 'えろ',
  'アダルト', '暴力', '薬物', '大麻', 'fuck', 'shit', 'bitch', 'porn', 'sex', 'nude'
];

// Isolate内インメモリレート制限ストア（*.workers.dev では caches.default が no-op になるため）
// env.RATE_LIMIT_KV がバインドされている場合は KV も併用する
const MEM_RL = new Map();
const MEM_BURST = new Map();
const MEM_RL_MAX = 4000;

function sweepMap(map, now) {
  if (map.size < MEM_RL_MAX) return;
  for (const [k, exp] of map) {
    const t = typeof exp === 'number' ? exp : (exp && exp.resetAt) || 0;
    if (t <= now) map.delete(k);
  }
  while (map.size >= MEM_RL_MAX) {
    const first = map.keys().next().value;
    if (first === undefined) break;
    map.delete(first);
  }
}

async function rlHas(env, key) {
  const now = Date.now();
  const exp = MEM_RL.get(key);
  if (exp !== undefined) {
    if (exp > now) return true;
    MEM_RL.delete(key);
  }
  if (env && env.RATE_LIMIT_KV) {
    try {
      const v = await env.RATE_LIMIT_KV.get(key);
      if (v !== null) return true;
    } catch {}
  }
  return false;
}

async function rlSet(env, key, ttlSec) {
  const now = Date.now();
  sweepMap(MEM_RL, now);
  MEM_RL.set(key, now + ttlSec * 1000);
  if (env && env.RATE_LIMIT_KV) {
    try {
      await env.RATE_LIMIT_KV.put(key, '1', { expirationTtl: Math.max(60, ttlSec) });
    } catch {}
  }
}

async function rlDel(env, key) {
  MEM_RL.delete(key);
  if (env && env.RATE_LIMIT_KV) {
    try {
      await env.RATE_LIMIT_KV.delete(key);
    } catch {}
  }
}

function checkBurstLimit(ip) {
  const now = Date.now();
  sweepMap(MEM_BURST, now);
  const key = String(ip || 'unknown');
  const cur = MEM_BURST.get(key);
  if (!cur || cur.resetAt <= now) {
    MEM_BURST.set(key, { count: 1, resetAt: now + BURST_WINDOW_MS });
    return false;
  }
  cur.count += 1;
  return cur.count > BURST_MAX_REQ;
}

function safeDict(raw) {
  const out = Object.create(null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!FORBIDDEN_KEYS.has(k)) out[k] = v;
  }
  return out;
}

function hasNgWord(str) {
  const s = String(str || '');
  if (/https?:\/\/|www\.|\.[a-z]{2,4}(\/|$)|[@＠]/i.test(s)) return true;
  const norm = s.toLowerCase().replace(/[\s\u3000\u200B-\u200D\uFEFF]/g, '');
  return NG_WORDS.some(w => norm.includes(w));
}

function cleanMdLine(v, max) {
  return String(v || '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/<!--|-->/g, '')
    .replace(/<\/?details\b[^>]*>/gi, '')
    .replace(/```+/g, "'''")
    .replace(/@(?=[A-Za-z0-9_-])/g, '＠')
    .replace(/[<>`]/g, '')
    .trim()
    .slice(0, max);
}

function cleanMdBlock(v, max) {
  return String(v || '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/<!--|-->/g, '')
    .replace(/<\/?details\b[^>]*>/gi, '')
    .replace(/```+/g, "'''")
    .replace(/@(?=[A-Za-z0-9_-])/g, '＠')
    .trim()
    .slice(0, max);
}

function clampInt(val, min, max, fallback) {
  const n = Math.round(Number(val));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || 'https://hirocast.github.io')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const allowed = getAllowedOrigins(env);
  if (allowed.includes('*')) return true;
  return allowed.some(a => {
    if (origin === a) return true;
    if ((a === 'http://localhost' || a === 'http://127.0.0.1') && origin.startsWith(a + ':')) {
      const port = origin.slice(a.length + 1);
      return /^\d{1,5}$/.test(port);
    }
    return false;
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const headers = {
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  if (isAllowedOrigin(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonRes(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });
}

async function parseJsonPost(request, env, cors, maxBytes) {
  const origin = request.headers.get('Origin') || '';
  if (!isAllowedOrigin(origin, env)) {
    return { errorRes: jsonRes({ ok: false, error: '許可されていない送信元です' }, 403, cors) };
  }
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!ct.startsWith('application/json')) {
    return { errorRes: jsonRes({ ok: false, error: 'Content-Type must be application/json' }, 415, cors) };
  }
  const cl = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(cl) && cl > maxBytes) {
    return { errorRes: jsonRes({ ok: false, error: '送信データが大きすぎます' }, 413, cors) };
  }
  let text;
  try {
    text = await request.text();
  } catch {
    return { errorRes: jsonRes({ ok: false, error: 'Invalid body' }, 400, cors) };
  }
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { errorRes: jsonRes({ ok: false, error: '送信データが大きすぎます' }, 413, cors) };
  }
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { errorRes: jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors) };
    }
    return { body };
  } catch {
    return { errorRes: jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors) };
  }
}

function validateImageDataUrl(rawImg) {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(rawImg);
  if (!m) return false;
  const fmt = m[1];
  const b64 = m[2];
  if (b64.length < 16) return false;
  let head;
  try {
    // 先頭16バイト相当の Base64（24文字）をデコードしてマジックバイトを検証
    const bin = atob(b64.slice(0, 24));
    head = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) head[i] = bin.charCodeAt(i);
  } catch {
    return false;
  }
  if (head.length < 12) return false;
  if (fmt === 'jpeg' || fmt === 'jpg') {
    return head[0] === 0xFF && head[1] === 0xD8 && head[2] === 0xFF;
  }
  if (fmt === 'png') {
    return head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47 &&
      head[4] === 0x0D && head[5] === 0x0A && head[6] === 0x1A && head[7] === 0x0A;
  }
  if (fmt === 'webp') {
    return head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
      head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  }
  return false;
}

async function checkRateLimit(env, ip, token) {
  if (await rlHas(env, 'post:ip:' + (ip || 'unknown'))) {
    return '連続投稿制限：少し待ってから投稿してね';
  }
  if (await rlHas(env, 'post:tok:' + token.slice(0, 64))) {
    return '同じ作品は連続で投稿できません';
  }
  return '';
}

async function recordRateLimit(env, ip, token) {
  await rlSet(env, 'post:ip:' + (ip || 'unknown'), RATE_LIMIT_SEC);
  await rlSet(env, 'post:tok:' + token.slice(0, 64), 600);
}

const ANON_ADJ = ['Sweet','Star','Sunny','Happy','Fluffy','Cozy','Mint','Choco','Berry','Peach','Lemon','Apple','Melon','Honey','Milk','Sugar','Moon','Sky','Cloud','Rain','Snow','Sakura','Mochi','Magic','Lucky','Cute','Tiny','Bouncy','Dreamy','Spark','Ruby','Pearl'];
const ANON_NOUN = ['Ant','Cat','Bear','Fox','Bunny','Panda','Koala','Frog','Duck','Owl','Seal','Puppy','Kitty','Candy','Donut','Cake','Cookie','Tart','Waffle','Puff','Macaron','Mochi','Berry','Melon','Cloud','Star','Heart','Ribbon','Bell','Leaf','Drop','Pony'];
async function makeAnonName(env, ip, clientAnon) {
  const ca = String(clientAnon || '').trim().slice(0, 16);
  if (/^[A-Za-z]{4,13}#\d{2}$/.test(ca) && !hasNgWord(ca)) return ca;
  const enc = new TextEncoder();
  let arr;
  if (env && env.ANON_SECRET) {
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(String(env.ANON_SECRET)),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(ip || 'unknown')));
    arr = new Uint8Array(sig);
  } else {
    const digest = await crypto.subtle.digest('SHA-256', enc.encode('antflow-anon:' + String(ip || 'unknown')));
    arr = new Uint8Array(digest);
  }
  const a = ANON_ADJ[arr[0] % ANON_ADJ.length];
  const n = ANON_NOUN[arr[1] % ANON_NOUN.length];
  const num = ((arr[2] << 8) | arr[3]) % 90 + 10;
  return a + n + '#' + num;
}

async function checkDuplicateIssue(env, kind, token, contentHash) {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'antflow-post-worker'
      }
    });
    if (!res.ok) return '';
    const issues = await res.json();
    if (!Array.isArray(issues)) return '';
    const pat = kind === 'bgm' ? /[?&]bgm=([A-Za-z0-9_-]+)/ : /[?&]stage=([A-Za-z0-9_-]+)/;
    const kindHeader = kind === 'bgm' ? '### オリジナルBGM投稿' : '### オリジナルステージ投稿';
    for (const iss of issues) {
      const b = iss.body || '';
      const tm = b.match(pat);
      if (tm && tm[1] === token) {
        return 'すでに同じ作品が投稿されています';
      }
      if (contentHash && b.includes(kindHeader)) {
        const hm = b.match(/^- 内容ID:\s*([A-Za-z0-9_-]+)/m);
        if (hm && hm[1] === contentHash) {
          return 'まったく同じ内容の作品がすでに投稿されています（少しアレンジしてみてね！）';
        }
      }
    }
  } catch {}
  return '';
}

async function handleTalkLike(request, env, cors) {
  const { body, errorRes } = await parseJsonPost(request, env, cors, 4096);
  if (errorRes) return errorRes;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (checkBurstLimit(ip)) {
    return jsonRes({ ok: false, error: 'アクセスが集中しています。少し待ってね' }, 429, cors);
  }

  const talk = cleanMdLine(body.talk, 60).replace(/[|\\[\]]/g, '').trim();
  const delta = body.delta === -1 ? -1 : 1;
  if (!talk || FORBIDDEN_KEYS.has(talk) || hasNgWord(talk)) {
    return jsonRes({ ok: false, error: 'Invalid talk' }, 400, cors);
  }

  const lkKey = 'like:' + ip + ':' + talk;
  if (delta === 1) {
    if (await rlHas(env, lkKey)) {
      return jsonRes({ ok: true, skipped: true }, 200, cors);
    }
    await rlSet(env, lkKey, 86400);
  } else {
    const ulKey = 'unlike:' + ip + ':' + talk;
    if (await rlHas(env, ulKey)) {
      return jsonRes({ ok: true, skipped: true }, 200, cors);
    }
    // いいね記録がないIPからの無制限な減算連打を抑制（60秒クールダウン）
    await rlDel(env, lkKey);
    await rlSet(env, ulKey, 60);
  }

  const ghHeaders = {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'antflow-post-worker',
    'Content-Type': 'application/json'
  };
  const listRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=talk-likes&state=open&per_page=1`, { headers: ghHeaders });
  if (!listRes.ok) return jsonRes({ ok: false, error: 'GitHub read failed' }, 502, cors);
  const existing = await listRes.json();
  const iss = Array.isArray(existing) && existing[0] ? existing[0] : null;

  let counts = Object.create(null);
  if (iss && iss.body) {
    const m = iss.body.match(/<!--\s*LIKES_JSON:([\s\S]*?)-->/);
    if (m) {
      try { counts = safeDict(JSON.parse(m[1])); } catch {}
    }
  }
  const next = Math.max(0, (Number(counts[talk]) || 0) + delta);
  if (next > 0) counts[talk] = next;
  else delete counts[talk];

  const sorted = Object.entries(counts).filter(([k, c]) => !FORBIDDEN_KEYS.has(k) && Number(c) > 0).sort((a, b) => b[1] - a[1]).slice(0, 200);
  const compact = Object.fromEntries(sorted);

  let md = '### 💬 人気のセリフ ランキング（自動集計）\n';
  md += '<!-- LIKES_JSON:' + JSON.stringify(compact) + ' -->\n\n';
  md += '| 順位 | いいね | セリフ |\n| --- | ---: | --- |\n';
  sorted.forEach(([t, c], i) => { md += `| ${i + 1} | ${c} | ${cleanMdLine(t, 60).replace(/\|/g, '')} |\n`; });

  if (iss) {
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${iss.number}`, {
      method: 'PATCH',
      headers: ghHeaders,
      body: JSON.stringify({ body: md })
    });
  } else if (delta > 0) {
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({ title: '[集計] 人気のセリフ ランキング', labels: ['talk-likes'], body: md })
    });
  }
  return jsonRes({ ok: true, count: next }, 200, cors);
}

async function readStageStatsIssue(ghHeaders) {
  const listRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=stage-stats&state=open&per_page=1`, { headers: ghHeaders });
  if (!listRes.ok) return { ok: false, iss: null, stats: Object.create(null) };
  const existing = await listRes.json();
  const iss = Array.isArray(existing) && existing[0] ? existing[0] : null;
  let stats = Object.create(null);
  if (iss && iss.body) {
    const m = iss.body.match(/<!--\s*STAGE_STATS_JSON:([\s\S]*?)-->/);
    if (m) {
      try { stats = safeDict(JSON.parse(m[1])); } catch {}
    }
  }
  return { ok: true, iss, stats };
}

async function handleStageStatsGet(env, cors) {
  const ghHeaders = {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'antflow-post-worker'
  };
  const { ok, stats } = await readStageStatsIssue(ghHeaders);
  if (!ok) return jsonRes({ ok: false, error: 'GitHub read failed' }, 502, cors);
  return jsonRes({ ok: true, stats }, 200, { ...cors, 'Cache-Control': 'public, max-age=10' });
}

async function handleStageStatPost(request, env, cors) {
  const { body, errorRes } = await parseJsonPost(request, env, cors, 4096);
  if (errorRes) return errorRes;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (checkBurstLimit(ip)) {
    return jsonRes({ ok: false, error: 'アクセスが集中しています。少し待ってね' }, 429, cors);
  }

  const hash = String(body.hash || '').trim();
  const event = String(body.event || '').trim();
  const sec = Number(body.sec);
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(hash) || FORBIDDEN_KEYS.has(hash)) {
    return jsonRes({ ok: false, error: 'Invalid hash' }, 400, cors);
  }
  if (!['play', 'clear', 'like', 'unlike', 'up', 'down'].includes(event)) {
    return jsonRes({ ok: false, error: 'Invalid event' }, 400, cors);
  }

  // クライアント自己申告の clientId ではなく IP ベースでレート制限・重複防止を行う
  const actor = ip;
  if (event === 'play') {
    const cdKey = 'st-play-cd:' + actor + ':' + hash;
    if (await rlHas(env, cdKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await rlSet(env, cdKey, 10);
  } else if (event === 'clear') {
    const cdKey = 'st-clr-cd:' + actor + ':' + hash;
    if (await rlHas(env, cdKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await rlSet(env, cdKey, 10);
  } else if (event === 'like') {
    const lkKey = 'st-like:' + actor + ':' + hash;
    if (await rlHas(env, lkKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await rlSet(env, lkKey, 86400);
  } else if (event === 'unlike') {
    const ulKey = 'st-unlike-cd:' + actor + ':' + hash;
    if (await rlHas(env, ulKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await rlDel(env, 'st-like:' + actor + ':' + hash);
    await rlSet(env, ulKey, 60);
  } else if (event === 'up' || event === 'down') {
    const vKey = 'st-vote:' + actor + ':' + hash;
    if (await rlHas(env, vKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await rlSet(env, vKey, 86400);
  }

  let isUniquePlay = false;
  if (event === 'play') {
    const uKey = 'st-uniq:' + actor + ':' + hash;
    if (!(await rlHas(env, uKey))) {
      isUniquePlay = true;
      await rlSet(env, uKey, 86400);
    }
  }

  const ghHeaders = {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'antflow-post-worker',
    'Content-Type': 'application/json'
  };
  const { ok, iss, stats } = await readStageStatsIssue(ghHeaders);
  if (!ok) return jsonRes({ ok: false, error: 'GitHub read failed' }, 502, cors);

  const prev = (stats[hash] && typeof stats[hash] === 'object') ? stats[hash] : {};
  const cur = {
    u: Number(prev.u) || 0,
    p: Number(prev.p) || 0,
    c: Number(prev.c) || 0,
    ts: Number(prev.ts) || 0,
    bt: Number(prev.bt) || 0,
    lk: Number(prev.lk) || 0,
    up: Number(prev.up) || 0,
    dn: Number(prev.dn) || 0
  };
  if (event === 'play') {
    cur.p += 1;
    if (isUniquePlay) cur.u += 1;
  } else if (event === 'clear') {
    cur.c += 1;
    if (Number.isFinite(sec) && sec >= 0.1 && sec <= 36000) {
      const s1 = Math.round(sec * 10) / 10;
      cur.ts = Math.round((cur.ts + s1) * 10) / 10;
      cur.bt = cur.bt > 0 ? Math.round(Math.min(cur.bt, s1) * 10) / 10 : s1;
    }
  } else if (event === 'like') {
    cur.lk += 1;
  } else if (event === 'unlike') {
    cur.lk = Math.max(0, cur.lk - 1);
  } else if (event === 'up') {
    cur.up += 1;
  } else if (event === 'down') {
    cur.dn += 1;
  }
  stats[hash] = cur;

  const entries = Object.entries(stats)
    .filter(([k]) => !FORBIDDEN_KEYS.has(k) && /^[A-Za-z0-9_-]{6,32}$/.test(k))
    .sort((a, b) => (b[1].p || 0) - (a[1].p || 0))
    .slice(0, 300);
  const compact = Object.fromEntries(entries);
  let md = '### 📊 投稿ステージ統計（自動集計）\n';
  md += '<!-- STAGE_STATS_JSON:' + JSON.stringify(compact) + ' -->\n\n';
  md += '| 内容ID | 人数 | プレイ | クリア | いいね | 👍 | 👎 | 最短 |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n';
  entries.slice(0, 50).forEach(([h, s]) => {
    md += `| ${h} | ${s.u || 0} | ${s.p || 0} | ${s.c || 0} | ${s.lk || 0} | ${s.up || 0} | ${s.dn || 0} | ${s.bt ? s.bt + 's' : '-'} |\n`;
  });

  if (iss) {
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${iss.number}`, {
      method: 'PATCH',
      headers: ghHeaders,
      body: JSON.stringify({ body: md })
    });
  } else {
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({ title: '[集計] 投稿ステージ統計', labels: ['stage-stats'], body: md })
    });
  }
  return jsonRes({ ok: true, stat: cur }, 200, cors);
}

const FEEDBACK_CATS = {
  maker: '🎨 つくる要望・不具合',
  idea: '💡 新機能アイデア',
  stage: '🎨 ステージ・曲の希望',
  bug: '🐛 不具合・重い報告',
  other: '💌 感想・応援'
};

async function handleFeedback(request, env, cors) {
  const { body, errorRes } = await parseJsonPost(request, env, cors, 100000);
  if (errorRes) return errorRes;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (checkBurstLimit(ip)) {
    return jsonRes({ ok: false, error: '連続送信制限：少し待ってから送ってね' }, 429, cors);
  }

  const catKey = Object.prototype.hasOwnProperty.call(FEEDBACK_CATS, body.category) ? body.category : 'idea';
  const catLabel = FEEDBACK_CATS[catKey];

  const symptoms = Array.isArray(body.symptoms)
    ? body.symptoms.map(s => cleanMdLine(s, 36)).filter(Boolean).slice(0, 6)
    : [];
  const scene = cleanMdLine(body.scene, 40);

  if (symptoms.some(s => hasNgWord(s)) || (scene && hasNgWord(scene))) {
    return jsonRes({ ok: false, error: '入力内容に使えない言葉やURLが含まれています' }, 400, cors);
  }

  const message = cleanMdBlock(body.message, 500);
  const canSkipMsg = (catKey === 'bug' || catKey === 'maker') && symptoms.length > 0;
  if (!canSkipMsg && message.length < 2) {
    return jsonRes({ ok: false, error: '内容を入力してね（2文字以上）' }, 400, cors);
  }
  if (message && hasNgWord(message)) {
    return jsonRes({ ok: false, error: '使えない言葉やURL・メールアドレスが入っています' }, 400, cors);
  }

  let nick = cleanMdLine(body.nick, 16);
  if (!nick || nick === '名無しのありんこ' || nick === '名無し') {
    nick = await makeAnonName(env, ip, body.clientId);
  } else if (hasNgWord(nick)) {
    return jsonRes({ ok: false, error: 'ニックネームに使えない言葉やURLが入っています' }, 400, cors);
  }

  const fbKey = 'fb:ip:' + ip;
  if (await rlHas(env, fbKey)) {
    return jsonRes({ ok: false, error: '連続送信制限：少し待ってから送ってね（60秒）' }, 429, cors);
  }

  const appVer = cleanMdLine(body.version, 24) || 'unknown';
  const device = cleanMdLine(body.device, 120) || 'unknown';
  const progress = cleanMdLine(body.progress, 80) || '-';

  let imageData = '';
  let imageInfo = '';
  if (body.image) {
    const rawImg = String(body.image).trim();
    if (rawImg.length > 52000) {
      return jsonRes({ ok: false, error: '画像サイズが大きすぎます（自動で圧縮されますが別の画像でお試しください）' }, 400, cors);
    }
    if (!validateImageDataUrl(rawImg)) {
      return jsonRes({ ok: false, error: '画像の形式が正しくありません（JPEG/PNG/WebPのみ）' }, 400, cors);
    }
    imageData = rawImg;
    imageInfo = cleanMdLine(body.imageInfo, 48) || Math.round(rawImg.length * 0.75 / 1024) + 'KB';
  }

  // 自動収集された診断情報（任意・個人情報なし）
  let diagSection = '';
  if (body.diag && typeof body.diag === 'object' && !Array.isArray(body.diag)) {
    const d = body.diag;
    const rows = [];
    const addRow = (k, v, max = 140) => {
      const s = cleanMdLine(v, max);
      if (s) rows.push(`- ${k}: ${s}`);
    };
    addRow('報告元の画面', d.origin, 140);
    addRow('OS / ブラウザ', d.env, 140);
    addRow('機種ヒント', d.model, 60);
    addRow('画面・表示モード', d.display, 100);
    addRow('端末性能・通信', d.hw, 100);
    addRow('描画パフォーマンス', d.perf, 100);
    addRow('直前の盤面・状態', d.stage, 220);
    addRow('サウンド・設定', d.audio, 100);
    addRow('読込済みJS / 保存領域', d.health, 120);
    addRow('直近の画面遷移', d.trail, 220);
    addRow('直近の操作ログ', d.actions, 240);
    const errs = Array.isArray(d.errors) ? d.errors.map(e => cleanMdLine(e, 180)).filter(Boolean).slice(0, 6) : [];
    rows.push(`- JSエラー記録: ${errs.length ? errs.length + '件' : 'なし'}`);
    if (rows.length) {
      diagSection =
        '\n<details>\n<summary>🔍 自動収集した診断情報（環境・盤面・FPS・エラー履歴）</summary>\n\n' +
        rows.join('\n') + '\n' +
        (errs.length ? '\n```text\n' + errs.join('\n') + '\n```\n' : '') +
        '\n</details>\n';
    }
  }

  const firstLine = message ? message.split('\n')[0].trim().slice(0, 32) : '';
  const symTag = symptoms.length ? symptoms[0].replace(/^[^\s]+\s*/, '').slice(0, 16) : catLabel.replace(/^[^\s]+\s*/, '');
  const titleBody = firstLine ? `${firstLine}${message.length > 32 ? '…' : ''}` : (scene ? scene.replace(/^[^\s]+\s*/, '') : '状況報告');
  const titlePrefix = catKey === 'bug' ? '不具合' : catKey === 'maker' ? 'つくる' : '要望';
  const title = `[${titlePrefix}][${symTag}] ${titleBody}`;

  const fbToken = env.FEEDBACK_GITHUB_TOKEN || env.GITHUB_TOKEN;
  const rawFbRepo = String(env.FEEDBACK_REPO || '').trim();
  const fbRepo = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(rawFbRepo)
    ? rawFbRepo
    : (env.FEEDBACK_GITHUB_TOKEN ? `${REPO_OWNER}/antflow-feedback` : `${REPO_OWNER}/${REPO_NAME}`);
  const extractHint = fbRepo === `${REPO_OWNER}/${REPO_NAME}`
    ? '`node scripts/extract_feedback_img.mjs <Issue番号>`'
    : `\`node scripts/extract_feedback_img.mjs <Issue番号> --repo ${fbRepo}\``;

  const issueBody =
    '### 💌 ユーザーからの要望・不具合連絡\n' +
    `- カテゴリ: ${catLabel}\n` +
    (symptoms.length ? `- 項目・症状: ${symptoms.join(' / ')}\n` : '') +
    (scene ? `- 発生場所: ${scene}\n` : '') +
    `- 投稿者: ${nick}\n` +
    `- アプリ版: ${appVer}\n` +
    `- 進行度: ${progress}\n` +
    `- 端末情報: ${device}\n` +
    (imageData ? `- スクショ添付: あり（${imageInfo}）※ ${extractHint} で画像表示可\n` : '') +
    '\n#### 内容\n' +
    (message || '（クイック選択・自動診断情報のみでの報告）') + '\n' +
    diagSection +
    (imageData ? `\n<!-- FEEDBACK_IMG:${imageData} -->\n` : '');

  const labels = ['feedback'];
  const isMakerRelated = catKey === 'maker' || !!body.isMaker || /メーカー|みんなの絵|みんなのBGM/.test(scene);
  if (isMakerRelated) labels.push('maker-feedback');
  if (catKey === 'bug' || symptoms.some(s => s.includes('不具合'))) labels.push('bug');
  const ghRes = await fetch(`https://api.github.com/repos/${fbRepo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${fbToken}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'antflow-post-worker',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, labels, body: issueBody })
  });

  if (!ghRes.ok) {
    console.error('GitHub feedback error:', ghRes.status);
    return jsonRes({ ok: false, error: '送信に失敗しました (' + ghRes.status + ')' }, 502, cors);
  }

  const created = await ghRes.json();
  await rlSet(env, fbKey, RATE_LIMIT_SEC);
  return jsonRes({ ok: true, number: created.number, author: nick, hasImage: !!imageData }, 201, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonRes({ ok: true, service: 'antflow-post-worker' }, 200, cors);
    }

    if (!env.GITHUB_TOKEN) {
      return jsonRes({ ok: false, error: 'Server not configured' }, 500, cors);
    }

    if (request.method === 'GET' && url.pathname === '/stage-stats') {
      return handleStageStatsGet(env, cors);
    }
    if (request.method === 'POST' && url.pathname === '/stage-stat') {
      return handleStageStatPost(request, env, cors);
    }
    if (request.method === 'POST' && url.pathname === '/like-talk') {
      return handleTalkLike(request, env, cors);
    }
    if (request.method === 'POST' && url.pathname === '/feedback') {
      return handleFeedback(request, env, cors);
    }

    if (request.method !== 'POST' || (url.pathname !== '/post' && url.pathname !== '/')) {
      return jsonRes({ ok: false, error: 'Not Found' }, 404, cors);
    }

    const { body, errorRes } = await parseJsonPost(request, env, cors, 32768);
    if (errorRes) return errorRes;

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (checkBurstLimit(ip)) {
      return jsonRes({ ok: false, error: '連続投稿制限：少し待ってから投稿してね' }, 429, cors);
    }

    const kind = body.kind === 'bgm' ? 'bgm' : (body.kind === 'stage' ? 'stage' : '');
    const name = cleanMdLine(body.name, 20);
    let rawAuthor = cleanMdLine(body.author, 16);
    if (!rawAuthor || rawAuthor === '名無しのありんこ' || rawAuthor === '名無し') {
      rawAuthor = await makeAnonName(env, ip, body.clientId);
    }
    const author = rawAuthor;
    const baseAuthor = cleanMdLine(body.baseAuthor, 16);
    const contentHash = /^[A-Za-z0-9_-]{6,32}$/.test(String(body.contentHash || '')) ? String(body.contentHash) : '';
    const token = String(body.token || '').trim();
    const meta = body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta) ? body.meta : {};
    const bgmName = meta.bgmName ? cleanMdLine(meta.bgmName, 20) : '';

    if (!kind) return jsonRes({ ok: false, error: '投稿の種類が正しくありません' }, 400, cors);
    if (!name) return jsonRes({ ok: false, error: '作品名を入力してね' }, 400, cors);
    if (!/^[A-Za-z0-9_-]{8,12000}$/.test(token)) {
      return jsonRes({ ok: false, error: '作品データが正しくありません' }, 400, cors);
    }
    if (hasNgWord(name) || hasNgWord(author) || (baseAuthor && hasNgWord(baseAuthor)) || (bgmName && hasNgWord(bgmName))) {
      return jsonRes({ ok: false, error: '名前・作者名に使えない言葉やURLが入っています' }, 400, cors);
    }

    const rlErr = await checkRateLimit(env, ip, token);
    if (rlErr) return jsonRes({ ok: false, error: rlErr }, 429, cors);

    const dupErr = await checkDuplicateIssue(env, kind, token, contentHash);
    if (dupErr) return jsonRes({ ok: false, error: dupErr }, 409, cors);

    let title = '';
    let issueBody = '';
    if (kind === 'stage') {
      const w = clampInt(meta.w, 8, 64, 16);
      const h = clampInt(meta.h, 8, 64, 16);
      const talkCount = clampInt(meta.talkCount, 0, 25, 0);
      const allowRemix = !!meta.allowRemix;
      const allowOfficial = !!meta.allowOfficial;
      const playUrl = SITE_URL + '?stage=' + token;
      title = `[作品投稿] ${name} (${w}x${h})`;
      issueBody =
        '### オリジナルステージ投稿\n' +
        `- ステージ名: ${name}\n` +
        `- 作者: ${author}\n` +
        (baseAuthor ? `- 元作者: ${baseAuthor}\n` : '') +
        `- サイズ: ${w}×${h}\n` +
        (bgmName ? `- BGM: ${bgmName}\n` : '') +
        (talkCount ? `- セリフ: あり（${talkCount}こ）\n` : '') +
        `- アレンジ: ${allowRemix ? 'OK' : '不可'}\n` +
        `- コンテスト・公式採用: ${allowOfficial ? 'OK' : '不可'}\n` +
        (contentHash ? `- 内容ID: ${contentHash}\n` : '') +
        `- プレイURL: ${playUrl}\n`;
    } else {
      const bpm = clampInt(meta.bpm, 70, 170, 116);
      const bars = clampInt(meta.bars, 1, 8, 2);
      const allowUse = !!meta.allowUse;
      const allowRemix = !!meta.allowRemix;
      const playUrl = SITE_URL + '?bgm=' + token;
      title = `[BGM投稿] ${name} (BPM${bpm})`;
      issueBody =
        '### オリジナルBGM投稿\n' +
        `- 曲名: ${name}\n` +
        `- 作者: ${author}\n` +
        (baseAuthor ? `- 元作者: ${baseAuthor}\n` : '') +
        `- BPM: ${bpm} / ${bars}小節\n` +
        `- ステージ利用: ${allowUse ? 'OK' : '不可'}\n` +
        `- アレンジ: ${allowRemix ? 'OK' : '不可'}\n` +
        (contentHash ? `- 内容ID: ${contentHash}\n` : '') +
        `- 試聴・プレイURL: ${playUrl}\n`;
    }

    const ghRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'antflow-post-worker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body: issueBody })
    });

    if (!ghRes.ok) {
      console.error('GitHub post error:', ghRes.status);
      return jsonRes({ ok: false, error: 'GitHub投稿に失敗しました (' + ghRes.status + ')' }, 502, cors);
    }

    const created = await ghRes.json();
    await recordRateLimit(env, ip, token);

    return jsonRes({ ok: true, number: created.number, url: created.html_url, author }, 201, cors);
  }
};
