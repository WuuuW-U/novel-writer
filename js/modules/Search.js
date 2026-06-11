/* ========== 墨笔 · 全文搜索模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Search = class Search {
  constructor(app) { this.app = app; }

  init() {
    document.getElementById('searchBtn').addEventListener('click', () => this.open());
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.open();
      }
    });
  }

  open() {
    const body = `
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" class="search-icon"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input type="text" id="searchInput" class="search-input" placeholder="搜索章节内容…" autofocus>
        <span class="search-hint">Enter 切换结果 · Esc 关闭</span>
      </div>
      <div class="search-results" id="searchResults">
        <div class="search-empty">输入关键词开始搜索</div>
      </div>`;
    const footer = `<button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">关闭</button>`;
    this.app.openDialog('全文搜索', body, footer);

    const input = document.getElementById('searchInput');
    input.addEventListener('input', NovelWriter.Utils.debounce(() => this.search(input.value), 200));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const first = document.querySelector('.search-result-item');
        if (first) first.click();
      }
      if (e.key === 'Escape') NovelWriter.App.closeDialog();
    });
    setTimeout(() => input.focus(), 100);
  }

  search(query) {
    const results = document.getElementById('searchResults');
    if (!query.trim()) {
      results.innerHTML = '<div class="search-empty">输入关键词开始搜索</div>';
      return;
    }

    const chapters = NovelWriter.Store.get('chapters');
    const q = query.toLowerCase();
    const matches = [];

    chapters.forEach(ch => {
      const text = (ch.content || '').replace(/<[^>]+>/g, ' ');
      const lower = text.toLowerCase();
      let idx = lower.indexOf(q);
      let count = 0;
      while (idx !== -1 && count < 5) {
        count++;
        const start = Math.max(0, idx - 30);
        const end = Math.min(text.length, idx + q.length + 30);
        let snippet = text.slice(start, end);
        if (start > 0) snippet = '…' + snippet;
        if (end < text.length) snippet = snippet + '…';
        matches.push({ chapterId: ch.id, chapterTitle: ch.title, snippet, idx: count });
        idx = lower.indexOf(q, idx + q.length);
      }
      if (count === 0 && lower.includes(q)) {
        matches.push({ chapterId: ch.id, chapterTitle: ch.title, snippet: text.slice(0, 80) + '…', idx: 0 });
      }
    });

    if (matches.length === 0) {
      results.innerHTML = `<div class="search-empty">未找到 "${NovelWriter.Utils.esc(query)}" 的相关内容</div>`;
      return;
    }

    results.innerHTML = matches.slice(0, 30).map(m => `
      <div class="search-result-item" data-chapter="${m.chapterId}">
        <div class="search-result-title">${NovelWriter.Utils.esc(m.chapterTitle)}</div>
        <div class="search-result-snippet">${NovelWriter.Utils.esc(m.snippet)}</div>
      </div>
    `).join('');

    results.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const chId = el.dataset.chapter;
        NovelWriter.App.closeDialog();
        // 切换到写作视图，选中该章节
        document.querySelector('[data-view="write"]').click();
          NovelWriter.App.editor?.selectChapter(chId);
      });
    });
  }
};
