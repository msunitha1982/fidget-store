// Mock API. Every function is async and has a small delay so loading states are real.
// Data lives in localStorage (seeded on first run). Replace this module with real HTTP
// calls when the backend exists — the UI only talks to these functions.

import { seedOrders, seedProducts } from '../data/seed';
import type { CartLine, CustomerInfo, Order, OrderLine, OrderStatus, Product } from '../types';
import { clearFiles } from './fileStore';
import { sendOwnerEmail } from './ownerEmail';
import { describeChoices, normalizeSelections, partColors } from './product';
import { readJSON, removeKey, writeJSON } from './storage';

const KEYS = { products: 'fs.products.v1', orders: 'fs.orders.v1' };
const FIRST_ORDER_NUMBER = 1001;

const wait = (ms = 250 + Math.random() * 300) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => structuredClone(v);

/** Dev hook: add ?simulate=submit-error or ?simulate=load-error to the URL to see error states. */
const simulating = (what: string) => new URLSearchParams(location.search).get('simulate') === what;

// ---------- change notifications (so open pages refresh after admin edits) ----------

type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
const emit = () => listeners.forEach((fn) => fn());
window.addEventListener('storage', (e) => {
  if (e.key === KEYS.products || e.key === KEYS.orders) emit();
});

// ---------- persistence ----------

function loadProducts(): Product[] {
  return readJSON<Product[] | null>(KEYS.products, null) ?? clone(seedProducts);
}
function saveProducts(list: Product[]) {
  writeJSON(KEYS.products, list);
  emit();
}
function loadOrders(): Order[] {
  return readJSON<Order[] | null>(KEYS.orders, null) ?? clone(seedOrders);
}
function saveOrders(list: Order[]) {
  writeJSON(KEYS.orders, list);
  emit();
}

export class NotFoundError extends Error {}

// ---------- shop ----------

export async function listPublishedProducts(): Promise<Product[]> {
  await wait();
  if (simulating('load-error')) throw new Error('Could not load products');
  return loadProducts().filter((p) => p.published);
}

export async function getPublishedProduct(slug: string): Promise<Product> {
  await wait();
  if (simulating('load-error')) throw new Error('Could not load product');
  const p = loadProducts().find((x) => x.slug === slug && x.published);
  if (!p) throw new NotFoundError('Product not available');
  return p;
}

/** Products referenced by a cart, published or not (so the cart can flag removed items). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  await wait(120);
  return loadProducts().filter((p) => ids.includes(p.id));
}

export interface SubmitOrderInput {
  customer: CustomerInfo;
  lines: CartLine[];
}

/**
 * Saves the order, assigns a number and notifies the owner.
 * Server-side this must re-read prices from the catalog (as done here) — never trust the client.
 */
export async function submitOrder(input: SubmitOrderInput): Promise<Order> {
  await wait(700);
  if (simulating('submit-error')) throw new Error('The order service did not respond');

  const products = loadProducts();
  const lines: OrderLine[] = [];
  for (const cl of input.lines) {
    const p = products.find((x) => x.id === cl.productId && x.published);
    if (!p) continue; // unavailable products are dropped; the cart warns about this before submit
    const sel = normalizeSelections(p, cl.selections);
    lines.push({
      productId: p.id,
      productName: p.name,
      unitPrice: p.price,
      quantity: cl.quantity,
      choices: describeChoices(p, sel),
      model: p.model,
      partColors: partColors(p, sel),
    });
  }
  if (lines.length === 0) throw new Error('None of the items in this order are available any more.');

  const orders = loadOrders();
  const now = new Date().toISOString();
  const order: Order = {
    number: Math.max(FIRST_ORDER_NUMBER - 1, ...orders.map((o) => o.number)) + 1,
    createdAt: now,
    status: 'NEW',
    customer: {
      name: input.customer.name.trim(),
      email: input.customer.email.trim(),
      note: input.customer.note.trim(),
    },
    lines,
    total: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    history: [{ status: 'NEW', at: now }],
    ownerNotifiedAt: null,
  };
  // Save first: the order must never be lost because the email didn't go out.
  saveOrders([order, ...orders]);
  return emailOwner(order);
}

const adminOrderUrl = (n: number) => `${location.origin}/admin/orders/${n}`;

/** Emails the owner and records the outcome on the order. Never throws. */
async function emailOwner(order: Order): Promise<Order> {
  let patch: Pick<Order, 'ownerNotifiedAt' | 'notifyError'>;
  try {
    await sendOwnerEmail(order, adminOrderUrl(order.number));
    patch = { ownerNotifiedAt: new Date().toISOString(), notifyError: null };
  } catch (e) {
    patch = { ownerNotifiedAt: null, notifyError: (e as Error).message };
  }
  const orders = loadOrders().map((o) => (o.number === order.number ? { ...o, ...patch } : o));
  saveOrders(orders);
  return { ...order, ...patch };
}

/** Admin: try the owner email again (e.g. after the first one failed). */
export async function adminResendOwnerEmail(number: number): Promise<Order> {
  const o = loadOrders().find((x) => x.number === number);
  if (!o) throw new NotFoundError('Order not found');
  return emailOwner(o);
}

/** Public lookup used by the confirmation page. */
export async function getOrder(number: number): Promise<Order> {
  await wait(200);
  const o = loadOrders().find((x) => x.number === number);
  if (!o) throw new NotFoundError('Order not found');
  return o;
}

// ---------- admin ----------

export async function adminListProducts(): Promise<Product[]> {
  await wait();
  return loadProducts();
}

export async function adminGetProduct(id: string): Promise<Product> {
  await wait();
  const p = loadProducts().find((x) => x.id === id);
  if (!p) throw new NotFoundError('Product not found');
  return p;
}

export async function adminSaveProduct(product: Product): Promise<Product> {
  await wait(450);
  const list = loadProducts();
  const taken = new Set(list.filter((p) => p.id !== product.id).map((p) => p.slug));
  let slug = product.slug || 'product';
  for (let i = 2; taken.has(slug); i++) slug = `${product.slug}-${i}`;
  const saved = { ...product, slug, updatedAt: new Date().toISOString() };
  const i = list.findIndex((p) => p.id === product.id);
  if (i >= 0) list[i] = saved;
  else list.unshift(saved);
  saveProducts(list);
  return saved;
}

export async function adminSetPublished(id: string, published: boolean) {
  await wait(150);
  saveProducts(loadProducts().map((p) => (p.id === id ? { ...p, published, updatedAt: new Date().toISOString() } : p)));
}

export async function adminDeleteProduct(id: string) {
  await wait();
  saveProducts(loadProducts().filter((p) => p.id !== id));
}

export async function adminListOrders(): Promise<Order[]> {
  await wait();
  return loadOrders().sort((a, b) => b.number - a.number);
}

export async function adminGetOrder(number: number): Promise<Order> {
  return getOrder(number);
}

export async function adminSetOrderStatus(number: number, status: OrderStatus): Promise<Order> {
  await wait(200);
  const orders = loadOrders();
  const o = orders.find((x) => x.number === number);
  if (!o) throw new NotFoundError('Order not found');
  if (o.status !== status) {
    o.status = status;
    o.history.push({ status, at: new Date().toISOString() });
  }
  saveOrders(orders);
  return o;
}

/** Restores the sample catalog and orders (admin → "Reset demo data"). */
export async function resetDemoData() {
  removeKey(KEYS.products);
  removeKey(KEYS.orders);
  try {
    await clearFiles();
  } catch {
    /* IndexedDB unavailable */
  }
  emit();
}
