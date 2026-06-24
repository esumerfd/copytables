// Content-script entry point. Owns the SelectionManager, intercepts the native
// copy event for the default format, and performs copies requested by the popup
// or by a keyboard command relayed through the service worker.

import { load } from '../lib/preferences.js';
import { isTextFormat, clipboardText } from '../lib/clipboard-format.js';
import { toDelimited, selectedColumnSpan } from '../lib/matrix.js';
import { SelectionManager } from './selection.js';
import { copyAsIs, copyTextFormat, buildStyledTable } from './clipboard.js';

let manager;

async function init() {
  const prefs = await load();
  manager = new SelectionManager(prefs);
  manager.attach();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.preferences) {
      load().then((p) => manager.setPrefs(p));
    }
  });

  // Native Ctrl/Cmd+C: fill the clipboard synchronously from the event.
  document.addEventListener('copy', onNativeCopy, true);

  // Popup / command relay requests.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'copy') {
      performCopy(msg.format).catch((err) => console.error('[copytables]', err));
    }
  });
}

function onNativeCopy(e) {
  const sel = manager.getSelection();
  if (!sel) return;
  // A selection spanning more than one column always copies as CSV — that's the
  // useful spreadsheet-paste — regardless of the configured default. Single-cell
  // and single-column selections fall back to the default format.
  const multiColumn = selectedColumnSpan(sel.matrix, sel.isSelected) > 1;
  const format = multiColumn ? 'csv' : manager.prefs.defaultFormat;
  e.preventDefault();
  if (isTextFormat(format)) {
    e.clipboardData.setData('text/plain', clipboardText(sel.matrix, format, { isSelected: sel.isSelected }));
  } else {
    const table = buildStyledTable(sel.matrix, sel.isSelected);
    e.clipboardData.setData('text/html', table.outerHTML);
    e.clipboardData.setData('text/plain', toDelimited(sel.matrix, { delimiter: '\t', isSelected: sel.isSelected }));
  }
}

async function performCopy(format) {
  const sel = manager.getSelection();
  if (!sel) return;
  if (isTextFormat(format)) {
    await copyTextFormat(sel.matrix, format, sel.isSelected);
  } else {
    await copyAsIs(sel.matrix, sel.isSelected);
  }
}

init();
