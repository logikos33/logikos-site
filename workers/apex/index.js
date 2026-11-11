// Roteador da raiz logikosvision.com.br.
// O site institucional vem do Pages (logikos-site.pages.dev); o que já existe no domínio
// segue para a origem de hoje sem mudança: /demo (túnel) e /bs (Single Redirect do QR da
// BrandSchutz, que roda antes deste Worker).
// /experiencia: tenta a origem de hoje; se ela ainda não serve a experiência (404/5xx),
// cai na publicação atual da experiência. Quando a rota própria logikosvision.com.br/experiencia*
// existir, ela é mais específica e passa a valer sem tocar aqui.
const PAGES = 'https://logikos-site.pages.dev';
const EXPERIENCIA = 'https://previa.logikos-experiencia.pages.dev';
const ORIGEM_ATUAL = [/^\/demo(\/|$)/, /^\/bs\/?$/];
const DA_EXPERIENCIA = /^\/experiencia(\/|$)/;

async function proxy(base, url, req) {
  const res = await fetch(new Request(new URL(url.pathname + url.search, base), req), { redirect: 'manual' });
  const out = new Response(res.body, res);
  const loc = out.headers.get('Location');
  if (loc && loc.startsWith(base)) out.headers.set('Location', url.origin + loc.slice(base.length));
  return out;
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    // Subrequisição para o próprio host vai à origem, sem passar de novo por este Worker.
    if (ORIGEM_ATUAL.some((r) => r.test(url.pathname))) return fetch(req);

    if (DA_EXPERIENCIA.test(url.pathname)) {
      if (req.method === 'GET' || req.method === 'HEAD') {
        const origem = await fetch(req.clone());
        if (origem.status !== 404 && origem.status < 500) return origem;
      }
      return proxy(EXPERIENCIA, url, req);
    }

    const out = await proxy(PAGES, url, req);
    // O _headers marca *.pages.dev como noindex; no domínio final o site deve ser indexado.
    out.headers.delete('X-Robots-Tag');
    return out;
  },
};
