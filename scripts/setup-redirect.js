#!/usr/bin/env node

/**
 * Cria/atualiza o Redirect Rule "domínio raiz -> www" na zona do Cloudflare
 * (produto "Single Redirects", API de Rulesets). Cada profissional tem seu
 * próprio domínio = sua própria zona, então isso não arrisca sobrescrever
 * regra de outro site.
 *
 * Endpoint certo (doc oficial: developers.cloudflare.com/rules/url-forwarding
 * /single-redirects/create-api/) é o genérico /zones/{id}/rulesets — NÃO o
 * atalho /rulesets/phases/{phase}/entrypoint (que dava "Authentication
 * error" mesmo com a permissão certa no token).
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ZONE_ID = process.env.ZONE_ID
const APEX = process.env.APEX_DOMAIN // ex.: "drandrerufino.com.br"
const TARGET = process.env.TARGET_DOMAIN || `www.${APEX}` // pra onde redireciona

if (!TOKEN || !ZONE_ID || !APEX) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN, ZONE_ID e APEX_DOMAIN são obrigatórios')
  process.exit(1)
}

const PHASE = 'http_request_dynamic_redirect'
const API_BASE = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}`
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

function rulesetBody() {
  return {
    name: 'Redirect rules ruleset',
    kind: 'zone',
    phase: PHASE,
    rules: [
      {
        ref: `apex_to_www_${APEX.replace(/[^a-z0-9]/gi, '_')}`,
        description: `apex -> www (${APEX} -> ${TARGET})`,
        expression: `(http.host eq "${APEX}")`,
        action: 'redirect',
        action_parameters: {
          from_value: {
            status_code: 301,
            target_url: {
              expression: `concat("https://${TARGET}", http.request.uri.path)`,
            },
            preserve_query_string: true,
          },
        },
      },
    ],
  }
}

async function setupRedirect() {
  // 1) Existe ruleset nessa fase? (GET do atalho por fase só pra achar o id —
  //    não usamos PUT nele, só pra descobrir se precisa POST ou PUT/{id})
  const getRes = await fetch(`${API_BASE}/rulesets/phases/${PHASE}/entrypoint`, { headers: HEADERS })
  const getData = await getRes.json()
  const existingId = getData.success ? getData.result?.id : null

  const url = existingId ? `${API_BASE}/rulesets/${existingId}` : `${API_BASE}/rulesets`
  const method = existingId ? 'PUT' : 'POST'

  const res = await fetch(url, { method, headers: HEADERS, body: JSON.stringify(rulesetBody()) })
  const data = await res.json()

  if (data.success) {
    console.log(`✅ Redirect configurado (${method}): ${APEX} → https://${TARGET}`)
  } else {
    console.error('❌ Erro ao criar redirect:', data.errors?.[0]?.message || `HTTP ${res.status}`)
    console.error(JSON.stringify(data.errors, null, 2))
    process.exit(1)
  }
}

setupRedirect().catch((err) => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
