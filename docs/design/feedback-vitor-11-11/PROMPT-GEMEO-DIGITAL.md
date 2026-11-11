# Gêmeo digital da peça — prompts para aprovação (nada gerado)

Peça final: tela dividida em loop de 5 s. Esquerda = o real (Artlist). Direita = o gêmeo (código, cores da marca).

## Etapa 1 — Imagem (Z-Image Turbo, 2K, 16:9, ~40 créditos)

**Prompt (inglês, como vai para o Artlist):**

> Photorealistic industrial inspection station on a production line, three-quarter view from slightly above,
> static camera. A dark matte conveyor belt runs from left to right through a compact black metal gantry
> (inspection tunnel) mounted over the belt. On the belt, centered under the gantry, a single machined cast
> aluminum part (a pump housing with a round bore, flanges and bolt holes, bare metal, brushed finish) sits
> upright. Inside the gantry: two small industrial cameras with a thin cyan LED ring, and one laser line
> scanner projecting a thin bright red laser line across the top surface of the part. A second identical part
> waits on the belt further back, slightly out of focus. On the side of the gantry facing the camera there is a
> clean, blank, smooth black rectangular nameplate (wide, about 3:1), evenly lit, completely empty, and the front
> flange of the part has a flat, smooth, blank area facing the camera. Clean modern factory background, softly blurred,
> cool neutral fluorescent light, subtle cyan accent light on the gantry edges, dark tones overall, high
> contrast, sharp focus on the part and the laser line, shallow depth of field, 35 mm lens look.
> No people, no text, no logos, no labels, no screens with text, no watermark.

**Negative:** text, letters, numbers, logo, brand, watermark, people, hands, cartoon, CGI look, plastic toy,
oversaturated, neon city, rainbow colors, multiple laser colors, lens flare, motion blur on the part,
warped geometry, extra parts floating, messy background.

**Em português (para você revisar):** estação de inspeção numa linha de produção, vista 3/4 de cima, câmera
parada. Esteira escura da esquerda para a direita passando por um pórtico preto compacto. Sobre a esteira, uma
peça usinada de alumínio fundido (carcaça de bomba, com furo central, flanges e furos de parafuso), metal
escovado. No pórtico: duas câmeras industriais pequenas com anel de LED ciano e um scanner a laser projetando uma
linha vermelha fina sobre a peça. Outra peça igual esperando atrás, desfocada. Fábrica moderna ao fundo,
desfocada, luz fria, toque ciano da Logikos, tom escuro. Sem pessoas, sem texto, sem logos.

## Etapa 2 — Vídeo (Kling v3 Standard 720p, 5 s, imagem da etapa 1 como 1º e último quadro, ~400 créditos)

**Prompt:**

> Static locked-off camera, no camera movement. The conveyor belt moves slowly and steadily from left to
> right. The thin red laser line sweeps smoothly across the metal part from front to back, then fades, while
> the cyan LED rings on the two cameras pulse softly once, as if capturing. The part advances a few
> centimeters and the next part approaches from the back, so that the last frame matches the first frame for a
> seamless loop. Subtle realistic reflections of the laser on the brushed metal. Calm, precise, industrial
> mood. Keep the part shape, the gantry and the lighting exactly as in the reference image.

**Negative:** camera shake, zoom, pan, cuts, text, numbers, logos, people, hands, sparks, smoke, fire,
glitch, morphing part, changing shape, extra lasers, flashing strobe, rainbow colors.

**Em português:** câmera totalmente parada. A esteira anda devagar. A linha do laser varre a peça de frente para
trás e some; os anéis ciano das câmeras pulsam uma vez, como se fotografassem. A peça avança alguns centímetros e
a próxima se aproxima, para o último quadro bater com o primeiro (loop sem emenda). Reflexo realista do laser no
metal. Clima calmo e preciso. Manter peça, pórtico e luz iguais à imagem.

## Logo Logikos Vision na cena (pedido do Vitor)

IA de imagem deforma logos, então a cena sai com **espaços lisos reservados** (placa preta no pórtico e a área
plana da flange) e o **logo oficial** (`abertura-lockup.svg`, lockup aprovado) entra por cima com a perspectiva da
cena:
- **Placa do pórtico:** LOGIKOS VISION em branco, como impresso na placa (principal, bem legível).
- **Flange da peça:** gravação a laser discreta (tom de metal mais escuro), pequena — "a peça já sai marcada".
No vídeo (etapa 2), a placa e a peça estão no 1º/último quadro; a placa fica parada (logo segue nítido) e a
gravação da peça acompanha o movimento — se a IA deformar a peça com o logo, o logo da peça entra no código.

## Lado direito — o gêmeo (no código, sem Artlist)

Sincronizado com a varredura do laser, sobre fundo escuro com a textura de TV do site:
1. Pontos ciano aparecem na ordem da varredura (de frente para trás) formando a nuvem da peça.
2. A nuvem fecha numa malha (wireframe) ciano.
3. Mapa de desvio em cor sobre a malha: verde (dentro da tolerância), um ponto amarelo na flange.
4. Ficha: "Peça #A-10482 · Linha 2 · 14:32:08 · desvio máx. 0,12 mm · tolerância 0,20 mm · ✓ Conforme".
5. A cada loop o número da peça avança (A-10483…), e de vez em quando uma sai "Fora de tolerância" em vermelho.

Valores são de exemplo (marcados como demonstração). Parado com movimento reduzido.

## Pontos para você complementar

- **Peça:** carcaça de bomba de alumínio (ligada ao cenário de Qualidade) — ou prefere outra (engrenagem, eixo,
  peça plástica injetada, caixa/embalagem, chapa estampada)? Tem alguma peça real de cliente que dá para imitar?
- **Sensores:** 2 câmeras + 1 linha de laser vermelha. Quer mais câmeras, laser verde/azul, ou um sensor que gire?
- **Ângulo:** 3/4 de cima. Prefere lateral, de cima (vista de câmera de teto) ou mais cinematográfico?
- **Ficha do gêmeo:** quais dados mostrar (dimensão, peso, lote, cliente, foto da peça, código de rastreio, QR)?
- **Cor:** ciano Logikos para o digital e vermelho só no laser — ok?

## Para executar (sessão com o Artlist conectado)

1. `generate_image` (Z-Image Turbo, modelGroupId 329, 2K, 16:9) com o prompt da Etapa 1 (incluindo a placa e a área
   lisa da flange), pasta Artlist "Cloud Vision · cenários" (folderId 01a1c749-a057-70c8-a993-80e28553aacf).
   Cotar antes com get_generation_cost; custo esperado 40.
2. Baixar (imgix w=1280) em `~/Documents/Logikos/Marca/oficial/vision/v2/gemeo/` e aplicar o logo oficial
   (`~/logikos/cvw-wt/unificada/src/brand/logikos/assets/abertura-lockup.svg` → PNG branco) por transformação de
   perspectiva: placa do pórtico (branco, legível) e gravação discreta na flange (tom de metal escuro). Mostrar ao
   Vitor. Se a cena não tiver a placa/área lisa, refazer uma vez (+40) antes de compor.
3. Só com o ok do Vitor: vídeo Kling v3 Standard 720p (modelId 3143), 5 s, startFrame = endFrame = imagem aprovada
   (já com o logo da placa), prompt da Etapa 2; custo esperado 400.
4. Lado direito (gêmeo) em código e integração no site: agente da worktree `site-rodada-2-paginas` (PR #48).
