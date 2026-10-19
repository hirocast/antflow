// File: measure.js
'use strict';

/* ================= 難しさの測定（開発用） =================
   このファイルと、index.html の読み込み行・AF_FILES の 'measure.js' を消せば、機能ごと外せる
   機械的な解き方（polOuter・polRandom・polHuman など）は logic.js にある
   測定結果は「元の番号」で保存し、表は遊ぶ順番（base.js の ORDER）で並べる */

const MEASURE_KEY = 'antflow-measure-v1', M_TRIALS = 20, M_EASY = 0.5;
const MS = { running: false, tok: 0, res: new Map() };
try { (JSON.parse(localStorage.getItem(MEASURE_KEY)) || []).forEach(r => MS.res.set(r.id, r)); } catch (e) { /* 破損データは無視 */ }
function saveMeasure() { try { localStorage.setItem(MEASURE_KEY, JSON.stringify([...MS.res.values()])); } catch (e) { /* 無視 */ } }
const mEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ステージの中身が変わったら、古い測定結果だと分かるようにする
function levelSig(L) {
  const t = JSON.stringify(L.cols.map(c => c.map(b => [b.c, b.n])));
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

// 色の層：外からキャンディに入るとき、または色が変わるたびに1枚と数える
function colorLayers(grid, W, H) {
  const EW = W + 2, EH = H + 2, D = new Int16Array(EW * EH).fill(32767);
  const colAt = i => { const x = i % EW, y = (i - x) / EW; return x > 0 && y > 0 && x <= W && y <= H ? grid[(y - 1) * W + x - 1] : -1; };
  let cur = [0], d = 0;
  D[0] = 0;
  while (cur.length) {
    const next = [];
    for (let h = 0; h < cur.length; h++) {
      const c = cur[h];
      if (D[c] !== d) continue;
      const cc = colAt(c), cx = c % EW, cy = (c - cx) / EW;
      for (let k = 0; k < 4; k++) {
        const nx = cx + DX[k], ny = cy + DY[k];
        if (nx < 0 || ny < 0 || nx >= EW || ny >= EH) continue;
        const ni = ny * EW + nx, nc = colAt(ni), w = nc >= 0 && nc !== cc ? 1 : 0;
        if (d + w < D[ni]) { D[ni] = d + w; (w ? next : cur).push(ni); }
      }
    }
    cur = next; d++;
  }
  return D;
}

// すぐ終わる測定：絵の形と、想定の解き方をたどった結果
function measureStatic(L) {
  const W = L.W, H = L.H, EW = W + 2, D = colorLayers(L.grid, W, H), depths = new Map();
  let layers = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = L.grid[y * W + x];
    if (c < 0) continue;
    const d = D[(y + 1) * EW + x + 1];
    if (d > layers) layers = d;
    if (!depths.has(c)) depths.set(c, new Set());
    depths.get(c).add(d);
  }
  let split = 0;
  for (const set of depths.values()) if (set.size >= 2) split++;
  const s = makeState(L), reach0 = reachableCounts(s).size;
  let stall = 0, wait = 0;
  for (const j of L.solution) {
    const rc = reachableCounts(s);
    if (!headsOf(s).some(h => { const b = headBox(s, h); return (rc.get(b.c) || 0) >= b.n; })) stall++;
    place(s, j, null);
    wait = Math.max(wait, s.boxes.length);
  }
  const m = L.metrics || {};
  return { id: L.id, name: L.name, W, stars: m.stars || 1, ok: !!m.ok, colors: depths.size, reach0, layers, split, boxes: L.solution.length, stall, wait, sig: levelSig(L) };
}

// 時間のかかる測定（試し遊び・最少枠の探索）を、小分けにして実行する
function measureAsync(L, alive, done) {
  const r = measureStatic(L), rng = mulberry32(hashInt(L.id, 777)), tasks = [], trace = [];
  // 想定の解き方で同時に待つ箱が最大 wait 個なら、スロット wait+1 個で必ず解ける
  const upper = clamp(r.wait + 1, 1, SLOT_COUNT);
  let rnd = 0, out = 0, hum = 0, found = 0, k = 0;
  for (let i = 0; i < M_TRIALS; i++) tasks.push(() => { if (playout(L, polRandom, rng)) rnd++; });
  for (let i = 0; i < M_TRIALS; i++) tasks.push(() => { if (playout(L, polOuter, rng)) out++; });
  for (let i = 0; i < M_TRIALS; i++) tasks.push(() => { if (playout(L, polHuman, rng)) hum++; });
  tasks.push(() => { r.greedy = playout(L, polComplete, null); });
  for (let cap = 1; cap < upper; cap++) tasks.push(() => {
    if (found) return;
    const s = makeState(L);
    s.cap = cap;
    const q = solve(s, 1500, 200000);
    trace.push(cap + (q.path ? '○' : q.aborted ? '?' : '✕'));
    if (q.path) found = cap;
  });
  const step = () => {
    if (!alive()) { done(null); return; }
    const t0 = Date.now();
    while (k < tasks.length && Date.now() - t0 < 40) tasks[k++]();
    if (k < tasks.length) { setTimeout(step, 0); return; }
    r.random = rnd / M_TRIALS;
    r.outer = out / M_TRIALS;
    r.human = hum / M_TRIALS;
    r.minSlots = found || upper;
    r.sure = trace.every(t => t.slice(-1) !== '?');
    if (!found) trace.push(upper + '○');
    r.trace = trace.join(' ');
    done(r);
  };
  setTimeout(step, 0);
}

// 簡単な理由：機械的な解き方のどれかで50%以上勝てたら「簡単」
function easyFlags(r) {
  const f = [];
  if (r.greedy) f.push('全部優先で解ける');
  if (r.random >= M_EASY) f.push('適当で解ける');
  else if (r.outer >= M_EASY) f.push('外側優先で解ける');
  if (!f.length && r.human != null && r.human >= M_EASY) f.push('人間型で解ける');
  return f;
}

/* ---------- 表示 ---------- */
const M_COLS = [
  ['Lv', '遊ぶ順番'], ['元', '元の番号（絵の番号。盤面の大きさとステージの中身はこれで決まる）'], ['名前', ''], ['盤', '盤面の一辺のマス数'], ['★', '遊ぶ順番で決まる難しさの表示'],
  ['合格', '生成時の合格条件（外側・適当の勝率の上限）を満たしたか'],
  ['色', '使われている色の数'], ['初届', '最初から届く色の数／全色数'], ['層', '一番奥の色まで、外側から何枚の色をはがす必要があるか'],
  ['割れ', '外側と内側の別々の層に出てくる色の数'], ['箱', '箱の総数'],
  ['待最大', '想定の解き方で、同時にスロットで待つ箱の最大数'], ['最少枠', '解くのに必要なスロットの最少数（≤は、それより少ない数を調べきれなかった）'],
  ['全部優先', '全部運べる箱を左から選ぶだけで解けるか'], ['外側', '届く色の箱からランダムに選んだときの勝率'],
  ['適当', '完全にランダムに選んだときの勝率'], ['人間型', '全部運べる箱を優先し、なければ置いてすぐ渋滞しない箱から一番多く運べる箱を選んだときの勝率'],
  ['簡単な理由', '']
];
function measureCsv() {
  const lines = ['Lv,元番号,名前,盤,星,生成合格,色数,初手で届く色,色の層,割れた色,箱数,停滞手番,待ち最大,最少枠,最少枠確定,全部優先,外側優先勝率(%),適当勝率(%),人間型勝率(%),簡単な理由,枠の探索'];
  for (let pos = 1; pos <= TOTAL; pos++) {
    const id = idAt(pos), r = MS.res.get(id);
    if (!r) continue;
    lines.push([pos, id, r.name, r.W, starsAt(pos), r.ok ? 1 : 0, r.colors, r.reach0, r.layers, r.split, r.boxes, r.stall, r.wait, r.minSlots, r.sure ? 1 : 0, r.greedy ? 1 : 0,
      Math.round(r.outer * 100), Math.round(r.random * 100), r.human == null ? '' : Math.round(r.human * 100), easyFlags(r).join('・') || 'なし', r.trace].join(','));
  }
  return lines.length > 1 ? lines.join('\n') : '';
}
function renderMeasure() {
  const box = $('#mTbl');
  if (!box) return;
  const pc = v => v == null ? '-' : Math.round(v * 100) + '%';
  const cls = (bad, good) => bad ? ' class="m-ng"' : good ? ' class="m-ok"' : '';
  const rate = v => cls(v != null && v >= M_EASY, v != null && v <= 0.2);
  const cnt = { done: 0, ok: 0, greedy: 0, random: 0, outer: 0, human: 0, hard: 0 };
  let html = '<table><thead><tr>' + M_COLS.map(c => '<th title="' + mEsc(c[1]) + '">' + c[0] + '</th>').join('') + '</tr></thead><tbody>';
  for (let pos = 1; pos <= TOTAL; pos++) {
    const id = idAt(pos), r = MS.res.get(id), name = mEsc(ARTS[id - 1].n);
    if (!r) { html += '<tr class="old"><td>' + pos + '</td><td>' + id + '</td><td class="l">' + name + '</td><td class="l" colspan="' + (M_COLS.length - 3) + '">未測定</td></tr>'; continue; }
    const L = cachedLevel(id), stale = !L || levelSig(L) !== r.sig, f = easyFlags(r);
    cnt.done++;
    if (r.ok) cnt.ok++;
    if (r.greedy) cnt.greedy++;
    if (r.random >= M_EASY) cnt.random++;
    if (r.outer >= M_EASY) cnt.outer++;
    if (r.human != null && r.human >= M_EASY) cnt.human++;
    if (!f.length) cnt.hard++;
    html += '<tr' + (stale ? ' class="old" title="ステージが作り直されたため、古い結果です"' : '') + '>' +
      '<td>' + pos + '</td><td>' + id + '</td><td class="l">' + name + '</td><td>' + r.W + '</td><td>★' + starsAt(pos) + '</td>' +
      '<td' + cls(!r.ok, r.ok) + '>' + (r.ok ? '○' : '✕') + '</td>' +
      '<td>' + r.colors + '</td><td' + cls(r.reach0 * 2 >= r.colors, false) + '>' + r.reach0 + '/' + r.colors + '</td>' +
      '<td>' + r.layers + '</td><td>' + r.split + '</td><td>' + r.boxes + '</td><td>' + r.wait + '</td>' +
      '<td title="' + mEsc(r.trace) + '"' + cls(false, r.minSlots >= SLOT_COUNT - 1) + '>' + (r.sure ? '' : '≤') + r.minSlots + '</td>' +
      '<td' + cls(r.greedy, !r.greedy) + '>' + (r.greedy ? '○' : '✕') + '</td>' +
      '<td' + rate(r.outer) + '>' + pc(r.outer) + '</td>' +
      '<td' + rate(r.random) + '>' + pc(r.random) + '</td>' +
      '<td' + rate(r.human) + '>' + pc(r.human) + '</td>' +
      '<td class="l' + (f.length ? '' : ' m-ok') + '">' + (f.length ? f.join('・') : '◎ 歯ごたえあり') + '</td></tr>';
  }
  box.innerHTML = html + '</tbody></table>';
  $('#mSum').textContent = '測定済み ' + cnt.done + ' / ' + TOTAL + ' 面 ｜ 生成合格 ' + cnt.ok + ' ｜ 全部優先で解ける ' + cnt.greedy +
    '・適当で解ける ' + cnt.random + '・外側で解ける ' + cnt.outer + '・人間型で解ける ' + cnt.human + ' ｜ 歯ごたえあり ' + cnt.hard;
  $('#mCsv').value = measureCsv();
}
function setRunBtn() {
  const b = $('#bMRun');
  b.textContent = MS.running ? '■ 止める' : '▶ 測定する';
  b.classList.toggle('on', MS.running);
  // 測定中は画面が長く止まるので、BGMを2.5秒先まで予約して途切れないようにする
  Sound.ahead = MS.running ? 2.5 : 1.0;
}

/* ---------- 測定の進行 ---------- */
function runMeasure() {
  if (MS.running) { MS.running = false; setRunBtn(); return; }
  MS.running = true; setRunBtn();
  const tok = ++MS.tok, alive = () => MS.running && tok === MS.tok;
  let id = 1;
  const stop = msg => {
    if (tok !== MS.tok) return;
    MS.running = false; setRunBtn();
    $('#mProg').textContent = msg;
    renderMeasure();
  };
  const next = () => {
    if (!alive()) { stop('測定を止めました（「▶ 測定する」で続きから再開できます）'); return; }
    if (id > TOTAL) { stop('✅ 全 ' + TOTAL + ' 面の測定が終わりました。「CSVをコピー」で結果を送ってください'); return; }
    const cur = id;
    $('#mProg').textContent = '元' + cur + ' / ' + TOTAL + ' を準備・測定中…（止めるときは「■ 止める」）';
    ensureLevel(cur, L => setTimeout(() => {
      if (!alive()) { stop('測定を止めました（「▶ 測定する」で続きから再開できます）'); return; }
      const old = MS.res.get(cur);
      if (old && old.sig === levelSig(L) && old.human != null) { id++; next(); return; }
      measureAsync(L, alive, r => {
        if (!r) { stop('測定を止めました（「▶ 測定する」で続きから再開できます）'); return; }
        MS.res.set(cur, r); saveMeasure(); renderMeasure();
        id++; setTimeout(next, 0);
      });
    }, 0));
  };
  next();
}
function copyCsv() {
  const ta = $('#mCsv'), txt = ta.value, msg = $('#mProg');
  if (!txt) { msg.textContent = 'まだ結果がありません'; return; }
  const fallback = () => {
    ta.focus(); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    msg.textContent = ok ? '📋 CSVをコピーしました' : 'コピーできませんでした。下の欄を選んでコピーしてください';
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => { msg.textContent = '📋 CSVをコピーしました'; }, fallback);
  else fallback();
}
function closeMeasure() { showOv('dev'); renderDev(); }

/* ---------- 画面の部品を作る（見た目の指定もここにまとめる） ---------- */
(function buildMeasureUI() {
  const st = document.createElement('style');
  st.textContent = [
    '.card.mwide{width:min(96vw,960px)}',
    '.mprog{font-size:12px!important;font-weight:700;color:var(--pinkd)}',
    '.mtbl{max-height:50vh;overflow:auto;touch-action:pan-x pan-y;border-radius:12px;background:#fff;margin:6px 0;border:2px solid #ffe0ea}',
    '.mtbl table{border-collapse:collapse;font-size:11px;white-space:nowrap;width:100%}',
    '.mtbl th{position:sticky;top:0;background:#ffe3ee;padding:5px 6px;font-weight:800;z-index:1;cursor:help}',
    '.mtbl td{padding:4px 6px;border-top:1px solid #f6e3ea;text-align:right}',
    '.mtbl td.l{text-align:left}',
    '.mtbl tr.old td{opacity:.4}',
    '.mtbl .m-ng{color:#d0304a;font-weight:800}',
    '.mtbl .m-ok{color:#2e8f55;font-weight:800}',
    '.mleg{text-align:left;font-size:11px!important;line-height:1.6!important;opacity:.75}',
    '#mCsv{width:100%;height:70px;font:11px monospace;border:2px solid #ffd3e2;border-radius:10px;padding:6px;user-select:text;-webkit-user-select:text;resize:vertical}'
  ].join('\n');
  document.head.appendChild(st);

  const ov = document.createElement('div');
  ov.className = 'ov'; ov.id = 'ov-measure';
  ov.innerHTML = '<div class="card mwide">' +
    '<h2>📊 難しさの測定</h2>' +
    '<p class="fine" id="mSum"></p>' +
    '<p class="mprog" id="mProg">「▶ 測定する」を押すと、全ステージを順に測ります（まだ作っていない面は先に作ります）</p>' +
    '<div class="devbar"><button id="bMRun">▶ 測定する</button><button id="bMCopy">CSVをコピー</button><button id="bMClear">結果を消す</button></div>' +
    '<div class="mtbl" id="mTbl"></div>' +
    '<p class="mleg">赤＝簡単になる要因（勝率50%以上など）／緑＝歯ごたえの要因（勝率20%以下など）。列名や「最少枠」の数字にマウスを乗せると説明が出ます。<br>' +
    'Lv＝遊ぶ順番　元＝元の番号　合格＝生成の合格条件を満たしたか　初届＝最初から届く色／全色　層＝一番奥の色までにはがす色の枚数<br>' +
    '割れ＝外と内の別々の層に出てくる色の数　待最大＝想定の解き方で同時に待つ箱の最大数　最少枠＝必要なスロットの最少数<br>' +
    '全部優先＝全部運べる箱を左から選ぶだけで解けるか　外側・適当・人間型＝各' + M_TRIALS + '回試したときの勝率。どれかが50%以上なら「簡単」と判定</p>' +
    '<textarea id="mCsv" readonly placeholder="測定するとCSVがここに出ます"></textarea>' +
    '<button class="big" id="bMClose">開発画面にもどる</button>' +
    '</div>';
  document.body.insertBefore(ov, $('#fx'));

  // 開発画面（全ステージ一覧）に入口のボタンを追加
  const bar = document.createElement('div');
  bar.className = 'devbar';
  bar.innerHTML = '<button id="bDevMeasure">📊 難しさを測る</button>';
  const close = $('#bDevClose');
  close.parentNode.insertBefore(bar, close);

  $('#bDevMeasure').addEventListener('click', () => { showOv('measure'); renderMeasure(); setRunBtn(); });
  $('#bMRun').addEventListener('click', runMeasure);
  $('#bMCopy').addEventListener('click', copyCsv);
  $('#bMClear').addEventListener('click', () => {
    if (MS.running || !confirm('測定結果をすべて消しますか？')) return;
    MS.res.clear(); saveMeasure(); renderMeasure();
    $('#mProg').textContent = '測定結果を消しました';
  });
  $('#bMClose').addEventListener('click', closeMeasure);
  window.addEventListener('keydown', e => { if (G.overlay === 'measure' && e.key === 'Escape') closeMeasure(); });
})();

AF_LOADED.push('measure.js');