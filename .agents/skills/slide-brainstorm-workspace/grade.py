#!/usr/bin/env python3
"""Programmatic grader for slide-brainstorm skill evals.

Reads outputs from iteration-N/eval-*/with_skill|without_skill/outputs/, evaluates
each assertion, and writes grading.json (using viewer's expected schema) per run.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ITERATION = Path(__file__).parent / "iteration-1"


def list_outputs(run_dir: Path) -> list[Path]:
    out = run_dir / "outputs"
    if not out.exists():
        return []
    return sorted([p for p in out.rglob("*") if p.is_file()])


def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        return ""


def find_brainstorm_text(files: list[Path]) -> tuple[Path | None, str]:
    """Pick the most-likely brainstorm file from outputs."""
    txt_files = [f for f in files if f.suffix in (".txt", ".md")]
    if not txt_files:
        return None, ""
    txt_files.sort(key=lambda f: (
        0 if re.match(r"\d{4}-\d{2}-\d{2}-.*deck\.txt$", f.name) else
        1 if f.suffix == ".txt" else
        2,
        -f.stat().st_size,
    ))
    pick = txt_files[0]
    return pick, read_text(pick)


def has_box_chars(text: str) -> bool:
    return any(c in text for c in "┌─┐│└┘╔═╗╚║╝")


def grep(text: str, pattern: str, flags: int = re.IGNORECASE) -> bool:
    return bool(re.search(pattern, text, flags))


def count_slide_blocks(text: str) -> int:
    return len(re.findall(r"^\s*SLIDE\s+0?\d+\s*[—\-–]\s+\S", text, re.MULTILINE))


def has_extension(files: list[Path], exts: set[str]) -> bool:
    return any(f.suffix.lower() in exts for f in files)


def grade_run(eval_id: int, eval_name: str, eval_dir: Path, run_kind: str, assertions: list[dict]) -> dict:
    run_dir = eval_dir / run_kind
    files = list_outputs(run_dir)
    bs_path, text = find_brainstorm_text(files)
    file_names = [f.name for f in files]

    results = []
    for a in assertions:
        name = a["name"]
        desc = a["description"]
        passed: bool | None = False
        evidence = ""

        if name == "asks_intake_questions_before_drafting":
            asked = grep(text, r"intake\s*note|assumptions?|open\s*questions?", re.IGNORECASE) and \
                    grep(text, r"audience|goal|length", re.IGNORECASE)
            passed = asked
            evidence = "found INTAKE NOTE / assumptions / open questions block" if asked else \
                       "no intake-note or assumptions block found in output"

        elif name == "produces_brainstorm_txt_file":
            pat = re.compile(r"^\d{4}-\d{2}-\d{2}-.*deck\.txt$")
            hit = any(pat.match(f) for f in file_names)
            passed = hit
            evidence = f"files: {file_names}"

        elif name == "file_has_header_box":
            ok = has_box_chars(text) and \
                 all(grep(text, kw) for kw in ["audience", "goal", "format|length", "date"])
            passed = ok
            evidence = "box chars + audience/goal/format/date keys present" if ok else \
                       "missing one of: box chars, audience, goal, format, date"

        elif name == "file_has_narrative_arc_section":
            ok = grep(text, r"narrative\s*arc")
            passed = ok
            evidence = "found 'NARRATIVE ARC' heading" if ok else "no narrative arc section"

        elif name == "file_has_per_slide_ascii_frames":
            slides = count_slide_blocks(text)
            ok = slides >= 3 and has_box_chars(text)
            passed = ok
            evidence = f"detected {slides} SLIDE blocks; box chars present={has_box_chars(text)}"

        elif name == "refuses_to_build_actual_deck":
            forbidden = has_extension(files, {".pptx", ".html", ".pdf", ".key"})
            passed = not forbidden
            evidence = f"forbidden extensions present: {[f for f in file_names if Path(f).suffix.lower() in {'.pptx', '.html', '.pdf', '.key'}]}" if forbidden else "only .txt/.md outputs"

        elif name == "skips_already_answered_intake":
            asked_back = grep(text, r"^\s*-?\s*(audience|goal|length|scope|style)\s*\??\s*$", re.IGNORECASE | re.MULTILINE)
            passed = not asked_back
            evidence = "no re-asking detected" if not asked_back else "found a re-ask line"

        elif name == "reads_referenced_style_file":
            cues = grep(text, r"micron[- ]light|github copilot|hairline|nav[- ]dot|module[- ]rail")
            passed = cues
            evidence = "style cues from reference present in design system" if cues else "no reference-style cues found"

        elif name == "produces_7_slide_brainstorm":
            slides = count_slide_blocks(text)
            ok = slides == 7
            passed = ok
            evidence = f"detected {slides} SLIDE blocks (expected 7)"

        elif name == "produces_6_slide_brainstorm":
            slides = count_slide_blocks(text)
            ok = slides == 6
            passed = ok
            evidence = f"detected {slides} SLIDE blocks (expected 6)"

        elif name == "uses_design_vocabulary":
            terms = ["hairline", "manuscript row", "italic accent", "stat[- ]row", "split[- ]card",
                     "borderless quote", "soft wash", "italic closer", "inline action"]
            matches = [t for t in terms if grep(text, t)]
            ok = len(matches) >= 3
            passed = ok
            evidence = f"matched terms: {matches}"

        elif name == "low_card_count":
            ok = grep(text, r"card\s*budget\s*[:=]\s*1|card budget\s*for the entire deck\s*[:=]\s*1")
            passed = ok
            evidence = "explicit 'card budget: 1' found" if ok else "no explicit card budget constraint"

        elif name == "adapts_voice_to_warm":
            warm_cues = grep(text, r"warm|approachable|colleague|trustworthy|conversational|paper|parchment|cream|sage")
            cold_cues = grep(text, r"periods are loud|apple/cursor|cold")
            ok = warm_cues
            passed = ok
            evidence = f"warm cues={warm_cues}, cold-restraint cues={cold_cues}"

        elif name == "uses_teacher_relevant_examples":
            ok = grep(text, r"lesson plan|rubric|differentiation|parent\s*(email|letter)|classroom|grading|sub plan|formative")
            passed = ok
            evidence = "found teacher-workflow vocabulary" if ok else "no teacher-specific examples detected"

        else:
            passed = None
            evidence = "unknown assertion"

        results.append({"text": desc, "passed": bool(passed), "evidence": evidence, "name": name})

    return {
        "eval_id": eval_id,
        "eval_name": eval_name,
        "run_kind": run_kind,
        "files": file_names,
        "brainstorm_picked": bs_path.name if bs_path else None,
        "expectations": results,
    }


def main():
    by_eval = {}
    for meta_path in sorted(ITERATION.glob("eval-*/eval_metadata.json")):
        meta = json.loads(meta_path.read_text())
        eval_id = meta["eval_id"]
        eval_name = meta["eval_name"]
        for run_kind in ("with_skill", "without_skill"):
            run_dir = meta_path.parent / run_kind
            if not run_dir.exists():
                continue
            grading = grade_run(eval_id, eval_name, meta_path.parent, run_kind, meta["assertions"])
            (run_dir / "grading.json").write_text(json.dumps(grading, indent=2))
            by_eval.setdefault(eval_id, {})[run_kind] = grading

    print(json.dumps(by_eval, indent=2))


if __name__ == "__main__":
    main()
