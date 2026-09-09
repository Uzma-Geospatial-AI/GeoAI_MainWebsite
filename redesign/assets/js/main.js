(() => {
  'use strict';
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menu-toggle');
  const navigation = document.getElementById('navigation');
  const motionToggle = document.getElementById('motion-toggle');
  let scene = null;
  let paused = motionPreference.matches;
  let progress = 0;
  let triggers = [];
  let revealObserver;
  let gsapContext;
  let sceneGeneration = 0;

  function closeMenu(returnFocus = false) {
    nav.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) menuToggle.focus();
  }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('menu-open')) closeMenu(true); });
  document.addEventListener('click', event => { if (!nav.contains(event.target)) closeMenu(); });
  matchMedia('(min-width: 768px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  const topObserver = new IntersectionObserver(entries => {
    nav.classList.toggle('is-scrolled', !entries[0].isIntersecting);
  }, { rootMargin: '-85px 0px 0px 0px', threshold: 0 });
  topObserver.observe(document.querySelector('.hero-copy'));

  function updateMotionControl() {
    motionToggle.disabled = motionPreference.matches;
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.setAttribute('aria-label', motionPreference.matches ? 'Motion disabled by your device preference' : paused ? 'Resume animation' : 'Pause animation');
    document.getElementById('motion-label').textContent = motionPreference.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
    document.getElementById('motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    scene?.setPaused(paused);
    if (paused) {
      // Do not replay completed gsap.from/set tweens: that can hide finished text.
      gsapContext?.getTweens().forEach(tween => { if (tween.isActive()) tween.progress(1); });
      window.gsap?.set('.hero-copy > *', { clearProps: 'opacity,transform' });
    }
    if (!paused) scene?.setProgress(progress);
    document.body.classList.toggle('motion-paused', paused);
    document.dispatchEvent(new CustomEvent('geo-motion', { detail: { paused, reduced: motionPreference.matches } }));
  }
  motionToggle.addEventListener('click', () => { paused = !paused; updateMotionControl(); });
  updateMotionControl();

  function setupMotion() {
    triggers.forEach(trigger => trigger.kill());
    triggers = [];
    gsapContext?.revert();
    revealObserver?.disconnect();
    document.querySelectorAll('[data-reveal]').forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
    if (motionPreference.matches || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const reveals = [...document.querySelectorAll('[data-reveal]')];
    gsapContext = gsap.context(() => {
      // No script or a failed library still leaves every section readable.
      gsap.set(reveals, { opacity: 0, y: 32 });
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          gsap.to(entry.target, { opacity: 1, y: 0, duration: paused ? 0 : .85, ease: 'power3.out', clearProps: 'opacity,transform' });
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: .08 });
      reveals.forEach(el => revealObserver.observe(el));
      const flight = document.querySelector('.flight');
      const stage = document.querySelector('.flight-stage');
      triggers.push(ScrollTrigger.create({
        trigger: flight, start: 'top top',
        end: () => '+=' + Math.max(1, flight.offsetHeight - (matchMedia('(min-width: 768px)').matches ? stage.offsetHeight : stage.offsetHeight * .35)),
        onUpdate: self => {
          progress = self.progress;
          if (!paused) scene?.setProgress(progress);
          document.getElementById('flight-progress').style.transform = `scaleX(${progress})`;
          document.getElementById('scene-caption').textContent = progress < .34 ? 'A closer look at our eye in the sky.' : progress < .7 ? 'Precision, from every angle.' : 'Space technology. Earth-sized possibilities.';
        }, invalidateOnRefresh: true
      }));
      gsap.from('.hero-copy > *', { y: 20, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', clearProps: 'opacity,transform' });
    });
  }
  setupMotion();
  motionPreference.addEventListener('change', () => {
    paused = motionPreference.matches;
    scene?.dispose(); scene = null;
    document.getElementById('space-visual').classList.remove('scene-ready');
    setupMotion(); updateMotionControl(); loadScene();
  });

  const mount = document.getElementById('webgl-mount');
  function showFallback() {
    document.getElementById('space-visual').classList.remove('scene-ready');
    motionToggle.hidden = true;
  }
  mount.addEventListener('space-scene-error', showFallback);
  mount.addEventListener('space-scene-ready', () => {
    document.getElementById('space-visual').classList.add('scene-ready');
    motionToggle.hidden = false;
  });
  async function loadScene() {
    const generation = ++sceneGeneration;
    try {
      const { initSpaceScene } = await import('./space-scene.js');
      if (generation !== sceneGeneration) return;
      const nextScene = await initSpaceScene({ container: mount, reducedMotion: motionPreference.matches });
      if (generation !== sceneGeneration) { nextScene.dispose(); return; }
      scene = nextScene;
      scene.setProgress(progress);
      scene.setPaused(paused);
      motionToggle.hidden = false;
      document.getElementById('space-visual').classList.add('scene-ready');
    } catch (error) {
      console.info('Using the satellite image fallback:', error.message);
      showFallback();
    }
  }
  // Paint the lightweight product image before downloading and compiling 3D.
  // Deep links below the hero do not pay the rendering cost until it is visible.
  const sceneObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    sceneObserver.disconnect();
    const poster = document.querySelector('#scene-fallback img');
    poster.decode().catch(() => {}).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(loadScene));
    });
  }, { rootMargin: '100px' });
  sceneObserver.observe(mount);

  const imageData = {
    bohayen: { src: 'assets/img/bohayen.webp', location: 'Pulau Bohayen, Sabah, Malaysia', alt: 'Satellogic satellite image of Pulau Bohayen, Malaysia, showing turquoise coastal waters and island vegetation' },
    giza: { src: 'assets/img/giza.webp', location: 'Giza, Egypt', alt: 'Satellogic satellite image of the pyramids of Giza beside the city and desert' },
    kradat: { src: 'assets/img/ko-kradat.webp', location: 'Ko Kradat, Thailand', alt: 'Satellogic satellite image of Ko Kradat island and surrounding reefs in Thailand' }
  };
  const imageTabs = [...document.querySelectorAll('[data-image]')];
  const earthImage = document.getElementById('earth-image');
  const zoom = document.getElementById('image-zoom');
  function updateZoom() {
    earthImage.style.transform = `scale(${Number(zoom.value)})`;
    document.getElementById('zoom-output').value = `${Number(zoom.value).toFixed(1)}×`;
    zoom.setAttribute('aria-valuetext', `${Number(zoom.value).toFixed(1)} times magnification`);
  }
  function selectImage(tab) {
    const data = imageData[tab.dataset.image];
    imageTabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
    earthImage.src = data.src; earthImage.alt = data.alt;
    document.getElementById('image-location').textContent = data.location;
    document.getElementById('imagery-panel').setAttribute('aria-labelledby', tab.id);
    zoom.value = '1'; updateZoom();
  }
  imageTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectImage(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % imageTabs.length;
      if (event.key === 'ArrowLeft') next = (index + imageTabs.length - 1) % imageTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = imageTabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); imageTabs[next].focus(); selectImage(imageTabs[next]);
    });
  });
  zoom.addEventListener('input', updateZoom);
  const solutions = {
  "agriculture": {
    "image": "precision-agriculture.webp",
    "alt": "Aerial view of agricultural land",
    "title": "Precision Agriculture",
    "description": "Get precise insights into soil and crop health to optimize agricultural productivity and food security.",
    "url": "precision-agriculture/"
  },
  "plantation": {
    "image": "plantation.webp",
    "alt": "Satellite view of plantation land",
    "title": "Plantation Management",
    "description": "Monitor plantation health, assess crop conditions and map land boundaries to support productive, sustainable plantation management.",
    "url": "plantationmanagement/"
  },
  "risk": {
    "image": "ground-movement.webp",
    "alt": "Geospatial ground movement assessment",
    "title": "Ground Movement",
    "description": "Combine specialist radar satellite data and InSAR analysis to assess ground movement and support geohazard monitoring.",
    "url": "ground-movement/"
  },
  "infrastructure": {
    "image": "infrastructure.webp",
    "alt": "Infrastructure monitoring from space",
    "title": "Infrastructure Monitoring",
    "description": "Monitor critical infrastructure with satellite imagery and geospatial analytics to identify changes, assess risks and support informed maintenance decisions.",
    "url": "infrastructuremonitoring/"
  },
  "forestry": {
    "image": "forestry.webp",
    "alt": "Satellite perspective of forest cover",
    "title": "Sustainable Forestry Management",
    "description": "Track forest cover, monitor deforestation and support sustainable forest management with geospatial insights.",
    "url": "sustainableforestrymanagement/"
  },
  "environment": {
    "image": "environmental.webp",
    "alt": "Environmental monitoring using satellite imagery",
    "title": "Environmental Monitoring",
    "description": "Observe environmental change, assess ecosystem health and support conservation and sustainable development with satellite data.",
    "url": "enviromentalmonitoring/"
  },
  "cities": {
    "image": "urban.webp",
    "alt": "Satellite imagery of an urban area",
    "title": "Urban Planning & Development",
    "description": "Track land use, understand urban growth and bring geospatial context to infrastructure planning and development.",
    "url": "urban-planning-development/"
  }
};
  document.querySelectorAll('[data-solution]').forEach(button => {
    button.addEventListener('click', () => {
      const data = solutions[button.dataset.solution];
      document.querySelectorAll('[data-solution]').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-expanded', String(item === button)); });
      const image = document.getElementById('solution-image'); image.src = `assets/img/solutions/${data.image}`; image.alt = data.alt;
      document.getElementById('solution-title').textContent = data.title;
      document.getElementById('solution-description').textContent = data.description;
      document.getElementById('solution-link').href = `https://www.uzmageoai.com/${data.url}`;
    });
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    ++sceneGeneration; sceneObserver.disconnect(); scene?.dispose(); triggers.forEach(trigger => trigger.kill()); gsapContext?.revert(); revealObserver?.disconnect(); topObserver.disconnect();
  });
})();
