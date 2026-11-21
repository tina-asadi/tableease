/* ---------- Menu page: coverflow carousel and the content that follows it ---------- */
const sun='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></g></svg>';
const moon='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>';
function offset(i){let d=((i-S.dish)%N+N)%N;if(d>Math.floor(N/2))d-=N;return d;}
function infoHTML(i){
  const d=DISHES[i];
  return '<span class="kicker">'+esc(d.cat)+' · '+esc(d.tag)+'</span><h1 class="dish-name">'+esc(d.name)+'<em>'+esc(d.em)+'</em></h1><p class="dish-desc">'+esc(d.desc)+'</p><div class="dish-meta"><span class="price">$'+d.price+'</span><button type="button" class="btn primary" data-act="view" data-v="book" data-fk="cta-book">Reserve a table</button></div>';
}
function followHTML(i){
  const d=DISHES[i];
  const items=d.items.map(x=>'<li class="mi'+(x[3]?' pop':'')+'"><div><b>'+esc(x[0])+'</b>'+(x[3]?'<span class="badge">Most popular</span>':'')+'<small>'+esc(x[1])+'</small></div><span class="mp">$'+x[2]+'</span></li>').join('');
  const steps=d.steps.map((s,k)=>'<li><i aria-hidden="true"></i><div class="jcard"><div class="jt"><b>'+esc(s[0])+'</b><span>Step '+(k+1)+'</span></div><p>'+esc(s[1])+'</p></div></li>').join('');
  return '<section class="stmt"><p>'+esc(d.story)+'</p></section>'+
   '<section class="sect"><div class="sect-h"><h2>The <em>'+esc(d.cat.toLowerCase())+'</em> menu</h2><p>Served 5:00 to 10:00 PM, Tuesday to Sunday</p></div><ul class="menulist">'+items+'</ul><p class="pair"><b>Pairs with</b> '+esc(d.pair)+'</p></section>'+
   '<section class="sect"><div class="sect-h"><h2>How it <em>gets to you</em></h2><p>The journey of '+esc(d.name.trim()+' '+d.em)+'</p></div><ol class="journey">'+steps+'</ol></section>'+
   '<section class="cta"><h2>Hungry? Save your <em>table</em>.</h2><p>Pick your party size and see exactly which tables are free tonight.</p><button type="button" class="btn primary big" data-act="view" data-v="book">Reserve a table</button></section>';
}
function menuHTML(){
  const items=DISHES.map((d,i)=>{const o=offset(i);
    return '<button type="button" class="cf-item" data-act="dish" data-v="'+i+'" data-fk="cf-'+i+'" style="--d:'+o+';--a:'+Math.abs(o)+'" aria-label="'+esc(d.cat+': '+d.name+d.em)+'" aria-current="'+(i===S.dish)+'"><span class="cf-bezel"><span class="cf-plate">'+plateArt(i)+'</span></span></button>';}).join('');
  const tabs=DISHES.map((d,i)=>'<button type="button" role="tab" class="cf-tab" data-act="dish" data-v="'+i+'" data-fk="tab-'+i+'" aria-selected="'+(i===S.dish)+'">'+esc(d.cat)+'</button>').join('');
  return '<section class="mh" id="hero" style="--glow:'+DISHES[S.dish].glow+'" aria-roledescription="carousel" aria-label="Most popular and must-try dishes">'+
   '<div class="mh-left"><span class="kicker">Most popular · must try</span>'+
   '<div class="cflow" id="cflow"><div class="cf-glow"></div>'+items+'</div>'+
   '<div class="cf-ctl"><button type="button" class="arrow" data-act="prev" data-fk="prev" aria-label="Previous dish">←</button><div class="cf-tabs" role="tablist" aria-label="Choose a dish">'+tabs+'</div><button type="button" class="arrow" data-act="next" data-fk="next" aria-label="Next dish">→</button></div></div>'+
   '<div class="cf-info" id="cf-info" aria-live="polite">'+infoHTML(S.dish)+'</div></section>'+
   fullMenuHTML();
}
let AUTO=null;
function schedule(){
  clearTimeout(AUTO);AUTO=null;
  if(!S.auto||REDUCED||S.view!=='home')return;
  AUTO=setTimeout(function(){if((S.view==='home'||S.view==='menu')&&!document.hidden)slide(1);else schedule();},6500);
}
function restartProg(){
  const p=$('#h-prog');if(!p||!p.style)return;
  if(!S.auto||REDUCED){p.style.animation='none';p.style.transform='scaleX(0)';return;}
  p.style.animation='none';p.style.transform='';void p.offsetWidth;p.style.animation='';
}
function slide(delta){S.spin+=delta;(S.view==='menu'?applyMenu:applyOrbit)(delta);}
function gotoDish(k){const d=offset(k);if(d===0)return;S.spin+=d;(S.view==='menu'?applyMenu:applyOrbit)(d);}
function applyMenu(delta){
  S.dish=((S.spin%N)+N)%N;
  const hero=$('#hero');
  if(!hero||!hero.style){schedule();return;}
  $('#app').style.setProperty('--glow',DISHES[S.dish].glow);applyTint();
  document.querySelectorAll('.cf-item').forEach(el=>{
    const i=+el.dataset.v,o=offset(i),prev=+el.style.getPropertyValue('--d');
    const jump=Math.abs(o-prev)>2;
    if(jump)el.classList.add('jump');
    el.style.setProperty('--d',o);el.style.setProperty('--a',Math.abs(o));el.setAttribute('aria-current',String(i===S.dish));
    if(jump){void el.offsetWidth;el.classList.remove('jump');}
  });
  document.querySelectorAll('.cf-tab').forEach(b=>b.setAttribute('aria-selected',String(+b.dataset.v===S.dish)));
  const info=$('#cf-info');
  if(info)info.innerHTML=infoHTML(S.dish);
  if(!REDUCED){
    [info].forEach((e,n)=>{if(e&&e.animate)e.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:560,delay:n*70,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});});
  }
  restartProg();schedule();
}
/* ---------- Theme ---------- */
function applyTheme(){document.documentElement.setAttribute('data-theme',S.theme);try{applyTint();}catch(e){}try{localStorage.setItem('te-theme',S.theme);}catch(e){}}
(function(){
  let t=null;try{t=localStorage.getItem('te-theme');}catch(e){}
  if(t!=='light'&&t!=='dark')t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';
  S.theme=t;document.documentElement.setAttribute('data-theme',t);
})();
