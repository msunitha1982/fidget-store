import type { OrderChoice, Product, Selections } from '../types';
import { UNASSIGNED_PART_COLOR } from './color';

/** First color of every group — the starting configuration on the product page. */
export function defaultSelections(product: Product): Selections {
  const s: Selections = {};
  for (const g of product.optionGroups) if (g.colors[0]) s[g.id] = g.colors[0].id;
  return s;
}

/** Keeps only selections that still exist on the product, filling gaps with defaults. */
export function normalizeSelections(product: Product, selections: Selections): Selections {
  const out = defaultSelections(product);
  for (const g of product.optionGroups) {
    const wanted = selections[g.id];
    if (wanted && g.colors.some((c) => c.id === wanted)) out[g.id] = wanted;
  }
  return out;
}

/** partId -> hex for the 3D viewer. Parts not covered by any group render neutral gray. */
export function partColors(product: Product, selections: Selections): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of product.parts) out[part.id] = UNASSIGNED_PART_COLOR;
  for (const g of product.optionGroups) {
    const color = g.colors.find((c) => c.id === selections[g.id]) ?? g.colors[0];
    if (!color) continue;
    for (const pid of g.partIds) out[pid] = color.hex;
  }
  return out;
}

export function describeChoices(product: Product, selections: Selections): OrderChoice[] {
  return product.optionGroups
    .map((g) => {
      const color = g.colors.find((c) => c.id === selections[g.id]) ?? g.colors[0];
      if (!color) return null;
      return {
        groupLabel: g.label,
        partNames: g.partIds.map((pid) => product.parts.find((p) => p.id === pid)?.name).filter(Boolean) as string[],
        colorName: color.name,
        hex: color.hex,
      };
    })
    .filter((c): c is OrderChoice => c !== null);
}

/** "Blue body · White caps" */
export function choicesSummary(choices: OrderChoice[]) {
  return choices
    .map((c) => (c.partNames.length ? `${c.colorName} ${c.partNames.join(' & ').toLowerCase()}` : c.colorName))
    .join(' · ');
}

export const sameSelections = (a: Selections, b: Selections) => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

/** Problems that stop a product from being shown in the shop. Empty = publishable. */
export function publishProblems(p: Product): string[] {
  const problems: string[] = [];
  if (!p.name.trim()) problems.push('Add a product name.');
  if (!(p.price > 0)) problems.push('Add a price.');
  if (!p.model) problems.push('Upload a 3D model.');
  if (p.optionGroups.length === 0) problems.push('Add at least one color option.');
  p.optionGroups.forEach((g) => {
    if (!g.label.trim()) problems.push('Every color option needs a name.');
    if (g.colors.length === 0) problems.push(`“${g.label || 'Untitled option'}” needs at least one color.`);
    if (g.partIds.length === 0) problems.push(`Pick which part “${g.label || 'Untitled option'}” colors.`);
  });
  return [...new Set(problems)];
}

/** Parts no option group colors (shown as a warning, not an error). */
export function uncoveredParts(p: Product) {
  const covered = new Set(p.optionGroups.flatMap((g) => g.partIds));
  return p.parts.filter((part) => !covered.has(part.id));
}
