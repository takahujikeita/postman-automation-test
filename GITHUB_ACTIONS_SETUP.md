# GitHub Actions Postman Integration Setup Guide

## 概要

このプロジェクトでは、OpenAPI仕様の変更時にPostmanコレクションを自動更新するGitHub Actionsワークフローが設定されています。

## ワークフローの動作

### トリガー条件
- `main`ブランチに対するPull Requestの作成・更新時
- OpenAPIファイル (`specs/auth-api.yml`) に変更がある場合のみ実行

### 実行内容
1. OpenAPI仕様の変更検出
2. Postmanコレクションの自動生成
3. 既存コレクションIDの保持
4. 生成されたコレクションのコミット・プッシュ
5. PRコメントによる更新通知

## セットアップ手順

### 1. リポジトリ権限設定

GitHub Actionsがリポジトリにプッシュできるよう権限を設定：

#### Option A: GitHub Actions書き込み権限（推奨）
1. リポジトリ Settings → Actions → General
2. "Workflow permissions" → "Read and write permissions" を選択
3. "Save" をクリック

#### Option B: Personal Access Token
1. GitHub Settings → Developer settings → Personal access tokens
2. "Generate new token" → `repo` スコープを選択
3. リポジトリ Settings → Secrets → Actions
4. "New repository secret" → Name: `GH_PAT`, Value: 生成したトークン

### 2. PostmanとGitHubの連携（任意）

記事で紹介されているPostman-GitHub連携機能を使用する場合：

1. Postmanで新しいコレクションを作成
2. Collection → Integrations → GitHub
3. リポジトリのmainブランチと`postman/collections/`を接続
4. PRマージ時に自動同期

## テスト手順

### 1. フィーチャーブランチの作成
```bash
git checkout -b feature/test-automation
```

### 2. OpenAPI仕様の更新
`specs/auth-api.yml`を編集（例：新しいエンドポイント追加）

### 3. 変更のコミット・プッシュ
```bash
git add specs/auth-api.yml
git commit -m "feat: add new API endpoint"
git push origin feature/test-automation
```

### 4. Pull Request作成
GitHub上でPRを作成すると、GitHub Actionsが自動実行され：
- Postmanコレクションが更新される
- PRにコメントが追加される

## 期待される結果

✅ GitHub Actionsが正常実行される
✅ `postman/collections/saasus-auth-api.json`が更新される
✅ PRに自動コメントが追加される
✅ 既存のコレクションIDが保持される

## トラブルシューティング

### エラー: Permission denied
→ リポジトリの書き込み権限を確認

### エラー: OpenAPI conversion failed
→ YAML構文とOpenAPI仕様の妥当性を確認

### エラー: Collection not generated
→ 依存関係のインストール状況を確認

## 参考資料

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Postman GitHub Integration](https://learning.postman.com/docs/integrations/available-integrations/github/collections/overview/)
- [OpenAPI to Postman converter](https://github.com/postmanlabs/openapi-to-postman)
