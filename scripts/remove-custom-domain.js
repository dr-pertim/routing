#!/usr/bin/env node

/**
 * Remove um Custom Domain do Worker (usado quando um hostname deixa de ser
 * roteado direto — ex.: domínio raiz que passou a só redirecionar pro
 * www via Redirect Rule do Cloudflare, em vez de passar pelo Worker).
 * Precisa listar primeiro pra achar o "id" do registro — a API de DELETE
 * não aceita hostname direto.
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const HOSTNAME = process.env.HOSTNAME

if (!TOKEN || !ACCOUNT_ID || !HOSTNAME) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID e HOSTNAME são obrigatórios')
  process.exit(1)
}

async function removeCustomDomain() {
  const listRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/domains`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  })
  const listData = await listRes.json()
  if (!listData.success) {
    console.error('❌ Erro ao listar Custom Domains:', listData.errors?.[0]?.message)
    process.exit(1)
  }

  const match = listData.result?.find((d) => d.hostname === HOSTNAME)
  if (!match) {
    console.log(`✓ "${HOSTNAME}" não está registrado como Custom Domain (nada a fazer)`)
    return
  }

  const delRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/domains/${match.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  })
  // Esse endpoint pode responder 200 com corpo vazio (sem JSON) no sucesso.
  const raw = await delRes.text()
  const delData = raw ? JSON.parse(raw) : { success: delRes.ok }
  if (delData.success) {
    console.log(`✅ "${HOSTNAME}" removido do Worker`)
  } else {
    console.error('❌ Erro ao remover:', delData.errors?.[0]?.message || `HTTP ${delRes.status}`)
    process.exit(1)
  }
}

removeCustomDomain().catch((err) => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
