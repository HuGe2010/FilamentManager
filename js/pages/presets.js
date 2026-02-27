/**
 * pages/presets.js - 预设管理页
 */
function renderPresets(){
  const presets=getPresets();
  const rows=presets.map(p=>`
    <tr>
      <td><div class="filament-cell">${renderSwatch(p.color)}<div><div class="filament-name">${p.colorName}</div><div class="filament-meta" style="font-size:11px">${p.color}</div></div></div></td>
      <td style="font-weight:500">${p.brand}</td>
      <td><span class="badge ${getTypeBadgeClass(p.type)}">${p.type}</span></td>
      <td style="font-family:var(--font-mono);font-size:13px">${p.spoolWeight}g</td>
      <td style="font-size:12px;color:var(--text-secondary)">${p.notes||'—'}</td>
      <td><div class="btn-group">
        <button class="btn btn-secondary btn-sm" onclick="openEditPreset('${p.id}')">编辑</button>
        <button class="btn btn-danger btn-sm" onclick="handleDelPreset('${p.id}','${(p.brand+' '+p.type+' '+p.colorName).replace(/'/g,"\\'")}')">删除</button>
      </div></td>
    </tr>`).join('')||`<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted)">暂无预设，请点击"新建预设"添加</td></tr>`;

  document.getElementById('page-container').innerHTML=`
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div><div class="page-title">耗材预设</div><div class="page-subtitle">预设是添加耗材到仓库的模板，共 ${presets.length} 条</div></div>
      <button class="btn btn-primary" onclick="openAddPreset()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>新建预设
      </button>
    </div>
    <div class="table-wrapper"><table>
      <thead><tr><th>颜色</th><th>品牌</th><th>类型</th><th>满卷克重</th><th>备注</th><th>操作</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function _presetFormHTML(p={}){
  return `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">品牌 *</label>
        <input class="form-input" id="pf-brand" placeholder="如：Bambu Lab" value="${p.brand||''}" list="bl"/>
        <datalist id="bl"><option value="Bambu Lab"><option value="eSUN"><option value="Polymaker"><option value="Overture"><option value="SUNLU"><option value="Prusament"></datalist>
      </div>
      <div class="form-group"><label class="form-label">类型 *</label>
        <select class="form-select" id="pf-type">${renderTypeOptions(p.type||'PLA')}</select>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">颜色名称 *</label>
        <input class="form-input" id="pf-colorName" placeholder="如：白色、星光银" value="${p.colorName||''}"/>
      </div>
      <div class="form-group"><label class="form-label">颜色</label>
        <div class="color-input-wrap">
          <div class="color-preview" id="pf-cprev" style="background:${p.color||'#ffffff'}"></div>
          <input type="color" id="pf-color" value="${p.color||'#ffffff'}" oninput="document.getElementById('pf-cprev').style.background=this.value"/>
          <span style="font-size:12px;color:var(--text-muted)">点击取色</span>
        </div>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">满卷克重（g）*</label>
        <input class="form-input" type="number" id="pf-weight" min="1" step="1" value="${p.spoolWeight||1000}"/>
        <div class="form-hint">常见：1000g / 500g / 250g</div>
      </div>
      <div class="form-group"><label class="form-label">备注（可选）</label>
        <input class="form-input" id="pf-notes" value="${p.notes||''}"/>
      </div>
    </div>`;
}

function _collectPresetForm(){
  const brand=document.getElementById('pf-brand')?.value.trim();
  const type=document.getElementById('pf-type')?.value;
  const colorName=document.getElementById('pf-colorName')?.value.trim();
  const color=document.getElementById('pf-color')?.value;
  const weight=parseFloat(document.getElementById('pf-weight')?.value);
  const notes=document.getElementById('pf-notes')?.value.trim();
  if(!brand){showToast('请填写品牌','warning');return null;}
  if(!colorName){showToast('请填写颜色名称','warning');return null;}
  if(!weight||weight<=0){showToast('请填写有效克重','warning');return null;}
  return {brand,type,colorName,color,spoolWeight:weight,notes};
}

function openAddPreset(){
  openModal('新建耗材预设',_presetFormHTML(),[
    {label:'取消',cls:'btn-secondary',onClick:closeModal},
    {label:'创建',cls:'btn-primary',onClick:()=>{
      const d=_collectPresetForm(); if(!d)return;
      addPreset(d); closeModal(); showToast('预设已创建','success'); renderPresets();
    }}
  ]);
}

function openEditPreset(id){
  const p=getPresets().find(x=>x.id===id); if(!p)return;
  openModal('编辑耗材预设',_presetFormHTML(p),[
    {label:'取消',cls:'btn-secondary',onClick:closeModal},
    {label:'保存',cls:'btn-primary',onClick:()=>{
      const d=_collectPresetForm(); if(!d)return;
      updatePreset(id,d); closeModal(); showToast('预设已更新','success'); renderPresets();
    }}
  ]);
}

function handleDelPreset(id,name){
  confirmModal(`确定删除预设"${name}"？已在仓库中的耗材不受影响。`,()=>{
    deletePreset(id); showToast('预设已删除','success'); renderPresets();
  });
}
