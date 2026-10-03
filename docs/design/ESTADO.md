# ESTADO — site v2 (design, estrutura, motion, demos e plataforma)

Atualizado em 03/10/2026, fim da rodada v2. **O prompt de continuação lê este arquivo primeiro**, depois [`PLANO-V2.md`](PLANO-V2.md), [`BENCHMARK.md`](BENCHMARK.md), [`baseline/INVENTARIO.md`](baseline/INVENTARIO.md) e [`MEDIA-CONTRACT.md`](MEDIA-CONTRACT.md).

## Situação em uma tela

|            |                                                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No ar      | **Produção `https://logikos-site.pages.dev` já é a v2** (PRs #15 e #16 em `main`). PR-5 (#17) e PR-6 (fechamento) em revisão/CI. Domínio `logikosvision.com.br` intocado (issue #10)                                                                |
| Estrutura  | 24 páginas (12 × PT/EN) + 404 + `/_marca`: home em **seis perguntas**, Recognition, Como funciona, **Demos** (nova), **Plataforma** (nova), Integradores, Twins, Robótica, Sobre, LGPD, Contato, Privacidade. Nav com seis itens + **Entrar** + CTA |
| Signature  | **O veredito**: caixa de cantos + chip cor·ícone·palavra + legenda máquina \| pessoa, em repouso sem JS (poster) e com JS; um estágio com cinco leituras; card de alerta; avatar por região sem JS                                                  |
| Motion     | M1 (uma vez por sessão → HUD), M2, M3, M4, M5, M6, M7 no ar; `steps()` em tudo, nada contínuo, reduced-motion estático e completo                                                                                                                   |
| Demos      | `/demos` com estado ao vivo via `/api/status` (cache 60 s, sondas no servidor), fallback com o quadro/poster; links para `recognition-demo-evento` (EPI, marca Logikos) e `fire-demo` (fogo)                                                        |
| Plataforma | Edge e Nuvem sem preço; **Criar conta** = formulário `kind: account` (câmeras, modo) → `/api/lead`; **Entrar** → login de produção do Recognition                                                                                                   |
| Mídia      | **Mock** em todos os slots (badge "simulação"). Gerador pronto em `logikos33/logikos-media`, parado no gate `RUNPOD_API_KEY` (issue #18)                                                                                                            |
| Qualidade  | Lighthouse ≥ 95 nas 12 páginas (tabela abaixo), axe 0 violações em 24 páginas × 2 temas, CSP sem `unsafe-inline`, `connect-src 'self'`, gates de i18n/texto/licença/números, 72 e2e + 66 unit                                                       |

## PRs desta rodada

| PR                                                       | Blocos                                                                      | Estado                                   |
| -------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| [#14](https://github.com/logikos33/logikos-site/pull/14) | 0 + 1 + 2 — inventário, baseline, benchmark, plano                          | merged                                   |
| [#15](https://github.com/logikos33/logikos-site/pull/15) | 3 + 6 — estrutura, veredito, copy PT/EN, Demos e Plataforma                 | merged                                   |
| [#16](https://github.com/logikos33/logikos-site/pull/16) | 4 — motion M1/M3/M4 (+M5)                                                   | merged                                   |
| [#17](https://github.com/logikos33/logikos-site/pull/17) | 7 — `/api/status`, M7, formulário de conta                                  | aberto (CI)                              |
| PR-6                                                     | 8 — Lighthouse nas 12 páginas, gate `{{`, antes/depois, issues, este ESTADO | aberto                                   |
| PR-4                                                     | 5 — mídia real                                                              | **não começou** (gate RunPod, issue #18) |

## Divergências consolidadas — o prompt dizia · o sistema diz · segui

| O prompt dizia                                       | O sistema diz                                                                                                    | Segui                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Base.css`, componente `HomeView`                    | `tokens.css` + `global.css`; `HomeView` é view                                                                   | O que existe                                                                            |
| Demo de EPI = landing em `demo.logikosvision.com.br` | Landing "Recognition by CATH", deploy quebrado desde 09/09, `yolov8n` (AGPL) no navegador                        | Linko a demo com marca Logikos (`recognition-demo-evento`, YOLOX Apache)                |
| Demo de fogo roda num Jetson via tunnel              | Roda no navegador do visitante (YOLOX-s ONNX); sem `/health`                                                     | Status por `HEAD /`; copy honesta                                                       |
| Login de produção                                    | Só `frontend-production-bf96.up.railway.app/login` responde; `app.` sem certificado; serviço builda de `staging` | Linko a URL que funciona; issue #19                                                     |
| Cadastro self-service                                | `POST /api/auth/register` existe na API, sem tela                                                                | Formulário de conta → operação libera por e-mail                                        |
| Reaproveitar `HudVideo` via prop `slot`              | Astro trata `slot="x"` num filho como slot nomeado (some sem erro)                                               | Prop renomeada para `clip`                                                              |
| Webhook assinado                                     | HMAC só no callback de treino                                                                                    | "Webhook" sem "assinado"                                                                |
| Hover mostra o veredito no avatar (M3)               | Celular não tem hover                                                                                            | Seletor de pose (rádios) move a figura; região fora do quadro = indeterminado, sem JS   |
| M4 por `IntersectionObserver`                        | Sem JS ficaria invisível                                                                                         | Script **arma**; sem JS/reduced-motion/estreito = estático                              |
| Chip "ok" com texto claro                            | 4,1:1 (reprova)                                                                                                  | Tinta escura sobre ok/warn; `--lk-warn` claro escurecido; teste de contraste por script |
| Lighthouse das 4 páginas                             | `lighthouserc` só media a home; servidor do LHCI dava 404 em `/recognition`                                      | `scripts/serve-dist.mjs` + rc com 12 URLs e piso 0,95                                   |

## Lighthouse mobile — antes → depois (mediana de 3 runs, servidor estático local)

| Página             | Perf antes → depois | A11y          | Best          | SEO           | Peso         |
| ------------------ | ------------------- | ------------- | ------------- | ------------- | ------------ |
| `/`                | 97 → **95**         | 100 → **100** | 100 → **100** | 100 → **100** | 177 → 213 KB |
| `/en/`             | 95 → **95**         | 100 → **100** | 100 → **100** | 100 → **100** | 177 → 212 KB |
| `/recognition`     | 97 → **95**         | 100 → **100** | 100 → **100** | 100 → **100** | 165 → 219 KB |
| `/en/recognition`  | 92 → **95**         | 100 → **100** | 100 → **100** | 100 → **100** | 165 → 219 KB |
| `/como-funciona`   | 98 → **98**         | 98 → **100**  | 100 → **100** | 100 → **100** | 144 → 149 KB |
| `/en/how-it-works` | 98 → **98**         | 98 → **100**  | 100 → **100** | 100 → **100** | 144 → 149 KB |
| `/integradores`    | 98 → **98**         | 100 → **100** | 100 → **100** | 100 → **100** | 159 → 161 KB |
| `/en/partners`     | 98 → **98**         | 100 → **100** | 100 → **100** | 100 → **100** | 159 → 161 KB |
| `/demos`           | — → **97**          | — → **100**   | — → **100**   | — → **100**   | — → 178 KB   |
| `/en/demos`        | — → **98**          | — → **100**   | — → **100**   | — → **100**   | — → 177 KB   |
| `/plataforma`      | — → **98**          | — → **100**   | — → **100**   | — → **100**   | — → 164 KB   |
| `/en/platform`     | — → **98**          | — → **100**   | — → **100**   | — → **100**   | — → 164 KB   |

Regra do brief: regressão > 3 pontos é bug. A home perdeu ~2 pontos de performance (estágio + cinco cards de alerta); as outras páginas mantiveram ou subiram.

## Aceite (numerado) — onde está a prova

1. `docs/design/baseline/` — INVENTARIO (interno/externo com HTTP), Lighthouse antes, 48 screenshots `antes/`.
2. `BENCHMARK.md` — 10 referências, screenshots, roubar/evitar, ferramentas com fonte, 5 decisões.
3. `PLANO-V2.md` — tokens, escala, wireframes, proposta de valor por público, painel de 3 abordagens + 2 juízes, 13 trocas anti-genérico.
4. Home: 6 seções × 6 perguntas (`structure.spec.ts`); hero com HUD (vídeo **mock** até PR-4).
5. Estágio único com cinco leituras (`HudVideo readings`; `structure.spec.ts`).
6. 24 rotas, nenhuma removida (sem `301`), sitemap/hreflang (`routes.spec.ts`, `seo.spec.ts`), 404 PT/EN, OG por página.
7. M1–M7 na tabela do PR #16; reduced-motion e repouso provados em `motion.spec.ts`.
8. `grep src/`: `→` em link/botão 0 · `box-shadow` 0 · ciano como fundo de seção 0 (só `::selection`, quadrado do botão e rótulo da marca) · magenta fora do glitch 0 · `.eyebrow` só nas portas e no 404.
9. Mídia: `MEDIA-CONTRACT.md` completo; clipes **pendentes** (gate RunPod, issue #18); JSON com `source: "mock"` e badge visível.
10. `/demos`: duas demos, `/api/status`, fallback com quadro, links 200 (`demos.spec.ts`).
11. `/plataforma`: Edge e Nuvem sem preço; Criar conta (formulário) e Entrar (login real).
12. Paridade EN: 523 chaves, diff = 0 (`gate:i18n`).
13. Lighthouse ≥ 95 nas 12 páginas (tabela), CSP sem `unsafe-inline`.
14. Travas: `grep -ri` em `src/` para `RVB`, `câmeras em operação`, `cameras in operation`, `R$`, `lorem`, `{{` = 0; `identif` só em negações ("não identifica quem é a pessoa"); `TODO` (maiúsculo) = 0 — em minúsculas "todo" é português ("Todos os direitos reservados").
15. Este ESTADO com as issues abaixo.

## Issues abertas nesta rodada

| #                                                          | Label    | Título                                                                      |
| ---------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| [#18](https://github.com/logikos33/logikos-site/issues/18) | media    | gerar os clipes reais dos 9 slots e os posters com veredito (Bloco 5)       |
| [#19](https://github.com/logikos33/logikos-site/issues/19) | platform | ligar `/api/lead` ao leads-collector e destravar `app.logikosvision.com.br` |
| [#20](https://github.com/logikos33/logikos-site/issues/20) | copy     | revisar o texto novo PT/EN                                                  |
| [#21](https://github.com/logikos33/logikos-site/issues/21) | design   | polir a dobra do hero (64–80 rem) e auditar o tema escuro                   |
| [#22](https://github.com/logikos33/logikos-site/issues/22) | a11y     | passada manual com leitor de tela (estágio, avatar, chips)                  |
| [#23](https://github.com/logikos33/logikos-site/issues/23) | motion   | encadear o clipe real ao M1 e revisar tempos                                |

Continuam abertas da rodada 1: #1 (wordmark SVG), #2 (texto final), #3 (vídeos da feira), #4 (leads API), #5 (Turnstile — **produção fecha o formulário em 503 até a chave real**), #6 (WhatsApp), #7 (jurídico), #8 (rate limit), #9 (retenção KV), #10 (cutover DNS), #11 (analytics).

## Gates do Vitor (nesta ordem)

1. **Turnstile** (#5): `TURNSTILE_SECRET_KEY` no Pages + `PUBLIC_TURNSTILE_SITE_KEY` como variable do GitHub — sem isso `/contato`, `#parceria` e `#conta` ficam fechados em produção.
2. **RunPod** (#18): chave em `logikos-media/.env` → PR-4 (mídia real).
3. **leads-collector / app.** (#19): variáveis do Pages e domínio custom.
4. **Cutover** (#10): depois de #5, #6 e #7.

## Como continuar

```sh
git clone https://github.com/logikos33/logikos-site.git && cd logikos-site
corepack enable && pnpm install
pnpm build && pnpm test:unit && pnpm gate:i18n && pnpm gate:text
node scripts/serve-dist.mjs 8787 &      # LHCI e screenshots
pnpm lhci                                # 12 páginas × 3 runs, piso 0,95
PW_PORT=8788 pnpm test:e2e               # wrangler pages dev + KV local
node scripts/shots.mjs docs/design/baseline/depois http://127.0.0.1:8787
```

Próxima rodada: PR-4 (mídia) quando a chave existir; depois as issues por label `platform` → `copy` → `design` → `a11y` → `motion`.
