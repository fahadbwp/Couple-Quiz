import { createHash, createHmac, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readJsonWithLimit } from "@/lib/quiz/requestBody";
import { extractClientIp } from "@/lib/quiz/security";
import { codeValid, opaque, uuidValid, validStatus } from "./protocol";
import { REFERRAL_REVISION, verifyTutorial } from "./verify";

export type ReferralRpc = (op:string,actor:string,data:Record<string,unknown>)=>Promise<unknown>;
export type ReferralConfig = {origin:string;secret:string;secure:boolean};
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
export const actorHash=(token:string)=>digest("jelloo-person:"+token);
export function configuration() {
  const origin=process.env.JELLOO_REFERRAL_ORIGIN ?? "",secret=process.env.JELLOO_REFERRAL_SECRET ?? "";
  const url=process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const secure=process.env.NODE_ENV==="production";
  if(secret.length<32 || !key || !url) throw new Error("Referral configuration unavailable");
  const parsed=new URL(origin),db=new URL(url);
  if(parsed.origin!==origin || (secure && parsed.protocol!=="https:") || !["https:","http:"].includes(parsed.protocol) || db.protocol!=="https:") throw new Error("Invalid referral configuration");
  let serviceKey=key.startsWith("sb_secret_") && key.length>=32;
  try {serviceKey ||= JSON.parse(Buffer.from(key.split(".")[1],"base64url").toString()).role==="service_role";} catch { /* Invalid key fails closed. */ }
  if(!serviceKey) throw new Error("Invalid server credential");
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(8000)})}});
  const rpc:ReferralRpc=async(op,actor,data)=>{
    const result=await client.rpc("jelloo_referral_rpc",{p_op:op,p_actor:actor,p_data:data});
    if(result.error) throw new Error("Referral storage unavailable");
    return result.data;
  };
  return {config:{origin,secret,secure},rpc};
}
const errorStatuses:Record<string,number>={invalid:400,unauthorized:401,rate_limited:429,invalid_link:400,self_referral:409,already_attributed:409,invalid_session:409,expired:410,revision:409,replay:409};
function response(value:unknown,status=200,cookie?:string) {
  return Response.json(value,{status,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff",...(status===429?{"Retry-After":"60"}:{}),...(cookie?{"Set-Cookie":cookie}:{})}});
}
function dbError(value:unknown) {
  if(value && typeof value==="object" && "error" in value) {
    const error=String(value.error);
    return response({error:errorStatuses[error] ? error : "unavailable"},errorStatuses[error] ?? 503);
  }
  return null;
}
export async function handleReferral(req:Request,config:ReferralConfig,rpc:ReferralRpc):Promise<Response> {
  try {
    if(req.headers.get("origin")!==config.origin || (req.headers.get("sec-fetch-site") && req.headers.get("sec-fetch-site")!=="same-origin")) return response({error:"origin"},403);
    if(!req.headers.get("content-type")?.startsWith("application/json")) return response({error:"content_type"},415);
    const parsed=await readJsonWithLimit<Record<string,unknown>>(req,16384);
    if(!parsed.success) return response({error:"invalid_body"},parsed.status);
    const body=parsed.data;
    if(!body || typeof body!=="object" || Array.isArray(body)) return response({error:"invalid"},400);
    const op=body.op;
    const keys:Record<string,string[]>={register:["op"],status:["op"],renew:["op"],restore:["op","recovery"],start:["op","code"],submit:["op","id","nonce","revision","level","actions"]};
    if(typeof op!=="string" || !Object.hasOwn(keys,op) || Object.keys(body).some(k=>!keys[op].includes(k)) || keys[op].some(k=>!(k in body))) return response({error:"invalid"},400);
    const cookieName=config.secure ? "__Host-jelloo_referral" : "jelloo_referral";
    const cookie=(req.headers.get("cookie") ?? "").split(";").map(v=>v.trim()).find(v=>v.startsWith(cookieName+"="))?.slice(cookieName.length+1);
    let token=opaque(cookie) ? cookie : undefined;
    let recovery:string|undefined;
    if(op==="restore") {if(!opaque(body.recovery)) return response({error:"invalid"},400);token=body.recovery;}
    if(op==="register" && !token) {token=randomBytes(32).toString("hex");recovery=token;}
    if(!token) return response({error:"unauthorized"},401);
    const actor=actorHash(token);
    const ip=createHmac("sha256",config.secret).update("referral-ip:"+extractClientIp(req)).digest("hex");
    const limited=await rpc("limit",actor,{ip});
    const denied=dbError(limited);if(denied) return denied;
    if(!limited || typeof limited!=="object" || !("ok" in limited) || limited.ok!==true) return response({error:"unavailable"},503);
    let dbOp=op, data:Record<string,unknown>={};
    if(op==="restore" || op==="register" && !recovery) dbOp="status";
    if(op==="register" && recovery || op==="renew") data={code:randomBytes(16).toString("hex")};
    if(op==="start") {if(!codeValid(body.code)) return response({error:"invalid_link"},400);data={code:body.code,revision:REFERRAL_REVISION};}
    if(op==="submit") {
      if(!uuidValid(body.id) || !uuidValid(body.nonce)) return response({error:"invalid_session"},400);
      if(body.revision!==REFERRAL_REVISION) return response({error:"revision"},409);
      if(!verifyTutorial(body.level,body.revision,body.actions)) return response({error:"invalid_proof"},422);
      dbOp="advance";data={id:body.id,nonce:body.nonce,revision:body.revision,level:body.level,digest:digest(JSON.stringify(body.actions))};
    }
    const result=await rpc(dbOp,actor,data),failure=dbError(result);
    if(failure) return failure;
    if(!validStatus(result)) return response({error:"unavailable"},503);
    const setCookie=op==="register" || op==="restore" ? `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${config.secure?"; Secure":""}` : undefined;
    return response({status:result,...(recovery?{recovery}:{})},200,setCookie);
  } catch {
    // Never log bearer credentials, recovery codes, transcript or service keys.
    console.error("Jelloo referral request failed: configuration/storage unavailable");
    return response({error:"unavailable"},503);
  }
}
