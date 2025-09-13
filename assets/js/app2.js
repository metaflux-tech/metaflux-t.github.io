// Resolve URLs robustly for both root sites and project sites
const BASE = new URL('.', window.location.href);

async function loadSection(id, relPath){
  const host = document.getElementById(id);
  if(!host) return;
  try{
    const url = new URL(relPath, BASE);
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    host.innerHTML = await res.text();
  }catch(e){
    host.innerHTML = `<div class="wrap muted">Failed to load ${relPath}: ${e.message}</div>`;
    console.warn('Partial load failed:', relPath, e);
  }
}

(function(){
  if(document.getElementById('hero')) /*loadSection('hero','partials/hero.html');*/
  if(document.getElementById('do')) loadSection('do','partials/whatwedo.html');
  if(document.getElementById('flow')) loadSection('flow','partials/flow.html');
  if(document.getElementById('cta')) loadSection('cta','partials/cta.html');
})();

function parallax(){
  const layers = document.querySelectorAll('[data-parallax]');
  const y = window.scrollY || window.pageYOffset;
  layers.forEach(el=>{ const s = parseFloat(el.getAttribute('data-parallax'))||0; el.style.transform = `translateY(${y * s}px)`; });
}
window.addEventListener('scroll', parallax, {passive:true});

const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target);} });
},{threshold:.18});
window.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  parallax();
});

async function renderGallery(targetId, limit){
  const host = document.getElementById(targetId);
  if(!host) return;
  try{
    const url = new URL('data/projects.json', BASE);
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const items = await res.json();
    const slice = typeof limit === 'number' ? items.slice(0, limit) : items;
    host.innerHTML = slice.map(x => `
      <div class="card">
        <img loading="lazy" src="${x.image}" alt="${x.title}">
        <div class="tag">${x.title}</div>
      </div>
    `).join('');

    let isDown=false,startX,scrollLeft; const scroller=host;
    scroller.addEventListener('mousedown',e=>{isDown=true;startX=e.pageX - scroller.offsetLeft;scrollLeft=scroller.scrollLeft});
    ['mouseleave','mouseup'].forEach(ev=>scroller.addEventListener(ev,()=>{isDown=false}));
    scroller.addEventListener('mousemove',e=>{ if(!isDown) return; e.preventDefault(); const x=e.pageX - scroller.offsetLeft; const walk=(x-startX)*1.2; scroller.scrollLeft = scrollLeft - walk; });
  }catch(e){
    host.innerHTML = '<div class="wrap muted">Could not load gallery.</div>';
    console.warn('Gallery load failed:', e);
  }
}

window.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('gallery')) renderGallery('gallery');
  if(document.getElementById('gallery-preview')) renderGallery('gallery-preview', 6);
});

