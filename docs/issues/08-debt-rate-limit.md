---
title: 'debt: rate limit em /api/lead'
labels: [debt, site]
---

Hoje a proteção é Turnstile + honeypot + checagem de Origin + limite de 16 KiB. Falta limitar volume por IP.

- [ ] Regra de rate limiting do Cloudflare (WAF) para `POST /api/lead` depois do cutover, ou contador por IP no KV.
