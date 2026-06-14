import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import importlib
dm = importlib.import_module("deck_meta")


class DeckMetaTests(unittest.TestCase):
    def test_variant_name(self):
        self.assertEqual(dm.variant_name("AI Agents", "micron-dark"), "ai-agents.micron-dark.html")
        self.assertEqual(dm.variant_name("Q3  Review!", "playful"), "q3-review.playful.html")

    def test_stamp_inserts_after_head(self):
        html = "<!DOCTYPE html>\n<html><head><meta charset='utf-8'></head><body></body></html>"
        out = dm.stamp(html, "docs/brainstorms/x-brainstorm.html", "micron-dark", "2026-06-14")
        self.assertIn("<!-- SOURCE: docs/brainstorms/x-brainstorm.html", out)
        self.assertIn("THEME: micron-dark", out)
        self.assertEqual(out.count("<!-- SOURCE:"), 1)

    def test_stamp_is_idempotent(self):
        html = "<!DOCTYPE html>\n<html><head></head><body></body></html>"
        once = dm.stamp(html, "a.html", "playful", "2026-06-14")
        twice = dm.stamp(once, "b.html", "micron-light", "2026-06-15")
        self.assertEqual(twice.count("<!-- SOURCE:"), 1)
        self.assertIn("b.html", twice)
        self.assertIn("THEME: micron-light", twice)

    def test_read_stamp(self):
        html = dm.stamp("<html><head></head><body></body></html>", "a.html", "playful", "2026-06-14")
        meta = dm.read_stamp(html)
        self.assertEqual(meta["source"], "a.html")
        self.assertEqual(meta["theme"], "playful")

    def test_read_stamp_absent(self):
        self.assertIsNone(dm.read_stamp("<html></html>"))


if __name__ == "__main__":
    unittest.main()
