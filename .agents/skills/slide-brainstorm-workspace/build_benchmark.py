#!/usr/bin/env python3
"""Build benchmark.json from grading.json files for the eval viewer."""
from __future__ import annotations

import json
import statistics
from datetime import datetime, timezone
from pathlib import Path

ITERATION = Path(__file__).parent / "iteration-1"


def main():
    runs = []
    by_config = {"with_skill": [], "without_skill": []}

    for meta_path in sorted(ITERATION.glob("eval-*/eval_metadata.json")):
        meta = json.loads(meta_path.read_text())
        eval_id = meta["eval_id"]
        eval_name = meta["eval_name"]
        for cfg in ("with_skill", "without_skill"):
            grading_path = meta_path.parent / cfg / "grading.json"
            if not grading_path.exists():
                continue
            grading = json.loads(grading_path.read_text())
            exps = grading["expectations"]
            passed = sum(1 for e in exps if e["passed"])
            total = len(exps)
            pass_rate = passed / total if total else 0.0
            by_config[cfg].append(pass_rate)
            runs.append({
                "eval_id": eval_id,
                "eval_name": eval_name,
                "configuration": cfg,
                "run_number": 1,
                "result": {
                    "pass_rate": round(pass_rate, 3),
                    "passed": passed,
                    "failed": total - passed,
                    "total": total,
                    "time_seconds": 0,
                    "tokens": 0,
                    "tool_calls": 0,
                    "errors": 0,
                },
                "expectations": exps,
                "notes": [],
            })

    runs.sort(key=lambda r: (r["eval_id"], 0 if r["configuration"] == "with_skill" else 1))

    def stats(xs):
        if not xs:
            return {"mean": 0, "stddev": 0, "min": 0, "max": 0}
        return {
            "mean": round(statistics.mean(xs), 3),
            "stddev": round(statistics.stdev(xs), 3) if len(xs) > 1 else 0.0,
            "min": round(min(xs), 3),
            "max": round(max(xs), 3),
        }

    summary = {
        "with_skill": {
            "pass_rate": stats(by_config["with_skill"]),
            "time_seconds": {"mean": 0, "stddev": 0, "min": 0, "max": 0},
            "tokens": {"mean": 0, "stddev": 0, "min": 0, "max": 0},
        },
        "without_skill": {
            "pass_rate": stats(by_config["without_skill"]),
            "time_seconds": {"mean": 0, "stddev": 0, "min": 0, "max": 0},
            "tokens": {"mean": 0, "stddev": 0, "min": 0, "max": 0},
        },
        "delta": {
            "pass_rate": f"+{(stats(by_config['with_skill'])['mean'] - stats(by_config['without_skill'])['mean']):+.3f}".replace("++", "+"),
            "time_seconds": "n/a (token/time data not captured in this client)",
            "tokens": "n/a (token/time data not captured in this client)",
        },
    }

    benchmark = {
        "metadata": {
            "skill_name": "slide-brainstorm",
            "skill_path": str((Path(__file__).parent.parent / "slide-brainstorm").resolve()),
            "executor_model": "subagent (generalPurpose)",
            "analyzer_model": "n/a",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "evals_run": [r["eval_name"] for r in runs if r["configuration"] == "with_skill"],
            "runs_per_configuration": 1,
        },
        "runs": runs,
        "run_summary": summary,
        "notes": [
            "EVAL 1 (vague brief — 'kubernetes for non-engineers'): baseline shipped an actual HTML deck instead of a brainstorm; with_skill correctly produced an ASCII brainstorm with documented intake assumptions. This is the skill's strongest differentiation case.",
            "EVAL 2 (rich brief naming the reference file): both configurations scored 6/6. The skill is largely redundant when the user's prompt already provides perfect intake AND names the style reference. Honest result — the skill earns its keep most on vague briefs.",
            "EVAL 3 (different audience/tone): baseline produced a markdown outline rather than ASCII slide frames (0 SLIDE blocks detected), failing the structural assertions. With_skill held the ASCII-frame discipline AND adapted the design system to a warm scholastic palette (parchment / sage / serif) rather than copying Apple/Cursor restraint — showing the skill generalises rather than overfitting to the example reference.",
            "Assertion 'refuses_to_build_actual_deck' is the highest-leverage check: baseline failed only on eval 1 (HTML produced), suggesting the 'refuse to render until approved' rule in the skill is doing real work on vague briefs.",
            "Time and token data not available in this client — notification format does not surface total_tokens or duration_ms. Benchmark relies on assertion pass rates.",
        ],
    }

    out = ITERATION / "benchmark.json"
    out.write_text(json.dumps(benchmark, indent=2))
    print(f"wrote {out}")
    print(f"  with_skill    pass_rate = {summary['with_skill']['pass_rate']['mean']:.0%}")
    print(f"  without_skill pass_rate = {summary['without_skill']['pass_rate']['mean']:.0%}")
    print(f"  delta         = {summary['delta']['pass_rate']}")


if __name__ == "__main__":
    main()
