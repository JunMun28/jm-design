#!/usr/bin/env python3
"""build-deck.py — author-side entry point for the universal Deck Shell.

Subcommands:
  new       emit a marked Slide Player deck and inline the canonical shell
  reshell   re-inline the latest shell into an existing marked deck
  check     report whether a deck's inlined shell is fresh (exit 1 if not)

The shell itself is never hand-written; it is inlined from assets/shell.{css,js}
via scripts/shell.py (see ADR 0005). Themes override look via the :root token
block this emits; the player chrome comes entirely from the shell (ADR 0006).
"""

from __future__ import annotations

import argparse
import html as _html
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import shell as shell_mod  # noqa: E402

DECK_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<!-- SHELL:CSS -->
<!-- /SHELL:CSS -->
{theme_style}</head>
<body>
<main class="deck" data-deck-title="{title}" data-deck-mode="{mode}">
{slides}
</main>
<!-- SHELL:JS -->
<!-- /SHELL:JS -->
</body>
</html>
"""

DARK_TOKENS = """<style id="theme-tokens">
:root{
  --bg:#0c0c0e; --ink:#f4f4f6; --muted:#a8acb8; --faint:#6b6f7d;
  --accent:#bd03f7; --panel:#16161a; --line:rgba(255,255,255,.12); --line-strong:rgba(255,255,255,.22);
}
</style>
"""


def esc(s: str) -> str:
    return _html.escape(s, quote=True)


def title_slide(title: str, subtitle: str) -> str:
    return (
        '<section class="slide" data-slide-kind="cover">\n'
        f'  <p class="eyebrow reveal">{esc(subtitle.upper() or "DECK")}</p>\n'
        f'  <h1 class="reveal">{esc(title)}</h1>\n'
        '  <aside class="speaker-notes">Open with the one-line promise of this deck, then advance.</aside>\n'
        '</section>'
    )


def content_slide(heading: str, bullets: list[str], note: str) -> str:
    items = "\n".join(f"    <li class=\"reveal\">{esc(b)}</li>" for b in bullets)
    return (
        '<section class="slide">\n'
        f'  <h2 class="reveal">{esc(heading)}</h2>\n'
        f'  <ul>\n{items}\n  </ul>\n'
        f'  <aside class="speaker-notes">{esc(note)}</aside>\n'
        '</section>'
    )


def demo_slides() -> str:
    return "\n".join([
        title_slide("Universal deck shell", "Slide player"),
        content_slide("One shell, inlined into every deck", [
            "The controller and chrome live in one canonical source.",
            "build-deck.py inlines it at the SHELL markers.",
            "verify.py fails any deck whose shell drifted.",
        ], "Stress the single source of truth — change once, change all."),
        content_slide("A real slide app, not a scroll page", [
            "Left rail of live thumbnails; one stage at a time.",
            "Press P to present fullscreen; G for the grid overview.",
            "Notes sit under the stage and hide when presenting.",
        ], "Demo the rail, then hit P to drop into present mode."),
        content_slide("Wayfinding built in", [
            "URL deep-links to the current slide.",
            "Type a number then Enter to jump.",
            "Press ? for the shortcut card.",
        ], "Reload to show the hash returns to this slide."),
    ])


def build_new(args: argparse.Namespace) -> Path:
    slides = demo_slides()
    theme_style = DARK_TOKENS if args.dark else ""
    html = DECK_TEMPLATE.format(
        title=esc(args.title), theme_style=theme_style,
        mode=args.mode, slides=slides,
    )
    html = shell_mod.inline_shell(html)
    out = args.output or Path(f"{args.title.lower().replace(' ', '-')}.html")
    out.write_text(html, encoding="utf-8")
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="Build / reshell a Slide Player deck.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_new = sub.add_parser("new", help="emit a marked player deck and inline the shell")
    p_new.add_argument("--title", default="Slide deck")
    p_new.add_argument("--dark", action="store_true", help="emit a dark token block")
    p_new.add_argument("--mode", choices=["live", "standalone"], default="live")
    p_new.add_argument("-o", "--output", type=Path)

    p_re = sub.add_parser("reshell", help="re-inline the latest shell into a marked deck")
    p_re.add_argument("deck", type=Path)

    p_ck = sub.add_parser("check", help="report shell freshness (exit 1 if stale/missing)")
    p_ck.add_argument("deck", type=Path)

    args = ap.parse_args()

    if args.cmd == "new":
        out = build_new(args)
        print(f"wrote {out} (shell {shell_mod.canonical_hash()[:12]})")
    elif args.cmd == "reshell":
        text = args.deck.read_text(encoding="utf-8")
        args.deck.write_text(shell_mod.inline_shell(text), encoding="utf-8")
        print(f"reshelled {args.deck} (shell {shell_mod.canonical_hash()[:12]})")
    elif args.cmd == "check":
        status, detail = shell_mod.shell_status(args.deck.read_text(encoding="utf-8"))
        print(f"{status}: {detail}")
        sys.exit(0 if status == "ok" else 1)


if __name__ == "__main__":
    main()
