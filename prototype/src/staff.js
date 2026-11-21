function resAt(date,tid,T){return RES.find(r=>r.table===tid&&r.date===date&&BLOCKING.includes(r.status)&&r.start<=T&&T<r.end);}
function tStatus(t,date,T){
  if(BLOCKED.has(date+'|'+t.id))return{cls:'blocked',label:'Blocked',sub:'blocked'};
  const r=resAt(date,t.id,T);
  if(r){const last=r.name.split(' ').slice(-1)[0];
    if(r.status==='SEATED')return{cls:'seated',label:'Seated',sub:last,r};
    if(r.status==='HOLD')return{cls:'hold',label:'Hold',sub:'hold',r};
    return{cls:'res',label:'Reserved',sub:last,r};}
  const soon=RES.find(x=>x.table===t.id&&x.date===date&&BLOCKING.includes(x.status)&&x.start>T&&x.start<=T+30);
  if(soon)return{cls:'soon',label:'Arriving soon',sub:soon.name.split(' ').slice(-1)[0],r:soon};
  return{cls:'free',label:'Available',sub:t.cap+' seats'};
}
const dayRes=date=>RES.filter(r=>r.date===date&&r.status!=='HOLD').sort((a,b)=>a.start-b.start||a.table.localeCompare(b.table));
function dateChipsStaff(){
  return '<div class="row" role="group" aria-label="Date">'+DATES.map(d=>'<button type="button" class="chip" data-fk="sd-'+d.iso+'" data-act="sdate" data-v="'+d.iso+'" aria-pressed="'+(S.staff.date===d.iso)+'"'+(d.closed?' disabled':'')+'>'+fmtD(d.iso,{weekday:'short',day:'numeric'})+(d.closed?' · Closed':'')+'</button>').join('')+'</div>';
}
function staffHTML(){
  const st=S.staff,date=st.date,T=st.time;
  const dr=dayRes(date),active=dr.filter(r=>['PENDING','CONFIRMED','SEATED'].includes(r.status));
  const freeNow=TABLES.filter(t=>tStatus(t,date,T).cls==='free').length;
  const waiting=WAIT.filter(e=>e.date===date&&(e.status==='WAITING'||e.status==='OFFERED')).length;
  const upcoming=DATES.filter(d=>d.iso>date).reduce((a,d)=>a+RES.filter(r=>r.date===d.iso&&['PENDING','CONFIRMED'].includes(r.status)).length,0);
  let h='<div class="stack"><div class="sec" style="margin:0"><span class="label">Date</span>'+dateChipsStaff()+'</div>'+
   '<div class="kpis"><div class="kpi"><b>'+active.length+'</b><span>Reservations on '+fmtD(date,{weekday:'short',month:'short',day:'numeric'})+'</span></div><div class="kpi"><b>'+upcoming+'</b><span>Upcoming after this date</span></div><div class="kpi"><b>'+freeNow+'</b><span>Tables free at '+fmtT(T)+'</span></div><div class="kpi"><b>'+waiting+'</b><span>On the waitlist</span></div><div class="kpi"><b>'+dr.filter(r=>r.status==='CANCELLED').length+'</b><span>Cancelled</span></div></div>'+
   '<div class="tabs" role="tablist">'+[['floor','Live floor'],['res','Reservations'],['cust','Customers'],['tbl','Tables'],['avl','Opening hours'],['ins','Insights']].map(x=>'<button role="tab" data-fk="tab-'+x[0]+'" data-act="stab" data-v="'+x[0]+'" aria-selected="'+(st.tab===x[0])+'">'+x[1]+'</button>').join('')+'</div>';
  if(st.tab==='floor')h+=floorView(dr);else if(st.tab==='res')h+=resView(dr);else if(st.tab==='cust')h+=customersView();else if(st.tab==='tbl')h+=tablesView();else if(st.tab==='avl')h+=hoursView();else h+=insightsView();
  return h+'</div>';
}
function floorView(dr){
  const st=S.staff,date=st.date,T=st.time;
  const svg=floorSVG(t=>{const s=tStatus(t,date,T);return{cls:s.cls,picked:st.sel===t.id,act:'stable',sub:s.sub,aria:'Table '+t.id+', seats '+t.cap+', '+s.label+(s.r?', '+s.r.name:'')};});
  const used=TABLES.filter(t=>{const c=tStatus(t,date,T).cls;return c!=='free';}).reduce((a,t)=>a+t.cap,0),pct=Math.round(used/TOTAL_SEATS*100);
  const arrivals=dr.filter(r=>['PENDING','CONFIRMED'].includes(r.status)&&r.start>=T).slice(0,4).map(r=>'<div class="item"><b>'+fmtT(r.start)+' · '+esc(r.name)+' ('+r.party+') · '+r.table+'</b><small>'+esc(r.occasion)+(r.note?' · <span class="flag">'+esc(r.note)+'</span>':'')+'</small></div>').join('')||'<p class="muted small">No more arrivals at or after '+fmtT(T)+'.</p>';
  const wl=WAIT.filter(e=>e.date===date);
  const wlH=wl.length?wl.map(e=>{const hr=RES.find(r=>r.id===e.hold);return '<div class="item"><b>'+fmtT(e.time)+' · '+esc(e.name)+' ('+e.party+')'+(e.mine?' · you':'')+'</b><small>'+({WAITING:'Waiting',OFFERED:'Offered table '+(hr?hr.table:'')+', hold <span data-hold="'+e.id+'">'+mmss(hr?hr.holdUntil-Date.now():0)+'</span>',CONFIRMED:'Booked from waitlist',EXPIRED:'Hold expired',DECLINED:'Declined'})[e.status]+'</small>'+(e.status==='OFFERED'?'<div class="acts" style="margin-top:6px"><button class="btn small" data-act="expire" data-id="'+e.id+'">Expire hold</button></div>':'')+'</div>';}).join(''):'<p class="muted small">Nobody is waiting on this date.</p>';
  let detail;
  if(st.sel){
    const t=TABLES.find(x=>x.id===st.sel),s=tStatus(t,date,T),r=s.r;
    const blocked=BLOCKED.has(date+'|'+t.id);
    detail='<div class="card"><div class="row" style="justify-content:space-between"><h3>Table '+t.id+' · seats '+t.cap+'</h3><span class="pill st-'+(s.cls==='free'?'confirmed':(s.cls==='seated'?'seated':(s.cls==='blocked'?'cancelled':'pending')))+'">'+s.label+' at '+fmtT(T)+'</span></div>'+
     (r&&r.status!=='HOLD'?'<dl class="kv" style="margin-top:12px"><dt>Guest</dt><dd>'+esc(r.name)+'</dd><dt>Time</dt><dd>'+fmtT(r.start)+' to '+fmtT(r.end)+'</dd><dt>Party</dt><dd>'+r.party+'</dd><dt>Reservation</dt><dd>'+r.ref+'</dd><dt>Occasion</dt><dd>'+esc(r.occasion)+'</dd>'+(r.note?'<dt>Dietary / request</dt><dd class="flag">'+esc(r.note)+'</dd>':'')+'<dt>Contact</dt><dd>'+esc(r.phone)+'</dd></dl>':'<p class="muted small" style="margin-top:10px">'+(r?'Held for a waitlist guest.':'No booking covers this time.')+'</p>')+
     '<div class="acts" style="margin-top:14px">'+(r&&r.status!=='HOLD'?(r.status==='PENDING'?'<button class="btn small" data-act="s-confirm" data-id="'+r.id+'">Confirm</button>':'')+(r.status!=='SEATED'?'<button class="btn small primary" data-act="s-seat" data-id="'+r.id+'">Mark seated</button>':'<button class="btn small" data-act="s-done" data-id="'+r.id+'">Mark completed</button>')+'<button class="btn small" data-act="s-noshow" data-id="'+r.id+'">No-show</button><button class="btn small" data-act="s-cancel" data-id="'+r.id+'">Cancel booking</button>':'')+
     (!r?'<button class="btn small" data-act="s-block" data-table="'+t.id+'">'+(blocked?'Unblock table':'Block table for the day')+'</button>':'')+'</div></div>';
  }else detail='<div class="card"><p class="muted">Select a table on the floor plan to see the booking and take action.</p></div>';
  return '<div class="cols staff"><div class="stack"><div class="card"><div class="row" style="justify-content:space-between"><h3>Live floor</h3></div>'+
   '<div class="sec"><span class="label">Service time</span><div class="row" role="group" aria-label="Service time">'+STIMES.map(m=>'<button type="button" class="chip" data-fk="st-'+m+'" data-act="stime" data-v="'+m+'" aria-pressed="'+(T===m)+'">'+fmtT(m)+'</button>').join('')+'</div></div>'+
   '<div class="sec">'+svg+'<div class="legend"><span><i style="background:var(--green)"></i>Available</span><span><i style="background:var(--accent)"></i>Reserved</span><span><i style="background:var(--burgundy)"></i>Seated</span><span><i style="background:var(--amber)"></i>Arriving soon / hold</span><span><i style="background:var(--grey)"></i>Blocked</span></div></div></div>'+detail+'</div>'+
   '<div class="stack"><div class="card"><h3>Next arrivals</h3><div style="margin-top:8px">'+arrivals+'</div></div><div class="card"><h3>Waitlist</h3><div style="margin-top:8px">'+wlH+'</div></div>'+
   '<div class="card"><h3>Occupancy at '+fmtT(T)+'</h3><div class="row" style="justify-content:space-between;margin-top:10px"><span class="muted small">'+used+' of '+TOTAL_SEATS+' seats taken</span><b>'+pct+'%</b></div><div class="meter" style="margin-top:8px" role="img" aria-label="'+pct+' percent occupancy"><i style="width:'+pct+'%"></i></div></div></div></div>';
}
function resView(dr){
  const st=S.staff,q=st.q.trim().toLowerCase();
  const rows=dr.filter(r=>(st.filter==='ALL'||r.status===st.filter)&&(!q||r.name.toLowerCase().includes(q)||r.ref.toLowerCase().includes(q)));
  const body=rows.map(r=>'<tr><td>'+fmtT(r.start)+'</td><td><b>'+esc(r.name)+'</b><br><span class="muted small">'+esc(r.ref)+'</span></td><td>'+r.party+'</td><td>'+r.table+'</td><td><span class="pill st-'+r.status.toLowerCase()+'">'+({PENDING:'Pending',CONFIRMED:'Confirmed',SEATED:'Seated',COMPLETED:'Completed',CANCELLED:'Cancelled',NO_SHOW:'No-show'})[r.status]+'</span></td><td class="small">'+esc(r.source)+'</td><td><div class="acts">'+
   (r.status==='PENDING'?'<button class="btn small" data-act="s-confirm" data-id="'+r.id+'">Confirm</button>':'')+(['PENDING','CONFIRMED'].includes(r.status)?'<button class="btn small" data-act="s-seat" data-id="'+r.id+'">Seat</button><button class="btn small" data-act="s-cancel" data-id="'+r.id+'">Cancel</button>':'')+'</div></td></tr>').join('')||'<tr><td colspan="7" class="muted">No reservations match.</td></tr>';
  const nf=st.newOpen?newForm():'';
  return '<div class="card"><div class="row" style="justify-content:space-between"><h3>Reservations · '+fmtD(st.date)+'</h3><button class="btn primary small" data-act="new-open">'+(st.newOpen?'Close form':'+ New reservation')+'</button></div>'+nf+
   '<div class="row" style="margin-top:14px"><div class="field" style="flex:1;min-width:180px"><label for="q">Search name or reservation number</label><input id="q" data-fk="q" value="'+esc(st.q)+'" placeholder="Search"></div><div class="field" style="min-width:160px"><label for="flt">Status</label><select id="flt" data-fk="flt"><option value="ALL">All statuses</option>'+['PENDING','CONFIRMED','SEATED','COMPLETED','CANCELLED','NO_SHOW'].map(s=>'<option value="'+s+'"'+(st.filter===s?' selected':'')+'>'+s.replace('_','-').toLowerCase().replace(/^./,c=>c.toUpperCase())+'</option>').join('')+'</select></div></div>'+
   '<div class="scroll" style="margin-top:12px"><table class="list"><thead><tr><th>Time</th><th>Guest</th><th>Party</th><th>Table</th><th>Status</th><th>Source</th><th>Actions</th></tr></thead><tbody>'+body+'</tbody></table></div></div>';
}
function newForm(){
  return '<form id="newform" class="form2" style="margin-top:14px" novalidate><div class="field"><label for="n-name">Guest name</label><input id="n-name" name="n-name" placeholder="Walk-in or phone guest"></div><div class="field"><label for="n-party">Party size</label><input id="n-party" name="n-party" type="number" min="1" max="6" value="2"></div>'+
   '<div class="field"><label for="n-time">Time</label><select id="n-time" name="n-time">'+SLOTS.map(s=>'<option value="'+s+'">'+fmtT(s)+'</option>').join('')+'</select></div><div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Save reservation</button></div>'+
   (S.staff.newErr?'<p class="err wide" role="alert" style="color:var(--burgundy);font-weight:600;grid-column:1/-1">'+esc(S.staff.newErr)+'</p>':'')+'</form>';
}
function insightsView(){
  const days=DATES.filter(d=>!d.closed),active=r=>['PENDING','CONFIRMED','SEATED','COMPLETED'].includes(r.status);
  const all=RES.filter(r=>days.some(d=>d.iso===r.date)&&active(r));
  const byS=SLOTS.map(s=>all.filter(r=>r.start===s).length),mx=Math.max(1,...byS);
  const byD=days.map(d=>({d:d.iso,n:all.filter(r=>r.date===d.iso).length})),mxd=Math.max(1,...byD.map(x=>x.n));
  const occ=(date,s)=>TABLES.filter(t=>!free(t.id,date,s,s+DUR)).reduce((a,t)=>a+t.cap,0)/TOTAL_SEATS;
  const peakOcc=Math.round(days.reduce((a,d)=>a+occ(d.iso,19*60),0)/days.length*100);
  const avgParty=all.length?(all.reduce((a,r)=>a+r.party,0)/all.length).toFixed(1):'0';
  const sugs=[];
  [18*60,19*60,19*60+30].forEach(s=>{const n=days.filter(d=>occ(d.iso,s)>=.8).length;if(n>=2&&!sugs.some(x=>x.k==='peak'))sugs.push({k:'peak',t:'<b>'+fmtT(s)+' is at least 80% booked on '+n+' of '+days.length+' open days.</b> Consider a later seating at 9:00 PM or a deposit for parties of 6 or more.'});});
  const big=all.filter(r=>(TABLES.find(t=>t.id===r.table)||{cap:0}).cap===6),small=big.filter(r=>r.party<=3);
  if(big.length>=3&&small.length/big.length>=.4)sugs.push({k:'big',t:'<b>'+small.length+' of '+big.length+' bookings at 6-seat tables are parties of 3 or fewer.</b> Offer those tables to parties of 5 or more during peak hours.'});
  const low=byD.slice().sort((a,b)=>a.n-b.n)[0];
  if(low&&low.n<mxd*.6)sugs.push({k:'low',t:'<b>'+fmtD(low.d,{weekday:'long'})+' is the quietest day with '+low.n+' bookings.</b> Promote an early seating on the homepage that day.'});
  const hb=byS.map((n,i)=>'<div class="bar'+(n===mx?' top':'')+'"><b>'+n+'</b><i style="height:'+Math.round(n/mx*140)+'px"></i><span>'+fmtT(SLOTS[i]).replace(':00','')+'</span></div>').join('');
  const db=byD.map(x=>'<div class="hbar"><span>'+fmtD(x.d,{weekday:'short'})+'</span><i style="width:'+Math.max(2,Math.round(x.n/mxd*100))+'%"></i><b>'+x.n+'</b></div>').join('');
  return '<div class="stack"><div class="kpis"><div class="kpi"><b>'+all.length+'</b><span>Bookings, next 7 days</span></div><div class="kpi"><b>'+peakOcc+'%</b><span>Average seat use at 7:00 PM</span></div><div class="kpi"><b>'+avgParty+'</b><span>Average party size</span></div><div class="kpi"><b>'+WAIT.length+'</b><span>Waitlist entries</span></div></div>'+
   '<div class="cols"><div class="card"><h3>Busiest start times</h3><p class="small muted">Bookings by start time across the next 7 days</p><div class="bars" role="img" aria-label="Bookings by start time">'+hb+'</div></div><div class="card"><h3>Bookings by day</h3><div class="stack" style="gap:10px;margin-top:14px">'+db+'</div></div></div>'+
   '<div class="card"><h3>Suggestions</h3><p class="small muted">Generated from the sample bookings in this demo</p><ul class="sugs" style="margin-top:12px">'+(sugs.length?sugs.map(s=>'<li>'+s.t+'</li>').join(''):'<li>No suggestions right now.</li>')+'</ul></div></div>';
}

/* ---------- Actions ---------- */
function releaseAndOffer(date){offer(date);}
function offer(date){
  const waiting=WAIT.filter(e=>e.date===date&&e.status==='WAITING').sort((a,b)=>a.seq-b.seq);
  for(const e of waiting){
    const c=availTables(date,e.time,e.party).sort((a,b)=>a.cap-b.cap)[0];
    if(c){const hr=addRes({date,table:c.id,start:e.time,party:e.party,name:e.name,email:e.email,phone:e.phone,status:'HOLD',source:'waitlist',holdUntil:Date.now()+15*60000});
      e.status='OFFERED';e.hold=hr.id;toast('Table '+c.id+' held for '+e.name+' for 15 minutes.');return true;}
  }
  return false;
}
function cancelRes(id,status){
  const r=RES.find(x=>x.id===id);if(!r)return;
  r.status=status||'CANCELLED';
  toast(status==='NO_SHOW'?'Marked as a no-show. The table is released.':'Booking cancelled. The table is released.');
  if(!offer(r.date)&&WAIT.some(e=>e.date===r.date&&e.status==='WAITING'))toast('Table released. No waiting party fits this slot.');
}
function expireHold(eid,status){
  const e=WAIT.find(x=>x.id===eid);if(!e)return;
  const hr=RES.find(r=>r.id===e.hold);if(hr)hr.status='CANCELLED';
  e.status=status||'EXPIRED';
  offer(e.date);
}
function validateDetails(){
  const d=S.details,e={};
  if(!d.first.trim())e.first='Enter a first name.';else if(d.first.length>50)e.first='Use 50 characters or fewer.';
  if(!d.last.trim())e.last='Enter a last name.';else if(d.last.length>50)e.last='Use 50 characters or fewer.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()))e.email='Enter a valid email address, for example name@example.com.';
  const digits=d.phone.replace(/[\s\-().+]/g,'');
  if(!/^\d{7,15}$/.test(digits))e.phone='Enter a phone number with 7 to 15 digits.';
  return e;
}
