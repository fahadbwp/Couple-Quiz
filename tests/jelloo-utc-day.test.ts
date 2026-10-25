import test from "node:test";
import assert from "node:assert/strict";
import {watchUtcDay} from "../lib/jelloo/utc-day";
test("UTC subscription changes exactly on the UTC day boundary and cleans up",()=>{
 let time=Date.UTC(2026,9,25,23,59,59),tick=()=>{},stopped=false;const seen:string[]=[];
 const stop=watchUtcDay(d=>seen.push(d),()=>new Date(time).toISOString().slice(0,10),fn=>{tick=fn;return()=>{stopped=true;};});
 tick();assert.deepEqual(seen,["2026-10-25"]);time+=2000;tick();tick();assert.deepEqual(seen,["2026-10-25","2026-10-26"]);stop();assert.equal(stopped,true);
});
