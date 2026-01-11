# <img src="https://github.com/miyamoto-hai-lab/chat-ui/blob/main/docs/icon.jpg?raw=true" height="50" style="vertical-align: bottom;"> Chat UI &nbsp; (<b>日本語</b> | <a href="README_en.md">English</a>)

[![サンプルWebサイトをGitHub Pagesで公開中です](https://github.com/miyamoto-hai-lab/chat-ui/actions/workflows/nextjs.yml/badge.svg)](http://miyamoto-hai-lab.github.io/chat-ui/)

Chat UIは、LLM（大規模言語モデル）と対話するための、設定可能な静的Webアプリケーションです。
設定ファイル (`config.yaml`) を編集するだけで、APIエンドポイント、モデル、UIの挙動、認証設定などを柔軟にカスタマイズできます。
Next.jsで構築されており、静的サイトとしてビルドして、GitHub Pagesや任意のWebサーバーに簡単にデプロイできます。

<p>
<img width="45%" alt="チャット画面" src="https://github.com/user-attachments/assets/98095304-9971-45c8-8562-03679db7506a" />
<img width="45%" alt="設定画面" src="https://github.com/user-attachments/assets/5bb2a856-3280-4e5f-9f26-442312221a7e" />
</p>

## 特徴

*   **完全な設定可能性**: `config.yaml` ひとつで、API接続先、システムプロンプト、UIの表示形式などを管理。
*   **マルチプロバイダ対応**: OpenAI, Gemini, Anthropic, Grok, DeepSeek, Ollama など主要なLLMプロバイダに対応。
*   **静的ホスティング**: `pnpm build` で静的HTML/JS/CSSとして出力され、バックエンドサーバー（Node.js等）なしで動作可能。
*   **認証機能**: パスワード認証や外部サーバーへの認証リクエスト機能を内蔵。
*   **柔軟なユースケース**:
    *   社内用チャットボット（固定プロンプト・固定モデル）
    *   クラウドソーシング実験用（パスワード認証・ログ送信）
    *   デモ展示用（ターン数制限・自動リセット）

## 使い方

必要なツールをインストールし、設定ファイルを書き換えてビルドし、Webサーバーに置くだけで使えます。

### 1. 前提条件

*   Node.js (v20以上推奨)
*   pnpm (パッケージマネージャー)

### 2. インストール

リポジトリをクローンし、依存関係をインストールします。

```bash
git clone https://github.com/miyamoto-hai-lab/chat-ui.git
cd chat-ui
pnpm install
```

### 3. 設定 (`config.yaml`)

プロジェクトルートにある `config.yaml` を編集して、アプリケーションの動作を設定します。
デフォルトで `config.yaml` が用意されていますので、これをコピー・編集して使用してください。

#### 主な設定項目

`config.yaml` の主要なセクションと設定値について説明します。

##### 1. アプリ基本設定 (`app`)

| パラメータ | 説明 | 例 |
| :--- | :--- | :--- |
| `title` | ブラウザのタブやヘッダーに表示されるタイトル。 | `"実験用チャット"` |
| `description` | 画面に表示する説明文や指示（Markdown対応）。 | `"注意事項: ..."` |

##### 2. LLM設定 (`llm`)

使用するAIモデルと接続先を設定します。ここで固定した値は、ユーザーが画面上で変更できなくなります。

| パラメータ | 説明 | オプション・例 |
| :--- | :--- | :--- |
| `provider` | APIプロバイダ。<br>`openai`互換APIを使用する場合は`openai`を選択し`endpoint_url`を指定してください。 | `openai`, `gemini`, `anthropic`, `grok`, `deepseek`, `local` (Ollama等) |
| `endpoint_url` | APIサーバーのURL。<br>Ollama等の場合は `http://localhost:11434/v1` のように指定。 | `https://api.openai.com/v1` |
| `model` | 使用するモデル名。 | `gpt-4o`, `gemini-1.5-pro` |
| `api_key` | APIキー（API接続に必要な場合）。 | `sk-...` |
| `system_prompt` | システムプロンプト。AIの役割や振る舞いを定義します。 | `"あなたは有能なアシスタントです..."` |
| `permissions` | ユーザーによる設定変更を許可するかどうかのフラグ。 | `allow_change_config: false` (変更不可) |

> [!TIP]
> `file::` プレフィックスを使用することで、値を外部ファイル（例: `prompts/system.txt`）から読み込むことができます。  
> **注意**: `file::` はビルド時に評価され、ファイルの内容で置換されます（実行時は固定値となります）。

##### 3. チャットの挙動 (`chat`)

| パラメータ | 説明 | オプション・例 |
| :--- | :--- | :--- |
| `start_role` | 会話の開始者。<br>`assistant`: ページを開いた瞬間に挨拶などが生成される。<br>`user`: ユーザーが入力を開始する。 | `user`, `assistant` |
| `prefill_messages` | 初期表示する会話履歴。 | リスト形式（詳細はconfig.yaml参照） |
| `max_turns` | 最大会話ターン数（1ターン＝ユーザー+AIの発言）。0で無制限。 | `10`, `0` |
| `on_limit_reached` | 最大ターン数到達時の動作を指定します。<br>- `modal`: 操作不能になり、リセットか終了を促すモーダルを表示。<br>- `inline`: チャットの最後に終了メッセージを表示。<br>- `none`: 何も表示せず、入力のみ無効化。 | `action: "modal"`<br>`auto_exit_delay_sec: 5` (5秒後に自動リダイレクト) |

##### 4. UI・表示設定 (`ui`)

| パラメータ | 説明 | オプション・例 |
| :--- | :--- | :--- |
| `styles.generation_style` | 応答生成中の表示スタイル。<br>- `streaming`: 文字単位でリアルタイム表示。<br>- `spinner`: 生成中は「考え中」アニメーションを表示。<br>- `read`: 送信直後に「既読」を付け、完了後に一括表示。<br>- `instant`: 何も表示せず、完了後に一括表示。 | `streaming`, `spinner`, `read`, `instant` |
| `styles.message_style` | メッセージのバルーンスタイル。 | `bubble` (LINE風), `flat` (ChatGPT風) |
| `components.exit_button_visibility` | ヘッダーの終了ボタンの表示ルール。<br>- `always`: 常に表示。<br>- `on_limit`: 最大ターン数到達時のみ表示。<br>- `never`: 表示しない。 | `always`, `on_limit`, `never` |
| `turn_counter.style` | ターン数（発言数）の表示形式。<br>- `hidden`: 表示しない。<br>- `fraction`: "5 / 10" のように表示。<br>- `custom`: "5 / 任意の文字" の形式。 | `fraction`, `hidden`, `custom` |
| `theme` | カラーテーマの設定。`base`で基本テーマを選び、`colors`で個別色を上書き可能。 | `base: "light"`, `base: "dark"`, `base: "system"`<br>`colors: { user_bubble: "#000000" }` |

##### 5. システム設定 (`system`)

| パラメータ | 説明 |
| :--- | :--- |
| `security.password_auth_enabled` | `true`にすると、利用開始時にパスワード入力を求めます |
| `logging` | チャットログや操作ログを外部サーバーに送信する場合に設定します。 |
| `heartbeat` | アプリ利用中に定期的に死活監視リクエストを送る場合に設定します。 |

#### 詳細仕様

##### プレースホルダー（実行時評価）

URLやリクエストボディなど、一部の設定値において `${変数名}` 形式のプレースホルダーが使用できます。これらは**実行時（ブラウザ上）**に評価・置換されます。

*   **URLクエリパラメータ**: URLに含まれるクエリパラメータが変数として利用可能です。
    *   例: `http://.../?id=123` でアクセスした場合、`${id}` は `123` に置換されます。
*   **特別な変数**:
    *   `${PASSWORD}`: 認証で使用されたパスワード（入力値）に置換されます。

**変換オプション**:
変数の前にプレフィックスを付けることで、値を変換してから埋め込むことができます。
*   `${#key}` または `${e#key}`: Base64エンコード
*   `${u#key}`: URL-Safe Base64エンコード
*   `${d#key}`: Base64デコード

##### パスワード認証と自動ログイン

`system.security.password_auth_enabled: true` の場合、アプリ起動時にパスワード入力を求めます。

*   **自動ログイン**: URLクエリパラメータ `p` に **Base64エンコードされたパスワード** を付与することで、入力をスキップして自動ログインできます。
    *   例: `http://localhost:3000/?p=cGFzc3dvcmQ=` (password="password")
*   **設定の保存**: 入力されたパスワードや、ユーザーが変更した設定（APIキーなど）は、ブラウザの `localStorage` に保存され、次回アクセス時に保持されます。

##### ログ送信(`logging`)

`target_events` で指定したイベント（`CHAT_MESSAGE` など）が発生した際に、`endpoint_url` に対して **POSTリクエスト** でログデータを送信します。
リクエストの形式は固定されており、以下のJSONがBodyとして送信されます。

```json
{
  "eventType": "CHAT_MESSAGE",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": { ... }
}
```

##### ハートビート (`heartbeat`) と認証リクエスト (`auth_request`)

これらは柔軟なリクエスト設定が可能です。URL、Headers、Body内でプレースホルダーが利用できます。

```yaml
url: "https://api.example.com/heartbeat"
method: "POST"
headers:
  "Content-Type": "application/json"
  "Authorization": "Bearer ${PASSWORD}" # パスワードをトークンとして使用
body: '{"status": "alive", "user": "${id}"}' # JSON文字列として記述
```

*   **Heartbeat**: `interval_sec` で指定した秒数ごとにリクエストを送信し続けます。

### 4. カスタマイズ

#### アバター画像の変更

`public` ディレクトリに以下の名前で画像ファイルを置くことで、デフォルトのアバターアイコンを上書きできます。

*   **ユーザーアバター**: `user_avatar.png` (または `jpg`, `svg`, `gif`, `webp` 等)
*   **アシスタントアバター**: `assistant_avatar.png` (または `jpg`, `svg`, `gif`, `webp` 等)

ビルド時に自動的に検出され、適用されます。ファイルが存在しない場合、デフォルトのアイコンが表示されます。

#### ベースパスの変更

サブディレクトリ（例: `https://example.com/chat/`）で公開する場合は、`config.yaml` の `base_path` を設定してください。

```yaml
base_path: "/chat"
```

### 5. 開発・プレビュー

ローカルで動作確認を行う場合:

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` にアクセスすると確認できます。

### 6. ビルド

本番用に静的ファイルを生成します。

```bash
pnpm build
```

ビルドが完了すると、`out` ディレクトリに静的ファイルが出力されます。

### 7. デプロイ

`out` ディレクトリの中身を、Webサーバーのドキュメントルート（`public_html` や `www` など）にアップロードするだけで完了です。
GitHub Pages, Vercel, Netlify, Amazon S3, あるいは一般的なレンタルサーバー（Apache/Nginx）などで動作します。

## 技術スタックと貢献

技術的な詳細や、開発に参加するための情報は [CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

## ライセンス

[MIT License](LICENSE)
