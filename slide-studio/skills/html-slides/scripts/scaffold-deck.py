#!/usr/bin/env python3
"""Scaffold a Slide Player deck for any stable html-slides theme.

The scaffold derives from the theme's verified `example.html` (the source of
truth) so every generated deck is brand-compliant and on the player model
(ADR 0005/0006): it rewrites the example's relative asset paths to absolute so
the deck renders from any output location, applies the requested title, and
re-inlines the canonical shell via `scripts/shell.py`.

Use this for a quick on-theme starting deck or for the audit. To author real
content, copy `themes/<id>/example.html`, replace the slides, and reshell.
"""

from __future__ import annotations

import argparse
import html as _html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import shell as shell_mod  # noqa: E402

SKILL_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = SKILL_ROOT / "themes" / "themes.json"


def load_stable_themes() -> list[str]:
    data = json.loads(MANIFEST_PATH.read_text())
    return [t["id"] for t in data["themes"] if t.get("status") == "stable"]


def _is_local(url: str) -> bool:
    return not url.startswith(
        ("http://", "https://", "data:", "#", "mailto:", "//", "/")
    )


def rewrite_assets(html: str, base: Path) -> str:
    """Rewrite relative local asset URLs to absolute filesystem paths so the
    scaffold renders from any output directory. http(s)/data/anchor URLs and
    already-absolute paths are left untouched."""

    def to_abs(url: str) -> str:
        path = url.split("?", 1)[0].split("#", 1)[0]
        return str((base / path).resolve())

    def attr_sub(m: re.Match) -> str:
        attr, quote, val = m.group(1), m.group(2), m.group(3)
        return m.group(0) if not _is_local(val) else f"{attr}={quote}{to_abs(val)}{quote}"

    def url_sub(m: re.Match) -> str:
        quote, val = m.group(1), m.group(2)
        return m.group(0) if not _is_local(val) else f"url({quote}{to_abs(val)}{quote})"

    html = re.sub(r'(src|href)=(["\'])([^"\']+)\2', attr_sub, html)
    html = re.sub(r"url\((['\"]?)([^'\")]+)\1\)", url_sub, html)
    return html


def build(theme: str, title: str) -> str:
    example = SKILL_ROOT / "themes" / theme / "example.html"
    if not example.exists():
        raise SystemExit(f"no example for theme '{theme}' at {example}")
    html = example.read_text(encoding="utf-8")
    html = rewrite_assets(html, example.parent)
    esc = _html.escape(title, quote=True)
    html = re.sub(r"<title>.*?</title>", f"<title>{esc}</title>", html, count=1, flags=re.DOTALL)
    html = re.sub(r'(data-deck-title=)"[^"]*"', lambda m: f'{m.group(1)}"{esc}"', html, count=1)
    return shell_mod.inline_shell(html)  # re-inline canonical shell (freshness)


def main() -> int:
    themes = load_stable_themes()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", nargs="?")
    parser.add_argument("--title", default="FY26 yield recovery plan")
    parser.add_argument("--theme", default=themes[0], choices=themes)
    parser.add_argument("--slides", type=int, default=5,
                        help="kept for CLI compatibility; the scaffold derives the full example deck")
    parser.add_argument("--title-template", default=None, help="ignored (kept for compatibility)")
    parser.add_argument("--list-themes", action="store_true")
    args = parser.parse_args()

    if args.list_themes:
        for theme in themes:
            print(theme)
        return 0

    output = Path(args.output) if args.output else Path(f"{args.theme}-scaffold.html")
    if output.suffix == "":
        output = output.with_suffix(".html")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(build(args.theme, args.title), encoding="utf-8")
    print(f"Wrote {output} (theme: {args.theme}, derived from example)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
