/* Economic Connectedness and Premature Adult Mortality Across U.S. Areas.
   Map: Economic Connectedness quintile for each of 972 U.S. analytic areas (map data in
   geo-ec-areas.js). Chart: adjusted difference in all-cause mortality, adults 25–44, per
   +0.1 EC, female and male, PRE / ACUTE / LATER. F and M hold drawing positions only
   ([estimate, interval low, interval high] as heights from 0 at the zero line to 200 at −17%);
   LABEL holds the four values printed on the chart. */
(function () {
  const { C, el, seg, mix, text } = VIZ;
  const PERIODS = [['PRE', '2017–19'], ['ACUTE', '2020–21'], ['LATER', '2022–24']];
  const DATA = {
    all: {
      unit: '% difference in mortality per +0.1 EC',
      ticks: [0, -5, -10, -15], min: -17, Q: 200,
      F: [[121, 141, 101], [164, 184, 144], [127, 144, 109]],
      M: [[120, 138, 102], [156, 173, 137], [142, 158, 126]],
      LABEL: { F: { acute: '−14.0%', later: '−10.8%' }, M: { acute: '−13.2%', later: '−12.1%' } },
      highlight: 1,
    },
  };
  const QCOL = ['#dcebea', C.ramp[0], C.ramp[2], C.ramp[4], '#0b3e41'];
  const SEX = [{ k: 'F', name: 'Female', color: C.teal, dx: -7 }, { k: 'M', name: 'Male', color: C.ink, dx: 7 }];

  VIZ.register('economic-connectedness', {
    duration: 12000,
    alt: 'Map of economic connectedness across 972 U.S. analytic areas, highest across the northern Plains, Upper Midwest, and parts of the Mountain West and New England and lowest across much of the South, followed by estimates for adults aged 25 to 44: a 0.1 higher EC was associated with lower all-cause mortality in every period for both sexes, strongest in 2020–21 (14.0% lower for women, 13.2% for men).',

    build(svg, W) {
      const geo = window.VIZ_GEO.ecAreas, states = window.VIZ_GEO.us;
      const d = DATA.all;
      const compact = W < 640, still = VIZ.isStill();
      const Wm = Math.min(W, 760), ox = (W - Wm) / 2, k = Wm / geo.w, mapTop = 34, mapH = geo.h * k;
      const chartW = Math.min(W, 620), cx0 = (W - chartW) / 2, chartH = compact ? 250 : 290;
      const chartTop = still ? mapTop + mapH + 56 : mapTop + Math.max(6, (mapH - chartH) / 2);
      const H = still ? chartTop + chartH + 40 : mapTop + Math.max(mapH + 30, chartH + 40);

      const stage = text(svg, 0, 13, '', 't-lab');

      // ---- map
      const mapG = el('g', {}, svg);
      const base = el('g', { transform: `translate(${ox},${mapTop}) scale(${k})` }, mapG);
      states.areas.forEach((a) => el('path', { d: a.d, fill: '#ece9e3' }, base));
      const areaG = el('g', { transform: `translate(${ox},${mapTop}) scale(${k})` }, mapG);
      const areas = geo.areas.map((a) => el('path', { d: a.d, fill: QCOL[a.q], stroke: QCOL[a.q], 'stroke-width': 0.4, 'vector-effect': 'non-scaling-stroke', opacity: 0 }, areaG));
      const lines = el('g', { transform: `translate(${ox},${mapTop}) scale(${k})` }, mapG);
      states.areas.forEach((a) => el('path', { d: a.d, fill: 'none', stroke: C.bg, 'stroke-width': 0.9, 'vector-effect': 'non-scaling-stroke' }, lines));
      const legend = el('g', { transform: `translate(${ox},${mapTop + mapH + 22})` }, mapG);
      const bounds = [geo.range[0], ...geo.cuts, geo.range[1]];
      let lx = 0;
      if (!compact) { lx = text(legend, 0, 0, 'EC quintile', 't-muted').getComputedTextLength() + 12; }
      QCOL.forEach((c, i) => {
        el('rect', { x: lx, y: -9, width: 10, height: 10, rx: 2, fill: c }, legend);
        const t = text(legend, lx + 14, 0, compact ? (i === 0 ? 'lower' : i === 4 ? 'higher' : '') : `${bounds[i].toFixed(2)}–${bounds[i + 1].toFixed(2)}`, 't-muted');
        lx += 14 + (t.getComputedTextLength() || 0) + (compact ? 6 : 12);
      });

      // ---- estimates chart
      const chart = el('g', {}, svg);
      const L = cx0 + (compact ? 34 : 44), R = cx0 + chartW - (compact ? 64 : 78), T = chartTop + 34, B = chartTop + chartH - 40;
      const Y = (v) => T + (v / d.min) * (B - T);       // axis ticks
      const P = (q) => T + (q / d.Q) * (B - T);         // drawing positions
      const PX = (i) => L + ((i + 0.5) / 3) * (R - L);
      text(chart, L, chartTop + 14, d.unit, 't-muted');
      d.ticks.forEach((v) => {
        el('line', { x1: L, x2: R, y1: Y(v), y2: Y(v), stroke: v === 0 ? C.muted : C.rule, 'stroke-width': 1 }, chart);
        text(chart, L - 6, Y(v) + 4, v === 0 ? '0' : `−${Math.abs(v)}`, 't-muted', 'end');
      });
      const band = el('rect', { x: PX(1) - (R - L) / 6 + 6, width: (R - L) / 3 - 12, y: T - 6, height: B - T + 6, fill: '#f1efea' }, chart);
      chart.insertBefore(band, chart.firstChild.nextSibling);
      PERIODS.forEach(([p, yrs], i) => {
        text(chart, PX(i), B + 18, p, 't-period', 'middle');
        text(chart, PX(i), B + 32, yrs, 't-muted', 'middle');
      });
      const series = SEX.map((s) => {
        const pts = d[s.k].map(([est], i) => [PX(i) + s.dx, P(est)]);
        const path = el('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: s.color, 'stroke-width': 1, opacity: 0.5 }, chart);
        const marks = d[s.k].map(([est, lo, hi], i) => {
          const g = el('g', {}, chart);
          el('line', { x1: PX(i) + s.dx, x2: PX(i) + s.dx, y1: P(lo), y2: P(hi), stroke: s.color, 'stroke-width': 1.5 }, g);
          if (s.k === 'F') el('circle', { cx: PX(i) + s.dx, cy: P(est), r: 4.5, fill: s.color, stroke: C.bg, 'stroke-width': 2 }, g);
          else el('rect', { x: PX(i) + s.dx - 4, y: P(est) - 4, width: 8, height: 8, fill: s.color, stroke: C.bg, 'stroke-width': 2 }, g);
          return g;
        });
        const endY = P(d[s.k][2][0]);
        const lab = text(chart, PX(2) + 7 + 12, endY + 4, compact ? s.name : `${s.name} ${d.LABEL[s.k].later}`, 't-muted');
        return { path, marks, lab };
      });
      // keep end labels apart
      const [lf, lm] = series.map((s) => s.lab);
      const dy = parseFloat(lm.getAttribute('y')) - parseFloat(lf.getAttribute('y'));
      if (Math.abs(dy) < 14) { lf.setAttribute('y', parseFloat(lf.getAttribute('y')) - (14 - Math.abs(dy)) / 2 * Math.sign(dy || 1)); lm.setAttribute('y', parseFloat(lm.getAttribute('y')) + (14 - Math.abs(dy)) / 2 * Math.sign(dy || 1)); }
      const hl = el('g', {}, chart);
      if (d.highlight != null) {
        SEX.forEach((s) => {
          const [, lo] = d[s.k][d.highlight];
          text(hl, PX(d.highlight) + s.dx + (s.k === 'F' ? -10 : 10), P(lo) + 16, d.LABEL[s.k].acute, 't-muted', s.k === 'F' ? 'end' : 'start');
        });
      }

      function draw(t, isStill) {
        const show = (a, b) => (isStill ? 1 : seg(t, a, b));
        const reset = isStill ? 0 : seg(t, 0.95, 1);
        areas.forEach((p, i) => p.setAttribute('opacity', (isStill ? 1 : seg(t, 0.06 + geo.areas[i].q * 0.045, 0.1 + geo.areas[i].q * 0.045)) * (1 - reset)));
        const toChart = isStill ? 0 : seg(t, 0.4, 0.47) * (1 - seg(t, 0.85, 0.9));
        mapG.setAttribute('opacity', isStill ? 1 : 1 - toChart);
        legend.setAttribute('opacity', isStill ? 1 : seg(t, 0.24, 0.3) * (1 - reset));
        chart.setAttribute('opacity', isStill ? 1 : toChart);
        series.forEach(({ path, marks, lab }) => {
          marks.forEach((m, i) => m.setAttribute('opacity', show(0.47 + i * 0.05, 0.5 + i * 0.05)));
          path.setAttribute('opacity', 0.5 * show(0.6, 0.64));
          lab.setAttribute('opacity', show(0.6, 0.64));
        });
        const h = d.highlight != null ? show(0.65, 0.7) : 0;
        band.setAttribute('opacity', h);
        hl.setAttribute('opacity', h);
        stage.textContent = isStill || toChart < 0.5
          ? 'Economic connectedness, 972 analytic areas'
          : 'All-cause mortality, ages 25–44';
      }

      return { H, render: (t) => draw(t, false), still: () => draw(1, true) };
    },
  });
})();
