#!/usr/bin/env node

/**
 * Garante um registro DNS "placeholder" proxied pro domínio raiz — sem
 * nenhum A/AAAA/CNAME, o Cloudflare nem responde pelo hostname, e o
 * Redirect Rule nunca chega a rodar (o domínio simplesmente não resolve).
 * 192.0.2.1 é um IP reservado pra documentação (TEST-NET-1, RFC 5737) —
 * nunca é contatado de verdade: como o registro fica Proxied, o Cloudflare
 * intercepta a requisição e aplica o Redirect Rule antes de tentar
 * alcançar esse IP.
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ZONE_ID = process.env.ZONE_ID
const APEX = process.env.APEX_DOMAIN

if (!TOKEN || !ZONE_ID || !APEX) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN, ZONE_ID e APEX_DOMAIN são obrigatórios')
  process.exit(1)
}

const API_BASE = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`
const HEADERS = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

async function ensurePlaceholder() {
  // Já existe algum A/AAAA/CNAME pro domínio raiz (name = APEX, "@" na UI)?
  const listRes = await fetch(`${API_BASE}?name=${encodeURIComponent(APEX)}`, { headers: HEADERS })
  const listData = await listRes.json()
  if (!listData.success) {
    console.error('❌ Erro ao listar DNS records:', listData.errors?.[0]?.message)
    process.exit(1)
  }

  const existing = listData.result?.find((r) => ['A', 'AAAA', 'CNAME'].includes(r.type))
  if (existing) {
    console.log(`✓ Já existe um registro ${existing.type} pra "${APEX}" (id ${existing.id}) — nada a fazer`)
    return
  }

  const createRes = await fetch(API_BASE, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      type: 'A',
      name: APEX,
      content: '192.0.2.1',
      proxied: true,
      ttl: 1,
      comment: 'Placeholder — só existe pra ativar o Redirect Rule raiz->www. Nunca é contatado de verdade.',
    }),
  })
  const createData = await createRes.json()
  if (createData.success) {
    console.log(`✅ Registro A placeholder criado pra "${APEX}" (proxied)`)
  } else {
    console.error('❌ Erro ao criar DNS record:', createData.errors?.[0]?.message || `HTTP ${createRes.status}`)
    process.exit(1)
  }
}

ensurePlaceholder().catch((err) => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
