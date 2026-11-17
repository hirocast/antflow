// File: raster.js
'use strict';

/* ================= 図形→マス目の変換（arts.js の ARTS・DETAIL を使う） ================= */
function shapesOf(def) {
  const out = def.s.slice(), ds = DETAIL[def.n];
  if (!ds) return out;
  const key = g => g.at == null ? 1e9 : g.at;
  ds.slice().sort((a, b) => key(b) - key(a)).forEach(g => out.splice(g.at == null ? out.length : g.at, 0, ...g.s));
  return out;
}

/* ---- 自動陰影（左上から光。上に重なっている縁だけに付ける） ---- */
const ART_DARK = [...'MNOGFDBIDIRVTNDIDDPGT'].map(k => KEYS.indexOf(k));
const ART_LITE = [...'KYQQLGWCBVWWWSTWRIWWW'].map(k => KEYS.indexOf(k));
function shadeArt(grid, layer, W, hits) {
  const H = W, N = W * H, t = W >= 48 ? 2 : 1, out = grid.slice(), vis = new Int32Array(hits.length);
  for (let i = 0; i < N; i++) if (layer[i] >= 0) vis[layer[i]]++;
  const isBg = k => hits[k] >= N * 0.5;
  const isCaster = k => !isBg(k) && vis[k] >= N * 0.01;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? -9 : grid[y * W + x];
  // (dx,dy)方向へ進み、最初に色が変わる位置を返す。自分が上に重なっている縁のときだけ
  const edge = (x, y, dx, dy, max) => {
    const c = grid[y * W + x], L = layer[y * W + x];
    for (let k = 1; k <= max; k++) {
      const nx = x + dx * k, ny = y + dy * k, v = at(nx, ny);
      if (v === -9) return null;
      if (v === c) continue;
      return v < 0 || layer[ny * W + nx] < L ? { k, v } : null;
    }
    return null;
  };
  // 反対方向に十分な厚みがあるか（細い線や小さな点には陰影を付けない）
  const thick = (x, y, dx, dy, n) => {
    const c = grid[y * W + x];
    for (let k = 1; k <= n; k++) if (at(x + dx * k, y + dy * k) !== c) return false;
    return true;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = grid[i], L = layer[i];
    if (c < 0 || L < 0) continue;
    const dk = ART_DARK[c], lk = ART_LITE[c];
    let nv = -1;
    // 1) 落ち影：左上の大きなパーツが、下のパーツに影を落とす
    if (!isBg(L) && dk !== c) {
      const q = at(x - 1, y - 1);
      if (q >= 0 && q !== c && q !== dk) {
        const Lq = layer[(y - 1) * W + x - 1];
        if (Lq > L && isCaster(Lq)) nv = dk;
      }
    }
    // 2) 内側の影：下と右の縁（48×48以上は市松模様でぼかす）
    if (nv < 0 && dk !== c) {
      for (const [dx, dy] of [[0, 1], [1, 0]]) {
        const e = edge(x, y, dx, dy, t + 1);
        if (!e || e.v === dk || !thick(x, y, -dx, -dy, 2 * t + 1)) continue;
        if (e.k <= t || (W >= 48 && (x + y) % 2 === 0)) { nv = dk; break; }
      }
    }
    // 3) ハイライト：上と左の縁に1マス
    if (nv < 0 && lk !== c) {
      for (const [dx, dy] of [[0, -1], [-1, 0]]) {
        const e = edge(x, y, dx, dy, 1);
        if (e && e.v !== lk && thick(x, y, -dx, -dy, 2 * t + 1)) { nv = lk; break; }
      }
    }
    if (nv >= 0) out[i] = nv;
  }
  return out;
}

function inEll(dx, dy, rx, ry, rot) {
  if (rot) {
    const r = rot * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), x = dx * c + dy * s;
    dy = -dx * s + dy * c; dx = x;
  }
  return dx * dx / (rx * rx) + dy * dy / (ry * ry) <= 1;
}
function hit(ty, p, u, v) {
  switch (ty) {
    case 'c': return (u - p[0]) * (u - p[0]) + (v - p[1]) * (v - p[1]) <= p[2] * p[2];
    case 'e': return inEll(u - p[0], v - p[1], p[2], p[3], p[4] || 0);
    case 'r': return u >= p[0] && u <= p[0] + p[2] && v >= p[1] && v <= p[1] + p[3];
    case 'rr': {
      if (u < p[0] || u > p[0] + p[2] || v < p[1] || v > p[1] + p[3]) return false;
      const r = Math.min(p[4], p[2] / 2, p[3] / 2);
      const cx = Math.max(p[0] + r, Math.min(u, p[0] + p[2] - r)), cy = Math.max(p[1] + r, Math.min(v, p[1] + p[3] - r));
      return (u - cx) * (u - cx) + (v - cy) * (v - cy) <= r * r;
    }
    case 'p': {
      let ins = false;
      const n = p.length >> 1;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = p[2 * i], yi = p[2 * i + 1], xj = p[2 * j], yj = p[2 * j + 1];
        if (((yi > v) !== (yj > v)) && (u < (xj - xi) * (v - yi) / (yj - yi) + xi)) ins = !ins;
      }
      return ins;
    }
    case 'l': {
      const dx = p[2] - p[0], dy = p[3] - p[1], L2 = dx * dx + dy * dy || 1e-9;
      const t = clamp(((u - p[0]) * dx + (v - p[1]) * dy) / L2, 0, 1), qx = p[0] + t * dx - u, qy = p[1] + t * dy - v;
      return qx * qx + qy * qy <= p[4] * p[4] / 4;
    }
    case 'o': return Math.abs(Math.hypot(u - p[0], v - p[1]) - p[2]) <= p[3] / 2;
    case 'h': {
      const x = (u - p[0]) / p[2], y = -(v - p[1]) / p[2] + 0.15, a = x * x + y * y - 1;
      return a * a * a - x * x * y * y * y <= 0;
    }
    case 'f': {
      for (let k = 0; k < p[2]; k++) {
        const ang = ((p[6] || 0) + k * 360 / p[2] - 90) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
        const dx = u - (p[0] + p[3] * ca), dy = v - (p[1] + p[3] * sa), rad = dx * ca + dy * sa, tan = -dx * sa + dy * ca;
        if (tan * tan / (p[4] * p[4]) + rad * rad / (p[5] * p[5]) <= 1) return true;
      }
      return false;
    }
  }
  return false;
}
function prepShape(a, cell) {
  const t = a[0], mir = t.length > 1 && t.endsWith('2'), ty = mir ? t.slice(0, -1) : t;
  const ci = a[1] === '.' ? -1 : KEYS.indexOf(a[1]), p = a.slice(2), mr = cell * (cell <= 100 / SHADE_MIN ? 0.72 : 0.55);
  if (ty === 'st') {
    const r1 = Math.max(p[2], cell * 0.8), r2 = Math.max(p[3], cell * 0.45), pts = [];
    for (let k = 0; k < p[4] * 2; k++) {
      const r = k % 2 ? r2 : r1, an = ((p[5] || 0) + k * 180 / p[4] - 90) * Math.PI / 180;
      pts.push(p[0] + r * Math.cos(an), p[1] + r * Math.sin(an));
    }
    return { ty: 'p', mir, ci, p: pts };
  }
  if (ty === 'c') p[2] = Math.max(p[2], mr);
  else if (ty === 'e') { p[2] = Math.max(p[2], mr); p[3] = Math.max(p[3], mr); }
  else if (ty === 'f') { p[4] = Math.max(p[4], mr); p[5] = Math.max(p[5], mr); }
  else if (ty === 'h') p[2] = Math.max(p[2], cell * 0.8);
  else if (ty === 'r') {
    if (p[2] < cell) { p[0] -= (cell - p[2]) / 2; p[2] = cell; }
    if (p[3] < cell) { p[1] -= (cell - p[3]) / 2; p[3] = cell; }
  }
  else if (ty === 'l') p[4] = Math.max(p[4], cell * 1.15);
  else if (ty === 'o') p[3] = Math.max(p[3], cell * 1.15);
  return { ty, mir, ci, p };
}
function raster(def, W) {
  const H = W, N = W * H, cell = 100 / W, sh = shapesOf(def).map(a => prepShape(a, cell)), hits = new Int32Array(sh.length);
  let grid = new Int8Array(N).fill(-1);
  const layer = new Int16Array(N).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5) * cell, v = (y + 0.5) * cell;
    let c = -1, L = -1;
    for (let k = 0; k < sh.length; k++) {
      const s = sh[k];
      if (hit(s.ty, s.p, u, v) || (s.mir && hit(s.ty, s.p, 100 - u, v))) { c = s.ci; L = c < 0 ? -1 : k; hits[k]++; }
    }
    grid[y * W + x] = c;
    layer[y * W + x] = L;
  }
  if (def.ol) {
    const oc = KEYS.indexOf(def.ol), g2 = grid.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (grid[y * W + x] >= 0) continue;
      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && grid[ny * W + nx] >= 0) { g2[y * W + x] = oc; break; }
      }
    }
    grid = g2;
  }
  if (W >= SHADE_MIN && !def.flat) grid = shadeArt(grid, layer, W, hits);
  return { W, H, grid, name: def.n, theme: def.t };
}

/* ---- 盤面の大きさ ----
   ART_MAX_ID：盤面が最大（64×64）になる元の番号。1〜ART_MAX_ID 番で 16→64 マスに少しずつ大きくなり、
   それより後ろの絵はすべて 64×64。絵を追加しても、すでにある絵の盤面の大きさは変わらない。
   絵に w を書くと（例：{n:'…', w:48, …}）、その絵だけ大きさを指定できる（16〜64。偶数にそろえる） */
const ART_MAX_ID = 30;
function boardSize(def, id) {
  if (def.w) return clamp(Math.round(def.w / 2) * 2, 16, 64);
  return 16 + 2 * Math.round(24 * Math.min(id - 1, ART_MAX_ID - 1) / (ART_MAX_ID - 1));
}
const artCache = new Map();
function getArt(id) {
  id = clamp(id, 1, TOTAL);
  if (!artCache.has(id)) { const def = ARTS[id - 1]; artCache.set(id, raster(def, boardSize(def, id))); }
  return artCache.get(id);
}

AF_LOADED.push('raster.js');