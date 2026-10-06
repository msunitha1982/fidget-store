import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ModelViewer } from '../../components/ModelViewer';
import { ConfigText } from '../../components/Placeholder';
import { ProductCard, ProductCardSkeleton } from '../../components/ProductCard';
import { EmptyState, ErrorState } from '../../components/States';
import { site } from '../../config/site';
import { listPublishedProducts } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { defaultSelections, partColors } from '../../lib/product';
import { useAsync } from '../../lib/useAsync';
import type { Product } from '../../types';

export function HomePage() {
  const products = useAsync(listPublishedProducts, []);
  const { hash } = useLocation();

  useEffect(() => {
    if (hash && products.status === 'ready') document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, products.status]);

  const featured = products.data?.[0];

  return (
    <>
      <section className="hero container">
        <div className="hero__copy">
          <p className="eyebrow mono">{site.tagline}</p>
          <h1 className="hero__title">
            Fidgets, printed in <em>your</em> colors.
          </h1>
          <p className="hero__lede">
            Spin each one around in 3D, pick a color for every part, and send your order. You pay in cash, in person — nothing online.
          </p>
          <div className="hero__ctas">
            <a href="#shop" className="btn">
              Browse fidgets <Icon name="arrowRight" size={18} />
            </a>
            <span className="pill">
              <Icon name="cash" size={18} /> No card needed
            </span>
          </div>
        </div>
        <div className="hero__feature">{featured ? <FeaturedProduct product={featured} /> : <div className="hero__feature-skeleton plate" />}</div>
      </section>

      <section id="shop" className="container section" aria-labelledby="shop-title">
        <div className="section__head">
          <h2 id="shop-title" className="section__title">
            All fidgets
          </h2>
          {products.data && <span className="mono muted">{products.data.length} designs</span>}
        </div>

        {products.status === 'error' ? (
          <ErrorState title="We couldn't load the shop" message="Check your connection and try again." onRetry={products.reload} />
        ) : products.status === 'loading' ? (
          <div className="grid" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 6 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.data.length === 0 ? (
          <EmptyState title="Nothing on the shelf yet" icon="cube">
            New fidgets will show up here soon.
          </EmptyState>
        ) : (
          <div className="grid">
            {products.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section id="how" className="container section" aria-labelledby="how-title">
        <div className="section__head">
          <h2 id="how-title" className="section__title">
            How ordering works
          </h2>
          <span className="mono muted">No card · no account</span>
        </div>
        <ol className="steps">
          <li className="step">
            <span className="step__num">1</span>
            <h3>Pick a fidget</h3>
            <p>Drag the 3D preview to see it from every side.</p>
          </li>
          <li className="step">
            <span className="step__num">2</span>
            <h3>Choose its colors</h3>
            <p>Each colorable part gets its own color. The model updates as you pick.</p>
          </li>
          <li className="step">
            <span className="step__num">3</span>
            <h3>Submit your order</h3>
            <p>Just your name and email. It goes straight to the owner.</p>
          </li>
          <li className="step step--dark">
            <span className="step__num">4</span>
            <h3>Pay cash, in person</h3>
            <p>
              Nothing is paid online. <ConfigText value={site.paymentDetails} />
            </p>
          </li>
        </ol>
      </section>
    </>
  );
}

/** Live, recolorable 3D model in the hero — the shop's main idea in one glance. */
function FeaturedProduct({ product }: { product: Product }) {
  const [selections, setSelections] = useState(() => defaultSelections(product));
  const colors = useMemo(() => partColors(product, selections), [product, selections]);
  const first = product.optionGroups[0];
  return (
    <div className="feature">
      <ModelViewer model={product.model} partColors={colors} label={product.name} compact className="feature__viewer" />
      <div className="feature__bar">
        <div>
          <span className="feature__name">{product.name}</span>
          <span className="mono feature__price">{formatMoney(product.price)}</span>
        </div>
        {first && (
          <div className="dots" role="group" aria-label={`Try ${product.name} colors`}>
            {first.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                className="dot"
                aria-pressed={selections[first.id] === c.id}
                aria-label={`Show in ${c.name}`}
                onClick={() => setSelections((s) => ({ ...s, [first.id]: c.id }))}
              >
                <span style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        )}
        <Link to={`/products/${product.slug}`} className="btn btn--sm">
          Customize
        </Link>
      </div>
    </div>
  );
}
