/* ========== 墨笔 · 数据持久层 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Store = class Store {
  static KEY = 'novel_writer_data';

  static defaults = {
    chapters: [],
    outline: [],
    characters: [],
    timeline: [],
    settings: [],
    progress: { dailyGoal: 2000, history: {}, _lastTotal: 0 },
    activeChapter: null,
    accentTheme: 'amber',
    focusMode: false,
  };

  static _cache = null;

  static load() {
    if (Store._cache) return Store._cache;
    try {
      const raw = localStorage.getItem(Store.KEY);
      Store._cache = raw
        ? { ...Store.defaults, ...JSON.parse(raw) }
        : { ...Store.defaults };
    } catch {
      Store._cache = { ...Store.defaults };
    }
    return Store._cache;
  }

  static save() {
    try {
      localStorage.setItem(Store.KEY, JSON.stringify(Store._cache));
    } catch (e) {
      console.warn('存储失败:', e);
    }
  }

  static get(key) {
    return Store.load()[key];
  }

  static set(key, value) {
    Store.load()[key] = value;
    Store.save();
  }

  static uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* 数据完整性校验与迁移 */
  static migrate() {
    const data = Store.load();
    let changed = false;
    for (const [key, val] of Object.entries(Store.defaults)) {
      if (!(key in data)) {
        data[key] = val;
        changed = true;
      }
    }
    if (changed) Store.save();
  }
};
