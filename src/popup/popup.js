// Popup: renders one button per copy format and relays the chosen format to the
// content script in the active tab, which performs the clipboard write.

import { FORMATS } from '../lib/clipboard-format.js';

const container = document.getElementById('buttons');
const hint = document.getElementById('hint');

for (const format of FORMATS) {
  const button = document.createElement('button');
  button.textContent = format.label;
  button.addEventListener('click', () => copy(format.id));
  container.appendChild(button);
}

async function copy(formatId) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.id == null) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'copy', format: formatId });
    hint.textContent = 'Copied.';
    hint.id = 'status';
    setTimeout(() => window.close(), 500);
  } catch {
    hint.textContent = 'No table selection on this page.';
  }
}
