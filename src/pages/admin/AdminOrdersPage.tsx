import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ModelThumb } from '../../components/ModelThumb';
import { StatusGlyph } from '../../components/StatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { Swatch } from '../../components/Swatch';
import { adminListOrders, adminSetOrderStatus } from '../../lib/api';
import { formatMoney, formatOrderNumber, formatWhen, plural } from '../../lib/format';
import { orderPieces, printQueue, STATUS_COPY } from '../../lib/orders';
import { useAsync } from '../../lib/useAsync';
import { ORDER_STATUSES, type Order, type OrderStatus } from '../../types';

type Filter = 'ALL' | OrderStatus;

export function AdminOrdersPage() {
  const orders = useAsync(adminListOrders, []);
  const [filter, setFilter] = useState<Filter>('ALL');

  if (orders.status === 'error') return <ErrorState title="Orders didn't load" onRetry={orders.reload} />;
  const list = orders.data ?? [];
  const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
  const queue = printQueue(list);
  const pieces = queue.reduce((n, q) => n + q.quantity, 0);
  const visible = list.filter((o) => filter === 'ALL' || o.status === filter);
  const loading = orders.status === 'loading' && !orders.data;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Orders</h1>
          <p className="muted">
            {loading ? 'Loading…' : `${count('NEW')} new · ${count('PRINTING')} printing · ${count('READY')} ready`}
          </p>
        </div>
      </header>

      <section className="apanel" aria-labelledby="queue-title">
        <div className="apanel__head">
          <h2 id="queue-title" className="apanel__title">
            <Icon name="printer" size={22} /> To print
          </h2>
          <span className="mono muted small">{plural(pieces, 'piece')} · from New + Printing orders</span>
        </div>
        {loading ? (
          <div className="queue">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 84, borderRadius: 12 }} />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <p className="muted queue-empty">Nothing to print right now.</p>
        ) : (
          <ul className="queue">
            {queue.map((q) => (
              <li key={q.key} className="queue__item">
                <ModelThumb model={q.sample.model} partColors={q.sample.partColors} className="queue__thumb" />
                <span className="queue__qty mono">×{q.quantity}</span>
                <div className="queue__body">
                  <strong>{q.productName}</strong>
                  <span className="queue__chips">
                    {q.choices.map((c) => (
                      <span key={c.groupLabel} className="color-chip">
                        <Swatch hex={c.hex} size={14} />
                        {c.partNames.join(' & ') || c.groupLabel} · {c.colorName}
                      </span>
                    ))}
                  </span>
                </div>
                <span className="queue__refs mono">
                  {q.orderNumbers.map((n) => (
                    <Link key={n} to={`/admin/orders/${n}`}>
                      {formatOrderNumber(n)}
                    </Link>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="apanel apanel--flush" aria-labelledby="list-title">
        <div className="apanel__head apanel__head--pad">
          <h2 id="list-title" className="apanel__title">
            All orders
          </h2>
          <div className="tabs" role="group" aria-label="Filter by status">
            {(['ALL', ...ORDER_STATUSES] as Filter[]).map((f) => (
              <button key={f} type="button" className="tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === 'ALL' ? 'All' : STATUS_COPY[f].label}
                <span className="tab__count mono">{f === 'ALL' ? list.length : count(f)}</span>
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="pad">
            <Skeleton style={{ height: 240, borderRadius: 12 }} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon="mail" title="No orders yet">
            New orders show up here and arrive in your email.
          </EmptyState>
        ) : visible.length === 0 ? (
          <p className="muted pad">No {STATUS_COPY[filter as OrderStatus].label.toLowerCase()} orders.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Items</th>
                  <th scope="col">Cash to collect</th>
                  <th scope="col">Placed</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <OrderRow key={o.number} order={o} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function OrderRow({ order: o }: { order: Order }) {
  const [saving, setSaving] = useState(false);
  return (
    <tr>
      <td>
        <Link to={`/admin/orders/${o.number}`} className="order-link mono">
          {formatOrderNumber(o.number)}
        </Link>
      </td>
      <td className="strong">{o.customer.name}</td>
      <td>
        <div className="row-items">
          <span className="row-items__dots" aria-hidden="true">
            {o.lines.map((l, i) => (
              <span key={i} className="mini-glyph" style={{ background: l.choices[0]?.hex, borderColor: l.choices[1]?.hex ?? l.choices[0]?.hex }} />
            ))}
          </span>
          <span>
            {o.lines.map((l) => `${l.productName}${l.quantity > 1 ? ` ×${l.quantity}` : ''}`).join(', ')}
            <span className="muted"> · {plural(orderPieces(o), 'piece')}</span>
          </span>
        </div>
      </td>
      <td className="mono">{formatMoney(o.total)}</td>
      <td className="muted nowrap">{formatWhen(o.createdAt)}</td>
      <td>
        <label className={`status-select status--${o.status.toLowerCase()}`}>
          <StatusGlyph status={o.status} />
          <span className="sr-only">Status of order {o.number}</span>
          <select
            value={o.status}
            disabled={saving}
            onChange={async (e) => {
              setSaving(true);
              await adminSetOrderStatus(o.number, e.target.value as OrderStatus);
              setSaving(false);
            }}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_COPY[s].label}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" size={14} strokeWidth={2.4} className="status-select__chev" />
        </label>
      </td>
    </tr>
  );
}
