#!/usr/bin/env node

/**
 * Registra Custom Domains no Worker via API moderna do Cloudflare.
 * Endpoint: PUT /accounts/{account_id}/workers/domains
 * (é a mesma API por trás do botão "Add Custom Domain" na UI —
 * ela cria o DNS record automaticamente, não precisa criar CNAME antes)
 */

import fs from 'fs'

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const ZONE_ID = process.env.ZONE_ID
const WORKER_NAME = process.env.CLOUDFLARE_WORKER_NAME || 'pertim-routing'

if (!TOKEN || !ACCOUNT_ID || !ZONE_ID) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID e ZONE_ID são obrigatórios')
  process.exit(1)
}

// Lê domínios do arquivo
const domainsData = JSON.parse(fs.readFileSync('./domains.json', 'utf8'))
const domains = domainsData.domains || []

console.log(`\n📋 Registrando ${domains.length} Custom Domain(s) no Worker "${WORKER_NAME}"\n`)

async function addCustomDomains() {
  let success = 0
  let failed = 0

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i]
    const step = `[${i + 1}/${domains.length}]`

    process.stdout.write(`${step} ${domain.padEnd(30)} ... `)

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/domains`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            zone_id: ZONE_ID,
            hostname: domain,
            service: WORKER_NAME,
            environment: 'production'
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        console.log('✅ Registrado')
        success++
      } else if (data.errors?.[0]?.code === 100117) {
        // Já existe DNS record apontando pra outro lugar
        console.log(`❌ DNS já existe pra esse host (delete o record manual e tenta de novo)`)
        failed++
      } else {
        const msg = data.errors?.[0]?.message || `HTTP ${response.status}`
        console.log(`❌ ${msg}`)
        failed++
      }
    } catch (err) {
      console.log(`❌ ${err.message}`)
      failed++
    }
  }

  console.log(`\n📊 Resultado: ${success} ✅ | ${failed} ❌\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

addCustomDomains().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
