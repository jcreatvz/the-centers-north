/* Homepage enhancements; Webflow's supplied runtime remains available. */
(()=>{'use strict';document.querySelector('#signup-form').addEventListener('submit',event=>{event.preventDefault();const status=document.querySelector('#form-status');status.hidden=false;status.textContent='Thanks for your interest! This draft isn’t connected to the mailing list yet. No details have been sent or saved. Please visit the current website to subscribe.';const link=document.createElement('a');link.href='https://www.thecentersportscomplex.com/';link.textContent=' Open the current website';link.className='text-link';link.target='_blank';link.rel='noopener';status.append(link)});})();

// Muted autoplay with a usable fallback when browser policy prevents playback.
(()=>{
  const video=document.querySelector('.hero-video');
  const button=document.querySelector('.video-control');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused=false;
  const sync=()=>{
    const playing=!video.paused&&!video.ended;
    button.textContent=playing?'Pause facility film':'Play facility film';
    button.setAttribute('aria-pressed',String(playing));
  };
  video.muted=true;
  video.defaultMuted=true;
  video.addEventListener('play',sync);
  video.addEventListener('pause',sync);
  video.addEventListener('ended',sync);
  video.addEventListener('error',()=>{button.textContent='Film unavailable';button.disabled=true});
  async function play(){try{await video.play()}catch{sync()}}
  button.addEventListener('click',()=>{if(video.paused){userPaused=false;play()}else{userPaused=true;video.pause()}});
  const autoplay=()=>{
    if(reduced.matches){video.autoplay=false;video.pause()}
    else if(!userPaused){video.autoplay=true;play()}
  };
  reduced.addEventListener('change',autoplay);
  sync();autoplay();
})();
