/* Use the completed Lottie SVG itself as the aperture, preserving its exact transforms. */
(()=>{
 'use strict';
 const root=document.documentElement,overlay=document.querySelector('#tc-loader');
 if(!overlay)return;
 const stage=overlay.querySelector('.tc-loader-stage'),screen=overlay.querySelector('.tc-loader-screen');
 const cutout=overlay.querySelector('#tc-loader-cutout'),pose=overlay.querySelector('#tc-loader-pose');
 const white=overlay.querySelector('#tc-loader-white'),cover=overlay.querySelector('#tc-loader-cover');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const content=[...document.querySelectorAll('body > header,body > main,body > footer')];
 const wasInert=content.map(el=>el.inert);content.forEach(el=>el.inert=true);
 let animation,frame=0,revealing=false,finished=false,announced=false,ready=false,resumeFilm=null;
 const ns='http://www.w3.org/2000/svg';
 function announce(){
   if(announced)return;announced=true;window.__tcIntroPending=false;
   root.classList.remove('tc-intro-wait');window.dispatchEvent(new Event('tc:reveal'));
 }
 function finish(){
   if(finished)return;finished=true;cancelAnimationFrame(frame);clearTimeout(window.__tcLoaderTimeout);
   announce();root.classList.remove('tc-loading');content.forEach((el,i)=>el.inert=wasInert[i]);
   if(overlay.contains(document.activeElement))document.querySelector('.brand')?.focus({preventScroll:true});
   animation?.destroy();overlay.remove();
   if(resumeFilm){resumeFilm.play().catch(()=>{});resumeFilm=null}
 }
 window.addEventListener('tc:loader-timeout',finish,{once:true});
 function dimensions(){
   const w=innerWidth,h=innerHeight;
   screen.setAttribute('viewBox',`0 0 ${w} ${h}`);
   [white,cover].forEach(rect=>{rect.setAttribute('width',w);rect.setAttribute('height',h)});
   cutout.setAttribute('width',w);cutout.setAttribute('height',h);
 }
 // Four final-frame Bezier contours from the original Lottie, flattened to its
 // 1200x900 composition. Animate SVG geometry, never an enlarged bitmap/texture.
 const revealPaths=[{"d":"M832.63 285.54C821.12 317.17 786.14 342.81 754.51 342.81C722.88 342.81 706.57 317.17 718.08 285.54C729.59 253.91 764.57 228.27 796.2 228.27C827.83 228.27 844.14 253.91 832.63 285.54C832.63 285.54 832.63 285.54 832.63 285.54C832.63 285.54 832.63 285.54 832.63 285.54Z","fill":"#1f1f1f"},{"d":"M624.39 228.27C624.39 228.27 624.39 228.27 624.39 228.27C561.13 228.27 491.18 279.55 468.15 342.82C457.093 373.197 446.037 403.573 434.98 433.95C434.73 434.64 435.24 435.37 435.97 435.37C435.97 435.37 435.97 435.37 435.97 435.37C436.35 435.37 436.7 435.17 436.88 434.84C466.45 382.37 527.14 342.83 582.69 342.83C620.173 342.83 657.657 342.83 695.14 342.83C696.4 342.83 697.53 342.04 697.96 340.86C711.13 304.677 724.3 268.493 737.47 232.31C738.18 230.35 736.73 228.28 734.65 228.28C697.897 228.28 661.143 228.28 624.39 228.28C624.39 228.277 624.39 228.273 624.39 228.27C624.39 228.27 624.39 228.27 624.39 228.27Z","fill":"#1f1f1f"},{"d":"M542.47 453.32C554.043 421.52 565.617 389.72 577.19 357.92C577.92 355.92 576.39 353.81 574.26 353.89C509.18 356.32 447.19 411.79 428.7 479.52C416.25 525.12 449.64 570.88 496.9 571.87C497.7 571.89 498.51 571.9 499.32 571.9C536.8 571.9 574.28 571.9 611.76 571.9C613.02 571.9 614.15 571.11 614.58 569.93C627.75 533.747 640.92 497.563 654.09 461.38C654.8 459.42 653.35 457.35 651.27 457.35C615.943 457.35 580.617 457.35 545.29 457.35C543.21 457.35 541.76 455.28 542.47 453.32C542.47 453.32 542.47 453.32 542.47 453.32C542.47 453.32 542.47 453.32 542.47 453.32Z","fill":"#00857a"},{"d":"M559.8 233.97C562.68 232.6 561.69 228.27 558.5 228.27C504.807 228.27 451.113 228.27 397.42 228.27C396.15 228.27 395 229.07 394.58 230.28C374.53 288.1 401.12 335.47 455.03 342.03C456.39 342.2 457.67 341.39 458.16 340.11C475.63 294.76 515.14 255.25 559.79 233.97C559.793 233.97 559.797 233.97 559.8 233.97C559.8 233.97 559.8 233.97 559.8 233.97Z","fill":"#00857a"}];
 function reveal(){
   if(revealing||finished)return;
   if(!ready||reduced.matches){finish();return}
   revealing=true;animation.goToAndStop(410,true);
   const box=stage.getBoundingClientRect(),base=box.width/1200;
   if(matchMedia('(max-width:760px), (pointer:coarse)').matches){
     const video=document.querySelector('.hero-video');
     if(video&&!video.paused){resumeFilm=video;video.pause()}
   }
   const colors=document.createElementNS(ns,'g');
   revealPaths.forEach(({d,fill})=>{
     const aperture=document.createElementNS(ns,'path');
     aperture.setAttribute('d',d);aperture.setAttribute('fill','black');pose.append(aperture);
     const color=aperture.cloneNode();color.setAttribute('fill',fill);colors.append(color);
   });
   screen.append(colors);
   const initial=`translate(${box.left} ${box.top}) scale(${base})`;
   colors.setAttribute('transform',initial);pose.setAttribute('transform',initial);
   stage.style.display='none';
   dimensions();overlay.classList.add('tc-opening');
   // Authored 1200x900 coordinates: asset 4's swoop ends beside layer 10's ball.
   // (700,285) lies inside the upper swoop, close to their shared edge.
   const anchor={x:700,y:285};
   const pin={x:box.left+anchor.x*base,y:box.top+anchor.y*base};
   const relay=document.createElementNS(ns,'circle');
   relay.setAttribute('fill','black');relay.setAttribute('cx',pin.x);relay.setAttribute('cy',pin.y);relay.setAttribute('r',0);cutout.append(relay);
   const radius=Math.hypot(Math.max(pin.x,innerWidth-pin.x),Math.max(pin.y,innerHeight-pin.y))+2;
   const target=Math.max(18,Math.hypot(innerWidth,innerHeight)/(box.width*.08));
   const start=performance.now(),duration=1050;
   // Keep the same swoop point fixed in both layers; the circle follows from it.
   function tick(now){
     const t=Math.min(1,(now-start)/duration),eased=t*t*(3-2*t),scale=1+(target-1)*eased;
     const s=base*scale;
     const x=pin.x-anchor.x*s,y=pin.y-anchor.y*s,follow=Math.max(0,(t-.38)/.62);
     const circleRadius=radius*follow*follow*(3-2*follow),fade=1-Math.min(1,t/.22);
     const transform=`translate(${x} ${y}) scale(${s})`;
     pose.setAttribute('transform',transform);
     pose.setAttribute('opacity',Math.min(1,t/.14));
     if(fade>0){colors.setAttribute('transform',transform);colors.setAttribute('opacity',fade)}
     else colors.style.display='none';
     relay.setAttribute('r',circleRadius);
     if(t>.28)announce();
     if(t<1)frame=requestAnimationFrame(tick);else finish();
   }
   frame=requestAnimationFrame(tick);
 }
 overlay.querySelector('button').addEventListener('click',reveal);
 addEventListener('resize',()=>{if(revealing)finish();else dimensions()},{passive:true});
 reduced.addEventListener('change',()=>{if(reduced.matches)finish()});
 dimensions();
 if(reduced.matches){finish();return}
 try{
   animation=lottie.loadAnimation({container:stage,renderer:'svg',loop:false,autoplay:false,animationData:window.TC_LOADER_DATA,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
   const start=()=>{if(ready||finished)return;ready=true;animation.setSpeed(1.05);animation.playSegments([0,410],true)};
   animation.addEventListener('DOMLoaded',start);
   animation.addEventListener('complete',reveal);
   animation.addEventListener('data_failed',finish);
   if(animation.isLoaded)start();
 }catch(error){console.warn('Loader unavailable',error);finish()}
})();
