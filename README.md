# FlowSkin BPMN

A modern, themeable BPMN renderer built on [bpmn-js](https://github.com/bpmn-io/bpmn-js). Replaces the standard BPMN notation with a clean, futuristic design language while keeping full BPMN 2.0 XML compatibility underneath.

**[Working Demo](https://vicodes.github.io/flowskin-bpmn/)**

## Features

- Custom node designs for all BPMN element types (tasks, events, gateways, data, artifacts)
- Distinct SVG icons per element type (service task, user task, script task, etc.)
- Dark/light theme with automatic color adaptation for inline BPMN colors
- Edge animations (parallel dots, sequential traversal, loading beads)
- Edge highlighting API for process visualization
- Hover cards showing element metadata
- Default flow markers, boundary event indicators, call activity double borders
- Association/data flow differentiation from sequence flows
- Zero-config — works out of the box with any BPMN 2.0 XML

## Installation

```bash
npm install flowskin-bpmn
```

### Peer dependency

```bash
npm install bpmn-js
```

## Quick Start

```js
import { createFlowSkinBPMN } from 'flowskin-bpmn';
import 'flowskin-bpmn/styles';

const renderer = createFlowSkinBPMN({
  container: '#canvas',
  theme: 'dark',
  hoverCard: true,
});

await renderer.loadXml(bpmnXmlString);
```

## API

### `createFlowSkinBPMN(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string \| HTMLElement` | required | CSS selector or DOM element |
| `theme` | `'dark' \| 'light'` | `'dark'` | Initial color theme |
| `hoverCard` | `boolean` | `true` | Show details card on hover |

Returns a renderer instance with these methods:

### Instance Methods

```js
// Load/render BPMN XML
await renderer.loadXml(xmlString);

// Theme
renderer.setTheme('light');
renderer.getTheme(); // 'light' | 'dark'

// Animate edges by ID
const stop = renderer.animateEdges(['Flow_1', 'Flow_2'], {
  type: 'loading',    // 'parallel' | 'sequential' | 'loading'
  color: '#00e5ff',   // optional override
  speed: 1.5,         // optional multiplier
});
stop(); // remove animation

// Highlight edges
const unhighlight = renderer.highlightEdge('Flow_1', {
  color: '#ff6b6b',
  width: 4,
  glow: true,
});
unhighlight();

// Highlight multiple
const unhighlightAll = renderer.highlightEdges(['Flow_1', 'Flow_2'], {
  color: '#22c55e',
});
unhighlightAll();

// Stop all animations
renderer.stopAllEdgeAnimations();

// Access underlying bpmn-js viewer
const viewer = renderer.getViewer();

// Cleanup
renderer.destroy();
```

## Node Designs

### Tasks

| Type | Icon | Style |
|------|------|-------|
| Service Task | `</>` code brackets | Card with icon + label |
| User Task | Person silhouette | Card with icon + label |
| Send Task | Paper plane | Card with icon + label |
| Receive Task | Inbox tray | Card with icon + label |
| Script Task | Terminal console | Card with icon + label |
| Business Rule Task | Decision table | Card with icon + label |
| Manual Task | Checkmark | Card with icon + label |
| Call Activity | External link | Double-border card |

### Events

| Type | Icon |
|------|------|
| Timer | Clock face |
| Error | Lightning bolt |
| Message | Envelope |
| Signal | Triangle |
| Terminate | Red stop |
| Conditional | List lines |
| Escalation | Upward arrow |
| Compensate | Rewind |
| Cancel | X cross |
| Link | Arrow pentagon |

**Event indicators:**
- Start events: thin green inner circle
- End events: bold dark border
- Boundary/catch events: dashed purple inner ring

### Gateways

| Type | Icon |
|------|------|
| Exclusive | Diamond with branches |
| Parallel | Fork split |
| Inclusive | Circle with branches |
| Complex | Asterisk |
| Event-based | Pentagon in circle |

### Other Elements

| Type | Design |
|------|--------|
| Participant (Pool) | Header band + building icon |
| Lane | Dashed border |
| Sub-process | Dashed container + layers icon |
| Data Store | Database cylinder |
| Data Object | Document with fold |
| Text Annotation | Open bracket + italic text |
| Group | Dashed rounded rectangle |

### Edges

| Type | Design |
|------|--------|
| Sequence Flow | Solid line + start dot + end bar |
| Default Flow | Chevron marker near source |
| Association | Dotted thin line |
| Data Association | Dotted + arrowhead |

## Themes

Colors automatically adapt between light and dark modes. Inline BPMN colors (bioc:fill, bioc:stroke) are also adapted — light fills become muted in dark mode, dark strokes lighten subtly.

```js
renderer.setTheme('dark');  // Muted backgrounds, bright accents
renderer.setTheme('light'); // White backgrounds, standard colors
```

## Running the Demo

```bash
git clone <repo-url>
cd flowskin-bpmn
npm install
npm run dev
```

Opens http://localhost:3000 with a sample BPMN diagram. Use the toolbar to:
- Import your own `.bpmn` file
- Toggle animation modes
- Switch between custom and raw BPMN rendering
- Toggle dark/light theme

## Project Structure

```
lib/                          # The library (published to npm)
  index.js                    # Public API
  theme.js                    # Theme + color adaptation
  utils.js                    # Shared utilities
  hoverCard.js                # Hover overlay
  styles.css                  # Base styles (import in your app)
  renderer/
    BeatRenderer.js           # bpmn-js BaseRenderer
    shapes.js                 # Node draw functions
    edges.js                  # Edge draw + highlight
    icons.js                  # Icon imports + type mapping
  animations/
    index.js                  # animateEdges API
  icons/                      # 28 SVG icons
demo/                         # Demo application
  index.html
  main.js
  styles.css
  sample.bpmn
```

## License

MIT
