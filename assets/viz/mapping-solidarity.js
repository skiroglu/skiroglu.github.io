/* Mapping Solidarity: Organizational Density of Hometown Associations in Istanbul.
   Provinces are shaded by hometown-association density among migrants from each province
   (shading levels in geo-turkey.js). Sequence: quiet outline -> density revealed from lowest
   to highest -> markers for the five highest-density provinces -> outer contour of their
   combined area (an editorial emphasis, not an official region). Istanbul, the destination,
   is a small reference point. */
(function () {
  const { C, el, seg, mix, text } = VIZ;
  const ZONE = ['Tokat', 'Sivas', 'Erzincan', 'Gümüşhane', 'Bayburt'];
  const STOPS = ['#e2ecea', C.ramp[0], C.ramp[2], C.ramp[4], C.ramp[5]];
  const DEST = '#e4e1da';
  // Label offsets (dx, dy, anchor) chosen to keep the five names clear of each other.
  const LABEL = {
    Tokat: [-8, -8, 'end'], Sivas: [-8, 16, 'end'], Erzincan: [0, 20, 'middle'],
    'Gümüşhane': [-6, -10, 'end'], Bayburt: [8, -8, 'start'],
  };
  const LABEL_COMPACT = {
    Tokat: [-6, -4, 'end'], Sivas: [-6, 12, 'end'], Erzincan: [0, 15, 'middle'],
    'Gümüşhane': [0, -8, 'middle'], Bayburt: [6, 12, 'start'],
  };

  function shade(t) {
    const x = Math.max(0, Math.min(1, t)) * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(x));
    return mix(STOPS[i], STOPS[i + 1], x - i);
  }

  VIZ.register('mapping-solidarity', {
    duration: 10000,
    alt: 'Map of Turkey shaded by the number of hometown associations in Istanbul per 10,000 migrants from each province. The five highest, Bayburt, Gümüşhane, Erzincan, Sivas, and Tokat, are marked and outlined together as one contiguous area.',

    build(svg, W) {
      const geo = window.VIZ_GEO.turkey;
      const compact = W < 560;
      const head = 8, k = W / geo.w, mapH = geo.h * k, legendY = head + mapH + 22;
      const H = legendY + 10;
      const P = ([x, y]) => [x * k, head + y * k];

      const map = el('g', { transform: `translate(0,${head}) scale(${k})` }, svg);
      const colors = geo.areas.map((a) => (a.s == null ? DEST : shade(a.s)));
      const areas = geo.areas.map((a) =>
        el('path', { d: a.d, fill: C.base, stroke: C.bg, 'stroke-width': 0.7, 'vector-effect': 'non-scaling-stroke' }, map));
      // reveal order: lowest to highest density
      const order = geo.areas.map((a, i) => [a.s ?? -1, i]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
      const revealAt = []; order.forEach((i, r) => { revealAt[i] = r / (order.length - 1); });

      // Outer contour of the five-province union.
      const zoneG = el('g', { transform: `translate(0,${head}) scale(${k})` }, svg);
      // Stroke scales with the group (no non-scaling-stroke) so dash lengths and path
      // length are in the same units; 1.5 / k keeps it 1.5px on screen.
      const zone = el('path', { d: geo.zone, fill: 'none', stroke: C.ink, 'stroke-width': 1.5 / k, 'stroke-linejoin': 'round', opacity: 0 }, zoneG);
      const zLen = Math.ceil(zone.getTotalLength()) + 2;
      zone.setAttribute('stroke-dasharray', `${zLen} ${zLen}`);
      zone.setAttribute('stroke-dashoffset', zLen);

      // Markers and names for the five provinces.
      const marks = ZONE.map((name) => {
        const [x, y] = P(geo.markers[name]);
        const g = el('g', {}, svg);
        el('circle', { cx: x, cy: y, r: compact ? 2.5 : 3.25, fill: C.ink, stroke: C.bg, 'stroke-width': 1.5 }, g);
        const [dx, dy, anchor] = (compact ? LABEL_COMPACT : LABEL)[name];
        text(g, x + dx, y + dy, name, (compact ? 't-muted' : 't-lab') + ' t-halo', anchor);
        return g;
      });

      // Istanbul: small destination reference.
      const ist = geo.areas.find((a) => a.s == null);
      const [ix, iy] = P(ist.c);
      const istG = el('g', {}, svg);
      el('circle', { cx: ix, cy: iy, r: 2, fill: C.muted }, istG);
      text(istG, ix + 5, iy - 5, 'Istanbul', 't-muted t-halo');

      // Legend
      const legend = el('g', { transform: `translate(0,${legendY})` }, svg);
      const sw = compact ? 18 : 24;
      text(legend, 0, 0, 'fewer', 't-muted');
      [0, 0.25, 0.5, 0.75, 1].forEach((t, i) => el('rect', { x: 36 + i * (sw + 2), y: -9, width: sw, height: 10, rx: 2, fill: shade(t) }, legend));
      text(legend, 36 + 5 * (sw + 2) + 4, 0, compact ? 'more' : 'more hometown associations per 10,000 migrants', 't-muted');

      function draw(t, still) {
        const fade = still ? 0 : seg(t, 0.93, 0.99);
        areas.forEach((p, i) => {
          const on = still ? 1 : seg(t, 0.06 + revealAt[i] * 0.26, 0.1 + revealAt[i] * 0.26);
          p.setAttribute('fill', mix(C.base, colors[i], on * (1 - fade)));
        });
        marks.forEach((g, i) => g.setAttribute('opacity', (still ? 1 : seg(t, 0.42 + i * 0.05, 0.46 + i * 0.05)) * (1 - fade)));
        // contour starts only after the last label (Bayburt) is fully visible at t = 0.66
        const z = still ? 1 : seg(t, 0.7, 0.86);
        zone.setAttribute('stroke-dashoffset', (zLen * (1 - z)).toFixed(1));
        zone.setAttribute('opacity', z > 0 ? 1 - fade : 0);
        legend.setAttribute('opacity', (still ? 1 : seg(t, 0.3, 0.36)) * (1 - fade));
        istG.setAttribute('opacity', 0.9 * (1 - fade));
      }

      return { H, render: (t) => draw(t, false), still: () => draw(1, true) };
    },
  });
})();
