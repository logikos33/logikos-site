// Roteador da raiz logikosvision.com.br.
// O site institucional vem do Pages (logikos-site.pages.dev); o que já existe no domínio
// segue para a origem de hoje sem mudança: /demo (túnel), /experiencia (Worker próprio ou
// origem) e /bs (Single Redirect do QR da BrandSchutz, que roda antes deste Worker).
const PAGES = 'https://logikos-site.pages.dev';
const ORIGEM_ATUAL = [/^\/demo(\/|$)/, /^\/experiencia(\/|$)/, /^\/bs\/?$/];

export default {
  async fetch(req) {
    const url = new URL(req.url);
    // Subrequisição para o próprio host vai à origem, sem passar de novo por este Worker.
    if (ORIGEM_ATUAL.some((r) => r.test(url.pathname))) return fetch(req);

    const res = await fetch(new Request(new URL(url.pathname + url.search, PAGES), req), { redirect: 'manual' });
    const out = new Response(res.body, res);
    // O _headers marca *.pages.dev como noindex; no domínio final o site deve ser indexado.
    out.headers.delete('X-Robots-Tag');
    const loc = out.headers.get('Location');
    if (loc && loc.startsWith(PAGES)) out.headers.set('Location', url.origin + loc.slice(PAGES.length));
    return out;
  },
};
