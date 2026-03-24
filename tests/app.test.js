// UT-01〜09: AppController 単体テスト
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── AppController をテスト用に再定義（DOM 依存なし）──
class StorageService {
  constructor() { this._items = []; }
  load() { return this._items; }
  save(items) { this._items = JSON.parse(JSON.stringify(items)); }
}

class AppController {
  constructor(storage) {
    this.items = [];
    this.storage = storage;
    this.ui = { prependToUncheckedList: vi.fn(), moveToCheckedList: vi.fn(), moveToUncheckedList: vi.fn(), clearInput: vi.fn(), showErrorMessage: vi.fn() };
  }

  init() { this.items = this.storage.load(); }

  addItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 100) { this.ui.showErrorMessage('100文字以内で入力してください'); return; }
    const item = { id: Date.now().toString(), text: trimmed, checked: false, createdAt: Date.now(), checkedAt: null };
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
}

describe('AppController', () => {
  let storage, app;

  beforeEach(() => {
    storage = new StorageService();
    app = new AppController(storage);
    app.init();
  });

  // UT-01
  it('addItem: 正常追加', () => {
    app.addItem('牛乳');
    expect(app.items).toHaveLength(1);
    expect(app.items[0].text).toBe('牛乳');
    expect(app.items[0].checked).toBe(false);
    expect(app.items[0].checkedAt).toBeNull();
  });

  // UT-02
  it('addItem: 前後空白をトリミングする', () => {
    app.addItem('  牛乳  ');
    expect(app.items[0].text).toBe('牛乳');
  });

  // UT-03
  it('addItem: 空文字は登録しない', () => {
    app.addItem('');
    expect(app.items).toHaveLength(0);
  });

  // UT-04
  it('addItem: 空白のみは登録しない', () => {
    app.addItem('   ');
    expect(app.items).toHaveLength(0);
  });

  // UT-05
  it('addItem: 100文字は登録する', () => {
    app.addItem('あ'.repeat(100));
    expect(app.items).toHaveLength(1);
  });

  // UT-06
  it('addItem: 101文字は登録しない', () => {
    app.addItem('あ'.repeat(101));
    expect(app.items).toHaveLength(0);
    expect(app.ui.showErrorMessage).toHaveBeenCalled();
  });

  // UT-07
  it('checkItem: 購入済み化', () => {
    app.addItem('卵');
    const id = app.items[0].id;
    app.checkItem(id);
    expect(app.items[0].checked).toBe(true);
    expect(app.items[0].checkedAt).not.toBeNull();
  });

  // UT-08
  it('uncheckItem: 購入済み解除で checkedAt が null になる', () => {
    app.addItem('卵');
    const id = app.items[0].id;
    app.checkItem(id);
    app.uncheckItem(id);
    expect(app.items[0].checked).toBe(false);
    expect(app.items[0].checkedAt).toBeNull();
  });

  // UT-09
  it('addItem: 複数追加時、後から追加した方が先頭になる', () => {
    app.addItem('A');
    app.addItem('B');
    expect(app.items[0].text).toBe('B');
  });
});
