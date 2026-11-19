// File: maker.js
'use strict';

/* ================= オリジナルステージ作成＆URLシェア＆投稿 ================= */
(function () {
  const MY_KEY = 'antflow-my-stages-v1';
  const POST_CD_KEY = 'antflow-post-cd-v1';
  const REPORT_KEY = 'antflow-reported-v1';
  const NICK_KEY = 'antflow-nick-v1';
  const POST_API_URL = 'https://antflow.hiroshi-artcast.workers.dev/post';
  function getPostApiUrl() { return (window.AF_POST_API || POST_API_URL || '').trim(); }
  const POST_COOLDOWN_MS = 60 * 1000; // 連続投稿制限（60秒）
  const REPO_URL = 'https://github.com/hirocast/antflow';
  const ISSUES_API = 'https://api.github.com/repos/hirocast/antflow/issues?state=open&per_page=30';

  const NG_WORDS = [
    '死ね', 'しね', '殺す', 'ころす', 'バカ', 'ばか', 'アホ', 'あほ', 'クズ', 'くず',
    'キモ', 'きも', 'うざ', 'ウザ', 'ちん', 'まん', 'せっくす', 'セックス', 'エロ', 'えろ',
    'アダルト', '暴力', '薬物', '大麻', 'fuck', 'shit', 'bitch', 'porn', 'sex', 'nude'
  ];
  function validateStageName(name) {
    const s = String(name || '');
    if (/https?:\/\/|www\.|\.[a-z]{2,4}(\/|$)|@/i.test(s)) return 'ステージ名にURLや@は使えません';
    const norm = s.toLowerCase().replace(/[\s\u3000\u200B-\u200D\uFEFF]/g, '');
    for (let i = 0; i < NG_WORDS.length; i++) {
      if (norm.indexOf(NG_WORDS[i]) >= 0) return 'ステージ名に使えない言葉が入っています';
    }
    return '';
  }
  function checkPostLimit(token) {
    try {
      const d = JSON.parse(localStorage.getItem(POST_CD_KEY) || '{}');
      const left = Math.ceil(((d.at || 0) + POST_COOLDOWN_MS - Date.now()) / 1000);
      if (left > 0) return '連続投稿制限：あと ' + left + ' 秒まってね';
      if (d.token && d.token === token) return '同じステージは連続で投稿できません';
    } catch (e) {}
    return '';
  }
  function recordPost(token) {
    try { localStorage.setItem(POST_CD_KEY, JSON.stringify({ at: Date.now(), token })); } catch (e) {}
  }
  function loadReported() {
    try { return new Set(JSON.parse(localStorage.getItem(REPORT_KEY) || '[]')); } catch (e) { return new Set(); }
  }
  function addReported(key) {
    const set = loadReported();
    set.add(String(key));
    try { localStorage.setItem(REPORT_KEY, JSON.stringify([...set].slice(-100))); } catch (e) {}
  }

  let mkW = 16, mkH = 16;
  let mkGrid = new Int8Array(mkW * mkH).fill(-1);
  const mkHistory = [];
  let mkCol = 0, mkMirror = false, mkMirrorV = false, mkPanMode = false, mkSelMode = false, mkDrawing = false, mkBuilt = false;
  let mkBgmToken = '', mkAllowRemix = false;
  function makeStageArrangeName(name) {
    const base = String(name || 'オリジナル').trim() || 'オリジナル';
    if (base.endsWith('アレンジ')) return base.slice(0, 14);
    if (base.length + 4 <= 14) return base + 'アレンジ';
    return (base.slice(0, 12) + '改').slice(0, 14);
  }
  let mkZoom = 1, mkPanX = 0, mkPanY = 0;
  const mkPtrs = new Map();
  let mkPinch = null, mkLastPan = null, mkSel = null, mkSelDrag = null;
  function commitSel() {
    if (!mkSel) return;
    if (mkSel.buf) {
      for (let dy = 0; dy < mkSel.h; dy++) for (let dx = 0; dx < mkSel.w; dx++) {
        const v = mkSel.buf[dy * mkSel.w + dx];
        if (v < 0) continue;
        const tx = mkSel.x + dx, ty = mkSel.y + dy;
        if (tx >= 0 && tx < mkW && ty >= 0 && ty < mkH) mkGrid[ty * mkW + tx] = v;
      }
    }
    mkSel = null;
  }

  function refreshUndoBtn() {
    const b = $('#mkUndo');
    if (b) b.disabled = !mkHistory.length;
  }
  function pushMkUndo() {
    mkHistory.push({ w: mkW, h: mkH, grid: mkGrid.slice() });
    if (mkHistory.length > 40) mkHistory.shift();
    refreshUndoBtn();
  }

  /* ---- URL エンコード / デコード（サーバー不要） ---- */
  function toB64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64Url(str) {
    let s = String(str || '').trim().replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function deflateRawBytes(bytes) {
    const cs = new CompressionStream('deflate-raw');
    const w = cs.writable.getWriter();
    w.write(bytes);
    w.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer());
  }
  async function inflateRawBytes(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const w = ds.writable.getWriter();
    w.write(bytes);
    w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }
  function parseTalkField(str) {
    return String(str || '').split(/[/／\n]+/).map(s => s.trim().slice(0, 28)).filter(Boolean).slice(0, 5);
  }
  function normalizeCustomTalk(t) {
    if (!t || typeof t !== 'object') return null;
    const out = { hi: [], p: [], c: [], j: [], q: [] };
    let cnt = 0;
    for (const k of ['hi', 'p', 'c', 'j', 'q']) {
      if (Array.isArray(t[k])) {
        out[k] = t[k].map(s => String(s || '').trim().slice(0, 28)).filter(Boolean).slice(0, 5);
        cnt += out[k].length;
      }
    }
    return cnt > 0 ? out : null;
  }
  function compactTalkObj(t) {
    const n = normalizeCustomTalk(t);
    if (!n) return null;
    const o = {};
    for (const k of ['hi', 'p', 'c', 'j', 'q']) if (n[k].length) o[k] = n[k];
    return Object.keys(o).length ? o : null;
  }
  function countTalkLines(t) {
    const n = normalizeCustomTalk(t);
    return n ? n.hi.length + n.p.length + n.c.length + n.j.length + n.q.length : 0;
  }
  function encodeStageMeta(talk, bgmToken, allowRemix) {
    const o = {};
    const ct = compactTalkObj(talk);
    if (ct) o.t = ct;
    if (bgmToken && typeof bgmToken === 'string') o.b = bgmToken;
    if (allowRemix) o.r = 1;
    return Object.keys(o).length ? o : null;
  }
  function decodeStageMeta(obj) {
    if (!obj || typeof obj !== 'object') return { talk: null, bgmToken: '', allowRemix: false };
    if (obj.hi || obj.p || obj.c || obj.j || obj.q) {
      return { talk: normalizeCustomTalk(obj), bgmToken: '', allowRemix: false };
    }
    const talk = normalizeCustomTalk(obj.t);
    const bgmToken = (typeof obj.b === 'string' && /^[A-Za-z0-9_-]+$/.test(obj.b)) ? obj.b : '';
    const allowRemix = !!obj.r;
    return { talk, bgmToken, allowRemix };
  }
  function encodeCustomStageV1(name, grid, w, h, talk, bgmToken, allowRemix) {
    const W = w || mkW, H = h || mkH;
    const nb = new TextEncoder().encode((name || 'オリジナル').slice(0, 20));
    const meta = encodeStageMeta(talk, bgmToken, allowRemix);
    const tb = meta ? new TextEncoder().encode(JSON.stringify(meta)) : new Uint8Array(0);
    const runs = [];
    let i = 0;
    while (i < grid.length) {
      const v = grid[i];
      let cnt = 1;
      while (i + cnt < grid.length && grid[i + cnt] === v && cnt < 255) cnt++;
      runs.push(v + 1, cnt);
      i += cnt;
    }
    if (tb.length > 0 && tb.length <= 65535) {
      const bytes = new Uint8Array(6 + nb.length + tb.length + runs.length);
      bytes[0] = 4; // version 4 (RLE + meta)
      bytes[1] = W;
      bytes[2] = H;
      bytes[3] = nb.length;
      bytes.set(nb, 4);
      bytes[4 + nb.length] = tb.length & 255;
      bytes[5 + nb.length] = (tb.length >> 8) & 255;
      bytes.set(tb, 6 + nb.length);
      bytes.set(runs, 6 + nb.length + tb.length);
      return toB64Url(bytes);
    }
    const bytes = new Uint8Array(4 + nb.length + runs.length);
    bytes[0] = 1; // version
    bytes[1] = W;
    bytes[2] = H;
    bytes[3] = nb.length;
    bytes.set(nb, 4);
    bytes.set(runs, 4 + nb.length);
    return toB64Url(bytes);
  }
  async function encodeCustomStage(name, grid, w, h, talk, bgmToken, allowRemix) {
    const v1 = encodeCustomStageV1(name, grid, w, h, talk, bgmToken, allowRemix);
    if (typeof CompressionStream !== 'function') return v1;
    try {
      const W = w || mkW, H = h || mkH;
      const nb = new TextEncoder().encode((name || 'オリジナル').slice(0, 20));
      const meta = encodeStageMeta(talk, bgmToken, allowRemix);
      const tb = meta ? new TextEncoder().encode(JSON.stringify(meta)) : new Uint8Array(0);
      if (tb.length > 0 && tb.length <= 65535) {
        const raw = new Uint8Array(5 + nb.length + tb.length + grid.length);
        raw[0] = W;
        raw[1] = H;
        raw[2] = nb.length;
        raw.set(nb, 3);
        raw[3 + nb.length] = tb.length & 255;
        raw[4 + nb.length] = (tb.length >> 8) & 255;
        raw.set(tb, 5 + nb.length);
        const off = 5 + nb.length + tb.length;
        for (let i = 0; i < grid.length; i++) raw[off + i] = grid[i] + 1;
        const comp = await deflateRawBytes(raw);
        const out = new Uint8Array(1 + comp.length);
        out[0] = 3;
        out.set(comp, 1);
        const v3 = toB64Url(out);
        return v3.length < v1.length ? v3 : v1;
      }
      const raw = new Uint8Array(3 + nb.length + grid.length);
      raw[0] = W;
      raw[1] = H;
      raw[2] = nb.length;
      raw.set(nb, 3);
      for (let i = 0; i < grid.length; i++) raw[3 + nb.length + i] = grid[i] + 1;
      const comp = await deflateRawBytes(raw);
      const out = new Uint8Array(1 + comp.length);
      out[0] = 2;
      out.set(comp, 1);
      const v2 = toB64Url(out);
      return v2.length < v1.length ? v2 : v1;
    } catch (e) {
      return v1;
    }
  }
  async function decodeCustomStage(token) {
    try {
      const bytes = fromB64Url(token);
      if (bytes.length < 6) return null;
      const ver = bytes[0];
      if (ver === 1) {
        const W = bytes[1], H = bytes[2], nLen = bytes[3];
        if (W < 8 || W > 32 || H < 8 || H > 32 || 4 + nLen >= bytes.length) return null;
        const name = new TextDecoder().decode(bytes.slice(4, 4 + nLen)) || 'オリジナル';
        const grid = new Int8Array(W * H).fill(-1);
        let idx = 0, p = 4 + nLen;
        for (; p + 1 < bytes.length && idx < grid.length; p += 2) {
          const val = bytes[p] - 1, cnt = bytes[p + 1];
          if (val < -1 || val >= HEX.length || cnt < 1) return null;
          for (let k = 0; k < cnt && idx < grid.length; k++) grid[idx++] = val;
        }
        // 途中で切れたトークンを弾くため、全マス分が復元されたことを厳密に検証
        if (idx !== grid.length || p !== bytes.length) return null;
        let total = 0;
        for (let k = 0; k < grid.length; k++) if (grid[k] >= 0) total++;
        if (total < 4) return null;
        return { W, H, grid, name, theme: 'オリジナル', talk: null, bgmToken: '', bgm: null, allowRemix: false, token };
      }
      if (ver === 4) {
        const W = bytes[1], H = bytes[2], nLen = bytes[3];
        if (W < 8 || W > 32 || H < 8 || H > 32 || 6 + nLen >= bytes.length) return null;
        const name = new TextDecoder().decode(bytes.slice(4, 4 + nLen)) || 'オリジナル';
        const tLen = bytes[4 + nLen] | (bytes[5 + nLen] << 8);
        const tStart = 6 + nLen, tEnd = tStart + tLen;
        if (tEnd >= bytes.length) return null;
        let meta = { talk: null, bgmToken: '', allowRemix: false };
        if (tLen > 0) {
          try { meta = decodeStageMeta(JSON.parse(new TextDecoder().decode(bytes.slice(tStart, tEnd)))); } catch (e) { return null; }
        }
        const grid = new Int8Array(W * H).fill(-1);
        let idx = 0, p = tEnd;
        for (; p + 1 < bytes.length && idx < grid.length; p += 2) {
          const val = bytes[p] - 1, cnt = bytes[p + 1];
          if (val < -1 || val >= HEX.length || cnt < 1) return null;
          for (let k = 0; k < cnt && idx < grid.length; k++) grid[idx++] = val;
        }
        if (idx !== grid.length || p !== bytes.length) return null;
        let total = 0;
        for (let k = 0; k < grid.length; k++) if (grid[k] >= 0) total++;
        if (total < 4) return null;
        const bgm = (meta.bgmToken && window.AF_bgmTools) ? window.AF_bgmTools.decodeBgm(meta.bgmToken) : null;
        return { W, H, grid, name, theme: 'オリジナル', talk: meta.talk, bgmToken: meta.bgmToken, bgm, allowRemix: meta.allowRemix, token };
      }
      if (ver === 2) {
        if (typeof DecompressionStream !== 'function') return null;
        const raw = await inflateRawBytes(bytes.slice(1));
        if (raw.length < 4) return null;
        const W = raw[0], H = raw[1], nLen = raw[2];
        if (W < 8 || W > 32 || H < 8 || H > 32 || raw.length !== 3 + nLen + W * H) return null;
        const name = new TextDecoder().decode(raw.slice(3, 3 + nLen)) || 'オリジナル';
        const grid = new Int8Array(W * H);
        let total = 0;
        const off = 3 + nLen;
        for (let i = 0; i < grid.length; i++) {
          const val = raw[off + i] - 1;
          if (val < -1 || val >= HEX.length) return null;
          grid[i] = val;
          if (val >= 0) total++;
        }
        if (total < 4) return null;
        return { W, H, grid, name, theme: 'オリジナル', talk: null, bgmToken: '', bgm: null, allowRemix: false, token };
      }
      if (ver === 3) {
        if (typeof DecompressionStream !== 'function') return null;
        const raw = await inflateRawBytes(bytes.slice(1));
        if (raw.length < 6) return null;
        const W = raw[0], H = raw[1], nLen = raw[2];
        if (W < 8 || W > 32 || H < 8 || H > 32 || 5 + nLen >= raw.length) return null;
        const name = new TextDecoder().decode(raw.slice(3, 3 + nLen)) || 'オリジナル';
        const tLen = raw[3 + nLen] | (raw[4 + nLen] << 8);
        const tStart = 5 + nLen, off = tStart + tLen;
        if (raw.length !== off + W * H) return null;
        let meta = { talk: null, bgmToken: '', allowRemix: false };
        if (tLen > 0) {
          try { meta = decodeStageMeta(JSON.parse(new TextDecoder().decode(raw.slice(tStart, off)))); } catch (e) { return null; }
        }
        const grid = new Int8Array(W * H);
        let total = 0;
        for (let i = 0; i < grid.length; i++) {
          const val = raw[off + i] - 1;
          if (val < -1 || val >= HEX.length) return null;
          grid[i] = val;
          if (val >= 0) total++;
        }
        if (total < 4) return null;
        const bgm = (meta.bgmToken && window.AF_bgmTools) ? window.AF_bgmTools.decodeBgm(meta.bgmToken) : null;
        return { W, H, grid, name, theme: 'オリジナル', talk: meta.talk, bgmToken: meta.bgmToken, bgm, allowRemix: meta.allowRemix, token };
      }
      return null;
    } catch (e) { return null; }
  }
  async function stageShareUrl(name, grid, w, h, preToken, talk, bgmToken, allowRemix) {
    const token = preToken || await encodeCustomStage(name, grid, w, h, talk, bgmToken, allowRemix);
    return location.origin + location.pathname + '?stage=' + token;
  }
  function extractStageToken(input) {
    const s = String(input || '').trim();
    const m = s.match(/[?&]stage=([A-Za-z0-9_-]+)/);
    if (m) return m[1];
    const compact = s.replace(/\s+/g, '');
    if (/^[A-Za-z0-9_-]{8,}$/.test(compact)) return compact;
    return '';
  }

  /* ---- パズル生成してプレイ開始 ---- */
  function loadCustomLevel(art) {
    let total = 0;
    for (const v of art.grid) if (v >= 0) total++;
    if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
    const baseUrl = location.origin + location.pathname + '?stage=';
    const talk = normalizeCustomTalk(art.talk);
    const bgmToken = art.bgmToken || '';
    const customBgm = art.bgm || (bgmToken && window.AF_bgmTools ? window.AF_bgmTools.decodeBgm(bgmToken) : null);
    const shareUrl = baseUrl + (art.token || encodeCustomStageV1(art.name, art.grid, art.W, art.H, talk, bgmToken, art.allowRemix));
    const P = params(5, total);
    const rng = mulberry32(hashInt(total, art.name.length + 77));
    const c = construct(art, P, rng);
    const L = {
      id: 0, custom: true, art, shareUrl,
      name: art.name || 'オリジナル', theme: 'オリジナル',
      customTalk: talk, customBgm,
      W: art.W, H: art.H, grid: art.grid, cols: c.cols, solution: c.solution, total,
      metrics: { stars: 2 }
    };
    if (!art.token) {
      stageShareUrl(art.name, art.grid, art.W, art.H, null, talk, bgmToken, art.allowRemix).then(u => {
        L.shareUrl = u;
        if (G.lastShare && G.lastShare.custom) G.lastShare.url = u;
      });
    }
    G.customArt = art;
    G.loading = false; G.rewindTok++; G.clearShown = true; G.pendingWin = false; G.pendingJam = false;
    hideOv();
    applyLevel(0, L);
  }
  window.AF_loadCustomLevel = loadCustomLevel;

  /* ---- 広さ変更・ズーム管理 ---- */
  function setMakerSize(newSize) {
    if (newSize === mkW && newSize === mkH) return;
    pushMkUndo();
    const oldW = mkW, oldH = mkH, oldG = mkGrid;
    mkW = newSize; mkH = newSize;
    mkGrid = new Int8Array(mkW * mkH).fill(-1);
    const ox = Math.floor((mkW - oldW) / 2), oy = Math.floor((mkH - oldH) / 2);
    for (let y = 0; y < oldH; y++) for (let x = 0; x < oldW; x++) {
      const nx = x + ox, ny = y + oy;
      if (nx >= 0 && nx < mkW && ny >= 0 && ny < mkH) mkGrid[ny * mkW + nx] = oldG[y * oldW + x];
    }
    resetZoom();
    refreshSizeBtns();
    drawMaker();
  }
  function clampPan() {
    const cv = $('#mkCv');
    const S = Math.round((cv && cv.clientWidth) || 272);
    const minP = S - S * mkZoom;
    mkPanX = clamp(mkPanX, minP, 0);
    mkPanY = clamp(mkPanY, minP, 0);
  }
  function setZoom(z, anchorX, anchorY) {
    const cv = $('#mkCv');
    const S = Math.round((cv && cv.clientWidth) || 272);
    const nz = clamp(z, 1, 4);
    if (nz === mkZoom) return;
    const ax = anchorX == null ? S / 2 : anchorX;
    const ay = anchorY == null ? S / 2 : anchorY;
    const gx = (ax - mkPanX) / mkZoom;
    const gy = (ay - mkPanY) / mkZoom;
    mkZoom = nz;
    mkPanX = ax - gx * mkZoom;
    mkPanY = ay - gy * mkZoom;
    if (mkZoom <= 1.01) { mkZoom = 1; mkPanX = 0; mkPanY = 0; mkPanMode = false; }
    clampPan();
    refreshZoomUI();
    drawMaker();
  }
  function resetZoom() {
    mkZoom = 1; mkPanX = 0; mkPanY = 0; mkPanMode = false;
    refreshZoomUI();
  }
  function refreshZoomUI() {
    const zl = $('#mkZoomLbl'), pm = $('#mkPanBtn');
    if (zl) zl.textContent = mkZoom.toFixed(mkZoom % 1 ? 1 : 0) + 'x';
    if (pm) { pm.disabled = mkZoom <= 1; pm.classList.toggle('on', mkPanMode && mkZoom > 1); }
  }
  function refreshSizeBtns() {
    document.querySelectorAll('.mksz').forEach(b => {
      b.classList.toggle('on', Number(b.dataset.sz) === mkW);
    });
  }

  /* ---- おてほんテンプレート ---- */
  const TEMPLATES = {
    heart: {
      name: 'ハートのキャンディ',
      rows: [
        '................',
        '................',
        '...RRR....RRR...',
        '..RRRRR..RRRRR..',
        '.RRRRRRRRRRRRRR.',
        '.RRWRRRRRRRRRRR.',
        '.RRWRRRRRRRRRRR.',
        '.RRRRRRRRRRRRRR.',
        '..RRRRRRRRRRRR..',
        '...RRRRRRRRRR...',
        '....RRRRRRRR....',
        '.....RRRRRR.....',
        '......RRRR......',
        '.......RR.......',
        '................',
        '................'
      ]
    },
    cat: {
      name: 'ピンクのねこ',
      rows: [
        '................',
        '..KK........KK..',
        '..KPK......KPK..',
        '..KKKK....KKKK..',
        '..KKKKKKKKKKKK..',
        '.KKKKKKKKKKKKKK.',
        '.KKKDKKKKKKDKKK.',
        '.KKKDKKKKKKDKKK.',
        '.KKWKKKKKKKKWKK.',
        '.KKKKKKRRKKKKKK.',
        '..KKKKKKKKKKKK..',
        '...KKKKKKKKKK...',
        '....KKKKKKKK....',
        '...KK.KKKK.KK...',
        '................',
        '................'
      ]
    },
    flower: {
      name: 'おひさまおはな',
      rows: [
        '................',
        '......KKKK......',
        '.....KKKKKK.....',
        '....KKKKKKKK....',
        '..KKKYYYYYYKKK..',
        '.KKKKYYYYYYKKKK.',
        '.KKKKYYWWYYKKKK.',
        '.KKKKYYYYYYKKKK.',
        '..KKKYYYYYYKKK..',
        '....KKKKKKKK....',
        '.....KKGGKK.....',
        '.......GG.......',
        '....GG.GG.GG....',
        '.....GGGGGG.....',
        '.......GG.......',
        '................'
      ]
    }
  };
  function applyTemplate(key) {
    const tp = TEMPLATES[key];
    if (!tp) return;
    mkGrid.fill(-1);
    const ox = Math.floor((mkW - 16) / 2), oy = Math.floor((mkH - 16) / 2);
    for (let y = 0; y < 16; y++) {
      const r = tp.rows[y] || '';
      for (let x = 0; x < 16; x++) {
        const ch = r[x];
        if (ch && ch !== '.') mkGrid[(y + oy) * mkW + (x + ox)] = KEYS.indexOf(ch);
      }
    }
    const ni = $('#mkName');
    if (ni) ni.value = tp.name;
    drawMaker();
  }

  /* ---- ローカル保存（マイ作品） ---- */
  function loadMyStages() {
    try { return JSON.parse(localStorage.getItem(MY_KEY) || '[]'); } catch (e) { return []; }
  }
  async function saveMyStage(name, grid, w, h, preToken, talk, bgmToken, allowRemix) {
    const list = loadMyStages();
    const token = preToken || await encodeCustomStage(name, grid, w, h, talk, bgmToken, allowRemix);
    const filtered = list.filter(x => x.token !== token);
    filtered.unshift({ name, w, h, token, at: Date.now() });
    if (filtered.length > 20) filtered.length = 20;
    try { localStorage.setItem(MY_KEY, JSON.stringify(filtered)); } catch (e) {}
    return token;
  }

  /* ---- みんなのステージ一覧（GitHub Issues + マイ作品） ---- */
  function drawArtToCanvas(cv, art, size) {
    cv.width = cv.height = Math.round(size * dpr);
    cv.style.width = cv.style.height = size + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#fff3dc';
    g.fillRect(0, 0, size, size);
    const c = (size - 4) / art.W;
    for (let y = 0; y < art.H; y++) for (let x = 0; x < art.W; x++) {
      const v = art.grid[y * art.W + x];
      if (v >= 0) { g.fillStyle = HEX[v]; g.fillRect(2 + x * c, 2 + y * c, c + 0.3, c + 0.3); }
    }
  }
  async function shareStageArt(name, grid, w, h, talk, preToken, bgmToken, allowRemix) {
    const token = preToken || await encodeCustomStage(name, grid, w, h, talk, bgmToken, allowRemix);
    await saveMyStage(name, grid, w, h, token, talk, bgmToken, allowRemix);
    const url = await stageShareUrl(name, grid, w, h, token, talk, bgmToken, allowRemix);
    const text = 'アントフローでオリジナルステージ「' + name + '」を作ったよ！遊んでみてね🐜🍬\n#アントフロー';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'アントフロー｜' + name, text, url });
        if (url.length > 190) toast('※ URLが長いため、LINEではリンクが途中で切れることがあります（メッセージ全体のコピーで遊べます）', 4500);
        return;
      }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast(url.length > 190 ? 'URLをコピーしたよ（LINEでは長すぎて切れることがあります）' : 'ステージURLをコピーしたよ！');
      }).catch(() => prompt('このURLをコピーしてシェアしてね：', url));
    } else {
      prompt('このURLをコピーしてシェアしてね：', url);
    }
  }
  async function openGallery() {
    showOv('gallery');
    const mine = $('#galMine'), pub = $('#galPub');
    mine.innerHTML = '';
    const myList = loadMyStages();
    if (!myList.length) {
      mine.innerHTML = '<p class="fine">まだ保存した作品がありません（「▶ あそぶ」「🔗 シェア」で残るよ）</p>';
    } else {
      for (const item of myList) {
        const art = await decodeCustomStage(item.token);
        if (!art) continue;
        mine.appendChild(makeGalCard(art, 'マイ作品', null, true));
      }
    }
    pub.innerHTML = '<p class="fine">読み込み中…</p>';
    const reported = loadReported();
    try {
      const res = await fetch(ISSUES_API);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const issues = await res.json();
      pub.innerHTML = '';
      let cnt = 0;
      for (const iss of issues) {
        const m = (iss.body || '').match(/[?&]stage=([A-Za-z0-9_-]+)/);
        if (!m) continue;
        const id = 'gh_' + iss.number;
        if (reported.has(id) || reported.has(m[1])) continue;
        const art = await decodeCustomStage(m[1]);
        if (!art || validateStageName(art.name)) continue;
        const am = (iss.body || '').match(/^- 作者:\s*(.+)$/m);
        const author = am ? am[1].trim().slice(0, 16) : (iss.user && iss.user.login ? '@' + iss.user.login : '投稿作品');
        pub.appendChild(makeGalCard(art, author, id, false));
        cnt++;
      }
      if (!cnt) pub.innerHTML = '<p class="fine">表示できる投稿作品がありません。最初の1作を投稿してみよう！</p>';
    } catch (e) {
      pub.innerHTML = '<p class="fine">投稿一覧を読み込めませんでした（オフラインまたはアクセス集中）</p>';
    }
  }
  function makeGalCard(art, sub, reportId, isMine) {
    const btn = document.createElement('button');
    btn.className = 'galcard';
    if (reportId) {
      const rep = document.createElement('span');
      rep.className = 'galrep';
      rep.textContent = '⚠️';
      rep.title = '不適切な作品を非表示・通報';
      rep.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        if (!confirm('「' + art.name + '」を不適切な作品として一覧から非表示にしますか？')) return;
        addReported(reportId);
        addReported(art.token);
        btn.remove();
        toast('一覧から非表示にしました');
      });
      btn.appendChild(rep);
    }
    const cv = document.createElement('canvas');
    drawArtToCanvas(cv, art, 68);
    const b = document.createElement('b');
    b.textContent = art.name;
    const sm = document.createElement('small');
    sm.textContent = art.W + '×' + art.H + ' · ' + sub + (art.bgmToken ? ' · 🎵' : '') + (!isMine && art.allowRemix ? ' · ✏️OK' : '');
    btn.appendChild(cv); btn.appendChild(b); btn.appendChild(sm);
    if (isMine || art.allowRemix) {
      const acts = document.createElement('div');
      acts.className = 'galacts';
      if (isMine) {
        const sh = document.createElement('span');
        sh.className = 'galshare';
        sh.textContent = '🔗 シェア';
        sh.addEventListener('click', async e => {
          e.stopPropagation();
          e.preventDefault();
          Sound.tap();
          await shareStageArt(art.name, art.grid, art.W, art.H, art.talk, art.token, art.bgmToken, art.allowRemix);
        });
        acts.appendChild(sh);
      }
      const arrBtn = document.createElement('span');
      arrBtn.className = 'galarr';
      arrBtn.textContent = '✏️ アレンジ';
      arrBtn.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        Sound.tap();
        if (window.AF_loadArtIntoMaker) window.AF_loadArtIntoMaker(art, isMine);
      });
      acts.appendChild(arrBtn);
      btn.appendChild(acts);
    }
    btn.addEventListener('click', () => { Sound.tap(); loadCustomLevel(art); });
    return btn;
  }

  /* ---- エディタ UI 構築 ---- */
  function buildMakerUI() {
    if (mkBuilt) return;
    mkBuilt = true;
    const style = document.createElement('style');
    style.textContent =
      '.mrow{grid-template-columns:repeat(3,1fr)!important;gap:6px!important}' +
      '.mrow button{font-size:11px!important;padding:7px 2px!important}' +
      '.mktabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:2px 0 8px}' +
      '.mktab{border:2px solid #ffd3e2;border-radius:14px;padding:7px 6px;background:#fff4f8;font:900 12px var(--rf);color:#c0507a;cursor:pointer;box-shadow:0 2px 0 #f0c6d6}' +
      '.mktab.on{background:linear-gradient(#ff9fbf,#ff6f9e);color:#fff;border-color:#fff;box-shadow:0 2px 0 #d64575}' +
      '#ov-maker .card,#ov-gallery .card{padding:12px 14px}' +
      '.mktop{display:flex;gap:6px;justify-content:center;margin:4px 0 6px}' +
      '.mktop button{border:2px solid #ffd3e2;border-radius:14px;padding:6px 12px;background:#fff4f8;font:900 12px var(--rf);color:#c0507a;cursor:pointer;box-shadow:0 2px 0 #f0c6d6}' +
      '.mktop button:active{transform:translateY(2px);box-shadow:none}' +
      '#mkCv{display:block;width:100%;max-width:272px;aspect-ratio:1;margin:6px auto;border-radius:14px;border:3px solid #fff;box-shadow:0 4px 0 #f0c6d6;background:#fff3dc;touch-action:none;cursor:crosshair}' +
      '.mkpal{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:6px 0}' +
      '.mksw{width:24px;height:24px;border-radius:8px;border:2px solid #fff;box-shadow:0 2px 0 rgba(90,61,92,.2);cursor:pointer;padding:0;font-size:12px;line-height:20px;background:#fff}' +
      '.mksw.on{outline:3px solid #5a3d5c;transform:scale(1.12)}' +
      '.mktools{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin:4px 0;align-items:center}' +
      '.mktools button{border:2px solid #fff;border-radius:12px;padding:4px 8px;background:#fff;box-shadow:0 2px 0 #e5c6d3;font:800 11px var(--rf);color:var(--ink);cursor:pointer}' +
      '.mktools button:disabled{opacity:.45;cursor:default;box-shadow:none}' +
      '.mktools button.on{background:#ffe0ed;border-color:#ff8fb3}' +
      '.mkz{font:900 11px var(--rf);color:#c0507a;min-width:26px;text-align:center}' +
      '#mkName{width:100%;box-sizing:border-box;border:2px solid #f0c6d6;border-radius:12px;padding:7px 10px;font:800 13px var(--rf);color:var(--ink);margin:4px 0;text-align:center;background:#fff}' +
      '.mktalk{margin:6px 0 4px;background:#fff7fb;border:2px solid #ffd3e2;border-radius:14px;padding:4px 8px;text-align:left}' +
      '.mktalk-btn{width:100%;border:none;background:transparent;display:flex;justify-content:space-between;align-items:center;padding:4px 2px;font:900 12px var(--rf);color:#c0507a;cursor:pointer}' +
      '.mktalk-body{display:none;margin-top:6px;border-top:1.5px dashed #ffd3e2;padding-top:6px}' +
      '.mktalk.open .mktalk-body{display:block}' +
      '.mktalk-hint{font-size:10px;font-weight:700;color:#8c6578;margin:0 0 5px;line-height:1.4}' +
      '.mktalk-row{display:flex;align-items:center;gap:6px;margin:4px 0}' +
      '.mktalk-row span{flex:0 0 64px;font-size:11px;font-weight:900;color:var(--ink)}' +
      '.mktalk-row input{flex:1;min-width:0;border:1.5px solid #f0c6d6;border-radius:10px;padding:5px 8px;font:700 11px var(--rf);color:var(--ink);background:#fff}' +
      '.mktalk-act{display:flex;gap:6px;margin-top:6px}' +
      '.mktalk-act button{flex:1;border:2px solid #fff;border-radius:10px;padding:5px;font:800 11px var(--rf);cursor:pointer;background:#ffeef4;color:#c0507a;box-shadow:0 2px 0 #e6bfd0}' +
      '.galgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:190px;overflow:auto;padding:4px 2px}' +
      '.galcard{position:relative;border:2px solid #fff;border-radius:14px;padding:6px 4px;background:#fff;box-shadow:0 3px 0 #f0c6d6;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;font-family:var(--rf);color:var(--ink)}' +
      '.galcard canvas{border-radius:8px}' +
      '.galcard b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
      '.galcard small{font-size:9px;color:#9a7b8c}' +
      '.galrep{position:absolute;top:2px;right:3px;font-size:12px;line-height:1;padding:3px;border-radius:8px;opacity:.75}' +
      '.galrep:hover{opacity:1;background:#ffe0ed}' +
      '.galshare{margin-top:2px;padding:3px 8px;border-radius:10px;background:#e6f9f1;border:1.5px solid #9ee6c7;color:#1b7a53;font:800 10px var(--rf);line-height:1.2}' +
      '.galshare:hover{background:#cff3e4}' +
      '.galacts{display:flex;flex-wrap:wrap;justify-content:center;gap:3px;margin-top:2px}' +
      '.galarr{padding:3px 7px;border-radius:10px;background:#fff1d6;border:1.5px solid #f0d39a;color:#8a5a00;font:800 10px var(--rf);line-height:1.2}' +
      '.galarr:hover{background:#ffe5b4}' +
      '.mkbgm{display:flex;align-items:center;gap:6px;margin:6px 0 4px;padding:6px 10px;background:#fff7fb;border:2px solid #ffd3e2;border-radius:14px;font:800 12px var(--rf)}' +
      '.mkbgm-lbl{color:#c0507a;white-space:nowrap}' +
      '.mkbgm b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;color:var(--ink)}' +
      '.mkbgm button{border:2px solid #fff;border-radius:10px;padding:4px 10px;background:#ffeef4;color:#c0507a;font:800 11px var(--rf);cursor:pointer;box-shadow:0 2px 0 #e6bfd0}' +
      '.mkperm{display:flex;align-items:center;justify-content:center;gap:6px;margin:4px 0 6px;padding:6px 10px;background:#fff7fb;border:1.5px solid #ffd3e2;border-radius:12px;font:800 11px var(--rf);color:var(--ink);cursor:pointer}' +
      '.mkperm input{accent-color:#ff6f9e;width:15px;height:15px;cursor:pointer}' +
      '.stbgm-list{max-height:24vh;overflow:auto;text-align:left;margin:4px 0 8px}' +
      '.stbgm-card{display:flex;align-items:center;gap:6px;padding:7px 9px;background:#fff;border:2px solid #ffd3e2;border-radius:12px;margin-bottom:5px}' +
      '.stbgm-card .info{flex:1;min-width:0}' +
      '.stbgm-card .info b{display:block;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.stbgm-card .info small{display:block;font-size:10px;color:#8a6a7a}' +
      '.stbgm-card button{border:none;border-radius:8px;padding:4px 9px;background:#fff1d6;color:var(--ink);font:800 11px var(--rf);cursor:pointer}' +
      '.stbgm-card button.pick{background:var(--mint);color:#fff}' +
      '.poststeps{background:#fff;border-radius:14px;padding:10px 12px;margin:8px 0;text-align:left;font-size:12px;line-height:1.65;border:2px solid #ffd3e2}' +
      '.poststeps b{color:#e46a92}' +
      '#ov-posthelp h2,#ov-bgm-posthelp h2{background:none;box-shadow:none;border:none;color:#c0507a;font-size:18px;padding:2px 0 4px;margin:0 0 4px}';
    document.head.appendChild(style);

    const pov = document.createElement('div');
    pov.className = 'ov';
    pov.id = 'ov-posthelp';
    pov.innerHTML =
      '<div class="card">' +
      '<h2>📮 みんなに投稿する</h2>' +
      '<div id="postApiBox" style="display:none">' +
      '<p class="fine">ニックネームを決めて「🌟 みんなの絵」に公開しよう！</p>' +
      '<input id="postNick" type="text" maxlength="16" placeholder="ニックネーム（空欄なら「名無しのありんこ」）" style="width:100%;box-sizing:border-box;border:2px solid #f0c6d6;border-radius:12px;padding:8px 10px;font:800 13px var(--rf);color:var(--ink);margin:8px 0;text-align:center;background:#fff">' +
      '<p class="fine" id="postSummary" style="margin:4px 0 8px"></p>' +
      '</div>' +
      '<div id="postGhBox">' +
      '<p class="fine">※ 投稿には GitHub アカウントが必要です（見る・遊ぶ・URLシェアは不要）</p>' +
      '<div class="poststeps">' +
      '<div><b>①</b> 下のボタンで投稿ページが開きます</div>' +
      '<div><b>②</b> 内容は自動入力されているので、そのまま緑色の <b>「Create」</b>（または「Submit new issue」）ボタンを押すだけ！</div>' +
      '<div><b>③</b> <b>「🟢 Open」</b> の画面が出たら投稿完了！このアプリに戻って「🌟 みんなの絵」を見てね</div>' +
      '</div>' +
      '</div>' +
      '<button class="big" id="bPostGo">📮 投稿する</button>' +
      '<button class="big sec" id="bPostBack">もどる</button>' +
      '</div>';
    document.body.appendChild(pov);

    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.id = 'ov-maker';
    ov.innerHTML =
      '<div class="card">' +
      '<div class="mktabs"><button type="button" class="mktab on">🎨 ステージをつくる</button><button type="button" class="mktab" id="bMkToBgm">🎵 BGMをつくる</button></div>' +
      '<h2>🎨 ステージをつくる</h2>' +
      '<div class="mktop"><button id="bMkGalTop">💾 マイ作品・みんなの絵</button><button id="bMkCloseTop">✕ とじる</button></div>' +
      '<input id="mkName" type="text" maxlength="14" placeholder="ステージ名（例：わたしのハート）">' +
      '<div class="mktools">' +
      '<button class="mksz on" data-sz="16">16×16</button>' +
      '<button class="mksz" data-sz="24">24×24</button>' +
      '<button class="mksz" data-sz="32">32×32</button>' +
      '<button id="mkZOut" title="縮小">🔍−</button>' +
      '<span class="mkz" id="mkZoomLbl">1x</span>' +
      '<button id="mkZIn" title="拡大">🔍＋</button>' +
      '<button id="mkPanBtn" disabled>✋ 移動</button>' +
      '</div>' +
      '<canvas id="mkCv"></canvas>' +
      '<div class="mktools">' +
      '<button id="mkUndo" disabled>↶ もどす</button>' +
      '<button id="mkSelBtn">🔲 選択移動</button>' +
      '<button id="mkMir">🪞 左右対称</button>' +
      '<button id="mkMirV">↕️ 上下対称</button>' +
      '<button id="mkHeart">❤️ ハート</button>' +
      '<button id="mkCat">🐱 ネコ</button>' +
      '<button id="mkFlower">🌸 おはな</button>' +
      '<button id="mkClear">🗑️ けす</button>' +
      '</div>' +
      '<div class="mkpal" id="mkPal"></div>' +
      '<div class="mkbgm">' +
      '<span class="mkbgm-lbl">🎵 BGM</span>' +
      '<b id="mkBgmName">標準BGM（おまかせ）</b>' +
      '<button type="button" id="mkBgmPick">えらぶ</button>' +
      '<button type="button" id="mkBgmClr" style="display:none" title="標準にもどす">✕</button>' +
      '</div>' +
      '<div class="mktalk" id="mkTalkBox">' +
      '<button type="button" class="mktalk-btn" id="mkTalkToggle"><span>💬 セリフをつくる（任意）</span><i id="mkTalkArr">▼</i></button>' +
      '<div class="mktalk-body">' +
      '<p class="mktalk-hint">「/」で区切ると複数パターン作れるよ（空欄はいつものセリフになるよ）</p>' +
      '<div class="mktalk-row"><span>🚀 開始時</span><input id="mkTalkHi" type="text" maxlength="90" placeholder="例：わたしの作品だ！ / みてみて！"></div>' +
      '<div class="mktalk-row"><span>🐜 プレイ中</span><input id="mkTalkP" type="text" maxlength="120" placeholder="例：かわいいでしょ？ / 運ぶぞー！"></div>' +
      '<div class="mktalk-row"><span>🎉 クリア時</span><input id="mkTalkC" type="text" maxlength="90" placeholder="例：かんせい！ / ありがとう！"></div>' +
      '<div class="mktalk-row"><span>💦 渋滞時</span><input id="mkTalkJ" type="text" maxlength="90" placeholder="例：つまった～！ / もう1回！"></div>' +
      '<div class="mktalk-row"><span>👑 女王さま</span><input id="mkTalkQ" type="text" maxlength="90" placeholder="例：すてきな絵ですわ！"></div>' +
      '<div class="mktalk-act"><button type="button" id="mkTalkAuto">✨ おまかせで作る</button><button type="button" id="mkTalkClr">🗑️ セリフを消す</button></div>' +
      '</div>' +
      '</div>' +
      '<label class="mkperm"><input type="checkbox" id="mkAllowRemix"> ✏️ 他の人がこのステージをアレンジしてOK</label>' +
      '<div class="cfrow">' +
      '<button class="big" id="bMkPlay">▶ あそぶ</button>' +
      '<button class="big mint" id="bMkShare">🔗 URLシェア</button>' +
      '</div>' +
      '<div class="cfrow">' +
      '<button class="big sec" id="bMkPost">📮 みんなに投稿</button>' +
      '<button class="big sec" id="bMkGal">🌟 みんなの絵</button>' +
      '</div>' +
      '<button class="big sec" id="bMkClose">とじる</button>' +
      '</div>';
    document.body.appendChild(ov);

    const bov = document.createElement('div');
    bov.className = 'ov';
    bov.id = 'ov-stage-bgm';
    bov.innerHTML =
      '<div class="card">' +
      '<h2>🎵 ステージのBGMをえらぶ</h2>' +
      '<button class="big mint" id="bStBgmDefault" style="margin:4px 0 8px;height:42px;font-size:13px">🎵 標準BGM（ステージにおまかせ）</button>' +
      '<h3>💾 マイBGM</h3>' +
      '<div class="stbgm-list" id="stBgmMine"></div>' +
      '<h3>🎶 みんなのBGM（使用OKのもの）</h3>' +
      '<div class="stbgm-list" id="stBgmPub"></div>' +
      '<button class="big sec" id="bStBgmBack">🎨 つくるにもどる</button>' +
      '</div>';
    document.body.appendChild(bov);

    const gov = document.createElement('div');
    gov.className = 'ov';
    gov.id = 'ov-gallery';
    gov.innerHTML =
      '<div class="card">' +
      '<div class="mktabs"><button type="button" class="mktab on">🎨 ステージ作品</button><button type="button" class="mktab" id="bGalToBgm">🎵 BGM作品</button></div>' +
      '<h2>💾 マイ作品・みんなの絵</h2>' +
      '<h3>💾 マイ作品</h3>' +
      '<div class="galgrid" id="galMine"></div>' +
      '<h3>📮 みんなの絵（投稿作品）</h3>' +
      '<div class="galgrid" id="galPub"></div>' +
      '<button class="big" id="bGalBack">🎨 つくるにもどる</button>' +
      '<button class="big sec" id="bGalImport">📥 URL・メッセージから読み込む</button>' +
      '<button class="big sec" id="bGalClose">ホームへ</button>' +
      '</div>';
    document.body.appendChild(gov);

    const iov = document.createElement('div');
    iov.className = 'ov';
    iov.id = 'ov-stageerr';
    iov.innerHTML =
      '<div class="card">' +
      '<h2 id="stImpTitle">🔗 ステージURLを読み込む</h2>' +
      '<p class="fine" id="stImpDesc">LINEなどで長いURLが途中で切れたときは、送信された<b>メッセージ全体</b>（またはURL全体）をコピーして下に貼り付けると遊べます。</p>' +
      '<textarea id="stImpTxt" rows="4" style="width:100%;box-sizing:border-box;border:2px solid #f0c6d6;border-radius:12px;padding:8px 10px;font:600 12px var(--rf);color:var(--ink);margin:6px 0;background:#fff;resize:vertical" placeholder="ここにメッセージやURLを貼り付け…"></textarea>' +
      '<button class="big" id="bStImpGo">▶ このステージであそぶ</button>' +
      '<button class="big sec" id="bStImpClose">とじる</button>' +
      '</div>';
    document.body.appendChild(iov);

    const pal = $('#mkPal');
    const er = document.createElement('button');
    er.className = 'mksw'; er.textContent = '🧹'; er.title = 'けしゴム';
    er.addEventListener('click', () => { Sound.tap(); mkCol = -1; refreshPal(); });
    pal.appendChild(er);
    HEX.forEach((hex, idx) => {
      const b = document.createElement('button');
      b.className = 'mksw'; b.style.background = hex; b.dataset.c = String(idx);
      b.addEventListener('click', () => { Sound.tap(); mkCol = idx; refreshPal(); });
      pal.appendChild(b);
    });
    function refreshPal() {
      pal.querySelectorAll('.mksw').forEach(el => {
        const c = el.dataset.c == null ? -1 : Number(el.dataset.c);
        el.classList.toggle('on', c === mkCol);
      });
    }
    refreshPal();

    const cv = $('#mkCv');
    function cellAt(clientX, clientY, clampEdge) {
      const rect = cv.getBoundingClientRect();
      const S = rect.width || 272;
      const px = (clientX - rect.left) / rect.width * S;
      const py = (clientY - rect.top) / rect.height * S;
      let x = Math.floor((px - mkPanX) / (S * mkZoom) * mkW);
      let y = Math.floor((py - mkPanY) / (S * mkZoom) * mkH);
      if (clampEdge) { x = clamp(x, 0, mkW - 1); y = clamp(y, 0, mkH - 1); }
      return { x, y };
    }
    function paintAt(clientX, clientY) {
      const { x, y } = cellAt(clientX, clientY, false);
      if (x < 0 || x >= mkW || y < 0 || y >= mkH) return;
      const mx = mkW - 1 - x, my = mkH - 1 - y;
      mkGrid[y * mkW + x] = mkCol;
      if (mkMirror) mkGrid[y * mkW + mx] = mkCol;
      if (mkMirrorV) mkGrid[my * mkW + x] = mkCol;
      if (mkMirror && mkMirrorV) mkGrid[my * mkW + mx] = mkCol;
      drawMaker();
    }
    cv.addEventListener('pointerdown', e => {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      mkPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mkPtrs.size === 2) {
        mkDrawing = false; mkSelDrag = null;
        const pts = [...mkPtrs.values()];
        mkPinch = {
          dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1,
          zoom: mkZoom,
          mx: (pts[0].x + pts[1].x) / 2,
          my: (pts[0].y + pts[1].y) / 2
        };
        return;
      }
      if (mkPanMode && mkZoom > 1) {
        mkLastPan = { x: e.clientX, y: e.clientY };
        return;
      }
      if (mkSelMode) {
        const { x, y } = cellAt(e.clientX, e.clientY, true);
        if (mkSel && x >= mkSel.x && x < mkSel.x + mkSel.w && y >= mkSel.y && y < mkSel.y + mkSel.h) {
          if (!mkSel.buf) {
            pushMkUndo();
            const buf = new Int8Array(mkSel.w * mkSel.h).fill(-1);
            for (let dy = 0; dy < mkSel.h; dy++) for (let dx = 0; dx < mkSel.w; dx++) {
              const gx = mkSel.x + dx, gy = mkSel.y + dy;
              if (gx >= 0 && gx < mkW && gy >= 0 && gy < mkH) {
                buf[dy * mkSel.w + dx] = mkGrid[gy * mkW + gx];
                mkGrid[gy * mkW + gx] = -1;
              }
            }
            mkSel.buf = buf;
          }
          mkSelDrag = { type: 'move', sx: x, sy: y, ox: mkSel.x, oy: mkSel.y };
        } else {
          commitSel();
          mkSel = { x, y, w: 1, h: 1, buf: null };
          mkSelDrag = { type: 'select', sx: x, sy: y };
        }
        drawMaker();
        return;
      }
      pushMkUndo();
      mkDrawing = true;
      paintAt(e.clientX, e.clientY);
    });
    cv.addEventListener('pointermove', e => {
      if (!mkPtrs.has(e.pointerId)) return;
      mkPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mkPtrs.size === 2 && mkPinch) {
        e.preventDefault();
        const pts = [...mkPtrs.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
        const mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
        const rect = cv.getBoundingClientRect();
        setZoom(mkPinch.zoom * (dist / mkPinch.dist), mx - rect.left, my - rect.top);
        mkPanX += mx - mkPinch.mx;
        mkPanY += my - mkPinch.my;
        mkPinch.mx = mx; mkPinch.my = my;
        clampPan();
        drawMaker();
        return;
      }
      if (mkPanMode && mkZoom > 1 && mkLastPan) {
        e.preventDefault();
        mkPanX += e.clientX - mkLastPan.x;
        mkPanY += e.clientY - mkLastPan.y;
        mkLastPan = { x: e.clientX, y: e.clientY };
        clampPan();
        drawMaker();
        return;
      }
      if (mkSelMode && mkSelDrag && mkSel) {
        e.preventDefault();
        const { x, y } = cellAt(e.clientX, e.clientY, true);
        if (mkSelDrag.type === 'select') {
          mkSel.x = Math.min(mkSelDrag.sx, x);
          mkSel.y = Math.min(mkSelDrag.sy, y);
          mkSel.w = Math.abs(x - mkSelDrag.sx) + 1;
          mkSel.h = Math.abs(y - mkSelDrag.sy) + 1;
        } else {
          mkSel.x = mkSelDrag.ox + (x - mkSelDrag.sx);
          mkSel.y = mkSelDrag.oy + (y - mkSelDrag.sy);
        }
        drawMaker();
        return;
      }
      if (mkDrawing) { e.preventDefault(); paintAt(e.clientX, e.clientY); }
    });
    const stop = e => {
      mkPtrs.delete(e.pointerId);
      if (mkPtrs.size < 2) mkPinch = null;
      if (mkPtrs.size === 0) { mkDrawing = false; mkLastPan = null; mkSelDrag = null; }
    };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = cv.getBoundingClientRect();
      setZoom(mkZoom + (e.deltaY < 0 ? 0.5 : -0.5), e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    document.querySelectorAll('.mksz').forEach(b => {
      b.addEventListener('click', () => { Sound.tap(); commitSel(); setMakerSize(Number(b.dataset.sz)); });
    });
    $('#mkZIn').addEventListener('click', () => { Sound.tap(); setZoom(mkZoom < 2 ? 2 : mkZoom + 1); });
    $('#mkZOut').addEventListener('click', () => { Sound.tap(); setZoom(mkZoom <= 2 ? 1 : mkZoom - 1); });
    $('#mkPanBtn').addEventListener('click', () => {
      if (mkZoom <= 1) return;
      Sound.tap(); mkPanMode = !mkPanMode;
      if (mkPanMode && mkSelMode) { mkSelMode = false; $('#mkSelBtn').classList.remove('on'); }
      refreshZoomUI();
    });

    $('#mkUndo').addEventListener('click', () => {
      if (!mkHistory.length) return;
      Sound.undo();
      mkSel = null; mkSelDrag = null;
      const prev = mkHistory.pop();
      if (prev.w !== mkW || prev.h !== mkH) {
        mkW = prev.w; mkH = prev.h;
        resetZoom();
        refreshSizeBtns();
      }
      mkGrid = prev.grid;
      refreshUndoBtn();
      drawMaker();
    });
    $('#mkSelBtn').addEventListener('click', () => {
      Sound.tap();
      mkSelMode = !mkSelMode;
      if (!mkSelMode) { commitSel(); drawMaker(); }
      else if (mkPanMode) { mkPanMode = false; refreshZoomUI(); }
      $('#mkSelBtn').classList.toggle('on', mkSelMode);
    });
    $('#mkMir').addEventListener('click', () => { Sound.tap(); mkMirror = !mkMirror; $('#mkMir').classList.toggle('on', mkMirror); drawMaker(); });
    $('#mkMirV').addEventListener('click', () => { Sound.tap(); mkMirrorV = !mkMirrorV; $('#mkMirV').classList.toggle('on', mkMirrorV); drawMaker(); });
    $('#mkHeart').addEventListener('click', () => { Sound.tap(); commitSel(); pushMkUndo(); applyTemplate('heart'); });
    $('#mkCat').addEventListener('click', () => { Sound.tap(); commitSel(); pushMkUndo(); applyTemplate('cat'); });
    $('#mkFlower').addEventListener('click', () => { Sound.tap(); commitSel(); pushMkUndo(); applyTemplate('flower'); });
    $('#mkClear').addEventListener('click', () => { Sound.tap(); commitSel(); pushMkUndo(); mkGrid.fill(-1); drawMaker(); });

    const talkIds = [['hi', '#mkTalkHi'], ['p', '#mkTalkP'], ['c', '#mkTalkC'], ['j', '#mkTalkJ'], ['q', '#mkTalkQ']];
    function readTalkFromUI() {
      const obj = {};
      for (const [k, sel] of talkIds) obj[k] = parseTalkField($(sel).value);
      return normalizeCustomTalk(obj);
    }
    function updateTalkBadge() {
      const cnt = countTalkLines(readTalkFromUI());
      const box = $('#mkTalkBox');
      const sp = $('#mkTalkToggle span');
      const arr = $('#mkTalkArr');
      if (sp) sp.textContent = cnt ? '💬 セリフをつくる（' + cnt + 'こ入力中）' : '💬 セリフをつくる（任意）';
      if (arr && box) arr.textContent = box.classList.contains('open') ? '▲' : '▼';
    }
    $('#mkTalkToggle').addEventListener('click', () => {
      Sound.tap();
      $('#mkTalkBox').classList.toggle('open');
      updateTalkBadge();
    });
    for (const [, sel] of talkIds) $(sel).addEventListener('input', updateTalkBadge);
    $('#mkTalkAuto').addEventListener('click', () => {
      Sound.tap();
      const n = (($('#mkName').value || '').trim() || 'オリジナル').slice(0, 12);
      $('#mkTalkHi').value = n + 'だ！運ぶぞー！ / みてみて、' + n + '！';
      $('#mkTalkP').value = n + '、かわいいでしょ？ / どんな絵になるかな / せっせと運ぼう！';
      $('#mkTalkC').value = n + '、かんせい！大成功！ / 遊んでくれてありがとう！';
      $('#mkTalkJ').value = n + 'の途中でつまっちゃった…';
      $('#mkTalkQ').value = '「' + n + '」、とっても素敵ですわね！';
      updateTalkBadge();
      toast('✨ ステージ名からセリフを作ったよ！');
    });
    $('#mkTalkClr').addEventListener('click', () => {
      Sound.tap();
      for (const [, sel] of talkIds) $(sel).value = '';
      updateTalkBadge();
    });

    function refreshBgmUI() {
      const nmEl = $('#mkBgmName'), clrEl = $('#mkBgmClr');
      let label = '標準BGM（おまかせ）';
      if (mkBgmToken && window.AF_bgmTools) {
        const dec = window.AF_bgmTools.decodeBgm(mkBgmToken);
        if (dec) label = '🎵 ' + dec.name + ' (BPM' + dec.bpm + ')';
        else mkBgmToken = '';
      }
      if (nmEl) nmEl.textContent = label;
      if (clrEl) clrEl.style.display = mkBgmToken ? 'inline-block' : 'none';
    }
    function makeBgmPickerCard(item, sub) {
      const card = document.createElement('div');
      card.className = 'stbgm-card';
      card.innerHTML =
        '<div class="info"><b></b><small></small></div>' +
        '<button type="button" class="stbgm-play">▶</button>' +
        '<button type="button" class="pick">えらぶ</button>';
      card.querySelector('b').textContent = item.song.name;
      card.querySelector('small').textContent = item.instLabel + ' · BPM' + item.song.bpm + ' · ' + item.song.bars.length + '小節' + (sub ? ' · ' + sub : '');
      const pBtn = card.querySelector('.stbgm-play');
      pBtn.addEventListener('click', () => {
        if (window.AF_bgmTools) window.AF_bgmTools.togglePreview(item.song, pBtn);
      });
      card.querySelector('.pick').addEventListener('click', () => {
        Sound.tap();
        if (window.AF_bgmTools) window.AF_bgmTools.stopPreview();
        if (save.settings.bgm) Sound.startBgm();
        mkBgmToken = item.token;
        refreshBgmUI();
        showOv('maker');
        toast('🎵「' + item.song.name + '」をステージのBGMにしたよ！');
      });
      return card;
    }
    async function openStageBgmPicker() {
      if (window.AF_bgmTools) window.AF_bgmTools.stopPreview();
      showOv('stage-bgm');
      const mineBox = $('#stBgmMine'), pubBox = $('#stBgmPub');
      mineBox.innerHTML = '';
      const myBgms = window.AF_bgmTools ? window.AF_bgmTools.getMyBgms() : [];
      if (!myBgms.length) {
        mineBox.innerHTML = '<p class="fine">まだマイBGMがありません（「🎵 BGMをつくる」で保存すると選べるよ）</p>';
      } else {
        for (const item of myBgms) mineBox.appendChild(makeBgmPickerCard(item, 'マイBGM'));
      }
      pubBox.innerHTML = '<p class="fine">読み込み中…</p>';
      try {
        const pubBgms = window.AF_bgmTools ? await window.AF_bgmTools.fetchAllowedPublicBgms() : [];
        pubBox.innerHTML = '';
        if (!pubBgms.length) {
          pubBox.innerHTML = '<p class="fine">使用OKの投稿BGMがまだありません</p>';
        } else {
          for (const item of pubBgms) pubBox.appendChild(makeBgmPickerCard(item, item.author));
        }
      } catch (e) {
        pubBox.innerHTML = '<p class="fine">投稿BGMを読み込めませんでした（オフラインまたはアクセス集中）</p>';
      }
    }
    $('#mkBgmPick').addEventListener('click', () => { Sound.tap(); openStageBgmPicker(); });
    $('#mkBgmClr').addEventListener('click', () => {
      Sound.tap(); mkBgmToken = ''; refreshBgmUI();
      toast('🔄 標準BGMにもどしたよ');
    });
    $('#bStBgmDefault').addEventListener('click', () => {
      Sound.tap();
      if (window.AF_bgmTools) window.AF_bgmTools.stopPreview();
      if (save.settings.bgm) Sound.startBgm();
      mkBgmToken = ''; refreshBgmUI();
      showOv('maker');
      toast('🎵 標準BGM（おまかせ）にしたよ');
    });
    $('#bStBgmBack').addEventListener('click', () => {
      Sound.tap();
      if (window.AF_bgmTools) window.AF_bgmTools.stopPreview();
      if (save.settings.bgm) Sound.startBgm();
      showOv('maker');
    });
    $('#mkAllowRemix').addEventListener('change', e => { mkAllowRemix = !!e.target.checked; });

    window.AF_loadArtIntoMaker = function (art, isMine) {
      if (!art || !art.grid) return;
      commitSel();
      mkW = art.W || 16; mkH = art.H || 16;
      mkGrid = art.grid.slice();
      mkHistory.length = 0; refreshUndoBtn();
      resetZoom(); refreshSizeBtns();
      $('#mkName').value = makeStageArrangeName(art.name);
      const t = normalizeCustomTalk(art.talk);
      for (const [k, sel] of talkIds) $(sel).value = (t && t[k] && t[k].length) ? t[k].join(' / ') : '';
      updateTalkBadge();
      if (isMine) {
        mkBgmToken = art.bgmToken || '';
        mkAllowRemix = !!art.allowRemix;
      } else {
        const bgmAllowed = !!(art.bgmToken && art.bgm && art.bgm.allowUse);
        mkBgmToken = bgmAllowed ? art.bgmToken : '';
        mkAllowRemix = false;
      }
      $('#mkAllowRemix').checked = mkAllowRemix;
      refreshBgmUI();
      showOv('maker');
      requestAnimationFrame(drawMaker);
      toast('✏️「' + art.name + '」を土台にアレンジしよう！');
    };

    $('#bMkPlay').addEventListener('click', () => {
      Sound.tap(); commitSel(); drawMaker();
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      const talk = readTalkFromUI();
      saveMyStage(name, mkGrid, mkW, mkH, null, talk, mkBgmToken, mkAllowRemix);
      loadCustomLevel({ W: mkW, H: mkH, grid: mkGrid.slice(), name, theme: 'オリジナル', talk, bgmToken: mkBgmToken, allowRemix: mkAllowRemix });
    });
    $('#bMkShare').addEventListener('click', async () => {
      Sound.tap(); commitSel(); drawMaker();
      let total = 0;
      for (const v of mkGrid) if (v >= 0) total++;
      if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      const ng = validateStageName(name);
      if (ng) { toast(ng); return; }
      const talk = readTalkFromUI();
      if (talk) {
        for (const k of ['hi', 'p', 'c', 'j', 'q']) for (const s of talk[k]) {
          const tng = validateStageName(s);
          if (tng) { toast('セリフ：' + tng); return; }
        }
      }
      await shareStageArt(name, mkGrid, mkW, mkH, talk, null, mkBgmToken, mkAllowRemix);
    });
    let pendingPost = null;
    $('#bMkPost').addEventListener('click', async () => {
      Sound.tap(); commitSel(); drawMaker();
      let total = 0;
      for (const v of mkGrid) if (v >= 0) total++;
      if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      const ng = validateStageName(name);
      if (ng) { toast(ng); return; }
      const talk = readTalkFromUI();
      if (talk) {
        for (const k of ['hi', 'p', 'c', 'j', 'q']) for (const s of talk[k]) {
          const tng = validateStageName(s);
          if (tng) { toast('セリフ：' + tng); return; }
        }
      }
      const token = await encodeCustomStage(name, mkGrid, mkW, mkH, talk, mkBgmToken, mkAllowRemix);
      const cd = checkPostLimit(token);
      if (cd) { toast(cd); return; }
      await saveMyStage(name, mkGrid, mkW, mkH, token, talk, mkBgmToken, mkAllowRemix);
      const url = await stageShareUrl(name, mkGrid, mkW, mkH, token, talk, mkBgmToken, mkAllowRemix);
      const title = '[作品投稿] ' + name + ' (' + mkW + 'x' + mkH + ')';
      const tCnt = countTalkLines(talk);
      const bgmObj = (mkBgmToken && window.AF_bgmTools) ? window.AF_bgmTools.decodeBgm(mkBgmToken) : null;
      const bgmName = bgmObj ? bgmObj.name : '';
      const apiUrl = getPostApiUrl();
      if (apiUrl) {
        $('#postApiBox').style.display = 'block';
        $('#postGhBox').style.display = 'none';
        try { $('#postNick').value = localStorage.getItem(NICK_KEY) || ''; } catch (e) {}
        $('#postSummary').textContent = '「' + name + '」（' + mkW + '×' + mkH + (bgmName ? '・🎵' + bgmName : '') + '）';
        $('#bPostGo').textContent = '📮 みんなに公開する！';
        $('#bPostGo').disabled = false;
        pendingPost = {
          mode: 'api', apiUrl, token, name,
          meta: { w: mkW, h: mkH, talkCount: tCnt, bgmName, allowRemix: mkAllowRemix }
        };
      } else {
        $('#postApiBox').style.display = 'none';
        $('#postGhBox').style.display = 'block';
        $('#bPostGo').textContent = '📮 投稿ページをひらく';
        $('#bPostGo').disabled = false;
        const body =
          '### オリジナルステージ投稿\n' +
          '- ステージ名: ' + name + '\n' +
          '- サイズ: ' + mkW + '×' + mkH + '\n' +
          (bgmName ? '- BGM: ' + bgmName + '\n' : '') +
          (tCnt ? '- セリフ: あり（' + tCnt + 'こ）\n' : '') +
          '- アレンジ: ' + (mkAllowRemix ? 'OK' : '不可') + '\n' +
          '- プレイURL: ' + url + '\n\n' +
          '（このまま下の緑色の「Create」または「Submit new issue」ボタンを押すと投稿完了！ゲーム内の「🌟 みんなの絵」に表示されます）';
        pendingPost = { mode: 'gh', token, issueUrl: REPO_URL + '/issues/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body) };
      }
      showOv('posthelp');
    });
    $('#bPostGo').addEventListener('click', async () => {
      Sound.tap();
      if (!pendingPost) { showOv('maker'); return; }
      if (pendingPost.mode === 'api') {
        const nick = ($('#postNick').value || '').trim().slice(0, 16);
        if (nick && validateStageName(nick)) { toast('ニックネームに使えない言葉・URLが入っています'); return; }
        try { localStorage.setItem(NICK_KEY, nick); } catch (e) {}
        const btn = $('#bPostGo');
        btn.disabled = true; btn.textContent = '投稿中…';
        try {
          const res = await fetch(pendingPost.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: 'stage',
              name: pendingPost.name,
              author: nick,
              token: pendingPost.token,
              siteUrl: location.origin + location.pathname,
              meta: pendingPost.meta
            })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
          recordPost(pendingPost.token);
          pendingPost = null;
          toast('🎉 みんなに投稿したよ！');
          openGallery();
        } catch (e) {
          btn.disabled = false; btn.textContent = '📮 みんなに公開する！';
          toast('投稿に失敗しました：' + (e && e.message ? e.message : '通信エラー'));
        }
        return;
      }
      recordPost(pendingPost.token);
      window.open(pendingPost.issueUrl, '_blank', 'noopener');
      pendingPost = null;
      showOv('maker');
      toast('投稿ページを開いたよ！緑の「Create」を押してね');
    });
    $('#bPostBack').addEventListener('click', () => { Sound.tap(); showOv('maker'); });
    $('#bMkToBgm').addEventListener('click', () => { Sound.tap(); if (window.AF_openBgmMaker) window.AF_openBgmMaker(); });
    $('#bMkGal').addEventListener('click', () => { Sound.tap(); openGallery(); });
    $('#bMkGalTop').addEventListener('click', () => { Sound.tap(); openGallery(); });
    $('#bMkClose').addEventListener('click', () => { Sound.tap(); showOv('title'); });
    $('#bMkCloseTop').addEventListener('click', () => { Sound.tap(); showOv('title'); });
    $('#bGalToBgm').addEventListener('click', () => { Sound.tap(); if (window.AF_openBgmGallery) window.AF_openBgmGallery(); });
    $('#bGalBack').addEventListener('click', () => { Sound.tap(); openMaker(); });
    $('#bGalImport').addEventListener('click', () => {
      Sound.tap();
      $('#stImpTitle').textContent = '🔗 ステージURLを読み込む';
      $('#stImpDesc').innerHTML = 'LINEなどで長いURLが途中で切れたときは、送信された<b>メッセージ全体</b>（またはURL全体）をコピーして下に貼り付けると遊べます。';
      $('#stImpTxt').value = '';
      showOv('stageerr');
    });
    $('#bGalClose').addEventListener('click', () => { Sound.tap(); showOv('title'); });
    $('#bStImpGo').addEventListener('click', async () => {
      Sound.tap();
      const tok = extractStageToken($('#stImpTxt').value);
      if (!tok) { toast('ステージURLが見つかりませんでした'); return; }
      const art = await decodeCustomStage(tok);
      if (!art) { toast('ステージデータが途中で切れているか、正しくありません'); return; }
      loadCustomLevel(art);
    });
    $('#bStImpClose').addEventListener('click', () => { Sound.tap(); showOv('title'); });

    // 初期状態は可愛いハートを入れておく
    applyTemplate('heart');
    refreshZoomUI();
  }

  function drawMaker() {
    const cv = $('#mkCv');
    if (!cv) return;
    const S = Math.round(cv.clientWidth || 272);
    if (cv.width !== Math.round(S * dpr)) { cv.width = cv.height = Math.round(S * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#fff3dc';
    g.fillRect(0, 0, S, S);
    g.save();
    g.translate(mkPanX, mkPanY);
    g.scale(mkZoom, mkZoom);
    const cs = S / mkW;
    for (let y = 0; y < mkH; y++) for (let x = 0; x < mkW; x++) {
      const v = mkGrid[y * mkW + x];
      if (v >= 0) {
        g.fillStyle = HEX[v];
        g.fillRect(x * cs + 0.35 / mkZoom, y * cs + 0.35 / mkZoom, cs - 0.7 / mkZoom, cs - 0.7 / mkZoom);
      }
    }
    g.strokeStyle = 'rgba(90,61,92,.14)';
    g.lineWidth = 1 / mkZoom;
    g.beginPath();
    for (let i = 1; i < mkW; i++) {
      const p = i * cs;
      g.moveTo(p, 0); g.lineTo(p, S);
      g.moveTo(0, p); g.lineTo(S, p);
    }
    g.stroke();
    if (mkMirror) {
      g.strokeStyle = 'rgba(255,90,122,.45)';
      g.lineWidth = 2 / mkZoom;
      g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
    }
    if (mkMirrorV) {
      g.strokeStyle = 'rgba(255,90,122,.45)';
      g.lineWidth = 2 / mkZoom;
      g.beginPath(); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.stroke();
    }
    if (mkSel) {
      if (mkSel.buf) {
        for (let dy = 0; dy < mkSel.h; dy++) for (let dx = 0; dx < mkSel.w; dx++) {
          const v = mkSel.buf[dy * mkSel.w + dx];
          if (v >= 0) {
            g.fillStyle = HEX[v];
            g.fillRect((mkSel.x + dx) * cs + 0.35 / mkZoom, (mkSel.y + dy) * cs + 0.35 / mkZoom, cs - 0.7 / mkZoom, cs - 0.7 / mkZoom);
          }
        }
      }
      g.strokeStyle = '#ff4d6d';
      g.lineWidth = 2 / mkZoom;
      g.setLineDash([4 / mkZoom, 3 / mkZoom]);
      g.strokeRect(mkSel.x * cs, mkSel.y * cs, mkSel.w * cs, mkSel.h * cs);
      g.setLineDash([]);
    }
    g.restore();
  }

  function openMaker() {
    buildMakerUI();
    showOv('maker');
    requestAnimationFrame(drawMaker);
  }
  window.AF_openMaker = openMaker;
  window.AF_openGallery = openGallery;

  // ホーム画面に「🎨 つくる」「💾 マイ作品」ボタンを追加
  buildMakerUI();
  const mrow = document.querySelector('.mrow');
  if (mrow) {
    const btn = document.createElement('button');
    btn.id = 'bMMake';
    btn.innerHTML = '<i>🎨</i>つくる';
    btn.addEventListener('click', () => { Sound.tap(); openMaker(); });
    mrow.appendChild(btn);

    const gbtn = document.createElement('button');
    gbtn.id = 'bMGal';
    gbtn.innerHTML = '<i>💾</i>マイ作品';
    gbtn.addEventListener('click', () => { Sound.tap(); openGallery(); });
    mrow.appendChild(gbtn);
  }

  // URL に ?stage=... があればそのオリジナルステージを起動
  const stParam = new URLSearchParams(location.search).get('stage');
  if (stParam) {
    (async () => {
      const art = await decodeCustomStage(stParam);
      if (art) {
        setTimeout(() => loadCustomLevel(art), 50);
      } else {
        setTimeout(() => {
          $('#stImpTitle').textContent = '⚠️ ステージURLが途中で切れています';
          $('#stImpDesc').innerHTML = 'LINEなどでは長いURLが途中で切れてしまい、ステージを正しく開けないことがあります。<br>送信された<b>メッセージ全体</b>（またはURL全体）をコピーして下に貼り付けると遊べます！';
          $('#stImpTxt').value = '';
          showOv('stageerr');
        }, 80);
      }
    })();
  }
})();

AF_LOADED.push('maker.js');
