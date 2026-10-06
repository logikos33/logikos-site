#!/usr/bin/env bash
# QR folder BrandSchutz -> WhatsApp (Plano A: Single Redirect, fase http_request_dynamic_redirect)
# Uso: CLOUDFLARE_API_TOKEN=... ./qr_bs_redirect.sh [inventory|apply|verify|rollback <ruleset_id> <rule_id>]
# Nunca imprime o token. Nunca faz DELETE. Nunca PUT em entrypoint que já tem regras.
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?defina CLOUDFLARE_API_TOKEN no ambiente}"  # token de ZONA: Zone:Read + DNS:Read + Zone Rulesets:Edit
ZONE_NAME="logikosvision.com.br"
TARGET='https://wa.me/554733048928?text=Ol%C3%A1%21%20Quero%20testar%20o%20Cloud%20Vision.'
API="https://api.cloudflare.com/client/v4"
cf() { curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" "$@"; }
need() { command -v "$1" >/dev/null || { echo "falta $1"; exit 1; }; }
need curl; need jq

zone_id() {
  local r; r=$(cf -w '\n%{http_code}' "$API/zones?name=$ZONE_NAME")
  local code; code=$(tail -n1 <<<"$r"); local body; body=$(sed '$d' <<<"$r")
  local id; id=$(jq -r '.result[0].id // empty' <<<"$body" 2>/dev/null || true)
  if [ -z "$id" ]; then
    echo "GET /zones?name=$ZONE_NAME -> HTTP $code" >&2
    jq -r '.errors[]? | "  api error \(.code): \(.message)"' <<<"$body" >&2 2>/dev/null || true
    [ "$code" = "200" ] && echo "  (200 com result vazio: token válido, mas sem Zone:Read nesta zona ou zona em outra conta)" >&2
  fi
  printf '%s' "$id"
}

inventory() {
  local z; z=$(zone_id); [ -n "$z" ] || { echo "zona $ZONE_NAME não encontrada (token sem Zone:Read ou zona fora da conta)"; exit 2; }
  echo "zone_id: $z"
  echo "--- DNS apex (somente leitura)"
  cf "$API/zones/$z/dns_records?name=$ZONE_NAME" | jq -r '.result[] | "\(.type) \(.name) proxied=\(.proxied) id=\(.id)"'
  cf "$API/zones/$z/dns_records?name=www.$ZONE_NAME" | jq -r '.result | if length==0 then "www: não existe" else .[] | "\(.type) \(.name) proxied=\(.proxied)" end'
  echo "--- entrypoint http_request_dynamic_redirect"
  local ep; ep=$(cf -w '\n%{http_code}' "$API/zones/$z/rulesets/phases/http_request_dynamic_redirect/entrypoint")
  local code; code=$(tail -n1 <<<"$ep"); local body; body=$(sed '$d' <<<"$ep")
  if [ "$code" = "404" ]; then echo "entrypoint: não existe (404)"; else
    echo "ruleset_id: $(jq -r '.result.id' <<<"$body")  regras: $(jq -r '.result.rules | length' <<<"$body")"
    jq -r '.result.rules[]? | "  rule id=\(.id) enabled=\(.enabled) desc=\(.description // "") expr=\(.expression)"' <<<"$body"
    jq -r '.result.rules[]? | select(.expression | test("/bs")) | "  >> JÁ CASA /bs: \(.id)"' <<<"$body"
  fi
  echo "--- Page Rules"
  cf "$API/zones/$z/pagerules" | jq -r '.result[]? | "  id=\(.id) status=\(.status) targets=\([.targets[].constraint.value]|join(","))"'
  echo "--- Worker routes"
  cf "$API/zones/$z/workers/routes" | jq -r '.result[]? | "  id=\(.id) pattern=\(.pattern) script=\(.script // "")"'
}

rule_json() { jq -n --arg t "$TARGET" '{
  description:"QR folder BrandSchutz -> WhatsApp",
  expression:"(http.host eq \"logikosvision.com.br\" and http.request.uri.path in {\"/bs\" \"/bs/\"})",
  action:"redirect",
  action_parameters:{from_value:{status_code:302,target_url:{value:$t},preserve_query_string:false}},
  enabled:true}'; }

apply() {
  local z; z=$(zone_id); [ -n "$z" ] || exit 2
  local ep; ep=$(cf -w '\n%{http_code}' "$API/zones/$z/rulesets/phases/http_request_dynamic_redirect/entrypoint")
  local code; code=$(tail -n1 <<<"$ep"); local body; body=$(sed '$d' <<<"$ep")
  if [ "$code" = "404" ]; then
    echo "entrypoint inexistente -> PUT com lista de uma regra"
    cf -X PUT "$API/zones/$z/rulesets/phases/http_request_dynamic_redirect/entrypoint" \
      --data "$(jq -n --argjson r "$(rule_json)" '{rules:[$r]}')" | jq '{success,errors,ruleset:.result.id,rules:[.result.rules[]|{id,description}]}'
  else
    local rs; rs=$(jq -r '.result.id' <<<"$body")
    local existing; existing=$(jq -r '[.result.rules[]? | select(.expression|test("/bs"))][0].id // empty' <<<"$body")
    if [ -n "$existing" ]; then
      echo "regra para /bs já existe ($existing) -> PATCH"
      cf -X PATCH "$API/zones/$z/rulesets/$rs/rules/$existing" --data "$(rule_json)" | jq '{success,errors}'
    else
      echo "entrypoint existe ($rs) -> POST nova regra (sem tocar nas demais)"
      cf -X POST "$API/zones/$z/rulesets/$rs/rules" --data "$(rule_json)" | jq '{success,errors,ruleset:.result.id,rules:[.result.rules[]|{id,description}]}'
    fi
  fi
}

verify() {
  for i in $(seq 1 12); do
    loc=$(curl -sI "https://$ZONE_NAME/bs" | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')
    [ "$loc" = "$TARGET" ] && break; sleep 5
  done
  for p in /bs /bs/; do echo "== $p"; curl -sI "https://$ZONE_NAME$p" | grep -iE '^(HTTP|location)'; done
  echo "== destino"; curl -sI "$TARGET" | grep -iE '^(HTTP|location)'
  for p in / /bsx; do echo "== $p (não deve ir ao WhatsApp)"; curl -sI "https://$ZONE_NAME$p" | grep -iE '^(HTTP|location)' || true; done
}

rollback() { # desativa a regra (reversível; não deleta)
  local z; z=$(zone_id); cf -X PATCH "$API/zones/$z/rulesets/$1/rules/$2" --data '{"enabled":false}' | jq '{success,errors}'
}

case "${1:-inventory}" in
  inventory) inventory ;;
  apply) inventory; echo; apply; echo; verify ;;
  verify) verify ;;
  rollback) rollback "$2" "$3" ;;
  *) echo "uso: $0 inventory|apply|verify|rollback <ruleset_id> <rule_id>"; exit 1 ;;
esac
