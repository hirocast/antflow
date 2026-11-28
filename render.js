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
    case 'beret':
      g.save(); g.translate(hx - 0.04 * u, ty); g.rotate(-0.15);
      ell(g, 0, 0, 0.48 * u, 0.22 * u); fs('#ff5a7a');
      g.beginPath(); g.moveTo(0, -0.22 * u); g.lineTo(-0.04 * u, -0.34 * u); g.stroke();
      g.restore();
      break;
    case 'cap':
      g.beginPath(); g.ellipse(hx - 0.05 * u, ty + 0.08 * u, 0.42 * u, 0.34 * u, 0, Math.PI, 0); g.closePath(); fs('#3da9fc');
      roundRect(g, hx + 0.05 * u, ty + 0.02 * u, 0.56 * u, 0.11 * u, 0.05 * u); fs('#2589d8');
      break;
    case 'bunny':
      for (const [x, r] of [[0.25, -0.18], [0.6, 0.15]]) {
        g.save(); g.translate(x * u, ty + 0.04 * u); g.rotate(r);
        ell(g, 0, -0.34 * u, 0.14 * u, 0.36 * u); fs('#fff');
        ell(g, 0, -0.32 * u, 0.07 * u, 0.22 * u); g.fillStyle = '#ff9cc8'; g.fill();
        g.restore();
      }
      break;
    case 'angel':
      g.save(); g.strokeStyle = '#ffd23f'; g.lineWidth = Math.max(1.5, u * 0.11);
      g.beginPath(); g.ellipse(hx, ty - 0.22 * u, 0.38 * u, 0.11 * u, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
      break;
    case 'devil':
      for (const s of [-1, 1]) {
        g.save();
        g.translate(hx + s * 0.34 * u, ty + 0.04 * u);
        g.beginPath();
        g.moveTo(-s * 0.13 * u, 0.08 * u);
        g.quadraticCurveTo(s * 0.24 * u, -0.14 * u, s * 0.28 * u, -0.48 * u);
        g.quadraticCurveTo(s * 0.06 * u, -0.22 * u, s * 0.12 * u, 0.06 * u);
        g.closePath();
        g.strokeStyle = '#4a1228';
        fs('#e6224b');
        g.restore();
      }
      break;
    case 'sunglass':
      roundRect(g, 0.42 * u, -0.44 * u, 0.44 * u, 0.24 * u, 0.08 * u); fs('#2b2538');
      g.beginPath(); g.moveTo(0.42 * u, -0.36 * u); g.lineTo(0.1 * u, -0.42 * u); g.stroke();
      break;
    case 'chef':
      roundRect(g, hx - 0.32 * u, ty - 0.12 * u, 0.64 * u, 0.22 * u, 0.06 * u); fs('#fff');
      ell(g, hx - 0.18 * u, ty - 0.24 * u, 0.2 * u, 0.2 * u); fs('#fff');
      ell(g, hx + 0.18 * u, ty - 0.24 * u, 0.2 * u, 0.2 * u); fs('#fff');
      ell(g, hx, ty - 0.32 * u, 0.24 * u, 0.22 * u); fs('#fff');
      break;
    case 'ninja':
      g.beginPath(); g.ellipse(hx, -0.25 * u, 0.48 * u, 0.46 * u, 0, Math.PI * 0.9, Math.PI * 2.1); g.closePath(); fs('#2f2942');
      roundRect(g, hx - 0.46 * u, -0.62 * u, 0.92 * u, 0.15 * u, 0.06 * u); fs('#ff4769');
      break;
    case 'viking':
      g.beginPath(); g.ellipse(hx, ty + 0.1 * u, 0.42 * u, 0.34 * u, 0, Math.PI, 0); g.closePath(); fs('#9aa5b1');
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(hx + s * 0.34 * u, ty - 0.04 * u);
        g.quadraticCurveTo(hx + s * 0.65 * u, ty - 0.18 * u, hx + s * 0.52 * u, ty - 0.45 * u);
        g.quadraticCurveTo(hx + s * 0.42 * u, ty - 0.2 * u, hx + s * 0.24 * u, ty - 0.12 * u);
        g.closePath(); fs('#fff7e0');
      }
      break;
    case 'tophat':
      roundRect(g, hx - 0.28 * u, ty - 0.55 * u, 0.56 * u, 0.58 * u, 0.06 * u); fs('#2d2538');
      g.fillStyle = '#e63946'; g.fillRect(hx - 0.27 * u, ty - 0.1 * u, 0.54 * u, 0.1 * u);
      ell(g, hx, ty + 0.05 * u, 0.52 * u, 0.1 * u); fs('#2d2538');
      break;
    case 'party':
      g.beginPath(); g.moveTo(hx - 0.32 * u, ty + 0.08 * u); g.lineTo(hx, ty - 0.72 * u); g.lineTo(hx + 0.32 * u, ty + 0.08 * u); g.closePath(); fs('#ff7eb6');
      ell(g, hx, ty - 0.74 * u, 0.11 * u, 0.11 * u); fs('#ffd23f');
      ell(g, hx - 0.08 * u, ty - 0.2 * u, 0.06 * u, 0.06 * u); g.fillStyle = '#7fd6f5'; g.fill();
      ell(g, hx + 0.08 * u, ty - 0.38 * u, 0.06 * u, 0.06 * u); g.fillStyle = '#ffd23f'; g.fill();
      break;
    case 'grad':
      g.beginPath(); g.ellipse(hx, ty + 0.08 * u, 0.34 * u, 0.24 * u, 0, Math.PI, 0); g.closePath(); fs('#2b2d42');
      g.beginPath(); g.moveTo(hx - 0.52 * u, ty - 0.16 * u); g.lineTo(hx, ty - 0.32 * u); g.lineTo(hx + 0.52 * u, ty - 0.16 * u); g.lineTo(hx, ty); g.closePath(); fs('#2b2d42');
      g.beginPath(); g.moveTo(hx + 0.42 * u, ty - 0.14 * u); g.lineTo(hx + 0.45 * u, ty + 0.18 * u); g.strokeStyle = '#ffd23f'; g.stroke();
      break;
    case 'leaf':
      g.beginPath(); g.moveTo(hx, ty + 0.04 * u); g.lineTo(hx, ty - 0.22 * u); g.stroke();
      g.save(); g.translate(hx + 0.18 * u, ty - 0.24 * u); g.rotate(-0.4);
      ell(g, 0, 0, 0.28 * u, 0.13 * u); fs('#6cc551');
      g.restore();
      break;
    case 'star':
      starPath(g, hx, ty - 0.22 * u, 0.34 * u, 0.15 * u, 5); fs('#ffd23f');
      break;
    case 'pirate':
      g.beginPath(); g.moveTo(hx - 0.55 * u, ty + 0.04 * u); g.quadraticCurveTo(hx, ty - 0.56 * u, hx + 0.55 * u, ty + 0.04 * u);
      g.quadraticCurveTo(hx, ty + 0.16 * u, hx - 0.55 * u, ty + 0.04 * u); g.closePath(); fs('#2b2538');
      ell(g, hx, ty - 0.16 * u, 0.1 * u, 0.09 * u); g.fillStyle = '#fff'; g.fill();
      break;
    case 'frog':
      g.beginPath(); g.ellipse(hx, ty + 0.08 * u, 0.42 * u, 0.3 * u, 0, Math.PI, 0); g.closePath(); fs('#70c143');
      for (const sx of [-0.22, 0.22]) {
        ell(g, hx + sx * u, ty - 0.2 * u, 0.14 * u, 0.14 * u); fs('#70c143');
        ell(g, hx + sx * u, ty - 0.2 * u, 0.07 * u, 0.07 * u); g.fillStyle = '#fff'; g.fill();
        ell(g, hx + sx * u, ty - 0.2 * u, 0.035 * u, 0.035 * u); g.fillStyle = '#222'; g.fill();
      }
      break;
    case 'bear':
      for (const s of [-1, 1]) {
        g.save();
        g.translate(hx + s * 0.38 * u, ty - 0.04 * u);
        ell(g, 0, 0, 0.23 * u, 0.23 * u); fs('#9c6644');
        ell(g, 0, 0.01 * u, 0.12 * u, 0.12 * u); g.fillStyle = '#f3d5b5'; g.fill();
        g.restore();
      }
      break;
    case 'fox':
      g.save(); g.translate(hx + 0.1 * u, ty - 0.06 * u); g.rotate(0.15);
      g.beginPath(); g.moveTo(-0.3 * u, -0.14 * u); g.lineTo(-0.26 * u, -0.38 * u); g.lineTo(-0.08 * u, -0.2 * u);
      g.lineTo(0.08 * u, -0.2 * u); g.lineTo(0.26 * u, -0.38 * u); g.lineTo(0.3 * u, -0.14 * u);
      g.lineTo(0.22 * u, 0.18 * u); g.lineTo(0, 0.26 * u); g.lineTo(-0.22 * u, 0.18 * u); g.closePath(); fs('#fff');
      g.fillStyle = '#ff6b35';
      g.beginPath(); g.moveTo(-0.24 * u, -0.2 * u); g.lineTo(-0.24 * u, -0.35 * u); g.lineTo(-0.12 * u, -0.22 * u); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(0.24 * u, -0.2 * u); g.lineTo(0.24 * u, -0.35 * u); g.lineTo(0.12 * u, -0.22 * u); g.closePath(); g.fill();
      g.restore();
      break;
    case 'panda':
      for (const [x, r] of [[0.2, -0.3], [0.66, 0.3]]) {
        g.save(); g.translate(x * u, -0.62 * u); g.rotate(r);
        ell(g, 0, -0.06 * u, 0.17 * u, 0.17 * u); fs('#2d2538');
        g.restore();
      }
      break;
    case 'cherry':
      g.beginPath(); g.moveTo(hx - 0.16 * u, ty - 0.04 * u); g.quadraticCurveTo(hx, ty - 0.45 * u, hx + 0.18 * u, ty - 0.04 * u); g.strokeStyle = '#4ea832'; g.stroke();
      ell(g, hx - 0.16 * u, ty - 0.02 * u, 0.14 * u, 0.14 * u); fs('#ff3b4f');
      ell(g, hx + 0.18 * u, ty - 0.02 * u, 0.14 * u, 0.14 * u); fs('#ff3b4f');
      break;
    case 'tiara':
      g.beginPath(); g.moveTo(hx - 0.34 * u, ty + 0.06 * u); g.lineTo(hx - 0.2 * u, ty - 0.2 * u); g.lineTo(hx, ty - 0.4 * u);
      g.lineTo(hx + 0.2 * u, ty - 0.2 * u); g.lineTo(hx + 0.34 * u, ty + 0.06 * u); g.closePath(); fs('#e9ecef');
      ell(g, hx, ty - 0.14 * u, 0.08 * u, 0.1 * u); g.fillStyle = '#4cc9f0'; g.fill();
      break;
    case 'robo':
      g.beginPath(); g.moveTo(hx, ty + 0.04 * u); g.lineTo(hx, ty - 0.38 * u); g.stroke();
      ell(g, hx, ty - 0.42 * u, 0.11 * u, 0.11 * u); fs('#00e5ff');
      roundRect(g, hx - 0.28 * u, ty - 0.02 * u, 0.56 * u, 0.12 * u, 0.05 * u); fs('#adb5bd');
      break;
    case 'astro':
      g.save(); g.strokeStyle = '#7fd6f5'; g.fillStyle = 'rgba(180,240,255,0.28)';
      ell(g, hx, -0.25 * u, 0.58 * u, 0.58 * u); g.fill(); g.stroke();
      g.restore();
      break;
    case 'rainbow': {
      const cols = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
      g.save();
      for (let i = 0; i < cols.length; i++) {
        g.strokeStyle = cols[i]; g.lineWidth = Math.max(1.5, u * 0.09);
        g.beginPath(); g.arc(hx, ty + 0.1 * u, (0.48 - i * 0.07) * u, Math.PI, 0); g.stroke();
      }
      g.restore();
      break;
    }
  }
}
function paintBubble(g, x, y, text, fs, sc, al) {
  g.save();
  g.globalAlpha = al;
  g.font = fnt(800, fs);
  const bw = Math.min(CW - 12, g.measureText(text).width + fs * 1.25), bh = fs * 1.7, by = -bh - fs * 0.45;
  const cx = CW > bw + 12 ? clamp(x, 6 + bw / 2, CW - 6 - bw / 2) : CW / 2;
  const s = sc || 1;
  const dx = (cx - x) / s, yy = clamp(y, 6 - by * s, Math.max(6 - by * s, CH - 6));
  const tx = clamp(0, dx - bw / 2 + fs * 0.6, dx + bw / 2 - fs * 0.6);
  g.translate(x, yy); g.scale(sc, sc);
  g.fillStyle = '#fff'; g.strokeStyle = '#5a3d5c'; g.lineWidth = Math.max(1.2, fs * 0.12);
  g.beginPath(); g.moveTo(tx - fs * 0.3, -fs * 0.5); g.lineTo(tx, 0); g.lineTo(tx + fs * 0.3, -fs * 0.5); g.closePath(); g.fill(); g.stroke();
  roundRect(g, dx - bw / 2, by, bw, bh, bh / 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(tx - fs * 0.2, -fs * 0.52); g.lineTo(tx, -fs * 0.12); g.lineTo(tx + fs * 0.2, -fs * 0.52); g.closePath(); g.fill();
  g.fillStyle = '#5a3d5c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, dx, by + bh / 2 + fs * 0.04, bw - fs * 0.6);
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
  combo: 0, comboGrace: 0, comboT: -9, slowmo: 0, time: 0, rt: 0, speed: 1, antSpeed: 8,
  nestBounce: 0, slotFlash: 0, jamShake: 0, overlay: 'title', reveal: null, saidOnce: false,
  rc: new Map(), hudDirty: true, fromTitle: false, helpFrom: 'title', lastVib: 0, lastSay: -9, rewindTok: 0, rewindTo: -1,
  auto: false, autoNext: 0, autoClearT: 0, autoPath: null, autoAt: -1, genBusy: false, viewId: 1,
  // 育成・やりこみ
  gold: new Set(), fever: { g: 0, t: 0 }, skill: { g: 0, max: 18, freezeT: 0, boostT: 0 }, skillFx: [], skillBanner: null, run: null, perk: perks(), par: null, spdMul: 1, fvShown: -1, timerShown: -1,
  feeding: null, colAnts: null, colFlash: 0, gacha: null, sayT: -9, dailyP: null, scanId: 0
};
let CW = 0, CH = 0, dpr = 1, cs = 20, ox = 0, oy = 0, antPx = 20, antU = 10, nestR = 18, nestX = 0, nestY = 0;
let slotSize = 50, slotGap = 10, slotY = 0, trayTop = 0, trayHeadY = 0, trayGap = 30, headSize = 50, colW = 80;
// framePad：木の額縁の太さ　slotCX / trayCX：スロット・トレイの並びのまんなか　panelL / panelR：トレイの左右のはし
// boardSide：横長の画面で「絵を左・スロットとトレイを右」にしているか
let framePad = 10, slotCX = 0, trayCX = 0, panelL = 8, panelR = 0, boardSide = false;
let cubeSpr = [], cubeRes = [], candySpr = [];
const antCache = new Map(), boxCache = new Map(), numCache = new Map(), singerCache = new Map(), boardCv = document.createElement('canvas'), boardG = boardCv.getContext('2d'), trayCv = document.createElement('canvas'), trayG = trayCv.getContext('2d');
let trayGrad = null, trayGradKey = '', trayCacheKey = '', nestCache = null, slotGrad = null, slotGradKey = '', singerTxtKey = '', singerTxtW = 0;

/* ---- レイアウト：絵をできるだけ大きく ----
   たて長：上から「絵」「スロット＋巣穴（横ならび）」「トレイ」。絵が横幅いっぱいになったら、余った高さで箱を大きくする
   横長　：左に「絵」、右に「巣穴」「スロット」「トレイ」
   両方を計算して、横長のほうが絵が SIDE_MIN 倍以上大きくなるときだけ横長にする */
const SIDE_MIN = 1.08;
const q4 = v => Math.floor(v * 4) / 4;
// 箱の大きさ h のトレイに最低限必要な高さ（手前の箱＋うしろに5つ重ねてのぞかせる）
const trayNeed = h => Math.round(h * 2.55 + 22);
// スロットの大きさ s の列に必要な高さ（箱からのぞくアリの頭もふくむ）
const rowNeed = s => Math.round(s * 1.4 + 8);
// たて長：上から「絵」「スロット＋巣穴（横ならび）」「シンガー」「トレイ」（上へ寄せてトレイをできるだけ広くする）
function planTall(W, H, n) {
  const fp = framePad, cw = Math.min((CW - 16) / n, 120), g = clamp(CW * 0.02, 4, 10);
  const sMax = clamp((CW - 24 - g * 5) / (SLOT_COUNT + 2.2), 24, 62);
  const singerGap = clamp(CH * 0.045, 26, 34);
  let h = clamp(Math.min(cw * 0.62, CH * 0.085), 32, 58), s = clamp(Math.min(sMax, CH * 0.078), 24, sMax);
  let trayH = trayNeed(h), rowH = rowNeed(s);
  const avail = CH - trayH - rowH - singerGap - 8;
  const raw = Math.min((CW - 4 - fp * 2) / (W + 2), (avail - fp * 2) / (H + 2));
  const c = clamp(q4(raw), 3, 46), frameW = (W + 2) * c + fp * 2, frameH = (H + 2) * c + fp * 2;
  // 余った高さはスロット幅に少しだけ使い、残りはすべてトレイ（奥の箱表示）にまわす
  let spare = avail - frameH;
  if (spare > 0) {
    const s2 = clamp(s + spare * 0.4 / 1.4, s, Math.max(s, sMax));
    s = s2; rowH = rowNeed(s);
  }
  const top = 2, rowTop = top + frameH + 6;
  const slotY = rowTop + s * 0.74 + 4, slotBot = slotY + s * 0.64;
  const nr = s * 0.5, nestW = nr * 4.4, slotsW = s * SLOT_COUNT + g * (SLOT_COUNT - 1), left = (CW - slotsW - g - nestW) / 2;
  return {
    side: false, raw, c, h, s, g, cw, pw: 0,
    ox: (CW - frameW) / 2 + fp + c, oy: top + fp + c,
    slotCX: left + slotsW / 2, slotY,
    nestRoom: nr, nestX: left + slotsW + g + nestW / 2, nestY: rowTop + rowH / 2 + nr * 0.1,
    trayTop: Math.min(CH - trayH, slotBot + singerGap), trayCX: CW / 2, panelL: 8, panelR: CW - 8
  };
}
// 横長：左に絵、右の操作エリアに 巣穴 → スロット → シンガー → トレイ（上へ寄せてトレイを広く）
function planWide(W, H, n) {
  if (CW < CH * 1.1 || CW < 460) return null;
  const fp = framePad, pw = clamp(CW * 0.34, 240, 440), pl = CW - pw;
  const cw = Math.min((pw - 16) / n, 120), g = clamp(pw * 0.025, 4, 12);
  const singerGap = clamp(CH * 0.06, 28, 38);
  const h = clamp(Math.min(cw * 0.62, CH * 0.12), 30, 58);
  const s = clamp(Math.min((pw - 24 - g * (SLOT_COUNT - 1)) / SLOT_COUNT, CH * 0.10), 24, 62);
  const trayH = trayNeed(h), rowH = rowNeed(s), nr = clamp(Math.min(pw / 5, (CH - trayH - rowH - singerGap - 16) / 2.6), 10, 40);
  const raw = Math.min((pl - 12 - fp * 2) / (W + 2), (CH - 12 - fp * 2) / (H + 2));
  const c = clamp(q4(raw), 3, 46), frameW = (W + 2) * c + fp * 2, frameH = (H + 2) * c + fp * 2;
  const nestY = 6 + nr * 1.4, rowTop = nestY + nr * 1.15 + 6;
  const slotY = rowTop + s * 0.74 + 4, slotBot = slotY + s * 0.64;
  return {
    side: true, raw, c, h, s, g, cw, pw,
    ox: (pl - frameW) / 2 + fp + c, oy: (CH - frameH - 8) / 2 + fp + c,
    slotCX: pl + pw / 2, slotY,
    nestRoom: nr, nestX: pl + pw / 2, nestY,
    trayTop: Math.min(CH - trayH, slotBot + singerGap), trayCX: pl + pw / 2, panelL: pl + 2, panelR: CW - 8
  };
}
function layout() {
  const r = stage.getBoundingClientRect();
  CW = r.width; CH = r.height;
  const maxDpr = (navigator.deviceMemory && navigator.deviceMemory <= 2) ? 1.25 : (innerWidth <= 640 ? 1.5 : 2);
  dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(CW * dpr)); canvas.height = Math.max(1, Math.round(CH * dpr));
  Fx.resize();
  if (!G.s) return;
  const W = G.s.W, H = G.s.H, n = G.s.cols.length;
  framePad = clamp(Math.round(Math.min(CW, CH) * 0.015), 5, 9);
  const A = planTall(W, H, n), B = planWide(W, H, n), P = B && B.raw >= A.raw * SIDE_MIN ? B : A;
  boardSide = P.side; cs = P.c; ox = P.ox; oy = P.oy;
  slotSize = P.s; slotGap = P.g; slotCX = P.slotCX; slotY = P.slotY;
  trayTop = P.trayTop; trayCX = P.trayCX; panelL = P.panelL; panelR = P.panelR;
  colW = P.cw; headSize = P.h; trayHeadY = trayTop + headSize * 0.5 + 10; trayGap = headSize * 0.42;
  antPx = clamp(cs * 1.4, 13, 30); antU = antPx / 2;
  nestR = clamp(Math.min(P.nestRoom, antPx * 0.95 * NEST_SCALE), 10, 50);
  nestX = P.nestX; nestY = P.nestY;
  // 横ならびのときは、下のボタンを右の操作エリアの下に寄せる（高さは変えないので、レイアウトが行ったり来たりしない）
  document.body.classList.toggle('wide', boardSide);
  document.body.style.setProperty('--pw', P.pw + 'px');
  antCache.clear();
  boxCache.clear();
  numCache.clear();
  singerCache.clear();
  trayGrad = null;
  trayCacheKey = '';
  nestCache = null;
  slotGrad = null;
  slotGradKey = '';
  singerTxtKey = '';
  buildSprites();
  G.boardDirty = true;
}
const slotX = i => slotCX + (i - (SLOT_COUNT - 1) / 2) * (slotSize + slotGap);
const trayX = j => trayCX + (j - (G.s.cols.length - 1) / 2) * colW;
const toW = (gx, gy) => ({ x: ox + (gx - 0.5) * cs, y: oy + (gy - 0.5) * cs });
// 絵のまんなか（横）
const bcx = () => ox + G.s.W * cs / 2;
// 画面上の点にいちばん近い「外周のマス」（アリが板に出入りする場所）
function ringCell(px, py) {
  const W = G.s.W, H = G.s.H;
  let ex = clamp(Math.round((px - ox) / cs + 0.5), 0, W + 1), ey = clamp(Math.round((py - oy) / cs + 0.5), 0, H + 1);
  if (ex > 0 && ex <= W && ey > 0 && ey <= H) {
    const d = [ex, W + 1 - ex, ey, H + 1 - ey], m = Math.min(...d);
    if (m === d[0]) ex = 0; else if (m === d[1]) ex = W + 1; else if (m === d[2]) ey = 0; else ey = H + 1;
  }
  return { ex, ey };
}
function slotEntry(i) { return ringCell(slotX(i), slotY - slotSize * 0.3); }
// 巣穴の門：巣穴にいちばん近い外周のマス（アリはここから板の外に出て巣穴へ入る）
function nestGate() { return ringCell(nestX, nestY); }
// 巣穴の穴の位置（マス単位。アリの座標と同じ単位）
function nestHole() { return { x: (nestX - ox) / cs + 0.5, y: (nestY - oy) / cs + 0.5 }; }
function makeCube(ci, px, hatched) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d');
  paintCandy(g, 0, 0, px, ci);
  if (save.settings.cb && px >= 16) {
    g.font = '700 ' + Math.round(px * 0.42) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = LIGHT.has(ci) ? 'rgba(70,50,60,.75)' : 'rgba(255,255,255,.92)';
    g.fillText(SYM[ci], px / 2, px * 0.45);
  }
  if (hatched) {
    g.save();
    g.globalCompositeOperation = 'source-atop';
    g.strokeStyle = LIGHT.has(ci) ? 'rgba(90,60,85,.34)' : 'rgba(255,255,255,.65)';
    g.lineWidth = Math.max(1, px * 0.12);
    const step = Math.max(3, px * 0.36);
    g.beginPath();
    for (let d = -px; d <= px * 2; d += step) {
      g.moveTo(d, 0);
      g.lineTo(d - px, px);
    }
    g.stroke();
    g.restore();
  }
  return c;
}
function buildSprites() {
  const px = Math.max(3, Math.round(cs * dpr)), cp = Math.max(8, Math.round(antU * 1.3 * dpr));
  cubeSpr = HEX.map((h, i) => makeCube(i, px, false));
  cubeRes = HEX.map((h, i) => makeCube(i, px, true));
  candySpr = HEX.map((h, i) => makeCube(i, cp, false));
}
function antSprite(c, pose, fr, flip) {
  const fl = flip ? 1 : 0, k = c * 32 + pose * 8 + fr * 2 + fl;
  let cv = antCache.get(k);
  if (!cv) {
    const u = antU * dpr;
    cv = document.createElement('canvas');
    cv.width = Math.ceil(u * 2.6); cv.height = Math.ceil(u * 3.2);
    const g = cv.getContext('2d');
    if (fl) { g.translate(u * 1.35, u * 2.0); g.scale(-1, 1); }
    else g.translate(u * 1.25, u * 2.0);
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
// プレイ中は空きマスが単調に増えるだけなので、直前の距離表で到達可能ならそのまま通行でき、未到達または一定数空いたときだけ再計算する
function planDist(ex, ey, forceFresh) {
  if (G.pcacheGrid !== G.pgrid) { G.pcache = new Map(); G.pcacheGrid = G.pgrid; }
  const k = ey * 1000 + ex;
  let ent = G.pcache.get(k);
  if (!ent || forceFresh || (G.pver - ent.ver) >= 12) {
    ent = { dist: bfs(G.pgrid, G.s.W, G.s.H, ex, ey), ver: G.pver };
    G.pcache.set(k, ent);
  }
  return ent;
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
const ANT_GAP = 1.05;
// アリは盤面の細かさに関係なく同じ大きさで描くので、間隔をマス数に直す
function gapCells() { return antPx * 1.05 * ANT_GAP / cs; }
// 同じ箱から出た仲間がすぐ前にいたら、スピードを落とす（止まりきらないので行列は詰まらない）
// ちがう箱のアリ（ちがう色のアリなど）とは間隔をとらず、そのまますれちがう・重なる
function followFactor(a, gap, peers) {
  if (!peers || peers.length <= 1) return 1;
  let f = 1;
  const g2 = gap * gap, latLim = gap * 0.45, g55 = gap * 0.55;
  for (let i = 0, len = peers.length; i < len; i++) {
    const o = peers[i];
    if (o === a) continue;
    const dx = o.x - a.x, dy = o.y - a.y;
    if (dx * dx + dy * dy >= g2) continue;
    if (o.hx * a.hx + o.hy * a.hy < 0.7) continue;
    const ahead = dx * a.hx + dy * a.hy;
    if (ahead <= 0.02) continue;
    if (Math.abs(dx * a.hy - dy * a.hx) > latLim) continue;
    f = Math.min(f, clamp((ahead - g55) / latLim, 0.12, 1));
  }
  return f;
}
function tryDispatch(b) {
  if (!b.queue.length || G.ants.length >= MAX_ANTS) return;
  if (!G.lastOut) G.lastOut = [];
  // 同じスロットから最後に出たアリが、アリ1匹ぶん以上進むまで待つ
  const last = G.lastOut[b.slot];
  if (last && last.state === 'out' && last.trav < gapCells()) return;
  const W = G.s.W, EW = W + 2, EH = G.s.H + 2, en = slotEntry(b.slot);
  let ent = planDist(en.ex, en.ey, false);
  for (let pass = 0; pass < 2; pass++) {
    const dist = ent.dist;
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
      const p0 = pts[0], p1 = pts[1] || p0, dx0 = p1.x - p0.x, dy0 = p1.y - p0.y, L0 = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1;
      const ant = { vb: b, c: b.c, cell, tx: x + 1, ty: y + 1, pts, i: 0, d: 0, x: p0.x, y: p0.y, face: 1, state: 'out', t: 0, phase: Math.random() * 6, speed: G.antSpeed * G.spdMul * (0.97 + Math.random() * 0.06), sweat: Math.random() * 2, said: false, lifted: false, trav: 0, hx: dx0 / L0, hy: dy0 / L0 };
      G.ants.push(ant);
      G.lastOut[b.slot] = ant;
      if (b.dispatched === 1 || (b.wakeT && G.rt - b.wakeT < 1.0 && !b._wakeSaid)) { if (b.wakeT) b._wakeSaid = true; maybeSay(ant, 'go', b.wakeT ? 0.65 : 0.3); }
      return;
    }
    if (ent.ver === G.pver) break;
    ent = planDist(en.ex, en.ey, true);
  }
}
function moveAlong(a, dist) {
  const p = a.pts, last = p.length - 1;
  while (dist > 0 && a.i < last) {
    const A = p[a.i], B = p[a.i + 1], dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy) || 1e-6, rem = L - a.d;
    if (dist < rem) { a.d += dist; dist = 0; } else { dist -= rem; a.i++; a.d = 0; }
  }
  if (a.i >= last) { a.x = p[last].x; a.y = p[last].y; return true; }
  const A = p[a.i], B = p[a.i + 1], dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy) || 1e-6, t = a.d / L;
  a.x = A.x + dx * t; a.y = A.y + dy * t;
  // 進む向き（同じ向きのアリ同士の間隔を保つのに使う）
  a.hx = dx / L; a.hy = dy / L;
  if (dx > 0.01 || dx < -0.01) a.face = dx > 0 ? 1 : -1;
  return false;
}
// kind：base.js の TALK の場面名。force=true は間隔の制限を無視して必ずしゃべる
function maybeSay(a, kind, p, force) {
  if (!save.settings.talk) return;
  if (G.bubbles.some(b => b.a === a)) return;
  const wasSaidOnce = G.saidOnce;
  if (!G.saidOnce) p = 1;
  if (!force) {
    if (G.bubbles.length >= 2 || G.rt - G.lastSay < 1.1 || Math.random() > p) return;
    const wp = toW(a.x, a.y);
    if (G.bubbles.some(b => { const bp = toW(b.a.x, b.a.y); return Math.hypot(bp.x - wp.x, bp.y - wp.y) < 100; })) return;
  }
  if (G.bubbles.length >= 3) G.bubbles.shift();
  G.saidOnce = true; G.lastSay = G.rt;
  const canTip = !force && wasSaidOnce && (kind === 'go' || kind === 'carry') && G.level && posOf(G.levelId) >= 2 && (!G.lastTipSay || G.rt - G.lastTipSay >= 20) && typeof pickTipLine === 'function';
  if (canTip && Math.random() < 0.09) {
    const tipText = pickTipLine(!(save.flags && save.flags.lp), G.lastTipText);
    G.lastTipSay = G.rt; G.lastTipText = tipText;
    G.bubbles.push({ a, text: tipText, t: 0, life: 3.4 });
  } else {
    G.bubbles.push({ a, text: talkLine(kind, a.c, G.level && G.level.theme), t: 0, life: 2.5 });
  }
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
const COMBO_MARK = [5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500];
function startFever() {
  const R = G.run;
  G.fever.g = 0; G.fever.t = G.perk.feverT;
  if (R) R.fevers++;
  document.body.classList.add('fever');
  if (typeof Sound.setFever === 'function') Sound.setFever(true);
  if (!G.overlay && save.settings.bgm !== false) G.bgmBanner = { title: Sound.bgmTitle(), t0: null };
  Sound.fever(); haptic(25);
  popup('FEVER!!', bcx(), oy + G.s.H * cs * 0.4, '#ff5a9a', true);
  const r = canvas.getBoundingClientRect();
  Fx.burst(r.left + bcx(), r.top + oy + G.s.H * cs / 2, 40, 360, ['star', 'dot']);
  const a = G.ants[G.ants.length - 1];
  if (a) maybeSay(a, 'fever', 1, true);
}
function endFever() {
  G.fever.t = 0;
  document.body.classList.remove('fever');
  if (typeof Sound.setFever === 'function') Sound.setFever(false);
}
function pickCube(a) {
  if (G.vgrid[a.cell] >= 0) {
    G.vgrid[a.cell] = -1; G.vver++; G.vleft--; eraseCell(a.cell); G.boardSoft = true;
    if (G.pickFlashes) G.pickFlashes.push({ x: a.tx, y: a.ty, c: a.c, t0: G.rt, dur: 0.16 });
    if (G.newReachFlashes && G.s) {
      const W = G.s.W, H = G.s.H, ne = nestGate(), dist = visDist(ne.ex, ne.ey), nowSet = new Set();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if (G.vgrid[idx] >= 0 && cubeDist(dist, W, x, y) >= 0) {
          nowSet.add(idx);
          if (G.prevVisReach && !G.prevVisReach.has(idx)) G.newReachFlashes.push({ x, y, t0: G.rt, dur: 0.24 });
        }
      }
      G.prevVisReach = nowSet;
    }
  }
  a.vb.picked++;
  if (Math.abs(a.tx - a.x) > 0.01) a.face = a.tx > a.x ? 1 : -1;
  const w = toW(a.tx, a.ty), R = G.run, fev = G.fever.t > 0;
  for (let k = 0; k < (fev ? 8 : 6); k++) G.parts.push({ x: w.x, y: w.y, vx: (Math.random() - 0.5) * 175, vy: -Math.random() * 150 - 45, life: 0, max: 0.42, col: fev && k % 2 ? pick(POP) : HEX[a.c], s: Math.max(2.5, antPx * 0.17), star: k <= 1 });
  if (!hasActiveSlotBox() && !(G.comboGrace > 0)) G.combo = 0;
  G.comboGrace = 2.0;
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
    if (typeof addSkillCharge === 'function') addSkillCharge(1);
    if (G.combo >= 100 && G.combo % 100 === 0) {
      const mulStr = (1 + Math.floor(G.combo / 100) * 0.1).toFixed(1);
      popup(G.combo + ' コンボ！⚡' + mulStr + 'x', bcx(), oy + G.s.H * cs * 0.22, '#ffd23f');
      if (!said) { maybeSay(a, 'combo', 0.9); said = true; }
    } else if (COMBO_MARK.indexOf(G.combo) >= 0) {
      popup(G.combo + ' コンボ！', bcx(), oy + G.s.H * cs * 0.22, G.combo >= 30 ? '#ffd23f' : G.combo >= 10 ? '#ff8fb3' : '#ffffff');
      if (!said) { maybeSay(a, 'combo', 0.9); said = true; }
    }
  }
  if (!said) maybeSay(a, fev && Math.random() < 0.45 ? 'fever' : 'pick', fev ? 0.45 : 0.4);
  if (!G.almostNotified && !G.pendingWin && G.vleft > 0 && G.level && G.level.total >= 12 && G.vleft <= Math.ceil(G.level.total * 0.25)) {
    G.almostNotified = true;
    popup(posOf(G.levelId) === 1 ? '✨ もうすぐ完成！' : '✨ あと少し！', bcx(), oy + G.s.H * cs * 0.32, '#ffd23f');
  }
  if (G.vleft === 0 && G.pendingWin) {
    G.slowmo = 0.18;
    const r = canvas.getBoundingClientRect();
    Fx.burst(r.left + bcx(), r.top + oy + G.s.H * cs / 2, 60, 420, ['star', 'conf', 'dot']);
    Sound.boom();
  }
}
// 帰り道：板の中の道 → 巣穴の真上の門（板の下のふち） → 板の外の巣穴の穴
function startReturn(a) {
  const W = G.s.W, H = G.s.H, EW = W + 2, EH = H + 2, ne = nestGate(), last = a.pts[a.pts.length - 1];
  const cur = Math.round(last.y) * EW + Math.round(last.x), pts = [{ x: a.x, y: a.y }];
  let ent = planDist(ne.ex, ne.ey, false);
  if (ent.dist[cur] < 0 && ent.ver !== G.pver) ent = planDist(ne.ex, ne.ey, true);
  const dist = ent.dist;
  if (dist[cur] >= 0) for (const ei of pathFrom(dist, cur, EW, EH).reverse()) pts.push({ x: ei % EW, y: Math.floor(ei / EW) });
  else pts.push({ x: ne.ex, y: ne.ey });
  pts.push(nestHole());
  a.pts = pts; a.i = 0; a.d = 0; a.state = 'back'; a.t = 0;
}
const _antVbs = [];
function hasActiveSlotBox() {
  for (let i = 0; i < G.vboxes.length; i++) {
    const b = G.vboxes[i];
    if (!(b.state === 'slot' && (b.total - b.dispatched) > 0 && !b.queue.length)) return true;
  }
  return false;
}
function updateAnts(dt, rdt) {
  const activeBox = hasActiveSlotBox();
  const comboSteps = (activeBox || G.comboGrace > 0) ? Math.floor(G.combo / 100) : 0;
  const comboMul = comboSteps > 0 ? 1 + comboSteps * 0.1 + (G.perk ? G.perk.combo : 0) : 1;
  const fm = (G.fever.t > 0 ? 1.3 : 1) * (G.skill && G.skill.boostT > 0 ? 1.45 : 1) * comboMul, gap = gapCells();
  _antVbs.length = 0;
  for (let k = 0, len = G.ants.length; k < len; k++) {
    const a = G.ants[k];
    if (a.state !== 'out' && a.state !== 'back') continue;
    const vb = a.vb;
    if (!vb) continue;
    if (!vb._ants) vb._ants = [];
    if (vb._ants.length === 0) _antVbs.push(vb);
    vb._ants.push(a);
  }
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
    const step = a.speed * (a.state === 'back' ? 0.82 : 1) * fm * dt * followFactor(a, gap, a.vb && a.vb._ants);
    a.trav = (a.trav || 0) + step;
    const done = moveAlong(a, step);
    if (a.state === 'back') {
      a.sweat -= dt;
      if (a.sweat < 0) a.sweat = 1.4 + Math.random() * 1.5;
      if (!a.said && a.i > a.pts.length * 0.45) { a.said = true; maybeSay(a, G.fever.t > 0 && Math.random() < 0.45 ? 'fever' : 'carry', 0.12); }
      if (G.pendingWin && Math.random() < 0.25) {
        const w = toW(a.x, a.y);
        G.parts.push({ x: w.x, y: w.y, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, life: 0, max: 0.3, col: pick(POP), s: Math.max(2, antPx * 0.15), star: true });
      }
    }
    if (done) {
      if (a.state === 'out') { a.state = 'pick'; a.t = 0; pickCube(a); }
      else {
        a.state = 'enter'; a.t = 0; G.nestBounce = 1; Sound.thump();
        // フィーバー：どの盤面でも一定個数（FEVER_CANDIES=200）を巣に入れたら突入（育成・スキン特典で加速、クリア直前の戻り分は次面持ち越し用に蓄積）
        if (G.run && G.fever.t <= 0) {
          const step = (1 / FEVER_CANDIES) * ((G.perk && G.perk.fever) || 1);
          if (!G.pendingWin) {
            G.fever.g += step;
            if (G.fever.g >= 1) startFever();
          } else {
            G.fever.g = Math.min(0.95, G.fever.g + step);
          }
        }
        if (Math.random() < 0.28) G.parts.push({ x: nestX, y: nestY - nestR * 0.4, vx: (Math.random() - 0.5) * 60, vy: -90, life: 0, max: 0.5, col: '#ffd45e', s: antPx * 0.3, star: true });
        // にぎわっているときは、穴のふちから土の粒がこぼれる
        if (G.ants.length >= 4 && Math.random() < 0.5) {
          for (let q = 0; q < 2; q++) G.parts.push({ x: nestX + (Math.random() - 0.5) * nestR * 1.2, y: nestY - nestR * 0.05, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 60, life: 0, max: 0.45, col: Math.random() < 0.5 ? '#c98a52' : '#a86a3a', s: Math.max(2.5, nestR * 0.12), star: false });
        }
        maybeSay(a, 'home', 0.03);
      }
    }
  }
  const bdt = rdt == null ? dt : rdt;
  if (hasActiveSlotBox()) {
    if (G.combo > 0) G.comboGrace = 2.0;
  } else if (G.combo > 0) {
    G.comboGrace = Math.max(0, (G.comboGrace || 0) - bdt);
    if (G.comboGrace <= 0) G.combo = 0;
  } else {
    G.comboGrace = 0;
  }
  for (let i = 0; i < _antVbs.length; i++) _antVbs[i]._ants.length = 0;
  _antVbs.length = 0;
  for (let i = G.bubbles.length - 1; i >= 0; i--) { G.bubbles[i].t += bdt; if (G.bubbles[i].t > G.bubbles[i].life) G.bubbles.splice(i, 1); }
}
function updateBoxes(dt) {
  for (let k = G.vboxes.length - 1; k >= 0; k--) {
    const b = G.vboxes[k];
    b.t += dt;
    if (b.state === 'fly' && b.t >= 0.17) { b.state = 'land'; b.t = 0; Sound.land(); tryDispatch(b); }
    else if (b.state === 'land' && b.t >= 0.09) { b.state = 'slot'; b.t = 0; tryDispatch(b); }
    else if (b.state === 'slot') {
      tryDispatch(b);
      if (b.logicalDone && b.dispatched >= b.total && !b.queue.length) {
        b.state = 'leave'; b.t = 0; Sound.boxOut();
        const sx = slotX(b.slot), sy = slotY;
        for (let p = 0; p < 8; p++) G.parts.push({ x: sx, y: sy, vx: (Math.random() - 0.5) * 170, vy: -Math.random() * 135 - 25, life: 0, max: 0.42, col: p <= 1 ? '#ffd23f' : HEX[b.c], s: Math.max(2.6, slotSize * 0.12), star: p <= 2 });
        if (typeof showMicroGuide === 'function' && !G.pendingWin) showMicroGuide('slot_freed', '✨', '箱が空いた！', 'スロットは5つまで置けるよ', 3.4);
      }
    } else if (b.state === 'leave' && b.t >= 0.18) {
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
    if (!G.clearShown && G.ants.length === 0 && G.vboxes.length === 0) { G.endT += rdt; if (G.endT > 0.16) showClear(); }
    return;
  }
  if (G.pendingJam && !G.jamDismissed) {
    const busy = G.ants.length > 0 || G.vboxes.some(b => b.state !== 'slot' || b.logicalDone || b.queue.length);
    if (!busy) { G.endT += rdt; if (G.endT > 0.32) showJam(); } else G.endT = 0;
  }
}

/* ================= 描画 ================= */
function renderBoard() {
  G.boardDirty = false; G.boardSoft = false; G.boardT = G.rt;
  if (boardCv.width !== canvas.width || boardCv.height !== canvas.height) { boardCv.width = canvas.width; boardCv.height = canvas.height; }
  const g = boardG, W = G.s.W, H = G.s.H, EW = W + 2, pad = framePad;
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
  G.soilDark = new Uint8Array(W * H);
  g.fillStyle = '#ecd2ae';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (G.vgrid[i] < 0 && dist[(y + 1) * EW + x + 1] < 0) {
      G.soilDark[i] = 1;
      g.fillRect(ox + x * cs, oy + y * cs, cs + 0.5, cs + 0.5);
    }
  }
  const wash = save.settings.wash;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, v = G.vgrid[i];
    if (v >= 0) g.drawImage(wash && G.s.grid[i] < 0 ? cubeRes[v] : cubeSpr[v], ox + x * cs, oy + y * cs, cs, cs);
  }
}
function updateSoilHoles() {
  G.boardSoft = false; G.boardT = G.rt;
  if (!G.s || !G.soilDark) return;
  const g = boardG, W = G.s.W, H = G.s.H, EW = W + 2, ne = nestGate(), dist = visDist(ne.ex, ne.ey);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (G.vgrid[i] >= 0) continue;
    const dark = dist[(y + 1) * EW + x + 1] < 0 ? 1 : 0;
    if (dark !== G.soilDark[i]) {
      G.soilDark[i] = dark;
      g.fillStyle = dark ? '#ecd2ae' : SOIL;
      g.fillRect(ox + x * cs - 0.2, oy + y * cs - 0.2, cs + 0.5, cs + 0.5);
    }
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
  if (!G.s) return;
  const W = G.s.W, H = G.s.H, p = framePad - 1, bx = ox - cs - p, by = oy - cs - p, bw = (W + 2) * cs + p * 2, bh = (H + 2) * cs + p * 2;
  const cx = bcx(), ty = Math.max(11, by + 1);
  const minLeft = 6, maxRight = Math.max(minLeft + 40, boardSide ? Math.min(CW - 6, panelL - 4) : CW - 6);
  const hasFeverT = G.fever.t > 0;
  const hasFeverG = !hasFeverT && G.fever.g > 0.01 && !G.overlay;
  let fTxt = '', tw = 0, gwBase = 0, gw = 0, near = false, feverMaxW = 0;
  if (hasFeverT) {
    fTxt = '🔥 FEVER ' + G.fever.t.toFixed(1) + 's';
    ctx.font = fnt(900, 12.5);
    tw = Math.max(110, Math.max(ctx.measureText('🔥 FEVER 88.8s').width, ctx.measureText(fTxt).width) + 20);
    feverMaxW = tw;
  } else if (hasFeverG) {
    near = G.fever.g >= 0.75;
    const pulse = near ? 1 + 0.04 * Math.sin(G.rt * 12) : 1;
    gwBase = clamp(bw * 0.42, 86, 132);
    gw = gwBase * pulse;
    feverMaxW = gwBase * 1.04;
  }
  // ライブコンボバッジ（2コンボ以上、おやすみ箱以外の箱がスロットにある間＋切れた後2秒猶予の間は継続）
  const comboActive = hasActiveSlotBox(), comboGrace = !comboActive && G.comboGrace > 0;
  const showCombo = G.combo >= 2 && (comboActive || comboGrace) && !G.overlay;
  let cTxt = '', cw = 0, cbx = 0, cLeft = maxRight;
  if (showCombo) {
    const cMul = Math.floor(G.combo / 100) * 0.1;
    cTxt = G.combo + ' COMBO!' + (cMul > 0 ? ' ⚡' + (1 + cMul).toFixed(1) + 'x' : '');
    const digits = G.combo >= 1000 ? '8888' : G.combo >= 100 ? '888' : '88';
    const refTxt = digits + ' COMBO!' + (cMul > 0 ? ' ⚡1.8x' : '');
    ctx.font = fnt(900, 11.5);
    const rawCw = Math.max(ctx.measureText(refTxt).width, ctx.measureText(cTxt).width) + 16;
    const wantRight = feverMaxW > 0 ? Math.max(bx + bw - 4, cx + feverMaxW / 2 + 6 + rawCw) : bx + bw - 4;
    const cRight = Math.min(maxRight, wantRight);
    const availCw = Math.max(60, cRight - minLeft - (feverMaxW > 0 ? feverMaxW + 6 : 0));
    cw = Math.min(rawCw, availCw);
    cbx = Math.max(minLeft + cw / 2, cRight - cw / 2);
    cLeft = cbx - cw / 2;
  }
  const fcx = showCombo && feverMaxW > 0 ? Math.max(minLeft + feverMaxW / 2, Math.min(cx, cLeft - 6 - feverMaxW / 2)) : cx;
  if (hasFeverT) {
    ctx.lineWidth = 5; ctx.strokeStyle = 'hsl(' + ((G.rt * 240) % 360) + ',95%,62%)';
    roundRect(ctx, bx, by, bw, bh, 24); ctx.stroke();
    ctx.font = fnt(900, 12.5);
    ctx.fillStyle = 'rgba(65,30,75,0.85)'; roundRect(ctx, fcx - tw / 2, ty - 10, tw, 20, 10); ctx.fill();
    const pct = clamp(G.fever.t / Math.max(1, G.perk.feverT), 0, 1);
    if (pct > 0) {
      ctx.save(); roundRect(ctx, fcx - tw / 2 + 1.5, ty - 8.5, tw - 3, 17, 8.5); ctx.clip();
      ctx.fillStyle = 'hsl(' + ((G.rt * 240 + 180) % 360) + ',90%,58%)';
      ctx.fillRect(fcx - tw / 2, ty - 10, tw * pct, 20);
      ctx.restore();
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; roundRect(ctx, fcx - tw / 2, ty - 10, tw, 20, 10); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(fTxt, fcx, ty + 0.5, tw - 12);
  } else if (hasFeverG) {
    const pct = clamp(G.fever.g, 0, 1), gh = 16;
    ctx.save();
    ctx.fillStyle = 'rgba(70,40,75,0.72)'; roundRect(ctx, fcx - gw / 2, ty - gh / 2, gw, gh, gh / 2); ctx.fill();
    ctx.save(); roundRect(ctx, fcx - gw / 2 + 1.5, ty - gh / 2 + 1.5, gw - 3, gh - 3, (gh - 3) / 2); ctx.clip();
    const fg = ctx.createLinearGradient(fcx - gw / 2, 0, fcx + gw / 2, 0);
    fg.addColorStop(0, '#ff5a9a'); fg.addColorStop(1, '#ffd23f');
    ctx.fillStyle = fg; ctx.fillRect(fcx - gw / 2, ty - gh / 2, gw * pct, gh);
    ctx.restore();
    ctx.strokeStyle = near ? '#ffd23f' : 'rgba(255,255,255,0.88)'; ctx.lineWidth = 1.5;
    roundRect(ctx, fcx - gw / 2, ty - gh / 2, gw, gh, gh / 2); ctx.stroke();
    ctx.font = fnt(900, 10); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(near ? '🔥 あと少しでFEVER!' : '🔥 FEVER ' + Math.round(pct * 100) + '%', fcx, ty + 0.5, gw - 8);
    ctx.restore();
  }
  if (showCombo) {
    const ch = 19;
    ctx.save();
    if (comboGrace) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.rt * 16);
    ctx.font = fnt(900, 11.5);
    ctx.fillStyle = G.combo >= 25 ? '#ff9a00' : G.combo >= 10 ? '#ff4d7e' : '#ff6f9f';
    roundRect(ctx, cbx - cw / 2, ty - ch / 2, cw, ch, ch / 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cTxt, cbx, ty + 0.5, cw - 12);
    ctx.restore();
  }
}
// 巣穴：板の外に置く土の山。(nestX, nestY) が穴のまんなか（静的部分をオフスクリーンにキャッシュ）
function ensureNestCache(r) {
  if (nestCache && nestCache.r === r && nestCache.dpr === dpr) return nestCache;
  // 1) 土台（影・小石・草・旗の棒）
  const bw = Math.ceil(r * 5.2), bh = Math.ceil(r * 3.0), bx = r * 2.6, by = r * 2.0;
  const baseCv = document.createElement('canvas');
  baseCv.width = Math.max(1, Math.ceil(bw * dpr)); baseCv.height = Math.max(1, Math.ceil(bh * dpr));
  let g = baseCv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, bx * dpr, by * dpr);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.fillStyle = 'rgba(90,50,30,.22)'; ell(g, 0, r * 0.36, r * 1.8, r * 0.34); g.fill();
  for (const [px, py, pr] of [[-1.78, 0.22, 0.13], [-1.52, 0.44, 0.08], [1.74, 0.28, 0.12], [1.48, 0.46, 0.08]]) {
    ell(g, px * r, py * r, pr * r * 1.3, pr * r); g.fillStyle = '#d8c6b4'; g.fill();
    g.strokeStyle = '#9c8470'; g.lineWidth = 1.2; g.stroke();
  }
  g.fillStyle = '#6cc35a';
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const gx = s * r * (1.95 + k * 0.12), gy = r * 0.18;
    g.beginPath(); g.moveTo(gx - r * 0.07, gy); g.lineTo(gx + s * r * (0.05 + k * 0.05), gy - r * (0.42 - k * 0.1)); g.lineTo(gx + r * 0.07, gy); g.closePath(); g.fill();
  }
  const fx = r * 1.05, ft = -r * 1.8;
  g.strokeStyle = '#8a5530'; g.lineWidth = Math.max(1.5, r * 0.07);
  g.beginPath(); g.moveTo(fx, -r * 0.35); g.lineTo(fx, ft); g.stroke();

  // 2) 土の山＋穴（バウンス時にまとめて拡大縮小する）
  const dw = Math.ceil(r * 3.6), dh = Math.ceil(r * 1.8), dx = r * 1.8, dy = r * 1.2;
  const domeCv = document.createElement('canvas');
  domeCv.width = Math.max(1, Math.ceil(dw * dpr)); domeCv.height = Math.max(1, Math.ceil(dh * dpr));
  g = domeCv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, dx * dpr, dy * dpr);
  g.lineJoin = 'round'; g.lineCap = 'round';
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

  nestCache = { r, dpr, baseCv, bw, bh, bx, by, domeCv, dw, dh, dx, dy };
  return nestCache;
}
function drawNest() {
  const g = ctx, r = nestR, x = nestX, y = nestY, my = y + r * 0.45, b = G.nestBounce;
  const nc = ensureNestCache(r);
  g.drawImage(nc.baseCv, x - nc.bx, my - nc.by, nc.bw, nc.bh);
  // 旗の布（ゆらめく＆フィーバーで色が変わるため毎フレーム描く）
  const fx = x + r * 1.05, ft = my - r * 1.8;
  g.fillStyle = G.fever.t > 0 ? 'hsl(' + ((G.rt * 240) % 360) + ',90%,60%)' : '#ff6f9f';
  g.beginPath(); g.moveTo(fx, ft); g.lineTo(fx + r * 0.7, ft + r * 0.2 + Math.sin(G.rt * 6) * r * 0.06); g.lineTo(fx, ft + r * 0.42); g.closePath(); g.fill();
  // 土の山（アリが入るとはずむ）
  if (b > 0.001) {
    g.save(); g.translate(x, my); g.scale(1 + 0.1 * b, 1 - 0.08 * b);
    g.drawImage(nc.domeCv, -nc.dx, -nc.dy, nc.dw, nc.dh);
    g.restore();
  } else {
    g.drawImage(nc.domeCv, x - nc.dx, my - nc.dy, nc.dw, nc.dh);
  }
}
function drawSlots() {
  let occ = 0;
  for (let i = 0; i < SLOT_COUNT; i++) if (G.vslots[i]) occ++;
  const danger = occ === SLOT_COUNT - 1;
  const bx = slotX(0) - slotSize * 0.72, bw = slotX(SLOT_COUNT - 1) - slotX(0) + slotSize * 1.44;
  ctx.fillStyle = 'rgba(255,255,255,.55)'; roundRect(ctx, bx, slotY - slotSize * 0.64, bw, slotSize * 1.28, slotSize * 0.4); ctx.fill();
  const w = slotSize * 1.08, h = slotSize * 0.98, sk = slotY + '|' + h;
  if (!slotGrad || slotGradKey !== sk) {
    slotGradKey = sk;
    slotGrad = ctx.createLinearGradient(0, slotY - h / 2, 0, slotY + h / 2);
    slotGrad.addColorStop(0, '#f6fdf1'); slotGrad.addColorStop(1, '#dcf2cf');
  }
  const slotFont = fnt(900, slotSize * 0.32), dangerA = danger ? 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(G.rt * 6)) : 0.6;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const x = slotX(i), empty = !G.vslots[i];
    ctx.fillStyle = slotGrad; roundRect(ctx, x - w / 2, slotY - h / 2, w, h, slotSize * 0.3); ctx.fill();
    ctx.strokeStyle = G.slotFlash > 0 ? 'rgba(255,80,110,' + (0.5 + 0.5 * G.slotFlash) + ')' : (danger && empty) ? 'rgba(255,110,130,' + dangerA + ')' : 'rgba(110,190,95,0.6)';
    ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
    if (empty) {
      ctx.fillStyle = 'rgba(110,170,95,.35)'; ctx.font = slotFont; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, slotY);
    }
  }
}
function boxSprite(ci, sz, peek) {
  const px = Math.max(8, Math.round(sz)), cb = save.settings.cb ? 1 : 0;
  const k = ci + '|' + px + '|' + (peek ? 1 : 0) + '|' + cb;
  let ent = boxCache.get(k);
  if (!ent) {
    const sh = SHADE[ci], pad = Math.ceil(px * 0.14), cw = px + pad * 2, ch = px + pad * 2;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(cw * dpr); cv.height = Math.ceil(ch * dpr);
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, cw * dpr / 2, ch * dpr / 2);
    const w = px, h = px * 0.82, r = px * 0.24;
    g.fillStyle = 'rgba(120,60,90,.16)'; ell(g, 0, h * 0.52, w * 0.46, px * 0.07); g.fill();
    g.fillStyle = sh.d; roundRect(g, -w / 2, -h / 2, w, h, r); g.fill();
    const gr = g.createLinearGradient(0, -h / 2, 0, h * 0.35);
    gr.addColorStop(0, sh.l2); gr.addColorStop(1, HEX[ci]);
    g.fillStyle = gr; roundRect(g, -w / 2, -h / 2, w, h * 0.88, r); g.fill();
    g.fillStyle = peek ? 'rgba(60,30,50,.35)' : 'rgba(255,255,255,.35)';
    roundRect(g, -w * 0.38, -h * 0.42, w * 0.76, h * 0.16, h * 0.08); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; ell(g, -w * 0.3, -h * 0.1, w * 0.06, w * 0.06); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.max(1.5, px * 0.04);
    roundRect(g, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, r); g.stroke();
    if (cb) {
      g.font = '700 ' + Math.round(px * 0.22) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#fff'; g.fillText(SYM[ci], w * 0.3, -h * 0.24);
    }
    if (boxCache.size > 200) boxCache.clear();
    ent = { cv, cw, ch, px };
    boxCache.set(k, ent);
  }
  return ent;
}
function numSprite(ci, sz, num) {
  const px = Math.max(8, Math.round(sz)), txt = String(num);
  const k = ci + '|' + px + '|' + txt;
  let ent = numCache.get(k);
  if (!ent) {
    const fs = px * (txt.length > 2 ? 0.3 : 0.38), lw = Math.max(2.5, fs * 0.2);
    const cw = Math.ceil(px * 1.1), ch = Math.ceil(fs * 1.7 + lw * 2);
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(cw * dpr)); cv.height = Math.max(1, Math.ceil(ch * dpr));
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, cw * dpr / 2, ch * dpr / 2);
    g.font = fnt(900, fs); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = lw; g.strokeStyle = SHADE[ci].ol; g.strokeText(txt, 0, 0);
    g.fillStyle = '#fff'; g.fillText(txt, 0, 0);
    if (numCache.size > 256) numCache.clear();
    ent = { cv, cw, ch, px };
    numCache.set(k, ent);
  }
  return ent;
}
function drawBox(x, y, sz, ci, num, o, g) {
  o = o || {};
  g = g || ctx;
  const sh = SHADE[ci], al = o.alpha == null ? 1 : o.alpha, h = sz * 0.82;
  const scaled = (o.sx && o.sx !== 1) || (o.sy && o.sy !== 1);
  if (o.peek || scaled) {
    g.save(); g.translate(x, y); if (scaled) g.scale(o.sx || 1, o.sy || 1); if (al !== 1) g.globalAlpha = al;
    if (o.peek) {
      const hr = sz * 0.17, bob = Math.sin(G.rt * 6 + x) * hr * 0.15, hy = -h / 2 - hr * 0.45 + bob;
      g.strokeStyle = sh.ol; g.lineWidth = Math.max(1, sz * 0.03);
      g.beginPath(); g.moveTo(-hr * 0.4, hy - hr * 0.7); g.lineTo(-hr * 0.8, hy - hr * 1.6); g.moveTo(hr * 0.4, hy - hr * 0.7); g.lineTo(hr * 0.8, hy - hr * 1.6); g.stroke();
      g.fillStyle = '#ff8fb3';
      for (const s of [-1, 1]) { ell(g, s * hr * 0.8, hy - hr * 1.6, hr * 0.25, hr * 0.25); g.fill(); }
      g.fillStyle = ANT_BODY[ci]; ell(g, 0, hy, hr, hr); g.fill(); g.stroke();
      g.fillStyle = '#2a2030';
      for (const s of [-1, 1]) { ell(g, s * hr * 0.38, hy, hr * 0.15, hr * 0.2); g.fill(); }
    }
    const spr = boxSprite(ci, sz, o.peek), sc = sz / spr.px, dw = spr.cw * sc, dh = spr.ch * sc;
    g.drawImage(spr.cv, -dw / 2, -dh / 2, dw, dh);
    if (num != null) {
      const ny = h * (o.numY == null ? 0.1 : o.numY);
      const ns = numSprite(ci, sz, num), nsc = sz / ns.px, nw = ns.cw * nsc, nh = ns.ch * nsc;
      g.drawImage(ns.cv, -nw / 2, ny - nh / 2, nw, nh);
    }
    g.restore();
    return;
  }
  if (al !== 1) g.globalAlpha = al;
  const spr = boxSprite(ci, sz, false), sc = sz / spr.px, dw = spr.cw * sc, dh = spr.ch * sc;
  g.drawImage(spr.cv, x - dw / 2, y - dh / 2, dw, dh);
  if (num != null) {
    const ny = y + h * (o.numY == null ? 0.1 : o.numY);
    const ns = numSprite(ci, sz, num), nsc = sz / ns.px, nw = ns.cw * nsc, nh = ns.ch * nsc;
    g.drawImage(ns.cv, x - nw / 2, ny - nh / 2, nw, nh);
  }
  if (al !== 1) g.globalAlpha = 1;
}
function drawZz(x, y, sz, g) {
  g = g || ctx;
  const r = Math.max(7, sz * 0.16), bob = Math.sin(G.rt * 3) * 2;
  g.fillStyle = '#fff'; ell(g, x, y + bob, r, r); g.fill();
  g.fillStyle = '#a08ab0'; g.font = fnt(900, r * 1.1); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', x, y + bob);
}
function renderTrayTo(g, needHc) {
  const L = panelL, TW = panelR - panelL, gk = trayTop + '|' + CH;
  if (!trayGrad || trayGradKey !== gk) {
    trayGradKey = gk;
    trayGrad = ctx.createLinearGradient(0, trayTop, 0, CH);
    trayGrad.addColorStop(0, '#fff1d0'); trayGrad.addColorStop(1, '#ffd99a');
  }
  g.fillStyle = 'rgba(160,100,40,.2)'; roundRect(g, L, trayTop + 5, TW, CH - trayTop - 6, 22); g.fill();
  g.fillStyle = trayGrad; roundRect(g, L, trayTop, TW, CH - trayTop - 8, 22); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
  let maxShow = 1;
  while (maxShow < TRAY_MAX && trayHeadY + (TY[maxShow] + 0.41 * TSC[maxShow]) * headSize <= CH - 12) maxShow++;
  const isDanger = G.s.boxes.length >= SLOT_COUNT - 1 && G.fever.t <= 0;
  for (let j = 0; j < G.s.cols.length; j++) {
    const col = G.s.cols[j], h = G.s.heads[j], rest = col.length - h;
    let x = trayX(j);
    if (G.shake && G.shake.j === j) x += Math.sin(G.shake.t * 60) * 7 * (G.shake.t / 0.24);
    if (rest <= 0) {
      g.strokeStyle = 'rgba(200,140,70,.45)'; g.lineWidth = 2; g.setLineDash([5, 4]);
      roundRect(g, x - headSize / 2, trayHeadY - headSize * 0.42, headSize, headSize * 0.84, headSize * 0.24); g.stroke(); g.setLineDash([]);
      continue;
    }
    const off = G.trayOff[j], fr = trayGap > 0 ? off / trayGap : 0;
    for (let k = Math.min(maxShow, rest) - 1; k >= 0; k--) {
      const b = col[h + k];
      let s = lerp(TSC[k], TSC[k + 1], fr) * headSize, sx = 1, sy = 1;
      if (k === 0 && G.press && G.press.j === j && !G.press.previewed) { sx = 1.18; sy = 0.8; }
      if (k === 0 && G.queued && G.queued.j === j) s *= 1 + 0.05 * Math.sin(G.rt * 20);
      if (k === 0 && needHc && !G.hc) G.hc = headCounts(G.s);
      const rr = (k === 0 && G.hc) ? (G.hc[j] || 0) : 0;
      const y = trayHeadY + lerp(TY[k], TY[k + 1], fr) * headSize, dim = k === 0 && (save.settings.dim || isDanger) && rr === 0;
      const al = k === maxShow - 1 ? 1 - fr : 1;
      drawBox(x, y, s, b.c, b.n, { alpha: al, numY: k > 0 ? 0.22 : 0.1, sx, sy }, g);
      if (dim && g === ctx) drawZz(x + s * 0.42, y - s * 0.4, s, g);
      if (k === 0 && isDanger && rr === 0) {
        const wr = Math.max(8, s * 0.18), wx = x - s * 0.38, wy = y - s * 0.36;
        g.fillStyle = '#ff4d6d'; ell(g, wx, wy, wr, wr); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#fff'; g.font = fnt(900, wr * 1.25); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('!', wx, wy + 0.5);
      }
      if (k === 0 && (G.scanId === G.levelId || isDanger) && rr >= b.n) {
        const p = 0.5 + 0.5 * Math.sin(G.rt * 6);
        g.strokeStyle = 'rgba(63,174,127,' + (0.75 + 0.25 * p) + ')'; g.lineWidth = 3.5;
        roundRect(g, x - s * 0.54, y - s * 0.45, s * 1.08, s * 0.9, s * 0.26); g.stroke();
        if (!save.settings.info) {
          const txt = '✓全部';
          g.font = fnt(900, Math.max(10, s * 0.19));
          const tw = g.measureText(txt).width + 10, th = Math.max(14, s * 0.25);
          g.fillStyle = '#3fae7f';
          roundRect(g, x - tw / 2, y - s * 0.45 - th * 0.72, tw, th, th / 2); g.fill();
          g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
          g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(txt, x, y - s * 0.45 - th * 0.22);
        }
      }
      if (k === 0 && save.settings.info) {
        const txt = rr + '/' + b.n;
        g.font = fnt(800, Math.max(10, s * 0.2));
        const tw = g.measureText(txt).width + 10, th = Math.max(14, s * 0.26);
        g.fillStyle = rr >= b.n ? '#3fae7f' : rr > 0 ? '#ff9a3c' : '#a08ab0';
        roundRect(g, x - tw / 2, y + s * 0.38, tw, th, th / 2); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y + s * 0.38 + th / 2);
      }
    }
    // のこりの箱の数：見えているいちばん奥の箱の右に出す
    if (rest > maxShow) {
      const kLast = maxShow - 1;
      g.fillStyle = 'rgba(120,70,30,.75)'; g.font = fnt(800, Math.max(10, headSize * 0.24)); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText('+' + (rest - maxShow), x + TSC[kLast] * headSize * 0.54 + 2, trayHeadY + TY[kLast] * headSize);
    }
  }
}
function drawTray() {
  const cols = G.s.cols, isDanger = G.s.boxes.length >= SLOT_COUNT - 1 && G.fever.t <= 0;
  const needHc = !!(save.settings.dim || save.settings.info || G.scanId === G.levelId || isDanger);
  if (needHc && !G.hc) G.hc = headCounts(G.s);
  let animated = !!(G.shake || G.queued || G.scanId === G.levelId || isDanger);
  if (!animated) {
    for (let j = 0; j < cols.length; j++) {
      if (G.trayOff[j] > 0) { animated = true; break; }
      if (save.settings.dim && G.s.heads[j] < cols[j].length && !G.hc[j]) { animated = true; break; }
    }
  }
  if (animated) {
    renderTrayTo(ctx, needHc);
    return;
  }
  const pressJ = G.press && !G.press.previewed ? G.press.j : -1;
  let key = G.levelId + '|' + panelL + '|' + panelR + '|' + trayTop + '|' + CH + '|' + dpr + '|' + (save.settings.cb ? 1 : 0) + '|' + (save.settings.dim ? 1 : 0) + '|' + (save.settings.info ? 1 : 0) + '|' + pressJ + '|sb' + G.s.boxes.length;
  for (let j = 0; j < cols.length; j++) {
    const col = cols[j], h = G.s.heads[j], b0 = col[h];
    key += '|' + h + '/' + col.length + (b0 ? ':' + b0.c + ',' + b0.n : '');
    if (needHc) key += '#' + (G.hc[j] || 0);
  }
  const padTop = 8, y0 = Math.max(0, Math.floor(trayTop - padTop)), th = Math.max(1, Math.ceil(CH - y0 + 4));
  const pw = Math.max(1, Math.ceil(CW * dpr)), ph = Math.max(1, Math.ceil(th * dpr));
  if (trayCacheKey !== key || trayCv.width !== pw || trayCv.height !== ph) {
    trayCacheKey = key;
    if (trayCv.width !== pw || trayCv.height !== ph) { trayCv.width = pw; trayCv.height = ph; }
    trayG.setTransform(1, 0, 0, 1, 0, 0); trayG.clearRect(0, 0, pw, ph);
    trayG.setTransform(dpr, 0, 0, dpr, 0, -y0 * dpr);
    renderTrayTo(trayG, needHc);
  }
  ctx.drawImage(trayCv, 0, y0, CW, th);
}
function drawSlotBoxes() {
  for (const b of G.vboxes) {
    let x = slotX(b.slot), y = slotY, sz = slotSize;
    const o = {}, num = b.total - b.dispatched;
    if (b.state === 'fly') {
      const t = clamp(b.t / 0.17, 0, 1), e = easeOutCubic(t);
      x = lerp(b.fx, x, e); y = lerp(b.fy, y, e) - Math.sin(Math.PI * t) * Math.min(70, CH * 0.09); sz = lerp(b.fs, slotSize, e);
      o.sx = 0.86; o.sy = 1.16;
    } else if (b.state === 'land') {
      const k = Math.sin(Math.PI * clamp(b.t / 0.09, 0, 1));
      o.sx = 1 + 0.16 * k; o.sy = 1 - 0.2 * k;
    } else if (b.state === 'leave') o.sx = o.sy = Math.max(0, 1 - easeInBack(clamp(b.t / 0.18, 0, 1)));
    const wakeAge = b.wakeT ? (G.rt - b.wakeT) : 99;
    if (wakeAge < 0.42) {
      const wk = wakeAge / 0.42;
      y -= Math.sin(wk * Math.PI) * slotSize * 0.22;
      o.sx = (o.sx || 1) * (1 + 0.12 * Math.sin(wk * Math.PI));
      o.sy = (o.sy || 1) * (1 - 0.08 * Math.sin(wk * Math.PI));
    }
    if (G.jamShake > 0) x += Math.sin(G.rt * 60 + b.slot) * 3 * (G.jamShake / 0.4);
    o.peek = b.state === 'slot' && num > 0;
    drawBox(x, y, sz, b.c, b.state === 'fly' ? b.total : num, o);
    if (b.state === 'land' && b.t < 0.09) {
      const fa = 1 - b.t / 0.09;
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 * fa) + ')'; ctx.lineWidth = 3.5;
      roundRect(ctx, x - sz * 0.56, y - sz * 0.48, sz * 1.12, sz * 0.96, sz * 0.24); ctx.stroke();
      ctx.restore();
    }
    if (wakeAge < 0.42) {
      const wk = wakeAge / 0.42;
      ctx.save(); ctx.strokeStyle = 'rgba(255,215,64,' + (0.9 * (1 - wk)) + ')'; ctx.lineWidth = 3.5;
      const rs = sz * (1.06 + wk * 0.28);
      roundRect(ctx, x - rs * 0.54, y - rs * 0.46, rs * 1.08, rs * 0.92, rs * 0.26); ctx.stroke();
      ctx.restore();
    }
    if (b.state === 'slot' && num > 0 && !b.queue.length) drawZz(x + sz * 0.45, y - sz * 0.45, sz);
  }
}
function drawAnts() {
  const ants = G.ants, len = ants.length;
  if (!len) return;
  const u = antU, csz = u * 1.3, hcsz = csz * 0.5, sw = u * 2.6, sh = u * 3.2;
  const oxR = -u * 1.25, oxL = -u * 1.35, oyA = -u * 2.0, u25 = u * 0.25;
  let dirtyTf = false;
  for (let i = 0; i < len; i++) {
    const a = ants[i];
    const wx = ox + (a.x - 0.5) * cs, wy0 = oy + (a.y - 0.5) * cs;
    const fr = Math.floor(a.phase) & 3;
    // 行き（手ぶら）：回転・拡縮なしのため左右キャッシュ済みスプライトを save/restore なしで1発描画
    if (a.state === 'out') {
      if (dirtyTf) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dirtyTf = false; }
      const by = -Math.abs(Math.sin(a.phase * 0.8)) * u25;
      const flip = a.face < 0;
      ctx.drawImage(antSprite(a.c, 0, fr, flip), wx + (flip ? oxL : oxR), wy0 - u25 + by + oyA, sw, sh);
      continue;
    }
    let pose = 1, sx = 1, sy = 1, rot = 0, by = 0, lift = 1;
    if (a.state === 'back') {
      rot = Math.sin(a.phase * 0.9) * 0.13; by = -Math.abs(Math.sin(a.phase * 0.9)) * u * 0.12;
    } else if (a.state === 'pick') {
      const t = a.t / PICK;
      if (t < 0.35) { const k = Math.sin(t / 0.35 * Math.PI / 2); pose = 0; sx = 1 + 0.12 * k; sy = 1 - 0.16 * k; lift = 0; }
      else if (t < 0.75) { const k = (t - 0.35) / 0.4; pose = 2; sy = 1 + 0.1 * Math.sin(k * Math.PI); lift = easeOutBack(k); }
      else { pose = 1; lift = 1; }
    } else {
      const k = a.t / ENTER; sx = sy = 1 - k; by = k * u * 0.5;
    }
    const wy = wy0 - u25 + by;
    const cr = rot ? Math.cos(rot) : 1, sr = rot ? Math.sin(rot) : 0;
    const fx = sx * a.face, m0 = cr * fx * dpr, m1 = sr * fx * dpr, m2 = -sr * sy * dpr, m3 = cr * sy * dpr, m4 = wx * dpr, m5 = wy * dpr;
    ctx.setTransform(m0, m1, m2, m3, m4, m5);
    dirtyTf = true;
    if (G.skill && G.skill.boostT > 0 && (a.state === 'out' || a.state === 'back')) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,214,68,0.75)';
      ctx.lineWidth = Math.max(1.5, u * 0.16);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-u * 1.1, -u * 0.25); ctx.lineTo(-u * 2.1, -u * 0.25);
      ctx.moveTo(-u * 1.0, u * 0.25); ctx.lineTo(-u * 1.85, u * 0.25);
      ctx.stroke();
      ctx.restore();
    }
    ctx.drawImage(antSprite(a.c, pose, pose === 2 ? 0 : fr, false), oxR, oyA, sw, sh);
    if (lift >= 0) {
      const cx = lerp(u * 1.0, u * 0.36, clamp(lift, 0, 1)), cy = lerp(u * 0.8 - hcsz, -u * 1.02 - hcsz, lift);
      if (a.state === 'back') {
        const crot = Math.sin(a.phase * 0.9 + 1) * 0.12, cc = Math.cos(crot), cs2 = Math.sin(crot);
        ctx.setTransform(m0 * cc + m2 * cs2, m1 * cc + m3 * cs2, -m0 * cs2 + m2 * cc, -m1 * cs2 + m3 * cc, m0 * cx + m2 * cy + m4, m1 * cx + m3 * cy + m5);
        ctx.drawImage(candySpr[a.c], -hcsz, -hcsz, csz, csz);
        if (a.sweat < 0.6) {
          ctx.setTransform(m0, m1, m2, m3, m4, m5);
          const k = 1 - a.sweat / 0.6;
          ctx.globalAlpha = 1 - k; ctx.fillStyle = '#7cc4ff';
          ctx.beginPath(); ctx.arc(-u * 0.1, -u * 0.5 + k * u * 0.4, u * 0.13, 0, Math.PI); ctx.lineTo(-u * 0.1, -u * 0.75 + k * u * 0.4); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.drawImage(candySpr[a.c], cx - hcsz, cy - hcsz, csz, csz);
      }
    }
  }
  if (dirtyTf) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function drawFxLocal() {
  for (const p of G.parts) {
    ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.col;
    if (p.star) { starPath(ctx, p.x, p.y, p.s, p.s * 0.45, 5); ctx.fill(); } else { ell(ctx, p.x, p.y, p.s / 2, p.s / 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  const fsB = clamp(antPx * 0.58, 11, 14), placed = [];
  ctx.font = fnt(800, fsB);
  for (const b of G.bubbles) {
    const w = toW(b.a.x, b.a.y), k = b.t / b.life, sc = b.t < 0.15 ? easeOutBack(b.t / 0.15) : 1;
    const bw = Math.min(CW - 12, ctx.measureText(b.text).width + fsB * 1.25), bh = fsB * 1.7, by = -bh - fsB * 0.45;
    const cx = CW > bw + 12 ? clamp(w.x, 6 + bw / 2, CW - 6 - bw / 2) : CW / 2;
    let yy = clamp(w.y - antU * 1.9, 6 - by, Math.max(6 - by, CH - 8));
    for (let tries = 0; tries < 4; tries++) {
      const l = cx - bw / 2, r = cx + bw / 2, t = yy + by, bot = t + bh;
      const hit = placed.find(p => l < p.r + 4 && r > p.l - 4 && t < p.b + 4 && bot > p.t - 4);
      if (!hit) break;
      yy = Math.max(6 - by, hit.t - (by + bh) - 5);
    }
    const topY = Math.max(yy, 6 - by) + by;
    placed.push({ l: cx - bw / 2, r: cx + bw / 2, t: topY, b: topY + bh });
    paintBubble(ctx, w.x, yy, b.text, fsB, sc, k > 0.8 ? (1 - k) / 0.2 : 1);
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
  const W = G.s.W, H = G.s.H, mx = bcx();
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
  ctx.fillStyle = '#fff'; roundRect(ctx, mx - tw / 2, ty - 14, tw, 28, 14); ctx.fill();
  ctx.fillStyle = '#5a3d5c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, mx, ty);
}
function getLv1RecCol() {
  const s = G.s;
  if (!s) return -1;
  const rc = G.rc || reachableCounts(s);
  if (G.recCol >= 0 && G.recCol < s.cols.length && s.heads[G.recCol] < s.cols[G.recCol].length && (rc.get(headBox(s, G.recCol).c) || 0) > 0) {
    return G.recCol;
  }
  let j = followsSolution() ? G.level.solution[G.moves.length] : -1;
  if (j == null || j < 0 || s.heads[j] >= s.cols[j].length || !(rc.get(headBox(s, j).c) > 0)) {
    j = headsOf(s).find(k => (rc.get(headBox(s, k).c) || 0) > 0);
    if (j == null) j = -1;
  }
  G.recCol = j;
  return j;
}
function drawSpotlightAndFlashes() {
  if (!G.s || G.overlay || G.preview) return;
  const s = G.s, W = s.W, H = s.H, ne = nestGate();
  const redMot = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
  let dist = null;
  if (!G.prevVisReach) {
    dist = visDist(ne.ex, ne.ey);
    G.prevVisReach = new Set();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (G.vgrid[idx] >= 0 && cubeDist(dist, W, x, y) >= 0) G.prevVisReach.add(idx);
    }
  }
  const lv1Guide = posOf(G.levelId) === 1 && (!save.cleared[G.levelId] || G.firstSim) && G.moves.length < 3;
  const targetMask = lv1Guide ? (G.moves.length === 0 ? 0.34 : G.moves.length === 1 ? 0.14 : 0) : 0;
  G.maskAlpha = (G.maskAlpha || 0) + (targetMask - (G.maskAlpha || 0)) * 0.18;
  if (G.maskAlpha > 0.01) {
    const ix = ox - cs, iy = oy - cs, iw = (W + 2) * cs, ih = (H + 2) * cs, ir = Math.max(6, cs * 0.8);
    ctx.save();
    ctx.fillStyle = 'rgba(28,14,38,' + G.maskAlpha.toFixed(3) + ')';
    roundRect(ctx, ix, iy, iw, ih, ir); ctx.fill();
    ctx.restore();
  }
  if (lv1Guide) {
    const j = getLv1RecCol();
    if (j >= 0) {
      if (!dist) dist = visDist(ne.ex, ne.ey);
      const c = headBox(s, j).c, pulse = Math.max(0, Math.sin(G.rt * 6.3)), sync = 1 + pulse * (redMot ? 0.02 : 0.07);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        // 予約済み(G.s.gridで消えた)セルは除外し、論理盤面と完全一致させる
        if (s.grid[idx] !== c || G.vgrid[idx] !== c || cubeDist(dist, W, x, y) < 0) continue;
        const cx = ox + (x + 0.5) * cs, cy = oy + (y + 0.5) * cs, d = cs * sync;
        ctx.drawImage(cubeSpr[c], cx - d / 2, cy - d / 2, d, d);
        if (!redMot) {
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.55 * pulse) + ')';
          ctx.lineWidth = Math.max(1.5, cs * 0.09);
          ctx.strokeRect(cx - d / 2, cy - d / 2, d, d);
        }
      }
      ctx.restore();
    }
  }
  // 箱をタップして運ぶ対象に決まったキャンディのロックオン演出
  if (G.assignFlashes && G.assignFlashes.length) {
    ctx.save();
    for (let i = G.assignFlashes.length - 1; i >= 0; i--) {
      const f = G.assignFlashes[i], el = G.rt - f.t0;
      if (el >= f.dur || G.vgrid[f.idx] < 0) { G.assignFlashes.splice(i, 1); continue; }
      if (el < 0) continue;
      const k = el / f.dur, pop = 1 + (redMot ? 0 : 0.22 * Math.sin(k * Math.PI));
      const x = f.idx % W, y = (f.idx - x) / W, cx = ox + (x + 0.5) * cs, cy = oy + (y + 0.5) * cs, d = cs * pop;
      ctx.drawImage(cubeSpr[f.c], cx - d / 2, cy - d / 2, d, d);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.95 * (1 - k * 0.7)) + ')';
      ctx.lineWidth = Math.max(1.8, cs * 0.14);
      ctx.strokeRect(cx - d / 2, cy - d / 2, d, d);
    }
    ctx.restore();
  }
  // どの箱を押しても、取れる同色キャンディを一瞬光らせる
  if (G.tapFlash && G.rt - G.tapFlash.t0 < 0.25) {
    if (!dist) dist = visDist(ne.ex, ne.ey);
    const fa = 1 - (G.rt - G.tapFlash.t0) / 0.25, fc = G.tapFlash.c;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.75 * fa) + ')';
    ctx.lineWidth = Math.max(1.5, cs * 0.1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (s.grid[idx] !== fc || G.vgrid[idx] !== fc || cubeDist(dist, W, x, y) < 0) continue;
      ctx.strokeRect(ox + x * cs, oy + y * cs, cs, cs);
    }
    ctx.restore();
  }
  // 新しく外から通れるようになったキャンディの白フラッシュ
  if (G.newReachFlashes && G.newReachFlashes.length) {
    ctx.save();
    for (let i = G.newReachFlashes.length - 1; i >= 0; i--) {
      const f = G.newReachFlashes[i], el = G.rt - f.t0;
      if (el >= f.dur) { G.newReachFlashes.splice(i, 1); continue; }
      const a = 1 - el / f.dur;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * a) + ')';
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * a) + ')';
      ctx.lineWidth = Math.max(1.5, cs * 0.1);
      ctx.fillRect(ox + f.x * cs, oy + f.y * cs, cs, cs);
      ctx.strokeRect(ox + f.x * cs, oy + f.y * cs, cs, cs);
    }
    ctx.restore();
  }
  // アリがキャンディを拾った瞬間の光輪
  if (G.pickFlashes && G.pickFlashes.length) {
    ctx.save();
    for (let i = G.pickFlashes.length - 1; i >= 0; i--) {
      const f = G.pickFlashes[i], el = G.rt - f.t0;
      if (el >= f.dur) { G.pickFlashes.splice(i, 1); continue; }
      const k = el / f.dur, cx = ox + (f.x + 0.5) * cs, cy = oy + (f.y + 0.5) * cs;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - k)) + ')';
      ctx.lineWidth = Math.max(2, cs * 0.14 * (1 - k * 0.5));
      ctx.beginPath(); ctx.arc(cx, cy, cs * (0.45 + k * 0.55), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}
function drawGuides() {
  if (G.hintCol >= 0 && G.s && G.s.heads[G.hintCol] >= G.s.cols[G.hintCol].length) G.hintCol = -1;
  const tutJ = (typeof Tut !== 'undefined' && Tut.wantCol) ? Tut.wantCol() : -1;
  const hj = tutJ >= 0 ? tutJ : G.hintCol;
  if (hj >= 0 && G.s && G.s.heads[hj] < G.s.cols[hj].length) {
    const x = trayX(hj), p = 0.5 + 0.5 * Math.sin(G.rt * 7), S = headSize * (1.18 + 0.08 * p);
    ctx.strokeStyle = 'rgba(255,200,40,' + (0.6 + 0.4 * p) + ')'; ctx.lineWidth = 4;
    roundRect(ctx, x - S / 2, trayHeadY - S * 0.45, S, S * 0.9, S * 0.26); ctx.stroke();
    ctx.fillStyle = '#ffb020'; ctx.font = fnt(900, headSize * 0.34); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('▼', x, trayHeadY - S * 0.45 - 2 - p * 4);
  }
  if (G.overlay || G.preview) return;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  if (posOf(G.levelId) === 1 && (!save.cleared[G.levelId] || G.firstSim) && G.moves.length < 3 && G.s) {
    const j = getLv1RecCol();
    if (j >= 0) {
      const redMot = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
      const pulse = Math.max(0, Math.sin(G.rt * 6.3));
      const bx = trayX(j), by = trayHeadY, bs = headSize * (1 + pulse * (redMot ? 0.02 : 0.05));
      ctx.save();
      ctx.strokeStyle = 'rgba(255,90,138,' + (0.65 + 0.35 * pulse) + ')';
      ctx.lineWidth = 5.5;
      roundRect(ctx, bx - bs * 0.56, by - bs * 0.47, bs * 1.12, bs * 0.94, bs * 0.25); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 + 0.3 * pulse) + ')';
      ctx.lineWidth = 2.2;
      roundRect(ctx, bx - bs * 0.53, by - bs * 0.44, bs * 1.06, bs * 0.88, bs * 0.23); ctx.stroke();
      const idleT = G.rt - (G.lastTapT || 0);
      const showPtr = !G.press && G.ants.length === 0 && ((G.moves.length === 0 && idleT >= 0.25) || (G.moves.length > 0 && idleT >= 2.2));
      if (showPtr) {
        const rp = (G.rt % 1.2) / 1.2, pressY = rp < 0.45 ? 0 : 4;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 * (1 - rp)) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(bx, by, headSize * (0.28 + rp * 0.42), 0, Math.PI * 2); ctx.stroke();
        const px = bx + headSize * 0.16, py = by + headSize * 0.16 + pressY, pr = Math.max(7, headSize * 0.14);
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = '#ff6f9f'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, py + pr * 0.7); ctx.lineTo(px + pr * 0.9, py + pr * 1.9);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(4, pr * 0.55); ctx.lineCap = 'round'; ctx.stroke();
        paintBubble(ctx, bx, by - headSize * 0.48, G.moves.length === 0 ? '👆 光る箱をタップ！' : '👆 つぎはこの箱！', 12, 1, 0.96);
      }
      ctx.restore();
    }
  }
  if (posOf(G.levelId) === 2 && !save.flags.lp && G.moves.length < 4 && G.s) {
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
  if (G.solDirty) return false;
  const sol = G.level.solution;
  if (G.moves.length > sol.length) return false;
  for (let i = 0; i < G.moves.length; i++) if (G.moves[i] !== sol[i]) return false;
  return true;
}
function drawSingerCostume(g, u, key, t, singing) {
  const lw = Math.max(1, u * 0.09);
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (key === 'katatsumuri') {
    // エルヴィス・プレスリー風：白＆金のスタッズ付きジャンプスーツ＋赤いスカーフ＋リーゼント＋サングラス
    // 白いマント（後ろ）
    g.fillStyle = '#fff8fc'; g.strokeStyle = '#d4a030'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.1 * u, -0.1 * u); g.lineTo(-1.18 * u, 0.45 * u); g.lineTo(-0.85 * u, 0.68 * u); g.lineTo(0.1 * u, 0.25 * u);
    g.closePath(); g.fill(); g.stroke();
    // 白いボディスーツ＆高い襟（ハイカラー）
    g.fillStyle = '#ffffff'; g.strokeStyle = '#5a3d5c'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.78 * u, 0.02 * u); g.quadraticCurveTo(-0.2 * u, -0.12 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.18 * u, 0.56 * u); g.lineTo(-0.82 * u, 0.48 * u); g.closePath();
    g.fill(); g.stroke();
    // 立てた襟
    g.beginPath(); g.moveTo(0.02 * u, -0.02 * u); g.lineTo(0.24 * u, -0.34 * u); g.lineTo(0.36 * u, -0.06 * u); g.closePath();
    g.fill(); g.stroke();
    // 赤いスカーフ＆金のベルト・スタッズ
    g.fillStyle = '#ff3b5c';
    g.beginPath(); g.moveTo(0.16 * u, -0.04 * u); g.lineTo(0.32 * u, 0.22 * u); g.lineTo(0.06 * u, 0.16 * u); g.closePath(); g.fill();
    g.fillStyle = '#ffd23f';
    g.fillRect(-0.62 * u, 0.24 * u, 0.72 * u, 0.12 * u);
    for (const sx of [-0.55, -0.32, -0.1, 0.08]) { ell(g, sx * u, 0.12 * u, 0.055 * u, 0.055 * u); g.fill(); }
    // 黒いリーゼント（ポンパドール）
    g.fillStyle = '#241c2c'; g.strokeStyle = '#140e1a'; g.lineWidth = lw * 0.9;
    g.beginPath();
    g.moveTo(0.02 * u, -0.58 * u);
    g.quadraticCurveTo(0.42 * u, -1.18 * u, 0.96 * u, -0.78 * u);
    g.quadraticCurveTo(0.88 * u, -0.54 * u, 0.52 * u, -0.62 * u);
    g.closePath(); g.fill(); g.stroke();
    // ロックスター風サングラス
    g.fillStyle = '#2b2040'; g.strokeStyle = '#ffd23f'; g.lineWidth = lw * 0.95;
    roundRect(g, 0.42 * u, -0.48 * u, 0.48 * u, 0.28 * u, 0.09 * u); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0.42 * u, -0.36 * u); g.lineTo(0.1 * u, -0.44 * u); g.stroke();
  } else if (key === 'sakura') {
    // 演歌歌手風：豪華な振袖（着物）＋金襴の帯＋かんざし
    // 振袖の袖・裾（赤紫〜桜グラデ）
    const kg = g.createLinearGradient(-0.9 * u, -0.1 * u, 0.3 * u, 0.65 * u);
    kg.addColorStop(0, '#c81e5a'); kg.addColorStop(0.55, '#e8437a'); kg.addColorStop(1, '#ff9cc8');
    g.fillStyle = kg; g.strokeStyle = '#6b1235'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.02 * u); g.quadraticCurveTo(-0.2 * u, -0.14 * u, 0.28 * u, -0.02 * u);
    g.lineTo(0.24 * u, 0.68 * u); g.lineTo(-0.96 * u, 0.62 * u); g.closePath();
    g.fill(); g.stroke();
    // 白い半衿
    g.fillStyle = '#fff'; g.strokeStyle = '#c81e5a'; g.lineWidth = lw * 0.7;
    g.beginPath(); g.moveTo(0.06 * u, -0.06 * u); g.lineTo(0.26 * u, -0.04 * u); g.lineTo(0.18 * u, 0.16 * u); g.closePath();
    g.fill(); g.stroke();
    // 金の豪華な帯（おび）
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#b87b00'; g.lineWidth = lw * 0.85;
    roundRect(g, -0.58 * u, 0.12 * u, 0.66 * u, 0.28 * u, 0.06 * u); g.fill(); g.stroke();
    // 後ろの帯結び
    roundRect(g, -0.92 * u, -0.02 * u, 0.32 * u, 0.32 * u, 0.08 * u); g.fill(); g.stroke();
    // 花かんざし（垂れ飾り付き）
    g.strokeStyle = '#ffd23f'; g.lineWidth = lw * 0.8;
    g.beginPath(); g.moveTo(0.12 * u, -0.66 * u); g.lineTo(-0.18 * u, -0.92 * u); g.stroke();
    g.beginPath(); g.moveTo(0.12 * u, -0.62 * u); g.lineTo(0.02 * u, -0.36 * u); g.stroke();
    for (let k = 0; k < 5; k++) {
      const a = k * Math.PI * 2 / 5;
      g.fillStyle = k % 2 ? '#ff6b9a' : '#ffdce8';
      ell(g, (0.14 + Math.cos(a) * 0.13) * u, (-0.68 + Math.sin(a) * 0.13) * u, 0.08 * u, 0.08 * u); g.fill();
    }
    g.fillStyle = '#ffd23f'; ell(g, 0.14 * u, -0.68 * u, 0.06 * u, 0.06 * u); g.fill();
  } else if (key === 'kirakiraboshi') {
    // つきよのねこ（きらきらぼし）：夜空のスタープリンセスドレス＋星のステッキ＋星ティアラ
    const ng = g.createLinearGradient(-0.9 * u, -0.1 * u, 0.3 * u, 0.65 * u);
    ng.addColorStop(0, '#1e2761'); ng.addColorStop(0.6, '#3949ab'); ng.addColorStop(1, '#7986cb');
    g.fillStyle = ng; g.strokeStyle = '#121842'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.9 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.64 * u); g.lineTo(-0.98 * u, 0.58 * u); g.closePath();
    g.fill(); g.stroke();
    // 金の星マント＆散りばめられた星
    g.fillStyle = '#ffd23f';
    for (const [sx, sy, sr] of [[-0.62, 0.25, 0.1], [-0.32, 0.42, 0.08], [0.02, 0.28, 0.09]]) {
      starPath(g, sx * u, sy * u, sr * u, sr * 0.45 * u, 5); g.fill();
    }
    // 星のステッキ（後ろ手にキラリ）
    g.strokeStyle = '#ffd23f'; g.lineWidth = lw * 0.85;
    g.beginPath(); g.moveTo(-0.65 * u, 0.1 * u); g.lineTo(-1.1 * u, -0.52 * u); g.stroke();
    g.fillStyle = '#fff59d'; starPath(g, -1.12 * u, -0.56 * u, 0.18 * u, 0.08 * u, 5); g.fill(); g.stroke();
    // 星ティアラ
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#b87b00'; g.lineWidth = lw * 0.75;
    starPath(g, 0.46 * u, -0.84 * u, 0.22 * u, 0.1 * u, 5); g.fill(); g.stroke();
  } else if (key === 'alps') {
    // ドーナツ（アルプスいちまんじゃく）：カラフルポップな水玉＆スプリンクル衣装＋音符カチューシャ
    g.fillStyle = '#ff6b8b'; g.strokeStyle = '#8c1d40'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.05 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.96 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    // カラフルスプリンクル水玉
    const dots = [[-0.64, 0.24, '#ffd23f'], [-0.34, 0.36, '#4ecdc4'], [-0.04, 0.2, '#fff'], [-0.52, 0.46, '#a5f3fc'], [0.12, 0.44, '#fde047']];
    for (const [dx, dy, dc] of dots) { g.fillStyle = dc; ell(g, dx * u, dy * u, 0.085 * u, 0.085 * u); g.fill(); }
    // ドーナツ風クリーム襟
    g.fillStyle = '#fff5e4';
    for (let k = 0; k < 4; k++) { ell(g, (-0.52 + k * 0.24) * u, 0.04 * u, 0.11 * u, 0.07 * u); g.fill(); }
    // 音符カチューシャ
    g.strokeStyle = '#4ecdc4'; g.lineWidth = lw * 1.1;
    g.beginPath(); g.arc(0.46 * u, -0.45 * u, 0.28 * u, -Math.PI * 0.85, -Math.PI * 0.15); g.stroke();
    g.fillStyle = '#ffd23f'; ell(g, 0.48 * u, -0.86 * u, 0.12 * u, 0.09 * u); g.fill();
    g.strokeStyle = '#b87b00'; g.lineWidth = lw * 0.85;
    g.beginPath(); g.moveTo(0.57 * u, -0.86 * u); g.lineTo(0.57 * u, -1.16 * u); g.lineTo(0.74 * u, -1.08 * u); g.stroke();
  } else if (key === 'usagi') {
    // うさぎ（うさぎとかめ）：うさ耳カチューシャ＋ふわふわしっぽ＋パステルベスト
    // ふわふわ白いしっぽ
    g.fillStyle = '#fff'; g.strokeStyle = '#c4a6b8'; g.lineWidth = lw * 0.85;
    ell(g, -0.92 * u, 0.26 * u, 0.19 * u, 0.19 * u); g.fill(); g.stroke();
    // パステルミントのアイドルベスト
    g.fillStyle = '#6ee7b7'; g.strokeStyle = '#047857'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.84 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.58 * u); g.lineTo(-0.9 * u, 0.52 * u); g.closePath();
    g.fill(); g.stroke();
    // ピンクのリボンタイ
    g.fillStyle = '#ff6b9a';
    g.beginPath(); g.moveTo(0.08 * u, 0.06 * u); g.lineTo(0.28 * u, -0.04 * u); g.lineTo(0.28 * u, 0.16 * u); g.closePath(); g.fill();
    // ぴょんと長いウサ耳カチューシャ
    for (const [ex, rot] of [[0.32, -0.22], [0.56, 0.16]]) {
      g.save(); g.translate(ex * u, -0.64 * u); g.rotate(rot);
      g.fillStyle = '#fff'; g.strokeStyle = '#5a3d5c'; g.lineWidth = lw * 0.9;
      ell(g, 0, -0.34 * u, 0.11 * u, 0.36 * u); g.fill(); g.stroke();
      g.fillStyle = '#ffb3d1';
      ell(g, 0, -0.34 * u, 0.055 * u, 0.24 * u); g.fill();
      g.restore();
    }
  } else if (key === 'kumasan') {
    // テディベア（もりのくまさん）：森の探検家ベスト＋赤いスカーフ＋羽根付き帽子
    g.fillStyle = '#2e7d32'; g.strokeStyle = '#1b5e20'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.84 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.24 * u, 0.58 * u); g.lineTo(-0.88 * u, 0.52 * u); g.closePath();
    g.fill(); g.stroke();
    // オレンジの探検スカーフ＆金のボタン
    g.fillStyle = '#ff7043';
    g.beginPath(); g.moveTo(0.04 * u, -0.04 * u); g.lineTo(0.3 * u, 0.18 * u); g.lineTo(-0.08 * u, 0.16 * u); g.closePath(); g.fill();
    g.fillStyle = '#ffd23f';
    ell(g, -0.24 * u, 0.24 * u, 0.06 * u, 0.06 * u); g.fill();
    ell(g, -0.52 * u, 0.28 * u, 0.06 * u, 0.06 * u); g.fill();
    // 羽根付き探検帽
    g.fillStyle = '#8d6e63'; g.strokeStyle = '#4e342e'; g.lineWidth = lw * 0.9;
    ell(g, 0.46 * u, -0.66 * u, 0.38 * u, 0.1 * u); g.fill(); g.stroke();
    g.beginPath(); g.arc(0.46 * u, -0.68 * u, 0.23 * u, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ff5252';
    g.beginPath(); g.moveTo(0.24 * u, -0.78 * u); g.quadraticCurveTo(0.04 * u, -1.04 * u, 0.28 * u, -1.06 * u); g.closePath(); g.fill();
  } else if (key === 'birthday') {
    // ショートケーキ（ハッピーバースデイ）：生クリームフリルドレス＋いちご＋キャンドルティアラ
    g.fillStyle = '#fff8f6'; g.strokeStyle = '#d81b60'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    // いちごピンクのリボン＆フリル裾
    g.fillStyle = '#ff6b9a';
    for (let k = 0; k < 4; k++) { ell(g, (-0.78 + k * 0.34) * u, 0.56 * u, 0.16 * u, 0.09 * u); g.fill(); }
    g.fillStyle = '#e53935'; ell(g, -0.22 * u, 0.24 * u, 0.11 * u, 0.13 * u); g.fill();
    // バースデイキャンドルティアラ
    g.fillStyle = '#ff80ab'; g.strokeStyle = '#ad1457'; g.lineWidth = lw * 0.8;
    roundRect(g, 0.4 * u, -1.02 * u, 0.14 * u, 0.36 * u, 0.04 * u); g.fill(); g.stroke();
    g.fillStyle = '#ffd54f'; ell(g, 0.47 * u, -1.12 * u, 0.08 * u, 0.13 * u); g.fill();
    g.fillStyle = '#ff7043'; ell(g, 0.47 * u, -1.1 * u, 0.04 * u, 0.07 * u); g.fill();
  } else if (key === 'fujinoyama') {
    // ふじさん（ふじの山）：富士山柄の青い着物＋赤い帯＋富士山の髪飾り
    g.fillStyle = '#2563eb'; g.strokeStyle = '#1e3a8a'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    // 白い雪化粧の衿＆赤い帯
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(-0.08 * u, -0.02 * u); g.lineTo(0.24 * u, 0.02 * u); g.lineTo(0.08 * u, 0.24 * u); g.closePath(); g.fill();
    g.fillStyle = '#ef4444';
    roundRect(g, -0.78 * u, 0.26 * u, 0.94 * u, 0.16 * u, 0.05 * u); g.fill();
    // 頭上のミニ富士山飾り
    g.fillStyle = '#3b82f6'; g.strokeStyle = '#1e3a8a'; g.lineWidth = lw * 0.8;
    g.beginPath(); g.moveTo(0.22 * u, -0.66 * u); g.lineTo(0.46 * u, -1.04 * u); g.lineTo(0.72 * u, -0.66 * u); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(0.36 * u, -0.88 * u); g.lineTo(0.46 * u, -1.04 * u); g.lineTo(0.57 * u, -0.88 * u); g.lineTo(0.51 * u, -0.84 * u); g.lineTo(0.46 * u, -0.88 * u); g.lineTo(0.41 * u, -0.84 * u); g.closePath(); g.fill();
  } else if (key === 'kamome') {
    // ほせん/すなはま（かもめの水兵さん）：マリンセーラー服＋赤いスカーフ＋水兵帽
    g.fillStyle = '#fff'; g.strokeStyle = '#1e3a8a'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.86 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.58 * u); g.lineTo(-0.92 * u, 0.54 * u); g.closePath();
    g.fill(); g.stroke();
    // 紺のセーラー襟＋赤いスカーフ
    g.fillStyle = '#1e40af';
    g.beginPath(); g.moveTo(-0.56 * u, 0.02 * u); g.lineTo(0.22 * u, 0.02 * u); g.lineTo(-0.08 * u, 0.26 * u); g.closePath(); g.fill();
    g.fillStyle = '#ef4444';
    g.beginPath(); g.moveTo(0.06 * u, 0.08 * u); g.lineTo(0.26 * u, 0.26 * u); g.lineTo(0.08 * u, 0.34 * u); g.closePath(); g.fill();
    // 水兵帽
    g.fillStyle = '#fff'; g.strokeStyle = '#1e3a8a'; g.lineWidth = lw * 0.85;
    ell(g, 0.46 * u, -0.7 * u, 0.32 * u, 0.12 * u); g.fill(); g.stroke();
    g.beginPath(); g.arc(0.46 * u, -0.72 * u, 0.21 * u, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#1e40af';
    roundRect(g, 0.24 * u, -0.76 * u, 0.44 * u, 0.09 * u, 0.03 * u); g.fill();
  } else if (key === 'nekofunjatta') {
    // ねこ（ねこふんじゃった）：ネコしっぽ＋鈴つきベスト＋ネコ耳カチューシャ
    g.strokeStyle = '#6d28d9'; g.lineWidth = lw * 1.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.84 * u, 0.34 * u); g.quadraticCurveTo(-1.18 * u, 0.08 * u, -1.02 * u, -0.22 * u); g.stroke();
    g.fillStyle = '#a78bfa'; g.strokeStyle = '#5b21b6'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.84 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.26 * u, 0.58 * u); g.lineTo(-0.9 * u, 0.52 * u); g.closePath();
    g.fill(); g.stroke();
    // 金の鈴
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#b45309'; g.lineWidth = lw * 0.7;
    ell(g, 0.14 * u, 0.12 * u, 0.11 * u, 0.11 * u); g.fill(); g.stroke();
    // 三角ネコ耳
    for (const ex of [0.28, 0.58]) {
      g.fillStyle = '#a78bfa'; g.strokeStyle = '#5b21b6'; g.lineWidth = lw * 0.85;
      g.beginPath(); g.moveTo((ex - 0.12) * u, -0.64 * u); g.lineTo(ex * u, -0.96 * u); g.lineTo((ex + 0.12) * u, -0.64 * u); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fbcfe8';
      g.beginPath(); g.moveTo((ex - 0.06) * u, -0.67 * u); g.lineTo(ex * u, -0.86 * u); g.lineTo((ex + 0.06) * u, -0.67 * u); g.closePath(); g.fill();
    }
  } else if (key === 'minuet') {
    // おしろ（メヌエット）：ロイヤルブルーの舞踏会ドレス＋金の王冠
    g.fillStyle = '#60a5fa'; g.strokeStyle = '#1d4ed8'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.34 * u, 0.64 * u); g.lineTo(-1.0 * u, 0.58 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#fef08a';
    for (let k = 0; k < 4; k++) { ell(g, (-0.78 + k * 0.34) * u, 0.58 * u, 0.16 * u, 0.09 * u); g.fill(); }
    // 王冠
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#b45309'; g.lineWidth = lw * 0.8;
    g.beginPath();
    g.moveTo(0.22 * u, -0.66 * u); g.lineTo(0.26 * u, -0.94 * u); g.lineTo(0.38 * u, -0.78 * u);
    g.lineTo(0.46 * u, -0.98 * u); g.lineTo(0.54 * u, -0.78 * u); g.lineTo(0.66 * u, -0.94 * u); g.lineTo(0.7 * u, -0.66 * u);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ef4444'; ell(g, 0.46 * u, -0.76 * u, 0.06 * u, 0.06 * u); g.fill();
  } else if (key === 'konpeitou') {
    // キャンディ（こんぺいとうの踊り）：妖精の羽＋金平糖チュチュ＋星ティアラ
    g.fillStyle = 'rgba(224,242,254,0.85)'; g.strokeStyle = '#7dd3fc'; g.lineWidth = lw * 0.8;
    ell(g, -0.78 * u, -0.22 * u, 0.22 * u, 0.34 * u); g.fill(); g.stroke();
    g.fillStyle = '#f9a8d4'; g.strokeStyle = '#be185d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.34 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    for (const [dx, dy, dc] of [[-0.6, 0.28, '#fde047'], [-0.32, 0.36, '#a5f3fc'], [-0.08, 0.22, '#fff'], [-0.5, 0.46, '#c4b5fd']]) {
      g.fillStyle = dc; starPath(g, dx * u, dy * u, 0.09 * u, 0.045 * u, 5); g.fill();
    }
    g.fillStyle = '#fde047'; g.strokeStyle = '#b45309'; g.lineWidth = lw * 0.75;
    starPath(g, 0.46 * u, -0.84 * u, 0.2 * u, 0.09 * u, 5); g.fill(); g.stroke();
  } else if (key === 'muramatsuri') {
    // きんぎょばち/だるま（むらまつり）：赤い祭り法被＋ねじり鉢巻
    g.fillStyle = '#e11d48'; g.strokeStyle = '#881337'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.86 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.6 * u); g.lineTo(-0.94 * u, 0.54 * u); g.closePath();
    g.fill(); g.stroke();
    // 黒襟＆金の祭マーク
    g.fillStyle = '#1e293b';
    roundRect(g, -0.12 * u, 0.02 * u, 0.28 * u, 0.34 * u, 0.04 * u); g.fill();
    g.fillStyle = '#ffd23f'; ell(g, -0.5 * u, 0.28 * u, 0.14 * u, 0.14 * u); g.fill();
    // 紅白ねじり鉢巻
    g.fillStyle = '#fff'; g.strokeStyle = '#e11d48'; g.lineWidth = lw * 0.9;
    roundRect(g, 0.16 * u, -0.68 * u, 0.62 * u, 0.14 * u, 0.06 * u); g.fill(); g.stroke();
    g.fillStyle = '#e11d48';
    ell(g, 0.3 * u, -0.61 * u, 0.05 * u, 0.06 * u); g.fill();
    ell(g, 0.56 * u, -0.61 * u, 0.05 * u, 0.06 * u); g.fill();
  } else if (key === 'harugakita') {
    // ひまわり（春が来た）：春色グリーンドレス＋ひまわり花冠
    g.fillStyle = '#4ade80'; g.strokeStyle = '#15803d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#facc15';
    for (let k = 0; k < 4; k++) { ell(g, (-0.52 + k * 0.22) * u, 0.06 * u, 0.1 * u, 0.07 * u); g.fill(); }
    // ひまわり花冠
    g.fillStyle = '#facc15'; g.strokeStyle = '#ca8a04'; g.lineWidth = lw * 0.7;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ell(g, (0.46 + Math.cos(a) * 0.18) * u, (-0.82 + Math.sin(a) * 0.18) * u, 0.09 * u, 0.09 * u); g.fill();
    }
    g.fillStyle = '#92400e'; ell(g, 0.46 * u, -0.82 * u, 0.12 * u, 0.12 * u); g.fill();
  } else if (key === 'toysoldiers') {
    // ロボット（おもちゃの兵隊の行進）：赤い兵隊コート＋金ボタン＋背の高いシャコー帽
    g.fillStyle = '#dc2626'; g.strokeStyle = '#7f1d1d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.84 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.26 * u, 0.58 * u); g.lineTo(-0.9 * u, 0.52 * u); g.closePath();
    g.fill(); g.stroke();
    // 白いクロスベルト＆金肩章
    g.strokeStyle = '#fff'; g.lineWidth = lw * 1.4;
    g.beginPath(); g.moveTo(-0.68 * u, 0.04 * u); g.lineTo(0.16 * u, 0.5 * u); g.stroke();
    g.fillStyle = '#ffd23f';
    ell(g, -0.12 * u, 0.2 * u, 0.06 * u, 0.06 * u); g.fill();
    ell(g, -0.44 * u, 0.34 * u, 0.06 * u, 0.06 * u); g.fill();
    // シャコー帽
    g.fillStyle = '#1e293b'; g.strokeStyle = '#0f172a'; g.lineWidth = lw * 0.85;
    roundRect(g, 0.24 * u, -1.04 * u, 0.44 * u, 0.38 * u, 0.04 * u); g.fill(); g.stroke();
    g.fillStyle = '#ffd23f'; ell(g, 0.46 * u, -0.86 * u, 0.08 * u, 0.08 * u); g.fill();
    g.fillStyle = '#ef4444'; ell(g, 0.46 * u, -1.1 * u, 0.07 * u, 0.1 * u); g.fill();
  } else if (key === 'jupiter') {
    // ロケット（木星）：白い宇宙服＋星バッジ＋透明宇宙ヘルメット
    g.fillStyle = '#f8fafc'; g.strokeStyle = '#475569'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.86 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.58 * u); g.lineTo(-0.92 * u, 0.54 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#38bdf8';
    roundRect(g, -0.68 * u, 0.24 * u, 0.78 * u, 0.12 * u, 0.04 * u); g.fill();
    g.fillStyle = '#fbbf24'; starPath(g, -0.1 * u, 0.18 * u, 0.11 * u, 0.05 * u, 5); g.fill();
    // 宇宙ヘルメットバイザー＆アンテナ
    g.fillStyle = 'rgba(125,211,252,0.32)'; g.strokeStyle = '#64748b'; g.lineWidth = lw * 0.9;
    ell(g, 0.46 * u, -0.34 * u, 0.46 * u, 0.42 * u); g.fill(); g.stroke();
    g.strokeStyle = '#64748b'; g.lineWidth = lw * 0.85;
    g.beginPath(); g.moveTo(0.46 * u, -0.76 * u); g.lineTo(0.46 * u, -1.04 * u); g.stroke();
    g.fillStyle = '#fbbf24'; ell(g, 0.46 * u, -1.06 * u, 0.07 * u, 0.07 * u); g.fill();
  } else if (key === 'kaeru') {
    // かえる（かえるのがっしょう）：カエルパーカー＋大きな目玉フード
    g.fillStyle = '#22c55e'; g.strokeStyle = '#15803d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.86 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.58 * u); g.lineTo(-0.92 * u, 0.54 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#bef264'; ell(g, -0.28 * u, 0.3 * u, 0.26 * u, 0.18 * u); g.fill();
    for (const ex of [0.28, 0.6]) {
      g.fillStyle = '#22c55e'; g.strokeStyle = '#15803d'; g.lineWidth = lw * 0.85;
      ell(g, ex * u, -0.78 * u, 0.15 * u, 0.15 * u); g.fill(); g.stroke();
      g.fillStyle = '#fff'; ell(g, ex * u, -0.78 * u, 0.09 * u, 0.09 * u); g.fill();
      g.fillStyle = '#1e293b'; ell(g, (ex + 0.02) * u, -0.78 * u, 0.045 * u, 0.045 * u); g.fill();
    }
  } else if (key === 'kisha') {
    // でんしゃ（汽車）：紺の車掌さん制服＋金ボタン＋車掌帽
    g.fillStyle = '#1e3a8a'; g.strokeStyle = '#0f172a'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.84 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.26 * u, 0.58 * u); g.lineTo(-0.9 * u, 0.52 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#ffd23f';
    ell(g, -0.16 * u, 0.2 * u, 0.06 * u, 0.06 * u); g.fill();
    ell(g, -0.44 * u, 0.26 * u, 0.06 * u, 0.06 * u); g.fill();
    // 車掌帽
    g.fillStyle = '#1e3a8a'; g.strokeStyle = '#0f172a'; g.lineWidth = lw * 0.85;
    roundRect(g, 0.2 * u, -0.84 * u, 0.52 * u, 0.2 * u, 0.05 * u); g.fill(); g.stroke();
    g.fillStyle = '#0f172a'; roundRect(g, 0.44 * u, -0.68 * u, 0.34 * u, 0.07 * u, 0.03 * u); g.fill();
    g.fillStyle = '#ffd23f'; ell(g, 0.46 * u, -0.75 * u, 0.06 * u, 0.06 * u); g.fill();
  } else if (key === 'yama') {
    // コアラ（やまのおんがくか）：クリームベスト＋ユーカリの葉＋コアラ耳カチューシャ
    g.fillStyle = '#94a3b8'; g.strokeStyle = '#475569'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.84 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.26 * u, 0.58 * u); g.lineTo(-0.9 * u, 0.52 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#22c55e'; ell(g, 0.08 * u, 0.14 * u, 0.14 * u, 0.07 * u, -0.4); g.fill();
    for (const ex of [0.22, 0.66]) {
      g.fillStyle = '#94a3b8'; g.strokeStyle = '#475569'; g.lineWidth = lw * 0.85;
      ell(g, ex * u, -0.72 * u, 0.16 * u, 0.16 * u); g.fill(); g.stroke();
      g.fillStyle = '#fff'; ell(g, ex * u, -0.72 * u, 0.08 * u, 0.08 * u); g.fill();
    }
  } else if (key === 'kuri') {
    // きょうりゅう（おおきなきょうりゅう）：緑の恐竜フード＋オレンジ背びれ
    for (let k = 0; k < 3; k++) {
      const bx = (-0.64 + k * 0.26) * u, by = (0.04 - k * 0.02) * u;
      g.fillStyle = '#f97316'; g.strokeStyle = '#9a3412'; g.lineWidth = lw * 0.7;
      g.beginPath(); g.moveTo(bx - 0.09 * u, by); g.lineTo(bx, by - 0.18 * u); g.lineTo(bx + 0.09 * u, by); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = '#22c55e'; g.strokeStyle = '#15803d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.86 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.58 * u); g.lineTo(-0.92 * u, 0.54 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#fde047'; ell(g, -0.26 * u, 0.3 * u, 0.24 * u, 0.16 * u); g.fill();
    // 頭上のトサカ
    g.fillStyle = '#f97316'; g.strokeStyle = '#9a3412'; g.lineWidth = lw * 0.75;
    g.beginPath(); g.moveTo(0.32 * u, -0.66 * u); g.lineTo(0.46 * u, -0.96 * u); g.lineTo(0.6 * u, -0.66 * u); g.closePath(); g.fill(); g.stroke();
  } else if (key === 'shabondama') {
    // ひこうき（しゃぼんだま）：空色パイロットジャケット＋白いスカーフ＋飛行ゴーグル付きキャップ
    g.fillStyle = '#0284c7'; g.strokeStyle = '#075985'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.84 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.26 * u, 0.58 * u); g.lineTo(-0.9 * u, 0.52 * u); g.closePath();
    g.fill(); g.stroke();
    // 白いスカーフ＆金の翼バッジ
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(0.06 * u, 0.02 * u); g.lineTo(0.32 * u, 0.16 * u); g.lineTo(0.02 * u, 0.24 * u); g.closePath(); g.fill();
    g.fillStyle = '#ffd23f'; ell(g, -0.26 * u, 0.24 * u, 0.14 * u, 0.06 * u); g.fill();
    // パイロット帽＋ゴーグル
    g.fillStyle = '#78350f'; g.strokeStyle = '#451a03'; g.lineWidth = lw * 0.85;
    g.beginPath(); g.arc(0.46 * u, -0.64 * u, 0.24 * u, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#bae6fd'; g.strokeStyle = '#ca8a04'; g.lineWidth = lw * 0.75;
    ell(g, 0.36 * u, -0.7 * u, 0.09 * u, 0.07 * u); g.fill(); g.stroke();
    ell(g, 0.56 * u, -0.7 * u, 0.09 * u, 0.07 * u); g.fill(); g.stroke();
  } else if (key === 'gavotte') {
    // おかしのいえ（ガヴォット）：いちごチョコ＆ミントのエプロンドレス＋コック帽
    g.fillStyle = '#f472b6'; g.strokeStyle = '#9d174d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#fff';
    for (let k = 0; k < 4; k++) { ell(g, (-0.78 + k * 0.34) * u, 0.56 * u, 0.15 * u, 0.08 * u); g.fill(); }
    // パティシエ帽＋いちご飾り
    g.fillStyle = '#fff'; g.strokeStyle = '#94a3b8'; g.lineWidth = lw * 0.85;
    ell(g, 0.46 * u, -0.84 * u, 0.26 * u, 0.18 * u); g.fill(); g.stroke();
    roundRect(g, 0.26 * u, -0.74 * u, 0.4 * u, 0.12 * u, 0.04 * u); g.fill(); g.stroke();
    g.fillStyle = '#ef4444'; ell(g, 0.46 * u, -1.0 * u, 0.08 * u, 0.09 * u); g.fill();
  } else if (key === 'skaters') {
    // ゆきのむら（スケーターズ・ワルツ）：水色ウィンターコート＋赤いマフラー＋白ポンポンニット帽
    g.fillStyle = '#38bdf8'; g.strokeStyle = '#0369a1'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.86 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.58 * u); g.lineTo(-0.92 * u, 0.54 * u); g.closePath();
    g.fill(); g.stroke();
    // 赤いマフラー
    g.fillStyle = '#ef4444'; g.strokeStyle = '#991b1b'; g.lineWidth = lw * 0.75;
    roundRect(g, -0.04 * u, -0.02 * u, 0.38 * u, 0.16 * u, 0.06 * u); g.fill(); g.stroke();
    roundRect(g, 0.12 * u, 0.08 * u, 0.14 * u, 0.32 * u, 0.05 * u); g.fill(); g.stroke();
    // ニット帽＋白ポンポン
    g.fillStyle = '#ef4444'; g.strokeStyle = '#991b1b'; g.lineWidth = lw * 0.85;
    g.beginPath(); g.arc(0.46 * u, -0.66 * u, 0.24 * u, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff';
    roundRect(g, 0.2 * u, -0.7 * u, 0.52 * u, 0.1 * u, 0.04 * u); g.fill();
    ell(g, 0.46 * u, -0.96 * u, 0.11 * u, 0.11 * u); g.fill();
  } else if (key === 'amefuri') {
    // あじさい（あめふり）：ピンクのレインコート＋黄色いレインハット＋紫陽花コサージュ
    g.fillStyle = '#f472b6'; g.strokeStyle = '#9d174d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.6 * u); g.lineTo(-0.96 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#facc15'; g.strokeStyle = '#a16207'; g.lineWidth = lw * 0.85;
    ell(g, 0.46 * u, -0.66 * u, 0.34 * u, 0.09 * u); g.fill(); g.stroke();
    g.beginPath(); g.arc(0.46 * u, -0.68 * u, 0.22 * u, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#a855f7'; ell(g, 0.28 * u, -0.74 * u, 0.08 * u, 0.08 * u); g.fill();
  } else if (key === 'kakkou') {
    // ゆうえんち（かっこうワルツ）：サーカス団長の赤×金ジャケット＋黒シルクハット
    g.fillStyle = '#ef4444'; g.strokeStyle = '#7f1d1d'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.3 * u, 0.6 * u); g.lineTo(-0.96 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#facc15';
    roundRect(g, -0.15 * u, 0.06 * u, 0.14 * u, 0.48 * u, 0.04 * u); g.fill();
    g.fillStyle = '#1e293b'; g.strokeStyle = '#0f172a'; g.lineWidth = lw * 0.85;
    roundRect(g, 0.18 * u, -0.72 * u, 0.56 * u, 0.09 * u, 0.03 * u); g.fill(); g.stroke();
    roundRect(g, 0.28 * u, -1.04 * u, 0.36 * u, 0.34 * u, 0.04 * u); g.fill(); g.stroke();
    g.fillStyle = '#facc15'; g.fillRect(0.29 * u, -0.78 * u, 0.34 * u, 0.06 * u);
  } else if (key === 'warewauminoko') {
    // サンゴしょう（われは海の子）：青×白マリンセーラー＋赤スカーフ＋白セーラー帽
    g.fillStyle = '#f8fafc'; g.strokeStyle = '#1d4ed8'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.86 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.28 * u, 0.58 * u); g.lineTo(-0.92 * u, 0.54 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#2563eb';
    roundRect(g, -0.78 * u, 0.06 * u, 0.96 * u, 0.14 * u, 0.04 * u); g.fill();
    g.fillStyle = '#ef4444';
    g.beginPath(); g.moveTo(0.18 * u, 0.08 * u); g.lineTo(0.34 * u, 0.26 * u); g.lineTo(0.08 * u, 0.28 * u); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.strokeStyle = '#1d4ed8'; g.lineWidth = lw * 0.85;
    ell(g, 0.46 * u, -0.78 * u, 0.26 * u, 0.14 * u); g.fill(); g.stroke();
    g.fillStyle = '#2563eb'; roundRect(g, 0.24 * u, -0.72 * u, 0.44 * u, 0.08 * u, 0.03 * u); g.fill();
  } else if (key === 'momiji') {
    // じんじゃ（もみじ）：朱色×山吹色の秋色和装羽織＋紅葉のかんざし
    g.fillStyle = '#ea580c'; g.strokeStyle = '#7c2d12'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.3 * u, 0.6 * u); g.lineTo(-0.96 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#facc15';
    roundRect(g, -0.86 * u, 0.24 * u, 1.12 * u, 0.14 * u, 0.04 * u); g.fill();
    g.fillStyle = '#ef4444'; g.strokeStyle = '#991b1b'; g.lineWidth = lw * 0.75;
    starPath(g, 0.46 * u, -0.82 * u, 0.22 * u, 0.09 * u, 5); g.fill(); g.stroke();
  } else if (key === 'queen') {
    // 女王さま（女王さまのロイヤルワルツ）：真紅×ゴールドの王妃ドレス＋白テン襟＋宝石付きロイヤルティアラ
    g.fillStyle = '#e11d48'; g.strokeStyle = '#881337'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.92 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.15 * u, 0.3 * u, 0.02 * u);
    g.lineTo(0.34 * u, 0.64 * u); g.lineTo(-1.0 * u, 0.58 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#fde047';
    roundRect(g, -0.88 * u, 0.28 * u, 1.16 * u, 0.12 * u, 0.04 * u); g.fill();
    g.fillStyle = '#fff';
    roundRect(g, -0.88 * u, 0.01 * u, 1.14 * u, 0.13 * u, 0.06 * u); g.fill();
    g.fillStyle = '#facc15'; g.strokeStyle = '#a16207'; g.lineWidth = lw * 0.85;
    g.beginPath();
    g.moveTo(0.2 * u, -0.66 * u); g.lineTo(0.24 * u, -0.98 * u); g.lineTo(0.37 * u, -0.78 * u);
    g.lineTo(0.46 * u, -1.06 * u); g.lineTo(0.55 * u, -0.78 * u); g.lineTo(0.68 * u, -0.98 * u); g.lineTo(0.72 * u, -0.66 * u);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f43f5e'; ell(g, 0.46 * u, -0.82 * u, 0.065 * u, 0.065 * u); g.fill();
  } else if (key === 'home') {
    // ホーム画面（ようこそアントフロー）：スカイブルー×ゴールドの歓迎バンドリーダー衣装＋指揮者キャップ
    g.fillStyle = '#0ea5e9'; g.strokeStyle = '#0369a1'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.3 * u, 0.6 * u); g.lineTo(-0.96 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#fde047';
    roundRect(g, -0.84 * u, 0.24 * u, 1.08 * u, 0.12 * u, 0.04 * u); g.fill();
    g.fillStyle = '#0284c7'; g.strokeStyle = '#075985'; g.lineWidth = lw * 0.85;
    roundRect(g, 0.2 * u, -0.86 * u, 0.52 * u, 0.2 * u, 0.06 * u); g.fill(); g.stroke();
    g.fillStyle = '#fde047'; starPath(g, 0.46 * u, -0.76 * u, 0.11 * u, 0.05 * u, 5); g.fill();
  } else if (key === 'result') {
    // リザルト画面（クリア・セレブレーション）：黄金のチャンピオンマント＋勝利の月桂冠スタークラウン
    g.fillStyle = '#f59e0b'; g.strokeStyle = '#92400e'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.9 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.3 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#fef08a';
    starPath(g, -0.18 * u, 0.28 * u, 0.18 * u, 0.08 * u, 5); g.fill();
    g.fillStyle = '#fde047'; g.strokeStyle = '#b45309'; g.lineWidth = lw * 0.85;
    starPath(g, 0.46 * u, -0.84 * u, 0.22 * u, 0.1 * u, 5); g.fill(); g.stroke();
  } else if (key === 'humoresque') {
    // アリのす（ユーモレスク）：女王さま風のロイヤルパープルマント＋金の王冠
    g.fillStyle = '#9333ea'; g.strokeStyle = '#581c87'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.9 * u, 0.04 * u); g.quadraticCurveTo(-0.22 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#fff';
    roundRect(g, -0.86 * u, 0.02 * u, 1.1 * u, 0.12 * u, 0.05 * u); g.fill();
    g.fillStyle = '#facc15'; g.strokeStyle = '#a16207'; g.lineWidth = lw * 0.85;
    g.beginPath();
    g.moveTo(0.22 * u, -0.66 * u); g.lineTo(0.26 * u, -0.96 * u); g.lineTo(0.38 * u, -0.78 * u);
    g.lineTo(0.46 * u, -1.02 * u); g.lineTo(0.54 * u, -0.78 * u); g.lineTo(0.66 * u, -0.96 * u); g.lineTo(0.7 * u, -0.66 * u);
    g.closePath(); g.fill(); g.stroke();
  } else {
    // チューリップなど：きらきらポップアイドル衣装（フリルドレス＋マント＋スターティアラ）
    g.fillStyle = '#ff4fa3'; g.strokeStyle = '#8c1d5a'; g.lineWidth = lw;
    g.beginPath();
    g.moveTo(-0.88 * u, 0.05 * u); g.quadraticCurveTo(-0.25 * u, -0.14 * u, 0.28 * u, 0.02 * u);
    g.lineTo(0.32 * u, 0.62 * u); g.lineTo(-0.98 * u, 0.56 * u); g.closePath();
    g.fill(); g.stroke();
    // 金の星ベルト＆フリル裾
    g.fillStyle = '#fff59d';
    for (let k = 0; k < 4; k++) { ell(g, (-0.78 + k * 0.34) * u, 0.56 * u, 0.16 * u, 0.09 * u); g.fill(); }
    g.fillStyle = '#ffd23f';
    starPath(g, -0.16 * u, 0.28 * u, 0.17 * u, 0.08 * u, 5); g.fill();
    // スターティアラ
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#b87b00'; g.lineWidth = lw * 0.8;
    g.beginPath();
    g.moveTo(0.2 * u, -0.66 * u); g.lineTo(0.28 * u, -0.94 * u); g.lineTo(0.42 * u, -0.76 * u);
    g.lineTo(0.5 * u, -1.0 * u); g.lineTo(0.58 * u, -0.76 * u); g.lineTo(0.7 * u, -0.92 * u); g.lineTo(0.74 * u, -0.66 * u);
    g.closePath(); g.fill(); g.stroke();
  }
  // 歌っているときのキラキラ演出
  if (singing) {
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + i * 2.1, r = (0.95 + 0.25 * Math.sin(t * 6 + i)) * u;
      g.fillStyle = i === 1 ? '#fff' : '#ffd23f';
      starPath(g, 0.2 * u + Math.cos(a) * r, -0.15 * u + Math.sin(a) * r * 0.7, 0.12 * u, 0.04 * u, 4);
      g.fill();
    }
  }
}
const SINGER_MIC_COLS = {
  home: '#38bdf8', result: '#facc15', queen: '#fb7185',
  sakura: '#ffd23f', katatsumuri: '#e2e8f0', kirakiraboshi: '#ffd23f', alps: '#4ecdc4', usagi: '#ffb3d1', kumasan: '#ff9f43', birthday: '#ff4f6e',
  fujinoyama: '#60a5fa', kamome: '#38bdf8', nekofunjatta: '#c084fc', minuet: '#93c5fd', konpeitou: '#f472b6', muramatsuri: '#fb7185', harugakita: '#facc15', toysoldiers: '#ef4444', jupiter: '#38bdf8',
  kaeru: '#4ade80', kisha: '#facc15', yama: '#94a3b8', kuri: '#f97316', shabondama: '#7dd3fc', gavotte: '#f9a8d4', skaters: '#bae6fd',
  amefuri: '#facc15', kakkou: '#ef4444', warewauminoko: '#38bdf8', momiji: '#fb923c', humoresque: '#c084fc'
};
function singerSprite(key, fr, mouth, u) {
  const uq = Math.round(u * 4) / 4;
  const k = key + '|' + fr + '|' + (mouth ? 1 : 0) + '|' + uq;
  let ent = singerCache.get(k);
  if (!ent) {
    const cw = Math.ceil(uq * 3.4), ch = Math.ceil(uq * 2.9), oxs = uq * 1.65, oys = uq * 1.65;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(cw * dpr)); cv.height = Math.max(1, Math.ceil(ch * dpr));
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, oxs * dpr, oys * dpr);
    drawAntShape(g, uq, 1, 0, fr, 'none');
    if (mouth) {
      g.fillStyle = '#ff5a7a'; g.strokeStyle = '#3a2a3a'; g.lineWidth = Math.max(0.8, uq * 0.08);
      ell(g, 0.8 * uq, -0.09 * uq, 0.09 * uq, 0.12 * uq); g.fill(); g.stroke();
    }
    drawSingerCostume(g, uq, key, 0, false);
    // ステージマイク（衣装に合わせて配色）
    g.strokeStyle = '#4a3850'; g.lineWidth = Math.max(1.4, uq * 0.14); g.lineCap = 'round';
    g.beginPath(); g.moveTo(0.85 * uq, 0.25 * uq); g.lineTo(1.12 * uq, -0.1 * uq); g.stroke();
    g.fillStyle = SINGER_MIC_COLS[key] || '#ff8fb3';
    g.strokeStyle = '#5a3d5c'; g.lineWidth = Math.max(1, uq * 0.08);
    ell(g, 1.15 * uq, -0.16 * uq, uq * 0.2, uq * 0.2); g.fill(); g.stroke();
    if (singerCache.size > 64) singerCache.clear();
    ent = { cv, cw, ch, oxs, oys, uq };
    singerCache.set(k, ent);
  }
  return ent;
}
function drawSinger() {
  if (typeof Sound === 'undefined' || !Sound.singerState) return;
  const sg = Sound.singerState();
  if (!sg) return;
  const slotBot = slotY + slotSize * 0.64, gap = trayTop - slotBot;
  const u = clamp(gap * 0.3, 8.5, 12.5);
  const fs = clamp(u * 1.15, 10.5, 13.5), bh = fs * 1.65;
  const by = clamp(slotBot + gap * 0.52, slotBot + bh * 0.45, trayTop - bh * 0.45);
  const sy = by + u * 0.08;
  const sx = panelL + clamp(CW * 0.07, 20, 30);
  const bob = sg.singing ? -sg.pulse * u * 0.32 - Math.abs(Math.sin(G.rt * 5)) * u * 0.1 : Math.sin(G.rt * 2.5) * u * 0.08;
  ctx.save();
  // 足元の影
  ctx.fillStyle = 'rgba(120,60,90,.15)'; ell(ctx, sx, sy + u * 0.78, u * 0.85, u * 0.18); ctx.fill();
  // アリシンガー本体＋ステージ衣装＋マイク（キャッシュから1発描画）
  const fr = sg.singing ? (Math.floor(G.rt * 7) & 3) : 0, mouth = sg.singing && sg.pulse > 0.28;
  const spr = singerSprite(sg.key, fr, mouth, u), sc = u / spr.uq;
  ctx.drawImage(spr.cv, sx - spr.oxs * sc, sy + bob - spr.oys * sc, spr.cw * sc, spr.ch * sc);
  // 歌っているときのキラキラ演出＆音符エフェクト
  if (sg.singing) {
    const cy0 = sy + bob;
    for (let i = 0; i < 3; i++) {
      const a = G.rt * 3 + i * 2.1, r = (0.95 + 0.25 * Math.sin(G.rt * 6 + i)) * u;
      ctx.fillStyle = i === 1 ? '#fff' : '#ffd23f';
      starPath(ctx, sx + 0.2 * u + Math.cos(a) * r, cy0 - 0.15 * u + Math.sin(a) * r * 0.7, 0.12 * u, 0.04 * u, 4);
      ctx.fill();
    }
    ctx.font = fnt(900, u * 0.95); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 2; i++) {
      const p = ((G.rt * 0.75 + i * 0.5) % 1);
      ctx.globalAlpha = (1 - p) * 0.85;
      ctx.fillStyle = i ? '#ff6b9a' : '#ff9f43';
      ctx.fillText(i ? '♫' : '♪', sx + (i ? -0.4 : 0.9) * u + Math.sin(p * 5 + i) * 3, sy - u * 0.9 - p * u * 1.4);
    }
    ctx.globalAlpha = 1;
  }
  // シンガーのセリフ（右向きの横長吹き出し）
  ctx.font = fnt(800, fs);
  const bx = sx + u * 1.45 + 7, maxW = Math.max(80, panelR - bx - 6);
  const tk = sg.text + '|' + fs.toFixed(1);
  if (singerTxtKey !== tk) { singerTxtKey = tk; singerTxtW = ctx.measureText(sg.text).width; }
  const bw = Math.min(maxW, singerTxtW + fs * 1.4);
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.strokeStyle = sg.singing ? '#ff7aa8' : '#b89eb8';
  ctx.lineWidth = 1.8;
  roundRect(ctx, bx, by - bh / 2, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
  // 吹き出しのしっぽ（左向き）
  ctx.beginPath(); ctx.moveTo(bx + 1, by - 4); ctx.lineTo(bx - 6, by); ctx.lineTo(bx + 1, by + 4); ctx.closePath();
  ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx, by - 4); ctx.lineTo(bx - 6, by); ctx.lineTo(bx, by + 4); ctx.stroke();
  ctx.fillStyle = sg.singing ? '#5a3d5c' : '#8a748a';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(sg.text, bx + fs * 0.65, by + 0.5, bw - fs * 1.1);
  ctx.restore();
}
function drawBgmBanner() {
  const b = G.bgmBanner;
  if (!b || G.overlay !== '') return;
  if (b.t0 === null) b.t0 = G.rt;
  const age = G.rt - b.t0;
  if (age > 2.9) { G.bgmBanner = null; return; }
  const a = age < 0.25 ? age / 0.25 : age > 2.3 ? Math.max(0, (2.9 - age) / 0.6) : 1;
  ctx.save();
  try {
    ctx.globalAlpha = a;
    const text = '🎵 ' + b.title;
    ctx.font = fnt(800, 12.5);
    const w = Math.min(CW - 24, ctx.measureText(text).width + 24), h = 26;
    const x = (panelL + panelR) / 2 - w / 2, y = Math.max(8, (typeof oy === 'number' ? oy : 8) + 6) - (1 - a) * 4;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.strokeStyle = '#ff8fb3';
    ctx.lineWidth = 1.6;
    roundRect(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3d5c';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, (panelL + panelR) / 2, y + h / 2 + 0.5, w - 16);
  } finally {
    ctx.restore();
  }
}
function addSkillFx(fx) {
  if (!G.skillFx) G.skillFx = [];
  fx.t0 = G.rt + (fx.delay || 0);
  fx.dur = fx.dur || 0.65;
  G.skillFx.push(fx);
}
function drawSkillFx() {
  if (!G.s) return;
  const W = G.s.W, H = G.s.H, bx = ox - cs, by = oy - cs, bw = (W + 2) * cs, bh = (H + 2) * cs, br = Math.max(8, cs * 0.85);
  const now = G.rt;
  // ---- 持続バフの盤面オーラ＆カウントダウンピル（時間停止 / アリ加速） ----
  const frz = G.skill ? (G.skill.freezeT || 0) : 0;
  const bst = G.skill ? (G.skill.boostT || 0) : 0;
  if (frz > 0 || bst > 0) {
    ctx.save();
    const pulse = 0.55 + 0.45 * Math.sin(now * 6.5);
    if (frz > 0) {
      ctx.strokeStyle = 'rgba(72,208,255,' + (0.55 + 0.35 * pulse) + ')';
      ctx.lineWidth = 4.5;
      roundRect(ctx, bx - 2, by - 2, bw + 4, bh + 4, br + 2); ctx.stroke();
      ctx.fillStyle = 'rgba(130,226,255,0.08)';
      roundRect(ctx, bx, by, bw, bh, br); ctx.fill();
      const txt = '❄️ STOP ' + frz.toFixed(1) + 's';
      ctx.font = fnt(900, 11.5);
      const pw = ctx.measureText(txt).width + 16, ph = 22, px = bx + 6, py = by + 6;
      ctx.fillStyle = 'rgba(24,132,196,0.92)'; ctx.strokeStyle = '#d8f6ff'; ctx.lineWidth = 1.6;
      roundRect(ctx, px, py, pw, ph, ph / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, px + pw / 2, py + ph / 2 + 0.5);
    }
    if (bst > 0) {
      ctx.strokeStyle = 'rgba(255,186,48,' + (0.55 + 0.35 * pulse) + ')';
      ctx.lineWidth = frz > 0 ? 2.5 : 4;
      roundRect(ctx, bx + 2, by + 2, bw - 4, bh - 4, Math.max(4, br - 2)); ctx.stroke();
      const txt = '⚡ SPEED ' + bst.toFixed(1) + 's';
      ctx.font = fnt(900, 11.5);
      const pw = ctx.measureText(txt).width + 16, ph = 22, px = bx + bw - pw - 6, py = by + 6;
      ctx.fillStyle = 'rgba(235,108,36,0.92)'; ctx.strokeStyle = '#fff0b3'; ctx.lineWidth = 1.6;
      roundRect(ctx, px, py, pw, ph, ph / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, px + pw / 2, py + ph / 2 + 0.5);
    }
    ctx.restore();
  }
  // ---- 単発・飛翔・ビーム・スウィープ等のスキルエフェクト ----
  if (G.skillFx && G.skillFx.length) {
    ctx.save();
    for (let i = G.skillFx.length - 1; i >= 0; i--) {
      const f = G.skillFx[i], el = now - f.t0;
      if (el < 0) continue;
      const k = el / f.dur;
      if (k >= 1) { G.skillFx.splice(i, 1); continue; }
      const ease = 1 - Math.pow(1 - k, 3), fade = k < 0.7 ? 1 : (1 - k) / 0.3;
      if (f.kind === 'sweepH') {
        const sx = bx - bw * 0.25 + (bw * 1.5) * ease, sw = Math.max(28, bw * 0.24);
        const gr = ctx.createLinearGradient(sx - sw / 2, 0, sx + sw / 2, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, f.col || 'rgba(255,150,210,0.85)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = fade;
        ctx.fillStyle = gr;
        ctx.save(); roundRect(ctx, bx, by, bw, bh, br); ctx.clip();
        ctx.fillRect(sx - sw / 2, by, sw, bh);
        ctx.restore();
      } else if (f.kind === 'cross') {
        const cx = bx + bw / 2, cy = by + bh / 2, thick = Math.max(10, Math.min(bw, bh) * 0.14 * (1 - k * 0.45));
        ctx.globalAlpha = 0.9 * (1 - k);
        ctx.fillStyle = f.col || '#ffd23f';
        ctx.save(); roundRect(ctx, bx, by, bw, bh, br); ctx.clip();
        ctx.fillRect(bx, cy - thick / 2, bw, thick);
        ctx.fillRect(cx - thick / 2, by, thick, bh);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, cy - thick * 0.2, bw, thick * 0.4);
        ctx.fillRect(cx - thick * 0.2, by, thick * 0.4, bh);
        ctx.restore();
      } else if (f.kind === 'scanSweep') {
        const sy = by + bh * ease;
        ctx.globalAlpha = fade;
        const gr = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
        gr.addColorStop(0, 'rgba(56,226,255,0)');
        gr.addColorStop(0.5, 'rgba(56,226,255,0.85)');
        gr.addColorStop(1, 'rgba(56,226,255,0)');
        ctx.save(); roundRect(ctx, bx, by, bw, bh, br); ctx.clip();
        ctx.fillStyle = gr; ctx.fillRect(bx, sy - 20, bw, 40);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(bx, sy); ctx.lineTo(bx + bw, sy); ctx.stroke();
        ctx.restore();
      } else if (f.kind === 'ring') {
        const rad = lerp(f.r0 || 8, f.r1 || Math.max(bw, bh) * 0.55, ease);
        ctx.globalAlpha = 0.92 * (1 - k);
        ctx.strokeStyle = f.col || '#ffd23f';
        ctx.lineWidth = Math.max(2, (f.lw || 5) * (1 - k * 0.6));
        ctx.beginPath(); ctx.arc(f.x, f.y, rad, 0, Math.PI * 2); ctx.stroke();
        if (f.fill) {
          ctx.fillStyle = f.fill;
          ctx.globalAlpha = 0.22 * (1 - k);
          ctx.beginPath(); ctx.arc(f.x, f.y, rad, 0, Math.PI * 2); ctx.fill();
        }
      } else if (f.kind === 'beam') {
        ctx.globalAlpha = 0.9 * (1 - k);
        ctx.strokeStyle = f.col || '#ffd23f';
        ctx.lineWidth = Math.max(2.5, (f.lw || 6) * (1 - k * 0.5));
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.2, (f.lw || 6) * 0.35 * (1 - k * 0.5));
        ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
      } else if (f.kind === 'fly') {
        const t = ease;
        const arc = (f.arc != null ? f.arc : -36) * Math.sin(t * Math.PI);
        const x = lerp(f.x0, f.x1, t), y = lerp(f.y0, f.y1, t) + arc;
        ctx.globalAlpha = fade;
        // 軌跡の尾
        const tp = Math.max(0, t - 0.14), ap = (f.arc != null ? f.arc : -36) * Math.sin(tp * Math.PI);
        ctx.strokeStyle = f.col || '#ffd23f'; ctx.lineWidth = Math.max(2, (f.sz || 12) * 0.45); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(lerp(f.x0, f.x1, tp), lerp(f.y0, f.y1, tp) + ap); ctx.lineTo(x, y); ctx.stroke();
        if (f.ci != null && candySpr[f.ci]) {
          const sz = (f.sz || Math.max(14, cs * 0.95)) * (1 + 0.2 * Math.sin(t * Math.PI));
          ctx.drawImage(candySpr[f.ci], x - sz / 2, y - sz / 2, sz, sz);
        } else if (f.ico) {
          ctx.font = Math.round(f.sz || 18) + 'px sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(f.ico, x, y);
        } else {
          ctx.fillStyle = f.col || '#ffd23f';
          starPath(ctx, x, y, (f.sz || 10) * 0.7, (f.sz || 10) * 0.32, 5); ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  // ---- スキル発動カットインバナー（スキル名＋実際の効果バッジ） ----
  const b = G.skillBanner;
  if (b && G.overlay === '') {
    const age = now - b.t0;
    if (age > b.dur) { G.skillBanner = null; }
    else {
      const a = age < 0.18 ? age / 0.18 : age > b.dur - 0.35 ? Math.max(0, (b.dur - age) / 0.35) : 1;
      const slide = age < 0.22 ? (1 - easeOutBack(age / 0.22)) * -14 : 0;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = fnt(900, 14);
      const t1w = ctx.measureText(b.title).width;
      ctx.font = fnt(800, 11.5);
      const t2w = b.sub ? ctx.measureText(b.sub).width : 0;
      const w = Math.min(CW - 18, Math.max(t1w, t2w) + 32), h = b.sub ? 46 : 30;
      const x = bcx() - w / 2, y = Math.max(10, oy + 8) + slide;
      ctx.fillStyle = 'rgba(46,20,58,0.88)';
      ctx.strokeStyle = b.col || '#ffd23f';
      ctx.lineWidth = 2.4;
      roundRect(ctx, x, y, w, h, 16); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = fnt(900, 14);
      ctx.fillText(b.title, bcx(), y + (b.sub ? 15 : h / 2 + 0.5), w - 18);
      if (b.sub) {
        ctx.fillStyle = '#ffe57f';
        ctx.font = fnt(800, 11.5);
        ctx.fillText(b.sub, bcx(), y + 33, w - 18);
      }
      ctx.restore();
    }
  }
}
function draw() {
  if (G.boardDirty) renderBoard();
  else if (G.boardSoft && G.rt - (G.boardT || 0) > 0.8) updateSoilHoles();
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(boardCv, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSpotlightAndFlashes(); drawGold(); drawFever(); drawNest(); drawSlots(); drawTray(); drawSlotBoxes(); drawSinger(); drawAnts(); drawFxLocal(); drawSkillFx(); drawPopups(); drawPreview(); drawGuides(); drawBgmBanner();
}

/* ================= 全画面エフェクト（紙吹雪・花火） ================= */
const Fx = {
  p: [], w: 0, h: 0, had: false, vis: false,
  setVis(on) { if (this.vis !== on) { this.vis = on; fxCv.style.visibility = on ? 'visible' : 'hidden'; } },
  resize() { this.w = innerWidth; this.h = innerHeight; fxCv.width = Math.round(this.w * dpr); fxCv.height = Math.round(this.h * dpr); this.had = false; if (!this.p.length) { this.vis = true; this.setVis(false); } },
  add(o) { if (this.p.length < (innerWidth <= 640 ? 220 : 700)) { this.p.push(o); this.setVis(true); } },
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
    if (!this.p.length && !this.had) return;
    const g = fxG;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fxCv.width, fxCv.height);
    if (!this.p.length) { this.had = false; this.setVis(false); return; }
    this.had = true;
    this.setVis(true);
    for (let i = 0; i < this.p.length; i++) {
      const p = this.p[i];
      g.globalAlpha = Math.min(1, (p.m - p.l) * 2.5);
      g.fillStyle = p.c;
      if (p.k === 'dot') {
        g.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
        ell(g, 0, 0, p.s * 0.45, p.s * 0.45); g.fill();
      } else {
        const cs = Math.cos(p.r) * dpr, sn = Math.sin(p.r) * dpr;
        g.setTransform(cs, sn, -sn, cs, p.x * dpr, p.y * dpr);
        if (p.k === 'star') { starPath(g, 0, 0, p.s, p.s * 0.45, 5); g.fill(); }
        else g.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
  }
};

AF_LOADED.push('render.js');