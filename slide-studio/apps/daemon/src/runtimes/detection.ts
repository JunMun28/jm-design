/**
 * Runtime detection (plan §8.5). Resolves the agent binary, probes `--version`,
 * and infers auth state. The OS-level probe is INJECTED so the whole flow is
 * deterministically unit-testable (installed / missing / auth) without a real
 * CLI on the box — this is the third required test suite.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { AGENT_DEFS } from './registry.ts';
import { DEFAULT_MODEL_OPTION } from './defs/shared.ts';
import { setAgentCapabilities, type RuntimeCapabilityMap } from './capabilities.ts';
import type { AuthStatus, DetectedAgent, RuntimeAgentDef } from './types.ts';

/** Result of running one CLI probe command. */
export type ProbeResult = {
  /** Set when the OS refused to spawn at all (ENOENT/EACCES/126/127). */
  spawnError?: { code: string | number };
  exitCode?: number;
  stdout?: string;
  stderr?: string;
};

/** A function that runs `<bin> <args>` and resolves a ProbeResult. Injected so
 *  tests can supply a fake without touching the OS. */
export type ProbeFn = (
  bin: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
) => Promise<ProbeResult>;

/** A function that resolves the absolute path to a bin, or null if not on PATH.
 *  Injected for the same testability reason. */
export type ResolveBinFn = (bin: string, env: NodeJS.ProcessEnv) => string | null;

const NOT_INVOCABLE_STRING_CODES = new Set(['ENOENT', 'EACCES', 'ENOTDIR']);

function isNotInvocable(spawnError: { code: string | number }): boolean {
  const { code } = spawnError;
  if (typeof code === 'string') return NOT_INVOCABLE_STRING_CODES.has(code);
  return code === 126 || code === 127;
}

/** Classify combined stdout+stderr into an auth status (plan §8.6). */
export function classifyAuth(text: string, exitCode: number | undefined): AuthStatus {
  const lower = (text || '').toLowerCase();
  if (/401|unauthorized|not (signed|logged) in|please (sign|log) in|authentication/.test(lower)) {
    return 'missing';
  }
  if (exitCode === 0) return 'ok';
  return 'unknown';
}

function unavailable(def: RuntimeAgentDef): DetectedAgent {
  return {
    id: def.id,
    name: def.name,
    bin: def.bin,
    streamFormat: def.streamFormat,
    eventParser: def.eventParser,
    inactivityTimeoutMs: def.inactivityTimeoutMs,
    models: def.fallbackModels ?? [DEFAULT_MODEL_OPTION],
    modelsSource: 'fallback',
    available: false,
  };
}

/**
 * Probe one agent def. Pure given the injected `probe` + `resolveBin`.
 */
export async function detectAgent(
  def: RuntimeAgentDef,
  probe: ProbeFn,
  resolveBin: ResolveBinFn,
  env: NodeJS.ProcessEnv = process.env,
): Promise<DetectedAgent> {
  const resolved = resolveBin(def.bin, env) ?? def.fallbackBins?.map((b) => resolveBin(b, env)).find(Boolean) ?? null;
  if (!resolved) return unavailable(def);

  // The spawn env detection probes with must match what runs will use, so
  // resolveEnv (e.g. the injected GitHub token) is applied here too — otherwise
  // a token-gated auth probe sees different creds than the real run (§8.6).
  const spawnEnv = { ...env, ...(def.env ?? {}), ...(def.resolveEnv?.(env) ?? {}) };

  // 1) version probe gates availability.
  const versionTimeout = 3000;
  const v = await probe(resolved, def.versionArgs, spawnEnv, versionTimeout);
  if (v.spawnError && isNotInvocable(v.spawnError)) return unavailable(def);

  const version = (v.stdout ?? '').trim().split('\n')[0] || null;

  // 2) version gates availability; the capability probe + auth probe are
  // independent reads, so run them concurrently (max, not sum).
  const [caps, auth] = await Promise.all([
    probeCapabilities(def, resolved, spawnEnv, probe),
    probeAuth(def, resolved, spawnEnv, env, probe),
  ]);
  if (caps) setAgentCapabilities(def.id, caps);
  const { authStatus, authMessage } = auth;

  return {
    id: def.id,
    name: def.name,
    bin: def.bin,
    streamFormat: def.streamFormat,
    eventParser: def.eventParser,
    inactivityTimeoutMs: def.inactivityTimeoutMs,
    models: def.fallbackModels ?? [DEFAULT_MODEL_OPTION],
    modelsSource: 'fallback',
    available: true,
    path: resolved,
    version,
    ...(authStatus ? { authStatus } : {}),
    ...(authMessage ? { authMessage } : {}),
  };
}

/**
 * Probe the agent's `--help` once and record, per capability key, which
 * candidate flag spelling the installed CLI actually advertises (the first
 * match in the def's preference order), or `false` when none match. Returns null
 * when the agent declares no capability metadata. On a failed `--help` probe,
 * returns an empty map so buildArgs falls back to its legacy spellings (§8.3).
 */
export async function probeCapabilities(
  def: RuntimeAgentDef,
  resolved: string,
  spawnEnv: NodeJS.ProcessEnv,
  probe: ProbeFn,
): Promise<RuntimeCapabilityMap | null> {
  if (!def.capabilityFlags || !def.helpArgs || !def.capabilityMap) return null;
  const r = await probe(resolved, def.helpArgs, spawnEnv, 5000);
  if (r.spawnError) return {};
  const help = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  const caps: RuntimeCapabilityMap = {};
  for (const [key, candidates] of Object.entries(def.capabilityMap)) {
    const supported = candidates.find((flag) => help.includes(flag));
    caps[key] = supported ?? false;
  }
  return caps;
}

/** Resolve auth state: run the declarative auth probe if any, else infer from
 *  token-env presence. Extracted so it runs concurrently with the capability
 *  probe. */
async function probeAuth(
  def: RuntimeAgentDef,
  resolved: string,
  spawnEnv: NodeJS.ProcessEnv,
  env: NodeJS.ProcessEnv,
  probe: ProbeFn,
): Promise<{ authStatus?: AuthStatus; authMessage?: string }> {
  if (def.authProbe) {
    const a = await probe(resolved, def.authProbe.args, spawnEnv, def.authProbe.timeoutMs ?? 5000);
    if (a.spawnError) return { authStatus: 'unknown' };
    const combined = `${a.stdout ?? ''}\n${a.stderr ?? ''}`;
    const authStatus = classifyAuth(combined, a.exitCode);
    return authStatus === 'ok'
      ? { authStatus }
      : { authStatus, authMessage: `Sign in to ${def.name}` };
  }
  const authStatus = inferAuthFromTokenEnv(def, env);
  return authStatus === 'missing'
    ? { authStatus, authMessage: `Sign in to ${def.name}` }
    : { authStatus };
}

/** Token-env inference for adapters with no active auth probe (e.g. Copilot). */
function inferAuthFromTokenEnv(def: RuntimeAgentDef, env: NodeJS.ProcessEnv): AuthStatus {
  if (def.id === 'copilot') {
    return env.COPILOT_GITHUB_TOKEN || env.GH_TOKEN || env.GITHUB_TOKEN ? 'ok' : 'missing';
  }
  if (def.id === 'codex') {
    return env.OPENAI_API_KEY ? 'ok' : 'unknown';
  }
  return 'unknown';
}

/** Detect every registered agent, in parallel. */
export async function detectAgents(
  probe: ProbeFn = defaultProbe,
  resolveBin: ResolveBinFn = defaultResolveBin,
  env: NodeJS.ProcessEnv = process.env,
): Promise<DetectedAgent[]> {
  return Promise.all(
    AGENT_DEFS.map((def) =>
      detectAgent(def, probe, resolveBin, env).catch(() => unavailable(def)),
    ),
  );
}

/** Extra toolchain dirs to append because GUI-launched apps get a stripped PATH
 *  (plan §8.5). */
function toolchainDirs(env: NodeJS.ProcessEnv): string[] {
  const home = env.HOME || env.USERPROFILE || '';
  const dirs = ['/usr/local/bin', '/opt/homebrew/bin'];
  if (home) {
    dirs.push(join(home, '.local', 'bin'), join(home, '.nvm', 'current', 'bin'), join(home, '.deno', 'bin'));
  }
  return dirs;
}

/** Default PATH-walking bin resolver (honors Windows PATHEXT). */
export function defaultResolveBin(bin: string, env: NodeJS.ProcessEnv = process.env): string | null {
  // Allow an explicit override: CODEX_BIN / COPILOT_BIN.
  const overrideKey = `${bin.toUpperCase()}_BIN`;
  const override = env[overrideKey];
  if (override && existsSyncSafe(override)) return override;

  const pathParts = (env.PATH ?? '').split(delimiter).filter(Boolean);
  const searchDirs = [...pathParts, ...toolchainDirs(env)];
  const exts =
    process.platform === 'win32'
      ? (env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';').map((e) => e.trim())
      : [''];
  for (const dir of searchDirs) {
    for (const ext of exts) {
      const candidate = join(dir, `${bin}${ext}`);
      if (existsSyncSafe(candidate)) return candidate;
    }
  }
  return null;
}

function existsSyncSafe(p: string): boolean {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

/** Default OS probe via execFile. */
export const defaultProbe: ProbeFn = (bin, args, env, timeoutMs) =>
  new Promise<ProbeResult>((resolve) => {
    execFile(bin, args, { env, timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && (err as NodeJS.ErrnoException).code && (err as { killed?: boolean }).killed !== true) {
        const code = (err as NodeJS.ErrnoException).code as string | undefined;
        if (code && NOT_INVOCABLE_STRING_CODES.has(code)) {
          resolve({ spawnError: { code }, stdout: String(stdout), stderr: String(stderr) });
          return;
        }
      }
      const exitCode = err && typeof (err as { code?: number }).code === 'number' ? (err as { code: number }).code : 0;
      resolve({ exitCode, stdout: String(stdout), stderr: String(stderr) });
    });
  });
