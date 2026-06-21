import { describe, it, expect, beforeEach } from 'vitest';
import { SelectionManager } from '../src/content/selection.js';
import { DEFAULTS } from '../src/lib/preferences.js';

const MARK = 'data-copytables-selected';

function table() {
  document.body.innerHTML =
    '<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>';
  return document.querySelector('table');
}

function mousedown(target, opts = {}) {
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, ...opts }));
}

function mouseup(target = document.body) {
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
}

describe('SelectionManager — clear on click away', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('marks a cell when alt-clicked', () => {
    const t = table();
    const mgr = new SelectionManager(DEFAULTS);
    mgr.attach();
    mousedown(t.querySelector('td'), { altKey: true });
    mouseup();
    expect(mgr.getSelection()).not.toBeNull();
    expect(document.querySelectorAll(`[${MARK}]`).length).toBeGreaterThan(0);
  });

  it('clears the selection on a plain click away', () => {
    const t = table();
    const mgr = new SelectionManager(DEFAULTS);
    mgr.attach();
    mousedown(t.querySelector('td'), { altKey: true });
    mouseup();
    expect(mgr.getSelection()).not.toBeNull();

    mousedown(document.body); // no modifier — click away
    expect(mgr.getSelection()).toBeNull();
    expect(document.querySelectorAll(`[${MARK}]`).length).toBe(0);
  });
});
