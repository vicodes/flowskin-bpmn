import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
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
  return !!getType(element);
};

BeatRenderer.prototype.drawShape = function(parentNode, element) {
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
