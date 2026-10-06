import { describe, expect, it } from 'vitest';
import { seedOrders, seedProducts } from '../data/seed';
import type { Order, Product } from '../types';
import { addLine, MAX_QUANTITY, replaceLine } from './cart';
import { parseMoney, partNameFromFile, slugify } from './format';
import { nextStatus, prevStatus, printQueue } from './orders';
import { defaultSelections, describeChoices, normalizeSelections, partColors, publishProblems, uncoveredParts } from './product';
import { validateCustomer } from './validation';

const tri = seedProducts.find((p) => p.id === 'p-tri')!;

describe('cart', () => {
  it('merges identical configurations and keeps different ones apart', () => {
    let lines = addLine([], 'p-tri', { primary: 'blue', secondary: 'white' }, 1);
    lines = addLine(lines, 'p-tri', { primary: 'blue', secondary: 'white' }, 2);
    lines = addLine(lines, 'p-tri', { primary: 'red', secondary: 'white' }, 1);
    expect(lines).toHaveLength(2);
    expect(lines[0].quantity).toBe(3);
  });

  it('caps quantity', () => {
    const lines = addLine(addLine([], 'p-tri', {}, MAX_QUANTITY), 'p-tri', {}, 5);
    expect(lines[0].quantity).toBe(MAX_QUANTITY);
  });

  it('changing a line to match another merges them', () => {
    let lines = addLine([], 'p-tri', { primary: 'blue' }, 1);
    lines = addLine(lines, 'p-tri', { primary: 'red' }, 2);
    lines = replaceLine(lines, lines[1].lineId, { primary: 'blue' }, 2);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });
});

describe('product configuration', () => {
  it('defaults to the first color of every group', () => {
    expect(defaultSelections(tri)).toEqual({ primary: 'blue', secondary: 'white' });
  });

  it('maps option groups onto model parts', () => {
    const colors = partColors(tri, { primary: 'red', secondary: 'black' });
    expect(colors.body).toBe('#E2412F');
    expect(colors.caps).toBe('#2A2B30');
  });

  it('drops selections for colors that no longer exist', () => {
    expect(normalizeSelections(tri, { primary: 'gold', secondary: 'black' })).toEqual({ primary: 'blue', secondary: 'black' });
  });

  it('describes choices with part names for the order record', () => {
    const [first] = describeChoices(tri, { primary: 'green', secondary: 'white' });
    expect(first).toMatchObject({ groupLabel: 'Primary', partNames: ['Body'], colorName: 'Green' });
  });

  it('lists what blocks publishing', () => {
    const draft: Product = { ...tri, name: '', price: 0, model: null, optionGroups: [] };
    expect(publishProblems(draft)).toEqual(['Add a product name.', 'Add a price.', 'Upload a 3D model.', 'Add at least one color option.']);
    expect(publishProblems(tri)).toEqual([]);
  });

  it('flags parts no option colors', () => {
    const p: Product = { ...tri, optionGroups: [tri.optionGroups[0]] };
    expect(uncoveredParts(p).map((x) => x.name)).toEqual(['Caps']);
  });
});

describe('orders', () => {
  it('groups NEW and PRINTING lines by product and exact colors', () => {
    const queue = printQueue(seedOrders);
    const total = queue.reduce((n, q) => n + q.quantity, 0);
    const expected = seedOrders
      .filter((o) => o.status === 'NEW' || o.status === 'PRINTING')
      .flatMap((o) => o.lines)
      .reduce((n, l) => n + l.quantity, 0);
    expect(total).toBe(expected);
    expect(queue.every((q) => q.orderNumbers.length > 0)).toBe(true);
  });

  it('adds up identical lines across orders', () => {
    const o = seedOrders.find((x) => x.number === 1042)!;
    const twin: Order = { ...o, number: 2000 };
    const tri = printQueue([o, twin]).find((q) => q.productName === 'Tri Spinner')!;
    expect(tri.quantity).toBe(2);
    expect(tri.orderNumbers).toEqual([1042, 2000]);
  });

  it('steps through statuses in order', () => {
    expect(nextStatus('NEW')).toBe('PRINTING');
    expect(nextStatus('COMPLETED')).toBeNull();
    expect(prevStatus('NEW')).toBeNull();
    expect(prevStatus('READY')).toBe('PRINTING');
  });
});

describe('formatting & validation', () => {
  it('parses prices into cents', () => {
    expect(parseMoney('7')).toBe(700);
    expect(parseMoney('$7.5')).toBe(750);
    expect(parseMoney('7.555')).toBeNull();
    expect(parseMoney('')).toBeNull();
  });

  it('names parts from file names', () => {
    expect(partNameFromFile('tri-spinner_body.stl')).toBe('Body');
    expect(slugify('Tri Spinner!')).toBe('tri-spinner');
  });

  it('requires a name and a valid email only', () => {
    expect(validateCustomer({ name: '', email: '', note: '' })).toEqual({ name: 'Enter your name', email: 'Enter your email' });
    expect(validateCustomer({ name: 'Ava', email: 'ava@example', note: '' }).email).toMatch(/doesn’t look right/);
    expect(validateCustomer({ name: 'Ava', email: 'ava@example.com', note: '' })).toEqual({});
  });
});
