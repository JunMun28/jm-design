# jm-design

Slide and artifact generation workspace for reusable Codex skills, theme systems, and brand asset workflows.

## Language

**Micron Icons**:
A standalone skill-owned asset catalog for official Micron icon images and motion files used by slide-generation workflows.
_Avoid_: html-slides icon folder, inline icon dump

**Icon-Only Scope**:
The boundary that Micron Icons owns iconography only, not logos, photos, title images, or general brand assets.
_Avoid_: generic Micron brand asset dump, visual asset catch-all

**Curated Icon Manifest**:
A normalized index of usable Micron icon assets with original filenames preserved as metadata.
_Avoid_: raw archive listing, generated file dump

**Icon Manifest Schema**:
The versioned JSON structure for Micron icon metadata, source archives, recommended groups, and icon entries.
_Avoid_: unversioned manifest, implicit JSON shape

**Semantic Icon Lookup**:
Finding icons by meaning, category, style, and media type rather than by source archive filename.
_Avoid_: filename lookup, path guessing

**Theme Icon Style Default**:
The default icon polarity inferred from a slide theme when no explicit icon style is requested.
_Avoid_: hard-coded filename polarity, manual style guessing

**Decorative Icon Use**:
Using Micron icons as visual texture or supporting decoration, not only as semantic labels.
_Avoid_: icon wallpaper, mixed icon clutter

**Agent-Chosen Decorative Icon**:
A decorative Micron icon selected by the agent based on visual fit rather than an explicit semantic match.
_Avoid_: user-gated decorative choice, random clutter

**Recommended Icon Group**:
A named bundle of icon categories suited to a recurring slide pattern.
_Avoid_: one-off icon taxonomy, hard-coded filenames

**Group Icon Lookup**:
Finding icons by a recommended group, with optional query refinement.
_Avoid_: browsing every category, forcing filename knowledge

**Deterministic Icon Selection**:
A stable icon ordering that returns the same default result for the same group, filters, and query.
_Avoid_: random defaults, non-reproducible deck assets

**Curated Group Defaults**:
Human-chosen default icon order for each recommended icon group.
_Avoid_: filename-sorted defaults, scoring-only defaults

**Icon Skill Eval**:
A focused verification check for extraction counts, manifest anomaly mapping, deterministic finder output, or preview loading.
_Avoid_: untested asset catalog, visual-only validation

**Icon Unit Test**:
A Python test for deterministic Micron Icons script and manifest behavior.
_Avoid_: agent-grading eval for script behavior

**Relative Icon Snippet**:
An HTML snippet that references a Micron icon asset by relative path without copying it into a deck folder.
_Avoid_: packaging output, asset bundling side effect

**Local Icon Path**:
A filesystem-relative reference to a Micron icon asset, used instead of embedding asset bytes.
_Avoid_: data URI, embedded MP4, bloated single-file HTML

**Curated Icon Label**:
A human-readable icon name and alt text stored in the manifest for accessible snippets.
_Avoid_: slug-only alt text, generated filename label

**Decorative Icon Alt**:
Empty alt text plus hidden semantics for decorative icon snippets.
_Avoid_: noisy screen-reader label, misleading semantic alt

**HTML Slides Icon Integration**:
Operational `html-slides` guidance for using Micron Icons in Micron themes.
_Avoid_: broken integration instructions, premature runtime dependency

**Micron Icon Asset Tree**:
The normalized extracted asset layout inside the standalone Micron Icons skill.
_Avoid_: raw zip structure, mixed asset folder

**Icon Finder**:
A deterministic helper script that resolves semantic icon queries into usable asset paths or HTML snippets.
_Avoid_: manual manifest scanning, agent guessing

**Icon Extractor**:
A deterministic helper script that rebuilds the Micron icon asset tree and manifest from source archives.
_Avoid_: one-off manual unzip, unreproducible asset copy

**Icon Preview**:
A static browser page for visually filtering and checking Micron icon assets from the manifest.
_Avoid_: build app, manual folder browsing

**Micron Icons Skill Spec**:
The implementation handoff that records archive analysis and the future standalone skill contract before scaffolding.
_Avoid_: immediate scaffold, vague skill idea

**Complete Icon Skill Build**:
A future `skill-creator` run that creates docs, scripts, manifest, tests, preview, and extracted assets together.
_Avoid_: docs-only scaffold, script-only scaffold

**Animated Icon**:
A Micron primary MP4 icon used only for intentional motion moments, not routine icon placement.
_Avoid_: default icon, grid icon, chart icon

**Original Icon Asset**:
An extracted Micron icon file preserved without recompression, recoloring, conversion, or visual edits.
_Avoid_: optimized derivative, converted SVG, recolored icon

**Source Icon Archive**:
The original Micron zip file used as extraction input but not copied into the standalone skill by default.
_Avoid_: bundled zip, duplicated archive

**HTML Slides**:
The multi-theme skill that builds and verifies single-file HTML slide decks.
_Avoid_: Micron-only slides skill

**Style Selection**:
The final question asked of the user before a deck is built — "which theme?". Resolved after content and delivery format. Lives in `html-slides`, never in `slide-brainstorm`.
_Avoid_: theme question asked during brainstorm, theme inferred without user confirmation

**Theme Selector**:
The visual aid presented to the user during **Style Selection** — a single HTML page (`themes/selector.html`) that renders every stable theme from `themes.json` for side-by-side comparison. Optimised for decision speed, not portfolio impression.
_Avoid_: marketing gallery, portfolio showcase, decoration-first design

**Guided Learning Palette**:
The color system for the `guided-learning` theme. It should stay warm-paper and academic, but use a more refined color set than the copied source template.
_Avoid_: dark classroom palette, generic blue training portal

**Warm Paper V2**:
The chosen **Guided Learning Palette** direction: a soft technical lab palette with graphite text, mist background, ice-blue structure, Micron purple for all purple roles, and plasma-pink quiz/exercise accents.
_Avoid_: green accents, beige-only theme, soft beauty palette

## Relationships

- **HTML Slides** may reference **Micron Icons** when a Micron deck needs official iconography.
- **Micron Icons** owns extracted icon assets and icon usage rules.
- **Icon-Only Scope** keeps non-icon Micron assets in theme assets or separate future skills.
- **Micron Icons** extracts all clean source assets but exposes them through a **Curated Icon Manifest**.
- **Icon Manifest Schema** starts at `schema_version: 1` and records generation metadata, source archives, recommended groups, and icons.
- **Curated Icon Manifest** enables **Semantic Icon Lookup** for agents and slide workflows.
- **Theme Icon Style Default** maps `micron-light` to `pos` and dark Micron themes to `rev`.
- **Decorative Icon Use** is allowed when visually restrained and compatible with the Micron theme.
- **Agent-Chosen Decorative Icons** do not require user selection when they support the slide visually.
- **Recommended Icon Groups** guide agent selection for common deck patterns.
- **Group Icon Lookup** lets the **Icon Finder** return defaults from a recommended group when no specific query is given.
- **Deterministic Icon Selection** is required for default **Group Icon Lookup** results.
- **Curated Group Defaults** are the source of deterministic group ordering.
- **Icon Skill Evals** verify the extractor, manifest, finder, and preview surface.
- **Icon Unit Tests** are the preferred eval form for deterministic script and data behavior.
- **Relative Icon Snippets** keep **Micron Icons** a catalog; deck asset copying belongs to slide export or packaging workflows.
- **Local Icon Paths** are the v1 output contract; data URI embedding is out of scope.
- **Curated Icon Labels** provide accessible HTML alt text; slug-derived labels are fallback only.
- **Decorative Icon Alt** is used when the finder emits HTML for decorative icon use.
- **HTML Slides Icon Integration** lets Micron themes call `micron-icons` for official iconography and decorative icon texture.
- **Micron Icon Asset Tree** lives under `assets/` with primary PNG, primary MP4, secondary category PNGs, `manifest.json`, and `README.md`.
- **Icon Extractor** rebuilds the **Micron Icon Asset Tree** and **Curated Icon Manifest** from the original archives.
- **Icon Finder** reads the **Curated Icon Manifest** and returns matching assets for slide workflows.
- **Icon Preview** reads the **Curated Icon Manifest** and gives users and agents a visual extraction check.
- **Micron Icons Skill Spec** precedes skill creation and should be consumed by `skill-creator`.
- **Complete Icon Skill Build** is expected when `skill-creator` creates `micron-icons`.
- **HTML Slides** owns deck runtime, themes, scaffold, and verification.
- **HTML Slides** may auto-use **Micron Icons** for Micron themes only; non-Micron themes use them only when the user explicitly asks.
- **Animated Icons** are opt-in; default icon lookup should prefer PNG assets.
- **Micron Icons** preserves each **Original Icon Asset** byte-for-byte while recording normalized path, original filename, and source archive in the manifest.
- **Source Icon Archives** remain outside the skill by default; the skill records archive names but does not duplicate zip files.
- **Theme Selector** is consumed at **Style Selection** time; its goal is to help the user choose the right theme with least regret, not to advertise the skill.
- **HTML Slides** treats **Style Selection** as the last question before build; the agent reads `themes.json` and may link the user to the **Theme Selector** to compare.
- **Guided Learning Palette** belongs to **HTML Slides** as the visual language for the `guided-learning` training theme.
- **Warm Paper V2** is the current target expression of **Guided Learning Palette**.

## Example dialogue

> **Dev:** "Should we put the Micron icon archives inside **HTML Slides**?"
> **Domain expert:** "No. **Micron Icons** is standalone; **HTML Slides** should only use it when a deck needs official Micron iconography."

## Flagged ambiguities

- "micron icons" resolved as a standalone skill, not a subfolder owned by **HTML Slides**.
- "micron-icons scope" resolved as **Icon-Only Scope**, not a general Micron visual asset catalog.
- "extract icon sets" resolved as preserving all clean assets while making the manifest curated and normalized.
- "manifest shape" resolved as a versioned **Icon Manifest Schema**.
- "icon lookup" resolved as **Semantic Icon Lookup**, not direct filename selection.
- "theme icon style" resolved as a **Theme Icon Style Default** that explicit style requests can override.
- "decorative icons" resolved as allowed, with restraint, instead of semantic-only icon use.
- "decorative icon choice" resolved as agent-chosen, not user-gated.
- "common pattern lookup" resolved as **Recommended Icon Groups** instead of raw category browsing only.
- "finder group support" resolved as **Group Icon Lookup** with optional query refinement.
- "group lookup ordering" resolved as **Deterministic Icon Selection**, not randomized defaults.
- "group default source" resolved as **Curated Group Defaults**, not sorting or scoring alone.
- "skill verification" resolved as minimal **Icon Skill Evals** covering counts, anomalies, deterministic finder output, and preview loading.
- "eval format" resolved as Python **Icon Unit Tests**, not skill eval JSON, for deterministic script behavior.
- "HTML snippet ownership" resolved as **Relative Icon Snippets** only; portable deck packaging is outside **Micron Icons**.
- "asset reference format" resolved as **Local Icon Paths** only for v1, not data URI embedding.
- "icon alt text" resolved as **Curated Icon Labels**, with slug fallback only when missing.
- "decorative accessibility" resolved as **Decorative Icon Alt** with `alt=""` and hidden semantics.
- "html-slides docs timing" resolved as **HTML Slides Icon Integration** now that the standalone skill exists.
- "asset placement" resolved as a normalized **Micron Icon Asset Tree** inside the future standalone skill.
- "helper tooling" resolved as an **Icon Finder** script, not manifest-only documentation.
- "asset extraction" resolved as a reproducible **Icon Extractor**, not manual unzip.
- "source archives" resolved as external inputs, not bundled assets, unless explicitly changed later.
- "html-slides integration" resolved as optional for Micron themes and explicit opt-in for non-Micron themes.
- "animated icons" resolved as opt-in motion assets for hero, title, or transition moments, not default icon candidates.
- "asset processing" resolved as preservation of **Original Icon Assets**, with no recompression, recoloring, conversion, or optimization.
- "visual review" resolved as a static **Icon Preview** page, not a separate built application.
- "analysis timing" resolved as writing a **Micron Icons Skill Spec** now and creating the actual skill later with `skill-creator`.
- "future skill creation" resolved as a **Complete Icon Skill Build**, including real extracted assets.
