// External destinations the site links to. All public; read-only inventory in
// docs/design/baseline/INVENTARIO.md §2 (03/10/2026). Nothing here is a secret.

/** Live demos: both run the model inside the visitor's browser (nothing is uploaded). */
export const DEMOS = {
  /** Logikos-branded event demo (Railway `recognition-demo-evento`): YOLOX-nano ONNX, Apache-2.0. */
  epi: 'https://recognition-demo-evento-production.up.railway.app/',
  /** FireSet v1 (Railway `fire-demo`): YOLOX-s ONNX, Apache-2.0. Live screen at /incendio.html. */
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

/**
 * Recognition SaaS sign-in, production environment (Railway `epi-monitor-v2/Frontend`).
 * The custom domain app.logikosvision.com.br does not answer (certificate pending), so the
 * Railway service domain is the only working production URL. Never DEV/staging environments.
 */
export const LOGIN_URL = 'https://frontend-production-bf96.up.railway.app/login';
