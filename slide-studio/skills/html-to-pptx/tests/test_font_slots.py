"""Unit tests for the html-to-pptx validator's CJK/complex-script font-slot
discipline (issue #2 AC2).

Covers:
  - script_demand: which non-Latin typeface slots a run requires.
  - audit_font_slots: missing a:ea / a:cs slots and fallback faces are flagged,
    and the gate is a no-op on Latin-only decks.
  - slide_text_info: per-run typeface slots are read out of real slide XML.

Run: python3 -m unittest discover -s skills/html-to-pptx/tests
"""
import importlib.util
import io
import unittest
import zipfile
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = SKILL_ROOT / "scripts" / "validate_html_to_pptx.py"

_spec = importlib.util.spec_from_file_location("validate_html_to_pptx", VALIDATOR)
validator = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(validator)


def _slide_xml(runs):
    """Build a one-shape slide XML where `runs` is a list of dicts with keys
    text + optional latin/ea/cs typefaces."""
    A = "http://schemas.openxmlformats.org/drawingml/2006/main"
    body = []
    for r in runs:
        faces = ""
        if r.get("latin"):
            faces += f'<a:latin typeface="{r["latin"]}"/>'
        if r.get("ea"):
            faces += f'<a:ea typeface="{r["ea"]}"/>'
        if r.get("cs"):
            faces += f'<a:cs typeface="{r["cs"]}"/>'
        body.append(f'<a:r><a:rPr>{faces}</a:rPr><a:t>{r["text"]}</a:t></a:r>')
    return (
        f'<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
        f'xmlns:a="{A}"><p:cSld><p:spTree><p:sp><p:spPr>'
        f'<a:xfrm><a:off x="100" y="100"/><a:ext cx="500" cy="500"/></a:xfrm>'
        f'</p:spPr><p:txBody><a:bodyPr/>'
        f'<a:p>{"".join(body)}</a:p>'
        f"</p:txBody></p:sp></p:spTree></p:cSld></p:sld>"
    )


def _zip_with_slide(xml):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("ppt/slides/slide1.xml", xml)
    buf.seek(0)
    return zipfile.ZipFile(buf, "r")


class ScriptDemandTests(unittest.TestCase):
    def test_latin_demands_nothing(self):
        self.assertEqual(validator.script_demand("Quarterly review"), (False, False))

    def test_cjk_demands_ea(self):
        self.assertEqual(validator.script_demand("四半期"), (True, False))

    def test_arabic_demands_cs(self):
        self.assertEqual(validator.script_demand("مراجعة"), (False, True))

    def test_mixed_demands_both(self):
        needs_ea, needs_cs = validator.script_demand("Q4 売上 مراجعة")
        self.assertTrue(needs_ea and needs_cs)


class AuditFontSlotsTests(unittest.TestCase):
    def test_latin_only_deck_is_a_noop(self):
        boxes = [{"runs": [{"text": "Hello world", "latin": "Arial"}]}]
        has_non_latin, slots, fallbacks = validator.audit_font_slots(boxes)
        self.assertFalse(has_non_latin)
        self.assertEqual(slots, [])
        self.assertEqual(fallbacks, [])

    def test_cjk_run_missing_ea_slot_is_flagged(self):
        boxes = [{"runs": [{"text": "四半期レビュー", "latin": "Noto Sans"}]}]
        has_non_latin, slots, _ = validator.audit_font_slots(boxes)
        self.assertTrue(has_non_latin)
        self.assertTrue(any(slot == "a:ea" for _, slot in slots))

    def test_cjk_run_with_ea_slot_passes(self):
        boxes = [{"runs": [{"text": "四半期", "latin": "Noto Sans", "ea": "Noto Sans CJK JP"}]}]
        _, slots, fallbacks = validator.audit_font_slots(boxes)
        self.assertEqual(slots, [])
        self.assertEqual(fallbacks, [])

    def test_complex_script_missing_cs_slot_is_flagged(self):
        boxes = [{"runs": [{"text": "สวัสดี", "latin": "Arial"}]}]
        _, slots, _ = validator.audit_font_slots(boxes)
        self.assertTrue(any(slot == "a:cs" for _, slot in slots))

    def test_fallback_face_on_non_latin_run_is_flagged(self):
        boxes = [{"runs": [{"text": "回顾", "ea": "Microsoft JhengHei"}]}]
        _, _, fallbacks = validator.audit_font_slots(boxes)
        self.assertTrue(any(face == "Microsoft JhengHei" for _, face in fallbacks))

    def test_fallback_face_on_latin_only_deck_is_ignored(self):
        # Arial is a legitimate Latin face; only flag it once non-Latin
        # content is present in the deck.
        boxes = [{"runs": [{"text": "Hello", "latin": "Arial"}]}]
        _, _, fallbacks = validator.audit_font_slots(boxes)
        self.assertEqual(fallbacks, [])


class SlideTextInfoTests(unittest.TestCase):
    def test_reads_all_three_typeface_slots(self):
        xml = _slide_xml([
            {"text": "Q4 ", "latin": "Source Sans 3"},
            {"text": "売上", "latin": "Source Sans 3", "ea": "Noto Sans CJK JP"},
        ])
        zf = _zip_with_slide(xml)
        boxes = validator.slide_text_info(zf, "ppt/slides/slide1.xml", 12192000, 6858000)
        self.assertEqual(len(boxes), 1)
        runs = boxes[0]["runs"]
        self.assertEqual(len(runs), 2)
        self.assertEqual(runs[1]["ea"], "Noto Sans CJK JP")
        # And the audit on the parsed boxes is clean (slots declared).
        _, slots, fallbacks = validator.audit_font_slots(boxes)
        self.assertEqual(slots, [])
        self.assertEqual(fallbacks, [])

    def test_audit_catches_dropped_ea_slot_from_real_xml(self):
        xml = _slide_xml([
            {"text": "売上レポート", "latin": "Source Sans 3"},  # no a:ea
        ])
        zf = _zip_with_slide(xml)
        boxes = validator.slide_text_info(zf, "ppt/slides/slide1.xml", 12192000, 6858000)
        has_non_latin, slots, _ = validator.audit_font_slots(boxes)
        self.assertTrue(has_non_latin)
        self.assertTrue(any(slot == "a:ea" for _, slot in slots))


if __name__ == "__main__":
    unittest.main()
