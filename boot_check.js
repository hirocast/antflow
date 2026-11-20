// File: boot_check.js
(function () {
  var miss = window.AF_FILES.filter(function (f) { return window.AF_LOADED.indexOf(f) < 0; });
  if (miss.length) {
    window.AF_bootErr('最初に読み込めなかったファイル：' + miss[0] + '（同じフォルダにあるか、最後まで保存できているかを確認してください）');
  }
})();
