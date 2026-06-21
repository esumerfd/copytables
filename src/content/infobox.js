// Floating infobox: shows count/sum/avg/min/max for the current selection.
// All stat math/formatting lives in tested lib modules; this only renders DOM.

import { statsFromTexts } from '../lib/numbers.js';
import { formatStats } from '../lib/infobox-format.js';

const HOST_ID = 'copytables-infobox';

export class Infobox {
  constructor() {
    this.el = null;
  }

  ensure() {
    if (this.el) return this.el;
    const el = document.createElement('div');
    el.id = HOST_ID;
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      background: 'rgba(33, 33, 33, 0.92)',
      color: '#fff',
      font: '12px/1.4 system-ui, sans-serif',
      padding: '6px 8px',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      whiteSpace: 'nowrap',
      display: 'none',
    });
    document.documentElement.appendChild(el);
    this.el = el;
    return el;
  }

  /**
   * @param {string[]} cellTexts  Text of every selected cell.
   * @param {{decimal:string, group:string}} numberFormat
   * @param {{x:number, y:number}} at  Client position to anchor near.
   */
  update(cellTexts, numberFormat, at) {
    const stats = statsFromTexts(cellTexts, numberFormat);
    const rows = formatStats(stats, numberFormat);
    const el = this.ensure();
    el.textContent = '';
    for (const { label, value } of rows) {
      const line = document.createElement('div');
      const k = document.createElement('span');
      k.textContent = label + ': ';
      k.style.opacity = '0.7';
      const v = document.createElement('span');
      v.textContent = value;
      line.append(k, v);
      el.appendChild(line);
    }
    el.style.display = 'block';
    // Offset from the pointer; flip if it would run off the right/bottom edge.
    const pad = 14;
    const rect = el.getBoundingClientRect();
    let x = at.x + pad;
    let y = at.y + pad;
    if (x + rect.width > window.innerWidth) x = at.x - rect.width - pad;
    if (y + rect.height > window.innerHeight) y = at.y - rect.height - pad;
    el.style.left = Math.max(0, x) + 'px';
    el.style.top = Math.max(0, y) + 'px';
  }

  hide() {
    if (this.el) this.el.style.display = 'none';
  }
}
