import { Icon } from './Icon';
import { MAX_QUANTITY } from '../lib/cart';

interface Props {
  value: number;
  onChange: (n: number) => void;
  label: string;
  size?: 'md' | 'sm';
}

export function QuantityStepper({ value, onChange, label, size = 'md' }: Props) {
  return (
    <div className={`stepper stepper--${size}`} role="group" aria-label={label}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(value - 1)} disabled={value <= 1}>
        <Icon name="minus" size={16} strokeWidth={2.2} />
      </button>
      <output aria-live="polite" aria-label="Quantity">
        {value}
      </output>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(value + 1)} disabled={value >= MAX_QUANTITY}>
        <Icon name="plus" size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}
