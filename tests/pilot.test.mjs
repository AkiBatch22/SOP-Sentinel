import assert from "node:assert/strict";
import "../public/engine.js";
import "../public/evaluation.js";
import "../public/pilot-cases.js";

const cases = globalThis.GuardrailPilotCases;
assert.equal(cases.length, 24, "The pilot queue should contain 24 representative SOP pairs.");
assert.equal(cases.filter((testCase) => testCase.kind === "Semantic fidelity").length, 6);

const deterministic = cases.filter((testCase) => testCase.kind === "Deterministic control");
const failures = deterministic.filter((testCase) => {
  const audit = globalThis.GuardrailEngine.auditSop({ sourceText: testCase.source, targetText: testCase.target, sourceLanguage: "English", targetLanguage: "Hindi" });
  const actual = audit.findings[0]?.type || "pass";
  return actual !== testCase.expected;
});

assert.deepEqual(failures, [], "All deterministic pilot controls should retain their labeled outcomes.");
console.log(`Validated ${cases.length} pilot cases: ${deterministic.length} deterministic controls and 6 semantic review cases.`);
