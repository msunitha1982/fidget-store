/** Relative luminance check, used to pick a readable check-mark color on a swatch. */
export function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

/** Gray used for parts that have no color option yet. */
export const UNASSIGNED_PART_COLOR = '#B8BCC4';
