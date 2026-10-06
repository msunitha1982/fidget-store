import type { OrderStatus } from '../types';
import { STATUS_COPY } from '../lib/orders';

/** Status pill. Each status has its own glyph so it never relies on color alone. */
export function StatusGlyph({ status }: { status: OrderStatus }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {status === 'NEW' && <circle cx="6" cy="6" r="2.4" fill="currentColor" />}
      {status === 'PRINTING' && <path d="M6 1a5 5 0 0 1 0 10Z" fill="currentColor" />}
      {status === 'READY' && <path d="M3.4 6.2l1.8 1.8 3.4-3.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
      {status === 'COMPLETED' && <circle cx="6" cy="6" r="5" fill="currentColor" />}
    </svg>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status status--${status.toLowerCase()}`}>
      <StatusGlyph status={status} />
      {STATUS_COPY[status].label}
    </span>
  );
}
