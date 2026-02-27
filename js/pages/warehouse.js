/**
 * pages/warehouse.js - 耗材仓库页
 */
let warehouseFilter={keyword:'',type:'',brand:''};

function renderWarehouse(){
  const inv=getInventory();
  const brands=[...new Set(inv.map(i=>i.brand))].filter(Boolean);
  const types=[...new Set(inv.map(i=>i.type))].filter(Boolean);
  const brandOpts='<option value="">全部品牌</option>'+brands.map(b=>`<option value="${b}"${warehouseFilter.brand===b?' selected':''}>${b}</option>`).join('');
  const typeOpts='<option value="">全部类型</option>'+types.map(t=>`<option value="${t}"${warehouseFilter.type===t?' selected':''}>${t}</option>`).join('');
  const filtered=_filterInv(inv);

  document.getElementById('page-container').innerHTML=`
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div><div class="page-title">耗材仓库</div><div class="page-subtitle" id="wh-subtitle">共${inv.length}卷，显示${filtered.length}条</div></div>
      <button class="btn btn-primary" onclick="navigate('add-filament')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加耗材
      </button>
    </div>
    <div class="filter-bar">
      <input class="form-input" placeholder="搜索品牌/颜色/备注..." id="wh-search" value="${warehouseFilter.keyword}"
        oninput="warehouseFilter.keyword=this.value;_refreshWhTable()" style="max-width:220px"/>
      <select class="form-select" onchange="warehouseFilter.type=this.value;_refreshWhTable()" style="max-width:130px">${typeOpts}</select>
      <select class="form-select" onchange="warehouseFilter.brand=this.value;_refreshWhTable()" style="max-width:140px">${brandOpts}</select>
      <button class="btn btn-secondary btn-sm" onclick="warehouseFilter={keyword:'',type:'',brand:''};renderWarehouse()">重置</button>
    </div>
    <div class="table-wrapper">
      <table>
        <thead><tr><th>颜色/名称</th><th>类型</th><th>剩余量</th><th>入库日期</th><th>备注</th><th>操作</th></tr></thead>
        <tbody id="wh-body">${_buildWhRows(filtered)}</tbody>
      </table>
    </div>`;
}

function _filterInv(inv){
  return inv.filter(item=>{
    const kw=warehouseFilter.keyword.toLowerCase();
    const mk=!kw||[item.brand,item.type,item.colorName,item.notes].some(s=>s&&s.toLowerCase().includes(kw));
    return mk&&(!warehouseFilter.type||item.type===warehouseFilter.type)&&(!warehouseFilter.brand||item.brand===warehouseFilter.brand);
  });
}

function _buildWhRows(filtered){
  if(!filtered.length){
    const inv=getInventory();
    return `<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted)">${inv.length===0?'仓库为空，请先<a href="#" onclick="navigate(\'add-filament\');return false" style="color:var(--accent)">添加耗材</a>':'没有匹配的耗材'}</td></tr>`;
  }
  return filtered.map(item=>`
    <tr>
      <td><div class="filament-cell">${renderSwatch(item.color)}<div><div class="filament-name">${item.colorName}</div><div class="filament-meta">${item.brand}</div></div></div></td>
      <td><span class="badge ${getTypeBadgeClass(item.type)}">${item.type}</span></td>
      <td style="min-width:140px">${renderProgressBar(item.remainingWeight,item.spoolWeight)}</td>
      <td style="font-size:12px;color:var(--text-muted)">${item.addedDate}</td>
      <td style="font-size:12px;color:var(--text-secondary);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${item.notes||''}">${item.notes||'—'}</td>
      <td>
        <div class="inline-use-form">
          <input type="number" placeholder="克数" min="0.1" step="0.1" id="use-${item.id}" style="width:78px;padding:5px 8px;font-size:12px;border:1px solid var(--input-border);border-radius:6px;font-family:var(--font-mono)"/>
          <button class="btn btn-danger btn-sm" onclick="handleUse('${item.id}')">消耗</button>
          <button class="btn btn-success btn-sm" onclick="handleReturn('${item.id}')">退回</button>
          <button class="btn btn-icon btn-sm" title="删除" onclick="handleDeleteInventory('${item.id}','${(item.brand+' '+item.type+' '+item.colorName).replace(/'/g,"\\'")}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function _refreshWhTable(){
  const inv=getInventory(); const filtered=_filterInv(inv);
  const tbody=document.getElementById('wh-body'); if(tbody)tbody.innerHTML=_buildWhRows(filtered);
  const sub=document.getElementById('wh-subtitle'); if(sub)sub.textContent=`共${inv.length}卷，显示${filtered.length}条`;
}

function handleUse(id){
  const input=document.getElementById(`use-${id}`); const g=parseFloat(input.value);
  if(!g||g<=0){showToast('请输入消耗克数','warning');return;}
  const r=useFilament(id,g);
  if(r.ok){showToast(`消耗${g}g，剩余${r.remaining}g`,'success');input.value='';_refreshWhTable();}
  else showToast(r.msg,'danger');
}

function handleReturn(id){
  const input=document.getElementById(`use-${id}`); const g=parseFloat(input.value);
  if(!g||g<=0){showToast('请输入退回克数','warning');return;}
  const r=returnFilament(id,g);
  if(r.ok){showToast(`退回${g}g，剩余${r.remaining}g`,'success');input.value='';_refreshWhTable();}
  else showToast(r.msg,'danger');
}

function handleDeleteInventory(id,name){
  confirmModal(`确定要从仓库删除"${name}"吗？此操作不可撤销。`,()=>{
    deleteInventoryItem(id); showToast('已删除','success'); renderWarehouse();
  });
}
