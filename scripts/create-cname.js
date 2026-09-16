#!/usr/bin/env node

/**
 * Cria CNAME records no Cloudflare pra apontar pro Worker
 * Lê domains.json e cria CNAME pra cada domínio
 */

import fs from 'fs'

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ZONE_ID = process.env.ZONE_ID
const WORKER_URL = 'pertim-routing.lgabrich-c.workers.dev'

if (!TOKEN || !ZONE_ID) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN e ZONE_ID são obrigatórios')
  console.error(`  TOKEN: ${TOKEN ? '✓' : '✗'}`)
  console.error(`  ZONE_ID: ${ZONE_ID ? '✓' : '✗'}`)
  process.exit(1)
}

// Lê domínios do arquivo
const domainsData = JSON.parse(fs.readFileSync('./domains.json', 'utf8'))
const domains = domainsData.domains || []

console.log(`\n📋 Criando CNAMEs para ${domains.length} domínio(s)`)
console.log(`🔑 Zone ID: ${ZONE_ID}\n`)

async function createCNAMEs() {
  let success = 0
  let failed = 0

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i]
    const step = `[${i + 1}/${domains.length}]`

    process.stdout.write(`${step} ${domain.padEnd(30)} ... `)

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'CNAME',
            name: domain,
            content: WORKER_URL,
            ttl: 1,
            proxied: true
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        console.log('✅ Criado')
        success++
      } else if (data.errors?.[0]?.code === 81053) {
        // CNAME já existe
        console.log('✓ Já existe')
        success++
      } else {
        const msg = data.errors?.[0]?.message || data.errors?.[0] || `HTTP ${response.status}`
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

createCNAMEs().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
