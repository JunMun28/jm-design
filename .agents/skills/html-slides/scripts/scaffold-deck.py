#!/usr/bin/env python3
"""Create a minimal Micron engineering-dark slide deck scaffold.

Scope: this scaffold emits the **Micron engineering-dark** theme only.
For any other theme (swiss-light, editorial-dark, brutalist, glassmorphism,
playful, micron-light, micron-dark, course-module, weekly-update) start from
`references/runtime/html-template.md` and the theme's `themes/<id>/design.md`
instead — the runtime is identical, only the token layer differs.

The embedded controller mirrors the canonical runtime in
`references/runtime/html-template.md`: deck-scoped passive wheel, an
IntersectionObserver gated by `programmaticScroll`, a focus-trapped
`aria-modal` overview, and focus restore on close. It deliberately ships
no card grid — content slides are an editorial lockup, not bento boxes.
"""

import argparse
import re
from pathlib import Path


CSS = r"""
*{box-sizing:border-box;margin:0;padding:0}
:root{--black:#000;--white:#fff;--gray-a:#262626;--gray-b:#4d4d4d;--gray-c:#8c8c8c;--gray-d:#bfbfbf;--gray-e:#e6e6e6;--purple:#bd03f7;--purple-b:#ff8cff;--blue:#2044ff;--cyan:#32c8ff;--page-bg:#151515;--slide-w:1600px;--slide-h:900px;--margin:96px;--slide-scale:1;--ease:cubic-bezier(.16,1,.3,1)}
html,body{height:100%;overflow-x:hidden;background:var(--page-bg);color:var(--white);font-family:Arial,Helvetica,sans-serif;scrollbar-width:none}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
.deck{display:block}
.slide{width:100vw;height:100vh;height:100dvh;overflow:hidden;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;position:relative;background:linear-gradient(135deg,rgba(32,68,255,.10),transparent 28%),radial-gradient(circle at 92% 10%,rgba(189,3,247,.16),transparent 34%),var(--black)}
.slide-content{position:relative;width:var(--slide-w);height:var(--slide-h);flex:0 0 auto;transform:scale(var(--slide-scale));transform-origin:center;z-index:2}
.content{position:absolute;inset:var(--margin);display:flex;flex-direction:column;justify-content:center}
.cover-brand{position:absolute;top:54px;left:var(--margin);z-index:3;width:126px;height:auto;opacity:.94}
.section-label,.eyebrow{font-size:15px;color:var(--purple);font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:18px}
h1{font-size:66px;line-height:1.02;font-weight:800;max-width:15ch}
h2{font-size:44px;line-height:1.08;font-weight:800;max-width:20ch}
h3{font-size:23px;line-height:1.2;font-weight:800}
p,li{font-size:21px;line-height:1.4;color:var(--gray-e);max-width:62ch}
.subtitle{font-size:24px;line-height:1.35;color:var(--gray-d);max-width:54ch;margin-top:18px}
.accent{color:var(--purple)}
.accent-line{width:84px;height:6px;background:var(--purple);border-radius:999px;margin-top:30px}
/* Editorial content layout — no cards, no bento, no accent-border boxes */
.cols{display:grid;grid-template-columns:7fr 5fr;gap:64px;align-items:start;margin-top:48px}
.lockup .metric{font-size:104px;line-height:.92;font-weight:800;letter-spacing:-.02em}
.lockup .metric-label{font-size:19px;color:var(--gray-d);margin-top:14px;max-width:30ch}
.points{list-style:none}
.points li{padding:20px 0;border-top:1px solid rgba(230,230,230,.16);display:flex;gap:18px;align-items:baseline}
.points li:first-child{border-top:0}
.points .k{font-size:15px;color:var(--gray-c);font-variant-numeric:tabular-nums;min-width:34px}
.slide-number{position:absolute;right:34px;bottom:28px;font-size:13px;color:rgba(255,255,255,.45);letter-spacing:.04em}
.tiny-note{position:absolute;bottom:34px;left:var(--margin);font-size:15px;color:var(--gray-c)}
.progress-bar{position:fixed;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--blue),var(--purple),var(--purple-b));box-shadow:0 0 18px rgba(189,3,247,.46);transform:scaleX(0);transform-origin:left;z-index:30;transition:transform .3s var(--ease)}
.nav-dots{position:fixed;right:8px;top:50%;transform:translateY(-50%);display:grid;z-index:30}
.nav-dots button{width:44px;height:44px;padding:0;border:0;background:transparent;cursor:pointer;position:relative}
.nav-dots button::before{content:"";position:absolute;inset:0;margin:auto;width:8px;height:8px;border-radius:50%;border:1px solid rgba(255,255,255,.32);background:rgba(255,255,255,.20)}
.nav-dots button.active::before{background:var(--purple);border-color:var(--purple-b);box-shadow:0 0 12px rgba(189,3,247,.7)}
.nav-dots button:focus-visible{outline:2px solid var(--purple-b);outline-offset:-8px;border-radius:8px}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .55s var(--ease),transform .55s var(--ease)}
.slide.visible .reveal{opacity:1;transform:none}
.reveal:nth-child(2){transition-delay:.08s}.reveal:nth-child(3){transition-delay:.16s}.reveal:nth-child(4){transition-delay:.24s}
#overview{position:fixed;inset:0;z-index:100;display:none;overflow:auto;padding:clamp(24px,4vw,60px);background:rgba(0,0,0,.93);color:var(--white);backdrop-filter:blur(12px)}
#overview[aria-hidden=false]{display:block}
.ov-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin:0 auto 28px;max-width:1280px;color:var(--gray-c);font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.ov-head b{color:var(--white)}
.ov-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:clamp(16px,2vw,24px);max-width:1280px;margin:0 auto}
.ov-card{cursor:pointer;overflow:hidden;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(255,255,255,.05);text-align:left;padding:0;color:inherit}
.ov-card:hover,.ov-card.active{border-color:var(--purple);transform:translateY(-2px)}
.ov-card:focus-visible{outline:2px solid var(--purple-b);outline-offset:2px}
.ov-thumb{aspect-ratio:16/9;overflow:hidden;position:relative;background:var(--black)}
.ov-thumb .clone{position:absolute;top:0;left:0;width:100vw;height:100vh;transform-origin:top left;pointer-events:none}
.ov-thumb .clone .reveal{opacity:1!important;transform:none!important}
.ov-label{display:flex;justify-content:space-between;padding:8px 10px;color:var(--gray-c);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.ov-label b{color:var(--white)}
@media (max-width:600px),(max-height:600px){.nav-dots{display:none}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.2s!important}html{scroll-behavior:auto}}
@media print{body{background:white}.slide{width:var(--slide-w);height:var(--slide-h);page-break-after:always}.slide-content{transform:none}.progress-bar,.nav-dots,#overview{display:none!important}}
"""


JS = r"""
function updateSlideScale(){document.documentElement.style.setProperty('--slide-scale',Math.min(1,window.innerWidth/1600,window.innerHeight/900).toFixed(4))}
updateSlideScale();window.addEventListener('resize',updateSlideScale);
class SlidePresentation{
  constructor(){
    this.slides=[...document.querySelectorAll('.slide')];
    this.currentSlide=0;this.locked=false;this.programmaticScroll=false;
    this.overviewOpen=false;this.lastFocus=null;
    this.deck=document.querySelector('.deck');
    this.navDotsContainer=document.querySelector('.nav-dots');
    this.progressBar=document.querySelector('.progress-bar');
    this.overview=document.getElementById('overview');
    this.setupNavDots();this.setupIntersectionObserver();this.setupKeyboardNav();
    this.setupWheelNav();this.setupTouchNav();this.applySlide(0);
  }
  clamp(i){return Math.max(0,Math.min(this.slides.length-1,i))}
  applySlide(i){
    this.currentSlide=i;
    this.slides.forEach((s,j)=>{s.classList.toggle('active',j===i);s.classList.toggle('visible',j===i)});
    this.navDotsContainer.querySelectorAll('button').forEach((d,j)=>{d.classList.toggle('active',j===i);d.setAttribute('aria-current',j===i?'true':'false')});
    if(this.progressBar)this.progressBar.style.transform=`scaleX(${(i+1)/this.slides.length})`;
  }
  goTo(i,o={}){
    const n=this.clamp(i);if(this.locked&&!o.immediate)return;
    this.applySlide(n);this.programmaticScroll=true;
    this.slides[n].scrollIntoView({behavior:o.immediate?'auto':'smooth',block:'start'});
    if(!o.immediate){this.locked=true;setTimeout(()=>{this.locked=false;this.programmaticScroll=false},650)}
    else{requestAnimationFrame(()=>{this.programmaticScroll=false})}
  }
  next(){this.goTo(this.currentSlide+1)}
  prev(){this.goTo(this.currentSlide-1)}
  setupIntersectionObserver(){
    const o=new IntersectionObserver(es=>{if(this.programmaticScroll)return;es.forEach(e=>{if(e.isIntersecting)this.applySlide(this.slides.indexOf(e.target))})},{threshold:.6});
    this.slides.forEach(s=>o.observe(s));
  }
  setupNavDots(){
    this.navDotsContainer.innerHTML='';
    this.slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Go to slide ${i+1}`);b.addEventListener('click',()=>this.goTo(i));this.navDotsContainer.appendChild(b)});
  }
  setupKeyboardNav(){
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();this.toggleOverview();return}
      if(this.overviewOpen){if(e.key==='Tab')this.trapFocus(e);return}
      if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();this.next()}
      else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();this.prev()}
      else if(e.key==='Home'){e.preventDefault();this.goTo(0)}
      else if(e.key==='End'){e.preventDefault();this.goTo(this.slides.length-1)}
    });
  }
  setupWheelNav(){
    let acc=0,t=null;
    this.deck.addEventListener('wheel',e=>{
      if(this.overviewOpen)return;
      acc+=e.deltaY;
      if(Math.abs(acc)>80){acc>0?this.next():this.prev();acc=0}
      clearTimeout(t);t=setTimeout(()=>acc=0,180);
    },{passive:true});
  }
  setupTouchNav(){
    let x=0,y=0;
    window.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX;y=e.changedTouches[0].clientY},{passive:true});
    window.addEventListener('touchend',e=>{if(this.overviewOpen)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40)(dx<0?this.next():this.prev())},{passive:true});
  }
  buildOverview(){
    this.overview.innerHTML='';
    const head=document.createElement('div');head.className='ov-head';
    head.innerHTML=`<span><b>Slide overview</b> · esc to close</span><span>${String(this.currentSlide+1).padStart(2,'0')} / ${String(this.slides.length).padStart(2,'0')}</span>`;
    const grid=document.createElement('div');grid.className='ov-grid';
    this.slides.forEach((slide,i)=>{
      const card=document.createElement('button');card.type='button';card.className=`ov-card${i===this.currentSlide?' active':''}`;card.setAttribute('aria-label',`Go to slide ${i+1}`);
      const thumb=document.createElement('div');thumb.className='ov-thumb';
      const clone=slide.cloneNode(true);clone.classList.add('clone','visible');thumb.appendChild(clone);
      const label=document.createElement('div');label.className='ov-label';
      label.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b><span>${slide.dataset.slideKind||'slide'}</span>`;
      card.append(thumb,label);
      card.addEventListener('click',()=>{this.toggleOverview(false);this.goTo(i,{immediate:true})});
      grid.appendChild(card);
    });
    this.overview.append(head,grid);
    requestAnimationFrame(()=>this.overview.querySelectorAll('.ov-thumb').forEach(thumb=>{
      const r=this.slides[0].getBoundingClientRect();const w=r.width||window.innerWidth,h=r.height||window.innerHeight;
      const c=thumb.querySelector('.clone');c.style.width=w+'px';c.style.height=h+'px';c.style.transform=`scale(${thumb.clientWidth/w})`;
    }));
  }
  toggleOverview(force){
    this.overviewOpen=typeof force==='boolean'?force:!this.overviewOpen;
    if(this.overviewOpen){this.lastFocus=document.activeElement;this.buildOverview();this.overview.setAttribute('aria-hidden','false');this.overview.focus({preventScroll:true})}
    else{this.overview.setAttribute('aria-hidden','true');this.lastFocus&&this.lastFocus.focus&&this.lastFocus.focus({preventScroll:true})}
  }
  trapFocus(e){
    const f=this.overview.querySelectorAll("button,[tabindex]:not([tabindex='-1'])");if(!f.length)return;
    const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
  }
}
window.presentation=new SlidePresentation();
"""


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "presentation"


def main():
    parser = argparse.ArgumentParser(
        description="Create a Micron engineering-dark HTML deck scaffold. "
        "Other themes: start from references/runtime/html-template.md instead."
    )
    parser.add_argument("output", nargs="?")
    parser.add_argument("--title", default="Presentation title")
    parser.add_argument("--slides", type=int, default=3)
    parser.add_argument(
        "--theme",
        default="micron-dark-engineering",
        choices=["micron-dark-engineering"],
        help="Only micron-dark-engineering is scaffolded. For any other theme, "
        "use references/runtime/html-template.md + themes/<id>/design.md.",
    )
    args = parser.parse_args()
    output = Path(args.output) if args.output else Path(f"{slugify(args.title)}.html")
    if output.suffix == "":
        output = output.with_suffix(".html")
    sections = []
    logo = (
        '<img class="cover-brand" src="assets/micron-logo-white-tm-rgb.png" alt="Micron" />'
        if Path("assets/micron-logo-white-tm-rgb.png").exists()
        else ""
    )
    for i in range(args.slides):
        if i == 0:
            body = (
                f'{logo}<div class="content">'
                f'<div class="eyebrow reveal">Micron engineering</div>'
                f'<h1 class="reveal">{args.title}</h1>'
                f'<p class="subtitle reveal">One-line context for a practical engineering deck.</p>'
                f'<div class="accent-line reveal"></div></div>'
                f'<div class="tiny-note">Clear · structured · reusable</div>'
                f'<div class="slide-number">01 / Cover</div>'
            )
            kind = "cover"
        else:
            body = (
                f'<div class="content">'
                f'<div class="section-label reveal">Section</div>'
                f'<h2 class="reveal">One clear message for slide {i + 1}</h2>'
                f'<div class="cols reveal">'
                f'<ul class="points">'
                f'<li><span class="k">01</span><span>Concrete point tied to the work, one line.</span></li>'
                f'<li><span class="k">02</span><span>Owner, gate, or the next action.</span></li>'
                f'<li><span class="k">03</span><span>The risk or open question, stated plainly.</span></li>'
                f'</ul>'
                f'<div class="lockup"><div class="metric accent">37<span style="font-size:.45em">%</span></div>'
                f'<div class="metric-label">The single number this slide exists to land.</div></div>'
                f'</div></div>'
                f'<div class="slide-number">{i + 1:02d} / Content</div>'
            )
            kind = "content"
        sections.append(
            f'<section class="slide dark" data-slide-kind="{kind}">'
            f'<div class="slide-content">{body}</div></section>'
        )
    html = f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{args.title}</title><style>{CSS}</style></head>
<body><div class="progress-bar" role="progressbar" aria-label="Deck progress"></div><nav class="nav-dots" aria-label="Slide navigation"></nav><main class="deck" tabindex="-1">{''.join(sections)}</main><div id="overview" role="dialog" aria-modal="true" aria-label="Slide overview" aria-hidden="true" tabindex="-1"></div><script>{JS}</script></body>
</html>
"""
    output.write_text(html)
    print(f"Wrote {output} ({args.slides} slides, theme: {args.theme})")


if __name__ == "__main__":
    main()
