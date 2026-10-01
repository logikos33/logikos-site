---
title: 'copy: vídeos da feira + JSON de detecções reais nos 5 slots de HUD'
labels: [copy, site]
---

Slots: `hero`, `epi`, `fire`, `twins`, `robotics` (`src/data/media.ts`). Hoje cada um mostra pôster gerado + HUD em modo `mock` (selo "simulação").

- [ ] Subir os MP4 (H.264, sem áudio, ≤ 8 s) para o R2 atrás de `media.logikosvision.com.br`; definir `PUBLIC_MEDIA_BASE_URL`.
- [ ] Preencher `video` de cada slot em `src/data/media.ts`.
- [ ] Gravar o JSON de cada clipe no formato `logikos.site.hud/1` (frames = `logikos.vision.frame/1` do raptor + `t` em segundos), com `"source": "raptor"`; o selo "simulação" some sozinho.
- [ ] ⛔ Sem rosto identificável nos clipes (trava LGPD do conteúdo, Notion Marketing & GTM).
