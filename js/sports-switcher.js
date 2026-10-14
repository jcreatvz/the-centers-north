/* Progressive Cards / Orbit presentation. Existing cards are the content source. */
(() => {
  'use strict';
  const section = document.querySelector('#sports');
  if (!section) return;
  const stage = section.querySelector('.sports-view-stage');
  const controls = section.querySelector('.sports-view-controls');
  const tabs = [...controls.querySelectorAll('[data-sports-view]')];
  const panels = { cards: section.querySelector('#sports-panel-cards'), orbit: section.querySelector('#sports-panel-orbit') };
  const root = section.querySelector('#home-sport-orbit');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.createElement('div'); header.className = 'sports-shared-head';
  header.append(section.querySelector('.section-intro'), controls);
  // The shared heading never enters either animated/hidden panel. Its scroll
  // observer and font fitter therefore retain one stable layout in both views.
  const shell = document.createElement('div'); shell.className = 'sports-section-shell so-stage';
  section.prepend(shell); shell.append(header, stage);
  section.classList.add('sports-enhanced');
  function placeHeader() { section.dataset.sportsView = view; }
  const content = Object.fromEntries([...section.querySelectorAll('.sport-card')].map(card => {
    const link = card.querySelector('.sport-visual'), image = link.querySelector('img');
    const title = link.querySelector('h3').textContent.trim();
    return [title.toLowerCase(), { title, description: card.querySelector('.sport-copy>p:not(.eyebrow)').textContent.trim(), url: link.href, newTab: link.target === '_blank', image: image.getAttribute('src'), alt: image.alt, label: card.querySelector('.sport-copy .eyebrow').textContent.trim(), courts: card.querySelector('.court-tag').textContent.trim() }];
  }));
  const scripts = new Map();
  let view = 'cards', orbit = null, loading = null, revision = 0, animations = [];
  function loadScript(path) {
    if (scripts.has(path)) return scripts.get(path);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = path;
      script.onload = resolve;
      script.onerror = () => { scripts.delete(path); script.remove(); reject(new Error('Could not load ' + path)); };
      document.head.append(script);
    });
    scripts.set(path, promise); return promise;
  }
  function decorateOrbit() {
    const backdrop = document.createElement('div'); backdrop.className = 'so-home-backdrops'; backdrop.setAttribute('aria-hidden', 'true');
    const photos = new Map();
    for (const [type, sport] of Object.entries(content)) {
      const image = new Image(); image.src = sport.image; image.alt = ''; image.decoding = 'async'; photos.set(type, image); backdrop.append(image);
    }
    orbit.stage.prepend(backdrop);
    const detail = root.querySelector('.so-detail');
    const thumb = new Image(); thumb.className = 'so-detail-thumb'; thumb.width = 600; thumb.height = 600;
    const mask = document.createElement('div'); mask.className = 'so-detail-image'; mask.append(thumb);
    const detailContent = document.createElement('div'); detailContent.className = 'so-detail-content';
    detailContent.append(mask);
    const meta = document.createElement('div'); meta.className = 'so-detail-meta';
    const audience = document.createElement('span'), courts = document.createElement('span'); meta.append(audience, courts);
    detailContent.append(meta, orbit.titleEl, orbit.descEl, orbit.linkEl);
    detail.prepend(detailContent);
    // The homepage already owns the shared H2, so the standalone title is unnecessary.
    root.querySelector('.so-title').replaceChildren();
    root.querySelector('.so-topbar').hidden = true;
    orbit.stage.append(root.querySelector('.so-bottom-right'));
    const hint = document.createElement('h2'); hint.className = 'so-home-hint'; hint.textContent = 'Choose a ball.'; orbit.stage.append(hint);
    placeHeader();

    let previous = null;
    function show(type) {
      const chosen = content[type] ? type : previous || 'basketball';
      if (chosen !== type) { orbit.select(chosen); return; }
      const sport = content[chosen];
      if (chosen !== previous) {
        thumb.src = sport.image; thumb.alt = sport.alt;
        audience.textContent = sport.label; courts.textContent = sport.courts;
        photos.forEach((image, key) => image.classList.toggle('is-active', key === chosen));
        previous = chosen;
      }
      orbit.resize();
    }
    root.addEventListener('sportorbit:select', event => show(event.detail.type));
    // Keyboard selectors preview a sport before Enter/Space is needed to follow its link.
    root.querySelector('.so-sports').addEventListener('focusin', event => {
      const chip = event.target.closest('[data-type]'); if (chip) orbit.select(chip.dataset.type);
    });
    // Keep controls stable; animate only the changing image/copy, with a brief outgoing snapshot.
    const select = orbit.select.bind(orbit);
    let detailAnimations = [], ghost = null;
    function clearDetailMotion() {
      detailAnimations.forEach(a => a.cancel()); detailAnimations = [];
      ghost?.remove(); ghost = null;
    }
    orbit.select = type => {
      const chosen = content[type] ? type : previous || 'basketball';
      if (chosen === previous) return select(chosen);
      clearDetailMotion();
      const outgoing = previous ? detailContent.cloneNode(true) : null;
      select(chosen);
      if (reduced.matches || !detailContent.animate) return;
      if (outgoing) {
        ghost = outgoing; ghost.classList.add('so-detail-ghost'); ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
        ghost.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        ghost.querySelectorAll('a').forEach(el => { el.removeAttribute('href'); el.tabIndex = -1; });
        detail.append(ghost);
        const snapshot = ghost;
        const leave = ghost.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-16px)' }], { duration: 150, easing: 'ease-out', fill: 'both' });
        leave.finished.then(() => snapshot.remove()).catch(() => {}); detailAnimations.push(leave);
      }
      detailAnimations.push(detailContent.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' }));
      detailAnimations.push(thumb.animate([{ transform: 'translateY(102%) scale(1.035)' }, { transform: 'translateY(0) scale(1)' }], { duration: 460, easing: 'cubic-bezier(.16,1,.3,1)' }));
      detailAnimations.forEach(a => a.finished.catch(() => {}));
    };
    reduced.addEventListener('change', clearDetailMotion);
    orbit.select('basketball');
    root.querySelector('.so-description').id = 'orbit-sport-description';
    orbit.linkEl.setAttribute('aria-describedby', 'orbit-sport-description');
  }
  async function ensureOrbit() {
    if (orbit) return orbit;
    if (loading) return loading;
    loading = (async () => {
      try {
        await Promise.all([loadScript('orbit/vendor/three.js'), loadScript('orbit/assets/sport-assets.js')]);
        await loadScript('orbit/sport-orbit.js');
        const oldHeight = panels.orbit.getBoundingClientRect().height;
        orbit = new window.SportOrbit(root, { storageKey: null, showControls: false, cameraZoom: 1.15, background: '#ffffff', ringColor: '#00857a', sports: content });
        decorateOrbit(); orbit.setSuspended(view !== 'orbit');
        if (view === 'orbit' && !stage.classList.contains('is-switching') && !reduced.matches && stage.animate) {
          stage.style.height = oldHeight + 'px'; stage.classList.add('is-switching');
          const id = ++revision;
          animations = [stage.animate([{ height: oldHeight + 'px' }, { height: panels.orbit.getBoundingClientRect().height + 'px' }], { duration: 360, easing: 'ease-out', fill: 'both' })];
          animations[0].finished.then(() => settle(id)).catch(() => {});
        }
        return orbit;
      } catch (error) {
        console.error('Sports view:', error);
        orbit?.destroy(); orbit = null;
        root.replaceChildren();
        const fallback = document.createElement('div'); fallback.className = 'sports-orbit-loading';
        const message = document.createElement('p'); message.textContent = 'Orbit could not load. You can still explore every sport in Cards.';
        const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Try Orbit again'; retry.onclick = () => { loading = null; ensureOrbit(); };
        const back = document.createElement('button'); back.type = 'button'; back.textContent = 'Show Cards'; back.onclick = () => switchView('cards');
        fallback.append(message, retry, back); root.append(fallback);
        return null;
      }
    })();
    return loading;
  }
  function settle(id, resized = false) {
    if (id !== revision) return;
    const actual = panels[view].getBoundingClientRect().height, held = stage.getBoundingClientRect().height;
    if (!resized && stage.classList.contains('is-switching') && !reduced.matches && stage.animate && Math.abs(actual - held) > 2) {
      const correction = stage.animate([{height: held + 'px'}, {height: actual + 'px'}], {duration: 200, easing: 'ease-out', fill: 'both'});
      animations.push(correction); correction.finished.then(() => settle(id, true)).catch(() => {}); return;
    }
    for (const [name, panel] of Object.entries(panels)) { panel.hidden = name !== view; panel.inert = name !== view; panel.style.removeProperty('opacity'); panel.style.removeProperty('transform'); }
    animations.forEach(animation => animation.cancel()); animations = [];
    stage.classList.remove('is-switching'); stage.style.removeProperty('height');
    orbit?.setSuspended(view !== 'orbit');
    // Refresh card scroll positions without forcing every heading to refit.
    window.dispatchEvent(new Event('scroll'));
  }
  function switchView(next, instant = false) {
    if (!panels[next] || next === view) return;
    const id = ++revision, outgoing = panels[view], incoming = panels[next];
    const fromHeight = stage.getBoundingClientRect().height;
    const current = Object.fromEntries(Object.entries(panels).map(([name, panel]) => {
      const css = getComputedStyle(panel); return [name, { opacity: panel.hidden ? 0 : Number(css.opacity), transform: panel.hidden ? 'translateY(28px)' : css.transform }];
    }));
    animations.forEach(animation => animation.cancel()); animations = [];
    view = next;
    placeHeader();
    tabs.forEach(tab => { const selected = tab.dataset.sportsView === view; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    if (outgoing.contains(document.activeElement)) tabs.find(tab => tab.dataset.sportsView === next).focus();
    outgoing.inert = true; incoming.hidden = false; incoming.inert = false;
    orbit?.setSuspended(view !== 'orbit');
    stage.style.height = fromHeight + 'px'; stage.classList.add('is-switching');
    const toHeight = incoming.getBoundingClientRect().height;
    if (view === 'orbit') ensureOrbit();
    if (instant || reduced.matches || typeof stage.animate !== 'function') { settle(id); return; }
    const options = { duration: 620, easing: 'cubic-bezier(.22,.72,.18,1)', fill: 'both' };
    const direction = next === 'orbit' ? 1 : -1;
    animations = [
      stage.animate([{ height: fromHeight + 'px' }, { height: toHeight + 'px' }], options),
      outgoing.animate([{ opacity: current[next === 'orbit' ? 'cards' : 'orbit'].opacity, transform: current[next === 'orbit' ? 'cards' : 'orbit'].transform }, { opacity: 0, transform: `translateY(${-24 * direction}px)` }], { ...options, duration: 360 }),
      incoming.animate([{ opacity: current[next].opacity, transform: current[next].opacity ? current[next].transform : `translateY(${28 * direction}px)` }, { opacity: 1, transform: 'translateY(0)' }], options)
    ];
    Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => settle(id));
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => switchView(tab.dataset.sportsView));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[target].focus(); switchView(tabs[target].dataset.sportsView);
    });
  });
  reduced.addEventListener('change', () => { if (stage.classList.contains('is-switching')) settle(revision); });
  controls.hidden = false;
  switchView('orbit', true);
  // Reusable presentation API; the visible tabs remain the primary control.
  window.centersSports = { switchView, get view() { return view; }, get orbit() { return orbit; } };
})();
