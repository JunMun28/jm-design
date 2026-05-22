import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = SKILL_ROOT.parents[2]
SOURCE_DIR = REPO_ROOT / "tmp" / "icons"
MANIFEST_PATH = SKILL_ROOT / "assets" / "manifest.json"
FINDER = SKILL_ROOT / "bin" / "find-icon.py"
EXTRACTOR = SKILL_ROOT / "bin" / "extract-icons.py"


class MicronIconsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads(MANIFEST_PATH.read_text())

    def test_manifest_counts(self):
        icons = self.manifest["icons"]
        primary_png = [i for i in icons if i["set"] == "primary" and i["media"] == "png"]
        primary_mp4 = [i for i in icons if i["set"] == "primary" and i["media"] == "mp4"]
        secondary_png = [i for i in icons if i["set"] == "secondary" and i["media"] == "png"]
        self.assertEqual(len(primary_png), 130)
        self.assertEqual(len(primary_mp4), 120)
        self.assertEqual(len(secondary_png), 142)

    def test_extractor_rebuild_counts(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "assets"
            subprocess.run(
                ["python3", str(EXTRACTOR), "--source-dir", str(SOURCE_DIR), "--output-dir", str(output), "--force"],
                check=True,
                stdout=subprocess.PIPE,
                text=True,
            )
            manifest = json.loads((output / "manifest.json").read_text())
            self.assertEqual(len([i for i in manifest["icons"] if i["set"] == "primary" and i["media"] == "png"]), 130)
            self.assertEqual(len([i for i in manifest["icons"] if i["set"] == "primary" and i["media"] == "mp4"]), 120)
            self.assertEqual(len([i for i in manifest["icons"] if i["set"] == "secondary" and i["media"] == "png"]), 142)

    def test_known_mp4_anomalies_map_to_canonical_slugs(self):
        by_source = {
            (i["source_slug"], i["style"]): i
            for i in self.manifest["icons"]
            if i["media"] == "mp4"
        }
        self.assertEqual(by_source[("healthy-safety", "pos")]["canonical_slug"], "health-safety")
        self.assertEqual(by_source[("storgage-generic", "rev")]["canonical_slug"], "storage-generic")
        self.assertEqual(by_source[("visual-analyitics", "rev")]["canonical_slug"], "visual-analytics")
        self.assertIn("style-mismatch-folder-authoritative", by_source[("cpu-gpu", "rev")]["anomalies"])

    def test_finder_group_is_deterministic_and_theme_sets_rev_png(self):
        cmd = [
            "python3",
            str(FINDER),
            "--group",
            "technical-capability",
            "--theme",
            "micron-dark",
            "--limit",
            "3",
        ]
        first = subprocess.check_output(cmd, text=True).splitlines()
        second = subprocess.check_output(cmd, text=True).splitlines()
        self.assertEqual(first, second)
        self.assertEqual(len(first), 3)
        self.assertTrue(all("/png/rev/" in path for path in first))

    def test_finder_defaults_to_png_unless_mp4_requested(self):
        png = subprocess.check_output(["python3", str(FINDER), "wafer", "--style", "pos"], text=True).strip()
        mp4 = subprocess.check_output(["python3", str(FINDER), "wafer", "--style", "pos", "--media", "mp4"], text=True).strip()
        self.assertTrue(png.endswith(".png"))
        self.assertTrue(mp4.endswith(".mp4"))

    def test_preview_loads_manifest_path(self):
        preview = (SKILL_ROOT / "preview.html").read_text()
        self.assertIn('fetch("assets/manifest.json")', preview)
        self.assertIn("semanticSnippet", preview)
        self.assertIn("decorativeSnippet", preview)


if __name__ == "__main__":
    unittest.main()
