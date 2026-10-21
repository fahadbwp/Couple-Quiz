import { levelAt } from "./endless";

self.onmessage = (event: MessageEvent<{id:number;seed:number;request:number}>) => {
  const {id,seed,request} = event.data;
  try { self.postMessage({request,level:levelAt(id,seed)}); }
  catch { self.postMessage({request,error:"This meadow could not be prepared. Please try again."}); }
};
