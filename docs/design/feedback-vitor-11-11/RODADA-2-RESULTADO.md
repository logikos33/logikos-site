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
