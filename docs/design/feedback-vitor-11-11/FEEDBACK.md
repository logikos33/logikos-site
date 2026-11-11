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
