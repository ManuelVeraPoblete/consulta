const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

export const esc = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
};
