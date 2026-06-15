import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SK = Path(__file__).resolve().parents[1]
BUILD = SK / "scripts" / "build-deck.py"


class BuildStampTests(unittest.TestCase):
    def test_new_with_source_and_theme_writes_stamp(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "demo.micron-dark.html"
            subprocess.run(
                [sys.executable, str(BUILD), "new", "--title", "Demo",
                 "--output", str(out), "--source", "docs/brainstorms/demo-brainstorm.html",
                 "--theme", "micron-dark"],
                check=True, cwd=str(SK), capture_output=True, text=True,
            )
            html = out.read_text()
            self.assertIn("<!-- SOURCE: docs/brainstorms/demo-brainstorm.html", html)
            self.assertIn("THEME: micron-dark", html)


if __name__ == "__main__":
    unittest.main()
