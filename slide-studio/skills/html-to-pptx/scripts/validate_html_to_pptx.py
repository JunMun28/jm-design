#!/usr/bin/env python3
"""Validate HTML-to-PPTX output for both image and layered (editable) modes.

Structural checks read the real slide XML and embedded media. When LibreOffice
is available, the generated .pptx is round-trip rendered back to PNGs and diffed
against the original browser screenshots -- the true "what PowerPoint shows" pass.
"""
import argparse
import io
import json
import math
import posixpath
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageStat

EMU_PER_INCH = 914400
NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

SOFFICE_CANDIDATES = [
    "soffice",
    "libreoffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
]


def parse_args():
    parser = argparse.ArgumentParser(description="Validate HTML-to-PPTX output (image or layered).")
    parser.add_argument("--pptx", required=True, help="Generated PPTX path")
    parser.add_argument("--manifest", required=True, help="Converter manifest.json path")
    parser.add_argument("--report", required=True, help="Write JSON report here")
    parser.add_argument("--contact-sheet", required=True, help="Write contact sheet PNG here")
    parser.add_argument("--max-mean-delta", type=float, default=1.0,
                        help="Max mean pixel delta for the embedded background/raster vs screenshot")
    parser.add_argument("--max-render-delta", type=float, default=24.0,
                        help="Soft max mean delta for round-trip render vs source (warning only)")
    parser.add_argument("--extent-tolerance-emu", type=int, default=2)
    parser.add_argument("--soffice", default=None, help="Path to soffice/libreoffice binary")
    parser.add_argument("--no-render", action="store_true", help="Skip LibreOffice round-trip render")
    parser.add_argument("--render-dpi", type=int, default=150)
    parser.add_argument("--no-fail", action="store_true", help="Do not exit non-zero on failed checks")
    return parser.parse_args()


def natural_slide_key(name):
    match = re.search(r"slide(\d+)\.xml$", name)
    return int(match.group(1)) if match else 0


def load_manifest(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def check(text, passed, evidence, checks):
    checks.append({"text": text, "passed": bool(passed), "evidence": evidence})


def rel_target_to_zip_path(rels_path, target):
    base = posixpath.dirname(posixpath.dirname(rels_path))
    return posixpath.normpath(posixpath.join(base, target))


def read_presentation_size(zip_file):
    root = ET.fromstring(zip_file.read("ppt/presentation.xml"))
    size = root.find(".//p:sldSz", NS)
    if size is None:
        return None
    return int(size.attrib["cx"]), int(size.attrib["cy"])


def slide_image_info(zip_file, slide_name):
    slide_num = natural_slide_key(slide_name)
    rels_name = f"ppt/slides/_rels/slide{slide_num}.xml.rels"
    rels = {}
    if rels_name in zip_file.namelist():
        rel_root = ET.fromstring(zip_file.read(rels_name))
        for rel in rel_root.findall("rel:Relationship", NS):
            if rel.attrib.get("Type", "").endswith("/image"):
                rels[rel.attrib["Id"]] = rel_target_to_zip_path(rels_name, rel.attrib["Target"])

    slide_root = ET.fromstring(zip_file.read(slide_name))
    pics = slide_root.findall(".//p:pic", NS)
    image_refs = []
    for pic in pics:
        blip = pic.find(".//a:blip", NS)
        embed_id = blip.attrib.get(f"{{{NS['r']}}}embed") if blip is not None else None
        off = pic.find(".//a:xfrm/a:off", NS)
        ext = pic.find(".//a:xfrm/a:ext", NS)
        image_refs.append({
            "embedId": embed_id,
            "target": rels.get(embed_id),
            "off": {
                "x": int(off.attrib.get("x", 0)) if off is not None else None,
                "y": int(off.attrib.get("y", 0)) if off is not None else None,
            },
            "ext": {
                "cx": int(ext.attrib.get("cx", 0)) if ext is not None else None,
                "cy": int(ext.attrib.get("cy", 0)) if ext is not None else None,
            },
        })
    return image_refs


def slide_text_info(zip_file, slide_name, slide_cx, slide_cy):
    """Return editable text boxes: their text and whether geometry is in-bounds."""
    slide_root = ET.fromstring(zip_file.read(slide_name))
    boxes = []
    for sp in slide_root.findall(".//p:sp", NS):
        tx = sp.find(".//p:txBody", NS)
        if tx is None:
            continue
        runs = [t.text or "" for t in tx.findall(".//a:t", NS)]
        text = "".join(runs).strip()
        if not text:
            continue
        off = sp.find(".//a:xfrm/a:off", NS)
        ext = sp.find(".//a:xfrm/a:ext", NS)
        x = int(off.attrib.get("x", 0)) if off is not None else 0
        y = int(off.attrib.get("y", 0)) if off is not None else 0
        cx = int(ext.attrib.get("cx", 0)) if ext is not None else 0
        cy = int(ext.attrib.get("cy", 0)) if ext is not None else 0
        # Font of first run, if present.
        rpr = tx.find(".//a:r/a:rPr", NS)
        font = None
        if rpr is not None:
            latin = rpr.find("a:latin", NS)
            if latin is not None:
                font = latin.attrib.get("typeface")
        in_bounds = (x >= -2 and y >= -2 and x <= slide_cx and y <= slide_cy)
        boxes.append({"text": text, "x": x, "y": y, "cx": cx, "cy": cy, "font": font, "in_bounds": in_bounds})
    return boxes


def image_stats(image):
    rgb = image.convert("RGB")
    stat = ImageStat.Stat(rgb)
    tiny = rgb.resize((min(160, rgb.width), min(90, rgb.height)))
    colors = tiny.getcolors(maxcolors=1000000) or []
    return {
        "mean": stat.mean,
        "variance_sum": float(sum(stat.var)),
        "unique_sampled_colors": len(colors),
    }


def compare_images(source_path_or_img, embedded):
    source = source_path_or_img if isinstance(source_path_or_img, Image.Image) else Image.open(source_path_or_img)
    source = source.convert("RGBA")
    embedded = embedded.convert("RGBA")
    same_size = source.size == embedded.size
    diff_base = embedded if same_size else embedded.resize(source.size)
    diff = ImageChops.difference(source, diff_base)
    stat = ImageStat.Stat(diff)
    mean_delta = float(sum(stat.mean) / len(stat.mean))
    rms = math.sqrt(sum((value ** 2 for value in stat.mean)) / len(stat.mean))
    return {
        "source": source,
        "embedded": embedded,
        "diff": diff,
        "same_size": same_size,
        "source_size": source.size,
        "embedded_size": embedded.size,
        "mean_delta": mean_delta,
        "rms_delta": rms,
        "embedded_stats": image_stats(embedded),
    }


def find_soffice(explicit):
    for cand in ([explicit] if explicit else []) + SOFFICE_CANDIDATES:
        if not cand:
            continue
        if Path(cand).exists():
            return cand
        found = shutil.which(cand)
        if found:
            return found
    return None


def render_pptx_to_pngs(pptx_path, soffice, dpi, workdir):
    """soffice pptx -> pdf, then pdf -> per-page PNGs. Returns (pngs, reason)."""
    tmp = Path(tempfile.mkdtemp(prefix="h2p-render-", dir=str(workdir)))
    try:
        proc = subprocess.run(
            [soffice, "--headless", "--convert-to", "pdf", "--outdir", str(tmp), str(pptx_path)],
            capture_output=True, text=True, timeout=240,
        )
        pdfs = list(tmp.glob("*.pdf"))
        if not pdfs:
            return None, f"soffice produced no pdf: {proc.stderr.strip()[:200]}"
        pdf = pdfs[0]
        # Prefer pdftoppm (poppler); fall back to PyMuPDF.
        pdftoppm = shutil.which("pdftoppm")
        if pdftoppm:
            subprocess.run([pdftoppm, "-r", str(dpi), "-png", str(pdf), str(tmp / "page")],
                           capture_output=True, text=True, timeout=180)
            pngs = sorted(tmp.glob("page*.png"), key=lambda p: int(re.search(r"(\d+)", p.stem).group(1)))
            if pngs:
                return pngs, None
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(str(pdf))
            pngs = []
            zoom = dpi / 72.0
            for i, page in enumerate(doc):
                pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
                out = tmp / f"page-{i + 1:03d}.png"
                pix.save(str(out))
                pngs.append(out)
            return pngs, None
        except ImportError:
            return None, "no pdftoppm (poppler) and no PyMuPDF to rasterize the pdf"
    except subprocess.TimeoutExpired:
        return None, "soffice render timed out"
    except Exception as exc:  # noqa: BLE001
        return None, f"render error: {exc}"


def make_contact_sheet(slides, out_path, columns=3):
    thumb_w, thumb_h, label_h, gap = 300, 169, 22, 12
    tile_w = thumb_w * columns + gap * (columns - 1)
    tile_h = thumb_h + label_h
    rows = max(1, math.ceil(len(slides)))
    sheet = Image.new("RGB", (tile_w + 2 * gap, rows * (tile_h + gap) + gap), "white")
    draw = ImageDraw.Draw(sheet)
    for idx, slide in enumerate(slides):
        x = gap
        y = gap + idx * (tile_h + gap)
        panes = slide.get("panes", [])
        draw.text((x, y), f"{slide['index']:02d}  " + "  |  ".join(p[0] for p in panes), fill=(0, 0, 0))
        for pane_idx, (label, image, brighten) in enumerate(panes):
            if image is None:
                thumb = Image.new("RGB", (thumb_w, thumb_h), (235, 235, 235))
            else:
                src = ImageEnhance.Brightness(image.convert("RGB")).enhance(12) if brighten else image.convert("RGB")
                thumb = src.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            sheet.paste(thumb, (x + pane_idx * (thumb_w + gap), y + label_h))
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def validate(args):
    pptx_path = Path(args.pptx)
    manifest_path = Path(args.manifest)
    report_path = Path(args.report)
    contact_sheet_path = Path(args.contact_sheet)
    manifest = load_manifest(manifest_path)
    mode = manifest.get("mode", "image")
    checks = []
    slide_reports = []

    check("PPTX file exists", pptx_path.exists(), str(pptx_path), checks)
    check("Manifest has captured slides", bool(manifest.get("slides")),
          f"{len(manifest.get('slides', []))} slides in manifest", checks)
    if not pptx_path.exists():
        raise FileNotFoundError(pptx_path)

    # Optional round-trip render (true PowerPoint-equivalent layout).
    rendered_pngs, render_reason = None, None
    workdir = report_path.parent
    soffice = None if args.no_render else find_soffice(args.soffice)
    if not args.no_render and not soffice:
        render_reason = "LibreOffice (soffice) not found"
    elif soffice:
        rendered_pngs, render_reason = render_pptx_to_pngs(pptx_path, soffice, args.render_dpi, workdir)

    with zipfile.ZipFile(pptx_path, "r") as zip_file:
        names = set(zip_file.namelist())
        slide_files = sorted([n for n in names if re.match(r"ppt/slides/slide\d+\.xml$", n)], key=natural_slide_key)
        expected_count = len(manifest.get("slides", []))
        check("PPTX slide count equals captured slide count", len(slide_files) == expected_count,
              f"pptx={len(slide_files)} captured={expected_count}", checks)

        presentation_size = read_presentation_size(zip_file)
        pptx_meta = manifest.get("pptx", {})
        expected_cx = int(pptx_meta.get("slideWidthEmu") or round(pptx_meta.get("slideWidthIn", 13.333333) * EMU_PER_INCH))
        expected_cy = int(pptx_meta.get("slideHeightEmu") or round(pptx_meta.get("slideHeightIn", 7.5) * EMU_PER_INCH))
        check("Presentation slide size matches manifest", presentation_size == (expected_cx, expected_cy),
              f"presentation={presentation_size} manifest={(expected_cx, expected_cy)}", checks)

        if mode == "layered":
            check("Manifest mode is layered (editable)", True, "mode=layered", checks)

        for idx, slide_file in enumerate(slide_files):
            manifest_slide = manifest["slides"][idx] if idx < expected_count else {}
            slide_index = idx + 1
            refs = slide_image_info(zip_file, slide_file)
            slide_checks = []

            check("Slide has exactly one background image", len(refs) == 1,
                  f"slide {slide_index}: {len(refs)} image(s)", slide_checks)
            image_ref = refs[0] if refs else {}
            target = image_ref.get("target")
            check("Background image relationship resolves", bool(target and target in names),
                  f"slide {slide_index}: {target}", slide_checks)
            check("Background image starts at x=0 y=0", image_ref.get("off") == {"x": 0, "y": 0},
                  f"slide {slide_index}: off={image_ref.get('off')}", slide_checks)
            ext = image_ref.get("ext") or {}
            ext_ok = (abs((ext.get("cx") or 0) - expected_cx) <= args.extent_tolerance_emu
                      and abs((ext.get("cy") or 0) - expected_cy) <= args.extent_tolerance_emu)
            check("Background image fills the full slide", ext_ok,
                  f"slide {slide_index}: ext={ext} expected={(expected_cx, expected_cy)}", slide_checks)

            # Compare embedded background against the captured raster for that layer.
            raster_path = manifest_slide.get("background") if mode == "layered" else manifest_slide.get("screenshot")
            comparison = None
            if target and target in names and raster_path and Path(raster_path).exists():
                comparison = compare_images(raster_path, Image.open(io.BytesIO(zip_file.read(target))))
                check("Embedded background dimensions match captured raster", comparison["same_size"],
                      f"slide {slide_index}: src={comparison['source_size']} emb={comparison['embedded_size']}", slide_checks)
                check("Embedded background matches captured raster pixels",
                      comparison["mean_delta"] <= args.max_mean_delta,
                      f"slide {slide_index}: mean_delta={comparison['mean_delta']:.4f}", slide_checks)
                stats = comparison["embedded_stats"]
                not_blank = stats["variance_sum"] > 20 and stats["unique_sampled_colors"] > 12
                check("Background image is not blank", not_blank,
                      f"slide {slide_index}: variance={stats['variance_sum']:.1f} colors={stats['unique_sampled_colors']}",
                      slide_checks)

            # Layered-only: editable text boxes.
            text_boxes = []
            if mode == "layered":
                text_boxes = slide_text_info(zip_file, slide_file, expected_cx, expected_cy)
                expected_runs = manifest_slide.get("textRuns", [])
                check("Editable text box count matches extracted runs",
                      len(text_boxes) == len(expected_runs),
                      f"slide {slide_index}: pptx={len(text_boxes)} runs={len(expected_runs)}", slide_checks)
                if expected_runs:
                    check("Slide has editable text boxes", len(text_boxes) > 0,
                          f"slide {slide_index}: {len(text_boxes)} text boxes", slide_checks)
                # Text content fidelity: every extracted run text present in the slide XML.
                pptx_texts = {re.sub(r"\s+", " ", b["text"]).strip() for b in text_boxes}
                missing = [r["text"] for r in expected_runs
                           if re.sub(r"\s+", " ", r["text"]).strip() not in pptx_texts]
                check("All extracted text present as editable boxes", not missing,
                      f"slide {slide_index}: missing={missing[:3]}", slide_checks)
                # Geometry sanity.
                oob = [b for b in text_boxes if not b["in_bounds"]]
                check("All text boxes are within slide bounds", not oob,
                      f"slide {slide_index}: {len(oob)} out-of-bounds", slide_checks)

            # Round-trip render comparison (visual proof), if available.
            render_cmp = None
            if rendered_pngs and idx < len(rendered_pngs):
                source_full = manifest_slide.get("screenshot")
                if source_full and Path(source_full).exists():
                    render_cmp = compare_images(source_full, Image.open(rendered_pngs[idx]))
                    # Soft check (warning surfaced via report, not a hard fail for layered reflow).
                    label = "Rendered PPTX is close to source HTML"
                    passed = render_cmp["mean_delta"] <= args.max_render_delta
                    check(label, passed,
                          f"slide {slide_index}: render_mean_delta={render_cmp['mean_delta']:.2f} (max {args.max_render_delta})",
                          slide_checks)

            # Build contact-sheet panes.
            panes = []
            if manifest_slide.get("screenshot") and Path(manifest_slide["screenshot"]).exists():
                panes.append(("source", Image.open(manifest_slide["screenshot"]), False))
            if render_cmp is not None:
                panes.append(("rendered-pptx", render_cmp["embedded"], False))
                panes.append(("diff", render_cmp["diff"], True))
            elif comparison is not None:
                panes.append(("bg-layer" if mode == "layered" else "embedded", comparison["embedded"], False))
                panes.append(("diff", comparison["diff"], True))

            slide_passed = all(item["passed"] for item in slide_checks)
            slide_reports.append({
                "index": slide_index,
                "kind": manifest_slide.get("kind", ""),
                "passed": slide_passed,
                "checks": slide_checks,
                "text_box_count": len(text_boxes),
                "render_mean_delta": round(render_cmp["mean_delta"], 3) if render_cmp else None,
                "panes": panes,
            })
            checks.extend(slide_checks)

    make_contact_sheet(slide_reports, contact_sheet_path)

    serializable_slides = [{k: v for k, v in s.items() if k != "panes"} for s in slide_reports]
    passed = all(item["passed"] for item in checks)
    summary = {
        "passed": sum(1 for i in checks if i["passed"]),
        "failed": sum(1 for i in checks if not i["passed"]),
        "total": len(checks),
        "pass_rate": round(sum(1 for i in checks if i["passed"]) / len(checks), 4) if checks else 0,
    }
    report = {
        "passed": passed,
        "mode": mode,
        "summary": summary,
        "render": {"performed": bool(rendered_pngs), "reason": render_reason,
                   "pages": len(rendered_pngs) if rendered_pngs else 0,
                   "soffice": soffice},
        "pptx": str(pptx_path),
        "manifest": str(manifest_path),
        "contact_sheet": str(contact_sheet_path),
        "expectations": checks,
        "slides": serializable_slides,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main():
    args = parse_args()
    report = validate(args)
    print(f"Mode: {report['mode']}")
    print(f"Validation report: {args.report}")
    print(f"Contact sheet: {args.contact_sheet}")
    r = report["render"]
    if r["performed"]:
        deltas = [s["render_mean_delta"] for s in report["slides"] if s["render_mean_delta"] is not None]
        avg = round(sum(deltas) / len(deltas), 2) if deltas else "n/a"
        print(f"Round-trip render: {r['pages']} pages, avg mean-delta vs source = {avg}")
    else:
        print(f"Round-trip render: skipped ({r['reason']})")
    print(f"Passed: {report['passed']} ({report['summary']['passed']}/{report['summary']['total']} checks)")
    if not report["passed"] and not args.no_fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
