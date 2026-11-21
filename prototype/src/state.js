/* ---------- State ---------- */
const S={theme:'dark',view:'home',dish:0,spin:0,auto:true,
  mode:'party',guests:4,date:firstOpen,time:null,occasion:'Just dining',prefs:new Set(['window']),dietary:'',table:null,hover:null,matches:[],
  details:{first:'',last:'',email:'',phone:'',note:''},errors:{},booking:null,conflict:'',cancelAsk:false,attended:false,
  waitOpen:false,wl:{name:'',email:'',phone:''},wlErr:{},myWait:null,
  staff:{tab:'floor',date:firstOpen,time:19*60,sel:null,q:'',filter:'ALL',newOpen:false,newErr:''}};
function defaultTime(){
  if(S.guests>6)return null;
  let best=null,bn=0;
  SLOTS.forEach(s=>{const n=availTables(S.date,s,S.guests).length;if(n>bn){bn=n;best=s;}});
  return best;
}
S.time=defaultTime();
const REDUCED=!!(typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>{t.hidden=true;},3800);}
function sync(){
  if(S.time==null){S.matches=[];return;}
  S.matches=match();
  if(S.matches.length&&!S.matches.some(m=>m.t.id===S.table))S.table=S.matches[0].t.id;
  if(!S.matches.length)S.table=null;
}

/* ---------- Floor plan with chairs ---------- */
function floorSVG(info){
  let g='<rect class="zone" x="16" y="16" width="262" height="196" rx="14"/><text class="zl" x="30" y="36">WINDOW</text>'+
   '<rect class="zone" x="296" y="16" width="328" height="196" rx="14"/><text class="zl" x="310" y="36">MAIN HALL</text>'+
   '<rect class="zone" x="16" y="232" width="608" height="196" rx="14"/><text class="zl" x="30" y="252">PATIO</text>';
  TABLES.forEach(t=>{
    const i=info(t),r=t.cap===2?24:(t.cap===4?30:38),sq=t.zone==='Patio',cd=(sq?r*1.22:r)+11;
    let ch='';
    for(let k=0;k<t.cap;k++){const a=k/t.cap*6.2832+(t.cap===2?0:.4);ch+='<rect class="chair" x="-6.5" y="-4.5" width="13" height="9" rx="3.5" transform="translate('+(t.x+Math.cos(a)*cd).toFixed(1)+' '+(t.y+Math.sin(a)*cd).toFixed(1)+') rotate('+(a*57.296+90).toFixed(1)+')"/>';}
    const shape=sq?'<rect class="shape" x="'+(t.x-r)+'" y="'+(t.y-r)+'" width="'+(2*r)+'" height="'+(2*r)+'" rx="7"/>':'<circle class="shape" cx="'+t.x+'" cy="'+t.y+'" r="'+r+'"/>';
    g+='<g class="tb '+i.cls+(i.picked?' picked':'')+(i.pref?' pref':'')+'" data-act="'+(i.act||'')+'" data-table="'+t.id+'" '+(i.act?'tabindex="0" role="button"':'role="img"')+' aria-label="'+esc(i.aria)+'">'+
      '<circle class="halo" cx="'+t.x+'" cy="'+t.y+'" r="'+(cd+10)+'"/>'+ch+shape+
      '<text class="t1" x="'+t.x+'" y="'+(t.y-2)+'">'+t.id+'</text><text class="t2" x="'+t.x+'" y="'+(t.y+11)+'">'+esc(i.sub)+'</text></g>';
  });
  return '<svg class="floor" viewBox="0 0 640 444" role="group" aria-label="Restaurant floor plan">'+g+'</svg>';
}

/* ---------- Top navigation ---------- */
function navHTML(){
  return '<header class="top"><div class="brand"><b>Terracotta Table</b><span>Reservations powered by TableEase</span></div>'+
   '<div class="navr"><nav class="seg" aria-label="Choose a page">'+[['home','Home'],['about','About'],['menu','Menu'],['contact','Contact'],['book','Reserve']].concat(S.user&&S.user.role==='staff'?[['staff','Staff']]:[]).concat(S.user&&S.user.role==='customer'?[['account','My bookings']]:[]).map(x=>'<button type="button" data-act="view" data-v="'+x[0]+'" data-fk="nav-'+x[0]+'" aria-pressed="'+(S.view===x[0])+'">'+x[1]+'</button>').join('')+'</nav>'+(S.user?'<button type="button" class="btn small signbtn" data-act="logout" data-fk="signout" title="Sign out">'+esc(S.user.name)+' · Sign out</button>':'<button type="button" class="btn small signbtn" data-act="view" data-v="login" data-fk="signin">Sign in</button>')+'<button type="button" class="themebtn" data-act="theme" data-fk="theme" aria-label="Switch to '+(S.theme==='light'?'dark':'light')+' mode" title="'+(S.theme==='light'?'Dark':'Light')+' mode">'+(S.theme==='light'?moon:sun)+'</button></div></header>';
}
const GUIDE='<details class="guide"><summary>Demo walkthrough</summary><ol>'+
 '<li>Menu: swipe, drag, use the arrow keys or tap a category on the orbit. The plate changes with each dish.</li>'+
 '<li>Reserve: pick a day, drag the time bar (colour shows how busy each time is), then tap a table on the map.</li>'+
 '<li>Gold dashed rings show tables that match your seating preferences. Hover a table to preview it.</li>'+
 '<li>Pick a full time to join the waitlist, then open Staff, cancel a booking on that date, and the first waiting party gets a 15 minute hold.</li>'+
 '<li>Sign in (top right): staff / staffpass123 opens the Staff area, guest / guestpass123 is a normal guest and is blocked from Staff.</li><li>Staff has the live floor, the reservations list, customers and insights built from the same bookings.</li></ol>'+
 '<p class="small muted" style="margin-top:8px">Front-end prototype with sample data. Nothing is saved or emailed and it resets when the page reloads.</p></details>';
