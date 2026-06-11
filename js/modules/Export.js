/* ========== 墨笔 · 导出模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Export = class Export {
  constructor(app) { this.app = app; }

  init() {
    document.getElementById('exportBtn').addEventListener('click', () => this.showDialog());
  }

  showDialog() {
    const body = `
      <div class="export-options">
        <button class="export-btn" data-format="txt">
          <div class="export-btn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <span class="export-btn-label">TXT 纯文本</span>
          <span class="export-btn-desc">适合导入其他写作软件</span>
        </button>
        <button class="export-btn" data-format="html">
          <div class="export-btn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
          </div>
          <span class="export-btn-label">HTML 网页</span>
          <span class="export-btn-desc">生成可阅读的排版文档</span>
        </button>
        <button class="export-btn" data-format="json">
          <div class="export-btn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>
          </div>
          <span class="export-btn-label">JSON 备份</span>
          <span class="export-btn-desc">完整数据，可恢复</span>
        </button>
      </div>`;
    const footer = `<button class="btn-cancel" onclick="NovelWriter.App.closeDialog()">取消</button>`;
    this.app.openDialog('导出小说', body, footer);

    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.exportNovel(btn.dataset.format);
        NovelWriter.App.closeDialog();
      });
    });
  }

  exportNovel(format) {
    const chapters = NovelWriter.Store.get('chapters');
    if (chapters.length === 0) { alert('还没有章节可以导出'); return; }

    if (format === 'txt') {
      const text = chapters.map(ch => {
        const div = document.createElement('div');
        div.innerHTML = ch.content || '';
        return `${ch.title}\n${'='.repeat(ch.title.length)}\n\n${div.innerText}`;
      }).join('\n\n' + '-'.repeat(20) + '\n\n');
      this.download(text, 'novel.txt', 'text/plain');
    } else if (format === 'html') {
      const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>小说</title>
<style>
body{max-width:720px;margin:40px auto;padding:0 24px;background:#faf8f5;color:#2c2c2c;font-family:'Noto Serif SC','Source Han Serif SC','Georgia',serif;line-height:2;font-size:16px}
h1{text-align:center;font-size:28px;margin-bottom:8px;font-weight:600}
h2{font-size:20px;margin-top:48px;padding-bottom:8px;border-bottom:2px solid #d4a047;font-weight:600}
hr{border:none;border-top:1px solid #ddd;margin:32px 0}
p{text-indent:2em;margin:0.5em 0}
.cover{text-align:center;margin-bottom:48px}
.cover .meta{color:#888;font-size:14px}
</style></head>
<body>
<div class="cover"><h1>小说</h1><p class="meta">共 ${chapters.length} 章 · ${chapters.reduce((s,c)=>s+(c.wordCount||0),0).toLocaleString()} 字</p></div>
${chapters.map((ch,i) => `
<h2>${NovelWriter.Utils.esc(ch.title)}</h2>
${ch.content || ''}
${i < chapters.length - 1 ? '<hr>' : ''}
`).join('')}
</body></html>`;
      this.download(html, 'novel.html', 'text/html');
    } else if (format === 'json') {
      const data = NovelWriter.Store.load();
      const json = JSON.stringify(data, null, 2);
      this.download(json, `墨笔备份_${NovelWriter.Utils.getToday()}.json`, 'application/json');
    }
  }

  download(content, filename, type) {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
