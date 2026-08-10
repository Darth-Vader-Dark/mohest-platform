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

  /* ---------- Reveal Helper ---------- */
  
  /* ---------- Global In-Page Search Modal ---------- */
  function initGlobalSearch() {
    var searchBtns = document.querySelectorAll('a.icon-btn[aria-label="Search"], a.icon-btn[title="Search"], a[href="search.html"]');
    if (!searchBtns.length) return;

    var modal = document.getElementById('global-search-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'global-search-modal';
      modal.className = 'search-modal-overlay hidden';
      modal.innerHTML = `
        <div class="search-modal-box">
          <div class="search-modal-header">
            <span class="search-icon-symbol">🔍</span>
            <input type="text" id="global-search-input" placeholder="Search universities, news, scholarships, documents..." autocomplete="off">
            <button id="global-search-close" aria-label="Close search">✕</button>
          </div>
          <div class="search-modal-body" id="global-search-results">
            <div class="search-hint">Type a query to search across MoHEST resources.</div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    function openSearchModal(e) {
      if (e) e.preventDefault();
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      var input = document.getElementById('global-search-input');
      if (input) { input.value = ''; input.focus(); }
    }

    function closeSearchModal() {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }

    searchBtns.forEach(function(btn){
      btn.addEventListener('click', openSearchModal);
    });

    var closeBtn = document.getElementById('global-search-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSearchModal);

    modal.addEventListener('click', function(e){
      if (e.target === modal) closeSearchModal();
    });

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeSearchModal();
      }
    });

    var input = document.getElementById('global-search-input');
    var results = document.getElementById('global-search-results');
    var searchTimer = null;

    if (input) {
      input.addEventListener('input', function(){
        clearTimeout(searchTimer);
        var q = input.value.trim().toLowerCase();
        if (!q) {
          results.innerHTML = '<div class="search-hint">Type a query to search across MoHEST resources.</div>';
          return;
        }
        results.innerHTML = '<div class="search-hint">Searching…</div>';
        searchTimer = setTimeout(function(){ performSearch(q, results); }, 250);
      });
    }
  }

  async function performSearch(q, container) {
    var API = window.MOHEST_API || '/api/v1';
    try {
      var responses = await Promise.all([
        fetch(`${API}/public-site/institutions?category=university`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/public-site/news-articles`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/public-site/scholarships`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/public-site/downloads`).then(r => r.ok ? r.json() : []),
      ]);

      var unis = responses[0].filter(u => u.name && u.name.toLowerCase().includes(q));
      var news = responses[1].filter(n => (n.title && n.title.toLowerCase().includes(q)) || (n.excerpt && n.excerpt.toLowerCase().includes(q)));
      var schs = responses[2].filter(s => (s.title && s.title.toLowerCase().includes(q)) || (s.country && s.country.toLowerCase().includes(q)));
      var dls  = responses[3].filter(d => (d.title && d.title.toLowerCase().includes(q)) || (d.category && d.category.toLowerCase().includes(q)));

      var html = '';
      if (unis.length) {
        html += '<div class="search-group-title">Universities</div>';
        unis.forEach(u => {
          html += `<a href="universities.html" class="search-result-item">
            <strong>${u.name}</strong>
            <span>${u.location || 'South Sudan'} &middot; ${u.type || 'Public'}</span>
          </a>`;
        });
      }
      if (news.length) {
        html += '<div class="search-group-title">News &amp; Updates</div>';
        news.forEach(n => {
          html += `<a href="news-detail.html?id=${n.id}" class="search-result-item">
            <strong>${n.title}</strong>
            <span>${n.excerpt || 'Read full news article'}</span>
          </a>`;
        });
      }
      if (schs.length) {
        html += '<div class="search-group-title">Scholarships</div>';
        schs.forEach(s => {
          html += `<a href="scholarships.html" class="search-result-item">
            <strong>${s.title}</strong>
            <span>${s.country || 'Foreign Study'} &middot; ${s.status || 'Open'}</span>
          </a>`;
        });
      }
      if (dls.length) {
        html += '<div class="search-group-title">Official Documents</div>';
        dls.forEach(d => {
          html += `<a href="downloads.html" class="search-result-item">
            <strong>${d.title}</strong>
            <span>${d.fileLabel || 'PDF'} &middot; ${d.category || 'Form'}</span>
          </a>`;
        });
      }

      if (!html) {
        container.innerHTML = `<div class="search-hint">No matches found for "${q}".</div>`;
      } else {
        container.innerHTML = html;
      }
    } catch(err) {
      container.innerHTML = '<div class="search-hint">Search failed. Please check connection.</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalSearch);
  } else {
    initGlobalSearch();
  }
})();
