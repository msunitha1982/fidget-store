// SAMPLE DATA ONLY. Products, prices, colors and customers are realistic placeholders
// so the prototype can be clicked through. Real data comes from the admin.

import type { ColorOption, Order, OrderLine, Product } from '../types';

export const PALETTE = {
  blue: { id: 'blue', name: 'Blue', hex: '#2F62F5' },
  red: { id: 'red', name: 'Red', hex: '#E2412F' },
  green: { id: 'green', name: 'Green', hex: '#1E9E5A' },
  purple: { id: 'purple', name: 'Purple', hex: '#7B4BEA' },
  orange: { id: 'orange', name: 'Orange', hex: '#FF7A2F' },
  teal: { id: 'teal', name: 'Teal', hex: '#14A3A0' },
  white: { id: 'white', name: 'White', hex: '#F2F2EE' },
  black: { id: 'black', name: 'Black', hex: '#2A2B30' },
  yellow: { id: 'yellow', name: 'Yellow', hex: '#FFC62E' },
} satisfies Record<string, ColorOption>;

type PaletteKey = keyof typeof PALETTE;
const colors = (...keys: PaletteKey[]) => keys.map((k) => ({ ...PALETTE[k] }));

const updated = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

export const seedProducts: Product[] = [
  {
    id: 'p-tri',
    slug: 'tri-spinner',
    name: 'Tri Spinner',
    price: 700,
    description: 'A three-lobe spinner with two colorable parts: the body and the caps.',
    images: [],
    model: { kind: 'placeholder', shape: 'tri-spinner' },
    parts: [
      { id: 'body', name: 'Body' },
      { id: 'caps', name: 'Caps' },
    ],
    optionGroups: [
      { id: 'primary', label: 'Primary', partIds: ['body'], colors: colors('blue', 'red', 'green', 'purple') },
      { id: 'secondary', label: 'Secondary', partIds: ['caps'], colors: colors('white', 'black', 'yellow') },
    ],
    published: true,
    updatedAt: updated(2),
  },
  {
    id: 'p-hex',
    slug: 'hex-nut',
    name: 'Hex Nut',
    price: 500,
    description: 'A chunky nut on a bolt. Twist it up and down the thread, color each half.',
    images: [],
    model: { kind: 'placeholder', shape: 'hex-nut' },
    parts: [
      { id: 'nut', name: 'Nut' },
      { id: 'bolt', name: 'Bolt' },
    ],
    optionGroups: [
      { id: 'primary', label: 'Primary', partIds: ['nut'], colors: colors('orange', 'blue', 'black', 'green') },
      { id: 'secondary', label: 'Secondary', partIds: ['bolt'], colors: colors('white', 'black', 'yellow') },
    ],
    published: true,
    updatedAt: updated(8),
  },
  {
    id: 'p-cube',
    slug: 'click-cube',
    name: 'Click Cube',
    price: 800,
    description: 'A palm-sized cube with buttons on top. Pick a shell color and a button color.',
    images: [],
    model: { kind: 'placeholder', shape: 'click-cube' },
    parts: [
      { id: 'shell', name: 'Shell' },
      { id: 'buttons', name: 'Buttons' },
    ],
    optionGroups: [
      { id: 'primary', label: 'Primary', partIds: ['shell'], colors: colors('purple', 'blue', 'red', 'white') },
      { id: 'secondary', label: 'Secondary', partIds: ['buttons'], colors: colors('yellow', 'white', 'black') },
    ],
    published: true,
    updatedAt: updated(10),
  },
  {
    id: 'p-ring',
    slug: 'bead-ring',
    name: 'Bead Ring',
    price: 600,
    description: 'A ring with eight beads that slide around it. Color the ring and the beads separately.',
    images: [],
    model: { kind: 'placeholder', shape: 'bead-ring' },
    parts: [
      { id: 'ring', name: 'Ring' },
      { id: 'beads', name: 'Beads' },
    ],
    optionGroups: [
      { id: 'primary', label: 'Primary', partIds: ['ring'], colors: colors('black', 'white', 'blue') },
      { id: 'secondary', label: 'Secondary', partIds: ['beads'], colors: colors('yellow', 'red', 'green', 'purple', 'orange') },
    ],
    published: true,
    updatedAt: updated(16),
  },
  {
    id: 'p-gear',
    slug: 'gear-spinner',
    name: 'Gear Spinner',
    price: 900,
    description: 'A twelve-tooth gear that spins on its hub.',
    images: [],
    model: { kind: 'placeholder', shape: 'gear-spinner' },
    parts: [
      { id: 'gear', name: 'Gear' },
      { id: 'hub', name: 'Hub' },
    ],
    optionGroups: [
      { id: 'primary', label: 'Primary', partIds: ['gear'], colors: colors('green', 'orange', 'purple', 'blue') },
      { id: 'secondary', label: 'Secondary', partIds: ['hub'], colors: colors('black', 'white') },
    ],
    published: true,
    updatedAt: updated(18),
  },
  {
    id: 'p-disc',
    slug: 'ripple-disc',
    name: 'Ripple Disc',
    price: 400,
    description: 'A thumb-sized disc with rippled rings to run your finger over. One color.',
    images: [],
    model: { kind: 'placeholder', shape: 'ripple-disc' },
    parts: [{ id: 'disc', name: 'Disc' }],
    optionGroups: [
      { id: 'color', label: 'Color', partIds: ['disc'], colors: colors('teal', 'purple', 'orange', 'red', 'blue') },
    ],
    published: true,
    updatedAt: updated(24),
  },
  {
    id: 'p-mini',
    slug: 'mini-gear',
    name: 'Mini Gear',
    price: 500,
    description: 'A smaller gear spinner. Still being tested.',
    images: [],
    model: { kind: 'placeholder', shape: 'gear-spinner' },
    parts: [
      { id: 'gear', name: 'Gear' },
      { id: 'hub', name: 'Hub' },
    ],
    optionGroups: [
      { id: 'primary', label: 'Primary', partIds: ['gear'], colors: colors('purple', 'teal') },
      { id: 'secondary', label: 'Secondary', partIds: ['hub'], colors: colors('white') },
    ],
    published: false,
    updatedAt: updated(0),
  },
];

/** Builds an order line from a seed product + chosen color per group. */
function line(productId: string, quantity: number, picks: Record<string, PaletteKey>): OrderLine {
  const p = seedProducts.find((x) => x.id === productId)!;
  const partColors: Record<string, string> = {};
  const choices = p.optionGroups.map((g) => {
    const c = PALETTE[picks[g.id]];
    g.partIds.forEach((pid) => (partColors[pid] = c.hex));
    return {
      groupLabel: g.label,
      partNames: g.partIds.map((pid) => p.parts.find((x) => x.id === pid)!.name),
      colorName: c.name,
      hex: c.hex,
    };
  });
  return { productId, productName: p.name, unitPrice: p.price, quantity, choices, model: p.model, partColors };
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function order(
  number: number,
  hours: number,
  name: string,
  email: string,
  status: Order['status'],
  lines: OrderLine[],
  note = '',
): Order {
  const steps = ['NEW', 'PRINTING', 'READY', 'COMPLETED'] as const;
  const history = steps.slice(0, steps.indexOf(status) + 1).map((s, i) => ({ status: s, at: hoursAgo(hours - i * 2) }));
  return {
    number,
    createdAt: hoursAgo(hours),
    status,
    customer: { name, email, note },
    lines,
    total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    history,
    ownerNotifiedAt: hoursAgo(hours),
  };
}

export const seedOrders: Order[] = [
  order(1045, 1, 'Leo T.', 'leo@example.com', 'NEW', [line('p-cube', 1, { primary: 'purple', secondary: 'yellow' })]),
  order(1044, 4, 'Sam P.', 'sam@example.com', 'NEW', [line('p-hex', 3, { primary: 'orange', secondary: 'black' })], 'One for each of my brothers.'),
  order(1043, 26, 'Noor A.', 'noor@example.com', 'PRINTING', [
    line('p-gear', 1, { primary: 'green', secondary: 'black' }),
    line('p-disc', 2, { color: 'purple' }),
  ]),
  order(1042, 30, 'Eli W.', 'eli@example.com', 'PRINTING', [line('p-tri', 1, { primary: 'red', secondary: 'yellow' })]),
  order(1041, 52, 'Mia C.', 'mia@example.com', 'READY', [line('p-ring', 2, { primary: 'white', secondary: 'purple' })]),
  order(1040, 100, 'Kai L.', 'kai@example.com', 'COMPLETED', [line('p-cube', 1, { primary: 'blue', secondary: 'white' })]),
  order(1039, 124, 'Zoe H.', 'zoe@example.com', 'COMPLETED', [line('p-disc', 1, { color: 'orange' })]),
];
