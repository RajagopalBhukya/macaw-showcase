const sequence = document.querySelector('.sequence');
const canvas = document.querySelector('#sequence-canvas');
const context = canvas.getContext('2d', { alpha: false });
const progressFill = document.querySelector('#progress-fill');
const progressNumber = document.querySelector('#progress-number');
const storyIndex = document.querySelector('#story-index');
const storyTitle = document.querySelector('#story-title');
const storyDescription = document.querySelector('#story-description');
const storyCopy = document.querySelector('.sequence-copy');
const scrollHint = document.querySelector('.hero-scroll-hint');
const chapters = [
  { at: 0, index: '01 / THE ENCOUNTER', title: 'A moment<br /><em>takes flight.</em>', description: 'In the hush of the forest, a flash of blue and gold catches the light.' },
  { at: .23, index: '02 / THE AWAKENING', title: 'The forest<br /><em>holds its breath.</em>', description: 'Wings unfold. For one beautiful second, the canopy stands still.' },
  { at: .48, index: '03 / THE FLIGHT', title: 'Color finds<br /><em>the open sky.</em>', description: 'A rush of feathers carries the macaw beyond the familiar branches.' },
  { at: .75, index: '04 / THE RETURN', title: 'The wild<br /><em>comes home.</em>', description: 'The journey settles where it began, with the forest alive around it.' }
];
let activeChapter = 0;
const frameCount = 240;
const cache = new Map();
const pending = new Set();
let currentFrame = -1;
let requestedFrame = 0;
let raf = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function frameUrl(index) { return `assets/frames/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`; }
function loadFrame(index) {
  if (index < 0 || index >= frameCount || cache.has(index) || pending.has(index)) return;
  pending.add(index);
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => { pending.delete(index); cache.set(index, img); if (index === requestedFrame || currentFrame < 0) draw(); };
  img.onerror = () => pending.delete(index);
  img.src = frameUrl(index);
}
function resizeCanvas() {
  const pixelRatio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * pixelRatio);
  canvas.height = Math.round(canvas.clientHeight * pixelRatio);
  draw();
}
function draw() {
  let image = cache.get(requestedFrame);
  if (!image) {
    for (let step = 1; step < 20 && !image; step++) image = cache.get(requestedFrame - step) || cache.get(requestedFrame + step);
  }
  if (!image || !canvas.width || !canvas.height) return;
  const mobile = canvas.clientWidth < 761;
  const scale = (mobile ? Math.min : Math.max)(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.fillStyle = '#092820';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  currentFrame = requestedFrame;
}
function update() {
  raf = 0;
  const distance = Math.max(sequence.offsetHeight - innerHeight, 1);
  const progress = Math.max(0, Math.min(1, -sequence.getBoundingClientRect().top / distance));
  requestedFrame = reducedMotion.matches ? 65 : Math.min(frameCount - 1, Math.round(progress * (frameCount - 1)));
  progressFill.style.width = `${Math.round(progress * 100)}%`;
  progressNumber.value = `${Math.round(progress * 100).toString().padStart(2, '0')}%`;
  const nextChapter = chapters.reduce((current, chapter, index) => progress >= chapter.at ? index : current, 0);
  if (nextChapter !== activeChapter) {
    activeChapter = nextChapter;
    const chapter = chapters[nextChapter];
    storyIndex.textContent = chapter.index;
    storyTitle.innerHTML = chapter.title;
    storyDescription.textContent = chapter.description;
    storyCopy.classList.remove('story-changing');
    void storyCopy.offsetWidth;
    if (!reducedMotion.matches) storyCopy.classList.add('story-changing');
  }
  scrollHint.style.opacity = progress > .04 ? '0' : '1';
  if (requestedFrame !== currentFrame) draw();
  loadFrame(requestedFrame);
  for (let offset = 1; offset <= 5; offset++) loadFrame(requestedFrame + offset);
}
function scheduleUpdate() { if (!raf) raf = requestAnimationFrame(update); }
loadFrame(0);
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => { resizeCanvas(); scheduleUpdate(); });
reducedMotion.addEventListener('change', scheduleUpdate);
resizeCanvas(); scheduleUpdate();

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuButton.addEventListener('click', () => {
  const opened = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opened));
  menuButton.setAttribute('aria-label', opened ? 'Close menu' : 'Open menu');
  navigation.classList.toggle('open', opened);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) { navigation.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open menu'); }
});
