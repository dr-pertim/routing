#!/usr/bin/env node

/**
 * Cria o Redirect Rule "domínio raiz -> www" na zona do Cloudflare (API de
 * Rulesets, fase http_request_dynamic_redirect). Cada profissional tem seu
 * próprio domínio = sua própria zona, então este PUT substitui a fase
 * inteira só DAQUELA zona (não tem risco de apagar regra de outro site).
 *
 * Se um dia essa zona precisar de MAIS regras nessa fase (não só essa),
 * ajustar pra fazer GET antes e mesclar em vez de sobrescrever.
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ZONE_ID = process.env.ZONE_ID
const APEX = process.env.APEX_DOMAIN // ex.: "drandrerufino.com.br"
const TARGET = process.env.TARGET_DOMAIN || `www.${APEX}` // pra onde redireciona

if (!TOKEN || !ZONE_ID || !APEX) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN, ZONE_ID e APEX_DOMAIN são obrigatórios')
  process.exit(1)
}

async function setupRedirect() {
  const body = {
    rules: [
      {
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

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_dynamic_redirect/entrypoint`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()

  if (data.success) {
    console.log(`✅ Redirect configurado: ${APEX} → https://${TARGET}`)
  } else {
    console.error('❌ Erro ao criar redirect:', data.errors?.[0]?.message || `HTTP ${res.status}`)
    process.exit(1)
  }
}

setupRedirect().catch((err) => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
