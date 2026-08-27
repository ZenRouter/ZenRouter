# Cursor統合

ZenRouteをCursor IDEと統合し、AIリクエストをZenRouteのインテリジェントルーティングシステム経由でルーティングします。

## 前提条件

- Cursor IDEがインストール済み
- Cursor Proアカウント (カスタムAPIエンドポイントに必要)
- ZenRouteクラウドエンドポイントが設定済み
- ZenRouteダッシュボードからのAPIキー

## ⚠️ 重要な注意点

> **クラウドエンドポイントが必要**: Cursorは独自のサーバー経由でリクエストをルーティングし、localhostエンドポイントをサポートしません。ZenRouteクラウドエンドポイント `http://localhost:20128` を使用する必要があります。

> **Cursor Proが必要**: この機能はカスタムAPIエンドポイントを使用するためにCursor Proアカウントが必要です。

## セットアップ

### 1. Cursor設定を開く

1. Cursor IDEを開く
2. **Settings** へ移動 (Cmd/Ctrl + ,)
3. **Models** セクションへ移動

### 2. OpenAI APIを有効化

1. **OpenAI API key** オプションを見つける
2. トグルを有効にしてカスタムAPI設定を有効化

### 3. Base URLを設定

Base URLをZenRouteクラウドエンドポイントに設定:

```
http://localhost:20128
```

**手順:**
1. Models設定で **Base URL** フィールドを見つける
2. 入力: `http://localhost:20128`
3. **Save** をクリック

### 4. APIキーを追加

1. **API Key** フィールドにZenRoute APIキーを入力
2. APIキーはZenRouteダッシュボードの **Settings → API Keys** で確認できます
3. **Save** をクリック

### 5. カスタムモデルを追加

1. **View All Models** ボタンをクリック
2. **Add Custom Model** をクリック
3. ZenRoute設定からモデル名を入力 (例: `gpt-4`、`claude-opus-4-5` など)
4. **Add** をクリック

### 6. モデルを選択

1. Cursorチャットインターフェイスでモデルセレクタードロップダウンをクリック
2. リストからカスタムモデルを選択
3. CursorでZenRouteを使い始める!

## 設定例

Cursor設定は次のようになります:

```
OpenAI API: ✓ Enabled
Base URL: http://localhost:20128
API Key: sk-zenroute-xxxxxxxxxxxxx
Custom Models: gpt-4, claude-opus-4-5, gemini-2.0-flash
```

## 利用可能なモデル

ZenRouteダッシュボードで設定されたモデルを使用できます。一般的な例:

| モデル名 | プロバイダー | 説明 |
|------------|----------|-------------|
| `gpt-4` | OpenAI | GPT-4 Turbo |
| `gpt-4o` | OpenAI | GPT-4 Optimized |
| `claude-opus-4-5` | Anthropic | Claude Opus 4.5 |
| `claude-sonnet-4-5` | Anthropic | Claude Sonnet 4.5 |
| `gemini-2.0-flash` | Google | Gemini 2.0 Flash |

## 使用法

### チャットインターフェイス

1. Cursorチャットを開く (Cmd/Ctrl + L)
2. ドロップダウンからモデルを選択
3. ZenRoute経由でAIとチャット開始

### インラインコード生成

1. エディタでコードを選択
2. Cmd/Ctrl + Kを押す
3. プロンプトを入力
4. CursorはZenRouteを使用してコードを生成

### コード説明

1. エディタでコードを選択
2. Cmd/Ctrl + Lを押す
3. 「Explain this code」と質問
4. ZenRoute経由でAIによる説明を取得

## トラブルシューティング

### 「Invalid API Key」エラー

1. ZenRouteダッシュボードでAPIキーを確認
2. `sk-zenroute-` プレフィックスを含むキー全体をコピーしたか確認
3. APIキーが期限切れでないか確認
4. 新しいAPIキーを再生成してみる

### 「Model Not Found」エラー

1. モデル名がZenRoute設定と正確に一致するか確認
2. ZenRouteダッシュボードでプロバイダー接続がアクティブか確認
3. 接続されたプロバイダーでモデルが利用可能か確認
4. フルモデル名を使用してみる (例: `gpt-4` の代わりに `openai/gpt-4`)

### 接続の問題

1. クラウドエンドポイントを使用しているか確認: `http://localhost:20128`
2. インターネット接続を確認
3. ZenRouteクラウドサービスが運用中か確認
4. VPNまたはプロキシが有効な場合は無効化してみる

### Localhostが動作しない

> **覚えておいてください**: Cursorはlocalhostエンドポイントをサポートしません。クラウドエンドポイント `http://localhost:20128` を使用する必要があります。ローカルZenRouteインスタンスを使用したい場合は、ngrokなどのトンネリングサービスを検討してローカルエンドポイントを公開してください。

## クラウドエンドポイントのセットアップ

ローカルでZenRouteを実行し、Cursorで使用したい場合:

1. ZenRoute設定でクラウドエンドポイントを有効化
2. ZenRouteダッシュボードでクラウドエンドポイントURLを設定
3. Cursor設定でクラウドURLを使用
4. ローカルZenRouteインスタンスがインターネットからアクセス可能か確認

## ベストプラクティス

1. **モデルエイリアスを使用**: ZenRouteで頻繁に使うモデル用のショートエイリアスを作成
2. **使用量をモニター**: ZenRouteダッシュボードで使用統計とコストを確認
3. **APIキーをローテーション**: セキュリティのためAPIキーを定期的にローテーション
4. **モデルをテスト**: ユースケースに最適なモデルを見つけるため、異なるモデルを試す
