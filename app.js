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
function animateUI(element, frames, duration = 220, delay = 0) {
  if (!element || reducedMotion.matches || !element.animate) return;
  elementMotion.get(element)?.cancel();
  const animation = element.animate(frames, {duration, delay, easing: 'cubic-bezier(.2,.75,.25,1)'});
  elementMotion.set(element, animation);
  motionAnimations.add(animation);
  const cleanup = () => motionAnimations.delete(animation);
  animation.addEventListener('finish', cleanup, {once:true});
  animation.addEventListener('cancel', cleanup, {once:true});
  return animation;
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
  if (control.matches('input:not([type=checkbox]):not([type=radio]),select,textarea')) return;
  const surface = control.closest('.filter-option, .stock-card, .purchase-card, .attention-card, .home-action') || control;
  animateUI(surface, [{scale: surface.matches('.stock-card,.purchase-card,.attention-card,.home-action') ? '.99' : '.97', filter: 'brightness(.94)'}, {scale: '1', filter: 'brightness(1)'}], 160);
}, {capture:true});
// A small entrance for deliberate result changes; typing stays visually stable.
function animateResults(root) {
  if (reducedMotion.matches || document.activeElement?.matches('input[type="search"]')) return;
  const candidates = [...root.querySelectorAll('.stock-card,.purchase-card,.empty,tbody')];
  candidates.filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight;
  }).slice(0,8).forEach((element,index) => animateUI(element,
    [{opacity:.55,translate:'0 6px'},{opacity:1,translate:'0 0'}],180,Math.min(index*18,72)));
}

// Keep native details semantics, including Enter/Space, while animating both ways.
const disclosureMotion = new WeakMap();
document.addEventListener('click', event => {
  const summary = event.target.closest('summary');
  const details = summary?.parentElement;
  if (!details?.matches('.product-metadata,.barcode-search')) return;
  event.preventDefault();
  const previous = disclosureMotion.get(details);
  const expanded = !(previous ? previous.expanded : details.open);
  const from = details.getBoundingClientRect().height;
  const state = {expanded,animation:null};
  disclosureMotion.set(details,state);
  previous?.animation?.cancel();
  const finish = () => {
    if (disclosureMotion.get(details) !== state) return;
    details.open = expanded;
    details.classList.remove('disclosure-moving');
    disclosureMotion.delete(details);
  };
  if (reducedMotion.matches || !details.animate) { finish(); return; }
  details.open = expanded;
  const to = details.getBoundingClientRect().height;
  details.open = true;
  details.classList.add('disclosure-moving');
  state.animation = animateUI(details,[{height:`${from}px`},{height:`${to}px`}],200);
  state.animation.finished.then(finish,finish);
});

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
  gross: {title: historyTitles.gross, detail: 'Daromad tafsiloti', rows: grossHistory, fields: grossFields, amount: item => item.gross, amountLabel: 'Yalpi daromad', party: item => item.supplier,
    metrics: (product, item) => [['Miqdori', `${format(item.quantity)} ${product.unit}`], ['Sotish narxi', money(item.sale, item.currency)]],
    tags: item => `<span class="status ${item.gross < 0 ? 'zero' : 'ok'}">${item.source}</span>`,
    totals: rows => [['Yalpi daromad', rows.reduce((sum, item) => sum + item.gross, 0)]]},
  'sales-return': {title: historyTitles['sales-return'], detail: 'Savdo qaytishi tafsiloti', rows: salesReturns, fields: saleReturnFields, amount: item => item.total, amountLabel: 'Qaytarish summasi', party: item => item.buyer,
    metrics: (product, item) => [['Qaytarildi', `${format(item.quantity)} ${product.unit}`], ['Qaytarilgan to‘lov', money(item.paid, item.currency)]],
    tags: item => `<span class="history-type">${item.type}</span><span class="status zero">Savdodan qaytish</span>`,
    totals: () => []},
  returns: {title: historyTitles.returns, detail: 'Qaytish tafsiloti', rows: supplierReturns, fields: supplierReturnFields, amount: item => item.quantity * item.cost, amountLabel: 'Qaytarish summasi', party: item => item.supplier,
    metrics: (product, item) => [['Qaytarildi', `${format(item.quantity)} ${product.unit}`], ['Kirish narxi', money(item.cost, item.currency)]],
    tags: item => `<span class="history-reason">Sabab: ${item.reason}</span>`,
    totals: () => []},
  sales: {title: historyTitles.sales, detail: 'Savdo tafsiloti', rows: salesHistory, fields: saleFields, amount: item => item.total, amountLabel: 'Jami to‘lov', party: item => item.buyer,
    metrics: (product, item) => [['Miqdori', `${format(item.quantity)} ${product.unit}`], ['To‘langan', money(item.paid, item.currency)]],
    tags: item => `<span class="history-type">${item.type}</span><span class="status ${item.paid < item.total ? 'low' : 'ok'}">${item.paid < item.total ? 'Qisman to‘langan' : 'To‘langan'}</span>`,
    totals: rows => [['Umumiy hisob', rows.reduce((sum, item) => sum + item.total, 0)]]},
};
const dateLabel = value => value.split('-').reverse().join('.');
const money = (value, currency) => `${format(value)} ${currency}`;
const paths={chevronRight:'<path d="m9 5 7 7-7 7"/>',chevronLeft:'<path d="m15 5-7 7 7 7"/>',chevronDown:'<path d="m5 9 7 7 7-7"/>',arrowUp:'<path d="M12 20V4m-6 6 6-6 6 6"/>',arrowDown:'<path d="M12 4v16m-6-6 6 6 6-6"/>',sort:'<path d="M8 20V4m-4 4 4-4 4 4M16 4v16m-4-4 4 4 4-4"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',back:'<path d="m14 5-7 7 7 7M7 12h14"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',filter:'<path d="M3 5h18l-7 8v7l-4-2v-5Z"/>',export:'<path d="M12 16V3m-4 4 4-4 4 4M4 14v7h16v-7"/>',print:'<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6Z"/>',house:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',box:'<path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5"/>',chart:'<path d="M4 3v18h17M8 16v-5M13 16V7M18 16V4"/>',cart:'<path d="M2 3h3l3 13h11l3-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3"/>',document:'<path d="M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h8"/>'};
const icon=name=>`<svg class="${name.startsWith('chevron')?'ui-chevron':['arrowUp','arrowDown','sort'].includes(name)?'ui-direction':'ui-icon'}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.document}</svg>`;
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
const statusLabels={low:'Kam qolgan',zero:'Tugagan',ok:'Yetarli',negative:'Salbiy qoldiq'};
const status=product=>`<span class="status ${product.status}">${statusLabels[product.status]}</span>`;
const search=document.getElementById('search');
const stockDate = '2026-10-06';
let stockTab='stock';
const reportSearches={stock:'',reserved:''};
const reportBarcodes={stock:'',reserved:''};
const barcodeSearch=document.getElementById('barcode-search');
const reportPages={stock:1,reserved:1};
const reportSorts={stock:{key:'',direction:'desc'},reserved:{key:'',direction:'desc'}};
const historySorts={};
let sortContext='report';
const expiryLabels = {dated:'Muddati kiritilgan',soon:'Yaqinda tugaydigan',expired:'Muddati o‘tgan'};
products.forEach((p,i)=>Object.assign(p,{salePrice:p.price*1.2,supplier:i%2?'Ikkinchi namuna ta’minotchi':'Namuna ta’minotchi',warehouse:i%2?'Ikkinchi namuna ombor':'Namuna ombor',variant:i===2?'20 mm · oq':'—',expiry:i===1?'2026-09-30':i===2?'2026-10-20':'',batch:`NAM-PARTIYA-${i+1}`,received:i%2?'2026-09-24':'2026-10-05',minimum:[10,20,500,5,3,10][i]}));
// Split fixture lines demonstrate grouping and negative balances without touching live stock.
const stockLots = products.flatMap((p,i)=>i===0?[{...p,id:'stock-1a',quantity:3},{...p,id:'stock-1b',quantity:2}]:i===1?[{...p,id:'stock-2a',quantity:123},{...p,id:'stock-2b',quantity:-3}]:[{...p,id:`stock-${i+1}`}]);
const filterLabels = {branch:'Filial',supplier:'Ta’minotchi',warehouse:'Ombor',unit:'O‘lchov birligi',currency:'Valyuta',status:'Qoldiq holati',expiryState:'Muddat holati',from:'Sanadan boshlab',min:'Miqdor dan',max:'Miqdor gacha',negative:'Salbiy qoldiq',group:'Guruhlash',minimum:'Minimal qoldiq',convert:'Konvertatsiya',target:'Natija valyutasi'};
const emptyFilters = () => ({branch:'',supplier:'',warehouse:'',unit:'',currency:'',status:'',expiryState:'',from:'',min:'',max:'',negative:true,group:true,minimum:false,convert:false,target:'UZS',rate:'12500'});
let filters=emptyFilters(),draftFilters=emptyFilters();
let stockPageNumber=1;
const stockPageSize=6;
const stockColumnDefs=[
  ['rowNumber','№',(_p,index)=>index+1],  ['name','Mahsulot nomlari',p=>p.name],['variant','Variatsiya',p=>p.variant],['barcode','Shtrix-kod',p=>p.barcode],['category','Turkum',p=>p.category],['quantity','Miqdori',p=>p.quantity],['currency','Valyuta',p=>p.currency],['unit','O‘lchov birligi',p=>p.unit],['expiry','Yaroqlilik muddati',p=>p.expiry?dateLabel(p.expiry):'—'],['expiryState','Muddat holati',p=>stockExpiry(p)||'—'],['price','Kirish narxi',p=>p.price],['salePrice','Sotish narxi',p=>p.salePrice],['costTotal','Yakuniy kirish narxi',p=>p.quantity*p.price],['saleTotal','Umumiy miqdor',p=>p.quantity*p.salePrice],['branch','Filial',p=>p.branch],['supplier','Ta’minotchi',p=>p.supplier],['batch','Ishlab chiqarish raqami',p=>p.batch]
];
let stockColumns=stockColumnDefs.map(([key])=>key),stockColumnDraft=[];
try{const saved=JSON.parse(localStorage.getItem('rizo-stock-columns-v2'));if(Array.isArray(saved)&&saved.includes('name'))stockColumns=[...new Set(saved.filter(key=>stockColumnDefs.some(([id])=>id===key)))];}catch{}
function stockExpiry(p){if(!p.expiry)return '';if(p.expiry<stockDate)return expiryLabels.expired;return p.expiry<='2026-11-05'?expiryLabels.soon:'Muddati bor';}
function stockStatus(p){return p.quantity<0?'negative':p.quantity===0?'zero':p.quantity<=p.minimum?'low':'ok';}
function filteredStockRows(){
  const query=search.value.trim().toLocaleLowerCase('uz');
  let rows=stockLots.filter(p=>`${p.name} ${p.barcode}`.toLocaleLowerCase('uz').includes(query)&&(!barcodeSearch.value.trim()||p.barcode.toLocaleLowerCase('uz').includes(barcodeSearch.value.trim().toLocaleLowerCase('uz')))&&['branch','supplier','warehouse','unit'].every(key=>!filters[key]||p[key]===filters[key])&&(filters.convert||!filters.currency||p.currency===filters.currency)&&(!filters.from||p.received>=filters.from)&&(filters.negative||p.quantity>=0)&&(!filters.expiryState||(filters.expiryState==='dated'?!!p.expiry:stockExpiry(p)===expiryLabels[filters.expiryState])));
  if(filters.group){const grouped=new Map();rows.forEach(p=>{const key=JSON.stringify([p.barcode,p.variant,p.currency,p.price,p.salePrice,p.branch,p.warehouse,p.supplier,p.expiry,p.batch]);if(grouped.has(key))grouped.get(key).quantity+=p.quantity;else grouped.set(key,{...p,id:`group-${p.id}`});});rows=[...grouped.values()];}
  rows=rows.filter(p=>(!filters.status||stockStatus(p)===filters.status)&&(!filters.minimum||p.quantity<=p.minimum)&&(filters.min===''||p.quantity>=Number(filters.min))&&(filters.max===''||p.quantity<=Number(filters.max)));
  if(filters.convert){const target=filters.currency||'UZS',rate=12500;rows=rows.map(p=>{const factor=p.currency===target?1:p.currency==='USD'?rate:1/rate;return {...p,price:p.price*factor,salePrice:p.salePrice*factor,currency:target};});}
  return sortReportRows(rows,stockColumnDefs,reportSorts.stock);
}
function sortReportRows(rows,definitions,selection,history=false){
  if(!selection.key||['rowNumber','№'].includes(selection.key))return rows;
  const definition=definitions.find(([key])=>key===selection.key);if(!definition)return rows;
  const numericHistory=['Kirish miqdori','Qoldiq miqdori','Miqdori','Kirish narxi','Sotish narxi','Sotib olish narxi','Yakuniy kirish narxi','Yakuniy narx','To‘langan','Umumiy to‘lov miqdori','Yalpi daromad'];
  const value=row=>{if(['date','Yaratilgan sana'].includes(selection.key))return `${row.date}T${row.time}`;if(selection.key==='synced')return row.synced;if(selection.key==='expiry')return row.expiry;if(selection.key==='paymentDate')return row.paymentDate;const raw=definition[2](row);return history&&numericHistory.includes(selection.key)?Number(String(raw).replace(/[^0-9,.-]/g,'').replace(',','.')):raw;};
  return [...rows].sort((left,right)=>{const a=value(left),b=value(right),order=typeof a==='number'&&typeof b==='number'?a-b:String(a??'').localeCompare(String(b??''),'uz',{numeric:true});return selection.direction==='asc'?order:-order;});
}
function sortHeader(key,label,context,interactive=true){
  if(!interactive||['rowNumber','№'].includes(key))return `<th scope="col">${label}</th>`;
  const selected=context==='invoice-item'?invoiceItemView().sort:context==='returns'?returnsSort:context==='sales'?salesSort:context==='goods'?goodsSort:context==='invoice'?invoiceSort:context==='report'?reportSorts[stockTab]:historySorts[activeHistoryMode];const current=selected?.key===key;
  return `<th scope="col" aria-sort="${current?(selected.direction==='asc'?'ascending':'descending'):'none'}"><button class="table-sort" data-sort-key="${key}" data-sort-context="${context}" aria-label="${label} bo‘yicha saralash">${label}<span aria-hidden="true">${icon(current?(selected.direction==='asc'?'arrowUp':'arrowDown'):'sort')}</span></button></th>`;
}
function activeStockFilters(){const defaults=emptyFilters();return Object.entries(filters).filter(([key,value])=>!['target','rate'].includes(key)&&value!==defaults[key]);}
function selectedStockColumns(){return stockColumns.map(key=>stockColumnDefs.find(([id])=>id===key));}
function stockTableMarkup(rows,links=true){const columns=selectedStockColumns();return `<table><thead><tr>${columns.map(([key,label])=>sortHeader(key,label,'report',links)).join('')}</tr></thead><tbody>${rows.map((p,i)=>`<tr>${columns.map(([key,,value])=>{const v=value(p,links?(stockPageNumber-1)*stockPageSize+i:i);return `<td class="${typeof v==='number'?'numeric':''}">${key==='name'&&links?`<a class="product-link" href="#product=${p.barcode}${!filters.group?`&lot=${p.id}`:''}" data-product="${p.barcode}">${v}</a>`:typeof v==='number'?format(v):v}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;}
function stockTotalsMarkup(rows){return [...new Set(rows.map(p=>p.currency))].map(currency=>{const list=rows.filter(p=>p.currency===currency);return `<section class="purchase-total"><h3>Jami <span class="currency">${currency}</span></h3><dl><div><dt>Kirish qiymati</dt><dd>${format(list.reduce((n,p)=>n+p.quantity*p.price,0))}</dd></div><div><dt>Sotish qiymati</dt><dd>${format(list.reduce((n,p)=>n+p.quantity*p.salePrice,0))}</dd></div></dl></section>`;}).join('');}
function render(){document.querySelector('.barcode-search summary .barcode-label').textContent=barcodeSearch.value.trim()?`Shtrix-kod · ${barcodeSearch.value.trim()}`:'Shtrix-kod bo‘yicha qidirish';if(stockTab==='reserved')renderReserved();else renderStock();animateResults(document.getElementById('main'));}
function renderStock(){
  document.querySelector('#empty h2').textContent='Mahsulot topilmadi';
  const rows=filteredStockRows();const pages=Math.max(1,Math.ceil(rows.length/stockPageSize));stockPageNumber=Math.min(Math.max(stockPageNumber,1),pages);const visible=rows.slice((stockPageNumber-1)*stockPageSize,stockPageNumber*stockPageSize);
  document.getElementById('result-count').textContent=`${rows.length} ta ${filters.group?'mahsulot':'qator'}`;
  document.querySelector('#main .table-wrap').innerHTML=stockTableMarkup(visible);
  document.getElementById('cards').innerHTML=visible.map(p=>`<article class="stock-card"><div class="card-head"><h2><a class="product-link" href="#product=${p.barcode}${!filters.group?`&lot=${p.id}`:''}" data-product="${p.barcode}">${p.name}</a></h2><span class="currency">${p.currency}</span></div><dl class="card-values"><div><dt>Qoldiq</dt><dd>${format(p.quantity)} <span class="unit">${p.unit}</span></dd></div><div><dt>Kirish qiymati</dt><dd>${format(p.quantity*p.price)}</dd></div></dl><div class="stock-card-flags">${stockStatus(p)!=='ok'?status({...p,status:stockStatus(p)}):''}${stockExpiry(p)?`<span class="status ${p.expiry<stockDate?'zero':'low'}">${stockExpiry(p)}</span>`:''}</div></article>`).join('');
  document.getElementById('empty').hidden=!!rows.length;document.querySelector('#main .table-wrap').hidden=!rows.length;document.getElementById('cards').hidden=!rows.length;
  const note=document.getElementById('stock-context-note');note.hidden=!filters.convert&&filters.group;note.textContent=[filters.convert?`Namuna kursi: 1 USD = ${format(Number(filters.rate))} UZS. Hisobot ${(filters.currency||'UZS')} da; mahsulot tafsilotida asl valyuta ko‘rsatiladi.`:'',!filters.group?'Qoldiq qatorlari alohida ko‘rsatilgan.':''].filter(Boolean).join(' ');
  document.getElementById('stock-totals').innerHTML=stockTotalsMarkup(rows);
  const pager=document.getElementById('stock-pagination');pager.hidden=pages<=1;pager.innerHTML=`<button class="outline-button" data-stock-page="${stockPageNumber-1}" ${stockPageNumber===1?'disabled':''} aria-label="Oldingi qoldiq sahifasi">${icon('chevronLeft')}</button><span>${stockPageNumber} / ${pages}</span><button class="outline-button" data-stock-page="${stockPageNumber+1}" ${stockPageNumber===pages?'disabled':''} aria-label="Keyingi qoldiq sahifasi">${icon('chevronRight')}</button>`;
  renderFilterChips();document.getElementById('clear-search').textContent='Qidiruv va filtrlarni tozalash';
}
function resetStockPage(){stockPageNumber=1;reportPages[stockTab]=1;reportSearches[stockTab]=search.value;reportBarcodes[stockTab]=barcodeSearch.value;render();}
search.addEventListener('input',resetStockPage);
barcodeSearch.addEventListener('input',resetStockPage);
document.getElementById('clear-search').addEventListener('click',()=>{search.value='';barcodeSearch.value='';if(stockTab==='reserved')reservedFilters=emptyReservedFilters();else filters=emptyFilters();resetStockPage();search.focus();});
function closeDrawers(){document.querySelectorAll('.drawer[open]').forEach(dialog=>dialog.close())}
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{const dialog=document.getElementById(button.dataset.open);dialog.showModal();button.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}));
document.querySelectorAll('.drawer').forEach(dialog=>{dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.style.overflow='';document.querySelectorAll(`[data-open="${dialog.id}"]`).forEach(button=>button.setAttribute('aria-expanded','false'));});dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});});
document.querySelector('[data-remainder]').addEventListener('click',()=>navigate('reports'));
const filterSheet=document.getElementById('filter-sheet'),filterTrigger=document.getElementById('filter-trigger'),filterFields=document.getElementById('filter-fields'),filterOptions=document.getElementById('filter-options'),filterChoiceBack=document.getElementById('filter-choice-back'),filterFooter=document.getElementById('filter-footer'),stockOptionSearch=document.getElementById('stock-option-search');
let choosingFilter=null,previousBodyOverflow='';
function filterValue(key,value){if(key==='convert')return `1 USD = ${format(Number(filters.rate))} UZS → ${(filters.currency||'UZS')}`;if(typeof value==='boolean')return value?'Yoqilgan':'O‘chirilgan';if(key==='from')return value?dateLabel(value):'Barchasi';return value?(key==='status'?statusLabels[value]:key==='expiryState'?expiryLabels[value]:value):'Barchasi';}
function renderFilterChips(){const chips=document.getElementById('filter-chips');chips.replaceChildren();const active=activeStockFilters();const badge=document.getElementById('filter-count');badge.hidden=!active.length;badge.textContent=active.length;filterTrigger.setAttribute('aria-label',active.length?`Filtr, ${active.length} ta faol`:'Filtr');active.forEach(([key,value])=>{const button=document.createElement('button');button.className='filter-chip';const label=`${filterLabels[key]}: ${filterValue(key,value)}`;button.textContent=`${label} ×`;button.setAttribute('aria-label',`${label} filtrini olib tashlash`);button.addEventListener('click',()=>{filters[key]=emptyFilters()[key];resetStockPage();filterTrigger.focus({preventScroll:true});});chips.append(button);});}
function filterInput(container,key,label,type='number'){const wrapper=document.createElement('label');const title=document.createElement('span');title.textContent=label;const input=document.createElement('input');input.type=type;input.id=`stock-filter-${key}`;input.value=draftFilters[key];if(type==='number')input.step='any';input.addEventListener('input',()=>{draftFilters[key]=input.value;document.getElementById('stock-filter-error').textContent='';});wrapper.append(title,input);container.append(wrapper);}
function showFilterFields(focusKey){choosingFilter=null;document.getElementById('filter-title').textContent='Qoldiq filtri';filterFields.hidden=false;filterOptions.hidden=true;filterChoiceBack.hidden=true;filterFooter.hidden=false;document.getElementById('stock-filter-error').textContent='';filterFields.replaceChildren();
  ['branch','supplier','warehouse','unit','currency','expiryState'].forEach(key=>{const button=document.createElement('button');button.className='filter-field';button.dataset.field=key;button.innerHTML=`<span class="filter-label">${filterLabels[key]}</span><strong>${filterValue(key,draftFilters[key])}</strong><span class="field-arrow" aria-hidden="true">${icon('chevronRight')}</span>`;button.addEventListener('click',()=>showFilterChoices(key));filterFields.append(button);});
  const inputs=document.createElement('div');inputs.className='history-date-fields';filterInput(inputs,'from','Sanadan boshlab','date');filterInput(inputs,'min','Miqdor dan');filterInput(inputs,'max','Miqdor gacha');filterFields.append(inputs);
  [['negative','Salbiy qoldiqni ham ko‘rsatish'],['group','Bir xil kirimlarni guruhlash'],['minimum','Minimal qoldiqdan kam yoki teng'],['convert','Valyutani konvertatsiya qilish']].forEach(([key,title])=>{const label=document.createElement('label');label.className='filter-option stock-toggle';const input=document.createElement('input');input.type='checkbox';input.checked=draftFilters[key];input.addEventListener('change',()=>{draftFilters[key]=input.checked;});const name=document.createElement('span');name.textContent=title;label.append(input,name);filterFields.append(label);});
  if(focusKey)filterFields.querySelector(`[data-field="${focusKey}"]`)?.focus({preventScroll:true});if(filterSheet.open)enterContent(filterFields,-1,12);
}
function renderStockChoices(){const list=document.getElementById('filter-option-list');list.replaceChildren();const key=choosingFilter;const source=key==='target'?['UZS','USD']:key==='status'?Object.keys(statusLabels):key==='expiryState'?Object.keys(expiryLabels):[...new Set(stockLots.map(p=>p[key]))];const query=stockOptionSearch.value.trim().toLocaleLowerCase('uz');const values=(key==='target'?source:['',...source]).filter(v=>filterValue(key,v).toLocaleLowerCase('uz').includes(query));values.forEach(value=>{const label=document.createElement('label');label.className='filter-option';const input=document.createElement('input');input.type='radio';input.name='filter-choice';input.value=value;input.checked=draftFilters[key]===value;const text=document.createElement('span');text.textContent=filterValue(key,value);input.addEventListener('click',()=>{draftFilters[key]=value;showFilterFields(key);});label.append(input,text);list.append(label);});document.getElementById('stock-no-options').hidden=!!values.length;}
function showFilterChoices(key){choosingFilter=key;document.getElementById('filter-title').textContent=filterLabels[key];filterFields.hidden=true;filterOptions.hidden=false;filterChoiceBack.hidden=false;filterFooter.hidden=true;stockOptionSearch.value='';stockOptionSearch.closest('label').hidden=!['supplier','warehouse','branch','unit'].includes(key);renderStockChoices();document.querySelector('#filter-option-list input:checked')?.focus({preventScroll:true});enterContent(filterOptions,1,12);}
stockOptionSearch.addEventListener('input',renderStockChoices);
filterTrigger.addEventListener('click',()=>{if(stockTab==='reserved'){openReservedFilter();return;}draftFilters={...filters};showFilterFields();previousBodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';filterSheet.showModal();filterTrigger.setAttribute('aria-expanded','true');});
filterChoiceBack.addEventListener('click',()=>showFilterFields(choosingFilter));document.getElementById('filter-close').addEventListener('click',()=>filterSheet.close());document.getElementById('filter-reset').addEventListener('click',()=>{draftFilters=emptyFilters();showFilterFields();});
document.getElementById('filter-apply').addEventListener('click',()=>{let error='';if(draftFilters.min!==''&&draftFilters.max!==''&&Number(draftFilters.min)>Number(draftFilters.max))error='Miqdorning quyi chegarasi yuqori chegaradan oshmasin.';if(draftFilters.convert&&(!Number.isFinite(Number(draftFilters.rate))||Number(draftFilters.rate)<=0))error='Konvertatsiya kursi noldan katta bo‘lsin.';document.getElementById('stock-filter-error').textContent=error;if(error)return;filters={...draftFilters};resetStockPage();filterSheet.close();});
filterSheet.addEventListener('close',()=>{document.body.style.overflow=previousBodyOverflow;filterTrigger.setAttribute('aria-expanded','false');if(filterTrigger.getClientRects().length)filterTrigger.focus({preventScroll:true});});filterSheet.addEventListener('cancel',event=>{if(choosingFilter){event.preventDefault();showFilterFields(choosingFilter);}});filterSheet.addEventListener('click',event=>{if(event.target!==filterSheet)return;const rect=filterSheet.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)filterSheet.close();});
render();

// Report actions only operate on the local, filtered fixture rows.
const stockColumnsSheet=document.getElementById('stock-columns-sheet'),stockPrintPreview=document.getElementById('stock-print-preview');
let stockDialogOverflow='',columnContext='report';
const historyColumnProfiles={};
try{Object.assign(historyColumnProfiles,JSON.parse(localStorage.getItem('rizo-history-columns'))||{});}catch{}
function reportActionData(){if(stockTab==='reserved')return {title:'Zaxiralangan mahsulotlar',rows:filteredReservedRows(),columns:reservedColumns.map(key=>reservedColumnDefs.find(([id])=>id===key)),table:reservedTableMarkup,totals:reservedTotalsMarkup};return {title:'Qoldiq',rows:filteredStockRows(),columns:selectedStockColumns(),table:stockTableMarkup,totals:stockTotalsMarkup};}
function openStockDialog(dialog){if(dialog===stockPrintPreview){document.querySelector('#stock-print-preview>.choice-note').textContent='Tanlangan ustunlar va filtrga mos barcha qatorlar. Qog‘oz yo‘nalishi: albom.';document.getElementById('label-print-page').textContent='';}stockDialogOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}
[stockColumnsSheet,stockPrintPreview].forEach(dialog=>{dialog.querySelector('[data-close-stock-dialog]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.style.overflow=stockDialogOverflow;});dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});});
function currentColumnDefs(){if(columnContext==='returns')return returnsColumnDefs;if(columnContext==='sales')return salesColumnDefs;if(columnContext==='invoice-item')return invoiceItemDefs;if(columnContext==='goods')return goodsColumnDefs;if(columnContext==='invoice')return invoiceColumnDefs;if(columnContext==='history')return historyColumnDefinitions(activeHistoryMode);return stockTab==='reserved'?reservedColumnDefs:stockColumnDefs;}
function currentColumns(){if(columnContext==='returns')return returnsColumns;if(columnContext==='sales')return salesColumns;if(columnContext==='invoice-item')return invoiceItemColumns;if(columnContext==='goods')return goodsColumns;if(columnContext==='invoice')return invoiceColumns;if(columnContext==='history')return selectedHistoryColumns(activeHistoryMode);return stockTab==='reserved'?reservedColumns:stockColumns;}
function renderStockColumnChoices(){const list=document.getElementById('stock-columns-list');list.replaceChildren();stockColumnDraft.forEach((item,index)=>{const line=document.createElement('div');line.className='column-choice';const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.checked=item.visible;input.disabled=item.key==='invoiceId'||item.key==='name'||item.key==='Mahsulot nomi';input.addEventListener('change',()=>item.visible=input.checked);const name=document.createElement('span');name.textContent=currentColumnDefs().find(([key])=>key===item.key)[1];label.append(input,name);line.append(label);[['arrowUp',-1,'Yuqoriga'],['arrowDown',1,'Pastga']].forEach(([symbol,offset,title])=>{const button=document.createElement('button');button.className='icon-button';button.innerHTML=icon(symbol);button.setAttribute('aria-label',`${name.textContent}: ${title}`);button.disabled=index+offset<0||index+offset>=stockColumnDraft.length;button.addEventListener('click',()=>{[stockColumnDraft[index],stockColumnDraft[index+offset]]=[stockColumnDraft[index+offset],stockColumnDraft[index]];renderStockColumnChoices();const moved=list.children[index+offset];moved?.querySelector('input')?.focus({preventScroll:true});animateUI(moved,[{translate:`0 ${-offset*12}px`,opacity:.6},{translate:'0 0',opacity:1}],180);});line.append(button);});list.append(line);});}
document.getElementById('stock-columns-reset').addEventListener('click',()=>{stockColumnDraft=currentColumnDefs().map(([key])=>({key,visible:true}));renderStockColumnChoices();});
document.getElementById('stock-columns-apply').addEventListener('click',()=>{const selected=stockColumnDraft.filter(c=>c.visible).map(c=>c.key);if(columnContext==='returns'){returnsColumns=selected;try{localStorage.setItem('rizo-returns-columns-v1',JSON.stringify(selected));}catch{}renderReturns();stockColumnsSheet.close();return;}if(columnContext==='sales'){salesColumns=selected;try{localStorage.setItem('rizo-sales-columns-v1',JSON.stringify(selected));}catch{}renderSales();stockColumnsSheet.close();return;}if(columnContext==='invoice-item'){invoiceItemColumns=selected;try{localStorage.setItem('rizo-invoice-item-columns-v1',JSON.stringify(selected));}catch{}renderInvoiceItems();stockColumnsSheet.close();return;}if(columnContext==='goods'){goodsColumns=selected;try{localStorage.setItem('rizo-goods-columns-v1',JSON.stringify(selected));}catch{}renderGoods();stockColumnsSheet.close();return;}if(columnContext==='invoice'){invoiceColumns=selected;try{localStorage.setItem('rizo-invoice-columns-v1',JSON.stringify(selected));}catch{}renderInvoices();stockColumnsSheet.close();return;}if(columnContext==='history'){historyColumnProfiles[activeHistoryMode]=selected;try{localStorage.setItem('rizo-history-columns',JSON.stringify(historyColumnProfiles));}catch{}refreshHistory();stockColumnsSheet.close();return;}if(stockTab==='reserved')reservedColumns=selected;else stockColumns=selected;try{localStorage.setItem(stockTab==='reserved'?'rizo-reserved-columns-v2':'rizo-stock-columns-v2',JSON.stringify(selected));}catch{}render();stockColumnsSheet.close();});
function csvCell(value){if(typeof value==='number')return String(value);let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text=`'${text}`;return `"${text.replaceAll('"','""')}"`;}
function reportCSV(data){return '\uFEFF'+[data.columns.map(([,label])=>csvCell(label)).join(','),...data.rows.map((row,index)=>data.columns.map(([, ,value])=>csvCell(value(row,index))).join(','))].join('\r\n');}
function performStockAction(action){
  if(action==='sort'){openSortSheet('report');return;}
  if(action==='refresh'){render();document.getElementById('report-announcement').textContent='Sinov hisoboti yangilandi.';return;}
  if(action==='columns'){columnContext='report';document.querySelector('#stock-columns-sheet .choice-note').textContent=stockTab==='stock'?'Desktop jadvali, eksport va chop etish uchun. Mahsulot nomi doim ko‘rinadi.':'Desktop jadvali va eksport uchun. Mahsulot nomi doim ko‘rinadi.';stockColumnDraft=[...currentColumns(),...currentColumnDefs().map(([key])=>key).filter(key=>!currentColumns().includes(key))].map(key=>({key,visible:currentColumns().includes(key)}));renderStockColumnChoices();openStockDialog(stockColumnsSheet);return;}
  const data=reportActionData();
  if(action==='export'){const url=URL.createObjectURL(new Blob([reportCSV(data)],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download=`rizo-${data.title==='Qoldiq'?'qoldiq':'zaxira'}-${stockDate}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('report-announcement').textContent=`${data.rows.length} ta qator CSV faylga chiqarildi.`;return;}
  if(action==='print'&&stockTab==='stock'){const html=`<h1>${data.title}</h1><p>Sinov ma’lumotlari · ${dateLabel(stockDate)} · ${data.rows.length} ta qator</p>${stockTab==='stock'&&filters.convert?`<p>Namuna kursi: 1 USD = ${format(Number(filters.rate))} UZS · ${(filters.currency||'UZS')}</p>`:''}${data.rows.length?data.table(data.rows,false):'<p>Ma’lumot topilmadi.</p>'}<div class="purchase-totals">${data.totals(data.rows)}</div>`;document.getElementById('stock-print-content').innerHTML=html;document.getElementById('print-area').innerHTML=html;openStockDialog(stockPrintPreview);}
}
document.getElementById('stock-print-confirm').addEventListener('click',()=>window.print());
document.addEventListener('click',event=>{const action=event.target.closest('[data-stock-action]');if(action){performStockAction(action.dataset.stockAction);return;}const page=event.target.closest('[data-stock-page]');if(page){stockPageNumber=Number(page.dataset.stockPage);render();document.getElementById('reports-title').focus({preventScroll:true});window.scrollTo(0,0);}});

const sortSheet=document.getElementById('sort-sheet');let sortOverflow='';
function currentSort(){if(sortContext==='returns')return returnsSort;if(sortContext==='sales')return salesSort;if(sortContext==='invoice-item')return invoiceItemView().sort;if(sortContext==='goods')return goodsSort;if(sortContext==='invoice')return invoiceSort;return sortContext==='history'?(historySorts[activeHistoryMode]||{key:'',direction:'desc'}):reportSorts[stockTab];}
function setSort(key,direction){const selected={key,direction};if(sortContext==='returns'){returnsSort=selected;resetReturnsPage();return;}if(sortContext==='sales'){salesSort=selected;resetSalesPage();return;}if(sortContext==='invoice-item'){invoiceItemView().sort=selected;invoiceItemView().page=1;renderInvoiceItems();return;}if(sortContext==='goods'){goodsSort=selected;resetGoodsPage();return;}if(sortContext==='invoice'){invoiceSort=selected;resetInvoicePage();}else if(sortContext==='history'){historySorts[activeHistoryMode]=selected;refreshHistory();}else{reportSorts[stockTab]=selected;resetStockPage();}}
function renderSortOptions(){const selected=currentSort(),defs=sortContext==='returns'?returnsColumnDefs:sortContext==='sales'?salesColumnDefs:sortContext==='invoice-item'?invoiceItemDefs:sortContext==='goods'?goodsColumnDefs:sortContext==='invoice'?invoiceColumnDefs:sortContext==='history'?historyColumnDefinitions(activeHistoryMode):(stockTab==='reserved'?reservedColumnDefs:stockColumnDefs);const list=document.getElementById('sort-options');list.replaceChildren();[['','Asl tartib'],...defs.filter(([key])=>!['rowNumber','№','labels'].includes(key))].forEach(([key,label])=>{const button=document.createElement('button');button.className='report-choice';button.textContent=label;button.setAttribute('aria-pressed',String(selected.key===key));if(selected.key===key)button.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>');button.addEventListener('click',()=>{setSort(key,currentSort().direction);sortSheet.close();});list.append(button);});document.querySelectorAll('[data-sort-direction]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sortDirection===selected.direction)));}
function openSortSheet(context){sortContext=context;renderSortOptions();sortOverflow=document.body.style.overflow;document.body.style.overflow='hidden';sortSheet.showModal();}
document.getElementById('sort-close').addEventListener('click',()=>sortSheet.close());sortSheet.addEventListener('close',()=>{document.body.style.overflow=sortOverflow;});sortSheet.addEventListener('click',event=>{if(event.target!==sortSheet)return;const r=sortSheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sortSheet.close();});
document.addEventListener('click',event=>{const open=event.target.closest('[data-sort-open]');if(open){openSortSheet(open.dataset.sortOpen);return;}const direction=event.target.closest('[data-sort-direction]');if(direction){setSort(currentSort().key,direction.dataset.sortDirection);renderSortOptions();return;}const header=event.target.closest('[data-sort-key]');if(header){sortContext=header.dataset.sortContext;const selected=currentSort();setSort(header.dataset.sortKey,selected.key===header.dataset.sortKey&&selected.direction==='desc'?'asc':'desc');}});

// Desktop and mobile share the same report destinations.
const reportSections = [['Qoldiqlar', 'reports'], ['Sotib olish', 'invoices'], ['Mahsulot bo‘yicha sotish', 'sales'], ['Qaytish', 'returns'], ['Yalpi daromad'], ['Keshbek'], ['Kassa']];
function updateReportNavigation(view) {
  document.querySelectorAll('.report-tabs').forEach(nav => {
    nav.innerHTML = reportSections.map(([title, route]) => route
      ? `<button data-route="${route}" ${(view==='reserved'?'reports':view==='purchase-goods'?'invoices':view) === route ? 'class="selected" aria-current="page"' : ''}>${title}</button>`
      : `<span aria-disabled="true">${title}</span>`).join('');
  });
}
const reportChoiceSheet = document.getElementById('report-choice-sheet');
let reportChoiceTrigger = null;
let reportChoiceOverflow = '';
document.querySelectorAll('[data-choice-sheet]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    reportChoiceTrigger = trigger;
    const isReports = trigger.dataset.choiceSheet === 'reports',isPurchase=trigger.dataset.choiceSheet==='purchase';
    document.getElementById('report-choice-title').textContent = isPurchase?'Sotib olish':isReports ? 'Hisobotlar' : 'Qo‘shimcha amallar';
    document.getElementById('report-choice-note').textContent = isPurchase?'Ko‘rinishni tanlang.':isReports
      ? 'Qoldiqlar, sotib olish, sotuv va qaytish hisobotlari faol.' : 'Filtrga mos barcha qatorlar uchun.';
    const list = document.getElementById('report-choices');
    list.replaceChildren();
    (isPurchase?[['Hisob-fakturalar','invoices'],['Mahsulotlar bo‘yicha','purchase-goods']]:isReports ? reportSections : [['Saralash','sort'], ['Eksport · CSV','export'], ...(activeView!=='reserved'?[['Chop etish','print']]:[]), ['Jadval ustunlari','columns'], ['Yangilash','refresh']]).forEach(([label, route]) => {
      const button = document.createElement('button'); button.className = 'report-choice';
      const name = document.createElement('span'); name.textContent = label; button.append(name);
      if (route) {
        if ((isPurchase&&route===activeView) || (isReports && route === (activeView==='reserved'?'reports':activeView==='purchase-goods'?'invoices':activeView))) {
          button.setAttribute('aria-current', 'page');
          button.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>');
        }
        button.addEventListener('click', () => { reportChoiceSheet.close(); if(isReports||isPurchase) navigate(route); else requestAnimationFrame(()=>activeView==='returns'?performReturnsAction(route):activeView==='sales'?performSalesAction(route):activeView==='purchase-goods'?performGoodsAction(route):activeView==='invoices'?performInvoiceAction(route):performStockAction(route)); });
      } else {
        button.disabled = true;
        const note = document.createElement('small'); note.textContent = 'Hali ulanmagan'; button.append(note);
      }
      list.append(button);
    });
    reportChoiceOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    reportChoiceSheet.showModal(); trigger.setAttribute('aria-expanded', 'true');
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
const invoicePage = document.getElementById('invoice-report');
let activeGoods = null, activeSales = null, activeReturns = null;
const returnsPage=document.getElementById('returns-report');
const salesPage=document.getElementById('sales-report');
const goodsPage=document.getElementById('goods-report');
let activeInvoice = null;
let activeReservation = null;
let activeView = null;
let activeProduct = null;
let activeStockLot = null;
let activePurchase = null;
let activeHistoryMode = 'purchase';
let purchaseReturn = null;
let detailOrigin = 'reports';
const viewPositions = { home: 0, reports: 0, invoices: 0, reserved: 0, 'purchase-goods': 0, sales: 0, returns: 0 };
const viewFocus = { home: null, reports: null, invoices: null, reserved: null, 'purchase-goods': null, sales: null, returns: null };
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
// Column sets match the visible source tables; full mobile details retain their fields.
function sourceHistoryFields(product,item,mode){
  return historyModes[mode].fields(product,item).filter(([label])=>!['Xaridor','Turi'].includes(label)&&!(mode==='returns'&&label==='Qaytarish summasi')).map(([label,value])=>[mode==='sales-return'?(label==='Qaytarilgan to‘lov'?'To‘langan':label==='Qaytarish summasi'?'Umumiy to‘lov miqdori':label):label,value]);
}
function historyColumnDefinitions(mode){return [['№','№'],...sourceHistoryFields(products[0],historyModes[mode].rows[0],mode).map(([label])=>[label,label])];}
function selectedHistoryColumns(mode){const keys=historyColumnDefinitions(mode).map(([key])=>key),saved=historyColumnProfiles[mode];return Array.isArray(saved)&&saved.includes('Mahsulot nomi')?saved.filter(key=>keys.includes(key)):keys;}
function historyTableMarkup(product,rows,mode){
  const keys=selectedHistoryColumns(mode);
  return `<table><thead><tr>${keys.map(key=>sortHeader(key,key==='Mahsulot nomi'?'Mahsulot nomlari':key,'history')).join('')}</tr></thead><tbody>${rows.map((item,index)=>{const values=Object.fromEntries(sourceHistoryFields(product,item,mode));values['№']=index+1;return `<tr>${keys.map(key=>`<td>${key==='Mahsulot nomi'?`<a class="product-link" href="${historyLink(product,item,mode)}" data-entry="${item.id}">${values[key]}</a>`:values[key]}</td>`).join('')}</tr>`;}).join('')}</tbody></table>`;
}
document.addEventListener('click',event=>{if(!event.target.closest('[data-history-columns]'))return;columnContext='history';document.querySelector('#stock-columns-sheet .choice-note').textContent='Desktop tarix jadvali uchun. Telefonda kartalar va to‘liq tafsilotlar saqlanadi.';stockColumnDraft=[...currentColumns(),...currentColumnDefs().map(([key])=>key).filter(key=>!currentColumns().includes(key))].map(key=>({key,visible:currentColumns().includes(key)}));renderStockColumnChoices();openStockDialog(stockColumnsSheet);});
document.getElementById('columns-select-all').addEventListener('click',()=>{stockColumnDraft.forEach(item=>item.visible=true);renderStockColumnChoices();});
function historyLink(product, item, mode) {
  return `#product=${product.barcode}${activeStockLot?`&lot=${activeStockLot}`:''}&tab=${mode}&entry=${item.id}`;
}
const historyFilterLabels = {currency: 'Valyuta', warehouse: 'Ombor', type: 'Turi', supplier: 'Ta’minotchi', buyer: 'Xaridor', from: 'Sanadan boshlab', to: 'Sanagacha'};
const historyFilterKeys = {
  purchase: ['currency', 'warehouse', 'type', 'supplier', 'from', 'to'],
  sales: ['currency', 'warehouse', 'type', 'buyer', 'from', 'to'],
  returns: ['currency', 'warehouse', 'supplier', 'from', 'to'],
  'sales-return': ['currency', 'warehouse', 'type', 'buyer', 'from', 'to'],
  gross: ['currency', 'warehouse', 'supplier', 'buyer', 'from', 'to'],
};
const historyFilterState = new Map();
const historyFilterKey = (product = activeProduct, mode = activeHistoryMode) => `${product}:${mode}`;
const currentHistoryFilters = (product = activeProduct, mode = activeHistoryMode) => historyFilterState.get(historyFilterKey(product, mode)) || {};
function historyRows(product, mode) {
  const selected = currentHistoryFilters(product.barcode, mode);
  const rows=historyModes[mode].rows.filter(item => item.product === product.barcode && historyFilterKeys[mode].every(key => {
    const value = selected[key];
    if (!value) return true;
    if (key === 'from') return item.date >= value;
    if (key === 'to') return item.date <= value;
    return item[key] === value;
  }));
  const defs=historyColumnDefinitions(mode).map(([key,label])=>[key,label,item=>Object.fromEntries(sourceHistoryFields(product,item,mode))[key]]);
  return sortReportRows(rows,defs,historySorts[mode]||{key:'',direction:'desc'},true);
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
  animateResults(detailContent);
}
function historyNavigation(mode) {
  const nav = document.createElement('nav');
  nav.className = 'history-navigation';
  nav.setAttribute('aria-label', 'Mahsulot tarixi bo‘limlari');
  nav.innerHTML = `<div class="history-tabs">${Object.entries(historyTitles).map(([key, title]) => `<button data-history-mode="${key}" ${historyModes[key] ? '' : 'disabled'} ${key === mode ? 'aria-current="page"' : ''}>${title}</button>`).join('')}</div>
    <button class="history-picker" id="history-picker" aria-haspopup="dialog" aria-controls="history-mode-sheet" aria-expanded="false" aria-label="Tarix bo‘limi: ${historyTitles[mode]}"><span><small>Mahsulot tarixi</small><strong>${historyTitles[mode]}</strong></span><span aria-hidden="true">${icon('chevronDown')}</span></button>`;
  const selected = currentHistoryFilters(activeProduct, mode);
  const active = Object.entries(selected).filter(([key, value]) => historyFilterKeys[mode].includes(key) && value);
  const filterButton = document.createElement('button');
  filterButton.id = 'history-filter-trigger'; filterButton.className = 'outline-button history-filter-trigger';
  filterButton.setAttribute('aria-label', active.length ? `Tarix filtri, ${active.length} ta faol` : 'Tarix filtri');
  filterButton.setAttribute('aria-haspopup', 'dialog'); filterButton.setAttribute('aria-controls', 'history-filter-sheet');
  filterButton.setAttribute('aria-expanded', 'false');
  filterButton.innerHTML = `${icon('filter')}<span class="history-filter-text">Filtr</span>${active.length ? `<span class="history-filter-count">${active.length}</span>` : ''}`;
  nav.append(filterButton);
  const columnsButton=document.createElement('button');columnsButton.className='icon-button history-columns-trigger';columnsButton.dataset.historyColumns='';columnsButton.setAttribute('aria-label','Tarix jadvali ustunlari');columnsButton.setAttribute('aria-haspopup','dialog');columnsButton.innerHTML=icon('grid');nav.append(columnsButton);
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
  section.innerHTML = `<div class="section-heading"><h2 id="purchase-title">${config.title}</h2><span role="status" aria-live="polite">${rows.length} ta yozuv</span><button class="text-button history-sort-button" data-sort-open="history">Saralash</button></div>${config.note ? `<p class="history-notice">${config.note}</p>` : ''}`;
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
    <div class="purchase-card-bottom"><div><span>${config.amountLabel}</span><strong class="${mode === 'gross' ? (config.amount(item) < 0 ? 'amount-negative' : 'amount-positive') : ''}">${money(config.amount(item), item.currency)}</strong></div><a href="${historyLink(product, item, mode)}" data-entry="${item.id}" aria-label="${dateLabel(item.date)} ${item.time} · ${config.detail}">Tafsilot <span aria-hidden="true">${icon('chevronRight')}</span></a></div>
  </article>`).join('');
  const table = document.createElement('div');
  table.className = 'purchase-table'; table.tabIndex = 0;
  table.setAttribute('role', 'region'); table.setAttribute('aria-label', `${config.title} jadvali, gorizontal aylantirish mumkin`);
  table.innerHTML = historyTableMarkup(product,rows,mode);
  const totals = document.createElement('div'); totals.className = 'purchase-totals';
  totals.setAttribute('aria-label', 'Valyuta bo‘yicha yakunlar');
  [...new Set(rows.map(item => item.currency))].forEach(currency => {
    const block = document.createElement('section'); block.className = 'purchase-total';
    block.innerHTML = `<h3>${Object.values(currentHistoryFilters(product.barcode, mode)).some(Boolean) ? 'Filtrlangan jami' : 'Jami'} <span class="currency">${currency}</span></h3><dl></dl>`;
    block.querySelector('dl').append(...config.totals(rows.filter(item => item.currency === currency)).map(([label, value]) => field(label, format(value))));
    if(config.totals(rows.filter(item=>item.currency===currency)).length)totals.append(block);
  });
  section.append(cards, table, totals);
  return section;
}
function purchaseLink(product, purchase) {
  return `#product=${product.barcode}${activeStockLot?`&lot=${activeStockLot}`:''}&purchase=${purchase.id}`;
}
function purchaseHistory(product) {
  const rows = historyRows(product, 'purchase');
  const section = document.createElement('section');
  section.className = 'purchase-history';
  section.setAttribute('aria-labelledby', 'purchase-title');
  section.innerHTML = `<div class="section-heading"><h2 id="purchase-title">Sotib olish</h2><span role="status" aria-live="polite">${rows.length} ta kirim</span><button class="text-button history-sort-button" data-sort-open="history">Saralash</button></div>`;
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
    <div class="purchase-card-bottom"><div><span>Kirish summasi</span><strong>${money(item.quantity * item.cost, item.currency)}</strong></div><a href="${purchaseLink(product, item)}" data-purchase="${item.id}" aria-label="${dateLabel(item.date)} ${item.time} dagi kirim tafsiloti">Tafsilot <span aria-hidden="true">${icon('chevronRight')}</span></a></div>
  </article>`).join('');
  const table = document.createElement('div');
  table.className = 'purchase-table';
  table.tabIndex = 0;
  table.setAttribute('role', 'region');
  table.setAttribute('aria-label', 'Sotib olish jadvali, gorizontal aylantirish mumkin');
  table.innerHTML = historyTableMarkup(product,rows,'purchase');
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
  if (activeProduct === product.barcode && activePurchase === (purchase?.id || null) && activeHistoryMode === mode && activeStockLot === (product.stockLot||null)) return;
  const restoringPurchase = !purchase && activePurchase && activeProduct === product.barcode && activeHistoryMode === mode && purchaseReturn?.product === product.barcode && purchaseReturn?.mode === mode ? purchaseReturn : null;
  if (purchase && !activePurchase && activeProduct === product.barcode) {
    purchaseReturn = {product: product.barcode, mode, scroll: window.scrollY, expanded: detailContent.querySelector('details')?.open, id: purchase.id};
  }
  if (!activeProduct) rememberView();
  detailOrigin = history.state?.rizoFrom === 'home' ? 'home' : (history.state?.rizoFrom === 'reports' ? 'reports' : activeView || 'reports');
  detailBack.setAttribute('aria-label', purchase ? 'Mahsulotga qaytish' : detailOrigin === 'home' ? 'Bosh sahifaga qaytish' : 'Qoldiqlarga qaytish');
  document.getElementById('detail-page-label').textContent = purchase ? config.detail : 'Mahsulot tafsiloti';
  activeProduct = product.barcode;
  activeStockLot = product.stockLot||null;
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
      <details class="product-metadata"><summary>Mahsulot ma’lumotlari <span aria-hidden="true">${icon('chevronDown')}</span></summary><dl class="detail-fields"></dl></details>`;
    summary.querySelector('h1').textContent = product.name;
    summary.querySelector('.detail-fields').append(...[['Turkum',product.category],['Variatsiya',product.variant],['Filial',product.branch],['Ta’minotchi',product.supplier],['O‘lchov birligi',product.unit],['Kirish narxi',money(product.price,product.currency)],['Sotish narxi',money(product.salePrice,product.currency)],['Sotish qiymati',money(product.quantity*product.salePrice,product.currency)],['Yaroqlilik muddati',product.expiry?dateLabel(product.expiry):'Ko‘rsatilmagan'],['Muddat holati',stockExpiry(product)||'Ko‘rsatilmagan'],['Ishlab chiqarish raqami',product.batch]].map(([label,value])=>field(label,value)));
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
  invoicePage.hidden = true;
  activeInvoice = null;
  activeReservation = null;
  productPage.hidden = false;
  document.title = `${purchase ? `${config.detail} · ` : ''}${product.name} · Rizo Store`;
  window.scrollTo(0, restoringPurchase?.scroll || 0);
  const returnLink = restoringPurchase && [...detailContent.querySelectorAll('[data-purchase], [data-entry]')].find(link => (link.dataset.purchase || link.dataset.entry) === restoringPurchase.id && link.getClientRects().length);
  (returnLink || summary.querySelector('h1')).focus({ preventScroll: true });
}

function rememberView() {
  if (!activeView || activeProduct || activeInvoice || activeReservation || activeGoods || activeSales || activeReturns) return;
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
  if (activeView === view && !activeProduct && !activeInvoice && !activeReservation && !activeGoods && !activeSales && !activeReturns) {
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
  const wasLabels = Boolean(activeLabels);
  const before = {returns:activeReturns,sales:activeSales,invoiceLine:activeInvoiceLine,goods:activeGoods, view: activeView, product: activeProduct, entry: activePurchase, mode: activeHistoryMode, invoice: activeInvoice, reservation: activeReservation};
  applyRoute();
  const changed = before.returns !== activeReturns || before.sales !== activeSales || before.invoiceLine !== activeInvoiceLine || before.goods !== activeGoods || wasLabels !== Boolean(activeLabels) || before.reservation !== activeReservation || before.invoice !== activeInvoice || before.view !== activeView || before.product !== activeProduct || before.entry !== activePurchase || before.mode !== activeHistoryMode;
  if (!changed) return;
  // Cancel outgoing motion so fast navigation never leaves a stale effect.
  motionAnimations.forEach(animation => animation.cancel());
  const historyOnly = activeProduct && before.product === activeProduct && !before.entry && !activePurchase && before.mode !== activeHistoryMode;
  const backwards = (before.returns && !activeReturns) || (before.sales && !activeSales) || (before.invoiceLine && !activeInvoiceLine) || (before.goods && !activeGoods) || (wasLabels && !activeLabels) || (before.reservation && !activeReservation) || (before.invoice && !activeInvoice) || (before.entry && !activePurchase) || (before.product && !activeProduct) || (!before.product && before.view === 'reports' && activeView === 'home');
  const target = activeReturns ? detailContent : activeSales ? detailContent : activeGoods ? detailContent : activeReservation ? detailContent : activeInvoice ? detailContent : activeProduct ? (historyOnly ? detailContent.querySelector('.purchase-history') : detailContent) : activeView === 'home' ? dashboard : activeView === 'invoices' ? invoicePage : activeView==='returns'?returnsPage:activeView==='sales'?salesPage:activeView==='purchase-goods'?goodsPage:reportsPage;
  enterContent(target, backwards ? -1 : 1, historyOnly ? 12 : 24);
}
function applyRoute() {
  returning = false;
  if(returnsFilterSheet.open)returnsFilterSheet.close();
  const returnsId=new URLSearchParams(location.hash.slice(1)).get('returns');
  const returnsItem=returnsId&&[...filteredReturns(),...returnsRows,...groupReturns(returnsRows)].find(row=>row.id===returnsId);
  if(returnsItem){showReturns(returnsItem);return;}
  if(returnsId)history.replaceState(null,'','#returns');
  const leavingReturns=Boolean(activeReturns);activeReturns=null;
  if(location.hash!=='#returns')returnsPage.hidden=true;
  if(salesFilterSheet.open)salesFilterSheet.close();
  const salesId=new URLSearchParams(location.hash.slice(1)).get('sales');
  const salesItem=salesId&&[...filteredSales(),...salesRows,...groupSales(salesRows)].find(row=>row.id===salesId);
  if(salesItem){showSales(salesItem);return;}
  if(salesId)history.replaceState(null,'','#sales');
  const leavingSales=Boolean(activeSales);activeSales=null;
  if(location.hash!=='#sales')salesPage.hidden=true;
  if(goodsFilterSheet.open)goodsFilterSheet.close();
  const goodsId=new URLSearchParams(location.hash.slice(1)).get('goods');
  const goodsItem=goodsId && [...filteredGoods(),...goodsRows,...groupGoods(goodsRows)].find(row=>row.id===goodsId);
  if(goodsItem){showGoods(goodsItem);return;}
  if(goodsId)history.replaceState(null,'','#purchase-goods');
  const leavingGoods=Boolean(activeGoods);
  activeGoods=null;
  if(location.hash!=='#purchase-goods')goodsPage.hidden=true;
  const labelParams=new URLSearchParams(location.hash.slice(1));
  const leavingLabels=activeLabels && !(labelParams.get('invoice')===activeLabels && labelParams.get('labels')==='1');
  if(leavingLabels)activeLabels=null;
  if(labelChoiceSheet.open)labelChoiceSheet.close();
  document.getElementById('label-print-page').textContent='';
  if(stockSubSheet.open)stockSubSheet.close();
  if(reservedFilterSheet.open)reservedFilterSheet.close();
  if(filterSheet.open)filterSheet.close();
  const reservationId=new URLSearchParams(location.hash.slice(1)).get('reserved');
  const reservation=reservationId && (filteredReservedRows().find(row=>row.id===reservationId)||allReservedRows().find(row=>row.id===reservationId));
  if(reservation){showReservation(reservation);return;}
  if(reservationId)history.replaceState(null,'','#reserved');
  if (historySheet.open) historySheet.close();
  if (historyFilterSheet.open) historyFilterSheet.close();
  if (invoiceFilterSheet.open) invoiceFilterSheet.close();
  if (reportChoiceSheet.open) reportChoiceSheet.close();
  const invoiceId = new URLSearchParams(location.hash.slice(1)).get('invoice');
  const invoice = invoices.find(item => item.id === invoiceId);
  if (invoice && new URLSearchParams(location.hash.slice(1)).get('labels')==='1') { showLabels(invoice); return; }
  if (invoice) { if(leavingLabels)activeInvoice=null;showInvoice(invoice,new URLSearchParams(location.hash.slice(1)).get('line')); return; }
  activeInvoiceLine=null;
  if (invoiceId) history.replaceState(null, '', '#invoices');
  const code = new URLSearchParams(location.hash.slice(1)).get('product');
  const originalProduct = products.find(item => item.barcode === code);
  const lotId=new URLSearchParams(location.hash.slice(1)).get('lot');
  const lot=stockLots.find(item=>item.id===lotId&&item.barcode===code);
  const product=lot?{...lot,status:stockStatus(lot),stockLot:lot.id}:originalProduct;
  if (product) {
    const params = new URLSearchParams(location.hash.slice(1));
    const mode = Object.hasOwn(historyModes, params.get('tab')) ? params.get('tab') : 'purchase';
    const entryId = params.get('entry') || params.get('purchase');
    const entry = historyModes[mode].rows.find(item => item.id === entryId && item.product === product.barcode);
    showProduct(product, entry || null, mode); return;
  }
  if (code) history.replaceState(null, '', '#reports');
  const view = location.hash === '#returns' ? 'returns' : location.hash === '#sales' ? 'sales' : location.hash === '#purchase-goods' ? 'purchase-goods' : location.hash === '#reserved' ? 'reserved' : location.hash === '#invoices' ? 'invoices' : location.hash === '#reports' ? 'reports' : 'home';
  const fromDetail = leavingReturns || leavingSales || leavingGoods || Boolean(activeProduct || activeInvoice || activeReservation || activeGoods);
  if (!fromDetail && activeView === view) return;
  if(!leavingGoods&&!leavingSales&&!leavingReturns)rememberView();
  activeProduct = null;
  activeStockLot = null;
  activeInvoice = null;
  activeReservation = null;
  activePurchase = null;
  activeView = view;
  if(view==='reports'||view==='reserved'){const nextTab=view==='reserved'?'reserved':'stock';if(stockTab!==nextTab){reportSearches[stockTab]=search.value;reportPages[stockTab]=stockPageNumber;stockTab=nextTab;barcodeSearch.value=reportBarcodes[stockTab];search.value=reportSearches[stockTab];stockPageNumber=reportPages[stockTab];render();}else if(!fromDetail)render();updateStockSubNavigation();}
  productPage.hidden = true;
  workspace.hidden = false;
  dashboard.hidden = view !== 'home';
  reportsPage.hidden = !['reports','reserved'].includes(view);
  invoicePage.hidden = view !== 'invoices';
  returnsPage.hidden=view!=='returns';
  if(view==='returns')renderReturns();
  salesPage.hidden=view!=='sales';
  if(view==='sales')renderSales();
  goodsPage.hidden=view!=='purchase-goods';
  if(view==='purchase-goods')renderGoods();
  updateReportNavigation(view);
  document.title = `${view === 'home' ? 'Bosh sahifa' : view==='returns'?'Hujjatlar bo‘yicha qaytarishlar':view==='sales'?'Mahsulot bo‘yicha sotish':['invoices','purchase-goods'].includes(view) ? 'Sotib olish' : view==='reserved'?'Zaxiralangan mahsulotlar':'Qoldiq'} · Rizo Store`;
  document.querySelectorAll('.nav-item[data-route]').forEach(button => {
    if (button.dataset.route === (['invoices','purchase-goods','reserved','sales','returns'].includes(view) ? 'reports' : view)) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  window.scrollTo(0, viewPositions[view]);
  const focus = viewFocus[view];
  if (fromDetail && focus?.isConnected && focus !== document.body && !focus.closest('[hidden]')) {
    focus.focus({preventScroll: true});
  } else {
    document.getElementById(view === 'home' ? 'home-title' : view==='returns'?'returns-report-title':view==='sales'?'sales-report-title':view==='purchase-goods'?'goods-report-title':view === 'invoices' ? 'invoice-report-title' : 'reports-title').focus({preventScroll: true});
  }
}
function goBack() {
  if(activeReturns){if(returning)return;returning=true;if(history.state?.rizoReturns)history.back();else{history.replaceState(null,'','#returns');syncRoute();}return;}
  if(activeSales){if(returning)return;returning=true;if(history.state?.rizoSales)history.back();else{history.replaceState(null,'','#sales');syncRoute();}return;}
  if(activeGoods){if(returning)return;returning=true;if(history.state?.rizoGoods)history.back();else{history.replaceState(null,'','#purchase-goods');syncRoute();}return;}
  if(activeLabels){if(returning)return;returning=true;if(history.state?.rizoLabels)history.back();else{history.replaceState(null,'',`#invoice=${activeLabels}`);syncRoute();}return;}
  if(activeReservation){if(returning)return;returning=true;if(history.state?.rizoReservation)history.back();else{history.replaceState(null,'','#reserved');syncRoute();}return;}
  if(activeInvoiceLine){if(returning)return;returning=true;if(history.state?.rizoInvoiceLine)history.back();else{history.replaceState(null,'',`#invoice=${activeInvoice}`);syncRoute();}return;}
  if (activeInvoice) {
    if (returning) return;
    returning = true;
    if (history.state?.rizoInvoice) history.back();
    else { history.replaceState(null, '', '#invoices'); syncRoute(); }
    return;
  }
  if (!activeProduct || returning) return;
  returning = true;
  if (activePurchase) {
    if (history.state?.rizoPurchase) history.back();
    else { history.replaceState(null, '', `#product=${activeProduct}${activeStockLot?`&lot=${activeStockLot}`:''}&tab=${activeHistoryMode}`); syncRoute(); }
  } else if (history.state?.rizoDetail) history.back();
  else {
    history.replaceState(null, '', `#${detailOrigin}`);
    syncRoute();
  }
}
document.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  // Mobile card content forwards to its existing detail link; controls keep their own action.
  const card = event.target.closest('.stock-card, .purchase-card');
  if (innerWidth <= 760 && card && !event.defaultPrevented &&
      !event.target.closest('a,button,input,select,textarea,label,summary,[role="button"],[contenteditable]') &&
      !window.getSelection()?.toString()) {
    const link = card.querySelector('a.product-link, a[data-entry], a[data-purchase]');
    if (link) { event.preventDefault(); link.click(); return; }
  }
  const route = event.target.closest('[data-route]');
  if (route) {
    event.preventDefault();
    navigate(route.dataset.route, route.dataset.stockStatus);
    return;
  }
  const invoiceLineLink=event.target.closest('a[data-invoice-line]');
  if(invoiceLineLink){event.preventDefault();Object.assign(invoiceItemView(),{scroll:window.scrollY,focusLine:invoiceLineLink.dataset.invoiceLine});history.pushState({rizoInvoiceLine:true},'',invoiceLineLink.getAttribute('href'));syncRoute();return;}
  const returnsLink=event.target.closest('a[data-returns]');
  if(returnsLink){event.preventDefault();history.pushState({rizoReturns:true},'',returnsLink.getAttribute('href'));syncRoute();return;}
  const salesLink=event.target.closest('a[data-sales]');
  if(salesLink){event.preventDefault();history.pushState({rizoSales:true},'',salesLink.getAttribute('href'));syncRoute();return;}
  const goodsLink=event.target.closest('a[data-goods]');
  if(goodsLink){event.preventDefault();history.pushState({rizoGoods:true},'',goodsLink.getAttribute('href'));syncRoute();return;}
  const reservedLink=event.target.closest('a[data-reservation]');
  if(reservedLink){event.preventDefault();history.pushState({rizoReservation:true},'',reservedLink.getAttribute('href'));syncRoute();return;}
  const invoiceLink = event.target.closest('a[data-invoice]');
  if (invoiceLink) {
    event.preventDefault(); history.pushState({rizoInvoice:true}, '', invoiceLink.getAttribute('href')); syncRoute(); return;
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
  history.replaceState(history.state, '', `#product=${activeProduct}${activeStockLot?`&lot=${activeStockLot}`:''}&tab=${mode}`);
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
  note.textContent = 'Filtrlar faqat tarix yozuvlariga qo‘llanadi.';
  historyFilterBody.append(note);
  historyFilterKeys[activeHistoryMode].filter(key => key !== 'from' && key !== 'to').forEach(key => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-field'; button.dataset.historyField = key;
    const label = document.createElement('span'); label.className = 'filter-label'; label.textContent = historyFilterLabels[key];
    const value = document.createElement('strong'); value.textContent = historyDraft[key] || 'Barchasi';
    const arrow = document.createElement('span'); arrow.className = 'field-arrow'; arrow.innerHTML = icon('chevronRight'); arrow.setAttribute('aria-hidden', 'true');
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
// Synthetic invoice metadata follows the fields observed in the Store report.
const invoices = [
  {id:'NAM-1001',type:'Talabnoma',supplier:'Namuna ta’minotchi',branch:'Namuna filial',warehouse:'Namuna ombor',currency:'UZS',payment:'Qarzga',paymentDate:'2026-10-20',openedBy:'Namuna xodim',closedBy:'Namuna xodim',date:'2026-10-05',time:'14:30'},
  {id:'NAM-1002',type:'Zakup',supplier:'Ikkinchi namuna ta’minotchi',branch:'Namuna filial',warehouse:'Ikkinchi namuna ombor',currency:'USD',payment:'Naqd pul',paymentDate:'2026-10-04',openedBy:'Namuna xodim',closedBy:'Ikkinchi namuna xodim',date:'2026-10-04',time:'09:15'},
  {id:'NAM-2026-10-03-UZUN-FAKTURA-RAQAMI',type:'Talabnoma',supplier:'Qurilish va santexnika mahsulotlari ta’minoti — uzun nomli namuna tashkilot',branch:'Ikkinchi namuna filial',warehouse:'Asosiy qurilish mahsulotlari saqlanadigan uzun nomli namuna ombor',currency:'UZS',payment:'Bank to‘lov',paymentDate:'2026-10-03',openedBy:'Xaridni rasmiylashtirgan uzun ismli namuna xodim',closedBy:'Namuna xodim',date:'2026-10-03',time:'16:45'},
  {id:'NAM-1004',type:'Ko‘chirish',supplier:'Namuna ta’minotchi',branch:'Ikkinchi namuna filial',warehouse:'Ikkinchi namuna ombor',currency:'UZS',payment:'—',paymentDate:'',openedBy:'Namuna xodim',closedBy:'—',date:'2026-09-28',time:'11:20'},
  {id:'NAM-1005',type:'Zakup',supplier:'Ikkinchi namuna ta’minotchi',branch:'Namuna filial',warehouse:'Namuna ombor',currency:'USD',payment:'Qarzga',paymentDate:'',openedBy:'Ikkinchi namuna xodim',closedBy:'Namuna xodim',date:'2026-09-24',time:'10:00'},
];
// Extra sample invoices exercise more than one ten-row page.
invoices.push(...Array.from({length:7},(_,index)=>({...invoices[index%5],id:`NAM-10${String(index+6).padStart(2,'0')}`,date:`2026-09-${String(20-index).padStart(2,'0')}`,time:'10:30'})));
// One synthetic source feeds invoice contents, totals and price labels.
const invoiceItemsById = Object.fromEntries(invoices.map((invoice,index)=>{
  const indices=invoice.id==='NAM-1004'?[]:invoice.currency==='USD'?[4,4]:index===0?[0,2,5,1,3,0,2,1,3,0,2,1]:[2,5,0];
  return [invoice.id,indices.map((productIndex,lineIndex)=>{
    const product=products[productIndex],large=index===2&&lineIndex===1;
    const quantity=large?3000:lineIndex===0?12:lineIndex+2;
    const cost=index===2&&lineIndex===2?0:product.price;
    const sale=cost===0?0:product.salePrice;
    return {...product,id:`LINE-${lineIndex+1}`,barcode:sampleEAN(productIndex),ean:sampleEAN(productIndex),currency:invoice.currency,quantity,cost,wholesale:cost*1.05,sale,vat:'Yo‘q',entryTotal:quantity*cost,finalTotal:quantity*sale,batch:`NAM-${index+1}-${lineIndex+1}`,name:index===2&&lineIndex===0?'Namuna-UzunMahsulotNomi'.repeat(6):product.name};
  })];
}));
const invoiceItemDefs=[['variant','Variatsiya',p=>p.variant||'—'],['name','Mahsulot nomlari',p=>p.name],['barcode','Shtrix-kod',p=>p.barcode],['category','Turkum',p=>p.category],['unit','O‘lchov birligi',p=>p.unit],['quantity','Miqdori',p=>p.quantity],['cost','Kirish narxi',p=>p.cost],['wholesale','Ulgurji narx',p=>p.wholesale],['sale','Narx farqi',p=>p.sale],['vat','QQSni qo‘llash',p=>p.vat],['entryTotal','Yakuniy kirish narxi',p=>p.entryTotal],['finalTotal','Yakuniy narx',p=>p.finalTotal],['batch','Ishlab chiqarish raqami',p=>p.batch||'—']];
let invoiceItemColumns=invoiceItemDefs.map(([key])=>key),activeInvoiceLine=null;
const invoiceItemViews=new Map();
try{const saved=JSON.parse(localStorage.getItem('rizo-invoice-item-columns-v1'));if(Array.isArray(saved)&&saved.includes('name'))invoiceItemColumns=[...new Set(saved.filter(key=>invoiceItemDefs.some(([id])=>id===key)))];}catch{}
function invoiceItemView(id=activeInvoice){if(!invoiceItemViews.has(id))invoiceItemViews.set(id,{page:1,sort:{key:'',direction:'desc'},scroll:0,focusLine:null});return invoiceItemViews.get(id);}
function invoiceItems(id){return invoiceItemsById[id]||[];}
function invoiceItemTotals(rows){const entry=rows.reduce((sum,p)=>sum+p.entryTotal,0),sale=rows.reduce((sum,p)=>sum+p.finalTotal,0);return {entry,sale,difference:sale-entry};}
function invoiceItemTotalsMarkup(invoice){const t=invoiceItemTotals(invoiceItems(invoice.id));return [['Yakuniy kirish narxi',t.entry],['Savdolarning umumiy miqdori',t.sale],['Umumiy farq',t.difference]].map(([label,value])=>`<div><dt>${label}</dt><dd>${money(value,invoice.currency)}</dd></div>`).join('');}
function sortedInvoiceItems(id=activeInvoice){return sortReportRows(invoiceItems(id),invoiceItemDefs,invoiceItemView(id).sort);}
function invoiceItemTable(rows,invoice,links=true){const columns=invoiceItemColumns.map(key=>invoiceItemDefs.find(([id])=>id===key));return `<table><thead><tr>${columns.map(([key,label])=>sortHeader(key,label,'invoice-item',links)).join('')}</tr></thead><tbody>${rows.map(p=>`<tr>${columns.map(([key,,value])=>`<td data-invoice-item-column="${key}" class="${typeof value(p)==='number'?'numeric':''}">${key==='name'&&links?`<a class="product-link" data-invoice-line="${p.id}" href="#invoice=${invoice.id}&line=${p.id}">${p.name}</a>`:goodsValue(value(p))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function renderInvoiceItems(){
  const invoice=invoices.find(p=>p.id===activeInvoice),root=document.getElementById('invoice-items');if(!invoice||!root)return;
  const rows=sortedInvoiceItems(),state=invoiceItemView(),pages=Math.max(1,Math.ceil(rows.length/10));state.page=Math.max(1,Math.min(state.page,pages));const visible=rows.slice((state.page-1)*10,state.page*10);
  root.querySelector('#invoice-item-count').textContent=`${rows.length} ta mahsulot`;
  root.querySelector('#invoice-item-cards').innerHTML=visible.map(p=>`<article class="stock-card invoice-item-card"><div class="card-head"><h2><a class="product-link" data-invoice-line="${p.id}" href="#invoice=${invoice.id}&line=${p.id}">${p.name}</a></h2><span class="currency">${p.currency}</span></div><p class="goods-meta">${p.variant&&p.variant!=='—'?p.variant+' · ':''}${p.barcode}</p><dl class="goods-card-values"><div><dt>Miqdori</dt><dd>${format(p.quantity)} <small>${p.unit}</small></dd></div><div><dt>Kirish narxi</dt><dd>${format(p.cost)} <small>${p.currency}</small></dd></div><div><dt>Yakuniy kirish narxi</dt><dd>${format(p.entryTotal)} <small>${p.currency}</small></dd></div></dl><div class="invoice-card-footer"><span>${p.category}</span><span class="invoice-detail-hint" aria-hidden="true">Tafsilot ${icon('chevronRight')}</span></div></article>`).join('');
  root.querySelector('#invoice-item-table').innerHTML=invoiceItemTable(visible,invoice);
  root.querySelector('#invoice-item-empty').hidden=!!rows.length;root.querySelector('#invoice-item-table').hidden=!rows.length;
  const pager=root.querySelector('#invoice-item-pagination');pager.hidden=pages<=1;pager.innerHTML=`<button class="outline-button" data-invoice-item-page="${state.page-1}" ${state.page===1?'disabled':''} aria-label="Oldingi mahsulotlar sahifasi">${icon('chevronLeft')}</button><span>${state.page} / ${pages}</span><button class="outline-button" data-invoice-item-page="${state.page+1}" ${state.page===pages?'disabled':''} aria-label="Keyingi mahsulotlar sahifasi">${icon('chevronRight')}</button>`;
  root.querySelector('#invoice-item-totals').innerHTML=invoiceItemTotalsMarkup(invoice);animateResults(root);
}
function performInvoiceItemAction(action){
  const invoice=invoices.find(p=>p.id===activeInvoice);if(!invoice)return;
  if(action==='columns'){columnContext='invoice-item';document.querySelector('#stock-columns-sheet .choice-note').textContent='Faktura mahsulotlari jadvali va chop etish uchun. Mahsulot nomi doim ko‘rinadi.';stockColumnDraft=[...invoiceItemColumns,...invoiceItemDefs.map(([key])=>key).filter(key=>!invoiceItemColumns.includes(key))].map(key=>({key,visible:invoiceItemColumns.includes(key)}));renderStockColumnChoices();openStockDialog(stockColumnsSheet);return;}
  if(action==='print'){const rows=sortedInvoiceItems();const html=`<h1>${invoice.id}</h1><p>Sinov fakturasi · ${invoice.currency} · ${rows.length} ta mahsulot</p>${rows.length?invoiceItemTable(rows,invoice,false):'<p>Mahsulot yo‘q.</p>'}<dl class="invoice-item-totals">${invoiceItemTotalsMarkup(invoice)}</dl>`;document.getElementById('stock-print-content').innerHTML=html;document.getElementById('print-area').innerHTML=html;openStockDialog(stockPrintPreview);}
}
document.addEventListener('click',event=>{
  const action=event.target.closest('[data-invoice-item-action]');if(action){performInvoiceItemAction(action.dataset.invoiceItemAction);return;}
  const page=event.target.closest('[data-invoice-item-page]');if(page){invoiceItemView().page=Number(page.dataset.invoiceItemPage);renderInvoiceItems();document.getElementById('invoice-items-title').scrollIntoView({block:'start'});document.getElementById('invoice-items-title').focus({preventScroll:true});}
});

let invoicePageNumber=1,invoiceSort={key:'',direction:'desc'};
const invoicePageSize=10;
const invoiceColumnDefs=[
  ['rowNumber','№',(_item,index)=>index+1],['invoiceId','Faktura raqami',item=>item.id],
  ['type','Turi',item=>item.type],['supplier','Ta’minotchi',item=>item.supplier],['branch','Filial',item=>item.branch],['warehouse','Ombor',item=>item.warehouse],['currency','Valyuta',item=>item.currency],['payment','To‘lov tartibi',item=>item.payment],['paymentDate','To‘lov sanasi',item=>item.paymentDate?dateLabel(item.paymentDate):'Ko‘rsatilmagan'],['openedBy','Xaridni ochgan xodim',item=>item.openedBy],['closedBy','Xaridni yopgan xodim',item=>item.closedBy],['date','Yaratilgan sana',item=>`${dateLabel(item.date)} · ${item.time}`],['labels','Narxlar ro‘yxati',()=> '']
];
let invoiceColumns=invoiceColumnDefs.map(([key])=>key);
try{const saved=JSON.parse(localStorage.getItem('rizo-invoice-columns-v1'));if(Array.isArray(saved)&&saved.includes('invoiceId'))invoiceColumns=[...new Set(saved.filter(key=>invoiceColumnDefs.some(([id])=>id===key)))];}catch{}
const invoiceFilterLabels = {branch:'Filial',supplier:'Ta’minotchi',warehouse:'Ombor',currency:'Valyuta',type:'Turi',payment:'To‘lov tartibi',from:'Sanadan boshlab',to:'Sanagacha'};
let invoiceFilters = {}, invoiceDraft = {}, invoiceChoosing = null;
const invoiceSearch = document.getElementById('invoice-search');
const invoiceFilterSheet = document.getElementById('invoice-filter-sheet');
const invoiceFilterBody = document.getElementById('invoice-filter-body');
const invoiceFilterChoices = document.getElementById('invoice-filter-choices');
const invoiceOptionSearch = document.getElementById('invoice-option-search');
const invoiceFilterTrigger = document.getElementById('invoice-filter-trigger');
let invoiceOverflow = '';
function invoiceFields(item) {
  return [['Faktura raqami',item.id],['Turi',item.type],['Ta’minotchi',item.supplier],['Filial',item.branch],['Ombor',item.warehouse],['Valyuta',item.currency],['To‘lov tartibi',item.payment],['To‘lov sanasi',item.paymentDate ? dateLabel(item.paymentDate) : 'Ko‘rsatilmagan'],['Xaridni ochgan xodim',item.openedBy],['Xaridni yopgan xodim',item.closedBy],['Yaratilgan sana',`${dateLabel(item.date)} · ${item.time}`]];
}
function filteredInvoices() {
  const query = invoiceSearch.value.trim().toLocaleLowerCase('uz');
  return sortReportRows(invoices.filter(item => `${item.id} ${item.supplier}`.toLocaleLowerCase('uz').includes(query)
    && Object.entries(invoiceFilters).every(([key,value]) => !value || (key === 'from' ? item.date >= value : key === 'to' ? item.date <= value : item[key] === value))),invoiceColumnDefs,invoiceSort);
}
function resetInvoicePage(){invoicePageNumber=1;renderInvoices();}
function invoiceTableMarkup(rows,links=true,offset=0){
  const columns=invoiceColumns.map(key=>invoiceColumnDefs.find(([id])=>id===key)).filter(([key])=>links||key!=='labels');
  return `<table><thead><tr>${columns.map(([key,label])=>sortHeader(key,label,'invoice',links&&key!=='labels')).join('')}</tr></thead><tbody>${rows.map((item,index)=>`<tr>${columns.map(([key,,value])=>`<td data-column="${key}">${key==='invoiceId'&&links?`<a class="product-link" href="#invoice=${item.id}" data-invoice="${item.id}" aria-label="${item.id} faktura tafsiloti">${item.id}</a>`:key==='labels'?`<button class="invoice-label-button" data-invoice-action="labels" data-invoice-id="${item.id}" aria-label="${item.id} narx yorliqlari">Narx yorliqlari</button>`:value(item,index+offset)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function performInvoiceAction(action,id){
  if(action==='labels'){if(activeInvoice===id&&!activeLabels)Object.assign(invoiceItemView(id),{scroll:window.scrollY,restore:true});history.pushState({rizoLabels:true},'',`#invoice=${id}&labels=1`);syncRoute();return;}
  if(action==='sort'){openSortSheet('invoice');return;}
  if(action==='refresh'){renderInvoices();document.getElementById('report-announcement').textContent='Sinov hisob-fakturalari yangilandi.';return;}
  if(action==='columns'){
    columnContext='invoice';document.querySelector('#stock-columns-sheet .choice-note').textContent='Desktop jadvali, eksport va chop etish uchun. Faktura raqami doim ko‘rinadi.';
    stockColumnDraft=[...invoiceColumns,...invoiceColumnDefs.map(([key])=>key).filter(key=>!invoiceColumns.includes(key))].map(key=>({key,visible:invoiceColumns.includes(key)}));renderStockColumnChoices();openStockDialog(stockColumnsSheet);return;
  }
  const rows=id?invoices.filter(item=>item.id===id):filteredInvoices();
  const columns=invoiceColumns.map(key=>invoiceColumnDefs.find(([keyId])=>keyId===key)).filter(([key])=>key!=='labels');
  if(action==='export'){
    const url=URL.createObjectURL(new Blob([reportCSV({rows,columns})],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download=`rizo-fakturalar-${id||stockDate}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('report-announcement').textContent=`${rows.length} ta hisob-faktura ma’lumoti CSV faylga chiqarildi.`;return;
  }
  if(action==='print'){
    const html=`<h1>Hisob-fakturalar</h1><p>Sinov ma’lumotlari · ${rows.length} ta hisob-faktura</p>${rows.length?invoiceTableMarkup(rows,false):'<p>Hisob-faktura topilmadi.</p>'}`;
    document.getElementById('stock-print-content').innerHTML=html;document.getElementById('print-area').innerHTML=html;openStockDialog(stockPrintPreview);
  }
}
document.addEventListener('click',event=>{
  const action=event.target.closest('[data-invoice-action]');if(action){performInvoiceAction(action.dataset.invoiceAction,action.dataset.invoiceId);return;}
  const page=event.target.closest('[data-invoice-page]');if(page){invoicePageNumber=Number(page.dataset.invoicePage);renderInvoices();document.getElementById('invoice-report-title').focus({preventScroll:true});window.scrollTo(0,0);}
});
function renderInvoices() {
  const rows = filteredInvoices();
  const pages=Math.max(1,Math.ceil(rows.length/invoicePageSize));invoicePageNumber=Math.max(1,Math.min(invoicePageNumber,pages));const offset=(invoicePageNumber-1)*invoicePageSize;const visible=rows.slice(offset,offset+invoicePageSize);
  document.getElementById('invoice-count').textContent = `${rows.length} ta hisob-faktura`;
  const cards = document.getElementById('invoice-cards');
  cards.innerHTML = visible.map(item => `<article class="stock-card invoice-card"><div class="card-head"><h2><a class="product-link" href="#invoice=${item.id}" data-invoice="${item.id}" aria-label="${item.id} faktura tafsiloti">${item.id}</a></h2><span class="currency">${item.currency}</span></div><p class="invoice-supplier">${item.supplier}</p><div class="invoice-card-meta"><span class="history-type">${item.type}</span><span class="status ${item.payment === 'Qarzga' ? 'low' : 'invoice-payment'}">${item.payment === '—' ? 'To‘lov ko‘rsatilmagan' : item.payment}</span></div><div class="invoice-card-footer"><time datetime="${item.date}T${item.time}">${dateLabel(item.date)} · ${item.time}</time><span class="invoice-detail-hint" aria-hidden="true">Tafsilot ${icon('chevronRight')}</span></div></article>`).join('');
  document.getElementById('invoice-table').innerHTML=invoiceTableMarkup(visible,true,offset);
  const pager=document.getElementById('invoice-pagination');pager.hidden=pages<=1;pager.innerHTML=`<button class="outline-button" data-invoice-page="${invoicePageNumber-1}" ${invoicePageNumber===1?'disabled':''} aria-label="Oldingi faktura sahifasi">${icon('chevronLeft')}</button><span>${invoicePageNumber} / ${pages}</span><button class="outline-button" data-invoice-page="${invoicePageNumber+1}" ${invoicePageNumber===pages?'disabled':''} aria-label="Keyingi faktura sahifasi">${icon('chevronRight')}</button>`;
  cards.hidden = !rows.length;
  document.getElementById('invoice-table').hidden = !rows.length;
  document.getElementById('invoice-empty').hidden = !!rows.length;
  const chips = document.getElementById('invoice-filter-chips'); chips.replaceChildren();
  const active = Object.entries(invoiceFilters).filter(([,value])=>value);
  active.forEach(([key,value]) => {
    const label = `${invoiceFilterLabels[key]}: ${['from','to'].includes(key) ? dateLabel(value) : value}`;
    const button = document.createElement('button'); button.className = 'filter-chip'; button.textContent = `${label} ×`; button.setAttribute('aria-label',`${label} filtrini olib tashlash`);
    button.addEventListener('click',()=>{delete invoiceFilters[key];resetInvoicePage();invoiceFilterTrigger.focus({preventScroll:true});}); chips.append(button);
  });
  const badge = document.getElementById('invoice-filter-count'); badge.hidden = !active.length; badge.textContent = active.length;
  invoiceFilterTrigger.setAttribute('aria-label', active.length ? `Faktura filtri, ${active.length} ta faol` : 'Faktura filtri');
  animateResults(document.getElementById('invoice-report'));
}
function showInvoice(item,lineId=null) {
  const line=invoiceItems(item.id).find(p=>p.id===lineId)||null;
  if(lineId&&!line)history.replaceState(history.state,'',`#invoice=${item.id}`);
  if(activeInvoice===item.id&&activeInvoiceLine===(line?.id||null))return;
  const restore=invoiceItemView(item.id).restore||(activeInvoice===item.id&&activeInvoiceLine);
  const previousLine=activeInvoiceLine;
  rememberView();activeInvoice=item.id;activeInvoiceLine=line?.id||null;activeReservation=null;activeProduct=null;activePurchase=null;
  workspace.hidden=true;invoicePage.hidden=true;productPage.hidden=false;
  detailBack.setAttribute('aria-label',line?'Faktura mahsulotlariga qaytish':'Hisob-fakturalarga qaytish');document.getElementById('detail-page-label').textContent=line?'Faktura mahsuloti':'Hisob-faktura tafsiloti';
  const summary=document.createElement('section');summary.className='detail-summary';
  summary.innerHTML=`<div class="detail-kicker"><time>${dateLabel(item.date)} · ${item.time}</time><span class="currency">${item.currency}</span></div><h1 id="product-title" tabindex="-1">${line?line.name:item.id}</h1><p class="invoice-supplier">${line?item.id:item.supplier}</p>`;
  detailContent.classList.add('is-purchase-detail');detailContent.replaceChildren(summary);
  if(line){
    const info=document.createElement('section');info.className='detail-information';info.innerHTML='<h2>Mahsulot ma’lumotlari</h2><dl class="detail-fields"></dl>';
    info.querySelector('dl').append(...invoiceItemDefs.map(([key,label,value])=>field(label,typeof value(line)==='number'?key==='quantity'?`${format(value(line))} ${line.unit}`:money(value(line),line.currency):value(line))));detailContent.append(info);
  }else{
    const meta=document.createElement('details');meta.className='invoice-metadata';meta.innerHTML='<summary>Faktura ma’lumotlari</summary><dl class="detail-fields"></dl>';meta.querySelector('dl').append(...invoiceFields(item).map(([label,value])=>field(label,value)));detailContent.append(meta);
    const content=document.getElementById('invoice-items-template').content.cloneNode(true);detailContent.append(content);renderInvoiceItems();
    const actions=document.createElement('section');actions.className='invoice-detail-actions invoice-item-actions';actions.innerHTML=`<button class="outline-button" data-invoice-action="labels" data-invoice-id="${item.id}">${icon('print')}Narx yorliqlari</button><button class="outline-button" data-invoice-action="export" data-invoice-id="${item.id}">${icon('export')}Faktura ma’lumotlari · CSV</button>`;detailContent.append(actions);
  }
  const note=document.createElement('p');note.className='stage-note';note.textContent='Sinov fakturasi. Mahsulotlar va yorliqlar shu fakturaga tegishli namuna ma’lumotlaridan olinadi.';detailContent.append(note);
  document.title=`${line?line.name:item.id} · Hisob-faktura · Rizo Store`;
  if(!line&&restore){const state=invoiceItemView();state.restore=false;window.scrollTo(0,state.scroll);const target=[...detailContent.querySelectorAll('a[data-invoice-line]')].find(a=>a.dataset.invoiceLine===(previousLine||state.focusLine)&&a.getClientRects().length);(target||summary.querySelector('h1')).focus({preventScroll:true});}
  else{window.scrollTo(0,0);summary.querySelector('h1').focus({preventScroll:true});}
}
function showInvoiceFilterFields(focusKey) {
  invoiceChoosing = null;
  document.getElementById('invoice-filter-title').textContent = 'Faktura filtri';
  document.getElementById('invoice-filter-back').hidden = true;
  invoiceFilterBody.hidden = false; invoiceFilterChoices.hidden = true;
  document.getElementById('invoice-filter-footer').hidden = false;
  document.getElementById('invoice-filter-error').textContent = '';
  invoiceFilterBody.replaceChildren();
  Object.entries(invoiceFilterLabels).filter(([key])=>!['from','to'].includes(key)).forEach(([key,label])=>{
    const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-field'; button.dataset.invoiceField = key;
    const title = document.createElement('span'); title.className = 'filter-label'; title.textContent = label;
    const value = document.createElement('strong'); value.textContent = invoiceDraft[key] || 'Barchasi';
    const arrow = document.createElement('span'); arrow.className = 'field-arrow'; arrow.innerHTML = icon('chevronRight'); arrow.setAttribute('aria-hidden','true');
    button.append(title,value,arrow); button.addEventListener('click',()=>showInvoiceChoices(key)); invoiceFilterBody.append(button);
  });
  const dates = document.createElement('div'); dates.className = 'history-date-fields';
  ['from','to'].forEach(key=>{
    const label = document.createElement('label'); const name = document.createElement('span'); name.textContent = invoiceFilterLabels[key];
    const input = document.createElement('input'); input.type = 'date'; input.id = `invoice-date-${key}`; input.value = invoiceDraft[key] || ''; input.setAttribute('aria-describedby','invoice-filter-error');
    input.addEventListener('input',()=>{invoiceDraft[key]=input.value;document.getElementById('invoice-filter-error').textContent='';});label.append(name,input); dates.append(label);
  });
  invoiceFilterBody.append(dates);
  if (focusKey) invoiceFilterBody.querySelector(`[data-invoice-field="${focusKey}"]`)?.focus({preventScroll:true});
  if (invoiceFilterSheet.open) enterContent(invoiceFilterBody,-1,12);
}
function renderInvoiceChoices() {
  const list = document.getElementById('invoice-option-list'); list.replaceChildren();
  const query = invoiceOptionSearch.value.trim().toLocaleLowerCase('uz');
  const values = ['',...new Set(invoices.map(item=>item[invoiceChoosing]))].filter(value=>(value || 'Barchasi').toLocaleLowerCase('uz').includes(query));
  values.forEach(value=>{
    const label = document.createElement('label'); label.className = 'filter-option';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'invoice-choice'; input.value = value; input.checked = (invoiceDraft[invoiceChoosing] || '') === value;
    const name = document.createElement('span'); name.textContent = value || 'Barchasi';
    input.addEventListener('click',()=>{const key = invoiceChoosing;invoiceDraft[key]=value;showInvoiceFilterFields(key);}); label.append(input,name); list.append(label);
  });
  document.getElementById('invoice-no-options').hidden = !!values.length;
}
function showInvoiceChoices(key) {
  invoiceChoosing = key; document.getElementById('invoice-filter-title').textContent = invoiceFilterLabels[key];
  document.getElementById('invoice-filter-back').hidden = false;
  invoiceFilterBody.hidden = true; invoiceFilterChoices.hidden = false;
  document.getElementById('invoice-filter-footer').hidden = true;
  invoiceOptionSearch.value = ''; invoiceOptionSearch.closest('label').hidden = !['supplier','warehouse','branch'].includes(key);
  renderInvoiceChoices(); document.querySelector('#invoice-option-list input:checked')?.focus({preventScroll:true}); enterContent(invoiceFilterChoices,1,12);
}
invoiceSearch.addEventListener('input', resetInvoicePage);
document.getElementById('invoice-clear').addEventListener('click',()=>{invoiceFilters={};invoiceSearch.value='';resetInvoicePage();invoiceSearch.focus();});
invoiceFilterTrigger.addEventListener('click',()=>{
  invoiceDraft={...invoiceFilters};showInvoiceFilterFields();invoiceOverflow=document.body.style.overflow;document.body.style.overflow='hidden';invoiceFilterSheet.showModal();invoiceFilterTrigger.setAttribute('aria-expanded','true');
});
invoiceOptionSearch.addEventListener('input',renderInvoiceChoices);
document.getElementById('invoice-filter-back').addEventListener('click',()=>showInvoiceFilterFields(invoiceChoosing));
document.getElementById('invoice-filter-close').addEventListener('click',()=>invoiceFilterSheet.close());
document.getElementById('invoice-filter-reset').addEventListener('click',()=>{invoiceDraft={};showInvoiceFilterFields();});
document.getElementById('invoice-filter-form').addEventListener('submit',event=>{
  event.preventDefault();if(invoiceChoosing)return;
  if(invoiceDraft.from && invoiceDraft.to && invoiceDraft.from>invoiceDraft.to){document.getElementById('invoice-filter-error').textContent='Boshlanish sanasi tugash sanasidan keyin bo‘lmasin.';document.getElementById('invoice-date-to').focus();return;}
  invoiceFilters={...invoiceDraft};resetInvoicePage();invoiceFilterSheet.close();
});
invoiceFilterSheet.addEventListener('close',()=>{document.body.style.overflow=invoiceOverflow;invoiceFilterTrigger.setAttribute('aria-expanded','false');if(invoiceFilterTrigger.getClientRects().length)invoiceFilterTrigger.focus({preventScroll:true});});
invoiceFilterSheet.addEventListener('cancel',event=>{if(invoiceChoosing){event.preventDefault();showInvoiceFilterFields(invoiceChoosing);}});
invoiceFilterSheet.addEventListener('click',event=>{if(event.target!==invoiceFilterSheet)return;const rect=invoiceFilterSheet.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)invoiceFilterSheet.close();});
renderInvoices();

// Synthetic purchase lines; no Store records are copied into this prototype.
const goodsRows=Array.from({length:16},(_,index)=>{
  const p=products[index%products.length],quantity=index===5?750:20+index*3,remaining=index===3?0:Math.max(0,quantity-7);
  return {...p,id:`XAR-${String(index+1).padStart(3,'0')}`,date:`2026-10-${String(6-index%6).padStart(2,'0')}`,time:'10:30',quantity,remaining,wholesale:p.price*1.05,narxFarqi:p.salePrice,vat:index===4?'Ha':'Yo‘q',entryTotal:quantity*p.price,remainingTotal:remaining*p.salePrice,payment:['Naqd pul','Qarzga','Bank to‘lov'][index%3],batch:`NAM-PARTIYA-${index+1}`,expiry:index%3?'':'2027-12-31'};
});
// Repeated purchases exercise grouping; fixtures also include separate currencies.
goodsRows[6]={...goodsRows[0],id:'XAR-007',date:'2026-10-04',quantity:10,remaining:6,entryTotal:10*goodsRows[0].price,remainingTotal:6*goodsRows[0].narxFarqi};
const goodsColumnDefs=[['rowNumber','№',(_p,i)=>i+1],['date','Yaratilgan sana',p=>`${dateLabel(p.date)} · ${p.time}`],['name','Mahsulot nomlari',p=>p.name],['variant','Variatsiya',p=>p.variant||'—'],['barcode','Shtrix-kod',p=>p.barcode],['category','Turkum',p=>p.category||'—'],['quantity','Kirish miqdori',p=>p.quantity],['remaining','Qoldiq miqdori',p=>p.remaining],['unit','O‘lchov birligi',p=>p.unit],['currency','Valyuta',p=>p.currency],['price','Kirish narxi',p=>p.price],['wholesale','Ulgurji narx',p=>p.wholesale],['narxFarqi','Narx farqi',p=>p.narxFarqi],['vat','QQSni qo‘llash',p=>p.vat],['entryTotal','Yakuniy kirish narxi',p=>p.entryTotal],['remainingTotal','Qoldiq summasi',p=>p.remainingTotal],['expiry','Yaroqlilik muddati',p=>p.expiry?dateLabel(p.expiry):'—'],['branch','Filial',p=>p.branch],['warehouse','Ombor',p=>p.warehouse],['supplier','Ta’minotchi',p=>p.supplier],['payment','To‘lov tartibi',p=>p.payment],['batch','Ishlab chiqarish raqami',p=>p.batch||'—']];
let goodsColumns=goodsColumnDefs.map(([key])=>key),goodsPageNumber=1,goodsSort={key:'',direction:'desc'};
try{const saved=JSON.parse(localStorage.getItem('rizo-goods-columns-v1'));if(Array.isArray(saved)&&saved.includes('name'))goodsColumns=[...new Set(saved.filter(key=>goodsColumnDefs.some(([id])=>key===id)))];}catch{}
const goodsFilterLabels={branch:'Filial',supplier:'Ta’minotchi',warehouse:'Ombor',unit:'O‘lchov birligi',currency:'Valyuta',payment:'To‘lov tartibi',category:'Turkum',from:'Sanadan boshlab',to:'Sanagacha',group:'Guruhlash'};
let goodsFilters={},goodsDraft={},goodsChoosing=null,goodsOverflow='';
const goodsSearch=document.getElementById('goods-search'),goodsBarcode=document.getElementById('goods-barcode'),goodsFilterSheet=document.getElementById('goods-filter-sheet'),goodsFilterBody=document.getElementById('goods-filter-body'),goodsFilterChoices=document.getElementById('goods-filter-choices'),goodsOptionSearch=document.getElementById('goods-option-search'),goodsFilterTrigger=document.getElementById('goods-filter-trigger');
function groupGoods(rows){
  const groups=new Map();
  rows.forEach(row=>{
    // Never collapse currencies, variants, prices, suppliers or batch metadata.
    const key=JSON.stringify(['barcode','name','variant','category','unit','currency','price','wholesale','narxFarqi','vat','expiry','branch','warehouse','supplier','payment','batch'].map(key=>row[key]));
    if(!groups.has(key))groups.set(key,{...row,members:[row],id:`G-${row.id}`});
    else{const group=groups.get(key);group.members.push(row);['quantity','remaining','entryTotal','remainingTotal'].forEach(key=>group[key]+=row[key]);if(`${row.date}T${row.time}`>`${group.date}T${group.time}`){group.date=row.date;group.time=row.time;}}
  });return [...groups.values()];
}
function filteredGoods(){
  const query=goodsSearch.value.trim().toLocaleLowerCase('uz'),barcode=goodsBarcode.value.trim().toLocaleLowerCase('uz');
  const rows=goodsRows.filter(p=>p.name.toLocaleLowerCase('uz').includes(query)&&p.barcode.toLocaleLowerCase('uz').includes(barcode)&&Object.entries(goodsFilters).every(([key,value])=>!value||key==='group'||(key==='from'?p.date>=value:key==='to'?p.date<=value:p[key]===value)));
  return sortReportRows(goodsFilters.group?groupGoods(rows):rows,goodsColumnDefs,goodsSort);
}
function goodsTotals(rows){return ['UZS','USD'].map(currency=>{const matching=rows.filter(p=>p.currency===currency);const cost=matching.reduce((sum,p)=>sum+p.entryTotal,0),sale=matching.reduce((sum,p)=>sum+p.quantity*p.narxFarqi,0);return {currency,cost,sale,difference:sale-cost};});}
function goodsTotalsMarkup(rows){return goodsTotals(rows).map(t=>`<section class="purchase-total"><h3>${t.currency}</h3><dl><div><dt>Cheklarning umumiy miqdori</dt><dd>${format(t.cost)}</dd></div><div><dt>Savdolarning umumiy miqdori</dt><dd>${format(t.sale)}</dd></div><div><dt>Umumiy farq</dt><dd>${format(t.difference)}</dd></div></dl></section>`).join('');}
function goodsValue(value){return typeof value==='number'?format(value):value??'—';}
function goodsTableMarkup(rows,links=true,offset=0){const columns=goodsColumns.map(key=>goodsColumnDefs.find(([id])=>key===id));return `<table><thead><tr>${columns.map(([key,label])=>sortHeader(key,label,'goods',links)).join('')}</tr></thead><tbody>${rows.map((p,i)=>`<tr>${columns.map(([key,,value])=>`<td data-column="${key}" class="${typeof value(p,i)==='number'?'numeric':''}">${key==='name'&&links?`<a class="product-link" data-goods href="#goods=${p.id}">${p.name}</a>`:goodsValue(value(p,i+offset))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function resetGoodsPage(){goodsPageNumber=1;renderGoods();}
function renderGoods(){
  const rows=filteredGoods(),pages=Math.max(1,Math.ceil(rows.length/10));goodsPageNumber=Math.max(1,Math.min(goodsPageNumber,pages));const offset=(goodsPageNumber-1)*10,visible=rows.slice(offset,offset+10);
  document.getElementById('goods-count').textContent=`${rows.length} ta ${goodsFilters.group?'guruh':'xarid yozuvi'}`;
  document.getElementById('goods-cards').innerHTML=visible.map(p=>`<article class="stock-card goods-card"><div class="card-head"><h2><a class="product-link" data-goods href="#goods=${p.id}">${p.name}</a></h2><span class="currency">${p.currency}</span></div><p class="goods-meta">${dateLabel(p.date)} · ${p.variant&&p.variant!=='—'?p.variant:p.barcode}${p.members?.length>1?` · ${p.members.length} ta yozuv`:''}</p><dl class="goods-card-values"><div><dt>Kirish</dt><dd>${format(p.quantity)} <small>${p.unit}</small></dd></div><div><dt>Qoldiq</dt><dd>${format(p.remaining)} <small>${p.unit}</small></dd></div><div><dt>Yakuniy kirish narxi</dt><dd>${format(p.entryTotal)} <small>${p.currency}</small></dd></div></dl><div class="invoice-card-footer"><span>${p.supplier}</span><span class="invoice-detail-hint" aria-hidden="true">Tafsilot ${icon('chevronRight')}</span></div></article>`).join('');
  document.getElementById('goods-table').innerHTML=goodsTableMarkup(visible,true,offset);
  ['goods-cards','goods-table'].forEach(id=>document.getElementById(id).hidden=!rows.length);document.getElementById('goods-empty').hidden=!!rows.length;
  const pager=document.getElementById('goods-pagination');pager.hidden=pages<=1;pager.innerHTML=`<button class="outline-button" data-goods-page="${goodsPageNumber-1}" ${goodsPageNumber===1?'disabled':''} aria-label="Oldingi xarid sahifasi">${icon('chevronLeft')}</button><span>${goodsPageNumber} / ${pages}</span><button class="outline-button" data-goods-page="${goodsPageNumber+1}" ${goodsPageNumber===pages?'disabled':''} aria-label="Keyingi xarid sahifasi">${icon('chevronRight')}</button>`;
  document.getElementById('goods-totals').innerHTML=goodsTotalsMarkup(rows);
  const chips=document.getElementById('goods-filter-chips');chips.replaceChildren();const active=Object.entries(goodsFilters).filter(([,value])=>value);
  active.forEach(([key,value])=>{const button=document.createElement('button');button.className='filter-chip';button.textContent=`${goodsFilterLabels[key]}: ${key==='group'?'Ha':['from','to'].includes(key)?dateLabel(value):value} ×`;button.setAttribute('aria-label',`${goodsFilterLabels[key]} filtrini olib tashlash`);button.addEventListener('click',()=>{delete goodsFilters[key];resetGoodsPage();goodsFilterTrigger.focus({preventScroll:true});});chips.append(button);});
  const badge=document.getElementById('goods-filter-count');badge.hidden=!active.length;badge.textContent=active.length;animateResults(goodsPage);
}
function performGoodsAction(action){
  if(action==='sort'){openSortSheet('goods');return;}
  if(action==='refresh'){renderGoods();document.getElementById('report-announcement').textContent='Sinov xarid hisoboti yangilandi.';return;}
  if(action==='columns'){columnContext='goods';document.querySelector('#stock-columns-sheet .choice-note').textContent='Desktop jadvali, eksport va chop etish uchun. Mahsulot nomi doim ko‘rinadi.';stockColumnDraft=[...goodsColumns,...goodsColumnDefs.map(([key])=>key).filter(key=>!goodsColumns.includes(key))].map(key=>({key,visible:goodsColumns.includes(key)}));renderStockColumnChoices();openStockDialog(stockColumnsSheet);return;}
  const rows=filteredGoods(),columns=goodsColumns.map(key=>goodsColumnDefs.find(([id])=>id===key));
  if(action==='export'){const url=URL.createObjectURL(new Blob([reportCSV({rows,columns})],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='rizo-xarid-mahsulotlar.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('report-announcement').textContent=`${rows.length} ta xarid yozuvi CSV faylga chiqarildi.`;}
  if(action==='print'){const html=`<h1>Mahsulotlar orqali sotib olish</h1><p>Sinov ma’lumotlari · ${rows.length} ta qator</p>${rows.length?goodsTableMarkup(rows,false):'<p>Mahsulot topilmadi.</p>'}<div class="purchase-totals">${goodsTotalsMarkup(rows)}</div>`;document.getElementById('stock-print-content').innerHTML=html;document.getElementById('print-area').innerHTML=html;openStockDialog(stockPrintPreview);}
}
function showGoods(item){
  if(activeGoods===item.id)return;rememberView();activeGoods=item.id;activeProduct=null;activeInvoice=null;activeReservation=null;activePurchase=null;
  workspace.hidden=true;invoicePage.hidden=true;goodsPage.hidden=true;productPage.hidden=false;detailBack.setAttribute('aria-label','Xarid mahsulotlariga qaytish');document.getElementById('detail-page-label').textContent='Xarid mahsuloti';
  const summary=document.createElement('section');summary.className='detail-summary';summary.innerHTML=`<div class="detail-kicker"><span>${dateLabel(item.date)} · ${item.time}</span><span class="currency">${item.currency}</span></div><h1 id="product-title" tabindex="-1">${item.name}</h1><p>${item.barcode}</p>`;
  const info=document.createElement('section');info.className='detail-information';info.innerHTML='<h2>Xarid ma’lumotlari</h2><dl class="detail-fields"></dl>';info.querySelector('dl').append(...goodsColumnDefs.filter(([key])=>key!=='rowNumber').map(([key,label,value])=>field(label,['price','wholesale','narxFarqi','entryTotal','remainingTotal'].includes(key)?money(value(item),item.currency):['quantity','remaining'].includes(key)?`${format(value(item))} ${item.unit}`:goodsValue(value(item)))));
  detailContent.classList.add('is-purchase-detail');detailContent.replaceChildren(summary,info);
  if(item.members?.length>1){const section=document.createElement('section');section.className='detail-information';section.innerHTML='<h2>Guruhdagi xaridlar</h2>';item.members.forEach(row=>{const a=document.createElement('a');a.className='goods-member outline-button';a.href=`#goods=${row.id}`;a.dataset.goods='';a.textContent=`${dateLabel(row.date)} · ${format(row.quantity)} ${row.unit} · ${format(row.entryTotal)} ${row.currency}`;section.append(a);});detailContent.append(section);}
  document.title=`${item.name} · Xarid · Rizo Store`;window.scrollTo(0,0);summary.querySelector('h1').focus({preventScroll:true});
}
goodsBarcode.addEventListener('input',resetGoodsPage);
document.addEventListener('click',event=>{const action=event.target.closest('[data-goods-action]');if(action){performGoodsAction(action.dataset.goodsAction);return;}const page=event.target.closest('[data-goods-page]');if(page){goodsPageNumber=Number(page.dataset.goodsPage);renderGoods();document.getElementById('goods-report-title').focus({preventScroll:true});window.scrollTo(0,0);}});

function showGoodsFilterFields(focusKey) {
  goodsChoosing = null;
  document.getElementById('goods-filter-title').textContent = 'Xarid filtri';
  document.getElementById('goods-filter-back').hidden = true;
  goodsFilterBody.hidden = false; goodsFilterChoices.hidden = true;
  document.getElementById('goods-filter-footer').hidden = false;
  document.getElementById('goods-filter-error').textContent = '';
  goodsFilterBody.replaceChildren();
  Object.entries(goodsFilterLabels).filter(([key])=>!['from','to','group'].includes(key)).forEach(([key,label])=>{
    const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-field'; button.dataset.goodsField = key;
    const title = document.createElement('span'); title.className = 'filter-label'; title.textContent = label;
    const value = document.createElement('strong'); value.textContent = goodsDraft[key] || 'Barchasi';
    const arrow = document.createElement('span'); arrow.className = 'field-arrow'; arrow.innerHTML = icon('chevronRight'); arrow.setAttribute('aria-hidden','true');
    button.append(title,value,arrow); button.addEventListener('click',()=>showGoodsChoices(key)); goodsFilterBody.append(button);
  });
  const dates = document.createElement('div'); dates.className = 'history-date-fields';
  ['from','to'].forEach(key=>{
    const label = document.createElement('label'); const name = document.createElement('span'); name.textContent = goodsFilterLabels[key];
    const input = document.createElement('input'); input.type = 'date'; input.id = `goods-date-${key}`; input.value = goodsDraft[key] || ''; input.setAttribute('aria-describedby','goods-filter-error');
    input.addEventListener('input',()=>{goodsDraft[key]=input.value;document.getElementById('goods-filter-error').textContent='';});label.append(name,input); dates.append(label);
  });
  goodsFilterBody.append(dates);
  const grouping=document.createElement('label');grouping.className='filter-option';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!goodsDraft.group;checkbox.addEventListener('change',()=>goodsDraft.group=checkbox.checked);
  grouping.append(checkbox,document.createTextNode('Guruhlash'));goodsFilterBody.append(grouping);
  if (focusKey) goodsFilterBody.querySelector(`[data-goods-field="${focusKey}"]`)?.focus({preventScroll:true});
  if (goodsFilterSheet.open) enterContent(goodsFilterBody,-1,12);
}
function renderGoodsChoices() {
  const list = document.getElementById('goods-option-list'); list.replaceChildren();
  const query = goodsOptionSearch.value.trim().toLocaleLowerCase('uz');
  const values = ['',...new Set(goodsRows.map(item=>item[goodsChoosing]))].filter(value=>(value || 'Barchasi').toLocaleLowerCase('uz').includes(query));
  values.forEach(value=>{
    const label = document.createElement('label'); label.className = 'filter-option';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'goods-choice'; input.value = value; input.checked = (goodsDraft[goodsChoosing] || '') === value;
    const name = document.createElement('span'); name.textContent = value || 'Barchasi';
    input.addEventListener('click',()=>{const key = goodsChoosing;goodsDraft[key]=value;showGoodsFilterFields(key);}); label.append(input,name); list.append(label);
  });
  document.getElementById('goods-no-options').hidden = !!values.length;
}
function showGoodsChoices(key) {
  goodsChoosing = key; document.getElementById('goods-filter-title').textContent = goodsFilterLabels[key];
  document.getElementById('goods-filter-back').hidden = false;
  goodsFilterBody.hidden = true; goodsFilterChoices.hidden = false;
  document.getElementById('goods-filter-footer').hidden = true;
  goodsOptionSearch.value = ''; goodsOptionSearch.closest('label').hidden = !['supplier','warehouse','branch','category'].includes(key);
  renderGoodsChoices(); document.querySelector('#goods-option-list input:checked')?.focus({preventScroll:true}); enterContent(goodsFilterChoices,1,12);
}
goodsSearch.addEventListener('input', resetGoodsPage);
document.getElementById('goods-clear').addEventListener('click',()=>{goodsFilters={};goodsSearch.value='';goodsBarcode.value='';resetGoodsPage();goodsSearch.focus();});
goodsFilterTrigger.addEventListener('click',()=>{
  goodsDraft={...goodsFilters};showGoodsFilterFields();goodsOverflow=document.body.style.overflow;document.body.style.overflow='hidden';goodsFilterSheet.showModal();goodsFilterTrigger.setAttribute('aria-expanded','true');
});
goodsOptionSearch.addEventListener('input',renderGoodsChoices);
document.getElementById('goods-filter-back').addEventListener('click',()=>showGoodsFilterFields(goodsChoosing));
document.getElementById('goods-filter-close').addEventListener('click',()=>goodsFilterSheet.close());
document.getElementById('goods-filter-reset').addEventListener('click',()=>{goodsDraft={};showGoodsFilterFields();});
document.getElementById('goods-filter-form').addEventListener('submit',event=>{
  event.preventDefault();if(goodsChoosing)return;
  if(goodsDraft.from && goodsDraft.to && goodsDraft.from>goodsDraft.to){document.getElementById('goods-filter-error').textContent='Boshlanish sanasi tugash sanasidan keyin bo‘lmasin.';document.getElementById('goods-date-to').focus();return;}
  goodsFilters={...goodsDraft};resetGoodsPage();goodsFilterSheet.close();
});
goodsFilterSheet.addEventListener('close',()=>{document.body.style.overflow=goodsOverflow;goodsFilterTrigger.setAttribute('aria-expanded','false');if(goodsFilterTrigger.getClientRects().length)goodsFilterTrigger.focus({preventScroll:true});});
goodsFilterSheet.addEventListener('cancel',event=>{if(goodsChoosing){event.preventDefault();showGoodsFilterFields(goodsChoosing);}});
goodsFilterSheet.addEventListener('click',event=>{if(event.target!==goodsFilterSheet)return;const rect=goodsFilterSheet.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)goodsFilterSheet.close();});

renderGoods();

// Synthetic sales lines; source fields are preserved without copying Store records.
const salesRows=Array.from({length:16},(_,index)=>{
  const p=products[index%products.length],quantity=index===5?900:index===8?-2:2+index%5;
  const type=index===8?'Qaytarish':['Sotish','Qarzga','Bekor qilingan','Internet do‘kon'][index%4];
  const total=Math.round(quantity*p.salePrice*100)/100;
  return {...p,id:`SOT-${String(index+1).padStart(3,'0')}`,name:index===14?'Namuna-UzunMahsulotNomi'.repeat(6):p.name,date:`2026-10-${String(6-index%6).padStart(2,'0')}`,time:['09:15','12:30','16:45'][index%3],quantity,cost:p.price,sale:p.salePrice,total,paid:Math.round((type==='Qarzga'?total/2:total)*100)/100,difference:0,synced:index%3?`2026-10-${String(6-index%6).padStart(2,'0')}T17:00`:'',contact:index%2?'Ikkinchi namuna kontakt':'Namuna kontakt',employee:index%2?'Ikkinchi namuna xodim':'Namuna xodim',type,syncState:index%3?'Yuborilgan':'Yuborilmagan',batch:`NAM-SOTUV-${index+1}`};
});
// Repeated lines exercise grouping without mixing prices, currencies or parties.
salesRows[6]={...salesRows[0],id:'SOT-007',date:'2026-10-04',quantity:3,total:3*salesRows[0].sale,paid:3*salesRows[0].sale};
const salesColumnDefs=[['rowNumber','№',(_p,i)=>i+1],['date','Yaratilgan sana',p=>`${dateLabel(p.date)} · ${p.time}`],['name','Mahsulot nomlari',p=>p.name],['variant','Variatsiya',p=>p.variant||'—'],['barcode','Shtrix-kod',p=>p.barcode],['quantity','Miqdori',p=>p.quantity],['unit','O‘lchov birligi',p=>p.unit],['cost','Sotib olish narxi',p=>p.cost],['sale','Sotish narxi',p=>p.sale],['total','Umumiy to‘lov miqdori',p=>p.total],['paid','To‘langan',p=>p.paid],['difference','Tafovut',p=>p.difference],['currency','Valyuta',p=>p.currency],['branch','Filial',p=>p.branch],['warehouse','Ombor',p=>p.warehouse],['supplier','Ta’minotchi',p=>p.supplier],['synced','Sinxronizatsiya sanasi',p=>p.synced?`${dateLabel(p.synced.slice(0,10))} · ${p.synced.slice(11,16)}`:'—'],['batch','Ishlab chiqarish raqami',p=>p.batch||'—']];
let salesColumns=salesColumnDefs.map(([key])=>key),salesPageNumber=1,salesSort={key:'',direction:'desc'};
try{const saved=JSON.parse(localStorage.getItem('rizo-sales-columns-v1'));if(Array.isArray(saved)&&saved.includes('name'))salesColumns=[...new Set(saved.filter(key=>salesColumnDefs.some(([id])=>key===id)))];}catch{}
const salesFilterLabels={contact:'Kontaktlar',branch:'Filial',supplier:'Ta’minotchi',warehouse:'Ombor',unit:'O‘lchov birligi',employee:'Xodimlar',currency:'Valyuta',type:'Turi',syncState:'Holat',from:'Sanadan boshlab',to:'Sanagacha',group:'Guruhlash'};
let salesFilters={},salesDraft={},salesChoosing=null,salesOverflow='';
const salesSearch=document.getElementById('sales-search'),salesBarcode=document.getElementById('sales-barcode'),salesFilterSheet=document.getElementById('sales-filter-sheet'),salesFilterBody=document.getElementById('sales-filter-body'),salesFilterChoices=document.getElementById('sales-filter-choices'),salesOptionSearch=document.getElementById('sales-option-search'),salesFilterTrigger=document.getElementById('sales-filter-trigger');
function groupSales(rows){
  const groups=new Map();
  rows.forEach(row=>{
    // Never collapse currencies, variants, prices, suppliers or batch metadata.
    const key=JSON.stringify(['barcode','name','variant','unit','currency','cost','sale','branch','warehouse','supplier','contact','employee','type','syncState','batch'].map(key=>row[key]));
    if(!groups.has(key))groups.set(key,{...row,members:[row],id:`G-${row.id}`});
    else{const group=groups.get(key);group.members.push(row);['quantity','total','paid','difference'].forEach(key=>group[key]+=row[key]);if(`${row.date}T${row.time}`>`${group.date}T${group.time}`){group.date=row.date;group.time=row.time;}if(row.synced>group.synced){group.synced=row.synced;}}
  });return [...groups.values()];
}
function filteredSales(){
  const query=salesSearch.value.trim().toLocaleLowerCase('uz'),barcode=salesBarcode.value.trim().toLocaleLowerCase('uz');
  const rows=salesRows.filter(p=>p.name.toLocaleLowerCase('uz').includes(query)&&p.barcode.toLocaleLowerCase('uz').includes(barcode)&&Object.entries(salesFilters).every(([key,value])=>!value||key==='group'||(key==='from'?`${p.date}T${p.time}`>=value:key==='to'?`${p.date}T${p.time}`<=value:p[key]===value)));
  return sortReportRows(salesFilters.group?groupSales(rows):rows,salesColumnDefs,salesSort);
}
function salesTotals(rows){return ['UZS','USD'].map(currency=>({currency,total:Math.round(rows.filter(p=>p.currency===currency).reduce((sum,p)=>sum+p.total,0)*100)/100}));}
function salesTotalsMarkup(rows){return salesTotals(rows).map(t=>`<section class="purchase-total"><h3>${t.currency}</h3><dl><div><dt>Umumiy hisob</dt><dd>${money(t.total,t.currency)}</dd></div></dl></section>`).join('');}
function salesValue(value){return typeof value==='number'?format(value):value??'—';}
function salesTableMarkup(rows,links=true,offset=0){const columns=salesColumns.map(key=>salesColumnDefs.find(([id])=>key===id));return `<table><thead><tr>${columns.map(([key,label])=>sortHeader(key,label,'sales',links)).join('')}</tr></thead><tbody>${rows.map((p,i)=>`<tr>${columns.map(([key,,value])=>`<td data-column="${key}" class="${typeof value(p,i)==='number'?'numeric':''}">${key==='name'&&links?`<a class="product-link" data-sales href="#sales=${p.id}">${p.name}</a>`:salesValue(value(p,i+offset))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function resetSalesPage(){salesPageNumber=1;renderSales();}
function renderSales(){
  const rows=filteredSales(),pages=Math.max(1,Math.ceil(rows.length/10));salesPageNumber=Math.max(1,Math.min(salesPageNumber,pages));const offset=(salesPageNumber-1)*10,visible=rows.slice(offset,offset+10);
  document.getElementById('sales-count').textContent=`${rows.length} ta ${salesFilters.group?'guruh':'sotuv yozuvi'}`;
  document.getElementById('sales-cards').innerHTML=visible.map(p=>`<article class="stock-card sales-card"><div class="card-head"><h2><a class="product-link" data-sales href="#sales=${p.id}">${p.name}</a></h2><span class="currency">${p.currency}</span></div><p class="goods-meta">${dateLabel(p.date)} · ${p.variant&&p.variant!=='—'?p.variant:p.barcode}${p.members?.length>1?` · ${p.members.length} ta yozuv`:''}</p><dl class="goods-card-values"><div><dt>Miqdori</dt><dd>${format(p.quantity)} <small>${p.unit}</small></dd></div><div><dt>To‘langan</dt><dd>${format(p.paid)} <small>${p.currency}</small></dd></div><div><dt>Umumiy to‘lov</dt><dd>${format(p.total)} <small>${p.currency}</small></dd></div></dl><div class="invoice-card-footer"><span>${p.supplier}</span><span class="invoice-detail-hint" aria-hidden="true">Tafsilot ${icon('chevronRight')}</span></div></article>`).join('');
  document.getElementById('sales-table').innerHTML=salesTableMarkup(visible,true,offset);
  ['sales-cards','sales-table'].forEach(id=>document.getElementById(id).hidden=!rows.length);document.getElementById('sales-empty').hidden=!!rows.length;
  const pager=document.getElementById('sales-pagination');pager.hidden=pages<=1;pager.innerHTML=`<button class="outline-button" data-sales-page="${salesPageNumber-1}" ${salesPageNumber===1?'disabled':''} aria-label="Oldingi sotuv sahifasi">${icon('chevronLeft')}</button><span>${salesPageNumber} / ${pages}</span><button class="outline-button" data-sales-page="${salesPageNumber+1}" ${salesPageNumber===pages?'disabled':''} aria-label="Keyingi sotuv sahifasi">${icon('chevronRight')}</button>`;
  document.getElementById('sales-totals').innerHTML=salesTotalsMarkup(rows);
  const chips=document.getElementById('sales-filter-chips');chips.replaceChildren();const active=Object.entries(salesFilters).filter(([,value])=>value);
  active.forEach(([key,value])=>{const button=document.createElement('button');button.className='filter-chip';button.textContent=`${salesFilterLabels[key]}: ${key==='group'?'Ha':['from','to'].includes(key)?`${dateLabel(value.slice(0,10))} ${value.slice(11,16)}`:value} ×`;button.setAttribute('aria-label',`${salesFilterLabels[key]} filtrini olib tashlash`);button.addEventListener('click',()=>{delete salesFilters[key];resetSalesPage();salesFilterTrigger.focus({preventScroll:true});});chips.append(button);});
  const badge=document.getElementById('sales-filter-count');badge.hidden=!active.length;badge.textContent=active.length;animateResults(salesPage);
}
function performSalesAction(action){
  if(action==='sort'){openSortSheet('sales');return;}
  if(action==='refresh'){renderSales();document.getElementById('report-announcement').textContent='Sinov sotuv hisoboti yangilandi.';return;}
  if(action==='columns'){columnContext='sales';document.querySelector('#stock-columns-sheet .choice-note').textContent='Desktop jadvali, eksport va chop etish uchun. Mahsulot nomi doim ko‘rinadi.';stockColumnDraft=[...salesColumns,...salesColumnDefs.map(([key])=>key).filter(key=>!salesColumns.includes(key))].map(key=>({key,visible:salesColumns.includes(key)}));renderStockColumnChoices();openStockDialog(stockColumnsSheet);return;}
  const rows=filteredSales(),columns=salesColumns.map(key=>salesColumnDefs.find(([id])=>id===key));
  if(action==='export'){const url=URL.createObjectURL(new Blob([reportCSV({rows,columns})],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='rizo-sotuv-mahsulotlar.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('report-announcement').textContent=`${rows.length} ta sotuv yozuvi CSV faylga chiqarildi.`;}
  if(action==='print'){const html=`<h1>Mahsulot bo‘yicha sotish</h1><p>Sinov ma’lumotlari · ${rows.length} ta qator</p>${rows.length?salesTableMarkup(rows,false):'<p>Mahsulot topilmadi.</p>'}<div class="purchase-totals">${salesTotalsMarkup(rows)}</div>`;document.getElementById('stock-print-content').innerHTML=html;document.getElementById('print-area').innerHTML=html;openStockDialog(stockPrintPreview);}
}
function showSales(item){
  if(activeSales===item.id)return;rememberView();activeSales=item.id;activeGoods=null;activeLabels=null;activeInvoiceLine=null;activeProduct=null;activeInvoice=null;activeReservation=null;activePurchase=null;
  workspace.hidden=true;invoicePage.hidden=true;goodsPage.hidden=true;salesPage.hidden=true;productPage.hidden=false;detailBack.setAttribute('aria-label','Sotuv mahsulotlariga qaytish');document.getElementById('detail-page-label').textContent='Sotuv mahsuloti';
  const summary=document.createElement('section');summary.className='detail-summary';summary.innerHTML=`<div class="detail-kicker"><span>${dateLabel(item.date)} · ${item.time}</span><span class="currency">${item.currency}</span></div><h1 id="product-title" tabindex="-1">${item.name}</h1><p>${item.barcode}</p>`;
  const info=document.createElement('section');info.className='detail-information';info.innerHTML='<h2>Sotuv ma’lumotlari</h2><dl class="detail-fields"></dl>';info.querySelector('dl').append(...salesColumnDefs.filter(([key])=>key!=='rowNumber').map(([key,label,value])=>field(label,['cost','sale','total','paid','difference'].includes(key)?money(value(item),item.currency):['quantity'].includes(key)?`${format(value(item))} ${item.unit}`:salesValue(value(item)))));
  detailContent.classList.add('is-purchase-detail');detailContent.replaceChildren(summary,info);
  if(item.members?.length>1){const section=document.createElement('section');section.className='detail-information';section.innerHTML='<h2>Guruhdagi sotuvlar</h2>';item.members.forEach(row=>{const a=document.createElement('a');a.className='goods-member outline-button';a.href=`#sales=${row.id}`;a.dataset.sales='';a.textContent=`${dateLabel(row.date)} · ${format(row.quantity)} ${row.unit} · ${format(row.total)} ${row.currency}`;section.append(a);});detailContent.append(section);}
  document.title=`${item.name} · Sotuv · Rizo Store`;window.scrollTo(0,0);summary.querySelector('h1').focus({preventScroll:true});
}
salesBarcode.addEventListener('input',resetSalesPage);
document.addEventListener('click',event=>{const action=event.target.closest('[data-sales-action]');if(action){performSalesAction(action.dataset.salesAction);return;}const page=event.target.closest('[data-sales-page]');if(page){salesPageNumber=Number(page.dataset.salesPage);renderSales();document.getElementById('sales-report-title').focus({preventScroll:true});window.scrollTo(0,0);}});

function showSalesFilterFields(focusKey) {
  salesChoosing = null;
  document.getElementById('sales-filter-title').textContent = 'Sotuv filtri';
  document.getElementById('sales-filter-back').hidden = true;
  salesFilterBody.hidden = false; salesFilterChoices.hidden = true;
  document.getElementById('sales-filter-footer').hidden = false;
  document.getElementById('sales-filter-error').textContent = '';
  salesFilterBody.replaceChildren();
  Object.entries(salesFilterLabels).filter(([key])=>!['from','to','group'].includes(key)).forEach(([key,label])=>{
    const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-field'; button.dataset.salesField = key;
    const title = document.createElement('span'); title.className = 'filter-label'; title.textContent = label;
    const value = document.createElement('strong'); value.textContent = salesDraft[key] || 'Barchasi';
    const arrow = document.createElement('span'); arrow.className = 'field-arrow'; arrow.innerHTML = icon('chevronRight'); arrow.setAttribute('aria-hidden','true');
    button.append(title,value,arrow); button.addEventListener('click',()=>showSalesChoices(key)); salesFilterBody.append(button);
  });
  const dates = document.createElement('div'); dates.className = 'history-date-fields';
  ['from','to'].forEach(key=>{
    const label = document.createElement('label'); const name = document.createElement('span'); name.textContent = salesFilterLabels[key];
    const input = document.createElement('input'); input.type = 'datetime-local'; input.id = `sales-date-${key}`; input.value = salesDraft[key] || ''; input.setAttribute('aria-describedby','sales-filter-error');
    input.addEventListener('input',()=>{salesDraft[key]=input.value;document.getElementById('sales-filter-error').textContent='';});label.append(name,input); dates.append(label);
  });
  salesFilterBody.append(dates);
  const grouping=document.createElement('label');grouping.className='filter-option';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!salesDraft.group;checkbox.addEventListener('change',()=>salesDraft.group=checkbox.checked);
  grouping.append(checkbox,document.createTextNode('Guruhlash'));salesFilterBody.append(grouping);
  if (focusKey) salesFilterBody.querySelector(`[data-sales-field="${focusKey}"]`)?.focus({preventScroll:true});
  if (salesFilterSheet.open) enterContent(salesFilterBody,-1,12);
}
function renderSalesChoices() {
  const list = document.getElementById('sales-option-list'); list.replaceChildren();
  const query = salesOptionSearch.value.trim().toLocaleLowerCase('uz');
  const values = ['',...new Set(salesChoosing==='type'?['Qaytarish','Sotish','Qarzga','Bekor qilingan','Internet do‘kon']:salesChoosing==='syncState'?['Yuborilgan','Yuborilmagan']:salesRows.map(item=>item[salesChoosing]))].filter(value=>(value || 'Barchasi').toLocaleLowerCase('uz').includes(query));
  values.forEach(value=>{
    const label = document.createElement('label'); label.className = 'filter-option';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'sales-choice'; input.value = value; input.checked = (salesDraft[salesChoosing] || '') === value;
    const name = document.createElement('span'); name.textContent = value || 'Barchasi';
    input.addEventListener('click',()=>{const key = salesChoosing;salesDraft[key]=value;showSalesFilterFields(key);}); label.append(input,name); list.append(label);
  });
  document.getElementById('sales-no-options').hidden = !!values.length;
}
function showSalesChoices(key) {
  salesChoosing = key; document.getElementById('sales-filter-title').textContent = salesFilterLabels[key];
  document.getElementById('sales-filter-back').hidden = false;
  salesFilterBody.hidden = true; salesFilterChoices.hidden = false;
  document.getElementById('sales-filter-footer').hidden = true;
  salesOptionSearch.value = ''; salesOptionSearch.closest('label').hidden = !['contact','employee','supplier','warehouse','branch'].includes(key);
  renderSalesChoices(); document.querySelector('#sales-option-list input:checked')?.focus({preventScroll:true}); enterContent(salesFilterChoices,1,12);
}
salesSearch.addEventListener('input', resetSalesPage);
document.getElementById('sales-clear').addEventListener('click',()=>{salesFilters={};salesSearch.value='';salesBarcode.value='';resetSalesPage();salesSearch.focus();});
salesFilterTrigger.addEventListener('click',()=>{
  salesDraft={...salesFilters};showSalesFilterFields();salesOverflow=document.body.style.overflow;document.body.style.overflow='hidden';salesFilterSheet.showModal();salesFilterTrigger.setAttribute('aria-expanded','true');
});
salesOptionSearch.addEventListener('input',renderSalesChoices);
document.getElementById('sales-filter-back').addEventListener('click',()=>showSalesFilterFields(salesChoosing));
document.getElementById('sales-filter-close').addEventListener('click',()=>salesFilterSheet.close());
document.getElementById('sales-filter-reset').addEventListener('click',()=>{salesDraft={};showSalesFilterFields();});
document.getElementById('sales-filter-form').addEventListener('submit',event=>{
  event.preventDefault();if(salesChoosing)return;
  if(salesDraft.from && salesDraft.to && salesDraft.from>salesDraft.to){document.getElementById('sales-filter-error').textContent='Boshlanish sanasi tugash sanasidan keyin bo‘lmasin.';document.getElementById('sales-date-to').focus();return;}
  salesFilters={...salesDraft};resetSalesPage();salesFilterSheet.close();
});
salesFilterSheet.addEventListener('close',()=>{document.body.style.overflow=salesOverflow;salesFilterTrigger.setAttribute('aria-expanded','false');if(salesFilterTrigger.getClientRects().length)salesFilterTrigger.focus({preventScroll:true});});
salesFilterSheet.addEventListener('cancel',event=>{if(salesChoosing){event.preventDefault();showSalesFilterFields(salesChoosing);}});
salesFilterSheet.addEventListener('click',event=>{if(event.target!==salesFilterSheet)return;const rect=salesFilterSheet.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)salesFilterSheet.close();});

renderSales();

// Synthetic document returns; no live Store records are copied.
const returnsRows=Array.from({length:16},(_,index)=>{
  const p=products[index%products.length],quantity=index===5?900:2+index%5;
  return {...p,id:`QAY-${String(index+1).padStart(3,'0')}`,name:index===14?'Namuna-UzunMahsulotNomi'.repeat(6):p.name,date:`2026-10-${String(6-index%6).padStart(2,'0')}`,time:['09:15','12:30','16:45'][index%3],quantity,cost:p.price,total:Math.round(quantity*p.price*100)/100,reason:index%3===0?'Namuna: qadoq shikastlangan':index%3===1?'Namuna: buyurtmaga mos kelmagan':'Namuna: uzoq tavsifli qaytarish sababi — tekshiruv vaqtida mahsulotning qadoqlanishi va komplektatsiyasida tafovut aniqlandi',employee:index%2?'Ikkinchi namuna xodim':'Namuna xodim',batch:`NAM-QAYTISH-${index+1}`};
});
// Synthetic duplicate exercises mixed reasons and prices observed in the source report.
returnsRows[6]={...returnsRows[0],id:'QAY-007',date:'2026-10-04',quantity:3,cost:returnsRows[0].cost+1000,total:3*(returnsRows[0].cost+1000),reason:'Namuna: buyurtmaga mos kelmagan'};
const returnsColumnDefs=[['rowNumber','№',(_p,i)=>i+1],['date','Yaratilgan sana',p=>`${dateLabel(p.date)} · ${p.time}`],['name','Mahsulot nomlari',p=>p.name],['variant','Variatsiya',p=>p.variant||'—'],['barcode','Shtrix-kod',p=>p.barcode],['reason','Qaytish sababi',p=>p.reason],['quantity','Miqdori',p=>p.quantity],['unit','O‘lchov birligi',p=>p.unit],['cost','Narx.Kelish',p=>p.cost],['total','Yakuniy kirish narxi',p=>p.total],['currency','Valyuta',p=>p.currency],['employee','Xodim',p=>p.employee],['branch','Filial',p=>p.branch],['warehouse','Ombor',p=>p.warehouse],['supplier','Ta’minotchi',p=>p.supplier],['batch','Ishlab chiqarish raqami',p=>p.batch||'—']];
let returnsColumns=returnsColumnDefs.map(([key])=>key),returnsPageNumber=1,returnsSort={key:'',direction:'desc'};
try{const saved=JSON.parse(localStorage.getItem('rizo-returns-columns-v1'));if(Array.isArray(saved)&&saved.includes('name'))returnsColumns=[...new Set(saved.filter(key=>returnsColumnDefs.some(([id])=>key===id)))];}catch{}
const returnsFilterLabels={branch:'Filial',supplier:'Ta’minotchi',warehouse:'Ombor',unit:'O‘lchov birligi',currency:'Valyuta',from:'Sanadan boshlab',to:'Sanagacha',group:'Guruhlash'};
let returnsFilters={},returnsDraft={},returnsChoosing=null,returnsOverflow='';
const returnsSearch=document.getElementById('returns-search'),returnsBarcode=document.getElementById('returns-barcode'),returnsFilterSheet=document.getElementById('returns-filter-sheet'),returnsFilterBody=document.getElementById('returns-filter-body'),returnsFilterChoices=document.getElementById('returns-filter-choices'),returnsOptionSearch=document.getElementById('returns-option-search'),returnsFilterTrigger=document.getElementById('returns-filter-trigger');
function groupReturns(rows){
  const groups=new Map();
  rows.forEach(row=>{
    // Source groups by product, including different prices, reasons and suppliers.
    // Keep incompatible currencies, variants and units separate.
    const key=JSON.stringify(['barcode','variant','unit','currency'].map(key=>row[key]));
    if(!groups.has(key))groups.set(key,{...row,cost:row.total,members:[row],id:`G-${row.id}`});
    else{
      const group=groups.get(key);group.members.push(row);
      ['quantity','total'].forEach(key=>group[key]+=row[key]);group.cost=group.total;
      ['reason','branch','warehouse','supplier','employee','batch'].forEach(key=>{if(group[key]!==row[key])group[key]='';});
      if(`${row.date}T${row.time}`>`${group.date}T${group.time}`){group.date=row.date;group.time=row.time;group.name=row.name;}
    }
  });return [...groups.values()];
}
function filteredReturns(){
  const query=returnsSearch.value.trim().toLocaleLowerCase('uz'),barcode=returnsBarcode.value.trim().toLocaleLowerCase('uz');
  const rows=returnsRows.filter(p=>p.name.toLocaleLowerCase('uz').includes(query)&&p.barcode.toLocaleLowerCase('uz').includes(barcode)&&Object.entries(returnsFilters).every(([key,value])=>!value||key==='group'||(key==='from'?p.date>=value:key==='to'?p.date<=value:p[key]===value)));
  return sortReportRows(returnsFilters.group?groupReturns(rows):rows,returnsColumnDefs,returnsSort);
}
function returnsTotals(rows){return [...new Set(rows.map(row=>row.currency))].map(currency=>({currency,total:Math.round(rows.filter(row=>row.currency===currency).reduce((sum,row)=>sum+row.total,0)*100)/100}));}
function returnsTotalsMarkup(rows){return returnsTotals(rows).map(t=>`<section class="purchase-total"><h3>${t.currency}</h3><dl><div><dt>Umumiy qaytarish summasi</dt><dd>${money(t.total,t.currency)}</dd></div></dl></section>`).join('');}
function returnsValue(value){return typeof value==='number'?format(value):value||'—';}
function returnsTableMarkup(rows,links=true,offset=0){const columns=returnsColumns.map(key=>returnsColumnDefs.find(([id])=>key===id));return `<table><thead><tr>${columns.map(([key,label])=>sortHeader(key,label,'returns',links)).join('')}</tr></thead><tbody>${rows.map((p,i)=>`<tr>${columns.map(([key,,value])=>`<td data-column="${key}" class="${typeof value(p,i)==='number'?'numeric':''}">${key==='name'&&links?`<a class="product-link" data-returns href="#returns=${p.id}">${p.name}</a>`:returnsValue(value(p,i+offset))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function resetReturnsPage(){returnsPageNumber=1;renderReturns();}
function renderReturns(){
  const rows=filteredReturns(),pages=Math.max(1,Math.ceil(rows.length/10));returnsPageNumber=Math.max(1,Math.min(returnsPageNumber,pages));const offset=(returnsPageNumber-1)*10,visible=rows.slice(offset,offset+10);
  document.getElementById('returns-totals').innerHTML=returnsTotalsMarkup(rows);
  document.getElementById('returns-count').textContent=`${rows.length} ta ${returnsFilters.group?'guruh':'qaytarish yozuvi'}`;
  document.getElementById('returns-cards').innerHTML=visible.map(p=>`<article class="stock-card returns-card"><div class="card-head"><h2><a class="product-link" data-returns href="#returns=${p.id}">${p.name}</a></h2><span class="currency">${p.currency}</span></div><p class="goods-meta">${dateLabel(p.date)} · ${p.variant&&p.variant!=='—'?p.variant:p.barcode}${p.members?.length>1?` · ${p.members.length} ta yozuv`:''}</p><p class="returns-reason"><span>Qaytish sababi</span>${returnsValue(p.reason)}</p><dl class="goods-card-values"><div><dt>Miqdori</dt><dd>${format(p.quantity)} <small>${p.unit}</small></dd></div><div><dt>Yakuniy kirish narxi</dt><dd>${format(p.total)} <small>${p.currency}</small></dd></div></dl><div class="invoice-card-footer"><span>${p.supplier}</span><span class="invoice-detail-hint" aria-hidden="true">Tafsilot ${icon('chevronRight')}</span></div></article>`).join('');
  document.getElementById('returns-table').innerHTML=returnsTableMarkup(visible,true,offset);
  ['returns-cards','returns-table'].forEach(id=>document.getElementById(id).hidden=!rows.length);document.getElementById('returns-empty').hidden=!!rows.length;
  const pager=document.getElementById('returns-pagination');pager.hidden=pages<=1;pager.innerHTML=`<button class="outline-button" data-returns-page="${returnsPageNumber-1}" ${returnsPageNumber===1?'disabled':''} aria-label="Oldingi qaytarish sahifasi">${icon('chevronLeft')}</button><span>${returnsPageNumber} / ${pages}</span><button class="outline-button" data-returns-page="${returnsPageNumber+1}" ${returnsPageNumber===pages?'disabled':''} aria-label="Keyingi qaytarish sahifasi">${icon('chevronRight')}</button>`;
  const chips=document.getElementById('returns-filter-chips');chips.replaceChildren();const active=Object.entries(returnsFilters).filter(([,value])=>value);
  active.forEach(([key,value])=>{const button=document.createElement('button');button.className='filter-chip';button.textContent=`${returnsFilterLabels[key]}: ${key==='group'?'Ha':['from','to'].includes(key)?dateLabel(value):value} ×`;button.setAttribute('aria-label',`${returnsFilterLabels[key]} filtrini olib tashlash`);button.addEventListener('click',()=>{delete returnsFilters[key];resetReturnsPage();returnsFilterTrigger.focus({preventScroll:true});});chips.append(button);});
  const badge=document.getElementById('returns-filter-count');badge.hidden=!active.length;badge.textContent=active.length;animateResults(returnsPage);
}
function performReturnsAction(action){
  if(action==='sort'){openSortSheet('returns');return;}
  if(action==='refresh'){renderReturns();document.getElementById('report-announcement').textContent='Sinov qaytarish hisoboti yangilandi.';return;}
  if(action==='columns'){columnContext='returns';document.querySelector('#stock-columns-sheet .choice-note').textContent='Desktop jadvali, eksport va chop etish uchun. Mahsulot nomi doim ko‘rinadi.';stockColumnDraft=[...returnsColumns,...returnsColumnDefs.map(([key])=>key).filter(key=>!returnsColumns.includes(key))].map(key=>({key,visible:returnsColumns.includes(key)}));renderStockColumnChoices();openStockDialog(stockColumnsSheet);return;}
  const rows=filteredReturns(),columns=returnsColumns.map(key=>returnsColumnDefs.find(([id])=>id===key));
  if(action==='export'){const url=URL.createObjectURL(new Blob([reportCSV({rows,columns})],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='rizo-qaytarish-mahsulotlar.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('report-announcement').textContent=`${rows.length} ta qaytarish yozuvi CSV faylga chiqarildi.`;}
  if(action==='print'){const html=`<h1>Hujjatlar bo‘yicha qaytarishlar</h1><p>Sinov ma’lumotlari · ${rows.length} ta qator</p>${rows.length?returnsTableMarkup(rows,false):'<p>Mahsulot topilmadi.</p>'}<div class="purchase-totals">${returnsTotalsMarkup(rows)}</div>`;document.getElementById('stock-print-content').innerHTML=html;document.getElementById('print-area').innerHTML=html;openStockDialog(stockPrintPreview);}
}
function showReturns(item){
  if(activeReturns===item.id)return;rememberView();activeReturns=item.id;activeSales=null;activeGoods=null;activeLabels=null;activeInvoiceLine=null;activeProduct=null;activeInvoice=null;activeReservation=null;activePurchase=null;
  workspace.hidden=true;invoicePage.hidden=true;goodsPage.hidden=true;returnsPage.hidden=true;salesPage.hidden=true;productPage.hidden=false;detailBack.setAttribute('aria-label','Qaytarish mahsulotlariga qaytish');document.getElementById('detail-page-label').textContent='Qaytarish mahsuloti';
  const summary=document.createElement('section');summary.className='detail-summary';summary.innerHTML=`<div class="detail-kicker"><span>${dateLabel(item.date)} · ${item.time}</span><span class="currency">${item.currency}</span></div><h1 id="product-title" tabindex="-1">${item.name}</h1><p>${item.barcode}</p>`;
  const info=document.createElement('section');info.className='detail-information';info.innerHTML='<h2>Qaytarish ma’lumotlari</h2><dl class="detail-fields"></dl>';info.querySelector('dl').append(...returnsColumnDefs.filter(([key])=>key!=='rowNumber').map(([key,label,value])=>field(label,['cost','total'].includes(key)?money(value(item),item.currency):['quantity'].includes(key)?`${format(value(item))} ${item.unit}`:returnsValue(value(item)))));
  detailContent.classList.add('is-purchase-detail');detailContent.replaceChildren(summary,info);
  if(item.members?.length>1){const section=document.createElement('section');section.className='detail-information';section.innerHTML='<h2>Guruhdagi qaytarishlar</h2>';item.members.forEach(row=>{const a=document.createElement('a');a.className='goods-member outline-button';a.href=`#returns=${row.id}`;a.dataset.returns='';a.textContent=`${dateLabel(row.date)} · ${format(row.quantity)} ${row.unit} · ${format(row.total)} ${row.currency}`;section.append(a);});detailContent.append(section);}
  document.title=`${item.name} · Qaytarish · Rizo Store`;window.scrollTo(0,0);summary.querySelector('h1').focus({preventScroll:true});
}
returnsBarcode.addEventListener('input',resetReturnsPage);
document.addEventListener('click',event=>{const action=event.target.closest('[data-returns-action]');if(action){performReturnsAction(action.dataset.returnsAction);return;}const page=event.target.closest('[data-returns-page]');if(page){returnsPageNumber=Number(page.dataset.returnsPage);renderReturns();document.getElementById('returns-report-title').focus({preventScroll:true});window.scrollTo(0,0);}});

function showReturnsFilterFields(focusKey) {
  returnsChoosing = null;
  document.getElementById('returns-filter-title').textContent = 'Qaytarish filtri';
  document.getElementById('returns-filter-back').hidden = true;
  returnsFilterBody.hidden = false; returnsFilterChoices.hidden = true;
  document.getElementById('returns-filter-footer').hidden = false;
  document.getElementById('returns-filter-error').textContent = '';
  returnsFilterBody.replaceChildren();
  Object.entries(returnsFilterLabels).filter(([key])=>!['from','to','group'].includes(key)).forEach(([key,label])=>{
    const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-field'; button.dataset.returnsField = key;
    const title = document.createElement('span'); title.className = 'filter-label'; title.textContent = label;
    const value = document.createElement('strong'); value.textContent = returnsDraft[key] || 'Barchasi';
    const arrow = document.createElement('span'); arrow.className = 'field-arrow'; arrow.innerHTML = icon('chevronRight'); arrow.setAttribute('aria-hidden','true');
    button.append(title,value,arrow); button.addEventListener('click',()=>showReturnsChoices(key)); returnsFilterBody.append(button);
  });
  const dates = document.createElement('div'); dates.className = 'history-date-fields';
  ['from','to'].forEach(key=>{
    const label = document.createElement('label'); const name = document.createElement('span'); name.textContent = returnsFilterLabels[key];
    const input = document.createElement('input'); input.type = 'date'; input.id = `returns-date-${key}`; input.value = returnsDraft[key] || ''; input.setAttribute('aria-describedby','returns-filter-error');
    input.addEventListener('input',()=>{returnsDraft[key]=input.value;document.getElementById('returns-filter-error').textContent='';});label.append(name,input); dates.append(label);
  });
  returnsFilterBody.append(dates);
  const grouping=document.createElement('label');grouping.className='filter-option';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!returnsDraft.group;checkbox.addEventListener('change',()=>returnsDraft.group=checkbox.checked);
  grouping.append(checkbox,document.createTextNode('Guruhlash'));returnsFilterBody.append(grouping);
  if (focusKey) returnsFilterBody.querySelector(`[data-returns-field="${focusKey}"]`)?.focus({preventScroll:true});
  if (returnsFilterSheet.open) enterContent(returnsFilterBody,-1,12);
}
function renderReturnsChoices() {
  const list = document.getElementById('returns-option-list'); list.replaceChildren();
  const query = returnsOptionSearch.value.trim().toLocaleLowerCase('uz');
  const values = ['',...new Set(returnsRows.map(item=>item[returnsChoosing]))].filter(value=>(value || 'Barchasi').toLocaleLowerCase('uz').includes(query));
  values.forEach(value=>{
    const label = document.createElement('label'); label.className = 'filter-option';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'returns-choice'; input.value = value; input.checked = (returnsDraft[returnsChoosing] || '') === value;
    const name = document.createElement('span'); name.textContent = value || 'Barchasi';
    input.addEventListener('click',()=>{const key = returnsChoosing;returnsDraft[key]=value;showReturnsFilterFields(key);}); label.append(input,name); list.append(label);
  });
  document.getElementById('returns-no-options').hidden = !!values.length;
}
function showReturnsChoices(key) {
  returnsChoosing = key; document.getElementById('returns-filter-title').textContent = returnsFilterLabels[key];
  document.getElementById('returns-filter-back').hidden = false;
  returnsFilterBody.hidden = true; returnsFilterChoices.hidden = false;
  document.getElementById('returns-filter-footer').hidden = true;
  returnsOptionSearch.value = ''; returnsOptionSearch.closest('label').hidden = !['supplier','warehouse','branch','unit'].includes(key);
  renderReturnsChoices(); document.querySelector('#returns-option-list input:checked')?.focus({preventScroll:true}); enterContent(returnsFilterChoices,1,12);
}
returnsSearch.addEventListener('input', resetReturnsPage);
document.getElementById('returns-clear').addEventListener('click',()=>{returnsFilters={};returnsSearch.value='';returnsBarcode.value='';resetReturnsPage();returnsSearch.focus();});
returnsFilterTrigger.addEventListener('click',()=>{
  returnsDraft={...returnsFilters};showReturnsFilterFields();returnsOverflow=document.body.style.overflow;document.body.style.overflow='hidden';returnsFilterSheet.showModal();returnsFilterTrigger.setAttribute('aria-expanded','true');
});
returnsOptionSearch.addEventListener('input',renderReturnsChoices);
document.getElementById('returns-filter-back').addEventListener('click',()=>showReturnsFilterFields(returnsChoosing));
document.getElementById('returns-filter-close').addEventListener('click',()=>returnsFilterSheet.close());
document.getElementById('returns-filter-reset').addEventListener('click',()=>{returnsDraft={};showReturnsFilterFields();});
document.getElementById('returns-filter-form').addEventListener('submit',event=>{
  event.preventDefault();if(returnsChoosing)return;
  if(returnsDraft.from && returnsDraft.to && returnsDraft.from>returnsDraft.to){document.getElementById('returns-filter-error').textContent='Boshlanish sanasi tugash sanasidan keyin bo‘lmasin.';document.getElementById('returns-date-to').focus();return;}
  returnsFilters={...returnsDraft};resetReturnsPage();returnsFilterSheet.close();
});
returnsFilterSheet.addEventListener('close',()=>{document.body.style.overflow=returnsOverflow;returnsFilterTrigger.setAttribute('aria-expanded','false');if(returnsFilterTrigger.getClientRects().length)returnsFilterTrigger.focus({preventScroll:true});});
returnsFilterSheet.addEventListener('cancel',event=>{if(returnsChoosing){event.preventDefault();showReturnsFilterFields(returnsChoosing);}});
returnsFilterSheet.addEventListener('click',event=>{if(event.target!==returnsFilterSheet)return;const rect=returnsFilterSheet.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)returnsFilterSheet.close();});

renderReturns();

// Reserved rows are isolated examples, not copies of live Store records.
const reservations=[
  [0,2,'Kechiktirilgan chek',0,'2026-10-05','10:10'],[0,1,'Kechiktirilgan chek',4000,'2026-10-05','10:10'],[1,20,'Onlayn buyurtma',1000000,'2026-10-04','15:30'],[2,75,'Onlayn buyurtma',0,'2026-10-03','11:20'],[4,2,'Kechiktirilgan chek',900,'2026-10-02','09:00'],[5,10,'Onlayn buyurtma',150000000,'2026-09-28','16:45'],[1,5,'Kechiktirilgan chek',0,'2026-09-26','12:10'],[0,1,'Onlayn buyurtma',9600,'2026-09-25','08:30']
].map(([index,quantity,type,paid,date,time],i)=>({...products[index],id:`ZAX-${String(i+1).padStart(3,'0')}`,quantity,type,paid,date,time,total:quantity*products[index].salePrice,cashier:index===2?'Savdoni rasmiylashtirgan uzun ismli namuna xodim':'Namuna kassir',synced:`${date} ${time}`,ids:[`ZAX-${String(i+1).padStart(3,'0')}`]}));
const reservedFilterLabels={branch:'Filial',supplier:'Ta’minotchi',warehouse:'Ombor',unit:'O‘lchov birligi',cashier:'Xodim',currency:'Valyuta',type:'Turi',from:'Sanadan boshlab',to:'Sanagacha',group:'Guruhlash'};
const emptyReservedFilters=()=>({branch:'',supplier:'',warehouse:'',unit:'',cashier:'',currency:'',type:'',from:'',to:'',group:false});
let reservedFilters=emptyReservedFilters(),reservedDraft=emptyReservedFilters(),reservedChoosing=null;
const reservedColumnDefs=[['rowNumber','№',(_p,index)=>index+1],['date','Yaratilgan sana',p=>`${dateLabel(p.date)} · ${p.time}`],['name','Mahsulot nomlari',p=>p.name],['variant','Variatsiya',p=>p.variant],['barcode','Shtrix-kod',p=>p.barcode],['category','Turkum',p=>p.category],['type','Turi',p=>p.type],['quantity','Miqdori',p=>p.quantity],['unit','O‘lchov birligi',p=>p.unit],['currency','Valyuta',p=>p.currency],['price','Sotib olish narxi',p=>p.price],['salePrice','Sotish narxi',p=>p.salePrice],['paid','To‘langan',p=>p.paid],['difference','Tafovut',p=>p.total-p.paid],['total','Umumiy to‘lov miqdori',p=>p.total],['cashier','Kassir',p=>p.cashier],['branch','Filial',p=>p.branch],['warehouse','Ombor',p=>p.warehouse],['supplier','Ta’minotchi',p=>p.supplier],['synced','Sinxronizatsiya sanasi',p=>`${dateLabel(p.synced.slice(0,10))} · ${p.synced.slice(11,16)}`],['batch','Ishlab chiqarish raqami',p=>p.batch]];
let reservedColumns=reservedColumnDefs.map(([key])=>key);
try{const saved=JSON.parse(localStorage.getItem('rizo-reserved-columns-v2'));if(Array.isArray(saved)&&saved.includes('name'))reservedColumns=[...new Set(saved.filter(key=>reservedColumnDefs.some(([id])=>id===key)))];}catch{}
function groupReservations(rows){const groups=new Map();rows.forEach(row=>{const key=JSON.stringify([row.barcode,row.variant,row.type,row.currency,row.price,row.salePrice,row.cashier,row.branch,row.warehouse,row.supplier,row.date,row.time,row.synced,row.batch]);if(groups.has(key)){const p=groups.get(key);p.quantity+=row.quantity;p.paid+=row.paid;p.total+=row.total;p.ids.push(row.id);}else groups.set(key,{...row,id:`group-${row.id}`,ids:[row.id]});});return [...groups.values()];}
function allReservedRows(){return [...reservations,...groupReservations(reservations)];}
function filteredReservedRows(){const query=search.value.trim().toLocaleLowerCase('uz');let rows=reservations.filter(p=>`${p.name} ${p.barcode}`.toLocaleLowerCase('uz').includes(query)&&(!barcodeSearch.value.trim()||p.barcode.toLocaleLowerCase('uz').includes(barcodeSearch.value.trim().toLocaleLowerCase('uz')))&&['branch','supplier','warehouse','unit','cashier','currency','type'].every(key=>!reservedFilters[key]||p[key]===reservedFilters[key])&&(!reservedFilters.from||`${p.date}T${p.time}`>=reservedFilters.from)&&(!reservedFilters.to||`${p.date}T${p.time}`<=reservedFilters.to));return sortReportRows(reservedFilters.group?groupReservations(rows):rows,reservedColumnDefs,reportSorts.reserved);}
function reservedTableMarkup(rows,links=true){const columns=reservedColumns.map(key=>reservedColumnDefs.find(([id])=>id===key));return `<table><thead><tr>${columns.map(([key,label])=>sortHeader(key,label,'report',links)).join('')}</tr></thead><tbody>${rows.map((p,i)=>`<tr>${columns.map(([key,,value])=>{const v=value(p,links?(stockPageNumber-1)*stockPageSize+i:i);return `<td class="${typeof v==='number'?'numeric':''}">${key==='name'&&links?`<a class="product-link" href="#reserved=${p.id}" data-reservation="${p.id}">${v}</a>`:typeof v==='number'?format(v):v}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;}
function reservedTotalsMarkup(rows){return [...new Set(rows.map(p=>p.currency))].map(currency=>{const list=rows.filter(p=>p.currency===currency),paid=list.reduce((s,p)=>s+p.paid,0),total=list.reduce((s,p)=>s+p.total,0);return `<section class="purchase-total"><h3>Jami <span class="currency">${currency}</span></h3><dl><div><dt>Umumiy to‘lov</dt><dd>${format(total)}</dd></div><div><dt>To‘langan</dt><dd>${format(paid)}</dd></div><div><dt>Tafovut</dt><dd>${format(total-paid)}</dd></div></dl></section>`;}).join('');}
function reservedDateLabel(value){return value?`${dateLabel(value.slice(0,10))}${value.includes('T')?' · '+value.slice(11,16):''}`:'Barchasi';}
function renderReserved(){const rows=filteredReservedRows(),pages=Math.max(1,Math.ceil(rows.length/stockPageSize));stockPageNumber=Math.min(Math.max(stockPageNumber,1),pages);const visible=rows.slice((stockPageNumber-1)*stockPageSize,stockPageNumber*stockPageSize);document.getElementById('result-count').textContent=`${rows.length} ta ${reservedFilters.group?'guruh':'zaxira yozuvi'}`;document.querySelector('#main .table-wrap').innerHTML=reservedTableMarkup(visible);document.querySelector('#main .table-wrap').hidden=!rows.length;
  const cards=document.getElementById('cards');cards.hidden=!rows.length;cards.innerHTML=visible.map(p=>`<article class="stock-card"><div class="card-head"><h2><a class="product-link" href="#reserved=${p.id}" data-reservation="${p.id}" aria-label="${p.name} — ${p.ids.join(', ')} zaxira tafsiloti">${p.name}</a></h2><span class="currency">${p.currency}</span></div><div class="reserved-meta"><span>${p.type}</span><time datetime="${p.date}T${p.time}">${dateLabel(p.date)} · ${p.time}</time></div><dl class="card-values"><div><dt>Zaxiralangan</dt><dd>${format(p.quantity)} <span class="unit">${p.unit}</span></dd></div><div><dt>Umumiy to‘lov</dt><dd>${format(p.total)}</dd></div></dl><div class="reserved-card-bottom"><span class="status ${p.paid>=p.total?'ok':p.paid?'low':'zero'}">${p.paid>=p.total?'To‘langan':p.paid?'Qisman to‘langan':'To‘lanmagan'}</span><a class="invoice-detail-hint" href="#reserved=${p.id}" data-reservation="${p.id}" aria-label="${p.ids.join(', ')} tafsiloti">Tafsilot ${icon('chevronRight')}</a></div></article>`).join('');
  document.getElementById('empty').hidden=!!rows.length;document.querySelector('#empty h2').textContent='Zaxiralangan mahsulot topilmadi';document.getElementById('clear-search').textContent='Qidiruv va filtrlarni tozalash';
  const pager=document.getElementById('stock-pagination');pager.hidden=pages<=1;pager.innerHTML=`<button class="outline-button" data-stock-page="${stockPageNumber-1}" ${stockPageNumber===1?'disabled':''} aria-label="Oldingi qoldiq sahifasi">${icon('chevronLeft')}</button><span>${stockPageNumber} / ${pages}</span><button class="outline-button" data-stock-page="${stockPageNumber+1}" ${stockPageNumber===pages?'disabled':''} aria-label="Keyingi qoldiq sahifasi">${icon('chevronRight')}</button>`;
  document.getElementById('stock-totals').replaceChildren();document.getElementById('stock-context-note').hidden=true;
  const active=Object.entries(reservedFilters).filter(([,v])=>v),chips=document.getElementById('filter-chips');chips.replaceChildren();active.forEach(([key,value])=>{const label=`${reservedFilterLabels[key]}: ${key==='group'?'Yoqilgan':['from','to'].includes(key)?reservedDateLabel(value):value}`;const button=document.createElement('button');button.className='filter-chip';button.textContent=`${label} ×`;button.setAttribute('aria-label',`${label} filtrini olib tashlash`);button.addEventListener('click',()=>{reservedFilters[key]=emptyReservedFilters()[key];resetStockPage();filterTrigger.focus({preventScroll:true});});chips.append(button);});const badge=document.getElementById('filter-count');badge.hidden=!active.length;badge.textContent=active.length;filterTrigger.setAttribute('aria-label',active.length?`Filtr, ${active.length} ta faol`:'Filtr');
}
const stockSubSheet=document.getElementById('stock-sub-sheet'),stockSubPicker=document.getElementById('stock-sub-picker');let stockSubOverflow='';
function updateStockSubNavigation(){const reserved=stockTab==='reserved';document.querySelector('#main [data-stock-action="print"]').hidden=reserved;document.getElementById('reports-title').textContent=reserved?'Zaxiralangan mahsulotlar':'Qoldiq';stockSubPicker.querySelector('strong').textContent=reserved?'Zaxiralangan mahsulotlar':'Qoldiq';document.querySelector('#main .table-wrap').setAttribute('aria-label',reserved?'Zaxiralangan mahsulotlar jadvali, gorizontal aylantirish mumkin':'Qoldiqlar jadvali, gorizontal aylantirish mumkin');document.querySelector('#main>.stage-note').textContent=reserved?'Sinov zaxira yozuvlari. Jonli omborga bog‘lanmagan.':'Sinov ma’lumotlari · 06.10.2026 holatiga. Summalar valyutalar bo‘yicha alohida hisoblanadi.';document.querySelectorAll('.stock-subtabs [data-route],#stock-sub-sheet [data-route]').forEach(button=>{const current=button.dataset.route===(reserved?'reserved':'reports');button.classList.toggle('selected',current&&!!button.closest('.stock-subtabs'));if(current)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');if(button.closest('#stock-sub-sheet')){button.querySelector('svg')?.remove();if(current)button.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>');}});}
stockSubPicker.addEventListener('click',()=>{stockSubOverflow=document.body.style.overflow;document.body.style.overflow='hidden';stockSubSheet.showModal();stockSubPicker.setAttribute('aria-expanded','true');});stockSubSheet.querySelector('[data-stock-sub-close]').addEventListener('click',()=>stockSubSheet.close());stockSubSheet.addEventListener('close',()=>{document.body.style.overflow=stockSubOverflow;stockSubPicker.setAttribute('aria-expanded','false');if(stockSubPicker.getClientRects().length)stockSubPicker.focus({preventScroll:true});});stockSubSheet.addEventListener('click',event=>{if(event.target!==stockSubSheet)return;const r=stockSubSheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)stockSubSheet.close();});
function showReservation(p){if(activeReservation===p.id)return;rememberView();activeReservation=p.id;activeInvoice=null;activeProduct=null;activePurchase=null;workspace.hidden=true;invoicePage.hidden=true;productPage.hidden=false;detailBack.setAttribute('aria-label','Zaxiralangan mahsulotlarga qaytish');document.getElementById('detail-page-label').textContent='Zaxira tafsiloti';
  const summary=document.createElement('section');summary.className='detail-summary';summary.innerHTML=`<div class="detail-kicker"><span>${dateLabel(p.date)} · ${p.time}</span><span class="currency">${p.currency}</span></div><h1 id="product-title" tabindex="-1">${p.name}</h1><p class="choice-note">${p.ids.join(' · ')} · ${p.type}</p><dl class="detail-totals"><div><dt>Zaxiralangan</dt><dd>${format(p.quantity)} <span class="unit">${p.unit}</span></dd></div><div><dt>Umumiy to‘lov · ${p.currency}</dt><dd>${format(p.total)}</dd></div></dl>`;
  const info=document.createElement('section');info.className='detail-information';info.innerHTML='<h2>Zaxira ma’lumotlari</h2><dl class="detail-fields"></dl>';info.querySelector('dl').append(...reservedColumnDefs.filter(([key])=>key!=='rowNumber').map(([key,label,value])=>{const v=value(p);return field(label,typeof v==='number'?key==='quantity'?`${format(v)} ${p.unit}`:money(v,p.currency):v);}));
  const note=document.createElement('p');note.className='stage-note';note.textContent='Sinov zaxira yozuvi. Tafovut = umumiy to‘lov − to‘langan. Jonli omborga bog‘lanmagan.';detailContent.classList.add('is-purchase-detail');detailContent.replaceChildren(summary,info,note);document.title=`${p.name} · Zaxira · Rizo Store`;window.scrollTo(0,0);summary.querySelector('h1').focus({preventScroll:true});
}
const reservedFilterSheet=document.getElementById('reserved-filter-sheet'),reservedFilterBody=document.getElementById('reserved-filter-body'),reservedFilterChoices=document.getElementById('reserved-filter-choices'),reservedOptionSearch=document.getElementById('reserved-option-search');let reservedFilterOverflow='';
function openReservedFilter(){reservedDraft={...reservedFilters};showReservedFilterFields();reservedFilterOverflow=document.body.style.overflow;document.body.style.overflow='hidden';reservedFilterSheet.showModal();filterTrigger.setAttribute('aria-expanded','true');}
function showReservedFilterFields(focusKey){reservedChoosing=null;document.getElementById('reserved-filter-title').textContent='Zaxira filtri';document.getElementById('reserved-filter-back').hidden=true;reservedFilterBody.hidden=false;reservedFilterChoices.hidden=true;document.getElementById('reserved-filter-footer').hidden=false;document.getElementById('reserved-filter-error').textContent='';reservedFilterBody.replaceChildren();['branch','supplier','warehouse','unit','cashier','currency','type'].forEach(key=>{const button=document.createElement('button');button.type='button';button.className='filter-field';button.dataset.reservedField=key;button.innerHTML=`<span class="filter-label">${reservedFilterLabels[key]}</span><strong>${reservedDraft[key]||'Barchasi'}</strong><span class="field-arrow" aria-hidden="true">${icon('chevronRight')}</span>`;button.addEventListener('click',()=>showReservedChoices(key));reservedFilterBody.append(button);});
  const dates=document.createElement('div');dates.className='history-date-fields reserved-date-fields';['from','to'].forEach(key=>{const label=document.createElement('label');const title=document.createElement('span');title.textContent=reservedFilterLabels[key];const input=document.createElement('input');input.id=`reserved-date-${key}`;input.type='datetime-local';input.value=reservedDraft[key];input.addEventListener('input',()=>{reservedDraft[key]=input.value;document.getElementById('reserved-filter-error').textContent='';});label.append(title,input);dates.append(label);});reservedFilterBody.append(dates);const label=document.createElement('label');label.className='filter-option stock-toggle';const input=document.createElement('input');input.type='checkbox';input.checked=reservedDraft.group;input.addEventListener('change',()=>reservedDraft.group=input.checked);const text=document.createElement('span');text.textContent='Bir xil zaxira yozuvlarini guruhlash';label.append(input,text);reservedFilterBody.append(label);if(focusKey)reservedFilterBody.querySelector(`[data-reserved-field="${focusKey}"]`)?.focus({preventScroll:true});if(reservedFilterSheet.open)enterContent(reservedFilterBody,-1,12);
}
function renderReservedChoices(){const key=reservedChoosing,query=reservedOptionSearch.value.trim().toLocaleLowerCase('uz');const values=['',...new Set(reservations.map(p=>p[key]))].filter(value=>(value||'Barchasi').toLocaleLowerCase('uz').includes(query));const list=document.getElementById('reserved-option-list');list.replaceChildren();values.forEach(value=>{const label=document.createElement('label');label.className='filter-option';const input=document.createElement('input');input.type='radio';input.name='reserved-choice';input.value=value;input.checked=reservedDraft[key]===value;input.addEventListener('click',()=>{reservedDraft[key]=value;showReservedFilterFields(key);});const text=document.createElement('span');text.textContent=value||'Barchasi';label.append(input,text);list.append(label);});document.getElementById('reserved-no-options').hidden=!!values.length;}
function showReservedChoices(key){reservedChoosing=key;document.getElementById('reserved-filter-title').textContent=reservedFilterLabels[key];document.getElementById('reserved-filter-back').hidden=false;reservedFilterBody.hidden=true;reservedFilterChoices.hidden=false;document.getElementById('reserved-filter-footer').hidden=true;reservedOptionSearch.value='';reservedOptionSearch.closest('label').hidden=!['supplier','warehouse','branch','cashier','unit'].includes(key);renderReservedChoices();document.querySelector('#reserved-option-list input:checked')?.focus({preventScroll:true});enterContent(reservedFilterChoices,1,12);}
reservedOptionSearch.addEventListener('input',renderReservedChoices);document.getElementById('reserved-filter-back').addEventListener('click',()=>showReservedFilterFields(reservedChoosing));document.getElementById('reserved-filter-close').addEventListener('click',()=>reservedFilterSheet.close());document.getElementById('reserved-filter-reset').addEventListener('click',()=>{reservedDraft=emptyReservedFilters();showReservedFilterFields();});document.getElementById('reserved-filter-form').addEventListener('submit',event=>{event.preventDefault();if(reservedChoosing)return;if(reservedDraft.from&&reservedDraft.to&&reservedDraft.from>reservedDraft.to){document.getElementById('reserved-filter-error').textContent='Boshlanish sanasi tugash sanasidan keyin bo‘lmasin.';document.getElementById('reserved-date-to').focus();return;}reservedFilters={...reservedDraft};resetStockPage();reservedFilterSheet.close();});reservedFilterSheet.addEventListener('close',()=>{document.body.style.overflow=reservedFilterOverflow;filterTrigger.setAttribute('aria-expanded','false');if(filterTrigger.getClientRects().length)filterTrigger.focus({preventScroll:true});});reservedFilterSheet.addEventListener('cancel',event=>{if(reservedChoosing){event.preventDefault();showReservedFilterFields(reservedChoosing);}});reservedFilterSheet.addEventListener('click',event=>{if(event.target!==reservedFilterSheet)return;const r=reservedFilterSheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)reservedFilterSheet.close();});

// Label quantities and prices are isolated fixtures; no inventory records are changed.
let activeLabels=null;
const labelDrafts=new Map();
const labelChoiceSheet=document.getElementById('label-choice-sheet');
let labelChoiceOverflow='';
const labelKinds=[['ean','EAN-13'],['code128','CODE128'],['code39','CODE39'],['logo','Logotipli'],['promo','Aksiyali'],['wholesale','Ulgurji'],['payment','Naqd va o‘tkazma']];
const labelTemplates=[...labelKinds.map(([kind,name])=>({id:kind,kind,name,width:58,height:40})),...labelKinds.map(([kind,name])=>({id:kind+'-2',kind,name:name+' · 2-variant',width:58,height:40,alternate:true})),{id:'basic',kind:'basic',name:'Asosiy',width:58,height:40},{id:'promo-3',kind:'promo',name:'Aksiyali · 3-variant',width:58,height:40,alternate:true},{id:'a4',kind:'basic',name:'A4',width:190,height:277},{id:'a4-landscape',kind:'basic',name:'A4 · albom',width:277,height:190}];
const labelRate=12000;
function sampleEAN(index){const base=`200000000${String(index+1).padStart(3,'0')}`;return base+((10-[...base].reduce((sum,n,i)=>sum+Number(n)*(i%2?3:1),0)%10)%10);}
function labelDraft(invoice){
  if(!labelDrafts.has(invoice.id)){
    labelDrafts.set(invoice.id,{template:'ean',currency:'native',query:'',selected:0,rows:invoiceItems(invoice.id).map(row=>({...row}))});
  }
  return labelDrafts.get(invoice.id);
}
function currentLabelDraft(){return labelDrafts.get(activeLabels);}
function labelMatches(row,query){return `${row.name} ${row.ean} ${row.barcode}`.toLocaleLowerCase('uz').includes(query.trim().toLocaleLowerCase('uz'));}
function labelPrice(row,draft,multiplier=1){const currency=draft.currency==='native'?row.currency:draft.currency;const value=row.sale*multiplier*(currency===row.currency?1:currency==='UZS'?labelRate:1/labelRate);return {currency,value:Math.round(value*100)/100};}
function labelValidation(draft){if(draft.rows.some(r=>!Number.isSafeInteger(r.quantity)||r.quantity<0))return 'Miqdor 0 yoki undan katta butun son bo‘lsin.';if(draft.rows.reduce((s,r)=>s+r.quantity,0)>1000)return 'Bir martada 1 000 tagacha sinov yorlig‘i tayyorlash mumkin.';return '';}
function labelMarkup(row,draft){
  const template=labelTemplates.find(t=>t.id===draft.template),price=labelPrice(row,draft),promo=labelPrice(row,draft,.9),wholesale=labelPrice(row,draft,row.sale?row.wholesale/row.sale:0),transfer=labelPrice(row,draft,1.02);
  const amount=p=>`<b>${format(p.value)}</b><small>${p.currency}</small>`;
  const special=template.kind==='promo'?`<span class="label-promo">AKSIYA</span><s>${format(price.value)} ${price.currency}</s><div class="label-price">${amount(promo)}</div>`:template.kind==='wholesale'||template.kind==='payment'?`<div class="label-dual"><div><small>${template.kind==='wholesale'?'Chakana':'Naqd'}</small>${amount(price)}</div><div><small>${template.kind==='wholesale'?'Ulgurji':'O‘tkazma'}</small>${amount(template.kind==='wholesale'?wholesale:transfer)}</div></div>`:`<div class="label-price">${amount(price)}</div>`;
  return `<article class="price-label ${template.alternate?'label-alternate':''} ${template.id.startsWith('a4')?'label-a4':''}" style="--label-width:${template.width}mm;--label-height:${template.height}mm;--label-ratio:${template.width}/${template.height}"><small class="label-shop">${template.kind==='logo'?'<strong class="label-logo">RiZO STORE</strong>':'NAMUNA FILIAL'}</small><strong class="label-product-name ${row.name.length>70?'label-long-name':''}">${row.name}</strong>${special}<small class="label-unit">1 ${row.unit}</small><svg class="label-barcode" data-code="${row.ean}" data-format="${template.kind==='code128'?'CODE128':template.kind==='code39'?'CODE39':'EAN13'}" role="img" aria-label="${row.ean} shtrix-kodi"></svg></article>`;
}
function drawLabelBarcodes(root){root.querySelectorAll('.label-barcode').forEach(svg=>JsBarcode(svg,svg.dataset.code,{format:svg.dataset.format,width:2,height:32,fontSize:14,margin:8,background:'#ffffff',lineColor:'#000000'}));}
function showLabels(invoice){
  if(activeLabels===invoice.id)return;
  rememberView();activeInvoiceLine=null;activeLabels=invoice.id;activeInvoice=invoice.id;activeProduct=null;activePurchase=null;activeReservation=null;
  const draft=labelDraft(invoice);
  workspace.hidden=true;invoicePage.hidden=true;productPage.hidden=false;
  detailBack.setAttribute('aria-label','Yorliqlardan qaytish');document.getElementById('detail-page-label').textContent='Narx yorliqlari';
  detailContent.classList.add('is-purchase-detail');
  detailContent.innerHTML=`<section class="detail-summary"><h1 id="product-title" tabindex="-1">Narx yorliqlari</h1><p class="invoice-supplier">${invoice.id}</p></section><div class="label-layout"><section class="detail-information label-settings"><h2>Yorliq sozlamalari</h2><button class="filter-field" data-label-choice="template"><span class="filter-label">Shablon</span><strong id="label-template-name"></strong><span class="field-arrow">${icon('chevronRight')}</span></button><button class="filter-field" data-label-choice="currency"><span class="filter-label">Valyuta</span><strong id="label-currency-name"></strong><span class="field-arrow">${icon('chevronRight')}</span></button><p id="label-rate-note" class="choice-note"></p><h2>Oldindan ko‘rish</h2><div id="label-preview" class="label-preview" aria-live="polite"></div><p class="choice-note">Sinov yorlig‘i. Shablon maketi prototip uchun qayta yaratilgan.</p></section><section class="detail-information label-products"><h2>Mahsulotlar</h2><label class="search"><span>${icon('search')}</span><input id="label-search" type="search" placeholder="Qidirish" aria-label="Yorliq mahsulotlarini qidirish" autocomplete="off"></label><form id="label-bulk-form" class="label-bulk"><label>Miqdori<input id="label-bulk-quantity" type="number" inputmode="numeric" min="0" step="1" value="1" required></label><button class="outline-button" type="submit">Barchasiga qo‘llash</button></form><p class="choice-note">Qidiruv faqat ro‘yxatni toraytiradi. Miqdor va chop etish barcha mahsulotlarga tegishli; 0 — chiqarilmaydi.</p><div id="label-product-list"></div><p id="label-empty" class="empty" hidden>Mahsulot topilmadi. <button class="text-button" data-label-clear>Tozalash</button></p></section></div><footer class="label-footer"><div><strong id="label-total" role="status"></strong><p class="choice-note">Chop etishda 100% yoki Haqiqiy o‘lchamni tanlang.</p></div><button class="primary-button" id="label-print">${icon('print')}Chop etish</button><p id="label-error" class="history-filter-error" role="alert"></p></footer>`;
  const searchInput=document.getElementById('label-search');searchInput.value=draft.query;searchInput.addEventListener('input',()=>{draft.query=searchInput.value;renderLabelProducts();});
  document.getElementById('label-bulk-form').addEventListener('submit',event=>{event.preventDefault();const value=document.getElementById('label-bulk-quantity').valueAsNumber;if(!Number.isSafeInteger(value)||value<0)return;draft.rows.forEach(row=>row.quantity=value);renderLabelProducts();updateLabelPreview();});
  document.getElementById('label-print').addEventListener('click',printLabels);
  renderLabelProducts();updateLabelPreview();window.scrollTo(0,0);document.getElementById('product-title').focus({preventScroll:true});document.title=`Narx yorliqlari · ${invoice.id} · Rizo Store`;
}
function renderLabelProducts(){
  const draft=currentLabelDraft(),list=document.getElementById('label-product-list');
  list.innerHTML=`<div class="label-row label-table-head" aria-hidden="true"><span>Mahsulot / shtrix-kod</span><span>Valyuta / birlik</span><span>Sotish narxi</span><span>Miqdori</span></div>`+draft.rows.map((row,index)=>({row,index})).filter(({row})=>labelMatches(row,draft.query)).map(({row,index})=>`<article class="label-row"><div><button class="text-button label-product-select" data-label-preview="${index}" aria-pressed="${draft.selected===index}">${row.name}</button><small>${row.ean}</small></div><span class="label-row-meta">${row.currency} · ${row.unit}</span><strong class="label-row-price">${format(row.sale)} <small>${row.currency}</small></strong><label class="label-quantity"><span>Miqdori</span><input type="number" inputmode="numeric" min="0" step="1" value="${Number.isFinite(row.quantity)?row.quantity:''}" data-label-quantity="${index}" aria-label="${row.name}: yorliq soni"></label></article>`).join('');
  document.getElementById('label-empty').hidden=draft.rows.some(row=>labelMatches(row,draft.query));
}
function updateLabelPreview(){
  const draft=currentLabelDraft(),template=labelTemplates.find(t=>t.id===draft.template),error=labelValidation(draft),total=draft.rows.reduce((sum,row)=>sum+(Number.isInteger(row.quantity)&&row.quantity>=0?row.quantity:0),0);
  document.getElementById('label-template-name').textContent=template.name;document.getElementById('label-currency-name').textContent=draft.currency==='native'?'Tovar valyutasi':draft.currency;
  document.getElementById('label-rate-note').textContent=draft.currency!=='native'&&draft.rows.some(r=>r.currency!==draft.currency)?'Sinov kursi: 1 USD = 12 000 UZS.':'Narxlar sinov ma’lumotlaridan olingan.';
  document.getElementById('label-preview').innerHTML=draft.rows.length?labelMarkup(draft.rows[draft.selected],draft):'<p class="choice-note">Fakturada mahsulot yo‘q.</p>';drawLabelBarcodes(document.getElementById('label-preview'));
  document.getElementById('label-total').textContent=`Jami: ${format(total)} ta yorliq`;
  document.getElementById('label-error').textContent=error;document.getElementById('label-print').disabled=!!error||total===0;
  document.querySelectorAll('[data-label-preview]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.labelPreview)===draft.selected)));
}
function printLabels(){
  const draft=currentLabelDraft();if(labelValidation(draft)||!draft.rows.some(row=>row.quantity>0))return;
  const template=labelTemplates.find(t=>t.id===draft.template),a4=template.id.startsWith('a4');
  document.getElementById('print-area').innerHTML=`<div class="label-print-output">${draft.rows.flatMap(row=>Array.from({length:row.quantity},()=>labelMarkup(row,draft))).join('')}</div>`;
  drawLabelBarcodes(document.getElementById('print-area'));
  document.getElementById('label-print-page').textContent=`@media print{@page{size:${a4?(template.id==='a4'?'A4 portrait':'A4 landscape'):`${template.width}mm ${template.height}mm`};margin:${a4?'10mm':'0'}}}`;
  const pageStyle=document.getElementById('label-print-page').textContent;
  document.getElementById('stock-print-content').innerHTML=`<div class="label-preview-grid">${document.getElementById('print-area').innerHTML}</div>`;
  openStockDialog(stockPrintPreview);document.getElementById('label-print-page').textContent=pageStyle;
  document.querySelector('#stock-print-preview>.choice-note').textContent=`${draft.rows.reduce((sum,row)=>sum+row.quantity,0)} ta sinov yorlig‘i · ${template.name} · ${a4?'A4':template.width+' × '+template.height+' mm'}. 100% yoki Haqiqiy o‘lchamni tanlang.`;
}
stockPrintPreview.addEventListener('close',()=>document.getElementById('label-print-page').textContent='');

document.addEventListener('input',event=>{if(event.target.matches('[data-label-quantity]')){currentLabelDraft().rows[Number(event.target.dataset.labelQuantity)].quantity=event.target.valueAsNumber;event.target.setAttribute('aria-invalid',String(!event.target.validity.valid));updateLabelPreview();}});
document.addEventListener('click',event=>{
  const choice=event.target.closest('[data-label-choice]');if(choice){openLabelChoice(choice.dataset.labelChoice);return;}
  const preview=event.target.closest('[data-label-preview]');if(preview){currentLabelDraft().selected=Number(preview.dataset.labelPreview);updateLabelPreview();document.getElementById('label-preview').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});return;}
  if(event.target.closest('[data-label-clear]')){currentLabelDraft().query='';document.getElementById('label-search').value='';renderLabelProducts();document.getElementById('label-search').focus();}
});
function openLabelChoice(key){
  const draft=currentLabelDraft();document.getElementById('label-choice-title').textContent=key==='template'?'Yorliq shabloni':'Yorliq valyutasi';
  const options=key==='template'?labelTemplates.map(t=>[t.id,t.name]):[['native','Tovar valyutasi'],['UZS','UZS'],['USD','USD']];
  const list=document.getElementById('label-choice-options');list.replaceChildren();options.forEach(([value,name])=>{const button=document.createElement('button');button.className='report-choice';button.textContent=name;button.setAttribute('aria-pressed',String(draft[key]===value));if(draft[key]===value)button.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>');button.addEventListener('click',()=>{draft[key]=value;updateLabelPreview();labelChoiceSheet.close();});list.append(button);});
  labelChoiceOverflow=document.body.style.overflow;document.body.style.overflow='hidden';labelChoiceSheet.showModal();
}
document.getElementById('label-choice-close').addEventListener('click',()=>labelChoiceSheet.close());
labelChoiceSheet.addEventListener('close',()=>document.body.style.overflow=labelChoiceOverflow);
labelChoiceSheet.addEventListener('click',event=>{if(event.target!==labelChoiceSheet)return;const r=labelChoiceSheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)labelChoiceSheet.close();});

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
