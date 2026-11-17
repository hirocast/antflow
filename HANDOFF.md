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

- **実機プレイ確認（1回目完了）**：ヘッドレス Chromium にてステージ 43–55 の表示・盤面・歌手アリさん衣装を確認、`pageerror` 0件。ただし **音声出力を伴う通しプレイ** は手動確認が望ましい。
- **難易度計測・調整（完了）**：`measure.js` にて 43–55 を計測し、46（きょうりゅう）・47（ひこうき）・49（ゆきのむら）・55（アリのす）の色層を追加（特に 55 アリのす は `ok:true / minSlots:4` へ改善）。`ORDER` の配置も調整済み。
- **メロディの正確さ**：`amefuri`（あめふり）の旋律・コード・歌詞をハ長調原曲に合わせて修正。`warewauminoko`・`momiji` は原曲と一致することを確認済み。先に追加した PD 曲（`kamome` 等）の細部は実音確認があるとベター。
- **著作権確認**：`かっこうワルツ`（ヨナーソン、1956年没）は日本で **2027-01-01 からPD** のため現在は停止し、ゆうえんち（ID 52）は `toysoldiers`（おもちゃの兵隊の行進、歌詞も汎用化）に差し替え済み。他の曲（中山晋平 1952没、北原白秋 1942没、野口雨情 1945没、文部省唱歌・クラシック曲）は PD。
- **`verify_bgm.mjs` の既存 WARN**（歌詞モーラ数と音符数の差）が `birthday` / `kamome` / `nekofunjatta` / `harugakita` / `jupiter` に残っている（機能上は問題なし。新曲43–55対象曲はすべて WARN 0）。
- `drafts/scores/` にはドレミのうた・さんぽ・せかいじゅうのこどもたちが 等**著作権が切れていない曲の楽譜**も含まれる。**これらはゲームに実装しないこと**（公開予定）。

## 5. 今後の作業候補（優先度順）

1. **実機での音声付き通しプレイ**：人間の耳で BGM 音色・テンポ・クリア演出を最終確認。
2. **新ステージの追加**：ドラフト（N01〜N24）は消化済みなので、新しいドラフト絵と PD 曲の組み合わせを企画。候補の PD 曲：ちょうちょう（野村秋足 1891没・PD）、むすんでひらいて（ルソー・PD）、ぶんぶんぶん（※村野四郎の歌詞は非PDのためオリジナル歌詞にする必要あり）。楽譜は [drafts/scores](drafts/scores/README.md) にあり。
3. **ドキュメント整備**：[drafts/arts/README.md](drafts/arts/README.md) の実装状況（全件実装済み）の反映、`TALK_STAGE` など仕様のメモ追記。

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
