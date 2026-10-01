import en from './en.json';
import ptbr from './pt-br.json';
import type { Locale } from './routes';

export type Dict = typeof ptbr;

// `en` must have the same shape as `pt-br`; scripts/i18n-gate.mjs enforces exact key parity.
const DICTS: Record<Locale, Dict> = { 'pt-br': ptbr, en };

export function dict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Replaces `{name}` placeholders. Values are plain text; markup never lives in i18n. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`));
}
