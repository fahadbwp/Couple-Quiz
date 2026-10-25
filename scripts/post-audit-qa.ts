// Standalone, loopback-only fixture server. Not an application route.
import { createServer } from "node:http";
import { encodeJourney, newJourney, SAVE_KEY } from "../lib/jelloo/progress";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.NETLIFY) throw Error("Local QA only");
  for (const key of Object.keys(process.env)) {
    if (/SUPABASE|UPSTASH|REFERRAL_SECRET/.test(key)) process.env[key] = "";
  }
  const { default: next } = await import("next");
  const app = next({ dev: true, hostname: "127.0.0.1", port: 3057 });
  await app.prepare();
  const valid = encodeJourney({ ...newJourney(42), completed: 2, best: { 1: 3, 2: 2 }, muted: true, motion: false });
  createServer((req, res) => {
    if (req.headers.host !== "127.0.0.1:3057") { res.writeHead(403).end(); return; }
    const url = new URL(req.url!, "http://127.0.0.1:3057");
    if (url.pathname.startsWith("/api/")) { res.writeHead(503).end("QA blocks all APIs"); return; }
    // Local-only stronger outbound policy: no ad requests or remote database access.
    const set = res.setHeader.bind(res);
    res.setHeader = (key, value) => set(key, key.toLowerCase() === "content-security-policy"
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws://127.0.0.1:3057; font-src 'self'; frame-src 'none'"
      : value);
    if (url.pathname === "/_audit-fixtures") {
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" }).end(`<!doctype html><title>Isolated post-audit fixtures</title><h1>Disposable local QA only</h1><button id="corrupt">Install corrupt fixture</button><button id="valid">Install valid fixture</button><a href="/jelloo/map">Open Map</a><a href="/jelloo">Open Game</a><a href="/quiz">Open Quiz</a><pre id="status"></pre><script>
const key=${JSON.stringify(SAVE_KEY)};const out=document.querySelector('#status');
document.querySelector('#corrupt').onclick=()=>{localStorage.setItem(key,'audit-corrupt-sentinel');out.textContent='Corrupt fixture installed';};
document.querySelector('#valid').onclick=()=>{localStorage.setItem(key,${JSON.stringify(valid)});out.textContent='Valid fixture installed';};
out.textContent=localStorage.getItem(key)==='audit-corrupt-sentinel'?'Corrupt fixture bytes preserved':'Ready';
</script>`); return;
    }
    void app.getRequestHandler()(req, res);
  }).listen(3057, "127.0.0.1", () => console.log("QA ready: http://127.0.0.1:3057/_audit-fixtures"));
}
void main();
