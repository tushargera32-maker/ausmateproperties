(function(){
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
if(params.get('area'))$('f-area').value=params.get('area');
if(params.get('q'))$('f-q').value=params.get('q');
const money=n=>'$'+Number(n).toLocaleString('en-AU');
const grad=h=>{let s=0;for(const c of h)s=(s*31+c.charCodeAt(0))%997;const g=[['#d7e5f6','#f2eee2'],['#ddebf3','#eef0e4'],['#dfe9ef','#f5efe0'],['#e0e6f4','#f3eee1'],['#d9e6f2','#f4ecdf']];return `linear-gradient(135deg,${g[s%g.length][0]},${g[s%g.length][1]})`;};
function current(){
return{state:$('f-state').value,type:$('f-type').value,area:$('f-area').value,beds:$('f-beds').value,price:$('f-price').value,sort:$('f-sort').value,q:$('f-q').value.trim().toLowerCase()};
}
function pass(p,f){
if(f.state==='Victoria'&&p.state!=='VIC')return false;
if(f.state==='New South Wales')return false;
if(f.type==='land')return false;
if(f.type==='coliving')return false;
if(f.area&&p.area!==f.area)return false;
if(f.beds&&!(p.beds>=+f.beds))return false;
if(f.price&&!(p.price<=+f.price))return false;
if(f.q){const hay=(p.estate+' '+p.suburb+' '+p.design+' '+p.lot+' '+p.area+' '+p.status).toLowerCase();if(!hay.includes(f.q))return false;}
return true;
}
function badge(p){
if(/titled now/i.test(p.status))return '<span class="pk-status titled">Titled now</span>';
if(/available/i.test(p.status))return '<span class="pk-status titled">Available</span>';
return `<span class="pk-status expected">${p.status}</span>`;
}
let n=0;
function card(p){
n++;
const feats=(p.features||[]).slice(0,2).map(x=>`<span class="pill">${x}</span>`).join('');
const storeyShort=p.storeys?p.storeys.replace(' storey',''):'';
const specLine=p.beds+' BED'+(p.baths?' · '+p.baths+' BATH':'')+' · '+p.land+'m² LAND'+(p.home?' · '+p.home+'m² HOME':'')+(storeyShort?' · '+storeyShort:'');
 return `<article class="pk rv" data-href="package.html?id=${p.id}" data-area="${p.area}">
<a class="pk-media" href="package.html?id=${p.id}" aria-label="${p.design} Lot ${p.lot}, ${p.estate} — view package"><div class="pk-art" style="--ph:${grad(p.estate+p.id)}" aria-hidden="true"></div><span class="pk-mono" aria-hidden="true">${p.design.charAt(0).toUpperCase()}</span>${badge(p)}<span class="pk-beds">${p.beds} BED${storeyShort?' · '+storeyShort.toUpperCase():''}</span>
<div class="pk-media-btm"><small>${p.estate} · Lot ${p.lot}</small><b>${p.design}${p.facade?' · '+p.facade:''}</b></div></a>
<div class="pk-body">
<p class="pk-loc">${p.suburb} · ${p.area} · <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.estate+' '+p.suburb+' VIC')}">Map</a></p>
<p class="pk-spec">${specLine}</p>
<p class="pk-price"><span class="pk-price-num">${money(p.price)}</span> <span class="pk-price-type">${p.priceType}</span></p>
${feats?`<p class="pk-feats">${feats}</p>`:''}
<div class="pk-actions"><a class="btn small dark" href="package.html?id=${p.id}">View package</a><a class="btn small secondary" href="contact.html?package=${encodeURIComponent(p.design+' Lot '+p.lot+', '+p.estate)}">Enquire</a></div>
</div></article>`;
}
function sortLabel(v){if(v==='lo')return 'Price: low to high';if(v==='hi')return 'Price: high to low';if(v==='land')return 'Land: biggest first';return 'Recommended';}
function chips(f){
const out=[];
if(f.state)out.push(['state',f.state]);
if(f.area)out.push(['area',f.area]);
if(f.beds)out.push(['beds',f.beds+'+ bed']);
if(f.price)out.push(['price','Under $'+(+f.price/1000)+'k']);
if(f.q)out.push(['q','“'+$('f-q').value.trim()+'”']);
if(f.sort&&f.sort!=='rec')out.push(['sort',sortLabel(f.sort)]);
if(!out.length)return '';
 return '<div class="chips">'+out.map(c=>`<span class="chip">${c[1]}<button type="button" data-k="${c[0]}" aria-label="Remove ${c[1]} filter">×</button></span>`).join('')+'<button type="button" class="chip chip-clear" data-k="all" aria-label="Clear all filters">Clear all ×</button></div>';
}
function activeFilterCount(f){let c=0;if(f.state)c++;if(f.area)c++;if(f.beds)c++;if(f.price)c++;if(f.q)c++;if(f.sort&&f.sort!=='rec')c++;return c;}
function render(){
n=0;
const f=current();let all=(window.PACKAGES||[]).filter(p=>pass(p,f));
if(f.sort==='lo')all=[...all].sort((a,b)=>a.price-b.price);
if(f.sort==='hi')all=[...all].sort((a,b)=>b.price-a.price);
if(f.sort==='land')all=[...all].sort((a,b)=>b.land-a.land);
const order=['Geelong','Melbourne West','Melbourne North','Melbourne South-East','Regional Victoria','Bendigo'];
const total=(window.PACKAGES||[]).length;
let html='';
if(f.type!=='house'){
$('count').innerHTML=f.type==='land'?'Land-only lots: coming soon — send an enquiry for current titled lots.':'Co-living: ask for the investor pack — dual-key options sit under House & land for now.';
$('list').innerHTML='<div class="card card-body empty-state"><h3>'+(f.type==='land'?'No land-only lots listed yet':'No separate co-living list yet')+'</h3><p class="sub">Call 0430 200 150 · info@ausmateproperties.com.au</p><p class="empty-cta"><a class="btn secondary" href="contact.html">Send an enquiry</a></p></div>';
$('chips').innerHTML='';return;
}
const nf=activeFilterCount(f);
if(!all.length){
$('count').innerHTML=`<b>0</b> of <b>${total}</b> packages${nf?` · ${nf} filter${nf>1?'s':''} active`:''} · Victoria`;
}else if(nf){
$('count').innerHTML=`<b>${all.length}</b> of <b>${total}</b> packages · ${nf} filter${nf>1?'s':''} active · Victoria · Updated 25 Sep 2026`;
}else{
$('count').innerHTML=`<b>${all.length}</b> packages · Victoria · Updated 25 Sep 2026`;
}
order.forEach(a=>{const items=all.filter(p=>p.area===a);if(!items.length)return;html+=`<div class="area-head"><p class="ah-kicker">Corridor · Victoria</p><div class="area-head-row"><h2>${a}</h2><span class="ah-count">${items.length} packages</span></div></div><div class="grid">${items.map(card).join('')}</div>`;});
if(!all.length)html='<div class="card card-body empty-state"><h3>No packages match those filters</h3><p class="sub">Try widening the price or bedroom filters, or clear the search. Availability changes quickly — call 0430 200 150.</p><p class="empty-cta"><button type="button" class="btn secondary" data-action="reset">Reset filters</button><a class="btn" href="contact.html">Ask for current availability</a></p></div>';
$('list').innerHTML=html;
$('chips').innerHTML=chips(f);
$('chips').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
const k=b.dataset.k;
if(k==='state')$('f-state').value='';if(k==='area')$('f-area').value='';if(k==='beds')$('f-beds').value='';if(k==='price')$('f-price').value='';if(k==='q')$('f-q').value='';if(k==='sort')$('f-sort').value='rec';
if(k==='all'){['f-state','f-area','f-beds','f-price','f-q'].forEach(id=>$(id).value='');$('f-type').value='house';$('f-sort').value='rec';}
render();
const first=$('f-state');if(first&&k==='all')first.focus();
}));
const resetBtn=document.querySelector('[data-action="reset"]');
if(resetBtn)resetBtn.addEventListener('click',()=>{['f-state','f-area','f-beds','f-price','f-q'].forEach(id=>$(id).value='');$('f-type').value='house';$('f-sort').value='rec';render();$('f-q').focus();});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.05});
document.querySelectorAll('.pk.rv').forEach(el=>io.observe(el));
}
['f-state','f-type','f-area','f-beds','f-price','f-sort'].forEach(id=>$(id).addEventListener('change',render));
let qt;$('f-q').addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(render,220);});
$('f-clear').addEventListener('click',()=>{['f-state','f-area','f-beds','f-price','f-q'].forEach(id=>$(id).value='');$('f-type').value='house';$('f-sort').value='rec';render();});
const listEl=$('list');
if(listEl)listEl.addEventListener('click',e=>{
if(e.target.closest('a,button,select,input'))return;
const art=e.target.closest('article[data-href]');
if(art&&art.dataset.href)location.href=art.dataset.href;
});
(function initInclusions(){
const dg=document.getElementById('incl');if(!dg||dg.dataset.a11y)return;dg.dataset.a11y='1';
const openBtn=document.getElementById('incl-open');const closeBtn=document.getElementById('incl-close');
let lastFocus=null;
function open(){lastFocus=document.activeElement;if(!dg.open)dg.showModal();if(closeBtn)closeBtn.focus();}
function close(){if(dg.open)dg.close();}
if(openBtn)openBtn.addEventListener('click',open);
if(closeBtn)closeBtn.addEventListener('click',close);
dg.addEventListener('click',e=>{if(e.target===dg)close();});
dg.addEventListener('close',()=>{if(lastFocus&&document.contains(lastFocus))lastFocus.focus();});
})();
render();
})();
