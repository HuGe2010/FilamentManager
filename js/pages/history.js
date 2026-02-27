/**
 * pages/history.js - 使用记录页
 */
let histFilterAction='';

function renderHistory(){
  const log=getUsageLog();
  const filtered=histFilterAction?log.filter(l=>l.action===histFilterAction):log;
  const totUse=log.filter(l=>l.action==='use').reduce((s,l)=>s+l.amount,0);
  const totRet=log.filter(l=>l.action==='return').reduce((s,l)=>s+l.amount,0);
  const totAdd=log.filter(l=>l.action==='add').reduce((s,l)=>s+l.amount,0);

  const btns=['','add','use','return'].map(a=>`
    <button class="btn ${histFilterAction===a?'btn-primary':'btn-secondary'} btn-sm"
      onclick="histFilterAction='${a}';renderHistory()">
      ${a===''?'全部':a==='add'?'入库':a==='use'?'消耗':'退回'}
    </button>`).join('');

  document.getElementById('page-container').innerHTML=`
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div><div class="page-title">使用记录</div><div class="page-subtitle">共 ${log.length} 条，显示 ${filtered.length} 条</div></div>
      <button class="btn btn-danger btn-sm" onclick="handleClearLog()">清空记录</button>
    </div>
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card"><div class="stat-label">累计入库</div><div class="stat-value">${(totAdd/1000).toFixed(2)}<span class="stat-unit">kg</span></div></div>
      <div class="stat-card"><div class="stat-label">累计消耗</div><div class="stat-value" style="color:var(--danger)">${(totUse/1000).toFixed(2)}<span class="stat-unit">kg</span></div></div>
      <div class="stat-card"><div class="stat-label">累计退回</div><div class="stat-value" style="color:var(--success)">${(totRet/1000).toFixed(2)}<span class="stat-unit">kg</span></div></div>
      <div class="stat-card"><div class="stat-label">净消耗量</div><div class="stat-value">${((totUse-totRet)/1000).toFixed(2)}<span class="stat-unit">kg</span></div></div>
    </div>
    <div class="filter-bar" style="margin-bottom:14px">${btns}</div>
    <div class="card"><div class="history-log">${filtered.length?filtered.map(renderLogItem).join(''):'<div class="empty-state"><p>暂无记录</p></div>'}</div></div>`;
}

function renderLogItem(item){
  const am={use:{icon:'↓',cls:'use',label:'消耗',pfx:'-'},return:{icon:'↑',cls:'return',label:'退回',pfx:'+'},add:{icon:'★',cls:'add',label:'入库',pfx:'+'}};
  const a=am[item.action]||am.use;
  return `
    <div class="log-item">
      <div class="log-icon ${a.cls}">${a.icon}</div>
      <div class="log-body">
        <div class="log-title">${a.label} · ${item.brand} ${item.type}
          <span style="display:inline-flex;align-items:center;gap:4px;margin-left:4px">
            <span class="color-swatch" style="width:12px;height:12px;border-width:1.5px;background:${item.color||'#999'}"></span>${item.colorName}
          </span>
        </div>
        ${item.note?`<div class="log-sub">${item.note}</div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        <div class="log-amount ${a.cls}">${a.pfx}${item.amount}g</div>
        <div class="log-date">${fmtDate(item.date)}</div>
      </div>
    </div>`;
}

function handleClearLog(){
  confirmModal('确定清空所有使用记录吗？不会影响仓库库存数据。',()=>{
    clearUsageLog(); showToast('记录已清空','success'); renderHistory();
  });
}
