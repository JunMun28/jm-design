# Micron Icons Skill Spec

Status: analysis handoff for future `skill-creator` run.

## Source Archives

Source folder: `tmp/icons/`

| Archive | Clean assets | Notes |
|---|---:|---|
| `micron-primary-icons.original.zip` | 130 PNG | 65 icon slugs, each with `pos` and `rev` |
| `micron-primary-icons-animated.original.zip` | 120 MP4 | 60 `pos`, 60 `rev`; several slugs differ from PNG naming |
| `micron-secondary-icons.original.zip` | 142 PNG | 71 icon slugs, each with `pos` and `rev`; skip `__MACOSX`, `._*`, `.DS_Store` |

Size profile:

- Primary PNG: 8,678,563 bytes total; 15,813-267,024 bytes each.
- Primary MP4: 53,471,788 bytes total; 148,961-1,515,275 bytes each.
- Secondary PNG: 1,662,075 bytes total; 3,071-38,648 bytes each.

## Skill Boundary

Create a standalone skill at `.agents/skills/micron-icons`.

Scope is icon-only. Do not expand this skill into a general Micron brand asset
catalog. Logos, wafer photos, title imagery, and non-icon visual assets belong
in `html-slides` theme assets or a separate future skill.

Do not put extracted assets inside `.agents/skills/html-slides`. `html-slides`
may call this skill only for Micron themes by default. Non-Micron themes use
Micron icons only when explicitly requested.

Do not update operational `html-slides` instructions to call `micron-icons`
until the standalone skill exists. The ADR and this spec are enough before
implementation.

## Asset Layout

```text
.agents/skills/micron-icons/
├── SKILL.md
├── assets/
│   ├── manifest.json
│   ├── README.md
│   ├── primary/
│   │   ├── png/
│   │   │   ├── pos/*.png
│   │   │   └── rev/*.png
│   │   └── mp4/
│   │       ├── pos/*.mp4
│   │       └── rev/*.mp4
│   └── secondary/
│       ├── egd/png/{pos,rev}/*.png
│       ├── hr/png/{pos,rev}/*.png
│       ├── safety/png/{pos,rev}/*.png
│       ├── security/png/{pos,rev}/*.png
│       └── townhall/png/{pos,rev}/*.png
├── bin/
│   ├── extract-icons.py
│   └── find-icon.py
└── preview.html
```

Preserve source asset bytes. No recompression, recoloring, SVG conversion, or
visual optimization. Normalize destination filenames and record source archive
metadata.

Do not copy source zip archives into `.agents/skills/micron-icons` by default.
The source zips remain external inputs, and the manifest records archive names
for traceability.

## Manifest Contract

`assets/manifest.json` should be the lookup source of truth.

Top-level shape:

```json
{
  "schema_version": 1,
  "generated_at": "2026-05-21T00:00:00Z",
  "source_archives": [
    {
      "name": "micron-primary-icons.original.zip",
      "asset_count": 130,
      "media": "png"
    }
  ],
  "recommended_groups": {},
  "icons": []
}
```

Extractor behavior:

- Write `schema_version: 1`.
- Record `generated_at` in UTC ISO-8601.
- Record every source archive used with clean asset counts.
- Refuse to update an existing manifest with an unknown future major schema
  version unless `--force` is passed.

Each entry:

```json
{
  "id": "primary-ai-analytics",
  "canonical_slug": "ai-analytics",
  "source_slug": "ai-analytics",
  "set": "primary",
  "category": "ai-data",
  "label": "AI analytics",
  "alt": "Micron AI analytics icon",
  "style": "pos",
  "media": "png",
  "path": "assets/primary/png/pos/ai-analytics.png",
  "original_filename": "micron-pri-icn-ai-analytics-pos-rgb.png",
  "source_archive": "micron-primary-icons.original.zip",
  "aliases": ["ai", "analytics", "artificial intelligence"],
  "html": "<img src=\"assets/primary/png/pos/ai-analytics.png\" alt=\"Micron AI analytics icon\">"
}
```

Manifest should also include manually curated group defaults:

```json
{
  "recommended_groups": {
    "technical-capability": {
      "defaults": ["primary-ai", "primary-data-center", "primary-memory", "primary-storage-ssd"],
      "categories": ["compute-memory-storage", "connectivity", "performance", "ai-data"]
    }
  }
}
```

`recommended_groups.<group>.defaults` is the authoritative default order.
Finder falls back to manifest entry order only when a group has no defaults.

MP4 entries should include:

```json
{
  "html": "<video src=\"assets/primary/mp4/pos/wafer.mp4\" muted autoplay loop playsinline></video>",
  "fallback_png": "assets/primary/png/pos/wafer.png"
}
```

`label` and `alt` should be curated human text in the manifest. Finder may
derive fallback labels from `canonical_slug` only when missing.

## Semantic Categories

Primary icons should use semantic categories. Initial category map:

- `ai-data`: `ai`, `ai-analytics`, `artificial-intelligence`, `artificial-intelligence-no-text`, `data-analytics`, `visual-analytics`
- `connectivity`: `5g`, `cloud`, `communications-network`, `computer-networking`, `lte`, `networking`, `secure-comms`, `wifi`
- `compute-memory-storage`: `cpu-gpu`, `data-center`, `graphics-card`, `managed-nand`, `memory`, `memory-dimm`, `multichip`, `nand`, `nor`, `server`, `storage-flash`, `storage-generic`, `storage-hdd`, `storage-ssd`
- `industry-application`: `aerospace`, `automotive`, `aviation`, `consumer`, `drone`, `gaming`, `healthcare`, `industrial`, `mobile`, `personal-computing`, `vr-goggles`, `wearable-tech`
- `operations`: `community`, `employee`, `extended-life`, `health-safety`, `home`, `manufacturing`, `quality`, `science`, `security`, `streaming-customer-service`, `temperature`, `video-sec`
- `sustainability`: `energy`, `renewable-energy`, `sustainability`, `waste`, `water`
- `performance`: `high-speed`, `low-latency`
- `semiconductor-symbol`: `atom`, `globe`, `lightbulb`, `radar`, `wafer`

Secondary categories come from source folders:

- `egd`: 13 slugs, 26 PNG
- `hr`: 8 slugs, 16 PNG
- `safety`: 15 slugs, 30 PNG
- `security`: 28 slugs, 56 PNG
- `townhall`: 7 slugs, 14 PNG

## Animated Icon Rules

Default lookup returns PNG. MP4 is opt-in only.

Use animated icons for:

- title/hero moments
- transition moments
- one focused visual protagonist

Do not use animated icons in:

- dense grids
- tables
- charts
- routine process rows

Every MP4 snippet must use `muted autoplay loop playsinline` and should include
a static PNG fallback when a matching canonical PNG exists.

## Usage Rules

Icons may be semantic or decorative.

Semantic uses:

- category labels
- process steps
- capability nodes
- safety, security, HR, EGD, and townhall communications
- title or hero visual protagonist

Decorative uses:

- restrained corner detail
- faint supporting texture
- repeated motif when it does not compete with text or charts
- visual rhythm in section breaks
- agent-chosen icons when the deck needs visual texture and the user has not
  named a specific icon

Avoid:

- icon wallpaper that dominates the slide
- icons inside charts or tables unless they encode a real label
- mixing Micron icons with Lucide or custom icon packs on the same slide unless
  the roles are clearly separated
- using MP4 icons as routine decoration
- asking the user to choose decorative icons unless the icon materially changes
  the message

## Recommended Icon Groups

Expose named groups in docs and manifest metadata so agents can choose quickly
for common slide patterns.

| Group | Use | Candidate categories |
|---|---|---|
| `title-hero` | Title, hero, section opener | `semiconductor-symbol`, `ai-data`, `compute-memory-storage` |
| `process` | Process steps, workflow nodes | `operations`, secondary categories |
| `safety-comms` | Safety communications | secondary `safety` |
| `security-comms` | Security communications | secondary `security` |
| `people-hr` | People, performance, HR | secondary `hr` |
| `facilities-egd` | Facilities, rooms, wayfinding | secondary `egd` |
| `townhall` | Townhall, event logistics | secondary `townhall` |
| `technical-capability` | Product capability, architecture, platform | `compute-memory-storage`, `connectivity`, `performance`, `ai-data` |

## Theme Style Defaults

When a caller passes `--theme`, `bin/find-icon.py` should infer icon style:

| Theme | Default style |
|---|---|
| `micron-light` | `pos` |
| `micron-dark` | `rev` |
| `micron-dark-executive` | `rev` |

Explicit `--style pos|rev` always wins over `--theme`.

## Known Naming Anomalies

Preserve original filenames and source slugs. Add `canonical_slug` and aliases
where the MP4 name likely corresponds to a PNG name.

| MP4 source slug | Likely canonical slug |
|---|---|
| `analytics` | `data-analytics` |
| `communication-network` | `communications-network` |
| `consume` | `consumer` |
| `healthy-safety` | `health-safety` |
| `latency` | `low-latency` |
| `storgage-generic` | `storage-generic` |
| `streaming-cust-serv` | `streaming-customer-service` |
| `video-security` | `video-sec` |
| `visual-analyitics` | `visual-analytics` |
| `vr_goggles` | `vr-goggles` |

One MP4 path has a style mismatch:

- `mp4/rev/micron-pri-icn-cpu-gpu-pos-rgb.mp4`

Treat folder style as authoritative (`rev`), preserve original filename, and
record the mismatch in manifest metadata.

## Helper Script

`bin/extract-icons.py` requirements:

- Rebuild `assets/` and `assets/manifest.json` from source archives.
- Default input: `tmp/icons/` relative to the repo root when run from
  `jm-design`; allow `--source-dir`.
- Default output: `.agents/skills/micron-icons/assets`; allow `--output-dir`.
- Skip archive noise: `__MACOSX`, `._*`, `.DS_Store`, directories.
- Preserve file bytes exactly.
- Normalize destination paths.
- Record `source_archive`, `original_filename`, `source_path`,
  `source_slug`, `canonical_slug`, and any anomaly metadata.
- Print counts by set, media, category, style, skipped files, and anomalies.
- Refuse to overwrite an existing `assets/` tree unless `--force` is passed.
- Do not copy input zip files into the output tree.

Example:

```sh
python3 bin/extract-icons.py --source-dir tmp/icons --output-dir .agents/skills/micron-icons/assets --force
```

`bin/find-icon.py` requirements:

- Query `assets/manifest.json`.
- Search `id`, `canonical_slug`, `source_slug`, `category`, and `aliases`.
- Filters: `--set`, `--category`, `--group`, `--style`, `--media`, `--limit`.
- `--group` uses Recommended Icon Groups; query text is optional when a group is
  provided.
- Group defaults must be deterministic: same group, filters, and query return
  the same ordered results every run.
- Default filters: `--media png`; style should infer from requested slide theme
  when caller passes `--theme micron-dark|micron-light|micron-dark-executive`.
- Output modes: `--format path|json|html`; default `path`.
- HTML mode supports `--decorative`. Decorative image snippets use
  `alt="" aria-hidden="true"`; decorative video snippets use
  `aria-hidden="true"` and no meaningful label.
- HTML output should emit relative snippets only. Do not copy assets into deck
  folders from `micron-icons`; portable deck packaging belongs to `html-slides`
  export/package workflows.
- Do not support data URI output in v1. Local relative paths only.
- Return non-zero when no match.
- Prefer exact alias/category matches over fuzzy substring matches.

Example:

```sh
python3 bin/find-icon.py "near miss" --category safety --style rev
python3 bin/find-icon.py wafer --media mp4 --style pos --format html
python3 bin/find-icon.py --group technical-capability --theme micron-dark --limit 3
```

## Preview Page

`preview.html` should be static and no-build.

Required filters:

- set
- category
- style
- media
- text search

Preview behavior:

- PNG thumbnails shown as images.
- MP4 shown as muted loop previews.
- Each card shows canonical slug, category, style, media, source filename, and
  copyable relative path.
- Each card shows copyable semantic and decorative HTML snippets so accessibility
  behavior is obvious.

## Evals and Tests

Create Python unit tests during the future `skill-creator` run. Use script and
data tests, not agent-grading eval JSON, unless prompt behavior is added later.

- Extractor count test: 130 primary PNG, 120 primary MP4, 142 secondary PNG.
- Manifest anomaly test: known MP4 typos map to canonical slugs.
- Finder determinism test:
  `python3 bin/find-icon.py --group technical-capability --theme micron-dark --limit 3`
  returns the same ordered `rev` PNG results every run.
- Finder media test: default lookup returns PNG unless `--media mp4` is explicit.
- Preview smoke test: `preview.html` loads `assets/manifest.json`.

## Future `skill-creator` Prompt

Use this spec to create `.agents/skills/micron-icons`.

The future run should create the complete skill in one pass: `SKILL.md`,
scripts, tests, `preview.html`, extracted assets, and `assets/manifest.json`.
Do not stop at a docs-only scaffold.

The skill should teach agents to:

- choose semantic tags first
- rebuild assets with `bin/extract-icons.py` when archives change
- call `bin/find-icon.py` for deterministic lookup
- use PNG by default
- use MP4 only when explicitly warranted
- preserve brand assets without modification
- integrate with `html-slides` only for Micron themes by default
