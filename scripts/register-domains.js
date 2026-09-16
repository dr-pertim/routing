#!/usr/bin/env node

/**
 * Registra Custom Domains no Cloudflare Worker.
 * Cada domínio é exibido como uma etapa separada.
 */

import fs from 'fs'

const API_BASE = 'https://api.cloudflare.com/client/v4'
const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const WORKER_NAME = process.env.CLOUDFLARE_WORKER_NAME || 'routing'
const DOMAIN_FILTER = process.env.DOMAIN_FILTER // opcional: registrar só um domínio

if (!TOKEN || !ACCOUNT_ID) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID são obrigatórios')
  process.exit(1)
}

// Lê domínios do arquivo
const domainsData = JSON.parse(fs.readFileSync('./domains.json', 'utf8'))
let domains = domainsData.domains || []

// Filtra se passou domínio específico
if (DOMAIN_FILTER) {
  domains = domains.filter(d => d.includes(DOMAIN_FILTER))
  console.log(`🎯 Filtrando por: ${DOMAIN_FILTER}`)
}

console.log(`\n📋 Domínios a registrar: ${domains.length}\n`)
domains.forEach((d, i) => console.log(`  ${i + 1}. ${d}`))
console.log('')

// Registra cada domínio
async function registerDomains() {
  let success = 0
  let failed = 0

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i]
    const step = `[${i + 1}/${domains.length}]`

    process.stdout.write(`${step} ${domain.padEnd(30)} ... `)

    try {
      const response = await fetch(
        `${API_BASE}/accounts/${ACCOUNT_ID}/workers/routes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pattern: `${domain}/*`,
            script: WORKER_NAME
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        console.log('✅ Registrado')
        success++
      } else if (data.errors?.[0]?.code === 10014) {
        // Domínio já existe
        console.log('✓ Já registrado')
        success++
      } else {
        const msg = data.errors?.[0]?.message || 'Erro desconhecido'
        console.log(`❌ ${msg}`)
        failed++
      }
    } catch (err) {
      console.log(`❌ ${err.message}`)
      failed++
    }
  }

  console.log(`\n📊 Resultado: ${success} ✅ | ${failed} ❌`)

  if (failed > 0) {
    process.exit(1)
  }
}

registerDomains().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
