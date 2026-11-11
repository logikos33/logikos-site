# Feedback do Vitor sobre o site v3 (11/11/2026)

Prints nesta pasta (print-7..10.png). Use o impeccable (só orientação; nunca rodar launcher/detect).

1. **Hero (print-7), desktop:** o Koda está embaixo/atrás da grade de vídeos, cortado. Reposicionar para ele
   aparecer inteiro e em destaque, sem sobrepor a grade. O controle "Pausar o movimento" **não pode ficar
   visível** (manter prefers-reduced-motion respeitado, sem esse botão na tela).
2. **Seção de canais (print-8):** trocar "modelo: FireSet v1 (YOLOX-S), treinado pela Logikos · vídeo de banco"
   por **modelo proprietário Logikos** (sem nome técnico de arquitetura). Os canais CH1..CH5 devem rodar em
   **carrossel automático** (troca sozinha, indicador de progresso, dá para navegar), não em botões que a pessoa
   precisa clicar para descobrir.
3. **CTA final "Quer ver isso nas suas câmeras?" (print-9):** o botão vira **"Teste na câmera do seu celular"**
   (um clique) e leva para a demo de câmera no celular (a mesma do card "Teste com a sua câmera / Abrir a demo").
   Falar com especialista pode ficar como ação secundária.
4. **"Funcionando na frente de todo mundo" (print-10):** a parte do vídeo da Fireshow está desorganizada (vídeo
   vertical alto ao lado de cards baixos, sobra vazio). Organizar proporção, alinhamento, altura dos cards e
   legenda, no desktop e no celular.

Entrega: prints antes/depois (desktop 1440 e celular 390) nesta pasta, prévia publicada, resposta curta ao Vitor
com o link e o resumo.

## Rodada 2 (mesmo dia)

Print `print-11-rodape.png` (rodapé com todas as páginas: Recognition, Demos, Integradores, Robótica, Sobre,
Entrar, Como funciona, Plataforma, Twins, LGPD, Contato).

5. **Todas essas páginas** precisam ficar no padrão da identidade visual da home nova, com as imagens que já temos
   (cenários, Koda, Fireshow, demos) ou imagens reais — nada com cara de artefato/placeholder gerado.
6. **Em nenhuma página** citar nome de modelo, arquitetura ou hardware: nada de YOLO, YOLOX, RT-DETR, FireSet v1,
   NVIDIA, Jetson, "edge" com nome de placa etc. Falar "modelo proprietário Logikos" e "processamento na nuvem
   ou na planta". Varrer o repositório inteiro (páginas, metadados, alt, JSON, i18n PT e EN).
7. **Rodar o impeccable em todas as páginas** e deixar a navegação totalmente fluida e coerente com a home
   (header, transições, ritmo, CTAs para a experiência e para a demo no celular).
8. **Bug:** na primeira visita, o vídeo de abertura (TV) **pula** quando o site carrega muito rápido. A abertura
   precisa tocar inteira (ou até o "Pular") mesmo com o site já carregado — não pode ser cortada pelo fim do
   carregamento; testar com cache vazio e rede rápida/lenta, desktop e celular.

## Rodada 3 (sobre a prévia pr-48)

9. **Canais da home (print-12):** ainda não é carrossel — continua parecendo abas (CH1..CH5 em botões). Precisa
   ser um **carrossel de verdade**: os slides (vídeo + painel do alerta) deslizam um após o outro, com arrasto/
   swipe no celular, setas discretas e indicadores (pontos ou régua) — os nomes dos canais podem ficar como
   indicador, não como botões de aba em destaque. Troca automática continua, pausando no hover/foco/fora da tela.
10. **Logos (print-13):** a logo da **Visdec está cortada** (aparece "ISDEC"). Corrigir o recorte/viewBox e
    conferir as três logos alinhadas e com o mesmo peso visual.
11. **Contato / Falar com especialista (print-14):** transformar o formulário numa **conversa com o Koda**: ele
    pergunta uma coisa de cada vez (nome → empresa → e-mail → WhatsApp → cargo opcional → o que quer resolver,
    com chips dos interesses → mensagem opcional → consentimento com link da privacidade) e no fim responde
    "Obrigado, {nome}! Recebi tudo. Nossa equipe entra em contato assim que possível." Dá para voltar e corrigir
    uma resposta; funciona no teclado e no leitor de tela; celular primeiro.
    **Destino: CRM** (não o KV/e-mail atual): `POST https://brandschutz.logikosvision.com.br/api/lead` com
    `Content-Type: text/plain` (JSON no corpo; CORS já liberado para logikosvision.com.br e
    *.logikos-site.pages.dev). Campos: `origem: "site-logikos-contato"` (o CRM grava como "Site Logikos"),
    `nome`, `empresa`, `email`, `telefone`, `cargo`, `interesse` (texto com os chips), `notas` (mensagem),
    `consentimento: true`, `consentimento_em` (ISO), `consentimento_texto` (o texto exato do aceite),
    `event_id` (uuid, evita duplicar), `pagina`, `website: ""` (honeypot, deixe vazio). Resposta `{ok:true}`.
    Referência do contrato: `~/logikos/cvw-wt/crm/onboarding/servidor/leads.ts` (receberLead) e
    `src/features/funil/leads.ts`. NÃO teste contra produção com dados falsos — intercepte nos e2e; se precisar de
    um envio real de ponta a ponta, use e-mail `teste+site@logikosvision.com.br` uma única vez e avise no resumo.
    Mantenha o Turnstile só se não atrapalhar a conversa (o CRM já tem honeypot e limite por IP).
    O "Falar com especialista" de todo o site leva para essa conversa.
12. **Fundo do site (pedido extra):** em vez do preto cru, um **loop bem leve de TV antiga** no fundo de todas as
    páginas: scanlines finas, grão/estática sutil e um flicker raro e discreto (nada de glitch forte nem cores
    berrantes). Em CSS (pseudo-elemento fixo + animação) ou um tile pequeno; sem custo de desempenho (manter
    Lighthouse ≥ 0,95, sem repaint pesado), contraste do texto AA intacto, e parado com prefers-reduced-motion.
13. **Blocos de dados no fundo preto (print-15-dados-densos.png, ex.: "Uma câmera, cinco vereditos" na página
    Recognition):** texto denso solto no preto fica pesado e se dissolve. Onde houver dados/tabelas/listas
    comparativas, usar **containers claros (cards brancos/claros)** ou superfícies de destaque para agrupar e
    dar respiro — o fundo preto continua, mas a informação fica em superfícies legíveis. Rodar o impeccable com
    foco em UX de leitura: hierarquia (rótulo pequeno x conteúdo), escaneabilidade (um cartão por cenário, ícone,
    3 colunas viram cartão empilhado no celular), menos texto por linha, contraste AA no claro (#6B717A para
    secundário, nunca #8A8F98 no claro). Aplicar em TODAS as páginas com blocos assim (Recognition, Como funciona,
    Plataforma, Integradores, LGPD, Sobre...), mantendo a identidade.

## Rodada 4 (prints r4-print-16..23)

14. **Logo do site sem "VISION" (r4-print-20):** o header (e rodapé, favicon onde couber) tem que usar o lockup
    **Logikos Vision aprovado** (LOGIKOS oficial + "VISION" menor alinhado à direita embaixo — direção A).
    Fontes: `~/logikos/cvw-wt/unificada/src/brand/logikos/assets/abertura-lockup.svg` (VISION em path) e
    `~/Documents/Logikos/Marca/oficial/vision/v2/ESBOCO.html` (direções A/B/C e medidas). Os arquivos da raiz de
    `vision/` (glitch colorido) foram REPROVADOS — não usar. No header pequeno, se o A ficar ilegível, use a direção
    B (LOGIKOS | VISION numa linha) — mostre as duas no print.
15. **Logo da Visdec ainda aparece cortada para o Vitor.** Resolver de vez a partir do brandbook da Visdec
    (procure em `~/logikos/recognition-demo-evento/marcas/visdec/`, no repo do site e em `marca-visdec/`).
    Suspeita forte: a faixa de logos virou letreiro deslizante com máscara/esfumado nas pontas — quando a Visdec
    passa pela borda, aparece cortada. Troque por **fila estática** das três logos (CATH, BrandSchutz, Visdec),
    inteiras, sem máscara, mesma altura visual, em desktop e celular. Os clientes **autorizaram** o uso das
    logos e imagens.
16. **Página Como funciona — "Na planta, mesmo sem internet" (r4-print-18):** o vazio à direita recebe a
    **animação da caixa Logikos abrindo**, mostrando o equipamento, o cabo de rede e o cabo de energia; toca
    **uma vez** quando a seção entra na tela pela primeira vez (IntersectionObserver), parada em reduced-motion.
    Reaproveite as fotos/sequência da caixa da experiência Logikos (`~/logikos/cvw-wt/unificada/public/experiencia/
logikos/` — caixa-frente, caixa-aberta, equipamento; e a lógica de abertura em sequência da E2) — sem Artlist.
17. **Plataforma (r4-print-19):** reduzir os vazios grandes entre seções. **Licença** vira condições: mensal,
    anual ou **bienal**, com a bienal em destaque como recomendada: "2 anos sem se preocupar com os seus modelos:
    atualizações constantes por conta da Logikos" (sem preço; texto curto, cartões lado a lado, bienal destacada).
18. **Demos (r4-print-16 e 21):** espaçamento entre as demos grande demais — compactar, alinhar vídeo e texto,
    menos ar morto. (A página da demo em si, r4-print-17, vai para outra frente: ver item 21.)
19. **Formulário "Criar conta" (r4-print-22):** enxugar para **Nome, Empresa, Quantidade de câmeras, Contato
    (e-mail ou WhatsApp) e Modelo de interesse** (chips) + aceite. Layout organizado e compacto, em coluna lateral
    ao texto no desktop. Enviar ao CRM como a conversa do Koda (`POST .../api/lead`, text/plain,
    `origem: "site-logikos-conta"`, `faixa_cameras`/`cameras`, `interesse`). Aplicar o mesmo enxugamento no
    formulário de Integradores (origem `site-logikos-integrador`).
20. **Tirar o Cloudflare Turnstile de todos os formulários (r4-print-23).** O único clique obrigatório é a
    caixa "Li e aceito a política de privacidade". (O CRM já tem honeypot e limite por IP.)
21. **Demo no celular dentro do site:** outra frente (não sua) vai colocar a demo de câmera com a identidade do
    site em `https://logikosvision.com.br/teste-no-seu-celular/`. Quando eu avisar, troque `PHONE_DEMO_URL` em
    `src/config/links.ts` e os links "Abrir a demo"/"Teste na câmera do seu celular" para esse endereço.

Use o impeccable em tudo. Mesma PR #48; espere a prévia publicar e confira cada item nela (com print) antes de
responder. 22. **LGPD/Privacidade:** remover "Encarregado (DPO): a definir." (e qualquer "a definir" visível ao público) em
PT e EN. Deixar só "Pelo e-mail vitor@logikosvision.com.br." 23. **Monitores "CAM 07 · aguardando sinal" (r4-print-27, e o "CAM 07 · a sua" do hero):** não deixar o
quadro preto. Colocar um **loop de "aguardando conexão"** estilo monitor de CFTV/TV antiga: estática/chuvisco
suave, barras de sincronia ou varredura passando, um indicador "conectando…" pulsando, timestamp correndo —
leve (CSS/canvas pequeno, sem vídeo pesado), legível por cima (botão e texto com contraste AA), parado em
reduced-motion. Aplicar em todos os monitores CAM 07 do site. 24. **"Uma câmera, cinco vereditos" (r4-print-28, Recognition):** melhorar o conteúdo dos cartões com o
impeccable — linguagem de benefício para quem decide (o que muda na operação), menos jargão ("veredito por
região", "indeterminado"), mais concreto (exemplo de alerta/indicador de cada um), hierarquia melhor (rótulos
mono pequenos estão fracos). O grid 3+2 deixa um buraco: usar o 6º espaço para um **cartão de chamada**
(não em todos os cartões): **"Traga os seus indicadores para a plataforma"** — sinalizando que leituras,
alertas e painéis são customizáveis para a operação do cliente, com CTA "Falar com especialista" (leva à
conversa com o Koda, interesse "customização"). Visual diferente dos demais (destaque da marca), AA. 25. **O Vitor está repetindo feedback (r4-print-29, Recognition: "Painel na sua marca…" e "Rode o modelo no seu
navegador").** Pare de corrigir página por página: faça uma **varredura GLOBAL** e trate como regra do site:
a. **Espaçamento vertical:** reduzir o padding/gap entre seções no token/componente compartilhado (não por
página). Nenhuma seção pode ter faixa vazia maior que ~1 tela de respiro; meça em 1440×900 e 390 em TODAS as
páginas e mostre antes/depois.
b. **Metade direita vazia:** toda seção de texto que ocupa só a coluna esquerda no desktop ganha conteúdo ao
lado (imagem real, card, monitor, animação existente) ou vira layout de largura cheia. Nada de meia tela
preta.
c. **Sem detalhe técnico para o público:** tirar frases como "Rode o modelo no seu navegador", "o modelo roda no
seu aparelho", "Nada é enviado", "Duas demos abertas", selos "no ar", "chip", "demo genérica de detecção",
"taxa de alarme falso medida" e afins. Fale de benefício e do que a pessoa vê. As demos viram UMA chamada:
"Teste na câmera do seu celular" (vai para /teste-no-seu-celular/ quando eu liberar).
d. **Licença:** em TODO o site (Recognition, Plataforma, Integradores, i18n), "Licença por prazo de 24 meses"
vira as condições mensal / anual / **bienal destacada** ("2 anos sem se preocupar com os seus modelos:
atualizações constantes por conta da Logikos").
e. **Páginas de modelo/produto incompletas:** cada cenário (fogo, EPI, contagem, qualidade, ergonomia, zonas)
precisa dizer o que resolve, o que a pessoa recebe, um exemplo concreto e o próximo passo — sem nomes técnicos.
Antes de responder, abra CADA página da prévia publicada em 1440 e 390, e confira os itens 9 a 25 um a um numa
tabela (ok/corrigido + print). Não declare pronto sem essa conferência. 26. **Página Sobre (r4-print-30) — está rasa, precisa de sentimento:**
a. CTA secundário do herói: trocar "Falar com especialista" por **"Solicite seu modelo customizado"** (leva à
conversa com o Koda com interesse "modelo customizado").
b. **Enriquecer o texto** (impeccable, tom humano, PT e EN, sem nome técnico de modelo/hardware): quem somos e
por que existimos; **visão computacional** explicada para quem decide (a câmera que já existe passa a
entender o que vê); **Indústria 4.0** (dados da operação em tempo real, decisões mais rápidas); as outras
frentes da Logikos — **robótica, drones**, gêmeos digitais — como parte da mesma visão; e o sentimento:
**inovadores natos, apaixonados por tecnologia**, engenharia que prova antes de prometer, feito em
Indaial/SC, no Vale do Itajaí. Estrutura sugerida: manifesto curto → o que fazemos (cartões por frente) →
como trabalhamos (piloto acompanhado, prova antes) → onde estamos → CTA "Solicite seu modelo customizado".
Nada inventado: sem números, clientes ou prêmios que não estejam no repo/docs; o que faltar vira pergunta.
c. Aplicar a regra do item 25 aqui também (espaço vazio grande entre seções, metade direita vazia na seção
Indaial/SC; "o vídeo contínuo não sai" é detalhe técnico — reescrever como benefício).
