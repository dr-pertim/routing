# Pertim Routing

Cloudflare Worker genérico para rotear múltiplos domínios customizados pro Pertim sem redirect visível.

## Como funciona

- `drandrerufino.com.br` → `www.drpertim.com.br/dentista/mg/andre-rufino` (mascarado)
- `outro-profissional.com.br` → `www.drpertim.com.br/dentista/sp/joao-silva` (mascarado)
- URL fica como o domínio customizado, conteúdo vem do Pertim

## Fluxo de funcionamento

### 1️⃣ **Setup inicial (uma única vez)**
Configurar DNS dos domínios pra apontar pro Worker (automático via GitHub Actions).

### 2️⃣ **Automático (GitHub Actions)**
Toda vez que você faz push em `routes.json`, o Worker é atualizado automaticamente.

## Como adicionar um novo domínio

### Passo 1: Editar `routes.json`

```json
{
  "routes": [
    {
      "from": "drandrerufino.com.br",
      "to": "www.drpertim.com.br",
      "path": "/dentista/mg/andre-rufino"
    },
    {
      "from": "novo-dominio.com.br",  // ← NOVO
      "to": "www.drpertim.com.br",
      "path": "/categoria/uf/slug-do-profissional"
    }
  ]
}
```

### Passo 2: Editar `domains.json`

```json
{
  "domains": [
    "drandrerufino.com.br",
    "www.drandrerufino.com.br",
    "novo-dominio.com.br",        // ← NOVO
    "www.novo-dominio.com.br"     // ← NOVO (se tiver www)
  ]
}
```

### Passo 3: Fazer push

```bash
git add routes.json domains.json
git commit -m "Add novo-dominio.com.br routing"
git push
```

→ GitHub Actions faz deploy automático ✅

### Passo 4: Configurar DNS (primeira vez de cada domínio)

**Se é a primeira vez que usa o domínio:**

1. Repo → **Actions** → **Setup DNS (Register Custom Domains)**
2. **Run workflow**
3. Preecha o campo **Domain**: `novo-dominio.com.br` (só serve pra achar a zona — o registro cobre TODOS os domínios listados em `domains.json` que pertencem a essa mesma zona, ex.: com e sem `www`)
4. Clique **Run workflow**

→ Cloudflare registra o(s) Custom Domain(s) e já cria o DNS record sozinho (não precisa de CNAME manual) ✅

**Próximas vezes:** só precisa fazer push em `routes.json` e `domains.json`.

## Setup inicial (primeira vez no projeto)

### 1. Configurar Secrets do GitHub

**Repo → Settings → Secrets and variables → Actions**

Adicione:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

#### Como pegar esses valores:

**CLOUDFLARE_API_TOKEN:**
1. https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → "Create Custom Token"
3. Permissões necessárias:
   - `Account → Workers Scripts (Write)`
   - `Zone → DNS (Edit)`
4. Copia o token → Cola em GitHub Secrets

**Nota:** a API de Custom Domains (`/accounts/{id}/workers/domains`, usada
pelo `add-custom-domain.js`) funciona com Token normal — não precisa de
Global API Key. Só um endpoint mais antigo (routes legado) exigia isso;
não usamos mais.

**CLOUDFLARE_ACCOUNT_ID:**
1. https://dash.cloudflare.com/ (qualquer página)
2. URL tem: `dash.cloudflare.com/?account=AQUI_ESTA_O_ID`
3. Copia o ID → Cola em GitHub Secrets

### 2. Setup do projeto

```bash
git clone https://github.com/dr-pertim/routing.git
cd routing
npm install
npm run deploy     # deploy manual (normalmente automático)
```

### 3. Configurar o primeiro domínio

1. Edita `routes.json` com o primeiro domínio
2. Edita `domains.json` com o primeiro domínio (+ www se tiver)
3. Faz push
4. Repo → **Actions** → **Setup DNS** → executa com o domínio

→ Pronto! Primeiro domínio está configurado ✅

## Estrutura de arquivos

```
routing/
├── src/
│   └── index.ts              (código do Worker)
├── routes.json               (mapeamento de rotas)
├── domains.json              (lista de domínios)
├── scripts/
│   ├── add-custom-domain.js  (registra Custom Domain no Worker — já cria o DNS record)
│   └── get-zone-id.js        (busca Zone ID do domínio)
├── .github/workflows/
│   ├── deploy.yml            (deploy do Worker - automático)
│   └── setup-dns.yml         (setup DNS - manual)
├── wrangler.toml             (config Wrangler)
├── package.json
└── README.md
```

## Troubleshooting

**Worker não faz deploy?**
- GitHub Actions → Deploy Worker
- Verifica se `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` estão corretos

**CNAMEs não criaram?**
- Verifica se o token tem permissão `Zone → DNS (Edit)`
- Confirma que o domínio está em Cloudflare

**Domínio não funciona após CNAME?**
- Espera 1-2 minutos pra propagação
- Verifica se `routes.json` tem a rota correta
- Testa no terminal: `dig novo-dominio.com.br`

**Dúvidas?**
- Documentação oficial: https://developers.cloudflare.com/workers/
- Cloudflare DNS: https://developers.cloudflare.com/dns/
