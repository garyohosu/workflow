# QandA.md

WORKFLOW.md (v0.3.0) レビューで抽出された質問と、確定回答の一覧。

---

## Review Result (このドキュメント生成時点)

```
EXECUTION_MODE: MODE_B
REASON: Codex CLI の実行確認が取れないため、単独レビュー方式で実施
Status: NEEDS_ANSWER → answers_completed
Blocking: no（全質問回答済み）
Next Action: revise_artifact
```

---

## Q-A01 【High】Artifact Definitions セクションと本文サンプルの不一致

**質問**: `API.md` は末尾 Artifact Definitions に追加すべきか？それともサンプルから削除すべきか？

**回答（確定）**: Section 6.1 のサンプルから `API.md` を削除する。
末尾の Artifact Definitions（機械可読定義）は `IMPLEMENTATION_PLAN.md` までしか有効化しておらず、ブートストラップはその定義を優先する。サンプルだけ `API.md` を含めると「例」と「実際の機械可読定義」が食い違うため、サンプルを末尾定義に揃える。

---

## Q-A02 【High】連携レビュー時の `review_file` フィールドの扱い

**質問**: `review_file` を配列型に変更するか、最終統合ファイル1本を正式参照先にするか？

**回答（確定）**: 最終統合ファイルを必ず1本生成し、state はそれだけを参照する方式とする。

```
reviews/SPEC_review_claude.md    ← 観点別（保存）
reviews/SPEC_review_codex.md     ← 観点別（保存）
reviews/SPEC_review_arbiter.md   ← 観点別（保存）
reviews/SPEC_review.md           ← 正式参照先（state が読む）
```

自動進行ループは最新レビュー結果を1本読めばよくなり、分岐が減る。`review_file` は単一パスのまま維持する。

---

## Q-A03 【High】`review_requested` 状態の遷移タイミングが未定義

**質問**: `review_requested` は非同期レビュー待機のための状態か？同期実行のみ想定であれば削除してよいか？

**回答（確定）**: 現バージョンは同期処理前提のため `review_requested` を削除する。
将来、非同期設計（Claude Code から Codex CLI を投げて結果待ち）を導入する場合に `drafted → review_requested → reviewed` を明文化して復活させる。

---

## Q-A04 【Medium】一時的エラーの再試行上限が未定義

**質問**: 再試行は最大何回か？上限後は `blocked` として `blocking_issues` に記録するか？

**回答（確定）**: 最大3回、指数バックオフで再試行する。上限超過後は `blocked` に遷移し、`blocking_issues` に記録して停止する。

---

## Q-A05 【Medium】回答担当AIは人間か AI 自律回答か

**質問**: 回答担当AIによる自律回答は許可するか？または人間承認が必要か？

**回答（確定）**: AIが回答案を作成し、人間が承認して `answers.md` を確定する方式とする。
AIが仕様判断を自律確定することは原則6（「AIは推測で仕様を確定しすぎない」）に反するため不可。

---

## Q-A06 【Medium】`current_phase` の取りうる値が未定義

**質問**: `current_phase` の列挙を追加するか？または `current_artifact` だけで管理して `current_phase` を廃止するか？

**回答（確定）**: `current_artifact` 中心で進行管理し、`current_phase` は補助表示として格下げする。ただし取りうる値は以下のとおり列挙する。

- `spec` / `usecase` / `sequence` / `class` / `test` / `optional` / `implementation` / `testing` / `done`

自動進行判定の主キーは `current_artifact` とし、`current_phase` は人間向けのステータス表示用とする。

---

## Q-A07 【Medium】ログフォーマットが未定義

**質問**: ログ形式は JSONL か、区切り付きテキストか？最低限のフィールド定義を追加するか？

**回答（確定）**: JSONL（1行1イベント）を採用する。最低限のフィールドは以下とする。

```json
{
  "timestamp": "ISO8601",
  "artifact": "SPEC.md",
  "step": "review",
  "actor": "claude_code",
  "command": "",
  "output_file": "reviews/SPEC_review.md",
  "status": "APPROVED",
  "next_action": "start_next_artifact",
  "execution_mode": "MODE_B",
  "error": null
}
```

---

## Q-A08 【Medium】WORKFLOW.md バージョンアップ時の state.json 移行規約が未定義

**質問**: `workflow_version` フィールドを追加し、不一致時の動作を規定するか？

**回答（確定）**: `state.json` に `workflow_version` フィールドを追加する。WORKFLOW.md バージョンと不一致の場合は警告ログを出力し、`migrate_required: true` フラグを立てて停止する。自動再初期化は行わない（進行中状態の損失を防ぐため）。

---

## Q-A09 【Low】`回答担当AI` と `Claude Code` の役割重複

**質問**: 連携レビュー（MODE_A）時、回答ファイルの生成は Claude Code か Codex CLI か別 API か？

**回答（確定）**: MODE_A でも回答ファイルの生成は Claude Code 側が担当する。Codex CLI はレビュー専任とし、回答生成には関与しない。

---

## Q-A10 【Low】Section 24.2 `--json` の出力フォーマットが未定義

**質問**: `--json` 出力のフィールド定義を追記するか？正式な機械処理には Section 11 のみを使うと明記するか？

**回答（確定）**: `codex exec --json` の出力詳細フォーマットには依存しない。正式な機械判定は Section 11 の機械可読ブロック（`## Review Result` / `Status:` / `Blocking:` / `Next Action:`）のみを対象とする旨を明記する。`--json` オプションは参考利用にとどめる。

