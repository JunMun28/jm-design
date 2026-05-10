#!/usr/bin/env python3
"""Create a minimal Micron engineering-dark slide deck scaffold."""

import argparse
from pathlib import Path


CSS = r"""
*{box-sizing:border-box;margin:0;padding:0}
:root{--black:#000;--white:#fff;--gray-a:#262626;--gray-b:#4d4d4d;--gray-c:#8c8c8c;--gray-d:#bfbfbf;--gray-e:#e6e6e6;--purple:#bd03f7;--purple-b:#ff8cff;--blue:#2044ff;--cyan:#32c8ff;--radius:8px;--page-bg:#151515;--slide-w:1600px;--slide-h:900px;--margin:72px;--slide-scale:1;--ease:cubic-bezier(.16,1,.3,1)}
html,body{height:100%;overflow-x:hidden;background:var(--page-bg);color:var(--white);font-family:Arial,Helvetica,sans-serif;scrollbar-width:none}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
.deck{display:block}
.slide{width:100vw;height:100vh;height:100dvh;overflow:hidden;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;position:relative;background:linear-gradient(135deg,rgba(32,68,255,.10),transparent 28%),radial-gradient(circle at 92% 10%,rgba(189,3,247,.18),transparent 32%),var(--black)}
.slide-content{position:relative;width:var(--slide-w);height:var(--slide-h);flex:0 0 auto;transform:scale(var(--slide-scale));transform-origin:center;z-index:2}
.content{position:absolute;inset:var(--margin);display:flex;flex-direction:column;justify-content:center}
.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:42px}
.cover-brand{position:absolute;top:54px;left:var(--margin);z-index:3;width:126px;height:auto;opacity:.94}
.section-label,.eyebrow{font-size:15px;color:var(--purple);font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px}
h1{font-size:64px;line-height:1.02;font-weight:800;max-width:700px}h2{font-size:42px;line-height:1.08;font-weight:800;max-width:900px}h3{font-size:25px;line-height:1.2;font-weight:800}p,li{font-size:20px;line-height:1.38;color:var(--gray-e);max-width:920px}.subtitle{font-size:24px;line-height:1.35;color:var(--gray-d);max-width:900px;margin-top:18px}.accent{color:var(--purple)}
.accent-line{width:84px;height:7px;background:var(--purple);border-radius:999px;margin-top:28px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:42px}.card{position:relative;overflow:hidden;border:1px solid rgba(230,230,230,.18);border-radius:var(--radius);padding:30px;background:linear-gradient(180deg,rgba(48,48,48,.96),rgba(20,20,20,.98));box-shadow:0 18px 42px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.10)}.card::before{content:"";position:absolute;inset:0 0 auto;height:1px;background:linear-gradient(90deg,rgba(50,200,255,0),rgba(255,255,255,.28),rgba(189,3,247,0))}.card.accented{border-color:rgba(255,140,255,.38);background:linear-gradient(180deg,rgba(70,30,82,.96),rgba(20,13,23,.98))}
.metric{font-size:82px;line-height:.95;font-weight:800}.metric-label{font-size:18px;color:var(--gray-d);margin-top:12px;line-height:1.35}
.slide-number{position:absolute;right:34px;bottom:28px;font-size:13px;color:rgba(255,255,255,.45);letter-spacing:.04em}.tiny-note{position:absolute;bottom:38px;left:var(--margin);font-size:15px;color:var(--gray-c)}
.progress-bar{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--blue),var(--purple),var(--purple-b));box-shadow:0 0 18px rgba(189,3,247,.48);width:0;z-index:20}.nav-dots{position:fixed;right:18px;top:50%;transform:translateY(-50%);display:grid;gap:8px;z-index:20}.nav-dots button{width:8px;height:8px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.32);background:rgba(255,255,255,.20);cursor:pointer}.nav-dots button.active{background:var(--purple);border-color:var(--purple-b);box-shadow:0 0 12px rgba(189,3,247,.72)}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .5s var(--ease),transform .5s var(--ease)}.slide.visible .reveal{opacity:1;transform:none}
#overview{position:fixed;inset:0;z-index:100;display:none;overflow:auto;padding:clamp(24px,4vw,60px);background:rgba(0,0,0,.92);color:var(--white);backdrop-filter:blur(12px)}#overview[aria-hidden=false]{display:block}.ov-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin:0 auto 28px;max-width:1280px;color:var(--gray-c);font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.ov-head b{color:var(--white)}.ov-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:clamp(16px,2vw,24px);max-width:1280px;margin:0 auto}.ov-card{cursor:pointer;overflow:hidden;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(255,255,255,.05);text-align:left}.ov-card:hover,.ov-card:focus-visible,.ov-card.active{border-color:var(--purple);outline:none;transform:translateY(-2px)}.ov-thumb{aspect-ratio:16/9;overflow:hidden;position:relative;background:var(--black)}.ov-thumb .clone{position:absolute;top:0;left:0;width:100vw;height:100vh;transform-origin:top left;pointer-events:none}.ov-thumb .clone .reveal{opacity:1!important;transform:none!important}.ov-label{display:flex;justify-content:space-between;padding:8px 10px;color:var(--gray-c);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.ov-label b{color:var(--white)}
@media (max-width:600px),(max-height:600px){.nav-dots{display:none}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}html{scroll-behavior:auto}}
@media print{body{background:white}.slide{width:var(--slide-w);height:var(--slide-h);page-break-after:always}.slide-content{transform:none}.progress-bar,.nav-dots,#overview{display:none!important}}
"""


JS = r"""
function updateSlideScale(){document.documentElement.style.setProperty('--slide-scale',Math.min(1,window.innerWidth/1600,window.innerHeight/900).toFixed(4))}
updateSlideScale();window.addEventListener('resize',updateSlideScale);
class SlidePresentation{constructor(){this.slides=[...document.querySelectorAll('.slide')];this.currentSlide=0;this.locked=false;this.overviewOpen=false;this.navDotsContainer=document.querySelector('.nav-dots');this.progressBar=document.querySelector('.progress-bar');this.overview=document.getElementById('overview');this.setupNavDots();this.setupIntersectionObserver();this.setupKeyboardNav();this.setupWheelNav();this.setupTouchNav();this.goTo(0,{immediate:true})}clamp(i){return Math.max(0,Math.min(this.slides.length-1,i))}applySlide(i){const n=this.clamp(i);this.currentSlide=n;this.slides.forEach((s,j)=>{s.classList.toggle('active',j===n);s.classList.toggle('visible',j===n)});this.navDotsContainer.querySelectorAll('button').forEach((d,j)=>{d.classList.toggle('active',j===n);d.setAttribute('aria-current',j===n?'true':'false')});this.progressBar.style.width=`${((n+1)/this.slides.length)*100}%`}goTo(i,o={}){const n=this.clamp(i);if(this.locked&&!o.immediate)return;this.applySlide(n);this.slides[n].scrollIntoView({behavior:o.immediate?'auto':'smooth',block:'start'});if(!o.immediate){this.locked=true;setTimeout(()=>this.locked=false,500)}}next(){this.goTo(this.currentSlide+1)}prev(){this.goTo(this.currentSlide-1)}setupIntersectionObserver(){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)this.applySlide(this.slides.indexOf(e.target))}),{threshold:.6});this.slides.forEach(s=>observer.observe(s))}setupNavDots(){this.navDotsContainer.innerHTML='';this.slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Go to slide ${i+1}`);b.addEventListener('click',()=>this.goTo(i));this.navDotsContainer.appendChild(b)})}setupKeyboardNav(){document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.toggleOverview();return}if(this.overviewOpen)return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();this.next()}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();this.prev()}else if(e.key==='Home'){e.preventDefault();this.goTo(0)}else if(e.key==='End'){e.preventDefault();this.goTo(this.slides.length-1)}})}setupWheelNav(){let acc=0,t=null;window.addEventListener('wheel',e=>{if(this.overviewOpen)return;acc+=e.deltaY+e.deltaX;if(Math.abs(acc)>60){e.preventDefault();acc>0?this.next():this.prev();acc=0}clearTimeout(t);t=setTimeout(()=>acc=0,150)},{passive:false})}setupTouchNav(){let x=0,y=0;window.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX;y=e.changedTouches[0].clientY},{passive:true});window.addEventListener('touchend',e=>{if(this.overviewOpen)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40)(dx<0?this.next():this.prev());else if(Math.abs(dy)>40)(dy<0?this.next():this.prev())},{passive:true})}buildOverview(){this.overview.innerHTML='';const head=document.createElement('div');head.className='ov-head';head.innerHTML=`<span><b>Slide overview</b> / esc to close</span><span>${this.currentSlide+1} / ${this.slides.length}</span>`;const grid=document.createElement('div');grid.className='ov-grid';this.slides.forEach((slide,i)=>{const card=document.createElement('button');card.type='button';card.className=`ov-card${i===this.currentSlide?' active':''}`;card.setAttribute('aria-label',`Go to slide ${i+1}`);const thumb=document.createElement('div');thumb.className='ov-thumb';const clone=slide.cloneNode(true);clone.classList.add('clone','visible');thumb.appendChild(clone);const label=document.createElement('div');label.className='ov-label';label.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b><span>${slide.dataset.slideKind||'slide'}</span>`;card.append(thumb,label);card.addEventListener('click',()=>{this.toggleOverview(false);this.goTo(i,{immediate:true})});grid.appendChild(card)});this.overview.append(head,grid);requestAnimationFrame(()=>this.overview.querySelectorAll('.ov-thumb').forEach(thumb=>{thumb.querySelector('.clone').style.transform=`scale(${thumb.clientWidth/window.innerWidth})`}))}toggleOverview(force){this.overviewOpen=typeof force==='boolean'?force:!this.overviewOpen;if(this.overviewOpen){this.buildOverview();this.overview.setAttribute('aria-hidden','false')}else this.overview.setAttribute('aria-hidden','true')}}
window.presentation=new SlidePresentation();
"""


def main():
    parser = argparse.ArgumentParser(description="Create a Micron engineering-dark HTML deck scaffold.")
    parser.add_argument("output", nargs="?", default="micron-slides.html")
    parser.add_argument("--title", default="Presentation title")
    parser.add_argument("--slides", type=int, default=3)
    args = parser.parse_args()
    sections = []
    logo = '<img class="cover-brand" src="assets/micron-logo-white-tm-rgb.png" alt="Micron" />' if Path("assets/micron-logo-white-tm-rgb.png").exists() else ""
    for i in range(args.slides):
        if i == 0:
            body = f'{logo}<div class="content"><div class="eyebrow reveal">Micron engineering theme</div><h1 class="reveal">{args.title}</h1><p class="subtitle reveal">Subtitle or context for a practical engineering deck.</p><div class="accent-line reveal"></div></div><div class="tiny-note">Clear, structured, reusable</div><div class="slide-number">01 / Cover</div>'
            kind = "cover"
        else:
            body = f'<div class="content"><div class="topbar"><div><div class="section-label reveal">Section</div><h2 class="reveal">Slide {i + 1}</h2><p class="subtitle reveal">One clear message for this slide.</p></div></div><div class="grid-3 reveal"><div class="card accented"><div class="metric">01</div><div class="metric-label">Active signal</div></div><div class="card"><h3>Point one</h3><p style="margin-top:14px;">Concrete detail tied to the work.</p></div><div class="card"><h3>Point two</h3><p style="margin-top:14px;">Owner, gate, or next action.</p></div></div></div><div class="slide-number">{i + 1:02d} / Content</div>'
            kind = "content"
        sections.append(f'<section class="slide dark" data-slide-kind="{kind}"><div class="slide-content">{body}</div></section>')
    html = f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{args.title}</title><style>{CSS}</style></head>
<body><div class="progress-bar"></div><nav class="nav-dots" aria-label="Slide navigation"></nav><main class="deck">{''.join(sections)}</main><div id="overview" aria-hidden="true"></div><script>{JS}</script></body>
</html>
"""
    Path(args.output).write_text(html)


if __name__ == "__main__":
    main()
