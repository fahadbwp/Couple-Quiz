/** Local browser surface; production credentials never reach the test API. */
import { createServer } from "node:http";
async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL ||
    process.env.NETLIFY
  )
    throw new Error("Local QA only");
  Object.assign(process.env, { NODE_ENV: "development" });
  for (const key of [
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SECRET_KEY",
    "QUIZ_TEST_SUPABASE_URL",
    "QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "JELLOO_REFERRAL_SECRET",
  ])
    process.env[key] = "";
  const { default: next } = await import("next");
  const app = next({ dev: true, hostname: "127.0.0.1", port: 3014 });
  await app.prepare();
  createServer(async (req, res) => {
    const host = req.headers.host;
    if (!["127.0.0.1:3014", "localhost:3014"].includes(host ?? "")) {
      res.writeHead(403).end();
      return;
    }
    const url = new URL(req.url ?? "/", `http://${host}`);
    // Same-origin frames only in this standalone QA server; production policy unchanged.
    const set = res.setHeader.bind(res);
    res.setHeader = (k, v) =>
      set(
        k,
        k.toLowerCase() === "x-frame-options"
          ? "SAMEORIGIN"
          : k.toLowerCase() === "content-security-policy"
            ? String(v).replace(
                "frame-ancestors 'none'",
                "frame-ancestors 'self'",
              )
            : v,
      );
    if (url.pathname === "/_platform-viewport") {
      const width = url.searchParams.get("width") === "320" ? 320 : 390;
      const page = ["/", "/games", "/quiz", "/jelloo"].includes(
        url.searchParams.get("page") ?? "",
      )
        ? url.searchParams.get("page")!
        : "/";
      res
        .writeHead(200, {
          "Content-Type": "text/html",
          "X-Robots-Tag": "noindex",
        })
        .end(
          `<title>Local ${width}px QA</title><iframe title="${width}px viewport" style="border:0;width:${width}px;height:844px" src="${page}"></iframe>`,
        );
      return;
    }
    if (url.pathname.startsWith("/api/quiz")) {
      try {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 102400) {
            res.writeHead(413).end();
            return;
          }
          chunks.push(chunk);
        }
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers))
          if (v && !["host", "connection", "content-length"].includes(k))
            headers.set(k, Array.isArray(v) ? v.join(",") : v);
        const r = await fetch(
          `http://127.0.0.1:3015${url.pathname}${url.search}`,
          {
            method: req.method,
            headers,
            body: req.method === "GET" ? undefined : Buffer.concat(chunks),
          },
        );
        r.headers.forEach((v, k) => {
          if (!["transfer-encoding", "content-encoding"].includes(k))
            res.setHeader(k, v);
        });
        res.writeHead(r.status).end(Buffer.from(await r.arrayBuffer()));
      } catch {
        res
          .writeHead(503)
          .end('{"success":false,"error":"Disposable QA API unavailable"}');
      }
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      res
        .writeHead(503, { "Content-Type": "application/json" })
        .end('{"success":false,"error":"Disabled in isolated platform QA"}');
      return;
    }
    await app.getRequestHandler()(req, res);
  }).listen(3014, "127.0.0.1", () =>
    console.log(
      "Local platform QA: http://127.0.0.1:3014; quiz API uses disposable process",
    ),
  );
}
main().catch(() => {
  console.error("Local QA failed");
  process.exitCode = 1;
});
