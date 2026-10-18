/* Isolated motion layer for index.html; draft one never loads this file. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.site-header'), signup=document.querySelector('.signup');
 const toggle=header.querySelector('.menu-toggle'), menu=header.querySelector('.mobile-nav');
 toggle.innerHTML='<i class="menu-lines" aria-hidden="true"></i>';
 const links=[...menu.querySelectorAll('a')];
 links.forEach((link,i)=>link.style.setProperty('--i',i));
 let open=false,closeTimer,oldOverflow='',raf=0;
 function setMenu(next,restoreFocus=false){
   if(next===open)return;
   open=next;clearTimeout(closeTimer);
   toggle.setAttribute('aria-expanded',String(open));
   toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
   menu.inert=!open;
   if(open){
     oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
     menu.hidden=false;menu.getBoundingClientRect();header.classList.add('menu-open');
     document.querySelector('main').inert=true;document.querySelector('footer').inert=true;
   }else{
     header.classList.remove('menu-open');document.body.style.overflow=oldOverflow;
     document.querySelector('main').inert=false;document.querySelector('footer').inert=false;
     closeTimer=setTimeout(()=>{if(!open)menu.hidden=true},reduced.matches?0:650);
     if(restoreFocus)toggle.focus();
   }
 }
 toggle.addEventListener('click',()=>setMenu(!open));
 links.forEach(link=>link.addEventListener('click',()=>setMenu(false,true)));
 document.addEventListener('keydown',event=>{
   if(!open)return;
   if(event.key==='Escape'){event.preventDefault();setMenu(false,true)}
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
 const active=new Set();
 const ease='cubic-bezier(.22,1,.36,1)';
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
