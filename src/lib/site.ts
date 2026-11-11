// Build-time site facts. Company facts are fixed; channel facts come from env
// so they can change without a code edit (see .env.example).

import { pathFor, type Locale } from '../i18n/routes';

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

export const CF_ANALYTICS_TOKEN: string = env.PUBLIC_CF_ANALYTICS_TOKEN ?? '';

export function whatsappHref(message: string): string | undefined {
  if (!WHATSAPP_NUMBER) return undefined;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function mediaUrl(file: string): string {
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL}/${file}` : `/media/${file}`;
}

/** Interests Koda offers as chips in the contact conversation (sent to the CRM as text). */
export const CHAT_INTERESTS = [
  'fire',
  'epi',
  'quality',
  'counting',
  'ergonomics',
  'zones',
  'custom',
  'twins',
  'robotics',
  'partnership',
] as const;
export type ChatInterest = (typeof CHAT_INTERESTS)[number];

/**
 * "Talk to a specialist", everywhere on the site: the conversation with Koda on the contact page
 * (feedback 11/11, item 11), with the page's interest already picked when there is one.
 */
export function specialistHref(locale: Locale, interest?: ChatInterest): string {
  return `${pathFor('contact', locale)}${interest ? `?interesse=${interest}` : ''}#conversa`;
}
