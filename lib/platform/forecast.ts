export type Assumptions={dau:number;activeShare:number;days:number;requestsPerDau:number;fill:number;netEcpm:number;hosting:number;tools:number;marketing:number;other:number};
export const SCENARIOS:Record<string,Assumptions>={Conservative:{dau:1000,activeShare:.2,days:30,requestsPerDau:2,fill:.5,netEcpm:.3,hosting:20,tools:10,marketing:0,other:0},Base:{dau:5000,activeShare:.2,days:30,requestsPerDau:3,fill:.7,netEcpm:1,hosting:40,tools:20,marketing:0,other:0},Optimistic:{dau:15000,activeShare:.25,days:30,requestsPerDau:4,fill:.85,netEcpm:3,hosting:100,tools:40,marketing:100,other:0}};
export function forecast(a:Assumptions,target=1000){
 const expected=Object.keys(SCENARIOS.Base).sort().join();
 if(Object.keys(a).sort().join()!==expected||Object.values(a).some(v=>!Number.isFinite(v)||v<0)||a.activeShare<=0||a.activeShare>1||a.fill>1||a.days<1||a.days>31||target<0||!Number.isFinite(target))throw Error("Invalid assumptions");
 const requests=a.dau*a.days*a.requestsPerDau,impressions=requests*a.fill,costs=a.hosting+a.tools+a.marketing+a.other,gross=impressions*a.netEcpm/1000;
 const neededImpressions=a.netEcpm>0?(target+costs)*1000/a.netEcpm:null;
 const neededDau=neededImpressions!==null&&a.fill>0&&a.requestsPerDau>0?neededImpressions/(a.days*a.requestsPerDau*a.fill):null;
 if([a.dau/a.activeShare,requests,impressions,costs,gross,...(neededImpressions===null?[]:[neededImpressions]),...(neededDau===null?[]:[neededDau])].some(v=>!Number.isFinite(v)))throw Error("Assumptions overflow");
 return {estimatedMau:a.dau/a.activeShare,requests,impressions,gross,costs,net:gross-costs,neededImpressions,neededDau};
}
