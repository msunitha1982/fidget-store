import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { sha256 } from './sha256';

it('matches Node’s SHA-256 across block boundaries and unicode', () => {
  for (const s of ['', 'abc', 'interesting', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'ünïcödé 🌀', 'a'.repeat(1000)]) {
    expect(sha256(s)).toBe(createHash('sha256').update(s).digest('hex'));
  }
});
