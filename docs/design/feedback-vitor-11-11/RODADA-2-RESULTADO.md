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
