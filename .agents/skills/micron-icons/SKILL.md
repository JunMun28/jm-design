---
name: micron-icons
description: Use this skill whenever a user or slide workflow needs official Micron iconography, Micron primary/secondary icons, Micron animated icons, or semantic icon lookup for Micron HTML slides. Prefer this skill for Micron-themed decks even when the user only says they need an icon for AI, memory, safety, security, HR, facilities, townhall, process, capability, or decorative Micron visual texture.
---

# Micron Icons

Use this skill to find official Micron icon assets by meaning instead of by
archive filename. It is icon-only: logos, wafer photos, title images, and other
brand assets belong in theme assets or a separate skill.

## Default Workflow

1. Decide whether the icon is semantic or decorative.
2. Use `bin/find-icon.py` instead of browsing folders manually.
3. Prefer PNG. Use MP4 only for intentional title, hero, transition, or single
   visual-protagonist moments.
4. For Micron slide themes, pass `--theme` so the finder chooses the right
   polarity:
   - `micron-light` -> `pos`
   - `micron-dark` -> `rev`
   - `micron-dark-executive` -> `rev`
5. Use `--format html` when you need a snippet.
6. Use `--decorative` for decorative HTML snippets so accessibility is correct.

Examples:

```sh
python3 bin/find-icon.py "near miss" --category safety --theme micron-dark
python3 bin/find-icon.py wafer --media mp4 --style pos --format html
python3 bin/find-icon.py --group technical-capability --theme micron-dark --limit 3
python3 bin/find-icon.py --group title-hero --theme micron-light --format html --decorative
```

## When To Use Groups

Use `--group` when the deck needs a visual direction but the user has not named
a specific icon.

| Group | Use |
|---|---|
| `title-hero` | Title, hero, section opener |
| `process` | Process steps, workflow nodes |
| `safety-comms` | Safety communications |
| `security-comms` | Security communications |
| `people-hr` | People, performance, HR |
| `facilities-egd` | Facilities, rooms, wayfinding |
| `townhall` | Townhall and event logistics |
| `technical-capability` | Product capability, architecture, platform |

Group defaults are manually curated and deterministic. The same group, theme,
filters, and limit should return the same ordered results every run.

## Usage Rules

Icons may be semantic or decorative.

Good semantic uses:

- category labels
- process steps
- capability nodes
- safety, security, HR, EGD, and townhall communications
- title or hero visual protagonist

Good decorative uses:

- restrained corner detail
- faint supporting texture
- repeated motif that does not compete with text or charts
- visual rhythm in section breaks

Avoid:

- icon wallpaper that dominates the slide
- MP4 icons as routine decoration
- mixing Micron icons with Lucide or custom icon packs on the same slide unless
  their roles are clearly separated
- asking the user to choose decorative icons unless the choice materially
  changes the message

## Asset Contract

`assets/manifest.json` is the lookup source of truth. It records:

- `schema_version`
- source archive metadata
- recommended groups and curated defaults
- icon entries with canonical slug, source slug, category, label, alt text,
  relative path, original filename, and anomaly metadata

The source zip archives are not bundled into this skill. The extracted assets
are preserved without recompression, recoloring, conversion, or visual edits.

## Rebuilding Assets

When source archives change, rebuild the extracted tree and manifest:

```sh
python3 bin/extract-icons.py --source-dir /Users/wongjunmun/development/ai-development/jm-design/tmp/icons --output-dir assets --force
```

The extractor skips archive noise (`__MACOSX`, `._*`, `.DS_Store`) and records
known source naming anomalies instead of hiding them.

## Visual Review

Open `preview.html` from a local HTTP server rooted at this skill folder:

```sh
python3 -m http.server 8788
```

Then visit `http://127.0.0.1:8788/preview.html`.

The preview page loads `assets/manifest.json`, filters icons, previews PNG/MP4,
and shows semantic and decorative HTML snippets.
