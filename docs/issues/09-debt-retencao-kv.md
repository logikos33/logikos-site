---
title: 'debt: retenção e exportação dos leads no KV leads-site'
labels: [debt]
---

Leads no KV não têm TTL. Depois de definido o prazo (issue de validação jurídica):

- [ ] Gravar com `expirationTtl` em `functions/api/lead.ts`.
- [ ] Rotina de exportação/limpeza (ou migração para o recognition-leads).
