/**
 * End-to-end in-app onboarding over the REAL daemon WebSocket (Slice 10 /
 * issue #10, AC1). Closes the previous attempt's gap that "no in-app install/auth
 * execution" existed: here a real `ws` client drives the daemon's `onboard` path
 * through `createDaemon`. The daemon actually SPAWNS the sign-in command, STREAMS
 * its progress over the socket (`onboard:progress`), then sends a friendly
 * terminal result with a refreshed plan (`onboard:result`) — exactly what the
 * wizard consumes.
 *
 * We repoint codex's sign-in command (via the SLIDE_STUDIO_*_CMD operator
 * override — the same hook the enterprise uses to swap in an IT-sanctioned
 * source) at a HARMLESS node stand-in that prints a device-code line and exits 0.
 * So this exercises the full real app round-trip — real daemon, real WS, a real
 * spawned process, real streamed output — WITHOUT launching codex's interactive
 * auth flow.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createDaemon } from '../src/server.ts';

test('WS onboard: a real client drives in-app sign-in end-to-end (stream + friendly result + refreshed plan)', async () => {
  // Stand-in for `codex login`: print the device-code line a user would follow,
  // then succeed — no interactive prompt, no real auth.
  const standIn = JSON.stringify([
    process.execPath,
    '-e',
    "process.stderr.write('To sign in, open https://chatgpt.com/device and enter CODE-7F3A\\n'); process.exit(0);",
  ]);
  process.env.SLIDE_STUDIO_CODEX_SIGNIN_CMD = standIn;

  const daemon = await createDaemon({ port: 0 });
  const ws = new WebSocket(`ws://${daemon.host}:${daemon.port}/ws`);
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });

  const progressLines: string[] = [];
  const result = await new Promise<Record<string, unknown>>((resolve) => {
    ws.on('message', (raw) => {
      const e = JSON.parse(String(raw)) as Record<string, unknown>;
      if (e.type === 'onboard:progress') progressLines.push(String(e.line));
      if (e.type === 'onboard:result') resolve(e);
    });
    ws.send(JSON.stringify({ type: 'onboard', runtimeId: 'codex', kind: 'signin' }));
  });

  // The device-code line the CLI printed streamed to the client (the user follows
  // it from the wizard — no terminal).
  assert.ok(
    progressLines.some((l) => l.includes('chatgpt.com/device') && l.includes('CODE-7F3A')),
    `expected the device-code line to stream; got: ${JSON.stringify(progressLines)}`,
  );

  // The terminal result is friendly and carries a refreshed plan the wizard
  // re-renders from. Never a raw spawn/CLI error.
  assert.equal(result.type, 'onboard:result');
  assert.equal(result.runtimeId, 'codex');
  assert.equal(result.kind, 'signin');
  assert.equal(typeof result.message, 'string');
  assert.doesNotMatch(String(result.message), /ENOENT|spawn|errno|EACCES/i);
  const plan = result.plan as { runtimes?: unknown };
  assert.ok(plan && Array.isArray(plan.runtimes), 'result must carry a refreshed onboarding plan');

  ws.close();
  await daemon.close();
  delete process.env.SLIDE_STUDIO_CODEX_SIGNIN_CMD;
});
