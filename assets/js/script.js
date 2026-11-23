/* ==================================================================
   PORTFOLIO v2 — "Kinetic Lab"
   YAML-driven renderer + interactions. Content lives in data/content.yaml.
   Every library (GSAP + plugins, Lenis, playground.js) is optional:
   the page renders complete, readable content without any of them.
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

  // ---------- Libraries (all guarded) ----------
  var gsap = window.gsap || null;
  var ST = null, Split = null, Drag = null, Inertia = null, DrawSVG = null;
  if (gsap) {
    try { if (window.ScrollTrigger) { gsap.registerPlugin(window.ScrollTrigger); ST = window.ScrollTrigger; } } catch (e) { ST = null; }
    try { if (window.SplitText) { gsap.registerPlugin(window.SplitText); Split = window.SplitText; } } catch (e) { Split = null; }
    try { if (window.InertiaPlugin) { gsap.registerPlugin(window.InertiaPlugin); Inertia = window.InertiaPlugin; } } catch (e) { Inertia = null; }
    try { if (window.Draggable) { gsap.registerPlugin(window.Draggable); Drag = window.Draggable; } } catch (e) { Drag = null; }
    try { if (window.DrawSVGPlugin) { gsap.registerPlugin(window.DrawSVGPlugin); DrawSVG = window.DrawSVGPlugin; } } catch (e) { DrawSVG = null; }
  }
  var MOTION = !!gsap && !REDUCED;

  var lenis = null;
  var playground = null;
  var TZ = 'Asia/Kolkata';
  var currentZone = null;

  // Colour helpers (tokens live in CSS)
  var CHIP_SET = [['tomato', 'ink'], ['cobalt', 'cream'], ['sun', 'ink'], ['blush', 'ink'], ['ink', 'cream'], ['lime', 'ink']];
  var POSTER_SET = ['tomato', 'cobalt', 'sun', 'blush', 'lime', 'contrast'];
  var XP_FILLS = ['tomato', 'sun', 'lime', 'cream'];
  var CERT_SET = ['sun', 'blush', 'lime', 'cream'];
  var ROT_SET = [['tomato', 'ink'], ['lime', 'ink'], ['sun', 'ink'], ['blush', 'ink'], ['cobalt', 'cream']];

  // ---------- Icons ----------
  var I = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M8.5 6H18v9.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45z"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M6 10l6 6 6-6M4 21h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    preview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h11l5 5v13H4zM14 3v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
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
    // split on commas that are not inside parentheses
    var out = [], depth = 0, cur = '';
    String(str || '').split('').forEach(function (ch) {
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch;
    });
    out.push(cur);
    return out.map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function joinAnd(arr) { return arr.length < 2 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' & ' + arr[arr.length - 1]; }
  function findLink(links, icon) { return (links || []).filter(function (l) { return l && l.icon === icon; })[0]; }
  function isCurrent(date) { return /present/i.test(date || ''); }
  function isExternal(url) { return /^https?:/i.test(url || ''); }
  function resolve(url) {
    if (!url) return '#';
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) return url;
    return ROOT + url;
  }
  function extAttrs(url) { return isExternal(url) ? ' target="_blank" rel="noopener"' : ''; }
  function raf(fn) { return window.requestAnimationFrame(fn); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function refreshST() { if (ST) { try { ST.refresh(); } catch (e) { } } }
  function token(name) { return getComputedStyle(html).getPropertyValue('--' + name).trim(); }
  function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
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
  function whenFonts(maxMs, fn) {
    var done = false;
    function go() { if (done) return; done = true; fn(); }
    onFontsSettled(go);
    setTimeout(go, maxMs);
  }
  function inView(el, cb, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (en) { cb(en[0].isIntersecting); }, { rootMargin: margin || '0px' }).observe(el);
  }

  $$('[data-year]').forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

  // ==================================================================
  // FRAME LOOP + SMOOTH SCROLL
  // ==================================================================
  var ticks = [];
  var scrollState = { v: 0, y: window.scrollY };
  function addTick(fn) { ticks.push(fn); }

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

  function frame() {
    var y = window.scrollY;
    var rawV = lenis && typeof lenis.velocity === 'number' ? lenis.velocity : (y - scrollState.y);
    scrollState.y = y;
    scrollState.v += (rawV - scrollState.v) * 0.15;
    for (var i = 0; i < ticks.length; i++) { try { ticks[i](); } catch (e) { } }
  }
  if (!REDUCED) {
    if (gsap) gsap.ticker.add(frame);
    else (function loop() { frame(); raf(loop); })();
  }

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
    // pinned sections live inside a pin-spacer: scroll to the spacer's top
    var scrollEl = target.parentNode && target.parentNode.classList && target.parentNode.classList.contains('pin-spacer') ? target.parentNode : target;
    scrollToTarget(id === '#top' ? 0 : scrollEl);
    if (history.replaceState) history.replaceState(null, '', id);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (err) { }
  });

  // ==================================================================
  // THEME
  // ==================================================================
  function currentTheme() { return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function syncThemeUI() {
    var t = currentTheme();
    var btn = $('#theme-toggle');
    if (btn) btn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme');
    if (!currentZone) setMetaColor(t === 'dark' ? '#141210' : '#F4EFE6');
  }
  function setMetaColor(c) {
    var meta = $('meta[name="theme-color"]');
    if (meta && c) meta.setAttribute('content', c);
  }
  function applyTheme(t, persist) {
    html.setAttribute('data-theme', t);
    if (persist) { try { localStorage.setItem('theme', t); } catch (e) { } }
    syncThemeUI();
    if (currentZone) setZone(currentZone, true);
    if (playground && typeof playground.setTheme === 'function') { try { playground.setTheme(t); } catch (e) { } }
  }
  (function initTheme() {
    syncThemeUI();
    var btn = $('#theme-toggle');
    if (btn) btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
      if (MOTION) gsap.fromTo(btn, { rotation: -25, scale: .85 }, { rotation: 0, scale: 1, duration: .8, ease: 'elastic.out(1,0.4)' });
    });
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
  // NAV: hide on scroll down, progress ring
  // ==================================================================
  (function initScrollUI() {
    var nav = $('#nav');
    var ring = $('#progress-ring');
    var lastY = window.scrollY, ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      if (nav) {
        var menuOpen = html.classList.contains('menu-open');
        if (!menuOpen && y > window.innerHeight * 0.5 && y > lastY + 3) nav.classList.add('is-hidden');
        else if (y < lastY - 3 || y < 40 || menuOpen) nav.classList.remove('is-hidden');
      }
      if (ring) ring.style.strokeDasharray = (max > 0 ? clamp(0, 100, (y / max) * 100) : 0).toFixed(2) + ' 100';
      lastY = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
    update();
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
      if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { } }, 80);
    }
  }
  function closeMenu() {
    if (menuEl && menuEl.classList.contains('is-open')) { setMenu(false); if (menuBtn) menuBtn.focus(); }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!menuEl.classList.contains('is-open')); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', debounce(function () { if (window.innerWidth > 1100) closeMenu(); }, 150));

  // ==================================================================
  // LIVE IST CLOCK
  // ==================================================================
  (function initClock() {
    var fmt = null;
    try { fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }); } catch (e) { }
    function tick() {
      var s;
      if (fmt) s = fmt.format(new Date());
      else {
        var d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
        s = pad(d.getHours()) + ':' + pad(d.getMinutes());
      }
      $$('[data-clock]').forEach(function (n) { if (n.textContent !== s) n.textContent = s; });
    }
    tick();
    setInterval(tick, 5000);
  })();

  // ==================================================================
  // BLOB CURSOR (fine pointers only, never with reduced motion)
  // ==================================================================
  var cursor = null;
  (function initCursor() {
    if (!FINE || REDUCED) return;
    var c = doc.createElement('div');
    c.className = 'cursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="cursor__blob"></div><span class="cursor__label"></span>';
    body.appendChild(c);
    html.classList.add('has-cursor');
    cursor = c;
    var blob = $('.cursor__blob', c), label = $('.cursor__label', c);
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2, x = tx, y = ty;
    var s = 1, sT = 1, last = '';

    function step() {
      var dx = tx - x, dy = ty - y;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(sT - s) < 0.005) return;
      x += dx * 0.24; y += dy * 0.24; s += (sT - s) * 0.2;
      var speed = Math.sqrt(dx * dx + dy * dy);
      var stretch = Math.min(speed / 90, 0.45);
      var ang = Math.atan2(dy, dx) * 57.2958;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      blob.style.transform = 'rotate(' + ang.toFixed(1) + 'deg) scale(' + (s * (1 + stretch)).toFixed(3) + ',' + (s * (1 - stretch * 0.5)).toFixed(3) + ')';
    }
    if (gsap) gsap.ticker.add(step); else (function loop() { step(); raf(loop); })();

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      c.classList.add('is-visible');
    }, { passive: true });
    doc.addEventListener('pointerleave', function () { c.classList.remove('is-visible'); });
    window.addEventListener('blur', function () { c.classList.remove('is-visible'); });
    doc.addEventListener('pointerdown', function () { sT = sT * 0.75; });
    doc.addEventListener('pointerup', function () { refreshTarget(lastTarget); });
    var lastTarget = null;
    function refreshTarget(t) {
      lastTarget = t;
      var lab = t && t.closest && t.closest('[data-cursor]');
      var link = t && t.closest && t.closest('a, button, [role="button"], .chip, .sticker');
      if (lab) {
        var txt = lab.getAttribute('data-cursor');
        if (txt !== last) { label.textContent = txt; last = txt; }
        c.classList.add('is-label'); sT = 4;
      } else {
        c.classList.remove('is-label'); sT = link ? 2.2 : 1;
      }
    }
    doc.addEventListener('pointerover', function (e) { refreshTarget(e.target); });
  })();

  // ==================================================================
  // MAGNETIC ELEMENTS
  // ==================================================================
  function initMagnetic(scope) {
    if (!FINE || REDUCED || !gsap) return;
    $$('[data-magnetic]', scope).forEach(function (el) {
      if (el.__mag) return; el.__mag = true;
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 0.35;
      var rect = null;
      var setX = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1,0.4)' });
      var setY = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1,0.4)' });
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
  // RENDERERS
  // ==================================================================
  function setText(sel, txt) { var n = $(sel); if (n) n.textContent = txt || ''; }
  function lettersHTML(word) {
    return String(word).split('').map(function (ch) {
      return ch === ' ' ? '<span class="kl">&nbsp;</span>' : '<span class="kl">' + esc(ch) + '</span>';
    }).join('');
  }

  function buildRoles(skills) {
    var rules = [
      [/robot/i, function () { return 'builds robots'; }],
      [/\bAI\b|machine/i, function () { return 'trains models'; }],
      [/cloud/i, function () { return 'deploys to the cloud'; }],
      [/app/i, function (it) { return 'ships ' + it[0] + ' apps'; }],
      [/program/i, function (it) { return 'writes ' + joinAnd(it); }],
      [/simulat/i, function (it) { return 'simulates in ' + it[0]; }],
      [/web/i, function () { return 'keeps websites running'; }]
    ];
    var out = [];
    var used = {};
    rules.forEach(function (r) {
      (skills || []).forEach(function (s, i) {
        if (used[i] || !r[0].test(s.category || '')) return;
        var items = splitList(s.items);
        if (!items.length) return;
        used[i] = true;
        out.push(r[1](items));
      });
    });
    (skills || []).forEach(function (s, i) {
      if (used[i]) return;
      var items = splitList(s.items);
      if (items.length) out.push('works with ' + items[0]);
    });
    return out;
  }

  function starPoints(n, ro, ri, cx, cy) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? ri : ro, a = Math.PI * i / n - Math.PI / 2;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }

  function stickerCircle(text, id) {
    return '<svg viewBox="0 0 200 200"><defs><path id="' + id + '" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs>' +
      '<circle cx="100" cy="100" r="97" fill="var(--cobalt)" stroke="var(--ink)" stroke-width="3"/>' +
      '<circle cx="100" cy="100" r="54" fill="none" stroke="var(--cream)" stroke-width="1.5" stroke-dasharray="3 5"/>' +
      '<text font-size="15" fill="var(--cream)" letter-spacing="1"><textPath href="#' + id + '" textLength="474" lengthAdjust="spacing">' + esc(text) + '</textPath></text>' +
      '<polygon points="' + starPoints(8, 30, 13, 100, 100) + '" fill="var(--sun)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  }
  function stickerStar(l1, l2, fill) {
    return '<svg viewBox="0 0 200 200"><polygon points="' + starPoints(18, 98, 82, 100, 100) + '" fill="' + (fill || 'var(--lime)') + '" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>' +
      '<text x="100" y="' + (l2 ? 94 : 110) + '" text-anchor="middle" style="font-family:var(--f-display);font-style:italic;font-weight:600;font-variation-settings:\'opsz\' 48,\'SOFT\' 100,\'WONK\' 1" font-size="' + (l2 ? 28 : 34) + '" fill="var(--ink)">' + esc(l1) + '</text>' +
      (l2 ? '<text x="100" y="128" text-anchor="middle" style="font-family:var(--f-display);font-weight:800;font-variation-settings:\'opsz\' 48,\'SOFT\' 100" font-size="' + (l2.length > 9 ? 24 : 30) + '" fill="var(--ink)">' + esc(l2) + '</text>' : '') +
      '</svg>';
  }

  function renderStickers(data) {
    var box = $('#stickers');
    if (!box) return;
    var a = data.about || {};
    var list = [];
    if (IS_BLOG) {
      list.push({ html: stickerCircle('NOTES · AI · ROBOTICS · CLOUD · NOTES · ', 'sc-blog'), x: '76%', y: '18%', mx: '64%', my: '13%', spin: 0.3 });
      list.push({ html: '<span class="sticker__pill sticker__pill--sun"><small>' + esc(String(a.location || 'Kolkata').split(',')[0]) + '</small><b data-clock>--:--</b><small>IST</small></span>', x: '62%', y: '52%', mx: '66%', my: '30%', r: '7deg', w: 'auto', tilt: true });
    } else {
      list.push({ html: stickerCircle('AI · ROBOTICS · CLOUD · AI · ROBOTICS · CLOUD · ', 'sc-hero'), x: '79%', y: '21%', mx: '64%', my: '25%', spin: 0.25 });
      var cto = (data.experience || []).filter(function (j) { return /chief technology officer/i.test(j.role || ''); })[0];
      if (cto) {
        var co = String(cto.company || '').replace(/\s+(LLP|LLC|Ltd\.?|Inc\.?|Pvt\.?)$/i, '');
        list.push({ html: stickerStar('CTO @', co), x: '73%', y: '50%', mx: '70%', my: '44%', spin: -0.15 });
      }
      var iit = null;
      (data.education || []).some(function (e) {
        var m = /Indian Institute of Technology,?\s*([A-Za-z]+)/i.exec(e.institution || '');
        if (m) { iit = { name: 'IIT ' + m[1], deg: String(e.degree || '').replace(/Artificial Intelligence/i, 'AI') }; return true; }
        return false;
      });
      if (iit) list.push({ html: '<span class="sticker__pill">' + esc(iit.name) + '<small>' + esc(iit.deg) + '</small></span>', x: '2.5%', y: '64%', mx: '4%', my: '15%', r: '-8deg', w: 'auto', tilt: true });
      list.push({ html: '<span class="sticker__pill sticker__pill--sun"><small>' + esc(String(a.location || 'Kolkata').split(',')[0]) + '</small><b data-clock>--:--</b><small>IST</small></span>', x: '44%', y: '13%', r: '6deg', w: 'auto', tilt: true });
    }
    box.innerHTML = list.map(function (s) {
      var st = '--x:' + s.x + ';--y:' + s.y + ';' + (s.mx ? '--mx:' + s.mx + ';--my:' + s.my + ';' : '') + (s.r ? '--r:' + s.r + ';' : '') + (s.w ? '--w:' + s.w + ';' : '');
      return '<div class="sticker ' + (s.cls || '') + '" style="' + st + '" data-cursor="drag" data-spin="' + (s.spin || 0) + '"' + (s.tilt ? ' data-tilt="1"' : '') + '><div class="sticker__spin">' + s.html + '</div></div>';
    }).join('');
    // fill clocks immediately
    var clk = $('[data-clock]');
    if (clk) $$('[data-clock]', box).forEach(function (n) { n.textContent = clk.textContent; });
  }

  var ROLES = [];
  function renderHero(a, data) {
    var name = String(a.name || '').trim();
    if (name) {
      var parts = name.split(/\s+/);
      var last = parts.length > 1 ? parts.pop() : '';
      var first = parts.join(' ');
      var h = $('#hero-name');
      if (h) {
        h.setAttribute('aria-label', name);
        h.innerHTML = '<span class="hero__line hero__line--1" aria-hidden="true">' + lettersHTML(first) + '</span>' +
          (last ? '<span class="hero__line hero__line--2" aria-hidden="true">' + lettersHTML(last) + '</span>' : '');
      }
      $$('[data-name]').forEach(function (n) { n.textContent = name; });
    }
    setText('#hero-role', a.title);
    setText('#hero-tagline', a.tagline);
    ROLES = buildRoles(data.skills);
    var rot = $('#rotator');
    if (rot && ROLES.length) rot.innerHTML = '<span class="rotator__word">' + esc(ROLES[0]) + '</span>';
    else if (rot) rot.parentNode.removeChild(rot);
    renderStickers(data);
  }

  var HL_PATHS = {
    circle: 'M30,52 C18,26 70,6 128,8 C178,10 198,34 186,56 C172,80 96,84 44,74 C14,68 4,48 22,30 C40,14 80,10 110,12',
    under: 'M4,30 C46,20 104,40 196,22',
    scribble: 'M4,22 C60,12 130,32 196,16 C150,28 80,40 24,40'
  };
  function hlWrap(word, kind, colour) {
    return '<span class="hl hl--' + kind + '" style="--hl:var(--' + colour + ')">' + word +
      '<svg class="hl__svg" viewBox="0 0 200 ' + (kind === 'circle' ? 90 : 50) + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + HL_PATHS[kind] + '"/></svg></span>';
  }

  function renderAbout(a, data) {
    var big = $('#about-big');
    if (big) {
      var t = esc(String(a.tagline || a.title || '').trim());
      var marks = [[/\b(AI)\b/, 'circle', 'tomato'], [/\b(robotics)\b/i, 'under', 'cobalt'], [/\b(cloud)\b/i, 'scribble', 'ink']];
      marks.forEach(function (m) { t = t.replace(m[0], function (w) { return hlWrap(w, m[1], m[2]); }); });
      big.innerHTML = t;
    }
    var sum = $('#about-summary');
    if (sum) sum.textContent = String(a.summary || '').replace(/\s+/g, ' ').trim();

    var facts = $('#about-facts');
    if (!facts) return;
    var out = '';
    if (a.location) out += fact('Based in', '<dd>' + esc(a.location) + '</dd>');
    var learning = splitList(a.currently_learning);
    if (learning.length) out += fact('Learning', learning.map(function (l) { return '<dd>' + esc(l) + '</dd>'; }).join(''));
    var current = (data.experience || []).filter(function (j) { return isCurrent(j.date); });
    if (current.length) {
      var lead = current.filter(function (j) { return /chief|officer|lead|head/i.test(j.role); });
      var shown = (lead.length ? lead : current).slice(0, 2);
      out += fact('Right now', shown.map(function (j) {
        return '<dd>' + esc(j.role) + '<small>' + esc(j.company) + '</small></dd>';
      }).join('') + (current.length > shown.length ? '<dd><small><a href="#experience">+ ' + (current.length - shown.length) + ' more current roles</a></small></dd>' : ''));
    }
    var edu = (data.education || []).slice(0, 2);
    if (edu.length) out += fact('Studying', edu.map(function (e) {
      return '<dd>' + esc(e.degree) + '<small>' + esc(e.institution) + '</small></dd>';
    }).join(''));
    facts.innerHTML = out;
    function fact(k, v) { return '<div class="fact"><dt>' + esc(k) + '</dt>' + v + '</div>'; }
  }

  var STAR_SVG = '<svg class="marquee__star" viewBox="0 0 40 40" aria-hidden="true"><polygon points="' + starPoints(6, 19, 8, 20, 20) + '" stroke-linejoin="round"/></svg>';
  function renderMarquee(skills) {
    var wrap = $('#marquee');
    if (!wrap) return;
    var items = [], cats = [];
    (skills || []).forEach(function (s) { items = items.concat(splitList(s.items)); if (s.category) cats.push(s.category); });
    if (!items.length) { wrap.hidden = true; return; }
    var rows = $$('.marquee__track', wrap);
    [items, cats.length ? cats : items].forEach(function (list, r) {
      if (!rows[r]) return;
      var seq = list.map(function (s) { return '<span class="marquee__item">' + esc(s) + '</span>' + STAR_SVG; }).join('');
      if (list.length < 10) seq = seq + seq;
      rows[r].innerHTML = seq + seq;
    });
  }

  function renderWork(projects, links) {
    var list = $('#work-list');
    if (!list) return;
    projects = projects || [];
    var total = pad(projects.length);
    list.innerHTML = projects.map(function (p, i) {
      var url = p.url && p.url !== '#' ? p.url : '';
      var tag = url ? 'a' : 'div';
      var attrs = url ? ' href="' + esc(url) + '"' + extAttrs(url) + ' data-cursor="open"' : '';
      var colour = POSTER_SET[i % POSTER_SET.length];
      var name = String(p.name || '');
      var longest = Math.max(4, Math.max.apply(null, name.split(/\s+/).map(function (w) { return w.length; })));
      return '<li>' +
        '<' + tag + ' class="poster poster--' + colour + '"' + attrs + '>' +
          '<span class="poster__num" aria-hidden="true">' + pad(i + 1) + '</span>' +
          '<div class="poster__top"><span class="poster__idx">' + pad(i + 1) + ' / ' + total + '</span>' +
            '<ul class="poster__tags">' + (p.tags || []).slice(0, 4).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
          '<h3 class="poster__title" style="--t:' + longest + '">' + esc(name) + '</h3>' +
          '<div class="poster__foot"><p class="poster__desc">' + esc(p.description) + '</p>' +
            (url ? '<span class="poster__go" aria-hidden="true">' + I.arrow + '</span>' : '') + '</div>' +
          (url && isExternal(url) ? '<span class="sr-only"> (opens in a new tab)</span>' : '') +
        '</' + tag + '>' +
      '</li>';
    }).join('');

    var more = $('#work-more');
    var gh = findLink(links, 'github');
    if (more) {
      more.innerHTML = gh ? '<p>More experiments live on GitHub.</p><a class="btn btn--ink" href="' + esc(gh.url) + '"' + extAttrs(gh.url) + ' data-magnetic data-cursor="open">' + I.github + 'Open GitHub</a>' : '';
      if (!gh) more.hidden = true;
    }
  }

  function renderXP(jobs) {
    var root = $('#xp-list');
    if (!root) return;
    root.innerHTML = (jobs || []).map(function (j, i) {
      var cur = isCurrent(j.date);
      var fill = XP_FILLS[i % XP_FILLS.length];
      return '<li class="xp" style="--fill:var(--' + fill + ')">' +
        '<h3 class="xp__h"><button class="xp__btn" type="button" id="xp-b-' + i + '" aria-expanded="false" aria-controls="xp-p-' + i + '" data-cursor="open">' +
          '<span class="xp__date">' + esc(j.date) + '</span>' +
          '<span class="xp__role">' + esc(j.role) + '</span>' +
          '<span class="xp__co">' + esc(j.company) + '</span>' +
          (cur ? '<span class="xp__now">Now</span>' : '<span></span>') +
          '<span class="xp__plus" aria-hidden="true"></span>' +
        '</button></h3>' +
        '<div class="xp__panel" id="xp-p-' + i + '" role="region" aria-labelledby="xp-b-' + i + '">' +
          '<div class="xp__inner"><span class="xp__loc">' + esc(j.location || '') + '</span>' +
            '<ul>' + (j.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>' +
        '</div>' +
      '</li>';
    }).join('');
  }

  var TOOL_ITEMS = [];
  function renderToolbox(skills) {
    var legend = $('#legend');
    TOOL_ITEMS = [];
    var legendHTML = '';
    (skills || []).forEach(function (s, ci) {
      var set = CHIP_SET[ci % CHIP_SET.length];
      var items = splitList(s.items);
      items.forEach(function (label) { TOOL_ITEMS.push({ label: label, c: set[0], k: set[1] }); });
      legendHTML += '<li><span class="legend__dot" style="--c:var(--' + set[0] + ')" aria-hidden="true"></span><span><b>' + esc(s.category) + '</b> <span class="legend__items">' + esc(items.join(', ')) + '</span></span></li>';
    });
    if (legend) legend.innerHTML = legendHTML;
    renderStaticChips();
  }
  function renderStaticChips() {
    var el = $('#playground');
    if (!el) return;
    el.classList.add('is-static');
    el.innerHTML = TOOL_ITEMS.map(function (it) {
      return '<span class="chip" style="--c:var(--' + it.c + ');--k:var(--' + it.k + ')">' + esc(it.label) + '</span>';
    }).join('');
  }
  function mountPlaygroundModule() {
    var el = $('#playground');
    if (!el || !TOOL_ITEMS.length || REDUCED) return;
    var url;
    try { url = new URL(ROOT + 'assets/js/playground.js', doc.baseURI).href; } catch (e) { return; }
    var started = false;
    function start() {
      if (started) return; started = true;
      try {
        import(url).then(function (mod) {
          if (!mod || typeof mod.mountPlayground !== 'function') throw new Error('mountPlayground missing');
          var items = TOOL_ITEMS.slice(0, 40).map(function (it) { return { label: it.label, color: token(it.c), ink: token(it.k) }; });
          el.classList.remove('is-static');
          el.innerHTML = '';
          try {
            playground = mod.mountPlayground(el, items, { reducedMotion: false, theme: currentTheme() }) || null;
            if (playground && typeof playground.setTheme === 'function') playground.setTheme(currentTheme());
            refreshST();
          } catch (err) { playground = null; renderStaticChips(); refreshST(); console.warn('[playground] mount failed:', err); }
        }).catch(function (err) { console.warn('[playground] unavailable, using static chips:', err); });
      } catch (err) { console.warn('[playground] dynamic import unsupported:', err); }
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); start(); }
      }, { rootMargin: '900px 0px' });
      io.observe(el);
    } else start();
  }
  (function initShake() {
    var btn = $('#shake-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (playground && typeof playground.shake === 'function') { try { playground.shake(); } catch (e) { } }
      else if (MOTION) {
        gsap.fromTo('#playground .chip', { rotation: 0, y: 0 }, {
          rotation: function () { return rand(-14, 14); }, y: function () { return rand(-18, -4); },
          duration: .16, yoyo: true, repeat: 3, ease: 'sine.inOut', stagger: .01, overwrite: true,
          onComplete: function () { gsap.set('#playground .chip', { clearProps: 'transform' }); }
        });
      }
      if (MOTION) gsap.fromTo(btn, { rotation: -6 }, { rotation: 0, duration: .7, ease: 'elastic.out(1.2,0.3)' });
    });
  })();

  function renderEducation(edu, certs) {
    var e = $('#edu-list');
    if (e) e.innerHTML = (edu || []).map(function (x) {
      return '<li class="edu-item">' +
        '<span class="edu-item__year">' + esc(x.year) + '</span>' +
        '<div><p class="edu-item__title">' + esc(x.degree) + '</p><span class="edu-item__sub">' + esc(x.institution) + '</span></div>' +
      '</li>';
    }).join('');
    var c = $('#cert-list');
    var tilts = [-3, 2.5, -1.5, 3.5, -2.5, 1.5];
    if (c) c.innerHTML = (certs || []).map(function (x, i) {
      return '<li class="cert" style="--c:var(--' + CERT_SET[i % CERT_SET.length] + ');--r:' + tilts[i % tilts.length] + 'deg">' +
        '<b>' + esc(x.name) + '</b>' + (x.issuer ? '<small>' + esc(x.issuer) + '</small>' : '') +
      '</li>';
    }).join('');
  }

  function renderCounts(data) {
    var labels = {
      projects: [(data.projects || []).length, 'projects, newest first'],
      experience: [(data.experience || []).length, 'roles']
    };
    $$('[data-count]').forEach(function (n) {
      var k = labels[n.getAttribute('data-count')];
      if (k) n.textContent = k[0] + ' ' + k[1];
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
      wrap.innerHTML = '<div class="email"><a class="email__addr" href="' + esc(email.url) + '" data-cursor="write">' + esc(addr) + '</a>' +
        '<button class="email__copy" type="button" data-copy="' + esc(addr) + '" data-cursor="copy">Copy</button></div>';
    }
    var pills = $('#contact-pills');
    if (!pills) return;
    var out = '';
    if (li) out += '<li><a class="pill" href="' + esc(li.url) + '"' + extAttrs(li.url) + ' data-magnetic data-cursor="say hi">' + I.linkedin + 'LinkedIn<span class="sr-only"> (opens in a new tab)</span></a></li>';
    if (gh) out += '<li><a class="pill" href="' + esc(gh.url) + '"' + extAttrs(gh.url) + ' data-magnetic data-cursor="code">' + I.github + 'GitHub<span class="sr-only"> (opens in a new tab)</span></a></li>';
    if (resumeUrl) {
      out += '<li><button type="button" class="pill" data-resume-open data-magnetic data-cursor="open">' + I.preview + 'Preview résumé</button></li>';
      out += '<li><a class="pill pill--ink" href="' + esc(resolve(resumeUrl)) + '" download data-magnetic data-cursor="save">' + I.download + 'Download résumé</a></li>';
    }
    pills.innerHTML = out;
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
      root.innerHTML = '<div class="empty">' +
        '<div class="empty__badge" aria-hidden="true">' + stickerStar('soon', '', 'var(--tomato)') + '</div>' +
        '<div><h2 class="empty__title">Nothing here <em>yet.</em></h2>' +
          '<p class="empty__text">The first post is still being written. Until it lands, the projects and their source code are the best read.</p>' +
          '<div class="empty__links">' +
            '<a class="btn btn--ink" href="../index.html#work" data-magnetic data-cursor="go">See the work</a>' +
            (gh ? '<a class="btn btn--line" href="' + esc(gh.url) + '"' + extAttrs(gh.url) + ' data-magnetic data-cursor="code">GitHub</a>' : '') +
            (li ? '<a class="btn btn--line" href="' + esc(li.url) + '"' + extAttrs(li.url) + ' data-magnetic data-cursor="say hi">LinkedIn</a>' : '') +
          '</div></div></div>';
      return;
    }
    var sorted = posts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    root.innerHTML = '<ol class="posts">' + sorted.map(function (p) {
      var platform = p.platform ? String(p.platform) : 'Blog';
      var key = platform.toLowerCase();
      var label = platform.charAt(0).toUpperCase() + platform.slice(1);
      var tags = (p.tags || []).join(', ');
      var url = p.url || '#';
      return '<li><a class="post" href="' + esc(url) + '"' + extAttrs(url) + ' data-cursor="read">' +
        '<span class="post__meta"><span>' + fmtDate(p.date) + '</span><span class="post__platform">' + (I[key] || '') + esc(label) + '</span></span>' +
        '<span class="post__body"><span class="post__title">' + esc(p.title) + '</span>' +
          (p.summary ? '<span class="post__summary">' + esc(p.summary) + '</span>' : '') +
          (tags ? '<span class="post__tags">' + esc(tags) + '</span>' : '') +
        '</span>' +
        '<span class="post__go" aria-hidden="true">' + I.arrow + '</span>' +
        (isExternal(url) ? '<span class="sr-only"> (opens in a new tab)</span>' : '') +
      '</a></li>';
    }).join('') + '</ol>';
  }

  // ==================================================================
  // MOTION: background morph between colour zones
  // ==================================================================
  function zoneColor(z) { return getComputedStyle(z).getPropertyValue('--zbg').trim(); }
  function setZone(z, instant) {
    currentZone = z;
    var col = zoneColor(z);
    if (gsap) gsap.to(body, { backgroundColor: col, duration: instant ? 0 : 0.85, ease: 'power2.out', overwrite: true });
    else body.style.backgroundColor = col;
    setMetaColor(col);
    var cc = z.getAttribute('data-cursor-color') || 'tomato';
    html.style.setProperty('--cur', 'var(--' + cc + ')');
    if (cursor) cursor.classList.toggle('cur-dark', cc === 'ink' || cc === 'cobalt');
  }
  function initBgMorph() {
    if (!gsap || !ST || REDUCED) return;
    var zones = $$('.zone');
    if (!zones.length) return;
    html.classList.add('bg-morph');
    zones.forEach(function (z) {
      var trig = z.parentNode && z.parentNode.classList.contains('pin-spacer') ? z.parentNode : z;
      ST.create({
        trigger: trig, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (self) { if (self.isActive) setZone(z); }
      });
    });
    // initial zone: whichever crosses the 55% line now
    var mid = window.innerHeight * 0.55, pick = zones[0];
    zones.forEach(function (z) {
      var t = z.parentNode && z.parentNode.classList.contains('pin-spacer') ? z.parentNode : z;
      var r = t.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) pick = z;
    });
    setZone(pick, true);
  }

  // ==================================================================
  // MOTION: intro curtain + hero drop-in
  // ==================================================================
  function playIntro() {
    var cur = $('#curtain');
    var letters = $$('.kinetic .kl');
    if (!MOTION) { html.classList.add('is-loaded'); return; }
    var seen = false;
    try { seen = sessionStorage.getItem('nm-v2-seen') === '1'; sessionStorage.setItem('nm-v2-seen', '1'); } catch (e) { }
    html.classList.add('intro-gsap');
    var tl = gsap.timeline({
      onComplete: function () { html.classList.add('is-loaded'); if (cur) cur.style.display = 'none'; }
    });
    gsap.set(letters, { yPercent: -130, rotation: function () { return rand(-35, 35); }, opacity: 0 });
    if (cur) {
      var panels = [$('.curtain__panel--tomato', cur), $('.curtain__panel--sun', cur), $('.curtain__panel--cobalt', cur)];
      var word = $('.curtain__word', cur);
      if (word && !seen) {
        tl.from(word, { scale: .3, rotation: -14, duration: .6, ease: 'back.out(2.4)' })
          .to(word, { yPercent: -60, opacity: 0, duration: .3, ease: 'power2.in' }, '+=.18');
      } else if (word) { gsap.set(word, { opacity: 0 }); }
      tl.to(panels[0], { yPercent: -101, duration: .7, ease: 'expo.inOut' }, seen ? 0 : '-=.12')
        .to(panels[1], { yPercent: -101, duration: .7, ease: 'expo.inOut' }, '<.1')
        .to(panels[2], { yPercent: -101, duration: .75, ease: 'expo.inOut' }, '<.1');
    }
    tl.addLabel('drop', cur ? '<.3' : 0);
    tl.to(letters, {
      yPercent: 0, rotation: 0, opacity: 1, duration: 1.2,
      ease: 'elastic.out(1,0.5)', stagger: { each: .05 }
    }, 'drop');
    var fades = $$('[data-hero-fade], .blog-hero__lede');
    if (fades.length) tl.from(fades, { y: 34, opacity: 0, duration: .8, ease: 'back.out(1.7)', stagger: .07 }, 'drop+=.35');
    var stickers = $$('.sticker');
    if (stickers.length) tl.from(stickers, { scale: 0, rotation: -120, duration: 1, ease: 'elastic.out(1,0.55)', stagger: .09 }, 'drop+=.5');
    var nav = $('#nav');
    if (nav) tl.from(nav.children, { y: -110, rotation: function () { return rand(-20, 20); }, duration: .9, ease: 'back.out(1.8)', stagger: .07, clearProps: 'transform' }, 'drop+=.2');
  }

  // ==================================================================
  // MOTION: kinetic letters (cursor proximity; auto wave on touch)
  // ==================================================================
  function initKinetic() {
    if (!MOTION) return;
    $$('.kinetic').forEach(function (h) {
      var letters = $$('.kl', h);
      if (!letters.length) return;
      var items = letters.map(function (el) {
        var cs = getComputedStyle(el.parentNode);
        var it = {
          el: el,
          w0: parseFloat(cs.getPropertyValue('--wg0')) || 500,
          w1: parseFloat(cs.getPropertyValue('--wg1')) || 900,
          s0: parseFloat(cs.getPropertyValue('--sf0')) || 0,
          ox: 0, oy: 0, p: {}
        };
        it.s1 = it.s0 > 50 ? 0 : 100;
        it.p.w = it.w0; it.p.s = it.s0;
        var apply = function () {
          el.style.setProperty('--wg', it.p.w.toFixed(0));
          el.style.setProperty('--sf', it.p.s.toFixed(0));
        };
        it.qw = gsap.quickTo(it.p, 'w', { duration: .55, ease: 'power3.out', onUpdate: apply });
        it.qs = gsap.quickTo(it.p, 's', { duration: .7, ease: 'power2.out', onUpdate: apply });
        var qx = gsap.quickTo(el, 'scaleX', { duration: .8, ease: 'elastic.out(1,0.4)' });
        var qy = gsap.quickTo(el, 'scaleY', { duration: .8, ease: 'elastic.out(1,0.4)' });
        it.qsc = function (v) { qx(v); qy(v); };
        it.apply = apply;
        return it;
      });
      function measure() {
        var hr = h.getBoundingClientRect();
        items.forEach(function (it) {
          var r = it.el.getBoundingClientRect();
          it.ox = r.left + r.width / 2 - hr.left; it.oy = r.top + r.height / 2 - hr.top;
        });
      }
      measure();
      onFontsReady(measure);
      window.addEventListener('resize', debounce(measure, 200));

      var visible = true;
      inView(h, function (v) { visible = v; });

      if (FINE) {
        var px = -9999, py = -9999, pending = false, active = false;
        var update = function () {
          pending = false;
          var hr = h.getBoundingClientRect();
          var fs = parseFloat(getComputedStyle(h).fontSize) || 200;
          var R = fs * 1.5;
          items.forEach(function (it) {
            var dx = px - (hr.left + it.ox), dy = py - (hr.top + it.oy);
            var d = Math.sqrt(dx * dx + dy * dy);
            var t = clamp(0, 1, 1 - d / R);
            t = t * t * (3 - 2 * t);
            it.qw(it.w0 + (it.w1 - it.w0) * t);
            it.qs(it.s0 + (it.s1 - it.s0) * t);
            it.qsc(1 + 0.14 * t);
          });
        };
        window.addEventListener('pointermove', function (e) {
          if (e.pointerType !== 'mouse' || !visible) { if (active) { reset(); } return; }
          px = e.clientX; py = e.clientY; active = true;
          if (!pending) { pending = true; raf(update); }
        }, { passive: true });
        var reset = function () {
          active = false;
          items.forEach(function (it) { it.qw(it.w0); it.qs(it.s0); it.qsc(1); });
        };
        doc.addEventListener('pointerleave', reset);
      } else {
        // Touch: a gentle travelling wave through the weights
        var t0 = performance.now();
        addTick(function () {
          if (!visible) return;
          var t = (performance.now() - t0) / 1000;
          items.forEach(function (it, i) {
            var v = (Math.sin(t * 2.2 - i * 0.55) + 1) / 2;
            v = v * v;
            it.p.w = it.w0 + (it.w1 - it.w0) * v * 0.85;
            it.p.s = it.s0 + (it.s1 - it.s0) * v;
            it.apply();
          });
        });
      }
    });
  }

  // ==================================================================
  // MOTION: rotating role word
  // ==================================================================
  function charsHTML(word) {
    return String(word).split('').map(function (ch) { return '<span class="rc">' + esc(ch) + '</span>'; }).join('');
  }
  function initRotator() {
    var el = $('#rotator');
    if (!el || !MOTION || ROLES.length < 2) return;
    var i = 0, visible = true, busy = false;
    inView(el, function (v) { visible = v; });
    el.style.clipPath = 'inset(-2px round 999px)';
    function setColours(k) {
      var set = ROT_SET[k % ROT_SET.length];
      el.style.setProperty('--rot-bg', 'var(--' + set[0] + ')');
      el.style.setProperty('--rot-fg', 'var(--' + set[1] + ')');
    }
    setColours(0);
    function next() {
      if (busy || !visible || doc.hidden) return;
      busy = true;
      i = (i + 1) % ROLES.length;
      var word = $('.rotator__word', el);
      word.innerHTML = charsHTML(word.textContent);
      var oldChars = $$('.rc', word);
      var w0 = el.offsetWidth;
      gsap.to(oldChars, {
        yPercent: -130, rotation: -18, opacity: 0, duration: .32, ease: 'power2.in', stagger: .012,
        onComplete: function () {
          word.innerHTML = charsHTML(ROLES[i]);
          setColours(i);
          var w1 = el.offsetWidth;
          gsap.fromTo(el, { width: w0 }, { width: w1, duration: .6, ease: 'back.out(1.8)', clearProps: 'width' });
          gsap.from($$('.rc', word), {
            yPercent: 130, rotation: 20, opacity: 0, duration: .7, ease: 'back.out(2.4)', stagger: .018,
            onComplete: function () { word.textContent = ROLES[i]; busy = false; }
          });
        }
      });
    }
    setInterval(next, 2600);
  }

  // ==================================================================
  // MOTION: stickers (drag + throw, spin with scroll velocity)
  // ==================================================================
  function initStickers() {
    var box = $('#stickers');
    var stickers = $$('.sticker', box || doc);
    if (!stickers.length || !MOTION) return;
    var bounds = box.parentNode;
    if (Drag) {
      try {
        Drag.create(stickers, {
          type: 'x,y', bounds: bounds, inertia: !!Inertia, edgeResistance: 0.65, zIndexBoost: true,
          onPress: function () { gsap.to($('.sticker__spin', this.target), { scale: 1.14, duration: .35, ease: 'back.out(3)' }); },
          onRelease: function () { gsap.to($('.sticker__spin', this.target), { scale: 1, duration: .9, ease: 'elastic.out(1,0.35)' }); }
        });
        html.classList.add('has-drag');
      } catch (e) { }
    }
    var visible = true;
    inView(bounds, function (v) { visible = v; });
    var state = stickers.map(function (s) {
      var spin = $('.sticker__spin', s);
      var r0 = parseFloat(getComputedStyle(s).getPropertyValue('--r')) || 0;
      return { spin: spin, base: parseFloat(s.getAttribute('data-spin')) || 0, tilt: s.hasAttribute('data-tilt'), rot: r0, r0: r0, setR: gsap.quickSetter(spin, 'rotation', 'deg') };
    });
    addTick(function () {
      if (!visible) return;
      var v = clamp(-60, 60, scrollState.v);
      state.forEach(function (st) {
        if (st.tilt) st.rot += ((st.r0 + clamp(-24, 24, v * 1.2)) - st.rot) * 0.12;
        else st.rot += st.base + v * 0.35 * (st.base < 0 ? -1 : 1);
        st.setR(st.rot);
      });
    });
  }

  // ==================================================================
  // MOTION: hero scroll parallax
  // ==================================================================
  function initHeroScroll() {
    if (!MOTION || !ST) return;
    var hero = $('.hero, .blog-hero');
    if (!hero) return;
    var l1 = $('.hero__line--1', hero) || $('.hero__line', hero), l2 = $('.hero__line--2', hero);
    if (l1) gsap.to(l1, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 } });
    if (l2) gsap.to(l2, { xPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 } });
  }

  // ==================================================================
  // MOTION: projects (pinned horizontal on desktop, stacked on mobile)
  // ==================================================================
  function initProjects() {
    var sec = $('#work'), track = $('#work-track');
    if (!sec || !track || !MOTION || !ST) return;
    var posters = $$('.poster', track);
    if (!posters.length) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      html.classList.add('has-hscroll');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tilts = posters.map(function (p) { return gsap.quickTo(p, 'rotation', { duration: .6, ease: 'power3.out' }); });
      var settle = null;
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: sec, pin: true, scrub: .8, start: 'top top',
          end: function () { return '+=' + dist(); },
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) {
            var v = clamp(-3, 3, self.getVelocity() / -380);
            tilts.forEach(function (q) { q(v); });
            clearTimeout(settle);
            settle = setTimeout(function () { tilts.forEach(function (q) { q(0); }); }, 140);
          }
        }
      });
      posters.forEach(function (p) {
        var title = $('.poster__title', p), num = $('.poster__num', p);
        if (title) gsap.fromTo(title, { xPercent: 14 }, { xPercent: -4, ease: 'none', scrollTrigger: { containerAnimation: tween, trigger: p, start: 'left right', end: 'right left', scrub: true } });
        if (num) gsap.fromTo(num, { xPercent: 8 }, { xPercent: -8, ease: 'none', scrollTrigger: { containerAnimation: tween, trigger: p, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { html.classList.remove('has-hscroll'); };
    });
    mm.add('(max-width: 899px)', function () {
      posters.forEach(function (p, i) {
        gsap.from(p, {
          yPercent: 14, rotation: i % 2 ? 4 : -4, opacity: 0, duration: 1, ease: 'back.out(1.5)',
          scrollTrigger: { trigger: p, start: 'top 90%' }
        });
      });
    });
  }

  // ==================================================================
  // MOTION: SplitText headings (varied characterful entries)
  // ==================================================================
  var SPLIT_STYLES = [
    function (chars) { return { yPercent: 110, rotation: 10, opacity: 0, duration: .9, ease: 'back.out(1.9)', stagger: .03 }; },
    function (chars) { return { yPercent: -120, rotation: function () { return rand(-30, 30); }, opacity: 0, duration: 1.2, ease: 'elastic.out(1,0.5)', stagger: .04 }; },
    function (chars) { return { scale: 0, rotation: function () { return rand(-40, 40); }, opacity: 0, duration: .8, ease: 'back.out(3)', stagger: { each: .035, from: 'center' } }; },
    function (chars) { return { xPercent: -60, skewX: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .03 }; }
  ];
  function splitChars(el) {
    if (!Split) return null;
    try { return Split.create(el, { type: 'words,chars', wordsClass: 'word', charsClass: 'char' }).chars; } catch (e) { return null; }
  }
  function initSplits() {
    if (!MOTION || !ST) return;
    $$('[data-split]').forEach(function (h, i) {
      var chars = splitChars(h);
      if (!chars || !chars.length) return;
      var vars = SPLIT_STYLES[i % SPLIT_STYLES.length](chars);
      vars.scrollTrigger = { trigger: h, start: 'top 86%' };
      gsap.from(chars, vars);
    });
  }

  // ==================================================================
  // MOTION: about sentence + hand-drawn highlights
  // ==================================================================
  function initAbout() {
    var big = $('#about-big');
    if (!big || !MOTION || !ST) return;
    if (Split) {
      try {
        var words = Split.create(big, { type: 'words', wordsClass: 'word', ignore: 'svg' }).words;
        gsap.from(words, {
          yPercent: 80, rotationX: -80, opacity: 0, transformOrigin: '50% 100% -20px',
          duration: 1, ease: 'expo.out', stagger: .035,
          scrollTrigger: { trigger: big, start: 'top 80%' }
        });
      } catch (e) { }
    }
    var paths = $$('.hl__svg path', big);
    if (DrawSVG && paths.length) {
      gsap.fromTo(paths, { drawSVG: '0%' }, {
        drawSVG: '100%', ease: 'power1.inOut', stagger: .35,
        scrollTrigger: { trigger: big, start: 'top 62%', end: 'bottom 40%', scrub: .8 }
      });
    }
    var facts = $$('.fact');
    if (facts.length) gsap.from(facts, { y: 30, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '#about-facts', start: 'top 85%' } });
  }

  // ==================================================================
  // MOTION: misc reveals (rows, certs, education, marquee)
  // ==================================================================
  function initReveals() {
    if (!MOTION || !ST) return;
    var xp = $$('.xp');
    if (xp.length) gsap.from(xp, { xPercent: -10, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '#xp-list', start: 'top 82%' } });
    var edu = $$('.edu-item');
    if (edu.length) gsap.from(edu, { scale: .82, opacity: 0, transformOrigin: '0% 50%', duration: 1, ease: 'elastic.out(1,0.6)', stagger: .08, scrollTrigger: { trigger: '#edu-list', start: 'top 82%' } });
    var certs = $$('.cert');
    if (certs.length) gsap.from(certs, { y: 70, rotation: function () { return rand(-35, 35); }, opacity: 0, duration: .9, ease: 'back.out(2)', stagger: .07, scrollTrigger: { trigger: '#cert-list', start: 'top 88%' } });
    var legend = $$('.legend li');
    if (legend.length) gsap.from(legend, { y: 16, opacity: 0, duration: .6, ease: 'power3.out', stagger: .05, scrollTrigger: { trigger: '#legend', start: 'top 92%' } });
    var pg = $('#playground');
    if (pg) gsap.from(pg, { scaleY: .6, transformOrigin: '50% 100%', opacity: 0, duration: 1, ease: 'elastic.out(1,0.7)', scrollTrigger: { trigger: pg, start: 'top 88%' } });
    var empty = $('.empty');
    if (empty) gsap.from(empty, { y: 60, rotation: -3, opacity: 0, duration: 1, ease: 'back.out(1.6)', scrollTrigger: { trigger: empty, start: 'top 88%' } });
    var posts = $$('.post');
    if (posts.length) gsap.from(posts, { y: 40, opacity: 0, duration: .8, ease: 'back.out(1.6)', stagger: .07, scrollTrigger: { trigger: '.posts', start: 'top 85%' } });
    var badge = $('.empty__badge svg');
    if (badge) gsap.to(badge, { rotation: 360, duration: 14, ease: 'none', repeat: -1 });
  }

  function initMarquee() {
    var wrap = $('#marquee');
    if (!wrap || REDUCED) return;
    var tracks = $$('.marquee__track', wrap).filter(function (t) { return t.children.length; });
    if (!tracks.length) return;
    var st = tracks.map(function (t) { return { el: t, x: 0, half: 0, dir: parseFloat(t.getAttribute('data-dir')) || -1 }; });
    function measure() { st.forEach(function (s) { s.half = s.el.scrollWidth / 2; }); }
    measure();
    onFontsReady(measure);
    window.addEventListener('resize', debounce(measure, 200));
    var visible = false;
    inView(wrap, function (v) { visible = v; }, '100px');
    var sdir = 1;
    addTick(function () {
      if (!visible) return;
      var v = scrollState.v;
      if (v > 0.4) sdir = 1; else if (v < -0.4) sdir = -1;
      var speed = 0.7 + Math.min(Math.abs(v) * 0.55, 16);
      st.forEach(function (s) {
        if (!s.half) return;
        s.x += speed * s.dir * sdir;
        if (s.x <= -s.half) s.x += s.half;
        if (s.x > 0) s.x -= s.half;
        s.el.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,0,0)';
      });
    });
  }

  // ==================================================================
  // CONTACT: bouncing letters
  // ==================================================================
  function splitBouncy() {
    $$('.bouncy').forEach(function (h) {
      if (h.__split) return; h.__split = true;
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = doc.createDocumentFragment();
            n.textContent.split('').forEach(function (ch) {
              if (/\s/.test(ch)) { frag.appendChild(doc.createTextNode(ch)); return; }
              var s = doc.createElement('span'); s.className = 'bl'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch;
              frag.appendChild(s);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      };
      walk(h);
    });
  }
  function initBouncy() {
    splitBouncy();
    if (!MOTION) return;
    $$('.bouncy').forEach(function (h) {
      var bls = $$('.bl', h);
      bls.forEach(function (b) {
        b.addEventListener('pointerenter', function () {
          if (gsap.isTweening(b)) return;
          gsap.timeline()
            .to(b, { y: '-0.3em', scaleY: 1.14, scaleX: .9, rotation: rand(-10, 10), duration: .18, ease: 'power2.out' })
            .to(b, { y: 0, scaleY: 1, scaleX: 1, rotation: 0, duration: 1, ease: 'elastic.out(1.1,0.3)' });
        });
      });
      if (ST) gsap.from(bls, {
        yPercent: -140, opacity: 0, rotation: function () { return rand(-25, 25); },
        duration: 1.1, ease: 'bounce.out', stagger: .035,
        scrollTrigger: { trigger: h, start: 'top 82%' }
      });
    });
  }

  // ==================================================================
  // COPY EMAIL + TOAST
  // ==================================================================
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('is-on');
    void t.offsetWidth;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      try {
        var ta = doc.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        body.appendChild(ta); ta.select();
        var ok = doc.execCommand('copy'); body.removeChild(ta);
        if (ok) res(); else rej(new Error('copy failed'));
      } catch (e) { rej(e); }
    });
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    copyText(text).then(function () {
      toast('Copied! Talk soon.');
      b.textContent = 'Copied';
      setTimeout(function () { b.textContent = 'Copy'; }, 2000);
      if (MOTION) gsap.fromTo(b, { rotation: -8, scale: .9 }, { rotation: 0, scale: 1, duration: .8, ease: 'elastic.out(1.2,0.35)' });
    }, function () { toast('Couldn’t copy. The address is ' + text); });
  });

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
  // EXPERIENCE ACCORDION (springy height)
  // ==================================================================
  function initXP() {
    $$('.xp__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var li = btn.closest('.xp'), panel = $('.xp__panel', li);
        var open = !li.classList.contains('is-open');
        btn.setAttribute('aria-expanded', String(open));
        if (MOTION) {
          gsap.killTweensOf(panel);
          if (open) {
            li.classList.add('is-open');
            gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: 1, ease: 'elastic.out(1,0.75)', onComplete: function () { gsap.set(panel, { clearProps: 'height' }); refreshST(); } });
            gsap.from($$('li, .xp__loc', panel), { y: 18, opacity: 0, duration: .55, ease: 'back.out(2)', stagger: .05, delay: .08 });
          } else {
            var h = panel.offsetHeight;
            li.classList.remove('is-open');
            gsap.fromTo(panel, { height: h }, { height: 0, duration: .45, ease: 'power3.inOut', onComplete: function () { gsap.set(panel, { clearProps: 'height' }); refreshST(); } });
          }
        } else {
          li.classList.toggle('is-open', open);
          refreshST();
        }
      });
    });
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
    $$('[data-resume-open]').forEach(function (b) { b.hidden = true; });
    var cur = $('#curtain'); if (cur) cur.style.display = 'none';
    html.classList.add('is-loaded');
  }

  // ==================================================================
  // BOOT
  // ==================================================================
  function initMotion() {
    try {
      // Order matters: create ScrollTriggers top-to-bottom, pin before what follows it.
      initHeroScroll();
      initAbout();
      initProjects();
      initBgMorph();
      initSplits();
      initReveals();
      initBouncy();
      initMarquee();
      initKinetic();
      initStickers();
      initRotator();
      initMagnetic();
    } catch (e) { console.warn('[motion] init error:', e); }
    refreshST();
    playIntro();
  }

  function afterRender(data) {
    var about = data.about || {};
    modal.init(about.resume_url || (findLink(about.links, 'preview') || {}).url);
    initXP();
    if (!IS_BLOG) { initActiveNav(); mountPlaygroundModule(); }
    if (!gsap || REDUCED) splitBouncy();
    whenFonts(2200, initMotion);
    onFontsReady(refreshST);
    window.addEventListener('load', refreshST);
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
        renderStickers(data);
        if (about.name) { $$('[data-name]').forEach(function (n) { n.textContent = about.name; }); doc.title = 'Blog — ' + about.name; }
      } else {
        renderHero(about, data);
        renderAbout(about, data);
        renderMarquee(data.skills);
        renderWork(data.projects, about.links);
        renderXP(data.experience);
        renderToolbox(data.skills);
        renderEducation(data.education, data.certifications);
        renderCounts(data);
        if (about.name && about.title) doc.title = about.name + ' — ' + about.title;
      }
      renderContact(about);
      afterRender(data);
    })
    .catch(showLoadError);
})();
