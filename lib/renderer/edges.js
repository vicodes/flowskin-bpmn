import { append as svgAppend, create as svgCreate, attr as svgAttr } from 'tiny-svg';
import { theme } from '../theme.js';
import { toBezier } from '../utils.js';

export function drawAssociation(parentNode, element) {
  const wp = element.waypoints;
  const d = toBezier(wp);
  const T = theme();

  // Dotted, thin, muted line — clearly not a sequence flow
  const path = svgCreate('path');
  svgAttr(path, {
    d, fill: 'none',
    stroke: T.nodeBorder,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-dasharray': '3 4',
    opacity: '0.7',
  });
  svgAppend(parentNode, path);

  // Small open arrowhead at end for data output associations
  if (element.type === 'bpmn:DataOutputAssociation' || element.type === 'bpmn:DataInputAssociation') {
    const last = wp[wp.length - 1];
    const prev = wp[wp.length - 2];
    const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
    const s = 6;

    const arrow = svgCreate('polyline');
    svgAttr(arrow, {
      points: `${last.x - s * Math.cos(angle - 0.5)},${last.y - s * Math.sin(angle - 0.5)} ${last.x},${last.y} ${last.x - s * Math.cos(angle + 0.5)},${last.y - s * Math.sin(angle + 0.5)}`,
      fill: 'none',
      stroke: T.nodeBorder,
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      opacity: '0.7',
    });
    svgAppend(parentNode, arrow);
  }

  return path;
}

export function drawEdge(parentNode, element) {
  const wp = element.waypoints;
  const d = toBezier(wp);
  const T = theme();
  const first = wp[0];
  const last = wp[wp.length - 1];

  // Static edge path
  const basePath = svgCreate('path');
  svgAttr(basePath, { d, fill: 'none', stroke: T.edge, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  svgAppend(parentNode, basePath);

  // Default flow marker
  const bo = element.businessObject;
  const source = element.source;
  const isDefault = source && source.businessObject && source.businessObject.default && source.businessObject.default.id === bo.id;

  if (isDefault) {
    const second = wp.length > 1 ? wp[1] : last;
    const angle = Math.atan2(second.y - first.y, second.x - first.x);
    const mx = first.x + 20 * Math.cos(angle);
    const my = first.y + 20 * Math.sin(angle);
    const s = 5;

    const chevron = svgCreate('polyline');
    svgAttr(chevron, {
      points: `${mx - s * Math.cos(angle) + s * Math.cos(angle + Math.PI/2)},${my - s * Math.sin(angle) + s * Math.sin(angle + Math.PI/2)} ${mx},${my} ${mx - s * Math.cos(angle) - s * Math.cos(angle + Math.PI/2)},${my - s * Math.sin(angle) - s * Math.sin(angle + Math.PI/2)}`,
      fill: 'none', stroke: T.edge, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
    svgAppend(parentNode, chevron);
  }

  // Start dot
  const startDot = svgCreate('circle');
  svgAttr(startDot, { cx: first.x, cy: first.y, r: 4, fill: T.edge });
  svgAppend(parentNode, startDot);

  // End marker — perpendicular to incoming direction
  const barH = 10;
  const target = element.target;
  const prev = wp[wp.length - 2];
  const inAngle = Math.atan2(last.y - prev.y, last.x - prev.x);
  const perpAngle = inAngle + Math.PI / 2;

  const isCircleTarget = target && (target.type === 'bpmn:StartEvent' || target.type === 'bpmn:EndEvent' || target.type === 'bpmn:BoundaryEvent' || target.type.includes('Intermediate'));

  if (isCircleTarget) {
    const r = 18;
    const x1 = last.x + (barH / 2) * Math.cos(perpAngle);
    const y1 = last.y + (barH / 2) * Math.sin(perpAngle);
    const x2 = last.x - (barH / 2) * Math.cos(perpAngle);
    const y2 = last.y - (barH / 2) * Math.sin(perpAngle);
    const endArc = svgCreate('path');
    const arcD = `M${x1},${y1} A${r},${r} 0 0,0 ${x2},${y2}`;
    svgAttr(endArc, { d: arcD, fill: 'none', stroke: T.edge, 'stroke-width': 2, 'stroke-linecap': 'round' });
    svgAppend(parentNode, endArc);
  } else {
    const endBar = svgCreate('line');
    svgAttr(endBar, {
      x1: last.x + (barH / 2) * Math.cos(perpAngle),
      y1: last.y + (barH / 2) * Math.sin(perpAngle),
      x2: last.x - (barH / 2) * Math.cos(perpAngle),
      y2: last.y - (barH / 2) * Math.sin(perpAngle),
      stroke: T.edge, 'stroke-width': 2, 'stroke-linecap': 'round'
    });
    svgAppend(parentNode, endBar);
  }

  return basePath;
}

export function drawMessageFlow(parentNode, element) {
  const wp = element.waypoints;
  const d = toBezier(wp);
  const T = theme();
  const first = wp[0];
  const last = wp[wp.length - 1];
  const prev = wp[wp.length - 2];

  // Dashed path
  const path = svgCreate('path');
  svgAttr(path, { d, fill: 'none', stroke: T.edge, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '8 5', 'data-message-flow': '' });
  svgAppend(parentNode, path);

  // Open circle at start
  const startCircle = svgCreate('circle');
  svgAttr(startCircle, { cx: first.x, cy: first.y, r: 4, fill: T.nodeBg, stroke: T.edge, 'stroke-width': 1.5 });
  svgAppend(parentNode, startCircle);

  // Open arrowhead at end
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  const s = 8;
  const arrow = svgCreate('polyline');
  svgAttr(arrow, {
    points: `${last.x - s * Math.cos(angle - 0.45)},${last.y - s * Math.sin(angle - 0.45)} ${last.x},${last.y} ${last.x - s * Math.cos(angle + 0.45)},${last.y - s * Math.sin(angle + 0.45)}`,
    fill: 'none',
    stroke: T.edge,
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  svgAppend(parentNode, arrow);

  return path;
}

/**
 * Highlight a specific edge by its element ID.
 * @param {object} viewer - bpmn-js viewer instance
 * @param {string} edgeId - the BPMN element ID of the sequence flow
 * @param {object} options - { color, width, glow }
 */
export function highlightEdge(viewer, edgeId, options = {}) {
  const elementRegistry = viewer.get('elementRegistry');
  const canvas = viewer.get('canvas');
  const element = elementRegistry.get(edgeId);
  if (!element) return null;

  const gfx = canvas.getGraphics(element);
  if (!gfx) return null;

  const color = options.color || '#ff6b6b';
  const width = options.width || 4;

  const paths = gfx.querySelectorAll('path');
  const prevStyles = [];

  paths.forEach(p => {
    prevStyles.push({ stroke: p.getAttribute('stroke'), strokeWidth: p.getAttribute('stroke-width'), filter: p.style.filter });
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', width);
    if (options.glow !== false) {
      p.style.filter = `drop-shadow(0 0 4px ${color})`;
    }
  });

  return function unhighlight() {
    paths.forEach((p, i) => {
      p.setAttribute('stroke', prevStyles[i].stroke || '');
      p.setAttribute('stroke-width', prevStyles[i].strokeWidth || '');
      p.style.filter = prevStyles[i].filter || '';
    });
  };
}

/**
 * Highlight multiple edges at once.
 * @returns {Function} unhighlight all
 */
export function highlightEdges(viewer, edgeIds, options = {}) {
  const unhighlighters = edgeIds.map(id => highlightEdge(viewer, id, options)).filter(Boolean);
  return function unhighlightAll() {
    unhighlighters.forEach(fn => fn());
  };
}
