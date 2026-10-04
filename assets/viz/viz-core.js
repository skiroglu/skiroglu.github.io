/* ==========================================================================
   viz-core.js — shared helpers for the animated research visualizations.

   Each visualization registers a spec:
     VIZ.register(name, {
       duration,            // loop length in ms
       alt,                 // one-sentence text alternative for the SVG
       build(svg, W),       // draws at pixel width W; returns { H, render(t, cycle), still() }
     })
   and is mounted on any <figure data-viz="name">.

   The SVG is rebuilt at the container's real pixel width (not a scaled
   viewBox), so text stays readable on phones. Motion pauses off-screen, on
   hidden tabs, on request (pause button), and is replaced by a still frame
   under prefers-reduced-motion.
   ========================================================================== */
window.VIZ = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Review hooks: ?t=0.35 freezes every figure at that point in its loop; ?still shows the reduced-motion frame.
  const params = new URLSearchParams(location.search);
  const frozenT = params.has('t') ? Math.min(0.9999, Math.max(0, parseFloat(params.get('t')) || 0)) : null;
  const forceStill = params.has('still');

  // Site tokens; one validated ordinal teal ramp (light -> dark); one validated
  // categorical pair (teal, brick) for series identity. Neutral grey and ink act
  // as reference series.
  const C = {
    bg: '#fcfcfa', ink: '#1b1b1b', muted: '#5c5c5c', rule: '#e3e1dc',
    base: '#ebe8e2', neutral: '#a8a59f', accent: '#1f5a5e',
    ramp: ['#83b7ba', '#6ca2a5', '#558d90', '#3e787b', '#266467', '#065154'],
    teal: '#009aa1', brick: '#b1573a',
  };

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // cubic in-out, no overshoot
  const seg = (t, a, b) => ease(clamp((t - a) / (b - a)));                          // eased progress inside [a, b]
  const hash = (i, seed = 0) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };

  function hexToRgb(h) {
    if (h[0] !== '#') return h.match(/\d+/g).slice(0, 3).map(Number);   // 'rgb(r,g,b)'
    const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))).join(',') + ')';
  }
  // Smooth path through points (Catmull-Rom -> cubic Bezier).
  function smoothPath(pts) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  // Text helper; `cls` maps to the .t-* styles in style.css.
  function text(parent, x, y, str, cls, anchor = 'start') {
    const t = el('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
    t.textContent = str;
    return t;
  }

  const specs = {};
  function register(name, spec) { specs[name] = spec; }

  function mount(fig) {
    const spec = specs[fig.dataset.viz];
    if (!spec) return;
    const holder = fig.querySelector('.viz-canvas');
    const btn = fig.querySelector('.viz-toggle');
    const svg = el('svg', { role: 'img', 'aria-label': spec.alt, focusable: 'false' }, holder);

    let api = null, W = 0, clock = 0, t0 = null, raf = 0, running = false, inView = false, userPaused = false;


    function draw() {
      if (!api) return;
      if (reduce.matches || forceStill) { api.still(); return; }
      if (frozenT !== null) { api.render(frozenT, 0); return; }
      api.render((clock % spec.duration) / spec.duration, Math.floor(clock / spec.duration));
    }
    function build() {
      const w = Math.round(holder.clientWidth);
      if (!w || Math.abs(w - W) < 2) return;
      W = w;
      svg.replaceChildren();
      api = spec.build(svg, W);
      svg.setAttribute('viewBox', `0 0 ${W} ${api.H}`);
      svg.setAttribute('width', W);
      svg.setAttribute('height', api.H);
      draw();
    }
    function tick(now) {
      if (t0 === null) t0 = now - clock;
      clock = now - t0;
      draw();
      raf = requestAnimationFrame(tick);
    }
    function update() {
      const should = inView && !userPaused && !reduce.matches && !forceStill && frozenT === null && !document.hidden;
      if (should && !running) { running = true; t0 = null; raf = requestAnimationFrame(tick); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
      if (btn) {
        btn.hidden = reduce.matches;
        btn.textContent = userPaused ? 'play' : 'pause';
        btn.setAttribute('aria-pressed', String(userPaused));
      }
      if (reduce.matches) draw();
    }

    new ResizeObserver(build).observe(holder);
    new IntersectionObserver((es) => { inView = es[0].isIntersecting; update(); }, { threshold: 0.15 }).observe(fig);
    document.addEventListener('visibilitychange', update);
    reduce.addEventListener('change', update);
    if (btn) btn.addEventListener('click', () => { userPaused = !userPaused; update(); });
    build();
    update();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('figure[data-viz]').forEach(mount);
  });

  const isStill = () => reduce.matches || forceStill;

  return { C, el, clamp, lerp, ease, seg, hash, mix, smoothPath, text, register, isStill };
})();
