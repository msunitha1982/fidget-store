import { ProductCard, ProductCardSkeleton } from '../../components/ProductCard';
import { EmptyState, ErrorState } from '../../components/States';
import { listPublishedProducts } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';

export function ShopPage() {
  const products = useAsync(listPublishedProducts, []);

  return (
    <section className="container section" aria-labelledby="shop-title">
      <div className="page-head">
        <h1 id="shop-title" className="page-title">
          All fidgets
        </h1>
        {products.data && <span className="muted">{products.data.length} designs</span>}
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
  );
}
