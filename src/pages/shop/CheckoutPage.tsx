import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ConfigText } from '../../components/Placeholder';
import { Alert, EmptyState } from '../../components/States';
import { ChoiceList } from '../../components/Swatch';
import { site } from '../../config/site';
import { submitOrder } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { useResolvedCart } from '../../lib/useResolvedCart';
import type { CustomerInfo } from '../../types';
import { validateCustomer, type CustomerErrors } from '../../lib/validation';
import { Steps } from './CartPage';

type Errors = CustomerErrors;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, lines, total, itemCount, status } = useResolvedCart();
  const [form, setForm] = useState<CustomerInfo>({ name: '', email: '', note: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);

  const available = lines.filter((l) => l.available);

  if (cart.lines.length === 0 || (status === 'ready' && available.length === 0)) {
    return (
      <div className="container section">
        <EmptyState
          title="There's nothing to submit yet"
          icon="bag"
          action={
            <Link to="/shop" className="btn">
              Browse fidgets
            </Link>
          }
        >
          Add a fidget to your order first.
        </EmptyState>
      </div>
    );
  }

  const update = (field: keyof CustomerInfo) => (e: { target: { value: string } }) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);
    if (tried) setErrors(validateCustomer(next));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setTried(true);
    const found = validateCustomer(form);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await submitOrder({ customer: form, lines: available.map((l) => l.line) });
      navigate(`/order/confirmed/${order.number}`, { replace: true });
      cart.clear();
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="container section">
      <Steps current={2} />
      <h1 className="page-title">Almost done</h1>

      <form className="split" onSubmit={onSubmit} noValidate>
        <div className="split__main">
          {errorCount > 0 && (
            <div ref={summaryRef} tabIndex={-1} className="focus-target">
              <Alert title={errorCount === 1 ? 'One thing to fix before you submit:' : `${errorCount} things to fix before you submit:`}>
                <ul className="error-links">
                  {(Object.keys(errors) as (keyof CustomerInfo)[]).map((k) => (
                    <li key={k}>
                      <a href={`#f-${k}`}>{errors[k]}</a>
                    </li>
                  ))}
                </ul>
              </Alert>
            </div>
          )}
          {submitError && (
            <Alert title="Your order wasn't sent">
              {submitError}. Nothing was lost — your order and details are still here. Please try again.
            </Alert>
          )}

          <section className="panel" aria-labelledby="you-title">
            <h2 id="you-title" className="panel__title">
              Your details
            </h2>
            <p className="panel__sub">So the owner knows whose order this is.</p>
            <div className="fields">
              <Field id="f-name" label="Name" error={errors.name}>
                <input
                  id="f-name"
                  className="input"
                  type="text"
                  autoComplete="name"
                  placeholder="First and last name"
                  value={form.name}
                  onChange={update('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'f-name-err' : undefined}
                  disabled={submitting}
                />
              </Field>
              <Field id="f-email" label="Email" error={errors.email} help="Only used about this order.">
                <input
                  id="f-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'f-email-err' : 'f-email-help'}
                  disabled={submitting}
                />
              </Field>
              <Field id="f-note" label="Note for the owner" optional>
                <textarea
                  id="f-note"
                  className="input"
                  rows={3}
                  placeholder="Anything they should know?"
                  value={form.note}
                  onChange={update('note')}
                  maxLength={500}
                  disabled={submitting}
                />
              </Field>
            </div>
          </section>

          <section className="panel" aria-labelledby="pay-title">
            <h2 id="pay-title" className="panel__title">
              Payment
            </h2>
            <div className="pay-option">
              <span className="pay-option__icon">
                <Icon name="cash" size={28} />
              </span>
              <div>
                <strong>Cash, in person</strong>
                <p>
                  You'll pay <strong className="mono">{formatMoney(total)}</strong> when you get your order. <ConfigText value={site.paymentDetails} />
                </p>
              </div>
            </div>
            <p className="panel__sub">There's no online payment and no card details. Submitting just sends your order.</p>
          </section>

          <div className="submit-row">
            <button type="submit" className="btn btn--lg btn--block" disabled={submitting} aria-busy={submitting}>
              {submitting ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Submitting your order…
                </>
              ) : (
                'Submit order'
              )}
            </button>
            <p className="muted center">Your order goes straight to the owner. Nothing is charged.</p>
          </div>
        </div>

        <aside className="summary" aria-labelledby="order-title">
          <div className="summary__head">
            <h2 id="order-title" className="summary__title">
              Your order
            </h2>
            <Link to="/order">Edit</Link>
          </div>
          <ul className="summary__lines">
            {available.map((l) => (
              <li key={l.line.lineId}>
                <div className="summary__line-top">
                  <strong>
                    {l.product!.name} × {l.line.quantity}
                  </strong>
                  <span className="mono">{formatMoney(l.lineTotal)}</span>
                </div>
                <ChoiceList choices={l.choices} compact />
              </li>
            ))}
          </ul>
          <div className="summary__total">
            <span>Total · cash in person</span>
            <span className="mono">{formatMoney(total)}</span>
          </div>
          <span className="muted">{itemCount === 1 ? '1 item' : `${itemCount} items`}</span>
        </aside>
      </form>
    </div>
  );
}

function Field(props: { id: string; label: string; error?: string; help?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={props.id}>
        {props.label}
        {props.optional && <span className="field__opt">Optional</span>}
      </label>
      {props.children}
      {props.error ? (
        <p className="field__error" id={`${props.id}-err`}>
          <Icon name="info" size={16} /> {props.error}
        </p>
      ) : (
        props.help && (
          <p className="field__help" id={`${props.id}-help`}>
            {props.help}
          </p>
        )
      )}
    </div>
  );
}
