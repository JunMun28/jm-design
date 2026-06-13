/* Sample deck exercising every builder helper.
   Usage: node example-build.js <out.pptx> <midnight|light> */
const pptxgen = require("pptxgenjs");
const { THEMES } = require("./themes");
const { createBuilder } = require("./builder");

const out = process.argv[2] || "sample.pptx";
const T = THEMES[process.argv[3] || "midnight"];
if (!T) { console.error("Unknown theme"); process.exit(1); }

const P = new pptxgen();
P.layout = "LAYOUT_WIDE";
P.title = "slide-quick sample";
const B = createBuilder(P, T);
const DECK = "slide-quick sample";

(async () => {
  // Real icons are async (sharp) — load the set ONCE, reuse the map below.
  const I = await B.loadIcons(["bolt", "target", "shield"]);

  /* 01 — cover: kicker, glow, title runs, closer */
  {
    const s = B.newSlide();
    B.glow(s, 12.6, -0.4, 9, "cyan");
    B.kicker(s, "Sample · slide-quick", 1.5);
    s.addText([
      { text: "The native engine ", options: { color: T.ink } },
      { text: "works", options: { color: T.accentText } },
    ], { x: B.MX, y: 2.5, w: 11, h: 1.4, fontFace: T.fonts.head, fontSize: 54, bold: true, margin: 0 });
    B.closer(s, [{ text: "Seven slides exercising every helper.", options: {} }], 4.4);
    B.footer(s, DECK, 1, 7);
  }

  /* 02 — comparison: two panels + bullets + accent border */
  {
    const s = B.newSlide();
    B.glow(s, -0.3, 6.8, 6.5, "teal");
    B.kicker(s, "01 · Comparison");
    B.title(s, [{ text: "Panels hold bulleted comparisons", options: {} }]);
    const py = 2.5, ph = 2.6, pw = 5.55;
    [{ x: B.MX, lbl: "LEFT", lit: false }, { x: B.MX + pw + 0.43, lbl: "RIGHT", lit: true }].forEach((c) => {
      B.panel(s, c.x, py, pw, ph, { border: c.lit ? T.accent : T.border });
      s.addText(c.lbl, { x: c.x + 0.4, y: py + 0.3, w: pw - 0.8, h: 0.35, fontFace: T.fonts.mono, fontSize: 13, color: c.lit ? T.accentText : T.muted, charSpacing: 2, margin: 0 });
      s.addText([
        { text: "First point.", options: { breakLine: true } },
        { text: "Second point.", options: { breakLine: true } },
        { text: "Third point.", options: {} },
      ], { x: c.x + 0.4, y: py + 0.85, w: pw - 0.8, h: ph - 1.1, fontFace: T.fonts.body, fontSize: 18, color: T.ink, valign: "top", lineSpacingMultiple: 1.3, margin: 0, bullet: { code: "2022", indent: 14 } });
    });
    B.footer(s, DECK, 2, 7);
  }

  /* 03 — diagram: nodes, arrows, diamond, dashed box, feedback line */
  {
    const s = B.newSlide();
    B.kicker(s, "02 · Diagram");
    B.title(s, [{ text: "Diagrams are real, editable shapes", options: {} }]);
    B.panel(s, B.MX, 2.3, B.CW, 3.5);
    const nW = 2.6, nH = 0.95, ny = 2.8;
    const xs = [B.MX + 0.6, B.MX + B.CW / 2 - nW / 2, B.MX + B.CW - 0.6 - nW];
    ["Input", "Process", "Output"].forEach((t, i) => {
      B.node(s, xs[i], ny, nW, nH);
      s.addText(t, { x: xs[i], y: ny, w: nW, h: nH, align: "center", valign: "middle", fontFace: T.fonts.head, bold: true, fontSize: 16, color: T.ink, margin: 0 });
      if (i < 2) B.arrow(s, xs[i] + nW + 0.06, ny + nH / 2, xs[i + 1] - xs[i] - nW - 0.12, 0);
    });
    const ocx = xs[2] + nW / 2, diaY = 4.15;
    s.addShape(P.shapes.DIAMOND, { x: ocx - 0.7, y: diaY, w: 1.4, h: 0.8, fill: { color: T.node }, line: { color: T.nodeBorder, width: 1.25 } });
    s.addText("ok?", { x: ocx - 0.7, y: diaY, w: 1.4, h: 0.8, align: "center", valign: "middle", fontFace: T.fonts.head, bold: true, fontSize: 13, color: T.ink, margin: 0 });
    B.arrow(s, ocx, ny + nH + 0.02, 0, diaY - ny - nH - 0.04);
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: ocx - 1.1, y: diaY + 0.95, w: 2.2, h: 0.42, rectRadius: 0.07, line: { color: T.accentText, width: 1.25, dashType: "dash" } });
    s.addText("Done", { x: ocx - 1.1, y: diaY + 0.95, w: 2.2, h: 0.42, align: "center", valign: "middle", fontFace: T.fonts.head, bold: true, fontSize: 12, color: T.accentText, margin: 0 });
    B.arrow(s, xs[0] + nW / 2, diaY + 0.4, ocx - 0.7 - (xs[0] + nW / 2), 0, { begin: "triangle", end: "none" });
    B.footer(s, DECK, 3, 7);
  }

  /* 04 — code: panel + codeText with comment runs */
  {
    const s = B.newSlide();
    B.glow(s, 13.4, 7.0, 7, "magenta");
    B.kicker(s, "03 · Code");
    B.title(s, [{ text: "Code renders in Consolas, ≤10 lines", options: {} }]);
    B.panel(s, B.MX, 2.4, B.CW, 2.6);
    B.codeText(s, B.MX + 0.45, 2.75, B.CW - 0.9, [
      { text: "while True:", options: { color: T.ink, breakLine: true } },
      { text: "    step()", options: { color: T.ink } },
      { text: "  # the loop", options: { color: T.muted, breakLine: true } },
      { text: "    if done: break", options: { color: T.ink } },
    ], 14);
    B.closer(s, [{ text: "Sample content. ● ILLUSTRATIVE", options: {} }], 5.4);
    B.footer(s, DECK, 4, 7);
  }

  /* 05 — exhibit: KPI band, hairline dividers, NO card chrome (anti-slop) */
  {
    const s = B.newSlide();
    B.glow(s, -0.5, 7.4, 7, "magenta");
    B.kicker(s, "04 · Evidence");
    B.title(s, [
      { text: "Lead with the numbers, ", options: {} },
      { text: "not a box of bullets", options: { color: T.accentText } },
    ]);
    B.statBand(s, 3.3, [
      { value: "73%", label: "Faster to a first draft", delta: "↑ 28 pts vs manual", deltaGood: true },
      { value: "~15m", label: "Time to a finished deck", delta: "≈ 4× faster", deltaGood: true },
      { value: "2", label: "User replies needed", delta: "from ~12 before", deltaGood: true },
    ], { size: 60 });
    B.closer(s, [{ text: "Sample figures. ● ILLUSTRATIVE — every number traces to source or is labeled.", options: {} }], 5.7);
    B.footer(s, DECK, 5, 7);
  }

  /* 06 — chart: a REAL editable column chart, chartjunk stripped, one bar accented */
  {
    const s = B.newSlide();
    B.glow(s, 13.0, -0.3, 7, "cyan");
    B.kicker(s, "05 · Trend");
    B.title(s, [
      { text: "Adoption inflected in Q3 — ", options: {} },
      { text: "and held", options: { color: T.accentText } },
    ]);
    B.chart(s, "col", [
      { name: "Weekly active teams", labels: ["Q1", "Q2", "Q3", "Q4"], values: [120, 180, 410, 460] },
    ], { y: 2.6, h: 3.5, highlight: 2 });
    B.closer(s, [{ text: "Sample figures. ● ILLUSTRATIVE — one accent bar, no gridlines, labels on the data.", options: {} }], 6.35);
    B.footer(s, DECK, 6, 7);
  }

  /* 07 — pillars: real (tinted) Tabler icons + label + line, NO bordered cards */
  {
    const s = B.newSlide();
    B.kicker(s, "06 · Pillars");
    B.title(s, [
      { text: "Three things keep the fast path ", options: {} },
      { text: "fast", options: { color: T.accentText } },
    ]);
    B.iconRow(s, 3.0, [
      { icon: I.bolt, label: "Two replies", body: "Intake, then one wireframe approval — that is the whole gate." },
      { icon: I.target, label: "Native PPTX", body: "Real editable shapes and charts, no HTML round-trip." },
      { icon: I.shield, label: "One quality pass", body: "A single consultant review, then the deck ships." },
    ]);
    B.closer(s, [{ text: "Real icons, tinted to the accent — not boxes, not emoji.", options: {} }], 6.35);
    B.footer(s, DECK, 7, 7);
  }

  const f = await P.writeFile({ fileName: out });
  console.log("Wrote", f);
})().catch((e) => { console.error(e); process.exit(1); });
