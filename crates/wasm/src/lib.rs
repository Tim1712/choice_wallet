//! The vault for the browser extension: [`handle`], compiled to WASM.
//!
//! The service worker imports the wasm-bindgen glue statically and calls
//! `handle(JSON.stringify({method, params}))`. The protocol is `choice-wallet-vault`'s; this
//! crate only exposes it. It has no `forbid(unsafe_code)`, because the glue
//! `#[wasm_bindgen]` generates uses `unsafe`; the crate itself contains none.

use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;
use zeroize::Zeroize;

/// Handle one vault request (JSON) and return the response (JSON), a string.
///
/// The request can hold a password or an unlock key, and the response a recovery phrase, a
/// private key or the unlock key, so both copies in WASM memory are wiped once handled: the
/// response is copied into a JavaScript string first (a returned `String` would be freed
/// unwiped). The JavaScript strings can't be wiped: JS strings are immutable.
#[wasm_bindgen]
pub fn handle(mut request: String) -> JsValue {
    let mut response = choice_wallet_vault::handle(&request);
    request.zeroize();
    let out = JsValue::from_str(&response);
    response.zeroize();
    out
}
