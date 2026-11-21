/* ---------- About, Contact, Manage booking, Forgot password, footer, full menu data ---------- */
const MENU=[
 {cat:'Appetizers',items:[
  ['Charred octopus','Romesco, crushed potatoes, sorrel',18,1,'GF'],['Burrata & fire-roasted tomato','Basil oil, charred sourdough',16,0,'V'],
  ['Wild mushroom arancini','Truffle mayo, pecorino',13,0,'V'],['Beef carpaccio','Capers, rocket, aged parmesan',17,0,'GF']]},
 {cat:'Main Courses',items:[
  ['Herb-grilled pork chop','Charred lemon, rocket, cherry tomatoes',28,1,'GF'],['Garlic prawns','Chilli-garlic glaze, peanut crunch, lime, crisp greens',26,1,'N'],
  ['Thyme-roasted chicken','Honey carrots, golden potatoes, broccoli, peas',25,1,'GF'],['Dry-aged ribeye','Bone marrow butter, watercress',46,0,'GF'],
  ['Whole sea bream','Salsa verde, charred fennel',32,0,'GF'],['Mushroom & thyme pie','Buttered greens',22,0,'V']]},
 {cat:'Desserts',items:[
  ['Burnt honey cheesecake','Roasted figs, thyme crumb',11,1,'V'],['Dark chocolate pot','Sea salt, olive oil, grilled sourdough',10,0,'V'],
  ['Lemon posset','Shortbread, candied zest',9,0,'V'],['Seasonal sorbet','Three scoops, always dairy-free',8,0,'VG']]},
 {cat:'Drinks',items:[
  ['House red or white','Glass of the evening selection',12,0,''],['Charred orange negroni','Gin, bitter aperitivo, vermouth',15,1,''],
  ['Sparkling elderflower','Fresh mint, lime, soda',7,0,'VG'],['Single-origin espresso','Locally roasted',4,0,'VG']]}
];
const DIETKEY={V:'Vegetarian',VG:'Vegan',GF:'Gluten-free',N:'Contains nuts'};
function fullMenuHTML(){
  const id=c=>c.toLowerCase().replace(/[^a-z]+/g,'-');
  const secs=MENU.map(m=>'<section class="msec" id="m-'+id(m.cat)+'" aria-labelledby="h-'+id(m.cat)+'"><h3 id="h-'+id(m.cat)+'">'+esc(m.cat)+'</h3><ul class="menulist">'+m.items.map(x=>'<li class="mi'+(x[3]?' pop':'')+'"><div><b>'+esc(x[0])+'</b>'+(x[3]?'<span class="badge">Most popular</span>':'')+(x[4]?'<abbr class="diet" title="'+DIETKEY[x[4]]+'">'+x[4]+'</abbr>':'')+'<small>'+esc(x[1])+'</small></div><span class="mp">$'+x[2]+'</span></li>').join('')+'</ul></section>').join('');
  return '<section class="fullmenu" aria-labelledby="fm-h"><div class="fm-head"><h2 id="fm-h">The full <em>menu</em></h2><p>Served 5:00 to 10:00 PM, Tuesday to Sunday. Please tell your server about any allergies.</p></div>'+
   '<nav class="fm-jump" aria-label="Jump to a menu section">'+MENU.map(m=>'<a href="#m-'+id(m.cat)+'">'+esc(m.cat)+'</a>').join('')+'</nav>'+
   '<p class="fm-key small">V vegetarian · VG vegan · GF gluten-free · N contains nuts</p>'+secs+
   '<div class="cta"><h2>Hungry? Save your <em>table</em>.</h2><p>Pick your party size and see exactly which tables are free tonight.</p><button type="button" class="btn primary big" data-act="view" data-v="book">Reserve a table</button></div></section>';
}
const RINFO={name:'Terracotta Table',addr:'123 Sample Street, Ottawa, ON',phone:'613-555-0123',email:'hello@terracotta-table.example'};
function aboutHTML(){
  const ph=['starter','grill','seafood','roast'].map(k=>'<img src="'+PHOTOS[k]+'" alt="'+({starter:'Charred octopus with romesco',grill:'Herb-grilled pork chop',seafood:'Garlic prawns',roast:'Thyme-roasted chicken'})[k]+'" loading="lazy">').join('');
  return '<div class="page"><header class="pg-head"><span class="kicker">About the restaurant</span><h1>Cooking over fire, <em>sharing at the table</em></h1><p>Terracotta Table is a neighbourhood restaurant built around an open oak fire, honest ingredients and a room that feels like a friend\u2019s dining table.</p></header>'+
   '<section class="two"><div><h2>Our story</h2><p>We opened to bring people back to the table: slow evenings, shared plates and food cooked with live fire. Everything on the menu starts with a simple question. Can it be made better with smoke, salt and patience?</p><p>Our tables are set one by one, so every guest gets the seat that suits the evening, a quiet corner for two or a long table for the whole family.</p></div>'+
   '<div class="chefcard"><div class="chefmono" aria-hidden="true">EM</div><div><span class="label">Chef de cuisine</span><h3>Elena Marchetti</h3><p class="muted" style="margin:6px 0 0">Elena trained across Italy and Spain before bringing her wood-fire cooking home. She writes the menu around what the farms deliver each week.</p></div></div></section>'+
   '<section><h2>What we believe</h2><div class="three"><div class="card"><h3>Fire first</h3><p class="muted">Oak and embers do the work. Nothing is rushed.</p></div><div class="card"><h3>Local, seasonal</h3><p class="muted">We buy from nearby farms and fisheries and change the menu with the season.</p></div><div class="card"><h3>Room for everyone</h3><p class="muted">Accessible tables, vegetarian and vegan dishes, and staff who happily adapt for allergies.</p></div></div></section>'+
   '<section><h2>From the kitchen</h2><div class="gallery">'+ph+'</div></section>'+
   '<div class="cta"><h2>Come and eat with us.</h2><p>Book a table in a minute. We will keep it warm.</p><div class="row" style="justify-content:center"><button type="button" class="btn primary big" data-act="view" data-v="book">Reserve a table</button><button type="button" class="btn big" data-act="view" data-v="contact">Find us</button></div></div></div>';
}
function contactHTML(){
  const open='Tuesday to Sunday, '+fmtT(SLOTS[0])+' to 10:00 PM (last seating '+fmtT(SLOTS[SLOTS.length-1])+')';
  const map='<svg class="mapsvg" viewBox="0 0 400 260" role="img" aria-label="Simple map showing the restaurant on the corner of two streets"><rect width="400" height="260" fill="var(--beige)"/><g stroke="var(--line)" stroke-width="14" stroke-linecap="round"><path d="M0 70H400M0 190H400M110 0V260M290 0V260"/></g><g fill="var(--surface)" opacity=".9"><rect x="130" y="86" width="140" height="88" rx="8"/><rect x="20" y="86" width="74" height="88" rx="8"/><rect x="306" y="86" width="76" height="88" rx="8"/></g><path d="M200 130c-14-18-24-28-24-40a24 24 0 0 1 48 0c0 12-10 22-24 40z" fill="var(--accent)" transform="translate(0 -4)"/><circle cx="200" cy="86" r="8" fill="var(--on-accent)"/></svg>';
  return '<div class="page"><header class="pg-head"><span class="kicker">Contact and location</span><h1>Find <em>us</em></h1></header><section class="two"><div class="card"><h3>Visit</h3><p style="margin:6px 0">'+esc(RINFO.addr)+'</p><p class="muted small" style="margin:0">Sample address for the prototype.</p>'+
   '<h3 style="margin-top:18px">Opening hours</h3><p style="margin:6px 0">'+esc(open)+'</p><p class="muted small" style="margin:0">Closed Mondays.</p>'+
   '<h3 style="margin-top:18px">Get in touch</h3><p style="margin:6px 0"><b>Phone</b> '+esc(RINFO.phone)+'</p><p style="margin:0"><b>Email</b> '+esc(RINFO.email)+'</p>'+
   '<p style="margin:16px 0 0"><a class="btn small" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.openstreetmap.org/search?query='+encodeURIComponent(RINFO.addr)+'">Open in maps</a></p></div><div class="card mapcard">'+map+'</div></section>'+
   '<div class="cta"><h2>Parties larger than 8?</h2><p>Call us and we will arrange the room.</p><button type="button" class="btn primary big" data-act="view" data-v="book">Reserve a table</button></div></div>';
}
S.manage={ref:'',email:'',err:''};S.forgot={email:'',err:'',sent:false};
function manageHTML(){
  const m=S.manage;
  return '<div class="login card"><div><span class="label">Manage a booking</span><h2 style="margin-top:4px">Find your reservation</h2><p class="muted small" style="margin:6px 0 0">No account needed. Enter the reservation number from your confirmation and the email you booked with.</p></div>'+
   '<form id="manageform" class="stack" style="gap:12px" novalidate><div class="field"><label for="m-ref">Reservation number</label><input id="m-ref" data-fk="m-ref" name="m-ref" placeholder="TE-20261107-0123" value="'+esc(m.ref)+'"'+(m.err?' aria-invalid="true" aria-describedby="m-err"':'')+'></div>'+
   '<div class="field"><label for="m-email">Email</label><input id="m-email" data-fk="m-email" name="m-email" type="email" value="'+esc(m.email)+'"'+(m.err?' aria-invalid="true"':'')+'></div>'+
   (m.err?'<p class="err" id="m-err" role="alert" style="color:var(--burgundy);font-weight:600;margin:0">'+esc(m.err)+'</p>':'')+'<button class="btn primary big" type="submit" data-fk="m-go">Find my booking</button></form></div>';
}
function doManage(){
  const m=S.manage,ref=m.ref.trim().toUpperCase(),em=m.email.trim().toLowerCase();
  if(!ref||!em){m.err='Enter your reservation number and email.';return false;}
  const r=RES.find(x=>x.ref.toUpperCase()===ref&&(x.email||'').toLowerCase()===em);
  if(!r){m.err='No reservation matches that number and email. Check them and try again.';return false;}
  m.err='';S.booking=r;S.mode='done';S.view='book';S.attended=false;S.cancelAsk=false;window.scrollTo({top:0});return true;
}
function forgotHTML(){
  const f=S.forgot;
  if(f.sent)return '<div class="login card" role="status"><span class="label">Check your email</span><h2>Reset link sent</h2><p class="muted" style="margin:0">If an account exists for <b>'+esc(f.email)+'</b>, we have sent a link to choose a new password. It works for 30 minutes.</p><button type="button" class="btn primary" data-act="view" data-v="login" data-fk="fg-back">Back to sign in</button></div>';
  return '<div class="login card"><div><span class="label">Forgot your password?</span><h2 style="margin-top:4px">Reset it by email</h2><p class="muted small" style="margin:6px 0 0">Enter the email you signed up with and we will send a reset link.</p></div><form id="forgotform" class="stack" style="gap:12px" novalidate><div class="field"><label for="f-mail">Email</label><input id="f-mail" data-fk="f-mail" name="f-mail" type="email" value="'+esc(f.email)+'"'+(f.err?' aria-invalid="true" aria-describedby="f-err"':'')+'></div>'+(f.err?'<p class="err" id="f-err" role="alert" style="color:var(--burgundy);font-weight:600;margin:0">'+esc(f.err)+'</p>':'')+'<button class="btn primary big" type="submit" data-fk="fg-go">Send reset link</button></form></div>';
}
function footerHTML(){
  return '<footer class="foot2"><div class="foot-grid">'
   +'<div class="foot-col"><p class="foot-brand">'+RINFO.name+'</p><p class="foot-tag">Book your table online.</p></div>'
   +'<div class="foot-col"><p class="foot-h">Visit</p><p>'+esc(RINFO.addr)+'</p><p>'+esc(RINFO.phone)+'</p></div>'
   +'<div class="foot-col"><p class="foot-h">Hours</p><p>Tuesday to Sunday</p><p>'+fmtT(SLOTS[0])+' to 10:00 PM</p><p class="muted">Closed Mondays</p></div>'
   +'</div><div class="foot-base"><span>\u00a9 2026 '+RINFO.name+'</span><span>Reservations powered by TableEase</span></div></footer>';
}
/* Customers: update contact details (UC-10) */
function saveContact(key,fd){
  const email=(fd.get('c-email')||'').trim(),phone=(fd.get('c-phone')||'').trim(),digits=phone.replace(/\D/g,'');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return 'Enter a valid email address.';
  if(phone&&(digits.length<7||digits.length>15))return 'Enter a valid phone number.';
  const c=customersAgg().find(x=>x.key===key);if(!c)return 'Customer not found.';
  c.list.forEach(r=>{r.email=email;r.phone=phone;});
  S.staff.cust=(email||c.name).toLowerCase()+'|'+c.name.toLowerCase();S.staff.cmsg='Contact details saved for '+c.name+'.';return '';
}
