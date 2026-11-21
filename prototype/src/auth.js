/* ---------- Sign in, roles and customer management (prototype of the Django auth + /api/customers/) ---------- */
const ACCOUNTS=[{u:'staff',p:'staffpass123',role:'staff',name:'Staff'},{u:'guest',p:'guestpass123',role:'customer',name:'Alex Morgan',first:'Alex',last:'Morgan',email:'guest@tableease.test'}];
S.user=null;S.login={u:'',p:'',err:''};S.staff.cq='';S.staff.cust=null;
function loginHTML(){
  const l=S.login;
  return '<div class="login card"><div><span class="label">Welcome back</span><h2 style="margin-top:4px">Sign in</h2><p class="muted small" style="margin:6px 0 0">Guests sign in to book faster. Staff sign in to manage the restaurant.</p></div>'+
   '<form id="loginform" class="stack" style="gap:12px" novalidate>'+
   '<div class="field"><label for="l-user">Username</label><input id="l-user" data-fk="l-user" name="l-user" autocomplete="username" value="'+esc(l.u)+'"'+(l.err?' aria-invalid="true" aria-describedby="l-err"':'')+'></div>'+
   '<div class="field"><label for="l-pass">Password</label><input id="l-pass" data-fk="l-pass" name="l-pass" type="password" autocomplete="current-password" value="'+esc(l.p)+'"'+(l.err?' aria-invalid="true"':'')+'></div>'+
   (l.err?'<p class="err" id="l-err" role="alert" style="color:var(--burgundy);font-weight:600;margin:0">'+esc(l.err)+'</p>':'')+
   '<button class="btn primary big" type="submit" data-fk="l-go">Sign in</button></form><p class="muted small" style="margin:0"><button type="button" class="linkbtn" data-act="to-forgot" data-fk="to-forgot">Forgot password?</button></p>'+
   '<p class="muted small" style="margin:0">Booked without an account? <button type="button" class="linkbtn" data-act="view" data-v="manage" data-fk="to-manage">Manage a booking</button></p>'+'<p class="muted small" style="margin:0">New here? <button type="button" class="linkbtn" data-act="view" data-v="signup" data-fk="to-signup">Create an account</button></p><div class="demoacc"><span class="label">Demo accounts</span><div class="row"><button type="button" class="chip" data-act="fill-demo" data-v="staff" data-fk="d-staff">Staff account</button><button type="button" class="chip" data-act="fill-demo" data-v="guest" data-fk="d-guest">Guest account</button></div><p class="muted small" style="margin:6px 0 0">Same accounts as the Django backend seed command. Press a button to fill the form.</p></div></div>';
}
function lockedHTML(){
  const out=!S.user;
  return '<div class="login card" role="alert"><span class="label">'+(out?'Sign in required':'Staff only')+'</span><h2>'+(out?'The staff area is private':'Your account cannot open this page')+'</h2>'+
   '<p class="muted" style="margin:0">'+(out?'Sign in with a staff account to see the live floor, reservations, customers and insights.':'You are signed in as a guest ('+esc(S.user.name)+'). Staff pages need a staff account.')+'</p>'+
   '<div class="row"><button type="button" class="btn primary" data-act="'+(out?'view':'logout')+'" data-v="login" data-fk="lk-go">'+(out?'Sign in':'Sign in as staff')+'</button><button type="button" class="btn" data-act="view" data-v="book" data-fk="lk-book">Back to reserving</button></div></div>';
}
function customersAgg(){
  const m={};
  RES.forEach(r=>{if(r.status==='HOLD')return;const k=(r.email||r.name).toLowerCase()+'|'+r.name.toLowerCase();
    const c=m[k]||(m[k]={name:r.name,email:r.email,phone:r.phone,list:[]});c.list.push(r);if(r.email)c.email=r.email;if(r.phone)c.phone=r.phone;});
  const today=iso(new Date());
  return Object.keys(m).map(k=>{const c=m[k],l=c.list.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start);
    const up=l.filter(r=>['PENDING','CONFIRMED'].includes(r.status)&&r.date>=today);
    return{key:k,name:c.name,email:c.email,phone:c.phone,list:l,total:l.length,
      cancelled:l.filter(r=>r.status==='CANCELLED').length,noshow:l.filter(r=>r.status==='NO_SHOW').length,
      completed:l.filter(r=>r.status==='COMPLETED').length,next:up[0],notes:Array.from(new Set(l.map(r=>r.note).filter(Boolean)))};
  }).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
}
function customersView(){
  const st=S.staff,q=st.cq.trim().toLowerCase();
  const all=customersAgg(),rows=all.filter(c=>!q||c.name.toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q));
  const body=rows.slice(0,60).map(c=>'<tr><td><b>'+esc(c.name)+'</b>'+(c.notes.length?'<br><span class="flag small">'+esc(c.notes[0])+'</span>':'')+'</td><td class="small">'+esc(c.email||'No email')+'<br>'+esc(c.phone||'')+'</td><td>'+c.total+'</td><td>'+(c.next?fmtD(c.next.date)+', '+fmtT(c.next.start):'<span class="muted">None</span>')+'</td><td>'+c.cancelled+'</td><td>'+c.noshow+'</td><td><button type="button" class="btn small" data-act="cust" data-v="'+esc(c.key)+'" data-fk="c-'+esc(c.key)+'">History</button></td></tr>').join('')||'<tr><td colspan="7" class="muted">No customers match.</td></tr>';
  let detail='';
  const sel=st.cust&&all.find(c=>c.key===st.cust);
  if(sel){detail='<div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><h3>'+esc(sel.name)+'</h3><button type="button" class="btn small" data-act="cust" data-v="" data-fk="c-close">Close</button></div><p class="muted small" style="margin:4px 0 10px">'+esc(sel.email||'No email')+(sel.phone?' · '+esc(sel.phone):'')+' · '+sel.total+' bookings</p>'+
    '<form id="cedit" class="form2" style="margin:0 0 14px" novalidate><div class="field"><label for="c-email">Email</label><input id="c-email" name="c-email" type="email" value="'+esc(st.cdraft?st.cdraft.email:(sel.email||''))+'"></div><div class="field"><label for="c-phone">Phone</label><input id="c-phone" name="c-phone" type="tel" value="'+esc(st.cdraft?st.cdraft.phone:(sel.phone||''))+'"></div><div class="field" style="justify-content:flex-end"><button class="btn small primary" type="submit" data-fk="c-save">Save contact details</button></div></form>'+(st.cerr?'<p class="err" role="alert" style="color:var(--burgundy);font-weight:600">'+esc(st.cerr)+'</p>':'')+(st.cmsg?'<p class="okmsg" role="status">'+esc(st.cmsg)+'</p>':'')+'<ul class="hist" style="list-style:none;margin:0;padding:0;display:grid;gap:6px">'+sel.list.map(r=>'<li class="item"><b>'+fmtD(r.date)+' · '+fmtT(r.start)+' · table '+r.table+' · party of '+r.party+'</b><small>'+esc(r.ref)+' · '+r.status.replace('_','-').toLowerCase()+(r.note?' · '+esc(r.note):'')+'</small></li>').join('')+'</ul></div>';}
  return '<div class="card"><div class="row" style="justify-content:space-between"><h3>Customers</h3><span class="muted small">'+all.length+' guests on record</span></div>'+
   '<div class="field" style="margin-top:12px;max-width:420px"><label for="cq">Search name or email</label><input id="cq" data-fk="cq" value="'+esc(st.cq)+'" placeholder="Search"></div>'+
   '<div class="scroll" style="margin-top:12px"><table class="list"><thead><tr><th>Guest</th><th>Contact</th><th>Bookings</th><th>Next booking</th><th>Cancelled</th><th>No-shows</th><th></th></tr></thead><tbody>'+body+'</tbody></table></div>'+(rows.length>60?'<p class="muted small">Showing the first 60 of '+rows.length+'. Narrow the search to see others.</p>':'')+detail+'</div>';
}
function prefillFromUser(){
  const u=S.user;if(!u||u.role!=='customer')return;
  const d=S.details;if(!d.first&&!d.email){d.first=u.first;d.last=u.last;d.email=u.email;}
}
function doLogin(){
  const l=S.login,u=l.u.trim(),a=ACCOUNTS.find(x=>(x.u===u||(x.email&&x.email.toLowerCase()===u.toLowerCase()))&&x.p===l.p);
  if(!u||!l.p){l.err='Enter your username and password.';return false;}
  if(!a){l.err='Incorrect username or password.';return false;}
  S.user=a;l.err='';l.p='';S.view=a.role==='staff'?'staff':'book';window.scrollTo({top:0});toast('Signed in as '+a.name+'.');return true;
}
