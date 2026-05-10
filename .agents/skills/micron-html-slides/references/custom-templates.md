# Custom templates

Use these only when the user explicitly does not want the Micron theme, asks for a different visual style, or names one of these deck types.

Micron remains the default. Custom templates still use the single-file deck rule and the canonical vertical scroll-snap + ESC overview architecture.

## Template selector

| Template | Use when | Asset |
|---|---|---|
| Course module | Teaching, training, workshop, lesson, course module | `assets/custom-templates/course-module/example.html` |
| Weekly update | Weekly status, team update, shipped/in-flight/blocked/metrics/asks | `assets/custom-templates/weekly-update/example.html` |

## Rules

- Treat examples as visual/layout references, not final content.
- Keep output single-file HTML.
- Keep viewport fitting, no internal slide scroll.
- Preserve visual/layout ideas from the selected template, but use the canonical runtime: vertical scroll-snap, keyboard, wheel/swipe, dots, and ESC overview.
- Replace demo copy completely.
- Remove references to missing sibling skills or upstream paths.
- Verify with `references/verification.md`.

## Course module

Visual feel:

- warm paper background
- serif headings
- persistent learning-objective/sidebar feel
- teaching flow
- optional MCQ/self-check slide
- optional speaker notes in hidden `.notes` / `aside.notes`, never visible slide copy

Ask for:

- module title
- audience
- 3-5 learning objectives
- key sections
- self-check question, if needed

## Weekly update

Visual feel:

- operational status deck
- compact team update
- clear shipped / in-flight / blocked / metrics / asks flow

Default slide outline:

1. Cover
2. One headline and key number
3. What shipped
4. In flight
5. Blocked
6. Metrics
7. Asks
8. Close

Ask for:

- squad/team
- week range
- shipped items
- in-flight items
- blockers
- metrics
- asks and owners
