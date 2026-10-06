import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ModelThumb } from '../../components/ModelThumb';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, Skeleton } from '../../components/States';
import { Swatch } from '../../components/Swatch';
import { adminGetOrder, adminSetOrderStatus } from '../../lib/api';
import { formatMoney, formatOrderNumber, formatWhen, plural } from '../../lib/format';
import { nextStatus, orderPieces, prevStatus, STATUS_COPY } from '../../lib/orders';
import { readJSON, writeJSON } from '../../lib/storage';
import { useAsync } from '../../lib/useAsync';
import { ORDER_STATUSES, type OrderStatus } from '../../types';

export function AdminOrderPage() {
  const { number = '' } = useParams();
  const order = useAsync(() => adminGetOrder(Number(number)), [number]);
  const [busy, setBusy] = useState(false);
  // Per-line "printed" ticks are a workshop aid only, kept locally.
  const printedKey = `fs.printed.${number}`;
  const [printed, setPrinted] = useState<Record<number, boolean>>(() => readJSON(printedKey, {}));

  if (order.status === 'loading' && !order.data) {
    return (
      <div className="admin-page">
        <Skeleton style={{ width: 200, height: 48 }} />
        <Skeleton style={{ height: 96, borderRadius: 16 }} />
        <Skeleton style={{ height: 320, borderRadius: 16 }} />
      </div>
    );
  }
  if (order.status === 'error') {
    return (
      <div className="admin-page">
        <EmptyState
          icon="info"
          title="Order not found"
          action={
            <Link to="/admin/orders" className="btn">
              All orders
            </Link>
          }
        />
      </div>
    );
  }

  const o = order.data!;
  const next = nextStatus(o.status);
  const prev = prevStatus(o.status);
  const doneLines = o.lines.filter((_, i) => printed[i]).length;

  const move = async (s: OrderStatus) => {
    setBusy(true);
    await adminSetOrderStatus(o.number, s);
    setBusy(false);
  };
  const togglePrinted = (i: number) => {
    const nextMap = { ...printed, [i]: !printed[i] };
    setPrinted(nextMap);
    writeJSON(printedKey, nextMap);
  };

  return (
    <div className="admin-page">
      <Link to="/admin/orders" className="link-btn back-link">
        <Icon name="arrowLeft" size={18} /> All orders
      </Link>

      <header className="admin-head">
        <div>
          <div className="order-title">
            <h1 className="admin-title mono">{formatOrderNumber(o.number)}</h1>
            <StatusBadge status={o.status} />
          </div>
          <p className="muted">
            {o.customer.name} · placed {formatWhen(o.createdAt).toLowerCase()} · {plural(orderPieces(o), 'piece')} ·{' '}
            <strong className="mono ink">{formatMoney(o.total)}</strong> cash
          </p>
        </div>
        <div className="admin-head__actions">
          {prev && (
            <button type="button" className="link-btn" disabled={busy} onClick={() => move(prev)}>
              Move back to {STATUS_COPY[prev].label}
            </button>
          )}
          {next && (
            <button type="button" className="btn" disabled={busy} onClick={() => move(next)}>
              {STATUS_COPY[next].action} <Icon name="arrowRight" size={18} />
            </button>
          )}
        </div>
      </header>

      <ol className="apanel stepper-track" aria-label="Order progress">
        {ORDER_STATUSES.map((s, i) => {
          const at = [...o.history].reverse().find((h) => h.status === s)?.at;
          const idx = ORDER_STATUSES.indexOf(o.status);
          return (
            <li key={s} className={i < idx ? 'is-done' : i === idx ? 'is-current' : ''} aria-current={i === idx ? 'step' : undefined}>
              <span className="stepper-track__bar" />
              <strong className="mono">{STATUS_COPY[s].label.toUpperCase()}</strong>
              <span className="muted small">{i <= idx && at ? formatWhen(at) : STATUS_COPY[s].hint}</span>
            </li>
          );
        })}
      </ol>

      <div className="admin-split">
        <section className="admin-split__main" aria-labelledby="print-title">
          <div className="apanel__head">
            <h2 id="print-title" className="apanel__title">
              Print list
            </h2>
            <span className="mono muted small">
              {doneLines} of {o.lines.length} lines printed
            </span>
          </div>
          <ul className="print-list">
            {o.lines.map((l, i) => (
              <li key={i} className={`apanel print-line ${printed[i] ? 'is-printed' : ''}`}>
                <ModelThumb model={l.model} partColors={l.partColors} className="print-line__thumb" />
                <span className="print-line__qty mono">×{l.quantity}</span>
                <div className="print-line__body">
                  <strong className="print-line__name">{l.productName}</strong>
                  <div className="print-line__colors">
                    {l.choices.map((c) => (
                      <div key={c.groupLabel} className="print-color">
                        <Swatch hex={c.hex} size={30} className="swatch--square" />
                        <div>
                          <span className="small muted">{c.partNames.join(' & ') || c.groupLabel}</span>
                          <strong>{c.colorName}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <label className="check-pill">
                  <input type="checkbox" checked={!!printed[i]} onChange={() => togglePrinted(i)} />
                  Printed
                </label>
              </li>
            ))}
          </ul>
        </section>

        <aside className="admin-split__side">
          <section className="apanel kv-panel" aria-labelledby="cust-title">
            <h2 id="cust-title" className="apanel__title">
              Customer
            </h2>
            <dl>
              <dt>Name</dt>
              <dd>{o.customer.name}</dd>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${o.customer.email}?subject=Your order ${formatOrderNumber(o.number)}`}>{o.customer.email}</a>
              </dd>
              <dt>Note</dt>
              <dd>{o.customer.note ? `“${o.customer.note}”` : <span className="muted">No note</span>}</dd>
            </dl>
          </section>
          <section className="apanel" aria-labelledby="pay-title">
            <h2 id="pay-title" className="apanel__title">
              Payment
            </h2>
            <div className="collect">
              <span className="collect__icon">
                <Icon name="cash" size={24} />
              </span>
              <div>
                <span className="small muted">Collect in cash, in person</span>
                <strong className="mono collect__amount">{formatMoney(o.total)}</strong>
              </div>
            </div>
          </section>
          <section className="apanel" aria-labelledby="act-title">
            <h2 id="act-title" className="apanel__title">
              Activity
            </h2>
            <ul className="activity">
              {[...o.history].reverse().map((h, i) => (
                <li key={i}>
                  <span>{h.status === 'NEW' ? 'Order submitted' : `Marked ${STATUS_COPY[h.status].label}`}</span>
                  <span className="mono muted small">{formatWhen(h.at)}</span>
                </li>
              ))}
              {o.ownerNotifiedAt && (
                <li>
                  <span>
                    Email sent to owner <span className="tag tag--muted">mock</span>
                  </span>
                  <span className="mono muted small">{formatWhen(o.ownerNotifiedAt)}</span>
                </li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
