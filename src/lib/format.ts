import type { Cents } from '../types';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatMoney = (cents: Cents) => money.format(cents / 100);

/** Parses "7", "7.5" or "$7.00" into cents. Returns null when it isn't a valid price. */
export function parseMoney(input: string): Cents | null {
  const clean = input.trim().replace(/^\$/, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
}

export const centsToInput = (cents: Cents) => (cents / 100).toFixed(2);

export const formatOrderNumber = (n: number) => `#${n}`;

export function formatWhen(iso: string, now = Date.now()) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const days = Math.floor((startOfDay(now) - startOfDay(d.getTime())) / 86_400_000);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`;
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const uid = (prefix = '') => prefix + Math.random().toString(36).slice(2, 10);

/** "tri-spinner_body.stl" -> "Body"-ish: last word of the file name, capitalised. */
export function partNameFromFile(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '');
  const word = base.split(/[-_\s.]+/).filter(Boolean).pop() ?? base;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
