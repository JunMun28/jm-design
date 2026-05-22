#!/usr/bin/env python3
"""Extract Micron icon archives into a normalized asset tree and manifest."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_VERSION = 1

PRIMARY_PNG_ARCHIVE = "micron-primary-icons.original.zip"
PRIMARY_MP4_ARCHIVE = "micron-primary-icons-animated.original.zip"
SECONDARY_ARCHIVE = "micron-secondary-icons.original.zip"

THEME_STYLE_DEFAULTS = {
    "micron-light": "pos",
    "micron-dark": "rev",
    "micron-dark-executive": "rev",
}

PRIMARY_CATEGORIES = {
    "ai-data": {
        "ai",
        "ai-analytics",
        "artificial-intelligence",
        "artificial-intelligence-no-text",
        "data-analytics",
        "visual-analytics",
    },
    "connectivity": {
        "5g",
        "cloud",
        "communications-network",
        "computer-networking",
        "lte",
        "networking",
        "secure-comms",
        "wifi",
    },
    "compute-memory-storage": {
        "cpu-gpu",
        "data-center",
        "graphics-card",
        "managed-nand",
        "memory",
        "memory-dimm",
        "multichip",
        "nand",
        "nor",
        "server",
        "storage-flash",
        "storage-generic",
        "storage-hdd",
        "storage-ssd",
    },
    "industry-application": {
        "aerospace",
        "automotive",
        "aviation",
        "consumer",
        "drone",
        "gaming",
        "healthcare",
        "industrial",
        "mobile",
        "personal-computing",
        "vr-goggles",
        "wearable-tech",
    },
    "operations": {
        "community",
        "covid-mask",
        "employee",
        "extended-life",
        "health-safety",
        "home",
        "manufacturing",
        "quality",
        "science",
        "security",
        "streaming-customer-service",
        "temperature",
        "video-sec",
    },
    "sustainability": {
        "energy",
        "renewable-energy",
        "sustainability",
        "waste",
        "water",
    },
    "performance": {
        "high-speed",
        "low-latency",
    },
    "semiconductor-symbol": {
        "atom",
        "globe",
        "lightbulb",
        "radar",
        "wafer",
    },
}

CANONICAL_ALIASES = {
    "analytics": "data-analytics",
    "communication-network": "communications-network",
    "consume": "consumer",
    "healthy-safety": "health-safety",
    "latency": "low-latency",
    "storgage-generic": "storage-generic",
    "streaming-cust-serv": "streaming-customer-service",
    "video-security": "video-sec",
    "visual-analyitics": "visual-analytics",
    "vr_goggles": "vr-goggles",
}

RECOMMENDED_GROUPS = {
    "title-hero": {
        "defaults": [
            "primary-wafer",
            "primary-ai",
            "primary-data-analytics",
            "primary-atom",
            "primary-lightbulb",
            "primary-memory",
        ],
        "categories": [
            "semiconductor-symbol",
            "ai-data",
            "compute-memory-storage",
        ],
    },
    "process": {
        "defaults": [
            "primary-manufacturing",
            "primary-quality",
            "primary-data-center",
            "secondary-hr-goals",
            "secondary-safety-safety-awareness",
        ],
        "categories": ["operations", "hr", "safety", "townhall", "egd", "security"],
    },
    "safety-comms": {
        "defaults": [
            "secondary-safety-safety-awareness",
            "secondary-safety-near-miss",
            "secondary-safety-work-safety",
            "secondary-safety-ppe",
            "secondary-safety-stop-unsafe-behavior",
        ],
        "categories": ["safety"],
    },
    "security-comms": {
        "defaults": [
            "secondary-security-security-property",
            "secondary-security-badge-awareness",
            "secondary-security-lock-doors",
            "secondary-security-no-tailgating",
            "secondary-security-notify",
        ],
        "categories": ["security"],
    },
    "people-hr": {
        "defaults": [
            "secondary-hr-employee-performance",
            "secondary-hr-feedback",
            "secondary-hr-goals",
            "secondary-hr-conversation",
            "secondary-hr-meeting",
        ],
        "categories": ["hr"],
    },
    "facilities-egd": {
        "defaults": [
            "secondary-egd-conference-room",
            "secondary-egd-seating",
            "secondary-egd-elevator",
            "secondary-egd-dining",
            "secondary-egd-stairs",
        ],
        "categories": ["egd"],
    },
    "townhall": {
        "defaults": [
            "secondary-townhall-join-in-person",
            "secondary-townhall-join-virtually",
            "secondary-townhall-watch-the-replay",
            "secondary-townhall-live-interpretation",
            "secondary-townhall-refreshments",
        ],
        "categories": ["townhall"],
    },
    "technical-capability": {
        "defaults": [
            "primary-ai",
            "primary-data-center",
            "primary-memory",
            "primary-storage-ssd",
            "primary-cpu-gpu",
            "primary-cloud",
            "primary-high-speed",
        ],
        "categories": [
            "compute-memory-storage",
            "connectivity",
            "performance",
            "ai-data",
        ],
    },
}


def humanize(slug: str) -> str:
    special = {
        "ai": "AI",
        "5g": "5G",
        "lte": "LTE",
        "vr": "VR",
        "hdd": "HDD",
        "ssd": "SSD",
        "dimm": "DIMM",
        "nand": "NAND",
        "nor": "NOR",
        "cpu": "CPU",
        "gpu": "GPU",
        "ppe": "PPE",
        "egd": "EGD",
        "hr": "HR",
    }
    words = slug.replace("_", "-").split("-")
    return " ".join(special.get(word.lower(), word.capitalize()) for word in words)


def slugify(value: str) -> str:
    value = value.strip().lower().replace("_", "-")
    value = re.sub(r"[^a-z0-9-]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-")


def default_repo_root() -> Path:
    for candidate in [Path.cwd(), *Path.cwd().parents]:
        if (candidate / "tmp/icons").exists() and (candidate / ".agents").exists():
            return candidate
    return Path.cwd()


def default_output_dir() -> Path:
    cwd = Path.cwd()
    if (cwd / "SKILL.md").exists() and cwd.name == "micron-icons":
        return cwd / "assets"
    root = default_repo_root()
    return root / ".agents/skills/micron-icons/assets"


def is_noise(info: zipfile.ZipInfo) -> bool:
    path = Path(info.filename)
    return (
        info.is_dir()
        or "__MACOSX" in path.parts
        or path.name == ".DS_Store"
        or path.name.startswith("._")
    )


def primary_category(slug: str) -> str:
    for category, slugs in PRIMARY_CATEGORIES.items():
        if slug in slugs:
            return category
    return "uncategorized"


def aliases_for(canonical_slug: str, source_slug: str, category: str) -> list[str]:
    values = {
        canonical_slug,
        source_slug,
        canonical_slug.replace("-", " "),
        source_slug.replace("-", " "),
        category,
        *canonical_slug.replace("-", " ").split(),
        *source_slug.replace("-", " ").split(),
    }
    values.discard("")
    return sorted(values)


def html_for(path: str, media: str, alt: str) -> str:
    if media == "mp4":
        return f'<video src="{path}" muted autoplay loop playsinline aria-label="{alt}"></video>'
    return f'<img src="{path}" alt="{alt}">'


def entry_id(set_name: str, category: str, canonical_slug: str, source_slug: str, media: str, style: str) -> str:
    prefix = f"secondary-{category}" if set_name == "secondary" else "primary"
    base = f"{prefix}-{source_slug}"
    if source_slug != canonical_slug:
        base = f"{base}-as-{canonical_slug}"
    return f"{base}-{media}-{style}"


def base_id(set_name: str, category: str, canonical_slug: str) -> str:
    if set_name == "secondary":
        return f"secondary-{category}-{canonical_slug}"
    return f"primary-{canonical_slug}"


def parse_primary_png(name: str) -> tuple[str, str] | None:
    match = re.match(r"png/(pos|rev)/micron-pri-icn-(.+)-(pos|rev)-rgb\.png$", name, re.I)
    if not match:
        return None
    folder_style, slug, filename_style = match.groups()
    if folder_style.lower() != filename_style.lower():
        return None
    return folder_style.lower(), slugify(slug)


def parse_primary_mp4(name: str) -> tuple[str, str, str | None]:
    path = Path(name)
    parts = path.parts
    if len(parts) < 3 or parts[0] != "mp4" or parts[1].lower() not in {"pos", "rev"}:
        return "", "", "bad-pattern"
    folder_style = parts[1].lower()
    stem = path.stem
    lowered = stem.lower()
    if not lowered.startswith("micron-pri-icn-"):
        return "", "", "bad-pattern"
    source = slugify(re.sub(r"-(pos|rev)-rgb-?$", "", lowered.removeprefix("micron-pri-icn-")))
    filename_style_match = re.search(r"-(pos|rev)-rgb-?$", lowered)
    filename_style = filename_style_match.group(1) if filename_style_match else None
    anomaly = None
    if filename_style and filename_style != folder_style:
        anomaly = "style-mismatch-folder-authoritative"
    return folder_style, source, anomaly


def parse_secondary_png(name: str) -> tuple[str, str, str] | None:
    match = re.match(
        r"micron-secondary-icons/([^/]+)/(pos|rev)/micron-sec-icn-(.+)-(pos|rev)-rgb\.png$",
        name,
        re.I,
    )
    if not match:
        return None
    source_category, folder_style, slug, filename_style = match.groups()
    if folder_style.lower() != filename_style.lower():
        return None
    category = slugify(source_category.removesuffix("-icons"))
    return category, folder_style.lower(), slugify(slug)


def copy_member(zf: zipfile.ZipFile, info: zipfile.ZipInfo, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with zf.open(info, "r") as src, dest.open("wb") as out:
        shutil.copyfileobj(src, out)


def build_entry(
    *,
    set_name: str,
    category: str,
    style: str,
    media: str,
    source_slug: str,
    canonical_slug: str,
    rel_path: str,
    original_filename: str,
    source_path: str,
    source_archive: str,
    anomalies: list[str],
) -> dict:
    label = humanize(canonical_slug)
    alt = f"Micron {label} icon"
    entry = {
        "id": entry_id(set_name, category, canonical_slug, source_slug, media, style),
        "base_id": base_id(set_name, category, canonical_slug),
        "canonical_slug": canonical_slug,
        "source_slug": source_slug,
        "set": set_name,
        "category": category,
        "label": label,
        "alt": alt,
        "style": style,
        "media": media,
        "path": rel_path,
        "original_filename": original_filename,
        "source_path": source_path,
        "source_archive": source_archive,
        "aliases": aliases_for(canonical_slug, source_slug, category),
        "html": html_for(rel_path, media, alt),
        "anomalies": anomalies,
    }
    return entry


def add_fallbacks(entries: list[dict]) -> None:
    png_by_key = {
        (entry["base_id"], entry["style"]): entry["path"]
        for entry in entries
        if entry["media"] == "png"
    }
    for entry in entries:
        if entry["media"] != "mp4":
            continue
        fallback = png_by_key.get((entry["base_id"], entry["style"]))
        if fallback:
            entry["fallback_png"] = fallback


def validate_existing_output(output_dir: Path, force: bool) -> None:
    manifest = output_dir / "manifest.json"
    if manifest.exists():
        try:
            data = json.loads(manifest.read_text())
            version = int(data.get("schema_version", 0))
        except Exception:
            version = 0
        if version > SCHEMA_VERSION and not force:
            raise SystemExit(
                f"Existing manifest schema_version {version} is newer than {SCHEMA_VERSION}; pass --force to overwrite."
            )
    if output_dir.exists() and any(output_dir.iterdir()) and not force:
        raise SystemExit(f"{output_dir} already exists and is not empty; pass --force to rebuild.")


def extract(source_dir: Path, output_dir: Path, force: bool) -> dict:
    validate_existing_output(output_dir, force)
    if output_dir.exists() and force:
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    entries: list[dict] = []
    skipped: Counter[str] = Counter()
    counts: Counter[tuple[str, str, str, str]] = Counter()
    source_archives = []

    archives = [
        (PRIMARY_PNG_ARCHIVE, "primary", "png"),
        (PRIMARY_MP4_ARCHIVE, "primary", "mp4"),
        (SECONDARY_ARCHIVE, "secondary", "png"),
    ]

    for archive_name, archive_set, archive_media in archives:
        archive_path = source_dir / archive_name
        if not archive_path.exists():
            raise SystemExit(f"Missing source archive: {archive_path}")
        clean_count = 0
        with zipfile.ZipFile(archive_path) as zf:
            for info in zf.infolist():
                if is_noise(info):
                    skipped["noise"] += 1
                    continue
                parsed = None
                anomalies: list[str] = []
                if archive_name == PRIMARY_PNG_ARCHIVE:
                    parsed = parse_primary_png(info.filename)
                    if parsed:
                        style, source_slug = parsed
                        canonical_slug = source_slug
                        category = primary_category(canonical_slug)
                        media = "png"
                        rel_path = f"assets/primary/png/{style}/{source_slug}.png"
                elif archive_name == PRIMARY_MP4_ARCHIVE:
                    style, source_slug, anomaly = parse_primary_mp4(info.filename)
                    if style and source_slug:
                        if anomaly:
                            anomalies.append(anomaly)
                        canonical_slug = CANONICAL_ALIASES.get(source_slug, source_slug)
                        if canonical_slug != source_slug:
                            anomalies.append("source-slug-canonicalized")
                        category = primary_category(canonical_slug)
                        media = "mp4"
                        rel_path = f"assets/primary/mp4/{style}/{source_slug}.mp4"
                        parsed = True
                else:
                    parsed = parse_secondary_png(info.filename)
                    if parsed:
                        category, style, source_slug = parsed
                        canonical_slug = source_slug
                        media = "png"
                        rel_path = f"assets/secondary/{category}/png/{style}/{source_slug}.png"
                if not parsed:
                    skipped[f"unparsed:{archive_name}"] += 1
                    continue

                clean_count += 1
                copy_member(zf, info, output_dir.parent / rel_path)
                entry = build_entry(
                    set_name=archive_set,
                    category=category,
                    style=style,
                    media=media,
                    source_slug=source_slug,
                    canonical_slug=canonical_slug,
                    rel_path=rel_path,
                    original_filename=Path(info.filename).name,
                    source_path=info.filename,
                    source_archive=archive_name,
                    anomalies=anomalies,
                )
                entries.append(entry)
                counts[(archive_set, media, category, style)] += 1

        source_archives.append(
            {
                "name": archive_name,
                "asset_count": clean_count,
                "set": archive_set,
                "media": archive_media,
            }
        )

    add_fallbacks(entries)
    entries.sort(key=lambda e: (e["set"], e["category"], e["canonical_slug"], e["media"], e["style"], e["source_slug"]))

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_archives": source_archives,
        "theme_style_defaults": THEME_STYLE_DEFAULTS,
        "recommended_groups": RECOMMENDED_GROUPS,
        "icons": entries,
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    print("Extracted Micron icons")
    for archive in source_archives:
        print(f"- {archive['name']}: {archive['asset_count']} clean {archive['media']} assets")
    print("Counts by set/media/category/style:")
    for key, value in sorted(counts.items()):
        print(f"- {key[0]}/{key[1]}/{key[2]}/{key[3]}: {value}")
    anomaly_count = sum(1 for entry in entries if entry["anomalies"])
    print(f"Anomalies recorded: {anomaly_count}")
    if skipped:
        print("Skipped:")
        for key, value in sorted(skipped.items()):
            print(f"- {key}: {value}")
    return manifest


def main() -> int:
    root = default_repo_root()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=root / "tmp/icons")
    parser.add_argument("--output-dir", type=Path, default=default_output_dir())
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    extract(args.source_dir.resolve(), args.output_dir.resolve(), args.force)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
