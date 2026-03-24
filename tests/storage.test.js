// UT-10〜12: StorageService 単体テスト
import { describe, it, expect, beforeEach } from 'vitest';

// StorageService をインライン定義（モジュール分離がないため再定義）
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

describe('StorageService', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = new StorageService();
  });

  // UT-10
  it('load: localStorage が空なら空配列を返す', () => {
    expect(storage.load()).toEqual([]);
  });

  // UT-11
  it('save/load: 往復で同一データを返す', () => {
    const item = { id: '1', text: '牛乳', checked: false, createdAt: 1000, checkedAt: null };
    storage.save([item]);
    const loaded = storage.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(item);
  });

  // UT-12
  it('load: JSON パース失敗時は空配列を返す', () => {
    localStorage.setItem(StorageService.STORAGE_KEY, 'invalid json');
    expect(storage.load()).toEqual([]);
  });
});
