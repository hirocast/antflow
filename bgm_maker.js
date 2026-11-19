// File: bgm_maker.js
'use strict';

/* ================= オリジナルBGM作成（ぴこぴこおんがくしつ） ================= */
(function () {
  const MY_BGM_KEY = 'antflow-my-bgms-v1';
  const ACTIVE_BGM_KEY = 'antflow-active-bgm-v1';
  const BGM_POST_CD_KEY = 'antflow-bgm-post-cd-v1';
  const BGM_REPORT_KEY = 'antflow-bgm-reported-v1';
  const POST_COOLDOWN_MS = 60 * 1000;
  const REPO_URL = 'https://github.com/hirocast/antflow';
  const ISSUES_API = 'https://api.github.com/repos/hirocast/antflow/issues?state=open&per_page=30';
  const NG_WORDS = [
    '死ね', 'しね', '殺す', 'ころす', 'バカ', 'ばか', 'アホ', 'あほ', 'クズ', 'くず',
    'キモ', 'きも', 'うざ', 'ウザ', 'ちん', 'まん', 'せっくす', 'セックス', 'エロ', 'えろ',
    'アダルト', '暴力', '薬物', '大麻', 'fuck', 'shit', 'bitch', 'porn', 'sex', 'nude'
  ];
  function validateBgmName(name) {
    const s = String(name || '');
    if (/https?:\/\/|www\.|\.[a-z]{2,4}(\/|$)|@/i.test(s)) return '曲名にURLや@は使えません';
    const norm = s.toLowerCase().replace(/[\s\u3000\u200B-\u200D\uFEFF]/g, '');
    for (let i = 0; i < NG_WORDS.length; i++) {
      if (norm.indexOf(NG_WORDS[i]) >= 0) return '曲名に使えない言葉が入っています';
    }
    return '';
  }
  function checkBgmPostLimit(token) {
    try {
      const d = JSON.parse(localStorage.getItem(BGM_POST_CD_KEY) || '{}');
      const left = Math.ceil(((d.at || 0) + POST_COOLDOWN_MS - Date.now()) / 1000);
      if (left > 0) return '連続投稿制限：あと ' + left + ' 秒まってね';
      if (d.token && d.token === token) return '同じBGMは連続で投稿できません';
    } catch (e) {}
    return '';
  }
  function recordBgmPost(token) {
    try { localStorage.setItem(BGM_POST_CD_KEY, JSON.stringify({ at: Date.now(), token })); } catch (e) {}
  }
  function loadBgmReported() {
    try { return new Set(JSON.parse(localStorage.getItem(BGM_REPORT_KEY) || '[]')); } catch (e) { return new Set(); }
  }
  function addBgmReported(key) {
    const set = loadBgmReported();
    set.add(String(key));
    try { localStorage.setItem(BGM_REPORT_KEY, JSON.stringify([...set].slice(-100))); } catch (e) {}
  }
  function countSongNotes(s) {
    let n = 0;
    for (const b of (s.bars || [])) {
      for (let i = 0; i < 16; i++) {
        if (b.notes[i] && b.notes[i].length) n += b.notes[i].length;
        if (b.kick[i]) n++;
        if (b.clap[i]) n++;
      }
    }
    return n;
  }
  const NOTES = [
    { label: 'ド↑', semi: 12, col: '#ff7aa6' },
    { label: 'シ', semi: 11, col: '#ff9a5c' },
    { label: 'ラ', semi: 9, col: '#ffc845' },
    { label: 'ソ', semi: 7, col: '#84d966' },
    { label: 'ファ', semi: 5, col: '#4ecdc4' },
    { label: 'ミ', semi: 4, col: '#69b4ff' },
    { label: 'レ', semi: 2, col: '#9b8aff' },
    { label: 'ド', semi: 0, col: '#d484ff' }
  ];
  const INSTS = [
    { id: 'mallet', label: '🎹 もっきん' },
    { id: 'chip', label: '🎵 ピコピコ' },
    { id: 'bell', label: '🔔 オルゴール' },
    { id: 'flute', label: '🎺 ほわほわ' }
  ];

  function emptyBar() {
    return {
      notes: Array.from({ length: 16 }, () => []),
      kick: new Array(16).fill(0),
      clap: new Array(16).fill(0)
    };
  }
  function cloneBar(b) {
    return {
      notes: b.notes.map(a => a.slice()),
      kick: b.kick.slice(),
      clap: b.clap.slice()
    };
  }
  function cloneSong(s) {
    return {
      name: String(s.name || 'わたしのBGM').slice(0, 20),
      bpm: clamp(Number(s.bpm) || 112, 70, 170),
      inst: INSTS.some(x => x.id === s.inst) ? s.inst : 'mallet',
      bars: (s.bars && s.bars.length ? s.bars : [emptyBar()]).slice(0, 4).map(cloneBar)
    };
  }

  let song = {
    name: 'おさんぽマーチ',
    bpm: 116,
    inst: 'mallet',
    bars: [emptyBar(), emptyBar()]
  };
  let curBar = 0;
  let playing = false;
  let playTimer = null;
  let playStep = 0;
  let paintVal = null;
  let built = false;

  // 初期プリセット曲
  const PRESETS = [
    {
      name: 'おさんぽマーチ',
      bpm: 116,
      inst: 'mallet',
      bars: [
        {
          notes: [[0], [], [4], [], [7], [], [4], [], [9], [], [7], [], [4], [], [2], []],
          kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
          clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
        },
        {
          notes: [[0], [], [4], [], [7], [], [12], [], [9], [], [7], [], [4], [], [0], []],
          kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0],
          clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0]
        }
      ]
    },
    {
      name: 'ピコピコたんけん',
      bpm: 132,
      inst: 'chip',
      bars: [
        {
          notes: [[0], [4], [7], [], [12], [], [7], [4], [5], [], [9], [], [7], [], [4], []],
          kick: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
          clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1]
        },
        {
          notes: [[2], [5], [9], [], [11], [], [9], [7], [4], [], [7], [], [12], [], [], []],
          kick: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
          clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0]
        }
      ]
    },
    {
      name: 'ほしぞらオルゴール',
      bpm: 96,
      inst: 'bell',
      bars: [
        {
          notes: [[12], [], [9], [], [7], [], [4], [], [5], [], [4], [], [2], [], [], []],
          kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
          clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
          notes: [[0], [], [4], [], [7], [], [12], [], [9], [], [7], [], [12], [], [], []],
          kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
          clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
      ]
    }
  ];
  song = cloneSong(PRESETS[0]);
  let presetIdx = 0;

  function loadMyBgms() {
    try { return JSON.parse(localStorage.getItem(MY_BGM_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveMyBgms(arr) {
    try { localStorage.setItem(MY_BGM_KEY, JSON.stringify(arr.slice(0, 16))); } catch (e) {}
  }

  function applyActiveBgm(s, on) {
    if (on && s) {
      const c = cloneSong(s);
      Sound.customBgm = c;
      Sound.useCustomBgm = true;
      try { localStorage.setItem(ACTIVE_BGM_KEY, JSON.stringify(c)); } catch (e) {}
    } else {
      Sound.useCustomBgm = false;
      try { localStorage.removeItem(ACTIVE_BGM_KEY); } catch (e) {}
    }
    Sound.step = 0;
    if (save.settings.bgm) {
      Sound.stopBgm();
      Sound.startBgm();
    }
    updateActiveBadge();
  }

  // 起動時に保存された自作BGMを復元
  try {
    const savedActive = localStorage.getItem(ACTIVE_BGM_KEY);
    if (savedActive) {
      const parsed = JSON.parse(savedActive);
      if (parsed && parsed.bars && parsed.bars.length) {
        Sound.customBgm = cloneSong(parsed);
        Sound.useCustomBgm = true;
        song = cloneSong(parsed);
      }
    }
  } catch (e) {}

  function encodeBgm(s) {
    const min = {
      n: s.name,
      b: s.bpm,
      i: s.inst,
      r: s.bars.map(bar => ({
        n: bar.notes,
        k: bar.kick.join(''),
        c: bar.clap.join('')
      }))
    };
    const json = JSON.stringify(min);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeBgm(tok) {
    try {
      let b64 = tok.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const min = JSON.parse(new TextDecoder().decode(bytes));
      if (!min || !Array.isArray(min.r) || !min.r.length) return null;
      return cloneSong({
        name: min.n || 'おともだちのBGM',
        bpm: min.b || 116,
        inst: min.i || 'mallet',
        bars: min.r.map(rb => ({
          notes: Array.from({ length: 16 }, (_, idx) => Array.isArray(rb.n && rb.n[idx]) ? rb.n[idx].filter(v => Number.isFinite(v)) : []),
          kick: Array.from({ length: 16 }, (_, idx) => (rb.k && rb.k[idx] === '1') ? 1 : 0),
          clap: Array.from({ length: 16 }, (_, idx) => (rb.c && rb.c[idx] === '1') ? 1 : 0)
        }))
      });
    } catch (e) {
      return null;
    }
  }

  function randomizeSong() {
    const penta = [0, 2, 4, 7, 9, 12];
    const bars = [];
    const barCount = song.bars.length;
    for (let b = 0; b < barCount; b++) {
      const bar = emptyBar();
      let prev = 2;
      for (let st = 0; st < 16; st++) {
        if (st % 4 === 0) bar.kick[st] = 1;
        if (st === 4 || st === 12) bar.clap[st] = 1;
        if (st % 2 === 0 && (st === 0 || Math.random() < 0.72)) {
          prev = clamp(prev + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 2), 0, penta.length - 1);
          bar.notes[st] = [penta[prev]];
        } else if (st % 2 === 1 && Math.random() < 0.18) {
          bar.notes[st] = [penta[clamp(prev + 1, 0, penta.length - 1)]];
        }
      }
      bars.push(bar);
    }
    song.bars = bars;
    song.name = 'おまかせ' + Math.floor(10 + Math.random() * 89);
    curBar = 0;
    syncUI();
    toast('🎲 メロディを作ったよ！');
  }

  function syncActiveIfUsed() {
    if (!Sound.useCustomBgm) return;
    const c = cloneSong(song);
    Sound.customBgm = c;
    try { localStorage.setItem(ACTIVE_BGM_KEY, JSON.stringify(c)); } catch (e) {}
    updateActiveBadge();
  }

  function updateActiveBadge() {
    const el = $('#bgmActiveBtn'), rst = $('#bgmResetBtn');
    if (el) {
      el.classList.add('mint');
      el.classList.remove('sec');
      el.textContent = Sound.useCustomBgm ? '✅ ゲームBGMに反映中（タップで更新）' : '🎧 この曲をゲームのBGMにする';
    }
    if (rst) rst.style.display = Sound.useCustomBgm ? 'inline-block' : 'none';
    const st = $('#bgmStatus');
    if (st) {
      st.textContent = Sound.useCustomBgm
        ? 'いまゲーム中で再生中：' + (Sound.customBgm ? Sound.customBgm.name : '') + '（編集すると自動で反映されます）'
        : 'いまはステージごとの標準BGMが流れています';
    }
  }

  function stopPreview() {
    playing = false;
    clearInterval(playTimer);
    playTimer = null;
    const pb = $('#bgmPlayBtn');
    if (pb) pb.textContent = '▶ さいせい';
    const cells = document.querySelectorAll('#bgmGrid .bgm-cell.play');
    for (let i = 0; i < cells.length; i++) cells[i].classList.remove('play');
  }

  function startPreview() {
    Sound.init();
    Sound.stopBgm();
    stopPreview();
    playing = true;
    playStep = 0;
    const pb = $('#bgmPlayBtn');
    if (pb) pb.textContent = '⏹ ていし';
    const tick = () => {
      if (!playing) return;
      const total = song.bars.length * 16;
      const idx = playStep % total;
      const bIdx = Math.floor(idx / 16), st = idx % 16;
      const bar = song.bars[bIdx];
      const notes = bar.notes[st];
      for (let i = 0; i < notes.length; i++) Sound.playCustomNote(song.inst, notes[i], 0, 0.22);
      if (bar.kick[st]) Sound.playCustomDrum(1, 0, notes.length ? notes[0] : 0);
      if (bar.clap[st]) Sound.playCustomDrum(2, 0);
      if (bIdx !== curBar) {
        curBar = bIdx;
        renderBarTabs();
        renderGrid();
      }
      const old = document.querySelectorAll('#bgmGrid .bgm-cell.play');
      for (let i = 0; i < old.length; i++) old[i].classList.remove('play');
      const cur = document.querySelectorAll('#bgmGrid .bgm-cell[data-st="' + st + '"]');
      for (let i = 0; i < cur.length; i++) cur[i].classList.add('play');
      playStep++;
    };
    tick();
    playTimer = setInterval(tick, Math.round(60000 / song.bpm / 4));
  }

  function restartPreviewIfPlaying() {
    if (playing) startPreview();
  }

  function renderGrid() {
    const grid = $('#bgmGrid');
    if (!grid) return;
    const bar = song.bars[curBar];
    let html = '';
    for (let r = 0; r < NOTES.length; r++) {
      const nt = NOTES[r];
      html += '<div class="bgm-lbl" style="color:' + nt.col + '">' + nt.label + '</div>';
      for (let st = 0; st < 16; st++) {
        const on = bar.notes[st].indexOf(nt.semi) >= 0;
        const beat = st % 4 === 0 ? ' beat' : '';
        const bg = on ? ' style="background:' + nt.col + ';border-color:#fff"' : '';
        html += '<button type="button" class="bgm-cell' + beat + (on ? ' on' : '') + '" data-kind="note" data-semi="' + nt.semi + '" data-st="' + st + '"' + bg + '></button>';
      }
    }
    // ドラム2行
    html += '<div class="bgm-lbl">🥁</div>';
    for (let st = 0; st < 16; st++) {
      const on = !!bar.kick[st];
      const beat = st % 4 === 0 ? ' beat' : '';
      html += '<button type="button" class="bgm-cell drum' + beat + (on ? ' on' : '') + '" data-kind="kick" data-st="' + st + '"></button>';
    }
    html += '<div class="bgm-lbl">👏</div>';
    for (let st = 0; st < 16; st++) {
      const on = !!bar.clap[st];
      const beat = st % 4 === 0 ? ' beat' : '';
      html += '<button type="button" class="bgm-cell clap' + beat + (on ? ' on' : '') + '" data-kind="clap" data-st="' + st + '"></button>';
    }
    grid.innerHTML = html;
  }

  function renderBarTabs() {
    const el = $('#bgmBars');
    if (!el) return;
    let html = '';
    for (let i = 0; i < song.bars.length; i++) {
      html += '<button type="button" class="bgm-bar' + (i === curBar ? ' on' : '') + '" data-b="' + i + '">' + (i + 1) + '小節</button>';
    }
    if (song.bars.length < 4) html += '<button type="button" class="bgm-bar add" id="bgmAddBar">＋追加</button>';
    if (song.bars.length > 1) html += '<button type="button" class="bgm-bar del" id="bgmDelBar">－削除</button>';
    el.innerHTML = html;
  }

  function renderSavedList() {
    const list = $('#bgmSavedList');
    if (!list) return;
    const arr = loadMyBgms();
    if (!arr.length) {
      list.innerHTML = '<p class="fine" style="margin:4px 0">まだ保存した曲はありません</p>';
      return;
    }
    list.innerHTML = arr.map((s, i) =>
      '<div class="bgm-item">' +
        '<b>' + String(s.name || '無題').replace(/[<>&"]/g, '') + '</b>' +
        '<small>BPM' + s.bpm + ' / ' + (s.bars ? s.bars.length : 1) + '小節</small>' +
        '<button type="button" class="bgm-mini" data-act="load" data-i="' + i + '">ひらく</button>' +
        '<button type="button" class="bgm-mini use" data-act="use" data-i="' + i + '">使う</button>' +
        '<button type="button" class="bgm-mini del" data-act="del" data-i="' + i + '">✕</button>' +
      '</div>'
    ).join('');
  }

  function syncUI() {
    const nm = $('#bgmName'), bpm = $('#bgmBpm'), bv = $('#bgmBpmVal'), inst = $('#bgmInst');
    if (nm) nm.value = song.name;
    if (bpm) bpm.value = song.bpm;
    if (bv) bv.textContent = song.bpm;
    if (inst) inst.value = song.inst;
    renderBarTabs();
    renderGrid();
    renderSavedList();
    updateActiveBadge();
  }

  function toggleCell(btn, forceVal) {
    if (!btn || !btn.dataset || !btn.dataset.kind) return false;
    const kind = btn.dataset.kind, st = +btn.dataset.st;
    const bar = song.bars[curBar];
    let nextOn = false;
    if (kind === 'note') {
      const semi = +btn.dataset.semi;
      const arr = bar.notes[st];
      const idx = arr.indexOf(semi);
      nextOn = forceVal == null ? idx < 0 : forceVal;
      if (nextOn && idx < 0) {
        arr.push(semi);
        Sound.init();
        Sound.playCustomNote(song.inst, semi, 0, 0.22);
      } else if (!nextOn && idx >= 0) {
        arr.splice(idx, 1);
      }
      const nt = NOTES.find(x => x.semi === semi);
      btn.classList.toggle('on', nextOn);
      btn.style.background = nextOn && nt ? nt.col : '';
      btn.style.borderColor = nextOn ? '#fff' : '';
    } else if (kind === 'kick') {
      nextOn = forceVal == null ? !bar.kick[st] : forceVal;
      bar.kick[st] = nextOn ? 1 : 0;
      if (nextOn) { Sound.init(); Sound.playCustomDrum(1, 0, 0); }
      btn.classList.toggle('on', nextOn);
    } else if (kind === 'clap') {
      nextOn = forceVal == null ? !bar.clap[st] : forceVal;
      bar.clap[st] = nextOn ? 1 : 0;
      if (nextOn) { Sound.init(); Sound.playCustomDrum(2, 0); }
      btn.classList.toggle('on', nextOn);
    }
    return nextOn;
  }

  function buildBgmMakerUI() {
    if (built) return;
    built = true;
    const st = document.createElement('style');
    st.textContent = `
#ov-bgm .card{width:min(96vw,460px);padding:14px}
.bgm-top{display:flex;gap:6px;margin-bottom:8px;align-items:center}
.bgm-top input{flex:1;min-width:0;height:36px;border-radius:12px;border:2px solid #ffd3e2;padding:0 10px;font:700 13px var(--rf);color:var(--ink)}
.bgm-top select{height:36px;border-radius:12px;border:2px solid #ffd3e2;background:#fff;padding:0 6px;font:700 12px var(--rf);color:var(--ink)}
.bgm-bpm{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;margin-bottom:8px}
.bgm-bpm input{flex:1}
.bgm-bars{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}
.bgm-bar{border:none;border-radius:10px;padding:5px 10px;background:#fff1d6;color:var(--ink);font:800 11px var(--rf);cursor:pointer}
.bgm-bar.on{background:var(--pink);color:#fff}
.bgm-bar.add{background:#dff7ec;color:#1b7a52}
.bgm-bar.del{background:#ffe5ea;color:#c03858}
.bgm-grid{display:grid;grid-template-columns:28px repeat(16,1fr);gap:2px;background:#f8ecf2;padding:5px;border-radius:14px;border:2px solid #ffd3e2;touch-action:none;user-select:none}
.bgm-lbl{font:900 10px/1 var(--rf);display:flex;align-items:center;justify-content:center}
.bgm-cell{height:23px;border:1px solid #ead8e2;border-radius:5px;background:#fff;padding:0;cursor:pointer}
.bgm-cell.beat{background:#fff7fb}
.bgm-cell.drum.on{background:#8b6f99;border-color:#fff}
.bgm-cell.clap.on{background:#ff9a3c;border-color:#fff}
.bgm-cell.play{outline:2px solid #ff5a7a;outline-offset:-1px}
.bgm-btns{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.bgm-btns button{height:36px;border:none;border-radius:12px;background:#fff1d6;color:var(--ink);font:800 11px var(--rf);box-shadow:0 3px 0 #e6cc9c;cursor:pointer}
.bgm-btns button.go{background:linear-gradient(180deg,#ff9fbf,#ff7aa6);color:#fff;box-shadow:0 3px 0 var(--pinkd)}
.bgm-btns button:active{transform:translateY(2px);box-shadow:none}
.bgm-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.bgm-row2 .big{margin-top:0;height:44px;font-size:14px}
.bgm-saved{margin-top:10px;max-height:110px;overflow:auto;text-align:left}
.bgm-item{display:flex;align-items:center;gap:6px;padding:5px 8px;background:#fff7fb;border-radius:10px;border:1px solid #ffd3e2;margin-bottom:4px;font-size:12px}
.bgm-item b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bgm-item small{opacity:.65;font-size:10px}
.bgm-mini{border:none;border-radius:8px;padding:4px 8px;background:#fff1d6;color:var(--ink);font:800 11px var(--rf);cursor:pointer}
.bgm-mini.use{background:var(--mint);color:#fff}
.bgm-mini.del{background:#ffe3e8;color:#c03858}
#ov-bgm-gal .card{width:min(96vw,460px);padding:14px}
.bgm-gal{max-height:46vh;overflow:auto;text-align:left;margin:6px 0}
.bgm-gcard{position:relative;display:flex;align-items:center;gap:6px;padding:8px 10px;background:#fff;border:2px solid #ffd3e2;border-radius:14px;margin-bottom:6px}
.bgm-gcard .info{flex:1;min-width:0}
.bgm-gcard .info b{display:block;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bgm-gcard .info small{display:block;font-size:10px;color:#8a6a7a}
.bgm-gcard .rep{border:none;background:none;font-size:13px;padding:2px 4px;cursor:pointer;opacity:.7}
`;
    document.head.appendChild(st);

    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.id = 'ov-bgm';
    ov.innerHTML =
      '<div class="card">' +
        '<h2>🎵 BGMをつくる</h2>' +
        '<div class="bgm-top">' +
          '<input id="bgmName" maxlength="20" placeholder="曲のなまえ">' +
          '<select id="bgmInst">' + INSTS.map(x => '<option value="' + x.id + '">' + x.label + '</option>').join('') + '</select>' +
        '</div>' +
        '<div class="bgm-bpm"><span>はやさ (BPM)</span><input id="bgmBpm" type="range" min="70" max="170" step="2"><b id="bgmBpmVal">116</b></div>' +
        '<div class="bgm-bars" id="bgmBars"></div>' +
        '<div class="bgm-grid" id="bgmGrid"></div>' +
        '<div class="bgm-btns">' +
          '<button type="button" class="go" id="bgmPlayBtn">▶ さいせい</button>' +
          '<button type="button" id="bgmRandBtn">🎲 おまかせ</button>' +
          '<button type="button" id="bgmPresetBtn">✨ サンプル</button>' +
          '<button type="button" id="bgmClearBtn">🗑️ クリア</button>' +
        '</div>' +
        '<button type="button" class="big mint" id="bgmActiveBtn" style="margin-top:8px;height:46px;font-size:15px">🎧 この曲をゲームのBGMにする</button>' +
        '<p class="fine" id="bgmStatus" style="margin:4px 0 0"></p>' +
        '<button type="button" class="link" id="bgmResetBtn" style="display:none;margin-top:4px">🔄 標準のBGMにもどす</button>' +
        '<div class="bgm-row2">' +
          '<button type="button" class="big sec" id="bgmSaveBtn">💾 ほぞん</button>' +
          '<button type="button" class="big sec" id="bgmShareBtn">🔗 URLコピー</button>' +
        '</div>' +
        '<div class="bgm-row2">' +
          '<button type="button" class="big sec" id="bgmPostBtn">📮 みんなに投稿</button>' +
          '<button type="button" class="big sec" id="bgmGalBtn">🎶 みんなのBGM</button>' +
        '</div>' +
        '<div class="bgm-saved" id="bgmSavedList"></div>' +
        '<button type="button" class="big sec" id="bgmCloseBtn" style="margin-top:8px">とじる</button>' +
      '</div>';
    document.body.appendChild(ov);

    const pov = document.createElement('div');
    pov.className = 'ov';
    pov.id = 'ov-bgm-posthelp';
    pov.innerHTML =
      '<div class="card">' +
      '<h2>📮 BGMを投稿する</h2>' +
      '<p class="fine">※ 投稿には GitHub アカウントが必要です（聴く・使う・URLシェアは不要）</p>' +
      '<div class="poststeps">' +
      '<div><b>①</b> 下のボタンで投稿ページが開きます</div>' +
      '<div><b>②</b> 内容は自動入力されているので、そのまま緑色の <b>「Create」</b>（または「Submit new issue」）ボタンを押すだけ！</div>' +
      '<div><b>③</b> <b>「🟢 Open」</b> の画面が出たら投稿完了！このアプリに戻って「🎶 みんなのBGM」を見てね</div>' +
      '</div>' +
      '<button class="big" id="bBgmPostGo">📮 投稿ページをひらく</button>' +
      '<button class="big sec" id="bBgmPostBack">もどる</button>' +
      '</div>';
    document.body.appendChild(pov);

    const gov = document.createElement('div');
    gov.className = 'ov';
    gov.id = 'ov-bgm-gal';
    gov.innerHTML =
      '<div class="card">' +
      '<h2>🎶 みんなのBGM</h2>' +
      '<div class="bgm-gal" id="bgmGalList"></div>' +
      '<button class="big" id="bBgmGalBack">🎵 つくるにもどる</button>' +
      '<button class="big sec" id="bBgmGalClose">ホームへ</button>' +
      '</div>';
    document.body.appendChild(gov);

    const grid = $('#bgmGrid');
    grid.addEventListener('pointerdown', e => {
      const btn = e.target.closest('.bgm-cell');
      if (!btn) return;
      e.preventDefault();
      paintVal = toggleCell(btn, null);
      syncActiveIfUsed();
    });
    grid.addEventListener('pointermove', e => {
      if (paintVal === null) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const btn = el && el.closest ? el.closest('.bgm-cell') : null;
      if (btn) { toggleCell(btn, paintVal); syncActiveIfUsed(); }
    });
    window.addEventListener('pointerup', () => { paintVal = null; });
    window.addEventListener('pointercancel', () => { paintVal = null; });

    $('#bgmName').addEventListener('input', e => { song.name = e.target.value.slice(0, 20); syncActiveIfUsed(); });
    $('#bgmInst').addEventListener('change', e => { song.inst = e.target.value; syncActiveIfUsed(); });
    $('#bgmBpm').addEventListener('input', e => {
      song.bpm = +e.target.value;
      $('#bgmBpmVal').textContent = song.bpm;
      syncActiveIfUsed();
      restartPreviewIfPlaying();
    });
    $('#bgmBars').addEventListener('click', e => {
      const b = e.target.closest('.bgm-bar');
      if (!b) return;
      if (b.id === 'bgmAddBar') {
        if (song.bars.length < 4) {
          song.bars.push(cloneBar(song.bars[curBar]));
          curBar = song.bars.length - 1;
          renderBarTabs(); renderGrid(); syncActiveIfUsed();
        }
        return;
      }
      if (b.id === 'bgmDelBar') {
        if (song.bars.length > 1) {
          song.bars.splice(curBar, 1);
          curBar = Math.min(curBar, song.bars.length - 1);
          renderBarTabs(); renderGrid(); syncActiveIfUsed();
        }
        return;
      }
      if (b.dataset.b != null) {
        curBar = +b.dataset.b;
        renderBarTabs(); renderGrid();
      }
    });

    $('#bgmPlayBtn').addEventListener('click', () => {
      if (playing) stopPreview();
      else startPreview();
    });
    $('#bgmRandBtn').addEventListener('click', () => {
      Sound.init();
      randomizeSong();
      syncActiveIfUsed();
      restartPreviewIfPlaying();
    });
    $('#bgmPresetBtn').addEventListener('click', () => {
      Sound.init();
      presetIdx = (presetIdx + 1) % PRESETS.length;
      song = cloneSong(PRESETS[presetIdx]);
      curBar = 0;
      syncUI();
      syncActiveIfUsed();
      restartPreviewIfPlaying();
      toast('✨「' + song.name + '」を読み込んだよ');
    });
    $('#bgmClearBtn').addEventListener('click', () => {
      song.bars[curBar] = emptyBar();
      renderGrid();
      syncActiveIfUsed();
    });
    $('#bgmActiveBtn').addEventListener('click', () => {
      Sound.init();
      stopPreview();
      if (!song.name.trim()) song.name = 'わたしのBGM';
      applyActiveBgm(song, true);
      toast('🎧「' + song.name + '」をゲームのBGMに反映したよ！');
    });
    $('#bgmResetBtn').addEventListener('click', () => {
      Sound.init();
      stopPreview();
      applyActiveBgm(null, false);
      toast('🔄 標準BGMにもどしたよ');
    });
    $('#bgmSaveBtn').addEventListener('click', () => {
      if (!song.name.trim()) song.name = 'わたしのBGM';
      const arr = loadMyBgms();
      const idx = arr.findIndex(x => x.name === song.name);
      const copy = cloneSong(song);
      if (idx >= 0) arr[idx] = copy;
      else arr.unshift(copy);
      saveMyBgms(arr);
      renderSavedList();
      toast('💾「' + song.name + '」をほぞんしたよ！');
    });
    $('#bgmShareBtn').addEventListener('click', () => {
      const url = location.origin + location.pathname + '?bgm=' + encodeBgm(song);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => toast('🔗 BGMのURLをコピーしたよ！'), () => prompt('このURLをコピーしてね', url));
      } else {
        prompt('このURLをコピーしてね', url);
      }
    });
    $('#bgmSavedList').addEventListener('click', e => {
      const btn = e.target.closest('.bgm-mini');
      if (!btn) return;
      const i = +btn.dataset.i, act = btn.dataset.act;
      const arr = loadMyBgms();
      if (!arr[i]) return;
      if (act === 'load') {
        song = cloneSong(arr[i]); curBar = 0; syncUI();
        toast('🎵「' + song.name + '」をひらいたよ');
      } else if (act === 'use') {
        Sound.init(); stopPreview();
        song = cloneSong(arr[i]); curBar = 0; syncUI();
        applyActiveBgm(song, true);
        toast('🎧「' + song.name + '」をゲームのBGMにしたよ！');
      } else if (act === 'del') {
        arr.splice(i, 1); saveMyBgms(arr); renderSavedList();
      }
    });
    let pendingBgmPost = null;
    $('#bgmPostBtn').addEventListener('click', () => {
      Sound.tap();
      if (countSongNotes(song) < 4) { toast('音やリズムを4つ以上おいてね！'); return; }
      const name = ($('#bgmName').value || '').trim() || 'わたしのBGM';
      const ng = validateBgmName(name);
      if (ng) { toast(ng); return; }
      song.name = name;
      const tok = encodeBgm(song);
      const cd = checkBgmPostLimit(tok);
      if (cd) { toast(cd); return; }
      const arr = loadMyBgms();
      if (!arr.some(x => x.name === name)) { arr.unshift(cloneSong(song)); saveMyBgms(arr); renderSavedList(); }
      const url = location.origin + location.pathname + '?bgm=' + tok;
      const title = '[BGM投稿] ' + name + ' (BPM' + song.bpm + ')';
      const body =
        '### オリジナルBGM投稿\n' +
        '- 曲名: ' + name + '\n' +
        '- BPM: ' + song.bpm + ' / ' + song.bars.length + '小節\n' +
        '- 試聴・プレイURL: ' + url + '\n\n' +
        '（このまま下の緑色の「Create」または「Submit new issue」ボタンを押すと投稿完了！ゲーム内の「🎶 みんなのBGM」に表示されます）';
      pendingBgmPost = { tok, issueUrl: REPO_URL + '/issues/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body) };
      showOv('bgm-posthelp');
    });
    $('#bBgmPostGo').addEventListener('click', () => {
      Sound.tap();
      if (!pendingBgmPost) { showOv('bgm'); return; }
      recordBgmPost(pendingBgmPost.tok);
      window.open(pendingBgmPost.issueUrl, '_blank', 'noopener');
      pendingBgmPost = null;
      showOv('bgm');
      toast('投稿ページを開いたよ！緑の「Create」を押してね');
    });
    $('#bBgmPostBack').addEventListener('click', () => { Sound.tap(); showOv('bgm'); });

    let galTimer = null;
    function stopGalPreview() {
      clearInterval(galTimer);
      galTimer = null;
      document.querySelectorAll('#bgmGalList .bgm-mini.play').forEach(b => { b.textContent = '▶'; b.classList.remove('play'); });
    }
    async function openBgmGallery() {
      stopPreview();
      stopGalPreview();
      showOv('bgm-gal');
      const box = $('#bgmGalList');
      box.innerHTML = '<p class="fine">読み込み中…</p>';
      const reported = loadBgmReported();
      try {
        const res = await fetch(ISSUES_API);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const issues = await res.json();
        box.innerHTML = '';
        let cnt = 0;
        for (const iss of issues) {
          const m = (iss.body || '').match(/[?&]bgm=([A-Za-z0-9_-]+)/);
          if (!m) continue;
          const id = 'gh_bgm_' + iss.number;
          if (reported.has(id) || reported.has(m[1])) continue;
          const s = decodeBgm(m[1]);
          if (!s || validateBgmName(s.name)) continue;
          const author = iss.user && iss.user.login ? '@' + iss.user.login : '投稿BGM';
          const instInfo = INSTS.find(x => x.id === s.inst) || INSTS[0];
          const card = document.createElement('div');
          card.className = 'bgm-gcard';
          card.innerHTML =
            '<div class="info"><b></b><small></small></div>' +
            '<button type="button" class="bgm-mini">▶</button>' +
            '<button type="button" class="bgm-mini use">使う</button>' +
            '<button type="button" class="bgm-mini">ひらく</button>' +
            '<button type="button" class="rep" title="不適切なBGMを非表示・通報">⚠️</button>';
          card.querySelector('b').textContent = s.name;
          card.querySelector('small').textContent = instInfo.label + ' · BPM' + s.bpm + ' · ' + s.bars.length + '小節 · ' + author;
          const [pBtn, uBtn, lBtn] = card.querySelectorAll('.bgm-mini');
          pBtn.addEventListener('click', () => {
            const was = pBtn.classList.contains('play');
            stopGalPreview();
            if (was) return;
            Sound.init(); Sound.stopBgm();
            pBtn.textContent = '⏹'; pBtn.classList.add('play');
            let st = 0;
            const total = s.bars.length * 16;
            const stepFn = () => {
              const idx = st % total, b = s.bars[Math.floor(idx / 16)], k = idx % 16;
              for (const n of b.notes[k]) Sound.playCustomNote(s.inst, n, 0, 0.22);
              if (b.kick[k]) Sound.playCustomDrum(1, 0, b.notes[k].length ? b.notes[k][0] : 0);
              if (b.clap[k]) Sound.playCustomDrum(2, 0);
              st++;
            };
            stepFn();
            galTimer = setInterval(stepFn, Math.round(60000 / s.bpm / 4));
          });
          uBtn.addEventListener('click', () => {
            Sound.init(); stopGalPreview();
            song = cloneSong(s); curBar = 0;
            applyActiveBgm(song, true);
            toast('🎧「' + song.name + '」をゲームのBGMにしたよ！');
          });
          lBtn.addEventListener('click', () => {
            Sound.tap(); stopGalPreview();
            song = cloneSong(s); curBar = 0; syncUI();
            showOv('bgm');
            toast('🎵「' + song.name + '」をひらいたよ');
          });
          card.querySelector('.rep').addEventListener('click', () => {
            if (!confirm('「' + s.name + '」を不適切なBGMとして一覧から非表示にしますか？')) return;
            addBgmReported(id); addBgmReported(m[1]);
            card.remove();
            toast('一覧から非表示にしました');
          });
          box.appendChild(card);
          cnt++;
        }
        if (!cnt) box.innerHTML = '<p class="fine">表示できる投稿BGMがありません。最初の1曲を投稿してみよう！</p>';
      } catch (e) {
        box.innerHTML = '<p class="fine">投稿一覧を読み込めませんでした（オフラインまたはアクセス集中）</p>';
      }
    }

    $('#bgmGalBtn').addEventListener('click', () => { Sound.tap(); openBgmGallery(); });
    $('#bBgmGalBack').addEventListener('click', () => { Sound.tap(); stopGalPreview(); openBgmMaker(); });
    $('#bBgmGalClose').addEventListener('click', () => {
      Sound.tap(); stopGalPreview();
      if (save.settings.bgm) Sound.startBgm();
      showOv('title');
    });
    $('#bgmCloseBtn').addEventListener('click', () => {
      stopPreview();
      if (save.settings.bgm) Sound.startBgm();
      showOv('title');
    });
  }

  function openBgmMaker() {
    buildBgmMakerUI();
    syncUI();
    showOv('bgm');
  }
  window.AF_openBgmMaker = openBgmMaker;

  // ホーム画面に「🎵 BGM」ボタンを追加
  const mrow = document.querySelector('.mrow');
  if (mrow) {
    const btn = document.createElement('button');
    btn.id = 'bMBgm';
    btn.innerHTML = '<i>🎵</i>BGM';
    btn.addEventListener('click', () => { Sound.tap(); openBgmMaker(); });
    mrow.appendChild(btn);
  }
  // 設定画面にも「🎵 自作BGMをつくる・えらぶ」ボタンを追加
  const setA2hs = $('#bSetA2hs');
  if (setA2hs) {
    setA2hs.insertAdjacentHTML('beforebegin', '<button class="big sec" id="bSetBgmMaker">🎵 自作BGMをつくる・えらぶ</button>');
    const sb = $('#bSetBgmMaker');
    if (sb) sb.addEventListener('click', () => { Sound.tap(); openBgmMaker(); });
  }

  // URL に ?bgm=... があれば読み込む
  const bgmParam = new URLSearchParams(location.search).get('bgm');
  if (bgmParam) {
    const shared = decodeBgm(bgmParam);
    if (shared) {
      song = shared;
      setTimeout(() => {
        openBgmMaker();
        toast('🎵 おともだちのBGMを読み込んだよ！');
      }, 60);
    }
  }
})();

AF_LOADED.push('bgm_maker.js');
