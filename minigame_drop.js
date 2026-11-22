// File: minigame_drop.js
(() => {
  'use strict';

  const COLS = 6, ROWS = 5, SIZE = COLS * ROWS, TYPES = 5;
  const GAME_MS = 60_000, MOVE_MS = 5_000, BONUS_MS = 5_000;
  const MAX_TIME_MS = 75_000, MAX_WAVES = 24;
  const ART_POINTS = 500, POINTS_PER_COIN = 100;
  const SYMBOLS = ['♥', '★', '◆', '●', '▲'];
  const BASIC = ['#d84f83', '#377fc6', '#3b996b', '#e4a22d', '#8561c9'];
  const STYLE_ID = 'af-integrated-drop-css';
  const nf = new Intl.NumberFormat('ja-JP');
  let active = false;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .afid {
        position:fixed; inset:0; width:100%; height:100%; height:100dvh;
        max-width:none; max-height:none; margin:0; padding:0; border:0;
        overflow:auto; overscroll-behavior:contain;
        background:radial-gradient(ellipse at top,#fff2f8,#f1ebff 62%,#ebf8fc);
        color:#392d51; font:700 1rem/1.45 system-ui,sans-serif;
      }
      .afid::backdrop { background:#392d51; }
      .afid * { box-sizing:border-box; }
      .afid [hidden] { display:none !important; }
      .afid :focus-visible { outline:3px solid #7146aa; outline-offset:3px; }
      .afid-wrap {
        width:min(100%,29rem); margin:auto;
        padding:max(.65rem,env(safe-area-inset-top))
                max(.75rem,env(safe-area-inset-right))
                max(.85rem,env(safe-area-inset-bottom))
                max(.75rem,env(safe-area-inset-left));
      }
      .afid h1,.afid h2,.afid p { margin:0; }
      .afid h1 { font-size:clamp(1.15rem,5vw,1.5rem); }
      .afid h2 { font-size:1.15rem; }
      .afid button {
        min-height:44px; padding:.45rem .95rem; border:1px solid #d7c7eb;
        border-radius:999px; background:#fff; color:#4d346b;
        font:inherit; cursor:pointer; touch-action:manipulation;
      }
      .afid button.afid-primary { background:#8251aa; border-color:#8251aa; color:#fff; }
      .afid-card {
        padding:.75rem; border:1px solid #e1d6ef; border-radius:1rem;
        background:#ffffffdc; box-shadow:0 4px 12px #44236412;
      }
      .afid-title,.afid-result { margin-top:clamp(.3rem,5vh,2.5rem); padding:1.25rem; }
      .afid-title ul { padding-inline-start:1.25rem; }
      .afid-actions { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:1rem; }
      .afid-row { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
      .afid-hud { margin:.3rem 0 .55rem; }
      .afid-score,.afid-time,.afid-progress { font-variant-numeric:tabular-nums; white-space:nowrap; }
      .afid-track { flex:1; height:.55rem; overflow:hidden; border-radius:999px; background:#ded5ed; }
      .afid-fill {
        display:block; width:100%; height:100%; transform-origin:left;
        border-radius:inherit; background:linear-gradient(90deg,#7863bc,#bd60a5);
      }
      .afid-danger .afid-fill { background:#c54568; }
      .afid-danger .afid-time { color:#a6224f; }
      .afid-main { display:grid; gap:.5rem; align-items:start; }
      .afid-art h2 { overflow-wrap:anywhere; }
      .afid-preview { display:grid; place-items:center; height:clamp(4rem,14vh,7rem); margin:.35rem 0; }
      .afid-preview canvas,.afid-gallery canvas {
        display:block; width:100%; height:100%; min-width:0; min-height:0;
        object-fit:contain; image-rendering:pixelated;
      }
      .afid-legend { display:flex; justify-content:center; flex-wrap:wrap; gap:.3rem; margin:0; padding:0; list-style:none; }
      .afid-chip {
        display:flex; align-items:center; gap:.25rem; padding:.1rem .3rem;
        border:1px solid #e8def2; border-radius:.55rem; font-size:.75rem;
        font-variant-numeric:tabular-nums;
      }
      .afid-chip.afid-done { color:#666071; background:#f5f2f8; }
      .afid-chip .afid-candy { width:1.25rem; height:1.25rem; font-size:.75rem; }
      .afid-controls { min-width:0; }
      .afid-status { min-height:1.5em; text-align:center; font-size:.88rem; }
      .afid-move { height:.35rem; margin:.2rem 0 .35rem; visibility:hidden; }
      .afid-move.afid-visible { visibility:visible; }
      .afid-move .afid-fill { background:#397eaa; }
      .afid-board {
        display:grid; grid-template-columns:repeat(6,minmax(0,1fr));
        grid-template-rows:repeat(5,minmax(0,1fr));
        width:100%; aspect-ratio:6 / 5; margin:auto; overflow:hidden;
        border-radius:.9rem; background:#e5dcf3; box-shadow:0 0 0 1px #beb0d4;
        touch-action:none; user-select:none; -webkit-user-select:none;
      }
      .afid-cell { display:grid; place-items:stretch; min-width:0; min-height:0; padding:9%; }
      .afid-cell:nth-child(12n+1),.afid-cell:nth-child(12n+3),.afid-cell:nth-child(12n+5),
      .afid-cell:nth-child(12n+8),.afid-cell:nth-child(12n+10),.afid-cell:nth-child(12n+12) { background:#f8f1fb; }
      .afid-candy {
        display:grid; place-items:center; border:1px solid #392d5144;
        border-radius:40%; color:#302443;
        background:radial-gradient(ellipse at 33% 23%,#fffe,#fff7 52%,#fff2 82%),var(--drop,#c2a3df);
        box-shadow:inset 0 -3px 0 #39234b28,0 2px 3px #4d396533;
        font-size:clamp(.85rem,4vw,1.5rem); line-height:1; pointer-events:none;
      }
      .afid-cursor .afid-candy { outline:2px dashed #57377f; outline-offset:1px; }
      .afid-held .afid-candy { outline:2px solid #57377f; outline-offset:1px; }
      .afid-held.afid-pointer .afid-candy { opacity:.43; }
      .afid-pop .afid-candy { animation:afid-pop 150ms ease-in both; }
      .afid-fall .afid-candy { animation:afid-fall 170ms ease-out both; }
      @keyframes afid-pop { 35%{transform:scale(1.13)} to{opacity:0;transform:scale(.28)} }
      @keyframes afid-fall { from{opacity:.5;transform:translateY(var(--fall,-100%))} to{opacity:1;transform:none} }
      .afid-hint { margin-top:.45rem !important; text-align:center; font-size:.75rem; }
      .afid-floater {
        position:fixed; left:0; top:0; z-index:3; pointer-events:none;
        width:var(--ghost-size,44px); height:var(--ghost-size,44px);
        box-shadow:0 5px 14px #40275b66; border:2px solid white;
      }
      .afid-particle {
        position:fixed; z-index:2; width:10px; height:10px; margin:-5px 0 0 -5px;
        border-radius:50%; border:1px solid white; pointer-events:none;
      }
      .afid-result dl { margin:.75rem 0; }
      .afid-result dl div { display:flex; justify-content:space-between; gap:.6rem; padding:.25rem 0; }
      .afid-result dd { margin:0; text-align:right; font-variant-numeric:tabular-nums; }
      .afid-note { font-size:.82rem; color:#68488d; }
      .afid-gallery {
        display:flex; gap:.45rem; overflow-x:auto; padding:0 0 .4rem; list-style:none;
      }
      .afid-gallery li { flex:0 0 4.2rem; text-align:center; font-size:.7rem; }
      .afid-thumb { height:3.1rem; padding:.2rem; background:#f7f1fc; border-radius:.5rem; }
      .afid-thumb-name { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      @media (orientation:landscape) and (max-height:650px) {
        .afid-wrap { width:min(100%,52rem); }
        .afid-main { grid-template-columns:minmax(9rem,1fr) minmax(0,1.4fr); gap:1rem; }
        .afid-preview { height:clamp(4rem,32vh,10rem); }
        .afid-board { width:min(100%,max(10rem,calc((100dvh - 8rem) * 1.2))); }
      }
      @media (prefers-reduced-motion:reduce) {
        .afid .afid-candy { animation:none; }
        .afid-particle { display:none; }
      }
    `;
    document.head.appendChild(style);
  }

  function validHex(value) {
    return typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim());
  }

  function rgb(hex) {
    let s = hex.slice(1);
    if (s.length === 3) s = [...s].map(c => c + c).join('');
    const n = Number.parseInt(s, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function distance(a, b) {
    return 2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2;
  }

  function makeArtReader() {
    const source = typeof HEX !== 'undefined' && Array.isArray(HEX) ? HEX : [];
    const colors = source.map(v => validHex(v) ? v.trim() : null);
    const originalLength = colors.length;
    const basicIds = BASIC.map(hex => colors.push(hex) - 1);
    const rgbs = colors.map(v => v ? rgb(v) : null);
    const list = typeof ARTS !== 'undefined' && Array.isArray(ARTS) ? ARTS : [];
    let order = [], lastId = 0;

    function shuffleOrder() {
      order = Array.from({ length:list.length }, (_, i) => i + 1);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      if (order.length > 1 && order[order.length - 1] === lastId) {
        [order[0], order[order.length - 1]] = [order[order.length - 1], order[0]];
      }
    }

    function read(id) {
      if (typeof getArt !== 'function') return null;
      try {
        const data = getArt(id);
        if (!data) return null;
        const w = data.w ?? data.W, h = data.h ?? data.H, grid = data.grid;
        if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 ||
            w > 512 || h > 512 || w * h > 65_536 || !grid || grid.length < w * h) return null;
        const pixels = Array.from({ length:w * h }, (_, i) => {
          const v = grid[i];
          return Number.isInteger(v) && v >= 0 && v < originalLength && colors[v] ? v : -1;
        });
        if (!pixels.some(v => v >= 0)) return null;
        return { id, name:String(list[id - 1]?.n || `お題 ${id}`), w, h, grid:pixels };
      } catch {
        return null;
      }
    }

    function nextSource() {
      // 未走査分を調べてから、必要なら新しい順番を一巡する。
      let wrapped = false;
      let repeated = null;
      while (order.length || !wrapped) {
        if (!order.length) {
          shuffleOrder();
          wrapped = true;
          if (!order.length) break;
        }
        const art = read(order.pop());
        if (!art) continue;
        if (art.id === lastId) {
          repeated = art;
          continue;
        }
        lastId = art.id;
        return art;
      }
      if (repeated) return repeated;

      const heart = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
      return {
        id:0, name:'ハート', w:7, h:6,
        grid:[...heart.join('')].map(c => c === '#' ? basicIds[0] : -1)
      };
    }

    function next() {
      const art = nextSource();
      const counts = new Map();
      for (const v of art.grid) if (v >= 0) counts.set(v, (counts.get(v) || 0) + 1);

      const ranked = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || a - b);
      const palette = [];
      for (const v of ranked) {
        if (palette.length === TYPES) break;
        if (palette.every(u => distance(rgbs[v], rgbs[u]) >= 12_000)) palette.push(v);
      }

      while (palette.length < TYPES) {
        let best = -1, bestDistance = -1;
        for (const v of basicIds) {
          if (palette.includes(v)) continue;
          const d = Math.min(...palette.map(u => distance(rgbs[v], rgbs[u])));
          if (d > bestDistance) { best = v; bestDistance = d; }
        }
        palette.push(best);
      }

      const buckets = Array.from({ length:TYPES }, () => []);
      const slotFor = new Map();
      for (const v of ranked) {
        let slot = palette.indexOf(v);
        if (slot < 0) {
          slot = 0;
          for (let s = 1; s < TYPES; s++) {
            if (distance(rgbs[v], rgbs[palette[s]]) < distance(rgbs[v], rgbs[palette[slot]])) slot = s;
          }
        }
        slotFor.set(v, slot);
      }

      art.grid.forEach((v, i) => {
        if (v >= 0) buckets[slotFor.get(v)].push(i);
      });
      for (const bucket of buckets) {
        for (let i = bucket.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
        }
      }

      return {
        ...art, palette, buckets, slotFor, colors,
        total:buckets.reduce((n, b) => n + b.length, 0),
        painted:new Uint8Array(art.grid.length), done:0
      };
    }

    return next;
  }

  function playSound(name) {
    try {
      if (typeof Sound !== 'undefined' && Sound && typeof Sound[name] === 'function') {
        const pending = Sound[name]();
        if (pending && typeof pending.catch === 'function') pending.catch(() => {});
      }
    } catch {
      // 音声が使えない場合もプレイを続ける。
    }
  }

  function swap(board, a, b) {
    [board[a], board[b]] = [board[b], board[a]];
  }

  function markMatches(board) {
    const marks = new Uint8Array(SIZE);
    function scan(first, length, stride) {
      for (let start = 0; start < length;) {
        const type = board[first + start * stride];
        let end = start + 1;
        while (end < length && board[first + end * stride] === type) end++;
        if (end - start >= 3) {
          for (let j = start; j < end; j++) marks[first + j * stride] = 1;
        }
        start = end;
      }
    }
    for (let r = 0; r < ROWS; r++) scan(r * COLS, COLS, 1);
    for (let c = 0; c < COLS; c++) scan(c, ROWS, COLS);
    return marks;
  }

  function matchGroups(board, marks) {
    const unseen = marks.slice();
    const groups = [];
    for (let i = 0; i < SIZE; i++) {
      if (!unseen[i]) continue;
      const slot = board[i], cells = [], stack = [i];
      unseen[i] = 0;
      while (stack.length) {
        const j = stack.pop(), col = j % COLS;
        cells.push(j);
        const neighbors = [];
        if (col > 0) neighbors.push(j - 1);
        if (col < COLS - 1) neighbors.push(j + 1);
        if (j >= COLS) neighbors.push(j - COLS);
        if (j + COLS < SIZE) neighbors.push(j + COLS);
        for (const k of neighbors) {
          if (unseen[k] && board[k] === slot) {
            unseen[k] = 0;
            stack.push(k);
          }
        }
      }
      groups.push({ slot, cells });
    }
    return groups;
  }

  function hasSimpleMove(board) {
    function test(a, b) {
      if (board[a] === board[b]) return false;
      swap(board, a, b);
      const yes = markMatches(board).some(Boolean);
      swap(board, a, b);
      return yes;
    }
    for (let i = 0; i < SIZE; i++) {
      if (i % COLS < COLS - 1 && test(i, i + 1)) return true;
      if (i + COLS < SIZE && test(i, i + COLS)) return true;
    }
    return false;
  }

  function makeBoard() {
    function fill(seed) {
      const board = [];
      const a = Math.floor(Math.random() * TYPES), b = (a + 1) % TYPES;
      for (let i = 0; i < SIZE; i++) {
        // 保険：上段 A B A と B の真下の A。初期マッチなしで一手を保証。
        if (seed && (i === 0 || i === 2 || i === COLS + 1)) { board.push(a); continue; }
        if (seed && i === 1) { board.push(b); continue; }
        const allowed = [];
        for (let s = 0; s < TYPES; s++) {
          if (i % COLS >= 2 && board[i - 1] === s && board[i - 2] === s) continue;
          if (i >= COLS * 2 && board[i - COLS] === s && board[i - COLS * 2] === s) continue;
          allowed.push(s);
        }
        board.push(allowed[Math.floor(Math.random() * allowed.length)]);
      }
      return board;
    }

    for (let i = 0; i < 12; i++) {
      const board = fill(false);
      if (hasSimpleMove(board)) return board;
    }
    return fill(true);
  }

  function refill(board, marks, art) {
    const falls = new Map();
    const weights = art.buckets.map(b => b.length ? 1.3 : 1);
    const sum = weights.reduce((n, w) => n + w, 0);
    function randomSlot() {
      let x = Math.random() * sum;
      for (let s = 0; s < TYPES; s++) {
        x -= weights[s];
        if (x < 0) return s;
      }
      return TYPES - 1;
    }

    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let read = ROWS - 1; read >= 0; read--) {
        const from = read * COLS + c;
        if (marks[from]) continue;
        const to = write * COLS + c;
        board[to] = board[from];
        if (write !== read) falls.set(to, write - read);
        write--;
      }
      const missing = write + 1;
      for (; write >= 0; write--) {
        const to = write * COLS + c;
        board[to] = randomSlot();
        falls.set(to, missing);
      }
    }
    return falls;
  }

  function asCount(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }

  window.openMiniDrop = function openMiniDrop(onClose) {
    if (active) return;
    installStyle();

    const previousFocus = document.activeElement;
    const nextArt = makeArtReader();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const root = document.createElement('dialog');
    root.className = 'afid';
    root.setAttribute('aria-label', 'ドロップぬりえ');
    root.innerHTML = `
      <div class="afid-wrap">
        <section class="afid-card afid-title" data-pane="title">
          <h1>🍬 ドロップぬりえ</h1>
          <ul>
            <li>ドロップをつかんでなぞり、指を離して縦・横に3つ以上そろえよう。</li>
            <li>消した色に近いマスが塗れます。その色の残りがないときも、ほかのマスを少し塗れます。</li>
            <li>全体で60秒。最初の入れ替えから1手5秒。絵が完成すると＋${ART_POINTS}点、プレイ中なら＋5秒。</li>
          </ul>
          <p data-ui="best-title"></p>
          <div class="afid-actions">
            <button class="afid-primary" type="button" data-ui="start" autofocus>スタート</button>
            <button type="button" data-ui="close-title">閉じる</button>
          </div>
        </section>

        <section data-pane="game" hidden>
          <header class="afid-row">
            <h1>ドロップぬりえ</h1>
            <span class="afid-score" data-ui="score">0 pt</span>
            <button type="button" data-ui="pause">一時停止</button>
            <button type="button" data-ui="end">集計する</button>
          </header>
          <div class="afid-row afid-hud" data-ui="hud">
            <div class="afid-track" aria-hidden="true"><i class="afid-fill" data-ui="time-bar"></i></div>
            <span class="afid-time" data-ui="time" role="timer">残り60秒</span>
          </div>
          <div class="afid-main">
            <section class="afid-card afid-art" aria-label="お題">
              <div class="afid-row">
                <h2 data-ui="art-name"></h2>
                <span class="afid-progress" data-ui="progress"></span>
              </div>
              <div class="afid-preview"><canvas data-ui="art" role="img"></canvas></div>
              <ul class="afid-legend" data-ui="legend" aria-label="ドロップの種類と残りマス数"></ul>
            </section>
            <section class="afid-controls">
              <p class="afid-status" data-ui="status" role="status"></p>
              <div class="afid-track afid-move" data-ui="move" aria-hidden="true">
                <i class="afid-fill" data-ui="move-bar"></i>
              </div>
              <div class="afid-board" data-ui="board" tabindex="0" role="group"
                   aria-label="6列5行の盤面" aria-describedby="afid-hint"></div>
              <p id="afid-hint" class="afid-hint">
                矢印キーで移動、Space / Enterでつかむ・離す。Escで操作を取り消す。
              </p>
            </section>
          </div>
        </section>

        <section class="afid-card" data-pane="pause" hidden>
          <h2>一時停止中</h2>
          <p>タイマーは止まっています。</p>
          <div class="afid-actions">
            <button class="afid-primary" type="button" data-ui="resume">再開</button>
            <button type="button" data-ui="pause-end">集計して終わる</button>
            <button type="button" data-ui="close-pause">閉じる</button>
          </div>
        </section>

        <section class="afid-card afid-result" data-pane="result" hidden>
          <h2>おつかれさま！</h2>
          <dl>
            <div><dt>スコア</dt><dd data-ui="res-score"></dd></div>
            <div><dt>ハイスコア</dt><dd data-ui="res-best"></dd></div>
            <div><dt>完成したお題</dt><dd data-ui="res-arts"></dd></div>
            <div><dt>最大コンボ</dt><dd data-ui="res-combo"></dd></div>
            <div><dt>獲得コイン</dt><dd data-ui="res-coins"></dd></div>
          </dl>
          <p class="afid-note" data-ui="note" role="status"></p>
          <ul class="afid-gallery" data-ui="gallery" aria-label="完成したお題の一覧" hidden></ul>
          <div class="afid-actions">
            <button class="afid-primary" type="button" data-ui="retry">もう一度</button>
            <button type="button" data-ui="close-result">閉じる</button>
          </div>
        </section>
      </div>
      <div class="afid-candy afid-floater" data-ui="ghost" aria-hidden="true" hidden></div>
    `;

    const $ = key => root.querySelector(`[data-ui="${key}"]`);
    const pane = key => root.querySelector(`[data-pane="${key}"]`);
    const gridEl = $('board'), canvas = $('art'), ghost = $('ghost');
    const status = $('status'), legend = $('legend'), ctx = canvas.getContext('2d');
    const cells = [], chips = [], particles = new Set();
    const ui = Object.fromEntries([...root.querySelectorAll('[data-ui]')].map(node => [node.dataset.ui, node]));

    for (let i = 0; i < SIZE; i++) {
      const cell = document.createElement('div');
      const candy = document.createElement('span');
      cell.className = 'afid-cell';
      cell.setAttribute('aria-hidden', 'true');
      candy.className = 'afid-candy';
      cell.append(candy);
      gridEl.append(cell);
      cells.push({ cell, candy });
    }

    for (let s = 0; s < TYPES; s++) {
      const chip = document.createElement('li');
      const candy = document.createElement('span');
      const count = document.createElement('span');
      chip.className = 'afid-chip';
      candy.className = 'afid-candy';
      candy.textContent = SYMBOLS[s];
      candy.setAttribute('aria-hidden', 'true');
      count.setAttribute('aria-hidden', 'true');
      chip.append(candy, count);
      legend.append(chip);
      chips.push({ chip, candy, count });
    }

    let phase = 'title'; // title | ready | drag | resolving | result | closed
    let board, art, drag = null, cursor = 0, keyboardMode = false;
    let score = 0, maxCombo = 0, completed = [], sessionBest = 0;
    let deadline = 0, ending = false, timer = 0, run = 0, lastSecond = -1;
    let paused = false, pausedAt = 0;

    function listen(target, type, handler, options = {}) {
      target.addEventListener(type, handler, { ...options, signal:controller.signal });
    }

    function showPane(name) {
      for (const key of ['title', 'game', 'pause', 'result']) pane(key).hidden = key !== name;
      root.scrollTop = 0;
    }

    function savedBest() {
      try {
        if (typeof save !== 'undefined' && save) return Math.max(sessionBest, asCount(save.minigameDropHighScore));
      } catch { /* セーブ先にアクセスできない場合は、この画面内の記録を使う。 */ }
      return sessionBest;
    }

    function renderArt() {
      const progress = `${nf.format(art.done)} / ${nf.format(art.total)} マス`;
      ui['art-name'].textContent = art.name;
      ui.progress.textContent = progress;
      canvas.setAttribute('aria-label', `${art.name}、${progress}`);
      if (canvas.width !== art.w) canvas.width = art.w;
      if (canvas.height !== art.h) canvas.height = art.h;

      if (ctx) {
        ctx.clearRect(0, 0, art.w, art.h);
        art.grid.forEach((v, i) => {
          if (v < 0) return;
          ctx.globalAlpha = art.painted[i] ? 1 : .28;
          ctx.fillStyle = art.colors[art.painted[i] ? v : art.palette[art.slotFor.get(v)]];
          ctx.fillRect(i % art.w, Math.floor(i / art.w), 1, 1);
        });
        ctx.globalAlpha = 1;
      }

      chips.forEach(({ chip, candy, count }, s) => {
        const n = art.buckets[s].length;
        candy.style.setProperty('--drop', art.colors[art.palette[s]]);
        count.textContent = n ? nf.format(n) : '✓';
        chip.classList.toggle('afid-done', !n);
        chip.setAttribute('aria-label', `${SYMBOLS[s]}：残り${nf.format(n)}マス`);
      });
    }

    function renderBoard(marks = null, falls = null) {
      cells.forEach(({ cell, candy }, i) => {
        const slot = board[i], held = drag?.cell === i;
        candy.style.setProperty('--drop', art.colors[art.palette[slot]]);
        candy.textContent = SYMBOLS[slot];
        cell.classList.toggle('afid-cursor', keyboardMode && !drag && cursor === i && phase === 'ready');
        cell.classList.toggle('afid-held', held);
        cell.classList.toggle('afid-pointer', held && drag.kind === 'pointer');
        cell.classList.toggle('afid-pop', Boolean(marks?.[i]));
        const distance = falls?.get(i);
        cell.classList.toggle('afid-fall', Boolean(distance));
        if (distance) candy.style.setProperty('--fall', `${-distance * 120}%`);
      });
      gridEl.setAttribute('aria-label', keyboardMode
        ? `盤面、${Math.floor(cursor / COLS) + 1}行${cursor % COLS + 1}列、${SYMBOLS[board[cursor]]}${drag ? '、つかんでいます' : ''}`
        : '6列5行の盤面');
    }

    function paintGroup({ slot, cells: hits }, combo) {
      const unit = Math.max(1, Math.ceil(art.total / 55));
      let budget = Math.ceil(hits.length * unit * (1 + Math.min(5, combo - 1) * .15));
      let painted = 0;
      function paint(i) {
        art.painted[i] = 1;
        art.done++;
        painted++;
      }
      const preferred = art.buckets[slot];
      while (budget > 0 && preferred.length) {
        paint(preferred.pop());
        budget--;
      }
      // 色が余ったときだけ、残った塗りパワーの半分を他の色に回す。
      budget = Math.ceil(budget / 2);
      while (budget > 0 && art.done < art.total) {
        let largest = 0;
        for (let s = 1; s < TYPES; s++) {
          if (art.buckets[s].length > art.buckets[largest].length) largest = s;
        }
        if (!art.buckets[largest].length) break;
        paint(art.buckets[largest].pop());
        budget--;
      }
      return painted;
    }

    function flyPaint(group) {
      if (reduced.matches || typeof root.animate !== 'function') return;
      const to = canvas.getBoundingClientRect();
      for (const i of group.cells.slice(0, 2)) {
        if (particles.size >= 16) return;
        const from = cells[i].cell.getBoundingClientRect();
        const x = from.left + from.width / 2, y = from.top + from.height / 2;
        const dx = to.left + to.width / 2 - x, dy = to.top + to.height / 2 - y;
        const dot = document.createElement('span');
        dot.className = 'afid-particle';
        dot.setAttribute('aria-hidden', 'true');
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        dot.style.backgroundColor = art.colors[art.palette[group.slot]];
        root.append(dot);
        const animation = dot.animate([
          { transform:'translate(0,0) scale(1)', opacity:1 },
          { transform:`translate(${dx * .45}px,${dy * .55 - 23}px) scale(.85)`, opacity:.9 },
          { transform:`translate(${dx}px,${dy}px) scale(.25)`, opacity:0 }
        ], { duration:360, easing:'ease-out' });
        particles.add(animation);
        const remove = () => { particles.delete(animation); dot.remove(); };
        animation.finished.then(remove, remove);
      }
    }

    const wait = ms => new Promise(resolve => window.setTimeout(resolve, reduced.matches ? 0 : ms));

    async function resolveTurn(moved) {
      const currentRun = run;
      const stillHere = () => run === currentRun && phase === 'resolving';
      let waves = 0, combo = 0, cleared = false;
      let marks = markMatches(board);

      while (marks.some(Boolean) && waves < MAX_WAVES) {
        waves++;
        const groups = matchGroups(board, marks);
        let artJustCompleted = false;
        for (const group of groups) {
          combo++;
          const n = group.cells.length;
          score += Math.round((n * 10 + 20 + Math.max(0, n - 3) * 10) * (1 + .25 * (combo - 1)));

          if (!cleared) {
            if (paintGroup(group, combo)) flyPaint(group);
            if (art.done === art.total) {
              cleared = true;
              artJustCompleted = true;
              completed.push(art);
              score += ART_POINTS;
              const now = performance.now();
              if (!ending && now < deadline) {
                deadline = Math.min(now + MAX_TIME_MS, deadline + BONUS_MS);
              }
            }
          }
        }

        maxCombo = Math.max(maxCombo, combo);
        ui.score.textContent = `${nf.format(score)} pt`;
        renderArt();
        status.textContent = cleared
          ? `${combo}コンボ！ ${art.name} 完成！`
          : `${combo}コンボ（${waves}連鎖）！`;
        playSound(artJustCompleted ? 'fanfare' : combo >= 6 ? 'boom' : waves > 1 ? 'starPing' : 'pop');

        renderBoard(marks);
        await wait(150);
        if (!stillHere()) return;
        renderBoard(null, refill(board, marks, art));
        await wait(170);
        if (!stillHere()) return;
        marks = markMatches(board);
      }

      if (cleared && !ending && performance.now() < deadline) {
        await wait(450);
        if (!stillHere()) return;
      }

      // 時間切れ時は確定済みの手だけ集計し、次のお題は出さない。
      if (ending || performance.now() >= deadline) {
        showResult();
        return;
      }

      if (cleared) {
        art = nextArt();
        board = makeBoard();
        renderArt();
        status.textContent = '完成！ 次のお題へ';
      } else if (marks.some(Boolean) || !hasSimpleMove(board)) {
        board = makeBoard();
        status.textContent = '新しい盤面に入れ替えました';
      } else if (!combo) {
        status.textContent = moved ? 'もう一度、縦か横に3つそろえてみよう' : 'なぞってドロップを動かそう';
        if (moved) playSound('deny');
      }
      phase = 'ready';
      renderBoard();
    }

    function start(kind, cell, pointerId = null, x = 0, y = 0) {
      if (phase !== 'ready' || !checkTime()) return false;
      cursor = cell;
      drag = { kind, cell, pointerId, x, y, until:0, start:cell, before:board.slice() };
      phase = 'drag';
      status.textContent = kind === 'pointer' ? '指を離すとマッチ判定' : '矢印で移動、Space / Enterで離す';
      playSound('tap');
      renderBoard();
      return true;
    }

    function moveHeld(next) {
      if (next === drag.cell) return;
      swap(board, drag.cell, next);
      cursor = drag.cell = next;
      if (!drag.until) drag.until = performance.now() + MOVE_MS;
    }

    function finishDrag(commit) {
      if (!drag) return;
      const held = drag;
      drag = null;
      ghost.hidden = true;
      ui.move.classList.remove('afid-visible');
      if (held.pointerId !== null) {
        try {
          if (gridEl.hasPointerCapture(held.pointerId)) gridEl.releasePointerCapture(held.pointerId);
        } catch { /* ポインターが既に解放されている。 */ }
      }

      if (!commit) {
        board = held.before;
        cursor = held.start;
        phase = 'ready';
        status.textContent = '移動を取り消しました';
        renderBoard();
        return;
      }

      phase = 'resolving';
      renderBoard();
      void resolveTurn(Boolean(held.until));
    }

    function point(event, rect) {
      return {
        x:Math.max(0, Math.min(COLS - .0001, (event.clientX - rect.left) / rect.width * COLS)),
        y:Math.max(0, Math.min(ROWS - .0001, (event.clientY - rect.top) / rect.height * ROWS))
      };
    }

    function trace(x, y) {
      const x0 = drag.x, y0 = drag.y;
      let c = drag.cell % COLS, r = Math.floor(drag.cell / COLS);
      const tc = Math.floor(x), tr = Math.floor(y);
      const dc = Math.sign(tc - c), dr = Math.sign(tr - r);
      // 交差した格子境界の順に、縦横いずれか一マスだけ入れ替える。
      while (c !== tc || r !== tr) {
        const tx = c === tc ? Infinity : (c + (dc > 0 ? 1 : 0) - x0) / (x - x0);
        const ty = r === tr ? Infinity : (r + (dr > 0 ? 1 : 0) - y0) / (y - y0);
        if (tx <= ty) c += dc;
        else r += dr;
        moveHeld(r * COLS + c);
      }
      drag.x = x;
      drag.y = y;
    }

    function placeGhost(event, rect) {
      const size = Math.max(25, Math.min(64, rect.width / COLS * .94));
      const left = Math.max(0, Math.min(window.innerWidth - size, event.clientX - size / 2));
      const top = Math.max(0, Math.min(window.innerHeight - size, event.clientY - size - 9));
      const slot = board[drag.cell];
      ghost.style.setProperty('--ghost-size', `${size}px`);
      ghost.style.setProperty('--drop', art.colors[art.palette[slot]]);
      ghost.style.transform = `translate(${left}px,${top}px)`;
      ghost.textContent = SYMBOLS[slot];
      ghost.hidden = false;
    }

    function followPointer(event) {
      const rect = gridEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const samples = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
      for (const sample of samples) {
        const p = point(sample, rect);
        trace(p.x, p.y);
      }
      const p = point(event, rect);
      trace(p.x, p.y);
      placeGhost(event, rect);
      renderBoard();
    }

    function checkTime() {
      if (ending || (phase !== 'ready' && phase !== 'drag')) return false;
      const now = performance.now();
      if (now >= deadline) {
        requestEnd();
        return false;
      }
      if (drag?.until && now >= drag.until) {
        finishDrag(true);
        return false;
      }
      return true;
    }

    listen(gridEl, 'pointerdown', e => {
      if (!e.isPrimary || e.button !== 0 || phase !== 'ready' || !checkTime()) return;
      const rect = gridEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      e.preventDefault();
      gridEl.focus({ preventScroll:true });
      keyboardMode = false;
      const p = point(e, rect);
      if (!start('pointer', Math.floor(p.y) * COLS + Math.floor(p.x), e.pointerId, p.x, p.y)) return;
      try { gridEl.setPointerCapture(e.pointerId); } catch { /* window側でも受け取る。 */ }
      placeGhost(e, rect);
    });

    function ownsPointer(e) {
      return drag?.kind === 'pointer' && drag.pointerId === e.pointerId;
    }

    listen(window, 'pointermove', e => {
      if (!ownsPointer(e) || !checkTime()) return;
      if (e.cancelable) e.preventDefault();
      followPointer(e);
    }, { passive:false });
    listen(window, 'pointerup', e => {
      if (!ownsPointer(e) || !checkTime()) return;
      followPointer(e);
      finishDrag(true);
    });
    function cancelPointer(e) {
      if (ownsPointer(e) && checkTime()) finishDrag(false);
    }
    listen(window, 'pointercancel', cancelPointer);
    listen(gridEl, 'lostpointercapture', cancelPointer);
    listen(gridEl, 'contextmenu', e => e.preventDefault());

    listen(gridEl, 'focus', () => {
      if (phase !== 'ready') return;
      keyboardMode = true;
      renderBoard();
    });
    listen(gridEl, 'blur', () => {
      if (drag?.kind === 'keyboard' && checkTime()) finishDrag(false);
    });
    listen(window, 'blur', () => {
      if (drag && checkTime()) finishDrag(false);
    });

    listen(gridEl, 'keydown', e => {
      const directions = new Map([
        ['ArrowLeft', [-1, 0]], ['ArrowRight', [1, 0]],
        ['ArrowUp', [0, -1]], ['ArrowDown', [0, 1]]
      ]);
      const direction = directions.get(e.key);
      const toggle = e.key === ' ' || e.key === 'Enter';
      if (!direction && !toggle) return;
      e.preventDefault();
      if (!checkTime() || drag?.kind === 'pointer') return;
      keyboardMode = true;
      if (toggle) {
        if (e.repeat) return;
        if (drag) finishDrag(true);
        else start('keyboard', cursor);
        return;
      }
      const c = cursor % COLS + direction[0];
      const r = Math.floor(cursor / COLS) + direction[1];
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
        const next = r * COLS + c;
        if (drag) moveHeld(next);
        else cursor = next;
      }
      renderBoard();
    });

    function tick() {
      if (paused || ending || !['ready', 'drag', 'resolving'].includes(phase)) return;
      const now = performance.now(), remaining = Math.max(0, deadline - now);
      const seconds = Math.ceil(remaining / 1000);
      ui['time-bar'].style.transform = `scaleX(${Math.min(1, remaining / GAME_MS)})`;
      if (seconds !== lastSecond) {
        lastSecond = seconds;
        ui.time.textContent = `残り${seconds}秒`;
        ui.hud.classList.toggle('afid-danger', seconds <= 10);
      }
      if (!remaining) { requestEnd(); return; }
      if (drag?.until) {
        ui.move.classList.add('afid-visible');
        ui['move-bar'].style.transform = `scaleX(${Math.max(0, (drag.until - now) / MOVE_MS)})`;
        if (now >= drag.until) finishDrag(true);
      }
    }

    function pauseGame() {
      if (paused || ending || !['ready', 'drag', 'resolving'].includes(phase)) return;
      paused = true;
      pausedAt = performance.now();
      window.clearInterval(timer);
      playSound('tap');
      showPane('pause');
      ui.resume.focus({ preventScroll:true });
    }

    function resumeGame() {
      if (!paused || phase === 'closed') return;
      const delta = performance.now() - pausedAt;
      deadline += delta;
      if (drag?.until) drag.until += delta;
      paused = false;
      pausedAt = 0;
      playSound('tap');
      showPane('game');
      timer = window.setInterval(tick, 40);
      tick();
      gridEl.focus({ preventScroll:true });
    }

    function requestEnd() {
      if (ending || !['ready', 'drag', 'resolving'].includes(phase)) return;
      paused = false;
      pausedAt = 0;
      ending = true;
      window.clearInterval(timer);
      ui.end.disabled = true;
      ui.time.textContent = '集計中';
      ui['time-bar'].style.transform = 'scaleX(0)';
      if (drag) finishDrag(true);
      else if (phase !== 'resolving') showResult();
    }

    function makeThumbnail(item) {
      const li = document.createElement('li');
      const frame = document.createElement('div');
      const c = document.createElement('canvas');
      const text = document.createElement('span');
      frame.className = 'afid-thumb';
      text.className = 'afid-thumb-name';
      text.textContent = item.name;
      text.title = item.name;
      c.width = item.w;
      c.height = item.h;
      c.setAttribute('aria-hidden', 'true');
      const g = c.getContext('2d');
      if (g) {
        item.grid.forEach((v, i) => {
          if (v < 0) return;
          g.fillStyle = item.colors[v];
          g.fillRect(i % item.w, Math.floor(i / item.w), 1, 1);
        });
      }
      frame.append(c);
      li.append(frame, text);
      return li;
    }

    function showResult() {
      if (phase === 'closed' || phase === 'result') return;
      phase = 'result'; // このプレイの報酬を二重に加算しない。
      ending = true;
      window.clearInterval(timer);

      const oldBest = savedBest(), best = Math.max(oldBest, score);
      const earned = Math.floor(score / POINTS_PER_COIN);
      const finishedRun = run;
      let credited = false;
      sessionBest = best;

      function reportSaveFailure() {
        if (phase !== 'result' || run !== finishedRun) return;
        ui.note.textContent = '今回の結果を保存できませんでした。';
      }

      ui.note.textContent = score > oldBest ? 'ハイスコア更新！' : '';
      try {
        if (typeof save !== 'undefined' && save && typeof save === 'object') {
          save.coins = asCount(save.coins) + earned;
          credited = true;
          save.minigameDropHighScore = best;
          if (typeof persist === 'function') {
            const pending = persist();
            if (pending && typeof pending.then === 'function') {
              Promise.resolve(pending).catch(reportSaveFailure);
            }
          } else {
            reportSaveFailure();
          }
        } else {
          ui.note.textContent = 'セーブデータがないため、報酬は反映されません。';
        }
      } catch {
        reportSaveFailure();
      }

      if (credited) {
        try { if (typeof updateCoins === 'function') updateCoins(); } catch { /* 結果画面は表示する。 */ }
      }

      ui['res-score'].textContent = `${nf.format(score)} pt`;
      ui['res-best'].textContent = `${nf.format(best)} pt`;
      ui['res-arts'].textContent = `${nf.format(completed.length)} 枚`;
      ui['res-combo'].textContent = `${nf.format(maxCombo)} コンボ`;
      ui['res-coins'].textContent = credited ? `＋${nf.format(earned)}` : '未付与';
      ui.gallery.replaceChildren(...completed.map(makeThumbnail));
      ui.gallery.hidden = completed.length === 0;
      showPane('result');
      ui.retry.focus({ preventScroll:true });
      playSound('fanfare');
    }

    function startGame() {
      if (phase !== 'title' && phase !== 'result') return;
      window.clearInterval(timer);
      for (const animation of particles) animation.cancel();
      run++;
      playSound('init');
      score = 0;
      maxCombo = 0;
      completed = [];
      lastSecond = -1;
      ending = false;
      paused = false;
      pausedAt = 0;
      cursor = 0;
      drag = null;
      keyboardMode = true;
      art = nextArt();
      board = makeBoard();
      ui.score.textContent = '0 pt';
      ui.end.disabled = false;
      ghost.hidden = true;
      ui.move.classList.remove('afid-visible');
      status.textContent = 'なぞって、そろえて、絵を完成させよう！';
      phase = 'ready';
      renderArt();
      renderBoard();
      showPane('game');
      gridEl.focus({ preventScroll:true });
      deadline = performance.now() + GAME_MS;
      timer = window.setInterval(tick, 40);
      tick();
    }

    function cleanup(notify) {
      if (phase === 'closed') return;
      phase = 'closed';
      run++;
      window.clearInterval(timer);
      controller.abort();
      for (const animation of particles) animation.cancel();
      if (root.open) root.close();
      root.remove();
      active = false;
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll:true });
      }
      if (notify && typeof onClose === 'function') onClose();
    }

    listen(ui.start, 'click', startGame);
    listen(ui.retry, 'click', startGame);
    listen(ui.pause, 'click', pauseGame);
    listen(ui.resume, 'click', resumeGame);
    listen(ui['pause-end'], 'click', () => { paused = false; showPane('game'); requestEnd(); });
    listen(ui['close-pause'], 'click', () => cleanup(true));
    listen(ui.end, 'click', requestEnd);
    listen(ui['close-title'], 'click', () => cleanup(true));
    listen(ui['close-result'], 'click', () => cleanup(true));
    listen(root, 'close', () => cleanup(true));
    listen(root, 'cancel', e => {
      e.preventDefault();
      if (phase === 'title' || phase === 'result') cleanup(true);
      else if (paused) resumeGame();
      else if (drag && checkTime()) finishDrag(false);
      else if (phase === 'ready') pauseGame();
    });
    listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        if (drag && checkTime()) finishDrag(false);
        pauseGame();
      } else {
        tick();
      }
    });

    ui['best-title'].textContent = `ハイスコア：${nf.format(savedBest())} pt`;
    document.body.append(root);
    try {
      root.showModal();
      active = true;
    } catch (error) {
      cleanup(false);
      throw error;
    }
  };

  if (typeof AF_LOADED !== 'undefined' && AF_LOADED && typeof AF_LOADED.push === 'function') {
    AF_LOADED.push('minigame_drop.js');
  } else if (typeof AF_LOADED === 'undefined') {
    window.AF_LOADED = ['minigame_drop.js'];
  }
})();
