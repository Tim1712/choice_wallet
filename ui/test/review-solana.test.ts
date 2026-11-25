// What a site's Solana transaction review shows, from the vault's display.
import assert from "node:assert/strict";
import { test } from "node:test";

import type { SolanaDisplay, SolanaStep } from "../src/protocol.ts";
import { shown } from "../src/review.ts";

const SIGNER = "signer";
const display = (instructions: SolanaStep[]): SolanaDisplay => ({
  kind: "solana_transaction",
  chain: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  signer: SIGNER,
  fee_payer: SIGNER,
  signers: [SIGNER],
  version: "legacy",
  fee: { base: "5000", priority: "0", total: "5000", unit_limit: null, unit_price: null },
  durable_nonce: false,
  lookup_tables: [],
  instructions,
});
const SYSTEM = { program: "11111111111111111111111111111111", program_name: "System" };

test("SOL out of an account derived from the signer is a send; from anyone else's, a line", () => {
  const seed = (base: string): SolanaStep => ({ ...SYSTEM, type: "transfer_with_seed", from: "derivedAccount", base, to: "them", lamports: "7" });
  assert.deepEqual(shown(display([seed(SIGNER)]), "mainnet").sends, [{ coins: [{ denom: "sol", amount: "7" }], to: "them" }]);
  const theirs = shown(display([seed("someoneElse")]), "mainnet");
  assert.deepEqual(theirs.sends, []);
  assert.equal(theirs.others.length, 1);
});
