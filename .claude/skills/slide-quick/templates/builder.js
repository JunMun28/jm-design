/* Theme-agnostic PptxGenJS helper library for slide-quick.
   Ported from decks/native-build/build.js (2026-06-13).
   Every helper creates FRESH option objects per call — PptxGenJS mutates
   option objects in place, so sharing one corrupts the second shape. */
const path = require("path");

const SW = 13.33, SH = 7.5, MX = 0.9;     // LAYOUT_WIDE inches
const CW = SW - 2 * MX;                    // content width

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

  /* Pill label above the title, with a small accent dot. */
  function kicker(s, text, y = 0.62) {
    const w = Math.min(8.6, 0.8 + text.length * 0.122);
    s.addShape(P.shapes.ROUNDED_RECTANGLE, {
      x: MX, y, w, h: 0.38, rectRadius: 0.19,
      fill: { color: T.kickerFill }, line: { color: T.border, width: 1 },
    });
    s.addShape(P.shapes.OVAL, {
      x: MX + 0.2, y: y + 0.155, w: 0.07, h: 0.07,
      fill: { color: T.accent }, line: { type: "none" },
    });
    s.addText(text.toUpperCase(), {
      x: MX + 0.36, y, w: w - 0.5, h: 0.38, valign: "middle", align: "left",
      fontFace: F.mono, fontSize: 10, color: T.muted, charSpacing: 1.5, margin: 0,
    });
  }

  /* Action title. runs = pptxgenjs rich-text array. */
  function title(s, runs, y = 1.15, size = 34) {
    s.addText(runs, {
      x: MX, y, w: CW, h: 1.0, valign: "top", align: "left",
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
  function codeText(s, x, y, w, runs, size = 13) {
    s.addText(runs, {
      x, y, w, fontFace: F.mono, fontSize: size, color: T.ink,
      align: "left", valign: "top", lineSpacingMultiple: 1.32, margin: 0,
    });
  }

  return { SW, SH, MX, CW, newSlide, glow, panel, node, kicker, title, footer, closer, arrow, codeText };
}

module.exports = { createBuilder, SW, SH, MX, CW };
