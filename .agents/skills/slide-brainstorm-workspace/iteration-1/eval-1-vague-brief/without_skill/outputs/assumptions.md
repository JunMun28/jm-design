# Assumptions

The brief was *"i want to make a deck about kubernetes for non-engineers"* with no other context. Since this run is non-interactive, here are the assumptions I made and how to override each one.

## Audience
- **Assumed:** PMs, business / operations leadership, junior execs in a tech-adjacent company. Smart, comfortable reading a roadmap, but not engineers.
- **If wrong:** Audience could equally be sales reps, recruiters, students, customers, or board members. Each would change the analogies and the cost/value framing.

## Purpose of the deck
- **Assumed:** Explainer / lunch-and-learn — the speaker wants the audience to understand what K8s is and why their company uses it.
- **Alternatives I did NOT design for:**
  - Pitch to leadership for a migration budget (would need ROI math, vendor comparison).
  - Onboarding for new hires (would need glossary, links, follow-up reading).
  - Internal "should we adopt K8s?" debate deck (would need decision criteria, options, recommendation).

## Length & format
- **Assumed:** ~10 slides, ~15-minute talk, exported as HTML (browser-viewable, PDF-printable).
- **Not produced:** `.pptx`, Google Slides, Keynote, or Figma. If any of those is required, the outline (`outline.md`) is the fastest hand-off.

## Tone & visual style
- **Assumed:** Warm, plain-English, slightly editorial. Dark theme, no logo, restrained.
- **If wrong:** Could be playful (illustrations, comic-style), corporate (matched to a brand kit), or academic (more text per slide, citations). Brand colors and fonts weren't provided so I used neutral defaults.

## Depth of technical content
- **Assumed:** Stop at the "cluster / node / pod / control plane" mental model. No YAML, no `kubectl`, no networking deep-dive, no security primer.
- **If the audience is more technical** (e.g. data analysts, designers, engineering managers), I'd add 2-3 slides on networking, ingress, and how teams interact with it day-to-day.

## Region / industry
- **Assumed:** Generic / global. Restaurant analogy is culturally neutral.
- **If industry-specific** (banking, healthcare, e-commerce, gaming), the day-in-the-life slide and the "who uses it" framing would be tailored.

## Speaker notes
- **Assumed:** Light — one example note included on slide 2 as a pattern. Full speaker notes weren't requested and would roughly double the file size.
- **If needed:** I can add a structured speaker-notes block per slide in a follow-up.

## What's deliberately missing
- A vendor / managed-K8s comparison (EKS vs. GKE vs. AKS vs. self-hosted).
- A history slide ("born at Google, donated to CNCF in 2014…").
- Live demo or animated diagrams.
- Q&A / discussion-prompt slide.
- Real customer logos or case studies (would need user-provided sources to avoid making claims up).

Each of those is a 1-slide add if requested.
