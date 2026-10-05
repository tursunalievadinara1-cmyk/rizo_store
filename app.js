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
const paths={menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',filter:'<path d="M3 5h18l-7 8v7l-4-2v-5Z"/>',export:'<path d="M12 16V3m-4 4 4-4 4 4M4 14v7h16v-7"/>',print:'<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6Z"/>',house:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',box:'<path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5"/>',chart:'<path d="M4 3v18h17M8 16v-5M13 16V7M18 16V4"/>',cart:'<path d="M2 3h3l3 13h11l3-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3"/>',document:'<path d="M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h8"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.document}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)});
const navigation=[['Bosh sahifa','house'],['Analitika','chart'],['Internet do‘kon','cart'],['Sotib olish','cart'],['Tovarlar va omborlar','box'],['Kontragentlar','people'],['Buyurtmalar','document'],['Qaytarish','document'],['Harakatlar','document'],['Xarajatlar','document'],['Keshbek','document'],['Kataloglar','document'],['Hisobotlar','chart'],['Sozlamalar','grid']];
document.querySelectorAll('.nav-items').forEach(container=>{
  navigation.forEach(([label,glyph])=>{
    const button=document.createElement('button');button.className='nav-item';
    button.innerHTML=`<span data-icon="${glyph}">${icon(glyph)}</span><span>${label}</span>`;
    if(label==='Hisobotlar'){button.setAttribute('aria-current','page');button.addEventListener('click',closeDrawers)}
    else{button.disabled=true;button.title='Bu bosqichda ulanmagan'}
    container.append(button);
  });
});
const number=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2});
const format=value=>number.format(value).replace(/[\u202f\u00a0]/g,' ');
const statusLabels={low:'Kam qolgan',zero:'Tugagan',ok:'Yetarli'};
const status=product=>`<span class="status ${product.status}">${statusLabels[product.status]}</span>`;
const search=document.getElementById('search');
function render(){
  const query=search.value.trim().toLocaleLowerCase('uz');
  const rows=products.filter(p=>`${p.name} ${p.barcode}`.toLocaleLowerCase('uz').includes(query));
  document.getElementById('result-count').textContent=`${rows.length} ta mahsulot`;
  document.getElementById('table-body').innerHTML=rows.map((p,i)=>`<tr><td>${i+1}</td><td>${p.name}</td><td>${p.barcode}</td><td>${p.category}</td><td class="numeric">${format(p.quantity)}</td><td>${p.unit}</td><td>${p.currency}</td><td class="numeric">${format(p.price)}</td><td class="numeric">${format(p.quantity*p.price)}</td><td>${p.branch}</td><td>${status(p)}</td></tr>`).join('');
  document.getElementById('cards').innerHTML=rows.map(p=>`<article class="stock-card"><div class="card-head"><h2>${p.name}</h2><span class="currency">${p.currency}</span></div><dl class="card-values"><div><dt>Qoldiq</dt><dd>${format(p.quantity)} <span class="unit">${p.unit}</span></dd></div><div><dt>Kirish qiymati</dt><dd>${format(p.quantity*p.price)}</dd></div></dl>${p.status!=='ok'?status(p):''}</article>`).join('');
  document.getElementById('empty').hidden=rows.length>0;
  document.querySelector('.table-wrap').hidden=!rows.length;
  document.getElementById('cards').hidden=!rows.length;
}
search.addEventListener('input',render);
document.getElementById('clear-search').addEventListener('click',()=>{search.value='';render();search.focus()});
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
document.querySelector('[data-remainder]').addEventListener('click',closeDrawers);
render();
