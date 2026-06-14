import { signal, type Signal, type WritableSignal } from '@angular/core';

/**
 * A signal-backed text-streaming buffer that decouples the agent's bursty
 * `text_delta` arrivals from the smooth, paced reveal in the UI.
 *
 * WHY: the agent emits text in irregular chunks (sometimes a whole sentence at
 * once, sometimes a token). Re-rendering per delta produces a jittery,
 * "typewriter" feel and churns Angular change detection on every token. Instead
 * we BUFFER every delta and DRAIN it on `requestAnimationFrame` at a steady
 * cadence, committing the drained slice into ONE signal the component renders.
 *
 * Cadence: a base of ~5ms per character, but the drain rate SPEEDS UP as the
 * backlog grows (so a big burst never leaves the reveal lagging seconds behind
 * the real stream) and we always commit on a whole-word boundary so the
 * per-word blur-in reveal animates clean words, never half a word.
 *
 * The buffer is framework-light: it owns a `committed` signal (the visible text)
 * and a rAF loop; the component subscribes to the signal and feeds deltas in. One
 * buffer instance per assistant turn. `flushAll()` commits everything instantly
 * (used on turn completion, and the reduced-motion path skips the buffer
 * entirely).
 */
export class StreamBuffer {
  /** The text revealed so far (drives the rendered bubble). */
  private readonly _committed: WritableSignal<string> = signal('');
  /** True while the rAF drain loop is scheduled. */
  private readonly _draining: WritableSignal<boolean> = signal(false);

  /** Text that has arrived but not yet been revealed. */
  private pending = '';
  private rafId: number | null = null;
  private lastTick = 0;
  /** Accumulated time-budget (ms) we can spend revealing characters this frame. */
  private budgetChars = 0;

  /** Base reveal rate: ms of wall-clock per character at an empty backlog. */
  private static readonly MS_PER_CHAR = 5;

  /** The visible, committed text (read-only). */
  get committed(): Signal<string> {
    return this._committed.asReadonly();
  }

  /** True while text is still draining into the bubble. */
  get draining(): Signal<boolean> {
    return this._draining.asReadonly();
  }

  /** Whether anything is still buffered or actively draining. */
  hasBacklog(): boolean {
    return this.pending.length > 0;
  }

  /** Feed one streamed delta. Schedules the rAF drain if not already running. */
  push(delta: string): void {
    if (!delta) return;
    this.pending += delta;
    this.schedule();
  }

  /**
   * Reveal everything immediately (no pacing). Used when a turn reaches its
   * terminal state, or on the reduced-motion path where pacing is undesirable.
   */
  flushAll(): void {
    this.cancel();
    if (this.pending) {
      this._committed.update((c) => c + this.pending);
      this.pending = '';
    }
    this._draining.set(false);
  }

  /** Seed already-known text (e.g. a resumed transcript) with no animation. */
  seed(text: string): void {
    this.cancel();
    this.pending = '';
    this._committed.set(text);
    this._draining.set(false);
  }

  /** Reset to empty for a fresh turn, keeping the SAME signal references so any
   *  template binding to {@link committed}/{@link draining} stays wired. */
  reset(): void {
    this.cancel();
    this.pending = '';
    this.budgetChars = 0;
    this.lastTick = 0;
    this._committed.set('');
    this._draining.set(false);
  }

  /** Stop the loop and drop any unrevealed buffer (turn destroyed/cancelled). */
  destroy(): void {
    this.cancel();
    this.pending = '';
    this._draining.set(false);
  }

  private schedule(): void {
    if (this.rafId !== null) return;
    // No rAF in a non-DOM context (defensive): reveal synchronously.
    if (typeof requestAnimationFrame !== 'function') {
      this.flushAll();
      return;
    }
    this._draining.set(true);
    this.lastTick = 0;
    this.budgetChars = 0;
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  private cancel(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }

  private tick(now: number): void {
    this.rafId = null;
    if (this.lastTick === 0) this.lastTick = now;
    const dt = Math.min(now - this.lastTick, 100); // clamp tab-switch gaps
    this.lastTick = now;

    // Backlog-aware speed-up: the larger the pending buffer, the more characters
    // we allow per millisecond, so a big burst catches up quickly instead of
    // dribbling out for seconds. effectiveRate scales from 1x up to ~8x.
    const backlog = this.pending.length;
    const speed = 1 + Math.min(backlog / 80, 7);
    this.budgetChars += (dt / StreamBuffer.MS_PER_CHAR) * speed;

    let take = Math.floor(this.budgetChars);
    if (take > 0 && this.pending.length > 0) {
      take = Math.min(take, this.pending.length);
      // Extend to the next whole-word boundary so the reveal commits whole words
      // (clean per-word blur-in), unless that boundary is the very end already.
      let cut = take;
      if (cut < this.pending.length) {
        const nextSpace = this.pending.indexOf(' ', cut);
        const nextNl = this.pending.indexOf('\n', cut);
        const boundary = [nextSpace, nextNl].filter((n) => n >= 0).sort((a, b) => a - b)[0];
        // Only round up to a near boundary; if the next word is far, take as-is.
        if (boundary !== undefined && boundary - cut <= 24) cut = boundary + 1;
      }
      cut = Math.min(cut, this.pending.length);
      const slice = this.pending.slice(0, cut);
      this.pending = this.pending.slice(cut);
      this.budgetChars -= slice.length;
      this._committed.update((c) => c + slice);
    }

    if (this.pending.length > 0) {
      this.rafId = requestAnimationFrame((t) => this.tick(t));
    } else {
      this.budgetChars = 0;
      this._draining.set(false);
    }
  }
}
