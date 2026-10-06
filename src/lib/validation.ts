import type { CustomerInfo } from '../types';

export type CustomerErrors = Partial<Record<keyof CustomerInfo, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The only required order details: a name and an email to reach the customer. */
export function validateCustomer(c: CustomerInfo): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!c.name.trim()) errors.name = 'Enter your name';
  if (!c.email.trim()) errors.email = 'Enter your email';
  else if (!EMAIL.test(c.email.trim())) errors.email = 'That email doesn’t look right — check for typos';
  return errors;
}
