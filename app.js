'use strict';
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
    {id: `${product.barcode}-02`, product: product.barcode, date: '2026-09-24', time: '09:15', quantity: product.quantity - remaining + 5, remaining: product.quantity - remaining, currency: product.currency, cost: product.price, sale: product.price * 1.2, order: '—', warehouse: 'Namuna ombor', supplier: 'Ikkinchi namuna ta’minotchi', type: 'Zakup orqali'},
    ...(index === 0 ? [{id: `${product.barcode}-03`, product: product.barcode, date: '2026-09-10', time: '11:05', quantity: 20, remaining: 0, currency: 'USD', cost: 0.65, sale: 0.85, order: 'NAM-0998', warehouse: 'Namuna ombor', supplier: 'Namuna ta’minotchi', type: 'Zayavka orqali'}] : []),
  ];
});
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
function purchaseLink(product, purchase) {
  return `#product=${product.barcode}&purchase=${purchase.id}`;
}
function purchaseHistory(product) {
  const rows = purchases.filter(item => item.product === product.barcode);
  const section = document.createElement('section');
  section.className = 'purchase-history';
  section.setAttribute('aria-labelledby', 'purchase-title');
  section.innerHTML = `<div class="section-heading"><h2 id="purchase-title">Sotib olish</h2><span>${rows.length} ta kirim</span></div>`;
  if (!rows.length) {
    section.innerHTML += `<div class="empty purchase-empty">${icon('box')}<h3>Xarid tarixi yo‘q</h3><p>Bu mahsulot uchun hali kirim yozuvlari mavjud emas.</p></div>`;
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
    block.innerHTML = `<h3>Jami <span class="currency">${currency}</span></h3><dl></dl>`;
    block.querySelector('dl').append(field('Kirish summasi', format(cost)), field('Sotish qiymati', format(sale)), field('Farq', format(sale - cost)));
    totals.append(block);
  });
  const note = document.createElement('p');
  note.className = 'purchase-total-note';
  note.textContent = 'Sotish qiymati kirim miqdori bo‘yicha hisoblangan. Bu amalga oshirilgan savdo yoki foyda emas.';
  section.append(cards, table, totals, note);
  return section;
}
function showProduct(product, purchase = null) {
  if (activeProduct === product.barcode && activePurchase === (purchase?.id || null)) return;
  const restoringPurchase = !purchase && activePurchase && activeProduct === product.barcode ? purchaseReturn : null;
  if (purchase && !activePurchase && activeProduct === product.barcode) {
    purchaseReturn = {scroll: window.scrollY, expanded: detailContent.querySelector('details')?.open, id: purchase.id};
  }
  if (!activeProduct) rememberView();
  detailOrigin = history.state?.rizoFrom === 'home' ? 'home' : (history.state?.rizoFrom === 'reports' ? 'reports' : activeView || 'reports');
  detailBack.setAttribute('aria-label', purchase ? 'Mahsulotga qaytish' : detailOrigin === 'home' ? 'Bosh sahifaga qaytish' : 'Qoldiqlarga qaytish');
  document.getElementById('detail-page-label').textContent = purchase ? 'Kirim tafsiloti' : 'Mahsulot tafsiloti';
  activeProduct = product.barcode;
  activePurchase = purchase?.id || null;
  const summary = document.createElement('section');
  summary.className = 'detail-summary';
  if (purchase) {
    summary.classList.add('purchase-detail-summary');
    summary.innerHTML = `<div class="detail-kicker"><span>${dateLabel(purchase.date)} · ${purchase.time}</span><span class="currency">${purchase.currency}</span></div><h1 id="product-title" tabindex="-1"></h1><p class="purchase-detail-amount">${money(purchase.quantity * purchase.cost, purchase.currency)}<span>Kirish summasi</span></p>`;
    summary.querySelector('h1').textContent = product.name;
    const information = document.createElement('section');
    information.className = 'detail-information';
    information.innerHTML = '<h2>Kirim ma’lumotlari</h2><dl class="detail-fields"></dl>';
    information.querySelector('dl').append(...purchaseFields(product, purchase).map(([label, value]) => field(label, value)));
    detailContent.replaceChildren(summary, information);
  } else {
    summary.innerHTML = `<div class="product-heading"><span class="product-symbol">${icon('box')}</span><div><h1 id="product-title" tabindex="-1"></h1><div class="product-identifiers"><span class="product-barcode">${product.barcode}</span>${status(product)}</div></div></div>
      <dl class="detail-totals"><div><dt>Qoldiq</dt><dd>${format(product.quantity)} <span class="unit">${product.unit}</span></dd></div><div><dt>Kirish qiymati · ${product.currency}</dt><dd>${format(product.quantity * product.price)}</dd></div></dl>
      <details class="product-metadata"><summary>Mahsulot ma’lumotlari <span aria-hidden="true">⌄</span></summary><dl class="detail-fields"></dl></details>`;
    summary.querySelector('h1').textContent = product.name;
    summary.querySelector('.detail-fields').append(field('Turkum', product.category), field('Filial', product.branch), field('O‘lchov birligi', product.unit), field('Kirish narxi', money(product.price, product.currency)));
    // Desktop starts expanded; mobile keeps the history near the first screen.
    summary.querySelector('details').open = restoringPurchase ? restoringPurchase.expanded : innerWidth > 760;
    detailContent.replaceChildren(summary, purchaseHistory(product));
  }
  const note = document.createElement('p');
  note.className = 'stage-note';
  note.textContent = 'Sinov ma’lumotlari. Mahsulot va xarid tarixi jonli omborga bog‘lanmagan.';
  detailContent.append(note);
  detailContent.classList.toggle('is-purchase-detail', Boolean(purchase));
  workspace.hidden = true;
  productPage.hidden = false;
  document.title = `${purchase ? 'Kirim · ' : ''}${product.name} · Rizo Store`;
  window.scrollTo(0, restoringPurchase?.scroll || 0);
  const returnLink = restoringPurchase && [...detailContent.querySelectorAll('[data-purchase]')].find(link => link.dataset.purchase === restoringPurchase.id && link.getClientRects().length);
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
  returning = false;
  const code = new URLSearchParams(location.hash.slice(1)).get('product');
  const product = products.find(item => item.barcode === code);
  if (product) {
    const purchaseId = new URLSearchParams(location.hash.slice(1)).get('purchase');
    const purchase = purchases.find(item => item.id === purchaseId && item.product === product.barcode);
    showProduct(product, purchase || null); return;
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
    else { history.replaceState(null, '', `#product=${activeProduct}`); syncRoute(); }
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
  const purchaseLink = event.target.closest('a[data-purchase]');
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
