/* Early-life Mortality and the Widening U.S.–Peer Longevity Gap.
   U.S. / peer death-rate ratio by age, female and male, 1980, 2019, 2021, 2023, on a log
   axis. CURVE holds drawing positions only: each value is a curve's height on the plot,
   from 0 (bottom of the axis) to 200 (top). Each year grows out of the previous one. */
(function () {
  const { C, el, seg, lerp, text } = VIZ;
  const AGES = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  const CURVE = {"female":{"1980":[41,21,26,26,55,56,55,49,51,56,57,59,57,54,44,31,17,13,10,11,10,15],"2019":[112,95,107,83,93,120,151,148,141,121,110,102,101,91,79,76,70,57,44,36,30,28],"2021":[111,112,93,98,123,155,178,184,172,159,145,133,126,118,102,93,85,69,51,41,33,20],"2023":[108,102,92,96,104,123,149,156,144,136,116,107,103,99,85,76,69,60,44,31,26,15]},"male":{"1980":[41,32,15,43,65,77,77,70,58,52,49,48,46,41,37,30,21,20,19,17,18,20],"2019":[112,96,93,108,118,139,159,154,142,125,107,98,92,81,67,58,53,44,33,32,29,29],"2021":[109,113,106,120,150,170,189,191,179,164,143,128,117,104,87,74,69,58,41,36,29,19],"2023":[105,113,94,113,142,151,164,170,156,141,120,103,95,86,72,60,52,46,33,22,18,10]}};
  const YEARS = ['1980', '2019', '2021', '2023'];
  const STROKE = { '1980': C.neutral, '2019': C.teal, '2021': C.brick, '2023': C.ink };
  const WIDTH = { '1980': 1.75, '2019': 1.75, '2021': 2, '2023': 2 };
  // [start, end] of each year's entrance; 1980 draws on, later years grow from the previous year.
  const ENTER = [[0.04, 0.16], [0.2, 0.32], [0.38, 0.5], [0.56, 0.68]];
  const YMIN = 0.72, YMAX = 4.1, TICKS = [0.75, 1, 1.5, 2, 3, 4], Q = 200;

  VIZ.register('early-life-mortality', {
    duration: 11000,
    alt: 'Two line charts, female and male, of the ratio of U.S. to peer-country death rates by age in 1980, 2019, 2021, and 2023, on a log scale. In 1980 young-adult ratios were modestly above 1; by 2019 they were roughly two to almost three times peer levels; in 2021 they peaked at about 3.5 for women and 3.8 for men around age 30; in 2023 they fell back but stayed above 2019 at most young-adult ages.',

    build(svg, W) {
      const compact = W < 640;
      const gap = compact ? 0 : 36, left = 34, panelW = compact ? W : (W - gap) / 2;
      const legendH = 26, plotH = compact ? 190 : 230, panelH = plotH + 52;
      const H = legendH + (compact ? 2 * panelH + 10 : panelH);

      // Legend (four series) with the reference-line meaning.
      const legend = el('g', { transform: `translate(0,12)` }, svg);
      let lx = 0;
      YEARS.forEach((y) => {
        el('line', { x1: lx, x2: lx + 16, y1: -4, y2: -4, stroke: STROKE[y], 'stroke-width': WIDTH[y] + 0.5 }, legend);
        const t = text(legend, lx + 21, 0, y, 't-muted');
        lx += 21 + t.getComputedTextLength() + 16;
      });

      const panels = ['female', 'male'].map((sex, p) => {
        const ox = compact ? 0 : p * (panelW + gap), oy = legendH + (compact ? p * (panelH + 10) : 0);
        const g = el('g', { transform: `translate(${ox},${oy})` }, svg);
        const x0 = left, x1 = panelW - 4, top = 26, bottom = top + plotH;
        const X = (a) => x0 + (a / 100) * (x1 - x0);
        const Y = (v) => bottom - ((Math.log(v) - Math.log(YMIN)) / (Math.log(YMAX) - Math.log(YMIN))) * (bottom - top);

        text(g, 0, 12, sex === 'female' ? 'Female' : 'Male', 't-lab');
        TICKS.forEach((v) => {
          el('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: v === 1 ? C.muted : C.rule, 'stroke-width': 1 }, g);
          text(g, x0 - 6, Y(v) + 4, String(v), 't-muted', 'end');
        });
        text(g, X(50), Y(1) + 15, 'U.S. = peers', 't-muted', 'middle');
        [0, 20, 40, 60, 80, 100].forEach((a) => text(g, X(a), bottom + 17, String(a), 't-muted', 'middle'));
        text(g, x1, bottom + 34, 'age', 't-muted', 'end');

        const lines = YEARS.map((y) => el('polyline', {
          fill: 'none', stroke: STROKE[y], 'stroke-width': WIDTH[y], 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        }, g));
        const P = (q) => bottom - (q / Q) * (bottom - top);
        const pts = (qs) => qs.map((q, i) => `${X(AGES[i]).toFixed(1)},${P(q).toFixed(1)}`).join(' ');
        return { sex, lines, pts, X };
      });

      // Draw-on helper for 1980: reveal points up to a fraction of the age range.
      function partial(vals, f) {
        const n = Math.max(1, Math.floor(f * (vals.length - 1)));
        return vals.slice(0, n + 1);
      }

      function draw(t, still) {
        const fade = still ? 0 : seg(t, 0.93, 0.99);
        panels.forEach(({ sex, lines, pts }) => {
          YEARS.forEach((y, j) => {
            const [a, b] = ENTER[j];
            const p = still ? 1 : seg(t, a, b);
            const line = lines[j];
            if (p <= 0) { line.setAttribute('points', ''); return; }
            let vals;
            if (j === 0) vals = partial(CURVE[sex][y], p);
            else vals = CURVE[sex][YEARS[j - 1]].map((q, i) => lerp(q, CURVE[sex][y][i], p));
            line.setAttribute('points', pts(vals));
            line.setAttribute('opacity', 1 - fade);
          });
        });
      }

      return { H, render: (t) => draw(t, false), still: () => draw(1, true) };
    },
  });
})();
