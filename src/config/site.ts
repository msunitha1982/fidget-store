// Business details that are not decided yet live here, in one place.
// Anything wrapped in [brackets] is a placeholder — the UI renders it with a visible
// "placeholder" style so nobody mistakes it for real policy.

export const site = {
  name: 'Fidget Store',
  wordmark: 'fidget store',
  tagline: '3D-printed · student-run',
  currency: 'USD',

  /** Where/when cash is paid. Not decided yet. */
  paymentDetails: '[Where & when to pay]',
  /** How customers find out an order is ready. Not decided yet. */
  readyNotice: "[How you'll hear it's ready]",
  contact: '[Contact info]',
  legalName: '[Shop name]',

  /**
   * Every submitted order is emailed here. Sent from the customer's browser through
   * FormSubmit (https://formsubmit.co) — no account needed. The very first email asks this
   * address to click "Activate"; after that, orders arrive normally.
   */
  ownerEmail: '1071195@lwsd.org',
  emailEndpoint: 'https://formsubmit.co/ajax/',

  /** Accepted model upload types in the admin. */
  modelFileTypes: '.stl',
  modelFileRules: '[Final rules for multi-part models]',
} as const;

/** True when a config string is still an unfilled placeholder. */
export const isPlaceholder = (value: string) => value.startsWith('[') && value.endsWith(']');
