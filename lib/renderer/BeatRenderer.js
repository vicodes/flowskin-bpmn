import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { create as svgCreate, attr as svgAttr, append as svgAppend } from 'tiny-svg';
import { getType } from '../utils.js';
import { drawTask, drawExpandedSubProcess, drawEvent, drawGateway, drawParticipant, drawLane, drawAnnotation, drawDataStore, drawDataObject, drawGroup } from './shapes.js';
import { drawEdge, drawAssociation } from './edges.js';

const HIGH_PRIORITY = 1500;
const C = { event: '#4361ee', eventEnd: '#ff5252', task: '#4361ee' };

export default function BeatRenderer(eventBus, bpmnRenderer) {
  BaseRenderer.call(this, eventBus, HIGH_PRIORITY);
  this.bpmnRenderer = bpmnRenderer;
}

BeatRenderer.$inject = ['eventBus', 'bpmnRenderer'];
BeatRenderer.prototype = Object.create(BaseRenderer.prototype);
BeatRenderer.prototype.constructor = BeatRenderer;

BeatRenderer.prototype.canRender = function(element) {
  if (element.type === 'label') return true;
  return !!getType(element);
};

BeatRenderer.prototype.drawShape = function(parentNode, element) {
  // Suppress external labels only for elements that render their own name
  if (element.type === 'label') {
    const labelTarget = element.labelTarget;
    if (labelTarget) {
      const targetType = getType(labelTarget);
      // These types draw their own label — suppress the external one
      if (targetType === 'task' || targetType === 'subprocess-expanded' ||
          targetType === 'participant' || targetType === 'lane' ||
          targetType === 'annotation' || targetType === 'datastore' ||
          targetType === 'dataobject') {
        const rect = svgCreate('rect');
        svgAttr(rect, { x: 0, y: 0, width: 0, height: 0, fill: 'none' });
        svgAppend(parentNode, rect);
        return rect;
      }
    }
    // Let bpmn-js render labels for events, gateways, flows
    return this.bpmnRenderer.drawShape(parentNode, element);
  }

  const type = getType(element);
  if (type === 'task') return drawTask(parentNode, element);
  if (type === 'subprocess-expanded') return drawExpandedSubProcess(parentNode, element);
  if (type === 'start') return drawEvent(parentNode, element, C.event, 'start');
  if (type === 'end') return drawEvent(parentNode, element, C.eventEnd, 'end');
  if (type === 'intermediate') return drawEvent(parentNode, element, C.task, 'intermediate');
  if (type === 'intermediate-throw') return drawEvent(parentNode, element, C.task, 'intermediate-throw');
  if (type === 'gateway') return drawGateway(parentNode, element);
  if (type === 'participant') return drawParticipant(parentNode, element);
  if (type === 'lane') return drawLane(parentNode, element);
  if (type === 'annotation') return drawAnnotation(parentNode, element);
  if (type === 'datastore') return drawDataStore(parentNode, element);
  if (type === 'dataobject') return drawDataObject(parentNode, element);
  if (type === 'group') return drawGroup(parentNode, element);
  return this.bpmnRenderer.drawShape(parentNode, element);
};

BeatRenderer.prototype.drawConnection = function(parentNode, element) {
  const type = getType(element);
  if (type === 'flow') return drawEdge(parentNode, element);
  if (type === 'association') return drawAssociation(parentNode, element);
  return this.bpmnRenderer.drawConnection(parentNode, element);
};

BeatRenderer.prototype.getShapePath = function(shape) {
  return this.bpmnRenderer.getShapePath(shape);
};
