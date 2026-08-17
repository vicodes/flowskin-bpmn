const LIGHT = {
  nodeBg: '#ffffff',
  nodeBorder: '#d0d0d8',
  text: '#1a1a2e',
  sep: '#e0e0e0',
  subBorder: '#d0d0d8',
  edge: '#4361ee',
  eventBorder: '#d0d0d8',
  startAccent: '#16a34a',
  endBorder: '#888898',
  callActivityBorder: '#8b5cf6',
  callActivityInner: '#8b5cf6',
  boundaryRing: '#8b5cf6',
  iconBlue: '#3463F3',
  iconGreen: '#10b981',
  iconPurple: '#8b5cf6',
  iconIndigo: '#6366f1',
  loadingStripe: '#2563eb',
};

const DARK = {
  nodeBg: '#1e1e2a',
  nodeBorder: '#3a3a4a',
  text: '#e0e0e8',
  sep: '#3a3a4a',
  subBorder: '#3a3a4a',
  edge: '#6b8aff',
  eventBorder: '#3a3a4a',
  startAccent: '#4ade80',
  endBorder: '#555566',
  callActivityBorder: '#a78bfa',
  callActivityInner: '#a78bfa',
  boundaryRing: '#a78bfa',
  iconBlue: '#6b8aff',
  iconGreen: '#34d399',
  iconPurple: '#a78bfa',
  iconIndigo: '#818cf8',
  loadingStripe: '#00e5ff',
};

let currentTheme = 'dark';

export function setTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : '');
}

export function getThemeName() { return currentTheme; }
export function isDark() { return currentTheme !== 'light'; }
export function theme() { return isDark() ? DARK : LIGHT; }

/**
 * Adapt a BPMN inline color for dark mode.
 * Makes light fills darker/muted and dark strokes lighter.
 */
export function adaptColor(hex, role) {
  if (!hex || !isDark()) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r + g + b) / 3;

  if (role === 'fill') {
    // Light fills → dark muted version (reduce brightness, add transparency feel)
    const dr = Math.round(r * 0.25 + 20);
    const dg = Math.round(g * 0.25 + 20);
    const db = Math.round(b * 0.25 + 20);
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  }
  if (role === 'stroke') {
    // Dark strokes → lighter subtle version
    const lr = Math.min(255, Math.round(r * 0.6 + 100));
    const lg = Math.min(255, Math.round(g * 0.6 + 100));
    const lb = Math.min(255, Math.round(b * 0.6 + 100));
    return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
  }
  if (role === 'text') {
    // Dark text → lighter
    if (brightness < 128) {
      const lr = Math.min(255, r + 140);
      const lg = Math.min(255, g + 140);
      const lb = Math.min(255, b + 140);
      return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
    }
    return hex;
  }
  return hex;
}
