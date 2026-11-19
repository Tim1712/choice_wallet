// The back arrow is never a form's submit button: pressing Enter in a form (the password
// step of a new wallet) must submit the form, not go back and drop what was entered.

import assert from "node:assert/strict";
import { test } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BackBar } from "../../ui/src/kit";

test("the back arrow is type=button, so Enter in a form doesn't press it", () => {
  const html = renderToStaticMarkup(createElement(BackBar, { title: "New wallet", onBack: () => {} }));
  const back = html.match(/<button[^>]*aria-label="Back"[^>]*>/)?.[0] ?? "";
  assert.match(back, /type="button"/, back);
});
