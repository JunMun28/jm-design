/* Regenerate the soft radial-glow PNGs used by the midnight theme.
   PptxGenJS has no gradient fills; a transparent radial PNG is the
   sanctioned way to fake a glow. Run: node scripts/gen-glows.js */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "assets");
fs.mkdirSync(dir, { recursive: true });

function glow(name, rgb) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="rgb(${rgb})" stop-opacity="0.55"/>
      <stop offset="42%" stop-color="rgb(${rgb})" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="rgb(${rgb})" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="900" height="900" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toFile(path.join(dir, `glow-${name}.png`));
}

Promise.all([
  glow("cyan", "0,210,255"),
  glow("magenta", "196,123,255"),
  glow("teal", "45,212,191"),
]).then(() => console.log("glow assets written to", dir));
