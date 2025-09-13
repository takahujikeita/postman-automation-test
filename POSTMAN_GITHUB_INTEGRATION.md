# Postman GitHub連携設定ガイド

## 🎯 概要

このガイドでは、GitHubのmainブランチに変更がマージされた際に、Postmanのプライマリーコレクションが自動的に同期される設定方法を説明します。

## 📋 前提条件

✅ GitHub Actionsワークフローが正常動作していること  
✅ `postman/collections/saasus-auth-api.json` がGitHubリポジトリに存在すること  
✅ Postmanアカウントを持っていること  

## 🔧 設定手順

### 1. Postmanでワークスペースとコレクションの準備

#### 1-1. Postmanワークスペースにアクセス
1. Postmanアプリまたはウェブ版にログイン
2. 対象のワークスペースを選択（または新規作成）

#### 1-2. 初回コレクションインポート
1. **New** → **Import** をクリック
2. **Link** タブを選択
3. GitHubの生ファイルURLを入力：
   ```
   https://raw.githubusercontent.com/takahujikeita/postman-automation-test/main/postman/collections/saasus-auth-api.json
   ```
4. **Continue** → **Import** でインポート完了

### 2. GitHub連携の設定

#### 2-1. Collection設定画面へアクセス
1. インポートしたコレクション名の横の **...** (3点メニュー) をクリック
2. **Integrations** を選択

#### 2-2. GitHub Integration追加
1. **Browse All Integrations** をクリック
2. **GitHub** を検索・選択
3. **Add Integration** をクリック

#### 2-3. GitHub認証・リポジトリ接続
1. **Authenticate with GitHub** をクリック
2. GitHubにログインして Postman に権限を付与
3. 以下の設定を入力：

| 設定項目 | 値 |
|---------|-----|
| **Repository** | `takahujikeita/postman-automation-test` |
| **Branch** | `main` |
| **Directory** | `postman/collections/` |
| **Filename** | `saasus-auth-api.json` |

4. **Add Integration** で設定完了

### 3. 同期設定の確認

#### 3-1. 同期方向の設定
- **GitHub → Postman**: ONにする（推奨）
- **Postman → GitHub**: 必要に応じて設定

#### 3-2. 自動同期の有効化
1. Integration設定で **Auto-sync** を有効にする
2. 同期頻度を設定（推奨: **Real-time** または **Every 15 minutes**）

## 🔄 動作確認

### テストシナリオ
1. **OpenAPI仕様書を更新**
   ```bash
   # フィーチャーブランチで作業
   git checkout -b feature/test-sync
   vim specs/auth-api.yml  # 新しいエンドポイントを追加
   git add specs/auth-api.yml
   git commit -m "feat: add new test endpoint"
   git push origin feature/test-sync
   ```

2. **プルリクエスト作成・マージ**
   - GitHubでPRを作成
   - GitHub Actionsが実行されてPostman Collectionが更新
   - PRをmainブランチにマージ

3. **Postmanでの同期確認**
   - 数分以内にPostmanのコレクションが自動更新されることを確認
   - 新しいエンドポイントがコレクションに追加されているか確認

## 📊 同期状況の監視

### Postman側での確認
1. Collection → **Integration** タブ
2. **Sync Status** で最新の同期状況を確認
3. エラーがある場合は **Error Logs** を確認

### GitHub側での確認
1. リポジトリの **Settings** → **Integrations & services**
2. Postman integration の状況を確認

## 🚨 トラブルシューティング

### よくある問題

#### 1. 同期が動作しない
**原因**:
- GitHub認証の期限切れ
- ファイルパスの設定ミス
- ブランチ名の間違い

**対処**:
```bash
# ファイルパスの確認
ls -la postman/collections/saasus-auth-api.json

# GitHub権限の再認証
# Postman Integration設定で「Re-authenticate」を実行
```

#### 2. Collection IDが変更される
**原因**: GitHub Actions側のID保持機能の問題

**対処**:
- GitHub Actionsログを確認
- 必要に応じて手動でCollection IDを修正

#### 3. 部分的な同期
**原因**: ファイル形式やスキーマの問題

**対処**:
```bash
# コレクションファイルの検証
npm run validate
```

## 🔧 高度な設定

### カスタム同期フィルター
```json
{
  "sync_filters": {
    "include_folders": ["Auth", "Users"],
    "exclude_tests": false,
    "preserve_ids": true
  }
}
```

### Webhook通知設定
1. Postman Integrations → **Webhooks**
2. GitHub webhook URLを設定
3. 同期イベントに対する通知を設定

## 📝 設定完了チェックリスト

- [ ] Postmanにコレクションをインポート完了
- [ ] GitHub Integration追加完了
- [ ] リポジトリ・ブランチ・パス設定完了
- [ ] 自動同期設定完了
- [ ] テスト同期実行・確認完了
- [ ] エラー監視設定完了

## 🎯 設定後の運用フロー

1. **開発者**: OpenAPI仕様書を更新
2. **GitHub Actions**: Postman Collectionを自動生成・更新
3. **GitHub**: mainブランチにマージ
4. **Postman GitHub Integration**: Postmanコレクションを自動同期
5. **チーム**: 最新のAPIテストをPostmanで実行

この設定により、OpenAPI仕様書の更新からPostmanでのテスト実行まで、完全に自動化されたワークフローが実現します。
