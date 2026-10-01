---
title: 'leads: publicar a fonte e o contrato HTTP do leads-collector (necessário para o site)'
labels: [leads]
---

O novo site (logikosvision.com.br, Cloudflare Pages) precisa enviar leads ao `leads-collector` (projeto Railway `recognition-leads`, `https://leads-collector-production.up.railway.app`). Hoje o serviço foi publicado por `railway up` sem fonte em nenhum repositório (#549), então o site grava em KV como fallback e **nada no Recognition foi alterado**.

**Contrato de que o site precisa (proposta):**

```http
POST /leads
Authorization: Bearer <token só de escrita, distinto do ADMIN_TOKEN>
Content-Type: application/json
```

```json
{
  "origem": "site",
  "tipo": "contact | partner",
  "idioma": "pt-br | en",
  "nome": "string ≤120",
  "empresa": "string ≤160",
  "cargo": "string ≤120 (opcional)",
  "email": "string ≤254",
  "whatsapp": "string ≤32 (opcional)",
  "interesses": ["fire", "epi", "ergonomics", "zones", "counting", "twins", "robotics", "partnership"],
  "mensagem": "string ≤4000 (opcional)",
  "consentimento": { "aceito": true, "versao_politica": "provisoria-2026-10", "em": "ISO 8601" },
  "pagina": "/contato",
  "recebido_em": "ISO 8601"
}
```

- `origem` precisa aceitar `"site"` (texto livre ou enum que inclua `site`).
- Resposta `2xx` = gravado; qualquer outra coisa faz o site cair no KV.
- Sem dado pessoal em log.

**Achados do inventário (01/10, somente leitura):** o backup diário para o R2 falha com `Invalid character in header content ["authorization"]` (#550, provável espaço/quebra de linha na credencial); há 2 leads gravados e 0 requisições HTTP em 7 dias; o serviço `recognition-leads` (homônimo do projeto) é um stub com o único deploy falho.
