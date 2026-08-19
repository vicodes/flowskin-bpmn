import { create as svgCreate, attr as svgAttr } from 'tiny-svg';

export function wrapText(text, charsPerLine) {
  const tokens = text.split(/(?<=-)| /);
  const lines = [];
  let current = '';
  for (const token of tokens) {
    if (current.length + token.length <= charsPerLine) {
      current += token;
    } else {
      if (current) lines.push(current);
      if (token.length > charsPerLine) {
        let rem = token;
        while (rem.length > charsPerLine) {
          lines.push(rem.slice(0, charsPerLine));
          rem = rem.slice(charsPerLine);
        }
        current = rem;
      } else {
        current = token;
      }
    }
    if (!current.endsWith('-') && current.length < charsPerLine) current += ' ';
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

export function calcFontSize(text, availW, availH) {
  for (let size = 11; size >= 7; size--) {
    const charsPerLine = Math.max(1, Math.floor(availW / (size * 0.72)));
    const lines = wrapText(text, charsPerLine);
    const totalH = lines.length * size * 1.35;
    if (totalH <= availH) return size;
  }
  return 7;
}

export function toBezier(wp) {
  if (wp.length < 2) return '';
  const first = wp[0];
  const last = wp[wp.length - 1];

  if (wp.length === 2) {
    const dx = Math.abs(last.x - first.x) * 0.5;
    return `M${first.x},${first.y} C${first.x + dx},${first.y} ${last.x - dx},${last.y} ${last.x},${last.y}`;
  }

  let d = `M${first.x},${first.y}`;
  for (let i = 0; i < wp.length - 1; i++) {
    const curr = wp[i];
    const next = wp[i + 1];
    const dx = Math.abs(next.x - curr.x) * 0.5;
    const cpx1 = curr.x + (next.x > curr.x ? dx : -dx);
    const cpy1 = curr.y;
    const cpx2 = next.x + (curr.x > next.x ? dx : -dx);
    const cpy2 = next.y;
    d += ` C${cpx1},${cpy1} ${cpx2},${cpy2} ${next.x},${next.y}`;
  }
  return d;
}

export function parseSvgIcon(svgMarkup) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
  return doc.documentElement;
}

export function embedIcon(parentNode, svgMarkup, x, y, size, viewBox = '0 0 100 100') {
  const srcSvg = parseSvgIcon(svgMarkup);
  const wrapper = svgCreate('svg');
  svgAttr(wrapper, { x, y, width: size, height: size, viewBox, preserveAspectRatio: 'xMidYMid meet' });
  while (srcSvg.firstChild) {
    wrapper.appendChild(srcSvg.firstChild);
  }
  return wrapper;
}

export function getType(element) {
  const t = element.type;
  if (t === 'bpmn:StartEvent') return 'start';
  if (t === 'bpmn:EndEvent') return 'end';
  if (t === 'bpmn:BoundaryEvent') return 'intermediate';
  if (t === 'bpmn:IntermediateCatchEvent') return 'intermediate';
  if (t === 'bpmn:IntermediateThrowEvent') return 'intermediate-throw';
  if (t.includes('Intermediate')) return 'intermediate';
  if (t.includes('Gateway')) return 'gateway';
  if (t === 'bpmn:SequenceFlow') return 'flow';
  if (t === 'bpmn:MessageFlow') return 'messageflow';
  if (t === 'bpmn:Association' || t === 'bpmn:DataInputAssociation' || t === 'bpmn:DataOutputAssociation') return 'association';
  if (t === 'bpmn:SubProcess' && !element.collapsed) return 'subprocess-expanded';
  if (t.includes('Task') || t === 'bpmn:SubProcess' || t === 'bpmn:CallActivity') return 'task';
  if (t === 'bpmn:Participant') return 'participant';
  if (t === 'bpmn:Lane') return 'lane';
  if (t === 'bpmn:TextAnnotation') return 'annotation';
  if (t === 'bpmn:DataStoreReference') return 'datastore';
  if (t === 'bpmn:DataObjectReference' || t === 'bpmn:DataObject' || t === 'bpmn:DataInput' || t === 'bpmn:DataOutput') return 'dataobject';
  if (t === 'bpmn:Group') return 'group';
  if (t === 'bpmn:Transaction') return 'subprocess-expanded';
  if (t === 'bpmn:AdHocSubProcess') return 'subprocess-expanded';
  return null;
}

export function formatType(type) {
  return type.replace('bpmn:', '').replace(/([A-Z])/g, ' $1').trim();
}
