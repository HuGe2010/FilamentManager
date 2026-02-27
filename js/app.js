/**
 * app.js - 主控制器（最后加载）
 * 负责路由管理和导航切换。
 */

const ROUTES = {
  'dashboard':    renderDashboard,
  'warehouse':    renderWarehouse,
  'add-filament': renderAddFilament,
  'presets':      renderPresets,
  'history':      renderHistory,
  'data-manage':  renderDataManage,
};

let currentPage = 'dashboard';

function navigate(pageId) {
  if (!ROUTES[pageId]) { console.warn('[App] 未知页面:', pageId); return; }
  currentPage = pageId;
  // 更新导航激活状态
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });
  // 渲染页面
  try { ROUTES[pageId](); }
  catch(e) {
    console.error('[App] 渲染错误:', e);
    document.getElementById('page-container').innerHTML =
      `<div class="empty-state"><p style="color:var(--danger)">页面渲染出错：${e.message}</p></div>`;
  }
  // 滚动到顶部
  document.querySelector('.main-content').scrollTop = 0;
}

function init() {
  // 绑定侧边栏点击
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => { if(item.dataset.page) navigate(item.dataset.page); });
  });
  navigate('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
