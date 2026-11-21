/* ---------- Reserve page ---------- */
function holdBanners(){
  let h='';const w=S.myWait;
  if(w&&w.status==='OFFERED'){
    const hr=RES.find(r=>r.id===w.hold);
    h+='<section class="banner offer" role="status"><div><strong>A table opened up.</strong> Table '+esc(hr?hr.table:'')+' is held for you on '+fmtD(w.date)+' at '+fmtT(w.time)+' for '+w.party+'. Hold ends in <strong data-hold="'+w.id+'">'+mmss(hr?hr.holdUntil-Date.now():0)+'</strong>.</div><div class="row"><button class="btn primary" data-act="accept-offer" data-id="'+w.id+'">Confirm this table</button><button class="btn" data-act="decline-offer" data-id="'+w.id+'">No thanks</button></div></section>';
  }else if(w&&w.status==='WAITING'){
    const ahead=WAIT.filter(e=>e.date===w.date&&e.time===w.time&&e.status==='WAITING'&&e.seq<w.seq).length;
    h+='<section class="banner note" role="status"><div><strong>You are on the waitlist</strong> for '+fmtD(w.date)+' at '+fmtT(w.time)+' for '+w.party+'. '+ahead+(ahead===1?' party is':' parties are')+' ahead of you. We email you when a table opens.</div></section>';
  }else if(w&&(w.status==='EXPIRED'||w.status==='DECLINED')){
    h+='<section class="banner warn" role="status"><div>Your waitlist spot for '+fmtD(w.date)+' at '+fmtT(w.time)+' has ended. Pick another time below.</div></section>';
  }
  if(S.conflict)h+='<section class="banner warn" role="alert"><div><strong>Table no longer free.</strong> '+esc(S.conflict)+'</div></section>';
  return h;
}
const HC={quiet:.25,moderate:.5,busy:.85,full:.05};
function daysHTML(){
  return '<div class="days" role="group" aria-label="Choose a day">'+DATES.map(d=>{const dt=parseD(d.iso),lv=d.closed?'full':level(d.iso,19*60,Math.min(S.guests,6));
    return '<button type="button" class="day" style="--hv:'+HC[lv]+'" data-fk="d-'+d.iso+'" data-act="date" data-v="'+d.iso+'" aria-pressed="'+(S.date===d.iso)+'"'+(d.closed?' disabled':'')+' aria-label="'+esc(fmtD(d.iso,{weekday:'long',month:'long',day:'numeric'}))+(d.closed?', closed':', evening is '+LV[lv].toLowerCase())+'"><small>'+dt.toLocaleDateString('en-US',{weekday:'short'})+'</small><strong>'+dt.getDate()+'</strong><span class="heat"></span></button>';}).join('')+'</div>';
}
function readoutHTML(){
  if(S.time==null)return '<div class="readout"><b>Large party</b><span>Please call (555) 010-2030 for more than 6 guests.</span></div>';
  const lv=level(S.date,S.time,S.guests),n=availTables(S.date,S.time,S.guests).length;
  return '<div class="readout"><b>'+fmtT(S.time)+'</b><span>'+(lv==='full'?'Fully booked. Join the waitlist below.':LV[lv]+' · '+n+(n===1?' table':' tables')+' for '+S.guests)+'</span></div>';
}
function segHTML(){
  return SLOTS.map(s=>{const lv=level(S.date,s,S.guests),n=availTables(S.date,s,S.guests).length;
    return '<div class="l'+lv[0]+(s===S.time?' on':'')+'">'+(lv==='full'?'Full':n)+'<small>'+(lv==='full'?'wait':'free')+'</small></div>';}).join('');
}
function timelineHTML(){
  if(S.guests>6)return '';
  const idx=Math.max(0,SLOTS.indexOf(S.time));
  return '<div class="tl"><div class="tl-seg" id="rs-seg">'+segHTML()+'</div><input type="range" id="trange" min="0" max="'+(SLOTS.length-1)+'" step="1" value="'+idx+'" data-fk="trange" aria-label="Dinner start time" aria-valuetext="'+fmtT(SLOTS[idx])+'"><div class="tl-lbl">'+SLOTS.map(s=>'<span>'+fmtT(s).replace(':00 ','').replace(' ','')+'</span>').join('')+'</div></div>';
}
function mapInfo(){
  const best=S.matches.length?S.matches[0].t.id:null;
  return t=>{
    const m=S.matches.find(x=>x.t.id===t.id),cls=!m?'taken':(t.id===S.table?'sel':(t.id===best?'best':'free'));
    return{cls,picked:false,act:m?'table':'',pref:!!(m&&m.hits.length),sub:m?t.cap+' seats':(t.cap<S.guests?'too small':'booked'),aria:'Table '+t.id+', seats '+t.cap+', '+(m?(t.id===best?'best match, ':'')+'available'+(m.hits.length?', matches '+m.hits.join(' and '):''):'not available')};
  };
}
function mapHTML(){
  if(S.mode==='done'&&S.booking){
    const b=S.booking;
    return floorSVG(t=>{const mine=t.id===b.table&&b.status!=='CANCELLED';const open=t.cap>=b.party&&free(t.id,b.date,b.start,b.end);return{cls:mine?'sel':(open?'free':'taken'),act:'',sub:mine?'yours':(open?t.cap+' seats':'booked'),aria:'Table '+t.id+(mine?', your table':'')};});
  }
  return S.time==null?floorSVG(t=>({cls:'taken',sub:'',aria:'Table '+t.id})):floorSVG(mapInfo());
}
function legendHTML(){
  return '<div class="legend"><span><i style="background:var(--green)"></i>Available</span><span><i style="background:var(--accent)"></i>Best match / your pick</span><span><i style="border:2px dashed var(--gold);background:none;box-sizing:border-box"></i>Matches your seating wish</span><span><i style="background:#4a3f37"></i>Booked</span></div>';
}
function prefsHTML(){
  return '<div class="prefs" role="group" aria-label="Seating wishes"><span class="label">Seating wish</span>'+PREFS.map(p=>'<button type="button" class="pf" data-fk="p-'+p+'" data-act="pref" data-v="'+p+'" aria-pressed="'+S.prefs.has(p)+'">'+TAGLBL[p]+'</button>').join('')+'</div>';
}
function bookHTML(){
  if(S.mode==='party')return holdBanners()+partyHTML();
  if(S.mode==='pick')sync();
  const stepper='<div class="stepper" role="group" aria-label="Number of guests"><button type="button" data-fk="g-" data-act="gminus" aria-label="Fewer guests">−</button><output aria-live="polite">'+S.guests+(S.guests===1?' guest':' guests')+'</output><button type="button" data-fk="g+" data-act="gplus" aria-label="More guests">+</button></div>';
  return holdBanners()+'<div class="rs-title"><h2>Choose your table</h2><p>Pick a day, slide to a time, tap a table. That is all.</p></div>'+
   '<div class="rs"><div class="stack" style="gap:14px"><div class="ctl"'+(S.mode==='done'?' inert style="opacity:.5"':'')+'><div class="ctl-row">'+stepper+prefsHTML()+'</div>'+daysHTML()+'<div id="rs-readout">'+readoutHTML()+'</div>'+timelineHTML()+'</div>'+
   '<div class="mapcard"><div id="rs-map">'+mapHTML()+'</div>'+legendHTML()+'</div></div>'+
   '<aside class="panel" id="rs-panel" aria-live="polite">'+panelHTML()+'</aside></div>';
}
function refreshBook(){
  if(S.view!=='book'||S.mode==='done'){render();return;}
  sync();
  const set=(id,h)=>{const e=$(id);if(e)e.innerHTML=h;};
  set('#rs-readout',readoutHTML());set('#rs-seg',segHTML());set('#rs-map',mapHTML());set('#rs-panel',panelHTML());
  const r=$('#trange');if(r&&r.setAttribute)r.setAttribute('aria-valuetext',fmtT(S.time));
}
function refreshPanel(){const e=$('#rs-panel');if(e)e.innerHTML=panelHTML();}
function altTimes(){
  const here=availTables(S.date,S.time,S.guests).length;
  return SLOTS.filter(s=>s!==S.time).map(s=>({s,n:availTables(S.date,s,S.guests).length,lv:level(S.date,s,S.guests)})).filter(x=>x.n>here&&x.lv!=='busy'&&x.lv!=='full').sort((a,b)=>Math.abs(a.s-S.time)-Math.abs(b.s-S.time)).slice(0,2);
}
function panelHTML(){
  if(S.mode==='done')return doneHTML();
  if(S.mode==='details')return detailsHTML();
  if(S.guests>6)return '<div class="empty"><h3>Large party?</h3><p>We take parties of more than 6 by phone so we can join tables for you.</p><b>(555) 010-2030</b></div>';
  if(S.time==null)return '<div class="empty"><h3>Pick a time</h3><p>Slide the time bar to see which tables are free.</p></div>';
  if(!S.matches.length||S.waitOpen)return waitCard();
  const id=(S.hover&&S.matches.some(m=>m.t.id===S.hover))?S.hover:S.table,m=S.matches.find(x=>x.t.id===id)||S.matches[0],t=m.t;
  const preview=id!==S.table;
  const alts=altTimes();
  return '<div><span class="label">'+(preview?'Preview · tap to choose':(t.id===S.matches[0].t.id?'Best match for you':'Your pick'))+'</span><h3 style="margin-top:4px">Table '+t.id+' · '+t.zone+'</h3></div>'+
   settingSVG(t,S.guests,'')+
   '<div class="tags"><span class="tag">Seats '+t.cap+'</span>'+t.tags.map(x=>'<span class="tag'+(S.prefs.has(x)?' hit':'')+'">'+TAGLBL[x]+'</span>').join('')+'</div>'+
   '<p class="why">'+esc(reason(m))+'</p>'+
   '<div class="summary"><span><b>'+fmtD(S.date)+'</b></span><span><b>'+fmtT(S.time)+'</b></span><span><b>'+S.guests+'</b> guests</span></div>'+
   (alts.length?'<div class="alts"><span class="label">Calmer times</span>'+alts.map(a=>'<button type="button" class="alt" data-act="time" data-v="'+a.s+'"><span>'+fmtT(a.s)+'</span><b>'+a.n+' tables · '+LV[a.lv]+'</b></button>').join('')+'</div>':'')+
   '<button type="button" class="btn primary big" data-act="to-details" data-fk="reserve">Reserve table '+S.table+'</button>';
}
function waitCard(){
  const mine=S.myWait&&S.myWait.status==='WAITING'&&S.myWait.date===S.date&&S.myWait.time===S.time;
  const ahead=WAIT.filter(e=>e.date===S.date&&e.time===S.time&&e.status==='WAITING').length;
  if(mine)return '<div class="empty"><h3>You are on the waitlist</h3><p>We email you the moment a table for '+S.guests+' opens at '+fmtT(S.time)+' and hold it for 15 minutes. Open the Staff page to see your entry, or try another time.</p></div>';
  const e=S.wlErr;
  return '<div><span class="label">Fully booked</span><h3 style="margin-top:4px">Join the waitlist</h3></div><p class="why">'+fmtT(S.time)+' on '+fmtD(S.date)+' is full for '+S.guests+'. We email you if a table opens and hold it for 15 minutes.</p>'+
   '<span class="pill lvl-moderate" style="align-self:flex-start">'+ahead+(ahead===1?' party':' parties')+' waiting ahead of you</span>'+
   '<form id="wlform" class="stack" style="gap:12px" novalidate>'+fld('wl-name','Name','text',S.wl.name,e.name,'Alex Morgan')+fld('wl-email','Email','email',S.wl.email,e.email,'alex@example.com')+fld('wl-phone','Phone (optional)','tel',S.wl.phone,e.phone,'')+
   '<div class="row"><button class="btn primary" type="submit">Join waitlist</button></div></form>'+
   (altTimes().length?'<div class="alts"><span class="label">Or try</span>'+altTimes().map(a=>'<button type="button" class="alt" data-act="time" data-v="'+a.s+'"><span>'+fmtT(a.s)+'</span><b>'+a.n+' tables · '+LV[a.lv]+'</b></button>').join('')+'</div>':'<button class="btn" type="button" data-act="other-time">Show the best time</button>');
}
function fld(id,label,type,val,err,ph,extra){
  return '<div class="field'+(extra||'')+'"><label for="'+id+'">'+label+'</label><input id="'+id+'" name="'+id+'" type="'+type+'" value="'+esc(val)+'" placeholder="'+esc(ph||'')+'" '+(err?'aria-invalid="true" aria-describedby="'+id+'-e"':'')+'>'+(err?'<span class="err" id="'+id+'-e">'+esc(err)+'</span>':'')+'</div>';
}
function detailsHTML(){
  const d=S.details,e=S.errors,t=TABLES.find(x=>x.id===S.table)||{zone:''};
  return '<div><span class="label">Almost there</span><h3 style="margin-top:4px">Table '+S.table+' · '+t.zone+'</h3></div>'+
   '<div class="summary"><span><b>'+fmtD(S.date)+'</b></span><span><b>'+fmtT(S.time)+'</b></span><span><b>'+S.guests+'</b> guests</span></div>'+
   '<form id="detform" class="stack" style="gap:12px" novalidate><div class="form2">'+fld('f-first','First name','text',d.first,e.first,'')+fld('f-last','Last name','text',d.last,e.last,'')+fld('f-email','Email','email',d.email,e.email,'',' wide')+fld('f-phone','Phone','tel',d.phone,e.phone,'',' wide')+'</div>'+
   '<div class="field"><label for="f-occ">Occasion</label><select id="f-occ" data-fk="f-occ">'+OCCS.map(o=>'<option'+(S.occasion===o?' selected':'')+'>'+o+'</option>').join('')+'</select></div>'+
   '<div class="field"><label for="diet">Dietary notes (optional)</label><input id="diet" data-fk="diet" value="'+esc(S.dietary)+'" placeholder="For example: nut allergy" maxlength="120"></div>'+
   '<div class="field"><label for="f-note">Special request (optional)</label><textarea id="f-note" name="f-note" rows="2" maxlength="300" placeholder="For example: please prepare a small dessert">'+esc(d.note)+'</textarea></div>'+
   '<div class="row">'+confirmBtn()+'<button class="btn" type="button" data-act="back1">Back</button></div>'+
   '<div class="row"><button class="linkbtn small" type="button" data-act="sample">Fill sample guest</button><button class="linkbtn small" type="button" data-act="sim-conflict">Demo: another guest takes this table</button></div></form>';
}
function doneHTML(){
  const r=S.booking;if(!r)return '<div class="empty"><p>No booking yet.</p></div>';
  const cancelled=r.status==='CANCELLED',zone=(TABLES.find(t=>t.id===r.table)||{}).zone;
  let manage;
  if(cancelled)manage='<p class="banner warn">This booking is cancelled and the table has been released.</p>';
  else manage='<div class="stack" style="gap:8px"><span class="label">Manage this booking · no login needed</span><p class="small muted">In the full app this link arrives by email, with a reminder 24 hours before.</p><div class="tbtn">'+(S.attended?'<span class="pill st-confirmed">Attendance confirmed</span>':'<button class="btn small" data-act="attend">Confirm attendance</button>')+
   (S.cancelAsk?'<span class="small">Cancel this booking?</span><button class="btn small primary" data-act="cancel-yes">Yes, cancel</button><button class="btn small" data-act="cancel-no">Keep it</button>':'<button class="btn small" data-act="cancel-ask">Cancel booking</button>')+
   '<a class="btn small" style="text-decoration:none" href="'+esc(calLink(r))+'" target="_blank" rel="noopener">Add to calendar</a></div></div>';
  return '<div class="ticket'+(cancelled?' off':'')+'"><div class="t-top"><b>Terracotta Table</b><span class="small">'+(cancelled?'Cancelled':'Confirmed')+'</span></div><h3>'+esc(r.name)+'</h3>'+
   '<div class="tk"><div><small>Date</small><b>'+esc(fmtD(r.date))+'</b></div><div><small>Time</small><b>'+fmtT(r.start)+'</b></div><div><small>Guests</small><b>'+r.party+'</b></div><div><small>Table</small><b>'+r.table+' · '+esc(zone||'')+'</b></div>'+(r.note?'<div style="grid-column:1/-1"><small>Request</small><b>'+esc(r.note)+'</b></div>':'')+'</div>'+
   '<div class="cut"></div><div class="foot">'+codeSVG(r.ref)+'<div><small style="letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#7a6a58">Reservation</small><br><b>'+esc(r.ref)+'</b><br>Show this code at the door. Sample pattern for the demo.</div></div></div>'+manage+
   '<button type="button" class="btn primary" data-act="again">Make another reservation</button>';
}
function resetBooking(){S.mode='party';S.booking=null;S.attended=false;S.cancelAsk=false;S.details={first:'',last:'',email:'',phone:'',note:''};S.errors={};S.conflict='';S.table=null;S.hover=null;S.waitOpen=false;S.time=defaultTime();}

/* ---------- Party card ---------- */
const PCOL=['#8a8a8a','#8a8a8a','#8a8a8a','#8a8a8a','#8a8a8a','#8a8a8a','#8a8a8a','#8a8a8a'];
function partySVG(n,prevN){return tableTop(Math.max(Math.min(n,8),2),Math.min(n,8),false,prevN,'22 22 156 156');}
function partyHTML(){
  const n=S.guests;
  return '<div class="partywrap" id="partywrap" style="--pc:'+PCOL[Math.min(n,8)-1]+'"><div class="partycard"><div class="pc-art" id="pc-art">'+partySVG(n,n)+'</div>'+
   '<div class="pc-body"><span class="label">Table reservation</span><div class="pc-row"><b>Party of</b><div class="pstep" role="group" aria-label="Number of guests"><button type="button" data-act="gminus" data-fk="pg-" aria-label="Fewer guests">−</button><output id="pc-n" aria-live="polite">'+n+'</output><button type="button" data-act="gplus" data-fk="pg+" aria-label="More guests">+</button></div></div>'+
   '<p class="pc-note" id="pc-note">'+partyNote(n)+'</p></div></div>'+
   '<button type="button" class="btn primary big wobble" data-act="to-pick" data-fk="show">Show available tables</button>'+
   '<p class="small muted" id="pc-count">'+partyCount()+'</p></div>';
}
function partyNote(n){return n===1?'A table for one.':(n>6?'More than 6? Call (555) 010-2030 and we will join tables.':(n===2?'Intimate. Window tables suit two.':(n<=4?'We will show tables that seat '+n+' or more.':'Big table night. Booths and the patio fit best.')));}
function partyCount(){
  if(S.guests>6)return '';
  const n=SLOTS.reduce((a,s)=>Math.max(a,availTables(S.date,s,S.guests).length),0);
  return TABLES.filter(t=>t.cap>=S.guests).length+' tables seat '+S.guests+' or more · up to '+n+' open on '+fmtD(S.date);
}
function updateParty(prev){
  const w=$('#partywrap');if(!w||!w.style)return false;
  w.style.setProperty('--pc',PCOL[Math.min(S.guests,8)-1]);
  const set=(id,h)=>{const e=$(id);if(e)e.innerHTML=h;};
  set('#pc-art',partySVG(S.guests,prev));set('#pc-n',String(S.guests));set('#pc-note',partyNote(S.guests));set('#pc-count',partyCount());
  const o=$('#pc-n');if(o&&o.animate&&!REDUCED)o.animate([{transform:'scale(1.5)',opacity:.4},{transform:'none',opacity:1}],{duration:260,easing:'cubic-bezier(.3,1.6,.5,1)'});
  return true;
}
/* ---------- Confirm button ---------- */
function confirmBtn(){
  return '<button class="cbtn" id="cbtn" type="submit" data-fk="cbtn"><span class="cic"><svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="12" width="2.4" height="16" rx="1.2" fill="#fff"/><rect x="34.6" y="12" width="2.4" height="16" rx="1.2" fill="#fff"/><circle cx="20" cy="22" r="11" fill="#fff"/><circle cx="20" cy="22" r="8.2" fill="none" stroke="#00000022"/><g class="hands"><path d="M20 22V15" stroke="#1a0e09" stroke-width="2" stroke-linecap="round" class="hm"/><path d="M20 22H25" stroke="#1a0e09" stroke-width="2" stroke-linecap="round" class="hh"/></g><path class="chk" d="M14.5 22.5l4 4 7.5-8.5" fill="none" stroke="#12a05a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><g class="lid"><path d="M7 22a13 13 0 0 1 26 0z" fill="#e7c77a"/><circle cx="20" cy="8" r="2.4" fill="#e7c77a"/><path d="M12 17a9 9 0 0 1 6-4" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></svg></span><span class="clab"><span class="l1">Confirm reservation</span><span class="l2">Reservation confirmed</span></span></button>';
}
