function codeSVG(seed){
  let h=0;for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))|0;const r=rng(h),N=21;let c='';
  const finder=(x,y)=>'<rect x="'+x+'" y="'+y+'" width="7" height="7" fill="currentColor"/><rect x="'+(x+1)+'" y="'+(y+1)+'" width="5" height="5" fill="#e9dcc3"/><rect x="'+(x+2)+'" y="'+(y+2)+'" width="3" height="3" fill="currentColor"/>';
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const inF=(x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12);if(!inF&&r()<.5)c+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="currentColor"/>';}
  return '<svg class="code" viewBox="0 0 21 21" role="img" aria-label="Sample arrival code pattern">'+c+finder(0,0)+finder(14,0)+finder(0,14)+'</svg>';
}
function calLink(r){
  const d=r.date.replace(/-/g,''),f=m=>String(Math.floor(m/60)).padStart(2,'0')+String(m%60).padStart(2,'0')+'00';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Dinner at Terracotta Table')+'&dates='+d+'T'+f(r.start)+'/'+d+'T'+f(r.end)+'&details='+encodeURIComponent('Reservation '+r.ref+', table '+r.table+', '+r.party+' guests')+'&location='+encodeURIComponent('12 Market Street');
}
