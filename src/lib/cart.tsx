import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, Selections } from '../types';
import { uid } from './format';
import { sameSelections } from './product';
import { readJSON, writeJSON } from './storage';

const KEY = 'fs.cart.v1';
export const MAX_QUANTITY = 99;

export function addLine(lines: CartLine[], productId: string, selections: Selections, quantity: number): CartLine[] {
  const existing = lines.find((l) => l.productId === productId && sameSelections(l.selections, selections));
  if (existing) {
    return lines.map((l) => (l === existing ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l));
  }
  return [...lines, { lineId: uid('l-'), productId, selections, quantity }];
}

/** Replaces a line's options; merges into an identical line if one exists. */
export function replaceLine(lines: CartLine[], lineId: string, selections: Selections, quantity: number): CartLine[] {
  const target = lines.find((l) => l.lineId === lineId);
  if (!target) return lines;
  const twin = lines.find((l) => l.lineId !== lineId && l.productId === target.productId && sameSelections(l.selections, selections));
  if (twin) {
    return lines
      .filter((l) => l.lineId !== lineId)
      .map((l) => (l === twin ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l));
  }
  return lines.map((l) => (l.lineId === lineId ? { ...l, selections, quantity } : l));
}

interface CartApi {
  lines: CartLine[];
  count: number;
  add: (productId: string, selections: Selections, quantity: number) => void;
  replace: (lineId: string, selections: Selections, quantity: number) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readJSON<CartLine[]>(KEY, []));

  useEffect(() => {
    writeJSON(KEY, lines);
  }, [lines]);

  // Keep several tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLines(readJSON<CartLine[]>(KEY, []));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((productId: string, selections: Selections, quantity: number) => setLines((ls) => addLine(ls, productId, selections, quantity)), []);
  const replace = useCallback((lineId: string, selections: Selections, quantity: number) => setLines((ls) => replaceLine(ls, lineId, selections, quantity)), []);
  const setQuantity = useCallback(
    (lineId: string, quantity: number) =>
      setLines((ls) => ls.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)) } : l))),
    [],
  );
  const remove = useCallback((lineId: string) => setLines((ls) => ls.filter((l) => l.lineId !== lineId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), add, replace, setQuantity, remove, clear }),
    [lines, add, replace, setQuantity, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
