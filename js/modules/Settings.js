/* ========== 墨笔 · 世界观设定模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Settings = class Settings {
  constructor(app) { this.app = app; }

  init() {
    this.grid = document.getElementById('settingsGrid');
    document.getElementById('addSettingBtn').addEventListener('click', () => this.showForm());
    this.load();
  }

  load() {
    const settings = NovelWriter.Store.get('settings');
    if (settings.length === 0) {
      this.grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
          <p>构建你的世界观——地理、历史、规则</p>
        </div>`;
      return;
    }

    this.grid.innerHTML = settings.map(s => `
      <div class="setting-card" data-id="${s.id}">
        <button class="setting-delete" title="删除" data-id="${s.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div class="setting-category">
          <span class="cat-dot" style="background:${this.catColor(s.category)}"></span>
          ${NovelWriter.Utils.esc(s.category || '未分类')}
        </div>
        <div class="setting-title">${NovelWriter.Utils.esc(s.title)}</div>
        <div class="setting-content">${NovelWriter.Utils.esc(s.content)}</div>
      </div>
    `).join('');

    this.grid.querySelectorAll('.setting-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.setting-delete')) return;
        this.showForm(card.dataset.id);
      });
    });
    this.grid.querySelectorAll('.setting-delete').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteSetting(btn.dataset.id); });
    });
  }

  catColor(cat) {
    const map = { '地理': '#4ade80', '历史': '#d4a047', '种族': '#a855f7', '魔法/能力': '#4a8fe0', '政治/势力': '#e04a7a', '文化/习俗': '#f59e0b', '科技': '#06b6d4' };
    return map[cat] || '#6b7280';
  }

  showForm(id) {
    const settings = NovelWriter.Store.get('settings');
    const s = id ? settings.find(x => x.id === id) : null;
    const cats = ['地理', '历史', '种族', '魔法/能力', '政治/势力', '文化/习俗', '科技', '其他'];
    const body = `
      <div class="form-group">
        <label>分类</label>
        <select class="form-input" id="settingCategory">
          ${cats.map(c => `<option value="${c}" ${s?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>标题</label>
        <input class="form-input" id="settingTitle" value="${NovelWriter.Utils.esc(s?.title || '')}" placeholder="设定名称">
      </div>
      <div class="form-group">
        <label>内容</label>
        <textarea class="form-input" id="settingContent" rows="6" placeholder="详细描述…">${NovelWriter.Utils.esc(s?.content || '')}</textarea>
      </div>`;
    const footer = `
      <button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">取消</button>
      <button class="btn-confirm" onclick="NovelWriter.Settings._save('${s?.id || ''}')">${s ? '更新' : '添加'}</button>`;
    this.app.openDialog(s ? '编辑设定' : '添加设定', body, footer);
  }

  static _save(id) {
    const title = document.getElementById('settingTitle').value.trim();
    if (!title) return;
    const settings = NovelWriter.Store.get('settings');
    const data = {
      category: document.getElementById('settingCategory').value,
      title,
      content: document.getElementById('settingContent').value.trim(),
    };
    if (id) {
      const s = settings.find(x => x.id === id);
      if (s) Object.assign(s, data);
    } else {
      settings.push({ id: NovelWriter.Store.uid(), ...data });
    }
    NovelWriter.Store.set('settings', settings);
    NovelWriter.App.settings.load();
    NovelWriter.App.closeDialog();
  }

  deleteSetting(id) {
    if (!confirm('确定删除此设定？')) return;
    const settings = NovelWriter.Store.get('settings').filter(s => s.id !== id);
    NovelWriter.Store.set('settings', settings);
    this.load();
  }
};
