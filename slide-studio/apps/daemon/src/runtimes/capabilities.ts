/**
 * Per-runtime capability cache (plan §8.3, Slice 9). Mirrors open-design's
 * `agentCapabilities` map.
 *
 * Some CLI flags drift between versions — GitHub Copilot may expose
 * `--allow-all-tools`/`--add-dir` in one release and the renamed
 * `--allow-all-paths`/`--available-tools` in another. Detection probes the
 * installed CLI's `--help` once (see detection.ts `probeCapabilities`) and
 * records, per capability key, which flag spelling the binary actually
 * advertises. `buildArgs` then reads this cache to emit the right flag — so the
 * declarative def never branches on agent id and the daemon absorbs the drift
 * without a code change.
 *
 * Keyed by runtime id (`copilot`, `codex`, …). A capability key maps to the
 * concrete flag string the installed CLI supports (or `false` when the binary
 * advertises none of the known spellings, so buildArgs can fall back safely).
 */

/** One runtime's capability map: capability key → the supported flag string, or
 *  `false` when none of the candidate spellings were advertised. */
export type RuntimeCapabilityMap = Record<string, string | false>;

const capabilities = new Map<string, RuntimeCapabilityMap>();

/** Record the probed capability map for a runtime (called by detection). */
export function setAgentCapabilities(id: string, caps: RuntimeCapabilityMap): void {
  capabilities.set(id, caps);
}

/** Read a runtime's probed capability map (consulted by `buildArgs`). Returns an
 *  empty object when the runtime was never probed — buildArgs treats that as
 *  "unknown" and falls back to its legacy flag spellings. */
export function getAgentCapabilities(id: string): RuntimeCapabilityMap {
  return capabilities.get(id) ?? {};
}

/** Test/teardown helper — clear all cached capability maps. */
export function resetAgentCapabilities(): void {
  capabilities.clear();
}
