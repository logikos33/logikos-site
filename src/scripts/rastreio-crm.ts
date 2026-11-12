// Link pessoal dos e-mails do CRM (?r=OP-0042&utm_…): avisa o CRM, uma vez por aba, que a pessoa veio ao
// site da Logikos. Só o código do card e o evento, sem dado pessoal; o CRM não move o card (só registra).
// Decisão do Vitor (12/11): o aviso espera o "Aceitar" do aviso de cookies. Sem aceite nada é enviado;
// o código fica só na aba (sessionStorage) e, se a pessoa aceitar depois na mesma sessão, vai uma vez.
import { CRM_LEAD_URL } from '../config/links.ts';

export const CODIGO_OP = /^OP-\d{4,6}$/;
const ENVIADO = 'lk_site_op';
const PENDENTE = 'lk_site_op_pendente';

export function avisarVisita(url: URL, armazenamento: Storage, enviar: (u: string, b: Blob) => unknown, aceito: boolean) {
  const veio = url.searchParams.get('r');
  if (veio && CODIGO_OP.test(veio)) armazenamento.setItem(PENDENTE, veio);
  if (!aceito) return false;
  const op = armazenamento.getItem(PENDENTE);
  if (!op || armazenamento.getItem(ENVIADO) === op) return false;
  armazenamento.setItem(ENVIADO, op);
  // text/plain: requisição simples, sem preflight (o CRM libera CORS para logikosvision.com.br)
  enviar(new URL('/api/crm/marco', CRM_LEAD_URL).href, new Blob([JSON.stringify({ op, evento: 'site_visitado' })], { type: 'text/plain' }));
  return true;
}

if (typeof window !== 'undefined') {
  const aceito = () => {
    try {
      return (JSON.parse(localStorage.getItem('lk-consentimento') ?? 'null') as { valor?: string } | null)?.valor === 'aceito';
    } catch {
      return false;
    }
  };
  const rodar = () => {
    try {
      avisarVisita(new URL(location.href), sessionStorage, (u, b) => navigator.sendBeacon?.(u, b), aceito());
    } catch {
      // aba privada sem armazenamento: a visita não chega ao CRM
    }
  };
  rodar();
  // O aviso de cookies dispara este evento quando a pessoa escolhe (Consentimento.astro).
  addEventListener('lk-consentimento', rodar);
}
