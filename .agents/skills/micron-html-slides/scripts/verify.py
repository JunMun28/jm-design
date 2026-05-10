#!/usr/bin/env python3
"""Verify an HTML slide deck with Playwright screenshots and DOM checks."""

import argparse
import sys
from pathlib import Path


def parse_viewport(value):
    width, height = value.split("x")
    return {"width": int(width), "height": int(height)}


def verify_html(html_path, viewports, slides, output_dir, show, wait, check_overview, fail_on_warnings):
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

    output_dir = Path(output_dir) if output_dir else html_path.parent / "screenshots"
    output_dir.mkdir(parents=True, exist_ok=True)

    console_issues = []
    page_errors = []

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
                page.wait_for_timeout(250)
                issues = page.evaluate(
                    """index => {
                        const slide = document.querySelectorAll('.slide')[index];
                        if (!slide) return ['missing slide'];
                        const content = slide.querySelector('.slide-content') || slide;
                        const out = [];
                        if (content.scrollHeight > content.clientHeight + 2) out.push('vertical overflow');
                        if (content.scrollWidth > content.clientWidth + 2) out.push('horizontal overflow');
                        const rect = slide.getBoundingClientRect();
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

    warning_failure = fail_on_warnings and any(issue.startswith("[warning]") for issue in console_issues)
    error_failure = any(issue.startswith("[error]") for issue in console_issues)
    return 1 if page_errors or error_failure or warning_failure else 0


def main():
    parser = argparse.ArgumentParser(description="Verify HTML slide deck rendering.")
    parser.add_argument("html_path")
    parser.add_argument("--viewports", default="1280x720,375x667")
    parser.add_argument("--slides", type=int, default=0)
    parser.add_argument("--output", default=None)
    parser.add_argument("--show", action="store_true")
    parser.add_argument("--wait", type=int, default=1200)
    parser.add_argument("--check-overview", action="store_true")
    parser.add_argument("--fail-on-warnings", action="store_true")
    args = parser.parse_args()

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
    )


if __name__ == "__main__":
    sys.exit(main())
