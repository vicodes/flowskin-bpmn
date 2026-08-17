import BpmnModeler from 'bpmn-js/lib/Modeler';
import BeatRenderer from './renderer/BeatRenderer.js';
import { highlightEdge, highlightEdges } from './renderer/edges.js';
import { setTheme, getThemeName, isDark } from './theme.js';
import { animateEdges, stopAllEdgeAnimations } from './animations/index.js';
import { setupHoverCard } from './hoverCard.js';
import { setNodeStates, clearNodeStates } from './badges.js';

const beatModule = {
  __init__: ['beatRenderer'],
  beatRenderer: ['type', BeatRenderer],
};

const EMPTY_DIAGRAM =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
  'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
  'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ' +
  'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
  'targetNamespace="http://bpmn.io/schema/bpmn" id="Definitions_1">' +
  '<bpmn:process id="Process_1" isExecutable="false">' +
  '<bpmn:startEvent id="StartEvent_1"/>' +
  '</bpmn:process>' +
  '<bpmndi:BPMNDiagram id="BPMNDiagram_1">' +
  '<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">' +
  '<bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">' +
  '<dc:Bounds x="180" y="160" width="36" height="36"/>' +
  '</bpmndi:BPMNShape>' +
  '</bpmndi:BPMNPlane>' +
  '</bpmndi:BPMNDiagram>' +
  '</bpmn:definitions>';

/**
 * Create a FlowSkin BPMN modeler instance with full editing capabilities.
 *
 * @param {object} options
 * @param {string|HTMLElement} options.container - CSS selector or DOM element
 * @param {string} [options.theme='dark'] - 'dark' | 'light'
 * @param {boolean} [options.hoverCard=true] - show hover details card
 * @param {boolean} [options.keyboard=true] - enable keyboard shortcuts
 * @returns {FlowSkinModeler}
 */
export function createFlowSkinModeler(options = {}) {
  const {
    container,
    theme: initialTheme = 'dark',
    hoverCard = true,
    keyboard = true,
  } = options;

  setTheme(initialTheme);

  const modeler = new BpmnModeler({
    container,
    additionalModules: [beatModule],
    keyboard: { bindTo: keyboard ? document : undefined },
  });

  let currentXml = '';

  function stopAllAnims() {
    stopAllEdgeAnimations();
  }

  const api = {
    /**
     * Load and render a BPMN XML string.
     */
    async loadXml(xml) {
      currentXml = xml;
      stopAllAnims();
      await modeler.importXML(xml);
      modeler.get('canvas').zoom('fit-viewport', 'auto');
      if (hoverCard) setupHoverCard(modeler);
    },

    /**
     * Start with a blank BPMN diagram.
     */
    async createNewDiagram() {
      await api.loadXml(EMPTY_DIAGRAM);
    },

    /**
     * Export current diagram as BPMN 2.0 XML.
     * @returns {Promise<string>}
     */
    async saveXml() {
      const { xml } = await modeler.saveXML({ format: true });
      currentXml = xml;
      return xml;
    },

    /**
     * Export current diagram as SVG.
     * @returns {Promise<string>}
     */
    async saveSvg() {
      const { svg } = await modeler.saveSVG();
      return svg;
    },

    /**
     * Undo the last modeling action.
     */
    undo() {
      modeler.get('commandStack').undo();
    },

    /**
     * Redo the last undone action.
     */
    redo() {
      modeler.get('commandStack').redo();
    },

    /**
     * Check if undo is available.
     * @returns {boolean}
     */
    canUndo() {
      return modeler.get('commandStack').canUndo();
    },

    /**
     * Check if redo is available.
     * @returns {boolean}
     */
    canRedo() {
      return modeler.get('commandStack').canRedo();
    },

    /**
     * Set the color theme.
     * @param {'dark'|'light'} t
     */
    async setTheme(t) {
      setTheme(t);
      if (currentXml) {
        const xml = await api.saveXml();
        await api.loadXml(xml);
      }
    },

    /**
     * Get current theme name.
     */
    getTheme() { return getThemeName(); },

    /**
     * Get the current loaded XML.
     */
    getXml() { return currentXml; },

    /**
     * Highlight a specific edge.
     */
    highlightEdge(edgeId, options) {
      return highlightEdge(modeler, edgeId, options);
    },

    /**
     * Highlight multiple edges.
     */
    highlightEdges(edgeIds, options) {
      return highlightEdges(modeler, edgeIds, options);
    },

    /**
     * Animate edges.
     */
    animateEdges(edgeIds, options) {
      return animateEdges(modeler, edgeIds, options);
    },

    /**
     * Stop all active edge animations.
     */
    stopAllEdgeAnimations() {
      stopAllEdgeAnimations();
    },

    /**
     * Set state badges on nodes.
     * @param {object} states - map of elementId -> 'running'|'completed'|'incident'|'hold'
     */
    setNodeStates(states) {
      setNodeStates(modeler, states);
    },

    /**
     * Clear state badges from nodes.
     * @param {string[]} [elementIds] - if omitted, clears all
     */
    clearNodeStates(elementIds) {
      clearNodeStates(modeler, elementIds);
    },

    /**
     * Get the bpmn-js modeling service for programmatic element manipulation.
     * @returns {object} bpmn-js modeling module
     */
    getModeling() {
      return modeler.get('modeling');
    },

    /**
     * Get the element registry.
     * @returns {object}
     */
    getElementRegistry() {
      return modeler.get('elementRegistry');
    },

    /**
     * Get the underlying bpmn-js modeler instance.
     */
    getModeler() { return modeler; },

    /**
     * Register an event listener.
     * @param {string} event
     * @param {Function} callback
     */
    on(event, callback) {
      modeler.on(event, callback);
    },

    /**
     * Remove an event listener.
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
      modeler.off(event, callback);
    },

    /**
     * Destroy the modeler and clean up.
     */
    destroy() {
      stopAllAnims();
      modeler.destroy();
      const card = document.getElementById('beat-hover-card');
      if (card) card.remove();
    },
  };

  return api;
}
