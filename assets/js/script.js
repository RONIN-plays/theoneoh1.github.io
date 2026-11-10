/* ============================================================
   PORTFOLIO — YAML-driven renderer + interactions
   Edit data/content.yaml to update the site.
   ============================================================ */

(function () {
  'use strict';

  var ROOT = document.body.getAttribute('data-root') || '';
  var IS_BLOG = document.body.getAttribute('data-page') === 'blog';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Icons ----------
  var I = {
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>',
    preview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.2 13.9 7 22l5-3 5 3-1.2-8.1"/></svg>',
    medium: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42s-3.39-2.88-3.39-6.42 1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zm2.94 0c0 3.17-.53 5.75-1.19 5.75s-1.19-2.58-1.19-5.75.53-5.75 1.19-5.75 1.19 2.58 1.19 5.75z"/></svg>',
    hashnode: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.65 10.4a3.27 3.27 0 0 0 0 4.62l6.32 6.33a3.27 3.27 0 0 0 4.62 0l6.33-6.33a3.27 3.27 0 0 0 0-4.62L13.6 4.07a3.27 3.27 0 0 0-4.63 0L2.65 10.4zm8.56-1.47a3.1 3.1 0 1 1 0 6.19 3.1 3.1 0 0 1 0-6.19z"/></svg>',
    dev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.2-.17.31-.48.31-.95v-2c0-.5-.11-.81-.31-.95zm13.37-7.13H3.2A2.13 2.13 0 0 0 1 5.04v13.92c0 1.17.96 2.12 2.21 2.12h17.58c1.25 0 2.21-.95 2.21-2.12V5.04c0-1.17-.96-2.12-2.21-2.12zM8.89 14.32c-.38.42-.93.63-1.62.63H5.12V9.05h2.17c.69 0 1.23.2 1.6.63.34.39.52.94.52 1.65v1.34c0 .71-.18 1.26-.52 1.65zm4.46-.36c0 .7-.28 1.3-.84 1.82-.25.23-.59.35-1.02.35-.42 0-.77-.12-1.03-.36l-.07-.08V16h-1.41V9.05h1.41v.61a1.57 1.57 0 0 1 1.1-.44c.43 0 .77.12 1.02.36.56.51.84 1.12.84 1.82v2.56zm5.18-1.15h-1.67v1.67h-.88v-1.67h-1.66v-.88h1.66v-1.67h.88v1.67h1.67v.88z"/></svg>'
  };

  // ---------- Helpers ----------
  function esc(s) {
    var el = document.createElement('span');
    el.textContent = s == null ? '' : String(s);
    return el.innerHTML;
  }
  function el(id) { return document.getElementById(id); }
  function isExternal(url) { return url && /^https?:/i.test(url); }
  function attrs(url, icon) {
    var a = isExternal(url) ? ' target="_blank" rel="noopener"' : '';
    if (icon === 'download') a += ' download';
    return a;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function splitList(str) {
    return String(str || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function findLink(links, icon) {
    return (links || []).filter(function (l) { return l.icon === icon; })[0];
  }
  function isCurrent(date) { return /present/i.test(date || ''); }

  // ---------- Theme ----------
  (function initTheme() {
    var btn = el('theme-toggle');
    var html = document.documentElement;
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { }
    });
  })();

  // ---------- Nav state / progress / back-to-top ----------
  (function initScroll() {
    var nav = el('nav');
    var progress = el('progress');
    var top = el('back-to-top');
    function onScroll() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 12);
      if (top) top.classList.toggle('visible', y > 500);
      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  })();

  // ---------- Mobile nav ----------
  (function initMobileNav() {
    var toggle = el('nav-toggle');
    var links = el('nav-links');
    var nav = el('nav');
    if (!toggle || !links) return;
    function set(open) {
      links.classList.toggle('open', open);
      if (nav) nav.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { set(!links.classList.contains('open')); });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });
  })();

  // ---------- Reveal on scroll ----------
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (n) { io.observe(n); });
  }

  // ---------- Card spotlight ----------
  function initSpotlight() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // ---------- Active nav on scroll ----------
  function initActiveNav() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var anchors = document.querySelectorAll('.nav-links a[href^="#"]');
    function update() {
      var y = window.scrollY + window.innerHeight * 0.35;
      var current = '';
      sections.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
      if (current === 'overview') current = 'about';
      anchors.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---------- Live clock ----------
  function initClock(tz) {
    var node = el('clock');
    if (!node) return;
    function tick() {
      try {
        var t = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date());
        node.textContent = t;
      } catch (e) {
        var d = new Date();
        node.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
      }
    }
    tick();
    setInterval(tick, 15000);
  }

  // ---------- Count-up ----------
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    function run(n) {
      var target = parseInt(n.getAttribute('data-count'), 10) || 0;
      if (REDUCED) { n.firstChild.nodeValue = target; return; }
      var start = performance.now(), dur = 1100;
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        n.firstChild.nodeValue = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  // ============================================================
  // RENDERERS
  // ============================================================

  function renderHero(a, data) {
    var root = el('about');
    if (!root || !a) return;

    var parts = String(a.name || '').trim().split(/\s+/);
    var last = parts.length > 1 ? parts.pop() : '';
    var first = parts.join(' ');

    var resume = findLink(a.links, 'download');
    var preview = findLink(a.links, 'preview');

    var socials = (a.links || []).filter(function (l) { return ['email', 'linkedin', 'github'].indexOf(l.icon) !== -1; })
      .map(function (l) {
        return '<a href="' + esc(l.url) + '"' + attrs(l.url) + ' aria-label="' + esc(l.label) + '" title="' + esc(l.label) + '">' + I[l.icon] + '</a>';
      }).join('');

    var learning = splitList(a.currently_learning);

    root.innerHTML =
      '<h1 class="hero-name" aria-label="' + esc(a.name) + '">' +
        '<span class="line"><span>' + esc(first) + '</span></span>' +
        (last ? '<span class="line"><span><em>' + esc(last) + '</em></span></span>' : '') +
      '</h1>' +
      '<p class="hero-sub fade-up"><strong>' + esc(a.title) + '.</strong> ' + esc(a.tagline || '') + '</p>' +
      '<div class="hero-actions fade-up">' +
        '<a href="#projects" class="btn btn-primary">View projects ' + I.arrowDown + '</a>' +
        (resume ? '<a href="' + esc(resume.url) + '" class="btn" download>' + I.download + ' Résumé</a>' : '') +
        (preview ? '<button type="button" class="btn btn-ghost resume-preview-btn" data-url="' + esc(preview.url) + '">' + I.preview + ' Preview</button>' : '') +
        '<div class="hero-socials">' + socials + '</div>' +
      '</div>' +
      '<div class="hero-meta fade-up">' +
        (a.location ? '<div class="hero-meta-item"><span class="hero-meta-label">Based in</span><span class="hero-meta-value">' + esc(a.location) + '</span></div>' : '') +
        '<div class="hero-meta-item"><span class="hero-meta-label">Focus</span><span class="hero-meta-value">AI · Robotics · Cloud</span></div>' +
        (learning.length ? '<div class="hero-meta-item"><span class="hero-meta-label">Currently learning</span><span class="hero-meta-value">' + esc(learning[0]) + '</span></div>' : '') +
      '</div>' +
      '<div class="scroll-hint"><span></span>scroll</div>';
  }

  function renderMarquee(skills) {
    var root = el('marquee');
    if (!root || !skills) return;
    var items = [];
    skills.forEach(function (s) { items = items.concat(splitList(s.items)); });
    if (!items.length) return;
    var html = items.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('');
    root.innerHTML = '<div class="marquee-track">' + html + html + '</div>';
  }

  function renderOverview(a, data) {
    var root = el('overview');
    if (!root || !a) return;

    var learning = splitList(a.currently_learning).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var projects = (data.projects || []).length;
    var roles = (data.experience || []).length;
    var certs = (data.certifications || []).length;

    // Bold the first sentence of the summary for emphasis.
    var summary = String(a.summary || '').trim();
    var firstEnd = summary.indexOf('. ');
    var summaryHtml = firstEnd > 0
      ? '<strong>' + esc(summary.slice(0, firstEnd + 1)) + '</strong> ' + esc(summary.slice(firstEnd + 2))
      : esc(summary);

    root.innerHTML =
      '<div class="section-head reveal">' +
        '<div><div class="section-kicker">About</div><h2 class="section-title">A little <em>context</em></h2></div>' +
      '</div>' +
      '<div class="bento">' +
        '<div class="card about-summary reveal"><div class="card-label">' + I.spark + ' Who I am</div><p>' + summaryHtml + '</p></div>' +
        '<div class="card about-learning reveal" style="--d:80ms"><div class="card-label">' + I.book + ' Currently learning</div><ul>' + learning + '</ul>' +
          '<p class="about-learning-note">Always a student — currently going deep on cloud infrastructure and retrieval systems for AI.</p></div>' +
        '<div class="card about-clock reveal" style="--d:120ms"><div class="card-label">' + I.pin + ' Local time</div>' +
          '<div class="clock-time" id="clock">--:--</div>' +
          '<div class="clock-place">' + esc(a.location || '') + ' · IST (UTC+5:30)</div></div>' +
        '<div class="about-stats reveal" style="--d:160ms">' +
          '<div class="stat"><div class="stat-num"><span data-count="' + projects + '">0</span><sup>+</sup></div><div class="stat-label">Projects shipped</div></div>' +
          '<div class="stat"><div class="stat-num"><span data-count="' + roles + '">0</span></div><div class="stat-label">Roles &amp; programs</div></div>' +
          '<div class="stat"><div class="stat-num"><span data-count="' + certs + '">0</span></div><div class="stat-label">Certifications</div></div>' +
        '</div>' +
      '</div>';
  }

  function renderSkills(skills) {
    var root = el('skills');
    if (!root || !skills) return;
    var cards = skills.map(function (s, i) {
      var chips = splitList(s.items).map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('');
      return '<div class="card skill-card reveal" style="--d:' + (i * 60) + 'ms">' +
        '<div class="skill-card-head"><h3 class="skill-card-title">' + esc(s.category) + '</h3><span class="skill-card-index">' + pad(i + 1) + '</span></div>' +
        '<div class="skill-chips">' + chips + '</div></div>';
    }).join('');
    root.innerHTML =
      '<div class="section-head reveal">' +
        '<div><div class="section-kicker">Skills</div><h2 class="section-title">What I <em>work</em> with</h2></div>' +
        '<span class="section-count">' + pad(skills.length) + ' areas</span>' +
      '</div>' +
      '<div class="skills-grid">' + cards + '</div>';
  }

  function renderExperience(jobs) {
    var root = el('experience');
    if (!root || !jobs) return;
    var items = jobs.map(function (j, i) {
      var bullets = (j.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
      return '<article class="exp-item reveal' + (isCurrent(j.date) ? ' is-current' : '') + '" style="--d:' + Math.min(i * 40, 200) + 'ms">' +
        '<div class="exp-date">' + esc(j.date) + '</div>' +
        '<div class="exp-body">' +
          '<div class="exp-top"><span class="exp-role">' + esc(j.role) + '</span><span class="exp-company">' + esc(j.company) + '</span>' +
            (j.location ? '<span class="exp-location">' + esc(j.location) + '</span>' : '') + '</div>' +
          (bullets ? '<ul class="exp-bullets">' + bullets + '</ul>' : '') +
        '</div></article>';
    }).join('');
    root.innerHTML =
      '<div class="section-head reveal">' +
        '<div><div class="section-kicker">Experience</div><h2 class="section-title">Where I\'ve <em>been</em></h2></div>' +
        '<span class="section-count">' + pad(jobs.length) + ' roles</span>' +
      '</div>' +
      '<div class="timeline">' + items + '</div>';
  }

  function renderProjects(projects) {
    var root = el('projects');
    if (!root || !projects) return;
    // Layout on a 6-column grid: first row is 4+2 (featured), remaining rows fill evenly.
    var n = projects.length;
    var rest = Math.max(0, n - 2);
    function spanFor(i) {
      if (i === 0) return n === 1 ? 'span-6' : 'span-4';
      if (i === 1) return 'span-2';
      if (rest === 1) return 'span-6';                 // single leftover goes full width
      if (rest % 3 === 0) return 'span-2';            // rows of three
      if (rest % 2 === 0) return 'span-3';            // rows of two
      // odd remainder: rows of three, then the last two share a row
      return i >= n - 2 ? 'span-3' : 'span-2';
    }
    var cards = projects.map(function (p, i) {
      var tags = (p.tags || []).map(function (t) { return '<span class="project-tag">' + esc(t) + '</span>'; }).join('');
      var hasUrl = p.url && p.url !== '#';
      var link = hasUrl
        ? '<a href="' + esc(p.url) + '"' + attrs(p.url) + ' class="project-card-link" aria-label="Open ' + esc(p.name) + '">' + I.arrow + '</a>'
        : '<span class="project-card-link" aria-hidden="true">' + I.arrow + '</span>';
      return '<article class="card project-card reveal ' + spanFor(i) + (i === 0 ? ' is-featured' : '') + '" style="--d:' + (i % 3) * 70 + 'ms">' +
        (!hasUrl ? '<span class="project-wip">In progress</span>' : '') +
        '<div class="project-card-top"><span class="project-index">' + pad(i + 1) + '</span>' + link + '</div>' +
        '<h3 class="project-card-name">' + esc(p.name) + '</h3>' +
        '<p class="project-card-desc">' + esc(p.description) + '</p>' +
        '<div class="project-card-tags">' + tags + '</div>' +
        '</article>';
    }).join('');
    root.innerHTML =
      '<div class="section-head reveal">' +
        '<div><div class="section-kicker">Projects</div><h2 class="section-title">Things I\'ve <em>built</em></h2></div>' +
        '<span class="section-count">' + pad(projects.length) + ' projects</span>' +
      '</div>' +
      '<div class="projects-grid">' + cards + '</div>';
  }

  function renderEducation(edu, certs) {
    var root = el('education');
    if (!root) return;
    var eduHtml = (edu || []).map(function (e, i) {
      return '<div class="edu-item reveal" style="--d:' + i * 50 + 'ms">' +
        '<span class="edu-degree">' + esc(e.degree) + '</span><span class="edu-year">' + esc(e.year) + '</span>' +
        '<p class="edu-detail">' + esc(e.institution) + '</p></div>';
    }).join('');
    var certHtml = (certs || []).map(function (c, i) {
      return '<div class="cert-item reveal" style="--d:' + i * 50 + 'ms"><span class="cert-icon">' + I.award + '</span><div>' +
        '<div class="cert-name">' + esc(c.name) + '</div>' + (c.issuer ? '<div class="cert-issuer">' + esc(c.issuer) + '</div>' : '') +
        '</div></div>';
    }).join('');
    root.innerHTML =
      '<div class="split">' +
        '<div><div class="section-head reveal"><div><div class="section-kicker">Education</div><h2 class="section-title">Where I <em>learned</em></h2></div></div>' + eduHtml + '</div>' +
        '<div id="certifications"><div class="section-head reveal"><div><div class="section-kicker">Certifications</div><h2 class="section-title">Proof of <em>work</em></h2></div></div><div class="cert-list">' + certHtml + '</div></div>' +
      '</div>';
  }

  function renderContact(a) {
    var root = el('contact');
    if (!root || !a) return;
    var email = findLink(a.links, 'email');
    var li = findLink(a.links, 'linkedin');
    var gh = findLink(a.links, 'github');
    root.innerHTML =
      '<div class="contact-inner reveal">' +
        '<div class="section-kicker" style="justify-content:center">Contact</div>' +
        '<h2 class="contact-title">Let\'s build<br>something <em>intelligent.</em></h2>' +
        '<p class="contact-text">Open to collaborations, research, and interesting problems in AI, robotics and cloud. My inbox is always open.</p>' +
        '<div class="contact-actions">' +
          (email ? '<a href="' + esc(email.url) + '" class="btn btn-primary">' + I.email + ' ' + esc(email.label) + '</a>' : '') +
          (li ? '<a href="' + esc(li.url) + '" class="btn" target="_blank" rel="noopener">' + I.linkedin + ' LinkedIn</a>' : '') +
          (gh ? '<a href="' + esc(gh.url) + '" class="btn" target="_blank" rel="noopener">' + I.github + ' GitHub</a>' : '') +
        '</div>' +
      '</div>';
  }

  function renderFooter(links, name) {
    var root = el('footer');
    if (!root) return;
    var items = (links || []).filter(function (l) { return l.icon !== 'preview'; }).map(function (l) {
      var label = l.icon === 'email' ? 'Email' : l.label;
      var url = l.url && !/^(https?:|mailto:)/i.test(l.url) ? ROOT + l.url : l.url;
      return '<a href="' + esc(url) + '"' + attrs(url, l.icon) + '>' + (I[l.icon] || '') + esc(label) + '</a>';
    }).join('');
    root.innerHTML =
      '<div class="container"><div class="footer-inner">' +
        '<div class="footer-links">' + items + '</div>' +
        '<span class="footer-copy">&copy; ' + new Date().getFullYear() + ' ' + esc(name || '') + ' · Built with HTML, CSS &amp; a little YAML</span>' +
      '</div></div>';
  }

  // ---------- Blog ----------
  function fmtDate(s) {
    var d = new Date(s);
    if (isNaN(d)) return esc(s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function renderBlog(posts) {
    var root = el('blog-content');
    if (!root) return;
    var head = '<div class="section-head reveal"><div><div class="section-kicker">Blog</div><h1 class="section-title">Notes &amp; <em>writing</em></h1>' +
      '<p class="blog-subtitle">Thoughts on AI, robotics, and the things I build.</p></div></div>';
    if (!posts || !posts.length) {
      root.innerHTML = head + '<div class="blog-empty reveal">No posts yet — check back soon.</div>';
      return;
    }
    var sorted = posts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var entries = sorted.map(function (p, i) {
      var platform = p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'Blog';
      var tags = (p.tags || []).map(function (t) { return '<span class="project-tag">' + esc(t) + '</span>'; }).join('');
      return '<article class="blog-entry reveal" style="--d:' + i * 50 + 'ms">' +
        '<div class="blog-entry-meta"><span>' + fmtDate(p.date) + '</span><span class="blog-platform">' + (I[p.platform] || '') + esc(platform) + '</span></div>' +
        '<div><h2 class="blog-title"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a></h2>' +
          '<p class="blog-summary">' + esc(p.summary) + '</p>' + (tags ? '<div class="blog-entry-tags">' + tags + '</div>' : '') + '</div>' +
        '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" class="blog-entry-link" aria-label="Read article">' + I.arrow + '</a>' +
        '</article>';
    }).join('');
    root.innerHTML = head + '<div class="blog-list">' + entries + '</div>';
  }

  // ---------- Resume modal ----------
  function initResumePreview() {
    var btn = document.querySelector('.resume-preview-btn');
    if (!btn) return;
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-url')); });
  }

  function openModal(url) {
    var modal = el('resume-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'resume-modal';
      modal.className = 'resume-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Résumé preview');
      modal.innerHTML = '<div class="resume-modal-content"><button class="resume-modal-close" aria-label="Close preview">&times;</button>' +
        '<iframe src="' + esc(url) + '#view=FitH" title="Résumé"></iframe></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
      modal.querySelector('.resume-modal-close').addEventListener('click', closeModal);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    }
    void modal.offsetWidth;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = el('resume-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============================================================
  // BOOT
  // ============================================================
  fetch(ROOT + 'data/content.yaml')
    .then(function (r) { if (!r.ok) throw new Error('Failed to load content.yaml'); return r.text(); })
    .then(function (text) {
      var data = jsyaml.load(text) || {};
      var about = data.about || {};

      if (IS_BLOG) {
        renderBlog(data.blogs);
      } else {
        renderHero(about, data);
        renderMarquee(data.skills);
        renderOverview(about, data);
        renderSkills(data.skills);
        renderExperience(data.experience);
        renderProjects(data.projects);
        renderEducation(data.education, data.certifications);
        renderContact(about);
        if (about.name && about.title) document.title = about.name + ' — ' + about.title;
        initActiveNav();
        initResumePreview();
        initClock('Asia/Kolkata');
        initCounters();
        initSpotlight();
      }
      renderFooter(about.links, about.name);
      initReveal();
    })
    .catch(function (err) {
      console.error('Content load error:', err);
      var c = document.querySelector('main .container');
      if (c) c.innerHTML = '<p style="padding:160px 0 80px;color:#ff7a1a;font-family:monospace">Failed to load content. Serve the site over HTTP (not file://) and make sure data/content.yaml exists.</p>';
    });
})();
