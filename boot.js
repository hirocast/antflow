// File: boot.js
// 読み込みチェック：各 .js の最後の行で、自分のファイル名を AF_LOADED に登録する
window.AF_APP_VER = '20261121bn';
window.AF_LOADED = [];
window.AF_ERR_LOG = [];
window.AF_pushErr = function (msg) {
  try {
    var s = String(msg || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
    if (!s) return;
    if (window.AF_ERR_LOG.length && window.AF_ERR_LOG[window.AF_ERR_LOG.length - 1].m === s) return;
    window.AF_ERR_LOG.push({ t: Date.now(), m: s });
    if (window.AF_ERR_LOG.length > 8) window.AF_ERR_LOG.shift();
  } catch (e) {}
};
window.AF_FILES = ['base.js', 'arts.js', 'raster.js', 'logic.js', 'sound.js', 'render.js', 'ui.js', 'maker.js', 'bgm_maker.js', 'minigame_tsum.js', 'minigame_drop.js', 'minigame_drop2.js', 'minigame_tsum2.js', 'minigame_snipe.js', 'minigame_bounce.js', 'measure.js'];
window.AF_bootErr = function (msg) {
  window.AF_pushErr(msg);
  try {
    document.documentElement.classList.remove('af-booting');
    var ov = document.getElementById('ov-title');
    if (ov) ov.classList.add('show');
  } catch (e) {}
  var c = document.querySelector('#ov-title .card');
  if (!c || c.querySelectorAll('.bootErr').length >= 4) return;
  var p = document.createElement('p');
  p.className = 'bootErr';
  p.textContent = msg;
  c.appendChild(p);
};
window.addEventListener('error', function (e) {
  var msg = e.message || '不明';
  if (/^Script error\.?$/i.test(msg)) {
    window.AF_bootErr('エラー：詳しい内容はブラウザに隠されました（F12キーの開発者ツール →「Console」で確認できます）');
    return;
  }
  var file = e.filename ? e.filename.split('/').pop().split('?')[0] : '';
  var where = file ? '（' + file + ' の ' + e.lineno + '行目）' : '';
  window.AF_bootErr('エラー：' + msg + where);
});
window.addEventListener('unhandledrejection', function (e) {
  var r = e && e.reason;
  var msg = (r && r.message) ? r.message : String(r || 'Promise rejection');
  window.AF_pushErr('Promiseエラー：' + msg);
});
