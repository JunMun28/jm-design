"""Deck metadata helpers: variant filenames and the source-link stamp.

A styled deck generated from a wireframe is named <topic>.<theme>.html and
carries a single HTML comment linking it back to its wireframe:
    <!-- SOURCE: docs/brainstorms/<file>.html · THEME: <id> · GENERATED: <date> -->
"""
from __future__ import annotations

import re

_STAMP_RE = re.compile(r"<!--\s*SOURCE:.*?-->", re.DOTALL)


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "deck"


def variant_name(topic: str, theme: str) -> str:
    return f"{slugify(topic)}.{slugify(theme)}.html"


def stamp(html: str, source: str, theme: str, date: str) -> str:
    comment = f"<!-- SOURCE: {source} · THEME: {theme} · GENERATED: {date} -->"
    html = _STAMP_RE.sub("", html, count=1) if _STAMP_RE.search(html) else html
    if re.search(r"<head[^>]*>", html, re.IGNORECASE):
        return re.sub(r"(<head[^>]*>)", r"\1\n" + comment, html, count=1, flags=re.IGNORECASE)
    return comment + "\n" + html


def read_stamp(html: str):
    m = _STAMP_RE.search(html)
    if not m:
        return None
    text = m.group(0)
    src = re.search(r"SOURCE:\s*(.*?)\s*·", text)
    thm = re.search(r"THEME:\s*(.*?)\s*(?:·|-->)", text)
    return {"source": src.group(1) if src else "", "theme": thm.group(1) if thm else ""}


def _main(argv):
    import argparse
    p = argparse.ArgumentParser(description="Deck metadata helper.")
    sub = p.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("name"); n.add_argument("topic"); n.add_argument("theme")
    s = sub.add_parser("stamp"); s.add_argument("file"); s.add_argument("source"); s.add_argument("theme"); s.add_argument("date")
    args = p.parse_args(argv)
    if args.cmd == "name":
        print(variant_name(args.topic, args.theme))
    elif args.cmd == "stamp":
        from pathlib import Path
        path = Path(args.file)
        path.write_text(stamp(path.read_text(), args.source, args.theme, args.date))
        print(f"stamped {path}")


if __name__ == "__main__":
    import sys
    _main(sys.argv[1:])
