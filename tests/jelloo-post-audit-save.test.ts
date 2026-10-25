import test from "node:test";
import assert from "node:assert/strict";
import { decodeJourney, encodeJourney, journeyReducer, newJourney } from "../lib/jelloo/progress";
import { readAdventureProgress } from "../lib/jelloo/saved-progress";

const records = (start: number, end: number) => Object.fromEntries(Array.from({length:end-start+1}, (_, i) => [start+i, (i%3)+1]));

test("Adventure stars survive more than 200 records; only oldest Endless history expires", () => {
  const best = {...records(1, 100), ...records(101, 301)};
  const state = {...newJourney(42), completed:301, best};
  const next = journeyReducer(state, {type:"rotate", index:13});
  assert.deepEqual(Object.fromEntries(Object.entries(next.best).filter(([id])=>Number(id)<=100)), records(1,100));
  assert.equal(next.best[101], undefined);
  assert.equal(Object.keys(next.best).length, 300);
  assert.equal(next.completed,301);
  assert.deepEqual(decodeJourney(encodeJourney(next))?.best,next.best);
  assert.equal(state.best[101],best[101]);
});

test("legacy 200-record saves migrate without losing records or reconstructing missing stars", () => {
  for (const best of [records(1,200), records(101,300), {1:3, ...records(102,300)}]) {
    const original = {...newJourney(42), completed:300,best};
    const restored = decodeJourney(encodeJourney(original))!;
    assert.ok(restored);
    const next = journeyReducer(restored,{type:"rotate",index:13});
    assert.deepEqual(next.best,best);
    assert.equal(next.completed,300);
    assert.equal(next.rules,original.rules);
    assert.equal(next.multiRevision,original.multiRevision);
  }
  const legacy = JSON.parse(encodeJourney(newJourney()));
  delete legacy.best;
  assert.deepEqual(decodeJourney(JSON.stringify(legacy))?.best,{});
});

test("expanded achievement saves remain bounded and reject invalid earned-star data", () => {
  const base = {...newJourney(),completed:500};
  for (const best of [records(101,301), {...records(1,100),...records(101,301)}, {1:4}, {501:1}, {"01":2}]) {
    assert.equal(decodeJourney(encodeJourney({...base,best})),null);
  }
  const highest = Number.MAX_SAFE_INTEGER-2;
  const valid = {...base,completed:highest,best:{...records(1,100),...records(highest-199,highest)}};
  assert.ok(encodeJourney(valid).length <8192);
  assert.deepEqual(decodeJourney(encodeJourney(valid))?.best,valid.best);
});

test("unreadable saves stay unchanged through repeated reads and recover only from valid data", () => {
  for (const corrupt of ["", "audit-corrupt-sentinel", "null", '{"version":999}']) {
    let stored = corrupt;
    assert.equal(readAdventureProgress(()=>stored).status,"error");
    assert.equal(readAdventureProgress(()=>stored).status,"error");
    assert.equal(stored,corrupt);
    stored = encodeJourney({...newJourney(42),completed:2,best:{1:3,2:2}});
    assert.deepEqual(readAdventureProgress(()=>stored),{status:"ready",completed:2,best:{1:3,2:2}});
  }
});

test("missing saves are fresh, inaccessible storage is not fresh progress", () => {
  assert.deepEqual(readAdventureProgress(()=>null),{status:"ready",completed:0,best:{}});
  assert.equal(readAdventureProgress(()=>{throw new Error("denied");}).status,"error");
});
