// File: minigame_drop2.js
(function () {
  'use strict';

  const CFG = Object.freeze({
    cols: 6,
    rows: 6,
    gameMs: 90000,
    moveMs: 4500,
    bonusMs: 8000,
    clearCoins: 5,
    pointsPerCoin: 150,
    galleryKey: 'minigameDrop2Gallery',
    demoGalleryKey: 'minigameDrop2DemoGallery',
    maxColors: 6,
    minColors: 4,
    maxWaves: 12,
    rushCombo: 4
  });

  const BOMB = -1;
  const SYMBOLS = ['●', '▲', '■', '◆', '✚', '⬟'];
  const DECOYS = ['#e75f78', '#48a9e6', '#edaf36', '#66c878', '#a678de', '#e97942'];
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const ORDERS = {
    bottom: '下から上へ',
    sweep: '左から右へ',
    outline: '輪郭から内側へ',
    center: '中心から外側へ'
  };
  const now = () => performance.now();
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const count = (v) => Math.max(0, Math.floor(Number(v) || 0));

  let active = null;

  function getSave() {
    if (typeof save !== 'undefined' && save && typeof save === 'object') return save;
    if (!window.save || typeof window.save !== 'object') window.save = {};
    return window.save;
  }

  function persistSave(refreshCoins) {
    try {
      if (typeof persist === 'function') persist();
      else if (typeof window.persist === 'function') window.persist();
    } catch (e) {
      console.warn('[minigame_drop2] 保存に失敗しました', e);
    }
    if (refreshCoins) {
      try {
        if (typeof updateCoins === 'function') updateCoins();
        else if (typeof window.updateCoins === 'function') window.updateCoins();
      } catch (e) {
        console.warn('[minigame_drop2] コイン表示を更新できませんでした', e);
      }
    }
  }

  function loadCatalog() {
    const colorCtx = document.createElement('canvas').getContext('2d');
    const colorCache = new Map();

    function normalizeColor(value) {
      if (typeof value !== 'string') return null;
      if (colorCache.has(value)) return colorCache.get(value);
      colorCtx.fillStyle = '#010203';
      colorCtx.fillStyle = value;
      const a = colorCtx.fillStyle;
      colorCtx.fillStyle = '#040506';
      colorCtx.fillStyle = value;
      const b = colorCtx.fillStyle;
      const valid = a === b && !/^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/i.test(a);
      const result = valid ? a : null;
      colorCache.set(value, result);
      return result;
    }

    function normalize(raw, index) {
      if (!raw || typeof raw !== 'object') return null;
      let rows = raw.pixels ?? raw.rows ?? raw.grid;
      if (typeof rows === 'string') rows = rows.trim().split(/\r?\n|\//);
      if (!rows && Array.isArray(raw.cells) &&
          Number.isInteger(raw.w) && raw.w > 0 && raw.w <= 64 &&
          Number.isInteger(raw.h) && raw.h > 0 && raw.h <= 64 &&
          raw.cells.length === raw.w * raw.h) {
        rows = Array.from({ length: raw.h }, (_, y) =>
          raw.cells.slice(y * raw.w, (y + 1) * raw.w));
      }
      if (!Array.isArray(rows) || !rows.length || rows.length > 64) return null;
      if (rows.some((r) => !r || !Number.isInteger(r.length) || r.length > 64)) return null;

      const w = Math.max(...rows.map((r) => r.length));
      const h = rows.length;
      if (!w) return null;
      const colors = [];
      const colorIndex = new Map();
      const pixels = new Int16Array(w * h).fill(-1);
      const palette = raw.palette ?? raw.colors;
      const base = raw.indexBase === 1 ? 1 : 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < rows[y].length; x++) {
          const v = rows[y][x];
          if (v == null || v === '.' || v === ' ' || v === '_' || v === -1) continue;
          let css = v;
          if (Array.isArray(palette)) {
            const n = typeof v === 'number' ? v :
              typeof v === 'string' && /^[0-9a-z]$/i.test(v) ? parseInt(v, 36) : NaN;
            css = Number.isInteger(n) ? palette[n - base] : null;
          } else if (palette && typeof palette === 'object') {
            css = Object.prototype.hasOwnProperty.call(palette, v) ? palette[v] : null;
          }
          const col = normalizeColor(css);
          if (!col) continue;
          if (!colorIndex.has(col)) {
            colorIndex.set(col, colors.length);
            colors.push(col);
          }
          pixels[y * w + x] = colorIndex.get(col);
        }
      }

      if (!colors.length) return null;
      const id = typeof raw.id === 'string' ||
        (typeof raw.id === 'number' && Number.isFinite(raw.id)) ? raw.id : index + 1;
      const order = Object.prototype.hasOwnProperty.call(ORDERS, raw.order) ? raw.order : null;
      return {
        id, no: index + 1, w, h, colors, pixels, order,
        name: typeof raw.name === 'string' ? raw.name : `アート No.${index + 1}`
      };
    }

    for (const hook of ['AF_DROP_ARTS', 'AF_PIXEL_ARTS']) {
      try {
        const data = window[hook];
        const raw = typeof data === 'function' ? data() : data;
        if (!Array.isArray(raw)) continue;
        const seen = new Set();
        const arts = [];
        raw.forEach((entry, i) => {
          const a = normalize(entry, i);
          if (!a || seen.has(String(a.id))) return;
          seen.add(String(a.id));
          arts.push(a);
        });
        if (arts.length) {
          if (arts.length !== raw.length) {
            console.warn(`[minigame_drop2] ${hook}: ${arts.length}/${raw.length} 作品を読み込みました`);
          }
          return { arts, demo: false };
        }
      } catch (e) {
        console.warn(`[minigame_drop2] ${hook} を読み込めませんでした`, e);
      }
    }

    // Antflow 本体の ARTS / getArt / HEX から全ステージを読み込む
    if (typeof ARTS !== 'undefined' && Array.isArray(ARTS) && typeof getArt === 'function' &&
        typeof HEX !== 'undefined' && Array.isArray(HEX)) {
      const arts = [];
      for (let i = 0; i < ARTS.length; i++) {
        try {
          const data = getArt(i + 1);
          if (!data || !data.grid) continue;
          const a = normalize({
            id: i + 1,
            name: ARTS[i]?.n || `ステージ ${i + 1}`,
            palette: HEX,
            w: data.w ?? data.W,
            h: data.h ?? data.H,
            cells: Array.from(data.grid)
          }, i);
          if (a) arts.push(a);
        } catch (_) {}
      }
      if (arts.length) return { arts, demo: false };
    }

    const shapes = [
      ['ねこ', '..1...1../.121.121./.1222221./122422421/122232221/.1222221./..11111..'],
      ['きのこ', '...111.../..12221../.1232321./122222221/.1111111./...131.../...111...'],
      ['ほし', '....1..../...121.../111222111/.1222221./..12321../.121.121./.11...11.'],
      ['さかな', '........./..111..1./.1222112./124222121/.1222112./..111..1./.........'],
      ['ロボ', '..1....../..11111../.1222221./.1422241./.1223221./..11111../..1...1..'],
      ['うさぎ', '..11.11../..13.31../..13.31../.1222221./.1422241./.1223221./..11111..'],
      ['どんぐり', '....11.../...11..../..11111../.1333331./.1111111./..12221../...111...'],
      ['花', '...111.../.1112111./.1223221./..11111../....1..../..131..../...11....'],
      ['カップ', '........./.111111../.12222211/.12222221/..122211./...111.../.1111111.'],
      ['ランタン', '...111.../...1.1.../..11111../..12321../..12321../..12221../..11111..'],
      ['ちょう', '.11...11./1221.1221/123212321/.1222221./.1221221./..11.11../.........']
    ];
    const names = ['あさの', 'ゆうぐれの', 'つきよの', 'ほしぞらの', 'こもれびの',
      'あめあがりの', 'はるの', 'なつの', 'あきの', 'ふゆの', 'にじいろの'];
    const arts = Array.from({ length: 121 }, (_, i) => {
      const [name, shape] = shapes[i % shapes.length];
      const variant = Math.floor(i / shapes.length);
      const hue = (variant * 33 + (i % shapes.length) * 11) % 360;
      return normalize({
        id: `demo-${i + 1}`,
        name: names[variant] + name,
        indexBase: 1,
        pixels: shape,
        palette: [
          `hsl(${hue},45%,29%)`, `hsl(${hue},72%,60%)`,
          `hsl(${(hue + 55) % 360},80%,77%)`, '#f8f6ff'
        ]
      }, i);
    });
    return { arts, demo: true };
  }

  function prepareArt(art) {
    const { w, h, pixels, colors } = art;
    const lists = colors.map(() => []);
    const depth = new Uint16Array(pixels.length);
    const edgeQueue = [];
    let sx = 0, sy = 0, total = 0;

    function visitNeighbors(p, fn) {
      const y = Math.floor(p / w), x = p % w;
      for (const [dy, dx] of DIRS) {
        const ny = y + dy, nx = x + dx;
        fn(ny >= 0 && ny < h && nx >= 0 && nx < w ? ny * w + nx : -1);
      }
    }

    pixels.forEach((c, p) => {
      if (c < 0) return;
      lists[c].push(p);
      sx += p % w;
      sy += Math.floor(p / w);
      total++;
      visitNeighbors(p, (q) => {
        if (!depth[p] && (q < 0 || pixels[q] < 0)) {
          depth[p] = 1;
          edgeQueue.push(p);
        }
      });
    });
    for (let i = 0; i < edgeQueue.length; i++) {
      const p = edgeQueue[i];
      visitNeighbors(p, (q) => {
        if (q >= 0 && pixels[q] >= 0 && !depth[q]) {
          depth[q] = depth[p] + 1;
          edgeQueue.push(q);
        }
      });
    }

    const cx = sx / total, cy = sy / total;
    const mode = art.order || (h > w * 1.15 ? 'bottom' : w > h * 1.15 ? 'sweep' :
      total < w * h * 0.55 ? 'outline' : ['outline', 'bottom', 'center'][art.no % 3]);
    function priority(p) {
      const y = Math.floor(p / w), x = p % w;
      if (mode === 'bottom') return -y * 100 + Math.abs(x - cx);
      if (mode === 'sweep') return x * 100 + Math.abs(y - cy);
      if (mode === 'outline') return depth[p] * 100 - y;
      return Math.hypot(x - cx, y - cy);
    }
    const ordered = (a, b) => priority(a) - priority(b) || a - b;
    const ranked = lists.map((_, i) => i).sort((a, b) => lists[b].length - lists[a].length);
    const main = ranked.slice(0, CFG.maxColors);
    const minor = ranked.slice(CFG.maxColors).flatMap((i) => lists[i]).sort(ordered);
    const queues = main.map((i) => lists[i].sort(ordered));
    const boardColors = main.map((i) => colors[i]);

    // 単色・少色の絵でも盤面に複数の色を用意し、初期マッチを避ける。
    const rgb = (s) => {
      const m = /^#([0-9a-f]{6})$/i.exec(s);
      return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
    };
    function isDistinct(a, b) {
      const x = rgb(a), y = rgb(b);
      return a !== b && (!x || !y || Math.hypot(...x.map((v, i) => v - y[i])) > 65);
    }
    for (const c of DECOYS) {
      if (boardColors.length >= CFG.minColors) break;
      if (boardColors.every((other) => isDistinct(c, other))) {
        boardColors.push(c);
        queues.push([]);
      }
    }
    for (const c of DECOYS) {
      if (boardColors.length >= CFG.minColors) break;
      if (!boardColors.includes(c)) {
        boardColors.push(c);
        queues.push([]);
      }
    }

    return {
      art, mode, total, queues, boardColors, minor,
      cursor: queues.map(() => 0),
      minorCursor: 0,
      mainTotal: total - minor.length,
      mainPainted: 0,
      reserved: 0,
      perDrop: Math.max(1, Math.ceil((total - minor.length) / 54)),
      paintAt: new Float64Array(w * h).fill(Infinity),
      lastPaintAt: 0
    };
  }

  function makeAudio() {
    let ctx = null;
    function unlock() {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!ctx && Audio) ctx = new Audio();
        if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
      } catch (_) {}
    }
    function tone(freq, delay = 0, duration = 0.12, volume = 0.055, type = 'triangle') {
      if (!ctx || ctx.state !== 'running') return;
      try {
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration + 0.02);
      } catch (_) {}
    }
    return {
      unlock,
      pick: () => tone(660, 0, 0.06, 0.035),
      move: () => tone(480, 0, 0.04, 0.025),
      pop: (n) => tone(392 * 2 ** (Math.min(n, 12) / 12)),
      bomb: () => [180, 330, 660].forEach((f, i) => tone(f, i * 0.055, 0.19)),
      rush: () => [440, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.05)),
      complete: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.3)),
      end: () => [659, 523, 392].forEach((f, i) => tone(f, i * 0.11, 0.17)),
      close() {
        if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
        ctx = null;
      }
    };
  }

  function installStyle() {
    if (document.getElementById('afdrop-style')) return;
    const style = document.createElement('style');
    style.id = 'afdrop-style';
    style.textContent = `
      #afdrop{position:fixed;inset:0;z-index:10000;color:#f8f6ff;
        background:radial-gradient(ellipse at top,#393e80,#171931 65%,#101122);
        font:15px system-ui,-apple-system,"Yu Gothic",sans-serif;
        overscroll-behavior:contain}
      #afdrop *{box-sizing:border-box}
      #afdrop .afdrop-shell{position:relative;height:100%;max-width:540px;margin:auto;
        display:flex;flex-direction:column;gap:5px;
        padding:calc(env(safe-area-inset-top) + 6px) 8px calc(env(safe-area-inset-bottom) + 6px)}
      #afdrop .afdrop-head{display:flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums}
      #afdrop .afdrop-head span{font-size:13px;font-weight:800;white-space:nowrap}
      #afdrop .afdrop-spacer{flex:1}
      #afdrop button{font:inherit;font-weight:750;cursor:pointer;border:0;border-radius:10px;
        padding:8px 11px;background:#ffe078;color:#252038;min-height:38px}
      #afdrop button.secondary{background:#454970;color:#fff}
      #afdrop button:focus-visible,#afdrop canvas:focus-visible{outline:2px solid #ffe078;outline-offset:-2px}
      #afdrop .afdrop-bar{height:5px;overflow:hidden;border-radius:6px;background:#ffffff22;flex:none}
      #afdrop .afdrop-bar i{display:block;height:100%;background:#78e7cc;transform-origin:left}
      #afdrop .afdrop-bar i.low{background:#ff8a9e}
      #afdrop .afdrop-meta,#afdrop .afdrop-help{text-align:center;font-size:12px;line-height:1.35}
      #afdrop .afdrop-chips{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;min-height:24px}
      #afdrop .afdrop-chip{display:inline-flex;align-items:center;gap:4px;border-radius:14px;
        padding:2px 6px;background:#ffffff15;font-size:11px;white-space:nowrap}
      #afdrop .afdrop-chip b{display:grid;place-items:center;width:17px;height:17px;border-radius:50%;
        border:1px solid #ffffffaa;color:#fff;text-shadow:0 0 2px #000,0 0 3px #000}
      #afdrop .afdrop-chip.target{outline:2px solid #ffe078}
      #afdrop .afdrop-chip.done{opacity:.58}
      #afdrop .afdrop-stage{flex:1;min-height:0;position:relative}
      #afdrop .afdrop-stage canvas{display:block;width:100%;height:100%;
        touch-action:none;user-select:none;-webkit-user-select:none}
      #afdrop .afdrop-panel{position:absolute;inset:0;z-index:2;display:grid;place-items:center;
        padding:12px;background:#101122d9}
      #afdrop .afdrop-panel[hidden]{display:none}
      #afdrop .afdrop-card{width:min(100%,430px);max-height:92%;overflow:auto;
        overscroll-behavior:contain;touch-action:pan-y;background:#292d57;border-radius:18px;
        padding:16px;text-align:center}
      #afdrop h2{font-size:23px;margin:4px 0 10px}
      #afdrop p{margin:7px 0;line-height:1.55}
      #afdrop .afdrop-actions{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:12px}
      #afdrop .afdrop-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));
        gap:6px;margin-top:10px}
      #afdrop .afdrop-gallery button{display:flex;flex-direction:column;align-items:center;gap:4px;
        padding:6px 5px;background:#10112280;color:#f8f6ff;border-radius:8px;font-size:10px;
        font-weight:700;line-height:1.25;min-height:0;overflow-wrap:anywhere}
      #afdrop .afdrop-gallery button:active{transform:scale(.96);background:#1c2046}
      #afdrop .afdrop-gallery canvas{display:block;width:100%;height:52px;object-fit:contain;image-rendering:pixelated}
      #afdrop .afdrop-zoom{position:absolute;inset:0;z-index:4;display:grid;place-items:center;
        padding:14px;background:#0a0b18e8}
      #afdrop .afdrop-zoom[hidden]{display:none}
      #afdrop .afdrop-zcard{width:min(100%,360px);background:#292d57;border:1px solid #ffffff26;
        border-radius:18px;padding:16px;text-align:center;box-shadow:0 14px 36px #00000080}
      #afdrop .afdrop-zbox{display:grid;place-items:center;margin:8px auto 10px;padding:12px;
        background:#101122b0;border-radius:14px;width:min(70vw,260px);height:min(70vw,260px)}
      #afdrop .afdrop-zbox canvas{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}
      #afdrop .afdrop-zmeta{font-size:12px;color:#cfd4ff;margin:4px 0 0}
      @media(max-width:350px){#afdrop .afdrop-head{gap:4px}#afdrop .afdrop-head button{padding-inline:6px}}
    `;
    document.head.appendChild(style);
  }

  function openMiniDrop2(onClose) {
    if (active) return;
    installStyle();

    const { arts, demo } = loadCatalog();
    const sv = getSave();
    const galleryKey = demo ? CFG.demoGalleryKey : CFG.galleryKey;
    if (sv[galleryKey] == null) sv[galleryKey] = [];
    const galleryWritable = Array.isArray(sv[galleryKey]);
    const unlocked = new Set((galleryWritable ? sv[galleryKey] : []).map(String));
    const artIds = new Set(arts.map((a) => String(a.id)));
    const galleryCount = () => [...unlocked].filter((id) => artIds.has(id)).length;
    const audio = makeAudio();
    const reduceMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const priorFocus = document.activeElement;

    const root = document.createElement('div');
    root.id = 'afdrop';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'ドロップぬりえDX');
    root.innerHTML = `
      <div class="afdrop-shell">
        <div class="afdrop-head">
          <span data-el="time">90.0秒</span>
          <span data-el="score">0点</span>
          <span data-el="done">完成 0</span>
          <i class="afdrop-spacer"></i>
          <button type="button" class="secondary" data-act="pause" aria-label="一時停止" disabled>Ⅱ</button>
          <button type="button" class="secondary" data-act="gallery">図鑑</button>
          <button type="button" class="secondary" data-act="close" aria-label="閉じる">×</button>
        </div>
        <div class="afdrop-bar"><i data-el="gameBar"></i></div>
        <div class="afdrop-meta" data-el="meta"></div>
        <div class="afdrop-chips" data-el="chips"></div>
        <div class="afdrop-stage"><canvas tabindex="0"
          aria-label="ドロップ盤面。矢印キーで移動、スペースまたは Enter で持つ・離す"></canvas></div>
        <div class="afdrop-bar"><i data-el="moveBar"></i></div>
        <div class="afdrop-help">ドラッグ／矢印＋Space　★はタップで発動</div>
        <div class="afdrop-panel" data-el="panel" hidden></div>
      </div>`;
    document.body.appendChild(root);

    const el = Object.fromEntries([...root.querySelectorAll('[data-el]')].map((n) => [n.dataset.el, n]));
    const pauseBtn = root.querySelector('button[data-act="pause"]');
    const canvas = root.querySelector('.afdrop-stage canvas');
    const ctx = canvas.getContext('2d');
    const cols = CFG.cols, rows = CFG.rows, cells = cols * rows;
    const timings = new Map();
    let raf = 0, observer = null, closed = false;
    let g = { w: 1, h: 1, cell: 1, bx: 0, by: 0, pp: 1, ax: 0, ay: 0 };
    let phase = 'title', galleryFrom = null, pausedAt = 0, userPaused = false;
    let level = null, board = [], drag = null, cursor = Math.floor(cells / 2);
    let showCursor = false, deadline = 0, readyAt = 0;
    let score = 0, completed = 0, clearCoinsPaid = 0, settled = true;
    let result = null, lastFrame = now(), lastHud = '';
    let flyers = [], sparks = [], notices = [], clearing = null;
    let lastArtId = null, arrival = 0;

    active = { close };

    function wait(ms) {
      if (closed) return Promise.resolve(false);
      if (ms <= 0) return Promise.resolve(true);
      return new Promise((resolve) => {
        const id = setTimeout(() => {
          timings.delete(id);
          resolve(!closed);
        }, ms);
        timings.set(id, resolve);
      });
    }

    function layout() {
      const box = canvas.getBoundingClientRect();
      const w = Math.max(1, box.width), h = Math.max(1, box.height);
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);

      const artH = h * 0.44;
      const cell = Math.max(1, Math.min((w - 4) / cols, (h - artH - 8) / rows, 75));
      const bx = (w - cols * cell) / 2;
      const by = artH + Math.max(0, (h - artH - rows * cell) / 2);
      let pp = 1, ax = w / 2, ay = artH / 2;
      if (level) {
        const a = level.art;
        pp = Math.max(0.1, Math.min((w - 20) / a.w, (artH - 14) / a.h, 23));
        if (pp >= 2) pp = Math.floor(pp);
        ax = (w - a.w * pp) / 2;
        ay = (artH - a.h * pp) / 2;
      }
      g = { w, h, cell, bx, by, pp, ax, ay };
    }

    function chooseArt() {
      const others = arts.filter((a) => String(a.id) !== lastArtId);
      const fresh = others.filter((a) => !unlocked.has(String(a.id)));
      return pick(fresh.length ? fresh : others.length ? others : arts);
    }

    function remaining(i) {
      return level.queues[i].length - level.cursor[i];
    }

    function bombTarget() {
      let best = -1, rest = 0;
      for (let i = 0; i < level.queues.length; i++) {
        const n = remaining(i);
        if (n > rest) {
          best = i;
          rest = n;
        }
      }
      return best;
    }

    function sampleColor(excluded = []) {
      const entries = level.boardColors.map((_, i) => ({
        i, weight: excluded.includes(i) ? 0 : remaining(i) > 0 ? 2.5 : 0.8
      }));
      let value = Math.random() * entries.reduce((sum, e) => sum + e.weight, 0);
      for (const e of entries) {
        if (e.weight > 0 && (value -= e.weight) < 0) return e.i;
      }
      return entries.find((e) => e.weight > 0).i;
    }

    function newDrop(color, x, y) {
      return { color, x, y, gone: false, bombAt: false, vanishAt: 0 };
    }

    function newBoard(animated) {
      board = new Array(cells);
      for (let p = 0; p < cells; p++) {
        const x = p % cols, y = Math.floor(p / cols);
        const forbid = [];
        if (x >= 2 && board[p - 1].color === board[p - 2].color) forbid.push(board[p - 1].color);
        if (y >= 2 && board[p - cols].color === board[p - 2 * cols].color) forbid.push(board[p - cols].color);
        board[p] = newDrop(sampleColor(forbid), x, animated && !reduceMotion ? y - rows - 1 : y);
      }
    }

    function loadLevel(animated) {
      level = prepareArt(chooseArt());
      lastArtId = String(level.art.id);
      flyers = [];
      sparks = [];
      clearing = null;
      arrival = animated ? now() : 0;
      lastHud = '';
      newBoard(animated);
      layout();
      refreshArtInfo(now(), true);
    }

    function scanGroups() {
      const marks = new Uint8Array(cells);
      const colorAt = (p) => board[p]?.color ?? BOMB;
      function scan(start, length, step) {
        for (let a = 0; a < length;) {
          const k = colorAt(start + a * step);
          let b = a + 1;
          while (k >= 0 && b < length && colorAt(start + b * step) === k) b++;
          if (k >= 0 && b - a >= 3) {
            for (let i = a; i < b; i++) marks[start + i * step] = 1;
          }
          a = b;
        }
      }
      for (let r = 0; r < rows; r++) scan(r * cols, cols, 1);
      for (let c = 0; c < cols; c++) scan(c, rows, cols);

      const groups = [];
      for (let p = 0; p < cells; p++) {
        if (!marks[p]) continue;
        const color = colorAt(p), positions = [p];
        marks[p] = 0;
        for (let i = 0; i < positions.length; i++) {
          const q = positions[i], y = Math.floor(q / cols), x = q % cols;
          for (const [dy, dx] of DIRS) {
            const ny = y + dy, nx = x + dx;
            if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
            const n = ny * cols + nx;
            if (marks[n] && colorAt(n) === color) {
              marks[n] = 0;
              positions.push(n);
            }
          }
        }
        groups.push({ color, positions });
      }
      return groups;
    }

    function refill() {
      for (let p = 0; p < cells; p++) {
        const d = board[p];
        if (d?.gone) board[p] = d.bombAt ? newDrop(BOMB, p % cols, Math.floor(p / cols)) : null;
      }
      for (let x = 0; x < cols; x++) {
        let write = rows - 1;
        for (let y = rows - 1; y >= 0; y--) {
          const d = board[y * cols + x];
          if (d) board[write-- * cols + x] = d;
        }
        const missing = write + 1;
        while (write >= 0) {
          board[write * cols + x] = newDrop(sampleColor(), x, write - missing - 0.35);
          write--;
        }
      }
    }

    function reservePixel(p, at, source) {
      level.paintAt[p] = at;
      level.lastPaintAt = Math.max(level.lastPaintAt, at);
      level.reserved++;
      if (source != null && !reduceMotion && flyers.length < 220) {
        flyers.push({ p, source, at, start: at - 310 });
      }
    }

    function paint(color, amount, source, delay = 0) {
      const q = level.queues[color];
      const t = now() + delay + (reduceMotion ? 0 : 310);
      for (let i = 0; i < amount && level.cursor[color] < q.length; i++) {
        reservePixel(q[level.cursor[color]++], t + Math.min(i, 11) * 18, source);
        level.mainPainted++;
      }
      const minorGoal = Math.floor(level.minor.length * level.mainPainted / level.mainTotal);
      while (level.minorCursor < minorGoal) {
        reservePixel(level.minor[level.minorCursor++], t + 100, null);
      }
    }

    function markDrop(p, at, becomesBomb = false) {
      Object.assign(board[p], { gone: true, vanishAt: at, bombAt: becomesBomb });
    }

    function notice(text, where = 'board', color = '#ffe078', ms = 850) {
      notices.push({ text, where, color, start: now(), ms });
    }

    function rush(combo) {
      if (bombTarget() < 0) return;
      audio.rush();
      notice('ぬりつぶしラッシュ！', 'art', '#ffe078', 1100);
      let budget = level.perDrop * Math.min(24, combo * 3);
      let n = 0;
      while (budget > 0) {
        const k = bombTarget();
        if (k < 0) break;
        const take = Math.min(remaining(k), budget, level.perDrop * 4);
        paint(k, take, null, Math.min(n++ * 45, 270));
        budget -= take;
      }
      score += combo * 50;
    }

    async function resolveTurn(moved, useBomb) {
      if (phase !== 'play' || closed) return;
      phase = 'turn';
      let combo = 0, waves = 0;

      if (useBomb) {
        const target = bombTarget();
        const time = now();
        const bx = moved % cols, by = Math.floor(moved / cols);
        let hits = 0, lastDelay = 0;
        markDrop(moved, time);
        audio.bomb();
        notice('カラフルボム！');
        for (let p = 0; p < cells; p++) {
          if (target < 0 || board[p].color !== target) continue;
          const delay = reduceMotion ? 0 : Math.hypot(p % cols - bx, Math.floor(p / cols) - by) * 28;
          markDrop(p, time + delay);
          paint(target, level.perDrop, p, delay);
          score += 15;
          hits++;
          lastDelay = Math.max(lastDelay, delay);
        }
        if (!hits && target >= 0) paint(target, level.perDrop * 4, moved);
        if (!await wait(lastDelay + (reduceMotion ? 70 : 190))) return;
        refill();
        if (level.reserved < level.total && !await wait(reduceMotion ? 50 : 260)) return;
        moved = -1;
      }

      while (level.reserved < level.total && waves < CFG.maxWaves) {
        const groups = scanGroups();
        if (!groups.length) break;
        waves++;
        const time = now();
        for (const { color, positions } of groups) {
          combo++;
          const pivot = positions.length >= 4 ?
            (positions.includes(moved) ? moved : positions[Math.floor(positions.length / 2)]) : -1;
          positions.forEach((p, i) => {
            markDrop(p, time, p === pivot);
            paint(color, level.perDrop, p, Math.min(i, 9) * 15);
            score += Math.round(10 * (1 + (combo - 1) * 0.25));
          });
          if (pivot >= 0) notice('★ カラフルボム誕生！', 'board', '#d7f8ff', 650);
        }
        audio.pop(combo);
        if (combo > 1) notice(`${combo} COMBO`, 'board', '#fff', 670);
        if (!await wait(reduceMotion ? 70 : 180)) return;
        refill();
        if (level.reserved < level.total && !await wait(reduceMotion ? 50 : 275)) return;
        moved = -1;
      }

      if (combo >= CFG.rushCombo) rush(combo);
      if (level.reserved >= level.total) {
        if (!await wait(level.lastPaintAt - now() + (reduceMotion ? 0 : 90))) return;
        await completeArt();
        return;
      }
      if (waves >= CFG.maxWaves && scanGroups().length) {
        newBoard(true);
        readyAt = now() + (reduceMotion ? 0 : 260);
        notice('盤面をリフレッシュ');
      }
      if (now() >= deadline) endGame();
      else phase = 'play';
    }

    async function completeArt() {
      if (closed) return;
      phase = 'clear';
      const t = now();
      const left = Math.max(0, deadline - t);
      pausedAt = t;
      const art = level.art;
      const id = String(art.id);
      completed++;
      score += 300 + 100 * completed;
      clearCoinsPaid += CFG.clearCoins;
      sv.coins = count(sv.coins) + CFG.clearCoins;
      sv.minigameDrop2HighScore = Math.max(count(sv.minigameDrop2HighScore), score);
      if (!unlocked.has(id)) {
        unlocked.add(id);
        if (galleryWritable) sv[galleryKey].push(art.id);
      }
      persistSave(true);
      if (closed) return;

      audio.complete();
      clearing = { start: t, duration: reduceMotion ? 850 : 1550 };
      notice('かんせい！ ' + art.name, 'art', '#ffe078', clearing.duration);
      notice(`+${CFG.clearCoins}コイン${left > 0 ? `  ＋${CFG.bonusMs / 1000}秒` : ''}`,
        'reward', '#a2ffd8', clearing.duration);
      if (!reduceMotion) {
        sparks = Array.from({ length: 60 }, (_, i) => {
          const a = Math.random() * Math.PI * 2;
          const v = 30 + Math.random() * 185;
          return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
            life: 0.5 + Math.random() * 0.85, color: level.art.colors[i % level.art.colors.length] };
        });
      }
      if (!await wait(clearing.duration)) return;
      pausedAt = 0;
      if (!left) {
        deadline = now();
        endGame();
        return;
      }
      notices = [];
      loadLevel(true);
      readyAt = now() + (reduceMotion ? 0 : 330);
      deadline = now() + left + CFG.bonusMs;
      phase = 'play';
    }

    function settle() {
      if (settled) return result;
      settled = true;
      const scoreCoins = Math.floor(score / CFG.pointsPerCoin);
      const high = Math.max(count(sv.minigameDrop2HighScore), score);
      result = { score, completed, coins: scoreCoins + clearCoinsPaid, high };
      sv.coins = count(sv.coins) + scoreCoins;
      sv.minigameDrop2HighScore = high;
      persistSave(true);
      return result;
    }

    function endGame() {
      if (closed || phase === 'result') return;
      stopDrag(false);
      phase = 'result';
      pausedAt = 0;
      deadline = now();
      audio.end();
      settle();
      if (!closed) showResult();
    }

    function startGame() {
      audio.unlock();
      score = completed = clearCoinsPaid = 0;
      settled = false;
      result = null;
      galleryFrom = null;
      pausedAt = 0;
      userPaused = false;
      notices = [];
      cursor = Math.floor(cells / 2);
      showCursor = false;
      loadLevel(true);
      readyAt = now() + (reduceMotion ? 0 : 330);
      deadline = now() + CFG.gameMs;
      phase = 'play';
      hidePanel();
    }

    function button(text, action, secondary = false) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.dataset.act = action;
      if (secondary) b.className = 'secondary';
      return b;
    }

    function showPanel(title, paragraphs, actions) {
      const card = document.createElement('div');
      card.className = 'afdrop-card';
      const heading = document.createElement('h2');
      heading.textContent = title;
      card.append(heading);
      for (const text of paragraphs) {
        const p = document.createElement('p');
        p.textContent = text;
        card.append(p);
      }
      const bar = document.createElement('div');
      bar.className = 'afdrop-actions';
      actions.forEach((a) => bar.append(button(...a)));
      card.append(bar);
      el.panel.replaceChildren(card);
      el.panel.hidden = false;
      root.querySelector('.afdrop-head').inert = true;
      canvas.tabIndex = -1;
      bar.querySelector('button')?.focus({ preventScroll: true });
      return card;
    }

    function hidePanel() {
      el.panel.hidden = true;
      el.panel.replaceChildren();
      root.querySelector('.afdrop-head').inert = false;
      canvas.tabIndex = 0;
      canvas.focus({ preventScroll: true });
    }

    function showTitle() {
      const lines = [
        '同じ色・記号を縦か横に3つ以上そろえると、絵の形に沿って塗られます。',
        '4個以上をまとめて消すと★ボム。タップで、絵にいちばん多く残っている色を消せます。',
        `${CFG.rushCombo}コンボでラッシュ。ドロップを動かし始めてから1手${CFG.moveMs / 1000}秒です。`,
        `ハイスコア ${count(sv.minigameDrop2HighScore)}点　図鑑 ${galleryCount()} / ${arts.length}`
      ];
      if (demo) lines.push('既存の作品データが見つからないため、デモ作品を使用しています。');
      if (!galleryWritable) lines.push('図鑑の保存形式が異なるため、このプレイの解放状況は保存しません。');
      showPanel('ドロップぬりえDX', lines,
        [['スタート', 'start'], ['図鑑', 'gallery', true], ['閉じる', 'close', true]]);
    }

    function showResult() {
      showPanel('タイムアップ！', [
        `スコア ${result.score}点　ハイスコア ${result.high}点`,
        `完成 ${result.completed}枚　獲得 +${result.coins}コイン`,
        `図鑑 ${galleryCount()} / ${arts.length}`
      ], [['もう一度', 'start'], ['図鑑', 'gallery', true], ['閉じる', 'close', true]]);
    }

    let zoomBox = null;
    let zoomTrigger = null;

    function drawArtCanvas(cv, art, isOpen) {
      cv.width = art.w;
      cv.height = art.h;
      const c = cv.getContext('2d');
      art.pixels.forEach((n, p) => {
        if (n < 0) return;
        c.fillStyle = isOpen ? art.colors[n] : '#74799a';
        c.fillRect(p % art.w, Math.floor(p / art.w), 1, 1);
      });
    }

    function closeZoom() {
      if (!zoomBox || zoomBox.hidden) return;
      zoomBox.hidden = true;
      zoomBox.replaceChildren();
      el.panel.inert = false;
      if (zoomTrigger?.isConnected) zoomTrigger.focus({ preventScroll: true });
      zoomTrigger = null;
    }

    function openZoom(index, trigger) {
      if (closed || !arts.length) return;
      if (trigger) zoomTrigger = trigger;
      let cur = ((index % arts.length) + arts.length) % arts.length;
      if (!zoomBox) {
        zoomBox = document.createElement('div');
        zoomBox.className = 'afdrop-zoom';
        zoomBox.hidden = true;
        zoomBox.addEventListener('click', (e) => {
          if (e.target === zoomBox) { audio.tap(); closeZoom(); }
        });
        root.append(zoomBox);
      }
      const renderZoom = () => {
        const art = arts[cur];
        const isOpen = unlocked.has(String(art.id));
        const zcard = document.createElement('div');
        zcard.className = 'afdrop-zcard';
        const title = document.createElement('h2');
        title.textContent = isOpen ? `No.${art.no} ${art.name}` : `No.${art.no} ？？？`;
        const box = document.createElement('div');
        box.className = 'afdrop-zbox';
        const big = document.createElement('canvas');
        drawArtCanvas(big, art, isOpen);
        box.append(big);
        const meta = document.createElement('p');
        meta.className = 'afdrop-zmeta';
        meta.textContent = isOpen
          ? `${art.w}×${art.h} マス（${art.colors.length}色）`
          : 'ゲームで完成させると色がつくよ！';
        const bar = document.createElement('div');
        bar.className = 'afdrop-actions';
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'secondary';
        prevBtn.textContent = '◀ まえ';
        prevBtn.addEventListener('click', () => { audio.tap(); cur = (cur - 1 + arts.length) % arts.length; renderZoom(); });
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = 'とじる';
        closeBtn.addEventListener('click', () => { audio.tap(); closeZoom(); });
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'secondary';
        nextBtn.textContent = 'つぎ ▶';
        nextBtn.addEventListener('click', () => { audio.tap(); cur = (cur + 1) % arts.length; renderZoom(); });
        bar.append(prevBtn, closeBtn, nextBtn);
        zcard.append(title, box, meta, bar);
        zoomBox.replaceChildren(zcard);
      };
      renderZoom();
      zoomBox.hidden = false;
      el.panel.inert = true;
      zoomBox.querySelector('.afdrop-actions button:nth-child(2)')?.focus({ preventScroll: true });
    }

    function openGallery() {
      if (closed || drag || userPaused || !['title', 'play', 'result'].includes(phase) || galleryFrom !== null) return;
      if (phase === 'play' && now() >= deadline) {
        endGame();
        return;
      }
      galleryFrom = phase;
      if (phase === 'play') pausedAt = now();
      const card = showPanel(demo ? 'デモ作品の図鑑' : '完成アート図鑑',
        [`${galleryCount()} / ${arts.length} 枚（タップで拡大）`], [['戻る', 'back']]);
      const grid = document.createElement('div');
      grid.className = 'afdrop-gallery';
      arts.forEach((art, idx) => {
        const tile = document.createElement('button');
        tile.type = 'button';
        const thumb = document.createElement('canvas');
        const isOpen = unlocked.has(String(art.id));
        drawArtCanvas(thumb, art, isOpen);
        tile.append(thumb, document.createTextNode(isOpen ? art.name : `No.${art.no}　？？？`));
        tile.addEventListener('click', () => { audio.tap(); openZoom(idx, tile); });
        grid.append(tile);
      });
      card.append(grid);
    }

    function closeGallery() {
      closeZoom();
      const from = galleryFrom;
      galleryFrom = null;
      if (from === 'play') {
        deadline += now() - pausedAt;
        pausedAt = 0;
        hidePanel();
      } else if (from === 'result') showResult();
      else showTitle();
    }

    function pauseGame() {
      if (closed || userPaused || phase !== 'play' || galleryFrom !== null) return;
      if (drag) stopDrag(false);
      if (now() >= deadline) { endGame(); return; }
      userPaused = true;
      pausedAt = now();
      audio.tap();
      showPanel('一時停止中', ['タイマーは止まっています。'],
        [['再開', 'resume'], ['やり直す', 'restart', true], ['閉じる', 'close', true]]);
    }

    function resumeGame() {
      if (!userPaused || closed) return;
      deadline += now() - pausedAt;
      pausedAt = 0;
      userPaused = false;
      audio.tap();
      hidePanel();
      canvas.focus();
    }

    function point(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function boardIndex(pt, limit) {
      const x = Math.floor((pt.x - g.bx) / g.cell);
      const y = Math.floor((pt.y - g.by) / g.cell);
      if (!limit && (x < 0 || x >= cols || y < 0 || y >= rows)) return -1;
      return clamp(y, 0, rows - 1) * cols + clamp(x, 0, cols - 1);
    }

    function canGrab() {
      const t = now();
      return phase === 'play' && galleryFrom === null && !userPaused && !drag && t >= readyAt && t < deadline;
    }

    function grab(p, pointerId, pt) {
      if (!canGrab()) return;
      audio.unlock();
      audio.pick();
      cursor = p;
      drag = { p, pointerId, pt, original: board.slice(), moved: false, until: 0 };
    }

    function moveTo(target) {
      if (!drag) return;
      if (now() >= deadline || (drag.until && now() >= drag.until)) {
        stopDrag(true);
        return;
      }
      let steps = 0;
      while (drag.p !== target) {
        const y = Math.floor(drag.p / cols), x = drag.p % cols;
        const dy = Math.floor(target / cols) - y, dx = target % cols - x;
        const next = Math.abs(dx) >= Math.abs(dy) ?
          drag.p + Math.sign(dx) : drag.p + Math.sign(dy) * cols;
        [board[drag.p], board[next]] = [board[next], board[drag.p]];
        drag.p = next;
        cursor = next;
        if (!drag.moved) {
          drag.moved = true;
          drag.until = now() + CFG.moveMs;
        }
        steps++;
      }
      if (steps) audio.move();
    }

    function stopDrag(commit) {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (d.pointerId != null && canvas.hasPointerCapture(d.pointerId)) {
        try { canvas.releasePointerCapture(d.pointerId); } catch (_) {}
      }
      if (!commit) {
        board = d.original;
        return;
      }
      const bomb = board[d.p].color === BOMB;
      if (bomb || d.moved) {
        resolveTurn(d.p, bomb).catch((e) => {
          console.error('[minigame_drop2] ターン処理に失敗しました', e);
          if (!closed) close();
        });
      }
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const pt = point(e), p = boardIndex(pt, false);
      if (p < 0 || !canGrab()) return;
      e.preventDefault();
      canvas.focus({ preventScroll: true });
      showCursor = false;
      grab(p, e.pointerId, pt);
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.preventDefault();
      drag.pt = point(e);
      moveTo(boardIndex(drag.pt, true));
    });
    function pointerEnd(e) {
      if (drag && drag.pointerId === e.pointerId) stopDrag(e.type === 'pointerup');
    }
    window.addEventListener('pointerup', pointerEnd);
    window.addEventListener('pointercancel', pointerEnd);
    canvas.addEventListener('lostpointercapture', pointerEnd);

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (zoomBox && !zoomBox.hidden) closeZoom();
        else if (userPaused) resumeGame();
        else if (galleryFrom !== null) closeGallery();
        else close();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = [...root.querySelectorAll('button,canvas[tabindex="0"]')]
          .filter((n) => !n.closest('[hidden],[inert]'));
        const i = focusable.indexOf(document.activeElement);
        if (focusable.length && (i < 0 || (e.shiftKey ? i === 0 : i === focusable.length - 1))) {
          e.preventDefault();
          focusable[e.shiftKey ? focusable.length - 1 : 0].focus();
        }
        return;
      }
      if (phase !== 'play' || galleryFrom !== null || userPaused || document.activeElement !== canvas) return;
      const dirs = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (dirs[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        if (drag && drag.pointerId != null) return;
        showCursor = true;
        const [dy, dx] = dirs[e.key];
        const y = clamp(Math.floor(cursor / cols) + dy, 0, rows - 1);
        const x = clamp(cursor % cols + dx, 0, cols - 1);
        if (drag) moveTo(y * cols + x);
        else cursor = y * cols + x;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        showCursor = true;
        if (drag && drag.pointerId == null) stopDrag(true);
        else if (!drag) grab(cursor, null, null);
      }
    }

    root.addEventListener('click', (e) => {
      const a = e.target.closest('button[data-act]')?.dataset.act;
      if (a === 'close') close();
      else if (a === 'pause') pauseGame();
      else if (a === 'resume') resumeGame();
      else if (a === 'restart') { userPaused = false; pausedAt = 0; startGame(); }
      else if (a === 'gallery') openGallery();
      else if (a === 'back') closeGallery();
      else if (a === 'start' && (phase === 'title' || phase === 'result')) startGame();
    });

    function onVisibility() {
      if (document.hidden && phase === 'play' && !userPaused && galleryFrom === null) pauseGame();
    }
    document.addEventListener('visibilitychange', onVisibility);

    function close() {
      if (closed) return;
      closed = true;
      for (const [id, resolve] of timings) {
        clearTimeout(id);
        resolve(false);
      }
      timings.clear();
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', layout);
      window.removeEventListener('pointerup', pointerEnd);
      window.removeEventListener('pointercancel', pointerEnd);
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('visibilitychange', onVisibility);
      stopDrag(false);
      audio.close();
      root.remove();
      active = null;
      settle();
      if (priorFocus?.isConnected && !active) priorFocus.focus?.({ preventScroll: true });
      if (typeof onClose === 'function') onClose();
    }

    function drawDrop(d, x, y, r, target, t) {
      const bomb = d.color === BOMB;
      ctx.save();
      if (d.gone && t >= d.vanishAt) {
        const fade = clamp((t - d.vanishAt) / 180, 0, 1);
        ctx.globalAlpha = 1 - fade;
        if (!reduceMotion) r *= 1 + fade * 0.26;
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (bomb) {
        const rainbow = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
        rainbow.addColorStop(0, '#ffe078');
        rainbow.addColorStop(0.5, '#f483bb');
        rainbow.addColorStop(1, '#77dff8');
        ctx.fillStyle = rainbow;
      } else ctx.fillStyle = level.boardColors[d.color];
      ctx.fill();
      ctx.strokeStyle = '#ffffff90';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      if (bomb && target >= 0) {
        ctx.beginPath();
        ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = level.boardColors[target];
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#211a34';
      ctx.lineWidth = Math.max(1.3, r * 0.15);
      ctx.font = `800 ${Math.max(7, Math.floor(r * 1.05))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const symbol = bomb ? '★' : SYMBOLS[d.color];
      ctx.strokeText(symbol, x, y + 0.5);
      ctx.fillText(symbol, x, y + 0.5);
      ctx.restore();
    }

    function drawArt(t) {
      const { art, queues, paintAt } = level;
      ctx.save();
      const aw = art.w * g.pp, ah = art.h * g.pp;
      if (!reduceMotion && clearing) {
        const u = clamp((t - clearing.start) / clearing.duration, 0, 1);
        const scale = 1 + 0.12 * Math.sin(u * Math.PI);
        ctx.translate(g.w / 2, g.ay + ah / 2);
        ctx.scale(scale, scale);
        ctx.translate(-g.w / 2, -(g.ay + ah / 2));
        ctx.shadowColor = '#ffe078';
        ctx.shadowBlur = 22 * (1 - u);
      } else if (!reduceMotion && arrival) {
        const u = clamp((t - arrival) / 320, 0, 1);
        ctx.translate((1 - u) ** 3 * g.w * 0.38, 0);
        ctx.globalAlpha = 0.35 + u * 0.65;
      }
      ctx.fillStyle = '#101226';
      ctx.fillRect(g.ax - 5, g.ay - 5, aw + 10, ah + 10);
      ctx.shadowBlur = 0;

      const fronts = new Set(queues.map((q, i) => q[level.cursor[i]]).filter((p) => p != null));
      let shown = 0;
      art.pixels.forEach((color, p) => {
        if (color < 0) return;
        const x = g.ax + (p % art.w) * g.pp, y = g.ay + Math.floor(p / art.w) * g.pp;
        if (t >= paintAt[p]) {
          shown++;
          ctx.fillStyle = art.colors[color];
          ctx.fillRect(x, y, g.pp, g.pp);
          const age = t - paintAt[p];
          if (!reduceMotion && age < 130) {
            ctx.fillStyle = `rgba(255,255,255,${0.48 * (1 - age / 130)})`;
            ctx.fillRect(x, y, g.pp, g.pp);
          }
        } else {
          ctx.fillStyle = '#ffffff13';
          ctx.fillRect(x, y, Math.max(0.1, g.pp - 0.4), Math.max(0.1, g.pp - 0.4));
          if (fronts.has(p) && g.pp >= 3) {
            ctx.strokeStyle = reduceMotion ? '#d9d6ff' : `rgba(255,255,255,${0.52 + 0.27 * Math.sin(t / 160)})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, g.pp - 1, g.pp - 1);
          }
        }
      });
      ctx.restore();
      return shown;
    }

    function drawBoard(t, dt) {
      const { cell, bx, by } = g;
      const target = bombTarget();
      const step = reduceMotion ? 1 : 1 - Math.exp(-dt / 55);
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, cols * cell, rows * cell);
      ctx.clip();
      for (let p = 0; p < cells; p++) {
        const x = p % cols, y = Math.floor(p / cols), d = board[p];
        ctx.fillStyle = drag?.p === p ? '#ffffff27' : (x + y) % 2 ? '#24264c' : '#1b1d3b';
        ctx.fillRect(bx + x * cell, by + y * cell, cell, cell);
        if (!d) continue;
        d.x += (x - d.x) * step;
        d.y += (y - d.y) * step;
      }
      for (let p = 0; p < cells; p++) {
        const d = board[p];
        if (!d || drag?.p === p) continue;
        drawDrop(d, bx + (d.x + 0.5) * cell, by + (d.y + 0.5) * cell, cell * 0.39, target, t);
      }
      if (showCursor && phase === 'play') {
        ctx.strokeStyle = '#ffe078';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + (cursor % cols) * cell + 2,
          by + Math.floor(cursor / cols) * cell + 2, cell - 4, cell - 4);
      }
      ctx.restore();

      if (drag) {
        const pt = drag.pt || {
          x: bx + (drag.p % cols + 0.5) * cell,
          y: by + (Math.floor(drag.p / cols) + 0.8) * cell
        };
        const r = cell * 0.46;
        drawDrop(board[drag.p], clamp(pt.x, r, g.w - r),
          clamp(pt.y - cell * 0.68, r, g.h - r), r, target, t);
      }
    }

    function drawEffects(t) {
      flyers = flyers.filter((f) => t < f.at);
      for (const f of flyers) {
        if (t < f.start) continue;
        const p = clamp((t - f.start) / (f.at - f.start), 0, 1);
        const u = p * p * (3 - 2 * p);
        const x0 = g.bx + (f.source % cols + 0.5) * g.cell;
        const y0 = g.by + (Math.floor(f.source / cols) + 0.5) * g.cell;
        const x1 = g.ax + (f.p % level.art.w + 0.5) * g.pp;
        const y1 = g.ay + (Math.floor(f.p / level.art.w) + 0.5) * g.pp;
        const x = x0 + (x1 - x0) * u;
        const y = y0 + (y1 - y0) * u - Math.sin(p * Math.PI) * 25;
        ctx.fillStyle = level.art.colors[level.art.pixels[f.p]];
        ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.strokeStyle = '#ffffffa0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 3, y - 3, 6, 6);
      }
      if (clearing) {
        const age = (t - clearing.start) / 1000;
        ctx.save();
        for (const s of sparks) {
          if (age >= s.life) continue;
          ctx.globalAlpha = 1 - age / s.life;
          ctx.fillStyle = s.color;
          ctx.fillRect(g.w / 2 + s.vx * age, g.ay + level.art.h * g.pp / 2 +
            s.vy * age + 105 * age * age, 5, 5);
        }
        ctx.restore();
      }
      notices = notices.filter((n) => t < n.start + n.ms);
      const latest = new Map(notices.map((n) => [n.where, n]));
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const n of latest.values()) {
        const p = clamp((t - n.start) / n.ms, 0, 1);
        const base = n.where === 'board' ? g.by + g.cell * 1.35 :
          n.where === 'reward' ? g.by - 9 : g.ay + level.art.h * g.pp / 2;
        const y = base - (reduceMotion ? 0 : p * 8);
        ctx.globalAlpha = p > 0.8 ? (1 - p) / 0.2 : 1;
        ctx.font = `900 ${n.where === 'reward' ? 16 : 21}px system-ui`;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#17142b';
        ctx.fillStyle = n.color;
        ctx.strokeText(n.text, g.w / 2, y, g.w - 12);
        ctx.fillText(n.text, g.w / 2, y, g.w - 12);
      }
      ctx.restore();
    }

    function refreshArtInfo(t, force = false, shown = 0) {
      const pct = Math.floor(100 * shown / level.total);
      const target = bombTarget();
      const rest = level.queues.map((_, i) => remaining(i));
      const art = level.art;
      const name = unlocked.has(String(art.id)) ? art.name : '？？？';
      const sig = [art.no, name, pct, target, ...rest].join('|');
      if (!force && sig === lastHud) return;
      lastHud = sig;
      el.meta.textContent = `No.${String(art.no).padStart(3, '0')} ${name}　${ORDERS[level.mode]}　${pct}%`;
      el.chips.replaceChildren(...level.boardColors.map((color, i) => {
        const chip = document.createElement('span');
        const icon = document.createElement('b');
        const decoy = level.queues[i].length === 0;
        chip.className = 'afdrop-chip' + (i === target ? ' target' : '') + (!rest[i] ? ' done' : '');
        icon.style.backgroundColor = color;
        icon.textContent = SYMBOLS[i];
        chip.title = decoy ? '盤面専用色' : i === target ? 'ボムの対象色' : '未予約のピクセル数';
        chip.append(icon, document.createTextNode(decoy ? '―' : rest[i] || '✓'));
        return chip;
      }));
    }

    function frame() {
      if (closed) return;
      const t = now(), dt = clamp(t - lastFrame, 0, 50);
      lastFrame = t;
      if (phase === 'play' && galleryFrom === null && !userPaused) {
        if (t >= deadline) {
          if (drag) stopDrag(true);
          if (phase === 'play') endGame();
        } else if (drag?.until && t >= drag.until) stopDrag(true);
      }
      if (pauseBtn) pauseBtn.disabled = phase !== 'play' || galleryFrom !== null || userPaused;

      const left = phase === 'title' ? CFG.gameMs : Math.max(0, deadline - (pausedAt || t));
      const timeText = `${(left / 1000).toFixed(1)}秒`;
      if (el.time.textContent !== timeText) el.time.textContent = timeText;
      const scoreText = `${score}点`, doneText = `完成 ${completed}`;
      if (el.score.textContent !== scoreText) el.score.textContent = scoreText;
      if (el.done.textContent !== doneText) el.done.textContent = doneText;
      el.gameBar.style.transform = `scaleX(${clamp(left / CFG.gameMs, 0, 1)})`;
      el.gameBar.classList.toggle('low', left < 10000);
      const moveLeft = drag?.until ? clamp((drag.until - t) / CFG.moveMs, 0, 1) : 1;
      el.moveBar.style.transform = `scaleX(${moveLeft})`;
      el.moveBar.classList.toggle('low', moveLeft < 0.25);

      ctx.clearRect(0, 0, g.w, g.h);
      if (level) {
        const shown = drawArt(t);
        drawBoard(t, dt);
        drawEffects(t);
        refreshArtInfo(t, false, shown);
      }
      if (!closed) raf = requestAnimationFrame(frame);
    }

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', layout);
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => { if (!closed) layout(); });
      observer.observe(canvas.parentElement);
    }
    loadLevel(false);
    showTitle();
    raf = requestAnimationFrame(frame);
  }

  window.openMiniDrop2 = openMiniDrop2;
  const loaded = typeof AF_LOADED !== 'undefined' && Array.isArray(AF_LOADED) ?
    AF_LOADED : (window.AF_LOADED = Array.isArray(window.AF_LOADED) ? window.AF_LOADED : []);
  if (!loaded.includes('minigame_drop2.js')) loaded.push('minigame_drop2.js');
})();
