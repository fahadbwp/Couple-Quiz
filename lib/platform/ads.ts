export const ADS_ENABLED:boolean=false;
export const PLACEMENTS={"home-after-discovery":{game:"platform",phase:"idle"},"games-after-list":{game:"platform",phase:"idle"},"quiz-after-result":{game:"quiz",phase:"result"},"jelloo-after-result":{game:"jelloo",phase:"result"}} as const;
export type AdPlacement=keyof typeof PLACEMENTS;
export function mayShowAd(slot:AdPlacement,context:{consent:boolean;familyApproved:boolean;internal:boolean;phase:"idle"|"active"|"pin"|"submitting"|"result";enabled?:boolean}){
 return (context.enabled??ADS_ENABLED)&&context.consent&&context.familyApproved&&!context.internal&&Object.hasOwn(PLACEMENTS,slot)&&context.phase===PLACEMENTS[slot].phase;
}
