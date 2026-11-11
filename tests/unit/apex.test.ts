// Roteador da raiz (workers/apex): o site vem do Pages; /demo, /experiencia e /bs seguem para a origem de hoje.
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import apex from '../../workers/apex/index.js';

const original = globalThis.fetch;
let pedidos: string[] = [];

function falso(resposta: () => Response) {
  globalThis.fetch = (async (req: Request | string) => {
    pedidos.push(typeof req === 'string' ? req : req.url);
    return resposta();
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = original;
  pedidos = [];
});

describe('roteador da raiz', () => {
  it('serve o site do Pages e tira o noindex do pages.dev', async () => {
    falso(() => new Response('ok', { headers: { 'X-Robots-Tag': 'noindex' } }));
    const res = await apex.fetch(new Request('https://logikosvision.com.br/en/?a=1'));
    assert.deepEqual(pedidos, ['https://logikos-site.pages.dev/en/?a=1']);
    assert.equal(res.headers.get('X-Robots-Tag'), null);
  });

  it('mantém /demo e /bs na origem atual', async () => {
    falso(() => new Response('origem'));
    for (const p of ['/demo/', '/demo', '/bs']) {
      await apex.fetch(new Request(`https://logikosvision.com.br${p}`));
    }
    assert.ok(pedidos.every((u) => u.startsWith('https://logikosvision.com.br/')));
    assert.equal(pedidos.length, 3);
  });

  it('/experiencia usa a origem quando ela responde', async () => {
    falso(() => new Response('experiência na origem'));
    const res = await apex.fetch(new Request('https://logikosvision.com.br/experiencia/?cenario=fogo'));
    assert.deepEqual(pedidos, ['https://logikosvision.com.br/experiencia/?cenario=fogo']);
    assert.equal(await res.text(), 'experiência na origem');
  });

  it('/experiencia cai na publicação da experiência quando a origem dá 404', async () => {
    let n = 0;
    falso(() => (n++ === 0 ? new Response('', { status: 404 }) : new Response('prévia')));
    const res = await apex.fetch(new Request('https://logikosvision.com.br/experiencia/?cenario=epi'));
    assert.deepEqual(pedidos, [
      'https://logikosvision.com.br/experiencia/?cenario=epi',
      'https://previa.logikos-experiencia.pages.dev/experiencia/?cenario=epi',
    ]);
    assert.equal(await res.text(), 'prévia');
  });

  it('não confunde /demonstracao com /demo', async () => {
    falso(() => new Response('ok'));
    await apex.fetch(new Request('https://logikosvision.com.br/demonstracao'));
    assert.deepEqual(pedidos, ['https://logikos-site.pages.dev/demonstracao']);
  });

  it('reescreve redirecionamento absoluto para o domínio', async () => {
    falso(() => new Response(null, { status: 301, headers: { Location: 'https://logikos-site.pages.dev/sobre/' } }));
    const res = await apex.fetch(new Request('https://logikosvision.com.br/sobre'));
    assert.equal(res.headers.get('Location'), 'https://logikosvision.com.br/sobre/');
  });
});
