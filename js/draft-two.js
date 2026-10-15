/* Isolated motion layer for index.html; draft one never loads this file. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.site-header'), signup=document.querySelector('.signup');
 const toggle=header.querySelector('.menu-toggle'), menu=header.querySelector('.mobile-nav');
 toggle.innerHTML='<i class="menu-label" aria-hidden="true"><b>Menu</b><b>Close</b></i><i class="menu-lines" aria-hidden="true"></i>';
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
 function update(){
   raf=0;
   // Hysteresis prevents toggling around the sticky threshold.
   if(scrollY>110)header.classList.add('is-compact');
   else if(scrollY<40)header.classList.remove('is-compact');
   const rect=signup.getBoundingClientRect();
   if(!reduced.matches&&rect.top<innerHeight&&rect.bottom>0){
     const y=Math.max(-65,Math.min(65,(innerHeight/2-rect.top-rect.height/2)*.1));
     signup.style.setProperty('--pattern-y',`${y}px`);
   }
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(update)}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{if(innerWidth>1050)setMenu(false);schedule()},{passive:true});
 reduced.addEventListener('change',()=>{signup.style.removeProperty('--pattern-y');schedule()});
 update();
 if(!reduced.matches&&scrollY<40){
   ['swoop','swoopball','themark','centersmark','northpill','northmark'].forEach((id,i)=>{
     const el=header.querySelector('#'+id);
     el.animate([{opacity:0,transform:`translate(${id==='swoopball'?45:-20}px,${id==='swoopball'?-35:20}px) rotate(-8deg)`},{opacity:1,transform:'none'}],{duration:850,delay:i*85,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'});
   });
 }
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
