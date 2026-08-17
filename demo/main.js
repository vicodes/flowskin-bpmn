import { createFlowSkinBPMN } from 'flowskin-bpmn';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import sampleXml from './sample.bpmn?raw';

const beat = createFlowSkinBPMN({
  container: '#canvas',
  theme: localStorage.getItem('beat-theme') || 'dark',
  hoverCard: true,
});

let currentXml = sampleXml;
beat.loadXml(sampleXml);

// File import
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  file.text().then(xml => {
    currentXml = xml;
    beat.loadXml(xml);
  });
});

// Theme toggle
const toggle = document.getElementById('theme-toggle');
toggle.textContent = beat.getTheme() === 'light' ? '☾' : '☀';

toggle.addEventListener('click', () => {
  const next = beat.getTheme() === 'light' ? 'dark' : 'light';
  beat.setTheme(next);
  localStorage.setItem('beat-theme', next);
  toggle.textContent = next === 'light' ? '☾' : '☀';
});

// Animation mode toggle — demonstrates animateEdges API
const animBtn = document.getElementById('anim-toggle');
const animModes = ['none', 'parallel', 'sequential', 'loading'];
const animLabels = { none: 'No Anim', parallel: 'Parallel', sequential: 'Sequential', loading: 'Loading' };
let currentAnimMode = 'none';
let stopCurrentAnim = null;
animBtn.textContent = animLabels[currentAnimMode];

function getAllEdgeIds() {
  const registry = beat.getViewer().get('elementRegistry');
  return registry.filter(el => el.type === 'bpmn:SequenceFlow').map(el => el.id);
}

animBtn.addEventListener('click', () => {
  const idx = animModes.indexOf(currentAnimMode);
  const next = animModes[(idx + 1) % animModes.length];
  currentAnimMode = next;
  animBtn.textContent = animLabels[next];

  // Stop previous animation
  if (stopCurrentAnim) { stopCurrentAnim(); stopCurrentAnim = null; }

  if (next === 'none') return;

  // Animate all edges with chosen type
  const edgeIds = getAllEdgeIds();
  stopCurrentAnim = beat.animateEdges(edgeIds, { type: next });
});

// Raw BPMN toggle
const rawBtn = document.getElementById('raw-toggle');
let isRaw = false;
let rawViewer = null;

rawBtn.addEventListener('click', () => {
  isRaw = !isRaw;
  rawBtn.textContent = isRaw ? 'Beat' : 'Raw';

  if (isRaw) {
    beat.getViewer().detach();
    if (!rawViewer) rawViewer = new BpmnViewer({ container: '#canvas' });
    else rawViewer.attachTo('#canvas');
    rawViewer.importXML(currentXml).then(() => {
      rawViewer.get('canvas').zoom('fit-viewport', 'auto');
    });
  } else {
    if (rawViewer) rawViewer.detach();
    beat.getViewer().attachTo('#canvas');
    beat.loadXml(currentXml);
  }
});
