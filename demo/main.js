import { createFlowSkinBPMN, createFlowSkinModeler } from 'flowskin-bpmn';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import sampleXml from './sample.bpmn?raw';

const themeValue = localStorage.getItem('beat-theme') || 'dark';

// Beat (top layer, clipped)
const beat = createFlowSkinBPMN({
  container: '#canvas-beat',
  theme: themeValue,
  hoverCard: true,
});

// Raw/Original (behind)
const rawViewer = new BpmnViewer({ container: '#canvas-raw' });

let modelerInstance = null;
let isModelerMode = false;
let currentXml = sampleXml;

function loadBoth(xml) {
  beat.loadXml(xml);
  rawViewer.importXML(xml).then(() => {
    rawViewer.get('canvas').zoom('fit-viewport', 'auto');
  });
}

loadBoth(sampleXml);

// Draggable splitter — clip-path based
const splitter = document.getElementById('splitter');
const container = document.getElementById('compare-container');
const beatPane = document.getElementById('canvas-beat');
let dragging = false;

function setSplitAt(pct) {
  const right = 100 - pct;
  beatPane.style.clipPath = `inset(0 ${right}% 0 0)`;
  splitter.style.left = pct + '%';
}

splitter.addEventListener('mousedown', (e) => {
  dragging = true;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const rect = container.getBoundingClientRect();
  const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
  setSplitAt(pct);
});

document.addEventListener('mouseup', () => { dragging = false; });

// File import
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  file.text().then(xml => {
    currentXml = xml;
    if (isModelerMode && modelerInstance) {
      modelerInstance.loadXml(xml);
      rawViewer.importXML(xml).then(() => rawViewer.get('canvas').zoom('fit-viewport', 'auto'));
    } else {
      loadBoth(xml);
    }
  });
});

// Theme toggle
const toggle = document.getElementById('theme-toggle');
toggle.textContent = themeValue === 'light' ? '☾' : '☀';

toggle.addEventListener('click', () => {
  const current = isModelerMode && modelerInstance ? modelerInstance.getTheme() : beat.getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem('beat-theme', next);
  toggle.textContent = next === 'light' ? '☾' : '☀';

  if (isModelerMode && modelerInstance) {
    modelerInstance.setTheme(next);
  } else {
    beat.setTheme(next);
  }
});

// Animation mode toggle
const animBtn = document.getElementById('anim-toggle');
const animModes = ['none', 'parallel', 'sequential', 'loading'];
const animLabels = { none: 'No Anim', parallel: 'Parallel', sequential: 'Sequential', loading: 'Loading' };
let currentAnimMode = 'none';
let stopCurrentAnim = null;
animBtn.textContent = animLabels[currentAnimMode];

function getActiveInstance() {
  if (isModelerMode && modelerInstance) return modelerInstance;
  return beat;
}

function getAllEdgeIds() {
  const instance = getActiveInstance();
  const viewer = instance.getViewer ? instance.getViewer() : instance.getModeler();
  const registry = viewer.get('elementRegistry');
  return registry.filter(el => el.type === 'bpmn:SequenceFlow').map(el => el.id);
}

animBtn.addEventListener('click', () => {
  const idx = animModes.indexOf(currentAnimMode);
  const next = animModes[(idx + 1) % animModes.length];
  currentAnimMode = next;
  animBtn.textContent = animLabels[next];

  if (stopCurrentAnim) { stopCurrentAnim(); stopCurrentAnim = null; }
  if (next === 'none') return;

  const edgeIds = getAllEdgeIds();
  stopCurrentAnim = getActiveInstance().animateEdges(edgeIds, { type: next });
});

// Badges demo toggle
const badgeBtn = document.getElementById('badge-toggle');
let badgesActive = false;

if (badgeBtn) {
  badgeBtn.addEventListener('click', () => {
    badgesActive = !badgesActive;
    badgeBtn.textContent = badgesActive ? 'Clear Badges' : 'Badges';

    const instance = getActiveInstance();
    if (badgesActive) {
      const viewer = instance.getViewer ? instance.getViewer() : instance.getModeler();
      const registry = viewer.get('elementRegistry');
      const tasks = registry.filter(el => el.type && el.type.includes('Task'));
      const states = {};
      tasks.forEach((t, i) => {
        const mod = i % 4;
        if (mod === 0) states[t.id] = 'running';
        else if (mod === 1) states[t.id] = 'completed';
        else if (mod === 2) states[t.id] = 'incident';
        else states[t.id] = 'hold';
      });
      instance.setNodeStates(states);
    } else {
      instance.clearNodeStates();
    }
  });
}

// Modeler toggle
const modelerBtn = document.getElementById('modeler-toggle');
if (modelerBtn) {
  modelerBtn.addEventListener('click', async () => {
    if (stopCurrentAnim) { stopCurrentAnim(); stopCurrentAnim = null; }

    if (!isModelerMode) {
      beat.getViewer().detach();

      if (!modelerInstance) {
        modelerInstance = createFlowSkinModeler({
          container: '#canvas-beat',
          theme: localStorage.getItem('beat-theme') || 'dark',
          hoverCard: false,
        });
      } else {
        modelerInstance.getModeler().attachTo('#canvas-beat');
      }

      await modelerInstance.loadXml(currentXml);
      isModelerMode = true;
      modelerBtn.textContent = 'Viewer';
    } else {
      currentXml = await modelerInstance.saveXml();
      modelerInstance.getModeler().detach();

      beat.getViewer().attachTo('#canvas-beat');
      await beat.loadXml(currentXml);
      rawViewer.importXML(currentXml).then(() => rawViewer.get('canvas').zoom('fit-viewport', 'auto'));
      isModelerMode = false;
      modelerBtn.textContent = 'Modeler';
    }
  });
}

// Save XML button (modeler mode)
const saveBtn = document.getElementById('save-xml');
if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    if (!isModelerMode || !modelerInstance) return;
    const xml = await modelerInstance.saveXml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.bpmn';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Raw toggle — hidden, comparison is always on
const rawBtn = document.getElementById('raw-toggle');
if (rawBtn) rawBtn.style.display = 'none';
