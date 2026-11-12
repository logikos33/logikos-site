// Visita ao site pelo link do e-mail do CRM: um aviso por aba, só com código válido e só depois do aceite.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { avisarVisita } from '../../src/scripts/rastreio-crm.ts';

function memoria(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) } as Storage;
}

const AVISO = { u: 'https://brandschutz.logikosvision.com.br/api/crm/marco', corpo: '{"op":"OP-0042","evento":"site_visitado"}' };

describe('rastreio do CRM no site', () => {
  it('com aceite, avisa o CRM uma vez por aba, com o código e o evento site_visitado', async () => {
    const enviados: { u: string; corpo: string }[] = [];
    const enviar = (u: string, b: Blob) => void b.text().then((corpo) => enviados.push({ u, corpo }));
    const s = memoria();
    const url = new URL('https://www.logikosvision.com.br/?r=OP-0042&utm_source=crm');
    assert.equal(avisarVisita(url, s, enviar, true), true);
    assert.equal(avisarVisita(url, s, enviar, true), false);
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(enviados, [AVISO]);
  });
  it('sem aceite nada é enviado; aceitando depois, em outra página da mesma sessão, vai uma vez só', async () => {
    const enviados: { u: string; corpo: string }[] = [];
    const enviar = (u: string, b: Blob) => void b.text().then((corpo) => enviados.push({ u, corpo }));
    const s = memoria();
    assert.equal(avisarVisita(new URL('https://www.logikosvision.com.br/?r=OP-0042'), s, enviar, false), false);
    assert.equal(avisarVisita(new URL('https://www.logikosvision.com.br/cases'), s, enviar, false), false);
    assert.equal(avisarVisita(new URL('https://www.logikosvision.com.br/recognition'), s, enviar, true), true);
    assert.equal(avisarVisita(new URL('https://www.logikosvision.com.br/demos'), s, enviar, true), false);
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(enviados, [AVISO]);
  });
  it('ignora sem código, código de teste ou inválido', () => {
    const s = memoria();
    const nada = () => assert.fail('não devia enviar');
    for (const q of ['', '?r=OP-TESTE', '?r=<script>', '?utm_source=crm'])
      assert.equal(avisarVisita(new URL(`https://www.logikosvision.com.br/${q}`), s, nada, true), false);
  });
});
