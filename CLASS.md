CLASS.md

買い物思い出しメモ PWA — クラス・データ構造定義

1. 概要

本アプリはクライアントサイド JavaScript で実装する単一ページアプリケーションである。
クラスは論理的な責務単位として定義し、ES6 クラス構文で実装することを想定する。

2. データ型

────────────────────────────────────────
Item（データオブジェクト）
────────────────────────────────────────

アプリが管理する1件の買い物項目を表す。

フィールド:
・id: string — 一意な識別子（例: Date.now().toString()）
・text: string — 項目名（1〜100文字）
・checked: boolean — 購入済み状態（true: 購入済み, false: 未購入）
・createdAt: number — 作成日時（Unix タイムスタンプ ms）
・checkedAt: number | null — 購入日時（Unix タイムスタンプ ms）。未購入時は null。購入済みを解除した場合も null にリセット。

例:
{
  "id": "1711234567890",
  "text": "牛乳",
  "checked": false,
  "createdAt": 1711234567890,
  "checkedAt": null
}

3. クラス定義

────────────────────────────────────────
StorageService
────────────────────────────────────────

責務: localStorage への Item 配列の読み書き

定数:
・STORAGE_KEY: string = "shopping-memo-items"

メソッド:
・load(): Item[]
  - localStorage から STORAGE_KEY の値を読み込み JSON パースして返す
  - 値が存在しない場合は空配列を返す
  - JSON パースに失敗した場合は空配列を返す（破損データの初期化）

・save(items: Item[]): void
  - items を JSON 文字列化して STORAGE_KEY に保存する
  - 保存失敗時は例外をキャッチしてエラーイベントを発火する（アプリは停止しない）

────────────────────────────────────────
AppController
────────────────────────────────────────

責務: ビジネスロジック・状態管理・UI との橋渡し

プロパティ:
・items: Item[] — 全アイテムのメモリ上のリスト
・storage: StorageService — ストレージ参照
・ui: UIRenderer — UI 描画参照

メソッド:
・init(): void
  - storage.load() でデータを復元し items に格納
  - ui.renderAll(items) を呼び出して初期描画する

・addItem(text: string): void
  - バリデーション: trim 後に空文字または 100 文字超なら処理しない
  - 新しい Item を生成して items の先頭に追加
  - storage.save(items) を呼ぶ
  - ui.prependToUncheckedList(item) を呼ぶ

・checkItem(id: string): void
  - items から id に一致するアイテムを探す
  - checked=true, checkedAt=Date.now() に更新する
  - storage.save(items) を呼ぶ
  - ui.moveToCheckedList(item) を呼ぶ

・uncheckItem(id: string): void
  - items から id に一致するアイテムを探す
  - checked=false, checkedAt=null に更新する
  - storage.save(items) を呼ぶ
  - ui.moveToUncheckedList(item) を呼ぶ

・expandCheckedList(): void
  - ui.renderAllCheckedItems(items) を呼ぶ

────────────────────────────────────────
UIRenderer
────────────────────────────────────────

責務: DOM 操作・一覧描画・イベントバインド

定数:
・INITIAL_CHECKED_DISPLAY_COUNT: number = 20

メソッド:
・renderAll(items: Item[]): void
  - 未購入品と購入済み品をそれぞれ renderUnchecked / renderChecked に渡す

・renderUnchecked(items: Item[]): void
  - checked=false のアイテムを createdAt 降順でリスト描画する
  - 各行に購入チェックボタン・項目名を表示する

・renderChecked(items: Item[]): void
  - checked=true のアイテムを checkedAt 昇順でリスト描画する
  - 先頭 INITIAL_CHECKED_DISPLAY_COUNT 件のみ表示する
  - 超過分がある場合は「・・・」ボタンを表示する
  - 各行にチェック解除ボタン・取り消し線付き項目名を表示する

・prependToUncheckedList(item: Item): void
  - 未購入品リストの先頭に item の行を挿入する

・moveToCheckedList(item: Item): void
  - 未購入品リストから item の行を削除する
  - 購入済み品リストの末尾に取り消し線付き行を追加する
  - 必要に応じて「・・・」ボタンの表示状態を更新する

・moveToUncheckedList(item: Item): void
  - 購入済み品リストから item の行を削除する
  - 未購入品リストの先頭に行を追加する
  - 必要に応じて「・・・」ボタンの表示状態を更新する

・renderAllCheckedItems(items: Item[]): void
  - checked=true のアイテムを全件表示する
  - 「・・・」ボタンを非表示にする

・showErrorMessage(message: string): void
  - エラーメッセージを画面に表示する（アプリは停止しない）

4. コンポーネント依存関係

UIRenderer ←── AppController ──→ StorageService
                    ↑
              (DOMContentLoaded で初期化)

5. バリデーション規約（AppController.addItem）

入力値 text に対して以下を順番に適用する。

1. text.trim() を実行する
2. trim 後の文字列が空文字の場合: 処理しない
3. trim 後の文字列が 100 文字を超える場合: 処理しない
4. 正常: trim 後の文字列を item.text として使用する
