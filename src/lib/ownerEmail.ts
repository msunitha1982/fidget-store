// The "new order" email to the owner: what's in it, and how it's sent.

import { site } from '../config/site';
import type { Order } from '../types';
import { formatMoney, formatOrderNumber, plural } from './format';
import { orderPieces } from './orders';

export interface OwnerEmail {
  subject: string;
  /** Shown as a two-column table in the email, in this order. */
  fields: [label: string, value: string][];
}

export function buildOwnerEmail(order: Order, adminUrl: string): OwnerEmail {
  const pieces = orderPieces(order);
  const placed = new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const items = order.lines.map((l, i): [string, string] => [
    `Item ${i + 1}`,
    `${l.quantity} × ${l.productName} — ${l.choices.map((c) => `${c.partNames.join(' & ') || c.groupLabel}: ${c.colorName}`).join(', ')} — ${formatMoney(l.unitPrice * l.quantity)}`,
  ]);
  return {
    subject: `New order ${formatOrderNumber(order.number)} — ${plural(pieces, 'piece')} to print (${formatMoney(order.total)} cash)`,
    fields: [
      ['Order number', formatOrderNumber(order.number)],
      ['Placed', placed],
      ['Customer', order.customer.name],
      ['Customer email', order.customer.email],
      ['Note from customer', order.customer.note || '—'],
      ...items,
      ['Pieces to print', String(pieces)],
      ['Total — collect in cash, in person', formatMoney(order.total)],
      ['Open in admin', adminUrl],
    ],
  };
}

/** Sends the order email. Throws with a readable message if it didn't go through. */
export async function sendOwnerEmail(order: Order, adminUrl: string): Promise<void> {
  const email = buildOwnerEmail(order, adminUrl);
  const body: Record<string, string> = {
    _subject: email.subject,
    _template: 'table',
    _captcha: 'false',
    _replyto: order.customer.email, // "Reply" in the owner's inbox goes to the customer
  };
  for (const [label, value] of email.fields) body[label] = value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(site.emailEndpoint + encodeURIComponent(site.ownerEmail), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
    if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || `Email service answered ${res.status}`);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('The email service didn’t answer in time');
    if (e instanceof TypeError) throw new Error('Couldn’t reach the email service (offline or blocked)');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
