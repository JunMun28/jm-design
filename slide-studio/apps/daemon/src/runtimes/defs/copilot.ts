import { DEFAULT_MODEL_OPTION } from './shared.ts';
import { getAgentCapabilities } from '../capabilities.ts';
import type { RuntimeAgentDef } from '../types.ts';

/**
 * Capability keys the Copilot adapter gates on, each with its candidate `--help`
 * flag spellings in preference order. Detection records the first spelling the
 * installed CLI advertises; `buildArgs` emits that one (or the legacy fallback
 * when the CLI was never probed). This is the FLAG DRIFT guard from plan §8.3:
 * newer Copilot CLIs rename `--allow-all-tools`→`--allow-all-paths` and
 * `--add-dir`→`--available-tools`, and the daemon follows without a code change.
 */
export const COPILOT_CAPABILITY_MAP: Record<string, string[]> = {
  allowAllTools: ['--allow-all-tools', '--allow-all-paths'],
  addDir: ['--add-dir', '--available-tools'],
};

/** The legacy spelling buildArgs falls back to when the CLI was never probed
 *  (capability unknown) — the flag Copilot has shipped longest. */
const COPILOT_FALLBACK_FLAG: Record<string, string> = {
  allowAllTools: '--allow-all-tools',
  addDir: '--add-dir',
};

/**
 * Resolve which flag spelling to emit for a capability key. Order of precedence:
 *   1. The probed spelling (detection found it in `--help`) → use it.
 *   2. Probed but absent (`false`) → the capability is unsupported → omit it.
 *   3. Never probed (key missing from the cache) → fall back to the legacy
 *      spelling so an un-probed run still works.
 */
function copilotFlag(key: string): string | null {
  const caps = getAgentCapabilities('copilot');
  if (key in caps) {
    const probed = caps[key];
    return probed === false ? null : probed;
  }
  return COPILOT_FALLBACK_FLAG[key] ?? null;
}

/**
 * Inject the GitHub token Copilot authenticates with, by precedence
 * `COPILOT_GITHUB_TOKEN > GH_TOKEN > GITHUB_TOKEN`, normalized to the canonical
 * `COPILOT_GITHUB_TOKEN` the CLI reads. Returned as a fresh object the daemon
 * merges into the spawn `env` (never logged, plan §15). Pure for testability.
 */
export function resolveCopilotEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const token = env.COPILOT_GITHUB_TOKEN || env.GH_TOKEN || env.GITHUB_TOKEN;
  return token ? { COPILOT_GITHUB_TOKEN: token } : {};
}

/**
 * GitHub Copilot CLI adapter (plan §8.3). Production runtime at Micron; the app
 * defaults to it when present (§1 N3).
 *
 * - Prompt via stdin (omit `-p`): `copilot -p <body>` blows the Windows ~32KB /
 *   ~8KB-via-`.cmd` command-line cap once skills are composed in.
 * - Tool auto-approve + dir-widening flags are gated by a `--help` capability
 *   probe (FLAG DRIFT, see COPILOT_CAPABILITY_MAP) so a renamed flag is followed
 *   automatically; a legacy fallback keeps un-probed runs working.
 * - GitHub-token auth is injected into the spawn env (see resolveCopilotEnv).
 * - >=30-min inactivity watchdog: Copilot goes silent on long deck turns.
 */
export const copilotAgentDef: RuntimeAgentDef = {
  id: 'copilot',
  name: 'GitHub Copilot CLI',
  bin: 'copilot',
  versionArgs: ['--version'],
  fallbackModels: [
    DEFAULT_MODEL_OPTION,
    { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
    { id: 'gpt-5.2', label: 'GPT-5.2' },
  ],
  capabilityFlags: true,
  helpArgs: ['--help'],
  capabilityMap: COPILOT_CAPABILITY_MAP,
  buildArgs: (_prompt, _imagePaths, extraAllowedDirs = [], options = {}) => {
    const args: string[] = [];

    // Auto-approve tools, or Copilot blocks on per-tool approval in a
    // non-interactive run. Gated on the probed spelling.
    const allowFlag = copilotFlag('allowAllTools');
    if (allowFlag) args.push(allowFlag);

    args.push('--output-format', 'json');

    if (options.model && options.model !== 'default') args.push('--model', options.model);

    // Widen Copilot's path sandbox to the staged skills + theme dirs. Gated too
    // — old/new builds spell this flag differently.
    const dirFlag = copilotFlag('addDir');
    if (dirFlag) {
      for (const d of extraAllowedDirs.filter((x) => typeof x === 'string' && x.length > 0)) {
        args.push(dirFlag, d);
      }
    }
    return args;
  },
  promptViaStdin: true,
  streamFormat: 'copilot-stream-json',
  eventParser: 'copilot',
  inactivityTimeoutMs: 30 * 60 * 1000,
  // GitHub token presence (COPILOT_GITHUB_TOKEN > GH_TOKEN > GITHUB_TOKEN) plus
  // a Copilot subscription. No clean whoami; rely on token-env inference + the
  // injected env, classifying auth-failure text from real runs (§8.6).
  resolveEnv: resolveCopilotEnv,
  installUrl: 'https://github.com/github/copilot-cli',
  docsUrl: 'https://docs.github.com/copilot/concepts/agents/about-copilot-cli',
  // In-app onboarding execution (AC1): install via npm; sign in launches the
  // Copilot CLI's own GitHub org-SSO device flow — argv arrays, no terminal.
  // (In the Micron enterprise rollout IT usually pre-installs Copilot; the
  // in-app install is the fallback when it is missing.)
  installCommand: { bin: 'npm', args: ['install', '-g', '@github/copilot'] },
  signInCommand: { bin: 'copilot', args: ['/login'] },
};
