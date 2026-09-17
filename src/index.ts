import routes from '../routes.json'

interface Route {
  from: string
  to: string
  path: string
}

interface RoutesConfig {
  routes: Route[]
}

// Caminhos compartilhados por TODO o app Next.js (assets do build, uploads,
// arquivos estáticos da raiz) — não são páginas do site, então NUNCA levam
// o prefixo `route.path`. Sem isso, "/dentista/mg/andre-rufino/_next/..."
// não existe (o build fica em "/_next/..." mesmo) e a página carrega sem
// CSS/JS/imagem nenhuma.
const PASSTHROUGH_PREFIXES = ['/_next/', '/uploads/', '/icons/', '/cdn-cgi/']
const PASSTHROUGH_EXACT = ['/favicon.ico', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest']

function isPassthrough(pathname: string): boolean {
  return PASSTHROUGH_EXACT.includes(pathname) || PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p))
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const config = routes as RoutesConfig

    // Procura por uma rota que corresponde ao hostname
    const route = config.routes.find(r => {
      const fromWithWww = `www.${r.from}`
      return url.hostname === r.from || url.hostname === fromWithWww
    })

    if (route) {
      url.hostname = route.to
      if (!isPassthrough(url.pathname)) {
        // Página do site: prefixa com a rota. Sem o caso especial da raiz
        // ("/"), dava "/dentista/mg/andre-rufino/" (barra sobrando) e o
        // Next.js (sem trailingSlash) respondia 404 em vez de servir a
        // página.
        url.pathname = route.path + (url.pathname === '/' ? '' : url.pathname)
      }
      return fetch(new Request(url, request))
    }

    // Se não encontrar rota, retorna 404
    return new Response('Domain not configured', { status: 404 })
  }
}
