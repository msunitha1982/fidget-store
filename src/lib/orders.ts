import type { Order, OrderChoice, OrderLine, OrderStatus } from '../types';
import { ORDER_STATUSES } from '../types';

export interface PrintItem {
  key: string;
  productName: string;
  quantity: number;
  choices: OrderChoice[];
  orderNumbers: number[];
  sample: OrderLine;
}

/** Everything that still needs printing: lines from NEW + PRINTING orders, grouped by product + exact colors. */
export function printQueue(orders: Order[]): PrintItem[] {
  const map = new Map<string, PrintItem>();
  const active = orders.filter((o) => o.status === 'NEW' || o.status === 'PRINTING');
  // Oldest first, so the queue reads in the order things should be printed.
  active.sort((a, b) => a.number - b.number);
  for (const o of active) {
    for (const l of o.lines) {
      const key = l.productId + '|' + l.choices.map((c) => c.hex).join('/');
      const item = map.get(key);
      if (item) {
        item.quantity += l.quantity;
        if (!item.orderNumbers.includes(o.number)) item.orderNumbers.push(o.number);
      } else {
        map.set(key, { key, productName: l.productName, quantity: l.quantity, choices: l.choices, orderNumbers: [o.number], sample: l });
      }
    }
  }
  return [...map.values()];
}

export const orderPieces = (o: Order) => o.lines.reduce((n, l) => n + l.quantity, 0);

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUSES.indexOf(s);
  return i < ORDER_STATUSES.length - 1 ? ORDER_STATUSES[i + 1] : null;
}

export function prevStatus(s: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUSES.indexOf(s);
  return i > 0 ? ORDER_STATUSES[i - 1] : null;
}

export const STATUS_COPY: Record<OrderStatus, { label: string; hint: string; action: string }> = {
  NEW: { label: 'New', hint: 'Received', action: 'Move to New' },
  PRINTING: { label: 'Printing', hint: 'On the printer', action: 'Start printing' },
  READY: { label: 'Ready', hint: 'Printed', action: 'Mark as ready' },
  COMPLETED: { label: 'Completed', hint: 'Finished', action: 'Mark as completed' },
};
