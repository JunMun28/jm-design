import { DEFAULT_MODEL_OPTION, clampCodexReasoning } from './shared.ts';
import type { RuntimeAgentDef, RuntimeModelOption } from '../types.ts';

/** Parse `codex debug models` JSON into a model list (live source). */
export function parseCodexDebugModels(stdout: string): RuntimeModelOption[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(stdout || ''));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const models = (parsed as { models?: unknown }).models;
  if (!Array.isArray(models)) return null;

  const out: RuntimeModelOption[] = [DEFAULT_MODEL_OPTION];
  const seen = new Set<string>([DEFAULT_MODEL_OPTION.id]);
  for (const raw of models) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as { slug?: unknown; id?: unknown; display_name?: unknown; visibility?: unknown };
    if (entry.visibility === 'hidden') continue;
    const id =
      typeof entry.slug === 'string'
        ? entry.slug.trim()
        : typeof entry.id === 'string'
          ? entry.id.trim()
          : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const label = typeof entry.display_name === 'string' && entry.display_name.trim() ? entry.display_name.trim() : id;
    out.push({ id, label });
  }
  return out.length > 1 ? out : null;
}

/**
 * codex has no working OS sandbox on Windows (and WSL hits the read-only path),
 * so switch to `danger-full-access` there; the tightly-scoped `cwd` is the
 * compensating control (plan §8.2, §15). An operator override is also honored.
 */
export function codexNeedsDangerFullAccessSandbox(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.SLIDE_STUDIO_CODEX_SANDBOX?.trim() === 'danger-full-access') return true;
  if (platform === 'win32') return true;
  return Boolean(env.WSL_DISTRO_NAME?.trim());
}

export const codexAgentDef: RuntimeAgentDef = {
  id: 'codex',
  name: 'Codex CLI',
  bin: 'codex',
  versionArgs: ['--version'],
  listModels: { args: ['debug', 'models'], parse: parseCodexDebugModels, timeoutMs: 5000 },
  fallbackModels: [
    DEFAULT_MODEL_OPTION,
    { id: 'gpt-5.5', label: 'gpt-5.5' },
    { id: 'gpt-5.4', label: 'gpt-5.4' },
    { id: 'gpt-5-codex', label: 'gpt-5-codex' },
    { id: 'gpt-5', label: 'gpt-5' },
  ],
  reasoningOptions: [
    { id: 'default', label: 'Default' },
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' },
  ],
  // Prompt is delivered via stdin (promptViaStdin) to dodge Windows
  // ENAMETOOLONG. Modern codex rejects a bare `-` argv sentinel (exit 2), so the
  // pipe alone is the transport — never add `-`.
  buildArgs: (_prompt, _imagePaths, extraAllowedDirs = [], options = {}, ctx = {}) => {
    const needsDanger = codexNeedsDangerFullAccessSandbox(ctx.platform, ctx.env);
    const args = needsDanger
      ? ['exec', '--json', '--skip-git-repo-check', '--sandbox', 'danger-full-access']
      : [
          'exec',
          '--json',
          '--skip-git-repo-check',
          '--sandbox',
          'workspace-write',
          '-c',
          'sandbox_workspace_write.network_access=true',
        ];
    args.push('-c', 'default_permissions=":workspace"');
    if (ctx.cwd) args.push('-C', ctx.cwd);
    for (const d of extraAllowedDirs.filter((x) => typeof x === 'string' && x.length > 0)) {
      args.push('--add-dir', d);
    }
    if (options.model && options.model !== 'default') args.push('--model', options.model);
    if (options.reasoning && options.reasoning !== 'default') {
      args.push('-c', `model_reasoning_effort="${clampCodexReasoning(options.reasoning)}"`);
    }
    return args;
  },
  promptViaStdin: true,
  streamFormat: 'json-event-stream',
  eventParser: 'codex',
  // codex/Copilot ship no clean whoami; infer auth from a cheap probe + the
  // OPENAI_API_KEY env presence. `debug models` is side-effect-free and fails
  // loudly when unauthenticated, so it doubles as the auth probe.
  authProbe: { args: ['debug', 'models'], timeoutMs: 5000 },
  installUrl: 'https://github.com/openai/codex',
  // In-app onboarding execution (AC1): install via npm, sign in via codex's own
  // browser/device auth — argv arrays, no terminal needed by the user.
  installCommand: { bin: 'npm', args: ['install', '-g', '@openai/codex'] },
  signInCommand: { bin: 'codex', args: ['login'] },
};
