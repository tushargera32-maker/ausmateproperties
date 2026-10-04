(function(){
"use strict";
const $=id=>document.getElementById(id);
const fmt=n=>{const v=Math.round(n);return (v<0?"−$":"$")+Math.abs(v).toLocaleString("en-AU");};
const raw=id=>{const el=$(id);return el?String(el.value==null?"":el.value):"0";};
const num=id=>{const s=raw(id).replace(/[$,\s_%]/g,"").replace(/[^0-9.\-]/g,"");if(s===""||s==="-"||s==="."||s==="-." )return 0;const v=parseFloat(s);return isFinite(v)?v:0;};
const money0=v=>"$"+Math.round(Math.max(0,v)).toLocaleString("en-AU");
function setErr(id,msg){const el=$(id);if(el)el.textContent=msg||"";}
function tick(id){const el=$(id);if(!el||!el.classList)return;el.classList.add("tick");window.requestAnimationFrame?window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>el.classList.remove("tick"))):setTimeout(()=>el.classList.remove("tick"),30);}
/* thousand-separator friendliness: format on blur, never fight typing */
function commas(id){const el=$(id);if(!el)return;
  el.addEventListener("blur",()=>{const v=num(id);if(raw(id).trim()===""){return;}const dec=id==="m-rate"||id==="i-rate"||id==="i-mgmt";el.value=dec?(Math.round(v*100)/100).toLocaleString("en-AU",{maximumFractionDigits:2}):Math.round(v).toLocaleString("en-AU");});
  el.addEventListener("focus",()=>{/* keep value; select for easy retype */try{el.select();}catch(e){}});
}
["m-amt","m-rate","m-term","m-io","i-prop","i-build","i-loan","i-rate","i-rent","i-vac","i-mgmt","i-other","i-dep","i-inc","s-price"].forEach(commas);
/* ---------- tabs (hash deep-linking preserved) ---------- */
const panels={mortgage:"panel-m",investment:"panel-i",stampduty:"panel-s"};
function show(name){
if(!panels[name])name="mortgage";
document.querySelectorAll(".tabs a").forEach(a=>{const on=a.dataset.tab===name;a.classList.toggle("on",on);if(on)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current");});
Object.entries(panels).forEach(([k,id])=>$(id).classList.toggle("on",k===name));
if(("#"+name)!==location.hash)history.replaceState(null,"","#"+name);
}
document.querySelectorAll(".tabs a").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();show(a.dataset.tab);}));
window.addEventListener("hashchange",()=>show((location.hash||"").replace("#","")));
/* ---------- segmented ---------- */
function seg(id,cb){
const el=$(id);if(!el)return;
el.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
el.querySelectorAll("button").forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});b.classList.add("on");b.setAttribute("aria-pressed","true");cb();
}));}
const segVal=id=>{const el=$(id);const b=el?el.querySelector("button.on"):null;return b?b.dataset.v:"";};
/* ---------- mortgage ---------- */
function mCalc(){
const errs=[];
let P=Math.max(0,num("m-amt"));if(!(P>0))errs.push("Enter a loan amount over $0.");
let aprRaw=num("m-rate");if(aprRaw<0){aprRaw=0;}const apr=Math.max(0,aprRaw)/100;if(aprRaw===0)errs.push("0% rate — principal only, no interest.");
let term=num("m-term");if(!(term>=1)){errs.push("Loan term needs 1–40 years (using 30).");term=30;$("m-term").value=30;}term=Math.min(40,Math.max(1,term));
const type=segVal("m-type")||"pi",fq=segVal("m-freq")||"m";
const ppy=fq==="m"?12:fq==="f"?26:52;
const perName=fq==="m"?"per month":fq==="f"?"per fortnight":"per week";
const N=Math.round(term*ppy);
let ioY=Math.max(0,num("m-io"));
if(ioY>=term){const cap=(N-1)/ppy;ioY=Math.max(0,Math.floor(cap*100)/100);$("m-io").value=ioY;errs.push("Interest-only must be under the loan term — capped to "+ioY+" yrs.");}
const IO=Math.min(Math.round(ioY*ppy),N-1);
const ioPay=P*apr/ppy;
let pmt,totInt,note="";
if(type==="io"){
pmt=ioPay;totInt=pmt*N;note=apr===0?"Interest-only at 0% — no repayments due, the "+money0(P)+" principal is still owed at the end.":"Interest-only for the full term — the "+money0(P)+" principal is still owed at the end.";
$("m-trep-row").style.display="";
$("m-trep").textContent=fmt(totInt+P);
}else{
const n2=N-IO,r=apr/ppy;
pmt=r>0?P*r/(1-Math.pow(1+r,-n2)):(n2>0?P/n2:0);
let bal=P,pi=0;for(let i=0;i<n2;i++){const intr=bal*r;bal-=pmt-intr;pi+=intr;}
totInt=ioPay*IO+pi;
$("m-trep-row").style.display="";
$("m-trep").textContent=fmt(ioPay*IO+pmt*n2);
note=apr===0?"0% rate — principal only, no interest.":IO>0?("Includes "+ioY+" yr interest-only ("+fmt(ioPay)+" "+perName.replace("per ","/")+") then P&I."):"Principal & interest for the full term.";
if(P===0)note="Enter a loan amount to see repayments.";
}
$("m-pay").textContent=fmt(pmt);tick("m-pay");
$("m-per").textContent=perName+(type==="io"?" · principal due at end":"");
$("m-tint").textContent=fmt(totInt);
$("m-note").textContent=note;
setErr("m-err",errs.join(" "));
$("m-cta").href="contact.html?message="+encodeURIComponent("Mortgage quote request\nLoan: "+money0(P)+"\nRate: "+(apr*100).toFixed(2)+"% p.a.\nTerm: "+term+" yrs, IO first "+ioY+" yrs\nType: "+(type==="io"?"Interest-only":"Principal & interest")+"\nFrequency: "+perName+"\nEstimate: "+fmt(pmt)+" "+perName);
}
seg("m-type",mCalc);seg("m-freq",mCalc);
["m-amt","m-rate","m-term","m-io"].forEach(id=>$(id).addEventListener("input",mCalc));
/* ---------- investment ---------- */
function marginal(income){
const B=window.DUTY.tax2027.brackets;let r=0;
for(const [cap,rate] of B){r=rate;if(cap===null||income<=cap)break;}
return r+window.DUTY.tax2027.medicare;
}
function taxPayable(income){
if(!(income>0))return 0;
const B=window.DUTY.tax2027.brackets;let t=0,prev=0;
for(const [cap,rate] of B){const up=cap===null?income:Math.min(income,cap);if(up>prev)t+=(up-prev)*rate;if(cap===null||income<=cap)break;prev=cap;}
return t+income*window.DUTY.tax2027.medicare;
}
function iCalc(){
const errs=[];
const rentW=Math.max(0,num("i-rent"));
let vac=num("i-vac");if(vac<0)vac=0;if(vac>52){vac=52;$("i-vac").value=52;errs.push("Vacancy capped at 52 weeks.");}
const loan=Math.max(0,num("i-loan")),rate=Math.max(0,num("i-rate"))/100;
const mgmt=Math.max(0,num("i-mgmt"))/100,other=Math.max(0,num("i-other"));
const dep=Math.max(0,num("i-dep")),inc=Math.max(0,num("i-inc"));
if(inc===0)errs.push("Income $0 — no tax is payable, so no negative-gearing benefit applies yet (losses carry forward).");
const gross=rentW*(52-vac),interest=loan*rate,mg=gross*mgmt;
const cash=gross-interest-mg-other,taxable=cash-dep,mr=marginal(inc);
const t0=taxPayable(inc),t1=taxPayable(Math.max(0,inc+taxable));
const refund=t0-t1,after=cash+refund,weekly=after/52;
$("i-week").textContent=(weekly<0?"−$":"$")+Math.abs(Math.round(weekly)).toLocaleString("en-AU");tick("i-week");
$("i-week").className="big "+(weekly<0?"neg":"pos");
$("i-sub").textContent=weekly<0?"estimated after-tax cost per week (out of pocket)":"estimated after-tax surplus per week";
const neg=v=>v<0;
const rows=[
["Gross rent (after "+vac+" weeks vacancy)",fmt(gross)+" / yr",false],
["Interest (at "+(rate*100).toFixed(2)+"%)","−$"+Math.round(interest).toLocaleString("en-AU")+" / yr",true],
["Property management ("+(mgmt*100).toFixed(1)+"%)","−$"+Math.round(mg).toLocaleString("en-AU")+" / yr",true],
["Rates, insurance, maintenance & other","−$"+Math.round(other).toLocaleString("en-AU")+" / yr",true],
["Cash result before tax",fmt(cash)+" / yr",neg(cash)],
["Depreciation (non-cash deduction)","−$"+Math.round(dep).toLocaleString("en-AU")+" / yr",true],
["Taxable result",fmt(taxable)+" / yr",neg(taxable)],
["Your estimated marginal rate + Medicare levy",(mr*100).toFixed(1)+"%",false],
[refund<0?"Estimated extra tax on profit":"Estimated tax refund",(refund<0?"−$":"$")+Math.abs(Math.round(refund)).toLocaleString("en-AU")+" / yr",refund<0],
["Estimated after-tax cash result",fmt(after)+" / yr",neg(after)]
];
$("i-rows").innerHTML=rows.map(r=>`<div class="r"><span>${r[0]}</span><span class="${r[2]?"neg":""}">${r[1]}</span></div>`).join("");
/* div-only breakdown bars: rent vs cost stack */
const bars=$("i-bars");
if(bars){const costs=[["Interest",interest,"#0f2a43"],["Management",mg,"#2563eb"],["Other",other,"#93c5fd"],["Depreciation (non-cash)",dep,"#cbd5e1"]];
const denom=Math.max(gross,interest+mg+other,1);
bars.innerHTML=`<div class="ibar-row"><span style="width:130px">Rent</span><div class="ibar-track"><div class="ibar-fill" style="width:${(gross/denom*100).toFixed(1)}%;background:#16a34a"></div></div><span>${fmt(gross)}</span></div>`+
costs.map(c=>`<div class="ibar-row"><span style="width:130px">${c[0]}</span><div class="ibar-track"><div class="ibar-fill" style="width:${(Math.max(0,c[1])/denom*100).toFixed(1)}%;background:${c[2]}"></div></div><span>$${Math.round(Math.max(0,c[1])).toLocaleString("en-AU")}</span></div>`).join("");}
setErr("i-err",errs.join(" "));
$("i-cta").href="contact.html?message="+encodeURIComponent("Investment estimate to discuss\nProperty value: "+money0(num("i-prop"))+"\nLoan: "+money0(loan)+" @ "+(rate*100).toFixed(2)+"%\nRent: "+money0(rentW)+"/wk, vacancy "+vac+" wks\nAfter-tax result: "+fmt(after)+" / yr ("+fmt(weekly)+" / wk)");
}
["i-prop","i-build","i-loan","i-rate","i-rent","i-vac","i-mgmt","i-other","i-dep","i-inc"].forEach(id=>$(id).addEventListener("input",iCalc));
/* ---------- stamp duty ---------- */
function dutyFor(st,price){
const B=window.DUTY.states[st].brackets;
for(let i=0;i<B.length;i++){
const [up,base,rate]=B[i];
if(up===null||price<=up){
const prev=i===0?0:B[i-1][0];
return base+rate*Math.max(0,price-prev);
}}
return 0;
}
function sCalc(){
const errs=[];
const st=$("s-state").value,price=Math.max(0,num("s-price"));
if(!(price>0))errs.push("Enter a property price over $0 (fees shown only).");
const S=window.DUTY.states[st];
const d=Math.round(dutyFor(st,price));
const approx=st==="NT"&&price<S.approxBelow;
const total=d+S.tfee+S.mfee,eff=price>0?d/price*100:0;
$("s-total").textContent=fmt(total);tick("s-total");
$("s-sub").textContent="estimated upfront government cost in "+S.name+" (duty + registration)";
$("s-price2").textContent=fmt(price);
$("s-duty").textContent=fmt(d);
$("s-tfee").textContent=fmt(S.tfee);
$("s-mfee").textContent=fmt(S.mfee);
$("s-eff").textContent=eff.toFixed(2)+"%";
$("s-fhog").textContent=S.fhog>0?fmt(S.fhog):"Not offered in "+st;
const purpose=segVal("s-use")==="invest"?"invest":"live";
$("s-fnote").textContent=(approx?"NT under $525k uses a statutory formula — this figure is approximate. ":"")+S.fhogNote+(purpose==="invest"?" Investor (non-owner) basis; surcharges excluded.":" Live-in basis; owner concessions not applied — first-home duty relief is not included, only the cash grant above.");
setErr("s-err",errs.join(" "));
$("s-cta").href="contact.html?message="+encodeURIComponent("Stamp duty check request\nState: "+S.name+"\nPrice: "+money0(price)+"\nPurpose: "+(purpose==="invest"?"Invest":"Live in")+"\nEstimate: duty "+fmt(d)+", reg fees "+fmt(S.tfee+S.mfee)+", total "+fmt(total));
}
seg("s-use",sCalc);
$("s-state").addEventListener("change",sCalc);$("s-price").addEventListener("input",sCalc);
/* ---------- init ---------- */
Object.keys(window.DUTY.states).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=window.DUTY.states[k].name;$("s-state").appendChild(o);});
$("s-state").value="VIC";
mCalc();iCalc();sCalc();
show((location.hash||"").replace("#",""));
})();
