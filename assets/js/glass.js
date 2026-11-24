/* ==================================================================
   LIQUID GLASS ENGINE
   - Pointer-tracked specular light (--lg-x / --lg-y) on every glass target
   - Chromium refraction: per-element SVG feDisplacementMap filter built from
     a canvas displacement map (--lg-filter: url(#id) + class .lg-ready).
     CSS decides the actual backdrop-filter.
   - Cursor lens: the custom cursor blob becomes a convex refracting lens that
     grows over interactive elements and stretches like liquid with speed.
   - Nav jelly: velocity-driven squash on the nav glass while scrolling.
   - Press ripple: a liquid "drop" from the press point on glass buttons.
   Additive: works alongside script.js / playground.js, touches only glass.
   ================================================================== */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;

  // ---------- Contract: every glass target, in one place ----------
  var TARGETS = [
    '.nav__links ul', '.nav__theme', '.nav__menu-btn', '.toast',
    '.btn--line', '.pill', '.email', '.tag-label', '.cert',
    '.modal__bar', '.modal__close', '.xp__panel', '.pg-chip', '.cursor__blob'
  ];
  var PRESS_TARGETS = ['.btn--line', '.pill', '.nav__theme', '.nav__menu-btn', '.email__copy', '.email__addr', '.modal__close'];
  var WOBBLE_TARGETS = ['.nav__links ul', '.nav__theme', '.nav__menu-btn'];
  var LENS_SEL = '.cursor__blob';
  var GROW_SEL = 'a, button, [role="button"], [data-cursor]';

  var SELECTOR = TARGETS.join(', ');
  var PRESS_SEL = PRESS_TARGETS.join(', ');
  var WOBBLE_SEL = WOBBLE_TARGETS.join(', ');

  var MAX_AREA = 350000, MAX_SIDE = 1400; // refraction size limits (CSS px)
  var MAP_PIXELS = 90000;                  // max pixels per generated map
  var NEAR = 200;                          // pointer proximity for highlights
  var LENS_GROW = 1.12;                    // extra lens scale over links

  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reducedMotion = mq('(prefers-reduced-motion: reduce)');
  var reducedTransparency = mq('(prefers-reduced-transparency: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) { return setTimeout(f, 16); };
  var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };
  var clamp = function (a, b, v) { return v < a ? a : v > b ? b : v; };

  var brands = navigator.userAgentData && navigator.userAgentData.brands;
  var isChromium = !!(brands && brands.some(function (b) { return /Chromium/i.test(b.brand); }));
  var canRefract = isChromium && !reducedTransparency &&
    !!(window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'blur(1px)'));

  var NS = 'http://www.w3.org/2000/svg';
  var svg = null;
  if (canRefract) {
    svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    doc.body.appendChild(svg);
    html.classList.add('lg-refract');
  }

  // ==================================================================
  // Displacement maps
  // ==================================================================
  // Rounded rect (or capsule / circle when r reaches half the short side):
  // red/green encode an inward vector that grows toward the rim, so the
  // backdrop bends at the edges like thick glass while the centre stays clear.
  // Lens mode: a convex dome that magnifies the centre and bends hard at the rim.
  function buildMap(w, h, radius, lens) {
    var s = lens ? clamp(1, 4, 72 / Math.max(w, h)) : Math.min(1, Math.sqrt(MAP_PIXELS / (w * h)));
    var mw = Math.max(2, Math.round(w * s)), mh = Math.max(2, Math.round(h * s));
    var sx = w / mw, sy = h / mh;
    var c = doc.createElement('canvas');
    c.width = mw; c.height = mh;
    var ctx = c.getContext('2d');
    if (!ctx) return '';
    var img = ctx.createImageData(mw, mh), d = img.data;
    var r = Math.min(radius, h / 2, w / 2);
    var bezel = Math.max(6, Math.min(r * 0.85, 22));
    var hx = w / 2 - r, hy = h / 2 - r, cx = w / 2, cy = h / 2;
    var rad = Math.min(w, h) / 2;
    for (var y = 0; y < mh; y++) {
      for (var x = 0; x < mw; x++) {
        var px = (x + 0.5) * sx - cx, py = (y + 0.5) * sy - cy;
        var nx = 0, ny = 0, mag = 0;
        if (lens) {
          var dist = Math.sqrt(px * px + py * py), rho = dist / rad;
          if (rho < 1 && dist > 0.0001) {
            nx = px / dist; ny = py / dist;
            // linear term = gentle magnification, quartic term = strong rim bend
            mag = Math.min(1, 0.32 * rho + 0.68 * rho * rho * rho * rho);
          }
        } else {
          var ax = Math.abs(px), ay = Math.abs(py);
          var qx = ax - hx, qy = ay - hy;
          var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
          var outside = Math.sqrt(ox * ox + oy * oy);
          var depth = -(outside + Math.min(Math.max(qx, qy), 0) - r); // >0 inside
          if (depth > 0 && depth < bezel) {
            if (qx > 0 && qy > 0 && outside > 0) { nx = qx / outside; ny = qy / outside; }
            else if (qx > qy) { nx = 1; } else { ny = 1; }
            nx *= px < 0 ? -1 : 1; ny *= py < 0 ? -1 : 1;
            var t = 1 - depth / bezel;          // 0 inner -> 1 at rim
            mag = t * t * (3 - 2 * t);           // smooth lens profile
          }
        }
        var i = (y * mw + x) * 4;
        d[i] = 128 - nx * mag * 127;
        d[i + 1] = 128 - ny * mag * 127;
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function channel(id, scale, matrix, res) {
    return '<feDisplacementMap in="SourceGraphic" in2="map_' + id + '" scale="' + scale.toFixed(2) +
      '" xChannelSelector="R" yChannelSelector="G" result="d' + res + '_' + id + '"/>' +
      '<feColorMatrix in="d' + res + '_' + id + '" type="matrix" values="' + matrix + '" result="' + res + '_' + id + '"/>';
  }

  function buildFilter(id, w, h, radius, lens) {
    var url = buildMap(w, h, radius, lens);
    if (!url) return null;
    var strength = lens ? Math.max(12, w * 0.9) : Math.min(26, Math.max(14, Math.min(w, h) * 0.45));
    var spread = lens ? 0.1 : 0.08; // per-channel bend difference = chromatic fringe
    var f = doc.createElementNS(NS, 'filter');
    f.setAttribute('id', id);
    f.setAttribute('x', '0'); f.setAttribute('y', '0');
    f.setAttribute('width', w); f.setAttribute('height', h);
    f.setAttribute('filterUnits', 'userSpaceOnUse');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML =
      '<feImage href="' + url + '" x="0" y="0" width="' + w + '" height="' + h +
      '" preserveAspectRatio="none" result="map_' + id + '"/>' +
      channel(id, strength, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'r') +
      channel(id, strength * (1 - spread), '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'g') +
      channel(id, strength * (1 - spread * 2), '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'b') +
      '<feBlend in="r_' + id + '" in2="g_' + id + '" mode="screen" result="rg_' + id + '"/>' +
      '<feBlend in="rg_' + id + '" in2="b_' + id + '" mode="screen"/>';
    return f;
  }

  function parseRadius(v, w, h) {
    var first = String(v || '0').split(' ')[0];
    var r = parseFloat(first) || 0;
    if (/%$/.test(first)) r = r / 100 * Math.min(w, h);
    return Math.round(Math.min(r, w / 2, h / 2));
  }

  // ==================================================================
  // Registry
  // ==================================================================
  var items = [], uid = 0;
  var hasIO = 'IntersectionObserver' in window, hasRO = 'ResizeObserver' in window;

  var io = hasIO ? new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var el = entries[i].target, st = el._lg;
      if (!st) continue;
      st.visible = st.lens || entries[i].isIntersecting;
      if (st.visible) schedule(el, 0); else detach(el);
    }
  }, { rootMargin: '160px 0px' }) : null;

  var ro = (hasRO && canRefract) ? new ResizeObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) schedule(entries[i].target, 120);
  }) : null;

  function register(el) {
    if (el._lg) return;
    var st = el._lg = {
      id: 'lg' + (++uid), lens: el.matches(LENS_SEL), visible: !hasIO,
      key: '', filter: null, timer: 0, hot: false
    };
    if (st.lens) st.visible = true;
    items.push(el);
    if (io) io.observe(el);
    if (ro) ro.observe(el);
    if (!io || st.lens) schedule(el, 0);
    if (st.lens) setupLens(el);
  }

  function unregister(el) {
    var st = el._lg;
    if (!st) return;
    clearTimeout(st.timer);
    if (st.filter && st.filter.parentNode) st.filter.parentNode.removeChild(st.filter);
    if (io) io.unobserve(el);
    if (ro) ro.unobserve(el);
    el._lg = null;
    var k = items.indexOf(el);
    if (k > -1) items.splice(k, 1);
  }

  function schedule(el, delay) {
    var st = el._lg;
    if (!st || !canRefract) return;
    clearTimeout(st.timer);
    st.timer = setTimeout(function () { refresh(el); }, delay);
  }

  function attach(el) {
    var st = el._lg;
    if (!st.filter) return;
    if (!st.filter.parentNode) svg.appendChild(st.filter);
    el.style.setProperty('--lg-filter', 'url(#' + st.id + ')');
    el.classList.add('lg-ready');
  }

  function detach(el) {
    var st = el._lg;
    if (!st) return;
    if (st.filter && st.filter.parentNode) st.filter.parentNode.removeChild(st.filter);
    if (el.classList.contains('lg-ready')) {
      el.classList.remove('lg-ready');
      el.style.removeProperty('--lg-filter');
    }
  }

  function refresh(el) {
    var st = el._lg;
    if (!st || !canRefract) return;
    if (!el.isConnected || !st.visible) { detach(el); return; }
    var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    // display:none (0 size), slivers and huge panels: no refraction
    if (w < 8 || h < 8 || w * h > MAX_AREA || w > MAX_SIDE || h > MAX_SIDE) { detach(el); return; }
    var radius = st.lens ? Math.min(w, h) / 2 : parseRadius(getComputedStyle(el).borderTopLeftRadius, w, h);
    var key = w + 'x' + h + 'r' + radius;
    if (key !== st.key || !st.filter) {
      if (st.filter && st.filter.parentNode) st.filter.parentNode.removeChild(st.filter);
      st.filter = buildFilter(st.id, w, h, radius, st.lens);
      st.key = key;
      if (st.lens) st.w = w;
    }
    attach(el);
  }

  var scanT = 0;
  function scan() {
    for (var i = items.length - 1; i >= 0; i--) if (!items[i].isConnected) unregister(items[i]);
    var found = doc.querySelectorAll(SELECTOR);
    for (var j = 0; j < found.length; j++) register(found[j]);
    wobbleEls = Array.prototype.slice.call(doc.querySelectorAll(WOBBLE_SEL));
  }
  function scheduleScan() { clearTimeout(scanT); scanT = setTimeout(scan, 120); }

  // ==================================================================
  // Pointer-tracked specular highlight (hover-capable fine pointers)
  // ==================================================================
  if (finePointer) {
    var ptrX = -1e4, ptrY = -1e4, queued = false;
    var paint = function () {
      queued = false;
      var batch = [], i, el, st, r, dx, dy;
      // read phase
      for (i = 0; i < items.length; i++) {
        el = items[i]; st = el._lg;
        if (!st || st.lens || !st.visible) continue;
        r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        dx = Math.max(r.left - ptrX, 0, ptrX - r.right);
        dy = Math.max(r.top - ptrY, 0, ptrY - r.bottom);
        if (dx > NEAR || dy > NEAR) {
          if (!st.hot) continue;   // one last update for previously-lit elements
          st.hot = false;
        } else st.hot = true;
        var kx = el.offsetWidth / r.width || 1, ky = el.offsetHeight / r.height || 1;
        var w = el.offsetWidth, h = el.offsetHeight;
        batch.push(el,
          clamp(-40, w + 40, (ptrX - r.left) * kx),
          clamp(-30, h + 30, (ptrY - r.top) * ky));
      }
      // write phase
      for (i = 0; i < batch.length; i += 3) {
        batch[i].style.setProperty('--lg-x', batch[i + 1].toFixed(1) + 'px');
        batch[i].style.setProperty('--lg-y', batch[i + 2].toFixed(1) + 'px');
      }
    };
    window.addEventListener('pointermove', function (e) {
      ptrX = e.clientX; ptrY = e.clientY;
      if (!queued) { queued = true; raf(paint); }
    }, { passive: true });
  }

  // ==================================================================
  // Cursor lens: convex glass, grows over interactive elements and
  // stretches with speed. script.js owns .cursor (translate) and
  // .cursor__blob (rotate/scale) transforms; we wrap the blob in
  // .cursor__lens and put our liquid stretch there, never on theirs.
  // ==================================================================
  function setupLens(blob) {
    if (blob._lgLens || !finePointer) return;
    var cur = blob.closest ? blob.closest('.cursor') : null;
    if (!cur) return;
    blob._lgLens = true;
    cur.classList.add('lg-lens');

    var wrap = null;
    if (!reducedMotion) {
      wrap = doc.createElement('div');
      wrap.className = 'cursor__lens';
      wrap.setAttribute('aria-hidden', 'true');
      blob.parentNode.insertBefore(wrap, blob);
      wrap.appendChild(blob);
    }

    var vx = 0, vy = 0, lastX = null, lastY = 0, lastT = 0, moveT = 0;
    var str = 0, strV = 0, ang = 0, grow = 1, growV = 0, growT = 1, running = false;
    var baseW = blob.offsetWidth || 22, baseH = blob.offsetHeight || 22;

    function kick() { if (!running) { running = true; raf(frame); } }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var t = e.timeStamp || now();
      if (lastX !== null) {
        var dt = Math.max(8, t - lastT);
        var ivx = (e.clientX - lastX) / dt, ivy = (e.clientY - lastY) / dt; // px/ms
        vx += (ivx - vx) * 0.35; vy += (ivy - vy) * 0.35;
      }
      lastX = e.clientX; lastY = e.clientY; lastT = t; moveT = now();
      kick();
    }, { passive: true });

    doc.addEventListener('pointerover', function (e) {
      var t = e.target;
      var on = !!(t && t.closest && t.closest(GROW_SEL));
      growT = on ? LENS_GROW : 1;
      cur.classList.toggle('lg-lens-grow', on);
      kick();
    });

    var rotRe = /rotate\((-?[\d.]+)deg\)/;
    function frame() {
      if (now() - moveT > 40) { vx *= 0.8; vy *= 0.8; } // pointer at rest: let velocity die
      var speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 0.05) ang = Math.atan2(vy, vx);

      // springs (under-damped so the lens wobbles back like a droplet)
      var target = reducedMotion ? 0 : Math.min(speed * 0.09, 0.24);
      strV += (target - str) * 0.16; strV *= 0.74; str += strV;
      growV += (growT - grow) * 0.12; growV *= 0.72; grow += growV;

      if (wrap) {
        var sx = grow * (1 + str), sy = grow * Math.max(0.7, 1 - str * 0.55);
        var deg = (ang * 57.2958).toFixed(2);
        wrap.style.transform = 'rotate(' + deg + 'deg) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ') rotate(' + (-deg) + 'deg)';
      }
      cur.style.setProperty('--lg-lens', clamp(0, 1.2, (grow - 1) / (LENS_GROW - 1)).toFixed(3));

      // Specular hotspot: upper-left, dragged against the motion; expressed in
      // the blob's local (rotated by script.js) coordinates.
      var hx = clamp(-0.45, 0.45, -0.2 - vx * 0.08) * baseW;
      var hy = clamp(-0.45, 0.45, -0.26 - vy * 0.08) * baseH;
      var m = rotRe.exec(blob.style.transform || '');
      var th = m ? -parseFloat(m[1]) / 57.2958 : 0;
      var cs = Math.cos(th), sn = Math.sin(th);
      blob.style.setProperty('--lg-x', (baseW / 2 + hx * cs - hy * sn).toFixed(1) + 'px');
      blob.style.setProperty('--lg-y', (baseH / 2 + hx * sn + hy * cs).toFixed(1) + 'px');

      var settled = speed < 0.01 && Math.abs(str) < 0.002 && Math.abs(strV) < 0.002 &&
        Math.abs(grow - growT) < 0.002 && Math.abs(growV) < 0.002;
      if (settled) {
        running = false;
        vx = vy = 0;
        if (wrap) wrap.style.transform = grow > 1.001 ? 'scale(' + grow.toFixed(4) + ')' : '';
      } else raf(frame);
    }

    if (hasRO) {
      new ResizeObserver(function () {
        baseW = blob.offsetWidth || baseW; baseH = blob.offsetHeight || baseH;
      }).observe(blob);
    }
    kick();
  }

  // ==================================================================
  // Nav jelly: velocity-driven squash while scrolling (individual `scale`
  // property only; .nav itself keeps script.js's hide transform).
  // ==================================================================
  var wobbleEls = [];
  if (!reducedMotion) {
    var sy0 = window.scrollY, st0 = now(), sv = 0, scrollT = 0;
    var jel = 0, jelV = 0, wobbling = false;
    var wobble = function () {
      if (now() - scrollT > 60) sv *= 0.82;
      var target = Math.min(Math.abs(sv) / 3, 1); // ~3 px/ms = full squash
      jelV += (target - jel) * 0.2; jelV *= 0.68; jel += jelV;
      var done = Math.abs(sv) < 0.02 && Math.abs(jel) < 0.002 && Math.abs(jelV) < 0.002;
      var val = done ? '' : (1 + 0.02 * jel).toFixed(4) + ' ' + (1 - 0.06 * jel).toFixed(4);
      for (var i = 0; i < wobbleEls.length; i++) wobbleEls[i].style.scale = val;
      if (done) { wobbling = false; jel = jelV = sv = 0; } else raf(wobble);
    };
    window.addEventListener('scroll', function () {
      var y = window.scrollY, t = now();
      var dt = Math.max(8, t - st0);
      sv += ((y - sy0) / dt - sv) * 0.5;
      sy0 = y; st0 = t; scrollT = t;
      if (!wobbling) { wobbling = true; raf(wobble); }
    }, { passive: true });
  }

  // ==================================================================
  // Liquid press ripple: --lg-px/--lg-py + .lg-press on the host for ~600ms,
  // plus a throwaway absolutely-positioned span.lg-drop that CSS animates.
  // ==================================================================
  if (!reducedMotion) {
    doc.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      var t = e.target && e.target.closest ? e.target.closest(PRESS_SEL) : null;
      if (!t) return;
      var r = t.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var w = t.offsetWidth, h = t.offsetHeight;
      var x = (e.clientX - r.left) * (w / r.width), y = (e.clientY - r.top) * (h / r.height);
      var reach = Math.sqrt(Math.pow(Math.max(x, w - x), 2) + Math.pow(Math.max(y, h - y), 2));
      if (getComputedStyle(t).position === 'static') t.style.position = 'relative';

      t.style.setProperty('--lg-px', x.toFixed(1) + 'px');
      t.style.setProperty('--lg-py', y.toFixed(1) + 'px');
      t.classList.remove('lg-press');
      void t.offsetWidth; // restart CSS animations keyed on .lg-press
      t.classList.add('lg-press');
      clearTimeout(t._lgPressT);
      t._lgPressT = setTimeout(function () { t.classList.remove('lg-press'); }, 620);

      var drop = doc.createElement('span');
      drop.className = 'lg-drop';
      drop.setAttribute('aria-hidden', 'true');
      drop.style.setProperty('--lg-px', x.toFixed(1) + 'px');
      drop.style.setProperty('--lg-py', y.toFixed(1) + 'px');
      drop.style.setProperty('--lg-drop-r', reach.toFixed(1) + 'px');
      t.appendChild(drop);
      var gone = false;
      var kill = function () { if (gone) return; gone = true; if (drop.parentNode) drop.parentNode.removeChild(drop); };
      drop.addEventListener('animationend', kill);
      setTimeout(kill, 800);
    }, { passive: true });
  }

  // ==================================================================
  // Boot + late content (YAML-rendered sections, playground chips, modal)
  // ==================================================================
  scan();
  if ('MutationObserver' in window) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var n = muts[i].addedNodes, rm = muts[i].removedNodes;
        // ignore our own ripple spans
        if ((n.length === 1 && n[0].className === 'lg-drop') || (rm.length === 1 && rm[0].className === 'lg-drop' && !n.length)) continue;
        scheduleScan();
        return;
      }
    }).observe(doc.body, { childList: true, subtree: true });
  }
  // Fonts change pill widths after load
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () {
    for (var i = 0; i < items.length; i++) schedule(items[i], 0);
  });
})();
