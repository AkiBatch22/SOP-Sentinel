import assert from "node:assert/strict";
import "../public/engine.js";

const { auditSop, extractQuantities, parseSteps } = globalThis.GuardrailEngine;

function run(name, test) {
  try { test(); console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}

run("parses numbered SOP steps", () => {
  assert.deepEqual(parseSteps("1. First action.\n\n2. Second action."), ["First action.", "Second action."]);
});

run("strips numbering from a single-step SOP", () => {
  assert.deepEqual(parseSteps("1. First action."), ["First action."]);
});

run("normalizes Devanagari digits and Hindi units", () => {
  assert.deepEqual(extractQuantities("१५ मिनट"), [{ value: 15, unit: "min", raw: "15 मिनट", numberRaw: "15" }]);
});

run("blocks a changed safety duration", () => {
  const result = auditSop({ sourceText: "1. Disconnect power for 15 minutes.", targetText: "1. बिजली को 5 मिनट के लिए बंद करें।", sourceLanguage: "English", targetLanguage: "Hindi" });
  assert.equal(result.status, "blocked");
  assert.equal(result.score, 62);
  assert.equal(result.findings[0].type, "duration_mismatch");
});

run("blocks a missing negation", () => {
  const result = auditSop({ sourceText: "1. Never open the guard.", targetText: "1. सुरक्षा गार्ड खोलें।", sourceLanguage: "English", targetLanguage: "Hindi" });
  assert.equal(result.findings.some((finding) => finding.type === "missing_negation"), true);
});

run("warns when a protected technical term disappears", () => {
  const result = auditSop({ sourceText: "1. Verify the OTP before handover.", targetText: "1. सामान सौंपने से पहले कोड सत्यापित करें।", sourceLanguage: "English", targetLanguage: "Hindi" });
  assert.equal(result.status, "review");
  assert.equal(result.findings[0].type, "protected_term_missing");
});

run("passes equivalent deterministic safety facts", () => {
  const result = auditSop({ sourceText: "1. Do not share the OTP.\n2. Wait 15 minutes.\n3. Use 70% IPA.", targetText: "1. OTP साझा न करें।\n2. 15 मिनट प्रतीक्षा करें।\n3. 70% IPA का उपयोग करें।", sourceLanguage: "English", targetLanguage: "Hindi" });
  assert.equal(result.status, "pass");
  assert.equal(result.findings.length, 0);
});

console.log("All deterministic engine tests passed.");
