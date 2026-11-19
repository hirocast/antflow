// File: worker/index.js
// Cloudflare Workers: アントフロー 無登録1タップ投稿中継API

const REPO_OWNER = 'hirocast';
const REPO_NAME = 'antflow';
const RATE_LIMIT_SEC = 60;

const NG_WORDS = [
  '死ね', 'しね', '殺す', 'ころす', 'バカ', 'ばか', 'アホ', 'あほ', 'クズ', 'くず',
  'キモ', 'きも', 'うざ', 'ウザ', 'ちん', 'まん', 'せっくす', 'セックス', 'エロ', 'えろ',
  'アダルト', '暴力', '薬物', '大麻', 'fuck', 'shit', 'bitch', 'porn', 'sex', 'nude'
];

function hasNgWord(str) {
  const s = String(str || '');
  if (/https?:\/\/|www\.|\.[a-z]{2,4}(\/|$)|@/i.test(s)) return true;
  const norm = s.toLowerCase().replace(/[\s\u3000\u200B-\u200D\uFEFF]/g, '');
  return NG_WORDS.some(w => norm.includes(w));
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || 'https://hirocast.github.io,http://localhost,http://127.0.0.1')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  let allowOrigin = allowed[0] || '*';
  if (allowed.includes('*')) {
    allowOrigin = '*';
  } else if (origin && allowed.some(a => origin === a || origin.startsWith(a + ':'))) {
    allowOrigin = origin;
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonRes(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });
}

async function checkRateLimit(ip, token) {
  const cache = caches.default;
  const ipKey = new Request('https://antflow-rl.internal/ip/' + encodeURIComponent(ip || 'unknown'));
  const hitIp = await cache.match(ipKey);
  if (hitIp) return '連続投稿制限：少し待ってから投稿してね';

  const tokKey = new Request('https://antflow-rl.internal/tok/' + encodeURIComponent(token.slice(0, 64)));
  const hitTok = await cache.match(tokKey);
  if (hitTok) return '同じ作品は連続で投稿できません';

  return '';
}

async function recordRateLimit(ip, token) {
  const cache = caches.default;
  const ipKey = new Request('https://antflow-rl.internal/ip/' + encodeURIComponent(ip || 'unknown'));
  await cache.put(ipKey, new Response('1', {
    headers: { 'Cache-Control': 'public, max-age=' + RATE_LIMIT_SEC }
  }));
  const tokKey = new Request('https://antflow-rl.internal/tok/' + encodeURIComponent(token.slice(0, 64)));
  await cache.put(tokKey, new Response('1', {
    headers: { 'Cache-Control': 'public, max-age=600' }
  }));
}

const ANON_ADJ = ['Sweet','Star','Sunny','Happy','Fluffy','Cozy','Mint','Choco','Berry','Peach','Lemon','Apple','Melon','Honey','Milk','Sugar','Moon','Sky','Cloud','Rain','Snow','Sakura','Mochi','Magic','Lucky','Cute','Tiny','Bouncy','Dreamy','Spark','Ruby','Pearl'];
const ANON_NOUN = ['Ant','Cat','Bear','Fox','Bunny','Panda','Koala','Frog','Duck','Owl','Seal','Puppy','Kitty','Candy','Donut','Cake','Cookie','Tart','Waffle','Puff','Macaron','Mochi','Berry','Melon','Cloud','Star','Heart','Ribbon','Bell','Leaf','Drop','Pony'];
async function makeAnonName(ip, clientAnon) {
  const ca = String(clientAnon || '').trim().slice(0, 16);
  if (/^[A-Za-z]{4,13}#\d{2}$/.test(ca) && !hasNgWord(ca)) return ca;
  const data = new TextEncoder().encode('antflow-anon:' + String(ip || 'unknown'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  const arr = new Uint8Array(digest);
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
  let body;
  try { body = await request.json(); } catch { return jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors); }
  const talk = String(body.talk || '').trim().replace(/[\r\n|<>`]/g, '').slice(0, 60);
  const delta = body.delta === -1 ? -1 : 1;
  if (!talk || hasNgWord(talk)) return jsonRes({ ok: false, error: 'Invalid talk' }, 400, cors);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const cache = caches.default;
  const lkKey = new Request('https://antflow-rl.internal/like/' + encodeURIComponent(ip + ':' + talk));
  if (delta === 1) {
    if (await cache.match(lkKey)) {
      return jsonRes({ ok: true, skipped: true }, 200, cors);
    }
    await cache.put(lkKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=86400' } }));
  } else {
    const ulKey = new Request('https://antflow-rl.internal/unlike/' + encodeURIComponent(ip + ':' + talk));
    if (await cache.match(ulKey)) {
      return jsonRes({ ok: true, skipped: true }, 200, cors);
    }
    await cache.delete(lkKey);
    await cache.put(ulKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=10' } }));
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

  let counts = {};
  if (iss && iss.body) {
    const m = iss.body.match(/<!--\s*LIKES_JSON:([\s\S]*?)-->/);
    if (m) {
      try { counts = JSON.parse(m[1]) || {}; } catch {}
    }
  }
  const next = Math.max(0, (Number(counts[talk]) || 0) + delta);
  if (next > 0) counts[talk] = next;
  else delete counts[talk];

  const sorted = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 200);
  const compact = Object.fromEntries(sorted);

  let md = '### 💬 人気のセリフ ランキング（自動集計）\n';
  md += '<!-- LIKES_JSON:' + JSON.stringify(compact) + ' -->\n\n';
  md += '| 順位 | いいね | セリフ |\n| --- | ---: | --- |\n';
  sorted.forEach(([t, c], i) => { md += `| ${i + 1} | ${c} | ${t} |\n`; });

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
  if (!listRes.ok) return { ok: false, iss: null, stats: {} };
  const existing = await listRes.json();
  const iss = Array.isArray(existing) && existing[0] ? existing[0] : null;
  let stats = {};
  if (iss && iss.body) {
    const m = iss.body.match(/<!--\s*STAGE_STATS_JSON:([\s\S]*?)-->/);
    if (m) {
      try { stats = JSON.parse(m[1]) || {}; } catch {}
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
  let body;
  try { body = await request.json(); } catch { return jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors); }
  const hash = String(body.hash || '').trim();
  const event = String(body.event || '').trim();
  const clientId = String(body.clientId || '').trim().slice(0, 32);
  const sec = Number(body.sec);
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(hash)) return jsonRes({ ok: false, error: 'Invalid hash' }, 400, cors);
  if (!['play', 'clear', 'like', 'unlike', 'up', 'down'].includes(event)) return jsonRes({ ok: false, error: 'Invalid event' }, 400, cors);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const actor = clientId || ip;
  const cache = caches.default;

  if (event === 'play') {
    const cdKey = new Request('https://antflow-rl.internal/st-play-cd/' + encodeURIComponent(actor + ':' + hash));
    if (await cache.match(cdKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await cache.put(cdKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=5' } }));
  } else if (event === 'clear') {
    const cdKey = new Request('https://antflow-rl.internal/st-clr-cd/' + encodeURIComponent(actor + ':' + hash));
    if (await cache.match(cdKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await cache.put(cdKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=5' } }));
  } else if (event === 'like') {
    const lkKey = new Request('https://antflow-rl.internal/st-like/' + encodeURIComponent(actor + ':' + hash));
    if (await cache.match(lkKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await cache.put(lkKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=2592000' } }));
  } else if (event === 'unlike') {
    const lkKey = new Request('https://antflow-rl.internal/st-like/' + encodeURIComponent(actor + ':' + hash));
    await cache.delete(lkKey);
  } else if (event === 'up' || event === 'down') {
    const vKey = new Request('https://antflow-rl.internal/st-vote/' + encodeURIComponent(actor + ':' + hash));
    if (await cache.match(vKey)) return jsonRes({ ok: true, skipped: true }, 200, cors);
    await cache.put(vKey, new Response(event, { headers: { 'Cache-Control': 'public, max-age=2592000' } }));
  }

  let isUniquePlay = false;
  if (event === 'play') {
    const uKey = new Request('https://antflow-rl.internal/st-uniq/' + encodeURIComponent(actor + ':' + hash));
    if (!(await cache.match(uKey))) {
      isUniquePlay = true;
      await cache.put(uKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=2592000' } }));
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

  const cur = Object.assign({ u: 0, p: 0, c: 0, ts: 0, bt: 0, lk: 0, up: 0, dn: 0 }, stats[hash] || {});
  if (event === 'play') {
    cur.p = (Number(cur.p) || 0) + 1;
    if (isUniquePlay) cur.u = (Number(cur.u) || 0) + 1;
  } else if (event === 'clear') {
    cur.c = (Number(cur.c) || 0) + 1;
    if (Number.isFinite(sec) && sec >= 0.1 && sec <= 36000) {
      const s1 = Math.round(sec * 10) / 10;
      cur.ts = Math.round(((Number(cur.ts) || 0) + s1) * 10) / 10;
      cur.bt = (Number(cur.bt) || 0) > 0 ? Math.round(Math.min(cur.bt, s1) * 10) / 10 : s1;
    }
  } else if (event === 'like') {
    cur.lk = (Number(cur.lk) || 0) + 1;
  } else if (event === 'unlike') {
    cur.lk = Math.max(0, (Number(cur.lk) || 0) - 1);
  } else if (event === 'up') {
    cur.up = (Number(cur.up) || 0) + 1;
  } else if (event === 'down') {
    cur.dn = (Number(cur.dn) || 0) + 1;
  }
  stats[hash] = cur;

  const entries = Object.entries(stats).sort((a, b) => (b[1].p || 0) - (a[1].p || 0)).slice(0, 300);
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
      return jsonRes({ ok: false, error: 'Server not configured (missing GITHUB_TOKEN)' }, 500, cors);
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

    if (request.method !== 'POST' || (url.pathname !== '/post' && url.pathname !== '/')) {
      return jsonRes({ ok: false, error: 'Not Found' }, 404, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const kind = body.kind === 'bgm' ? 'bgm' : (body.kind === 'stage' ? 'stage' : '');
    const name = String(body.name || '').trim().slice(0, 20);
    let rawAuthor = String(body.author || '').trim().slice(0, 16);
    if (!rawAuthor || rawAuthor === '名無しのありんこ' || rawAuthor === '名無し') {
      rawAuthor = await makeAnonName(ip, body.clientId);
    }
    const author = rawAuthor;
    const baseAuthor = String(body.baseAuthor || '').trim().slice(0, 16);
    const contentHash = /^[A-Za-z0-9_-]{6,32}$/.test(String(body.contentHash || '')) ? String(body.contentHash) : '';
    const token = String(body.token || '').trim();
    const siteUrl = String(body.siteUrl || 'https://hirocast.github.io/antflow/').split('?')[0];
    const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};

    if (!kind) return jsonRes({ ok: false, error: '投稿の種類が正しくありません' }, 400, cors);
    if (!name) return jsonRes({ ok: false, error: '作品名を入力してね' }, 400, cors);
    if (!/^[A-Za-z0-9_-]{8,12000}$/.test(token)) {
      return jsonRes({ ok: false, error: '作品データが正しくありません' }, 400, cors);
    }
    if (hasNgWord(name) || hasNgWord(author) || (baseAuthor && hasNgWord(baseAuthor))) {
      return jsonRes({ ok: false, error: '名前・作者名に使えない言葉やURLが入っています' }, 400, cors);
    }

    const rlErr = await checkRateLimit(ip, token);
    if (rlErr) return jsonRes({ ok: false, error: rlErr }, 429, cors);

    const dupErr = await checkDuplicateIssue(env, kind, token, contentHash);
    if (dupErr) return jsonRes({ ok: false, error: dupErr }, 409, cors);

    let title = '';
    let issueBody = '';
    if (kind === 'stage') {
      const w = Number(meta.w) || 16;
      const h = Number(meta.h) || 16;
      const talkCount = Number(meta.talkCount) || 0;
      const bgmName = meta.bgmName ? String(meta.bgmName).slice(0, 20) : '';
      const allowRemix = !!meta.allowRemix;
      const allowOfficial = !!meta.allowOfficial;
      const playUrl = siteUrl + '?stage=' + token;
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
      const bpm = Number(meta.bpm) || 116;
      const bars = Number(meta.bars) || 2;
      const allowUse = !!meta.allowUse;
      const allowRemix = !!meta.allowRemix;
      const playUrl = siteUrl + '?bgm=' + token;
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
      const errText = await ghRes.text();
      return jsonRes({ ok: false, error: 'GitHub投稿に失敗しました (' + ghRes.status + ')', detail: errText.slice(0, 200) }, 502, cors);
    }

    const created = await ghRes.json();
    await recordRateLimit(ip, token);

    return jsonRes({ ok: true, number: created.number, url: created.html_url, author }, 201, cors);
  }
};
