/**
 * pages/data-manage.js - 数据管理页（导出/导入/重置）
 */
function renderDataManage(){
  const d=getData();
  const pc=(d.presets||[]).length, ic=(d.inventory||[]).length, lc=(d.usageLog||[]).length;
  const sz=(JSON.stringify(d).length/1024).toFixed(1);
  document.getElementById('page-container').innerHTML=`
    <div class="page-header"><div class="page-title">数据管理</div><div class="page-subtitle">备份、恢复、导入导出数据</div></div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">当前数据摘要</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:8px">
        ${[['预设条数',pc,'条'],['库存卷数',ic,'卷'],['操作日志',lc,'条'],['数据大小',sz,'KB']].map(([l,v,u])=>`
        <div style="text-align:center;padding:12px;background:#fafafa;border-radius:8px;border:1px solid var(--card-border)">
          <div style="font-family:var(--font-mono);font-size:22px;font-weight:600">${v}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${l}（${u}）</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="data-section">
      <div class="data-card">
        <div class="data-card-title">📥 导出备份</div>
        <div class="data-card-desc">将全部数据（预设、库存、日志）导出为 JSON 文件保存到本地。建议定期备份。</div>
        <button class="btn btn-primary" onclick="handleExport()">导出 JSON 备份文件</button>
      </div>
      <div class="data-card">
        <div class="data-card-title">📤 导入备份（覆盖）</div>
        <div class="data-card-desc"><strong>注意：此操作会覆盖当前全部数据。</strong>建议导入前先导出当前备份。</div>
        <input type="file" id="imp-overwrite" accept=".json" style="display:none" onchange="handleImportFile(this,false)"/>
        <button class="btn btn-secondary" onclick="document.getElementById('imp-overwrite').click()">选择文件（覆盖导入）</button>
      </div>
      <div class="data-card">
        <div class="data-card-title">🔀 导入备份（合并）</div>
        <div class="data-card-desc">以 ID 去重的方式合并数据，不会删除现有内容。适合多设备同步。</div>
        <input type="file" id="imp-merge" accept=".json" style="display:none" onchange="handleImportFile(this,true)"/>
        <button class="btn btn-secondary" onclick="document.getElementById('imp-merge').click()">选择文件（合并导入）</button>
      </div>
      <div class="data-card" style="border-color:#fca5a5">
        <div class="data-card-title" style="color:var(--danger)">⚠ 重置全部数据</div>
        <div class="data-card-desc">清空全部库存和日志，恢复内置默认预设。此操作不可撤销，请先导出备份！</div>
        <button class="btn btn-danger" onclick="handleReset()">重置全部数据</button>
      </div>
      <div class="data-card" style="background:#fafafa">
        <div class="data-card-title">ℹ 关于数据存储</div>
        <div class="data-card-desc">
          本应用使用浏览器 <code style="font-family:var(--font-mono);background:#e4e4e7;padding:1px 5px;border-radius:3px">localStorage</code> 存储数据。
          关闭/刷新页面数据不会丢失。<br><br>
          ⚠ 清除浏览器数据、使用隐私/无痕模式、换用其他浏览器时数据可能丢失。<strong>请定期点击"导出备份"。</strong>
        </div>
      </div>
    </div>`;
}

function handleExport(){ exportJSON(); showToast('备份文件已开始下载','success'); }

async function handleImportFile(input,merge){
  const file=input.files[0]; if(!file)return;
  const r=await importJSON(file,merge);
  input.value='';
  if(r.ok){ showToast(r.msg,'success'); renderDataManage(); }
  else showToast('导入失败：'+r.msg,'danger');
}

function handleReset(){
  confirmModal('确定重置全部数据？这将清空所有库存和日志，恢复内置预设。不可撤销！',()=>{
    resetAllData(); showToast('数据已重置','success'); renderDataManage();
  });
}
