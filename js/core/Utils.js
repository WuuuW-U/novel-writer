/* ========== 墨笔 · 工具函数 ========== */
window.NovelWriter = window.NovelWriter || {};

NovelWriter.Utils = {
  /* HTML 转义 */
  esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  /* 统计中英文字数 */
  countWords(text) {
    if (!text || !text.trim()) return 0;
    const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const english = (text.match(/[a-zA-Z]+/g) || []).length;
    return chinese + english;
  },

  /* 获取今日日期 YYYY-MM-DD */
  getToday() {
    return new Date().toISOString().slice(0, 10);
  },

  /* 格式化日期 */
  formatDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /* 格式化时间 */
  formatTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  /* 防抖 */
  debounce(fn, delay = 300) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /* 计算相对时间 */
  timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  },

  /* 可拖拽排序 —— 绑定容器 */
  enableDragSort(container, onOrderChange) {
    let dragEl = null;

    const handleDragStart = (e) => {
      dragEl = e.target.closest('[draggable]');
      if (!dragEl) return;
      dragEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragEl.dataset.id);
    };

    const handleDragEnd = () => {
      if (!dragEl) return;
      dragEl.classList.remove('dragging');
      dragEl = null;
      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      if (!dragEl) return;
      const target = e.target.closest('[draggable]');
      if (!target || target === dragEl) return;

      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

      const rect = target.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const indicator = document.createElement('div');
      indicator.className = 'drop-indicator';
      if (e.clientY < mid) {
        target.parentNode.insertBefore(indicator, target);
      } else {
        target.parentNode.insertBefore(indicator, target.nextSibling);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const indicator = document.querySelector('.drop-indicator');
      if (!indicator || !dragEl) return;

      indicator.parentNode.insertBefore(dragEl, indicator);
      indicator.remove();
      dragEl.classList.remove('dragging');

      const items = [...container.querySelectorAll('[draggable]')];
      const order = items.map(el => el.dataset.id);
      onOrderChange(order);
      dragEl = null;
    };

    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragend', handleDragEnd);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    return () => {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragend', handleDragEnd);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  },
};
