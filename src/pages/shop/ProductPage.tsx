import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CashNote } from '../../components/CashNote';
import { Icon } from '../../components/Icon';
import { ModelThumb } from '../../components/ModelThumb';
import { ModelViewer } from '../../components/ModelViewer';
import { OptionGroupPicker } from '../../components/OptionGroupPicker';
import { QuantityStepper } from '../../components/QuantityStepper';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { Swatch } from '../../components/Swatch';
import { useToast } from '../../components/Toast';
import { getPublishedProduct, NotFoundError } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useFileUrl } from '../../lib/useFileUrl';
import { formatMoney } from '../../lib/format';
import { choicesSummary, defaultSelections, describeChoices, normalizeSelections, partColors } from '../../lib/product';
import { useAsync } from '../../lib/useAsync';
import type { Product, ProductImage, Selections } from '../../types';

export function ProductPage() {
  const { slug = '' } = useParams();
  const state = useAsync(() => getPublishedProduct(slug), [slug]);

  if (state.status === 'loading') return <ProductSkeleton />;
  if (state.status === 'error') {
    return (
      <div className="container section">
        {state.error instanceof NotFoundError ? (
          <EmptyState
            title="This fidget isn't available right now"
            icon="cube"
            action={
              <Link to="/" className="btn">
                See all fidgets
              </Link>
            }
          >
            It may be back later. Everything else on the shelf is still here.
          </EmptyState>
        ) : (
          <ErrorState title="We couldn't load this fidget" onRetry={state.reload} />
        )}
      </div>
    );
  }
  return <ProductDetail key={state.data.id} product={state.data} />;
}

function ProductDetail({ product }: { product: Product }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cart = useCart();
  const toast = useToast();
  const editLine = cart.lines.find((l) => l.lineId === params.get('edit') && l.productId === product.id);

  const [selections, setSelections] = useState<Selections>(() =>
    editLine ? normalizeSelections(product, editLine.selections) : defaultSelections(product),
  );
  const [quantity, setQuantity] = useState(editLine?.quantity ?? 1);
  const [hoverParts, setHoverParts] = useState<string[] | null>(null);
  const [pinnedGroup, setPinnedGroup] = useState<string | null>(null);
  const [media, setMedia] = useState<'3d' | string>('3d');
  const [added, setAdded] = useState(false);

  const colors = useMemo(() => partColors(product, selections), [product, selections]);
  const choices = useMemo(() => describeChoices(product, selections), [product, selections]);
  const pinnedParts = product.optionGroups.find((g) => g.id === pinnedGroup)?.partIds ?? null;
  const highlight = useMemo(() => hoverParts ?? pinnedParts, [hoverParts, pinnedParts]);
  const total = product.price * quantity;
  const multiPart = product.optionGroups.length > 1;

  const submit = () => {
    if (editLine) {
      cart.replace(editLine.lineId, selections, quantity);
      toast({ message: `${product.name} updated` });
      navigate('/order');
      return;
    }
    cart.add(product.id, selections, quantity);
    setAdded(true);
  };

  const image = product.images.find((i) => i.id === media);

  return (
    <div className="container product">
      <Link to="/" className="link-btn product__back">
        <Icon name="arrowLeft" size={18} /> All fidgets
      </Link>

      <div className="product__layout">
        <div className="product__media">
          {image ? (
            <ProductPhoto image={image} />
          ) : (
            <ModelViewer model={product.model} partColors={colors} highlightPartIds={highlight} label={product.name} className="product__viewer">
              {multiPart && (
                <div className="legend" role="group" aria-label="Highlight a part">
                  {product.optionGroups.map((g) => {
                    const c = choices.find((x) => x.groupLabel === g.label);
                    const names = g.partIds.map((id) => product.parts.find((p) => p.id === id)?.name).join(' & ');
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className="legend__item"
                        aria-pressed={pinnedGroup === g.id}
                        onClick={() => setPinnedGroup((p) => (p === g.id ? null : g.id))}
                        onMouseEnter={() => setHoverParts(g.partIds)}
                        onMouseLeave={() => setHoverParts(null)}
                        title={pinnedGroup === g.id ? 'Show all parts' : `Highlight the ${names.toLowerCase()}`}
                      >
                        {c && <Swatch hex={c.hex} size={20} className="legend__swatch" />}
                        <span>
                          <strong>{names}</strong> <span className="legend__label">· {g.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </ModelViewer>
          )}
          {product.images.length > 0 && (
            <div className="media-tabs" role="group" aria-label="Views">
              <button type="button" className="media-tab plate" aria-pressed={media === '3d'} onClick={() => setMedia('3d')}>
                <Icon name="cube" size={22} strokeWidth={1.6} />
                3D
              </button>
              {product.images.map((img, i) => (
                <button key={img.id} type="button" className="media-tab" aria-pressed={media === img.id} onClick={() => setMedia(img.id)} aria-label={`Photo ${i + 1}`}>
                  <PhotoThumb image={img} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product__info">
          <div className="product__intro">
            <h1 className="product__name">{product.name}</h1>
            <p className="product__price">
              <span className="mono">{formatMoney(product.price)}</span> <span className="muted">each</span>
            </p>
            {product.description && <p className="product__desc">{product.description}</p>}
          </div>

          <div className="product__options">
            {product.optionGroups.map((g) => (
              <OptionGroupPicker
                key={g.id}
                product={product}
                group={g}
                value={selections[g.id]}
                onChange={(colorId) => setSelections((s) => ({ ...s, [g.id]: colorId }))}
                onFocusParts={multiPart ? setHoverParts : undefined}
              />
            ))}
            <div className="qty-row">
              <span className="qty-row__label" id="qty-label">
                Quantity
              </span>
              <QuantityStepper value={quantity} onChange={setQuantity} label="Quantity" />
            </div>
          </div>

          <div className="buy-box">
            <div className="buy-box__summary">
              <span>{choicesSummary(choices)}</span>
              <span className="mono buy-box__total">{formatMoney(total)}</span>
            </div>
            <button type="button" className="btn btn--lg btn--block buy-box__btn" onClick={submit}>
              {editLine ? (
                <>
                  <Icon name="check" size={20} strokeWidth={2.2} /> Update order
                </>
              ) : (
                <>
                  <Icon name="plus" size={20} strokeWidth={2.2} /> Add to order
                </>
              )}
            </button>
            <CashNote />
          </div>
        </div>
      </div>

      {/* Phones: the add button stays reachable while scrolling through options. */}
      <div className="buy-bar">
        <div className="buy-bar__text">
          <span className="mono buy-bar__total">{formatMoney(total)}</span>
          <span className="buy-bar__choices">
            {quantity} × {choicesSummary(choices)}
          </span>
        </div>
        <button type="button" className="btn" onClick={submit}>
          {editLine ? 'Update order' : 'Add to order'}
        </button>
      </div>

      <AddedDialog
        open={added}
        onClose={() => setAdded(false)}
        product={product}
        colors={colors}
        summary={choicesSummary(choices)}
        quantity={quantity}
        total={total}
        cartCount={cart.count}
      />
    </div>
  );
}

function AddedDialog(props: {
  open: boolean;
  onClose: () => void;
  product: Product;
  colors: Record<string, string>;
  summary: string;
  quantity: number;
  total: number;
  cartCount: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open]);

  return (
    <dialog ref={ref} className="drawer" aria-labelledby="added-title" onClose={props.onClose} onClick={(e) => e.target === ref.current && props.onClose()}>
      <div className="drawer__inner">
        <div className="drawer__head">
          <span className="drawer__ok">
            <Icon name="check" size={20} strokeWidth={2.6} />
          </span>
          <h2 id="added-title">Added to your order</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={props.onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer__item">
          <ModelThumb model={props.product.model} partColors={props.colors} className="drawer__thumb" />
          <div>
            <strong className="drawer__name">{props.product.name}</strong>
            <span className="muted">{props.summary}</span>
            <span className="mono">
              {props.quantity} × {formatMoney(props.product.price)} = {formatMoney(props.total)}
            </span>
          </div>
        </div>
        <div className="drawer__actions">
          <Link to="/order" className="btn btn--lg btn--block">
            Review order ({props.cartCount})
          </Link>
          <Link to="/" className="btn btn--lg btn--block btn--outline">
            Keep browsing
          </Link>
        </div>
      </div>
    </dialog>
  );
}

function ProductPhoto({ image }: { image: ProductImage }) {
  const url = useFileUrl(image);
  return <div className="product__photo plate">{url ? <img src={url} alt={image.alt} /> : <Skeleton className="product__photo-skel" />}</div>;
}

function PhotoThumb({ image }: { image: ProductImage }) {
  const url = useFileUrl(image);
  return url ? <img src={url} alt="" /> : <Icon name="image" size={22} />;
}

function ProductSkeleton() {
  return (
    <div className="container product" aria-busy="true" aria-label="Loading product">
      <Skeleton style={{ width: 110, height: 20, margin: '12px 0 20px' }} />
      <div className="product__layout">
        <div className="product__media">
          <Skeleton className="product__viewer" />
        </div>
        <div className="product__info">
          <Skeleton style={{ width: '70%', height: 56 }} />
          <Skeleton style={{ width: 90, height: 26 }} />
          <Skeleton style={{ width: '100%', height: 48 }} />
          <Skeleton style={{ width: '100%', height: 120 }} />
          <Skeleton style={{ width: '100%', height: 120 }} />
        </div>
      </div>
    </div>
  );
}
