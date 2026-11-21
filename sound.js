// File: sound.js
'use strict';

/* ================= サウンド（Web Audio合成。やわらかい木琴系＋短い残響） ================= */
const Sound = {
  ctx: null, nb: null, bgmTimer: null, lastPop: 0, popTimes: [], lastThump: 0,
  deg: 2, dir: 1, mel: 4, step: 0, walkG: null, walkV: 0,
  PENTA: [0, 2, 4, 7, 9, 12, 14],
  // MUS_LP：BGMの高音カットの周波数（大きいほど明るく、小さいほど丸い音）
  MUS_LP: 5600,
  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const c = this.ctx = new AC();
        this.master = c.createGain(); this.master.gain.value = 0.88;
        const comp = c.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3.2; comp.attack.value = 0.005; comp.release.value = 0.22;
        this.master.connect(comp); comp.connect(c.destination);
        // 温かく奥行きのあるホール残響（プリディレイ＋高域減衰付き。モバイルでは軽量長さに自動調整）
        const liteAudio = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        this.verb = c.createConvolver(); this.verb.buffer = this.impulse(liteAudio ? 0.85 : 2.1, 2.8);
        const wet = c.createGain(); wet.gain.value = 0.22;
        this.verb.connect(wet); wet.connect(this.master);
        // 効果音：高音域を丸める
        this.sfx = c.createGain();
        this.sfxF = c.createBiquadFilter(); this.sfxF.type = 'lowpass'; this.sfxF.frequency.value = 4500; this.sfxF.Q.value = 0.4;
        this.sfx.connect(this.sfxF); this.sfxF.connect(this.master); this.sfxF.connect(this.verb);
        // BGM：音量 → 一時的に下げる用（ダッキング） → 高音カット＋ステレオバス（L/R/Wide）
        this.mus = c.createGain();
        this.musDuck = c.createGain(); this.musDuck.gain.value = 1;
        this.musF = c.createBiquadFilter(); this.musF.type = 'lowpass'; this.musF.frequency.value = this.MUS_LP; this.musF.Q.value = 0.55;
        this.mus.connect(this.musDuck); this.musDuck.connect(this.musF); this.musF.connect(this.master);
        const mwet = c.createGain(); mwet.gain.value = 0.62;
        this.musF.connect(mwet); mwet.connect(this.verb);
        if (typeof c.createStereoPanner === 'function') {
          this.musL = c.createStereoPanner(); this.musL.pan.value = -0.38; this.musL.connect(this.mus);
          this.musR = c.createStereoPanner(); this.musR.pan.value = 0.38; this.musR.connect(this.mus);
        } else {
          this.musL = this.mus;
          this.musR = this.mus;
        }
        // パッド・ベル用の広がりバス（リバーブ成分をさらに豊かにブレンド）
        this.musW = c.createGain(); this.musW.gain.value = 1;
        this.musW.connect(this.mus);
        const wwet = c.createGain(); wwet.gain.value = 0.36;
        this.musW.connect(wwet); wwet.connect(this.verb);
        this.applyVol(true);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (save.settings.bgm) this.startBgm();
    } catch (e) { /* 音声非対応 */ }
  },
  // 設定の音量（0〜100）を、耳で感じる大きさに近い曲線で反映する
  applyVol(now) {
    if (!this.ctx) return;
    const cv = (v, d) => { const n = Number(v); return Math.pow(clamp(Number.isFinite(n) ? n : d, 0, 100) / 100, 2); };
    const t = this.ctx.currentTime, a = cv(save.settings.sfxVol, 90), b = 0.58 * cv(save.settings.bgmVol, 70);
    if (now) { this.sfx.gain.value = a; this.mus.gain.value = b; }
    else { this.sfx.gain.setTargetAtTime(a, t, 0.05); this.mus.gain.setTargetAtTime(b, t, 0.05); }
  },
  impulse(sec, decay) {
    const c = this.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    const pre = Math.floor(c.sampleRate * 0.016);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0, lp2 = 0;
      for (let i = pre; i < n; i++) {
        const k = (i - pre) / (n - pre);
        const damp = 0.42 - k * 0.24;
        lp += ((Math.random() * 2 - 1) - lp) * damp;
        lp2 += (lp - lp2) * 0.65;
        const er = i - pre < c.sampleRate * 0.045 && ((i - pre) % Math.floor(c.sampleRate * (ch ? 0.011 : 0.008)) < 24) ? 1.35 : 1;
        d[i] = lp2 * Math.pow(1 - k, decay) * er;
      }
    }
    return b;
  },
  noiseBuf() {
    if (!this.nb) {
      const c = this.ctx;
      this.nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.nb;
  },
  // フィルタ済みノイズバッファをキャッシュ（16分音符ごとのリアルタイム BiquadFilterNode 生成を省く）
  filteredNoiseBuf(freq, type, q) {
    const c = this.ctx;
    if (!c) return null;
    const tp = type || 'bandpass';
    if (tp !== 'bandpass' && tp !== 'lowpass' && tp !== 'highpass') return null;
    const fq = Math.max(40, Math.min(c.sampleRate * 0.45, Math.round((freq || 1500) / 50) * 50));
    const qv = Math.max(0.05, Math.round((q || 0.8) * 20) / 20);
    if (!this.fnb) this.fnb = new Map();
    const key = tp + '|' + fq + '|' + qv;
    let buf = this.fnb.get(key);
    if (buf) return buf;
    if (this.fnb.size >= 64) return null;
    const src = this.noiseBuf().getChannelData(0);
    const len = c.sampleRate;
    buf = c.createBuffer(1, len, c.sampleRate);
    const out = buf.getChannelData(0);
    const w0 = 2 * Math.PI * fq / c.sampleRate, cos = Math.cos(w0), sin = Math.sin(w0);
    let b0, b1, b2, a0, a1, a2;
    if (tp === 'bandpass') {
      const alpha = sin / (2 * qv);
      b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
    } else {
      const alpha = sin / (2 * Math.pow(10, qv / 20));
      if (tp === 'lowpass') {
        b0 = (1 - cos) * 0.5; b1 = 1 - cos; b2 = b0;
      } else {
        b0 = (1 + cos) * 0.5; b1 = -(1 + cos); b2 = b0;
      }
      a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
    }
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    // 先頭を少しウォームアップしてループ継ぎ目の過渡応答を防ぐ
    for (let i = len - 256; i < len; i++) {
      const x = src[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
    }
    for (let i = 0; i < len; i++) {
      const x = src[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      out[i] = y;
    }
    this.fnb.set(key, buf);
    return buf;
  },
  ok() { return this.ctx && save.settings.sfx; },
  vary() { return 1 + (Math.random() - 0.5) * 0.03; },
  tone(freq, dur, o) {
    o = o || {};
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + (o.when || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * o.glide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol == null ? 0.2 : o.vol), t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || this.sfx);
    osc.start(t); osc.stop(t + dur + 0.03);
  },
  noise(when, dur, vol, freq, type, q) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + when, s = c.createBufferSource(), g = c.createGain();
    const fb = this.filteredNoiseBuf(freq, type, q);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (fb) {
      s.buffer = fb; s.loop = true;
      s.connect(g); g.connect(this.sfx);
      s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.05);
    } else {
      const f = c.createBiquadFilter();
      s.buffer = this.noiseBuf(); s.loop = true;
      f.type = type || 'bandpass'; f.frequency.value = freq || 1500; f.Q.value = q || 0.8;
      s.connect(f); f.connect(g); g.connect(this.sfx);
      s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    }
  },
  // 木琴のような、角の丸い打楽器音
  mallet(f, when, vol, dest) {
    this.tone(f, 0.42, { vol, when, attack: 0.004, dest });
    this.tone(f * 2, 0.16, { vol: vol * 0.18, when, attack: 0.003, dest, type: 'triangle' });
    this.tone(f * 4, 0.07, { vol: vol * 0.1, when, attack: 0.002, dest });
  },
  brass(freq, when, dur, vol) {
    const c = this.ctx, t = c.currentTime + when, o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o1.type = 'sawtooth'; o2.type = 'triangle'; o1.frequency.value = freq; o2.frequency.value = freq * 1.003;
    f.type = 'lowpass'; f.Q.value = 0.7;
    f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(1600, t + 0.08); f.frequency.exponentialRampToValueAtTime(800, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  },
  bell(freq, when, vol, dur) {
    this.tone(freq, dur, { vol, when, attack: 0.003 });
    this.tone(freq * 2.76, dur * 0.3, { vol: vol * 0.15, when });
  },
  tap() {
    if (!this.ok()) return;
    this.tone(392 * this.vary(), 0.12, { vol: 0.16, glide: 0.8, attack: 0.004 });
    this.tone(784, 0.05, { vol: 0.03, type: 'triangle' });
    this.noise(0, 0.025, 0.04, 1400, 'bandpass', 1);
  },
  land() {
    if (!this.ok()) return;
    this.tone(196 * this.vary(), 0.1, { vol: 0.12, glide: 0.75, attack: 0.003 });
    this.noise(0, 0.04, 0.03, 700, 'bandpass', 1);
  },
  boxOut() { if (this.ok()) this.tone(330 * this.vary(), 0.1, { vol: 0.07, glide: 1.5, attack: 0.01 }); },
  // キャンディを拾う音：5音の音階を上下に行き来し、たくさん重なるほど1音を小さくする
  pop() {
    if (!this.ok()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastPop < 0.05) return;
    this.lastPop = now;
    this.popTimes = this.popTimes.filter(t => now - t < 1);
    this.popTimes.push(now);
    const vol = 0.15 / Math.sqrt(Math.max(1, this.popTimes.length / 3));
    if (Math.random() < 0.18) this.dir = -this.dir;
    this.deg += this.dir;
    if (this.deg > 6) { this.deg = 5; this.dir = -1; } else if (this.deg < 0) { this.deg = 1; this.dir = 1; }
    this.mallet(261.63 * Math.pow(2, this.PENTA[this.deg] / 12) * this.vary(), 0, vol);
    this.noise(0, 0.03, vol * 0.3, 2200, 'bandpass', 1.2);
  },
  thump() {
    if (!this.ok()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastThump < 0.1) return;
    this.lastThump = now;
    this.tone(150 * this.vary(), 0.08, { vol: 0.06, glide: 0.7, attack: 0.004 });
  },
  squeak() {
    if (!this.ok()) return;
    this.tone(587 * this.vary(), 0.08, { vol: 0.045, glide: 1.25, attack: 0.01 });
    this.tone(698, 0.09, { vol: 0.04, glide: 1.2, attack: 0.01, when: 0.08 });
  },
  deny() {
    if (!this.ok()) return;
    this.tone(196, 0.09, { type: 'triangle', vol: 0.07 });
    this.tone(165, 0.12, { type: 'triangle', vol: 0.07, when: 0.1 });
  },
  jam() { if (this.ok()) [329.63, 261.63, 220].forEach((f, i) => this.mallet(f, i * 0.18, 0.13)); },
  undo() {
    if (!this.ok()) return;
    this.tone(440, 0.12, { vol: 0.08, glide: 0.7 });
    this.noise(0, 0.12, 0.025, 900, 'bandpass', 0.7);
  },
  fanfare() {
    if (!this.ok()) return;
    this.tone(110, 0.35, { glide: 0.5, vol: 0.35 });
    [0, 0.12, 0.24].forEach(w => this.brass(392, w, 0.1, 0.07));
    [261.63, 329.63, 392, 523.25].forEach(f => this.brass(f, 0.38, 1.4, 0.055));
    this.tone(110, 0.4, { glide: 0.5, vol: 0.4, when: 0.38 });
    this.noise(0.38, 1.2, 0.035, 5000, 'bandpass', 0.5);
    [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5].forEach((f, i) => this.mallet(f, 0.5 + i * 0.06, 0.06));
    [1046.5, 1318.5, 1568].forEach(f => this.bell(f, 1.05, 0.035, 1.6));
  },
  boom() {
    if (!this.ok()) return;
    this.tone(70, 0.4, { glide: 0.5, vol: 0.28 });
    this.noise(0, 0.5, 0.06, 500, 'lowpass', 0.7);
    for (let i = 0; i < 10; i++) this.noise(0.15 + Math.random() * 0.6, 0.03, 0.02 + Math.random() * 0.02, 2000 + Math.random() * 1500, 'bandpass', 2);
  },
  starPing(i) { if (this.ok()) this.mallet(523.25 * Math.pow(2, [0, 2, 4, 7, 9][i % 5] / 12), 0, 0.1); },
  whoosh() {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf();
    f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(1800, t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    s.connect(f); f.connect(g); g.connect(this.sfx);
    s.start(t); s.stop(t + 0.45);
  },
  albumIn() { if (this.ok()) [523.25, 659.25, 783.99].forEach((f, i) => this.mallet(f, i * 0.08, 0.09)); },
  // アリの足音：歩いている間だけ小さなサラサラ音を鳴らし、止まったらノードをスリープさせる
  initWalk() {
    if (!this.ctx || this.walkG) return;
    const c = this.ctx, s = c.createBufferSource(), am = c.createGain(), g = c.createGain();
    const l1 = c.createOscillator(), l2 = c.createOscillator(), g1 = c.createGain(), g2 = c.createGain();
    const fb = this.filteredNoiseBuf(1800, 'bandpass', 0.7);
    s.buffer = fb || this.noiseBuf(); s.loop = true;
    am.gain.value = 0.55;
    l1.frequency.value = 9; g1.gain.value = 0.25; l1.connect(g1); g1.connect(am.gain);
    l2.frequency.value = 13.3; g2.gain.value = 0.2; l2.connect(g2); g2.connect(am.gain);
    g.gain.value = 0;
    if (fb) {
      s.connect(am);
    } else {
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
      s.connect(f); f.connect(am);
    }
    am.connect(g); g.connect(this.sfx);
    s.start(); l1.start(); l2.start();
    this.walkG = g;
    this.walkNodes = [s, l1, l2, g];
  },
  stopWalk() {
    if (this.walkTimer) { clearTimeout(this.walkTimer); this.walkTimer = null; }
    if (!this.walkNodes) return;
    const [s, l1, l2, g] = this.walkNodes;
    try { s.stop(); l1.stop(); l2.stop(); } catch (e) { /* ignore */ }
    try { g.disconnect(); } catch (e) { /* ignore */ }
    this.walkNodes = null;
    this.walkG = null;
    this.walkV = 0;
  },
  walk(n) {
    if (!this.ctx) return;
    const v = save.settings.sfx && save.settings.steps && n > 0 ? Math.min(0.03, 0.005 * Math.sqrt(n)) : 0;
    if (v > 0) {
      if (this.walkTimer) { clearTimeout(this.walkTimer); this.walkTimer = null; }
      if (!this.walkG) this.initWalk();
      if (!this.walkG || Math.abs(v - this.walkV) < 0.0015) return;
      this.walkV = v;
      this.walkG.gain.setTargetAtTime(v, this.ctx.currentTime, 0.25);
    } else if (this.walkG) {
      if (this.walkV > 0) {
        this.walkV = 0;
        this.walkG.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      }
      if (!this.walkTimer) this.walkTimer = setTimeout(() => { this.walkTimer = null; if (this.walkV === 0) this.stopWalk(); }, 1200);
    }
  },
  muffle(on) { if (this.musF && this.ctx) this.musF.frequency.setTargetAtTime(on ? 600 : this.MUS_LP, this.ctx.currentTime, 0.2); },
  // クリア演出中はBGMを小さくし、sec秒後に元へ戻す
  duck(sec) {
    if (!this.musDuck) return;
    const g = this.musDuck.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.setTargetAtTime(0.18, t, 0.06); g.setTargetAtTime(1, t + sec, 0.5);
  },
  bgmKey: 'samba',
  sceneKey: 'home',
  _playingKey: 'home',
  activeKey() { return this.sceneKey || this.bgmKey; },
  setScene(key) {
    const next = key || null;
    this.sceneKey = next;
    const ef = this.activeKey();
    if (this._playingKey !== ef) {
      this._playingKey = ef;
      this.step = 0;
      this.lyricQ = [];
    }
  },
  setBgm(name, theme) {
    let k = 'samba';
    if (name === 'チューリップ') k = 'tulip';
    else if (name === 'かたつむり') k = 'katatsumuri';
    else if (name === 'さくら') k = 'sakura';
    else if (name === 'ドーナツ') k = 'alps';
    else if (name === 'うさぎ') k = 'usagi';
    else if (name === 'テディベア') k = 'kumasan';
    else if (name === 'ショートケーキ' || name === 'ありんこ隊のパーティー' || name === 'カップケーキ') k = 'birthday';
    else if (name === 'つきよのねこ' || name === 'マカロン' || name === 'ひつじ' || name === 'ユニコーン') k = 'kirakiraboshi';
    else if (name === 'ふじさん') k = 'fujinoyama';
    else if (name === 'ほせん' || name === 'すなはまのたからばこ') k = 'kamome';
    else if (name === 'ねこ') k = 'nekofunjatta';
    else if (name === 'おしろ' || name === 'ハムスター') k = 'minuet';
    else if (name === 'キャンディ') k = 'konpeitou';
    else if (name === 'きんぎょばち' || name === 'だるま') k = 'muramatsuri';
    else if (name === 'ひまわり') k = 'harugakita';
    else if (name === 'ロボット' || name === 'いぬ' || name === 'カブトムシ' || name === 'バス') k = 'toysoldiers';
    else if (name === 'ロケット' || name === 'UFO') k = 'jupiter';
    else if (name === 'かえる') k = 'kaeru';
    else if (name === 'でんしゃ') k = 'kisha';
    else if (name === 'コアラ') k = 'yama';
    else if (name === 'きょうりゅう') k = 'kuri';
    else if (name === 'ひこうき') k = 'shabondama';
    else if (name === 'おかしのいえ') k = 'gavotte';
    else if (name === 'ゆきのむら' || name === 'アザラシ') k = 'skaters';
    else if (name === 'やたい') k = 'muramatsuri';
    else if (name === 'あじさい') k = 'amefuri';
    else if (name === 'ゆうえんち') k = 'toysoldiers'; // かっこうワルツ(ヨナーソン没1956)は日本で2027年からPDのため未使用
    else if (name === 'サンゴしょう' || name === 'ウミガメ' || name === 'ヒトデ') k = 'warewauminoko';
    else if (name === 'じんじゃ') k = 'momiji';
    else if (name === 'アリのす') k = 'humoresque';
    else if (name === '女王さまのお茶会') k = 'queen';
    else if (['アイスクリーム','ハロウィン','ピクニック','フルーツパフェ','ちょうちょ','おんせん','イルカ','ふうしゃ','メリーゴーランド','キャンプ','かいぞくせん','ガチャガチャ','おすし','すずらん','ラッコ','ハリネズミ','クラゲ','しんかんせん','きかんしゃ','クリスマスツリー','とけいだい','にじのたき','ツリーハウス','ありんこ音楽隊','さくらんぼ','ひよことタマゴ','あさがお','プリン','クマノミ','パトカー','てるてるぼうず','たいやき','つみきのおしろ','たこやき','クリオネ','しょうぼうしゃ','ありんこコック','パンやさん','レッサーパンダ','こいのぼり','ピクニック2','クリームソーダ','オムライス','サボテン','ミツバチ','ぶどう','インコ','カニ','みかん','ふうせん','ピザ','ネズミ','トースト'].includes(name)) k = 'samba';
    else if (theme === 'おまつり') k = 'matsuri';
    else if (theme === 'はな' || theme === 'しぜん') k = 'breeze';
    this.bgmKey = k;
    if (!this.sceneKey && this._playingKey !== k) {
      this._playingKey = k;
      this.step = 0;
      this.lyricQ = [];
    }
  },
  BGM_TITLES: {
    home: 'ようこそアントフロー',
    result: 'クリア・セレブレーション',
    queen: '女王さまのロイヤルワルツ',
    samba: 'ありんこサンバ',
    tulip: 'チューリップ',
    katatsumuri: 'かたつむり',
    sakura: 'さくらさくら',
    alps: 'アルプスいちまんじゃく',
    usagi: 'うさぎとかめ',
    kumasan: 'もりのくまさん',
    birthday: 'ハッピーバースデイトゥユー',
    kirakiraboshi: 'きらきらぼし',
    fujinoyama: 'ふじの山',
    kamome: 'かもめの水兵さん',
    nekofunjatta: 'ねこふんじゃった',
    minuet: 'メヌエット',
    konpeitou: 'こんぺいとうの踊り',
    muramatsuri: 'むらまつり',
    harugakita: '春が来た',
    toysoldiers: 'おもちゃの兵隊の行進',
    jupiter: '木星（ジュピター）',
    kaeru: 'かえるのがっしょう',
    kisha: '汽車',
    yama: 'やまのおんがくか',
    kuri: 'おおきなきょうりゅう',
    shabondama: 'しゃぼんだま',
    gavotte: 'ガヴォット',
    skaters: 'スケーターズ・ワルツ',
    amefuri: 'あめふり',
    kakkou: 'かっこうワルツ',
    warewauminoko: 'われは海の子',
    momiji: 'もみじ',
    humoresque: 'ユーモレスク',
    matsuri: 'おまつりおはやし',
    breeze: 'そよかぜワルツ'
  },
  customBgm: null,
  useCustomBgm: false,
  stageBgm: null,
  activeCustomBgm() {
    if (this.sceneKey) return null;
    return this.stageBgm || (this.useCustomBgm && this.customBgm ? this.customBgm : null);
  },
  playCustomNote(inst, semi, w, dur) {
    if (!this.ctx) return;
    const f = this.hz(semi + 12);
    if (inst === 'chip') {
      this.tone(f, dur * 0.9, { type: 'square', vol: 0.042, when: w, attack: 0.004, dest: this.mus });
      this.tone(f * 2, dur * 0.45, { type: 'triangle', vol: 0.016, when: w, attack: 0.003, dest: this.musR || this.mus });
    } else if (inst === 'bell') {
      this.celesta(f * 2, w, dur * 1.35, 0.08, this.musW || this.mus);
    } else if (inst === 'flute') {
      this.lead(f, w, dur * 0.92, 0.072, 'home');
    } else if (dur > 0.35) {
      this.epiano(f, w, Math.max(0.44, dur), 0.12, this.mus);
    } else {
      this.mallet(f, w, 0.14, this.mus);
    }
  },
  playCustomDrum(kind, w, semi) {
    if (!this.ctx) return;
    if (kind === 1) {
      this.surdo(w, 0.58, false);
      if (semi != null) this.pluckBass(this.hz(semi - 12), w, 0.2, 0.68);
    } else if (kind === 2) {
      this.brushSnare(w, 0.72);
      this.shaker(w, 0.65);
    }
  },
  bgmTitle() {
    const cb = this.activeCustomBgm();
    if (cb) return '🎵 ' + (cb.name || 'オリジナルBGM');
    const k = this.activeKey();
    return this.BGM_TITLES[k] || k;
  },
  startBgm() {
    if (!this.ctx || this.bgmTimer) return;
    this.nextT = this.ctx.currentTime + 0.15; this.step = 0;
    this.bgmTimer = setInterval(() => this.sched(), 40);
  },
  stopBgm() { clearInterval(this.bgmTimer); this.bgmTimer = null; },

  /* ---------- BGM：テーマ別・ステージ別シーケンサー（16分音符グリッド） ---------- */
  BPM: 108,
  // ahead：何秒先まで音を予約しておくか。重い処理で画面が止まっても、この秒数までは音が途切れない（測定中は measure.js が 2.5 にする）
  ahead: 1.0,
  // タンボリン（テレコテコのリズム）
  TAMB: [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
  // カヴァキーニョの刻み（16分音符で細かく。数字は強さ）
  CAV: [0.6, 0, 0.5, 0.9, 0, 0.6, 0, 0.9, 0.6, 0, 0.5, 0.9, 0, 0.6, 0.5, 0.9],
  // アゴゴベル（2=高い音 1=低い音）
  AGO: [2, 0, 1, 0, 2, 0, 1, 1, 0, 2, 0, 1, 2, 0, 1, 0],
  // r=ベースの根音（C=0）、ch=コードの構成音、r2/ch2=小節の後半（8〜15）のコード（省略すると前半と同じ）
  // m=メロディ [16分の位置, 音（C4=0からの半音）, 長さ]
  SONG: [
    // ---- A：食い気味のリズムで跳ねる動機。最後はG13で止めて「まだ続く」感じにする ----
    { r: 0, ch: [-5, -3, 2, 4], m: [[0, 16, 2], [3, 19, 2], [6, 16, 2], [8, 21, 3], [11, 19, 3], [14, 16, 2]] },
    { r: 9, ch: [-5, -1, 0, 4], m: [[2, 12, 1], [3, 16, 3], [6, 19, 2], [8, 23, 3], [11, 21, 3], [14, 19, 2]] },
    { r: 2, ch: [-7, -3, 0, 4], m: [[0, 17, 2], [3, 21, 3], [6, 17, 2], [8, 16, 3], [11, 14, 3], [14, 12, 2]] },
    { r: 7, ch: [-7, -1, 2, 4], m: [[0, 14, 3], [3, 11, 3], [6, 14, 2], [8, 16, 2], [10, 17, 2], [12, 19, 4]] },
    { r: 4, ch: [-5, -1, 2, 4], m: [[0, 19, 2], [3, 23, 3], [6, 19, 2], [8, 21, 3], [11, 19, 3], [14, 16, 2]] },
    { r: 9, ch: [-5, -3, 1, 6], m: [[2, 13, 1], [3, 16, 3], [6, 21, 2], [8, 19, 3], [11, 16, 3], [14, 13, 2]] },
    { r: 2, ch: [-7, -3, 0, 4], m: [[0, 14, 3], [3, 17, 3], [6, 21, 2], [8, 24, 3], [11, 21, 3], [14, 17, 2]] },
    { r: 7, ch: [-7, -1, 2, 4], m: [[0, 19, 3], [3, 17, 3], [6, 14, 2], [8, 11, 3], [11, 14, 3], [14, 17, 2]] },
    // ---- A'：6小節目まではAと同じ。最後は Dm9→G13→C6/9 で着地し、駆け上がってサビへ ----
    { r: 0, ch: [-5, -3, 2, 4], m: [[0, 16, 2], [3, 19, 2], [6, 16, 2], [8, 21, 3], [11, 19, 3], [14, 16, 2]] },
    { r: 9, ch: [-5, -1, 0, 4], m: [[2, 12, 1], [3, 16, 3], [6, 19, 2], [8, 23, 3], [11, 21, 3], [14, 19, 2]] },
    { r: 2, ch: [-7, -3, 0, 4], m: [[0, 17, 2], [3, 21, 3], [6, 17, 2], [8, 16, 3], [11, 14, 3], [14, 12, 2]] },
    { r: 7, ch: [-7, -1, 2, 4], m: [[0, 14, 3], [3, 11, 3], [6, 14, 2], [8, 16, 2], [10, 17, 2], [12, 19, 4]] },
    { r: 4, ch: [-5, -1, 2, 4], m: [[0, 19, 2], [3, 23, 3], [6, 19, 2], [8, 21, 3], [11, 19, 3], [14, 16, 2]] },
    { r: 9, ch: [-5, -3, 1, 6], m: [[2, 13, 1], [3, 16, 3], [6, 21, 2], [8, 19, 3], [11, 16, 3], [14, 13, 2]] },
    { r: 2, ch: [-7, -3, 0, 4], r2: 7, ch2: [-7, -1, 2, 4], m: [[0, 14, 3], [3, 17, 3], [6, 21, 2], [8, 19, 3], [11, 17, 3], [14, 14, 2]] },
    { r: 0, ch: [-5, -3, 2, 4], m: [[0, 16, 4], [4, 12, 2], [6, 16, 2], [8, 19, 2], [10, 21, 2], [12, 24, 4]] },
    // ---- B（サビ）：Fmaj9→G→Em7→Am9 を2回。高い音域で歌い、5小節目が山場 ----
    { r: 5, ch: [-3, 0, 4, 7], m: [[0, 21, 3], [3, 24, 3], [6, 21, 4], [10, 19, 2], [12, 21, 4]] },
    { r: 7, ch: [-5, -1, 2, 9], m: [[0, 19, 3], [3, 23, 3], [6, 21, 4], [10, 19, 2], [12, 23, 4]] },
    { r: 4, ch: [-5, -1, 2, 4], m: [[0, 24, 2], [2, 23, 2], [4, 19, 4], [8, 16, 2], [10, 19, 2], [12, 21, 4]] },
    { r: 9, ch: [-5, -1, 0, 4], m: [[0, 19, 6], [6, 16, 2], [8, 12, 2], [10, 16, 2], [12, 19, 2], [14, 21, 2]] },
    { r: 5, ch: [-3, 0, 4, 7], m: [[0, 24, 4], [4, 21, 2], [6, 24, 4], [10, 23, 2], [12, 24, 4]] },
    { r: 7, ch: [-5, -1, 2, 9], m: [[0, 23, 3], [3, 24, 3], [6, 23, 2], [8, 21, 3], [11, 19, 3], [14, 23, 2]] },
    { r: 4, ch: [-5, -1, 2, 4], r2: 9, ch2: [-5, -3, 1, 6], m: [[0, 24, 3], [3, 23, 3], [6, 19, 2], [8, 21, 3], [11, 19, 3], [14, 16, 2]] },
    { r: 2, ch: [-7, -3, 0, 4], r2: 7, ch2: [-7, -1, 2, 4], m: [[0, 17, 3], [3, 21, 3], [6, 17, 2], [8, 19, 2], [10, 17, 2], [12, 14, 2], [14, 11, 2]] }
  ],
  hz(n) { return 261.63 * Math.pow(2, n / 12); },
  // 小節の後半にコードの指定（r2/ch2）があれば、後半はそのコードを使う
  half(B, st, bSteps) { return st >= ((bSteps || 16) >> 1) && B.r2 != null ? { r: B.r2, ch: B.ch2 } : B; },
  // BGM用のノイズ（打楽器の皮の音・シェイカー・ブレス音）
  mnoise(w, dur, vol, freq, type, q, dest) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + w, s = c.createBufferSource(), g = c.createGain();
    const fb = this.filteredNoiseBuf(freq, type, q);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const out = dest || this.mus;
    if (fb) {
      s.buffer = fb; s.loop = true;
      s.connect(g); g.connect(out);
      s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.05);
    } else {
      const f = c.createBiquadFilter();
      s.buffer = this.noiseBuf(); s.loop = true;
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      s.connect(f); f.connect(g); g.connect(out);
      s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    }
  },
  // スルド：hi=false は2・4拍目の低い太鼓（主役）、hi=true は1・3拍目に応える高めの太鼓
  surdo(w, v, hi) {
    const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), g = c.createGain(), d = hi ? 0.24 : 0.44;
    o.type = 'sine';
    o.frequency.setValueAtTime(hi ? 132 : 98, t); o.frequency.exponentialRampToValueAtTime(hi ? 76 : 49, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * v, t + 0.007); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.mus);
    o.start(t); o.stop(t + d + 0.05);
    this.mnoise(w, 0.032, 0.048 * v, hi ? 950 : 600, 'lowpass', 0.7);
  },
  shaker(w, v) { this.mnoise(w, 0.048, 0.028 * v, 4400, 'bandpass', 1.1, this.musL); },
  tamb(w, v) {
    this.tone(640, 0.068, { vol: 0.065 * v, when: w, glide: 0.75, attack: 0.002, dest: this.musR || this.mus });
    this.mnoise(w, 0.035, 0.028 * v, 3400, 'bandpass', 1.4, this.musR);
  },
  agogo(w, hi) {
    const f = hi ? 659.25 : 523.25;
    this.tone(f, 0.18, { type: 'triangle', vol: 0.028, when: w, attack: 0.002, dest: this.musR || this.mus });
    this.tone(f * 2.76, 0.065, { vol: 0.007, when: w, attack: 0.002, dest: this.musR || this.mus });
  },
  // 手拍子（3つのノイズを少しずらして、何人かで叩いているように聞かせる）
  clap(w) { for (let i = 0; i < 3; i++) this.mnoise(w + i * 0.009, 0.05, 0.034, 1450, 'bandpass', 0.9, i === 1 ? this.musL : this.musR); },
  // ブラシ・スネア（軽快なマーチ・ポップス用）
  brushSnare(w, v) {
    this.tone(185, 0.055, { type: 'triangle', vol: 0.075 * v, when: w, glide: 0.55, attack: 0.002, dest: this.mus });
    this.mnoise(w, 0.07, 0.038 * v, 2400, 'bandpass', 0.85, this.musR);
    this.mnoise(w, 0.04, 0.022 * v, 4800, 'highpass', 0.7, this.musL);
  },
  // ウッドブロック（コロコロした木の打楽器）
  woodblock(w, hi, v) {
    const f = hi ? 830 : 620;
    this.tone(f, 0.065, { type: 'triangle', vol: 0.055 * v, when: w, glide: 0.88, attack: 0.002, dest: this.musR || this.mus });
    this.tone(f * 2.32, 0.024, { type: 'sine', vol: 0.016 * v, when: w, attack: 0.001, dest: this.musR || this.mus });
  },
  // トライアングル／ベルチャイム（小節頭やサビのキラキラ金属余韻）
  triChime(w, v) {
    const out = this.musW || this.mus;
    this.tone(3520, 0.45, { type: 'sine', vol: 0.018 * v, when: w, attack: 0.002, dest: out });
    this.tone(5280, 0.26, { type: 'sine', vol: 0.01 * v, when: w, attack: 0.002, dest: out });
  },
  // ティンパニ（オーケストラ／王宮／ファンファーレの重厚な低音太鼓）
  timpani(f, w, v) {
    const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 1.06, t); o.frequency.exponentialRampToValueAtTime(f * 0.96, t + 0.48);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.009); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
    o.connect(g); g.connect(this.mus);
    o.start(t); o.stop(t + 0.56);
    this.mnoise(w, 0.04, 0.036 * v, 450, 'lowpass', 0.8);
  },
  // ホイッスル（アピート）：小刻みに震える笛の音
  whistle(w, dur) {
    const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 2100;
    lfo.frequency.value = 28; lg.gain.value = 90;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.022, t + 0.01);
    g.gain.setValueAtTime(0.022, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.mus);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  },
  // 金管のアクセント：今のコードを1オクターブ上で「パッ」と短く鳴らす
  stab(ch, w) {
    const c = this.ctx, t = c.currentTime + w, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.Q.value = 0.85;
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(2800, t + 0.03); f.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.028, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    f.connect(g); g.connect(this.musR || this.mus);
    for (let i = 0; i < ch.length; i++) {
      const o = c.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = this.hz(ch[i] + 12);
      o.detune.value = (i - 1.5) * 4;
      o.connect(f); o.start(t); o.stop(t + 0.24);
    }
  },
  // 温かいストリングス／アンサンブル持続パッド（単一フィルタ共有で軽量かつ重厚に和音を包む）
  padChord(ch, w, dur, vol, style) {
    const c = this.ctx;
    if (!c || !ch || !ch.length) return;
    const t = c.currentTime + w, f = c.createBiquadFilter(), g = c.createGain();
    const isStrings = style === 'royal' || style === 'waltz' || style === 'result';
    f.type = 'lowpass'; f.Q.value = 0.55;
    const fPeak = isStrings ? 1850 : style === 'celesta' ? 1450 : 1600;
    f.frequency.setValueAtTime(fPeak * 0.65, t);
    f.frequency.linearRampToValueAtTime(fPeak, t + Math.min(0.25, dur * 0.45));
    f.frequency.exponentialRampToValueAtTime(fPeak * 0.72, t + dur + 0.12);
    const atk = Math.min(0.14, dur * 0.32);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.setValueAtTime(vol * 0.85, t + Math.max(atk, dur * 0.82));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.16);
    f.connect(g); g.connect(this.musW || this.mus);
    const end = t + dur + 0.2;
    for (let i = 0; i < ch.length; i++) {
      const o = c.createOscillator();
      o.type = isStrings ? 'sawtooth' : (i & 1 ? 'sawtooth' : 'triangle');
      o.frequency.value = this.hz(ch[i]);
      o.detune.value = (i - 1.5) * 5.5;
      o.connect(f); o.start(t); o.stop(end);
    }
  },
  // 温かいエレクトリック／アコースティック・ピアノ（倍音とベルアタック付き）
  epiano(f, w, dur, vol, dest) {
    const out = dest || this.musL || this.mus;
    this.tone(f, dur * 1.15, { type: 'triangle', vol, when: w, attack: 0.004, dest: out });
    this.tone(f * 2, dur * 0.55, { type: 'sine', vol: vol * 0.28, when: w, attack: 0.003, dest: out });
    this.tone(f * 3, Math.min(0.08, dur * 0.35), { type: 'sine', vol: vol * 0.12, when: w, attack: 0.002, dest: out });
  },
  // チェンバロ／ハープシコード（女王さま・バロック宮廷用の華やかな撥弦楽器）
  harpsi(f, w, dur, vol, dest) {
    const c = this.ctx, t = c.currentTime + w, o1 = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o1.type = 'sawtooth'; o2.type = 'triangle';
    o1.frequency.value = f; o2.frequency.value = f * 2; o2.detune.value = 5;
    fl.type = 'lowpass'; fl.Q.value = 0.9;
    fl.frequency.setValueAtTime(3200, t); fl.frequency.exponentialRampToValueAtTime(950, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(dest || this.musL || this.mus);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.09); o2.stop(t + dur + 0.09);
  },
  // 箏（こと）／三味線風の和風撥弦音（わずかな押し手のピッチ変化と爪音付き）
  koto(f, w, dur, vol, dest) {
    const c = this.ctx, t = c.currentTime + w, o1 = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o1.type = 'triangle'; o2.type = 'sawtooth';
    o1.frequency.setValueAtTime(f * 1.012, t); o1.frequency.exponentialRampToValueAtTime(f, t + 0.025);
    o2.frequency.value = f;
    fl.type = 'lowpass'; fl.Q.value = 0.8;
    fl.frequency.setValueAtTime(2600, t); fl.frequency.exponentialRampToValueAtTime(720, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    const out = dest || this.musL || this.mus;
    o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.11); o2.stop(t + dur + 0.11);
    this.mnoise(w, 0.016, vol * 0.24, 2800, 'bandpass', 1.8, out);
  },
  // チェレスタ／グロッケンシュピール（オルゴールのように透き通るキラキラ高音ベル）
  celesta(f, w, dur, vol, dest) {
    const out = dest || this.musR || this.mus;
    this.tone(f, dur * 1.25, { type: 'sine', vol, when: w, attack: 0.003, dest: out });
    this.tone(f * 2, dur * 0.6, { type: 'triangle', vol: vol * 0.26, when: w, attack: 0.002, dest: this.musW || out });
    this.tone(f * 3, Math.min(0.14, dur * 0.35), { type: 'sine', vol: vol * 0.11, when: w, attack: 0.002, dest: this.musW || out });
  },
  // ホルン／ブラスセクション（祝祭・行進・王宮の豊かな金管アンサンブル和音）
  warmBrass(ch, w, dur, vol, dest) {
    const c = this.ctx;
    if (!c || !ch || !ch.length) return;
    const t = c.currentTime + w, fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = 'lowpass'; fl.Q.value = 0.75;
    fl.frequency.setValueAtTime(420, t);
    fl.frequency.linearRampToValueAtTime(1950, t + Math.min(0.07, dur * 0.4));
    fl.frequency.exponentialRampToValueAtTime(980, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.035, dur * 0.25));
    g.gain.setValueAtTime(vol * 0.78, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    fl.connect(g); g.connect(dest || this.musR || this.mus);
    const end = t + dur + 0.09;
    for (let i = 0; i < ch.length; i++) {
      const o = c.createOscillator();
      o.type = i === ch.length - 1 ? 'sawtooth' : 'triangle';
      o.frequency.value = this.hz(ch[i] + 12);
      o.detune.value = (i - 1.5) * 4.5;
      o.connect(fl); o.start(t); o.stop(end);
    }
  },
  perc(st, w, o) {
    // スルド：2・4拍目は低い太鼓、1・3拍目は高めの太鼓で応え、4拍目の裏に食い気味の小さな一打
    if (st === 4 || st === 12) this.surdo(w, 1, false);
    else if (st === 0 || st === 8) this.surdo(w, 0.48, true);
    else if (st === 14) this.surdo(w, 0.28, true);
    // ガンザ：16分で刻み、4つ目にアクセント
    this.shaker(w, [0.5, 0.25, 0.35, 0.8][st & 3]);
    // タンボリン：区切りの小節の最後はロールで盛り上げる
    if (o.fill) this.tamb(w, 0.55 + (st - 12) * 0.15);
    else if (this.TAMB[st]) this.tamb(w, st & 3 ? 1 : 0.6);
    if (o.ago && this.AGO[st]) this.agogo(w, this.AGO[st] === 2);
    if (o.clap && (st === 4 || st === 12)) this.clap(w);
  },
  // アコースティック＋サブベース（スマホスピーカーでも聞こえる2倍音と、深みのある重低音を両立）
  pluckBass(f, w, dur, v) {
    const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), o2 = c.createOscillator(), oSub = c.createOscillator(), gSub = c.createGain(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = 'triangle'; o2.type = 'sawtooth'; oSub.type = 'sine';
    o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 4;
    oSub.frequency.value = f >= 82 ? f * 0.5 : f;
    gSub.gain.value = 0.42;
    fl.type = 'lowpass'; fl.Q.value = 0.7;
    fl.frequency.setValueAtTime(1150, t); fl.frequency.exponentialRampToValueAtTime(240, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.24 * v, t + 0.009); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.09);
    o.connect(fl); o2.connect(fl); oSub.connect(gSub); gSub.connect(fl); fl.connect(g); g.connect(this.mus);
    const end = t + dur + 0.13;
    o.start(t); o2.start(t); oSub.start(t); o.stop(end); o2.stop(end); oSub.stop(end);
  },
  // サンバのベース：「ドン、ダ・ドン」（根音→根音→5度）を半小節ごとに繰り返す
  bassStep(B, st, w, s16) {
    let p = null;
    if (st === 0 || st === 8) p = [0, 3, 1];
    else if (st === 3 || st === 11) p = [0, 1, 0.65];
    else if (st === 4 || st === 12) p = [1, 3, 0.92];
    else if (st === 15) p = [1, 1, 0.52];
    if (!p) return;
    const r = B.r - 24, n = p[0] ? r + (B.r >= 5 ? -5 : 7) : r;
    this.pluckBass(this.hz(n), w, p[1] * s16, p[2]);
  },
  // カヴァキーニョ＋エレピ：和音を少しずつずらして弾き（ストローク）、弦をはじく「チャッ」という音を足す
  compStep(B, st, w, s16) {
    const v = this.CAV[st];
    if (!v) return;
    const dest = (st & 2) ? this.musR : this.musL;
    B.ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.006, s16 * 0.95, 0.026 * v, dest));
    this.mnoise(w, 0.025, 0.011 * v, 3200, 'bandpass', 2, dest);
  },
  // メロディ：曲調（style）に合わせて木管・バイオリン・金管・篠笛・オルゴール等の倍音と表現を切り替える主旋律
  lead(f, w, dur, vol, style) {
    const c = this.ctx, t = c.currentTime + w;
    if (style === 'celesta') {
      this.celesta(f, w, dur * 1.15, vol * 1.05, this.mus);
      this.tone(f, dur * 0.95, { type: 'triangle', vol: vol * 0.45, when: w, attack: 0.01, dest: this.mus });
      return;
    }
    const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(), m2 = c.createGain(), m3 = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), fl = c.createBiquadFilter(), g = c.createGain();
    const isRoyal = style === 'royal';
    const isBrass = style === 'result' || style === 'march';
    const isWa = style === 'sakura' || style === 'matsuri';
    o1.type = isRoyal ? 'sawtooth' : 'triangle';
    o2.type = isBrass ? 'sawtooth' : isWa ? 'sine' : 'square';
    o3.type = 'sine';
    if (isWa) {
      o1.frequency.setValueAtTime(f * 0.986, t); o1.frequency.exponentialRampToValueAtTime(f, t + 0.024);
      o2.frequency.setValueAtTime(f * 0.986, t); o2.frequency.exponentialRampToValueAtTime(f, t + 0.024);
      this.mnoise(w, 0.024, vol * 0.25, 2600, 'bandpass', 1.6, this.mus);
    } else {
      o1.frequency.value = f;
      o2.frequency.value = f;
    }
    o3.frequency.value = f * 2;
    o2.detune.value = isRoyal ? 7 : 6;
    m2.gain.value = isRoyal ? 0.38 : isBrass ? 0.34 : isWa ? 0.45 : 0.18;
    m3.gain.value = isRoyal ? 0.14 : isWa ? 0.12 : 0.1;
    lfo.frequency.value = isRoyal ? 5.4 : isWa ? 5.0 : 5.8;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * (isRoyal ? 0.007 : 0.0055), t + Math.min(0.26, dur));
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    fl.type = 'lowpass'; fl.Q.value = isRoyal || isBrass ? 0.85 : 0.65;
    if (isBrass) {
      fl.frequency.setValueAtTime(950, t); fl.frequency.linearRampToValueAtTime(3600, t + Math.min(0.055, dur * 0.35)); fl.frequency.exponentialRampToValueAtTime(2100, t + dur);
    } else if (isRoyal) {
      fl.frequency.setValueAtTime(1600, t); fl.frequency.linearRampToValueAtTime(3200, t + Math.min(0.06, dur * 0.4)); fl.frequency.exponentialRampToValueAtTime(2200, t + dur);
    } else {
      fl.frequency.value = 3500;
    }
    const atk = isRoyal ? 0.018 : 0.011;
    const dEnd = t + Math.min(0.14, dur * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(vol * 0.68, dEnd);
    g.gain.setValueAtTime(vol * 0.68, t + Math.max(dEnd - t, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.13);
    o1.connect(fl); o2.connect(m2); m2.connect(fl); o3.connect(m3); m3.connect(fl); fl.connect(g); g.connect(this.mus);
    const end = t + dur + 0.19;
    o1.start(t); o2.start(t); o3.start(t); lfo.start(t); o1.stop(end); o2.stop(end); o3.stop(end); lfo.stop(end);
    if (isRoyal) this.celesta(f, w, Math.min(0.28, dur * 0.8), vol * 0.34, this.musR);
  },
  // コード構成音（C.ch）から主旋律（mSemi）の3度〜6度下に位置する協和ハモリ音を自動選出
  findHarmonySemi(mSemi, C) {
    const ch = (C && C.ch) || [-5, 0, 4, 7];
    let best = null, bestDiff = 99;
    for (let i = 0; i < ch.length; i++) {
      let cand = ch[i];
      while (cand < mSemi - 12) cand += 12;
      while (cand >= mSemi) cand -= 12;
      const diff = mSemi - cand;
      if (diff >= 3 && diff <= 8) {
        const score = Math.abs(diff - 4.5);
        if (score < bestDiff) { bestDiff = score; best = cand; }
      }
    }
    return best != null ? best : (mSemi - 4);
  },
  // 主旋律に寄り添うステレオ副旋律・ハモリパート（右チャンネル寄り）
  harmonyLead(mSemi, C, w, dur, vol, style) {
    const hSemi = this.findHarmonySemi(mSemi, C);
    const f = this.hz(hSemi);
    const out = this.musR || this.mus;
    if (style === 'royal' || style === 'waltz') {
      this.tone(f, dur * 1.05, { type: 'sawtooth', vol: vol * 0.65, when: w, attack: 0.025, dest: this.musW || out });
    } else if (style === 'celesta') {
      this.celesta(f, w, dur, vol * 0.75, out);
    } else {
      this.epiano(f, w, dur, vol * 0.85, out);
    }
  },
  lyricQ: [],
  LYRICS: {
    home: [
      '♪ ようこそ ここへ〜',
      '♪ アントフローへ〜',
      '♪ きょうも なかよく',
      '♪ パズルで あそぼ〜',
      '♪ カラフル キャンディ',
      '♪ みんなで はこぼう',
      '♪ すてきな えがおが',
      '♪ まっているよ〜'
    ],
    result: [
      '♪ やったね クリアだ',
      '♪ パズル かんせい',
      '♪ ほしも コインも',
      '♪ いっぱい ゲット〜',
      '♪ せーので バンザイ',
      '♪ うれしい フィナーレ',
      '♪ つぎの ステージへ',
      '♪ しゅっぱつだ〜♪'
    ],
    queen: [
      '♪ じょおう さまの',
      '♪ おへやへ〜',
      '♪ あまい おかし',
      '♪ どうぞ〜♪',
      '♪ きんの ティアラ',
      '♪ キラキラ〜',
      '♪ すてきな ワルツ',
      '♪ おどろ〜'
    ],
    tulip: [
      '♪ さいた〜 さいた〜',
      '♪ チューリップの はなが〜',
      '♪ ならんだ〜 ならんだ〜',
      '♪ あか しろ きいろ〜',
      '♪ どのはな みても〜',
      '♪ きれいだな〜'
    ],
    katatsumuri: [
      '♪ でんでん むしむし',
      '♪ かたつむり〜',
      '♪ おまえの あたまは',
      '♪ どこにある〜',
      '♪ つのだせ やりだせ',
      '♪ あたまだせ〜'
    ],
    sakura: [
      '♪ さくら〜',
      '♪ さくら〜',
      '♪ やよいの',
      '♪ そらは〜',
      '♪ みわたす',
      '♪ かぎり〜',
      '♪ かすみか',
      '♪ くもか〜',
      '♪ いざや〜',
      '♪ いざや〜',
      '♪ みに ゆか〜',
      '♪ ん〜'
    ],
    kirakiraboshi: [
      '♪ きらきら', '♪ ひかる', '♪ おそらの', '♪ ほしよ',
      '♪ まばたき', '♪ しては', '♪ みんなを', '♪ みてる',
      '♪ きらきら', '♪ ひかる', '♪ おそらの', '♪ ほしよ'
    ],
    usagi: [
      '♪ もしもし かめよ', '♪ かめさんよ〜',
      '♪ せかいの うちで', '♪ おまえほど〜',
      '♪ あゆみの のろい', '♪ ものはない〜',
      '♪ どうして そんなに', '♪ のろいのか〜'
    ],
    kumasan: [
      '♪ あるひ〜', '♪ もりの なか〜',
      '♪ くまさんに〜', '♪ であ〜った〜',
      '♪ はなさく もり', '♪ の み〜ち〜',
      [[0, '♪ くまさんに'], [12, '♪ で あ〜った〜']], '♪ で あ〜った〜'
    ],
    alps: [
      '♪ アルプス いちまんじゃく', '♪ こやりの うえで',
      '♪ アルペン おどりを', '♪ おどりましょう ヘイ',
      '♪ ランラララ ララララ', '♪ ランラララ ラララ',
      '♪ ランラララ ララララ', '♪ ララララ ララン'
    ],
    birthday: [
      '♪ ハッピー バースデイ', '♪ トゥ ユー〜',
      '♪ ハッピー バースデイ', '♪ トゥ ユー〜',
      '♪ ハッピー バースデイ', '♪ ディア アリさん',
      '♪ ハッピー バースデイ', '♪ トゥ ユー〜'
    ],
    samba: [
      '♪ てくてく あるこう', '♪ みんなで はこぼう',
      '♪ カラフル ブロック', '♪ ならべて つなごう',
      '♪ おひさま キラキラ', '♪ えがおが ゆれるよ',
      '♪ せーので よいしょっ', '♪ リズムに のって〜',
      '♪ ちいさな あしおと', '♪ そろえて すすめば',
      '♪ どんなに おおきな', '♪ おしろも できるよ',
      '♪ たいこが ドンドン', '♪ こころも はずむね',
      '♪ もうすぐ サビだよ', '♪ せーので ジャンプだ',
      '♪ オレ！ ありんこ', '♪ サンバで おどろう',
      '♪ カラフル パレード', '♪ みんなの ステージ',
      '♪ キラキラ かがやく', '♪ なかまと いっしょに',
      '♪ さいこうの えがおで', '♪ チャチャチャで フィナーレ'
    ],
    fujinoyama: [
      '♪ あたまを くもの', '♪ うえに だし〜',
      '♪ しほうの やまを', '♪ みおろして〜',
      '♪ かみなり さまを', '♪ したに きく〜',
      '♪ ふじは にっぽん', '♪ いちの やま〜'
    ],
    kamome: [
      '♪ かもめの すいへいさん', '♪ ならんだ すいへいさん',
      '♪ しろい ぼうし', '♪ しろい ふく〜',
      '♪ なみに ちゃぷちゃぷ', '♪ うかんでる〜'
    ],
    nekofunjatta: [
      '♪ あり ころんじゃった あり ころんじゃった', '♪ おいも を はこぶ とちゅう',
      '♪ あり ころんじゃった あり ころんじゃった', '♪ ころんで びっくり ありさん',
      '♪ あっ ほら みっ ほら', '♪ おそら に ぽっ',
      '♪ かり ほら ぽっかり', '♪ おおき な くも',
      '♪ ぴょん ぴょん', '♪ あまつぶ ぽつん',
      '♪ ぽつ ぽつ', '♪ あめが ふってきた',
      '♪ あり かけだした あり かけだした', '♪ おうちへ いそぐ あめのひ',
      '♪ みんなで はこぶよ おかし ほら', '♪ ぴょん ぴょん ありさん うたってる'
    ],
    minuet: [
      '♪ おしろの うた', '♪ ラララ〜',
      '♪ おどりましょ', '♪ ラララ〜',
      '♪ ドレス ゆらし', '♪ くるり まわる',
      '♪ ゆうがな メヌ', '♪ エット〜'
    ],
    konpeitou: [
      '♪ こんぺいとう', '♪ キラキラ おかし',
      '♪ あまい キャンディ', '♪ おどろう〜'
    ],
    muramatsuri: [
      '♪ むらの はずれの', '♪ おまつりだ〜',
      '♪ ドンドンヒャララ', '♪ ドンヒャララ〜',
      '♪ ドンドンヒャララ', '♪ おまつりだ〜'
    ],
    harugakita: [
      '♪ はるがきた はるがきた', '♪ どこに きた〜',
      '♪ やまに きた〜', '♪ のにも きた〜'
    ],
    toysoldiers: [
      '♪ おもちゃの マーチだ', '♪ イチ ニッ サン シ',
      '♪ みんなで パレード', '♪ たのしい マーチ♪'
    ],
    jupiter: [
      '♪ ひろい うちゅうへ', '♪ とびだそう',
      '♪ ほしの むこうへ', '♪ ゆこう〜',
      '♪ ロケットに のって', '♪ どこまでも',
      '♪ ゆめを のせて', '♪ とぶよ〜'
    ],
    kaeru: [
      '♪ かえるが なくよ〜', '♪ ゲロ ゲロ ゲロ♪',
      '♪ ケロ ケロ', '♪ クワックワックワックワッ ゲロ ゲロ〜'
    ],
    kisha: [
      '♪ いまは やまなか〜', '♪ いまは はま〜',
      '♪ いまは てっきょう〜', '♪ はやく わたる ぞ〜'
    ],
    yama: [
      '♪ もりのかぜ そよそよ', '♪ コアラさん のんびり',
      '♪ ユーカリの はっぱを', '♪ たのしい な〜'
    ],
    kuri: [
      '♪ おおきな きょうりゅうが', '♪ ずしん ずしんと',
      '♪ ながい しっぽ ゆらし', '♪ ガオーと ほえるよ〜'
    ],
    shabondama: [
      '♪ しゃぼんだま とんだ〜', '♪ やねまで とんだ〜',
      '♪ やねまで とんで〜', '♪ こわれて きえた〜',
      '♪ かぜ かぜ ふくな〜', '♪ しゃぼんだま とばそ〜'
    ],
    gavotte: [
      '♪ あまい おかしの いえ', '♪ チョコ〜',
      '♪ キャンディ クッキーも', '♪ どーぞ〜',
      '♪ あまい おかしの いえ', '♪ チョコ〜',
      '♪ みんな たべようよ', '♪ パクッ♪'
    ],
    skaters: [
      '♪ ゆきの〜', '♪ むらで〜', '♪ すべろ〜', '♪ くるり〜',
      '♪ しろい〜', '♪ ゆきが〜', '♪ キラリ〜', '♪ まうよ〜'
    ],
    amefuri: [
      '♪ あめあめ ふれふれ', '♪ かあさんが〜',
      '♪ じゃのめで おむかえ', '♪ うれしいな〜',
      '♪ ピチピチ チャプチャプ', '♪ ラン ラン ラン♪'
    ],
    kakkou: [
      '♪ かっこう〜', '♪ かっこう〜', '♪ そらで まわる', '♪ ゆめ〜',
      '♪ らんらん〜', '♪ らんらん〜', '♪ たのしい ワルツ', '♪ ポーン♪'
    ],
    warewauminoko: [
      '♪ われは うみのこ', '♪ しらなみの〜',
      '♪ さわぐ いそべの', '♪ まつばらに〜',
      '♪ サンゴの うみで', '♪ およごうよ〜'
    ],
    momiji: [
      '♪ あきの ゆうひに', '♪ てるやま もみじ',
      '♪ こいも うすいも', '♪ かずある なかに'
    ],
    humoresque: [
      '♪ せっせと はこぼう', '♪ あまい キャンディを',
      '♪ アリのす めざして', '♪ ゴー！',
      '♪ みんなで つくろう', '♪ じょおう さまのへや',
      '♪ すてきな おうち', '♪ イェイ♪'
    ]
  },
  singerState() {
    const cb = this.activeCustomBgm();
    const isCustom = !!cb;
    const k = this.activeKey();
    const lyr = isCustom ? null : this.LYRICS[k];
    if (!isCustom && !lyr) return null;
    const sKey = isCustom ? (cb.singer || 'custom') : k;
    const c = this.ctx, playing = !!(c && c.state === 'running' && save.settings.bgm && this.bgmTimer);
    if (!playing) {
      return { key: sKey, text: save.settings.bgm ? '♪ タップで うたうよ！' : '♪ 〜', singing: false, pulse: 0 };
    }
    const now = c.currentTime;
    let cur = null, lastNote = -9;
    while (this.lyricQ.length > 1 && this.lyricQ[1].t <= now) this.lyricQ.shift();
    for (const q of this.lyricQ) {
      if (q.t <= now) { cur = q; if (q.note) lastNote = q.t; }
    }
    const pulse = lastNote > 0 ? Math.max(0, 1 - (now - lastNote) * 4.5) : 0;
    const defTxt = isCustom
      ? ((cb.bars[0] && cb.bars[0].lyric) ? '♪ ' + cb.bars[0].lyric.replace(/^♪\s*/, '') : '♪ ' + (cb.name || 'オリジナルBGM'))
      : lyr[0];
    return { key: sKey, text: cur ? cur.text : defTxt, singing: true, pulse };
  },
  EXTRA_SONGS: {
    home: {
      bpm: 106,
      style: 'home',
      intro: [
        { r: 5, ch: [-3, 0, 5, 9], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 17, 2], [2, 21, 2], [4, 24, 4], [8, 23, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 4, ch: [-5, -1, 2, 7], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 16, 2], [2, 19, 2], [4, 21, 2], [6, 19, 2], [8, 16, 2], [10, 14, 2], [12, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 2], [2, 14, 2], [4, 16, 3], [7, 19, 1], [8, 21, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 17, 2], [2, 19, 2], [4, 21, 4], [8, 19, 2], [10, 16, 2], [12, 14, 4]] },
        { r: 4, ch: [-5, -1, 2, 7], r2: 9, ch2: [-3, 0, 4, 7], m: [[0, 16, 2], [2, 19, 2], [4, 21, 3], [7, 19, 1], [8, 16, 2], [10, 14, 2], [12, 12, 4]] },
        { r: 2, ch: [-7, -3, 0, 5], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 14, 2], [2, 16, 2], [4, 17, 2], [6, 19, 2], [8, 21, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 21, 3], [3, 23, 1], [4, 24, 4], [8, 23, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 4, ch: [-5, -1, 2, 7], r2: 9, ch2: [-3, 0, 4, 7], m: [[0, 19, 2], [2, 21, 2], [4, 19, 2], [6, 16, 2], [8, 14, 2], [10, 16, 2], [12, 12, 4]] },
        { r: 2, ch: [-7, -3, 0, 5], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 14, 2], [2, 16, 2], [4, 17, 3], [7, 19, 1], [8, 21, 2], [10, 19, 2], [12, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 16, 2], [2, 19, 2], [4, 16, 2], [6, 14, 2], [8, 12, 8]] }
      ]
    },
    result: {
      bpm: 118,
      style: 'result',
      intro: [
        { r: 5, ch: [-3, 0, 5, 9], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 19, 2], [2, 19, 2], [4, 21, 2], [6, 23, 2], [8, 24, 4], [12, 19, 4]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 19, 2], [4, 17, 2], [6, 16, 2], [8, 14, 4], [12, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 19, 2], [6, 24, 2], [8, 24, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 24, 2], [4, 21, 2], [6, 19, 2], [8, 16, 4], [12, 19, 4]] },
        { r: 2, ch: [-7, -3, 0, 5], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 17, 2], [2, 16, 2], [4, 14, 2], [6, 17, 2], [8, 16, 2], [10, 14, 2], [12, 19, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 16, 2], [2, 19, 2], [4, 21, 2], [6, 19, 2], [8, 14, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 0, ch2: [-5, 0, 4, 10], m: [[0, 19, 2], [2, 16, 2], [4, 19, 2], [6, 24, 2], [8, 24, 4], [12, 21, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 2, ch2: [-7, -3, 0, 5], m: [[0, 21, 2], [2, 24, 2], [4, 23, 2], [6, 21, 2], [8, 19, 4], [12, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 16, 2], [2, 19, 2], [4, 24, 3], [7, 21, 1], [8, 19, 2], [10, 16, 2], [12, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 2], [2, 14, 2], [4, 16, 2], [6, 19, 2], [8, 12, 8]] }
      ]
    },
    queen: {
      bpm: 104,
      barSteps: 12,
      style: 'royal',
      intro: [
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 18, 2], [2, 19, 2], [4, 21, 4], [8, 23, 4]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 21, 2], [2, 19, 2], [4, 18, 2], [6, 16, 2], [8, 19, 4]] }
      ],
      bars: [
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 19, 4], [4, 23, 4], [8, 26, 2], [10, 24, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 4, ch2: [-5, -1, 4, 7], m: [[0, 23, 4], [4, 19, 4], [8, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 2, ch2: [-3, 0, 2, 6], m: [[0, 16, 2], [2, 18, 2], [4, 19, 4], [8, 21, 4]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 23, 4], [4, 21, 2], [6, 19, 2], [8, 18, 4]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 19, 4], [4, 23, 4], [8, 26, 2], [10, 28, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 9, ch2: [-3, 0, 4, 9], m: [[0, 26, 4], [4, 24, 4], [8, 21, 4]] },
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 23, 4], [4, 21, 2], [6, 19, 2], [8, 18, 2], [10, 21, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 19, 4], [4, 14, 4], [8, 19, 4]] }
      ]
    },
    tulip: {
      bpm: 104,
      style: 'tulip',
      bars: [
        { r: 0, ch: [-5, -3, 2, 4], m: [[0, 12, 2], [2, 14, 2], [4, 16, 4], [8, 12, 2], [10, 14, 2], [12, 16, 4]] },
        { r: 7, ch: [-7, -1, 2, 4], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 2], [10, 16, 2], [12, 14, 4]] },
        { r: 0, ch: [-5, -3, 2, 4], m: [[0, 12, 2], [2, 14, 2], [4, 16, 4], [8, 12, 2], [10, 14, 2], [12, 16, 4]] },
        { r: 7, ch: [-7, -1, 2, 4], r2: 0, ch2: [-5, -3, 2, 4], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 2], [10, 16, 2], [12, 12, 4]] },
        { r: 0, ch: [-5, -3, 2, 4], r2: 5, ch2: [-3, 0, 4, 7], m: [[0, 19, 2], [2, 19, 2], [4, 16, 2], [6, 19, 2], [8, 21, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 7, ch: [-7, -1, 2, 4], r2: 0, ch2: [-5, -3, 2, 4], m: [[0, 16, 2], [2, 16, 2], [4, 14, 2], [6, 14, 2], [8, 12, 8]] }
      ]
    },
    katatsumuri: {
      bpm: 96,
      style: 'tulip',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 24, 2], [4, 24, 2], [6, 19, 2], [8, 16, 2], [10, 19, 2], [12, 19, 2], [14, 16, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 2], [2, 16, 2], [4, 16, 3], [7, 14, 1], [8, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 19, 1], [4, 19, 2], [6, 16, 2], [8, 12, 3], [11, 12, 1], [12, 12, 2], [14, 14, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 16, 3], [3, 16, 1], [4, 14, 2], [6, 12, 2], [8, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 3], [3, 17, 1], [4, 19, 2], [6, 21, 2], [8, 19, 3], [11, 19, 1], [12, 19, 2], [14, 16, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 3], [3, 14, 1], [4, 12, 2], [6, 14, 2], [8, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 24, 2], [4, 24, 2], [6, 19, 2], [8, 16, 2], [10, 19, 2], [12, 19, 2], [14, 16, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 2], [2, 16, 2], [4, 16, 3], [7, 14, 1], [8, 12, 4]] }
      ]
    },
    sakura: {
      bpm: 88,
      style: 'sakura',
      bars: [
        { r: 9, ch: [-3, 0, 4], m: [[0, 9, 4], [4, 9, 4], [8, 11, 8]] },
        { r: 9, ch: [-3, 0, 4], m: [[0, 9, 4], [4, 9, 4], [8, 11, 8]] },
        { r: 9, ch: [-3, 0, 4], r2: 4, ch2: [-8, -3, 0], m: [[0, 9, 4], [4, 11, 4], [8, 12, 4], [12, 11, 4]] },
        { r: 9, ch: [-3, 0, 4], r2: 5, ch2: [-7, -3, 0], m: [[0, 9, 4], [4, 11, 2], [6, 9, 2], [8, 5, 8]] },
        { r: 4, ch: [-8, -3, 0], m: [[0, 4, 4], [4, 0, 4], [8, 4, 4], [12, 5, 4]] },
        { r: 4, ch: [-8, -3, 0], m: [[0, 4, 4], [4, 4, 2], [6, 0, 2], [8, -1, 8]] },
        { r: 9, ch: [-3, 0, 4], r2: 4, ch2: [-8, -3, 0], m: [[0, 9, 4], [4, 11, 4], [8, 12, 4], [12, 11, 4]] },
        { r: 9, ch: [-3, 0, 4], r2: 5, ch2: [-7, -3, 0], m: [[0, 9, 4], [4, 11, 2], [6, 9, 2], [8, 5, 8]] },
        { r: 9, ch: [-3, 0, 4], m: [[0, 9, 4], [4, 9, 4], [8, 11, 8]] },
        { r: 9, ch: [-3, 0, 4], m: [[0, 9, 4], [4, 9, 4], [8, 11, 8]] },
        { r: 4, ch: [-8, -3, 0], r2: 9, ch2: [-3, 0, 4], m: [[0, 4, 4], [4, 5, 4], [8, 11, 4], [12, 9, 4]] },
        { r: 5, ch: [-7, -3, 0], r2: 4, ch2: [-8, -3, 0], m: [[0, 5, 4], [4, 4, 12]] }
      ]
    },
    kirakiraboshi: {
      bpm: 100,
      style: 'celesta',
      intro: [
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 4], [4, 17, 4], [8, 16, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 4], [4, 14, 4], [8, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 4], [4, 12, 4], [8, 19, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 4], [4, 21, 4], [8, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 4], [4, 17, 4], [8, 16, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 4], [4, 14, 4], [8, 12, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 4], [4, 19, 4], [8, 17, 4], [12, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 16, 4], [4, 16, 4], [8, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 4], [4, 19, 4], [8, 17, 4], [12, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 16, 4], [4, 16, 4], [8, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 4], [4, 12, 4], [8, 19, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 4], [4, 21, 4], [8, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 4], [4, 17, 4], [8, 16, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 4], [4, 14, 4], [8, 12, 4]] }
      ]
    },
    usagi: {
      bpm: 98,
      style: 'march',
      intro: [
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 3], [3, 21, 1], [4, 24, 3], [7, 21, 1], [8, 19, 3], [11, 19, 1], [12, 16, 3], [15, 16, 1]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 3], [3, 14, 1], [4, 16, 3], [7, 14, 1], [8, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 19, 3], [3, 16, 1], [4, 19, 3], [7, 16, 1], [8, 16, 3], [11, 14, 1], [12, 14, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 3], [3, 14, 1], [4, 12, 3], [7, 14, 1], [8, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 19, 1], [4, 16, 3], [7, 19, 1], [8, 16, 3], [11, 16, 1], [12, 12, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 3], [3, 14, 1], [4, 16, 3], [7, 14, 1], [8, 12, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 3], [3, 19, 1], [4, 19, 3], [7, 19, 1], [8, 21, 3], [11, 21, 1], [12, 21, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 24, 3], [3, 24, 1], [4, 24, 3], [7, 21, 1], [8, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 3], [3, 21, 1], [4, 24, 3], [7, 21, 1], [8, 19, 3], [11, 19, 1], [12, 16, 3], [15, 16, 1]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 3], [3, 14, 1], [4, 16, 3], [7, 14, 1], [8, 12, 4]] }
      ]
    },
    kumasan: {
      bpm: 108,
      style: 'march',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[2, 19, 2], [4, 21, 2], [6, 23, 2], [8, 24, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], m: [[0, 16, 4], [4, 12, 4], [8, 21, 8]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[2, 21, 2], [4, 23, 2], [6, 21, 2], [8, 19, 4], [12, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 4], [4, 14, 4], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[2, 19, 2], [4, 18, 2], [6, 19, 2], [8, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[2, 16, 2], [4, 15, 2], [6, 16, 2], [8, 12, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[2, 19, 2], [4, 21, 2], [6, 19, 2], [8, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[2, 19, 2], [4, 21, 2], [6, 23, 2], [8, 24, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], m: [[0, 16, 4], [4, 12, 4], [8, 21, 8]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[2, 21, 2], [4, 23, 2], [6, 21, 2], [8, 19, 4], [12, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 4], [4, 14, 4], [8, 12, 8]] }
      ]
    },
    alps: {
      bpm: 112,
      style: 'march',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 3], [3, 18, 1], [4, 16, 2], [6, 14, 2], [8, 16, 2], [10, 18, 2], [12, 19, 2], [14, 16, 2]] },
        { r: 2, ch: [-3, 0, 2, 6], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 14, 2], [2, 19, 2], [4, 18, 2], [6, 21, 2], [8, 19, 6]] }
      ],
      bars: [
        { r: 7, ch: [-5, -1, 2, 7], r2: 2, ch2: [-3, 0, 2, 6], m: [[0, 19, 2], [2, 19, 2], [4, 21, 2], [6, 23, 2], [8, 19, 2], [10, 23, 2], [12, 21, 2], [14, 14, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 2, ch2: [-3, 0, 2, 6], m: [[0, 19, 2], [2, 19, 2], [4, 21, 2], [6, 23, 2], [8, 19, 4], [12, 18, 2], [14, 14, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 19, 2], [4, 21, 2], [6, 23, 2], [8, 24, 2], [10, 23, 2], [12, 21, 2], [14, 19, 2]] },
        { r: 2, ch: [-3, 0, 2, 6], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 18, 2], [2, 14, 2], [4, 16, 2], [6, 18, 2], [8, 19, 4], [12, 19, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 3], [3, 18, 1], [4, 16, 2], [6, 14, 2], [8, 16, 2], [10, 18, 2], [12, 19, 2], [14, 16, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 2, ch2: [-3, 0, 2, 6], m: [[0, 14, 3], [3, 16, 1], [4, 14, 2], [6, 12, 2], [8, 11, 2], [10, 12, 2], [12, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 3], [3, 18, 1], [4, 16, 2], [6, 14, 2], [8, 16, 2], [10, 18, 2], [12, 19, 2], [14, 16, 2]] },
        { r: 2, ch: [-3, 0, 2, 6], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 14, 2], [2, 19, 2], [4, 18, 2], [6, 21, 2], [8, 19, 4], [12, 19, 2]] }
      ]
    },
    birthday: {
      bpm: 108,
      barSteps: 12,
      style: 'waltz',
      intro: [
        { r: 5, ch: [-3, 0, 5, 9], m: [[0, 22, 3], [3, 22, 1], [4, 21, 4], [8, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 4], [4, 17, 8]] }
      ],
      bars: [
        { r: 5, ch: [-3, 0, 5, 9], m: [[0, 12, 3], [3, 12, 1], [4, 14, 4], [8, 12, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 17, 4], [4, 16, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 3], [3, 12, 1], [4, 14, 4], [8, 12, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], m: [[0, 19, 4], [4, 17, 8]] },
        { r: 5, ch: [-3, 0, 5, 9], m: [[0, 12, 3], [3, 12, 1], [4, 24, 4], [8, 21, 4]] },
        { r: 10, ch: [-2, 2, 5, 10], m: [[0, 17, 4], [4, 16, 4], [8, 14, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], m: [[0, 22, 3], [3, 22, 1], [4, 21, 4], [8, 17, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 4], [4, 17, 8]] }
      ]
    },
    fujinoyama: {
      bpm: 96,
      style: 'sakura',
      intro: [
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 4], [4, 21, 4], [8, 19, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 4], [4, 14, 4], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 19, 1], [4, 16, 2], [6, 19, 2], [8, 24, 4], [12, 24, 2], [14, 21, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 16, 2], [8, 14, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 19, 1], [4, 16, 2], [6, 19, 2], [8, 24, 4], [12, 24, 2], [14, 21, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 19, 2], [2, 26, 2], [4, 23, 2], [6, 21, 2], [8, 19, 8]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 3], [3, 21, 1], [4, 23, 2], [6, 24, 2], [8, 19, 4], [12, 16, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 17, 2], [2, 21, 2], [4, 19, 2], [6, 16, 2], [8, 14, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 3], [3, 19, 1], [4, 16, 2], [6, 19, 2], [8, 24, 4], [12, 21, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 16, 1], [4, 14, 2], [6, 16, 2], [8, 12, 8]] }
      ]
    },
    kamome: {
      bpm: 104,
      style: 'tulip',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 19, 2], [6, 16, 2], [8, 14, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 2], [2, 12, 2], [4, 14, 2], [6, 16, 2], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 2], [2, 16, 2], [4, 19, 2], [6, 16, 2], [8, 21, 4], [12, 19, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 2], [2, 14, 2], [4, 17, 2], [6, 14, 2], [8, 19, 4], [12, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 19, 2], [4, 16, 4], [8, 21, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 2], [2, 17, 2], [4, 16, 2], [6, 14, 2], [8, 16, 2], [10, 12, 2], [12, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 2], [2, 16, 2], [4, 19, 2], [6, 16, 2], [8, 21, 2], [10, 19, 2], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 2], [2, 16, 2], [4, 17, 2], [6, 14, 2], [8, 12, 8]] }
      ]
    },
    nekofunjatta: {
      bpm: 112,
      style: 'tulip',
      intro: [
        { r: 6, ch: [-11, -6, -2, 1], m: [[14, 3, 1], [15, 1, 1]] }
      ],
      bars: [
        { r: 6, ch: [-11, -6, -2, 1], m: [[0, -6, 3], [3, 6, 1], [4, 6, 2], [6, 3, 1], [7, 1, 1], [8, -6, 3], [11, 6, 1], [12, 6, 2], [14, 3, 1], [15, 1, 1]] },
        { r: 6, ch: [-11, -6, -2, 1], r2: 1, ch2: [-11, -7, -5, -1], m: [[0, -6, 2], [2, 6, 2], [4, 1, 2], [6, 6, 2], [8, 5, 2], [10, 5, 2], [12, 5, 2], [14, 3, 1], [15, 1, 1]] },
        { r: 1, ch: [-11, -7, -5, -1], m: [[0, -7, 3], [3, 5, 1], [4, 5, 2], [6, 3, 1], [7, 1, 1], [8, -7, 3], [11, 5, 1], [12, 5, 2], [14, 3, 1], [15, 1, 1]] },
        { r: 1, ch: [-11, -7, -5, -1], r2: 6, ch2: [-11, -6, -2, 1], m: [[0, -7, 2], [2, 5, 2], [4, 1, 2], [6, 5, 2], [8, 6, 2], [10, 6, 2], [12, 6, 2], [14, 3, 1], [15, 1, 1]] },
        { r: 6, ch: [-11, -6, -2, 1], m: [[0, 10, 4], [6, 3, 1], [7, 1, 1], [8, 10, 4], [14, 3, 1], [15, 1, 1]] },
        { r: 6, ch: [-11, -6, -2, 1], r2: 1, ch2: [-11, -7, -5, -1], m: [[0, 10, 4], [4, 13, 4], [8, 15, 4], [14, 15, 1], [15, 15, 1]] },
        { r: 1, ch: [-11, -7, -5, -1], m: [[0, 15, 4], [6, 15, 1], [7, 15, 1], [8, 15, 4], [14, 15, 1], [15, 15, 1]] },
        { r: 1, ch: [-11, -7, -5, -1], r2: 6, ch2: [-11, -6, -2, 1], m: [[0, 17, 4], [4, 15, 4], [8, 13, 4], [14, 3, 1], [15, 1, 1]] },
        { r: 6, ch: [-11, -6, -2, 1], m: [[0, 6, 4], [4, 3, 4], [8, 6, 4], [12, 3, 4]] },
        { r: 6, ch: [-11, -6, -2, 1], r2: 1, ch2: [-11, -7, -5, -1], m: [[0, 6, 2], [2, 5, 2], [4, 6, 2], [6, 7, 2], [8, 8, 4], [14, 3, 1], [15, 1, 1]] },
        { r: 1, ch: [-11, -7, -5, -1], m: [[0, 8, 4], [4, 5, 4], [8, 8, 4], [12, 5, 4]] },
        { r: 1, ch: [-11, -7, -5, -1], r2: 6, ch2: [-11, -6, -2, 1], m: [[0, 8, 2], [2, 7, 2], [4, 8, 2], [6, 9, 2], [8, 10, 4], [14, 3, 1], [15, 1, 1]] },
        { r: 6, ch: [-11, -6, -2, 1], m: [[0, -6, 3], [3, 6, 1], [4, 6, 2], [6, 3, 1], [7, 1, 1], [8, -6, 3], [11, 6, 1], [12, 6, 2], [14, 3, 1], [15, 1, 1]] },
        { r: 6, ch: [-11, -6, -2, 1], r2: 1, ch2: [-11, -7, -5, -1], m: [[0, -6, 2], [2, 6, 2], [4, 1, 2], [6, 6, 2], [8, 5, 1], [9, 5, 1], [10, 5, 2], [12, 5, 2], [14, 3, 1], [15, 1, 1]] },
        { r: 1, ch: [-11, -7, -5, -1], m: [[0, 1, 1], [1, 1, 1], [2, 5, 1], [3, 5, 1], [4, 5, 2], [6, 3, 1], [7, 1, 1], [8, 1, 1], [9, 1, 1], [10, 5, 1], [11, 5, 1], [12, 5, 2], [14, 3, 1], [15, 1, 1]] },
        { r: 1, ch: [-11, -7, -5, -1], r2: 6, ch2: [-11, -6, -2, 1], m: [[0, 1, 2], [2, 5, 2], [4, 1, 2], [6, 5, 2], [8, 6, 1], [9, 6, 1], [10, 6, 1], [11, 6, 1], [12, 6, 2], [14, 3, 1], [15, 1, 1]] }
      ]
    },
    minuet: {
      bpm: 108,
      barSteps: 12,
      style: 'royal',
      intro: [
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 21, 2], [2, 23, 2], [4, 24, 2], [6, 23, 2], [8, 21, 2], [10, 18, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 19, 12]] }
      ],
      bars: [
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 26, 4], [4, 19, 2], [6, 21, 2], [8, 23, 2], [10, 24, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 26, 4], [4, 19, 4], [8, 19, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 28, 4], [4, 24, 2], [6, 26, 2], [8, 28, 2], [10, 30, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 31, 4], [4, 19, 4], [8, 19, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 24, 4], [4, 26, 2], [6, 24, 2], [8, 23, 2], [10, 21, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 23, 4], [4, 24, 2], [6, 23, 2], [8, 21, 2], [10, 19, 2]] },
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 18, 4], [4, 19, 2], [6, 21, 2], [8, 19, 2], [10, 18, 2]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 19, 12]] }
      ]
    },
    konpeitou: {
      bpm: 98,
      style: 'celesta',
      intro: [
        { r: 4, ch: [-5, -1, 4, 8], r2: 9, ch2: [-3, 0, 4, 9], m: [[0, 23, 4], [4, 20, 4], [8, 21, 8]] }
      ],
      bars: [
        { r: 9, ch: [-3, 0, 4, 9], m: [[4, 28, 2], [6, 24, 2], [8, 28, 4], [12, 27, 4]] },
        { r: 9, ch: [-3, 0, 4, 9], r2: 4, ch2: [-5, -1, 4, 8], m: [[0, 26, 4], [4, 24, 4], [8, 23, 2], [10, 24, 2], [12, 23, 4]] },
        { r: 9, ch: [-3, 0, 4, 9], r2: 4, ch2: [-5, -1, 4, 8], m: [[0, 26, 2], [2, 24, 2], [4, 26, 2], [6, 24, 2], [8, 23, 4], [12, 20, 4]] },
        { r: 9, ch: [-3, 0, 4, 9], m: [[0, 21, 8], [8, 16, 4], [12, 21, 4]] }
      ]
    },
    muramatsuri: {
      bpm: 112,
      style: 'matsuri',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 4], [4, 19, 2], [6, 16, 2], [8, 19, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 2], [2, 16, 2], [4, 14, 4], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 19, 1], [4, 16, 2], [6, 19, 2], [8, 21, 2], [10, 19, 2], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 2], [2, 16, 2], [4, 19, 2], [6, 16, 2], [8, 14, 4], [12, 12, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 24, 4], [4, 24, 4], [8, 21, 2], [10, 19, 2], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 14, 4], [4, 16, 2], [6, 19, 2], [8, 16, 4], [12, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 24, 4], [4, 24, 4], [8, 21, 2], [10, 19, 2], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 21, 2], [4, 19, 2], [6, 16, 2], [8, 14, 4], [12, 12, 4]] }
      ]
    },
    harugakita: {
      bpm: 100,
      style: 'breeze',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 4], [4, 17, 2], [6, 16, 2], [8, 14, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 4], [4, 14, 4], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 2], [2, 14, 2], [4, 16, 4], [8, 12, 2], [10, 14, 2], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 14, 4], [8, 12, 2], [10, 14, 2], [12, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 21, 2], [4, 19, 4], [8, 16, 2], [10, 19, 2], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 2], [2, 16, 2], [4, 12, 12]] }
      ]
    },
    toysoldiers: {
      bpm: 112,
      style: 'march',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 4], [4, 19, 4], [8, 12, 4], [12, 19, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 16, 4], [4, 14, 4], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 24, 2], [4, 23, 2], [6, 24, 2], [8, 21, 2], [10, 24, 2], [12, 19, 2], [14, 24, 2]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 17, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 4], [12, 19, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 24, 2], [4, 23, 2], [6, 24, 2], [8, 21, 2], [10, 24, 2], [12, 19, 2], [14, 24, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 2], [2, 16, 2], [4, 14, 2], [6, 19, 2], [8, 12, 8]] }
      ]
    },
    jupiter: {
      bpm: 88,
      barSteps: 12,
      style: 'waltz',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 21, 4], [4, 19, 4], [8, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 4], [4, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 16, 2], [2, 19, 2], [4, 21, 6], [10, 21, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 24, 2], [2, 23, 2], [4, 19, 4], [8, 24, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 26, 4], [4, 24, 2], [6, 23, 2], [8, 21, 2], [10, 23, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 21, 4], [4, 19, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 16, 2], [2, 19, 2], [4, 21, 6], [10, 21, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 24, 2], [2, 23, 2], [4, 19, 4], [8, 24, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 26, 4], [4, 24, 2], [6, 23, 2], [8, 21, 2], [10, 19, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 4], [4, 12, 8]] }
      ]
    },
    kaeru: {
      bpm: 104,
      style: 'tulip',
      intro: [
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 16, 2], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 2], [2, 14, 2], [4, 16, 2], [6, 17, 2], [8, 16, 2], [10, 14, 2], [12, 12, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 16, 2], [2, 17, 2], [4, 19, 2], [6, 21, 2], [8, 19, 2], [10, 17, 2], [12, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 4], [4, 12, 4], [8, 12, 4], [12, 12, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 12, 1], [1, 12, 1], [2, 14, 1], [3, 14, 1], [4, 16, 1], [5, 16, 1], [6, 17, 1], [7, 17, 1], [8, 16, 2], [10, 14, 2], [12, 12, 4]] }
      ]
    },
    kisha: {
      bpm: 112,
      style: 'march',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 19, 2], [4, 21, 2], [6, 19, 2], [8, 16, 4], [12, 19, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 2], [2, 16, 2], [4, 14, 4], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 19, 2], [4, 21, 2], [6, 19, 2], [8, 16, 2], [10, 12, 2], [12, 14, 2], [14, 16, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 19, 2], [4, 21, 2], [6, 19, 2], [8, 16, 2], [10, 14, 2], [12, 12, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 21, 2], [4, 24, 2], [6, 21, 2], [8, 19, 2], [10, 16, 2], [12, 14, 2], [14, 16, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 2], [10, 16, 2], [12, 12, 4]] }
      ]
    },
    yama: {
      bpm: 104,
      style: 'breeze',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 19, 2], [6, 16, 2], [8, 14, 4], [12, 16, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 2], [2, 14, 2], [4, 16, 2], [6, 14, 2], [8, 12, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 19, 2], [6, 16, 2], [8, 19, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 2], [2, 14, 2], [4, 17, 2], [6, 14, 2], [8, 17, 2], [10, 19, 2], [12, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 12, 2], [2, 14, 2], [4, 16, 2], [6, 17, 2], [8, 19, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 17, 2], [2, 14, 2], [4, 19, 2], [6, 16, 2], [8, 12, 8]] }
      ]
    },
    kuri: {
      bpm: 108,
      style: 'tulip',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 4], [12, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 2], [10, 16, 2], [12, 12, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 19, 2], [2, 21, 2], [4, 19, 4], [8, 16, 4], [12, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 2], [10, 16, 2], [12, 12, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 2], [2, 16, 2], [4, 17, 2], [6, 19, 2], [8, 12, 8]] }
      ]
    },
    shabondama: {
      bpm: 100,
      style: 'breeze',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 21, 2], [4, 19, 2], [6, 12, 2], [8, 16, 2], [10, 14, 2], [12, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 7, 2], [2, 12, 2], [4, 12, 2], [6, 14, 2], [8, 16, 2], [10, 19, 2], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 17, 2], [4, 24, 2], [6, 21, 2], [8, 19, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 16, 2], [2, 16, 2], [4, 14, 2], [6, 12, 2], [8, 14, 2], [10, 19, 2], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 21, 2], [4, 19, 2], [6, 12, 2], [8, 16, 2], [10, 14, 2], [12, 12, 4]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 24, 3], [3, 24, 1], [4, 24, 2], [6, 24, 2], [8, 24, 2], [10, 21, 2], [12, 19, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 12, 2], [2, 12, 1], [3, 14, 1], [4, 16, 2], [6, 19, 2], [8, 16, 2], [10, 14, 2], [12, 12, 4]] }
      ]
    },
    gavotte: {
      bpm: 108,
      style: 'royal',
      intro: [
        { r: 9, ch: [-3, 1, 4, 7], r2: 2, ch2: [-3, 0, 2, 6], m: [[0, 19, 2], [2, 21, 2], [4, 19, 2], [6, 18, 2], [8, 16, 4], [12, 14, 4]] }
      ],
      bars: [
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 21, 2], [2, 23, 2], [4, 21, 2], [6, 18, 2], [8, 19, 2], [10, 21, 2], [12, 19, 2], [14, 16, 2]] },
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 14, 4], [4, 26, 4], [8, 14, 8]] },
        { r: 9, ch: [-3, 1, 4, 7], m: [[0, 19, 2], [2, 21, 2], [4, 19, 2], [6, 16, 2], [8, 18, 2], [10, 19, 2], [12, 18, 2], [14, 14, 2]] },
        { r: 9, ch: [-3, 1, 4, 7], m: [[0, 16, 4], [4, 21, 4], [8, 9, 8]] },
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 21, 2], [2, 23, 2], [4, 21, 2], [6, 18, 2], [8, 19, 2], [10, 21, 2], [12, 19, 2], [14, 16, 2]] },
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 14, 4], [4, 26, 4], [8, 14, 8]] },
        { r: 4, ch: [-4, 0, 4, 7], r2: 9, ch2: [-3, 1, 4, 7], m: [[0, 18, 4], [4, 14, 2], [6, 11, 2], [8, 14, 4], [12, 11, 2], [14, 8, 2]] },
        { r: 9, ch: [-3, 1, 4, 9], m: [[0, 9, 4], [4, 21, 4], [8, 9, 8]] }
      ]
    },
    skaters: {
      bpm: 108,
      barSteps: 12,
      style: 'waltz',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 4], [4, 16, 4], [8, 14, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 12, 12]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 8], [8, 19, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 21, 8], [8, 21, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 17, 8], [8, 21, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 23, 8], [8, 23, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 26, 4], [4, 24, 4], [8, 16, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 8], [8, 17, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 16, 4], [4, 16, 4], [8, 14, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 12]] }
      ]
    },
    amefuri: {
      bpm: 100,
      style: 'tulip',
      intro: [
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 16, 3], [3, 14, 1], [4, 12, 2], [6, 9, 2], [8, 14, 2], [10, 16, 2], [12, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 2], [2, 12, 2], [4, 14, 2], [6, 16, 2], [8, 12, 2], [10, 12, 2], [12, 14, 2], [14, 16, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 16, 2], [4, 12, 2], [6, 14, 2], [8, 16, 8]] },
        { r: 5, ch: [-3, 0, 5, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 19, 2], [4, 16, 2], [6, 12, 2], [8, 14, 2], [10, 16, 2], [12, 12, 2], [14, 9, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 7, 2], [2, 12, 2], [4, 16, 2], [6, 14, 2], [8, 12, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 5, 9], m: [[0, 19, 2], [2, 19, 2], [4, 16, 2], [6, 16, 2], [8, 21, 2], [10, 21, 2], [12, 19, 2], [14, 19, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 16, 2], [2, 16, 2], [4, 14, 2], [6, 14, 2], [8, 12, 8]] }
      ]
    },
    kakkou: {
      bpm: 112,
      barSteps: 12,
      style: 'waltz',
      intro: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 4], [4, 12, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 19, 4], [4, 7, 8]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 4], [4, 12, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 4], [4, 12, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 4], [4, 19, 2], [6, 16, 2], [8, 12, 2], [10, 16, 2]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 14, 8], [8, 17, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 11, 4], [4, 14, 8]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 7, 4], [4, 14, 8]] },
        { r: 7, ch: [-5, -1, 2, 5], m: [[0, 17, 4], [4, 17, 2], [6, 14, 2], [8, 11, 2], [10, 14, 2]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 12, 12]] }
      ]
    },
    warewauminoko: {
      bpm: 96,
      style: 'breeze',
      intro: [
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 12, 3], [3, 16, 1], [4, 19, 4], [8, 16, 4], [12, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 4, 9], m: [[0, 12, 3], [3, 12, 1], [4, 16, 3], [7, 19, 1], [8, 24, 4], [12, 21, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 16, 1], [4, 12, 2], [6, 14, 2], [8, 16, 8]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 3], [3, 14, 1], [4, 16, 2], [6, 14, 2], [8, 12, 4], [12, 9, 4]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 5], m: [[0, 7, 3], [3, 7, 1], [4, 9, 2], [6, 12, 2], [8, 14, 8]] },
        { r: 0, ch: [-5, 0, 4, 7], r2: 5, ch2: [-3, 0, 4, 9], m: [[0, 12, 3], [3, 12, 1], [4, 16, 3], [7, 19, 1], [8, 24, 4], [12, 21, 4]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 16, 1], [4, 14, 3], [7, 16, 1], [8, 12, 8]] }
      ]
    },
    momiji: {
      bpm: 96,
      style: 'sakura',
      intro: [
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 19, 2], [2, 21, 2], [4, 19, 2], [6, 16, 2], [8, 14, 4], [12, 12, 4]] }
      ],
      bars: [
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 16, 1], [4, 19, 2], [6, 21, 2], [8, 19, 4], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 4, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 3], [3, 24, 1], [4, 21, 2], [6, 19, 2], [8, 16, 8]] },
        { r: 7, ch: [-5, -1, 2, 5], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 14, 2], [2, 14, 2], [4, 16, 2], [6, 19, 2], [8, 21, 2], [10, 24, 2], [12, 19, 4]] },
        { r: 5, ch: [-3, 0, 4, 9], r2: 0, ch2: [-5, 0, 4, 7], m: [[0, 21, 2], [2, 19, 2], [4, 16, 3], [7, 14, 1], [8, 12, 8]] }
      ]
    },
    humoresque: {
      bpm: 100,
      style: 'royal',
      intro: [
        { r: 2, ch: [-3, 0, 2, 6], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 14, 4], [4, 16, 4], [8, 18, 4], [12, 19, 4]] }
      ],
      bars: [
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 7, 3], [3, 9, 1], [4, 7, 3], [7, 9, 1], [8, 11, 3], [11, 14, 1], [12, 16, 3], [15, 14, 1]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 19, 3], [3, 18, 1], [4, 21, 3], [7, 19, 1], [8, 18, 3], [11, 21, 1], [12, 19, 3], [15, 16, 1]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 4, ch2: [-5, -1, 4, 7], m: [[0, 14, 3], [3, 14, 1], [4, 16, 3], [7, 14, 1], [8, 19, 3], [11, 16, 1], [12, 14, 3], [15, 11, 1]] },
        { r: 2, ch: [-3, 0, 2, 6], m: [[0, 9, 12]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 7, 3], [3, 9, 1], [4, 7, 3], [7, 9, 1], [8, 11, 3], [11, 14, 1], [12, 16, 3], [15, 14, 1]] },
        { r: 0, ch: [-5, 0, 4, 7], m: [[0, 16, 3], [3, 18, 1], [4, 21, 3], [7, 19, 1], [8, 18, 3], [11, 21, 1], [12, 19, 3], [15, 16, 1]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 2, ch2: [-3, 0, 2, 6], m: [[0, 14, 3], [3, 14, 1], [4, 19, 3], [7, 7, 1], [8, 9, 4], [12, 14, 4]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 7, 12]] }
      ]
    },
    matsuri: {
      bpm: 114,
      style: 'matsuri',
      bars: [
        { r: 2, ch: [-5, -3, 2, 7], m: [[0, 14, 2], [2, 16, 2], [4, 19, 3], [8, 21, 2], [10, 19, 2], [12, 16, 3]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 14, 3], [4, 16, 2], [6, 19, 2], [8, 23, 3], [12, 21, 3]] },
        { r: 2, ch: [-5, -3, 2, 7], m: [[0, 19, 2], [2, 21, 2], [4, 23, 3], [8, 21, 2], [10, 19, 2], [12, 16, 3]] },
        { r: 9, ch: [-3, 2, 4, 7], r2: 2, ch2: [-5, -3, 2, 7], m: [[0, 19, 3], [4, 16, 2], [6, 14, 2], [8, 14, 6]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 23, 2], [2, 21, 2], [4, 19, 3], [8, 21, 2], [10, 23, 2], [12, 26, 3]] },
        { r: 4, ch: [-5, -1, 2, 4], m: [[0, 23, 3], [4, 21, 2], [6, 19, 2], [8, 16, 3], [12, 19, 3]] },
        { r: 2, ch: [-5, -3, 2, 7], m: [[0, 21, 2], [2, 19, 2], [4, 16, 2], [6, 14, 2], [8, 16, 3], [12, 19, 3]] },
        { r: 7, ch: [-5, -1, 2, 7], r2: 2, ch2: [-5, -3, 2, 7], m: [[0, 21, 3], [4, 19, 2], [6, 16, 2], [8, 14, 6]] }
      ]
    },
    breeze: {
      bpm: 94,
      style: 'breeze',
      bars: [
        { r: 5, ch: [-3, 0, 4, 7], m: [[0, 17, 3], [4, 19, 3], [8, 21, 3], [12, 24, 3]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 23, 3], [4, 21, 3], [8, 19, 6]] },
        { r: 4, ch: [-5, -1, 2, 4], m: [[0, 16, 3], [4, 19, 3], [8, 23, 3], [12, 21, 3]] },
        { r: 9, ch: [-5, -1, 0, 4], m: [[0, 19, 3], [4, 16, 3], [8, 14, 6]] },
        { r: 2, ch: [-7, -3, 0, 4], m: [[0, 14, 3], [4, 17, 3], [8, 21, 3], [12, 19, 3]] },
        { r: 7, ch: [-5, -1, 2, 7], m: [[0, 17, 3], [4, 16, 3], [8, 14, 6]] },
        { r: 0, ch: [-5, -3, 2, 4], m: [[0, 16, 3], [4, 19, 3], [8, 24, 3], [12, 21, 3]] },
        { r: 5, ch: [-3, 0, 4, 7], r2: 7, ch2: [-5, -1, 2, 7], m: [[0, 19, 3], [4, 17, 3], [8, 16, 6]] }
      ]
    }
  },
  // 主旋律が長い音符や休符のときに、右チャンネルから華やかな合いの手（オブリガート）を添える
  obligatoStep(style, C, B, st, bSteps, w, s16, sec) {
    if (st % 2 !== 0) return;
    for (let i = 0; i < B.m.length; i++) {
      const m = B.m[i];
      if (m[0] === st || (m[0] < st && m[0] + m[2] > st && m[2] < 6)) return;
    }
    const ch = C.ch || [-5, 0, 4, 7];
    const idx = ((st >> 1) + sec) % ch.length;
    const f = this.hz(ch[idx] + 12);
    if (style === 'royal') this.harpsi(f, w, s16 * 1.9, 0.022, this.musR);
    else if (style === 'sakura') this.koto(f, w, s16 * 2.2, 0.024, this.musR);
    else if (style === 'celesta' || style === 'waltz') this.celesta(f, w, s16 * 2.1, 0.024, this.musR);
    else if (style === 'result' || style === 'home' || style === 'march') this.celesta(f, w, s16 * 1.8, 0.022, this.musR);
    else if (sec >= 1) this.mallet(f, w, 0.02, this.musR);
  },
  // 伴奏専用アレンジ（周回 sec=0..3 で多層オーケストレーションを展開し、メインメロディは原曲通り固定）
  accompEx(style, C, st, w, s16, sec, bar, len, bSteps, inIntro) {
    const r = C.r - 24, fifth = r + (C.r >= 5 ? -5 : 7), oct = r + 12, ch = C.ch;
    const halfSt = (bSteps || 16) >> 1;
    // 1. 持続ストリングス／アンサンブル和音パッド（小節前半・後半の頭で空間を豊かに満たす）
    if (st === 0 || (st === halfSt && C.r2 != null)) {
      const padSteps = C.r2 != null ? halfSt : (bSteps || 16);
      const padVol = (style === 'royal' || style === 'waltz' || style === 'result' || style === 'home') ? 0.016 : 0.012;
      this.padChord(ch, w, padSteps * s16 * 0.96, padVol * (1 + sec * 0.1), style);
    }
    // 2. スタイル別の多層リズム・コード・対旋律アレンジ
    if (style === 'home') {
      // ホーム画面：陽気で温かいガーデン・オーケストラ（ウォーキングベース＋エレピ＋チェレスタ＋軽快ブラシ）
      if (st === 0 || st === 8) this.pluckBass(this.hz(r), w, 3.5 * s16, 0.9);
      else if (st === 4 || st === 12) this.pluckBass(this.hz(fifth), w, 2.8 * s16, 0.72);
      else if (st === 14 && (bar & 1)) this.pluckBass(this.hz(oct), w, 1.8 * s16, 0.55);
      if (st === 0 || st === 3 || st === 6 || st === 8 || st === 11 || st === 14) {
        const v = (st === 0 || st === 8) ? 0.85 : 0.65;
        ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.006, s16 * 1.6, 0.021 * v, (st & 1) ? this.musR : this.musL));
      }
      if (st % 2 === 0) {
        const n = ch[((st >> 1) + bar) % ch.length] + 12;
        if (sec % 2 === 1 || inIntro) this.celesta(this.hz(n), w, s16 * 1.8, 0.02, this.musR);
        else this.mallet(this.hz(n), w, 0.018, this.musR);
      }
      if (sec >= 2 && (st === 0 || st === 8) && (bar & 1) === 0) this.warmBrass(ch, w, s16 * 3.5, 0.017, this.musL);
      if (st === 0 || st === 8) this.surdo(w, 0.42, st === 8);
      if (st === 4 || st === 12) { this.brushSnare(w, 0.58); if (sec >= 2) this.clap(w); }
      this.shaker(w, [0.45, 0.2, 0.35, 0.65][st & 3]);
      if (st === 0 && (bar & 3) === 0) this.triChime(w, 0.8);
      if (bar === len - 1 && st >= 12) this.tamb(w, 0.45 + (st - 12) * 0.12);
      return;
    }
    if (style === 'result') {
      // リザルト画面：華やかな祝祭ファンファーレ＆ビクトリーパレード（金管＋グロッケン＋ティンパニ＋手拍子）
      if (st === 0 || st === 8) {
        this.pluckBass(this.hz(r), w, 3.2 * s16, 0.95);
        this.timpani(this.hz(r), w, st === 0 ? 0.65 : 0.45);
      } else if (st === 4 || st === 12) {
        this.pluckBass(this.hz(fifth), w, 2.6 * s16, 0.8);
      } else if (st === 6 || st === 14) {
        this.pluckBass(this.hz(oct), w, 1.6 * s16, 0.58);
      }
      if (st === 0 || st === 4 || st === 8 || st === 12) {
        this.warmBrass(ch, w, s16 * 2.2, (st === 0 || st === 8) ? 0.024 : 0.018, (st & 4) ? this.musL : this.musR);
      }
      if (st === 2 || st === 6 || st === 10 || st === 14) {
        ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.005, s16 * 1.2, 0.022, this.musL));
      }
      if (st % 2 === 0) {
        this.celesta(this.hz(ch[(st >> 1) % ch.length] + 12), w, s16 * 1.6, 0.022, this.musR);
      }
      if (st === 0 || st === 8) this.surdo(w, 0.62, false);
      if (st === 4 || st === 12) { this.brushSnare(w, 0.78); this.clap(w); }
      if (this.TAMB[st]) this.tamb(w, (st & 3) ? 0.65 : 0.45);
      this.shaker(w, [0.5, 0.25, 0.4, 0.75][st & 3]);
      if (st === 0 && (bar & 1) === 0) this.triChime(w, 0.95);
      if (bar === len - 1 && st >= 12) { this.brushSnare(w, 0.5 + (st - 12) * 0.14); this.stab(ch, w); }
      return;
    }
    if (style === 'royal') {
      // 女王さま・宮廷音楽：チェンバロ分散和音＋弦楽四重奏＋ホルン＋銀のベル（3拍子 bSteps=12 / 4拍子 bSteps=16 両対応）
      const is34 = (bSteps === 12);
      if (st === 0 || (!is34 && st === 8)) {
        this.pluckBass(this.hz(r), w, 3.8 * s16, 0.88);
        if (bar % 2 === 0 && st === 0) this.timpani(this.hz(r), w, 0.45);
      } else if ((is34 && (st === 4 || st === 8)) || (!is34 && (st === 4 || st === 12))) {
        this.pluckBass(this.hz(st === 4 ? fifth : oct), w, 2.4 * s16, 0.62);
      }
      if ((is34 && (st === 4 || st === 8)) || (!is34 && (st === 4 || st === 12))) {
        ch.forEach((n, i) => this.harpsi(this.hz(n), w + i * 0.012, s16 * 2.1, 0.021, this.musL));
        if (sec >= 1 || inIntro) this.warmBrass(ch, w, s16 * 2.4, 0.016, this.musR);
      }
      if (st % 2 === 0) {
        const arpIdx = (st >> 1) % ch.length;
        const n = ch[arpIdx] + (sec >= 2 && (st & 2) ? 12 : 0);
        this.harpsi(this.hz(n + 12), w, s16 * 1.7, 0.018, this.musR);
        if (sec >= 1 && (st === 0 || st === (is34 ? 6 : 8))) this.celesta(this.hz(ch[(arpIdx + 1) % ch.length] + 12), w, s16 * 2.4, 0.02, this.musW);
      }
      if (st === 0 && (bar & 1) === 0) this.triChime(w, 0.75);
      if (sec >= 2 && ((is34 && st === 8) || (!is34 && (st === 4 || st === 12)))) this.tamb(w, 0.32);
      return;
    }
    if (style === 'celesta') {
      // オルゴール＆チェレスタ幻想曲（きらきらぼし・こんぺいとう）：高音ベル分散和音＋夢見心地のストリングス
      if (st === 0 || st === 8) this.pluckBass(this.hz(r), w, 4.2 * s16, 0.75);
      else if (st === 4 || st === 12) this.pluckBass(this.hz(fifth), w, 3 * s16, 0.55);
      if (st % 2 === 0) {
        const idx = (st >> 1) % ch.length;
        const n = ch[idx] + ((st & 2) ? 12 : 0);
        this.celesta(this.hz(n), w, s16 * 2.4, 0.024, (st & 2) ? this.musR : this.musL);
        if (sec >= 1) this.epiano(this.hz(ch[(idx + 2) % ch.length]), w, s16 * 1.8, 0.016, this.musL);
      }
      if (st === 0) this.triChime(w, 0.7);
      if (sec >= 2 && st % 4 === 2) this.shaker(w, 0.25);
      return;
    }
    if (style === 'march') {
      // マーチ・パレード（おもちゃの兵隊・汽車・アルプス・くまさん・うさぎ）：弾むチューバ＋スネア＋ブラス＋木琴
      if (st === 0 || st === 8) this.pluckBass(this.hz(r), w, 2.8 * s16, 0.92);
      else if (st === 4 || st === 12) this.pluckBass(this.hz(fifth), w, 2.5 * s16, 0.8);
      if (st === 2 || st === 6 || st === 10 || st === 14) {
        this.warmBrass(ch, w, s16 * 1.4, 0.019, this.musL);
        ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.004, s16 * 1.1, 0.018, this.musR));
      }
      if (sec >= 1 && st % 2 === 0) {
        this.mallet(this.hz(ch[(st >> 1) % ch.length] + 12), w, 0.02, this.musR);
      }
      if (st === 0 || st === 8) this.surdo(w, 0.52, false);
      if (st === 4 || st === 12) this.brushSnare(w, 0.72);
      else if (sec >= 1 && (st === 14 || st === 15)) this.brushSnare(w, 0.38);
      if (sec >= 2 && (st === 2 || st === 10)) this.woodblock(w, st === 2, 0.65);
      this.shaker(w, [0.4, 0.2, 0.35, 0.55][st & 3]);
      if (bar === len - 1 && st >= 12) { this.brushSnare(w, 0.55 + (st - 12) * 0.12); this.tamb(w, 0.45); }
      return;
    }
    if (style === 'waltz') {
      // シンフォニック・ワルツ（ジュピター・スケーターズ・バースデイ・かっこう）
      if (st === 0) {
        this.pluckBass(this.hz(r), w, 4.2 * s16, 0.9);
        if (sec >= 1 || bar % 2 === 0) this.timpani(this.hz(r), w, 0.48);
      } else if (sec >= 1 && (st === 4 || st === 8)) {
        this.pluckBass(this.hz(st === 4 ? fifth : oct), w, 2.5 * s16, 0.6);
      }
      if (st === 4 || st === 8) {
        ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.006, s16 * 2.1, 0.023, this.musL));
        if (sec >= 1) this.warmBrass(ch, w, s16 * 2.2, 0.017, this.musR);
      }
      if (st % 2 === 0) {
        const n = ch[(st >> 1) % ch.length] + 12;
        if (sec % 2 === 1) this.celesta(this.hz(n), w, s16 * 1.9, 0.021, this.musR);
        else if (st > 0) this.mallet(this.hz(n), w, 0.019, this.musR);
      }
      if (st === 0 && (bar & 1) === 0) this.triChime(w, 0.72);
      if (sec >= 1 && st === 8) this.shaker(w, 0.32);
      if (sec >= 2 && st === 4) this.tamb(w, 0.38);
      return;
    }
    if (style === 'sakura') {
      // 和風オーケストラ（さくら・もみじ・ふじの山）：箏の流水アルペジオ＋重厚ベース＋和太鼓＋鈴
      if (st === 0) this.pluckBass(this.hz(r), w, 7.5 * s16, 0.85);
      else if (st === 8) this.pluckBass(this.hz(fifth), w, 6.5 * s16, 0.68);
      if (st === 0 || st === 8) {
        ch.forEach((n, i) => this.koto(this.hz(n), w + i * 0.032, s16 * 4.2, 0.024, this.musL));
      }
      if (st % 2 === 0) {
        const n = ch[(st >> 1) % ch.length] + (st >= 8 ? 12 : 0);
        this.koto(this.hz(n), w, s16 * 2.4, 0.022, this.musR);
        if (sec >= 2 && (st & 2)) this.celesta(this.hz(n + 12), w, s16 * 2.2, 0.016, this.musW);
      }
      if (st === 0) { this.surdo(w, 0.48, false); if ((bar & 1) === 0) this.triChime(w, 0.65); }
      if (sec >= 1 && (st === 4 || st === 12)) this.woodblock(w, st === 12, 0.55);
      if (sec >= 2 && st === 8) this.surdo(w, 0.35, true);
      return;
    }
    if (style === 'matsuri') {
      // お祭りお囃子アンサンブル：大太鼓・締太鼓＋三味線／箏＋鉦（かね）＋手拍子
      if (st === 0 || st === 8) this.pluckBass(this.hz(r), w, 3.2 * s16, 0.92);
      else if (st === 4 || st === 12) this.pluckBass(this.hz(fifth), w, 2.2 * s16, 0.78);
      else if (sec >= 1 && (st === 6 || st === 14)) this.pluckBass(this.hz(oct), w, 1.5 * s16, 0.6);
      if (st === 0 || st === 8) this.surdo(w, 0.78, false);
      else if (st === 4 || st === 12) this.surdo(w, 0.54, true);
      else if (st === 6 || st === 14) this.surdo(w, 0.38, true);
      if (st % 2 === 0) {
        const n = ch[(st >> 1) % ch.length];
        this.koto(this.hz(n + ((st & 2) ? 12 : 0)), w, s16 * 1.6, 0.024, (st & 2) ? this.musR : this.musL);
      }
      if (st % 4 === 2) this.warmBrass(ch, w, s16 * 1.3, 0.018, this.musL);
      if (this.AGO[st]) this.agogo(w, this.AGO[st] === 2);
      if (st === 4 || st === 12) { this.clap(w); this.woodblock(w, st === 12, 0.7); }
      if (bar === len - 1 && st >= 12) this.tamb(w, 0.55 + (st - 12) * 0.12);
      return;
    }
    if (style === 'tulip') {
      // ポップス・アンサンブル：弾むベース＋ステレオエレピ＋マリンバ＆グロッケン＋ブラシドラム
      if (st === 0 || st === 8) this.pluckBass(this.hz(r), w, 3.5 * s16, 0.88);
      else if (st === 4 || st === 12) this.pluckBass(this.hz(fifth), w, 2.5 * s16, 0.7);
      if (st === 0 || st === 4 || st === 8 || st === 12) {
        ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.005, s16 * 1.8, 0.021, this.musL));
      } else if (sec >= 1 && (st === 2 || st === 6 || st === 10 || st === 14)) {
        ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.004, s16 * 1.1, 0.019, this.musL));
      }
      if (st % 2 === 0) {
        const n = ch[(st >> 1) % ch.length] + 12;
        if (sec % 2 === 1) this.celesta(this.hz(n), w, s16 * 1.6, 0.019, this.musR);
        else this.mallet(this.hz(n), w, 0.021, this.musR);
      }
      if (st === 0 || st === 8) this.surdo(w, 0.4, st === 8);
      if (st === 4 || st === 12) this.brushSnare(w, sec >= 1 ? 0.55 : 0.38);
      this.shaker(w, [0.42, 0.2, 0.35, 0.58][st & 3]);
      if (sec >= 2 && bar === len - 1 && st >= 12) this.tamb(w, 0.4 + (st - 12) * 0.1);
      return;
    }
    // breeze：爽やかなボサノバ＆アコースティック・オーケストラ
    if (st === 0 || st === 6 || st === 8 || st === 14) {
      const isFifth = (st === 6 || st === 14);
      this.pluckBass(this.hz(isFifth ? fifth : r), w, (isFifth ? 1.8 : 2.8) * s16, isFifth ? 0.65 : 0.88);
    }
    this.shaker(w, [0.45, 0.22, 0.35, 0.62][st & 3]);
    if (this.CAV[st]) {
      ch.forEach((n, i) => this.epiano(this.hz(n), w + i * 0.006, s16 * 1.4, 0.022 * this.CAV[st], this.musL));
    }
    if (st % 2 === 0) {
      const n = ch[(st >> 1) % ch.length] + 12;
      if (sec >= 2) this.celesta(this.hz(n), w, s16 * 1.8, 0.018, this.musR);
      else if (sec === 1) this.mallet(this.hz(n), w, 0.02, this.musR);
    }
    if (st === 0 || st === 8) this.surdo(w, 0.38, st === 8);
    if (st === 4 || st === 12) { this.woodblock(w, st === 4, 0.5); if (sec >= 2) this.clap(w); }
    if (sec === 3 && this.AGO[st]) this.agogo(w, this.AGO[st] === 2);
  },
  schedCustom(c, B) {
    B = B || this.activeCustomBgm();
    if (!B || !B.bars || !B.bars.length) return;
    const s16 = 60 / clamp(B.bpm || 112, 60, 200) / 4;
    if (this.nextT < c.currentTime - 0.2) this.nextT = c.currentTime + 0.05;
    const totalSteps = B.bars.length * 16;
    while (this.nextT < c.currentTime + this.ahead) {
      const idx = this.step % totalSteps;
      const bar = B.bars[Math.floor(idx / 16)], st = idx % 16;
      const w = Math.max(0, this.nextT - c.currentTime);
      const lyrTxt = (bar.lyric && bar.lyric.trim()) ? '♪ ' + bar.lyric.trim().replace(/^♪\s*/, '') : ('♪ ' + (B.name || 'オリジナルBGM'));
      if (st === 0) this.lyricQ.push({ t: c.currentTime + w, text: lyrTxt, note: false });
      const notes = bar.notes && bar.notes[st];
      if (Array.isArray(notes)) {
        for (let i = 0; i < notes.length; i++) {
          const semi = notes[i];
          let len = 1;
          while (len < 16) {
            const gi = (idx + len) % totalSteps;
            const nb = B.bars[Math.floor(gi / 16)], ns = gi % 16;
            if (!nb.ties || !Array.isArray(nb.ties[ns]) || nb.ties[ns].indexOf(semi) < 0) break;
            if (nb.notes && Array.isArray(nb.notes[ns]) && nb.notes[ns].indexOf(semi) >= 0) break;
            len++;
          }
          this.playCustomNote(B.inst, semi, w, len > 1 ? s16 * (len - 0.08) : s16 * 1.4);
        }
        if (notes.length) this.lyricQ.push({ t: c.currentTime + w, text: lyrTxt, note: true });
      }
      if (bar.kick && bar.kick[st]) this.playCustomDrum(1, w, Array.isArray(notes) && notes.length ? notes[0] : 0);
      if (bar.clap && bar.clap[st]) this.playCustomDrum(2, w);
      this.nextT += s16; this.step++;
    }
  },
  sched() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const cb = this.activeCustomBgm();
    if (cb) { this.schedCustom(c, cb); return; }
    const curKey = this.activeKey();
    const ex = this.EXTRA_SONGS[curKey];
    const bpm = ex ? ex.bpm : this.BPM;
    // FORM：A（0）→ A'（1）→ B（2）→ A'（1）
    const s16 = 60 / bpm / 4, SW = [0, 0.1, -0.02, 0.06], FORM = [0, 1, 2, 1];
    // バックグラウンドから戻ったときに、たまった音符を一度に鳴らさない
    if (this.nextT < c.currentTime - 0.2) this.nextT = c.currentTime + 0.05;
    const bSteps = (ex && ex.barSteps) || 16;
    while (this.nextT < c.currentTime + this.ahead) {
      let B, sec, bar, inIntro = false;
      if (ex) {
        const iLen = ex.intro ? ex.intro.length : 0, iSteps = iLen * bSteps;
        if (this.step < iSteps) {
          inIntro = true; sec = 0; bar = Math.floor(this.step / bSteps); B = ex.intro[bar];
        } else {
          const len = ex.bars.length, abs = Math.floor((this.step - iSteps) / bSteps) % (len * 4);
          sec = Math.floor(abs / len); bar = abs % len; B = ex.bars[bar];
        }
      } else {
        const abs = Math.floor(this.step / 16) % 32;
        sec = abs >> 3; bar = abs & 7; B = this.SONG[FORM[sec] * 8 + bar];
      }
      const st = this.step % bSteps, C = this.half(B, st, bSteps);
      const style = ex ? ex.style : 'samba';
      // SW：16分音符を少し揺らして、サンバ特有の「はずみ」を出す
      const w = Math.max(0, this.nextT - c.currentTime + (ex ? 0 : SW[st & 3] * s16));
      if (ex) {
        this.accompEx(style, C, st, w, s16, sec, bar, ex.bars.length, bSteps, inIntro);
        this.obligatoStep(style, C, B, st, bSteps, w, s16, sec);
      } else {
        // サンバもストリングス／ブラスパッドとオブリガートを加えてリッチ化
        if (st === 0 || (st === 8 && B.r2 != null)) {
          this.padChord(C.ch, w, (B.r2 != null ? 8 : 16) * s16 * 0.95, 0.013 * (1 + sec * 0.1), 'samba');
        }
        this.perc(st, w, { fill: bar === 7 && st >= 12, ago: sec > 0, clap: sec === 2 });
        this.bassStep(C, st, w, s16);
        this.compStep(C, st, w, s16);
        this.obligatoStep('samba', C, B, st, 16, w, s16, sec);
        // 金管のアクセント：サビでは食い気味の位置で、A'の最後ではサビへの合図として鳴らす
        if ((sec === 2 && (st === 11 || (st === 3 && (bar & 3) === 0))) || (sec === 1 && bar === 7 && (st === 12 || st === 14))) this.stab(C.ch, w);
        if (sec === 2 && st === 0 && (bar & 1) === 0) this.warmBrass(C.ch, w, s16 * 3.5, 0.018, this.musL);
        // ホイッスル：サビに入る直前と、曲の最初に戻る直前
        if (bar === 7 && (sec === 1 || sec === 3) && (st === 4 || st === 8)) this.whistle(w, st === 4 ? 0.28 : 0.1);
      }
      const lyr = this.LYRICS[curKey];
      const lyrIdx = ex ? bar : (FORM[sec] * 8 + bar);
      let lyrTxt = '';
      if (lyr) {
        if (inIntro) lyrTxt = '♪ 〜（前奏）';
        else {
          const entry = lyr[lyrIdx];
          if (typeof entry === 'string') lyrTxt = entry;
          else if (Array.isArray(entry)) {
            for (const [ls, lt] of entry) if (st >= ls) lyrTxt = lt;
            if (entry.some(([ls]) => ls === st) && st !== 0) {
              this.lyricQ.push({ t: c.currentTime + w, text: lyrTxt, note: false });
            }
          }
        }
      }
      if (lyr && st === 0) this.lyricQ.push({ t: c.currentTime + w, text: lyrTxt, note: false });
      for (const m of B.m) {
        if (m[0] !== st) continue;
        const f = this.hz(m[1]), dur = m[2] * s16 * 0.92;
        this.lead(f, w, dur, 0.072, style);
        // 3度〜6度下のハモリパート＆キラキラ倍音レイヤーでメロディを重厚に彩る
        if (inIntro || sec >= 1 || style === 'home' || style === 'result' || style === 'royal') {
          this.harmonyLead(m[1], C, w, dur, 0.026, style);
        }
        if (style === 'result' || style === 'home' || sec === 3) {
          this.celesta(f * (m[1] < 24 ? 2 : 1), w, Math.min(0.32, dur), 0.018, this.musR);
        } else if (!ex && (sec === 1 || sec === 3)) {
          this.mallet(f, w, 0.026, this.musR);
        }
        if (lyr) this.lyricQ.push({ t: c.currentTime + w, text: lyrTxt, note: true });
      }
      this.nextT += s16; this.step++;
    }
  }
};
function haptic(ms) { if (save.settings.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* 非対応 */ } } }

AF_LOADED.push('sound.js');