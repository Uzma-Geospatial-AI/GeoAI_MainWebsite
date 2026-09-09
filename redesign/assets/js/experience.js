(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('.experience-motion');
  const records = [...document.querySelectorAll('.aux-scene')].map(host => ({host,scene:null,generation:0,loading:false,visible:false}));
  let paused = document.body.classList.contains('motion-paused');
  let context;
  let disposed = false;
  const gallery = document.querySelector('.insight-gallery');
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery || !['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = gallery.querySelector('.insight-card').getBoundingClientRect().width + parseFloat(getComputedStyle(gallery).gap);
    const left = event.key === 'Home' ? 0 : event.key === 'End' ? gallery.scrollWidth : gallery.scrollLeft + (event.key === 'ArrowLeft' ? -step : step);
    gallery.scrollTo({ left, behavior: paused || preference.matches ? 'instant' : 'smooth' });
  });
  document.querySelectorAll('[data-gallery-direction]').forEach(control => {
    control.addEventListener('click', () => gallery.scrollBy({left: Number(control.dataset.galleryDirection) * (gallery.querySelector('.insight-card').getBoundingClientRect().width + 25), behavior: paused || preference.matches ? 'instant' : 'smooth'}));
  });
  function buildMotion() {
    context?.revert();
    if (paused || preference.matches || !window.gsap || !window.ScrollTrigger) return;
    context = gsap.context(() => {
      // Scroll from the orbital product into the landscape, then into applications.
      gsap.to('.hero-disc', {y:100,scale:1.15,ease:'none',scrollTrigger:{trigger:'.flight',start:'top top',end:'bottom top',scrub:1}});
      document.querySelectorAll('[data-parallax]').forEach(el => {
        gsap.fromTo(el,{y:Number(el.dataset.parallax)},{y:-Number(el.dataset.parallax),ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:1}});
      });
      gsap.fromTo('.perspective-image',{scale:1.18,yPercent:3},{scale:1,yPercent:-3,ease:'none',scrollTrigger:{trigger:'.perspective-section',start:'top top',end:'bottom bottom',scrub:1}});
      gsap.to('.perspective-word',{xPercent:-14,ease:'none',scrollTrigger:{trigger:'.perspective-section',start:'top bottom',end:'bottom top',scrub:1}});
      gsap.fromTo('.platform-frame',{rotateY:-14,rotateX:8},{rotateY:0,rotateX:0,ease:'none',scrollTrigger:{trigger:'.intelligence-layout',start:'top 85%',end:'bottom 35%',scrub:1}});
      // The component explorer is deliberately still until a component is chosen.
    });
  }
  function sync() {
    button.disabled = preference.matches;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', preference.matches ? 'All motion disabled by device preference' : paused ? 'Resume all motion' : 'Pause all motion');
    button.querySelector('.experience-motion-label').textContent = preference.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
    records.forEach(record=>record.scene?.setPaused(paused || preference.matches));
    buildMotion();
  }
  button.addEventListener('click',()=>document.getElementById('motion-toggle').click());
  document.addEventListener('geo-motion', event=>{paused=event.detail.paused;sync();});
  async function load(record) {
    if(record.scene || record.loading || disposed) return;
    record.loading=true;
    const generation=++record.generation;
    try {
      const {initSpaceScene}=await import('./space-scene.js');
      if(disposed || generation!==record.generation) return;
      const scene=await initSpaceScene({container:record.host.querySelector('.aux-mount'),reducedMotion:preference.matches,variant:record.host.dataset.scene});
      if(disposed || generation!==record.generation){scene.dispose();return;}
      record.scene=scene;
      scene.setPaused(paused || preference.matches);
      record.host.classList.add('scene-ready');
      scene.focusComponent(record.host.dataset.focus || 'overview');
    } catch {record.host.classList.remove('scene-ready');}
    finally {record.loading=false;}
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{const record=records.find(r=>r.host===entry.target);record.visible=entry.isIntersecting;if(record.visible)load(record);});
  },{rootMargin:'120px'});
  records.forEach(record=>{
    observer.observe(record.host);
    const mount=record.host.querySelector('.aux-mount');
    mount.addEventListener('space-scene-error',()=>record.host.classList.remove('scene-ready'));
    mount.addEventListener('space-scene-ready',()=>record.host.classList.add('scene-ready'));
    document.querySelectorAll('[data-component]').forEach(control => {
      control.addEventListener('click', () => {
        const key = control.dataset.component;
        record.host.dataset.focus = key;
        record.scene?.focusComponent(key);
        document.querySelectorAll('[data-component]').forEach(item => item.setAttribute('aria-pressed', String(item === control)));
        const descriptions = {
          overview: ['Engineered to see more.', 'Choose a component to move closer. Explore the camera, the two side instruments and the solar panels.'],
          camera: ['Multispectral camera', 'Look into the Earth observation camera. Published spatial resolution: up to 50 cm. Swath width: 8 km. Orbital altitude: 470 km.'],
          'star-left': ['Star tracker · Side 01', 'Explore the side-mounted optical instrument and its protective baffle.'],
          'star-right': ['Star tracker · Side 02', 'View the second optical instrument on the facing panel.'],
          solar: ['Solar panels', 'Explore the solar-cell surfaces around the spacecraft body.'],
        };
        const [title, description] = descriptions[key];
        document.getElementById('component-title').textContent = title;
        document.getElementById('component-description').textContent = description;
        if (matchMedia('(max-width: 767px)').matches) {
          record.host.scrollIntoView({ block: 'start', behavior: paused || preference.matches ? 'instant' : 'smooth' });
        }
      });
    });
  });
  preference.addEventListener('change',()=>{
    records.forEach(record=>{++record.generation;record.scene?.dispose();record.scene=null;record.loading=false;record.host.classList.remove('scene-ready');if(record.visible)load(record);});
    paused=preference.matches;sync();
  });
  window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;observer.disconnect();context?.revert();records.forEach(record=>{++record.generation;record.scene?.dispose();});});
  sync();
})();
