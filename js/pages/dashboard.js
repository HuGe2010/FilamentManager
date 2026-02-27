/**
 * pages/dashboard.js - 仪表盘页
 */
function renderDashboard() {
  const stats = getStats();
  const log = getUsageLog().slice(0, 5);

  // 低库存提醒横幅
  let banner='';
  if(stats.lowStock.length>0){
    const names=stats.lowStock.map(i=>`${i.brand} ${i.type} ${i.colorName}`).join('、');
    banner=`<div class="alert-banner warning">⚠ 低库存预警（剩余不足20%）：${names}</div>`;
  }

  // 按类型分布条形图
  const byType=stats.byType, maxT=Math.max(...Object.values(byType),1);
  const typeRows=Object.entries(byType).map(([t,n])=>`
    <div class="dist-item">
      <span class="dist-label"><span class="badge ${getTypeBadgeClass(t)}">${t}</span></span>
      <div class="dist-bar-wrap"><div class="dist-bar" style="width:${(n/maxT*100).toFixed(0)}%"></div></div>
      <span class="dist-count">${n}卷</span>
    </div>`).join('')||'<p style="color:var(--text-muted);font-size:13px">暂无数据</p>';

  // 按品牌分布
  const byBrand=stats.byBrand, maxB=Math.max(...Object.values(byBrand),1);
  const brandRows=Object.entries(byBrand).map(([b,n])=>`
    <div class="dist-item">
      <span class="dist-label" style="font-size:13px">${b}</span>
      <div class="dist-bar-wrap"><div class="dist-bar" style="width:${(n/maxB*100).toFixed(0)}%;background:#457b9d"></div></div>
      <span class="dist-count">${n}卷</span>
    </div>`).join('')||'<p style="color:var(--text-muted);font-size:13px">暂无数据</p>';

  // 最近日志
  const recentLog=log.length>0?log.map(renderLogItem).join('')
    :'<p style="color:var(--text-muted);font-size:13px;padding:16px 0">暂无记录</p>';

  document.getElementById('page-container').innerHTML=`
    <div class="page-header"><div class="page-title">仪表盘</div><div class="page-subtitle">耗材库存总览</div></div>
    ${banner}
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">库存卷数</div><div class="stat-value">${stats.totalSpools}<span class="stat-unit">卷</span></div></div>
      <div class="stat-card"><div class="stat-label">总剩余量</div><div class="stat-value">${(stats.totalWeight/1000).toFixed(2)}<span class="stat-unit">kg</span></div></div>
      <div class="stat-card"><div class="stat-label">已使用量</div><div class="stat-value">${(stats.usedWeight/1000).toFixed(2)}<span class="stat-unit">kg</span></div></div>
      <div class="stat-card"><div class="stat-label">低库存预警</div><div class="stat-value" style="color:${stats.lowStock.length>0?'var(--danger)':'inherit'}">${stats.lowStock.length}<span class="stat-unit">卷</span></div></div>
      <div class="stat-card"><div class="stat-label">品牌数量</div><div class="stat-value">${Object.keys(stats.byBrand).length}<span class="stat-unit">个</span></div></div>
      <div class="stat-card"><div class="stat-label">耗材类型</div><div class="stat-value">${Object.keys(stats.byType).length}<span class="stat-unit">种</span></div></div>
    </div>
    <div class="distribution-grid">
      <div class="card"><div class="card-title">按类型分布</div>${typeRows}</div>
      <div class="card"><div class="card-title">按品牌分布</div>${brandRows}</div>
    </div>
    <div class="card">
      <div class="card-title">最近操作记录</div>
      <div class="history-log">${recentLog}</div>
      ${log.length>0?`<div style="margin-top:12px"><button class="btn btn-secondary btn-sm" onclick="navigate('history')">查看全部 →</button></div>`:''}
    </div>`;
}
