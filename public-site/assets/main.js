(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Page-wide parallax ----------
     Viewport-relative approach: offset is based on how far the element's
     centre is from the viewport centre, multiplied by speed.
     - Elements near the viewport centre get near-zero offset (no jitter).
     - Elements above the centre drift upward slightly (sky layer effect).
     - Elements below drift downward slightly (depth layer effect).
     This prevents footer elements from accumulating a huge offset just because
     they are far down the page — a common bug with document-top approaches.
     bg-horizon and any parallax elements inside <footer> are excluded because
     those decorative motifs look best static and drift badly when translated. */

  var parallaxEls = Array.prototype.slice.call(
    document.querySelectorAll('.parallax-el:not(.bg-dots):not(.bg-horizon)')
  ).filter(function(el){ return !el.closest('footer'); });

  var activeLayers = [];
  var ticking = false;
  var vh = window.innerHeight;

  function applyParallax(){
    for (var i = 0; i < activeLayers.length; i++){
      var el = activeLayers[i];
      var speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
      var rect = el.getBoundingClientRect();
      /* Centre of the element relative to viewport */
      var elementCentreY = rect.top + rect.height / 2;
      /* Distance from viewport centre: negative = above, positive = below */
      var distance = elementCentreY - (vh / 2);
      /* Negate: element above viewport centre shifts further up (moves away),
         element below shifts further down — creates natural depth illusion */
      var offset = -(distance * speed);
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    }
    ticking = false;
  }

  function requestApply(){
    if (!ticking){ window.requestAnimationFrame(applyParallax); ticking = true; }
  }

  if (!reduceMotion && parallaxEls.length){
    window.addEventListener('resize', function(){ vh = window.innerHeight; requestApply(); });

    if ('IntersectionObserver' in window){
      var sections = [];
      parallaxEls.forEach(function(el){
        var sec = el.closest('section, .hero');
        if (sec && sections.indexOf(sec) === -1) sections.push(sec);
      });
      var sectionObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          var els = Array.prototype.slice.call(
            entry.target.querySelectorAll('.parallax-el:not(.bg-dots):not(.bg-horizon)')
          ).filter(function(e){ return !e.closest('footer'); });
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
  var revealObserver = null;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -60px 0px' });
  }

  /* Observe elements that are already in the DOM at load time */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  } else {
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  }

  /**
   * window.observeReveal(nodeList | Array)
   * Call this after injecting dynamic .reveal elements so they animate in.
   * Falls back to immediately adding 'in' if reduced-motion or no observer.
   */
  window.observeReveal = function(els) {
    if (!els) return;
    var arr = Array.prototype.slice.call(els);
    if (reduceMotion || !revealObserver) {
      arr.forEach(function(el){ el.classList.add('in'); });
    } else {
      arr.forEach(function(el){ revealObserver.observe(el); });
    }
  };

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
