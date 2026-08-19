import { append as svgAppend, create as svgCreate, attr as svgAttr } from 'tiny-svg';
import { theme, adaptColor, isDark } from '../theme.js';
import { wrapText, calcFontSize, embedIcon, parseSvgIcon } from '../utils.js';
import { getTaskIcon, getEventIcon, getGatewayIcon, subProcessSvg, dataObjectSvg } from './icons.js';
import participantSvg from '../icons/participant.svg?raw';
import textAnnotationSvg from '../icons/text-annotation.svg?raw';
import dataStoreSvg from '../icons/data-store.svg?raw';

const C = { task: '#4361ee', event: '#4361ee', eventEnd: '#ff5252' };

export function drawTask(parentNode, element) {
  const { width, height } = element;
  const isCallActivity = element.type === 'bpmn:CallActivity';
  const T = theme();
  const bioc = getBiocColors(element);

  const fill = bioc.fill ? adaptColor(bioc.fill, 'fill') : T.nodeBg;
  const stroke = isCallActivity ? T.callActivityBorder : (bioc.stroke ? adaptColor(bioc.stroke, 'stroke') : T.nodeBorder);

  const card = svgCreate('rect');
  svgAttr(card, { x: 0, y: 0, width, height, rx: 6, ry: 6, fill, stroke, 'stroke-width': isCallActivity ? 2.5 : 1 });
  svgAppend(parentNode, card);

  if (isCallActivity) {
    const inner = svgCreate('rect');
    svgAttr(inner, { x: 3, y: 3, width: width - 6, height: height - 6, rx: 4, ry: 4, fill: 'none', stroke: T.callActivityInner, 'stroke-width': 1, opacity: '0.5' });
    svgAppend(parentNode, inner);
  }

  // Icon — top-left
  const taskIcon = getTaskIcon(element);
  const iconSize = 14;
  const iconX = 4;
  const iconY = 1;

  const uid = 'g' + Math.random().toString(36).slice(2, 8);
  let svgStr = taskIcon.replace(/code-grad/g, uid);
  svgStr = svgStr.replace(/#3463F3/g, T.iconBlue).replace(/#10b981/g, T.iconGreen).replace(/#8b5cf6/g, T.iconPurple).replace(/#6366f1/g, T.iconIndigo);

  const wrapper = embedIcon(parentNode, svgStr, iconX, iconY, iconSize);
  svgAppend(parentNode, wrapper);

  // Separator
  const sepY = iconY + iconSize + 1;
  const sep = svgCreate('line');
  svgAttr(sep, { x1: 0, y1: sepY, x2: width, y2: sepY, stroke: T.sep, 'stroke-width': 1 });
  svgAppend(parentNode, sep);

  // Label
  const name = element.businessObject && element.businessObject.name;
  if (name) {
    const padX = 6;
    const textAreaTop = sepY + 2;
    const availW = width - padX * 2;
    const availH = height - textAreaTop - 4;
    const fontSize = calcFontSize(name, availW, availH);
    const lineHeight = fontSize * 1.35;
    const charsPerLine = Math.max(1, Math.floor(availW / (fontSize * 0.72)));
    const lines = wrapText(name, charsPerLine);
    const totalTextH = lines.length * lineHeight;
    const startY = textAreaTop + (availH - totalTextH) / 2 + fontSize * 0.8;

    lines.forEach((line, i) => {
      const t = svgCreate('text');
      svgAttr(t, { x: width / 2, y: startY + i * lineHeight, fill: T.text, 'font-family': "Inter, sans-serif", 'font-size': fontSize + 'px', 'font-weight': '500', 'text-anchor': 'middle' });
      t.textContent = line;
      svgAppend(parentNode, t);
    });
  }

  return card;
}

export function drawExpandedSubProcess(parentNode, element) {
  const { width, height } = element;
  const T = theme();

  const box = svgCreate('rect');
  svgAttr(box, { x: 0, y: 0, width, height, rx: 8, ry: 8, fill: T.nodeBg, stroke: T.subBorder, 'stroke-width': 1.5 });
  svgAppend(parentNode, box);

  const iconSize = 14;
  const iconX = 4;
  const iconY = 1;
  const wrapper = embedIcon(parentNode, subProcessSvg, iconX, iconY, iconSize);
  svgAppend(parentNode, wrapper);

  const sepY = iconY + iconSize + 1;
  const sep = svgCreate('line');
  svgAttr(sep, { x1: 0, y1: sepY, x2: width, y2: sepY, stroke: T.sep, 'stroke-width': 1 });
  svgAppend(parentNode, sep);

  const name = element.businessObject && element.businessObject.name;
  if (name) {
    const padX = 6;
    const availW = width - padX * 2;
    const fontSize = 10;
    const lineHeight = fontSize * 1.35;
    const charsPerLine = Math.max(1, Math.floor(availW / (fontSize * 0.72)));
    const lines = wrapText(name, charsPerLine);
    const startY = sepY + 12;

    lines.forEach((line, i) => {
      const t = svgCreate('text');
      svgAttr(t, { x: width / 2, y: startY + i * lineHeight, fill: T.text, 'font-family': "Inter, sans-serif", 'font-size': fontSize + 'px', 'font-weight': '600', 'text-anchor': 'middle' });
      t.textContent = line;
      svgAppend(parentNode, t);
    });
  }

  return box;
}

export function drawEvent(parentNode, element, color, variant) {
  const { width, height } = element;
  const cx = width / 2, cy = height / 2, r = Math.min(width, height) / 2;
  const isCatching = element.type === 'bpmn:BoundaryEvent' || element.type === 'bpmn:IntermediateCatchEvent';
  const T = theme();
  const isStart = variant === 'start';
  const isEnd = variant === 'end';
  const bioc = getBiocColors(element);

  const fill = bioc.fill ? adaptColor(bioc.fill, 'fill') : T.nodeBg;
  const strokeColor = bioc.stroke ? adaptColor(bioc.stroke, 'stroke') : (isEnd ? T.endBorder : T.eventBorder);

  const bg = svgCreate('circle');
  svgAttr(bg, { cx, cy, r, fill, stroke: strokeColor, 'stroke-width': isEnd ? 3 : 1.5 });
  svgAppend(parentNode, bg);

  if (isStart) {
    const innerCircle = svgCreate('circle');
    svgAttr(innerCircle, { cx, cy, r: r - 3, fill: 'none', stroke: T.startAccent, 'stroke-width': 0.8 });
    svgAppend(parentNode, innerCircle);
  }

  if (isCatching) {
    const innerRing = svgCreate('circle');
    svgAttr(innerRing, { cx, cy, r: r - 3, fill: 'none', stroke: T.boundaryRing, 'stroke-width': 1.5, 'stroke-dasharray': '3 2' });
    svgAppend(parentNode, innerRing);
  }

  const iconSvg = getEventIcon(element);
  if (iconSvg) {
    const iconSize = r * 1.4;
    const wrapper = embedIcon(parentNode, iconSvg, cx - iconSize / 2, cy - iconSize / 2, iconSize);
    svgAppend(parentNode, wrapper);
  } else if (variant === 'start') {
    const tri = svgCreate('polygon');
    svgAttr(tri, { points: `${cx - 5},${cy - 7} ${cx - 5},${cy + 7} ${cx + 7},${cy}`, fill: color });
    svgAppend(parentNode, tri);
  } else if (variant === 'end') {
    const sq = svgCreate('rect');
    svgAttr(sq, { x: cx - 6, y: cy - 6, width: 12, height: 12, rx: 2, ry: 2, fill: color });
    svgAppend(parentNode, sq);
  } else {
    const dot = svgCreate('circle');
    svgAttr(dot, { cx, cy, r: 5, fill: color });
    svgAppend(parentNode, dot);
  }

  return bg;
}

export function drawGateway(parentNode, element) {
  const { width, height } = element;
  const T = theme();

  const box = svgCreate('rect');
  svgAttr(box, { x: 0, y: 0, width, height, rx: 8, ry: 8, fill: T.nodeBg, stroke: T.nodeBorder, 'stroke-width': 1.5 });
  svgAppend(parentNode, box);

  const svgMarkup = getGatewayIcon(element);
  const pad = 4;
  const iconW = width - pad * 2;
  const iconH = height - pad * 2;
  const wrapper = embedIcon(parentNode, svgMarkup, pad, pad, Math.min(iconW, iconH));
  svgAppend(parentNode, wrapper);

  return box;
}

function getBiocColors(element) {
  const di = element.di;
  if (!di) return {};
  return {
    fill: di.get('bioc:fill') || di.get('color:background-color') || null,
    stroke: di.get('bioc:stroke') || di.get('color:border-color') || null,
  };
}

export function drawParticipant(parentNode, element) {
  const { width, height } = element;
  const T = theme();
  const bioc = getBiocColors(element);

  const fill = bioc.fill ? adaptColor(bioc.fill, 'fill') : T.nodeBg;
  const stroke = bioc.stroke ? adaptColor(bioc.stroke, 'stroke') : T.nodeBorder;
  const bo = element.businessObject;
  const isEmpty = !bo || !bo.processRef;

  const box = svgCreate('rect');
  svgAttr(box, { x: 0, y: 0, width, height, rx: 6, ry: 6, fill, stroke, 'stroke-width': 1.5 });
  svgAppend(parentNode, box);

  const name = element.businessObject && element.businessObject.name;

  if (isEmpty) {
    if (name) {
      const text = svgCreate('text');
      svgAttr(text, {
        x: width / 2, y: height / 2 + 4,
        fill: T.text,
        'font-family': "Inter, sans-serif",
        'font-size': '12px',
        'font-weight': '600',
        'text-anchor': 'middle',
      });
      text.textContent = name;
      svgAppend(parentNode, text);
    }
  } else {
    const fontSize = 11;
    const lineSpacing = 14;
    let headerW = 30;

    if (name) {
      const availH = height - 10;
      const charsPerLine = Math.max(1, Math.floor(availH / (fontSize * 0.72)));
      const lines = wrapText(name, charsPerLine);
      headerW = Math.max(30, lines.length * lineSpacing + 16);
    }

    const header = svgCreate('rect');
    svgAttr(header, { x: 0, y: 0, width: headerW, height, rx: 6, ry: 6, fill: stroke, opacity: '0.15' });
    svgAppend(parentNode, header);

    const sep = svgCreate('line');
    svgAttr(sep, { x1: headerW, y1: 0, x2: headerW, y2: height, stroke, 'stroke-width': 1 });
    svgAppend(parentNode, sep);

    let iconStr = participantSvg;
    if (isDark()) iconStr = iconStr.replace(/#3463F3/g, T.iconBlue);
    const wrapper = embedIcon(parentNode, iconStr, (headerW - 18) / 2, 6, 18);
    svgAppend(parentNode, wrapper);

    if (name) {
      const availH = height - 10;
      const charsPerLine = Math.max(1, Math.floor(availH / (fontSize * 0.72)));
      const lines = wrapText(name, charsPerLine);
      const totalW = lines.length * lineSpacing;
      const startX = (headerW - totalW) / 2 + lineSpacing / 2;

      lines.forEach((line, i) => {
        const text = svgCreate('text');
        svgAttr(text, {
          x: startX + i * lineSpacing, y: height / 2,
          fill: T.text,
          'font-family': "Inter, sans-serif",
          'font-size': fontSize + 'px',
          'font-weight': '600',
          'text-anchor': 'middle',
          'writing-mode': 'vertical-rl',
          'glyph-orientation-vertical': '0',
          transform: `rotate(180, ${startX + i * lineSpacing}, ${height / 2})`,
        });
        text.textContent = line;
        svgAppend(parentNode, text);
      });
    }
  }

  return box;
}

export function drawLane(parentNode, element) {
  const { width, height } = element;
  const T = theme();

  const box = svgCreate('rect');
  svgAttr(box, { x: 0, y: 0, width, height, fill: 'none', stroke: T.nodeBorder, 'stroke-width': 1, 'stroke-dasharray': '4 2' });
  svgAppend(parentNode, box);

  const name = element.businessObject && element.businessObject.name;
  if (name) {
    const text = svgCreate('text');
    svgAttr(text, {
      x: 12, y: height / 2,
      fill: T.text,
      'font-family': "Inter, sans-serif",
      'font-size': '10px',
      'font-weight': '500',
      'text-anchor': 'middle',
      'writing-mode': 'vertical-rl',
      transform: `rotate(180, 12, ${height / 2})`,
    });
    text.textContent = name;
    svgAppend(parentNode, text);
  }

  return box;
}

export function drawAnnotation(parentNode, element) {
  const { width, height } = element;
  const T = theme();

  // Open bracket shape (like standard BPMN annotation)
  const bracket = svgCreate('path');
  const d = `M${15},0 L0,0 L0,${height} L${15},${height}`;
  svgAttr(bracket, { d, fill: 'none', stroke: T.nodeBorder, 'stroke-width': 1.5, 'stroke-linecap': 'round' });
  svgAppend(parentNode, bracket);

  // Subtle background
  const bg = svgCreate('rect');
  svgAttr(bg, { x: 0, y: 0, width, height, rx: 3, ry: 3, fill: T.nodeBg, opacity: '0.5', stroke: 'none' });
  svgAppend(parentNode, bg);
  // Re-draw bracket on top
  svgAppend(parentNode, bracket);

  // Small annotation icon top-left
  let iconStr = textAnnotationSvg;
  if (isDark()) iconStr = iconStr.replace(/#3463F3/g, T.iconBlue);
  const iconWrapper = embedIcon(parentNode, iconStr, 2, 2, 12);
  svgAppend(parentNode, iconWrapper);

  // Text content
  const text = element.businessObject && element.businessObject.text;
  if (text) {
    const padX = 6;
    const textStartY = 18;
    const availW = width - padX * 2;
    const fontSize = 9;
    const lineHeight = fontSize * 1.4;
    const charsPerLine = Math.max(1, Math.floor(availW / (fontSize * 0.6)));
    const lines = wrapText(text, charsPerLine);

    lines.forEach((line, i) => {
      if (textStartY + i * lineHeight > height - 4) return;
      const t = svgCreate('text');
      svgAttr(t, { x: padX, y: textStartY + i * lineHeight, fill: T.text, 'font-family': "Inter, sans-serif", 'font-size': fontSize + 'px', 'font-style': 'italic', opacity: '0.8' });
      t.textContent = line;
      svgAppend(parentNode, t);
    });
  }

  return bracket;
}

export function drawDataStore(parentNode, element) {
  const { width, height } = element;
  const T = theme();

  // DB icon fills entire element bounds so edges connect to it
  let iconStr = dataStoreSvg;
  iconStr = iconStr.replace(/#3463F3/g, T.iconBlue);
  const wrapper = embedIcon(parentNode, iconStr, 0, 0, width);
  svgAttr(wrapper, { x: 0, y: 0, width, height });
  svgAppend(parentNode, wrapper);

  // Name below
  const name = element.businessObject && element.businessObject.name;
  if (name) {
    const t = svgCreate('text');
    svgAttr(t, { x: width / 2, y: height + 14, fill: T.text, 'font-family': "Inter, sans-serif", 'font-size': '10px', 'font-weight': '500', 'text-anchor': 'middle' });
    t.textContent = name;
    svgAppend(parentNode, t);
  }

  return wrapper;
}

export function drawDataObject(parentNode, element) {
  const { width, height } = element;
  const T = theme();

  // Document icon filling the bounds
  let iconStr = dataObjectSvg;
  iconStr = iconStr.replace(/#3463F3/g, T.iconBlue);
  const wrapper = embedIcon(parentNode, iconStr, 0, 0, width);
  svgAttr(wrapper, { x: 0, y: 0, width, height });
  svgAppend(parentNode, wrapper);

  // Name below
  const name = element.businessObject && element.businessObject.name;
  if (name) {
    const t = svgCreate('text');
    svgAttr(t, { x: width / 2, y: height + 14, fill: T.text, 'font-family': "Inter, sans-serif", 'font-size': '10px', 'font-weight': '500', 'text-anchor': 'middle' });
    t.textContent = name;
    svgAppend(parentNode, t);
  }

  return wrapper;
}

export function drawGroup(parentNode, element) {
  const { width, height } = element;
  const T = theme();

  // Dashed rounded rectangle — grouping container
  const box = svgCreate('rect');
  svgAttr(box, { x: 0, y: 0, width, height, rx: 12, ry: 12, fill: 'none', stroke: T.nodeBorder, 'stroke-width': 1.5, 'stroke-dasharray': '8 4', opacity: '0.6', 'data-group-box': '' });
  svgAppend(parentNode, box);

  // Name label on top border with background knockout
  const name = element.businessObject && element.businessObject.categoryValueRef && element.businessObject.categoryValueRef.value;
  if (name) {
    const fontSize = 10;
    const padX = 8;
    const labelW = name.length * fontSize * 0.6 + padX * 2;
    const labelH = 16;
    const labelX = (width - labelW) / 2;
    const labelY = -labelH / 2;

    const bg = svgCreate('rect');
    svgAttr(bg, { x: labelX, y: labelY, width: labelW, height: labelH, rx: 3, ry: 3, fill: T.nodeBg, stroke: T.nodeBorder, 'stroke-width': 1 });
    svgAppend(parentNode, bg);

    const t = svgCreate('text');
    svgAttr(t, { x: width / 2, y: labelY + labelH / 2 + fontSize * 0.35, fill: T.text, 'font-family': "Inter, sans-serif", 'font-size': fontSize + 'px', 'font-weight': '600', 'text-anchor': 'middle', opacity: '0.85' });
    t.textContent = name;
    svgAppend(parentNode, t);
  }

  return box;
}
