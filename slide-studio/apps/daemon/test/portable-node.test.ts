/**
 * Portable-Node suite (Slice 10 / issue #10, AC2: the app runs on bundled
 * portable Node — no system Node install or admin rights). The resolver is PURE
 * given an injected platform + existence probe, so the bundle-vs-fallback choice
 * and the per-OS path layout are tested here without a real bundle on the box.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { bundledNodePath, resolvePortableNode } from '../src/portable-node.ts';

const APP = '/opt/slide-studio';

test('bundled path layout matches the Node distro archives, per OS', () => {
  assert.equal(bundledNodePath(APP, 'win32'), join(APP, 'runtime', 'node', 'win32', 'node.exe'));
  assert.equal(bundledNodePath(APP, 'darwin'), join(APP, 'runtime', 'node', 'darwin', 'bin', 'node'));
  assert.equal(bundledNodePath(APP, 'linux'), join(APP, 'runtime', 'node', 'linux', 'bin', 'node'));
});

test('prefers the bundled runtime when it is present (no system Node needed)', () => {
  const bundled = bundledNodePath(APP, 'linux');
  const res = resolvePortableNode({
    appRoot: APP,
    platform: 'linux',
    exists: (p) => p === bundled,
    fallbackExecPath: '/usr/bin/node',
  });
  assert.equal(res.bundled, true);
  assert.equal(res.execPath, bundled);
});

test('falls back to the current interpreter when no bundle exists (dev case)', () => {
  const res = resolvePortableNode({
    appRoot: APP,
    platform: 'darwin',
    exists: () => false,
    fallbackExecPath: '/usr/local/bin/node',
  });
  assert.equal(res.bundled, false);
  assert.equal(res.execPath, '/usr/local/bin/node');
});

test('Windows bundle resolves to node.exe', () => {
  const winNode = bundledNodePath(APP, 'win32');
  const res = resolvePortableNode({
    appRoot: APP,
    platform: 'win32',
    exists: (p) => p === winNode,
    fallbackExecPath: 'C\\\\node\\\\node.exe',
  });
  assert.equal(res.bundled, true);
  assert.ok(res.execPath.endsWith('node.exe'));
});
