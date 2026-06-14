/**
 * Runtime Adapter decision contracts.
 *
 * Source of truth: docs/slide-app-implementation-plan-2026-06-14.md §8, modeled
 * on open-design `apps/daemon/src/runtimes/types.ts`. Each supported agent CLI
 * (codex, Copilot) is a DECLARATIVE data file (`defs/*.ts`) — the daemon never
 * branches on the agent id. This file pins the shapes that the rest of the
 * daemon, the unit tests, and (later) the UI all agree on.
 */

export type RuntimeModelOption = {
  id: string;
  label: string;
};

export type RuntimeModelSource = 'live' | 'fallback';

export type RuntimeBuildOptions = {
  model?: string | null;
  reasoning?: string | null;
};

/**
 * Per-run context the daemon threads into `buildArgs`. Mirrors the plan's
 * §8.1 `RuntimeContext`.
 */
export type RuntimeContext = {
  /** Project output dir — the tightly scoped cwd (the codex Windows sandbox
   *  compensating control, §15). */
  cwd?: string;
  /** Resume a prior CLI session when one exists for this Project. */
  resumeSessionId?: string | null;
  /** A freshly minted session id when starting a new CLI session. */
  newSessionId?: string;
  /** Daemon-owned temp file holding the composed prompt (promptViaFile path). */
  promptFilePath?: string;
  /** True when this turn is NOT the first user turn in the conversation. */
  hasPriorAssistantTurn?: boolean;
  /** Platform override — tests inject 'win32' to exercise the sandbox switch
   *  without running on Windows. Defaults to process.platform. */
  platform?: NodeJS.Platform;
  /** Env override for the sandbox decision (WSL_DISTRO_NAME etc.). Defaults to
   *  process.env. */
  env?: NodeJS.ProcessEnv;
};

export type RuntimeListModels = {
  args: string[];
  timeoutMs?: number;
  parse: (stdout: string) => RuntimeModelOption[] | null;
};

/**
 * The declarative definition of one Agent Runtime. The key fields the issue
 * calls out: `bin`, `versionArgs`, `buildArgs(...)→string[]`, `promptViaStdin`,
 * `streamFormat`, `eventParser`, `env`, `authProbe`, `inactivityTimeoutMs`,
 * `capabilityFlags`.
 */
export type RuntimeAgentDef = {
  id: string;
  name: string;
  /** Primary binary name resolved on PATH (e.g. 'codex' | 'copilot'). */
  bin: string;
  /** Alternative binary names to try if `bin` is not found. */
  fallbackBins?: string[];
  /** Detection probe — `<bin> --version`. */
  versionArgs: string[];
  /** Static model hints used when a live list is unavailable. */
  fallbackModels: RuntimeModelOption[];
  /** Optional live model listing (codex `debug models`). */
  listModels?: RuntimeListModels;
  reasoningOptions?: RuntimeModelOption[];
  /**
   * Build the spawn argv for one turn. Pure + deterministic so it is unit
   * testable in isolation: (prompt, imagePaths, extraAllowedDirs, options, ctx)
   * → argv. The prompt itself is delivered via stdin (see `promptViaStdin`),
   * NOT argv — so `prompt` is accepted for signature parity but adapters that
   * pipe via stdin do not place it in the returned array.
   */
  buildArgs: (
    prompt: string,
    imagePaths: string[],
    extraAllowedDirs?: string[],
    options?: RuntimeBuildOptions,
    ctx?: RuntimeContext,
  ) => string[];
  /** TRUE for both codex + copilot — the composed prompt is piped to stdin. */
  promptViaStdin?: boolean;
  promptInputFormat?: 'text' | 'stream-json';
  /** Selects the parser kind in events.ts. */
  streamFormat: string;
  /** Parser kind id ('codex' | 'copilot'). */
  eventParser?: string;
  /** Auth tokens / fixed env injected at spawn (never logged). */
  env?: Record<string, string>;
  /** Declarative, side-effect-free auth probe (e.g. `status`/`whoami`). */
  authProbe?: { args: string[]; timeoutMs?: number };
  /** Inactivity watchdog ceiling — Copilot needs >=30 min (§17.4). */
  inactivityTimeoutMs?: number;
  /** When true, `--help` is probed at detection and the resulting capability
   *  map (capability key → supported flag spelling) is cached for `buildArgs`
   *  to consult, so the adapter absorbs Copilot's flag drift (§8.3). */
  capabilityFlags?: boolean;
  /** Args used to fetch the help text probed for capability flags (`--help`). */
  helpArgs?: string[];
  /**
   * Capability key → the candidate flag spellings to look for in `--help`, in
   * preference order. Detection records the FIRST spelling the installed CLI
   * advertises (or `false` when none match). `buildArgs` reads the cache via
   * `getAgentCapabilities(id)`. Example: `{ allowAllTools: ['--allow-all-tools',
   * '--allow-all-paths'] }` — newer Copilot CLIs rename the flag, and the daemon
   * follows without a code change (§8.3 FLAG DRIFT).
   */
  capabilityMap?: Record<string, string[]>;
  /**
   * Resolve the spawn `env` for this runtime from the ambient env (e.g. inject
   * the GitHub token under the name the CLI reads, by precedence). Side-effect
   * free + pure so it is unit-testable. Merged over the base env at spawn AND at
   * detection so auth probing and runs see the same credentials (§8.6).
   */
  resolveEnv?: (env: NodeJS.ProcessEnv) => Record<string, string>;
  maxPromptArgBytes?: number;
  installUrl?: string;
  docsUrl?: string;
  /**
   * In-app INSTALL execution (Slice 10, issue #10, AC1). The command the
   * onboarding executor runs to install the CLI WITHOUT a terminal — argv as an
   * ARRAY (never a concatenated string; §13 Windows quoting). A non-technical
   * user clicks "Install" and the daemon runs this, streaming progress. Omitted
   * when there is no safe in-app install (then the wizard opens `installUrl`).
   */
  installCommand?: { bin: string; args: string[] };
  /**
   * In-app SIGN-IN execution (Slice 10, issue #10, AC1). The command that starts
   * the CLI's own login flow (codex: OpenAI/ChatGPT device/browser auth; Copilot:
   * GitHub org SSO) — argv as an ARRAY. The daemon runs it and streams the
   * device-code / "open this URL" line the CLI prints, so the user completes
   * sign-in from the wizard. The provider the user authenticates WITH (for the
   * UI button/icon), never a CLI verb.
   */
  signInCommand?: { bin: string; args: string[] };
};

export type AuthStatus = 'ok' | 'missing' | 'unknown';

/**
 * The detection result the daemon surfaces to the UI. Closures are stripped;
 * only declarative metadata + the live probe results remain.
 */
export type DetectedAgent = {
  id: string;
  name: string;
  bin: string;
  streamFormat: string;
  eventParser?: string;
  inactivityTimeoutMs?: number;
  models: RuntimeModelOption[];
  modelsSource: RuntimeModelSource;
  available: boolean;
  authStatus?: AuthStatus;
  authMessage?: string;
  path?: string;
  version?: string | null;
};
