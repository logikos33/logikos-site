// External destinations the site links to. All public; read-only inventory in
// docs/design/baseline/INVENTARIO.md §2 (03/10/2026). Nothing here is a secret.

/** The guided Logikos experience (Koda's tour of the scenarios). `?cenario=` takes fogo, epi, contagem, qualidade. */
export const EXPERIENCE_URL = 'https://logikosvision.com.br/experiencia/';

/** The phone demo with the site's identity (feedback 11/11, item 21): the visitor's own camera. */
export const PHONE_DEMO_URL = 'https://logikosvision.com.br/teste-no-seu-celular/';

/**
 * Logikos CRM lead intake (receberLead in the CRM repo): JSON as text/plain (a "simple" request, no
 * preflight), CORS open to logikosvision.com.br and *.logikos-site.pages.dev. Honeypot + per-IP limit
 * on the server; `event_id` dedupes retries. Origin "site-logikos-contato" is labelled "Site Logikos".
 */
export const CRM_LEAD_URL = 'https://brandschutz.logikosvision.com.br/api/lead';
