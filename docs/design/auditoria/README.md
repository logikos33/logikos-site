# Evidências da auditoria v2.1 (03/10/2026)

Tudo aqui foi capturado por script, para a re-auditoria da Fase B repetir o mesmo caminho.

| Pasta / arquivo                                                 | O que é                                                                                                    | Como reproduzir                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `logikos/<página>-<390\|1440>-<light\|dark>.jpg` e `*-fold.jpg` | Produção `logikos-site.pages.dev`, página inteira e primeira dobra                                         | `node scripts/audit-capture.mjs docs/design/auditoria/logikos https://logikos-site.pages.dev`                     |
| `logikos/metrics.json`                                          | DOM, `<img>`/`<video>`, peso por tipo, topo do 1º HUD, chips fora do estágio, textos uppercase             | idem (mesmo script)                                                                                               |
| `logikos/keyboard-prod.json`                                    | Ordem de tab, anel de foco, alvos < 44 px, menu móvel (Esc, foco), setas nas leituras, Enter no Reproduzir | `node scripts/audit-keyboard.mjs docs/design/auditoria/logikos/keyboard-prod.json https://logikos-site.pages.dev` |
| `logikos/lighthouse-prod.json`                                  | Lighthouse 12.x, mobile, uma página por vez                                                                | `npx lighthouse <url> --preset=... --output=json` (ver `lighthouserc.cjs` para as flags)                          |
| `benchmarks/<site>-<390\|1440>.jpg` + `benchmarks.json`         | 15 sites de referência: captura, Lighthouse (paralelo e sequencial), fatos da dobra                        | workflow `scratchpad/benchmarks.js` da sessão; os números sequenciais foram re-medidos um a um                    |
| `pares/<site>-<390\|1440>.jpg`                                  | Logikos à esquerda, benchmark à direita, mesma largura, 50 %                                               | script PIL inline (ver `AUDITORIA-V2.md` §6)                                                                      |

Regras: nenhuma captura é editada; a mesma largura vale para os dois lados de cada par; `framework` não foi medido (interstitial do Cloudflare).
