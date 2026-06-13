/* Theme token objects for the slide-quick native engine.
   Colors are 6-char hex WITHOUT "#" (PptxGenJS corrupts files on "#"). */
const path = require("path");
const ASSET_DIR = path.join(__dirname, "..", "assets");
const FONTS = { head: "Calibri", body: "Calibri", mono: "Consolas" };

const THEMES = {
  /* Dark theme — port of decks/native-build (2026-06-13). */
  midnight: {
    name: "midnight",
    bg: "08090A", panel: "16171B", node: "1C1D22",
    border: "2A2C33", nodeBorder: "3A3D47",
    ink: "F7F8F8", muted: "8A8F98", dim: "5A5F68",
    accent: "5E6AD2", accentText: "828FFF",
    good: "4CB782", bad: "E5484D",   // delta colors — AA on near-black bg
    kickerFill: "121317", footerColor: "6A6F78",
    glows: true, assetDir: ASSET_DIR, fonts: FONTS,
  },
  /* Light corporate theme. No glow images (they are dark-canvas art). */
  light: {
    name: "light",
    bg: "FFFFFF", panel: "F4F5F7", node: "FFFFFF",
    border: "D9DCE1", nodeBorder: "C2C7CF",
    ink: "16181D", muted: "5A6068", dim: "9AA0A8",
    accent: "5E6AD2", accentText: "4F5BD5",
    good: "0B7A3E", bad: "C0292E",   // delta colors — AA on white bg
    kickerFill: "EFF0F3", footerColor: "7A828C",
    glows: false, assetDir: ASSET_DIR, fonts: FONTS,
  },
  /* Playful theme — a DISTINCT mode, not a recolour: warm cream canvas, bold
     saturated color BLOCKS (use B.block / B.blockRow / B.solidKicker), big
     friendly type. Block fills are deep enough that white text clears WCAG AA
     (coral 5.35:1 · teal 4.67:1 · violet 5.67:1); muted 4.80:1 on cream. */
  playful: {
    name: "playful",
    bg: "FFFBF4", panel: "FFFFFF", node: "FFFFFF",
    border: "EFE3D5", nodeBorder: "E2D4C4",
    ink: "241B15", muted: "7A6E63", dim: "A99C8E",
    accent: "C13B28", accentText: "C13B28",   // deep coral; AA on cream + white
    good: "0B7A3E", bad: "C0292E",
    kickerFill: "FBEFE2", footerColor: "8A7D6F",
    blocks: ["C13B28", "11827A", "6D4AE0"],    // coral · teal · violet (white-AA)
    blockInk: "FFFFFF",
    glows: false, assetDir: ASSET_DIR, fonts: FONTS,
  },
};

module.exports = { THEMES };
