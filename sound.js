// File: sound.js
'use strict';

/* ================= サウンド（Web Audio合成。やわらかい木琴系＋短い残響） ================= */
const Sound = {
  ctx: null, nb: null, bgmTimer: null, lastPop: 0, popTimes: [], lastThump: 0,
  deg: 2, dir: 1, mel: 4, step: 0, walkG: null, walkV: 0,
  PENTA: [0, 2, 4, 7, 9, 12, 14],
  // MUS_LP：BGMの高音カットの周波数（大きいほど明るく、小さいほど丸い音）
  MUS_LP: 4800,
  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const c = this.ctx = new AC();
        this.master = c.createGain(); this.master.gain.value = 0.85;
        const comp = c.createDynamicsCompressor();
        comp.threshold.value = -18; comp.knee.value = 20; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
        this.master.connect(comp); comp.connect(c.destination);
        // 短く温かい残響
        this.verb = c.createConvolver(); this.verb.buffer = this.impulse(1.8, 3);
        const wet = c.createGain(); wet.gain.value = 0.18;
        this.verb.connect(wet); wet.connect(this.master);
        // 効果音：高音域を丸める
        this.sfx = c.createGain();
        this.sfxF = c.createBiquadFilter(); this.sfxF.type = 'lowpass'; this.sfxF.frequency.value = 4500; this.sfxF.Q.value = 0.4;
        this.sfx.connect(this.sfxF); this.sfxF.connect(this.master); this.sfxF.connect(this.verb);
        // BGM：音量 → 一時的に下げる用（ダッキング） → 高音カット
        this.mus = c.createGain();
        this.musDuck = c.createGain(); this.musDuck.gain.value = 1;
        this.musF = c.createBiquadFilter(); this.musF.type = 'lowpass'; this.musF.frequency.value = this.MUS_LP; this.musF.Q.value = 0.5;
        this.mus.connect(this.musDuck); this.musDuck.connect(this.musF); this.musF.connect(this.master);
        const mwet = c.createGain(); mwet.gain.value = 0.5;
        this.musF.connect(mwet); mwet.connect(this.verb);
        this.applyVol(true);
        this.initWalk();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (save.settings.bgm) this.startBgm();
    } catch (e) { /* 音声非対応 */ }
  },
  // 設定の音量（0〜100）を、耳で感じる大きさに近い曲線で反映する
  applyVol(now) {
    if (!this.ctx) return;
    const cv = (v, d) => { const n = Number(v); return Math.pow(clamp(Number.isFinite(n) ? n : d, 0, 100) / 100, 2); };
    const t = this.ctx.currentTime, a = cv(save.settings.sfxVol, 90), b = 0.55 * cv(save.settings.bgmVol, 70);
    if (now) { this.sfx.gain.value = a; this.mus.gain.value = b; }
    else { this.sfx.gain.setTargetAtTime(a, t, 0.05); this.mus.gain.setTargetAtTime(b, t, 0.05); }
  },
  impulse(sec, decay) {
    const c = this.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.35; d[i] = lp * Math.pow(1 - i / n, decay); }
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
    const t = c.currentTime + when, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf(); s.loop = true;
    f.type = type || 'bandpass'; f.frequency.value = freq || 1500; f.Q.value = q || 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfx);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
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
  // アリの足音：小さなサラサラ音を鳴らし続け、歩いている数に応じて音量を変える
  initWalk() {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), am = c.createGain(), g = c.createGain();
    const l1 = c.createOscillator(), l2 = c.createOscillator(), g1 = c.createGain(), g2 = c.createGain();
    s.buffer = this.noiseBuf(); s.loop = true;
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
    am.gain.value = 0.55;
    l1.frequency.value = 9; g1.gain.value = 0.25; l1.connect(g1); g1.connect(am.gain);
    l2.frequency.value = 13.3; g2.gain.value = 0.2; l2.connect(g2); g2.connect(am.gain);
    g.gain.value = 0;
    s.connect(f); f.connect(am); am.connect(g); g.connect(this.sfx);
    s.start(); l1.start(); l2.start();
    this.walkG = g;
  },
  walk(n) {
    if (!this.walkG) return;
    const v = save.settings.sfx && save.settings.steps && n > 0 ? Math.min(0.03, 0.005 * Math.sqrt(n)) : 0;
    if (Math.abs(v - this.walkV) < 0.0015) return;
    this.walkV = v;
    this.walkG.gain.setTargetAtTime(v, this.ctx.currentTime, 0.25);
  },
  muffle(on) { if (this.musF && this.ctx) this.musF.frequency.setTargetAtTime(on ? 600 : this.MUS_LP, this.ctx.currentTime, 0.2); },
  // クリア演出中はBGMを小さくし、sec秒後に元へ戻す
  duck(sec) {
    if (!this.musDuck) return;
    const g = this.musDuck.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.setTargetAtTime(0.18, t, 0.06); g.setTargetAtTime(1, t + sec, 0.5);
  },
  startBgm() {
    if (!this.ctx || this.bgmTimer) return;
    this.nextT = this.ctx.currentTime + 0.15; this.step = 0;
    this.bgmTimer = setInterval(() => this.sched(), 40);
  },
  stopBgm() { clearInterval(this.bgmTimer); this.bgmTimer = null; },

  /* ---------- BGM：明るいサンバ（108BPM・16分音符グリッド・A A' B A' の32小節ループ） ---------- */
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
  half(B, st) { return st >= 8 && B.r2 != null ? { r: B.r2, ch: B.ch2 } : B; },
  // BGM用のノイズ（打楽器の皮の音・シェイカー）
  mnoise(w, dur, vol, freq, type, q) {
    const c = this.ctx, t = c.currentTime + w, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf(); s.loop = true;
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.mus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  // スルド：hi=false は2・4拍目の低い太鼓（主役）、hi=true は1・3拍目に応える高めの太鼓
  surdo(w, v, hi) {
    const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), g = c.createGain(), d = hi ? 0.22 : 0.42;
    o.type = 'sine';
    o.frequency.setValueAtTime(hi ? 130 : 95, t); o.frequency.exponentialRampToValueAtTime(hi ? 78 : 52, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.mus);
    o.start(t); o.stop(t + d + 0.05);
    this.mnoise(w, 0.03, 0.05 * v, hi ? 900 : 600, 'lowpass', 0.7);
  },
  shaker(w, v) { this.mnoise(w, 0.05, 0.03 * v, 4200, 'bandpass', 1); },
  tamb(w, v) {
    this.tone(620, 0.07, { vol: 0.07 * v, when: w, glide: 0.75, attack: 0.002, dest: this.mus });
    this.mnoise(w, 0.03, 0.03 * v, 3000, 'bandpass', 1.5);
  },
  agogo(w, hi) {
    const f = hi ? 659.25 : 523.25;
    this.tone(f, 0.18, { type: 'triangle', vol: 0.028, when: w, attack: 0.002, dest: this.mus });
    this.tone(f * 2.76, 0.06, { vol: 0.006, when: w, attack: 0.002, dest: this.mus });
  },
  // 手拍子（3つのノイズを少しずらして、何人かで叩いているように聞かせる）
  clap(w) { for (let i = 0; i < 3; i++) this.mnoise(w + i * 0.009, 0.05, 0.035, 1400, 'bandpass', 0.9); },
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
    f.type = 'lowpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.03); f.frequency.exponentialRampToValueAtTime(1000, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.025, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    f.connect(g); g.connect(this.mus);
    for (const n of ch) {
      const o = c.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = this.hz(n + 12);
      o.connect(f); o.start(t); o.stop(t + 0.22);
    }
  },
  perc(st, w, o) {
    // スルド：2・4拍目は低い太鼓、1・3拍目は高めの太鼓で応え、4拍目の裏に食い気味の小さな一打
    if (st === 4 || st === 12) this.surdo(w, 1, false);
    else if (st === 0 || st === 8) this.surdo(w, 0.45, true);
    else if (st === 14) this.surdo(w, 0.25, true);
    // ガンザ：16分で刻み、4つ目にアクセント
    this.shaker(w, [0.5, 0.25, 0.35, 0.8][st & 3]);
    // タンボリン：区切りの小節の最後はロールで盛り上げる
    if (o.fill) this.tamb(w, 0.55 + (st - 12) * 0.15);
    else if (this.TAMB[st]) this.tamb(w, st & 3 ? 1 : 0.6);
    if (o.ago && this.AGO[st]) this.agogo(w, this.AGO[st] === 2);
    if (o.clap && (st === 4 || st === 12)) this.clap(w);
  },
  pluckBass(f, w, dur, v) {
    const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f;
    fl.type = 'lowpass';
    fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(250, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(this.mus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.12); o2.stop(t + dur + 0.12);
  },
  // サンバのベース：「ドン、ダ・ドン」（根音→根音→5度）を半小節ごとに繰り返す
  bassStep(B, st, w, s16) {
    let p = null;
    if (st === 0 || st === 8) p = [0, 3, 1];
    else if (st === 3 || st === 11) p = [0, 1, 0.6];
    else if (st === 4 || st === 12) p = [1, 3, 0.9];
    if (!p) return;
    const r = B.r - 24, n = p[0] ? r + (B.r >= 5 ? -5 : 7) : r;
    this.pluckBass(this.hz(n), w, p[1] * s16, p[2]);
  },
  // カヴァキーニョ：和音を少しずつずらして弾き（ストローク）、弦をはじく「チャッ」という音を足す
  compStep(B, st, w, s16) {
    const v = this.CAV[st];
    if (!v) return;
    B.ch.forEach((n, i) => this.tone(this.hz(n), s16 * 0.95, { type: 'triangle', vol: 0.03 * v, when: w + i * 0.006, attack: 0.002, dest: this.mus }));
    this.mnoise(w, 0.025, 0.012 * v, 3200, 'bandpass', 2);
  },
  // メロディ：やわらかい三角波に、少しだけ鋭い矩形波を混ぜた明るい笛の音。伸ばすとビブラートがかかる
  lead(f, w, dur, vol) {
    const c = this.ctx, t = c.currentTime + w, o1 = c.createOscillator(), o2 = c.createOscillator(), m2 = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), fl = c.createBiquadFilter(), g = c.createGain();
    o1.type = 'triangle'; o2.type = 'square'; o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 6; m2.gain.value = 0.16;
    lfo.frequency.value = 5.8;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.3, dur));
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    fl.type = 'lowpass'; fl.frequency.value = 3400; fl.Q.value = 0.6;
    const dEnd = t + Math.min(0.12, dur * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.6, dEnd);
    g.gain.setValueAtTime(vol * 0.6, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    o1.connect(fl); o2.connect(m2); m2.connect(fl); fl.connect(g); g.connect(this.mus);
    const end = t + dur + 0.18;
    o1.start(t); o2.start(t); lfo.start(t); o1.stop(end); o2.stop(end); lfo.stop(end);
  },
  sched() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    // FORM：A（0）→ A'（1）→ B（2）→ A'（1）
    const s16 = 60 / this.BPM / 4, SW = [0, 0.1, -0.02, 0.06], FORM = [0, 1, 2, 1];
    // バックグラウンドから戻ったときに、たまった音符を一度に鳴らさない
    if (this.nextT < c.currentTime - 0.2) this.nextT = c.currentTime + 0.05;
    while (this.nextT < c.currentTime + this.ahead) {
      const st = this.step % 16, abs = Math.floor(this.step / 16) % 32, sec = abs >> 3, bar = abs & 7;
      const B = this.SONG[FORM[sec] * 8 + bar], C = this.half(B, st);
      // SW：16分音符を少し揺らして、サンバ特有の「はずみ」を出す
      const w = Math.max(0, this.nextT - c.currentTime + SW[st & 3] * s16);
      this.perc(st, w, { fill: bar === 7 && st >= 12, ago: sec > 0, clap: sec === 2 });
      this.bassStep(C, st, w, s16);
      this.compStep(C, st, w, s16);
      // 金管のアクセント：サビでは食い気味の位置で、A'の最後ではサビへの合図として鳴らす
      if ((sec === 2 && (st === 11 || (st === 3 && (bar & 3) === 0))) || (sec === 1 && bar === 7 && (st === 12 || st === 14))) this.stab(C.ch, w);
      // ホイッスル：サビに入る直前と、曲の最初に戻る直前
      if (bar === 7 && (sec === 1 || sec === 3) && (st === 4 || st === 8)) this.whistle(w, st === 4 ? 0.28 : 0.1);
      for (const m of B.m) {
        if (m[0] !== st) continue;
        const f = this.hz(m[1]);
        this.lead(f, w, m[2] * s16 * 0.92, 0.07);
        if (sec === 1 || sec === 3) this.mallet(f, w, 0.025, this.mus);
      }
      this.nextT += s16; this.step++;
    }
  }
};
function haptic(ms) { if (save.settings.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* 非対応 */ } } }

AF_LOADED.push('sound.js');