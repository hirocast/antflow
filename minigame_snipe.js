// File: minigame_snipe.js
(function () {
  'use strict';

  const GAME_TIME = 60;
  const CLEAR_SCORE = 500;
  const CLEAR_TIME = 8;
  const MAX_ART = 26;
  const MAX_ANGLE = 1.28;
  const MAX_BOUNCES = 3;
  const RAINBOW = -1;
  const DEG = Math.PI / 180;
  const ITEM_DURATION = 12;
  const ITEM_DEFS = [
    { kind: 'rapid', icon: '⚡', label: '連射', title: '⚡ 連射スピードUP！', color: '#ffd94a' },
    { kind: 'wide', icon: '🟣', label: '太弾', title: '🟣 弾が太くなった！', color: '#c084fc' },
    { kind: 'shotgun', icon: '💥', label: '散弾', title: '💥 散弾銃モード！', color: '#fb7185' }
  ];

  const FALLBACK_HEX = [
    '#20232e', '#ffffff', '#ff575f', '#fd9c42', '#ffd75a',
    '#a8db55', '#50c779', '#36cfb7', '#54d9ed', '#55adf9',
    '#506cee', '#855ce9', '#bb6ce4', '#f36cbd', '#aeb5c6',
    '#697386', '#8f5133', '#bd7c50', '#f0b88a', '#ffcfda', '#d9e5ff'
  ];

  const RAINBOW_HEX = ['#ff626f', '#ffbf54', '#f6eb68', '#64df9d', '#5cbcff', '#b88aff'];

  let activeClose = null;
  let openSequence = 0;

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const format = n => n.toLocaleString('ja-JP');

  function safeCall(fn, receiver, args) {
    try {
      const result = fn.apply(receiver, args || []);
      if (result && typeof result.then === 'function') {
        Promise.resolve(result).catch(() => {});
      }
    } catch (_) {
      // オプションのホスト機能に失敗しても、ゲームの進行は止めない。
    }
  }

  function sfx(name) {
    try {
      if (typeof Sound !== 'undefined' && Sound && typeof Sound[name] === 'function') {
        safeCall(Sound[name], Sound);
      }
    } catch (_) {}
  }

  function saveObject() {
    try {
      return typeof save !== 'undefined' && save && typeof save === 'object' ? save : null;
    } catch (_) {
      return null;
    }
  }

  function nonnegativeInteger(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }

  function readBest() {
    try {
      const data = saveObject();
      return data ? nonnegativeInteger(data.minigameSnipeHighScore) : 0;
    } catch (_) {
      return 0;
    }
  }

  function readPalette() {
    const probe = document.createElement('span').style;
    const source = typeof HEX !== 'undefined' && HEX ? HEX : [];
    return FALLBACK_HEX.map((fallback, i) => {
      const value = String(source[i] || '').trim();
      probe.color = '';
      probe.color = /^[0-9a-f]{3,8}$/i.test(value) ? '#' + value : value;
      return probe.color || fallback;
    });
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function validColor(n) {
    return Number.isInteger(n) && n >= 0 && n < 21;
  }

  // 透明な外周を除き、面積加重の最多色で縮小する。補間色は作らない。
  function sampleArt(raw, id, name) {
    if (!raw) return null;
    const { W, H, grid } = raw;
    if (!Number.isInteger(W) || !Number.isInteger(H) ||
        W < 1 || H < 1 || !grid || grid.length < W * H) return null;

    let left = W, right = -1, top = H, bottom = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!validColor(grid[y * W + x])) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left) return null;

    const srcW = right - left + 1;
    const srcH = bottom - top + 1;
    const scale = Math.min(1, MAX_ART / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    const cells = new Int8Array(w * h);
    const counts = new Int32Array(21);
    const votes = new Float64Array(21);
    let total = 0;

    cells.fill(-1);
    for (let y = 0; y < h; y++) {
      const y0 = y * srcH / h, y1 = (y + 1) * srcH / h;
      for (let x = 0; x < w; x++) {
        const x0 = x * srcW / w, x1 = (x + 1) * srcW / w;
        votes.fill(0);
        let coverage = 0;
        for (let sy = Math.floor(y0); sy < Math.min(srcH, Math.ceil(y1)); sy++) {
          const dy = Math.min(y1, sy + 1) - Math.max(y0, sy);
          for (let sx = Math.floor(x0); sx < Math.min(srcW, Math.ceil(x1)); sx++) {
            const color = grid[(top + sy) * W + left + sx];
            if (!validColor(color)) continue;
            const area = dy * (Math.min(x1, sx + 1) - Math.max(x0, sx));
            votes[color] += area;
            coverage += area;
          }
        }
        if (coverage < (x1 - x0) * (y1 - y0) * 0.18) continue;
        let color = 0;
        for (let c = 1; c < votes.length; c++) {
          if (votes[c] > votes[color]) color = c;
        }
        cells[y * w + x] = color;
        counts[color]++;
        total++;
      }
    }
    if (!total) return null;

    const neighbors = Array.from(cells, (_, i) => {
      const x = i % w, y = Math.floor(i / w);
      const list = [];
      if (x > 0) list.push(i - 1);
      if (x + 1 < w) list.push(i + 1);
      if (y > 0) list.push(i - w);
      if (y + 1 < h) list.push(i + w);
      return list;
    });

    return {
      id, name: String(raw.name || name || ('お題 ' + id)),
      w, h, cells, counts, total, neighbors
    };
  }

  const DEMOS = [
    ['練習用：ハート', [
      '.00.00.', '0000000', '0000000', '.00100.', '..010..', '...0...'
    ], [2, 13]],
    ['練習用：星', [
      '...0...', '...0...', '0000000', '.00100.', '..101..', '..0.0..'
    ], [4, 3]],
    ['練習用：きのこ', [
      '..000..', '.01010.', '0000000', '..222..', '..212..'
    ], [9, 1, 19]]
  ];

  function demoArt(index) {
    const i = index % DEMOS.length;
    const [name, rows, colors] = DEMOS[i];
    const grid = rows.join('').split('').map(c => c === '.' ? -1 : colors[Number(c)]);
    return sampleArt({ W: rows[0].length, H: rows.length, grid, name }, -(i + 1));
  }

  const CSS = `
    .afisn-root,.afisn-root *{box-sizing:border-box}
    .afisn-root{
      position:fixed;inset:0;z-index:2147483000;isolation:isolate;overflow:hidden;
      background:#0b1224;color:#f4f7ff;font:14px/1.45 system-ui,sans-serif;
      overscroll-behavior:contain;-webkit-tap-highlight-color:transparent
    }
    .afisn-root [hidden]{display:none!important}
    .afisn-field{position:relative;height:100%;width:min(100%,700px);margin:auto;overflow:hidden;background:#101a31}
    .afisn-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
    .afisn-canvas:focus-visible{outline:2px solid #93f5df;outline-offset:-3px}
    .afisn-hud,.afisn-controls{position:absolute;left:0;right:0;pointer-events:none}
    .afisn-hud{
      top:0;padding:calc(7px + env(safe-area-inset-top,0px)) 10px 8px;
      background:linear-gradient(#0b1224f5,#0b1224a0,transparent)
    }
    .afisn-line{display:flex;align-items:center;gap:7px}
    .afisn-heading{flex:1;min-width:0;font-weight:900;font-size:15px}
    .afisn-best{font-size:10px;color:#b9c7e4;font-weight:600}
    .afisn-root button{
      min-height:40px;min-width:40px;padding:7px 11px;border:1px solid #4d6189;
      border-radius:10px;background:#223454;color:#fff;font:inherit;font-weight:800;
      cursor:pointer;pointer-events:auto;touch-action:manipulation
    }
    .afisn-root button:focus-visible{outline:3px solid #9bf8df;outline-offset:2px}
    .afisn-root button:disabled{opacity:.45;cursor:default}
    .afisn-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:4px}
    .afisn-stat{
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;
      border-radius:8px;background:#1e2d49c9;padding:3px 5px;
      font-size:13px;font-weight:800;font-variant-numeric:tabular-nums
    }
    .afisn-stat.afisn-low{color:#ff9da9}
    .afisn-progress-line{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:11px}
    .afisn-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .afisn-progress{width:24%;height:6px;accent-color:#73e8c4}
    .afisn-controls{
      bottom:0;padding:4px 10px calc(6px + env(safe-area-inset-bottom,0px));
      display:flex;justify-content:center;align-items:center;gap:9px;flex-wrap:wrap
    }
    .afisn-buffs{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;width:100%}
    .afisn-buff{
      display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;
      background:#1d2e4dcc;border:1.5px solid #ffd94a;color:#fff;font-size:11px;font-weight:800;
      font-variant-numeric:tabular-nums
    }
    .afisn-hint{color:#c4d2ee;font-size:10px;text-align:center}
    .afisn-layer{
      position:absolute;inset:0;z-index:2;display:flex;overflow:auto;
      overscroll-behavior:contain;touch-action:pan-y;background:#060c1cdb;
      padding:max(12px,env(safe-area-inset-top,0px)) 12px max(12px,env(safe-area-inset-bottom,0px))
    }
    .afisn-card{
      width:100%;max-width:420px;margin:auto;flex:0 0 auto;background:#192743;
      border:1px solid #4d638d;border-radius:17px;padding:17px;box-shadow:0 12px 34px #0008
    }
    .afisn-title{margin:0 0 8px;font-size:22px;text-align:center;color:#b4ffe7}
    .afisn-org{
      display:inline-block;padding:2px 8px;border-radius:999px;margin-left:6px;vertical-align:middle;
      background:#223a63;border:1px solid #ffd23f;color:#ffe68a;font-size:10px;font-weight:800
    }
    .afisn-story{
      margin:0 0 10px;padding:9px 11px;border-radius:12px;
      background:#111c33;border:1px solid #3c5480;color:#e5eeff;font-size:12px;line-height:1.55
    }
    .afisn-story b{color:#ffd23f}
    .afisn-coach-rank{
      margin:8px 0 10px;padding:8px 10px;border-radius:10px;text-align:center;
      background:#111c33;border:1px solid #73e8c4;color:#b4ffe7;font-size:13px;font-weight:800
    }
    .afisn-rules{padding-left:20px;margin:10px 0 15px;font-size:13px}
    .afisn-rules li{margin:5px 0}
    .afisn-text{margin:8px 0;color:#d2def5;text-align:center}
    .afisn-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .afisn-actions button{flex:1}
    .afisn-root .afisn-primary{background:#a2f3d4;color:#12323c;border-color:#a2f3d4}
    .afisn-result-score{text-align:center;font-size:36px;font-weight:950}
    .afisn-reward{color:#ffe38e;font-weight:850}
    .afisn-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px}
    .afisn-thumb{margin:0;padding:6px;min-width:0;text-align:center;border-radius:8px;background:#111c32}
    .afisn-thumb canvas{display:block;margin:auto;width:60px;height:60px;image-rendering:pixelated}
    .afisn-thumb figcaption{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}
    .afisn-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    @media(max-height:390px){
      .afisn-hint{display:none}
      .afisn-best{display:none}
      .afisn-root button{min-height:36px}
      .afisn-card{padding:12px}
    }
  `;

  window.openMiniSnipe = function (onClose) {
    const sequence = ++openSequence;
    if (activeClose) activeClose();
    if (sequence !== openSequence) return activeClose;

    const previousFocus = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    const reducedMotion = Boolean(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const style = document.createElement('style');
    style.textContent = CSS;
    const root = document.createElement('div');
    root.className = 'afisn-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'ピクセルスナイプ');
    root.innerHTML = `
      <div class="afisn-field">
        <canvas class="afisn-canvas" tabindex="0"
          aria-label="ゲーム盤。左右キーで照準、スペースで発射、Sキーで色交換。"></canvas>
        <div class="afisn-hud">
          <div class="afisn-line">
            <div class="afisn-heading">ピクセルスナイプ<span class="afisn-org">🛡️ 色彩防衛隊</span><div class="afisn-best"></div></div>
            <button type="button" class="afisn-pause" aria-label="一時停止">Ⅱ</button>
            <button type="button" class="afisn-exit" aria-label="終了して結果を見る">×</button>
          </div>
          <div class="afisn-stats">
            <span class="afisn-stat afisn-score"></span>
            <span class="afisn-stat afisn-time"></span>
            <span class="afisn-stat afisn-combo"></span>
          </div>
          <div class="afisn-progress-line">
            <span class="afisn-name"></span>
            <progress class="afisn-progress" max="100" value="0" aria-label="絵の完成度"></progress>
            <span class="afisn-percent"></span>
          </div>
        </div>
        <div class="afisn-controls">
          <div class="afisn-buffs" aria-live="off"></div>
          <span class="afisn-hint">長押しで連射／左右ドラッグで照準／タップでも発射</span>
          <button type="button" class="afisn-swap">⇄ 色交換</button>
        </div>
      </div>
      <div class="afisn-sr" role="status" aria-live="polite"></div>
      <section class="afisn-layer afisn-intro">
        <div class="afisn-card">
          <h2 class="afisn-title">🐜 あり王国 色彩防衛隊</h2>
          <p class="afisn-story">
            あり王国の大切な「思い出アート」から色がぬけ落ちてしまった！<br>
            女王アリさまの命を受けた精鋭部隊<b>〈アント・スナイパーズ〉</b>に出動命令！<br>
            <b>あり教官</b>のナビゲートのもと、色弾を撃ち込んで王国の色彩を取り戻そう！
          </p>
          <ul class="afisn-rules">
            <li>60秒で何枚完成できるか挑戦。長押しで連射でき、左右にドラッグしながら狙いを動かせます。タップだけでも発射！</li>
            <li>同じ色なら上下左右につながる塊を一気にペイント。違う色でも、命中点と隣の数マスが塗れます。</li>
            <li>浮かぶアイテム（⚡連射・🟣太弾・💥散弾）を撃ち抜くとパワーアップ！レインボー玉は隣接する最大2塊も同時に塗れます。</li>
            <li>1枚完成で＋500点・＋8秒。100点につき1コイン。</li>
          </ul>
          <p class="afisn-text afisn-notice" hidden></p>
          <div class="afisn-actions">
            <button type="button" class="afisn-primary afisn-start">出動する！</button>
            <button type="button" class="afisn-close">閉じる</button>
          </div>
        </div>
      </section>
      <section class="afisn-layer afisn-pause-panel" hidden>
        <div class="afisn-card">
          <h2 class="afisn-title">一時停止</h2>
          <p class="afisn-text">残り時間は止まっています。</p>
          <div class="afisn-actions">
            <button type="button" class="afisn-primary afisn-resume">つづける</button>
            <button type="button" class="afisn-end">終了して結果を見る</button>
          </div>
        </div>
      </section>
      <section class="afisn-layer afisn-results" hidden>
        <div class="afisn-card">
          <h2 class="afisn-title afisn-result-title"></h2>
          <div class="afisn-result-score"></div>
          <p class="afisn-text afisn-reward"></p>
          <p class="afisn-text afisn-summary"></p>
          <div class="afisn-coach-rank"></div>
          <p class="afisn-text afisn-save-status" role="status" hidden></p>
          <h3>完成ギャラリー</h3>
          <div class="afisn-gallery"></div>
          <div class="afisn-actions">
            <button type="button" class="afisn-primary afisn-retry">もう一度</button>
            <button type="button" class="afisn-close">閉じる</button>
          </div>
        </div>
      </section>
      <section class="afisn-layer afisn-fatal" hidden>
        <div class="afisn-card">
          <h2 class="afisn-title">ゲームを開けません</h2>
          <p class="afisn-text">この環境ではキャンバスを利用できません。</p>
          <div class="afisn-actions"><button type="button" class="afisn-close">閉じる</button></div>
        </div>
      </section>
    `;

    const $ = name => root.querySelector('.afisn-' + name);
    const field = $('field');
    const canvas = $('canvas');
    const ctx = canvas.getContext('2d');
    const palette = readPalette();
    const removers = [];
    const invalidIds = new Set();
    const artCache = new Map();
    const hudValues = Object.create(null);

    let closed = false, phase = 'intro', paused = false;
    let raf = null, observer = null, lastFrame = 0;
    let width = 1, height = 1, dpr = 1;
    let layout = { x: 0.5, y: 1, top: 0, artH: 1, left: 0, right: 1, speed: 620 };
    let motion = 0, effectsTime = 0, transition = 0, cooldown = 0;
    let time = GAME_TIME, score = 0, combo = 0, maxCombo = 0;
    let comboTime = 0, shots = 0, completed = 0;
    let angle = 0, pointer = null, art = null, bag = [], lastArtId = null;
    let current = null, next = null, rollsSinceRainbow = 0;
    let bullets = [], particles = [], floats = [], items = [];
    let itemTimer = 3.5, buffs = { rapid: 0, wide: 0, shotgun: 0 }, keyFireHeld = false;
    let coach = { text: '準備はいいか！', mood: 'normal', timer: 3, priority: 0, idleTimer: 5, lowWarned: false, fewWarned: false };
    let gallery = new Map();
    let run = null, statusMessage = '', lastAmmoLabel = '', lastBuffHtml = '';

    const COACH_TIPS = [
      '同色の塊を狙うと高得点だ！',
      '長押し＋ドラッグで掃射できるぞ！',
      '女王アリさまも見守っているぞ！',
      '壁の反射も使って狙い撃て！',
      '〈アント・スナイパーズ〉出動中！'
    ];

    function setCoach(text, mood = 'normal', dur = 2.6, priority = 1) {
      if (coach.timer > 0 && coach.priority > priority) return;
      coach.text = text;
      coach.mood = mood;
      coach.timer = dur;
      coach.priority = priority;
      coach.idleTimer = 5.5;
    }

    activeClose = close;
    document.head.appendChild(style);
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';

    function listen(target, type, fn, options) {
      target.addEventListener(type, fn, options);
      removers.push(() => target.removeEventListener(type, fn, options));
    }

    function focus(el) {
      if (!el || !el.isConnected) return;
      try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
    }

    function announce(text) {
      $('sr').textContent = text;
    }

    function hudText(name, value) {
      if (hudValues[name] === value) return;
      hudValues[name] = value;
      $(name).textContent = value;
    }

    function updateHud() {
      hudText('score', format(score) + ' 点');
      hudText('time', Math.max(0, Math.ceil(time)) + ' 秒');
      hudText('combo', combo > 0 ? combo + ' コンボ' : '— コンボ');
      hudText('best', 'ハイスコア ' + format(readBest()));
      $('time').classList.toggle('afisn-low', time <= 10);
      const pct = art ? Math.floor((art.total - art.left) * 100 / art.total) : 0;
      if ($('progress').value !== pct) $('progress').value = pct;
      hudText('percent', pct + '%');
      hudText('name', art ? 'お題 ' + art.number + '：' + art.name : 'お題を準備中');
      $('pause').disabled = (phase !== 'play' && phase !== 'clear') || paused;
      $('swap').disabled = phase !== 'play' || paused;

      const buffHtml = ITEM_DEFS.filter(d => buffs[d.kind] > 0)
        .map(d => `<span class="afisn-buff" style="border-color:${d.color}">${d.icon} ${d.label} ${Math.ceil(buffs[d.kind])}s</span>`)
        .join('');
      if (buffHtml !== lastBuffHtml) {
        lastBuffHtml = buffHtml;
        $('buffs').innerHTML = buffHtml;
      }

      const ammoName = color => color === RAINBOW ? 'レインボー' :
        color === null ? 'なし' : '色番号 ' + (color + 1);
      const label = '色交換。今：' + ammoName(current) + '、次：' + ammoName(next);
      if (label !== lastAmmoLabel) {
        lastAmmoLabel = label;
        $('swap').setAttribute('aria-label', label);
      }
    }

    function setPanel(name, target) {
      for (const panel of ['intro', 'pause-panel', 'results', 'fatal']) {
        $(panel).hidden = panel !== name;
      }
      field.inert = Boolean(name);
      canvas.tabIndex = name ? -1 : 0;
      $('exit').tabIndex = name ? -1 : 0;
      $('pause').tabIndex = name ? -1 : 0;
      $('swap').tabIndex = name ? -1 : 0;
      if (name) $(name).scrollTop = 0;
      if (target) focus($(target));
    }

    function takeArt() {
      const list = typeof ARTS !== 'undefined' && ARTS ? ARTS : [];
      const count = Number.isInteger(list.length) ? list.length : 0;

      if (typeof getArt === 'function') {
        while (true) {
          if (!bag.length) {
            for (let id = 1; id <= count; id++) {
              if (!invalidIds.has(id)) bag.push(id);
            }
            if (!bag.length) break;
            shuffle(bag);
            const last = bag.length - 1;
            if (last > 0 && bag[last] === lastArtId) {
              [bag[0], bag[last]] = [bag[last], bag[0]];
            }
          }
          const id = bag.pop();
          try {
            if (!artCache.has(id)) {
              const entry = list[id - 1];
              const prepared = sampleArt(getArt(id), id, entry && entry.n);
              if (!prepared) throw new Error('Invalid art');
              artCache.set(id, prepared);
              if (artCache.size > 40) artCache.delete(artCache.keys().next().value);
            }
            lastArtId = id;
            return artCache.get(id);
          } catch (_) {
            invalidIds.add(id);
          }
        }
      }

      return demoArt(completed);
    }

    function makeArtLayer(w, h) {
      const layer = document.createElement('canvas');
      layer.width = w * 12;
      layer.height = h * 12;
      const context = layer.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      return { layer, context };
    }

    function loadArt() {
      const prepared = takeArt();
      const ghost = makeArtLayer(prepared.w, prepared.h);
      const solid = makeArtLayer(prepared.w, prepared.h);
      art = {
        ...prepared,
        number: completed + 1,
        counts: new Int32Array(prepared.counts),
        painted: new Uint8Array(prepared.cells.length),
        left: prepared.total,
        ghost: ghost.layer,
        solid: solid.layer,
        paintContext: solid.context,
        pending: [],
        pendingHead: 0
      };

      const g = ghost.context;
      for (let i = 0; i < art.cells.length; i++) {
        const color = art.cells[i];
        if (color < 0) continue;
        const x = (i % art.w) * 12, y = Math.floor(i / art.w) * 12;
        g.globalAlpha = 0.62;
        g.fillStyle = '#dbe7ff';
        g.fillRect(x + 1, y + 1, 10, 10);
        g.globalAlpha = 0.85;
        g.strokeStyle = '#ffffff';
        g.lineWidth = 1;
        g.strokeRect(x + 1.5, y + 1.5, 9, 9);
        g.globalAlpha = 1;
        g.fillStyle = palette[color];
        g.fillRect(x + 3, y + 3, 6, 6);
      }
      bullets = [];
      motion = Math.random() * Math.PI * 2;
      current = rollColor(null, false);
      next = rollColor(current, true);
      coach.fewWarned = false;
      setCoach(art.number === 1 ? `任務開始！${art.name}を塗れ！` : `次の任務だ！${art.name}！`, 'nav', 2.8, 2);
      updateHud();
    }

    function rollColor(excluded, allowRainbow) {
      if (!art || !art.left) return null;
      if (allowRainbow) {
        rollsSinceRainbow++;
        if (rollsSinceRainbow >= 8 ||
            (rollsSinceRainbow >= 4 && Math.random() < 0.20)) {
          rollsSinceRainbow = 0;
          return RAINBOW;
        }
      }

      const candidates = [];
      for (let c = 0; c < art.counts.length; c++) {
        if (art.counts[c] > 0) candidates.push(c);
      }
      const pool = candidates.length > 1 ? candidates.filter(c => c !== excluded) : candidates;
      const weights = pool.map(c => 1 + Math.sqrt(art.counts[c]));
      let target = Math.random() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pool.length; i++) {
        target -= weights[i];
        if (target <= 0) return pool[i];
      }
      return pool.length ? pool[pool.length - 1] : null;
    }

    function validAmmo(color) {
      return color === RAINBOW || (color !== null && art.counts[color] > 0);
    }

    function repairAmmo() {
      if (!art || !art.left) return;
      if (!validAmmo(current)) current = rollColor(next, false);
      if (!validAmmo(next)) next = rollColor(current, true);
    }

    function swap() {
      if (phase !== 'play' || paused) return;
      repairAmmo();
      [current, next] = [next, current];
      updateHud();
      sfx('tap');
      focus(canvas);
    }

    function resize() {
      if (!ctx || closed) return;
      const rect = canvas.getBoundingClientRect();
      const newW = Math.max(1, rect.width);
      const newH = Math.max(1, rect.height);
      if (width !== newW || height !== newH) {
        bullets = [];
        particles = [];
        floats = [];
        cancelPointer();
      }
      width = newW;
      height = newH;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(width * dpr));
      const h = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      const wall = Math.min(9, width * 0.04);
      const bottom = $('controls').offsetHeight;
      const hudBottom = $('hud').offsetHeight;
      const coachH = Math.min(40, Math.max(32, height * 0.055));
      const y = Math.max(height * 0.55, height - bottom - 32);
      const top = Math.min(hudBottom + coachH + 4, height * 0.42);
      layout = {
        x: width / 2, y, top,
        coachY: hudBottom + coachH * 0.52,
        artH: Math.max(8, Math.min(height * 0.40, y - top - 40)),
        left: wall, right: width - wall, speed: Math.max(620, height * 1.65)
      };
      render();
    }

    function artPosition(t) {
      const boxW = width * 0.76;
      const cell = Math.max(0.01, Math.min(boxW / art.w, layout.artH / art.h));
      const w = art.w * cell;
      const h = art.h * cell;
      const amp = Math.max(0, Math.min(width * 0.14, (width - w) / 2 - 12));
      const speed = 0.92 + Math.min(completed, 9) * 0.09;
      const motionScale = reducedMotion ? 0.26 : 1;
      return {
        x: (width - w) / 2 + Math.sin(t * speed) * amp * motionScale,
        y: layout.top + (layout.artH - h) / 2 + Math.sin(t * 1.7) * 4 * motionScale,
        cell, w, h
      };
    }

    function trace(x0, y0, x1, y1, from, to) {
      const sx = (x0 - from.x) / from.cell;
      const sy = (y0 - from.y) / from.cell;
      const ex = (x1 - to.x) / to.cell;
      const ey = (y1 - to.y) / to.cell;
      const minX = Math.max(0, Math.ceil(Math.min(sx, ex)) - 1);
      const maxX = Math.min(art.w - 1, Math.floor(Math.max(sx, ex)));
      const minY = Math.max(0, Math.ceil(Math.min(sy, ey)) - 1);
      const maxY = Math.min(art.h - 1, Math.floor(Math.max(sy, ey)));
      const dx = ex - sx, dy = ey - sy;
      let best = Infinity, index = -1;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const i = y * art.w + x;
          if (art.cells[i] < 0 || art.painted[i]) continue;
          let near = 0, far = 1;
          if (Math.abs(dx) < 1e-9) {
            if (sx < x || sx > x + 1) continue;
          } else {
            const a = (x - sx) / dx, b = (x + 1 - sx) / dx;
            near = Math.max(near, Math.min(a, b));
            far = Math.min(far, Math.max(a, b));
          }
          if (Math.abs(dy) < 1e-9) {
            if (sy < y || sy > y + 1) continue;
          } else {
            const a = (y - sy) / dy, b = (y + 1 - sy) / dy;
            near = Math.max(near, Math.min(a, b));
            far = Math.min(far, Math.max(a, b));
          }
          if (near <= far && near < best) {
            best = near;
            index = i;
          }
        }
      }
      return index < 0 ? null : {
        index, x: x0 + (x1 - x0) * best, y: y0 + (y1 - y0) * best
      };
    }

    function newProjectile(color, offsetAngle = 0) {
      const a = angle + offsetAngle;
      const dx = Math.sin(a), dy = -Math.cos(a);
      const muzzle = Math.min(29, Math.max(9, width * 0.095));
      const wide = buffs.wide > 0;
      return {
        x: clamp(layout.x + dx * muzzle, layout.left, layout.right),
        y: layout.y + dy * muzzle,
        vx: dx * layout.speed, vy: dy * layout.speed,
        color, bounces: 0, life: 0,
        wide, radius: wide ? 13 : 6.5
      };
    }

    function advance(ball, dt, t0, turns) {
      let elapsed = 0;
      while (dt - elapsed > 1e-8) {
        const remaining = dt - elapsed;
        const wall = ball.vx < 0 ? layout.left : layout.right;
        const wallTime = Math.abs(ball.vx) < 1e-9 ? Infinity :
          Math.max(0, (wall - ball.x) / ball.vx);
        const topTime = Math.max(0, (-12 - ball.y) / ball.vy);
        const step = Math.min(remaining, wallTime, topTime);
        const x = ball.x + ball.vx * step;
        const y = ball.y + ball.vy * step;
        if (step > 0) {
          const hit = trace(
            ball.x, ball.y, x, y,
            artPosition(t0 + elapsed), artPosition(t0 + elapsed + step)
          );
          if (hit) return { hit };
        }
        ball.x = x;
        ball.y = y;
        elapsed += step;
        if (topTime <= step) return { miss: true };
        if (wallTime <= step) {
          ball.x = wall;
          if (turns) turns.push([ball.x, ball.y]);
          if (ball.bounces >= MAX_BOUNCES) return { miss: true };
          ball.bounces++;
          ball.vx = -ball.vx;
        }
      }
      ball.life += dt;
      return ball.life >= 4 ? { miss: true } : null;
    }

    function preview() {
      const ball = newProjectile(current);
      const points = [[ball.x, ball.y]];
      let result = null;
      const dt = 1 / 30;
      for (let i = 0; i < 120 && !result; i++) {
        result = advance(ball, dt, motion + i * dt, points);
      }
      const hit = result && result.hit;
      points.push(hit ? [hit.x, hit.y] : [ball.x, ball.y]);
      return { points, hit };
    }

    function flood(start, seen) {
      const color = art.cells[start];
      const queue = [start];
      seen[start] = 1;
      for (let head = 0; head < queue.length; head++) {
        for (const i of art.neighbors[queue[head]]) {
          if (!seen[i] && !art.painted[i] && art.cells[i] === color) {
            seen[i] = 1;
            queue.push(i);
          }
        }
      }
      return queue;
    }

    function rainbowFill(main, seen) {
      const adjacent = [];
      for (const i of main) {
        for (const j of art.neighbors[i]) {
          if (!seen[j] && !art.painted[j] && art.cells[j] >= 0) {
            adjacent.push(flood(j, seen));
          }
        }
      }
      adjacent.sort((a, b) => b.length - a.length);
      return main.concat(...adjacent.slice(0, 2));
    }

    function paintCell(i) {
      const x = (i % art.w) * 12, y = Math.floor(i / art.w) * 12;
      const p = art.paintContext;
      p.fillStyle = palette[art.cells[i]];
      p.fillRect(x, y, 12, 12);
      p.fillStyle = 'rgba(255,255,255,.23)';
      p.fillRect(x, y, 12, 1);
    }

    function flushPaint() {
      while (art.pendingHead < art.pending.length &&
             art.pending[art.pendingHead].at <= effectsTime) {
        paintCell(art.pending[art.pendingHead++].index);
      }
      if (art.pendingHead === art.pending.length) {
        art.pending = [];
        art.pendingHead = 0;
      }
    }

    function paintList(indices, start) {
      const x0 = start % art.w, y0 = Math.floor(start / art.w);
      if (art.pendingHead) {
        art.pending = art.pending.slice(art.pendingHead);
        art.pendingHead = 0;
      }
      for (const index of indices) {
        art.painted[index] = 1;
        art.left--;
        art.counts[art.cells[index]]--;
        const distance = Math.hypot(index % art.w - x0, Math.floor(index / art.w) - y0);
        art.pending.push({
          index, at: effectsTime + (reducedMotion ? 0 : Math.min(0.42, distance * 0.028))
        });
      }
      art.pending.sort((a, b) => a.at - b.at);
      flushPaint();
    }

    function burst(x, y, color, n, speed) {
      if (reducedMotion) n = Math.ceil(n * 0.22);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.25 + Math.random() * 0.75);
        const life = 0.4 + Math.random() * 0.5;
        particles.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 35,
          life, max: life, color, size: 2 + Math.random() * 4
        });
      }
      if (particles.length > 220) particles.splice(0, particles.length - 220);
    }

    function floatText(text, x, y, color, size, life = 0.55) {
      const fx = clamp(x, 32, Math.max(32, width - 32));
      const near = floats.find(f => !f.important && Math.hypot(f.x - fx, f.y - y) < 42);
      if (near && life <= 0.65) {
        near.text = text;
        near.x = fx;
        near.y = y;
        near.color = color;
        near.size = size;
        near.life = life;
        return;
      }
      floats.push({ text, x: fx, y, color, size, life, important: life > 0.65 });
      if (floats.length > 5) floats.shift();
    }

    function wideSplash(list, center, seen) {
      const cx = center % art.w, cy = Math.floor(center / art.w);
      const extra = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= art.w || ny >= art.h) continue;
          const j = ny * art.w + nx;
          if (!seen[j] && !art.painted[j] && art.cells[j] >= 0) {
            seen[j] = 1;
            extra.push(j);
          }
        }
      }
      return list.concat(extra);
    }

    function spawnItem() {
      if (items.length >= 2 || phase !== 'play') return;
      const def = ITEM_DEFS[Math.floor(Math.random() * ITEM_DEFS.length)];
      const span = Math.max(40, layout.right - layout.left - 56);
      const x = layout.left + 28 + Math.random() * span;
      const yMin = layout.top + 38;
      const yMax = Math.max(yMin + 24, layout.y - 105);
      const y = yMin + Math.random() * (yMax - yMin);
      items.push({
        def, x, baseY: y, y,
        vx: (Math.random() < 0.5 ? -1 : 1) * (26 + Math.random() * 22),
        r: 18, life: 9.5, phase: Math.random() * Math.PI * 2
      });
      setCoach(`${def.icon}${def.label}アイテム出現！撃て！`, 'alert', 2.4, 2);
    }

    function collectItem(item) {
      const d = item.def;
      buffs[d.kind] = ITEM_DURATION;
      floatText(d.title, item.x, item.y - 14, d.color, 16, 0.85);
      burst(item.x, item.y, d.color, 18, 175);
      sfx('albumIn');
      announce(d.title);
      const msg = d.kind === 'rapid' ? '⚡高速連射だ！逃すな！' :
        d.kind === 'wide' ? '🟣太弾装填！まとめて塗れ！' : '💥散弾モード！広範囲を狙え！';
      setCoach(msg, 'cheer', 2.8, 3);
      updateHud();
    }

    function handleHit(ball, hit) {
      const i = hit.index;
      const color = art.cells[i];
      const rainbow = ball.color === RAINBOW;
      const matching = rainbow || ball.color === color;
      let indices, points;

      if (matching) {
        const seen = new Uint8Array(art.cells.length);
        const main = flood(i, seen);
        indices = rainbow ? rainbowFill(main, seen) : main;
        if (ball.wide) indices = wideSplash(indices, i, seen);
        combo = comboTime > 0 ? combo + 1 : 1;
        comboTime = 4;
        maxCombo = Math.max(maxCombo, combo);
        const multiplier = 1 + Math.min(combo - 1, 12) * 0.15;
        points = Math.round(indices.length * (rainbow ? 17 : 12) * multiplier);
        floatText((rainbow ? 'RAINBOW! ' : '') + '+' + format(points),
          hit.x, hit.y - 10, rainbow ? '#ffe187' : '#a3ffe2',
          indices.length >= 8 ? 18 : 13, rainbow || indices.length >= 8 ? 0.78 : 0.52);
        sfx(rainbow ? 'boom' : indices.length >= 8 ? 'starPing' : 'pop');
        if (combo === 3) setCoach('いいぞ！3コンボ突破！', 'cheer', 2.2, 2);
        else if (combo >= 10 && combo % 5 === 0) setCoach(`神業${combo}コンボ！完璧だ！`, 'cheer', 2.5, 3);
        if (combo % 6 === 0 && next !== RAINBOW) {
          next = RAINBOW;
          rollsSinceRainbow = 0;
          floatText('次はレインボー！', layout.x, layout.y - 51, '#ffe187', 14, 0.85);
          setCoach('🌈次はレインボー弾だぞ！', 'cheer', 2.6, 3);
        }
      } else {
        const seen = new Uint8Array(art.cells.length);
        seen[i] = 1;
        indices = [i, ...art.neighbors[i].filter(j => {
          if (art.cells[j] >= 0 && !art.painted[j]) { seen[j] = 1; return true; }
          return false;
        })];
        if (ball.wide) indices = wideSplash(indices, i, seen);
        combo = 0;
        comboTime = 0;
        points = indices.length * 3;
        floatText('+' + points, hit.x, hit.y - 10, '#ffd0a5', 11.5, 0.44);
        sfx('deny');
      }

      paintList(indices, i);
      score += points;
      burst(hit.x, hit.y, rainbow ? '#e6b9ff' : palette[color],
        Math.min(30, 5 + indices.length), matching ? 145 : 90);

      if (art.left === 0) complete();
      else {
        repairAmmo();
        if (!coach.fewWarned && art.left <= Math.max(6, Math.floor(art.total * 0.08))) {
          coach.fewWarned = true;
          setCoach(`残り${art.left}マス！点滅リングを狙え！`, 'nav', 3.2, 3);
        }
      }
      updateHud();
    }

    function complete() {
      phase = 'clear';
      transition = 1.15;
      score += CLEAR_SCORE;
      time += CLEAR_TIME;
      completed++;
      bullets = [];
      cancelPointer();
      current = next = null;
      const item = gallery.get(art.id);
      if (item) item.count++;
      else gallery.set(art.id, { name: art.name, w: art.w, h: art.h, cells: art.cells, count: 1 });

      const box = artPosition(motion);
      for (const color of RAINBOW_HEX) {
        burst(width / 2, box.y + box.h / 2, color, 8, 230);
      }
      announce('完成。500点と8秒を追加しました。');
      setCoach('任務完了！見事な腕前だ！', 'cheer', 2.5, 4);
      sfx('fanfare');
    }

    function fire() {
      if (phase !== 'play' || paused || cooldown > 0 || bullets.length >= 30) return;
      repairAmmo();
      if (current === null) return;
      const offsets = buffs.shotgun > 0 ? [-0.15, 0, 0.15] : [0];
      for (const off of offsets) bullets.push(newProjectile(current, off));
      shots++;
      current = next;
      next = rollColor(current, true);
      repairAmmo();
      cooldown = buffs.rapid > 0 ? 0.075 : 0.16;
      updateHud();
      sfx('tap');
    }

    function drawBall(x, y, r, color) {
      ctx.save();
      if (color === RAINBOW) {
        for (let i = 0; i < RAINBOW_HEX.length; i++) {
          const a = i * 60 * DEG + (reducedMotion ? 0 : effectsTime * 3);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.arc(x, y, r, a, a + 60.3 * DEG);
          ctx.closePath();
          ctx.fillStyle = RAINBOW_HEX[i];
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color === null ? '#60718e' : palette[color];
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#f2f7ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff70';
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.23, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawArt(box) {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#1a2843';
      ctx.fillRect(box.x - 5, box.y - 5, box.w + 10, box.h + 10);
      ctx.strokeStyle = phase === 'clear' ? '#ffe187' : '#4c668d';
      ctx.lineWidth = phase === 'clear' ? 2 : 1;
      ctx.strokeRect(box.x - 5, box.y - 5, box.w + 10, box.h + 10);
      ctx.drawImage(art.ghost, box.x, box.y, box.w, box.h);
      ctx.drawImage(art.solid, box.x, box.y, box.w, box.h);

      if (phase !== 'play' || current === null || box.cell < 4) return;
      const fewLeft = art.left <= Math.max(8, Math.floor(art.total * 0.1));
      const pulse = reducedMotion ? 0.75 : 0.55 + 0.42 * Math.sin(effectsTime * 7);
      ctx.save();
      for (let i = 0; i < art.cells.length; i++) {
        if (art.painted[i] || art.cells[i] < 0) continue;
        const isMatch = current === RAINBOW || art.cells[i] === current;
        if (!isMatch && !fewLeft) continue;
        const cx = box.x + (i % art.w) * box.cell;
        const cy = box.y + Math.floor(i / art.w) * box.cell;
        if (isMatch) {
          ctx.strokeStyle = current === RAINBOW ? '#ffdf85' : '#ffffff';
          ctx.globalAlpha = pulse;
          ctx.lineWidth = Math.max(1.5, box.cell * 0.13);
          ctx.strokeRect(cx + 0.5, cy + 0.5, box.cell - 1, box.cell - 1);
        }
        if (fewLeft) {
          const r = box.cell * (0.62 + (reducedMotion ? 0 : 0.18 * Math.sin(effectsTime * 8)));
          ctx.strokeStyle = isMatch ? '#ffe187' : '#93f5df';
          ctx.globalAlpha = pulse * 0.85;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(cx + box.cell / 2, cy + box.cell / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawAim() {
      const { points, hit } = preview();
      const match = hit && (current === RAINBOW || current === art.cells[hit.index]);
      ctx.save();
      ctx.strokeStyle = match ? '#9af8be' : '#d7e4ff';
      ctx.globalAlpha = pointer ? 0.92 : 0.58;
      ctx.lineWidth = (pointer ? 2.4 : 1.5) * (buffs.wide > 0 ? 1.8 : 1);
      ctx.setLineDash([5, 7]);
      ctx.lineDashOffset = reducedMotion ? 0 : -effectsTime * 30;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.stroke();
      if (buffs.shotgun > 0) {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.4;
        for (const off of [-0.15, 0.15]) {
          const a = angle + off;
          ctx.beginPath();
          ctx.moveTo(layout.x, layout.y);
          ctx.lineTo(layout.x + Math.sin(a) * 140, layout.y - Math.cos(a) * 140);
          ctx.stroke();
        }
      }
      if (hit) {
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = match ? '#9af8be' : '#ffb192';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hit.x, hit.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function nextPosition() {
      return { x: layout.x + Math.min(60, width * 0.22), y: layout.y + 2 };
    }

    function drawLauncher() {
      ctx.save();
      ctx.translate(layout.x, layout.y);
      ctx.fillStyle = '#293f61';
      ctx.beginPath();
      ctx.ellipse(0, 9, 29, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      if (comboTime > 0) {
        ctx.strokeStyle = '#9af8be';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * comboTime / 4);
        ctx.stroke();
      }
      ctx.rotate(angle);
      ctx.fillStyle = '#809bc6';
      ctx.fillRect(-7, -31, 14, 26);
      ctx.fillStyle = '#cfe1ff';
      ctx.fillRect(-7, -31, 14, 4);
      ctx.restore();
      drawBall(layout.x, layout.y, 13, current);
      const p = nextPosition();
      drawBall(p.x, p.y, 9, next);
      ctx.fillStyle = '#c9d8f4';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NEXT', p.x, p.y + 17);
    }

    function drawInstructor() {
      const ix = layout.left + 20, iy = layout.coachY || (layout.top - 18);
      const cheer = coach.mood === 'cheer' && coach.timer > 0;
      const bob = reducedMotion ? 0 : (cheer ? -Math.abs(Math.sin(effectsTime * 11)) * 4 : Math.sin(effectsTime * 2.8) * 1.4);
      const y = iy + bob;

      ctx.save();
      // 足元の影
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(ix, iy + 16, 13, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 体・足（デフォルメあり教官）
      ctx.strokeStyle = '#3b211f';
      ctx.lineWidth = 1.8;
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(ix + sx * 4, y + 7);
        ctx.lineTo(ix + sx * 9, y + 14);
        ctx.stroke();
      }
      ctx.fillStyle = '#5a3430';
      ctx.beginPath();
      ctx.ellipse(ix, y + 6, 7.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // 頭
      ctx.fillStyle = '#6c3f39';
      ctx.beginPath();
      ctx.arc(ix, y - 3, 9.5, 0, Math.PI * 2);
      ctx.fill();
      // 触角
      ctx.strokeStyle = '#4a2a27';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ix - 3, y - 11); ctx.lineTo(ix - 7, y - 17);
      ctx.moveTo(ix + 3, y - 11); ctx.lineTo(ix + 7, y - 17);
      ctx.stroke();
      // 防衛隊ベレー帽＋王冠エンブレム
      ctx.fillStyle = '#254373';
      ctx.beginPath();
      ctx.ellipse(ix + 1, y - 11, 10.5, 5, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(ix + 3, y - 11, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // 目＆タクティカルバイザー
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ix - 3.2, y - 3.5, 2.4, 0, Math.PI * 2);
      ctx.arc(ix + 3.8, y - 3.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#182438';
      ctx.beginPath();
      ctx.arc(ix - 2.6, y - 3.5, 1.2, 0, Math.PI * 2);
      ctx.arc(ix + 4.4, y - 3.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(115, 232, 196, 0.42)';
      ctx.fillRect(ix + 0.5, y - 6.2, 7.5, 4.8);
      // 教官ヒゲ
      ctx.fillStyle = '#f2e4cf';
      ctx.beginPath();
      ctx.ellipse(ix - 2.5, y + 1.2, 3.2, 1.4, 0.25, 0, Math.PI * 2);
      ctx.ellipse(ix + 3.2, y + 1.2, 3.2, 1.4, -0.25, 0, Math.PI * 2);
      ctx.fill();

      // 吹き出し（上部の空きスペースに大きく見やすく表示）
      const bx = ix + 16;
      const maxW = Math.max(90, layout.right - 10 - bx);
      if (maxW >= 72 && coach.text) {
        const bh = 25, by = iy - 1;
        ctx.font = '800 11px system-ui,sans-serif';
        const tw = ctx.measureText(coach.text).width;
        const bw = Math.min(maxW, Math.max(64, tw + 16));
        ctx.fillStyle = 'rgba(255, 253, 245, 0.94)';
        ctx.strokeStyle = coach.mood === 'cheer' ? '#ffd23f' :
          coach.mood === 'alert' ? '#ff9da9' : '#73e8c4';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(bx, by - bh / 2, bw, bh, 9);
        ctx.fill();
        ctx.stroke();
        // しっぽ
        ctx.beginPath();
        ctx.moveTo(bx + 1, by - 3.5);
        ctx.lineTo(bx - 5, by);
        ctx.lineTo(bx + 1, by + 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1b2b48';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(coach.text, bx + 7, by + 0.5, bw - 13);
      }
      ctx.restore();
    }

    function drawLabel(text, x, y, color, size) {
      ctx.font = '900 ' + size + 'px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#091124';
      ctx.strokeText(text, x, y, Math.max(24, width - 18));
      ctx.fillStyle = color;
      ctx.fillText(text, x, y, Math.max(24, width - 18));
    }

    function render() {
      if (!ctx || closed) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#182641');
      bg.addColorStop(1, '#0b1327');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      if (!art) return;

      ctx.strokeStyle = '#294361';
      ctx.lineWidth = 1;
      for (const wall of [layout.left, layout.right]) {
        ctx.beginPath();
        ctx.moveTo(wall, layout.top);
        ctx.lineTo(wall, height);
        ctx.stroke();
      }
      const box = artPosition(motion);
      drawArt(box);
      if (phase === 'play' && !paused && current !== null) drawAim();
      if (phase === 'play' || phase === 'clear') {
        drawLauncher();
        drawInstructor();
      }

      for (const item of items) {
        const pulse = reducedMotion ? 1 : 1 + 0.08 * Math.sin(effectsTime * 6 + item.phase);
        ctx.save();
        ctx.globalAlpha = item.life < 2 ? Math.max(0.25, (Math.sin(effectsTime * 18) + 1) * 0.45) : 0.96;
        ctx.fillStyle = '#0e1b33d8';
        ctx.strokeStyle = item.def.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '16px system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.def.icon, item.x, item.y - 2);
        ctx.font = '900 9px system-ui,sans-serif';
        ctx.fillStyle = item.def.color;
        ctx.fillText(item.def.label, item.x, item.y + 11);
        ctx.restore();
      }

      for (const ball of bullets) {
        const r = ball.radius || 6.5;
        ctx.save();
        ctx.globalAlpha = ball.wide ? 0.5 : 0.38;
        ctx.strokeStyle = ball.color === RAINBOW ? '#e6baff' : palette[ball.color];
        ctx.lineWidth = ball.wide ? 11 : 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x - ball.vx * 0.021, ball.y - ball.vy * 0.021);
        ctx.stroke();
        ctx.restore();
        drawBall(ball.x, ball.y, r, ball.color);
      }

      for (const p of particles) {
        ctx.globalAlpha = p.life / p.max;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      for (const f of floats) {
        ctx.globalAlpha = Math.min(0.88, f.life * 3.5);
        drawLabel(f.text, f.x, f.y, f.color, f.size);
      }
      ctx.globalAlpha = 1;

      if (phase === 'clear') {
        const y = box.y + box.h / 2;
        const pop = reducedMotion ? 0 : 4 * Math.max(0, (transition - 0.8) / 0.35);
        drawLabel('完成！', width / 2, y - 14, '#ffe187', 29 + pop);
        drawLabel('＋500点 ／ ＋8秒', width / 2, y + 15, '#ffffff', 17);
      }
    }

    function updateEffects(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 245 * dt;
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.life -= dt;
        if (f.life <= 0) { floats.splice(i, 1); continue; }
        if (!reducedMotion) f.y -= 36 * dt;
      }
    }

    function updateItems(dt) {
      itemTimer -= dt;
      if (itemTimer <= 0) {
        spawnItem();
        itemTimer = 6.5 + Math.random() * 3.5;
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.life -= dt;
        if (item.life <= 0) { items.splice(i, 1); continue; }
        item.x += item.vx * dt;
        if (item.x < layout.left + 24) { item.x = layout.left + 24; item.vx = Math.abs(item.vx); }
        else if (item.x > layout.right - 24) { item.x = layout.right - 24; item.vx = -Math.abs(item.vx); }
        item.y = item.baseY + Math.sin(effectsTime * 3.2 + item.phase) * 7;
      }
    }

    function updateBalls(dt, from) {
      for (let i = 0; i < bullets.length;) {
        const ball = bullets[i];
        const result = advance(ball, dt, from);
        for (let k = items.length - 1; k >= 0; k--) {
          const item = items[k];
          if (Math.hypot(ball.x - item.x, ball.y - item.y) <= item.r + (ball.radius || 6.5)) {
            items.splice(k, 1);
            collectItem(item);
          }
        }
        if (!result) { i++; continue; }
        bullets.splice(i, 1);
        if (result.hit) {
          handleHit(ball, result.hit);
          if (phase !== 'play') break;
        } else if (buffs.shotgun <= 0) {
          combo = 0;
          comboTime = 0;
          if (!floats.some(f => f.text === 'MISS')) {
            floatText('MISS', ball.x, layout.top, '#ffb0b7', 12, 0.45);
          }
        }
      }
    }

    function stopLoop() {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    }

    function startLoop() {
      if (closed || paused || raf !== null) return;
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function frame(now) {
      raf = null;
      if (closed || paused || (phase !== 'play' && phase !== 'clear')) return;
      const elapsed = Math.max(0, (now - lastFrame) / 1000);
      lastFrame = now;
      const dt = Math.min(0.05, elapsed);
      effectsTime += dt;
      updateEffects(dt);

      if (phase === 'play') {
        time = Math.max(0, time - elapsed);
        if (time === 0) { finish('タイムアップ！'); return; }
        const from = motion;
        motion += dt;
        cooldown = Math.max(0, cooldown - elapsed);
        comboTime = Math.max(0, comboTime - elapsed);
        if (comboTime === 0) combo = 0;
        for (const k of ['rapid', 'wide', 'shotgun']) {
          if (buffs[k] > 0) buffs[k] = Math.max(0, buffs[k] - elapsed);
        }
        if (coach.timer > 0) {
          coach.timer = Math.max(0, coach.timer - elapsed);
          if (coach.timer === 0) coach.priority = 0;
        }
        coach.idleTimer -= elapsed;
        if (!coach.lowWarned && time <= 10) {
          coach.lowWarned = true;
          setCoach('残り10秒！最後まで撃ち抜け！', 'alert', 3, 3);
        } else if (coach.idleTimer <= 0 && coach.timer <= 0) {
          setCoach(COACH_TIPS[Math.floor(Math.random() * COACH_TIPS.length)], 'normal', 2.8, 0);
        }
        updateItems(dt);
        if (pointer && !pointer.swap) {
          pointer.holdTime += dt;
          if (pointer.holdTime >= 0.14 && cooldown <= 0) {
            pointer.firedOnce = true;
            fire();
          }
        } else if (keyFireHeld && cooldown <= 0) {
          fire();
        }
        flushPaint();
        updateBalls(dt, from);
      } else {
        transition -= dt;
        flushPaint();
        if (transition <= 0) {
          phase = 'play';
          cooldown = 0;
          loadArt();
        }
      }
      updateHud();
      render();
      if (!closed && !paused) raf = requestAnimationFrame(frame);
    }

    function cancelPointer() {
      if (!pointer) return;
      const id = pointer.id;
      pointer = null;
      try {
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      } catch (_) {}
    }

    function point(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function onDown(event) {
      if (phase !== 'play' || paused || pointer ||
          (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      focus(canvas);
      const p = point(event);
      const n = nextPosition();
      const isSwap = Math.hypot(p.x - layout.x, p.y - layout.y) < 20 ||
                     Math.hypot(p.x - n.x, p.y - n.y) < 18;
      if (!isSwap && p.y < layout.y - 18) {
        angle = clamp(Math.atan2(p.x - layout.x, layout.y - p.y), -MAX_ANGLE, MAX_ANGLE);
      }
      pointer = {
        id: event.pointerId, x: p.x, y: p.y, base: angle, moved: false,
        swap: isSwap, holdTime: 0, firedOnce: false
      };
      try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
    }

    function applyDrag(p) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      if (Math.hypot(dx, dy) > 6) pointer.moved = true;
      if (pointer.moved) {
        angle = clamp(pointer.base + dx / Math.max(160, width) * 3.1, -MAX_ANGLE, MAX_ANGLE);
      }
    }

    function onMove(event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      event.preventDefault();
      applyDrag(point(event));
    }

    function onUp(event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      event.preventDefault();
      const p = point(event);
      applyDrag(p);
      const gesture = pointer;
      cancelPointer();
      if (!gesture.moved && gesture.swap) { swap(); return; }
      if (!gesture.moved && p.y < layout.y - 18) {
        angle = clamp(Math.atan2(p.x - layout.x, layout.y - p.y), -MAX_ANGLE, MAX_ANGLE);
      }
      if (!gesture.firedOnce) fire();
    }

    function onCancel(event) {
      if (pointer && event.pointerId === pointer.id) cancelPointer();
    }

    function setPaused(value) {
      if (closed || (phase !== 'play' && phase !== 'clear') || paused === value) return;
      paused = value;
      cancelPointer();
      keyFireHeld = false;
      if (paused) {
        stopLoop();
        setPanel('pause-panel', 'resume');
        render();
      } else {
        setPanel(null, 'canvas');
        startLoop();
      }
      updateHud();
    }

    function onKey(event) {
      if (closed) return;
      if (event.key === 'Tab') {
        const panel = root.querySelector('.afisn-layer:not([hidden])') || field;
        const items = Array.from(panel.querySelectorAll('button:not(:disabled), canvas[tabindex="0"]'))
          .filter(el => el.getClientRects().length);
        if (!items.length) return;
        const index = items.indexOf(document.activeElement);
        if (index < 0 || (!event.shiftKey && index === items.length - 1) ||
            (event.shiftKey && index === 0)) {
          event.preventDefault();
          focus(event.shiftKey ? items[items.length - 1] : items[0]);
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        if (phase === 'play' || phase === 'clear') setPaused(!paused);
        else close();
        return;
      }

      if (phase !== 'play' || paused || document.activeElement !== canvas) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        angle = clamp(angle + direction * (event.shiftKey ? 0.012 : 0.05), -MAX_ANGLE, MAX_ANGLE);
      } else if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault();
        keyFireHeld = true;
        fire();
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!event.repeat) swap();
      }
    }

    function showSaveStatus(message, targetRun) {
      if (closed || run !== targetRun) return;
      statusMessage = message;
      const status = $('save-status');
      status.textContent = message;
      status.hidden = !message;
    }

    function commit(runToCommit) {
      if (!runToCommit || runToCommit.committed) return;
      runToCommit.committed = true;
      const coins = Math.floor(score / 100);
      let saveResult;

      try {
        const data = saveObject();
        if (!data) {
          showSaveStatus('保存データを取得できなかったため、コインと記録は保存されていません。', runToCommit);
          return;
        }
        data.coins = nonnegativeInteger(data.coins) + coins;
        data.minigameSnipeHighScore = Math.max(readBest(), score);
        if (typeof persist === 'function') {
          saveResult = persist();
        } else {
          showSaveStatus('コインと記録を反映しましたが、保存機能は利用できません。', runToCommit);
        }
      } catch (_) {
        showSaveStatus('コインと記録の保存に失敗しました。', runToCommit);
      }

      if (typeof updateCoins === 'function') safeCall(updateCoins, null);
      if (saveResult && typeof saveResult.then === 'function') {
        Promise.resolve(saveResult).catch(() => {
          showSaveStatus('コインと記録の保存に失敗しました。', runToCommit);
        });
      }
    }

    function renderGallery() {
      const target = $('gallery');
      target.replaceChildren();
      if (!gallery.size) {
        const empty = document.createElement('p');
        empty.textContent = '今回は完成した絵がありません。';
        target.appendChild(empty);
        return;
      }

      for (const item of gallery.values()) {
        const figure = document.createElement('figure');
        figure.className = 'afisn-thumb';
        const thumb = document.createElement('canvas');
        thumb.width = thumb.height = 64;
        thumb.setAttribute('aria-hidden', 'true');
        const g = thumb.getContext('2d');
        if (g) {
          const size = Math.max(1, Math.floor(58 / Math.max(item.w, item.h)));
          const x0 = Math.floor((64 - item.w * size) / 2);
          const y0 = Math.floor((64 - item.h * size) / 2);
          for (let i = 0; i < item.cells.length; i++) {
            if (item.cells[i] < 0) continue;
            g.fillStyle = palette[item.cells[i]];
            g.fillRect(x0 + i % item.w * size, y0 + Math.floor(i / item.w) * size, size, size);
          }
          figure.appendChild(thumb);
        }
        const caption = document.createElement('figcaption');
        caption.textContent = item.name + (item.count > 1 ? ' ×' + item.count : '');
        caption.title = caption.textContent;
        figure.appendChild(caption);
        target.appendChild(figure);
      }
    }

    function finish(title) {
      if (closed || (phase !== 'play' && phase !== 'clear')) return;
      const endingRun = run;
      phase = 'results';
      paused = false;
      stopLoop();
      cancelPointer();
      keyFireHeld = false;
      bullets = [];
      items = [];
      commit(endingRun);
      if (closed || run !== endingRun) return;

      $('result-title').textContent = title;
      $('result-score').textContent = format(score) + ' 点';
      $('reward').textContent = '獲得コイン：' + format(Math.floor(score / 100)) + ' 枚';
      const best = readBest();
      const record = score > endingRun.best && best === score;
      $('summary').textContent =
        '完成 ' + completed + '枚 ／ 最大 ' + maxCombo + 'コンボ ／ 発射 ' + shots + '回' +
        (record ? ' ／ 新記録！' : ' ／ ベスト ' + format(best) + '点');
      const rank = completed >= 5 || score >= 15000 ? '🎖️ 教官「伝説のエース隊員だ！王国も安泰だな！」' :
        completed >= 3 || score >= 7000 ? '🎖️ 教官「見事な射撃だったぞ！色彩防衛隊の誇りだ！」' :
        completed >= 1 ? '🎖️ 教官「よくやった！王国の宝がまたひとつ戻ったぞ！」' :
        '🎖️ 教官「まずは1枚完成を目指そう！長押し連射がコツだぞ！」';
      $('coach-rank').textContent = rank;
      showSaveStatus(statusMessage, endingRun);
      renderGallery();
      updateHud();
      render();
      setPanel('results', 'retry');
      announce('終了。' + format(score) + '点。' + completed + '枚完成。');
      sfx(record ? 'fanfare' : 'starPing');
    }

    function start() {
      if (closed || (phase !== 'intro' && phase !== 'results')) return;
      sfx('init');
      cancelPointer();
      keyFireHeld = false;
      time = GAME_TIME;
      score = combo = maxCombo = comboTime = shots = completed = 0;
      angle = effectsTime = transition = cooldown = rollsSinceRainbow = 0;
      bullets = [];
      particles = [];
      floats = [];
      items = [];
      itemTimer = 3.5;
      buffs = { rapid: 0, wide: 0, shotgun: 0 };
      coach = { text: '出動だ！', mood: 'normal', timer: 2.2, priority: 1, idleTimer: 5, lowWarned: false, fewWarned: false };
      gallery = new Map();
      paused = false;
      statusMessage = '';
      run = { committed: false, best: readBest() };
      phase = 'play';
      loadArt();
      setPanel(null, 'canvas');
      updateHud();
      render();
      announce('スタート。装填された玉と同じ色を狙ってください。');
      startLoop();
    }

    function close() {
      if (closed) return;
      closed = true;
      stopLoop();
      cancelPointer();
      if (observer) observer.disconnect();
      for (const remove of removers) remove();
      root.remove();
      style.remove();
      document.body.style.overflow = oldOverflow;
      if (activeClose === close) activeClose = null;
      focus(previousFocus);
      commit(run);
      if (typeof onClose === 'function') safeCall(onClose, null);
    }

    for (const button of root.querySelectorAll('.afisn-close')) listen(button, 'click', close);
    listen(document, 'keydown', onKey);
    if (!ctx) {
      setPanel('fatal', 'fatal');
      focus($('fatal').querySelector('button'));
      return close;
    }

    listen(canvas, 'pointerdown', onDown, { passive: false });
    listen(canvas, 'pointermove', onMove, { passive: false });
    listen(canvas, 'pointerup', onUp, { passive: false });
    listen(canvas, 'pointercancel', onCancel);
    listen(canvas, 'lostpointercapture', onCancel);
    listen(window, 'keyup', e => {
      if (e.code === 'Space' || e.key === 'Enter') keyFireHeld = false;
    });
    listen(canvas, 'contextmenu', e => e.preventDefault());
    listen($('start'), 'click', start);
    listen($('retry'), 'click', start);
    listen($('swap'), 'click', swap);
    listen($('pause'), 'click', () => setPaused(true));
    listen($('resume'), 'click', () => setPaused(false));
    listen($('end'), 'click', () => finish('プレイ結果'));
    listen($('exit'), 'click', () => finish('プレイ結果'));
    listen(window, 'blur', () => setPaused(true));
    listen(document, 'visibilitychange', () => {
      if (document.hidden) setPaused(true);
    });
    listen(window, 'resize', resize);
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(resize);
      observer.observe(field);
    }

    if (typeof ARTS === 'undefined' || !ARTS || !ARTS.length || typeof getArt !== 'function') {
      $('notice').textContent = 'お題データが利用できないため、練習用の絵を使います。';
      $('notice').hidden = false;
    }
    updateHud();
    resize();
    setPanel('intro', 'start');
    return close;
  };

  if (typeof AF_LOADED !== 'undefined' && AF_LOADED &&
      typeof AF_LOADED.push === 'function') {
    AF_LOADED.push('minigame_snipe.js');
  } else {
    if (!Array.isArray(window.AF_LOADED)) window.AF_LOADED = [];
    window.AF_LOADED.push('minigame_snipe.js');
  }
})();
