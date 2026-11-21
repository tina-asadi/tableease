/* ---------- Landing: orbit slider (original) ---------- */
function bestTonight(){
  let best=null,bn=-1;SLOTS.forEach(s=>{const n=availTables(firstOpen,s,2).length;if(n>bn){bn=n;best=s;}});
  return{t:best,n:bn};
}
function dishCopy(i){const d=DISHES[i];return{cat:d.cat,name:esc(d.name)+'<em>'+esc(d.em)+'</em>',desc:esc(d.desc),price:'$'+d.price,note:d.note};}
function homeHTML(){
  const d=DISHES[S.dish],c=dishCopy(S.dish),b=bestTonight();
  const labels=DISHES.map((x,k)=>'<button type="button" class="olabel" style="--k:'+k+'" data-act="dish" data-v="'+k+'" data-fk="ol-'+k+'" aria-current="'+(k===S.dish)+'">'+esc(x.cat)+'</button>').join('');
  return '<section class="hero" id="hero" aria-roledescription="carousel" aria-label="Menu highlights" style="--glow:'+d.glow+'">'+
   '<div class="copy"><div class="tonight"><i></i><span>Next open evening <b>'+fmtD(firstOpen)+'</b> · <b>'+b.n+' tables</b> free at '+fmtT(b.t)+'</span></div>'+
   '<div class="kicker" id="h-cat">'+esc(c.cat)+'</div>'+
   '<h1 class="dish-name" id="h-name">'+c.name+'</h1>'+
   '<p class="dish-desc" id="h-desc" aria-live="polite">'+c.desc+'</p>'+
   '<div class="dish-meta"><span class="price" id="h-price">'+c.price+'<small id="h-note">'+esc(c.note)+'</small></span></div>'+
   '<div class="cta-row"><button type="button" class="btn primary big" data-act="view" data-v="book" data-fk="cta-book">Reserve a table</button><button type="button" class="btn big" data-act="view" data-v="menu" data-fk="cta-menu">View the menu</button></div>'+
   '<div class="slider-ctl"><button type="button" class="arrow" data-act="prev" data-fk="prev" aria-label="Previous dish">←</button><div class="dots" id="h-dots">'+DISHES.map((x,k)=>'<button type="button" data-act="dish" data-v="'+k+'" data-fk="dot-'+k+'" aria-label="Show '+esc(x.cat)+'" aria-current="'+(k===S.dish)+'"></button>').join('')+'</div><button type="button" class="arrow" data-act="next" data-fk="next" aria-label="Next dish">→</button><button type="button" class="arrow" data-act="autoplay" data-fk="auto" id="h-auto" aria-label="'+(S.auto?'Pause':'Play')+' automatic slideshow">'+(S.auto?'❚❚':'▶')+'</button></div>'+
   '<div class="prog" aria-hidden="true"><i id="h-prog"'+(S.auto&&!REDUCED?'':' style="animation:none;transform:scaleX(0)"')+'></i></div>'+
   '<div class="chef">'+chefSVG()+'<div><small>Chef de cuisine</small><b>Elena Marchetti</b></div></div></div>'+
   '<div class="stage" id="stage"><div class="orbit" style="--step:'+(360/N)+'deg"><div class="pedestal"></div><div class="ring" id="ring" style="--spin:'+S.spin+'">'+labels+'</div>'+
   '<div class="plates" id="plates"><div class="plate">'+plateArt(S.dish)+'</div></div></div></div></section>';
}
function applyOrbit(delta){
  S.dish=((S.spin%N)+N)%N;
  const hero=$('#hero');
  if(!hero||!hero.style){schedule();return;}
  const d=DISHES[S.dish],c=dishCopy(S.dish);
  hero.style.setProperty('--glow',d.glow);applyTint();
  const ring=$('#ring');if(ring)ring.style.setProperty('--spin',S.spin);
  document.querySelectorAll('.olabel').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.v===S.dish)));
  document.querySelectorAll('#h-dots button').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.v===S.dish)));
  const set=(id,h)=>{const e=$(id);if(e)e.innerHTML=h;};
  set('#h-cat',esc(c.cat));set('#h-name',c.name);set('#h-desc',c.desc);set('#h-price',c.price+'<small id="h-note">'+esc(c.note)+'</small>');
  if(!REDUCED)['#h-cat','#h-name','#h-desc','#h-price'].forEach((id,n)=>{const e=$(id);if(e&&e.animate)e.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:620,delay:n*60,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});});
  const box=$('#plates');
  if(box){
    const olds=box.querySelectorAll('.plate');olds.forEach((p,n)=>{if(n<olds.length-1)p.remove();});
    const old=box.querySelector('.plate'),nw=document.createElement('div');
    nw.className='plate';nw.innerHTML=plateArt(S.dish);box.appendChild(nw);
    const dir=delta>=0?1:-1;
    if(!REDUCED&&nw.animate){
      nw.animate([{transform:'rotate('+(dir*70)+'deg) scale(.5)',opacity:0},{transform:'rotate(0deg) scale(1)',opacity:1}],{duration:950,easing:'cubic-bezier(.2,.8,.2,1)'});
      if(old&&old.animate){const a=old.animate([{transform:'rotate(0deg) scale(1)',opacity:1},{transform:'rotate('+(dir*-70)+'deg) scale(.5)',opacity:0}],{duration:650,easing:'ease-in',fill:'forwards'});a.onfinish=()=>old.remove();}
      else if(old)old.remove();
    }else if(old)old.remove();
  }
  restartProg();schedule();
}
