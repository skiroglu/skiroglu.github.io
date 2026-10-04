/* Rural Notables, Professionals, and Ideologues: The Social Bases of AKP Local Power.
   Animated interpretation of Table 1 (Kiroglu & Koytak 2026): 684 AKP district
   council members (one dot each) -> seven K-modes clusters at their exact sizes ->
   theoretical grouping under three archetypes. The second step is interpretive:
   clusters keep their own shape and are bracketed, not merged.
   Grouping follows the article's archetype definitions; cluster 6 (HTA +
   professional) sits between Rural Notables and Professionals without a bracket,
   and cluster 1 (no coded affiliation) is muted. No edges: this is classification, not network data. */
(function () {
  const { C, el, seg, lerp, hash, mix, text } = VIZ;

  const CLUSTERS = [
    { id: 1, n: 366, label: 'No coded affiliation', short: 'None', kind: 'none' },
    { id: 2, n: 57, label: 'Islamist', short: 'Islamist', kind: 'other' },
    { id: 3, n: 83, label: 'Hometown (HTA)', short: 'HTA', kind: 'hta' },
    { id: 4, n: 24, label: 'Professional', short: 'Prof.', kind: 'other' },
    { id: 5, n: 61, label: 'Educational', short: 'Educ.', kind: 'other' },
    { id: 6, n: 40, label: 'HTA + professional', short: 'HTA + Prof.', kind: 'hta' },
    { id: 7, n: 53, label: 'HTA + local + sports', short: 'HTA + Local + Sports', kind: 'hta' },
  ];
  const N = CLUSTERS.reduce((s, c) => s + c.n, 0); // 684
  // Order of clusters in the archetype view, and the brackets drawn over them.
  const ARCH_ORDER = [1, 3, 7, 6, 4, 2, 5];
  const ARCHETYPES = [
    { name: 'Rural Notables', members: [3, 7] },
    { name: 'Professionals', members: [4] },
    { name: 'Ideological Cadres', members: [2, 5] },
  ];
  const FILL = { hta: C.accent, other: C.ramp[0], none: '#c9c6bf' };

  const sunflower = (i, c) => { const a = i * 2.39996, r = c * Math.sqrt(i + 0.5); return [Math.cos(a) * r, Math.sin(a) * r]; };

  VIZ.register('rural-notables', {
    duration: 11000,
    alt: 'Animation of 684 AKP district council members in Istanbul forming seven clusters of civil-society affiliation: 366 with no coded affiliation, 57 Islamist, 83 hometown associations, 24 professional, 61 educational, 40 hometown plus professional, and 53 hometown plus local and sports organizations. The clusters are then grouped under three archetypes: rural notables, professionals, and ideological cadres.',

    build(svg, W) {
      const compact = W < 640;
      const r = compact ? 1.45 : 2.3, c = compact ? 1.95 : 3.0;
      const rad = (n) => c * Math.sqrt(n) + r + 2;
      const stage = text(svg, 0, 13, '', 't-stage');

      // ---- seven-cluster layout (Table 1 order); two rows on narrow screens
      const rowsDef = compact ? [[1], [2, 3, 4, 5, 6, 7]] : [[1, 2, 3, 4, 5, 6, 7]];
      const labelW = compact ? 0 : 104;
      let y = 34;
      const P7 = {}, rowBottoms = [];
      rowsDef.forEach((ids) => {
        const ws = ids.map((id) => Math.max(2 * rad(CLUSTERS[id - 1].n), compact ? W / ids.length - 6 : labelW));
        const total = ws.reduce((a, b) => a + b, 0), gap = (W - total) / (ids.length + 1);
        const maxR = Math.max(...ids.map((id) => rad(CLUSTERS[id - 1].n)));
        let x = gap;
        ids.forEach((id, j) => { P7[id] = [x + ws[j] / 2, y + maxR]; x += ws[j] + gap; });
        y += 2 * maxR + (compact ? 44 : 50);
        rowBottoms.push(y);
      });
      const H7 = y;

      // ---- archetype layout: one row (desktop) / cluster 1 on top (compact)
      const PA = {};
      const archTop = 34;
      if (compact) {
        PA[1] = [W / 2, archTop + rad(366)];
        const yy = archTop + 2 * rad(366) + 70;
        const rest = ARCH_ORDER.slice(1), slot = W / rest.length;
        rest.forEach((id, j) => { PA[id] = [slot * (j + 0.5), yy + rad(83)]; });
      } else {
        const ws = ARCH_ORDER.map((id) => 2 * rad(CLUSTERS[id - 1].n) + 10);
        const extra = [0, 40, 0, 18, 18, 40, 0]; // wider spacing between archetypes
        const total = ws.reduce((a, b) => a + b, 0) + extra.reduce((a, b) => a + b, 0);
        let x = (W - total) / 2;
        const cy = archTop + rad(366) + 18;
        ARCH_ORDER.forEach((id, j) => { x += extra[j]; PA[id] = [x + ws[j] / 2, cy]; x += ws[j]; });
      }

      const H = Math.max(H7, compact ? archTop + 2 * rad(366) + 70 + 2 * rad(83) + 70 : archTop + 2 * rad(366) + 92) + 26;

      // ---- dots: neutral field -> cluster positions
      const cols = Math.round(Math.sqrt(N * (W / (H - 60)))), rows = Math.ceil(N / cols);
      const cw = W / cols, ch = (H - 70) / rows;
      const dots = [], A = [], B = [], Cc = [], meta = [];
      let k = 0;
      CLUSTERS.forEach((cl) => {
        for (let i = 0; i < cl.n; i++, k++) {
          const [dx, dy] = sunflower(i, c);
          A.push([(k % cols + 0.5 + (hash(k, 1) - 0.5) * 0.6) * cw, 30 + (Math.floor(k / cols) + 0.5 + (hash(k, 2) - 0.5) * 0.6) * ch]);
          B.push([P7[cl.id][0] + dx, P7[cl.id][1] + dy]);
          Cc.push([PA[cl.id][0] + dx, PA[cl.id][1] + dy]);
          meta.push(cl);
        }
      });
      // shuffle draw order of the neutral field so clusters do not pre-group visually
      const order = A.map((_, i) => i).sort((a, b) => hash(a, 7) - hash(b, 7));
      const shuffledA = order.map((i) => A[i]);
      for (let i = 0; i < N; i++) A[i] = shuffledA[i];
      for (let i = 0; i < N; i++) dots.push(el('circle', { cx: A[i][0], cy: A[i][1], r, fill: C.neutral }, svg));

      // ---- cluster labels (seven-cluster view)
      const l7 = el('g', {}, svg);
      CLUSTERS.forEach((cl) => {
        const [x, yy] = P7[cl.id], rr = rad(cl.n);
        text(l7, x, yy + rr + 16, `${cl.id} · ${cl.n}`, 't-muted', 'middle');
        const name = compact ? cl.short : cl.label;
        const t = text(l7, x, yy + rr + 31, '', compact ? 't-muted' : 't-lab', 'middle');
        name.split(' + ').forEach((w, n) => { const s = el('tspan', { x, dy: n ? 13 : 0 }, t); s.textContent = (n ? '+ ' : '') + w; });
      });

      // ---- archetype brackets and labels (theoretical step)
      const lA = el('g', {}, svg);
      const baseY = Math.max(...Object.entries(PA).filter(([id]) => +id !== 1).map(([id, p]) => p[1] + rad(CLUSTERS[id - 1].n)));
      ARCHETYPES.forEach((a) => {
        const xs = a.members.map((id) => [PA[id][0] - rad(CLUSTERS[id - 1].n), PA[id][0] + rad(CLUSTERS[id - 1].n)]);
        const x0 = Math.min(...xs.map((p) => p[0])), x1 = Math.max(...xs.map((p) => p[1]));
        const by = baseY + 12;
        el('path', { d: `M${x0},${by - 5}V${by}H${x1}V${by - 5}`, fill: 'none', stroke: C.ink, 'stroke-width': 1 }, lA);
        const lab = text(lA, (x0 + x1) / 2, by + 18, '', compact ? 't-muted' : 't-lab', 'middle');
        (compact ? a.name.split(' ') : [a.name]).forEach((w, n) => { const s = el('tspan', { x: (x0 + x1) / 2, dy: n ? 14 : 0 }, lab); s.textContent = w; });
      });

      // ---- key
      const key = el('g', { transform: `translate(0,${H - 6})` }, svg);
      let kx = 0, ky = 0;
      [['hta', compact ? 'with HTA ties' : 'includes hometown-association ties'], ['other', 'other affiliation'], ['none', 'none coded']].forEach(([kind, lab]) => {
        const c0 = el('circle', { cx: kx + 4, cy: ky - 4, r: 4, fill: FILL[kind] }, key);
        const t = text(key, kx + 12, ky, lab, 't-muted');
        const w = 12 + t.getComputedTextLength() + 16;
        if (kx > 0 && kx + w > W) { kx = 0; ky += 16; c0.setAttribute('cx', 4); c0.setAttribute('cy', ky - 4); t.setAttribute('x', 12); t.setAttribute('y', ky); }
        kx += w;
      });

      function place(t, still) {
        const out = still ? 0 : seg(t, 0.92, 0.96), back = seg(t, 0.96, 1);
        const restart = t >= 0.96 && !still;
        for (let i = 0; i < N; i++) {
          const s = hash(i, 4) * 0.06;
          const toB = still ? 1 : seg(t, 0.1 + s, 0.3 + s);
          const toC = still ? 1 : seg(t, 0.56 + s * 0.5, 0.72 + s * 0.5);
          const x = restart ? A[i][0] : lerp(lerp(A[i][0], B[i][0], toB), Cc[i][0], toC);
          const y = restart ? A[i][1] : lerp(lerp(A[i][1], B[i][1], toB), Cc[i][1], toC);
          const d = dots[i];
          d.setAttribute('cx', x.toFixed(1));
          d.setAttribute('cy', y.toFixed(1));
          d.setAttribute('fill', restart ? C.neutral : mix(C.neutral, FILL[meta[i].kind], toB));
          d.setAttribute('opacity', restart ? back : (meta[i].id === 1 ? 1 - 0.45 * toC : 1) * (1 - out));
        }
        const s7 = still ? 0 : seg(t, 0.3, 0.36) * (1 - seg(t, 0.52, 0.56));
        const sA = still ? 1 : seg(t, 0.72, 0.78) * (1 - out);
        l7.setAttribute('opacity', s7);
        lA.setAttribute('opacity', sA);
        key.setAttribute('opacity', still ? 1 : seg(t, 0.28, 0.34) * (1 - out));
        stage.textContent = still ? '' : t < 0.12 ? '684 AKP district council members, Istanbul, 2019'
          : t < 0.54 ? 'seven K-modes clusters of civil-society affiliation' : 'three archetypes';
        stage.setAttribute('opacity', restart ? back : 1 - out);
      }

      return { H, render: (t) => place(t, false), still: () => place(1, true) };
    },
  });
})();
