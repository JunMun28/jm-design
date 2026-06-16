/**
 * Annotation system (plan §10, Slice 4 / issue #11). The user reviews the low-fi
 * Wireframe in a sandboxed iframe and pins **Annotations** — a comment anchored to
 * an element, a text range, or a whole slide. Queued annotations serialize into a
 * structured `<attached-preview-comments>` block (anchors, slide index, screenshot
 * ref, and a scoped "change ONLY these elements" instruction) the agent reads, so
 * it revises **exactly** those elements and the iframe live-reloads.
 *
 * This module is the hardest-to-rebuild asset (plan AD-6): the anchoring is
 * borrowed from lavish (`/tmp/slide-research/lavish-axi/src/artifact-sdk.js`) and
 * the per-slide comment payload from open-design. It splits into three pure,
 * DOM-library-agnostic parts so the Slice-4 suites can exercise them under jsdom
 * with no browser:
 *
 *   1. Anchoring   — capture an element / text-range anchor that survives small
 *                    edits, and **relocate** it after the DOM mutates.
 *   2. Serializer  — turn queued annotations into the `<attached-preview-comments>`
 *                    block (with the scoped instruction) the agent reads.
 *   3. SDK source  — the vanilla-JS overlay string the daemon injects before
 *                    `</body>` of the sandboxed Wireframe iframe (kept here so the
 *                    capture logic it ships matches the host-side anchoring 1:1).
 *
 * Everything here is framework-free and operates on the standard DOM interfaces
 * (`Document`, `Element`, `Node`), so it runs identically in the browser iframe
 * and under jsdom in the tests.
 */

// --- Anchor shapes ---------------------------------------------------------

/** A re-locatable boundary inside an element: the closest element's selector,
 *  the child-index path from that element down to the text node, and the
 *  character offset. Mirrors lavish's `rangeBoundary`. */
export interface TextBoundary {
  /** CSS selector for the closest *element* ancestor of the boundary node. */
  selector: string;
  /** Child-index path from that element down to the boundary node. */
  path: number[];
  /** Character offset within the boundary node. */
  offset: number;
}

/** A text-range anchor (a user selection): the common-ancestor element plus
 *  re-locatable start/end boundaries, and the trimmed selected text so the agent
 *  (and the relocator) can confirm the range. Modeled on open-design. */
export interface TextRangeAnchor {
  kind: 'text-range';
  /** Selector of the common-ancestor element of the selection. */
  commonAncestorSelector: string;
  start: TextBoundary;
  end: TextBoundary;
  /** The selected text, whitespace-collapsed. */
  text: string;
}

/** An element anchor (a click): a CSS selector path (≤5 levels, prefers `id`,
 *  else `:nth-of-type`) plus a trimmed text snapshot used to confirm/relocate. */
export interface ElementAnchor {
  kind: 'element';
  /** CSS selector path (≤5 levels) to the element. */
  selector: string;
  /** Lower-case tag name. */
  tag: string;
  /** Trimmed innerText snapshot (≤240 chars) — the "current text" the agent
   *  matches and the relocator falls back to when the selector drifts. */
  text: string;
}

/** Either kind of anchor a captured Annotation carries. */
export type Anchor = ElementAnchor | TextRangeAnchor;

/** Which reviewable artifact an Annotation was pinned on (plan §10, §M8). The
 *  wireframe is revised in place (edit the file → live reload); the Deck is
 *  **regenerated** — the agent rewrites the affected slides (issue #15). */
export type AnnotationSurface = 'wireframe' | 'deck';

/** One queued Annotation: the user's comment + its anchor + which slide it lives
 *  on + an optional screenshot ref of the targeted region (plan §10). */
export interface Annotation {
  id: string;
  /** The user's words — what to change about the anchored target. */
  comment: string;
  /** Zero-based slide index the annotation was pinned on. */
  slideIndex: number;
  /** The element / text-range anchor, or null for a whole-slide note. */
  anchor: Anchor | null;
  /** Project-relative screenshot path of the targeted region, when captured. */
  screenshot?: string;
  /** Which artifact it was pinned on (Slice 12 / issue #15). Defaults to
   *  'wireframe' — the original Slice-4 surface — when unset. */
  surface?: AnnotationSurface;
}

// --- Selector + path helpers (pure; DOM-library-agnostic) ------------------

/**
 * CSS.escape fallback. jsdom does not expose `CSS.escape`, and the SDK must run
 * in the iframe too — so we ship our own minimal escaper (covers the ident chars
 * an `id`/class realistically contains). Prefers the platform `CSS.escape` when
 * present (the real browser), falls back otherwise.
 */
export function cssEscape(value: string, win?: { CSS?: { escape?: (v: string) => string } }): string {
  const platform = win?.CSS?.escape ?? (globalThis as { CSS?: { escape?: (v: string) => string } }).CSS?.escape;
  if (typeof platform === 'function') return platform(value);
  // Minimal, spec-flavored fallback: escape anything that isn't a safe ident char.
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

/**
 * Build a CSS selector path to `el` (≤5 levels), preferring an `id` (which short-
 * circuits) and otherwise disambiguating siblings with `:nth-of-type`. Lifted
 * from lavish's `selector()` so the host-side relocator and the in-iframe SDK
 * produce identical selectors. Returns '' for a non-element node.
 */
export function selectorFor(el: Element | null): string {
  if (!el || !el.tagName) return '';
  const win = (el.ownerDocument?.defaultView ?? undefined) as { CSS?: { escape?: (v: string) => string } } | undefined;
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && parts.length < 5) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      part += `#${cssEscape(node.id, win)}`;
      parts.unshift(part);
      break;
    }
    const parent: Element | null = node.parentElement;
    if (parent) {
      const tag = node.tagName;
      const same = Array.from(parent.children).filter((x) => x.tagName === tag);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(' > ');
}

/** The closest *element* for a node (itself if it's an element, else its parent). */
export function closestElement(node: Node | null, doc: Document): Element {
  if (!node) return doc.body;
  if (node.nodeType === 1) return node as Element;
  return (node as Node).parentElement ?? doc.body;
}

/** Trimmed, whitespace-collapsed innerText snapshot of an element (≤max chars). */
export function elementText(el: Element, max = 240): string {
  const raw = (el as HTMLElement).textContent ?? '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, max);
}

/** Child-index path from `root` down to `node` (lavish `nodePath`). Walks
 *  `childNodes` so it addresses text nodes, not just elements. */
export function nodePath(node: Node, root: Node): number[] {
  const path: number[] = [];
  let current: Node | null = node;
  while (current && current !== root) {
    const parent: Node | null = current.parentNode;
    if (!parent) break;
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
    current = parent;
  }
  return path;
}

/** Resolve a child-index path back to its node, relative to `root`. null if the
 *  path no longer addresses a node (the DOM changed structurally). */
export function nodeFromPath(root: Node | null, path: number[]): Node | null {
  let current: Node | null = root;
  for (const idx of path) {
    if (!current) return null;
    const kids = current.childNodes;
    if (idx < 0 || idx >= kids.length) return null;
    current = kids[idx] ?? null;
  }
  return current;
}

// --- Capture (element + text-range anchors) --------------------------------

/** Capture an **element anchor** from a clicked element (lavish `context`). */
export function captureElementAnchor(el: Element): ElementAnchor {
  return {
    kind: 'element',
    selector: selectorFor(el),
    tag: (el.tagName || '').toLowerCase(),
    text: elementText(el),
  };
}

/** A boundary node + offset (a DOM Range's start/end), the raw input to anchoring. */
export interface BoundaryInput {
  node: Node;
  offset: number;
}

/** Build a re-locatable {@link TextBoundary} from a boundary node + offset. */
export function captureBoundary(node: Node, offset: number, doc: Document): TextBoundary {
  const el = closestElement(node, doc);
  return { selector: selectorFor(el), path: nodePath(node, el), offset: Number(offset) || 0 };
}

/**
 * Capture a **text-range anchor** from a selection's start/end boundaries and the
 * selected string. The common ancestor is the closest shared element of the two
 * boundaries; each boundary is re-located relative to *its own* closest element
 * (lavish `rangeBoundary`), which survives edits elsewhere in the slide. Returns
 * null for an empty / collapsed selection.
 */
export function captureTextRange(
  start: BoundaryInput,
  end: BoundaryInput,
  rawText: string,
  doc: Document,
): TextRangeAnchor | null {
  const text = (rawText ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return null;
  const ancestor = commonAncestorElement(start.node, end.node, doc);
  return {
    kind: 'text-range',
    commonAncestorSelector: selectorFor(ancestor),
    start: captureBoundary(start.node, start.offset, doc),
    end: captureBoundary(end.node, end.offset, doc),
    text,
  };
}

/** The closest element that contains both nodes (the selection's common ancestor). */
export function commonAncestorElement(a: Node, b: Node, doc: Document): Element {
  const ancestors = new Set<Node>();
  for (let n: Node | null = a; n; n = n.parentNode) ancestors.add(n);
  for (let n: Node | null = b; n; n = n.parentNode) {
    if (ancestors.has(n)) return closestElement(n, doc);
  }
  return doc.body;
}

// --- Relocate (the survival guarantee) -------------------------------------

/**
 * Relocate an **element anchor** in a (possibly mutated) document. First tries the
 * captured selector; if the DOM moved and the selector no longer resolves — or
 * resolves to an element whose text changed — falls back to a text-content match
 * so a small edit elsewhere doesn't orphan the anchor. Returns the element, or
 * null when it truly cannot be found.
 */
export function relocateElement(anchor: ElementAnchor, doc: Document): Element | null {
  // 1. Direct selector hit (the happy path; survives unrelated edits). When the
  //    anchor captured text, accept the hit ONLY if its text still matches — so a
  //    `:nth-of-type` that drifted onto a different element (a sibling was
  //    inserted/removed above the target) falls through to the text search rather
  //    than silently anchoring to the wrong element.
  if (anchor.selector) {
    let hit: Element | null = null;
    try {
      hit = doc.querySelector(anchor.selector);
    } catch {
      hit = null;
    }
    if (hit && (!anchor.text || elementText(hit) === anchor.text)) return hit;
  }
  // 2. Selector drifted (an element was inserted/removed above the target, so the
  //    `:nth-of-type` shifted). Fall back to a tag + text match.
  if (anchor.text) {
    const candidates = anchor.tag ? doc.getElementsByTagName(anchor.tag) : doc.getElementsByTagName('*');
    for (const cand of Array.from(candidates)) {
      if (elementText(cand) === anchor.text) return cand;
    }
    // Looser: any element whose normalized text matches (tag changed).
    for (const cand of Array.from(doc.getElementsByTagName('*'))) {
      if (elementText(cand) === anchor.text) return cand;
    }
  }
  return null;
}

/** A relocated text range: the resolved boundary nodes + offsets, ready to build
 *  a DOM Range in the browser (the host) or assert against in tests. */
export interface RelocatedRange {
  startNode: Node;
  startOffset: number;
  endNode: Node;
  endOffset: number;
}

/**
 * Relocate a **text-range anchor** in a (possibly mutated) document. Resolves the
 * common ancestor by selector, then walks each boundary's child-index path from
 * that ancestor. Clamps offsets to the resolved node's length so a small text
 * edit (the agent rewrote the sentence) yields a valid — if shifted — range
 * instead of throwing. Returns null when the ancestor or a boundary node is gone.
 */
export function relocateTextRange(anchor: TextRangeAnchor, doc: Document): RelocatedRange | null {
  let ancestor: Element | null = null;
  try {
    ancestor = anchor.commonAncestorSelector ? doc.querySelector(anchor.commonAncestorSelector) : doc.body;
  } catch {
    ancestor = null;
  }
  if (!ancestor) return null;

  const resolve = (b: TextBoundary): { node: Node; offset: number } | null => {
    // The boundary's selector is relative to its OWN closest element; resolve it
    // within the ancestor's subtree first, then fall back to the whole document.
    let base: Element | null = null;
    try {
      base = b.selector ? (ancestor!.querySelector(b.selector) ?? doc.querySelector(b.selector)) : ancestor;
    } catch {
      base = ancestor;
    }
    if (!base) base = ancestor;
    const node = nodeFromPath(base, b.path) ?? base;
    const len = node.nodeType === 3 ? (node.textContent ?? '').length : node.childNodes.length;
    return { node, offset: Math.max(0, Math.min(b.offset, len)) };
  };

  const start = resolve(anchor.start);
  const end = resolve(anchor.end);
  if (!start || !end) return null;
  return { startNode: start.node, startOffset: start.offset, endNode: end.node, endOffset: end.offset };
}

// --- Serializer (the `<attached-preview-comments>` block) ------------------

/** A short human label for an anchor, used in the serialized block. */
function anchorLabel(anchor: Anchor | null): string {
  if (!anchor) return 'the whole slide';
  if (anchor.kind === 'text-range') return `text "${anchor.text}"`;
  const where = anchor.selector ? `element \`${anchor.selector}\`` : `<${anchor.tag}>`;
  return where;
}

/** The scoped header instruction for a block, by surface (plan §10, §M8). The
 *  wireframe is edited in place (live reload); the Deck is **regenerated** — the
 *  agent rewrites only the affected slides, keeping the theme + every other slide
 *  untouched (issue #15). */
function headerFor(surface: AnnotationSurface): string[] {
  if (surface === 'deck') {
    return [
      'The user pinned these annotations on the generated Deck. Regenerate ONLY the',
      'slides named below — change exactly the elements called out and leave every',
      'other slide, the chosen theme, and the overall structure exactly as-is. Rewrite',
      'the same Deck file so the preview reloads; the app then re-runs the html-slides',
      'verify gate and returns any fixes for you to apply.',
    ];
  }
  return [
    'The user pinned these annotations on the wireframe. Change ONLY the elements',
    'named below — leave every other element, slide, and the overall structure',
    'exactly as-is. After editing, save the same wireframe file so the preview',
    'reloads.',
  ];
}

/**
 * Serialize queued Annotations into the structured `<attached-preview-comments>`
 * block the agent reads (plan §10), appended to the user turn. Each line carries
 * the anchor (selector / text-range), the current text, the slide, and the
 * screenshot ref; the block header is the **scoped instruction** — "change ONLY
 * these elements" — that keeps the revise surgical. The header adapts to the
 * surface: a Wireframe is edited in place; a **Deck** is regenerated (issue #15).
 * Pure (no I/O), so the Annotation-Serializer suite can assert the exact block
 * structure. Returns '' for an empty queue.
 */
export function serializeAnnotations(annotations: Annotation[]): string {
  if (!annotations.length) return '';
  // The queue is homogeneous in practice (one active surface at a time); if any
  // annotation targets the Deck, use the regenerate-scoped header.
  const surface: AnnotationSurface = annotations.some((a) => a.surface === 'deck') ? 'deck' : 'wireframe';
  const lines: string[] = [];
  annotations.forEach((a, i) => {
    const n = i + 1;
    const where = anchorLabel(a.anchor);
    lines.push(`${n}. On slide ${a.slideIndex + 1}, ${where}: ${a.comment.trim()}`);
    if (a.anchor?.kind === 'element' && a.anchor.text) {
      lines.push(`   - selector: \`${a.anchor.selector}\``);
      lines.push(`   - current text: "${a.anchor.text}"`);
    } else if (a.anchor?.kind === 'text-range') {
      lines.push(`   - within: \`${a.anchor.commonAncestorSelector}\``);
      lines.push(`   - selected text: "${a.anchor.text}"`);
    }
    if (a.screenshot) lines.push(`   - screenshot: ${a.screenshot}`);
  });
  return [
    '<attached-preview-comments>',
    ...headerFor(surface),
    '',
    ...lines,
    '</attached-preview-comments>',
  ].join('\n');
}

/** Convert a captured Annotation into the durable {@link Annotation} the queue
 *  stores. Mints nothing — the caller supplies the id. Kept here so the capture
 *  shape and the serialize shape live in one module. */
export function toAnnotation(
  id: string,
  input: {
    comment: string;
    slideIndex: number;
    anchor: Anchor | null;
    screenshot?: string;
    surface?: AnnotationSurface;
  },
): Annotation {
  return {
    id,
    comment: input.comment,
    slideIndex: Number(input.slideIndex) || 0,
    anchor: input.anchor ?? null,
    ...(input.screenshot ? { screenshot: input.screenshot } : {}),
    ...(input.surface ? { surface: input.surface } : {}),
  };
}
