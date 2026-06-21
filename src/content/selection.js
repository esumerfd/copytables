// Modifier-drag selection manager: wires DOM events to the tested geometry,
// marks selected cells with a data-* attribute, drives the infobox, and
// auto-scrolls when the drag reaches the viewport edge.

import { buildMatrix } from '../lib/matrix.js';
import { matchMode } from '../lib/modifiers.js';
import { cellsForSelection, autoScrollDelta } from '../lib/geometry.js';
import { Infobox } from './infobox.js';

const MARK = 'data-copytables-selected';

function injectStyle() {
  if (document.getElementById('copytables-style')) return;
  const style = document.createElement('style');
  style.id = 'copytables-style';
  style.textContent = `[${MARK}]{background-color:rgba(33,150,243,0.35)!important;}`;
  (document.head || document.documentElement).appendChild(style);
}

function modifiersOf(e) {
  return { alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, meta: e.metaKey };
}

export class SelectionManager {
  constructor(prefs) {
    this.prefs = prefs;
    this.infobox = new Infobox();
    this.table = null;
    this.matrix = null;
    this.anchor = null;
    this.mode = null;
    this.dragging = false;
    this.pointer = { x: 0, y: 0 };
    this.rafId = 0;
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
  }

  setPrefs(prefs) {
    this.prefs = prefs;
  }

  attach() {
    injectStyle();
    document.addEventListener('mousedown', this._onMouseDown, true);
    document.addEventListener('mousemove', this._onMouseMove, true);
    document.addEventListener('mouseup', this._onMouseUp, true);
  }

  isSelected = (el) => el.hasAttribute && el.hasAttribute(MARK);

  /** Current selection, or null. */
  getSelection() {
    if (!this.matrix) return null;
    return { table: this.table, matrix: this.matrix, isSelected: this.isSelected };
  }

  clear() {
    if (this.table) {
      for (const el of this.table.querySelectorAll(`[${MARK}]`)) {
        el.removeAttribute(MARK);
      }
    }
    this.table = null;
    this.matrix = null;
    this.anchor = null;
    this.mode = null;
    this.infobox.hide();
  }

  onMouseDown(e) {
    if (e.button !== 0) return;
    const mode = matchMode(modifiersOf(e), this.prefs.modifiers);
    if (!mode) return;
    const cell = e.target.closest && e.target.closest('td, th');
    const table = cell && cell.closest('table');
    if (!cell || !table) return;

    e.preventDefault();
    if (table !== this.table) this.clear();
    this.table = table;
    this.matrix = buildMatrix(table);
    this.anchor = cell;
    this.mode = mode;
    this.dragging = true;
    this.pointer = { x: e.clientX, y: e.clientY };
    this.applySelection(cell, { x: e.clientX, y: e.clientY });
    this.startAutoScroll();
  }

  onMouseMove(e) {
    if (!this.dragging) return;
    e.preventDefault();
    this.pointer = { x: e.clientX, y: e.clientY };
    const focus = this.cellUnder(e.clientX, e.clientY);
    if (focus) this.applySelection(focus, { x: e.clientX, y: e.clientY });
  }

  onMouseUp() {
    this.dragging = false;
    this.stopAutoScroll();
  }

  cellUnder(x, y) {
    const target = document.elementFromPoint(x, y);
    const cell = target && target.closest && target.closest('td, th');
    return cell && cell.closest('table') === this.table ? cell : null;
  }

  applySelection(focus, at) {
    const selected = cellsForSelection(this.matrix, this.anchor, focus, this.mode);
    for (const el of this.table.querySelectorAll(`[${MARK}]`)) {
      if (!selected.has(el)) el.removeAttribute(MARK);
    }
    const texts = [];
    for (const el of selected) {
      el.setAttribute(MARK, '');
      texts.push(el.textContent);
    }
    if (this.prefs.showInfobox) {
      this.infobox.update(texts, this.prefs.numberFormat, at);
    }
  }

  startAutoScroll() {
    if (this.rafId) return;
    const step = () => {
      if (!this.dragging) {
        this.rafId = 0;
        return;
      }
      const d = autoScrollDelta(
        this.pointer,
        { width: window.innerWidth, height: window.innerHeight },
        { speed: this.prefs.autoScrollSpeed }
      );
      if (d.x || d.y) {
        window.scrollBy(d.x, d.y);
        const focus = this.cellUnder(this.pointer.x, this.pointer.y);
        if (focus) this.applySelection(focus, this.pointer);
      }
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stopAutoScroll() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }
}
