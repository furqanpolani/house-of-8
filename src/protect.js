// Deters casual inspection on the live site: no context menu, no
// devtools / view-source / save shortcuts, no dragging images out.
// This is a deterrent only — anything a browser renders can still be
// inspected by someone determined. Secrets must stay on the server.

const EDITABLE = 'input, textarea, select, [contenteditable="true"]';

function isBlockedShortcut(e) {
  const key = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  if (e.key === 'F12') return true;
  // Ctrl/Cmd+Shift+I/J/C (devtools), Cmd+Option+I/J/C/U on macOS
  if (mod && (e.shiftKey || e.altKey) && ['i', 'j', 'c', 'u'].includes(key)) return true;
  // Ctrl/Cmd+U (view source), Ctrl/Cmd+S (save page)
  if (mod && !e.shiftKey && ['u', 's'].includes(key)) return true;
  return false;
}

export function enableSourceProtection() {
  // Right-click stays available in form fields so customers can paste.
  document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest(EDITABLE)) e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    if (isBlockedShortcut(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
}
