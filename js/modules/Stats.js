/* ========== 墨笔 · 统计模块 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Stats = class Stats {
  constructor(app) { this.app = app; }

  init() {
    document.getElementById('dailyGoalInput').addEventListener('change', () => {
      const progress = NovelWriter.Store.get('progress');
      progress.dailyGoal = parseInt(document.getElementById('dailyGoalInput').value) || 2000;
      NovelWriter.Store.set('progress', progress);
      this.load();
    });
    this.load();
  }

  load() {
    const chapters = NovelWriter.Store.get('chapters');
    const chars = NovelWriter.Store.get('characters');
    const progress = NovelWriter.Store.get('progress');
    const history = progress.history || {};

    const totalWords = chapters.reduce((s, ch) => s + (ch.wordCount || 0), 0);
    document.getElementById('totalWords').textContent = totalWords.toLocaleString();
    document.getElementById('totalChapters').textContent = chapters.length;
    document.getElementById('totalCharacters').textContent = chars.length;
    document.getElementById('writingDays').textContent = Object.keys(history).length;

    const goalInput = document.getElementById('dailyGoalInput');
    goalInput.value = progress.dailyGoal || 2000;

    this.updateDailyGoal(progress, history);
    this.renderChart(history);
  }

  updateDailyGoal(progress, history) {
    const today = NovelWriter.Utils.getToday();
    const todayWords = history[today] || 0;
    const goal = progress.dailyGoal || 2000;
    const pct = Math.min(100, (todayWords / goal) * 100);

    document.getElementById('dailyProgressFill').style.width = pct + '%';
    document.getElementById('dailyGoalText').textContent = `${todayWords.toLocaleString()} / ${goal.toLocaleString()} 字`;

    // 进度颜色变化
    const fill = document.getElementById('dailyProgressFill');
    if (pct >= 100) fill.style.background = 'linear-gradient(90deg, #4ade80, #22d3ee)';
    else if (pct >= 70) fill.style.background = 'linear-gradient(90deg, #d4a047, #f59e0b)';
    else fill.style.background = 'linear-gradient(90deg, #d4a047, #e04a7a)';
  }

  renderChart(history) {
    const chart = document.getElementById('barChart');
    const days = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: dayNames[d.getDay()], value: history[key] || 0, full: d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) });
    }

    const maxVal = Math.max(...days.map(d => d.value), 1);
    chart.innerHTML = days.map(d => `
      <div class="bar-item">
        <span class="bar-value">${d.value > 0 ? d.value : ''}</span>
        <div class="bar-fill" style="height:${(d.value / maxVal) * 100}%">
          <div class="bar-glow"></div>
        </div>
        <span class="bar-label">${d.label}</span>
        <span class="bar-date">${d.full}</span>
      </div>
    `).join('');
  }
};
