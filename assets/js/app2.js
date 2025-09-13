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
    const url = new URL('data/projects.json', BASE);
    const res = await fetch(url, { cache: 'no-cache' });
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const items = await res.json();
    const slice = typeof limit === 'number' ? items.slice(0, limit) : items;
    host.innerHTML = slice.map(x => `
      <div class="card hthumb">
        <img loading="lazy" src="${x.image}" alt="${x.title}">
        <div class="tag">${x.title}</div>
      </div>
    `).join('');
  }catch(e){
    host.innerHTML = '<div class="wrap muted">Could not load gallery.</div>';
    console.warn('Gallery load failed:', e);
  }
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
