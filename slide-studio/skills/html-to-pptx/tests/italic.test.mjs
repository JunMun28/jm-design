/* Unit tests for html-to-pptx script-safe italic suppression (issue #2 AC3).
   The converter must drop italic on runs whose text belongs to a script with
   no italic tradition. Run: node --test */
import test from "node:test";
import assert from "node:assert/strict";
import {
  hasNoItalicScript,
  safeItalic,
  resolveFontFace,
} from "../scripts/html_to_pptx.mjs";

test("hasNoItalicScript: Latin / Cyrillic / Greek keep italic eligibility", () => {
  assert.equal(hasNoItalicScript("Quarterly review"), false);
  assert.equal(hasNoItalicScript("Обзор"), false);
  assert.equal(hasNoItalicScript("Ανάλυση"), false);
});

test("hasNoItalicScript: CJK / Arabic / Hebrew / Thai / Devanagari flagged", () => {
  assert.equal(hasNoItalicScript("四半期レビュー"), true); // Japanese
  assert.equal(hasNoItalicScript("季度回顾"), true); // Chinese
  assert.equal(hasNoItalicScript("분기별"), true); // Korean
  assert.equal(hasNoItalicScript("مراجعة"), true); // Arabic
  assert.equal(hasNoItalicScript("סקירה"), true); // Hebrew
  assert.equal(hasNoItalicScript("รายไตรมาส"), true); // Thai
  assert.equal(hasNoItalicScript("समीक्षा"), true); // Devanagari
});

test("safeItalic: CSS italic is honored only on italic-tradition scripts", () => {
  // CSS said italic, but the run is CJK -> PowerPoint would synthesize a
  // deformed slant, so we drop it.
  assert.equal(safeItalic(true, "重点说明"), false);
  // CSS said italic and the run is Latin -> keep it.
  assert.equal(safeItalic(true, "key takeaway"), true);
  // CSS did not request italic -> never forced on.
  assert.equal(safeItalic(false, "key takeaway"), false);
});

test("safeItalic: mixed Latin+CJK run drops italic (whole-run granularity)", () => {
  assert.equal(safeItalic(true, "Q4 売上"), false);
});

test("resolveFontFace still maps unknown families to safe PowerPoint fonts", () => {
  assert.equal(resolveFontFace("Arial"), "Arial");
  assert.equal(resolveFontFace("Micron Basis"), "Arial");
  assert.equal(resolveFontFace("JetBrains Mono"), "Consolas");
});
