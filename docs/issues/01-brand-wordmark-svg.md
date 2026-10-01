---
title: 'brand: trocar o wordmark provisório pelo SVG oficial do Manual da Marca'
labels: [brand, site]
---

**Hoje:** o wordmark é texto "LOGIKOS" em Space Grotesk 700, tracking .16em (o mesmo lockup do Recognition `develop`, `apps/frontend/src/app/acesso/Marca.tsx`). Não tem o L no ângulo do Λ nem o O-fechadura. O monograma (favicon) é o Λ vazado no círculo de `docs/design/handoff-f5/lk-loader.js`.

**Por quê:** nenhum repositório tem o wordmark em vetor; o board do Miro "LOGIKOS — Manual da Marca" (uXjVH5gqWPE=) tem um único item, um embed "Imported HTML", que o MCP não expõe.

**Para fechar:**

- [ ] Vitor envia o SVG do wordmark, do símbolo (Λ no círculo) e do monograma sólido (ou o HTML/URL de origem do embed).
- [ ] Decidir o monograma canônico: Λ no círculo (skill de marca, `logikos_simbolo.png`) × fechadura no círculo (`Marca.tsx` do app).
- [ ] Substituir `src/components/Logo.astro`, `scripts/gen-icons.mjs` (favicon/touch icon) e `src/lib/og.ts`.
- [ ] Ajustar as fatias do glitch (`BrandBox.astro`) para não cortar a fechadura do O no desenho real.
- [ ] Informar o ângulo do Λ em graus; o grid grego usa 68° provisoriamente.
