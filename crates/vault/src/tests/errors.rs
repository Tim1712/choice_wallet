//! Errors never carry secret material (SECURITY.md, "Rules for vault code"), even when a
//! host sends a secret in the wrong shape or the wrong field.

use super::*;

#[test]
fn errors_never_echo_secret_material() {
    let (_, _, unlock_key) = wallet();
    let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    let key = "4646464646464646464646464646464646464646464646464646464646464646";
    // A secret sent bare instead of as {"mnemonic": …} / {"private_key": …}.
    for (secret, needle) in [(phrase, "abandon abandon"), (key, key)] {
        let e = call(
            "seal_secret",
            json!({ "unlock_key": unlock_key, "wallet": "w1", "secret": secret }),
        )
        .unwrap_err();
        assert!(
            !e["message"].as_str().unwrap().contains(needle),
            "seal_secret error leaks: {e}"
        );
        assert_eq!(e["code"], "bad_request");
    }
    // The unlock key in a mistyped field.
    let e = call(
        "accounts",
        json!({ "secret": "00", "wallet": "w1", "unlock_key": "00", "accounts": [unlock_key] }),
    )
    .unwrap_err();
    assert!(
        !e["message"].as_str().unwrap().contains(unlock_key.as_str()),
        "accounts error leaks: {e}"
    );
    // A password or the unlock key where an account is expected.
    for (method, params) in [
        (
            "reveal",
            json!({ "vault": "00", "password": "x", "secret": "00", "wallet": "w1", "account": PASSWORD }),
        ),
        (
            "sign",
            json!({ "secret": "00", "wallet": "w1", "unlock_key": "00", "account": unlock_key, "request": {}, "digest": "00" }),
        ),
    ] {
        let e = call(method, params).unwrap_err().to_string();
        assert!(
            !e.contains(PASSWORD) && !e.contains(unlock_key.as_str()),
            "{method} error leaks: {e}"
        );
    }
    // A request that isn't an envelope at all.
    let out = handle(&json!({ "method": "unlock", "password": PASSWORD }).to_string());
    assert!(
        out.contains("bad_request") && !out.contains(PASSWORD),
        "envelope error leaks: {out}"
    );
}

#[test]
fn a_missing_field_is_still_named() {
    let e = call("unlock", json!({ "password": PASSWORD })).unwrap_err();
    assert_eq!(e["message"], "unlock: missing field `vault`");
}
