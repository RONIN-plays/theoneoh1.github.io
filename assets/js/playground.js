/*
 * playground.js: physics skill playground (no dependencies).
 *
 *   import { mountPlayground } from './playground.js';
 *   const pg = mountPlayground(containerEl, [{ label, color, ink }, ...], { reducedMotion });
 *   pg.shake(); pg.setTheme('dark'); pg.destroy();
 *
 * Chips are real DOM pills (role="listitem") moved with transforms. Physics is
 * a small 2D rigid-body solver: each pill is a capsule (segment + radius), fixed
 * 1/120 s step with substeps, sequential impulses with friction and
 * restitution, split position correction, and per-body sleeping. The loop stops
 * when everything is asleep, offscreen, or the tab is hidden.
 */

// Tunables (px, seconds)
const T = {
  step: 1 / 120,        // fixed timestep
  substeps: 2,          // -> 240 Hz integration
  iterations: 8,        // velocity solver iterations per substep
  gravity: 2300,        // px/s^2
  restitution: 0.34,    // bounciness on impact
  bounceThreshold: 150, // approach speed (px/s) below which contacts are inelastic
  friction: 0.55,       // chip-chip
  wallFriction: 0.65,   // chip-wall/floor
  linDamp: 0.18,        // air drag per second
  angDamp: 1.1,
  slop: 0.5,            // allowed penetration (px)
  beta: 0.32,           // position-correction strength per substep
  maxCorrection: 6,
  maxSpeed: 2600,       // also prevents tunnelling (<= ~11px per substep)
  maxSpin: 18,          // rad/s
  sleepLin: 10,         // px/s
  sleepAng: 0.15,       // rad/s
  sleepTime: 0.42,      // s of stillness before a body sleeps
  wakeSpeed: 70,        // a body moving faster than this wakes sleeping neighbours
  restlessAfter: 2.2,   // s awake before sleep thresholds start loosening (dense piles)
  airRighting: 7,       // rad/s^2 gentle torque that levels airborne pills (toward 0 or PI)
  maxChips: 40,
  spawnGap: 0.055,      // s between chips raining in
  fillTarget: 0.34,     // max fraction of container area covered by chips
  fontMin: 11, fontMax: 22,
  heldScale: 1.06,
  throwWindow: 80,      // ms of pointer history used for the throw velocity
  maxThrow: 2600,
  nudgeSpeed: 650,      // pointer speed (px/s) that starts nudging chips
  nudgeGain: 0.14,
  nudgeMax: 420,
};

const INK = '#141210';
const FLIP_ON = (100 * Math.PI) / 180;  // label flips once the pill passes 100deg...
const FLIP_OFF = (80 * Math.PI) / 180;  // ...and unflips below 80deg (hysteresis)
const CREAM = '#F4EFE6';
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export function mountPlayground(container, items, opts = {}) {
  const api = { destroy() {}, setTheme() {}, shake() {} };
  if (!container || typeof document === 'undefined') return api;

  const list = Array.isArray(items) ? items.filter((it) => it && it.label).slice(0, T.maxChips) : [];
  let reduced = !!opts.reducedMotion;
  if (opts.reducedMotion === undefined && typeof matchMedia === 'function') {
    try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { /* ignore */ }
  }
  const debug = typeof opts.onDebug === 'function' ? opts.onDebug : null;

  // ---- state -----------------------------------------------------------
  const cleanups = [];            // functions run on destroy / static fallback
  const bodies = [];
  const contacts = [];
  let nContacts = 0;
  let wrap = null;
  let W = 0, H = 0, fontPx = 16;
  let theme = opts.theme === 'dark' ? 'dark' : 'light';
  let destroyed = false, isStatic = false, started = false, measured = false;
  let inView = typeof IntersectionObserver === 'undefined';
  let raf = 0, lastT = 0, acc = 0, simTime = 0, steps = 0;
  let held = null;
  let hover = null;
  const pending = [];             // bodies waiting to rain in

  const prevStyle = {
    position: container.style.position,
    overflow: container.style.overflow,
    touchAction: container.style.touchAction,
  };

  const on = (target, type, fn, o) => {
    target.addEventListener(type, fn, o);
    cleanups.push(() => target.removeEventListener(type, fn, o));
  };

  // ---- DOM -------------------------------------------------------------
  function buildDom() {
    wrap = document.createElement('div');
    wrap.className = 'pg-list';
    wrap.setAttribute('role', 'list');
    wrap.setAttribute('aria-label', 'Skills');
    list.forEach((it, i) => {
      const el = document.createElement('span');
      el.className = 'pg-chip';
      el.setAttribute('role', 'listitem');
      // Inner label: counter-rotated 180deg when the pill lies upside down, so
      // text always reads upright (a capsule at a and a+PI is the same shape).
      const label = document.createElement('span');
      label.className = 'pg-label';
      label.textContent = String(it.label);
      label.style.display = 'inline-block';
      label.style.transition = 'transform 260ms cubic-bezier(.34,1.56,.64,1)';
      el.appendChild(label);
      const s = el.style;
      s.background = it.color || '#FFC83A';
      s.color = it.ink || INK;
      s.font = 'inherit';
      s.fontWeight = '600';
      s.lineHeight = '1.1';
      s.whiteSpace = 'nowrap';
      s.padding = '0.5em 0.95em';
      s.borderRadius = '999px';
      s.boxSizing = 'border-box';
      s.display = 'inline-block';
      s.userSelect = 'none';
      s.webkitUserSelect = 'none';
      wrap.appendChild(el);
      bodies.push({
        el, label, flipped: false, i, w: 0, h: 0, r: 0, hl: 0,
        x: 0, y: 0, a: 0, vx: 0, vy: 0, av: 0,
        invM: 0, invI: 0, active: false, asleep: false, sleepT: 0,
        held: false, entered: false, touch: false, awakeT: 0, scale: 1, nudgeAt: 0, last: '',
        ex: 0, ey: 0, rot0: (Math.random() - 0.5) * 6,
      });
    });
    applyTheme();
    container.appendChild(wrap);
  }

  function applyTheme() {
    if (!wrap) return;
    const line = theme === 'dark' ? CREAM : INK;
    for (const b of bodies) {
      b.el.style.border = '2px solid var(--pg-chip-line, ' + line + ')';
      b.el.style.boxShadow = shadowFor(b);
    }
  }
  function shadowFor(b) {
    const c = theme === 'dark' ? 'rgba(244,239,230,.55)' : 'rgba(20,18,16,.9)';
    return b.held ? '5px 10px 0 ' + c : '2px 3px 0 ' + c;
  }

  // ---- static layout (reduced motion / fallback) -------------------------
  function toStatic() {
    isStatic = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    while (cleanups.length) { try { cleanups.pop()(); } catch (_) { /* ignore */ } }
    container.style.overflow = prevStyle.overflow;
    container.style.touchAction = prevStyle.touchAction;
    if (!wrap) return;
    const ws = wrap.style;
    ws.cssText = '';
    ws.display = 'flex';
    ws.flexWrap = 'wrap';
    ws.alignContent = 'flex-end';
    ws.justifyContent = 'center';
    ws.gap = '10px 8px';
    ws.padding = '16px';
    ws.boxSizing = 'border-box';
    ws.minHeight = '100%';
    ws.width = '100%';
    if (!fontPx || fontPx < T.fontMin) fontPx = 15;
    const w = container.clientWidth;
    if (w) fontPx = clamp(w / 52, 13, T.fontMax);
    for (const b of bodies) {
      const s = b.el.style;
      s.position = 'relative';
      s.top = s.left = '';
      s.transform = 'rotate(' + b.rot0.toFixed(2) + 'deg)';
      s.willChange = '';
      s.cursor = '';
      s.touchAction = '';
      s.zIndex = '';
      s.fontSize = fontPx + 'px';
      s.maxWidth = '100%';
      s.whiteSpace = 'normal';
      b.held = false;
      b.flipped = false;
      b.label.style.transform = '';
      b.el.classList.remove('is-held');
      b.el.style.boxShadow = shadowFor(b);
    }
    container.classList.add('pg-ready');
  }

  // ---- measurement -----------------------------------------------------
  function measure() {
    const cw = container.clientWidth, ch = container.clientHeight;
    if (!cw || !ch) return false;
    W = cw; H = ch;
    let f = clamp(W / 52, 14, T.fontMax);
    const read = (size) => {
      for (const b of bodies) b.el.style.fontSize = size + 'px';
      let area = 0;
      for (const b of bodies) {
        b.w = b.el.offsetWidth; b.h = b.el.offsetHeight;
        area += b.w * b.h;
      }
      return area;
    };
    let area = read(f);
    const fill = area / (W * H);
    if (fill > T.fillTarget) {
      f = Math.max(T.fontMin, f * Math.sqrt(T.fillTarget / fill));
      read(f);
    }
    fontPx = f;
    // Very long labels: shrink that chip until it fits the width comfortably.
    const maxW = W * 0.9;
    for (const b of bodies) {
      if (b.w > maxW) {
        const fs = Math.max(9, f * (maxW / b.w));
        b.el.style.fontSize = fs + 'px';
        b.w = b.el.offsetWidth; b.h = b.el.offsetHeight;
      }
    }
    for (const b of bodies) {
      if (!b.w || !b.h) return false;
      b.r = b.h / 2;
      b.hl = Math.max(0, (b.w - b.h) / 2);
      const m = (b.w * b.h) / 1000;
      b.invM = 1 / m;
      b.invI = 12 / (m * (b.w * b.w + b.h * b.h));
    }
    measured = true;
    return true;
  }

  // ---- physics helpers -------------------------------------------------
  const seg = { s: 0, t: 0 };
  function closestSegSeg(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
    const d1x = q1x - p1x, d1y = q1y - p1y, d2x = q2x - p2x, d2y = q2y - p2y;
    const rx = p1x - p2x, ry = p1y - p2y;
    const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
    let s, t;
    if (a < 1e-6 && e < 1e-6) { s = 0; t = 0; }
    else if (a < 1e-6) { s = 0; t = clamp(f / e, 0, 1); }
    else {
      const c = d1x * rx + d1y * ry;
      if (e < 1e-6) { t = 0; s = clamp(-c / a, 0, 1); }
      else {
        const bb = d1x * d2x + d1y * d2y, den = a * e - bb * bb;
        s = den > 1e-6 ? clamp((bb * f - c * e) / den, 0, 1) : 0;
        t = (bb * s + f) / e;
        if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); }
        else if (t > 1) { t = 1; s = clamp((bb - c) / a, 0, 1); }
      }
    }
    seg.s = s; seg.t = t;
  }
  function ptSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    return l < 1e-6 ? 0 : clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1);
  }

  function getContact() {
    let c = contacts[nContacts];
    if (!c) {
      c = { a: null, b: null, nx: 0, ny: 0, px: 0, py: 0, pen: 0, rax: 0, ray: 0, rbx: 0, rby: 0,
        kn: 0, kt: 0, bias: 0, jn: 0, jt: 0, mu: 0 };
      contacts[nContacts] = c;
    }
    nContacts++;
    return c;
  }
  const effM = (b) => (!b || b.asleep ? 0 : b.held ? b.invM * 0.2 : b.invM);
  const effI = (b) => (!b || b.asleep ? 0 : b.held ? b.invI * 0.2 : b.invI);

  function endpoints(b) {
    const c = Math.cos(b.a), s = Math.sin(b.a);
    b.cx = c * b.hl; b.cy = s * b.hl;
    b.ex = Math.abs(b.cx) + b.r;
    b.ey = Math.abs(b.cy) + b.r;
  }

  function addContact(a, b, nx, ny, px, py, pen, mu) {
    a.touch = true; if (b) b.touch = true;
    const c = getContact();
    c.a = a; c.b = b; c.nx = nx; c.ny = ny; c.px = px; c.py = py; c.pen = pen; c.mu = mu;
    c.jn = 0; c.jt = 0;
  }

  function wallContacts(b) {
    for (let k = 0; k < 2; k++) {
      const sx = k ? -1 : 1;
      const qx = b.x + sx * b.cx, qy = b.y + sx * b.cy, r = b.r;
      let pen = qy + r - H;
      if (pen > -0.25) addContact(b, null, 0, -1, qx, qy + r - pen * 0.5, pen, T.wallFriction);
      pen = r - qx;
      if (pen > -0.25) addContact(b, null, 1, 0, qx - r + pen * 0.5, qy, pen, T.wallFriction);
      pen = qx + r - W;
      if (pen > -0.25) addContact(b, null, -1, 0, qx + r - pen * 0.5, qy, pen, T.wallFriction);
      if (b.entered) {
        pen = r - qy;
        if (pen > -0.25) addContact(b, null, 0, 1, qx, qy - r + pen * 0.5, pen, T.wallFriction);
      }
    }
  }

  // candidate scratch for capsule-capsule
  const cand = [];
  for (let i = 0; i < 5; i++) cand.push({ ax: 0, ay: 0, bx: 0, by: 0, pen: 0 });

  function capsuleContacts(A, B) {
    const a0x = A.x + A.cx, a0y = A.y + A.cy, a1x = A.x - A.cx, a1y = A.y - A.cy;
    const b0x = B.x + B.cx, b0y = B.y + B.cy, b1x = B.x - B.cx, b1y = B.y - B.cy;
    const R = A.r + B.r;
    let n = 0;
    const push = (ax, ay, bx, by) => {
      const dx = ax - bx, dy = ay - by, d2 = dx * dx + dy * dy;
      if (d2 > (R + 0.25) * (R + 0.25)) return;
      const c = cand[n++];
      c.ax = ax; c.ay = ay; c.bx = bx; c.by = by; c.pen = R - Math.sqrt(d2);
    };
    closestSegSeg(a0x, a0y, a1x, a1y, b0x, b0y, b1x, b1y);
    push(a0x + (a1x - a0x) * seg.s, a0y + (a1y - a0y) * seg.s, b0x + (b1x - b0x) * seg.t, b0y + (b1y - b0y) * seg.t);
    let t = ptSeg(a0x, a0y, b0x, b0y, b1x, b1y);
    push(a0x, a0y, b0x + (b1x - b0x) * t, b0y + (b1y - b0y) * t);
    t = ptSeg(a1x, a1y, b0x, b0y, b1x, b1y);
    push(a1x, a1y, b0x + (b1x - b0x) * t, b0y + (b1y - b0y) * t);
    t = ptSeg(b0x, b0y, a0x, a0y, a1x, a1y);
    push(a0x + (a1x - a0x) * t, a0y + (a1y - a0y) * t, b0x, b0y);
    t = ptSeg(b1x, b1y, a0x, a0y, a1x, a1y);
    push(a0x + (a1x - a0x) * t, a0y + (a1y - a0y) * t, b1x, b1y);
    if (!n) return;
    // keep up to two deepest, spatially distinct contacts
    let i0 = 0;
    for (let i = 1; i < n; i++) if (cand[i].pen > cand[i0].pen) i0 = i;
    let i1 = -1;
    const minSep = Math.min(A.r, B.r) * 0.6;
    for (let i = 0; i < n; i++) {
      if (i === i0) continue;
      const dx = cand[i].bx - cand[i0].bx, dy = cand[i].by - cand[i0].by;
      if (dx * dx + dy * dy < minSep * minSep) continue;
      if (i1 < 0 || cand[i].pen > cand[i1].pen) i1 = i;
    }
    emit(A, B, cand[i0]);
    if (i1 >= 0) emit(A, B, cand[i1]);
  }
  function emit(A, B, c) {
    let nx = c.ax - c.bx, ny = c.ay - c.by;
    const d = Math.sqrt(nx * nx + ny * ny);
    if (d > 1e-4) { nx /= d; ny /= d; }
    else {
      // deep overlap of the core segments: push perpendicular to B's axis
      const ca = Math.cos(B.a), sa = Math.sin(B.a);
      nx = -sa; ny = ca;
      if ((A.x - B.x) * nx + (A.y - B.y) * ny < 0) { nx = -nx; ny = -ny; }
    }
    const k = B.r - c.pen * 0.5;
    addContact(A, B, nx, ny, c.bx + nx * k, c.by + ny * k, c.pen, T.friction);
  }

  function collide() {
    nContacts = 0;
    const n = bodies.length;
    for (let i = 0; i < n; i++) { const b = bodies[i]; if (b.active) { endpoints(b); b.touch = false; } }
    for (let i = 0; i < n; i++) {
      const A = bodies[i];
      if (!A.active) continue;
      if (!A.asleep) wallContacts(A);
      for (let j = i + 1; j < n; j++) {
        const B = bodies[j];
        if (!B.active || (A.asleep && B.asleep)) continue;
        if (Math.abs(A.x - B.x) > A.ex + B.ex + 2 || Math.abs(A.y - B.y) > A.ey + B.ey + 2) continue;
        // a moving body wakes a sleeping neighbour it is about to touch
        if (A.asleep && (B.held || B.vx * B.vx + B.vy * B.vy > T.wakeSpeed * T.wakeSpeed)) wake(A);
        else if (B.asleep && (A.held || A.vx * A.vx + A.vy * A.vy > T.wakeSpeed * T.wakeSpeed)) wake(B);
        capsuleContacts(A, B);
      }
    }
  }

  function prepare(dt) {
    for (let i = 0; i < nContacts; i++) {
      const c = contacts[i], a = c.a, b = c.b;
      const ima = effM(a), iia = effI(a), imb = effM(b), iib = effI(b);
      c.rax = c.px - a.x; c.ray = c.py - a.y;
      if (b) { c.rbx = c.px - b.x; c.rby = c.py - b.y; } else { c.rbx = 0; c.rby = 0; }
      const rnA = c.rax * c.ny - c.ray * c.nx, rnB = c.rbx * c.ny - c.rby * c.nx;
      const tx = -c.ny, ty = c.nx;
      const rtA = c.rax * ty - c.ray * tx, rtB = c.rbx * ty - c.rby * tx;
      const kn = ima + imb + iia * rnA * rnA + iib * rnB * rnB;
      const kt = ima + imb + iia * rtA * rtA + iib * rtB * rtB;
      c.kn = kn > 0 ? 1 / kn : 0;
      c.kt = kt > 0 ? 1 / kt : 0;
      let dvx = a.vx - a.av * c.ray, dvy = a.vy + a.av * c.rax;
      if (b) { dvx -= b.vx - b.av * c.rby; dvy -= b.vy + b.av * c.rbx; }
      const vn = dvx * c.nx + dvy * c.ny;
      c.bias = 0;
      if (c.pen < 0) c.bias = c.pen / dt;                 // closing a small gap is allowed
      else if (vn < -T.bounceThreshold) c.bias = -T.restitution * vn;
    }
  }

  function solve() {
    for (let i = 0; i < nContacts; i++) {
      const c = contacts[i], a = c.a, b = c.b;
      if (!c.kn) continue;
      const ima = effM(a), iia = effI(a), imb = effM(b), iib = effI(b);
      let dvx = a.vx - a.av * c.ray, dvy = a.vy + a.av * c.rax;
      if (b) { dvx -= b.vx - b.av * c.rby; dvy -= b.vy + b.av * c.rbx; }
      // friction
      const tx = -c.ny, ty = c.nx;
      let lt = -(dvx * tx + dvy * ty) * c.kt;
      const maxF = c.mu * c.jn;
      const jt = clamp(c.jt + lt, -maxF, maxF);
      lt = jt - c.jt; c.jt = jt;
      let px = tx * lt, py = ty * lt;
      a.vx += px * ima; a.vy += py * ima; a.av += iia * (c.rax * py - c.ray * px);
      if (b) { b.vx -= px * imb; b.vy -= py * imb; b.av -= iib * (c.rbx * py - c.rby * px); }
      // normal
      dvx = a.vx - a.av * c.ray; dvy = a.vy + a.av * c.rax;
      if (b) { dvx -= b.vx - b.av * c.rby; dvy -= b.vy + b.av * c.rbx; }
      const vn = dvx * c.nx + dvy * c.ny;
      let ln = (c.bias - vn) * c.kn;
      const jn = Math.max(c.jn + ln, 0);
      ln = jn - c.jn; c.jn = jn;
      px = c.nx * ln; py = c.ny * ln;
      a.vx += px * ima; a.vy += py * ima; a.av += iia * (c.rax * py - c.ray * px);
      if (b) { b.vx -= px * imb; b.vy -= py * imb; b.av -= iib * (c.rbx * py - c.rby * px); }
    }
  }

  function correctPositions() {
    collide();
    for (let i = 0; i < nContacts; i++) {
      const c = contacts[i], a = c.a, b = c.b;
      const C = clamp(T.beta * (c.pen - T.slop), 0, T.maxCorrection);
      if (C <= 0) continue;
      const ima = effM(a), iia = effI(a), imb = effM(b), iib = effI(b);
      const rax = c.px - a.x, ray = c.py - a.y;
      const rbx = b ? c.px - b.x : 0, rby = b ? c.py - b.y : 0;
      const rnA = rax * c.ny - ray * c.nx, rnB = rbx * c.ny - rby * c.nx;
      const k = ima + imb + iia * rnA * rnA + iib * rnB * rnB;
      if (k <= 0) continue;
      const imp = C / k, px = c.nx * imp, py = c.ny * imp;
      a.x += px * ima; a.y += py * ima; a.a += iia * (rax * py - ray * px);
      if (b) { b.x -= px * imb; b.y -= py * imb; b.a -= iib * (rbx * py - rby * px); }
    }
  }

  function substep(dt) {
    simTime += dt;
    while (pending.length && pending[0].spawnAt <= simTime) activate(pending.shift());
    const ld = Math.exp(-T.linDamp * dt), ad = Math.exp(-T.angDamp * dt);
    for (const b of bodies) {
      if (!b.active || b.asleep) continue;
      if (b.held) {
        const ca = Math.cos(b.a), sa = Math.sin(b.a);
        const tx = held.px - (held.ox * ca - held.oy * sa);
        const ty = held.py - (held.ox * sa + held.oy * ca);
        b.vx = ((tx - b.x) / dt) * 0.55;
        b.vy = ((ty - b.y) / dt) * 0.55;
        const tilt = held.a0 + clamp(held.pvx * 0.00022, -0.3, 0.3);
        b.av = clamp((tilt - b.a) * 12, -10, 10);
      } else {
        b.vy += T.gravity * dt;
        b.vx *= ld; b.vy *= ld; b.av *= ad;
        if (!b.touch) b.av -= Math.sin(2 * b.a) * 0.5 * T.airRighting * dt;
        b.awakeT += dt;
      }
    }
    collide();
    prepare(dt);
    for (let k = 0; k < T.iterations; k++) solve();
    for (const b of bodies) {
      if (!b.active || b.asleep) continue;
      const sp = b.vx * b.vx + b.vy * b.vy;
      if (sp > T.maxSpeed * T.maxSpeed) { const f = T.maxSpeed / Math.sqrt(sp); b.vx *= f; b.vy *= f; }
      b.av = clamp(b.av, -T.maxSpin, T.maxSpin);
      b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.av * dt;
      if (!b.entered && b.y - b.ey > 0) b.entered = true;
    }
    correctPositions();
    // sleeping
    for (const b of bodies) {
      if (!b.active || b.asleep || b.held) continue;
      const loose = 1 + clamp((b.awakeT - T.restlessAfter) * 1.5, 0, 5);
      const sl = T.sleepLin * loose;
      if (b.vx * b.vx + b.vy * b.vy < sl * sl && Math.abs(b.av) < T.sleepAng * loose) {
        b.sleepT += dt;
        if (b.sleepT > T.sleepTime && b.entered) { b.asleep = true; b.vx = b.vy = b.av = 0; }
      } else b.sleepT = 0;
    }
    steps++;
  }

  function activate(b) {
    b.active = true;
    b.asleep = false;
    b.awakeT = 0;
    b.sleepT = 0;
    endpoints(b);
    b.x = clamp(b.ex + Math.random() * (W - 2 * b.ex), b.ex, Math.max(b.ex, W - b.ex));
    b.y = -b.ey - 4 - Math.random() * 30;
    b.a = (Math.random() - 0.5) * 0.9;
    b.vx = (Math.random() - 0.5) * 160;
    b.vy = 120 + Math.random() * 260;
    b.av = (Math.random() - 0.5) * 5;
  }

  function wake(b) {
    if (!b.active) return;
    if (b.asleep) b.awakeT = 0;
    b.asleep = false;
    b.sleepT = 0;
  }
  function wakeAll() { for (const b of bodies) wake(b); ensureLoop(); }

  // ---- loop ------------------------------------------------------------
  const canRun = () => started && inView && !destroyed && !isStatic && !document.hidden;
  function ensureLoop() {
    if (!raf && canRun()) { lastT = 0; raf = requestAnimationFrame(tick); }
  }
  function settled() {
    if (held || pending.length) return false;
    for (const b of bodies) if (b.active && (!b.asleep || Math.abs(b.scale - 1) > 0.001)) return false;
    return true;
  }
  function tick(t) {
    raf = 0;
    if (!canRun()) return;
    try {
      const dt = lastT ? Math.min((t - lastT) / 1000, 1 / 20) : T.step;
      lastT = t;
      acc += dt;
      const t0 = debug ? performance.now() : 0;
      const sub = T.step / T.substeps;
      while (acc >= T.step) {
        for (let k = 0; k < T.substeps; k++) substep(sub);
        acc -= T.step;
      }
      render(dt);
      if (debug) { const st = stats(); st.frameMs = performance.now() - t0; debug(st); }
      if (!settled()) raf = requestAnimationFrame(tick);
      else acc = 0;
    } catch (err) {
      fail(err);
    }
  }
  function stats() {
    let awake = 0, active = 0;
    for (const b of bodies) if (b.active) { active++; if (!b.asleep) awake++; }
    return { awake, active, total: bodies.length, steps, running: !!raf, contacts: nContacts };
  }

  function render(dt) {
    const k = 1 - Math.exp(-dt * 22);
    for (const b of bodies) {
      if (!b.active) continue;
      const target = b.held ? T.heldScale : 1;
      b.scale += (target - b.scale) * k;
      if (Math.abs(target - b.scale) < 0.0005) b.scale = target;
      const tr = 'translate3d(' + (b.x - b.w / 2).toFixed(2) + 'px,' + (b.y - b.h / 2).toFixed(2) +
        'px,0) rotate(' + b.a.toFixed(4) + 'rad) scale(' + b.scale.toFixed(4) + ')';
      if (tr !== b.last) { b.el.style.transform = tr; b.last = tr; }
      const n = Math.abs(Math.atan2(Math.sin(b.a), Math.cos(b.a)));
      const flip = b.flipped ? n > FLIP_OFF : n > FLIP_ON;
      if (flip !== b.flipped) { b.flipped = flip; b.label.style.transform = flip ? 'rotate(180deg)' : ''; }
    }
  }

  // ---- pointer ---------------------------------------------------------
  function localPoint(e) {
    const r = container.getBoundingClientRect();
    return { x: e.clientX - r.left - container.clientLeft, y: e.clientY - r.top - container.clientTop };
  }
  const bodyOf = (el) => {
    const chip = el && el.closest ? el.closest('.pg-chip') : null;
    if (!chip || chip.parentNode !== wrap) return null;
    return bodies.find((b) => b.el === chip) || null;
  };

  function onDown(e) {
    if (held || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const b = bodyOf(e.target);
    if (!b || !b.active) return;
    e.preventDefault();
    try { b.el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    const p = localPoint(e);
    const dx = p.x - b.x, dy = p.y - b.y, ca = Math.cos(-b.a), sa = Math.sin(-b.a);
    held = { b, id: e.pointerId, px: p.x, py: p.y, ox: dx * ca - dy * sa, oy: dx * sa + dy * ca,
      a0: Math.round(b.a / Math.PI) * Math.PI, pvx: 0, samples: [{ t: e.timeStamp || performance.now(), x: p.x, y: p.y }] };
    b.held = true;
    b.el.classList.add('is-held');
    b.el.style.zIndex = '2';
    b.el.style.cursor = 'grabbing';
    wrap.style.cursor = 'grabbing';
    b.el.style.boxShadow = shadowFor(b);
    wakeAll();
  }

  function onMove(e) {
    if (held && e.pointerId === held.id) {
      const p = localPoint(e);
      held.px = clamp(p.x, -40, W + 40);
      held.py = clamp(p.y, -40, H + 40);
      const now = e.timeStamp || performance.now();
      held.samples.push({ t: now, x: p.x, y: p.y });
      while (held.samples.length > 2 && now - held.samples[0].t > T.throwWindow) held.samples.shift();
      const s0 = held.samples[0], dtm = (now - s0.t) / 1000;
      if (dtm > 0.008) held.pvx = (p.x - s0.x) / dtm;
      ensureLoop();
      return;
    }
    if (held || e.pointerType !== 'mouse') return;
    const p = localPoint(e), now = e.timeStamp || performance.now();
    if (hover) {
      const dtm = (now - hover.t) / 1000;
      if (dtm >= 0.004) {
        const vx = (p.x - hover.x) / dtm, vy = (p.y - hover.y) / dtm;
        if (vx * vx + vy * vy > T.nudgeSpeed * T.nudgeSpeed) nudge(p.x, p.y, vx, vy, now);
        hover.x = p.x; hover.y = p.y; hover.t = now;
      }
    } else hover = { x: p.x, y: p.y, t: now };
  }

  function nudge(px, py, vx, vy, now) {
    let ix = vx * T.nudgeGain, iy = vy * T.nudgeGain;
    const m = Math.sqrt(ix * ix + iy * iy);
    if (m > T.nudgeMax) { ix *= T.nudgeMax / m; iy *= T.nudgeMax / m; }
    let any = false;
    for (const b of bodies) {
      if (!b.active || b.held || now - b.nudgeAt < 160) continue;
      endpoints(b);
      const t = ptSeg(px, py, b.x + b.cx, b.y + b.cy, b.x - b.cx, b.y - b.cy);
      const qx = b.x + b.cx * (1 - 2 * t), qy = b.y + b.cy * (1 - 2 * t);
      const dx = px - qx, dy = py - qy;
      if (dx * dx + dy * dy > (b.r + 8) * (b.r + 8)) continue;
      wake(b);
      b.nudgeAt = now;
      b.vx += ix; b.vy += iy - 90;
      // spin depends on which side of the centre was brushed
      b.av += ((px - b.x) * iy - (py - b.y) * ix) * 0.00009;
      any = true;
    }
    if (any) ensureLoop();
  }

  function release(e) {
    if (!held || (e && e.pointerId !== held.id)) return;
    const { b, samples } = held;
    const last = samples[samples.length - 1], first = samples[0];
    const dtm = (last.t - first.t) / 1000;
    const now = (e && e.timeStamp) || performance.now();
    let vx = 0, vy = 0;
    if (dtm > 0.008 && now - last.t < 120) { vx = (last.x - first.x) / dtm; vy = (last.y - first.y) / dtm; }
    const sp = Math.sqrt(vx * vx + vy * vy);
    if (sp > T.maxThrow) { vx *= T.maxThrow / sp; vy *= T.maxThrow / sp; }
    // grab offset in world space -> spin from an off-centre throw
    const ca = Math.cos(b.a), sa = Math.sin(b.a);
    const ox = held.ox * ca - held.oy * sa, oy = held.ox * sa + held.oy * ca;
    b.vx = vx; b.vy = vy; b.awakeT = 0;
    b.av = clamp(b.av + (ox * vy - oy * vx) * 0.00006, -T.maxSpin, T.maxSpin);
    b.held = false;
    try { if (b.el.hasPointerCapture && b.el.hasPointerCapture(held.id)) b.el.releasePointerCapture(held.id); } catch (_) { /* ignore */ }
    held = null;
    b.el.classList.remove('is-held');
    b.el.style.zIndex = '';
    b.el.style.cursor = 'grab';
    wrap.style.cursor = '';
    b.el.style.boxShadow = shadowFor(b);
    wake(b);
    ensureLoop();
  }

  // ---- start / observers ---------------------------------------------
  function start() {
    if (started || destroyed || isStatic) return;
    if (!measured && !measure()) return; // retried by ResizeObserver once visible
    started = true;
    const order = bodies.slice().sort(() => Math.random() - 0.5);
    order.forEach((b, i) => { b.spawnAt = simTime + 0.05 + i * T.spawnGap; pending.push(b); });
    ensureLoop();
  }

  function onResize() {
    const cw = container.clientWidth, ch = container.clientHeight;
    if (!cw || !ch) return;
    if (!measured) { if (measure() && inView) start(); return; }
    const oldF = fontPx;
    const nextF = clamp(cw / 52, 14, T.fontMax);
    W = cw; H = ch;
    if (Math.abs(nextF - oldF) > 0.75) measure();
    for (const b of bodies) {
      if (!b.active) continue;
      endpoints(b);
      b.x = clamp(b.x, b.ex, Math.max(b.ex, W - b.ex));
      if (b.y > H - b.ey) b.y = H - b.ey;
    }
    render(0);
    wakeAll();
  }

  function setupPhysics() {
    container.style.overflow = 'hidden';
    container.style.touchAction = 'pan-y';
    try { if (getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (_) { /* ignore */ }
    const ws = wrap.style;
    ws.position = 'absolute';
    ws.inset = '0';
    ws.top = ws.left = '0';
    ws.width = ws.height = '100%';
    for (const b of bodies) {
      const s = b.el.style;
      s.position = 'absolute';
      s.top = '0';
      s.left = '0';
      s.willChange = 'transform';
      s.transformOrigin = '50% 50%';
      s.transform = 'translate3d(0,-200%,0)';
      s.cursor = 'grab';
      s.touchAction = 'none';
      s.webkitTapHighlightColor = 'transparent';
    }
    measure();
    container.classList.add('pg-ready');

    on(wrap, 'pointerdown', onDown);
    on(wrap, 'pointermove', onMove);
    on(wrap, 'pointerup', release);
    on(wrap, 'pointercancel', release);
    on(wrap, 'lostpointercapture', release);
    on(wrap, 'pointerleave', () => { hover = null; });
    on(wrap, 'dragstart', (e) => e.preventDefault());
    on(document, 'visibilitychange', () => { if (!document.hidden) ensureLoop(); });

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => { try { onResize(); } catch (err) { fail(err); } });
      ro.observe(container);
      cleanups.push(() => ro.disconnect());
    } else on(window, 'resize', onResize);

    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries) => {
        for (const en of entries) {
          inView = en.isIntersecting;
          if (inView) { if (!started) start(); else ensureLoop(); }
        }
      }, { threshold: 0.2 });
      io.observe(container);
      cleanups.push(() => io.disconnect());
    } else start();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (destroyed || isStatic || !measured) return;
        measure();
        onResize();
      }).catch(() => {});
    }
  }

  function fail(err) {
    try { if (typeof console !== 'undefined') console.warn('[playground] falling back to static layout', err); } catch (_) { /* ignore */ }
    try { toStatic(); } catch (_) { /* ignore */ }
  }

  // ---- mount -----------------------------------------------------------
  try {
    buildDom();
    if (reduced || !list.length) toStatic();
    else setupPhysics();
  } catch (err) {
    fail(err);
  }

  api.shake = () => {
    if (destroyed || isStatic) return;
    try {
      if (!started) { start(); return; }
      const s = Math.sqrt(Math.max(H, 200) / 480);
      for (const b of bodies) {
        if (!b.active || b.held) continue;
        wake(b);
        b.awakeT = 0;
        b.vy -= (650 + Math.random() * 750) * s;
        b.vx += (Math.random() - 0.5) * 600;
        b.av += (Math.random() - 0.5) * 10;
      }
      ensureLoop();
    } catch (err) { fail(err); }
  };

  api.setTheme = (next) => {
    theme = next === 'dark' ? 'dark' : 'light';
    try { applyTheme(); } catch (_) { /* ignore */ }
  };

  api.destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    while (cleanups.length) { try { cleanups.pop()(); } catch (_) { /* ignore */ } }
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    wrap = null;
    bodies.length = 0; pending.length = 0; contacts.length = 0;
    held = null;
    container.classList.remove('pg-ready');
    container.style.position = prevStyle.position;
    container.style.overflow = prevStyle.overflow;
    container.style.touchAction = prevStyle.touchAction;
  };

  return api;
}

export default mountPlayground;
