// A lock ends every site request: one waiting, and one the site made just before, still on
// its way to the approval window when the wallet locked.

import assert from "node:assert/strict";
import { test } from "node:test";

import { ok, PASSWORD, wallet } from "./fake";

const SITE = "https://app.example";
type Reply = { result?: unknown; error?: { code: number; message: string } };

test("a site request made as the wallet locks doesn't outlive the lock", async () => {
  const w = await wallet();
  const site = (method: string, params?: unknown) => w.service.dapp(SITE, { method, params }) as Promise<Reply>;
  const en = site("eth_requestAccounts");
  for (let i = 0; i < 200 && w.ui.opened.length < 1; i++) await new Promise((r) => setTimeout(r, 5));
  ok(await w.service.handle({ type: "dapp_answer", id: w.ui.opened.at(-1)!, approve: true }));
  const account = ((await en).result as string[])[0]!;
  // The lock lands after each number of the request's steps, before and after it queues.
  for (let delay = 0; delay < 12; delay++) {
    const before = w.ui.opened.length;
    const asked = site("personal_sign", ["0x6869", account]);
    for (let k = 0; k < delay; k++) await Promise.resolve();
    ok(await w.service.handle({ type: "lock" }));
    await new Promise((r) => setTimeout(r, 30));
    if (w.ui.opened.length > before) {
      const open = await w.service.handle({ type: "dapp_request", id: w.ui.opened.at(-1)! });
      assert.equal(open.ok, false, `delay ${delay}: a request is still open after the lock`);
    }
    const reply = await asked;
    assert.ok(reply.error, `delay ${delay}: ${JSON.stringify(reply)}`);
    ok(await w.service.handle({ type: "unlock", password: PASSWORD }));
  }
});
