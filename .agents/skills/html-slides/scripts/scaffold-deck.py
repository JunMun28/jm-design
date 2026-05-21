#!/usr/bin/env python3
"""Create a small, verifiable HTML slide deck for any stable html-slides theme.

The scaffold is intentionally conservative: title slide first, three content
slides, canonical navigation, ESC overview, reduced-motion support, and the
theme tokens required by `themes/themes.json`.

For micron-dark-executive it emits the single approved photo title template and copies
the theme-owned photo asset into the generated deck assets.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = SKILL_ROOT / "themes" / "themes.json"
SHARED_ASSETS = SKILL_ROOT / "themes" / "_shared"
MICRON_DARK_EXECUTIVE_ASSETS = SKILL_ROOT / "themes" / "micron-dark-executive" / "assets"
MICRON_ICONS_ASSETS = SKILL_ROOT.parent / "micron-icons" / "assets"
SILK_WAVE_PURPLE_TEMPLATE = SKILL_ROOT / "themes" / "micron-dark" / "title-templates" / "silk-wave-purple.html"


THEME_CSS = {
    "micron-dark-executive": """
:root{--micron-black:#000;--micron-white:#fff;--micron-accent:#bd03f7;--font-display:"Micron Basis",Arial,sans-serif;--font-body:var(--font-display);--font-mono:ui-monospace,Menlo,monospace;--scale-ratio:1.333;--col-count:12;--bg:#000;--ink:#fff;--muted:#bfbfbf;--accent:var(--micron-accent);--panel:#121212;--line:rgba(255,255,255,.16);--stage:#000}
body{background:#000;color:var(--ink);font-family:var(--font-body)}
.slide{background:var(--stage)}
.slide:not(.title-slide)::after{content:"MICRON";position:absolute;right:38px;bottom:28px;color:rgba(255,255,255,.72);font:800 13px/1 var(--font-mono);letter-spacing:.18em}
.footer{display:none}
.panel{background:rgba(255,255,255,.06);border:1px solid var(--line)}
.title-slide{isolation:isolate;background:#000}
.title-slide .slide-content{z-index:3}
.md-title-brand{position:absolute;top:46px;left:clamp(24px,6vw,88px);z-index:4;width:126px;height:auto;opacity:.94}
.md-title-note{position:absolute;left:clamp(24px,6vw,88px);bottom:30px;z-index:4;color:rgba(255,255,255,.46);font-size:14px}
.md-title-number{position:absolute;right:34px;bottom:28px;z-index:4;color:rgba(255,255,255,.45);font:14px/1 var(--font-mono);letter-spacing:.04em}
.md-title-content{position:relative;z-index:3;max-width:690px}
.md-title-content .kicker{color:#bfbfbf;font-size:24px;font-weight:800;line-height:1;margin-bottom:24px}
.md-title-content h1{max-width:10.5ch}
.md-title-content .subtitle{max-width:650px;color:#e6e6e6;font-size:clamp(24px,2.2vw,30px);margin-top:26px}
.md-accent-line{display:none}
.title-photo .slide-stage,.title-photo .slide-content{background:#000}
.md-title-hero-image{position:absolute;inset:0 0 0 auto;width:68%;height:100%;object-fit:cover;object-position:84% center;z-index:1;opacity:.82;filter:saturate(1.08) contrast(1.08);pointer-events:none}
.title-photo .slide-content::before{content:"";position:absolute;inset:0;z-index:2;background:linear-gradient(90deg,#000 0%,rgba(0,0,0,.98) 30%,rgba(0,0,0,.74) 48%,rgba(0,0,0,.18) 72%,rgba(0,0,0,.05))}
.title-photo .md-title-brand,.title-photo .md-title-content,.title-photo .md-title-note,.title-photo .md-title-number{z-index:4}
""",
    "micron-dark": """
:root{--micron-black:#000;--micron-white:#fff;--micron-accent:#bd03f7;--micron-cyan:#32c8ff;--micron-blue:#2044ff;--micron-warm:#ff9f1a;--micron-rose:#f43163;--font-display:"Micron Basis",Arial,sans-serif;--font-body:var(--font-display);--font-mono:ui-monospace,Menlo,monospace;--scale-ratio:1.333;--col-count:12;--bg:#000;--ink:#fff;--muted:#bfbfbf;--accent:var(--micron-accent);--panel:#101010;--line:rgba(255,255,255,.14);--stage:#050505}
body{background:#050505;color:var(--ink);font-family:var(--font-body)}
.slide{background:var(--stage)}
.slide:not(.title-slide)::after{content:"MICRON";position:absolute;right:38px;bottom:28px;color:rgba(255,255,255,.72);font:800 13px/1 var(--font-mono);letter-spacing:.18em}
.footer{display:none}
.panel{background:transparent;border:0;border-top:1px solid var(--line);border-radius:0;box-shadow:none}
.editorial-ops-title{background:#010101}
.editorial-ops-title::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.58;background:radial-gradient(circle at 72% 46%,rgba(189,3,247,.12),transparent 27%)}
.editorial-ops-title::after{content:"";position:absolute;inset:84px 64px 190px;z-index:0;pointer-events:none;border-top:1px solid rgba(255,255,255,.18);border-bottom:1px solid rgba(255,255,255,.16);opacity:.5}
.editorial-ops-title .slide-content{position:relative;z-index:2;justify-content:flex-start;padding:50px 56px 138px}
.ops-meta{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;margin-bottom:clamp(24px,3.5vw,44px);padding:14px 0;border-top:1px solid rgba(255,255,255,.20);border-bottom:1px solid rgba(255,255,255,.22);font:700 20px/1 var(--font-mono);letter-spacing:.10em;text-transform:uppercase;color:var(--muted)}
.editorial-spread{display:grid;grid-template-columns:minmax(0,.82fr) minmax(240px,.92fr);gap:clamp(36px,6vw,80px);align-items:center}
.editorial-copy h1{font-size:clamp(48px,5.7vw,74px);line-height:.92;max-width:10ch;text-shadow:0 8px 24px rgba(255,255,255,.10)}
.editorial-copy .subtitle{margin-top:18px;max-width:24ch;color:#fff;font-size:24px;line-height:1.2}
.ops-note{margin-top:18px;max-width:30ch;color:var(--muted);font-size:24px}
.ops-note::before{content:"";display:block;width:48px;height:3px;margin-bottom:18px;background:var(--accent)}
.editorial-rule{display:none}
.section-label{display:inline-flex;align-items:center;gap:10px;width:max-content;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.2);font:700 24px/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.section-label::before{content:"";width:8px;height:8px;background:var(--accent)}
.metric-strip{position:absolute;left:44px;right:44px;bottom:24px;z-index:3;display:grid;grid-template-columns:.72fr .82fr .72fr 1.74fr;gap:0;padding:14px 42px 16px;border:1px solid rgba(255,255,255,.18);border-bottom-color:rgba(189,3,247,.42);background:rgba(3,6,10,.48);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.editorial-ops-title .metric-strip.reveal{transform:none}
.metric{border-top:0;padding-top:0}
.metric+.metric{border-left:1px solid rgba(255,255,255,.28);padding-left:52px}
.metric b{display:block;font-size:clamp(32px,3vw,46px);line-height:1;color:#fff}
.metric span{display:block;margin-top:8px;font:700 20px/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.metric:last-child b{font-size:clamp(24px,2.25vw,32px);white-space:nowrap}
.icon-slot{--signal-label:"Operating signal";--signal-shell-size:min(330px,90%);display:grid;place-items:center;min-height:340px;position:relative;overflow:visible;background:transparent;border:0}
.icon-slot::before{content:"";position:absolute;width:var(--signal-shell-size);aspect-ratio:1;border-radius:50%;border:1px dotted rgba(255,255,255,.24);box-shadow:inset 0 0 0 20px rgba(115,118,140,.13),inset 0 0 0 44px rgba(0,0,0,.52)}
.icon-slot::after{content:var(--signal-label);position:absolute;left:50%;bottom:16px;transform:translateX(-50%);min-width:260px;padding:9px 16px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.38);font:700 18px/1 var(--font-mono);letter-spacing:.24em;text-align:center;text-transform:uppercase;color:#ff8cff}
.icon-slot:has(.micron-icon-video)::before{display:none}
.icon-slot:has(.micron-icon-video)::after{display:none}
.micron-icon-video{display:block;width:min(78%,420px);height:min(78%,420px);object-fit:contain;background:transparent;mix-blend-mode:screen;filter:brightness(1.12) contrast(1.08) saturate(1.08)}
.signal-layout{display:grid;grid-template-columns:.82fr 1.18fr;gap:64px;align-items:end}
.big-metric{font-size:clamp(86px,11vw,140px);line-height:.82;letter-spacing:-.06em;font-weight:800;color:var(--accent)}
.slide[data-slide-kind="evidence"] h2{font-size:52px;max-width:18ch}
.evidence-board{display:grid;gap:0;border-top:1px solid var(--line)}
.evidence-row{display:grid;grid-template-columns:110px minmax(0,1fr) 86px;gap:18px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line);background:transparent}
.evidence-row b{font-size:28px;color:#fff}
.evidence-row span{font:700 20px/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.evidence-row strong{font:700 24px/1 var(--font-mono);text-align:right;color:#fff}
.evidence-row.active{border-bottom-color:rgba(255,140,255,.56)}
.title-silk-purple .slide-stage{background:#000;isolation:isolate}
.title-silk-purple .slide-content{position:relative;z-index:2;justify-content:center;padding:96px}
.title-silk-purple .slide-content::before{content:"";position:absolute;inset:-2px -220px -2px -80px;z-index:0;background:radial-gradient(ellipse at 78% 48%,rgba(189,3,247,.80),transparent 28%),radial-gradient(ellipse at 92% 34%,rgba(189,3,247,.55),transparent 36%),repeating-linear-gradient(124deg,rgba(255,255,255,.09) 0 1px,transparent 1px 24px);filter:saturate(1.15);pointer-events:none}
.title-silk-purple .slide-content::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.90) 0%,rgba(0,0,0,.48) 40%,rgba(0,0,0,.02) 100%),radial-gradient(circle at 76% 52%,transparent 0 44%,rgba(0,0,0,.16) 88%)}
.title-silk-purple .md-silk-wave{position:absolute;inset:-2px -260px -2px -80px;overflow:hidden;z-index:0;transform:scale(1.1);transform-origin:center}
.title-silk-purple .md-silk-canvas-purple{width:100%;height:100%;display:block}
.title-silk-purple .md-title-brand{position:absolute;top:46px;left:96px;z-index:5;width:126px;height:auto;opacity:.94}
.title-silk-purple .md-title-content{position:relative;z-index:4;max-width:820px}
.title-silk-purple .md-title-content .kicker{color:#BD03F7;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:17px;margin-bottom:16px}
.title-silk-purple .md-title-content h1{font-size:72px;line-height:1.02;font-weight:800;max-width:760px;color:#fff}
.title-silk-purple .md-title-content .subtitle{font-size:24px;line-height:1.35;color:#e6e6e6;max-width:760px;margin-top:18px}
.title-silk-purple .md-accent-line{width:84px;height:7px;background:#BD03F7;border-radius:999px;margin-top:28px;box-shadow:0 0 22px rgba(168,85,247,.42)}
.title-silk-purple .md-title-note{position:absolute;left:96px;bottom:38px;z-index:5;font-size:15px;color:#8c8c8c}
.title-silk-purple .md-title-number{position:absolute;right:34px;bottom:28px;z-index:5;font-size:13px;color:rgba(255,255,255,.45);letter-spacing:.04em;font-family:var(--font-mono)}
@media (max-width:760px){.editorial-ops-title .slide-content{padding:32px 22px 40px}.ops-meta{display:block;font-size:13px;margin-bottom:28px}.ops-meta span+span{display:block;margin-top:10px}.editorial-spread,.signal-layout{display:block}.section-label{font-size:20px}.icon-slot{display:none}.editorial-copy h1{font-size:46px;max-width:8ch}.editorial-copy .subtitle{font-size:22px;max-width:16ch}.ops-note{font-size:18px}.metric-strip{display:none}.big-metric{font-size:78px}.slide[data-slide-kind="evidence"] h2{font-size:42px}.evidence-row{grid-template-columns:82px minmax(0,1fr) 70px;padding:14px 0}.evidence-row b{font-size:20px}}
""",
    "micron-light": """
:root{--micron-black:#000;--micron-white:#fff;--micron-accent:#bd03f7;--font-display:"Micron Basis",Arial,sans-serif;--font-body:var(--font-display);--font-mono:ui-monospace,Menlo,monospace;--scale-ratio:1.333;--col-count:12;--bg:#fff;--ink:#0f172a;--muted:#475569;--accent:var(--micron-accent);--panel:#fff;--line:#d0d7de;--stage:#fff}
body{background:#eef0f4;color:var(--ink);font-family:var(--font-body)}
.slide{background:var(--stage)}
.title-slide{overflow:hidden;background:
radial-gradient(circle at 8% 18%,rgba(255,255,255,.98) 0 20%,transparent 42%),
radial-gradient(circle at 78% 18%,color-mix(in srgb,#d98cff 26%,transparent) 0 13%,transparent 36%),
radial-gradient(circle at 84% 46%,color-mix(in srgb,var(--micron-accent) 18%,transparent) 0 18%,transparent 46%),
radial-gradient(circle at 94% 72%,rgba(255,255,255,.62) 0 18%,transparent 44%),
radial-gradient(circle at 18% 94%,color-mix(in srgb,var(--micron-accent) 7%,transparent) 0 15%,transparent 38%),
var(--stage)}
.title-slide::before,.title-slide::after{content:"";position:absolute;z-index:0;pointer-events:none;background-image:radial-gradient(circle,color-mix(in srgb,var(--micron-accent) 28%,transparent) 0 2px,transparent 2.5px);background-size:17px 17px}
.title-slide::before{top:-36px;right:-18px;width:420px;height:220px;opacity:.62;-webkit-mask-image:radial-gradient(ellipse at top right,#000 0 42%,transparent 72%);mask-image:radial-gradient(ellipse at top right,#000 0 42%,transparent 72%)}
.title-slide::after{left:-36px;bottom:0;width:270px;height:270px;opacity:.58;-webkit-mask-image:radial-gradient(ellipse at bottom left,#000 0 46%,transparent 74%);mask-image:radial-gradient(ellipse at bottom left,#000 0 46%,transparent 74%)}
.title-slide .slide-content{position:relative;z-index:1}
.kicker{color:var(--micron-accent)}
.slide:not(.title-slide)::after{content:"MICRON";position:absolute;right:38px;bottom:28px;color:rgba(15,23,42,.56);font:800 13px/1 var(--font-mono);letter-spacing:.18em}
.panel{background:#fff;border:1px solid color-mix(in srgb,var(--micron-accent) 22%,var(--line));box-shadow:inset 0 4px 0 color-mix(in srgb,var(--micron-accent) 55%,transparent)}
""",
    "guided-learning": """
:root{--micron-black:#000;--micron-white:#fff;--micron-accent:#bd03f7;--micron-cyan:#32c8ff;--font-display:"Micron Basis",Arial,sans-serif;--font-body:var(--font-display);--font-mono:ui-monospace,Menlo,monospace;--scale-ratio:1.333;--col-count:12;--bg:#f5eff7;--surface:#fffaff;--surface-2:#f2edf4;--text-1:#1f1b22;--text-2:#63596a;--ink:var(--text-1);--muted:var(--text-2);--accent:var(--micron-accent);--panel:var(--surface-2);--line:rgba(31,27,34,.14);--stage:var(--surface)}
body{background:#e6dfe8;color:var(--ink);font-family:var(--font-body)}
.slide{background:linear-gradient(90deg,rgba(50,200,255,.10),transparent 24%),var(--stage)}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:22px;box-shadow:0 18px 48px rgba(49,32,56,.09)}
""",
    "playful": """
:root{--bg:#fff8e7;--ink:#2b2118;--ink-muted:#6b5e51;--accent:#ff6b6b;--accent-2:#4ecdc4;--accent-3:#ffe66d;--accent-4:#6c5ce7;--font-display:Georgia,"Times New Roman",serif;--font-body:Arial,sans-serif;--panel:#fff8e7;--line:var(--ink);--muted:var(--ink-muted);--stage:var(--bg)}
body{background:var(--bg);color:var(--ink);font-family:var(--font-body)}
.slide{background:radial-gradient(circle at 88% 18%,var(--accent-3),transparent 16%),var(--stage)}
.panel{background:var(--panel);border:2px solid var(--line);box-shadow:0 6px 0 var(--ink);border-radius:20px}
h1,h2{font-family:var(--font-display)}
html[data-theme="playful"] .board-kpi span,
html[data-theme="playful"] .driver span,
html[data-theme="playful"] .decision-item span{font-size:21px!important}
""",
}


BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow-x:hidden}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
html,body,#overview{scrollbar-width:none;-ms-overflow-style:none}
html::-webkit-scrollbar,body::-webkit-scrollbar,#overview::-webkit-scrollbar{display:none;width:0;height:0}
body{font-size:clamp(18px,1.7vw,24px);line-height:1.45}
.deck{width:100vw}
.slide{width:100vw;height:100vh;height:100dvh;overflow:hidden;scroll-snap-align:start;position:relative;display:flex;flex-direction:column}
.slide-content{flex:1;display:flex;flex-direction:column;justify-content:center;gap:clamp(14px,1.5vw,24px);padding:clamp(24px,5vw,64px);max-height:100%;overflow:hidden}
.kicker{font-family:var(--font-mono);font-size:clamp(14px,1.2vw,18px);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
h1,h2{font-family:var(--font-display);font-size:clamp(42px,8vw,108px);line-height:.98;letter-spacing:-.025em;color:var(--ink);max-width:12ch}
h2{font-size:clamp(32px,4.5vw,60px);max-width:15ch}
h3{font-size:clamp(20px,2.4vw,34px);line-height:1.08;color:var(--ink)}
p,li{color:var(--muted);max-width:64ch;font-size:24px}
.accent{color:var(--accent)}
.title-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(180px,.85fr);gap:clamp(24px,5vw,72px);align-items:center}
.mark{aspect-ratio:1;border:1px solid var(--line);display:grid;place-items:center;font:900 clamp(42px,8vw,108px)/1 var(--font-display);color:var(--accent);background:var(--panel)}
.subtitle{font-size:clamp(20px,2.2vw,32px);color:var(--muted)}
.rule{height:1px;background:var(--line);width:100%}
.two-col{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(18px,3vw,44px);align-items:stretch}
.panel{padding:clamp(18px,3vw,36px);border-radius:12px}
.panel p{margin-top:12px}
.steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(14px,2vw,28px)}
.num{font-family:var(--font-mono);font-size:20px;letter-spacing:.1em;color:var(--accent);margin-bottom:20px}
.rows{display:grid;gap:0;border-top:1px solid var(--line)}
.row{display:grid;grid-template-columns:96px minmax(0,1fr) minmax(0,1.15fr);gap:20px;align-items:baseline;padding:18px 0;border-bottom:1px solid var(--line)}
.row b{color:var(--ink);font-size:24px}
.row span:first-child{font-family:var(--font-mono);font-size:20px;color:var(--accent)}
.board-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.board-kpi{padding:22px;border:1px solid var(--line);background:var(--panel)}
.board-kpi b{display:block;color:var(--ink);font-size:clamp(34px,4vw,58px);line-height:1}
.board-kpi span{display:block;margin-top:10px;color:var(--muted);font:700 20px/1.1 var(--font-mono)!important;letter-spacing:.04em;text-transform:uppercase}
.driver-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:32px;align-items:stretch}
.driver-list{display:grid;gap:0;border-top:1px solid var(--line)}
.driver{display:grid;grid-template-columns:88px 1fr auto;gap:18px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
.driver span{font:700 20px/1 var(--font-mono)!important;color:var(--accent)}
.driver b{color:var(--ink);font-size:24px}
.driver em{font-style:normal;color:var(--muted);font-size:22px}
.driver.active{background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 13%,transparent),transparent 76%)}
.mini-chart{min-height:240px;display:flex;align-items:end;gap:16px;padding:24px;border:1px solid var(--line);background:var(--panel)}
.bar{flex:1;min-height:36px;background:color-mix(in srgb,var(--accent) 45%,var(--panel));position:relative}
html[data-theme="micron-dark-executive"] .driver-grid{padding:22px;border:1px solid rgba(189,3,247,.42);background:#121212;gap:22px}
html[data-theme="micron-dark-executive"] .driver-list{border-top-color:rgba(255,255,255,.18)}
html[data-theme="micron-dark-executive"] .driver{border-bottom-color:rgba(255,255,255,.14)}
html[data-theme="micron-dark-executive"] .driver span{color:#bfbfbf}
html[data-theme="micron-dark-executive"] .driver.active{background:rgba(255,255,255,.06);box-shadow:inset 4px 0 0 #bd03f7}
html[data-theme="micron-dark-executive"] .mini-chart{border-color:rgba(189,3,247,.42);background:#121212}
html[data-theme="micron-dark-executive"] .bar{background:#6f6f6f;box-shadow:none}
html[data-theme="micron-dark-executive"] .bar:nth-child(4){background:#bd03f7;box-shadow:0 0 20px rgba(189,3,247,.26)}
.bar:nth-child(1){height:58%}.bar:nth-child(2){height:72%}.bar:nth-child(3){height:46%}.bar:nth-child(4){height:82%}.bar:nth-child(5){height:64%}
.bar::after{content:attr(data-label);position:absolute;left:50%;bottom:-30px;transform:translateX(-50%);font:700 20px/1 var(--font-mono);color:var(--muted)}
.plan-lanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.lane{padding:20px;border:1px solid var(--line);background:var(--panel)}
.lane .num{margin-bottom:14px}
.lane ul{list-style:none;display:grid;gap:8px;margin-top:14px}
.lane li{font-size:24px;color:var(--muted);padding-top:8px;border-top:1px solid var(--line)}
.risk-matrix{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.risk{padding:24px;border:1px solid var(--line);background:var(--panel)}
.risk strong{display:block;color:var(--ink);font-size:26px;margin-bottom:10px}
.decision-board{display:grid;gap:0;border-top:1px solid var(--line)}
.decision-item{display:grid;grid-template-columns:170px 1fr 160px;gap:18px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line)}
.decision-item span{font:800 20px/1 var(--font-mono)!important;letter-spacing:.04em;color:var(--accent);text-transform:uppercase}
.decision-item b{color:var(--ink);font-size:25px}
.decision-item em{font-style:normal;color:var(--muted);font-size:22px;text-align:right}
.footer{position:absolute;left:clamp(24px,6vw,88px);bottom:24px;font-family:var(--font-mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.progress-bar{position:fixed;inset:0 0 auto;height:3px;background:var(--accent);transform:scaleX(0);transform-origin:left;z-index:50;transition:transform .25s ease}
.nav-dots{position:fixed;right:0;top:50%;z-index:60;display:grid;gap:0;transform:translateY(-50%)}
.nav-dots button{width:32px;height:18px;border:0;background:transparent;cursor:pointer;position:relative}
.nav-dots button::before{content:"";position:absolute;top:6px;left:13px;width:6px;height:6px;border-radius:50%;background:var(--muted);opacity:.45}
.nav-dots button.active::before{background:var(--accent);opacity:1}
.nav-dots button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.presentation-hotspot{position:fixed;top:0;right:0;z-index:80;display:flex;justify-content:flex-end;align-items:flex-start;width:190px;height:96px;padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) 0 0}
.present-toggle{display:inline-flex;align-items:center;gap:10px;min-height:40px;padding:0 14px 0 12px;border:1px solid rgba(15,23,42,.14);border-radius:999px;background:rgba(255,255,255,.92);color:#111827;cursor:pointer;font-family:var(--font-display);font-size:14px;font-weight:800;letter-spacing:0;text-transform:none;opacity:0;pointer-events:none;transform:translateY(-4px);box-shadow:0 10px 28px rgba(15,23,42,.12);backdrop-filter:blur(10px);transition:opacity .18s ease,border-color .2s ease,box-shadow .2s ease,color .2s ease,transform .2s ease}
.presentation-hotspot:hover .present-toggle,.presentation-hotspot:focus-within .present-toggle{opacity:1;pointer-events:auto;transform:none}
.present-toggle svg{width:18px;height:18px;display:block;fill:currentColor}
.present-toggle:hover,.present-toggle:focus-visible{outline:none;color:var(--accent);border-color:rgba(189,3,247,.55);box-shadow:0 14px 34px rgba(189,3,247,.16);transform:translateY(-1px)}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .45s ease,transform .45s ease}
.slide.visible .reveal,#overview .reveal{opacity:1;transform:none}
#overview{position:fixed;inset:0;z-index:1000;display:none;overflow:auto;padding:clamp(24px,4vw,60px);background:var(--bg,#000);color:var(--ink,#fff)}
#overview[aria-hidden="false"]{display:block}
.ov-head{display:flex;justify-content:space-between;gap:16px;margin:0 auto 24px;max-width:1280px;font-family:var(--font-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.ov-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:18px;max-width:1280px;margin:0 auto}
.ov-card{cursor:pointer;padding:0;text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--ink);overflow:hidden}
.ov-card:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ov-thumb{aspect-ratio:16/9;overflow:hidden;position:relative;background:var(--stage)}
.ov-thumb .clone{position:absolute;left:0;top:0;transform-origin:top left;pointer-events:none}
.ov-label{display:flex;justify-content:space-between;padding:8px 10px;font-family:var(--font-mono);font-size:13px;letter-spacing:.08em;color:var(--muted)}
@media (max-width:760px){.title-grid,.two-col,.steps,.driver-grid,.plan-lanes,.risk-matrix{grid-template-columns:1fr}.board-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mark,.mini-chart{display:none}.steps{gap:10px}.steps .panel{display:grid;grid-template-columns:42px 100px minmax(0,1fr);gap:8px;align-items:start;padding:12px 14px}.steps h3{font-size:20px}.steps p{font-size:18px;line-height:1.25}.steps .num{font-size:14px;margin-bottom:0}.row,.driver,.decision-item{grid-template-columns:52px minmax(0,1fr);gap:10px;padding:10px 0}.row p,.driver em,.decision-item em{grid-column:2;text-align:left;font-size:20px;line-height:1.2}.row b,.driver b,.decision-item b{font-size:20px}.driver-list{gap:0}.board-kpi b{font-size:34px}.board-kpi span,.bar::after{font-size:20px!important}.plan-lanes{gap:10px}.lane ul{display:none}.nav-dots{display:none}.slide-content{gap:12px;padding:22px 18px 54px}h1{font-size:clamp(42px,13vw,76px)}h2{font-size:clamp(30px,8vw,48px)}.panel,.lane,.risk,.board-kpi{padding:14px}.footer{left:18px;bottom:18px;font-size:12px}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
@media print{.slide{page-break-after:always}.progress-bar,.nav-dots,.presentation-hotspot,.present-toggle,#overview{display:none!important}}
"""


MICRON_DARK_FIXED_STAGE_CSS = """
:root{--letterbox:#000;--stage-width:1600px;--stage-height:900px;--stage-scale:1;--stage-scaled-width:1600px;--stage-scaled-height:900px}
body{background:var(--letterbox)}
.slide{width:100vw;height:100dvh;overflow:hidden;scroll-snap-align:start;position:relative;display:block;background:var(--letterbox)}
.slide-stage{position:absolute;left:calc((100vw - var(--stage-scaled-width))/2);top:calc((100dvh - var(--stage-scaled-height))/2);width:var(--stage-width);height:var(--stage-height);transform:scale(var(--stage-scale));transform-origin:top left;overflow:hidden;display:flex;flex-direction:column;background:var(--stage);box-shadow:0 28px 90px rgba(0,0,0,.45)}
.slide-content{flex:1;padding:88px;gap:28px;max-height:none}
.slide:not(.title-slide)::after{content:none}
.slide:not(.title-slide) .slide-stage::after{content:"";position:absolute;right:38px;bottom:28px;width:96px;height:24px;background:url("assets/micron-logo-white-tm-rgb.png") right bottom / contain no-repeat;opacity:.86;pointer-events:none}
.kicker{color:var(--muted)}
.slide:not(.title-slide) .kicker{line-height:1;margin-bottom:20px}
.title-slide{background:var(--letterbox)}
.title-slide .slide-stage{background:#000}
.md-title-brand,.md-title-note,.md-title-content{z-index:3}
#overview .ov-thumb{aspect-ratio:16/9}
#overview .ov-thumb .clone{width:1600px;height:900px}
@media (max-width:760px){.title-grid,.two-col,.steps{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.mark{display:grid}.steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.steps .panel{display:block;padding:24px}.steps h3{font-size:28px}.steps p{font-size:24px;line-height:1.35}.steps .num{font-size:18px;margin-bottom:20px}.row{grid-template-columns:96px minmax(0,1fr) minmax(0,1.15fr);gap:20px;padding:18px 0}.row p{grid-column:auto;font-size:24px;line-height:1.35}.row b{font-size:24px}.nav-dots{display:grid}.slide-content{gap:28px;padding:88px}h1{font-size:108px}h2{font-size:72px}.panel{padding:36px}.footer{left:88px;bottom:24px;font-size:12px}}
@media print{body{background:#fff}.slide{width:var(--stage-width);height:var(--stage-height);background:var(--stage);page-break-after:always}.slide-stage{position:relative;left:0;top:0;transform:none;box-shadow:none}.progress-bar,.nav-dots,.presentation-hotspot,.present-toggle,#overview{display:none!important}}
"""


GUIDED_LEARNING_FIXED_STAGE_CSS = """
:root{--letterbox:#e6dfe8;--stage-width:1280px;--stage-height:720px;--stage-scale:1;--stage-scaled-width:1280px;--stage-scaled-height:720px}
body{background:var(--letterbox)}
.slide{width:100vw;height:100dvh;overflow:hidden;scroll-snap-align:start;position:relative;display:block;background:var(--letterbox)}
.slide-stage{position:absolute;left:calc((100vw - var(--stage-scaled-width))/2);top:calc((100dvh - var(--stage-scaled-height))/2);width:var(--stage-width);height:var(--stage-height);transform:scale(var(--stage-scale));transform-origin:top left;overflow:hidden;display:flex;flex-direction:column;background:var(--surface);border-radius:28px;box-shadow:0 24px 80px rgba(49,32,56,.14)}
.slide-content{flex:1;padding:72px;gap:24px;max-height:none}
.nav-dots button{width:44px;height:44px}
.nav-dots button::before{top:18px;left:18px}
.present-toggle{min-height:44px}
#overview .ov-thumb{aspect-ratio:16/9}
#overview .ov-thumb .clone{width:1280px;height:720px}
@media (max-width:760px){.title-grid,.two-col,.steps{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.mark{display:grid}.board-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.mini-chart{display:none}.steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.steps .panel{display:block;padding:24px}.steps h3{font-size:28px}.steps p{font-size:24px;line-height:1.35}.steps .num{font-size:18px;margin-bottom:20px}.row,.driver,.decision-item{grid-template-columns:96px minmax(0,1fr) minmax(0,1.15fr);gap:20px;padding:12px 0}.row p{grid-column:auto;font-size:24px;line-height:1.35}.row b,.driver b,.decision-item b{font-size:24px}.lane ul{display:none}.nav-dots{display:grid}.slide-content{gap:18px;padding:48px}h1{font-size:78px}h2{font-size:48px}.panel,.lane,.risk,.board-kpi{padding:20px}.footer{left:48px;bottom:24px;font-size:12px}}
@media print{body{background:#fff}.slide{width:var(--stage-width);height:var(--stage-height);background:var(--stage);page-break-after:always}.slide-stage{position:relative;left:0;top:0;transform:none;box-shadow:none}.progress-bar,.nav-dots,.presentation-hotspot,.present-toggle,#overview{display:none!important}}
"""


JS = """
class SlidePresentation{
  constructor(){this.slides=[...document.querySelectorAll('.slide')];this.currentSlide=0;this.locked=false;this.programmaticScroll=false;this.deck=document.querySelector('.deck');this.nav=document.querySelector('.nav-dots');this.bar=document.querySelector('.progress-bar');this.presentToggle=document.querySelector('.present-toggle');this.overview=document.getElementById('overview');this.setupNavDots();this.setupObserver();this.setupKeys();this.setupWheel();this.setupTouch();this.setupPresentationMode();this.goTo(0,{immediate:true})}
  clamp(i){return Math.max(0,Math.min(this.slides.length-1,i))}
  apply(i){this.currentSlide=i;this.slides.forEach((s,j)=>{s.classList.toggle('active',j===i);s.classList.toggle('visible',j===i)});this.nav.querySelectorAll('button').forEach((b,j)=>{b.classList.toggle('active',j===i);b.setAttribute('aria-current',j===i?'true':'false')});if(this.bar)this.bar.style.transform=`scaleX(${(i+1)/this.slides.length})`}
  goTo(i,o={}){const n=this.clamp(i);if(this.locked&&!o.immediate)return;this.apply(n);this.programmaticScroll=true;this.slides[n].scrollIntoView({behavior:o.immediate?'auto':'smooth',block:'start'});if(o.immediate){requestAnimationFrame(()=>this.programmaticScroll=false);return}this.locked=true;setTimeout(()=>{this.locked=false;this.programmaticScroll=false},520)}
  next(){this.goTo(this.currentSlide+1)}prev(){this.goTo(this.currentSlide-1)}
  setupNavDots(){this.nav.innerHTML='';this.slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Go to slide ${i+1}`);b.addEventListener('click',()=>this.goTo(i));this.nav.appendChild(b)})}
  setupObserver(){const o=new IntersectionObserver(es=>{if(this.programmaticScroll)return;es.forEach(e=>{if(e.isIntersecting)this.apply(this.slides.indexOf(e.target))})},{threshold:.6});this.slides.forEach(s=>o.observe(s))}
  setupKeys(){document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.toggleOverview();return}if(this.overview.getAttribute('aria-hidden')==='false')return;if(e.key.toLowerCase()==='p'){e.preventDefault();this.requestPresent();return}if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();this.next()}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();this.prev()}else if(e.key==='Home'){e.preventDefault();this.goTo(0)}else if(e.key==='End'){e.preventDefault();this.goTo(this.slides.length-1)}})}
  setupWheel(){let a=0,t=null;this.deck.addEventListener('wheel',e=>{a+=e.deltaY;if(Math.abs(a)>85){a>0?this.next():this.prev();a=0}clearTimeout(t);t=setTimeout(()=>a=0,180)},{passive:true})}
  setupTouch(){let x=0,y=0;window.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX;y=e.changedTouches[0].clientY},{passive:true});window.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40)(dx<0?this.next():this.prev())},{passive:true})}
  setupPresentationMode(){this.presentToggle?.addEventListener('click',()=>this.requestPresent())}
  requestPresent(){document.documentElement.requestFullscreen?.().catch(()=>{})}
  buildOverview(){this.overview.innerHTML='';const h=document.createElement('div');h.className='ov-head';h.innerHTML=`<b>Slide overview</b><span>${this.currentSlide+1} / ${this.slides.length}</span>`;const g=document.createElement('div');g.className='ov-grid';this.slides.forEach((s,i)=>{const c=document.createElement('button');c.type='button';c.className='ov-card';const th=document.createElement('div');th.className='ov-thumb';const source=s.querySelector(':scope > .slide-stage')||s;const clone=source.cloneNode(true);clone.classList.add('clone','visible');clone.setAttribute('aria-hidden','true');clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));clone.querySelectorAll('button,a,input,select,textarea,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));th.appendChild(clone);const lab=document.createElement('div');lab.className='ov-label';lab.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b><span>${s.dataset.slideKind||'slide'}</span>`;c.append(th,lab);c.addEventListener('click',()=>{this.toggleOverview(false);this.goTo(i,{immediate:true})});g.appendChild(c)});this.overview.append(h,g);requestAnimationFrame(()=>this.overview.querySelectorAll('.ov-thumb').forEach(th=>{const cl=th.querySelector('.clone');const fixed=cl.classList.contains('slide-stage');const w=fixed?1600:(this.slides[0].getBoundingClientRect().width||window.innerWidth);const h=fixed?900:(this.slides[0].getBoundingClientRect().height||window.innerHeight);cl.style.width=w+'px';cl.style.height=h+'px';cl.style.transform=`scale(${th.clientWidth/w})`}))}
  toggleOverview(force){const open=typeof force==='boolean'?force:this.overview.getAttribute('aria-hidden')!=='false';if(open){this.buildOverview();this.overview.setAttribute('aria-hidden','false');this.overview.focus({preventScroll:true})}else{this.overview.setAttribute('aria-hidden','true')}}
}
window.presentation=new SlidePresentation();
"""


MICRON_DARK_FIXED_STAGE_JS = """
function updateStageScale(){
  const w=1600,h=900;
  const s=Math.min(window.innerWidth/w,window.innerHeight/h);
  document.documentElement.style.setProperty('--stage-scale',s.toFixed(4));
  document.documentElement.style.setProperty('--stage-scaled-width',`${w*s}px`);
  document.documentElement.style.setProperty('--stage-scaled-height',`${h*s}px`);
}
function setupFixedStages(){
  document.querySelectorAll('.slide').forEach((slide)=>{
    if(slide.querySelector(':scope > .slide-stage'))return;
    const stage=document.createElement('div');
    stage.className='slide-stage';
    while(slide.firstChild)stage.appendChild(slide.firstChild);
    slide.appendChild(stage);
  });
  updateStageScale();
  window.addEventListener('resize',updateStageScale);
}
setupFixedStages();
"""


def fixed_stage_js(width: int, height: int) -> str:
    return f"""
function updateStageScale(){{
  const w={width},h={height};
  const s=Math.min(window.innerWidth/w,window.innerHeight/h);
  document.documentElement.style.setProperty('--stage-scale',s.toFixed(4));
  document.documentElement.style.setProperty('--stage-scaled-width',`${{w*s}}px`);
  document.documentElement.style.setProperty('--stage-scaled-height',`${{h*s}}px`);
}}
function setupFixedStages(){{
  document.querySelectorAll('.slide').forEach((slide)=>{{
    if(slide.querySelector(':scope > .slide-stage'))return;
    const stage=document.createElement('div');
    stage.className='slide-stage';
    while(slide.firstChild)stage.appendChild(slide.firstChild);
    slide.appendChild(stage);
  }});
  updateStageScale();
  window.addEventListener('resize',updateStageScale);
}}
setupFixedStages();
"""

MICRON_DARK_EXECUTIVE_TITLE_TEMPLATE = {
    "id": "photo-title",
    "class": "title-photo",
    "visual": '<img class="md-title-hero-image" src="assets/micron-dark-title-image.jpeg" alt="" aria-hidden="true" decoding="async" />',
    "note": "Title option - photo title",
}


def load_stable_themes() -> list[str]:
    data = json.loads(MANIFEST_PATH.read_text())
    return [t["id"] for t in data["themes"] if t.get("status") == "stable"]


def slugify(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "presentation"


def default_output(theme: str, title: str) -> Path:
    return Path(f"{slugify(title)}.html")


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def slide(kind: str, body: str, title: bool = False, extra_class: str = "") -> str:
    klass = "slide title-slide" if title else "slide"
    if extra_class:
        klass = f"{klass} {extra_class}"
    return f'<section class="{klass}" data-slide-kind="{kind}"><div class="slide-content">{body}</div></section>'


def pick_micron_dark_executive_title_template(value: str | None) -> str | None:
    if value in (None, "", "default", "random", "photo-title"):
        return "photo-title"
    raise SystemExit(
        "micron-dark-executive has one title template: photo-title. "
        "Use micron-dark for wafer, divider, grain, silk, or screen-stack title templates."
    )


def build_title_slide(title: str, theme: str, title_template: str | None) -> str:
    safe_title = esc(title)
    if theme == "micron-dark-executive":
        pick_micron_dark_executive_title_template(title_template)
        template = MICRON_DARK_EXECUTIVE_TITLE_TEMPLATE
        return slide(
            "cover",
            f"""
{template["visual"]}
<img class="md-title-brand" src="assets/micron-logo-white-tm-rgb.png" alt="Micron" width="126" height="32" decoding="async" />
<div class="md-title-content">
  <p class="kicker reveal">FY26 supply resilience review</p>
  <h1 class="reveal">{safe_title}</h1>
  <p class="subtitle reveal">Decision briefing on yield recovery, capacity risk, and the 90-day execution plan.</p>
  <div class="md-accent-line reveal"></div>
</div>
<div class="md-title-note">{esc(template["note"])}</div>
<div class="md-title-number">01 / Cover</div>
""",
            title=True,
            extra_class=template["class"],
        )
    if theme == "micron-dark":
        return slide(
            "cover",
            f"""
<div class="md-silk-wave" aria-hidden="true">
  <canvas class="md-silk-canvas-purple"></canvas>
</div>
<img class="md-title-brand" src="assets/micron-logo-white-tm-rgb.png" alt="Micron" width="126" height="32" decoding="async" />
<div class="md-title-content">
  <p class="kicker reveal">FY26 operating review</p>
  <h1 class="reveal">{safe_title}</h1>
  <p class="subtitle reveal">Recovery is real, but the constraint moved downstream.</p>
  <div class="md-accent-line reveal"></div>
</div>
<div class="md-title-note">silk-wave-purple · mock operating data</div>
<div class="md-title-number">01 / Cover</div>
""",
            title=True,
            extra_class="title-silk title-silk-purple",
        )
    return slide(
        "cover",
        f"""
<div class="title-grid">
  <div>
    <p class="kicker reveal">FY26 operating review</p>
    <h1 class="reveal">{safe_title}</h1>
    <p class="subtitle reveal">A realistic board-style presentation on recovery signal, bottleneck shift, operating plan, and decision asks.</p>
  </div>
  <div class="mark reveal" aria-hidden="true">01</div>
</div>
<div class="footer">title slide included</div>
""",
        title=True,
    )


def build_micron_dark_sections(title: str, theme: str, slides: int, title_template: str | None) -> list[str]:
    sections = [
        build_title_slide(title, theme, title_template),
        slide(
            "signal",
            """
<p class="section-label reveal">Situation 01</p>
<div class="signal-layout">
  <div class="reveal">
    <div class="big-metric">94.8%</div>
    <p class="subtitle">Final electrical yield is back above the recovery floor, but still 1.2 pts under release target.</p>
  </div>
  <div class="board-kpis reveal">
    <div class="board-kpi"><b>+1.6</b><span>w/w yield pts</span></div>
    <div class="board-kpi"><b>3</b><span>lots below guardband</span></div>
    <div class="board-kpi"><b>18h</b><span>queue exposure</span></div>
    <div class="board-kpi"><b>96.0</b><span>release target</span></div>
  </div>
</div>
<div class="footer">situation readout - mock data</div>
""",
        ),
        slide(
            "evidence",
            """
<p class="section-label reveal">Constraint 02</p>
<h2 class="reveal">The bottleneck moved from litho drift to final test fallout</h2>
<div class="driver-grid reveal">
  <div class="driver-list">
    <div class="driver"><span>W-3</span><b>Litho CD drift</b><em>-2.8 pts</em></div>
    <div class="driver"><span>W-2</span><b>Etch chamber matching</b><em>-1.4 pts</em></div>
    <div class="driver active"><span>Now</span><b>Final test bin 7A</b><em>-2.0 pts</em></div>
    <div class="driver"><span>Next</span><b>Probe retest queue</b><em>18h risk</em></div>
  </div>
  <div class="mini-chart">
    <div class="bar" data-label="Mon"></div>
    <div class="bar" data-label="Tue"></div>
    <div class="bar" data-label="Wed"></div>
    <div class="bar" data-label="Thu"></div>
    <div class="bar" data-label="Fri"></div>
  </div>
</div>
<div class="footer">active constraint highlighted</div>
""",
        ),
        slide(
            "plan",
            """
<p class="section-label reveal">Operating plan 03</p>
<h2 class="reveal">Three workstreams, one control room, daily exit criteria</h2>
<div class="plan-lanes reveal">
  <div class="lane"><div class="num">01</div><h3>Recipe freeze</h3><ul><li>Hold non-critical edits for 48h</li><li>Lock metrology recipe version</li><li>Publish exception owner</li></ul></div>
  <div class="lane"><div class="num">02</div><h3>Test containment</h3><ul><li>Isolate bin 7A lots</li><li>Retest golden sample</li><li>Compare handler drift</li></ul></div>
  <div class="lane"><div class="num">03</div><h3>Queue recovery</h3><ul><li>Pull probe capacity forward</li><li>Clear 18h queue exposure</li><li>Review at 07:30 daily</li></ul></div>
</div>
<div class="footer">90-day recovery cadence</div>
""",
        ),
        slide(
            "risk",
            """
<p class="section-label reveal">Risk controls 04</p>
<h2 class="reveal">Do not trade yield recovery for hidden reliability debt</h2>
<div class="risk-matrix reveal">
  <div class="risk"><strong>Release gate</strong><p>No lot exits containment until bin 7A retest delta is below 0.3 pts for two shifts.</p></div>
  <div class="risk"><strong>Customer protection</strong><p>Ship plan prioritises committed mix first; upside lots stay behind the quality wall.</p></div>
</div>
<div class="footer">guardrails before acceleration</div>
""",
        ),
        slide(
            "decision",
            """
<p class="section-label reveal">Decision 05</p>
<h2 class="reveal">Approve the sprint, protect capacity, review the result Friday</h2>
<div class="decision-board reveal">
  <div class="decision-item"><span>Approve</span><b>48h recipe-change hold</b><em>Ops + PE</em></div>
  <div class="decision-item"><span>Move</span><b>12 probe-hours into recovery lane</b><em>Manufacturing</em></div>
  <div class="decision-item"><span>Watch</span><b>Bin 7A retest delta and queue age</b><em>Daily 07:30</em></div>
</div>
<div class="footer">decision surface</div>
""",
        ),
    ]
    while len(sections) < slides:
        n = len(sections) + 1
        sections.append(
            slide(
                "content",
                f"""
<p class="kicker reveal">{n:02d} - extra</p>
<h2 class="reveal">Additional editorial ops slide {n}</h2>
<div class="panel reveal"><p>Use one large headline, one official Micron icon or evidence visual, and one clear decision.</p></div>
<div class="footer">generated scaffold</div>
""",
            )
        )
    return sections[:slides]


def build_sections(title: str, theme: str, slides: int, title_template: str | None) -> list[str]:
    if theme == "micron-dark":
        return build_micron_dark_sections(title, theme, slides, title_template)
    if theme == "micron-dark-executive":
        sections = [
            build_title_slide(title, theme, title_template),
            slide(
                "executive-summary",
                """
<p class="kicker reveal">02 - executive summary</p>
<h2 class="reveal">Three bets shape the next cycle</h2>
<div class="board-kpis reveal">
  <div class="board-kpi"><b>HBM</b><span>feed AI training</span></div>
  <div class="board-kpi"><b>Power</b><span>lower workload energy</span></div>
  <div class="board-kpi"><b>Supply</b><span>protect commitments</span></div>
  <div class="board-kpi"><b>90d</b><span>agenda window</span></div>
</div>
<div class="footer">mock executive board data</div>
""",
            ),
            slide(
                "constraint",
                """
<p class="kicker reveal">03 - constraint shift</p>
<h2 class="reveal">Decision needed: where to over-index</h2>
<div class="driver-grid reveal">
  <div class="driver-list">
    <div class="driver"><span>Option</span><b>HBM capacity</b><em>strategic pull</em></div>
    <div class="driver active"><span>Focus</span><b>Advanced packaging</b><em>margin expansion</em></div>
    <div class="driver"><span>Trade</span><b>Partner dependency</b><em>manage</em></div>
    <div class="driver"><span>Next</span><b>Node transition</b><em>qualification time</em></div>
  </div>
  <div class="mini-chart">
    <div class="bar" data-label="Litho"></div><div class="bar" data-label="Etch"></div><div class="bar" data-label="Test"></div><div class="bar" data-label="Probe"></div><div class="bar" data-label="Ship"></div>
  </div>
</div>
<div class="footer">constraint migration</div>
""",
            ),
            slide(
                "decision",
                """
<p class="kicker reveal">04 - decision asks</p>
<h2 class="reveal">The roadmap depends on connected decisions</h2>
<div class="decision-board reveal">
  <div class="decision-item"><span>Supply</span><b>Customer commitment plan</b><em>capacity scenario</em></div>
  <div class="decision-item"><span>Qual</span><b>Qualification gate timing</b><em>roadmap decision</em></div>
  <div class="decision-item"><span>Power</span><b>Thermals and system design</b><em>adoption plan</em></div>
  <div class="decision-item"><span>Invest</span><b>Trigger review</b><em>90-day agenda</em></div>
</div>
<div class="footer">decision surface</div>
""",
            ),
            slide(
                "guardrails",
                """
<p class="kicker reveal">05 - guardrails</p>
<h2 class="reveal">Next 90 days</h2>
<div class="risk-matrix reveal">
  <div class="risk"><strong>Quality wall</strong><p>Lock customer-backed capacity scenarios.</p></div>
  <div class="risk"><strong>Capacity trigger</strong><p>Align qualification gates to roadmap decisions.</p></div>
  <div class="risk"><strong>Change control</strong><p>Review supply exposure by critical node.</p></div>
  <div class="risk"><strong>Customer mix</strong><p>Confirm investment triggers and owner cadence.</p></div>
</div>
<div class="footer">stop conditions</div>
""",
            ),
        ]
        while len(sections) < slides:
            n = len(sections) + 1
            sections.append(
                slide(
                    "content",
                    f"""
<p class="kicker reveal">{n:02d} - appendix</p>
<h2 class="reveal">Appendix detail: owner, risk, and weekly signal</h2>
<div class="risk-matrix reveal">
  <div class="risk"><strong>Owner</strong><p>Process engineering owns recipe freeze and exception review.</p></div>
  <div class="risk"><strong>Metric</strong><p>Final test bin 7A and queue age are reviewed daily.</p></div>
</div>
<div class="footer">appendix</div>
""",
                )
            )
        return sections[:slides]
    sections = [
        build_title_slide(title, theme, title_template),
        slide(
            "situation",
            """
<p class="kicker reveal">02 - situation</p>
<h2 class="reveal">Yield is recovering, but not yet releasable</h2>
<div class="board-kpis reveal">
  <div class="board-kpi"><b>94.8%</b><span>current yield</span></div>
  <div class="board-kpi"><b>+1.6</b><span>w/w lift</span></div>
  <div class="board-kpi"><b>18h</b><span>queue risk</span></div>
  <div class="board-kpi"><b>96.0</b><span>target</span></div>
</div>
<div class="footer">realistic operating brief</div>
""",
        ),
        slide(
            "diagnosis",
            """
<p class="kicker reveal">03 - diagnosis</p>
<h2 class="reveal">The active constraint is now final test, not upstream process drift</h2>
<div class="driver-grid reveal">
  <div class="driver-list">
    <div class="driver"><span>W-3</span><b>Litho CD drift</b><em>closed</em></div>
    <div class="driver"><span>W-2</span><b>Etch matching</b><em>stable</em></div>
    <div class="driver active"><span>Now</span><b>Final test bin 7A</b><em>-2.0 pts</em></div>
    <div class="driver"><span>Next</span><b>Probe queue aging</b><em>watch</em></div>
  </div>
  <div class="mini-chart">
    <div class="bar" data-label="M"></div><div class="bar" data-label="T"></div><div class="bar" data-label="W"></div><div class="bar" data-label="T"></div><div class="bar" data-label="F"></div>
  </div>
</div>
<div class="footer">constraint stack</div>
""",
        ),
        slide(
            "plan",
            """
<p class="kicker reveal">04 - operating plan</p>
<h2 class="reveal">A focused sprint with guardrails beats another broad reset</h2>
<div class="plan-lanes reveal">
  <div class="lane"><div class="num">01</div><h3>Freeze</h3><ul><li>Hold non-critical recipe edits</li><li>Lock metrology version</li></ul></div>
  <div class="lane"><div class="num">02</div><h3>Contain</h3><ul><li>Isolate bin 7A lots</li><li>Retest golden sample</li></ul></div>
  <div class="lane"><div class="num">03</div><h3>Recover</h3><ul><li>Pull probe capacity forward</li><li>Review queue daily</li></ul></div>
</div>
<div class="footer">workstream design</div>
""",
        ),
        slide(
            "decision",
            """
<p class="kicker reveal">05 - decision</p>
<h2 class="reveal">Approve the hold, move capacity, return with evidence</h2>
<div class="decision-board reveal">
  <div class="decision-item"><span>Approve</span><b>48h recipe-change hold</b><em>today</em></div>
  <div class="decision-item"><span>Move</span><b>12 probe-hours into recovery lane</b><em>ops</em></div>
  <div class="decision-item"><span>Measure</span><b>Bin 7A retest delta</b><em>daily</em></div>
</div>
<div class="footer">decision ask</div>
""",
        ),
    ]
    while len(sections) < slides:
        n = len(sections) + 1
        sections.append(
            slide(
                "content",
                f"""
<p class="kicker reveal">{n:02d} - extra</p>
<h2 class="reveal">Additional content slide {n}</h2>
<div class="panel reveal"><p>Use this slide to confirm repeated content still fits the selected theme.</p></div>
<div class="footer">generated scaffold</div>
""",
            )
        )
    return sections[:slides]


def build_html(title: str, theme: str, slides: int, title_template: str | None = None) -> str:
    css = THEME_CSS[theme] + BASE_CSS
    if theme == "micron-dark":
        css = BASE_CSS + THEME_CSS[theme]
    js = JS
    module_script = ""
    if theme in {"micron-dark", "micron-dark-executive"}:
        css += MICRON_DARK_FIXED_STAGE_CSS
        js = fixed_stage_js(1600, 900) + JS
    if theme == "micron-dark":
        template = SILK_WAVE_PURPLE_TEMPLATE.read_text()
        match = re.search(r'<script type="module">(.*?)</script>', template, re.S)
        if not match:
            raise SystemExit("silk-wave-purple.html is missing its required Three.js module script")
        module_body = match.group(1).strip()
        module_body = module_body.replace(
            "renderer.render(scene, camera);",
            'renderer.render(scene, camera);\n      canvas.dataset.silkShaderReady = "true";\n      window.__silkWavePurpleReady = true;',
        )
        module_script = f'  <script type="module">\n{module_body}\n  </script>\n'
    if theme == "guided-learning":
        css += GUIDED_LEARNING_FIXED_STAGE_CSS
        js = fixed_stage_js(1280, 720) + JS
    sections = "\n".join(build_sections(title, theme, slides, title_template))
    return f"""<!doctype html>
<html lang="en" data-theme="{esc(theme)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>{esc(title)}</title>
  <style>{css}</style>
</head>
<body>
  <div class="progress-bar" role="progressbar" aria-label="Deck progress"></div>
  <nav class="nav-dots" aria-label="Slide navigation"></nav>
  <div class="presentation-hotspot" aria-hidden="false">
    <button class="present-toggle" type="button" aria-label="Enter presentation mode (full screen)" title="Presentation: full screen (shortcut P)">
      <svg class="present-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10-6.5-10-6.5Z" /></svg>
      <span class="presentation-toggle-text">Present</span>
    </button>
  </div>
  <main class="deck" tabindex="-1">
{sections}
  </main>
  <div id="overview" role="dialog" aria-modal="true" aria-label="Slide overview" aria-hidden="true" tabindex="-1"></div>
{module_script}\
  <script>{js}</script>
</body>
</html>
"""


def copy_theme_assets(output: Path, theme: str) -> None:
    if theme not in {"micron-dark", "micron-dark-executive"}:
        return
    assets_dir = output.parent / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(
        SHARED_ASSETS / "micron-logo-white-tm-rgb.png",
        assets_dir / "micron-logo-white-tm-rgb.png",
    )
    if theme != "micron-dark-executive":
        if theme == "micron-dark":
            icon_target = assets_dir / "primary" / "mp4" / "rev"
            icon_target.mkdir(parents=True, exist_ok=True)
            shutil.copy2(
                MICRON_ICONS_ASSETS / "primary" / "mp4" / "rev" / "wafer.mp4",
                icon_target / "wafer.mp4",
            )
        return
    shutil.copy2(
        MICRON_DARK_EXECUTIVE_ASSETS / "title-image.jpeg",
        assets_dir / "micron-dark-title-image.jpeg",
    )


def main() -> int:
    themes = load_stable_themes()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", nargs="?")
    parser.add_argument("--title", default="FY26 yield recovery plan")
    parser.add_argument("--theme", default="micron-dark", choices=themes)
    parser.add_argument("--slides", type=int, default=5)
    parser.add_argument(
        "--title-template",
        default=None,
        help="Micron dark defaults to silk-wave-purple. For micron-dark-executive: photo-title only.",
    )
    parser.add_argument("--list-themes", action="store_true")
    args = parser.parse_args()

    if args.list_themes:
        for theme in themes:
            print(theme)
        return 0

    if args.slides < 2:
        raise SystemExit("--slides must be at least 2 so the deck includes a content slide")

    output = Path(args.output) if args.output else default_output(args.theme, args.title)
    if output.suffix == "":
        output = output.with_suffix(".html")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(build_html(args.title, args.theme, args.slides, args.title_template), encoding="utf-8")
    copy_theme_assets(output, args.theme)
    print(f"Wrote {output} ({args.slides} slides, theme: {args.theme})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
