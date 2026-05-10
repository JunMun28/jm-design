#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/export-pdf.sh <deck.html> [out.pdf] [--compact]" >&2
  exit 1
fi

INPUT_HTML="$1"
shift || true

VIEWPORT_W=1920
VIEWPORT_H=1080
OUTPUT_PDF=""
for arg in "$@"; do
  case "$arg" in
    --compact)
      VIEWPORT_W=1280
      VIEWPORT_H=720
      ;;
    *)
      OUTPUT_PDF="$arg"
      ;;
  esac
done

if [[ ! -f "$INPUT_HTML" ]]; then
  echo "File not found: $INPUT_HTML" >&2
  exit 1
fi

INPUT_HTML="$(cd "$(dirname "$INPUT_HTML")" && pwd)/$(basename "$INPUT_HTML")"
OUTPUT_PDF="${OUTPUT_PDF:-${INPUT_HTML%.html}.pdf}"
mkdir -p "$(dirname "$OUTPUT_PDF")"
OUTPUT_PDF="$(cd "$(dirname "$OUTPUT_PDF")" && pwd)/$(basename "$OUTPUT_PDF")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js required." >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cat > "$TMP_DIR/package.json" <<'JSON'
{ "private": true, "type": "module", "dependencies": { "playwright": "latest" } }
JSON

npm --prefix "$TMP_DIR" install >/dev/null
npx --prefix "$TMP_DIR" playwright install chromium >/dev/null

cat > "$TMP_DIR/export.mjs" <<'JS'
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join } from 'path';

const [inputHtml, outputPdf, widthArg, heightArg, tmpDir] = process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const serveDir = dirname(inputHtml);
const htmlName = basename(inputHtml);
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url || '/');
  const file = join(serveDir, url === '/' ? htmlName : url);
  try {
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

const port = await new Promise(resolve => server.listen(0, () => resolve(server.address().port)));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts && document.fonts.ready);

const slideCount = await page.locator('.slide').count();
if (!slideCount) throw new Error('No .slide elements found.');
mkdirSync(join(tmpDir, 'shots'), { recursive: true });
const shots = [];

for (let index = 0; index < slideCount; index += 1) {
  await page.evaluate((index) => {
    if (window.presentation?.goTo) {
      window.presentation.goTo(index, { immediate: true });
    } else {
      document.querySelectorAll('.slide')[index]?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    document.querySelectorAll('.slide')[index]?.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }, index);
  await page.waitForTimeout(250);
  const shot = join(tmpDir, 'shots', `slide-${String(index + 1).padStart(3, '0')}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  shots.push(shot);
}

await browser.close();
server.close();

const pages = shots.map(shot => {
  const src = readFileSync(shot).toString('base64');
  return `<section><img src="data:image/png;base64,${src}" /></section>`;
}).join('');
const pdfHtml = `<!doctype html><html><head><style>
@page{size:${width}px ${height}px;margin:0}
*{box-sizing:border-box}body{margin:0}section{width:${width}px;height:${height}px;page-break-after:always;overflow:hidden}section:last-child{page-break-after:auto}img{display:block;width:100%;height:100%;object-fit:contain}
</style></head><body>${pages}</body></html>`;
writeFileSync(join(tmpDir, 'pdf.html'), pdfHtml);

const pdfBrowser = await chromium.launch();
const pdfPage = await pdfBrowser.newPage({ viewport: { width, height } });
await pdfPage.goto(`file://${join(tmpDir, 'pdf.html')}`, { waitUntil: 'load' });
await pdfPage.pdf({ path: outputPdf, width: `${width}px`, height: `${height}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await pdfBrowser.close();
console.log(outputPdf);
JS

node "$TMP_DIR/export.mjs" "$INPUT_HTML" "$OUTPUT_PDF" "$VIEWPORT_W" "$VIEWPORT_H" "$TMP_DIR"
