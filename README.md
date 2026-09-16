# Pertim Routing

Cloudflare Worker genérico para rotear múltiplos domínios customizados pro Pertim sem redirect visível.

## Exemplo:

- `drandrerufino.com.br` → `www.drpertim.com.br/dentista/mg/andre-rufino`
- `outro-profissional.com.br` → `www.drpertim.com.br/dentista/sp/joao-silva`
- `mais-um-site.com.br` → `www.drpertim.com.br/fisioterapeuta/mg/maria-santos`

URL fica como o domínio customizado (mascarado), conteúdo vem do Pertim.

## Como adicionar um novo domínio:

1. Edite `routes.json` e adicione uma nova rota:
```json
{
  "from": "novo-dominio.com.br",
  "to": "www.drpertim.com.br",
  "path": "/categoria/uf/slug-do-profissional"
}
```

2. Faça push (GitHub Actions faz deploy automático):
```bash
git add routes.json
git commit -m "Add novo-dominio.com.br routing"
git push
```

3. No painel Cloudflare, adicione o domínio como "Custom Domain" do Worker (só uma vez).

## Setup inicial:

```bash
git clone https://github.com/dr-pertim/routing.git
cd routing
npm install
npm run dev        # dev local
npm run deploy     # deploy manual (se quiser)
```

## Secrets do GitHub:

Pra GitHub Actions fazer deploy automático, configure:
- `CLOUDFLARE_API_TOKEN` — token da sua conta Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` — ID da conta

Settings → Secrets and variables → Actions
