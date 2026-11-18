// File: maker.js
'use strict';

/* ================= オリジナルステージ作成＆URLシェア＆投稿 ================= */
(function () {
  const MY_KEY = 'antflow-my-stages-v1';
  const POST_CD_KEY = 'antflow-post-cd-v1';
  const REPORT_KEY = 'antflow-reported-v1';
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
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function encodeCustomStage(name, grid, w, h) {
    const W = w || mkW, H = h || mkH;
    const nb = new TextEncoder().encode((name || 'オリジナル').slice(0, 20));
    const runs = [];
    let i = 0;
    while (i < grid.length) {
      const v = grid[i];
      let cnt = 1;
      while (i + cnt < grid.length && grid[i + cnt] === v && cnt < 255) cnt++;
      runs.push(v + 1, cnt);
      i += cnt;
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
  function decodeCustomStage(token) {
    try {
      const bytes = fromB64Url(token);
      if (bytes.length < 6 || bytes[0] !== 1) return null;
      const W = bytes[1], H = bytes[2], nLen = bytes[3];
      if (W < 8 || W > 32 || H < 8 || H > 32 || 4 + nLen >= bytes.length) return null;
      const name = new TextDecoder().decode(bytes.slice(4, 4 + nLen)) || 'オリジナル';
      const grid = new Int8Array(W * H).fill(-1);
      let idx = 0;
      for (let p = 4 + nLen; p + 1 < bytes.length && idx < grid.length; p += 2) {
        const val = bytes[p] - 1, cnt = bytes[p + 1];
        if (val < -1 || val >= HEX.length || cnt < 1) return null;
        for (let k = 0; k < cnt && idx < grid.length; k++) grid[idx++] = val;
      }
      let total = 0;
      for (let k = 0; k < grid.length; k++) if (grid[k] >= 0) total++;
      if (total < 4) return null;
      return { W, H, grid, name, theme: 'オリジナル', token };
    } catch (e) { return null; }
  }
  function stageShareUrl(name, grid, w, h) {
    const token = encodeCustomStage(name, grid, w, h);
    return location.origin + location.pathname + '?stage=' + token;
  }

  /* ---- パズル生成してプレイ開始 ---- */
  function loadCustomLevel(art) {
    let total = 0;
    for (const v of art.grid) if (v >= 0) total++;
    if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
    const shareUrl = stageShareUrl(art.name, art.grid, art.W, art.H);
    const P = params(5, total);
    const rng = mulberry32(hashInt(total, art.name.length + 77));
    const c = construct(art, P, rng);
    const L = {
      id: 0, custom: true, art, shareUrl,
      name: art.name || 'オリジナル', theme: 'オリジナル',
      W: art.W, H: art.H, grid: art.grid, cols: c.cols, solution: c.solution, total,
      metrics: { stars: 2 }
    };
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
  function saveMyStage(name, grid, w, h) {
    const list = loadMyStages();
    const token = encodeCustomStage(name, grid, w, h);
    const filtered = list.filter(x => x.token !== token);
    filtered.unshift({ name, w, h, token, at: Date.now() });
    if (filtered.length > 20) filtered.length = 20;
    try { localStorage.setItem(MY_KEY, JSON.stringify(filtered)); } catch (e) {}
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
  async function openGallery() {
    showOv('gallery');
    const mine = $('#galMine'), pub = $('#galPub');
    mine.innerHTML = '';
    const myList = loadMyStages();
    if (!myList.length) {
      mine.innerHTML = '<p class="fine">まだ保存した作品がありません（「▶ あそぶ」「🔗 シェア」で残るよ）</p>';
    } else {
      myList.forEach(item => {
        const art = decodeCustomStage(item.token);
        if (!art) return;
        mine.appendChild(makeGalCard(art, 'マイ作品', null));
      });
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
        const art = decodeCustomStage(m[1]);
        if (!art || validateStageName(art.name)) continue;
        const author = iss.user && iss.user.login ? '@' + iss.user.login : '投稿作品';
        pub.appendChild(makeGalCard(art, author, id));
        cnt++;
      }
      if (!cnt) pub.innerHTML = '<p class="fine">表示できる投稿作品がありません。最初の1作を投稿してみよう！</p>';
    } catch (e) {
      pub.innerHTML = '<p class="fine">投稿一覧を読み込めませんでした（オフラインまたはアクセス集中）</p>';
    }
  }
  function makeGalCard(art, sub, reportId) {
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
    sm.textContent = art.W + '×' + art.H + ' · ' + sub;
    btn.appendChild(cv); btn.appendChild(b); btn.appendChild(sm);
    btn.addEventListener('click', () => { Sound.tap(); loadCustomLevel(art); });
    return btn;
  }

  /* ---- エディタ UI 構築 ---- */
  function buildMakerUI() {
    if (mkBuilt) return;
    mkBuilt = true;
    const style = document.createElement('style');
    style.textContent =
      '.mrow{grid-template-columns:repeat(4,1fr)!important;gap:6px!important}' +
      '.mrow button{font-size:11px!important;padding:8px 1px!important}' +
      '#ov-maker .card,#ov-gallery .card{padding:12px 14px}' +
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
      '.galgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:210px;overflow:auto;padding:4px 2px}' +
      '.galcard{position:relative;border:2px solid #fff;border-radius:14px;padding:6px 4px;background:#fff;box-shadow:0 3px 0 #f0c6d6;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;font-family:var(--rf);color:var(--ink)}' +
      '.galcard canvas{border-radius:8px}' +
      '.galcard b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
      '.galcard small{font-size:9px;color:#9a7b8c}' +
      '.galrep{position:absolute;top:2px;right:3px;font-size:12px;line-height:1;padding:3px;border-radius:8px;opacity:.75}' +
      '.galrep:hover{opacity:1;background:#ffe0ed}';
    document.head.appendChild(style);

    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.id = 'ov-maker';
    ov.innerHTML =
      '<div class="card">' +
      '<h2>🎨 ステージをつくる</h2>' +
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

    const gov = document.createElement('div');
    gov.className = 'ov';
    gov.id = 'ov-gallery';
    gov.innerHTML =
      '<div class="card">' +
      '<h2>🌟 みんなのステージ</h2>' +
      '<h3>📮 投稿されたステージ</h3>' +
      '<div class="galgrid" id="galPub"></div>' +
      '<h3>💾 マイ作品</h3>' +
      '<div class="galgrid" id="galMine"></div>' +
      '<button class="big" id="bGalBack">🎨 つくるにもどる</button>' +
      '<button class="big sec" id="bGalClose">ホームへ</button>' +
      '</div>';
    document.body.appendChild(gov);

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

    $('#bMkPlay').addEventListener('click', () => {
      Sound.tap(); commitSel(); drawMaker();
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      saveMyStage(name, mkGrid, mkW, mkH);
      loadCustomLevel({ W: mkW, H: mkH, grid: mkGrid.slice(), name, theme: 'オリジナル' });
    });
    $('#bMkShare').addEventListener('click', async () => {
      Sound.tap(); commitSel(); drawMaker();
      let total = 0;
      for (const v of mkGrid) if (v >= 0) total++;
      if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      const ng = validateStageName(name);
      if (ng) { toast(ng); return; }
      saveMyStage(name, mkGrid, mkW, mkH);
      const url = stageShareUrl(name, mkGrid, mkW, mkH);
      const text = 'アントフローでオリジナルステージ「' + name + '」を作ったよ！遊んでみてね🐜🍬\n#アントフロー';
      if (navigator.share) {
        try { await navigator.share({ title: 'アントフロー｜' + name, text, url }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => toast('ステージURLをコピーしたよ！')).catch(() => prompt('このURLをコピーしてシェアしてね：', url));
      } else {
        prompt('このURLをコピーしてシェアしてね：', url);
      }
    });
    $('#bMkPost').addEventListener('click', async () => {
      Sound.tap(); commitSel(); drawMaker();
      let total = 0;
      for (const v of mkGrid) if (v >= 0) total++;
      if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      const ng = validateStageName(name);
      if (ng) { toast(ng); return; }
      const token = encodeCustomStage(name, mkGrid, mkW, mkH);
      const cd = checkPostLimit(token);
      if (cd) { toast(cd); return; }
      saveMyStage(name, mkGrid, mkW, mkH);
      recordPost(token);
      const url = stageShareUrl(name, mkGrid, mkW, mkH);
      const title = '[作品投稿] ' + name + ' (' + mkW + 'x' + mkH + ')';
      const body =
        '### オリジナルステージ投稿\n' +
        '- ステージ名: ' + name + '\n' +
        '- サイズ: ' + mkW + '×' + mkH + '\n' +
        '- プレイURL: ' + url + '\n\n' +
        '（このまま「Submit new issue」を押すと、ゲーム内の「🌟 みんなの絵」にも表示されます！）';
      const issueUrl = REPO_URL + '/issues/new?labels=custom-stage&title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
      window.open(issueUrl, '_blank', 'noopener');
      toast('投稿画面を開いたよ！（マイ作品にも保存しました）');
    });
    $('#bMkGal').addEventListener('click', () => { Sound.tap(); openGallery(); });
    $('#bMkClose').addEventListener('click', () => { Sound.tap(); showOv('title'); });
    $('#bGalBack').addEventListener('click', () => { Sound.tap(); openMaker(); });
    $('#bGalClose').addEventListener('click', () => { Sound.tap(); showOv('title'); });

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

  // ホーム画面に「🎨 つくる」ボタンを追加
  buildMakerUI();
  const mrow = document.querySelector('.mrow');
  if (mrow) {
    const btn = document.createElement('button');
    btn.id = 'bMMake';
    btn.innerHTML = '<i>🎨</i>つくる';
    btn.addEventListener('click', () => { Sound.tap(); openMaker(); });
    mrow.appendChild(btn);
  }

  // URL に ?stage=... があればそのオリジナルステージを起動
  const stParam = new URLSearchParams(location.search).get('stage');
  if (stParam) {
    const art = decodeCustomStage(stParam);
    if (art) {
      setTimeout(() => loadCustomLevel(art), 50);
    }
  }
})();

AF_LOADED.push('maker.js');
