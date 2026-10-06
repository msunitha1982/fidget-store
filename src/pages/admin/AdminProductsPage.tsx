import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ModelThumb } from '../../components/ModelThumb';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { adminListProducts, adminSetPublished } from '../../lib/api';
import { formatMoney, formatWhen } from '../../lib/format';
import { defaultSelections, partColors, publishProblems } from '../../lib/product';
import { useAsync } from '../../lib/useAsync';
import type { Product } from '../../types';

type Filter = 'all' | 'shown' | 'hidden';

export function AdminProductsPage() {
  const products = useAsync(adminListProducts, []);
  const [filter, setFilter] = useState<Filter>('all');

  if (products.status === 'error') return <ErrorState title="Products didn't load" onRetry={products.reload} />;
  const list = products.data ?? [];
  const shown = list.filter((p) => p.published).length;
  const visible = list.filter((p) => filter === 'all' || (filter === 'shown' ? p.published : !p.published));

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Products</h1>
          <p className="muted">{products.data ? `${shown} shown in the shop · ${list.length - shown} hidden` : 'Loading…'}</p>
        </div>
        <Link to="/admin/products/new" className="btn">
          <Icon name="plus" size={20} strokeWidth={2.2} /> Add product
        </Link>
      </header>

      <section className="apanel apanel--flush" aria-label="Product list">
        <div className="apanel__head apanel__head--pad">
          <div className="tabs" role="group" aria-label="Filter">
            {(
              [
                ['all', 'All', list.length],
                ['shown', 'Shown', shown],
                ['hidden', 'Hidden', list.length - shown],
              ] as const
            ).map(([f, label, n]) => (
              <button key={f} type="button" className="tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {label} <span className="tab__count mono">{n}</span>
              </button>
            ))}
          </div>
        </div>
        {!products.data ? (
          <div className="pad">
            <Skeleton style={{ height: 320, borderRadius: 12 }} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title="No products yet"
            action={
              <Link to="/admin/products/new" className="btn">
                Add your first product
              </Link>
            }
          >
            Add a name, a price, a 3D model and the colors you can print.
          </EmptyState>
        ) : visible.length === 0 ? (
          <p className="muted pad">No {filter} products.</p>
        ) : (
          <div className="table-wrap">
            <table className="table table--products">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Color options</th>
                  <th scope="col">Shown in shop</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ProductRow({ product: p }: { product: Product }) {
  const [saving, setSaving] = useState(false);
  const problems = publishProblems(p);
  const blocked = !p.published && problems.length > 0;
  const editHref = `/admin/products/${p.id}`;

  return (
    <tr>
      <td>
        <div className="prod-cell">
          <ModelThumb model={p.model} partColors={partColors(p, defaultSelections(p))} className="prod-cell__thumb" />
          <div>
            <Link to={editHref} className="strong">
              {p.name || 'Untitled product'}
            </Link>
            <span className="small muted">Edited {formatWhen(p.updatedAt).toLowerCase()}</span>
          </div>
        </div>
      </td>
      <td className="mono">{p.price ? formatMoney(p.price) : '—'}</td>
      <td>
        <div className="group-lines">
          {p.optionGroups.length === 0 && <span className="muted small">None yet</span>}
          {p.optionGroups.map((g) => (
            <div key={g.id} className="group-line">
              <span className="group-line__label">
                {g.label} · {g.partIds.map((id) => p.parts.find((x) => x.id === id)?.name).join(' & ') || 'no part'}
              </span>
              <span className="stack-dots">
                {g.colors.map((c) => (
                  <span key={c.id} style={{ background: c.hex }} title={c.name} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </td>
      <td>
        <label className="switch" title={blocked ? problems.join(' ') : undefined}>
          <input
            type="checkbox"
            role="switch"
            checked={p.published}
            disabled={saving || blocked}
            onChange={async () => {
              setSaving(true);
              await adminSetPublished(p.id, !p.published);
              setSaving(false);
            }}
            aria-label={`Show ${p.name} in shop`}
          />
          <span className="switch__track" aria-hidden="true" />
          <span className={p.published ? 'switch__on' : 'muted'}>{p.published ? 'Shown' : blocked ? 'Not ready' : 'Hidden'}</span>
        </label>
      </td>
      <td className="right">
        <Link to={editHref} className="btn btn--sm btn--outline" aria-label={`Edit ${p.name}`}>
          <Icon name="pencil" size={16} /> Edit
        </Link>
      </td>
    </tr>
  );
}
