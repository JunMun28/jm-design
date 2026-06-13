#!/usr/bin/env python3
"""Canonical Deck Shell inliner — the single sanctioned path for the shell into
a deck.

The shell lives in ONE place (`assets/shell.css` + `assets/shell.js`). A deck
carries marker pairs; `inline_shell()` fills them with the canonical shell,
producing a self-contained single-file `.html`. Re-running it ("reshell")
refreshes an existing marked deck. `verify.py` calls `shell_status()` to fail
any deck whose inlined shell has drifted from canonical (see ADR 0005).

This module has no third-party dependencies so both `build-deck.py` and the
`uv`-run `verify.py` can import it.
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
SHELL_CSS = SKILL_ROOT / "assets" / "shell.css"
SHELL_JS = SKILL_ROOT / "assets" / "shell.js"

CSS_OPEN, CSS_CLOSE = "<!-- SHELL:CSS -->", "<!-- /SHELL:CSS -->"
JS_OPEN, JS_CLOSE = "<!-- SHELL:JS -->", "<!-- /SHELL:JS -->"


def _norm(s: str) -> str:
    """Normalize for drift comparison: strip trailing whitespace per line and
    surrounding blank lines, so cosmetic re-inlining never reads as drift."""
    return "\n".join(line.rstrip() for line in s.strip().splitlines())


def read_shell() -> tuple[str, str]:
    return SHELL_CSS.read_text(encoding="utf-8"), SHELL_JS.read_text(encoding="utf-8")


def canonical_hash() -> str:
    css, js = read_shell()
    h = hashlib.sha256()
    h.update(_norm(css).encode("utf-8"))
    h.update(b"\x00")
    h.update(_norm(js).encode("utf-8"))
    return h.hexdigest()


def _replace_block(html: str, open_m: str, close_m: str, inner: str) -> str:
    pattern = re.compile(re.escape(open_m) + r".*?" + re.escape(close_m), re.DOTALL)
    block = f"{open_m}\n{inner}\n{close_m}"
    if not pattern.search(html):
        raise ValueError(f"missing marker pair {open_m} … {close_m}")
    return pattern.sub(lambda _m: block, html, count=1)


def inline_shell(html: str) -> str:
    """Inline the canonical shell into a marked deck. Idempotent."""
    css, js = read_shell()
    css_inner = f'<style id="shell-css">\n{css.strip()}\n</style>'
    js_inner = f'<script id="shell-js">\n{js.strip()}\n</script>'
    html = _replace_block(html, CSS_OPEN, CSS_CLOSE, css_inner)
    html = _replace_block(html, JS_OPEN, JS_CLOSE, js_inner)
    return html


def _extract_inner(html: str, open_m: str, close_m: str, tag: str) -> str | None:
    m = re.search(re.escape(open_m) + r"(.*?)" + re.escape(close_m), html, re.DOTALL)
    if not m:
        return None
    block = m.group(1)
    inner = re.search(r"<" + tag + r"[^>]*>(.*?)</" + tag + r">", block, re.DOTALL)
    return inner.group(1) if inner else block


def shell_status(html: str) -> tuple[str, str]:
    """Return (status, detail) where status is 'ok' | 'stale' | 'missing-markers'."""
    css_inner = _extract_inner(html, CSS_OPEN, CSS_CLOSE, "style")
    js_inner = _extract_inner(html, JS_OPEN, JS_CLOSE, "script")
    if css_inner is None or js_inner is None:
        missing = []
        if css_inner is None:
            missing.append("SHELL:CSS")
        if js_inner is None:
            missing.append("SHELL:JS")
        return "missing-markers", "no " + " and ".join(missing) + " markers"
    css, js = read_shell()
    css_ok = _norm(css_inner) == _norm(css)
    js_ok = _norm(js_inner) == _norm(js)
    if css_ok and js_ok:
        return "ok", "shell matches canonical"
    drifted = []
    if not css_ok:
        drifted.append("shell.css")
    if not js_ok:
        drifted.append("shell.js")
    return "stale", "inlined " + " and ".join(drifted) + " drifted from canonical"


if __name__ == "__main__":
    import argparse
    import sys

    ap = argparse.ArgumentParser(description="Inline / check the canonical deck shell.")
    ap.add_argument("deck", type=Path, help="deck .html with shell markers")
    ap.add_argument("--check", action="store_true", help="report freshness only; do not write")
    args = ap.parse_args()

    text = args.deck.read_text(encoding="utf-8")
    if args.check:
        status, detail = shell_status(text)
        print(f"{status}: {detail}")
        sys.exit(0 if status == "ok" else 1)
    args.deck.write_text(inline_shell(text), encoding="utf-8")
    print(f"reshelled {args.deck} (canonical {canonical_hash()[:12]})")
