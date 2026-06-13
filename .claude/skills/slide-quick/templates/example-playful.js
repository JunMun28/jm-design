/* Playful-mode showcase — proves "playful" is a DISTINCT excellent mode.
   Usage: node example-playful.js <out.pptx>  (theme is always playful) */
const pptxgen = require("pptxgenjs");
const { THEMES } = require("./themes");
const { createBuilder } = require("./builder");

const out = process.argv[2] || "playful.pptx";
const T = THEMES.playful;

const P = new pptxgen();
P.layout = "LAYOUT_WIDE";
P.title = "slide-quick playful";
const B = createBuilder(P, T);
const DECK = "slide-quick playful";

(async () => {
  // White-tinted icons sit on the saturated color blocks.
  const IW = await B.loadIcons(["bolt", "heart-handshake", "rocket"], { color: "FFFFFF" });

  /* 01 — cover: cream canvas, solid kicker, big friendly title, playful shapes */
  {
    const s = B.newSlide();
    // playful energy: flat solid circles bleeding off the corner (not gradient soup)
    s.addShape(P.shapes.OVAL, { x: 10.7, y: -1.6, w: 4.2, h: 4.2, fill: { color: "C13B28" }, line: { type: "none" } });
    s.addShape(P.shapes.OVAL, { x: 12.5, y: 2.1, w: 1.5, h: 1.5, fill: { color: "6D4AE0" }, line: { type: "none" } });
    B.solidKicker(s, "Playful · slide-quick", 1.4);
    s.addText([
      { text: "Serious ideas can still feel ", options: { color: T.ink } },
      { text: "fun", options: { color: T.accentText } },
    ], { x: B.MX, y: 2.4, w: 10.2, h: 2.2, fontFace: T.fonts.head, fontSize: 56, bold: true, lineSpacingMultiple: 1.0, margin: 0 });
    B.closer(s, [{ text: "A distinct playful mode — bold blocks, big type, warm palette.", options: {} }], 5.0);
    B.footer(s, DECK, 1, 5);
  }

  /* 02 — pillars as bold COLOR BLOCKS (coral/teal/violet), white icon + text */
  {
    const s = B.newSlide();
    B.solidKicker(s, "01 · What makes it playful", 0.62, { color: "11827A" });
    B.title(s, [
      { text: "Three moves carry the ", options: {} },
      { text: "energy", options: { color: T.accentText } },
    ]);
    B.blockRow(s, 3.0, [
      { icon: IW.bolt, label: "Bold blocks", body: "Saturated color blocks replace hairline panels — full, confident shapes." },
      { icon: IW["heart-handshake"], label: "Warm palette", body: "Cream canvas, friendly coral, teal and violet — never cold or corporate." },
      { icon: IW.rocket, label: "Big friendly type", body: "Large headings with a clean body so it stays readable, never childish." },
    ], { h: 3.1 });
    B.footer(s, DECK, 2, 5);
  }

  /* 03 — punchline: a single hero number on a full-bleed color block (white) */
  {
    const s = B.newSlide();
    B.solidKicker(s, "02 · The point", 0.62, { color: "6D4AE0" });
    B.title(s, [{ text: "Playful does not mean less rigorous", options: {} }]);
    B.block(s, B.MX, 2.6, B.CW, 3.4, { color: "C13B28", radius: 0.22 });
    s.addText("3×", { x: B.MX + 0.6, y: 3.0, w: 5.0, h: 1.9, fontFace: T.fonts.head, bold: true, fontSize: 110, color: "FFFFFF", valign: "middle", margin: 0 });
    s.addText([
      { text: "more audience recall", options: { bold: true, breakLine: true } },
      { text: "for decks that use bold colour and big type, vs. dense bulleted slides.", options: {} },
    ], { x: 6.4, y: 3.3, w: 6.0, h: 2.2, fontFace: T.fonts.body, fontSize: 19, color: "FFFFFF", valign: "middle", lineSpacingMultiple: 1.3, margin: 0 });
    B.closer(s, [{ text: "Sample figure. ● ILLUSTRATIVE", options: {} }], 6.35);
    B.footer(s, DECK, 3, 5);
  }

  /* 04 — chart works in playful mode too: coral highlight on cream, no chartjunk */
  {
    const s = B.newSlide();
    B.solidKicker(s, "03 · Evidence", 0.62, { color: "11827A" });
    B.title(s, [
      { text: "Engagement climbed every week — ", options: {} },
      { text: "and stuck", options: { color: T.accentText } },
    ]);
    B.chart(s, "col", [
      { name: "Avg. minutes engaged", labels: ["W1", "W2", "W3", "W4"], values: [4, 7, 11, 14] },
    ], { y: 2.6, h: 3.5, highlight: 3 });
    B.closer(s, [{ text: "Sample figures. ● ILLUSTRATIVE — one accent bar, labels on the data.", options: {} }], 6.35);
    B.footer(s, DECK, 4, 5);
  }

  /* 05 — close: big friendly line + a solid block CTA */
  {
    const s = B.newSlide();
    // bleed a circle off the right edge — clear of the footer + the CTA block
    s.addShape(P.shapes.OVAL, { x: 12.4, y: 2.6, w: 3.4, h: 3.4, fill: { color: "6D4AE0" }, line: { type: "none" } });
    B.solidKicker(s, "Playful · slide-quick", 1.4);
    s.addText([
      { text: "Pick playful when the room needs ", options: { color: T.ink } },
      { text: "warmth", options: { color: T.accentText } },
    ], { x: B.MX, y: 2.5, w: 10.5, h: 2.0, fontFace: T.fonts.head, fontSize: 50, bold: true, lineSpacingMultiple: 1.0, margin: 0 });
    B.block(s, B.MX, 4.8, 4.4, 0.92, { color: "C13B28", radius: 0.18 });
    s.addText("Start a playful deck", { x: B.MX, y: 4.8, w: 4.4, h: 0.92, align: "center", valign: "middle", fontFace: T.fonts.head, bold: true, fontSize: 18, color: "FFFFFF", margin: 0 });
    B.footer(s, DECK, 5, 5);
  }

  const f = await P.writeFile({ fileName: out });
  console.log("Wrote", f);
})().catch((e) => { console.error(e); process.exit(1); });
