// Minimal loader that NEVER touches the hero (it's inline)
const BASE = new URL('.', window.location.href);

async function loadSection(id, relPath) {
  const host = document.getElementById(id);
  if (!host) return;
  if (host.hasAttribute('data-lock') || host.children.length) return; // don't overwrite inline hero
  try {
    const url = new URL(relPath, BASE);
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    host.innerHTML = await res.text();
  } catch (e) {
    host.innerHTML = `<div class="wrap muted">Failed to load ${relPath}: ${e.message}</div>`;
    console.warn('Partial load failed:', relPath, e);
  }
}

function parallax() { /* no-op (we removed glow layers) */ }

// Reveal on scroll for non-hero sections
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); }});
},{threshold:.18});

// Render preview gallery from data/projects.json
async function renderGallery(targetId, limit){
  const host = document.getElementById(targetId);
  if (!host) return;
  try{
    const url = new URL('data/projects.json', new URL('.', window.location.href));
    const res = await fetch(url, { cache: 'no-cache' });
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const items = await res.json();
    const slice = typeof limit === 'number' ? items.slice(0, limit) : items;

    const cards = slice.map(x => `
      <div class="card hthumb">
        <img loading="lazy" src="${x.image}" alt="${x.title}">
        <div class="tag">${x.title}</div>
      </div>
    `).join('');

    // Build marquee track: duplicate once for seamless loop
    host.classList.add('marquee');                 // add marquee mode
    host.innerHTML = `<div class="track">${cards}${cards}</div>`;

    attachMarqueeControls(host);                   // enable pause/dir flip on input
  }catch(e){
    host.innerHTML = '<div class="wrap muted">Could not load gallery.</div>';
    console.warn('Gallery load failed:', e);
  }
}
function attachMarqueeControls(scroller){
  // Default direction: LEFT → RIGHT (reverse). 
  // If you prefer the other way, change to: scroller.classList.remove('rev');
  scroller.classList.remove('rev');

  // Keep animation running on mobile; pause only while touching/dragging
  let down = false, startX = 0, lastX = 0;

  // Desktop: pause on hover (has no effect on mobile)
  scroller.addEventListener('mouseenter', () => scroller.classList.add('paused'));
  scroller.addEventListener('mouseleave', () => scroller.classList.remove('paused'));

  // Unified pointer events (works for mouse + touch + pen)
  scroller.addEventListener('pointerdown', (e) => {
    down = true;
    startX = lastX = e.clientX;
    scroller.classList.add('paused');
    try { scroller.setPointerCapture(e.pointerId); } catch {}
  });

  scroller.addEventListener('pointermove', (e) => {
    if (!down) return;
    lastX = e.clientX;
  });

  function endDrag(e){
    if (!down) return;
    const movedLeft = lastX < startX;       // finger/mouse moved left
    // If user drags left, let content flow to the RIGHT afterwards
    scroller.classList.toggle('rev', movedLeft);
    down = false;
    scroller.classList.remove('paused');
    try { scroller.releasePointerCapture(e?.pointerId); } catch {}
  }

  scroller.addEventListener('pointerup', endDrag);
  scroller.addEventListener('pointercancel', endDrag);
}


  // Touch: pause during swipe, flip direction by swipe direction
  scroller.addEventListener('touchstart', e=>{
    const t = e.touches[0];
    startX = lastX = t.clientX;
    scroller.classList.add('paused');
  }, {passive:true});

  scroller.addEventListener('touchmove', e=>{
    const t = e.touches[0];
    lastX = t.clientX;
  }, {passive:true});

  scroller.addEventListener('touchend', ()=>{
    const movedLeft = lastX < startX;
    scroller.classList.toggle('rev', movedLeft);
    scroller.classList.remove('paused');
  });
}

function attachAutoScroller(scroller){
  let dir = 1;               // 1 = forward/right, -1 = back/left
  let speed = 0.4;           // px per frame; tweak if you want
  let rafId = null;
  let paused = false;

  // Auto ping-pong scroll
  const tick = () => {
    if (!paused) {
      scroller.scrollLeft += dir * speed;
      const max = scroller.scrollWidth - scroller.clientWidth;
      if (scroller.scrollLeft <= 0) dir = 1;
      if (scroller.scrollLeft >= max) dir = -1;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  // Pause on hover (desktop)
  scroller.addEventListener('mouseenter', ()=> paused = true);
  scroller.addEventListener('mouseleave', ()=> paused = false);

  // Desktop drag to scroll + set direction
  let isDown=false, startX=0, startScroll=0, lastX=0;
  scroller.addEventListener('mousedown', e=>{
    isDown=true; paused=true; startX=e.pageX; lastX=e.pageX; startScroll=scroller.scrollLeft;
  });
  window.addEventListener('mouseup', ()=>{
    if(!isDown) return;
    isDown=false;
    dir = (lastX < startX) ? 1 : -1;  // if dragged left -> move right, and vice versa
    paused=false;
  });
  scroller.addEventListener('mousemove', e=>{
    if(!isDown) return;
    e.preventDefault();
    const delta = e.pageX - startX;
    lastX = e.pageX;
    scroller.scrollLeft = startScroll - delta;
  });

  // Touch swipe to set direction
  let tStartX=0, tLastX=0, tActive=false;
  scroller.addEventListener('touchstart', e=>{
    const t = e.touches[0];
    tActive=true; paused=true; tStartX=t.clientX; tLastX=t.clientX;
  }, {passive:true});
  scroller.addEventListener('touchmove', e=>{
    if(!tActive) return;
    const t = e.touches[0];
    const delta = t.clientX - tStartX;
    tLastX = t.clientX;
    scroller.scrollLeft -= delta * 0.6;  // finger follows content
    tStartX = t.clientX;                 // incremental
  }, {passive:true});
  scroller.addEventListener('touchend', ()=>{
    if(!tActive) return;
    dir = (tLastX < scroller.clientWidth/2) ? dir : dir; // dir already set below
    tActive=false;
    // Decide direction based on last swipe motion
    // If last movement was left (content moved right) -> forward
    // We track using last vs current; simple heuristic:
    // (We don't have current here, so rely on last incremental delta sign)
    // For robustness, just infer from recent movement by comparing scrollLeft trend:
    // If user swiped left (finger moved left), we increased scrollLeft recently.
    // To keep it simple, base on last delta we applied in touchmove:
    // Already handled by incremental logic; we can approximate with:
    dir = (tLastX < scroller.clientWidth/2) ? dir : dir; // keep current
    paused=false;
  });
}


window.addEventListener('DOMContentLoaded', ()=>{
  // Load partials (not hero)
  loadSection('do','partials/whatwedo.html');
  loadSection('flow','partials/flow.html');
  loadSection('cta','partials/cta.html');

  // Reveal
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // Gallery
  if (document.getElementById('gallery-preview')) renderGallery('gallery-preview', 12);
  if (document.getElementById('gallery')) renderGallery('gallery');
});




