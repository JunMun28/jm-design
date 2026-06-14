/* Theme-agnostic PptxGenJS helper library for slide-quick.
   Ported from decks/native-build/build.js (2026-06-13).
   Every helper creates FRESH option objects per call — PptxGenJS mutates
   option objects in place, so sharing one corrupts the second shape. */
const path = require("path");

const SW = 13.33, SH = 7.5, MX = 0.9;     // LAYOUT_WIDE inches
const CW = SW - 2 * MX;                    // content width

/* ---- Footer-rail + Cursor overflow invariant (AC1) -------------------------
   The content area is bounded by a hard rail. A Cursor advances down the slide
   and RAISES a build error the moment a block's bottom crosses CONTENT_MAX_Y,
   so footer overlap / off-slide content is a deterministic *build* failure
   instead of a silent visual bug caught only in the downstream QA render pass.
   Ported from open-design pptx-html-fidelity-audit layout-discipline.md §1-3. */
const CONTENT_TOP   = 1.15;   // cursor starts here on content slides (below kicker band)
const CONTENT_MAX_Y = 6.70;   // NOTHING in the content area may cross this rail
const FOOTER_TOP    = 7.02;   // footer row pinned here, outside the content area
const FOOTER_H      = 0.30;
const DEFAULT_GAP   = 0.12;   // inter-block gap; matches Latin body copy at this scale

/* Unicode ranges where italic must be suppressed (AC3). italic=true is a
   Latin/Cyrillic/Greek feature; forcing it on CJK / Arabic / Hebrew /
   Devanagari / Thai etc. makes PowerPoint synthesize a deformed slanted
   bitmap. Convey emphasis via weight or accent colour instead.
   Ported from font-discipline.md layer 5 NO_ITALIC_RANGES. */
const NO_ITALIC_RANGES = [
  [0x3400, 0x9FFF],  // CJK Unified Ideographs
  [0xF900, 0xFAFF],  // CJK Compatibility Ideographs
  [0x3040, 0x30FF],  // Hiragana + Katakana
  [0xAC00, 0xD7AF],  // Hangul Syllables
  [0x0590, 0x05FF],  // Hebrew
  [0x0600, 0x06FF],  // Arabic
  [0x0750, 0x077F],  // Arabic Supplement
  [0x0900, 0x097F],  // Devanagari
  [0x0980, 0x09FF],  // Bengali
  [0x0A00, 0x0A7F],  // Gurmukhi
  [0x0A80, 0x0AFF],  // Gujarati
  [0x0B00, 0x0B7F],  // Oriya
  [0x0B80, 0x0BFF],  // Tamil
  [0x0C00, 0x0C7F],  // Telugu
  [0x0C80, 0x0CFF],  // Kannada
  [0x0D00, 0x0D7F],  // Malayalam
  [0x0E00, 0x0E7F],  // Thai
  [0x0E80, 0x0EFF],  // Lao
  [0x1780, 0x17FF],  // Khmer
];

/* True when `text` contains any character from a script with no italic
   tradition. Accepts a string or a pptxgenjs rich-text run array. */
function hasNoItalicScript(text) {
  let str = "";
  if (typeof text === "string") str = text;
  else if (Array.isArray(text)) str = text.map((r) => (r && r.text) || "").join("");
  else if (text && typeof text.text === "string") str = text.text;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    for (const [lo, hi] of NO_ITALIC_RANGES) {
      if (cp >= lo && cp <= hi) return true;
    }
  }
  return false;
}

/* italic is allowed only when the caller asked for it AND the run has no
   non-italic-script characters. */
function safeItalic(want, text) {
  return Boolean(want) && !hasNoItalicScript(text);
}

/* A vertical cursor that refuses to cross CONTENT_MAX_Y. take(h) reserves a
   block of height `h` (+ gap), returns the block's top y, and throws an
   OverflowError-style Error if the block crosses the rail. */
function createCursor(yStart = CONTENT_TOP, cap = CONTENT_MAX_Y) {
  const history = [];
  let y = yStart;
  return {
    take(h, gap = DEFAULT_GAP, label = "") {
      const top = y;
      const bottom = top + h;
      history.push({ top, h, label });
      // 0.001" epsilon: sub-thousandth-inch float noise (e.g. 6.7000000001)
      // must not fail a build that geometrically fits the rail.
      if (bottom > cap + 1e-3) {
        throw new Error(
          `Cursor overflow at '${label || "block"}': bottom=${bottom.toFixed(2)}" ` +
          `crosses CONTENT_MAX_Y=${cap}". Reduce block height, trim the gap, or ` +
          `split the slide — do not raise the rail. history=` +
          JSON.stringify(history)
        );
      }
      y = bottom + gap;
      return top;
    },
    get y() { return y; },
    remaining() { return cap - y; },
    history() { return history.slice(); },
  };
}

/* Budget-centering for hero slides (cover / section). Pass the block stack as
   [height, gapAfter] pairs in reading order; returns a Cursor whose y_start is
   computed so the whole stack is vertically centered on the canvas. The cap is
   pinned just above the footer so overflow is still caught.
   Ported from layout-discipline.md §3. */
function heroLayout(blocks) {
  const totalH = blocks.reduce((sum, [h, g]) => sum + h + (g || 0), 0);
  const yStart = Math.max(0.2, (SH - totalH) / 2);
  return createCursor(yStart, SH - FOOTER_H - 0.2);
}

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
      fill: { color: T.accent },
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
      x: MX, y: FOOTER_TOP, w: 7, h: FOOTER_H, fontFace: F.mono, fontSize: 9,
      color: T.footerColor, charSpacing: 2, valign: "middle", margin: 0,
    });
    s.addText(String(idx).padStart(2, "0") + " / " + String(total).padStart(2, "0"), {
      x: SW - MX - 3, y: FOOTER_TOP, w: 3, h: FOOTER_H, align: "right",
      fontFace: F.mono, fontSize: 9, color: T.footerColor,
      charSpacing: 2, valign: "middle", margin: 0,
    });
  }

  /* Italic takeaway line near the bottom. Italic is suppressed when the line
     contains non-italic-script characters (AC3); emphasis then falls back to
     the muted colour the closer already carries. */
  function closer(s, runs, y = 6.5) {
    s.addText(runs, {
      x: MX, y, w: CW, h: 0.5, fontFace: F.body, italic: safeItalic(true, runs),
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

  return {
    SW, SH, MX, CW,
    CONTENT_TOP, CONTENT_MAX_Y, FOOTER_TOP, FOOTER_H,
    newSlide, glow, panel, node, kicker, title, footer, closer, arrow, codeText,
    // Layout invariants (AC1) + script-safe italic (AC3).
    cursor: createCursor, heroLayout, hasNoItalicScript, safeItalic,
  };
}

module.exports = {
  createBuilder, SW, SH, MX, CW,
  CONTENT_TOP, CONTENT_MAX_Y, FOOTER_TOP, FOOTER_H,
  createCursor, heroLayout, hasNoItalicScript, safeItalic, NO_ITALIC_RANGES,
};
