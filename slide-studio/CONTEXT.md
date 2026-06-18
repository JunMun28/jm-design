# Slide Studio

The local app inside `jm-design` that drives a coding-agent CLI (codex / Copilot) to build Micron slide decks. This glossary fixes the language the UI and code should share.

## Language

**Project**:
One deck-building workspace — a single brief, its conversation, its artifacts, and its outputs. Persisted as one directory (`project.json` + `conversation.jsonl`). The Library shows **one card per Project**.
_Avoid_: Notebook, document.

**Deck**:
A themed variant of rendered slides **inside** a Project. A Project has one or more Deck variants (`decks[]`), one of them active. Casually, users call a whole Project "a deck" — the card label says "deck" but the entity is a Project.
_Avoid_: Presentation, slideshow.

**Deck Library** (or **Library**):
The landing screen for a returning user: a grid (or list) of cards, one per past Project, each showing a live slide preview. Replaces the old single-screen home where the composer and the deck list shared one page.
_Avoid_: Home, dashboard, gallery.

**Composer**:
The clean, focused create screen (`/new`): a centered text box plus attach, starter chips, and the runtime selector. Submitting creates a Project and routes into the Workspace. It is **not** a conversation — the back-and-forth happens in the Workspace.
_Avoid_: Chat page, chatbot screen, prompt page.

**Workspace**:
The per-Project working view (`/workspace/:id`): the live chat with the agent plus the rendered deck and gate controls. Reached by submitting the Composer or clicking a Library card.

**Landing screen**:
Whichever screen the app opens to. The rule: no agent runtime ready → onboarding (`/welcome`); zero Projects → Composer (`/new`); one or more Projects → Library (`/`). ("First login" is informal — the app is local and has no auth.)

**Stage**:
A Project's current pipeline step — `brief` → `wireframe` → `theme` → `deck`. Shown as the card's badge.

**Runtime**:
The coding-agent CLI the daemon detects and drives (Copilot preferred, codex fallback). Surfaced as the Composer's runtime selector only when more than one is available.

## Flagged ambiguities

- **"Deck" = Project vs Deck-variant.** A Library card represents a **Project** but is labeled a "deck," because a Project usually has exactly one Deck. When precision matters (e.g. `setActiveDeck`, deck `slides` count), "Deck" means the variant; everywhere user-facing, "deck" means the Project. Don't rename the card label — just keep the code distinction.

## Example dialogue

> **Dev:** When the user clicks a card in the Library, what opens?
> **Expert:** The Workspace for that Project — chat plus the live deck — so they can keep building.
> **Dev:** And "Create new" from the Library?
> **Expert:** Routes to the Composer at `/new`. That screen only composes the brief; the real conversation starts in the Workspace once the Project exists.
> **Dev:** So a brand-new user with no Projects?
> **Expert:** Lands straight on the Composer — there's no Library to show yet, and no "← Decks" link because there's nothing to go back to.
