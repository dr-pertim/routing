#!/usr/bin/env node

/**
 * Pega o Worker ID do Cloudflare usando a API
 * Procura pelo nome do worker e retorna o ID
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const WORKER_NAME = process.env.CLOUDFLARE_WORKER_NAME || 'routing'

if (!TOKEN || !ACCOUNT_ID) {
  console.error('❌ ERRO: CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID são obrigatórios')
  process.exit(1)
}

async function getWorkerId() {
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/services`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!data.success) {
      console.error('❌ Erro ao listar workers:', data.errors?.[0]?.message)
      process.exit(1)
    }

    // Procura pelo worker com o nome correto
    const worker = data.result?.find(w => w.service === WORKER_NAME)

    if (!worker) {
      console.error(`❌ Worker "${WORKER_NAME}" não encontrado`)
      console.error(`Workers disponíveis: ${data.result?.map(w => w.service).join(', ')}`)
      process.exit(1)
    }

    console.log(worker.id)

  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
}

getWorkerId()
