# Micron HTML slides creative flexibility brainstorm

Date: 2026-05-13

## What we're building

Update the `micron-html-slides` skill direction so Micron dark decks are no longer anchored to `micron_engineering_slide_demo_d_3.html`.

The skill should keep the Micron dark visual identity: black canvas, high contrast, precise typography, restrained purple/cyan accents, premium engineering feel, and strong slide readability. Content slides should be freeform per topic. The generator should not reuse fixed demo content layouts, process boards, dashboards, or rhythm as a default.

Title slides can still use Micron-style title templates, but those templates should live in a reference document as reusable snippets or written recipes. The demo file should become deletable without breaking the skill.

## Why this approach

The current references repeatedly tell the agent to inspect and match `micron_engineering_slide_demo_d_3.html`. That creates repetitive output: same fixed stage, same topbar rhythm, same content boards, same visual patterns.

The chosen approach is principles-only for content slides. This gives maximum creative freedom and fits the user's intent: "take inspiration style only, not exact same layout." It also keeps the skill simpler than maintaining a large pack of predefined slide layouts.

The tradeoff is drift risk. Without fixed templates, the skill needs stronger quality guardrails: one clear message per slide, no generic AI visuals, no nested cards, no decorative noise, good hierarchy, and verified fit across desktop and mobile.

## Key decisions

- Use Micron dark style as the required visual language, not the demo file as a layout source.
- Remove demo-matched mode entirely.
- Do not require `micron_engineering_slide_demo_d_3.html` for future generation.
- Move title templates into a reference doc with reusable CSS/HTML snippets or recipes.
- Content slides should be freeform per topic, guided by quality rules only.
- The runtime can vary when appropriate, as long as deck navigation, verification, and single-file HTML expectations remain intact.

## Resolved questions

- Content default: Micron style only, not fixed demo layouts.
- Mandatory baseline: dark Micron look, with flexible layout/runtime.
- Demo file role: no content reference; title inspiration should be extracted elsewhere.
- Title template storage: reference document snippets/recipes.
- Demo-matched mode: remove.
- Content creativity: freeform per topic with quality rules only.
- Preferred approach: principles-only, not a layout-family fallback.

## Open questions

None.

## Success criteria

- A future deck can be generated after deleting `micron_engineering_slide_demo_d_3.html`.
- Content slides look varied across topics and do not repeat the demo's process-board/dashboard patterns by default.
- Micron brand feel remains recognizable: dark, precise, restrained, high contrast.
- Title templates remain available without depending on the demo file.
- Verification still checks navigation, overview, desktop fit, and mobile fit.

## Not in scope

- Rewriting the whole slide generator.
- Creating a large library of content layout templates.
- Changing the user's existing generated deck.
- Producing PPTX output.

## Next

Run `/prompts:workflows-plan` against this brainstorm when ready to design the implementation steps.
