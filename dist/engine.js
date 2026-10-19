(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.GuardrailEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const digitMap = { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" };
  const unitAliases = {
    "%": "%", minute: "min", minutes: "min", min: "min", mins: "min", मिनट: "min",
    hour: "hr", hours: "hr", hr: "hr", hrs: "hr", घंटा: "hr", घंटे: "hr",
    second: "sec", seconds: "sec", sec: "sec", secs: "sec", सेकंड: "sec",
    mg: "mg", milligram: "mg", milligrams: "mg", मिलीग्राम: "mg",
    g: "g", gram: "g", grams: "g", ग्राम: "g", kg: "kg", kilogram: "kg", kilograms: "kg", किलोग्राम: "kg",
    ml: "ml", millilitre: "ml", millilitres: "ml", मिलीलीटर: "ml", l: "l", litre: "l", litres: "l", लीटर: "l",
    mm: "mm", millimetre: "mm", millimetres: "mm", मिलीमीटर: "mm", cm: "cm", centimetre: "cm", centimetres: "cm", सेंटीमीटर: "cm",
    rpm: "rpm", "°c": "celsius", celsius: "celsius"
  };

  function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  const unitPattern = Object.keys(unitAliases).filter((unit) => unit !== "%").sort((a, b) => b.length - a.length).map(escapeRegExp).join("|");

  function normalizeDigits(text) {
    return String(text || "").replace(/[०-९]/g, (digit) => digitMap[digit]);
  }

  function parseSteps(text) {
    const normalized = normalizeDigits(text).replace(/\r/g, "").trim();
    if (!normalized) return [];
    const numbered = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => line.replace(/^\d+\s*[.)\-:]\s*/, "").trim()).filter(Boolean);
    if (numbered.length > 1) return numbered;
    return normalized.split(/(?<=[.!?।])\s+/u).map((step) => step.trim()).filter(Boolean);
  }

  function extractQuantities(text) {
    const normalized = normalizeDigits(text).toLowerCase();
    const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(%|${unitPattern})?`, "giu");
    return Array.from(normalized.matchAll(regex)).map((match) => {
      const rawUnit = (match[2] || "").toLowerCase();
      return { value: Number(match[1]), unit: unitAliases[rawUnit] || rawUnit || "number", raw: match[0].trim(), numberRaw: match[1] };
    });
  }

  function hasNegation(text, language) {
    const normalized = normalizeDigits(text).toLowerCase();
    const patterns = language === "English"
      ? [/\bnever\b/u, /\bdo not\b/u, /\bdon't\b/u, /\bmust not\b/u, /\bshould not\b/u, /\bno\b/u]
      : [/नहीं/u, /मत/u, /ना करें/u, /न करें/u, /न छुएं/u, /न खोलें/u, /कभी नहीं/u];
    return patterns.some((pattern) => pattern.test(normalized));
  }

  function extractProtectedTerms(text) {
    return Array.from(new Set(String(text || "").match(/\b[A-Z][A-Z0-9-]{1,}\b/g) || []));
  }

  function quantitySignature(quantity) { return `${quantity.value}:${quantity.unit}`; }

  function compareQuantities(sourceStep, targetStep, stepIndex) {
    const sourceQuantities = extractQuantities(sourceStep);
    const targetQuantities = extractQuantities(targetStep);
    const sourceSignatures = sourceQuantities.map(quantitySignature);
    const targetSignatures = targetQuantities.map(quantitySignature);
    if (sourceSignatures.length === targetSignatures.length && sourceSignatures.every((signature, index) => signature === targetSignatures[index])) return null;
    if (!sourceQuantities.length && !targetQuantities.length) return null;
    const sourceQuantity = sourceQuantities.find((quantity, index) => quantitySignature(quantity) !== targetSignatures[index]) || sourceQuantities[0];
    const targetQuantity = targetQuantities.find((quantity, index) => quantitySignature(quantity) !== sourceSignatures[index]) || targetQuantities[0];
    const isDuration = sourceQuantity && ["min", "hr", "sec"].includes(sourceQuantity.unit);
    const isPercentage = sourceQuantity?.unit === "%";
    const title = isDuration ? "Duration mismatch" : isPercentage ? "Percentage mismatch" : "Quantity mismatch";
    const sourceDisplay = sourceQuantity?.raw || "missing";
    const targetDisplay = targetQuantity?.raw || "missing";
    let suggestion = targetStep;
    if (sourceQuantity && targetQuantity) suggestion = targetStep.replace(targetQuantity.numberRaw, String(sourceQuantity.value));
    return {
      id: `quantity-${stepIndex}`, type: isDuration ? "duration_mismatch" : isPercentage ? "percentage_mismatch" : "quantity_mismatch",
      severity: "critical", title, step: stepIndex + 1, category: "Safety procedure", source: sourceStep, target: targetStep,
      sourceHighlight: sourceQuantity?.raw || "", targetHighlight: targetQuantity?.raw || "",
      explanation: `The required value changed from ${sourceDisplay} to ${targetDisplay}. A numerical change can alter how the procedure is performed and must be reviewed before publication.`,
      suggestion, confidence: 0.99
    };
  }

  function compareNegation(sourceStep, targetStep, stepIndex, sourceLanguage, targetLanguage) {
    if (!hasNegation(sourceStep, sourceLanguage) || hasNegation(targetStep, targetLanguage)) return null;
    return {
      id: `negation-${stepIndex}`, type: "missing_negation", severity: "critical", title: "Safety negation missing", step: stepIndex + 1,
      category: "Prohibited action", source: sourceStep, target: targetStep, sourceHighlight: "", targetHighlight: "",
      explanation: "The source prohibits an action, but an equivalent negative instruction was not detected in the translation. This may reverse the intended safety meaning.",
      suggestion: "Human translation required — restore the prohibited-action wording.", confidence: 0.96
    };
  }

  function compareTerms(sourceStep, targetStep, stepIndex) {
    const missingTerms = extractProtectedTerms(sourceStep).filter((term) => !targetStep.toUpperCase().includes(term));
    if (!missingTerms.length) return null;
    return {
      id: `terms-${stepIndex}`, type: "protected_term_missing", severity: "warning", title: "Protected term missing", step: stepIndex + 1,
      category: "Technical terminology", source: sourceStep, target: targetStep, sourceHighlight: missingTerms.join(", "), targetHighlight: "",
      explanation: `${missingTerms.join(", ")} should remain unchanged across languages, but ${missingTerms.length === 1 ? "it was" : "they were"} not found in the translation.`,
      suggestion: `Review the translation and restore: ${missingTerms.join(", ")}.`, confidence: 1
    };
  }

  function auditSop({ sourceText, targetText, sourceLanguage = "English", targetLanguage = "Hindi" }) {
    const sourceSteps = parseSteps(sourceText);
    const targetSteps = parseSteps(targetText);
    const findings = [];
    const alignedCount = Math.min(sourceSteps.length, targetSteps.length);
    if (sourceSteps.length !== targetSteps.length) {
      findings.push({
        id: "step-count", type: "step_count_mismatch", severity: "warning", title: "Step count mismatch", step: null,
        category: "Document structure", source: `${sourceSteps.length} source steps`, target: `${targetSteps.length} translated steps`,
        sourceHighlight: String(sourceSteps.length), targetHighlight: String(targetSteps.length),
        explanation: "The translated SOP does not contain the same number of procedural steps as the source.",
        suggestion: "Review the document structure and restore any missing steps.", confidence: 1
      });
    }
    for (let index = 0; index < alignedCount; index += 1) {
      findings.push(...[
        compareQuantities(sourceSteps[index], targetSteps[index], index),
        compareNegation(sourceSteps[index], targetSteps[index], index, sourceLanguage, targetLanguage),
        compareTerms(sourceSteps[index], targetSteps[index], index)
      ].filter(Boolean));
    }
    const criticalCount = findings.filter((finding) => finding.severity === "critical").length;
    const warningCount = findings.filter((finding) => finding.severity === "warning").length;
    const totalChecks = alignedCount * 3 + (sourceSteps.length === targetSteps.length ? 0 : 1);
    return {
      score: Math.max(0, 100 - criticalCount * 38 - warningCount * 16),
      status: criticalCount ? "blocked" : warningCount ? "review" : "pass",
      findings, criticalCount, warningCount, passedChecks: Math.max(0, totalChecks - findings.length), totalChecks, stepCount: sourceSteps.length
    };
  }

  return { auditSop, parseSteps, extractQuantities, hasNegation, extractProtectedTerms };
});
