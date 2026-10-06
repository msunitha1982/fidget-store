import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ModelViewer } from '../../components/ModelViewer';
import { ConfigText } from '../../components/Placeholder';
import { Alert, EmptyState, ErrorState, Skeleton } from '../../components/States';
import { useToast } from '../../components/Toast';
import { site } from '../../config/site';
import { PALETTE } from '../../data/seed';
import { adminDeleteProduct, adminGetProduct, adminListProducts, adminSaveProduct, NotFoundError } from '../../lib/api';
import { isLight } from '../../lib/color';
import { putFile } from '../../lib/fileStore';
import { centsToInput, formatBytes, formatMoney, parseMoney, partNameFromFile, slugify, uid } from '../../lib/format';
import { defaultSelections, normalizeSelections, partColors, publishProblems, uncoveredParts } from '../../lib/product';
import { useAsync } from '../../lib/useAsync';
import { useFileUrl } from '../../lib/useFileUrl';
import { PLACEHOLDER_LABELS, PLACEHOLDER_PARTS } from '../../three/placeholders';
import type { ColorOption, ModelPart, OptionGroup, PlaceholderShape, Product, ProductImage, Selections, StlFile } from '../../types';

function blankProduct(): Product {
  return {
    id: uid('p-'),
    slug: '',
    name: '',
    price: 0,
    description: '',
    images: [],
    model: null,
    parts: [],
    optionGroups: [],
    published: false,
    updatedAt: new Date().toISOString(),
  };
}

export function AdminProductEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const loaded = useAsync(() => (id ? adminGetProduct(id) : Promise.resolve(blankProduct())), [id]);

  if (loaded.status === 'loading' && !loaded.data) {
    return (
      <div className="admin-page">
        <Skeleton style={{ width: 260, height: 44 }} />
        <Skeleton style={{ height: 260, borderRadius: 16 }} />
        <Skeleton style={{ height: 200, borderRadius: 16 }} />
      </div>
    );
  }
  if (loaded.status === 'error') {
    return loaded.error instanceof NotFoundError ? (
      <div className="admin-page">
        <EmptyState
          title="This product doesn't exist"
          action={
            <Link to="/admin/products" className="btn">
              All products
            </Link>
          }
        >
          It may have been deleted.
        </EmptyState>
      </div>
    ) : (
      <ErrorState title="The product didn't load" onRetry={loaded.reload} />
    );
  }
  return <ProductEditor key={loaded.data!.id} initial={loaded.data!} isNew={isNew} />;
}

const LABELS = ['Primary', 'Secondary'];
const groupLabel = (i: number) => LABELS[i] ?? `Option ${i + 1}`;

function ProductEditor({ initial, isNew }: { initial: Product; isNew: boolean }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState<Product>(initial);
  const [priceInput, setPriceInput] = useState(initial.price ? centsToInput(initial.price) : '');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [hoverGroup, setHoverGroup] = useState<string | null>(null);
  const [previewSel, setPreviewSel] = useState<Selections>(() => defaultSelections(initial));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const allProducts = useAsync(adminListProducts, []);

  const edit = (patch: Partial<Product> | ((p: Product) => Partial<Product>)) => {
    setDraft((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }));
    setDirty(true);
  };

  // Leaving with unsaved edits asks first (in-app links and tab close).
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('You have unsaved changes. Leave without saving?')) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const price = parseMoney(priceInput);
  const candidate: Product = { ...draft, price: price ?? 0 };
  const problems = publishProblems(candidate);
  const uncovered = uncoveredParts(draft);
  const nameError = tried && !draft.name.trim() ? 'Give it a name customers will see.' : '';
  const priceError = tried && price === null ? 'Enter a price, like 7.00' : '';

  const sel = useMemo(() => normalizeSelections(draft, previewSel), [draft, previewSel]);
  const colors = useMemo(() => partColors(draft, sel), [draft, sel]);
  const highlight = draft.optionGroups.find((g) => g.id === hoverGroup)?.partIds ?? null;

  /** Colors used anywhere in the catalog — one click to reuse a filament color. */
  const library = useMemo(() => {
    const map = new Map<string, ColorOption>();
    Object.values(PALETTE).forEach((c) => map.set(c.hex.toLowerCase(), c));
    (allProducts.data ?? []).forEach((p) => p.optionGroups.forEach((g) => g.colors.forEach((c) => map.set(c.hex.toLowerCase(), c))));
    draft.optionGroups.forEach((g) => g.colors.forEach((c) => map.set(c.hex.toLowerCase(), c)));
    return [...map.values()];
  }, [allProducts.data, draft.optionGroups]);

  // ---------- model ----------

  const setModelFromFiles = async (files: File[], append: boolean) => {
    setUploadError('');
    const bad = files.filter((f) => !f.name.toLowerCase().endsWith('.stl'));
    if (bad.length) {
      setUploadError(`“${bad[0].name}” can't be used. Upload the 3D model as STL files.`);
      return;
    }
    if (!files.length) return;
    try {
      const added = await Promise.all(
        files.map(async (f) => {
          const fileId = uid('f-');
          await putFile(fileId, f);
          const part: ModelPart = { id: uid('part-'), name: partNameFromFile(f.name) };
          const stl: StlFile = { partId: part.id, name: f.name, fileId, sizeBytes: f.size };
          return { part, stl };
        }),
      );
      edit((p) => {
        const keep = append && p.model?.kind === 'stl';
        const parts = [...(keep ? p.parts : []), ...added.map((a) => a.part)];
        const stlFiles = [...(keep && p.model?.kind === 'stl' ? p.model.files : []), ...added.map((a) => a.stl)];
        return { model: { kind: 'stl', upAxis: 'z', files: stlFiles }, parts, optionGroups: reconcileGroups(p.optionGroups, parts) };
      });
    } catch {
      setUploadError('The file could not be saved in this browser. Try again.');
    }
  };

  const applyPlaceholder = (shape: PlaceholderShape) => {
    const parts = PLACEHOLDER_PARTS[shape].map((x) => ({ ...x }));
    edit((p) => ({ model: { kind: 'placeholder', shape }, parts, optionGroups: reconcileGroups(p.optionGroups, parts) }));
  };

  const removePart = (partId: string) =>
    edit((p) => {
      const parts = p.parts.filter((x) => x.id !== partId);
      const model = p.model?.kind === 'stl' ? { ...p.model, files: p.model.files.filter((f) => f.partId !== partId) } : p.model;
      return {
        parts,
        model: model?.kind === 'stl' && model.files.length === 0 ? null : model,
        optionGroups: p.optionGroups.map((g) => ({ ...g, partIds: g.partIds.filter((id) => id !== partId) })),
      };
    });

  // ---------- groups ----------

  const setGroup = (gid: string, fn: (g: OptionGroup) => OptionGroup) => edit((p) => ({ optionGroups: p.optionGroups.map((g) => (g.id === gid ? fn(g) : g)) }));

  const addGroup = () =>
    edit((p) => ({ optionGroups: [...p.optionGroups, { id: uid('g-'), label: groupLabel(p.optionGroups.length), partIds: [], colors: [] }] }));

  // ---------- photos ----------

  const addPhotos = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length !== files.length) setUploadError('Only image files can be added as photos.');
    const added: ProductImage[] = await Promise.all(
      images.map(async (f) => {
        const fileId = uid('img-');
        await putFile(fileId, f);
        return { id: uid('i-'), fileId, alt: `${draft.name || 'Product'} photo` };
      }),
    );
    if (added.length) edit((p) => ({ images: [...p.images, ...added] }));
  };

  // ---------- save / delete ----------

  const save = async () => {
    setTried(true);
    setSaveError('');
    if (!draft.name.trim() || price === null) return;
    if (draft.published && problems.length) {
      setSaveError('show');
      return;
    }
    setSaving(true);
    try {
      const saved = await adminSaveProduct({
        ...draft,
        name: draft.name.trim(),
        price,
        slug: draft.slug || slugify(draft.name),
        images: draft.images.map((i) => ({ ...i, alt: `${draft.name.trim()} photo` })),
      });
      setDirty(false);
      setTried(false);
      toast({
        message: saved.published ? `${saved.name} saved — live in the shop` : `${saved.name} saved as hidden`,
        action: saved.published ? { label: 'View in shop', to: `/products/${saved.slug}` } : undefined,
      });
      if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true });
      else setDraft(saved);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    await adminDeleteProduct(draft.id);
    setDirty(false);
    toast({ message: `${draft.name || 'Product'} deleted` });
    navigate('/admin/products');
  };

  const statusLine = saving ? 'Saving…' : dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved';
  const saveLabel = isNew ? (draft.published ? 'Save & show in shop' : 'Save as hidden') : 'Save changes';

  return (
    <div className="admin-page admin-page--editor">
      <Link to="/admin/products" className="link-btn back-link">
        <Icon name="arrowLeft" size={18} /> Products
      </Link>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">{isNew ? 'Add a product' : 'Edit product'}</h1>
          <p className="muted">{isNew ? 'Five short steps. You can save it hidden and finish later.' : 'Changes show in the shop as soon as you save.'}</p>
        </div>
      </header>

      <div className="editor">
        <div className="editor__form">
          {saveError === 'show' && (
            <Alert title="Fix these to show it in the shop — or choose “Hidden” to save a draft:">
              <ul className="error-links">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Alert>
          )}
          {saveError && saveError !== 'show' && <Alert title="Couldn't save">{saveError}</Alert>}

          <Section n={1} title="The basics">
            <div className="field">
              <label className="field__label" htmlFor="pe-name">
                Product name
              </label>
              <input
                id="pe-name"
                className="input"
                value={draft.name}
                placeholder="e.g. Tri Spinner"
                onChange={(e) => edit({ name: e.target.value })}
                aria-invalid={!!nameError}
              />
              {nameError && <p className="field__error">{nameError}</p>}
            </div>
            <div className="field field--narrow">
              <label className="field__label" htmlFor="pe-price">
                Price
              </label>
              <div className="input-prefix">
                <span aria-hidden="true">$</span>
                <input
                  id="pe-price"
                  className="input mono"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value.replace(/[^0-9.]/g, ''));
                    setDirty(true);
                  }}
                  onBlur={() => price !== null && setPriceInput(centsToInput(price))}
                  aria-invalid={!!priceError}
                />
              </div>
              {priceError && <p className="field__error">{priceError}</p>}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="pe-desc">
                Description
              </label>
              <textarea
                id="pe-desc"
                className="input"
                rows={3}
                value={draft.description}
                placeholder="One or two sentences about it."
                onChange={(e) => edit({ description: e.target.value })}
              />
              <p className="field__help">Shown under the price. Short is best.</p>
            </div>
          </Section>

          <Section n={2} title="Photos" sub="Optional. Real photos of the print — the first one is the cover. The 3D preview is always shown first.">
            <div className="photo-grid">
              {draft.images.map((img, i) => (
                <PhotoTile
                  key={img.id}
                  image={img}
                  cover={i === 0}
                  onRemove={() => edit((p) => ({ images: p.images.filter((x) => x.id !== img.id) }))}
                  onCover={() => edit((p) => ({ images: [img, ...p.images.filter((x) => x.id !== img.id)] }))}
                />
              ))}
              <FileDrop accept="image/*" multiple onFiles={addPhotos} className="photo-add">
                <Icon name="upload" size={22} />
                <span>Add photos</span>
              </FileDrop>
            </div>
          </Section>

          <Section n={3} title="3D model" sub="Upload the model, then name each part the way a customer would — like “Body” or “Caps”.">
            {uploadError && <Alert>{uploadError}</Alert>}
            {!draft.model ? (
              <>
                <FileDrop accept={site.modelFileTypes} multiple onFiles={(f) => setModelFromFiles(f, false)} className="dropzone">
                  <Icon name="cube" size={36} strokeWidth={1.4} />
                  <strong>Drop STL files here, or click to choose</strong>
                  <span className="muted small">
                    Each file becomes a part that can have its own color. <ConfigText value={site.modelFileRules} />
                  </span>
                </FileDrop>
                <PlaceholderPicker onPick={applyPlaceholder} />
              </>
            ) : (
              <div className="model-box">
                <div className="model-box__head">
                  <span className="model-box__kind">
                    <Icon name="cube" size={20} />
                    {draft.model.kind === 'placeholder' ? (
                      <>
                        {PLACEHOLDER_LABELS[draft.model.shape]} <span className="tag tag--temp">Temporary placeholder</span>
                      </>
                    ) : (
                      <>STL model · {draft.model.files.length === 1 ? '1 file' : `${draft.model.files.length} files`}</>
                    )}
                  </span>
                  <span className="model-box__actions">
                    {draft.model.kind === 'stl' && (
                      <FileDrop accept={site.modelFileTypes} multiple onFiles={(f) => setModelFromFiles(f, true)} className="btn btn--sm btn--outline">
                        <Icon name="plus" size={16} /> Add part file
                      </FileDrop>
                    )}
                    <FileDrop accept={site.modelFileTypes} multiple onFiles={(f) => setModelFromFiles(f, false)} className="btn btn--sm btn--outline">
                      <Icon name="upload" size={16} /> {draft.model.kind === 'placeholder' ? 'Upload STL files' : 'Replace model'}
                    </FileDrop>
                  </span>
                </div>
                <ul className="parts">
                  {draft.parts.map((part) => {
                    const file = draft.model?.kind === 'stl' ? draft.model.files.find((f) => f.partId === part.id) : null;
                    return (
                      <li key={part.id} className="part-row">
                        <span className="part-row__file">
                          <span className="mono">{file ? file.name : 'Built-in placeholder part'}</span>
                          {file?.sizeBytes ? <span className="small muted">{formatBytes(file.sizeBytes)}</span> : null}
                        </span>
                        <label className="part-row__name">
                          <span>Part name</span>
                          <input
                            className="input input--sm"
                            value={part.name}
                            placeholder="e.g. Body"
                            onChange={(e) => edit((p) => ({ parts: p.parts.map((x) => (x.id === part.id ? { ...x, name: e.target.value } : x)) }))}
                          />
                        </label>
                        {draft.model?.kind === 'stl' && (
                          <button type="button" className="icon-btn" aria-label={`Remove ${file?.name ?? part.name}`} onClick={() => removePart(part.id)}>
                            <Icon name="trash" size={18} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Section>

          <Section n={4} title="Color options" sub="Each option is one color choice for the customer. Tick which part(s) it colors, then add the colors you can print.">
            {draft.parts.length === 0 ? (
              <p className="note">Add the 3D model first — then you can choose colors for each part.</p>
            ) : (
              <div className="groups">
                {draft.optionGroups.map((g) => (
                  <GroupEditor
                    key={g.id}
                    group={g}
                    parts={draft.parts}
                    library={library}
                    canRemove={draft.optionGroups.length > 1}
                    onChange={(fn) => setGroup(g.id, fn)}
                    onRemove={() => edit((p) => ({ optionGroups: p.optionGroups.filter((x) => x.id !== g.id) }))}
                    onHover={(on) => setHoverGroup(on ? g.id : null)}
                  />
                ))}
                {uncovered.length > 0 && (
                  <Alert tone="warning">
                    Not in any color option yet: <strong>{uncovered.map((p) => p.name || 'Unnamed part').join(', ')}</strong>. Tick it in an option
                    above, or it will show as gray.
                  </Alert>
                )}
                <button type="button" className="btn btn--sm btn--outline add-group" onClick={addGroup}>
                  <Icon name="plus" size={16} /> Add another color option
                </button>
              </div>
            )}
          </Section>

          <Section n={5} title="Show in shop?">
            <div className="radio-cards" role="radiogroup" aria-label="Visibility">
              <label className="radio-card">
                <input type="radio" name="vis" checked={draft.published} onChange={() => edit({ published: true })} />
                <span>
                  <strong>
                    <Icon name="eye" size={18} /> Shown
                  </strong>
                  <span className="muted">Customers can see and order it.</span>
                  {problems.length > 0 && <span className="radio-card__warn">Needs: {problems.join(' ')}</span>}
                </span>
              </label>
              <label className="radio-card">
                <input type="radio" name="vis" checked={!draft.published} onChange={() => edit({ published: false })} />
                <span>
                  <strong>
                    <Icon name="eyeOff" size={18} /> Hidden
                  </strong>
                  <span className="muted">Saved as a draft. Only you can see it.</span>
                </span>
              </label>
            </div>
          </Section>

          {!isNew && (
            <div className="danger-row">
              {confirmDelete ? (
                <>
                  <span>Delete “{draft.name}”? Past orders keep their details.</span>
                  <span className="danger-row__btns">
                    <button type="button" className="btn btn--sm btn--danger" onClick={remove} disabled={saving}>
                      Yes, delete
                    </button>
                    <button type="button" className="link-btn" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </button>
                  </span>
                </>
              ) : (
                <>
                  <span className="muted small">Past orders keep their details if you delete this product.</span>
                  <button type="button" className="link-btn link-btn--danger" onClick={() => setConfirmDelete(true)}>
                    <Icon name="trash" size={18} /> Delete product
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <aside className="editor__preview" aria-labelledby="pv-title">
          <div className="preview-card">
            <div className="preview-card__head">
              <h2 id="pv-title" className="mono eyebrow">
                Customer preview
              </h2>
              <span className={`tag ${draft.published ? 'tag--ok' : 'tag--muted'}`}>{draft.published ? 'Shown' : 'Hidden'}</span>
            </div>
            <ModelViewer model={draft.model} partColors={colors} highlightPartIds={highlight} label={draft.name || 'New product'} compact className="preview-card__viewer" />
            <div className="preview-card__title">
              <strong className={draft.name ? '' : 'muted'}>{draft.name || 'Product name'}</strong>
              <span className="mono">{price !== null ? formatMoney(price) : '$—'}</span>
            </div>
            {draft.optionGroups.map((g) => (
              <div key={g.id} className="preview-group">
                <span className="small">
                  <strong>{g.label || 'Untitled option'}</strong>{' '}
                  <span className="muted">· {g.partIds.map((id) => draft.parts.find((p) => p.id === id)?.name).join(' & ') || 'no part yet'}</span>
                </span>
                <span className="preview-group__swatches">
                  {g.colors.length === 0 && <span className="muted small">No colors yet</span>}
                  {g.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="swatch-btn"
                      style={{ background: c.hex }}
                      aria-pressed={sel[g.id] === c.id}
                      aria-label={`Preview ${c.name}`}
                      title={c.name}
                      onClick={() => setPreviewSel((s) => ({ ...s, [g.id]: c.id }))}
                    />
                  ))}
                </span>
              </div>
            ))}
            <p className="muted small">Click swatches to try combinations. Hover an option on the left to see its part.</p>
            {!isNew && initial.published && (
              <Link to={`/products/${initial.slug}`} className="link-btn">
                <Icon name="external" size={16} /> Open in shop
              </Link>
            )}
          </div>
        </aside>
      </div>

      <div className="save-bar">
        <span className="save-bar__status" aria-live="polite">
          {dirty && <span className="save-bar__dot" aria-hidden="true" />}
          {statusLine}
        </span>
        <span className="save-bar__actions">
          <Link to="/admin/products" className="link-btn">
            Cancel
          </Link>
          <button type="button" className="btn" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : null}
            {saveLabel}
          </button>
        </span>
      </div>
    </div>
  );
}

/** Keeps existing groups valid after parts change; creates sensible defaults when there are none. */
function reconcileGroups(groups: OptionGroup[], parts: ModelPart[]): OptionGroup[] {
  const ids = new Set(parts.map((p) => p.id));
  const kept = groups.map((g) => ({ ...g, partIds: g.partIds.filter((id) => ids.has(id)) }));
  if (kept.length) return kept;
  return parts.map((p, i) => ({ id: uid('g-'), label: groupLabel(i), partIds: [p.id], colors: [] }));
}

function Section({ n, title, sub, children }: { n: number; title: string; sub?: string; children: ReactNode }) {
  const id = `sec-${n}`;
  return (
    <section className="apanel form-section" aria-labelledby={id}>
      <div className="form-section__head">
        <span className="form-section__num mono">{n}</span>
        <h2 id={id} className="apanel__title">
          {title}
        </h2>
      </div>
      {sub && <p className="form-section__sub">{sub}</p>}
      <div className="form-section__body">{children}</div>
    </section>
  );
}

/** A label that opens a file picker and also accepts drag & drop. */
function FileDrop({ accept, multiple, onFiles, className, children }: { accept: string; multiple?: boolean; onFiles: (files: File[]) => void; className?: string; children: ReactNode }) {
  const [over, setOver] = useState(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    onFiles([...e.dataTransfer.files]);
  };
  return (
    <label
      className={`file-drop ${className ?? ''} ${over ? 'is-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      {children}
    </label>
  );
}

function PlaceholderPicker({ onPick }: { onPick: (s: PlaceholderShape) => void }) {
  return (
    <div className="placeholder-pick">
      <span className="small">
        <strong>No STL files yet?</strong> <span className="muted">Use a temporary shape so you can set up colors now.</span>
      </span>
      <span className="placeholder-pick__list">
        {(Object.keys(PLACEHOLDER_LABELS) as PlaceholderShape[]).map((s) => (
          <button key={s} type="button" className="btn btn--sm btn--ghost" onClick={() => onPick(s)}>
            {PLACEHOLDER_LABELS[s]}
          </button>
        ))}
      </span>
    </div>
  );
}

function PhotoTile({ image, cover, onRemove, onCover }: { image: ProductImage; cover: boolean; onRemove: () => void; onCover: () => void }) {
  const url = useFileUrl(image);
  return (
    <div className="photo-tile">
      {url ? <img src={url} alt="" /> : <Icon name="image" size={24} />}
      {cover ? (
        <span className="photo-tile__cover mono">Cover</span>
      ) : (
        <button type="button" className="photo-tile__make" onClick={onCover}>
          Make cover
        </button>
      )}
      <button type="button" className="photo-tile__remove" aria-label="Remove photo" onClick={onRemove}>
        <Icon name="close" size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function GroupEditor(props: {
  group: OptionGroup;
  parts: ModelPart[];
  library: ColorOption[];
  canRemove: boolean;
  onChange: (fn: (g: OptionGroup) => OptionGroup) => void;
  onRemove: () => void;
  onHover: (on: boolean) => void;
}) {
  const { group: g, parts, library, onChange } = props;
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#FF7A2F');
  const labelId = `gl-${g.id}`;
  const unused = library.filter((c) => !g.colors.some((x) => x.hex.toLowerCase() === c.hex.toLowerCase()));

  const addColor = (c: { name: string; hex: string }) => {
    const base = slugify(c.name) || 'color';
    onChange((x) => {
      let id = base;
      for (let i = 2; x.colors.some((y) => y.id === id); i++) id = `${base}-${i}`;
      return { ...x, colors: [...x.colors, { id, name: c.name.trim(), hex: c.hex.toUpperCase() }] };
    });
  };

  return (
    <div
      className="group-card"
      onMouseEnter={() => props.onHover(true)}
      onMouseLeave={() => props.onHover(false)}
      onFocus={() => props.onHover(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && props.onHover(false)}
    >
      <div className="group-card__top">
        <div className="field">
          <label className="field__label" htmlFor={labelId}>
            Option name <span className="field__opt">customers see this</span>
          </label>
          <input id={labelId} className="input" value={g.label} placeholder="e.g. Primary" onChange={(e) => onChange((x) => ({ ...x, label: e.target.value }))} />
        </div>
        {props.canRemove && (
          <button type="button" className="link-btn" onClick={props.onRemove}>
            Remove option
          </button>
        )}
      </div>

      <fieldset className="plain-fieldset">
        <legend className="field__label">Colors these parts</legend>
        <div className="part-toggles">
          {parts.map((p) => (
            <label key={p.id} className="part-toggle">
              <input
                type="checkbox"
                checked={g.partIds.includes(p.id)}
                onChange={(e) =>
                  onChange((x) => ({ ...x, partIds: e.target.checked ? [...x.partIds, p.id] : x.partIds.filter((id) => id !== p.id) }))
                }
              />
              {p.name || 'Unnamed part'}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <span className="field__label">
          Colors <span className="field__opt mono">{g.colors.length}</span>
        </span>
        <div className="color-chips">
          {g.colors.map((c) => (
            <span key={c.id} className="color-edit">
              <span className="color-edit__sw" style={{ background: c.hex }} />
              {c.name}
              <button type="button" className="icon-btn icon-btn--sm" aria-label={`Remove ${c.name}`} onClick={() => onChange((x) => ({ ...x, colors: x.colors.filter((y) => y.id !== c.id) }))}>
                <Icon name="close" size={14} strokeWidth={2.4} />
              </button>
            </span>
          ))}
          {!adding && (
            <button type="button" className="add-color" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} strokeWidth={2.2} /> Add color
            </button>
          )}
        </div>

        {adding && (
          <div className="color-adder">
            {unused.length > 0 && (
              <div className="color-adder__library">
                <span className="small muted">Your colors — click to add</span>
                <span className="color-adder__swatches">
                  {unused.map((c) => (
                    <button key={c.hex} type="button" className="lib-color" onClick={() => addColor(c)}>
                      <span style={{ background: c.hex, color: isLight(c.hex) ? 'var(--ink)' : '#fff' }} />
                      {c.name}
                    </button>
                  ))}
                </span>
              </div>
            )}
            <form
              className="color-adder__new"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim()) return;
                addColor({ name: newName, hex: newHex });
                setNewName('');
              }}
            >
              <label className="field">
                <span className="field__label">New color</span>
                <input type="color" className="color-input" value={newHex} onChange={(e) => setNewHex(e.target.value)} aria-label="Swatch color" />
              </label>
              <label className="field color-adder__name">
                <span className="field__label">Name</span>
                <input className="input" value={newName} placeholder="e.g. Orange" onChange={(e) => setNewName(e.target.value)} />
              </label>
              <button type="submit" className="btn btn--sm" disabled={!newName.trim()}>
                Add
              </button>
              <button type="button" className="link-btn" onClick={() => setAdding(false)}>
                Done
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
