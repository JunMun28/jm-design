#!/usr/bin/env python3
"""Create a minimal canonical single-file slide deck scaffold."""

import argparse
from pathlib import Path


CSS = r"""
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--ink:#111;--muted:#666;--accent:#bd03f7;--pad:clamp(1rem,4vw,4rem);--title:clamp(2.5rem,8vw,5.5rem);--h2:clamp(1.8rem,5vw,3.5rem);--body:clamp(.9rem,1.5vw,1.2rem);--ease:cubic-bezier(.16,1,.3,1)}
html,body{height:100%;overflow-x:hidden;background:var(--bg);color:var(--ink);font-family:"Micron Basis","Plus Jakarta Sans",Arial,sans-serif}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
.slide{width:100vw;height:100vh;height:100dvh;overflow:hidden;scroll-snap-align:start;display:flex;position:relative;background:var(--bg)}
.slide-content{width:100%;max-height:100%;overflow:hidden;padding:var(--pad);display:flex;flex-direction:column;justify-content:center;gap:clamp(1rem,2vw,2rem)}
h1{font-size:var(--title);line-height:.95;font-weight:800;max-width:12ch}h2{font-size:var(--h2);line-height:1;font-weight:760;max-width:16ch}p,li{font-size:var(--body);line-height:1.45;max-width:54ch}.muted{color:var(--muted)}.accent{color:var(--accent)}
.progress-bar{position:fixed;top:0;left:0;height:4px;background:var(--accent);width:0;z-index:20}.nav-dots{position:fixed;right:18px;top:50%;transform:translateY(-50%);display:grid;gap:8px;z-index:20}.nav-dots button{width:9px;height:9px;border-radius:999px;border:0;background:rgba(0,0,0,.25)}.nav-dots button.active{background:var(--accent)}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .5s var(--ease),transform .5s var(--ease)}.slide.visible .reveal{opacity:1;transform:none}
#overview{position:fixed;inset:0;z-index:100;display:none;overflow:auto;padding:clamp(1rem,4vw,3rem);background:rgba(246,246,246,.96);color:var(--ink)}#overview[aria-hidden=false]{display:block}.ov-head{display:flex;justify-content:space-between;margin-bottom:1rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}.ov-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:1rem}.ov-card{border:1px solid #ccc;background:white;border-radius:8px;overflow:hidden;text-align:left}.ov-thumb{aspect-ratio:16/10;overflow:hidden;position:relative;background:white}.ov-thumb .clone{position:absolute;top:0;left:0;width:100vw;height:100vh;transform-origin:top left;pointer-events:none}.ov-thumb .clone .reveal{opacity:1!important;transform:none!important}.ov-label{display:flex;justify-content:space-between;padding:.5rem .7rem;font:.7rem ui-monospace,monospace;color:var(--muted)}
@media (max-width:600px),(max-height:600px){.nav-dots{display:none}:root{--pad:clamp(.75rem,4vw,1.5rem)}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}html{scroll-behavior:auto}}
"""


JS = r"""
class SlidePresentation{constructor(){this.slides=[...document.querySelectorAll('.slide')];this.currentSlide=0;this.locked=false;this.overviewOpen=false;this.navDotsContainer=document.querySelector('.nav-dots');this.progressBar=document.querySelector('.progress-bar');this.overview=document.getElementById('overview');this.setupNavDots();this.setupIntersectionObserver();this.setupKeyboardNav();this.setupWheelNav();this.setupTouchNav();this.goTo(0,{immediate:true})}clamp(i){return Math.max(0,Math.min(this.slides.length-1,i))}applySlide(i){const n=this.clamp(i);this.currentSlide=n;this.slides.forEach((s,j)=>{s.classList.toggle('active',j===n);s.classList.toggle('visible',j===n)});this.navDotsContainer.querySelectorAll('button').forEach((d,j)=>{d.classList.toggle('active',j===n);d.setAttribute('aria-current',j===n?'true':'false')});this.progressBar.style.width=`${((n+1)/this.slides.length)*100}%`}goTo(i,o={}){const n=this.clamp(i);if(this.locked&&!o.immediate)return;this.applySlide(n);this.slides[n].scrollIntoView({behavior:o.immediate?'auto':'smooth',block:'start'});if(!o.immediate){this.locked=true;setTimeout(()=>this.locked=false,500)}}next(){this.goTo(this.currentSlide+1)}prev(){this.goTo(this.currentSlide-1)}setupIntersectionObserver(){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)this.applySlide(this.slides.indexOf(e.target))}),{threshold:.6});this.slides.forEach(s=>observer.observe(s))}setupNavDots(){this.navDotsContainer.innerHTML='';this.slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Go to slide ${i+1}`);b.addEventListener('click',()=>this.goTo(i));this.navDotsContainer.appendChild(b)})}setupKeyboardNav(){document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.toggleOverview();return}if(this.overviewOpen)return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();this.next()}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();this.prev()}else if(e.key==='Home'){e.preventDefault();this.goTo(0)}else if(e.key==='End'){e.preventDefault();this.goTo(this.slides.length-1)}})}setupWheelNav(){let acc=0,t=null;window.addEventListener('wheel',e=>{if(this.overviewOpen)return;acc+=e.deltaY+e.deltaX;if(Math.abs(acc)>60){e.preventDefault();acc>0?this.next():this.prev();acc=0}clearTimeout(t);t=setTimeout(()=>acc=0,150)},{passive:false})}setupTouchNav(){let x=0,y=0;window.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX;y=e.changedTouches[0].clientY},{passive:true});window.addEventListener('touchend',e=>{if(this.overviewOpen)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40)(dx<0?this.next():this.prev())},{passive:true})}buildOverview(){this.overview.innerHTML='';const head=document.createElement('div');head.className='ov-head';head.innerHTML=`<span><b>Slide overview</b> / esc to close</span><span>${this.currentSlide+1} / ${this.slides.length}</span>`;const grid=document.createElement('div');grid.className='ov-grid';this.slides.forEach((slide,i)=>{const card=document.createElement('button');card.type='button';card.className=`ov-card${i===this.currentSlide?' active':''}`;card.setAttribute('aria-label',`Go to slide ${i+1}`);const thumb=document.createElement('div');thumb.className='ov-thumb';const clone=slide.cloneNode(true);clone.classList.add('clone','visible');thumb.appendChild(clone);const label=document.createElement('div');label.className='ov-label';label.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b><span>${slide.dataset.slideKind||'slide'}</span>`;card.append(thumb,label);card.addEventListener('click',()=>{this.toggleOverview(false);this.goTo(i)});grid.appendChild(card)});this.overview.append(head,grid);requestAnimationFrame(()=>this.overview.querySelectorAll('.ov-thumb').forEach(thumb=>{thumb.querySelector('.clone').style.transform=`scale(${thumb.clientWidth/window.innerWidth})`}))}toggleOverview(force){this.overviewOpen=typeof force==='boolean'?force:!this.overviewOpen;if(this.overviewOpen){this.buildOverview();this.overview.setAttribute('aria-hidden','false')}else this.overview.setAttribute('aria-hidden','true')}}
window.presentation=new SlidePresentation();
"""


def main():
    parser = argparse.ArgumentParser(description="Create a canonical Micron HTML deck scaffold.")
    parser.add_argument("output", nargs="?", default="micron-slides.html")
    parser.add_argument("--title", default="Presentation title")
    parser.add_argument("--slides", type=int, default=3)
    args = parser.parse_args()
    sections = []
    for i in range(args.slides):
        if i == 0:
            body = f'<h1 class="reveal">{args.title}</h1><p class="reveal muted">Subtitle or context</p>'
            kind = "cover"
        else:
            body = f'<h2 class="reveal">Slide {i + 1}</h2><p class="reveal muted">One clear message for this slide.</p>'
            kind = "content"
        sections.append(f'<section class="slide" data-slide-kind="{kind}"><div class="slide-content">{body}</div></section>')
    html = f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{args.title}</title><style>{CSS}</style></head>
<body><div class="progress-bar"></div><nav class="nav-dots" aria-label="Slide navigation"></nav>{''.join(sections)}<div id="overview" aria-hidden="true"></div><script>{JS}</script></body>
</html>
"""
    Path(args.output).write_text(html)


if __name__ == "__main__":
    main()
