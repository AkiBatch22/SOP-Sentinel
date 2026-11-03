import assert from "node:assert/strict";
import {
  createSessionToken,
  passwordsMatch,
  verifySessionToken,
} from "../lib/auth.ts";

const secret = "test-session-secret-that-is-longer-than-thirty-two-characters";
const token = createSessionToken(secret);

assert.equal(passwordsMatch("founder-demo", "founder-demo"), true);
assert.equal(passwordsMatch("founder-demo", "wrong-password"), false);
assert.equal(verifySessionToken(token, secret), true);
assert.equal(verifySessionToken(`${token}tampered`, secret), false);
assert.equal(verifySessionToken(token, `${secret}-wrong`), false);
assert.equal(verifySessionToken("1.invalid", secret), false);

console.log("Authentication token and password checks passed.");
