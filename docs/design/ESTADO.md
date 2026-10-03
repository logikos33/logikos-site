# ESTADO — site v2.1 (auditoria sem anestesia + correção)

Atualizado em 03/10/2026, fim da rodada v2.1. **O prompt de continuação lê este arquivo primeiro**, depois [`AUDITORIA-V2.md`](AUDITORIA-V2.md) (a auditoria e a re-auditoria, com a lista única F-01…F-25), [`PLANO-V2.md`](PLANO-V2.md) e [`BENCHMARK.md`](BENCHMARK.md).

## Depende do Vitor (nesta ordem — nada disto é código)

| #   | O quê                                                       | Destrava                                                                                                                                                                                                              | Como                                                                                                                                                                                                                                                                                                                          |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Mídia real** — licença das fotos/vídeos ou a chave RunPod | F-03, F-16 e a dimensão _prova_ (1–3/10 em todas as páginas, a única que nenhum PR mexeu). Também responde de onde veio o vídeo do herói da demo de EPI (operários com capacete) e se pode ser reaproveitado no site. | (a) chave em `logikos-media/.env` (issue [#18](https://github.com/logikos33/logikos-site/issues/18)) para gerar os clipes; ou (b) autorizar o download de fotos com licença permissiva (Pexels/Unsplash, sem rosto, sem cliente) para os posters rotulados "ilustração"; ou (c) um clipe gravado na planta-piloto, sem rosto. |
| 2   | **Turnstile + WhatsApp**                                    | F-06: hoje o site mostra o aviso "formulário em configuração" com e-mail e WhatsApp e esconde o formulário em produção; com as chaves, o formulário volta sozinho.                                                    | `TURNSTILE_SECRET_KEY` no Pages, `PUBLIC_TURNSTILE_SITE_KEY` e `PUBLIC_WHATSAPP_NUMBER` como variables do GitHub (issues [#5](https://github.com/logikos33/logikos-site/issues/5), [#6](https://github.com/logikos33/logikos-site/issues/6)).                                                                                 |
| 3   | **Conta demo do Recognition**                               | Screenshots reais do painel em `/plataforma` e `/integradores` ("painel na sua marca") — F-08, F-16.                                                                                                                  | Um login de demonstração sem dados de cliente (issue `platform`, abaixo).                                                                                                                                                                                                                                                     |
| 4   | **DNS**                                                     | F-07: `canonical`, `og:url` e sitemap apontam para `logikosvision.com.br`, que não responde; `pages.dev` é `noindex` (SEO 66 no Lighthouse de produção).                                                              | Cutover (issue [#10](https://github.com/logikos33/logikos-site/issues/10)).                                                                                                                                                                                                                                                   |
| 5   | **Domínios do Railway**                                     | F-09: "Entrar" e as demos apontam para `*.up.railway.app`.                                                                                                                                                            | `app.`/domínios das demos (issue [#19](https://github.com/logikos33/logikos-site/issues/19)); a troca no site é uma linha em `src/config/links.ts`.                                                                                                                                                                           |

## Situação em uma tela

|                    |                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nota dos auditores | **4,3/10 → ver §9 de `AUDITORIA-V2.md`** (re-auditoria pelos mesmos dois auditores, mesma rubrica). O que ficou abaixo de 8 está separado em "código" e "Vitor" lá.                                                                                                                                                                 |
| No ar              | Produção `https://logikos-site.pages.dev` = `main` (PR-A, PR-B e PR-D em `main`; PR-E em CI; PR-F = este ESTADO + re-auditoria). Domínio `logikosvision.com.br` intocado (#10).                                                                                                                                                     |
| Marca              | **Vetores oficiais** (`src/lib/brand.ts`, de `Marca/oficial/`): wordmark com L a 68,3° e O-fechadura em header/capa/404/`/_marca`, símbolo no rodapé/favicon/OG, monograma só ≤ 24 px; glitch de entrada no wordmark do header da home, uma vez por sessão. Teste de regressão `tests/e2e/brand.spec.ts`. Decisão 0026.             |
| Heróis             | Home: figura primeiro (celular) e H1 de comprador; `/recognition` abre com o estágio das cinco leituras; `/como-funciona` com o pipeline; `/demos` com os botões reais e o estado ao vivo; `/plataforma` com tabela de comparação e "Entrar"; `/integradores` com o ganho do canal. Slogan oficial no rodapé e no OG; a glosa saiu. |
| HUD                | Chips nunca fora do estágio nem um sobre o outro (`placeChips`, no poster e na overlay); selo "simulação" na legenda; poster como `<img>` (veredito sem JS, `-plain` sob a overlay); botão de 44 px; moldura visível no escuro.                                                                                                     |
| Mídia              | **Ainda mock** em todos os slots — o único bloco da auditoria que não mexeu (depende do Vitor, item 1). O `<img>` do poster já é o lugar da foto real.                                                                                                                                                                              |
| Formulário         | Fail-closed na UI: aviso com e-mail/WhatsApp em produção até as chaves (item 2); previews e e2e com o formulário. Checkboxes 24 px / linhas 44 px.                                                                                                                                                                                  |
| Performance        | Fontes subsetadas 111 → 74 KB; HTML de `/recognition` 100 → 83 KB; Lighthouse local home 98 / recognition 99, LCP 2,0–2,1 s (elemento = poster), CLS 0; peso 213 → 177 KB.                                                                                                                                                          |
| Qualidade          | unit 73, e2e 76 (+ `brand.spec`), gates i18n (517 chaves) / texto / licença / números, `astro check` 0, CSP sem `unsafe-inline`.                                                                                                                                                                                                    |

## PRs desta rodada (v2.1)

| PR                                                       | O quê                                                                                                               | Estado                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [#25](https://github.com/logikos33/logikos-site/pull/25) | PR-A — auditoria: dois auditores, rubrica 7 × 12, 15 pares, 12 afirmações, lista F-01…F-25                          | merged                                      |
| [#26](https://github.com/logikos33/logikos-site/pull/26) | PR-B — marca em vetor, herói, chips no estágio, zero controle falso                                                 | merged                                      |
| [#27](https://github.com/logikos33/logikos-site/pull/27) | PR-D — copy de comprador, herói por página, listas, formulário fail-closed (+ correções da re-auditoria)            | merged                                      |
| [#38](https://github.com/logikos33/logikos-site/pull/38) | PR-E — fontes subsetadas, poster `<img>`, HUD sem reflow (o #28 foi fechado pelo GitHub ao apagar o branch do PR-D) | em CI                                       |
| [#37](https://github.com/logikos33/logikos-site/pull/37) | PR-F — re-auditoria + este ESTADO + issues                                                                          | este PR                                     |
| PR-C                                                     | mídia real                                                                                                          | **não começou** — depende do Vitor (item 1) |

Rodada v2 (anterior): #14, #15, #16, #17, #24 merged.

## Divergências consolidadas — o prompt dizia · o sistema diz · segui

| O prompt dizia                                       | O sistema diz                                                                                                         | Segui                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| v2.1 — chips sobrepostos por poster + overlay        | O poster some com `data-state`; a sobreposição era dois chips docados no mesmo `y` (pessoa + capacete)                | `placeChips` no poster e na overlay (PR-B)                                              |
| v2.1 — "campo de câmeras 375×23 px"                  | É o honeypot `website` do formulário (`tabindex=-1`, fora da tela), não um campo de usuário                           | Fora da lista; checkboxes 24 px (PR-D)                                                  |
| v2.1 — "3 / 7–9 chips fora do estágio"               | O contador somava chips ocultos do poster; em repouso eram 1 / 1 (errata em `AUDITORIA-V2.md` §7.1)                   | Script corrigido; agora 0 (PR-B)                                                        |
| v2.1 — capturar as demos com câmera falsa            | Com `--use-fake-device-for-media-stream` a demo vê um padrão verde ("vaso sanitário 54 %"): prova a UI, não o produto | Capturas descartadas; mídia real depende do Vitor (item 1)                              |
| v2.1 — CSS crítico por página                        | Dividir o CSS depois do build quebra os hashes do CSP (`security.csp`)                                                | Inline mantido; issue #31                                                               |
| `Base.css`, componente `HomeView`                    | `tokens.css` + `global.css`; `HomeView` é view                                                                        | O que existe                                                                            |
| Demo de EPI = landing em `demo.logikosvision.com.br` | Landing "Recognition by CATH", deploy quebrado desde 09/09, `yolov8n` (AGPL) no navegador                             | Linko a demo com marca Logikos (`recognition-demo-evento`, YOLOX Apache)                |
| Demo de fogo roda num Jetson via tunnel              | Roda no navegador do visitante (YOLOX-s ONNX); sem `/health`                                                          | Status por `HEAD /`; copy honesta                                                       |
| Login de produção                                    | Só `frontend-production-bf96.up.railway.app/login` responde; `app.` sem certificado; serviço builda de `staging`      | Linko a URL que funciona; issue #19                                                     |
| Cadastro self-service                                | `POST /api/auth/register` existe na API, sem tela                                                                     | Formulário de conta → operação libera por e-mail                                        |
| Reaproveitar `HudVideo` via prop `slot`              | Astro trata `slot="x"` num filho como slot nomeado (some sem erro)                                                    | Prop renomeada para `clip`                                                              |
| Webhook assinado                                     | HMAC só no callback de treino                                                                                         | "Webhook" sem "assinado"                                                                |
| Hover mostra o veredito no avatar (M3)               | Celular não tem hover                                                                                                 | Seletor de pose (rádios) move a figura; região fora do quadro = indeterminado, sem JS   |
| M4 por `IntersectionObserver`                        | Sem JS ficaria invisível                                                                                              | Script **arma**; sem JS/reduced-motion/estreito = estático                              |
| Chip "ok" com texto claro                            | 4,1:1 (reprova)                                                                                                       | Tinta escura sobre ok/warn; `--lk-warn` claro escurecido; teste de contraste por script |
| Lighthouse das 4 páginas                             | `lighthouserc` só media a home; servidor do LHCI dava 404 em `/recognition`                                           | `scripts/serve-dist.mjs` + rc com 12 URLs e piso 0,95                                   |

## Lighthouse mobile — antes → depois (mediana de 3 runs; antes = local, depois = **GitHub Actions**, run do PR-6)

| Página             | Perf antes → depois | A11y          | Best          | SEO           | Peso         |
| ------------------ | ------------------- | ------------- | ------------- | ------------- | ------------ |
| `/`                | 97 → **98**         | 100 → **100** | 100 → **100** | 100 → **100** | 177 → 213 KB |
| `/en/`             | 95 → **98**         | 100 → **100** | 100 → **100** | 100 → **100** | 177 → 213 KB |
| `/recognition`     | 97 → **98**         | 100 → **100** | 100 → **100** | 100 → **100** | 165 → 220 KB |
| `/en/recognition`  | 92 → **98**         | 100 → **100** | 100 → **100** | 100 → **100** | 165 → 220 KB |
| `/como-funciona`   | 98 → **99**         | 98 → **100**  | 100 → **100** | 100 → **100** | 144 → 151 KB |
| `/en/how-it-works` | 98 → **99**         | 98 → **100**  | 100 → **100** | 100 → **100** | 144 → 151 KB |
| `/integradores`    | 98 → **99**         | 100 → **100** | 100 → **100** | 100 → **100** | 159 → 163 KB |
| `/en/partners`     | 98 → **99**         | 100 → **100** | 100 → **100** | 100 → **100** | 159 → 163 KB |
| `/demos`           | — → **99**          | — → **100**   | — → **100**   | — → **100**   | — → 179 KB   |
| `/en/demos`        | — → **99**          | — → **100**   | — → **100**   | — → **100**   | — → 179 KB   |
| `/plataforma`      | — → **99**          | — → **100**   | — → **100**   | — → **100**   | — → 165 KB   |
| `/en/platform`     | — → **99**          | — → **100**   | — → **100**   | — → **100**   | — → 165 KB   |

**v2.1 (PR-E, local, mediana de 3 runs, `serve-dist`)**: `/` 98 · LCP 2,1 s (elemento = `img.hud__poster`) · CLS 0 · 177 KB (fontes 73 KB) · `/recognition` 99 · LCP 2,0 s · 174 KB · `/demos` 99–100 depois do chip em linha reservada (o herói com o chip de estado deu CLS 0,149 e 93 no primeiro CI do PR-D). Os números do CI entram aqui quando os PRs D e E passarem.

Regra do brief: regressão > 3 pontos é bug. Nenhuma; o primeiro run do CI deu 90–92 em `/` e `/recognition` (CSS bloqueante + deslocamento do botão do HUD e da troca de fonte) e foi corrigido no mesmo PR (CSS inline por página, botão reservado, fallbacks de fonte com métricas compatíveis, preload das três fontes). O job de Lighthouse do CI agora cobre as 12 páginas com piso 0,95 e falha o PR abaixo disso.

## Aceite (numerado) — onde está a prova

1. `AUDITORIA-V2.md` §1–§2: seções integrais dos dois auditores, sem edição; §3 rubrica por auditor e consolidada; §5 lista única F-01…F-25 com o PR de cada item; §6 quinze pares na mesma largura (`auditoria/pares/`); §7 doze afirmações com `arquivo:linha` (a 5ª derrubada como descrita); §9 re-auditoria pelos mesmos auditores.
2. Marca: `tests/e2e/brand.spec.ts` falha se o logo virar texto em qualquer rota; `tests/unit/brand.test.ts` confere o L, o O-fechadura e o currentColor; OG e favicons gerados do mesmo vetor (`og.ts`, `gen-icons.mjs`).
3. HUD: `tests/unit/hud.test.ts` (`placeChips`: clamp, colisão, bordas); `auditoria/pr-b/depois/metrics.json` com 0 chips fora em todas as páginas; capturas antes/depois a 360/390/768/1440 × claro/escuro.
4. Zero controle falso: `grep -rn "alert__option" src` = 0; o cartão diz "ilustrativo".
5. Heróis por página e copy: `auditoria/pr-d/depois/` (6 páginas × 2 larguras × 2 temas); `metrics.json` com 0 textos em caixa alta tracked-out e H1 sem a pergunta.
6. Formulário fail-closed: `LeadForm.astro` (aviso com e-mail/WhatsApp em host público com chave de teste); e2e `form.spec.ts` continua passando no preview.
7. Performance: fontes 111 → 74 KB (`scripts/subset-fonts.mjs`), poster `<img>` com variante `-plain`, `k` medido no resize; Lighthouse acima.
8. Gates verdes em todos os PRs: unit 73, e2e 76, `gate:i18n` (517 chaves em paridade, números documentados), `gate:text`, `gate:license`, `astro check` 0, prettier/eslint.
9. Decisão 0026 (marca em vetor) substitui a 0010; a 0017 (noindex no `pages.dev`) continua válida até o cutover.
10. Issues abertas com labels (tabela abaixo) e a lista "Depende do Vitor" no topo.

## Issues abertas nesta rodada

| #                                                          | Label    | Título                                                                            |
| ---------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| [#29](https://github.com/logikos33/logikos-site/issues/29) | media    | mídia real para os estágios — licença, clipe gravado ou chave RunPod (F-03, F-16) |
| [#30](https://github.com/logikos33/logikos-site/issues/30) | platform | conta demo do Recognition para screenshots do painel (F-08, F-16)                 |
| [#31](https://github.com/logikos33/logikos-site/issues/31) | perf     | CSS crítico sem quebrar o CSP; cartões de alerta por template (F-17 restante)     |
| [#32](https://github.com/logikos33/logikos-site/issues/32) | design   | pipeline a 390 perde o muro; dobra 64–80 rem (F-24)                               |
| [#33](https://github.com/logikos33/logikos-site/issues/33) | copy     | revisão humana PT/EN do texto v2.1                                                |
| [#34](https://github.com/logikos33/logikos-site/issues/34) | a11y     | leitor de tela na nova ordem do herói, leituras roláveis e tabela de comparação   |
| [#35](https://github.com/logikos33/logikos-site/issues/35) | brand    | validar o lockup no OG (WhatsApp/LinkedIn) e o símbolo a 16 px                    |

Continuam abertas: #5 (Turnstile), #6 (WhatsApp), #10 (DNS), #18 (RunPod), #19 (leads-collector / `app.`), #20–#23 (rodada v2), #7–#9, #11.

## Gates do Vitor

Ver a tabela "Depende do Vitor" no topo: mídia (#29/#18) → Turnstile e WhatsApp (#5, #6) → conta demo (#30) → DNS (#10) → domínios (#19).

## Como continuar

```sh
git clone https://github.com/logikos33/logikos-site.git && cd logikos-site
corepack enable && pnpm install
pnpm build && pnpm test:unit && pnpm gate:i18n && pnpm gate:text
node scripts/serve-dist.mjs 8787 &      # LHCI e screenshots
pnpm lhci                                # 12 páginas × 3 runs, piso 0,95
PW_PORT=8788 pnpm test:e2e               # wrangler pages dev + KV local
node scripts/shots.mjs docs/design/baseline/depois http://127.0.0.1:8787
WIDTHS=360,390,768,1440 PAGES=home,recognition node scripts/audit-capture.mjs docs/design/auditoria/<pasta> http://127.0.0.1:8787   # capturas + metrics.json
node scripts/audit-keyboard.mjs docs/design/auditoria/<pasta>/keyboard.json http://127.0.0.1:8787
node scripts/subset-fonts.mjs       # só quando os dicionários ganharem caracteres novos
```

Próxima rodada: PR-C (mídia real) assim que o item 1 da tabela do topo for decidido — a foto entra no `src` do `img.hud__poster` e o vídeo no slot `video` de `src/data/media.ts`; depois as issues por label `platform` → `perf` → `copy` → `design` → `a11y` → `brand`.
