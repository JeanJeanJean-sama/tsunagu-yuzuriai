# 変更の記録（CHANGELOG）

新しいものを上に書いてください。

## 2026-10-05 v0.1.0 試作版
- 一覧・絞り込み、投稿（新規・編集・削除）、相談メッセージ、状態管理、マイページ、ルール（たたき台）、設定を作成。
- データはブラウザ内（localStorage）に保存。設定画面で架空の会員を切り替えて、ゆずる側・もらう側を試せる。
- データ層の自動テスト（`npm test`、9件）。
- 引き継ぎ用資料：CLAUDE.md、docs/ARCHITECTURE.md、ROADMAP.md、BACKEND_PLAN.md、DECISIONS.md。
- **残り**：GitHub Pages で公開して会員に試してもらう → Supabase で本番化（ROADMAP フェーズ2）。
