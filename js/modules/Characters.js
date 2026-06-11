/* ========== 墨笔 · 角色模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Characters = class Characters {
  constructor(app) {
    this.app = app;
    this.colors = ['#d4a047', '#4ade80', '#4a8fe0', '#a855f7', '#e04a7a', '#e8e85c'];
  }

  init() {
    this.grid = document.getElementById('charactersGrid');
    document.getElementById('addCharBtn').addEventListener('click', () => this.showForm());
    this.load();
  }

  load() {
    const chars = NovelWriter.Store.get('characters');
    if (chars.length === 0) {
      this.grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/></svg>
          <p>点击"新建角色"为故事注入生命</p>
        </div>`;
      return;
    }

    this.grid.innerHTML = chars.map((ch, i) => {
      const rels = (ch.relations || []).map(rid => {
        const rel = chars.find(r => r.id === rid);
        return rel ? rel.name : null;
      }).filter(Boolean);

      return `
        <div class="char-card" data-id="${ch.id}">
          <button class="char-delete" title="删除" data-id="${ch.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div class="char-card-header">
            <div class="char-avatar" style="background:${this.colors[i % this.colors.length]}22;color:${this.colors[i % this.colors.length]}">
              ${ch.name.charAt(0)}
            </div>
            <div>
              <div class="char-name">${NovelWriter.Utils.esc(ch.name)}</div>
              <div class="char-role">${NovelWriter.Utils.esc(ch.role || '未设定')}</div>
            </div>
          </div>
          <div class="char-desc">${NovelWriter.Utils.esc(ch.description || '暂无描述')}</div>
          ${ch.tags && ch.tags.length ? `
            <div class="char-tags">
              ${ch.tags.map(t => `<span class="char-tag">${NovelWriter.Utils.esc(t)}</span>`).join('')}
            </div>` : ''}
          ${rels.length ? `
            <div class="char-relations">
              <span class="relation-label">关系</span>
              ${rels.map(r => `<span class="relation-tag">${NovelWriter.Utils.esc(r)}</span>`).join('')}
            </div>` : ''}
        </div>`;
    }).join('');

    this.grid.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.char-delete')) return;
        this.showForm(card.dataset.id);
      });
    });
    this.grid.querySelectorAll('.char-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteChar(btn.dataset.id);
      });
    });
  }

  showForm(id) {
    const chars = NovelWriter.Store.get('characters');
    const ch = id ? chars.find(c => c.id === id) : null;
    const isEdit = !!ch;

    // 关系选择列表
    const relOptions = chars.filter(c => c.id !== id).map(c => `
      <label class="rel-checkbox">
        <input type="checkbox" value="${c.id}" ${(ch?.relations || []).includes(c.id) ? 'checked' : ''}>
        ${NovelWriter.Utils.esc(c.name)}
      </label>
    `).join('');

    const body = `
      <div class="form-group">
        <label>姓名</label>
        <input class="form-input" id="charName" value="${NovelWriter.Utils.esc(ch?.name || '')}" placeholder="角色姓名">
      </div>
      <div class="form-group">
        <label>身份/定位</label>
        <input class="form-input" id="charRole" value="${NovelWriter.Utils.esc(ch?.role || '')}" placeholder="主角 / 反派 / 配角">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea class="form-input" id="charDesc" placeholder="外貌特征 · 性格 · 背景故事" rows="4">${NovelWriter.Utils.esc(ch?.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>标签（逗号分隔）</label>
        <input class="form-input" id="charTags" value="${NovelWriter.Utils.esc((ch?.tags || []).join('，'))}" placeholder="勇敢，内敛，剑客">
      </div>
      ${relOptions ? `
        <div class="form-group">
          <label>角色关系</label>
          <div class="rel-checkbox-group">${relOptions}</div>
        </div>` : ''}`;

    const footer = `
      <button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">取消</button>
      <button class="btn-confirm" onclick="NovelWriter.Characters._save('${ch?.id || ''}')">${isEdit ? '更新' : '创建'}</button>`;
    this.app.openDialog(isEdit ? '编辑角色' : '新建角色', body, footer);
  }

  static _save(id) {
    const name = document.getElementById('charName').value.trim();
    if (!name) return;
    const chars = NovelWriter.Store.get('characters');
    const relCheckboxes = document.querySelectorAll('.rel-checkbox input:checked');
    const relations = [...relCheckboxes].map(cb => cb.value);

    const data = {
      name,
      role: document.getElementById('charRole').value.trim(),
      description: document.getElementById('charDesc').value.trim(),
      tags: document.getElementById('charTags').value.split(/[,，、]/).map(t => t.trim()).filter(Boolean),
      relations,
    };

    if (id) {
      const ch = chars.find(c => c.id === id);
      if (ch) Object.assign(ch, data);
    } else {
      chars.push({ id: NovelWriter.Store.uid(), ...data });
    }
    NovelWriter.Store.set('characters', chars);
    NovelWriter.App.characters.load();
    NovelWriter.App.closeDialog();
  }

  deleteChar(id) {
    if (!confirm('确定删除此角色？')) return;
    let chars = NovelWriter.Store.get('characters');
    chars = chars.filter(c => c.id !== id);
    // 清除其他角色中的关联
    chars.forEach(c => { if (c.relations) c.relations = c.relations.filter(r => r !== id); });
    NovelWriter.Store.set('characters', chars);
    this.load();
  }
};
