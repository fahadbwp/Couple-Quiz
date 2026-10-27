/** Explicit rectangular geometry; legacy numbers remain square grids. */
export type GridLike = number | {size: number; columns?: number; rows?: number};
export function dimensions(grid: GridLike) {
  const rectangular=typeof grid!=="number" && (grid.columns!==undefined || grid.rows!==undefined);
  const columns=typeof grid==="number" ? grid : rectangular ? grid.columns : grid.size;
  const rows=typeof grid==="number" ? grid : rectangular ? grid.rows : grid.size;
  if(!Number.isSafeInteger(columns)||!Number.isSafeInteger(rows)||columns!<1||rows!<1||columns!>64||rows!>64) throw new Error("Invalid grid dimensions");
  return {columns:columns!,rows:rows!,count:columns!*rows!};
}
export function gridPosition(index:number,grid:GridLike) {
  const {columns,count}=dimensions(grid);
  if(!Number.isInteger(index)||index<0||index>=count) throw new Error("Invalid grid index");
  return {row:Math.floor(index/columns),column:index%columns};
}
export function gridNeighbour(index:number,direction:number,grid:GridLike):number|null {
  const {columns,rows,count}=dimensions(grid);
  if(!Number.isInteger(index)||index<0||index>=count||!Number.isInteger(direction)||direction<0||direction>3) return null;
  const row=Math.floor(index/columns),col=index%columns;
  return direction===0 ? row>0?index-columns:null : direction===1 ? col<columns-1?index+1:null : direction===2 ? row<rows-1?index+columns:null : col>0?index-1:null;
}
