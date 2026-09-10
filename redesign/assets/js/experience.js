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
      document.querySelectorAll('.sector-stories .document-card').forEach((card,index) => {
        gsap.fromTo(card,{y:55,rotation:index%2 ? 2 : -2},{y:-20,rotation:0,ease:'none',scrollTrigger:{trigger:card,start:'top bottom',end:'bottom center',scrub:1}});
      });
      document.querySelectorAll('.group-stories .document-card').forEach(card => {
        gsap.fromTo(card,{y:45,rotateX:9},{y:0,rotateX:0,ease:'none',scrollTrigger:{trigger:card,start:'top bottom',end:'center center',scrub:1}});
      });
      // The component explorer is deliberately still until a component is chosen.
      document.querySelectorAll('.spec,.reach-strip>p,.client-projects dl>div').forEach((item,index) => {
        gsap.fromTo(item,{y:35},{y:0,ease:'none',scrollTrigger:{trigger:item,start:'top 95%',end:'top 55%',scrub:0.7}});
      });
      document.querySelectorAll('.journal-photo img').forEach(photo => {
        gsap.fromTo(photo,{scale:1.13,yPercent:-3},{scale:1,yPercent:0,ease:'none',scrollTrigger:{trigger:photo.parentElement,start:'top bottom',end:'bottom 25%',scrub:1}});
      });
      document.querySelectorAll('.roadmap-track figure').forEach((item,index) => {
        gsap.fromTo(item,{y:35,rotateY:index ? -9 : 9},{y:0,rotateY:0,ease:'none',scrollTrigger:{trigger:'.roadmap-track',start:'top 90%',end:'center 45%',scrub:1}});
      });
      gsap.fromTo('.roadmap-connection svg',{scale:0.65,rotation:-35},{scale:1,rotation:0,ease:'none',scrollTrigger:{trigger:'.roadmap-track',start:'top 90%',end:'center 45%',scrub:1}});
      document.querySelectorAll('.solution-thumb').forEach(photo => {
        gsap.fromTo(photo,{y:25},{y:0,ease:'none',scrollTrigger:{trigger:photo,start:'top bottom',end:'center 55%',scrub:0.8}});
      });
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
          overview: ['Engineered to see more.', 'Explore 10 exterior components, from the optical opening and two side instruments to the solar panels, spacecraft body and rear equipment.'],
          camera: ['Multispectral camera', 'Captures Earth in blue (450–517 nm), green (517–583 nm), red (597–690 nm) and near-infrared (759–890 nm) bands. The 2026 brochure lists imagery up to 50 cm resolution, a 6.5 km swath and an operating altitude of 460–525 km.'],
          'star-left': ['Star tracker · Side 01', 'Star trackers compare observed stars with a stored star catalogue to determine spacecraft orientation. This view focuses on the first side-mounted instrument and its protective baffle. The placement follows the supplied model references; no tracker accuracy is specified in the brochure.'],
          'star-right': ['Star tracker · Side 02', 'View the second optical instrument on the facing panel. Together, these two modelled positions let you inspect both sides of the spacecraft. Star trackers support orientation knowledge; the exact flight sensor configuration is not detailed in the brochure.'],
          solar: ['Solar panels', 'Solar cells convert sunlight into electrical power for spacecraft operations. This view shows the body-mounted cell pattern, connecting strips and panel edges reproduced from the reference images. The brochure does not specify array output or battery capacity.'],
          aperture: ['Optical aperture & internal baffles', 'The circular opening at the end of the camera admits light into the optical assembly. The model shows a recessed optical surface, a central element and internal rings. Baffles help limit unwanted stray light; the illustration does not specify the flight camera’s internal optical prescription.'],
          barrel: ['Camera barrel & protective housing', 'The copper-toned cylindrical housing surrounds the optical assembly. This view highlights its shortened profile and the interface with the spacecraft body, following the supplied satellite photographs. Surface appearance is illustrative; the brochure does not identify the housing material.'],
          body: ['Spacecraft body & structure', 'The main body supports the payload and external panels. The 2026 brochure lists a mass of 45.4 kg and overall dimensions of 508 × 575 × 813 mm. Internal electronics, batteries and structural details are not exposed in this exterior illustration.'],
          'patch-panel': ['Large external patch panel', 'Zoom in on the rectangular panel with a repeated grid of gold-coloured elements beside the camera barrel. Its visible arrangement is reproduced from the supplied images. The source material does not identify its exact function, so it is not labelled as a particular antenna or sensor.'],
          'small-panel': ['Small external panel', 'This smaller plate near the camera opening has four light-coloured patches and a central dark element. The model follows the visible reference details. Its specific instrument designation and function are not stated in the supplied brochure.'],
          'rear-bay': ['Rear equipment panels', 'Explore the reverse side of the optical assembly, where the reference images show equipment plates and surface details. This is a visual representation of the external hardware; no undocumented internal subsystem or performance specification is implied.'],
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
