/* ---------- Events ---------- */
document.addEventListener('click',function(ev){
  const el=ev.target.closest('[data-act]');if(!el||el.tagName==='FORM')return;
  const a=el.dataset.act,v=el.dataset.v,id=el.dataset.id;
  switch(a){
    case 'view':S.view=v;window.scrollTo({top:0});break;
    case 'logout':S.user=null;S.login={u:'',p:'',err:''};S.view=v==='login'?'login':'home';window.scrollTo({top:0});toast('Signed out.');break;
    case 'fill-demo':{const a=ACCOUNTS.find(x=>x.u===v);S.login={u:a.u,p:a.p,err:''};break;}
    case 'cust':S.staff.cust=v||null;S.staff.cmsg='';S.staff.cerr='';S.staff.cdraft=null;break;
    case 'to-forgot':S.forgot={email:'',err:'',sent:false};S.view='forgot';window.scrollTo({top:0});break;
    case 'tbl-off':S.staff.tmsg='';tblOff(v,false);break;
    case 'tbl-off-yes':tblOff(v,true);break;
    case 'tbl-on':tblOn(v);break;
    case 'warn-no':S.staff.warn=null;break;
    case 'date-close':S.staff.hmsg='';closeDate(v,false);break;
    case 'date-close-yes':closeDate(v,true);break;
    case 'date-open':openDate(v);break;
    case 'my-cancel':S.askCancel=v;break;
    case 'my-keep':S.askCancel=null;break;
    case 'my-cancel-yes':S.askCancel=null;cancelRes(v);break;
    case 'theme':S.theme=S.theme==='light'?'dark':'light';applyTheme();break;
    case 'next':slide(1);return;
    case 'prev':slide(-1);return;
    case 'dish':gotoDish(+v);return;
    case 'autoplay':{S.auto=!S.auto;const b=$('#h-auto');if(b){b.textContent=S.auto?'❚❚':'▶';b.setAttribute('aria-label',(S.auto?'Pause':'Play')+' automatic slideshow');}restartProg();schedule();return;}
    case 'to-pick':S.mode='pick';S.table=null;window.scrollTo({top:0});break;
    case 'gminus':{const pv=S.guests;S.guests=Math.max(1,S.guests-1);S.time=defaultTime();S.waitOpen=false;S.conflict='';S.hover=null;if(S.mode==='party'&&updateParty(pv))return;break;}
    case 'gminus-old':S.guests=Math.max(1,S.guests-1);S.time=defaultTime();S.waitOpen=false;S.conflict='';S.hover=null;break;
    case 'gplus':{const pv=S.guests;S.guests=Math.min(8,S.guests+1);S.time=defaultTime();S.waitOpen=false;S.conflict='';S.hover=null;if(S.mode==='party'&&updateParty(pv))return;break;}
    case 'gplus-old':S.guests=Math.min(8,S.guests+1);S.time=defaultTime();S.waitOpen=false;S.conflict='';S.hover=null;break;
    case 'date':S.date=v;S.time=defaultTime();S.waitOpen=false;S.conflict='';S.hover=null;break;
    case 'time':S.time=+v;S.conflict='';S.waitOpen=level(S.date,S.time,S.guests)==='full';S.hover=null;break;
    case 'pref':S.prefs.has(v)?S.prefs.delete(v):S.prefs.add(v);S.table=null;break;
    case 'table':S.table=el.dataset.table;S.hover=null;S.conflict='';break;
    case 'other-time':S.waitOpen=false;S.time=defaultTime();break;
    case 'to-details':if(!S.table)break;prefillFromUser();S.mode='details';S.errors={};break;
    case 'back1':S.mode='pick';break;
    case 'sample':S.details={first:'Alex',last:'Morgan',email:'alex@example.com',phone:'555-0188',note:S.occasion==='Birthday'?'Birthday celebration, please prepare a small dessert.':''};S.errors={};break;
    case 'sim-conflict':{
      const t=S.table;if(!t)break;addRes({date:S.date,table:t,start:S.time,party:Math.max(1,S.guests-1),name:'Another Guest',email:'guest@example.com',phone:'555-0100'});
      toast('Another guest just booked table '+t+' (demo).');break;}
    case 'attend':S.attended=true;toast('Thanks, attendance confirmed.');break;
    case 'cancel-ask':S.cancelAsk=true;break;
    case 'cancel-no':S.cancelAsk=false;break;
    case 'cancel-yes':S.cancelAsk=false;cancelRes(S.booking.id);break;
    case 'again':resetBooking();break;
    case 'accept-offer':{
      const e=WAIT.find(x=>x.id===id),hr=RES.find(r=>r.id===e.hold);
      if(hr){hr.status='CONFIRMED';e.status='CONFIRMED';S.booking=hr;S.date=hr.date;S.time=hr.start;S.guests=hr.party;S.mode='done';S.view='book';S.attended=false;S.cancelAsk=false;S.myWait=e;window.scrollTo({top:0});toast('Booked from the waitlist. Table '+hr.table+' is yours.');}
      break;}
    case 'decline-offer':expireHold(id,'DECLINED');break;
    case 'stab':S.staff.tab=v;S.staff.warn=null;S.staff.tmsg='';S.staff.hmsg='';break;
    case 'sdate':S.staff.date=v;S.staff.sel=null;break;
    case 'stime':S.staff.time=+v;break;
    case 'stable':S.staff.sel=el.dataset.table;break;
    case 's-confirm':{const r=RES.find(x=>x.id===id);if(r){r.status='CONFIRMED';toast('Reservation confirmed.');}break;}
    case 's-seat':{const r=RES.find(x=>x.id===id);if(r){r.status='SEATED';toast(r.name+' seated at table '+r.table+'.');}break;}
    case 's-done':{const r=RES.find(x=>x.id===id);if(r){r.status='COMPLETED';toast('Marked completed.');}break;}
    case 's-noshow':cancelRes(id,'NO_SHOW');break;
    case 's-cancel':cancelRes(id);break;
    case 's-block':{const k=S.staff.date+'|'+el.dataset.table;BLOCKED.has(k)?BLOCKED.delete(k):BLOCKED.add(k);break;}
    case 'expire':expireHold(id,'EXPIRED');break;
    case 'new-open':S.staff.newOpen=!S.staff.newOpen;S.staff.newErr='';break;
  }
  render();
});
document.addEventListener('keydown',function(ev){
  const tg=ev.target;
  if((ev.key==='Enter'||ev.key===' ')&&tg.closest&&tg.closest('g.tb[data-act]')){ev.preventDefault();tg.closest('g.tb').dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
  if((S.view==='home'||S.view==='menu')&&(ev.key==='ArrowRight'||ev.key==='ArrowLeft')&&!(tg&&/INPUT|SELECT|TEXTAREA/.test(tg.tagName||''))){slide(ev.key==='ArrowRight'?1:-1);}
});
document.addEventListener('input',function(ev){
  const t=ev.target,id=t.id;
  if(id==='trange'){S.time=SLOTS[+t.value];S.conflict='';S.hover=null;S.waitOpen=level(S.date,S.time,S.guests)==='full';refreshBook();return;}
  if(id==='diet'){S.dietary=t.value;return;}
  if(id==='wl-name')S.wl.name=t.value;else if(id==='wl-email')S.wl.email=t.value;else if(id==='wl-phone')S.wl.phone=t.value;
  else if(id==='f-first')S.details.first=t.value;else if(id==='f-last')S.details.last=t.value;else if(id==='f-email')S.details.email=t.value;else if(id==='f-phone')S.details.phone=t.value;else if(id==='f-note')S.details.note=t.value;
  else if(id==='q'){S.staff.q=t.value;render();}
  else if(id==='cq'){S.staff.cq=t.value;render();}
  else if(id==='su-first')S.signup.first=t.value;else if(id==='su-last')S.signup.last=t.value;else if(id==='su-email')S.signup.email=t.value;else if(id==='su-pass')S.signup.pass=t.value;
  else if(id==='m-ref')S.manage.ref=t.value;else if(id==='m-email')S.manage.email=t.value;else if(id==='f-mail')S.forgot.email=t.value;
  else if(id==='l-user'){S.login.u=t.value;}else if(id==='l-pass'){S.login.p=t.value;}
});
document.addEventListener('change',function(ev){
  if(/^cap-/.test(ev.target.id)){S.staff.tmsg='';tblSeats(ev.target.id.slice(4),+ev.target.value);render();return;}
  if(ev.target.id==='flt'){S.staff.filter=ev.target.value;render();}
  else if(ev.target.id==='f-occ')S.occasion=ev.target.value;
});
/* hover preview of a table: only the side panel is refreshed, never the map under the pointer */
document.addEventListener('mouseover',function(ev){
  if(S.view!=='book'||S.mode!=='pick'||!ev.target.closest)return;
  const inFloor=!!ev.target.closest('.floor'),g=ev.target.closest('g.tb[data-act="table"]'),next=g?g.dataset.table:null;
  if(!inFloor&&S.hover===null)return;
  if(next===S.hover)return;
  S.hover=next;refreshPanel();
});
/* swipe or drag on the hero */
let PX=null;
document.addEventListener('pointerdown',function(ev){
  if((S.view!=='home'&&S.view!=='menu')||!ev.target.closest||!ev.target.closest('#hero')||ev.target.closest('.arrow,.cf-tab,.btn'))return;
  PX=ev.clientX;
});
document.addEventListener('pointerup',function(ev){
  if(PX==null)return;const dx=ev.clientX-PX;PX=null;
  if(Math.abs(dx)>45)slide(dx<0?1:-1);
});
document.addEventListener('submit',function(ev){
  ev.preventDefault();const f=ev.target.id;
  if(f==='loginform'){doLogin();render();return;}
  if(f==='manageform'){doManage();render();return;}
  if(f==='forgotform'){const em=S.forgot.email.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){S.forgot.err='Enter a valid email address.';}else{S.forgot.err='';S.forgot.sent=true;}render();return;}
  if(f==='cedit'){const m=saveContact(S.staff.cust,new FormData(ev.target));const fd2=new FormData(ev.target);S.staff.cerr=m;S.staff.cdraft=m?{email:fd2.get('c-email')||'',phone:fd2.get('c-phone')||''}:null;if(m)S.staff.cmsg='';render();return;}
  if(f==='signupform'){doSignup();render();return;}
  if(f==='tblform'){S.staff.tmsg='';tblAdd(new FormData(ev.target));render();return;}
  if(f==='hoursform'){const fd=new FormData(ev.target),m=setHours(+fd.get('h-first'),+fd.get('h-last'));S.staff.hmsg=m||'Opening hours saved: '+fmtT(SLOTS[0])+' to '+fmtT(SLOTS[SLOTS.length-1])+' (last seating). Guests see the new times now.';render();return;}
  if(f==='detform'){
    S.errors=validateDetails();
    if(Object.keys(S.errors).length){render();const first=document.querySelector('[aria-invalid="true"]');if(first)first.focus();return;}
    if(!S.table||!free(S.table,S.date,S.time,S.time+DUR)){
      const old=S.table;S.mode='pick';S.table=null;sync();
      S.conflict='Table '+old+' was booked by another guest while you were reviewing.'+(S.matches.length?' We selected the next best match, table '+S.matches[0].t.id+'.':' Please choose another time or join the waitlist.');
      S.waitOpen=!S.matches.length;S.busy=false;render();return;}
    if(S.busy)return;S.busy=true;
    const cb=$('#cbtn');
    const commit=function(){S.busy=false;const d=S.details;
    S.booking=addRes({date:S.date,table:S.table,start:S.time,party:S.guests,name:d.first.trim()+' '+d.last.trim(),email:d.email.trim(),phone:d.phone.trim(),note:[S.dietary,d.note].filter(Boolean).join(' · '),occasion:S.occasion,prefs:Array.from(S.prefs),source:'online',owner:S.user&&S.user.role==='customer'?S.user.u:undefined});
    S.mode='done';S.conflict='';S.attended=false;S.cancelAsk=false;toast('Reservation confirmed. Table '+S.booking.table+' is yours.');render();};
    if(cb&&cb.classList&&!REDUCED){cb.classList.add('go');setTimeout(function(){cb.classList.remove('go');cb.classList.add('ok');},1700);setTimeout(commit,2900);}else commit();
  }else if(f==='wlform'){
    const w=S.wl,e={};
    if(!w.name.trim())e.name='Enter your name.';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w.email.trim()))e.email='Enter a valid email address.';
    S.wlErr=e;if(Object.keys(e).length){render();return;}
    waitSeq++;const entry={id:'w'+waitSeq,seq:waitSeq,date:S.date,time:S.time,party:S.guests,name:w.name.trim(),email:w.email.trim(),phone:w.phone.trim(),status:'WAITING',mine:true};
    WAIT.push(entry);S.myWait=entry;toast('You are on the waitlist.');render();
  }else if(f==='newform'){
    const fd=new FormData(ev.target),name=(fd.get('n-name')||'').trim()||'Walk-in guest',party=Math.max(1,Math.min(6,parseInt(fd.get('n-party'),10)||2)),start=+fd.get('n-time'),date=S.staff.date;
    const c=availTables(date,start,party).sort((a,b)=>a.cap-b.cap)[0];
    if(!c){S.staff.newErr='Conflict: no table for '+party+' is free at '+fmtT(start)+' on this date. Choose another time.';}
    else{addRes({date,table:c.id,start,party,name,email:'',phone:'',source:'staff'});S.staff.newErr='';S.staff.newOpen=false;toast('Reservation saved at table '+c.id+'.');}
    render();
  }
});

function render(){
  const ae=document.activeElement,fk=ae&&ae.dataset?ae.dataset.fk:null,selStart=(ae&&(ae.id==='q'||ae.id==='cq'))?ae.selectionStart:null;
  let body;
  if(S.view==='home')body=homeHTML();
  else if(S.view==='menu')body=menuHTML();
  else if(S.view==='book')body=GUIDE+bookHTML();
  else if(S.view==='login')body=loginHTML();
  else if(S.view==='signup')body=signupHTML();
  else if(S.view==='about')body=aboutHTML();
  else if(S.view==='contact')body=contactHTML();
  else if(S.view==='manage')body=manageHTML();
  else if(S.view==='forgot')body=forgotHTML();
  else if(S.view==='account')body=S.user&&S.user.role==='customer'?accountView():loginHTML();
  else body=GUIDE+(S.user&&S.user.role==='staff'?staffHTML():lockedHTML());
  $('#app').innerHTML=navHTML()+body+(S.view==='staff'&&S.user&&S.user.role==='staff'?'':footerHTML());
  if($('#app').style)$('#app').style.setProperty('--glow',DISHES[S.dish].glow);applyTint();
  if(fk){const el=document.querySelector('[data-fk="'+fk+'"]');if(el){el.focus({preventScroll:true});if(selStart!=null&&el.setSelectionRange)try{el.setSelectionRange(selStart,selStart);}catch(e){}}}
  schedule();
}
setInterval(function(){
  let changed=false;
  RES.forEach(r=>{if(r.status==='HOLD'&&r.holdUntil<Date.now()){const e=WAIT.find(x=>x.hold===r.id&&x.status==='OFFERED');if(e){expireHold(e.id,'EXPIRED');changed=true;}else r.status='CANCELLED';}});
  if(changed){render();return;}
  document.querySelectorAll('[data-hold]').forEach(n=>{const e=WAIT.find(x=>x.id===n.dataset.hold),hr=e&&RES.find(r=>r.id===e.hold);if(hr)n.textContent=mmss(hr.holdUntil-Date.now());});
},1000);
render();
})();
