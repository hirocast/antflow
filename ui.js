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
body{background:linear-gradient(180deg,#86d6ff 0%,#c4ecff 40%,#eefbff 60%,#cdeea0 74%,#9fd86e 100%)}
body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;opacity:.9;transform:translateZ(0);
 background:radial-gradient(ellipse 90px 30px at 14% 10%,#fff 60%,transparent 62%),radial-gradient(ellipse 56px 24px at 21% 7%,#fff 60%,transparent 62%),
 radial-gradient(ellipse 110px 34px at 82% 18%,#fff 60%,transparent 62%),radial-gradient(ellipse 66px 26px at 89% 14%,#fff 60%,transparent 62%),
 radial-gradient(ellipse 80px 26px at 50% 32%,rgba(255,255,255,.7) 60%,transparent 62%)}
header{flex:0 0 auto;flex-wrap:wrap;padding:5px 8px 4px;row-gap:4px}
.lv{display:grid!important;grid-template-columns:auto auto;align-items:center;column-gap:7px;row-gap:1px;min-width:0;margin-right:auto;padding:4px 9px;border:3px solid #fff;background:linear-gradient(#fff,#fff2f7);box-shadow:0 4px 0 rgba(90,61,92,.22),0 8px 14px rgba(90,61,92,.12)}
.lv #lvNum{grid-column:1;grid-row:1;font-size:15px;line-height:1.1}
.lv #lvStars{grid-column:1;grid-row:2;font-size:10.5px;line-height:1.1}
.lv #lvName{grid-column:2;grid-row:1;font-size:11px;font-weight:900;color:var(--ink);max-width:108px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.lv #lvTalkSub{grid-column:2;grid-row:2;font-size:9.5px;font-weight:900;color:#c0507a;letter-spacing:-0.02em;white-space:nowrap;text-align:center}
.ib{border:3px solid #fff;background:linear-gradient(#fff,#ffeef5);box-shadow:0 4px 0 rgba(90,61,92,.22)}
.prog{order:10;flex:1 0 100%;flex-direction:row;align-items:center;gap:8px;padding-top:1px}
.bar{flex:1;min-width:44px;height:12px;border:3px solid #fff;background:#ffe9f1;box-shadow:0 3px 0 rgba(90,61,92,.2)}
.bar i{background:repeating-linear-gradient(-45deg,#ffcf4a 0 8px,#ffe07d 8px 16px);box-shadow:inset 0 3px 0 rgba(255,255,255,.45);transition:width .9s linear}
.bar i.s2{background:repeating-linear-gradient(-45deg,#6cd6a8 0 8px,#96e6c4 8px 16px)}
#leftTxt{display:none}
#timeTxt{flex:0 0 auto;font-size:11px;font-weight:800;white-space:nowrap;text-shadow:0 1px 0 #fff}
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
.fb em.price{position:absolute;top:-12px;right:2px;font-style:normal;font-size:9.5px;font-weight:900;padding:1px 5px;border-radius:10px;background:linear-gradient(#fff6c4,#ffd23f);color:#7a4a00;border:2px solid #fff;box-shadow:0 2px 0 #d9a520;text-shadow:none;white-space:nowrap}
#bScan{background:#a66be0;box-shadow:0 4px 0 #7f4ab8}
#bScan.on{background:var(--mint);box-shadow:0 4px 0 var(--mintd)}
#bScan.on em.price{background:linear-gradient(#d4ffe9,#5fcf9f);color:#145a38;box-shadow:0 2px 0 #3fae7f}
.ov{background:rgba(50,30,80,.56);-webkit-backdrop-filter:none;backdrop-filter:none}
.card{border:4px solid #ffb6cd;background:linear-gradient(#fffdf6,#fff3df);box-shadow:0 0 0 3px #fff,0 10px 24px rgba(60,30,70,.28)}
.card h2{display:inline-block;padding:6px 24px;border-radius:16px;background:linear-gradient(#ff9fc0,#ff6f9f);color:#fff;box-shadow:0 4px 0 #d4507c;text-shadow:0 2px 0 rgba(0,0,0,.15);margin:0 0 10px}
.card h3{margin:14px 0 6px;font-size:14.5px;color:#c0507a;padding-bottom:3px;border-bottom:2px dashed #ffd3e2;text-align:left}
#toast{position:fixed;bottom:110px;z-index:50}
body.fever #stage::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;border-radius:22px;box-shadow:inset 0 0 42px rgba(255,160,130,.75);animation:fvg .45s ease-in-out infinite alternate}
@keyframes fvg{from{opacity:.5}to{opacity:1}}
.tinfo{display:flex;justify-content:center;gap:8px;margin:4px 0}
#ov-title .home-h2{display:none}
#ov-title .card p{margin:4px 0;font-size:13px;line-height:1.5}
.upd-bar{background:#fff8fb;border:2px solid #ffd3e2;border-radius:16px;padding:6px 9px;margin:0 0 6px;text-align:left;box-shadow:0 2px 0 #f3d5e0}
.upd-bar.has-new{background:linear-gradient(180deg,#fff3f8,#ffe4ef);border-color:#ff7aa6;box-shadow:0 3px 0 #e46a92}
.upd-top{display:flex;align-items:center;justify-content:space-between;gap:5px;flex-wrap:wrap}
.upd-left{display:flex;align-items:center;gap:4px;flex-wrap:wrap;min-width:0}
.upd-badge{display:inline-flex;align-items:center;gap:2px;font-size:10px;font-weight:900;padding:2px 6px;border-radius:9px;background:#e8f8f0;color:#1f7a4d;border:1.5px solid #9fe0be;white-space:nowrap}
.upd-bar.has-new .upd-badge{background:#ff4d6d;color:#fff;border-color:#fff}
.upd-hist-btn{border:none;background:none;padding:2px 3px;font:800 10.5px var(--rf);color:#c0507a;cursor:pointer;white-space:nowrap}
.upd-btn{position:relative;border:2px solid #fff;border-radius:12px;padding:4px 8px;background:#fff1d6;color:var(--ink);font:900 10.5px var(--rf);box-shadow:0 2px 0 #e2c48c;cursor:pointer;white-space:nowrap;flex:0 0 auto;margin-left:auto}
.upd-btn:active{transform:translateY(2px);box-shadow:none}
.upd-btn:disabled{opacity:.6}
.upd-bar.has-new .upd-btn{background:linear-gradient(180deg,#ff8cb4,#ff5a8a);color:#fff;box-shadow:0 3px 0 #d43f6b}
.upd-notes{margin-top:6px;padding-top:6px;border-top:1.5px dashed #f5b8cd;font-size:11px;line-height:1.5;color:var(--ink)}
.upd-hl{font-weight:900;color:#c03060;margin-bottom:3px;font-size:11.5px}
.upd-ul{margin:0;padding-left:16px}
.upd-ul li{margin:1px 0;font-weight:700}
.upd-sub{font-size:10px;color:#8a6a7a;margin-top:4px;font-weight:700}
.upd-hitem{background:#fff;border:1.5px solid #ffe0ea;border-radius:11px;padding:6px 8px;margin-top:5px}
.upd-hitem b{font-size:11px;color:#c0507a;display:block;margin-bottom:2px}
.upd-ok{border:none;border-radius:9px;padding:2px 8px;background:#ffd8e6;color:#a02854;font:900 10px var(--rf);cursor:pointer;margin-left:6px}
.fb-cats{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:8px 0}
.fb-cat{border:2px solid #ffd3e2;border-radius:12px;padding:7px 6px;background:#fff;color:var(--ink);font:800 11.5px var(--rf);cursor:pointer;box-shadow:0 2px 0 #f2c8d8}
.fb-cat.on{background:linear-gradient(#ff9fbf,#ff6f9e);color:#fff;border-color:#fff;box-shadow:0 2px 0 #d64575}
.fb-ta,.fb-in{width:100%;box-sizing:border-box;border:2px solid #f0c6d6;border-radius:14px;padding:9px 11px;font:700 13px/1.5 var(--rf);color:var(--ink);background:#fff;user-select:text;-webkit-user-select:text;touch-action:auto}
.fb-ta{min-height:78px;resize:vertical}
.fb-in{margin-top:6px}
.fb-cnt{text-align:right;font-size:10.5px;color:#9a7a8a;font-weight:700;margin:2px 2px 4px}
.fb-hist{margin-top:10px;padding-top:8px;border-top:2px dotted #ffd3e2;text-align:left}
.fb-hitem{background:#fff;border:1.5px solid #ffe0ea;border-radius:11px;padding:6px 8px;margin-top:5px;font-size:11px;line-height:1.45}
.fb-hitem b{color:#c0507a;font-size:10.5px;display:block;margin-bottom:2px}
#ov-feedback .card{display:flex;flex-direction:column;overflow:hidden;padding:14px 12px 12px}
@media (max-width:600px){#ov-feedback{padding:0!important;background:#fffdf8}#ov-feedback .card{width:100vw;max-width:100vw;height:100%;max-height:100%;border:none;border-radius:0;box-shadow:none;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px max(4px,calc(env(safe-area-inset-bottom,0px) - 12px))}}
.fb-body{flex:1 1 auto;min-height:0;overflow-y:auto;touch-action:pan-y;padding:0 2px}
.fb-foot{flex:0 0 auto;margin-top:6px;padding-top:6px;border-top:2px dashed #ffd3e2}
.fb-scroll-hint{font-size:10px;font-weight:800;color:#b8406e;margin-bottom:5px;opacity:.85}
.fb-foot .cfrow{margin-top:0}
.fb-foot #bFbSend{flex:2}
.fb-foot #bFbClose{flex:1}
.fb-note-det{margin:7px 0 4px;text-align:left}
.fb-note-det summary{font-size:11px;font-weight:800;color:#8a5a6e;cursor:pointer;padding:5px 8px;background:#fff8fb;border:1.5px solid #ffd8e6;border-radius:10px;list-style:none}
.fb-note-det[open] summary{border-radius:10px 10px 0 0;border-bottom:none}
.fb-note-det[open] .fb-note{margin-top:0;border-radius:0 0 10px 10px}
.fb-imgrow{display:flex;align-items:center;gap:6px;margin-top:7px}
.fb-imgbtn{flex:1;border:2px dashed #f0a8c4;border-radius:12px;padding:8px 7px;background:#fff8fb;color:#b8406e;font:800 11.5px var(--rf);cursor:pointer;text-align:center;line-height:1.3}
.fb-imgbtn.snap{border-color:#74c79a;background:#f2fff8;color:#1b7346}
.fb-imgbtn:active{background:#ffeaf3}
.fb-imgbtn.snap:active{background:#dff9eb}
.fb-bugbox{display:none;margin:6px 0 8px;padding:8px 9px;background:#fff7fa;border:1.5px solid #ffd1e1;border-radius:14px;text-align:left}
.fb-bugbox.on{display:block}
.fb-blbl{font-size:11px;font-weight:900;color:#b83862;margin:0 0 5px}
.fb-blbl+.fb-chips{margin-bottom:8px}
.fb-chips{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}
.fb-chip{border:1.5px solid #f0bfd2;border-radius:10px;padding:6px 5px;background:#fff;color:var(--ink);font:800 10.5px var(--rf);cursor:pointer;text-align:center}
.fb-chip.on{background:linear-gradient(#ff8fb3,#ff5e92);color:#fff;border-color:#ff5e92}
.fb-auto-hint{margin-top:7px;padding:5px 8px;border-radius:9px;background:#eef9ff;border:1px solid #bde3fa;color:#20638a;font-size:10px;font-weight:800;line-height:1.45}
.fb-prev{display:none;align-items:center;gap:8px;margin-top:7px;padding:6px 8px;background:#fff;border:2px solid #ffd3e2;border-radius:12px;text-align:left}
.fb-prev.on{display:flex}
.fb-prev img{width:52px;height:52px;object-fit:cover;border-radius:8px;border:1.5px solid #ffd3e2;flex:0 0 auto}
.fb-prev .meta{flex:1;min-width:0;font-size:11px;font-weight:800;color:var(--ink)}
.fb-del{border:none;border-radius:9px;padding:5px 9px;background:#ffe4ee;color:#c03060;font:900 11px var(--rf);cursor:pointer;flex:0 0 auto}
.fb-note{margin:8px 0 4px;padding:7px 9px;background:#fff8fb;border:1.5px solid #ffd8e6;border-radius:12px;text-align:left;font-size:10.5px;line-height:1.55;color:#7a5a6a;font-weight:700}
.fb-note div+div{margin-top:2px}
.fb-camp{margin:4px 0 8px;padding:8px 10px;background:linear-gradient(135deg,#fff9dc,#ffeaf3);border:2px solid #ffc95e;border-radius:14px;text-align:left;font-size:11px;line-height:1.5;color:#6e4214;box-shadow:0 2px 0 #f2cc7e}
.fb-camp.done{background:#fff8fb;border-color:#ffd8e6;color:#7a5a6a;box-shadow:none}
.fb-camp-hd{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:900;color:#b83862;margin-bottom:3px;flex-wrap:wrap}
.fb-camp-pill{background:linear-gradient(#ff6f9e,#ff4d7e);color:#fff;font-size:10px;font-weight:900;padding:1px 7px;border-radius:999px;white-space:nowrap}
.fb-camp-r{font-weight:900;color:#8a4a00;font-size:11.5px}
.fb-camp-sub{font-size:10.5px;color:#8a5a42;font-weight:700;margin-top:2px}
.fb-thanks{display:none;margin:6px 0 2px;padding:9px 10px;background:linear-gradient(135deg,#ecfff4,#fffbe6);border:2px solid #59c988;border-radius:14px;text-align:center;font-size:12px;font-weight:900;line-height:1.5;color:#1b6d42}
.fb-thanks.on{display:block}
.fb-gift-tag{display:inline-block;margin-left:5px;padding:1px 7px;border-radius:999px;background:linear-gradient(#ffe36e,#ffb830);color:#6e3a00;font-size:10.5px;font-weight:900;vertical-align:1px;box-shadow:0 1px 0 #d98d12}
.hud-fb{flex:0 0 auto;border:2px solid #fff;border-radius:999px;padding:4px 9px;min-height:26px;background:linear-gradient(#fff5f9,#ffd8e8);color:#b83060;font:900 10.5px/1.2 var(--rf);box-shadow:0 2px 0 rgba(90,61,92,.2);cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:3px}
.hud-fb:active{transform:translateY(1px);box-shadow:none}
.hud-fb b{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#ff5c93;color:#fff;font-size:10px;line-height:1}
.quick-fb{position:fixed;top:max(1px,calc(env(safe-area-inset-top,0px) - 34px));right:2px;z-index:25;border:2px solid #fff;border-radius:999px;padding:3px 8px 3px 5px;background:linear-gradient(#fff7fa,#ffdbe9);color:#b83060;font:900 10.5px/1 var(--rf);box-shadow:0 2px 0 rgba(90,61,92,.22),0 3px 8px rgba(90,61,92,.14);cursor:pointer;display:none;align-items:center;gap:4px;white-space:nowrap}
.quick-fb.on{display:inline-flex}
.quick-fb:active,.quick-back:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(90,61,92,.22)}
.quick-fb b{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#ff5c93;color:#fff;font-size:10px;line-height:1}
.quick-fb .qdot{width:7px;height:7px;border-radius:50%;background:#ffb800;border:1.5px solid #fff;display:none;margin-left:-1px}
.quick-fb.gift .qdot,.hud-fb.gift .qdot{display:inline-block}
.hud-fb .qdot{width:6px;height:6px;border-radius:50%;background:#ffb800;border:1px solid #fff;display:none}
.quick-back{position:fixed;top:max(1px,calc(env(safe-area-inset-top,0px) - 34px));left:2px;z-index:25;border:2px solid #fff;border-radius:999px;padding:4px 9px 4px 7px;background:linear-gradient(#fffdf8,#fff1d6);color:var(--ink);font:900 10.5px/1 var(--rf);box-shadow:0 2px 0 rgba(90,61,92,.22),0 3px 8px rgba(90,61,92,.14);cursor:pointer;display:none;align-items:center;gap:3px;white-space:nowrap}
.quick-back.on{display:inline-flex}
@media (max-width:600px){
 #bQClose,#bMisClose,#bBingoClose,#bSkClose,#bHelpClose,#bAlbumClose,#bViewBack,#bDevClose,#bMkClose,#bGalClose,#bgmCloseBtn,#bBgmGalClose,#bStBgmBack,#bBgmBuiltinBack,#bCtClose,#bA2hsClose,#bTrClose,#bInboxClose,#ov-settings .set-foot,#ov-clear .clear-foot{position:sticky;bottom:0;z-index:6;box-shadow:0 4px 0 #e1c48e,0 0 0 4px #fffdf8}
 #ov-settings .set-foot,#ov-clear .clear-foot{background:#fffdf8;box-shadow:0 -6px 12px #fffdf8;padding-top:6px;margin-top:10px}
 #ov-settings .set-foot .big,#ov-clear .clear-foot .big{margin-top:0}
}
.fb-ctx{margin:2px 0 6px;padding:6px 9px;background:#eef9ff;border:1.5px solid #bde3fa;border-radius:11px;text-align:left;font-size:10.5px;font-weight:800;line-height:1.45;color:#1b5b82}
.mk-fb-cta{width:100%;margin-top:8px;padding:9px 10px;border:2px solid #ffc95e;border-radius:15px;background:linear-gradient(135deg,#fff9dc,#ffeaf3);color:#8a3a58;font:900 12.5px/1.3 var(--rf);cursor:pointer;box-shadow:0 3px 0 #eab962;text-align:center}
.mk-fb-cta:active{transform:translateY(2px);box-shadow:0 1px 0 #eab962}
.tinfo span,.tinfo-btn{background:#fff;border-radius:12px;padding:3px 10px;font-weight:900;font-size:13px;box-shadow:0 2px 0 #f0d3df}
.tinfo-btn{border:none;font-family:var(--rf);color:var(--ink);cursor:pointer}
.tinfo-btn:active{transform:translateY(2px);box-shadow:none}
.hub{background:#fff;border:2px solid #ffd3e2;border-radius:18px;padding:10px;margin:8px 0 4px;text-align:left;box-shadow:0 3px 0 #f3d5e0}
.hub-qbtn{width:100%;display:block;background:none;border:none;padding:0;text-align:left;font-family:var(--rf);color:var(--ink);cursor:pointer;border-radius:12px}
.hub-qbtn:active{opacity:.75;transform:scale(.99)}
.hub-q{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:12px;font-weight:900}
.hub-q b{color:var(--pinkd)}
.hub-q .hq-food{background:#fff4c9;border:1.5px solid #ffe08a;border-radius:10px;padding:1px 7px;font-size:11px;color:#8a5a00;white-space:nowrap}
.hub-q .hq-food.ready{background:#ffe0ec;border-color:#ff8fb3;color:#c03060;animation:bump .7s ease infinite alternate}
.hub .abar{margin:5px 0 3px;height:9px}
.hub-sub{font-size:11px;font-weight:700;opacity:.78;margin-bottom:7px}
.hub-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}
.hub-chip{background:#fff8fb;border:1.5px solid #ffe4ee;border-radius:11px;padding:5px 8px;font:800 11px var(--rf);color:var(--ink);display:flex;align-items:center;justify-content:space-between;gap:4px;min-width:0;cursor:pointer;text-align:left}
.hub-chip:active{transform:translateY(1px);background:#ffeef6}
.hub-chip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hub-chip b{color:var(--pinkd);white-space:nowrap;font-size:11px}
.hub-toggle{width:100%;margin-top:7px;padding:6px 10px;border:none;border-radius:12px;background:#fff1d6;color:var(--ink);font:900 12px var(--rf);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 0 #e8cfa0}
.hub-toggle:active{transform:translateY(2px);box-shadow:none}
.hub-arr{font-style:normal;font-size:10px;transition:transform .2s}
.hub.open .hub-arr{transform:rotate(180deg)}
.hub-detail{display:none;margin-top:8px;padding-top:8px;border-top:2px dotted #ffd3e2}
.hub.open .hub-detail{display:block}
.hub-sec{background:#fffaf3;border:1.5px solid #f5dfc0;border-radius:13px;padding:8px 10px;margin-bottom:7px}
.hub-sec:last-child{margin-bottom:0}
.hub-sec-h{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:900;color:#c0507a;margin-bottom:4px}
.hub-go{border:none;border-radius:9px;padding:3px 9px;background:#ff8fb3;color:#fff;font:900 11px var(--rf);cursor:pointer;box-shadow:0 2px 0 var(--pinkd)}
.hub-go:active{transform:translateY(1px);box-shadow:none}
.hub-line{font-size:11px;font-weight:700;line-height:1.55;color:var(--ink)}
.hub-mis{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:11px;font-weight:800;padding:2px 0}
.hub-mis.done{color:#2f8f5b}
.mrow{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}
.mrow button{position:relative;border:3px solid #fff;border-radius:16px;padding:7px 2px;background:linear-gradient(#eef8ff,#cbe7ff);box-shadow:0 4px 0 #8fbde6;font:900 11px var(--rf);color:var(--ink);cursor:pointer}
.mrow button:active{transform:translateY(3px);box-shadow:none}
.mrow button i{display:block;font-style:normal;font-size:22px}
.dot{position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:50%;background:#ff4d6d;border:2px solid #fff;display:none}
.dot.on{display:block;animation:bump .7s ease infinite alternate}
.bg-sum{font-size:11px;font-weight:800;margin:2px 0 6px;color:var(--ink)}
.bg-tabs{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;padding:4px 0 6px}
.bg-tab{position:relative;min-width:0;height:28px;border:2px solid #fff;border-radius:9px;background:#ffeef4;color:var(--ink);font:900 11px var(--rf);cursor:pointer;box-shadow:0 2px 0 #e6bfd0;padding:0}
.bg-tab.on{background:linear-gradient(#ff9fbf,#ff6f9e);color:#fff;box-shadow:0 2px 0 #d64575}
.bg-tab.done{background:linear-gradient(#fff6cc,#ffe074);border-color:#fff}
.bg-tab.on.done{background:linear-gradient(#ffb74d,#ff8f00);color:#fff}
.bg-tab i{position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#ff4d6d;border:1.5px solid #fff}
.bg-head{background:#fff6fa;border:2px solid #ffe0ea;border-radius:14px;padding:6px 10px;margin:4px 0 6px;text-align:left}
.bg-head-t{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:13px;font-weight:900;color:var(--pinkd)}
.bg-head-d{font-size:10px;font-weight:700;opacity:.8;margin-top:1px}
.bg-head-r{font-size:10px;font-weight:800;color:#b87600;margin-top:2px}
.bg-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:4px 0}
.bg-c{position:relative;border:2px solid #ffd8e6;border-radius:10px;background:#fff;padding:4px 2px;min-height:50px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:800 9px/1.15 var(--rf);color:var(--ink);cursor:pointer;box-shadow:0 2px 0 #f2c8d8;overflow:hidden}
.bg-c b{font-size:9px;color:var(--pinkd);display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bg-c span{font-size:8.5px;opacity:.75}
.bg-c.done{background:linear-gradient(#fff7fb,#ffe2ee);border-color:#ff9fbf}
.bg-c.bingo{background:linear-gradient(#fff9db,#ffe58f);border-color:#ffb703;box-shadow:0 2px 0 #e09900}
.bg-c.free{background:linear-gradient(#eafff3,#c7f5dc);border-color:#7ad8a8}
.bg-c.bingo.free{background:linear-gradient(#fff9db,#ffe58f);border-color:#ffb703}
.bg-c.sel{outline:2.5px solid #ff4d6d;outline-offset:-1px}
.bg-c em{position:absolute;top:1px;right:2px;font-style:normal;font-size:9px}
.bg-det{background:#fff;border:2px solid #cfe6ff;border-radius:12px;padding:6px 10px;margin:6px 0;text-align:left;font-size:11px;font-weight:800;min-height:38px}
.bg-det .abar{margin:4px 0 0;height:7px}
#bBingoClaim{margin-top:4px;height:auto;min-height:48px;padding:8px 10px;font-size:15px;line-height:1.25;animation:bump .75s ease infinite alternate}
#ov-clear .card{padding:12px 14px}
#ov-clear .ctitle{font-size:28px;margin:0}
#ov-clear .fine{font-size:11px;margin:0}
#ov-clear p{margin:2px 0}
#clearName{font-size:14px!important}
.csay{font-size:12px!important;font-weight:800;color:#a0507a}
#clearStars span{font-size:32px;margin:0 2px;-webkit-text-stroke:1.5px #fff;text-shadow:0 2px 0 #d08a00}
#clearStars span.off{color:#e2d6dc;text-shadow:0 2px 0 #c9b8c0}
.ctime{font-size:11px!important;font-weight:800}
.res{background:#fff;border-radius:14px;padding:4px 10px;margin:4px 0;border:2px solid #ffe3a0;text-align:left;max-height:74px;overflow:auto}
.res div{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:800;padding:2px 0;border-bottom:1px dashed #f3e2b8;animation:rin .3s both}
.res div:last-child{border:none}
.res div b{color:#d08a00;white-space:nowrap}
@keyframes rin{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
.restot{font-size:22px;font-weight:900;color:#d08a00;line-height:1.2}
.restot small{display:block;font-size:11px;color:var(--ink)}
#ov-clear .chip,#ov-clear .teaser{margin:4px 0;padding:5px 10px}
#ov-clear .cfrow{margin-top:6px}
#ov-clear .big{padding:9px 10px;font-size:14px;margin-top:6px}
.restalk{display:none;background:#fff7fb;border:2px solid #ffd3e2;border-radius:14px;padding:6px 10px;margin:5px 0;text-align:left;font-size:11px;font-weight:800;color:var(--ink)}
.restalk.on{display:block}
.restalk-h{display:flex;justify-content:space-between;align-items:center;gap:6px;color:#c0507a;font-weight:900;margin-bottom:4px}
.restalk-sub{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:10.5px;font-weight:900;color:#9a5072;margin:5px 0 3px;padding-top:4px;border-top:1.5px dashed #ffd3e2}
.restalk-list{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px}
.resvote{display:none;background:#fff7fb;border:2px solid #ffd3e2;border-radius:14px;padding:6px 10px;margin:5px 0;text-align:center;font-size:11px;font-weight:800;color:var(--ink)}
.resvote.on{display:block}
.resvote-btns{display:flex;justify-content:center;gap:6px;margin-top:4px}
.resvote-btn{border:2px solid #fff;border-radius:11px;padding:4px 10px;background:#fff;box-shadow:0 2px 0 #e6bfd0;font:900 11px var(--rf);color:var(--ink);cursor:pointer}
.resvote-btn.like.on{background:#ff6f9f;color:#fff;box-shadow:0 2px 0 #d4507c}
.resvote-btn.up.on{background:#4ec98f;color:#fff;box-shadow:0 2px 0 #2e9e69}
.resvote-btn.dn.on{background:#b8a0ad;color:#fff;box-shadow:0 2px 0 #8d7582}
.restalk-chip{display:inline-flex;align-items:center;gap:4px;background:#fff;border:1.5px solid #ffd3e2;border-radius:10px;padding:2px 6px 2px 7px;font-size:10px;font-weight:800;color:var(--ink)}
.restalk-like{border:none;background:#ffeef4;color:#d65b88;border-radius:8px;padding:1px 5px;font:900 10px var(--rf);cursor:pointer;line-height:1.2}
.restalk-like.on{background:#ff6f9e;color:#fff}
.restalk-bg{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:5px;padding-top:4px;border-top:1.5px dashed #ffd3e2;font-size:11px}
.restalk-bg b{color:#d08a00}
.restalk-bg .hit{color:#e46a92;font-weight:900}
.restalk-btn{border:none;border-radius:9px;padding:3px 9px;background:linear-gradient(#ff9fc0,#ff6f9f);color:#fff;font:900 10px var(--rf);cursor:pointer;box-shadow:0 2px 0 #d4507c}
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
.pk b{display:inline-block;min-width:54px;color:var(--pinkd)}
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
.cfdesc{background:#fff;border-radius:14px;padding:10px 12px;border:2px solid #ffd3e2;font-size:13px;font-weight:800;line-height:1.5;text-align:left;margin:8px 0}
.cfcost{background:#fffbe6;border-radius:12px;padding:8px 12px;border:2px solid #ffe39a;font-size:13px;font-weight:900;color:#8a5a00;margin:8px 0}
.cfrow{display:flex;gap:8px;margin-top:12px}
.cfrow .big{flex:1;margin:0}
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
#tut .thole{position:fixed;left:50%;top:45%;width:0;height:0;border-radius:18px;pointer-events:none;box-shadow:0 0 0 110vmax rgba(40,20,70,.58);transition:left .25s,top .25s,width .25s,height .25s,opacity .2s}
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

/* ================= 絵を大きく見せるための画面の調整 =================
   ・画面の高さが低いときは、ヘッダーとフッターを低くする
   ・画面幅が700px以上なら、アプリの幅を最大1400pxまで広げる（横長なら絵を左・操作を右にならべる）
   ・body.wide（render.js の layout が付ける）のときは、下のボタンを右の操作エリアの下に寄せる */
(function injectLayoutStyle() {
  const st = document.createElement('style');
  st.textContent = `
#app{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
@media (min-width:700px){#app{max-width:min(1400px,100vw)}}
@media (max-height:820px){
 header{flex-basis:54px}
 .lv{padding:2px 9px;min-width:78px}
 .lv b{font-size:15px}
 .lv .st{font-size:10px}
 footer{flex-basis:54px;padding-bottom:2px}
 .fb{height:48px;border-radius:18px}
 .fb span{font-size:18px}
 .fb small{font-size:10px}
}
@media (max-height:480px){
 header{flex-basis:46px;flex-wrap:nowrap;padding:0 8px}
 .lv{flex-direction:row;align-items:baseline;gap:6px;margin-right:0}
 .prog{order:0;flex:1;flex-direction:column;align-items:stretch;gap:3px;padding-top:0}
 .lv .st,#leftTxt{display:none}
 .ib{width:34px;height:34px;font-size:16px;border-radius:12px}
 .coin{height:32px;font-size:13px}
 footer{flex-basis:46px;padding-bottom:2px}
 .fb{height:40px;flex-direction:row;gap:4px}
 .fb span{font-size:16px}
}
@media (max-width:420px){
 header{gap:4px;padding:4px 6px 3px}
 .lv{padding:4px 8px;column-gap:6px}
 .lv #lvNum{font-size:14px}
 .lv #lvName{max-width:90px}
 body:not(.dev) .lv #lvName{max-width:126px}
 .ib{width:35px;height:35px;font-size:16px;border-radius:12px}
 .coin{height:34px;padding:0 8px 0 5px;font-size:13px}
 .coin i{font-size:15px}
 .fb small{font-size:9.5px}
}
body.wide footer{align-self:flex-end;width:var(--pw);max-width:100%;padding-left:6px}
body.wide .fb{max-width:none}
`;
  document.head.appendChild(st);
})();

/* ================= 画面の部品を追加（index.html は変更不要） ================= */
const TALK_LIKE_KEY = 'antflow-talk-likes-v1';
const TALK_LIKE_API = 'https://antflow.hiroshi-artcast.workers.dev/like-talk';
function loadTalkLikes() {
  try { return new Set(JSON.parse(localStorage.getItem(TALK_LIKE_KEY) || '[]')); } catch (e) { return new Set(); }
}
function toggleTalkLike(text) {
  const s = loadTalkLikes();
  let liked = false;
  if (s.has(text)) {
    s.delete(text);
    liked = false;
  } else {
    s.add(text);
    liked = true;
  }
  try { localStorage.setItem(TALK_LIKE_KEY, JSON.stringify([...s].slice(-500))); } catch (e) {}
  return liked;
}
function handleTalkLikeClick(e) {
  const lb = e.target.closest('.restalk-like');
  if (!lb || !lb.dataset.talk) return false;
  Sound.tap();
  const t = lb.dataset.talk;
  const liked = toggleTalkLike(t);
  lb.classList.toggle('on', liked);
  lb.textContent = liked ? '♥ いいね' : '♡';
  toast(liked ? '♥ セリフにいいね！したよ' : 'いいねを取り消したよ');
  fetch(TALK_LIKE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ talk: t, delta: liked ? 1 : -1 })
  }).catch(() => {});
  return true;
}
(function buildMetaUI() {
  $('header').insertBefore((() => { const d = document.createElement('div'); d.className = 'coin'; d.id = 'coinPill'; d.innerHTML = '<i>🪙</i><b id="coinTxt">0</b>'; return d; })(), $('#bAlbum'));
  $('header').insertBefore((() => { const b = document.createElement('button'); b.className = 'ib'; b.id = 'bHome'; b.setAttribute('aria-label', 'ホーム'); b.textContent = '🏠'; return b; })(), $('#bAlbum'));
  const tt = document.createElement('span'); tt.id = 'timeTxt'; $('.prog').appendChild(tt);
  const hfb = document.createElement('button'); hfb.type = 'button'; hfb.className = 'hud-fb'; hfb.id = 'bHudFb'; hfb.setAttribute('aria-label', '要望・不具合報告'); hfb.innerHTML = '<b>!</b>報告<i class="qdot"></i>'; $('.prog').appendChild(hfb);
  const lts = document.createElement('small'); lts.id = 'lvTalkSub'; $('.lv').appendChild(lts);
  document.body.appendChild($('#toast'));
  $('#bUndo').insertAdjacentHTML('beforeend', '<em class="price" id="pUndo"></em>');
  $('#bHint').insertAdjacentHTML('beforeend', '<em class="price" id="pHint"></em>');
  $('footer').insertAdjacentHTML('beforeend', '<button class="fb" id="bScan"><span>🔍</span><small>全はこび</small><em class="price" id="pScan"></em></button>');
  $('#ov-title .card').insertAdjacentHTML('afterbegin', '<div class="upd-bar" id="homeUpdateBox"></div><h2 class="home-h2">🏠 ホーム</h2>');
  const setBtn = $('#bSet');
  if (setBtn && !$('#setUpdDot')) setBtn.insertAdjacentHTML('beforeend', '<em class="dot" id="setUpdDot"></em>');
  $('#ttl').insertAdjacentHTML('afterend', '<div class="tinfo" id="titleInfo"></div><div class="hub" id="homeHub"></div>');
  $('#titleInfo').addEventListener('click', e => {
    const t = e.target.closest('button[data-hub]');
    if (!t) return;
    Sound.tap();
    if (t.dataset.hub === 'queen') openColony('title');
    else if (t.dataset.hub === 'mis') openMissions('title');
    else if (t.dataset.hub === 'bingo') openBingo('title');
  });
  $('#homeHub').addEventListener('click', e => {
    const t = e.target.closest('button[data-hub]');
    if (!t) return;
    Sound.tap();
    const act = t.dataset.hub;
    if (act === 'toggle') {
      const hub = $('#homeHub');
      hub.classList.toggle('open');
      const lbl = t.querySelector('span');
      if (lbl) lbl.textContent = hub.classList.contains('open') ? '📊 くわしい情報をとじる' : '📊 コロニー・進行状況をもっと見る';
    } else if (act === 'queen') openColony('title');
    else if (act === 'mis') openMissions('title');
    else if (act === 'album') openAlbum(true);
    else if (act === 'skin') openSkins('title');
    else if (act === 'bingo') openBingo('title');
  });
  $('#bPlay').insertAdjacentHTML('afterend', '<div class="mrow"><button id="bMQueen"><i>👑</i>女王さま<em class="dot" id="queenDot"></em></button><button id="bMMis"><i>📋</i>ミッション<em class="dot" id="misDot"></em></button><button id="bMBingo"><i>🎯</i>ビンゴ<em class="dot" id="bingoDot"></em></button><button id="bMSkin"><i>🎀</i>きせかえ</button></div>');
  if ($('#bTitleHelp') && $('#bTitleAlbum')) {
    const tr = document.createElement('div'); tr.className = 'cfrow'; tr.style.marginTop = '10px';
    $('#bTitleHelp').parentNode.insertBefore(tr, $('#bTitleHelp'));
    tr.appendChild($('#bTitleHelp')); tr.appendChild($('#bTitleAlbum'));
  }
  const tf = $('#ov-title .fine');
  if (tf) tf.textContent = '★はクリアタイムで決まるよ・ゆっくりでもクリアできる・何手でも戻せる';
  $('#clearName').insertAdjacentHTML('afterend', '<p class="csay" id="clearSay"></p>');
  $('#clearStars').insertAdjacentHTML('afterend', '<p class="ctime" id="clearTime"></p><div class="res" id="resList"></div><div class="restot">🪙 +<b id="resTotal">0</b><small id="resFood"></small></div><div class="restalk" id="resTalkBox"></div><div class="resvote" id="resCustomVote"></div>');
  $('#resCustomVote').addEventListener('click', async e => {
    const btn = e.target.closest('[data-cv]');
    if (!btn || !G.level || !G.level.custom || !G.level.customHash) return;
    Sound.tap();
    const h = G.level.customHash, act = btn.dataset.cv;
    if (act === 'like' && window.AF_toggleStageLike) {
      const r = await window.AF_toggleStageLike(h);
      btn.classList.toggle('on', r.on);
      btn.textContent = r.on ? '♥ いいね済み' : '♡ いいね！';
      toast(r.on ? '❤️ 作者にいいねを送ったよ！' : 'いいねを取り消しました');
    } else if ((act === 'up' || act === 'down') && window.AF_sendStageVote) {
      const r = await window.AF_sendStageVote(h, act);
      if (!r || r.already) { toast('すでに評価済みだよ！'); return; }
      $('#resCustomVote').querySelectorAll('[data-cv="up"],[data-cv="down"]').forEach(x => {
        x.classList.toggle('on', x.dataset.cv === r.vote);
        x.disabled = true;
      });
      toast('評価ありがとう！作者に届くよ✨');
    }
  });
  $('#resTalkBox').addEventListener('click', e => {
    if (e.target.closest('[data-bingo-go]')) { Sound.tap(); openBingo('clear'); return; }
    handleTalkLikeClick(e);
  });
  $('#viewInfo').insertAdjacentHTML('afterend', '<div class="restalk" id="viewTalkBox" style="max-height:26vh;overflow:auto"></div>');
  $('#viewTalkBox').addEventListener('click', handleTalkLikeClick);
  const cr = document.createElement('div'); cr.className = 'cfrow clear-foot';
  $('#bNext').parentNode.insertBefore(cr, $('#bNext'));
  cr.appendChild($('#bNext')); cr.appendChild($('#bReplay'));
  cr.insertAdjacentHTML('afterend', '<button class="big mint" id="bClearQueen">👑 女王さまにエサをあげる</button><div class="cfrow"><button class="big sec" id="bClearShare">📣 シェアする</button><button class="big sec" id="bClearHome">🏠 ホームへ</button></div><button class="big mint" id="bClearA2hs" style="display:none">📲 ホーム画面に追加して広く遊ぶ</button>');
  if ($('#bSetClose')) {
    const sf = document.createElement('div'); sf.className = 'cfrow set-foot';
    $('#bSetClose').parentNode.insertBefore(sf, $('#bSetClose'));
    const hb = document.createElement('button'); hb.className = 'big sec'; hb.id = 'bSetHome'; hb.textContent = '🏠 ホームへ';
    sf.appendChild(hb); sf.appendChild($('#bSetClose'));
  }
  const setSfxRow = $('#ov-settings input[data-k="sfx"]')?.closest('.row');
  if (setSfxRow) setSfxRow.insertAdjacentHTML('beforebegin', '<h3>🔊 サウンド・振動</h3>');
  const setTalkRow = $('#ov-settings input[data-k="talk"]')?.closest('.row');
  if (setTalkRow) setTalkRow.insertAdjacentHTML('beforebegin', '<h3>🎨 表示・サポート</h3>');
  const setDevRow = $('#ov-settings input[data-k="dev"]')?.closest('.row');
  if (setDevRow) setDevRow.insertAdjacentHTML('beforebegin', '<h3>⚙️ その他・データ</h3>');
  $('#bSetHelp').insertAdjacentHTML('beforebegin', '<button class="big sec" id="bSetTut">🎓 チュートリアルをもう一度</button><button class="big sec" id="bSetFeedback">💬 要望・不具合を送る</button><button class="big sec" id="bSetA2hs">📲 ホーム画面に追加（アプリ化）</button>');
  $('#bJamClose').insertAdjacentHTML('afterend', '<button class="link" id="bJamHome" style="display:block;margin:10px auto 0">🏠 ホームへもどる</button>');
  $('#bAlbumClose').insertAdjacentHTML('afterend', '<button class="link" id="bAlbumHome" style="display:none;margin:10px auto 0">🏠 ホームへもどる</button>');
  const titleFine = $('#ov-title .fine');
  if (titleFine) titleFine.insertAdjacentHTML('beforebegin', '<button class="big sec" id="bTitleFeedback" style="margin-top:8px">💬 要望・不具合を送る</button><button class="big mint" id="bTitleA2hs" style="display:none;margin-top:8px">📲 ホーム画面に追加して広く遊ぶ</button>');
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
      '<p class="fine" id="qFood"></p><div class="feedrow"><button class="big" id="bFeed">🍬 ごはんをあげる</button><button class="big sec" id="bFeedAll">ぜんぶ</button></div>' +
      '<h3>コロニーのおへや</h3><div class="rooms" id="qRooms"></div>' +
      '<h3>女王さまの力</h3><div class="perks" id="qPerks"></div>' +
      '<button class="big sec" id="bQClose">とじる</button></div></div>' +
    '<div class="ov" id="ov-missions"><div class="card">' +
      '<h2>📋 きょうのミッション</h2><div id="misList"></div><p class="fine" id="misBonus"></p>' +
      '<h3>⭐ スターロード</h3><div id="roadBox"></div>' +
      '<button class="big sec" id="bMisClose">とじる</button></div></div>' +
    '<div class="ov" id="ov-bingo"><div class="card">' +
      '<h2>🎯 セリフビンゴ</h2><p class="bg-sum" id="bgSum"></p><div class="bg-tabs" id="bgTabs"></div>' +
      '<div class="bg-head" id="bgHead"></div><div class="bg-grid" id="bgGrid"></div>' +
      '<div class="bg-det" id="bgDet"></div><button class="big mint" id="bBingoClaim" style="display:none"></button>' +
      '<button class="big sec" id="bBingoClose">とじる</button></div></div>' +
    '<div class="ov" id="ov-skins"><div class="card">' +
      '<h2>🎀 きせかえ</h2><canvas id="skCv"></canvas><p class="fine" id="skSum"></p><div class="skgrid" id="skGrid"></div>' +
      '<button class="big" id="bGacha"></button><button class="big sec" id="bSkClose">とじる</button></div></div>' +
    '<div class="ov" id="ov-daily"><div class="card">' +
      '<h2>🎁 ログインボーナス</h2><p id="dayMsg"></p><div class="dayrow" id="dayRow"></div>' +
      '<button class="big pulse" id="bDayOk">うけとる！</button></div></div>' +
    '<div class="ov" id="ov-confirm"><div class="card">' +
      '<h2 id="cfTitle"></h2><p class="cfdesc" id="cfDesc"></p><div class="cfcost" id="cfCost"></div>' +
      '<div class="cfrow"><button class="big sec" id="bCfCancel">やめる</button><button class="big mint" id="bCfOk">つかう！</button></div></div></div>');
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
const META_DEF = { coins: 150, food: 0, qlv: 1, qexp: 0, tickets: 0, hintT: 0, scanT: 0, road: 0, best: {}, skins: ['none'], skin: 'none', daily: { day: '', streak: 0 }, mis: { day: '', list: [], bonus: 0 }, tut: {}, seenTalk: [], bingo: { card: 0, claimed: {} } };
let seenTalkSet = new Set();
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
  save.hintT = Math.max(0, Math.floor(save.hintT) || 0);
  save.scanT = Math.max(0, Math.floor(save.scanT) || 0);
  for (const k in save.best) if (!(+k >= 1 && +k <= TOTAL) || !save.best[k] || typeof save.best[k].t !== 'number') delete save.best[k];
  if (!Array.isArray(save.mis.list)) save.mis = JSON.parse(JSON.stringify(META_DEF.mis));
  if (!Array.isArray(save.seenTalk)) save.seenTalk = [];
  if (!save.bingo || typeof save.bingo !== 'object') save.bingo = { card: 0, claimed: {} };
  if (!save.bingo.claimed || typeof save.bingo.claimed !== 'object') save.bingo.claimed = {};
  save.bingo.card = clamp(Math.floor(save.bingo.card) || 0, 0, BINGO_CARDS.length - 1);
  seenTalkSet = new Set(save.seenTalk);
  persist();
}
metaInit(false);
G.waitIds = new Set();
G.perk = perks(); G.spdMul = G.perk.speed;

/* ================= セリフビンゴ：集計・判定・UI ================= */
const BINGO_IDX = (() => {
  const colorSet = new Set();
  for (const t of TALK_COLOR) for (const cn of COLOR_NAME) colorSet.add(t.replace('{c}', cn));
  const themeSets = {};
  for (const k in TALK_THEME) themeSets[k] = new Set(TALK_THEME[k]);
  for (const a of ARTS) {
    const S = TALK_STAGE[a.n];
    if (!S || !themeSets[a.t]) continue;
    for (const grp of ['hi', 'p', 'c', 'j', 'q']) for (const s of S[grp]) themeSets[a.t].add(s);
  }
  const stageAll = {}, stageC = {}, stageQ = {}, stageJ = {};
  const allC = new Set(), allQ = new Set(), allJ = new Set();
  for (const k in TALK_STAGE) {
    const S = TALK_STAGE[k];
    stageAll[k] = new Set([...S.hi, ...S.p, ...S.c, ...S.j, ...S.q]);
    stageC[k] = new Set(S.c);
    stageQ[k] = new Set(S.q);
    stageJ[k] = new Set(S.j);
    S.c.forEach(s => allC.add(s));
    S.q.forEach(s => allQ.add(s));
    S.j.forEach(s => allJ.add(s));
  }
  const kindSets = {};
  for (const k in TALK) kindSets[k] = new Set(TALK[k]);
  const allTalk = new Set([...colorSet]);
  Object.values(themeSets).forEach(st => st.forEach(s => allTalk.add(s)));
  Object.values(stageAll).forEach(st => st.forEach(s => allTalk.add(s)));
  Object.values(kindSets).forEach(st => st.forEach(s => allTalk.add(s)));
  return { colorSet, themeSets, stageAll, stageC, stageQ, stageJ, allC, allQ, allJ, kindSets, totalTalk: allTalk.size };
})();
const KIND_LABEL = {
  go: 'しゅつどう', pick: 'ひろった', lift: 'もちあげ', carry: 'はこび中', home: 'とうちゃく',
  combo: 'コンボ', fever: 'フィーバー', gold: '金キャンディ', clear: 'クリア', star3: '★3クリア', jam: '渋滞', queen: '女王さま'
};
function countSetSeen(set) {
  if (!set) return 0;
  let n = 0;
  for (const s of set) if (seenTalkSet.has(s)) n++;
  return n;
}
function bingoCellInfo(cell) {
  const tp = cell[0];
  if (tp === 'F') return { label: 'FREE', sub: '🐜', detail: 'ボーナスFREEマス！最初から達成ずみだよ', cur: 1, max: 1, done: true, free: true };
  if (tp === 'T') {
    const max = cell[1], cur = Math.min(seenTalkSet.size, max);
    return { label: 'セリフ計', sub: max + '種', detail: '表示されたセリフを合計 ' + max + '種類 見る（いま ' + seenTalkSet.size + ' / ' + max + '）', cur, max, done: seenTalkSet.size >= max };
  }
  if (tp === 'C') {
    const max = cell[1], raw = countSetSeen(BINGO_IDX.colorSet), cur = Math.min(raw, max);
    return { label: '色セリフ', sub: max + '種', detail: '色名入りのセリフを ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'S') {
    const k = cell[1], max = cell[2], raw = countSetSeen(BINGO_IDX.stageAll[k]), cur = Math.min(raw, max);
    return { label: k, sub: cur + '/' + max, detail: '「' + k + '」の専用セリフを ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'Sc') {
    const k = cell[1], max = cell[2], raw = countSetSeen(BINGO_IDX.stageC[k]), cur = Math.min(raw, max);
    return { label: k + '🎉', sub: cur + '/' + max, detail: '「' + k + '」のクリア時セリフを ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'Sq') {
    const k = cell[1], max = cell[2], raw = countSetSeen(BINGO_IDX.stageQ[k]), cur = Math.min(raw, max);
    return { label: k + '👑', sub: cur + '/' + max, detail: '「' + k + '」選択中・クリア後の女王さまセリフを ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'Sj') {
    const k = cell[1], max = cell[2], raw = countSetSeen(BINGO_IDX.stageJ[k]), cur = Math.min(raw, max);
    return { label: k + '💦', sub: cur + '/' + max, detail: '「' + k + '」の渋滞時セリフを ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'G') {
    const k = cell[1], max = cell[2], raw = countSetSeen(BINGO_IDX.themeSets[k]), cur = Math.min(raw, max);
    return { label: k, sub: cur + '/' + max, detail: '「' + k + '」ジャンルのセリフを ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'K') {
    const k = cell[1], max = cell[2], raw = countSetSeen(BINGO_IDX.kindSets[k]), cur = Math.min(raw, max);
    const lbl = KIND_LABEL[k] || k;
    return { label: lbl, sub: cur + '/' + max, detail: '「' + lbl + '」の場面セリフを ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'AC') {
    const max = cell[1], raw = countSetSeen(BINGO_IDX.allC), cur = Math.min(raw, max);
    return { label: '専用🎉', sub: cur + '/' + max, detail: '各ステージ専用のクリア時セリフを合計 ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'AQ') {
    const max = cell[1], raw = countSetSeen(BINGO_IDX.allQ), cur = Math.min(raw, max);
    return { label: '専用👑', sub: cur + '/' + max, detail: '各ステージ専用の女王さまセリフを合計 ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  if (tp === 'AJ') {
    const max = cell[1], raw = countSetSeen(BINGO_IDX.allJ), cur = Math.min(raw, max);
    return { label: '専用💦', sub: cur + '/' + max, detail: '各ステージ専用の渋滞時セリフを合計 ' + max + '種類 見る（いま ' + raw + ' / ' + max + '）', cur, max, done: raw >= max };
  }
  return { label: '?', sub: '', detail: '', cur: 0, max: 1, done: false };
}
function bingoCardStatus(card) {
  const cells = card.cells.map(bingoCellInfo);
  const cl = save.bingo.claimed[card.id] || { lines: [], comp: false };
  const claimedSet = new Set(Array.isArray(cl.lines) ? cl.lines : []);
  const lineDone = BINGO_LINES.map(ln => ln.every(idx => cells[idx].done));
  const lineCount = lineDone.filter(Boolean).length;
  const allDone = lineCount === BINGO_LINES.length;
  const unclaimedLines = [];
  for (let i = 0; i < BINGO_LINES.length; i++) if (lineDone[i] && !claimedSet.has(i)) unclaimedLines.push(i);
  const unclaimedComp = allDone && !cl.comp;
  const inBingo = new Array(25).fill(false);
  lineDone.forEach((ok, li) => { if (ok) BINGO_LINES[li].forEach(idx => { inBingo[idx] = true; }); });
  return { cells, lineDone, lineCount, allDone, unclaimedLines, unclaimedComp, hasReward: unclaimedLines.length > 0 || unclaimedComp, inBingo, compClaimed: !!cl.comp };
}
function bingoSummary() {
  let lines = 0, comp = 0, ready = 0;
  for (const card of BINGO_CARDS) {
    const st = bingoCardStatus(card);
    lines += st.lineCount;
    if (st.allDone) comp++;
    if (st.hasReward) ready++;
  }
  return { lines, totalLines: BINGO_CARDS.length * 12, comp, totalCards: BINGO_CARDS.length, ready };
}
function fmtReward(r) {
  const p = [];
  if (r.c) p.push('🪙' + r.c);
  if (r.f) p.push('🍬' + r.f);
  if (r.h) p.push('💡' + r.h);
  if (r.s) p.push('🔍' + r.s);
  if (r.t) p.push('🎟️' + r.t);
  return p.join('＋');
}
function grantReward(r) {
  if (r.c) save.coins += r.c;
  if (r.f) save.food += r.f;
  if (r.h) save.hintT += r.h;
  if (r.s) save.scanT += r.s;
  if (r.t) save.tickets += r.t;
}
function bingoSnapshot() {
  return BINGO_CARDS.map(card => {
    const st = bingoCardStatus(card);
    let filled = 0, reach = 0;
    for (let i = 0; i < 25; i++) if (st.cells[i].done) filled++;
    for (const line of BINGO_LINES) {
      let d = 0;
      for (const idx of line) if (st.cells[idx].done) d++;
      if (d === 4) reach++;
    }
    return { filled, lines: st.lineCount, reach, ready: st.unclaimedLines.length + (st.unclaimedComp ? 1 : 0) };
  });
}
function calcBingoImpact(before) {
  const after = bingoSnapshot();
  let newCells = 0, newLines = 0, newReach = 0, readyCards = 0;
  for (let i = 0; i < after.length; i++) {
    const b = before && before[i] ? before[i] : { filled: 0, lines: 0, reach: 0 };
    newCells += Math.max(0, after[i].filled - b.filled);
    newLines += Math.max(0, after[i].lines - b.lines);
    newReach += Math.max(0, after[i].reach - b.reach);
    if (after[i].ready > 0) readyCards++;
  }
  const curIdx = clamp(save.bingo.card || 0, 0, after.length - 1);
  const curBefore = before && before[curIdx] ? before[curIdx] : { filled: 0, lines: 0 };
  const curAfter = after[curIdx] || { filled: 0, lines: 0 };
  return {
    newCells, newLines, newReach, readyCards, curIdx,
    curFilled: curAfter.filled,
    curCellDiff: Math.max(0, curAfter.filled - curBefore.filled),
    curLineDiff: Math.max(0, curAfter.lines - curBefore.lines)
  };
}
let lastBingoToast = 0;
window.isTalkSeen = text => seenTalkSet.has(text);
window.onTalkShown = text => {
  if (typeof G !== 'undefined' && G && G.level && G.level.custom) return;
  if (!text || seenTalkSet.has(text)) return;
  seenTalkSet.add(text);
  save.seenTalk.push(text);
  if (G.run && Array.isArray(G.run.newTalks) && G.run.newTalks.indexOf(text) < 0) {
    G.run.newTalks.push(text);
  }
  const dot = $('#bingoDot');
  let hasAny = false;
  for (const card of BINGO_CARDS) if (bingoCardStatus(card).hasReward) { hasAny = true; break; }
  if (dot) dot.classList.toggle('on', hasAny);
  updateStageTalkHud();
  persist();
};
let bingoSelCell = null;
function openBingo(from) {
  G.metaFrom = from;
  bingoSelCell = null;
  renderBingo();
  showOv('bingo');
}
function renderBingo() {
  const sum = bingoSummary(), totT = BINGO_IDX.totalTalk, pct = totT ? (Math.floor(1000 * seenTalkSet.size / totT) / 10).toFixed(1) : '0.0';
  $('#bgSum').innerHTML = 'みたセリフ：<b>' + seenTalkSet.size + '</b>/' + totT + '（' + pct + '%） ／ 達成：<b>' + sum.lines + '</b>/' + sum.totalLines + ' ライン ／ コンプ：<b>' + sum.comp + '</b>/' + sum.totalCards + ' 枚';
  const tabs = $('#bgTabs');
  tabs.innerHTML = '';
  BINGO_CARDS.forEach((c, idx) => {
    const st = bingoCardStatus(c);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bg-tab' + (idx === save.bingo.card ? ' on' : '') + (st.allDone ? ' done' : '');
    b.innerHTML = (st.allDone ? '★' : '') + c.num + (st.hasReward ? '<i></i>' : '');
    b.addEventListener('click', () => {
      save.bingo.card = idx;
      bingoSelCell = null;
      persist();
      Sound.tap();
      renderBingo();
    });
    tabs.appendChild(b);
  });
  const card = BINGO_CARDS[save.bingo.card] || BINGO_CARDS[0];
  const st = bingoCardStatus(card);
  $('#bgHead').innerHTML =
    '<div class="bg-head-t"><span>No.' + card.num + ' ' + card.title + '</span><span>' + (st.allDone ? '👑 コンプリート！' : st.lineCount + ' / 12 ライン') + '</span></div>' +
    '<div class="bg-head-d">' + card.desc + '</div>' +
    '<div class="bg-head-r">1ライン：' + fmtReward(card.lineR) + ' ｜ 全達成：' + fmtReward(card.compR) + '</div>';
  const grid = $('#bgGrid');
  grid.innerHTML = '';
  st.cells.forEach((ci, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bg-c' + (ci.done ? ' done' : '') + (st.inBingo[idx] ? ' bingo' : '') + (ci.free ? ' free' : '') + (bingoSelCell === idx ? ' sel' : '');
    b.innerHTML = (ci.done ? '<em>✅</em>' : '') + '<b>' + ci.label + '</b><span>' + ci.sub + '</span>';
    b.addEventListener('click', () => {
      bingoSelCell = idx;
      Sound.tap();
      renderBingo();
    });
    grid.appendChild(b);
  });
  const det = $('#bgDet');
  if (bingoSelCell != null && st.cells[bingoSelCell]) {
    const ci = st.cells[bingoSelCell];
    det.innerHTML = '<div>' + (ci.done ? '✅ ' : '▫️ ') + ci.detail + '</div><div class="abar"><i style="width:' + clamp(100 * ci.cur / ci.max, 0, 100) + '%"></i></div>';
  } else {
    det.innerHTML = '<div>マスをタップすると達成条件が見られるよ！いろいろなステージや女王さまのセリフを集めよう</div>';
  }
  const btn = $('#bBingoClaim');
  if (st.hasReward) {
    const tot = { c: 0, f: 0, h: 0, s: 0, t: 0 };
    const addR = r => { tot.c += r.c || 0; tot.f += r.f || 0; tot.h += r.h || 0; tot.s += r.s || 0; tot.t += r.t || 0; };
    st.unclaimedLines.forEach(() => addR(card.lineR));
    if (st.unclaimedComp) addR(card.compR);
    btn.style.display = 'block';
    btn.textContent = '🎁 ' + (st.unclaimedLines.length ? st.unclaimedLines.length + 'ライン' : '') + (st.unclaimedComp ? (st.unclaimedLines.length ? '＋' : '') + 'コンプリート' : '') + '報酬をうけとる！（' + fmtReward(tot) + '）';
  } else {
    btn.style.display = 'none';
  }
  const dot = $('#bingoDot');
  if (dot) dot.classList.toggle('on', sum.ready > 0);
}
function claimBingo() {
  const card = BINGO_CARDS[save.bingo.card] || BINGO_CARDS[0];
  const st = bingoCardStatus(card);
  if (!st.hasReward) return;
  const cl = save.bingo.claimed[card.id] || { lines: [], comp: false };
  if (!Array.isArray(cl.lines)) cl.lines = [];
  const tot = { c: 0, f: 0, h: 0, s: 0, t: 0 };
  const addR = r => { tot.c += r.c || 0; tot.f += r.f || 0; tot.h += r.h || 0; tot.s += r.s || 0; tot.t += r.t || 0; };
  st.unclaimedLines.forEach(li => { if (cl.lines.indexOf(li) < 0) cl.lines.push(li); grantReward(card.lineR); addR(card.lineR); });
  if (st.unclaimedComp) { cl.comp = true; grantReward(card.compR); addR(card.compR); }
  save.bingo.claimed[card.id] = cl;
  persist();
  Sound.fanfare();
  haptic(20);
  Fx.burst(innerWidth / 2, innerHeight * 0.35, 70, 420, ['star', 'conf', 'dot']);
  toast('🎯 ビンゴ報酬ゲット！ ' + fmtReward(tot), 3200);
  updateCoins(true);
  renderBingo();
}

function dayKey(off) { const d = new Date(); d.setDate(d.getDate() + (off || 0)); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function totalStars() { let n = 0; for (let i = 1; i <= TOTAL; i++) if (save.cleared[i]) n += save.best[i] ? save.best[i].s : 1; return n; }
function priceOf(k) { return k === 'hint' ? Math.round(PRICE.hint * (1 - perks().hintCut)) : PRICE[k]; }
function priceLabel(k) {
  const R = G.run;
  if (k === 'undo' && R && R.freeU > 0) return 'むりょう×' + R.freeU;
  if (k === 'hint') {
    if (R && R.freeH > 0) return 'むりょう';
    if (save.hintT > 0) return '🎟️×' + save.hintT;
  }
  if (k === 'scan' && save.scanT > 0) return '🎟️×' + save.scanT;
  return '🪙' + priceOf(k);
}
function refreshPrices() {
  const a = $('#pUndo'), b = $('#pHint'), c = $('#pScan'), sc = $('#bScan'), on = !!(G.levelId && G.scanId === G.levelId);
  if (a) a.textContent = priceLabel('undo');
  if (b) b.textContent = priceLabel('hint');
  if (c) c.textContent = on ? 'ON' : priceLabel('scan');
  if (sc) sc.classList.toggle('on', on);
}
function runEarnedCoins(R = G.run) {
  if (!R) return 0;
  let c = 0;
  if (R.maxCombo >= 5) c += Math.floor(R.maxCombo / 5);
  if (R.fevers) c += R.fevers * 10 + R.fcoin;
  if (R.gold) c += R.gold * 15;
  if (R.nice) c += R.nice * 8;
  return c;
}
function showRunCoins() {
  return !!G.run && G.overlay !== 'title' && G.overlay !== 'clear' && G.overlay !== 'daily';
}
function updateCoins(bump) {
  $('#coinTxt').textContent = showRunCoins() ? runEarnedCoins(G.run) : save.coins;
  if (bump) { const p = $('#coinPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  refreshPrices();
  if (G.overlay === 'title') renderTitle();
}
// 支払い：むりょう回数・無料チケット → コインの順に使う。足りなければ false
function payInfo(k) {
  const R = G.run;
  if (k === 'undo' && R && R.freeU > 0) return { ok: true, cost: 'このステージのむりょう回数 1かい（のこり ' + R.freeU + ' → ' + (R.freeU - 1) + '）' };
  if (k === 'hint') {
    if (R && R.freeH > 0) return { ok: true, cost: 'このステージのむりょう回数 1かい（のこり ' + R.freeH + ' → 0）' };
    if (save.hintT > 0) return { ok: true, cost: '🎟️ ヒント無料チケット 1まい（のこり ' + save.hintT + ' → ' + (save.hintT - 1) + '）' };
  }
  if (k === 'scan' && save.scanT > 0) return { ok: true, cost: '🎟️ 全部運べる無料チケット 1まい（のこり ' + save.scanT + ' → ' + (save.scanT - 1) + '）' };
  const p = priceOf(k);
  if (save.coins < p) return { ok: false, p };
  return { ok: true, cost: '🪙 ' + p + 'コイン（もちコイン ' + save.coins + ' → ' + (save.coins - p) + '）' };
}
function confirmSpend(opts, onOk) {
  const prev = G.overlay;
  $('#cfTitle').textContent = opts.title;
  $('#cfDesc').textContent = opts.desc;
  $('#cfCost').textContent = opts.costText || ('消費：' + opts.cost);
  $('#bCfOk').textContent = opts.okLabel || 'つかう！';
  G.cf = { prev, onOk };
  Sound.tap();
  showOv('confirm');
}
function pay(k) {
  const R = G.run;
  if (k === 'undo' && R && R.freeU > 0) { R.freeU--; refreshPrices(); return true; }
  if (k === 'hint') {
    if (R && R.freeH > 0) { R.freeH--; refreshPrices(); return true; }
    if (save.hintT > 0) { save.hintT--; persist(); refreshPrices(); return true; }
  }
  if (k === 'scan' && save.scanT > 0) { save.scanT--; persist(); refreshPrices(); return true; }
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
  $('#dayMsg').textContent = P.st + '日れんぞくログイン！きょうのごほうび：🪙' + P.coins + '＋💡ヒント無料チケット×1＋🔍全部運べる無料チケット×1' + (P.ticket ? '＋🎟️おたからばこチケット' : '');
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
  const n = Math.min(8 + Math.max(0, G.perk.gold - 2) * 2, Math.max(1, Math.round(cells.length / 220)) * G.perk.gold);
  for (let k = 0; k < n * 4 && set.size < n; k++) set.add(cells[Math.floor(Math.random() * cells.length)]);
  return set;
}
function applyLevel(id, L) {
  if (G.scanId !== id) G.scanId = 0;
  G.levelId = id; G.level = L; G.s = makeState(L);
  G.undo = []; G.moves = []; G.queued = null;
  // アリの歩く速さ。ANT_RATE を変えると全体の速さが変わる（1＝前の速さ、0.5＝半分）
  const ANT_RATE = 0.65;
  G.antSpeed = clamp((L.W + L.H) * 0.36, 8, 42) * ANT_RATE;
  G.run = { started: false, done: false, time: 0, candies: 0, food: 0, maxCombo: 0, fevers: 0, fcoin: 0, gold: 0, nice: 0, undos: 0, hints: 0, freeU: G.perk.freeUndo, freeH: G.perk.freeHint, newTalks: [], bingoSnap: bingoSnapshot() };
  G.par = parTimes(L); G.waitIds = new Set(); G.timerShown = -9;
  endFever(); G.fever.g = 0;
  G.gold = pickGold(L);
  if (!L.custom) { save.level = id; persist(); }
  layout(); resetVisual();
  G.clearShown = false; G.loading = false;
  G.oneColNotified = false; G.oneColT = 0; G.lpNotified = false;
  Sound.setBgm(L.name, L.theme);
  G.bgmBanner = save.settings.music !== false ? { title: Sound.bgmTitle(), t0: null } : null;
  if (!L.custom) Tut.levelStart(id);
  updateTip(); refreshPrices(); updateStageTalkHud();
  hudCache.coin = 0; updateCoins();
  if (!L.custom) $('#bPlay').textContent = 'あそぶ（Lv.' + posOf(id) + '）';
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
  G.hudDirty = true;
  popup('ナイス先読み！', slotCX, slotY - slotSize * 0.95, '#7cffb0');
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
  if (G.run && !G.run.started) {
    G.run.started = true; G.timerShown = -9;
    if (G.level && G.level.custom && G.level.customHash && window.AF_reportStageStat) {
      window.AF_reportStageStat(G.level.customHash, 'play');
    }
  }
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
    if (!save.flags.lp && !G.lpNotified && !Tut.gameBusy() && posOf(G.levelId) >= 3 && (got === 0 || got < newN)) {
      G.lpNotified = true;
      toast('💡 迷ったら箱を「長押し」！置く前に届く数がわかるよ', 3200);
    }
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
  if (!save.flags.lp) { save.flags.lp = 1; persist(); updateTip(); }
  haptic(10);
}

/* ================= オーバーレイ・クリア演出 ================= */
const AF_BREADCRUMBS = [];
function pushCrumb(tag) {
  if (!tag || AF_BREADCRUMBS[AF_BREADCRUMBS.length - 1] === tag) return;
  AF_BREADCRUMBS.push(tag);
  if (AF_BREADCRUMBS.length > 10) AF_BREADCRUMBS.shift();
}
function syncQuickFbVis() {
  const b = $('#bQuickFb');
  const ov = G.overlay;
  if (b) {
    const hideFb = !ov || ov === 'title' || ov === 'feedback' || ov === 'confirm' || ov === 'load' || ov === 'daily';
    b.classList.toggle('on', !hideFb);
  }
  const bk = $('#bQuickBack');
  if (bk) {
    const hideBk = !ov || ov === 'title' || ov === 'load' || ov === 'confirm' || ov === 'daily' || ov === 'award' || ov === 'jam';
    bk.classList.toggle('on', !hideBk);
  }
}
function showOv(name) {
  G.overlay = name;
  pushCrumb(name);
  document.querySelectorAll('.ov').forEach(o => o.classList.toggle('show', o.id === 'ov-' + name));
  const card = document.querySelector('#ov-' + name + ' .card');
  if (card) card.scrollTop = 0;
  if (name === 'title') {
    if (Sound.stageBgm) { Sound.stageBgm = null; Sound.step = 0; Sound.lyricQ = []; }
    renderTitle();
    if (typeof checkAppUpdate === 'function') checkAppUpdate(false);
  }
  syncQuickFbVis();
  updateCoins();
}
function hideOv() {
  G.overlay = null;
  pushCrumb('play' + (G.level ? '(Lv.' + posOf(G.levelId) + (G.level.custom ? '/自作' : '') + ')' : ''));
  document.querySelectorAll('.ov').forEach(o => o.classList.remove('show'));
  syncQuickFbVis();
  updateCoins();
}
function popText(el, text) {
  el.innerHTML = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch; s.style.color = POP[i % POP.length]; s.style.animationDelay = (i * 0.06) + 's';
    el.appendChild(s);
  });
}
const thumbCache = new WeakMap();
function getThumbCached(art, size, shadow) {
  const key = size + '|' + (shadow ? 1 : 0) + '|' + dpr;
  let m = thumbCache.get(art.grid);
  if (!m) { m = new Map(); thumbCache.set(art.grid, m); }
  let off = m.get(key);
  if (!off) {
    off = document.createElement('canvas');
    off.width = off.height = Math.round(size * dpr);
    const g = off.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = art.W, c = (size - 6) / W, x0 = 3;
    let lastCol = '';
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const v = art.grid[y * W + x];
      if (v < 0) continue;
      const col = shadow ? 'rgba(120,80,110,.3)' : HEX[v];
      if (col !== lastCol) { g.fillStyle = col; lastCol = col; }
      g.fillRect(x0 + x * c, x0 + y * c, c + 0.4, c + 0.4);
    }
    m.set(key, off);
  }
  return off;
}
function hasThumbCached(art, size, shadow) {
  const m = thumbCache.get(art.grid);
  return !!(m && m.has(size + '|' + (shadow ? 1 : 0) + '|' + dpr));
}
function drawThumb(cv, art, size, shadow) {
  const pw = Math.round(size * dpr);
  if (cv.width !== pw || cv.height !== pw) cv.width = cv.height = pw;
  cv.style.width = cv.style.height = size + 'px';
  const g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, pw, pw);
  g.drawImage(getThumbCached(art, size, shadow), 0, 0);
}
function updateBadge() {
  const b = $('#albumBadge'), n = save.newArts.length;
  b.textContent = n; b.classList.toggle('on', n > 0);
}
function showClear() {
  const isCustom = !!(G.level && G.level.custom);
  const id = G.levelId, pos = isCustom ? 1 : posOf(id), first = !isCustom && !save.cleared[id], tok = ++G.clearTok, P = G.perk;
  const R = G.run || { time: 0, candies: 0, food: 0, maxCombo: 0, fevers: 0, fcoin: 0, gold: 0, nice: 0, undos: 0, hints: 0 };
  G.clearShown = true; G.nextBusy = false; G.scanId = 0; refreshPrices();
  endFever();
  const t = Math.max(0.1, Math.round(R.time * 10) / 10), par = G.par || parTimes(G.level), st = timeStars(t, par);
  const prev = !isCustom && save.best[id], firstS3 = !isCustom && st === 3 && !(prev && prev.s >= 3), newBest = !!prev && t < prev.t;
  if (!isCustom) {
    save.best[id] = { s: Math.max(st, prev ? prev.s : 0), t: prev ? Math.min(prev.t, t) : t };
    save.cleared[id] = 1;
    if (first && save.newArts.indexOf(id) < 0) save.newArts.push(id);
    if (pos <= save.maxLevel) save.maxLevel = Math.max(save.maxLevel, Math.min(TOTAL, pos + 1));
  }
  const nx = isCustom ? 0 : nextOf(id);
  if (!isCustom) save.level = nx || id;

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
  $('#clearLv').textContent = isCustom ? 'オリジナルステージ' : 'レベル ' + pos;
  $('#clearName').textContent = '「' + G.level.name + '」がかんせい！';
  G.lastShare = { pos, name: G.level.name, stars: st, sec: t, custom: isCustom, url: isCustom && G.level.shareUrl ? G.level.shareUrl : 'https://hirocast.github.io/antflow/' };
  $('#clearSay').textContent = '🐜「' + talkLine(st === 3 ? 'star3' : 'clear') + '」';
  const voteBox = $('#resCustomVote');
  if (voteBox) {
    if (isCustom && G.level.customHash) {
      if (window.AF_reportStageStat) window.AF_reportStageStat(G.level.customHash, 'clear', t);
      const stV = window.AF_getStageVote ? window.AF_getStageVote(G.level.customHash) : { like: false, vote: '' };
      voteBox.classList.add('on');
      voteBox.innerHTML =
        '<div>このオリジナルステージはどうだった？（作者に届くよ！）</div>' +
        '<div class="resvote-btns">' +
        '<button type="button" class="resvote-btn like' + (stV.like ? ' on' : '') + '" data-cv="like">' + (stV.like ? '♥ いいね済み' : '♡ いいね！') + '</button>' +
        '<button type="button" class="resvote-btn up' + (stV.vote === 'up' ? ' on' : '') + '" data-cv="up"' + (stV.vote ? ' disabled' : '') + '>👍 よかった！</button>' +
        '<button type="button" class="resvote-btn dn' + (stV.vote === 'down' ? ' on' : '') + '" data-cv="down"' + (stV.vote ? ' disabled' : '') + '>👎 もうちょっと</button>' +
        '</div>';
    } else {
      voteBox.classList.remove('on');
      voteBox.innerHTML = '';
    }
  }
  const talkBox = $('#resTalkBox');
  if (talkBox) {
    const newTalks = Array.isArray(R.newTalks) ? R.newTalks : [];
    const imp = calcBingoImpact(R.bingoSnap);
    const stAll = !isCustom ? stageTalkList(G.level.name) : [];
    const stSeen = stAll.length ? stAll.filter(s => seenTalkSet.has(s)).length : 0;
    if (newTalks.length || imp.newCells > 0 || imp.newLines > 0 || imp.newReach > 0 || stAll.length > 0) {
      const liked = loadTalkLikes();
      const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const mkChips = list => list.map(s => {
        const isOn = liked.has(s);
        return '<span class="restalk-chip"><span>「' + esc(s) + '」</span><button type="button" class="restalk-like' + (isOn ? ' on' : '') + '" data-talk="' + esc(s) + '">' + (isOn ? '♥ いいね' : '♡') + '</button></span>';
      }).join('');
      const stSet = new Set(stAll);
      const stNew = stAll.length ? newTalks.filter(s => stSet.has(s)) : [];
      const otherNew = stAll.length ? newTalks.filter(s => !stSet.has(s)) : newTalks;
      const bgParts = [];
      if (imp.newLines > 0) bgParts.push('<span class="hit">🎉 ビンゴ達成 +' + imp.newLines + 'ライン！</span>');
      else if (imp.newReach > 0) bgParts.push('<span class="hit">🔥 リーチ +' + imp.newReach + '！</span>');
      if (imp.newCells > 0) bgParts.push('マス <b>+' + imp.newCells + '</b>（カード' + (imp.curIdx + 1) + ': ' + imp.curFilled + '/25）');
      else if (imp.newLines > 0 || imp.newReach > 0) bgParts.push('カード' + (imp.curIdx + 1) + ': ' + imp.curFilled + '/25');
      const btnHtml = (imp.readyCards > 0 || imp.newCells > 0) ? '<button type="button" class="restalk-btn" data-bingo-go="1">' + (imp.readyCards > 0 ? '🎁 報酬をうけとる' : '🎯 ビンゴを見る') + '</button>' : '';
      const showBg = newTalks.length || imp.newCells > 0 || imp.newLines > 0 || imp.newReach > 0;
      let html = '';
      if (stAll.length > 0) {
        const stHead = '✨ この面専用' + (stNew.length ? '（新着 +' + stNew.length + 'こ）' : '');
        const stProg = stSeen + '/' + stAll.length + (stSeen === stAll.length ? ' 🎉コンプ！' : '');
        html += '<div class="restalk-h"><span>' + stHead + '</span><span>' + stProg + (!otherNew.length ? ' · 累計 ' + seenTalkSet.size + '/' + BINGO_IDX.totalTalk : '') + '</span></div>';
        if (stNew.length) html += '<div class="restalk-list">' + mkChips(stNew) + '</div>';
      }
      if (otherNew.length > 0) {
        const cls = stAll.length > 0 ? 'restalk-sub' : 'restalk-h';
        html += '<div class="' + cls + '"><span>💬 そのほかの新着（+' + otherNew.length + 'こ）</span><span>累計 ' + seenTalkSet.size + '/' + BINGO_IDX.totalTalk + '</span></div>';
        html += '<div class="restalk-list">' + mkChips(otherNew) + '</div>';
      } else if (!stAll.length) {
        html += '<div class="restalk-h"><span>💬 セリフ進捗</span><span>累計 ' + seenTalkSet.size + '/' + BINGO_IDX.totalTalk + '</span></div>';
      }
      if (showBg) html += '<div class="restalk-bg"><span>🎯 ' + (bgParts.length ? bgParts.join(' ／ ') : 'ビンゴ進捗：カード' + (imp.curIdx + 1) + ' ' + imp.curFilled + '/25') + '</span>' + btnHtml + '</div>';
      talkBox.innerHTML = html;
      talkBox.classList.add('on');
    } else {
      talkBox.classList.remove('on');
      talkBox.innerHTML = '';
    }
  }
  const cv = $('#revealCv'), S = Math.round(Math.min(innerWidth * 0.36, innerHeight * 0.21, 144));
  cv.style.width = cv.style.height = S + 'px'; cv.width = cv.height = Math.round(S * dpr);
  G.reveal = { t: 0, art: isCustom ? G.level.art : getArt(id), g: cv.getContext('2d'), S };
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
  updateClearQueenBtn();
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
  if (isCustom) {
    nc.style.display = 'none';
    $('#nextLabel').textContent = 'オリジナルステージ';
    $('#nextName').textContent = 'シェアボタンで友達にも遊んでもらおう！';
    bn.textContent = '🎨 つくる / もどる';
  } else if (nx) {
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
let mascotCache = null;
function ensureMascotCache() {
  const key = save.skin + '|' + dpr;
  if (mascotCache && mascotCache.key === key) return mascotCache;
  const u = 30, aw = Math.ceil(u * 2.8), ah = Math.ceil(u * 3.4), aox = u * 1.35, aoy = u * 2.1;
  const ants = [];
  for (let fr = 0; fr < 4; fr++) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(aw * dpr)); c.height = Math.max(1, Math.ceil(ah * dpr));
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, aox * dpr, aoy * dpr);
    drawAntShape(g, u, 10, 1, fr, save.skin);
    ants.push(c);
  }
  const cz = u * 1.3, ccw = Math.ceil(cz + 4);
  const candy = document.createElement('canvas');
  candy.width = candy.height = Math.max(1, Math.ceil(ccw * dpr));
  const cg = candy.getContext('2d');
  cg.setTransform(dpr, 0, 0, dpr, ccw * dpr / 2, ccw * dpr / 2);
  paintCandy(cg, -cz / 2, -cz / 2, cz, 2);
  mascotCache = { key, ants, aw, ah, aox, aoy, candy, ccw, u, cz };
  return mascotCache;
}
function drawMascot(cv, t) {
  const W = Math.round(170 * dpr), H = Math.round(130 * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const mc = ensureMascotCache(), g = cv.getContext('2d'), u = mc.u, bob = -Math.abs(Math.sin(t * 4)) * 5;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, 170, 130);
  g.fillStyle = 'rgba(120,60,90,.15)'; ell(g, 85, 120, 46, 6); g.fill();
  g.save(); g.translate(80, 120 - 0.8 * u + bob); g.rotate(Math.sin(t * 4) * 0.06);
  g.drawImage(mc.ants[Math.floor(t * 8) & 3], -mc.aox, -mc.aoy, mc.aw, mc.ah);
  g.translate(0.36 * u, -1.02 * u - mc.cz / 2); g.rotate(Math.sin(t * 3) * 0.08);
  g.drawImage(mc.candy, -mc.ccw / 2, -mc.ccw / 2, mc.ccw, mc.ccw);
  g.restore();
}

/* ================= ホーム画面・女王さま・ミッション・きせかえ ================= */
function queenStatus() {
  const max = save.qlv >= Q_MAX;
  if (max) return { max: true, toNext: 0, afterLv: Q_MAX, canLvUp: false, unlocks: [], canUnlock: false, nextUnlock: null, toUnlock: 0 };
  const toNext = Math.max(0, qNeed(save.qlv) - save.qexp);
  let lv = save.qlv, exp = save.qexp + save.food;
  while (lv < Q_MAX && exp >= qNeed(lv)) { exp -= qNeed(lv); lv++; }
  const unlocks = [];
  ROOMS.forEach(r => { if (r[0] > save.qlv && r[0] <= lv) unlocks.push(r[1] + r[2]); });
  Q_PERKS.forEach(p => { if (p[0] > save.qlv && p[0] <= lv) unlocks.push(p[1]); });
  let nextLv = Q_MAX + 1;
  const nextLabels = [];
  ROOMS.forEach(r => { if (r[0] > save.qlv && r[0] < nextLv) nextLv = r[0]; });
  Q_PERKS.forEach(p => { if (p[0] > save.qlv && p[0] < nextLv) nextLv = p[0]; });
  let nextUnlock = null, toUnlock = 0;
  if (nextLv <= Q_MAX) {
    ROOMS.forEach(r => { if (r[0] === nextLv) nextLabels.push(r[1] + r[2]); });
    Q_PERKS.forEach(p => { if (p[0] === nextLv) nextLabels.push(p[1]); });
    let sum = -save.qexp;
    for (let l = save.qlv; l < nextLv; l++) sum += qNeed(l);
    nextUnlock = { lv: nextLv, label: nextLabels.join('・') };
    toUnlock = Math.max(0, sum - save.food);
  }
  return { max: false, toNext, afterLv: lv, canLvUp: lv > save.qlv, unlocks, canUnlock: unlocks.length > 0, nextUnlock, toUnlock };
}
function updateClearQueenBtn() {
  const btn = $('#bClearQueen'), qs = queenStatus();
  if (!btn) return;
  btn.classList.toggle('pulse', qs.canUnlock);
  if (qs.canUnlock) btn.textContent = '👑 ごはんをあげると新要素解放！（🍬' + save.food + '）';
  else if (qs.canLvUp) btn.textContent = '👑 ごはんをあげるとLvアップ！（🍬' + save.food + '）';
  else if (!qs.max && qs.nextUnlock) btn.textContent = '👑 女王さまにエサ（🍬' + save.food + '｜次の解放まであと' + qs.toUnlock + '）';
  else btn.textContent = '👑 女王さまにエサをあげる（🍬' + save.food + '）';
}
function renderTitle() {
  const el = $('#titleInfo');
  if (!el) return;
  const playBtn = $('#bPlay');
  if (playBtn) {
    const willLoadNext = G.clearShown || !G.level || (G.run && G.run.done);
    if (willLoadNext) playBtn.textContent = 'あそぶ（Lv.' + posOf(save.level) + '）';
    else if (!G.level.custom) playBtn.textContent = 'あそぶ（Lv.' + posOf(G.levelId) + '）';
  }
  misCheck();
  const qs = queenStatus(), ts = totalStars(), got = gotCount(), lv = save.qlv, maxQ = lv >= Q_MAX, bg = bingoSummary();
  const talkCur = seenTalkSet.size, talkTot = BINGO_IDX.totalTalk;
  const talkPct = talkTot ? clamp(100 * talkCur / talkTot, 0, 100) : 0;
  const talkPctStr = (Math.floor(talkPct * 10) / 10).toFixed(1);
  const need = qNeed(lv), qPct = maxQ ? 100 : clamp(100 * save.qexp / need, 0, 100);
  el.innerHTML = '<span>🪙 ' + save.coins + '</span><button type="button" class="tinfo-btn" data-hub="mis">⭐ ' + ts + '</button><button type="button" class="tinfo-btn" data-hub="queen">👑 Lv.' + lv + '</button><button type="button" class="tinfo-btn" data-hub="bingo">💬 ' + talkCur + '/' + talkTot + '</button>' + (save.tickets > 0 ? '<span>🎟️ ' + save.tickets + '</span>' : '');
  $('#misDot').classList.toggle('on', save.mis.list.some(m => !m.done));
  $('#queenDot').classList.toggle('on', qs.canUnlock);
  const bDot = $('#bingoDot');
  if (bDot) bDot.classList.toggle('on', bg.ready > 0);

  const hub = $('#homeHub');
  if (!hub) return;
  const isOpen = hub.classList.contains('open');
  const misDone = save.mis.list.filter(m => m.done).length;
  const sk = SKINS.find(s => s.k === save.skin) || SKINS[0];
  const baseStar = save.road * 10, nxtStar = baseStar + 10;
  const roomsOn = ROOMS.filter(r => lv >= r[0]).length, perksOn = Q_PERKS.filter(p => lv >= p[0]).length;
  let s3 = 0;
  for (let i = 1; i <= TOTAL; i++) if (save.cleared[i] && save.best[i] && save.best[i].s >= 3) s3++;
  const curArt = getArt(save.level);
  const curName = curArt ? curArt.n : '';

  let qSub = maxQ ? 'さいだいレベル達成！' : 'つぎのLvまで あと ' + qs.toNext + ' こ（' + save.qexp + '/' + need + '）';
  if (!maxQ && qs.canUnlock) qSub = '✨ いまエサをあげると「' + qs.unlocks.join('・') + '」が解放！';
  else if (!maxQ && qs.canLvUp) qSub = '✨ いまエサをあげると Lv.' + qs.afterLv + ' にアップ！';
  else if (!maxQ && qs.nextUnlock) qSub += ' ｜ 次の解放 Lv.' + qs.nextUnlock.lv + ' まであと' + qs.toUnlock;

  const foodBadge = (qs.canLvUp || qs.canUnlock)
    ? '<span class="hq-food ready">🍬 ' + save.food + ' ✨育成可</span>'
    : '<span class="hq-food">🍬 エサ ' + save.food + '</span>';

  const misRows = save.mis.list.map(m => {
    const d = MISSION_POOL[m.i], p = Math.min(m.p, d.n);
    return '<div class="hub-mis' + (m.done ? ' done' : '') + '"><span>' + (m.done ? '✅ ' : '▫️ ') + d.t + '</span><span>' + p + '/' + d.n + ' (🪙' + d.r + ')</span></div>';
  }).join('');

  hub.innerHTML =
    '<button type="button" class="hub-qbtn" data-hub="queen">' +
      '<div class="hub-q"><b>👑 女王さま Lv.' + lv + '（' + qTitle(lv) + '）</b>' + foodBadge + '</div>' +
      '<div class="abar"><i style="width:' + qPct + '%"></i></div>' +
      '<div class="hub-sub">' + qSub + '</div>' +
    '</button>' +
    '<button type="button" class="hub-qbtn" data-hub="bingo" style="margin-top:6px">' +
      '<div class="hub-q"><b>💬 表示セリフ達成度</b><span class="hq-food' + (bg.ready > 0 ? ' ready' : '') + '">' + talkCur + ' / ' + talkTot + '（' + talkPctStr + '%）</span></div>' +
      '<div class="abar"><i style="width:' + talkPct + '%"></i></div>' +
      '<div class="hub-sub">🎯 ビンゴ：' + bg.lines + ' / ' + bg.totalLines + ' ライン（コンプ ' + bg.comp + '/' + bg.totalCards + ' 枚）' + (bg.ready > 0 ? ' ✨ 報酬うけとり可！' : '') + '</div>' +
    '</button>' +
    '<button type="button" class="hub-toggle" data-hub="toggle"><span>' + (isOpen ? '📊 くわしい情報をとじる' : '📊 コロニー・進行状況をもっと見る') + '</span><i class="hub-arr">▼</i></button>' +
    '<div class="hub-detail">' +
      '<div class="hub-grid" style="margin-bottom:7px">' +
        '<button type="button" class="hub-chip" data-hub="mis"><span>📋 ミッション</span><b>' + misDone + ' / 3</b></button>' +
        '<button type="button" class="hub-chip" data-hub="bingo"><span>🎯 セリフビンゴ</span><b>' + bg.lines + ' / ' + bg.totalLines + '</b></button>' +
        '<button type="button" class="hub-chip" data-hub="album"><span>📒 アルバム</span><b>' + got + ' / ' + TOTAL + '</b></button>' +
        '<button type="button" class="hub-chip" data-hub="skin"><span>' + sk.e + ' ' + sk.n + '</span><b>' + save.skins.length + '/' + SKINS.length + '</b></button>' +
      '</div>' +
      '<div class="hub-sec">' +
        '<div class="hub-sec-h"><span>👑 女王さまの育成</span><button type="button" class="hub-go" data-hub="queen">へやへ ▶</button></div>' +
        '<div class="hub-line">コインボーナス：<b>+' + (lv - 1) * 2 + '%</b> ／ おへや：<b>' + roomsOn + '/' + ROOMS.length + '</b> ／ 特技：<b>' + perksOn + '/' + Q_PERKS.length + '</b></div>' +
        (qs.nextUnlock ? '<div class="hub-line">つぎの解放：Lv.' + qs.nextUnlock.lv + '「' + qs.nextUnlock.label + '」（あと🍬' + qs.toUnlock + '）</div>' : '') +
      '</div>' +
      '<div class="hub-sec">' +
        '<div class="hub-sec-h"><span>🎯 セリフビンゴ</span><button type="button" class="hub-go" data-hub="bingo">カードへ ▶</button></div>' +
        '<div class="hub-line">みたセリフ：<b>' + talkCur + ' / ' + talkTot + ' 種類（' + talkPctStr + '%）</b> ／ 達成ライン：<b>' + bg.lines + ' / ' + bg.totalLines + '</b>（コンプ ' + bg.comp + '/' + bg.totalCards + ' 枚）</div>' +
      '</div>' +
      '<div class="hub-sec">' +
        '<div class="hub-sec-h"><span>📋 きょうのミッション</span><button type="button" class="hub-go" data-hub="mis">くわしく ▶</button></div>' +
        misRows +
        '<div class="hub-line" style="margin-top:3px">全達成ボーナス：🪙100＋🎟️1' + (save.mis.bonus ? '（✅ うけとりずみ）' : '') + ' ｜ ⭐ロード ' + ts + '/' + nxtStar + '★</div>' +
      '</div>' +
      '<div class="hub-sec">' +
        '<div class="hub-sec-h"><span>📒 ステージ・アルバム</span><button type="button" class="hub-go" data-hub="album">アルバム ▶</button></div>' +
        '<div class="hub-line">挑戦中：<b>Lv.' + posOf(save.level) + (curName ? '「' + curName + '」' : '') + '</b></div>' +
        '<div class="hub-line">クリア：<b>' + got + ' / ' + TOTAL + '</b> ｜ 獲得★：<b>' + ts + ' / ' + (TOTAL * 3) + '</b>（★★★ × ' + s3 + '）</div>' +
      '</div>' +
      '<div class="hub-sec">' +
        '<div class="hub-sec-h"><span>🎀 きせかえ・もちもの</span><button type="button" class="hub-go" data-hub="skin">きせかえ ▶</button></div>' +
        '<div class="hub-line">そうび中：<b>' + sk.e + ' ' + sk.n + '</b>（' + sk.d + '）</div>' +
        '<div class="hub-line">所持：きせかえ <b>' + save.skins.length + '/' + SKINS.length + '</b> ｜ 🪙 <b>' + save.coins + '</b> ｜ 🎟️ <b>' + save.tickets + '</b> ｜ 🍬 <b>' + save.food + '</b></div>' +
      '</div>' +
    '</div>';
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
  const lv = save.qlv, max = lv >= Q_MAX, need = qNeed(lv), chunk = Math.min(save.food, 100), qs = queenStatus();
  $('#qLv').textContent = 'Lv.' + lv;
  $('#qTitle').textContent = qTitle(lv);
  $('#qBar').style.width = (max ? 100 : clamp(100 * save.qexp / need, 0, 100)) + '%';
  $('#qExp').textContent = max ? 'さいだいレベル！' : 'つぎのレベルまで あと ' + qs.toNext + ' こ（' + save.qexp + ' / ' + need + '）';
  let foodMsg = '🍬 しょくりょうこのエサ：' + save.food + ' こ';
  if (qs.canUnlock) foodMsg += ' ✨ いまあげると「' + qs.unlocks.join('・') + '」が解放されるよ！';
  else if (qs.canLvUp) foodMsg += ' ✨ いまあげると Lv.' + qs.afterLv + ' にあがるよ！';
  else if (qs.nextUnlock) foodMsg += ' ｜ 次の解放（Lv.' + qs.nextUnlock.lv + ' ' + qs.nextUnlock.label + '）まで あと ' + qs.toUnlock + ' こ';
  $('#qFood').textContent = foodMsg;
  $('#bFeed').disabled = !save.food || max;
  $('#bFeed').textContent = save.food && !max ? '🍬 ごはん（+' + chunk + '）' : '🍬 ごはんをあげる';
  $('#bFeedAll').disabled = !save.food || max;
  $('#bFeedAll').style.display = save.food > 100 && !max ? '' : 'none';
  $('#qRooms').innerHTML = ROOMS.map(r => '<div class="room' + (lv >= r[0] ? '' : ' lock') + '"><i>' + (lv >= r[0] ? r[1] : '🔒') + '</i>' + (lv >= r[0] ? r[2] : 'Lv.' + r[0]) + '</div>').join('');
  $('#qPerks').innerHTML = '<div class="pk on"><b>いつも</b>クリアのコイン +' + (lv - 1) * 2 + '%（レベルごとに+2%）</div>' +
    Q_PERKS.map(p => '<div class="pk' + (lv >= p[0] ? ' on' : '') + '"><b>Lv.' + p[0] + '</b>' + (lv >= p[0] ? '✅ ' : '') + p[1] + '</div>').join('');
}
function doFeed(all) {
  if (!save.food || save.qlv >= Q_MAX) return;
  const before = save.qlv, amt = all ? save.food : Math.min(save.food, 100);
  save.qexp += amt; save.food -= amt;
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
  updateClearQueenBtn();
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
  const spots = [
    [60, 66], [240, 68], [26, 118], [274, 118], [102, 96], [198, 96], [20, 50], [280, 50],
    [100, 48], [200, 48], [58, 96], [242, 96], [150, 54], [36, 80], [264, 80], [82, 134],
    [218, 134], [20, 144], [280, 144], [150, 84]
  ];
  const unlockedRooms = ROOMS.filter(r => save.qlv >= r[0]);
  g.font = (unlockedRooms.length > 8 ? '15px' : '18px') + ' sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  unlockedRooms.forEach((r, i) => { if (spots[i]) g.fillText(r[1], spots[i][0], spots[i][1]); });
  const n = Math.min(16, 2 + Math.floor(save.qlv / 8));
  for (let k = 0; k < n; k++) {
    const sp = 26 + (k % 3) * 8, dir = k % 2 ? 1 : -1, span = Wc + 40;
    let x = ((t * sp + k * 53) % span) - 20;
    if (dir < 0) x = Wc - x;
    g.save(); g.translate(x, 156 - (k % 3) * 4); g.scale(dir, 1);
    drawAntShape(g, 7, k % 9, 1, Math.floor(t * 10 + k) & 3, null);
    paintCandy(g, 7 * 0.36 - 4.55, -7 * 1.02 - 9.1, 9.1, (k * 3) % 21);
    g.restore();
  }
  const lvClamped = Math.min(save.qlv, Q_MAX);
  const u = 20 + Math.min(lvClamped, 50) * 0.25 + Math.max(0, lvClamped - 50) * 0.04, b = G.qBounce || 0, bob = -Math.abs(Math.sin(t * 2.2)) * 3;
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
    '<div class="abar"><i style="width:' + clamp(100 * (ts - base) / 10, 0, 100) + '%"></i></div><p class="fine">ステージごとの最高★の合計</p>';
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
  const cost = useT
    ? '🎟️ おたからばこチケット 1まい（のこり ' + save.tickets + ' → ' + (save.tickets - 1) + '）'
    : '🪙 ' + PRICE.box + 'コイン（もちコイン ' + save.coins + ' → ' + (save.coins - PRICE.box) + '）';
  confirmSpend({
    title: '🎁 おたからばこ',
    desc: 'アリの「きせかえ」がランダムで1つ手に入ります。きせかえごとに便利な効果がついています！（ぜんぶ所持済みの場合は🪙150かえってきます）',
    cost,
    okLabel: '開ける！'
  }, () => {
    const tNow = save.tickets > 0;
    if (!tNow && save.coins < PRICE.box) { toast('🪙 コインが足りないよ（' + PRICE.box + 'こ必要）'); Sound.deny(); return; }
    if (tNow) save.tickets--; else save.coins -= PRICE.box;
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
  });
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
  1: [[3, 7, 'とどく箱から置こう！外があくと内側もとどくよ']],
  2: [[1, 5, '迷ったら長押し！運ばれるキャンディが光るよ']],
  3: [[0, 4, '★★★の目安は上の時計。「はやさ 2x」も便利！']],
  4: [[0, 4, '奥の色は、届かない箱を先に置く「先読み」がカギ！']],
  5: [[0, 4, 'おやすみ（z）の箱をためすぎると渋滞するよ']],
  6: [[0, 3, '渋滞しても「⏪」で解ける所まで戻れるよ']]
};
const hudCache = { lv: '', st: '', name: '', left: '', w: '', dis: null, spd: '', coin: -1 };
function updateHUD() {
  G.hudDirty = false;
  if (!G.level) return;
  const isCustom = !!(G.level && G.level.custom);
  const pos = isCustom ? 1 : posOf(G.levelId), st = starsAt(pos);
  const lv = isCustom ? 'オリジナル' : 'Lv.' + pos, stars = isCustom ? '🎨' : '★'.repeat(st) + '☆'.repeat(5 - st);
  const name = isCustom || save.cleared[G.levelId] || save.settings.dev ? G.level.name : '？？？（' + G.level.theme + '）';
  const left = 'のこり ' + G.vleft + ' / ' + G.level.total;
  const dis = !G.undo.length, spd = G.speed + 'x';
  const coin = runEarnedCoins(G.run);
  if (hudCache.lv !== lv) { hudCache.lv = lv; $('#lvNum').textContent = lv; }
  if (hudCache.st !== stars) { hudCache.st = stars; $('#lvStars').textContent = stars; }
  if (hudCache.name !== name) { hudCache.name = name; $('#lvName').textContent = name; }
  if (hudCache.left !== left) { hudCache.left = left; $('#leftTxt').textContent = left; }
  if (hudCache.dis !== dis) { hudCache.dis = dis; $('#bUndo').disabled = dis; }
  if (hudCache.spd !== spd) { hudCache.spd = spd; $('#spdIco').textContent = spd; }
  if (hudCache.coin !== coin) { const up = hudCache.coin >= 0 && coin > hudCache.coin; hudCache.coin = coin; updateCoins(up); }
}
function updateTimer() {
  const R = G.run, el = $('#timeTxt'), bar = $('#progBar');
  if (!R || !G.par) return;
  const sec = Math.floor(R.time), key = R.started ? sec : -2;
  if (key === G.timerShown) return;
  G.timerShown = key;
  if (!R.started) {
    el.innerHTML = '⏱ タップでスタート　<b>★★★</b> ' + G.par[0] + '秒以内';
    if (bar) { bar.className = 's3'; bar.style.width = '100%'; }
    return;
  }
  const st = timeStars(R.time, G.par), lim = st === 3 ? G.par[0] : st === 2 ? G.par[1] : 0;
  el.innerHTML = '⏱ ' + sec + '秒　<b class="s' + st + '">' + '★'.repeat(st) + '</b>' + (lim ? ' あと' + Math.max(0, lim - sec) + '秒' : ' ゆっくりでOK');
  if (bar) {
    const pct = st === 3 ? Math.max(0, (G.par[0] - sec) / Math.max(1, G.par[0])) * 100
      : st === 2 ? Math.max(0, (G.par[1] - sec) / Math.max(1, G.par[1] - G.par[0])) * 100 : 0;
    bar.className = 's' + st;
    bar.style.width = pct.toFixed(1) + '%';
  }
}
const tipState = { msg: '', timer: 0, bound: false };
function foldTip(fold) {
  const el = $('#tip');
  clearTimeout(tipState.timer); tipState.timer = 0;
  if (!tipState.msg) { el.classList.remove('show', 'fold'); el.textContent = ''; return; }
  el.classList.add('show');
  el.classList.toggle('fold', fold);
  el.textContent = fold ? '💡' : tipState.msg;
  if (!fold && !G.overlay) {
    tipState.timer = setTimeout(() => foldTip(true), 4500);
  }
}
function updateTip() {
  const el = $('#tip'), pos = posOf(G.levelId), list = TIPS[pos] || [], m = G.moves.length;
  if (!tipState.bound) {
    tipState.bound = true;
    el.addEventListener('click', () => { if (tipState.msg) foldTip(!el.classList.contains('fold')); });
  }
  let msg = '';
  if (!Tut.gameBusy()) {
    for (const [a, b, s] of list) if (m >= a && m < b) { msg = s; break; }
    if (!msg && !save.flags.lp && pos >= 3 && m >= 1 && m < 5) {
      msg = '💡 箱を「長押し」すると、届くキャンディが光って数がわかるよ！';
    }
  }
  const changed = msg !== tipState.msg;
  tipState.msg = msg;
  if (!msg) { foldTip(false); return; }
  if (changed) foldTip(false);
  else if (!el.classList.contains('fold') && !tipState.timer && !G.overlay) {
    tipState.timer = setTimeout(() => foldTip(true), 4500);
  }
}
let toastTimer = 0;
function toast(msg, ms) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2200);
}
function startPlay() {
  if (G.loading) { showOv('load'); return; }
  if (G.clearShown || !G.level || (G.run && G.run.done)) {
    G.reveal = null; G.clearTok++;
    hideOv();
    loadLevel(save.level);
    return;
  }
  hideOv(); updateTip();
}
function findSolvableUndo() {
  const n = G.undo.length, sol = G.level.solution;
  if (!n) return -1;
  let k = 0;
  while (k < n && k < sol.length && G.moves[k] === sol[k]) k++;
  k = Math.min(k, n - 1);
  const t0 = Date.now();
  for (let i = n - 1; i > k; i--) {
    if (Date.now() - t0 > 500) break;
    if (solve(G.undo[i], 80, 15000).path) return i;
  }
  return k;
}
function doUndo() {
  if (G.loading || (G.overlay && G.overlay !== 'jam') || !G.undo.length) return;
  const info = payInfo('undo');
  if (!info.ok) { pay('undo'); return; }
  const n = G.undo.length;
  const t = G.overlay === 'jam' && G.rewindTo >= 0 && G.rewindTo < n ? G.rewindTo : findSolvableUndo();
  const cnt = n - t;
  confirmSpend({
    title: cnt === 1 ? '↶ 1てもどす' : '↶ ' + cnt + 'てもどす',
    desc: cnt === 1
      ? '直前にえらんだ箱を1手まえ（解ける盤面）にもどします。'
      : 'いまの盤面からはクリアできないため、まだ解ける盤面（' + cnt + '手まえ）まで一気にもどします。',
    cost: info.cost,
    okLabel: 'もどす！'
  }, () => {
    if (G.loading || (G.overlay && G.overlay !== 'jam') || t < 0 || t >= G.undo.length) return;
    if (!pay('undo')) return;
    G.rewindTok++;
    G.s = G.undo[t]; G.undo.length = t; G.moves.length = t; G.queued = null;
    if (G.run) G.run.undos++;
    resetVisual(); hideOv(); Sound.undo(); updateTip();
    if (cnt > 1) toast('↶ 解ける盤面（' + cnt + '手まえ）までもどしたよ', 2400);
  });
}
function doRetry() {
  if (G.loading || (G.overlay && G.overlay !== 'jam')) return;
  confirmSpend({
    title: '⟳ やりなおし',
    desc: 'このステージを最初からやり直します。いままでの手数はリセットされます。',
    costText: '消費：なし（むりょう）',
    okLabel: 'やりなおす！'
  }, () => {
    if (G.loading || (G.overlay && G.overlay !== 'jam')) return;
    hideOv(); loadLevel(G.levelId); Sound.undo();
  });
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
  const info = payInfo('hint');
  if (!info.ok) { pay('hint'); return; }
  confirmSpend({
    title: '💡 ヒント',
    desc: 'いまの盤面からクリアにつながるおすすめの箱を1つ光らせて教えます。',
    cost: info.cost,
    okLabel: 'つかう！'
  }, () => {
    if (G.overlay || G.pendingWin || G.loading || !G.s) return;
    if (!pay('hint')) return;
    G.hintCol = j;
    if (G.run) G.run.hints++;
    toast('💡 光っている箱がおすすめだよ');
  });
}
function doScan() {
  if (G.overlay || G.pendingWin || G.loading || !G.s) return;
  if (G.scanId === G.levelId) { toast('🔍 このステージでは解放済みだよ！'); return; }
  const info = payInfo('scan');
  if (!info.ok) { pay('scan'); return; }
  confirmSpend({
    title: '🔍 全部運べる',
    desc: 'いま1列まるごと全部のアリを運べる箱が光ってわかるようになります。（このステージ中ずっと有効）',
    cost: info.cost,
    okLabel: '解放する！'
  }, () => {
    if (G.overlay || G.pendingWin || G.loading || !G.s) return;
    if (!pay('scan')) return;
    G.scanId = G.levelId;
    G.hc = null;
    Sound.nice(); haptic(12);
    refreshPrices();
    toast('🔍 全部運べる箱が光るよ！（このステージ中）', 2600);
  });
}
let albumRenderTok = 0;
const albumCvCache = new Map();
function openAlbum(fromTitle) {
  G.fromTitle = fromTitle;
  const ah = $('#bAlbumHome'); if (ah) ah.style.display = fromTitle ? 'none' : 'block';
  const grid = $('#albumGrid'), fresh = new Set(save.newArts), tok = ++albumRenderTok;
  const frag = document.createDocumentFragment(), deferred = [];
  let drawnUncached = 0;
  for (let pos = 1; pos <= TOTAL; pos++) {
    const id = idAt(pos), btn = document.createElement('button'), cleared = !!save.cleared[id], open = isOpen(id);
    btn.className = 'al' + (open ? '' : ' locked');
    if (open) {
      const ck = id + '|' + (cleared ? 1 : 0) + '|' + dpr;
      let cv = albumCvCache.get(ck);
      const art = getArt(id);
      if (!cv) {
        cv = document.createElement('canvas');
        cv.style.width = cv.style.height = '64px';
        if (hasThumbCached(art, 64, !cleared) || drawnUncached < 16) {
          if (!hasThumbCached(art, 64, !cleared)) drawnUncached++;
          drawThumb(cv, art, 64, !cleared);
          albumCvCache.set(ck, cv);
        } else {
          deferred.push([cv, art, !cleared, ck]);
        }
      }
      btn.appendChild(cv);
      const sp = document.createElement('span');
      sp.textContent = pos + '. ' + (cleared ? art.name : '？？？');
      btn.appendChild(sp);
      if (cleared) {
        const b = save.best[id], s = b ? b.s : 1, bs = document.createElement('small');
        bs.className = 'bs'; bs.textContent = '★'.repeat(s) + '☆'.repeat(3 - s);
        btn.appendChild(bs);
      }
      if (fresh.has(id)) { const n = document.createElement('i'); n.className = 'new'; n.textContent = 'NEW'; btn.appendChild(n); }
      btn.addEventListener('click', () => cleared ? openView(id) : (hideOv(), loadLevel(id)));
    } else btn.innerHTML = '<div class="q">🔒</div><span>' + pos + '</span>';
    frag.appendChild(btn);
  }
  grid.innerHTML = '';
  grid.appendChild(frag);
  if (deferred.length) {
    let idx = 0;
    const step = () => {
      if (tok !== albumRenderTok || G.overlay !== 'album') return;
      const t0 = performance.now();
      while (idx < deferred.length && (performance.now() - t0 < 8 || idx % 6 !== 0)) {
        const d = deferred[idx++];
        drawThumb(d[0], d[1], 64, d[2]);
        albumCvCache.set(d[3], d[0]);
      }
      if (idx < deferred.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const got = gotCount();
  $('#albumSum').textContent = 'あつめた絵：' + got + ' / ' + TOTAL + ' 枚　⭐' + totalStars() + ' / ' + TOTAL * 3;
  $('#albumSumBar').style.width = (100 * got / TOTAL) + '%';
  save.newArts = []; persist(); updateBadge();
  showOv('album');
}
function updateStageTalkHud() {
  const el = $('#lvTalkSub');
  if (!el) return;
  if (!G.level || G.level.custom) { el.style.display = 'none'; return; }
  const all = stageTalkList(G.level.name);
  if (!all.length) { el.style.display = 'none'; return; }
  let seen = 0;
  for (const s of all) if (seenTalkSet.has(s)) seen++;
  const pct = Math.round(100 * seen / all.length);
  el.style.display = '';
  el.textContent = '💬' + seen + '/' + all.length + '(' + pct + '%)' + (seen === all.length ? '🎉' : '');
}
function stageTalkList(name) {
  const o = (typeof TALK_STAGE !== 'undefined' && TALK_STAGE[name]) || null;
  if (!o) return [];
  const out = [], seen = new Set();
  for (const k of ['hi', 'p', 'c', 'j', 'q']) {
    const arr = o[k];
    if (!Array.isArray(arr)) continue;
    for (const s of arr) {
      if (s && !seen.has(s)) { seen.add(s); out.push(s); }
    }
  }
  return out;
}
function openView(id) {
  const art = getArt(id), cv = $('#viewCv'), S = Math.round(Math.min(innerWidth * 0.72, 300)), b = save.best[id];
  $('#viewName').textContent = art.name;
  drawThumb(cv, art, S, false);
  $('#viewInfo').textContent = 'Lv.' + posOf(id) + '・' + art.theme + '・' + art.W + '×' + art.H + (b ? '・ベスト ' + b.t + '秒 ' + '★'.repeat(b.s) : '');
  const vb = $('#viewTalkBox');
  if (vb) {
    const allTalks = stageTalkList(art.name);
    if (allTalks.length) {
      const seenList = allTalks.filter(s => seenTalkSet.has(s));
      const liked = loadTalkLikes();
      const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const chips = seenList.map(s => {
        const isOn = liked.has(s);
        return '<span class="restalk-chip"><span>「' + esc(s) + '」</span><button type="button" class="restalk-like' + (isOn ? ' on' : '') + '" data-talk="' + esc(s) + '">' + (isOn ? '♥ いいね' : '♡') + '</button></span>';
      }).join('');
      const left = allTalks.length - seenList.length;
      vb.innerHTML =
        '<div class="restalk-h"><span>💬 このステージのセリフ（' + seenList.length + '/' + allTalks.length + '）</span><span>' + (left ? 'あと ' + left + 'こ' : '🎉 コンプ！') + '</span></div>' +
        (chips ? '<div class="restalk-list">' + chips + '</div>' : '<p class="fine" style="margin:2px 0">このステージを遊んでセリフを見つけよう！</p>');
      vb.classList.add('on');
    } else {
      vb.classList.remove('on');
      vb.innerHTML = '';
    }
  }
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
  tray: () => cvRect(panelL - 2, trayTop - 2, panelR - panelL + 4, CH - trayTop - 4),
  col: j => j >= 0 && G.s ? cvRect(trayX(j) - headSize * 0.64, trayHeadY - headSize * 0.50, headSize * 1.28, headSize * 1.00) : null,
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
    { mode: 'tap', col: tutCol, at: tcol, t: '光っている箱をタップして、アリさんにキャンディを運んでもらおう！' },
    { mode: 'tap', col: tutCol, at: tcol, delay: 0.9, t: '外側から順番に運べるよ！つぎの箱もタップしよう。' },
    { at: TR.slots, delay: 0.7, t: '箱は上に5つまで置けるよ。アリさんが全員出発すると空くから、ぜんぶ運んで絵を完成させよう！' }
  ] },
  hold: { lv: 1, steps: () => [
    { mode: 'hold', col: tutCol, at: tcol, t: '光っている箱を「長押し」すると、運べるキャンディが事前にわかるよ！' },
    { mode: 'until', until: () => !G.press && !G.preview, at: TR.board, t: '光ったぶんが運べるキャンディ！指をはなしたら、タップして運ぼう。' },
    { mode: 'tap', col: tutCol, at: tcol, t: '迷ったら長押し！そのままタップしてみよう。' }
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
      else if (above >= bh + 30) {
        y = r.y - bh - 22; dir = 'down';
        if (act && typeof TR !== 'undefined' && TR.slots) {
          const sr = TR.slots();
          if (sr && y < sr.y + sr.h && y + bh > sr.y && sr.y - bh - 12 >= 8) y = sr.y - bh - 12;
        }
      }
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
      else if (['colony', 'missions', 'skins', 'bingo'].includes(G.overlay)) closeMeta();
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
on('#bScan', () => { Sound.init(); doScan(); });
on('#bSet', () => { G.fromTitle = false; showOv('settings'); });
on('#bSetClose', back);
on('#bSetHome', () => { Sound.init(); showOv('title'); });
on('#bHome', () => { Sound.init(); showOv('title'); });
on('#bClearHome', () => { Sound.init(); showOv('title'); });
on('#bJamHome', () => { Sound.init(); showOv('title'); });
on('#bAlbumHome', () => { Sound.init(); showOv('title'); });
on('#coinPill', () => { if (!G.overlay) { Sound.init(); showOv('title'); } });
on('#bMQueen', () => { Sound.init(); openColony('title'); });
on('#bMMis', () => { Sound.init(); openMissions('title'); });
on('#bMBingo', () => { Sound.init(); openBingo('title'); });
on('#bMSkin', () => { Sound.init(); openSkins('title'); });
on('#bClearQueen', () => openColony('clear'));
on('#bFeed', () => doFeed(false));
on('#bFeedAll', () => doFeed(true));
on('#qCv', () => { G.qBounce = 1; Sound.squeak(); $('#qSay').textContent = '👑「' + talkLine('queen') + '」'; });
on('#bQClose', closeMeta);
on('#bMisClose', closeMeta);
on('#bBingoClose', closeMeta);
on('#bBingoClaim', () => { Sound.init(); claimBingo(); });
on('#bSkClose', closeMeta);
on('#bGacha', () => { Sound.init(); doGacha(); });
on('#bDayOk', () => {
  Sound.init();
  const P = G.dailyP;
  if (P) {
    save.daily = { day: dayKey(), streak: P.st };
    save.coins += P.coins;
    save.hintT++;
    save.scanT++;
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
  if (G.level && G.level.custom) {
    G.reveal = null; G.clearTok++;
    if (window.AF_openMaker) window.AF_openMaker(); else showOv('title');
    return;
  }
  const id = G.levelId, nx = nextOf(id);
  if (save.newArts.indexOf(id) >= 0) flyToAlbum(id);
  G.reveal = null; G.clearTok++;
  hideOv();
  if (!nx) openAlbum(false); else loadLevel(nx);
});
on('#bReplay', () => {
  G.reveal = null; G.clearTok++; updateBadge(); hideOv();
  if (G.level && G.level.custom && G.customArt && window.AF_loadCustomLevel) window.AF_loadCustomLevel(G.customArt);
  else loadLevel(G.levelId);
});
on('#bClearShare', async () => {
  Sound.tap();
  const s = G.lastShare || { pos: 1, name: '', stars: 3, sec: 0, custom: false, url: 'https://hirocast.github.io/antflow/' };
  const stars = '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars);
  const text = s.custom
    ? 'アントフローのオリジナルステージ「' + (s.name || 'オリジナル') + '」を ' + stars + '（' + s.sec + '秒）でクリア！🐜🍬\n#アントフロー'
    : 'アントフロー レベル' + s.pos + (s.name ? '「' + s.name + '」' : '') + 'を ' + stars + '（' + s.sec + '秒）でクリア！🐜🍬\n#アントフロー #ブラウザゲーム';
  const url = s.url || 'https://hirocast.github.io/antflow/';
  if (navigator.share) {
    try { await navigator.share({ title: 'アントフロー｜ありんこ隊のおはこびパズル', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const xUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
  const w = window.open(xUrl, '_blank', 'noopener');
  if (!w && navigator.clipboard) {
    navigator.clipboard.writeText(text + '\n' + url).then(() => toast('シェア文をコピーしたよ！')).catch(() => {});
  }
});
on('#bCfCancel', () => {
  Sound.tap();
  const cf = G.cf; G.cf = null;
  if (cf && cf.prev) showOv(cf.prev); else hideOv();
});
on('#bCfOk', () => {
  Sound.init();
  const cf = G.cf; G.cf = null;
  if (!cf) { hideOv(); return; }
  if (cf.prev) showOv(cf.prev); else hideOv();
  cf.onOk();
});
on('#bJamUndo', doUndo);
on('#bJamRetry', doRetry);
on('#bJamClose', () => { G.jamDismissed = true; G.rewindTok++; hideOv(); });
on('#bJamRewind', () => {
  const t = G.rewindTo;
  if (t < 0 || t >= G.undo.length) return;
  const info = payInfo('rewind');
  if (!info.ok) { pay('rewind'); return; }
  const n = G.undo.length - t;
  confirmSpend({
    title: '⏪ すこしもどす',
    desc: 'まだクリアできる手前（' + n + '手まえ）まで一気にもどしてやり直せます。',
    cost: info.cost,
    okLabel: 'もどす！'
  }, () => {
    if (t < 0 || t >= G.undo.length) return;
    if (!pay('rewind')) return;
    G.rewindTok++;
    G.s = G.undo[t]; G.undo.length = t; G.moves.length = t; G.queued = null;
    if (G.run) G.run.undos++;
    resetVisual(); hideOv(); Sound.undo(); updateTip();
    toast('⏪ ' + n + '手もどしたよ。ここからなら解ける！', 2600);
  });
});
const SEEN_VER_KEY = 'antflow-seen-ver';
const appUpd = { checked: false, lastCheck: 0, hasUpdate: false, data: null, openHist: false, showAllHist: false, justUpdated: false, busy: false };
function escUpd(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
async function execAppUpdateNow() {
  if (appUpd.busy) return;
  appUpd.busy = true;
  const b = $('#bAppUpdate'), bt = $('#bTitleUpdate');
  if (b) { b.disabled = true; b.textContent = '🔄 更新中…'; }
  if (bt) { bt.disabled = true; bt.textContent = '🔄 更新中…'; }
  toast('🔄 最新版を取得しています…', 5000);
  const files = [location.pathname, 'index.html', 'version.json', 'style.css', 'boot.js', 'boot_check.js', ...(window.AF_FILES || [])];
  await Promise.all(files.map(f => fetch(f, { cache: 'reload' }).catch(() => {})));
  const u = new URL(location.href);
  u.searchParams.set('u', String(Date.now()));
  location.replace(u.toString());
}
function runAppUpdate() {
  const d = appUpd.data;
  const noteHint = appUpd.hasUpdate && d && d.headline ? '【新機能】' + d.headline + ' ／ ' : '';
  confirmSpend({
    title: appUpd.hasUpdate ? '🔴 新しいバージョンに更新' : '🔄 アプリを最新に更新',
    desc: noteHint + 'サーバーから最新のプログラムやステージデータを取得しなおして、アプリを再読み込みします。プレイ中の盤面はリセットされますが、クリア状況・コイン・アルバム・女王さまなどのセーブデータは消えません。',
    costText: 'セーブデータはそのまま保持されます（通信が発生します）',
    okLabel: '更新する！'
  }, execAppUpdateNow);
}
function parseUpdDate(dateStr, fallbackDate, timeStr) {
  const s = String(dateStr || fallbackDate || '').trim();
  let ms = 0;
  const mFull = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (mFull) ms = Date.UTC(+mFull[1], +mFull[2] - 1, +mFull[3]);
  else {
    const mMd = s.match(/^(\d{1,2})[\/\-](\d{1,2})/);
    if (mMd) {
      const fb = String(fallbackDate || '').match(/^(\d{4})/);
      const y = fb ? +fb[1] : new Date().getFullYear();
      ms = Date.UTC(y, +mMd[1] - 1, +mMd[2]);
    } else return Date.now();
  }
  const tm = String(timeStr || '').match(/^(\d{1,2}):(\d{2})$/);
  if (tm) ms += ((+tm[1]) * 60 + (+tm[2])) * 60000 - 9 * 3600000;
  return ms;
}
function syncUpdatesToInbox(data) {
  if (!data) return;
  if (typeof window.AF_pushInboxItem !== 'function') {
    setTimeout(() => syncUpdatesToInbox(data), 400);
    return;
  }
  const hist = Array.isArray(data.history) && data.history.length
    ? data.history.slice(0, 30)
    : [{ version: data.version, date: data.date, time: data.time, title: data.headline || '最新アップデート', notes: data.notes || [] }];
  // 古い順に unshift して、おてがみ箱の上から新しい順に並べる（最新1件のみ未読、過去履歴は既読アーカイブ）
  for (let i = hist.length - 1; i >= 0; i--) {
    const h = hist[i];
    if (!h || !h.version) continue;
    const notes = Array.isArray(h.notes) ? h.notes : [];
    const tag = [h.date ? String(h.date).replace(/^\d{4}\//, '') : '', h.time || ''].filter(Boolean).join(' ');
    const body = (notes.length ? notes.map(n => '・' + n).join('\n') : (data.headline || 'アプリがアップデートされました！')) +
      '\n\n※ アントフローはこれからもどんどん新機能を追加していくよ！';
    window.AF_pushInboxItem({
      id: 'upd-' + h.version,
      kind: 'update',
      badge: '🚀 アップデート',
      title: '【更新】' + (h.title || data.headline || '最新アップデート') + (tag ? '（' + tag + '）' : ''),
      body,
      at: parseUpdDate(h.date, data.date, h.time) + (hist.length - i) * 1000,
      read: i > 0
    });
  }
}
function renderUpdateBox() {
  const box = $('#homeUpdateBox');
  const setDot = $('#setUpdDot');
  const setBtn = $('#bAppUpdate');
  if (setDot) setDot.classList.toggle('on', appUpd.hasUpdate);
  if (setBtn && !appUpd.busy) {
    setBtn.textContent = appUpd.hasUpdate ? '🔴 NEW! アプリを最新に更新（新機能あり）' : '🔄 アプリを最新に更新';
  }
  if (!box) return;
  const d = appUpd.data, curVer = window.AF_APP_VER || '';
  const shortDate = d && d.date ? d.date.replace(/^\d{4}\//, '') : '';
  const verLabel = [shortDate, d && d.time ? d.time : ''].filter(Boolean).join(' ');
  box.classList.toggle('has-new', appUpd.hasUpdate);
  let html = '<div class="upd-top"><div class="upd-left">';
  if (appUpd.hasUpdate) {
    html += '<span class="upd-badge">🔴 NEW! 更新あり</span>';
    if (verLabel) html += '<span style="font-size:10.5px;font-weight:900;color:#c03060">' + escUpd(verLabel) + '</span>';
    html += '</div><button type="button" class="upd-btn" id="bTitleUpdate">🔄 今すぐ更新！</button></div>';
  } else if (appUpd.checked && d) {
    html += '<span class="upd-badge">✨ 最新版' + (verLabel ? ' ' + escUpd(verLabel) : '') + '</span>';
    html += '</div><div style="display:flex;gap:4px;flex:0 0 auto">' +
      '<button type="button" class="upd-hist-btn" data-upd="recheck">🔄 更新確認</button>' +
      '<button type="button" class="upd-hist-btn" data-upd="hist">📜 履歴 ' + (appUpd.openHist ? '▲' : '▼') + '</button>' +
      '</div></div>';
  } else {
    html += '<span class="upd-badge">✨ 更新を確認中…</span></div>' +
      '<button type="button" class="upd-hist-btn" data-upd="recheck">🔄 更新確認</button></div>';
  }

  // 更新が必要な人には、更新内容をそのまま自動で表示してお知らせ
  if (appUpd.hasUpdate && d) {
    const notes = Array.isArray(d.notes) ? d.notes : [];
    html += '<div class="upd-notes">';
    if (d.headline) html += '<div class="upd-hl">✨ ' + escUpd(d.headline) + '</div>';
    if (notes.length) html += '<ul class="upd-ul">' + notes.map(n => '<li>' + escUpd(n) + '</li>').join('') + '</ul>';
    html += '<div class="upd-sub">※「今すぐ更新！」で最新版になります（セーブデータは消えません）</div></div>';
  } else if (d && (appUpd.justUpdated || appUpd.openHist)) {
    html += '<div class="upd-notes">';
    if (appUpd.justUpdated && !appUpd.openHist) {
      const notes = Array.isArray(d.notes) ? d.notes : [];
      html += '<div class="upd-hl">🎉 最新版（' + escUpd(verLabel || curVer) + '）にアップデートしました！<button type="button" class="upd-ok" data-upd="ok">OK</button></div>';
      if (notes.length) html += '<ul class="upd-ul">' + notes.map(n => '<li>' + escUpd(n) + '</li>').join('') + '</ul>';
    } else {
      const hist = Array.isArray(d.history) && d.history.length ? d.history : [{ version: d.version, date: shortDate, time: d.time, title: d.headline || '最新アップデート', notes: d.notes || [] }];
      const shown = appUpd.showAllHist ? hist : hist.slice(0, 5);
      html += '<div class="upd-hl">🚀 どんどん進化中！' + (appUpd.showAllHist ? 'すべてのアップデート履歴' : '最近のアップデート') + '</div>';
      html += shown.map(h => {
        const tag = [h.date, h.time].filter(Boolean).join(' ');
        return '<div class="upd-hitem"><b>' + (tag ? '[' + escUpd(tag) + '] ' : '') + escUpd(h.title || '') + '</b>' +
          (Array.isArray(h.notes) && h.notes.length ? '<ul class="upd-ul">' + h.notes.map(n => '<li>' + escUpd(n) + '</li>').join('') + '</ul>' : '') +
          '</div>';
      }).join('');
      if (hist.length > 5) {
        html += '<div style="margin-top:6px;text-align:center"><button type="button" class="upd-hist-btn" data-upd="more">' +
          (appUpd.showAllHist ? '▲ 最新の5件だけ表示' : '📜 古い履歴もすべて見る（あと' + (hist.length - 5) + '件）') + '</button></div>';
      }
      html += '<div class="upd-sub" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span>💌 おてがみ箱にも残るよ</span><button type="button" class="upd-hist-btn" data-upd="recheck">🔄 更新を確認</button></div>';
    }
    html += '</div>';
  }
  box.innerHTML = html;
}
async function checkAppUpdate(force) {
  const now = Date.now();
  if (!force && now - appUpd.lastCheck < 60000) return appUpd.hasUpdate;
  appUpd.lastCheck = now;
  try {
    const res = await fetch('version.json?_=' + now, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || !data.version) return false;
    appUpd.data = data;
    appUpd.checked = true;
    const curVer = window.AF_APP_VER || '';
    appUpd.hasUpdate = !curVer || data.version !== curVer;
    if (!appUpd.hasUpdate && curVer) {
      let seen = '';
      try { seen = localStorage.getItem(SEEN_VER_KEY) || ''; } catch (e) {}
      if (seen && seen !== curVer) appUpd.justUpdated = true;
      else if (!seen) { try { localStorage.setItem(SEEN_VER_KEY, curVer); } catch (e) {} }
    }
    syncUpdatesToInbox(data);
    renderUpdateBox();
    return appUpd.hasUpdate;
  } catch (e) {
    renderUpdateBox();
    return false;
  }
}
const homeUpdEl = $('#homeUpdateBox');
if (homeUpdEl) {
  homeUpdEl.addEventListener('click', async e => {
    const histBtn = e.target.closest('[data-upd="hist"]');
    if (histBtn) { Sound.tap(); appUpd.openHist = !appUpd.openHist; renderUpdateBox(); return; }
    const moreBtn = e.target.closest('[data-upd="more"]');
    if (moreBtn) { Sound.tap(); appUpd.showAllHist = !appUpd.showAllHist; renderUpdateBox(); return; }
    const okBtn = e.target.closest('[data-upd="ok"]');
    if (okBtn) {
      Sound.tap();
      appUpd.justUpdated = false;
      try { if (window.AF_APP_VER) localStorage.setItem(SEEN_VER_KEY, window.AF_APP_VER); } catch (er) {}
      renderUpdateBox();
      return;
    }
    const recheckBtn = e.target.closest('[data-upd="recheck"]');
    if (recheckBtn) {
      Sound.tap();
      recheckBtn.textContent = '確認中…';
      const found = await checkAppUpdate(true);
      if (!found) toast('✨ すでに最新版です！');
      return;
    }
    if (e.target.closest('#bTitleUpdate')) {
      Sound.tap();
      execAppUpdateNow();
    }
  });
}
renderUpdateBox();
checkAppUpdate(true);
on('#bAppUpdate', runAppUpdate);
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
  if (!document.hidden) checkAppUpdate(false);
});
if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(stage); else window.addEventListener('resize', layout);
if (/[?&]dev\b/.test(location.search)) { save.settings.dev = true; persist(); }

/* ================= メインループ ================= */
let lastT = performance.now(), lastDrawT = 0, lastOvDrawT = 0;
const afPerf = { avgMs: 0, slowCnt: 0, maxMs: 0 };
function frame(now) {
  const rawMs = now - lastT;
  if (rawMs > 0 && rawMs < 2000) {
    afPerf.avgMs = afPerf.avgMs ? afPerf.avgMs * 0.96 + rawMs * 0.04 : rawMs;
    if (rawMs > 80) afPerf.slowCnt++;
    if (rawMs > afPerf.maxMs) afPerf.maxMs = rawMs;
  }
  const rdt = Math.min(0.05, Math.max(0, rawMs / 1000));
  lastT = now;
  G.rt += rdt;
  let dt = rdt * G.speed;
  const h = G.s && !G.pendingJam ? headsOf(G.s) : null;
  if (G.s && !G.pendingJam) {
    if (G.s.left === 0) dt *= 2.5;
    else if ((h && h.length === 1) || (G.level && G.s.left <= Math.max(12, Math.floor(G.level.total * 0.15)) && h && !h.length)) dt *= 2.2;
  }
  if (G.slowmo > 0) { G.slowmo -= rdt; dt *= 0.3; }
  if (h && h.length === 1 && !G.overlay && !G.loading && !G.pendingWin && !G.pendingJam && !G.auto && !G.press && !Tut.blocking()) {
    if (!G.oneColNotified) { G.oneColNotified = true; G.oneColT = G.rt + 0.25; toast('⚡ のこり1列！自動でおかたづけするよ', 2000); }
    else if (G.rt >= G.oneColT && !G.queued && G.s.boxes.length < SLOT_COUNT) { onTapCol(h[0]); G.oneColT = G.rt + 0.14; }
  }
  try {
    if (G.s && CW > 0) {
      G.time += dt;
      const R = G.run;
      // タイム：最初のタップから全部運び終わる（論理的に）まで。メニューやチュートリアルの説明中は止まる
      if (R && R.started && !R.done && !G.overlay && !G.loading && !Tut.busy()) R.time += rdt;
      if (G.fever.t > 0 && !G.overlay && !Tut.busy()) { G.fever.t -= rdt; if (G.fever.t <= 0) endFever(); }
      updateBoxes(dt); updateAnts(dt, rdt); updateParts(dt);
      Sound.walk(G.overlay ? 0 : G.ants.length);
      for (let j = 0; j < G.trayOff.length; j++) { G.trayOff[j] *= Math.exp(-rdt * 16); if (G.trayOff[j] < 0.3) G.trayOff[j] = 0; }
      G.nestBounce = Math.max(0, G.nestBounce - rdt * 5);
      G.slotFlash = Math.max(0, G.slotFlash - rdt);
      G.jamShake = Math.max(0, G.jamShake - rdt);
      if (G.shake) { G.shake.t -= rdt; if (G.shake.t <= 0) G.shake = null; }
      checkEnd(rdt);
      if (G.hudDirty) updateHUD();
      updateTimer();
      if ((!G.overlay || G.boardDirty) && now - lastDrawT >= 14.5) {
        lastDrawT = now;
        draw();
      }
    }
    if (G.reveal && G.overlay === 'clear') drawReveal(rdt);
    if (G.overlay && now - lastOvDrawT >= 32) {
      lastOvDrawT = now;
      if (G.overlay === 'title') drawMascot($('#mascot'), G.rt);
      else if (G.overlay === 'load') drawMascot($('#loadCv'), G.rt * 1.6);
      else if (G.overlay === 'colony') drawColony($('#qCv'), G.rt);
      else if (G.overlay === 'skins') drawSkinPrev($('#skCv'), G.rt);
      else if (G.overlay === 'help') drawHelp($('#hCv'), HELP_PAGES[G.helpPage || 0].k, G.rt - (G.helpT || 0));
    }
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
(function buildTitleLogo() {
  const el = $('#ttl');
  if (!el) return;
  el.innerHTML = '';
  const word = document.createElement('div');
  word.className = 'ttl-word';
  const rots = [-4, 3, -2.5, 3, -3.5, 2.5];
  [...'アントフロー'].forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.color = POP[i % POP.length];
    s.style.setProperty('--r', rots[i % rots.length] + 'deg');
    s.style.animationDelay = (i * 0.06) + 's, ' + (0.6 + i * 0.14) + 's';
    word.appendChild(s);
  });
  const sub = document.createElement('div');
  sub.className = 'ttl-sub';
  sub.textContent = 'ANTFLOW';
  el.appendChild(word);
  el.appendChild(sub);
})();
updateBadge(); updateCoins(); applyDev(); refreshPrices();
loadLevel(save.level);
if (gotCount() === 0 && !save.daily.day) startPlay(); else if (dailyCheck()) showDaily(); else showOv('title');
layout();
/* ================= ホーム画面追加（アプリ化）ガイド ================= */
(function initA2HS() {
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const ua = navigator.userAgent || '';
  const isInApp = /Line\/|LIFF|Instagram|FBAN|FBAV|Twitter|MicroMessenger/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid;
  let deferredPrompt = null, prevOv = 'title';

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    refreshA2hsBtns();
  });

  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.id = 'ov-a2hs';
  ov.innerHTML =
    '<div class="card">' +
    '<img src="apple-touch-icon.png" alt="アントフロー" style="width:68px;height:68px;border-radius:16px;box-shadow:0 4px 10px rgba(90,61,92,.2);margin:0 auto 6px;display:block">' +
    '<h2>📲 アプリとして保存しよう</h2>' +
    '<p class="fine" style="margin-bottom:8px">ホーム画面に追加すると、ツールバーが消えて<b>広い画面</b>で遊べるよ！<br><span style="color:#d4507c">※ いまのブラウザ（LINEやSafari等）のセーブデータはアプリ版には引き継がれないため、早めの追加がおすすめです。</span></p>' +
    '<div id="a2hsBody" style="background:#fff;border-radius:14px;padding:10px 12px;margin:6px 0;text-align:left;font-size:12px;line-height:1.7;border:2px solid #ffd3e2"></div>' +
    '<button class="big" id="bA2hsInstall" style="display:none">📲 ワンタップでアプリ化</button>' +
    '<button class="big sec" id="bA2hsCopy" style="display:none">📋 URLをコピーする</button>' +
    '<button class="big sec" id="bA2hsClose">とじる</button>' +
    '</div>';
  document.body.appendChild(ov);

  function renderA2hsBody() {
    const body = $('#a2hsBody'), inst = $('#bA2hsInstall'), cp = $('#bA2hsCopy');
    inst.style.display = deferredPrompt ? '' : 'none';
    cp.style.display = isInApp ? '' : 'none';
    if (isInApp) {
      body.innerHTML = (isIOS
        ? '<div><b style="color:#e46a92">いまアプリ内ブラウザで開いています！</b></div>' +
          '<div><b>①</b> 画面下の <b>「⋯」「⋮」</b>（または共有）＞<b>「Safari / ブラウザで開く」</b></div>' +
          '<div><b>②</b> Safariで開いたら、下の <b>「□↑（共有）」</b>＞<b>「ホーム画面に追加」</b></div>'
        : '<div><b style="color:#e46a92">いまアプリ内ブラウザで開いています！</b></div>' +
          '<div><b>①</b> 右上・右下の <b>「⋮」「⋯」</b>＞<b>「他のアプリで開く（Chrome）」</b></div>' +
          '<div><b>②</b> Chromeで開いたら、右上の <b>「⋮」</b>＞<b>「ホーム画面に追加」</b></div>') +
        '<div style="margin-top:4px;color:#8a6a7a;font-size:11px">※「ブラウザで開く」が見つからないときは、下の<b>「📋 URLをコピーする」</b>を押して Safari / Chrome のアドレス欄に貼り付けて開いてね！</div>';
    } else if (isIOS) {
      body.innerHTML =
        '<div><b>①</b> 画面下の共有ボタン <b>「□↑」</b> をタップ</div>' +
        '<div><b>②</b> 下にスクロールして <b>「ホーム画面に追加」</b> をタップ</div>' +
        '<div><b>③</b> 右上の <b>「追加」</b> を押すと、可愛いアイコンがホームにできるよ！</div>';
    } else if (isAndroid) {
      body.innerHTML = deferredPrompt
        ? '<div>下の <b>「📲 ワンタップでアプリ化」</b> を押すだけでホーム画面に追加できるよ！</div>'
        : '<div><b>①</b> ブラウザ右上の <b>「⋮」</b> メニューをタップ</div>' +
          '<div><b>②</b> <b>「ホーム画面に追加」</b>（または「アプリをインストール」）をタップ</div>';
    } else {
      body.innerHTML = '<div>スマホの Safari / Chrome から開いて「ホーム画面に追加」すると、アプリのように遊べます！</div>';
    }
  }

  function openA2hs(from) {
    prevOv = from || G.overlay || 'title';
    renderA2hsBody();
    showOv('a2hs');
  }
  function refreshA2hsBtns() {
    const show = !isStandalone() && (isMobile || !!deferredPrompt);
    const bt = $('#bTitleA2hs'), bc = $('#bClearA2hs');
    if (bt) {
      bt.style.display = show ? '' : 'none';
      bt.textContent = isInApp ? '⚠️ Safari/Chromeで開いてアプリ化しよう' : '📲 ホーム画面に追加して広く遊ぶ';
    }
    if (bc) bc.style.display = show ? '' : 'none';
  }
  refreshA2hsBtns();

  on('#bTitleA2hs', () => openA2hs('title'));
  on('#bClearA2hs', () => openA2hs('clear'));
  on('#bSetA2hs', () => openA2hs('settings'));
  on('#bA2hsClose', () => { if (prevOv && prevOv !== 'a2hs') showOv(prevOv); else hideOv(); });
  on('#bA2hsCopy', () => {
    const url = 'https://hirocast.github.io/antflow/';
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('URLをコピーしたよ！SafariやChromeに貼ってね')).catch(() => prompt('このURLをコピーしてね：', url));
    else prompt('このURLをコピーしてね：', url);
  });
  on('#bA2hsInstall', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const res = await deferredPrompt.userChoice;
    deferredPrompt = null;
    refreshA2hsBtns();
    if (res && res.outcome === 'accepted') { toast('ホーム画面に追加したよ！'); hideOv(); }
    else renderA2hsBody();
  });
})();

/* ================= ユーザー要望・不具合ポスト ================= */
(function initFeedback() {
  const FB_API = (window.AF_FEEDBACK_API || 'https://antflow.hiroshi-artcast.workers.dev/feedback').trim();
  const FB_SENT_KEY = 'antflow-fb-sent-v1';
  const FB_NICK_KEY = 'antflow-fb-nick-v1';
  const FB_CAMP_KEY = 'antflow-fb-camp-v1';
  // 当面の要望・不具合報告 お礼キャンペーン設定（終了時は active: false にするだけ）
  const FB_CAMPAIGN = {
    active: true,
    id: 'open-thanks-v1',
    maxTotal: 5,
    minChars: 6,
    base: { c: 300, t: 1, h: 1, s: 1 },
    imgBonus: { c: 100 },
    makerBonus: { c: 200, t: 1 }
  };
  const CATS = [
    ['maker', '🎨 つくる要望・不具合'],
    ['bug', '🐛 不具合・重い報告'],
    ['idea', '💡 新機能アイデア'],
    ['other', '💌 ステージ希望・感想']
  ];
  const MAKER_CHIPS = [
    ['draw', '🖌️ 描きやすさ・ツール'],
    ['bgm', '🎵 BGM作成の改善'],
    ['share', '🔗 シェア・友達招待'],
    ['post', '📮 投稿・みんなの絵'],
    ['viral', '✨ もっと楽しくなる案'],
    ['mbug', '🐛 つくる画面の不具合']
  ];
  const BUG_SYMPTOMS = [
    ['layout', '🖼️ 画面の崩れ・切れ'],
    ['tap', '👆 押せない・無反応'],
    ['lag', '🐢 重い・カクつく'],
    ['audio', '🔇 音・BGMがおかしい'],
    ['freeze', '❄️ 固まった・進めない'],
    ['save', '💾 記録・報酬の異常']
  ];
  const BUG_SCENES = [
    ['title', '🏠 ホーム画面'],
    ['play', '🎮 パズルプレイ中'],
    ['maker', '🎨 メーカー・投稿'],
    ['other', '🎵 BGM・きせかえ他']
  ];
  const MAKER_OVS = new Set(['maker', 'gallery', 'bgm', 'bgm-gal', 'bgm-builtin', 'stage-bgm', 'contest', 'award', 'posthelp', 'bgm-posthelp']);
  const OV_NAMES = {
    play: '🎮 パズルプレイ中',
    title: '🏠 ホーム画面',
    settings: '⚙️ 設定',
    album: '📒 アルバム',
    view: '🖼️ アルバム拡大表示',
    clear: '🎉 クリア画面',
    jam: '💦 渋滞画面',
    colony: '👑 女王さまのへや',
    missions: '📋 きょうのミッション',
    bingo: '🎯 セリフビンゴ',
    skins: '🎀 きせかえ',
    help: '📖 あそびかた',
    maker: '🎨 ステージメーカー',
    gallery: '🖼️ みんなの絵・マイ作品',
    contest: '🏆 コンテスト',
    award: '🏆 コンテスト表彰',
    inbox: '📬 おてがみ箱',
    bgm: '🎵 BGMメーカー',
    'bgm-gal': '🎶 みんなのBGM',
    'bgm-builtin': '🎼 公式BGM一覧',
    'stage-bgm': '🎵 ステージBGM選択',
    posthelp: '📤 ステージ投稿案内',
    'bgm-posthelp': '📤 BGM投稿案内',
    a2hs: '📲 ホーム画面に追加'
  };
  const PLACEHOLDERS = {
    maker: '例：こんな描き方ツールが欲しい／友達にシェアするときここが分かりにくい／こんな演出があったら自慢したくなる！（上の項目を選べば空欄でもOK）',
    idea: '例：こんな新機能があったら楽しそう！／ここがもっと使いやすいと嬉しい',
    bug: 'くわしい状況があればひとこと（上の症状を選べば、書かずにそのまま送ってもOK！）',
    other: '例：〇〇のステージを作ってほしい！／ありんこ隊への応援メッセージなど'
  };
  let selCat = 'maker', selScene = 'title', prevOv = 'title', sending = false, attachedImg = null, liveCtx = null;
  const selSyms = new Set(), selMaker = new Set();

  // 直近の操作ログ（ボタンID等の技術タグのみ・入力文字や個人情報は一切記録しない）
  const AF_ACT_LOG = [];
  function pushAct(tag) {
    if (!tag) return;
    const last = AF_ACT_LOG[AF_ACT_LOG.length - 1];
    const now = Date.now();
    if (last && last.tag === tag && now - last.t < 800) return;
    AF_ACT_LOG.push({ t: now, tag: String(tag).slice(0, 32) });
    if (AF_ACT_LOG.length > 12) AF_ACT_LOG.shift();
  }
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('button,[data-hub],[data-cat],[data-tab],[data-cv]') : null;
    if (!el || el.id === 'bQuickFb' || el.id === 'bHudFb' || el.closest('#ov-feedback')) return;
    const tag = el.id ? ('#' + el.id)
      : el.dataset.hub ? ('hub:' + el.dataset.hub)
      : el.dataset.tab ? ('tab:' + el.dataset.tab)
      : el.dataset.cv ? ('vote:' + el.dataset.cv)
      : el.dataset.cat ? ('cat:' + el.dataset.cat)
      : (el.className && typeof el.className === 'string' ? ('.' + el.className.trim().split(/\s+/)[0].slice(0, 20)) : el.tagName.toLowerCase());
    if (tag) pushAct(tag);
  }, { capture: true, passive: true });

  // どのオーバーレイ画面からも1タップで開ける常設「! 報告」ボタン
  const qfb = document.createElement('button');
  qfb.type = 'button';
  qfb.className = 'quick-fb';
  qfb.id = 'bQuickFb';
  qfb.setAttribute('aria-label', '要望・不具合報告');
  qfb.innerHTML = '<b>!</b><span>要望・不具合</span><i class="qdot"></i>';
  document.body.appendChild(qfb);

  const qbk = document.createElement('button');
  qbk.type = 'button';
  qbk.className = 'quick-back';
  qbk.id = 'bQuickBack';
  qbk.setAttribute('aria-label', 'もどる');
  qbk.textContent = '◀ もどる';
  const BACK_MAP = {
    settings: '#bSetClose', album: '#bAlbumClose', view: '#bViewBack',
    colony: '#bQClose', missions: '#bMisClose', bingo: '#bBingoClose',
    skins: '#bSkClose', maker: '#bMkClose', gallery: '#bGalClose',
    bgm: '#bgmCloseBtn', 'bgm-gal': '#bBgmGalClose', 'stage-bgm': '#bStBgmBack',
    'bgm-builtin': '#bBgmBuiltinBack', inbox: '#bInboxClose', clear: '#bClearHome',
    help: '#bHelpClose', dev: '#bDevClose', feedback: '#bFbClose',
    contest: '#bCtClose', a2hs: '#bA2hsClose', transfer: '#bTrClose',
    posthelp: '#bPostBack', 'bgm-posthelp': '#bBgmPostBack', stageerr: '#bStImpClose'
  };
  qbk.addEventListener('click', () => {
    const sel = BACK_MAP[G.overlay];
    const btn = sel ? $(sel) : null;
    if (btn) btn.click();
    else { Sound.tap(); showOv('title'); }
  });
  document.body.appendChild(qbk);

  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.id = 'ov-feedback';
  ov.innerHTML =
    '<div class="card">' +
    '<h2 style="font-size:18px;padding:6px 18px;margin-bottom:6px">💬 要望・不具合ポスト</h2>' +
    '<div class="fb-body" id="fbBody">' +
    '<div class="fb-ctx" id="fbCtxBadge" style="display:none"></div>' +
    '<div class="fb-camp" id="fbCamp" style="display:none"></div>' +
    '<div class="fb-thanks" id="fbThanks"></div>' +
    '<div class="fb-cats" id="fbCats">' +
    CATS.map(([k, lbl], i) => '<button type="button" class="fb-cat' + (i === 0 ? ' on' : '') + '" data-cat="' + k + '">' + lbl + '</button>').join('') +
    '</div>' +
    '<div class="fb-bugbox" id="fbMakerBox">' +
      '<div class="fb-blbl">🎨「つくる・シェア」で気になること（1タップ複数選択OK）</div>' +
      '<div class="fb-chips" id="fbMakerChips">' +
        MAKER_CHIPS.map(([k, lbl]) => '<button type="button" class="fb-chip" data-mk="' + k + '">' + lbl + '</button>').join('') +
      '</div>' +
      '<div class="fb-auto-hint">🌟「こうしたら友達に送りたくなる！」「ここが描きにくい」など大歓迎！お礼も <b>🪙+' + FB_CAMPAIGN.makerBonus.c + '＆🎟️+' + FB_CAMPAIGN.makerBonus.t + '</b> 増量中✨</div>' +
    '</div>' +
    '<div class="fb-bugbox" id="fbBugBox">' +
      '<div class="fb-blbl">① 何が起きましたか？（選ぶだけで送信可）</div>' +
      '<div class="fb-chips" id="fbSyms">' +
        BUG_SYMPTOMS.map(([k, lbl]) => '<button type="button" class="fb-chip" data-sym="' + k + '">' + lbl + '</button>').join('') +
      '</div>' +
      '<div class="fb-blbl">② どこで起きましたか？（自動選択済み）</div>' +
      '<div class="fb-chips" id="fbScenes">' +
        BUG_SCENES.map(([k, lbl]) => '<button type="button" class="fb-chip" data-scene="' + k + '">' + lbl + '</button>').join('') +
      '</div>' +
    '</div>' +
    '<textarea id="fbText" class="fb-ta" maxlength="500" placeholder="' + PLACEHOLDERS.maker + '"></textarea>' +
    '<div class="fb-cnt"><span id="fbCnt">0</span> / 500</div>' +
    '<input type="file" id="fbFile" accept="image/*" style="display:none">' +
    '<div class="fb-imgrow">' +
      '<button type="button" class="fb-imgbtn" id="bFbPick">📷 スクショを選ぶ</button>' +
      '<button type="button" class="fb-imgbtn snap" id="bFbSnap" style="display:none">🎮 プレイ盤面を自動撮影</button>' +
    '</div>' +
    '<div class="fb-prev" id="fbPrev">' +
      '<img id="fbPrevImg" alt="添付画像プレビュー">' +
      '<div class="meta"><div id="fbPrevName">スクショ添付済み</div><div id="fbPrevInfo" style="font-size:10px;color:#8a6a7a;font-weight:700"></div></div>' +
      '<button type="button" class="fb-del" id="bFbDel">✕ 外す</button>' +
    '</div>' +
    '<input id="fbNick" class="fb-in" type="text" maxlength="16" placeholder="ニックネーム（空欄でもOK）">' +
    '<details class="fb-note-det"><summary>📋 送信される情報とご注意（タップで確認）</summary><div class="fb-note">' +
      '<div>・アカウント不要で送れます。<b>送信内容と添付スクショは開発者のみ閲覧できる非公開の管理ページに記録されます</b>が、本名・連絡先・スクショ内の通知など個人情報が映り込まないようご注意ください。</div>' +
      '<div>・原因調査のため、直前の画面・端末種別・画面サイズ・プレイ中の面・操作/エラー履歴などの技術情報のみ自動で添えられます（個人情報は送信されません）。</div>' +
      '<div>・不具合は確認のうえ改善に努めますが、<b>端末や環境によっては改善できない場合もあります</b>。</div>' +
      '<div>・<b>基本的には個別の返信は行っておりません</b>（対応内容はホームの「最近のアップデート」やおてがみ箱でお知らせします）。</div>' +
    '</div></details>' +
    '<div class="fb-hist" id="fbHist" style="display:none"></div>' +
    '</div>' +
    '<div class="fb-foot">' +
      '<div class="fb-scroll-hint">↕ 中身をスクロールして入力・スクショ添付できます</div>' +
      '<div class="cfrow"><button class="big" id="bFbSend">📮 送る！</button><button class="big sec" id="bFbClose">とじる</button></div>' +
    '</div>' +
    '</div>';
  document.body.appendChild(ov);

  function loadCamp() {
    try {
      const o = JSON.parse(localStorage.getItem(FB_CAMP_KEY) || 'null');
      if (o && o.id === FB_CAMPAIGN.id) return { id: o.id, count: Math.max(0, o.count | 0), lastDay: String(o.lastDay || '') };
    } catch (e) {}
    return { id: FB_CAMPAIGN.id, count: 0, lastDay: '' };
  }
  function saveCamp(st) {
    try { localStorage.setItem(FB_CAMP_KEY, JSON.stringify(st)); } catch (e) {}
  }
  function campStatus() {
    const st = loadCamp(), today = dayKey();
    const rem = Math.max(0, FB_CAMPAIGN.maxTotal - st.count);
    const todayDone = st.lastDay === today;
    return { st, today, rem, todayDone, eligible: FB_CAMPAIGN.active && rem > 0 && !todayDone };
  }
  function refreshFbCampaignUI() {
    const cs = campStatus();
    const bTitle = $('#bTitleFeedback'), bSet = $('#bSetFeedback');
    const tag = cs.eligible ? '<span class="fb-gift-tag">🎁お礼あり</span>' : '';
    if (bTitle) bTitle.innerHTML = '💬 要望・不具合を送る' + tag;
    if (bSet) bSet.innerHTML = '💬 要望・不具合を送る' + tag;
    const hfb = $('#bHudFb'), q = $('#bQuickFb');
    if (hfb) hfb.classList.toggle('gift', cs.eligible);
    if (q) q.classList.toggle('gift', cs.eligible);
    const box = $('#fbCamp');
    if (!box) return;
    if (!FB_CAMPAIGN.active) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    box.classList.toggle('done', !cs.eligible);
    if (cs.eligible) {
      box.innerHTML =
        '<div class="fb-camp-hd"><span class="fb-camp-pill">🎁 期間限定</span><span>お礼キャンペーン開催中！</span></div>' +
        '<div class="fb-camp-r">お礼：<span style="white-space:nowrap">🪙' + FB_CAMPAIGN.base.c + '</span>＋<span style="white-space:nowrap">🎟️おたからばこ×' + FB_CAMPAIGN.base.t + '</span>＋<span style="white-space:nowrap">💡ヒント×' + FB_CAMPAIGN.base.h + '</span>＋<span style="white-space:nowrap">🔍全部運べる×' + FB_CAMPAIGN.base.s + '</span></div>' +
        '<div class="fb-camp-sub">🎨 <b>「つくる」要望・不具合はさらに 🪙+' + FB_CAMPAIGN.makerBonus.c + '＆🎟️+' + FB_CAMPAIGN.makerBonus.t + '！</b><br>📷 スクショ添付でさらに <b>🪙+' + FB_CAMPAIGN.imgBonus.c + '</b>（1日1回／あと<b>' + cs.rem + '回</b>）</div>';
    } else if (cs.rem > 0 && cs.todayDone) {
      box.innerHTML =
        '<div class="fb-camp-hd"><span>🎁 お礼キャンペーン（本日分は受取済み ✅）</span></div>' +
        '<div class="fb-camp-sub">また明日送るとお礼がもらえます（残りあと' + cs.rem + '回）。要望・不具合の投稿はいつでもOK！</div>';
    } else {
      box.innerHTML =
        '<div class="fb-camp-hd"><span>🎉 お礼キャンペーン（' + FB_CAMPAIGN.maxTotal + '/' + FB_CAMPAIGN.maxTotal + '回）ぜんぶ受取済み！</span></div>' +
        '<div class="fb-camp-sub">たくさんの声をありがとう！引き続きご要望・不具合はいつでも送れます✨</div>';
    }
  }
  function loadSent() {
    try { const a = JSON.parse(localStorage.getItem(FB_SENT_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function saveSent(item) {
    const a = loadSent();
    a.unshift(item);
    try { localStorage.setItem(FB_SENT_KEY, JSON.stringify(a.slice(0, 5))); } catch (e) {}
  }
  function renderHist() {
    const el = $('#fbHist'), list = loadSent();
    if (!el) return;
    if (!list.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
    el.style.display = 'block';
    el.innerHTML = '<div class="upd-hl">📝 あなたが送った要望・報告（最近の5件）</div>' + list.map(x => {
      const cat = (CATS.find(c => c[0] === x.cat) || CATS[0])[1];
      const dt = x.at ? new Date(x.at).toLocaleDateString('ja-JP') : '';
      const imgTag = x.hasImg ? ' · 📷画像あり' : '';
      const giftTag = x.gift ? ' · 🎁お礼済' : '';
      return '<div class="fb-hitem"><b>' + escUpd(cat) + (dt ? ' · ' + escUpd(dt) : '') + imgTag + giftTag + '</b>' + escUpd(x.msg) + '</div>';
    }).join('');
  }
  function sceneFromOv(ovId) {
    if (!ovId || ovId === 'play' || ovId === 'clear' || ovId === 'jam' || ovId === 'load') return 'play';
    if (MAKER_OVS.has(ovId)) return 'maker';
    if (ovId === 'title') return 'title';
    return 'other';
  }
  function guessScene(originOv) {
    if (originOv && originOv !== 'settings' && originOv !== 'feedback') return sceneFromOv(originOv);
    for (let i = AF_BREADCRUMBS.length - 1; i >= 0; i--) {
      const c = AF_BREADCRUMBS[i];
      if (c === 'feedback' || c === 'settings') continue;
      if (c.startsWith('play')) return 'play';
      return sceneFromOv(c);
    }
    return prevOv === 'title' ? 'title' : 'play';
  }
  // 報告ボタンを押した瞬間の画面・盤面・メーカー状態を裏側で丸ごとスナップショット取得
  function captureLiveContext(originOv) {
    const key = originOv || 'play';
    const baseName = OV_NAMES[key] || ('画面:' + key);
    let sub = '';
    if (key === 'maker') {
      const sz = ($('#ov-maker .mksz.on')?.textContent || '').trim();
      const zm = ($('#mkZoomLbl')?.textContent || '').trim();
      const tools = [...document.querySelectorAll('#ov-maker .mktools button.on')].map(b => (b.textContent || '').trim()).filter(t => t && t !== sz).slice(0, 3);
      const refOn = $('#mkRefBar') && $('#mkRefBar').style.display !== 'none';
      const aiOn = $('#mkAiRes') && $('#mkAiRes').style.display !== 'none';
      const parts = [];
      if (sz) parts.push(sz);
      if (zm && zm !== '1x') parts.push('ズーム' + zm);
      if (tools.length) parts.push(tools.join('/'));
      if (refOn) parts.push('お手本ON');
      if (aiOn) parts.push('AI測定済');
      sub = parts.join(' · ');
    } else if (key === 'bgm') {
      const inst = $('#bgmInst') ? ($('#bgmInst').options[$('#bgmInst').selectedIndex]?.textContent || '') : '';
      const bpm = $('#bgmBpmVal') ? ('BPM' + $('#bgmBpmVal').textContent) : '';
      const md = ($('#bgmMode .on')?.textContent || '').trim();
      sub = [inst, bpm, md].filter(Boolean).join(' · ');
    } else if (key !== 'play') {
      const ovEl = $('#ov-' + key);
      if (ovEl) {
        const tabs = [...ovEl.querySelectorAll('.on')].map(el => (el.textContent || '').trim().replace(/\s+/g, ' ')).filter(t => t && t.length <= 18).slice(0, 3);
        if (tabs.length) sub = '選択中:' + tabs.join(' / ');
      }
    }
    let stageNote = '';
    if (G.level && G.s) {
      const slots = (G.s.boxes || []).map(b => (KEYS[b.c] || b.c) + ':' + b.rem).join(',');
      const stFlags = [];
      if (G.loading) stFlags.push('読込中');
      if (G.pendingWin) stFlags.push('クリア演出待ち');
      if (G.pendingJam) stFlags.push('渋滞中');
      stageNote = 'Lv.' + posOf(G.levelId) + ' ' + (G.level.name || '') +
        ' (id:' + G.levelId + (G.level.custom ? '/自作' : '') +
        ', ' + (G.level.W || G.s.W || '?') + 'x' + (G.level.H || G.s.H || '?') +
        ', のこり:' + G.s.left + '/' + G.level.total +
        ', スロット:' + G.s.boxes.length + '/' + SLOT_COUNT + (slots ? '[' + slots + ']' : '') +
        ', アリ:' + (G.ants ? G.ants.length : 0) +
        ', 速度:' + G.speed + 'x' +
        ', undo:' + (G.undo ? G.undo.length : 0) +
        (stFlags.length ? ', 状態:' + stFlags.join('/') : '') + ')';
    }
    if ((key === 'maker' || key === 'bgm') && sub) {
      stageNote = baseName + '[' + sub + ']' + (stageNote ? ' / ' + stageNote : '');
    }
    let originFull = baseName;
    if ((key === 'play' || key === 'clear' || key === 'jam') && G.level) {
      originFull += '（Lv.' + posOf(G.levelId) + ' ' + (G.level.name || '') + (G.s ? '・のこり' + G.s.left : '') + '）';
    } else if (sub) {
      originFull += '（' + sub + '）';
    }
    const snapKind = (key === 'maker' && $('#mkCv') && $('#mkCv').width > 0)
      ? 'maker'
      : ((G.s && CW > 0 && $('#game') && $('#game').width > 0) ? 'game' : '');
    return { key, originFull, stageNote, snapKind, isMakerOrigin: MAKER_OVS.has(key) };
  }
  function syncBugPanelUI() {
    const isBug = selCat === 'bug', isMaker = selCat === 'maker';
    const bBox = $('#fbBugBox'), mBox = $('#fbMakerBox');
    if (bBox) bBox.classList.toggle('on', isBug);
    if (mBox) mBox.classList.toggle('on', isMaker);
    $('#fbCats').querySelectorAll('.fb-cat').forEach(x => x.classList.toggle('on', x.dataset.cat === selCat));
    $('#fbSyms').querySelectorAll('.fb-chip').forEach(x => x.classList.toggle('on', selSyms.has(x.dataset.sym)));
    $('#fbMakerChips').querySelectorAll('.fb-chip').forEach(x => x.classList.toggle('on', selMaker.has(x.dataset.mk)));
    $('#fbScenes').querySelectorAll('.fb-chip').forEach(x => x.classList.toggle('on', x.dataset.scene === selScene));
    const ta = $('#fbText');
    if (ta && PLACEHOLDERS[selCat]) ta.placeholder = PLACEHOLDERS[selCat];
    const snap = $('#bFbSnap');
    if (snap) {
      const kind = liveCtx ? liveCtx.snapKind : '';
      snap.style.display = kind ? '' : 'none';
      if (kind === 'maker') snap.textContent = '🎨 作成中の絵を自動撮影';
      else if (kind === 'game') snap.textContent = '🎮 プレイ盤面を自動撮影';
    }
  }
  function parseUaEnv() {
    const ua = navigator.userAgent || '';
    let os = 'PC';
    const mAnd = ua.match(/Android\s*([0-9.]+)/i);
    const mIos = ua.match(/(?:iPhone OS|CPU OS)\s*([0-9_]+)/i);
    if (mAnd) os = 'Android ' + mAnd[1];
    else if (mIos) os = 'iOS ' + mIos[1].replace(/_/g, '.');
    else if (/iPad|iPhone|iPod/i.test(ua)) os = 'iOS';
    else if (/Windows NT/i.test(ua)) os = 'Windows';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';

    let br = 'Browser';
    const mLine = ua.match(/Line\/([0-9.]+)/i);
    const mIg = /Instagram/i.test(ua);
    const mFb = /FBAN|FBAV/i.test(ua);
    const mSam = ua.match(/SamsungBrowser\/([0-9.]+)/i);
    const mEdg = ua.match(/EdgA?\/([0-9.]+)/i);
    const mFx = ua.match(/(?:Firefox|FxiOS)\/([0-9.]+)/i);
    const mCr = ua.match(/(?:Chrome|CriOS)\/([0-9.]+)/i);
    const mSf = ua.match(/Version\/([0-9.]+).*Safari/i);
    if (mLine) br = 'LINE ' + mLine[1] + ' (アプリ内)';
    else if (mIg) br = 'Instagram (アプリ内)';
    else if (mFb) br = 'Facebook (アプリ内)';
    else if (mSam) br = 'Samsung ' + mSam[1];
    else if (mEdg) br = 'Edge ' + mEdg[1];
    else if (mFx) br = 'Firefox ' + mFx[1];
    else if (mCr) br = 'Chrome ' + mCr[1];
    else if (mSf) br = 'Safari ' + mSf[1];

    let model = '';
    if (mAnd) {
      const mm = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|[;)])/i);
      if (mm && mm[1] && !/^(?:K|wv|Mobile|Linux|U)$/i.test(mm[1].trim())) {
        model = mm[1].trim().slice(0, 40);
      }
    }
    return { os, br, model };
  }
  function detectDevice() {
    const { os, br, model } = parseUaEnv();
    return os + ' / ' + br + (model ? ' / ' + model : '') + ' / ' + innerWidth + 'x' + innerHeight + ' (DPR ' + (window.devicePixelRatio || 1).toFixed(1) + ')';
  }
  function collectDiagnostics() {
    const { os, br, model } = parseUaEnv();
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    const orient = innerWidth > innerHeight ? '横' : '縦';
    const display = innerWidth + 'x' + innerHeight + ' (DPR ' + (window.devicePixelRatio || 1).toFixed(1) + ' / ' + orient + ' / ' + (standalone ? 'PWA' : 'ブラウザ') + ')';

    const hwParts = [];
    if (navigator.hardwareConcurrency) hwParts.push('CPU:' + navigator.hardwareConcurrency + 'コア');
    if (navigator.deviceMemory) hwParts.push('RAM:' + navigator.deviceMemory + 'GB');
    if (navigator.onLine === false) hwParts.push('オフライン');
    else if (navigator.connection && navigator.connection.effectiveType) hwParts.push('ネット:' + navigator.connection.effectiveType);

    const avg = afPerf.avgMs ? afPerf.avgMs.toFixed(1) : '-';
    const fps = afPerf.avgMs ? Math.min(120, Math.round(1000 / afPerf.avgMs)) : '-';
    const perf = '平均' + avg + 'ms (約' + fps + 'fps) / 80ms超:' + afPerf.slowCnt + '回 / 最大' + Math.round(afPerf.maxMs) + 'ms';

    const stage = (liveCtx && liveCtx.stageNote) ? liveCtx.stageNote : ('直前画面:' + (prevOv || 'title'));

    const audio = 'BGM:' + (save.settings.bgm ? 'ON' : 'OFF') +
      ' / SE:' + (save.settings.se ? 'ON' : 'OFF') +
      ' / AudioCtx:' + (Sound && Sound.ctx ? Sound.ctx.state : '未起動');

    const loaded = (window.AF_LOADED ? window.AF_LOADED.length : 0) + '/' + (window.AF_FILES ? window.AF_FILES.length : 0);
    const miss = (window.AF_FILES || []).filter(f => (window.AF_LOADED || []).indexOf(f) < 0);
    let lsInfo = 'OK';
    try {
      const raw = localStorage.getItem(SAVE_KEY) || '';
      lsInfo = 'OK (' + Math.max(1, Math.round(raw.length / 1024)) + 'KB)';
    } catch (e) { lsInfo = '利用不可'; }
    const health = 'JS:' + loaded + (miss.length ? ' (欠損:' + miss.join(',') + ')' : '') + ' / 保存:' + lsInfo;

    const now = Date.now();
    const errors = (window.AF_ERR_LOG || []).slice(-6).map(x => {
      const ago = Math.max(0, Math.round((now - (x.t || now)) / 1000));
      return '[-' + ago + 's] ' + x.m;
    });
    const actions = AF_ACT_LOG.slice(-10).map(x => {
      const ago = Math.max(0, Math.round((now - x.t) / 1000));
      return x.tag + '(-' + ago + 's)';
    }).join(' → ');

    return {
      origin: liveCtx ? liveCtx.originFull : (OV_NAMES[prevOv] || prevOv || 'unknown'),
      env: os + ' / ' + br,
      model,
      display,
      hw: hwParts.join(' / '),
      perf,
      stage,
      audio,
      health,
      trail: AF_BREADCRUMBS.join(' → '),
      actions,
      errors
    };
  }
  function clearAttachment() {
    attachedImg = null;
    const f = $('#fbFile'), pv = $('#fbPrev'), im = $('#fbPrevImg'), btn = $('#bFbPick');
    if (f) f.value = '';
    if (pv) pv.classList.remove('on');
    if (im) im.removeAttribute('src');
    if (btn) btn.textContent = '📷 スクショを選ぶ';
  }
  function compressSourceToJpeg(src, w, h) {
    if (!w || !h) throw new Error('画像サイズを取得できませんでした');
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d');
    const attempts = [[720, 0.72], [720, 0.58], [600, 0.55], [480, 0.50], [380, 0.45], [320, 0.40]];
    for (const [maxSide, q] of attempts) {
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const nw = Math.max(1, Math.round(w * scale));
      const nh = Math.max(1, Math.round(h * scale));
      cv.width = nw; cv.height = nh;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, nw, nh);
      ctx.drawImage(src, 0, 0, nw, nh);
      const dataUrl = cv.toDataURL('image/jpeg', q);
      if (dataUrl && dataUrl.length <= 48000) {
        const kb = Math.max(1, Math.round(dataUrl.length * 0.75 / 1024));
        return { dataUrl, info: nw + 'x' + nh + ' / 約' + kb + 'KB' };
      }
    }
    throw new Error('画像サイズが大きすぎました。別の画像でお試しください');
  }
  function compressFeedbackImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || (file.type && !file.type.startsWith('image/'))) {
        reject(new Error('画像ファイルを選んでね'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('この画像は読み込めませんでした（PNG/JPEGでお試しください）'));
        img.onload = () => {
          try {
            resolve(compressSourceToJpeg(img, img.naturalWidth || img.width, img.naturalHeight || img.height));
          } catch (err) { reject(err); }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function showAttachedPreview(res, label) {
    attachedImg = res;
    const im = $('#fbPrevImg'), nm = $('#fbPrevName'), inf = $('#fbPrevInfo'), pv = $('#fbPrev'), btn = $('#bFbPick');
    if (im) im.src = res.dataUrl;
    if (nm) nm.textContent = label || 'スクショ添付済み';
    if (inf) inf.textContent = res.info + '（自動圧縮）';
    if (pv) pv.classList.add('on');
    if (btn) btn.textContent = '📷 別の画像に変更';
  }
  function openFeedback(from, opts) {
    const curOv = from !== undefined ? from : (G.overlay || 'play');
    prevOv = curOv || 'play';
    liveCtx = captureLiveContext(prevOv);
    selScene = guessScene(prevOv);
    if (opts && opts.defaultCat) selCat = opts.defaultCat;
    const ni = $('#fbNick');
    if (ni && !ni.value) {
      try { ni.value = localStorage.getItem(FB_NICK_KEY) || ''; } catch (e) {}
    }
    const th = $('#fbThanks');
    if (th) { th.classList.remove('on'); th.innerHTML = ''; }
    const ctxEl = $('#fbCtxBadge');
    if (ctxEl && liveCtx) {
      ctxEl.textContent = '📍 いまの画面を自動取得済み：' + liveCtx.originFull;
      ctxEl.style.display = 'block';
    }
    syncBugPanelUI();
    refreshFbCampaignUI();
    renderHist();
    showOv('feedback');
    if ($('#fbBody')) $('#fbBody').scrollTop = 0;
  }
  window.AF_openFeedback = openFeedback;

  $('#fbCats').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    Sound.tap();
    selCat = b.dataset.cat;
    syncBugPanelUI();
  });
  $('#fbSyms').addEventListener('click', e => {
    const b = e.target.closest('[data-sym]');
    if (!b) return;
    Sound.tap();
    const k = b.dataset.sym;
    if (selSyms.has(k)) selSyms.delete(k); else selSyms.add(k);
    b.classList.toggle('on', selSyms.has(k));
  });
  $('#fbMakerChips').addEventListener('click', e => {
    const b = e.target.closest('[data-mk]');
    if (!b) return;
    Sound.tap();
    const k = b.dataset.mk;
    if (selMaker.has(k)) selMaker.delete(k); else selMaker.add(k);
    b.classList.toggle('on', selMaker.has(k));
  });
  $('#fbScenes').addEventListener('click', e => {
    const b = e.target.closest('[data-scene]');
    if (!b) return;
    Sound.tap();
    selScene = b.dataset.scene;
    $('#fbScenes').querySelectorAll('.fb-chip').forEach(x => x.classList.toggle('on', x.dataset.scene === selScene));
  });
  $('#fbText').addEventListener('input', () => {
    const el = $('#fbCnt');
    if (el) el.textContent = String($('#fbText').value.length);
  });
  on('#bFbPick', () => { const f = $('#fbFile'); if (f) f.click(); });
  on('#bFbSnap', () => {
    const isMaker = liveCtx && liveCtx.snapKind === 'maker';
    const cv = isMaker ? $('#mkCv') : $('#game');
    if (!cv || !cv.width || !cv.height) { toast('撮影できる盤面がまだ表示されていません'); return; }
    try {
      const res = compressSourceToJpeg(cv, cv.width, cv.height);
      res.info += isMaker ? ' (メーカー自動撮影)' : ' (盤面自動撮影)';
      showAttachedPreview(res, isMaker ? '作成中の絵を自動撮影' : 'プレイ盤面を自動撮影');
      toast(isMaker ? '🎨 作成中の絵を自動撮影したよ！' : '🎮 いまのプレイ盤面を自動撮影したよ！');
    } catch (err) {
      toast('⚠️ ' + (err && err.message ? err.message : '撮影できませんでした'), 3000);
    }
  });
  on('#bFbDel', () => { clearAttachment(); toast('画像をはずしたよ'); });
  $('#fbFile').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const btn = $('#bFbPick');
    if (btn) btn.textContent = '📷 圧縮中…';
    try {
      const res = await compressFeedbackImage(file);
      showAttachedPreview(res, 'スクショ添付済み');
      toast('📷 スクショを添付したよ！');
    } catch (err) {
      clearAttachment();
      toast('⚠️ ' + (err && err.message ? err.message : '画像を添付できませんでした'), 3400);
    }
  });
  on('#bTitleFeedback', () => openFeedback('title', { defaultCat: 'maker' }));
  on('#bSetFeedback', () => openFeedback('settings'));
  on('#bHudFb', () => openFeedback('play', { defaultCat: 'bug' }));
  on('#bQuickFb', () => {
    const cur = G.overlay || 'play';
    const defCat = MAKER_OVS.has(cur) ? 'maker' : (cur === 'title' ? 'maker' : 'bug');
    openFeedback(cur, { defaultCat: defCat });
  });
  on('#bFbClose', () => {
    if (prevOv && prevOv !== 'feedback' && prevOv !== 'play') showOv(prevOv);
    else hideOv();
  });
  on('#bFbSend', async () => {
    if (sending) return;
    const ta = $('#fbText'), ni = $('#fbNick'), btn = $('#bFbSend');
    const msg = (ta ? ta.value : '').trim();
    const symptoms = selCat === 'bug'
      ? BUG_SYMPTOMS.filter(([k]) => selSyms.has(k)).map(([, lbl]) => lbl)
      : selCat === 'maker'
        ? MAKER_CHIPS.filter(([k]) => selMaker.has(k)).map(([, lbl]) => lbl)
        : [];
    const sceneLabel = selCat === 'bug'
      ? ((BUG_SCENES.find(([k]) => k === selScene) || BUG_SCENES[0])[1])
      : selCat === 'maker'
        ? (liveCtx && liveCtx.isMakerOrigin ? liveCtx.originFull : '🎨 つくる・シェア機能')
        : '';
    if (selCat === 'bug' || selCat === 'maker') {
      if (!symptoms.length && msg.length < 2) {
        toast('項目を1つタップするか、内容を2文字以上で書いてね！');
        return;
      }
    } else if (msg.length < 2) {
      toast('内容を2文字以上で書いてね！');
      if (ta) ta.focus();
      return;
    }
    const nick = (ni ? ni.value : '').trim();
    try { if (nick) localStorage.setItem(FB_NICK_KEY, nick); } catch (e) {}
    sending = true;
    btn.disabled = true; btn.textContent = '📮 送信中…';
    try {
      const progress = 'クリア ' + gotCount() + '/' + TOTAL + '面' + (G.level && G.level.name ? '（現在:' + G.level.name + '）' : '');
      const hasImg = !!attachedImg;
      const isMakerPost = selCat === 'maker' || !!(liveCtx && liveCtx.isMakerOrigin) || (selCat === 'bug' && selScene === 'maker');
      const payload = {
        category: selCat,
        message: msg,
        nick,
        version: window.AF_APP_VER || '',
        progress,
        device: detectDevice(),
        isMaker: isMakerPost,
        diag: collectDiagnostics()
      };
      if (symptoms.length) payload.symptoms = symptoms;
      if (sceneLabel) payload.scene = sceneLabel;
      if (attachedImg) {
        payload.image = attachedImg.dataUrl;
        payload.imageInfo = attachedImg.info;
      }
      const res = await fetch(FB_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast('⚠️ ' + (data.error || '送信に失敗しました。少し待って試してね'), 3400);
        return;
      }

      // お礼キャンペーンの付与判定（送信成功時のみ・6文字以上 or 症状/項目選択＋スクショ/ひとこと・1日1回・上限5回）
      const cs = campStatus();
      const qualifies = msg.length >= FB_CAMPAIGN.minChars || ((selCat === 'bug' || selCat === 'maker') && symptoms.length > 0 && (hasImg || msg.length >= 2));
      let rewarded = null;
      if (cs.eligible && qualifies) {
        rewarded = {
          c: (FB_CAMPAIGN.base.c || 0) + (hasImg ? (FB_CAMPAIGN.imgBonus.c || 0) : 0) + (isMakerPost ? (FB_CAMPAIGN.makerBonus.c || 0) : 0),
          t: (FB_CAMPAIGN.base.t || 0) + (isMakerPost ? (FB_CAMPAIGN.makerBonus.t || 0) : 0),
          h: FB_CAMPAIGN.base.h || 0,
          s: FB_CAMPAIGN.base.s || 0
        };
        grantReward(rewarded);
        persist();
        saveCamp({ id: FB_CAMPAIGN.id, count: cs.st.count + 1, lastDay: cs.today });
        updateCoins(true);
        renderTitle();
        Sound.fanfare();
        haptic(20);
        Fx.burst(innerWidth / 2, innerHeight * 0.35, 70, 420, ['star', 'conf', 'dot']);
        const rTxt = fmtReward(rewarded);
        const bonusNotes = [];
        if (isMakerPost) bonusNotes.push('🎨つくるボーナス🪙+' + FB_CAMPAIGN.makerBonus.c + '＆🎟️+' + FB_CAMPAIGN.makerBonus.t);
        if (hasImg) bonusNotes.push('📷スクショ🪙+' + FB_CAMPAIGN.imgBonus.c);
        const th = $('#fbThanks');
        if (th) {
          th.innerHTML = '🎁 ありがとう！お礼をプレゼントしたよ！<br>' + escUpd(rTxt) + (bonusNotes.length ? '<br><small style="font-size:10.5px;font-weight:800">（' + escUpd(bonusNotes.join(' / ')) + '込み！）</small>' : '');
          th.classList.add('on');
        }
        if (typeof window.AF_pushInboxItem === 'function') {
          window.AF_pushInboxItem({
            id: 'fb-thanks-' + cs.today + '-' + (cs.st.count + 1),
            kind: 'update',
            badge: '🎁 お礼プレゼント',
            title: (isMakerPost ? '「つくる」へのご意見のお礼を届けたよ！' : '要望・不具合報告のお礼を届けたよ！'),
            body: 'ご報告・ご要望ありがとう！\nお礼として ' + rTxt + ' をお渡ししました✨' +
              (bonusNotes.length ? '\n（' + bonusNotes.join('・') + ' を含むよ！）' : '') +
              '\n\nいただいた声は確認のうえ、今後のアップデートに活かしていくね！',
            at: Date.now(),
            read: true
          });
        }
        toast('🎁 お礼ゲット！ ' + rTxt, 4400);
      } else {
        Sound.albumIn();
        if (cs.eligible && !qualifies) {
          toast('🎉 届いたよ！ありがとう✨（お礼は' + FB_CAMPAIGN.minChars + '文字以上の記入、または項目選択＋スクショ/ひとことで受け取れるよ）', 4400);
        } else {
          toast('🎉 届いたよ！確認して今後の改善に活かすね✨', 3800);
        }
      }

      const histMsg = msg || (symptoms.join('／') + (sceneLabel ? '（' + sceneLabel + '）' : ''));
      saveSent({ cat: selCat, msg: histMsg, hasImg, gift: !!rewarded, at: Date.now() });
      if (ta) ta.value = '';
      if ($('#fbCnt')) $('#fbCnt').textContent = '0';
      selSyms.clear();
      selMaker.clear();
      clearAttachment();
      syncBugPanelUI();
      refreshFbCampaignUI();
      renderHist();
    } catch (e) {
      toast('⚠️ 通信エラー：ネット環境を確認してもう一度試してね', 3400);
    } finally {
      sending = false;
      btn.disabled = false; btn.textContent = '📮 送る！';
    }
  });

  refreshFbCampaignUI();
  syncQuickFbVis();
})();

/* ================= セーブデータ引継ぎ（1回限りコード方式） ================= */
(function initSaveTransfer() {
  const TRANSFER_KEYS = [
    SAVE_KEY,
    'antflow-my-stages-v1',
    'antflow-my-bgms-v1',
    'antflow-active-bgm-v1',
    'antflow-inbox-v1',
    'antflow-contest-claimed-v1',
    'antflow-talk-likes-v1',
    'antflow-stage-likes-v1',
    'antflow-stage-votes-v1',
    'antflow-fb-camp-v1',
    'antflow-nick-v1',
    'antflow-fb-nick-v1',
    'antflow-anon-name-v1',
    'antflow-seen-ver'
  ];
  const ALLOW_SET = new Set(TRANSFER_KEYS);
  const WORKER_BASE = (window.AF_POST_API || 'https://antflow.hiroshi-artcast.workers.dev/post').replace(/\/post\/?$/, '').replace(/\/$/, '');

  const updBtn = $('#bAppUpdate');
  if (updBtn) {
    updBtn.insertAdjacentHTML('beforebegin', '<button class="big sec" id="bSetTransfer">💾 セーブデータの引継ぎ</button>');
  }

  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.id = 'ov-transfer';
  ov.innerHTML =
    '<div class="card">' +
    '<h2>💾 セーブデータの引継ぎ</h2>' +
    '<p class="fine" id="trSum" style="margin-bottom:8px"></p>' +
    '<div style="background:#fff7fb;border:2px solid #ffd3e2;border-radius:14px;padding:10px;margin:6px 0;text-align:left">' +
      '<div style="font:900 12px var(--rf);color:#c0507a;margin-bottom:4px">① 引継ぎコードを発行する（1回限り・24時間有効）</div>' +
      '<p class="fine" style="margin:0 0 6px;line-height:1.45">機種変更や別のブラウザへの移動用です。<br>※ 不正配布を防ぐため、<b>1回使うと無効になり、発行は1日1回まで</b>です。</p>' +
      '<button type="button" class="big mint" id="bTrCopy" style="margin-top:2px">🎫 引継ぎコードを発行する</button>' +
      '<div id="trOutBox" style="display:none;margin-top:8px;padding:8px;background:#fff;border:2px dashed #ff8fb3;border-radius:10px;text-align:center">' +
        '<div style="font:700 10px var(--rf);color:#8a6a7a">このコードを移動先で入力してね（24時間有効）</div>' +
        '<div id="trOutCode" style="font:900 20px monospace;letter-spacing:2px;color:#c03060;margin-top:2px;user-select:text;-webkit-user-select:text"></div>' +
      '</div>' +
    '</div>' +
    '<div style="background:#fff;border:2px solid #cfe6ff;border-radius:14px;padding:10px;margin:8px 0;text-align:left">' +
      '<div style="font:900 12px var(--rf);color:#2a5c8a;margin-bottom:4px">② 発行したコードで復元する</div>' +
      '<input id="trInput" type="text" maxlength="16" style="width:100%;box-sizing:border-box;border:1.5px solid #cfe6ff;border-radius:10px;padding:8px 10px;font:900 16px monospace;text-align:center;letter-spacing:2px;color:var(--ink)" placeholder="例：ABCD-EFGH">' +
      '<button type="button" class="big" id="bTrLoad" style="margin-top:6px">📥 このコードで復元する</button>' +
    '</div>' +
    '<button type="button" class="big sec" id="bTrClose">とじる</button>' +
    '</div>';
  document.body.appendChild(ov);

  function openTransfer() {
    let myStagesCnt = 0;
    try { myStagesCnt = (JSON.parse(localStorage.getItem('antflow-my-stages-v1') || '[]') || []).length; } catch (e) {}
    $('#trSum').textContent = '現在の記録：クリア ' + gotCount() + '面 · 🪙' + save.coins + ' · マイ作品 ' + myStagesCnt + '件';
    showOv('transfer');
  }
  on('#bSetTransfer', () => { Sound.tap(); openTransfer(); });
  on('#bTrClose', () => { Sound.tap(); showOv('settings'); });
  let trBusy = false;
  on('#bTrCopy', async () => {
    if (trBusy) return;
    Sound.tap();
    const btn = $('#bTrCopy');
    const data = Object.create(null);
    for (const k of TRANSFER_KEYS) {
      try {
        const v = localStorage.getItem(k);
        if (v !== null) data[k] = v;
      } catch (e) {}
    }
    trBusy = true;
    btn.disabled = true; btn.textContent = '発行中…';
    try {
      const res = await fetch(WORKER_BASE + '/transfer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok || !d.code) {
        toast('⚠️ ' + (d.error || 'コードの発行に失敗しました'), 3400);
        return;
      }
      $('#trOutCode').textContent = d.code;
      $('#trOutBox').style.display = 'block';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(d.code).then(
          () => toast('🎫 引継ぎコード「' + d.code + '」をコピーしたよ！', 3800),
          () => toast('🎫 引継ぎコード「' + d.code + '」を発行したよ！', 3800)
        );
      } else {
        toast('🎫 引継ぎコード「' + d.code + '」を発行したよ！', 3800);
      }
    } catch (e) {
      toast('⚠️ 通信エラー：ネット環境を確認してね', 3200);
    } finally {
      trBusy = false;
      btn.disabled = false; btn.textContent = '🎫 引継ぎコードを発行する';
    }
  });
  on('#bTrLoad', async () => {
    if (trBusy) return;
    Sound.tap();
    const code = ($('#trInput').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code)) {
      toast('8文字の引継ぎコードを入力してね');
      return;
    }
    if (!confirm('現在のセーブデータを上書きして復元しますか？（コードは1回使うと無効になります）')) return;
    const btn = $('#bTrLoad');
    trBusy = true;
    btn.disabled = true; btn.textContent = '復元中…';
    try {
      const res = await fetch(WORKER_BASE + '/transfer/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok || !d.data || typeof d.data !== 'object') {
        toast('⚠️ ' + (d.error || '復元に失敗しました'), 3400);
        return;
      }
      for (const [k, v] of Object.entries(d.data)) {
        if (ALLOW_SET.has(k) && typeof v === 'string') {
          try { localStorage.setItem(k, v); } catch (e) {}
        }
      }
      toast('✅ 復元しました！再読み込みします…', 2000);
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast('⚠️ 通信エラー：ネット環境を確認してね', 3200);
    } finally {
      trBusy = false;
      btn.disabled = false; btn.textContent = '📥 このコードで復元する';
    }
  });
})();

requestAnimationFrame(frame);

AF_LOADED.push('ui.js');