import type { GameState } from "./engine";
export type Cue = "rotate" | "hop" | "collect" | "win" | "confused";
export function feedbackFor(previous: GameState, next: GameState): Cue[] {
  if(previous.level.id !== next.level.id || previous.runId !== next.runId) return [];
  if(next.status==="lost" && previous.status!=="lost") return ["confused"];
  if(previous.status !== "running") return [];
  if(next.status === "won") return ["win"];
  if(next.status === "blocked") return ["confused"];
  if(next.status === "running" && next.cursor > previous.cursor) {
    const trace = next.trace;
    const hasCollected = next.level.collectibles?.some(c => {
      if (trace && "jellies" in trace) {
        return (trace as { jellies: { path: number[] }[] }).jellies.some(j => j.path[Math.min(next.cursor, j.path.length - 1)] === c);
      }
      return trace?.path[next.cursor] === c;
    });
    return hasCollected ? ["hop","collect"] : ["hop"];
  }
  return [];
}
export const STEP_MS = 420;
export function stepDuration(motion: boolean, reducedMotion: boolean) { return motion && !reducedMotion ? STEP_MS : 100; }

// One lazily created audio context, unlocked only by a player gesture.
export class GameAudio {
  private context: AudioContext | null = null;
  private voices = new Set<OscillatorNode>();
  private last = -Infinity;
  unlock() {
    try {
      if (!this.context) this.context = new AudioContext();
      if(this.context.state === "suspended") void this.context.resume().catch(()=>{});
    } catch { /* Audio is optional; gameplay remains available. */ }
  }
  play(cue: Cue) {
    const ctx = this.context;
    if(!ctx || ctx.state !== "running") return;
    if(cue === "rotate" && ctx.currentTime-this.last < 0.045) return;
    if(cue === "rotate") this.last = ctx.currentTime;
    const notes = {rotate:[440],hop:[280],collect:[880,1175],win:[523,659,784,1047],confused:[330,294]}[cue];
    notes.forEach((frequency,i)=>{
      if(this.voices.size>=12) return;
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      const start = ctx.currentTime+i*0.09;
      oscillator.type = "sine"; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0,start); gain.gain.linearRampToValueAtTime(0.06,start+0.012); gain.gain.exponentialRampToValueAtTime(0.001,start+0.14);
      oscillator.connect(gain); gain.connect(ctx.destination); this.voices.add(oscillator);
      oscillator.onended = ()=>{this.voices.delete(oscillator); oscillator.disconnect();gain.disconnect();};
      oscillator.start(start); oscillator.stop(start+0.16);
    });
  }
  stop() { for(const voice of this.voices) { try {voice.stop();} catch {} } this.voices.clear(); }
  dispose() { this.stop(); if(this.context) void this.context.close().catch(()=>{}); this.context=null; }
}
