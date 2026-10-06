import { site } from '../config/site';
import { formatMoney } from '../lib/format';
import type { Cents } from '../types';
import { Icon } from './Icon';
import { ConfigText } from './Placeholder';

interface Props {
  amount?: Cents;
  variant?: 'inline' | 'card';
  title?: string;
}

/** The one consistent "no online payment" message. Shown wherever money is mentioned. */
export function CashNote({ amount, variant = 'inline', title }: Props) {
  return (
    <div className={`cash-note cash-note--${variant}`}>
      <span className="cash-note__icon">
        <Icon name="cash" size={variant === 'card' ? 26 : 22} />
      </span>
      <div>
        <strong>{title ?? 'No online payment.'}</strong>{' '}
        {amount !== undefined ? (
          <>
            You'll pay <strong className="mono">{formatMoney(amount)}</strong> in cash, in person.
          </>
        ) : (
          <>You'll pay in cash, in person.</>
        )}{' '}
        <ConfigText value={site.paymentDetails} />
      </div>
    </div>
  );
}
