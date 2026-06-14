/**
 * First-run onboarding plan (plan §13, Slice 10 / issue #10, M7).
 *
 * Turns the raw runtime detection (§8.5/§8.6) into a plain-language, step-by-step
 * plan a NON-TECHNICAL user can follow: which runtime to use, whether it is
 * installed, whether it is signed in, and exactly what to do next — INSTALL (when
 * missing) then SIGN IN (codex: OpenAI/ChatGPT; Copilot: GitHub org SSO). The
 * copy NEVER exposes a raw CLI flag or terminal command in its headline; the only
 * commands appear inside an optional, secondary `commandHint` the UI may reveal
 * under a "for IT / advanced" disclosure — the primary flow is click-through.
 *
 * Production default is enterprise GitHub Copilot when detected (§13, §1 N3);
 * codex is the development/fallback runtime.
 *
 * This module is PURE: it takes the already-detected agents and returns the plan.
 * No spawning, no fs — so the whole wizard logic is deterministically unit
 * testable without a real CLI (mirrors the detection suite's injected-probe
 * approach).
 */
import type { AuthStatus, DetectedAgent } from './runtimes/types.ts';
import { RUNTIME_DEFAULT_ORDER, getAgentDef } from './runtimes/registry.ts';

/** What the user must do for one runtime before it can build a deck. */
export type OnboardingStepKind = 'install' | 'signin' | 'ready';

/** The provider the user signs in WITH, in plain language (no CLI verbs). */
export type SignInProvider = 'openai' | 'github-sso';

/** One runtime's onboarding card. Everything the wizard needs to render a single,
 *  human step — no agent-id branching in the UI. */
export type OnboardingRuntime = {
  id: string;
  name: string;
  /** True once this runtime is installed AND signed in — nothing left to do. */
  ready: boolean;
  installed: boolean;
  authStatus: AuthStatus;
  /** The single next action for this runtime. */
  step: OnboardingStepKind;
  /** Plain-language headline for the step (e.g. "Sign in with your GitHub
   *  account"). Never contains a CLI flag. */
  title: string;
  /** A short, friendly paragraph expanding the title. Never a CLI flag. */
  detail: string;
  /** For a sign-in step: which provider, so the UI shows the right button/icon. */
  signInProvider?: SignInProvider;
  /** A link the "Install" / "Learn more" button opens (install page or docs). */
  actionUrl?: string;
  /** Recommended runtime to start with (Copilot when present). Exactly one true. */
  recommended: boolean;
  /**
   * OPTIONAL secondary command, surfaced only behind an "advanced / IT" toggle —
   * NOT the primary instruction. Kept out of `title`/`detail` so a non-technical
   * user never has to read a flag. Omitted when there is no useful command.
   */
  commandHint?: string;
  /**
   * True when the wizard can run this step IN-APP (AC1) — the daemon will execute
   * the install/login command and stream progress, so the user clicks a button
   * instead of opening a terminal. When false, the wizard falls back to the
   * external `actionUrl`. Only meaningful for the current `step`.
   */
  canRunInApp: boolean;
};

/** The full first-run plan the wizard renders. */
export type OnboardingPlan = {
  /** True when at least one runtime is fully ready — the user can start now. */
  canStart: boolean;
  /** The runtime the app would use right now (Copilot-first), or null if none
   *  is ready yet. The Home screen defaults to this. */
  defaultRuntimeId: string | null;
  /** Per-runtime cards, recommended runtime first. */
  runtimes: OnboardingRuntime[];
  /** One plain-language line summarizing where the user stands. */
  summary: string;
};

/** Install pages per runtime (no terminal needed to read them). */
const INSTALL_URL: Record<string, string> = {
  copilot: 'https://github.com/github/copilot-cli',
  codex: 'https://github.com/openai/codex',
};

/** Docs / sign-in help per runtime. */
const DOCS_URL: Record<string, string> = {
  copilot: 'https://docs.github.com/copilot/concepts/agents/about-copilot-cli',
  codex: 'https://github.com/openai/codex',
};

/** The optional advanced install command (revealed only behind a disclosure). */
const INSTALL_COMMAND: Record<string, string> = {
  copilot: 'npm install -g @github/copilot',
  codex: 'npm install -g @openai/codex',
};

/** Plain-language install copy, by runtime. No flags, no terminal in the headline. */
function installStep(agent: DetectedAgent): Pick<OnboardingRuntime, 'title' | 'detail' | 'actionUrl' | 'commandHint'> {
  if (agent.id === 'copilot') {
    return {
      title: 'Install GitHub Copilot',
      detail:
        'GitHub Copilot is the recommended assistant for Micron. It is usually pushed to your computer by IT — if it is already installed, this step will clear on its own. If not, open the setup page and follow the steps; you will not need to use a terminal.',
      actionUrl: INSTALL_URL.copilot,
      commandHint: INSTALL_COMMAND.copilot,
    };
  }
  if (agent.id === 'codex') {
    return {
      title: 'Install Codex',
      detail:
        'Codex is the backup assistant, used on machines without GitHub Copilot. Open the setup page and follow the steps. This is for non-sensitive decks unless your team has approved it.',
      actionUrl: INSTALL_URL.codex,
      commandHint: INSTALL_COMMAND.codex,
    };
  }
  return {
    title: `Install ${agent.name}`,
    detail: `Set up ${agent.name} on this computer, then come back to this screen.`,
    actionUrl: INSTALL_URL[agent.id],
    commandHint: INSTALL_COMMAND[agent.id],
  };
}

/** Plain-language sign-in copy, by runtime (the provider the user authenticates
 *  WITH — never a CLI verb). */
function signInStep(
  agent: DetectedAgent,
): Pick<OnboardingRuntime, 'title' | 'detail' | 'actionUrl' | 'signInProvider'> {
  if (agent.id === 'copilot') {
    return {
      title: 'Sign in with your GitHub account',
      detail:
        'Use your Micron GitHub single sign-on (the same login you use for company tools). Once you are signed in, this step turns green and you can start building.',
      signInProvider: 'github-sso',
      actionUrl: DOCS_URL.copilot,
    };
  }
  if (agent.id === 'codex') {
    return {
      title: 'Sign in with your OpenAI (ChatGPT) account',
      detail:
        'Sign in with the OpenAI or ChatGPT account approved for your work. Once you are signed in, this step turns green.',
      signInProvider: 'openai',
      actionUrl: DOCS_URL.codex,
    };
  }
  return {
    title: `Sign in to ${agent.name}`,
    detail: `Sign in to ${agent.name} with your approved account, then return here.`,
    actionUrl: DOCS_URL[agent.id],
  };
}

/** The "all set" copy for a ready runtime. */
function readyStep(agent: DetectedAgent): Pick<OnboardingRuntime, 'title' | 'detail'> {
  return {
    title: `${agent.name} is ready`,
    detail: `${agent.name} is installed and signed in. You are good to go.`,
  };
}

/**
 * Build one runtime's onboarding card from its detection result. The single next
 * step is the FIRST unmet requirement: not installed → install; installed but not
 * signed in → sign in; otherwise ready. (`unknown` auth is treated as "try it" —
 * we don't block the user on a state we couldn't verify; a real sign-in failure
 * mid-run still routes them to the signin recovery via errors.ts.)
 */
function buildRuntimeCard(agent: DetectedAgent, recommended: boolean): OnboardingRuntime {
  const authStatus: AuthStatus = agent.authStatus ?? 'unknown';
  const installed = agent.available;

  let step: OnboardingStepKind;
  let copy: Partial<OnboardingRuntime>;
  if (!installed) {
    step = 'install';
    copy = installStep(agent);
  } else if (authStatus === 'missing') {
    step = 'signin';
    copy = signInStep(agent);
  } else {
    step = 'ready';
    copy = readyStep(agent);
  }

  const ready = installed && authStatus !== 'missing';

  // Can the wizard run THIS step in-app (AC1)? Only if the runtime def declares
  // the matching command (install → installCommand, signin → signInCommand).
  const def = getAgentDef(agent.id);
  const canRunInApp =
    step === 'install' ? Boolean(def?.installCommand) : step === 'signin' ? Boolean(def?.signInCommand) : false;

  return {
    id: agent.id,
    name: agent.name,
    ready,
    installed,
    authStatus,
    step,
    title: copy.title!,
    detail: copy.detail!,
    ...(copy.signInProvider ? { signInProvider: copy.signInProvider } : {}),
    ...(copy.actionUrl ? { actionUrl: copy.actionUrl } : {}),
    ...(copy.commandHint ? { commandHint: copy.commandHint } : {}),
    recommended,
    canRunInApp,
  };
}

/** Order detected agents Copilot-first (production runtime), then codex, then any
 *  others by their detected order — so the recommended card leads. */
function orderRuntimes(agents: DetectedAgent[]): DetectedAgent[] {
  const rank = (id: string) => {
    const i = RUNTIME_DEFAULT_ORDER.indexOf(id as (typeof RUNTIME_DEFAULT_ORDER)[number]);
    return i === -1 ? RUNTIME_DEFAULT_ORDER.length : i;
  };
  return [...agents].sort((a, b) => rank(a.id) - rank(b.id));
}

/**
 * Choose which runtime to recommend. Prefer the production default order
 * (Copilot first) AMONG ready runtimes; if none is ready yet, recommend the
 * highest-preference runtime overall so the user is steered toward Copilot from
 * the start (§13: "default to enterprise Copilot when detected").
 */
function pickRecommendedId(ordered: DetectedAgent[]): string | null {
  const ready = ordered.find((a) => a.available && a.authStatus !== 'missing');
  if (ready) return ready.id;
  return ordered[0]?.id ?? null;
}

/** Compose the one-line summary that tells the user where they stand. */
function summarize(runtimes: OnboardingRuntime[]): string {
  if (runtimes.length === 0) {
    return 'No assistant is set up on this computer yet. Install GitHub Copilot (recommended) or Codex to get started.';
  }
  const ready = runtimes.filter((r) => r.ready);
  if (ready.length) {
    const lead = ready[0]!;
    return `${lead.name} is ready — you can start building your deck now.`;
  }
  const rec = runtimes.find((r) => r.recommended) ?? runtimes[0]!;
  if (rec.step === 'install') {
    return `Let's set up ${rec.name}. Follow the one step below, then you'll be ready.`;
  }
  return `${rec.name} just needs you to sign in. Follow the step below, then you'll be ready.`;
}

/**
 * Build the full first-run onboarding plan from the detected agents. Pure — the
 * caller (the daemon route) supplies the detection result.
 */
export function buildOnboardingPlan(agents: DetectedAgent[]): OnboardingPlan {
  const ordered = orderRuntimes(agents);
  const recommendedId = pickRecommendedId(ordered);
  const runtimes = ordered.map((a) => buildRuntimeCard(a, a.id === recommendedId));
  const ready = runtimes.filter((r) => r.ready);

  // The default runtime to actually use right now is the highest-preference READY
  // one (Copilot-first); null when nothing is ready yet.
  const defaultRuntimeId =
    RUNTIME_DEFAULT_ORDER.find((id) => ready.some((r) => r.id === id)) ?? ready[0]?.id ?? null;

  return {
    canStart: ready.length > 0,
    defaultRuntimeId,
    runtimes,
    summary: summarize(runtimes),
  };
}
