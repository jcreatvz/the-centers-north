/* Gentle decorative motion. Duplicate marquee groups share the same angles. */
(()=>{
  const strip=document.querySelector('.sport-strip');
  const groups=[...strip.querySelectorAll('.marquee-group')];
  const icons=groups.map(group=>[...group.querySelectorAll('.marquee-sport-icon')]);
  const active=document.querySelector('.location.active');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const baseSpeeds=[8,11,9,7,10]; // degrees per second, one timing per separator
  const angles=baseSpeeds.map(()=>0);
  const maxSpeed=28;
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  function scrollFactor(delta,seconds){
    const velocity=Math.abs(delta)/Math.max(seconds,.008);
    return Math.sign(delta)*Math.min(2.5,1+velocity/1200);
  }
  let visible=false,frame=0,lastTime=0,lastY=window.scrollY;
  let factor=1,target=1,lastScroll=-Infinity;
  function tick(now){
    frame=0;
    if(!visible||document.hidden||reduced.matches)return;
    const seconds=lastTime?Math.min((now-lastTime)/1000,.064):0;
    const delta=window.scrollY-lastY;
    lastTime=now;lastY=window.scrollY;
    const paused=strip.classList.contains('is-paused')||strip.matches(':hover, :focus-within');
    if(paused){factor=1;target=1;lastScroll=-Infinity}
    else if(seconds>0){
      if(Math.abs(delta)>.25){target=scrollFactor(delta,seconds);lastScroll=now}
      else if(now-lastScroll>180)target=1;
      // Frame-rate-independent easing prevents abrupt direction/speed changes.
      factor+=(target-factor)*(1-Math.exp(-seconds/.38));
      baseSpeeds.forEach((speed,i)=>{
        angles[i]=(angles[i]+clamp(speed*factor,-maxSpeed,maxSpeed)*seconds)%360;
        icons.forEach(group=>{if(group[i])group[i].style.rotate=`${angles[i].toFixed(3)}deg`});
      });
    }
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;lastTime=0;lastY=window.scrollY;
    factor=1;target=1;lastScroll=-Infinity;
    if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);
  }
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.target===strip){visible=entry.isIntersecting;sync()}
      else active.classList.toggle('is-floating',entry.isIntersecting);
    }));
    observer.observe(strip);if(active)observer.observe(active);
  }else{visible=true;if(active)active.classList.add('is-floating');sync()}
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
})();
