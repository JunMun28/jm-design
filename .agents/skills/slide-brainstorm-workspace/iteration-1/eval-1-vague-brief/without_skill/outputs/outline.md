# Outline — Kubernetes for Non-Engineers

Through-line: **A restaurant-chain analogy that scales from slide 3 to slide 10.** Software is the menu; servers are the kitchens; Kubernetes is the general manager.

| # | Slide | Beat | Takeaway |
|---|-------|------|----------|
| 1 | **Title** | Kubernetes, explained like you're smart, not technical. | Set the room — this won't be jargon-y. |
| 2 | **The hook** | You hear it in the news, your roadmap, and your AWS bill. | You already have skin in the game. |
| 3 | **The problem** | Running software reliably at scale is hard. Restaurant chain with 200 locations. | The pain is human and operational, not abstract. |
| 4 | **The analogy** | Kubernetes is the general manager: self-healing, self-scaling, self-deploying. | One sentence definition the audience can repeat. |
| 5 | **Containers primer** | Before K8s there's the container — a lunchbox with one app inside. K8s is the cafeteria operator. | Disambiguate Docker vs. Kubernetes in 30 seconds. |
| 6 | **Anatomy** | Cluster → nodes → pods, with control plane as the brain. Visual diagram. | Audience walks away with a real mental model. |
| 7 | **Day in the life** | Black Friday timeline: spike, scale, failure, recovery, deploy. | Shows the value without showing code. |
| 8 | **Business value** | Reliability · Speed · Cost control · Portability. | Why it's worth the line item. |
| 9 | **Myths & gotchas** | Not magic, not free, not always the right answer. | Earn credibility by naming the downsides. |
| 10 | **Cheat sheet + close** | 6 vocabulary cards + one quotable closing line. | Audience leaves with a vocabulary they can use in their next meeting. |

## Narrative arc

1. **Validate** (slides 1–2): you already know this word exists.
2. **Frame the problem** (slide 3): software at scale is hard.
3. **Reveal the solution** (slides 4–6): what K8s is, how to picture it.
4. **Show it working** (slide 7): one concrete scenario.
5. **Translate to business** (slide 8): why it's on the roadmap.
6. **Stay honest** (slide 9): credibility through nuance.
7. **Equip & close** (slide 10): vocabulary + memorable line.

## Suggested edits if running long

- Cut slide 9 (myths) → 13 minutes.
- Combine slides 5 + 6 into a single "Picture It" slide → 12 minutes.
- Cut slide 7 (day in the life) → 10 minutes. *Don't recommend this — it's the most memorable slide.*

## Suggested adds if running short

- Slide 2.5: "Who already runs everything on this" with a few well-known names (verify with the speaker first).
- Slide 8.5: a single number — e.g. "78% of Fortune 500 companies run Kubernetes" (verify before stating).
- Closing Q&A prompt slide with 3 starter questions.
