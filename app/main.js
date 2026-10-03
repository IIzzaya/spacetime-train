import { ITEMS, RECIPES, ROUTES, initial, restore, transfer, feed, collect, consume, equip, tick, start, expeditionStep } from './engine.js';
const $ = id => document.getElementById(id);
const KEY = 'spacetime-train-prototype-v1';
let storageOK = true, saved = null;
try { saved = localStorage.getItem(KEY); } catch { storageOK = false; }
let state = restore(saved) || initial();
let journeyElapsed = 0, toastTimer;
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; } catch { storageOK = false; } $('save-status').textContent = storageOK ? '自动保存于此浏览器' : '存储不可用 · 进度仅保留到页面关闭'; }
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3000); }
function node(tag, className, text) { const e = document.createElement(tag); if (className) e.className = className; if (text !== undefined) e.textContent = text; return e; }
function renderGrid(key) {
  const g = state[key], root = $(key + '-grid'); root.replaceChildren(); root.style.setProperty('--cols', g.w); root.style.setProperty('--rows', g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const cell = node('div', 'cell'); cell.style.gridColumn = x + 1; cell.style.gridRow = y + 1; cell.setAttribute('aria-hidden', 'true'); root.append(cell); }
  for (const item of g.items) {
    const d = ITEMS[item.type], button = node('button', `item ${d.color}`);
    button.style.gridColumn = `${item.x + 1} / span ${d.w}`; button.style.gridRow = `${item.y + 1} / span ${d.h}`;
    button.append(node('span', 'icon', d.icon), node('span', 'item-label', d.name)); button.title = `${d.name} · ${d.w} × ${d.h}`;
    button.setAttribute('aria-label', `${key === 'bag' ? '背包' : '仓库'}：${d.name}，${d.w}乘${d.h}格`);
    button.disabled = state.phase === 'expedition'; button.addEventListener('click', () => itemDialog(key, item.id)); root.append(button);
  }
}
function itemDialog(key, id) {
  if (state.phase === 'expedition') return;
  const item = state[key].items.find(i => i.id === id); if (!item) return;
  const d = ITEMS[item.type]; $('item-name').textContent = d.name; $('item-info').textContent = `${d.w} × ${d.h} 格 · ${d.info}`;
  const actions = $('item-actions'); actions.replaceChildren();
  function action(label, run) { const b = node('button', '', label); b.onclick = () => { const ok = run(); if (ok) { $('item-dialog').close(); render(); save(); } else toast('空间不足或当前无法执行，物品保持原位。'); }; actions.append(b); }
  action(key === 'bag' ? '转移到主仓库' : '装入出行背包', () => transfer(state, key, id));
  if (['water', 'potato'].includes(item.type)) action('立即使用', () => state.phase !== 'expedition' && consume(state, key, id));
  if (key === 'warehouse' && (item.type === 'knife' && !state.weapon || item.type === 'backpack' && !state.pack)) action('装备', () => equip(state, id));
  $('item-dialog').showModal();
}
function renderVitals() {
  $('vitals').replaceChildren();
  for (const [key, label] of [['hp', '生命'], ['food', '饱食'], ['hydration', '补水']]) {
    const box = node('div', 'vital'); const head = node('div', 'vital-header'); head.append(node('span', '', label), node('b', '', `${Math.ceil(state[key])} / 100`));
    const meter = node('div', `meter ${key} ${state[key] < 30 ? 'low' : ''}`), fill = node('div'); fill.style.width = state[key] + '%'; meter.append(fill); box.append(head, meter); $('vitals').append(box);
  }
  const secs = Math.floor(state.clock); $('clock').textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
}
function renderMachines() {
  const focused = document.activeElement;
  const focusFeed = focused?.dataset?.feed, focusCollect = focused?.dataset?.collect;
  $('machines').replaceChildren();
  for (const [key, r] of Object.entries(RECIPES)) {
    const m = state.machines[key], box = node('div', 'machine');
    const title = node('div', 'machine-title'), detail = node('div'); detail.append(node('strong', '', r.name), node('small', '', `1 ${ITEMS[r.input].name} → ${r.count} ${ITEMS[r.output].name}`)); title.append(node('span', 'machine-icon', key === 'farm' ? '✦' : '◈'), detail);
    const flow = node('div', 'machine-flow'); for (const [name, count, capacity] of [['输入区', m.input, 3], ['输出区', m.output, 6]]) { const e = node('span', '', name); e.append(node('b', '', `${count} / ${capacity}`)); flow.append(e); }
    const progress = node('div', 'progress'), fill = node('div'); fill.style.width = `${m.progress / r.duration * 100}%`; progress.append(fill);
    const status = node('div', 'machine-status', !m.input ? '等待手动投料' : m.output + r.count > 6 ? '输出已满，等待领取' : `加工中 · 还需 ${Math.ceil(r.duration - m.progress)} 游戏秒`);
    const controls = node('div', 'machine-actions'), input = node('button', '', '投入 1 份原料'), output = node('button', '', '领取 1 个产物');
    input.dataset.feed = key; output.dataset.collect = key;
    input.disabled = state.phase === 'expedition' || m.input >= 3 || !state.warehouse.items.some(i => i.type === r.input); output.disabled = state.phase === 'expedition' || !m.output;
    input.onclick = () => { if (feed(state, key)) { render(); save(); toast('原料已移入机器输入区。'); } };
    output.onclick = () => { if (collect(state, key)) { render(); save(); toast('产物已转移到主仓库。'); } else toast('仓库没有足够空间，产物保留在机器内。'); };
    controls.append(input, output); box.append(title, flow, progress, status, controls); $('machines').append(box);
    if (focusFeed === key && !input.disabled) input.focus({ preventScroll: true });
    if (focusCollect === key && !output.disabled) output.focus({ preventScroll: true });
  }
}
function renderLog() {
  const root = $('log'), atBottom = root.scrollHeight - root.scrollTop - root.clientHeight < 45; root.replaceChildren();
  if (!state.log.length) root.append(node('div', 'empty-log', '车厢里很安静。补给已装入背包，选择一个目的地，开始你的第一次探索。'));
  for (const e of state.log) root.append(node('div', `log-entry ${e.kind}`, e.text));
  if (atBottom || state.phase === 'expedition') root.scrollTop = root.scrollHeight;
}
function render() {
  const active = state.phase === 'expedition'; $('prep').hidden = active; $('journey').hidden = !active; $('where').textContent = active ? '探索中 · ' + ROUTES[state.route].name : '停靠中 · 生存舱';
  $('route').value = state.route; $('route-name').textContent = ROUTES[state.route].name; $('route-description').textContent = ROUTES[state.route].subtitle;
  $('equipment').replaceChildren(node('span', '', state.weapon ? '╱ 旧猎刀已装备' : '╱ 未装备武器'), node('span', '', state.pack ? '▣ 帆布背包已装备' : '▣ 临时口袋 · 2 × 2'));
  $('bag-title').textContent = state.pack ? '帆布背包' : '临时口袋'; $('bag-size').textContent = `${state.bag.w} × ${state.bag.h} · ${active ? '途中不可操作' : '手动转移'}`;
  $('runs').textContent = `已完成 ${state.runs} 次`; $('log-title').textContent = state.result || '行程记录';
  $('progress-label').textContent = `${state.step} / 6`; $('journey-progress').style.width = `${state.step / 6 * 100}%`;
  $('step-prep').className = !active && !state.result ? 'active' : ''; $('step-exp').className = active ? 'active' : ''; $('step-loot').className = !active && state.result ? 'active' : '';
  renderVitals(); renderGrid('bag'); renderGrid('warehouse'); renderMachines(); renderLog();
}
$('route').onchange = e => { state.route = e.target.value; render(); save(); };
$('depart').onclick = () => { if (start(state, $('route').value)) { journeyElapsed = 0; render(); save(); } };
$('help').onclick = () => $('help-dialog').showModal(); $('reset').onclick = () => $('reset-dialog').showModal(); $('cancel-reset').onclick = () => $('reset-dialog').close();
$('confirm-reset').onclick = () => { state = initial(); journeyElapsed = 0; $('reset-dialog').close(); render(); save(); toast('已恢复初始状态。'); };
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
let last = performance.now();
setInterval(() => {
  const now = performance.now(), dt = Math.min(1.5, (now - last) / 1000); last = now;
  if (document.hidden) return;
  if (state.phase === 'expedition') { journeyElapsed += dt; if (journeyElapsed >= 2.5) { journeyElapsed = 0; expeditionStep(state); render(); save(); } }
  else { tick(state, dt); renderVitals(); renderMachines(); save(); }
}, 500);
document.addEventListener('visibilitychange', () => { last = performance.now(); save(); });
render(); save();
if (saved && !restore(saved)) toast('原存档无法读取，已安全恢复初始状态。');
