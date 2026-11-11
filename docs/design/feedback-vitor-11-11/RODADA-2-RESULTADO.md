# Rodada 2 do feedback de 11/11 — resultado

**Prévia:** https://pr-48.logikos-site.pages.dev/ · **PR:** https://github.com/logikos33/logikos-site/pull/48 (branch `logikos33/site-rodada-2-paginas`, já com o merge da rodada 1 / PR #47, sem conflito).

Itens 5 a 8 do [`FEEDBACK.md`](FEEDBACK.md). Prints antes/depois de 12 páginas em desktop 1440 e celular 390: [`rodada-2/antes/`](rodada-2/antes/) e [`rodada-2/depois/`](rodada-2/depois/) (mesmo nome de arquivo nas duas pastas).

## 5. Páginas do rodapé no padrão da home

| Página        | Herói (mídia real)                                                    | Fecho          |
| ------------- | --------------------------------------------------------------------- | -------------- |
| Recognition   | muro com os 5 canais + "CAM 07 · a sua" (→ demo do celular)           | monitor CAM 07 |
| Demos         | público da Fireshow 2026; botão "Teste na câmera do seu celular"      | monitor CAM 07 |
| Integradores  | muro com fogo, EPI, qualidade e contagem                              | monitor CAM 07 |
| Robótica      | Koda (não temos vídeo próprio de robô) + selo "Sob projeto"           | monitor CAM 07 |
| Sobre         | público da Fireshow 2026                                              | monitor CAM 07 |
| Como funciona | clipe de fogo + diagrama câmera → processamento → decisão logo abaixo | monitor CAM 07 |
| Plataforma    | clipe de contagem; "Pedir piloto" e "Entrar"                          | monitor CAM 07 |
| Twins         | Koda (não temos captura própria de nuvem de pontos)                   | monitor CAM 07 |
| LGPD          | só texto (página de leitura)                                          | —              |
| Contato       | Koda; os canais e o formulário são as ações                           | —              |
| Privacidade   | só texto                                                              | —              |
| Entrar        | login externo do Recognition (não é página do site; sem mudança)      | —              |

- Tema escuro em todo o site (sai o botão de tema); header, páginas e rodapé na largura da home.
- Mesmo par de CTAs da home em todo herói (Testar a experiência + Falar com especialista); o header esconde o dele enquanto o do herói está na tela.
- Saíram o HUD simulado com pôster SVG gerado e o boneco de EPI desenhado. Só ficaram mídias reais já registradas em `docs/provas/midia-home-v3.md` (Pexels com detecção real, Fireshow, Koda aprovado).
- Vídeos das páginas só baixam no primeiro gesto do visitante (os pôsteres já são quadros reais); Lighthouse mobile 97–99 em todas, 152–243 KB, CLS 0.

## 6. Nenhum nome de modelo, arquitetura ou hardware

FireSet/YOLOX/NVIDIA Jetson/"edge"/"na borda"/licenças Apache-MIT-BSD e as legendas dos canais da home ("detector de vocabulário aberto", "estimativa de pose"...) viraram **"modelo proprietário Logikos"** e **"processamento na nuvem ou na planta"**, em PT e EN, incluindo títulos, descrições (meta/OG), legendas, formulário ("Na planta (dispositivo no rack)") e comentários de `src/config/links.ts`. Textos que diziam "o vídeo nunca sai da planta" foram ajustados para os dois modos. O `text-gate` agora reprova YOLO*, RT-DETR, FireSet, NVIDIA, Jetson, TensorRT/DeepStream/ONNX, nomes de placa e "edge device/na borda" em qualquer arquivo publicado.

Ficaram de fora, de propósito: documentos históricos de auditoria em `docs/` (registro do que foi decidido) e identificadores internos de código (`edge` como valor do formulário no KV), que não aparecem para ninguém.

## 7. impeccable (só orientação)

Sem rótulo-pergunta na margem (fica só para leitor de tela), títulos e ritmo de seção da home, um par de CTAs por vez, botões com ícone por destino (seta = experiência, balão = especialista, câmera = demo do celular), sem estouro horizontal a 390 px, axe zero violações nas 20 rotas.

## 8. Abertura cortada na 1ª visita

**Causa:** os fail-safes contavam do carregamento da página. Com cache vazio, o `waiting` antes do primeiro quadro pulava em 0,6 s e o limite de 1,2 s "sem tocar" também — o site já estava pronto, o vídeo ainda baixando.
**Correção:** o relógio só começa quando o clipe pode tocar inteiro (pôster na tela e "Pular" disponível); teto = duração + 3 s a partir do 1º quadro; travadas no meio esperam até 3 s; só "Pular", Esc ou toque pulam (rolagem/inércia do trackpad não).

`scripts/check-abertura.mjs` (cache vazio a cada medida, mede o quanto do clipe tocou antes de passar adiante):

| Ambiente               | desktop rápida | desktop 4G | desktop lenta     | celular rápida | celular 4G | celular lenta     |
| ---------------------- | -------------- | ---------- | ----------------- | -------------- | ---------- | ----------------- |
| Produção hoje (`main`) | inteira        | inteira    | **cortada (0 s)** | inteira        | inteira    | **cortada (0 s)** |
| Prévia pr-48           | inteira        | inteira    | inteira           | inteira        | inteira    | inteira           |

E2e de regressão: clipe atrasado 2,5 s numa página pronta continua na tela e só passa adiante depois do fim.

## Verificação

CI do PR verde: lint, `astro check` 0, gates de texto/i18n/licença, unit 79, e2e (axe nas 20 rotas), Lighthouse mobile 12 páginas ≥ 0,95, deploy da prévia.

## Depende do Vitor

1. Vídeo real de robótica e de uma captura do Twins (hoje o Koda segura esses heróis).
2. O resto continua como no `ESTADO.md`: número do WhatsApp, gravação original da Fireshow, vetor/autorização dos logos.

---

# Rodada 3 (itens 9 a 13 + pedidos sobre a prévia)

Mesma PR #48, mesma prévia: https://pr-48.logikos-site.pages.dev/ . Capturas em [`rodada-3/`](rodada-3/).

## 9. Canais da home: carrossel de verdade

Os cinco canais (vídeo + painel do alerta) ficam lado a lado num trilho com _scroll-snap_: no celular se arrasta com o dedo, no notebook com o trackpad; setas discretas nas pontas e uma régua com os nomes (CH1 Fogo … CH5 Ergonomia) como indicador, que enche enquanto o canal toca. Troca sozinha a cada **3 s** (pedido do Vitor sobre a prévia), pausa com o mouse em cima, com o foco dentro ou fora da tela; com movimento reduzido não gira. Só o slide visível é alcançável pelo teclado e pelo leitor de tela (os outros ficam `inert`).

## 10. Logos

A Visdec estava cortada porque o WebP tinha perdido o símbolo e o "V" (o alfa começava no "I"). Refeita do arquivo original (`marca-visdec/visdec-horizontal-escuro.png`), e a CATH ganhou o alfa recalibrado (estava cinza-apagada). Alturas ajustadas por peso visual (mesma área de tinta, não a mesma altura). Os arquivos passaram a `l-visdec-v2.webp` e `l-cath-v2.webp`: a pasta tem cache de 7 dias, e o nome antigo segurava a versão cortada no navegador e na CDN.

## 11. Contato = conversa com o Koda → CRM

`/contato` agora é uma conversa: o Koda pergunta uma coisa por vez (nome → empresa → e-mail → WhatsApp → cargo opcional → o que quer resolver, em chips → mensagem opcional → consentimento com link da privacidade) e termina com "Obrigado, {nome}! Recebi tudo. Nossa equipe entra em contato assim que possível." Cada resposta tem "Corrigir"; Enter responde (Shift+Enter quebra linha na mensagem); o foco segue a pergunta e o leitor de tela ouve a nova fala do Koda; erros dizem o que corrigir.

Envio: `POST https://brandschutz.logikosvision.com.br/api/lead`, `Content-Type: text/plain`, com `origem: "site-logikos-contato"`, nome, empresa, email, telefone (só dígitos), cargo, interesse (texto dos chips), notas, `consentimento: true`, `consentimento_em`, `consentimento_texto` (o texto exato do aceite), `event_id` (um por conversa; uma nova tentativa reusa o mesmo, o CRM deduplica), `pagina` e o honeypot `website`. Sem Turnstile na conversa (o CRM já tem honeypot e limite por IP). O CSP libera só esse host.

Todo "Falar com especialista" do site (header, heróis, canais da home, fechos, faixa, barra do celular) leva para `/contato#conversa`, com o interesse da página já marcado (ex.: canal de fogo → chip "Fogo e fumaça"). O formulário antigo (KV) continua só em Integradores e Plataforma.

## 12. Fundo de TV antiga

Em todas as páginas: scanlines finas, grão (tile de 2,9 KB) e um flicker raro, como camadas fixas atrás do conteúdo que só animam transform/opacity (sem repintar a página). Depois do comentário do Vitor ("não percebi"), ficou mais visível: scanlines a 6 % e grão mais denso. Teste unitário garante AA do texto secundário sobre o fundo médio e do texto sobre o pixel mais claro. Parado com movimento reduzido e com o controle de parar da home.

## 13. Blocos densos em folhas claras

Listas e tabelas de dados saem do preto e vão para folhas claras (os tokens do tema claro, secundário #5C616B, AA): as cinco leituras do Recognition viram cinco cartões (ícone, nome e três pares rótulo/resposta; 3 colunas → 2 → 1 no celular), a legenda de EPI, a tabela "Lado a lado" da Plataforma e todas as listas de definição e de pontos (Integradores, Como funciona, LGPD, Sobre, Robótica, Twins).

## Pedido extra: "Entrar" fora do site

O link "Entrar" saiu do header (desktop e celular), do rodapé e da Plataforma, em PT e EN, até a plataforma nova existir. `/entrar`, `/login`, `/en/sign-in` e `/en/login` redirecionam (302) para a home.

## Conferido na prévia publicada (pr-48, build `dc931e2`)

| O quê          | Resultado                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carrossel      | Trocas medidas: 3,06 s · 3,05 s · 3,00 s ([desktop](rodada-3/previa-carrossel-desktop.png), [celular](rodada-3/previa-carrossel-celular.png))              |
| Logo da Visdec | `l-visdec-v2.webp` 200, 494×96, com o símbolo e o "V" ([print](rodada-3/previa-logos.png))                                                                 |
| Fundo de TV    | Scanlines + grão (`ruido-v2`) presentes nas 14 páginas checadas (12 PT + `/en/` e `/en/platform`); [recorte ampliado](rodada-3/previa-fundo-tv-zoom.png)   |
| "Entrar"       | 0 links de login nas 14 páginas (os 2 links Railway em Recognition e Demos são as demos de EPI e de fogo); `/entrar` → 302 `/`, `/en/sign-in` → 302 `/en/` |
| CI             | lint, `astro check`, gates, unit 81, e2e (axe, conversa com o CRM interceptado, carrossel), Lighthouse mobile 12 páginas ≥ 0,95, deploy                    |

Nenhuma requisição real foi feita ao CRM: todos os testes da conversa interceptam o endpoint. O envio real de ponta a ponta (CORS do CRM para `*.logikos-site.pages.dev`) não foi testado; o primeiro lead de verdade pela prévia confirma.

O passo do CI que instala o Chromium agora cai na instalação sem pacotes do sistema quando o apt não alcança os espelhos do Ubuntu (três execuções seguidas falharam assim, antes de qualquer teste).

## Depende do Vitor (rodada 3)

1. Conferir o primeiro lead da conversa chegando no CRM como "Site Logikos".
2. A página Plataforma ainda tem o formulário "Criar conta" (KV, "você recebe o acesso por e-mail"); com o "Entrar" fora, dizer se ele sai também até a plataforma nova.

---

# Rodada 4 (itens 14 a 26)

Mesma PR #48, mesma prévia: https://pr-48.logikos-site.pages.dev/ . Prints em [`rodada-4/`](rodada-4/) (`<item>-<1440|390>.jpg`), gerados por `scripts/conferir-previa.mjs` na prévia publicada.

## Regra do site, não página por página (item 25)

Tudo isto vive nos tokens e componentes compartilhados, em PT e EN:

- **Espaçamento:** um token só (`--lk-section-y`) para todas as seções, heróis e a home. Maior faixa vazia medida em 15 páginas × 1440/390 (`scripts/medir-vazios.mjs`): **34 % → 23 % de uma tela** ([antes](rodada-3/vazios-antes.txt), [depois na prévia](rodada-4/vazios-previa.txt)).
- **Sem meia tela vazia:** a partir de 64rem, toda seção de texto usa a largura inteira — título à esquerda, conteúdo (ou o texto, quando não há conteúdo) à direita; heróis só-texto (LGPD, Privacidade) também. A medição não acha mais nenhuma seção com a metade direita vazia (antes eram 13).
- **Sem detalhe técnico para o público:** as demos viram uma chamada só, "Teste na câmera do seu celular"; saíram os selos "no ar", "nada é enviado", "demo genérica", "taxa de alarme falso", "rode o modelo no seu navegador", o status das demos e os links para as demos antigas; "vídeo contínuo"/"atravessam o muro" viraram "as imagens ficam com você". O `text-gate` reprova essas frases e "24 meses" em qualquer página.
- **Licença:** mensal, anual ou **bienal** (recomendada: "2 anos sem se preocupar com os seus modelos: atualizações constantes por conta da Logikos") em Como funciona, Plataforma, Integradores e Recognition; nenhum "24 meses".
- **Cenários:** fogo, EPI, qualidade, contagem, ergonomia e zonas de risco dizem o que resolvem, o que você recebe, um exemplo de alerta e o próximo passo (cenário da experiência ou conversa com o especialista).

## Conferência na prévia publicada (1440 e 390)

| Item | O quê                                 | 1440                                                                                                                                       | 390                                                                                                     | Resultado                                                                                                                                                                 |
| ---- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9    | Carrossel dos canais (3 s)            | [print](rodada-4/09-carrossel-1440.jpg)                                                                                                    | [print](rodada-4/09-carrossel-390.jpg)                                                                  | ok — trocas medidas 3,06/3,04 s e 3,10/3,00 s                                                                                                                             |
| 10   | Visdec inteira                        | [print](rodada-4/10-15-logos-1440.jpg)                                                                                                     | [print](rodada-4/10-15-logos-390.jpg)                                                                   | ok — `l-visdec-v2.webp` com símbolo e "V"                                                                                                                                 |
| 11   | Contato = conversa com o Koda → CRM   | [print](rodada-4/11-conversa-1440.jpg)                                                                                                     | [print](rodada-4/11-conversa-390.jpg)                                                                   | ok                                                                                                                                                                        |
| 12   | Fundo de TV                           | [print](rodada-4/12-fundo-tv-1440.jpg)                                                                                                     | [print](rodada-4/12-fundo-tv-390.jpg)                                                                   | ok — scanlines e grão no `body` de todas as páginas                                                                                                                       |
| 13   | Dados densos em folhas claras         | [print](rodada-4/13-24-cenarios-1440.jpg)                                                                                                  | [print](rodada-4/13-24-cenarios-390.jpg)                                                                | ok                                                                                                                                                                        |
| 14   | Logo Logikos Vision                   | [B](rodada-4/14-header-B-1440.jpg) · [A, comparação](rodada-4/14-header-A-comparacao-1440.jpg) · [rodapé A](rodada-4/14-rodape-A-1440.jpg) | [B](rodada-4/14-header-B-390.jpg) · [A, comparação](rodada-4/14-header-A-comparacao-390.jpg)            | ok — no header a direção A deixa o VISION com ~6 px (desktop) e ~4 px (celular), ilegível; o header usa a **B** (LOGIKOS \| VISION) e o rodapé a **A** empilhada aprovada |
| 15   | Logos em fila estática                | [print](rodada-4/10-15-logos-1440.jpg)                                                                                                     | [print](rodada-4/10-15-logos-390.jpg)                                                                   | ok — CATH, BrandSchutz, Visdec inteiras, sem máscara. Causa: o letreiro deslizante esfumava 4 % de cada ponta e cortava a Visdec ao passar                                |
| 16   | Caixa Logikos abrindo                 | [print](rodada-4/16-caixa-1440.jpg)                                                                                                        | [print](rodada-4/16-caixa-390.jpg)                                                                      | ok — abre uma vez ao entrar na tela; equipamento, cabo de rede e fonte marcados em ordem; parada (aberta) com movimento reduzido                                          |
| 17   | Plataforma compacta + licença         | [print](rodada-4/17-licenca-1440.jpg)                                                                                                      | [print](rodada-4/17-licenca-390.jpg)                                                                    | ok — mensal / anual / bienal destacada                                                                                                                                    |
| 18   | Demos compactas                       | [página](rodada-4/18-demos-1440.jpg)                                                                                                       | [página](rodada-4/18-demos-390.jpg)                                                                     | ok — uma chamada, os dois vídeos lado a lado                                                                                                                              |
| 19   | Formulários enxutos → CRM             | [conta](rodada-4/19-formulario-conta-1440.jpg) · [integrador](rodada-4/19-formulario-integrador-1440.jpg)                                  | [conta](rodada-4/19-formulario-conta-390.jpg) · [integrador](rodada-4/19-formulario-integrador-390.jpg) | ok — Nome, Empresa, Quantidade de câmeras, Contato, Modelo de interesse + aceite; `site-logikos-conta` / `site-logikos-integrador`, `cameras` + `faixa_cameras`           |
| 20   | Sem Turnstile                         | —                                                                                                                                          | —                                                                                                       | ok — 0 requisições ao Turnstile nas páginas abertas; CSP sem o host dele                                                                                                  |
| 21   | Demo no celular dentro do site        | —                                                                                                                                          | —                                                                                                       | ok — 8 links para `/teste-no-seu-celular/` nas páginas checadas, 0 para o Railway ou `/demo/`; `scripts/cf` intocado (a exclusão da PR #49 fica)                          |
| 22   | Sem "a definir"                       | —                                                                                                                                          | —                                                                                                       | ok — também saiu "Prazo final a definir" da retenção                                                                                                                      |
| 23   | Monitores CAM 07 "aguardando conexão" | [print](rodada-4/23-cam07-1440.jpg)                                                                                                        | [print](rodada-4/23-cam07-390.jpg)                                                                      | ok — chuvisco, barra de sincronia, "conectando…" e relógio; parado com movimento reduzido e com o controle de parar                                                       |
| 24   | Cartões do Recognition + indicadores  | [print](rodada-4/13-24-cenarios-1440.jpg)                                                                                                  | [print](rodada-4/13-24-cenarios-390.jpg)                                                                | ok — 6 cartões + "Traga os seus indicadores para a plataforma"                                                                                                            |
| 25   | Regra global                          | [vazios](rodada-4/vazios-previa.txt)                                                                                                       | —                                                                                                       | ok — ver acima                                                                                                                                                            |
| 26   | Sobre                                 | [página](rodada-4/26-sobre-1440.jpg)                                                                                                       | [página](rodada-4/26-sobre-390.jpg)                                                                     | ok — manifesto → frentes → como trabalhamos → onde estamos → "Solicite seu modelo customizado" (herói e fecho)                                                            |

CI da PR: lint, `astro check`, gates (texto, i18n, licença), unit, e2e (inclui `rodada4.spec.ts` com o CRM interceptado), Lighthouse mobile ≥ 0,95 nas 12 páginas e deploy. Nenhuma requisição real ao CRM.

## Diferenças do pedido (decidi assim, diga se quer outro caminho)

- **Contato do formulário (item 19):** o pedido era um campo único "e-mail ou WhatsApp", mas o CRM recusa lead sem e-mail (`receberLead` responde 422). Ficou "Contato" com e-mail obrigatório e WhatsApp opcional, lado a lado.
- **Logo no header (item 14):** direção B (LOGIKOS | VISION numa linha); a A fica no rodapé. Prints das duas no header acima.
- **"EPI sem alarme falso"** é o novo título de benefício do EPI (não é a "taxa de alarme falso medida").
- A infraestrutura do KV de leads (`wrangler.toml`, `scripts/cf-provision.mjs`) não foi mexida; só o formulário e a função `/api/lead` saíram do site.

## Depende do Vitor

1. Ver o primeiro lead da conversa e dos formulários chegando no CRM como "Site Logikos".
2. Vídeo real de robótica e de uma captura do Twins (o Koda ainda segura esses heróis).

---

# Rodada 5

Mesma PR #48, prévia https://pr-48.logikos-site.pages.dev/ . Prints em [`rodada-5/`](rodada-5/) e [`rodada-4/`](rodada-4/) (lockup).

| Pedido                                        | 1440                                                                                            | 390                                                                                           | Resultado                                                                                                                                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logo: direção A (decisão do Vitor)            | [header](rodada-4/14-lockup-A-header-1440.jpg) · [rodapé](rodada-4/14-lockup-A-rodape-1440.jpg) | [header](rodada-4/14-lockup-A-header-390.jpg) · [rodapé](rodada-4/14-lockup-A-rodape-390.jpg) | ok — lockup A em vetor com brilho suave em CSS; header de 73 px; VISION com 11,4 px de letra no desktop e 10,1 px a 390 (8,8 px a 360, 7 px a 320); também no rodapé, na 404 e no card de OG; favicon segue com o símbolo |
| (1) "Dentro da planta."                       | [print](rodada-5/1-dentro-da-planta-1440.jpg)                                                   | [print](rodada-5/1-dentro-da-planta-390.jpg)                                                  | ok — a caixa Logikos ao lado; "Ver como funciona" virou botão secundário junto do texto (slot de ações do componente de seção, vale para o site todo)                                                                     |
| (2) Gêmeo digital                             | [CH6](rodada-5/2-ch6-gemeo-1440.jpg) · [Twins](rodada-5/2-twins-1440.jpg)                       | [CH6](rodada-5/2-ch6-gemeo-390.jpg) · [Twins](rodada-5/2-twins-390.jpg)                       | ok — loop composto em mp4 h264 + webm (≈ 250 KB cada, sem áudio, toca só na tela/primeiro gesto); CH6 no carrossel (o que resolve, o que você recebe, "Solicite seu modelo customizado"); herói do Twins no lugar do Koda |
| Twins peça a peça                             | [Twins](rodada-5/2-twins-1440.jpg)                                                              | [Twins](rodada-5/2-twins-390.jpg)                                                             | ok — "Gêmeo de cada peça" (inspeção de 100 %, rastreabilidade, desvio do projeto antes do lote, histórico) no texto da página e no painel do CH6, PT e EN                                                                 |
| Frase sob os botões do herói                  | [herói](rodada-5/a-heroi-sem-legenda-1440.jpg)                                                  | [herói](rodada-5/a-heroi-sem-legenda-390.jpg)                                                 | ok — removida (PT e EN)                                                                                                                                                                                                   |
| (a) legendas "vídeo de banco / detecção real" | [herói](rodada-5/a-heroi-sem-legenda-1440.jpg)                                                  | —                                                                                             | ok — removidas em todo o site; o text-gate reprova a volta                                                                                                                                                                |
| (b) "Funcionando na frente de todo mundo"     | [print](rodada-5/b-fireshow-1440.jpg)                                                           | [print](rodada-5/b-fireshow-390.jpg)                                                          | ok — conteúdo dos cartões centralizado na vertical e conjunto centralizado                                                                                                                                                |
| (c) e-mail só no rodapé                       | [rodapé](rodada-5/d-rodape-1440.jpg)                                                            | [rodapé](rodada-5/d-rodape-390.jpg)                                                           | ok — fora do contato da home, da página de contato e das mensagens de erro; fica no rodapé e na política de privacidade (canal do titular exigido pela LGPD)                                                              |
| (d) sem cidade                                | [Sobre](rodada-5/d-sobre-1440.jpg)                                                              | [Sobre](rodada-5/d-sobre-390.jpg)                                                             | ok — fora do rodapé, do Sobre ("Do teste à operação" no lugar de "Onde estamos"), da privacidade e dos metadados; segue só no JSON-LD (dado estruturado, invisível)                                                       |

Orçamento da home no Lighthouse: 540 → 550 KB (o CH6 e o lockup vetorial no header e no rodapé cresceram o HTML; medido 540,0 KB). CI todo verde.

## Lançamento no www: suspenso

A pedido do Vitor, nada foi feito na Cloudflare. Só a PR #49 foi mergeada em `main`; ela já estava aplicada desde antes (ponte da raiz deixa `/teste-no-seu-celular` na origem). Estado de produção registrado em 11/11 16:08: `logikosvision.com.br/` 302 → `logikos-site.pages.dev`; `/demo/`, `/experiencia/` e `/teste-no-seu-celular/` 200; `/bs` 302 → BrandSchutz; `www` sem registro DNS; `brandschutz.` 200; MX `mx1/mx2.titan.email` e SPF da Titan.

Já está pronto na PR #48 para quando o Vitor liberar:

1. Mergear a #48 em `main` (o CI publica a produção do Pages).
2. Workflow **cf-apex**, modo `www`: domínio `www.logikosvision.com.br` no Pages `logikos-site` + CNAME `www` → `logikos-site.pages.dev` (proxied, com comentário de autoria). Se o `www` já apontar para outro lugar, aborta sem mexer.
3. Workflow **cf-apex**, modo `ponte` (destino padrão `https://www.logikosvision.com.br`): a regra 302 da raiz passa a mandar para o www, mantendo fora `/demo`, `/experiencia`, `/teste-no-seu-celular` e `/bs`.
4. Workflow **cf-apex**, modo `verify`: www, raiz, caminhos preservados, `brandschutz.` e MX.

Rollback, em ordem:

- **Raiz de volta ao Pages:** modo `ponte` com `destino = https://logikos-site.pages.dev` (estado de hoje).
- **Tirar o www:** modo `www-rollback` (remove só o domínio do Pages e o CNAME criados pelo cf-apex).
- **Tirar a ponte:** modo `ponte-rollback` (a raiz volta direto para a origem/túnel).

Nenhum modo toca MX/TXT (Titan), o túnel ou outros registros.

A canonical, o OG e o sitemap já apontam para `https://www.logikosvision.com.br` (o `pages.dev` segue `noindex`).

---

# Revisão final do Vitor (13 pontos)

Prévia https://pr-48.logikos-site.pages.dev/ (build `188e17a`, CI todo verde). Conferido na prévia publicada por `scripts/conferir-revisao.mjs`; prints em [`revisao-final/depois/`](revisao-final/depois/) (`<ponto>-<1440|390>.jpg`).

| #     | Página        | Pedido                                                       | 1440                                                              | 390                                                                                                                                  | Resultado na prévia                                                                                                                                                                                                                                                            |
| ----- | ------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Privacidade   | tirar a sede                                                 | [print](revisao-final/depois/01-privacidade-1440.jpg)             | [print](revisao-final/depois/01-privacidade-390.jpg)                                                                                 | ok — sem sede nem cidade                                                                                                                                                                                                                                                       |
| 2     | Sobre         | texto ao lado de "Por que existimos" centralizado no título  | [print](revisao-final/depois/02-sobre-por-que-1440.jpg)           | [print](revisao-final/depois/02-sobre-por-que-390.jpg)                                                                               | ok — centros a 8 px (regra de todas as seções só-texto); empilhado no celular                                                                                                                                                                                                  |
| 3     | Twins         | gêmeo digital por peça nessa seção                           | [print](revisao-final/depois/03-twins-peca-1440.jpg)              | [print](revisao-final/depois/03-twins-peca-390.jpg)                                                                                  | ok — seção "O gêmeo digital de cada peça" (inspeção de 100 %, rastreabilidade, desvio antes do lote, histórico); o vídeo do gêmeo segue no herói                                                                                                                               |
| 4     | Demos         | sobre como a visão computacional funciona, não EPI           | [print](revisao-final/depois/04-demos-1440.jpg)                   | [print](revisao-final/depois/04-demos-390.jpg)                                                                                       | ok — "Veja a visão computacional funcionando."                                                                                                                                                                                                                                 |
| 5     | Sobre         | sem "Testar a experiência" no herói                          | [print](revisao-final/depois/05-sobre-heroi-1440.jpg)             | [print](revisao-final/depois/05-sobre-heroi-390.jpg)                                                                                 | ok — só "Solicite seu modelo customizado"                                                                                                                                                                                                                                      |
| 6     | Como funciona | remover "Só o alerta e o clipe do evento saem da planta."    | [print](revisao-final/depois/06-11-como-funciona-1440.jpg)        | [print](revisao-final/depois/06-11-como-funciona-390.jpg)                                                                            | ok — removida                                                                                                                                                                                                                                                                  |
| 7     | Home          | parágrafo numa folha branca, seção centralizada              | [print](revisao-final/depois/07-home-planta-tem-cameras-1440.jpg) | [print](revisao-final/depois/07-home-planta-tem-cameras-390.jpg)                                                                     | ok                                                                                                                                                                                                                                                                             |
| 8     | Integradores  | criar o modelo customizado, não revender                     | [print](revisao-final/depois/08-integradores-1440.jpg)            | [print](revisao-final/depois/08-integradores-390.jpg)                                                                                | ok — "Crie o modelo customizado do seu cliente com a Logikos."; pontos: você traz o caso → a Logikos treina → entregue para a operação → suporte e evolução                                                                                                                    |
| 9     | Robótica      | sem "Testar a experiência" no herói                          | [print](revisao-final/depois/09-robotica-1440.jpg)                | [print](revisao-final/depois/09-robotica-390.jpg)                                                                                    | ok — só "Falar com especialista"                                                                                                                                                                                                                                               |
| 10    | Home          | experiência direta; câmera direto ao vivo                    | [herói](revisao-final/depois/10-home-heroi-1440.jpg)              | [experiência](revisao-final/depois/10-destino-experiencia-390.jpg) · [câmera](revisao-final/depois/10-destino-camera-direta-390.jpg) | ok — "Testar a experiência" abre direto `/experiencia/` (já entra na abertura da TV); todos os "Teste na câmera do seu celular" vão para `/teste-no-seu-celular/?direto=1`, que pula a tela inicial (no robô de teste aparece "Não deu pra iniciar" porque ele não tem câmera) |
| 11    | Como funciona | subir "Da câmera à decisão"                                  | [print](revisao-final/depois/06-11-como-funciona-1440.jpg)        | [print](revisao-final/depois/06-11-como-funciona-390.jpg)                                                                            | ok — título a 24 px do herói (1440) e 16 px (390)                                                                                                                                                                                                                              |
| 12/13 | Recognition   | notificação do app nos 6 cartões, no lugar dos blocos pretos | [print](revisao-final/depois/12-13-recognition-1440.jpg)          | [print](revisao-final/depois/12-13-recognition-390.jpg)                                                                              | ok — cartão branco com ícone Logikos, "Logikos Vision", hora, título e texto (borda vermelha só no fogo, âmbar nos alertas)                                                                                                                                                    |

| 14 | Header | respiro entre a logo e o menu, menu centrado, equilibrado até 1280 | [1152](revisao-final/depois/14-header-1152.jpg) · [1280](revisao-final/depois/14-header-1280.jpg) · [1440](revisao-final/depois/14-header-1440.jpg) | [print](revisao-final/depois/14-header-390.jpg) | ok — 40 px (1152) e 48 px (1280/1440) entre o lockup e o menu; menu no centro vertical da logo (diferença 0); nada passa da borda da barra. O especialista do header fica só com o ícone no desktop e, entre 72 e 80 rem, o lockup cai para 46 px (VISION 10,1 px) para caber |

Junto, da rodada 5 (já na prévia): "Dentro da planta" com a caixa, gêmeo digital (CH6 + Twins peça a peça), frase do herói fora, sem legendas de vídeo de banco, cartões da Fireshow centralizados, e-mail só no rodapé, sem cidade. Também saiu "sem enviar nada" do fecho das páginas (o text-gate reprova a volta).

O lançamento no www continua suspenso.
