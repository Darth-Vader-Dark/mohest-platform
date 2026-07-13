(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Page-wide parallax ----------
     Each layer's true (untransformed) document position is measured once
     on load/resize and cached. Movement is then computed each scroll tick
     as (scrollY - cachedDocTop) * speed — pure arithmetic, no layout
     reads on every frame, and critically: it never measures an element
     that already has a transform applied to itself (which would feed
     the previous frame's offset back into the next one).
     Layers are only active while their section is near the viewport,
     which keeps per-frame work small and constant no matter how long
     the page is. */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('.parallax-el:not(.bg-dots)'));
  var meta = new Map();
  var activeLayers = [];
  var ticking = false;

  function measureLayers(){
    parallaxEls.forEach(function(el){
      var prevTransform = el.style.transform;
      el.style.transform = 'none';
      var rect = el.getBoundingClientRect();
      el.style.transform = prevTransform;
      var speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
      meta.set(el, { docTop: rect.top + window.scrollY, speed: speed });
    });
  }

  function applyParallax(){
    for (var i = 0; i < activeLayers.length; i++){
      var el = activeLayers[i];
      var m = meta.get(el);
      if (!m) continue;
      var offset = (window.scrollY - m.docTop) * m.speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    }
    ticking = false;
  }

  function requestApply(){
    if (!ticking){ window.requestAnimationFrame(applyParallax); ticking = true; }
  }

  if (!reduceMotion && parallaxEls.length){
    measureLayers();
    window.addEventListener('resize', measureLayers);
    window.setTimeout(measureLayers, 400);

    if ('IntersectionObserver' in window){
      var sections = [];
      parallaxEls.forEach(function(el){
        var sec = el.closest('section, footer');
        if (sec && sections.indexOf(sec) === -1) sections.push(sec);
      });
      var sectionObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          var els = Array.prototype.slice.call(entry.target.querySelectorAll('.parallax-el'));
          els.forEach(function(el){
            var idx = activeLayers.indexOf(el);
            if (entry.isIntersecting && idx === -1){
              activeLayers.push(el);
            } else if (!entry.isIntersecting && idx !== -1){
              activeLayers.splice(idx, 1);
              el.style.transform = '';
            }
          });
        });
        requestApply();
      }, { rootMargin: '250px 0px 250px 0px', threshold: 0 });
      sections.forEach(function(sec){ sectionObserver.observe(sec); });
    } else {
      activeLayers = parallaxEls;
    }
    window.addEventListener('scroll', requestApply, { passive: true });
    requestApply();
  }

  /* ---------- Scroll-reveal for cards ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)){
    revealEls.forEach(function(el){ el.classList.add('in'); });
  } else if (revealEls.length){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  }

  /* ---------- Stat counters, run once when scrolled into view ---------- */
  var statEls = document.querySelectorAll('.stat .num');
  var counted = false;
  function animateStats(){
    if (counted) return;
    counted = true;
    statEls.forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var start = null;
      var duration = 900;
      function step(ts){
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    });
  }
  var statsBand = document.querySelector('.stats-band');
  if (statsBand){
    if ('IntersectionObserver' in window){
      var statObserver = new IntersectionObserver(function(entries){
        if (entries[0].isIntersecting) animateStats();
      }, { threshold: 0.4 });
      statObserver.observe(statsBand);
    } else {
      animateStats();
    }
  }
})();
