# SPEC_review.md

対象: SPEC.md（買い物思い出しメモ PWA）
レビュー方式: 単独レビュー（MODE_B）

```
EXECUTION_MODE: MODE_B
REASON: Codex CLI の実行確認が取れないため、単独レビュー方式で実施
```

---

## Reviewer A: 仕様整合性レビュー

### RA-01 【Medium】削除機能のスコープが未明示

- **Problem**: 買い物メモとして「削除」は基本操作の一つだが、Section 4「スコープ」の「含むもの」にも「含まないもの」にも記載がない。将来拡張案に「未購入品の削除」「購入済み品の一括削除」が挙がっていることから、現時点では除外意図があると推測できるが、明示されていない。
- **Evidence**: Section 4.1（含むもの）、Section 4.2（含まないもの）に削除の記載なし。Section 17（将来拡張案）に「未購入品の削除」「購入済み品の一括削除」あり。
- **Suggested Fix**: Section 4.2 に「未購入品の個別削除」「購入済み品の一括削除」を明示的に追加する。

### RA-02 【Medium】`checkedAt` の戻し規約なし

- **Problem**: Section 10 のデータ要件で「`checkedAt`: 未購入時は null」と定義しているが、Section 8.4（購入済み解除機能）で購入済み品を未購入に戻した場合に `checkedAt` を null にリセットするか保持するかが未定義。並び順（購入済み品の購入順）に影響する。
- **Evidence**: Section 10「checkedAt: 購入済み順または購入日時。未購入時は null」、Section 8.4「チェックを外した項目は未購入品に戻ること」。
- **Suggested Fix**: Section 10 または Section 8.4 に「購入済み解除時は `checkedAt` を null にリセットする」と明記する。

### RA-03 【Low】Enter キー登録の必須性が曖昧

- **Problem**: Section 8.1「Enter キーでも登録できてもよい」は任意扱いだが、受け入れ条件（AC-03）はボタン押下のみで Enter の AC がない。任意扱いのまま実装すると登録漏れになるが、現時点でそれが意図的かが不明確。
- **Evidence**: Section 8.1「Enter キーでも登録できてもよい」、AC-03「買い物項目を1件追加できること」。
- **Suggested Fix**: 「任意機能として実装してよい」と明示するか、AC-04 相当で AC に追加する。

### RA-04 【Low】文字数上限「100文字程度」が曖昧

- **Problem**: Section 8.1「文字数上限は 100 文字程度」の「程度」が実装上の正確な上限値を確定できない。Section 12「極端に長い入力は禁止」とも数値が一致しない。
- **Evidence**: Section 8.1、Section 12。
- **Suggested Fix**: 「100文字」と明確な数値に統一する。

---

## Reviewer B: 単純化・簡潔化レビュー

### RB-01 【Low】Section 11（表示ルール）と Section 8（機能要件）の重複

- **Problem**: Section 11.1〜11.3 の表示ルールは Section 8.2/8.3/8.5 の機能要件とほぼ同内容。独立セクションとして置く意義が薄い。
- **Suggested Fix**: Section 11 を削除し、Section 8 の各機能要件に統合するか、差分情報のみ Section 11 に残す。ただし読みやすさに貢献しているなら存置でも可。

---

## Reviewer C: 実装・運用レビュー

### RC-01 【Low】localStorage のキー名が未定義

- **Problem**: Section 8.6・Section 14 でデータ保存先を `localStorage` と定めているが、キー名（例: `shopping-memo-items`）が未定義。実装者依存になり、将来的に複数プロジェクトで競合するリスクがある。
- **Suggested Fix**: Section 14 または Section 8.6 に推奨キー名を記載するか、「実装者が固有名を定める」と明示する。

### RC-02 【Low】service worker 更新戦略が未定義

- **Problem**: Section 8.7「最低限の静的アセットをキャッシュできること」はキャッシュの存在を要求しているが、アプリ更新時の古いキャッシュ削除や更新検知の戦略が未定義。GitHub Pages 更新後に古いバージョンがキャッシュから提供され続けるリスクがある。
- **Suggested Fix**: 「キャッシュバージョンを管理し、service worker 更新時に旧キャッシュを削除する」旨を追記するか、「詳細は実装フェーズで定義する」と明示する。

---

## Reviewer D: 質問抽出レビュー

### RD-01 【Medium】削除機能は本バージョンのスコープ外か？

- 将来拡張案にあるが、現バージョンのスコープとして明示されていない。
- USECASE.md を作成する際に「削除ユースケース」を含めるかどうかに直接影響する。
- 推測でスコープを確定してはならない。

### RD-02 【Medium】`checkedAt` 戻し時の規約を確定すべきか？

- 購入済み解除時に `checkedAt` を null にリセットするのが自然だが、「購入済みにした日時を記録として残す」設計の場合はリセットしない選択もある。
- CLASS.md・実装フェーズで問題になるため、早期確定が望ましい。

---

## Arbiter: 採否判定

| 対象 | Decision | Reason |
|------|----------|--------|
| RA-01 削除機能未明示 | **採用** | USECASE.md 作成前に確定が必要 |
| RA-02 checkedAt 戻し規約 | **採用** | データ設計に影響 |
| RA-03 Enter キー曖昧 | **保留** | 任意機能として実装で吸収可能。質問には含めない |
| RA-04 文字数「程度」 | **採用（改訂のみ）** | 100文字に統一して改訂で解決。質問不要 |
| RB-01 Section 11 重複 | **却下** | 読みやすさに貢献しており削除不要 |
| RC-01 localStorage キー名 | **保留** | 実装フェーズで決定可能 |
| RC-02 service worker 更新 | **保留** | 最低限キャッシュの範囲で現状は問題なし |
| RD-01 削除機能スコープ | **採用** → 質問ファイルへ |
| RD-02 checkedAt 戻し規約 | **採用** → 質問ファイルへ |

---

## Review Result

```
Status: NEEDS_ANSWER
Blocking: yes
Next Action: answer_questions
```

**理由**: RD-01（削除機能スコープ）は USECASE.md 作成前に確定が必要なため Blocking: yes とする。
