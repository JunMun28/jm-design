# Playful

Bright primaries, fat geometric type, oversized stickers and shapes. Friendly, warm, willing to be silly. Energy is the point.

Reference lineage: MailChimp marketing era, Notion onboarding, Duolingo branding, Memphis-design echoes.

Headline rule: playful tone, serious titles — every content-slide headline still states the takeaway as a full sentence, never a bare topic label (see SKILL.md Non-Negotiables).

## When to choose this theme

- Workshops, kickoffs, onboarding decks.
- Internal team morale / culture talks.
- Consumer products with an approachable brand.
- Decks where the audience needs energising, not informing.

## When not

- Anything corporate or formal.
- High-data engineering decks.
- Formal longform or high-density narrative decks.

## Tokens (frozen)

Paste `themes/playful/tokens.css` first.

```
--bg: #FFF8E7              (warm cream)
--ink: #2B2118             (warm near-black)
--ink-muted: #6B5E51
--accent: #FF6B6B          (coral)
--accent-2: #4ECDC4        (teal)
--accent-3: #FFE66D        (sunshine)
--accent-4: #6C5CE7        (grape)
--rule: #2B2118
--font-display: "Fraunces"  (variable, optical 144)
--font-body: "DM Sans"
```

A four-colour palette is intentional — playful decks rotate colour per slide instead of leaning on one accent.

## Typography

- Fraunces (variable, optical 144) for headlines. Set `font-optical-sizing: auto` for the bowls to swell at large sizes.
- DM Sans for body. 500 default — playful loves a slightly heavier body weight.
- Headlines are big: `clamp(2.5rem, 6vw, 4.5rem)`.
- Allow occasional `text-rotate` (±3deg) on stickers — never on body text.

## Layout

- Asymmetric. Sticker-style shapes off-grid.
- One "sticker" element per slide: a rotated chip, a circle, an underline scribble.
- Generous border-radius (16–32 px).
- Soft drop shadow on cards: `0 6px 0 var(--ink)` (chunky, not gaussian).

## Accent rules

- Each slide picks **one** accent from the four. Rotate across the deck.
- `accent_max_per_slide: 8` because playful uses accent as fill, border, and sticker simultaneously — verify checks the *primary* accent (coral) so secondary uses on the other three colours don't trip it.
- Never use all four accents on the same slide.

## Anti-patterns

| Don't | Why |
|---|---|
| Use all four accents per slide | Reads as confused, not playful |
| Gaussian shadows | Theme calls for hard 6 px offset shadows |
| Tiny body text | Playful demands generous size and weight |
| Greyscale slides between coloured ones | Inconsistent — every slide carries energy |
| Stock illustrations of cartoon people | Use shapes / stickers, not generic vector mascots |

## Verify config

```json
{
  "required_tokens": ["--bg","--ink","--accent","--accent-2","--accent-3","--accent-4","--font-display","--font-body"],
  "accent_rgb": "255, 107, 107",
  "accent_max_per_slide": 8,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": false,
  "headline_contrast_min": 4.5,
  "palette_lock": true
}
```
