/* Isolated second-draft details. Existing Cards/Orbit and logo timelines retain ownership. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width:760px)');

  function slidingSelection(group, selector) {
    if (!group) return;
    let frame = 0;
    function paint() {
      frame = 0;
      const selected = group.querySelector(selector);
      if (!selected || !group.getBoundingClientRect().width) return;
      group.style.setProperty('--pill-x', selected.offsetLeft + 'px');
      group.style.setProperty('--pill-width', selected.offsetWidth + 'px');
      if (!group.classList.contains('has-slider')) {
        group.classList.add('has-slider');
        requestAnimationFrame(() => group.classList.add('slider-ready'));
      }
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(paint); };
    new MutationObserver(queue).observe(group, {subtree:true,childList:true,attributes:true,attributeFilter:['aria-selected','aria-pressed']});
    new ResizeObserver(queue).observe(group);
    document.fonts?.ready.then(queue);
    queue();
  }
  slidingSelection(document.querySelector('.sports-view-tabs'), '[aria-selected=true]');

  const root = document.querySelector('#home-sport-orbit');
  function refineOrbit() {
    const orbit = window.centersSports?.orbit;
    const mask = root?.querySelector('.so-detail-image');
    if (!orbit || !mask) return false;
    const updateZoom = () => { orbit.config.cameraZoom = phone.matches ? 1.7 : 1.15; orbit.syncControls(); orbit.needsRender = true; orbit.resize(); };
    phone.addEventListener('change', updateZoom);
    updateZoom();
    slidingSelection(root.querySelector('.so-sports'), '[aria-pressed=true]');
    const drift = document.createElement('div'); drift.className = 'so-detail-drift';
    drift.append(mask.querySelector('.so-detail-thumb')); mask.append(drift);
    let visible = false;
    const sync = () => root.classList.toggle('is-detail-in-view', visible && !document.hidden && !reduced.matches);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:0});
    observer.observe(mask);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    mask.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reduced.matches) return;
      const box = mask.getBoundingClientRect();
      drift.style.setProperty('--thumb-x', ((event.clientX-box.left)/box.width-.5)*7+'px');
      drift.style.setProperty('--thumb-y', ((event.clientY-box.top)/box.height-.5)*7+'px');
    });
    mask.addEventListener('pointerleave', () => { drift.style.setProperty('--thumb-x','0px'); drift.style.setProperty('--thumb-y','0px'); });
    return true;
  }
  if (root && !refineOrbit()) {
    const ready = new MutationObserver(() => { if (refineOrbit()) ready.disconnect(); });
    ready.observe(root, {childList:true,subtree:true});
  }

  // Replace the old character-based button and its listener in this draft only.
  const oldToggle = document.querySelector('.marquee-toggle');
  if (oldToggle) {
    const toggle = oldToggle.cloneNode(false);
    toggle.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path class="marquee-pause" d="M5 3h3v14H5zM12 3h3v14h-3z"/><path class="marquee-play" d="M5 2.5 17 10 5 17.5Z"/></svg>';
    oldToggle.replaceWith(toggle);
    toggle.addEventListener('click', () => {
      const paused = toggle.closest('.sport-strip').classList.toggle('is-paused');
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Resume marquee' : 'Pause marquee');
    });
  }

  const hero = document.querySelector('.hero');
  let revealed = !window.__tcIntroPending, lastY = scrollY, trend = 0, heroFrame = 0;
  function heroMotion() {
    heroFrame = 0;
    const y = scrollY, delta = y-lastY; lastY = y;
    const box = hero.getBoundingClientRect();
    if (Math.sign(delta) !== Math.sign(trend)) trend = delta; else trend += delta;
    if (!revealed || reduced.matches) return;
    if (y <= 12) { hero.classList.remove('hero-art-out'); trend = 0; }
    else if (Math.abs(trend) > 12) {
      hero.classList.toggle('hero-art-out', trend > 0 || box.bottom <= 0);
      trend = 0;
    }
  }
  const queueHero = () => { if (!heroFrame) heroFrame = requestAnimationFrame(heroMotion); };
  hero.classList.toggle('hero-art-out', !revealed || scrollY > 12);
  window.addEventListener('tc:reveal', () => {
    revealed = true; lastY = scrollY;
    requestAnimationFrame(() => hero.classList.toggle('hero-art-out', scrollY > 12));
  }, {once:true});
  window.addEventListener('scroll', queueHero, {passive:true});
  reduced.addEventListener('change', queueHero);

  const facility = document.querySelector('.facility');
  if (facility && 'IntersectionObserver' in window) {
    facility.classList.add('court-motion-ready');
    const courts = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-court-visible', entry.isIntersecting));
    }, {threshold:0,rootMargin:'0px 0px -12% 0px'});
    facility.querySelectorAll('.facility-court').forEach(court => courts.observe(court));
  }
})();
