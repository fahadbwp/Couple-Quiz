import {previewAccess} from "./preview-session";
import {restoreBunnyGame,type BunnySave} from "./bunny-save";
export function bunnyResume(save:BunnySave):{view:"play";level:number}|{view:"levels"|"worlds"} {
 const game=restoreBunnyGame(save);
 if(game&&game.status!=="won")return {view:"play",level:game.level.id};
 if(save.completed===50)return {view:"worlds"};
 const next=save.completed+1;
 return previewAccess(next,save).accessible?{view:"play",level:next}:{view:"levels"};
}

/** The URL owns an active attempt. Updated rewards must not replace a won board. */
export function bunnyScreen(resume:ReturnType<typeof bunnyResume>|null,requested:string|null,selectedView:string|null) {
 const mapSelected=selectedView==="levels"||selectedView==="worlds";
 const view=mapSelected?selectedView:requested!==null?"play":resume?.view??"play";
 const level=requested!==null?(/^[1-9]\d*$/.test(requested)?Number(requested):NaN):resume?.view==="play"?resume.level:1;
 return {view,level,canonicalize:!!resume&&requested===null&&!mapSelected&&resume.view==="play"};
}
