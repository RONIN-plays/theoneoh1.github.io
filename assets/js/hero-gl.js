/*
 * hero-gl.js — "LiDAR terrain scan" point cloud for the hero.
 *
 * A lattice of points drapes over slowly drifting fbm terrain, read like a
 * survey scan: topographic contour bands sit darker in the cloud, a single
 * scan front sweeps toward the viewer and leaves a short accent trail,
 * and the pointer projects a small reticle onto the ground.
 *
 * Contract: export function mountHero(container, opts) -> { destroy, setTheme, setProgress }
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const NOOP = Object.freeze({ destroy() {}, setTheme() {}, setProgress() {} });

/* ------------------------------------------------------------ tunables */
const CFG = {
  width: 26,            // terrain extent (world units, x)
  depth: 18,            // terrain extent (world units, z)
  grid: {               // columns x rows of the lattice
    desktop: [230, 160],  // 36,800 pts
    medium:  [170, 118],  // 20,060 pts (low core count)
    mobile:  [130, 100],  // 13,000 pts
  },
  amp: 1.35,            // terrain height
  freq: 0.16,           // terrain noise frequency
  drift: 0.045,         // terrain flow speed toward camera (units/s in noise space)
  pointSize: 2.1,       // CSS px at reference distance
  alpha: 0.34,          // base point opacity (light theme)
  alphaDark: 0.42,      // base point opacity (dark theme)
  contour: 0.22,        // contour interval (world units of height)
  sweepPeriod: 9.0,     // seconds per scan cycle
  sweepTravel: 6.5,     // seconds of that cycle the front is moving
  trail: 1.7,           // accent trail length behind the scan front
  pointerRadius: 1.25,   // world radius of pointer influence
  parallax: [0.7, 0.35],// camera offset range from pointer (x, y)
  staticTime: 14.0,     // time used for the reduced-motion still
};

/* ------------------------------------------------------------ colour */
function parseColor(str, fallback) {
  const s = (str || '').trim();
  if (!s) return fallback.slice();
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6 || h.length === 8) {
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    }
  }
  m = s.match(/^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/i);
  if (m) {
    return [m[1], m[2], m[3]].map((v) =>
      v.endsWith('%') ? Math.min(1, parseFloat(v) / 100) : Math.min(1, parseFloat(v) / 255));
  }
  // Anything else (named colours, color(), hsl...) — let the browser normalise it.
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillStyle = s;
      const n = ctx.fillStyle;
      if (n && n !== s) return parseColor(n, fallback);
    }
  } catch (_) { /* ignore */ }
  return fallback.slice();
}

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink: parseColor(cs.getPropertyValue('--ink'), [17 / 255, 17 / 255, 16 / 255]),
    accent: parseColor(cs.getPropertyValue('--accent'), [1, 77 / 255, 0]),
  };
}

function luminance(c) { return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }

/* ------------------------------------------------------------ shaders */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;
  uniform float uDrift;
  uniform float uSize;
  uniform float uDpr;
  uniform float uProgress;
  uniform float uSweep;
  uniform float uTrail;
  uniform float uContour;
  uniform vec3  uPointer;      // world xz in .xz, strength in .y
  uniform float uPointerRadius;
  uniform vec2  uHalf;         // half extents (x, z)

  attribute float aRand;

  varying float vAlpha;
  varying float vAccent;

  // Ashima simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x   + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float terrain(vec2 p) {
    float h = 0.0;
    float a = 0.62;
    vec2 q = p;
    for (int i = 0; i < 4; i++) {
      h += a * snoise(q);
      q = q * 2.03 + vec2(17.1, 3.7);
      a *= 0.48;
    }
    // soft ridge to give it a survey-worthy landform
    float ridge = 1.0 - abs(snoise(p * 0.55 + vec2(4.2, -1.3)));
    return h + ridge * ridge * 0.55 - 0.3;
  }

  void main() {
    vec3 pos = position;

    // terrain flows slowly toward the viewer
    vec2 np = vec2(pos.x, pos.z - uTime * uDrift / uFreq) * uFreq;
    float flatten = 1.0 - 0.65 * uProgress;
    float h = terrain(np) * uAmp * flatten;
    pos.y = h;

    // edge falloff (elliptical) so the cloud dissolves into the paper
    vec2 nrm = pos.xz / uHalf;
    float edge = 1.0 - smoothstep(0.55, 1.0, length(nrm * vec2(0.92, 1.0)));

    // contour bands: points near an iso-height read darker
    float c = abs(fract(h / uContour) - 0.5) * 2.0;     // 1 at the iso-line
    float contour = smoothstep(0.78, 0.98, c);

    // scan front travelling toward +z, short accent trail behind it
    float d = uSweep - pos.z;
    float front = exp(-pow(d / 0.14, 2.0));
    float trail = d > 0.0 ? exp(-d / uTrail) * 0.4 : 0.0;
    float scan = clamp(front + trail, 0.0, 1.0);
    pos.y += front * 0.06;

    // pointer: gentle lift + outward push, thin reticle ring
    vec2 toP = pos.xz - uPointer.xz;
    float pd = length(toP);
    float pf = (1.0 - smoothstep(0.0, uPointerRadius, pd)) * uPointer.y;
    pos.y += pf * pf * 0.45;
    pos.xz += (pd > 1e-4 ? toP / pd : vec2(0.0)) * pf * 0.22;
    float ring = exp(-pow((pd - uPointerRadius * 0.7) / 0.05, 2.0)) * uPointer.y;

    // scroll-away: points lift and scatter softly
    pos.y += uProgress * (0.6 + aRand * 1.8);
    pos.x += uProgress * (aRand - 0.5) * 1.2;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = -mv.z;
    float depthFade = 1.0 - smoothstep(12.0, 22.0, dist);

    float size = uSize * (1.0 + front * 0.6 + contour * 0.25 + ring * 0.5) * pow(9.0 / max(dist, 0.1), 0.6);
    gl_PointSize = max(size, 0.9) * uDpr;

    float a = (0.62 + 0.18 * aRand) + contour * 1.2 + scan * 1.1 + pf * 0.6 + ring * 1.2;
    vAlpha = a * edge * depthFade * (1.0 - 0.75 * uProgress);
    vAccent = clamp(front + trail * 0.55 + ring + pf * 0.2, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uAlpha;

  varying float vAlpha;
  varying float vAccent;

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float r = length(pc);
    float mask = 1.0 - smoothstep(0.38, 0.5, r);
    if (mask <= 0.0) discard;
    vec3 col = mix(uInk, uAccent, vAccent);
    float a = clamp(vAlpha * uAlpha, 0.0, 1.0) * mask;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`;

/* ------------------------------------------------------------ helpers */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (_) {
    return false;
  }
}

function buildGeometry(cols, rows) {
  const count = cols * rows;
  const positions = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const cw = CFG.width / (cols - 1);
  const ch = CFG.depth / (rows - 1);
  // deterministic PRNG so the still frame is stable between loads
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions[i * 3]     = -CFG.width / 2 + c * cw + (rnd() - 0.5) * cw * 0.18;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = -CFG.depth / 2 + r * ch;
      rand[i] = rnd();
      i++;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  return g;
}

/* ------------------------------------------------------------ mount */
export function mountHero(container, opts = {}) {
  if (!container || typeof window === 'undefined' || !hasWebGL()) return NOOP;

  const reduced = opts.reducedMotion === true;
  let renderer = null;
  let geometry = null;
  let material = null;
  let canvas = null;
  const cleanups = [];

  const teardown = () => {
    while (cleanups.length) {
      try { cleanups.pop()(); } catch (_) { /* ignore */ }
    }
    try { geometry && geometry.dispose(); } catch (_) {}
    try { material && material.dispose(); } catch (_) {}
    try {
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
    } catch (_) {}
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    renderer = geometry = material = canvas = null;
  };

  try {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const isMobile = coarse || window.innerWidth < 768;
    const lowCore = (navigator.hardwareConcurrency || 8) <= 4;
    const [cols, rows] = isMobile ? CFG.grid.mobile : lowCore ? CFG.grid.medium : CFG.grid.desktop;
    const dprCap = isMobile ? 1.5 : 2;
    const dpr = () => Math.min(window.devicePixelRatio || 1, dprCap);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,           // round points are anti-aliased in the shader
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr());
    canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
    });
    if (getComputedStyle(container).position === 'static') {
      // the site should position #hero-gl itself; this is only a safety net
      container.style.position = 'relative';
    }
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    const camBase = new THREE.Vector3(0, 5.4, 8.2);
    const lookAt = new THREE.Vector3(0, -0.6, -1.6);
    camera.position.copy(camBase);
    camera.lookAt(lookAt);

    geometry = buildGeometry(cols, rows);
    const colors = readColors();
    const isDark = () => luminance(colors.ink) > 0.5; // light ink => dark theme

    const uniforms = {
      uTime: { value: reduced ? CFG.staticTime : 0 },
      uAmp: { value: CFG.amp },
      uFreq: { value: CFG.freq },
      uDrift: { value: CFG.drift },
      uSize: { value: CFG.pointSize },
      uDpr: { value: dpr() },
      uProgress: { value: 0 },
      uSweep: { value: reduced ? 1.5 : -100 },
      uTrail: { value: CFG.trail },
      uContour: { value: CFG.contour },
      uPointer: { value: new THREE.Vector3(0, 0, -100) },
      uPointerRadius: { value: CFG.pointerRadius },
      uHalf: { value: new THREE.Vector2(CFG.width / 2, CFG.depth / 2) },
      uInk: { value: new THREE.Vector3().fromArray(colors.ink) },
      uAccent: { value: new THREE.Vector3().fromArray(colors.accent) },
      uAlpha: { value: isDark() ? CFG.alphaDark : CFG.alpha },
    };

    material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // vertices are displaced in the shader
    scene.add(points);

    /* ---------------- state */
    let width = 0;
    let height = 0;
    let rect = { left: 0, top: 0, width: 1, height: 1 };
    let inView = true;
    let raf = 0;
    let running = false;
    let shownCanvas = false;
    let destroyed = false;
    let time = uniforms.uTime.value;
    let lastNow = 0;
    let progressTarget = 0;
    let progress = 0;

    // pointer (NDC relative to container) + eased values
    const ptr = { x: 0, y: 0, active: false, has: false };
    const ease = { px: 0, py: 0, strength: 0 };
    const raycaster = new THREE.Raycaster();
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const ndc = new THREE.Vector2();
    const pointerWorld = new THREE.Vector3(0, 0, -100);

    const updateRect = () => {
      const r = container.getBoundingClientRect();
      rect = { left: r.left, top: r.top, width: r.width || 1, height: r.height || 1 };
    };

    const resize = () => {
      const w = Math.max(1, Math.round(container.clientWidth));
      const h = Math.max(1, Math.round(container.clientHeight));
      updateRect();
      if (w === width && h === height) return false;
      width = w;
      height = h;
      renderer.setPixelRatio(dpr());
      uniforms.uDpr.value = dpr();
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep the terrain filling narrow (portrait) viewports
      camera.fov = camera.aspect < 1 ? 34 + (1 - camera.aspect) * 22 : 34;
      camera.updateProjectionMatrix();
      return true;
    };

    const render = () => {
      if (!renderer) return;
      renderer.render(scene, camera);
      if (!shownCanvas) {
        shownCanvas = true;
        requestAnimationFrame(() => { if (canvas) canvas.style.opacity = '1'; });
      }
    };

    const applyCamera = () => {
      const p = progress;
      camera.position.set(
        camBase.x + ease.px * CFG.parallax[0],
        camBase.y + ease.py * CFG.parallax[1] + p * 2.2,
        camBase.z + p * 1.6,
      );
      camera.lookAt(lookAt.x, lookAt.y - p * 0.6, lookAt.z);
    };

    /* ---------------- frame */
    const frame = (now) => {
      raf = 0;
      if (!running || destroyed) return;
      const dt = lastNow ? Math.min((now - lastNow) / 1000, 1 / 20) : 1 / 60;
      lastNow = now;
      time += dt;
      uniforms.uTime.value = time;

      // frame-rate independent easing factors
      const kSlow = 1 - Math.exp(-dt * 2.2);
      const kMid = 1 - Math.exp(-dt * 5.0);

      progress += (progressTarget - progress) * kMid;
      uniforms.uProgress.value = progress;

      ease.px += ((ptr.has ? ptr.x : 0) - ease.px) * kSlow;
      ease.py += ((ptr.has ? ptr.y : 0) - ease.py) * kSlow;
      applyCamera();
      camera.updateMatrixWorld();

      // scan front
      const phase = (time % CFG.sweepPeriod) / CFG.sweepTravel;
      const zFar = -CFG.depth / 2 - 1;
      const zNear = CFG.depth / 2 + 1;
      uniforms.uSweep.value = phase <= 1 ? zFar + (zNear - zFar) * phase : zNear + (phase - 1) * 40;

      // pointer projected onto the ground plane
      let target = 0;
      if (ptr.active) {
        ndc.set(ptr.x, ptr.y);
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(ground, hit)) {
          if (ease.strength < 0.02) pointerWorld.copy(hit);
          else pointerWorld.lerp(hit, 1 - Math.exp(-dt * 10));
          target = 1;
        }
      }
      ease.strength += (target - ease.strength) * kMid;
      uniforms.uPointer.value.set(pointerWorld.x, ease.strength * (1 - progress), pointerWorld.z);

      render();
      schedule();
    };

    const schedule = () => {
      if (!raf && running) raf = requestAnimationFrame(frame);
    };

    const updateRunning = () => {
      const should = !reduced && !destroyed && inView && !document.hidden;
      if (should && !running) {
        running = true;
        lastNow = 0;
        schedule();
      } else if (!should && running) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const renderStatic = () => {
      applyCamera();
      camera.updateMatrixWorld();
      render();
    };

    /* ---------------- observers & listeners */
    const ro = new ResizeObserver(() => {
      if (resize() && (reduced || !running)) renderStatic();
    });
    ro.observe(container);
    cleanups.push(() => ro.disconnect());

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) inView = e.isIntersecting;
        updateRunning();
      }, { rootMargin: '64px' });
      io.observe(container);
      cleanups.push(() => io.disconnect());
    }

    const onVis = () => updateRunning();
    document.addEventListener('visibilitychange', onVis);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVis));

    const onContextLost = (e) => {
      e.preventDefault();
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onContextRestored = () => {
      if (reduced) renderStatic(); else updateRunning();
    };
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);
    const cv = canvas;
    cleanups.push(() => {
      cv.removeEventListener('webglcontextlost', onContextLost);
      cv.removeEventListener('webglcontextrestored', onContextRestored);
    });

    if (!reduced) {
      const onMove = (e) => {
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        ptr.x = Math.max(-1.2, Math.min(1.2, x));
        ptr.y = Math.max(-1.2, Math.min(1.2, y));
        ptr.has = true;
        ptr.active = e.pointerType !== 'touch' && x >= -1 && x <= 1 && y >= -1 && y <= 1;
      };
      const onLeave = () => { ptr.active = false; ptr.has = false; };
      const onOut = (e) => { if (!e.relatedTarget) onLeave(); };
      const onScroll = () => updateRect();
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('blur', onLeave);
      document.addEventListener('pointerout', onOut);
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('blur', onLeave);
        document.removeEventListener('pointerout', onOut);
        window.removeEventListener('scroll', onScroll);
      });
    }

    /* ---------------- first frame */
    resize();
    if (reduced) {
      renderStatic();
    } else {
      renderStatic(); // draw immediately, the loop takes over next frame
      updateRunning();
    }

    /* ---------------- API */
    const applyColors = () => {
      const c = readColors();
      colors.ink = c.ink;
      colors.accent = c.accent;
      uniforms.uInk.value.fromArray(c.ink);
      uniforms.uAccent.value.fromArray(c.accent);
    };

    return {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        teardown();
      },
      setTheme(theme) {
        if (destroyed) return;
        applyColors();
        const dark = theme === 'dark' || (theme !== 'light' && isDark());
        uniforms.uAlpha.value = dark ? CFG.alphaDark : CFG.alpha;
        if (reduced) renderStatic();
        // CSS variables may resolve a frame after the attribute flips — re-read once more.
        requestAnimationFrame(() => {
          if (destroyed) return;
          applyColors();
          if (reduced) renderStatic();
        });
      },
      setProgress(p) {
        if (destroyed) return;
        const v = Math.max(0, Math.min(1, Number(p) || 0));
        progressTarget = v;
        if (reduced || !running) {
          progress = v;
          uniforms.uProgress.value = v;
          uniforms.uPointer.value.y = 0;
          if (reduced) renderStatic(); // offscreen/hidden: the loop picks it up on resume
        }
      },
    };
  } catch (err) {
    teardown();
    if (typeof console !== 'undefined' && console.warn) console.warn('[hero-gl] disabled:', err);
    return NOOP;
  }
}

export default mountHero;
