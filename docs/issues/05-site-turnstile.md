---
title: 'site: criar o widget Turnstile e configurar as chaves (sem isso o formulário de produção fica fechado)'
labels: [site]
---

**Como está:** produção (`logikos-site.pages.dev` e, depois do cutover, `logikosvision.com.br`) **falha fechado** sem `TURNSTILE_SECRET_KEY`: o `/api/lead` responde 503 e o formulário mostra "não foi possível enviar… escreva para <e-mail>". Previews (cada PR/branch) usam a chave pública de teste da Cloudflare, declarada em `wrangler.toml` `[env.preview.vars]`, e gravam no KV separado `leads-site-preview`.

Motivo: a chave de teste aceita qualquer token; sem domínio custom, produção também é `*.pages.dev`, então não dá para liberar a chave de teste por hostname (achado da revisão de segurança).

- [ ] Painel Cloudflare → Turnstile → novo widget (Managed), domínios `logikos-site.pages.dev` e `logikosvision.com.br`.
- [ ] `PUBLIC_TURNSTILE_SITE_KEY` como _variable_ do repositório GitHub (entra no build).
- [ ] `TURNSTILE_SECRET_KEY` como secret do projeto Pages, ambiente **Production** (`wrangler pages secret put TURNSTILE_SECRET_KEY --project-name logikos-site`).
- [ ] Conferir: com a chave real, o servidor também exige `hostname` igual ao host da requisição e `action` = `lead-contact`/`lead-partner`.
