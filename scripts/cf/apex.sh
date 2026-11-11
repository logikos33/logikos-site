#!/usr/bin/env bash
# Raiz logikosvision.com.br -> site institucional (Worker "logikos-apex" na rota logikosvision.com.br/*).
# Uso: ./apex.sh [inventory|apply|verify|rollback]
# inventory e verify só leem. apply publica o Worker e a rota (não toca DNS, túnel, Pages nem regras).
# rollback remove só a rota do Worker: a raiz volta a ir direto para a origem de hoje.
set -euo pipefail
: "${CF_ZONE_TOKEN:?}" ; : "${CF_DEPLOY_TOKEN:?}" ; : "${CLOUDFLARE_ACCOUNT_ID:?}"
ZONE_NAME="logikosvision.com.br"; PATTERN="logikosvision.com.br/*"; SCRIPT="logikos-apex"
API="https://api.cloudflare.com/client/v4"
cf() { local t="$1"; shift; curl -sS -H "Authorization: Bearer $t" -H "Content-Type: application/json" "$@"; }
st() { jq -r '"  success=\(.success) " + ([.errors[]? | "erro \(.code): \(.message)"] | join("; "))'; }

zone_id() { cf "$CF_ZONE_TOKEN" "$API/zones?name=$ZONE_NAME" | jq -r '.result[0].id // empty'; }

inventory() {
  echo "--- tokens"
  for n in CF_ZONE_TOKEN CF_DEPLOY_TOKEN; do echo "$n:"; cf "${!n}" "$API/user/tokens/verify" | st; done
  local z; z=$(zone_id); echo "zone_id: ${z:-(sem Zone:Read)}"
  echo "--- DNS da raiz (só leitura)"
  [ -n "$z" ] && cf "$CF_ZONE_TOKEN" "$API/zones/$z/dns_records?name=$ZONE_NAME" | jq -r '.result[]? | "  \(.type) \(.name) -> \(.content) proxied=\(.proxied)"'
  echo "--- rotas de Worker na zona"
  for n in CF_ZONE_TOKEN CF_DEPLOY_TOKEN; do
    echo "com $n:"; local r; r=$(cf "${!n}" "$API/zones/$z/workers/routes"); echo "$r" | st
    echo "$r" | jq -r '.result[]? | "  \(.pattern) -> \(.script // "(nenhum)") id=\(.id)"'
  done
  echo "--- scripts de Worker na conta"
  for n in CF_ZONE_TOKEN CF_DEPLOY_TOKEN; do
    echo "com $n:"; local r; r=$(cf "${!n}" "$API/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts"); echo "$r" | st
    echo "$r" | jq -r '.result[]? | "  \(.id)"'
  done
  echo "--- estado público"; verify_publico
}

verify_publico() {
  for p in / /demo/ /experiencia/ /bs /en/ /api/status; do
    printf '  %-14s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://$ZONE_NAME$p")"
  done
  echo "  robots na raiz: $(curl -sI "https://$ZONE_NAME/" | grep -i '^x-robots-tag' || echo 'sem X-Robots-Tag')"
  echo "  título da raiz: $(curl -s "https://$ZONE_NAME/" | grep -o '<title>[^<]*' | head -1)"
}

apply() {
  # wrangler usa um token; tenta o de deploy e, se faltar permissão de rota, o de zona.
  for n in CF_DEPLOY_TOKEN CF_ZONE_TOKEN; do
    echo "--- wrangler deploy com $n"
    if CLOUDFLARE_API_TOKEN="${!n}" npx --yes wrangler@4 deploy --config workers/apex/wrangler.toml; then
      echo "publicado com $n"; sleep 20; verify_publico; return 0
    fi
  done
  echo "::error::nenhum token tem Workers Scripts:Edit (conta) + Workers Routes:Edit (zona). Nada foi alterado."; exit 3
}

rollback() {
  local z; z=$(zone_id)
  for n in CF_ZONE_TOKEN CF_DEPLOY_TOKEN; do
    local id; id=$(cf "${!n}" "$API/zones/$z/workers/routes" | jq -r --arg p "$PATTERN" '.result[]? | select(.pattern==$p) | .id' | head -1)
    if [ -n "$id" ]; then echo "removendo rota $PATTERN ($id) com $n"; cf "${!n}" -X DELETE "$API/zones/$z/workers/routes/$id" | st; sleep 20; verify_publico; return 0; fi
  done
  echo "rota $PATTERN não encontrada: nada a desfazer"
}

case "${1:-inventory}" in inventory) inventory ;; apply) apply ;; verify) verify_publico ;; rollback) rollback ;; *) echo "modo inválido"; exit 1 ;; esac
