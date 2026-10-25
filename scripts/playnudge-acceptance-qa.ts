// Disposable loopback QA harness. No production route, credentials or save writes.
import {createServer,type IncomingMessage,type ServerResponse} from "node:http";
import {encodeJourney,newJourney,SAVE_KEY} from "../lib/jelloo/progress";
import {initialGame} from "../lib/jelloo/engine";
import {levelAt} from "../lib/jelloo/endless";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
async function main(){
 if(process.env.NODE_ENV==="production"||process.env.VERCEL||process.env.NETLIFY)throw Error("Local QA only");
 Object.assign(process.env,{NODE_ENV:"development",JELLOO_LOCAL_QA:"1",PLAYNUDGE_LOCAL_INSIGHTS:"1"});
 for(const k of ["SUPABASE_URL","NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","SUPABASE_SERVICE_KEY","SUPABASE_SECRET_KEY","QUIZ_TEST_SUPABASE_URL","QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY","UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN","JELLOO_REFERRAL_SECRET"])process.env[k]="";
 const {default:next}=await import("next");const app=next({dev:true,hostname:"127.0.0.1",port:3032});await app.prepare();
 const handler=async(req:IncomingMessage,res:ServerResponse)=>{
  if(!["127.0.0.1:3032","127.0.0.1:3033"].includes(req.headers.host??"")){res.writeHead(403).end();return;}
  const url=new URL(req.url!,"http://127.0.0.1:3032");
  // Restrict every new/existing ad request at the browser; do not alter live widget.
  const set=res.setHeader.bind(res);res.setHeader=(key,value)=>set(key,key.toLowerCase()==="content-security-policy"?"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws:; font-src 'self'; frame-src 'self'; frame-ancestors 'self'":value);
  if(url.pathname.startsWith("/api/quiz")){
   const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>102400){res.writeHead(413).end();return;}chunks.push(chunk);}
   const r=await fetch("http://127.0.0.1:3015"+url.pathname+url.search,{method:req.method,headers:{"content-type":"application/json",...(req.headers.cookie?{cookie:req.headers.cookie}:{}),origin:"http://localhost:3014"},body:req.method==="GET"?undefined:Buffer.concat(chunks)}).catch(()=>null);
   if(!r){res.writeHead(503).end();return;}r.headers.forEach((v,k)=>res.setHeader(k,v));res.writeHead(r.status).end(await r.text());return;
  }
  if(url.pathname.startsWith("/api/")){res.writeHead(503).end();return;}
  if(url.pathname==="/_phase84"){
   const fixture=(completed:number)=>encodeJourney({...newJourney(42),completed,muted:true,motion:false,game:initialGame(levelAt(completed===93?94:1,42,4,2)),best:Object.fromEntries(Array.from({length:completed},(_,i)=>[i+1,3]))});
   const turns=(id:number)=>{const l=levelAt(id,42,4,2),s=solvePowerLevel(l);return s.solution?.flatMap((t,i)=>Array.from({length:(t.rotation-l.tiles[i].rotation+4)%4},()=>i)).join(", ")??"Use Multi QA reference";};
   res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}).end(`<title>Isolated Phase 8.4 QA</title><h1>Disposable localhost:3032 saves</h1><p>All external scripts blocked by local CSP; quiz API uses in-memory localhost:3015 only.</p>${[0,20,60,93,100].map(n=>`<button onclick='localStorage.setItem(${JSON.stringify(SAVE_KEY)},${JSON.stringify(fixture(n))});location.href="/jelloo?level=94"'>${n} completed fixture</button>`).join(" ")}<p><a href="/internal/growth">Growth lab</a> · <a href="/jelloo?level=1">Level 1</a> · <a href="/jelloo?level=12">Level 12</a> · <a href="/jelloo?level=27">Required Cat</a> · <a href="/jelloo/qa?level=71">Two-Jelly</a> · <a href="/jelloo/qa?level=91">Three-Jelly</a> · <a href="/quiz">Quiz</a></p><p>Actual seed42 clockwise tile indices — Level1: ${turns(1)}; Level12: ${turns(12)}.</p>`);return;
  }
  void app.getRequestHandler()(req,res);
 };for(const port of [3032,3033])createServer(handler).listen(port,"127.0.0.1",()=>console.log(`Acceptance QA on ${port}`));
}
void main();
