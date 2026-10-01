---
title: 'site: criar o widget Turnstile e configurar as chaves'
labels: [site]
---

Sem `PUBLIC_TURNSTILE_SITE_KEY` o site usa a chave de teste da Cloudflare (`1x00000000000000000000AA`). Sem `TURNSTILE_SECRET_KEY` a Function aceita a chave de teste **só** em `*.pages.dev`/localhost; em domínio próprio responde 503 (falha fechado).

- [ ] Painel Cloudflare → Turnstile → novo widget (modo Managed), domínios: `logikosvision.com.br`, `logikos-site.pages.dev`.
- [ ] `PUBLIC_TURNSTILE_SITE_KEY` como _variable_ do repositório GitHub.
- [ ] `TURNSTILE_SECRET_KEY` como secret do projeto Pages (produção e preview).
- [ ] Obrigatório antes do cutover de DNS.
