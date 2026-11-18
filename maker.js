// File: maker.js
'use strict';

/* ================= オリジナルステージ作成＆URLシェア ================= */
(function () {
  const MK_W = 16, MK_H = 16;
  const mkGrid = new Int8Array(MK_W * MK_H).fill(-1);
  const mkHistory = [];
  let mkCol = 0, mkMirror = false, mkDrawing = false, mkBuilt = false;
  function refreshUndoBtn() {
    const b = $('#mkUndo');
    if (b) b.disabled = !mkHistory.length;
  }
  function pushMkUndo() {
    mkHistory.push(mkGrid.slice());
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
  function encodeCustomStage(name, grid) {
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
    bytes[1] = MK_W;
    bytes[2] = MK_H;
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
  function stageShareUrl(name, grid) {
    const token = encodeCustomStage(name, grid);
    return location.origin + location.pathname + '?stage=' + token;
  }

  /* ---- パズル生成してプレイ開始 ---- */
  function loadCustomLevel(art) {
    let total = 0;
    for (const v of art.grid) if (v >= 0) total++;
    if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
    const shareUrl = stageShareUrl(art.name, art.grid);
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
    for (let y = 0; y < MK_H; y++) {
      const r = tp.rows[y] || '';
      for (let x = 0; x < MK_W; x++) {
        const ch = r[x];
        mkGrid[y * MK_W + x] = ch && ch !== '.' ? KEYS.indexOf(ch) : -1;
      }
    }
    const ni = $('#mkName');
    if (ni) ni.value = tp.name;
    drawMaker();
  }

  /* ---- エディタ UI 構築 ---- */
  function buildMakerUI() {
    if (mkBuilt) return;
    mkBuilt = true;
    const style = document.createElement('style');
    style.textContent =
      '.mrow{grid-template-columns:repeat(4,1fr)!important;gap:6px!important}' +
      '.mrow button{font-size:11px!important;padding:8px 1px!important}' +
      '#ov-maker .card{padding:12px 14px}' +
      '#mkCv{display:block;width:100%;max-width:272px;aspect-ratio:1;margin:6px auto;border-radius:14px;border:3px solid #fff;box-shadow:0 4px 0 #f0c6d6;background:#fff3dc;touch-action:none;cursor:crosshair}' +
      '.mkpal{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:6px 0}' +
      '.mksw{width:24px;height:24px;border-radius:8px;border:2px solid #fff;box-shadow:0 2px 0 rgba(90,61,92,.2);cursor:pointer;padding:0;font-size:12px;line-height:20px;background:#fff}' +
      '.mksw.on{outline:3px solid #5a3d5c;transform:scale(1.12)}' +
      '.mktools{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:4px 0}' +
      '.mktools button{border:2px solid #fff;border-radius:12px;padding:4px 9px;background:#fff;box-shadow:0 2px 0 #e5c6d3;font:800 11px var(--rf);color:var(--ink);cursor:pointer}' +
      '.mktools button:disabled{opacity:.45;cursor:default;box-shadow:none}' +
      '.mktools button.on{background:#ffe0ed;border-color:#ff8fb3}' +
      '#mkName{width:100%;box-sizing:border-box;border:2px solid #f0c6d6;border-radius:12px;padding:7px 10px;font:800 13px var(--rf);color:var(--ink);margin:4px 0;text-align:center;background:#fff}';
    document.head.appendChild(style);

    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.id = 'ov-maker';
    ov.innerHTML =
      '<div class="card">' +
      '<h2>🎨 ステージをつくる</h2>' +
      '<p class="fine">16×16の絵を描いて、友達にURLで送れるよ！</p>' +
      '<input id="mkName" type="text" maxlength="14" placeholder="ステージ名（例：わたしのハート）">' +
      '<canvas id="mkCv"></canvas>' +
      '<div class="mktools">' +
      '<button id="mkUndo" disabled>↶ もどす</button>' +
      '<button id="mkMir">🪞 左右対称</button>' +
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
      '<button class="big sec" id="bMkClose">とじる</button>' +
      '</div>';
    document.body.appendChild(ov);

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
    function paintAt(clientX, clientY) {
      const rect = cv.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / rect.width * MK_W);
      const y = Math.floor((clientY - rect.top) / rect.height * MK_H);
      if (x < 0 || x >= MK_W || y < 0 || y >= MK_H) return;
      mkGrid[y * MK_W + x] = mkCol;
      if (mkMirror) mkGrid[y * MK_W + (MK_W - 1 - x)] = mkCol;
      drawMaker();
    }
    cv.addEventListener('pointerdown', e => { e.preventDefault(); pushMkUndo(); mkDrawing = true; cv.setPointerCapture(e.pointerId); paintAt(e.clientX, e.clientY); });
    cv.addEventListener('pointermove', e => { if (mkDrawing) { e.preventDefault(); paintAt(e.clientX, e.clientY); } });
    const stop = () => { mkDrawing = false; };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);

    $('#mkUndo').addEventListener('click', () => {
      if (!mkHistory.length) return;
      Sound.undo();
      mkGrid.set(mkHistory.pop());
      refreshUndoBtn();
      drawMaker();
    });
    $('#mkMir').addEventListener('click', () => { Sound.tap(); mkMirror = !mkMirror; $('#mkMir').classList.toggle('on', mkMirror); });
    $('#mkHeart').addEventListener('click', () => { Sound.tap(); pushMkUndo(); applyTemplate('heart'); });
    $('#mkCat').addEventListener('click', () => { Sound.tap(); pushMkUndo(); applyTemplate('cat'); });
    $('#mkFlower').addEventListener('click', () => { Sound.tap(); pushMkUndo(); applyTemplate('flower'); });
    $('#mkClear').addEventListener('click', () => { Sound.tap(); pushMkUndo(); mkGrid.fill(-1); drawMaker(); });

    $('#bMkPlay').addEventListener('click', () => {
      Sound.tap();
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      loadCustomLevel({ W: MK_W, H: MK_H, grid: mkGrid.slice(), name, theme: 'オリジナル' });
    });
    $('#bMkShare').addEventListener('click', async () => {
      Sound.tap();
      let total = 0;
      for (const v of mkGrid) if (v >= 0) total++;
      if (total < 4) { toast('キャンディを4マス以上おいてね！'); return; }
      const name = ($('#mkName').value || '').trim() || 'オリジナル';
      const url = stageShareUrl(name, mkGrid);
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
    $('#bMkClose').addEventListener('click', () => { Sound.tap(); showOv('title'); });

    // 初期状態は可愛いハートを入れておく
    applyTemplate('heart');
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
    const cs = S / MK_W;
    for (let y = 0; y < MK_H; y++) for (let x = 0; x < MK_W; x++) {
      const v = mkGrid[y * MK_W + x];
      if (v >= 0) {
        g.fillStyle = HEX[v];
        g.fillRect(x * cs + 0.6, y * cs + 0.6, cs - 1.2, cs - 1.2);
      }
    }
    g.strokeStyle = 'rgba(90,61,92,.12)';
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 1; i < MK_W; i++) {
      const p = Math.round(i * cs) + 0.5;
      g.moveTo(p, 0); g.lineTo(p, S);
      g.moveTo(0, p); g.lineTo(S, p);
    }
    g.stroke();
    if (mkMirror) {
      g.strokeStyle = 'rgba(255,90,122,.45)';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
    }
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
