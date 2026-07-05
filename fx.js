// Camdyn Auto Repair — motion system (scroll reveal + parallax + section watch)
// No IntersectionObserver, no rAF dependency: uses scroll events + timers so it
// behaves in hidden iframes / static captures. An rAF-liveness probe disables
// the hide/reveal effect entirely in environments where frames don't advance.
(function () {
  const FX = {};
  const EASE = 'cubic-bezier(.22,.61,.36,1)';
  let revealEls = [];
  let parallaxEls = [];
  let sectionCb = null;
  let curSection = null;
  let bound = false;
  let pending = false;
  let last = 0;

  function checkReveals() {
    if (!revealEls.length) return;
    const vh = window.innerHeight || 800;
    revealEls = revealEls.filter(function (el) {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > -20) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        return false;
      }
      return true;
    });
  }

  function checkParallax() {
    if (!parallaxEls.length) return;
    const y = window.scrollY || 0;
    parallaxEls.forEach(function (el) {
      const f = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      el.style.transform = 'translateY(' + (y * f).toFixed(1) + 'px)';
    });
  }

  function checkSections() {
    if (!sectionCb) return;
    const secs = Array.from(document.querySelectorAll('[data-section-watch]'));
    if (!secs.length) return;
    const line = (window.innerHeight || 800) * 0.38;
    let best = null;
    secs.forEach(function (s) {
      const r = s.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) best = s.id;
    });
    if (!best) {
      const r0 = secs[0].getBoundingClientRect();
      best = r0.top > line ? secs[0].id : secs[secs.length - 1].id;
    }
    if (best && best !== curSection) { curSection = best; sectionCb(best); }
  }

  function sweep() { checkReveals(); checkParallax(); checkSections(); }

  function request() {
    if (pending) return;
    pending = true;
    const wait = Math.max(0, 40 - (Date.now() - last));
    setTimeout(function () { pending = false; last = Date.now(); sweep(); }, wait);
  }

  function bind() {
    if (bound) return;
    bound = true;
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    setTimeout(request, 250);
    setTimeout(request, 900);
    setTimeout(request, 2000);
  }

  FX.reveal = function () {
    const els = Array.from(document.querySelectorAll('[data-reveal]')).filter(function (e) { return !e.__fx; });
    if (!els.length) return;
    els.forEach(function (el) {
      el.__fx = true;
      const d = parseFloat(el.getAttribute('data-reveal-delay') || '0');
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity .8s ' + EASE + ' ' + d + 's, transform .8s ' + EASE + ' ' + d + 's';
      revealEls.push(el);
    });
    bind();
    request();
    // rAF liveness probe: if frames aren't advancing (hidden iframe, static
    // capture, print), skip the effect and show everything immediately.
    let alive = false;
    try { requestAnimationFrame(function () { alive = true; }); } catch (e) { alive = true; }
    setTimeout(function () {
      if (alive) return;
      revealEls.forEach(function (el) {
        el.style.transition = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      revealEls = [];
    }, 160);
  };

  FX.parallax = function () {
    parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
    bind();
    request();
  };

  FX.watchSections = function (cb) {
    sectionCb = cb;
    bind();
    request();
  };

  FX.init = function () { FX.reveal(); FX.parallax(); };
  window.FX = FX;
})();
