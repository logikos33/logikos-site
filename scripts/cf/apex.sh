#!/usr/bin/env bash
# Raiz logikosvision.com.br -> site institucional (Worker "logikos-apex" na rota logikosvision.com.br/*).
# Uso: ./apex.sh [inventory|apply|verify|rollback|ponte|ponte-rollback|www|www-rollback]
# www: põe o site no domínio www.logikosvision.com.br (domínio personalizado do Pages + CNAME www).
# Nenhum modo toca MX/TXT (e-mail Titan), o túnel, brandschutz.* ou outros registros da zona.
# inventory e verify só leem. apply publica o Worker e a rota (não toca DNS, túnel, Pages nem regras).
# rollback remove só a rota do Worker: a raiz volta a ir direto para a origem de hoje.
set -euo pipefail
: "${CF_ZONE_TOKEN:?}" ; : "${CF_DEPLOY_TOKEN:?}" ; : "${CLOUDFLARE_ACCOUNT_ID:?}"
ZONE_NAME="logikosvision.com.br"; PATTERN="logikosvision.com.br/*"; SCRIPT="logikos-apex"
WWW="www.logikosvision.com.br"; PROJECT="logikos-site"; PAGES_HOST="logikos-site.pages.dev"
WWW_COMMENT="logikos-site: www no Pages (cf-apex www)"
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
  for p in / /demo/ /teste-no-seu-celular/ /experiencia/ /bs /en/; do
    printf '  %-24s %s\n' "$ZONE_NAME$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://$ZONE_NAME$p")"
  done
  for p in / /en/ /recognition /contato; do
    printf '  %-24s %s\n' "$WWW$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://$WWW$p")"
  done
  echo "  título do www: $(curl -s "https://$WWW/" | grep -o '<title>[^<]*' | head -1)"
  echo "  robots no www: $(curl -sI "https://$WWW/" | grep -i '^x-robots-tag' || echo 'sem X-Robots-Tag (indexável)')"
  echo "  brandschutz.$ZONE_NAME: $(curl -s -o /dev/null -w '%{http_code}' "https://brandschutz.$ZONE_NAME/")"
  echo "  MX: $(curl -s -H 'accept: application/dns-json' "https://cloudflare-dns.com/dns-query?name=$ZONE_NAME&type=MX" | jq -r '[.Answer[]?.data] | join(", ")')"
}

# --- www no Pages ---------------------------------------------------------------------------
# Domínio personalizado do projeto Pages + CNAME www -> logikos-site.pages.dev (proxied). Se já
# houver um registro www apontando para outro lugar, aborta sem mexer.
www() {
  local z; z=$(zone_id); [ -n "$z" ] || { echo "sem zona"; exit 2; }
  echo "--- domínio $WWW no Pages ($PROJECT)"
  local ok=""
  for n in CF_DEPLOY_TOKEN CF_ZONE_TOKEN; do
    local r; r=$(cf "${!n}" -X POST "$API/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT/domains" --data "{\"name\":\"$WWW\"}")
    echo "com $n:"; echo "$r" | st
    if jq -e '.success or ([.errors[]?.message // ""] | any(test("already"; "i")))' >/dev/null <<<"$r"; then ok=1; break; fi
  done
  [ -n "$ok" ] || { echo "::error::nenhum token adicionou o domínio no Pages. Nada mais foi alterado."; exit 3; }
  echo "--- DNS: CNAME $WWW -> $PAGES_HOST (proxied)"
  local rec; rec=$(cf "$CF_ZONE_TOKEN" "$API/zones/$z/dns_records?name=$WWW")
  local cur; cur=$(jq -r '.result[0] | if . then "\(.type) \(.content)" else "" end' <<<"$rec")
  if [ "$cur" = "CNAME $PAGES_HOST" ]; then echo "  já existe: $cur"
  elif [ -n "$cur" ]; then echo "::error::$WWW já aponta para '$cur'. Não sobrescrevo; decida antes."; exit 4
  else
    local body; body=$(jq -n --arg n "$WWW" --arg c "$PAGES_HOST" --arg m "$WWW_COMMENT" '{type:"CNAME",name:$n,content:$c,proxied:true,ttl:1,comment:$m}')
    local done_dns=""
    for n in CF_ZONE_TOKEN CF_DEPLOY_TOKEN; do
      local r; r=$(cf "${!n}" -X POST "$API/zones/$z/dns_records" --data "$body"); echo "com $n:"; echo "$r" | st
      if jq -e '.success' >/dev/null <<<"$r"; then done_dns=1; break; fi
    done
    [ -n "$done_dns" ] || { echo "::error::nenhum token tem DNS:Edit. O domínio ficou pendente no Pages; rode www-rollback ou crie o CNAME."; exit 5; }
  fi
  echo "--- aguardando o Pages validar o domínio (até 10 min)"
  for _ in $(seq 1 40); do
    local s; s=$(cf "$CF_DEPLOY_TOKEN" "$API/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT/domains/$WWW" | jq -r '.result.status // "?"')
    echo "  status: $s"; [ "$s" = "active" ] && break; sleep 15
  done
  verify_publico
}

# Desfaz só o que o modo www criou: o domínio no Pages e o CNAME com o comentário do cf-apex.
www_rollback() {
  local z; z=$(zone_id)
  for n in CF_DEPLOY_TOKEN CF_ZONE_TOKEN; do
    local r; r=$(cf "${!n}" -X DELETE "$API/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT/domains/$WWW"); echo "domínio no Pages com $n:"; echo "$r" | st
    jq -e '.success' >/dev/null <<<"$r" && break
  done
  local id; id=$(cf "$CF_ZONE_TOKEN" "$API/zones/$z/dns_records?name=$WWW" | jq -r --arg m "$WWW_COMMENT" '.result[]? | select(.comment==$m) | .id' | head -1)
  if [ -n "$id" ]; then
    for n in CF_ZONE_TOKEN CF_DEPLOY_TOKEN; do
      local r; r=$(cf "${!n}" -X DELETE "$API/zones/$z/dns_records/$id"); echo "CNAME com $n:"; echo "$r" | st
      jq -e '.success' >/dev/null <<<"$r" && break
    done
  else echo "CNAME do cf-apex não encontrado: nada a desfazer no DNS"; fi
  sleep 20; verify_publico
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

# --- Ponte (só com Zone Rulesets:Edit, que o token de zona já tem) -------------------------
# A raiz redireciona com 302 para o site: o www (lançamento, 11/11/2026) ou, com
# PONTE_DESTINO=https://logikos-site.pages.dev, o endereço do Pages (como antes do lançamento). /demo, /teste-no-seu-celular, /experiencia e /bs ficam fora da regra e seguem como hoje.
PONTE_DESC="Raiz -> site institucional (ponte 302 até o Worker logikos-apex)"
PONTE_DESTINO="${PONTE_DESTINO:-https://$WWW}"
ponte_json() { jq -n --arg d "$PONTE_DESC" --arg t "$PONTE_DESTINO" '{
  description:$d,
  expression:"(http.host eq \"logikosvision.com.br\" and not starts_with(http.request.uri.path, \"/demo\") and not starts_with(http.request.uri.path, \"/experiencia\") and not starts_with(http.request.uri.path, \"/teste-no-seu-celular\") and not (http.request.uri.path in {\"/bs\" \"/bs/\"}))",
  action:"redirect",
  action_parameters:{from_value:{status_code:302,target_url:{expression:("concat(\"" + $t + "\", http.request.uri.path)")},preserve_query_string:true}},
  enabled:true}'; }

ponte() {
  local z; z=$(zone_id); [ -n "$z" ] || { echo "sem zona"; exit 2; }
  local ep; ep=$(cf "$CF_ZONE_TOKEN" -w '\n%{http_code}' "$API/zones/$z/rulesets/phases/http_request_dynamic_redirect/entrypoint")
  local code; code=$(tail -n1 <<<"$ep"); local body; body=$(sed '$d' <<<"$ep")
  [ "$code" = "200" ] || [ "$code" = "404" ] || { echo "ABORT: entrypoint HTTP $code"; exit 3; }
  if [ "$code" = "404" ]; then
    cf "$CF_ZONE_TOKEN" -X PUT "$API/zones/$z/rulesets/phases/http_request_dynamic_redirect/entrypoint" --data "$(jq -n --argjson r "$(ponte_json)" '{rules:[$r]}')" | st
  else
    local rs; rs=$(jq -r '.result.id' <<<"$body")
    local ex; ex=$(jq -r --arg d "$PONTE_DESC" '[.result.rules[]? | select(.description==$d)][0].id // empty' <<<"$body")
    if [ -n "$ex" ]; then cf "$CF_ZONE_TOKEN" -X PATCH "$API/zones/$z/rulesets/$rs/rules/$ex" --data "$(ponte_json)" | st
    else cf "$CF_ZONE_TOKEN" -X POST "$API/zones/$z/rulesets/$rs/rules" --data "$(ponte_json)" | st; fi
  fi
  sleep 20; verify_publico
}

ponte_rollback() {
  local z; z=$(zone_id)
  local body; body=$(cf "$CF_ZONE_TOKEN" "$API/zones/$z/rulesets/phases/http_request_dynamic_redirect/entrypoint")
  local rs; rs=$(jq -r '.result.id // empty' <<<"$body")
  local ex; ex=$(jq -r --arg d "$PONTE_DESC" '[.result.rules[]? | select(.description==$d)][0].id // empty' <<<"$body")
  [ -n "$ex" ] || { echo "ponte não encontrada: nada a desfazer"; return 0; }
  echo "removendo a regra da ponte ($ex), sem tocar nas demais"
  cf "$CF_ZONE_TOKEN" -X DELETE "$API/zones/$z/rulesets/$rs/rules/$ex" | st
  sleep 20; verify_publico
}

case "${1:-inventory}" in inventory) inventory ;; apply) apply ;; verify) verify_publico ;; rollback) rollback ;; ponte) ponte ;; ponte-rollback) ponte_rollback ;; www) www ;; www-rollback) www_rollback ;; *) echo "modo inválido"; exit 1 ;; esac
