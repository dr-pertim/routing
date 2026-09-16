#!/usr/bin/env node

/**
 * Adiciona Custom Domain ao Worker no Cloudflare
 * Assim que o CNAME é criado, registra o domínio no Worker
 */

import fs from 'fs'

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const ZONE_ID = process.env.ZONE_ID
const WORKER_ID = process.env.WORKER_ID || 'pertim-routing'

if (!TOKEN || !ACCOUNT_ID || !ZONE_ID) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID e ZONE_ID são obrigatórios')
  process.exit(1)
}

// Lê domínios do arquivo
const domainsData = JSON.parse(fs.readFileSync('./domains.json', 'utf8'))
const domains = domainsData.domains || []

console.log(`\n📋 Registrando ${domains.length} Custom Domain(s) no Worker\n`)

async function addCustomDomains() {
  let success = 0
  let failed = 0

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i]
    const step = `[${i + 1}/${domains.length}]`

    process.stdout.write(`${step} ${domain.padEnd(30)} ... `)

    try {
      // API endpoint pra adicionar Custom Domain
      const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/services/${WORKER_ID}/environments/production/routes`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pattern: `${domain}/*`,
          script: WORKER_ID,
          zone_id: ZONE_ID
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Registrado')
        success++
      } else if (data.errors?.[0]?.code === 10014) {
        // Já existe
        console.log('✓ Já registrado')
        success++
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
