import { POST_PRESETS, POST_CATEGORIES, postsForCategory } from './presets.mjs?v=natural-1';
const $ = id => document.getElementById(id);
const tabs = [...document.querySelectorAll('[data-panel]')];
function openPanel(tab, focus = false) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
    $('panel-' + item.dataset.panel).hidden = !active;
  }
  document.querySelector(".panel-scroll").scrollTop = 0;
  if (focus) tab.focus();
}
for (const tab of tabs) {
  tab.addEventListener('click', () => openPanel(tab));
  tab.addEventListener('keydown', event => {
    const index = tabs.indexOf(tab); let next;
    if (event.key === 'ArrowLeft') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowRight') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); openPanel(tabs[next], true); }
  });
}
function syncColor() {
  const color = $('color').value;
  $('color-value').textContent = color.toUpperCase();
  for (const swatch of document.querySelectorAll('[data-color]')) swatch.setAttribute('aria-pressed', String(swatch.dataset.color === color));
}
for (const swatch of document.querySelectorAll('[data-color]')) swatch.addEventListener('click', () => {
  $('color').value = swatch.dataset.color; $('color').dispatchEvent(new Event('input', { bubbles: true }));
});
$('color').addEventListener('input', syncColor);
function syncSelection() {
  for (const card of document.querySelectorAll('[data-preset]')) card.setAttribute('aria-pressed', String(card.dataset.preset === $('post-preset').value));
}
function renderCards() {
  $('preset-grid').replaceChildren();
  for (const post of postsForCategory($('post-category').value)) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'preset-card'; card.dataset.preset = post.id;
    card.setAttribute('aria-label', 'تطبيق: ' + post.lines.join(' '));
    const image = document.createElement('img'); image.src = `./backgrounds/${post.background}.jpg`; image.alt = ''; image.loading = 'lazy';
    const content = document.createElement('span'); content.className = 'card-content';
    const category = document.createElement('span'); category.className = 'card-category'; category.textContent = post.category;
    const copy = document.createElement('span'); copy.className = 'card-copy';
    for (const [i, line] of post.lines.entries()) { if (i) copy.append(document.createElement('br')); copy.append(document.createTextNode(line)); }
    const check = document.createElement('span'); check.className = 'card-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
    content.append(category, copy); card.append(image, content, check);
    card.addEventListener('click', () => { $('post-preset').value = post.id; $('post-preset').dispatchEvent(new Event('change')); $('apply-post').click(); });
    $('preset-grid').append(card);
  }
  syncSelection();
}
$('post-category').addEventListener('change', renderCards);
$('post-preset').addEventListener('change', syncSelection);
$('apply-post').addEventListener('click', () => {
  syncColor(); syncSelection();
  const post = POST_PRESETS.find(p => p.id === $('post-preset').value);
  if (post && $('preset-photo').checked) {
    $('photo-name').textContent = 'الخلفية المقترحة · ' + post.title;
    syncBackground(post.background);
  }
});
$('photo').addEventListener('change', () => {
  if (!$('photo').files[0]) return;
  $('photo-name').textContent = $('photo').files[0].name;
  syncBackground('');
});
const backgrounds = POST_PRESETS;
function syncBackground(key) {
  for (const card of document.querySelectorAll('[data-background]')) card.setAttribute('aria-pressed', String(card.dataset.background === key));
}
for (const post of backgrounds) {
  const card = document.createElement('button'); card.type = 'button'; card.className = 'background-card'; card.dataset.background = post.background;
  card.setAttribute('aria-label', 'خلفية ' + post.title); card.setAttribute('aria-pressed', 'false');
  const image = document.createElement('img'); image.src = `./backgrounds/${post.background}.jpg`; image.alt = ''; image.loading = 'lazy';
  const title = document.createElement('span'); title.textContent = post.title; card.append(image, title);
  card.addEventListener('click', () => document.dispatchEvent(new CustomEvent('studio:background', { detail: post.background })));
  $('background-grid').append(card);
}
document.addEventListener('studio:background-ready', event => {
  syncBackground(event.detail); $('photo-name').textContent = 'خلفية جاهزة · ' + backgrounds.find(p => p.background === event.detail)?.title;
});
renderCards(); syncColor();
