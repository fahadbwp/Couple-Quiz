import {currentUtcDateString} from "./daily";
export function watchUtcDay(change:(day:string)=>void,read=()=>currentUtcDateString(),schedule=(check:()=>void)=>{
 const timer=setInterval(check,10000);document.addEventListener("visibilitychange",check);
 return ()=>{clearInterval(timer);document.removeEventListener("visibilitychange",check);};
}){
 let last=read();change(last);
 return schedule(()=>{const next=read();if(next!==last){last=next;change(next);}});
}
