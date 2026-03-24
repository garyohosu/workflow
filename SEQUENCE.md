SEQUENCE.md

買い物思い出しメモ PWA — シーケンス定義

1. 概要

本ドキュメントは、主要ユースケースの処理シーケンスを定義する。
実装言語: クライアントサイド JavaScript（静的サイト）
データ保存: localStorage

登場コンポーネント:
・UI: 画面（HTML/CSS/JS）
・AppController: アプリ制御ロジック（JS）
・StorageService: localStorage 読み書き担当

────────────────────────────────────────
SEQ-01 アプリ起動・データ復元
────────────────────────────────────────

UI → AppController: DOMContentLoaded イベント
AppController → StorageService: load()
StorageService → AppController: items[]（または空配列）
AppController → UI: renderAll(items)
UI: 未購入品リスト・購入済み品リストを描画

────────────────────────────────────────
SEQ-02 項目追加
────────────────────────────────────────

ユーザー → UI: 入力欄にテキストを入力し、登録ボタンを押す
UI → AppController: addItem(text)
AppController: バリデーション実行
  [空文字・空白のみ・100文字超] → AppController → UI: エラー表示、処理終了
  [正常] →
    AppController: 新しい Item オブジェクト生成（id, text, checked=false, createdAt=now, checkedAt=null）
    AppController → StorageService: save(items)
    AppController → UI: prependToUncheckedList(item)
    UI → ユーザー: 未購入品リスト先頭に追加表示
    UI: 入力欄をクリア

────────────────────────────────────────
SEQ-03 項目を購入済みにする
────────────────────────────────────────

ユーザー → UI: 未購入品の購入チェックボタンを押す
UI → AppController: checkItem(id)
AppController: 対象アイテムの checked=true, checkedAt=now に更新
AppController → StorageService: save(items)
AppController → UI: removeFromUncheckedList(id)
AppController → UI: appendToCheckedList(item)
UI → ユーザー: 取り消し線付きで購入済み品リスト末尾に表示

────────────────────────────────────────
SEQ-04 購入済みを解除する
────────────────────────────────────────

ユーザー → UI: 購入済み品のチェックを外す
UI → AppController: uncheckItem(id)
AppController: 対象アイテムの checked=false, checkedAt=null に更新
AppController → StorageService: save(items)
AppController → UI: removeFromCheckedList(id)
AppController → UI: prependToUncheckedList(item)
UI → ユーザー: 未購入品リスト先頭に表示（取り消し線なし）

────────────────────────────────────────
SEQ-05 購入済み品の追加表示
────────────────────────────────────────

[前提: 購入済み品が 21 件以上存在し、「・・・」ボタンが表示されている]
ユーザー → UI: 「・・・」ボタンを押す
UI → AppController: expandCheckedList()
AppController → UI: renderRemainingCheckedItems(items)
UI: 非表示だった購入済み品を全件表示
UI: 「・・・」ボタンを非表示にする

────────────────────────────────────────
SEQ-06 localStorage 保存失敗時のフォールバック
────────────────────────────────────────

AppController → StorageService: save(items)
StorageService: localStorage.setItem() が例外をスロー
StorageService → AppController: エラー通知
AppController → UI: showErrorMessage("保存に失敗しました")
AppController: 画面描画は継続（アプリは停止しない）

────────────────────────────────────────
SEQ-07 保存データ破損時の初期化
────────────────────────────────────────

AppController → StorageService: load()
StorageService: localStorage.getItem() の値が JSON パース失敗
StorageService → AppController: 空配列を返す（パース失敗時のフォールバック）
AppController → UI: renderAll([])（空リストで初期表示）

2. 描画ルール補足

未購入品リストの描画:
・createdAt 降順（新しい順）で並べる
・checkedAt が null のアイテムのみ対象

購入済み品リストの描画:
・checkedAt 昇順（購入順）で並べる
・初期描画は先頭 20 件のみ
・21 件以上の場合は「・・・」ボタンを表示する
