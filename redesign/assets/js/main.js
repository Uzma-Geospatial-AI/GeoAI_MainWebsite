/* Uzma Geospatial AI — redesign interactions */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Navbar glass on scroll ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  var burger = document.getElementById('burger');
  burger && burger.addEventListener('click', function () { nav.classList.toggle('open'); });
  document.querySelectorAll('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); });
  });

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('[data-reveal]');
  function revealAll() { reveals.forEach(function (el) { el.classList.add('in'); }); }
  var forceReveal = /[?&]reveal/.test(location.search);   // static-capture / debug mode
  if (forceReveal) {                                       // snap to final state, no transition
    var s = document.createElement('style');
    s.textContent = '[data-reveal]{transition:none!important}.hero{min-height:auto!important}';
    document.head.appendChild(s);
  }
  if (reduce || forceReveal) {
    revealAll();
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    /* Safety net: nothing should ever stay invisible. If, for any reason,
       an element never enters the viewport / observer stalls, reveal it. */
    setTimeout(revealAll, 4000);
  } else {
    revealAll();
  }

  /* ---- Count-up numbers ---- */
  function animateCount(el) {
    if (el.dataset.raw !== undefined) { return; }         // leave raw numbers (e.g. 2021)
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;
    if (reduce) { el.textContent = target + suffix; return; }
    var start = performance.now(), dur = 1400;
    function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (forceReveal) {
    counters.forEach(function (el) {
      if (el.dataset.raw === undefined) el.textContent = el.dataset.count + (el.dataset.suffix || '');
    });
  } else if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---- Hero image subtle tilt on mouse ---- */
  var orb = document.getElementById('heroOrb');
  if (orb && !reduce && window.matchMedia('(pointer:fine)').matches) {
    var frame = orb.parentElement;
    frame.addEventListener('mousemove', function (ev) {
      var r = frame.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5;
      var y = (ev.clientY - r.top) / r.height - 0.5;
      orb.style.transform = 'rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) translateZ(0)';
    });
    frame.addEventListener('mouseleave', function () {
      orb.style.transform = 'rotateY(0) rotateX(0)';
    });
  }

  /* ---- Card spotlight (glass follows cursor) ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.serv-card, .award, .spec, .vm .glass').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.background =
          'radial-gradient(320px circle at ' + (e.clientX - r.left) + 'px ' + (e.clientY - r.top) +
          'px, rgba(255,255,255,.12), var(--glass) 40%)';
      });
      card.addEventListener('mouseleave', function () { card.style.background = ''; });
    });
  }

  /* ---- Partner marquee (duplicated for seamless loop) ---- */
  var track = document.getElementById('ptrack');
  if (track) {
    var partners = [
      'MYSA', 'MASIC', 'MIGHT', 'MIMOS', 'MDA', 'Satellogic-Uruguay', 'GHGSat',
      'SatVu', 'Umbra', 'Rezatec', 'SkyGeo', 'Sunway-university', 'Vasundharaa', 'Apa-Di-Langit'
    ];
    var html = '';
    partners.forEach(function (p) {
      html += '<div class="plogo"><img src="assets/img/partners/Partners-' + p + '.png" alt="' + p + '" loading="lazy"></div>';
    });
    track.innerHTML = html + html; // duplicate => seamless -50% scroll
  }

  /* ---- Star field ---- */
  var cv = document.getElementById('stars');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), stars = [], W, H;
    function resize() {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      var n = Math.min(140, Math.floor(W * H / 14000));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, a: Math.random(), s: Math.random() * 0.02 + 0.004 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.a += st.s; if (st.a > 1 || st.a < 0) st.s = -st.s;
        ctx.globalAlpha = Math.abs(st.a) * 0.8 + 0.1;
        ctx.fillStyle = '#cfe0ff';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.28); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    resize(); draw();
    window.addEventListener('resize', resize);
  }
})();
