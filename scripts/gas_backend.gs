/**
 * アントフロー「みんなのステージ」用 Google Apps Script (GAS) バックエンド
 *
 * 【セットアップ手順（約3分・無料）】
 * 1. Google ドライブで新しいスプレッドシートを1つ作成（非公開のままでOK）
 * 2. メニュー「拡張機能」＞「Apps Script」を開く
 * 3. このファイルの中身をすべて貼り付けて保存
 * 4. 右上の「デプロイ」＞「新しいデプロイ」
 *    - 種類：ウェブアプリ
 *    - 次のユーザーとして実行：自分
 *    - アクセスできるユーザー：全員
 * 5. 表示された「ウェブアプリ URL」をコピーして、maker.js の GAS_URL に貼り付ける
 */

const SHEET_NAME = 'stages';
const REPORT_HIDE_THRESHOLD = 3; // 通報が3件以上ついたら自動で一覧から隠す
const POST_COOLDOWN_MS = 60 * 1000; // 連続投稿制限（60秒）

const NG_WORDS = [
  '死ね', 'しね', '殺す', 'ころす', 'バカ', 'ばか', 'アホ', 'あほ', 'クズ', 'くず',
  'キモ', 'きも', 'うざ', 'ウザ', 'ちん', 'まん', 'せっくす', 'セックス', 'エロ', 'えろ',
  'アダルト', '暴力', '薬物', '大麻', 'fuck', 'shit', 'bitch', 'porn', 'sex', 'nude'
];

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['id', 'name', 'w', 'h', 'token', 'reports', 'hidden', 'createdAt']);
  }
  return sh;
}

function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\s\u3000\u200B-\u200D\uFEFF]/g, '');
}

function hasNgOrUrl(name) {
  const s = String(name || '');
  if (/https?:\/\/|www\.|\.[a-z]{2,4}(\/|$)|@/i.test(s)) return 'URLや@は使えません';
  const n = normText(s);
  for (let i = 0; i < NG_WORDS.length; i++) {
    if (n.indexOf(NG_WORDS[i]) >= 0) return '使えない言葉が含まれています';
  }
  return '';
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 一覧取得（hidden が true でない最新30件を返す）
function doGet() {
  const sh = getSheet();
  const rows = sh.getDataRange().getValues();
  const items = [];
  for (let i = rows.length - 1; i >= 1 && items.length < 30; i--) {
    const [id, name, w, h, token, reports, hidden, createdAt] = rows[i];
    if (hidden === true || hidden === 'TRUE' || Number(reports) >= REPORT_HIDE_THRESHOLD) continue;
    if (!token) continue;
    items.push({ id: String(id), name: String(name), w: Number(w), h: Number(h), token: String(token), createdAt: String(createdAt) });
  }
  return jsonOut({ ok: true, items: items });
}

// 投稿・通報処理
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const sh = getSheet();

    // ---- 通報処理 ----
    if (data.action === 'report' && data.id) {
      const rows = sh.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(data.id)) {
          const nextRep = Number(rows[i][5] || 0) + 1;
          sh.getRange(i + 1, 6).setValue(nextRep);
          if (nextRep >= REPORT_HIDE_THRESHOLD) {
            sh.getRange(i + 1, 7).setValue(true);
          }
          return jsonOut({ ok: true, reports: nextRep, hidden: nextRep >= REPORT_HIDE_THRESHOLD });
        }
      }
      return jsonOut({ ok: false, error: 'not_found' });
    }

    // ---- 新規投稿処理 ----
    const name = String(data.name || 'オリジナル').trim().slice(0, 14) || 'オリジナル';
    const token = String(data.token || '').trim();
    const w = Number(data.w || 16), h = Number(data.h || 16);
    if (!token || token.length > 2000) return jsonOut({ ok: false, error: 'データが不正です' });

    const err = hasNgOrUrl(name);
    if (err) return jsonOut({ ok: false, error: err });

    // 連続投稿・重複チェック
    const props = PropertiesService.getScriptProperties();
    const lastAt = Number(props.getProperty('lastPostAt') || 0);
    const now = Date.now();
    if (now - lastAt < 3000) {
      return jsonOut({ ok: false, error: '少し待ってからもう一度お試しください' });
    }
    const rows = sh.getDataRange().getValues();
    for (let i = Math.max(1, rows.length - 30); i < rows.length; i++) {
      if (String(rows[i][4]) === token) {
        return jsonOut({ ok: false, error: '同じステージがすでに投稿されています' });
      }
    }

    const id = 'st_' + now + '_' + Math.floor(Math.random() * 1000);
    sh.appendRow([id, name, w, h, token, 0, false, new Date().toISOString()]);
    props.setProperty('lastPostAt', String(now));
    return jsonOut({ ok: true, id: id });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}
