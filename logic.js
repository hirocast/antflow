// File: logic.js
'use strict';

/* ================= コアロジック（決定論的） ================= */
function nestEntry(W, H) { return { ex: (W + 2) >> 1, ey: H + 1 }; }
function bfs(grid, W, H, sx, sy) {
  const EW = W + 2, EH = H + 2, N = EW * EH, dist = new Int16Array(N).fill(-1), q = new Int32Array(N);
  let qh = 0, qt = 0;
  dist[sy * EW + sx] = 0; q[qt++] = sy * EW + sx;
  while (qh < qt) {
    const cur = q[qh++], cx = cur % EW, cy = (cur - cx) / EW, nd = dist[cur] + 1;
    for (let k = 0; k < 4; k++) {
      const nx = cx + DX[k], ny = cy + DY[k];
      if (nx < 0 || ny < 0 || nx >= EW || ny >= EH) continue;
      const ni = ny * EW + nx;
      if (dist[ni] !== -1) continue;
      if (nx > 0 && ny > 0 && nx <= W && ny <= H && grid[(ny - 1) * W + (nx - 1)] >= 0) continue;
      dist[ni] = nd; q[qt++] = ni;
    }
  }
  return dist;
}
function cubeDist(dist, W, x, y) {
  const EW = W + 2, i = (y + 1) * EW + (x + 1);
  let m = 32767;
  for (const d of [dist[i - 1], dist[i + 1], dist[i - EW], dist[i + EW]]) if (d >= 0 && d < m) m = d;
  return m === 32767 ? -1 : m;
}
function makeState(L) {
  let left = 0;
  for (const v of L.grid) if (v >= 0) left++;
  return { W: L.W, H: L.H, grid: Int8Array.from(L.grid), cols: L.cols, heads: new Array(L.cols.length).fill(0), boxes: [], nextId: 1, left };
}
function cloneState(s) {
  return { W: s.W, H: s.H, grid: s.grid.slice(), cols: s.cols, heads: s.heads.slice(), boxes: s.boxes.map(b => ({ id: b.id, c: b.c, rem: b.rem, n: b.n })), nextId: s.nextId, left: s.left, cap: s.cap };
}
function resolve(s, ev) {
  const W = s.W, H = s.H, grid = s.grid, ne = nestEntry(W, H);
  while (s.boxes.length) {
    let need = 0;
    for (const b of s.boxes) if (b.rem > 0) need |= (1 << b.c);
    if (!need) break;
    const dist = bfs(grid, W, H, ne.ex, ne.ey), lists = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, c = grid[i];
      if (c < 0 || !((need >> c) & 1)) continue;
      const d = cubeDist(dist, W, x, y);
      if (d < 0) continue;
      if (!lists.has(c)) lists.set(c, []);
      lists.get(c).push(d * 65536 + i);
    }
    for (const Lc of lists.values()) Lc.sort((a, b) => a - b);
    const ptr = new Map();
    let any = false;
    for (const b of s.boxes) {
      const Lc = lists.get(b.c);
      if (b.rem <= 0 || !Lc) continue;
      const p = ptr.get(b.c) || 0;
      if (p >= Lc.length) continue;
      const k = Math.min(b.rem, Lc.length - p), cells = [];
      for (let j = 0; j < k; j++) { const i = Lc[p + j] & 65535; grid[i] = -1; cells.push(i); }
      ptr.set(b.c, p + k);
      b.rem -= k; s.left -= k; any = true;
      if (ev) ev.push({ type: 'assign', id: b.id, cells });
    }
    for (let j = s.boxes.length - 1; j >= 0; j--) {
      if (s.boxes[j].rem <= 0) { if (ev) ev.push({ type: 'done', id: s.boxes[j].id }); s.boxes.splice(j, 1); }
    }
    if (!any) break;
  }
}
function place(s, j, ev) {
  const src = s.cols[j][s.heads[j]++], b = { id: s.nextId++, c: src.c, rem: src.n, n: src.n };
  s.boxes.push(b);
  if (ev) ev.push({ type: 'place', id: b.id, c: b.c, n: b.n });
  resolve(s, ev);
  return b;
}
// s.cap：スロットの数（測定で使う。省略時は SLOT_COUNT）
function isJam(s) {
  if (s.left === 0) return false;
  if (s.boxes.length >= (s.cap || SLOT_COUNT)) return true;
  for (let j = 0; j < s.cols.length; j++) if (s.heads[j] < s.cols[j].length) return false;
  return true;
}
function reachableCounts(s) {
  const W = s.W, H = s.H, ne = nestEntry(W, H), dist = bfs(s.grid, W, H, ne.ex, ne.ey), cnt = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = s.grid[y * W + x];
    if (c >= 0 && cubeDist(dist, W, x, y) >= 0) cnt.set(c, (cnt.get(c) || 0) + 1);
  }
  return cnt;
}
function headsOf(s) { const a = []; for (let j = 0; j < s.cols.length; j++) if (s.heads[j] < s.cols[j].length) a.push(j); return a; }
function headBox(s, j) { return s.cols[j][s.heads[j]]; }
function stateKey(s) {
  let h = 2166136261;
  for (let i = 0; i < s.grid.length; i++) { h ^= (s.grid[i] + 2); h = Math.imul(h, 16777619); }
  return s.heads.join(',') + '|' + s.boxes.map(b => b.c + ':' + b.rem).join(',') + '|' + (h >>> 0);
}
function solve(s0, budgetMs, maxNodes) {
  const t0 = Date.now(), seen = new Set();
  let nodes = 0, aborted = false;
  function dfs(s) {
    if (s.left === 0) return [];
    if (aborted) return null;
    if (++nodes > maxNodes || ((nodes & 63) === 0 && Date.now() - t0 > budgetMs)) { aborted = true; return null; }
    const key = stateKey(s);
    if (seen.has(key)) return null;
    seen.add(key);
    const nb = s.boxes.length, kids = [];
    for (let j = 0; j < s.cols.length; j++) {
      if (s.heads[j] >= s.cols[j].length) continue;
      const t = cloneState(s);
      place(t, j, null);
      if (t.left === 0) return [j];
      if (!isJam(t)) kids.push({ j, t, pr: t.boxes.length <= nb ? 0 : t.boxes.length });
    }
    kids.sort((a, b) => a.pr - b.pr);
    for (const k of kids) {
      const r = dfs(k.t);
      if (r) { r.unshift(k.j); return r; }
      if (aborted) return null;
    }
    return null;
  }
  const path = dfs(cloneState(s0));
  return { path, aborted: !path && aborted };
}

/* ================= レベル生成（作る→機械的な解き方で試す→合格したら採用） ================= */
function layerDepth(grid, W, H) {
  const EW = W + 2, EH = H + 2, D = new Int16Array(EW * EH).fill(32767);
  let cur = [0], d = 0;
  D[0] = 0;
  while (cur.length) {
    const next = [];
    for (let h = 0; h < cur.length; h++) {
      const c = cur[h];
      if (D[c] !== d) continue;
      const cx = c % EW, cy = (c - cx) / EW;
      for (let k = 0; k < 4; k++) {
        const nx = cx + DX[k], ny = cy + DY[k];
        if (nx < 0 || ny < 0 || nx >= EW || ny >= EH) continue;
        const ni = ny * EW + nx, w = nx > 0 && ny > 0 && nx <= W && ny <= H && grid[(ny - 1) * W + (nx - 1)] >= 0 ? 1 : 0;
        if (d + w < D[ni]) { D[ni] = d + w; (w ? next : cur).push(ni); }
      }
    }
    cur = next; d++;
  }
  return D;
}
function params(id, total) {
  const T = id <= 1 ? 0 : id <= 2 ? 1 : id <= 5 ? 2 : id <= 12 ? 3 : 4;
  // 合格条件：「外側」「適当」の勝率の上限（Lv.1〜2は判定しない）
  const rule = id <= 2 ? { outer: 1, random: 1 } : id <= 6 ? { outer: 0.5, random: 0.3 } : { outer: 0.2, random: 0.2 };
  return {
    tier: T,
    B: [9, 13, 18, 23, 28][T] + (T === 4 ? Math.min(12, (id - 13) >> 1) : 0),
    K: [2, 3, 3, 3, 4][T], maxBusy: [1, 3, 3, 4, 4][T],
    pWait: [0, 0.25, 0.28, 0.32, 0.36][T], pPartial: [0, 0.08, 0.22, 0.28, 0.32][T], pChain: [0, 0.3, 0.75, 0.8, 0.85][T],
    outerMax: rule.outer, randMax: rule.random,
    R: total > 2500 ? 6 : total > 1200 ? 8 : 12
  };
}
function construct(art, P, rng) {
  const W = art.W, H = art.H, un = new Map();
  let left = 0;
  for (const v of art.grid) if (v >= 0) { left++; un.set(v, (un.get(v) || 0) + 1); }
  const s = { W, H, grid: Int8Array.from(art.grid), cols: [], heads: [], boxes: [], nextId: 1, left };
  const seq = [], avgN = Math.max(2, left / P.B);
  let unTotal = left, guard = 0;
  while (unTotal > 0 && guard++ < 5000) {
    const rc = reachableCounts(s), reach = [], wait = [];
    for (const [c, u] of un) if (u > 0) ((rc.get(c) || 0) > 0 ? reach : wait).push(c);
    let kind = 'full';
    const r = rng();
    if (s.boxes.length < P.maxBusy) {
      if (wait.length && r < P.pWait) kind = 'wait';
      else if (r < P.pWait + P.pPartial && reach.some(c => un.get(c) > rc.get(c))) kind = 'partial';
    }
    if (!reach.length) kind = wait.length ? 'wait' : 'full';
    let c, n;
    if (kind === 'wait') {
      const D = layerDepth(s.grid, W, H), md = new Map();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = s.grid[y * W + x];
        if (v < 0) continue;
        const d = D[(y + 1) * (W + 2) + x + 1];
        if (!md.has(v) || d < md.get(v)) md.set(v, d);
      }
      const ws = wait.slice().sort((a, b) => (md.get(a) || 99) - (md.get(b) || 99));
      c = rng() < 0.65 ? ws[0] : ws[Math.floor(rng() * ws.length)];
      n = Math.min(un.get(c), Math.max(1, Math.round(avgN * (0.5 + rng() * 0.9))));
    } else if (kind === 'partial') {
      const pc = reach.filter(q => un.get(q) > rc.get(q));
      c = pc[Math.floor(rng() * pc.length)];
      n = Math.min(un.get(c), rc.get(c) + 1 + Math.floor(rng() * avgN * 0.9));
    } else {
      let tot = 0;
      for (const q of reach) tot += rc.get(q);
      let pk = rng() * tot;
      c = reach[reach.length - 1];
      for (const q of reach) { pk -= rc.get(q); if (pk <= 0) { c = q; break; } }
      n = Math.min(rc.get(c), un.get(c), Math.max(1, Math.round(avgN * (0.6 + rng() * 0.8))));
    }
    s.boxes.push({ id: s.nextId++, c, rem: n, n });
    resolve(s, null);
    un.set(c, un.get(c) - n);
    unTotal -= n;
    seq.push({ c, n, k: kind });
  }
  const cols = Array.from({ length: P.K }, () => []), solution = [];
  let chainCol = -1, chain = 0;
  for (const b of seq) {
    const minL = Math.min(...cols.map(q => q.length));
    let j;
    if (chain > 0 && cols[chainCol].length <= minL + 3) { j = chainCol; chain--; }
    else {
      chain = 0;
      const cand = [];
      for (let q = 0; q < P.K; q++) if (cols[q].length <= minL + 1) cand.push(q);
      j = cand[Math.floor(rng() * cand.length)];
    }
    if (b.k !== 'full' && rng() < P.pChain) { chainCol = j; chain = 1 + (rng() < 0.5 ? 1 : 0); }
    cols[j].push({ c: b.c, n: b.n });
    solution.push(j);
  }
  return { cols, solution };
}

/* ---- 機械的な解き方（生成のチェックと、難しさの測定で使う） ---- */
function polLeft(s, rc) { const h = headsOf(s); for (const j of h) if (rc.has(headBox(s, j).c)) return j; return h[0]; }
function polRight(s, rc) { const h = headsOf(s); for (let i = h.length - 1; i >= 0; i--) if (rc.has(headBox(s, h[i]).c)) return h[i]; return h[h.length - 1]; }
function polComplete(s, rc) { for (const j of headsOf(s)) { const b = headBox(s, j); if ((rc.get(b.c) || 0) >= b.n) return j; } return polLeft(s, rc); }
function polMost(s, rc) {
  const h = headsOf(s);
  let bj = h[0], bv = 0;
  for (const j of h) { const b = headBox(s, j), v = Math.min(b.n, rc.get(b.c) || 0); if (v > bv) { bv = v; bj = j; } }
  return bj;
}
// 外側：届く色の箱からランダムに選ぶ（届く箱がなければ全体からランダム）
function polOuter(s, rc, rng) { const h = headsOf(s), r = h.filter(j => rc.has(headBox(s, j).c)), a = r.length ? r : h; return a[Math.floor(rng() * a.length)]; }
// 適当：完全にランダムに選ぶ
function polRandom(s, rc, rng) { const h = headsOf(s); return h[Math.floor(rng() * h.length)]; }
// 人間型：全部運べる箱があればそれ。なければ、置いてすぐ渋滞しない箱のうち、一番多く運べる箱
function polHuman(s, rc, rng) {
  const h = headsOf(s), full = h.filter(j => { const b = headBox(s, j); return (rc.get(b.c) || 0) >= b.n; });
  if (full.length) return full[Math.floor(rng() * full.length)];
  let best = [], bv = -1;
  for (const j of h) {
    const t = cloneState(s);
    place(t, j, null);
    if (isJam(t)) continue;
    const b = headBox(s, j), v = Math.min(b.n, rc.get(b.c) || 0);
    if (v > bv) { bv = v; best = [j]; } else if (v === bv) best.push(j);
  }
  const a = best.length ? best : h;
  return a[Math.floor(rng() * a.length)];
}
function playout(L, pol, rng) {
  const s = makeState(L);
  for (let g = 0; g < 3000; g++) {
    if (s.left === 0) return true;
    if (isJam(s)) return false;
    place(s, pol(s, reachableCounts(s), rng), null);
  }
  return false;
}
// n回試し、limit回を超えて勝った時点で打ち切る（その時点で不合格が確定するため）
function winRate(L, pol, rng, n, limit) {
  let w = 0;
  for (let i = 0; i < n; i++) {
    if (playout(L, pol, rng)) w++;
    if (w > limit) return { rate: w / n, over: true };
  }
  return { rate: w / n, over: false };
}
function evaluate(L, P, seed) {
  let naive = 0;
  for (const f of [polLeft, polRight, polComplete, polMost]) if (playout(L, f, null)) naive++;
  if (naive > 0) return { ok: false, naive, outer: 1, random: 1, mix: 1, score: 10 + naive };
  const rng = mulberry32(seed), o = winRate(L, polOuter, rng, P.R, Math.floor(P.outerMax * P.R));
  const r = o.over ? { rate: 1, over: true } : winRate(L, polRandom, rng, P.R, Math.floor(P.randMax * P.R));
  // mix：開発画面の「工夫」欄に表示する値（今後は「適当」の勝率）
  return {
    ok: !o.over && !r.over, naive, outer: o.rate, random: r.rate, mix: r.rate,
    score: Math.max(0, o.rate - P.outerMax) * 6 + Math.max(0, r.rate - P.randMax) * 3 + o.rate + r.rate
  };
}
// ★：面番号で決まる目安。合格条件を満たせなかった面は1つ減らす
function starsOf(id, m) {
  if (id <= 2) return 1;
  const base = id <= 6 ? 2 : id <= 12 ? 3 : id <= 20 ? 4 : 5;
  return clamp(base - (m.ok ? 0 : 1), 1, 5);
}
function buildLevelAsync(id, cb) {
  const art = getArt(id);
  let total = 0;
  for (const v of art.grid) if (v >= 0) total++;
  // limit：作り直しを続ける時間の上限（大きい面ほど長く。最大8秒）
  const P = params(id, total), t0 = Date.now(), limit = Math.min(8000, 1500 + total * 1.5);
  let best = null, a = 0;
  const step = () => {
    const ts = Date.now();
    for (;;) {
      const rng = mulberry32(hashInt(id, a)), esc = Math.min(a, 10) * 0.04;
      // 20回作っても合格しないときは、列を3列に減らして作る（列が少ないほど難しくなる）
      const Q = Object.assign({}, P, {
        pPartial: Math.min(0.6, P.pPartial + esc), pWait: Math.min(0.55, P.pWait + esc * 0.6), pChain: Math.min(0.95, P.pChain + esc),
        K: a >= 20 && P.K > 3 ? 3 : P.K
      });
      const c = construct(art, Q, rng);
      const L = { id, name: art.name, theme: art.theme, W: art.W, H: art.H, grid: art.grid, cols: c.cols, solution: c.solution, total };
      L.metrics = P.tier < 2 ? { ok: true, naive: -1, outer: 1, random: 1, mix: 1, score: 0 } : evaluate(L, P, hashInt(id, a + 1000));
      a++;
      if (!best || L.metrics.score < best.metrics.score) best = L;
      // 合格した時点で採用。時間切れや回数切れのときは、条件に一番近い面を採用する
      if (P.tier < 2 || best.metrics.ok || Date.now() - t0 > limit || a >= 80) {
        best.metrics.stars = starsOf(id, best.metrics);
        cb(best);
        return;
      }
      if (Date.now() - ts > 30) break;
    }
    setTimeout(step, 0);
  };
  setTimeout(step, 16);
}
function loadStored(id) {
  try {
    const d = JSON.parse(localStorage.getItem(LV_KEY + id));
    if (!d) return null;
    const art = getArt(id), need = new Map(), have = new Map();
    let total = 0, nb = 0;
    for (const v of art.grid) if (v >= 0) { total++; need.set(v, (need.get(v) || 0) + 1); }
    const cols = d.cols.map(c => c.map(x => ({ c: x[0], n: x[1] })));
    for (const c of cols) for (const b of c) { nb++; have.set(b.c, (have.get(b.c) || 0) + b.n); }
    for (const [c, n] of need) if (have.get(c) !== n) return null;
    if (have.size !== need.size || d.sol.length !== nb) return null;
    return { id, name: art.name, theme: art.theme, W: art.W, H: art.H, grid: art.grid, cols, solution: d.sol, total, metrics: d.m || { stars: 2 } };
  } catch (e) { return null; }
}
const levelCache = new Map(), pending = new Map();
function cachedLevel(id) {
  if (levelCache.has(id)) return levelCache.get(id);
  const L = loadStored(id);
  if (L) levelCache.set(id, L);
  return L;
}
function ensureLevel(id, cb) {
  const L = cachedLevel(id);
  if (L) { cb(L); return; }
  if (pending.has(id)) { pending.get(id).push(cb); return; }
  pending.set(id, [cb]);
  buildLevelAsync(id, L2 => {
    try { localStorage.setItem(LV_KEY + id, JSON.stringify({ cols: L2.cols.map(c => c.map(b => [b.c, b.n])), sol: L2.solution, m: L2.metrics })); } catch (e) { /* 容量不足 */ }
    levelCache.set(id, L2);
    const cbs = pending.get(id) || [];
    pending.delete(id);
    cbs.forEach(f => { try { f(L2); } catch (e) { console.error(e); } });
  });
}

/* ================= セーブ ================= */
let save = { level: 1, maxLevel: 1, cleared: {}, newArts: [], flags: { help: 0, lp: 0 }, settings: { sfx: true, bgm: true, vib: true, talk: true, steps: true, sfxVol: 90, bgmVol: 70, cb: false, wash: false, dim: false, info: false, fast: false, dev: false } };
try {
  const d = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (d) save = Object.assign({}, save, d, { settings: Object.assign({}, save.settings, d.settings || {}), flags: Object.assign({}, save.flags, d.flags || {}), newArts: Array.isArray(d.newArts) ? d.newArts : [] });
} catch (e) { /* 破損データは無視 */ }
save.level = clamp(save.level || 1, 1, TOTAL);
save.maxLevel = clamp(save.maxLevel || 1, 1, TOTAL);
for (const k in save.cleared) if (+k > TOTAL) delete save.cleared[k];
save.newArts = save.newArts.filter(i => i >= 1 && i <= TOTAL);
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 無視 */ } }
function gotCount() { let n = 0; for (let i = 1; i <= TOTAL; i++) if (save.cleared[i]) n++; return n; }
// 古い版で生成したステージを削除して容量を空ける
try {
  const oldKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && /^antflow-lv\d+-/.test(k) && k.indexOf(LV_KEY) !== 0) oldKeys.push(k);
  }
  oldKeys.forEach(k => localStorage.removeItem(k));
} catch (e) { /* 無視 */ }

AF_LOADED.push('logic.js');