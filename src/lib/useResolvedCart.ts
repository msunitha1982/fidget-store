import { useMemo } from 'react';
import type { CartLine, OrderChoice, Product } from '../types';
import { getProductsByIds } from './api';
import { useCart } from './cart';
import { describeChoices, normalizeSelections, partColors } from './product';
import { useAsync } from './useAsync';

export interface ResolvedLine {
  line: CartLine;
  product: Product | null;
  /** False when the product was deleted or hidden since it was added. */
  available: boolean;
  choices: OrderChoice[];
  colors: Record<string, string>;
  lineTotal: number;
}

/** Joins cart lines with current catalog data (names, prices, colors). */
export function useResolvedCart() {
  const cart = useCart();
  const ids = useMemo(() => [...new Set(cart.lines.map((l) => l.productId))].sort(), [cart.lines]);
  const products = useAsync(() => (ids.length ? getProductsByIds(ids) : Promise.resolve([])), [ids.join(',')]);

  const lines: ResolvedLine[] = useMemo(() => {
    const list = products.data ?? [];
    return cart.lines.map((line) => {
      const product = list.find((p) => p.id === line.productId) ?? null;
      const available = !!product?.published;
      const sel = product ? normalizeSelections(product, line.selections) : {};
      return {
        line,
        product,
        available,
        choices: product ? describeChoices(product, sel) : [],
        colors: product ? partColors(product, sel) : {},
        lineTotal: available && product ? product.price * line.quantity : 0,
      };
    });
  }, [cart.lines, products.data]);

  const available = lines.filter((l) => l.available);
  return {
    cart,
    lines,
    status: products.status,
    error: products.error,
    reload: products.reload,
    total: available.reduce((s, l) => s + l.lineTotal, 0),
    itemCount: available.reduce((n, l) => n + l.line.quantity, 0),
    hasUnavailable: lines.some((l) => !l.available),
  };
}
