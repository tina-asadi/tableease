/* ---------- Dishes and procedural plate art ---------- */
const DISHES=[
 {cat:'Starters',ac:'#ff6b57',al:'#d23a26',name:'Charred octopus ',em:'with romesco',desc:'Tender octopus charred over embers, smoky red pepper romesco, crisp crushed potatoes and sorrel.',price:18,glow:'#8f3d2e',note:'Chef\u2019s pick',photo:'starter'},
 {cat:'Grill',ac:'#ff9a3c',al:'#b45309',name:'Herb-grilled ',em:'pork chop',desc:'Thick-cut chop grilled over oak, with charred lemon, blistered cherry tomatoes and peppery rocket.',price:28,glow:'#8a5a30',note:'From the open fire',photo:'grill'},
 {cat:'Seafood',ac:'#2ec4b6',al:'#0b7a70',name:'Garlic prawns ',em:'with peanut crunch',desc:'Prawns in a chilli-garlic glaze, crushed peanuts, spring onion, crisp greens and fresh lime.',price:26,glow:'#98772c',note:'Guest favourite',photo:'seafood'},
 {cat:'Roasts',ac:'#8bd450',al:'#3f7d14',name:'Thyme-roasted ',em:'chicken',desc:'Free-range chicken roasted until the skin crackles, with honey carrots, golden potatoes, broccoli and peas.',price:25,glow:'#9a5a2a',note:'Sunday-style supper',photo:'roast'}];
const N=DISHES.length;
function plateArt(i){const d=DISHES[i];return '<img src="'+PHOTOS[d.photo]+'" alt="'+esc(d.name+d.em)+'" draggable="false">';}
function chefSVG(){return '<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="21" fill="#241a14" stroke="#e7c77a" stroke-opacity=".6"/><text x="22" y="27" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-size="15" font-style="italic" fill="#e7c77a">EM</text></svg>';}

/* realistic table top: wood, linen, ceramic, glass, candle; one setting per guest */
function tableTop(cap,filled,square,newFrom,vb){
  const R=cap<=2?34:(cap<=4?42:50),cx=100,cy=100;let s='';
  const tw=square?'<rect x="'+(cx-R-6)+'" y="'+(cy-R*.8)+'" width="'+(2*R+12)+'" height="'+(R*1.6)+'" rx="7" fill="url(#woodg)" filter="url(#woodf)" stroke="#1b120c" stroke-width="1.5"/>':'<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="url(#woodg)" filter="url(#woodf)" stroke="#1b120c" stroke-width="1.5"/>';
  s+=(square?'<rect x="'+(cx-R-2)+'" y="'+(cy-R*.8+6)+'" width="'+(2*R+12)+'" height="'+(R*1.6)+'" rx="9" fill="#000" opacity=".55" filter="url(#soft)"/>':'<circle cx="'+(cx+4)+'" cy="'+(cy+8)+'" r="'+R+'" fill="#000" opacity=".55" filter="url(#soft)"/>');
  const pos=[];for(let k=0;k<cap;k++){const a=-Math.PI/2+k/cap*Math.PI*2+(cap===2?Math.PI/2:0);pos.push(a);}
  pos.forEach((a,k)=>{const deg=a*180/Math.PI-90,rc=R+(square?15:17);
    let x=cx+Math.cos(a)*rc,y=cy+Math.sin(a)*rc;
    if(square){x=cx+Math.cos(a)*(R*.95+14);y=cy+Math.sin(a)*(R*.62+14);}
    s+='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+deg.toFixed(1)+')"><rect x="-12" y="-7" width="24" height="15" rx="6" fill="url(#leather)" stroke="#4a382d" stroke-width=".8"/><rect x="-9" y="-6" width="18" height="4" rx="2" fill="#fff" opacity=".07"/></g>';});
  s+=tw;
  pos.forEach((a,k)=>{if(k>=filled)return;const deg=a*180/Math.PI-90,rr=square?R*.5:R*.62,x=cx+Math.cos(a)*rr*(square?1.25:1),y=cy+Math.sin(a)*rr*(square?.8:1);
    s+='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+deg.toFixed(1)+')"><g class="av'+(k>=newFrom?' new':'')+'">'+
     '<rect x="-27" y="-10" width="8" height="18" rx="1.5" fill="#d9d2c3" transform="rotate(-4 -23 0)"/><rect x="-26" y="-9" width="6" height="16" rx="1" fill="#fff" opacity=".35"/>'+
     '<circle cx="1.5" cy="2.5" r="12" fill="#000" opacity=".35" filter="url(#soft)"/><circle cx="0" cy="0" r="12" fill="url(#plg)" stroke="#b9b1a2" stroke-width=".7"/><circle cx="0" cy="0" r="7.6" fill="none" stroke="#000" stroke-opacity=".12"/><circle cx="-3" cy="-4" r="3" fill="#fff" opacity=".6"/>'+
     '<rect x="-17.4" y="-10" width="1.8" height="17" rx=".9" fill="url(#metal)"/><path d="M17 -10Q19.6 -4 17.8 7L16 7Q15.4 -3 17 -10Z" fill="url(#metal)"/>'+
     '<circle cx="15" cy="-15" r="5.6" fill="#000" opacity=".25" filter="url(#soft)"/><circle cx="14" cy="-16" r="5" fill="#cfe0ee" fill-opacity=".16" stroke="#fff" stroke-opacity=".55" stroke-width=".7"/><circle cx="12.6" cy="-17.4" r="1.4" fill="#fff" opacity=".7"/>'+
     '</g></g>';});
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="20" fill="url(#flame)"/><circle cx="'+(cx+1)+'" cy="'+(cy+2)+'" r="4.4" fill="#000" opacity=".4" filter="url(#soft)"/><circle cx="'+cx+'" cy="'+cy+'" r="3.6" fill="#efe5d2"/><circle cx="'+cx+'" cy="'+(cy-1.6)+'" r="1.4" fill="#ffe6a8"/>';
  return '<svg viewBox="'+(vb||'0 0 200 200')+'" role="img" aria-label="Table set for '+filled+'">'+s+'</svg>';
}
function settingSVG(t,guests){return tableTop(t.cap,Math.min(guests,t.cap),t.zone==='Patio',99,'0 18 200 164').replace('<svg ','<svg class="setting" ');}

function applyTint(){const el=$('#app');if(!el||!el.style)return;
  if(S.view==='home'||S.view==='menu'){const d=DISHES[S.dish],c=S.theme==='light'?d.al:d.ac;
    el.style.setProperty('--accent',c);el.style.setProperty('--tint',c);
    el.style.setProperty('--accent-soft','color-mix(in srgb,'+c+' 18%,var(--surface))');
    el.style.setProperty('--on-accent',S.theme==='light'?'#fff':'#14100c');}
  else['--accent','--tint','--accent-soft','--on-accent'].forEach(k=>el.style.removeProperty(k));}
