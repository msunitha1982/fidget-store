// Admin password gate.
//
// PROTOTYPE ONLY: with no backend, this check runs in the browser. It keeps casual visitors
// out of the dashboard, but anyone who opens the developer tools can get past it, and a
// changed password applies to this browser only. Real protection needs a server-side login.

import { sha256 } from './sha256';
import { readJSON, writeJSON } from './storage';

const HASH_KEY = 'fs.admin.passwordHash';
const SESSION_KEY = 'fs.admin.unlocked';
const SALT = 'fidget-store-admin:';
export const MIN_PASSWORD_LENGTH = 6;

/** sha256(SALT + "interesting") — the starting password. Never store the plain text. */
const DEFAULT_HASH = '55bb3f4686d15dcc509dd8ad6a41d4bdf1ecf67f9ed1bd15c2cffde782a4ba31';

const hash = (password: string) => sha256(SALT + password);
const storedHash = () => readJSON<string | null>(HASH_KEY, null) ?? DEFAULT_HASH;

export const checkPassword = (password: string) => hash(password) === storedHash();

export function isUnlocked() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Unlocks for this browser tab (until it's closed or "Lock" is pressed). */
export function unlock(password: string): boolean {
  if (!checkPassword(password)) return false;
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* storage blocked — stays unlocked for this page view only */
  }
  return true;
}

export function lock() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export type ChangeResult = { ok: true } | { ok: false; field: 'current' | 'next' | 'confirm'; message: string };

export function changePassword(current: string, next: string, confirm: string): ChangeResult {
  if (!checkPassword(current)) return { ok: false, field: 'current', message: 'That isn’t the current password.' };
  if (next.length < MIN_PASSWORD_LENGTH) return { ok: false, field: 'next', message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  if (next !== confirm) return { ok: false, field: 'confirm', message: 'The two new passwords don’t match.' };
  writeJSON(HASH_KEY, hash(next));
  return { ok: true };
}
