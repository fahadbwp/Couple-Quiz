export const EVENTS = ["page_view","game_card_click","game_start","adventure_level_start","adventure_level_complete","adventure_level_retry","level_map_open","daily_start","daily_complete","zen_start","power_trial_start","power_trial_complete","favourite_pal_equipped","quiz_create_start","quiz_create_complete","quiz_share_action","quiz_participant_start","quiz_participant_complete","quiz_results_view"] as const;
export type EventName = typeof EVENTS[number];
export type EventProperties = {game?:"jelloo"|"friendship-quiz";mode?:"adventure"|"daily"|"zen"|"trial"|"quiz";level?:number;outcome?:"won"|"retry"|"success";pal?:"bunny"|"panda"|"cat"|"octopus"|"fox";page?:PageName};
export const PAGES=["home","games","jelloo","map","daily","zen","pals","cosmetics","quiz","quiz-create","quiz-play","quiz-share","quiz-result","quiz-scoreboard","privacy"] as const;
export type PageName=typeof PAGES[number];
const choices={game:["jelloo","friendship-quiz"],mode:["adventure","daily","zen","trial","quiz"],outcome:["won","retry","success"],pal:["bunny","panda","cat","octopus","fox"],page:PAGES};
export function validEvent(name:unknown, properties:unknown):properties is EventProperties {
 if(typeof name!=="string" || !(EVENTS as readonly string[]).includes(name) || !properties || typeof properties!=="object" || Array.isArray(properties))return false;
 if(!Object.entries(properties).every(([key,value])=>key==="level" ? Number.isSafeInteger(value)&&Number(value)>=1&&Number(value)<=Number.MAX_SAFE_INTEGER : Object.hasOwn(choices,key) && (choices[key as keyof typeof choices] as readonly unknown[]).includes(value)) || JSON.stringify(properties).length>256)return false;
 const p=properties as EventProperties;
 if(name.startsWith("quiz_")&&(p.game!=="friendship-quiz"||p.mode!=="quiz"))return false;
 if(/^(adventure_|daily_|zen_|power_trial_|favourite_pal_)/.test(name)&&p.game!=="jelloo")return false;
 if(name.startsWith("adventure_")&&(p.mode!=="adventure"||p.level===undefined))return false;
 if(name.startsWith("daily_")&&p.mode!=="daily"||name.startsWith("power_trial_")&&p.mode!=="trial"||name==="zen_start"&&p.mode!=="zen")return false;
 return true;
}
export function pageName(pathname:string):PageName|undefined {
 const exact:Record<string,PageName>={"/":"home","/games":"games","/jelloo":"jelloo","/jelloo/map":"map","/jelloo/daily":"daily","/jelloo/zen":"zen","/jelloo/pals":"pals","/jelloo/cosmetics":"cosmetics","/quiz":"quiz","/quiz/create":"quiz-create","/privacy":"privacy"};
 if(Object.hasOwn(exact,pathname))return exact[pathname];
 const match=pathname.match(/^\/quiz\/(play|share|result|scoreboard)\/[^/]+\/?$/);
 return match ? `quiz-${match[1]}` as PageName : undefined;
}
export type AnalyticsRecord={version:1;name:EventName;properties:EventProperties;timestamp:number;visitor:string;session:string;firstSeen:number;dedupe:string};
const uuid=(s:unknown)=>typeof s==="string"&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s);
export function validRecord(v:unknown):v is AnalyticsRecord {
 if(!v||typeof v!=="object"||Array.isArray(v))return false;const r=v as AnalyticsRecord;
 return Object.keys(r).sort().join() === "dedupe,firstSeen,name,properties,session,timestamp,version,visitor" && r.version===1 && validEvent(r.name,r.properties)&&uuid(r.visitor)&&uuid(r.session)&&Number.isSafeInteger(r.timestamp)&&r.timestamp>=0&&r.timestamp<=8640000000000000&&Number.isSafeInteger(r.firstSeen)&&r.firstSeen>=0&&r.firstSeen<=r.timestamp&&typeof r.dedupe==="string"&&/^[a-f0-9]{64}$/.test(r.dedupe);
}
