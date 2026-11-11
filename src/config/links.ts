// External destinations the site links to. All public; read-only inventory in
// docs/design/baseline/INVENTARIO.md §2 (03/10/2026). Nothing here is a secret.

/** Live demos: both run the model inside the visitor's browser (nothing is uploaded). */
export const DEMOS = {
  /** Logikos-branded event demo (Railway `recognition-demo-evento`), Logikos proprietary model in the browser. */
  epi: 'https://recognition-demo-evento-production.up.railway.app/',
  /** Fire demo (Railway `fire-demo`), Logikos proprietary model in the browser. Live screen at /incendio.html. */
  fire: 'https://fire-demo-production.up.railway.app/',
} as const;

/**
 * Health probes used by functions/api/status.ts. Neither demo exposes /health, so the
 * document root is probed with HEAD; a 2xx/3xx means "up".
 */
export const DEMO_PROBES: Record<keyof typeof DEMOS, string> = {
  epi: DEMOS.epi,
  fire: DEMOS.fire,
};

/** The guided Logikos experience (Koda's tour of the scenarios). `?cenario=` takes fogo, epi, contagem, qualidade. */
export const EXPERIENCE_URL = 'https://logikosvision.com.br/experiencia/';

/** The phone demo: the visitor's own camera, model running in the browser. */
export const PHONE_DEMO_URL = 'https://logikosvision.com.br/demo/';

/**
 * Logikos CRM lead intake (receberLead in the CRM repo): JSON as text/plain (a "simple" request, no
 * preflight), CORS open to logikosvision.com.br and *.logikos-site.pages.dev. Honeypot + per-IP limit
 * on the server; `event_id` dedupes retries. Origin "site-logikos-contato" is labelled "Site Logikos".
 */
export const CRM_LEAD_URL = 'https://brandschutz.logikosvision.com.br/api/lead';
