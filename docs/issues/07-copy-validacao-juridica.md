---
title: 'copy: validação jurídica da política de privacidade e da página LGPD'
labels: [copy]
---

`/privacidade` e `/conformidade` têm texto provisório. Precisa de revisão jurídica antes do cutover:

- [ ] Bases legais (LGPD art. 7º, I e V) e versão da política gravada no consentimento (`PRIVACY_VERSION` em `src/lib/lead.ts`).
- [ ] Prazo de retenção dos leads (hoje "a definir") e encarregado (DPO) com canal de contato.
- [ ] Afirmação "sem cookies de rastreamento" com o Turnstile carregado nas páginas de formulário.
- [ ] Papéis controlador/operador e retenção de evidência descritos em `/conformidade` batem com o contrato-padrão.
- [ ] Alinhamento com o PL 2.338/2023 (Marco Legal da IA) na descrição do sistema.
