import { beforeEach, describe, expect, it } from 'vitest';
import { seedOrders } from '../data/seed';
import { changePassword, checkPassword, isUnlocked, lock, unlock } from './adminAuth';
import { buildOwnerEmail } from './ownerEmail';

// Minimal Web Storage for Node.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

beforeEach(() => {
  Object.assign(globalThis, { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
});

describe('admin password', () => {
  it('starts as "interesting"', () => {
    expect(checkPassword('interesting')).toBe(true);
    expect(checkPassword('Interesting')).toBe(false);
    expect(checkPassword('')).toBe(false);
  });

  it('unlocks only with the right password, and locks again', () => {
    expect(unlock('nope')).toBe(false);
    expect(isUnlocked()).toBe(false);
    expect(unlock('interesting')).toBe(true);
    expect(isUnlocked()).toBe(true);
    lock();
    expect(isUnlocked()).toBe(false);
  });

  it('changes the password after checking the current one', () => {
    expect(changePassword('wrong', 'newpass1', 'newpass1')).toMatchObject({ ok: false, field: 'current' });
    expect(changePassword('interesting', 'short', 'short')).toMatchObject({ ok: false, field: 'next' });
    expect(changePassword('interesting', 'newpass1', 'newpass2')).toMatchObject({ ok: false, field: 'confirm' });
    expect(changePassword('interesting', 'newpass1', 'newpass1')).toEqual({ ok: true });
    expect(checkPassword('newpass1')).toBe(true);
    expect(checkPassword('interesting')).toBe(false);
  });

  it('never stores the password itself', () => {
    changePassword('interesting', 'super-secret', 'super-secret');
    const stored = JSON.stringify({ ...localStorage, all: [...Array(localStorage.length)].map((_, i) => localStorage.getItem(localStorage.key(i)!)) });
    expect(stored).not.toContain('super-secret');
  });
});

describe('owner email', () => {
  const order = seedOrders.find((o) => o.number === 1043)!; // two lines, a one-color product
  const email = buildOwnerEmail(order, 'http://localhost:5173/admin/orders/1043');
  const field = (label: string) => email.fields.find(([l]) => l === label)?.[1];

  it('has a subject that says what to print and what to collect', () => {
    expect(email.subject).toBe('New order #1043 — 3 pieces to print ($17.00 cash)');
  });

  it('includes the customer, every item with colors, the total and an admin link', () => {
    expect(field('Order number')).toBe('#1043');
    expect(field('Customer')).toBe('Noor A.');
    expect(field('Customer email')).toBe('noor@example.com');
    expect(field('Note from customer')).toBe('—');
    expect(field('Item 1')).toBe('1 × Gear Spinner — Gear: Green, Hub: Black — $9.00');
    expect(field('Item 2')).toBe('2 × Ripple Disc — Disc: Purple — $8.00');
    expect(field('Pieces to print')).toBe('3');
    expect(field('Total — collect in cash, in person')).toBe('$17.00');
    expect(field('Open in admin')).toBe('http://localhost:5173/admin/orders/1043');
  });
});
