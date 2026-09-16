# Pertim Routing

Cloudflare Worker genérico para rotear domínios customizados pro Pertim sem redirect visível.

## Funciona assim:

- `drandrerufino.com.br` → `www.drpertim.com.br/dentista/mg/andre-rufino`
- URL fica `drandrerufino.com.br` (mascarado)
- Conteúdo vem do Pertim

## Como adicionar um novo domínio:

1. Edite `routes.json` e adicione uma nova rota:
```json
{
  "from": "novo-dominio.com.br",
  "to": "www.drpertim.com.br",
  "path": "/sua/rota"
}
```

2. Faça push e deploy:
```bash
npm run deploy
```

3. No painel Cloudflare, adicione o domínio como "Custom Domain" do Worker.

## Setup inicial:

```bash
npm install
npm run dev        # dev local
npm run deploy     # deploy pro Cloudflare
```

Precisa de uma conta Cloudflare com Workers ativado.
