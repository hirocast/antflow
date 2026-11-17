# antflow 作業引き継ぎメモ（2026-11-16 時点）

他のAI／開発者への共有用。直近の作業（ステージ追加・PD BGM追加）の進捗と、今後の作業候補をまとめる。

## 1. 現状サマリー

- ステージ総数：**55**（`ARTS.length === TOTAL === ORDER.length === 55`）
- 最新コミット：`e3666f3`（`origin/main`）
- 公開予定のため、**BGMはパブリックドメイン（PD）曲のみ**を使う方針（著作権が切れていない「ドレミのうた」等は不採用）。

### 実装済みの流れ

| 弾 | 内容 | ID | コミット |
| --- | --- | --- | --- |
| PD BGM 9曲 | ふじの山 / かもめの水兵さん / ねこふんじゃった / メヌエット / こんぺいとうの踊り / むらまつり / 春が来た / おもちゃの兵隊の行進 / 木星 を既存ステージへ割当 | 既存 | `86cf596` |
| 第1弾（小盤面 22〜24） | かえる / でんしゃ / コアラ / きょうりゅう | 43–46 | `4002703`, `66ebce5` |
| 第2弾（中盤面 36〜44） | ひこうき / おかしのいえ / ゆきのむら / やたい | 47–50 | `a6a74c2` |
| 第3弾（大盤面 48〜56） | あじさい / ゆうえんち / サンゴしょう / じんじゃ / アリのす | 51–55 | `1817d29`, `e3666f3` |

`drafts/arts/` の N01〜N24 ドラフトは**すべて実装済み**。

### ステージ ⇔ BGM 対応（新規分）

| ステージ | BGMキー | 曲名 |
| --- | --- | --- |
| かえる | `kaeru` | かえるのがっしょう |
| でんしゃ | `kisha` | 汽車 |
| コアラ | `yama` | やまのおんがくか |
| きょうりゅう | `kuri` | おおきなきょうりゅう |
| ひこうき | `shabondama` | しゃぼんだま |
| おかしのいえ | `gavotte` | ガヴォット |
| ゆきのむら | `skaters` | スケーターズ・ワルツ |
| やたい | `muramatsuri` | むらまつり |
| あじさい | `amefuri` | あめふり |
| ゆうえんち | `toysoldiers` | おもちゃの兵隊の行進（kakkouは2027年までPDでないため停止中） |
| サンゴしょう | `warewauminoko` | われは海の子 |
| じんじゃ | `momiji` | もみじ |
| アリのす | `humoresque` | ユーモレスク |

## 2. 新ステージ追加の手順（コードの触る場所）

1. [arts.js](arts.js)：`ARTS` 末尾に `{n, t, w, flat:1, s:[...]}` を追加（座標は 0〜100）。
2. [base.js](base.js)：`LV_KEY` の番号を上げる（現在 `antflow-lv20-`）／`ORDER` に ID を挿入／`TALK_STAGE` に `hi / p / c / j / q` を追加。
3. [sound.js](sound.js)：`Sound.setBgm` の割当、`BGM_TITLES`、`LYRICS`、`EXTRA_SONGS`（新曲の場合）。
4. [render.js](render.js)：`drawSingerCostume` に衣装、`micCols` にマイク色。
5. 検証（下記）→ コミット → `git push origin main`。

### ピクセルアート品質のルール（[raster.js](raster.js)）
- 小盤面（`w < 30`）：背景なし（透明）＋ `ol:'D'`（自動で暗い縁取り）が綺麗。
- `w >= 30` の風景：`shadeArt()` が自動で陰影を付けるが、輪郭 `D` と手置きのハイライトがある絵ではノイズになるので **`flat:1`** を付ける。
- パレットは `base.js` の `KEYS`（21色）のみ。ドラフト画像の色は最も近いキーに寄せる。

## 3. 検証コマンド

```bash
node --check arts.js && node --check base.js && node --check sound.js && node --check render.js
node scripts/verify_bgm.mjs   # 音符数と歌詞モーラ数、終止コードなどのチェック
```

ステージ数／割当の確認は `vm` で `arts.js, base.js, raster.js, sound.js` を読み込み（`AF_LOADED=[]` と `localStorage` のスタブが必要）、`getArt(id)` と `Sound.setBgm(name, id)` を呼ぶ。絵の確認は `raster()` の出力グリッドを PNG に書き出して目視する。

## 4. 未確認・注意点（重要）

- **実機（ブラウザ）での通しプレイ・目視確認は未実施**。絵は PNG 書き出しでのみ確認、音はスクリプト検証のみ。
- **難易度・勝率の計測（`measure.js`）は未実施**。新ステージ（ID 43–55）が解けるか、`ORDER` 上の位置が適切か未確認。
- **メロディの正確さ**：楽譜画像があるのは `shabondama` / `gavotte` / `skaters_waltz` / `kakkou_waltz` / `humoresque` など（[drafts/scores](drafts/scores/README.md)）。`amefuri` / `warewauminoko` / `momiji` と、先に追加した PD 曲の一部は**楽譜なしで記述**しているため、旋律・コードの誤りがありうる。耳／楽譜での確認が望ましい。
- **著作権の再確認**：`かっこうワルツ`（ヨナーソン）の作曲者の没年・権利状況は未確認。公開前に必ず確認し、不確かなら差し替える。他の曲も公開前に一度ルール確認を推奨（日本は没後70年）。
- **`verify_bgm.mjs` の既存 WARN**（歌詞モーラ数と音符数の差）が `birthday` / `kamome` / `nekofunjatta` / `harugakita` / `jupiter` に残っている（機能上は問題なし。歌い方の都合で許容）。
- `drafts/scores/` にはドレミのうた・さんぽ・せかいじゅうのこどもたちが 等**著作権が切れていない曲の楽譜**も含まれる。**これらはゲームに実装しないこと**（公開予定）。

## 5. 今後の作業候補（優先度順）

1. **通しプレイ確認**：新ステージ 43–55 の表示（盤面サイズ・絵の判別しやすさ）、歌手アリさんの衣装、歌詞表示を実機で確認。
2. **難易度調整**：`measure.js` で勝率を確認し、`ORDER`（遊ぶ順）と `starsAt`（難しさ★）を調整。
3. **BGM精度の見直し**：楽譜のない曲を中心に、メロディ・コード・歌詞のモーラ数を整える。`verify_bgm.mjs` の WARN も可能な範囲で解消。
4. **権利確認**（kakkou は 2027-01-01 以降PD、現在は未使用。他のPD曲は作曲者没後70年超を確認済み）：全PD曲（特に `kakkou`）の権利を公開前に最終確認。出典メモをまとめるとよい。
5. **新ステージの追加**：ドラフト（N01〜N24）は消化済みなので、新しいドラフト絵と PD 曲の組み合わせを企画。候補の PD 曲：ちょうちょう、ぶんぶんぶん、むすんでひらいて（ルソー）、メリーさんのひつじ（楽譜は [drafts/scores](drafts/scores/README.md) にあり。権利は要確認）。
6. **ドキュメント整備**：[drafts/arts/README.md](drafts/arts/README.md) の実装状況（全件実装済み）の反映、`TALK_STAGE` など仕様のメモ追記。

## 6. 参考：リポジトリの主なファイル

| ファイル | 役割 |
| --- | --- |
| [arts.js](arts.js) | ピクセルアート定義（`ARTS`, `DETAIL`） |
| [raster.js](raster.js) | 図形→マス目変換、自動陰影、盤面サイズ（`boardSize`, `getArt`） |
| [base.js](base.js) | 定数、パレット、`ORDER`、`TALK_STAGE`、`LV_KEY` |
| [sound.js](sound.js) | BGM・歌詞・曲データ（`EXTRA_SONGS`） |
| [render.js](render.js) | 描画、歌手アリさんの衣装（`drawSingerCostume`） |
| [scripts/verify_bgm.mjs](scripts/verify_bgm.mjs) | BGMデータの検証 |
| [drafts/](drafts) | ドラフト絵・楽譜画像と管理メモ |
