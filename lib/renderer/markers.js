import { append as svgAppend, create as svgCreate, attr as svgAttr } from 'tiny-svg';
import { theme } from '../theme.js';

const SIZE = 12;
const GAP = 3;
const BOTTOM_PAD = 3;

// Vertical space a marker row occupies at the bottom of an activity
export const MARKER_BAND = SIZE + BOTTOM_PAD + 2;

export function getActivityMarkers(element) {
  const bo = element.businessObject;
  const loop = bo && bo.loopCharacteristics;
  if (!loop) return [];
  if (loop.$type && loop.$type.includes('MultiInstance')) {
    return [loop.isSequential ? 'mi-sequential' : 'mi-parallel'];
  }
  return ['loop'];
}

export function drawActivityMarkers(parentNode, element, width, height) {
  const markers = getActivityMarkers(element);
  if (!markers.length) return;

  const color = theme().text;
  const totalW = markers.length * SIZE + (markers.length - 1) * GAP;
  const y = height - SIZE - BOTTOM_PAD;
  let x = (width - totalW) / 2;

  markers.forEach((marker) => {
    const g = svgCreate('g');
    svgAttr(g, { opacity: '0.7', 'data-marker': marker });
    if (marker === 'mi-parallel') drawBars(g, x, y, color, false);
    else if (marker === 'mi-sequential') drawBars(g, x, y, color, true);
    else drawLoop(g, x, y, color);
    svgAppend(parentNode, g);
    x += SIZE + GAP;
  });
}

function drawBars(g, x, y, color, horizontal) {
  const thickness = 2.6;
  const length = SIZE - 1.5;
  const inset = (SIZE - length) / 2;
  const step = (SIZE - thickness) / 2;
  const round = thickness / 2;

  for (let i = 0; i < 3; i++) {
    const bar = svgCreate('rect');
    svgAttr(bar, horizontal
      ? { x: x + inset, y: y + i * step, width: length, height: thickness, rx: round, ry: round, fill: color }
      : { x: x + i * step, y: y + inset, width: thickness, height: length, rx: round, ry: round, fill: color });
    svgAppend(g, bar);
  }
}

function drawLoop(g, x, y, color) {
  const cx = x + SIZE / 2;
  const cy = y + SIZE / 2;
  const r = SIZE / 2 - 1.4;
  const start = (30 * Math.PI) / 180;
  const end = (350 * Math.PI) / 180;

  const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
  const ex = cx + r * Math.cos(end), ey = cy + r * Math.sin(end);

  const arc = svgCreate('path');
  svgAttr(arc, {
    d: `M${sx},${sy} A${r},${r} 0 1 1 ${ex},${ey}`,
    fill: 'none', stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round',
  });
  svgAppend(g, arc);

  // Arrowhead along the tangent at the arc end
  const tx = -Math.sin(end), ty = Math.cos(end);
  const nx = -ty, ny = tx;
  const len = 3.4, halfW = 2.2;
  const head = svgCreate('polygon');
  svgAttr(head, {
    points: [
      `${ex + tx * len},${ey + ty * len}`,
      `${ex + nx * halfW},${ey + ny * halfW}`,
      `${ex - nx * halfW},${ey - ny * halfW}`,
    ].join(' '),
    fill: color,
  });
  svgAppend(g, head);
}
