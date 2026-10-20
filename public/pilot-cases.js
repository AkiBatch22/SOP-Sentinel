(function (root) {
  const domains = ["Pharma", "Manufacturing", "Cold chain", "Warehouse", "Field service", "Delivery"];
  const deterministic = (root.GuardrailEvaluation?.cases || []).map((testCase, index) => ({
    ...testCase,
    id: `det-${testCase.id}`,
    domain: domains[index % domains.length],
    kind: "Deterministic control",
    targetLanguage: "Hindi"
  }));

  const semantic = [
    { id: "sem-color", domain: "Warehouse", kind: "Semantic fidelity", label: "Wrong destination color", expected: "semantic_mismatch", source: "1. Place the inspected package on the blue shelf.", target: "1. जांचे गए पैकेज को लाल शेल्फ पर रखें।" },
    { id: "sem-valve", domain: "Manufacturing", kind: "Semantic fidelity", label: "Wrong valve direction", expected: "reversed_meaning", source: "1. Turn the pressure valve clockwise until it locks.", target: "1. दबाव वाल्व को लॉक होने तक वामावर्त घुमाएं।" },
    { id: "sem-order", domain: "Pharma", kind: "Semantic fidelity", label: "Dependency reordered", expected: "reordered_dependency", source: "1. Verify the batch number before releasing the tray.", target: "1. ट्रे जारी करने के बाद बैच नंबर सत्यापित करें।" },
    { id: "sem-omission", domain: "Field service", kind: "Semantic fidelity", label: "Inspection instruction omitted", expected: "missing_instruction", source: "1. Inspect the cable for damage and then connect the unit.", target: "1. यूनिट को कनेक्ट करें।" },
    { id: "sem-location", domain: "Cold chain", kind: "Semantic fidelity", label: "Storage location reversed", expected: "semantic_mismatch", source: "1. Keep the sample inside the insulated container during transit.", target: "1. परिवहन के दौरान नमूने को इंसुलेटेड कंटेनर के बाहर रखें।" },
    { id: "sem-simplified", domain: "Delivery", kind: "Semantic fidelity", label: "Identity check weakened", expected: "unsafe_simplification", source: "1. Match both the customer name and order address before handover.", target: "1. सामान सौंपने से पहले ग्राहक को देखें।" }
  ].map((testCase) => ({ ...testCase, targetLanguage: "Hindi" }));

  root.GuardrailPilotCases = [...deterministic, ...semantic];
})(typeof window !== "undefined" ? window : globalThis);
