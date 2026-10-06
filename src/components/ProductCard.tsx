import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { formatMoney } from '../lib/format';
import { defaultSelections, partColors } from '../lib/product';
import type { Product } from '../types';
import { Icon } from './Icon';
import { ModelThumb } from './ModelThumb';
import { useToast } from './Toast';

export function ProductCard({ product }: { product: Product }) {
  const [selections, setSelections] = useState(() => defaultSelections(product));
  const { add } = useCart();
  const toast = useToast();
  const first = product.optionGroups[0];
  const href = `/products/${product.slug}`;
  const colorCount = product.optionGroups.reduce((n, g) => n * Math.max(1, g.colors.length), 1);
  const partsLine =
    product.optionGroups.length > 1
      ? product.optionGroups
          .map((g) => g.partIds.map((id) => product.parts.find((p) => p.id === id)?.name).join(' & '))
          .join(' + ') + ' colors'
      : `${first?.colors.length ?? 0} colors`;

  const quickAdd = () => {
    add(product.id, selections, 1);
    toast({ message: `${product.name} added to your order`, action: { label: 'View order', to: '/order' } });
  };

  return (
    <article className="card">
      <Link to={href} className="card__media" aria-label={`${product.name}, ${formatMoney(product.price)} — choose colors`}>
        <ModelThumb model={product.model} partColors={partColors(product, selections)} />
        <span className="card__tag mono">{colorCount} combos</span>
      </Link>
      <div className="card__body">
        <div className="card__row">
          <h3 className="card__name">
            <Link to={href}>{product.name}</Link>
          </h3>
          <span className="card__price mono">{formatMoney(product.price)}</span>
        </div>
        {first && (
          <div className="card__row card__row--dots">
            <div className="dots" role="group" aria-label={`Preview ${product.name} colors`}>
              {first.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="dot"
                  aria-pressed={selections[first.id] === c.id}
                  aria-label={`Preview in ${c.name}`}
                  title={c.name}
                  onClick={() => setSelections((s) => ({ ...s, [first.id]: c.id }))}
                >
                  <span style={{ background: c.hex }} />
                </button>
              ))}
            </div>
            <span className="card__parts">{partsLine}</span>
          </div>
        )}
        <div className="card__actions">
          <Link to={href} className="btn btn--sm card__cta">
            Choose colors <Icon name="arrowRight" size={16} />
          </Link>
          <button type="button" className="btn btn--sm btn--ghost" onClick={quickAdd} aria-label={`Add ${product.name} in the colors shown to your order`}>
            <Icon name="plus" size={16} strokeWidth={2.2} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card card--skeleton" aria-hidden="true">
      <span className="skeleton card__media" />
      <div className="card__body">
        <div className="card__row">
          <span className="skeleton" style={{ width: '55%', height: 24 }} />
          <span className="skeleton" style={{ width: 52, height: 20 }} />
        </div>
        <div className="card__row">
          <span className="skeleton" style={{ width: 120, height: 22, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}
