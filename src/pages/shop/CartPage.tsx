import { Link } from 'react-router-dom';
import { CashNote } from '../../components/CashNote';
import { Icon } from '../../components/Icon';
import { ModelThumb } from '../../components/ModelThumb';
import { QuantityStepper } from '../../components/QuantityStepper';
import { Alert, EmptyState, ErrorState, Skeleton } from '../../components/States';
import { ChoiceList } from '../../components/Swatch';
import { useCart } from '../../lib/cart';
import { formatMoney, plural } from '../../lib/format';
import { useResolvedCart, type ResolvedLine } from '../../lib/useResolvedCart';

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Your order', 'Your details', 'Done'];
  return (
    <ol className="progress mono" aria-label="Checkout progress">
      {steps.map((s, i) => (
        <li key={s} aria-current={i + 1 === current ? 'step' : undefined} className={i + 1 < current ? 'is-done' : ''}>
          <span>{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

export function CartPage() {
  const { cart, lines, status, reload, total, itemCount, hasUnavailable } = useResolvedCart();

  if (cart.lines.length === 0) {
    return (
      <div className="container section">
        <Steps current={1} />
        <h1 className="page-title">Your order</h1>
        <EmptyState
          title="Your order is empty"
          art={<EmptyBoxArt />}
          action={
            <Link to="/" className="btn">
              Browse fidgets
            </Link>
          }
        >
          Pick a fidget, choose its colors, and it'll show up here.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container section">
      <Steps current={1} />
      <div className="page-head">
        <h1 className="page-title">Your order</h1>
        <span className="mono muted">{plural(itemCount, 'item')}</span>
      </div>

      {status === 'error' && !lines.some((l) => l.product) ? (
        <ErrorState title="We couldn't load your order" onRetry={reload} />
      ) : (
        <div className="split">
          <div className="split__main">
            {hasUnavailable && (
              <Alert tone="warning" title="Something in your order is no longer available">
                It was taken off the shop after you added it, so it won't be included. You can remove it below.
              </Alert>
            )}
            <ul className="lines">
              {lines.map((rl) => (
                <CartLineRow key={rl.line.lineId} rl={rl} loading={status === 'loading' && !rl.product} />
              ))}
            </ul>
            <Link to="/" className="link-btn">
              <Icon name="plus" size={18} /> Add another fidget
            </Link>
          </div>

          <aside className="summary" aria-labelledby="sum-title">
            <h2 id="sum-title" className="summary__title">
              Summary
            </h2>
            <ul className="summary__rows">
              {lines
                .filter((l) => l.available)
                .map((l) => (
                  <li key={l.line.lineId}>
                    <span>
                      {l.product!.name} × {l.line.quantity}
                    </span>
                    <span className="mono">{formatMoney(l.lineTotal)}</span>
                  </li>
                ))}
            </ul>
            <div className="summary__total">
              <span>Total</span>
              <span className="mono">{formatMoney(total)}</span>
            </div>
            <CashNote amount={total} variant="card" title="Nothing to pay now." />
            {itemCount > 0 ? (
              <Link to="/order/details" className="btn btn--lg btn--block">
                Continue to your details <Icon name="arrowRight" size={20} />
              </Link>
            ) : (
              <button type="button" className="btn btn--lg btn--block" disabled>
                Continue to your details
              </button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function CartLineRow({ rl, loading }: { rl: ResolvedLine; loading: boolean }) {
  const { line, product, available } = rl;
  const { setQuantity, remove } = useCart();

  if (loading) {
    return (
      <li className="line">
        <Skeleton className="line__thumb" />
        <div className="line__body">
          <Skeleton style={{ width: '40%', height: 24 }} />
          <Skeleton style={{ width: '60%', height: 18 }} />
        </div>
      </li>
    );
  }

  if (!product || !available) {
    return (
      <li className="line line--unavailable">
        <span className="line__thumb plate" aria-hidden="true" />
        <div className="line__body">
          <div className="line__top">
            <h2 className="line__name">{product?.name ?? 'Removed product'}</h2>
            <span className="tag">Unavailable</span>
          </div>
          <p className="muted">This fidget isn't in the shop any more, so it won't be part of your order.</p>
          <div className="line__actions">
            <button type="button" className="link-btn" onClick={() => remove(line.lineId)}>
              <Icon name="trash" size={18} /> Remove
            </button>
          </div>
        </div>
      </li>
    );
  }

  const href = `/products/${product.slug}`;
  return (
    <li className="line">
      <Link to={href} className="line__thumb-link" aria-label={`View ${product.name}`}>
        <ModelThumb model={product.model} partColors={rl.colors} className="line__thumb" />
      </Link>
      <div className="line__body">
        <div className="line__top">
          <h2 className="line__name">{product.name}</h2>
          <span className="mono line__total">{formatMoney(rl.lineTotal)}</span>
        </div>
        <ChoiceList choices={rl.choices} />
        <div className="line__actions">
          <QuantityStepper size="sm" value={line.quantity} onChange={(q) => setQuantity(line.lineId, q)} label={`Quantity of ${product.name}`} />
          <span className="mono muted line__unit">× {formatMoney(product.price)}</span>
          <Link to={`${href}?edit=${line.lineId}`} className="link-btn">
            <Icon name="pencil" size={18} /> Change colors
          </Link>
          <button type="button" className="link-btn" onClick={() => remove(line.lineId)} aria-label={`Remove ${product.name}`}>
            <Icon name="trash" size={18} /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyBoxArt() {
  return (
    <svg width="132" height="100" viewBox="-130 -100 260 200" aria-hidden="true" className="empty__art">
      <ellipse cx="0" cy="44" rx="110" ry="32" fill="var(--ground)" />
      <path
        d="M0 -62 L54 -31 L54 31 L0 62 L-54 31 L-54 -31Z M-54 -31 L0 0 L54 -31 M0 0 V62"
        fill="none"
        stroke="#A5A9B1"
        strokeDasharray="8 8"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
