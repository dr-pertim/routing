#!/usr/bin/env node

/**
 * Parse domains.json e mostra quais vão ser registrados
 */

import fs from 'fs'

const domainsData = JSON.parse(fs.readFileSync('./domains.json', 'utf8'))
const domains = domainsData.domains || []
const filter = process.env.DOMAIN_FILTER

let filtered = domains
if (filter) {
  filtered = domains.filter(d => d.includes(filter))
}

console.log(`📋 Total configurado: ${domains.length}`)
console.log(`🎯 Vai registrar: ${filtered.length}\n`)

filtered.forEach((d, i) => {
  console.log(`  ${i + 1}. ${d}`)
})

console.log('')
