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

---

## 追加レビュー質問（確定回答）

## Q-A11 【High】人間承認待ちの回答案をどこに保持するか

**質問**: AI は回答案を作るが `qa/*_answers.md` は人間承認後にしか確定できない、という運用になった。  
このとき承認前のドラフトはどこに保存するか？また、承認待ち状態を `state/state.json` のどのフィールドで表現するか？

**回答（確定）**: 承認前の回答案は `qa/*_answers_draft.md` に保存し、承認後にのみ `qa/*_answers.md` を確定版として生成する。  
`state/state.json` には `answers_draft_file` と `answer_approval_status` を追加する。

追加フィールド:

- `answers_draft_file`: 承認前ドラフトへのパス
- `answers_file`: 承認済み確定版へのパス
- `answer_approval_status`: `none | draft_generated | awaiting_human_approval | approved | rejected`
- `pending_question_set`: 対応する質問ファイルまたはレビューID

状態遷移:

- `reviewed → answers_draft_generated`
- `answers_draft_generated → awaiting_answer_approval`
- `awaiting_answer_approval → answers_completed`
- `awaiting_answer_approval → needs_answer_revision`

自動進行ループ規約:

- `answers_file` がなくても、`answers_draft_file` が存在し `answer_approval_status=awaiting_human_approval` の場合は再生成しない
- 人間承認後にのみ `answers_file` を正式採用する
- 却下時は既存ドラフトを上書きせず、改訂版ドラフトを新規生成してもよい

---

## Q-A12 【Medium】`Blocking:` フィールドの意味と判定規約

**質問**: Section 11 の機械判定対象に `Blocking:` を含めるなら、`yes` / `no` の意味を明文化するか？  
特に `Status: NEEDS_ANSWER` と `Blocking:` の組み合わせをどう扱うかを固定するか？

**回答（確定）**: `Blocking:` は、その結果が次工程への自動進行を停止すべきかどうかを表す機械判定フラグとする。

意味:

- `Blocking: yes`: 次工程へ進んではならない。人間回答、仕様確定、または重大修正が完了するまで停止する
- `Blocking: no`: 課題や質問はあるが、次工程に進める。必要に応じて後続で解消してよい

Status との組み合わせ規約:

- `APPROVED + Blocking: no`: 正常進行
- `APPROVED + Blocking: yes`: 原則禁止
- `NEEDS_REVISION + Blocking: yes`: 修正完了まで停止
- `NEEDS_REVISION + Blocking: no`: 軽微修正なら継続可だが、通常はこの組み合わせを避ける
- `NEEDS_ANSWER + Blocking: yes`: 未回答の重要質問があるため停止
- `NEEDS_ANSWER + Blocking: no`: 補足質問のみ。後続へ進行可
- `BLOCKED + Blocking: yes`: 停止

推奨ルール:

- High の未回答質問が1件でもある場合は原則 `Blocking: yes`
- Medium / Low のみで、かつ仕様確定に直結しない場合は `Blocking: no`
- 自動進行ループは `Blocking: yes` を見たら `blocked` へ遷移し、`blocking_issues` に記録する

---

## 追加レビュー質問（v0.3.1 レビュー）

## Q-A13 【Medium】Review Result 内の `Next Action` の有効値リスト

**質問**: Section 11 で定義されている `Next Action:` や、Section 16.4 の `next_action` で使用される文字列の完全なリストはあるか？
自動進行ループを安定させるため、`start_next_artifact`, `answer_questions`, `generate_spec`, `revise_artifact`, `re_review` などの有効値を定義すべきではないか。

**回答（確定）**: Next Action の有効値を以下に固定する。
- `generate_artifact`
- `review_artifact`
- `answer_questions`
- `await_human_answer_approval`
- `revise_artifact`
- `re_review`
- `start_next_artifact`
- `start_implementation`
- `run_tests`
- `mark_done`
- `blocked`

補足として、`generate_spec` などの成果物固有値は廃止し、`current_artifact` と組み合わせて解釈する。表記ゆれを防ぐため、AI に自由作文させずこれらの値から選択させる。

---

## Q-A14 【High】`NEEDS_ANSWER + Blocking: no` 時の進行ロジック

**質問**: Section 11.1 では `NEEDS_ANSWER + Blocking: no` の場合に「後続へ進行可」としているが、Section 15（自動進行ループ）の Step 11 では「最新レビュー結果が `APPROVED` なら次成果物へ進む」と記述されており、整合していない。
Step 11 の判定条件を `APPROVED` または `Blocking: no` に拡張すべきか？

**回答（確定）**: Section 14.1（進行条件）と Section 15 Step 11（自動進行ループ）の両方を修正し、`APPROVED` だけでなく `Blocking: no` かつ `Next Action: start_next_artifact` の場合も進行可能とする。

- Section 14.1 の進行条件を「最新レビュー結果が APPROVED、または NEEDS_ANSWER であっても Blocking: no かつ後続進行可と明示されていること」に緩和する。
- Section 15 Step 11 を「最新レビュー結果が APPROVED、または Blocking: no かつ Next Action: start_next_artifact の場合は次成果物へ進む」に変更する。

---

## Q-A15 【Medium】`qa/*_answers.md` 確定処理の主体とトリガー

**質問**: Section 13.5 および 15 (Step 9) によれば、人間承認後に `_answers.md` が確定される。
この「確定（ファイルの書き出し）」を行うのは AI か人間か？
AI が行う場合、人間が `answer_approval_status` を `approved` に更新したことを検知して自動で `_answers_draft.md` を `_answers.md` へリネーム/コピーする挙動でよいか？

**回答（確定）**: 承認は人間が行い、確定ファイルの書き出しは AI（Claude Code）が行う。
1. 人間が `answer_approval_status=approved` に更新する。
2. AI がそれを検知し、`*_answers_draft.md` から `*_answers.md` を生成する。
3. 生成後、AI が `status=answers_completed` に更新する。
これにより、責任分界を明確にしつつ自動進行ループとの親和性を高める。

---

## Q-A16 【Low】Section 17 テンプレートと末尾定義の不整合

**質問**: Section 17 の `state/state.json` テンプレートには `IMPLEMENTATION_PLAN.md` が含まれていないが、末尾の `Artifact Definitions` には含まれている。
テンプレートはあくまで「定義がない場合のデフォルト」という位置づけだが、同じファイル内で食い違っていると混乱を招くため、テンプレート側にもコメントで「定義に従って追加される」旨を記すべきではないか。

**回答（確定）**: Section 17 のテンプレート直前に以下の注記を追加する。
「このテンプレートは機械可読な成果物定義が存在しない場合の標準例である。## Artifact Definitions に任意成果物が定義されている場合は、それらを artifact_order と artifacts に追加して生成する。」

---

## v0.3.1 レビュー後の新規質問

## Q-A17 【High】`needs_answer_revision` 状態から自動ループが再ドラフトを生成できない

| 項目 | 内容 |
|------|------|
| **問題** | Section 7 で `needs_answer_revision` 状態が定義されているが、Section 15（自動進行ループ）の Step 7「回答ドラフトが未生成なら生成する」では、ドラフトファイルが既に存在するため再生成がスキップされる。却下後の再ドラフト生成に対応するステップがない。 |
| **根拠** | Section 15 Step 7（ドラフト未生成チェック）と Section 7 の `needs_answer_revision` の定義。 |
| **なぜ推測で決めてはいけないか** | 却下後に既存ドラフトを上書きするのか、連番ファイルで保存するのか（例: `*_answers_draft_v2.md`）によって、ループ処理・ファイル命名規約・状態遷移が変わる。 |
| **質問** | `needs_answer_revision` 状態でドラフトを再生成する場合、既存の `*_answers_draft.md` を上書きするか、別ファイルに保存するか？また、自動ループのどのステップで再生成を行うか？ |

---

## Q-A18 【High】Section 3 原則1 と Q-A14（`Blocking: no` 進行）の矛盾

| 項目 | 内容 |
|------|------|
| **問題** | Section 3 原則1「最新レビュー結果が `APPROVED` でない成果物は未完了とみなす」は、Q-A14 の「`NEEDS_ANSWER + Blocking: no` でも次工程へ進める」と矛盾する。自動進行ループや進行条件（Section 14.1）は緩和されたが、基本原則が旧仕様のままになっている。 |
| **根拠** | Section 3 原則1（行49–50）と Section 14.1（緩和後）の記述の乖離。 |
| **なぜ推測で決めてはいけないか** | 原則の記述が実際の動作と食い違うと、AIが原則を読んで誤った判断をするリスクがある。 |
| **質問** | 原則1を「`Blocking: no` の `NEEDS_ANSWER` は例外的に次工程へ進行可能」と修正するか？または「原則として APPROVED を要求するが、軽微な未確定事項は後続で解消できる」と表現を緩和するか？ |

---

## Q-A19 【Medium】Section 18（実装フェーズ進行条件）に `Blocking: no` 例外を適用するか

| 項目 | 内容 |
|------|------|
| **問題** | Section 18「実装フェーズへの進行条件」は全必須成果物の「承認済み」を要求している。Q-A14 の緩和（`Blocking: no` で次成果物へ進行可）は設計成果物間の遷移に適用されるが、実装フェーズへの最終ゲートにも同じ緩和を適用するかどうかが未定義。 |
| **根拠** | Section 18（行768–777）と Section 14.1 の進行条件の関係。 |
| **なぜ推測で決めてはいけないか** | 実装フェーズへの移行は後戻りコストが高いため、`Blocking: no` での進行を許すかどうかは意図的に決める必要がある。 |
| **質問** | Section 18 の実装フェーズ進行条件は「全必須成果物が `APPROVED`」のみを要求するか（`Blocking: no` 例外なし）？それとも設計工程と同様に `Blocking: no` を許容するか？ |
