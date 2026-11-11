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
