/** Disposable loopback-only QA. Never imported by production routes. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { handleReferral, type ReferralRpc } from "../lib/jelloo/referrals/server";

async function main() {
  if(process.env.NODE_ENV==="production" || process.env.VERCEL || process.env.NETLIFY) throw new Error("Local QA only");
  Object.assign(process.env,{NODE_ENV:"development"});
  process.env.JELLOO_LOCAL_QA="1";
  // Prevent Next's dotenv loading from supplying any real database credentials.
  for(const key of ["SUPABASE_URL","NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN","JELLOO_REFERRAL_SECRET"])process.env[key]="";
  const {default:next}=await import("next");
  const app=next({dev:true,hostname:"127.0.0.1",port:3012});
  await app.prepare();
  const db=new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(await readFile("supabase/migrations/20261023000001_jelloo_referrals.sql","utf8"));
  const rpc:ReferralRpc=async(op,actor,data)=>(await db.query<{result:unknown}>("select jelloo_referral_rpc($1,$2,$3::jsonb) as result",[op,actor,JSON.stringify(data)])).rows[0].result;
  const secret=randomBytes(32).toString("hex");
  let fault="none";
  const server=createServer(async(req,res)=>{
    const host=req.headers.host;
    if(!["127.0.0.1:3012","localhost:3012"].includes(host??"")){res.writeHead(403).end();return;}
    // Only this disposable server allows same-origin viewport frames. Production
    // CSP/X-Frame-Options are untouched. No third-party framing is permitted.
    const setHeader=res.setHeader.bind(res);
    res.setHeader=(name,value)=>setHeader(name,name.toLowerCase()==="x-frame-options"?"SAMEORIGIN":name.toLowerCase()==="content-security-policy"?String(value).replace("frame-ancestors 'none'","frame-ancestors 'self'"):value);
    const origin=`http://${host}`,url=new URL(req.url??"/",origin);
    if(url.pathname==="/_qa/control"){
      if(req.method!=="POST" || req.headers.origin!==origin){res.writeHead(403).end();return;}
      const mode=url.searchParams.get("fault");
      if(mode==="expire-links")await db.exec("update jelloo_referral_people set link_expires=now()-interval '1 second'");
      else if(mode==="expire-sessions")await db.exec("update jelloo_referral_sessions set expires=now()-interval '1 second'");
      else if(["none","offline","lose-next-submit"].includes(mode??""))fault=mode!;
      else {res.writeHead(400).end();return;}
      res.writeHead(200,{"Content-Type":"text/plain"}).end("Local QA control updated");return;
    }
    if(url.pathname==="/api/jelloo/referrals"){
      if(req.method!=="POST"){res.writeHead(405).end();return;}
      if(fault==="offline"){req.socket.destroy();return;}
      const chunks:Buffer[]=[];let bytes=0;
      for await(const chunk of req){bytes+=chunk.length;if(bytes>16384){res.writeHead(413).end();return;}chunks.push(chunk);}
      const body=Buffer.concat(chunks);
      const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(","):v);
      const result=await handleReferral(new Request(url,{method:"POST",headers,body}),{origin,secret,secure:false},rpc);
      if(fault==="lose-next-submit" && JSON.parse(body.toString()).op==="submit"){fault="none";req.socket.destroy();return;}
      result.headers.forEach((v,k)=>res.setHeader(k,v));res.writeHead(result.status).end(await result.text());return;
    }
    if(url.pathname.startsWith("/api/")){res.writeHead(403).end("Only referral API is available in QA");return;}
    await app.getRequestHandler()(req,res);
  });
  server.listen(3012,"127.0.0.1",()=>console.log("Disposable local QA: http://127.0.0.1:3012/jelloo/qa — in-memory PostgreSQL, no Supabase"));
}
main().catch(()=>{console.error("Local QA startup failed");process.exitCode=1;});
