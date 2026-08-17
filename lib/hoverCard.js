import { formatType } from './utils.js';

export function setupHoverCard(viewer) {
  let card = document.getElementById('beat-hover-card');
  if (!card) {
    card = document.createElement('div');
    card.id = 'beat-hover-card';
    document.body.appendChild(card);
  }

  const eventBus = viewer.get('eventBus');
  const canvas = viewer.get('canvas');

  eventBus.on('element.hover', (e) => {
    const el = e.element;
    if (!el || el.type === 'bpmn:Process' || el.type === 'bpmn:Collaboration' || el.type === 'bpmn:Participant') {
      card.style.display = 'none';
      return;
    }

    const bo = el.businessObject;
    const details = [];

    details.push(`<div class="hc-type">${formatType(el.type)}</div>`);
    if (bo.name) details.push(`<div class="hc-name">${bo.name}</div>`);
    if (bo.id) details.push(`<div class="hc-row"><span>ID:</span> ${bo.id}</div>`);

    if (bo.eventDefinitions && bo.eventDefinitions.length) {
      const defType = bo.eventDefinitions[0].$type.replace('bpmn:', '').replace('EventDefinition', '');
      details.push(`<div class="hc-row"><span>Event:</span> ${defType}</div>`);
    }

    if (bo.extensionElements) {
      const exts = bo.extensionElements.values || [];
      exts.forEach(ext => {
        if (ext.$type === 'zeebe:TaskDefinition' && ext.type) {
          details.push(`<div class="hc-row"><span>Worker:</span> ${ext.type}</div>`);
        }
        if (ext.$type === 'zeebe:CalledElement' && ext.processId) {
          details.push(`<div class="hc-row"><span>Calls:</span> ${ext.processId}</div>`);
        }
      });
    }

    if (el.incoming && el.incoming.length) details.push(`<div class="hc-row"><span>Incoming:</span> ${el.incoming.length}</div>`);
    if (el.outgoing && el.outgoing.length) details.push(`<div class="hc-row"><span>Outgoing:</span> ${el.outgoing.length}</div>`);

    card.innerHTML = details.join('');
    card.style.display = 'block';

    const gfx = canvas.getGraphics(el);
    if (gfx) {
      const rect = gfx.getBoundingClientRect();
      card.style.left = (rect.right + 10) + 'px';
      card.style.top = rect.top + 'px';
    }
  });

  eventBus.on('element.out', () => {
    card.style.display = 'none';
  });
}
