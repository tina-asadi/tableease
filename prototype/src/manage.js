/* ---------- Table management, opening hours and closing dates, sign up, My bookings (UC-03, 04, 08, 09) ---------- */
const INACTIVE=[],SPOTS={'Window':[[135,182]],'Main hall':[[470,172],[600,175]],'Patio':[[80,398],[200,392],[330,395],[580,330],[580,395]]};
const TAGS_ALL=['window','quiet','accessible','booth','patio'];
const HOUR_OPTS=[];for(let m=16*60;m<=21*60;m+=30)HOUR_OPTS.push(m);
S.staff.warn=null;S.staff.tmsg='';S.staff.hmsg='';S.signup={first:'',last:'',email:'',pass:'',err:{}};S.askCancel=null;
const todayISO=()=>iso(new Date());
const UPCOMING=['PENDING','CONFIRMED','HOLD'];
function recalc(){TOTAL_SEATS=TABLES.reduce((a,t)=>a+t.cap,0);}
function afterTableChange(){S.table=TABLES.some(t=>t.id===S.table)?S.table:null;if(S.mode==='pick')sync();}
const affectedByTable=id=>RES.filter(r=>r.table===id&&UPCOMING.includes(r.status)&&r.date>=todayISO());
const dateAff=d=>RES.filter(r=>r.date===d&&UPCOMING.includes(r.status));
function fixDates(){
  const f=DATES.find(d=>!d.closed);firstOpen=f?f.iso:DATES[0].iso;
  const ok=x=>{const d=DATES.find(y=>y.iso===x);return d&&!d.closed;};
  if(!ok(S.date)){S.date=firstOpen;S.time=defaultTime();}
  if(!ok(S.staff.date))S.staff.date=firstOpen;
}
function tblOff(id,force){
  const t=TABLES.find(x=>x.id===id);if(!t)return;
  if(TABLES.length<=1){S.staff.tmsg='Keep at least one active table.';return;}
  const aff=affectedByTable(id);
  if(aff.length&&!force){S.staff.warn={kind:'table',id:id,n:aff.length,list:aff.slice(0,6).map(r=>r.name+', '+fmtD(r.date)+' at '+fmtT(r.start))};return;}
  TABLES.splice(TABLES.indexOf(t),1);INACTIVE.push(t);recalc();S.staff.warn=null;
  aff.forEach(r=>{r.status='CANCELLED';});
  if(S.staff.sel===id)S.staff.sel=null;afterTableChange();
  S.staff.tmsg='Table '+id+' is deactivated.'+(aff.length?' '+aff.length+' upcoming booking'+(aff.length>1?'s were':' was')+' cancelled.':'');
}
function tblOn(id){const i=INACTIVE.findIndex(x=>x.id===id);if(i<0)return;TABLES.push(INACTIVE.splice(i,1)[0]);recalc();S.staff.tmsg='Table '+id+' is active again.';}
function tblSeats(id,cap){
  const t=TABLES.find(x=>x.id===id);if(!t||cap===t.cap)return;
  const bad=cap<t.cap?RES.filter(r=>r.table===id&&UPCOMING.includes(r.status)&&r.date>=todayISO()&&r.party>cap):[];
  if(bad.length){S.staff.tmsg='Table '+id+' cannot drop to '+cap+' seats: '+bad.length+' upcoming booking'+(bad.length>1?'s need':' needs')+' more (for example '+bad[0].name+', party of '+bad[0].party+'). Move or cancel them first.';return;}
  t.cap=cap;recalc();afterTableChange();S.staff.tmsg='Table '+id+' now seats '+cap+'.';
}
function tblAdd(fd){
  const zone=fd.get('t-zone'),cap=+fd.get('t-cap'),all=TABLES.concat(INACTIVE);
  const spot=(SPOTS[zone]||[]).find(p=>all.every(t=>Math.hypot(t.x-p[0],t.y-p[1])>70));
  if(!spot){S.staff.tmsg='There is no free space left in the '+zone.toLowerCase()+' on the floor plan. Deactivate or move a table first.';return;}
  const L={'Window':'W','Main hall':'M','Patio':'P'}[zone];let n=1;while(all.some(t=>t.id===L+n))n++;
  const tags=fd.getAll('t-tag').filter(x=>TAGS_ALL.includes(x));
  if(zone==='Window'&&!tags.includes('window'))tags.push('window');if(zone==='Patio'&&!tags.includes('patio'))tags.push('patio');
  TABLES.push({id:L+n,cap:cap,zone:zone,x:spot[0],y:spot[1],tags:tags});recalc();S.staff.tmsg='Table '+L+n+' added to the '+zone.toLowerCase()+', seats '+cap+'. It is bookable now.';
}
function setHours(first,last){
  if(last-first<90)return 'The last seating must be at least 90 minutes after the first.';
  SLOTS.length=0;for(let m=first;m<=last;m+=30)SLOTS.push(m);
  STIMES.length=0;for(let m=first;m<=last+30;m+=30)STIMES.push(m);
  S.time=defaultTime();if(!STIMES.includes(S.staff.time))S.staff.time=STIMES[Math.floor(STIMES.length/2)];
  return '';
}
function closeDate(d,force){
  const rec=DATES.find(x=>x.iso===d);if(!rec)return;
  const aff=dateAff(d);
  if(aff.length&&!force){S.staff.warn={kind:'date',date:d,n:aff.length,list:aff.slice(0,6).map(r=>r.name+', '+fmtT(r.start)+', table '+r.table)};return;}
  if(DATES.filter(x=>!x.closed).length<=1){S.staff.hmsg='At least one day must stay open.';S.staff.warn=null;return;}
  aff.forEach(r=>{r.status='CANCELLED';});
  WAIT.forEach(e=>{if(e.date===d&&['WAITING','OFFERED'].includes(e.status))e.status='EXPIRED';});
  rec.closed=true;fixDates();S.staff.warn=null;
  S.staff.hmsg=fmtD(d,{weekday:'long',month:'short',day:'numeric'})+' is closed to bookings.'+(aff.length?' '+aff.length+' booking'+(aff.length>1?'s were':' was')+' cancelled.':'');
}
function openDate(d){const rec=DATES.find(x=>x.iso===d);if(!rec)return;rec.closed=false;fixDates();S.staff.hmsg=fmtD(d,{weekday:'long',month:'short',day:'numeric'})+' is open for bookings again.';}

function warnBox(){
  const w=S.staff.warn;if(!w)return '';
  const items='<ul style="margin:0;padding-left:20px">'+w.list.map(x=>'<li>'+esc(x)+'</li>').join('')+(w.n>w.list.length?'<li>and '+(w.n-w.list.length)+' more</li>':'')+'</ul>';
  return '<div class="warnbox" role="alert"><b>'+(w.kind==='table'?'Table '+esc(w.id)+' has '+w.n+' upcoming booking'+(w.n>1?'s':''):w.n+' booking'+(w.n>1?'s are':' is')+' on '+esc(fmtD(w.date,{weekday:'long',month:'short',day:'numeric'})))+':</b>'+items+
   '<div class="row"><button type="button" class="btn primary small" data-act="'+(w.kind==='table'?'tbl-off-yes':'date-close-yes')+'" data-v="'+esc(w.kind==='table'?w.id:w.date)+'" data-fk="warn-yes">'+(w.kind==='table'?'Deactivate and cancel these bookings':'Close the day and cancel these bookings')+'</button><button type="button" class="btn small" data-act="warn-no" data-fk="warn-no">Keep as it is</button></div></div>';
}
function tablesView(){
  const st=S.staff,tag=t=>t.tags.map(x=>TAGLBL[x]).join(', ')||'None';
  const rows=TABLES.slice().sort((a,b)=>a.id.localeCompare(b.id)).map(t=>'<tr><td><b>'+t.id+'</b></td><td>'+esc(t.zone)+'</td><td><select id="cap-'+t.id+'" data-fk="cap-'+t.id+'" aria-label="Seats at table '+t.id+'">'+[2,4,6].concat([2,4,6].includes(t.cap)?[]:[t.cap]).map(c=>'<option value="'+c+'"'+(c===t.cap?' selected':'')+'>'+c+' seats</option>').join('')+'</select></td><td class="small">'+esc(tag(t))+'</td><td>'+affectedByTable(t.id).length+'</td><td><button type="button" class="btn small" data-act="tbl-off" data-v="'+t.id+'" data-fk="off-'+t.id+'">Deactivate</button></td></tr>').join('');
  const off=INACTIVE.length?'<h3 style="margin-top:18px">Deactivated tables</h3><div class="row">'+INACTIVE.map(t=>'<span class="pill st-cancelled">'+t.id+' · '+t.cap+' seats</span><button type="button" class="btn small" data-act="tbl-on" data-v="'+t.id+'" data-fk="on-'+t.id+'">Reactivate '+t.id+'</button>').join('')+'</div>':'';
  const form='<form id="tblform" class="form2" style="margin-top:12px" novalidate><div class="field"><label for="t-zone">Zone</label><select id="t-zone" name="t-zone"><option>Window</option><option>Main hall</option><option>Patio</option></select></div><div class="field"><label for="t-cap">Seats</label><select id="t-cap" name="t-cap"><option value="2">2 seats</option><option value="4" selected>4 seats</option><option value="6">6 seats</option></select></div>'+
   '<fieldset class="field wide" style="border:0;padding:0;margin:0;grid-column:1/-1"><legend class="label" style="padding:0 0 6px">Features</legend><div class="row">'+TAGS_ALL.map(x=>'<label class="chk"><input type="checkbox" name="t-tag" value="'+x+'"> '+TAGLBL[x]+'</label>').join('')+'</div></fieldset>'+
   '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit" data-fk="tbl-add">Add table</button></div></form>';
  return '<div class="card"><div class="row" style="justify-content:space-between"><h3>Table management</h3><span class="muted small">'+TABLES.length+' active · '+TOTAL_SEATS+' seats</span></div>'+warnBox()+(st.tmsg?'<p class="okmsg" role="status">'+esc(st.tmsg)+'</p>':'')+
   '<div class="scroll" style="margin-top:12px"><table class="list"><thead><tr><th>Table</th><th>Zone</th><th>Capacity</th><th>Features</th><th>Upcoming</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+off+
   '<h3 style="margin-top:18px">Add a table</h3>'+form+'</div>';
}
function hoursView(){
  const st=S.staff,first=SLOTS[0],last=SLOTS[SLOTS.length-1];
  const opt=(arr,v)=>arr.map(m=>'<option value="'+m+'"'+(m===v?' selected':'')+'>'+fmtT(m)+'</option>').join('');
  const days=DATES.map(d=>{const n=dateAff(d.iso).length;return '<div class="dayrow"><span><b>'+fmtD(d.iso,{weekday:'long',month:'short',day:'numeric'})+'</b><br><small>'+(d.closed?'Closed to bookings':n+' booking'+(n===1?'':'s'))+'</small></span>'+(d.closed?'<button type="button" class="btn small" data-act="date-open" data-v="'+d.iso+'" data-fk="do-'+d.iso+'">Reopen</button>':'<button type="button" class="btn small" data-act="date-close" data-v="'+d.iso+'" data-fk="dc-'+d.iso+'">Close this day</button>')+'</div>';}).join('');
  return '<div class="card"><h3>Opening hours</h3><p class="muted small" style="margin:4px 0 0">Customers can book a table every 30 minutes between the first and last seating. Bookings already made outside the new hours are kept.</p>'+
   '<form id="hoursform" class="form2" style="margin-top:12px" novalidate><div class="field"><label for="h-first">First seating</label><select id="h-first" name="h-first">'+opt(HOUR_OPTS.filter(m=>m<=19*60+30),first)+'</select></div><div class="field"><label for="h-last">Last seating</label><select id="h-last" name="h-last">'+opt(HOUR_OPTS.filter(m=>m>=18*60),last)+'</select></div>'+
   '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit" data-fk="hrs-save">Save hours</button></div></form>'+
   '<h3 style="margin-top:20px">Closing dates and holidays</h3><p class="muted small" style="margin:4px 0 10px">The next 7 days. Closing a day removes it from the guest booking page.</p>'+warnBox()+(st.hmsg?'<p class="okmsg" role="status">'+esc(st.hmsg)+'</p>':'')+'<div class="stack" style="gap:8px">'+days+'</div></div>';
}
function signupHTML(){
  const s=S.signup,e=s.err;
  return '<div class="login card"><div><span class="label">Create an account</span><h2 style="margin-top:4px">Sign up</h2><p class="muted small" style="margin:6px 0 0">Save your details and see or cancel your reservations in one place.</p></div>'+
   '<form id="signupform" class="stack" style="gap:12px" novalidate><div class="form2">'+fld('su-first','First name','text',s.first,e.first,'')+fld('su-last','Last name','text',s.last,e.last,'')+fld('su-email','Email','email',s.email,e.email,'',' wide')+fld('su-pass','Password (8 or more characters)','password',s.pass,e.pass,'',' wide')+'</div>'+
   '<button class="btn primary big" type="submit" data-fk="su-go">Create account</button></form><p class="muted small" style="margin:0">Already have an account? <button type="button" class="linkbtn" data-act="view" data-v="login" data-fk="su-login">Sign in</button></p></div>';
}
function accountView(){
  const u=S.user,mine=RES.filter(r=>r.owner===u.u).sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start);
  const up=mine.filter(r=>['PENDING','CONFIRMED'].includes(r.status)&&r.date>=todayISO()),past=mine.filter(r=>!up.includes(r));
  const card=(r,act)=>{const z=(TABLES.concat(INACTIVE).find(t=>t.id===r.table)||{}).zone||'';
    return '<div class="item"><div class="row" style="justify-content:space-between"><b>'+fmtD(r.date,{weekday:'long',month:'long',day:'numeric'})+' at '+fmtT(r.start)+'</b><span class="pill st-'+r.status.toLowerCase()+'">'+r.status.replace('_','-').toLowerCase().replace(/^./,c=>c.toUpperCase())+'</span></div><small>Party of '+r.party+' · table '+r.table+(z?' · '+esc(z):'')+' · '+esc(r.ref)+(r.note?' · '+esc(r.note):'')+'</small>'+
     (act?(S.askCancel===r.id?'<div class="warnbox" role="alert" style="margin-top:8px"><b>Cancel this reservation?</b><span>Your table will be released for other guests.</span><div class="row"><button type="button" class="btn primary small" data-act="my-cancel-yes" data-v="'+r.id+'" data-fk="mc-yes">Yes, cancel it</button><button type="button" class="btn small" data-act="my-keep" data-fk="mc-keep">Keep it</button></div></div>':'<div class="acts" style="margin-top:8px"><button type="button" class="btn small" data-act="my-cancel" data-v="'+r.id+'" data-fk="mc-'+r.id+'">Cancel reservation</button></div>'):'')+'</div>';};
  return '<div class="stack"><div class="card"><span class="label">My account</span><h2 style="margin-top:4px">Hello, '+esc(u.first||u.name)+'</h2><p class="muted small" style="margin:4px 0 0">'+esc(u.email)+'</p></div>'+
   '<div class="card"><div class="row" style="justify-content:space-between"><h3>Upcoming reservations</h3><button type="button" class="btn primary small" data-act="view" data-v="book" data-fk="my-new">Reserve a table</button></div><div class="stack" style="gap:10px;margin-top:12px">'+(up.length?up.map(r=>card(r,true)).join(''):'<p class="muted" style="margin:0">You have no upcoming reservations.</p>')+'</div></div>'+
   (past.length?'<div class="card"><h3>Past and cancelled</h3><div class="stack" style="gap:10px;margin-top:12px">'+past.map(r=>card(r,false)).join('')+'</div></div>':'')+'</div>';
}
function doSignup(){
  const s=S.signup,e={};
  if(!s.first.trim())e.first='Enter your first name.';if(!s.last.trim())e.last='Enter your last name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim()))e.email='Enter a valid email address.';
  else if(ACCOUNTS.some(a=>a.email&&a.email.toLowerCase()===s.email.trim().toLowerCase()))e.email='An account with this email already exists. Sign in instead.';
  if(s.pass.length<8)e.pass='Use at least 8 characters.';else if(/^(password|12345678|qwerty|11111111)/i.test(s.pass))e.pass='That password is too common. Choose another.';
  s.err=e;if(Object.keys(e).length)return false;
  const a={u:s.email.trim().toLowerCase(),p:s.pass,role:'customer',name:s.first.trim()+' '+s.last.trim(),first:s.first.trim(),last:s.last.trim(),email:s.email.trim()};
  ACCOUNTS.push(a);S.user=a;S.signup={first:'',last:'',email:'',pass:'',err:{}};S.view='account';window.scrollTo({top:0});toast('Account created. Welcome, '+a.first+'.');return true;
}
(function(){const d=DATES.filter(x=>!x.closed)[1]||DATES.find(x=>!x.closed),t=d&&availTables(d.iso,18*60,2)[0];
  if(t)addRes({date:d.iso,table:t.id,start:18*60,party:2,name:'Alex Morgan',email:'guest@tableease.test',phone:'555-0188',owner:'guest',occasion:'Date night'});})();
