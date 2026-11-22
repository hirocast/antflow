// File: minigame_tsum2.js
/* ありんこチェインDX — ピクセルアート完成モード */
(function () {
  'use strict';

  const CFG = {
    TIME: 60,
    MIN_CHAIN: 3,
    BOMB_CHAIN: 7,
    FEVER_PER_PIECE: 3,
    FEVER_TIME: 8,
    COMPLETE_SCORE: 500,
    COMPLETE_TIME: 5,
    COMPLETE_PAUSE: 0.75,
    COIN_DIVISOR: 50,
    COINS_PER_ART: 5,
    SHUFFLE_COOLDOWN: 3,
    LINK_RADIUS: 3.05,
    ART_LIMIT: 128,
    ART_IDS: []
  };

  const MARKS = ['●', '▲', '■', '◆', '★'];
  const WILD = ['#ffbc42', '#b172e8', '#20c997', '#ff784f', '#38a8ed'];

  const BUILTIN = [
    {
      id: 'mt:ant', name: 'はっぱはこび',
      palette: { g: '#2e7d32', l: '#81c784', k: '#3e2723', a: '#a56a45', w: '#ffffff' },
      rows: [
        '..gg........', '.gllg..k..k.', 'gllllg..kk..', 'glllllgaaaa.',
        '.glllgawaawa', '..gggaaaaaaa', '....k.aaaa..', '...kaaaakk..',
        '..kaaaaaak..', '..aaaaaaaa..', '...aaaaaa...', '..k.k..k.k..'
      ]
    },
    {
      id: 'mt:apple', name: 'りんご',
      palette: { r: '#e74c3c', d: '#a93226', w: '#ffd5cc', b: '#6e4b2a', g: '#2e8b57', l: '#7dcf6f' },
      rows: [
        '.....bb.ll..', '......bllg..', '...rrrbrrr..', '..rrwrrrrrr.',
        '.rwwrrrrrrrr', '.rwrrrrrrrdr', '.rrrrrrrrrdr', '.rrrrrrrrddr',
        '..rrrrrrrdd.', '..rrrrrrddd.', '...rrddddd..', '....rr.dd...'
      ]
    },
    {
      id: 'mt:mushroom', name: 'きのこ',
      palette: { r: '#d63031', w: '#fff3e0', c: '#f5deb3', k: '#2d3436', s: '#c8a27a' },
      rows: [
        '....rrrr....', '..rrwwrrrr..', '.rrwwrrrwwr.', '.rrrrrrrwwr.',
        'rrwwrrrrrrrr', 'rwwwrrrrwwrr', 'rrrrrrrrrrrr', '...cccccc...',
        '...cckkcc...', '...cccccc...', '...ccccss...', '....ssss....'
      ]
    }
  ];

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const dist2 = (a, b) =>
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const isList = v => Array.isArray(v) || (ArrayBuffer.isView(v) && typeof v.length === 'number');
  const shuffled = values => {
    const a = Array.from(values);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function hostSave() {
    return (typeof save !== 'undefined' && save) || window.save || null;
  }

  function hostArt(id) {
    if (typeof getArt === 'function' && typeof ARTS !== 'undefined' && Array.isArray(ARTS)) {
      const data = getArt(id);
      if (data && data.grid) {
        return {
          id,
          name: ARTS[id - 1]?.n || `ステージ ${id}`,
          w: data.w ?? data.W,
          h: data.h ?? data.H,
          grid: data.grid,
          palette: typeof HEX !== 'undefined' ? HEX : null,
          transparentIndex: -1
        };
      }
    }
    if (typeof getArt === 'function') return getArt(id);
    return typeof window.getArt === 'function' ? window.getArt(id) : null;
  }

  function artIds() {
    if (typeof ARTS !== 'undefined' && Array.isArray(ARTS) && ARTS.length) {
      return Array.from({ length: ARTS.length }, (_, i) => i + 1);
    }
    const ids = new Set();
    const add = source => {
      if (source == null) return;
      const items = source instanceof Map ? source.keys()
        : Array.isArray(source) || source instanceof Set ? source
        : typeof source === 'object' ? Object.keys(source) : [];
      for (const item of items) {
        const id = item && typeof item === 'object' ? (item.id ?? item.key) : item;
        if ((typeof id === 'string' && id !== '') || Number.isFinite(id)) ids.add(id);
      }
    };
    if (CFG.ART_IDS.length) {
      add(CFG.ART_IDS);
      return [...ids];
    }
    try {
      if (typeof getArtIds === 'function') add(getArtIds());
      else if (typeof window.getArtIds === 'function') add(window.getArtIds());
    } catch (e) {
      console.warn('[minigame_tsum2] getArtIds failed', e);
    }
    if (ids.size) return [...ids];
    if (typeof ART_IDS !== 'undefined') add(ART_IDS);
    if (typeof PIXEL_ARTS !== 'undefined') add(PIXEL_ARTS);
    add(window.ART_IDS);
    add(window.PIXEL_ARTS);
    return [...ids];
  }

  function colorParser() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const cache = new Map();
    return function parse(value) {
      if (value == null || value === false) return null;
      if (isList(value)) {
        if (value.length < 3) return null;
        const channels = [Number(value[0]), Number(value[1]), Number(value[2])];
        if (!channels.every(Number.isFinite)) return null;
        if (value.length >= 4) {
          const a = Number(value[3]);
          if (!Number.isFinite(a) || (a <= 1 ? a < 0.3 : a < 77)) return null;
        }
        return channels.map(n => clamp(Math.round(n), 0, 255));
      }
      if (typeof value === 'number') {
        if (!Number.isInteger(value) || value < 0 || value > 0xffffff) return null;
        value = '#' + value.toString(16).padStart(6, '0');
      }
      if (typeof value !== 'string' || !ctx) return null;
      const key = value.trim().toLowerCase();
      if (!key || key === '.' || key === 'none' || key === 'transparent') return null;
      if (cache.has(key)) return cache.get(key);
      let result = null;
      ctx.fillStyle = '#010203';
      ctx.fillStyle = key;
      const first = ctx.fillStyle;
      ctx.fillStyle = '#040506';
      ctx.fillStyle = key;
      if (ctx.fillStyle === first) {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillRect(0, 0, 1, 1);
        const p = ctx.getImageData(0, 0, 1, 1).data;
        if (p[3] >= 77) result = [p[0], p[1], p[2]];
      }
      cache.set(key, result);
      return result;
    };
  }

  function normalizeArt(input, id) {
    let raw = input;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (_) { return null; }
    }
    if (!raw || typeof raw !== 'object') return null;

    const parse = colorParser();
    const name = String(raw.name ?? raw.title ?? raw.label ?? id);
    const palette = raw.palette ?? raw.colors ?? null;
    const indexBase = raw.indexBase === 1 ? 1 : 0;
    const hasTransparent = own(raw, 'transparentIndex') || own(raw, 'transparent');
    const transparent = raw.transparentIndex ?? raw.transparent;
    const readCell = value => {
      if (value == null || value === false || value === '' || value === '.' || value === ' ') return null;
      if (hasTransparent && (value === transparent ||
          (typeof transparent === 'number' && value === String(transparent)))) return null;
      if (!isList(value) && palette) {
        if (isList(palette) && (typeof value === 'number' || /^\d+$/.test(String(value)))) {
          return parse(palette[Number(value) - indexBase]);
        }
        if (own(palette, value)) return parse(palette[value]);
        if (typeof value === 'number' || /^\d+$/.test(String(value))) return null;
      }
      return parse(value);
    };

    const validDims = (w, h) => Number.isInteger(w) && Number.isInteger(h) &&
      w > 0 && h > 0 && w <= CFG.ART_LIMIT && h <= CFG.ART_LIMIT;

    const fromRGBA = (data, w, h) => {
      if (!validDims(w, h) || !isList(data) || data.length !== w * h * 4) return null;
      const cells = Array.from({ length: w * h }, (_, i) => {
        const j = i * 4;
        return Number(data[j + 3]) >= 77 ? parse([data[j], data[j + 1], data[j + 2]]) : null;
      });
      return cells.some(Boolean) ? { id, name, w, h, cells } : null;
    };

    if (typeof ImageData !== 'undefined' && raw instanceof ImageData) {
      return fromRGBA(raw.data, raw.width, raw.height);
    }

    const source = raw.canvas || raw.image || raw;
    const isCanvas = typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement;
    const isImage = typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement;
    if (isCanvas || isImage) {
      const sw = isImage ? source.naturalWidth : source.width;
      const sh = isImage ? source.naturalHeight : source.height;
      if (!sw || !sh) return null;
      const scale = Math.min(1, CFG.ART_LIMIT / Math.max(sw, sh));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(sw * scale));
      cv.height = Math.max(1, Math.round(sh * scale));
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0, cv.width, cv.height);
      return fromRGBA(ctx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height);
    }

    const explicitW = Number(raw.w ?? raw.width ?? raw.cols);
    const explicitH = Number(raw.h ?? raw.height);
    if (Array.isArray(raw.dots) && raw.dots.length &&
        raw.dots.every(d => d && Number.isInteger(d.x) && Number.isInteger(d.y))) {
      const w = explicitW || raw.dots.reduce((m, d) => Math.max(m, d.x + 1), 0);
      const h = explicitH || raw.dots.reduce((m, d) => Math.max(m, d.y + 1), 0);
      if (!validDims(w, h)) return null;
      const cells = Array(w * h).fill(null);
      for (const d of raw.dots) {
        if (d.x < 0 || d.x >= w || d.y < 0 || d.y >= h) continue;
        cells[d.y * w + d.x] = readCell(d.color ?? d.hex ?? d.index ??
          (d.r != null ? [d.r, d.g, d.b, d.a ?? 255] : null));
      }
      return cells.some(Boolean) ? { id, name, w, h, cells } : null;
    }

    let data = isList(raw) ? raw : (raw.rgba ?? raw.rows ?? raw.grid ??
      raw.pixels ?? raw.cells ?? raw.data ?? raw.matrix ?? raw.art);
    if (typeof data === 'string') data = data.split(/\r?\n/).filter(row => row.length);
    if (!isList(data) || !data.length) return null;
    if (validDims(explicitW, explicitH) &&
        (raw.rgba != null || (data.length === explicitW * explicitH * 4 &&
         (ArrayBuffer.isView(data) || Array.isArray(data)) && typeof data[0] === 'number'))) {
      return fromRGBA(data, explicitW, explicitH);
    }

    const shape = raw.format;
    const rgbaTuples = shape === 'rgb-tuples' ||
      (validDims(explicitW, explicitH) && data.length === explicitW * explicitH &&
       data.length !== explicitH && isList(data[0]) && data[0].length >= 3 && data[0].length <= 4);
    const flat = shape === 'flat' || rgbaTuples ||
      (validDims(explicitW, explicitH) && data.length === explicitW * explicitH &&
       data.length !== explicitH && !isList(data[0]));
    const rows = !flat && (isList(data[0]) ||
      (typeof data[0] === 'string' && !/^#|^rgba?\(/i.test(data[0])));
    let w, h, cells;
    if (rows) {
      h = explicitH || data.length;
      w = explicitW || Array.from(data).reduce((m, row) => Math.max(m, row?.length || 0), 0);
      if (!validDims(w, h)) return null;
      cells = Array.from({ length: w * h }, (_, i) =>
        readCell(data[Math.floor(i / w)]?.[i % w]));
    } else {
      w = explicitW || Math.ceil(Math.sqrt(data.length));
      h = explicitH || Math.ceil(data.length / w);
      if (!validDims(w, h)) return null;
      cells = Array.from({ length: w * h }, (_, i) =>
        rgbaTuples ? parse(data[i]) : readCell(data[i]));
    }
    return cells.some(Boolean) ? { id, name, w, h, cells } : null;
  }

  function makeStage(art) {
    const counts = new Map();
    for (const c of art.cells) {
      if (!c) continue;
      const key = c.join(',');
      const entry = counts.get(key);
      if (entry) entry.count++;
      else counts.set(key, { c, count: 1 });
    }

    const groups = [];
    for (const { c } of [...counts.values()].sort((a, b) => b.count - a.count)) {
      if (groups.length === 5) break;
      if (!groups.some(g => dist2(c, g.c) < 34 ** 2)) {
        groups.push({ c, wild: false, queue: [], remaining: 0 });
      }
    }

    let total = 0;
    art.cells.forEach((c, i) => {
      if (!c) return;
      let best = 0;
      for (let j = 1; j < groups.length; j++) {
        if (dist2(c, groups[j].c) < dist2(c, groups[best].c)) best = j;
      }
      groups[best].queue.push(i);
      total++;
    });

    const spare = WILD.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
    while (groups.length < 5) {
      const separation = c => Math.min(...groups.map(g => dist2(c, g.c)));
      spare.sort((a, b) => separation(b) - separation(a));
      groups.push({ c: spare.shift(), wild: true, queue: [], remaining: 0 });
    }
    groups.forEach(g => {
      g.queue = shuffled(g.queue);
      g.remaining = g.total = g.queue.length;
      g.perPiece = Math.max(1, Math.ceil(g.total / 8));
    });

    return {
      ...art, groups, total, count: 0, painted: new Uint8Array(art.cells.length),
      done: false, dirty: true
    };
  }

  function installStyle() {
    if (document.getElementById('mta-style')) return;
    const style = document.createElement('style');
    style.id = 'mta-style';
    style.textContent = `
.mta-root{position:fixed;inset:0;z-index:99999;display:flex;justify-content:center;background:#0a0d18f5;color:#f8fafc;font:14px system-ui,sans-serif}
.mta-root *{box-sizing:border-box}
.mta-wrap{display:flex;flex-direction:column;gap:6px;width:min(100%,480px);height:100%;min-height:0;padding:calc(6px + env(safe-area-inset-top,0px)) calc(8px + env(safe-area-inset-right,0px)) calc(6px + env(safe-area-inset-bottom,0px)) calc(8px + env(safe-area-inset-left,0px))}
.mta-hud,.mta-foot{display:flex;align-items:center;gap:8px;flex:none}
.mta-hud{height:38px}.mta-foot{min-height:36px}
.mta-stat{flex:1;min-width:0}.mta-stat small{display:block;opacity:.72;font-size:10px}.mta-stat b{font-size:17px}
.mta-clock{font-size:25px;font-weight:900;font-variant-numeric:tabular-nums}.mta-clock.warn{color:#ff7777}
.mta-root button{border:0;border-radius:12px;padding:0 12px;min-height:36px;background:#67d8ef;color:#091321;font:700 13px system-ui,sans-serif;cursor:pointer}
.mta-root button:disabled{opacity:.45;cursor:default}.mta-root button:focus-visible{outline:3px solid #ffd166;outline-offset:2px}
.mta-root .mta-close{width:36px;padding:0;background:#29344a;color:#fff;font-size:18px}
.mta-dock{display:flex;gap:8px;align-items:stretch;flex:none;height:clamp(66px,12vh,88px);padding:5px;border-radius:12px;background:#20283b}
.mta-preview{display:block;height:100%;width:auto;aspect-ratio:1;flex:none;object-fit:contain;image-rendering:pixelated;background:#101625;border-radius:7px}
.mta-info{display:flex;flex-direction:column;justify-content:space-between;flex:1;min-width:0}
.mta-title{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:12px}
.mta-title b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mta-title span{flex:none}
.mta-meter,.mta-fever{position:relative;overflow:hidden;border-radius:8px;background:#101625}
.mta-meter{height:14px}.mta-fever{flex:none;height:6px}
.mta-meter i,.mta-fever i{display:block;height:100%;width:0;background:linear-gradient(90deg,#39c6e7,#6bdf9e)}
.mta-meter span{position:absolute;inset:0;text-align:center;font-size:10px;font-weight:800;line-height:14px;text-shadow:0 1px 3px #000,0 0 2px #000}
.mta-fever i{background:linear-gradient(90deg,#ff9f43,#ffd166,#ff6484)}
.mta-chips{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.mta-chip{min-width:0;border:1px solid #ffffff50;border-radius:5px;text-align:center;white-space:nowrap;font-size:10px;font-weight:900;height:16px;line-height:14px}
.mta-board{position:relative;flex:1;min-height:0;overflow:hidden;border-radius:13px;background:#141927}
.mta-board canvas,.mta-fx{position:absolute;inset:0;width:100%;height:100%;display:block}
.mta-board canvas{touch-action:none;user-select:none;-webkit-user-select:none}
.mta-fx{pointer-events:none;z-index:1}
.mta-banner{position:absolute;top:33%;left:4px;right:4px;pointer-events:none;text-align:center;color:#ffd166;text-shadow:0 2px 6px #000;font-size:clamp(16px,5vw,26px);font-weight:900}
.mta-hint{font-size:11px;line-height:1.25;color:#ccd5e6}
.mta-result{position:absolute;inset:0;z-index:2;display:grid;place-items:center;padding:10px;background:#070a12ba}
.mta-result[hidden]{display:none}
.mta-card{width:min(100%,420px);max-height:100%;overflow:auto;border-radius:16px;padding:15px;background:#20283b;text-align:center}
.mta-card h2{margin:0}.mta-card p{margin:5px 0}.mta-final{font-size:32px;font-weight:900}
.mta-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:8px;margin:12px 0}
.mta-gallery figure{margin:0;min-width:0;font-size:11px}
.mta-gallery canvas{display:block;width:100%;aspect-ratio:1;object-fit:contain;background:#101625;border-radius:6px;image-rendering:pixelated}
.mta-gallery figcaption{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.mta-actions{display:flex;justify-content:center;gap:8px;margin-top:10px}
.mta-root .mta-secondary{background:#34425c;color:#fff}
.mta-root .mta-skill{position:relative;overflow:hidden;background:#20283b;color:#f8fafc;border:2px solid #475569;flex:none}
.mta-root .mta-skill i{position:absolute;inset:0 auto 0 0;width:0%;background:linear-gradient(90deg,#f472b655,#fbbf2455);pointer-events:none;transition:width .18s}
.mta-root .mta-skill span{position:relative}
.mta-root .mta-skill.ready{border-color:#f472b6;background:#3b1f3a;color:#ffd166;box-shadow:0 0 12px #f472b666;animation:mtaSkPulse .85s ease-in-out infinite alternate}
@keyframes mtaSkPulse{from{transform:scale(1)}to{transform:scale(1.05)}}
`;
    document.head.appendChild(style);
  }

  window.openMiniTsum2 = function openMiniTsum2(onClose) {
    if (document.querySelector('.mta-root')) return;
    installStyle();

    const activeSkin = (() => {
      const k = (hostSave() && hostSave().skin) || 'none';
      const s = (typeof SKINS !== 'undefined' && Array.isArray(SKINS) && SKINS.find(x => x.k === k)) || { k: 'none', n: 'すっぴん', e: '🐜' };
      const sk = (typeof getSkinSkill === 'function')
        ? getSkinSkill(s.k)
        : { k: 'none', name: 'ありんこエール', type: 'random', lv: 1, need: 16, tsumDesc: 'ランダムに10こ消去！' };
      return { skin: s, skill: sk };
    })();

    const previousFocus = document.activeElement;
    const root = document.createElement('div');
    root.className = 'mta-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'ありんこチェインDX');
    root.innerHTML = `
      <div class="mta-wrap">
        <div class="mta-hud">
          <div class="mta-stat"><small>SCORE</small><b data-score>0</b></div>
          <div class="mta-clock" data-clock>60</div>
          <div class="mta-stat" style="text-align:right"><small>BEST</small><b data-best>0</b></div>
          <button type="button" class="mta-close" data-exit aria-label="閉じる">×</button>
        </div>
        <div class="mta-dock">
          <canvas class="mta-preview" data-art aria-label="お題のピクセルアート"></canvas>
          <div class="mta-info">
            <div class="mta-title"><b data-name></b><span data-count></span></div>
            <div class="mta-meter" data-meter role="progressbar" aria-label="お題の進捗"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <i></i><span>0%</span>
            </div>
            <div class="mta-chips" data-chips></div>
          </div>
        </div>
        <div class="mta-fever" aria-label="フィーバーゲージ"><i data-fever></i></div>
        <div class="mta-board" data-wrap>
          <canvas data-board aria-label="なぞり消しの盤面"></canvas>
          <div class="mta-banner" data-banner></div>
        </div>
        <div class="mta-foot">
          <button type="button" class="mta-skill" data-skill disabled><i></i><span>${activeSkin.skin.e} 0%</span></button>
          <button type="button" data-shuffle>シャッフル</button>
          <span class="mta-hint">3つ以上なぞって塗ろう！</span>
        </div>
      </div>
      <canvas class="mta-fx" data-fx aria-hidden="true"></canvas>
      <section class="mta-result" data-result hidden aria-label="結果"></section>
    `;
    document.body.appendChild(root);

    const $ = selector => root.querySelector(selector);
    const el = {};
    for (const key of [
      'score', 'clock', 'best', 'exit', 'art', 'name', 'count', 'meter',
      'chips', 'fever', 'wrap', 'board', 'banner', 'skill', 'shuffle', 'fx', 'result'
    ]) el[key] = $(`[data-${key}]`);
    const meterFill = el.meter.querySelector('i');
    const meterText = el.meter.querySelector('span');
    const ctx = el.board.getContext('2d');
    const fx = el.fx.getContext('2d');
    const artCtx = el.art.getContext('2d');
    if (!ctx || !fx || !artCtx) {
      root.remove();
      console.error('[minigame_tsum2] Canvas 2D is unavailable.');
      if (typeof onClose === 'function') onClose();
      return;
    }

    const externalIds = artIds();
    const artCache = new Map();
    const fallback = BUILTIN.map(a => normalizeArt(a, a.id)).filter(Boolean);
    const events = new AbortController();
    const listen = (target, type, fn) =>
      target.addEventListener(type, fn, { signal: events.signal });
    const sound = (name, ...args) => {
      try {
        const s = typeof Sound !== 'undefined' ? Sound : window.Sound;
        if (s && typeof s[name] === 'function') s[name](...args);
      } catch (_) {}
    };

    let state, stage, bag = [], lastArt = null;
    let width = 1, height = 1, radius = 20, targetCount = 40, dpr = 1;
    let boardX = 0, boardY = 0, artBox;
    let sprites = [], chips = [], raf = 0, last = 0, closed = false, observer;
    let artUiDirty = true;

    const setText = (node, text) => {
      const next = String(text);
      if (node.textContent !== next) node.textContent = next;
    };

    function externalArt(id) {
      if (!artCache.has(id)) {
        try {
          artCache.set(id, normalizeArt(hostArt(id), id));
        } catch (e) {
          console.warn('[minigame_tsum2] Could not read art:', id, e);
          artCache.set(id, null);
        }
      }
      return artCache.get(id);
    }

    function nextStage() {
      if (!bag.length) {
        const valid = externalIds.map(externalArt).filter(Boolean);
        bag = shuffled(valid.length ? valid : fallback);
        if (bag.length > 1 && bag[0] === lastArt) {
          [bag[0], bag[1]] = [bag[1], bag[0]];
        }
      }
      lastArt = bag.shift();
      return makeStage(lastArt);
    }

    function measureArt() {
      if (!stage) return;
      const r = el.art.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      const scale = Math.min(r.width / stage.w, r.height / stage.h);
      artBox = {
        x: r.left - o.left + (r.width - stage.w * scale) / 2,
        y: r.top - o.top + (r.height - stage.h * scale) / 2,
        scale
      };
    }

    function resize() {
      if (closed) return;
      const rect = el.wrap.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const w = rect.width, h = rect.height;
      const r = Math.max(1, Math.min(w / 15, h / 7, 32));
      if (state && (w !== width || h !== height)) {
        clearInput();
        for (const p of state.pieces) {
          p.x *= w / width;
          p.y = p.y < 0 ? p.y * r / radius : p.y * h / height;
        }
      }
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const rebuild = r !== radius || nextDpr !== dpr;
      width = w;
      height = h;
      radius = r;
      dpr = nextDpr;
      boardX = rect.left - o.left;
      boardY = rect.top - o.top;
      targetCount = clamp(Math.floor(w * h * 0.51 / (4 * r * r)), 20, 56);

      function size(canvas, ww, hh) {
        const pw = Math.max(1, Math.round(ww * dpr));
        const ph = Math.max(1, Math.round(hh * dpr));
        if (canvas.width !== pw) canvas.width = pw;
        if (canvas.height !== ph) canvas.height = ph;
      }
      size(el.board, w, h);
      size(el.fx, o.width, o.height);
      measureArt();
      if (stage && rebuild) buildSprites();
      if (state && stage) draw();
    }

    function setStage() {
      clearInput();
      stage = nextStage();
      el.art.width = stage.w;
      el.art.height = stage.h;
      el.art.style.width = '';
      setText(el.name, 'お題：' + stage.name);
      el.name.title = stage.name;
      el.chips.replaceChildren();
      chips = stage.groups.map((g, i) => {
        const node = document.createElement('span');
        node.className = 'mta-chip';
        node.style.backgroundColor = rgb(g.c);
        node.style.color = (0.299 * g.c[0] + 0.587 * g.c[1] + 0.114 * g.c[2]) >= 148
          ? '#101625' : '#fff';
        el.chips.appendChild(node);
        return node;
      });
      buildSprites();
      measureArt();
      artUiDirty = true;
    }

    function buildSprites() {
      sprites = stage.groups.map((g, i) => {
        const cv = document.createElement('canvas');
        const r = radius * dpr;
        cv.width = cv.height = Math.ceil(r * 2 + 4);
        const c = cv.getContext('2d');
        const mid = cv.width / 2;
        const grad = c.createRadialGradient(mid - r * .35, mid - r * .4, 0, mid, mid, r);
        grad.addColorStop(0, rgb(mix(g.c, [255, 255, 255], .55)));
        grad.addColorStop(.65, rgb(g.c));
        grad.addColorStop(1, rgb(mix(g.c, [0, 0, 0], .31)));
        c.beginPath();
        c.arc(mid, mid, r * .95, 0, Math.PI * 2);
        c.fillStyle = grad;
        c.fill();
        c.strokeStyle = '#ffffff60';
        c.stroke();

        c.fillStyle = '#111827';
        c.beginPath();
        c.arc(mid - r * .23, mid + r * .19, r * .077, 0, Math.PI * 2);
        c.arc(mid + r * .23, mid + r * .19, r * .077, 0, Math.PI * 2);
        c.fill();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `900 ${Math.max(5, Math.round(r * .67))}px system-ui`;
        c.lineWidth = Math.max(1, r * .10);
        c.strokeStyle = '#111827';
        c.strokeText(MARKS[i], mid, mid - r * .24);
        c.fillStyle = '#fff';
        c.fillText(MARKS[i], mid, mid - r * .24);
        return cv;
      });
    }

    function pickType() {
      const weights = stage.groups.map(g => g.wild ? .65 : .62 + g.queue.length / g.total);
      let draw = Math.random() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < weights.length; i++) {
        draw -= weights[i];
        if (draw < 0) return i;
      }
      return weights.length - 1;
    }

    function piece(x, y, type = pickType()) {
      return { x, y, vx: 0, vy: 0, type, armed: false };
    }

    function initialFill() {
      const cols = Math.max(1, Math.floor(width / (radius * 2)));
      const step = (width - radius * 2) / Math.max(1, cols - 1);
      for (let i = 0; i < targetCount; i++) {
        const row = Math.floor(i / cols), col = i % cols;
        state.pieces.push(piece(
          clamp(radius + col * step + (Math.random() - .5) * 2, radius, width - radius),
          height - radius - row * radius * 1.84
        ));
      }
    }

    function refill(dt) {
      state.spawn -= dt;
      if (state.pieces.length >= targetCount || state.spawn > 0) return;
      const p = piece(radius + Math.random() * (width - 2 * radius), -radius);
      p.vy = 95;
      state.pieces.push(p);
      state.spawn = .035;
    }

    function physics(dt) {
      const ps = state.pieces, r = radius, diameter = r * 2;
      for (const p of ps) {
        p.vx *= Math.exp(-1.15 * dt);
        p.vy = Math.min(950, p.vy * Math.exp(-.24 * dt) + 1850 * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < ps.length; i++) {
          const a = ps[i];
          for (let j = i + 1; j < ps.length; j++) {
            const b = ps[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const square = dx * dx + dy * dy;
            if (square >= diameter * diameter) continue;
            const d = Math.sqrt(square);
            const nx = d > .001 ? dx / d : 1;
            const ny = d > .001 ? dy / d : 0;
            const shift = (diameter - d) * .5;
            a.x -= nx * shift; a.y -= ny * shift;
            b.x += nx * shift; b.y += ny * shift;
            const dot = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (dot < 0) {
              const impulse = -dot * .52;
              a.vx -= nx * impulse; a.vy -= ny * impulse;
              b.vx += nx * impulse; b.vy += ny * impulse;
            }
          }
        }
        for (const p of ps) {
          if (p.x < r) { p.x = r; p.vx = Math.max(0, -p.vx * .28); }
          if (p.x > width - r) { p.x = width - r; p.vx = Math.min(0, -p.vx * .28); }
          if (p.y > height - r) {
            p.y = height - r;
            p.vy = Math.min(0, -p.vy * .16);
            p.vx *= .87;
          }
        }
      }
    }

    function localPoint(e) {
      const box = el.board.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    }

    function hit(x, y, tolerance, accept = () => true) {
      let nearest = null, best = radius * tolerance;
      for (const p of state.pieces) {
        if (p.y < 0 || !accept(p)) continue;
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < best) { best = d; nearest = p; }
      }
      return nearest;
    }

    function clearInput() {
      if (!state) return;
      const pointer = state.pointer;
      state.pointer = null;
      state.chain = [];
      state.bombTap = null;
      state.lastPoint = null;
      if (pointer !== null) {
        try {
          if (el.board.hasPointerCapture(pointer)) el.board.releasePointerCapture(pointer);
        } catch (_) {}
      }
    }

    function pointerDown(e) {
      if (state.phase !== 'play' || state.pointer !== null || e.button !== 0) return;
      const pos = localPoint(e);
      const p = hit(pos.x, pos.y, 1.13);
      if (!p || p.armed) return;
      e.preventDefault();
      state.pointer = e.pointerId;
      state.lastPoint = pos;
      try { el.board.setPointerCapture(e.pointerId); } catch (_) {}
      sound('init');
      if (p.type < 0) {
        state.bombTap = p;
        sound('tap');
      } else {
        state.chain = [p];
        sound('tsumLink', 1);
      }
    }

    function trace(pos) {
      const prev = state.lastPoint, chain = state.chain;
      if (!prev || !chain.length) return;
      const targetType = chain[0].type;
      const steps = clamp(Math.ceil(Math.hypot(pos.x - prev.x, pos.y - prev.y) /
        Math.max(1, radius * .35)), 1, 120);
      for (let i = 1; i <= steps; i++) {
        const x = prev.x + (pos.x - prev.x) * i / steps;
        const y = prev.y + (pos.y - prev.y) * i / steps;
        const tail = chain[chain.length - 1];
        const q = hit(x, y, 1.28, p => p.type === targetType);
        if (!q || q === tail) continue;
        if (chain.length > 1 && q === chain[chain.length - 2]) {
          if (Math.hypot(x - q.x, y - q.y) <= radius * 0.95) {
            chain.pop();
            sound('tsumUnlink', chain.length);
          }
        } else if (!chain.includes(q) &&
                   Math.hypot(q.x - tail.x, q.y - tail.y) <= radius * CFG.LINK_RADIUS) {
          chain.push(q);
          sound('tsumLink', chain.length);
        }
      }
      state.lastPoint = pos;
    }

    function pointerUp(e) {
      if (state.pointer !== e.pointerId) return;
      if (state.phase !== 'play') { clearInput(); return; }
      const pos = localPoint(e);
      const bomb = state.bombTap;
      if (!bomb) trace(pos);
      const chain = state.chain.slice();
      clearInput();

      if (bomb) {
        if (!bomb.armed && hit(pos.x, pos.y, 1.3) === bomb) explode(bomb, 0);
        return;
      }
      if (chain.length < CFG.MIN_CHAIN) {
        if (chain.length > 1) sound('deny');
        return;
      }

      const n = chain.length, tail = chain[n - 1];
      scoreAt((n * 50 + (n - CFG.MIN_CHAIN) ** 2 * 25) * multiplier(), tail);
      sound('tsumClear', n, 1, state.feverTime > 0);
      clearPieces(chain);
      if (n >= CFG.BOMB_CHAIN) {
        const b = piece(tail.x, tail.y, -1);
        b.vy = -100;
        state.pieces.push(b);
      }
    }

    function reserve(type) {
      const from = stage.groups[type];
      let target = from;
      if (!from.queue.length) {
        target = stage.groups.reduce((best, g) =>
          g.queue.length > (best?.queue.length || 0) ? g : best, null);
        if (!target) return null;
      }
      const n = target === from || from.wild ? target.perPiece :
        Math.max(1, Math.ceil(target.perPiece * .6));
      const indexes = [];
      for (let i = 0; i < n && target.queue.length; i++) indexes.push(target.queue.pop());
      return { indexes, group: target };
    }

    function clearPieces(pieces, fromSkill) {
      const removed = new Set(pieces);
      state.pieces = state.pieces.filter(p => !removed.has(p));
      let normal = 0;
      pieces.forEach((p, n) => {
        const color = p.type >= 0 ? rgb(stage.groups[p.type].c) : '#ffd166';
        burst(boardX + p.x, boardY + p.y, color, p.type < 0 ? 14 : 4);
        if (p.type < 0) return;
        normal++;
        const claim = reserve(p.type);
        if (!claim) return;
        const packets = Array.from({ length: Math.min(3, claim.indexes.length) }, () => []);
        claim.indexes.forEach((ix, j) => packets[j % packets.length].push(ix));
        packets.forEach((indexes, j) => {
          state.flyers.push({
            stage, group: claim.group, indexes,
            sx: boardX + p.x, sy: boardY + p.y,
            bend: (Math.random() - .5) * 94,
            age: -Math.min(n * .017, .18) - j * .038,
            duration: .36 + Math.random() * .20,
            color: rgb(stage.cells[indexes[0]])
          });
        });
      });
      if (!fromSkill && normal) {
        state.skillCharge = Math.min(activeSkin.skill.need, state.skillCharge + normal);
      }
      if (state.feverTime <= 0 && normal) {
        state.fever += normal * CFG.FEVER_PER_PIECE;
        if (state.fever >= 100) {
          state.fever = 0;
          state.feverTime = CFG.FEVER_TIME;
          announce('FEVER ×2!', 1.1);
          sound('tsumFever');
        }
      }
    }

    function artPoint(index) {
      return {
        x: artBox.x + (index % stage.w + .5) * artBox.scale,
        y: artBox.y + (Math.floor(index / stage.w) + .5) * artBox.scale
      };
    }

    function land(flyer, flash) {
      if (flyer.stage !== stage) return;
      for (const i of flyer.indexes) {
        if (stage.painted[i]) continue;
        stage.painted[i] = 1;
        stage.count++;
        flyer.group.remaining--;
      }
      stage.dirty = artUiDirty = true;
      if (flash && artBox) {
        const p = artPoint(flyer.indexes[0]);
        state.flashes.push({ x: p.x, y: p.y, color: flyer.color, age: 0 });
        sound('tsumDot', stage.count);
      }
    }

    function completeStage(atTimeout) {
      if (stage.done || stage.count !== stage.total) return;
      stage.done = true;
      state.score += CFG.COMPLETE_SCORE;
      state.completed.push(stage);
      if (atTimeout) return;
      sound('tsumStageClear');
      state.time += CFG.COMPLETE_TIME;
      state.phase = 'complete';
      state.transition = CFG.COMPLETE_PAUSE;
      clearInput();
      if (artBox) {
        burst(artBox.x + stage.w * artBox.scale / 2,
          artBox.y + stage.h * artBox.scale / 2, '#ffd166', 24);
      }
      announce(`完成！ +${CFG.COMPLETE_SCORE}点 / +${CFG.COMPLETE_TIME}秒`, CFG.COMPLETE_PAUSE);
    }

    const multiplier = () => (state.feverTime > 0 ? 2 : 1) * (state.skillRush > 0 ? state.skillRushMul : 1);

    function scoreAt(value, p) {
      const amount = Math.round(value);
      state.score += amount;
      state.labels.push({
        x: boardX + p.x, y: boardY + p.y, text: '+' + amount, age: 0,
        color: state.feverTime > 0 ? '#ffd166' : '#fff'
      });
    }

    function triggerSkill() {
      if (state.phase !== 'play' || state.skillCharge < activeSkin.skill.need) return;
      clearInput();
      state.skillCharge = 0;
      const sk = activeSkin.skill;
      const lv = sk.lv;
      sound('tsumSkill');
      announce(`${activeSkin.skin.e} ${sk.name}！`, 1.0);

      const clearSkillSet = (list, anchor) => {
        if (!list.length) return;
        const p0 = anchor || list[0] || { x: width / 2, y: height / 2 };
        scoreAt(list.length * 60 * multiplier(), p0);
        clearPieces(list, true);
      };
      const pickRandom = n => {
        const pool = state.pieces.filter(p => p.type >= 0 && p.y > 0);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, n);
      };

      switch (sk.type) {
        case 'sweepH': {
          const cy = height * 0.56, band = radius * (1.5 + lv * 0.55);
          state.flashes.push({ x: boardX + width / 2, y: boardY + cy, color: '#f472b6', age: 0, reach: width * 0.5 });
          clearSkillSet(state.pieces.filter(p => p.type >= 0 && Math.abs(p.y - cy) <= band), { x: width / 2, y: cy });
          break;
        }
        case 'burst': {
          const cx = width / 2, cy = height * 0.55, r = radius * (2.6 + lv * 0.65);
          state.flashes.push({ x: boardX + cx, y: boardY + cy, color: '#ffd166', age: 0, reach: r });
          clearSkillSet(state.pieces.filter(p => p.type >= 0 && Math.hypot(p.x - cx, p.y - cy) <= r), { x: cx, y: cy });
          break;
        }
        case 'cross': {
          const cx = width / 2, cy = height * 0.55, w = radius * (1.2 + lv * 0.4);
          state.flashes.push({ x: boardX + cx, y: boardY + cy, color: '#67d8ef', age: 0, reach: width * 0.45 });
          clearSkillSet(state.pieces.filter(p => p.type >= 0 && (Math.abs(p.x - cx) <= w || Math.abs(p.y - cy) <= w)), { x: cx, y: cy });
          break;
        }
        case 'color': {
          const counts = new Map();
          for (const p of state.pieces) if (p.type >= 0 && p.y > 0) counts.set(p.type, (counts.get(p.type) || 0) + 1);
          let bestType = 0, bestN = -1;
          for (const [t, n] of counts) if (n > bestN) { bestN = n; bestType = t; }
          clearSkillSet(state.pieces.filter(p => p.type === bestType && p.y > 0), { x: width / 2, y: height / 2 });
          const bombs = lv >= 5 ? 2 : lv >= 3 ? 1 : 0;
          for (let b = 0; b < bombs; b++) {
            const bm = piece(width * (0.35 + b * 0.3), height * 0.45, -1);
            bm.vy = -100;
            state.pieces.push(bm);
          }
          break;
        }
        case 'bomb': {
          const n = 1 + Math.floor(lv / 2) + (lv >= 4 ? 1 : 0);
          for (let i = 0; i < n; i++) {
            const bm = piece(width * (0.2 + 0.6 * ((i + 0.5) / n)), height * 0.45 + (i % 2) * radius, -1);
            bm.vy = -100;
            state.pieces.push(bm);
          }
          break;
        }
        case 'transform': {
          const counts = new Map();
          for (const p of state.pieces) if (p.type >= 0 && p.y > 0) counts.set(p.type, (counts.get(p.type) || 0) + 1);
          let bestType = 0, bestN = -1;
          for (const [t, n] of counts) if (n > bestN) { bestN = n; bestType = t; }
          const others = state.pieces.filter(p => p.type >= 0 && p.type !== bestType && p.y > 0);
          const n = Math.min(others.length, 7 + lv * 3);
          for (let i = 0; i < n; i++) {
            others[i].type = bestType;
            burst(boardX + others[i].x, boardY + others[i].y, rgb(stage.groups[bestType].c), 4);
          }
          break;
        }
        case 'freeze': {
          state.skillFreeze = Math.max(state.skillFreeze, 4 + lv);
          clearSkillSet(pickRandom(5 + lv * 2), { x: width / 2, y: height / 2 });
          break;
        }
        case 'timePlus': {
          state.time += 2 + lv;
          clearSkillSet(pickRandom(4 + lv * 2), { x: width / 2, y: height / 2 });
          break;
        }
        case 'fever': {
          if (state.feverTime > 0) state.feverTime += lv + 1;
          else { state.fever = 0; state.feverTime = CFG.FEVER_TIME + (lv - 1) * 0.8; }
          clearSkillSet(pickRandom(5 + lv * 2), { x: width / 2, y: height / 2 });
          break;
        }
        case 'goldRush': {
          state.skillRushMul = 1.4 + lv * 0.2;
          state.skillRush = Math.max(state.skillRush, 6 + lv * 2);
          clearSkillSet(pickRandom(4 + lv * 2), { x: width / 2, y: height / 2 });
          break;
        }
        default: {
          clearSkillSet(pickRandom(7 + lv * 3), { x: width / 2, y: height / 2 });
          break;
        }
      }
      updateHud();
    }

    function explode(bomb, depth) {
      if (!state.pieces.includes(bomb)) return;
      const reach = radius * 3.45;
      const nearby = state.pieces.filter(p => p !== bomb &&
        Math.hypot(p.x - bomb.x, p.y - bomb.y) < reach);
      const normal = nearby.filter(p => p.type >= 0);
      const affected = new Set([bomb, ...normal]);
      if (affected.has(state.bombTap) || state.chain.some(p => affected.has(p))) clearInput();

      scoreAt((100 + normal.length * 60) * (1 + depth * .35) * multiplier(), bomb);
      sound('tsumBomb', depth);
      clearPieces([bomb, ...normal]);
      for (const p of nearby) {
        if (p.type >= 0 || p.armed) continue;
        p.armed = true;
        state.bombs.push({ p, delay: .16, depth: depth + 1 });
      }
      for (const p of state.pieces) {
        const dx = p.x - bomb.x, dy = p.y - bomb.y, d = Math.hypot(dx, dy);
        if (d < 1 || d > reach * 1.6) continue;
        p.vx += dx / d * 180;
        p.vy += dy / d * 180 - 85;
      }
      state.flashes.push({
        x: boardX + bomb.x, y: boardY + bomb.y,
        color: '#ffd166', age: 0, reach
      });
    }

    function findTriple(sameType) {
      const ps = state.pieces.filter(p => p.type >= 0 && p.y >= radius * .55);
      const limit = (radius * CFG.LINK_RADIUS) ** 2;
      for (const center of ps) {
        let first = null;
        for (const p of ps) {
          if (p === center || (sameType && p.type !== center.type)) continue;
          if ((p.x - center.x) ** 2 + (p.y - center.y) ** 2 > limit) continue;
          if (first) return [first, center, p];
          first = p;
        }
      }
      return null;
    }

    function shuffleBoard(auto) {
      if (state.phase !== 'play' || (!auto && state.shuffleCd > 0)) return;
      clearInput();
      for (const p of state.pieces) {
        if (p.type < 0) continue;
        p.type = pickType();
        if (!auto && p.y >= 0) {
          p.vx += (Math.random() - .5) * 120;
          p.vy -= 100 + Math.random() * 80;
        }
      }
      if (!findTriple(true)) {
        const triple = findTriple(false);
        if (triple) {
          const type = pickType();
          triple.forEach(p => { p.type = type; });
          triple.forEach(p => { p.vx = 0; p.vy = 0; });
        }
      }
      if (!auto) state.shuffleCd = CFG.SHUFFLE_COOLDOWN;
      state.moveCheck = 1.1;
      sound('tsumShuffle');
      announce(auto ? '手づまり！ シャッフル' : 'シャッフル！', .8);
    }

    function announce(text, seconds) {
      setText(el.banner, text);
      state.bannerTime = seconds;
    }

    function burst(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 45 + Math.random() * 140;
        state.sparks.push({ x, y, color, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0 });
      }
    }

    function update(dt, elapsed) {
      state.bannerTime -= dt;
      if (state.bannerTime <= 0) setText(el.banner, '');
      state.sparks = state.sparks.filter(p => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 290 * dt; p.age += dt;
        return p.age < .42;
      });
      state.flashes = state.flashes.filter(p => (p.age += dt) < .32);
      state.labels = state.labels.filter(p => (p.age += dt) < .8);

      if (state.phase === 'ready') {
        state.transition -= dt;
        if (state.transition <= 0) {
          state.phase = 'play';
          announce('スタート！', .55);
          sound('tsumReady', true);
        }
      } else if (state.phase === 'complete') {
        state.transition -= dt;
        if (state.transition <= 0) {
          setStage();
          state.phase = 'play';
        }
      } else if (state.phase === 'play') {
        if (state.skillFreeze > 0) state.skillFreeze = Math.max(0, state.skillFreeze - elapsed);
        else state.time = Math.max(0, state.time - elapsed);
        if (state.skillRush > 0) state.skillRush = Math.max(0, state.skillRush - elapsed);
        if (state.time === 0) { finish(); return; }

        state.feverTime = Math.max(0, state.feverTime - elapsed);
        state.shuffleCd = Math.max(0, state.shuffleCd - elapsed);
        const due = [];
        state.bombs = state.bombs.filter(job => {
          job.delay -= dt;
          if (job.delay > 0) return true;
          due.push(job);
          return false;
        });
        for (const job of due) explode(job.p, job.depth);
        refill(dt);

        state.moveCheck -= dt;
        if (state.moveCheck <= 0) {
          state.moveCheck = .8;
          if (state.pointer === null && !state.bombs.length &&
              state.pieces.length >= targetCount &&
              !state.pieces.some(p => p.type < 0 || p.y < radius * .55 || Math.abs(p.vy) > 110) &&
              !findTriple(true)) {
            shuffleBoard(true);
          }
        }
      }

      for (let i = state.flyers.length - 1; i >= 0; i--) {
        const f = state.flyers[i];
        f.age += dt;
        if (f.age >= f.duration) {
          land(f, true);
          state.flyers.splice(i, 1);
        }
      }
      if (state.phase === 'play') completeStage(false);

      if (dt > 0) {
        const steps = Math.max(1, Math.ceil(dt / (1 / 90)));
        for (let i = 0; i < steps; i++) physics(dt / steps);
      }
    }

    function drawPixels(canvas, context, a) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < a.cells.length; i++) {
        if (!a.cells[i]) continue;
        context.globalAlpha = a.painted[i] ? 1 : .20;
        context.fillStyle = rgb(a.cells[i]);
        context.fillRect(i % a.w, Math.floor(i / a.w), 1, 1);
      }
      context.globalAlpha = 1;
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, el.board.width / dpr, el.board.height / dpr);
      const gradient = ctx.createLinearGradient(0, 0, 0, Math.max(1, height));
      gradient.addColorStop(0, state.feverTime > 0 ? '#492335' : '#20283b');
      gradient.addColorStop(1, '#101422');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const ch = state.chain;
      if (ch.length > 1) {
        ctx.beginPath();
        ch.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.lineWidth = Math.max(3, radius * .29);
        ctx.lineCap = ctx.lineJoin = 'round';
        ctx.strokeStyle = rgb(mix(stage.groups[ch[0].type].c, [255, 255, 255], .55));
        ctx.stroke();
      }
      const selected = new Set(ch);
      for (const p of state.pieces) {
        if (p.y < -radius) continue;
        if (p.type < 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * .92, 0, Math.PI * 2);
          ctx.fillStyle = p.armed ? '#d94e52' : '#282534';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffd166';
          ctx.stroke();
          ctx.fillStyle = '#fff1c0';
          ctx.font = `800 ${Math.max(6, Math.round(radius * .43))}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BOMB', p.x, p.y);
          continue;
        }
        const sprite = sprites[p.type];
        const size = sprite.width / dpr * (selected.has(p) ? 1.08 : 1);
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
        if (selected.has(p)) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 1.04, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }
      }
      if (ch.length) {
        const p = ch[ch.length - 1];
        const x = clamp(p.x + radius * .73, 9, width - 9);
        const y = clamp(p.y - radius * .73, 9, height - 9);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(7, radius * .37), 0, Math.PI * 2);
        ctx.fillStyle = ch.length >= CFG.BOMB_CHAIN ? '#a5274c' :
          ch.length >= CFG.MIN_CHAIN ? '#08785e' : '#1b2234';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ch.length), x, y);
      }
      if (stage.dirty) {
        drawPixels(el.art, artCtx, stage);
        stage.dirty = false;
      }

      fx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fx.clearRect(0, 0, el.fx.width / dpr, el.fx.height / dpr);
      for (const p of state.sparks) {
        fx.globalAlpha = 1 - p.age / .42;
        fx.fillStyle = p.color;
        fx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      for (const f of state.flyers) {
        if (f.age < 0 || !artBox) continue;
        const t = clamp(f.age / f.duration, 0, 1), u = 1 - t;
        const dest = artPoint(f.indexes[0]);
        const cx = (f.sx + dest.x) * .5 + f.bend;
        const cy = Math.min(f.sy, dest.y) - 38;
        const x = u * u * f.sx + 2 * u * t * cx + t * t * dest.x;
        const y = u * u * f.sy + 2 * u * t * cy + t * t * dest.y;
        fx.globalAlpha = .24;
        fx.fillStyle = f.color;
        fx.fillRect(x - 7, y - 7, 14, 14);
        fx.globalAlpha = 1;
        fx.fillRect(x - 3, y - 3, 6, 6);
        fx.strokeStyle = '#fff';
        fx.lineWidth = 1;
        fx.strokeRect(x - 3, y - 3, 6, 6);
      }
      for (const p of state.flashes) {
        const t = p.age / .32;
        fx.globalAlpha = (1 - t) * .85;
        fx.beginPath();
        fx.arc(p.x, p.y, p.reach ? p.reach * (.25 + .75 * t) : 2 + t * 11, 0, Math.PI * 2);
        fx.strokeStyle = p.color;
        fx.lineWidth = 2;
        fx.stroke();
      }
      fx.textAlign = 'center';
      fx.textBaseline = 'middle';
      fx.font = '900 16px system-ui';
      for (const p of state.labels) {
        fx.globalAlpha = 1 - p.age / .8;
        fx.strokeStyle = '#111827';
        fx.lineWidth = 3;
        fx.strokeText(p.text, p.x, p.y - p.age * 35);
        fx.fillStyle = p.color;
        fx.fillText(p.text, p.x, p.y - p.age * 35);
      }
      fx.globalAlpha = 1;
    }

    function updateHud() {
      setText(el.score, state.score.toLocaleString());
      setText(el.clock, (state.skillFreeze > 0 ? '❄️' : '') + Math.ceil(state.time));
      el.clock.classList.toggle('warn', state.time <= 10 && state.phase === 'play' && state.skillFreeze <= 0);
      setText(el.count, '完成 ' + state.completed.length);
      el.fever.style.width = (state.feverTime > 0
        ? 100 * state.feverTime / CFG.FEVER_TIME : state.fever) + '%';
      const skNeed = activeSkin.skill.need;
      const skPct = clamp(Math.round(100 * state.skillCharge / skNeed), 0, 100);
      const skReady = state.phase === 'play' && state.skillCharge >= skNeed;
      el.skill.disabled = !skReady;
      el.skill.classList.toggle('ready', skReady);
      el.skill.querySelector('i').style.width = skPct + '%';
      setText(el.skill.querySelector('span'), skReady ? `${activeSkin.skin.e} スキルOK!` : `${activeSkin.skin.e} ${skPct}%`);
      el.shuffle.disabled = state.phase !== 'play' || state.shuffleCd > 0;
      setText(el.shuffle, state.shuffleCd > 0
        ? `シャッフル (${Math.ceil(state.shuffleCd)})` : 'シャッフル');
      if (!artUiDirty) return;
      artUiDirty = false;
      const percent = Math.floor(100 * stage.count / stage.total);
      meterFill.style.width = percent + '%';
      setText(meterText, percent + '%');
      el.meter.setAttribute('aria-valuenow', String(percent));
      stage.groups.forEach((g, i) => {
        const label = g.wild ? '補助色：残りドットを塗る' : `残り${g.remaining}ドット`;
        setText(chips[i], `${MARKS[i]} ${g.wild ? '＋' : g.remaining || '✓'}`);
        chips[i].title = label;
        chips[i].setAttribute('aria-label', `${MARKS[i]} ${label}`);
      });
    }

    function saveResult(earned) {
      let best = Number(hostSave()?.minigameTsum2HighScore) || 0;
      const newBest = state.score > best;
      best = Math.max(best, state.score);
      const s = hostSave();
      if (!s || typeof s !== 'object') return { best, newBest, status: 'missing' };

      try {
        s.coins = (Number(s.coins) || 0) + earned;
        s.minigameTsum2HighScore = best;
        if (typeof persist === 'function') persist();
        else if (typeof window.persist === 'function') window.persist();
        else return { best, newBest, status: 'memory' };
      } catch (e) {
        console.warn('[minigame_tsum2] Saving failed', e);
        return { best, newBest, status: 'error' };
      } finally {
        try {
          if (typeof updateCoins === 'function') updateCoins();
          else if (typeof window.updateCoins === 'function') window.updateCoins();
        } catch (e) {
          console.warn('[minigame_tsum2] Coin display update failed', e);
        }
      }
      return { best, newBest, status: 'saved' };
    }

    function finish() {
      if (state.phase === 'result') return;
      state.phase = 'result';
      clearInput();
      state.bombs.length = 0;
      for (const f of state.flyers) land(f, false);
      state.flyers.length = 0;
      completeStage(true);
      announce('TIME UP!', 0);

      const earned = Math.floor(state.score / CFG.COIN_DIVISOR) +
        state.completed.length * CFG.COINS_PER_ART;
      const result = saveResult(earned);
      if (closed) return;
      setText(el.best, result.best.toLocaleString());
      showResult(earned, result);
      sound('fanfare');
    }

    function showResult(earned, result) {
      el.result.innerHTML = `
        <div class="mta-card">
          <h2>TIME UP!</h2>
          <p class="mta-final" data-final></p>
          <p data-summary></p>
          <p data-reward></p>
          <p data-save-note hidden></p>
          <div class="mta-gallery" data-gallery></div>
          <div class="mta-actions">
            <button type="button" data-retry>もう一度</button>
            <button type="button" class="mta-secondary" data-close>とじる</button>
          </div>
        </div>`;
      setText($('[data-final]'), state.score.toLocaleString() + ' 点');
      setText($('[data-summary]'), `完成 ${state.completed.length}枚 ｜ BEST ${result.best.toLocaleString()}` +
        (result.newBest && result.status === 'saved' ? '（更新！）' : ''));
      setText($('[data-reward]'), result.status === 'saved'
        ? `獲得コイン：+${earned}` : `今回の報酬：${earned}コイン`);
      const note = $('[data-save-note]');
      const messages = {
        missing: '保存先が見つからず、報酬は反映されていません。',
        memory: '報酬は現在のセーブデータに反映しましたが、永続保存は確認できません。',
        error: '保存処理でエラーが発生しました。報酬の保存状態を確認してください。'
      };
      if (messages[result.status]) {
        setText(note, messages[result.status]);
        note.hidden = false;
      }

      const gallery = $('[data-gallery]');
      function addArt(a, label) {
        const figure = document.createElement('figure');
        const thumb = document.createElement('canvas');
        thumb.width = a.w;
        thumb.height = a.h;
        thumb.setAttribute('aria-label', label);
        const tc = thumb.getContext('2d');
        if (tc) drawPixels(thumb, tc, a);
        const caption = document.createElement('figcaption');
        caption.textContent = label;
        caption.title = label;
        figure.append(thumb, caption);
        gallery.appendChild(figure);
      }

      state.completed.forEach(a => addArt(a, '✓ ' + a.name));
      if (!stage.done && stage.count) {
        addArt(stage, `${stage.name} ${Math.floor(100 * stage.count / stage.total)}%`);
      }
      if (!gallery.children.length) {
        const empty = document.createElement('p');
        empty.textContent = '今回は完成したアートがありません。';
        gallery.replaceWith(empty);
      }
      $('[data-retry]').onclick = () => { sound('init'); sound('tap'); start(); };
      $('[data-close]').onclick = () => { sound('tap'); close(); };
      el.result.hidden = false;
      $('[data-retry]').focus();
    }

    function frame(now) {
      raf = 0;
      if (closed || document.hidden) return;
      const elapsed = last ? Math.max(0, (now - last) / 1000) : 0;
      last = now;
      update(Math.min(.05, elapsed), elapsed);
      if (closed) return;
      draw();
      updateHud();
      if (state.phase !== 'result') raf = requestAnimationFrame(frame);
    }

    function start() {
      if (closed) return;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clearInput();
      el.result.hidden = true;
      el.result.replaceChildren();
      state = {
        phase: 'ready', transition: .7, time: CFG.TIME, score: 0, completed: [],
        fever: 0, feverTime: 0, shuffleCd: 0, spawn: 0, moveCheck: 1.5,
        skillCharge: 0, skillFreeze: 0, skillRush: 0, skillRushMul: 1,
        pieces: [], bombs: [], flyers: [], sparks: [], flashes: [], labels: [],
        pointer: null, chain: [], bombTap: null, lastPoint: null, bannerTime: 0
      };
      setText(el.best, (Number(hostSave()?.minigameTsum2HighScore) || 0).toLocaleString());
      setStage();
      resize();
      initialFill();
      announce('READY…', .75);
      draw();
      updateHud();
      el.exit.focus();
      last = performance.now();
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }

    function close() {
      if (closed) return;
      closed = true;
      clearInput();
      if (raf) cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
      events.abort();
      root.remove();
      try {
        if (typeof onClose === 'function') onClose();
      } finally {
        if (!document.querySelector('.mta-root') && document.activeElement === document.body &&
            previousFocus?.isConnected && typeof previousFocus.focus === 'function') {
          previousFocus.focus();
        }
      }
    }

    listen(el.board, 'pointerdown', pointerDown);
    listen(el.board, 'pointermove', e => {
      if (state.phase === 'play' && state.pointer === e.pointerId) trace(localPoint(e));
    });
    listen(el.board, 'pointerup', pointerUp);
    for (const type of ['pointercancel', 'lostpointercapture', 'pointerleave']) {
      listen(el.board, type, e => {
        if (state.pointer !== e.pointerId) return;
        if (type === 'pointerleave' && el.board.hasPointerCapture(e.pointerId)) return;
        clearInput();
      });
    }
    listen(el.board, 'contextmenu', e => e.preventDefault());
    listen(el.skill, 'click', triggerSkill);
    listen(el.shuffle, 'click', () => shuffleBoard(false));
    listen(el.exit, 'click', close);
    listen(window, 'resize', resize);
    listen(window, 'blur', clearInput);
    listen(document, 'visibilitychange', () => {
      clearInput();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = performance.now();
      if (!document.hidden && state.phase !== 'result') raf = requestAnimationFrame(frame);
    });
    listen(document, 'keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        const scope = state.phase === 'result' ? el.result : root;
        const buttons = [...scope.querySelectorAll('button:not(:disabled)')]
          .filter(button => !button.closest('[hidden]'));
        if (!buttons.length) return;
        const index = buttons.indexOf(document.activeElement);
        if (index < 0 || (e.shiftKey ? index === 0 : index === buttons.length - 1)) {
          e.preventDefault();
          buttons[e.shiftKey ? buttons.length - 1 : 0].focus();
        }
      }
    });

    start();
    if (!closed && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize);
      observer.observe(el.wrap);
    }
  };

  let loaded = typeof AF_LOADED !== 'undefined' && Array.isArray(AF_LOADED)
    ? AF_LOADED : window.AF_LOADED;
  if (!Array.isArray(loaded)) loaded = window.AF_LOADED = [];
  if (!loaded.includes('minigame_tsum2.js')) loaded.push('minigame_tsum2.js');
})();
