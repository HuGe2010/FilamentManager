/**
 * pages/warehouse.js - 耗材仓库页
 */
let warehouseFilter = { keyword: '', type: '', brand: '' };

function renderWarehouse() {
  const inv = getInventory();
  const brands = [...new Set(inv.map(i => i.brand))].filter(Boolean);
  const types = [...new Set(inv.map(i => i.type))].filter(Boolean);
  const brandOpts = '<option value="">全部品牌</option>' + brands.map(b => `<option value="${b}"${warehouseFilter.brand === b ? ' selected' : ''}>${b}</option>`).join('');
  const typeOpts = '<option value="">全部类型</option>' + types.map(t => `<option value="${t}"${warehouseFilter.type === t ? ' selected' : ''}>${t}</option>`).join('');
  const filtered = _filterInv(inv);

  document.getElementById('page-container').innerHTML = `
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
        <thead><tr><th>颜色/名称</th><th>类型</th><th>剩余量</th><th>卷数</th><th>备注</th><th>操作</th></tr></thead>
        <tbody id="wh-body">${_buildWhRows(filtered)}</tbody>
      </table>
    </div>`;
}

function _filterInv(inv) {
  return inv.filter(item => {
    const kw = warehouseFilter.keyword.toLowerCase();
    const mk = !kw || [item.brand, item.type, item.colorName, item.notes].some(s => s && s.toLowerCase().includes(kw));
    return mk && (!warehouseFilter.type || item.type === warehouseFilter.type) && (!warehouseFilter.brand || item.brand === warehouseFilter.brand);
  });
}

function _buildWhRows(filtered) {
  if (!filtered.length) {
    const inv = getInventory();
    return `<tr><td colspan="6" style="text-align:center;padding:50px;color:var(--text-muted)">
      ${inv.length === 0
        ? '仓库为空，请先<a href="#" onclick="navigate(\'add-filament\');return false" style="color:var(--accent)">添加耗材</a>'
        : '没有匹配的耗材'}
    </td></tr>`;
  }

  // 先把所有卷分成"使用中"和"已用完"两堆
  const active = filtered.filter(i => i.remainingWeight > 0);
  const empty  = filtered.filter(i => i.remainingWeight === 0);

  let html = '';
  html += _buildSection(active, 'active');
  if (empty.length > 0) {
    html += _buildSection(empty, 'empty');
  }
  return html;
}

// 构建一个区域（使用中 or 已用完）的所有行
function _buildSection(items, section) {
  if (!items.length) return '';

  // 区域标题行
  const isActive = section === 'active';
  const sectionLabel = isActive
    ? `<span style="color:var(--text-primary);font-weight:600">使用中</span> <span style="color:var(--text-muted);font-size:12px">· ${items.length} 卷</span>`
    : `<span style="color:var(--text-muted);font-weight:600">已用完</span> <span style="color:var(--text-muted);font-size:12px">· ${items.length} 卷</span>`;

  let html = `
    <tr class="section-header-row">
      <td colspan="6">
        <div class="section-label">${sectionLabel}</div>
      </td>
    </tr>`;

  // 分组
  const groups = {};
  items.forEach(item => {
    const key = `${item.brand}||${item.type}||${item.colorName}||${item.color}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  Object.entries(groups).forEach(([key, groupItems], gIdx) => {
    const rep = groupItems[0];
    const totalRemaining = groupItems.reduce((s, i) => s + i.remainingWeight, 0);
    const totalOrig = groupItems.reduce((s, i) => s + i.spoolWeight, 0);
    const spoolCount = groupItems.length;
    const groupId = `group-${section}-${gIdx}`;
    const hasMultiple = spoolCount > 1;

    html += `
      <tr class="group-row${!isActive ? ' group-row-empty' : ''}" id="${groupId}-header">
        <td>
          <div class="filament-cell">
            ${renderSwatch(rep.color)}
            <div>
              <div class="filament-name">${rep.colorName} <span class="filament-meta">丨 ${rep.brand}</span></div>
              ${!hasMultiple
                ? `<div class="filament-meta">${groupItems[0].addedDate}</div>`
                : `<div class="filament-meta">最早入库于 ${groupItems.map(i => i.addedDate).sort()[0]}</div>`
              }
            </div>
          </div>
        </td>
        <td><span class="badge ${getTypeBadgeClass(rep.type)}">${rep.type}</span></td>
        <td style="min-width:140px">
          ${renderProgressBar(parseFloat(totalRemaining.toFixed(2)), totalOrig)}
        </td>
        <td class="col-date" style="font-size:12px;color:var(--text-muted)">共 <b>${spoolCount}</b> 卷</td>
        <td class="col-notes"></td>
        <td>
          ${hasMultiple
            ? `<button class="expand-btn" onclick="toggleGroup('${groupId}', this)">
                <span class="expand-icon">▶</span> 展开
               </button>`
            : `<div class="inline-use-form">
                <input type="number" placeholder="克数" min="0.1" step="0.1"
                  id="use-${groupItems[0].id}"
                  style="width:78px;padding:5px 8px;font-size:12px;border:1px solid var(--input-border);border-radius:6px;font-family:var(--font-mono)"/>
                <button class="btn btn-danger btn-sm" onclick="handleUse('${groupItems[0].id}')">消耗</button>
                <button class="btn btn-success btn-sm" onclick="handleReturn('${groupItems[0].id}')">退回</button>
                <button class="btn btn-icon btn-sm" title="编辑" onclick="openEditInventoryModal('${groupItems[0].id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn btn-icon btn-sm" title="删除"
                  onclick="handleDeleteInventory('${groupItems[0].id}','${(rep.brand + ' ' + rep.type + ' ' + rep.colorName).replace(/'/g, "\\'")}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>`
          }
        </td>
      </tr>`;

    // 子行
    if (hasMultiple) {
      [...groupItems].sort((a, b) => a.addedDate.localeCompare(b.addedDate)).forEach((item, idx) => {
        html += `
          <tr class="child-row hidden" id="${groupId}-child">
            <td>
              <div class="filament-cell">
                <span class="spool-index">${idx + 1}</span>
                <span style="font-size:12px;color:var(--text-muted)">入库 ${item.addedDate}</span>
              </div>
            </td>
            <td></td>
            <td style="min-width:140px">${renderProgressBar(item.remainingWeight, item.spoolWeight)}</td>
            <td class="col-date" style="font-size:12px;color:var(--text-muted)">${item.notes || '—'}</td>
            <td class="col-notes"></td>
            <td>
              <div class="inline-use-form">
                <input type="number" placeholder="克数" min="0.1" step="0.1"
                  id="use-${item.id}"
                  style="width:78px;padding:5px 8px;font-size:12px;border:1px solid var(--input-border);border-radius:6px;font-family:var(--font-mono)"/>
                <button class="btn btn-danger btn-sm" onclick="handleUse('${item.id}')">消耗</button>
                <button class="btn btn-success btn-sm" onclick="handleReturn('${item.id}')">退回</button>
                <button class="btn btn-icon btn-sm" title="编辑" onclick="openEditInventoryModal('${item.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn btn-icon btn-sm" title="删除"
                  onclick="handleDeleteInventory('${item.id}','${(rep.brand + ' ' + rep.type + ' ' + rep.colorName + ' #' + (idx + 1)).replace(/'/g, "\\'")}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>`;
      });
    }
  });

  return html;
}
function _refreshWhTable() {
  const inv = getInventory(); const filtered = _filterInv(inv);
  const tbody = document.getElementById('wh-body'); if (tbody) tbody.innerHTML = _buildWhRows(filtered);
  const sub = document.getElementById('wh-subtitle'); // 计算合并后的分组数（key = brand+type+colorName+color）
const groupCount = new Set(filtered.map(i=>`${i.brand}||${i.type}||${i.colorName}||${i.color}`)).size;
if(sub)sub.textContent=`共${inv.length}卷，${groupCount}种规格，显示${filtered.length}条`;;
}

function handleUse(id) {
  const input = document.getElementById(`use-${id}`); const g = parseFloat(input.value);
  if (!g || g <= 0) { showToast('请输入消耗克数', 'warning'); return; }
  const r = useFilament(id, g);
  if (r.ok) { showToast(`消耗${g}g，剩余${r.remaining}g`, 'success'); input.value = ''; _refreshWhTable(); }
  else showToast(r.msg, 'danger');
}

function handleReturn(id) {
  const input = document.getElementById(`use-${id}`); const g = parseFloat(input.value);
  if (!g || g <= 0) { showToast('请输入退回克数', 'warning'); return; }
  const r = returnFilament(id, g);
  if (r.ok) { showToast(`退回${g}g，剩余${r.remaining}g`, 'success'); input.value = ''; _refreshWhTable(); }
  else showToast(r.msg, 'danger');
}

function handleDeleteInventory(id, name) {
  confirmModal(`确定要从仓库删除"${name}"吗？此操作不可撤销。`, () => {
    deleteInventoryItem(id); showToast('已删除', 'success'); renderWarehouse();
  });
}

/**
 * 展开/折叠分组子行
 */
function toggleGroup(groupId, btn) {
  const children = document.querySelectorAll(`#${groupId}-child`); // 注意：同 id 的多个元素
  // 由于多行共用同一 id（不规范但实用），用 querySelectorAll 获取所有
  const allChildren = document.querySelectorAll(`tr[id="${groupId}-child"]`);
  const isExpanded = btn.dataset.expanded === 'true';

  allChildren.forEach(row => row.classList.toggle('hidden', isExpanded));

  btn.dataset.expanded = isExpanded ? '' : 'true';
  btn.innerHTML = isExpanded
    ? '<span class="expand-icon">▶</span> 展开'
    : '<span class="expand-icon">▼</span> 收起';
}

function openEditInventoryModal(id) {
  const inv = getInventory();
  const item = inv.find(i => i.id === id);
  if (!item) return;

  openModal('编辑耗材', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">品牌</label>
        <input class="form-input" id="ei-brand" value="${item.brand}"/>
      </div>
      <div class="form-group">
        <label class="form-label">类型</label>
        <input class="form-input" id="ei-type" value="${item.type}" list="ei-type-list"/>
        <datalist id="ei-type-list">
          <option value="PLA"><option value="PLA+"><option value="PETG"><option value="PETG+">
          <option value="ABS"><option value="ASA"><option value="TPU"><option value="PA">
          <option value="PA-CF"><option value="PC"><option value="其他">
        </datalist>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">颜色名称</label>
        <input class="form-input" id="ei-colorName" value="${item.colorName}"/>
      </div>
      <div class="form-group">
        <label class="form-label">颜色</label>
        <div class="color-input-wrap">
          <div class="color-preview" id="ei-cprev" style="background:${item.color}"></div>
          <input type="color" id="ei-color" value="${item.color}"
            oninput="document.getElementById('ei-cprev').style.background=this.value;document.getElementById('ei-color-hex').value=this.value"/>
          <input class="form-input" id="ei-color-hex" value="${item.color}"
            placeholder="#ffffff" maxlength="7"
            style="width:92px;font-family:var(--font-mono);font-size:13px;padding:6px 8px"
            oninput="
              const h=this.value.trim();
              const hex=h.startsWith('#')?h:'#'+h;
              if(/^#[0-9a-fA-F]{6}$/.test(hex)){
                document.getElementById('ei-color').value=hex;
                document.getElementById('ei-cprev').style.background=hex;
              }"/>
        </div>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">满卷克重（g）</label>
        <input class="form-input" type="number" id="ei-spoolWeight" min="1" value="${item.spoolWeight}"/>
      </div>
      <div class="form-group">
        <label class="form-label">当前剩余量（g）</label>
        <input class="form-input" type="number" id="ei-remaining" min="0" step="0.1" value="${item.remainingWeight}"/>
        <div class="form-hint">不能超过满卷克重</div>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">入库日期</label>
        <input class="form-input" type="date" id="ei-date" value="${item.addedDate}"/>
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input class="form-input" id="ei-notes" value="${item.notes||''}"/>
      </div>
    </div>
  `, [
    { label: '取消', cls: 'btn-secondary', onClick: closeModal },
    { label: '保存', cls: 'btn-primary', onClick: () => {
      const brand      = document.getElementById('ei-brand').value.trim();
      const type       = document.getElementById('ei-type').value.trim();
      const colorName  = document.getElementById('ei-colorName').value.trim();
      const hexVal     = document.getElementById('ei-color-hex').value.trim();
      const color      = /^#[0-9a-fA-F]{6}$/.test(hexVal) ? hexVal : document.getElementById('ei-color').value;
      const spoolWeight  = parseFloat(document.getElementById('ei-spoolWeight').value);
      const remaining    = parseFloat(document.getElementById('ei-remaining').value);
      const addedDate    = document.getElementById('ei-date').value;
      const notes        = document.getElementById('ei-notes').value.trim();

      if (!brand)              return showToast('请填写品牌', 'warning');
      if (!type)               return showToast('请填写类型', 'warning');
      if (!colorName)          return showToast('请填写颜色名称', 'warning');
      if (!spoolWeight || spoolWeight <= 0) return showToast('请填写有效的满卷克重', 'warning');
      if (isNaN(remaining) || remaining < 0) return showToast('剩余量不能为负数', 'warning');
      if (remaining > spoolWeight) return showToast(`剩余量不能超过满卷克重（${spoolWeight}g）`, 'warning');

      updateInventoryItem(id, { brand, type, colorName, color, spoolWeight, remainingWeight: remaining, addedDate, notes });

      // 记录编辑日志，列出所有发生变化的字段
      const changes = [];
      if (item.brand !== brand)                         changes.push(`品牌 ${item.brand}→${brand}`);
      if (item.type !== type)                           changes.push(`类型 ${item.type}→${type}`);
      if (item.colorName !== colorName)                 changes.push(`颜色 ${item.colorName}→${colorName}`);
      if (item.spoolWeight !== spoolWeight)             changes.push(`满卷克重 ${item.spoolWeight}g→${spoolWeight}g`);
      if (item.remainingWeight !== remaining)           changes.push(`剩余量 ${item.remainingWeight}g→${remaining}g`);
      if (item.addedDate !== addedDate)                 changes.push(`入库日期 ${item.addedDate}→${addedDate}`);
      if ((item.notes||'') !== notes)                   changes.push(`备注已更新`);
      
      addLogEntry({
        inventoryId: id,
        brand, type, colorName, color,
        amount: 0,
        action: 'edit',
        note: changes.length ? changes.join('；') : '无变更'
      });
      
      closeModal();
      showToast('已保存', 'success');
      renderWarehouse();
    }}
  ]);
}