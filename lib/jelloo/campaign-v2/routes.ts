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
