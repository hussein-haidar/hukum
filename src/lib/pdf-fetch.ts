import https from "https";
import http from "http";

const SSL_EXCEPTIONS = new Set([
  "bphn.jdihn.go.id",
  "jdihn.go.id",
]);

const PDF_SIGNATURE = "%PDF-";

async function fetchWithAgent(url: string, maxRedirects = 5): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let currentUrl = url;
    let redirects = 0;

    const doRequest = (requestUrl: string) => {
      const parsed = new URL(requestUrl);
      const isHttps = parsed.protocol === "https:";
      const lib = isHttps ? https : http;
      const hostname = parsed.hostname;
      const isException = SSL_EXCEPTIONS.has(hostname);

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          Accept: "application/pdf,*/*;q=0.8",
        },
      };

      const agentOptions: any = {};
      if (isException && isHttps) {
        agentOptions.rejectUnauthorized = false;
      }

      const agent = isHttps
        ? new https.Agent({ ...agentOptions, keepAlive: true })
        : new http.Agent({ keepAlive: true });

      const req = lib.request({ ...options, agent }, (res) => {
        // Handle redirect
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects >= 5) {
            reject(new Error("Terlalu banyak redirect"));
            return;
          }
          redirects++;
          const redirectUrl = new URL(res.headers.location, requestUrl).toString();
          doRequest(redirectUrl);
          return;
        }

        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode || "unknown"}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const head = buf.slice(0, Math.min(5, buf.length));
          const signature = head.toString("latin1");
          if (buf.length < 10 || signature !== PDF_SIGNATURE) {
            reject(new Error("Response bukan PDF (server sumber salah mengirim)"));
            return;
          }
          resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
        });
      });

      req.on("error", (e) => reject(e));
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error("Timeout"));
      });
      req.end();
    };

    doRequest(currentUrl);
  });
}

export async function fetchPdfWithRetry(url: string): Promise<ArrayBuffer> {
  let lastErr: any = new Error("Gagal mengambil PDF");

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
    try {
      const buf = await fetchWithAgent(url);
      return buf;
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr;
}