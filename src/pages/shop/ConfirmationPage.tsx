import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ModelThumb } from '../../components/ModelThumb';
import { ConfigText } from '../../components/Placeholder';
import { EmptyState, Skeleton } from '../../components/States';
import { ChoiceList } from '../../components/Swatch';
import { site } from '../../config/site';
import { getOrder } from '../../lib/api';
import { formatMoney, formatOrderNumber } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import { Steps } from './CartPage';

export function ConfirmationPage() {
  const { number = '' } = useParams();
  const order = useAsync(() => getOrder(Number(number)), [number]);
  const [copied, setCopied] = useState(false);

  if (order.status === 'loading') {
    return (
      <div className="container confirm" aria-busy="true">
        <Skeleton style={{ width: 88, height: 88, borderRadius: 999, margin: '0 auto' }} />
        <Skeleton style={{ width: '60%', height: 64, margin: '0 auto' }} />
        <Skeleton style={{ width: '100%', height: 140 }} />
      </div>
    );
  }
  if (order.status === 'error') {
    return (
      <div className="container section">
        <EmptyState
          title="We couldn't find that order"
          icon="info"
          action={
            <Link to="/shop" className="btn">
              Back to the shop
            </Link>
          }
        >
          Check the order number and try again.
        </EmptyState>
      </div>
    );
  }

  const o = order.data;
  const firstName = o.customer.name.split(' ')[0];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(o.number));
      setCopied(true);
    } catch {
      /* clipboard blocked — the number is still visible */
    }
  };

  return (
    <div className="container confirm">
      <Steps current={3} />
      <div className="confirm__hero" role="status">
        <span className="confirm__check">
          <Icon name="check" size={46} strokeWidth={2.6} />
        </span>
        <h1 className="confirm__title">Order submitted</h1>
        <p className="confirm__lede">Thanks, {firstName}. The owner has your order and what needs printing.</p>
      </div>

      <section className="order-number" aria-label="Order number">
        <div>
          <span className="order-number__label mono">Order number</span>
          <span className="order-number__value mono">{formatOrderNumber(o.number)}</span>
          <span className="order-number__hint">Save this number for your records.</span>
        </div>
        <button type="button" className="btn btn--outline-light" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} size={18} />
          <span aria-live="polite">{copied ? 'Copied' : 'Copy number'}</span>
        </button>
      </section>

      <section aria-labelledby="next-title">
        <h2 id="next-title" className="section__title section__title--sm">
          What happens next
        </h2>
        <ol className="next-steps">
          <li>
            <span className="step__num step__num--light">1</span>
            <strong>The owner gets your order</strong>
            <span>It arrives by email with your colors and quantities.</span>
          </li>
          <li>
            <span className="step__num step__num--light">2</span>
            <strong>Your fidgets get printed</strong>
            <span>
              <ConfigText value={site.readyNotice} />
            </span>
          </li>
          <li className="next-steps__pay">
            <span className="step__num step__num--accent">3</span>
            <strong>Pay {formatMoney(o.total)} in cash, in person</strong>
            <span>
              There was no online payment. <ConfigText value={site.paymentDetails} />
            </span>
          </li>
        </ol>
      </section>

      <section className="panel" aria-labelledby="sum-title">
        <h2 id="sum-title" className="panel__title">
          Order summary
        </h2>
        <ul className="confirm__lines">
          {o.lines.map((l, i) => (
            <li key={i}>
              <ModelThumb model={l.model} partColors={l.partColors} className="confirm__thumb" />
              <div className="confirm__line-body">
                <div className="summary__line-top">
                  <strong>
                    {l.productName} × {l.quantity}
                  </strong>
                  <span className="mono">{formatMoney(l.unitPrice * l.quantity)}</span>
                </div>
                <ChoiceList choices={l.choices} compact />
              </div>
            </li>
          ))}
        </ul>
        <div className="summary__total">
          <span>Total · cash in person</span>
          <span className="mono">{formatMoney(o.total)}</span>
        </div>
        <div className="confirm__customer">
          <span>
            Name: <strong>{o.customer.name}</strong>
          </span>
          <span>
            Email: <strong>{o.customer.email}</strong>
          </span>
          {o.customer.note && (
            <span>
              Note: <strong>{o.customer.note}</strong>
            </span>
          )}
        </div>
      </section>

      <div className="center">
        <Link to="/shop" className="btn btn--lg">
          Back to the shop
        </Link>
      </div>
    </div>
  );
}
