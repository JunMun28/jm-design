#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Verify an HTML slide deck with Playwright screenshots and DOM checks.

Per-theme verify rules are read from themes/themes.json. Universal lints
(title-slide-first, nav-dot count, geometry, ESC overview) run for every
deck regardless of theme.

Run via `uv run scripts/verify.py ...` (uv handles the playwright install).
First-time setup: `uv run --with playwright playwright install chromium`.
"""

import argparse
import json
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = SKILL_ROOT / "themes" / "themes.json"

# Fallback used only when --theme is given but the theme has no `verify` block,
# or when --skip-brand is passed. Pure universal lints — no palette/logo checks.
UNIVERSAL_VERIFY = {
    "required_tokens": [],
    "accent_rgb": None,
    "accent_max_per_slide": None,
    "logo_pattern": None,
    "require_logo_on_content_slides": False,
    "forbid_chart_on_gradient": False,
    "headline_contrast_min": 4.5,
    "palette_lock": False,
}


def load_themes():
    """Return list of theme entries from the manifest, or [] if missing."""
    if not MANIFEST_PATH.exists():
        return []
    try:
        data = json.loads(MANIFEST_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return []
    return data.get("themes", [])


def resolve_theme(theme_id):
    if not theme_id:
        return None
    for t in load_themes():
        if t.get("id") == theme_id:
            return t
    return None


def parse_viewport(value):
    width, height = value.split("x")
    return {"width": int(width), "height": int(height)}


def verify_html(html_path, viewports, slides, output_dir, show, wait, check_overview, fail_on_warnings, skip_brand, theme):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("ERROR: playwright is not installed.")
        print("Run: pip install playwright && playwright install chromium")
        return 1

    html_path = Path(html_path).resolve()
    if not html_path.exists():
        print(f"ERROR: file not found: {html_path}")
        return 1

    theme_entry = resolve_theme(theme)
    if theme and theme_entry is None:
        known = ", ".join(t.get("id", "?") for t in load_themes()) or "(none — manifest missing)"
        print(f"ERROR: unknown theme '{theme}'. Known themes: {known}")
        return 1
    if theme_entry:
        print(f"Theme: {theme_entry['id']} ({theme_entry.get('status', 'unknown')})")
        if theme_entry.get("status") == "deprecated":
            print(f"WARNING: theme '{theme}' is deprecated.")

    if skip_brand or theme_entry is None:
        verify_config = dict(UNIVERSAL_VERIFY)
    else:
        verify_config = {**UNIVERSAL_VERIFY, **(theme_entry.get("verify") or {})}

    output_dir = Path(output_dir) if output_dir else html_path.parent / "screenshots"
    output_dir.mkdir(parents=True, exist_ok=True)

    console_issues = []
    page_errors = []
    notes = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not show)

        for viewport in viewports:
            context = browser.new_context(viewport=viewport, device_scale_factor=2)
            page = context.new_page()
            page.on(
                "console",
                lambda msg: console_issues.append(f"[{msg.type}] {msg.text}")
                if msg.type in ("error", "warning")
                else None,
            )
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            page.goto(html_path.as_uri(), wait_until="networkidle")
            page.wait_for_timeout(wait)
            page.evaluate("() => document.fonts && document.fonts.ready")

            slide_count = page.locator(".slide").count()
            if slide_count == 0:
                page_errors.append("No .slide elements found.")

            if slide_count:
                brand_issues = page.evaluate(
                    """(cfg) => {
                        const out = [];
                        const root = getComputedStyle(document.documentElement);
                        for (const tok of (cfg.required_tokens || [])) {
                            if (!root.getPropertyValue(tok).trim()) {
                                out.push(`missing required token ${tok}`);
                            }
                        }
                        // Shared-runtime contract enforcement, scoped by a
                        // sentinel: --slide-padding is defined only by
                        // viewport-base.css. If the shared runtime is pasted,
                        // the contract tokens MUST resolve too (catches a deck
                        // that pasted viewport-base/layout-kit but forgot
                        // non-micron-contract.css). Self-contained decks define
                        // no --slide-padding and are correctly left alone.
                        if (root.getPropertyValue('--slide-padding').trim()) {
                            for (const tok of ['--bg-primary','--text-primary','--text-secondary','--col-gutter','--space-5','--type-xs','--hairline','--ease-out-expo','--duration-normal']) {
                                if (!root.getPropertyValue(tok).trim()) {
                                    out.push(`shared runtime present but contract token ${tok} is missing — paste references/tokens/non-micron-contract.css (non-Micron) or micron-tokens.css (Micron) after the theme tokens`);
                                }
                            }
                        }
                        const slides = Array.from(document.querySelectorAll('.slide'));
                        if (slides.length && !slides[0].classList.contains('title-slide') && slides[0].dataset.slideKind !== 'cover') {
                            out.push('first slide is not a title slide (.title-slide or data-slide-kind="cover")');
                        }
                        slides.forEach((s, i) => {
                            const isTitle = s.classList.contains('title-slide') || s.dataset.slideKind === 'cover';
                            // Logo/brand mark check
                            if (!isTitle && cfg.require_logo_on_content_slides && cfg.logo_pattern) {
                                // Accept either: a background-image whose URL
                                // matches the logo pattern, OR a text wordmark
                                // in ::after/::before content. The text mark is
                                // the brand keyword ("micron" from "micron-logo")
                                // so the no-binary "MICRON" fallback passes too.
                                const brandWord = cfg.logo_pattern.replace(/-logo.*/i, '').toLowerCase();
                                const markHosts = [s, s.querySelector(':scope > .slide-stage'), s.querySelector(':scope > .slide-content')].filter(Boolean);
                                let bg = '';
                                let content = '';
                                markHosts.forEach((host) => {
                                    const after = getComputedStyle(host, '::after');
                                    const before = getComputedStyle(host, '::before');
                                    bg += ' ' + (after.backgroundImage || '') + ' ' + (before.backgroundImage || '');
                                    content += ' ' + ((after.content || '') + ' ' + (before.content || '')).toLowerCase();
                                });
                                const hasLogoImage = new RegExp(cfg.logo_pattern, 'i').test(bg);
                                const hasTextMark = content.includes(cfg.logo_pattern.toLowerCase()) ||
                                    (brandWord.length >= 3 && content.includes(brandWord));
                                if (!hasLogoImage && !hasTextMark) {
                                    out.push(`slide ${i + 1}: missing brand mark — slide/stage pseudo-element must set background-image matching /${cfg.logo_pattern}/i or content containing "${brandWord}"`);
                                }
                            }
                            // Accent overuse check (theme-driven RGB).
                            // All four border sides + outline so side-stripe
                            // accents (a banned anti-pattern) are not invisible
                            // to the lint. Inherited `color` is discounted:
                            // only count an element whose own color differs
                            // from its parent's, so an accent-tinted wrapper
                            // does not inflate every descendant.
                            if (cfg.accent_rgb && cfg.accent_max_per_slide) {
                                let accentCount = 0;
                                const accentedSvgs = new Set();
                                const hasAccent = (v) => v && v.toLowerCase().includes(cfg.accent_rgb);
                                s.querySelectorAll('*').forEach((el) => {
                                    const cs = getComputedStyle(el);
                                    const parentColor = el.parentElement ? getComputedStyle(el.parentElement).color : '';
                                    const colorHit = hasAccent(cs.color) && cs.color !== parentColor;
                                    const otherHit = [cs.backgroundColor, cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor, cs.outlineColor, cs.fill, cs.stroke]
                                        .some(hasAccent);
                                    if (colorHit || otherHit) {
                                        const svg = el.closest('svg');
                                        if (svg) accentedSvgs.add(svg);
                                        else accentCount += 1;
                                    }
                                });
                                accentCount += accentedSvgs.size;
                                if (accentCount > cfg.accent_max_per_slide) {
                                    out.push(`slide ${i + 1}: accent overused (${accentCount} elements > max ${cfg.accent_max_per_slide}).`);
                                }
                            }
                            // Chart-on-gradient
                            if (cfg.forbid_chart_on_gradient) {
                                const charts = s.querySelectorAll('svg[role="img"], canvas, .chart, [data-chart]');
                                charts.forEach((c) => {
                                    let p = c.parentElement;
                                    while (p && p !== s) {
                                        const bg = getComputedStyle(p).backgroundImage;
                                        if (bg && bg.includes('gradient')) {
                                            out.push(`slide ${i + 1}: chart placed over a gradient — theme rule forbids this.`);
                                            break;
                                        }
                                        p = p.parentElement;
                                    }
                                });
                            }
                            // Headline contrast spot check.
                            // Resolve the EFFECTIVE background by walking
                            // ancestors for the first opaque background-color.
                            // Real decks paint via `background:`/gradients on
                            // the slide or a parent, so reading only the
                            // slide's backgroundColor (the old logic) almost
                            // always saw transparent and silently skipped —
                            // a false pass on the headline a11y guarantee.
                            const minContrast = cfg.headline_contrast_min || 4.5;
                            const h = s.querySelector('h1, h2');
                            if (h) {
                                const text = getComputedStyle(h).color;
                                const rgb = (str) => (str.match(/\\d+(\\.\\d+)?/g) || []).map(Number);
                                const lum = ([r, g, b]) => {
                                    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                                    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
                                };
                                let node = h, effBg = null, hasImageBg = false;
                                while (node && node !== document.documentElement) {
                                    const ncs = getComputedStyle(node);
                                    if (ncs.backgroundImage && ncs.backgroundImage !== 'none') hasImageBg = true;
                                    const parts = rgb(ncs.backgroundColor);
                                    const alpha = parts.length === 4 ? parts[3] : 1;
                                    if (parts.length >= 3 && alpha > 0.5) { effBg = parts.slice(0, 3); break; }
                                    node = node.parentElement;
                                }
                                const tRGB = rgb(text).slice(0, 3);
                                if (effBg && tRGB.length === 3) {
                                    const L1 = lum(tRGB), L2 = lum(effBg);
                                    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
                                    if (ratio < minContrast) {
                                        out.push(`slide ${i + 1}: headline contrast ratio ${ratio.toFixed(2)} < ${minContrast} (text=${text} bg=rgb(${effBg.join(', ')}))`);
                                    }
                                } else if (hasImageBg) {
                                    out.push(`NOTE: slide ${i + 1}: headline sits on a gradient/image — contrast not auto-verified, check it by eye against the worst-case background point.`);
                                } else {
                                    out.push(`NOTE: slide ${i + 1}: headline background did not resolve to an opaque colour — contrast not auto-verified.`);
                                }
                            }
                        });
                        // Universal UX lints (run for every theme).
                        // 1. Interactive elements should have cursor:pointer.
                        document.querySelectorAll('button, [role="button"], a[href], .ov-card').forEach((el) => {
                            const cs = getComputedStyle(el);
                            if (cs.cursor !== 'pointer' && cs.cursor !== 'auto' && cs.cursor !== 'default') return;
                            if (cs.cursor !== 'pointer') {
                                out.push(`interactive element <${el.tagName.toLowerCase()}> missing cursor:pointer`);
                            }
                        });
                        // 2. prefers-reduced-motion respected: at least one media query block referencing it.
                        const hasReducedMotion = Array.from(document.styleSheets).some(sheet => {
                            try { return Array.from(sheet.cssRules || []).some(r => r.cssText && /prefers-reduced-motion/i.test(r.cssText)); }
                            catch { return false; }
                        });
                        if (!hasReducedMotion) {
                            out.push('no @media (prefers-reduced-motion) rule found — motion accessibility lint');
                        }
                        return out;
                    }""",
                    verify_config,
                )
                # Dedupe universal lints across viewports
                seen = set()
                for issue in brand_issues:
                    key = issue
                    if key in seen:
                        continue
                    seen.add(key)
                    if issue.startswith("NOTE:"):
                        notes.append(issue[len("NOTE:"):].strip())
                    else:
                        page_errors.append(f"Lint: {issue}.")

                fonts_ready = page.evaluate("() => document.fonts && document.fonts.status === 'loaded'")
                if not fonts_ready:
                    console_issues.append("[warning] document.fonts did not reach 'loaded' state before checks ran.")

            nav_dot_count = page.locator(".nav-dots button").count()
            if slide_count and nav_dot_count not in (0, slide_count):
                page_errors.append(f"Nav dot count mismatch: {nav_dot_count} dots for {slide_count} slides.")

            max_slides = min(slides or slide_count or 1, slide_count or 1)
            stem = html_path.stem
            for index in range(max_slides):
                page.evaluate(
                    """index => {
                        if (window.presentation?.goTo) {
                            window.presentation.goTo(index, { immediate: true });
                        } else {
                            document.querySelectorAll('.slide')[index]?.scrollIntoView({ behavior: 'instant', block: 'start' });
                        }
                    }""",
                    index,
                )
                page.wait_for_timeout(1500)
                issues = page.evaluate(
                    """index => {
                        const slide = document.querySelectorAll('.slide')[index];
                        if (!slide) return ['missing slide'];
                        const content = slide.querySelector('.slide-content') || slide;
                        const out = [];
                        const rect = slide.getBoundingClientRect();
                        const contentRect = content.getBoundingClientRect();
                        const style = getComputedStyle(content);
                        const transformed = style.transform && style.transform !== 'none';
                        if (transformed) {
                            if (contentRect.top < rect.top - 2 || contentRect.bottom > rect.bottom + 2) {
                                out.push('vertical visual overflow');
                            }
                            if (contentRect.left < rect.left - 2 || contentRect.right > rect.right + 2) {
                                out.push('horizontal visual overflow');
                            }
                        } else {
                            if (content.scrollHeight > content.clientHeight + 2) out.push('vertical overflow');
                            if (content.scrollWidth > content.clientWidth + 2) out.push('horizontal overflow');
                        }
                        if (rect.width < 1 || rect.height < 1) out.push('blank slide geometry');
                        return out;
                    }""",
                    index,
                )
                for issue in issues:
                    page_errors.append(f"Slide {index + 1} at {viewport['width']}x{viewport['height']}: {issue}.")
                out = output_dir / f"{stem}-slide-{index + 1:02d}-{viewport['width']}x{viewport['height']}.png"
                page.screenshot(path=str(out), full_page=False)

            if check_overview:
                overview = page.locator("#overview")
                if overview.count() == 0:
                    page_errors.append("Missing #overview element for ESC slide overview.")
                else:
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(300)
                    is_visible = overview.evaluate(
                        """el => el.getAttribute('aria-hidden') === 'false' &&
                        getComputedStyle(el).display !== 'none'"""
                    )
                    card_count = page.locator("#overview .ov-card").count()
                    if not is_visible:
                        page_errors.append("ESC did not open #overview.")
                    if slide_count and card_count != slide_count:
                        page_errors.append(f"Overview card count mismatch: {card_count} for {slide_count} slides.")
                    out = output_dir / f"{stem}-overview-{viewport['width']}x{viewport['height']}.png"
                    page.screenshot(path=str(out), full_page=False)
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(150)

            if show:
                input("Browser is open. Press Enter to close...")
            context.close()

        browser.close()

    print(f"Screenshots: {output_dir}")
    if page_errors:
        print("Page errors:")
        for error in page_errors:
            print(f"- {error}")
    if console_issues:
        print("Console issues:")
        for issue in console_issues[:20]:
            print(f"- {issue}")
        if len(console_issues) > 20:
            print(f"... {len(console_issues) - 20} more")
    if notes:
        print("Notes (not failures — verify these by eye):")
        for note in notes:
            print(f"- {note}")

    warning_failure = fail_on_warnings and any(issue.startswith("[warning]") for issue in console_issues)
    error_failure = any(issue.startswith("[error]") for issue in console_issues)
    return 1 if page_errors or error_failure or warning_failure else 0


def main():
    parser = argparse.ArgumentParser(description="Verify HTML slide deck rendering.")
    parser.add_argument("html_path", nargs="?", default=None)
    parser.add_argument("--viewports", default="1280x720,375x667")
    parser.add_argument("--slides", type=int, default=0)
    parser.add_argument("--output", default=None)
    parser.add_argument("--show", action="store_true")
    parser.add_argument("--wait", type=int, default=1200)
    parser.add_argument("--check-overview", action="store_true")
    parser.add_argument("--fail-on-warnings", action="store_true")
    parser.add_argument("--skip-brand", action="store_true",
                        help="Skip theme-specific brand lints (palette tokens, logo, accent overuse). Universal lints still run.")
    parser.add_argument("--theme", default=None,
                        help="Theme id from themes/themes.json. Applies that theme's verify config.")
    parser.add_argument("--list-themes", action="store_true",
                        help="Print available themes from themes/themes.json and exit.")
    args = parser.parse_args()

    if args.list_themes:
        for t in load_themes():
            print(f"{t.get('id', '?'):32s} {t.get('status', '?'):14s} {t.get('name', '')}")
        return 0

    if not args.html_path:
        parser.error("html_path is required unless --list-themes is given")

    if not args.theme and not args.skip_brand:
        parser.error(
            "--theme <id> is required so per-theme brand lints (palette, accent, "
            "logo, contrast floor, chart-on-gradient) actually run. "
            "Pass --skip-brand to deliberately run universal lints only, "
            "or --list-themes to see ids."
        )

    viewports = [parse_viewport(item) for item in args.viewports.split(",")]
    return verify_html(
        args.html_path,
        viewports,
        args.slides,
        args.output,
        args.show,
        args.wait,
        args.check_overview,
        args.fail_on_warnings,
        args.skip_brand,
        args.theme,
    )


if __name__ == "__main__":
    sys.exit(main())
