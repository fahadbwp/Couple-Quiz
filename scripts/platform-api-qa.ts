/** Standalone disposable quiz API. Run with tests/setup.mjs; never deployed. */
import { createServer } from "node:http";
import { _enableMockSupabase } from "../lib/quiz/supabase";
import * as create from "../app/api/quiz/route";
import * as quiz from "../app/api/quiz/[id]/route";
import * as attempt from "../app/api/quiz/[id]/attempt/route";
import * as scoreboard from "../app/api/quiz/[id]/scoreboard/route";
import * as result from "../app/api/quiz/[id]/player-result/route";
if (
  process.env.NODE_ENV !== "test" ||
  process.env.VERCEL ||
  process.env.NETLIFY
)
  throw new Error("Isolated local tests only");
_enableMockSupabase(true);
type Handler = (
  req: Request,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  },
) => Promise<Response>;
const routes: Record<string, Partial<Record<string, Handler>>> = {
  quiz: { GET: quiz.GET, DELETE: quiz.DELETE },
  attempt: { POST: attempt.POST },
  scoreboard: { GET: scoreboard.GET, POST: scoreboard.POST },
  "player-result": { GET: result.GET },
};
createServer(async (req, res) => {
  try {
    if (req.headers.host !== "127.0.0.1:3015") {
      res.writeHead(403).end();
      return;
    }
    const url = new URL(req.url ?? "/", "http://localhost:3014");
    const match = url.pathname.match(
      /^\/api\/quiz(?:\/([^/]+)(?:\/(attempt|scoreboard|player-result))?)?$/,
    );
    if (!match) {
      res.writeHead(404).end();
      return;
    }
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
      if (v && k !== "host") headers.set(k, Array.isArray(v) ? v.join(",") : v);
    const request = new Request(url, {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : Buffer.concat(chunks),
    });
    const handler: Handler | undefined = match[1]
      ? routes[match[2] ?? "quiz"][req.method ?? "GET"]
      : req.method === "POST"
        ? create.POST
        : undefined;
    if (!handler) {
      res.writeHead(405).end();
      return;
    }
    const response = await handler(request, {
      params: Promise.resolve({ id: match[1] }),
    });
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.writeHead(response.status).end(await response.text());
  } catch {
    res.writeHead(500).end("Local QA error");
  }
}).listen(3015, "127.0.0.1", () =>
  console.log("Disposable quiz API on 3015; in-memory mock, no database"),
);
