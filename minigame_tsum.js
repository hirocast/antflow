// File: minigame_tsum.js
(() => {
  'use strict';

  const ROUND_MS = 60_000;
  const READY_MS = 1_400;
  const FEVER_MS = 8_000;
  const FEVER_BONUS_MS = 5_000;
  const FEVER_CAPACITY = 24;
  const COMBO_MS = 3_000;
  const SHUFFLE_MS = 2_500;
  const MIN_CHAIN = 3;
  const BOMB_CHAIN = 7;
  const STEP = 1 / 90;
  const BOMB = -1;
  const STYLE_ID = 'af-integrated-tsum-style';
  const COLORS = [
    ['#ffe2e9', '#df7797'],
    ['#e0f3ff', '#619fcd'],
    ['#e4f5d7', '#70a659'],
    ['#fff0c4', '#c79336'],
    ['#efe4ff', '#a17ac8']
  ];

  let activeGame = null;

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const random = (lo, hi) => lo + Math.random() * (hi - lo);
  const integer = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  };
  const format = new Intl.NumberFormat('ja-JP');
  const fmt = (n) => format.format(n);

  function sound(name) {
    try {
      if (typeof Sound === 'undefined' || !Sound || typeof Sound[name] !== 'function') return;
      const result = Sound[name]();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      // 音声が利用できなくても進行する。
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .afits, .afits * { box-sizing:border-box }
      .afits {
        position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center;
        padding:max(6px,env(safe-area-inset-top,0px))
                max(6px,env(safe-area-inset-right,0px))
                max(6px,env(safe-area-inset-bottom,0px))
                max(6px,env(safe-area-inset-left,0px));
        background:#36251eaa; color:#614333; overscroll-behavior:contain;
        font-family:"Hiragino Maru Gothic ProN","Yu Gothic",Meiryo,sans-serif;
        -webkit-tap-highlight-color:transparent; user-select:none;
      }
      .afits-panel {
        position:relative; display:grid;
        grid-template-rows:auto auto auto minmax(0,1fr) auto;
        gap:7px; width:min(100%,500px); height:min(100%,820px);
        min-height:0; overflow:hidden; padding:10px; border-radius:22px;
        background:#fff4df; box-shadow:0 12px 38px #36251e66;
      }
      .afits-top { display:flex; gap:8px; align-items:center; justify-content:space-between }
      .afits-top h2 { margin:0; font-size:clamp(16px,5vw,23px) }
      .afits-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:7px }
      .afits button {
        min-height:44px; padding:5px 12px; border:1px solid #dbc09c;
        border-radius:13px; background:#fffdf6; color:#614333;
        font:inherit; font-size:13px; font-weight:750; cursor:pointer;
        touch-action:manipulation;
      }
      .afits button:focus-visible { outline:3px solid #8e4a2d; outline-offset:2px }
      .afits button:disabled { opacity:.55; cursor:default }
      .afits button.afits-primary { background:#ffe0a8 }
      .afits-hud {
        display:grid; grid-template-columns:1fr 1.4fr 1fr; gap:5px; text-align:center;
      }
      .afits-hud > div { min-width:0; padding:3px; background:#fffdf6; border-radius:10px }
      .afits-hud small { display:block; font-size:11px }
      .afits-hud strong {
        display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        font-size:clamp(15px,4vw,22px); font-variant-numeric:tabular-nums;
      }
      .afits-low { color:#a62d43 }
      .afits-fever { display:grid; grid-template-columns:9em 1fr; gap:6px; align-items:center; font-size:11px }
      .afits-meter { height:11px; border-radius:999px; overflow:hidden; background:#eadbc8 }
      .afits-fill {
        height:100%; background:linear-gradient(90deg,#edac58,#db7199);
        transform:scaleX(0); transform-origin:left;
      }
      .afits-stage {
        position:relative; min-height:0; overflow:hidden; border:2px solid #e4c7a0;
        border-radius:16px;
        background:radial-gradient(#e9d5b8 1px,transparent 1.5px) 0 0/16px 16px,#fffaf0;
      }
      .afits-hot .afits-stage { border-color:#df789d; background-color:#fff0f3 }
      .afits-hot .afits-fill { background:linear-gradient(90deg,#ec9265,#e57fa6,#a988df) }
      .afits canvas {
        position:absolute; inset:0; display:block; width:100%; height:100%; touch-action:none;
      }
      .afits-banner {
        position:absolute; inset:0; display:grid; place-items:center; pointer-events:none;
        color:#893e59; font-size:clamp(18px,6vw,34px); font-weight:900;
        text-shadow:0 2px #fff,0 0 8px #fff;
      }
      .afits-foot { display:flex; align-items:center; gap:8px; min-width:0 }
      .afits-hint { margin:0; text-align:left; font-size:11px; flex:1; min-width:0; line-height:1.35 }
      .afits-screen {
        position:absolute; inset:0; display:flex; overflow:auto; padding:9px;
        background:#47312088; overscroll-behavior:contain;
      }
      .afits-screen[hidden], .afits-screen [hidden] { display:none }
      .afits-card {
        width:min(100%,340px); margin:auto; padding:12px;
        border:2px solid #e8cfa8; border-radius:18px; background:#fffaf0;
        box-shadow:0 5px 20px #47312055; text-align:center;
      }
      .afits-card h3 { margin:0 0 6px; font-size:20px }
      .afits-card p { margin:6px 0; font-size:12px; line-height:1.45 }
      .afits-card .afits-result-score { font-size:26px; font-weight:900 }
      .afits-cast { display:flex; flex-wrap:wrap; justify-content:center; gap:6px }
      .afits-cast img { width:42px; height:42px }
      .afits-skill-info {
        margin:6px 0; padding:6px 10px; border-radius:12px;
        background:#fff; border:1.5px solid #e4c7a0; font-size:12px; line-height:1.4;
      }
      .afits-skill {
        position:relative; flex:none;
        overflow:hidden; display:inline-flex; align-items:center; gap:5px;
        background:#fffdf6; border:2px solid #e4c7a0; border-radius:999px;
      }
      .afits-skill .afits-sk-fill {
        position:absolute; inset:0 auto 0 0; width:0%;
        background:linear-gradient(90deg,#ffd5e5,#ffe29a); pointer-events:none; transition:width .18s;
      }
      .afits-skill span { position:relative }
      .afits-skill.afits-sk-ready {
        border-color:#df7197; background:#fff0f6; color:#893e59;
        box-shadow:0 0 0 2px #ff8fb355; animation:afitsSkPulse .85s ease-in-out infinite alternate;
      }
      @keyframes afitsSkPulse { from { transform:scale(1) } to { transform:scale(1.05) } }
      @media(max-height:440px) {
        .afits-panel { gap:4px; padding:5px; border-radius:12px }
        .afits-card { padding:8px }
        .afits-cast img { width:30px; height:30px }
      }
    `;
    document.head.appendChild(style);
  }

  function chooseCast() {
    const arts = typeof ARTS !== 'undefined' && ARTS ? ARTS : null;
    const total = arts && Number.isInteger(arts.length) ? arts.length : 5;
    const cleared = typeof save !== 'undefined' && save ? save.cleared : null;
    const unlocked = [];
    const early = [];

    for (let id = 1; id <= total; id++) {
      (cleared && cleared[id] ? unlocked : early).push(id);
    }

    for (let i = unlocked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unlocked[i], unlocked[j]] = [unlocked[j], unlocked[i]];
    }

    const ids = unlocked.concat(early).slice(0, COLORS.length);
    while (ids.length < COLORS.length) ids.push(null);

    return ids.map((id, i) => {
      const name = (id !== null && arts && arts[id - 1] && arts[id - 1].n)
        || (id === null ? `おまけピース ${i + 1}` : `ステージ ${id}`);
      return { name, sprite: makeSprite(id, i) };
    });
  }

  function makeSprite(id, type) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const g = sprite.getContext('2d');
    const [light, dark] = type === BOMB ? ['#fff0bc', '#a76bc1'] : COLORS[type];

    const gradient = g.createRadialGradient(47, 39, 7, 64, 64, 66);
    gradient.addColorStop(0, '#fffdf7');
    gradient.addColorStop(0.36, light);
    gradient.addColorStop(1, dark);

    g.beginPath();
    g.arc(64, 64, 59, 0, Math.PI * 2);
    g.fillStyle = gradient;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = dark;
    g.stroke();

    if (type === BOMB) {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = i * Math.PI / 5 - Math.PI / 2;
        const r = i % 2 ? 16 : 36;
        const x = 64 + Math.cos(a) * r;
        const y = 64 + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fillStyle = '#fff9d2';
      g.fill();
      g.strokeStyle = '#79488d';
      g.stroke();
      return sprite;
    }

    let art;
    try {
      if (id !== null && typeof getArt === 'function') art = getArt(id);
    } catch {
      // 欠けているアートは番号付きのツムに差し替える。
    }

    const palette = typeof HEX !== 'undefined' ? HEX : null;
    const pixel = (y, x) => {
      const row = art.grid[y];
      return Array.isArray(row) || ArrayBuffer.isView(row) ? row[x] : art.grid[y * art.w + x];
    };
    const colorOf = (n) => {
      if (!Number.isInteger(n) || n < 0 || !palette || !palette[n]) return null;
      const color = String(palette[n]).trim();
      return /^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color) ? '#' + color : color;
    };

    let drawn = false;
    const aw = art && (art.w ?? art.W), ah = art && (art.h ?? art.H);
    if (art && art.grid && Number.isInteger(aw) && Number.isInteger(ah)
        && aw > 0 && ah > 0) {
      let left = aw, right = -1, top = ah, bottom = -1;
      for (let y = 0; y < ah; y++) {
        for (let x = 0; x < aw; x++) {
          const row = art.grid[y];
          const cVal = Array.isArray(row) || ArrayBuffer.isView(row) ? row[x] : art.grid[y * aw + x];
          if (!colorOf(cVal)) continue;
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }

      if (right >= left) {
        const w = right - left + 1;
        const h = bottom - top + 1;
        const scale = 76 / Math.max(w, h);
        const ox = (128 - w * scale) / 2;
        const oy = (128 - h * scale) / 2;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const row = art.grid[top + y];
            const cVal = Array.isArray(row) || ArrayBuffer.isView(row) ? row[left + x] : art.grid[(top + y) * aw + (left + x)];
            const color = colorOf(cVal);
            if (!color) continue;
            const x0 = Math.round(ox + x * scale);
            const y0 = Math.round(oy + y * scale);
            g.fillStyle = color;
            g.fillRect(x0, y0, Math.round(ox + (x + 1) * scale) - x0,
              Math.round(oy + (y + 1) * scale) - y0);
          }
        }
        drawn = true;
      }
    }

    if (!drawn) {
      g.fillStyle = '#614333';
      g.font = 'bold 48px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(type + 1), 64, 66);
    }
    return sprite;
  }

  window.openMiniTsum = function openMiniTsum(onClose) {
    if (activeGame) {
      activeGame.focus();
      return;
    }

    injectStyle();

    const previousFocus = document.activeElement;
    const reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const cast = chooseCast();
    function currentSkinInfo() {
      const k = (typeof save !== 'undefined' && save && save.skin) || 'none';
      const s = (typeof SKINS !== 'undefined' && Array.isArray(SKINS) && SKINS.find((x) => x.k === k)) || { k: 'none', n: 'すっぴん', e: '🐜' };
      const sk = (typeof getSkinSkill === 'function')
        ? getSkinSkill(s.k)
        : { k: 'none', name: 'ありんこエール', type: 'random', lv: 1, need: 16, tsumDesc: 'ランダムに10こ消去！' };
      return { skin: s, skill: sk };
    }
    const activeSkin = currentSkinInfo();
    const bombSprite = makeSprite(null, BOMB);
    const overlay = document.createElement('div');
    overlay.className = 'afits';
    overlay.innerHTML = `
      <section class="afits-panel" role="dialog" aria-modal="true" aria-labelledby="afits-title">
        <header class="afits-top">
          <h2 id="afits-title">ありんこチェイン</h2>
          <div class="afits-actions">
            <button type="button" data-ui="pause" aria-label="一時停止" disabled>Ⅱ</button>
            <button type="button" data-ui="shuffle" disabled>シャッフル</button>
            <button type="button" data-ui="close" aria-label="ゲームを閉じる">×</button>
          </div>
        </header>
        <div class="afits-hud">
          <div><small>残り時間</small><strong data-ui="time">60秒</strong></div>
          <div><small>スコア</small><strong data-ui="score">0</strong></div>
          <div><small>コンボ</small><strong data-ui="combo">0</strong></div>
        </div>
        <div class="afits-fever">
          <strong data-ui="fever">フィーバー</strong>
          <div class="afits-meter" data-ui="meter" role="progressbar"
               aria-label="フィーバーゲージ" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="afits-fill" data-ui="fill"></div>
          </div>
        </div>
        <div class="afits-stage">
          <canvas aria-label="パズルの盤面"></canvas>
          <div class="afits-banner" data-ui="banner" aria-hidden="true"></div>
        </div>
        <div class="afits-foot">
          <button type="button" class="afits-skill" data-ui="skill" disabled>
            <i class="afits-sk-fill" data-ui="skillFill"></i>
            <span data-ui="skillLabel">${activeSkin.skin.e} スキル 0%</span>
          </button>
          <p class="afits-hint">同じ絵を3つ以上なぞって離そう。7つ以上でボム！</p>
        </div>
        <div class="afits-screen" data-ui="screen">
          <div class="afits-card" data-ui="intro">
            <h3>ありんこチェインであそぼう！</h3>
            <div class="afits-cast" data-ui="cast"></div>
            <div class="afits-skill-info">
              <b>${activeSkin.skin.e} ${activeSkin.skin.n}（SLv.${activeSkin.skill.lv}）</b><br>
              ⚡ ${activeSkin.skill.name}：${activeSkin.skill.tsumDesc}
            </div>
            <p>ボムはタップで周囲を消去。近くのボムも誘爆します。<br>
              フィーバーで残り時間＋5秒、発動中はスコア2倍！</p>
            <p>制限時間は60秒。100点ごとに1コイン。</p>
            <div class="afits-actions">
              <button type="button" data-ui="leave">もどる</button>
              <button type="button" class="afits-primary" data-ui="start">スタート</button>
            </div>
          </div>
          <div class="afits-card" data-ui="result" hidden>
            <h3>タイムアップ！</h3>
            <div role="status">
              <p class="afits-result-score" data-ui="final"></p>
              <p data-ui="best"></p>
              <p data-ui="reward"></p>
              <p data-ui="stats"></p>
            </div>
            <div class="afits-actions">
              <button type="button" data-ui="done">もどる</button>
              <button type="button" class="afits-primary" data-ui="retry">もう一度</button>
            </div>
          </div>
          <div class="afits-card" data-ui="pauseCard" hidden>
            <h3>一時停止中</h3>
            <p>タイマーは止まっています。</p>
            <div class="afits-actions">
              <button type="button" data-ui="pauseClose">閉じる</button>
              <button type="button" data-ui="pauseRetry">やり直す</button>
              <button type="button" class="afits-primary" data-ui="resume">再開</button>
            </div>
          </div>
        </div>
      </section>`;

    const panel = overlay.querySelector('.afits-panel');
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const ui = Object.create(null);
    for (const node of overlay.querySelectorAll('[data-ui]')) ui[node.dataset.ui] = node;

    for (const item of cast) {
      const img = document.createElement('img');
      img.src = item.sprite.toDataURL();
      img.alt = img.title = item.name;
      ui.cast.appendChild(img);
    }

    let phase = 'intro';
    let paused = false, pausedAt = 0;
    let width = 0, height = 0, radius = 20, target = 40;
    let pieces = [], effects = [], gesture = null;
    let score = 0, combo = 0, maxCombo = 0, maxChain = 0;
    let lastClear = -Infinity, charge = 0, feverUntil = 0, shuffleAt = 0;
    let skillCharge = 0, skillFreezeUntil = 0, skillRushUntil = 0, skillRushMul = 1;
    let startAt = 0, endAt = 0;
    let frame = 0, lastFrame = 0, accumulator = 0, spawnWait = 0;
    let observer = null, lastMeter = -1, round = 0;

    function text(node, value) {
      if (node.textContent !== value) node.textContent = value;
    }

    function isFever(now) {
      return phase === 'playing' && now < feverUntil;
    }

    function hud(now) {
      const hot = isFever(now);
      const frozen = phase === 'playing' && now < skillFreezeUntil;
      const seconds = phase === 'result' ? 0 : phase === 'playing'
        ? Math.max(0, Math.ceil((endAt - now) / 1000)) : ROUND_MS / 1000;
      const percent = clamp(Math.round(100 * (hot
        ? (feverUntil - now) / FEVER_MS : charge / FEVER_CAPACITY)), 0, 100);

      text(ui.time, frozen ? `❄️${seconds}秒` : `${seconds}秒`);
      text(ui.score, fmt(score));
      text(ui.combo, now - lastClear <= COMBO_MS ? fmt(combo) : '0');
      text(ui.fever, hot ? 'フィーバー ×2' : 'フィーバー');
      ui.time.classList.toggle('afits-low', phase === 'playing' && seconds <= 10 && !frozen);
      panel.classList.toggle('afits-hot', hot);
      ui.pause.disabled = paused || (phase !== 'ready' && phase !== 'playing');
      ui.shuffle.disabled = paused || phase !== 'playing' || now < shuffleAt;

      const skNeed = activeSkin.skill.need;
      const skPct = clamp(Math.round(100 * skillCharge / skNeed), 0, 100);
      const skReady = phase === 'playing' && skillCharge >= skNeed;
      ui.skill.disabled = !skReady;
      ui.skill.classList.toggle('afits-sk-ready', skReady);
      ui.skillFill.style.width = `${skPct}%`;
      text(ui.skillLabel, skReady ? `${activeSkin.skin.e} スキルOK!` : `${activeSkin.skin.e} ${skPct}%`);

      if (percent !== lastMeter) {
        lastMeter = percent;
        ui.fill.style.transform = `scaleX(${percent / 100})`;
        ui.meter.setAttribute('aria-valuenow', String(percent));
      }
    }

    function clearGesture() {
      if (!gesture) return;
      const id = gesture.id;
      gesture = null;
      try {
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      } catch {
        // ポインターがすでに終了している場合。
      }
    }

    function constrain(p) {
      if (p.x < radius) {
        p.x = radius;
        if (p.vx < 0) p.vx *= -0.24;
      } else if (p.x > width - radius) {
        p.x = width - radius;
        if (p.vx > 0) p.vx *= -0.24;
      }
      if (p.y > height - radius) {
        p.y = height - radius;
        if (p.vy > 0) p.vy = p.vy > 45 ? -p.vy * 0.2 : 0;
        p.vx *= 0.91;
      }
    }

    function fit() {
      if (phase === 'closed') return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      if (w !== width || h !== height) {
        clearGesture();
        if (width && height) {
          for (const p of pieces) {
            p.x *= w / width;
            p.y *= h / height;
          }
          effects = [];
        }
        width = w;
        height = h;
        radius = Math.min(32, width / 15, height / 12);
        target = clamp(Math.round(width * height * 0.64 / (4 * radius * radius)), 24, 48);
        const excess = Math.max(0, pieces.length - target);
        if (excess) {
          // リサイズで密度が上がったときは上側の通常ツムから間引く。
          const removed = new Set(pieces.filter((p) => p.type !== BOMB)
            .sort((a, b) => a.y - b.y).slice(0, excess));
          pieces = pieces.filter((p) => !removed.has(p));
        }
        pieces.forEach(constrain);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.max(1, Math.round(w * dpr));
      const ph = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      ctx.setTransform(pw / w, 0, 0, ph / h, 0, 0);
      paint(performance.now());
    }

    function piece(type, x, y, vx = 0, vy = 0) {
      return { type, x, y, vx, vy };
    }

    function randomType() {
      return Math.floor(Math.random() * cast.length);
    }

    function prefill() {
      if (!width || !height) return;
      const cols = Math.max(2, Math.floor(width / (2.1 * radius)));
      for (let i = 0; i < target; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const x = (col + 0.5) * width / cols + random(-0.12, 0.12) * radius;
        const y = height - radius * (2.5 + row * 2.05);
        pieces.push(piece(randomType(), x, y, random(-18, 18)));
      }
    }

    function spawn() {
      let bestX = width / 2, bestGap = -1;
      const y = -radius * 1.15;
      for (let i = 0; i < 7; i++) {
        const x = random(radius, width - radius);
        let gap = Infinity;
        for (const p of pieces) gap = Math.min(gap, (p.x - x) ** 2 + (p.y - y) ** 2);
        if (gap > bestGap) { bestGap = gap; bestX = x; }
        if (gap > 12 * radius * radius) break;
      }
      if (bestGap < 3 * radius * radius) return false;
      pieces.push(piece(randomType(), bestX, y, random(-22, 22), radius * 4));
      return true;
    }

    function physics(dt) {
      if (!width || !height) return;
      if (pieces.length < target) {
        spawnWait -= dt;
        if (spawnWait <= 0) spawnWait = spawn() ? 0.06 : 0.025;
      } else {
        spawnWait = 0;
      }

      const gravity = Math.max(360, radius * 44);
      for (const p of pieces) {
        p.vy = Math.min(p.vy + gravity * dt, radius * 36);
        p.vx *= 0.993;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        constrain(p);
      }

      const d = 2 * radius;
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < pieces.length; i++) {
          const a = pieces[i];
          for (let j = i + 1; j < pieces.length; j++) {
            const b = pieces[j], dx = b.x - a.x, dy = b.y - a.y;
            const sq = dx * dx + dy * dy;
            if (sq >= d * d) continue;
            const dist = Math.sqrt(sq);
            const nx = dist > 0.0001 ? dx / dist : 1;
            const ny = dist > 0.0001 ? dy / dist : 0;
            const push = Math.max(0, d - dist - 0.1) * 0.49;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
            const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (approach < 0) {
              const impulse = -approach * (approach < -45 ? 0.57 : 0.5);
              a.vx -= impulse * nx; a.vy -= impulse * ny;
              b.vx += impulse * nx; b.vy += impulse * ny;
            }
          }
        }
        pieces.forEach(constrain);
      }
    }

    function burst(p, now) {
      if (reduceMotion) return;
      const color = p.type === BOMB ? '#ad70c1' : COLORS[p.type][1];
      const n = p.type === BOMB ? 12 : 5;
      for (let i = 0; i < n; i++) {
        effects.push({
          kind: 'spark', x: p.x, y: p.y, color, at: now, life: random(240, 470),
          vx: random(-5, 5) * radius, vy: random(-8, 2) * radius,
          size: random(0.08, 0.18) * radius
        });
      }
    }

    function label(x, y, value, color, now) {
      effects.push({ kind: 'text', x, y, value, color, at: now, life: 800 });
    }

    function paint(now) {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const chain = gesture ? gesture.chain : [];
      const selected = new Set(chain);
      const armed = gesture && !gesture.dragged ? gesture.bomb : null;

      for (const p of pieces) {
        if (selected.has(p)) continue;
        drawPiece(p, p === armed ? 1.12 : 1, chain.length && p.type !== chain[0].type ? 0.45 : 1);
      }

      if (chain.length) {
        const last = chain[chain.length - 1];
        const color = COLORS[last.type][1];
        ctx.beginPath();
        ctx.moveTo(chain[0].x, chain[0].y);
        for (let i = 1; i < chain.length; i++) ctx.lineTo(chain[i].x, chain[i].y);
        const tip = gesture.last;
        if (Math.hypot(tip.x - last.x, tip.y - last.y) <= radius * 3) ctx.lineTo(tip.x, tip.y);
        ctx.lineCap = ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = radius * 0.53;
        ctx.stroke();
        ctx.strokeStyle = '#fff9df';
        ctx.lineWidth = radius * 0.24;
        ctx.stroke();

        for (const p of chain) drawPiece(p, 1.12, 1);
        const badge = `${chain.length}${chain.length >= BOMB_CHAIN ? ' ＋ボム' : ''}`;
        drawText(
          badge, clamp(last.x, 38, Math.max(38, width - 38)),
          Math.max(14, last.y - radius * 1.55), color,
          clamp(radius * 0.72, 13, 20)
        );
      }

      effects = effects.filter((e) => now - e.at < e.life);
      for (const e of effects) {
        const age = Math.max(0, now - e.at);
        const t = age / 1000, progress = age / e.life;
        ctx.globalAlpha = 1 - progress;
        if (e.kind === 'spark') {
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(e.x + e.vx * t, e.y + e.vy * t + 280 * t * t,
            e.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.kind === 'ring') {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius * (0.2 + 0.8 * progress), 0, Math.PI * 2);
          ctx.strokeStyle = '#dc9360';
          ctx.lineWidth = 4;
          ctx.stroke();
        } else {
          drawText(e.value, clamp(e.x, 44, Math.max(44, width - 44)),
            Math.max(16, e.y - (reduceMotion ? 0 : 24 * progress)), e.color, 17);
        }
      }
      ctx.globalAlpha = 1;

      function drawPiece(p, scale, alpha) {
        const r = radius * scale;
        ctx.globalAlpha = alpha;
        ctx.drawImage(p.type === BOMB ? bombSprite : cast[p.type].sprite,
          p.x - r, p.y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }

      function drawText(value, x, y, color, size) {
        ctx.font = `bold ${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fffdf5';
        ctx.strokeText(value, x, y);
        ctx.fillStyle = color;
        ctx.fillText(value, x, y);
      }
    }

    function award(count, now, fromBomb, fromSkill) {
      combo = now - lastClear <= COMBO_MS ? combo + 1 : 1;
      lastClear = now;
      maxCombo = Math.max(maxCombo, combo);
      const hot = isFever(now);
      const rush = now < skillRushUntil ? skillRushMul : 1;
      const chainBonus = (fromBomb || fromSkill) ? 0 : 5 * count * Math.max(0, count - MIN_CHAIN);
      const points = Math.round((20 * count + chainBonus + 10 * Math.min(combo - 1, 20)) * (hot ? 2 : 1) * rush);
      score += points;

      if (!fromSkill) {
        skillCharge = Math.min(activeSkin.skill.need, skillCharge + count);
      }
      if (!hot) {
        charge += count;
        if (charge >= FEVER_CAPACITY) {
          charge = 0;
          feverUntil = now + FEVER_MS;
          endAt += FEVER_BONUS_MS;
          label(width / 2, height * 0.32, 'FEVER！ ＋5秒', '#a63f6d', now);
          sound('tsumFever');
        }
      }
      return points;
    }

    function triggerSkill() {
      const now = performance.now();
      if (!canPlay(now) || skillCharge < activeSkin.skill.need) return;
      clearGesture();
      skillCharge = 0;
      const sk = activeSkin.skill;
      const lv = sk.lv;
      sound('tsumSkill');
      label(width / 2, height * 0.28, `${activeSkin.skin.e} ${sk.name}！`, '#b03060', now);

      const clearSet = (list) => {
        if (!list.length) return 0;
        removePieces(list, now);
        const pts = award(list.length, now, false, true);
        label(width / 2, height * 0.45, `+${fmt(pts)}`, '#a45e25', now);
        sound('tsumBomb', 0);
        return list.length;
      };
      const pickRandom = (n) => {
        const pool = pieces.filter((p) => p.type >= 0 && p.y > 0);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, n);
      };

      switch (sk.type) {
        case 'sweepH': {
          const cy = height * 0.56;
          const band = radius * (1.5 + lv * 0.55);
          if (!reduceMotion) effects.push({ kind: 'ring', x: width / 2, y: cy, radius: width * 0.55, at: now, life: 360 });
          clearSet(pieces.filter((p) => p.type >= 0 && Math.abs(p.y - cy) <= band));
          break;
        }
        case 'burst': {
          const cx = width / 2, cy = height * 0.55;
          const r = radius * (2.6 + lv * 0.65);
          if (!reduceMotion) effects.push({ kind: 'ring', x: cx, y: cy, radius: r, at: now, life: 400 });
          clearSet(pieces.filter((p) => p.type >= 0 && (p.x - cx) ** 2 + (p.y - cy) ** 2 <= r * r));
          break;
        }
        case 'cross': {
          const cx = width / 2, cy = height * 0.55;
          const w = radius * (1.2 + lv * 0.4);
          if (!reduceMotion) effects.push({ kind: 'ring', x: cx, y: cy, radius: width * 0.45, at: now, life: 360 });
          clearSet(pieces.filter((p) => p.type >= 0 && (Math.abs(p.x - cx) <= w || Math.abs(p.y - cy) <= w)));
          break;
        }
        case 'color': {
          const counts = new Map();
          for (const p of pieces) if (p.type >= 0 && p.y > 0) counts.set(p.type, (counts.get(p.type) || 0) + 1);
          let bestType = 0, bestN = -1;
          for (const [t, n] of counts) if (n > bestN) { bestN = n; bestType = t; }
          clearSet(pieces.filter((p) => p.type === bestType && p.y > 0));
          const bombs = lv >= 5 ? 2 : lv >= 3 ? 1 : 0;
          for (let b = 0; b < bombs; b++) {
            pieces.push(piece(BOMB, clamp(width * (0.35 + b * 0.3), radius, width - radius), height * 0.5, 0, -radius * 3));
          }
          break;
        }
        case 'bomb': {
          const n = 1 + Math.floor(lv / 2) + (lv >= 4 ? 1 : 0);
          for (let i = 0; i < n; i++) {
            const x = clamp(width * (0.2 + 0.6 * ((i + 0.5) / n)), radius, width - radius);
            pieces.push(piece(BOMB, x, height * 0.45 + (i % 2) * radius, 0, -radius * 3));
          }
          break;
        }
        case 'transform': {
          const counts = new Map();
          for (const p of pieces) if (p.type >= 0 && p.y > 0) counts.set(p.type, (counts.get(p.type) || 0) + 1);
          let bestType = 0, bestN = -1;
          for (const [t, n] of counts) if (n > bestN) { bestN = n; bestType = t; }
          const others = pieces.filter((p) => p.type >= 0 && p.type !== bestType && p.y > 0);
          const n = Math.min(others.length, 7 + lv * 3);
          for (let i = 0; i < n; i++) {
            others[i].type = bestType;
            burst(others[i], now);
          }
          break;
        }
        case 'freeze': {
          skillFreezeUntil = Math.max(skillFreezeUntil, now + (4 + lv) * 1000);
          clearSet(pickRandom(5 + lv * 2));
          break;
        }
        case 'timePlus': {
          endAt += (2 + lv) * 1000;
          label(width / 2, height * 0.38, `残り時間 ＋${2 + lv}秒！`, '#2e8f55', now);
          clearSet(pickRandom(4 + lv * 2));
          break;
        }
        case 'fever': {
          if (isFever(now)) {
            feverUntil += (lv + 1) * 1000;
          } else {
            charge = 0;
            feverUntil = now + FEVER_MS + (lv - 1) * 800;
            endAt += FEVER_BONUS_MS;
          }
          clearSet(pickRandom(5 + lv * 2));
          break;
        }
        case 'goldRush': {
          skillRushMul = 1.4 + lv * 0.2;
          skillRushUntil = Math.max(skillRushUntil, now + (6 + lv * 2) * 1000);
          clearSet(pickRandom(4 + lv * 2));
          break;
        }
        default: {
          clearSet(pickRandom(7 + lv * 3));
          break;
        }
      }
      hud(now);
      paint(now);
    }

    function removePieces(removed, now) {
      const gone = new Set(removed);
      pieces = pieces.filter((p) => !gone.has(p));
      for (const p of gone) burst(p, now);
    }

    function commitChain(chain, now) {
      if (chain.length < MIN_CHAIN) {
        if (chain.length > 1) sound('deny');
        return;
      }

      maxChain = Math.max(maxChain, chain.length);
      const last = chain[chain.length - 1];
      removePieces(chain, now);
      const points = award(chain.length, now, false);
      label(last.x, last.y - radius, `+${fmt(points)}`, '#a45e25', now);
      sound('tsumClear', chain.length, combo, isFever(now));

      if (chain.length >= BOMB_CHAIN) {
        pieces.push(piece(BOMB, clamp(last.x, radius, width - radius),
          clamp(last.y, radius, height - radius), 0, -radius * 4));
        label(last.x, last.y - radius * 2.1, 'ボム！', '#824699', now);
      }
    }

    function explode(bomb, now) {
      if (!pieces.includes(bomb)) return;
      const blast = radius * 3.55;
      const removed = new Set([bomb]);
      const queue = [bomb];
      for (let i = 0; i < queue.length; i++) {
        const b = queue[i];
        if (!reduceMotion) {
          effects.push({ kind: 'ring', x: b.x, y: b.y, radius: blast, at: now, life: 360 });
        }
        for (const p of pieces) {
          if (removed.has(p) || (p.x - b.x) ** 2 + (p.y - b.y) ** 2 > blast ** 2) continue;
          removed.add(p);
          if (p.type === BOMB) queue.push(p);
        }
      }
      const count = removed.size - queue.length;
      removePieces(removed, now);
      sound('tsumBomb', Math.max(0, queue.length - 1));
      if (count > 0) {
        const points = award(count, now, true);
        label(bomb.x, bomb.y - radius, `+${fmt(points)}`, '#824699', now);
      }
    }

    function hit(x, y, tolerance = 1.15, filter = null) {
      if (x < 0 || y < 0 || x > width || y > height) return null;
      let best = null, bestSq = (radius * tolerance) ** 2;
      for (const p of pieces) {
        if (filter && !filter(p)) continue;
        const sq = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (sq <= bestSq) { best = p; bestSq = sq; }
      }
      return best;
    }

    function trace(p) {
      const g = gesture;
      const from = g.last;
      g.last = p;

      if (g.bomb) {
        if (Math.hypot(p.x - g.start.x, p.y - g.start.y) > Math.max(8, radius * 0.65)) {
          g.dragged = true;
        }
        return;
      }

      const dx = p.x - from.x, dy = p.y - from.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.2) return;
      const samples = clamp(Math.ceil(distance / Math.max(2, radius * 0.34)), 1, 180);
      const chain = g.chain;
      const linkSq = (radius * 3.15) ** 2;
      const undoSq = (radius * 0.95) ** 2;

      for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const sx = from.x + dx * t, sy = from.y + dy * t;
        const last = chain[chain.length - 1];
        const next = hit(sx, sy, 1.32, (cand) => cand.type === last.type);
        if (!next || next === last) continue;
        if (chain.length > 1 && next === chain[chain.length - 2]) {
          if ((sx - next.x) ** 2 + (sy - next.y) ** 2 <= undoSq) {
            chain.pop();
            sound('tsumUnlink', chain.length);
          }
        } else if (!chain.includes(next)
          && (next.x - last.x) ** 2 + (next.y - last.y) ** 2 <= linkSq) {
          chain.push(next);
          sound('tsumLink', chain.length);
        }
      }
    }

    function point(event, rect) {
      return {
        x: (event.clientX - rect.left) * width / rect.width,
        y: (event.clientY - rect.top) * height / rect.height
      };
    }

    function traceEvent(event, coalesced) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (coalesced && typeof event.getCoalescedEvents === 'function') {
        for (const sample of event.getCoalescedEvents()) trace(point(sample, rect));
      }
      trace(point(event, rect));
    }

    function canPlay(now) {
      if (phase !== 'playing') return false;
      if (now < endAt) return true;
      finishRound(now);
      return false;
    }

    function pointerDown(event) {
      if (event.button !== 0 || gesture || !canPlay(performance.now())) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const p = point(event, rect);
      const selected = hit(p.x, p.y, 1.18);
      if (!selected) return;
      event.preventDefault();
      gesture = {
        id: event.pointerId, start: p, last: p, dragged: false, captured: false,
        bomb: selected.type === BOMB ? selected : null,
        chain: selected.type === BOMB ? [] : [selected]
      };
      try {
        canvas.setPointerCapture(event.pointerId);
        gesture.captured = canvas.hasPointerCapture(event.pointerId);
      } catch {
        // キャプチャ不可の場合は盤面を出た時点で選択を取り消す。
      }
      sound('init');
      if (gesture.bomb) sound('tap');
      else sound('tsumLink', 1);
    }

    function pointerMove(event) {
      if (!gesture || gesture.id !== event.pointerId || !canPlay(performance.now())) return;
      traceEvent(event, true);
    }

    function pointerUp(event) {
      if (!gesture || gesture.id !== event.pointerId) return;
      const now = performance.now();
      if (!canPlay(now)) return;
      traceEvent(event, false);
      const g = gesture;
      clearGesture();
      if (g.bomb) {
        if (!g.dragged) explode(g.bomb, now);
      } else {
        commitChain(g.chain, now);
      }
      hud(now);
      paint(now);
    }

    function pointerCancel(event) {
      if (gesture && gesture.id === event.pointerId) clearGesture();
    }

    function shuffleBoard() {
      const now = performance.now();
      if (!canPlay(now) || now < shuffleAt) return;
      clearGesture();
      shuffleAt = now + SHUFFLE_MS;
      for (const p of pieces) {
        if (p.y < 0) continue;
        p.vx = random(-10, 10) * radius;
        p.vy = random(-17, -10) * radius;
      }
      label(width / 2, height / 2, 'シャッフル！', '#7b5b39', now);
      if (document.activeElement === ui.shuffle) ui.close.focus({ preventScroll: true });
      sound('tsumShuffle');
      hud(now);
    }

    function recordReward(earned) {
      const data = typeof save !== 'undefined' ? save : null;
      if (!data) return { best: score, record: false, saved: false };

      const prior = integer(data.minigameHighScore);
      const best = Math.max(prior, score);
      const record = score > prior;
      let saved = false, pending = null;
      try {
        data.coins = integer(data.coins) + earned;
        data.minigameHighScore = best;
        if (typeof persist === 'function') {
          const result = persist();
          if (result && typeof result.then === 'function') pending = Promise.resolve(result);
          else saved = result !== false;
        }
      } catch {
        // 保存失敗は結果画面に表示する。
      }
      try {
        if (typeof updateCoins === 'function') updateCoins();
      } catch {
        // 表示更新の失敗で精算を繰り返さない。
      }

      return { best, record, saved, pending };
    }

    function finishRound(now) {
      if (phase !== 'playing') return;
      phase = 'result';
      cancelAnimationFrame(frame);
      frame = 0;
      clearGesture();
      charge = 0;
      effects = [];
      text(ui.banner, '');
      hud(now);
      paint(now);

      const earned = Math.floor(score / 100);
      const currentRound = round;
      const { best, record, saved, pending } = recordReward(earned);
      const rewardText = `獲得コイン：${fmt(earned)}`;
      const saveStatus = (ok) => text(ui.reward, rewardText + (ok ? '' : '（保存できませんでした）'));
      text(ui.final, `${fmt(score)} 点`);
      text(ui.best, `${record ? '自己ベスト更新' : 'ハイスコア'}：${fmt(best)} 点`);
      text(ui.stats, `最大チェーン：${maxChain} ／ 最大コンボ：${maxCombo}`);

      if (pending) {
        text(ui.reward, rewardText + '（保存中）');
        pending.then(
          (result) => {
            if (phase === 'result' && round === currentRound) saveStatus(result !== false);
          },
          () => {
            if (phase === 'result' && round === currentRound) saveStatus(false);
          }
        );
      } else {
        saveStatus(saved);
      }

      ui.intro.hidden = true;
      ui.result.hidden = false;
      ui.screen.hidden = false;
      ui.screen.scrollTop = 0;
      ui.retry.focus({ preventScroll: true });
      sound('fanfare');
    }

    function tick(now) {
      frame = 0;
      if (paused || (phase !== 'ready' && phase !== 'playing')) return;
      if (phase === 'ready' && now >= startAt) {
        phase = 'playing';
        text(ui.banner, '');
        label(width / 2, height * 0.4, 'スタート！', '#a45e25', now);
        if (now < endAt) sound('tsumReady', true);
      } else if (phase === 'ready') {
        text(ui.banner, startAt - now > 500 ? 'よーい…' : 'まもなくスタート');
      }

      const dtMs = Math.max(0, now - lastFrame);
      if (phase === 'playing' && now < skillFreezeUntil) endAt += dtMs;
      if (phase === 'playing' && now >= endAt) {
        finishRound(now);
        return;
      }

      // 制限時間は実時間で進め、物理演算だけ追いつき量を制限する。
      accumulator += clamp(dtMs / 1000, 0, 0.055);
      lastFrame = now;
      while (accumulator >= STEP) {
        physics(STEP);
        accumulator -= STEP;
      }
      hud(now);
      paint(now);
      frame = requestAnimationFrame(tick);
    }

    function pauseGame() {
      if (paused || (phase !== 'ready' && phase !== 'playing')) return;
      clearGesture();
      paused = true;
      pausedAt = performance.now();
      cancelAnimationFrame(frame);
      frame = 0;
      sound('tap');
      ui.intro.hidden = true;
      ui.result.hidden = true;
      ui.pauseCard.hidden = false;
      ui.screen.hidden = false;
      hud(pausedAt);
      ui.resume.focus({ preventScroll: true });
    }

    function resumeGame() {
      if (!paused || phase === 'closed') return;
      const now = performance.now();
      const delta = now - pausedAt;
      startAt += delta;
      endAt += delta;
      if (feverUntil) feverUntil += delta;
      if (shuffleAt) shuffleAt += delta;
      if (skillFreezeUntil) skillFreezeUntil += delta;
      if (skillRushUntil) skillRushUntil += delta;
      if (lastClear > 0) lastClear += delta;
      lastFrame = now;
      paused = false;
      pausedAt = 0;
      sound('tap');
      ui.pauseCard.hidden = true;
      ui.screen.hidden = true;
      hud(now);
      ui.close.focus({ preventScroll: true });
      frame = requestAnimationFrame(tick);
    }

    function startRound() {
      if (phase !== 'intro' && phase !== 'result' && !paused) return;
      round++;
      sound('init');
      sound('tap');
      clearGesture();
      paused = false;
      pausedAt = 0;
      phase = 'ready';
      pieces = [];
      effects = [];
      score = combo = maxCombo = maxChain = charge = feverUntil = shuffleAt = 0;
      skillCharge = skillFreezeUntil = skillRushUntil = 0; skillRushMul = 1;
      lastClear = -Infinity;
      accumulator = spawnWait = 0;
      const now = performance.now();
      startAt = now + READY_MS;
      endAt = startAt + ROUND_MS;
      lastFrame = now;
      ui.pauseCard.hidden = true;
      ui.screen.hidden = true;
      ui.result.hidden = true;
      text(ui.banner, 'よーい…');
      fit();
      prefill();
      hud(now);
      paint(now);
      ui.close.focus({ preventScroll: true });
      frame = requestAnimationFrame(tick);
    }

    function focusGame() {
      const button = paused ? ui.resume : phase === 'intro' ? ui.start : phase === 'result' ? ui.retry : ui.close;
      button.focus({ preventScroll: true });
    }

    function keydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (paused) resumeGame();
        else close();
        return;
      }
      if (event.key !== 'Tab') return;

      const buttons = paused ? [ui.pauseClose, ui.pauseRetry, ui.resume]
        : phase === 'intro' ? [ui.leave, ui.start]
        : phase === 'result' ? [ui.done, ui.retry]
        : [ui.pause, ui.shuffle, ui.close].filter(b => !b.disabled);

      const index = buttons.indexOf(document.activeElement);
      const next = index < 0 ? (event.shiftKey ? buttons.length - 1 : 0)
        : (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[next].focus();
    }

    function visibilityChange() {
      if (document.hidden) {
        clearGesture();
        pauseGame();
      }
    }

    function close() {
      if (phase === 'closed') return;
      const now = performance.now();
      // 締切を過ぎた直後に閉じても、終了済みラウンドは一度だけ精算する。
      if (!paused && (phase === 'ready' || phase === 'playing') && now >= endAt) {
        phase = 'playing';
        finishRound(now);
      }
      phase = 'closed';
      paused = false;
      clearGesture();
      cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', fit);
      window.removeEventListener('blur', clearGesture);
      document.removeEventListener('visibilitychange', visibilityChange);
      document.removeEventListener('keydown', keydown, true);
      overlay.remove();
      activeGame = null;
      if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll: true });
      }
      if (typeof onClose === 'function') onClose();
    }

    document.body.appendChild(overlay);
    activeGame = { focus: focusGame };

    ui.start.addEventListener('click', startRound);
    ui.retry.addEventListener('click', startRound);
    ui.pause.addEventListener('click', pauseGame);
    ui.resume.addEventListener('click', resumeGame);
    ui.pauseRetry.addEventListener('click', startRound);
    ui.skill.addEventListener('click', triggerSkill);
    ui.shuffle.addEventListener('click', shuffleBoard);
    for (const button of [ui.close, ui.leave, ui.done, ui.pauseClose]) button.addEventListener('click', close);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerCancel);
    canvas.addEventListener('lostpointercapture', pointerCancel);
    canvas.addEventListener('pointerleave', (event) => {
      if (gesture && !gesture.captured) pointerCancel(event);
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    overlay.addEventListener('wheel', (event) => {
      if (ui.screen.hidden || !ui.screen.contains(event.target)) event.preventDefault();
    }, { passive: false });

    window.addEventListener('resize', fit);
    window.addEventListener('blur', clearGesture);
    document.addEventListener('visibilitychange', visibilityChange);
    document.addEventListener('keydown', keydown, true);

    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(fit);
      observer.observe(canvas);
    }
    fit();
    focusGame();
  };
})();

if (typeof AF_LOADED !== 'undefined') {
  AF_LOADED.push('minigame_tsum.js');
} else {
  (window.AF_LOADED = window.AF_LOADED || []).push('minigame_tsum.js');
}
