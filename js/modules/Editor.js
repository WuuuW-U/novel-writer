/* ========== 墨笔 · 编辑器模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Editor = class Editor {
  constructor(app) {
    this.app = app;
    this.saveTimer = null;
    this.previewMode = false;
  }

  /* ---------- 初始化 ---------- */
  init() {
    this.editor = document.getElementById('editor');
    this.titleInput = document.getElementById('chapterTitle');
    this.wordCountEl = document.getElementById('wordCount');
    this.saveStatus = document.getElementById('autoSaveStatus');
    this.chapterList = document.getElementById('chapterList');
    this.targetEl = document.getElementById('chapterTarget');

    this.bindToolbar();
    this.bindEditorEvents();
    this.bindFocusMode();
    this.bindReadingMode();
    this.bindPreviewToggle();

    window.addEventListener('beforeunload', () => this.saveCurrent());

    // 恢复上次打开的章节
    const lastId = NovelWriter.Store.get('activeChapter');
    if (lastId) {
      const chapters = NovelWriter.Store.get('chapters');
      if (chapters.some(c => c.id === lastId)) this.selectChapter(lastId);
    }
  }

  /* ---------- 加载章节列表 ---------- */
  loadChapterList() {
    const chapters = NovelWriter.Store.get('chapters');
    const activeId = NovelWriter.Store.get('activeChapter');

    if (chapters.length === 0) {
      this.chapterList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          <p>空荡荡的，新建一章吧</p>
        </div>`;
      return;
    }

    this.chapterList.innerHTML = chapters.map(ch => {
      const active = ch.id === activeId;
      const target = ch.wordTarget || 0;
      const pct = target > 0 ? Math.min(100, ((ch.wordCount || 0) / target) * 100) : 0;
      return `
        <div class="chapter-item ${active ? 'active' : ''}"
             draggable="true" data-id="${ch.id}">
          <div class="chapter-drag-handle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
          </div>
          <div class="chapter-item-body">
            <span class="chapter-name">${NovelWriter.Utils.esc(ch.title)}</span>
            <div class="chapter-meta">
              <span class="chapter-words">${ch.wordCount || 0}字</span>
              ${target ? `<span class="chapter-target ${pct >= 100 ? 'done' : ''}">${Math.round(pct)}%</span>` : ''}
            </div>
          </div>
          <button class="chapter-delete-btn" data-id="${ch.id}" title="删除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>`;
    }).join('');

    // 绑定事件
    this.chapterList.querySelectorAll('.chapter-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.chapter-delete-btn')) return;
        this.selectChapter(el.dataset.id);
      });
    });

    this.chapterList.querySelectorAll('.chapter-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteChapter(btn.dataset.id);
      });
    });

    // 拖拽排序
    const cleanup = NovelWriter.Utils.enableDragSort(
      this.chapterList,
      (orderedIds) => {
        const chapters = NovelWriter.Store.get('chapters');
        const map = {};
        chapters.forEach(c => map[c.id] = c);
        const reordered = orderedIds.map(id => map[id]).filter(Boolean);
        NovelWriter.Store.set('chapters', reordered);
      }
    );
  }

  /* ---------- 选择章节 ---------- */
  selectChapter(id) {
    this.saveCurrent();
    NovelWriter.Store.set('activeChapter', id);
    const chapters = NovelWriter.Store.get('chapters');
    const ch = chapters.find(c => c.id === id);
    if (!ch) return;

    this.editor.innerHTML = ch.content || '';
    this.titleInput.value = ch.title || '';
    this.updateWordCount(ch.wordCount || 0);
    this.updateTarget(ch);

    this.loadChapterList();
  }

  /* ---------- 新增章节 ---------- */
  addChapter(title) {
    const chapters = NovelWriter.Store.get('chapters');
    const ch = {
      id: NovelWriter.Store.uid(),
      title: title || `第${chapters.length + 1}章`,
      content: '',
      wordCount: 0,
      wordTarget: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      snapshot: [],
    };
    chapters.push(ch);
    NovelWriter.Store.set('chapters', chapters);
    this.loadChapterList();
    this.selectChapter(ch.id);
  }

  /* ---------- 删除章节 ---------- */
  deleteChapter(id) {
    if (!confirm('确定删除此章节？此操作不可撤销。')) return;
    let chapters = NovelWriter.Store.get('chapters');
    chapters = chapters.filter(c => c.id !== id);
    NovelWriter.Store.set('chapters', chapters);

    if (NovelWriter.Store.get('activeChapter') === id) {
      NovelWriter.Store.set('activeChapter', chapters.length > 0 ? chapters[0].id : null);
      if (chapters.length > 0) this.selectChapter(chapters[0].id);
      else {
        this.editor.innerHTML = '';
        this.titleInput.value = '';
        this.updateWordCount(0);
      }
    }
    this.loadChapterList();
  }

  /* ---------- 保存当前章节 ---------- */
  saveCurrent() {
    const activeId = NovelWriter.Store.get('activeChapter');
    if (!activeId) return;
    const chapters = NovelWriter.Store.get('chapters');
    const ch = chapters.find(c => c.id === activeId);
    if (!ch) return;

    const content = this.editor.innerHTML;
    const title = this.titleInput.value;
    const wc = NovelWriter.Utils.countWords(this.editor.innerText);

    ch.content = content;
    ch.title = title;
    ch.wordCount = wc;
    ch.updatedAt = Date.now();

    NovelWriter.Store.set('chapters', chapters);
    this.updateWordCount(wc);
    this.updateTarget(ch);
    this.app.recordProgress();
  }

  /* ---------- 编辑器事件绑定 ---------- */
  bindEditorEvents() {
    const autoSave = NovelWriter.Utils.debounce(() => {
      this.saveStatus.textContent = '保存中…';
      this.saveStatus.classList.add('visible');
      this.saveCurrent();
      this.saveStatus.textContent = '已保存';
      setTimeout(() => this.saveStatus.classList.remove('visible'), 1200);
    }, 600);

    this.editor.addEventListener('input', () => {
      autoSave();
      // 实时更新列表中的字数
      const wc = NovelWriter.Utils.countWords(this.editor.innerText);
      this.updateWordCount(wc);
    });
    this.titleInput.addEventListener('input', autoSave);

    // 键盘快捷键
    this.editor.addEventListener('keydown', (e) => {
      // Tab 缩进
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '    ');
      }
      // Ctrl+S 手动保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveCurrent();
        this.saveStatus.textContent = '已保存 ✓';
        this.saveStatus.classList.add('visible');
        setTimeout(() => this.saveStatus.classList.remove('visible'), 1500);
      }
    });
  }

  /* ---------- 工具栏绑定 ---------- */
  bindToolbar() {
    document.getElementById('addChapterBtn').addEventListener('click', () => this.addChapter());

    document.getElementById('formatBold').addEventListener('click', () => {
      document.execCommand('bold');
      this.editor.focus();
    });
    document.getElementById('formatItalic').addEventListener('click', () => {
      document.execCommand('italic');
      this.editor.focus();
    });

    // 字数目标设置
    document.getElementById('setTargetBtn').addEventListener('click', () => {
      const activeId = NovelWriter.Store.get('activeChapter');
      if (!activeId) return;
      const chapters = NovelWriter.Store.get('chapters');
      const ch = chapters.find(c => c.id === activeId);
      if (!ch) return;
      const target = prompt('设置本章字数目标：', ch.wordTarget || '');
      if (target !== null) {
        ch.wordTarget = Math.max(0, parseInt(target) || 0);
        NovelWriter.Store.set('chapters', chapters);
        this.updateTarget(ch);
        this.loadChapterList();
      }
    });

    // 创建快照
    document.getElementById('snapshotBtn').addEventListener('click', () => this.createSnapshot());
  }

  /* ---------- Markdown 预览切换 ---------- */
  bindPreviewToggle() {
    document.getElementById('previewToggle').addEventListener('click', () => {
      this.previewMode = !this.previewMode;
      document.getElementById('previewToggle').classList.toggle('active', this.previewMode);

      const preview = document.getElementById('editorPreview');
      if (this.previewMode) {
        this.editor.style.display = 'none';
        preview.style.display = 'block';
        preview.innerHTML = this.renderMarkdown(this.editor.innerText);
      } else {
        this.editor.style.display = 'block';
        preview.style.display = 'none';
      }
    });
  }

  /* 简易 Markdown 渲染 */
  renderMarkdown(text) {
    let html = NovelWriter.Utils.esc(text)
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  }

  /* ---------- 聚焦模式 ---------- */
  bindFocusMode() {
    document.getElementById('focusModeBtn').addEventListener('click', () => this.toggleFocusMode());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) {
        this.toggleFocusMode();
      }
    });
  }

  toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
    const btn = document.getElementById('focusModeBtn');
    const isFocus = document.body.classList.contains('focus-mode');
    btn.classList.toggle('active', isFocus);
    NovelWriter.Store.set('focusMode', isFocus);

    if (isFocus) {
      this.editor.focus();
      // 将编辑器居中且在视口中央
      this.editor.scrollIntoView({ block: 'center' });
    }
  }

  /* ---------- 阅读模式 ---------- */
  bindReadingMode() {
    document.getElementById('readingModeBtn').addEventListener('click', () => this.openReadingMode());
  }

  openReadingMode() {
    const activeId = NovelWriter.Store.get('activeChapter');
    if (!activeId) return;
    const chapters = NovelWriter.Store.get('chapters');
    const ch = chapters.find(c => c.id === activeId);
    if (!ch || !ch.content) return;

    const overlay = document.getElementById('readingOverlay');
    const titleEl = overlay.querySelector('.reading-title');
    const contentEl = overlay.querySelector('.reading-content');

    titleEl.textContent = ch.title;
    contentEl.innerHTML = ch.content;
    overlay.classList.add('active');
    overlay.scrollTop = 0;

    overlay.querySelector('.reading-close').addEventListener('click', () => {
      overlay.classList.remove('active');
    }, { once: true });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    }, { once: true });
  }

  /* ---------- 章节快照 ---------- */
  createSnapshot() {
    const activeId = NovelWriter.Store.get('activeChapter');
    if (!activeId) return;
    const chapters = NovelWriter.Store.get('chapters');
    const ch = chapters.find(c => c.id === activeId);
    if (!ch) return;

    if (!ch.snapshot) ch.snapshot = [];
    ch.snapshot.push({
      id: NovelWriter.Store.uid(),
      time: Date.now(),
      content: ch.content,
      title: ch.title,
      wordCount: ch.wordCount,
    });

    // 最多保留 20 个快照
    if (ch.snapshot.length > 20) ch.snapshot = ch.snapshot.slice(-20);

    NovelWriter.Store.set('chapters', chapters);
    this.showSnapshots(ch);
  }

  showSnapshots(ch) {
    const list = (ch.snapshot || []).slice().reverse().map(s => `
      <div class="snapshot-item" data-id="${s.id}">
        <span class="snapshot-time">${NovelWriter.Utils.formatDate(s.time)} ${NovelWriter.Utils.formatTime(s.time)}</span>
        <span class="snapshot-words">${s.wordCount}字</span>
        <button class="snapshot-restore" data-sid="${s.id}">恢复</button>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:13px">暂无快照</p>';

    this.app.openDialog('章节快照', `
      <div class="snapshot-list">${list}</div>
    `, `
      <button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">关闭</button>
    `);

    // 绑定恢复
    setTimeout(() => {
      document.querySelectorAll('.snapshot-restore').forEach(btn => {
        btn.addEventListener('click', () => {
          const sid = btn.dataset.sid;
          const snap = (ch.snapshot || []).find(s => s.id === sid);
          if (snap && confirm('确定恢复到这个版本？当前内容将被覆盖。')) {
            ch.content = snap.content;
            ch.title = snap.title;
            ch.wordCount = snap.wordCount;
            NovelWriter.Store.set('chapters', chapters);
            this.selectChapter(ch.id);
            this.loadChapterList();
            NovelWriter.App.closeDialog();
          }
        });
      });
    }, 50);
  }

  /* ---------- UI 更新 ---------- */
  updateWordCount(count) {
    this.wordCountEl.textContent = count.toLocaleString() + ' 字';
  }

  updateTarget(ch) {
    if (!this.targetEl) return;
    const target = ch.wordTarget || 0;
    if (target > 0) {
      const pct = Math.min(100, ((ch.wordCount || 0) / target) * 100);
      this.targetEl.innerHTML = `
        <div class="target-bar">
          <div class="target-fill" style="width:${pct}%"></div>
        </div>
        <span class="target-text">${ch.wordCount || 0}/${target} (${Math.round(pct)}%)</span>
      `;
      this.targetEl.style.display = 'flex';
    } else {
      this.targetEl.style.display = 'none';
    }
  }
};
