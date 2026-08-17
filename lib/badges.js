import { create as svgCreate, attr as svgAttr, append as svgAppend } from 'tiny-svg';

const BADGE_ATTR = 'data-badge';
const GLOW_CLASS = 'flowskin-incident-glow';

function removeBadge(gfx) {
  const existing = gfx.querySelector(`[${BADGE_ATTR}]`);
  if (existing) existing.remove();
  gfx.classList.remove(GLOW_CLASS);
}

function getShapeSize(gfx) {
  const shape = gfx.querySelector('.djs-visual > *');
  if (!shape) return { w: 36, h: 36 };
  const w = parseFloat(shape.getAttribute('width') || shape.getAttribute('r') * 2 || 36);
  const h = parseFloat(shape.getAttribute('height') || shape.getAttribute('r') * 2 || 36);
  return { w, h };
}

function addBadge(gfx, state) {
  removeBadge(gfx);

  const { w } = getShapeSize(gfx);
  const g = svgCreate('g');
  svgAttr(g, { [BADGE_ATTR]: state });

  // Position badge outside top-right corner
  const cx = w + 6;
  const cy = -6;
  const r = 9;

  if (state === 'running') {
    // Green dot with spinning loader
    const circle = svgCreate('circle');
    svgAttr(circle, { cx, cy, r, fill: '#22c55e' });
    svgAppend(g, circle);
    // Circular arc spinner
    const arc = svgCreate('path');
    const ar = r - 3;
    svgAttr(arc, {
      d: `M${cx},${cy - ar} A${ar},${ar} 0 1,1 ${cx - ar},${cy}`,
      fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round',
      class: 'flowskin-spinner',
      'transform-origin': `${cx}px ${cy}px`,
    });
    svgAppend(g, arc);
  } else if (state === 'completed') {
    // Gray circle with checkmark
    const circle = svgCreate('circle');
    svgAttr(circle, { cx, cy, r, fill: '#6b7280' });
    svgAppend(g, circle);
    const check = svgCreate('path');
    svgAttr(check, { d: `M${cx - 4},${cy} L${cx - 1},${cy + 3} L${cx + 4},${cy - 3}`, fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svgAppend(g, check);
  } else if (state === 'incident') {
    // Red circle with ⚡ bolt and glow
    const circle = svgCreate('circle');
    svgAttr(circle, { cx, cy, r, fill: '#ef4444', stroke: '#fca5a5', 'stroke-width': 1.5 });
    svgAppend(g, circle);
    // Lightning bolt
    const bolt = svgCreate('path');
    svgAttr(bolt, { d: `M${cx + 1},${cy - 5} L${cx - 2},${cy + 1} L${cx + 1},${cy + 1} L${cx - 1},${cy + 5}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svgAppend(g, bolt);
    gfx.classList.add(GLOW_CLASS);
  } else if (state === 'hold') {
    // Yellow circle with pause bars
    const circle = svgCreate('circle');
    svgAttr(circle, { cx, cy, r, fill: '#eab308' });
    svgAppend(g, circle);
    const bar1 = svgCreate('rect');
    svgAttr(bar1, { x: cx - 4, y: cy - 4, width: 3, height: 8, rx: 1, fill: '#fff' });
    svgAppend(g, bar1);
    const bar2 = svgCreate('rect');
    svgAttr(bar2, { x: cx + 1, y: cy - 4, width: 3, height: 8, rx: 1, fill: '#fff' });
    svgAppend(g, bar2);
  }

  const visual = gfx.querySelector('.djs-visual');
  if (visual) svgAppend(visual, g);
}

/**
 * Set node states on the diagram.
 * @param {object} viewer - bpmn-js viewer instance
 * @param {object} states - map of elementId -> 'running'|'completed'|'incident'|'hold' or { state, count }
 */
export function setNodeStates(viewer, states) {
  const elementRegistry = viewer.get('elementRegistry');
  const canvas = viewer.get('canvas');

  for (const [id, config] of Object.entries(states)) {
    const element = elementRegistry.get(id);
    if (!element) continue;
    const gfx = canvas.getGraphics(element);
    if (!gfx) continue;

    const state = typeof config === 'string' ? config : config.state;
    addBadge(gfx, state);
  }
}

/**
 * Clear badges from specific nodes or all nodes.
 * @param {object} viewer
 * @param {string[]} [elementIds] - if omitted, clears all
 */
export function clearNodeStates(viewer, elementIds) {
  const elementRegistry = viewer.get('elementRegistry');
  const canvas = viewer.get('canvas');

  const ids = elementIds || elementRegistry.getAll().map(e => e.id);
  for (const id of ids) {
    const element = elementRegistry.get(id);
    if (!element) continue;
    const gfx = canvas.getGraphics(element);
    if (gfx) removeBadge(gfx);
  }
}
