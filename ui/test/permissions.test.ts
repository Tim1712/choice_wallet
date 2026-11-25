// Approvals and grants: which grants are shown as able to move the account's funds.

import assert from "node:assert/strict";
import { test } from "node:test";

import { allowanceLevel, canMoveFunds, feeAllowanceLevel, permissionName } from "../src/permissions.ts";

test("every grant is red unless its type is known not to move funds", () => {
  for (const red of [
    "/cosmos.bank.v1beta1.MsgSend",
    "/cosmwasm.wasm.v1.MsgExecuteContract",
    // Run-3: these move the granter's funds too, and were shown in the normal colour.
    "/injective.wasmx.v1.MsgExecuteContractCompat",
    "/injective.peggy.v1.MsgSendToEth",
    "/injective.exchange.v2.MsgPrivilegedExecuteContract",
    "/cosmwasm.wasm.v1.MsgInstantiateContract",
    "/injective.exchange.v2.MsgExternalTransfer",
    // A trading grant can trade the funds away.
    "/injective.exchange.v2.MsgCreateSpotMarketOrder",
    // Unknown and future types.
    "/some.future.v1.MsgAnything",
  ]) {
    assert.equal(canMoveFunds(red), true, red);
  }
  assert.equal(canMoveFunds(null), true, "a non-generic grant");
  for (const fine of ["/cosmos.staking.v1beta1.MsgDelegate", "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward", "/cosmos.gov.v1.MsgVote", "/injective.exchange.v2.MsgCancelSpotOrder", "/injective.exchange.v1beta1.MsgBatchCancelDerivativeOrders"]) {
    assert.equal(canMoveFunds(fine), false, fine);
  }
});

test("only order messages are called orderbook trading", () => {
  assert.equal(permissionName("/injective.exchange.v2.MsgCreateSpotLimitOrder"), "Trade on the INJ orderbook");
  assert.equal(permissionName("/injective.exchange.v2.MsgPrivilegedExecuteContract"), "Privileged Execute Contract for you");
  assert.equal(permissionName("/injective.exchange.v2.MsgExternalTransfer"), "External Transfer for you");
});

// Allowances were red only from 2^128 (ERC20, Permit2) or never (CW20, fee allowances), so
// one for the whole balance, or a fee allowance with no limit, showed in the normal colour.
test("an allowance is red when it can take all there is, amber when capped below a known balance", () => {
  const max = (2n ** 256n - 1n).toString();
  assert.equal(allowanceLevel(max, "100"), "red");
  assert.equal(allowanceLevel((2n ** 128n).toString(), undefined), "red");
  // The whole balance, or more: red, as unlimited would be.
  assert.equal(allowanceLevel("100", "100"), "red");
  assert.equal(allowanceLevel("101", "100"), "red");
  assert.equal(allowanceLevel("1", "0"), "red");
  // A balance the wallet didn't read: it could be all of it.
  assert.equal(allowanceLevel("1", undefined), "red");
  // Capped below what the account holds.
  assert.equal(allowanceLevel("99", "100"), "amber");

  assert.equal(feeAllowanceLevel([], "inj", "5"), "red", "no limit");
  assert.equal(feeAllowanceLevel([{ denom: "inj", amount: "5" }], "inj", "5"), "red");
  assert.equal(feeAllowanceLevel([{ denom: "inj", amount: "5" }], "inj", undefined), "red");
  assert.equal(feeAllowanceLevel([{ denom: "inj", amount: "4" }], "inj", "5"), "amber");
  assert.equal(feeAllowanceLevel([{ denom: "peggy0xdAC17F958D2ee523a2206206994597C13D831ec7", amount: "4" }], "inj", "5"), "amber");
});
