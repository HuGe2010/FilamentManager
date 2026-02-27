/**
 * storage.js - 数据存储层
 * 使用 localStorage 持久化，提供 JSON 导出/导入功能。
 * 关闭页面后数据不丢失。需要备份时使用"数据管理"页面导出 JSON 文件。
 */

const STORAGE_KEY = 'filamgr_data';

// 默认数据（首次启动时写入）
const DEFAULT_DATA = {
  version: 1,
  presets: [
    { id: 'p1', brand: 'Bambu Lab', type: 'PLA',  colorName: '白色', color: '#f5f5f0', spoolWeight: 1000, notes: '' },
    { id: 'p2', brand: 'Bambu Lab', type: 'PLA',  colorName: '黑色', color: '#222222', spoolWeight: 1000, notes: '' },
    { id: 'p3', brand: 'Bambu Lab', type: 'PETG', colorName: '透明', color: '#e0f0f8', spoolWeight: 1000, notes: '' },
    { id: 'p4', brand: 'eSUN',      type: 'PLA+', colorName: '红色', color: '#e63946', spoolWeight: 1000, notes: '' },
    { id: 'p5', brand: 'eSUN',      type: 'PLA+', colorName: '蓝色', color: '#457b9d', spoolWeight: 1000, notes: '' },
    { id: 'p6', brand: 'Polymaker', type: 'PETG', colorName: '灰色', color: '#9b9b9b', spoolWeight: 1000, notes: '' },
    { id: 'p7', brand: 'Polymaker', type: 'TPU',  colorName: '黑色', color: '#2d2d2d', spoolWeight: 500,  notes: '弹性材料' },
    { id: 'p8', brand: 'Overture',  type: 'ABS',  colorName: '白色', color: '#faf9f6', spoolWeight: 1000, notes: '' },
  ],
  inventory: [],
  usageLog: []
};

function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
    return JSON.parse(raw);
  } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
  catch(e) { console.error('[Storage] 保存失败:', e); return false; }
}

function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) saveData(DEFAULT_DATA);
}

// ---- 预设 ----
function getPresets() { return getData().presets || []; }
function addPreset(p) { const d=getData(); p.id=generateId(); d.presets.push(p); saveData(d); return p; }
function updatePreset(id, upd) { const d=getData(); const i=d.presets.findIndex(p=>p.id===id); if(i<0)return false; d.presets[i]={...d.presets[i],...upd}; saveData(d); return true; }
function deletePreset(id) { const d=getData(); d.presets=d.presets.filter(p=>p.id!==id); saveData(d); }

// ---- 仓库库存 ----
function getInventory() { return getData().inventory || []; }

function addToInventory(preset, quantity=1) {
  const d = getData();
  const added = [];
  for(let i=0;i<quantity;i++){
    const item = {
      id: generateId(),
      brand: preset.brand, type: preset.type,
      colorName: preset.colorName, color: preset.color,
      spoolWeight: preset.spoolWeight,
      remainingWeight: preset.spoolWeight,
      addedDate: new Date().toISOString().slice(0,10),
      notes: preset.notes||''
    };
    d.inventory.push(item);
    added.push(item);
    logUsage(d, { inventoryId:item.id, brand:item.brand, type:item.type, colorName:item.colorName, color:item.color, amount:item.spoolWeight, action:'add', note:'入库' });
  }
  saveData(d);
  return added;
}

function useFilament(id, grams) {
  const d=getData(); const item=d.inventory.find(i=>i.id===id);
  if(!item) return {ok:false,msg:'找不到该耗材'};
  if(grams<=0) return {ok:false,msg:'请输入有效克数'};
  if(grams>item.remainingWeight) return {ok:false,msg:`超过剩余量(${item.remainingWeight}g)`};
  item.remainingWeight=parseFloat((item.remainingWeight-grams).toFixed(2));
  logUsage(d,{inventoryId:id,brand:item.brand,type:item.type,colorName:item.colorName,color:item.color,amount:grams,action:'use',note:''});
  saveData(d); return {ok:true,remaining:item.remainingWeight};
}

function returnFilament(id, grams) {
  const d=getData(); const item=d.inventory.find(i=>i.id===id);
  if(!item) return {ok:false,msg:'找不到该耗材'};
  if(grams<=0) return {ok:false,msg:'请输入有效克数'};
  if(item.remainingWeight+grams>item.spoolWeight) return {ok:false,msg:`超过满卷重量(${item.spoolWeight}g)`};
  item.remainingWeight=parseFloat((item.remainingWeight+grams).toFixed(2));
  logUsage(d,{inventoryId:id,brand:item.brand,type:item.type,colorName:item.colorName,color:item.color,amount:grams,action:'return',note:''});
  saveData(d); return {ok:true,remaining:item.remainingWeight};
}

function updateInventoryItem(id, upd) {
  const d=getData(); const i=d.inventory.findIndex(x=>x.id===id);
  if(i<0)return false; d.inventory[i]={...d.inventory[i],...upd}; saveData(d); return true;
}

function deleteInventoryItem(id) {
  const d=getData(); d.inventory=d.inventory.filter(i=>i.id!==id); saveData(d);
}

// ---- 日志 ----
function getUsageLog() { return (getData().usageLog||[]).slice().reverse(); }
function logUsage(data, entry) {
  if(!data.usageLog) data.usageLog=[];
  data.usageLog.push({ id:generateId(), ...entry, date:new Date().toISOString() });
}
function clearUsageLog() { const d=getData(); d.usageLog=[]; saveData(d); }

// ---- 统计 ----
function getStats() {
  const inv = getInventory();
  const totalSpools = inv.length;
  const totalWeight = inv.reduce((s,i)=>s+i.remainingWeight, 0);
  const totalOrigWeight = inv.reduce((s,i)=>s+i.spoolWeight, 0);
  const usedWeight = totalOrigWeight - totalWeight;
  const byType={}, byBrand={};
  inv.forEach(i=>{ byType[i.type]=(byType[i.type]||0)+1; byBrand[i.brand]=(byBrand[i.brand]||0)+1; });
  const lowStock = inv.filter(i=>i.remainingWeight/i.spoolWeight<0.2);
  return { totalSpools, totalWeight, totalOrigWeight, usedWeight, byType, byBrand, lowStock };
}

// ---- 导出/导入 ----
function exportJSON() {
  const json = JSON.stringify(getData(), null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=`filamgr-${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file, merge=false) {
  return new Promise(resolve=>{
    const r=new FileReader();
    r.onload=e=>{
      try {
        const imp = JSON.parse(e.target.result);
        if(!imp.presets||!imp.inventory) return resolve({ok:false,msg:'格式不正确'});
        if(merge){
          const cur=getData();
          const ep=new Set(cur.presets.map(p=>p.id)), ei=new Set(cur.inventory.map(i=>i.id));
          imp.presets.forEach(p=>{if(!ep.has(p.id))cur.presets.push(p);});
          imp.inventory.forEach(i=>{if(!ei.has(i.id))cur.inventory.push(i);});
          if(imp.usageLog){const el=new Set(cur.usageLog.map(l=>l.id)); imp.usageLog.forEach(l=>{if(!el.has(l.id))cur.usageLog.push(l);});}
          saveData(cur);
        } else { saveData(imp); }
        resolve({ok:true,msg:merge?'合并成功':'导入成功'});
      } catch(err){ resolve({ok:false,msg:'解析失败:'+err.message}); }
    };
    r.onerror=()=>resolve({ok:false,msg:'读取失败'}); r.readAsText(file,'utf-8');
  });
}

function resetAllData() { saveData(JSON.parse(JSON.stringify(DEFAULT_DATA))); }

// ---- 工具 ----
function generateId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

initStorage();
