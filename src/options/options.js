// Options page: edit modifier bindings, default format, and number format.
// Reads/writes through the tested preferences module.

import { DEFAULTS, load, save } from '../lib/preferences.js';
import { FORMATS } from '../lib/clipboard-format.js';

const MODES = ['cell', 'column', 'row', 'table'];
// Cmd (meta) is offered before Ctrl because the defaults use Cmd — Ctrl-click
// pops the macOS context menu. Ctrl stays available for Windows/Linux users.
const MOD_KEYS = [
  { key: 'alt', label: 'alt' },
  { key: 'meta', label: 'cmd' },
  { key: 'shift', label: 'shift' },
  { key: 'ctrl', label: 'ctrl' },
];

const els = {
  modifiers: document.getElementById('modifiers'),
  defaultFormat: document.getElementById('defaultFormat'),
  decimal: document.getElementById('decimal'),
  group: document.getElementById('group'),
  showInfobox: document.getElementById('showInfobox'),
  save: document.getElementById('save'),
  saved: document.getElementById('saved'),
  shortcutsLink: document.getElementById('shortcutsLink'),
};

// Build the modifier checkboxes (one row per selection mode).
for (const mode of MODES) {
  const row = document.createElement('div');
  row.className = 'row';
  const label = document.createElement('strong');
  label.textContent = mode;
  label.style.width = '70px';
  label.style.display = 'inline-block';
  row.appendChild(label);
  for (const { key, label: keyLabel } of MOD_KEYS) {
    const wrap = document.createElement('label');
    wrap.style.margin = '0';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.mode = mode;
    cb.dataset.key = key;
    wrap.append(cb, document.createTextNode(' ' + keyLabel));
    row.appendChild(wrap);
  }
  els.modifiers.appendChild(row);
}

for (const f of FORMATS) {
  const opt = document.createElement('option');
  opt.value = f.id;
  opt.textContent = f.label;
  els.defaultFormat.appendChild(opt);
}

function apply(prefs) {
  for (const cb of els.modifiers.querySelectorAll('input')) {
    const mods = prefs.modifiers[cb.dataset.mode] || [];
    cb.checked = mods.includes(cb.dataset.key);
  }
  els.defaultFormat.value = prefs.defaultFormat;
  els.decimal.value = prefs.numberFormat.decimal;
  els.group.value = prefs.numberFormat.group;
  els.showInfobox.checked = prefs.showInfobox;
}

function collect() {
  const modifiers = {};
  for (const mode of MODES) modifiers[mode] = [];
  for (const cb of els.modifiers.querySelectorAll('input')) {
    if (cb.checked) modifiers[cb.dataset.mode].push(cb.dataset.key);
  }
  return {
    modifiers,
    defaultFormat: els.defaultFormat.value,
    numberFormat: { decimal: els.decimal.value, group: els.group.value },
    showInfobox: els.showInfobox.checked,
  };
}

els.save.addEventListener('click', async () => {
  await save(collect());
  els.saved.hidden = false;
  setTimeout(() => (els.saved.hidden = true), 1500);
});

els.shortcutsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

load().then(apply).catch(() => apply(DEFAULTS));
