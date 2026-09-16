# Pertim Routing

Cloudflare Worker genérico para rotear múltiplos domínios customizados pro Pertim sem redirect visível.

## Como funciona

- `drandrerufino.com.br` → `www.drpertim.com.br/dentista/mg/andre-rufino` (mascarado)
- `outro-profissional.com.br` → `www.drpertim.com.br/dentista/sp/joao-silva` (mascarado)
- URL fica como o domínio customizado, conteúdo vem do Pertim

## Fluxo de funcionamento

### 1️⃣ **Automático (GitHub Actions)**
Toda vez que você faz push em `routes.json`, o Worker é atualizado automaticamente.

### 2️⃣ **Manual (Cloudflare UI)**
Registrar cada domínio customizado (uma única vez por domínio).

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

### Passo 2: Fazer push

```bash
git add routes.json
git commit -m "Add novo-dominio.com.br routing"
git push
```

→ GitHub Actions faz deploy automático ✅

### Passo 3: Registrar o domínio no Cloudflare (manual)

1. Acesse: https://dash.cloudflare.com/
2. Vá em: **Workers & Pages**
3. Clique em: **pertim-routing**
4. Abra a aba: **Settings**
5. Clique em: **Triggers**
6. Na seção **Custom Domains**, clique: **Add Custom Domain**
7. Digite: `novo-dominio.com.br`
8. Cloudflare valida que o domínio é seu
9. Clique: **Add**

Pronto! ✨

### Repetir para versão com `www`

Se o domínio tem `www`, registre também:
- `www.novo-dominio.com.br`

Mesmo passo a passo, só muda o domínio.

## Setup inicial

```bash
git clone https://github.com/dr-pertim/routing.git
cd routing
npm install
npm run dev        # dev local (opcional)
npm run deploy     # deploy manual (normalmente automático via GitHub)
```

## Secrets do GitHub

Pra GitHub Actions fazer deploy automático, configure em:

**Repo → Settings → Secrets and variables → Actions**

Adicione:
- `CLOUDFLARE_API_TOKEN` — token da sua conta Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` — ID da conta Cloudflare

### Como pegar esses valores:

**CLOUDFLARE_API_TOKEN:**
1. https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → "Create Custom Token"
3. Permissões mínimas:
   - `Account → Workers Scripts (Write)`
4. Copia o token

**CLOUDFLARE_ACCOUNT_ID:**
1. https://dash.cloudflare.com/ (qualquer página)
2. No canto superior direito, clique em sua conta
3. Copie o ID que aparece na URL: `dash.cloudflare.com/?account=AQUI_ESTA_O_ID`
4. Cole como secret

## Estrutura de arquivos

```
routing/
├── src/
│   └── index.ts              (código do Worker)
├── routes.json               (mapeamento de domínios)
├── scripts/
│   ├── register-domains.js   (registro manual via CLI)
│   └── get-worker-id.js      (pega ID do worker)
├── wrangler.toml             (config Wrangler)
├── package.json
└── README.md
```

## Troubleshooting

**Worker não faz deploy?**
- Verifica GitHub Actions → Deploy Worker
- Vê se `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` estão corretos em Secrets

**Domínio não funciona após registrar?**
- Espera 1-2 minutos pra propagação
- Verifica se `routes.json` tem a rota correta
- Confirma que registrou o Custom Domain no Cloudflare (Settings → Triggers)

**Dúvidas?**
- Documentação oficial: https://developers.cloudflare.com/workers/
