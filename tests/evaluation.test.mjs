import assert from "node:assert/strict";
import "../public/engine.js";
import "../public/evaluation.js";

const results = globalThis.GuardrailEvaluation.run(globalThis.GuardrailEngine);
const failures = results.filter((result) => !result.passed);

assert.equal(results.length, 18, "The public regression suite should contain 18 labeled cases.");
assert.deepEqual(failures, [], `Regression failures: ${failures.map((failure) => failure.id).join(", ")}`);
console.log(`All ${results.length} evaluation cases matched their expected outcome.`);
