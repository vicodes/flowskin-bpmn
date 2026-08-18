import BpmnModdle from 'bpmn-moddle';

/**
 * Flattens a hierarchical BPMN (parent with call activities) into a single
 * flat diagram showing only the executed path.
 *
 * @param {Object} options
 * @param {Object} options.parent
 * @param {string} options.parent.xml - Parent BPMN XML string
 * @param {string[]} options.parent.executedEdgeIds - Executed sequence flow IDs in order
 * @param {Object[]} [options.children] - Child process definitions (recursive up to depth 5)
 * @param {string} options.children[].processId - Matches calledElement on CallActivity
 * @param {string} options.children[].name - Display name for the group wrapper
 * @param {string} options.children[].xml - Child BPMN XML string
 * @param {string[]} options.children[].executedEdgeIds - Executed edge IDs for this child
 * @param {Object[]} [options.children[].children] - Nested children (same structure)
 * @returns {Promise<string>} Flattened BPMN XML
 */
export async function flattenBpmn({ parent, children = [] }) {
  const moddle = new BpmnModdle();

  const childMap = new Map();
  function registerChildren(childList) {
    for (const child of childList) {
      childMap.set(child.processId, child);
      if (child.children?.length) registerChildren(child.children);
    }
  }
  registerChildren(children);

  const parentDef = await parse(moddle, parent.xml);
  const parentProcess = parentDef.rootElements.find(e => e.$type === 'bpmn:Process');
  if (!parentProcess) throw new Error('No parent process found');

  const parentElements = new Map();
  const parentFlows = new Map();
  indexElements(parentProcess, parentElements, parentFlows);

  const parentExecutedFlows = [];
  for (const id of parent.executedEdgeIds) {
    const flow = parentFlows.get(id);
    if (flow) parentExecutedFlows.push(flow);
  }

  const parentExecutedNodeIds = new Set();
  for (const flow of parentExecutedFlows) {
    parentExecutedNodeIds.add(flow.sourceRef?.id || flow.sourceRef);
    parentExecutedNodeIds.add(flow.targetRef?.id || flow.targetRef);
  }

  const newProcess = moddle.create('bpmn:Process', {
    id: 'ExecutedProcess',
    isExecutable: true,
    flowElements: [],
  });

  const newNodes = new Map();
  const newFlows = [];
  const groupInfos = [];
  const categories = [];

  const parentExecutedNodes = [];
  for (const id of parentExecutedNodeIds) {
    const el = parentElements.get(id);
    if (el) parentExecutedNodes.push(el);
  }

  for (const node of parentExecutedNodes) {
    if (node.$type === 'bpmn:CallActivity') {
      const calledId = getCalledProcessId(node);
      if (calledId && childMap.has(calledId)) continue;
    }
    const newNode = moddle.create(node.$type, {
      ...extractProperties(node), id: node.id, incoming: [], outgoing: [],
    });
    newNodes.set(node.id, newNode);
    newProcess.flowElements.push(newNode);
  }

  const callActivities = parentExecutedNodes.filter(n => n.$type === 'bpmn:CallActivity');
  for (const ca of callActivities) {
    const calledId = getCalledProcessId(ca);
    if (!calledId || !childMap.has(calledId)) continue;
    const childDef = childMap.get(calledId);
    await inlineChild(moddle, childDef, ca, parentExecutedFlows, newNodes, newFlows, newProcess, groupInfos, childMap, 1);
  }

  const inlinedCaIds = new Set(callActivities.filter(ca => {
    const cid = getCalledProcessId(ca);
    return cid && childMap.has(cid);
  }).map(ca => ca.id));

  for (const flow of parentExecutedFlows) {
    const srcId = flow.sourceRef?.id || flow.sourceRef;
    const tgtId = flow.targetRef?.id || flow.targetRef;
    if (inlinedCaIds.has(srcId) || inlinedCaIds.has(tgtId)) continue;

    const src = newNodes.get(srcId);
    const tgt = newNodes.get(tgtId);
    if (src && tgt) {
      const nf = moddle.create('bpmn:SequenceFlow', {
        id: flow.id, name: flow.name, sourceRef: src, targetRef: tgt,
      });
      if (flow.conditionExpression) nf.conditionExpression = flow.conditionExpression;
      src.outgoing.push(nf);
      tgt.incoming.push(nf);
      newFlows.push(nf);
    }
  }

  newProcess.flowElements.push(...newFlows);

  const nodePositions = layoutGraph([...newNodes.values()], newFlows);

  const planeElements = [];

  for (const [id, pos] of nodePositions) {
    const el = newNodes.get(id);
    if (!el) continue;
    planeElements.push(moddle.create('bpmndi:BPMNShape', {
      id: `${id}_di`,
      bpmnElement: el,
      bounds: moddle.create('dc:Bounds', { x: pos.x, y: pos.y, width: pos.w, height: pos.h }),
    }));
  }

  const groupPadding = 30;
  for (const { name, childNodeIds } of groupInfos) {
    if (!childNodeIds.length) continue;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of childNodeIds) {
      const pos = nodePositions.get(id);
      if (!pos) continue;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.w);
      maxY = Math.max(maxY, pos.y + pos.h);
    }
    if (minX === Infinity) continue;

    const groupId = `Group_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const categoryValue = moddle.create('bpmn:CategoryValue', {
      id: `CV_${groupId}`,
      value: name,
    });
    const category = moddle.create('bpmn:Category', {
      id: `Cat_${groupId}`,
      categoryValue: [categoryValue],
    });
    const group = moddle.create('bpmn:Group', {
      id: groupId,
      categoryValueRef: categoryValue,
    });

    newProcess.artifacts = newProcess.artifacts || [];
    newProcess.artifacts.push(group);
    categories.push(category);

    planeElements.push(moddle.create('bpmndi:BPMNShape', {
      id: `${groupId}_di`,
      bpmnElement: group,
      bounds: moddle.create('dc:Bounds', {
        x: minX - groupPadding,
        y: minY - groupPadding,
        width: (maxX - minX) + groupPadding * 2,
        height: (maxY - minY) + groupPadding * 2,
      }),
    }));
  }

  for (const flow of newFlows) {
    const srcPos = nodePositions.get(flow.sourceRef.id);
    const tgtPos = nodePositions.get(flow.targetRef.id);
    if (!srcPos || !tgtPos) continue;

    planeElements.push(moddle.create('bpmndi:BPMNEdge', {
      id: `${flow.id}_di`,
      bpmnElement: flow,
      waypoint: [
        moddle.create('dc:Point', { x: srcPos.x + srcPos.w, y: srcPos.y + srcPos.h / 2 }),
        moddle.create('dc:Point', { x: tgtPos.x, y: tgtPos.y + tgtPos.h / 2 }),
      ],
    }));
  }

  const bpmnPlane = moddle.create('bpmndi:BPMNPlane', {
    id: 'BPMNPlane_1',
    bpmnElement: newProcess,
    planeElement: planeElements,
  });

  const definitions = moddle.create('bpmn:Definitions', {
    id: 'Definitions_Executed',
    targetNamespace: 'http://bpmn.io/schema/bpmn',
    rootElements: [newProcess, ...categories],
    diagrams: [moddle.create('bpmndi:BPMNDiagram', { id: 'BPMNDiagram_1', plane: bpmnPlane })],
  });

  const { xml } = await moddle.toXML(definitions, { format: true });
  return xml;
}

async function inlineChild(moddle, childDef, callActivity, parentFlows, newNodes, newFlows, newProcess, groupInfos, childMap, depth) {
  if (depth > 5) return;

  const def = await parse(moddle, childDef.xml);
  const proc = def.rootElements.find(e => e.$type === 'bpmn:Process');
  if (!proc) return;

  const elements = new Map();
  const flows = new Map();
  indexElements(proc, elements, flows);

  const executedFlows = [];
  for (const id of childDef.executedEdgeIds) {
    const flow = flows.get(id);
    if (flow) executedFlows.push(flow);
  }

  const executedNodeIds = new Set();
  for (const flow of executedFlows) {
    executedNodeIds.add(flow.sourceRef?.id || flow.sourceRef);
    executedNodeIds.add(flow.targetRef?.id || flow.targetRef);
  }

  const executedNodes = [];
  for (const id of executedNodeIds) {
    const el = elements.get(id);
    if (el) executedNodes.push(el);
  }

  const startEvent = executedNodes.find(n => n.$type === 'bpmn:StartEvent');
  const endEvent = executedNodes.find(n => n.$type === 'bpmn:EndEvent');
  const removedIds = new Set([startEvent?.id, endEvent?.id].filter(Boolean));

  let firstChildNodeId = null;
  let lastChildNodeId = null;
  for (const f of executedFlows) {
    const srcId = f.sourceRef?.id || f.sourceRef;
    const tgtId = f.targetRef?.id || f.targetRef;
    if (srcId === startEvent?.id) firstChildNodeId = tgtId;
    if (tgtId === endEvent?.id) lastChildNodeId = srcId;
  }

  const childNodeIds = [];

  for (const node of executedNodes) {
    if (removedIds.has(node.id)) continue;
    if (node.$type === 'bpmn:CallActivity') {
      const nestedCalledId = getCalledProcessId(node);
      if (nestedCalledId && childMap.has(nestedCalledId)) continue;
    }
    const newNode = moddle.create(node.$type, {
      ...extractProperties(node), id: node.id, incoming: [], outgoing: [],
    });
    newNodes.set(node.id, newNode);
    newProcess.flowElements.push(newNode);
    childNodeIds.push(node.id);
  }

  const nestedCAs = executedNodes.filter(n => n.$type === 'bpmn:CallActivity' && !removedIds.has(n.id));
  const inlinedNestedCaIds = new Set();
  for (const nca of nestedCAs) {
    const nestedCalledId = getCalledProcessId(nca);
    if (!nestedCalledId || !childMap.has(nestedCalledId)) continue;
    inlinedNestedCaIds.add(nca.id);
    const nestedChildDef = childMap.get(nestedCalledId);
    await inlineChild(moddle, nestedChildDef, nca, executedFlows, newNodes, newFlows, newProcess, groupInfos, childMap, depth + 1);
  }

  const filteredFlows = executedFlows.filter(f => {
    const srcId = f.sourceRef?.id || f.sourceRef;
    const tgtId = f.targetRef?.id || f.targetRef;
    if (removedIds.has(srcId) || removedIds.has(tgtId)) return false;
    if (inlinedNestedCaIds.has(srcId) || inlinedNestedCaIds.has(tgtId)) return false;
    return true;
  });

  for (const flow of filteredFlows) {
    const src = newNodes.get(flow.sourceRef?.id || flow.sourceRef);
    const tgt = newNodes.get(flow.targetRef?.id || flow.targetRef);
    if (src && tgt) {
      const nf = moddle.create('bpmn:SequenceFlow', {
        id: flow.id, name: flow.name, sourceRef: src, targetRef: tgt,
      });
      if (flow.conditionExpression) nf.conditionExpression = flow.conditionExpression;
      src.outgoing.push(nf);
      tgt.incoming.push(nf);
      newFlows.push(nf);
    }
  }

  for (const nca of nestedCAs) {
    const nestedCalledId = getCalledProcessId(nca);
    if (!nestedCalledId || !childMap.has(nestedCalledId)) continue;

    const nestedDef = childMap.get(nestedCalledId);
    const nestedParsed = await parse(moddle, nestedDef.xml);
    const nestedProc = nestedParsed.rootElements.find(e => e.$type === 'bpmn:Process');
    if (!nestedProc) continue;

    const nestedElems = new Map();
    const nestedFlowsMap = new Map();
    indexElements(nestedProc, nestedElems, nestedFlowsMap);

    const nestedExecFlows = [];
    for (const id of nestedDef.executedEdgeIds) {
      const f = nestedFlowsMap.get(id);
      if (f) nestedExecFlows.push(f);
    }

    const nestedNodeSet = new Set();
    for (const f of nestedExecFlows) {
      nestedNodeSet.add(nestedElems.get(f.sourceRef?.id || f.sourceRef));
      nestedNodeSet.add(nestedElems.get(f.targetRef?.id || f.targetRef));
    }

    const nestedStart = [...nestedNodeSet].find(n => n?.$type === 'bpmn:StartEvent');
    const nestedEnd = [...nestedNodeSet].find(n => n?.$type === 'bpmn:EndEvent');
    let nestedFirstId = null, nestedLastId = null;
    for (const f of nestedExecFlows) {
      if ((f.sourceRef?.id || f.sourceRef) === nestedStart?.id) nestedFirstId = f.targetRef?.id || f.targetRef;
      if ((f.targetRef?.id || f.targetRef) === nestedEnd?.id) nestedLastId = f.sourceRef?.id || f.sourceRef;
    }

    for (const flow of executedFlows) {
      const srcId = flow.sourceRef?.id || flow.sourceRef;
      const tgtId = flow.targetRef?.id || flow.targetRef;

      if (tgtId === nca.id && nestedFirstId) {
        const src = newNodes.get(srcId);
        const tgt = newNodes.get(nestedFirstId);
        if (src && tgt) {
          const nf = moddle.create('bpmn:SequenceFlow', {
            id: `${flow.id}_rewire`, name: flow.name, sourceRef: src, targetRef: tgt,
          });
          src.outgoing.push(nf);
          tgt.incoming.push(nf);
          newFlows.push(nf);
        }
      } else if (srcId === nca.id && nestedLastId) {
        const src = newNodes.get(nestedLastId);
        const tgt = newNodes.get(tgtId);
        if (src && tgt) {
          const nf = moddle.create('bpmn:SequenceFlow', {
            id: `${flow.id}_rewire`, name: flow.name, sourceRef: src, targetRef: tgt,
          });
          src.outgoing.push(nf);
          tgt.incoming.push(nf);
          newFlows.push(nf);
        }
      }
    }
  }

  const caId = callActivity.id;
  for (const flow of parentFlows) {
    const srcId = flow.sourceRef?.id || flow.sourceRef;
    const tgtId = flow.targetRef?.id || flow.targetRef;

    if (tgtId === caId && firstChildNodeId) {
      const src = newNodes.get(srcId);
      const tgt = newNodes.get(firstChildNodeId);
      if (src && tgt) {
        const nf = moddle.create('bpmn:SequenceFlow', {
          id: flow.id, name: flow.name, sourceRef: src, targetRef: tgt,
        });
        src.outgoing.push(nf);
        tgt.incoming.push(nf);
        newFlows.push(nf);
      }
    } else if (srcId === caId && lastChildNodeId) {
      const src = newNodes.get(lastChildNodeId);
      const tgt = newNodes.get(tgtId);
      if (src && tgt) {
        const nf = moddle.create('bpmn:SequenceFlow', {
          id: flow.id, name: flow.name, sourceRef: src, targetRef: tgt,
        });
        src.outgoing.push(nf);
        tgt.incoming.push(nf);
        newFlows.push(nf);
      }
    }
  }

  groupInfos.push({ name: childDef.name || childDef.processId, childNodeIds });
}

function getCalledProcessId(callActivity) {
  if (callActivity.calledElement) return callActivity.calledElement;
  const ext = callActivity.extensionElements?.values;
  if (ext) {
    for (const e of ext) {
      if (e.processId) return e.processId;
    }
  }
  return null;
}

function indexElements(container, allElements, allFlows) {
  for (const el of container.flowElements || []) {
    if (el.$type === 'bpmn:SequenceFlow') {
      allFlows.set(el.id, el);
    } else {
      allElements.set(el.id, el);
      if (el.flowElements) indexElements(el, allElements, allFlows);
    }
  }
}

function extractProperties(node) {
  const props = {};
  const skip = new Set(['id', '$type', 'incoming', 'outgoing', 'flowElements', '$parent', 'di']);
  for (const key of Object.keys(node)) {
    if (key.startsWith('$') || skip.has(key)) continue;
    props[key] = node[key];
  }
  return props;
}

function getNodeSize(node) {
  if (node.$type.includes('Event')) return { w: 36, h: 36 };
  if (node.$type.includes('Gateway')) return { w: 50, h: 50 };
  return { w: 100, h: 80 };
}

function layoutGraph(nodes, flows) {
  const xGap = 160;
  const yGap = 120;
  const xStart = 100;
  const yStart = 100;

  const nodeIds = new Set(nodes.map(n => n.id));
  const adj = new Map();
  const radj = new Map();
  const inDegree = new Map();

  for (const n of nodes) {
    adj.set(n.id, []);
    radj.set(n.id, []);
    inDegree.set(n.id, 0);
  }

  for (const f of flows) {
    const src = f.sourceRef?.id;
    const tgt = f.targetRef?.id;
    if (!nodeIds.has(src) || !nodeIds.has(tgt)) continue;
    adj.get(src).push(tgt);
    radj.get(tgt).push(src);
    inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
  }

  const col = new Map();
  const queue = [];
  for (const n of nodes) {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
      col.set(n.id, 0);
    }
  }

  while (queue.length) {
    const id = queue.shift();
    for (const tgt of adj.get(id)) {
      const newCol = col.get(id) + 1;
      if (!col.has(tgt) || col.get(tgt) < newCol) col.set(tgt, newCol);
      inDegree.set(tgt, inDegree.get(tgt) - 1);
      if (inDegree.get(tgt) === 0) queue.push(tgt);
    }
  }

  for (const n of nodes) {
    if (!col.has(n.id)) col.set(n.id, 0);
  }

  const columns = new Map();
  for (const n of nodes) {
    const c = col.get(n.id);
    if (!columns.has(c)) columns.set(c, []);
    columns.get(c).push(n.id);
  }

  const row = new Map();
  for (const [, ids] of [...columns.entries()].sort((a, b) => a[0] - b[0])) {
    ids.sort((a, b) => {
      const aParentRow = radj.get(a).length ? Math.min(...radj.get(a).map(p => row.get(p) ?? 0)) : 0;
      const bParentRow = radj.get(b).length ? Math.min(...radj.get(b).map(p => row.get(p) ?? 0)) : 0;
      return aParentRow - bParentRow;
    });
    for (let i = 0; i < ids.length; i++) row.set(ids[i], i);
  }

  const positions = new Map();
  for (const n of nodes) {
    const size = getNodeSize(n);
    const c = col.get(n.id);
    const r = row.get(n.id);
    positions.set(n.id, {
      x: xStart + c * (100 + xGap),
      y: yStart + r * (80 + yGap) - size.h / 2,
      ...size,
    });
  }
  return positions;
}

async function parse(moddle, xml) {
  const { rootElement } = await moddle.fromXML(xml);
  return rootElement;
}
