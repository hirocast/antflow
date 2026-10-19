// File: ui.js
'use strict';

/* ================= ステージの並び順（ORDER は base.js） =================
   G.levelId や save.cleared は「元の番号」。画面に出す「Lv.」は遊ぶ順番（posOf で変換） */
(function checkOrder() {
  const ok = ORDER.length === TOTAL && new Set(ORDER).size === TOTAL && ORDER.every(id => id >= 1 && id <= TOTAL);
  if (ok) return;
  AF_bootErr('base.js の ORDER（ステージの並び順）に誤りがあるため、元の順番で遊びます');
  ORDER.length = 0;
  for (let i = 1; i <= TOTAL; i++) ORDER.push(i);
})();
function isOpen(id) { return posOf(id) <= save.maxLevel || !!save.cleared[id] || !!save.settings.dev; }
function nextOf(id) {
  const p = posOf(id);
  if (p >= TOTAL) return 0;
  const n = idAt(p + 1);
  return isOpen(n) ? n : idAt(save.maxLevel);
}

/* ================= 見た目（style.css の上書き。ここで追加するので style.css は変更不要） ================= */
(function injectStyle() {
  const st = document.createElement('style');
  st.textContent = `
body{background:linear-gradient(180deg,#86d6ff 0%,#c4ecff 40%,#eefbff 60%,#cdeea0 74%,#9fd86e 100%) fixed}
body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;opacity:.9;
 background:radial-gradient(ellipse 90px 30px at 14% 10%,#fff 60%,transparent 62%),radial-gradient(ellipse 56px 24px at 21% 7%,#fff 60%,transparent 62%),
 radial-gradient(ellipse 110px 34px at 82% 18%,#fff 60%,transparent 62%),radial-gradient(ellipse 66px 26px at 89% 14%,#fff 60%,transparent 62%),
 radial-gradient(ellipse 80px 26px at 50% 32%,rgba(255,255,255,.7) 60%,transparent 62%);animation:cloud 30s ease-in-out infinite alternate}
@keyframes cloud{to{transform:translateX(26px)}}
header{flex-basis:64px}
.lv{min-width:84px;border:3px solid #fff;background:linear-gradient(#fff,#fff2f7);box-shadow:0 4px 0 rgba(90,61,92,.22),0 8px 14px rgba(90,61,92,.12)}
.ib{border:3px solid #fff;background:linear-gradient(#fff,#ffeef5);box-shadow:0 4px 0 rgba(90,61,92,.22)}
.bar{height:16px;border:3px solid #fff;background:#ffe9f1;box-shadow:0 3px 0 rgba(90,61,92,.2)}
.bar i{background:repeating-linear-gradient(-45deg,#ff7fae 0 8px,#ffa6c8 8px 16px);box-shadow:inset 0 3px 0 rgba(255,255,255,.45)}
#leftTxt,#timeTxt{font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #fff}
#timeTxt b{color:#ffa000}
#timeTxt b.s1{color:#b99aa8}
.coin{display:flex;align-items:center;gap:3px;height:38px;padding:0 10px 0 6px;border-radius:19px;background:linear-gradient(#fffbe6,#ffe39a);border:3px solid #fff;box-shadow:0 4px 0 #d9a520;font-weight:900;font-size:15px;color:#8a5a00;flex:0 0 auto;cursor:pointer}
.coin i{font-style:normal;font-size:17px}
.coin.bump{animation:cbump .45s}
@keyframes cbump{40%{transform:scale(1.25)}}
.fb{position:relative;border:3px solid #fff;border-radius:22px}
.fb::after,.big::after{content:'';position:absolute;left:8%;right:8%;top:3px;height:38%;border-radius:16px;background:linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,0));pointer-events:none}
.big{position:relative;border:3px solid #fff;box-shadow:0 5px 0 var(--pinkd),0 8px 14px rgba(200,70,120,.22)}
.big.sec{box-shadow:0 5px 0 #e1c48e}
.big.mint{box-shadow:0 5px 0 var(--mintd)}
.fb em.price{position:absolute;top:-11px;right:-6px;font-style:normal;font-size:10px;font-weight:900;padding:2px 6px;border-radius:10px;background:linear-gradient(#fff6c4,#ffd23f);color:#7a4a00;border:2px solid #fff;box-shadow:0 2px 0 #d9a520;text-shadow:none;white-space:nowrap}
.ov{background:rgba(50,30,80,.45);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.card{border:none;background:linear-gradient(#fffdf6,#fff3df);box-shadow:0 0 0 4px #fff,0 0 0 8px #ffb6cd,0 18px 44px rgba(60,30,70,.4)}
.card h2{display:inline-block;padding:6px 24px;border-radius:16px;background:linear-gradient(#ff9fc0,#ff6f9f);color:#fff;box-shadow:0 4px 0 #d4507c;text-shadow:0 2px 0 rgba(0,0,0,.15);margin:0 0 10px}
.card h3{margin:14px 0 6px;font-size:15px;color:#c0507a}
#toast{position:fixed;bottom:110px;z-index:50}
body.fever #stage::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;border-radius:22px;box-shadow:inset 0 0 36px rgba(255,110,200,.6);animation:fvg .45s ease-in-out infinite alternate}
@keyframes fvg{to{box-shadow:inset 0 0 56px rgba(255,214,70,.8)}}
.tinfo{display:flex;justify-content:center;gap:8px;margin:4px 0}
.tinfo span{background:#fff;border-radius:12px;padding:3px 10px;font-weight:900;font-size:13px;box-shadow:0 2px 0 #f0d3df}
.mrow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.mrow button{position:relative;border:3px solid #fff;border-radius:18px;padding:8px 2px;background:linear-gradient(#eef8ff,#cbe7ff);box-shadow:0 4px 0 #8fbde6;font:900 12px var(--rf);color:var(--ink);cursor:pointer}
.mrow button:active{transform:translateY(3px);box-shadow:none}
.mrow button i{display:block;font-style:normal;font-size:24px}
.dot{position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:50%;background:#ff4d6d;border:2px solid #fff;display:none}
.dot.on{display:block;animation:bump .7s ease infinite alternate}
#ov-clear .ctitle{font-size:36px}
.csay{font-size:13px!important;font-weight:800;color:#a0507a}
#clearStars span{font-size:44px;margin:0 2px;-webkit-text-stroke:2px #fff;text-shadow:0 3px 0 #d08a00}
#clearStars span.off{color:#e2d6dc;text-shadow:0 3px 0 #c9b8c0}
.ctime{font-size:12px!important;font-weight:800}
.res{background:#fff;border-radius:16px;padding:6px 12px;margin:6px 0;border:2px solid #ffe3a0;text-align:left}
.res div{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;padding:3px 0;border-bottom:1px dashed #f3e2b8;animation:rin .3s both}
.res div:last-child{border:none}
.res div b{color:#d08a00;white-space:nowrap}
@keyframes rin{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
.restot{font-size:28px;font-weight:900;color:#d08a00}
.restot small{display:block;font-size:12px;color:var(--ink)}
.al small.bs{color:#ffa000;font-size:11px;font-weight:900}
.qsay{background:#fff;border-radius:14px;padding:8px 12px;border:2px solid #ffd3e2;font-weight:800;font-size:13px!important}
#qCv{display:block;width:100%;max-width:300px;aspect-ratio:300/170;margin:0 auto;border-radius:18px;border:3px solid #fff;box-shadow:0 4px 0 #d9b07a;cursor:pointer}
.qlv{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:center;text-align:left;margin:8px 0}
.qlv b{font-size:22px;color:var(--pinkd);grid-row:span 2}
.qlv span{font-weight:900;font-size:13px}
.qlv .abar{margin:0}
.qlv small{grid-column:2;font-size:11px;opacity:.7}
.rooms{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.room{background:#fff;border-radius:12px;padding:6px 2px;font-size:10px;font-weight:800;box-shadow:0 2px 0 #ecd3a8}
.room i{display:block;font-style:normal;font-size:22px}
.room.lock{opacity:.45}
.perks{text-align:left;font-size:12px}
.pk{padding:4px 8px;border-radius:10px;margin:3px 0;background:#f3eef1;opacity:.6}
.pk.on{background:#e6f8ec;opacity:1}
.pk b{display:inline-block;min-width:46px;color:var(--pinkd)}
.mis{background:#fff;border-radius:14px;padding:8px 10px;margin:6px 0;text-align:left;border:2px solid #ffe0ea}
.mis.done{background:#eafaf0;border-color:#a8e6c0}
.mis p{margin:0!important;font-weight:800;display:flex;justify-content:space-between;gap:6px}
.mis .abar{margin:4px 0 0}
.mis small{font-size:10px;opacity:.7}
.skgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:40vh;overflow:auto;touch-action:pan-y;padding:4px}
.sk{border:3px solid #fff;border-radius:14px;background:#fff1d6;padding:6px 2px;font:800 11px var(--rf);color:var(--ink);cursor:pointer;box-shadow:0 3px 0 #ecd3a8}
.sk i{display:block;font-style:normal;font-size:26px}
.sk small{display:block;font-size:9px;opacity:.75;font-weight:700}
.sk.on{background:#ffe0ec;border-color:var(--pink)}
.sk.lock{opacity:.5;cursor:default}
#skCv{display:block;width:120px;height:120px;margin:0 auto}
.dayrow{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:10px 0}
.day{background:#fff;border-radius:10px;padding:6px 0;font-size:10px;font-weight:800;box-shadow:0 2px 0 #ecd3a8}
.day b{display:block;font-size:11px}
.day.got{opacity:.45}
.day.today{background:#fff4c9;outline:3px solid #ffcf3a}
#ov-help .help{max-height:none;overflow:visible;text-align:center}
.hpic{position:relative;margin:2px auto 6px;max-width:300px;cursor:pointer}
#hCv{display:block;width:100%;aspect-ratio:300/140;border-radius:18px;background:linear-gradient(#e6f6ff,#fff6e6);border:3px solid #fff;box-shadow:0 4px 0 #ecd3a8}
.hnum{position:absolute;top:7px;left:9px;font-size:11px;font-weight:900;background:#fff;border-radius:10px;padding:1px 8px;color:var(--pinkd);box-shadow:0 2px 0 #f0d3df}
#hTitle{margin:8px 0 4px;font-size:17px;color:#c0507a}
#hText{margin:0 4px;font-size:14px;line-height:1.65;font-weight:700;min-height:4.95em;text-align:left}
.hdots{display:flex;justify-content:center;gap:6px;margin:10px 0 8px}
.hdots i{width:9px;height:9px;border-radius:5px;background:#f0d3df;transition:all .2s;cursor:pointer}
.hdots i.on{width:22px;background:var(--pink)}
.hnav{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hnav button{height:44px;border:3px solid #fff;border-radius:16px;background:#fff1d6;box-shadow:0 4px 0 #e1c48e;font:900 14px var(--rf);color:var(--ink);cursor:pointer}
.hnav button.go{background:linear-gradient(#ffb3cc,#ff7fae);color:#fff;box-shadow:0 4px 0 var(--pinkd)}
.hnav button:disabled{opacity:.4}
.hnav button:active{transform:translateY(3px);box-shadow:none}
#tut{position:fixed;top:0;left:0;right:0;bottom:0;z-index:30;pointer-events:none;display:none}
#tut.on{display:block}
#tut .tblk{position:fixed;pointer-events:auto;display:none}
#tut .tblk.all{left:0;top:0;right:0;bottom:0}
#tut .thole{position:fixed;left:50%;top:45%;width:0;height:0;border-radius:18px;pointer-events:none;box-shadow:0 0 0 200vmax rgba(40,20,70,.58);transition:left .25s,top .25s,width .25s,height .25s,opacity .2s}
#tut .thole::after{content:'';position:absolute;left:-5px;top:-5px;right:-5px;bottom:-5px;border:3px solid #ffd23f;border-radius:22px;box-shadow:0 0 14px rgba(255,210,63,.85);animation:tring .8s ease-in-out infinite alternate}
#tut .thole.none::after{display:none}
@keyframes tring{to{transform:scale(1.04);opacity:.55}}
#tut .tbub{position:fixed;left:0;top:0;width:min(92vw,370px);display:flex;gap:8px;align-items:flex-start;padding:10px 12px 10px 8px;background:linear-gradient(#fffdf6,#fff3df);border-radius:20px;box-shadow:0 0 0 3px #fff,0 0 0 6px #ffb6cd,0 10px 26px rgba(40,20,70,.4);pointer-events:auto;visibility:hidden;cursor:pointer}
#tut .tbub.show{visibility:visible;animation:tpop .3s cubic-bezier(.3,1.6,.5,1)}
#tut .tbub.shake{animation:tshake .4s}
@keyframes tpop{from{transform:scale(.8);opacity:0}}
@keyframes tshake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
#tut .tbub::before{content:'';position:absolute;left:var(--ax,50%);margin-left:-11px;border:11px solid transparent;display:none}
#tut .tbub.up::before{display:block;top:-28px;border-bottom-color:#ffb6cd}
#tut .tbub.down::before{display:block;bottom:-28px;border-top-color:#ffb6cd}
#tut .tcv{flex:0 0 56px;width:56px;height:56px}
#tut .tbody{flex:1;min-width:0;text-align:left}
#tut .ttxt{margin:0;font-size:14px;font-weight:800;line-height:1.55;color:var(--ink)}
#tut .tfoot{display:flex;align-items:center;gap:6px;margin-top:6px}
#tut .tcnt{font-size:11px;font-weight:900;color:#c9a0b4}
#tut .tdo{font-size:12px;font-weight:900;color:#e46a92;animation:bump .6s ease infinite alternate}
#tut .tsp{flex:1}
#tut .tskip{background:none;border:none;font:700 11px var(--rf);color:#b08aa0;text-decoration:underline;cursor:pointer;padding:4px}
#tut .tnext{border:3px solid #fff;border-radius:16px;padding:5px 14px;background:linear-gradient(#ff9fc0,#ff6f9f);color:#fff;font:900 13px var(--rf);box-shadow:0 3px 0 #d4507c;cursor:pointer;white-space:nowrap}
#tut .tnext:active{transform:translateY(2px);box-shadow:none}
#tut .thand{position:fixed;font-size:42px;line-height:1;pointer-events:none;display:none;filter:drop-shadow(0 3px 2px rgba(0,0,0,.3));animation:thand .9s ease-in-out infinite}
#tut .thand.hold{animation:thold 1.4s ease-in-out infinite}
@keyframes thand{50%{transform:translateY(10px)}}
@keyframes thold{0%{transform:translateY(12px)}20%,80%{transform:translateY(0) scale(.9)}100%{transform:translateY(12px)}}
`;
  document.head.appendChild(st);
})();

/* ================= 画面の部品を追加（index.html は変更不要） ================= */
(function buildMetaUI() {
  $('header').insertBefore((() => { const d = document.createElement('div'); d.className = 'coin'; d.id = 'coinPill'; d.innerHTML = '<i>🪙</i><b id="coinTxt">0</b>'; return d; })(), $('#bAlbum'));
  const tt = document.createElement('span'); tt.id = 'timeTxt'; $('.prog').appendChild(tt);
  document.body.appendChild($('#toast'));
  $('#bUndo').insertAdjacentHTML('beforeend', '<em class="price" id="pUndo"></em>');
  $('#bHint').insertAdjacentHTML('beforeend', '<em class="price" id="pHint"></em>');
  $('#ttl').insertAdjacentHTML('afterend', '<div class="tinfo" id="titleInfo"></div>');
  $('#bPlay').insertAdjacentHTML('afterend', '<div class="mrow"><button id="bMQueen"><i>👑</i>女王さま</button><button id="bMMis"><i>📋</i>ミッション<em class="dot" id="misDot"></em></button><button id="bMSkin"><i>🎀</i>きせかえ</button></div>');
  const tf = $('#ov-title .fine');
  if (tf) tf.textContent = '★はクリアタイムで決まるよ・ゆっくりでもクリアできる・何手でも戻せる';
  $('#clearName').insertAdjacentHTML('afterend', '<p class="csay" id="clearSay"></p>');
  $('#clearStars').insertAdjacentHTML('afterend', '<p class="ctime" id="clearTime"></p><div class="res" id="resList"></div><div class="restot">🪙 +<b id="resTotal">0</b><small id="resFood"></small></div>');
  $('#bReplay').insertAdjacentHTML('afterend', '<button class="big mint" id="bClearQueen">👑 女王さまにエサをあげる</button>');
  $('#bSetClose').insertAdjacentHTML('beforebegin', '<button class="big sec" id="bSetHome">🏠 ホーム（女王さま・ミッション・きせかえ）</button>');
  $('#bSetHelp').insertAdjacentHTML('beforebegin', '<button class="big sec" id="bSetTut">🎓 チュートリアルをもう一度</button>');
  // あそびかた：ページめくり式に作りかえる
  $('#ov-help .help').innerHTML =
    '<div class="hpic" id="hPic"><canvas id="hCv"></canvas><b class="hnum" id="hNum"></b></div>' +
    '<h3 id="hTitle"></h3><p id="hText"></p>' +
    '<div class="hdots" id="hDots"></div>' +
    '<div class="hnav"><button id="bHPrev">◀ まえ</button><button class="go" id="bHNext">つぎ ▶</button></div>' +
    '<button class="big mint" id="bHPractice">🎓 れんしゅうステージで教えてもらう</button>';
  $('#fx').insertAdjacentHTML('beforebegin',
    '<div class="ov" id="ov-colony"><div class="card">' +
      '<h2>👑 女王さまのへや</h2><canvas id="qCv"></canvas><p class="qsay" id="qSay"></p>' +
      '<div class="qlv"><b id="qLv"></b><span id="qTitle"></span><div class="abar"><i id="qBar"></i></div><small id="qExp"></small></div>' +
      '<p class="fine" id="qFood"></p><button class="big" id="bFeed">🍬 ごはんをあげる</button>' +
      '<h3>コロニーのおへや</h3><div class="rooms" id="qRooms"></div>' +
      '<h3>女王さまの力</h3><div class="perks" id="qPerks"></div>' +
      '<button class="big sec" id="bQClose">とじる</button></div></div>' +
    '<div class="ov" id="ov-missions"><div class="card">' +
      '<h2>📋 きょうのミッション</h2><div id="misList"></div><p class="fine" id="misBonus"></p>' +
      '<h3>⭐ スターロード</h3><div id="roadBox"></div>' +
      '<button class="big sec" id="bMisClose">とじる</button></div></div>' +
    '<div class="ov" id="ov-skins"><div class="card">' +
      '<h2>🎀 きせかえ</h2><canvas id="skCv"></canvas><p class="fine" id="skSum"></p><div class="skgrid" id="skGrid"></div>' +
      '<button class="big" id="bGacha"></button><button class="big sec" id="bSkClose">とじる</button></div></div>' +
    '<div class="ov" id="ov-daily"><div class="card">' +
      '<h2>🎁 ログインボーナス</h2><p id="dayMsg"></p><div class="dayrow" id="dayRow"></div>' +
      '<button class="big pulse" id="bDayOk">うけとる！</button></div></div>');
})();

/* ================= 効果音の追加（sound.js は変更不要） ================= */
Sound.fever = function () {
  if (!this.ok()) return;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.mallet(f, i * 0.06, 0.1));
  this.noise(0, 0.5, 0.04, 3200, 'bandpass', 0.6);
};
Sound.gold = function () {
  if (!this.ok()) return;
  [1318.5, 1760, 2093].forEach((f, i) => this.bell(f, i * 0.07, 0.06, 0.6));
};
Sound.coin = function () {
  if (!this.ok()) return;
  this.tone(1568, 0.08, { vol: 0.05, type: 'square' });
  this.tone(2093, 0.22, { vol: 0.045, type: 'square', when: 0.07 });
};
Sound.nice = function () { if (this.ok()) [659.25, 987.77].forEach((f, i) => this.mallet(f, i * 0.08, 0.1)); };

/* ================= 育成・経済（セーブに項目を足す。古いセーブもそのまま使える） ================= */
// tut：見おわったチュートリアルの記録
const META_DEF = { coins: 150, food: 0, qlv: 1, qexp: 0, tickets: 0, road: 0, best: {}, skins: ['none'], skin: 'none', daily: { day: '', streak: 0 }, mis: { day: '', list: [], bonus: 0 }, tut: {} };
function metaInit(force) {
  for (const k in META_DEF) {
    const d = META_DEF[k], v = save[k];
    if (force || v == null || typeof v !== typeof d || Array.isArray(v) !== Array.isArray(d)) save[k] = JSON.parse(JSON.stringify(d));
  }
  if (save.skins.indexOf('none') < 0) save.skins.unshift('none');
  save.skins = save.skins.filter(k => SKINS.some(s => s.k === k));
  if (save.skins.indexOf(save.skin) < 0) save.skin = 'none';
  save.qlv = clamp(Math.floor(save.qlv) || 1, 1, Q_MAX);
  save.coins = Math.max(0, Math.floor(save.coins) || 0);
  save.food = Math.max(0, Math.floor(save.food) || 0);
  for (const k in save.best) if (!(+k >= 1 && +k <= TOTAL) || !save.best[k] || typeof save.best[k].t !== 'number') delete save.best[k];
  if (!Array.isArray(save.mis.list)) save.mis = JSON.parse(JSON.stringify(META_DEF.mis));
  persist();
}
metaInit(false);
G.waitIds = new Set();
G.perk = perks(); G.spdMul = G.perk.speed;

function dayKey(off) { const d = new Date(); d.setDate(d.getDate() + (off || 0)); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function totalStars() { let n = 0; for (let i = 1; i <= TOTAL; i++) if (save.cleared[i]) n += save.best[i] ? save.best[i].s : 1; return n; }
function priceOf(k) { return k === 'hint' ? Math.round(PRICE.hint * (1 - perks().hintCut)) : PRICE[k]; }
function priceLabel(k) {
  const R = G.run;
  if (k === 'undo' && R && R.freeU > 0) return 'むりょう×' + R.freeU;
  if (k === 'hint' && R && R.freeH > 0) return 'むりょう';
  return '🪙' + priceOf(k);
}
function refreshPrices() {
  const a = $('#pUndo'), b = $('#pHint');
  if (a) a.textContent = priceLabel('undo');
  if (b) b.textContent = priceLabel('hint');
}
function updateCoins(bump) {
  $('#coinTxt').textContent = save.coins;
  if (bump) { const p = $('#coinPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  refreshPrices();
  if (G.overlay === 'title') renderTitle();
}
// 支払い：むりょう回数 → コインの順に使う。足りなければ false
function pay(k) {
  const R = G.run;
  if (k === 'undo' && R && R.freeU > 0) { R.freeU--; refreshPrices(); return true; }
  if (k === 'hint' && R && R.freeH > 0) { R.freeH--; refreshPrices(); return true; }
  const p = priceOf(k);
  if (save.coins < p) {
    Sound.deny();
    const msg = '🪙 コインが足りないよ（' + p + 'こ必要）。⟳やりなおしは無料！';
    if (G.overlay === 'jam') $('#jamMsg').textContent = msg; else toast(msg, 2600);
    return false;
  }
  save.coins -= p; persist(); updateCoins(true);
  return true;
}

/* ---- ミッション（毎日3つ。日付から決まる） ---- */
function misCheck() {
  const d = dayKey();
  if (save.mis.day === d && save.mis.list.length) return;
  const rng = mulberry32(strHash(d)), idx = [], kinds = new Set();
  for (let g = 0; g < 200 && idx.length < 3; g++) {
    const i = Math.floor(rng() * MISSION_POOL.length), k = MISSION_POOL[i].k;
    if (kinds.has(k)) continue;
    kinds.add(k); idx.push(i);
  }
  save.mis = { day: d, list: idx.map(i => ({ i, p: 0, done: false })), bonus: 0 };
  persist();
}
// out があればリザルトの行に追加（コインは呼び出し側でまとめて足す）。なければその場で足す
function misAdd(k, v, out) {
  misCheck();
  const lines = [];
  for (const m of save.mis.list) {
    const d = MISSION_POOL[m.i];
    if (!d || d.k !== k || m.done) continue;
    m.p = d.max ? Math.max(m.p, v) : m.p + v;
    if (m.p >= d.n) { m.done = true; lines.push(['📋 ミッション「' + d.t + '」', d.r]); }
  }
  if (!save.mis.bonus && save.mis.list.length && save.mis.list.every(m => m.done)) {
    save.mis.bonus = 1; save.tickets++;
    lines.push(['📋 ミッションぜんぶ達成！（🎟️+1）', 100]);
  }
  if (out) out.push(...lines);
  else if (lines.length) {
    save.coins += lines.reduce((a, l) => a + l[1], 0);
    toast(lines.map(l => l[0] + ' 🪙' + l[1]).join(' / '), 3000);
    Sound.coin(); updateCoins(true);
  }
  persist();
}

/* ---- ログインボーナス ---- */
function dailyCheck() {
  const d = dayKey();
  if (save.daily.day === d) return false;
  const st = save.daily.day === dayKey(-1) ? (save.daily.streak | 0) + 1 : 1;
  G.dailyP = { st, coins: LOGIN_REWARD[(st - 1) % 7], ticket: (st - 1) % 7 === 6 };
  return true;
}
function showDaily() {
  const P = G.dailyP, cur = (P.st - 1) % 7;
  $('#dayMsg').textContent = P.st + '日れんぞくログイン！きょうのごほうび：🪙' + P.coins + (P.ticket ? '＋🎟️おたからばこチケット' : '');
  $('#dayRow').innerHTML = LOGIN_REWARD.map((r, i) => '<div class="day' + (i < cur ? ' got' : i === cur ? ' today' : '') + '"><b>' + (i + 1) + '日</b>' + (i === 6 ? '🎟️' : '🪙') + '<br>' + r + '</div>').join('');
  showOv('daily');
}

/* ================= 進行制御 ================= */
function loadLevel(id) {
  id = clamp(id, 1, TOTAL);
  G.loading = true; G.rewindTok++; G.clearShown = true; G.pendingWin = false; G.pendingJam = false;
  const tok = ++G.loadTok;
  const tm = setTimeout(() => { if (tok === G.loadTok && G.loading && !G.overlay) showOv('load'); }, 150);
  ensureLevel(id, L => {
    if (tok !== G.loadTok) return;
    clearTimeout(tm);
    applyLevel(id, L);
    if (G.overlay === 'load') hideOv();
  });
}
function pickGold(L) {
  const set = new Set(), cells = [];
  if (posOf(L.id) <= 2 || Math.random() > (G.perk.gold >= 2 ? 0.9 : 0.6)) return set;
  for (let i = 0; i < L.grid.length; i++) if (L.grid[i] >= 0) cells.push(i);
  if (!cells.length) return set;
  const n = Math.min(8, Math.max(1, Math.round(cells.length / 220)) * G.perk.gold);
  for (let k = 0; k < n * 4 && set.size < n; k++) set.add(cells[Math.floor(Math.random() * cells.length)]);
  return set;
}
function applyLevel(id, L) {
  G.levelId = id; G.level = L; G.s = makeState(L);
  G.undo = []; G.moves = []; G.queued = null;
  // アリの歩く速さ。ANT_RATE を変えると全体の速さが変わる（1＝前の速さ、0.5＝半分）
  const ANT_RATE = 0.5;
  G.antSpeed = clamp((L.W + L.H) * 0.36, 8, 42) * ANT_RATE;
  G.run = { started: false, done: false, time: 0, candies: 0, food: 0, maxCombo: 0, fevers: 0, fcoin: 0, gold: 0, nice: 0, undos: 0, hints: 0, freeU: G.perk.freeUndo, freeH: G.perk.freeHint };
  G.par = parTimes(L); G.waitIds = new Set(); G.timerShown = -9;
  endFever(); G.fever.g = 0;
  G.gold = pickGold(L);
  save.level = id; persist();
  layout(); resetVisual();
  G.clearShown = false; G.loading = false;
  Tut.levelStart(id);
  updateTip(); refreshPrices();
  $('#bPlay').textContent = 'あそぶ（Lv.' + posOf(id) + '）';
}
function headCounts(s) {
  const out = new Array(s.cols.length).fill(0);
  for (let j = 0; j < s.cols.length; j++) {
    if (s.heads[j] >= s.cols[j].length) continue;
    const t = cloneState(s), b = place(t, j, null);
    out[j] = b.n - b.rem;
  }
  return out;
}
function resetVisual() {
  G.vgrid = G.s.grid.slice(); G.vver++; G.boardDirty = true;
  G.pgrid = G.vgrid.slice(); G.pver++;
  G.ants = []; G.parts = []; G.bubbles = []; G.popups = []; G.vboxes = [];
  G.parades = []; G.lastOut = new Array(SLOT_COUNT).fill(null);
  G.vslots = new Array(SLOT_COUNT).fill(null);
  G.s.boxes.forEach((b, i) => {
    const vb = { id: b.id, c: b.c, total: b.rem, dispatched: 0, picked: 0, queue: [], slot: i, state: 'slot', t: 1, logicalDone: false, nextT: 0 };
    G.vboxes.push(vb); G.vslots[i] = vb;
  });
  G.waitIds = new Set([...G.waitIds].filter(id => G.s.boxes.some(b => b.id === id)));
  G.trayOff = new Array(G.s.cols.length).fill(0);
  G.vleft = G.s.left; G.pendingWin = false; G.pendingJam = isJam(G.s); G.jamDismissed = false; G.endT = 0;
  G.hintCol = -1; G.preview = null; G.combo = 0; G.slowmo = 0; G.saidOnce = false;
  G.rc = reachableCounts(G.s);
  G.hc = null;
  Sound.muffle(false);
  G.hudDirty = true;
}
function niceRead() {
  if (!G.run) return;
  G.run.nice++;
  popup('ナイス先読み！', CW / 2, slotY - slotSize * 0.95, '#7cffb0');
  Sound.nice();
  Tut.add('nice');
}
function onTapCol(j) {
  if (G.overlay || !G.s || G.pendingWin || G.loading) return;
  const s = G.s;
  if (s.heads[j] >= s.cols[j].length) return;
  if (s.boxes.length >= SLOT_COUNT) { G.shake = { j, t: 0.24 }; G.slotFlash = 0.4; Sound.deny(); haptic(20); return; }
  const free = G.vslots.indexOf(null);
  if (free < 0) { G.queued = { j, until: G.rt + 2.5 }; return; }
  if (G.run && !G.run.started) { G.run.started = true; G.timerShown = -9; }
  G.undo.push(cloneState(s)); G.moves.push(j);
  const ev = [];
  place(s, j, ev);
  let newId = -1, newN = 0, got = 0;
  for (const e of ev) {
    if (e.type === 'place') {
      const vb = { id: e.id, c: e.c, total: e.n, dispatched: 0, picked: 0, queue: [], slot: free, state: 'fly', t: 0, logicalDone: false, nextT: 0, fx: trayX(j), fy: trayHeadY, fs: headSize };
      G.vboxes.push(vb); G.vslots[free] = vb;
      newId = e.id; newN = e.n; G.waitIds.delete(e.id);
    } else {
      const vb = G.vboxes.find(v => v.id === e.id);
      if (!vb) continue;
      if (e.type === 'assign') { vb.queue.push(...e.cells); if (e.id === newId) got += e.cells.length; }
      else {
        vb.logicalDone = true;
        if (e.id !== newId && G.waitIds.has(e.id)) { G.waitIds.delete(e.id); niceRead(); }
      }
    }
  }
  if (newId >= 0 && got === 0) G.waitIds.add(newId);
  G.trayOff[j] = trayGap;
  G.rc = reachableCounts(s);
  G.hc = null;
  G.hintCol = -1; G.boardDirty = true;
  Sound.tap(); haptic(8);
  if (s.left === 0) { G.pendingWin = true; if (G.run) G.run.done = true; }
  else if (isJam(s)) G.pendingJam = true;
  // はじめて起きたことを、その場で1回だけ説明する
  if (newId >= 0 && !G.pendingWin) {
    if (got === 0) Tut.add('sleep', free);
    else if (got < newN) Tut.add('partial', free);
  }
  if (!G.pendingWin && !G.pendingJam && s.boxes.length === SLOT_COUNT - 1) Tut.add('slot4');
  G.hudDirty = true;
  updateTip();
}
function showPreview(j) {
  if (G.s.heads[j] >= G.s.cols[j].length || G.s.boxes.length >= SLOT_COUNT) return;
  const t = cloneState(G.s), ev = [], b = place(t, j, ev), cells = [];
  for (const e of ev) if (e.type === 'assign' && e.id === b.id) cells.push(...e.cells);
  G.preview = { cells, c: b.c, n: b.n };
  if (!save.flags.lp) { save.flags.lp = 1; persist(); }
  haptic(10);
}

/* ================= オーバーレイ・クリア演出 ================= */
function showOv(name) {
  G.overlay = name;
  document.querySelectorAll('.ov').forEach(o => o.classList.toggle('show', o.id === 'ov-' + name));
  if (name === 'title') renderTitle();
}
function hideOv() { G.overlay = null; document.querySelectorAll('.ov').forEach(o => o.classList.remove('show')); }
function popText(el, text) {
  el.innerHTML = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch; s.style.color = POP[i % POP.length]; s.style.animationDelay = (i * 0.07) + 's,' + (0.6 + i * 0.1) + 's';
    el.appendChild(s);
  });
}
function drawThumb(cv, art, size, shadow) {
  cv.width = cv.height = Math.round(size * dpr);
  cv.style.width = cv.style.height = size + 'px';
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = art.W, c = (size - 6) / W, x0 = 3;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const v = art.grid[y * W + x];
    if (v < 0) continue;
    g.fillStyle = shadow ? 'rgba(120,80,110,.3)' : HEX[v];
    g.fillRect(x0 + x * c, x0 + y * c, c + 0.4, c + 0.4);
  }
}
function updateBadge() {
  const b = $('#albumBadge'), n = save.newArts.length;
  b.textContent = n; b.classList.toggle('on', n > 0);
}
function showClear() {
  const id = G.levelId, pos = posOf(id), first = !save.cleared[id], tok = ++G.clearTok, P = G.perk;
  const R = G.run || { time: 0, candies: 0, food: 0, maxCombo: 0, fevers: 0, fcoin: 0, gold: 0, nice: 0, undos: 0, hints: 0 };
  G.clearShown = true; G.nextBusy = false;
  endFever();
  const t = Math.max(0.1, Math.round(R.time * 10) / 10), par = G.par || parTimes(G.level), st = timeStars(t, par);
  const prev = save.best[id], firstS3 = st === 3 && !(prev && prev.s >= 3), newBest = !!prev && t < prev.t;
  save.best[id] = { s: Math.max(st, prev ? prev.s : 0), t: prev ? Math.min(prev.t, t) : t };
  save.cleared[id] = 1;
  if (first && save.newArts.indexOf(id) < 0) save.newArts.push(id);
  if (pos <= save.maxLevel) save.maxLevel = Math.max(save.maxLevel, Math.min(TOTAL, pos + 1));
  const nx = nextOf(id);
  save.level = nx || id;

  // ---- コインの計算（上手なほど増える） ----
  const lines = [], d = starsAt(pos);
  lines.push(['クリア（むずかしさ' + '★'.repeat(d) + '）', 10 + d * 4]);
  lines.push(['タイム ' + '★'.repeat(st) + '☆'.repeat(3 - st), [0, 5, 15, 30][st]]);
  if (R.maxCombo >= 5) lines.push(['さいだい ' + R.maxCombo + ' コンボ', Math.floor(R.maxCombo / 5)]);
  if (R.fevers) lines.push(['フィーバー ×' + R.fevers, R.fevers * 10 + R.fcoin]);
  if (R.gold) lines.push(['金のキャンディ ×' + R.gold, R.gold * 15]);
  if (R.nice) lines.push(['ナイス先読み ×' + R.nice, R.nice * 8]);
  if (!R.undos && !R.hints) lines.push(['もどす・ヒントなし', 15]);
  if (first) lines.push(['はじめてのクリア', 30]);
  if (firstS3) lines.push(['はじめての★★★', 40]);
  const sub = lines.reduce((a, l) => a + l[1], 0), extra = Math.round(sub * (P.coin - 1)) + P.bonus;
  if (extra > 0) lines.push(['女王さま・きせかえボーナス', extra]);
  const food = Math.round(R.food * P.food);
  save.food += food;
  misAdd('clear', 1, lines);
  if (st === 3) misAdd('star3', 1, lines);
  misAdd('candy', R.candies, lines);
  misAdd('combo', R.maxCombo, lines);
  if (R.fevers) misAdd('fever', R.fevers, lines);
  if (R.gold) misAdd('gold', R.gold, lines);
  if (R.nice) misAdd('nice', R.nice, lines);
  if (!R.undos && !R.hints) misAdd('noassist', 1, lines);
  const ts = totalStars();
  while (Math.floor(ts / 10) > save.road) {
    save.road++;
    const tk = save.road % 3 === 0;
    if (tk) save.tickets++;
    lines.push(['⭐ スターロード ' + save.road * 10 + '★' + (tk ? '（🎟️+1）' : ''), 100]);
  }
  const total = lines.reduce((a, l) => a + l[1], 0);
  save.coins += total;
  persist();
  if (nx) ensureLevel(nx, () => {});

  Sound.fanfare(); haptic(30); Sound.duck(3.2);
  popText($('#clearTitle'), st === 3 ? 'パーフェクト！' : 'クリア！');
  $('#clearLv').textContent = 'レベル ' + pos;
  $('#clearName').textContent = '「' + G.level.name + '」がかんせい！';
  $('#clearSay').textContent = '🐜「' + talkLine(st === 3 ? 'star3' : 'clear') + '」';
  const cv = $('#revealCv'), S = Math.round(Math.min(innerWidth * 0.5, 180));
  cv.style.width = cv.style.height = S + 'px'; cv.width = cv.height = Math.round(S * dpr);
  G.reveal = { t: 0, art: getArt(id), g: cv.getContext('2d'), S };
  const se = $('#clearStars');
  se.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const sp = document.createElement('span');
    sp.textContent = '★'; sp.style.animationDelay = (0.9 + i * 0.2) + 's';
    if (i >= st) sp.className = 'off';
    se.appendChild(sp);
    if (i < st) setTimeout(() => { if (tok === G.clearTok) Sound.starPing(i); }, 900 + i * 200);
  }
  $('#clearTime').textContent = '⏱ ' + t + '秒（★★★ ' + par[0] + '秒・★★ ' + par[1] + '秒）' + (newBest ? '　🏅自己ベスト！' : '');
  $('#resList').innerHTML = lines.map((l, i) => '<div style="animation-delay:' + (0.9 + i * 0.12).toFixed(2) + 's"><span>' + l[0] + '</span><b>🪙+' + l[1] + '</b></div>').join('');
  $('#resFood').textContent = '🍬 エサ +' + food + '（しょくりょうこ ' + save.food + '）';
  $('#bClearQueen').textContent = '👑 女王さまにエサをあげる（🍬' + save.food + '）';
  const rt = $('#resTotal');
  rt.textContent = '0';
  setTimeout(() => {
    if (tok !== G.clearTok) return;
    const t0 = performance.now();
    const tick = () => {
      if (tok !== G.clearTok) return;
      const k = Math.min(1, (performance.now() - t0) / 800);
      rt.textContent = Math.round(total * k);
      if (k < 1) requestAnimationFrame(tick); else { Sound.coin(); updateCoins(true); }
    };
    tick();
  }, (0.9 + lines.length * 0.12) * 1000);
  const got = gotCount();
  $('#albumTotal').textContent = TOTAL;
  $('#albumCount').textContent = first ? got - 1 : got;
  $('#albumBar').style.width = (100 * (first ? got - 1 : got) / TOTAL) + '%';
  $('#albumNew').classList.remove('on');
  setTimeout(() => {
    if (tok !== G.clearTok) return;
    $('#albumCount').textContent = got;
    $('#albumBar').style.width = (100 * got / TOTAL) + '%';
    if (first) { $('#albumNew').classList.add('on'); Sound.albumIn(); }
  }, 1700);
  const nc = $('#nextCv'), bn = $('#bNext');
  if (nx) {
    const na = getArt(nx);
    drawThumb(nc, na, 52, !save.cleared[nx]); nc.style.display = '';
    $('#nextLabel').textContent = 'つぎの絵（クリアで公開）';
    $('#nextName').textContent = 'つぎは「' + na.theme + '」の絵！（' + na.W + '×' + na.H + '）';
    bn.textContent = 'つぎへ ▶';
  } else {
    nc.style.display = 'none';
    $('#nextLabel').textContent = 'おめでとう！';
    $('#nextName').textContent = 'ぜんぶの絵をあつめたよ！';
    bn.textContent = 'アルバムを見る 📒';
  }
  bn.disabled = false;
  showOv('clear');
  Fx.rain(130);
  [0.25, 0.65, 1.05, 1.5].forEach((dd, i) => setTimeout(() => {
    if (tok !== G.clearTok || G.overlay !== 'clear') return;
    Fx.burst(Fx.w * (0.2 + Math.random() * 0.6), Fx.h * (0.15 + Math.random() * 0.3), 45, 380, ['star', 'dot', 'conf']);
    if (i % 2) Sound.boom();
  }, dd * 1000));
}
function drawReveal(dt) {
  const R = G.reveal, g = R.g, S = R.S, W = R.art.W;
  R.t += dt;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
  const c = (S - 20) / W, x0 = 10, cx = (W - 1) / 2, md = Math.hypot(cx, cx) || 1;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const v = R.art.grid[y * W + x];
    if (v < 0) continue;
    const k = clamp((R.t - Math.hypot(x - cx, y - cx) / md * 0.8) / 0.3, 0, 1);
    if (k <= 0) continue;
    const s = c * 0.98 * easeOutBack(k), px = x0 + (x + 0.5) * c, py = x0 + (y + 0.5) * c;
    g.fillStyle = SHADE[v].d; g.fillRect(px - s / 2, py - s / 2, s, s);
    g.fillStyle = HEX[v]; g.fillRect(px - s / 2, py - s / 2, s, s * 0.84);
  }
  if (R.t > 1.1) {
    const sx = ((R.t - 1.1) % 2.2) / 1.2 * (S + 80) - 40;
    const gr = g.createLinearGradient(sx - 30, 0, sx + 30, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
}
function flyToAlbum(id) {
  const src = $('#revealCv').getBoundingClientRect(), dst = $('#bAlbum').getBoundingClientRect(), d = document.createElement('div'), cv = document.createElement('canvas');
  d.className = 'fly';
  drawThumb(cv, getArt(id), 84, false);
  d.appendChild(cv);
  d.style.left = (src.left + src.width / 2 - 48) + 'px'; d.style.top = (src.top + src.height / 2 - 53) + 'px';
  document.body.appendChild(d);
  Sound.whoosh();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    d.style.transform = 'translate(' + (dst.left + dst.width / 2 - src.left - src.width / 2) + 'px,' + (dst.top + dst.height / 2 - src.top - src.height / 2) + 'px) scale(.18) rotate(-20deg)';
    d.style.opacity = '0.3';
  }));
  setTimeout(() => {
    d.remove(); Sound.albumIn(); updateBadge();
    const b = $('#bAlbum');
    b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    Fx.burst(dst.left + dst.width / 2, dst.top + dst.height / 2, 18, 220, ['star', 'dot']);
  }, 900);
}
function showJam() {
  Sound.jam(); Sound.muffle(true); G.jamShake = 0.4; haptic(40);
  const say = '🐜「' + talkLine('jam') + '」', btn = $('#bJamRewind'), ub = $('#bJamUndo');
  $('#jamMsg').textContent = say + ' どこで道を外れたか調べています。';
  $('#bJamRetry').textContent = '⟳ 最初から（むりょう）';
  // 前回の表示を元に戻す（ボタンを隠したままにしない）
  btn.style.display = ''; btn.disabled = true; btn.textContent = '⏪ 戻り先を調べています…';
  ub.style.display = ''; ub.disabled = false; ub.classList.add('sec');
  ub.textContent = '↶ 1手もどす（' + priceLabel('undo') + '）';
  showOv('jam');
  const tok = ++G.rewindTok, n = G.undo.length, sol = G.level.solution, t0 = Date.now();
  G.rewindTo = -1;
  if (!n) {
    btn.style.display = 'none'; ub.style.display = 'none';
    $('#jamMsg').textContent = say + ' 最初からやりなおそう！';
    return;
  }
  let k = 0;
  while (k < n && k < sol.length && G.moves[k] === sol[k]) k++;
  k = Math.min(k, n - 1);
  let i = n - 1;
  const finish = t => {
    if (tok !== G.rewindTok) return;
    const cnt = n - t;
    if (cnt <= 1) {
      // 戻り先が1手前なら「1手もどす」と同じなので、⏪は出さず「1手もどす」を一番目のボタンにする
      btn.style.display = 'none';
      ub.classList.remove('sec');
      ub.textContent = '↶ 1手もどす（' + priceLabel('undo') + '）';
      $('#jamMsg').textContent = say + ' 1手前までは解ける状態だったよ。1手もどして別の箱を試そう！';
      return;
    }
    G.rewindTo = t; btn.disabled = false;
    btn.textContent = '⏪ ' + cnt + '手もどす（🪙' + PRICE.rewind + '）';
    $('#jamMsg').textContent = say + ' ' + cnt + '手前までは解ける状態だったよ。そこから別の順番を試そう！';
  };
  const step = () => {
    if (tok !== G.rewindTok) return;
    if (i <= k || Date.now() - t0 > 2500) { finish(k); return; }
    if (solve(G.undo[i], 160, 30000).path) { finish(i); return; }
    i--;
    setTimeout(step, 0);
  };
  setTimeout(step, 30);
}
// タイトル画面と読み込み画面のアリさん
function drawMascot(cv, t) {
  if (cv.width !== 170 * dpr) { cv.width = 170 * dpr; cv.height = 130 * dpr; }
  const g = cv.getContext('2d'), u = 30, bob = -Math.abs(Math.sin(t * 4)) * 5;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, 170, 130);
  g.fillStyle = 'rgba(120,60,90,.15)'; ell(g, 85, 120, 46, 6); g.fill();
  g.save(); g.translate(80, 120 - 0.8 * u + bob); g.rotate(Math.sin(t * 4) * 0.06);
  drawAntShape(g, u, 10, 1, Math.floor(t * 8) & 3, save.skin);
  const cz = u * 1.3;
  g.translate(0.36 * u, -1.02 * u - cz / 2); g.rotate(Math.sin(t * 3) * 0.08);
  paintCandy(g, -cz / 2, -cz / 2, cz, 2);
  g.restore();
}

/* ================= ホーム画面・女王さま・ミッション・きせかえ ================= */
function renderTitle() {
  const el = $('#titleInfo');
  if (!el) return;
  el.innerHTML = '<span>🪙 ' + save.coins + '</span><span>⭐ ' + totalStars() + '</span><span>👑 Lv.' + save.qlv + '</span>';
  misCheck();
  $('#misDot').classList.toggle('on', save.mis.list.some(m => !m.done));
}
// metaFrom：とじたときに戻る画面（'title' / 'clear' / それ以外はゲーム画面）
function closeMeta() {
  const f = G.metaFrom;
  if (f === 'title') showOv('title'); else if (f === 'clear') showOv('clear'); else hideOv();
}
function openColony(from) {
  G.metaFrom = from;
  renderColony();
  $('#qSay').textContent = '👑「' + talkLine('queen') + '」';
  showOv('colony');
}
function renderColony() {
  const lv = save.qlv, max = lv >= Q_MAX, need = qNeed(lv);
  $('#qLv').textContent = 'Lv.' + lv;
  $('#qTitle').textContent = qTitle(lv);
  $('#qBar').style.width = (max ? 100 : clamp(100 * save.qexp / need, 0, 100)) + '%';
  $('#qExp').textContent = max ? 'さいだいレベル！' : 'つぎのレベルまで ' + save.qexp + ' / ' + need;
  $('#qFood').textContent = '🍬 しょくりょうこのエサ：' + save.food + ' こ（ステージで運んだキャンディがたまるよ）';
  $('#bFeed').disabled = !save.food || max;
  $('#qRooms').innerHTML = ROOMS.map(r => '<div class="room' + (lv >= r[0] ? '' : ' lock') + '"><i>' + (lv >= r[0] ? r[1] : '🔒') + '</i>' + (lv >= r[0] ? r[2] : 'Lv.' + r[0]) + '</div>').join('');
  $('#qPerks').innerHTML = '<div class="pk on"><b>いつも</b>クリアのコイン +' + (lv - 1) * 2 + '%（レベルごとに+2%）</div>' +
    Q_PERKS.map(p => '<div class="pk' + (lv >= p[0] ? ' on' : '') + '"><b>Lv.' + p[0] + '</b>' + (lv >= p[0] ? '✅ ' : '') + p[1] + '</div>').join('');
}
function doFeed() {
  if (!save.food || save.qlv >= Q_MAX) return;
  const before = save.qlv;
  save.qexp += save.food; save.food = 0;
  while (save.qlv < Q_MAX && save.qexp >= qNeed(save.qlv)) { save.qexp -= qNeed(save.qlv); save.qlv++; }
  if (save.qlv >= Q_MAX) save.qexp = 0;
  persist();
  G.qBounce = 1; Sound.albumIn(); haptic(15);
  if (save.qlv > before) {
    const lv = save.qlv, gain = [];
    ROOMS.forEach(r => { if (r[0] > before && r[0] <= lv) gain.push(r[1] + r[2]); });
    Q_PERKS.forEach(p => { if (p[0] > before && p[0] <= lv) gain.push(p[1]); });
    toast('👑 女王さまが Lv.' + lv + ' に！' + (gain.length ? ' あたらしく：' + gain.join('・') : ''), 3600);
    Sound.fanfare();
    Fx.burst(innerWidth / 2, innerHeight * 0.3, 60, 380, ['star', 'conf', 'dot']);
  }
  $('#qSay').textContent = '👑「' + talkLine('queen') + '」';
  G.perk = perks(); G.spdMul = G.perk.speed;
  misAdd('feed', 1, null);
  renderColony(); updateCoins();
  $('#bClearQueen').textContent = '👑 女王さまにエサをあげる（🍬' + save.food + '）';
}
function drawColony(cv, t) {
  const Wc = 300, Hc = 170;
  if (cv.width !== Math.round(Wc * dpr)) { cv.width = Math.round(Wc * dpr); cv.height = Math.round(Hc * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
  g.fillStyle = '#bfeaff'; g.fillRect(0, 0, Wc, 26);
  g.fillStyle = '#8fd46a'; g.fillRect(0, 20, Wc, 10);
  const sg = g.createLinearGradient(0, 28, 0, Hc);
  sg.addColorStop(0, '#e7bf87'); sg.addColorStop(1, '#b97f4a');
  g.fillStyle = sg; g.fillRect(0, 28, Wc, Hc - 28);
  g.strokeStyle = 'rgba(255,236,200,.55)'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(150, 26); g.lineTo(150, 100); g.moveTo(60, 70); g.lineTo(120, 115); g.moveTo(240, 72); g.lineTo(185, 115); g.stroke();
  g.fillStyle = 'rgba(255,236,200,.55)';
  ell(g, 150, 135, 125, 30); g.fill(); ell(g, 60, 68, 40, 16); g.fill(); ell(g, 240, 70, 44, 16); g.fill();
  const spots = [[60, 66], [240, 68], [26, 118], [274, 118], [102, 96], [198, 96], [20, 50], [280, 50]];
  g.font = '18px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  ROOMS.filter(r => save.qlv >= r[0]).forEach((r, i) => { if (spots[i]) g.fillText(r[1], spots[i][0], spots[i][1]); });
  const n = Math.min(10, 2 + Math.floor(save.qlv / 4));
  for (let k = 0; k < n; k++) {
    const sp = 26 + (k % 3) * 8, dir = k % 2 ? 1 : -1, span = Wc + 40;
    let x = ((t * sp + k * 53) % span) - 20;
    if (dir < 0) x = Wc - x;
    g.save(); g.translate(x, 156 - (k % 3) * 4); g.scale(dir, 1);
    drawAntShape(g, 7, k % 9, 1, Math.floor(t * 10 + k) & 3, null);
    paintCandy(g, 7 * 0.36 - 4.55, -7 * 1.02 - 9.1, 9.1, (k * 3) % 21);
    g.restore();
  }
  const u = 20 + Math.min(save.qlv, Q_MAX) * 0.3, b = G.qBounce || 0, bob = -Math.abs(Math.sin(t * 2.2)) * 3;
  g.save(); g.translate(150, 132 + bob); g.scale(1 + 0.15 * b, 1 - 0.1 * b);
  drawAntShape(g, u, 10, 0, Math.floor(t * 3) & 3, 'crown');
  g.restore();
  if (b > 0) for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2 + t * 3, r = 40 + (1 - b) * 30;
    g.fillStyle = '#ffd23f'; starPath(g, 150 + Math.cos(a) * r, 100 + Math.sin(a) * r * 0.6, 5, 2.2, 5); g.fill();
  }
}
function openMissions(from) { G.metaFrom = from; renderMissions(); showOv('missions'); }
function renderMissions() {
  misCheck();
  $('#misList').innerHTML = save.mis.list.map(m => {
    const d = MISSION_POOL[m.i], p = Math.min(m.p, d.n);
    return '<div class="mis' + (m.done ? ' done' : '') + '"><p><span>' + (m.done ? '✅ ' : '') + d.t + '</span><b>🪙' + d.r + '</b></p>' +
      '<div class="abar"><i style="width:' + (100 * p / d.n) + '%"></i></div><small>' + p + ' / ' + d.n + '</small></div>';
  }).join('');
  $('#misBonus').textContent = '3つぜんぶ達成で 🪙100＋🎟️1' + (save.mis.bonus ? '（うけとりずみ！）' : '') + '　ミッションは毎日かわるよ';
  const ts = totalStars(), base = save.road * 10, nxt = base + 10;
  $('#roadBox').innerHTML = '<p>いまの★ <b>' + ts + '</b> こ ／ つぎのごほうび ' + nxt + '★（🪙100' + ((save.road + 1) % 3 === 0 ? '＋🎟️' : '') + '）</p>' +
    '<div class="abar"><i style="width:' + clamp(100 * (ts - base) / 10, 0, 100) + '%"></i></div><p class="fine">ステージごとの最高★の合計。★★★をとり直すとふえるよ</p>';
}
function openSkins(from) { G.metaFrom = from; G.skPrev = null; renderSkins(); showOv('skins'); }
function renderSkins() {
  const grid = $('#skGrid');
  grid.innerHTML = '';
  for (const s of SKINS) {
    const own = save.skins.indexOf(s.k) >= 0, b = document.createElement('button');
    b.className = 'sk' + (save.skin === s.k ? ' on' : '') + (own ? '' : ' lock');
    b.innerHTML = '<i>' + (own ? s.e : '❔') + '</i>' + (own ? s.n : '？？？') + '<small>' + (own ? s.d : 'おたからばこで出るよ') + '</small>';
    if (own) b.addEventListener('click', () => {
      save.skin = s.k; G.skPrev = null; persist();
      antCache.clear(); G.perk = perks(); G.spdMul = G.perk.speed;
      Sound.tap(); renderSkins(); refreshPrices();
      toast(s.e + ' ' + s.n + '：' + s.d);
    });
    grid.appendChild(b);
  }
  $('#skSum').textContent = 'もっているきせかえ ' + save.skins.length + ' / ' + SKINS.length + '　🎟️チケット×' + save.tickets + '　🪙' + save.coins;
  $('#bGacha').textContent = save.tickets > 0 ? '🎁 おたからばこ（🎟️チケット1まい）' : '🎁 おたからばこ（🪙' + PRICE.box + '）';
}
function doGacha() {
  const useT = save.tickets > 0;
  if (!useT && save.coins < PRICE.box) { toast('🪙 コインが足りないよ（' + PRICE.box + 'こ必要）'); Sound.deny(); return; }
  if (useT) save.tickets--; else save.coins -= PRICE.box;
  const rest = SKINS.filter(s => save.skins.indexOf(s.k) < 0);
  if (!rest.length) { save.coins += 150; toast('ぜんぶ持ってる！🪙150 おかえし'); }
  else {
    const s = pick(rest);
    save.skins.push(s.k); G.skPrev = s.k;
    toast('🎉 「' + s.e + s.n + '」をゲット！ ' + s.d + '（タップでつけかえ）', 3200);
  }
  persist(); updateCoins(true); renderSkins();
  Sound.fanfare();
  Fx.burst(innerWidth / 2, innerHeight * 0.35, 60, 380, ['star', 'conf', 'dot']);
}
function drawSkinPrev(cv, t) {
  const S = 120;
  if (cv.width !== Math.round(S * dpr)) { cv.width = cv.height = Math.round(S * dpr); }
  const g = cv.getContext('2d'), bob = -Math.abs(Math.sin(t * 4)) * 4;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
  g.fillStyle = 'rgba(120,60,90,.15)'; ell(g, 60, 112, 34, 5); g.fill();
  g.save(); g.translate(56, 88 + bob);
  drawAntShape(g, 28, 10, 0, Math.floor(t * 8) & 3, G.skPrev || save.skin);
  g.restore();
}

/* ================= UI ================= */
// 上に出るひとことヒント：[何手目から, 何手目まで, 文]。チュートリアル中は出さない
const TIPS = {
  1: [[3, 7, 'とどく色の箱から置いていこう。外側があくと内側に届くよ']],
  2: [[1, 5, '迷ったら長押し！運ばれるキャンディが光るよ']],
  3: [[0, 4, '★★★の目安は上の時計。「はやさ 2x」も使ってみよう']],
  4: [[0, 4, '奥の色が欲しいときは、届かない箱を先に置く「先読み」！']],
  5: [[0, 4, 'おやすみ（z）の箱をためすぎると渋滞するよ']],
  6: [[0, 3, '渋滞しても「⏪」で、まだ解ける所まで一気にもどれるよ']]
};
function updateHUD() {
  G.hudDirty = false;
  if (!G.level) return;
  const pos = posOf(G.levelId), st = starsAt(pos);
  $('#lvNum').textContent = 'Lv.' + pos;
  $('#lvStars').textContent = '★'.repeat(st) + '☆'.repeat(5 - st);
  $('#lvName').textContent = save.cleared[G.levelId] || save.settings.dev ? G.level.name : '？？？（' + G.level.theme + '）';
  $('#leftTxt').textContent = 'のこり ' + G.vleft + ' / ' + G.level.total;
  $('#progBar').style.width = (100 * (1 - G.vleft / G.level.total)) + '%';
  $('#bUndo').disabled = !G.undo.length;
  $('#spdIco').textContent = G.speed + 'x';
}
function updateTimer() {
  const R = G.run, el = $('#timeTxt');
  if (!R || !G.par) return;
  const sec = Math.floor(R.time), key = R.started ? sec : -2;
  if (key === G.timerShown) return;
  G.timerShown = key;
  if (!R.started) { el.innerHTML = '⏱ タップでスタート　<b>★★★</b> ' + G.par[0] + '秒以内'; return; }
  const st = timeStars(R.time, G.par), lim = st === 3 ? G.par[0] : st === 2 ? G.par[1] : 0;
  el.innerHTML = '⏱ ' + sec + '秒　<b class="s' + st + '">' + '★'.repeat(st) + '</b>' + (lim ? ' あと' + Math.max(0, lim - sec) + '秒' : ' ゆっくりでOK');
}
function updateTip() {
  const el = $('#tip'), list = TIPS[posOf(G.levelId)] || [], m = G.moves.length;
  let msg = '';
  if (!Tut.gameBusy()) for (const [a, b, s] of list) if (m >= a && m < b) { msg = s; break; }
  el.textContent = msg; el.classList.toggle('show', !!msg);
}
let toastTimer = 0;
function toast(msg, ms) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2200);
}
function startPlay() { if (G.loading) showOv('load'); else { hideOv(); updateTip(); } }
function doUndo() {
  if (G.loading || (G.overlay && G.overlay !== 'jam') || !G.undo.length) return;
  if (!pay('undo')) return;
  G.rewindTok++;
  G.s = G.undo.pop(); G.moves.pop(); G.queued = null;
  if (G.run) G.run.undos++;
  resetVisual(); hideOv(); Sound.undo(); updateTip();
}
function doRetry() {
  if (G.loading || (G.overlay && G.overlay !== 'jam')) return;
  hideOv(); loadLevel(G.levelId); Sound.undo();
}
function doHint() {
  if (G.overlay || G.pendingWin || G.loading || !G.s) return;
  if (G.hintCol >= 0) { toast('💡 光っている箱がおすすめだよ'); return; }
  const sol = G.level.solution;
  let j = -1;
  if (followsSolution() && G.moves.length < sol.length) j = sol[G.moves.length];
  else {
    const r = solve(G.s, 400, 40000);
    if (r.path && r.path.length) j = r.path[0];
    else if (!r.aborted) {
      toast('この局面からはクリアできないよ。↶で戻そう（コインは使ってないよ）', 2800);
      const b = $('#bUndo'); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
      return;
    } else { toast('読み切れなかったよ。少し戻して別の順番を試そう（コインは使ってないよ）', 2600); return; }
  }
  if (!pay('hint')) return;
  G.hintCol = j;
  if (G.run) G.run.hints++;
  toast('💡 光っている箱がおすすめだよ');
}
function openAlbum(fromTitle) {
  G.fromTitle = fromTitle;
  const grid = $('#albumGrid'), fresh = new Set(save.newArts);
  grid.innerHTML = '';
  for (let pos = 1; pos <= TOTAL; pos++) {
    const id = idAt(pos), btn = document.createElement('button'), cleared = !!save.cleared[id], open = isOpen(id);
    btn.className = 'al' + (open ? '' : ' locked');
    if (open) {
      const cv = document.createElement('canvas');
      drawThumb(cv, getArt(id), 64, !cleared);
      btn.appendChild(cv);
      const sp = document.createElement('span');
      sp.textContent = pos + '. ' + (cleared ? getArt(id).name : '？？？');
      btn.appendChild(sp);
      if (cleared) {
        const b = save.best[id], s = b ? b.s : 1, bs = document.createElement('small');
        bs.className = 'bs'; bs.textContent = '★'.repeat(s) + '☆'.repeat(3 - s);
        btn.appendChild(bs);
      }
      if (fresh.has(id)) { const n = document.createElement('i'); n.className = 'new'; n.textContent = 'NEW'; btn.appendChild(n); }
      btn.addEventListener('click', () => cleared ? openView(id) : (hideOv(), loadLevel(id)));
    } else btn.innerHTML = '<div class="q">🔒</div><span>' + pos + '</span>';
    grid.appendChild(btn);
  }
  const got = gotCount();
  $('#albumSum').textContent = 'あつめた絵：' + got + ' / ' + TOTAL + ' 枚　⭐' + totalStars() + ' / ' + TOTAL * 3;
  $('#albumSumBar').style.width = (100 * got / TOTAL) + '%';
  save.newArts = []; persist(); updateBadge();
  showOv('album');
}
function openView(id) {
  const art = getArt(id), cv = $('#viewCv'), S = Math.round(Math.min(innerWidth * 0.72, 300)), b = save.best[id];
  $('#viewName').textContent = art.name;
  drawThumb(cv, art, S, false);
  $('#viewInfo').textContent = 'Lv.' + posOf(id) + '・' + art.theme + '・' + art.W + '×' + art.H + (b ? '・ベスト ' + b.t + '秒 ' + '★'.repeat(b.s) : '');
  G.viewId = id;
  showOv('view');
}

/* ================= チュートリアル（説明する場所だけを照らし、アリさんの吹き出しで教える） =================
   レッスン：LESSONS に「ステップ」を並べる。ステップの mode
     'next'  … 読んだら「つぎへ」（画面のどこをタップしても進む）
     'tap'   … 光っている箱をタップしたら進む（ほかの場所は押せない）
     'hold'  … 光っている箱を長押ししたら進む
     'until' … until() が true になったら進む
   at：照らす場所（関数 か CSSセレクタ）。delay：表示までの秒数。ready()：表示してよいか
   ov：そのレッスンを出す画面（なし＝ゲーム画面）。lv：ステージが変わったら取り消すレッスン */
function cvRect(x, y, w, h) { const r = canvas.getBoundingClientRect(); return { x: r.left + x, y: r.top + y, w, h }; }
function elRect(sel, pad) {
  const e = $(sel);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const p = pad == null ? 6 : pad;
  return { x: r.left - p, y: r.top - p, w: r.width + p * 2, h: r.height + p * 2 };
}
function joinRect(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}
// ゲーム画面の中で照らす場所
const TR = {
  board: () => G.s ? cvRect(ox - cs - 8, oy - cs - 8, (G.s.W + 2) * cs + 16, (G.s.H + 2) * cs + 16) : null,
  nest: () => cvRect(nestX - nestR * 2.3, nestY - nestR * 1.8, nestR * 4.6, nestR * 3.1),
  tray: () => cvRect(6, trayTop - 2, CW - 12, CH - trayTop - 4),
  col: j => j >= 0 && G.s ? cvRect(trayX(j) - headSize * 0.74, trayHeadY - headSize * 0.62, headSize * 1.48, headSize * 1.3) : null,
  slots: () => cvRect(slotX(0) - slotSize * 0.8, slotY - slotSize * 0.74, slotX(SLOT_COUNT - 1) - slotX(0) + slotSize * 1.6, slotSize * 1.48),
  slot: i => cvRect(slotX(i) - slotSize * 0.72, slotY - slotSize * 0.95, slotSize * 1.44, slotSize * 1.7),
  gold: () => {
    if (!G.s) return null;
    const W = G.s.W;
    for (const i of G.gold) {
      if (G.vgrid[i] < 0) continue;
      const s = Math.max(cs * 3, 46), x = ox + (i % W + 0.5) * cs, y = oy + (Math.floor(i / W) + 0.5) * cs;
      return cvRect(x - s / 2, y - s / 2, s, s);
    }
    return null;
  }
};
// チュートリアルで押してほしい箱の列（想定の解き方の次の1手）
function tutCol() {
  if (!G.s || G.pendingWin) return -1;
  const sol = G.level.solution;
  if (followsSolution() && G.moves.length < sol.length) return sol[G.moves.length];
  const h = headsOf(G.s);
  return h.length ? h[0] : -1;
}
const tcol = () => TR.col(tutCol());
const LESSONS = {
  // ---- ステージの最初に出るレッスン ----
  basic: { lv: 1, steps: () => [
    { t: 'ようこそ、指揮官さん！ぼくらアリさんチームといっしょに、キャンディでできた絵をほどいていこう！' },
    { at: TR.board, t: 'これが今回の絵。1マス1マスがキャンディになっているよ。ぜんぶ巣に運びだしたらクリア！' },
    { at: TR.nest, t: 'ここがぼくらの巣。アリさんが運んだキャンディは、ここにしまわれるよ。' },
    { at: TR.tray, t: '下にならんでいるのが「箱」。箱の色のアリさんが、書いてある数だけキャンディを運ぶよ。選べるのは、それぞれの列のいちばん手前の箱だけ。' },
    { mode: 'tap', col: tutCol, at: tcol, t: '光っている箱をタップしてみて！' },
    { at: TR.board, delay: 1.2, t: '箱と同じ色のアリさんが出てきた！アリさんが運べるのは、外側から通れるキャンディだけだよ。' },
    { at: TR.slots, t: 'タップした箱は「スロット」に入るよ。アリさんが全員出発すると箱は消えて、スロットが空くよ。スロットは全部で5つ。' },
    { mode: 'tap', col: tutCol, at: tcol, t: 'つぎの箱もタップしよう！' },
    { at: TR.board, delay: 1.0, t: '外側のキャンディがなくなると、その内側にも道ができるよ。外から順番にほどいていくのがコツ！' },
    { mode: 'tap', col: tutCol, at: tcol, t: 'もう1つタップ！' },
    { at: () => elRect('.prog', 4), delay: 0.6, t: '上は「のこりの数」と「時計」。時計は最初のタップから動いて、はやくクリアするほど★が多くなるよ。説明しているあいだは止まっているから安心してね。' },
    { at: () => elRect('footer', 2), t: 'こまったら下のボタン。↶もどす と 💡ヒント はコインを使うよ。⟳やりなおし は何回でもむりょう。はやさ で2倍速にもできるよ。' },
    { t: 'あとは自由にやってみて！どの箱から置くか考えるのが、このパズルのおもしろいところ。たのんだよ、指揮官さん！' }
  ] },
  hold: { lv: 1, steps: () => [
    { t: 'こんどは「長押し」をおぼえよう！箱を置く前に、どのキャンディが運ばれるか確かめられるよ。' },
    { mode: 'hold', col: tutCol, at: tcol, t: '光っている箱を、指をはなさずに長押ししてみて。' },
    { mode: 'until', until: () => !G.press && !G.preview, at: TR.board, t: '光ったキャンディが、この箱で運ばれるぶん！番号は運ぶ順番だよ。指をはなすと元にもどるよ。' },
    { at: tcol, t: '長押ししているあいだ、上に「○ / ○ 個を運ぶよ」と出るよ。ぜんぶ運べるか、のこりがスロットで待つことになるかもわかるね。似た色で迷ったら長押し！' },
    { mode: 'tap', col: tutCol, at: tcol, t: 'じゃあ、タップして運ぼう！' },
    { at: () => elRect('#bSet', 4), delay: 0.8, t: 'せってい⚙️で「箱に『届く数／必要数』を表示」をオンにすると、長押ししなくても数が見られるよ。' }
  ] },
  star: { lv: 1, steps: () => [
    { at: () => elRect('.prog', 4), t: 'ここからは★★★をねらってみよう！最初のタップから、最後の箱を置くまでのタイムで★が決まるよ。目安の秒数は時計のとなりに出ているよ。' },
    { at: () => elRect('#bSpeed', 4), t: '「はやさ」で2倍速！アリさんが速くなってスロットも早く空くから、★をとりやすくなるよ。' }
  ] },
  read: { lv: 1, steps: () => [
    { at: TR.tray, t: '奥の色の箱は、外側があくまで運べないよ。でも先にスロットに置いておけば、道があいたしゅんかんに運び出すよ。' },
    { at: TR.slots, t: 'あとでぜんぶ運べたら「ナイス先読み」でボーナス！ただし置きすぎると渋滞するから、スロットの空きに気をつけてね。' },
    { at: () => elRect('#bHint', 4), t: 'どうしても迷ったら💡ヒント。おすすめの箱が光るよ（コインを使うよ）。' }
  ] },
  // ---- はじめて起きたときに出る説明（ゲーム画面） ----
  sleep: { lv: 1, steps: i => [
    { delay: 0.5, at: () => TR.slot(i), t: 'この色のキャンディは、今はどこからも通れないから「z」でおやすみ中。外側があくと自動で運び出すよ。でもスロットを1つ使うから、置きすぎに注意！' }
  ] },
  partial: { lv: 1, steps: i => [
    { delay: 0.5, at: () => TR.slot(i), t: 'この箱は、今とどく分だけ先に運んだよ。のこりは道があくまでスロットで待つの。箱の数字が、のこりの数だよ。' }
  ] },
  slot4: { lv: 1, steps: () => [
    { delay: 0.4, at: TR.slots, t: 'スロットがあと1つ！5つぜんぶうまると「渋滞」でストップしちゃう。今とどく色の箱を置いて、スロットを空けよう。' }
  ] },
  nice: { lv: 1, steps: () => [
    { delay: 0.3, at: TR.slots, t: 'ナイス先読み！届かない箱を先に置いておいて、あとでぜんぶ運べたね。クリアのときにボーナスコインがもらえるよ。' }
  ] },
  fever: { lv: 1, steps: () => [
    { at: TR.board, t: 'フィーバー！テンポよく運ぶと起きるよ。少しのあいだアリさんが速くなって、運んだエサが2倍！（説明中はフィーバーの時間も止まっているよ）' }
  ] },
  gold: { lv: 1, steps: () => [
    { delay: 0.4, at: TR.gold, t: 'ピカピカ光っているのは「金のキャンディ」。運びだすと、クリアのときにコインのボーナスがもらえるよ！' }
  ] },
  // ---- はじめて開いた画面の説明 ----
  jam: { ov: 'jam', steps: () => [
    { delay: 0.6, at: () => elRect('#ov-jam .card', 2), t: '渋滞しちゃった…でもだいじょうぶ！上のボタンで、まだ解ける所まで一気にもどれるよ。「⟳ 最初から」は何回でもむりょう。「盤面を見る」で、どこでつまったか確かめてもいいよ。' }
  ] },
  coins: { ov: 'clear', steps: () => [
    { delay: 1.8, scroll: '#resList', at: () => joinRect(elRect('#resList', 4), elRect('#ov-clear .restot', 4)), t: 'クリアのごほうび！タイムの★、コンボ、フィーバー、もどさずクリア…上手にあそぶほどコインがふえるよ。コインは↶もどす・💡ヒントに使えるよ。' },
    { scroll: '#bClearQueen', at: '#bClearQueen', t: '運んだキャンディは「エサ」としてたまるよ。女王さまにあげると成長して、便利な力がふえるよ！' },
    { scroll: '#bNext', at: '#bNext', t: 'つぎの絵にすすもう！クリアした絵はアルバム📒にたまっていくよ。' }
  ] },
  home: { ov: 'title', steps: () => [
    { delay: 0.5, at: () => elRect('.mrow', 6), t: 'ホームでは👑女王さまの育成、📋毎日かわるミッション、🎀きせかえができるよ。赤い点は、まだ達成していないミッションがあるしるし。' },
    { at: () => elRect('#titleInfo', 6), t: 'ここには、もっているコイン🪙・あつめた★・女王さまのレベル👑が出るよ。' }
  ] },
  queen: { ov: 'colony', steps: () => [
    { delay: 0.4, at: '#qCv', queen: true, t: 'わたくしが女王よ。指揮官さん、いつもありがとう！' },
    { scroll: '#bFeed', at: '#bFeed', queen: true, t: 'ステージで運んだキャンディは、エサとしてたまるの。「ごはんをあげる」で、わたくしが成長するわ。' },
    { scroll: '#qPerks', at: '#qPerks', queen: true, t: 'レベルが上がると、おへやがふえて、「もどすがむりょう」などの特別な力がつくのよ。' }
  ] },
  missions: { ov: 'missions', steps: () => [
    { delay: 0.3, at: '#misList', t: 'ミッションは毎日3つ。ぜんぶ達成すると🪙100と、おたからばこの🎟️チケットがもらえるよ！' },
    { scroll: '#roadBox', at: '#roadBox', t: 'スターロードは★を10こあつめるごとにごほうび。★★★をとり直すと★がふえるよ。' }
  ] },
  skins: { ov: 'skins', steps: () => [
    { delay: 0.3, at: '#skGrid', t: 'きせかえには特別な力があるよ。つけているあいだだけ効果があるから、ステージに合わせてえらんでね。' },
    { scroll: '#bGacha', at: '#bGacha', t: 'おたからばこで、まだ持っていないきせかえが出るよ。チケットがあればチケットを使うよ。' }
  ] }
};
const Tut = {
  q: [], cur: null, st: 'off', el: null, shownAt: -1, key: '', queen: false,
  done(n) { return !!save.tut[n]; },
  has(n) { return (!!this.cur && this.cur.n === n) || this.q.some(l => l.n === n); },
  add(n, arg) {
    const L = LESSONS[n];
    if (!L || G.auto || this.done(n) || this.has(n)) return;
    this.q.push({ n, lv: !!L.lv, ov: L.ov || null, steps: L.steps(arg), i: 0, t0: 0, m0: 0 });
  },
  levelStart(id) {
    this.levelReset();
    const n = { 1: 'basic', 2: 'hold', 3: 'star', 4: 'read' }[posOf(id)];
    if (n && (!save.cleared[id] || save.tut.replay)) this.add(n);
  },
  // ステージが変わったら、そのステージ用の説明は取り消す（見ていない扱いのまま）
  levelReset() {
    this.q = this.q.filter(l => !l.lv);
    if (this.cur && this.cur.lv) { this.cur = null; this.hide(); }
  },
  step() { return this.cur ? this.cur.steps[this.cur.i] : null; },
  mode() { const s = this.step(); return s ? s.mode || 'next' : ''; },
  enter() {
    const c = this.cur, s = this.step();
    c.t0 = G.rt; c.m0 = G.moves.length; this.shownAt = -1; this.key = '';
    if (s && s.scroll) { const e = $(s.scroll); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  },
  next() {
    if (!this.cur) return;
    this.cur.i++;
    if (this.cur.i >= this.cur.steps.length) this.finish(true); else this.enter();
  },
  finish(mark) {
    const c = this.cur;
    this.cur = null; this.hide();
    if (c && mark) { save.tut[c.n] = 1; persist(); }
    if (G.level) updateTip();
  },
  skip() { if (!this.cur) return; Sound.tap(); this.finish(true); },
  // ゲーム画面の説明を出している（時計とフィーバーを止める）
  busy() { return this.st !== 'off' && !!this.cur && !this.cur.ov; },
  // 入力をふさいでいる
  blocking() { return this.st !== 'off'; },
  // ゲーム画面の説明が残っている（上のひとことヒントを出さない）
  gameBusy() { return (!!this.cur && !this.cur.ov) || this.q.some(l => !l.ov); },
  wantCol() {
    const m = this.mode();
    return this.st === 'show' && (m === 'tap' || m === 'hold') ? this.step().col() : -1;
  },
  holdMode() { return this.st === 'show' && this.mode() === 'hold'; },
  tapAny() {
    if (this.st !== 'show' || this.mode() !== 'next' || G.rt - this.shownAt < 0.35) return;
    Sound.tap(); this.next();
  },
  nudge() {
    if (!this.el) return;
    const b = this.el.bub;
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    Sound.deny(); haptic(15);
  },
  hide() { this.st = 'off'; if (this.el) this.el.root.classList.remove('on'); },
  // はじめての場面を見つけたら、説明を予約する
  poll() {
    const ov = G.overlay || null;
    if (!ov && G.s && !G.loading) {
      if (G.fever.t > 0) this.add('fever');
      if (G.gold.size && TR.gold()) this.add('gold');
    }
    if (ov === 'jam') this.add('jam');
    else if (ov === 'clear') this.add('coins');
    else if (ov === 'title' && gotCount() >= 1) this.add('home');
    else if (ov === 'colony') this.add('queen');
    else if (ov === 'missions') this.add('missions');
    else if (ov === 'skins') this.add('skins');
  },
  update(t) {
    if (!this.el) return;
    if (G.auto) { this.q = []; this.cur = null; this.hide(); return; }
    this.poll();
    const ov = G.overlay || null;
    if (this.cur && this.cur.ov !== ov) {
      // メニューの説明は、その画面を出たら取り消し（次に開いたときにまた出る）。ゲームの説明は一時停止
      if (!this.cur.ov) this.q.unshift(this.cur);
      this.cur = null; this.hide();
    }
    if (!this.cur) {
      const k = this.q.findIndex(l => l.ov === ov);
      if (k < 0) { this.hide(); return; }
      this.cur = this.q.splice(k, 1)[0];
      this.enter();
    }
    if (!this.cur.ov && (G.loading || !G.s)) { this.hide(); return; }
    const s = this.step(), m = s.mode || 'next';
    if (m === 'tap' || m === 'hold') {
      if (s.col() < 0 || (m === 'tap' && G.moves.length > this.cur.m0) || (m === 'hold' && G.preview)) { this.next(); return; }
    } else if (m === 'until' && s.until()) { this.next(); return; }
    const wait = G.rt - this.cur.t0 < (s.delay || 0) || (!!s.ready && !s.ready());
    if (wait && this.cur.ov) { this.st = 'off'; this.el.root.classList.remove('on'); return; }
    this.render(s, m, wait, t);
  },
  render(s, m, wait, t) {
    const E = this.el, vw = innerWidth, vh = innerHeight;
    E.root.classList.add('on');
    if (wait) {
      // 表示前の待ち時間：画面はそのまま、入力だけふさぐ
      this.st = 'wait';
      E.hole.style.opacity = '0'; E.bub.classList.remove('show'); E.hand.style.display = 'none';
      this.block(null);
      return;
    }
    this.st = 'show';
    const key = this.cur.n + ':' + this.cur.i, n = this.cur.steps.length;
    if (this.key !== key) {
      this.key = key; this.shownAt = G.rt;
      E.txt.textContent = typeof s.t === 'function' ? s.t() : s.t;
      E.cnt.textContent = n > 1 ? (this.cur.i + 1) + ' / ' + n : '';
      E.next.style.display = m === 'next' ? '' : 'none';
      E.next.textContent = this.cur.i >= n - 1 ? 'OK！' : 'つぎへ ▶';
      E.doing.textContent = m === 'tap' ? '👆 タップしてね' : m === 'hold' ? '✋ 長押ししてね' : '';
      E.bub.classList.remove('shake', 'show'); void E.bub.offsetWidth; E.bub.classList.add('show');
      this.queen = !!s.queen;
      Sound.squeak();
    }
    // 照らす場所
    const r = typeof s.at === 'string' ? elRect(s.at) : s.at ? s.at() : null, H = E.hole;
    H.style.opacity = '1';
    if (r) {
      H.classList.remove('none');
      H.style.left = r.x + 'px'; H.style.top = r.y + 'px'; H.style.width = r.w + 'px'; H.style.height = r.h + 'px';
      H.style.borderRadius = Math.min(22, r.h / 2, r.w / 2) + 'px';
    } else {
      H.classList.add('none');
      H.style.left = vw / 2 + 'px'; H.style.top = vh * 0.45 + 'px'; H.style.width = '0px'; H.style.height = '0px';
    }
    const act = (m === 'tap' || m === 'hold') && !!r;
    this.block(act ? r : null);
    // 指のマーク
    E.hand.style.display = act ? 'block' : 'none';
    if (act) {
      E.hand.classList.toggle('hold', m === 'hold');
      E.hand.style.left = (r.x + r.w / 2 - 12) + 'px'; E.hand.style.top = (r.y + r.h * 0.55) + 'px';
    }
    // 吹き出し：照らした場所の上か下の、広いほうに出す
    const B = E.bub, bw = B.offsetWidth, bh = B.offsetHeight;
    let x = (vw - bw) / 2, y = vh * 0.42 - bh / 2, dir = 'mid';
    if (r) {
      const gap = act ? 56 : 18, below = vh - (r.y + r.h), above = r.y;
      if (below >= bh + gap + 8 && (below >= above || above < bh + 30)) { y = r.y + r.h + gap; dir = 'up'; }
      else if (above >= bh + 30) { y = r.y - bh - 22; dir = 'down'; }
      else y = above > below ? 8 : vh - bh - 8;
      x = r.x + r.w / 2 - bw / 2;
    }
    x = clamp(x, 8, Math.max(8, vw - bw - 8)); y = clamp(y, 8, Math.max(8, vh - bh - 8));
    B.style.left = Math.round(x) + 'px'; B.style.top = Math.round(y) + 'px';
    B.style.setProperty('--ax', clamp((r ? r.x + r.w / 2 : vw / 2) - x, 26, Math.max(26, bw - 26)) + 'px');
    ['up', 'down', 'mid'].forEach(c => B.classList.toggle(c, c === dir));
    drawTutAnt(E.cv, t, this.queen);
  },
  // 入力のふさぎかた：r があれば、その場所だけ押せるように周りの4枚でふさぐ
  block(r) {
    const E = this.el, vw = innerWidth, vh = innerHeight, S = E.side;
    if (!r) { E.all.style.display = 'block'; S.forEach(b => { b.style.display = 'none'; }); return; }
    E.all.style.display = 'none';
    const x1 = Math.max(0, r.x), y1 = Math.max(0, r.y), x2 = Math.min(vw, r.x + r.w), y2 = Math.min(vh, r.y + r.h);
    const set = (b, x, y, w, h) => { b.style.display = 'block'; b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.width = Math.max(0, w) + 'px'; b.style.height = Math.max(0, h) + 'px'; };
    set(S[0], 0, 0, vw, y1); set(S[1], 0, y2, vw, vh - y2); set(S[2], 0, y1, x1, y2 - y1); set(S[3], x2, y1, vw - x2, y2 - y1);
  }
};
(function buildTutUI() {
  const d = document.createElement('div');
  d.id = 'tut';
  d.innerHTML = '<div class="thole none"></div><div class="tblk all"></div><div class="tblk"></div><div class="tblk"></div><div class="tblk"></div><div class="tblk"></div>' +
    '<div class="thand">👆</div>' +
    '<div class="tbub"><canvas class="tcv"></canvas><div class="tbody"><p class="ttxt"></p>' +
    '<div class="tfoot"><span class="tcnt"></span><b class="tdo"></b><span class="tsp"></span><button class="tskip">スキップ</button><button class="tnext">つぎへ ▶</button></div></div></div>';
  document.body.appendChild(d);
  const bl = d.querySelectorAll('.tblk');
  Tut.el = {
    root: d, hole: d.querySelector('.thole'), all: bl[0], side: [bl[1], bl[2], bl[3], bl[4]], hand: d.querySelector('.thand'),
    bub: d.querySelector('.tbub'), cv: d.querySelector('.tcv'), txt: d.querySelector('.ttxt'), cnt: d.querySelector('.tcnt'),
    doing: d.querySelector('.tdo'), next: d.querySelector('.tnext')
  };
  bl[0].addEventListener('click', () => Tut.tapAny());
  for (let k = 1; k < 5; k++) bl[k].addEventListener('pointerdown', () => Tut.nudge());
  Tut.el.bub.addEventListener('click', () => Tut.tapAny());
  d.querySelector('.tskip').addEventListener('click', e => { e.stopPropagation(); Tut.skip(); });
  Tut.el.next.addEventListener('click', e => { e.stopPropagation(); Tut.tapAny(); });
})();
// 吹き出しのアリさん（女王さまの説明では王冠をつける）
function drawTutAnt(cv, t, queen) {
  const S = 56;
  if (cv.width !== Math.round(S * dpr)) { cv.width = cv.height = Math.round(S * dpr); }
  const g = cv.getContext('2d'), u = 14, bob = -Math.abs(Math.sin(t * 5)) * 2.5;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
  g.fillStyle = 'rgba(120,60,90,.15)'; ell(g, 27, 52, 17, 3); g.fill();
  g.save(); g.translate(26, 52 - 0.8 * u + bob); g.rotate(Math.sin(t * 5) * 0.05);
  drawAntShape(g, u, 10, 0, Math.floor(t * 6) & 3, queen ? 'crown' : save.skin);
  g.restore();
}
// チュートリアルをはじめから見る（Lv.1 から）
function tutReplay() {
  save.tut = { replay: 1 }; persist();
  Tut.q = []; Tut.cur = null; Tut.hide();
  G.reveal = null; G.clearTok++;
  hideOv(); loadLevel(idAt(1));
  toast('🎓 Lv.1 から、もう一度教えるね！', 2400);
}
// render.js の drawGuides（箱を光らせるガイド）を、チュートリアル対応版に置きかえる（render.js は変更不要）
drawGuides = function () {
  if (G.hintCol >= 0 && G.s.heads[G.hintCol] >= G.s.cols[G.hintCol].length) G.hintCol = -1;
  const w = Tut.wantCol(), j = w >= 0 ? w : G.hintCol;
  if (j < 0 || G.s.heads[j] >= G.s.cols[j].length) return;
  const x = trayX(j), p = 0.5 + 0.5 * Math.sin(G.rt * 7), S = headSize * (1.18 + 0.08 * p);
  ctx.strokeStyle = 'rgba(255,200,40,' + (0.6 + 0.4 * p) + ')'; ctx.lineWidth = 4;
  roundRect(ctx, x - S / 2, trayHeadY - S * 0.45, S, S * 0.9, S * 0.26); ctx.stroke();
  ctx.fillStyle = '#ffb020'; ctx.font = fnt(900, headSize * 0.34); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('▼', x, trayHeadY - S * 0.45 - 2 - p * 4);
};

/* ================= あそびかた（ページめくり式。各ページに動く絵をつける） ================= */
const HELP_PAGES = [
  { k: 'tap', h: '👆 箱をタップ', t: '下の箱をタップすると、箱と同じ色のアリさんが出てきて、絵のキャンディを巣へ運ぶよ。キャンディをぜんぶ運べばクリア！' },
  { k: 'outer', h: '🧱 外側からほどこう', t: 'アリさんが運べるのは、外側から通れるキャンディだけ。外のキャンディがなくなると、内側にも道ができるよ。' },
  { k: 'hold', h: '✋ 長押しで確認', t: '箱を長押しすると、その箱で運ばれるキャンディが光って、運ぶ順番の番号が出るよ。似た色で迷ったら長押し！' },
  { k: 'slots', h: '💤 スロットは5つ', t: '置いた箱はスロットに入るよ。今とどかない色の箱は「z」でおやすみ。5つぜんぶうまると渋滞でストップ！' },
  { k: 'partial', h: '📦 のこりは待つ', t: '箱の数字が「今とどく数」より多いと、とどく分だけ運んで、のこりはスロットで待つよ。道があいたら続きを運ぶよ。' },
  { k: 'read', h: '🧠 先読みでボーナス', t: '奥の色の箱を先に置いておくと、外があいたしゅんかんに運び出すよ。あとでぜんぶ運べたら「ナイス先読み」！' },
  { k: 'time', h: '⏱️ タイムで★がきまる', t: '最初のタップから最後の箱を置くまでのタイムで★1〜3。「はやさ 2x」も使おう。ゆっくりでもクリアはできるよ。' },
  { k: 'rewind', h: '⏪ 何手でももどせる', t: '渋滞しても、まだ解ける所まで一気にもどれるよ。↶もどす・💡ヒントはコインを使うよ。⟳最初からは何回でもむりょう。' },
  { k: 'fever', h: '🔥 フィーバーと金のキャンディ', t: 'テンポよく運ぶとフィーバー！アリさんが速くなって、エサが2倍。ピカピカの金のキャンディはコインのボーナスだよ。' },
  { k: 'queen', h: '👑 女王さまを育てよう', t: '運んだキャンディはエサになるよ。女王さまにあげると成長して、おへやと特別な力がふえるよ。毎日のミッションもあるよ！' }
];
function openHelp(from) {
  G.helpFrom = from; G.helpPage = 0; G.helpT = G.rt;
  $('#bHelpClose').textContent = from === 'play' ? 'はじめる！' : 'とじる';
  renderHelp(); showOv('help');
}
function renderHelp() {
  const n = HELP_PAGES.length, i = G.helpPage || 0, P = HELP_PAGES[i];
  $('#hTitle').textContent = P.h; $('#hText').textContent = P.t;
  $('#hNum').textContent = (i + 1) + ' / ' + n;
  $('#hDots').innerHTML = HELP_PAGES.map((p, k) => '<i class="' + (k === i ? 'on' : '') + '" data-p="' + k + '"></i>').join('');
  $('#bHPrev').disabled = i === 0;
  $('#bHNext').textContent = i === n - 1 ? 'さいしょへ ↺' : 'つぎ ▶';
}
function helpGo(d) {
  const n = HELP_PAGES.length;
  G.helpPage = ((G.helpPage || 0) + d + n) % n; G.helpT = G.rt;
  Sound.tap(); renderHelp();
}
// ---- あそびかたの絵（300×140） ----
function hEmoji(g, s, x, y, px) { g.font = Math.round(px) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
function hText(g, s, x, y, px, col) {
  g.font = fnt(900, px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = Math.max(3, px * 0.28); g.strokeStyle = '#fff'; g.strokeText(s, x, y);
  g.fillStyle = col || '#5a3d5c'; g.fillText(s, x, y);
}
function hCandy(g, x, y, s, c) { paintCandy(g, x - s / 2, y - s / 2, s, c); }
// (x, y) は足もと
function hAnt(g, x, y, u, c, fr, dir, carry) {
  g.save(); g.translate(x, y - 0.8 * u); g.scale(dir || 1, 1);
  drawAntShape(g, u, c, carry == null ? 0 : 1, fr & 3, null);
  if (carry != null) paintCandy(g, -0.29 * u, -2.32 * u, 1.3 * u, carry);
  g.restore();
}
function hBox(g, x, y, s, c, num, zz) {
  const sh = SHADE[c], w = s, h = s * 0.82, r = s * 0.24;
  g.fillStyle = 'rgba(120,60,90,.16)'; ell(g, x, y + h * 0.55, w * 0.45, s * 0.07); g.fill();
  g.fillStyle = sh.d; roundRect(g, x - w / 2, y - h / 2, w, h, r); g.fill();
  const gr = g.createLinearGradient(0, y - h / 2, 0, y + h * 0.35);
  gr.addColorStop(0, sh.l2); gr.addColorStop(1, HEX[c]);
  g.fillStyle = gr; roundRect(g, x - w / 2, y - h / 2, w, h * 0.88, r); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1.5, s * 0.04);
  roundRect(g, x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, r); g.stroke();
  if (num != null) {
    const fs = s * 0.4;
    g.font = fnt(900, fs); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = Math.max(2.5, fs * 0.2); g.strokeStyle = sh.ol; g.strokeText(String(num), x, y + h * 0.06);
    g.fillStyle = '#fff'; g.fillText(String(num), x, y + h * 0.06);
  }
  if (zz) {
    const zr = Math.max(7, s * 0.17), bob = Math.sin(G.rt * 3) * 2;
    g.fillStyle = '#fff'; ell(g, x + s * 0.45, y - s * 0.45 + bob, zr, zr); g.fill();
    g.fillStyle = '#a08ab0'; g.font = fnt(900, zr * 1.1); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('z', x + s * 0.45, y - s * 0.45 + bob);
  }
}
function hSlot(g, x, y, s, warn) {
  g.fillStyle = '#eefbe6'; roundRect(g, x - s * 0.54, y - s * 0.49, s * 1.08, s * 0.98, s * 0.3); g.fill();
  g.strokeStyle = warn ? 'rgba(255,90,110,.95)' : 'rgba(110,190,95,.7)'; g.lineWidth = 2; g.setLineDash([5, 4]); g.stroke(); g.setLineDash([]);
}
function hNest(g, x, y, r) {
  g.fillStyle = 'rgba(90,50,30,.2)'; ell(g, x, y + 2, r * 1.6, r * 0.3); g.fill();
  g.fillStyle = '#e4a868'; g.beginPath(); g.ellipse(x, y, r * 1.4, r * 0.95, 0, Math.PI, 0); g.closePath(); g.fill();
  g.strokeStyle = '#8a5530'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#3a2219'; ell(g, x, y - r * 0.42, r * 0.55, r * 0.3); g.fill();
}
function hSoil(g, x, y, w, h) {
  g.fillStyle = SOIL; roundRect(g, x, y, w, h, 10); g.fill();
  g.strokeStyle = '#e8c48e'; g.lineWidth = 3; g.stroke();
}
function drawHelp(cv, k, t) {
  const W = 300, H = 140;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  g.lineJoin = 'round'; g.lineCap = 'round';
  switch (k) {
    case 'tap': {
      g.fillStyle = '#f6e2b8'; g.fillRect(0, 114, W, 26);
      hSoil(g, 96, 8, 152, 36);
      const gone = Math.floor((t % 6) / 0.8);
      for (let i = 0; i < 6; i++) if (i >= gone) hCandy(g, 112 + i * 24, 26, 20, 0);
      hNest(g, 266, 114, 17);
      const press = (t % 1.6) < 0.2;
      hBox(g, 44, 88, press ? 36 : 40, 0, Math.max(0, 6 - gone));
      hEmoji(g, '👆', 56, 118 + (press ? -4 : Math.sin(t * 6) * 2), 26);
      for (let a = 0; a < 3; a++) hAnt(g, 84 + ((t * 40 + a * 55) % 160), 114, 9, 0, Math.floor(t * 10 + a), 1, 0);
      break;
    }
    case 'outer': {
      const x0 = 100, y0 = 14, c = 22, ph = t % 5.2, col = [2, 7, 0];
      hSoil(g, x0 - 6, y0 - 6, c * 5 + 12, c * 5 + 12);
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const d = Math.max(Math.abs(x - 2), Math.abs(y - 2)), Td = 1.2 + (2 - d) * 1.2, a = clamp((Td - ph) / 0.3, 0, 1);
        if (a <= 0) continue;
        const s = c * (0.4 + 0.6 * a);
        paintCandy(g, x0 + x * c + (c - s) / 2, y0 + y * c + (c - s) / 2, s, col[d]);
        if (ph > Td - 1.2) { g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5; g.strokeRect(x0 + x * c + 1.5, y0 + y * c + 1.5, c - 3, c - 3); }
      }
      const act = Math.floor(ph / 1.2);
      if (act < 3) {
        const cc = col[2 - act];
        hAnt(g, 50, 122, 12, cc, Math.floor(t * 10), 1, cc);
        hText(g, act === 0 ? 'そとがわから' : 'つぎは内側！', 50, 30, 13);
        hEmoji(g, '➡️', 80, 70, 18);
      } else hText(g, 'ぜんぶ運べた！', 155, 70, 18, '#e46a92');
      hNest(g, 262, 122, 15);
      break;
    }
    case 'hold': {
      const x0 = 24, y0 = 16, c = 26, ph = t % 3.6, cells = [1, 6, 6, 1, 6, 9, 9, 6, 1, 9, 9, 1, 6, 1, 6, 6], order = [0, 3, 8, 11, 13];
      hSoil(g, x0 - 6, y0 - 6, c * 4 + 12, c * 4 + 12);
      cells.forEach((v, i) => paintCandy(g, x0 + (i % 4) * c, y0 + Math.floor(i / 4) * c, c, v));
      const prog = clamp((ph - 0.4) / 0.6, 0, 1), lit = ph > 1.0 && ph < 3.2;
      if (lit) {
        g.fillStyle = 'rgba(70,40,70,.45)'; g.fillRect(x0 - 2, y0 - 2, c * 4 + 4, c * 4 + 4);
        order.forEach((i, n) => {
          const x = x0 + (i % 4) * c, y = y0 + Math.floor(i / 4) * c;
          paintCandy(g, x, y, c, 1);
          g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, c - 2, c - 2);
          hText(g, String(n + 1), x + c / 2, y + c / 2, 13);
        });
        hText(g, '5 / 5 個を運ぶよ', 222, 20, 13, '#e46a92');
      }
      hBox(g, 222, 78, 48, 1, 5);
      if (prog > 0 && ph < 3.2) {
        g.strokeStyle = '#ff8fb3'; g.lineWidth = 4;
        g.beginPath(); g.arc(222, 78, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); g.stroke();
      }
      const fy = ph < 0.4 ? 126 - ph * 30 : ph > 3.2 ? 114 + (ph - 3.2) * 30 : 114;
      hEmoji(g, '👆', 232, fy, 28);
      break;
    }
    case 'slots': {
      const n = Math.min(5, Math.floor(t * 1.1) % 8), full = n >= 5, cols = [0, 7, 3, 9, 2], nums = [4, 6, 3, 5, 2];
      for (let i = 0; i < 5; i++) {
        const x = 50 + i * 50, y = 56;
        hSlot(g, x, y, 40, full && Math.sin(t * 12) > 0);
        if (i < n) hBox(g, x, y, 38, cols[i], nums[i], i === 1 || i === 3);
        else { g.fillStyle = 'rgba(110,170,95,.45)'; g.font = fnt(900, 14); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), x, y); }
      }
      if (full) { hText(g, '渋滞！', 150 + Math.sin(t * 30) * 2, 112, 24, '#ff4d6d'); hEmoji(g, '🐜💦', 226, 112, 20); }
      else hText(g, 'スロットのこり ' + (5 - n), 150, 112, 16);
      break;
    }
    case 'partial': {
      const x0 = 22, y0 = 12, c = 22, ph = t % 5, greens = [2, 9, 22], got = clamp(Math.floor((ph - 0.6) / 0.5) + 1, 0, 3);
      hSoil(g, x0 - 6, y0 - 6, c * 5 + 12, c * 5 + 12);
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const i = y * 5 + x, d = Math.max(Math.abs(x - 2), Math.abs(y - 2)), gi = greens.indexOf(i);
        if (gi >= 0 && gi < got) continue;
        paintCandy(g, x0 + x * c, y0 + y * c, c, i === 12 || gi >= 0 ? 4 : d === 2 ? 7 : 0);
      }
      if (ph > 2.2) {
        g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.strokeRect(x0 + 2 * c + 1, y0 + 2 * c + 1, c - 2, c - 2);
        hText(g, 'のこり1こは待つよ', 210, 114, 14, '#e46a92');
      }
      hText(g, '4こ運びたい箱', 210, 22, 13);
      hSlot(g, 210, 64, 50, false);
      hBox(g, 210, 64, 48, 4, 4 - got);
      break;
    }
    case 'read': {
      const x0 = 18, y0 = 14, c = 22, ph = t % 6, col = [2, 7, 0];
      const rk = Math.round(clamp((ph - 1.6) / 1.0, 0, 1) * 16), bk = Math.round(clamp((ph - 2.8) / 1.0, 0, 1) * 8);
      hSoil(g, x0 - 6, y0 - 6, c * 5 + 12, c * 5 + 12);
      let nr = 0, nb = 0;
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const d = Math.max(Math.abs(x - 2), Math.abs(y - 2));
        if (d === 2 && ++nr <= rk) continue;
        if (d === 1 && ++nb <= bk) continue;
        paintCandy(g, x0 + x * c, y0 + y * c, c, col[d]);
      }
      hSlot(g, 190, 62, 46, false); hSlot(g, 252, 62, 46, false);
      if (ph < 3.9) hBox(g, 190, 62, 44, 7, 8 - bk, ph < 2.8);
      if (ph > 0.9 && ph < 2.7) hBox(g, 252, 62, 44, 0, 16 - rk);
      hText(g, ph < 1.6 ? '先に置いておく' : ph < 2.8 ? '外があいた！' : ph < 3.9 ? '運び出す！' : 'ナイス先読み！', 221, 114, 15, ph >= 3.9 ? '#2e8f55' : '#5a3d5c');
      break;
    }
    case 'time': {
      const ph = t % 4.4, sec = Math.min(18, Math.floor(ph * 6));
      hEmoji(g, '⏱️', 64, 60, 54);
      hText(g, sec + '秒', 64, 116, 18);
      for (let i = 0; i < 3; i++) {
        const a = clamp((ph - 3.0 - i * 0.25) / 0.25, 0, 1), x = 162 + i * 50, r = a > 0 ? 20 * easeOutBack(a) : 20;
        g.fillStyle = a > 0 ? '#ffd23f' : '#e9dde3'; starPath(g, x, 58, r, r * 0.45, 5); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
      }
      hText(g, '★★★ 20秒以内', 212, 112, 14, '#d08a00');
      break;
    }
    case 'rewind': {
      const ph = t % 4.8, cols = [3, 7, 0, 9, 2];
      let n = Math.min(5, Math.floor(ph / 0.3) + 1);
      if (ph > 2.6) n = 5 - Math.min(2, Math.floor((ph - 2.6) / 0.35) + 1);
      for (let i = 0; i < 5; i++) {
        const x = 50 + i * 50;
        hSlot(g, x, 48, 38, n >= 5 && ph < 2.6 && Math.sin(t * 12) > 0);
        if (i < n) hBox(g, x, 48, 36, cols[i], 3 + i, i >= 3);
      }
      if (ph > 1.5 && ph < 2.6) hText(g, '渋滞…', 150, 100, 20, '#ff4d6d');
      else if (ph >= 2.6 && ph < 3.4) hEmoji(g, '⏪', 260 - (ph - 2.6) * 140, 100, 34);
      else if (ph >= 3.4) hText(g, 'ここからなら解ける！', 150, 100, 17, '#2e8f55');
      hText(g, '↶ 🪙20 ・ ⏪ 🪙40 ・ ⟳ むりょう', 150, 128, 12);
      break;
    }
    case 'fever': {
      const hue = (t * 240) % 360;
      g.lineWidth = 5; g.strokeStyle = 'hsl(' + hue + ',95%,62%)'; roundRect(g, 14, 16, 176, 110, 18); g.stroke();
      for (let y = 0; y < 2; y++) for (let x = 0; x < 6; x++) hCandy(g, 47 + x * 22, 42 + y * 22, 20, [0, 1, 2, 3, 7, 9][(x + y * 2) % 6]);
      hText(g, 'FEVER!!', 102, 16, 16, 'hsl(' + ((hue + 180) % 360) + ',90%,55%)');
      hText(g, 'はやい！ エサ×2', 102, 88, 13, '#e46a92');
      for (let a = 0; a < 3; a++) hAnt(g, 26 + ((t * 120 + a * 55) % 150), 122, 8, [0, 7, 2][a], Math.floor(t * 20 + a), 1, [0, 7, 2][a]);
      const p = 0.5 + 0.5 * Math.sin(t * 6);
      hCandy(g, 246, 56, 34, 2);
      g.fillStyle = 'rgba(255,215,64,' + (0.3 + 0.3 * p) + ')'; g.fillRect(229, 39, 34, 34);
      g.fillStyle = '#fff'; starPath(g, 246, 56, 14 * (0.7 + 0.3 * p), 5, 4); g.fill();
      hText(g, '金のキャンディ', 246, 94, 13, '#d08a00');
      hText(g, '🪙ボーナス', 246, 114, 13);
      break;
    }
    case 'queen': {
      const ph = t % 4, fill = clamp(ph / 3, 0, 1), up = ph > 3;
      g.fillStyle = '#f6e2b8'; g.fillRect(0, 118, W, 22);
      g.fillStyle = '#fff'; roundRect(g, 70, 10, 160, 14, 7); g.fill();
      g.fillStyle = '#ff8fb3'; roundRect(g, 70, 10, Math.max(14, 160 * fill), 14, 7); g.fill();
      hText(g, up ? 'Lv.UP!' : 'Lv.3', 40, 17, 13, up ? '#e46a92' : '#5a3d5c');
      if (!up) for (let a = 0; a < 3; a++) {
        const q = (t * 0.9 + a / 3) % 1, x = lerp(20, 150, q), y = 100 - Math.sin(q * Math.PI) * 60;
        hCandy(g, x, y, 14, [0, 2, 10][a]);
      }
      const b = up ? Math.sin((ph - 3) * Math.PI) : 0, bob = -Math.abs(Math.sin(t * 2.2)) * 3;
      g.save(); g.translate(170, 118 - 0.8 * 24 + bob); g.scale(1 + 0.15 * b, 1 - 0.1 * b);
      drawAntShape(g, 24, 10, 0, Math.floor(t * 3) & 3, 'crown');
      g.restore();
      if (up) for (let a = 0; a < 6; a++) {
        const ang = a / 6 * Math.PI * 2 + t * 3;
        g.fillStyle = '#ffd23f'; starPath(g, 175 + Math.cos(ang) * 46, 80 + Math.sin(ang) * 26, 6, 2.6, 5); g.fill();
      }
      hEmoji(g, '🥚', 248, 104, 20); hEmoji(g, '🍬', 276, 104, 20); hEmoji(g, '🧸', 262, 78, 20);
      break;
    }
  }
}

/* ================= 開発モード ================= */
function applyDev() {
  document.body.classList.toggle('dev', !!save.settings.dev);
  $('[data-k="dev"]').checked = !!save.settings.dev;
  if (!save.settings.dev) setAuto(false);
  G.hudDirty = true;
}
function setAuto(on) {
  G.auto = on; G.autoPath = null; G.autoClearT = 0;
  const b = $('#bDevAuto');
  b.classList.toggle('on', on); b.textContent = on ? '■ 自動解答を止める' : '▶ 自動解答';
}
function devGo(id) { if (id < 1 || id > TOTAL || G.loading) return; G.reveal = null; hideOv(); loadLevel(id); }
function devStep(d) { const p = posOf(G.levelId) + d; if (p >= 1 && p <= TOTAL) devGo(idAt(p)); }
function renderDev() {
  const grid = $('#devGrid'), top = grid.scrollTop;
  grid.innerHTML = '';
  let ready = 0;
  for (let pos = 1; pos <= TOTAL; pos++) {
    const id = idAt(pos), art = getArt(id), L = cachedLevel(id), m = L && L.metrics, btn = document.createElement('button');
    if (L) ready++;
    btn.className = 'dv' + (id === G.levelId ? ' cur' : '');
    const cv = document.createElement('canvas');
    drawThumb(cv, art, 72, false);
    btn.appendChild(cv);
    const info = [pos + '. ' + art.name + (save.cleared[id] ? ' ✅' : ''), art.W + '×' + art.H + '（元' + id + '）', L ? '★' + starsAt(pos) + '・箱' + L.cols.reduce((a, c) => a + c.length, 0) + '・★3=' + parTimes(L)[0] + '秒' : '未生成', m && m.naive >= 0 ? '外' + Math.round(m.outer * 100) + '% 工夫' + Math.round(m.mix * 100) + '%' : ''];
    info.forEach((t, i) => { const e = document.createElement(i ? 'span' : 'b'); e.textContent = t; btn.appendChild(e); });
    btn.addEventListener('click', () => devGo(id));
    grid.appendChild(btn);
  }
  grid.scrollTop = top;
  $('#devSum').textContent = '全 ' + TOTAL + ' 面／生成済み ' + ready + '／クリア済み ' + gotCount();
}
function devPregen() {
  const btn = $('#bDevGen');
  if (G.genBusy) { G.genBusy = false; return; }
  G.genBusy = true;
  let id = 1;
  const step = () => {
    while (id <= TOTAL && cachedLevel(id)) id++;
    if (!G.genBusy || id > TOTAL) { G.genBusy = false; btn.textContent = '全ステージ事前生成'; if (G.overlay === 'dev') renderDev(); toast(id > TOTAL ? '✅ 全面生成済み' : '中止しました'); return; }
    btn.textContent = '生成中 元' + id + '…（タップで中止）';
    ensureLevel(id, () => { if (G.overlay === 'dev') renderDev(); setTimeout(step, 20); });
  };
  step();
}
function devTick() {
  if (!G.auto || G.loading || !G.s) return;
  if (G.overlay === 'clear') {
    if (!G.autoClearT) G.autoClearT = G.rt;
    else if (G.rt - G.autoClearT > 2.5) { G.autoClearT = 0; $('#bNext').click(); }
    return;
  }
  G.autoClearT = 0;
  if (G.overlay === 'jam') { setAuto(false); return; }
  if (G.overlay || G.pendingWin || G.rt < G.autoNext || G.vslots.indexOf(null) < 0 || G.s.boxes.length >= SLOT_COUNT) return;
  let j = -1;
  const sol = G.level.solution;
  if (followsSolution() && G.moves.length < sol.length) j = sol[G.moves.length];
  else {
    if (!G.autoPath || G.autoAt !== G.moves.length) { const r = solve(G.s, 800, 80000); G.autoPath = r.path ? r.path.slice() : null; G.autoAt = G.moves.length; }
    if (G.autoPath && G.autoPath.length) j = G.autoPath.shift();
  }
  if (j < 0) { setAuto(false); toast('自動解答：この局面からは解けません'); return; }
  onTapCol(j);
  G.autoAt = G.moves.length; G.autoNext = G.rt + 0.2 / G.speed;
}

/* ================= 入力・ボタン ================= */
function evPos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
canvas.addEventListener('pointerdown', e => {
  if (G.overlay || G.loading || !G.s) return;
  Sound.init();
  const p = evPos(e);
  if (p.y < trayTop) return;
  let j = -1;
  for (let k = 0; k < G.s.cols.length; k++) if (Math.abs(p.x - trayX(k)) <= colW / 2) j = k;
  if (j < 0) return;
  // チュートリアル中は、光っている箱だけ押せる
  if (Tut.blocking()) {
    const w = Tut.wantCol();
    if (w < 0) return;
    if (j !== w) { Tut.nudge(); return; }
  }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 無視 */ }
  const press = { j, id: e.pointerId, x: p.x, y: p.y, previewed: false };
  press.timer = setTimeout(() => { if (G.press === press) { showPreview(j); press.previewed = true; } }, 320);
  G.press = press;
});
canvas.addEventListener('pointermove', e => {
  if (!G.press || e.pointerId !== G.press.id || G.press.previewed) return;
  const p = evPos(e);
  if (Math.hypot(p.x - G.press.x, p.y - G.press.y) > 18) { clearTimeout(G.press.timer); G.press = null; }
});
canvas.addEventListener('pointerup', e => {
  if (!G.press || e.pointerId !== G.press.id) return;
  clearTimeout(G.press.timer);
  const pr = G.press;
  G.press = null;
  if (pr.previewed) G.preview = null;
  else if (Tut.holdMode()) Tut.nudge();
  else onTapCol(pr.j);
});
canvas.addEventListener('pointercancel', () => { if (G.press) clearTimeout(G.press.timer); G.press = null; G.preview = null; });
window.addEventListener('keydown', e => {
  if (Tut.blocking()) return;
  const k = e.key.toLowerCase();
  if (G.overlay) {
    if (k === 'escape') {
      if (['settings', 'album', 'dev', 'view'].includes(G.overlay)) back();
      else if (['colony', 'missions', 'skins'].includes(G.overlay)) closeMeta();
    }
    return;
  }
  if (k >= '1' && k <= '9') { const j = +k - 1; if (G.s && j < G.s.cols.length) { Sound.init(); onTapCol(j); } }
  else if (k === 'z' || k === 'backspace') doUndo();
  else if (k === 'r') doRetry();
  else if (k === 'h') doHint();
  else if (k === 'f') $('#bSpeed').click();
  else if (save.settings.dev && k === '[') devStep(-1);
  else if (save.settings.dev && k === ']') devStep(1);
});
const on = (id, f) => $(id).addEventListener('click', f);
const back = () => { if (G.fromTitle) showOv('title'); else hideOv(); };
// はじめての「あそぶ」は、文字の説明ではなく、遊びながら教えるチュートリアルから始める
on('#bPlay', () => {
  Sound.init();
  if (!save.flags.help) { save.flags.help = 1; persist(); }
  startPlay();
});
on('#bTitleHelp', () => { Sound.init(); openHelp('title'); });
on('#bSetHelp', () => openHelp('settings'));
on('#bHelpClose', () => { if (G.helpFrom === 'title') showOv('title'); else if (G.helpFrom === 'settings') showOv('settings'); else startPlay(); });
on('#bHPrev', () => helpGo(-1));
on('#bHNext', () => helpGo(1));
on('#bHPractice', tutReplay);
on('#hDots', e => { const p = e.target && e.target.dataset ? e.target.dataset.p : null; if (p != null) { G.helpPage = +p; G.helpT = G.rt; Sound.tap(); renderHelp(); } });
(function helpSwipe() {
  const p = $('#hPic');
  let sx = null;
  p.addEventListener('pointerdown', e => { sx = e.clientX; });
  p.addEventListener('pointerup', e => {
    if (sx == null) return;
    const dx = e.clientX - sx;
    sx = null;
    helpGo(Math.abs(dx) > 40 && dx > 0 ? -1 : 1);
  });
})();
on('#bSetTut', tutReplay);
on('#bTitleAlbum', () => openAlbum(true));
on('#bAlbum', () => openAlbum(false));
on('#bAlbumClose', back);
on('#bViewBack', () => openAlbum(G.fromTitle));
on('#bViewPlay', () => { hideOv(); loadLevel(G.viewId); });
on('#bUndo', doUndo);
on('#bRetry', doRetry);
on('#bSpeed', () => { G.speed = G.speed === 1 ? 2 : 1; save.settings.fast = G.speed === 2; persist(); G.hudDirty = true; });
on('#bHint', () => { Sound.init(); doHint(); });
on('#bSet', () => { G.fromTitle = false; showOv('settings'); });
on('#bSetClose', back);
on('#bSetHome', () => { Sound.init(); showOv('title'); });
on('#coinPill', () => { if (!G.overlay) { Sound.init(); showOv('title'); } });
on('#bMQueen', () => { Sound.init(); openColony('title'); });
on('#bMMis', () => { Sound.init(); openMissions('title'); });
on('#bMSkin', () => { Sound.init(); openSkins('title'); });
on('#bClearQueen', () => openColony('clear'));
on('#bFeed', doFeed);
on('#qCv', () => { G.qBounce = 1; Sound.squeak(); $('#qSay').textContent = '👑「' + talkLine('queen') + '」'; });
on('#bQClose', closeMeta);
on('#bMisClose', closeMeta);
on('#bSkClose', closeMeta);
on('#bGacha', () => { Sound.init(); doGacha(); });
on('#bDayOk', () => {
  Sound.init();
  const P = G.dailyP;
  if (P) {
    save.daily = { day: dayKey(), streak: P.st };
    save.coins += P.coins;
    if (P.ticket) save.tickets++;
    persist(); G.dailyP = null;
    Sound.coin(); updateCoins(true);
    Fx.burst(innerWidth / 2, innerHeight * 0.4, 40, 320, ['star', 'dot']);
  }
  showOv('title');
});
on('#bNext', () => {
  if (G.nextBusy) return;
  G.nextBusy = true; $('#bNext').disabled = true;
  const id = G.levelId, nx = nextOf(id);
  if (save.newArts.indexOf(id) >= 0) flyToAlbum(id);
  G.reveal = null; G.clearTok++;
  hideOv();
  if (!nx) openAlbum(false); else loadLevel(nx);
});
on('#bReplay', () => { G.reveal = null; G.clearTok++; updateBadge(); hideOv(); loadLevel(G.levelId); });
on('#bJamUndo', doUndo);
on('#bJamRetry', doRetry);
on('#bJamClose', () => { G.jamDismissed = true; G.rewindTok++; hideOv(); });
on('#bJamRewind', () => {
  const t = G.rewindTo;
  if (t < 0 || t >= G.undo.length) return;
  if (!pay('rewind')) return;
  const n = G.undo.length - t;
  G.rewindTok++;
  G.s = G.undo[t]; G.undo.length = t; G.moves.length = t; G.queued = null;
  if (G.run) G.run.undos++;
  resetVisual(); hideOv(); Sound.undo(); updateTip();
  toast('⏪ ' + n + '手もどしたよ。ここからなら解ける！', 2600);
});
on('#bReset', () => {
  if (!confirm('クリア状況・アルバム・コイン・女王さま・きせかえをすべてリセットしますか？')) return;
  save.level = idAt(1); save.maxLevel = 1; save.cleared = {}; save.newArts = [];
  metaInit(true);
  Tut.q = []; Tut.cur = null; Tut.hide();
  G.perk = perks(); G.spdMul = G.perk.speed; antCache.clear();
  persist(); updateBadge(); updateCoins();
  hideOv(); loadLevel(idAt(1));
});
on('#bDev', () => { G.fromTitle = false; showOv('dev'); renderDev(); });
on('#bTitleDev', () => { G.fromTitle = true; showOv('dev'); renderDev(); });
on('#bDevPrev', () => devStep(-1));
on('#bDevNext', () => devStep(1));
on('#bDevClose', back);
on('#bDevGen', devPregen);
on('#bDevAuto', () => { const v = !G.auto; setAuto(v); if (v) hideOv(); });
on('#bDevClear', () => {
  if (!confirm('生成済みステージのデータを削除しますか？')) return;
  G.genBusy = false;
  const del = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(LV_KEY) === 0) del.push(k); }
  del.forEach(k => localStorage.removeItem(k));
  levelCache.clear(); renderDev(); toast('生成キャッシュを削除しました');
});
document.querySelectorAll('[data-k]').forEach(inp => {
  const k = inp.dataset.k;
  inp.checked = !!save.settings[k];
  inp.addEventListener('change', () => {
    save.settings[k] = inp.checked; persist();
    if (k === 'cb') { buildSprites(); G.boardDirty = true; }
    if (k === 'wash') G.boardDirty = true;
    if (k === 'bgm') { Sound.init(); if (inp.checked) Sound.startBgm(); else Sound.stopBgm(); }
    if (k === 'dev') applyDev();
    G.hudDirty = true;
  });
});
document.querySelectorAll('[data-v]').forEach(inp => {
  const k = inp.dataset.v, lab = $('#' + inp.dataset.l);
  const show = () => { lab.textContent = inp.value; inp.style.setProperty('--p', inp.value + '%'); };
  inp.value = save.settings[k];
  show();
  inp.addEventListener('input', () => { save.settings[k] = +inp.value; show(); Sound.applyVol(); });
  inp.addEventListener('change', () => {
    persist(); Sound.init();
    if (k === 'sfxVol') { Sound.lastPop = 0; Sound.pop(); }
  });
});
let logoTaps = 0, logoT = 0;
$('#mascot').addEventListener('click', () => {
  const now = Date.now();
  logoTaps = now - logoT < 600 ? logoTaps + 1 : 1; logoT = now;
  if (logoTaps >= 5) { logoTaps = 0; save.settings.dev = !save.settings.dev; persist(); applyDev(); toast(save.settings.dev ? '🛠️ 開発モード ON' : '開発モード OFF'); }
});
document.addEventListener('visibilitychange', () => {
  lastT = performance.now();
  if (Sound.ctx) { if (document.hidden) Sound.ctx.suspend(); else Sound.ctx.resume(); }
});
if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(stage); else window.addEventListener('resize', layout);
if (/[?&]dev\b/.test(location.search)) { save.settings.dev = true; persist(); }

/* ================= メインループ ================= */
let lastT = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
  lastT = now;
  G.rt += rdt;
  let dt = rdt * G.speed;
  if (G.slowmo > 0) { G.slowmo -= rdt; dt *= 0.3; }
  try {
    if (G.s && CW > 0) {
      G.time += dt;
      const R = G.run;
      // タイム：最初のタップから全部運び終わる（論理的に）まで。メニューやチュートリアルの説明中は止まる
      if (R && R.started && !R.done && !G.overlay && !G.loading && !Tut.busy()) R.time += rdt;
      if (G.fever.t > 0 && !G.overlay && !Tut.busy()) { G.fever.t -= rdt; if (G.fever.t <= 0) endFever(); }
      updateBoxes(dt); updateAnts(dt); updateParts(dt);
      Sound.walk(G.overlay ? 0 : G.ants.length);
      for (let j = 0; j < G.trayOff.length; j++) { G.trayOff[j] *= Math.exp(-rdt * 16); if (G.trayOff[j] < 0.3) G.trayOff[j] = 0; }
      G.nestBounce = Math.max(0, G.nestBounce - rdt * 5);
      G.slotFlash = Math.max(0, G.slotFlash - rdt);
      G.jamShake = Math.max(0, G.jamShake - rdt);
      if (G.shake) { G.shake.t -= rdt; if (G.shake.t <= 0) G.shake = null; }
      checkEnd(rdt);
      if (G.hudDirty) updateHUD();
      updateTimer();
      draw();
    }
    if (G.reveal && G.overlay === 'clear') drawReveal(rdt);
    if (G.overlay === 'title') drawMascot($('#mascot'), G.rt);
    if (G.overlay === 'load') drawMascot($('#loadCv'), G.rt * 1.6);
    if (G.overlay === 'colony') drawColony($('#qCv'), G.rt);
    if (G.overlay === 'skins') drawSkinPrev($('#skCv'), G.rt);
    if (G.overlay === 'help') drawHelp($('#hCv'), HELP_PAGES[G.helpPage || 0].k, G.rt - (G.helpT || 0));
    // 女王さまをタップ・ごはんをあげたときの「はずみ」を少しずつ戻す
    if (G.qBounce > 0) G.qBounce = Math.max(0, G.qBounce - rdt * 3);
    Fx.update(rdt); Fx.draw();
    Tut.update(G.rt);
    devTick();
  } catch (e) {
    // 毎フレーム同じエラーを出し続けないよう、最初の1回だけ表示する
    if (!G.frameErr) {
      G.frameErr = true;
      console.error(e);
      AF_bootErr('エラー：' + (e && e.message ? e.message : e) + '（ui.js のメインループ）');
    }
  }
  requestAnimationFrame(frame);
}

/* ================= 起動 ================= */
G.speed = save.settings.fast ? 2 : 1;
popText($('#ttl'), 'アントフロー');
updateBadge(); updateCoins(); applyDev(); refreshPrices();
loadLevel(save.level);
if (dailyCheck()) showDaily(); else showOv('title');
layout();
requestAnimationFrame(frame);

AF_LOADED.push('ui.js');