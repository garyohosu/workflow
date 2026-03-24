// ────────────────────────────────────────
// StorageService
// ────────────────────────────────────────
class StorageService {
  static STORAGE_KEY = 'shopping-memo-items';

  load() {
    try {
      const raw = localStorage.getItem(StorageService.STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  save(items) {
    try {
      localStorage.setItem(StorageService.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      document.dispatchEvent(new CustomEvent('storage-error', { detail: e.message }));
    }
  }
}

// ────────────────────────────────────────
// UIRenderer
// ────────────────────────────────────────
class UIRenderer {
  static INITIAL_CHECKED_DISPLAY_COUNT = 20;

  constructor() {
    this.uncheckedList = document.getElementById('unchecked-list');
    this.checkedList   = document.getElementById('checked-list');
    this.expandBtn     = document.getElementById('expand-btn');
    this.input         = document.getElementById('item-input');
    this.addBtn        = document.getElementById('add-btn');
    this.errorMsg      = document.getElementById('error-msg');
  }

  renderAll(items) {
    this._renderUnchecked(items);
    this._renderChecked(items);
  }

  // 未購入品を再描画（createdAt 降順）
  _renderUnchecked(items) {
    const list = items
      .filter(i => !i.checked)
      .sort((a, b) => b.createdAt - a.createdAt);
    this.uncheckedList.innerHTML = '';
    list.forEach(item => this.uncheckedList.appendChild(this._makeRow(item, false)));
  }

  // 購入済み品を再描画（checkedAt 昇順、初期 20 件）
  _renderChecked(items, showAll = false) {
    const list = items
      .filter(i => i.checked)
      .sort((a, b) => a.checkedAt - b.checkedAt);
    this.checkedList.innerHTML = '';
    const limit = showAll ? list.length : UIRenderer.INITIAL_CHECKED_DISPLAY_COUNT;
    list.slice(0, limit).forEach(item => this.checkedList.appendChild(this._makeRow(item, true)));
    this.expandBtn.hidden = list.length <= UIRenderer.INITIAL_CHECKED_DISPLAY_COUNT || showAll;
  }

  // 未購入品リストの先頭に1件追加
  prependToUncheckedList(item) {
    this.uncheckedList.insertBefore(this._makeRow(item, false), this.uncheckedList.firstChild);
  }

  // 未購入 → 購入済みへ移動（DOM 更新 + expand ボタン再評価）
  moveToCheckedList(item, allItems) {
    const el = this.uncheckedList.querySelector(`[data-id="${item.id}"]`);
    if (el) el.remove();
    this.checkedList.appendChild(this._makeRow(item, true));
    // 21 件目以降が生じたらボタンを表示
    const checkedCount = allItems.filter(i => i.checked).length;
    if (checkedCount > UIRenderer.INITIAL_CHECKED_DISPLAY_COUNT && this.expandBtn.hidden) {
      // 現在展開済み（expandBtn が hidden=true）なら何もしない
      // 未展開かどうかは expandBtn の hidden でなく、表示件数で判定する
    }
    // シンプル化: checked リスト全体を再描画
    this._renderChecked(allItems, this._isExpanded());
  }

  // 購入済み → 未購入へ移動
  moveToUncheckedList(item, allItems) {
    const el = this.checkedList.querySelector(`[data-id="${item.id}"]`);
    if (el) el.remove();
    this.uncheckedList.insertBefore(this._makeRow(item, false), this.uncheckedList.firstChild);
    this._renderChecked(allItems, this._isExpanded());
  }

  // 購入済み品を全件表示
  renderAllCheckedItems(allItems) {
    this._renderChecked(allItems, true);
  }

  showErrorMessage(message) {
    this.errorMsg.textContent = message;
    this.errorMsg.hidden = false;
    setTimeout(() => { this.errorMsg.hidden = true; }, 3000);
  }

  clearInput() {
    this.input.value = '';
  }

  // 現在「全件展開済み」かどうかを判定（expandBtn が hidden かつ 購入済みが 1 件以上あれば展開済み）
  _isExpanded() {
    return this.expandBtn.hidden && this.checkedList.querySelectorAll('li').length > 0;
  }

  _makeRow(item, isChecked) {
    const li = document.createElement('li');
    li.dataset.id = item.id;
    li.className = isChecked ? 'item-row checked' : 'item-row';

    const btn = document.createElement('button');
    btn.className = 'check-btn';
    btn.textContent = isChecked ? '✓' : '○';
    btn.setAttribute('aria-label', isChecked ? '未購入に戻す' : '購入済みにする');
    btn.dataset.action = isChecked ? 'uncheck' : 'check';

    const span = document.createElement('span');
    span.className = 'item-text';
    span.textContent = item.text;

    li.appendChild(btn);
    li.appendChild(span);
    return li;
  }
}

// ────────────────────────────────────────
// AppController
// ────────────────────────────────────────
class AppController {
  constructor(storage, ui) {
    this.items   = [];
    this.storage = storage;
    this.ui      = ui;
  }

  init() {
    this.items = this.storage.load();
    this.ui.renderAll(this.items);
    this._bindEvents();
  }

  addItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 100) {
      this.ui.showErrorMessage('100文字以内で入力してください');
      return;
    }
    const item = {
      id: Date.now().toString(),
      text: trimmed,
      checked: false,
      createdAt: Date.now(),
      checkedAt: null,
    };
    this.items.unshift(item);
    this.storage.save(this.items);
    this.ui.prependToUncheckedList(item);
    this.ui.clearInput();
  }

  checkItem(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.checked = true;
    item.checkedAt = Date.now();
    this.storage.save(this.items);
    this.ui.moveToCheckedList(item, this.items);
  }

  uncheckItem(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.checked = false;
    item.checkedAt = null;
    this.storage.save(this.items);
    this.ui.moveToUncheckedList(item, this.items);
  }

  expandCheckedList() {
    this.ui.renderAllCheckedItems(this.items);
  }

  _bindEvents() {
    // 登録ボタン
    this.ui.addBtn.addEventListener('click', () => {
      this.addItem(this.ui.input.value);
    });

    // Enter キー
    this.ui.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addItem(this.ui.input.value);
    });

    // チェック操作（イベント委譲）
    this.ui.uncheckedList.addEventListener('click', (e) => {
      const btn = e.target.closest('.check-btn');
      if (!btn) return;
      const id = btn.closest('[data-id]')?.dataset.id;
      if (id) this.checkItem(id);
    });

    this.ui.checkedList.addEventListener('click', (e) => {
      const btn = e.target.closest('.check-btn');
      if (!btn) return;
      const id = btn.closest('[data-id]')?.dataset.id;
      if (id) this.uncheckItem(id);
    });

    // 追加表示ボタン
    this.ui.expandBtn.addEventListener('click', () => {
      this.expandCheckedList();
    });

    // ストレージエラー
    document.addEventListener('storage-error', (e) => {
      this.ui.showErrorMessage('保存に失敗しました');
    });
  }
}

// ────────────────────────────────────────
// 起動
// ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const storage = new StorageService();
  const ui      = new UIRenderer();
  const app     = new AppController(storage, ui);
  app.init();
});

// Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
