import exclusiveGatewaySvg from '../icons/exclusive-gateway.svg?raw';
import parallelGatewaySvg from '../icons/parallel-gateway.svg?raw';
import inclusiveGatewaySvg from '../icons/inclusive-gateway.svg?raw';
import complexGatewaySvg from '../icons/complex-gateway.svg?raw';
import eventBasedGatewaySvg from '../icons/event-based-gateway.svg?raw';
import serviceTaskSvg from '../icons/service-task.svg?raw';
import businessRuleTaskSvg from '../icons/business-rule-task.svg?raw';
import scriptTaskSvg from '../icons/script-task.svg?raw';
import callActivitySvg from '../icons/call-activity.svg?raw';
import subProcessSvg from '../icons/sub-process.svg?raw';
import userTaskSvg from '../icons/user-task.svg?raw';
import sendTaskSvg from '../icons/send-task.svg?raw';
import receiveTaskSvg from '../icons/receive-task.svg?raw';
import manualTaskSvg from '../icons/manual-task.svg?raw';
import timerEventSvg from '../icons/timer-event.svg?raw';
import errorEventSvg from '../icons/error-event.svg?raw';
import messageEventSvg from '../icons/message-event.svg?raw';
import signalEventSvg from '../icons/signal-event.svg?raw';
import terminateEventSvg from '../icons/terminate-event.svg?raw';
import conditionalEventSvg from '../icons/conditional-event.svg?raw';
import escalationEventSvg from '../icons/escalation-event.svg?raw';
import compensateEventSvg from '../icons/compensate-event.svg?raw';
import cancelEventSvg from '../icons/cancel-event.svg?raw';
import linkEventSvg from '../icons/link-event.svg?raw';
import dataObjectSvg from '../icons/data-object.svg?raw';

export function getTaskIcon(element) {
  const t = element.type;
  if (t === 'bpmn:BusinessRuleTask') return businessRuleTaskSvg;
  if (t === 'bpmn:ScriptTask') return scriptTaskSvg;
  if (t === 'bpmn:CallActivity') return callActivitySvg;
  if (t === 'bpmn:SubProcess') return subProcessSvg;
  if (t === 'bpmn:UserTask') return userTaskSvg;
  if (t === 'bpmn:SendTask') return sendTaskSvg;
  if (t === 'bpmn:ReceiveTask') return receiveTaskSvg;
  if (t === 'bpmn:ManualTask') return manualTaskSvg;
  if (t === 'bpmn:Task') return manualTaskSvg;
  return serviceTaskSvg;
}

export function getGatewayIcon(element) {
  if (element.type === 'bpmn:ParallelGateway') return parallelGatewaySvg;
  if (element.type === 'bpmn:InclusiveGateway') return inclusiveGatewaySvg;
  if (element.type === 'bpmn:ComplexGateway') return complexGatewaySvg;
  if (element.type === 'bpmn:EventBasedGateway') return eventBasedGatewaySvg;
  return exclusiveGatewaySvg;
}

export function getEventIcon(element) {
  const bo = element.businessObject;
  if (!bo || !bo.eventDefinitions || !bo.eventDefinitions.length) return null;
  const defType = bo.eventDefinitions[0].$type;
  if (defType.includes('Timer')) return timerEventSvg;
  if (defType.includes('Error')) return errorEventSvg;
  if (defType.includes('Message')) return messageEventSvg;
  if (defType.includes('Signal')) return signalEventSvg;
  if (defType.includes('Terminate')) return terminateEventSvg;
  if (defType.includes('Conditional')) return conditionalEventSvg;
  if (defType.includes('Escalation')) return escalationEventSvg;
  if (defType.includes('Compensate')) return compensateEventSvg;
  if (defType.includes('Cancel')) return cancelEventSvg;
  if (defType.includes('Link')) return linkEventSvg;
  return null;
}

export { subProcessSvg, dataObjectSvg };
