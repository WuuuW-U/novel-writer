/* ========== 墨笔 · 大纲模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Outline = class Outline {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.container = document.getElementById('outlineTree');
    document.getElementById('addOutlineBtn').addEventListener('click', () => this.addNode(null));
    this.load();
  }

  load() {
    const outline = NovelWriter.Store.get('outline');
    if (outline.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/></svg>
          <p>从"添加节点"开始搭建你的故事骨架</p>
        </div>`;
      return;
    }
    this.container.innerHTML = this.renderNodes(outline);
    this.bindEvents();
  }

  renderNodes(nodes, depth = 0) {
    return nodes.map(node => {
      const typeLabel = { act: '卷', chapter: '章', scene: '景' }[node.type] || '卷';
      const hasChildren = node.children && node.children.length > 0;
      return `
        <div class="outline-node" data-id="${node.id}" style="--depth:${depth}">
          <div class="outline-node-header">
            ${hasChildren ? `
              <span class="outline-toggle ${node.expanded ? 'expanded' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M9 5l7 7-7 7"/></svg>
              </span>
            ` : '<span class="outline-toggle-spacer"></span>'}
            <span class="outline-node-title">${NovelWriter.Utils.esc(node.title)}</span>
            <span class="outline-node-type type-${node.type || 'act'}">${typeLabel}</span>
            ${node.summary ? `<span class="outline-node-summary">${NovelWriter.Utils.esc(node.summary)}</span>` : ''}
            <div class="outline-node-actions">
              <button class="o-add" title="添加子节点">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
              </button>
              <button class="o-edit" title="编辑">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6 18l-2.625.75L4.25 16.1l8.932-8.931z"/></svg>
              </button>
              <button class="o-del" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          ${hasChildren ? `
            <div class="outline-children" style="display:${node.expanded ? 'block' : 'none'}">
              ${this.renderNodes(node.children, depth + 1)}
            </div>` : ''}
        </div>`;
    }).join('');
  }

  bindEvents() {
    this.container.querySelectorAll('.outline-node-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.outline-node-actions')) return;
        const toggle = header.querySelector('.outline-toggle');
        if (toggle) toggle.click();
      });
    });

    this.container.querySelectorAll('.outline-toggle').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        el.classList.toggle('expanded');
        const node = el.closest('.outline-node');
        const children = node.querySelector('.outline-children');
        if (children) children.style.display = el.classList.contains('expanded') ? 'block' : 'none';

        const n = this.findNode(NovelWriter.Store.get('outline'), node.dataset.id);
        if (n) { n.expanded = el.classList.contains('expanded'); NovelWriter.Store.save(); }
      });
    });

    this.container.querySelectorAll('.o-add').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.addNode(btn.closest('.outline-node').dataset.id); });
    });
    this.container.querySelectorAll('.o-edit').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.editNode(btn.closest('.outline-node').dataset.id); });
    });
    this.container.querySelectorAll('.o-del').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteNode(btn.closest('.outline-node').dataset.id); });
    });
  }

  /* ---------- 节点查找 ---------- */
  findNode(nodes, id) {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = this.findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  removeNode(nodes, id) {
    const idx = nodes.findIndex(n => n.id === id);
    if (idx >= 0) { nodes.splice(idx, 1); return true; }
    for (const n of nodes) {
      if (n.children && this.removeNode(n.children, id)) return true;
    }
    return false;
  }

  /* ---------- CRUD ---------- */
  addNode(parentId) {
    const body = `
      <div class="form-group">
        <label>类型</label>
        <select class="form-input" id="outlineType">
          <option value="act">卷</option>
          <option value="chapter" selected>章</option>
          <option value="scene">景</option>
        </select>
      </div>
      <div class="form-group">
        <label>标题</label>
        <input class="form-input" id="outlineTitle" placeholder="节点标题">
      </div>
      <div class="form-group">
        <label>摘要</label>
        <textarea class="form-input" id="outlineSummary" placeholder="简要说明" rows="3"></textarea>
      </div>`;
    const footer = `
      <button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">取消</button>
      <button class="btn-confirm" onclick="NovelWriter.Outline._saveNode('${parentId || ''}')">保存</button>`;
    this.app.openDialog('添加大纲节点', body, footer);
  }

  static _saveNode(parentId) {
    const outline = NovelWriter.Store.get('outline');
    const type = document.getElementById('outlineType').value;
    const title = document.getElementById('outlineTitle').value.trim();
    if (!title) return;
    const summary = document.getElementById('outlineSummary').value.trim();
    const node = { id: NovelWriter.Store.uid(), type, title, summary, children: [], expanded: true };

    if (!parentId) {
      outline.push(node);
    } else {
      const parent = NovelWriter.App.outline.findNode(outline, parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
        parent.expanded = true;
      }
    }
    NovelWriter.Store.set('outline', outline);
    NovelWriter.App.outline.load();
    NovelWriter.App.closeDialog();
  }

  editNode(id) {
    const outline = NovelWriter.Store.get('outline');
    const node = this.findNode(outline, id);
    if (!node) return;
    const body = `
      <div class="form-group">
        <label>类型</label>
        <select class="form-input" id="outlineType">
          <option value="act" ${node.type === 'act' ? 'selected' : ''}>卷</option>
          <option value="chapter" ${node.type === 'chapter' ? 'selected' : ''}>章</option>
          <option value="scene" ${node.type === 'scene' ? 'selected' : ''}>景</option>
        </select>
      </div>
      <div class="form-group">
        <label>标题</label>
        <input class="form-input" id="outlineTitle" value="${NovelWriter.Utils.esc(node.title)}">
      </div>
      <div class="form-group">
        <label>摘要</label>
        <textarea class="form-input" id="outlineSummary" rows="3">${NovelWriter.Utils.esc(node.summary || '')}</textarea>
      </div>`;
    const footer = `
      <button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">取消</button>
      <button class="btn-confirm" onclick="NovelWriter.Outline._updateNode('${id}')">更新</button>`;
    this.app.openDialog('编辑大纲节点', body, footer);
  }

  static _updateNode(id) {
    const outline = NovelWriter.Store.get('outline');
    const node = NovelWriter.App.outline.findNode(outline, id);
    if (!node) return;
    node.type = document.getElementById('outlineType').value;
    node.title = document.getElementById('outlineTitle').value.trim();
    node.summary = document.getElementById('outlineSummary').value.trim();
    NovelWriter.Store.set('outline', outline);
    NovelWriter.App.outline.load();
    NovelWriter.App.closeDialog();
  }

  deleteNode(id) {
    if (!confirm('确定删除此节点及其所有子节点？')) return;
    const outline = NovelWriter.Store.get('outline');
    this.removeNode(outline, id);
    NovelWriter.Store.set('outline', outline);
    this.load();
  }
};
