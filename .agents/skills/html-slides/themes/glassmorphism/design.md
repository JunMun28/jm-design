# Glassmorphism

Frosted-glass panels stacked over a vibrant gradient field. Soft depth, backdrop blur, light borders. Modern SaaS / fintech / lifestyle pitch energy.

Reference lineage: Apple visionOS UI, Stripe checkout polish era, Linear marketing site.

## When to choose this theme

- Modern SaaS, fintech, or lifestyle pitch decks.
- Decks that want depth and atmosphere without leaning editorial.
- Visual product showcases where panels float over a hero background.

## When not

- Print or data-heavy decks — blur kills contrast.
- Accessibility-critical contexts — backdrop-filter performance varies.
- Engineering reviews — use `micron-dark-engineering`.

## Tokens (frozen)

Paste `themes/glassmorphism/tokens.css` first.

```
--bg-gradient: linear-gradient(135deg, #0080FF 0%, #8B00FF 50%, #FF1493 100%)
--glass-bg: rgba(255, 255, 255, 0.12)
--glass-border: rgba(255, 255, 255, 0.28)
--glass-blur: 18px
--ink: #FFFFFF
--ink-muted: rgba(255, 255, 255, 0.72)
--accent: #20B2AA           (teal — readable on any glass surface)
--font-display: "Inter"
--font-body: "Inter"
```

## Typography

- Inter throughout. 600 for headlines, 400 body.
- Headlines on glass surfaces use white only.
- Body copy on glass needs ≥ 4.5:1 ratio against the *worst-case* underlying gradient point — verify both ends.

## Layout

- One vibrant gradient sits on the slide background. Glass panels overlay it.
- Panels: `backdrop-filter: blur(18px)`, 1 px translucent border, slight inner highlight.
- Panel padding generous (32 px min).
- Never stack more than 2 glass layers; the blur cost compounds.

## Accent rules

- Teal (`#20B2AA`) is the only accent. It works because it's neither in the gradient nor white.
- One accent per slide.

## Anti-patterns

| Don't | Why |
|---|---|
| `bg-white/10` in light mode | Invisible — use ≥ 0.2 opacity if the underlying bg is light |
| Body text < 16 px on glass | Blur halos make small text fuzzy |
| Stacking 3+ glass panels | Performance + visual mush |
| Black text on glass | Glassmorphism is a light-text-on-coloured-blur theme |
| Hard 90° gradients | Use 135° corner-to-corner |

## Verify config

```json
{
  "required_tokens": ["--bg-gradient","--glass-bg","--glass-border","--ink","--accent"],
  "accent_rgb": "32, 178, 170",
  "accent_max_per_slide": 6,
  "logo_pattern": null,
  "require_logo_on_content_slides": false,
  "forbid_chart_on_gradient": false,
  "headline_contrast_min": 4.5,
  "palette_lock": true
}
```

(Charts on gradient are allowed here — the theme *is* a gradient. Place charts inside a solid-enough glass panel for legibility.)
