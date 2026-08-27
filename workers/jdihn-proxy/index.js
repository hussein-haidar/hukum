// Cloudflare Worker — Reverse Proxy untuk JDIH Pusat (jdihn.go.id)
// Deploy: https://workers.cloudflare.com (gratis, 100k request/hari)
//
// Setup:
//   1. Buat akun gratis di https://dash.cloudflare.com
//   2. Buat Worker baru (Workers & Pages → Create → Worker)
//   3. Paste kode ini ke Worker editor
//   4. Deploy
//   5. Copy URL Worker (contoh: https://jdihn-proxy.your-name.workers.dev)
//   6. Set env di Vercel/GitHub: JDIHN_PROXY_URL=<URL>/proxy
//
// Endpoint: GET/POST <worker-url>/proxy?url=<encoded_url_to_proxy>

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // Hanya terima /proxy
    if (url.pathname !== "/proxy") {
      return new Response(
        JSON.stringify({ error: "Endpoint: /proxy?url=<encoded_url>" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Ambil target URL
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response(
        JSON.stringify({ error: "Missing ?url= parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Validasi: hanya izinkan request ke jdihn.go.id
    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const allowedHosts = ["jdihn.go.id", "www.jdihn.go.id"];
    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response(
        JSON.stringify({ error: `Only allowed hosts: ${allowedHosts.join(", ")}` }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Forward request ke target
    try {
      const proxyRes = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json, text/html",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      // Stream response
      const responseHeaders = new Headers(corsHeaders());
      responseHeaders.set("Content-Type", proxyRes.headers.get("Content-Type") || "application/json");

      return new Response(proxyRes.body, {
        status: proxyRes.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Proxy error: ${err.message}` }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
