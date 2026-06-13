/* Theme-agnostic PptxGenJS helper library for slide-quick.
   Ported from decks/native-build/build.js (2026-06-13).
   Every helper creates FRESH option objects per call — PptxGenJS mutates
   option objects in place, so sharing one corrupts the second shape. */
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const SW = 13.33, SH = 7.5, MX = 0.9;     // LAYOUT_WIDE inches
const CW = SW - 2 * MX;                    // content width
const ICON_DIR = path.join(__dirname, "..", "assets", "icons");

function createBuilder(P, T) {
  const F = T.fonts;

  function newSlide() {
    const s = P.addSlide();
    s.background = { color: T.bg };
    return s;
  }

  /* Soft glow image. No-op on themes with glows:false. name: cyan|magenta|teal */
  function glow(s, cx, cy, d, name) {
    if (!T.glows) return;
    s.addImage({
      path: path.join(T.assetDir, `glow-${name}.png`),
      x: cx - d / 2, y: cy - d / 2, w: d, h: d,
    });
  }

  function panel(s, x, y, w, h, opts = {}) {
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.09,
      fill: { color: opts.fill || T.panel },
      line: { color: opts.border || T.border, width: 1 },
    });
  }

  function node(s, x, y, w, h) {
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.07,
      fill: { color: T.node },
      line: { color: T.nodeBorder, width: 1.25 },
    });
  }

  /* Pill label above the title, with a small accent dot.
     opts.x overrides the left edge (default MX) — used by split() columns. */
  function kicker(s, text, y = 0.62, opts = {}) {
    const bx = opts.x != null ? opts.x : MX;
    const w = Math.min(8.6, 0.8 + text.length * 0.122);
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x: bx, y, w, h: 0.38, rectRadius: 0.19,
      fill: { color: T.kickerFill }, line: { color: T.border, width: 1 },
    });
    s.addShape(P.shapes.OVAL, {
      x: bx + 0.2, y: y + 0.155, w: 0.07, h: 0.07,
      fill: { color: T.accent },
    });
    s.addText(text.toUpperCase(), {
      x: bx + 0.36, y, w: w - 0.5, h: 0.38, valign: "middle", align: "left",
      fontFace: F.mono, fontSize: 10, color: T.muted, charSpacing: 1.5, margin: 0,
    });
  }

  /* Action title. runs = pptxgenjs rich-text array.
     opts.x / opts.w override the column (default MX / CW) — used by split(). */
  function title(s, runs, y = 1.15, size = 34, opts = {}) {
    s.addText(runs, {
      x: opts.x != null ? opts.x : MX, y, w: opts.w != null ? opts.w : CW,
      h: opts.h != null ? opts.h : 1.0, valign: "top", align: "left",
      fontFace: F.head, fontSize: size, bold: true, color: T.ink,
      lineSpacingMultiple: 1.0, margin: 0,
    });
  }

  function footer(s, deckName, idx, total) {
    s.addText(deckName.toUpperCase(), {
      x: MX, y: 7.02, w: 7, h: 0.3, fontFace: F.mono, fontSize: 9,
      color: T.footerColor, charSpacing: 2, valign: "middle", margin: 0,
    });
    s.addText(String(idx).padStart(2, "0") + " / " + String(total).padStart(2, "0"), {
      x: SW - MX - 3, y: 7.02, w: 3, h: 0.3, align: "right",
      fontFace: F.mono, fontSize: 9, color: T.footerColor,
      charSpacing: 2, valign: "middle", margin: 0,
    });
  }

  /* Italic takeaway line near the bottom. */
  function closer(s, runs, y = 6.5) {
    s.addText(runs, {
      x: MX, y, w: CW, h: 0.5, fontFace: F.body, italic: true,
      fontSize: 15, color: T.muted, valign: "top", margin: 0,
    });
  }

  /* Straight connector. opts: color, width, end, begin, dash.
     Up-arrows: positive offset + begin:"triangle", never negative h. */
  function arrow(s, x, y, w, h, opts = {}) {
    s.addShape(P.shapes.LINE, {
      x, y, w, h,
      line: {
        color: opts.color || T.muted, width: opts.width || 1.75,
        endArrowType: opts.end || "triangle",
        beginArrowType: opts.begin || "none",
        dashType: opts.dash || "solid",
      },
    });
  }

  /* Monospace block. runs = rich-text array (use breakLine per line). */
  function codeText(s, x, y, w, runs, size = 13, h = 2.4) {
    s.addText(runs, {
      x, y, w, h, fontFace: F.mono, fontSize: size, color: T.ink,
      align: "left", valign: "top", lineSpacingMultiple: 1.32, margin: 0,
    });
  }

  /* Big-number exhibit (Zelazny / Knaflic): the four layers of a metric
     callout — small label, hero value, colored delta. Use this on evidence
     slides INSTEAD of a box of bullets; the number, not a bullet list, is the
     point. opts: value (req), label, delta, deltaGood (default true),
     size (66), align ("left"), valueColor (T.ink). */
  function stat(s, x, y, w, opts = {}) {
    const align = opts.align || "left";
    const size = opts.size || 66;
    let cy = y;
    if (opts.label) {
      s.addText(opts.label.toUpperCase(), {
        x, y: cy, w, h: 0.34, align, valign: "bottom",
        fontFace: F.mono, fontSize: 12, color: T.muted, charSpacing: 1.5, margin: 0,
      });
      cy += 0.4;
    }
    s.addText(String(opts.value), {
      x, y: cy, w, h: size / 50, align, valign: "top",
      fontFace: F.head, fontSize: size, bold: true,
      color: opts.valueColor || T.ink, lineSpacingMultiple: 0.95, margin: 0,
    });
    cy += size / 50 + 0.04;
    if (opts.delta) {
      s.addText(opts.delta, {
        x, y: cy, w, h: 0.36, align, valign: "top",
        fontFace: F.body, fontSize: 15, bold: true,
        color: opts.deltaGood === false ? T.bad : T.good, margin: 0,
      });
    }
  }

  /* A row of 2–4 KPIs across the content width, separated by hairline rules
     and carrying NO card chrome. A row of equal bordered cards is the classic
     AI-slop tell; chrome-less numbers with thin dividers read as a real
     dashboard/exec exhibit. stats: [{ value, label, delta, deltaGood }]. */
  function statBand(s, y, stats, opts = {}) {
    const n = Math.min(stats.length, 4);
    const colW = CW / n;
    const size = opts.size || (n >= 3 ? 46 : 56);
    for (let i = 0; i < n; i++) {
      const cx = MX + i * colW;
      if (i > 0) {
        s.addShape(P.shapes.LINE, {
          x: cx, y: y + 0.1, w: 0, h: size / 50 + 0.7,
          line: { color: T.border, width: 1 },
        });
      }
      stat(s, cx + (i > 0 ? 0.34 : 0), y, colW - 0.4, {
        value: stats[i].value, label: stats[i].label,
        delta: stats[i].delta, deltaGood: stats[i].deltaGood,
        size, align: "left",
      });
    }
  }

  /* Harvey ball (McKinsey/BCG signature): a ring filled 0–4 quarters to show
     "how good" without a number. level 0 = empty ring, 4 = full. */
  function harvey(s, x, y, d, level, color) {
    const c = color || T.accent;
    s.addShape(P.shapes.OVAL, { x, y, w: d, h: d, fill: { type: "none" }, line: { color: c, width: 1.25 } });
    if (level >= 4) {
      s.addShape(P.shapes.OVAL, { x, y, w: d, h: d, fill: { color: c }, line: { type: "none" } });
    } else if (level > 0) {
      // positive angles only — pptxgenjs mishandles a negative start angle
      s.addShape(P.shapes.PIE, { x, y, w: d, h: d, angleRange: [0, 90 * level], fill: { color: c }, line: { type: "none" } });
    }
  }

  /* Decision matrix / comparison table (Zelazny · IBCS · Big-Three convention):
     options across the TOP, criteria down the SIDE, hairline row rules ONLY (a
     grid of bordered cells is the AI-slop tell). The recommended column gets an
     accent header + cap + faint wash so the eye lands on the answer. Cells are
     short: a 1–3 word string, "✓"/"—", or a NUMBER 0–4 (rendered as a Harvey
     ball). Keep to 4–8 criteria. opts: options [str], rows [{label, cells[]}],
     highlight (recommended col index), labelW (3.2), rowH (0.72). */
  function compareTable(s, y, opts = {}) {
    const options = opts.options || [];
    const rows = opts.rows || [];
    const n = options.length;
    const labelW = opts.labelW || 3.2;
    const optW = (CW - labelW) / n;
    const headH = 0.5;
    const rowH = opts.rowH || 0.72;
    const hi = opts.highlight;
    const bottom = y + headH + rows.length * rowH;

    if (hi != null) {
      const hx = MX + labelW + hi * optW;
      s.addShape(P.shapes.RECTANGLE, { x: hx, y: y - 0.06, w: optW, h: bottom - y + 0.18, fill: { color: T.accent, transparency: 88 }, line: { type: "none" } });
      s.addShape(P.shapes.RECTANGLE, { x: hx, y: y - 0.06, w: optW, h: 0.05, fill: { color: T.accent }, line: { type: "none" } });
    }
    options.forEach((o, i) => {
      s.addText(o, {
        x: MX + labelW + i * optW, y, w: optW, h: headH, align: "center", valign: "middle",
        fontFace: F.head, bold: true, fontSize: 16, color: i === hi ? T.accentText : T.ink, margin: 0,
      });
    });
    rows.forEach((r, ri) => {
      const ry = y + headH + ri * rowH;
      s.addShape(P.shapes.LINE, { x: MX, y: ry, w: CW, h: 0, line: { color: T.border, width: 1 } });
      s.addText(r.label, {
        x: MX, y: ry, w: labelW - 0.2, h: rowH, align: "left", valign: "middle",
        fontFace: F.body, fontSize: 15, color: T.muted, margin: 0,
      });
      r.cells.forEach((c, ci) => {
        const cx = MX + labelW + ci * optW;
        const isHi = ci === hi;
        if (typeof c === "number") {
          const d = 0.34;
          harvey(s, cx + optW / 2 - d / 2, ry + rowH / 2 - d / 2, d, c, isHi ? T.accent : T.ink);
        } else {
          const mark = c === "✓" || c === "—" || c === "✗";
          const col = c === "✓" ? T.good : (c === "—" || c === "✗") ? T.dim : isHi ? T.ink : T.muted;
          s.addText(c, {
            x: cx, y: ry, w: optW, h: rowH, align: "center", valign: "middle",
            fontFace: mark ? F.head : F.body, bold: mark || isHi, fontSize: mark ? 18 : 15, color: col, margin: 0,
          });
        }
      });
    });
    s.addShape(P.shapes.LINE, { x: MX, y: bottom, w: CW, h: 0, line: { color: T.border, width: 1 } });
  }

  /* Horizontal milestone timeline / roadmap. A single connector axis with evenly
     spaced circular markers — NOT a row of bordered cards. Each node: a date label
     above, a phase title + one line below. opts.current (default last) accents the
     axis + markers up to that index to show progress / "you are here"; later nodes
     are hollow. items: [{date, phase, body}] (3–6). (SlideModel/Slideworks: one
     axis, circular markers, short date+label beneath, restraint.) */
  function timeline(s, y, items, opts = {}) {
    const n = items.length;
    if (n < 2) return;
    // tile n equal columns so adjacent labels never overlap; dot at each centre
    const colW = CW / n;
    const cxOf = (i) => MX + (i + 0.5) * colW;
    const x0 = cxOf(0), x1 = cxOf(n - 1);
    const current = opts.current != null ? opts.current : n - 1;
    const cur = cxOf(Math.max(0, Math.min(n - 1, current)));
    s.addShape(P.shapes.LINE, { x: x0, y, w: Math.max(0, cur - x0), h: 0, line: { color: T.accent, width: 2.5 } });
    if (cur < x1) s.addShape(P.shapes.LINE, { x: cur, y, w: x1 - cur, h: 0, line: { color: T.border, width: 2 } });
    for (let i = 0; i < n; i++) {
      const cx = cxOf(i);
      const done = i <= current;
      const d = 0.2;
      s.addShape(P.shapes.OVAL, {
        x: cx - d / 2, y: y - d / 2, w: d, h: d,
        fill: { color: done ? T.accent : T.bg }, line: { color: done ? T.accent : T.nodeBorder, width: 2 },
      });
      const tw = colW - 0.4;
      const tx = cx - tw / 2;
      s.addText(items[i].date || "", {
        x: tx, y: y - 0.62, w: tw, h: 0.34, align: "center", valign: "bottom",
        fontFace: F.mono, fontSize: 12, color: i === current ? T.accentText : T.muted, charSpacing: 1, margin: 0,
      });
      s.addText(items[i].phase || "", {
        x: tx, y: y + 0.28, w: tw, h: 0.45, align: "center", valign: "top",
        fontFace: F.head, bold: true, fontSize: 17, color: T.ink, margin: 0,
      });
      if (items[i].body) s.addText(items[i].body, {
        x: tx, y: y + 0.78, w: tw, h: 1.2, align: "center", valign: "top",
        fontFace: F.body, fontSize: 14, color: T.muted, lineSpacingMultiple: 1.25, margin: 0,
      });
    }
  }

  /* 2×2 quadrant / prioritization matrix (impact-effort, BCG growth-share, …).
     Hairline cross axes (no heavy grid); "how good" is encoded with ONE accent
     colour at graded opacity — the sweet-spot quadrant strongest, good ones
     fainter, worst none — so the eye averts to the darkest quadrant (accessible,
     not a rainbow). Bubbles plot by {x,y} in 0..1 (y up); accent the picks.
     opts: washes {tl,tr,bl,br: transparency 0–100} · quadrants {tl,tr,bl,br
     (+ *Accent bool)} corner labels · xLabel · yLabel · items [{x,y,label,
     highlight}]. (Bitesize/LaunchNotes: Impact-Y, Effort-X, grade one colour.) */
  function quadrant(s, px, py, S, opts = {}) {
    const cxm = px + S / 2, cym = py + S / 2;
    const corner = { tl: [px, py], tr: [cxm, py], bl: [px, cym], br: [cxm, cym] };
    const wash = opts.washes || {};
    Object.keys(wash).forEach((k) => {
      const [qx, qy] = corner[k];
      s.addShape(P.shapes.RECTANGLE, { x: qx, y: qy, w: S / 2, h: S / 2, fill: { color: T.accent, transparency: wash[k] }, line: { type: "none" } });
    });
    s.addShape(P.shapes.LINE, { x: px, y: cym, w: S, h: 0, line: { color: T.nodeBorder, width: 1.25 } });
    s.addShape(P.shapes.LINE, { x: cxm, y: py, w: 0, h: S, line: { color: T.nodeBorder, width: 1.25 } });
    const q = opts.quadrants || {};
    const corLbl = (txt, qx, qy, align, accent) => {
      if (!txt) return;
      s.addText(txt.toUpperCase(), { x: qx, y: qy, w: S / 2 - 0.25, h: 0.3, align, valign: "middle", fontFace: F.mono, fontSize: 11, color: accent ? T.accentText : T.dim, charSpacing: 1, margin: 0 });
    };
    corLbl(q.tl, px + 0.18, py + 0.12, "left", q.tlAccent);
    corLbl(q.tr, cxm + 0.07, py + 0.12, "right", q.trAccent);
    corLbl(q.bl, px + 0.18, py + S - 0.42, "left", q.blAccent);
    corLbl(q.br, cxm + 0.07, py + S - 0.42, "right", q.brAccent);
    if (opts.xLabel) s.addText(opts.xLabel, { x: px, y: py + S + 0.14, w: S, h: 0.32, align: "center", fontFace: F.mono, fontSize: 12, color: T.muted, charSpacing: 1, margin: 0 });
    if (opts.yLabel) s.addText(opts.yLabel, { x: px - 0.1, y: py - 0.48, w: S, h: 0.32, align: "left", fontFace: F.mono, fontSize: 12, color: T.muted, charSpacing: 1, margin: 0 });
    (opts.items || []).forEach((it) => {
      const sx = px + it.x * S, sy = py + (1 - it.y) * S;
      const d = 0.2;
      s.addShape(P.shapes.OVAL, { x: sx - d / 2, y: sy - d / 2, w: d, h: d, fill: { color: it.highlight ? T.accent : T.node }, line: { color: it.highlight ? T.accent : T.nodeBorder, width: 1.5 } });
      // label points OUTWARD (left-half → left, right-half → right) so adjacent
      // labels never collide at the centre; it.side overrides.
      const right = it.side ? it.side === "right" : it.x >= 0.5;
      s.addText(it.label, {
        x: right ? sx + 0.16 : sx - 0.16 - 2.3, y: sy - 0.17, w: 2.3, h: 0.34,
        align: right ? "left" : "right", valign: "middle",
        fontFace: F.body, fontSize: 14, bold: !!it.highlight, color: it.highlight ? T.ink : T.muted, margin: 0,
      });
    });
  }

  /* Chartjunk-free chart (Knaflic declutter). A REAL, editable PptxGenJS chart
     — not an image, not faked with shapes. Strips the noise that reads as AI
     slop: no chart title (the slide's action title carries the message), no
     gridlines, hidden value axis (numbers are labeled directly on the data),
     and ONE accent series/bar with the rest muted so the eye lands on the point.
     type:   "col" (vertical) | "bar" (horizontal, for ranking) | "line" (trend)
     series: [{ name, labels:[...], values:[...] }] — 1+ series, shared labels
     opts:   x,y,w,h · highlight (index to accent, default 0) · showValue
             (default true for col/bar, false for line) · legend (default
             series.length>1) · valFmt (number format, e.g. "#,##0" or '0"%"') ·
             accent (override accent hex). */
  function chart(s, type, series, opts = {}) {
    const x = opts.x != null ? opts.x : MX;
    const y = opts.y != null ? opts.y : 2.5;
    const w = opts.w != null ? opts.w : CW;
    const h = opts.h != null ? opts.h : 3.8;
    const accent = opts.accent || T.accent;
    const neutral = T.muted;
    const isLine = type === "line";
    const multi = series.length > 1;
    const hi = opts.highlight != null ? opts.highlight : 0;
    const n = multi ? series.length : series[0].values.length;
    // single series -> color per BAR; multi series -> color per SERIES (pptxgenjs)
    const chartColors = Array.from({ length: n }, (_, i) => (i === hi ? accent : neutral));
    const showValue = opts.showValue != null ? opts.showValue : !isLine;

    const o = {
      x, y, w, h, chartColors,
      showTitle: false,
      showLegend: opts.legend != null ? opts.legend : multi,
      legendPos: "b", legendColor: T.muted, legendFontFace: F.body, legendFontSize: 12,
      // declutter: kill gridlines and the value axis; keep a quiet category axis
      valGridLine: { style: "none" },
      catGridLine: { style: "none" },
      valAxisHidden: true, valAxisLineShow: false,
      catAxisLineShow: false,
      catAxisLabelColor: T.muted, catAxisLabelFontFace: F.body, catAxisLabelFontSize: 12,
      // direct data labels — the number sits on the mark, not on a hidden axis
      showValue,
      dataLabelColor: T.ink, dataLabelFontFace: F.head, dataLabelFontSize: 14,
      dataLabelFormatCode: opts.valFmt || "#,##0",
      chartArea: { fill: { color: T.bg } },
      plotArea: { fill: { color: T.bg } },
    };
    if (isLine) {
      o.lineSize = 2.75; o.lineSmooth = false; o.lineDataSymbol = "none";
      o.dataLabelPosition = "t";
    } else {
      o.barDir = type === "bar" ? "bar" : "col";
      o.barGapWidthPct = 45;
      o.dataLabelPosition = "outEnd";
    }
    s.addChart(isLine ? P.ChartType.line : P.ChartType.bar, series, o);
  }

  /* Real icons, not boxes or emoji (visual-playbook move #2). Rasterizes the
     vendored Tabler outline SVGs (MIT — see assets/icons/NOTICE) to transparent
     PNGs tinted to the theme accent, so a slide carries meaning-bearing icons
     instead of flat panels. ASYNC (sharp) — call ONCE at the top of a build and
     reuse the returned map: `const I = await B.loadIcons(["bolt","shield"])`.
     names: file stems in assets/icons. opts: color (hex, default T.accent), px
     (default 256). Returns { name: "image/png;base64,..." } for sync placement. */
  async function loadIcons(names, opts = {}) {
    const color = (opts.color || T.accent).replace("#", "");
    const px = opts.px || 256;
    const out = {};
    for (const name of names) {
      let svg = fs.readFileSync(path.join(ICON_DIR, name + ".svg"), "utf8");
      svg = svg
        .replace(/stroke="currentColor"/g, `stroke="#${color}"`)
        .replace(/width="24"/, `width="${px}"`)
        .replace(/height="24"/, `height="${px}"`);
      const png = await sharp(Buffer.from(svg)).png().toBuffer();
      out[name] = "image/png;base64," + png.toString("base64");
    }
    return out;
  }

  /* Place one loaded icon (a data URI from loadIcons). Square; size in inches. */
  function icon(s, dataURI, x, y, size = 0.5) {
    s.addImage({ data: dataURI, x, y, w: size, h: size });
  }

  /* A row of 2–4 concepts, each = real icon + bold label + one supporting line.
     Deliberately CHROME-LESS — a row of equal bordered cards is the AI-slop tell;
     icon + text on open space reads as designed. items: [{ icon (data URI from
     loadIcons), label, body }]. opts: y handled by caller, gap, iconSize. */
  function iconRow(s, y, items, opts = {}) {
    const n = Math.min(items.length, 4);
    const gap = opts.gap || 0.55;
    const colW = (CW - gap * (n - 1)) / n;
    const isz = opts.iconSize || 0.62;
    for (let i = 0; i < n; i++) {
      const cx = MX + i * (colW + gap);
      if (items[i].icon) icon(s, items[i].icon, cx, y, isz);
      s.addText(items[i].label, {
        x: cx, y: y + isz + 0.24, w: colW, h: 0.55,
        fontFace: F.head, bold: true, fontSize: 20, color: T.ink,
        valign: "top", lineSpacingMultiple: 1.0, margin: 0,
      });
      s.addText(items[i].body, {
        x: cx, y: y + isz + 0.92, w: colW, h: 1.6,
        fontFace: F.body, fontSize: 15, color: T.muted,
        valign: "top", lineSpacingMultiple: 1.28, margin: 0,
      });
    }
  }

  /* Visual-led split layout (visual-playbook move #8). Western reading gravity
     puts the narrative LEFT and the focal exhibit RIGHT (Gutenberg / Z-pattern),
     so the eye lands on the claim, then the proof — sharper than a chart floating
     under a centered title. Places the text column (kicker + title + body) and
     RETURNS the visual-zone rect {x,y,w,h}; drop an exhibit into it, e.g.
     B.chart(s,'col',data,zone). opts: side ('right' default = visual right) ·
     ratioText (0.5) · gap (0.7) · kicker · title (runs) · titleSize (30) ·
     body (runs|string) · bodyY (3.1) · visY (1.9) · visH (4.0). */
  function split(s, opts = {}) {
    const side = opts.side || "right";
    const gap = opts.gap || 0.7;
    const rt = opts.ratioText || 0.5;
    const tw = (CW - gap) * rt;
    const vw = CW - gap - tw;
    const tx = side === "right" ? MX : MX + vw + gap;
    const vx = side === "right" ? MX + tw + gap : MX;
    if (opts.kicker) kicker(s, opts.kicker, 0.62, { x: tx });
    if (opts.title) title(s, opts.title, 1.15, opts.titleSize || 30, { x: tx, w: tw, h: 2.0 });
    if (opts.body) {
      const runs = typeof opts.body === "string" ? [{ text: opts.body, options: {} }] : opts.body;
      s.addText(runs, {
        x: tx, y: opts.bodyY != null ? opts.bodyY : 3.1, w: tw, h: 2.6,
        valign: "top", align: "left", fontFace: F.body, fontSize: 18,
        color: T.ink, lineSpacingMultiple: 1.34, margin: 0,
      });
    }
    return { x: vx, y: opts.visY != null ? opts.visY : 1.9, w: vw, h: opts.visH || 4.0 };
  }

  /* ---- Playful mode primitives (theme.style = playful) ----
     These render the bold-color-block look that makes "playful" a DISTINCT mode
     rather than a recolour. Premium themes never call them; safe to add. */

  /* A solid, saturated rounded color block — no border. The playful counterpart
     to panel()'s hairline rectangle. opts: color (default T.accent), radius. */
  function block(s, x, y, w, h, opts = {}) {
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      rectRadius: opts.radius != null ? opts.radius : 0.18,
      fill: { color: opts.color || T.accent },
      line: { type: "none" },
    });
  }

  /* Solid filled kicker pill with white text — the playful counterpart to the
     premium outline kicker(). opts: color (fill, default T.accent), textColor. */
  function solidKicker(s, text, y = 0.62, opts = {}) {
    const color = opts.color || T.accent;
    const w = Math.min(8.6, 0.7 + text.length * 0.125);
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x: MX, y, w, h: 0.42, rectRadius: 0.21,
      fill: { color }, line: { type: "none" },
    });
    s.addText(text.toUpperCase(), {
      x: MX + 0.28, y, w: w - 0.5, h: 0.42, valign: "middle", align: "left",
      fontFace: F.mono, fontSize: 11, bold: true,
      color: opts.textColor || "FFFFFF", charSpacing: 1.5, margin: 0,
    });
  }

  /* A row of 2–4 bold COLOR blocks (cycling T.blocks), each = white icon + white
     heading + white line. The playful "pillars" exhibit — saturated multi-colour
     blocks read as deliberate energy, not the neutral equal-card slop tell.
     items: [{ icon (white-tinted data URI), label, body }]. opts: h, gap, iconSize. */
  function blockRow(s, y, items, opts = {}) {
    const n = Math.min(items.length, 4);
    const gap = opts.gap || 0.4;
    const h = opts.h || 3.0;
    const colW = (CW - gap * (n - 1)) / n;
    const pal = T.blocks || [T.accent];
    const wInk = T.blockInk || "FFFFFF";
    const isz = opts.iconSize || 0.6;
    const pad = 0.42;
    for (let i = 0; i < n; i++) {
      const cx = MX + i * (colW + gap);
      block(s, cx, y, colW, h, { color: pal[i % pal.length], radius: 0.2 });
      if (items[i].icon) icon(s, items[i].icon, cx + pad, y + pad, isz);
      s.addText(items[i].label, {
        x: cx + pad, y: y + pad + isz + 0.2, w: colW - 2 * pad, h: 0.6,
        fontFace: F.head, bold: true, fontSize: 21, color: wInk,
        valign: "top", lineSpacingMultiple: 1.0, margin: 0,
      });
      s.addText(items[i].body, {
        x: cx + pad, y: y + pad + isz + 0.9, w: colW - 2 * pad, h: h - pad - isz - 1.0,
        fontFace: F.body, fontSize: 15, color: wInk,
        valign: "top", lineSpacingMultiple: 1.3, margin: 0,
      });
    }
  }

  return { SW, SH, MX, CW, newSlide, glow, panel, node, kicker, title, footer, closer, arrow, codeText, stat, statBand, chart, harvey, compareTable, timeline, quadrant, loadIcons, icon, iconRow, split, block, solidKicker, blockRow };
}

module.exports = { createBuilder, SW, SH, MX, CW };
