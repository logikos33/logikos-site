// Link pessoal dos e-mails do CRM (?r=OP-0042&utm_…): avisa o CRM, uma vez por aba, que a pessoa veio ao
// site da Logikos. Só o código do card e o evento, sem dado pessoal; o CRM não move o card (só registra).
import { CRM_LEAD_URL } from '../config/links.ts';

export const CODIGO_OP = /^OP-\d{4,6}$/;
const CHAVE = 'lk_site_op';

export function avisarVisita(url: URL, armazenamento: Storage, enviar: (u: string, b: Blob) => unknown) {
  const op = url.searchParams.get('r');
  if (!op || !CODIGO_OP.test(op)) return false;
  if (armazenamento.getItem(CHAVE) === op) return false;
  armazenamento.setItem(CHAVE, op);
  // text/plain: requisição simples, sem preflight (o CRM libera CORS para logikosvision.com.br)
  enviar(new URL('/api/crm/marco', CRM_LEAD_URL).href, new Blob([JSON.stringify({ op, evento: 'site_visitado' })], { type: 'text/plain' }));
  return true;
}

if (typeof window !== 'undefined') {
  try {
    avisarVisita(new URL(location.href), sessionStorage, (u, b) => navigator.sendBeacon?.(u, b));
  } catch {
    // aba privada sem armazenamento: a visita não chega ao CRM
  }
}
