import { Injectable, signal } from '@angular/core';
import type { NormalizedEvent } from './types';

/**
 * A synthetic lifecycle frame the socket pushes to its listeners (alongside the
 * agent's NormalizedEvents) so the chat can return to idle whenever the live
 * connection ends — on ANY close, intentional or dropped (Bug A: robust
 * `streaming` reset, never a single fragile path). It is NOT an agent event.
 */
export type SocketLifecycleFrame = { type: 'socket-close' };
export type SocketFrame = NormalizedEvent | SocketLifecycleFrame;

/**
 * WebSocket client for the streamed agent run (plan §5: RxJS webSocket ↔ ws).
 * The skeleton uses a plain WebSocket wrapped in signals. The app runs
 * zoneless (Angular 22 default), so the socket callbacks update signals
 * directly and that drives change detection — no NgZone re-entry needed.
 * One connection per workspace; one in-flight run at a time.
 *
 * Slice 13 (AC1): a dropped connection is no longer silent. An unexpected close
 * surfaces a friendly `error` event (`recovery: 'reconnect'`) to the chat, and
 * `reconnect()` re-opens the socket so the user can resume — never a raw socket
 * failure.
 */
@Injectable({ providedIn: 'root' })
export class AgentSocketService {
  readonly connected = signal(false);
  private socket: WebSocket | null = null;
  /** Multiple consumers share the one socket: the chat renders the turn, the
   *  workspace listens for `artifact` frames (Slice 3). Both get every event. */
  private readonly listeners = new Set<(e: SocketFrame) => void>();
  /** True after `cancel()` or a deliberate teardown, so we don't cry "dropped". */
  private closingIntentionally = false;
  /** True once we've opened at least once, so the first connect isn't a "drop". */
  private hasOpened = false;

  private emit(e: SocketFrame): void {
    // Fan out to a SNAPSHOT and isolate each listener: one consumer throwing
    // (e.g. the workspace handler) must never abort delivery to the others —
    // notably it must never swallow a run's terminal `status:done` before it
    // reaches the chat, which would leave the composer disabled forever (Bug A).
    for (const l of [...this.listeners]) {
      try {
        l(e);
      } catch {
        /* a faulty listener never blocks the rest of the fan-out */
      }
    }
  }

  /** Subscribe to socket events. Returns an unsubscribe fn. Opens lazily. */
  listen(onEvent: (e: SocketFrame) => void): () => void {
    this.listeners.add(onEvent);
    if (!this.socket || this.socket.readyState > WebSocket.OPEN) this.open();
    return () => this.listeners.delete(onEvent);
  }

  connect(onEvent: (e: SocketFrame) => void): void {
    this.listeners.add(onEvent);
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    this.open();
  }

  private open(): void {
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    const socket = new WebSocket(url);
    this.socket = socket;
    this.closingIntentionally = false;
    socket.addEventListener('open', () => {
      this.connected.set(true);
      this.hasOpened = true;
    });
    socket.addEventListener('close', () => {
      this.connected.set(false);
      // An UNEXPECTED close (we had opened, and didn't ask to close) is a dropped
      // connection — surface a friendly, recoverable error rather than failing
      // silently (the previous behavior just flipped `connected=false`).
      if (this.hasOpened && !this.closingIntentionally) {
        this.emit({
          type: 'error',
          message: 'Lost the live connection to Slide Studio. Your message and feedback are saved — reconnect to continue.',
          recovery: 'reconnect',
          raw: 'websocket closed',
        });
      }
      // ALWAYS announce the close (intentional or dropped) so any in-flight run
      // returns to idle and the composer never stays disabled (Bug A: robust
      // reset on socket close, independent of whether `status:done` arrived).
      this.emit({ type: 'socket-close' });
    });
    socket.addEventListener('error', () => {
      // Browsers fire `error` then `close`; the close handler emits the friendly
      // message. Nothing raw leaks here.
    });
    socket.addEventListener('message', (ev) => {
      try {
        this.emit(JSON.parse(ev.data) as NormalizedEvent);
      } catch {
        /* ignore non-JSON frames */
      }
    });
  }

  /**
   * Send a frame, queuing it until the socket is OPEN. Robust to the CONNECTING
   * state: it never sends on a still-connecting socket (that throws
   * InvalidStateError) and never spawns a duplicate socket — it just attaches a
   * one-shot `open` listener to the existing connecting socket. Re-opens only a
   * truly closed/absent socket.
   */
  private sendWhenOpen(payload: string): void {
    const s = this.socket;
    if (s?.readyState === WebSocket.OPEN) {
      s.send(payload);
      return;
    }
    if (s?.readyState === WebSocket.CONNECTING) {
      s.addEventListener('open', () => s.send(payload), { once: true });
      return;
    }
    // Closed or absent: open a fresh socket, then send on its open.
    this.open();
    this.socket?.addEventListener('open', () => this.socket?.send(payload), { once: true });
  }

  /** Slice 3: ask the daemon to watch a Project's artifacts and push the current
   *  one. Sent on workspace load so a resumed Project shows its Wireframe. */
  watch(projectId: string): void {
    this.sendWhenOpen(JSON.stringify({ type: 'watch', projectId }));
  }

  /** Re-open a dropped socket (the AC1 "reconnect" recovery path). */
  reconnect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    this.open();
  }

  /**
   * Slice 10 (issue #10, AC1): ask the daemon to run an in-app install / sign-in
   * for a runtime. Progress streams back as `onboard:progress` events and the
   * step finishes with `onboard:result` (carrying the refreshed plan) — so the
   * wizard advances the non-technical user from launch → installed → signed-in
   * without ever opening a terminal.
   */
  runOnboarding(runtimeId: string, kind: 'install' | 'signin'): void {
    this.sendWhenOpen(JSON.stringify({ type: 'onboard', runtimeId, kind }));
  }

  send(projectId: string, text: string, runtimeId: string | null): void {
    this.sendWhenOpen(JSON.stringify({ type: 'chat', projectId, text, runtimeId }));
  }

  /**
   * Slice 5 (issue #12, AC2): generate the themed Deck. The user has picked a
   * Theme (Gate 3); the daemon runs the staged `html-slides` skill to write the
   * Deck (which the watcher surfaces as a `kind: 'deck'` artifact), then runs the
   * html-slides verify gate and pushes a `verify` frame. Progress streams as the
   * usual run events; the Deck is presented as done only once verify passes.
   */
  generate(projectId: string, runtimeId: string | null): void {
    this.sendWhenOpen(JSON.stringify({ type: 'generate', projectId, runtimeId }));
  }

  cancel(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'cancel' }));
    }
  }
}
