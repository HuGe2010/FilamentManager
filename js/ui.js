/**
 * ui.js - 通用UI工具：Toast通知、Modal弹窗、渲染辅助函数
 */

// ---- Toast ----
function showToast(msg, type='', duration=2500) {
  const c=document.getElementById('toast-container');
  const t=document.createElement('div'); t.className=`toast ${type}`;
  const icons={success:'✓',danger:'✕',warning:'⚠'};
  t.innerHTML=(icons[type]?`<span>${icons[type]}</span>`:'')+msg;
  c.appendChild(t);
  setTimeout(()=>{ t.style.animation='fadeOut 0.2s ease forwards'; setTimeout(()=>t.remove(),200); }, duration);
}

// ---- Modal ----
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e=>{ if(e.target===e.currentTarget)closeModal(); });

function openModal(title, bodyHTML, buttons=[]) {
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=bodyHTML;
  const footer=document.getElementById('modal-footer'); footer.innerHTML='';
  if(buttons.length===0) buttons=[{label:'关闭',cls:'btn-secondary',onClick:closeModal}];
  buttons.forEach(({label,cls,onClick})=>{
    const btn=document.createElement('button'); btn.className=`btn ${cls||'btn-secondary'}`;
    btn.textContent=label; btn.addEventListener('click',onClick); footer.appendChild(btn);
  });
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

function confirmModal(msg, onConfirm) {
  openModal('确认操作',`<p style="font-size:14px;line-height:1.7">${msg}</p>`,[
    {label:'取消',cls:'btn-secondary',onClick:closeModal},
    {label:'确认',cls:'btn-danger',onClick:()=>{closeModal();onConfirm();}}
  ]);
}

// ---- 渲染辅助 ----
const TYPE_BADGE_MAP={
  'PLA':'badge-pla','PLA+':'badge-pla','PETG':'badge-petg','PETG+':'badge-petg',
  'ABS':'badge-abs','ASA':'badge-asa','TPU':'badge-tpu','PA':'badge-pa',
  'PA-CF':'badge-pa','PC':'badge-pc'
};
function getTypeBadgeClass(type){ return TYPE_BADGE_MAP[type]||'badge-other'; }

function renderProgressBar(remaining, total) {
  const pct=total>0?Math.round(remaining/total*100):0;
  const cls=pct<20?'low':(pct<40?'warn':'');
  return `<div class="progress-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill ${cls}" style="width:${pct}%"></div></div><span class="progress-text">${remaining}g / ${total}g (${pct}%)</span></div>`;
}

function renderSwatch(color) {
  return `<div class="color-swatch" style="background:${color}"></div>`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}

const FILAMENT_TYPES=['PLA','PLA+','PETG','PETG+','ABS','ASA','TPU','PA','PA-CF','PC','其他'];
function renderTypeOptions(sel='') {
  return FILAMENT_TYPES.map(t=>`<option value="${t}"${t===sel?' selected':''}>${t}</option>`).join('');
}
