import { createFlowSkinBPMN, flattenBpmn } from 'flowskin-bpmn';
import parentXml from './sample-parent.bpmn?raw';
import childXml from './sample-child.bpmn?raw';

const theme = localStorage.getItem('beat-theme') || 'dark';

const parentViewer = createFlowSkinBPMN({ container: '#parent-canvas', theme, hoverCard: false });
const childViewer = createFlowSkinBPMN({ container: '#child-canvas', theme, hoverCard: false });
let resultViewer = null;

const selectedParentEdges = new Set();
const selectedChildEdges = new Set();

await parentViewer.loadXml(parentXml);
await childViewer.loadXml(childXml);

function getEdges(viewer) {
  const registry = viewer.getViewer().get('elementRegistry');
  return registry.filter(el => el.type === 'bpmn:SequenceFlow');
}

function renderEdgeList(containerId, edges, selectedSet, viewer) {
  const ul = document.getElementById(containerId);
  ul.innerHTML = '';
  for (const edge of edges) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="dot"></span>${edge.businessObject.name || edge.id}`;
    li.title = edge.id;
    if (selectedSet.has(edge.id)) li.classList.add('selected');
    li.addEventListener('click', () => {
      if (selectedSet.has(edge.id)) {
        selectedSet.delete(edge.id);
        li.classList.remove('selected');
      } else {
        selectedSet.add(edge.id);
        li.classList.add('selected');
      }
      updateHighlights(viewer, selectedSet);
      updateButton();
    });
    ul.appendChild(li);
  }
}

function updateHighlights(flowskinInstance, selectedSet) {
  const registry = flowskinInstance.getViewer().get('elementRegistry');
  const canvas = flowskinInstance.getViewer().get('canvas');
  const edges = registry.filter(el => el.type === 'bpmn:SequenceFlow');
  for (const edge of edges) {
    const gfx = registry.getGraphics(edge);
    if (!gfx) continue;
    const path = gfx.querySelector('path');
    if (!path) continue;
    if (selectedSet.has(edge.id)) {
      path.style.stroke = '#4361ee';
      path.style.strokeWidth = '3px';
      path.style.opacity = '1';
    } else {
      path.style.stroke = '';
      path.style.strokeWidth = '';
      path.style.opacity = '0.4';
    }
  }
}

function updateButton() {
  const btn = document.getElementById('flatten-btn');
  btn.disabled = selectedParentEdges.size === 0;
}

const parentEdges = getEdges(parentViewer);
const childEdges = getEdges(childViewer);

renderEdgeList('parent-edges', parentEdges, selectedParentEdges, parentViewer);
renderEdgeList('child-edges', childEdges, selectedChildEdges, childViewer);

document.getElementById('flatten-btn').addEventListener('click', async () => {
  const btn = document.getElementById('flatten-btn');
  btn.disabled = true;
  btn.textContent = 'Flattening...';

  try {
    const xml = await flattenBpmn({
      parent: {
        xml: parentXml,
        executedEdgeIds: [...selectedParentEdges],
      },
      children: [
        {
          processId: 'Process_Shipping',
          name: 'Shipping',
          xml: childXml,
          executedEdgeIds: [...selectedChildEdges],
        }
      ]
    });

    const resultPanel = document.getElementById('result-panel');
    resultPanel.style.display = '';
    document.getElementById('main-area').classList.add('has-result');

    if (!resultViewer) {
      resultViewer = createFlowSkinBPMN({ container: '#result-canvas', theme, hoverCard: true });
    }
    await resultViewer.loadXml(xml);
  } catch (e) {
    console.error('Flatten error:', e);
    alert('Flatten failed: ' + e.message);
  }

  btn.disabled = false;
  btn.textContent = 'Flatten Executed Path';
});
