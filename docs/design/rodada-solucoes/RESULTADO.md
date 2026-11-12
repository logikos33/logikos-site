# Rodada "Soluções customizadas": resultado (12/11/2026)

**Prévia:** https://solucoes.logikos-site.pages.dev (Cloudflare Pages, branch `solucoes`). **Produção intocada**: publica só depois da aprovação do Vitor (a sessão principal publica).
**Branch:** `logikos33/site-solucoes-cases-r1`, criada a partir de `origin/main` (`f66e916`).
**Prints:** `prints/<ponto>-<página>-1440.jpg` e `-390.jpg`, todos tirados **na prévia** depois do último deploy.

Verificação: `astro check` 0 erros · ESLint + Prettier ok · unit 56/56 · `gate:text` ok (sem nome de modelo/hardware, sem cliente fora da home) · `gate:i18n` ok (PT/EN em paridade, números documentados) · build com 34 páginas · e2e: veja o fim deste arquivo.

## Ponto a ponto

| #     | Página        | Pedido do Vitor                                                                                                                           | Feito?            | Como                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Prints                                            |
| ----- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1     | Como funciona | Complementar para a tomada de decisão; falar com o cliente                                                                                | ✅                | O texto do topo agora fala com o cliente: "Você conta o que precisa enxergar. A Logikos entende a operação, treina o modelo para o que importa nela e define onde ele roda. Você recebe o alerta com a prova do momento e decide o que fazer."                                                                                                                                                                                                       | `01-como-funciona-hero-*`                         |
| 2     | Como funciona | Mostrar as várias possibilidades de integração                                                                                            | ✅                | Passou de 3 para 6 integrações, com uma introdução ("o alerta chega onde a sua operação já trabalha; definimos juntos no dimensionamento"): WhatsApp e e-mail, painel, alarme e sinalização (contato seco), ERP e MES, CLP/sensores/IoT (MQTT ou OPC UA), webhook. Todas já eram citadas no site (Sobre, home), nada novo foi inventado.                                                                                                             | `02-como-funciona-integracoes-*`                  |
| 3     | Como funciona | Cada projeto é dimensionado conforme a planta; licença ou aquisição                                                                       | ✅                | O bloco virou "Dimensionado para a sua operação": câmeras, leituras e equipamento na planta (se houver) definidos por projeto; a contratação pode ser licença ou aquisição. Entrou um 4º cartão, **Aquisição**. O mesmo componente serve Como funciona e Plataforma, então o tratamento é igual nas duas.                                                                                                                                            | `03-04-como-funciona-licenca-*`                   |
| 4     | Como funciona | "Solicitar seu modelo agora mesmo"                                                                                                        | ✅                | O CTA principal do site inteiro passou a ser **"Solicite seu modelo agora mesmo"**, que abre a conversa com o Koda → CRM (mesmo destino de antes). No hero ele virou o botão sólido, e "Testar a experiência" passou a ser o secundário. No menu fixo fica a forma curta "Solicite seu modelo", e na barra do celular, "Seu modelo". Cada canal tem a sua variação ("Solicite seu modelo de ergonomia"…).                                            | `03-04-…`, `08-10-…`                              |
| 5     | Demos         | "Clique e teste agora mesmo no seu celular"                                                                                               | ✅                | A frase entrou no texto de "O que a câmera passa a entender", e logo abaixo dos dois clipes há um botão "Teste agora mesmo no seu celular" (a demo do celular).                                                                                                                                                                                                                                                                                      | `05-06-demos-ver-*`                               |
| 6     | Demos         | Validar se as demos abrem corretamente                                                                                                    | ✅ verificado     | Na prévia: a demo do celular (`/teste-no-seu-celular/?direto=1`), a experiência e `?cenario=fogo` respondem 200. No Chromium, a 1440 e a 390, os clipes de EPI e fogo **carregam e tocam** (`readyState 4`, sem pausa) e o clipe da Fireshow também toca. Detalhe: os vídeos só começam no primeiro gesto do visitante (mouse, toque ou rolagem), o que é intencional, para economizar dados. Nada para corrigir.                                    | `05-06-demos-ver-*`                               |
| 7     | Geral         | Não duplicar; identidade igual; GIFs/imagens                                                                                              | ✅                | O "como funciona" saiu de Integradores e passou a existir **só** em Como funciona (os mesmos 4 passos, reescritos para o cliente). A seção "e para integradores?" saiu do Recognition. O bloco de licença é um componente só. Os cartões de case usam a imagem real quando ela existe. Quando não existe, aparece o ícone na "tela de CFTV" da marca, sem imagem genérica.                                                                           | —                                                 |
| 8–9   | Home          | Nova premissa: modelos customizados; "integra visão computacional à tecnologia de borda…"                                                 | ✅                | H1: "Modelos de visão computacional feitos para a sua empresa." Texto: "A Logikos integra visão computacional à tecnologia de borda para entregar eficiência e segurança aos seus processos. Entendemos a sua operação, dimensionamos o projeto e entregamos o modelo pronto, nas câmeras que você já tem." Título e descrição para buscadores atualizados.                                                                                          | `08-10-home-heroi-*`                              |
| 10    | Home          | "Solicite seu modelo agora mesmo"                                                                                                         | ✅                | Veja o ponto 4.                                                                                                                                                                                                                                                                                                                                                                                                                                      | `08-10-home-heroi-*`                              |
| 11    | Home          | Incluir o logo da Infra Automação                                                                                                         | ✅ (com pergunta) | O arquivo `infra-solucao-branco.png` é o selo **"Solução by INFRA"**. Na faixa de clientes usei só a marca **INFRA** (recortada do arquivo branco, em webp), com altura ajustada ao peso dos outros três. Alt: "Infra Automação".                                                                                                                                                                                                                    | `11-home-parceiros-*`                             |
| 12    | Home          | "Alguns de nossos modelos personalizados"; incluir presença por posto                                                                     | ✅                | Título: "Alguns dos nossos modelos personalizados." Entrou o canal **CH7 · Presença no posto**, com o que resolve, o que você recebe e "Solicite seu modelo de presença". Como ainda não há vídeo nosso publicável, o monitor desse canal mostra "CAM 08 · aguardando sinal" (o mesmo recurso da CAM 07). **Ergonomia virou o CH1** (pedido do Vitor nesta rodada: prioridade do momento) e abre o carrossel e o muro do hero.                       | `12-home-modelos-*`                               |
| 13    | Home          | Trocar "fale com especialista" por uma nova página "Acompanhe nossos cases" (gêmeos, RA para logística, controle de operação, fogo, EPI…) | ✅                | Página nova **/cases** (PT e EN), 1º item do menu. Na faixa "Quer ver isso nas suas câmeras?", o botão secundário virou "Acompanhe nossos cases →". O bloco final da home virou "Solicite seu modelo agora mesmo.", com "Acompanhe nossos cases" ao lado.                                                                                                                                                                                            | `13-home-faixa-*`, `13-home-fecho-*`, `cases-*`   |
| 14    | Home          | "Faltou mudar esse texto aqui" (capacete)                                                                                                 | ✅                | "Aponte para alguém com e sem capacete…" virou "Abra no celular, aponte para o que estiver à sua frente e veja a câmera marcar na hora o que reconhece." (a demo do celular detecta qualquer coisa, não só capacete).                                                                                                                                                                                                                                | `14-home-prova-*`                                 |
| 15    | Integradores  | O "como funciona" vai para Como funciona; repensar a aba                                                                                  | ✅                | Integradores **saiu do menu principal** e ficou no rodapé como "Para integradores": hero + "Como o projeto acontece" (um link para Como funciona, sem repetir conteúdo) + formulário "Quero criar um modelo". Os 4 passos foram para Como funciona como "Do seu caso ao modelo rodando". A URL `/integradores` continua igual.                                                                                                                       | `15-integradores-*`, `15-como-funciona-projeto-*` |
| 16    | Plataforma    | Deixar claro que o equipamento pode existir ou não, conforme a atividade                                                                  | ✅                | Hero: "Na nuvem, o painel abre pelo navegador. Na planta, quando a atividade pede, um equipamento Logikos lê as câmeras… Se o equipamento entra ou não no projeto, analisamos juntos conforme a sua atividade." A tabela "Lado a lado" diz o mesmo. Em Como funciona, a seção da caixa virou "Equipamento na planta, quando o projeto pede".                                                                                                         | `16-plataforma-heroi-*`                           |
| 17    | Plataforma    | Licença igual a Como funciona                                                                                                             | ✅                | É o mesmo componente (4 cartões: mensal, anual, bienal recomendada e aquisição). A linha "Contrato" da tabela diz "licença ou aquisição, dimensionadas para o projeto".                                                                                                                                                                                                                                                                              | `17-plataforma-licenca-*`                         |
| 18    | Privacidade   | Criar contato@ e trocar no site todo                                                                                                      | ⏸ preparado       | **Não troquei**: a caixa ainda não existe no Titan e os e-mails voltariam. O e-mail já está numa constante única (`src/lib/site.ts` → `CONTACT_EMAIL`, ou a variável `PUBLIC_CONTACT_EMAIL`) que serve rodapé, privacidade e avisos do formulário. Quando a caixa existir, a troca é em uma linha.                                                                                                                                                   | `18-19-privacidade-rodape-*`                      |
| 19    | Privacidade   | Selos                                                                                                                                     | ✅                | Três selos no rodapé (todas as páginas), cada um é uma afirmação que a política já faz: "LGPD · política publicada" (link para a política), "Sem cookies de rastreamento", "Não vendemos dados". Nenhuma certificação.                                                                                                                                                                                                                               | `18-19-privacidade-rodape-*`                      |
| 20–21 | Recognition   | Modelos customizados e várias leituras por câmera; breve sobre produtos e necessidade de entender o projeto                               | ✅                | H1: "Modelos customizados. Várias leituras na mesma câmera." O texto explica que quais leituras, e em quantas câmeras, se define depois de entender o projeto. A seção de modelos ("Modelos de partida, ajustados ao seu projeto.") ganhou uma introdução sobre o entendimento do projeto e um 7º cartão, **Presença por posto de trabalho**. Ergonomia vem primeiro. Cada cartão tem âncora (`#ergonomia`, `#fogo`…) para os links da página Cases. | `20-21-recognition-*`                             |
| 22    | Robótica      | "Explique a sua necessidade para nós"                                                                                                     | ✅                | "Explique a sua necessidade para nós. A Logikos leva a visão computacional para drones e robôs, no ar, em terra ou na água, e dimensiona a solução para o seu cenário."                                                                                                                                                                                                                                                                              | `22-robotica-heroi-*`                             |
| 23–24 | Robótica      | Terra, céu e água; batimetria, rede elétrica, EPI em obras                                                                                | ✅                | Seção "Terra, céu e água.": **Céu** (drones aéreos: redes elétricas, áreas amplas ou de difícil acesso, EPI em obras), **Terra** (quadrúpedes: rondas em áreas de risco) e **Água** (drones aquáticos: batimetria e inspeção em rios, represas e reservatórios).                                                                                                                                                                                     | `23-24-robotica-lugares-*`                        |
| 25    | Robótica      | Explorar o processo de entendimento sob demanda                                                                                           | ✅                | "Do seu cenário à solução em campo." em 6 passos: você explica a necessidade → entendemos o cenário → escolhemos a plataforma → treinamos o modelo → piloto acompanhado → operação e evolução.                                                                                                                                                                                                                                                       | `25-robotica-processo-*`                          |
| extra | Cases         | Mídia nova (pátio + ergonomia) e ergonomia em destaque                                                                                    | ✅                | **Pátio**: foto da Artlist com as caixas de detecção desenhadas no código (SVG: contêiner, empilhadeira, caminhão, pessoa no pátio). Aparece no cartão (recorte quadrado) e no hero do case. **Ergonomia**: recorte quadrado abaixo da câmera dome (que fica fora do quadro), num cartão em destaque com o selo "Prioridade agora", duas colunas de largura e primeiro da lista de modelos.                                                          | `cases-*`, `case-patio-*`                         |

## Nova estrutura de páginas

Menu principal (6 itens): **Cases** · Recognition · Como funciona · Demos · Plataforma · Sobre.
Rodapé: Cases, Recognition, Como funciona, Demos, Plataforma, **Para integradores**, Twins, Robótica, LGPD, Sobre, Contato + os 3 selos.

```
/                          Home (nova premissa; ergonomia CH1; CH7 presença; INFRA na faixa)
/cases                     NOVA · Acompanhe nossos cases
  Projetos dimensionados
    Gêmeos digitais        → /twins
    Pátio de contêineres   → /cases/patio-de-conteineres      (NOVA, curta; "Projeto em levantamento")
    Drones e robótica      → /robotica                        (reescrita: terra, céu e água)
    RA para logística      → /cases/realidade-aumentada       (NOVA, curta)
    Controle de operação   → /cases/controle-de-operacao      (NOVA, curta)
  Modelos (Ergonomia em destaque, depois fogo, EPI, qualidade, contagem, zonas, presença)
                           → /recognition#ergonomia, #fogo, #epi, #qualidade, #contagem, #zonas, #presenca
/recognition               modelos customizados + várias leituras; 7 modelos
/como-funciona             decisão do cliente; passos do projeto (vindos de Integradores); 6 integrações; licença ou aquisição
/plataforma                equipamento conforme a atividade; licença ou aquisição
/demos                     + "Teste agora mesmo no seu celular"
/integradores              fora do menu; curta, aponta para Como funciona
/robotica                  terra, céu e água + processo em 6 passos
```

EN: `/en/cases`, `/en/cases/container-yard`, `/en/cases/augmented-reality`, `/en/cases/operations-control`, com o mesmo conteúdo em inglês. Sitemap, hreflang e imagens OG geradas para as 8 páginas novas.

As páginas curtas de case seguem o modelo **problema → como dimensionamos → o que você recebe → Solicite seu modelo**, sem números, sem nome de cliente e sem resultado inventado. O pátio usa o que está no documento de descoberta real (entrada, movimentação e localização exata: vaga e nível na pilha; código único lido pela câmera; câmeras no portão e no pátio; especificar e instalar se o pátio não tiver câmeras), sem citar o cliente. Ele aparece marcado como **"Projeto em levantamento"**, porque o documento diz "levantamento inicial, sem proposta fechada".

## Perguntas para o Vitor

1. **Logo da Infra:** confirmei que o arquivo é o selo "Solução by INFRA" usado nas telas da feira. Na faixa usei só a marca "INFRA", e o alt diz "Infra Automação". É a mesma empresa? Prefere o selo inteiro ("Solução by INFRA") ou existe um logo oficial deles?
2. **Pátio de contêineres:** posso apresentar como case com o selo "Projeto em levantamento", como está? Ou prefere esconder até haver proposta fechada? Há fotos reais do pátio que possamos usar (sem identificar o cliente)?
3. **Realidade aumentada para logística** e **Controle de operação:** não achei material real em `~/logikos`. As páginas descrevem o tipo de solução de forma genérica. Existe um projeto, demo ou imagem? Qual é o caso concreto (cliente anônimo, o que o operador vê, que equipamento usa: tablet, óculos ou monitor)?
4. **Presença por posto de trabalho:** existe o piloto de postos na planta da Infra (snapshots `cam1/cam2-postos.png`). Posso usar um quadro desse piloto (rostos borrados) no CH7 da home e no card? Hoje o monitor mostra "CAM 08 · aguardando sinal".
5. **Drones/robótica:** não achei mídia real de drone aéreo, quadrúpede ou aquático, nem de batimetria ou rede elétrica. As aplicações citadas são as que você listou. Já há algum projeto ou parceiro para mostrar? O card ainda usa o Koda.
6. **Aquisição:** o 4º cartão diz "Para quem prefere adquirir: proposta dimensionada para o projeto". Quer detalhar o que a aquisição inclui (equipamento, modelo, suporte à parte)?
7. **contato@logikosvision.com.br:** avise quando a caixa existir no Titan. A troca é em uma linha (`CONTACT_EMAIL`).
8. **Selos:** os três atuais refletem só o que a política já diz. A política ainda está marcada como "versão provisória, em revisão jurídica". Quer um selo de hospedagem ("Dados hospedados na Cloudflare")? Ou prefere esperar a versão final?
9. **CTA nos heroes:** "Solicite seu modelo agora mesmo" virou o botão sólido, e "Testar a experiência" o secundário, em todas as páginas e no topo da home. No menu fixo do desktop mantive o desenho anterior (ícone + experiência sólida) por falta de espaço. Está de acordo?
10. **Imagem dos cases sem mídia** (RA, controle de operação, zonas de risco, presença): hoje aparece o ícone sobre a "tela de CFTV" da marca. Quer gerar imagens no Artlist para esses (fica para a próxima rodada, como combinado)?

## Testes (e2e)

Os testes que fixavam o desenho anterior foram atualizados para as decisões desta rodada: 16 páginas por idioma (eram 12), 4 logos, 4 opções de licença, 7 modelos, 7 canais com ergonomia em 1º, Cases no menu do celular, "Seu modelo" na barra, Robótica com terra/céu/água.

Resultado na versão publicada na prévia: suíte completa com **95 passaram**. Os 2 que falharam eram testes que percorrem todas as páginas e estouraram 60 s (agora são 32 páginas), não defeitos do site. Depois de aumentar o tempo deles, rodaram de novo e passaram: `mobile` 4/4 (inclui "sem rolagem horizontal a 320 px" em todas as páginas) e `theme` 6/6 (inclui **axe WCAG 2 A/AA sem violações em todas as páginas**, inclusive as novas).

## Rodada 2 (12/11/2026, tarde)

Prévia republicada em https://solucoes.logikos-site.pages.dev. Prints novos: `prints/r2-*` (1440 e 390, na prévia).

| #   | Pedido                                               | Feito        | Como                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Prints                                                   |
| --- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| 1   | Pátio: sai "Projeto em levantamento", fica "Projeto" | ✅           | O selo diz "Projeto" (EN "Project"). O hero passou de "está dimensionando" para "dimensionou". Nenhuma linguagem "em levantamento" restou na página do case, no cartão nem na home (conferido no HTML da prévia).                                                                                                                                                                                                                                                              | `r2-case-patio-*`                                        |
| 2   | Imagens novas                                        | ✅           | Em `public/media/cases/`: 1280 (16:9) + `-480` (quadrado). **RA** e **Controle de operação** no cartão e no hero da página. **Zonas de risco** no cartão. **Pátio aéreo** é a capa do cartão; a `conteineres.jpg` com as caixas de detecção segue no hero do case. drone-aereo, quadrupede-obra e barco-batimetria **não foram usadas**.                                                                                                                                       | `r2-cases-*`, `r2-case-ra-*`, `r2-case-controle-*`       |
| 3   | Drones e robótica: animação SVG/CSS                  | ✅           | Componente `RoboScene`, uma cena com os três (céu, terra, água): o drone paira com os rotores girando e a câmera varre até a caixa "capacete" travar sobre um trabalhador; o quadrúpede anda em loop; o barco autônomo balança nas ondas com pings de sonar (batimetria). Traço ciano sobre a textura de TV do site, sem fabricante nem modelo. Com reduced motion, mostra um quadro parado com a detecção visível. Usada no cartão e no hero de /robotica (no lugar do Koda). | `r2-robotica-heroi-*`, `r2-robotica-reduced-motion-1440` |
| 4   | Presença por posto: vídeo real                       | ✅           | `presenca-posto.mp4` / `.webm` + pôster (webp 640/480/320). No **cartão** (componente `Cam`, quadrado) e no **CH7 da home**: muted, loop, playsinline, `preload="none"`, com `poster`. Carrega só perto da tela e depois do primeiro gesto, como os outros clipes. O cliente não é citado em nenhum lugar. Conferido no Chromium: toca a 1440 e a 390.                                                                                                                         | `r2-home-ch7-presenca-*`, `r2-cases-*`                   |
| 5a  | RA: separação guiada                                 | ✅           | Seção "Separação guiada no armazém": onde está o produto, a melhor rota conforme o pedido e a confirmação do item pela câmera.                                                                                                                                                                                                                                                                                                                                                 | `r2-case-ra-*`                                           |
| 5b  | Pátio: "Operações logísticas"                        | ✅           | Seção nova: alocar as cargas conforme a entrada e a saída (o que sai primeiro fica mais acessível), com menos movimentos e um pátio mais ágil.                                                                                                                                                                                                                                                                                                                                 | `r2-case-patio-*`, `r2-en-case-patio-logistica-*`        |
| 5c  | Controle de operação: aplicabilidade                 | ✅           | "Onde se aplica e o que você acompanha": linhas de montagem e produção, expedição e docas, armazéns e CDs, pátios e manutenção. Andamento por etapa, gargalos, paradas, alertas em tempo real e indicadores do turno. Sem números.                                                                                                                                                                                                                                             | `r2-case-controle-*`                                     |
| 6   | Ergonomia: dome escondida                            | ✅ (mantido) | Segue o enquadramento já usado: o recorte quadrado começa abaixo da dome, que não aparece.                                                                                                                                                                                                                                                                                                                                                                                     | `r2-cases-*`                                             |
| —   | contato@                                             | ⏸            | Nada trocado, como pedido.                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —                                                        |

Verificação: `astro check` 0 erros · ESLint ok · `gate:text` e `gate:i18n` ok · build ok · e2e: 96 de 97 na suíte completa. A falha foi o teste que exigia uma foto no hero da Robótica (agora o hero tem a animação). O teste foi ajustado para exigir a cena desenhada e passou (structure 11/11).

### Perguntas novas para o Vitor

11. **Vídeo de presença:** o canto superior direito mostra o texto "HIKVISION", que é a marca d'água da própria câmera. O site já cita Hikvision como câmera compatível, então mantive. Quer uma versão do vídeo sem esse texto (recorte ou desfoque na edição)?
12. **Animação de robótica:** está numa cena única com os três. Prefere assim ou um carrossel de três quadros (um por ambiente)?

## Rodada 3 (12/11/2026): abertura, aviso LGPD, robótica humanoide

Prévia: https://solucoes.logikos-site.pages.dev · prints `prints/r3-*`.

### A) Abertura (TV)

As 4 causas foram confirmadas no código e corrigidas em `src/views/HomeView.astro`:

1. **`stalled`**: saiu. Só `waiting` conta como travamento, e o timer (6 s) só encerra se o `currentTime` não avançou. Prova: com um `stalled` falso aos 0,8 s, o **código antigo cortava em 3,8 s, sem mergulho** (2 de 2 na prévia antiga). O novo toca **4,63 s de 4,63 s, com mergulho**.
2. **iOS/Safari**: `play()` logo de saída, mais o atributo `autoplay` (mudo + `playsinline`). O relógio começa no `playing`, não no `canplaythrough`. O limite passou a ser "duração + 3 s a partir do 1º quadro", e só encerra se o vídeo parou de avançar.
3. **`play()` recusado**: tenta de novo em `canplay`. Se falhar de vez, o pôster fica com um botão grande, "Reproduzir a abertura", em vez de pular.
4. **Toque no overlay**: não pula mais. Só "Pular" e Esc.

Testes:

- Chromium, cache frio e Fast 4G, na prévia: tocou 4,63/4,63 s, com mergulho.
- Chromium com `stalled` falso: inteira.
- WebKit do Playwright: esse navegador de teste recusa qualquer `play()` sem gesto, mesmo mudo e com janela (política do ambiente, não do Safari real). O fallback funcionou: o botão aparece, e um toque toca 4,63/4,63 s com mergulho, a 1440 e a 390.
- "Pular" e Esc fecham; clique no overlay não fecha.
- Testes permanentes em `tests/e2e/abertura-consentimento.spec.ts`.
- ⚠️ Ainda falta conferir num iPhone e num Safari de verdade.

### B) Aviso de cookies e privacidade (LGPD)

- **Componente `Consentimento.astro`, em todas as páginas e nas duas línguas:** barra fixa no rodapé com texto curto e verdadeiro e link para a política. "Aceitar" e "Recusar" têm o mesmo estilo. A escolha fica em `localStorage` (`lk-consentimento`: `{valor: aceito|recusado, data}`).
- **Nunca por cima da abertura:** a barra espera a classe `lk-abre` sair do `<html>`.
- **Beacon do Cloudflare Web Analytics só depois de "Aceitar":** saiu do `Base.astro`. Testado com um build com token de teste e a chamada interceptada:
  - 0 requisições antes da escolha e depois de "Recusar";
  - 1 requisição depois de "Aceitar";
  - em cada página nova, só se aceito.
- **"Preferências de cookies" no rodapé** reabre a barra com o foco em "Aceitar". Depois da escolha, o foco volta ao link.
- **/privacidade e /en/privacy:** seção nova, "Cookies e armazenamento local". Diz o que fica no navegador (sessão da abertura e do logo, o código do link de e-mail do CRM e a escolha de consentimento), que a medição é anônima, sem cookies e só com aceite, e como mudar a escolha. Nenhum selo novo.
- **Acessibilidade e layout:**
  - `role=region` com rótulo; axe 0 violações na barra; Tab chega no link, em "Aceitar" e em "Recusar".
  - A 360 px, fica **acima** da barra de atalhos da home (não cobre o CTA).
  - **CLS 0**: posição fixa, e o espaço no fim da página é reservado só enquanto a barra está aberta.
- ⚠️ Se o Web Analytics estiver ligado no painel da Cloudflare em modo **automático** (injeção pelo Pages), ele não passa por esse aviso. Use só o token por variável (`PUBLIC_CF_ANALYTICS_TOKEN`).

### Drones aéreos, humanoides e aquáticos

- **Textos (PT/EN):** "quadrúpede" virou "robô humanoide" no nome do case (cartão), na meta de /robotica, em "Terra" ("inspeção de painéis e máquinas, leitura de instrumentos e rondas em áreas de risco"), no passo "Escolhemos a plataforma" e em `products.robotics`. Nenhuma ocorrência de "quadrúpede/quadruped" no site gerado.
- **Animação de traço:** reprovada e removida.
- **Imagem aprovada** (`humanoide-energia.jpg`, webp 1280 e 480): está no cartão e no hero de /robotica, com zoom lento (1 → 1,04 em 14 s) e brilho do feixe do drone (opacidade 0,15 ↔ 0,45). Fica parada com reduced motion. A home não tem esse case, então não entrou lá.

### Merge com a main (PR #51, rastreio do CRM)

`origin/main` entrou na branch antes do deploy. O `Base.astro` mantém o script `rastreio-crm` e o aviso de cookies. Unit 58/58 (inclui `rastreio-crm.test.ts`) e e2e **101/101**.

### Perguntas novas

13. **O aviso no CRM** (o `?r=OP-…` dos e-mails avisa "site visitado") roda sem esperar o "Aceitar". Ele não manda dado pessoal, só o código do card, e está descrito na política. Quer que ele também dependa do aceite?
14. **Testar a abertura num iPhone real** (Safari e modo economia de energia) antes de produção: o ambiente de testes não reproduz o autoplay do Safari.

## Rodada 4 (12/11/2026): CRM com aceite e abertura sem vídeo

**CRM (`?r=OP-…`)**

- O aviso agora espera o "Aceitar". Sem aceite, o código fica só na aba (`sessionStorage`) e nada é enviado. Se a pessoa aceitar depois, na mesma sessão e em qualquer página, ele vai uma vez só.
- O aviso de cookies dispara o evento `lk-consentimento`, que o script do CRM escuta.
- O texto da barra e a política (PT/EN) dizem isso.
- Testes: unit 59/59 e e2e com interceptação do `/api/crm/marco` (0 envios antes do aceite, 1 depois, 0 nas páginas seguintes).

**Abertura**

- **Sem `<video>`:** WebP animado num `<img>`, `public/media/home/abertura.webp`.
  - 93 quadros a 20 fps, 960×538, qualidade 55, method 6, loop 1: **586.736 bytes (573 KiB)**.
  - Mais `abertura-fim.webp` (último quadro estático, 12 KB).
  - O `abertura.mp4` e o `scripts/check-abertura.mjs` foram apagados.
- **Fluxo:**
  1. Pôster primeiro.
  2. `new Image()` + `decode()`.
  3. Troca pelo animado e conta 4,65 s.
  4. Congela no último quadro, mergulha e abre o site.

  Se o decode passar de 8 s, o pôster mergulha (sem corte seco). Do caminho saíram `play()`, `canplaythrough`, `stalled` e `waiting`.

- **Achado no WebKit:** um WebP com `loop=1` toca **duas vezes** no WebKit (no Chrome, uma). Por isso, no fim, a imagem animada é trocada pelo último quadro estático, já decodificado. O mergulho nunca vê a TV recomeçar.
- **Regras novas:**
  - storage bloqueado → toca (pode repetir);
  - save-data não pula mais;
  - reduced motion → versão calma (pôster escurecido + logo surgindo em 1,5 s, depois fade, sem TV piscando nem mergulho);
  - só "Pular" e Esc encerram antes da hora.
- **Matriz (com autoplay de mídia bloqueado de propósito):**

  | Caso                       | Animação na tela             | Mergulho        | Fechou |
  | -------------------------- | ---------------------------- | --------------- | ------ |
  | WebKit headless            | 0,01 s                       | 4,67 s          | 5,87 s |
  | WebKit com janela          | 0,04 s                       | 4,71 s          | 5,92 s |
  | iPhone 13 (emulação)       | 0,01 s                       | 4,67 s          | 5,87 s |
  | Chrome cache frio, Fast 4G | 0,74 s                       | 5,40 s          | 6,60 s |
  | Chrome cache frio, Slow 3G | — (573 KB não chegam em 8 s) | 8,01 s (pôster) | 9,21 s |
  | Reduced motion             | —                            | — (calma)       | 2,11 s |
  | Prévia, Chrome Fast 4G     | —                            | 5,58 s          | 6,79 s |
  | Prévia, iPhone 13          | —                            | 4,81 s          | 6,04 s |

- **Testes e2e novos:**
  - a abertura nunca fecha antes de 4 s sem "Pular" (com autoplay recusado e clique no overlay);
  - storage bloqueado toca;
  - "Pular" e Esc encerram;
  - a animação lenta toca inteira;
  - reduced motion mostra a versão calma, sem mergulho.

  Suíte completa: 101 passaram + 1 que dependia de tempo, corrigido e repetido 30/30.

- **Prints:** `prints/r4-abertura-*`, `prints/r4-previa-*`.
- ⚠️ **Slow 3G:** quem está numa rede assim vê o pôster mergulhar aos 8 s, sem a TV ligando. Se o Vitor quiser a animação até nessas redes, dá para gerar uma versão mais leve (por exemplo, 640 px).
