import type {Journey} from "./progress";
import {REFERRALS_RELEASED} from "./referrals/release";
import {validStatus} from "./referrals/protocol";
export const COSMETICS_KEY="jelloo.cosmetics.v1";
export const COSMETICS=[
 {id:"crown",name:"Royal Pal Crown",referrals:1,levels:20,stars:0,legacy:"Golden Clover"},
 {id:"dream",name:"Secret Dream Theme",referrals:3,levels:60,stars:0,legacy:"Rainbow Trail"},
 {id:"legendary",name:"Legendary Victory Celebration",referrals:5,levels:100,stars:200,legacy:"Ambassador badge"},
] as const;
export type Cosmetic=typeof COSMETICS[number]["id"];
export type CosmeticPrefs={version:1;crown:boolean;dream:boolean;legendary:boolean};
export const defaultCosmetics=():CosmeticPrefs=>({version:1,crown:false,dream:false,legendary:false});
export function decodeCosmetics(raw:string|null):CosmeticPrefs|null{
 if(raw===null)return defaultCosmetics();
 try{if(raw.length>256)return null;const s=JSON.parse(raw);return s&&Object.keys(s).sort().join()==="crown,dream,legendary,version"&&s.version===1&&[s.crown,s.dream,s.legendary].every(v=>typeof v==="boolean")?s:null;}catch{return null;}
}
export function achievementEntitlements(progress:Pick<Journey,"completed"|"best">){
 const stars=Object.entries(progress.best).reduce((n,[id,s])=>n+(/^[1-9]\d*$/.test(id)&&Number.isInteger(Number(id))&&Number(id)>=1&&Number(id)<=100&&Number(id)<=progress.completed&&Number.isInteger(s)&&s>=1&&s<=3?s:0),0);
 return Object.fromEntries(COSMETICS.map(c=>[c.id,Number.isSafeInteger(progress.completed)&&progress.completed>=c.levels&&stars>=c.stars])) as Record<Cosmetic,boolean>;
}
// Numeric DB thresholds remain unchanged. Old earned rows map to their new
// cosmetic presentation; the legacy badge remains in the referral UI.
export function mapReferralMilestones(thresholds:readonly number[]):Cosmetic[]{return COSMETICS.filter(c=>thresholds.includes(c.referrals)).map(c=>c.id);}
export function cosmeticEntitlements(progress:Pick<Journey,"completed"|"best">,serverStatus?:unknown){
 const result=achievementEntitlements(progress);
 // Client preferences never assert a server referral qualification.
 if(REFERRALS_RELEASED&&validStatus(serverStatus))for(const id of mapReferralMilestones(serverStatus.rewards))result[id]=true;
 return result;
}
export function activeCosmetics(prefs:CosmeticPrefs,earned:Record<Cosmetic,boolean>){return {crown:prefs.crown&&earned.crown,dream:prefs.dream&&earned.dream,legendary:prefs.legendary&&earned.legendary};}
