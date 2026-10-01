# logikos-site

Site institucional da Logikos Soluções (logikosvision.com.br): Astro 7 estático, bilíngue (PT-BR na raiz, EN em `/en/`), tema claro por padrão, formulário com Cloudflare Pages Function + Turnstile, deploy no Cloudflare Pages.

**Estado atual, decisões e próximo passo: [ESTADO.md](ESTADO.md).** Decisões de arquitetura: [docs/decisions/](docs/decisions/).

## Rodar

```sh
pnpm install
pnpm dev                 # http://localhost:4321
pnpm build               # dist/
```

## Verificações (as mesmas do CI)

```sh
pnpm check               # astro check (TypeScript estrito)
pnpm lint                # ESLint + Prettier
pnpm gate:i18n           # paridade PT/EN, números documentados, zero texto solto em componente
pnpm test:unit           # Function /api/lead + contrato do lead (node:test)
pnpm build
pnpm gate:license        # allowlist de licença sobre o que é servido + copyleft na árvore
pnpm gate:text           # texto proibido no dist/
pnpm test:e2e            # Playwright contra `wrangler pages dev` (dist + functions + KV local)
pnpm lhci                # Lighthouse CI mobile, home PT e EN
```

Em contêiner com Chromium próprio: `PW_CHROMIUM_PATH=/caminho/chrome pnpm test:e2e` e `CHROME_PATH=/caminho/chrome pnpm lhci`.

## Conteúdo

Todo texto está em `src/i18n/pt-br.json` e `src/i18n/en.json`. Slugs por idioma e alternates (hreflang, sitemap, alternador PT|EN) vêm de um único mapa: `src/i18n/routes.ts`. Números em texto precisam de fonte em `src/i18n/numbers.allow.json`.

## Variáveis

Ver [.env.example](.env.example). Públicas (`PUBLIC_*`) entram no build via _variables_ do repositório; segredos da Function (`TURNSTILE_SECRET_KEY`, `LEADS_API_URL`, `LEADS_API_KEY`) ficam só no Cloudflare Pages.
