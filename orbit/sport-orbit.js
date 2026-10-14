/* Sport Orbit · original implementation. Three.js is distributed under MIT. */
(function () {
  'use strict';
  const T = window.SPORT_THREE;
  const BRAND_LOGO = window.TC_BRAND_LOGO || new URL('assets/centers-north-header.svg', document.currentScript?.src || document.baseURI).href;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, rate, dt) => mix(a, b, 1 - Math.exp(-rate * dt));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 4);
  const clone = v => JSON.parse(JSON.stringify(v));
  const TYPES = ['pickleball', 'volleyball', 'basketball'];
  const DEFAULTS = {
    "counts": {
      "pickleball": 1,
      "volleyball": 1,
      "basketball": 1
    },
    "orbit": 0.72,
    "spin": 1.5,
    "scroll": 0.95,
    "inertia": 1.5,
    "maxBoost": 2.5,
    "spacing": 4,
    "size": 1.15,
    "intro": "#f5f4ec",
    "background": "#002124",
    "glow": true,
    "introSpin": 0.32,
    "entranceDuration": 0.8,
    "splitDuration": 1.1,
    "transitionSoftness": 0.45,
    "introZoom": 1.05,
    "cameraZoom": 1.8,
    "ringEnabled": true,
    "ringGlow": true,
    "ringColor": "#ffffff",
    "ringThickness": 0.05,
    "ringOffset": 1.2,
    "logoSize": 0.8,
    "logoRotation": 0,
    "logoX": 0.25,
    "logoY": 0.5,
    "introMode": "logo",
    "introImage": "",
    "keepBrand": false,
    "showControls": true,
    "sports": {
      "pickleball": {
        "title": "Pickleball",
        "description": "Drop in. Find your rally.",
        "url": "#pickleball",
        "color": "#7e9400",
        "newTab": false,
        "skin": "",
        "skinBlend": 1,
        "skinTint": 1
      },
      "volleyball": {
        "title": "Volleyball",
        "description": "Bring your team.",
        "url": "#volleyball",
        "color": "#e7a0a0",
        "newTab": false,
        "skin": "",
        "skinBlend": 0.85,
        "skinTint": 1
      },
      "basketball": {
        "title": "Basketball",
        "description": "Make the court yours.",
        "url": "#basketball",
        "color": "#dc6326",
        "newTab": false,
        "skin": "",
        "skinBlend": 0.95,
        "skinTint": 0.65
      }
    },
    "storageKey": "tc-sport-orbit-v5"
  };
  function safeURL(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try { const url = new URL(value.trim(), document.baseURI); return ['http:', 'https:', 'file:'].includes(url.protocol) ? value.trim() : ''; } catch { return ''; }
  }
  function cleanConfig(input = {}) {
    const out = clone(DEFAULTS);
    for (const [key, min, max] of [['introZoom', .35, 3], ['cameraZoom', .35, 3], ['ringThickness', .01, .25], ['ringOffset', -3, 4]]) if (Number.isFinite(Number(input[key]))) out[key] = clamp(Number(input[key]), min, max);
    for (const key of ['ringEnabled', 'ringGlow']) if (typeof input[key] === 'boolean') out[key] = input[key];
    if (/^#[0-9a-f]{6}$/i.test(input.ringColor || '')) out.ringColor = input.ringColor;
    for (const [key, min, max] of [['orbit', 0, 1.2], ['spin', 0, 2.5], ['scroll', 0, 3], ['inertia', .2, 2], ['maxBoost', .5, 5], ['spacing', 2.1, 4.8], ['size', .55, 1.25], ['introSpin', 0, 1.2], ['entranceDuration', .6, 2.5], ['splitDuration', .35, 1.6], ['transitionSoftness', .3, .9], ['logoSize', .3, 1.4], ['logoRotation', -180, 180], ['logoX', 0, 1], ['logoY', .15, .85]]) {
      if (Number.isFinite(Number(input[key]))) out[key] = clamp(Number(input[key]), min, max);
    }
    for (const key of ['intro', 'background']) if (/^#[0-9a-f]{6}$/i.test(input[key] || '')) out[key] = input[key];
    for (const key of ['glow', 'showControls', 'keepBrand']) if (typeof input[key] === 'boolean') out[key] = input[key];
    if (['logo', 'skin'].includes(input.introMode)) out.introMode = input.introMode;
    if (typeof input.introImage === 'string' && input.introImage.length <= 6000000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.introImage)) out.introImage = input.introImage;
    if (input.storageKey === null || typeof input.storageKey === 'string') out.storageKey = input.storageKey;
    if (input.counts) {
      let room = 12;
      for (const type of TYPES) {
        out.counts[type] = clamp(Math.floor(Number(input.counts[type]) || 0), 0, room);
        room -= out.counts[type];
      }
      if (room === 12) out.counts.pickleball = 1;
    }
    for (const type of TYPES) {
      const item = input.sports?.[type]; if (!item) continue;
      for (const key of ['title', 'description']) if (typeof item[key] === 'string') out.sports[type][key] = item[key].slice(0, key === 'title' ? 50 : 250);
      if ('url' in item) out.sports[type].url = safeURL(item.url);
      if (/^#[0-9a-f]{6}$/i.test(item.color || '')) out.sports[type].color = item.color;
      if (typeof item.newTab === 'boolean') out.sports[type].newTab = item.newTab;
      if (typeof item.skin === 'string' && item.skin.length <= 6000000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(item.skin)) out.sports[type].skin = item.skin;
      for (const key of ['skinBlend', 'skinTint']) if (Number.isFinite(Number(item[key]))) out.sports[type][key] = clamp(Number(item[key]), 0, 1);
    }
    return out;
  }
  function ringRadius(count, spacing) { return count <= 1 ? 0 : Math.max(spacing, count * .49); }
  function fitDistance(count, aspect, size, spacing) {
    const radius = ringRadius(count, spacing), edge = radius + size * 1.22;
    return Math.max(8.6, edge / (Math.tan(35 * Math.PI / 360) * Math.max(.25, aspect) * .82), edge * 2.8);
  }
  function introState(time, cfg) {
    const splitAt = cfg.entranceDuration + .45;
    const opening = easeOut((time - splitAt) / cfg.splitDuration);
    return { splitAt, opening, rise: easeOut(time / cfg.entranceDuration),
      reveal: smooth(splitAt + cfg.splitDuration * .18, splitAt + cfg.splitDuration * (.18 + cfg.transitionSoftness), time),
      spin: Math.min(time, splitAt) * cfg.introSpin + opening * Math.PI * 1.35,
      camera: smooth(splitAt, splitAt + cfg.splitDuration + .55, time) };
  }
  window.SportOrbitMath = { clamp, damp, smooth, ringRadius, fitDistance, cleanConfig, safeURL, introState };
  const icons = {
    arrow: '<svg class="so-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M4 16 16 4M4 4h12v12"/></svg>',
    sliders: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 5h14M3 10h14M3 15h14"/><path d="M7 2v6M13 7v6M8 12v6" stroke-width="3"/></svg>',
    replay: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 7a7 7 0 1 1-1 5M4 2v5h5"/></svg>',
    pause: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 4h2v12H6zM12 4h2v12h-2z"/></svg>',
    play: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="m6 3 11 7-11 7z"/></svg>'
  };
  class SportOrbit {
    constructor(root, options = {}) {
      if (!root) throw new Error('SportOrbit needs a section element.');
      this.root = root; this.root.classList.add('sport-orbit');
      this.abort = new AbortController(); this.cleanups = []; this.resources = new Set(); this.models = {};
      let saved = {}; const key = options.storageKey === undefined ? DEFAULTS.storageKey : options.storageKey;
      try { if (key) saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
      this.config = cleanConfig({ ...saved, ...options, counts: { ...(saved.counts || DEFAULTS.counts), ...options.counts }, sports: Object.fromEntries(TYPES.map(t => [t, { ...DEFAULTS.sports[t], ...saved.sports?.[t], ...options.sports?.[t] }])) });
      this.reducedQuery = matchMedia('(prefers-reduced-motion: reduce)'); this.reduced = this.reducedQuery.matches;
      this.elapsed = this.reduced ? 7 : 0; this.rotation = 0; this.ballRotation = 0; this.direction = 1; this.boost = 0; this.velocity = this.config.orbit; this.spinVelocity = this.config.spin;
      this.paused = false; this.suspended = false; this.inView = false; this.selected = null; this.hovered = false; this.lastScrollY = window.scrollY; this.lastScrollAt = performance.now();
      this.renderUI(); this.bindUI(); this.renderControls(); this.applyTheme();
      try { this.init3D(); this.rebuild(); } catch (error) { console.error('Sport Orbit:', error); this.showFallback(); }
      this.observe(); this.raf = requestAnimationFrame(this.frame.bind(this));
    }
    own(resource) { this.resources.add(resource); return resource; }
    on(target, event, handler, options = {}) { target.addEventListener(event, handler, { ...options, signal: this.abort.signal }); }
    renderUI() {
      this.root.innerHTML = `<div class="so-stage">
        <header class="so-topbar"><a class="so-brand" href="#sport-orbit" aria-label="The Centers North"><img src="${BRAND_LOGO}" alt="The Centers North" width="459" height="400"></a><button class="so-controls-toggle" aria-expanded="false">${icons.sliders} Controls</button></header>
        <div class="so-title"><h1>YOUR GAME.<br><span>CENTERED.</span></h1></div>
        <div class="so-canvas" aria-hidden="true"></div><div class="so-targets" aria-label="Choose a sports ball"></div>
        <div class="so-fallback" hidden>3D is unavailable on this device.<br>You can still explore each sport below.</div>
        <div class="so-bottom"><div class="so-detail"><h2 hidden></h2><p class="so-description"></p><a class="so-detail-link" hidden><span>Explore</span>${icons.arrow}</a><div class="so-sports"></div></div>
          <div class="so-bottom-right"><div class="so-actions"><button class="so-icon-button so-replay" aria-label="Replay entrance" title="Replay entrance">${icons.replay}</button><button class="so-icon-button so-pause" aria-label="Pause motion" title="Pause motion">${icons.pause}</button></div><div class="so-scroll-hint"><b aria-hidden="true">↓</b><span>Scroll</span></div></div></div>
        <div class="so-progress" aria-hidden="true"><i></i></div>
        <aside class="so-panel" aria-label="Animation controls" hidden></aside>
      </div>`;
      this.stage = this.root.querySelector('.so-stage'); this.mount = this.root.querySelector('.so-canvas'); this.targets = this.root.querySelector('.so-targets'); this.panel = this.root.querySelector('.so-panel');
      this.titleEl = this.root.querySelector('.so-detail h2'); this.descEl = this.root.querySelector('.so-description'); this.linkEl = this.root.querySelector('.so-detail-link');
      this.progressEl = this.root.querySelector('.so-progress i');
      this.root.querySelector('.so-controls-toggle').hidden = !this.config.showControls;
      this.renderChips(); this.select(null);
    }
    renderChips() {
      const group = this.root.querySelector('.so-sports'); group.replaceChildren();
      TYPES.filter(t => this.config.counts[t] > 0).forEach(type => {
        const button = document.createElement('button'); button.className = 'so-sport-chip'; button.style.setProperty('--chip', this.config.sports[type].color);
        button.dataset.type = type; button.setAttribute('aria-pressed', 'false');
        button.append(document.createElement('i'), document.createTextNode(this.config.sports[type].title));
        group.append(button);
      });
    }
    bindUI() {
      this.on(this.root.querySelector('.so-controls-toggle'), 'click', () => this.togglePanel());
      this.on(this.root.querySelector('.so-replay'), 'click', () => this.replay());
      this.on(this.root.querySelector('.so-pause'), 'click', () => { this.paused = !this.paused; this.needsRender = true; this.updatePause(); });
      this.on(this.root.querySelector('.so-sports'), 'click', e => { const b = e.target.closest('[data-type]'); if (b) this.select(b.dataset.type); });
      this.on(this.stage, 'pointerdown', e => { if (e.target === this.mount || e.target.tagName === 'CANVAS') this.select(null); });
      this.on(document, 'keydown', e => { if (e.key === 'Escape') { this.togglePanel(false); this.select(null); } });
      this.on(this.reducedQuery, 'change', e => { this.reduced = e.matches; if (this.reduced) this.elapsed = 7; this.needsRender = true; });
      this.on(window, 'scroll', () => {
        const now = performance.now(), dy = window.scrollY - this.lastScrollY, dt = Math.max(16, now - this.lastScrollAt);
        this.lastScrollY = window.scrollY; this.lastScrollAt = now;
        if (Math.abs(dy) > .3 && !this.suspended && this.inView && !this.reduced && !this.paused) {
          this.direction = Math.sign(dy);
          this.boost = Math.min(this.config.maxBoost, Math.abs(dy / dt) * this.config.scroll * 1.1);
        }
        this.updateProgress();
      }, { passive: true });
      this.on(document, 'visibilitychange', () => { this.lastTime = performance.now(); this.boost = 0; });
    }
    init3D() {
      if (!T) throw new Error('Three.js could not be loaded.');
      this.scene = new T.Scene(); this.camera = new T.PerspectiveCamera(35, 1, .1, 100);
      this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(max-width:700px)').matches ? 1.5 : 2));
      this.renderer.setClearColor(0, 0); this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.12;
      this.mount.append(this.renderer.domElement);
      this.on(this.renderer.domElement, 'webglcontextlost', e => { e.preventDefault(); this.contextLost = true; this.showFallback(); });
      this.on(this.renderer.domElement, 'webglcontextrestored', () => { this.contextLost = false; this.failed = false; this.root.querySelector('.so-fallback').hidden = true; this.targets.hidden = false; this.root.querySelector('.so-actions').hidden = false; this.replay(); });
      this.scene.add(new T.HemisphereLight('#e8efff', '#222638', 2.2));
      const key = new T.DirectionalLight('#fff4df', 4.1); key.position.set(-4, 7, 6); this.scene.add(key);
      const rim = new T.DirectionalLight('#7b9dff', 3.0); rim.position.set(5, 2, -4); this.scene.add(rim);
      const fill = new T.DirectionalLight('#ffffff', .6); fill.position.set(1, -2, 6); this.scene.add(fill);
      const envScene = new T.Scene(); envScene.background = new T.Color('#525b72');
      [[-4, 5, 4, 7, 5, '#ffffff'], [5, 1, -2, 3, 6, '#ccd9ff'], [0, 7, -4, 6, 3, '#fff4e1']].forEach(([x, y, z, w, h, color]) => {
        const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color, side: T.DoubleSide })); mesh.position.set(x, y, z); mesh.lookAt(0, 0, 0); envScene.add(mesh);
      });
      const pmrem = new T.PMREMGenerator(this.renderer); this.env = this.own(pmrem.fromScene(envScene, .04)); this.scene.environment = this.env.texture; pmrem.dispose();
      envScene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
      this.sphere = this.own(new T.SphereGeometry(1, 64, 40));
      this.orbitGroup = new T.Group(); this.scene.add(this.orbitGroup);
      this.introCanvas = document.createElement('canvas'); this.introCanvas.width = 2048; this.introCanvas.height = 1024;
      this.introTexture = this.own(new T.CanvasTexture(this.introCanvas)); this.introTexture.colorSpace = T.SRGBColorSpace;
      this.introTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this.introMaterial = this.own(new T.MeshStandardMaterial({ color: '#ffffff', map: this.introTexture, roughness: .43, metalness: 0 }));
      this.hero = new T.Mesh(this.sphere, this.introMaterial); this.scene.add(this.hero);
      this.pickDirections = Array.from({ length: 40 }, (_, i) => {
        const y = 1 - 2 * (i + .5) / 40, a = i * Math.PI * (3 - Math.sqrt(5)), r = Math.sqrt(1 - y * y);
        return new T.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      });
      this.materials = {};
      for (const type of TYPES) this.materials[type] = this.makeMaterial(type, false, !!window.SPORT_MODELS?.[type]);
      this.initBundledModels();
      this.pickInner = this.makeMaterial('pickleball', true);
      this.pickWalls = this.makePickleWalls();
      this.initRing();
      this.modelsReady = false;
      Promise.all(TYPES.map(type => this.refreshSportSkin(type))).finally(() => { if (!this.destroyed) { this.modelsReady = true; this.replay(); } });
      this.refreshIntroTexture();
      this.resize();
    }
    initBundledModels() {
      const array = (value, C) => { const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0)); return new C(bytes.buffer); };
      for (const type of ['volleyball', 'basketball']) {
        const asset = window.SPORT_MODELS?.[type]; if (!asset) continue;
        const geometry = this.own(new T.BufferGeometry());
        geometry.setAttribute('position', new T.BufferAttribute(array(asset.position, Float32Array), 3));
        geometry.setAttribute('normal', new T.BufferAttribute(array(asset.normal, Float32Array), 3));
        geometry.setAttribute('uv', new T.BufferAttribute(array(asset.uv, Float32Array), 2));
        geometry.setIndex(new T.BufferAttribute(array(asset.index, asset.index32 ? Uint32Array : Uint16Array), 1));
        geometry.computeBoundingSphere();
        this.models[type] = new T.Mesh(geometry, this.materials[type]);
      }
    }
    makeMaterial(type, inner = false, modeled = false) {
      const mat = this.own(new T.MeshStandardMaterial({ color: '#ffffff', roughness: modeled ? .995 : type === 'pickleball' ? .43 : .68, metalness: 0, side: inner ? T.BackSide : T.FrontSide }));
      mat.userData.reveal = { value: 0 }; mat.userData.color = { value: new T.Color(this.config.sports[type].color) }; mat.userData.intro = { value: new T.Color(this.config.intro) };
      mat.userData.skin = { value: this.introTexture }; mat.userData.skinBlend = { value: 0 }; mat.userData.skinTint = { value: 0 };
      mat.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, { uReveal: mat.userData.reveal, uSportColor: mat.userData.color, uIntro: mat.userData.intro, uHoles: { value: this.pickDirections }, uIntroMap: { value: this.introTexture } });
        Object.assign(shader.uniforms, { uSkin: mat.userData.skin, uSkinBlend: mat.userData.skinBlend, uSkinTint: mat.userData.skinTint });
        shader.vertexShader = 'varying vec3 vSportPosition; varying vec2 vSportUv;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSportPosition = position; vSportUv = uv;');
        if (modeled) {
          shader.vertexShader = 'uniform float uReveal;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace('vSportPosition = position;', 'transformed=mix(normalize(position),position,uReveal); vSportPosition = position;');
        }
        shader.fragmentShader = `varying vec3 vSportPosition; varying vec2 vSportUv;
uniform float uReveal; uniform vec3 uSportColor; uniform vec3 uIntro; uniform vec3 uHoles[40]; uniform sampler2D uIntroMap;
uniform sampler2D uSkin; uniform float uSkinBlend; uniform float uSkinTint;
float sportHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float sportNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(sportHash(i),sportHash(i+vec3(1,0,0)),f.x),mix(sportHash(i+vec3(0,1,0)),sportHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(sportHash(i+vec3(0,0,1)),sportHash(i+vec3(1,0,1)),f.x),mix(sportHash(i+vec3(0,1,1)),sportHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 sportBump(vec3 surfPos,vec3 surfNorm,float height){vec3 dx=dFdx(surfPos),dy=dFdy(surfPos);vec3 r1=cross(dy,surfNorm),r2=cross(surfNorm,dx);float det=dot(dx,r1);vec3 grad=sign(det)*(dFdx(height)*r1+dFdy(height)*r2);return normalize(abs(det)*surfNorm-grad);}
` + shader.fragmentShader;
        let code = '';
        if (type === 'pickleball') code = `
float cut=cos(.139*uReveal); if(uReveal>.01){for(int i=0;i<40;i++){if(dot(n,uHoles[i])>cut)discard;}}
float grain=sportNoise(n*185.); sportColor=uSportColor*${inner ? '.55' : '(0.97+grain*.04)'}; sportHeight=grain*.00022;`;
        if (type === 'basketball') code = `
float channel=min(abs(n.x),abs(n.z)); channel=min(channel,abs(abs(n.y)-.69*(1.-n.z*n.z))*.72);
float seam=1.-smoothstep(.010,.023,channel); float pebble=sportNoise(n*165.); float dots=smoothstep(.3,.75,pebble);
sportColor=mix(uSportColor*(.77+.3*dots),vec3(.025,.019,.016),seam); sportHeight=(dots*.0015-seam*.014);`;
        if (type === 'volleyball') code = `
vec3 an=abs(n); vec2 uv; float face;
if(an.x>an.y&&an.x>an.z){uv=n.zy/an.x;face=n.x>0.?0.:1.;}
else if(an.y>an.z){uv=n.xz/an.y;face=n.y>0.?2.:3.;}
else{uv=n.xy/an.z;face=n.z>0.?4.:5.;}
if(mod(face,2.)<.5)uv=uv.yx;
float warped=uv.x+.20*sin(uv.y*3.14159265)*(1.-uv.x*uv.x);
float edge=min(1.-abs(uv.x),1.-abs(uv.y)); float seamDistance=min(edge,min(abs(warped-.333),abs(warped+.333)));
float seam=1.-smoothstep(.008,.026,seamDistance); float panel=floor((warped+1.)*1.5);
vec3 panelColor=vec3(.88,.885,.84); if(mod(face+panel,4.)<1.0)panelColor=uSportColor;
sportColor=mix(panelColor,vec3(.065,.077,.10),seam*.76); float grain=sportNoise(n*240.);sportColor*=.97+grain*.04;sportHeight=grain*.0003-seam*.012;`;
        if (modeled) code = 'sportColor=uSportColor;';
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
vec3 n=normalize(vSportPosition); vec3 sportColor=vec3(1.); float sportHeight=0.;${code}
${inner ? '' : 'vec4 skin=texture2D(uSkin,vSportUv); sportColor=mix(sportColor,skin.rgb*mix(vec3(1.),uSportColor,uSkinTint),uSkinBlend*skin.a);'}
vec2 introUv=${modeled ? 'vec2(fract(atan(n.z,-n.x)/6.28318530718),1.-acos(clamp(n.y,-1.,1.))/3.14159265359)' : 'vSportUv'};
diffuseColor.rgb*=mix(texture2D(uIntroMap,introUv).rgb,sportColor,uReveal);`);
        shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(.43,roughnessFactor,uReveal);');
        shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal=sportBump(-vViewPosition,normal,sportHeight*uReveal);');
      };
      mat.customProgramCacheKey = () => `sport-orbit-${type}-${inner}-${modeled}`;
      return mat;
    }
    initRing() {
      this.ringGroup = new T.Group(); this.scene.add(this.ringGroup);
      this.ringMaterial = this.own(new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
      this.ringCore = new T.Mesh(undefined, this.ringMaterial); this.ringCore.rotation.x = -Math.PI / 2; this.ringGroup.add(this.ringCore);
      this.ringHaloMaterial = this.own(new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
        uniforms: { color: { value: new T.Color() }, opacity: { value: 0 }, radius: { value: 1 }, width: { value: .1 }, extent: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: 'varying vec2 vUv; uniform vec3 color; uniform float opacity,radius,width,extent; void main(){float d=abs(length((vUv-.5)*2.*extent)-radius);float a=exp(-pow(d/width,2.))*opacity*.42;gl_FragColor=vec4(color,a);}' }));
      this.ringHalo = new T.Mesh(this.own(new T.PlaneGeometry(2, 2)), this.ringHaloMaterial); this.ringHalo.rotation.x = -Math.PI / 2; this.ringGroup.add(this.ringHalo);
    }
    updateRing(time, count) {
      if (!this.ringGroup) return;
      const cfg = this.config, radius = ringRadius(count, cfg.spacing) || cfg.spacing, key = radius + ':' + cfg.ringThickness;
      if (key !== this.ringGeometryKey) {
        const old = this.ringCore.geometry; old.dispose(); this.resources.delete(old);
        this.ringCore.geometry = this.own(new T.TorusGeometry(radius, cfg.ringThickness / 2, 12, 160)); this.ringGeometryKey = key;
      }
      if (cfg.ringEnabled && !this.ringWasEnabled) this.ringStart = Math.max(cfg.entranceDuration + .1, time);
      this.ringWasEnabled = cfg.ringEnabled;
      const progress = this.reduced ? 1 : smooth(0, .95, time - (this.ringStart ?? cfg.entranceDuration + .1));
      this.ringGroup.visible = cfg.ringEnabled && progress > 0;
      this.ringGroup.scale.setScalar(Math.max(.001, easeOut(progress)));
      this.ringGroup.position.y = this.orbitGroup.position.y - cfg.ringOffset;
      this.ringMaterial.color.set(cfg.ringColor); this.ringMaterial.opacity = progress;
      const halo = this.ringHaloMaterial.uniforms, width = .1 + cfg.ringThickness * 1.5, extent = radius + width * 4;
      halo.color.value.set(cfg.ringColor); halo.opacity.value = progress; halo.radius.value = radius; halo.width.value = width; halo.extent.value = extent;
      this.ringHalo.scale.setScalar(extent); this.ringHalo.visible = cfg.ringGlow;
    }
    async refreshSportSkin(type) {
      const mat = this.materials?.[type]; if (!mat) return;
      const cfg = this.config.sports[type], data = mat.userData;
      data.skinTint.value = cfg.skinTint;
      const source = cfg.skin || window.SPORT_MODELS?.[type]?.texture || '';
      if (data.skinSource === source) { data.skinBlend.value = data.skinTexture ? cfg.skinBlend : 0; return; }
      data.skinSource = source; data.skinBlend.value = 0;
      if (data.skinTexture) { data.skinTexture.dispose(); this.resources.delete(data.skinTexture); data.skinTexture = null; data.skin.value = this.introTexture; }
      if (!source) return;
      try {
        const image = new Image(); image.src = source; await image.decode();
        if (this.destroyed || data.skinSource !== source) return;
        const texture = this.own(new T.Texture(image)); texture.colorSpace = T.SRGBColorSpace; texture.wrapS = T.RepeatWrapping;
        texture.wrapT = T.RepeatWrapping; texture.flipY = !window.SPORT_MODELS?.[type];
        texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate = true;
        data.skinTexture = texture; data.skin.value = texture; data.skinBlend.value = this.config.sports[type].skinBlend;
      } catch { if (data.skinSource === source) { data.skinSource = null; this.message('Skin could not load. Try another image.'); } }
    }
    makePickleWalls() {
      const positions = [], normals = [], indices = [], seg = 28, angle = .139;
      for (const direction of this.pickDirections) {
        const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), direction), start = positions.length / 3;
        for (let side = 0; side < 2; side++) for (let j = 0; j <= seg; j++) {
          const a = j / seg * Math.PI * 2, r = side ? .923 : 1;
          const v = new T.Vector3(Math.cos(a) * Math.sin(angle) * r, Math.sin(a) * Math.sin(angle) * r, Math.cos(angle) * r).applyQuaternion(q);
          const normal = new T.Vector3(-Math.cos(a), -Math.sin(a), 0).applyQuaternion(q);
          positions.push(v.x, v.y, v.z); normals.push(normal.x, normal.y, normal.z);
        }
        for (let j = 0; j < seg; j++) { const a = start + j, b = a + seg + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
      }
      const geo = this.own(new T.BufferGeometry()); geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3)); geo.setIndex(indices);
      this.wallMaterial = this.own(new T.MeshStandardMaterial({ color: this.config.sports.pickleball.color, roughness: .47, side: T.DoubleSide }));
      return geo;
    }
    makeBall(type) {
      const group = new T.Group();
      if (this.models[type]) {
        const object = this.models[type].clone(true); group.add(object); group.userData.custom = true;
      } else {
        group.add(new T.Mesh(this.sphere, this.materials[type]));
        if (type === 'pickleball') {
          const inner = new T.Mesh(this.sphere, this.pickInner); inner.scale.setScalar(.923); group.add(inner);
          const walls = new T.Mesh(this.pickWalls, this.wallMaterial); walls.userData.holeWalls = true; group.add(walls);
        }
      }
      return group;
    }
    rebuild() {
      if (!this.scene) return;
      this.orbitGroup.clear(); this.targets.replaceChildren(); this.balls = [];
      // Interleave the sports so larger counts remain visually balanced.
      for (let round = 0; round < 12; round++) for (const type of TYPES) if (this.config.counts[type] > round) {
        const group = this.makeBall(type), spin = new T.Group(); spin.add(group); this.orbitGroup.add(spin);
        group.rotation.set(type === 'basketball' ? .35 : -.25, .5, type === 'volleyball' ? .5 : -.2);
        const target = document.createElement('a'); target.className = 'so-ball-target'; target.tabIndex = -1; target.hidden = true;
        const tag = document.createElement('span'); tag.className = 'so-ball-tag'; target.append(tag); this.targets.append(target);
        const ball = { type, spin, group, target, tag, emphasis: 1 };
        this.balls.push(ball);
        // Nodes disappear on rebuild, so their handlers are garbage-collected with them.
        target.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { this.hovered = true; this.select(type); } });
        target.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') this.hovered = false; });
        target.addEventListener('focus', () => { if (!this.touchSelecting) { this.hovered = true; this.select(type); } });
        target.addEventListener('blur', () => { this.hovered = false; });
        target.addEventListener('pointerdown', e => { this.touchSelecting = e.pointerType !== 'mouse'; this.touchWasSelected = this.selected === type; });
        target.addEventListener('click', e => {
          if ((this.touchSelecting && (this.root.classList.contains('sports-orbit-home') || !this.touchWasSelected)) || !safeURL(this.config.sports[type].url)) { e.preventDefault(); this.select(type); }
          this.touchSelecting = false;
        });
      }
      this.updateLinks(); this.renderChips(); this.select(this.config.counts[this.selected] ? this.selected : null); this.resize(); this.replay();
    }
    updateLinks() {
      for (const ball of this.balls || []) {
        const sport = this.config.sports[ball.type], url = safeURL(sport.url);
        if (url) ball.target.href = url; else ball.target.removeAttribute('href');
        ball.target.target = sport.newTab ? '_blank' : '_self'; ball.target.rel = 'noopener noreferrer';
        ball.target.setAttribute('aria-label', `${sport.title}: ${sport.description}${url ? '. Open destination.' : ''}`);
        ball.tag.textContent = sport.title;
        if (url) ball.tag.insertAdjacentHTML('beforeend', icons.arrow);
      }
      this.select(this.selected);
    }
    select(type) {
      this.needsRender = true; this.selected = type; const sport = type && this.config.sports[type];
      this.titleEl.textContent = sport ? sport.title : 'Choose a ball.'; this.titleEl.hidden = false;
      this.descEl.textContent = sport ? sport.description : ''; this.descEl.hidden = !sport;
      this.root.style.setProperty('--accent', sport ? sport.color : '#00857a');
      const url = sport && safeURL(sport.url); this.linkEl.hidden = !url;
      if (url) { this.linkEl.href = url; this.linkEl.target = sport.newTab ? '_blank' : '_self'; this.linkEl.rel = 'noopener noreferrer'; this.linkEl.querySelector('span').textContent = 'Explore ' + sport.title; }
      for (const ball of this.balls || []) ball.target.classList.toggle('is-selected', ball.type === type);
      this.root.querySelectorAll('.so-sport-chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === type)));
      this.root.dispatchEvent(new CustomEvent('sportorbit:select', { detail: { type } }));
    }
    renderControls() {
      const row = (key, title, min, max, step) => `<div class="so-range"><div><label for="${this.uid}-${key}">${title}</label><output data-output="${key}"></output></div><input id="${this.uid}-${key}" type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}"></div>`;
      this.uid = this.uid || 'so-' + Math.random().toString(36).slice(2, 9);
      this.panel.innerHTML = `<div class="so-panel-head"><div><h2>Controls</h2></div><button class="so-panel-close" aria-label="Close controls">×</button></div>
        <section><h3>Ball mix <span class="so-count-total"></span></h3>${TYPES.map(t => `<div class="so-control-row"><label>${DEFAULTS.sports[t].title}</label><div class="so-stepper"><button data-count="${t}" data-change="-1" aria-label="Remove one ${t}">−</button><output data-count-output="${t}"></output><button data-count="${t}" data-change="1" aria-label="Add one ${t}">+</button></div></div>`).join('')}<small>1–12 balls. Changing the mix replays the entrance.</small></section>
        <section><h3>Motion</h3>${row('orbit', 'Orbit speed', 0, 1.2, .02)}${row('spin', 'Ball rotation', 0, 2.5, .05)}${row('scroll', 'Scroll response', 0, 3, .05)}${row('inertia', 'Momentum / glide', .2, 2, .05)}${row('maxBoost', 'Maximum scroll boost', .5, 5, .1)}</section>
        <section><h3>Intro & branding</h3><div class="so-panel-actions"><label class="so-import-label">Upload logo / skin<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-action="artwork" hidden></label><button data-action="brand-reset">TC logo</button></div><div class="so-control-row"><label for="${this.uid}-introMode">Artwork</label><select id="${this.uid}-introMode" data-setting="introMode"><option value="logo">Logo placement</option><option value="skin">Full ball skin</option></select></div>${row('logoSize', 'Logo size', .3, 1.4, .05)}${row('logoRotation', 'Logo rotation', -180, 180, 5)}${row('logoX', 'Around the ball', 0, 1, .01)}${row('logoY', 'Vertical placement', .15, .85, .01)}${row('introSpin', 'Entrance spin', 0, 1.2, .02)}${row('entranceDuration', 'Entrance duration', .6, 2.5, .05)}${row('splitDuration', 'Split duration', .35, 1.6, .05)}${row('transitionSoftness', 'Skin transition', .3, .9, .05)}<div class="so-control-row"><label for="${this.uid}-keepBrand">Keep branded ball in orbit</label><input id="${this.uid}-keepBrand" type="checkbox" data-setting="keepBrand"></div><small>Logo: PNG / SVG. Full skin: 2:1 image.</small></section>
        <section><h3>Composition</h3>${row('spacing', 'Ring spread', 2.1, 4.8, .1)}${row('size', 'Ball size', .55, 1.25, .05)}<div class="so-control-row"><label for="${this.uid}-intro">Opening sphere</label><select id="${this.uid}-intro" data-setting="intro"><option value="#f5f4ec">Soft white</option><option value="#111318">Solid black</option></select></div><div class="so-control-row"><label for="${this.uid}-background">Background</label><input id="${this.uid}-background" data-setting="background" type="color"></div><div class="so-control-row"><label for="${this.uid}-glow">Background glow</label><input id="${this.uid}-glow" data-setting="glow" type="checkbox"></div></section>
        <section><h3>Titles & destinations</h3>${TYPES.map(t => `<details><summary>${DEFAULTS.sports[t].title}</summary><div class="so-fields"><label for="${this.uid}-${t}-title">Title</label><input id="${this.uid}-${t}-title" data-sport="${t}" data-field="title" maxlength="50"><label for="${this.uid}-${t}-description">Description</label><textarea id="${this.uid}-${t}-description" data-sport="${t}" data-field="description" maxlength="250"></textarea><label for="${this.uid}-${t}-url">Link URL</label><input id="${this.uid}-${t}-url" data-sport="${t}" data-field="url" placeholder="https://yoursite.com/sport"><div class="so-control-row"><label for="${this.uid}-${t}-color">Ball colour</label><input id="${this.uid}-${t}-color" type="color" data-sport="${t}" data-field="color"></div><div class="so-control-row"><label for="${this.uid}-${t}-newTab">Open in a new tab</label><input id="${this.uid}-${t}-newTab" type="checkbox" data-sport="${t}" data-field="newTab"></div></div></details>`).join('')}<small>Draft links open the example sport sections below. Replace them with your own URLs.</small></section>
        <div class="so-panel-actions"><button data-action="export">Export settings ↓</button><label class="so-import-label">Import<input type="file" accept="application/json,.json" data-action="import" hidden></label><button data-action="reset">Reset</button></div><p class="so-status" role="status"></p>`;
      this.syncControls();
      // Bind once to the stable panel; contents are replaced only on initialization.
      const extra = document.createElement('div');
      extra.innerHTML = `<section><h3>Camera</h3>${row('introZoom', 'Intro zoom', .35, 3, .05)}${row('cameraZoom', 'Orbit zoom', .35, 3, .05)}<small>Higher zoom can crop at the canvas edges.</small></section>
        <section><h3>Orbit ring</h3><div class="so-control-row"><label for="${this.uid}-ringEnabled">Show ring</label><input id="${this.uid}-ringEnabled" data-setting="ringEnabled" type="checkbox"></div><div class="so-control-row"><label for="${this.uid}-ringGlow">Glow</label><input id="${this.uid}-ringGlow" data-setting="ringGlow" type="checkbox"></div><div class="so-control-row"><label for="${this.uid}-ringColor">Colour</label><input id="${this.uid}-ringColor" data-setting="ringColor" type="color"></div>${row('ringThickness', 'Thickness', .01, .25, .01)}${row('ringOffset', 'Offset below balls', -3, 4, .1)}</section>
        <section><h3>Ball skins</h3>${TYPES.map(t => `<details><summary>${DEFAULTS.sports[t].title}</summary><div class="so-panel-actions"><label class="so-import-label">Upload skin<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-skin-upload="${t}" hidden></label><button data-skin-clear="${t}">${window.SPORT_MODELS?.[t] ? 'Reset skin' : 'Remove skin'}</button></div>${['skinBlend','skinTint'].map((field,i)=>`<div class="so-range"><label for="${this.uid}-${t}-${field}">${i ? 'Colour tint' : 'Skin blend'}</label><input id="${this.uid}-${t}-${field}" type="range" min="0" max="1" step=".05" data-sport="${t}" data-field="${field}"></div>`).join('')}</details>`).join('')}<small>Pickleball: 2:1 skin, holes stay open. Other balls: follow the supplied texture layout.</small></section>`;
      this.panel.querySelector(':scope > .so-panel-actions').before(extra);
      this.syncControls();
      this.on(this.panel, 'click', e => {
        if (e.target.closest('.so-panel-close')) this.togglePanel(false);
        const count = e.target.closest('[data-count]');
        if (count) { const total = Object.values(this.config.counts).reduce((a, b) => a + b, 0), delta = Number(count.dataset.change), type = count.dataset.count;
          if ((delta > 0 && total < 12) || (delta < 0 && total > 1 && this.config.counts[type] > 0)) { this.config.counts[type] += delta; this.rebuild(); this.syncControls(); this.persist(); }
        }
        const action = e.target.closest('[data-action]')?.dataset.action;
        const clearSkin = e.target.closest('[data-skin-clear]')?.dataset.skinClear;
        if (clearSkin) { this.config.sports[clearSkin].skin = ''; this.refreshSportSkin(clearSkin); this.persist(); this.message(window.SPORT_MODELS?.[clearSkin] ? 'Mapped skin restored.' : 'Skin removed.'); }
        if (action === 'export') this.exportSettings();
        if (action === 'brand-reset') { this.config.introImage = ''; this.config.introMode = 'logo'; this.config.logoSize = .8; this.config.logoRotation = 0; this.config.logoX = .25; this.config.logoY = .5; this.syncControls(); this.refreshIntroTexture(); this.persist(); this.replay(); }
        if (action === 'reset') { const storageKey = this.config.storageKey, showControls = this.config.showControls; this.config = { ...clone(DEFAULTS), storageKey, showControls }; this.applyConfig(); this.persist(); this.message('Default settings restored.'); }
      });
      this.on(this.panel, 'input', e => {
        const el = e.target, setting = el.dataset.setting;
        if (setting) { this.config[setting] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value; this.syncOutputs(); this.applyTheme(); this.updateMaterials(); if (setting === 'keepBrand') this.replay(); this.persist(); }
        if (el.dataset.sport) {
          const field = el.dataset.field; this.config.sports[el.dataset.sport][field] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : field === 'url' ? safeURL(el.value) : el.value;
          this.updateMaterials(); this.updateLinks(); this.renderChips(); this.select(this.selected); this.persist();
          if (field === 'url') this.message(el.value && !safeURL(el.value) ? 'Use an https:// URL, a relative path, or #anchor.' : 'Saved on this device.');
        }
      });
      this.on(this.panel, 'change', async e => {
        if (e.target.dataset.skinUpload) {
          try { const file = e.target.files?.[0]; if (!file) return; const type = e.target.dataset.skinUpload; this.config.sports[type].skin = await this.readArtwork(file); await this.refreshSportSkin(type); this.persist(); this.message('Skin applied.'); } catch (error) { this.message(error.message || 'Could not load this skin.'); } finally { e.target.value = ''; } return;
        }
        if (e.target.dataset.action === 'artwork') {
          try { const file = e.target.files?.[0]; if (!file) return; await this.loadArtwork(file); this.message('Artwork applied.'); } catch (error) { this.message(error.message || 'Could not load this image.'); } finally { e.target.value = ''; } return;
        }
        if (['introSpin','entranceDuration','splitDuration','transitionSoftness','introMode','intro','introZoom'].includes(e.target.dataset.setting)) this.replay();
        if (e.target.dataset.action !== 'import') return;
        try { const file = e.target.files?.[0]; if (!file) return; if (file.size > 26000000) throw new Error(); const input = JSON.parse(await file.text()); if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(); this.config = cleanConfig({ ...input, storageKey: this.config.storageKey, showControls: this.config.showControls }); this.applyConfig(); this.persist(); this.message('Settings imported.'); } catch { this.message('Could not import. Choose a Sport Orbit JSON settings file.'); } finally { e.target.value = ''; }
      });
    }
    syncOutputs() {
      this.panel.querySelectorAll('[data-output]').forEach(el => { const key = el.dataset.output; el.textContent = Number(this.config[key]).toFixed(2) + (key === 'inertia' ? ' s' : ''); });
      this.panel.querySelectorAll('[data-count-output]').forEach(el => { el.textContent = this.config.counts[el.dataset.countOutput]; });
      this.panel.querySelector('.so-count-total').textContent = ' / ' + Object.values(this.config.counts).reduce((a, b) => a + b, 0);
    }
    syncControls() {
      this.panel.querySelectorAll('[data-setting]').forEach(el => { if (el.type === 'checkbox') el.checked = this.config[el.dataset.setting]; else el.value = this.config[el.dataset.setting]; });
      this.panel.querySelectorAll('[data-sport]').forEach(el => { const value = this.config.sports[el.dataset.sport][el.dataset.field]; if (el.type === 'checkbox') el.checked = value; else el.value = value; }); this.syncOutputs();
    }
    togglePanel(open = this.panel.hidden) {
      this.panel.hidden = !open; this.root.querySelector('.so-controls-toggle').setAttribute('aria-expanded', String(open));
      if (open) this.panel.querySelector('.so-panel-close').focus();
      else if (this.panel.contains(document.activeElement)) this.root.querySelector('.so-controls-toggle').focus();
    }
    applyTheme() { this.root.style.setProperty('--stage', this.config.background); this.root.style.setProperty('--glow', this.config.glow ? 1 : 0); const hex = this.config.background.slice(1); const rgb = [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)); this.root.classList.toggle('so-dark', rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722<100); }
    updateMaterials() {
      if (!this.materials) return;
      for (const type of TYPES) { this.materials[type].userData.color.value.set(this.config.sports[type].color); this.materials[type].userData.intro.value.set(this.config.intro); this.refreshSportSkin(type); }
      this.pickInner.userData.color.value.set(this.config.sports.pickleball.color); this.pickInner.userData.intro.value.set(this.config.intro); this.wallMaterial.color.set(this.config.sports.pickleball.color); this.refreshIntroTexture();
    }
    async loadArtwork(file) {
      this.config.introImage = await this.readArtwork(file); await this.refreshIntroTexture(); this.persist(); this.replay();
    }
    async readArtwork(file) {
      if (file.size > 8000000 || !['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type)) throw new Error('Choose a PNG, JPG, WebP or SVG under 8 MB.');
      const url = URL.createObjectURL(file);
      try {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'), scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/png'); if (data.length > 6000000) throw new Error('Image is too detailed to save. Try a smaller image.');
        return data;
      } finally { URL.revokeObjectURL(url); }
    }
    async refreshIntroTexture() {
      if (!this.introCanvas) return;
      const cfg = this.config, source = cfg.introImage || (cfg.intro === '#111318' ? window.TC_BRAND_BALL_LOGO_LIGHT : window.TC_BRAND_BALL_LOGO) || BRAND_LOGO;
      const key = [source,cfg.intro,cfg.introMode,cfg.logoSize,cfg.logoRotation,cfg.logoX,cfg.logoY].join('|');
      if (key === this.textureKey) return; this.textureKey = key;
      const token = this.textureToken = (this.textureToken || 0) + 1;
      const context = this.introCanvas.getContext('2d');
      context.fillStyle = cfg.intro; context.fillRect(0, 0, 2048, 1024); this.introTexture.needsUpdate = true;
      try {
        let image = this.logoImage;
        if (this.logoSource !== source || !image) { image = new Image(); image.src = source; await image.decode(); }
        if (token !== this.textureToken || this.destroyed) return;
        this.logoImage = image; this.logoSource = source;
        if (cfg.introMode === 'skin') context.drawImage(image, 0, 0, 2048, 1024);
        else {
          const width = 2048 * .24 * cfg.logoSize, height = width * image.naturalHeight / image.naturalWidth;
          for (const wrap of [-2048, 0, 2048]) { context.save(); context.translate(2048 * cfg.logoX + wrap, 1024 * cfg.logoY); context.rotate(cfg.logoRotation * Math.PI / 180); if (!cfg.introImage && cfg.intro === '#111318') context.filter = 'brightness(0) invert(1)'; context.drawImage(image, -width / 2, -height / 2, width, height); context.restore(); }
        }
        this.introTexture.needsUpdate = true;
      } catch { this.message('Artwork could not load. The plain sphere is available.'); }
      if (token === this.textureToken) { const initial = !this.brandReady; this.brandReady = true; if (initial) this.replay(); }
    }
    applyConfig() { this.applyTheme(); this.updateMaterials(); this.syncControls(); this.rebuild(); }
    persist() { try { if (this.config.storageKey) localStorage.setItem(this.config.storageKey, JSON.stringify(this.config)); } catch { this.message('Browser storage is full. Export settings to keep your artwork.'); } }
    message(text) { this.panel.querySelector('.so-status').textContent = text; }
    exportSettings() {
      const output = clone(this.config); delete output.storageKey;
      const blob = new Blob([JSON.stringify(output, null, 2) + '\n'], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'sport-orbit-settings.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); this.message('Settings exported.');
    }
    setConfig(patch) { this.config = cleanConfig({ ...this.config, ...patch, counts: { ...this.config.counts, ...patch.counts }, sports: Object.fromEntries(TYPES.map(t => [t, { ...this.config.sports[t], ...patch.sports?.[t] }])) }); this.applyConfig(); }
    getConfig() { return clone(this.config); }
    setModel(type, object) {
      if (!TYPES.includes(type) || !object?.isObject3D) throw new Error('Provide a supported sport and a THREE.Object3D.');
      const wrapper = new T.Group(), model = object.clone(true); wrapper.add(model); model.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(model), center = bounds.getCenter(new T.Vector3()), size = bounds.getSize(new T.Vector3()), max = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(max) || max <= 0) throw new Error('Model has no measurable geometry.');
      model.position.sub(center); wrapper.scale.setScalar(2 / max); this.models[type] = wrapper; this.rebuild();
    }
    replay() { this.needsRender = true; this.ringWasEnabled = false; this.ringStart = null; this.elapsed = this.reduced ? 10 : 0; this.rotation = 0; this.ballRotation = 0; this.boost = 0; this.hovered = false; this.paused = false; this.updatePause(); }
    updatePause() { const b = this.root.querySelector('.so-pause'); b.innerHTML = this.paused ? icons.play : icons.pause; b.setAttribute('aria-label', this.paused ? 'Resume motion' : 'Pause motion'); b.setAttribute('aria-pressed', String(this.paused)); b.title = this.paused ? 'Resume motion' : 'Pause motion'; }
    observe() {
      this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.stage); this.resizeObserver.observe(this.root.querySelector('.so-bottom')); this.resizeObserver.observe(this.root.querySelector('.so-title'));
      document.fonts?.ready.then(() => { if (!this.destroyed) this.resize(); });
      this.intersection = new IntersectionObserver(entries => { this.inView = entries[0].isIntersecting; this.lastTime = performance.now(); }, { threshold: 0 }); this.intersection.observe(this.root);
      this.updateProgress();
    }
    setSuspended(value) { this.suspended = Boolean(value); this.boost = 0; this.lastTime = performance.now(); this.needsRender = true; if (!value) this.resize(); }
    resize() {
      this.needsRender = true;
      this.width = this.mount.clientWidth; this.height = this.mount.clientHeight;
      if (!this.renderer || !this.width || !this.height) return;
      const count = Object.values(this.config.counts).reduce((a, b) => a + b, 0), cap = this.width <= 700 ? (count > 6 ? 1.25 : 1.5) : (count > 8 ? 1.5 : 2);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
      this.renderer.setSize(this.width, this.height, false);
      if (this.root.classList.contains('sports-orbit-home')) {
        const dock = this.root.querySelector('.so-bottom');
        const mobile = matchMedia('(max-width:900px)').matches;
        const stageRect = this.stage.getBoundingClientRect();
        const dockRect = dock.getBoundingClientRect();
        this.safeTop = 25;
        const safeLeft = mobile ? 20 : Math.ceil(dockRect.right - stageRect.left + 35);
        this.safeHeight = Math.max(220, mobile ? dockRect.top - stageRect.top - this.safeTop - 28 : this.height - this.safeTop - 85);
        const safeWidth = Math.max(180, this.width - safeLeft - (mobile ? 20 : 85));
        this.camera.setViewOffset(safeWidth, this.safeHeight, -safeLeft, -this.safeTop, this.width, this.height);
        return;
      }
      const stageRect = this.stage.getBoundingClientRect(), titleRect = this.root.querySelector('.so-title').getBoundingClientRect();
      this.safeTop = Math.max(95, titleRect.bottom - stageRect.top + 15);
      // Reserve the expanded detail card even before hover, keeping the camera steady.
      const bottom = this.height <= 520 ? 142 : this.width <= 700 ? 205 : 195;
      this.safeHeight = Math.max(90, this.height - this.safeTop - bottom);
      this.camera.setViewOffset(this.width, this.safeHeight, 0, -this.safeTop, this.width, this.height);
    }
    updateProgress() { const rect = this.root.getBoundingClientRect(), span = Math.max(1, this.root.offsetHeight - this.stage.clientHeight); this.progressEl.style.width = clamp(-rect.top / span * 100, 0, 100) + '%'; }
    showFallback() { this.failed = true; this.root.querySelector('.so-fallback').hidden = false; this.targets.hidden = true; this.root.querySelector('.so-actions').hidden = true; }
    frame(now) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame.bind(this));
      const dt = Math.min(.05, Math.max(0, (now - (this.lastTime || now)) / 1000)); this.lastTime = now;
      if (!this.renderer || this.failed || this.suspended || !this.inView || document.hidden || this.contextLost || !this.brandReady || this.modelsReady === false) return;
      if ((this.reduced || this.paused) && !this.needsRender) return;
      this.needsRender = false;
      const cfg = this.config, active = !this.paused && !this.reduced;
      if (active) {
        this.elapsed += dt; this.boost *= Math.exp(-dt / cfg.inertia);
        const hoverSlow = this.hovered ? .12 : 1;
        this.velocity = damp(this.velocity, this.direction * (cfg.orbit + this.boost) * hoverSlow, 5, dt);
        this.spinVelocity = damp(this.spinVelocity, this.direction * (cfg.spin + this.boost * .9) * (this.hovered ? .45 : 1), 5, dt);
        if (this.elapsed > cfg.entranceDuration + .45) { this.rotation += this.velocity * dt; this.ballRotation += this.spinVelocity * dt; }
      }
      const time = this.elapsed, state = introState(time,cfg), {rise, opening, reveal} = state;
      const count = this.balls.length + (cfg.keepBrand ? 1 : 0), radius = ringRadius(count, cfg.spacing) * opening;
      const distance = fitDistance(count, this.camera.aspect, cfg.size, cfg.spacing), close = Math.max(8.5, 3.3 / this.camera.aspect);
      const d = mix(close, distance, state.camera), tilt = mix(0, .60, state.camera);
      const zoom = mix(cfg.introZoom, cfg.cameraZoom, state.camera);
      this.camera.zoom = state.camera < 1 ? zoom : damp(this.camera.zoom, zoom, 7, dt);
      this.camera.updateProjectionMatrix();
      this.camera.position.set(0, Math.sin(tilt) * d, Math.cos(tilt) * d); this.camera.lookAt(0, 0, 0);
      const lowerRoom = (this.height - this.safeTop - this.safeHeight * .5) / this.safeHeight * 2 * close * Math.tan(35 * Math.PI / 360) - cfg.size * 1.2;
      const enteringY = mix(-Math.min(3.1, Math.max(.5, lowerRoom - .12)), 0, rise);
      this.orbitGroup.position.y = enteringY; this.orbitGroup.rotation.y = -this.rotation - opening * .7;
      this.updateRing(time, count);
      for (const type of TYPES) this.materials[type].userData.reveal.value = reveal;
      this.pickInner.userData.reveal.value = reveal;
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i], slot = i + (cfg.keepBrand ? 1 : 0), angle = Math.PI / 2 + slot / count * Math.PI * 2 * opening;
        b.spin.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        b.spin.rotation.y = this.ballRotation + state.spin;
        b.emphasis = damp(b.emphasis, b.type === this.selected ? 1.07 : 1, 6, dt);
        b.spin.scale.setScalar(cfg.size * b.emphasis);
        b.spin.visible = time >= state.splitAt && (slot === 0 || opening > .015);
        b.group.children.forEach(child => { if (child.userData.holeWalls) child.visible = reveal > .997; });
      }
      // The intro and first sports shell share geometry, size, pose, UVs and lighting.
      // Hand off their opaque surface, then morph the skin as the ring separates.
      this.hero.visible = cfg.keepBrand || time < state.splitAt;
      this.hero.scale.setScalar(cfg.size);
      const heroAngle = Math.PI / 2 - this.orbitGroup.rotation.y;
      this.hero.position.set(Math.cos(heroAngle) * radius, enteringY, Math.sin(heroAngle) * radius);
      this.hero.quaternion.copy(this.orbitGroup.quaternion).multiply(this.balls[0].spin.quaternion).multiply(this.balls[0].group.quaternion);
      this.scene.updateMatrixWorld(true); this.camera.updateMatrixWorld(true);
      const vector = new T.Vector3();
      for (const b of this.balls) {
        b.spin.getWorldPosition(vector); const depth = vector.clone().applyMatrix4(this.camera.matrixWorldInverse).z; vector.project(this.camera);
        const x = (vector.x * .5 + .5) * this.width, y = (-vector.y * .5 + .5) * this.height;
        const pixels = cfg.size * b.emphasis / (Math.max(.1, -depth) * Math.tan(35 * Math.PI / 360)) * this.safeHeight * this.camera.zoom;
        b.target.style.left = (x + this.mount.offsetLeft) + 'px'; b.target.style.top = (y + this.mount.offsetTop) + 'px'; b.target.style.width = Math.max(40, pixels) + 'px'; b.target.style.height = Math.max(40, pixels) + 'px'; b.target.style.zIndex = String(Math.round(1000 + depth * 10));
        const interactive = time > state.splitAt + cfg.splitDuration; b.target.hidden = !interactive; b.target.tabIndex = interactive ? 0 : -1;
      }
      this.renderer.render(this.scene, this.camera);
    }
    destroy() {
      this.destroyed = true; cancelAnimationFrame(this.raf); this.abort.abort(); this.resizeObserver?.disconnect(); this.intersection?.disconnect();
      this.resources.forEach(r => r.dispose?.()); this.renderer?.dispose(); this.root.replaceChildren();
    }
  }
  window.SportOrbit = SportOrbit; SportOrbit.defaults = clone(DEFAULTS); SportOrbit.THREE = T;
})();
