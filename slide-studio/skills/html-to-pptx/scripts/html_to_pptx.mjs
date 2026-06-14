#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs");
const { chromium } = require("playwright");

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = process.cwd();
const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 900;
const DEFAULT_SCALE = 2;
const EMU_PER_INCH = 914400;
const PT_PER_INCH = 72;

// Fonts PowerPoint can be relied on to have. Anything else (e.g. brand webfonts
// like "Micron Basis" that have no @font-face) is mapped to Arial so the .pptx
// renders with the same metrics the headless browser already used as fallback.
const STANDARD_FONTS = new Set([
  "arial", "helvetica", "helvetica neue", "calibri", "cambria", "times new roman",
  "times", "georgia", "verdana", "tahoma", "trebuchet ms", "segoe ui", "courier new",
  "consolas", "menlo", "monaco", "garamond", "century gothic", "franklin gothic",
  "arial narrow", "arial black", "impact", "comic sans ms", "candara", "corbel"
]);

function resolveFontFace(family) {
  const name = (family || "Arial").trim();
  if (STANDARD_FONTS.has(name.toLowerCase())) return name;
  if (/mono|menlo|consol|courier/i.test(name)) return "Consolas";
  return "Arial";
}

// Unicode ranges where italic must be suppressed. italic is a Latin/Cyrillic/
// Greek feature; forcing it on CJK / Arabic / Hebrew / Devanagari / Thai etc.
// makes PowerPoint synthesize a deformed slanted bitmap. Convey emphasis via
// weight or accent colour on those scripts instead.
// Source: pptx-html-fidelity-audit font-discipline.md layer 5.
const NO_ITALIC_RANGES = [
  [0x3400, 0x9fff], // CJK Unified Ideographs
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0x3040, 0x30ff], // Hiragana + Katakana
  [0xac00, 0xd7af], // Hangul Syllables
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic Supplement
  [0x0900, 0x097f], // Devanagari
  [0x0980, 0x09ff], // Bengali
  [0x0a00, 0x0a7f], // Gurmukhi
  [0x0a80, 0x0aff], // Gujarati
  [0x0b00, 0x0b7f], // Oriya
  [0x0b80, 0x0bff], // Tamil
  [0x0c00, 0x0c7f], // Telugu
  [0x0c80, 0x0cff], // Kannada
  [0x0d00, 0x0d7f], // Malayalam
  [0x0e00, 0x0e7f], // Thai
  [0x0e80, 0x0eff], // Lao
  [0x1780, 0x17ff], // Khmer
];

// True when `text` contains any character from a script with no italic
// tradition.
function hasNoItalicScript(text) {
  for (const ch of String(text || "")) {
    const cp = ch.codePointAt(0);
    for (const [lo, hi] of NO_ITALIC_RANGES) {
      if (cp >= lo && cp <= hi) return true;
    }
  }
  return false;
}

// Resolve the italic flag for a run: only honor it when the run's text belongs
// to a script that actually has italics.
function safeItalic(want, text) {
  return Boolean(want) && !hasNoItalicScript(text);
}

function usage() {
  return `
Usage:
  node .agents/skills/html-to-pptx/scripts/html_to_pptx.mjs <input.html-or-url> --out <output.pptx> [options]

Options:
  --out <path>          Output PPTX path.
  --workdir <path>      Directory for screenshots, manifest, and validation output.
  --mode <image|layered>  image = full raster per slide (default, max fidelity, not editable).
                          layered = pixel-perfect background raster + editable text boxes on top.
  --width <px>          Browser viewport and stage width. Default: ${DEFAULT_WIDTH}.
  --height <px>         Browser viewport and stage height. Default: ${DEFAULT_HEIGHT}.
  --scale <number>      Device scale factor for sharper screenshots. Default: ${DEFAULT_SCALE}.
  --selector <css>      Slide selector. Default: .slide.
  --settle <ms>         Extra wait after load/media preparation. Default: 500.
  --validate            Run the Python validator after writing the PPTX.
  --python <path>       Python executable for --validate. Default: PYTHON env or python3.
`;
}

function parseArgs(argv) {
  const args = {
    mode: "image",
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    scale: DEFAULT_SCALE,
    selector: ".slide",
    settle: 500,
    validate: false,
    python: process.env.PYTHON || "python3"
  };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const key = token.slice(2);
    if (key === "validate") {
      args.validate = true;
      continue;
    }
    if (key === "help" || key === "h") {
      args.help = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    i += 1;
    if (["width", "height", "settle"].includes(key)) args[key] = Number.parseInt(value, 10);
    else if (key === "scale") args[key] = Number.parseFloat(value);
    else args[key] = value;
  }
  args.input = positional[0];
  // Normalize mode aliases.
  if (args.mode === "editable" || args.mode === "hybrid") args.mode = "layered";
  if (!["image", "layered"].includes(args.mode)) {
    throw new Error(`Unknown --mode "${args.mode}". Use image or layered.`);
  }
  if (args.help) return args;
  if (!args.input) throw new Error("Missing input HTML path or URL.");
  if (!args.out) {
    const base = isUrl(args.input)
      ? "html-to-pptx-output"
      : path.basename(args.input, path.extname(args.input));
    args.out = `${base}.pptx`;
  }
  return args;
}

function isUrl(value) {
  return /^https?:\/\//i.test(value) || /^file:\/\//i.test(value);
}

function inputToUrl(input) {
  if (/^https?:\/\//i.test(input) || /^file:\/\//i.test(input)) return input;
  const resolved = path.resolve(input);
  if (!existsSync(resolved)) throw new Error(`Input file does not exist: ${resolved}`);
  return pathToFileURL(resolved).href;
}

function defaultWorkdir(input) {
  const stem = isUrl(input) ? "remote-html" : path.basename(input, path.extname(input));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join("tmp", "html-to-pptx", `${stem}-${stamp}`);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function sha256OfFile(filePath) {
  return createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

async function waitForMedia(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Font readiness can reject for cross-origin font failures; captures should still continue.
      }
    }

    const images = Array.from(document.images || []);
    await Promise.all(images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        setTimeout(done, 2500);
      });
    }));

    const videos = Array.from(document.querySelectorAll("video"));
    await Promise.all(videos.map((video) => new Promise((resolve) => {
      const finish = () => {
        try {
          video.pause();
          if (Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = Math.min(0.1, Math.max(0, video.duration / 20));
          }
        } catch {
          // Some media elements reject currentTime before metadata is ready.
        }
        setTimeout(resolve, 120);
      };
      video.muted = true;
      video.playsInline = true;
      if (video.readyState >= 2) {
        finish();
        return;
      }
      video.addEventListener("loadeddata", finish, { once: true });
      video.addEventListener("error", finish, { once: true });
      try {
        video.load();
      } catch {
        finish();
      }
      setTimeout(finish, 3000);
    })));
  });
}

async function preparePage(page, args) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      .presentation-hotspot,
      .presentation-controls,
      .progress-bar,
      .nav-dots,
      #overview {
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      .reveal {
        opacity: 1 !important;
        transform: none !important;
      }
      .slide-stage {
        left: 0 !important;
        top: 0 !important;
        transform: none !important;
        box-shadow: none !important;
      }
    `
  });

  await page.evaluate(({ width, height }) => {
    document.documentElement.style.setProperty("--stage-scale", "1");
    document.documentElement.style.setProperty("--stage-scaled-width", `${width}px`);
    document.documentElement.style.setProperty("--stage-scaled-height", `${height}px`);
    document.querySelectorAll(".slide").forEach((slide, index) => {
      slide.classList.add("visible");
      slide.classList.toggle("active", index === 0);
      slide.style.width = `${width}px`;
      slide.style.height = `${height}px`;
    });
    document.querySelectorAll(".slide-stage").forEach((stage) => {
      stage.style.left = "0";
      stage.style.top = "0";
      stage.style.transform = "none";
      stage.style.boxShadow = "none";
    });
  }, { width: args.width, height: args.height });

  await waitForMedia(page);
  await page.waitForTimeout(args.settle);
}

// Helper injected into the page for layered (editable) extraction. Walks every
// visible, non-SVG text node, measures its rendered rect with a Range, captures
// the parent's computed typography, and can hide/restore the glyphs (color
// transparent, no reflow) so a clean background raster can be captured.
function injectExtractor() {
  return () => {
    function toHex(color) {
      const m = color && color.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(",").map((s) => parseFloat(s));
      const [r, g, b, a = 1] = parts;
      if (a === 0) return null;
      const hex = [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
      return hex.toUpperCase();
    }
    function transform(text, tt) {
      if (tt === "uppercase") return text.toUpperCase();
      if (tt === "lowercase") return text.toLowerCase();
      if (tt === "capitalize") return text.replace(/\b\w/g, (c) => c.toUpperCase());
      return text;
    }
    window.__h2p = {
      collect(root) {
        const stageRect = root.getBoundingClientRect();
        const runs = [];
        const els = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
            const p = node.parentElement;
            if (!p || p.closest("svg")) return NodeFilter.FILTER_REJECT;
            const s = getComputedStyle(p);
            if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity) === 0) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        let node;
        while ((node = walker.nextNode())) {
          const range = document.createRange();
          range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) continue;
          const p = node.parentElement;
          const s = getComputedStyle(p);
          const fontPx = parseFloat(s.fontSize) || 16;
          const text = transform(node.textContent.replace(/\s+/g, " ").trim(), s.textTransform);
          if (!text) continue;
          let align = "left";
          if (s.textAlign === "center") align = "center";
          else if (s.textAlign === "right" || s.textAlign === "end") align = "right";
          else if (s.textAlign === "justify") align = "justify";
          const lineHeightPx = s.lineHeight === "normal" ? fontPx * 1.2 : (parseFloat(s.lineHeight) || fontPx * 1.2);
          const letterPx = s.letterSpacing === "normal" ? 0 : (parseFloat(s.letterSpacing) || 0);
          runs.push({
            text,
            x: rect.left - stageRect.left,
            y: rect.top - stageRect.top,
            w: rect.width,
            h: rect.height,
            fontPx,
            weight: parseInt(s.fontWeight, 10) || 400,
            italic: s.fontStyle === "italic",
            color: toHex(s.color) || "FFFFFF",
            align,
            lineHeightPx,
            letterPx,
            family: (s.fontFamily.split(",")[0] || "Arial").replace(/["']/g, "").trim()
          });
          els.push(p);
        }
        window.__h2pEls = els;
        return { stageW: stageRect.width, stageH: stageRect.height, runs };
      },
      hide() {
        window.__h2pHidden = [];
        const seen = new Set();
        for (const el of window.__h2pEls || []) {
          if (seen.has(el)) continue;
          seen.add(el);
          window.__h2pHidden.push([el, el.style.color, el.style.getPropertyPriority("color")]);
          el.style.setProperty("color", "transparent", "important");
        }
      },
      restore() {
        for (const [el, color, prio] of window.__h2pHidden || []) {
          el.style.removeProperty("color");
          if (color) el.style.setProperty("color", color, prio);
        }
        window.__h2pHidden = [];
      }
    };
  };
}

async function getSlideMetadata(page, selector) {
  const slideCount = await page.locator(selector).count();
  if (slideCount > 0) {
    return page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).map((slide, index) => ({
      index: index + 1,
      kind: slide.getAttribute("data-slide-kind") || "",
      title: slide.querySelector("h1,h2,h3,.quote")?.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) || "",
      hasStage: Boolean(slide.querySelector(":scope > .slide-stage"))
    })), selector);
  }
  return [{
    index: 1,
    kind: "page",
    title: await page.title(),
    hasStage: false
  }];
}

function targetLocators(page, args, metadata, i) {
  const slideCount = metadata.length;
  const slideLocator = slideCount === 1 && metadata[0].kind === "page"
    ? page.locator("body")
    : page.locator(args.selector).nth(i);
  const stageLocator = metadata[i].hasStage
    ? slideLocator.locator(":scope > .slide-stage").first()
    : slideLocator;
  return { slideLocator, stageLocator };
}

async function activateSlide(page, i) {
  await page.evaluate((index) => {
    document.querySelectorAll(".slide").forEach((slide, slideIndex) => {
      slide.classList.add("visible");
      slide.classList.toggle("active", slideIndex === index);
    });
  }, i);
}

async function captureSlidesImage(page, args, screenshotsDir) {
  const metadata = await getSlideMetadata(page, args.selector);
  const captures = [];
  for (let i = 0; i < metadata.length; i += 1) {
    const number = String(i + 1).padStart(3, "0");
    const filePath = path.join(screenshotsDir, `slide-${number}.png`);
    const { stageLocator } = targetLocators(page, args, metadata, i);
    await stageLocator.scrollIntoViewIfNeeded();
    await activateSlide(page, i);
    await page.waitForTimeout(80);
    await stageLocator.screenshot({ path: filePath, animations: "disabled", timeout: 30000 });
    const imageMeta = await sharp(filePath).metadata();
    captures.push({
      ...metadata[i],
      screenshot: path.resolve(filePath),
      width: imageMeta.width,
      height: imageMeta.height,
      sha256: await sha256OfFile(filePath)
    });
  }
  return captures;
}

async function captureSlidesLayered(page, args, screenshotsDir) {
  const metadata = await getSlideMetadata(page, args.selector);
  const captures = [];
  for (let i = 0; i < metadata.length; i += 1) {
    const number = String(i + 1).padStart(3, "0");
    const fullPath = path.join(screenshotsDir, `slide-${number}.png`);
    const bgPath = path.join(screenshotsDir, `slide-${number}-bg.png`);
    const { stageLocator } = targetLocators(page, args, metadata, i);
    const stageHandle = await stageLocator.elementHandle();

    await stageLocator.scrollIntoViewIfNeeded();
    await activateSlide(page, i);
    await page.waitForTimeout(80);

    // 1. Full reference screenshot (text visible) for validation/diff.
    await stageLocator.screenshot({ path: fullPath, animations: "disabled", timeout: 30000 });

    // 2. Extract editable text runs, then hide glyphs and capture the clean background.
    const extracted = await page.evaluate((el) => window.__h2p.collect(el), stageHandle);
    await page.evaluate(() => window.__h2p.hide());
    await page.waitForTimeout(20);
    await stageLocator.screenshot({ path: bgPath, animations: "disabled", timeout: 30000 });
    await page.evaluate(() => window.__h2p.restore());

    const imageMeta = await sharp(fullPath).metadata();
    captures.push({
      ...metadata[i],
      screenshot: path.resolve(fullPath),
      background: path.resolve(bgPath),
      width: imageMeta.width,
      height: imageMeta.height,
      sha256: await sha256OfFile(fullPath),
      backgroundSha256: await sha256OfFile(bgPath),
      stageW: extracted.stageW,
      stageH: extracted.stageH,
      textRuns: extracted.runs
    });
  }
  return captures;
}

function definePptx(args, outPath) {
  const pptx = new PptxGenJS();
  const slideWidth = Number.parseFloat(args.slideWidth || "13.333333");
  const slideHeight = Number.parseFloat(args.slideHeight || String(slideWidth * (args.height / args.width)));
  pptx.defineLayout({ name: "HTML_RENDER", width: slideWidth, height: slideHeight });
  pptx.layout = "HTML_RENDER";
  pptx.author = "html-to-pptx skill";
  pptx.subject = `Converted from ${args.input}`;
  pptx.title = path.basename(outPath, ".pptx");
  pptx.lang = "en-US";
  pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial", lang: "en-US" };
  return { pptx, slideWidth, slideHeight };
}

async function writePptxImage(args, captures, outPath) {
  const { pptx, slideWidth, slideHeight } = definePptx(args, outPath);
  captures.forEach((capture) => {
    const slide = pptx.addSlide();
    slide.background = { color: "000000" };
    slide.addImage({
      path: capture.screenshot,
      x: 0,
      y: 0,
      w: slideWidth,
      h: slideHeight,
      altText: `Rendered HTML slide ${capture.index}${capture.kind ? ` (${capture.kind})` : ""}`
    });
    slide.addNotes(`Source: ${args.input}\nSlide: ${capture.index}\nKind: ${capture.kind || "slide"}`);
  });
  await ensureDir(path.dirname(outPath));
  await pptx.writeFile({ fileName: outPath });
  return {
    mode: "image",
    slideWidthIn: slideWidth,
    slideHeightIn: slideHeight,
    slideWidthEmu: Math.round(slideWidth * EMU_PER_INCH),
    slideHeightEmu: Math.round(slideHeight * EMU_PER_INCH)
  };
}

async function writePptxLayered(args, captures, outPath) {
  const { pptx, slideWidth, slideHeight } = definePptx(args, outPath);
  let totalRuns = 0;

  captures.forEach((capture) => {
    const slide = pptx.addSlide();
    slide.background = { color: "000000" };

    // Layer 1: pixel-perfect background raster (charts, photos, borders, labels)
    // with the editable text glyphs removed.
    slide.addImage({
      path: capture.background || capture.screenshot,
      x: 0,
      y: 0,
      w: slideWidth,
      h: slideHeight,
      altText: `Background for slide ${capture.index}${capture.kind ? ` (${capture.kind})` : ""}`
    });

    // Layer 2: editable text boxes positioned over their original geometry.
    const stageW = capture.stageW || args.width;
    const stageH = capture.stageH || args.height;
    const inPerPxX = slideWidth / stageW;
    const inPerPxY = slideHeight / stageH;
    const ptPerPx = inPerPxX * PT_PER_INCH;

    for (const run of capture.textRuns || []) {
      totalRuns += 1;
      const fontSize = Math.max(1, Math.round(run.fontPx * ptPerPx * 10) / 10);
      const lineMult = Math.max(0.6, Math.min(2.4, run.lineHeightPx / run.fontPx));
      const charSpacing = run.letterPx ? Math.round(run.letterPx * ptPerPx * 10) / 10 : 0;
      // Single-line runs must never re-wrap: target-font metrics differ slightly
      // from the browser's, and a too-tight box would push the last glyph onto a
      // new line. Only let genuinely multi-line source text wrap.
      const isMultiLine = run.h > run.lineHeightPx * 1.5;
      // Safety pad on width keeps the target font (slightly wider than Chromium's)
      // from breaking one word onto an extra line. Wider pad for bigger fonts.
      const padX = isMultiLine ? Math.min(0.22, run.w * inPerPxX * 0.06) : 0;
      let x = run.x * inPerPxX;
      if (isMultiLine && run.align === "center") x -= padX / 2;
      else if (isMultiLine && run.align === "right") x -= padX;
      const opts = {
        x: Math.max(0, x),
        y: Math.max(0, run.y * inPerPxY),
        w: Math.max(0.05, run.w * inPerPxX + padX),
        h: Math.max(0.05, run.h * inPerPxY),
        fontSize,
        bold: run.weight >= 600,
        // Suppress synthesized italic on scripts with no italic tradition
        // (CJK / Arabic / Hebrew / Devanagari / Thai …). See font-discipline
        // layer 5: a fake slant on those scripts renders as a deformed bitmap.
        italic: safeItalic(run.italic, run.text),
        color: run.color || "FFFFFF",
        align: run.align === "justify" ? "left" : run.align,
        valign: "top",
        fontFace: resolveFontFace(run.family),
        margin: 0,
        lineSpacingMultiple: lineMult,
        wrap: isMultiLine,
        // Multi-line text: if the target font still needs an extra line, shrink it
        // to stay inside its original band instead of overflowing onto the element
        // below. Single-line runs never wrap, so they keep their exact size.
        fit: isMultiLine ? "shrink" : "none",
        isTextBox: true
      };
      if (charSpacing) opts.charSpacing = charSpacing;
      slide.addText(run.text, opts);
    }

    slide.addNotes(`Source: ${args.input}\nSlide: ${capture.index}\nKind: ${capture.kind || "slide"}\nEditable text boxes: ${(capture.textRuns || []).length}`);
  });

  await ensureDir(path.dirname(outPath));
  await pptx.writeFile({ fileName: outPath });
  return {
    mode: "layered",
    slideWidthIn: slideWidth,
    slideHeightIn: slideHeight,
    slideWidthEmu: Math.round(slideWidth * EMU_PER_INCH),
    slideHeightEmu: Math.round(slideHeight * EMU_PER_INCH),
    totalTextBoxes: totalRuns
  };
}

async function runValidator(args, manifestPath, outPath, workdir) {
  const reportPath = path.join(workdir, "validation-report.json");
  const contactSheetPath = path.join(workdir, "contact-sheet.png");
  const validator = path.join(SKILL_DIR, "scripts", "validate_html_to_pptx.py");
  const procArgs = [
    validator,
    "--pptx", outPath,
    "--manifest", manifestPath,
    "--report", reportPath,
    "--contact-sheet", contactSheetPath
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(args.python, procArgs, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`Validator exited with code ${code}`));
      else resolve({ reportPath, contactSheetPath });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  const inputUrl = inputToUrl(args.input);
  const workdir = path.resolve(args.workdir || defaultWorkdir(args.input));
  const screenshotsDir = path.join(workdir, "screenshots");
  const outPath = path.resolve(args.out);
  await ensureDir(screenshotsDir);

  const browser = await chromium.launch({ headless: true });
  let captures;
  try {
    const context = await browser.newContext({
      viewport: { width: args.width, height: args.height },
      deviceScaleFactor: args.scale,
      colorScheme: "dark"
    });
    const page = await context.newPage();
    await page.goto(inputUrl, { waitUntil: "load", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await preparePage(page, args);
    if (args.mode === "layered") {
      await page.evaluate(injectExtractor());
      captures = await captureSlidesLayered(page, args, screenshotsDir);
    } else {
      captures = await captureSlidesImage(page, args, screenshotsDir);
    }
    await context.close();
  } finally {
    await browser.close();
  }

  const pptxInfo = args.mode === "layered"
    ? await writePptxLayered(args, captures, outPath)
    : await writePptxImage(args, captures, outPath);

  const manifest = {
    tool: "html-to-pptx",
    version: 2,
    mode: args.mode,
    createdAt: new Date().toISOString(),
    input: path.resolve(args.input),
    inputUrl,
    output: outPath,
    workdir,
    viewport: { width: args.width, height: args.height, scale: args.scale },
    pptx: pptxInfo,
    slideCount: captures.length,
    slides: captures
  };
  const manifestPath = path.join(workdir, "manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Mode: ${args.mode}`);
  console.log(`Wrote PPTX: ${outPath}`);
  console.log(`Captured slides: ${captures.length}`);
  if (args.mode === "layered") {
    console.log(`Editable text boxes: ${pptxInfo.totalTextBoxes}`);
  }
  console.log(`Manifest: ${manifestPath}`);

  if (args.validate) {
    const result = await runValidator(args, manifestPath, outPath, workdir);
    console.log(`Validation report: ${result.reportPath}`);
    console.log(`Contact sheet: ${result.contactSheetPath}`);
  }
}

// Pure helpers exported for unit tests; importing the module no longer runs the
// CLI (the main() guard below handles that).
export { resolveFontFace, hasNoItalicScript, safeItalic, NO_ITALIC_RANGES };

// Only drive the CLI when invoked directly (not when imported by a test).
const invokedDirectly =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message);
    console.error(usage());
    process.exit(1);
  });
}
