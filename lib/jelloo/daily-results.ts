import {calculateNewStreak,type DailyStore} from "./daily";
import type {GameState} from "./engine";
import {scoreRun} from "./scoring";

// Preserve object identity for an already-recorded result. A React effect may
// revisit the same win after setting store state; it must settle, not loop.
export function recordDailyWin(store:DailyStore,game:GameState,date:string,completedAt=new Date().toISOString()):DailyStore{
 if(game.status!=="won")return store;
 const stars=scoreRun(game).stars,rotations=game.tiles.map(t=>t.rotation%4),previous=store.history[date];
 const choices=(value:Record<string,number>|undefined)=>JSON.stringify(Object.entries(value??{}).sort(([a],[b])=>a.localeCompare(b)));
 if(store.lastCompletedDate===date&&previous?.won&&previous.moves===game.moves&&previous.stars===stars&&JSON.stringify(previous.rotations)===JSON.stringify(rotations)&&choices(previous.choices)===choices(game.level.choices)&&store.activeDate===date&&store.activeMoves===game.moves&&JSON.stringify(store.activeRotations)===JSON.stringify(rotations)&&choices(store.activeChoices)===choices(game.level.choices))return store;
 const {currentStreak}=calculateNewStreak(store.currentStreak,store.lastCompletedDate,date);
 return {...store,activeDate:date,activeMoves:game.moves,activeRotations:rotations,activeChoices:game.level.choices,currentStreak,maxStreak:Math.max(store.maxStreak,currentStreak),lastCompletedDate:date,history:{...store.history,[date]:{date,won:true,moves:game.moves,stars,rotations,choices:game.level.choices,completedAt}}};
}
