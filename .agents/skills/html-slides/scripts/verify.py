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
REAL_SLIDE_SELECTOR = ".deck > .slide, body > .slide"

# Fallback used only when --theme is given but the theme has no `verify` block,
# or when --skip-brand is passed. Pure universal lints — no palette/logo checks.
UNIVERSAL_VERIFY = {
    "required_tokens": [],
    "accent_rgb": None,
    "accent_max_per_slide": None,
    "forbid_visible_accent_rgb": None,
    "forbid_visible_accent_name": None,
    "logo_pattern": None,
    "require_logo_on_content_slides": False,
    "forbid_chart_on_gradient": False,
    "headline_contrast_min": 4.5,
    "palette_lock": False,
    "premium_corporate_checks": False,
    "require_logo_image": False,
    "title_image_pattern": None,
    "title_logo_pattern": None,
    "forbid_accent_text_selectors": [],
    "enforce_sentence_case_headlines": False,
    "forbid_headline_end_punctuation": False,
    "min_label_body_gap_px": None,
    "forbid_selectors": [],
    "micron_light_title_checks": False,
    "require_title_animated_icon": False,
    "title_icon_pattern": None,
    "title_visual_selector": None,
    "require_title_template_selector": None,
    "require_title_shader_ready": False,
    "min_title_copy_gap_px": None,
    "min_title_icon_width_px": None,
    "min_title_icon_right_margin_px": None,
    "require_fixed_stage": False,
    "stage_width": None,
    "stage_height": None,
    "enforce_stage_overflow": False,
    "min_touch_target_px": None,
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
    notes_seen = set()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not show)

        for viewport in viewports:
            context = browser.new_context(viewport=viewport, device_scale_factor=2)
            page = context.new_page()
            def handle_console(msg):
                if msg.type not in ("error", "warning"):
                    return
                if "GPU stall due to ReadPixels" in msg.text:
                    return
                console_issues.append(f"[{msg.type}] {msg.text}")

            page.on("console", handle_console)
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            page.goto(html_path.as_uri(), wait_until="networkidle")
            page.wait_for_timeout(wait)
            page.evaluate("() => document.fonts && document.fonts.ready")

            slide_count = page.locator(REAL_SLIDE_SELECTOR).count()
            if slide_count == 0:
                page_errors.append("No .slide elements found.")

            if slide_count:
                eval_config = dict(verify_config)
                eval_config["viewport_width"] = viewport["width"]
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
                        const slides = Array.from(document.querySelectorAll('.deck > .slide, body > .slide'));
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
                                if (cfg.require_logo_image && !hasLogoImage) {
                                    out.push(`slide ${i + 1}: missing official logo image — content slide brand mark must use an asset URL matching /${cfg.logo_pattern}/i`);
                                } else if (!hasLogoImage && !hasTextMark) {
                                    out.push(`slide ${i + 1}: missing brand mark — slide/stage pseudo-element must set background-image matching /${cfg.logo_pattern}/i or content containing "${brandWord}"`);
                                }
                            }
                            // Premium corporate Micron dark executive checks:
                            // enforce the approved photo cover, logo asset,
                            // no accent-coloured prose/headline text, sentence
                            // case, and basic vertical rhythm around labels.
                            if (cfg.premium_corporate_checks) {
                                const hasAccent = (v) => cfg.accent_rgb && v && v.toLowerCase().includes(cfg.accent_rgb);
                                const imgs = Array.from(s.querySelectorAll('img'));
                                const stage = s.querySelector(':scope > .slide-stage') || s;
                                if (isTitle) {
                                    if (cfg.title_image_pattern) {
                                        const hasTitleImage = imgs.some((img) => new RegExp(cfg.title_image_pattern, 'i').test(img.getAttribute('src') || ''));
                                        if (!hasTitleImage) {
                                            out.push(`slide ${i + 1}: micron-dark-executive cover must use approved photo asset matching /${cfg.title_image_pattern}/i`);
                                        }
                                    }
                                    if (cfg.title_logo_pattern) {
                                        const hasTitleLogo = imgs.some((img) => new RegExp(cfg.title_logo_pattern, 'i').test(img.getAttribute('src') || ''));
                                        if (!hasTitleLogo) {
                                            out.push(`slide ${i + 1}: cover must use official white Micron logo asset matching /${cfg.title_logo_pattern}/i`);
                                        }
                                    }
                                    const bg = getComputedStyle(stage).backgroundColor;
                                    const parts = (bg.match(/\\d+(\\.\\d+)?/g) || []).map(Number);
                                    if (parts.length >= 3 && Math.max(parts[0], parts[1], parts[2]) > 16) {
                                        out.push(`slide ${i + 1}: cover stage must be true black or near-black, not ${bg}`);
                                    }
                                }
                                const forbiddenSelectors = (cfg.forbid_accent_text_selectors || []).join(',');
                                if (forbiddenSelectors) {
                                    s.querySelectorAll(forbiddenSelectors).forEach((el) => {
                                        const cs = getComputedStyle(el);
                                        const parentColor = el.parentElement ? getComputedStyle(el.parentElement).color : '';
                                        if (hasAccent(cs.color) && cs.color !== parentColor) {
                                            const txt = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 48);
                                            out.push(`slide ${i + 1}: accent color used on forbidden text selector "${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().replace(/\\s+/g, '.') : ''}" — "${txt}"`);
                                        }
                                    });
                                }
                                if (cfg.enforce_sentence_case_headlines || cfg.forbid_headline_end_punctuation) {
                                    s.querySelectorAll('h1, h2').forEach((h) => {
                                        const text = (h.textContent || '').replace(/\\s+/g, ' ').trim();
                                        if (!text) return;
                                        if (cfg.forbid_headline_end_punctuation && /[.!]$/.test(text)) {
                                            out.push(`slide ${i + 1}: headline has forbidden end punctuation — "${text.slice(0, 64)}"`);
                                        }
                                        if (cfg.enforce_sentence_case_headlines) {
                                            const words = text.split(/\\s+/).map((w) => w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')).filter(Boolean);
                                            const meaningful = words.filter((w) => w.length > 3 && !/^[A-Z0-9]+$/.test(w));
                                            const titleCased = meaningful.filter((w, idx) => idx > 0 && /^[A-Z][a-z]/.test(w));
                                            if (titleCased.length >= 2) {
                                                out.push(`slide ${i + 1}: headline looks title-cased, use Micron sentence case — "${text.slice(0, 64)}"`);
                                            }
                                        }
                                    });
                                }
                                if (typeof cfg.min_label_body_gap_px === 'number') {
                                    s.querySelectorAll('.label, .chart-label').forEach((label) => {
                                        const next = label.nextElementSibling;
                                        if (!next) return;
                                        const lr = label.getBoundingClientRect();
                                        const nr = next.getBoundingClientRect();
                                        const lcs = getComputedStyle(label);
                                        const ncs = getComputedStyle(next);
                                        if (lcs.display === 'none' || ncs.display === 'none' || lr.width <= 0 || nr.width <= 0) return;
                                        const stage = label.closest('.slide-stage');
                                        const stageScale = stage ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stage-scale') || '1') : 1;
                                        const gap = stage && stageScale > 0 && stageScale < 1 ? (nr.top - lr.bottom) / stageScale : nr.top - lr.bottom;
                                        if (gap + 0.5 < cfg.min_label_body_gap_px) {
                                            const txt = (label.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 48);
                                            out.push(`slide ${i + 1}: label/body vertical gap too tight (${gap.toFixed(1)}px < ${cfg.min_label_body_gap_px}px) after "${txt}"`);
                                        }
                                    });
                                }
                                s.querySelectorAll('*').forEach((el) => {
                                    const cs = getComputedStyle(el);
                                    if ((cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') && cs.backgroundImage && cs.backgroundImage !== 'none') {
                                        const txt = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 48);
                                        out.push(`slide ${i + 1}: gradient-filled text is not allowed in premium corporate decks — "${txt}"`);
                                    }
                                });
                            }
                            // Theme-specific forbidden selectors. Used for
                            // visual chrome that should not appear at all in a
                            // theme, even if it is small and readable.
                            (cfg.forbid_selectors || []).forEach((selector) => {
                                s.querySelectorAll(selector).forEach((el) => {
                                    const cs = getComputedStyle(el);
                                    const r = el.getBoundingClientRect();
                                    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) <= 0.05 || r.width <= 1 || r.height <= 1) return;
                                    const txt = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 48);
                                    out.push(`slide ${i + 1}: forbidden theme element "${selector}" is visible${txt ? ` — "${txt}"` : ''}`);
                                });
                            });
                            // Micron light title-slide checks. These target the
                            // accepted two-section title treatment: left copy,
                            // right official animated Micron icon, no divider,
                            // no circular/square frame, and readable vertical
                            // rhythm in the title copy.
                            if (cfg.micron_light_title_checks && isTitle) {
                                const shown = (el) => {
                                    if (!el) return false;
                                    const cs = getComputedStyle(el);
                                    const r = el.getBoundingClientRect();
                                    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05 && r.width > 1 && r.height > 1;
                                };
                                const alpha = (color) => {
                                    if (!color || color === 'transparent') return 0;
                                    const nums = (color.match(/\\d+(\\.\\d+)?/g) || []).map(Number);
                                    if (color.startsWith('rgba') && nums.length >= 4) return nums[3];
                                    return nums.length >= 3 ? 1 : 0;
                                };
                                const stage = s.querySelector(':scope > .slide-stage') || s;
                                const stageScaleRaw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stage-scale') || '1');
                                const toStagePx = (v) => stageScaleRaw > 0 && stageScaleRaw < 1 ? v / stageScaleRaw : v;
                                if (cfg.require_title_mesh_background) {
                                    const bgImage = getComputedStyle(stage).backgroundImage || '';
                                    const radialCount = (bgImage.match(/radial-gradient/gi) || []).length;
                                    if (radialCount < 4) {
                                        out.push(`slide ${i + 1}: micron-light cover needs a layered mesh-gradient background (${radialCount} radial gradients found, expected at least 4)`);
                                    }
                                }
                                const titleCopy = s.querySelector('.title-copy');
                                const titleVisual = s.querySelector('.title-visual');
                                const titleIcon = s.querySelector('.title-hero-icon, .title-visual video');
                                const titlePatternUsed = titleCopy || titleVisual || titleIcon;

                                if (titlePatternUsed) {
                                    if (!titleCopy || !titleVisual) {
                                        out.push(`slide ${i + 1}: micron-light cover two-section pattern needs both .title-copy and .title-visual`);
                                    } else if (shown(titleCopy) && shown(titleVisual)) {
                                        const copyNodes = Array.from(titleCopy.children).filter(shown);
                                        const visualNodes = Array.from(titleVisual.children).filter(shown);
                                        const copyRight = Math.max(...(copyNodes.length ? copyNodes : [titleCopy]).map((el) => el.getBoundingClientRect().right));
                                        const visualLeft = Math.min(...(visualNodes.length ? visualNodes : [titleVisual]).map((el) => el.getBoundingClientRect().left));
                                        if (copyRight + 8 > visualLeft) {
                                            out.push(`slide ${i + 1}: micron-light cover title copy overlaps or crosses the visual section`);
                                        }
                                    }
                                }

                                if (titleCopy && shown(titleCopy)) {
                                    const parts = [
                                        titleCopy.querySelector('.eyebrow, .kicker'),
                                        titleCopy.querySelector('h1'),
                                        titleCopy.querySelector('.subtitle'),
                                        titleCopy.querySelector('.title-meta')
                                    ].filter(shown);
                                    const minGap = typeof cfg.min_title_copy_gap_px === 'number' ? cfg.min_title_copy_gap_px : 24;
                                    for (let idx = 1; idx < parts.length; idx += 1) {
                                        const prev = parts[idx - 1].getBoundingClientRect();
                                        const next = parts[idx].getBoundingClientRect();
                                        const gap = toStagePx(next.top - prev.bottom);
                                        if (gap + 0.5 < minGap) {
                                            out.push(`slide ${i + 1}: micron-light cover title copy is vertically cramped (${gap.toFixed(1)}px < ${minGap}px)`);
                                            break;
                                        }
                                    }
                                }

                                const visibleNonLogoImages = Array.from(s.querySelectorAll('img')).filter((img) => {
                                    const src = img.getAttribute('src') || '';
                                    return shown(img) && !/micron-logo/i.test(src);
                                });
                                if ((titleVisual || titleIcon) && !shown(titleIcon) && visibleNonLogoImages.length === 0) {
                                    out.push(`slide ${i + 1}: micron-light cover visual section needs a specific image or official animated Micron icon`);
                                }

                                const checkDivider = (el, label) => {
                                    if (!el || !shown(el)) return;
                                    const cs = getComputedStyle(el);
                                    const sides = [
                                        ['left', cs.borderLeftWidth, cs.borderLeftColor],
                                        ['right', cs.borderRightWidth, cs.borderRightColor]
                                    ];
                                    sides.forEach(([side, width, color]) => {
                                        if (parseFloat(width || '0') > 0.5 && alpha(color) > 0.05) {
                                            out.push(`slide ${i + 1}: micron-light cover must not draw a divider between title and icon (${label} border-${side})`);
                                        }
                                    });
                                };
                                checkDivider(titleCopy, '.title-copy');
                                checkDivider(titleVisual, '.title-visual');

                                if (shown(titleIcon)) {
                                    const tag = titleIcon.tagName.toLowerCase();
                                    const src = titleIcon.getAttribute('src') || '';
                                    const videoPattern = cfg.title_icon_pattern ? new RegExp(cfg.title_icon_pattern, 'i') : null;
                                    const fallbackPattern = cfg.title_icon_fallback_pattern ? new RegExp(cfg.title_icon_fallback_pattern, 'i') : null;
                                    if (tag === 'video') {
                                        if (!/\\.mp4(\\?|#|$)/i.test(src)) {
                                            out.push(`slide ${i + 1}: micron-light cover title icon must use an MP4 source`);
                                        }
                                        if (videoPattern && !videoPattern.test(src)) {
                                            out.push(`slide ${i + 1}: micron-light cover title icon must come from Micron animated icon assets matching /${cfg.title_icon_pattern}/i`);
                                        }
                                    } else if (tag === 'img' && fallbackPattern) {
                                        if (!/\\.png(\\?|#|$)/i.test(src)) {
                                            out.push(`slide ${i + 1}: micron-light cover title fallback must use a transparent PNG source`);
                                        }
                                        if (!fallbackPattern.test(src)) {
                                            out.push(`slide ${i + 1}: micron-light cover title fallback must come from Micron transparent icon assets matching /${cfg.title_icon_fallback_pattern}/i`);
                                        }
                                    } else {
                                        out.push(`slide ${i + 1}: micron-light cover title icon should be an animated MP4 video or official transparent PNG fallback, not ${tag}`);
                                    }
                                    const iconRect = titleIcon.getBoundingClientRect();
                                    const minIcon = typeof cfg.min_title_icon_width_px === 'number' ? cfg.min_title_icon_width_px : 300;
                                    if (toStagePx(iconRect.width) + 0.5 < minIcon) {
                                        out.push(`slide ${i + 1}: micron-light cover title icon is too small (${toStagePx(iconRect.width).toFixed(1)}px < ${minIcon}px)`);
                                    }
                                    const stageRect = stage.getBoundingClientRect();
                                    const minRight = typeof cfg.min_title_icon_right_margin_px === 'number' ? cfg.min_title_icon_right_margin_px : 72;
                                    const rightMargin = toStagePx(stageRect.right - iconRect.right);
                                    if (rightMargin + 0.5 < minRight) {
                                        out.push(`slide ${i + 1}: micron-light cover title icon is too close to the right edge (${rightMargin.toFixed(1)}px < ${minRight}px)`);
                                    }

                                    const iconCs = getComputedStyle(titleIcon);
                                    const borderWidths = [iconCs.borderTopWidth, iconCs.borderRightWidth, iconCs.borderBottomWidth, iconCs.borderLeftWidth].some((w) => parseFloat(w || '0') > 0.5);
                                    const maxRadius = Math.max(...[iconCs.borderTopLeftRadius, iconCs.borderTopRightRadius, iconCs.borderBottomRightRadius, iconCs.borderBottomLeftRadius].map((v) => parseFloat(v || '0') || 0));
                                    if (maxRadius > 1) {
                                        out.push(`slide ${i + 1}: micron-light cover title icon must not use circular/rounded border treatment`);
                                    }
                                    if (borderWidths) {
                                        out.push(`slide ${i + 1}: micron-light cover title icon must not have a visible border`);
                                    }
                                    if (alpha(iconCs.backgroundColor) > 0.05) {
                                        out.push(`slide ${i + 1}: micron-light cover title icon must not sit in a square background`);
                                    }
                                    if (iconCs.boxShadow && iconCs.boxShadow !== 'none') {
                                        out.push(`slide ${i + 1}: micron-light cover title icon must not use a box shadow`);
                                    }
                                    if (iconCs.filter && iconCs.filter !== 'none') {
                                        out.push(`slide ${i + 1}: micron-light cover title icon must not use filter/drop-shadow effects`);
                                    }
                                    if (tag === 'video' && iconCs.mixBlendMode === 'normal') {
                                        out.push(`slide ${i + 1}: micron-light cover title MP4 should use mix-blend-mode:multiply so no square box appears`);
                                    }

                                    const wrapper = titleVisual || titleIcon.parentElement;
                                    if (wrapper && shown(wrapper)) {
                                        const wcs = getComputedStyle(wrapper);
                                        const wrapperBorder = [wcs.borderTopWidth, wcs.borderRightWidth, wcs.borderBottomWidth, wcs.borderLeftWidth].some((w) => parseFloat(w || '0') > 0.5);
                                        if (wrapperBorder || alpha(wcs.backgroundColor) > 0.05 || (wcs.boxShadow && wcs.boxShadow !== 'none')) {
                                            out.push(`slide ${i + 1}: micron-light cover title visual must not be framed as a card, circle, or square box`);
                                        }
                                    }
                                }
                            }
                            if (cfg.require_title_animated_icon && isTitle) {
                                const shown = (el) => {
                                    if (!el) return false;
                                    const cs = getComputedStyle(el);
                                    const r = el.getBoundingClientRect();
                                    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05 && r.width > 1 && r.height > 1;
                                };
                                if (cfg.require_title_template_selector) {
                                    const requiredTemplate = s.querySelector(cfg.require_title_template_selector);
                                    if (!shown(requiredTemplate)) {
                                        out.push(`slide ${i + 1}: title slide must use required template selector ${cfg.require_title_template_selector}`);
                                    } else if (cfg.require_title_shader_ready && requiredTemplate.dataset.titleShaderReady !== 'true') {
                                        out.push(`slide ${i + 1}: title slide must initialize the required Three.js title shader, not just a static fallback`);
                                    }
                                }
                                const pattern = cfg.title_icon_pattern ? new RegExp(cfg.title_icon_pattern, 'i') : null;
                                const visual = cfg.title_visual_selector ? s.querySelector(cfg.title_visual_selector) : null;
                                const hasTemplateVisual = shown(visual);
                                const videos = Array.from(s.querySelectorAll('video')).filter(shown);
                                if (videos.length === 0 && !hasTemplateVisual) {
                                    out.push(`slide ${i + 1}: title slide needs one visible official animated Micron icon or approved title template visual`);
                                } else if (pattern && !videos.some((video) => pattern.test(video.getAttribute('src') || ''))) {
                                    if (!hasTemplateVisual) {
                                        out.push(`slide ${i + 1}: title animated icon must match /${cfg.title_icon_pattern}/i`);
                                    }
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
                            if (cfg.forbid_visible_accent_rgb) {
                                const forbidden = cfg.forbid_visible_accent_rgb;
                                const forbiddenName = cfg.forbid_visible_accent_name || forbidden;
                                const hasForbidden = (v) => v && v.toLowerCase().includes(forbidden);
                                const shown = (el) => {
                                    const cs = getComputedStyle(el);
                                    const r = el.getBoundingClientRect();
                                    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05 && r.width > 1 && r.height > 1;
                                };
                                const offenders = [];
                                s.querySelectorAll('*').forEach((el) => {
                                    if (!shown(el)) return;
                                    if (el.closest('.title-slide')) return;
                                    const cs = getComputedStyle(el);
                                    const parentColor = el.parentElement ? getComputedStyle(el.parentElement).color : '';
                                    const colorHit = hasForbidden(cs.color) && cs.color !== parentColor;
                                    const surfaceHit = [cs.backgroundColor, cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor, cs.outlineColor, cs.fill, cs.stroke]
                                        .some(hasForbidden);
                                    if (colorHit || surfaceHit) offenders.push(el);
                                });
                                if (offenders.length) {
                                    out.push(`slide ${i + 1}: ${forbiddenName} used as visible accent (${offenders.length} elements); use Micron purple for active/highlight states`);
                                }
                            }
                            // Chart-on-gradient
                            if (cfg.forbid_chart_on_gradient) {
                                if (isTitle) return;
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
                            if (cfg.min_touch_target_px) {
                                const r = el.getBoundingClientRect();
                                const stage = el.closest('.slide-stage');
                                const stageScale = stage ? parseFloat(getComputedStyle(document.body).getPropertyValue('--stage-scale') || '1') : 1;
                                const width = stage && stageScale > 0 && stageScale < 1 ? r.width / stageScale : r.width;
                                const height = stage && stageScale > 0 && stageScale < 1 ? r.height / stageScale : r.height;
                                if (width > 0 && height > 0 && (width < cfg.min_touch_target_px || height < cfg.min_touch_target_px)) {
                                    out.push(`interactive element <${el.tagName.toLowerCase()}> touch target too small (${Math.round(width)}x${Math.round(height)}px < ${cfg.min_touch_target_px}x${cfg.min_touch_target_px}px)`);
                                }
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
                        // 3. Fixed-stage themes must use the fixed wrapper
                        // and keep the declared design size.
                        if (cfg.require_fixed_stage) {
                            slides.forEach((s, i) => {
                                const stage = s.querySelector(':scope > .slide-stage');
                                if (!stage) {
                                    out.push(`slide ${i + 1}: missing .slide-stage wrapper`);
                                    return;
                                }
                                const cs = getComputedStyle(stage);
                                const rawW = Math.round(parseFloat(cs.width || '0'));
                                const rawH = Math.round(parseFloat(cs.height || '0'));
                                if (cfg.stage_width && rawW !== cfg.stage_width) {
                                    out.push(`slide ${i + 1}: .slide-stage width ${rawW}px does not match configured ${cfg.stage_width}px`);
                                }
                                if (cfg.stage_height && rawH !== cfg.stage_height) {
                                    out.push(`slide ${i + 1}: .slide-stage height ${rawH}px does not match configured ${cfg.stage_height}px`);
                                }
                            });
                        }
                        // 4. Readability floor for audience-facing text.
                        // Small chrome is allowed; meaningful slide copy is not.
                        // Skip narrow/mobile viewport lints: mobile is checked
                        // for overflow and overlap, while presentation-room
                        // readability is judged at desktop/stage sizes.
                        if (!cfg.viewport_width || cfg.viewport_width >= 900) {
                        const chromeSelector = [
                            '.nav-dots', '.progress-bar', '.present-toggle', '#overview',
                            '.footer', '.work-footer', '.slide-coord', '.section-label', '.sidebar',
                            '.kicker', '.eyebrow', '.num',
                            '.md-title-note', '.md-title-number', '.md-title-brand',
                            '.screen-topbar', '.screen-dots', '.screen-kpi span',
                            '.screen-node', '.screen-table', '[aria-hidden="true"]'
                        ].join(',');
                        const textOf = (node) => (node.textContent || '').replace(/\\s+/g, ' ').trim();
                        const isVisible = (el) => {
                            const cs = getComputedStyle(el);
                            const r = el.getBoundingClientRect();
                            return cs.display !== 'none' && cs.visibility !== 'hidden' &&
                                parseFloat(cs.opacity || '1') > 0.05 && r.width > 0 && r.height > 0;
                        };
                        slides.forEach((s, i) => {
                            const small = [];
                            const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT, {
                                acceptNode(node) {
                                    const text = textOf(node);
                                    if (text.length < 2) return NodeFilter.FILTER_REJECT;
                                    const el = node.parentElement;
                                    if (!el || el.closest(chromeSelector) || !isVisible(el)) return NodeFilter.FILTER_REJECT;
                                    if (el.children && Array.from(el.children).some((child) => textOf(child).length > 1 && isVisible(child))) {
                                        return NodeFilter.FILTER_REJECT;
                                    }
                                    return NodeFilter.FILTER_ACCEPT;
                                }
                            });
                            const seenTextHosts = new Set();
                            while (walker.nextNode()) {
                                const el = walker.currentNode.parentElement;
                                if (!el || seenTextHosts.has(el)) continue;
                                seenTextHosts.add(el);
                                const cs = getComputedStyle(el);
                                let fontSize = parseFloat(cs.fontSize || '0');
                                const stage = el.closest('.slide-stage');
                                const stageScale = stage ? parseFloat(getComputedStyle(document.body).getPropertyValue('--stage-scale') || '1') : 1;
                                if (stage && stageScale > 0 && stageScale < 1) {
                                    fontSize = fontSize / stageScale;
                                }
                                const text = textOf(el);
                                const min = el.matches('h1, h2') ? 60 :
                                    el.matches('h3') ? ((text.length <= 18 || text === text.toUpperCase()) ? 20 : 24) :
                                    el.matches('p, li, td, th, blockquote, code, pre') ? 24 :
                                    20;
                                if (fontSize > 0 && fontSize < min) {
                                    small.push(`${text.slice(0, 48)} (${fontSize.toFixed(1)}px < ${min}px)`);
                                }
                            }
                            if (small.length) {
                                const shown = small.slice(0, 6).join('; ');
                                const more = small.length > 6 ? `; +${small.length - 6} more` : '';
                                out.push(`slide ${i + 1}: text below readability floor — ${shown}${more}`);
                            }
                        });
                        }
                        return out;
                    }""",
                    eval_config,
                )
                # Dedupe universal lints across viewports
                seen = set()
                for issue in brand_issues:
                    key = issue
                    if key in seen:
                        continue
                    seen.add(key)
                    if issue.startswith("NOTE:"):
                        note = issue[len("NOTE:"):].strip()
                        if note not in notes_seen:
                            notes_seen.add(note)
                            notes.append(note)
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
                        const hashTarget = '#/' + (index + 1);
                        if (location.hash !== hashTarget) {
                            history.replaceState(null, '', hashTarget);
                            window.dispatchEvent(new HashChangeEvent('hashchange'));
                        }
                        if (window.presentation?.goTo) {
                            window.presentation.goTo(index, { immediate: true });
                        } else {
                            document.querySelectorAll('.deck > .slide, body > .slide')[index]?.scrollIntoView({ behavior: 'instant', block: 'start' });
                        }
                    }""",
                    index,
                )
                page.wait_for_timeout(1500)
                issues = page.evaluate(
                    """({ index, cfg }) => {
                        const allSlides = Array.from(document.querySelectorAll('.deck > .slide, body > .slide'));
                        const slide = allSlides[index];
                        if (!slide) return ['missing slide'];
                        const stage = slide.querySelector(':scope > .slide-stage');
                        const content = stage || slide.querySelector('.slide-content') || slide;
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
                        if (cfg.enforce_stage_overflow && stage) {
                            const stageRect = stage.getBoundingClientRect();
                            const stageStyle = getComputedStyle(stage);
                            // scrollHeight can include internal margins even
                            // when no rendered child escapes the fixed stage.
                            // Keep it as a coarse guard, and rely on the
                            // child-rect check below for exact visual overflow.
                            if (stage.scrollWidth > stage.clientWidth + 24) out.push(`stage horizontal scroll overflow (${stage.scrollWidth}px > ${stage.clientWidth}px)`);
                            if (stage.scrollHeight > stage.clientHeight + 24) out.push(`stage vertical scroll overflow (${stage.scrollHeight}px > ${stage.clientHeight}px)`);
                            if (stageStyle.overflow !== 'hidden') out.push(`stage overflow must be hidden, got ${stageStyle.overflow}`);
                            const ignore = '.nav-dots, .progress-bar, .presentation-hotspot, .present-toggle, .overview, [aria-hidden="true"]';
                            const nodes = Array.from(stage.querySelectorAll('*')).filter((el) => {
                                if (el.closest(ignore)) return false;
                                const cs = getComputedStyle(el);
                                const r = el.getBoundingClientRect();
                                return cs.display !== 'none' && cs.visibility !== 'hidden' &&
                                    parseFloat(cs.opacity || '1') > 0.05 && r.width > 0 && r.height > 0;
                            });
                            const offenders = [];
                            for (const el of nodes) {
                                const r = el.getBoundingClientRect();
                                if (r.left < stageRect.left - 2 || r.right > stageRect.right + 2 ||
                                    r.top < stageRect.top - 2 || r.bottom > stageRect.bottom + 2) {
                                    const label = (el.textContent || el.className || el.tagName).toString().replace(/\\s+/g, ' ').trim().slice(0, 42);
                                    offenders.push(`${el.tagName.toLowerCase()} "${label}"`);
                                }
                                if (offenders.length >= 6) break;
                            }
                            if (offenders.length) out.push(`stage child visual overflow: ${offenders.join('; ')}`);
                        }
                        return out;
                    }""",
                    {"index": index, "cfg": verify_config},
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
                    thumb_count = page.locator("#overview .ov-thumb").count()
                    if not is_visible:
                        page_errors.append("ESC did not open #overview.")
                    if slide_count and card_count != slide_count:
                        page_errors.append(f"Overview card count mismatch: {card_count} for {slide_count} slides.")
                    if slide_count and thumb_count != slide_count:
                        page_errors.append(f"Overview thumbnail count mismatch: {thumb_count} for {slide_count} slides.")
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
