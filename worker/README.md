# アントフロー 無登録投稿 Worker セットアップ手順

この Worker を Cloudflare Workers（無料枠）にデプロイすると、ユーザーは **GitHubアカウント不要・1タップ** でステージやBGMを「みんなの絵」「みんなのBGM」に投稿できるようになります。

## 1. GitHub Personal Access Token (Fine-grained) を作成

1. GitHub の [Settings → Developer settings → Fine-grained tokens](https://github.com/settings/tokens?type=beta) を開く
2. **Generate new token** をクリック
3. 設定：
   - **Token name**: `antflow-post-worker`
   - **Repository access**: `Only select repositories` → `hirocast/antflow` のみ選択
   - **Permissions → Repository permissions → Issues**: `Read and write`
4. トークンをコピーして控える（`github_pat_...`）

## 2. Cloudflare Workers にデプロイ

### 方法A：ブラウザだけでデプロイ（コマンド不要）
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) に無料登録／ログイン
2. **Workers & Pages** → **Create** → **Create Worker**
3. 名前を `antflow-post-worker` にして **Deploy**
4. **Edit code** を開き、`worker/index.js` の中身をそのまま貼り付けて **Save and Deploy**
5. Worker の **Settings → Variables and Secrets** で以下を追加：
   - **Secret**: 名前 `GITHUB_TOKEN` / 値 `github_pat_...`
   - **Variable**（任意）: 名前 `ALLOWED_ORIGINS` / 値 `https://hirocast.github.io,http://localhost,http://127.0.0.1`
6. 発行された Worker URL（例：`https://antflow-post-worker.xxxxx.workers.dev`）を控える

### 方法B：Wrangler CLI でデプロイ
```bash
cd worker
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

## 3. アプリ側に Worker URL を設定

`maker.js` と `bgm_maker.js` の先頭にある `POST_API_URL` に Worker の URL（末尾 `/post`）を設定してプッシュすれば完了です！

```js
const POST_API_URL = 'https://antflow-post-worker.xxxxx.workers.dev/post';
```

> **※ `POST_API_URL` が空のままのとき**は、これまで通り GitHub の手動投稿ページが開くフォールバック動作になります。

---

## 4. 現在の本番構成（運用メモ・引き継ぎ用）

### Cloudflare Worker
- **Worker 名**: `antflow`（`worker/wrangler.toml` の `name = "antflow"`）
- **本番 URL**: `https://antflow.hiroshi-artcast.workers.dev`
- **設定済み環境変数 / Secret（Cloudflare 側）**:
  - `GITHUB_TOKEN`（Secret / Fine-grained PAT: `hirocast/antflow` の Issues Read & Write）
  - `ALLOWED_ORIGINS`（Variable: `https://hirocast.github.io,http://localhost,http://127.0.0.1`）
- **エンドポイント一覧（`worker/index.js`）**:
  - `GET /health` : ヘルスチェック
  - `POST /post`（または `/`） : ステージ / BGM の無登録1タップ投稿（GitHub Issue 作成）
  - `POST /like-talk` : セリフのいいね加算・減算（`talk-likes` ラベル Issue に保存）
  - `GET /stage-stats` : 投稿ステージの統計一覧取得（`stage-stats` ラベル Issue から取得）
  - `POST /stage-stat` : 投稿ステージの統計イベント送信（`play` / `clear` / `like` / `unlike` / `up` / `down`）

### GitHub Actions（`.github/workflows/`）
1. **`deploy-worker.yml`（Deploy Cloudflare Worker）**
   - トリガー：`main` ブランチへの `worker/**` の push、または手動実行（`workflow_dispatch`）
   - 使用アクション：`cloudflare/wrangler-action@v3`（`workingDirectory: worker`）
   - 設定済み GitHub Repository Secrets（`hirocast/antflow`）：
     - `CLOUDFLARE_API_TOKEN`（Edit Cloudflare Workers テンプレートで作成）
     - `CLOUDFLARE_ACCOUNT_ID`（32桁の Cloudflare Account ID）
2. **`talk-ranking.yml`（Weekly Popular Talk Ranking）**
   - 人気のセリフ週間ランキング自動集計ワークフロー

