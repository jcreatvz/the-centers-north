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
    const updateZoom = () => { orbit.config.cameraZoom = phone.matches ? 1.5 : 1.15; orbit.syncControls(); orbit.needsRender = true; orbit.resize(); };
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
  let heroBusy = false, heroTimer = 0, heroWanted = !revealed || scrollY > 12;
  function setHeroState(out) {
    heroWanted = out;
    if (heroBusy || hero.classList.contains('hero-art-out') === out) return;
    hero.classList.toggle('hero-art-out', out);
    if (reduced.matches) return;
    // Finish each 700ms slide. Rapid direction changes queue only the latest state.
    heroBusy = true;
    clearTimeout(heroTimer);
    heroTimer = setTimeout(() => { heroBusy = false; setHeroState(heroWanted); }, 700);
  }
  function heroMotion() {
    heroFrame = 0;
    const y = Math.max(0, scrollY), delta = y-lastY; lastY = y;
    if (Math.sign(delta) !== Math.sign(trend)) trend = delta; else trend += delta;
    if (!revealed) return;
    if (y <= 12) { setHeroState(false); trend = 0; }
    else if (Math.abs(trend) > 24) { setHeroState(trend > 0 || hero.getBoundingClientRect().bottom <= 0); trend = 0; }
  }
  const queueHero = () => { if (!heroFrame) heroFrame = requestAnimationFrame(heroMotion); };
  hero.classList.toggle('hero-art-out', heroWanted);
  window.addEventListener('tc:reveal', () => { revealed = true; lastY = scrollY; setHeroState(scrollY > 12); }, {once:true});
  window.addEventListener('scroll', queueHero, {passive:true});
  reduced.addEventListener('change', () => { clearTimeout(heroTimer); heroBusy=false; queueHero(); });

  const facility = document.querySelector('.facility');
  if (facility) {
    const layer = facility.querySelector('.facility-courts');
    const courts = [...layer.querySelectorAll('.facility-court')];
    const clamp = value => Math.max(0, Math.min(1, value));
    let courtFrame = 0;
    facility.classList.add('court-motion-ready');
    function paintCourts() {
      courtFrame = 0;
      const vh = innerHeight;
      // SVG elements have no offsetTop. Remove our own translation from their
      // viewport bounds to measure the fixed layout without a feedback loop.
      const geometry = courts.map(court => {
        const rect = court.getBoundingClientRect();
        const shift = reduced.matches ? 0 : parseFloat(court.style.getPropertyValue('--court-y')) || 0;
        return {court, top:rect.top-shift, height:rect.height};
      });
      for (const {court,top,height} of geometry) {
        const wasVisible = court.classList.contains('is-court-visible');
        // A small hysteresis band prevents edge chatter. CSS owns delay/duration.
        const visible = reduced.matches || (wasVisible
          ? top < vh*.98 && top+height > vh*.02
          : top < vh*.9 && top+height > vh*.1);
        court.classList.toggle('is-court-visible', visible);
        const travel = clamp((vh-top)/(vh+height));
        court.style.setProperty('--court-y', (reduced.matches ? 0 : (0.5-travel)*32).toFixed(2)+'px');
      }
    }
    function queueCourts() { if (!courtFrame) courtFrame=requestAnimationFrame(paintCourts); }
    function sizeCourts() {
      // Two/three interleaved columns, measured in the source SVG's units.
      const width=facility.clientWidth, height=facility.offsetHeight;
      const narrow=width<=760, gap=narrow?28:Math.max(32,Math.min(56,width*.035));
      const edge=narrow?16:Math.max(24,width*.025);
      const groups=narrow
        ? [['pickleball-1','volleyball-1','pickleball-2','basketball-1'],['basketball-2','pickleball-3','volleyball-2','pickleball-4']]
        : [['volleyball-1','basketball-1'],['pickleball-1','volleyball-2','pickleball-2'],['basketball-2','pickleball-3','pickleball-4']];
      const cols=groups.map(group=>group.map(key=>layer.querySelector('.court-'+key)));
      const box=court=>court.getAttribute('viewBox').split(/\s+/).map(Number);
      const colWidth=(width-edge*2-gap*(cols.length-1))/cols.length;
      const offset=narrow?24:40, verticalGap=40; // includes room for the 32px parallax travel
      let unit=Math.min(8,width/145,height/190)*1.25;
      unit=Math.min(unit,colWidth/53);
      cols.forEach((col,i)=>{
        const units=col.reduce((sum,c)=>sum+box(c)[3],0);
        unit=Math.min(unit,(height-edge*2-offset-verticalGap*(col.length-1))/units);
      });
      unit=Math.max(.5,unit);
      layer.style.setProperty('--court-unit',unit.toFixed(4)+'px');
      cols.forEach((col,i)=>{
        const start=edge+(i%2?offset:0), bottom=edge+(i%2?0:offset);
        const total=col.reduce((sum,c)=>sum+box(c)[3]*unit,0);
        const space=Math.max(verticalGap,(height-start-bottom-total)/(col.length-1));
        let y=start;
        col.forEach((court,j)=>{
          const [, , w,h]=box(court);
          court.style.setProperty('--court-x',(edge+i*(colWidth+gap)+(colWidth-w*unit)/2).toFixed(2)+'px');
          court.style.setProperty('--court-top',y.toFixed(2)+'px');
          court.style.setProperty('--court-delay',(300+i*90+j*60)+'ms');
          y+=h*unit+space;
        });
      });
      queueCourts();
    }
    new ResizeObserver(sizeCourts).observe(facility);
    window.addEventListener('scroll',queueCourts,{passive:true});
    window.addEventListener('resize',sizeCourts,{passive:true});
    window.addEventListener('pageshow',sizeCourts);
    reduced.addEventListener('change',queueCourts);
    document.fonts?.ready.then(sizeCourts);
    sizeCourts();
  }
})();
