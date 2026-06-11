/* ========== 墨笔 · 时间线模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Timeline = class Timeline {
  constructor(app) { this.app = app; }

  init() {
    this.container = document.getElementById('timelineContainer');
    document.getElementById('addEventBtn').addEventListener('click', () => this.showForm());
    this.load();
  }

  load() {
    const events = NovelWriter.Store.get('timeline');
    if (events.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p>记录故事中的重要时刻</p>
        </div>`;
      return;
    }

    const sorted = [...events].sort((a, b) => a.order - b.order);
    this.container.innerHTML = `
      <div class="timeline-line"></div>
      ${sorted.map(ev => `
        <div class="timeline-event">
          <div class="timeline-event-content" data-id="${ev.id}">
            <div class="timeline-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
              ${NovelWriter.Utils.esc(ev.date || '未设定')}
            </div>
            <div class="timeline-title">${NovelWriter.Utils.esc(ev.title)}</div>
            ${ev.description ? `<div class="timeline-desc">${NovelWriter.Utils.esc(ev.description)}</div>` : ''}
            <div class="timeline-event-actions">
              <button class="t-edit" title="编辑">编辑</button>
              <button class="t-del" title="删除">删除</button>
            </div>
          </div>
          <div class="timeline-dot"></div>
        </div>
      `).join('')}`;

    this.container.querySelectorAll('.t-edit').forEach(btn => {
      btn.addEventListener('click', () => this.showForm(btn.closest('[data-id]').dataset.id));
    });
    this.container.querySelectorAll('.t-del').forEach(btn => {
      btn.addEventListener('click', () => this.deleteEvent(btn.closest('[data-id]').dataset.id));
    });
  }

  showForm(id) {
    const events = NovelWriter.Store.get('timeline');
    const ev = id ? events.find(e => e.id === id) : null;
    const body = `
      <div class="form-group">
        <label>时间标记</label>
        <input class="form-input" id="eventDate" value="${NovelWriter.Utils.esc(ev?.date || '')}" placeholder="第一年春天 / 第3章末">
      </div>
      <div class="form-group">
        <label>事件标题</label>
        <input class="form-input" id="eventTitle" value="${NovelWriter.Utils.esc(ev?.title || '')}" placeholder="关键事件">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea class="form-input" id="eventDesc" rows="3">${NovelWriter.Utils.esc(ev?.description || '')}</textarea>
      </div>`;
    const footer = `
      <button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">取消</button>
      <button class="btn-confirm" onclick="NovelWriter.Timeline._save('${ev?.id || ''}')">${ev ? '更新' : '添加'}</button>`;
    this.app.openDialog(ev ? '编辑事件' : '添加事件', body, footer);
  }

  static _save(id) {
    const title = document.getElementById('eventTitle').value.trim();
    if (!title) return;
    const events = NovelWriter.Store.get('timeline');
    const data = {
      date: document.getElementById('eventDate').value.trim(),
      title,
      description: document.getElementById('eventDesc').value.trim(),
    };
    if (id) {
      const ev = events.find(e => e.id === id);
      if (ev) Object.assign(ev, data);
    } else {
      events.push({ id: NovelWriter.Store.uid(), order: events.length, ...data });
    }
    NovelWriter.Store.set('timeline', events);
    NovelWriter.App.timeline.load();
    NovelWriter.App.closeDialog();
  }

  deleteEvent(id) {
    if (!confirm('确定删除此事件？')) return;
    const events = NovelWriter.Store.get('timeline').filter(e => e.id !== id);
    NovelWriter.Store.set('timeline', events);
    this.load();
  }
};
