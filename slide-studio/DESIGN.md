# Design

The visual system for the Slide Studio **app shell** (the Library, Composer, and
their chrome). Decks themselves follow their own per-theme rules; this governs
the tool around them. Reference register: a calm, premium recording-studio
instrument (warm light, soft panels, thin gauges, near-monochrome).

## Color

Near-monochrome on warm white. Color is an event, not a surface.

| Role | Token | Light value | Note |
|---|---|---|---|
| Page | `--paper` | `#f6f5f2` | warm off-white, never `#fff` |
| Panel | `--panel` | `#fdfdfc` | cards / surfaces |
| Ink | `--ink` | `#1d1c1b` | headings, primary numerals |
| Muted | `--muted` | `#8d8a85` | body, secondary |
| Faint | `--faint` | `#bdb9b2` | micro-labels, gauge tracks |
| Hairline | `--line` | `#e9e6e0` | borders, dividers |
| **Magenta** | `--mag` | `#c62a68` | the *only* chromatic accent |
| Magenta soft | `--mag-soft` | `rgba(198,42,104,0.12)` | rare tint fill |

### The magenta rule (very, very minimal)

Magenta appears in at most **one or two spots per screen**, each tiny:

- the **live/active status dot** (recording-active equivalent),
- the **micro-square inside the single primary action** button,
- optionally **one** "active/most-recent" marker dot.

Magenta does **not** color: gauges, arcs, headings, large fills, borders, icons,
text, hovers, or backgrounds. Ring gauges are ink on a faint track, never
magenta. If you can see magenta from across the room, it is overused. Desaturated
and deep, never neon. (This diverges from the legacy `--mic-accent` purple; adopt
app-wide only on sign-off.)

## Typography

- Display headings: large, **light/regular** weight (not bold), tight tracking
  (`-0.02em`), often with a trailing period ("Your decks."). Scale ≥1.25 between steps.
- Micro-labels: ~11px, **uppercase**, letter-spaced (`0.12em`), `--faint`. Used for
  field labels (INPUT LEVEL, SESSION DURATION, STAGE).
- Numerals: large, light, `font-variant-numeric: tabular-nums` for timers/values.
- Body/meta: `--muted`, regular. Sentence case everywhere except micro-labels.

## Surface & layout

- Big radius on major panels (`22px`), `14–16px` on inner cards.
- **Soft, almost flat**: hairline borders + at most a very soft shadow. No heavy drop
  shadows, no glassmorphism as default.
- Generous, *uneven* whitespace: large panels breathe; group related cards tightly,
  separate groups loosely.
- Pills for secondary controls (rounded-full, hairline, optional `▾`).
- One black primary button per screen; everything else is quiet.

## Components

- **Ring gauge**: thin SVG circle, faint track + ink arc by value, value + unit
  centered. Stage maps brief→25, wireframe→50, theme→75, deck→100.
- **Status card**: label + sublabel + a single magenta dot when active.
- **Spectrum/waveform motif**: tiny neutral bars; decorative calm, never magenta.
- **Placeholders are calm**: a deck without a built preview shows a quiet neutral
  panel (a faint spectrum + stage), never a hard gray box and never busy art.

## Motion

- Calm and brief. Ease-out (`cubic-bezier(0.16,1,0.3,1)`), 0.4–0.7s, small travel.
- No bounce, no elastic. Respect `prefers-reduced-motion` (freeze).
