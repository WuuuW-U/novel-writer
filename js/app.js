/* ========== 墨笔 · 应用入口 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.App = class App {
  constructor() {
    this.editor = null;
    this.outline = null;
    this.characters = null;
    this.timeline = null;
    this.settings = null;
    this.stats = null;
    this.search = null;
    this.exportMod = null;
  }

  init() {
    NovelWriter.Store.migrate();
    const accent = NovelWriter.Store.get('accentTheme');
    document.documentElement.setAttribute('data-accent', accent);
    this.editor = new NovelWriter.Editor(this);
    this.outline = new NovelWriter.Outline(this);
    this.characters = new NovelWriter.Characters(this);
    this.timeline = new NovelWriter.Timeline(this);
    this.settings = new NovelWriter.Settings(this);
    this.stats = new NovelWriter.Stats(this);
    this.search = new NovelWriter.Search(this);
    this.exportMod = new NovelWriter.Export(this);
    App.editor = this.editor;
    App.outline = this.outline;
    App.characters = this.characters;
    App.timeline = this.timeline;
    App.settings = this.settings;
    App.stats = this.stats;
    App.search = this.search;
    App.exportMod = this.exportMod;
    App._dialogHandler = null;
    this.bindNav();
    this.bindMobile();
    this.bindTheme();
    this.bindBackup();
    this.editor.init();
    this.outline.init();
    this.characters.init();
    this.timeline.init();
    this.settings.init();
    this.stats.init();
    this.search.init();
    this.exportMod.init();
    if (NovelWriter.Store.get('focusMode')) {
      document.body.classList.add('focus-mode');
      document.getElementById('focusModeBtn').classList.add('active');
    }
  }

  bindMobile() {
    const toggle = document.getElementById('mobileChapterToggle');
    const panel = document.getElementById('chapterPanel');
    const overlay = document.getElementById('chapterOverlay');
    if (!toggle || !panel || !overlay) return;
    const close = () => {
      panel.classList.remove('open');
      overlay.classList.remove('active');
    };
    toggle.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      if (isOpen) { close(); } else {
        panel.classList.add('open');
        overlay.classList.add('active');
      }
    });
    overlay.addEventListener('click', close);
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', close);
    });
  }

  bindNav() {
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const viewEl = document.getElementById('view-' + view);
        if (viewEl) viewEl.classList.add('active');
        if (view === 'progress') this.stats.load();
      });
    });
  }

  bindTheme() {
    document.querySelectorAll('.theme-option').forEach(el => {
      el.addEventListener('click', () => {
        const theme = el.dataset.theme;
        document.documentElement.setAttribute('data-accent', theme);
        NovelWriter.Store.set('accentTheme', theme);
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        el.classList.add('active');
      });
    });
    const current = NovelWriter.Store.get('accentTheme');
    document.querySelectorAll('.theme-option').forEach(el => {
      if (el.dataset.theme === current) el.classList.add('active');
    });
  }

  bindBackup() {
    setInterval(() => NovelWriter.Store.save(), 300000);
  }

  recordProgress() {
    const chapters = NovelWriter.Store.get('chapters');
    const totalWords = chapters.reduce((s, ch) => s + (ch.wordCount || 0), 0);
    const progress = NovelWriter.Store.get('progress');
    if (!progress.history) progress.history = {};
    const today = NovelWriter.Utils.getToday();
    const prevTotal = progress._lastTotal || 0;
    const added = Math.max(0, totalWords - prevTotal);
    if (added > 0) progress.history[today] = (progress.history[today] || 0) + added;
    progress._lastTotal = totalWords;
    NovelWriter.Store.set('progress', progress);
  }

  openDialog(title, bodyHTML, footerHTML) {
    document.getElementById('dialogTitle').textContent = title;
    document.getElementById('dialogBody').innerHTML = bodyHTML;
    document.getElementById('dialogFooter').innerHTML = footerHTML || '';
    document.getElementById('dialogOverlay').classList.add('active');
    App._dialogHandler = (e) => { if (e.key === 'Escape') App.closeDialog(); };
    document.addEventListener('keydown', App._dialogHandler);
  }

  closeDialog() {
    document.getElementById('dialogOverlay').classList.remove('active');
    if (App._dialogHandler) {
      document.removeEventListener('keydown', App._dialogHandler);
      App._dialogHandler = null;
    }
  }

  static closeDialog() { App._?.closeDialog(); }
  static openDialog(t, b, f) { App._?.openDialog(t, b, f); }
};

document.addEventListener('DOMContentLoaded', () => {
  const ready = () => {
    if (window.NovelWriter && NovelWriter.Store && NovelWriter.Utils && NovelWriter.Editor) {
      const app = new NovelWriter.App();
      NovelWriter.App._ = app;
      app.init();
    } else {
      setTimeout(ready, 50);
    }
  };
  ready();
});
