// File: render.js
'use strict';

/* ================= 描画パーツ（キャンディ・アリ・きせかえ・吹き出し） ================= */
function paintCandy(g, x, y, px, ci) {
  const hex = HEX[ci], sh = SHADE[ci];
  if (px < 9) {
    g.fillStyle = sh.d; g.fillRect(x, y, px, px);
    g.fillStyle = hex; g.fillRect(x, y, px, Math.max(1, px * 0.8));
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + px * 0.2, y + px * 0.15, Math.max(1, px * 0.35), Math.max(1, px * 0.15));
    return;
  }
  const p = px * 0.035, s = px - p * 2, r = s * 0.26, top = s * 0.8, X = x + p, Y = y + p;
  g.fillStyle = sh.d; roundRect(g, X, Y, s, s, r); g.fill();
  const gr = g.createLinearGradient(0, Y, 0, Y + top);
  gr.addColorStop(0, sh.l2); gr.addColorStop(1, hex);
  g.fillStyle = gr; roundRect(g, X, Y, s, top, r); g.fill();
  const rg = g.createRadialGradient(X + s * 0.3, Y + s * 0.25, 0, X + s * 0.3, Y + s * 0.25, s * 0.6);
  rg.addColorStop(0, 'rgba(255,255,255,.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; roundRect(g, X, Y, s, top, r); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)'; roundRect(g, X + s * 0.22, Y + top + s * 0.055, s * 0.56, s * 0.06, s * 0.03); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; roundRect(g, X + s * 0.15, Y + s * 0.11, s * 0.38, s * 0.13, s * 0.065); g.fill();
  g.beginPath(); g.arc(X + s * 0.68, Y + s * 0.17, s * 0.065, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 0.35; g.strokeStyle = sh.ol; g.lineWidth = Math.max(1, px * 0.035);
  roundRect(g, X, Y, s, s, r); g.stroke(); g.globalAlpha = 1;
}
// 横向きのアリ（右向き）。pose 0=歩く 1=運ぶ（腕を上げる） 2=持ち上げ中。skin＝きせかえ（SKINS の k）
function drawAntShape(g, u, c, pose, frame, skin) {
  const body = ANT_BODY[c], ol = SHADE[c].ol, lw = Math.max(1, u * 0.11), ph = frame * Math.PI / 2;
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = ol; g.lineWidth = lw * 1.25;
  for (let k = 0; k < 3; k++) {
    const hx = -0.22 * u + k * 0.2 * u, q = ph + k * 2.1, sw = Math.sin(q) * 0.22 * u, lift = Math.max(0, Math.cos(q)) * 0.1 * u;
    g.beginPath(); g.moveTo(hx, 0.15 * u); g.quadraticCurveTo(hx + sw * 0.6 + 0.05 * u, 0.5 * u, hx + sw, 0.8 * u - lift); g.stroke();
  }
  const blob = (x, y, rx, ry) => { ell(g, x, y, rx, ry); g.fillStyle = body; g.fill(); g.strokeStyle = ol; g.lineWidth = lw; g.stroke(); };
  blob(-0.62 * u, 0.08 * u, 0.5 * u, 0.42 * u);
  g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, -0.76 * u, -0.12 * u, 0.18 * u, 0.09 * u, -0.4); g.fill();
  blob(-0.05 * u, 0.15 * u, 0.22 * u, 0.2 * u);
  if (pose > 0) {
    g.strokeStyle = ol; g.lineWidth = lw * 1.25;
    g.beginPath(); g.moveTo(0, 0.05 * u); g.quadraticCurveTo(-0.22 * u, -0.5 * u, 0.12 * u, -0.95 * u); g.stroke();
    g.beginPath(); g.moveTo(0.1 * u, 0.1 * u); g.quadraticCurveTo(0.8 * u, -0.3 * u, 0.6 * u, -0.95 * u); g.stroke();
    for (const hx of [0.12, 0.6]) { ell(g, hx * u, -0.97 * u, 0.1 * u, 0.1 * u); g.fillStyle = body; g.fill(); g.lineWidth = lw * 0.8; g.stroke(); }
  }
  g.strokeStyle = ol; g.lineWidth = lw;
  g.beginPath(); g.moveTo(0.32 * u, -0.62 * u); g.quadraticCurveTo(0.2 * u, -1.0 * u, 0.06 * u, -1.1 * u); g.stroke();
  g.beginPath(); g.moveTo(0.58 * u, -0.66 * u); g.quadraticCurveTo(0.76 * u, -1.0 * u, 0.92 * u, -1.05 * u); g.stroke();
  for (const [ax, ay] of [[0.06, -1.1], [0.92, -1.05]]) { ell(g, ax * u, ay * u, 0.12 * u, 0.12 * u); g.fillStyle = '#ff8fb3'; g.fill(); g.lineWidth = lw * 0.8; g.stroke(); }
  blob(0.45 * u, -0.25 * u, 0.5 * u, 0.47 * u);
  g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, 0.27 * u, -0.5 * u, 0.15 * u, 0.08 * u, -0.5); g.fill();
  if (pose === 2) {
    g.strokeStyle = '#3a2a3a'; g.lineWidth = lw * 1.1;
    g.beginPath(); g.moveTo(0.54 * u, -0.43 * u); g.lineTo(0.7 * u, -0.33 * u); g.lineTo(0.54 * u, -0.23 * u); g.stroke();
    g.fillStyle = '#3a2a3a'; ell(g, 0.82 * u, -0.08 * u, 0.07 * u, 0.055 * u); g.fill();
  } else {
    ell(g, 0.64 * u, -0.32 * u, 0.17 * u, 0.2 * u); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = ol; g.lineWidth = lw * 0.6; g.stroke();
    g.fillStyle = '#2a2030'; ell(g, 0.69 * u, -0.3 * u, 0.1 * u, 0.13 * u); g.fill();
    g.fillStyle = '#fff'; ell(g, 0.66 * u, -0.37 * u, 0.045 * u, 0.045 * u); g.fill();
    g.strokeStyle = '#3a2a3a'; g.lineWidth = lw * 0.8;
    g.beginPath(); g.arc(0.8 * u, -0.13 * u, 0.07 * u, 0.3, Math.PI - 0.3); g.stroke();
  }
  g.fillStyle = 'rgba(255,110,150,.6)'; ell(g, 0.6 * u, -0.06 * u, 0.09 * u, 0.055 * u); g.fill();
  drawHat(g, u, skin);
}
// きせかえ：頭（中心 0.45u,-0.25u）の上に描く
function drawHat(g, u, skin) {
  if (!skin || skin === 'none') return;
  const hx = 0.45 * u, ty = -0.68 * u;
  g.lineWidth = Math.max(1, u * 0.08); g.strokeStyle = '#5a3d5c'; g.lineJoin = 'round';
  const fs = c => { g.fillStyle = c; g.fill(); g.stroke(); };
  switch (skin) {
    case 'ribbon':
      g.beginPath(); g.moveTo(hx - 0.05 * u, ty); g.lineTo(hx - 0.45 * u, ty - 0.3 * u); g.lineTo(hx - 0.42 * u, ty + 0.18 * u); g.closePath(); fs('#ff5a7a');
      g.beginPath(); g.moveTo(hx - 0.05 * u, ty); g.lineTo(hx + 0.32 * u, ty - 0.34 * u); g.lineTo(hx + 0.34 * u, ty + 0.14 * u); g.closePath(); fs('#ff5a7a');
      ell(g, hx - 0.05 * u, ty, 0.11 * u, 0.11 * u); fs('#ff9cc8');
      break;
    case 'straw':
      ell(g, hx, ty + 0.05 * u, 0.62 * u, 0.14 * u); fs('#f2d27a');
      g.beginPath(); g.ellipse(hx, ty, 0.34 * u, 0.3 * u, 0, Math.PI, 0); g.closePath(); fs('#f2d27a');
      g.fillStyle = '#ff5a6a'; g.fillRect(hx - 0.33 * u, ty - 0.1 * u, 0.66 * u, 0.1 * u);
      break;
    case 'band':
      g.save(); g.translate(hx, -0.58 * u); g.rotate(-0.12);
      g.beginPath(); g.moveTo(-0.5 * u, 0); g.lineTo(-0.85 * u, -0.15 * u); g.lineTo(-0.8 * u, 0.12 * u); g.closePath(); fs('#fff');
      roundRect(g, -0.5 * u, -0.09 * u, 1.0 * u, 0.18 * u, 0.08 * u); fs('#fff');
      ell(g, 0.12 * u, 0, 0.07 * u, 0.07 * u); g.fillStyle = '#ff3b4f'; g.fill();
      g.restore();
      break;
    case 'glasses':
      ell(g, 0.66 * u, -0.32 * u, 0.22 * u, 0.22 * u); g.fillStyle = 'rgba(180,230,255,.35)'; g.fill();
      g.strokeStyle = '#3a2a3a'; g.lineWidth = Math.max(1, u * 0.09); g.stroke();
      g.beginPath(); g.moveTo(0.44 * u, -0.34 * u); g.lineTo(0.12 * u, -0.42 * u); g.stroke();
      break;
    case 'cat':
      for (const [x, r] of [[0.18, -0.35], [0.66, 0.3]]) {
        g.save(); g.translate(x * u, -0.62 * u); g.rotate(r);
        g.beginPath(); g.moveTo(-0.16 * u, 0.06 * u); g.lineTo(0, -0.34 * u); g.lineTo(0.16 * u, 0.06 * u); g.closePath(); fs('#3d3550');
        g.beginPath(); g.moveTo(-0.07 * u, 0.02 * u); g.lineTo(0, -0.2 * u); g.lineTo(0.07 * u, 0.02 * u); g.closePath(); g.fillStyle = '#ff9cc8'; g.fill();
        g.restore();
      }
      break;
    case 'flower':
      for (let k = 0; k < 5; k++) {
        ell(g, hx + (k - 2) * 0.2 * u, ty + 0.06 * u + Math.abs(k - 2) * 0.06 * u, 0.11 * u, 0.11 * u);
        fs(['#ff9cc8', '#ffd23f', '#7fd6f5', '#ff9cc8', '#b4e05a'][k]);
      }
      break;
    case 'magic':
      g.beginPath(); g.moveTo(hx - 0.36 * u, ty + 0.08 * u); g.lineTo(hx + 0.05 * u, ty - 0.85 * u); g.lineTo(hx + 0.38 * u, ty + 0.08 * u); g.closePath(); fs('#7a4fd0');
      ell(g, hx, ty + 0.08 * u, 0.5 * u, 0.1 * u); fs('#7a4fd0');
      starPath(g, hx + 0.02 * u, ty - 0.3 * u, 0.13 * u, 0.06 * u, 5); g.fillStyle = '#ffd23f'; g.fill();
      break;
    case 'phones':
      g.lineWidth = Math.max(1.5, u * 0.15); g.strokeStyle = '#3d3550';
      g.beginPath(); g.arc(hx, -0.25 * u, 0.56 * u, Math.PI * 1.1, Math.PI * 1.95); g.stroke();
      g.lineWidth = Math.max(1, u * 0.08); ell(g, 0.15 * u, -0.15 * u, 0.14 * u, 0.2 * u); fs('#ff5a7a');
      break;
    case 'crown':
      g.beginPath(); g.moveTo(hx - 0.3 * u, ty + 0.06 * u); g.lineTo(hx - 0.34 * u, ty - 0.3 * u); g.lineTo(hx - 0.14 * u, ty - 0.12 * u); g.lineTo(hx, ty - 0.38 * u);
      g.lineTo(hx + 0.14 * u, ty - 0.12 * u); g.lineTo(hx + 0.34 * u, ty - 0.3 * u); g.lineTo(hx + 0.3 * u, ty + 0.06 * u); g.closePath(); fs('#ffd23f');
      ell(g, hx, ty - 0.08 * u, 0.05 * u, 0.05 * u); g.fillStyle = '#ff5a6a'; g.fill();
      break;
    case 'santa':
      g.beginPath(); g.moveTo(hx - 0.4 * u, ty + 0.05 * u); g.quadraticCurveTo(hx, ty - 0.6 * u, hx + 0.6 * u, ty - 0.2 * u); g.lineTo(hx + 0.38 * u, ty + 0.05 * u); g.closePath(); fs('#ff3b4f');
      roundRect(g, hx - 0.46 * u, ty - 0.04 * u, 0.9 * u, 0.16 * u, 0.08 * u); fs('#fff');
      ell(g, hx + 0.62 * u, ty - 0.2 * u, 0.1 * u, 0.1 * u); fs('#fff');
      break;
    case 'helmet':
      g.beginPath(); g.ellipse(hx, ty + 0.12 * u, 0.44 * u, 0.36 * u, 0, Math.PI, 0); g.closePath(); fs('#ffc93c');
      g.fillStyle = '#fff'; g.fillRect(hx - 0.05 * u, ty - 0.22 * u, 0.1 * u, 0.34 * u);
      roundRect(g, hx - 0.5 * u, ty + 0.06 * u, 1.0 * u, 0.1 * u, 0.05 * u); fs('#ffc93c');
      break;
  }
}
function paintBubble(g, x, y, text, fs, sc, al) {
  g.save();
  g.globalAlpha = al; g.translate(x, y); g.scale(sc, sc);
  g.font = fnt(800, fs);
  const bw = g.measureText(text).width + fs * 0.9, bh = fs * 1.55, by = -bh - fs * 0.45;
  g.fillStyle = '#fff'; g.strokeStyle = '#5a3d5c'; g.lineWidth = Math.max(1.2, fs * 0.12);
  g.beginPath(); g.moveTo(-fs * 0.3, -fs * 0.5); g.lineTo(0, 0); g.lineTo(fs * 0.3, -fs * 0.5); g.closePath(); g.fill(); g.stroke();
  roundRect(g, -bw / 2, by, bw, bh, bh / 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-fs * 0.2, -fs * 0.52); g.lineTo(0, -fs * 0.12); g.lineTo(fs * 0.2, -fs * 0.52); g.closePath(); g.fill();
  g.fillStyle = '#5a3d5c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 0, by + bh / 2 + fs * 0.04);
  g.restore();
}

/* ================= 状態・レイアウト ================= */
const SOIL = '#fff3dc';
// NEST_SCALE：巣穴の大きさ（1＝前の大きさ）。置き場所に入りきらないときは自動で小さくなる
const NEST_SCALE = 1.9;
const stage = $('#stage'), canvas = $('#game'), ctx = canvas.getContext('2d'), fxCv = $('#fx'), fxG = fxCv.getContext('2d');
const G = {
  levelId: 1, level: null, s: null, undo: [], moves: [], loading: false, loadTok: 0,
  vgrid: null, vver: 0, vcache: new Map(), vcacheVer: -1, boardDirty: true, boardSoft: false, boardT: 0,
  // pgrid：アリが向かっている途中のマスも「空き」とみなした盤面（まとめて出発させるための道さがし用）
  pgrid: null, pver: 0, pcache: new Map(), pcacheVer: -1,
  vboxes: [], vslots: [], ants: [], parts: [], bubbles: [], popups: [], trayOff: [],
  vleft: 0, pendingWin: false, pendingJam: false, jamDismissed: false, endT: 0, clearShown: false, clearTok: 0, nextBusy: false,
  hintCol: -1, preview: null, press: null, shake: null, queued: null, slotFreed: false,
  combo: 0, comboT: -9, slowmo: 0, time: 0, rt: 0, speed: 1, antSpeed: 8,
  nestBounce: 0, slotFlash: 0, jamShake: 0, overlay: 'title', reveal: null, saidOnce: false,
  rc: new Map(), hudDirty: true, fromTitle: false, helpFrom: 'title', lastVib: 0, lastSay: -9, rewindTok: 0, rewindTo: -1,
  auto: false, autoNext: 0, autoClearT: 0, autoPath: null, autoAt: -1, genBusy: false, viewId: 1,
  // 育成・やりこみ
  gold: new Set(), fever: { g: 0, t: 0 }, run: null, perk: perks(), par: null, spdMul: 1, fvShown: -1, timerShown: -1,
  feeding: null, colAnts: null, colFlash: 0, gacha: null, sayT: -9, dailyP: null
};
let CW = 0, CH = 0, dpr = 1, cs = 20, ox = 0, oy = 0, antPx = 20, antU = 10, nestR = 18, nestX = 0, nestY = 0;
let slotSize = 50, slotGap = 10, slotY = 0, trayTop = 0, trayHeadY = 0, trayGap = 30, headSize = 50, colW = 80;
let cubeSpr = [], cubeRes = [], candySpr = [];
const antCache = new Map(), boardCv = document.createElement('canvas'), boardG = boardCv.getContext('2d');

function layout() {
  const r = stage.getBoundingClientRect();
  CW = r.width; CH = r.height;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(CW * dpr)); canvas.height = Math.max(1, Math.round(CH * dpr));
  Fx.resize();
  if (!G.s) return;
  // 上から「絵の板」「巣穴の場所（nestH）」「スロット」「トレイ」の順に並べる
  const W = G.s.W, H = G.s.H, trayH = clamp(CH * 0.25, 120, 210), slotH = clamp(CH * 0.13, 64, 100), nestH = clamp(CH * 0.085, 46, 78);
  const boardH = CH - trayH - slotH - nestH - 6;
  cs = clamp(Math.floor(Math.min((CW - 32) / (W + 2), (boardH - 26) / (H + 2)) * 4) / 4, 3, 46);
  ox = (CW - (W + 2) * cs) / 2 + cs;
  oy = 12 + (boardH - 20 - (H + 2) * cs) / 2 + cs;
  slotSize = Math.max(28, Math.min((CW - 24) / SLOT_COUNT - 10, slotH * 0.7, 62));
  slotGap = Math.max(4, Math.min(14, (CW - 24 - slotSize * SLOT_COUNT) / (SLOT_COUNT - 1)));
  slotY = boardH + nestH + slotH * 0.5 + 4;
  trayTop = boardH + nestH + slotH + 4;
  colW = Math.min((CW - 16) / G.s.cols.length, 120);
  headSize = Math.max(30, Math.min(colW * 0.62, (trayH - 22) / 2.25, 66));
  trayHeadY = trayTop + headSize * 0.5 + 12;
  trayGap = headSize * 0.62;
  antPx = clamp(cs * 1.4, 13, 30); antU = antPx / 2;
  // 巣穴：板の外（板の下のふちとスロットのあいだ）。nestX, nestY は穴のまんなか
  const frameBot = oy + (H + 1) * cs + 14, slotTop = slotY - slotSize * 0.64;
  nestR = clamp(Math.min(antPx * 0.95 * NEST_SCALE, (slotTop - frameBot) / 2.3), 12, 50);
  nestX = CW / 2;
  nestY = Math.min(frameBot + 6 + nestR * 0.6, (frameBot + slotTop) / 2 - nestR * 0.16);
  antCache.clear();
  buildSprites();
  G.boardDirty = true;
}
const slotX = i => CW / 2 + (i - (SLOT_COUNT - 1) / 2) * (slotSize + slotGap);
const trayX = j => CW / 2 + (j - (G.s.cols.length - 1) / 2) * colW;
const toW = (gx, gy) => ({ x: ox + (gx - 0.5) * cs, y: oy + (gy - 0.5) * cs });
function slotEntry(i) { return { ex: clamp(Math.round((slotX(i) - ox) / cs + 0.5), 0, G.s.W + 1), ey: G.s.H + 1 }; }
// 巣穴の門：板の下のふちのうち、巣穴の真上にあるマス（アリはここから板の外に出て巣穴へ入る）
function nestGate() { return { ex: clamp(Math.round((nestX - ox) / cs + 0.5), 0, G.s.W + 1), ey: G.s.H + 1 }; }
// 巣穴の穴の位置（マス単位。アリの座標と同じ単位）
function nestHole() { return { x: (nestX - ox) / cs + 0.5, y: (nestY - oy) / cs + 0.5 }; }
function makeCube(ci, px, washed) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d');
  paintCandy(g, 0, 0, px, ci);
  if (save.settings.cb && px >= 16) {
    g.font = '700 ' + Math.round(px * 0.42) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = LIGHT.has(ci) ? 'rgba(70,50,60,.75)' : 'rgba(255,255,255,.92)';
    g.fillText(SYM[ci], px / 2, px * 0.45);
  }
  if (washed) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, 0, px, px); }
  return c;
}
function buildSprites() {
  const px = Math.max(3, Math.round(cs * dpr)), cp = Math.max(8, Math.round(antU * 1.3 * dpr));
  cubeSpr = HEX.map((h, i) => makeCube(i, px, false));
  cubeRes = HEX.map((h, i) => makeCube(i, px, true));
  candySpr = HEX.map((h, i) => makeCube(i, cp, false));
}
function antSprite(c, pose, fr) {
  const k = c * 16 + pose * 4 + fr;
  let cv = antCache.get(k);
  if (!cv) {
    const u = antU * dpr;
    cv = document.createElement('canvas');
    cv.width = Math.ceil(u * 2.6); cv.height = Math.ceil(u * 3.2);
    const g = cv.getContext('2d');
    g.translate(u * 1.25, u * 2.0);
    drawAntShape(g, u, c, pose, fr, save.skin);
    antCache.set(k, cv);
  }
  return cv;
}

/* ================= アリのシミュレーション ================= */
function visDist(ex, ey) {
  if (G.vcacheVer !== G.vver) { G.vcache = new Map(); G.vcacheVer = G.vver; }
  const k = ey * 1000 + ex;
  let d = G.vcache.get(k);
  if (!d) { d = bfs(G.vgrid, G.s.W, G.s.H, ex, ey); G.vcache.set(k, d); }
  return d;
}
// 向かっている途中のマスを通れるとみなした距離。これで、奥のキャンディ担当のアリも同時に出発できる
function planDist(ex, ey) {
  if (G.pcacheVer !== G.pver) { G.pcache = new Map(); G.pcacheVer = G.pver; }
  const k = ey * 1000 + ex;
  let d = G.pcache.get(k);
  if (!d) { d = bfs(G.pgrid, G.s.W, G.s.H, ex, ey); G.pcache.set(k, d); }
  return d;
}
function pathFrom(dist, goal, EW, EH) {
  const out = [goal];
  let cur = goal, guard = 0;
  while (dist[cur] > 0 && guard++ < 20000) {
    const cx = cur % EW, cy = (cur - cx) / EW;
    let nx = -1;
    for (let k = 0; k < 4; k++) {
      const x = cx + DX[k], y = cy + DY[k];
      if (x >= 0 && y >= 0 && x < EW && y < EH && dist[y * EW + x] === dist[cur] - 1) { nx = y * EW + x; break; }
    }
    if (nx < 0) break;
    cur = nx; out.push(cur);
  }
  return out.reverse();
}

/* ---- アリの列の間隔 ---- */
// ANT_GAP：同じ向きに進むアリ同士の間隔（アリ1匹の長さの何倍か）。大きいほど離れる
const ANT_GAP = 1.3;
// アリは盤面の細かさに関係なく同じ大きさで描くので、間隔をマス数に直す
function gapCells() { return antPx * 1.05 * ANT_GAP / cs; }
// 同じ箱から出た仲間がすぐ前にいたら、スピードを落とす（止まりきらないので行列は詰まらない）
// ちがう箱のアリ（ちがう色のアリなど）とは間隔をとらず、そのまますれちがう・重なる
function followFactor(a, gap) {
  let f = 1;
  const g2 = gap * gap;
  for (const o of G.ants) {
    if (o === a || o.vb !== a.vb || (o.state !== 'out' && o.state !== 'back')) continue;
    const dx = o.x - a.x, dy = o.y - a.y;
    if (dx * dx + dy * dy >= g2) continue;
    if (o.hx * a.hx + o.hy * a.hy < 0.7) continue;
    const ahead = dx * a.hx + dy * a.hy;
    if (ahead <= 0.02) continue;
    if (Math.abs(dx * a.hy - dy * a.hx) > gap * 0.45) continue;
    f = Math.min(f, clamp((ahead - gap * 0.55) / (gap * 0.45), 0.12, 1));
  }
  return f;
}
function tryDispatch(b) {
  if (!b.queue.length || G.ants.length >= MAX_ANTS) return;
  if (!G.lastOut) G.lastOut = [];
  // 同じスロットから最後に出たアリが、アリ1匹ぶん以上進むまで待つ
  const last = G.lastOut[b.slot];
  if (last && last.state === 'out' && last.trav < gapCells()) return;
  const W = G.s.W, EW = W + 2, EH = G.s.H + 2, en = slotEntry(b.slot), dist = planDist(en.ex, en.ey);
  for (let q = 0; q < b.queue.length; q++) {
    const cell = b.queue[q], x = cell % W, y = (cell - x) / W, ci = (y + 1) * EW + (x + 1);
    let best = -1, bd = 1e9;
    for (const ni of [ci - 1, ci + 1, ci - EW, ci + EW]) if (dist[ni] >= 0 && dist[ni] < bd) { bd = dist[ni]; best = ni; }
    if (best < 0) continue;
    b.queue.splice(q, 1);
    b.dispatched++;
    G.pgrid[cell] = -1; G.pver++;
    const path = pathFrom(dist, best, EW, EH), pts = [{ x: (slotX(b.slot) - ox) / cs + 0.5, y: (slotY - slotSize * 0.3 - oy) / cs + 0.5 }];
    for (const ei of path) pts.push({ x: ei % EW, y: Math.floor(ei / EW) });
    const p0 = pts[0], p1 = pts[1] || p0, L0 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    const ant = { vb: b, c: b.c, cell, tx: x + 1, ty: y + 1, pts, i: 0, d: 0, x: p0.x, y: p0.y, face: 1, state: 'out', t: 0, phase: Math.random() * 6, speed: G.antSpeed * G.spdMul * (0.97 + Math.random() * 0.06), sweat: Math.random() * 2, said: false, lifted: false, trav: 0, hx: (p1.x - p0.x) / L0, hy: (p1.y - p0.y) / L0 };
    G.ants.push(ant);
    G.lastOut[b.slot] = ant;
    if (b.dispatched === 1) maybeSay(ant, 'go', 0.3);
    return;
  }
}
function moveAlong(a, dist) {
  const p = a.pts;
  while (dist > 0 && a.i < p.length - 1) {
    const A = p[a.i], B = p[a.i + 1], L = Math.hypot(B.x - A.x, B.y - A.y) || 1e-6, rem = L - a.d;
    if (dist < rem) { a.d += dist; dist = 0; } else { dist -= rem; a.i++; a.d = 0; }
  }
  if (a.i >= p.length - 1) { a.x = p[p.length - 1].x; a.y = p[p.length - 1].y; return true; }
  const A = p[a.i], B = p[a.i + 1], L = Math.hypot(B.x - A.x, B.y - A.y) || 1e-6, t = a.d / L;
  a.x = A.x + (B.x - A.x) * t; a.y = A.y + (B.y - A.y) * t;
  // 進む向き（同じ向きのアリ同士の間隔を保つのに使う）
  a.hx = (B.x - A.x) / L; a.hy = (B.y - A.y) / L;
  if (Math.abs(B.x - A.x) > 0.01) a.face = B.x > A.x ? 1 : -1;
  return false;
}
// kind：base.js の TALK の場面名。force=true は間隔の制限を無視して必ずしゃべる
function maybeSay(a, kind, p, force) {
  if (!save.settings.talk) return;
  if (!G.saidOnce) p = 1;
  if (!force && (G.bubbles.length >= 3 || G.rt - G.lastSay < 0.5 || Math.random() > p)) return;
  if (G.bubbles.length >= 4) G.bubbles.shift();
  G.saidOnce = true; G.lastSay = G.rt;
  G.bubbles.push({ a, text: talkLine(kind, a.c, G.level && G.level.theme), t: 0, life: 1.4 });
  Sound.squeak();
}
function popup(text, x, y, col, big) {
  G.popups.push({ text, x, y, col: col || '#fff', t: 0, life: big ? 1.3 : 0.95, big: !!big });
  if (G.popups.length > 8) G.popups.shift();
}
function eraseCell(i) {
  const W = G.s.W, x = i % W, y = (i - x) / W;
  boardG.setTransform(dpr, 0, 0, dpr, 0, 0);
  boardG.fillStyle = SOIL;
  boardG.fillRect(ox + x * cs - 0.3, oy + y * cs - 0.3, cs + 0.6, cs + 0.6);
}
const COMBO_MARK = [10, 20, 30, 50, 75, 100, 150, 200, 300, 500];
function startFever() {
  const R = G.run;
  G.fever.g = 0; G.fever.t = G.perk.feverT;
  if (R) R.fevers++;
  document.body.classList.add('fever');
  Sound.BPM = 124; Sound.fever(); haptic(25);
  popup('FEVER!!', CW / 2, oy + G.s.H * cs * 0.4, '#ff5a9a', true);
  const r = canvas.getBoundingClientRect();
  Fx.burst(r.left + CW / 2, r.top + oy + G.s.H * cs / 2, 40, 360, ['star', 'dot']);
  const a = G.ants[G.ants.length - 1];
  if (a) maybeSay(a, 'fever', 1, true);
}
function endFever() { G.fever.t = 0; document.body.classList.remove('fever'); Sound.BPM = 108; }
function pickCube(a) {
  if (G.vgrid[a.cell] >= 0) { G.vgrid[a.cell] = -1; G.vver++; G.vleft--; eraseCell(a.cell); G.boardSoft = true; }
  a.vb.picked++;
  if (Math.abs(a.tx - a.x) > 0.01) a.face = a.tx > a.x ? 1 : -1;
  const w = toW(a.tx, a.ty), R = G.run, fev = G.fever.t > 0;
  for (let k = 0; k < (fev ? 7 : 5); k++) G.parts.push({ x: w.x, y: w.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 140 - 40, life: 0, max: 0.4, col: fev && k % 2 ? pick(POP) : HEX[a.c], s: Math.max(2.5, antPx * 0.16), star: k === 0 });
  if (G.time - G.comboT > G.perk.combo) G.combo = 0;
  Sound.pop(G.combo++);
  G.comboT = G.time;
  if (G.rt - G.lastVib > 0.09) { haptic(8); G.lastVib = G.rt; }
  G.hudDirty = true;
  let said = false;
  if (R) {
    R.candies++; R.food += fev ? 2 : 1;
    if (G.combo > R.maxCombo) R.maxCombo = G.combo;
    if (fev && R.candies % 4 === 0) R.fcoin++;
    if (G.gold.has(a.cell)) {
      G.gold.delete(a.cell); R.gold++;
      popup('金のキャンディ！', clamp(w.x, 80, CW - 80), w.y - antPx, '#ffd23f');
      Sound.gold(); maybeSay(a, 'gold', 1, true); said = true;
      for (let k = 0; k < 10; k++) G.parts.push({ x: w.x, y: w.y, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 220 - 60, life: 0, max: 0.7, col: '#ffd23f', s: Math.max(3, antPx * 0.22), star: true });
    }
    // フィーバー：小さい面でも大きい面でも、1面で2〜3回たまるくらいの速さ
    if (!fev) { G.fever.g += 2.0 / G.level.total * (1 + Math.min(G.combo, 30) / 30) * G.perk.fever; if (G.fever.g >= 1) startFever(); }
    if (COMBO_MARK.indexOf(G.combo) >= 0) {
      popup(G.combo + ' コンボ！', CW / 2, oy + G.s.H * cs * 0.22, G.combo >= 50 ? '#ffd23f' : '#ffffff');
      if (!said) { maybeSay(a, 'combo', 0.9); said = true; }
    }
  }
  if (!said) maybeSay(a, 'pick', 0.4);
  if (G.vleft === 0 && G.pendingWin) {
    G.slowmo = 0.5;
    const r = canvas.getBoundingClientRect();
    Fx.burst(r.left + CW / 2, r.top + oy + G.s.H * cs / 2, 60, 420, ['star', 'conf', 'dot']);
    Sound.boom();
  }
}
// 帰り道：板の中の道 → 巣穴の真上の門（板の下のふち） → 板の外の巣穴の穴
function startReturn(a) {
  const W = G.s.W, H = G.s.H, EW = W + 2, EH = H + 2, ne = nestGate(), dist = planDist(ne.ex, ne.ey), last = a.pts[a.pts.length - 1];
  const cur = Math.round(last.y) * EW + Math.round(last.x), pts = [{ x: a.x, y: a.y }];
  if (dist[cur] >= 0) for (const ei of pathFrom(dist, cur, EW, EH).reverse()) pts.push({ x: ei % EW, y: Math.floor(ei / EW) });
  else pts.push({ x: ne.ex, y: ne.ey });
  pts.push(nestHole());
  a.pts = pts; a.i = 0; a.d = 0; a.state = 'back'; a.t = 0;
}
function updateAnts(dt) {
  const fm = G.fever.t > 0 ? 1.4 : 1, gap = gapCells();
  for (let k = G.ants.length - 1; k >= 0; k--) {
    const a = G.ants[k];
    a.phase += dt * (a.state === 'back' ? 10 : 14);
    if (a.state === 'pick') {
      a.t += dt * fm;
      if (!a.lifted && a.t > PICK * 0.35) { a.lifted = true; maybeSay(a, 'lift', 0.3); }
      if (a.t >= PICK) startReturn(a);
      continue;
    }
    if (a.state === 'enter') { a.t += dt; if (a.t >= ENTER) G.ants.splice(k, 1); continue; }
    const step = a.speed * (a.state === 'back' ? 0.78 : 1) * fm * dt * followFactor(a, gap);
    a.trav = (a.trav || 0) + step;
    const done = moveAlong(a, step);
    if (a.state === 'back') {
      a.sweat -= dt;
      if (a.sweat < 0) a.sweat = 1.4 + Math.random() * 1.5;
      if (!a.said && a.i > a.pts.length * 0.45) { a.said = true; maybeSay(a, 'carry', 0.12); }
    }
    if (done) {
      if (a.state === 'out') { a.state = 'pick'; a.t = 0; pickCube(a); }
      else {
        a.state = 'enter'; a.t = 0; G.nestBounce = 1; Sound.thump();
        if (Math.random() < 0.25) G.parts.push({ x: nestX, y: nestY - nestR * 0.4, vx: (Math.random() - 0.5) * 60, vy: -90, life: 0, max: 0.5, col: '#ffd45e', s: antPx * 0.3, star: true });
        // にぎわっているときは、穴のふちから土の粒がこぼれる
        if (G.ants.length >= 4 && Math.random() < 0.5) {
          for (let q = 0; q < 2; q++) G.parts.push({ x: nestX + (Math.random() - 0.5) * nestR * 1.2, y: nestY - nestR * 0.05, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 60, life: 0, max: 0.45, col: Math.random() < 0.5 ? '#c98a52' : '#a86a3a', s: Math.max(2.5, nestR * 0.12), star: false });
        }
        maybeSay(a, 'home', 0.03);
      }
    }
  }
  for (let i = G.bubbles.length - 1; i >= 0; i--) { G.bubbles[i].t += dt; if (G.bubbles[i].t > G.bubbles[i].life) G.bubbles.splice(i, 1); }
}
function updateBoxes(dt) {
  for (let k = G.vboxes.length - 1; k >= 0; k--) {
    const b = G.vboxes[k];
    b.t += dt;
    if (b.state === 'fly' && b.t >= 0.24) { b.state = 'land'; b.t = 0; Sound.land(); }
    else if (b.state === 'land' && b.t >= 0.14) { b.state = 'slot'; b.t = 0; }
    else if (b.state === 'slot') {
      if (b.t > 0.08) tryDispatch(b);
      if (b.logicalDone && b.dispatched >= b.total && !b.queue.length) { b.state = 'leave'; b.t = 0; Sound.boxOut(); }
    } else if (b.state === 'leave' && b.t >= 0.22) {
      if (G.vslots[b.slot] === b) G.vslots[b.slot] = null;
      G.vboxes.splice(k, 1); G.slotFreed = true;
    }
  }
  if (G.slotFreed) {
    G.slotFreed = false;
    if (G.queued) { const q = G.queued; G.queued = null; if (G.rt < q.until) onTapCol(q.j); }
  }
}
function updateParts(dt) {
  for (let i = G.parts.length - 1; i >= 0; i--) {
    const p = G.parts[i];
    p.life += dt;
    if (p.life >= p.max) { G.parts.splice(i, 1); continue; }
    p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = G.popups.length - 1; i >= 0; i--) { const p = G.popups[i]; p.t += dt; if (p.t >= p.life) G.popups.splice(i, 1); }
}
function checkEnd(rdt) {
  if (G.overlay || G.loading) return;
  if (G.pendingWin) {
    if (!G.clearShown && G.ants.length === 0 && G.vboxes.length === 0) { G.endT += rdt; if (G.endT > 0.35) showClear(); }
    return;
  }
  if (G.pendingJam && !G.jamDismissed) {
    const busy = G.ants.length > 0 || G.vboxes.some(b => b.state !== 'slot' || b.logicalDone || b.queue.length);
    if (!busy) { G.endT += rdt; if (G.endT > 0.35) showJam(); } else G.endT = 0;
  }
}

/* ================= 描画 ================= */
function renderBoard() {
  G.boardDirty = false; G.boardSoft = false; G.boardT = G.rt;
  if (boardCv.width !== canvas.width || boardCv.height !== canvas.height) { boardCv.width = canvas.width; boardCv.height = canvas.height; }
  const g = boardG, W = G.s.W, H = G.s.H, EW = W + 2, pad = 10;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, boardCv.width, boardCv.height);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const x0 = ox - cs - pad, y0 = oy - cs - pad, bw = (W + 2) * cs + pad * 2, bh = (H + 2) * cs + pad * 2;
  // 木の額縁
  g.fillStyle = 'rgba(80,50,30,.22)'; roundRect(g, x0 + 2, y0 + 8, bw, bh, 24); g.fill();
  const wood = g.createLinearGradient(0, y0, 0, y0 + bh);
  wood.addColorStop(0, '#ffe2a8'); wood.addColorStop(1, '#f0b063');
  g.fillStyle = wood; roundRect(g, x0, y0, bw, bh, 24); g.fill();
  g.strokeStyle = '#c47f3c'; g.lineWidth = 2.5; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5; g.setLineDash([5, 5]);
  roundRect(g, x0 + 4.5, y0 + 4.5, bw - 9, bh - 9, 20); g.stroke(); g.setLineDash([]);
  // 土の面（水玉と上の影）
  const ix = ox - cs, iy = oy - cs, iw = (W + 2) * cs, ih = (H + 2) * cs, ir = Math.max(6, cs * 0.8);
  g.fillStyle = SOIL; roundRect(g, ix, iy, iw, ih, ir); g.fill();
  g.save(); roundRect(g, ix, iy, iw, ih, ir); g.clip();
  g.fillStyle = 'rgba(236,200,150,.35)';
  for (let y = iy + 9, r = 0; y < iy + ih; y += 18, r++) for (let x = ix + (r % 2 ? 18 : 9); x < ix + iw; x += 18) { g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill(); }
  const sh = g.createLinearGradient(0, iy, 0, iy + 14);
  sh.addColorStop(0, 'rgba(150,90,40,.2)'); sh.addColorStop(1, 'rgba(150,90,40,0)');
  g.fillStyle = sh; g.fillRect(ix, iy, iw, 14);
  g.restore();
  // 角の葉っぱ
  g.fillStyle = '#7ccf6a';
  for (const [lx, ly, rot] of [[x0 + 10, y0 + 5, -0.6], [x0 + 23, y0 + 1, 0.3], [x0 + bw - 10, y0 + bh - 5, -0.6], [x0 + bw - 23, y0 + bh - 1, 0.4]]) { ell(g, lx, ly, 9, 4.5, rot); g.fill(); }
  const ne = nestGate(), dist = visDist(ne.ex, ne.ey);
  g.fillStyle = '#ecd2ae';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (G.vgrid[y * W + x] < 0 && dist[(y + 1) * EW + x + 1] < 0) g.fillRect(ox + x * cs, oy + y * cs, cs + 0.5, cs + 0.5);
  }
  const wash = save.settings.wash;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, v = G.vgrid[i];
    if (v >= 0) g.drawImage(wash && G.s.grid[i] < 0 ? cubeRes[v] : cubeSpr[v], ox + x * cs, oy + y * cs, cs, cs);
  }
}
// 金のキャンディ：ピカピカ光らせる
function drawGold() {
  if (!G.gold.size) return;
  const W = G.s.W, tw = 0.5 + 0.5 * Math.sin(G.rt * 6);
  for (const i of G.gold) {
    if (G.vgrid[i] < 0) continue;
    const x = ox + (i % W + 0.5) * cs, y = oy + (Math.floor(i / W) + 0.5) * cs, r = Math.max(4, cs * 0.5);
    ctx.fillStyle = 'rgba(255,215,64,' + (0.35 + 0.3 * tw) + ')'; ctx.fillRect(x - cs / 2, y - cs / 2, cs, cs);
    ctx.strokeStyle = '#fff2a0'; ctx.lineWidth = Math.max(1, cs * 0.12); ctx.strokeRect(x - cs / 2 + 0.5, y - cs / 2 + 0.5, cs - 1, cs - 1);
    ctx.fillStyle = '#fff'; starPath(ctx, x, y, r * (0.7 + 0.3 * tw), r * 0.3, 4); ctx.fill();
  }
}
function drawFever() {
  if (G.fever.t <= 0) return;
  const W = G.s.W, H = G.s.H, bx = ox - cs - 9, by = oy - cs - 9, bw = (W + 2) * cs + 18, bh = (H + 2) * cs + 18;
  ctx.lineWidth = 5; ctx.strokeStyle = 'hsl(' + ((G.rt * 240) % 360) + ',95%,62%)';
  roundRect(ctx, bx, by, bw, bh, 24); ctx.stroke();
  const txt = 'FEVER ' + G.fever.t.toFixed(1);
  ctx.font = fnt(900, 13);
  const tw = ctx.measureText(txt).width + 18;
  ctx.fillStyle = 'hsl(' + ((G.rt * 240 + 180) % 360) + ',90%,60%)'; roundRect(ctx, CW / 2 - tw / 2, by - 9, tw, 20, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, CW / 2, by + 1);
}
// 巣穴：板の外に置く土の山。(nestX, nestY) が穴のまんなか
function drawNest() {
  const g = ctx, r = nestR, x = nestX, y = nestY, my = y + r * 0.45, b = G.nestBounce;
  g.save();
  g.lineJoin = 'round'; g.lineCap = 'round';
  // 地面の影
  g.fillStyle = 'rgba(90,50,30,.22)'; ell(g, x, my + r * 0.36, r * 1.8, r * 0.34); g.fill();
  // 小石
  for (const [px, py, pr] of [[-1.78, 0.22, 0.13], [-1.52, 0.44, 0.08], [1.74, 0.28, 0.12], [1.48, 0.46, 0.08]]) {
    ell(g, x + px * r, my + py * r, pr * r * 1.3, pr * r); g.fillStyle = '#d8c6b4'; g.fill();
    g.strokeStyle = '#9c8470'; g.lineWidth = 1.2; g.stroke();
  }
  // 草
  g.fillStyle = '#6cc35a';
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const bx = x + s * r * (1.95 + k * 0.12), by = my + r * 0.18;
    g.beginPath(); g.moveTo(bx - r * 0.07, by); g.lineTo(bx + s * r * (0.05 + k * 0.05), by - r * (0.42 - k * 0.1)); g.lineTo(bx + r * 0.07, by); g.closePath(); g.fill();
  }
  // 旗（土の山のうしろに立てる）
  const fx = x + r * 1.05, ft = my - r * 1.8;
  g.strokeStyle = '#8a5530'; g.lineWidth = Math.max(1.5, r * 0.07);
  g.beginPath(); g.moveTo(fx, my - r * 0.35); g.lineTo(fx, ft); g.stroke();
  g.fillStyle = G.fever.t > 0 ? 'hsl(' + ((G.rt * 240) % 360) + ',90%,60%)' : '#ff6f9f';
  g.beginPath(); g.moveTo(fx, ft); g.lineTo(fx + r * 0.7, ft + r * 0.2 + Math.sin(G.rt * 6) * r * 0.06); g.lineTo(fx, ft + r * 0.42); g.closePath(); g.fill();
  // 土の山（アリが入るとはずむ）
  g.save(); g.translate(x, my); g.scale(1 + 0.1 * b, 1 - 0.08 * b);
  const dome = () => { g.beginPath(); g.ellipse(0, 0, r * 1.55, r * 1.0, 0, Math.PI, 0); g.ellipse(0, 0, r * 1.55, r * 0.34, 0, 0, Math.PI); g.closePath(); };
  const gr = g.createRadialGradient(-r * 0.5, -r * 0.75, r * 0.1, 0, -r * 0.2, r * 1.9);
  gr.addColorStop(0, '#ffe0ae'); gr.addColorStop(0.5, '#e4a868'); gr.addColorStop(1, '#b0703c');
  dome(); g.fillStyle = gr; g.fill();
  g.save(); dome(); g.clip();
  const sh = g.createLinearGradient(0, -r * 0.1, 0, r * 0.34);
  sh.addColorStop(0, 'rgba(120,66,30,0)'); sh.addColorStop(1, 'rgba(120,66,30,.45)');
  g.fillStyle = sh; g.fillRect(-r * 1.6, -r * 0.1, r * 3.2, r * 0.5);
  g.fillStyle = 'rgba(140,84,44,.45)';
  for (const [px, py] of [[-1.0, -0.25], [0.95, -0.35], [-0.35, -0.86], [0.6, -0.78], [1.22, 0.02], [-1.25, 0.04], [-0.75, 0.12], [0.4, 0.15]]) { ell(g, px * r, py * r, r * 0.07, r * 0.06); g.fill(); }
  g.restore();
  dome(); g.strokeStyle = '#8a5530'; g.lineWidth = Math.max(2, r * 0.08); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.45)'; ell(g, -r * 0.62, -r * 0.66, r * 0.34, r * 0.12, -0.45); g.fill();
  // 穴（ふち → 奥ほど暗い穴 → 手前のふちの光）
  g.fillStyle = '#f6d09a'; ell(g, 0, -r * 0.46, r * 0.76, r * 0.44); g.fill();
  g.strokeStyle = 'rgba(138,85,48,.6)'; g.lineWidth = Math.max(1.5, r * 0.05); g.stroke();
  const hg = g.createRadialGradient(0, -r * 0.36, r * 0.05, 0, -r * 0.45, r * 0.62);
  hg.addColorStop(0, '#120a07'); hg.addColorStop(0.7, '#3a2219'); hg.addColorStop(1, '#6a4330');
  g.fillStyle = hg; ell(g, 0, -r * 0.45, r * 0.6, r * 0.33); g.fill();
  g.strokeStyle = '#ffe9c4'; g.lineWidth = Math.max(1.5, r * 0.08);
  g.beginPath(); g.ellipse(0, -r * 0.45, r * 0.6, r * 0.33, 0, 0.2, Math.PI - 0.2); g.stroke();
  g.restore();
  g.restore();
}
function drawSlots() {
  const occ = G.vslots.filter(Boolean).length, danger = occ === SLOT_COUNT - 1;
  const bx = slotX(0) - slotSize * 0.72, bw = slotX(SLOT_COUNT - 1) - slotX(0) + slotSize * 1.44;
  ctx.fillStyle = 'rgba(255,255,255,.55)'; roundRect(ctx, bx, slotY - slotSize * 0.64, bw, slotSize * 1.28, slotSize * 0.4); ctx.fill();
  for (let i = 0; i < SLOT_COUNT; i++) {
    const x = slotX(i), w = slotSize * 1.08, h = slotSize * 0.98;
    const gr = ctx.createLinearGradient(0, slotY - h / 2, 0, slotY + h / 2);
    gr.addColorStop(0, '#f6fdf1'); gr.addColorStop(1, '#dcf2cf');
    ctx.fillStyle = gr; roundRect(ctx, x - w / 2, slotY - h / 2, w, h, slotSize * 0.3); ctx.fill();
    let a = 0.6;
    if (!G.vslots[i] && danger) a = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(G.rt * 6));
    ctx.strokeStyle = G.slotFlash > 0 ? 'rgba(255,80,110,' + (0.5 + 0.5 * G.slotFlash) + ')' : (danger && !G.vslots[i]) ? 'rgba(255,110,130,' + a + ')' : 'rgba(110,190,95,' + a + ')';
    ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
    if (!G.vslots[i]) {
      ctx.fillStyle = 'rgba(110,170,95,.35)'; ctx.font = fnt(900, slotSize * 0.32); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, slotY);
    }
  }
}
function drawBox(x, y, sz, ci, num, o) {
  o = o || {};
  const sh = SHADE[ci], al = o.alpha == null ? 1 : o.alpha, w = sz, h = sz * 0.82, r = sz * 0.24;
  ctx.save(); ctx.translate(x, y); ctx.scale(o.sx || 1, o.sy || 1); ctx.globalAlpha = al;
  ctx.fillStyle = 'rgba(120,60,90,.16)'; ell(ctx, 0, h * 0.52, w * 0.46, sz * 0.07); ctx.fill();
  if (o.peek) {
    const hr = sz * 0.17, bob = Math.sin(G.rt * 6 + x) * hr * 0.15, hy = -h / 2 - hr * 0.45 + bob;
    ctx.strokeStyle = sh.ol; ctx.lineWidth = Math.max(1, sz * 0.03);
    ctx.beginPath(); ctx.moveTo(-hr * 0.4, hy - hr * 0.7); ctx.lineTo(-hr * 0.8, hy - hr * 1.6); ctx.moveTo(hr * 0.4, hy - hr * 0.7); ctx.lineTo(hr * 0.8, hy - hr * 1.6); ctx.stroke();
    ctx.fillStyle = '#ff8fb3';
    for (const s of [-1, 1]) { ell(ctx, s * hr * 0.8, hy - hr * 1.6, hr * 0.25, hr * 0.25); ctx.fill(); }
    ctx.fillStyle = ANT_BODY[ci]; ell(ctx, 0, hy, hr, hr); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2030';
    for (const s of [-1, 1]) { ell(ctx, s * hr * 0.38, hy, hr * 0.15, hr * 0.2); ctx.fill(); }
  }
  ctx.fillStyle = sh.d; roundRect(ctx, -w / 2, -h / 2, w, h, r); ctx.fill();
  const gr = ctx.createLinearGradient(0, -h / 2, 0, h * 0.35);
  gr.addColorStop(0, sh.l2); gr.addColorStop(1, HEX[ci]);
  ctx.fillStyle = gr; roundRect(ctx, -w / 2, -h / 2, w, h * 0.88, r); ctx.fill();
  ctx.fillStyle = o.peek ? 'rgba(60,30,50,.35)' : 'rgba(255,255,255,.35)';
  roundRect(ctx, -w * 0.38, -h * 0.42, w * 0.76, h * 0.16, h * 0.08); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(ctx, -w * 0.3, -h * 0.1, w * 0.06, w * 0.06); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(1.5, sz * 0.04);
  roundRect(ctx, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, r); ctx.stroke();
  if (num != null) {
    const fs = sz * (String(num).length > 2 ? 0.3 : 0.38);
    ctx.font = fnt(900, fs); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2.5, fs * 0.2); ctx.strokeStyle = sh.ol; ctx.strokeText(String(num), 0, h * 0.1);
    ctx.fillStyle = '#fff'; ctx.fillText(String(num), 0, h * 0.1);
  }
  if (save.settings.cb) {
    ctx.font = '700 ' + Math.round(sz * 0.22) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(SYM[ci], w * 0.3, -h * 0.24);
  }
  ctx.restore();
}
function drawZz(x, y, sz) {
  const r = Math.max(7, sz * 0.16), bob = Math.sin(G.rt * 3) * 2;
  ctx.fillStyle = '#fff'; ell(ctx, x, y + bob, r, r); ctx.fill();
  ctx.fillStyle = '#a08ab0'; ctx.font = fnt(900, r * 1.1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', x, y + bob);
}
function drawTray() {
  const tg = ctx.createLinearGradient(0, trayTop, 0, CH);
  tg.addColorStop(0, '#fff1d0'); tg.addColorStop(1, '#ffd99a');
  ctx.fillStyle = 'rgba(160,100,40,.2)'; roundRect(ctx, 8, trayTop + 5, CW - 16, CH - trayTop - 6, 22); ctx.fill();
  ctx.fillStyle = tg; roundRect(ctx, 8, trayTop, CW - 16, CH - trayTop - 8, 22); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  for (let j = 0; j < G.s.cols.length; j++) {
    const col = G.s.cols[j], h = G.s.heads[j], rest = col.length - h;
    let x = trayX(j);
    if (G.shake && G.shake.j === j) x += Math.sin(G.shake.t * 60) * 7 * (G.shake.t / 0.24);
    if (rest <= 0) {
      ctx.strokeStyle = 'rgba(200,140,70,.45)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      roundRect(ctx, x - headSize / 2, trayHeadY - headSize * 0.42, headSize, headSize * 0.84, headSize * 0.24); ctx.stroke(); ctx.setLineDash([]);
      continue;
    }
    const off = G.trayOff[j], fr = trayGap > 0 ? off / trayGap : 0;
    for (let k = Math.min(3, rest) - 1; k >= 0; k--) {
      const b = col[h + k];
      let s = lerp(TSC[k], TSC[k + 1], fr) * headSize;
      if (k === 0 && G.press && G.press.j === j && !G.press.previewed) s *= 0.92;
      if (k === 0 && G.queued && G.queued.j === j) s *= 1 + 0.05 * Math.sin(G.rt * 20);
      if (k === 0 && save.settings.dim && !G.hc) G.hc = headCounts(G.s);
      const y = trayHeadY + k * trayGap + off, dim = k === 0 && save.settings.dim && !G.hc[j];
      drawBox(x, y, s, b.c, b.n, { alpha: lerp(TAL[k], TAL[k + 1], fr) * (dim ? 0.5 : 1) });
      if (dim) drawZz(x + s * 0.42, y - s * 0.4, s);
      if (k === 0 && save.settings.info) {
        if (!G.hc) G.hc = headCounts(G.s);
        const rr = G.hc[j] || 0, txt = rr + '/' + b.n;
        ctx.font = fnt(800, Math.max(10, s * 0.2));
        const tw = ctx.measureText(txt).width + 10, th = Math.max(14, s * 0.26);
        ctx.fillStyle = rr >= b.n ? '#3fae7f' : rr > 0 ? '#ff9a3c' : '#a08ab0';
        roundRect(ctx, x - tw / 2, y + s * 0.38, tw, th, th / 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + s * 0.38 + th / 2);
      }
    }
    if (rest > 3) {
      ctx.fillStyle = 'rgba(120,70,30,.75)'; ctx.font = fnt(800, headSize * 0.22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+' + (rest - 3), x, trayHeadY + 2 * trayGap + headSize * 0.52);
    }
  }
}
function drawSlotBoxes() {
  for (const b of G.vboxes) {
    let x = slotX(b.slot), y = slotY, sz = slotSize;
    const o = {}, num = b.total - b.dispatched;
    if (b.state === 'fly') {
      const t = clamp(b.t / 0.24, 0, 1), e = easeOutCubic(t);
      x = lerp(b.fx, x, e); y = lerp(b.fy, y, e) - Math.sin(Math.PI * t) * Math.min(70, CH * 0.09); sz = lerp(b.fs, slotSize, e);
    } else if (b.state === 'land') {
      const k = Math.sin(Math.PI * clamp(b.t / 0.14, 0, 1));
      o.sx = 1 + 0.12 * k; o.sy = 1 - 0.18 * k;
    } else if (b.state === 'leave') o.sx = o.sy = Math.max(0, 1 - easeInBack(clamp(b.t / 0.22, 0, 1)));
    if (G.jamShake > 0) x += Math.sin(G.rt * 60 + b.slot) * 3 * (G.jamShake / 0.4);
    o.peek = b.state === 'slot' && num > 0;
    drawBox(x, y, sz, b.c, b.state === 'fly' ? b.total : num, o);
    if (b.state === 'slot' && num > 0 && !b.queue.length) drawZz(x + sz * 0.45, y - sz * 0.45, sz);
  }
}
function drawAnts() {
  const u = antU, csz = u * 1.3;
  for (const a of G.ants) {
    const w = toW(a.x, a.y);
    let pose = 0, sx = 1, sy = 1, rot = 0, by = 0, lift = -1;
    const fr = Math.floor(a.phase) & 3;
    if (a.state === 'out') by = -Math.abs(Math.sin(a.phase * 0.8)) * u * 0.25;
    else if (a.state === 'pick') {
      const t = a.t / PICK;
      if (t < 0.35) { const k = Math.sin(t / 0.35 * Math.PI / 2); sx = 1 + 0.12 * k; sy = 1 - 0.16 * k; lift = 0; }
      else if (t < 0.75) { const k = (t - 0.35) / 0.4; pose = 2; sy = 1 + 0.1 * Math.sin(k * Math.PI); lift = easeOutBack(k); }
      else { pose = 1; lift = 1; }
    } else if (a.state === 'back') { pose = 1; lift = 1; rot = Math.sin(a.phase * 0.9) * 0.13; by = -Math.abs(Math.sin(a.phase * 0.9)) * u * 0.12; }
    else { pose = 1; lift = 1; const k = a.t / ENTER; sx = sy = 1 - k; by = k * u * 0.5; }
    ctx.save();
    ctx.translate(w.x, w.y - u * 0.25 + by); ctx.rotate(rot); ctx.scale(sx * a.face, sy);
    ctx.drawImage(antSprite(a.c, pose, pose === 2 ? 0 : fr), -u * 1.25, -u * 2.0, u * 2.6, u * 3.2);
    if (lift >= 0) {
      const cx = lerp(u * 1.0, u * 0.36, clamp(lift, 0, 1)), cy = lerp(u * 0.8 - csz / 2, -u * 1.02 - csz / 2, lift);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a.state === 'back' ? Math.sin(a.phase * 0.9 + 1) * 0.12 : 0);
      ctx.drawImage(candySpr[a.c], -csz / 2, -csz / 2, csz, csz);
      ctx.restore();
    }
    if (a.state === 'back' && a.sweat < 0.6) {
      const k = 1 - a.sweat / 0.6;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = '#7cc4ff';
      ctx.beginPath(); ctx.arc(-u * 0.1, -u * 0.5 + k * u * 0.4, u * 0.13, 0, Math.PI); ctx.lineTo(-u * 0.1, -u * 0.75 + k * u * 0.4); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
function drawFxLocal() {
  for (const p of G.parts) {
    ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.col;
    if (p.star) { starPath(ctx, p.x, p.y, p.s, p.s * 0.45, 5); ctx.fill(); } else { ell(ctx, p.x, p.y, p.s / 2, p.s / 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  for (const b of G.bubbles) {
    const w = toW(b.a.x, b.a.y), k = b.t / b.life, sc = b.t < 0.15 ? easeOutBack(b.t / 0.15) : 1;
    paintBubble(ctx, w.x, w.y - antU * 1.9, b.text, clamp(antPx * 0.55, 10, 14), sc, k > 0.8 ? (1 - k) / 0.2 : 1);
  }
}
function drawPopups() {
  for (const p of G.popups) {
    const k = p.t / p.life, sc = p.t < 0.18 ? easeOutBack(p.t / 0.18) : 1, fs = p.big ? 34 : 17;
    ctx.save();
    ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
    ctx.translate(p.x, p.y - k * (p.big ? 20 : 30)); ctx.scale(sc, sc);
    ctx.font = fnt(900, fs); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = fs * 0.28; ctx.strokeStyle = '#5a3d5c'; ctx.strokeText(p.text, 0, 0);
    ctx.fillStyle = p.col; ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
}
function drawPreview() {
  const P = G.preview;
  if (!P) return;
  const W = G.s.W, H = G.s.H;
  ctx.fillStyle = 'rgba(70,40,70,.45)'; roundRect(ctx, ox - cs, oy - cs, (W + 2) * cs, (H + 2) * cs, cs * 0.8); ctx.fill();
  P.cells.forEach((i, k) => {
    const x = ox + (i % W) * cs, y = oy + Math.floor(i / W) * cs;
    ctx.drawImage(cubeSpr[P.c], x, y, cs, cs);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, Math.min(2, cs * 0.15)); ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
    if (cs >= 14) {
      ctx.font = fnt(800, cs * 0.48); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(String(k + 1), x + cs / 2, y + cs / 2);
      ctx.fillStyle = '#fff'; ctx.fillText(String(k + 1), x + cs / 2, y + cs / 2);
    }
  });
  const msg = P.cells.length ? P.cells.length + ' / ' + P.n + ' 個を運ぶよ' + (P.cells.length < P.n ? '（残りは居座る）' : '') : '今は届くキャンディがないよ（おやすみ）';
  ctx.font = fnt(800, 13);
  const tw = ctx.measureText(msg).width + 24, ty = Math.max(16, oy - cs + 14);
  ctx.fillStyle = '#fff'; roundRect(ctx, CW / 2 - tw / 2, ty - 14, tw, 28, 14); ctx.fill();
  ctx.fillStyle = '#5a3d5c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, CW / 2, ty);
}
function drawGuides() {
  if (G.hintCol >= 0) {
    const j = G.hintCol;
    if (G.s.heads[j] >= G.s.cols[j].length) G.hintCol = -1;
    else {
      const x = trayX(j), p = 0.5 + 0.5 * Math.sin(G.rt * 7), S = headSize * (1.18 + 0.08 * p);
      ctx.strokeStyle = 'rgba(255,200,40,' + (0.6 + 0.4 * p) + ')'; ctx.lineWidth = 4;
      roundRect(ctx, x - S / 2, trayHeadY - S * 0.45, S, S * 0.9, S * 0.26); ctx.stroke();
      ctx.fillStyle = '#ffb020'; ctx.font = fnt(900, headSize * 0.34); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('▼', x, trayHeadY - S * 0.45 - 2 - p * 4);
    }
  }
  if (G.overlay || G.preview) return;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  if (G.levelId === 1 && G.moves.length < 3 && followsSolution()) {
    const j = G.level.solution[G.moves.length];
    if (j != null) { ctx.font = Math.round(headSize * 0.6) + 'px sans-serif'; ctx.fillText('👆', trayX(j) + headSize * 0.25, trayHeadY + headSize * 0.5 + Math.sin(G.rt * 6) * 6); }
  }
  if (G.levelId === 2 && !save.flags.lp && G.moves.length < 4) {
    const h = headsOf(G.s);
    if (!h.length) return;
    const x = trayX(h[0]), y = trayHeadY, p = (G.rt % 1.6) / 1.6;
    ctx.strokeStyle = 'rgba(255,143,179,' + (1 - p) + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, headSize * (0.3 + p * 0.45), 0, Math.PI * 2); ctx.stroke();
    ctx.font = Math.round(headSize * 0.55) + 'px sans-serif'; ctx.fillText('👆', x + headSize * 0.2, y + headSize * 0.2 + (p < 0.5 ? 0 : 3));
    paintBubble(ctx, x, y - headSize * 0.5, 'ながおしで確認！', 12, 1, 1);
  }
}
function followsSolution() {
  const sol = G.level.solution;
  if (G.moves.length > sol.length) return false;
  for (let i = 0; i < G.moves.length; i++) if (G.moves[i] !== sol[i]) return false;
  return true;
}
function draw() {
  if (G.boardDirty || (G.boardSoft && G.rt - (G.boardT || 0) > 0.35)) renderBoard();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(boardCv, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawGold(); drawFever(); drawNest(); drawSlots(); drawTray(); drawSlotBoxes(); drawAnts(); drawFxLocal(); drawPopups(); drawPreview(); drawGuides();
}

/* ================= 全画面エフェクト（紙吹雪・花火） ================= */
const Fx = {
  p: [], w: 0, h: 0,
  resize() { this.w = innerWidth; this.h = innerHeight; fxCv.width = Math.round(this.w * dpr); fxCv.height = Math.round(this.h * dpr); },
  add(o) { if (this.p.length < 700) this.p.push(o); },
  burst(x, y, n, sp, kinds) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.35 + Math.random() * 0.8);
      this.add({ k: kinds[i % kinds.length], x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.25, g: 520, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 5 + Math.random() * 7, c: pick(POP), l: 0, m: 1 + Math.random() * 0.8 });
    }
  },
  rain(n) {
    for (let i = 0; i < n; i++) this.add({ k: 'conf', x: Math.random() * this.w, y: -20 - Math.random() * this.h * 0.6, vx: (Math.random() - 0.5) * 60, vy: 80 + Math.random() * 120, g: 40, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10, s: 6 + Math.random() * 6, c: pick(POP), l: 0, m: 4 });
  },
  update(dt) {
    for (let i = this.p.length - 1; i >= 0; i--) {
      const p = this.p[i];
      p.l += dt;
      if (p.l > p.m || p.y > this.h + 40) { this.p.splice(i, 1); continue; }
      p.vy += p.g * dt; p.vx *= Math.pow(0.5, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
    }
  },
  draw() {
    const g = fxG;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fxCv.width, fxCv.height);
    if (!this.p.length) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const p of this.p) {
      g.globalAlpha = Math.min(1, (p.m - p.l) * 2.5); g.fillStyle = p.c;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      if (p.k === 'star') { starPath(g, 0, 0, p.s, p.s * 0.45, 5); g.fill(); }
      else if (p.k === 'dot') { ell(g, 0, 0, p.s * 0.45, p.s * 0.45); g.fill(); }
      else g.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6);
      g.restore();
    }
    g.globalAlpha = 1;
  }
};

AF_LOADED.push('render.js');