import routes from '../routes.json'

interface Route {
  from: string
  to: string
  path: string
}

interface RoutesConfig {
  routes: Route[]
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
      // Redireciona pro destino. Sem o caso especial da raiz ("/"), dava
      // "/dentista/mg/andre-rufino/" (barra sobrando) e o Next.js (sem
      // trailingSlash) respondia 404 em vez de servir a página.
      url.hostname = route.to
      url.pathname = route.path + (url.pathname === '/' ? '' : url.pathname)
      return fetch(new Request(url, request))
    }

    // Se não encontrar rota, retorna 404
    return new Response('Domain not configured', { status: 404 })
  }
}
