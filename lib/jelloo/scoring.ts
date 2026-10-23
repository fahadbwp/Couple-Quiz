import { ports, neighbour, type Direction, type GameState, type Level } from "./engine";

// Enumerates possible simple routes, including shortcuts through decoys. A budget
// exhaustion is never accepted as proof of quality.
export function analyzePuzzle(level: Level, budget = 50000) {
  let explored = 0, minMoves = Infinity, starMoves = Infinity, shortest = Infinity, fewestTurns = Infinity, solutions = 0;
  const visit = (index: number, incoming: Direction | undefined, seen: number, moves: number, length: number, turns: number, collected: number, jumped=false) => {
    if (++explored > budget) return;
    if (index === level.home) {
      if (incoming !== level.tiles[index].port) return;
      solutions++; minMoves = Math.min(minMoves,moves); shortest = Math.min(shortest,length); fewestTurns = Math.min(fewestTurns,turns);
      if (collected === (level.collectibles?.length ?? 0)) starMoves = Math.min(starMoves,moves);
      return;
    }
    const tile = level.tiles[index];
    if(level.character && ((tile.terrain==="water" && level.character!=="octopus") || (tile.terrain==="wall" && level.character!=="cat") || (tile.terrain==="cracked" && level.character!=="panda"))) return;
    if (tile.kind === "blank") return;
    const options = new Map<Direction,number>();
    for (let r=0;r<(tile.kind === "start" ? 1 : 4);r++) {
      const connections = ports({...tile,rotation:tile.rotation+r});
      if (incoming !== undefined && !connections.includes(incoming)) continue;
      for (const exit of connections.filter(d=>d!==incoming)) if (!options.has(exit)) options.set(exit,r);
    }
    for (const [exit,cost] of options) {
      let next = neighbour(index,exit,level.size),usedJump=jumped;
      if(next!==null && level.character && level.tiles[next].terrain==="gap") {
        if(level.character!=="bunny" || jumped) continue;
        next=neighbour(next,exit,level.size);usedJump=true;
      }
      if (next === null || (seen & (1<<next))) continue;
      visit(next,(exit+2)%4 as Direction,seen|(1<<next),moves+cost,length+1,turns+(tile.kind === "corner" ? 1 : 0),collected+(level.collectibles?.includes(next) ? 1 : 0),usedJump);
    }
  };
  visit(level.start,undefined,1<<level.start,0,1,0,0);
  return {minMoves,starMoves,shortest,fewestTurns,solutions,exhausted:explored>budget,explored};
}

export function collectedStars(game: GameState) {
  if (game.trace && "jellies" in game.trace) {
    const visited = new Set<number>();
    const multiTrace = game.trace as { jellies: { path: number[] }[] };
    multiTrace.jellies.forEach(j => {
      j.path.slice(0, game.cursor + 1).forEach(cell => visited.add(cell));
    });
    return (game.level.collectibles ?? []).filter(i => visited.has(i));
  }
  const visited = new Set(game.trace?.path.slice(0,game.cursor+1) ?? []);
  return (game.level.collectibles ?? []).filter(i=>visited.has(i));
}
export function scoreRun(game: GameState) {
  const collected = collectedStars(game).length;
  const total = game.level.collectibles?.length ?? 0;
  const withinLimit = game.moves <= (game.level.moveLimit ?? Infinity);
  return {stars:game.status !== "won" ? 0 : !withinLimit ? 1 : collected === total ? 3 : 2,collected,total,withinLimit};
}
