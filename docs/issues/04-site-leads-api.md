---
title: 'site: ligar o formulário ao recognition-leads (hoje grava em KV)'
labels: [site, debt]
---

A Function `functions/api/lead.ts` encaminha para `LEADS_API_URL` com `Authorization: Bearer LEADS_API_KEY` quando as duas variáveis existem; sem elas, ou em erro, grava no KV `leads-site` (chave `lead:<ISO>:<uuid>`, sem dado pessoal na chave).

O contrato do `leads-collector` (projeto Railway `recognition-leads`) não está em nenhum repositório (deploy por `railway up`, sem fonte). Issue correspondente no Recognition: ver `docs/issues/recognition-contrato-leads.md`.

- [ ] Publicar a fonte e o contrato do `leads-collector`.
- [ ] Ajustar o payload em `src/lib/lead.ts` se o contrato pedir (ex.: `origem` enum).
- [ ] Configurar `LEADS_API_URL`/`LEADS_API_KEY` como secrets do Pages.
- [ ] Migrar os leads já gravados no KV (`wrangler kv key list --binding LEADS_KV`).
