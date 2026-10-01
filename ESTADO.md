# ESTADO — logikos-site

Atualizado em 01/10/2026, fim da rodada 1 ("nascimento do site"). **O prompt de continuação lê este arquivo primeiro.**

## Situação em uma tela

|           |                                                                                                                                                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Código    | Site completo: 20 páginas (10 PT + 10 EN) + 404 + `/_marca`, formulário com Function, CI completo. Tudo verde **localmente**.                                                                                                                                                                                            |
| Onde está | **Só no contêiner da sessão:** `/home/user/logikos-site` (git local, `main`). ⚠️ O repositório `logikos33/logikos-site` **não existe** no GitHub: a integração desta sessão recebeu `403 Resource not accessible by integration` em `POST /user/repos`. Se o contêiner for reciclado antes do push, o trabalho se perde. |
| No ar     | **Nada.** Sem URL `*.pages.dev`: a rede do contêiner bloqueia `api.cloudflare.com` (403 do proxy) e não há `CLOUDFLARE_API_TOKEN`. O workflow de deploy está pronto e espera os secrets.                                                                                                                                 |
| Domínio   | `logikosvision.com.br` e `demo.logikosvision.com.br` **intocados** (nenhuma chamada a DNS, Railway ou domínio custom).                                                                                                                                                                                                   |

### Próximo comando (Vitor, nesta ordem)

```sh
# 1. criar o repositório vazio (privado) — a integração do Claude não tem permissão para isso
gh repo create logikos33/logikos-site --private
# 2. instalar o app do Claude no repo novo (se o app estiver em "repositórios selecionados") e anexar à sessão
# 3. na sessão: git remote add origin https://github.com/logikos33/logikos-site && git push -u origin main
# 4. secrets do repo (Settings → Secrets → Actions): CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
#    token com: Account › Cloudflare Pages: Edit, Account › Workers KV Storage: Edit
# 5. abrir as issues: ./scripts/open-issues.sh logikos33/logikos-site
```

O primeiro push em `main` com os secrets cria o projeto Pages `logikos-site`, o KV `leads-site` e publica em `https://logikos-site.pages.dev` (sem domínio custom). Cada PR ganha preview próprio.

## Divergências — o prompt dizia · o sistema diz · segui

| O prompt dizia                                                          | O sistema diz                                                                                                                                                                             | Segui                                                                                     | Por quê                                                                     |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Criar `logikos33/logikos-site` via `gh repo create`                     | `gh` sem token válido; GitHub MCP `create_repository` → 403 (integração sem permissão de criar repo)                                                                                      | Repo local com histórico próprio; pronto para push                                        | Criar repo está fora do alcance desta sessão → gate                         |
| `logikosvision.com.br` serve a landing do Recognition                   | No Railway, a landing (`epi-monitor-v2/landing-page`, Recognition `main`, `apps/landing`) está em **`demo.`**logikosvision.com.br; o apex e o `www` não estão em nenhum serviço Railway   | Cutover documentado sem assumir o que o apex serve hoje                                   | DNS/HTTP externos bloqueados pelo proxy; ninguém leu os registros atuais    |
| `demo.logikosvision.com.br` aponta para Railway                         | Sim (CNAME exigido `wp8nee59.up.railway.app`), mas o Railway vê o CNAME vazio (`REQUIRES_UPDATE`) — indício de registro proxied/flattened na Cloudflare                                   | Não tocar                                                                                 | Trava do brief                                                              |
| A landing do Recognition está no ar com o código atual                  | O que está no ar é o commit `8aa6a1a` (05/09, Astro 4.16.19); os 2 deploys de 09/09 (bump para Astro 7) **falharam** (`ERESOLVE` com `@astrojs/tailwind`)                                 | —                                                                                         | Achado para o Recognition                                                   |
| Contrato do `recognition-leads` (endpoint, campos, auth, origem)        | O serviço `recognition-leads` é um stub com o único deploy falho; quem recebe é o `leads-collector`, publicado por `railway up` **sem fonte em nenhum repo**; contrato desconhecido       | Function encaminha só se `LEADS_API_URL`+`LEADS_API_KEY` existirem; senão KV `leads-site` | Brief: não alterar o Recognition, gravar no KV e abrir issue com o contrato |
| Existe wordmark em SVG em algum repo                                    | Não existe. Recognition `develop` tem o monograma Λ e o da fechadura em SVG, e o wordmark é **texto** (Space Grotesk 700, .16em); o board do Miro é um único embed HTML ilegível pelo MCP | Wordmark em texto (mesmo lockup do app) + monograma Λ oficial; issue `brand`              | Melhor que PNG: nítido, tema claro/escuro, 0 KB                             |
| Formato JSON do HUD `{t, boxes:[{x,y,w,h,label,state,text}]}`           | O raptor tem contrato próprio: `logikos.vision.frame/1` (bbox `[x0,y0,x1,y1]` normalizado, 3 estados fechados, rótulo nunca vem do edge)                                                  | Adotei o formato do raptor + `t` (decisão 0008)                                           | Ordem do brief: "se achar o formato real, adote"                            |
| satori + resvg são MIT                                                  | São **MPL-2.0** (ambos build-time)                                                                                                                                                        | Mantive                                                                                   | MPL-2.0 está na allowlist e o PNG gerado não carrega código                 |
| Astro "versão estável atual"                                            | `7.3.5` (npm, 01/10/2026); `@astrojs/check` exige TypeScript 5/6 (TS 7.0.2 é o `latest`)                                                                                                  | Astro 7.3.5 + TypeScript 6.0.3                                                            | Compatibilidade do `astro check`                                            |
| Zona DNS na Cloudflare; registros MX/SPF/DMARC (Titan)                  | **Não verificado**: DoH e HTTPS para `logikosvision.com.br` bloqueados pelo proxy; Notion não tem nada sobre DNS                                                                          | Runbook manda capturar os registros antes de qualquer mudança                             | —                                                                           |
| "parceira NVIDIA (Jetson)" em /sobre                                    | Nada no Notion/repos comprova programa de parceria NVIDIA                                                                                                                                 | Texto diz "NVIDIA Jetson" (plataforma), sem "parceira"                                    | Uso de "partner" exige programa NVIDIA; issue `copy`                        |
| Modelo comercial "licença por prazo de 24 meses"                        | Notion (20/08, Vitor): "contrato anual por câmera/módulo (pricing pendente)"                                                                                                              | Segui o brief (mais recente)                                                              | Confirmar na issue `copy`                                                   |
| Registro no Notion "Logikosvision → 🤖 Prompts & Execuções", tag `site` | O DB fica em "🎯 Recognition — Governança do Projeto" (privado); **não tem propriedade de tag**; Devolutiva e "O que aconteceu de fato" são propriedades de texto                         | EX criado no DB existente; `[site]` no título                                             | Única base de execuções que existe                                          |

## O que está provado (com evidência reproduzível)

| Aceite                                                                             | Status                                                                                                                                                         | Evidência                                                                                                                                                |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. CI verde em `main`; gate de licença provado falhando e passando                 | ⚠️ Parcial: CI **não rodou** (sem repo). Gate provado                                                                                                          | `docs/provas/gate-licenca.md` (falha com GPL direta e com GPL só no bundle; passa sem)                                                                   |
| 2. URL `*.pages.dev` serve 20 páginas; sitemap com alternates; hreflang sem erro   | ⚠️ Sem URL. Local: 20 páginas 200, sitemap com 20 `<url>` × 3 alternates, hreflang recíproco                                                                   | `tests/e2e/routes.spec.ts`, `tests/e2e/seo.spec.ts` (passam contra `wrangler pages dev`)                                                                 |
| 3. Claro por padrão; toggle persiste; axe sem violação de contraste nos dois temas | ✅ Local                                                                                                                                                       | `tests/e2e/theme.spec.ts` — axe WCAG 2.1 A/AA nas 20 páginas × 2 temas, 0 violações; relatório anexado no Playwright (`axe-light.json`, `axe-dark.json`) |
| 4. Glitch roda uma vez e não roda com reduced-motion (Playwright + screenshot)     | ✅ Local                                                                                                                                                       | `tests/e2e/motion.spec.ts` (anexos `glitch-mid.png`, `glitch-rest.png`, `glitch-reduced-motion.png`)                                                     |
| 5. Envio sem Turnstile rejeitado; envio válido provado por KV; nada em log         | ⚠️ Parcial: rejeição provada (e2e + unit). Caminho feliz provado em unit (KV fake) e **forçado no GitHub Actions**; aqui o `siteverify` é bloqueado pelo proxy | `tests/e2e/form.spec.ts` (lista o KV com `wrangler kv key list --local`), `tests/unit/lead.test.ts` (15 testes, inclusive "nenhum dado do lead em log")  |
| 6. Lighthouse CI mobile, home PT e EN, 4 limiares                                  | ✅ Local: **98 / 100 / 100 / 100** (perf / a11y / best-practices / SEO), 3 rodadas por URL; home com 135 KB                                                    | `lighthouserc.cjs`; `pnpm lhci`                                                                                                                          |
| 7. Gate de texto proibido passa; nenhum número não documentado no i18n             | ✅                                                                                                                                                             | `pnpm gate:text` (14 regras sobre `dist/`); `pnpm gate:i18n` (números só com fonte em `src/i18n/numbers.allow.json`: `24`, `2.0`)                        |
| 8. ESTADO.md commitado                                                             | ✅                                                                                                                                                             | este arquivo                                                                                                                                             |

Comandos que reproduzem tudo: ver `README.md` (seção Verificações).

## Inventário (bloco 0) — somente leitura, 01/10/2026

| Item                                    | Existe?                | Onde                                                                                                                                                | Reaproveitar?                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Wordmark em SVG                         | Não                    | Recognition `develop` usa texto (`apps/frontend/src/app/acesso/Marca.tsx`); Miro `uXjVH5gqWPE=` = 1 embed HTML                                      | Lockup em texto, issue `brand`                                |
| Símbolo / monograma em SVG              | Sim (2 variantes)      | Recognition `develop`: `docs/design/handoff-f5/lk-loader.js` (Λ vazado no círculo) e `Marca.tsx` (fechadura no círculo)                             | Λ no favicon/rodapé; escolha final na issue `brand`           |
| PNG de marca                            | Sim                    | Recognition `develop`: `docs/negocio/logikos_simbolo.png` (Λ no círculo), `logikos_logo_200.png` (L + ponto ciano)                                  | Só referência                                                 |
| HUD com caixas em colchete              | Não                    | raptor e fire-demo desenham retângulos inteiros; white-vision `Miniatura.tsx` tem chips                                                             | Reimplementado limpo (`HudVideo.astro`)                       |
| Formato de detecções do raptor          | Sim                    | raptor `main:docs/contratos/CONTRATO-EDGE-PAINEL-v1.md` §3 (`logikos.vision.frame/1`); implementação em `pandora/contrato.py` (branches `frente/*`) | Adotado (decisão 0008)                                        |
| Endpoint do recognition-leads           | Parcial                | Railway `recognition-leads/leads-collector` → `https://leads-collector-production.up.railway.app`; sem fonte, sem contrato                          | KV como fallback; `docs/issues/recognition-contrato-leads.md` |
| O que `demo.logikosvision.com.br` serve | Landing do Recognition | Railway `epi-monitor-v2/landing-page`                                                                                                               | Não tocar                                                     |
| O que `logikosvision.com.br` serve      | Desconhecido           | Não está no Railway; DNS/HTTP bloqueados daqui                                                                                                      | Capturar no passo 1 do cutover                                |
| MX/SPF/DMARC (Titan)                    | Desconhecido           | Bloqueado daqui; nada no Notion                                                                                                                     | Preservar no cutover                                          |
| Cloudflare: conta, Pages, R2, wrangler  | Desconhecido           | `api.cloudflare.com` bloqueado; sem token no ambiente                                                                                               | Workflow pronto                                               |
| Node / pnpm / Astro                     | Sim                    | Node 22.22.0, pnpm 10.28.0, Astro 7.3.5                                                                                                             | Usados                                                        |

## Decisões

Uma linha cada em [`docs/decisions/`](docs/decisions/) (0001–0020): o quê, por quê, como reverter.

## Issues

Rascunhos prontos em [`docs/issues/`](docs/issues/) (o repo ainda não existe para recebê-los): `brand` wordmark SVG · `copy` texto final · `copy` vídeos da feira · `site` leads API · `site` Turnstile · `site` WhatsApp oficial · `copy` validação jurídica · `debt` rate limit · `debt` retenção no KV · `site` cutover · `site` analytics · e **uma para o Recognition** (contrato do `leads-collector`).

## Cutover de DNS (gate: Vitor) — passo a passo com rollback

Pré-requisitos: issues de Turnstile, WhatsApp e validação jurídica fechadas; preview aprovado em `logikos-site.pages.dev`.

1. **Fotografar o estado atual** (de uma máquina com rede livre) e colar a saída na issue de cutover:
   ```sh
   for t in A AAAA CNAME NS MX TXT CAA; do dig +short logikosvision.com.br $t; done
   dig +short www.logikosvision.com.br CNAME; dig +short www.logikosvision.com.br A
   dig +short _dmarc.logikosvision.com.br TXT
   curl -sI https://logikosvision.com.br | head -5
   ```
2. **Se a zona estiver na Cloudflare:** Pages → `logikos-site` → Custom domains → adicionar `logikosvision.com.br` (e `www`). A Cloudflare cria o CNAME (apex achatado) para `logikos-site.pages.dev`. Adicionar **uma vez** pelo painel — nunca por script em loop (precedente: no Railway, religar domínio gerou alvo novo e derrubou a landing do evento).
3. **Se a zona estiver fora da Cloudflare** (ex.: Registro.br): apex em Pages exige a zona na Cloudflare. Ou migra os NS para a Cloudflare (recriando **antes** MX/SPF/DMARC/DKIM do Titan e os registros de `demo.`, `app.`, `api.`), ou publica só `www` por CNAME e redireciona o apex no provedor atual.
4. ⛔ **Não tocar** em MX, TXT (SPF/DKIM/DMARC, `_railway-verify.*`), `demo.`, `app.`, `api.`.
5. Antes de virar: `TURNSTILE_SECRET_KEY` no Pages (sem ela a Function responde 503 no domínio próprio — falha fechado) e `PUBLIC_TURNSTILE_SITE_KEY` como _variable_ do GitHub + novo build.
6. Validar: `curl -sI https://logikosvision.com.br` (200 do Pages, sem `X-Robots-Tag`), `/sitemap-index.xml`, envio de formulário real, `MX` inalterado (`dig MX`).
7. **Rollback:** remover o custom domain no projeto Pages e restaurar os registros do passo 1 (A/CNAME do apex e `www`). TTL baixo (300 s) no dia da troca encurta a janela.

## Achados fora do escopo (somente leitura — reportados, não corrigidos)

- 🔴 **raptor serve modelo AGPL**: `config/modelos.yaml` nos branches mais novos aponta `epi_sh17_yolov8m_320.onnx` (YOLOv8/Ultralytics AGPL-3.0, dataset SH17 não comercial), enquanto o `NOTICE` diz "ZERO Ultralytics/AGPL no caminho servido". Risco de licença antes da feira.
- 🔴 **Recognition**: `demo.logikosvision.com.br` ainda publica "Recognition by CATH", `contato@epimonitor.com.br`, YOLOv8, "95%+ de precisão", "Mais de 12 câmeras" — e o modelo da demo no navegador é `yolov8n` (AGPL). Os deploys de 09/09 falham.
- 🟠 Railway `epi-monitor-v2`: Postgres e Redis de produção com **TCP proxy público** (`interchange.proxy.rlwy.net:10344`, `trolley.proxy.rlwy.net:35194`).
- 🟠 `leads-collector`: backup diário para o R2 falha (`Invalid character in header content ["authorization"]`); `app.` e `api.logikosvision.com.br` sem o TXT `_railway-verify` (certificado preso em ISSUING).
- 🟡 Recognition: credencial de admin padrão em texto em docs (`AGENTS.md`, `scripts/smoke_test.sh`, migração 040) — valores não reproduzidos aqui.

## Como continuar

1. Executar "Próximo comando" acima.
2. Conferir a primeira execução do CI em `main` (`gh run list -R logikos33/logikos-site`) e a URL de preview no resumo do job `deploy`.
3. Seguir as issues por label: `site` → `copy` → `brand` → `debt`.
