(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtT=m=>{const h=Math.floor(m/60),mm=m%60;return ((h+11)%12+1)+':'+String(mm).padStart(2,'0')+' '+(h>=12?'PM':'AM');};
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parseD=s=>{const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);};
const fmtD=(s,o)=>parseD(s).toLocaleDateString('en-US',o||{weekday:'short',month:'short',day:'numeric'});
const fmtLong=s=>fmtD(s,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const mmss=ms=>{ms=Math.max(0,ms);const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- Data ---------- */
const DUR=90;
const SLOTS=[];for(let m=17*60;m<=20*60+30;m+=30)SLOTS.push(m);
const STIMES=[];for(let m=17*60;m<=21*60;m+=30)STIMES.push(m);
const TABLES=[
 {id:'W1',cap:2,zone:'Window',x:62,y:78,tags:['window','quiet']},
 {id:'W2',cap:2,zone:'Window',x:62,y:150,tags:['window']},
 {id:'W3',cap:4,zone:'Window',x:150,y:72,tags:['window','accessible']},
 {id:'W4',cap:4,zone:'Window',x:215,y:150,tags:['window','booth']},
 {id:'M1',cap:4,zone:'Main hall',x:346,y:78,tags:['booth']},
 {id:'M2',cap:4,zone:'Main hall',x:436,y:78,tags:['accessible']},
 {id:'M3',cap:6,zone:'Main hall',x:548,y:92,tags:['booth','accessible']},
 {id:'M4',cap:2,zone:'Main hall',x:390,y:156,tags:['quiet','accessible']},
 {id:'P1',cap:2,zone:'Patio',x:80,y:322,tags:['patio','quiet']},
 {id:'P2',cap:4,zone:'Patio',x:200,y:300,tags:['patio','accessible']},
 {id:'P3',cap:4,zone:'Patio',x:320,y:322,tags:['patio']},
 {id:'P4',cap:6,zone:'Patio',x:470,y:305,tags:['patio','booth']}];
let TOTAL_SEATS=TABLES.reduce((a,t)=>a+t.cap,0);
const TAGLBL={window:'window',quiet:'quiet corner',patio:'patio',accessible:'accessible',booth:'booth'};
const PREFS=['window','quiet','patio','accessible','booth'];
const OCCS=['Birthday','Date night','Business','Family','Just dining'];
const BLOCKING=['PENDING','CONFIRMED','SEATED','HOLD'];
const RES=[],WAIT=[],BLOCKED=new Set();
let resN=40,waitSeq=0;
const FIRST=['Priya','Daniel','Maria','Sam','Lena','Omar','Chloe','Marcus','Aiko','Noah','Fatima','Lucas','Hannah','Ravi','Sofia','Ethan','Amara','Jonas'];
const LAST=['Shah','Lee','Costa','Okafor','Young','Diaz','Park','Nguyen','Tremblay','Singh','Haddad','Martin','Kim','Roy','Ali','Wong'];
const DIET=['Nut allergy','Vegetarian','Gluten-free','Shellfish allergy'];

function free(tid,date,start,end){
  if(BLOCKED.has(date+'|'+tid))return false;
  return !RES.some(r=>r.table===tid&&r.date===date&&BLOCKING.includes(r.status)&&r.start<end&&r.end>start);
}
function addRes(o){resN++;const r=Object.assign({id:'r'+resN,ref:'TE-'+o.date.replace(/-/g,'')+'-'+String(resN).padStart(4,'0'),status:'CONFIRMED',source:'online',occasion:'Just dining',prefs:[],note:'',email:'',phone:'',end:o.start+DUR},o);RES.push(r);return r;}
function seedDay(date){
  const dow=parseD(date).getDay();if(dow===1)return;
  const r=rng(+date.replace(/-/g,''));
  const person=()=>{const f=FIRST[Math.floor(r()*FIRST.length)],l=LAST[Math.floor(r()*LAST.length)];return{name:f+' '+l,email:f.toLowerCase()+'@example.com',phone:'555-01'+String(10+Math.floor(r()*89))};};
  const extras=t=>({party:Math.max(1,Math.round(t.cap*(0.5+r()*0.5))),occasion:OCCS[Math.floor(r()*OCCS.length)],note:r()<0.18?DIET[Math.floor(r()*DIET.length)]:'',status:r()<0.15?'PENDING':'CONFIRMED',source:r()<0.25?'staff':'online'});
  if(dow===5||dow===6){
    const st={W3:1110,W4:1140,M1:1140,M2:1110,M3:1170,P2:1140,P3:1170,P4:1140};
    Object.keys(st).forEach(id=>{const t=TABLES.find(x=>x.id===id);addRes(Object.assign({date,table:id,start:st[id]},person(),extras(t)));});
  }
  const base={0:.3,2:.1,3:.14,4:.24,5:.32,6:.32}[dow];
  TABLES.forEach(t=>SLOTS.forEach(s=>{
    if(!free(t.id,date,s,s+DUR))return;
    const w=s<18*60?.5:(s<=20*60?1:.6);
    if(r()<base*w)addRes(Object.assign({date,table:t.id,start:s},person(),extras(t)));
  }));
}
const DATES=[];
(function(){const d=new Date();d.setHours(12);for(let i=1;i<=7;i++){const x=new Date(d);x.setDate(d.getDate()+i);DATES.push({iso:iso(x),closed:x.getDay()===1});}})();
DATES.forEach(d=>seedDay(d.iso));
let firstOpen=DATES.find(d=>!d.closed).iso;
// seeded waitlist: one party already waiting at the first Friday/Saturday 7:00 PM
const peakDate=(DATES.find(d=>{const w=parseD(d.iso).getDay();return w===6;})||DATES.find(d=>{const w=parseD(d.iso).getDay();return w===5;})||DATES[0]).iso;
WAIT.push({id:'w'+(++waitSeq),seq:waitSeq,date:peakDate,time:19*60,party:2,name:'Dana Roy',email:'dana@example.com',phone:'555-0142',status:'WAITING',mine:false});

/* ---------- Availability and matching ---------- */
function availTables(date,start,party){return TABLES.filter(t=>t.cap>=party&&free(t.id,date,start,start+DUR));}
function level(date,start,party){
  if(party>6)return 'full';
  if(!availTables(date,start,party).length)return 'full';
  const used=TABLES.filter(t=>!free(t.id,date,start,start+DUR)).reduce((a,t)=>a+t.cap,0)/TOTAL_SEATS;
  return used<.4?'quiet':(used<.75?'moderate':'busy');
}
const LV={quiet:'Quiet',moderate:'Moderate',busy:'Busy',full:'Full'};
function match(){
  return availTables(S.date,S.time,S.guests).map(t=>{
    let sc=-2*(t.cap-S.guests);const hits=[];
    S.prefs.forEach(p=>{if(t.tags.includes(p)){sc+=10;hits.push(p);}});
    let why='';
    if(S.occasion==='Birthday'&&(t.tags.includes('booth')||t.cap>=4)){sc+=t.tags.includes('booth')?4:2;why='birthday';}
    if(S.occasion==='Date night'&&S.guests<=2&&t.tags.includes('quiet')){sc+=6;why='date night';}
    if(S.occasion==='Date night'&&S.guests<=2&&t.tags.includes('window'))sc+=3;
    if(S.occasion==='Business'&&t.tags.includes('quiet')){sc+=6;why='business dining';}
    if(S.occasion==='Family'&&t.tags.includes('booth')){sc+=4;why='family dining';}
    return{t,sc,hits,why};
  }).sort((a,b)=>b.sc-a.sc||a.t.id.localeCompare(b.t.id));
}
function reason(m){
  const bits=['Seats '+m.t.cap];
  const tagTxt=m.t.tags.map(x=>TAGLBL[x]).join(', ');if(tagTxt)bits.push(tagTxt);
  let s=bits.join(', ');
  const ex=[];if(m.hits.length)ex.push('your '+m.hits.map(h=>TAGLBL[h]).join(' and ')+' preference');
  if(m.why)ex.push('a '+m.why+' evening');
  if(ex.length)s+='. Matches '+ex.join(' and ')+'.';
  return s;
}

/* ---------- State ---------- */
