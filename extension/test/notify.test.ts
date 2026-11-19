// Review: "something changed" reaches only connected sites' tabs. It used to go to every
// tab, so a site that never connected saw a ping each time the user locked, unlocked,
// switched account, or connected another site.

import assert from "node:assert/strict";
import { test } from "node:test";

import { notifyConnected, type NotifyIo } from "../src/notify";

function tabs(origins: Record<number, string | null>, connected: string[]) {
  const told: number[] = [];
  const io: NotifyIo = {
    connected: async () => connected,
    tabs: async () => Object.keys(origins).map(Number),
    originOf: async (t) => {
      if (origins[t] === null) throw new Error("no relay in this tab");
      return origins[t]!;
    },
    tell: (t) => void told.push(t),
  };
  return { io, told };
}

test("only connected sites' tabs hear that something changed", async () => {
  const { io, told } = tabs({ 1: "https://app.example", 2: "https://tracker.example", 3: "https://app.example", 4: null }, ["https://app.example"]);
  await notifyConnected(io);
  assert.deepEqual(told.sort(), [1, 3]);
});

test("nobody connected: no tab hears anything", async () => {
  const { io, told } = tabs({ 1: "https://app.example", 2: "https://tracker.example" }, []);
  await notifyConnected(io);
  assert.deepEqual(told, []);
});

test("a site just disconnected (or every site a reset dropped) still hears it", async () => {
  let t = tabs({ 1: "https://app.example", 2: "https://tracker.example" }, []);
  await notifyConnected(t.io, "https://app.example");
  assert.deepEqual(t.told, [1]);
  t = tabs({ 1: "https://a.example", 2: "https://b.example", 3: "https://tracker.example" }, []);
  await notifyConnected(t.io, ["https://a.example", "https://b.example"]);
  assert.deepEqual(t.told.sort(), [1, 2]);
});
