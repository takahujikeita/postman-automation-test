# Postman Automation Test

このプロジェクトは、OpenAPI仕様からPostmanコレクションを自動生成し、GitHub ActionsとPostmanの連携でAPI定義の更新を自動化するためのプロジェクトです。

## 環境構成

```
postman-automation-test/
├── .github/
│   └── workflows/
│       └── update-postman-collection.yml  # GitHub Actionsワークフロー
├── specs/                                 # OpenAPI仕様ファイル
│   └── auth-api.yml                      # サンプルSaaSus Auth API
├── postman/                              # Postman関連ファイル
│   └── collections/                      # Postmanコレクション
│       └── saasus-auth-api.json         # 生成されたコレクション
├── collections/                          # ローカル生成用
├── scripts/                              # 変換・アップロードスクリプト
│   ├── convert-and-upload.js            # ローカル変換用
│   └── convert-openapi.js               # GitHub Actions専用
├── package.json
└── README.md
```

## セットアップ完了

すべての必要なファイルとパッケージがインストール済みです：
- `openapi-to-postmanv2`: OpenAPI → Postman変換
- `axios`: HTTP リクエスト用
- GitHub Actions ワークフロー設定済み

## 🤖 自動化ワークフロー

### GitHub Actionsによる自動更新

1. **トリガー**: `main`ブランチに対するPRの作成・更新時
2. **条件**: OpenAPIファイル (`specs/auth-api.yml`) に変更がある場合のみ実行
3. **処理内容**:
   - OpenAPI仕様からPostmanコレクションを自動生成
   - 既存のコレクションIDを保持（存在する場合）
   - 生成されたコレクションをリポジトリにコミット・プッシュ
   - PRにコメントで更新通知

### 使用方法

1. **フィーチャーブランチの作成**:
   ```bash
   git checkout -b feature/update-api
   ```

2. **OpenAPI仕様の更新**:
   `specs/auth-api.yml` を編集してAPI仕様を変更

3. **コミット・プッシュ**:
   ```bash
   git add specs/auth-api.yml
   git commit -m "feat: add new API endpoint"
   git push origin feature/update-api
   ```

4. **Pull Request作成**:
   GitHub上でPRを作成すると、自動的にGitHub Actionsが実行され、Postmanコレクションが更新されます

## 📋 ローカル開発

### 1. 変換のみテスト（Postman APIキー不要）

```bash
# ローカル用（collections/）
npm run convert

# GitHub Actions用（postman/collections/）
npm run convert-openapi
```

### 2. 出力確認

```bash
# 生成されたコレクション名を確認
cat postman/collections/saasus-auth-api.json | python3 -c "import json, sys; data=json.load(sys.stdin); print(data['info']['name'])"

# baseURL変数が正しく設定されているか確認
cat postman/collections/saasus-auth-api.json | python3 -c "import json, sys; data=json.load(sys.stdin); print(json.dumps(data.get('variable', []), indent=2))"
```

### 3. JSON形式検証

```bash
npm run validate
```

## 🔧 設定のカスタマイズ

### GitHub Actions設定

`.github/workflows/update-postman-collection.yml`の環境変数:
- `OPENAPI_FILE`: 監視対象のOpenAPIファイルパス
- `COLLECTION_FILE`: 生成先のPostmanコレクションファイルパス

### リポジトリ権限設定

GitHub Actionsがリポジトリにプッシュできるよう、以下のいずれかを設定：

**Option 1: GitHub Actions書き込み権限 (推奨)**
1. リポジトリ設定 → Actions → General
2. Workflow permissions → "Read and write permissions"を選択

**Option 2: Personal Access Token**
1. GitHubでPATを生成（`repo`スコープ）
2. リポジトリSecretsに`GH_PAT`として保存
3. ワークフローファイルでPATを使用

### Postmanとの連携

記事で紹介されているPostman-GitHub連携機能を使用する場合：

1. **Postmanでコレクション作成**:
   - 生成された`postman/collections/saasus-auth-api.json`をPostmanにインポート

2. **GitHub連携設定**:
   - PostmanでCollection → Integration → GitHub
   - リポジトリのmainブランチと`postman/collections/`ディレクトリを接続

3. **自動同期**:
   - PRがマージされると、Postmanのコレクションも自動更新

## 🚀 Postman APIアップロード（任意）

Postman APIを使って直接アップロードしたい場合：

1. **環境変数設定**:
   ```bash
   export POSTMAN_API_KEY="your-postman-api-key"
   export POSTMAN_WORKSPACE_ID="your-workspace-id"
   ```

2. **スクリプト実行**:
   ```bash
   npm run convert
   ```

## 📝 API仕様の拡張

### 新しいAPIサービスの追加

1. `specs/`に新しいOpenAPIファイルを追加
2. `scripts/convert-openapi.js`を修正して複数ファイルに対応
3. GitHub Actionsワークフローの`OPENAPI_FILE`を更新

### 高度な変換オプション

`scripts/convert-openapi.js`の変換オプション:
- `folderStrategy`: フォルダー構造の戦略
- `requestParametersResolution`: リクエストパラメータの解決方法
- `includeAuthInfoInExample`: 認証情報をサンプルに含めるか

## 🔍 トラブルシューティング

### よくあるエラー

1. **YAML parsing error**: OpenAPI仕様の構文確認
2. **Module not found**: `npm ci`の実行確認
3. **GitHub Actions権限エラー**: リポジトリ権限設定の確認
4. **Collection ID変更**: 既存IDの保持ロジック確認

### デバッグ

```bash
# 詳細ログ出力
DEBUG=* npm run convert-openapi
```

## 📚 参考記事

- [OpenAPIベースのプロジェクトでGitHub PRを通じてPostmanコレクションを更新・公開する方法](https://qiita.com/yokawasa/items/4b3111b974cda3404ef8)
- [Postman GitHub Integration](https://learning.postman.com/docs/integrations/available-integrations/github/collections/overview/)

## 🎯 次のステップ

この基本構成をベースに：
- 複数のAPI仕様ファイルの統合
- テスト自動化の追加
- 環境別の設定管理
- CI/CDパイプラインとの統合
- エラーハンドリングの強化

が可能です。
