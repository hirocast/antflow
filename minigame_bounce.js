// File: minigame_bounce.js
(() => {
  'use strict';

  const W = 420, H = 680;
  const R = 5.3, LEFT = 10, RIGHT = W - 10, TOP = 16;
  const PAD_Y = 576, PAD_H = 12;
  const STEP = 1 / 120, EPS = 1e-7, SEPARATION = 0.03;
  const CLEAR_POINTS = 500, MAX_BALLS = 7, MAX_CELLS = 180;
  const FALLBACK_COLORS = [
    '#000000', '#ffffff', '#ff5252', '#ff8a80', '#ffab40',
    '#ffd740', '#ffff8d', '#69f0ae', '#00e676', '#40c4ff',
    '#448aff', '#7c4dff', '#e040fb', '#8d6e63', '#bdbdbd',
    '#616161', '#1de9b6', '#f48fb1', '#a1887f', '#90caf9', '#fff59d'
  ];
  const ITEMS = [
    { id: 'multi',  mark: '+2球', name: 'マルチボール', color: '#7ddcff', weight: 34 },
    { id: 'pierce', mark: '貫',   name: '貫通ボール',   color: '#ffd178', weight: 28 },
    { id: 'wide',   mark: '幅',   name: 'ワイドバー',   color: '#a8ed9c', weight: 25 },
    { id: 'bonus',  mark: '+100', name: 'ボーナス +100点', color: '#ffb7e1', weight: 13 }
  ];

  const CSS = `
    .afibn-game{position:fixed;inset:0;z-index:2147483000;display:flex;
      justify-content:center;background:#080e1b;color:#edf5ff;
      font:14px system-ui,-apple-system,sans-serif;overscroll-behavior:contain}
    .afibn-game,.afibn-game *{box-sizing:border-box}
    .afibn-game button{min-height:44px;border:1px solid #53668a;border-radius:10px;
      padding:6px 12px;background:#233653;color:#fff;font:inherit;font-weight:700;
      cursor:pointer;touch-action:manipulation}
    .afibn-game button:focus-visible{outline:3px solid #fff;outline-offset:2px}
    .afibn-game button:disabled{opacity:.45;cursor:default}
    .afibn-game .bn-primary{background:#a6e8ff;color:#14283b;border-color:#a6e8ff}
    .afibn-game .bn-shell{width:100%;max-width:540px;height:100%;display:flex;
      flex-direction:column;min-height:0;background:#111b2f}
    .afibn-game .bn-head{flex:none;padding:6px 10px 5px;
      padding-top:calc(6px + env(safe-area-inset-top,0px))}
    .afibn-game .bn-top,.afibn-game .bn-buttons{display:flex;align-items:center;gap:8px}
    .afibn-game .bn-title{flex:1;margin:0;font-size:17px}
    .afibn-game .bn-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
      gap:6px;margin:5px 0;font-variant-numeric:tabular-nums}
    .afibn-game .bn-stat{min-width:0;padding:4px 7px;background:#1c2b45;border-radius:7px}
    .afibn-game .bn-stat small{display:block;color:#becde3;font-size:10px}
    .afibn-game .bn-stat b{display:block;overflow:hidden;text-overflow:ellipsis;
      white-space:nowrap;font-size:16px}
    .afibn-game .bn-low{color:#ffacaa}
    .afibn-game .bn-progress{height:4px;background:#263752;border-radius:4px;overflow:hidden}
    .afibn-game .bn-progress i{display:block;width:0;height:100%;
      background:linear-gradient(90deg,#74dfff,#c3a7ff)}
    .afibn-game .bn-art{margin-top:4px;overflow:hidden;white-space:nowrap;
      text-overflow:ellipsis;color:#c9daf1;font-size:11px}
    .afibn-game .bn-field{position:relative;flex:1;min-height:0;overflow:hidden}
    .afibn-game .bn-canvas{display:block;width:100%;height:100%;touch-action:none;
      user-select:none;-webkit-user-select:none}
    .afibn-game .bn-layer{position:absolute;inset:0;display:grid;place-items:center;
      padding:10px;background:rgba(6,11,24,.8)}
    .afibn-game .bn-layer[hidden]{display:none}
    .afibn-game .bn-card{width:100%;max-width:410px;max-height:100%;min-height:0;
      overflow:auto;overscroll-behavior:contain;touch-action:pan-y;padding:15px;
      background:#17263f;border:1px solid #4a6087;border-radius:14px}
    .afibn-game .bn-card h3{margin:0 0 8px;font-size:22px}
    .afibn-game .bn-card p,.afibn-game .bn-card ul{margin:8px 0;line-height:1.45}
    .afibn-game .bn-card ul{padding-left:20px}
    .afibn-game .bn-buttons{flex-wrap:wrap;margin-top:10px}
    .afibn-game .bn-chips{display:flex;flex-wrap:wrap;gap:4px}
    .afibn-game .bn-chip{border:1px solid currentColor;border-radius:8px;padding:3px 6px;
      font-size:11px}
    .afibn-game .bn-result{font-size:30px;font-weight:800}
    .afibn-game .bn-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(75px,1fr));
      gap:6px;margin-top:8px}
    .afibn-game .bn-gallery figure{min-width:0;margin:0;padding:5px;text-align:center;
      border-radius:7px;background:#0d182b}
    .afibn-game .bn-gallery canvas{display:block;width:64px;max-width:100%;height:auto;
      margin:auto;image-rendering:pixelated}
    .afibn-game .bn-gallery figcaption{font-size:11px;overflow-wrap:anywhere}
    .afibn-game .bn-footer{flex:none;padding:3px 8px calc(5px + env(safe-area-inset-bottom,0px));
      text-align:center;color:#c9ddf4;font-size:11px;min-height:24px}
    .afibn-game .bn-sr{position:absolute;width:1px;height:1px;overflow:hidden;
      clip-path:inset(50%);white-space:nowrap}
  `;

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const integer = value => Number.isFinite(Number(value))
    ? Math.max(0, Math.floor(Number(value))) : 0;
  const validColor = c => Number.isInteger(c) && c >= 0 && c < 21;
  let active = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, action, primary = false) {
    const node = element('button', primary ? 'bn-primary' : '', text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fallbackArt() {
    const pattern = [
      '..22..22..', '.32233223.', '3222222223',
      '3222222223', '.32222223.', '..322223..',
      '...3223...', '....33....'
    ];
    return {
      W: pattern[0].length, H: pattern.length, name: 'ハート',
      grid: Int8Array.from(pattern.join(''), c => c === '.' ? -1 : Number(c))
    };
  }

  function buildStage(source, id, name) {
    if (!source) return null;
    const { W: sw, H: sh, grid } = source;
    if (!Number.isSafeInteger(sw) || !Number.isSafeInteger(sh) ||
        sw < 1 || sh < 1 || sw * sh > 1048576 ||
        !grid || grid.length < sw * sh) return null;

    let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (!validColor(grid[y * sw + x])) continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
    if (x1 < 0) return null;

    // 透明余白を除いてから縮小。透明だけの領域はブロックにしない。
    const artW = x1 - x0 + 1, artH = y1 - y0 + 1;
    const counts = new Uint32Array(21);
    let cols, rows, pixels, occupied;
    for (let scale = Math.max(1, artW / 24, artH / 22); ; scale *= 1.18) {
      cols = clamp(Math.round(artW / scale), 1, 24);
      rows = clamp(Math.round(artH / scale), 1, 22);
      pixels = new Int8Array(cols * rows).fill(-1);
      occupied = 0;
      for (let row = 0; row < rows; row++) {
        const fromY = y0 + Math.floor(row * artH / rows);
        const toY = y0 + Math.floor((row + 1) * artH / rows);
        for (let col = 0; col < cols; col++) {
          const fromX = x0 + Math.floor(col * artW / cols);
          const toX = x0 + Math.floor((col + 1) * artW / cols);
          counts.fill(0);
          let best = -1, count = 0;
          for (let y = fromY; y < toY; y++) {
            for (let x = fromX; x < toX; x++) {
              const c = grid[y * sw + x];
              if (validColor(c) && ++counts[c] > count) {
                best = c;
                count = counts[c];
              }
            }
          }
          if (best < 0) continue;
          pixels[row * cols + col] = best;
          occupied++;
        }
      }
      if (occupied <= MAX_CELLS) break;
    }

    const size = Math.min(346 / cols, 264 / rows, 32);
    const x = (W - cols * size) / 2;
    const y = 44 + (264 - rows * size) * 0.3;
    const inset = Math.min(0.65, size * 0.04);
    const lookup = new Array(pixels.length);
    const cells = [];
    const colorCounts = new Uint32Array(21);
    pixels.forEach((color, i) => {
      if (color < 0) return;
      colorCounts[color]++;
      const cell = {
        i, color, broken: false, skipped: false, at: -1,
        x: x + (i % cols) * size + inset,
        y: y + Math.floor(i / cols) * size + inset,
        w: size - 2 * inset, h: size - 2 * inset
      };
      lookup[i] = cell;
      cells.push(cell);
    });
    const colorStats = [];
    for (let c = 0; c < 21; c++) {
      if (colorCounts[c] > 0) colorStats.push({ color: c, count: colorCounts[c] });
    }
    return {
      id, name: String(source.name || name || `お題 ${id}`).slice(0, 100),
      cols, rows, size, x, y, lookup, cells, colorStats, total: occupied, left: occupied
    };
  }

  // 円の連続衝突判定。矩形の4辺と、半径Rで丸めた4隅を検査する。
  function sweep(x, y, vx, vy, cell, duration) {
    const l = cell.x, r = l + cell.w, t = cell.y, b = t + cell.h;
    const dx = x - clamp(x, l, r), dy = y - clamp(y, t, b);
    const d2 = dx * dx + dy * dy;
    if (d2 < R * R - EPS) {
      if (d2 > EPS) {
        const d = Math.sqrt(d2);
        return { time: 0, nx: dx / d, ny: dy / d, push: R - d + SEPARATION };
      }
      const face = [[x - l, -1, 0], [r - x, 1, 0],
                    [y - t, 0, -1], [b - y, 0, 1]]
        .reduce((a, f) => f[0] < a[0] ? f : a);
      return { time: 0, nx: face[1], ny: face[2], push: R + face[0] + SEPARATION };
    }

    let hit = null;
    function test(time, nx, ny) {
      if (time < -EPS || time > duration + EPS || vx * nx + vy * ny >= -EPS) return;
      time = clamp(time, 0, duration);
      if (!hit || time < hit.time) hit = { time, nx, ny, push: SEPARATION };
    }

    if (Math.abs(vx) > EPS) {
      const dir = vx > 0 ? -1 : 1;
      const time = ((dir < 0 ? l - R : r + R) - x) / vx;
      const cy = y + vy * time;
      if (cy >= t && cy <= b) test(time, dir, 0);
    }
    if (Math.abs(vy) > EPS) {
      const dir = vy > 0 ? -1 : 1;
      const time = ((dir < 0 ? t - R : b + R) - y) / vy;
      const cx = x + vx * time;
      if (cx >= l && cx <= r) test(time, 0, dir);
    }

    const a = vx * vx + vy * vy;
    if (a <= EPS) return hit;
    for (const [cx, cy, sx, sy] of [
      [l, t, -1, -1], [r, t, 1, -1], [l, b, -1, 1], [r, b, 1, 1]
    ]) {
      const ox = x - cx, oy = y - cy;
      const q = ox * vx + oy * vy;
      const disc = q * q - a * (ox * ox + oy * oy - R * R);
      if (disc < 0) continue;
      const time = (-q - Math.sqrt(disc)) / a;
      if (time < -EPS || time > duration + EPS) continue;
      const nx = ox + vx * time, ny = oy + vy * time;
      if (nx * sx >= -EPS && ny * sy >= -EPS) test(time, nx / R, ny / R);
    }
    return hit;
  }

  window.openMiniBounce = function (onClose) {
    if (active) {
      active.focus();
      return;
    }

    const artList = typeof ARTS !== 'undefined' && ARTS ? ARTS : [];
    const palette = typeof HEX !== 'undefined' && HEX ? HEX : [];
    const saveData = typeof save !== 'undefined' && save &&
      typeof save === 'object' ? save : null;
    const canPersist = !!saveData && typeof persist === 'function';
    const color = i => typeof palette[i] === 'string' ? palette[i] : FALLBACK_COLORS[i];
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const reduceMotion = typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const root = element('div', 'afibn-game');
    root.tabIndex = -1;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'バウンドぬりえ');
    const style = element('style', '', CSS);
    const shell = element('div', 'bn-shell');
    const head = element('header', 'bn-head');
    const top = element('div', 'bn-top');
    const pauseBtn = button('一時停止', () => phase === 'paused' ? resume() : pause());
    const closeBtn = button('閉じる', requestClose);
    top.append(element('h2', 'bn-title', 'バウンドぬりえ'), pauseBtn, closeBtn);
    const stats = element('div', 'bn-stats');
    function stat(label) {
      const box = element('div', 'bn-stat');
      const value = element('b');
      box.append(element('small', '', label), value);
      stats.appendChild(box);
      return value;
    }
    const scoreEl = stat('スコア'), timeEl = stat('完成枚数'), bestEl = stat('ベスト');
    const progress = element('div', 'bn-progress');
    const fill = element('i');
    progress.setAttribute('aria-hidden', 'true');
    progress.appendChild(fill);
    const artEl = element('div', 'bn-art');
    head.append(top, stats, progress, artEl);

    const field = element('div', 'bn-field');
    const canvas = element('canvas', 'bn-canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const layer = element('div', 'bn-layer');
    const card = element('section', 'bn-card');
    card.tabIndex = -1;
    layer.appendChild(card);
    field.append(canvas, layer);
    const footer = element('footer', 'bn-footer');
    const live = element('div', 'bn-sr');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    shell.append(head, field, footer, live);
    root.append(style, shell);
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';

    let ctx = null;
    try { ctx = canvas.getContext('2d'); } catch (_) { /* エラー画面で案内 */ }

    let phase = 'intro', resumePhase = 'play', closed = false, started = false;
    let settlement = null, best = saveData ? integer(saveData.minigameBounceHighScore) : 0;
    let stage = null, stageNo = 0, bag = [], completed = [], roulette = null;
    const invalid = new Set();
    const validArtCount = Number.isSafeInteger(artList.length) ? artList.length : 0;
    let score = 0, clock = 0, combo = 0, lastHit = -Infinity;
    let wideUntil = 0, pierceUntil = 0, clearLeft = 0, serveLeft = 0;
    let notice = '', noticeUntil = 0, dryHits = 0, lastDrop = -Infinity;
    let balls = [], items = [], particles = [];
    const paddle = { x: W / 2, target: W / 2, w: 84 };
    const keys = { left: false, right: false };
    const view = { w: 1, h: 1, scale: 1, x: 0, y: 0, dpr: 1 };
    let drag = null, frameId = 0, lastFrame = null, accumulator = 0;
    let observer = null;
    const soundTimes = Object.create(null);

    function sound(type, gap = 65) {
      const now = performance.now();
      if (now - (soundTimes[type] ?? -Infinity) < gap) return;
      soundTimes[type] = now;
      try {
        if (typeof Sound !== 'undefined' && Sound && typeof Sound[type] === 'function') {
          const result = Sound[type]();
          if (result && typeof result.catch === 'function') result.catch(() => {});
        }
      } catch (_) { /* 音がなくても続行 */ }
    }

    function setText(node, value) {
      value = String(value);
      if (node.textContent !== value) node.textContent = value;
    }

    function focus(node) {
      if (!node || closed) return;
      try { node.focus({ preventScroll: true }); } catch (_) { node.focus(); }
    }

    active = {
      focus: () => focus(layer.hidden ? root : card.querySelector('button') || card)
    };

    function showCard(title, content, actions) {
      card.replaceChildren(element('h3', '', title), ...content);
      const row = element('div', 'bn-buttons');
      row.append(...actions);
      card.appendChild(row);
      layer.hidden = false;
      focus(card.querySelector('button') || card);
    }

    function hideCard() {
      layer.hidden = true;
      card.replaceChildren();
      focus(root);
    }

    function announce(text) { live.textContent = text; }

    function message(text) {
      notice = text;
      noticeUntil = clock + 1.65;
    }

    function refillBag() {
      bag = [];
      for (let i = 1; i <= validArtCount; i++) if (!invalid.has(i)) bag.push(i);
      shuffle(bag);
      if (bag.length > 1 && stage && bag[bag.length - 1] === stage.id) {
        const last = bag.length - 1;
        [bag[0], bag[last]] = [bag[last], bag[0]];
      }
    }

    function chooseStage() {
      if (!bag.length) refillBag();
      while (bag.length) {
        const id = bag.pop();
        try {
          const source = typeof getArt === 'function' ? getArt(id) : null;
          const next = buildStage(source, id, artList[id - 1] && artList[id - 1].n);
          if (next) return next;
        } catch (_) { /* 読めないお題を飛ばす */ }
        invalid.add(id);
      }
      // 周回末尾が無効データだけだった場合は、残る有効なお題で再抽選する。
      if (validArtCount > invalid.size && typeof getArt === 'function') {
        refillBag();
        while (bag.length) {
          const id = bag.pop();
          try {
            const next = buildStage(getArt(id), id, artList[id - 1] && artList[id - 1].n);
            if (next) return next;
          } catch (_) { /* 次の候補へ */ }
          invalid.add(id);
        }
      }
      return buildStage(fallbackArt(), 0, 'ハート');
    }

    function planRoulette(st) {
      const stats = st.colorStats.slice();
      if (stats.length <= 1) return null;
      const maxPick = Math.min(3, stats.length - 1);
      const want = 1 + Math.floor(Math.random() * maxPick);
      const minKeep = Math.min(st.cells.length - 1, Math.max(8, Math.ceil(st.cells.length * 0.22)));
      shuffle(stats);
      let remaining = st.cells.length;
      const targets = [];
      for (const entry of stats) {
        if (targets.length >= want) break;
        if (remaining - entry.count >= minKeep) {
          targets.push(entry.color);
          remaining -= entry.count;
        }
      }
      if (!targets.length) {
        stats.sort((a, b) => a.count - b.count);
        if (st.cells.length - stats[0].count >= 4) targets.push(stats[0].color);
      }
      if (!targets.length) return null;
      const baseStop = reduceMotion ? 0.14 : 0.52;
      const stepStop = reduceMotion ? 0.09 : 0.28;
      return {
        candidates: st.colorStats.map(u => u.color),
        targets,
        elapsed: 0,
        stopTimes: targets.map((_, idx) => baseStop + idx * stepStop),
        stopped: targets.map(() => false),
        applied: false,
        finishWait: reduceMotion ? 0.14 : 0.48
      };
    }

    function applyRouletteRemoval() {
      if (!stage || !roulette || roulette.applied) return;
      roulette.applied = true;
      roulette.stopped.fill(true);
      const removeSet = new Set(roulette.targets);
      let kept = 0;
      for (const cell of stage.cells) {
        if (removeSet.has(cell.color)) {
          cell.skipped = true;
          cell.at = clock;
          burst(cell.x + cell.w / 2, cell.y + cell.h / 2, color(cell.color), 3, 85);
        } else {
          kept++;
        }
      }
      stage.total = kept;
      stage.left = kept;
      sound('starPing');
      message(`${roulette.targets.length}色が抜けた！`);
      announce(`ルーレットの結果、${roulette.targets.length}色が抜けました。残り${kept}ブロック。`);
    }

    function skipRoulette() {
      if (phase !== 'roulette' || !roulette) return;
      if (!roulette.applied) applyRouletteRemoval();
      roulette = null;
      phase = 'play';
      serve(0.35);
      hud();
      draw();
    }

    function nextStage() {
      stage = chooseStage();
      stageNo++;
      combo = 0; lastHit = -Infinity;
      dryHits = 0; lastDrop = clock;
      items = [];
      balls = [];
      notice = ''; noticeUntil = 0;
      roulette = planRoulette(stage);
      if (roulette) {
        phase = 'roulette';
        announce(`お題 ${stage.name}。抜ける色のルーレットを開始します。`);
      } else {
        phase = 'play';
        serve(0.65);
        announce(`お題 ${stage.name}`);
      }
    }

    function speed() { return Math.min(495, 338 + (stageNo - 1) * 13); }
    function multiplier() { return Math.min(5, 1 + Math.floor(Math.max(0, combo - 1) / 6)); }

    function serve(delay) {
      serveLeft = delay;
      balls = [{ x: paddle.x, y: PAD_Y - R - 2, vx: 0, vy: 0, waiting: true, trail: [] }];
    }

    function launch() {
      const ball = balls.find(b => b.waiting);
      if (!ball) return;
      const angle = (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.19);
      ball.waiting = false;
      ball.vx = Math.sin(angle) * speed();
      ball.vy = -Math.cos(angle) * speed();
      serveLeft = 0;
      sound('tap');
    }

    function normalize(ball) {
      const sp = speed();
      const length = Math.hypot(ball.vx, ball.vy) || 1;
      ball.vx *= sp / length;
      ball.vy *= sp / length;
      const minY = sp * 0.24;
      if (Math.abs(ball.vy) < minY) {
        ball.vy = (ball.vy < 0 ? -1 : 1) * minY;
        ball.vx = (ball.vx < 0 ? -1 : 1) * Math.sqrt(sp * sp - minY * minY);
      }
    }

    function burst(x, y, c, count, force = 115) {
      if (reduceMotion) return;
      for (let i = 0; i < count && particles.length < 220; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = force * (0.3 + Math.random() * 0.8);
        const life = 0.35 + Math.random() * 0.45;
        particles.push({
          x, y, color: c, life, max: life,
          vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - force * 0.28,
          size: 2 + Math.random() * 4
        });
      }
    }

    function drop(cell) {
      dryHits++;
      if (items.length >= 4 || clock - lastDrop < 0.25 ||
          (dryHits < 13 && Math.random() >= 0.10)) return;
      let roll = Math.random() * 100;
      let def = ITEMS[ITEMS.length - 1];
      for (const item of ITEMS) {
        roll -= item.weight;
        if (roll < 0) { def = item; break; }
      }
      items.push({ x: cell.x + cell.w / 2, y: cell.y + cell.h / 2, def });
      dryHits = 0;
      lastDrop = clock;
    }

    function snapshot() {
      return {
        name: stage.name, cols: stage.cols, rows: stage.rows,
        pixels: stage.cells.map(c => ({
          i: c.i, color: c.color, broken: c.broken, skipped: c.skipped
        })),
        done: stage.total - stage.left, total: stage.total
      };
    }

    function complete() {
      phase = 'clear';
      clearLeft = reduceMotion ? 0.7 : 1.25;
      score += CLEAR_POINTS;
      completed.push(snapshot());
      balls = [];
      items = [];
      for (let i = 0; i < stage.cells.length; i += Math.max(1, Math.ceil(stage.cells.length / 45))) {
        const c = stage.cells[i];
        burst(c.x + c.w / 2, c.y + c.h / 2, color(c.color), 4, 235);
      }
      sound('fanfare');
      announce(`${stage.name}をクリア。${CLEAR_POINTS}点を獲得。`);
    }

    function paint(cell) {
      if (phase !== 'play' || cell.broken || cell.skipped) return;
      cell.broken = true;
      cell.at = clock;
      stage.left--;
      combo = clock - lastHit <= 2.4 ? combo + 1 : 1;
      lastHit = clock;
      score += 10 * multiplier();
      burst(cell.x + cell.w / 2, cell.y + cell.h / 2, color(cell.color), 5);
      sound('pop', 44);
      if (!stage.left) complete();
      else drop(cell);
    }

    function collect(item) {
      const { def } = item;
      let label = def.name;
      if (def.id === 'wide') {
        wideUntil = Math.min(clock + 16, Math.max(clock, wideUntil) + 8);
      } else if (def.id === 'pierce') {
        pierceUntil = Math.min(clock + 12, Math.max(clock, pierceUntil) + 6);
      } else if (def.id === 'bonus') {
        score += 100;
      } else if (balls.length >= MAX_BALLS) {
        score += 50;
        label = 'ボール上限：+50点';
      } else {
        launch();
        const source = balls[0];
        if (source) {
          for (const angle of [-0.45, 0.45]) {
            if (balls.length >= MAX_BALLS) break;
            const c = Math.cos(angle), s = Math.sin(angle);
            const copy = {
              x: source.x, y: source.y, waiting: false, trail: [],
              vx: source.vx * c - source.vy * s,
              vy: source.vx * s + source.vy * c
            };
            copy.vy = -Math.abs(copy.vy);
            normalize(copy);
            balls.push(copy);
          }
        }
      }
      burst(item.x, item.y, def.color, 12, 150);
      message(label);
      sound('starPing');
    }

    function advance(ball, dt) {
      let remaining = dt;
      for (let impact = 0; impact < 12 && remaining > EPS; impact++) {
        let collision = null;
        const { x, y, vx, vy } = ball;
        function consider(time, type, nx = 0, ny = 0, push = SEPARATION, cell = null) {
          if (time < -EPS || time > remaining + EPS) return;
          time = clamp(time, 0, remaining);
          if (!collision || time < collision.time) collision = { time, type, nx, ny, push, cell };
        }

        if (vx < -EPS) consider((LEFT + R - x) / vx, 'wall', 1, 0);
        if (vx > EPS) consider((RIGHT - R - x) / vx, 'wall', -1, 0);
        if (vy < -EPS) consider((TOP + R - y) / vy, 'wall', 0, 1);
        if (vy > EPS) {
          consider((H + R - y) / vy, 'lost');
          const toPad = (PAD_Y - R - y) / vy;
          if (toPad >= -EPS && toPad <= remaining + EPS &&
              Math.abs(x + vx * toPad - paddle.x) <= paddle.w / 2 + R) {
            consider(toPad, 'paddle');
          }
        }

        const duration = collision ? collision.time : remaining;
        const endX = x + vx * duration, endY = y + vy * duration;
        const c0 = Math.max(0, Math.floor((Math.min(x, endX) - R - stage.x) / stage.size));
        const c1 = Math.min(stage.cols - 1, Math.floor((Math.max(x, endX) + R - stage.x) / stage.size));
        const r0 = Math.max(0, Math.floor((Math.min(y, endY) - R - stage.y) / stage.size));
        const r1 = Math.min(stage.rows - 1, Math.floor((Math.max(y, endY) + R - stage.y) / stage.size));
        const piercing = clock < pierceUntil;
        const pierced = piercing ? [] : null;

        for (let row = r0; row <= r1; row++) {
          for (let col = c0; col <= c1; col++) {
            const cell = stage.lookup[row * stage.cols + col];
            if (!cell || cell.broken || cell.skipped) continue;
            const hit = sweep(x, y, vx, vy, cell, duration);
            if (!hit) continue;
            if (piercing) pierced.push({ time: hit.time, cell });
            else consider(hit.time, 'cell', hit.nx, hit.ny, hit.push, cell);
          }
        }

        if (pierced && pierced.length) {
          pierced.sort((a, b) => a.time - b.time);
          for (const hit of pierced) {
            paint(hit.cell);
            if (phase !== 'play') return true;
          }
        }

        const travel = collision ? collision.time : remaining;
        ball.x = x + vx * travel;
        ball.y = y + vy * travel;
        remaining -= travel;
        if (!collision) break;
        if (collision.type === 'lost') return false;

        if (collision.type === 'paddle') {
          const offset = clamp((ball.x - paddle.x) / (paddle.w / 2), -1, 1);
          const angle = offset * 1.08;
          ball.y = PAD_Y - R - SEPARATION;
          ball.vx = Math.sin(angle) * speed();
          ball.vy = -Math.cos(angle) * speed();
          sound('tap', 80);
        } else {
          if (collision.cell) {
            paint(collision.cell);
            if (phase !== 'play') return true;
          }
          const { nx, ny, push } = collision;
          const dot = vx * nx + vy * ny;
          if (dot < 0) {
            ball.vx -= 2 * dot * nx;
            ball.vy -= 2 * dot * ny;
          }
          ball.x = clamp(ball.x + nx * push, LEFT + R, RIGHT - R);
          ball.y = Math.max(TOP + R, ball.y + ny * push);
          normalize(ball);
        }
        if (travel < EPS) remaining = Math.max(0, remaining - 0.00001);
      }

      if (!reduceMotion) {
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();
      }
      return true;
    }

    function simulate(dt) {
      clock += dt;
      if (clock - lastHit > 2.4) combo = 0;
      const targetWidth = clock < wideUntil ? 130 : 84;
      paddle.w += (targetWidth - paddle.w) * Math.min(1, dt * 14);
      const lo = LEFT + paddle.w / 2, hi = RIGHT - paddle.w / 2;
      paddle.target += (Number(keys.right) - Number(keys.left)) * 490 * dt;
      paddle.target = clamp(paddle.target, lo, hi);
      paddle.x = clamp(paddle.x + (paddle.target - paddle.x) * Math.min(1, dt * 38), lo, hi);

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const oldY = item.y;
        item.y += 138 * dt;
        if (oldY - 10 <= PAD_Y + PAD_H && item.y + 10 >= PAD_Y &&
            Math.abs(item.x - paddle.x) <= paddle.w / 2 + 15) {
          items.splice(i, 1);
          collect(item);
        } else if (item.y - 10 > H) items.splice(i, 1);
      }

      if (balls[0] && balls[0].waiting) {
        balls[0].x = paddle.x;
        serveLeft -= dt;
        if (serveLeft <= 0) launch();
      }
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        if (ball.waiting) continue;
        const alive = advance(ball, dt);
        if (phase !== 'play') return;
        if (!alive) balls.splice(i, 1);
      }
      if (!balls.length) {
        combo = 0; lastHit = -Infinity;
        sound('deny');
        finish('ゲームオーバー！');
        return;
      }
    }

    function updateEffects(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 270 * dt;
      }
    }

    function resize() {
      if (closed) return;
      const rect = field.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      view.w = rect.width; view.h = rect.height;
      view.dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
      view.scale = Math.min(view.w / W, view.h / H);
      view.x = (view.w - W * view.scale) / 2;
      view.y = (view.h - H * view.scale) / 2;
      const pw = Math.max(1, Math.round(view.w * view.dpr));
      const ph = Math.max(1, Math.round(view.h * view.dpr));
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      releaseDrag();
      draw();
    }

    function hud() {
      setText(scoreEl, score.toLocaleString());
      setText(timeEl, `${completed.length}枚`);
      setText(bestEl, Math.max(best, score).toLocaleString());
      timeEl.classList.remove('bn-low');
      const ratio = stage && stage.total > 0 ? 100 * (stage.total - stage.left) / stage.total : 0;
      const width = `${ratio.toFixed(1)}%`;
      if (fill.style.width !== width) fill.style.width = width;
      setText(artEl, stage
        ? (phase === 'roulette'
          ? `お題 ${stageNo}：${stage.name}　抜ける色を抽選中…`
          : `お題 ${stageNo}：${stage.name}　残り ${stage.left}/${stage.total}`)
        : 'ボールを当てて、ぬりえブロックを崩そう');
      const playable = phase === 'play' || phase === 'clear' || phase === 'roulette' || phase === 'paused';
      pauseBtn.disabled = !playable;
      setText(pauseBtn, phase === 'paused' ? '再開' : '一時停止');
      const status = [];
      if (phase === 'paused' || phase === 'confirm') status.push('一時停止中');
      if (phase === 'clear') status.push(`クリア！ +${CLEAR_POINTS}点`);
      if (phase === 'roulette') status.push('抜ける色ルーレット中（タップ/Spaceでスキップ）');
      if (phase === 'play') {
        if (clock < noticeUntil) status.push(notice);
        if (combo >= 2) status.push(`${combo}連続 ×${multiplier()}`);
        if (clock < pierceUntil) status.push(`貫通 ${Math.ceil(pierceUntil - clock)}秒`);
        if (clock < wideUntil) status.push(`ワイド ${Math.ceil(wideUntil - clock)}秒`);
      }
      setText(footer, status.join(' ・ ') || '左右にドラッグ ／ PC：← →・Spaceで発射');
    }

    function draw() {
      if (!ctx) return;
      const { dpr, scale, x, y, w, h } = view;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0c1526';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();

      ctx.fillStyle = '#14213a';
      ctx.fillRect(LEFT, TOP, RIGHT - LEFT, H - TOP);
      ctx.strokeStyle = '#364968';
      ctx.beginPath();
      ctx.moveTo(LEFT, H - 15);
      ctx.lineTo(LEFT, TOP);
      ctx.lineTo(RIGHT, TOP);
      ctx.lineTo(RIGHT, H - 15);
      ctx.stroke();

      if (stage) {
        const showLast = phase === 'play' && stage.left > 0 && stage.left <= 8;
        for (const c of stage.cells) {
          if (c.broken) {
            if (!reduceMotion && clock - c.at < 0.14) {
              const t = (clock - c.at) / 0.14;
              const s = 1 - t * 0.55;
              const dw = c.w * s, dh = c.h * s;
              ctx.globalAlpha = 0.75 * (1 - t);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(c.x + (c.w - dw) / 2, c.y + (c.h - dh) / 2, dw, dh);
            }
            continue;
          }
          if (c.skipped) {
            if (!reduceMotion && clock - c.at < 0.28) {
              const t = (clock - c.at) / 0.28;
              const s = 1 - t * 0.7;
              const dw = c.w * s, dh = c.h * s;
              ctx.globalAlpha = 0.85 * (1 - t);
              ctx.fillStyle = color(c.color);
              ctx.fillRect(c.x + (c.w - dw) / 2, c.y + (c.h - dh) / 2, dw, dh);
            }
            continue;
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = color(c.color);
          ctx.fillRect(c.x, c.y, c.w, c.h);
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(c.x, c.y, c.w, Math.max(1, c.h * 0.18));
          ctx.strokeStyle = 'rgba(255,255,255,0.14)';
          ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
          if (showLast) {
            ctx.globalAlpha = reduceMotion ? 0.95 : 0.73 + 0.25 * Math.sin(clock * 6);
            ctx.strokeStyle = '#ffe699';
            ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1b2b45';
      ctx.fillRect(LEFT + 1, PAD_Y + 30, RIGHT - LEFT - 2, H - PAD_Y - 30);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '13px system-ui,sans-serif';
      ctx.fillStyle = '#b6cce7';
      ctx.fillText('← このあたりを左右にスライド →', W / 2, H - 34);

      ctx.fillStyle = clock < wideUntil ? '#a8ed9c' : '#a6e8ff';
      ctx.fillRect(paddle.x - paddle.w / 2, PAD_Y, paddle.w, PAD_H);
      ctx.fillStyle = '#f0fbff';
      ctx.fillRect(paddle.x - paddle.w / 2 + 4, PAD_Y + 2, paddle.w - 8, 2);

      ctx.font = 'bold 12px system-ui,sans-serif';
      for (const item of items) {
        ctx.fillStyle = item.def.color;
        ctx.fillRect(item.x - 16, item.y - 10, 32, 20);
        ctx.fillStyle = '#14213a';
        ctx.fillText(item.def.mark, item.x, item.y, 29);
      }

      for (const ball of balls) {
        ctx.fillStyle = clock < pierceUntil ? '#ffd178' : '#f7fcff';
        for (let i = 0; i < ball.trail.length; i++) {
          const p = ball.trail[i];
          ctx.globalAlpha = 0.2 * (i + 1) / ball.trail.length;
          ctx.beginPath();
          ctx.arc(p.x, p.y, R * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of particles) {
        ctx.globalAlpha = p.life / p.max;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      ctx.globalAlpha = 1;
      if (phase === 'roulette' && roulette) {
        const boxX = 36, boxY = 348, boxW = W - 72, boxH = 148;
        ctx.fillStyle = 'rgba(8,16,34,0.92)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#6c8ec4';
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

        ctx.fillStyle = roulette.applied ? '#ffe399' : '#a6e8ff';
        ctx.font = 'bold 18px system-ui,sans-serif';
        ctx.fillText(
          roulette.applied ? `${roulette.targets.length}色が抜けた！` : '抜ける色ルーレット！',
          W / 2, boxY + 26
        );

        const count = roulette.targets.length;
        const slotSize = 48, gap = 16;
        const startX = W / 2 - (count * slotSize + (count - 1) * gap) / 2;
        const slotY = boxY + 52;
        for (let i = 0; i < count; i++) {
          const sx = startX + i * (slotSize + gap);
          const done = roulette.stopped[i];
          const cIdx = done
            ? roulette.targets[i]
            : roulette.candidates[Math.floor(roulette.elapsed * 18 + i * 3) % roulette.candidates.length];
          ctx.fillStyle = color(cIdx);
          ctx.fillRect(sx, slotY, slotSize, slotSize);
          ctx.lineWidth = done ? 3 : 2;
          ctx.strokeStyle = done ? '#ffe399' : '#85a3d1';
          ctx.strokeRect(sx, slotY, slotSize, slotSize);
          ctx.lineWidth = 1;
          if (done) {
            ctx.fillStyle = 'rgba(8,16,34,0.55)';
            ctx.fillRect(sx + 6, slotY + slotSize - 18, slotSize - 12, 14);
            ctx.fillStyle = '#ffe399';
            ctx.font = 'bold 11px system-ui,sans-serif';
            ctx.fillText('抜け', sx + slotSize / 2, slotY + slotSize - 11);
          }
        }

        ctx.fillStyle = '#b9cde8';
        ctx.font = '12px system-ui,sans-serif';
        ctx.fillText('タップ / Space でスキップ', W / 2, boxY + boxH - 18);
      } else if (phase === 'clear') {
        ctx.fillStyle = 'rgba(6,14,30,.9)';
        ctx.fillRect(40, 365, W - 80, 97);
        ctx.fillStyle = '#ffe399';
        ctx.font = 'bold 32px system-ui,sans-serif';
        ctx.fillText('クリア！', W / 2, 397);
        ctx.fillStyle = '#edf5ff';
        ctx.font = 'bold 16px system-ui,sans-serif';
        ctx.fillText(`+${CLEAR_POINTS}点`, W / 2, 435);
      }
      ctx.restore();
    }

    function frame(now) {
      frameId = 0;
      if (closed || (phase !== 'play' && phase !== 'clear' && phase !== 'roulette')) return;
      let elapsed = lastFrame === null ? 0 : Math.max(0, (now - lastFrame) / 1000);
      lastFrame = now;

      if (phase === 'roulette' && roulette) {
        clock += elapsed;
        roulette.elapsed += elapsed;
        for (let i = 0; i < roulette.targets.length; i++) {
          if (!roulette.stopped[i] && roulette.elapsed >= roulette.stopTimes[i]) {
            roulette.stopped[i] = true;
            sound('tap', 40);
          }
        }
        if (!roulette.applied && roulette.stopped.every(Boolean)) {
          applyRouletteRemoval();
        }
        const doneAt = roulette.stopTimes[roulette.stopTimes.length - 1] + roulette.finishWait;
        if (roulette.elapsed >= doneAt) {
          roulette = null;
          phase = 'play';
          serve(0.5);
        }
      }

      if (phase === 'clear') {
        clearLeft -= elapsed;
        if (clearLeft <= 0) {
          elapsed = -clearLeft;
          nextStage();
        }
      }
      if (phase === 'play') {
        accumulator = Math.min(0.1, accumulator + elapsed);
        while (accumulator >= STEP && phase === 'play') {
          accumulator -= STEP;
          simulate(STEP);
        }
        if (phase !== 'play') accumulator = 0;
      }
      updateEffects(Math.min(elapsed, 0.04));
      hud();
      draw();
      schedule();
    }

    function schedule() {
      if (!frameId && !closed && (phase === 'play' || phase === 'clear' || phase === 'roulette')) {
        frameId = window.requestAnimationFrame(frame);
      }
    }

    function stopFrame() {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrame = null;
      accumulator = 0;
    }

    function settle() {
      if (settlement) return settlement;
      const reward = Math.floor(score / 100);
      const oldBest = Math.max(best, saveData ? integer(saveData.minigameBounceHighScore) : 0);
      best = Math.max(oldBest, score);
      // 保存APIを呼び出す前に精算済みとし、再入やpagehideでの二重加算を防ぐ。
      settlement = { reward, record: score > oldBest, warning: '' };
      if (!saveData) {
        settlement.warning = '保存データに接続できないため、コインと記録は保存されません。';
        return settlement;
      }
      try {
        saveData.coins = integer(saveData.coins) + reward;
        saveData.minigameBounceHighScore = best;
        if (canPersist) persist();
        else settlement.warning = '保存機能がないため、再読み込み後は記録が残らない場合があります。';
      } catch (_) {
        settlement.warning = '保存処理に失敗しました。再読み込み後に記録が残ることは保証できません。';
      }
      try {
        if (typeof updateCoins === 'function') updateCoins();
      } catch (_) {
        if (!settlement.warning) settlement.warning = 'コイン表示を更新できませんでした。';
      }
      return settlement;
    }

    function thumbnail(entry, partial) {
      const fig = element('figure');
      const thumb = element('canvas');
      thumb.width = thumb.height = 72;
      thumb.setAttribute('aria-hidden', 'true');
      const g = thumb.getContext('2d');
      if (g) {
        const unit = Math.max(1, Math.floor(64 / Math.max(entry.cols, entry.rows)));
        const x = Math.floor((72 - entry.cols * unit) / 2);
        const y = Math.floor((72 - entry.rows * unit) / 2);
        for (const p of entry.pixels) {
          g.fillStyle = (!partial || (!p.broken && !p.skipped)) ? color(p.color) : '#1a2842';
          g.fillRect(x + (p.i % entry.cols) * unit,
            y + Math.floor(p.i / entry.cols) * unit, unit, unit);
        }
      }
      const pct = entry.total > 0 ? Math.floor(100 * entry.done / entry.total) : 0;
      fig.append(thumb, element('figcaption', '', partial ? `${entry.name}（途中 ${pct}%）` : entry.name));
      return fig;
    }

    function finish(title) {
      if (!started || phase === 'result' || closed) return;
      phase = 'result';
      stopFrame();
      clearControls();
      const result = settle();
      if (closed) return;

      const content = [
        element('div', 'bn-result', `${score.toLocaleString()} 点`),
        element('p', '', `${result.record ? 'ハイスコア更新！ ' : ''}ベスト：${best.toLocaleString()} 点`),
        element('p', '', `クリア：${completed.length}枚 ／ コイン報酬：+${result.reward}`)
      ];
      const gallery = element('div', 'bn-gallery');
      for (const entry of completed) gallery.appendChild(thumbnail(entry, false));
      if (stage && stage.left > 0 && stage.left < stage.total) {
        gallery.appendChild(thumbnail(snapshot(), true));
      }
      if (gallery.childElementCount) content.push(gallery);
      else content.push(element('p', '', '今回はギャラリーに表示する絵がありません。'));
      if (result.warning) content.push(element('p', '', result.warning));

      showCard(title, content, [button('もう一度', start, true), button('閉じる', destroy)]);
      announce(`${title} スコア${score}点。${result.warning || `コイン報酬${result.reward}。`}`);
      sound(result.record ? 'fanfare' : 'boom', 180);
      hud();
      draw();
    }

    function start() {
      if (closed || !ctx || (phase !== 'intro' && phase !== 'result')) return;
      sound('init', 0);
      stopFrame();
      clearControls();
      started = true; settlement = null;
      score = 0; clock = 0; stageNo = 0;
      wideUntil = 0; pierceUntil = 0; clearLeft = 0;
      stage = null; bag = []; invalid.clear(); completed = []; particles = [];
      roulette = null;
      paddle.x = paddle.target = W / 2; paddle.w = 84;
      nextStage();
      hideCard();
      lastFrame = performance.now();
      hud();
      draw();
      schedule();
    }

    function pause(reason) {
      if (phase !== 'play' && phase !== 'clear' && phase !== 'roulette') return;
      resumePhase = phase;
      phase = 'paused';
      stopFrame();
      clearControls();
      showCard('一時停止', [element('p', '', reason || '時間は止まっています。')], [
        button('つづける', resume, true), button('終了して精算', requestClose)
      ]);
      hud();
      draw();
    }

    function resume() {
      if (phase !== 'paused' && phase !== 'confirm') return;
      phase = resumePhase;
      hideCard();
      lastFrame = performance.now();
      hud();
      draw();
      schedule();
    }

    function requestClose() {
      if (closed) return;
      if (phase === 'intro' || phase === 'error' || phase === 'result') {
        destroy();
        return;
      }
      if (phase === 'play' || phase === 'clear' || phase === 'roulette') resumePhase = phase;
      phase = 'confirm';
      stopFrame();
      clearControls();
      showCard('プレイを終了しますか？', [
        element('p', '', '終了すると、その時点のスコアを精算して結果を表示します。')
      ], [
        button('つづける', resume, true),
        button('精算して結果へ', () => finish('プレイ終了'))
      ]);
      hud();
      draw();
    }

    function releaseDrag() {
      if (!drag) return;
      const id = drag.id;
      drag = null;
      try {
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      } catch (_) { /* 既に解除された場合 */ }
    }

    function clearControls() {
      keys.left = keys.right = false;
      releaseDrag();
    }

    function pointerDown(e) {
      if (phase === 'roulette' && (e.pointerType !== 'mouse' || e.button === 0)) {
        e.preventDefault();
        skipRoulette();
        return;
      }
      if (phase !== 'play' || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      drag = { id: e.pointerId, lastX: e.clientX, startX: e.clientX, moved: false };
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* 任意の拡張 */ }
      focus(root);
    }

    function pointerMove(e) {
      if (!drag || drag.id !== e.pointerId || phase !== 'play') return;
      const dx = (e.clientX - drag.lastX) / view.scale;
      drag.lastX = e.clientX;
      drag.moved ||= Math.abs(e.clientX - drag.startX) >= 7;
      paddle.target = clamp(paddle.target + dx * 1.2,
        LEFT + paddle.w / 2, RIGHT - paddle.w / 2);
      e.preventDefault();
    }

    function pointerEnd(e) {
      if (!drag || drag.id !== e.pointerId) return;
      const tap = e.type === 'pointerup' && !drag.moved &&
        Math.abs(e.clientX - drag.startX) < 7;
      releaseDrag();
      if (tap && phase === 'play') launch();
    }

    function keyDown(e) {
      if (e.key === 'Tab') {
        const buttons = [...root.querySelectorAll('button:not(:disabled)')]
          .filter(b => !b.closest('[hidden]') && b.getClientRects().length);
        const i = buttons.indexOf(document.activeElement);
        if (!buttons.length || i < 0 || (e.shiftKey && i === 0) ||
            (!e.shiftKey && i === buttons.length - 1)) {
          e.preventDefault();
          focus(buttons.length ? buttons[e.shiftKey ? buttons.length - 1 : 0] : root);
        }
        return;
      }
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        if (phase === 'play' || phase === 'clear' || phase === 'roulette') pause();
        else if (phase === 'paused' || phase === 'confirm') resume();
        else requestClose();
      } else if (phase === 'play' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        keys[e.key === 'ArrowLeft' ? 'left' : 'right'] = true;
        e.preventDefault();
        e.stopPropagation();
      } else if ((phase === 'play' || phase === 'roulette') && e.code === 'Space' &&
          !(e.target && e.target.closest && e.target.closest('button'))) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) {
          if (phase === 'roulette') skipRoulette();
          else launch();
        }
      }
    }

    function keyUp(e) {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
    }
    function blur() {
      clearControls();
      pause('画面を離れたため一時停止しました。');
    }
    function visibility() { if (document.hidden) blur(); }
    function pageHide() {
      if (started && !settlement) finish('プレイ終了');
    }

    function destroy() {
      if (closed) return;
      closed = true;
      stopFrame();
      clearControls();
      if (observer) observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', keyDown, true);
      window.removeEventListener('keyup', keyUp, true);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', pageHide);
      document.removeEventListener('visibilitychange', visibility);
      if (started && !settlement) settle();
      root.remove();
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = previousOverflow;
      active = null;
      if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') {
        try { previousFocus.focus({ preventScroll: true }); } catch (_) { /* 復元できなくても終了 */ }
      }
      if (typeof onClose === 'function') {
        try { onClose(); } catch (error) { console.error('バウンドぬりえ: 終了処理', error); }
      }
    }

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerEnd);
    canvas.addEventListener('pointercancel', pointerEnd);
    canvas.addEventListener('lostpointercapture', pointerEnd);
    for (const type of ['click', 'pointerdown', 'pointerup', 'pointermove']) {
      root.addEventListener(type, e => e.stopPropagation());
    }
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', keyDown, true);
    window.addEventListener('keyup', keyUp, true);
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', pageHide);
    document.addEventListener('visibilitychange', visibility);
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(resize);
      observer.observe(field);
    }

    if (!ctx) {
      phase = 'error';
      showCard('ゲームを開始できません', [
        element('p', '', 'この環境では Canvas 2D を利用できません。')
      ], [button('閉じる', destroy, true)]);
    } else {
      const rules = element('ul');
      [
        '最初から表示されたぬりえブロックにボールを当てて崩そう！',
        '開始時のルーレットで1〜3色が抜けて、毎回ちがう形になります。',
        `時間制限はありません。全ブロックを崩すと+${CLEAR_POINTS}点で次のお題へ！`,
        'ボールをすべて落とすとゲームオーバーです。',
        'バーの下で左右にドラッグ。PCは矢印キー、発射はタップまたはSpace。',
        'コイン報酬はスコア÷100の小数点以下切り捨てです。'
      ].forEach(text => rules.appendChild(element('li', '', text)));
      const chips = element('div', 'bn-chips');
      for (const def of ITEMS) {
        const chip = element('span', 'bn-chip', `${def.mark} ${def.name}`);
        chip.style.color = def.color;
        chips.appendChild(chip);
      }
      const content = [rules, chips];
      if (!saveData) content.push(element('p', '', '保存なしでプレイします。'));
      showCard('バウンドぬりえ', content, [button('スタート', start, true)]);
    }
    hud();
    resize();
  };

  const loaded = typeof AF_LOADED !== 'undefined'
    ? AF_LOADED : (window.AF_LOADED = []);
  if (Array.isArray(loaded) && !loaded.includes('minigame_bounce.js')) {
    loaded.push('minigame_bounce.js');
  }
})();
