/* ==================================================================
   PORTFOLIO — YAML-driven renderer + interactions
   Content lives in data/content.yaml. Every library (GSAP, ScrollTrigger,
   SplitText, Lenis, hero-gl) is optional: the page is complete without them.
   ================================================================== */

(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  var body = doc.body;
  var ROOT = body.getAttribute('data-root') || '';
  var IS_BLOG = body.getAttribute('data-page') === 'blog';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var gsap = window.gsap || null;
  var ST = (gsap && window.ScrollTrigger) || null;
  var Split = (gsap && window.SplitText) || null;
  try {
    if (gsap && ST) gsap.registerPlugin(ST);
    if (gsap && Split) gsap.registerPlugin(Split);
  } catch (e) { ST = null; Split = null; }

  var lenis = null;
  var heroGL = null;
  var TZ = 'Asia/Kolkata';

  // ---------- Icons (inline, stroke = currentColor) ----------
  var I = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M8 6h10v10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45z"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M6 10l6 6 6-6M4 21h16" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    preview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h11l5 5v13H4zM14 3v6h6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    medium: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42s-3.39-2.88-3.39-6.42 1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zm2.94 0c0 3.17-.53 5.75-1.19 5.75s-1.19-2.58-1.19-5.75.53-5.75 1.19-5.75 1.19 2.58 1.19 5.75z"/></svg>',
    hashnode: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M2.65 10.4a3.27 3.27 0 0 0 0 4.62l6.32 6.33a3.27 3.27 0 0 0 4.62 0l6.33-6.33a3.27 3.27 0 0 0 0-4.62L13.6 4.07a3.27 3.27 0 0 0-4.63 0L2.65 10.4zm8.56-1.47a3.1 3.1 0 1 1 0 6.19 3.1 3.1 0 0 1 0-6.19z"/></svg>',
    dev: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.2-.17.31-.48.31-.95v-2c0-.5-.11-.81-.31-.95zm13.37-7.13H3.2A2.13 2.13 0 0 0 1 5.04v13.92c0 1.17.96 2.12 2.21 2.12h17.58c1.25 0 2.21-.95 2.21-2.12V5.04c0-1.17-.96-2.12-2.21-2.12zM8.89 14.32c-.38.42-.93.63-1.62.63H5.12V9.05h2.17c.69 0 1.23.2 1.6.63.34.39.52.94.52 1.65v1.34c0 .71-.18 1.26-.52 1.65z"/></svg>'
  };

  // ---------- Helpers ----------
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; }
  function splitList(str) {
    if (Array.isArray(str)) return str.map(String);
    return String(str || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function findLink(links, icon) { return (links || []).filter(function (l) { return l && l.icon === icon; })[0]; }
  function isCurrent(date) { return /present/i.test(date || ''); }
  function isExternal(url) { return /^https?:/i.test(url || ''); }
  function resolve(url) {
    if (!url) return '#';
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) return url;
    return ROOT + url;
  }
  function extAttrs(url) { return isExternal(url) ? ' target="_blank" rel="noopener"' : ''; }
  function prettyUrl(url) { return String(url || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''); }
  function raf(fn) { return window.requestAnimationFrame(fn); }
  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function refreshST() { if (ST) { try { ST.refresh(); } catch (e) { } } }
  function onFontsReady(fn) {
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fn, fn); else setTimeout(fn, 300);
  }

  // Resolves once fonts are truly settled (ready can fire before lazy fonts start loading)
  function onFontsSettled(fn) {
    onFontsReady(function () {
      var n = 0;
      (function check() {
        if (doc.fonts && doc.fonts.status === 'loading' && n++ < 20) { doc.fonts.ready.then(check, check); return; }
        fn();
      })();
    });
  }

  // Current year wherever requested
  $$('[data-year]').forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

  // ==================================================================
  // PRELOADER  (plain JS counter; CSS curtain; never blocks)
  // ==================================================================
  var preloader = (function () {
    var el = $('#preloader');
    var countEl = $('#preloader-count');
    var barEl = $('#preloader-bar');
    var done = false;
    function finish() {
      if (done) return; done = true;
      html.classList.add('is-loaded');
      try { sessionStorage.setItem('nm-visited', '1'); } catch (e) { }
      if (el) setTimeout(function () { el.setAttribute('hidden', ''); }, 1200);
    }
    if (!el || REDUCED) { return { ready: finish }; }

    var seen = false;
    try { seen = sessionStorage.getItem('nm-visited') === '1'; } catch (e) { }
    var minDur = seen ? 450 : 1500;
    var start = performance.now();
    var isReady = false;
    var shown = 0;

    function frame(now) {
      if (done) return;
      var t = Math.min(1, (now - start) / minDur);
      var eased = 1 - Math.pow(1 - t, 3);
      var target = isReady ? 100 * eased : Math.min(88, 100 * eased);
      shown += (target - shown) * 0.18;
      if (Math.abs(target - shown) < 0.4) shown = target;
      var v = Math.round(shown);
      if (countEl) countEl.textContent = pad(v, 3);
      if (barEl) barEl.style.transform = 'scaleX(' + (shown / 100).toFixed(4) + ')';
      if (isReady && t >= 1 && v >= 100) { setTimeout(finish, 120); return; }
      raf(frame);
    }
    raf(frame);
    return { ready: function () { isReady = true; } };
  })();

  // ==================================================================
  // THEME
  // ==================================================================
  function currentTheme() { return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function syncThemeUI() {
    var t = currentTheme();
    $$('[data-theme-label]').forEach(function (n) { n.textContent = t === 'dark' ? 'Dark' : 'Light'; });
    var btn = $('#theme-toggle');
    if (btn) btn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0D0D0C' : '#ECE9E2');
  }
  function applyTheme(t, persist) {
    html.setAttribute('data-theme', t);
    if (persist) { try { localStorage.setItem('theme', t); } catch (e) { } }
    syncThemeUI();
    if (heroGL && typeof heroGL.setTheme === 'function') {
      try { heroGL.setTheme(t); } catch (e) { }
    }
  }
  (function initTheme() {
    syncThemeUI();
    var btn = $('#theme-toggle');
    if (btn) btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
    // Follow the OS while the visitor hasn't chosen explicitly
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var stored = null;
      try { stored = localStorage.getItem('theme'); } catch (err) { }
      if (stored !== 'light' && stored !== 'dark') applyTheme(e.matches ? 'dark' : 'light', false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  })();

  // ==================================================================
  // SMOOTH SCROLL (Lenis, synced to ScrollTrigger)
  // ==================================================================
  (function initLenis() {
    if (REDUCED || typeof window.Lenis !== 'function') return;
    try {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      if (gsap) {
        if (ST) lenis.on('scroll', ST.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var loop = function (time) { lenis.raf(time); raf(loop); };
        raf(loop);
      }
    } catch (e) { lenis = null; }
  })();

  function scrollToTarget(target) {
    if (target == null) return;
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: REDUCED ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  }

  // In-page anchors: smooth scroll + move focus for keyboard / AT users
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var target = doc.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(id === '#top' ? 0 : target);
    if (history.replaceState) history.replaceState(null, '', id);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (err) { }
  });

  // ==================================================================
  // NAV: scrolled state, hide on scroll down, progress, back-to-top
  // ==================================================================
  (function initScrollUI() {
    var nav = $('#nav');
    var bar = $('#progress');
    var toTop = $('#to-top');
    var lastY = window.scrollY;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      if (nav) {
        nav.classList.toggle('is-scrolled', y > 20);
        var menuOpen = html.classList.contains('menu-open');
        nav.classList.toggle('is-hidden', !menuOpen && y > window.innerHeight * 0.6 && y > lastY + 2);
        if (y < lastY - 2) nav.classList.remove('is-hidden');
      }
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);
      lastY = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
    update();
    if (toTop) toTop.addEventListener('click', function () {
      scrollToTarget(0);
      var main = $('#main');
      if (main) try { main.focus({ preventScroll: true }); } catch (e) { }
    });
  })();

  // ==================================================================
  // MOBILE MENU
  // ==================================================================
  var menuEl = $('#menu');
  var menuBtn = $('#menu-toggle');
  function setMenu(open) {
    if (!menuEl || !menuBtn) return;
    menuEl.classList.toggle('is-open', open);
    menuEl.setAttribute('aria-hidden', String(!open));
    if (open) menuEl.removeAttribute('inert'); else menuEl.setAttribute('inert', '');
    menuBtn.setAttribute('aria-expanded', String(open));
    var lbl = $('[data-menu-label]', menuBtn);
    if (lbl) lbl.textContent = open ? 'Close' : 'Menu';
    html.classList.toggle('menu-open', open);
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = $('a', menuEl);
      if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { } }, 60);
    }
  }
  function closeMenu() {
    if (menuEl && menuEl.classList.contains('is-open')) { setMenu(false); if (menuBtn) menuBtn.focus(); }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!menuEl.classList.contains('is-open')); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', debounce(function () { if (window.innerWidth > 900) closeMenu(); }, 150));

  // ==================================================================
  // LIVE IST CLOCK
  // ==================================================================
  (function initClock() {
    var fmt = null;
    try { fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: TZ }); } catch (e) { }
    function tick() {
      var s;
      if (fmt) s = fmt.format(new Date());
      else {
        var d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
        s = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      }
      $$('[data-clock]').forEach(function (n) { if (n.textContent !== s) n.textContent = s; });
    }
    tick();
    setInterval(tick, 1000);
  })();

  // ==================================================================
  // CUSTOM CURSOR (fine pointers only, never with reduced motion)
  // ==================================================================
  var pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  (function initCursor() {
    if (!FINE || REDUCED) return;
    var c = doc.createElement('div');
    c.className = 'cursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div>';
    body.appendChild(c);
    html.classList.add('has-cursor');
    var ring = $('.cursor__ring', c), dot = $('.cursor__dot', c), label = $('.cursor__label', c);
    var rx = pointer.x, ry = pointer.y, running = false;

    function loop() {
      rx += (pointer.x - rx) * 0.2;
      ry += (pointer.y - ry) * 0.2;
      dot.style.transform = 'translate3d(' + pointer.x + 'px,' + pointer.y + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
      if (Math.abs(pointer.x - rx) > 0.1 || Math.abs(pointer.y - ry) > 0.1) raf(loop); else running = false;
    }
    function kick() { if (!running) { running = true; raf(loop); } }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      pointer.x = e.clientX; pointer.y = e.clientY;
      c.classList.add('is-visible');
      kick();
    }, { passive: true });
    doc.addEventListener('pointerleave', function () { c.classList.remove('is-visible'); });
    window.addEventListener('blur', function () { c.classList.remove('is-visible'); });
    doc.addEventListener('pointerdown', function () { c.classList.add('is-down'); });
    doc.addEventListener('pointerup', function () { c.classList.remove('is-down'); });
    doc.addEventListener('pointerover', function (e) {
      var t = e.target;
      var lab = t.closest && t.closest('[data-cursor]');
      var link = t.closest && t.closest('a, button, [role="button"]');
      if (lab) {
        label.textContent = lab.getAttribute('data-cursor');
        c.classList.add('is-label'); c.classList.remove('is-link');
      } else {
        c.classList.remove('is-label');
        c.classList.toggle('is-link', !!link);
      }
    });
  })();

  // ==================================================================
  // MAGNETIC ELEMENTS
  // ==================================================================
  function initMagnetic(scope) {
    if (!FINE || REDUCED) return;
    $$('[data-magnetic]', scope).forEach(function (el) {
      if (el.__mag) return; el.__mag = true;
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 0.3;
      var rect = null;
      var setX, setY;
      if (gsap) {
        setX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
        setY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      } else {
        el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
        var cur = { x: 0, y: 0 };
        var apply = function () { el.style.transform = 'translate3d(' + cur.x + 'px,' + cur.y + 'px,0)'; };
        setX = function (v) { cur.x = v; apply(); };
        setY = function (v) { cur.y = v; apply(); };
      }
      el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        setX((e.clientX - (rect.left + rect.width / 2)) * strength);
        setY((e.clientY - (rect.top + rect.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', function () { rect = null; setX(0); setY(0); });
    });
  }

  // ==================================================================
  // REVEALS (IntersectionObserver toggles .in; CSS does the motion)
  // ==================================================================
  var revealIO = null;
  function initReveals(scope) {
    var items = $$('[data-reveal]:not(.in)', scope);
    if (!items.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('in'); });
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    items.forEach(function (n) { revealIO.observe(n); });
  }

  // ==================================================================
  // ACTIVE SECTION IN NAV
  // ==================================================================
  function initActiveNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.nav__links a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var targets = Object.keys(map).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        var a = map[e.target.id];
        if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  // ==================================================================
  // FIT DISPLAY TYPE (hero name spans ~full width)
  // ==================================================================
  function fitDisplay() {
    [['#hero-name', 0.6], ['#blog-title', 0.55]].forEach(function (cfg) {
      var h = $(cfg[0]);
      if (!h) return;
      var spans = $$('.line > span', h);
      if (!spans.length) return;
      h.style.setProperty('--name-size', '100px');
      h.style.fontSize = '100px';
      var widest = 0;
      spans.forEach(function (s) { widest = Math.max(widest, s.offsetWidth); });
      var avail = h.clientWidth;
      if (!widest || !avail) { h.style.fontSize = ''; return; }
      var size = 100 * avail / widest * 0.995;
      var maxByH = Math.max(window.innerHeight * cfg[1] / (spans.length * 0.82), 72);
      size = Math.min(size, maxByH);
      h.style.fontSize = '';
      h.style.setProperty('--name-size', size.toFixed(2) + 'px');
      if (cfg[0] === '#blog-title') h.style.fontSize = size.toFixed(2) + 'px';
    });
  }
  fitDisplay();
  onFontsReady(function () { fitDisplay(); refreshST(); });
  window.addEventListener('resize', debounce(function () { fitDisplay(); refreshST(); }, 160));

  // ==================================================================
  // RENDERERS
  // ==================================================================
  function setText(sel, txt) { var n = $(sel); if (n) n.textContent = txt || ''; }

  function renderHero(a) {
    var name = String(a.name || '').trim();
    if (name) {
      var parts = name.split(/\s+/);
      var last = parts.length > 1 ? parts.pop() : '';
      var first = parts.join(' ');
      var h = $('#hero-name');
      if (h) {
        h.innerHTML = '<span class="line"><span>' + esc(first) + '</span></span>' +
          (last ? '<span class="line line--r"><span>' + esc(last) + '</span></span>' : '');
      }
      $$('[data-name]').forEach(function (n) { n.textContent = name; });
    }
    setText('#hero-role', a.title);
    setText('#hero-tagline', a.tagline);
  }

  function renderAbout(a, data) {
    var st = $('#about-statement');
    if (st) st.textContent = String(a.summary || '').replace(/\s+/g, ' ').trim();

    var facts = $('#about-facts');
    if (!facts) return;
    var out = '';
    if (a.location) out += fact('Based in', '<dd>' + esc(a.location) + '</dd>');
    var learning = splitList(a.currently_learning);
    if (learning.length) out += fact('Currently learning', learning.map(function (l) { return '<dd>' + esc(l) + '</dd>'; }).join(''));
    var current = (data.experience || []).filter(function (j) { return isCurrent(j.date); });
    if (current.length) {
      var shown = current.slice(0, 3).map(function (j) {
        return '<dd>' + esc(j.role) + '<span class="fact__sub">' + esc(j.company) + '</span></dd>';
      }).join('');
      if (current.length > 3) shown += '<dd><a href="#experience">+' + (current.length - 3) + ' more in the ledger</a></dd>';
      out += fact('Now', shown);
    }
    var edu = (data.education || []).slice(0, 2);
    if (edu.length) out += fact('Studying', edu.map(function (e) {
      return '<dd>' + esc(e.degree) + '<span class="fact__sub">' + esc(e.institution) + '</span></dd>';
    }).join(''));
    facts.innerHTML = out;

    function fact(k, v) { return '<dl class="fact" data-reveal><dt class="mono">' + esc(k) + '</dt>' + v + '</dl>'; }
  }

  function renderWork(projects, links) {
    var list = $('#work-list');
    if (!list) return;
    projects = projects || [];
    list.innerHTML = projects.map(function (p, i) {
      var url = p.url && p.url !== '#' ? p.url : '';
      var tags = (p.tags || []).slice(0, 3).join(' / ');
      var tagName = url ? 'a' : 'div';
      var hrefAttr = url ? ' href="' + esc(url) + '"' + extAttrs(url) + ' data-cursor="Open"' : '';
      return '<li data-reveal style="--i:' + Math.min(i, 6) + '">' +
        '<' + tagName + ' class="work-row"' + hrefAttr + ' data-index="' + i + '">' +
          '<span class="work-row__idx mono">(' + pad(i + 1) + ')</span>' +
          '<span class="work-row__name">' + esc(p.name) + '</span>' +
          '<span class="work-row__tags mono">' + esc(tags) + '</span>' +
          '<span class="work-row__arrow">' + I.arrow + '</span>' +
          '<span class="work-row__desc">' + esc(p.description) + '</span>' +
          (url && isExternal(url) ? '<span class="sr-only"> (opens in a new tab)</span>' : '') +
        '</' + tagName + '>' +
      '</li>';
    }).join('');

    var more = $('#work-more');
    var gh = findLink(links, 'github');
    if (more && gh) more.innerHTML = 'More experiments and source on <a href="' + esc(gh.url) + '"' + extAttrs(gh.url) + '>GitHub</a>';
  }

  function renderLedger(jobs) {
    var root = $('#ledger');
    if (!root) return;
    root.innerHTML = (jobs || []).map(function (j, i) {
      var cur = isCurrent(j.date);
      var note = (j.bullets || [])[0];
      return '<li class="ledger-row' + (cur ? ' is-current' : '') + '" data-reveal style="--i:' + Math.min(i, 8) + '">' +
        '<span class="ledger-row__date mono">' + esc(j.date) + '</span>' +
        '<span class="ledger-row__role">' + esc(j.role) + (note ? '<span class="ledger-row__note">' + esc(note) + '</span>' : '') + '</span>' +
        '<span class="ledger-row__org">' + esc(j.company) + '</span>' +
        '<span class="ledger-row__loc mono">' + esc(j.location || '') + '</span>' +
        '<span class="ledger-row__state mono">' + (cur ? '<span class="status-dot" aria-hidden="true"></span>Active' : 'Closed') + '</span>' +
      '</li>';
    }).join('');
  }

  function renderMarquee(skills) {
    var track = $('#marquee-track');
    if (!track) return;
    var items = [];
    (skills || []).forEach(function (s) { items = items.concat(splitList(s.items)); });
    if (!items.length) { var m = $('#marquee'); if (m) m.hidden = true; return; }
    var seq = items.map(function (s, i) {
      return '<span class="marquee__item">' + esc(s) + '</span><span class="marquee__sep' + (i % 2 ? ' marquee__sep--o' : '') + '"></span>';
    }).join('');
    track.innerHTML = seq + seq;
  }

  function renderSpec(skills) {
    var root = $('#spec');
    if (!root) return;
    root.innerHTML = (skills || []).map(function (s, i) {
      var items = splitList(s.items);
      return '<div class="spec-row" data-reveal style="--i:' + Math.min(i, 8) + '">' +
        '<span class="spec-row__idx mono">04.' + (i + 1) + '</span>' +
        '<h3 class="spec-row__cat">' + esc(s.category) + '</h3>' +
        '<ul class="spec-row__items">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<span class="spec-row__count mono">' + pad(items.length) + (items.length === 1 ? ' item' : ' items') + '</span>' +
      '</div>';
    }).join('');
  }

  function renderEducation(edu, certs) {
    var e = $('#edu-list');
    if (e) e.innerHTML = (edu || []).map(function (x, i) {
      return '<li class="edu-item" data-reveal style="--i:' + i + '">' +
        '<span class="edu-item__k mono">' + esc(x.year) + '</span>' +
        '<div><p class="edu-item__title">' + esc(x.degree) + '</p><span class="edu-item__sub">' + esc(x.institution) + '</span></div>' +
      '</li>';
    }).join('');
    var c = $('#cert-list');
    if (c) c.innerHTML = (certs || []).map(function (x, i) {
      return '<li class="edu-item" data-reveal style="--i:' + i + '">' +
        '<span class="edu-item__k mono">C.' + pad(i + 1) + '</span>' +
        '<div><p class="edu-item__title">' + esc(x.name) + '</p>' + (x.issuer ? '<span class="edu-item__sub">' + esc(x.issuer) + '</span>' : '') + '</div>' +
      '</li>';
    }).join('');
  }

  function renderCounts(data) {
    var labels = {
      projects: [(data.projects || []).length, 'entries'],
      experience: [(data.experience || []).length, 'roles logged'],
      skills: [(data.skills || []).length, 'categories']
    };
    $$('[data-count]').forEach(function (n) {
      var k = labels[n.getAttribute('data-count')];
      if (k) n.textContent = pad(k[0]) + ' ' + k[1];
    });
  }

  function renderContact(a) {
    var links = a.links || [];
    var email = findLink(links, 'email');
    var li = findLink(links, 'linkedin');
    var gh = findLink(links, 'github');
    var resumeUrl = a.resume_url || (findLink(links, 'download') || {}).url || (findLink(links, 'preview') || {}).url;

    var wrap = $('#contact-email');
    if (wrap && email) {
      var addr = String(email.label || email.url.replace(/^mailto:/i, ''));
      wrap.innerHTML = '<a class="contact__email" href="' + esc(email.url) + '" data-magnetic="0.12" data-cursor="Write">' +
        '<span class="contact__email-text">' + esc(addr) + '</span><span class="contact__email-line" aria-hidden="true"></span></a>' +
        '<span class="contact__email-hint mono">Usually replies within a day</span>';
    }

    var grid = $('#contact-grid');
    if (!grid) return;
    var social = [li && ['LinkedIn', li.url, I.linkedin], gh && ['GitHub', gh.url, I.github]].filter(Boolean);
    var out = '';
    if (social.length) {
      out += '<div class="contact__col"><h3 class="mono">Elsewhere</h3><ul>' + social.map(function (s) {
        return '<li><a href="' + esc(s[1]) + '"' + extAttrs(s[1]) + '>' + s[2] + esc(s[0]) + '<span class="sr-only"> (opens in a new tab)</span></a></li>';
      }).join('') + '</ul></div>';
    }
    if (resumeUrl) {
      out += '<div class="contact__col"><h3 class="mono">Résumé</h3><ul>' +
        '<li><button type="button" class="linklike" data-resume-open>' + I.preview + 'Preview</button></li>' +
        '<li><a href="' + esc(resolve(resumeUrl)) + '" download>' + I.download + 'Download PDF</a></li>' +
      '</ul></div>';
    }
    out += '<div class="contact__col"><h3 class="mono">Local time</h3><p class="contact__time"><span data-clock>--:--:--</span></p>' +
      '<p class="mono" style="color:var(--ink-2)">' + esc(a.location || '') + ' / IST, UTC+5:30</p></div>';
    out += '<div class="contact__col"><h3 class="mono">Status</h3><p><span class="status-dot" aria-hidden="true"></span>Building. Available for collaborations.</p></div>';
    grid.innerHTML = out;
  }

  // ---------- Blog ----------
  function fmtDate(s) {
    var d = new Date(s);
    if (isNaN(d)) return esc(s);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function renderBlog(posts, about) {
    var root = $('#blog-content');
    if (!root) return;
    if (!posts || !posts.length) {
      var links = (about && about.links) || [];
      var gh = findLink(links, 'github'), li = findLink(links, 'linkedin');
      root.innerHTML = '<div class="empty" data-reveal>' +
        '<span class="empty__idx mono">00 entries</span>' +
        '<div class="empty__body">' +
          '<h2 class="empty__title">The first entry is being drafted.</h2>' +
          '<p class="empty__text">Nothing published yet. New write-ups will be listed here; until then, the work itself lives on GitHub.</p>' +
          '<div class="empty__links">' +
            '<a class="btn" href="../index.html#work" data-magnetic>See selected work</a>' +
            (gh ? '<a class="btn btn--ghost" href="' + esc(gh.url) + '"' + extAttrs(gh.url) + ' data-magnetic>GitHub</a>' : '') +
            (li ? '<a class="btn btn--ghost" href="' + esc(li.url) + '"' + extAttrs(li.url) + ' data-magnetic>LinkedIn</a>' : '') +
          '</div>' +
        '</div></div>';
      return;
    }
    var sorted = posts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    root.innerHTML = '<ol class="post-list">' + sorted.map(function (p, i) {
      var platform = p.platform ? String(p.platform) : 'Blog';
      var key = platform.toLowerCase();
      var label = platform.charAt(0).toUpperCase() + platform.slice(1);
      var tags = (p.tags || []).join(' / ');
      var url = p.url || '#';
      return '<li data-reveal style="--i:' + Math.min(i, 6) + '"><a class="post" href="' + esc(url) + '"' + extAttrs(url) + ' data-cursor="Read">' +
        '<span class="post__meta mono"><span>' + fmtDate(p.date) + '</span><span class="post__platform">' + (I[key] || '') + esc(label) + '</span></span>' +
        '<span class="post__body"><span class="post__title">' + esc(p.title) + '</span>' +
          (p.summary ? '<span class="post__summary" style="display:block">' + esc(p.summary) + '</span>' : '') +
          (tags ? '<span class="post__tags mono" style="display:block">' + esc(tags) + '</span>' : '') +
        '</span>' +
        '<span class="post__arrow">' + I.arrow + '</span>' +
        (isExternal(url) ? '<span class="sr-only"> (opens in a new tab)</span>' : '') +
      '</a></li>';
    }).join('') + '</ol>';
  }

  // ==================================================================
  // PROJECT PREVIEW PANEL (follows cursor; typographic + schematic)
  // ==================================================================
  function schematic(tags, idx) {
    var n = Math.max(1, Math.min(tags.length, 5));
    var W = 340, H = 112, cx = 46, cy = H / 2, bx = 150, ex = 300;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">';
    s += '<rect x="' + (cx - 22) + '" y="' + (cy - 14) + '" width="44" height="28" fill="var(--ink)"/>';
    s += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--paper)">' + pad(idx + 1) + '</text>';
    for (var i = 0; i < n; i++) {
      var y = n === 1 ? cy : 16 + i * ((H - 32) / (n - 1));
      s += '<path d="M' + (cx + 22) + ' ' + cy + ' H' + bx + ' V' + y.toFixed(1) + ' H' + ex + '" fill="none" stroke="currentColor" stroke-width="1"/>';
      s += '<circle cx="' + bx + '" cy="' + y.toFixed(1) + '" r="2.5" fill="currentColor"/>';
      s += '<rect x="' + (ex - 4) + '" y="' + (y - 4).toFixed(1) + '" width="8" height="8" fill="' + (i === 0 ? 'var(--accent)' : 'var(--paper)') + '" stroke="currentColor" stroke-width="1"/>';
      s += '<text x="' + (ex - 12) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8.5" fill="currentColor" opacity=".6">CH.' + (i + 1) + '</text>';
    }
    return s + '</svg>';
  }

  function initWorkPreview(projects) {
    var list = $('#work-list');
    if (!list || !projects || !projects.length) return;
    var mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');

    var panel = doc.createElement('div');
    panel.className = 'preview';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = '<div class="preview__inner">' +
      '<div class="preview__bar mono"><span data-p="idx"></span><b>Repo</b></div>' +
      '<p class="preview__name" data-p="name"></p>' +
      '<p class="preview__desc" data-p="desc"></p>' +
      '<div class="preview__diagram" data-p="diagram"></div>' +
      '<ul class="preview__tags mono" data-p="tags"></ul>' +
      '<p class="preview__foot mono" data-p="foot"></p>' +
    '</div>';
    body.appendChild(panel);
    var P = {};
    $$('[data-p]', panel).forEach(function (n) { P[n.getAttribute('data-p')] = n; });

    var x = pointer.x, y = pointer.y, tx = x, ty = y, pw = 340, ph = 360;
    var active = -1, visible = false, running = false, followPointer = true;

    function fill(i) {
      if (i === active) return;
      active = i;
      var p = projects[i] || {};
      var tags = p.tags || [];
      P.idx.textContent = '(' + pad(i + 1) + ') / ' + pad(projects.length);
      P.name.textContent = p.name || '';
      P.desc.textContent = p.description || '';
      P.diagram.innerHTML = schematic(tags, i);
      P.tags.innerHTML = tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      P.foot.textContent = p.url ? prettyUrl(p.url) : 'Private / in progress';
      pw = panel.offsetWidth; ph = panel.offsetHeight;
    }
    function place() {
      var vw = window.innerWidth, vh = window.innerHeight, m = 16;
      var px = x + 28, py = y - ph / 2;
      if (px + pw > vw - m) px = x - pw - 28;
      py = Math.max(m + 56, Math.min(vh - ph - m, py));
      panel.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
    }
    function loop() {
      var k = REDUCED ? 1 : 0.14;
      x += (tx - x) * k; y += (ty - y) * k;
      place();
      if (visible && (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2)) raf(loop); else running = false;
    }
    function kick() { if (!running) { running = true; raf(loop); } }
    function show(i, snap) {
      if (!mq.matches) return;
      fill(i);
      if (snap) { x = tx; y = ty; }
      visible = true;
      panel.classList.add('is-visible');
      kick();
    }
    function hide() { visible = false; active = -1; panel.classList.remove('is-visible'); }

    list.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY; followPointer = true;
      var row = e.target.closest('.work-row');
      if (row) show(+row.getAttribute('data-index'), !visible); else hide();
      kick();
    });
    list.addEventListener('pointerleave', hide);
    // Keyboard: anchor the panel beside the focused row
    list.addEventListener('focusin', function (e) {
      var row = e.target.closest('.work-row');
      if (!row || !mq.matches) return;
      var r = row.getBoundingClientRect();
      tx = Math.min(window.innerWidth * 0.62, r.right - 380); ty = r.top + r.height / 2; followPointer = false;
      show(+row.getAttribute('data-index'), true);
    });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) hide(); });
    window.addEventListener('scroll', function () { if (visible && followPointer) hide(); }, { passive: true });
  }

  // ==================================================================
  // ABOUT: WORD SCRUB (15% -> 100% opacity tied to scroll)
  // ==================================================================
  function initScrub() {
    var el = $('#about-statement');
    if (!el || REDUCED || !gsap || !ST) return;
    var words;
    try {
      if (Split) {
        var split = Split.create(el, { type: 'words', wordsClass: 'w' });
        words = split.words;
      }
    } catch (e) { words = null; }
    if (!words || !words.length) {
      // Manual fallback split (SplitText unavailable)
      var text = el.textContent;
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(' ').map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
      words = $$('.w', el);
    }
    gsap.fromTo(words, { opacity: 0.15 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 }
    });
  }

  // ==================================================================
  // HERO: scroll progress (WebGL + gentle parallax)
  // ==================================================================
  function heroProgress(p) {
    if (heroGL && typeof heroGL.setProgress === 'function') {
      try { heroGL.setProgress(p); } catch (e) { }
    }
  }
  function initHeroScroll() {
    var hero = $('.hero');
    if (!hero) return;
    if (ST) {
      ST.create({
        trigger: hero, start: 'top top', end: 'bottom top',
        onUpdate: function (self) { heroProgress(self.progress); }
      });
      if (!REDUCED) {
        gsap.to('#hero-name', {
          yPercent: 18, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
        gsap.to('.hero__intro', {
          yPercent: -40, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    } else {
      var tick = false;
      window.addEventListener('scroll', function () {
        if (tick) return; tick = true;
        raf(function () {
          tick = false;
          var h = hero.offsetHeight || 1;
          heroProgress(Math.max(0, Math.min(1, window.scrollY / h)));
        });
      }, { passive: true });
    }
  }

  function mountHeroGL() {
    var el = $('#hero-gl');
    if (!el || IS_BLOG) return;
    var url;
    try { url = new URL(ROOT + 'assets/js/hero-gl.js', doc.baseURI).href; } catch (e) { return; }
    var start = function () {
      try {
        import(url).then(function (mod) {
          if (!mod || typeof mod.mountHero !== 'function') return;
          try {
            heroGL = mod.mountHero(el, { reducedMotion: REDUCED }) || null;
            if (heroGL) {
              el.classList.add('is-mounted');
              if (typeof heroGL.setTheme === 'function') heroGL.setTheme(currentTheme());
              var h = $('.hero');
              heroProgress(h ? Math.max(0, Math.min(1, window.scrollY / (h.offsetHeight || 1))) : 0);
            }
          } catch (err) { heroGL = null; console.warn('[hero-gl] mount failed:', err); }
        }).catch(function (err) { console.warn('[hero-gl] unavailable:', err); });
      } catch (err) { console.warn('[hero-gl] dynamic import unsupported:', err); }
    };
    // Let the first paint + preloader breathe before spinning up WebGL
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1200 });
    else setTimeout(start, 200);
  }

  // ==================================================================
  // VELOCITY MARQUEE
  // ==================================================================
  function initMarquee() {
    var wrap = $('#marquee'), track = $('#marquee-track');
    if (!wrap || !track || REDUCED || !track.children.length) return;
    var x = 0, half = 0, dir = -1, vel = 0, visible = false, lastY = window.scrollY;
    function measure() { half = track.scrollWidth / 2; }
    measure();
    onFontsReady(measure);
    window.addEventListener('resize', debounce(measure, 200));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(wrap);
    } else visible = true;

    function step() {
      var y = window.scrollY;
      var sv = lenis ? (lenis.velocity || 0) : (y - lastY);
      lastY = y;
      vel += (sv - vel) * 0.12;
      if (sv > 0.4) dir = -1; else if (sv < -0.4) dir = 1;
      if (visible && half > 0) {
        var speed = 0.55 + Math.min(Math.abs(vel) * 0.5, 14);
        x += speed * dir;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        var skew = Math.max(-6, Math.min(6, vel * -0.25));
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
      }
    }
    if (gsap) gsap.ticker.add(step);
    else { var loop = function () { step(); raf(loop); }; raf(loop); }
  }

  // ==================================================================
  // RÉSUMÉ MODAL
  // ==================================================================
  var modal = {
    el: null, last: null, url: '',
    init: function (url) {
      this.el = $('#resume-modal');
      this.url = url ? resolve(url) : '';
      var self = this;
      if (!this.el || !this.url) {
        $$('[data-resume-open]').forEach(function (b) { b.hidden = true; });
        return;
      }
      var dl = $('#resume-download'), nt = $('#resume-newtab');
      if (dl) dl.setAttribute('href', this.url);
      if (nt) nt.setAttribute('href', this.url);
      doc.addEventListener('click', function (e) {
        var opener = e.target.closest && e.target.closest('[data-resume-open]');
        if (opener) { e.preventDefault(); self.open(opener); return; }
        if (e.target.closest && e.target.closest('[data-modal-close]')) { e.preventDefault(); self.close(); }
      });
      this.el.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.stopPropagation(); self.close(); return; }
        if (e.key !== 'Tab') return;
        var f = $$('a[href], button:not([disabled]), iframe', self.el).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    },
    open: function (opener) {
      if (!this.el) return;
      this.last = opener || doc.activeElement;
      var frame = $('#resume-frame');
      if (frame && !frame.getAttribute('src')) frame.setAttribute('src', this.url + '#view=FitH');
      this.el.hidden = false;
      void this.el.offsetWidth;
      this.el.classList.add('is-open');
      html.classList.add('modal-open');
      body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      var close = $('.modal__close', this.el);
      if (close) close.focus();
    },
    close: function () {
      if (!this.el || this.el.hidden) return;
      var el = this.el;
      el.classList.remove('is-open');
      html.classList.remove('modal-open');
      body.style.overflow = '';
      if (lenis) lenis.start();
      setTimeout(function () { el.hidden = true; }, REDUCED ? 0 : 450);
      if (this.last && this.last.focus) try { this.last.focus({ preventScroll: true }); } catch (e) { }
    }
  };

  // ==================================================================
  // ERROR STATE
  // ==================================================================
  function showLoadError(err) {
    console.error('Content load error:', err);
    var box = $('#load-error');
    if (box) {
      box.hidden = false;
      box.innerHTML = '<strong>Content didn’t load.</strong>' +
        '<p>The page text lives in <code>data/content.yaml</code>. If you are previewing locally, serve the folder over HTTP ' +
        '(for example <code>python -m http.server</code>) instead of opening the file directly, then reload.</p>';
    }
    $$('[data-reveal]').forEach(function (n) { n.classList.add('in'); });
    $$('[data-resume-open]').forEach(function (b) { b.hidden = true; });
    preloader.ready();
  }

  // ==================================================================
  // BOOT
  // ==================================================================
  function afterRender(data) {
    var about = data.about || {};
    initReveals();
    initMagnetic();
    modal.init(about.resume_url || (findLink(about.links, 'preview') || {}).url);
    if (!IS_BLOG) {
      initActiveNav();
      initWorkPreview(data.projects || []);
      onFontsSettled(function () { initScrub(); refreshST(); });
      initMarquee();
      initHeroScroll();
      mountHeroGL();
    }
    fitDisplay();
    refreshST();
    onFontsReady(function () { fitDisplay(); refreshST(); });
    window.addEventListener('load', refreshST);
    preloader.ready();
  }

  if (typeof window.fetch !== 'function') { showLoadError(new Error('fetch unsupported')); return; }

  fetch(ROOT + 'data/content.yaml', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' loading content.yaml'); return r.text(); })
    .then(function (text) {
      if (!window.jsyaml) throw new Error('js-yaml failed to load');
      var data = window.jsyaml.load(text) || {};
      var about = data.about || {};

      if (IS_BLOG) {
        renderBlog(data.blogs, about);
        if (about.name) { $$('[data-name]').forEach(function (n) { n.textContent = about.name; }); document.title = 'Blog — ' + about.name; }
      } else {
        renderHero(about);
        renderAbout(about, data);
        renderWork(data.projects, about.links);
        renderLedger(data.experience);
        renderMarquee(data.skills);
        renderSpec(data.skills);
        renderEducation(data.education, data.certifications);
        renderCounts(data);
        if (about.name && about.title) document.title = about.name + ' — ' + about.title;
      }
      renderContact(about);
      afterRender(data);
    })
    .catch(showLoadError);
})();
