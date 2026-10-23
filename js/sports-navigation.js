/* Draft-two navigation: one anchor-scrolling owner and accessible disclosures. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const mobile = matchMedia('(max-width:1050px)');
  const header = document.querySelector('.site-header');
  let scrollFrame=0;
  const cancelScroll=()=>{cancelAnimationFrame(scrollFrame);scrollFrame=0;};
  ['wheel','touchstart','pointerdown'].forEach(type=>addEventListener(type,cancelScroll,{passive:true}));
  addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))cancelScroll();});
  function targetFor(url){
    if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search)return null;
    if(!url.hash||url.hash==='#')return document.querySelector('#main');
    try{return document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{return null;}
  }
  window.tcNavigate = destination => {
    const url=new URL(destination,location.href), target=targetFor(url);
    if(!target){location.assign(destination);return;}
    cancelScroll();
    const from=scrollY, start=performance.now(), duration=reduced.matches?0:650;
    const topLink=!url.hash||url.hash==='#';
    const end=()=>topLink?0:Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,target.getBoundingClientRect().top+scrollY-(mobile.matches?(innerWidth<=760?68:76):76)-16));
    const tick=now=>{
      const t=duration?Math.min(1,(now-start)/duration):1;
      scrollTo({top:from+(end()-from)*(1-Math.pow(1-t,3)),behavior:'instant'});
      if(t<1)scrollFrame=requestAnimationFrame(tick);
      else{
        scrollFrame=0;history.pushState(null,'',url.hash||'#');
        const focus=topLink?document.querySelector('.brand'):target;
        if(!focus.hasAttribute('tabindex')&&!focus.matches('a,button,input')){focus.setAttribute('tabindex','-1');focus.addEventListener('blur',()=>focus.removeAttribute('tabindex'),{once:true});}
        focus.focus({preventScroll:true});
      }
    };
    tick(start);
  };
  // Capture before Webflow's delegated click handler can schedule a second scroll.
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||link.closest('.mobile-nav')||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
    const url=new URL(link.href);
    if(!targetFor(url))return;
    event.preventDefault();event.stopImmediatePropagation();closeDesktop();window.tcNavigate(link.href);
  },true);

  const dropdown=document.querySelector('.sports-dropdown');
  const trigger=dropdown.querySelector('.sports-nav-trigger');
  const popup=dropdown.querySelector('.sports-popover');
  const subs=[...dropdown.querySelectorAll('.sports-subgroup')];
  function closeSubs(){subs.forEach(group=>{group.querySelector('button').setAttribute('aria-expanded','false');group.querySelector('.sports-subpopover').hidden=true;});}
  function closeDesktop(){trigger.setAttribute('aria-expanded','false');popup.hidden=true;closeSubs();}
  function openDesktop(){if(mobile.matches)return;trigger.setAttribute('aria-expanded','true');popup.hidden=false;}
  trigger.addEventListener('click',()=>{if(popup.hidden)openDesktop();else closeDesktop();});
  let hoverTimer=0;
  dropdown.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;clearTimeout(hoverTimer);});
  dropdown.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hoverTimer=setTimeout(closeDesktop,180);});
  subs.forEach(group=>{
    const button=group.querySelector('button'), panel=group.querySelector('.sports-subpopover');
    const show=()=>{closeSubs();panel.hidden=false;button.setAttribute('aria-expanded','true');};
    button.addEventListener('click',show);
    group.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')show();});
    button.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();show();}});
  });
  dropdown.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeDesktop();trigger.focus();}
    if(e.key==='ArrowDown'&&e.target===trigger){e.preventDefault();openDesktop();popup.querySelector('a').focus();}
    if(e.key==='ArrowLeft'){closeSubs();}
  });
  dropdown.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(!dropdown.contains(document.activeElement))closeDesktop();}));
  document.addEventListener('pointerdown',e=>{if(!dropdown.contains(e.target))closeDesktop();});
  mobile.addEventListener('change',closeDesktop);

  const menu=document.querySelector('.mobile-nav');
  let current='main', pageAnimation=null;
  const pages=[...menu.querySelectorAll('.mobile-nav-page')];
  function showPage(name,focus=true){
    const next=pages.find(p=>p.dataset.page===name);if(!next)return;
    const backwards=name==='main'||(name==='sports'&&current!=='main');
    pageAnimation?.cancel();current=name;
    pages.forEach(p=>{p.hidden=p!==next;p.inert=p!==next;});
    menu.querySelectorAll('[data-nav-page][aria-expanded]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.navPage===name)));
    if(!reduced.matches)pageAnimation=next.animate([{opacity:0,transform:`translateX(${backwards?-18:24}px) scale(.98)`},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});
    menu.scrollTop=0;
    if(focus)next.querySelector('button,a')?.focus({preventScroll:true});
  }
  menu.addEventListener('click',e=>{const button=e.target.closest('[data-nav-page]');if(button)showPage(button.dataset.navPage);});
  menu.addEventListener('keydown',e=>{if(e.key==='Escape'&&current!=='main'){e.preventDefault();e.stopPropagation();showPage(current==='sports'?'main':'sports');}});
  window.tcResetMobileNav=()=>showPage('main',false);
  showPage('main',false);
})();
