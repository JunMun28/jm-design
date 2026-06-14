import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import importlib
verify = importlib.import_module("verify")


class StampNoteTests(unittest.TestCase):
    def test_missing_stamp_adds_note(self):
        src = '<div class="deck"><section class="slide title-slide"><h1>x</h1></section></div>'
        errors, notes = verify.check_shell_and_notes(src, require_shell=False)
        self.assertTrue(any("source-link stamp" in n for n in notes))

    def test_present_stamp_no_note(self):
        src = ('<!-- SOURCE: docs/brainstorms/x-brainstorm.html · THEME: micron-dark -->'
               '<div class="deck"><section class="slide title-slide"><h1>x</h1></section></div>')
        errors, notes = verify.check_shell_and_notes(src, require_shell=False)
        self.assertFalse(any("source-link stamp" in n for n in notes))


if __name__ == "__main__":
    unittest.main()
