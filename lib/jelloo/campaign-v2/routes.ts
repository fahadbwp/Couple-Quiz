/** Development preview navigation; content/save identities remain separate. */
export const BUNNY_PATH="/jelloo/character-worlds";
export const PREVIOUS_WORLD_PATH=`${BUNNY_PATH}/previous`;
export function worldLevelHref(id:number,previous=false) {
 if(!Number.isInteger(id)||id<1||id>50)throw new Error("Invalid world level");
 return `${previous?PREVIOUS_WORLD_PATH:BUNNY_PATH}?level=${id}`;
}
export function bunnyAliasDestination(level:unknown) {
 return typeof level==="string"&&/^[1-9]\d*$/.test(level)&&Number(level)<=50?worldLevelHref(Number(level)):BUNNY_PATH;
}

export const BUNNY_LEVELS_PATH=`${BUNNY_PATH}?view=levels`;
export const BUNNY_WORLDS_PATH="/jelloo/map";

export const PANDA_PATH=`${BUNNY_PATH}/panda`;
export const PANDA_LEVELS_PATH=`${PANDA_PATH}?view=levels`;
export const PANDA_WORLDS_PATH="/jelloo/map";
export function pandaLevelHref(id:number){
 if(!Number.isInteger(id)||id<51||id>100)throw new Error("Invalid Panda world level");
 return `${PANDA_PATH}?level=${id}`;
}
export function pandaAliasDestination(level:unknown){
 return typeof level==="string"&&/^[1-9]\d*$/.test(level)&&Number(level)>=51&&Number(level)<=100?pandaLevelHref(Number(level)):PANDA_PATH;
}

export const CAT_PATH=`${BUNNY_PATH}/cat`;
export const CAT_LEVELS_PATH=`${CAT_PATH}?view=levels`;
export const CAT_WORLDS_PATH="/jelloo/map";
export function catLevelHref(id:number){
 if(!Number.isInteger(id)||id<101||id>150)throw new Error("Invalid Cat world level");
 return `${CAT_PATH}?level=${id}`;
}
export function catAliasDestination(level:unknown){
 return typeof level==="string"&&/^[1-9]\d*$/.test(level)&&Number(level)>=101&&Number(level)<=150?catLevelHref(Number(level)):CAT_PATH;
}

export function usesBunnyShell(path:string){return (path===BUNNY_PATH||path.startsWith(`${BUNNY_PATH}/`))&&!path.startsWith(PREVIOUS_WORLD_PATH)}

/** Current local preview; production stays on the released campaign until separately approved. */
export function jellooEntryHref(mode:string|undefined){return mode==="development"?BUNNY_PATH:"/jelloo/map"}
