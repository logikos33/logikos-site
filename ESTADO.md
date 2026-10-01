# ESTADO — logikos-site

Atualizado em 01/10/2026, fim da rodada 1 ("nascimento do site"). **O prompt de continuação lê este arquivo primeiro.**

## Situação em uma tela

|           |                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código    | Site completo: 20 páginas (10 PT + 10 EN) + 404 + `/_marca`, formulário com Pages Function, CI completo.                                                                                                |
| Onde está | **GitHub `logikos33/logikos-site`** (privado), criado pelo Vitor em 01/10 depois do 403 da integração; `main` recebeu o histórico completo da rodada (`7db0fb8`). A partir daqui: branches curtas + PR. |
| CI        | **Verde em `main`** na primeira execução (run #1, `7db0fb8`): qualidade, gitleaks, Playwright 55/55 sem nada pulado, Lighthouse e deploy (pulado por falta de secrets).                                 |
| No ar     | **Nada ainda.** Faltam os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`; o job `deploy` registra "deploy skipped (gate: Vitor)" e fica verde.                                                |
| Domínio   | `logikosvision.com.br` e `demo.logikosvision.com.br` **intocados**.                                                                                                                                     |
| Issues    | #1–#11 abertas (labels `site` · `copy` · `brand` · `debt`). A do Recognition (`docs/issues/recognition-contrato-leads.md`) ainda precisa ser aberta lá: esta sessão não tem push no Recognition.        |

### Próximo comando (Vitor, nesta ordem)

```sh
# 1. secrets do repo (Settings → Secrets and variables → Actions):
#    CLOUDFLARE_API_TOKEN  (Account › Cloudflare Pages: Edit · Account › Workers KV Storage: Edit)
#    CLOUDFLARE_ACCOUNT_ID
# 2. re-rodar o CI de main (Actions → CI → Re-run) ou fazer merge de qualquer PR
# 3. abrir a issue do contrato no Recognition:
./scripts/open-issues.sh logikos33/Recognition docs/issues/recognition-contrato-leads.md
```

Com os secrets, o CI cria o projeto Pages `logikos-site`, os KV `leads-site` e `leads-site-preview`, e publica em `https://logikos-site.pages.dev` (sem domínio custom). Cada PR publica em `pr-<n>.logikos-site.pages.dev`.

⚠️ Em produção (`logikos-site.pages.dev`) o formulário **fica fechado** (503 com mensagem de e-mail) até existir `TURNSTILE_SECRET_KEY` real — decisão de segurança (issue #5). Nos previews de PR ele funciona com a chave de teste e grava em `leads-site-preview`.

## Divergências — o prompt dizia · o sistema diz · segui

| O prompt dizia                                                       | O sistema diz                                                                                                                                                            | Segui                                                                                          | Por quê                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Criar `logikos33/logikos-site` via `gh repo create`                  | `gh` sem token válido; GitHub MCP `create_repository` → 403                                                                                                              | Repo local com histórico próprio, pronto para push                                             | Fora do alcance desta sessão → gate                                                                     |
| `logikosvision.com.br` serve a landing do Recognition                | A landing (`epi-monitor-v2/landing-page`, Recognition `main`) está em **`demo.`**; apex e `www` não estão em nenhum serviço Railway                                      | Cutover documentado sem assumir o que o apex serve                                             | DNS/HTTP externos bloqueados pelo proxy                                                                 |
| `demo.` aponta para Railway                                          | Sim (CNAME exigido `wp8nee59.up.railway.app`), mas o Railway vê o CNAME vazio (`REQUIRES_UPDATE`) — indício de registro proxied na Cloudflare                            | Não tocar                                                                                      | Trava                                                                                                   |
| Landing do Recognition no ar com o código atual                      | No ar está o commit `8aa6a1a` (05/09, Astro 4.16.19); os deploys de 09/09 (Astro 7) **falharam** (`ERESOLVE`)                                                            | —                                                                                              | Achado para o Recognition                                                                               |
| Contrato do `recognition-leads`                                      | `recognition-leads` é um stub com deploy falho; quem recebe é o `leads-collector`, publicado por `railway up` **sem fonte**; contrato desconhecido                       | Function encaminha só com `LEADS_API_URL`+`LEADS_API_KEY`; senão KV                            | Brief: não alterar o Recognition; issue com o contrato pronta (push no Recognition negado nesta sessão) |
| Wordmark em SVG em algum repo                                        | Não existe. Recognition `develop` tem dois monogramas em SVG (Λ e fechadura); o wordmark é **texto**; o board do Miro é um embed HTML ilegível                           | Wordmark em texto (lockup do app) + monograma Λ oficial; issue `brand`                         | Melhor que PNG: nítido, dois temas, 0 KB                                                                |
| Formato do HUD `{t, boxes:[…]}`                                      | O raptor tem `logikos.vision.frame/1` (bbox `[x0,y0,x1,y1]`, 3 estados, rótulo nunca vem do edge)                                                                        | Formato do raptor + `t` (decisão 0008)                                                         | Ordem do brief                                                                                          |
| satori + resvg são MIT                                               | São **MPL-2.0** (build-time)                                                                                                                                             | Mantive                                                                                        | MPL-2.0 está na allowlist; o PNG não carrega código                                                     |
| Astro "estável atual"                                                | `7.3.5`; `@astrojs/check` exige TS 5/6 (TS `latest` é 7.0.2)                                                                                                             | Astro 7.3.5 + TS 6.0.3                                                                         | Compatibilidade                                                                                         |
| Zona DNS na Cloudflare; MX/SPF/DMARC (Titan)                         | **Não verificado** (bloqueado daqui; nada no Notion)                                                                                                                     | Runbook manda fotografar os registros antes                                                    | —                                                                                                       |
| "parceira NVIDIA (Jetson)"                                           | Nada comprova programa de parceria NVIDIA                                                                                                                                | Texto diz "NVIDIA Jetson" (plataforma)                                                         | Termo "parceira" exige programa; issue `copy`                                                           |
| "licença por prazo de 24 meses"                                      | Notion (20/08): "contrato anual por câmera/módulo"                                                                                                                       | Segui o brief (mais recente)                                                                   | Confirmar na issue `copy`                                                                               |
| Formulário funciona sem as chaves do Turnstile                       | Sem domínio custom, produção também é `*.pages.dev`; aceitar a chave de teste por hostname deixaria o Turnstile contornável em produção (achado da revisão de segurança) | Produção falha fechado sem segredo real; previews usam a chave de teste explícita e KV próprio | Segurança > conveniência; reversível (decisão 0012)                                                     |
| Registro no Notion "Logikosvision → Prompts & Execuções", tag `site` | O DB está em "🎯 Recognition — Governança do Projeto" (privado), **sem propriedade de tag**                                                                              | EX criado no DB existente com `[site]` no título                                               | Única base de execuções                                                                                 |

## O que está provado (evidência reproduzível)

| Aceite                                                                     | Status                                                                                                                                                                                                                                                                              | Evidência                                                                                                                                                  |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. CI verde em `main`; gate de licença provado falhando e passando         | ✅ CI verde em `main` (Actions run #1, 01/10/2026). Gate provado                                                                                                                                                                                                                    | https://github.com/logikos33/logikos-site/actions/runs/36932038066 · `docs/provas/gate-licenca.md`                                                         |
| 2. `*.pages.dev` com 20 páginas; sitemap com alternates; hreflang sem erro | ⚠️ Sem URL. Local (wrangler pages dev): 20 páginas 200, sitemap 20 × 3 alternates, hreflang recíproco                                                                                                                                                                               | `tests/e2e/routes.spec.ts`, `tests/e2e/seo.spec.ts`                                                                                                        |
| 3. Claro por padrão; toggle persiste; axe sem violação nos dois temas      | ✅ Local                                                                                                                                                                                                                                                                            | `tests/e2e/theme.spec.ts`: axe WCAG 2.1 A/AA nas 20 páginas × 2 temas = 0 violações (anexos `axe-light.json`, `axe-dark.json`)                             |
| 4. Glitch uma vez; não roda com reduced-motion (Playwright + screenshot)   | ✅ Local                                                                                                                                                                                                                                                                            | `tests/e2e/motion.spec.ts` (anexos `glitch-mid.png`, `glitch-rest.png`, `glitch-reduced-motion.png`) + teste geométrico de que as fatias não cruzam os "O" |
| 5. Sem Turnstile → rejeitado; válido → provado por KV; nada em log         | ✅ No CI (wrangler pages dev + KV local + siteverify real com a chave de teste): rejeição sem token; os dois envios válidos (`/contato`, `/en/partners`) aparecem em `wrangler kv key list` e não aparecem no log. ⚠️ Falta repetir num preview `*.pages.dev` (depende dos secrets) | `tests/e2e/form.spec.ts`, `tests/unit/lead.test.ts`                                                                                                        |
| 6. Lighthouse CI mobile, home PT e EN                                      | ✅ Local: **98 / 100 / 100 / 100** (perf / a11y / best-practices / SEO); home 133 KB                                                                                                                                                                                                | `pnpm lhci`                                                                                                                                                |
| 7. Gate de texto proibido; zero número não documentado                     | ✅                                                                                                                                                                                                                                                                                  | `pnpm gate:text` (20 regras PT+EN, entidades decodificadas); `pnpm gate:i18n` (números por chave)                                                          |
| 8. ESTADO.md commitado                                                     | ✅                                                                                                                                                                                                                                                                                  | este arquivo                                                                                                                                               |

Última rodada local completa (`main`, após as correções da revisão): `astro check` 0 erros · ESLint + Prettier ok · unit **45/45** · gates de licença, texto e i18n (fonte + HTML) ok · Playwright **55 passaram, 2 pulados** (caminho feliz do formulário, sem egress para `challenges.cloudflare.com`; no Actions não pula) · Lighthouse acima dos limiares · gitleaks sem vazamento no histórico.

## Revisão adversarial desta rodada

Cinco revisores independentes (marca, copy/compliance, segurança, corretude/a11y/SEO, CI) leram o repositório e rodaram build/testes numa cópia. **59 achados**; os procedentes foram reproduzidos e corrigidos com teste novo. A fase automática de verificação foi interrompida (≈60 agentes a 2 por vez); cada achado foi checado manualmente contra o código antes de corrigir. Principais correções:

- **Segurança:** produção falha fechado sem segredo do Turnstile (inclusive em `pages.dev`); previews com KV separado; `hostname`/`action` do Turnstile validados; corpo não-objeto, falha de KV, CR/LF e bidi em campos de uma linha, `pagina` só caminho local, limite em bytes; secrets só nos passos de deploy; branch de deploy derivada do evento.
- **Marca/a11y:** ícones duplicados (escopo de CSS do Astro), estado do formulário em cor + ícone + palavra, erro por campo, borda de campo ≥ 3:1, glitch só depois da fonte, grid grego fora de vereditos, wordmark do header ≥ 90 px, HUD com botão Parar (WCAG 2.2.2), menu móvel fecha com Esc, sem rolagem horizontal a 320 px.
- **Copy:** nuvem ("o vídeo contínuo fica na planta"), CTA sem número de WhatsApp vira "Falar com a equipe", etimologia de ΛΟΓΙΚΟΣ, rótulos do HUD por item/motivo, política de privacidade mais completa (provisória).
- **Ferramental:** parser SPDX com precedência, licenças por versão, gate de texto em EN, gates de i18n sobre `data-*`, meta e HTML construído, números por chave.

Mantidos após análise: "um único `dist` não serve preview e produção" — com a chave de site real, o segredo de teste dos previews aceita qualquer token; basta o widget listar `logikos-site.pages.dev` (issue 05) · "inferência na borda" na linha de prova — texto literal do brief · "sem trocar câmera" — posicionamento decidido pelo Vitor no Notion (20/08: "roda no CFTV existente"); validar na issue de copy.

## Inventário (bloco 0) — somente leitura, 01/10/2026

| Item                                    | Existe?                | Onde                                                                                                               | Reaproveitar?                                       |
| --------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Wordmark em SVG                         | Não                    | Recognition `develop` usa texto (`apps/frontend/src/app/acesso/Marca.tsx`); Miro `uXjVH5gqWPE=` = 1 embed HTML     | Lockup em texto; issue `brand`                      |
| Símbolo / monograma em SVG              | Sim (2 variantes)      | Recognition `develop`: `docs/design/handoff-f5/lk-loader.js` (Λ no círculo) e `Marca.tsx` (fechadura no círculo)   | Λ no favicon/rodapé; escolha final na issue `brand` |
| PNG de marca                            | Sim                    | Recognition `develop`: `docs/negocio/logikos_simbolo.png`, `logikos_logo_200.png`                                  | Referência                                          |
| HUD com caixas em colchete              | Não                    | raptor e fire-demo desenham retângulos inteiros                                                                    | Reimplementado limpo (`HudVideo.astro`)             |
| Formato de detecções do raptor          | Sim                    | raptor `main:docs/contratos/CONTRATO-EDGE-PAINEL-v1.md` §3                                                         | Adotado (decisão 0008)                              |
| Endpoint do recognition-leads           | Parcial                | Railway `recognition-leads/leads-collector` → `leads-collector-production.up.railway.app`; sem fonte, sem contrato | KV como fallback; issue no Recognition              |
| O que `demo.` serve                     | Landing do Recognition | Railway `epi-monitor-v2/landing-page`                                                                              | Não tocar                                           |
| O que o apex serve                      | Desconhecido           | Fora do Railway; DNS/HTTP bloqueados daqui                                                                         | Passo 1 do cutover                                  |
| MX/SPF/DMARC (Titan)                    | Desconhecido           | Bloqueado daqui; nada no Notion                                                                                    | Preservar no cutover                                |
| Cloudflare (conta, Pages, R2, wrangler) | Desconhecido           | `api.cloudflare.com` bloqueado; sem token                                                                          | Workflow pronto                                     |
| Node / pnpm / Astro                     | Sim                    | Node 22.22.0, pnpm 10.28.0, Astro 7.3.5                                                                            | Usados                                              |

## Decisões

Uma linha cada em [`docs/decisions/`](docs/decisions/) (0001–0025): o quê, por quê, como reverter.

## Issues

Abertas no GitHub como #1–#11 a partir dos rascunhos em [`docs/issues/`](docs/issues/): `brand` wordmark SVG · `copy` texto final · `copy` vídeos da feira · `site` leads API · `site` Turnstile · `site` WhatsApp oficial · `copy` validação jurídica · `debt` rate limit · `debt` retenção no KV · `site` cutover · `site` analytics · e **uma no Recognition** (contrato do `leads-collector`).

## Cutover de DNS (gate: Vitor) — passo a passo com rollback

Pré-requisitos: issues de Turnstile, WhatsApp e validação jurídica fechadas; preview aprovado.

1. **Fotografar o estado atual** (de uma máquina com rede livre) e colar na issue de cutover:
   ```sh
   for t in A AAAA CNAME NS MX TXT CAA; do echo "== $t"; dig +short logikosvision.com.br $t; done
   dig +short www.logikosvision.com.br CNAME; dig +short www.logikosvision.com.br A
   dig +short _dmarc.logikosvision.com.br TXT
   curl -sI https://logikosvision.com.br | head -5
   ```
2. **Zona na Cloudflare:** Pages → `logikos-site` → Custom domains → adicionar `logikosvision.com.br` (e `www`), **uma vez, pelo painel** — nunca por script em loop (precedente: religar domínio no Railway gerou alvo novo e derrubou a landing do evento).
3. **Zona fora da Cloudflare** (ex.: Registro.br): apex no Pages exige a zona na Cloudflare. Ou migra os NS (recriando **antes** MX/SPF/DKIM/DMARC do Titan e `demo.`, `app.`, `api.`), ou publica só `www` por CNAME e redireciona o apex no provedor atual.
4. ⛔ Não tocar em MX, TXT (SPF/DKIM/DMARC, `_railway-verify.*`), `demo.`, `app.`, `api.`.
5. Antes de virar: `TURNSTILE_SECRET_KEY` no Pages e `PUBLIC_TURNSTILE_SITE_KEY` como _variable_ do GitHub + novo build.
6. Validar: `curl -sI https://logikosvision.com.br` (200 do Pages, sem `X-Robots-Tag`), `/sitemap-index.xml`, envio real de formulário, `dig MX` inalterado.
7. **Rollback:** remover o custom domain do projeto Pages e restaurar os registros do passo 1. TTL de 300 s no dia da troca encurta a janela.

## Achados fora do escopo (somente leitura — reportados, não corrigidos)

- 🔴 **raptor serve modelo AGPL**: `config/modelos.yaml` nos branches mais novos usa `epi_sh17_yolov8m_320.onnx` (YOLOv8/Ultralytics AGPL-3.0, dataset SH17 não comercial), enquanto o `NOTICE` diz "ZERO Ultralytics/AGPL no caminho servido". Risco de licença às vésperas da feira.
- 🔴 **Recognition em `demo.`**: publica "Recognition by CATH", `contato@epimonitor.com.br`, YOLOv8, "95%+ de precisão", "Mais de 12 câmeras"; o modelo da demo no navegador é `yolov8n` (AGPL). Deploys de 09/09 falham.
- 🟠 Railway `epi-monitor-v2`: Postgres e Redis de produção com **TCP proxy público**.
- 🟠 `leads-collector`: backup diário para o R2 falha; `app.` e `api.logikosvision.com.br` sem TXT `_railway-verify` (certificado preso em ISSUING).
- 🟡 Recognition: credencial de admin padrão em texto em docs e numa migração (valores não reproduzidos).

## Como continuar

1. Executar "Próximo comando".
2. Conferir o primeiro CI em `main` (`gh run list -R logikos33/logikos-site`) e a URL no resumo do job `deploy`.
3. Seguir as issues por label: `site` → `copy` → `brand` → `debt`.
