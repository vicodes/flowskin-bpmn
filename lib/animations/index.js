import { theme } from '../theme.js';

const activeAnimations = new Map();

/**
 * Animate specific edges by their BPMN element IDs.
 *
 * @param {object} viewer - bpmn-js viewer instance
 * @param {string[]} edgeIds - array of sequence flow element IDs
 * @param {object} options
 * @param {'parallel'|'sequential'|'loading'} options.type - animation type
 * @param {string} [options.color] - override stroke color
 * @param {number} [options.speed=1] - speed multiplier (0.5 = half speed, 2 = double)
 * @returns {Function} stop function to remove the animation
 */
export function animateEdges(viewer, edgeIds, options = {}) {
  const { type = 'parallel', color, speed = 1 } = options;
  const elementRegistry = viewer.get('elementRegistry');
  const canvas = viewer.get('canvas');
  const T = theme();
  const strokeColor = color || (type === 'loading' ? T.loadingStripe : T.edge);

  const paths = [];
  edgeIds.forEach(id => {
    const element = elementRegistry.get(id);
    if (!element) return;
    const gfx = canvas.getGraphics(element);
    if (!gfx) return;
    const path = gfx.querySelector('path');
    if (path) paths.push(path);
  });

  if (!paths.length) return () => {};

  const animId = 'anim-' + Math.random().toString(36).slice(2, 8);

  if (type === 'parallel') {
    return startParallelAnim(paths, strokeColor, speed, animId);
  } else if (type === 'sequential') {
    return startSequentialAnim(paths, strokeColor, speed, animId);
  } else if (type === 'loading') {
    return startLoadingAnim(paths, strokeColor, speed, animId);
  }

  return () => {};
}

function startParallelAnim(paths, color, speed, animId) {
  const dots = [];

  paths.forEach(path => {
    const pathD = path.getAttribute('d');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', color);
    dot.style.filter = `drop-shadow(0 0 4px ${color})`;
    dot.dataset.animId = animId;
    path.parentNode.appendChild(dot);

    const animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    animMotion.setAttribute('dur', (2.5 / speed) + 's');
    animMotion.setAttribute('repeatCount', 'indefinite');
    animMotion.setAttribute('path', pathD);
    dot.appendChild(animMotion);
    dots.push(dot);
  });

  activeAnimations.set(animId, { dots });

  return function stop() {
    dots.forEach(d => d.remove());
    activeAnimations.delete(animId);
  };
}

function startSequentialAnim(paths, color, speed, animId) {
  const dots = paths.map(path => {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', color);
    dot.style.filter = `drop-shadow(0 0 6px ${color})`;
    dot.style.display = 'none';
    dot.dataset.animId = animId;
    path.parentNode.appendChild(dot);
    return dot;
  });

  let edgeIdx = 0;
  let progress = 0;
  const baseSpeed = 0.04 * speed;
  let rafId = null;

  function step() {
    dots.forEach((d, i) => d.style.display = i === edgeIdx ? '' : 'none');
    const path = paths[edgeIdx];
    if (!path) { edgeIdx = 0; progress = 0; rafId = requestAnimationFrame(step); return; }

    const pathLen = path.getTotalLength();
    const pt = path.getPointAtLength(progress * pathLen);
    dots[edgeIdx].setAttribute('cx', pt.x);
    dots[edgeIdx].setAttribute('cy', pt.y);

    progress += baseSpeed;
    if (progress >= 1) {
      progress = 0;
      edgeIdx++;
      if (edgeIdx >= paths.length) edgeIdx = 0;
    }
    rafId = requestAnimationFrame(step);
  }
  rafId = requestAnimationFrame(step);

  activeAnimations.set(animId, { rafId, dots });

  return function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    dots.forEach(d => d.remove());
    activeAnimations.delete(animId);
  };
}

function startLoadingAnim(paths, color, speed, animId) {
  const stripes = [];

  paths.forEach(path => {
    const pathD = path.getAttribute('d');
    const stripe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    stripe.setAttribute('d', pathD);
    stripe.setAttribute('fill', 'none');
    stripe.setAttribute('stroke', color);
    stripe.setAttribute('stroke-width', '3');
    stripe.setAttribute('stroke-linecap', 'round');
    stripe.setAttribute('stroke-dasharray', '6 5');
    stripe.setAttribute('stroke-dashoffset', '0');
    stripe.style.filter = `drop-shadow(0 0 4px ${color})`;
    stripe.dataset.animId = animId;
    path.parentNode.appendChild(stripe);
    stripes.push(stripe);
  });

  let offset = 0;
  let rafId = null;
  const baseSpeed = 0.5 * speed;

  function step() {
    offset -= baseSpeed;
    stripes.forEach(s => s.setAttribute('stroke-dashoffset', offset));
    rafId = requestAnimationFrame(step);
  }
  rafId = requestAnimationFrame(step);

  activeAnimations.set(animId, { rafId, stripes });

  return function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    stripes.forEach(s => s.remove());
    activeAnimations.delete(animId);
  };
}

/**
 * Stop all active edge animations.
 */
export function stopAllEdgeAnimations() {
  activeAnimations.forEach((data, id) => {
    if (data.rafId) cancelAnimationFrame(data.rafId);
    if (data.dots) data.dots.forEach(d => d.remove());
    if (data.stripes) data.stripes.forEach(s => s.remove());
  });
  activeAnimations.clear();
}
