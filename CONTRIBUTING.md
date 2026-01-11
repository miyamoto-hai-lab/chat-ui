# 開発者ガイド (CONTRIBUTING)

このドキュメントでは、Chat UIの技術的な詳細、プロジェクト構造、および開発ワークフローについて解説します。

## 技術スタック

*   **フレームワーク**: [Next.js](https://nextjs.org/) (App Router)
*   **言語**: TypeScript
*   **スタイリング**: [Tailwind CSS](https://tailwindcss.com/)
*   **UIコンポーネント**: [Radix UI](https://www.radix-ui.com/) (基本コンポーネント), [Lucide React](https://lucide.dev/) (アイコン)
*   **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
*   **パッケージマネージャー**: pnpm
*   **フォーマッター/リンター**: [Biome](https://biomejs.dev/)

## プロジェクト構造

```
chat-ui/
├── config.yaml          # アプリケーション設定ファイル（ユーザーが編集）
├── config.schema.json   # config.yamlのバリデーション用JSONスキーマ
├── public/              # 静的ファイル（画像など）
│   ├── assistant_avatar.png  # アシスタントのアバター画像（任意）
│   └── user_avatar.png       # ユーザーのアバター画像（任意）
├── src/
│   ├── app/             # Next.js App Routerのページ・レイアウト
│   │   ├── layout.tsx   # 全体のレイアウト（フォント、メタデータ定義）
│   │   ├── page.tsx     # メインのチャット画面
│   │   └── globals.css  # グローバルCSS（Tailwind, テーマ変数）
│   ├── components/      # UIコンポーネント
│   │   ├── chat/        # チャット関連 (ChatMessage, ChatInputなど)
│   │   ├── settings/    # 設定モーダル関連
│   │   ├── ui/          # 汎用UIパーツ (Button, Input, Dialogなど)
│   │   └── providers/   # Contextプロバイダ (SettingsProviderなど)
│   ├── hooks/           # カスタムHooks
│   ├── lib/             # ユーティリティ、ロジック
│   │   ├── chat-service.ts  # チャットロジックのコア
│   │   ├── storage.ts       # ローカルストレージ管理
│   │   ├── placeholder.ts   # 変数置換ロジック
│   │   └── ...
│   └── types/           # TypeScript型定義
│       └── config.ts    # 設定ファイルの型定義 (AppConfig)
└── package.json
```

## 開発コマンド

*   `pnpm dev`: 開発サーバーを起動します (localhost:3000)。
*   `pnpm build`: 本番用ビルドを実行します (`out` ディレクトリに出力)。
*   `pnpm lint`: Biomeを使用してコードの品質チェックを行います。
*   `pnpm format`: Biomeを使用してコードのフォーマットを行います。

## 設定ファイルの仕組み (`config.yaml`)

このアプリケーションは、ビルド時に `config.yaml` を読み込み、アプリケーションの挙動を決定します。
`src/types/config.ts` で型定義されており、`config.schema.json` によって構造が検証されます。

主なカスタマイズポイント:

1.  **AI SDK連携**: `src/lib/chat-service.ts` および `src/lib/provider-config.ts` で各プロバイダ（OpenAI, Gemini等）の初期化を行っています。新しいプロバイダを追加する場合はここを修正します。
2.  **UIテーマ**: `src/types/config.ts` の `ui.theme` セクションで定義され、`src/app/globals.css` および `src/components/providers/ThemeProvider.tsx` (もしあれば) またはCSS変数を通じて適用されます。
3.  **アバター**: `public` ディレクトリに特定のファイル名の画像を配置することで、デフォルトのアバターを上書きするロジックが `src/hooks/useAvatarImages.ts` に実装されています。

## 新機能の追加

機能追加を行う際は、以下の手順を推奨します。

1.  必要であれば `config.yaml` と `src/types/config.ts` に設定項目を追加する。
2.  `src/components` にUIコンポーネントを追加・修正する。
3.  `src/lib` にロジックを実装する。
4.  `pnpm lint` と `pnpm format` を実行してコードスタイルを整える。

## その他

*   **多言語対応**: `src/locales` ディレクトリと `i18next` を使用して、UIの多言語化を行う基盤があります。
*   **プレースホルダー**: 設定値の一部（URLなど）では `${PASSWORD}` などのプレースホルダーが使用可能です。これらは `src/lib/placeholder.ts` で処理されます。
