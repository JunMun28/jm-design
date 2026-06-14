---
name: theme-factory
description: Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fonts that you can apply to any artifact that has been creating, or can generate a new theme on-the-fly.
license: Complete terms in LICENSE.txt
---


# Theme Factory Skill

This skill provides a curated collection of professional font and color themes, each with carefully selected color palettes and font pairings. Once a theme is chosen, it can be applied to any artifact.

## Purpose

To apply consistent, professional styling to presentation slide decks, use this skill. Each theme includes:
- A cohesive color palette with hex codes
- Font pairings for headers and body text, drawn from PDF-safe families (DejaVu and GNU FreeFont, which PDF toolchains such as reportlab bundle), plus an optional "if available" pairing for renderers with richer font access
- A distinct visual identity suitable for different contexts and audiences

## Usage Instructions

To apply styling to a slide deck or other artifact:

1. **Show the theme showcase**: Display the `theme-showcase.pdf` file to allow users to see all available themes visually. Do not make any modifications to it; simply show the file for viewing.
2. **Ask for their choice**: Ask which theme to apply to the deck
3. **Wait for selection**: Get explicit confirmation about the chosen theme
4. **Apply the theme**: Once a theme has been chosen, apply the selected theme's colors and fonts to the deck/artifact

## Themes Available

The following 10 themes are available, each showcased in `theme-showcase.pdf`:

1. **Ocean Depths** - Professional and calming maritime theme
2. **Sunset Boulevard** - Warm and vibrant sunset colors
3. **Forest Canopy** - Natural and grounded earth tones
4. **Modern Minimalist** - Clean and contemporary grayscale
5. **Golden Hour** - Rich and warm autumnal palette
6. **Arctic Frost** - Cool and crisp winter-inspired theme
7. **Desert Rose** - Soft and sophisticated dusty tones
8. **Tech Innovation** - Bold and modern tech aesthetic
9. **Botanical Garden** - Fresh and organic garden colors
10. **Midnight Galaxy** - Dramatic and cosmic deep tones

## Theme Details

Each theme is defined in the `themes/` directory with complete specifications including:
- Cohesive color palette with hex codes and semantic role mapping
- Font pairings for headers and body text (DejaVu/GNU FreeFont defaults, with optional pairings when the renderer has them)
- Pre-computed WCAG contrast table of approved text pairs
- Type scale matching the html-slides font-size floors
- Distinct visual identity suitable for different contexts and audiences

## Color Deployment Rules

Every theme's palette maps to four semantic roles (see the "Semantic role mapping" line in each theme file). Deploy them in these proportions:

1. **Base/background (60–70% of any slide)**: The base color covers 60–70% of the slide or page. Backgrounds, large panels, and breathing room all count toward this share.
2. **Primary accent (at most ~10% of elements)**: The active/emphasis color appears on at most ~10% of elements, and only on the message-carrying content — the one number, phrase, or shape the audience must notice. One accent moment per slide.
3. **Secondary accent (de-emphasized context)**: Use the context color only for supporting elements — captions, borders, secondary fills, background shapes. It must never compete with the primary accent.
4. **Text**: Use the theme's text color for all reading content, and only in combinations from the theme's "Approved pairs" table.

### Contrast Thresholds

- Every text/background pair needs **≥4.5:1** contrast (WCAG AA for normal text).
- Body text on light backgrounds needs **≥7:1** (WCAG AAA).
- Use only the pre-computed "Approved pairs" listed in each theme file; do not eyeball ratios.
- When the styled artifact is an HTML slide deck, run the mechanical gate before declaring it done:

  ```bash
  python3 .claude/skills/html-slides/scripts/verify.py <deck.html> --fail-on-warnings
  ```

## Application Process

After a preferred theme is selected:
1. Read the corresponding theme file from the `themes/` directory
2. Apply the specified colors and fonts consistently throughout the deck, following the Color Deployment Rules above
3. Verify contrast: every text pair must meet ≥4.5:1 (≥7:1 for body text on light backgrounds), using only the theme's "Approved pairs" table; for HTML slide decks, run `verify.py --fail-on-warnings` as the mechanical gate
4. Maintain the theme's visual identity across all slides

## Create your Own Theme
To handle cases where none of the existing themes work for an artifact, create a custom theme. Based on provided inputs, generate a new theme similar to the ones above. Give the theme a similar name describing what the font/color combinations represent. Use any basic description provided to choose appropriate colors/fonts. After generating the theme, show it for review and verification. Following that, apply the theme as described above.
