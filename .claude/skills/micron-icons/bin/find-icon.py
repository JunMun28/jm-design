#!/usr/bin/env python3
"""Find Micron icons by semantic query, category, group, style, and media."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def manifest_path() -> Path:
    return Path(__file__).resolve().parents[1] / "assets" / "manifest.json"


def load_manifest() -> dict:
    path = manifest_path()
    if not path.exists():
        raise SystemExit(f"Missing manifest: {path}. Run bin/extract-icons.py first.")
    data = json.loads(path.read_text())
    if data.get("schema_version") != 2:
        raise SystemExit(f"Unsupported manifest schema_version: {data.get('schema_version')}")
    return data


def infer_style(manifest: dict, theme: str | None, style: str | None) -> str | None:
    if style:
        return style
    if theme:
        return manifest.get("theme_style_defaults", {}).get(theme)
    return None


def normalized_terms(value: str) -> set[str]:
    lowered = value.lower().replace("_", "-")
    spaced = lowered.replace("-", " ")
    return {lowered, spaced, *spaced.split()}


def entry_text(entry: dict) -> set[str]:
    values = {
        entry.get("id", ""),
        entry.get("base_id", ""),
        entry.get("canonical_slug", ""),
        entry.get("source_slug", ""),
        entry.get("category", ""),
        entry.get("label", ""),
        *entry.get("aliases", []),
    }
    terms: set[str] = set()
    for value in values:
        terms.update(normalized_terms(str(value)))
    return terms


def matches_filters(entry: dict, args: argparse.Namespace, style: str | None) -> bool:
    if args.set and entry.get("set") != args.set:
        return False
    if args.category and entry.get("category") != args.category:
        return False
    if args.media and entry.get("media") != args.media:
        return False
    if style and entry.get("style") != style:
        return False
    return True


def score_entry(entry: dict, query: str) -> int:
    if not query:
        return 1
    query_norm = query.lower().replace("_", "-")
    query_space = query_norm.replace("-", " ")
    terms = entry_text(entry)
    if query_norm in {entry.get("id"), entry.get("base_id"), entry.get("canonical_slug"), entry.get("source_slug")}:
        return 100
    if query_space == str(entry.get("label", "")).lower():
        return 95
    if query_space in [str(alias).lower().replace("-", " ") for alias in entry.get("aliases", [])]:
        return 90
    if all(part in terms for part in query_space.split()):
        return 70
    haystack = " ".join(sorted(terms))
    if query_space in haystack or query_norm in haystack:
        return 50
    return 0


def group_order(manifest: dict, group: str | None) -> dict[str, int]:
    if not group:
        return {}
    defaults = manifest.get("recommended_groups", {}).get(group, {}).get("defaults", [])
    return {base: index for index, base in enumerate(defaults)}


def group_categories(manifest: dict, group: str | None) -> set[str]:
    if not group:
        return set()
    return set(manifest.get("recommended_groups", {}).get(group, {}).get("categories", []))


def find_icons(manifest: dict, args: argparse.Namespace) -> list[dict]:
    style = infer_style(manifest, args.theme, args.style)
    query = " ".join(args.query).strip()
    order = group_order(manifest, args.group)
    categories = group_categories(manifest, args.group)

    candidates = []
    for index, entry in enumerate(manifest.get("icons", [])):
        if not matches_filters(entry, args, style):
            continue
        if args.group and not query:
            in_defaults = entry.get("base_id") in order
            in_category = entry.get("category") in categories
            if not in_defaults and not in_category:
                continue
            score = 1000 - order.get(entry.get("base_id"), 900 + index)
        else:
            if args.group and categories and entry.get("category") not in categories and entry.get("base_id") not in order:
                continue
            score = score_entry(entry, query)
            if query and score == 0:
                continue
            if args.group and entry.get("base_id") in order:
                score += 20
        source_is_canonical = entry.get("source_slug") == entry.get("canonical_slug")
        candidates.append((score, source_is_canonical, entry.get("base_id", ""), entry.get("id", ""), entry))

    candidates.sort(key=lambda row: (-row[0], not row[1], row[2], row[3]))
    return [row[-1] for row in candidates[: args.limit]]


def semantic_html(entry: dict, decorative: bool) -> str:
    path = entry["path"]
    if entry["media"] == "mp4":
        if decorative:
            return f'<video src="{path}" muted autoplay loop playsinline aria-hidden="true"></video>'
        return f'<video src="{path}" muted autoplay loop playsinline aria-label="{entry["alt"]}"></video>'
    if decorative:
        return f'<img src="{path}" alt="" aria-hidden="true">'
    return f'<img src="{path}" alt="{entry["alt"]}">'


def emit(entries: list[dict], args: argparse.Namespace) -> None:
    if args.format == "json":
        print(json.dumps(entries, indent=2))
        return
    if args.format == "html":
        for entry in entries:
            print(semantic_html(entry, args.decorative))
        return
    for entry in entries:
        print(entry["path"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query", nargs="*", help="semantic query text")
    parser.add_argument("--set", choices=["primary", "secondary"])
    parser.add_argument("--category")
    parser.add_argument("--group")
    parser.add_argument("--style", choices=["pos", "rev"])
    parser.add_argument("--theme", choices=["micron-light", "micron-dark", "micron-dark-executive"])
    parser.add_argument("--media", choices=["svg", "mp4"], default="svg")
    parser.add_argument("--limit", type=int, default=1)
    parser.add_argument("--format", choices=["path", "json", "html"], default="path")
    parser.add_argument("--decorative", action="store_true")
    args = parser.parse_args()

    manifest = load_manifest()
    entries = find_icons(manifest, args)
    if not entries:
        return 1
    emit(entries, args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
