#!/usr/bin/env python3
"""Generate and verify every stable html-slides theme.

Runs two contracts:
1. shipped examples under themes/<id>/example.html
2. freshly scaffolded decks from scripts/scaffold-deck.py

The script leaves logs and screenshots under the chosen output directory.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parent.parent
THEMES_PATH = SKILL_ROOT / "themes" / "themes.json"
SCAFFOLD = SKILL_ROOT / "scripts" / "scaffold-deck.py"
VERIFY = SKILL_ROOT / "scripts" / "verify.py"
DEFAULT_VIEWPORTS = "1280x720,375x667,1127x1084"


def stable_themes() -> list[str]:
    data = json.loads(THEMES_PATH.read_text())
    return [t["id"] for t in data["themes"] if t.get("status") == "stable"]


def run(cmd: list[str], log: Path) -> int:
    log.parent.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    log.write_text(proc.stdout)
    return proc.returncode


def verify_deck(deck: Path, theme: str, screenshots: Path, log: Path, viewports: str, slides: int) -> int:
    return run(
        [
            "uv",
            "run",
            str(VERIFY),
            str(deck),
            "--theme",
            theme,
            "--viewports",
            viewports,
            "--slides",
            str(slides),
            "--check-overview",
            "--fail-on-warnings",
            "--output",
            str(screenshots),
        ],
        log,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="tmp/html-slides-audit")
    parser.add_argument("--viewports", default=DEFAULT_VIEWPORTS)
    parser.add_argument("--slides", type=int, default=5)
    parser.add_argument("--skip-examples", action="store_true")
    parser.add_argument("--skip-generated", action="store_true")
    args = parser.parse_args()

    root = Path(args.output)
    themes = stable_themes()
    failures: list[str] = []

    for theme in themes:
        if not args.skip_examples:
            deck = SKILL_ROOT / "themes" / theme / "example.html"
            code = verify_deck(
                deck,
                theme,
                root / "screenshots" / "examples" / theme,
                root / "logs" / "examples" / f"{theme}.log",
                args.viewports,
                args.slides,
            )
            if code:
                failures.append(f"example:{theme}")

        if not args.skip_generated:
            out = root / "generated" / f"{theme}.html"
            out.parent.mkdir(parents=True, exist_ok=True)
            code = run(
                [
                    sys.executable,
                    str(SCAFFOLD),
                    str(out),
                    "--theme",
                    theme,
                    "--title",
                    "FY26 yield recovery plan",
                    "--slides",
                    str(args.slides),
                ],
                root / "logs" / "generated" / f"{theme}.scaffold.log",
            )
            if code:
                failures.append(f"scaffold:{theme}")
            else:
                code = verify_deck(
                    out,
                    theme,
                    root / "screenshots" / "generated" / theme,
                    root / "logs" / "generated" / f"{theme}.verify.log",
                    args.viewports,
                    args.slides,
                )
                if code:
                    failures.append(f"generated:{theme}")

    if failures:
        print("FAILED")
        for item in failures:
            print(f"- {item}")
        print(f"Logs: {root / 'logs'}")
        return 1

    print(f"OK: {len(themes)} stable themes verified")
    print(f"Screenshots: {root / 'screenshots'}")
    print(f"Logs: {root / 'logs'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
