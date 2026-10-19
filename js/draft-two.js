/* Isolated motion layer for index.html; draft one never loads this file. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.site-header'), signup=document.querySelector('.signup');
 const toggle=header.querySelector('.menu-toggle'), menu=header.querySelector('.mobile-nav');
 toggle.innerHTML='<i class="menu-lines" aria-hidden="true"></i>';
 const links=[...menu.querySelectorAll('a')];
 links.forEach((link,i)=>link.style.setProperty('--i',i));
 let open=false,closing=false,closeTimer,oldOverflow='',raf=0;
 function setMenu(next,restoreFocus=false){
   if(closing||next===open)return;
   if(!next){beginMenuClose({restoreFocus});return}
   open=true;clearTimeout(closeTimer);
   toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Close navigation');
   menu.inert=false;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
   menu.hidden=false;menu.getBoundingClientRect();header.classList.add('menu-open');
   document.querySelector('main').inert=true;document.querySelector('footer').inert=true;
   setTimeout(()=>{if(open&&!closing)playNavSwoop()},150);
 }
 toggle.addEventListener('click',()=>setMenu(!open));
 links.forEach(link=>link.addEventListener('click',event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();beginMenuClose({link,destination:link.href});
 }));
 document.addEventListener('keydown',event=>{
   if(!open||closing)return;
   if(event.key==='Escape'){event.preventDefault();beginMenuClose({restoreFocus:true})}
   if(event.key==='Tab'){
     const focusable=[header.querySelector('.brand'),toggle,...links];
     let i=focusable.indexOf(document.activeElement);i=(i+(event.shiftKey?-1:1)+focusable.length)%focusable.length;
     event.preventDefault();focusable[i].focus();
   }
 });
 // Each state owns its animations; interrupted scrolls start at the visible frame.
 const brand=header.querySelector('.brand');
 const ids=['themark','centersmark','northpill','northmark','swoop','swoopball','icon-swoop-cap','icon-swoop-path'];
 const parts=Object.fromEntries(ids.map(id=>[id,header.querySelector('#'+id)]));
 const art=menu.querySelector('.mobile-nav-art');
 let navSwoop=null,navSwoopReady=false;
 if(art&&window.TC_NAV_SWEEPS&&window.lottie){
   navSwoop=lottie.loadAnimation({container:art,renderer:'svg',loop:false,autoplay:false,animationData:window.TC_NAV_SWEEPS,rendererSettings:{preserveAspectRatio:'none'}});
   navSwoop.addEventListener('DOMLoaded',()=>{navSwoopReady=true;if(open&&!closing)playNavSwoop()});
   if(navSwoop.isLoaded)navSwoopReady=true;
 }
 const active=new Set();
 const ease='cubic-bezier(.22,1,.36,1)';
 function playNavSwoop(){
   if(!navSwoop||!navSwoopReady||reduced.matches)return;
   navSwoop.setDirection(1);navSwoop.setSpeed(1.45);navSwoop.goToAndPlay(0,true);
 }
 function reverseNavSwoop(){
   if(!navSwoop||!navSwoopReady||reduced.matches)return Promise.resolve();
   return new Promise(resolve=>{
     let settled=false;
     const done=()=>{if(settled)return;settled=true;clearTimeout(fallback);navSwoop.removeEventListener('complete',done);resolve()};
     const fallback=setTimeout(done,800);
     navSwoop.addEventListener('complete',done);
     navSwoop.setDirection(-1);navSwoop.setSpeed(2.2);navSwoop.goToAndPlay(navSwoop.currentFrame,true);
   });
 }
 async function throwBallAt(link){
   if(reduced.matches)return;
   const ns='http://www.w3.org/2000/svg',ball=document.createElement('span');
   ball.className='nav-throw-ball';ball.setAttribute('aria-hidden','true');
   // Independent artwork: the header logo's inline opacity/clip transforms must
   // never be copied into this overlay. Keep the ball above the header (z=100).
   const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 44 44');svg.setAttribute('focusable','false');
   const circle=document.createElementNS(ns,'circle');
   Object.entries({cx:22,cy:22,r:19,fill:'#00857a',stroke:'#fff','stroke-width':3}).forEach(([key,value])=>circle.setAttribute(key,value));
   const seams=document.createElementNS(ns,'path');
   Object.entries({d:'M5 22h34M22 3c-13 9-13 29 0 38M22 3c13 9 13 29 0 38',fill:'none',stroke:'#094742','stroke-width':2,'stroke-linecap':'round'}).forEach(([key,value])=>seams.setAttribute(key,value));
   svg.append(circle,seams);ball.append(svg);
   const origin={x:innerWidth-54,y:innerHeight-54};
   ball.style.left=(origin.x-22)+'px';ball.style.top=(origin.y-22)+'px';document.body.append(ball);
   const selected=links.indexOf(link);
   const neighbor=[links[selected+1],links[selected-1]].find(item=>{
     if(!item)return false;
     const r=item.getBoundingClientRect();return r.width>0&&r.top>=90&&r.bottom<innerHeight-25;
   });
   const stops=neighbor?[neighbor,link]:[link];let from=origin,rotation=0;
   const position=(point,angle,scale='1,1')=>`translate3d(${point.x-origin.x}px,${point.y-origin.y}px,0) rotate(${angle}deg) scale(${scale})`;
   function nudge(item){
     const hit=item.animate([
       {transform:'translateX(0) scale(1)'},{transform:'translateX(-10px) scale(.98)',offset:.3},
       {transform:'translateX(3px) scale(1.01)',offset:.65},{transform:'translateX(0) scale(1)'}
     ],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
     hit.finished.then(()=>hit.cancel(),()=>{});
   }
   try{
     for(let i=0;i<stops.length;i++){
       const item=stops[i],r=item.getBoundingClientRect();
       const to={x:Math.min(innerWidth-26,r.right+15),y:r.top+r.height*.52};
       const dx=to.x-from.x,dy=to.y-from.y;
       const lift=Math.min(130,Math.max(48,Math.hypot(dx,dy)*.2),Math.max(16,Math.min(from.y,to.y)-90));
       const turn=dx<0?-300:300;
       // Sample a parabola at even time steps: one continuous arc with no pause
       // at its midpoint and no shrinking as it reaches the text.
       const frames=Array.from({length:31},(_,n)=>{
         const t=n/30,point={x:from.x+dx*t,y:from.y+dy*t-4*lift*t*(1-t)};
         return {offset:t,transform:position(point,rotation+turn*t)};
       });
       await ball.animate(frames,{duration:i===0?680:440,easing:'linear',fill:'forwards'}).finished;
       rotation+=turn;from=to;nudge(item);
     }
     // Brief rebound makes the final contact readable before the swoop exits.
     await ball.animate([
       {transform:position(from,rotation,'.86,1.1')},
       {transform:position({x:from.x+16,y:from.y-14},rotation+35),offset:.45},
       {transform:position(from,rotation+55)}
     ],{duration:220,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'}).finished;
   }finally{ball.remove()}
 }
 function beginMenuClose({link=null,destination=null,restoreFocus=false}={}){
   if(!open||closing)return;
   closing=true;open=false;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');menu.inert=true;
   if(restoreFocus)toggle.focus();
   const finishDrawer=()=>{
     header.classList.remove('menu-open');document.body.style.overflow=oldOverflow;
     document.querySelector('main').inert=false;document.querySelector('footer').inert=false;
     closeTimer=setTimeout(()=>{menu.hidden=true;closing=false;if(destination)location.assign(destination)},reduced.matches?0:650);
   };
   const exit=()=>reverseNavSwoop().then(finishDrawer);
   if(link&&!reduced.matches)throwBallAt(link).then(exit,exit);else exit();
 }
 const shown={opacity:1,transform:'translate(0px,0px)',clipPath:'inset(0 0 0 0)'};
 const hidden=(x,y=0)=>({opacity:0,transform:`translate(${x}px,${y}px)`,clipPath:'inset(0 0 0 0)'});
 const snapshot=el=>{const s=getComputedStyle(el);return {opacity:s.opacity,transform:s.transform,clipPath:s.clipPath}};
 function stopLogo(){
   const current=Object.fromEntries(ids.map(id=>[id,snapshot(parts[id])]));
   active.forEach(a=>a.cancel());active.clear();
   ids.forEach(id=>Object.assign(parts[id].style,current[id]));
 }
 function motion(id,frames,duration,delay=0){
   const el=parts[id],last=frames[frames.length-1];
   ['opacity','transform','clipPath'].forEach(key=>{if(key in last)el.style[key]=last[key]});
   if(reduced.matches)return;
   const a=el.animate(frames,{duration,delay,easing:'linear',fill:'both'});
   active.add(a);
   a.onfinish=()=>{active.delete(a);a.cancel()};
 }
 function slide(id,to,duration,delay=0){motion(id,[{...snapshot(parts[id]),easing:ease},to],duration,delay)}
 // Start and finish at contact. Two positive arcs avoid jumping or crossing the swoop.
 function bounce(delay=0,distance=24){
   motion('swoopball',[
     {...shown,offset:0,easing:'cubic-bezier(.2,.7,.3,1)'},
     {...shown,transform:`translateX(${distance}px)`,offset:.36,easing:'cubic-bezier(.55,0,.8,.35)'},
     {...shown,offset:.68,easing:'cubic-bezier(.2,.7,.3,1)'},
     {...shown,transform:`translateX(${distance*.18}px)`,offset:.83,easing:'cubic-bezier(.55,0,.8,.35)'},
     {...shown,offset:1}
   ],840,delay);
 }
 let logoExpanded=null;
 function setLogo(expanded,force=false){
   if(logoExpanded===expanded&&!force)return;
   stopLogo();logoExpanded=expanded;
   header.classList.toggle('is-compact',!expanded);
   // The ball and swoop inherit exactly the same iconmark resize transform.
   Object.assign(parts.swoopball.style,shown);
   Object.assign(parts.swoop.style,shown);
   if(expanded){
     ['icon-swoop-cap','icon-swoop-path'].forEach(id=>slide(id,shown,280));
     [['themark',720],['centersmark',980],['northpill',1240],['northmark',1500]].forEach(([id,delay])=>slide(id,shown,450,delay));
     bounce(1860);
   }else{
     [['themark',-48,120],['centersmark',60,340],['northpill',60,560],['northmark',60,780]].forEach(([id,x,delay])=>slide(id,hidden(x),340,delay));
     [['icon-swoop-cap',hidden(-35)],['icon-swoop-path',hidden(0,34)]].forEach(([id,away])=>motion(id,[
       {...snapshot(parts[id]),offset:0,easing:ease},
       {...away,offset:.2}, {...away,offset:.75,easing:ease}, {...shown,offset:1}
     ],2250));
     motion('swoopball',[{...shown,offset:0,easing:ease},{...shown,transform:'translateX(38px)',offset:.65,easing:ease},{...shown,offset:1}],550,1120);
   }
 }
 function intro(){
   logoExpanded=true;header.classList.remove('is-compact');
   [['icon-swoop-path',hidden(0,36),550,0],['swoop',hidden(-70),620,160],['themark',hidden(-48),480,320],['centersmark',hidden(60),500,680],['northpill',hidden(60),480,1000],['northmark',hidden(60),420,1280],['icon-swoop-cap',hidden(60),480,1390]].forEach(([id,from,duration,delay])=>motion(id,[{...from,easing:ease},shown],duration,delay));
   motion('swoopball',[
     {...hidden(-64),offset:0,easing:'cubic-bezier(.45,0,.7,.25)'},
     {...shown,transform:'translateX(54px)',offset:.48,easing:'cubic-bezier(.18,.78,.28,1)'},
     {...shown,transform:'translateX(61px)',offset:.66,easing:'cubic-bezier(.35,0,.65,1)'},
     {...shown,offset:.84}, {...shown,offset:1}
   ],920,620);
 }
 brand.addEventListener('pointerenter',event=>{
   if(event.pointerType==='touch'||reduced.matches||active.size)return;
   bounce(0,18);
 });
 function update(){
   raf=0;
   if(window.__tcIntroPending)return;
   if(scrollY>8)setLogo(false);
   else if(scrollY<=1)setLogo(true);
   const rect=signup.getBoundingClientRect();
   if(!reduced.matches&&rect.top<innerHeight&&rect.bottom>0){
     const y=Math.max(-65,Math.min(65,(innerHeight/2-rect.top-rect.height/2)*.1));
     signup.style.setProperty('--pattern-y',`${y}px`);
   }
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(update)}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{if(innerWidth>1050)setMenu(false);schedule()},{passive:true});
 reduced.addEventListener('change',()=>{signup.style.removeProperty('--pattern-y');setLogo(logoExpanded,true);schedule()});
 function startHomepage(){if(scrollY<=1)intro();else setLogo(false);update()}
 if(window.__tcIntroPending)window.addEventListener('tc:reveal',startHomepage,{once:true});else startHomepage();
 document.querySelectorAll('.upgrade-list details').forEach(details=>{
   const summary=details.querySelector('summary'),content=details.querySelector('ul');
   let animation=null,contentAnimation=null,target=details.open;
   details.dataset.expanded=String(target);
   summary.addEventListener('click',event=>{
     event.preventDefault();target=!target;
     const start=details.getBoundingClientRect().height;
     if(animation){animation.cancel();animation=null}
     if(contentAnimation){contentAnimation.cancel();contentAnimation=null}
     details.open=true;details.dataset.expanded=String(target);
     const end=target?summary.getBoundingClientRect().height+content.getBoundingClientRect().height+1:summary.getBoundingClientRect().height+1;
     if(reduced.matches){details.open=target;return}
     animation=details.animate({height:[`${start}px`,`${end}px`]},{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
     contentAnimation=content.animate({opacity:target?[0,1]:[1,0],transform:target?['translateY(8px)','none']:['none','translateY(-4px)']},{duration:target?380:220,easing:'ease-out',fill:'both'});
     animation.onfinish=()=>{details.open=target;animation=null;contentAnimation.cancel();contentAnimation=null};
   });
 });
})();

// Explicit scrolling avoids the empty-fragment link intercepted by Webflow.
(()=>{
 const button=document.querySelector('.back-top');if(!button)return;
 let raf=0,restore=null;
 function cancel(){
   cancelAnimationFrame(raf);raf=0;
   if(restore!==null){document.documentElement.style.scrollBehavior=restore;restore=null}
   button.classList.remove('is-running');
   removeEventListener('wheel',cancel);removeEventListener('touchstart',cancel);removeEventListener('keydown',interrupt);
 }
 function interrupt(event){if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancel()}
 button.addEventListener('click',()=>{
   cancel();const from=scrollY,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   restore=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';
   const finish=()=>{window.scrollTo({top:0,left:0,behavior:'instant'});cancel();document.querySelector('.brand')?.focus({preventScroll:true})};
   if(reduced||from<2){finish();return}
   button.classList.add('is-running');
   addEventListener('wheel',cancel,{passive:true});addEventListener('touchstart',cancel,{passive:true});addEventListener('keydown',interrupt);
   const start=performance.now(),duration=Math.min(950,Math.max(550,450+Math.sqrt(from)*8));
   function tick(now){const t=Math.min(1,(now-start)/duration);window.scrollTo({top:from*Math.pow(1-t,3),left:0,behavior:'instant'});if(t<1)raf=requestAnimationFrame(tick);else finish()}
   raf=requestAnimationFrame(tick);
 });
})();
