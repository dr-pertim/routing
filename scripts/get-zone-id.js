#!/usr/bin/env node

/**
 * Pega o Zone ID de um domínio no Cloudflare
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const DOMAIN = process.env.DOMAIN

if (!TOKEN || !DOMAIN) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN e DOMAIN são obrigatórios')
  console.error('Uso: CLOUDFLARE_API_TOKEN=xxx DOMAIN=exemplo.com.br node scripts/get-zone-id.js')
  process.exit(1)
}

async function getZoneId() {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()

    if (!data.success) {
      console.error('❌ Erro ao buscar zona:', data.errors?.[0]?.message)
      process.exit(1)
    }

    const zone = data.result?.[0]
    if (!zone) {
      console.error(`❌ Domínio "${DOMAIN}" não encontrado no Cloudflare`)
      process.exit(1)
    }

    console.log(zone.id)

  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
}

getZoneId()
