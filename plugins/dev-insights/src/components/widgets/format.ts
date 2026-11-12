export const fmt = (v: number | null | undefined, unit = '') =>
  v === null || v === undefined ? '–' : `${v}${unit}`;

export const hours = (h: number | null) => {
  if (h === null) return '–';
  return h >= 48 ? `${Math.round((h / 24) * 10) / 10}d` : `${h}h`;
};
