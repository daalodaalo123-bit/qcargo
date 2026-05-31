/** Customer-facing brand name — use everywhere users see company name */
export const BRAND_NAME = 'Q CARGO';
export const BRAND_TAGLINE = 'Logistics & Freight — Official Payment Receipt';

const contactFromEnv = process.env.NEXT_PUBLIC_CONTACT_URL?.trim();
export const CONTACT_SITE_HOST = contactFromEnv
  ? contactFromEnv.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : 'contacts.qcargologitics.com';
export const CONTACT_SITE_URL = contactFromEnv?.startsWith('http')
  ? contactFromEnv.replace(/\/$/, '')
  : `https://${CONTACT_SITE_HOST}`;

export const BRAND_FOOTER = `${BRAND_NAME} · Hargeisa, Somaliland · ${CONTACT_SITE_HOST}`;
