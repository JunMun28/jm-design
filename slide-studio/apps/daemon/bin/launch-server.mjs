/**
 * Inner launcher: boots the daemon and opens the browser. Loaded by
 * slide-studio.mjs with --experimental-strip-types so it can import the .ts
 * server module directly.
 *
 * Slice 10 (issue #10, §13, AC3): wires the daemon's `close()` (kill the agent
 * child + shut the server) to the process exit signals, so closing the app — by
 * Ctrl-C or the launcher window forwarding SIGTERM — leaves no orphan process.
 */
import { createDaemon } from '../src/server.ts';
import { installShutdownHandlers } from '../src/process-registry.ts';

const port = Number(process.env.SLIDE_STUDIO_PORT || 4317);

const { port: boundPort, host, close } = await createDaemon({ port });
const url = `http://${host}:${boundPort}`;
console.log(`Slide Studio daemon listening on ${url}`);

// Orphan cleanup on exit (AC3): kill the agent child + the daemon however the app
// is closed (Ctrl-C, launcher window close → SIGTERM, SIGHUP). A second signal
// forces an immediate exit so a wedged shutdown can't hang the user.
installShutdownHandlers(async () => {
  console.log('Slide Studio shutting down — cleaning up the assistant and daemon…');
  await close();
});

// Open the browser unless suppressed (CI / headless).
if (process.env.SLIDE_STUDIO_NO_OPEN !== '1') {
  try {
    const { default: open } = await import('open');
    await open(url);
  } catch {
    console.log(`Open ${url} in your browser.`);
  }
}
