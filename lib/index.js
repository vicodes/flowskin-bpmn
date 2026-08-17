import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import BeatRenderer from './renderer/BeatRenderer.js';
import { highlightEdge, highlightEdges } from './renderer/edges.js';
import { setTheme, getThemeName, isDark } from './theme.js';
import { animateEdges, stopAllEdgeAnimations } from './animations/index.js';
import { setupHoverCard } from './hoverCard.js';

const beatModule = {
  __init__: ['beatRenderer'],
  beatRenderer: ['type', BeatRenderer],
};

/**
 * Create a FlowSkin BPMN renderer instance.
 *
 * @param {object} options
 * @param {string|HTMLElement} options.container - CSS selector or DOM element
 * @param {string} [options.theme='dark'] - 'dark' | 'light'
 * @param {boolean} [options.hoverCard=true] - show hover details card
 * @returns {FlowSkinBPMN}
 */
export function createFlowSkinBPMN(options = {}) {
  const {
    container,
    theme: initialTheme = 'dark',
    hoverCard = true,
  } = options;

  setTheme(initialTheme);

  const viewer = new BpmnViewer({
    container,
    additionalModules: [beatModule],
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
      await viewer.importXML(xml);
      viewer.get('canvas').zoom('fit-viewport', 'auto');
      if (hoverCard) setupHoverCard(viewer);
    },

    /**
     * Set the color theme.
     * @param {'dark'|'light'} t
     */
    setTheme(t) {
      setTheme(t);
      if (currentXml) api.loadXml(currentXml);
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
     * Highlight a specific edge by its BPMN element ID.
     * @param {string} edgeId
     * @param {object} [options] - { color, width, glow }
     * @returns {Function|null} unhighlight function
     */
    highlightEdge(edgeId, options) {
      return highlightEdge(viewer, edgeId, options);
    },

    /**
     * Highlight multiple edges.
     * @param {string[]} edgeIds
     * @param {object} [options]
     * @returns {Function} unhighlight all
     */
    highlightEdges(edgeIds, options) {
      return highlightEdges(viewer, edgeIds, options);
    },

    /**
     * Animate specific edges by their IDs.
     * @param {string[]} edgeIds - BPMN element IDs of sequence flows
     * @param {object} options
     * @param {'parallel'|'sequential'|'loading'} options.type - animation style
     * @param {string} [options.color] - override color
     * @param {number} [options.speed=1] - speed multiplier
     * @returns {Function} stop function
     */
    animateEdges(edgeIds, options) {
      return animateEdges(viewer, edgeIds, options);
    },

    /**
     * Stop all active edge animations.
     */
    stopAllEdgeAnimations() {
      stopAllEdgeAnimations();
    },

    /**
     * Get the underlying bpmn-js viewer instance.
     */
    getViewer() { return viewer; },

    /**
     * Destroy the viewer and clean up.
     */
    destroy() {
      stopAllAnims();
      viewer.destroy();
      const card = document.getElementById('beat-hover-card');
      if (card) card.remove();
    },
  };

  return api;
}

// Re-export utilities for advanced usage
export { setTheme, isDark, highlightEdge, highlightEdges };
export { animateEdges, stopAllEdgeAnimations } from './animations/index.js';
export { setupHoverCard } from './hoverCard.js';
