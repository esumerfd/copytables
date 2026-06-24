// Service worker: storage + commands relay only. It never touches the
// clipboard or the DOM — all copying happens in the content script, the one
// context with both a document and genuine user activation.

// Maps each command id to the copy format the content script should produce.
const COMMAND_FORMAT = {
  copy_asis: 'asis',
  copy_csv: 'csv',
};

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open_options') {
    chrome.runtime.openOptionsPage();
    return;
  }
  const format = COMMAND_FORMAT[command];
  if (!format) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'copy', format }).catch(() => {
      // No content script on this page (e.g. chrome:// URLs) — ignore.
    });
  }
});
