/* The Effects of Immigration and Domestic Migration on U.S. State Life Expectancy Trends.
   Predicted change in female and male state life expectancy in five periods, 1990–2019, as
   population change from immigration or domestic migration rises (low to high, left to right
   within each period). CURVE holds drawing positions only: each value is a point's height on
   the panel, from 0 (−0.75 years) to 200 (+3.25 years). */
(function () {
  const { C, el, seg, text } = VIZ;
  const PERIODS = ['1990–2000', '2000–05', '2005–10', '2010–15', '2015–19'];
  const CURVE = {"M":{"imm":[[110,115,120,125,130,135,141,146,151,156,161,166,172,177,182,187,192],[30,35,40,45,51,56,61,66,71,77,82,87,92,97,103,108,113],[58,64,69,74,79,84,89,94,99,104,110,115,120,125,130,135,140],[7,12,17,23,28,33,38,44,49,54,59,65,70,75,80,86,91],[9,14,19,25,30,35,40,46,51,56,62,67,72,77,83,88,93]],"dm":[[166,161,157,152,149,146,143,141,139,138,137,137,137,138,139,141,143],[86,81,76,72,68,65,62,60,59,57,57,57,57,58,59,61,63],[115,109,104,100,96,93,90,88,87,86,86,86,87,89,91,94,97],[38,37,36,36,37,38,39,42,45,48,52,57,62,68,74,81,89],[35,35,35,36,37,39,41,44,47,51,55,60,65,71,77,84,91]]},"F":{"imm":[[35,40,45,50,55,60,65,70,75,80,84,89,94,99,104,109,114],[33,37,42,47,52,57,62,67,72,77,81,86,91,96,101,106,111],[46,50,55,60,65,70,75,79,84,89,94,99,104,109,113,118,123],[7,12,17,22,26,31,36,41,46,51,56,61,66,70,75,80,85],[18,23,28,33,38,43,48,52,57,62,67,72,77,82,87,92,97]],"dm":[[79,76,74,71,69,67,66,65,64,63,63,63,63,63,64,65,67],[77,74,71,68,66,64,62,61,60,59,59,59,59,59,60,62,63],[93,89,86,82,80,77,75,74,72,72,71,71,72,72,73,75,77],[38,38,38,38,39,40,41,43,45,47,50,53,57,60,64,69,74],[49,49,49,50,50,51,53,55,57,59,62,65,68,72,76,81,85]]}};
  const COMP = [
    { k: 'imm', name: 'Immigration', color: C.teal },
    { k: 'dm', name: 'Domestic migration', color: C.brick },
  ];
  const YMIN = -0.75, YMAX = 3.25, TICKS = [0, 1, 2, 3], Q = 200;

  VIZ.register('migration-life-expectancy', {
    duration: 11000,
    alt: 'Model-predicted change in state male and female life expectancy across five periods from 1990 to 2019, for a range of population change from immigration and from domestic migration. In every period, higher immigration goes with larger life-expectancy gains, at a similar slope. For domestic migration the relationship is flat to slightly U-shaped in 1990–2010 and becomes steeply positive in 2010–2015 and 2015–2019, for both men and women.',

    build(svg, W) {
      const compact = W < 640;
      const gap = compact ? 0 : 40, panelW = compact ? W : (W - gap) / 2;
      const left = 26, rowH = compact ? 112 : 128, rowGap = 50, head = 48;
      const keyH = compact ? 76 : 38;
      const panelH = head + 2 * (rowH + 22) + rowGap - 22 + 8;
      const H = keyH + (compact ? 2 * panelH + 18 : panelH);

      // shared key
      const key = el('g', { transform: 'translate(0,12)' }, svg);
      let kx = 0;
      COMP.forEach((c, i) => {
        const ky = compact ? i * 16 : 0;
        if (compact) kx = 0;
        el('line', { x1: kx, x2: kx + 16, y1: ky - 4, y2: ky - 4, stroke: c.color, 'stroke-width': 2 }, key);
        const t = text(key, kx + 21, ky, c.name, 't-muted');
        kx += 21 + t.getComputedTextLength() + 18;
      });

      const curves = [], frames = [];
      ['F', 'M'].forEach((sex, p) => {
        const ox = compact ? 0 : p * (panelW + gap), oy = keyH + (compact ? p * (panelH + 18) : 0);
        const g = el('g', { transform: `translate(${ox},${oy})` }, svg);
        frames.push(g);
        text(g, 0, 16, sex === 'M' ? 'Male' : 'Female', 't-lab');
        const cellW = (panelW - left) / PERIODS.length;
        PERIODS.forEach((per, j) => text(g, left + cellW * (j + 0.5), 36, cellW < 75 ? per.replace('1990–2000', '1990–00') : per, 't-muted', 'middle'));

        COMP.forEach((c, r) => {
          const top = head + 22 + r * (rowH + rowGap), bottom = top + rowH;
          const Y = (v) => bottom - ((v - YMIN) / (YMAX - YMIN)) * rowH;
          text(g, 0, top - 12, c.name, 't-lab');
          TICKS.forEach((v) => {
            el('line', { x1: left, x2: panelW, y1: Y(v), y2: Y(v), stroke: v === 0 ? C.muted : C.rule, 'stroke-width': 1 }, g);
            text(g, left - 6, Y(v) + 4, v === 0 ? '0' : `+${v}`, 't-muted', 'end');
          });
          PERIODS.forEach((_, j) => {
            const x0 = left + cellW * j + cellW * 0.16, x1 = left + cellW * (j + 1) - cellW * 0.16;
            const qs = CURVE[sex][c.k][j], n = qs.length - 1;
            const pts = qs.map((q, i) => [x0 + ((x1 - x0) * i) / n, bottom - (q / Q) * rowH]);
            const d = 'M' + pts.map((q) => q.map((v) => v.toFixed(1)).join(',')).join('L');
            const path = el('path', { d, fill: 'none', stroke: c.color, 'stroke-width': 2.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
            const len = path.getTotalLength();
            path.setAttribute('stroke-dasharray', len);
            const ends = [pts[0], pts[n]].map((q) => el('circle', { cx: q[0], cy: q[1], r: 2.75, fill: c.color, stroke: C.bg, 'stroke-width': 1.5 }, g));
            curves.push({ path, len, ends, comp: c.k, period: j });
          });
        });
      });

      function draw(t, still) {
        const fade = still ? 0 : seg(t, 0.93, 0.99);
        frames.forEach((f) => f.setAttribute('opacity', still ? 1 : seg(t, 0, 0.06) * (1 - fade)));
        key.setAttribute('opacity', still ? 1 : seg(t, 0, 0.06) * (1 - fade));
        curves.forEach(({ path, len, ends, comp, period }) => {
          let a, b;
          if (comp === 'imm') { a = 0.1 + period * 0.035; b = a + 0.1; }
          else if (period < 3) { a = 0.36 + period * 0.035; b = a + 0.1; }
          else { a = 0.58 + (period - 3) * 0.05; b = a + 0.12; }
          const p = still ? 1 : seg(t, a, b);
          path.setAttribute('stroke-dashoffset', (len * (1 - p)).toFixed(1));
          ends[0].setAttribute('opacity', p > 0 ? 1 : 0);
          ends[1].setAttribute('opacity', p >= 0.98 ? 1 : 0);
        });
      }

      return { H, render: (t) => draw(t, false), still: () => draw(1, true) };
    },
  });
})();
