'use strict';
// Restored focus keeps keyboard navigation in place without marking a clicked card.
document.addEventListener('keydown', event => {
  if (event.key === 'Tab') document.documentElement.dataset.keyboardNavigation = 'true';
}, {capture:true});
document.addEventListener('pointerdown', () => {
  delete document.documentElement.dataset.keyboardNavigation;
}, {capture:true});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionAnimations = new Set();
const elementMotion = new WeakMap();
function animateUI(element, frames, duration = 220) {
  if (!element || reducedMotion.matches || !element.animate) return;
  elementMotion.get(element)?.cancel();
  const animation = element.animate(frames, {duration, easing: 'cubic-bezier(.2,.75,.25,1)'});
  elementMotion.set(element, animation);
  motionAnimations.add(animation);
  const cleanup = () => motionAnimations.delete(animation);
  animation.addEventListener('finish', cleanup, {once:true});
  animation.addEventListener('cancel', cleanup, {once:true});
}
function enterContent(element, direction = 1, distance = 24) {
  animateUI(element, [
    {opacity: .35, translate: `${direction * distance}px 0`},
    {opacity: 1, translate: '0 0'},
  ]);
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) motionAnimations.forEach(animation => animation.cancel());
});
// Delegation also covers controls created when a history or filter is rendered.
document.addEventListener('click', event => {
  const control = event.target.closest('button, a[href], summary, input, select, textarea, [role="button"], .filter-option');
  if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
  const surface = control.closest('.filter-option, .search') || control;
  animateUI(surface, [{scale: '.97', filter: 'brightness(.94)'}, {scale: '1', filter: 'brightness(1)'}], 160);
}, {capture:true});
// Isolated frontend fixture data. No staging or backend requests.
const products = [
  {name:'LED chiroq 12W',barcode:'DEMO-001',category:'Yoritish',quantity:5,unit:'dona',currency:'UZS',price:8000,branch:'Namuna filial',status:'low'},
  {name:'Sement M400',barcode:'DEMO-002',category:'Qurilish',quantity:120,unit:'qop',currency:'UZS',price:70000,branch:'Namuna filial',status:'ok'},
  {name:'PPR quvur 20 mm — issiq va sovuq suv uchun, shisha tolasi bilan mustahkamlangan uzun nomli mahsulot',barcode:'DEMO-003',category:'Santexnika',quantity:3500,unit:'metr',currency:'UZS',price:1300,branch:'Namuna filial',status:'ok'},
  {name:'PPR Fiber 25',barcode:'DEMO-004',category:'Santexnika',quantity:0,unit:'metr',currency:'UZS',price:12000,branch:'Namuna filial',status:'zero'},
  {name:'Elektr generatori 8 kW',barcode:'DEMO-005',category:'Uskunalar',quantity:12,unit:'dona',currency:'USD',price:750.5,branch:'Ikkinchi namuna filial',status:'ok'},
  {name:'Sanoat uskunasi — PRO 2400',barcode:'DEMO-006',category:'Uskunalar',quantity:99,unit:'dona',currency:'UZS',price:12500000,branch:'Ikkinchi namuna filial',status:'ok'}
];
// Purchase history is also synthetic; no Store records are copied here.
const purchases = products.flatMap((product, index) => {
  if (product.quantity === 0) return [];
  const remaining = Math.ceil(product.quantity * 0.6);
  return [
    {id: `${product.barcode}-01`, product: product.barcode, date: '2026-10-05', time: '14:30', quantity: remaining + 10, remaining, currency: product.currency, cost: product.price, sale: product.price * 1.2, order: 'NAM-1001', warehouse: 'Namuna ombor', supplier: index === 2 ? 'Qurilish va santexnika mahsulotlari ta’minoti — uzun nomli namuna tashkilot' : 'Namuna ta’minotchi', type: 'Zayavka orqali'},
    {id: `${product.barcode}-02`, product: product.barcode, date: '2026-09-24', time: '09:15', quantity: product.quantity - remaining + 5, remaining: product.quantity - remaining, currency: product.currency, cost: product.price, sale: product.price * 1.2, order: '—', warehouse: 'Ikkinchi namuna ombor', supplier: 'Ikkinchi namuna ta’minotchi', type: 'Zakup orqali'},
    ...(index === 0 ? [{id: `${product.barcode}-03`, product: product.barcode, date: '2026-09-10', time: '11:05', quantity: 20, remaining: 0, currency: 'USD', cost: 0.65, sale: 0.85, order: 'NAM-0998', warehouse: 'Namuna ombor', supplier: 'Namuna ta’minotchi', type: 'Zayavka orqali'}] : []),
  ];
});
// Each history mode uses independent, clearly labelled sample transactions.
const salesHistory = purchases.map((purchase, index) => {
  const quantity = index % 2 ? 3 : 2;
  const total = quantity * purchase.sale;
  return {...purchase, id: `sale-${purchase.id}`, quantity, date: '2026-10-06', time: index % 2 ? '10:20' : '09:10', buyer: purchase.product === 'DEMO-003' ? 'Qurilish loyihalari uchun mahsulot xarid qiluvchi uzun nomli namuna tashkilot' : 'Namuna xaridor', type: index % 2 ? 'Onlayn' : 'Oflayn', total, paid: index % 2 ? total * 0.75 : total};
});
const supplierReturns = purchases.filter(item => item.id.endsWith('-01') || item.currency === 'USD').map(item => ({...item, id: `return-${item.id}`, date: '2026-10-06', time: '11:40', quantity: 1, employee: 'Namuna xodim', reason: item.product === 'DEMO-003' ? 'Qadoq shikastlangan va mahsulot o‘lchami buyurtmada ko‘rsatilgan o‘lchamga mos kelmagan' : 'Yaroqsiz'}));
const salesReturns = salesHistory.filter(item => ['DEMO-001', 'DEMO-003', 'DEMO-006'].includes(item.product) && item.id.endsWith('-01')).map(item => ({...item, id: `refund-${item.id}`, date: '2026-10-06', time: '12:15', quantity: 1, total: item.sale, paid: item.sale}));
const grossHistory = [
  ...salesHistory.map(item => ({...item, id: `gross-${item.id}`, gross: (item.sale - item.cost) * item.quantity, source: 'Sotish'})),
  ...salesReturns.map(item => ({...item, id: `gross-${item.id}`, gross: -(item.sale - item.cost) * item.quantity, source: 'Sotuv bo‘yicha qaytarish'})),
].sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`));
const historyTitles = {purchase: 'Sotib olish', sales: 'Sotish', returns: 'Qaytish', 'sales-return': 'Sotuv bo‘yicha qaytarish', gross: 'Yalpi daromad'};
const historyModes = {
  purchase: {title: historyTitles.purchase, detail: 'Kirim tafsiloti', rows: purchases, fields: purchaseFields, amount: item => item.quantity * item.cost, amountLabel: 'Kirish summasi'},
  gross: {title: historyTitles.gross, detail: 'Daromad tafsiloti', rows: grossHistory, fields: grossFields, amount: item => item.gross, amountLabel: 'Yalpi daromad', party: item => item.supplier, note: 'Yalpi daromad — barcha omborlar bo‘yicha',
    metrics: (product, item) => [['Miqdori', `${format(item.quantity)} ${product.unit}`], ['Sotish narxi', money(item.sale, item.currency)]],
    tags: item => `<span class="status ${item.gross < 0 ? 'zero' : 'ok'}">${item.source}</span>`,
    totals: rows => [['Musbat qiymatlar', rows.reduce((sum, item) => sum + Math.max(item.gross, 0), 0)], ['Manfiy qiymatlar', rows.reduce((sum, item) => sum + Math.min(item.gross, 0), 0)], ['Yalpi daromad', rows.reduce((sum, item) => sum + item.gross, 0)]]},
  'sales-return': {title: historyTitles['sales-return'], detail: 'Savdo qaytishi tafsiloti', rows: salesReturns, fields: saleReturnFields, amount: item => item.total, amountLabel: 'Qaytarish summasi', party: item => item.buyer,
    metrics: (product, item) => [['Qaytarildi', `${format(item.quantity)} ${product.unit}`], ['Qaytarilgan to‘lov', money(item.paid, item.currency)]],
    tags: item => `<span class="history-type">${item.type}</span><span class="status zero">Savdodan qaytish</span>`,
    totals: rows => [['Qaytarish summasi', rows.reduce((sum, item) => sum + item.total, 0)], ['Qaytarilgan to‘lov', rows.reduce((sum, item) => sum + item.paid, 0)]]},
  returns: {title: historyTitles.returns, detail: 'Qaytish tafsiloti', rows: supplierReturns, fields: supplierReturnFields, amount: item => item.quantity * item.cost, amountLabel: 'Qaytarish summasi', party: item => item.supplier,
    metrics: (product, item) => [['Qaytarildi', `${format(item.quantity)} ${product.unit}`], ['Kirish narxi', money(item.cost, item.currency)]],
    tags: item => `<span class="history-reason">Sabab: ${item.reason}</span>`,
    totals: rows => [['Qaytarish summasi', rows.reduce((sum, item) => sum + item.quantity * item.cost, 0)]]},
  sales: {title: historyTitles.sales, detail: 'Savdo tafsiloti', rows: salesHistory, fields: saleFields, amount: item => item.total, amountLabel: 'Jami to‘lov', party: item => item.buyer,
    metrics: (product, item) => [['Miqdori', `${format(item.quantity)} ${product.unit}`], ['To‘langan', money(item.paid, item.currency)]],
    tags: item => `<span class="history-type">${item.type}</span><span class="status ${item.paid < item.total ? 'low' : 'ok'}">${item.paid < item.total ? 'Qisman to‘langan' : 'To‘langan'}</span>`,
    totals: rows => [['Jami to‘lov', rows.reduce((sum, item) => sum + item.total, 0)], ['To‘langan', rows.reduce((sum, item) => sum + item.paid, 0)], ['Qoldiq to‘lov', rows.reduce((sum, item) => sum + item.total - item.paid, 0)]]},
};
const dateLabel = value => value.split('-').reverse().join('.');
const money = (value, currency) => `${format(value)} ${currency}`;
const paths={back:'<path d="m14 5-7 7 7 7M7 12h14"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',filter:'<path d="M3 5h18l-7 8v7l-4-2v-5Z"/>',export:'<path d="M12 16V3m-4 4 4-4 4 4M4 14v7h16v-7"/>',print:'<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6Z"/>',house:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',box:'<path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5"/>',chart:'<path d="M4 3v18h17M8 16v-5M13 16V7M18 16V4"/>',cart:'<path d="M2 3h3l3 13h11l3-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3"/>',document:'<path d="M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h8"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.document}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)});
const navigation=[['Bosh sahifa','house'],['Analitika','chart'],['Internet do‘kon','cart'],['Sotib olish','cart'],['Tovarlar va omborlar','box'],['Kontragentlar','people'],['Buyurtmalar','document'],['Qaytarish','document'],['Harakatlar','document'],['Xarajatlar','document'],['Keshbek','document'],['Kataloglar','document'],['Hisobotlar','chart'],['Sozlamalar','grid']];
document.querySelectorAll('.nav-items').forEach(container=>{
  navigation.forEach(([label,glyph])=>{
    const button=document.createElement('button');button.className='nav-item';
    button.innerHTML=`<span data-icon="${glyph}">${icon(glyph)}</span><span>${label}</span>`;
    if(label==='Hisobotlar' || label==='Bosh sahifa'){
      button.dataset.route = label==='Bosh sahifa' ? 'home' : 'reports';
    }
    else{button.disabled=true;button.title='Bu bosqichda ulanmagan'}
    container.append(button);
  });
});
const number=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2});
const format=value=>number.format(value).replace(/[\u202f\u00a0]/g,' ');
const statusLabels={low:'Kam qolgan',zero:'Tugagan',ok:'Yetarli'};
const status=product=>`<span class="status ${product.status}">${statusLabels[product.status]}</span>`;
const search=document.getElementById('search');
const filterLabels = { branch: 'Filial', currency: 'Valyuta', status: 'Qoldiq holati' };
const emptyFilters = () => ({ branch: '', currency: '', status: '' });
let filters = emptyFilters();
let draftFilters = emptyFilters();
const matchesFilters = product => Object.entries(filters).every(([key, value]) => !value || product[key] === value);

function render(){
  const query=search.value.trim().toLocaleLowerCase('uz');
  const rows=products.filter(p=>`${p.name} ${p.barcode}`.toLocaleLowerCase('uz').includes(query) && matchesFilters(p));
  document.getElementById('result-count').textContent=`${rows.length} ta mahsulot`;
  document.getElementById('table-body').innerHTML=rows.map((p,i)=>`<tr><td>${i+1}</td><td><a class="product-link" href="#product=${p.barcode}" data-product="${p.barcode}">${p.name}</a></td><td>${p.barcode}</td><td>${p.category}</td><td class="numeric">${format(p.quantity)}</td><td>${p.unit}</td><td>${p.currency}</td><td class="numeric">${format(p.price)}</td><td class="numeric">${format(p.quantity*p.price)}</td><td>${p.branch}</td><td>${status(p)}</td></tr>`).join('');
  document.getElementById('cards').innerHTML=rows.map(p=>`<article class="stock-card"><div class="card-head"><h2><a class="product-link" href="#product=${p.barcode}" data-product="${p.barcode}">${p.name}</a></h2><span class="currency">${p.currency}</span></div><dl class="card-values"><div><dt>Qoldiq</dt><dd>${format(p.quantity)} <span class="unit">${p.unit}</span></dd></div><div><dt>Kirish qiymati</dt><dd>${format(p.quantity*p.price)}</dd></div></dl>${p.status!=='ok'?status(p):''}</article>`).join('');
  document.getElementById('empty').hidden=rows.length>0;
  document.querySelector('.table-wrap').hidden=!rows.length;
  document.getElementById('cards').hidden=!rows.length;
  renderFilterChips();
  document.getElementById('clear-search').textContent = Object.values(filters).some(Boolean) ? 'Qidiruv va filtrlarni tozalash' : 'Qidiruvni tozalash';
}
search.addEventListener('input',render);
document.getElementById('clear-search').addEventListener('click',()=>{search.value='';filters=emptyFilters();render();search.focus()});
function closeDrawers(){document.querySelectorAll('.drawer[open]').forEach(dialog=>dialog.close())}
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{
  const dialog=document.getElementById(button.dataset.open);
  dialog.showModal();button.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';
}));
document.querySelectorAll('.drawer').forEach(dialog=>{
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.style.overflow='';document.querySelectorAll(`[data-open="${dialog.id}"]`).forEach(button=>button.setAttribute('aria-expanded','false'))});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close()});
});
document.querySelector('[data-remainder]').addEventListener('click',()=>navigate('reports'));

const filterSheet = document.getElementById('filter-sheet');
const filterTrigger = document.getElementById('filter-trigger');
const filterFields = document.getElementById('filter-fields');
const filterOptions = document.getElementById('filter-options');
const filterChoiceBack = document.getElementById('filter-choice-back');
const filterFooter = document.getElementById('filter-footer');
let choosingFilter = null;
let previousBodyOverflow = '';
function filterValue(key, value) {
  return value ? (key === 'status' ? statusLabels[value] : value) : 'Barchasi';
}
function renderFilterChips() {
  const chips = document.getElementById('filter-chips');
  chips.replaceChildren();
  const active = Object.entries(filters).filter(([,value]) => value);
  const badge = document.getElementById('filter-count');
  badge.hidden = !active.length;
  badge.textContent = active.length;
  filterTrigger.setAttribute('aria-label', active.length ? `Filtr, ${active.length} ta faol` : 'Filtr');
  active.forEach(([key, value]) => {
    const button = document.createElement('button');
    button.className = 'filter-chip';
    const label = `${filterLabels[key]}: ${filterValue(key, value)}`;
    button.textContent = `${label} ×`;
    button.setAttribute('aria-label', `${label} filtrini olib tashlash`);
    button.addEventListener('click', () => { filters[key] = ''; render(); filterTrigger.focus({preventScroll:true}); });
    chips.append(button);
  });
}
function showFilterFields(focusKey) {
  choosingFilter = null;
  document.getElementById('filter-title').textContent = 'Filtr';
  filterFields.hidden = false;
  filterOptions.hidden = true;
  filterChoiceBack.hidden = true;
  filterFooter.hidden = false;
  filterFields.replaceChildren();
  Object.keys(filterLabels).forEach(key => {
    const button = document.createElement('button');
    button.className = 'filter-field';
    button.dataset.field = key;
    const label = document.createElement('span');
    label.className = 'filter-label'; label.textContent = filterLabels[key];
    const value = document.createElement('strong'); value.textContent = filterValue(key, draftFilters[key]);
    const arrow = document.createElement('span'); arrow.textContent = '›'; arrow.className = 'field-arrow'; arrow.setAttribute('aria-hidden','true');
    button.append(label, value, arrow);
    button.addEventListener('click', () => showFilterChoices(key));
    filterFields.append(button);
  });
  if (focusKey) filterFields.querySelector(`[data-field="${focusKey}"]`).focus({preventScroll:true});
  if (filterSheet.open) enterContent(filterFields, -1, 12);
}
function showFilterChoices(key) {
  choosingFilter = key;
  document.getElementById('filter-title').textContent = filterLabels[key];
  filterFields.hidden = true;
  filterOptions.hidden = false;
  filterChoiceBack.hidden = false;
  filterFooter.hidden = true;
  const list = document.getElementById('filter-option-list');
  list.replaceChildren();
  ['', ...new Set(products.map(product => product[key]))].forEach(value => {
    const label = document.createElement('label'); label.className = 'filter-option';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'filter-choice'; input.value = value;
    input.checked = draftFilters[key] === value;
    const text = document.createElement('span'); text.textContent = filterValue(key, value);
    // Explicit selection commits only to the draft; Escape/close discards it.
    input.addEventListener('click', () => { draftFilters[key] = value; showFilterFields(key); });
    label.append(input, text); list.append(label);
  });
  list.querySelector('input:checked').focus({preventScroll:true});
  enterContent(filterOptions, 1, 12);
}
filterTrigger.addEventListener('click', () => {
  draftFilters = {...filters}; showFilterFields();
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  filterSheet.showModal();
});
filterChoiceBack.addEventListener('click', () => showFilterFields(choosingFilter));
document.getElementById('filter-close').addEventListener('click', () => filterSheet.close());
document.getElementById('filter-reset').addEventListener('click', () => { draftFilters = emptyFilters(); showFilterFields(); document.getElementById('filter-reset').focus({preventScroll:true}); });
document.getElementById('filter-apply').addEventListener('click', () => { filters = {...draftFilters}; render(); filterSheet.close(); });
filterSheet.addEventListener('close', () => { document.body.style.overflow = previousBodyOverflow; filterTrigger.focus({preventScroll:true}); });
filterSheet.addEventListener('cancel', event => { if (choosingFilter) { event.preventDefault(); showFilterFields(choosingFilter); } });
filterSheet.addEventListener('click', event => {
  if (event.target !== filterSheet) return;
  const rect = filterSheet.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) filterSheet.close();
});
render();

// Mobile access to the same report sections and actions shown on desktop.
const reportChoiceSheet = document.getElementById('report-choice-sheet');
let reportChoiceTrigger = null;
let reportChoiceOverflow = '';
document.querySelectorAll('[data-choice-sheet]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    reportChoiceTrigger = trigger;
    const isReports = trigger.dataset.choiceSheet === 'reports';
    document.getElementById('report-choice-title').textContent = isReports ? 'Hisobotlar' : 'Qo‘shimcha amallar';
    document.getElementById('report-choice-note').textContent = isReports
      ? 'Hozir Qoldiq bo‘limi faol. Qolgan bo‘limlar hali ulanmagan.'
      : 'Eksport va chop etish hali ulanmagan.';
    const list = document.getElementById('report-choices');
    list.replaceChildren();
    const addChoice = (label, active = false) => {
      const button = document.createElement('button');
      button.className = 'report-choice';
      const name = document.createElement('span');
      name.textContent = label;
      const state = document.createElement('small');
      state.textContent = active ? 'Tanlangan' : 'Hali ulanmagan';
      button.append(name, state);
      if (active) {
        button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => reportChoiceSheet.close());
      } else button.disabled = true;
      list.append(button);
    };
    if (isReports) {
      document.querySelectorAll('.report-tabs>span').forEach(item => addChoice(item.textContent, item.classList.contains('selected')));
      const subtitle = document.createElement('p');
      subtitle.className = 'report-choice-subtitle';
      subtitle.textContent = 'Qoldiqlar bo‘limi';
      list.append(subtitle);
      document.querySelectorAll('.sub-tabs>span').forEach(item => addChoice(item.textContent, item.classList.contains('selected')));
    } else {
      addChoice('Eksport');
      addChoice('Chop etish');
    }
    reportChoiceOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    reportChoiceSheet.showModal();
    trigger.setAttribute('aria-expanded', 'true');
  });
});
document.getElementById('report-choice-close').addEventListener('click', () => reportChoiceSheet.close());
reportChoiceSheet.addEventListener('close', () => {
  document.body.style.overflow = reportChoiceOverflow;
  reportChoiceTrigger?.setAttribute('aria-expanded', 'false');
  if (reportChoiceTrigger?.getClientRects().length) reportChoiceTrigger.focus({preventScroll:true});
});
reportChoiceSheet.addEventListener('click', event => {
  if (event.target !== reportChoiceSheet) return;
  const rect = reportChoiceSheet.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) reportChoiceSheet.close();
});

// Hash routes work on the static host, including direct links and browser Back.
const productPage = document.getElementById('product-page');
const workspace = document.getElementById('workspace');
const detailContent = document.getElementById('detail-content');
const detailBack = document.getElementById('detail-back');
const dashboard = document.getElementById('dashboard');
const reportsPage = document.getElementById('main');
let activeView = null;
let activeProduct = null;
let activePurchase = null;
let activeHistoryMode = 'purchase';
let purchaseReturn = null;
let detailOrigin = 'reports';
const viewPositions = { home: 0, reports: 0 };
const viewFocus = { home: null, reports: null };
let returning = false;
history.scrollRestoration = 'manual';

function field(label, value) {
  const row = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value;
  row.append(term, description);
  return row;
}
function purchaseFields(product, purchase) {
  return [
    ['Mahsulot nomi', product.name], ['Shtrix-kod', product.barcode],
    ['Buyurtma raqami', purchase.order], ['Turi', purchase.type],
    ['Ombor', purchase.warehouse], ['Valyuta', purchase.currency],
    ['O‘lchov birligi', product.unit], ['Filial', product.branch],
    ['Ta’minotchi', purchase.supplier], ['Kirish miqdori', format(purchase.quantity)],
    ['Qoldiq miqdori', format(purchase.remaining)],
    ['Kirish narxi', money(purchase.cost, purchase.currency)],
    ['Sotish narxi', money(purchase.sale, purchase.currency)],
    ['Yakuniy kirish narxi', money(purchase.quantity * purchase.cost, purchase.currency)],
    ['Yakuniy narx', money(purchase.remaining * purchase.sale, purchase.currency)],
    ['Yaratilgan sana', `${dateLabel(purchase.date)} · ${purchase.time}`],
  ];
}
function grossFields(product, item) {
  return [['Mahsulot nomi', product.name], ['Shtrix-kod', product.barcode], ['Ombor', item.warehouse], ['Valyuta', item.currency], ['O‘lchov birligi', product.unit], ['Filial', product.branch], ['Turkum', product.category], ['Ta’minotchi', item.supplier], ['Xaridor', item.buyer], ['Sotib olish narxi', money(item.cost, item.currency)], ['Miqdori', format(item.quantity)], ['Sotish narxi', money(item.sale, item.currency)], ['Yalpi daromad', money(item.gross, item.currency)], ['Manba turi', item.source], ['Yaratilgan sana', `${dateLabel(item.date)} · ${item.time}`]];
}
function saleReturnFields(product, item) {
  return saleFields(product, item).map(([label, value]) => [label === 'To‘langan' ? 'Qaytarilgan to‘lov' : label === 'Umumiy to‘lov miqdori' ? 'Qaytarish summasi' : label, value]);
}
function supplierReturnFields(product, item) {
  return [['Mahsulot nomi', product.name], ['Shtrix-kod', product.barcode], ['O‘lchov birligi', product.unit], ['Valyuta', item.currency], ['Ta’minotchi', item.supplier], ['Ombor', item.warehouse], ['Xodim', item.employee], ['Qaytish sababi', item.reason], ['Miqdori', format(item.quantity)], ['Kirish narxi', money(item.cost, item.currency)], ['Qaytarish summasi', money(item.quantity * item.cost, item.currency)], ['Yaratilgan sana', `${dateLabel(item.date)} · ${item.time}`]];
}
function saleFields(product, item) {
  return [
    ['Mahsulot nomi', product.name], ['Shtrix-kod', product.barcode], ['Ombor', item.warehouse],
    ['Valyuta', item.currency], ['O‘lchov birligi', product.unit], ['Filial', product.branch], ['Turkum', product.category],
    ['Xaridor', item.buyer], ['Turi', item.type], ['Sotib olish narxi', money(item.cost, item.currency)],
    ['Miqdori', format(item.quantity)], ['Sotish narxi', money(item.sale, item.currency)],
    ['To‘langan', money(item.paid, item.currency)], ['Umumiy to‘lov miqdori', money(item.total, item.currency)],
    ['Yaratilgan sana', `${dateLabel(item.date)} · ${item.time}`],
  ];
}
function historyLink(product, item, mode) {
  return `#product=${product.barcode}&tab=${mode}&entry=${item.id}`;
}
const historyFilterLabels = {currency: 'Valyuta', warehouse: 'Ombor', type: 'Turi', supplier: 'Ta’minotchi', buyer: 'Xaridor', from: 'Sanadan boshlab', to: 'Sanagacha'};
const historyFilterKeys = {
  purchase: ['currency', 'warehouse', 'type', 'supplier', 'from', 'to'],
  sales: ['currency', 'warehouse', 'type', 'buyer', 'from', 'to'],
  returns: ['currency', 'warehouse', 'supplier', 'from', 'to'],
  'sales-return': ['currency', 'warehouse', 'type', 'buyer', 'from', 'to'],
  gross: ['currency', 'supplier', 'buyer', 'from', 'to'],
};
const historyFilterState = new Map();
const historyFilterKey = (product = activeProduct, mode = activeHistoryMode) => `${product}:${mode}`;
const currentHistoryFilters = (product = activeProduct, mode = activeHistoryMode) => historyFilterState.get(historyFilterKey(product, mode)) || {};
function historyRows(product, mode) {
  const selected = currentHistoryFilters(product.barcode, mode);
  return historyModes[mode].rows.filter(item => item.product === product.barcode && historyFilterKeys[mode].every(key => {
    const value = selected[key];
    if (!value) return true;
    if (key === 'from') return item.date >= value;
    if (key === 'to') return item.date <= value;
    return item[key] === value;
  }));
}
function historyEmpty(product, mode) {
  const filtered = Object.values(currentHistoryFilters(product.barcode, mode)).some(Boolean);
  return `<div class="empty purchase-empty">${icon('search')}<h3>${filtered ? 'Mos yozuv topilmadi' : mode === 'purchase' ? 'Xarid tarixi yo‘q' : 'Ma’lumot topilmadi'}</h3><p>${filtered ? 'Filtrlarni o‘zgartiring yoki tozalang.' : 'Bu bo‘limda mahsulot uchun hali yozuv yo‘q.'}</p>${filtered ? '<button class="outline-button" data-history-reset>Filtrlarni tozalash</button>' : ''}</div>`;
}
function refreshHistory() {
  const product = products.find(item => item.barcode === activeProduct);
  if (!product || activePurchase) return;
  detailContent.querySelector('.history-navigation').replaceWith(historyNavigation(activeHistoryMode));
  detailContent.querySelector('.purchase-history').replaceWith(transactionHistory(product, activeHistoryMode));
}
function historyNavigation(mode) {
  const nav = document.createElement('nav');
  nav.className = 'history-navigation';
  nav.setAttribute('aria-label', 'Mahsulot tarixi bo‘limlari');
  nav.innerHTML = `<div class="history-tabs">${Object.entries(historyTitles).map(([key, title]) => `<button data-history-mode="${key}" ${historyModes[key] ? '' : 'disabled'} ${key === mode ? 'aria-current="page"' : ''}>${title}</button>`).join('')}</div>
    <button class="history-picker" id="history-picker" aria-haspopup="dialog" aria-controls="history-mode-sheet" aria-expanded="false" aria-label="Tarix bo‘limi: ${historyTitles[mode]}"><span><small>Mahsulot tarixi</small><strong>${historyTitles[mode]}</strong></span><span aria-hidden="true">⌄</span></button>`;
  const selected = currentHistoryFilters(activeProduct, mode);
  const active = Object.entries(selected).filter(([key, value]) => historyFilterKeys[mode].includes(key) && value);
  const filterButton = document.createElement('button');
  filterButton.id = 'history-filter-trigger'; filterButton.className = 'outline-button history-filter-trigger';
  filterButton.setAttribute('aria-label', active.length ? `Tarix filtri, ${active.length} ta faol` : 'Tarix filtri');
  filterButton.setAttribute('aria-haspopup', 'dialog'); filterButton.setAttribute('aria-controls', 'history-filter-sheet');
  filterButton.setAttribute('aria-expanded', 'false');
  filterButton.innerHTML = `${icon('filter')}<span class="history-filter-text">Filtr</span>${active.length ? `<span class="history-filter-count">${active.length}</span>` : ''}`;
  nav.append(filterButton);
  if (active.length) {
    const chips = document.createElement('div'); chips.className = 'filter-chips history-filter-chips';
    chips.setAttribute('aria-label', 'Tarixning faol filtrlari');
    active.forEach(([key, value]) => {
      const button = document.createElement('button'); button.className = 'filter-chip'; button.dataset.historyRemove = key;
      const label = `${historyFilterLabels[key]}: ${key === 'from' || key === 'to' ? dateLabel(value) : value}`;
      button.textContent = `${label} ×`; button.setAttribute('aria-label', `${label} filtrini olib tashlash`); chips.append(button);
    });
    const reset = document.createElement('button'); reset.className = 'history-clear'; reset.dataset.historyReset = ''; reset.textContent = 'Tozalash'; chips.append(reset);
    nav.append(chips);
  }
  return nav;
}
function transactionHistory(product, mode) {
  if (mode === 'purchase') return purchaseHistory(product);
  const config = historyModes[mode];
  const rows = historyRows(product, mode);
  const section = document.createElement('section');
  section.className = 'purchase-history';
  section.setAttribute('aria-labelledby', 'purchase-title');
  section.innerHTML = `<div class="section-heading"><h2 id="purchase-title">${config.title}</h2><span role="status" aria-live="polite">${rows.length} ta yozuv</span></div>${config.note ? `<p class="history-notice">${config.note}</p>` : ''}`;
  if (!rows.length) {
    section.innerHTML += historyEmpty(product, mode);
    return section;
  }
  const cards = document.createElement('div');
  cards.className = 'purchase-cards';
  cards.innerHTML = rows.map(item => `<article class="purchase-card">
    <div class="purchase-card-top"><time datetime="${item.date}T${item.time}">${dateLabel(item.date)} <span>· ${item.time}</span></time><span class="currency">${item.currency}</span></div>
    <h3>${config.party(item)}</h3><div class="history-tags">${config.tags(item)}</div>
    <dl class="purchase-quantities">${config.metrics(product, item).map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
    <div class="purchase-card-bottom"><div><span>${config.amountLabel}</span><strong class="${mode === 'gross' ? (config.amount(item) < 0 ? 'amount-negative' : 'amount-positive') : ''}">${money(config.amount(item), item.currency)}</strong></div><a href="${historyLink(product, item, mode)}" data-entry="${item.id}" aria-label="${dateLabel(item.date)} ${item.time} · ${config.detail}">Tafsilot <span aria-hidden="true">›</span></a></div>
  </article>`).join('');
  const table = document.createElement('div');
  table.className = 'purchase-table'; table.tabIndex = 0;
  table.setAttribute('role', 'region'); table.setAttribute('aria-label', `${config.title} jadvali, gorizontal aylantirish mumkin`);
  table.innerHTML = `<table><thead><tr><th scope="col">№</th>${config.fields(product, rows[0]).map(([label]) => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows.map((item, index) => `<tr><td>${index + 1}</td>${config.fields(product, item).map(([, value], fieldIndex) => `<td>${fieldIndex === 0 ? `<a class="product-link" href="${historyLink(product, item, mode)}" data-entry="${item.id}" aria-label="${dateLabel(item.date)} ${item.time} · ${config.detail}">${value}</a>` : value}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const totals = document.createElement('div'); totals.className = 'purchase-totals';
  totals.setAttribute('aria-label', 'Valyuta bo‘yicha yakunlar');
  [...new Set(rows.map(item => item.currency))].forEach(currency => {
    const block = document.createElement('section'); block.className = 'purchase-total';
    block.innerHTML = `<h3>${Object.values(currentHistoryFilters(product.barcode, mode)).some(Boolean) ? 'Filtrlangan jami' : 'Jami'} <span class="currency">${currency}</span></h3><dl></dl>`;
    block.querySelector('dl').append(...config.totals(rows.filter(item => item.currency === currency)).map(([label, value]) => field(label, format(value))));
    totals.append(block);
  });
  section.append(cards, table, totals);
  return section;
}
function purchaseLink(product, purchase) {
  return `#product=${product.barcode}&purchase=${purchase.id}`;
}
function purchaseHistory(product) {
  const rows = historyRows(product, 'purchase');
  const section = document.createElement('section');
  section.className = 'purchase-history';
  section.setAttribute('aria-labelledby', 'purchase-title');
  section.innerHTML = `<div class="section-heading"><h2 id="purchase-title">Sotib olish</h2><span role="status" aria-live="polite">${rows.length} ta kirim</span></div>`;
  if (!rows.length) {
    section.innerHTML += historyEmpty(product, 'purchase');
    return section;
  }
  const cards = document.createElement('div');
  cards.className = 'purchase-cards';
  cards.innerHTML = rows.map(item => `<article class="purchase-card">
    <div class="purchase-card-top"><time datetime="${item.date}T${item.time}">${dateLabel(item.date)} <span>· ${item.time}</span></time><span class="currency">${item.currency}</span></div>
    <h3>${item.supplier}</h3>
    <dl class="purchase-quantities"><div><dt>Kirim</dt><dd>${format(item.quantity)} <span class="unit">${product.unit}</span></dd></div><div><dt>Qoldiq</dt><dd>${format(item.remaining)} <span class="unit">${product.unit}</span></dd></div></dl>
    <div class="purchase-card-bottom"><div><span>Kirish summasi</span><strong>${money(item.quantity * item.cost, item.currency)}</strong></div><a href="${purchaseLink(product, item)}" data-purchase="${item.id}" aria-label="${dateLabel(item.date)} ${item.time} dagi kirim tafsiloti">Tafsilot <span aria-hidden="true">›</span></a></div>
  </article>`).join('');
  const table = document.createElement('div');
  table.className = 'purchase-table';
  table.tabIndex = 0;
  table.setAttribute('role', 'region');
  table.setAttribute('aria-label', 'Sotib olish jadvali, gorizontal aylantirish mumkin');
  const headings = ['№', 'Mahsulot nomlari', 'Shtrix-kod', 'Buyurtma raqami', 'Ombor', 'Valyuta', 'O‘lchov birligi', 'Filial', 'Ta’minotchi', 'Kirish miqdori', 'Qoldiq miqdori', 'Kirish narxi', 'Sotish narxi', 'Yakuniy kirish narxi', 'Yakuniy narx', 'Yaratilgan sana'];
  table.innerHTML = `<table><thead><tr>${headings.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows.map((item, index) => `<tr>
    <td>${index + 1}</td><td><a class="product-link" href="${purchaseLink(product, item)}" data-purchase="${item.id}" aria-label="${dateLabel(item.date)} ${item.time} dagi kirim tafsiloti">${product.name}</a></td><td>${product.barcode}</td><td>${item.order}</td><td>${item.warehouse}</td><td>${item.currency}</td><td>${product.unit}</td><td>${product.branch}</td><td>${item.supplier}</td><td class="numeric">${format(item.quantity)}</td><td class="numeric">${format(item.remaining)}</td><td class="numeric">${format(item.cost)}</td><td class="numeric">${format(item.sale)}</td><td class="numeric">${format(item.quantity * item.cost)}</td><td class="numeric">${format(item.remaining * item.sale)}</td><td>${dateLabel(item.date)} · ${item.time}</td>
  </tr>`).join('')}</tbody></table>`;
  const totals = document.createElement('div');
  totals.className = 'purchase-totals';
  totals.setAttribute('aria-label', 'Valyuta bo‘yicha xarid yakunlari');
  [...new Set(rows.map(item => item.currency))].forEach(currency => {
    const group = rows.filter(item => item.currency === currency);
    const cost = group.reduce((sum, item) => sum + item.quantity * item.cost, 0);
    const sale = group.reduce((sum, item) => sum + item.quantity * item.sale, 0);
    const block = document.createElement('section');
    block.className = 'purchase-total';
    block.innerHTML = `<h3>${Object.values(currentHistoryFilters(product.barcode, 'purchase')).some(Boolean) ? 'Filtrlangan jami' : 'Jami'} <span class="currency">${currency}</span></h3><dl></dl>`;
    block.querySelector('dl').append(field('Kirish summasi', format(cost)), field('Sotish qiymati', format(sale)), field('Farq', format(sale - cost)));
    totals.append(block);
  });
  const note = document.createElement('p');
  note.className = 'purchase-total-note';
  note.textContent = 'Sotish qiymati kirim miqdori bo‘yicha hisoblangan. Bu amalga oshirilgan savdo yoki foyda emas.';
  section.append(cards, table, totals, note);
  return section;
}
function showProduct(product, purchase = null, mode = 'purchase') {
  const config = historyModes[mode];
  if (activeProduct === product.barcode && activePurchase === (purchase?.id || null) && activeHistoryMode === mode) return;
  const restoringPurchase = !purchase && activePurchase && activeProduct === product.barcode && activeHistoryMode === mode && purchaseReturn?.product === product.barcode && purchaseReturn?.mode === mode ? purchaseReturn : null;
  if (purchase && !activePurchase && activeProduct === product.barcode) {
    purchaseReturn = {product: product.barcode, mode, scroll: window.scrollY, expanded: detailContent.querySelector('details')?.open, id: purchase.id};
  }
  if (!activeProduct) rememberView();
  detailOrigin = history.state?.rizoFrom === 'home' ? 'home' : (history.state?.rizoFrom === 'reports' ? 'reports' : activeView || 'reports');
  detailBack.setAttribute('aria-label', purchase ? 'Mahsulotga qaytish' : detailOrigin === 'home' ? 'Bosh sahifaga qaytish' : 'Qoldiqlarga qaytish');
  document.getElementById('detail-page-label').textContent = purchase ? config.detail : 'Mahsulot tafsiloti';
  activeProduct = product.barcode;
  activeHistoryMode = mode;
  activePurchase = purchase?.id || null;
  const summary = document.createElement('section');
  summary.className = 'detail-summary';
  if (purchase) {
    summary.classList.add('purchase-detail-summary');
    summary.innerHTML = `<div class="detail-kicker"><span>${dateLabel(purchase.date)} · ${purchase.time}</span><span class="currency">${purchase.currency}</span></div><h1 id="product-title" tabindex="-1"></h1><p class="purchase-detail-amount ${mode === 'gross' ? (config.amount(purchase) < 0 ? 'amount-negative' : 'amount-positive') : ''}">${money(config.amount(purchase), purchase.currency)}<span>${config.amountLabel}</span></p>`;
    summary.querySelector('h1').textContent = product.name;
    const information = document.createElement('section');
    information.className = 'detail-information';
    information.innerHTML = `<h2>${config.title} · ma’lumotlar</h2><dl class="detail-fields"></dl>`;
    information.querySelector('dl').append(...config.fields(product, purchase).map(([label, value]) => field(label, value)));
    detailContent.replaceChildren(summary, information);
  } else {
    summary.innerHTML = `<div class="product-heading"><span class="product-symbol">${icon('box')}</span><div><h1 id="product-title" tabindex="-1"></h1><div class="product-identifiers"><span class="product-barcode">${product.barcode}</span>${status(product)}</div></div></div>
      <dl class="detail-totals"><div><dt>Qoldiq</dt><dd>${format(product.quantity)} <span class="unit">${product.unit}</span></dd></div><div><dt>Kirish qiymati · ${product.currency}</dt><dd>${format(product.quantity * product.price)}</dd></div></dl>
      <details class="product-metadata"><summary>Mahsulot ma’lumotlari <span aria-hidden="true">⌄</span></summary><dl class="detail-fields"></dl></details>`;
    summary.querySelector('h1').textContent = product.name;
    summary.querySelector('.detail-fields').append(field('Turkum', product.category), field('Filial', product.branch), field('O‘lchov birligi', product.unit), field('Kirish narxi', money(product.price, product.currency)));
    // Desktop starts expanded; mobile keeps the history near the first screen.
    summary.querySelector('details').open = restoringPurchase ? restoringPurchase.expanded : innerWidth > 760;
    detailContent.replaceChildren(summary, historyNavigation(mode), transactionHistory(product, mode));
  }
  const note = document.createElement('p');
  note.className = 'stage-note';
  note.textContent = 'Sinov ma’lumotlari. Mahsulot tarixi jonli omborga bog‘lanmagan.';
  detailContent.append(note);
  detailContent.classList.toggle('is-purchase-detail', Boolean(purchase));
  workspace.hidden = true;
  productPage.hidden = false;
  document.title = `${purchase ? `${config.detail} · ` : ''}${product.name} · Rizo Store`;
  window.scrollTo(0, restoringPurchase?.scroll || 0);
  const returnLink = restoringPurchase && [...detailContent.querySelectorAll('[data-purchase], [data-entry]')].find(link => (link.dataset.purchase || link.dataset.entry) === restoringPurchase.id && link.getClientRects().length);
  (returnLink || summary.querySelector('h1')).focus({ preventScroll: true });
}

function rememberView() {
  if (!activeView || activeProduct) return;
  viewPositions[activeView] = window.scrollY;
  viewFocus[activeView] = document.activeElement;
}
function navigate(view, stockStatus) {
  closeDrawers();
  if (stockStatus !== undefined) {
    search.value = '';
    filters = {...emptyFilters(), status: stockStatus};
    render();
    viewPositions.reports = 0;
  }
  if (activeView === view && !activeProduct) {
    if (stockStatus !== undefined) {
      window.scrollTo(0, 0);
      document.getElementById('reports-title').focus({preventScroll: true});
    }
    return;
  }
  history.pushState(null, '', `#${view}`);
  syncRoute();
}
function syncRoute() {
  const before = {view: activeView, product: activeProduct, entry: activePurchase, mode: activeHistoryMode};
  applyRoute();
  const changed = before.view !== activeView || before.product !== activeProduct || before.entry !== activePurchase || before.mode !== activeHistoryMode;
  if (!changed) return;
  // Cancel outgoing motion so fast navigation never leaves a stale effect.
  motionAnimations.forEach(animation => animation.cancel());
  const historyOnly = activeProduct && before.product === activeProduct && !before.entry && !activePurchase && before.mode !== activeHistoryMode;
  const backwards = (before.entry && !activePurchase) || (before.product && !activeProduct) || (!before.product && before.view === 'reports' && activeView === 'home');
  const target = activeProduct ? (historyOnly ? detailContent.querySelector('.purchase-history') : detailContent) : activeView === 'home' ? dashboard : reportsPage;
  enterContent(target, backwards ? -1 : 1, historyOnly ? 12 : 24);
}
function applyRoute() {
  returning = false;
  if (historySheet.open) historySheet.close();
  if (historyFilterSheet.open) historyFilterSheet.close();
  const code = new URLSearchParams(location.hash.slice(1)).get('product');
  const product = products.find(item => item.barcode === code);
  if (product) {
    const params = new URLSearchParams(location.hash.slice(1));
    const mode = Object.hasOwn(historyModes, params.get('tab')) ? params.get('tab') : 'purchase';
    const entryId = params.get('entry') || params.get('purchase');
    const entry = historyModes[mode].rows.find(item => item.id === entryId && item.product === product.barcode);
    showProduct(product, entry || null, mode); return;
  }
  if (code) history.replaceState(null, '', '#reports');
  const view = location.hash === '#reports' ? 'reports' : 'home';
  const fromDetail = Boolean(activeProduct);
  if (!fromDetail && activeView === view) return;
  rememberView();
  activeProduct = null;
  activePurchase = null;
  activeView = view;
  productPage.hidden = true;
  workspace.hidden = false;
  dashboard.hidden = view !== 'home';
  reportsPage.hidden = view !== 'reports';
  document.title = `${view === 'home' ? 'Bosh sahifa' : 'Qoldiq'} · Rizo Store`;
  document.querySelectorAll('.nav-item[data-route]').forEach(button => {
    if (button.dataset.route === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  window.scrollTo(0, viewPositions[view]);
  const focus = viewFocus[view];
  if (fromDetail && focus?.isConnected && focus !== document.body && !focus.closest('[hidden]')) {
    focus.focus({preventScroll: true});
  } else {
    document.getElementById(view === 'home' ? 'home-title' : 'reports-title').focus({preventScroll: true});
  }
}
function goBack() {
  if (!activeProduct || returning) return;
  returning = true;
  if (activePurchase) {
    if (history.state?.rizoPurchase) history.back();
    else { history.replaceState(null, '', `#product=${activeProduct}&tab=${activeHistoryMode}`); syncRoute(); }
  } else if (history.state?.rizoDetail) history.back();
  else {
    history.replaceState(null, '', `#${detailOrigin}`);
    syncRoute();
  }
}
document.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const route = event.target.closest('[data-route]');
  if (route) {
    event.preventDefault();
    navigate(route.dataset.route, route.dataset.stockStatus);
    return;
  }
  const purchaseLink = event.target.closest('a[data-purchase], a[data-entry]');
  if (purchaseLink) {
    event.preventDefault();
    history.pushState({rizoPurchase: true, rizoFrom: detailOrigin}, '', purchaseLink.getAttribute('href'));
    syncRoute();
    return;
  }
  const link = event.target.closest('a[data-product]');
  if (!link) return;
  event.preventDefault();
  history.pushState({ rizoDetail: true, rizoFrom: activeView || 'reports' }, '', link.getAttribute('href'));
  syncRoute();
});
const historySheet = document.getElementById('history-mode-sheet');
let historySheetOverflow = '';
function switchHistory(mode) {
  if (!Object.hasOwn(historyModes, mode) || !activeProduct) return;
  const expanded = detailContent.querySelector('.product-metadata')?.open;
  const position = window.scrollY;
  history.replaceState(history.state, '', `#product=${activeProduct}&tab=${mode}`);
  syncRoute();
  const metadata = detailContent.querySelector('.product-metadata');
  if (metadata) metadata.open = expanded;
  window.scrollTo(0, position);
  const target = innerWidth <= 760 ? document.getElementById('history-picker') : detailContent.querySelector(`[data-history-mode="${mode}"]`);
  target?.focus({preventScroll:true});
}
document.addEventListener('click', event => {
  const modeButton = event.target.closest('[data-history-mode]');
  if (modeButton) {
    if (historySheet.open) historySheet.close();
    switchHistory(modeButton.dataset.historyMode);
    return;
  }
  if (!event.target.closest('#history-picker')) return;
  document.getElementById('history-mode-options').innerHTML = Object.entries(historyTitles).map(([mode, title]) => `<button class="report-choice" data-history-mode="${mode}" ${historyModes[mode] ? '' : 'disabled'} ${mode === activeHistoryMode ? 'aria-current="page"' : ''}><span>${title}</span>${mode === activeHistoryMode ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>' : historyModes[mode] ? '' : '<small>Tayyorlanmoqda</small>'}</button>`).join('');
  historySheetOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  historySheet.showModal();
  document.getElementById('history-picker').setAttribute('aria-expanded', 'true');
});
document.getElementById('history-mode-close').addEventListener('click', () => historySheet.close());
historySheet.addEventListener('close', () => {
  document.body.style.overflow = historySheetOverflow;
  const picker = document.getElementById('history-picker');
  picker?.setAttribute('aria-expanded', 'false');
  if (picker?.getClientRects().length) picker.focus({preventScroll:true});
});
historySheet.addEventListener('click', event => {
  if (event.target !== historySheet) return;
  const rect = historySheet.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) historySheet.close();
});
const historyFilterSheet = document.getElementById('history-filter-sheet');
const historyFilterBody = document.getElementById('history-filter-body');
const historyFilterChoices = document.getElementById('history-filter-choices');
const historyFilterSearch = document.getElementById('history-filter-search');
const historyFilterForm = document.getElementById('history-filter-form');
let historyDraft = {};
let historyChoosing = null;
let historyFilterOverflow = '';
function historyOptions(key) {
  if (key === 'currency') return ['UZS', 'USD'];
  if (key === 'type') return activeHistoryMode === 'purchase' ? ['Zakup orqali', 'Zayavka orqali'] : ['Oflayn', 'Onlayn'];
  return [...new Set(historyModes[activeHistoryMode].rows.map(row => row[key]).filter(Boolean))];
}
function showHistoryFilterFields(focusKey) {
  historyChoosing = null;
  document.getElementById('history-filter-title').textContent = 'Tarix filtri';
  document.getElementById('history-filter-back').hidden = true;
  historyFilterBody.hidden = false; historyFilterChoices.hidden = true;
  document.getElementById('history-filter-footer').hidden = false;
  document.getElementById('history-filter-error').textContent = '';
  historyFilterBody.replaceChildren();
  const note = document.createElement('p'); note.className = 'choice-note';
  note.textContent = activeHistoryMode === 'gross' ? 'Yalpi daromad barcha omborlar bo‘yicha. Bu bo‘limda ombor filtri qo‘llanmaydi.' : 'Filtrlar faqat tarix yozuvlariga qo‘llanadi.';
  historyFilterBody.append(note);
  historyFilterKeys[activeHistoryMode].filter(key => key !== 'from' && key !== 'to').forEach(key => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-field'; button.dataset.historyField = key;
    const label = document.createElement('span'); label.className = 'filter-label'; label.textContent = historyFilterLabels[key];
    const value = document.createElement('strong'); value.textContent = historyDraft[key] || 'Barchasi';
    const arrow = document.createElement('span'); arrow.className = 'field-arrow'; arrow.textContent = '›'; arrow.setAttribute('aria-hidden', 'true');
    button.append(label, value, arrow); button.addEventListener('click', () => showHistoryFilterChoices(key)); historyFilterBody.append(button);
  });
  const dates = document.createElement('div'); dates.className = 'history-date-fields';
  ['from', 'to'].forEach(key => {
    const label = document.createElement('label'); const text = document.createElement('span'); text.textContent = historyFilterLabels[key];
    const input = document.createElement('input'); input.type = 'date'; input.name = key; input.id = `history-date-${key}`; input.value = historyDraft[key] || '';
    input.setAttribute('aria-describedby', 'history-filter-error');
    input.addEventListener('input', () => { historyDraft[key] = input.value; document.getElementById('history-filter-error').textContent = ''; });
    label.append(text, input); dates.append(label);
  });
  historyFilterBody.append(dates);
  if (focusKey) historyFilterBody.querySelector(`[data-history-field="${focusKey}"]`)?.focus({preventScroll:true});
  if (historyFilterSheet.open) enterContent(historyFilterBody, -1, 12);
}
function renderHistoryFilterChoices() {
  const list = document.getElementById('history-filter-option-list'); list.replaceChildren();
  const query = historyFilterSearch.value.trim().toLocaleLowerCase('uz');
  const options = ['', ...historyOptions(historyChoosing)].filter(value => (value || 'Barchasi').toLocaleLowerCase('uz').includes(query));
  options.forEach(value => {
    const label = document.createElement('label'); label.className = 'filter-option';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'history-choice'; input.value = value; input.checked = (historyDraft[historyChoosing] || '') === value;
    const text = document.createElement('span'); text.textContent = value || 'Barchasi';
    input.addEventListener('click', () => { const key = historyChoosing; historyDraft[key] = value; showHistoryFilterFields(key); });
    label.append(input, text); list.append(label);
  });
  document.getElementById('history-filter-no-options').hidden = options.length > 0;
}
function showHistoryFilterChoices(key) {
  historyChoosing = key;
  document.getElementById('history-filter-title').textContent = historyFilterLabels[key];
  document.getElementById('history-filter-back').hidden = false;
  historyFilterBody.hidden = true; historyFilterChoices.hidden = false;
  document.getElementById('history-filter-footer').hidden = true;
  historyFilterSearch.value = '';
  document.getElementById('history-filter-search-wrap').hidden = !['supplier', 'buyer'].includes(key);
  renderHistoryFilterChoices();
  document.querySelector('#history-filter-option-list input:checked')?.focus({preventScroll:true});
  enterContent(historyFilterChoices, 1, 12);
}
historyFilterSearch.addEventListener('input', renderHistoryFilterChoices);
document.getElementById('history-filter-back').addEventListener('click', () => showHistoryFilterFields(historyChoosing));
document.getElementById('history-filter-close').addEventListener('click', () => historyFilterSheet.close());
document.getElementById('history-filter-reset').addEventListener('click', () => { historyDraft = {}; showHistoryFilterFields(); });
historyFilterForm.addEventListener('submit', event => {
  event.preventDefault();
  if (historyChoosing) return;
  if (historyDraft.from && historyDraft.to && historyDraft.from > historyDraft.to) {
    document.getElementById('history-filter-error').textContent = 'Boshlanish sanasi tugash sanasidan keyin bo‘lmasin.';
    document.getElementById('history-date-to').focus(); return;
  }
  historyFilterState.set(historyFilterKey(), {...historyDraft});
  refreshHistory(); historyFilterSheet.close();
});
historyFilterSheet.addEventListener('close', () => {
  document.body.style.overflow = historyFilterOverflow;
  const trigger = document.getElementById('history-filter-trigger');
  trigger?.setAttribute('aria-expanded', 'false');
  if (trigger?.getClientRects().length) trigger.focus({preventScroll:true});
});
historyFilterSheet.addEventListener('cancel', event => { if (historyChoosing) { event.preventDefault(); showHistoryFilterFields(historyChoosing); } });
historyFilterSheet.addEventListener('click', event => {
  if (event.target !== historyFilterSheet) return;
  const rect = historyFilterSheet.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) historyFilterSheet.close();
});
document.addEventListener('click', event => {
  if (event.target.closest('#history-filter-trigger')) {
    historyDraft = {...currentHistoryFilters()}; showHistoryFilterFields();
    historyFilterOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    historyFilterSheet.showModal(); document.getElementById('history-filter-trigger').setAttribute('aria-expanded', 'true');
  }
  const remove = event.target.closest('[data-history-remove]');
  if (remove) {
    const next = {...currentHistoryFilters()}; delete next[remove.dataset.historyRemove]; historyFilterState.set(historyFilterKey(), next);
  } else if (event.target.closest('[data-history-reset]')) historyFilterState.delete(historyFilterKey());
  else return;
  refreshHistory(); document.getElementById('history-filter-trigger')?.focus({preventScroll:true});
});
detailBack.addEventListener('click', goBack);
window.addEventListener('popstate', syncRoute);
window.addEventListener('hashchange', syncRoute);

// Only a deliberate rightward gesture from the left edge navigates back.
// Vertical movement remains native page scrolling.
let swipe = null;
function resetSwipe() {
  swipe = null;
  productPage.style.transform = '';
  productPage.classList.remove('swiping');
}
productPage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || innerWidth > 760 || event.clientX > 32 || event.target.closest('button,a,input')) return;
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0 };
});
productPage.addEventListener('pointermove', event => {
  if (!swipe || event.pointerId !== swipe.id) return;
  const dx = event.clientX - swipe.x;
  const dy = Math.abs(event.clientY - swipe.y);
  if (dy > 24 && dy > Math.abs(dx)) { resetSwipe(); return; }
  swipe.dx = dx;
  if (dx > 10 && dx > dy * 1.5) {
    productPage.setPointerCapture(event.pointerId);
    productPage.classList.add('swiping');
    productPage.style.transform = `translateX(${Math.min(dx, 120)}px)`;
  }
});
productPage.addEventListener('pointerup', event => {
  if (!swipe || event.pointerId !== swipe.id) return;
  const shouldReturn = event.clientX - swipe.x >= 80 && Math.abs(event.clientY - swipe.y) < 60;
  resetSwipe();
  if (shouldReturn) goBack();
});
productPage.addEventListener('pointercancel', resetSwipe);
window.addEventListener('popstate', resetSwipe);
syncRoute();

// Deliberately fixed sample sales; these are not live business totals.
function renderHome() {
  const sales = { total: 4850000, receipts: 12, currency: 'UZS' };
  const metrics = [
    ['Bugungi savdo', sales.total, sales.currency],
    ['Cheklar', sales.receipts, 'ta'],
    ['O‘rtacha chek', Math.round(sales.total / sales.receipts), sales.currency],
  ];
  document.getElementById('home-metrics').innerHTML = metrics.map(([label, value, unit]) =>
    `<dl class="metric-card"><dt>${label}</dt><dd>${format(value)} <span class="metric-unit">${unit}</span></dd></dl>`
  ).join('');
  const attention = products.filter(product => product.status === 'low' || product.status === 'zero');
  document.getElementById('attention-count').textContent = `${attention.length} ta mahsulot`;
  document.getElementById('attention-empty').hidden = attention.length > 0;
  document.getElementById('attention-list').innerHTML = attention.map(product =>
    `<a class="attention-card" href="#product=${product.barcode}" data-product="${product.barcode}">
      <div class="attention-top">${status(product)}<span class="attention-quantity">${format(product.quantity)} ${product.unit}</span></div>
      <h3>${product.name}</h3><p>${product.branch}</p>
    </a>`
  ).join('');
}
renderHome();
