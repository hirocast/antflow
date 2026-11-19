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

    if (request.method !== 'POST' || (url.pathname !== '/post' && url.pathname !== '/')) {
      return jsonRes({ ok: false, error: 'Not Found' }, 404, cors);
    }

    if (!env.GITHUB_TOKEN) {
      return jsonRes({ ok: false, error: 'Server not configured (missing GITHUB_TOKEN)' }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonRes({ ok: false, error: 'Invalid JSON' }, 400, cors);
    }

    const kind = body.kind === 'bgm' ? 'bgm' : (body.kind === 'stage' ? 'stage' : '');
    const name = String(body.name || '').trim().slice(0, 20);
    const author = String(body.author || '').trim().slice(0, 16) || '名無しのありんこ';
    const token = String(body.token || '').trim();
    const siteUrl = String(body.siteUrl || 'https://hirocast.github.io/antflow/').split('?')[0];
    const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};

    if (!kind) return jsonRes({ ok: false, error: '投稿の種類が正しくありません' }, 400, cors);
    if (!name) return jsonRes({ ok: false, error: '作品名を入力してね' }, 400, cors);
    if (!/^[A-Za-z0-9_-]{8,12000}$/.test(token)) {
      return jsonRes({ ok: false, error: '作品データが正しくありません' }, 400, cors);
    }
    if (hasNgWord(name) || hasNgWord(author)) {
      return jsonRes({ ok: false, error: '名前・作者名に使えない言葉やURLが入っています' }, 400, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rlErr = await checkRateLimit(ip, token);
    if (rlErr) return jsonRes({ ok: false, error: rlErr }, 429, cors);

    let title = '';
    let issueBody = '';
    if (kind === 'stage') {
      const w = Number(meta.w) || 16;
      const h = Number(meta.h) || 16;
      const talkCount = Number(meta.talkCount) || 0;
      const bgmName = meta.bgmName ? String(meta.bgmName).slice(0, 20) : '';
      const allowRemix = !!meta.allowRemix;
      const playUrl = siteUrl + '?stage=' + token;
      title = `[作品投稿] ${name} (${w}x${h})`;
      issueBody =
        '### オリジナルステージ投稿\n' +
        `- ステージ名: ${name}\n` +
        `- 作者: ${author}\n` +
        `- サイズ: ${w}×${h}\n` +
        (bgmName ? `- BGM: ${bgmName}\n` : '') +
        (talkCount ? `- セリフ: あり（${talkCount}こ）\n` : '') +
        `- アレンジ: ${allowRemix ? 'OK' : '不可'}\n` +
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
        `- BPM: ${bpm} / ${bars}小節\n` +
        `- ステージ利用: ${allowUse ? 'OK' : '不可'}\n` +
        `- アレンジ: ${allowRemix ? 'OK' : '不可'}\n` +
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

    return jsonRes({ ok: true, number: created.number, url: created.html_url }, 201, cors);
  }
};
