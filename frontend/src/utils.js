export const fmt = (k) => k.split('-').reverse().join('-');

export function lastDays(n) {
  const t = new Date(), out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}

export const kmpl = (km, hsd) => (+km && +hsd ? (km / hsd).toFixed(2) : '');

export const busCompare = (a, b) => {
  const x = String(a || '').trim();
  const y = String(b || '').trim();
  if (!x && !y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  return x.localeCompare(y, 'en', { numeric: true, sensitivity: 'base' });
};

export const uniqSorted = (arr) =>
  [...new Set(arr.map((x) => String(x || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));