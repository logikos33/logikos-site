#!/usr/bin/env bash
# QR folder BrandSchutz -> site oficial (Plano A: Single Redirect, fase http_request_dynamic_redirect)
# Uso: CLOUDFLARE_API_TOKEN=... ./qr_bs_redirect.sh [inventory|apply|verify|rollback <ruleset_id> <rule_id>]
# Nunca imprime o token. Nunca faz DELETE. Nunca PUT em entrypoint que já tem regras.
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?defina CLOUDFLARE_API_TOKEN no ambiente}"  # token de ZONA: Zone:Read + DNS:Read + Zone Rulesets:Edit
ZONE_NAME="logikosvision.com.br"
TARGET='https://www.brandschutz.com.br/'
API="https://api.cloudflare.com/client/v4"
cf() { curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" "$@"; }
need() { command -v "$1" >/dev/null || { echo "falta $1"; exit 1; }; }
need curl; need jq

api_errors() { jq -r '.errors[]? | "  api error \(.code): \(.message)"' <<<"$1" 2>/dev/null || true; }

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
  echo "GET entrypoint -> HTTP $code"
  if [ "$code" = "404" ]; then echo "entrypoint: não existe (404) -> apply fará PUT com uma regra"
  elif [ "$code" != "200" ]; then echo "entrypoint: resposta inesperada"; api_errors "$body"
  else
    echo "ruleset_id: $(jq -r '.result.id' <<<"$body")  regras: $(jq -r '.result.rules | length' <<<"$body")"
    jq -r '.result.rules[]? | "  rule id=\(.id) enabled=\(.enabled) desc=\(.description // "") expr=\(.expression)"' <<<"$body"
    jq -r '.result.rules[]? | select(.expression | test("/bs")) | "  >> JÁ CASA /bs: \(.id)"' <<<"$body"
  fi
  echo "--- Page Rules"
  local pr; pr=$(cf -w '\n%{http_code}' "$API/zones/$z/pagerules"); echo "  HTTP $(tail -n1 <<<"$pr"), $(sed '$d' <<<"$pr" | jq -r '.result | length // 0') itens"
  sed '$d' <<<"$pr" | jq -r '.result[]? | "  id=\(.id) status=\(.status) targets=\([.targets[].constraint.value]|join(","))"'; api_errors "$(sed '$d' <<<"$pr")"
  echo "--- Worker routes"
  local wr; wr=$(cf -w '\n%{http_code}' "$API/zones/$z/workers/routes"); echo "  HTTP $(tail -n1 <<<"$wr"), $(sed '$d' <<<"$wr" | jq -r '.result | length // 0') itens"
  sed '$d' <<<"$wr" | jq -r '.result[]? | "  id=\(.id) pattern=\(.pattern) script=\(.script // "")"'; api_errors "$(sed '$d' <<<"$wr")"
}

rule_json() { jq -n --arg t "$TARGET" '{
  description:"QR folder BrandSchutz -> site",
  expression:"(http.host eq \"logikosvision.com.br\" and http.request.uri.path in {\"/bs\" \"/bs/\"})",
  action:"redirect",
  action_parameters:{from_value:{status_code:302,target_url:{value:$t},preserve_query_string:false}},
  enabled:true}'; }

apply() {
  local z; z=$(zone_id); [ -n "$z" ] || exit 2
  local ep; ep=$(cf -w '\n%{http_code}' "$API/zones/$z/rulesets/phases/http_request_dynamic_redirect/entrypoint")
  local code; code=$(tail -n1 <<<"$ep"); local body; body=$(sed '$d' <<<"$ep")
  if [ "$code" != "404" ] && [ "$code" != "200" ]; then
    echo "ABORT: GET entrypoint devolveu HTTP $code; não escrevo sem saber o estado atual"; api_errors "$body"; exit 3
  fi
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

diag() { # diagnóstico só leitura: DNS público, origem, resposta para user-agents de celular
  local z; z=$(zone_id)
  echo "--- DNS público (A)"
  for r in 1.1.1.1 8.8.8.8 208.67.222.222; do printf '  @%s: ' "$r"; dig +short A "$ZONE_NAME" @"$r" | tr '\n' ' '; echo; done
  echo "--- registro A na Cloudflare (conteúdo = IP da origem)"
  local origin; origin=$(cf "$API/zones/$z/dns_records?type=A&name=$ZONE_NAME" | jq -r '.result[0].content // empty')
  echo "  origem: ${origin:-?}"
  if [ -n "$origin" ]; then
    echo "--- o que a origem serve se o DNS do cliente pular a Cloudflare"
    for p in / /bs; do printf '  https://%s%s via %s -> ' "$ZONE_NAME" "$p" "$origin"
      curl -sk --max-time 10 -o /tmp/o.html -w '%{http_code} ' --resolve "$ZONE_NAME:443:$origin" "https://$ZONE_NAME$p" || printf 'falhou '
      grep -oiE '<title>[^<]{0,80}' /tmp/o.html 2>/dev/null | head -1; echo; done
  fi
  echo "--- /bs via Cloudflare com user-agents de celular"
  for ua in "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36"; do
    echo "  UA: ${ua:0:40}..."; curl -sI -A "$ua" "https://$ZONE_NAME/bs" | grep -iE '^(HTTP|location|cf-mitigated|cf-ray)' | sed 's/^/    /'
  done
  echo "--- http:// (sem s) /bs"; curl -sI "http://$ZONE_NAME/bs" | grep -iE '^(HTTP|location)' | sed 's/^/  /'
  echo "--- cabeçalhos completos de /bs"; curl -sI "https://$ZONE_NAME/bs" | sed 's/^/  /'
}

rollback() { # desativa a regra (reversível; não deleta)
  local z; z=$(zone_id); cf -X PATCH "$API/zones/$z/rulesets/$1/rules/$2" --data '{"enabled":false}' | jq '{success,errors}'
}

case "${1:-inventory}" in
  inventory) inventory ;;
  apply) inventory; echo; apply; echo; verify ;;
  verify) verify ;;
  diag) diag ;;
  rollback) rollback "$2" "$3" ;;
  *) echo "uso: $0 inventory|apply|verify|diag|rollback <ruleset_id> <rule_id>"; exit 1 ;;
esac
