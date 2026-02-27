/**
 * pages/add-filament.js - 添加耗材页（从预设入库）
 */
let addFilter='', selectedPresetId=null, addQty=1;

function renderAddFilament(){
  selectedPresetId=null; addQty=1;
  document.getElementById('page-container').innerHTML=`
    <div class="page-header"><div class="page-title">添加耗材</div><div class="page-subtitle">从预设库选择规格，设置数量后入库</div></div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">步骤 1 — 选择耗材预设</div>
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center">
        <input class="form-input" placeholder="搜索品牌/类型/颜色..." id="add-search" style="max-width:240px" value="${addFilter}"
          oninput="addFilter=this.value;_refreshAddGrid()"/>
        <button class="btn btn-secondary btn-sm" onclick="navigate('presets')">管理预设 →</button>
      </div>
      <div class="preset-grid" id="preset-grid"></div>
    </div>
    <div class="card" id="add-confirm" style="display:none">
      <div class="card-title">步骤 2 — 确认入库</div>
      <div id="sel-preview" style="margin-bottom:16px"></div>
      <div class="form-group">
        <div class="form-label">入库卷数</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(-1)">−</button>
          <span class="qty-value" id="qty-display">1</span>
          <button class="qty-btn" onclick="changeQty(1)">+</button>
        </div>
        <div class="form-hint">每卷重量按预设满卷克重计算</div>
      </div>
      <div class="form-group">
        <label class="form-label">备注（可选）</label>
        <input class="form-input" id="add-notes" placeholder="如：促销购入、特殊批次..."/>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="confirmAdd()">✓ 确认入库</button>
        <button class="btn btn-secondary" onclick="cancelSel()">取消选择</button>
      </div>
    </div>`;
  _refreshAddGrid();
}

function _refreshAddGrid(){
  const presets=getPresets();
  const kw=addFilter.toLowerCase();
  const filtered=kw?presets.filter(p=>[p.brand,p.type,p.colorName,p.notes].some(s=>s&&s.toLowerCase().includes(kw))):presets;
  const grid=document.getElementById('preset-grid'); if(!grid)return;
  if(!filtered.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><p>${addFilter?'未找到匹配预设':'预设库为空'}</p><br><button class="btn btn-primary btn-sm" onclick="navigate('presets')">前往预设管理</button></div>`;
    return;
  }
  grid.innerHTML=filtered.map(p=>`
    <div class="preset-card${selectedPresetId===p.id?' selected':''}" onclick="selectPreset('${p.id}')">
      <div class="preset-card-header">${renderSwatch(p.color)}<div><div class="preset-card-name">${p.colorName}</div><div class="preset-card-brand">${p.brand}</div></div></div>
      <span class="badge ${getTypeBadgeClass(p.type)}">${p.type}</span>
      <div class="preset-card-detail">满卷 ${p.spoolWeight}g</div>
      ${p.notes?`<div class="preset-card-detail" style="color:var(--text-muted)">${p.notes}</div>`:''}
    </div>`).join('');
}

function selectPreset(id){
  selectedPresetId=id; addQty=1;
  _refreshAddGrid();
  const preset=getPresets().find(p=>p.id===id); if(!preset)return;
  const conf=document.getElementById('add-confirm'); if(conf)conf.style.display='block';
  const prev=document.getElementById('sel-preview');
  if(prev)prev.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;background:#fafafa;border-radius:8px;padding:12px 16px;border:1px solid var(--card-border)">
      ${renderSwatch(preset.color)}
      <div><div style="font-weight:600;font-size:14px">${preset.brand} ${preset.type} · ${preset.colorName}</div>
      <div style="font-size:12px;color:var(--text-secondary)">每卷 ${preset.spoolWeight}g</div></div>
      <span class="badge ${getTypeBadgeClass(preset.type)}" style="margin-left:auto">${preset.type}</span>
    </div>`;
  document.getElementById('qty-display').textContent=addQty;
  conf.scrollIntoView({behavior:'smooth',block:'start'});
}

function changeQty(d){ addQty=Math.max(1,Math.min(99,addQty+d)); const el=document.getElementById('qty-display'); if(el)el.textContent=addQty; }

function confirmAdd(){
  if(!selectedPresetId){showToast('请先选择预设','warning');return;}
  const preset=getPresets().find(p=>p.id===selectedPresetId);
  if(!preset){showToast('预设不存在','danger');return;}
  const notes=document.getElementById('add-notes')?.value.trim()||'';
  addToInventory({...preset,notes},addQty);
  showToast(`已入库 ${addQty} 卷 ${preset.brand} ${preset.type} ${preset.colorName}`,'success');
  navigate('warehouse');
}

function cancelSel(){
  selectedPresetId=null;
  const c=document.getElementById('add-confirm'); if(c)c.style.display='none';
  _refreshAddGrid();
}
