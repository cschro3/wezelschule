import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response=await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    const html=response.headers.get('Content-Type')?.includes('text/html');
    const nonce=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));
    const rewritten=html&&!import.meta.env.DEV?new HTMLRewriter().on('script',{element(element){element.setAttribute('nonce',nonce);}}).transform(response):response;
    const secured=new Response(rewritten.body,rewritten);secured.headers.delete('Content-Length');
    if(new URL(request.url).protocol==='https:')secured.headers.set('Strict-Transport-Security','max-age=31536000');
    secured.headers.set('X-Content-Type-Options','nosniff');
    secured.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    secured.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    secured.headers.set('X-Robots-Tag','noindex, nofollow');
    if(!secured.headers.has('Content-Security-Policy'))secured.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'nonce-"+nonce+"'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com");
    if(new URL(request.url).pathname.startsWith('/admin')||new URL(request.url).pathname.startsWith('/login')||new URL(request.url).pathname.startsWith('/account')||new URL(request.url).pathname.startsWith('/api/'))secured.headers.set('Cache-Control','private, no-store');
    return secured;
  },
};

export default worker;
