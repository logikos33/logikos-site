// Build-time site facts. Company facts are fixed; channel facts come from env
// so they can change without a code edit (see .env.example).

const env = import.meta.env;

export const COMPANY = {
  legalName: 'Logikos Soluções',
  cnpj: '46.448.212/0001-37',
  locality: 'Indaial',
  region: 'SC',
  country: 'BR',
} as const;

/** E.164 digits only, e.g. 5547999999999. Empty -> WhatsApp CTAs fall back to the contact page. */
export const WHATSAPP_NUMBER: string = (env.PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

/** Only confirmed mailbox on the domain (published by Logikos on the fire demo). Override via env. */
export const CONTACT_EMAIL: string = env.PUBLIC_CONTACT_EMAIL || 'vitor@logikosvision.com.br';

/** Base URL for final videos (R2). Empty -> local placeholders under /media. */
export const MEDIA_BASE_URL: string = (env.PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/$/, '');

/** Cloudflare's documented always-pass test site key, used until the real key is configured. */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_SITE_KEY: string = env.PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY;

export const CF_ANALYTICS_TOKEN: string = env.PUBLIC_CF_ANALYTICS_TOKEN ?? '';

export function whatsappHref(message: string): string | undefined {
  if (!WHATSAPP_NUMBER) return undefined;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function mediaUrl(file: string): string {
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL}/${file}` : `/media/${file}`;
}
