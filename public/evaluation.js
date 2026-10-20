(function (root, factory) {
  const suite = factory();
  if (typeof module === "object" && module.exports) module.exports = suite;
  if (root) root.GuardrailEvaluation = suite;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const cases = [
    { id: "duration-min", label: "Changed minutes", expected: "duration_mismatch", source: "1. Disconnect power for 15 minutes.", target: "1. बिजली को 5 मिनट के लिए बंद करें।" },
    { id: "duration-devanagari", label: "Devanagari duration", expected: "duration_mismatch", source: "1. Wait for 20 minutes.", target: "1. १० मिनट प्रतीक्षा करें।" },
    { id: "seconds", label: "Changed seconds", expected: "duration_mismatch", source: "1. Hold for 30 seconds.", target: "1. 10 सेकंड तक पकड़ें।" },
    { id: "percentage", label: "Changed concentration", expected: "percentage_mismatch", source: "1. Clean with 70% IPA.", target: "1. 40% IPA से साफ करें।" },
    { id: "mass", label: "Changed milligrams", expected: "quantity_mismatch", source: "1. Add 25 mg of compound.", target: "1. 50 मिलीग्राम यौगिक डालें।" },
    { id: "weight", label: "Changed kilograms", expected: "quantity_mismatch", source: "1. Do not exceed 10 kg.", target: "1. 15 किलोग्राम से अधिक न हो।" },
    { id: "clearance", label: "Changed clearance", expected: "quantity_mismatch", source: "1. Keep 20 cm clearance.", target: "1. 5 सेंटीमीटर की दूरी रखें।" },
    { id: "rpm", label: "Changed RPM", expected: "quantity_mismatch", source: "1. Set the mixer to 300 RPM.", target: "1. मिक्सर को 500 RPM पर सेट करें।" },
    { id: "temperature", label: "Changed temperature", expected: "quantity_mismatch", source: "1. Store below 5°C.", target: "1. 10°C से नीचे रखें।" },
    { id: "never", label: "Missing never", expected: "missing_negation", source: "1. Never open the guard.", target: "1. सुरक्षा गार्ड खोलें।" },
    { id: "do-not", label: "Missing do not", expected: "missing_negation", source: "1. Do not share the code.", target: "1. कोड साझा करें।" },
    { id: "otp", label: "Missing OTP term", expected: "protected_term_missing", source: "1. Verify the OTP before handover.", target: "1. सौंपने से पहले कोड सत्यापित करें।" },
    { id: "ppe", label: "Missing PPE term", expected: "protected_term_missing", source: "1. Wear PPE before entry.", target: "1. प्रवेश से पहले सुरक्षा उपकरण पहनें।" },
    { id: "missing-step", label: "Missing procedural step", expected: "step_count_mismatch", source: "1. Stop the line.\n2. Isolate power.", target: "1. लाइन बंद करें।" },
    { id: "extra-step", label: "Additional procedural step", expected: "step_count_mismatch", source: "1. Seal the carton.", target: "1. कार्टन सील करें।\n2. कार्टन खोलें।" },
    { id: "safe-duration", label: "Preserved duration", expected: "pass", source: "1. Wait for 15 minutes.", target: "1. 15 मिनट प्रतीक्षा करें।" },
    { id: "safe-negation", label: "Preserved prohibition", expected: "pass", source: "1. Do not share the OTP.", target: "1. OTP साझा न करें।" },
    { id: "safe-mixed", label: "Preserved mixed controls", expected: "pass", source: "1. Use 70% IPA.\n2. Wait 10 minutes.", target: "1. 70% IPA का उपयोग करें।\n2. 10 मिनट प्रतीक्षा करें।" }
  ];

  function run(engine) {
    return cases.map((testCase) => {
      const audit = engine.auditSop({ sourceText: testCase.source, targetText: testCase.target, sourceLanguage: "English", targetLanguage: "Hindi" });
      const actual = audit.findings[0]?.type || "pass";
      return { ...testCase, actual, passed: actual === testCase.expected };
    });
  }

  return { cases, run };
});
