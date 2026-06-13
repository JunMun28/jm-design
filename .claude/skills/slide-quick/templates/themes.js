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
    kickerFill: "EFF0F3", footerColor: "9AA0A8",
    glows: false, assetDir: ASSET_DIR, fonts: FONTS,
  },
};

module.exports = { THEMES };
