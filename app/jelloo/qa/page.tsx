import { notFound } from "next/navigation";
export const dynamic="force-dynamic";
export default async function LocalQA({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  if(process.env.NODE_ENV!=="development" || process.env.JELLOO_LOCAL_QA!=="1")notFound();
  const q=await searchParams;
  if(q.width){
    const width=[320,390,768,1280].includes(Number(q.width))?Number(q.width):390;
    const target=q.level?`/jelloo/qa?level=${q.level==="91"?91:71}`:"/jelloo/invite";
    return <main><h1>Local QA · {width}px viewport</h1><iframe title="QA viewport" src={target} style={{width,height:844,border:0,maxWidth:"100%"}}/></main>;
  }
  const {default:LocalQAGame}=await import("./LocalQAGame");
  if(q.fixture==="switch") {
    const {switchFixture}=await import("@/lib/jelloo/pals");
    return <><h1>Existing pressure-plate fixture — real engine, no saves</h1><LocalQAGame level={switchFixture()}/></>;
  }
  const {levelAt}=await import("@/lib/jelloo/endless");
  const {solveMultiJelly}=await import("@/lib/jelloo/multi-jelly");
  const level=levelAt(q.level==="91"?91:71,42);
  const solution=solveMultiJelly(level);
  const turns=solution.solution?.flatMap((t,i)=>Array.from({length:(t.rotation-level.tiles[i].rotation+4)%4},()=>i))??[];
  return <><h1>Disposable QA — no adventure saves</h1><nav><a href="?level=71">Level 71</a> · <a href="?level=91">Level 91</a> · <a href="?width=390">390px Invite</a> · <a href="?width=320">320px Invite</a></nav><p>Actual generator, seed 42. Solver reference clockwise tile indices: {turns.join(", ")}. Click tiles manually; no unlocks or auto-solve.</p><LocalQAGame key={level.id} level={level}/></>;
}
