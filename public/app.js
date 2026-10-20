const examples = {
  pharma: {
    language: "Hindi",
    source: `1. Switch off the tablet coating machine.\n\n2. Disconnect the machine from power for 15 minutes before cleaning.\n\n3. Wear nitrile gloves and safety goggles. Never touch exposed electrical components.\n\n4. Clean the coating pan with the approved 70% IPA solution.`,
    target: `1. टैबलेट कोटिंग मशीन बंद करें।\n\n2. सफाई से पहले मशीन को 5 मिनट के लिए बिजली से अलग करें।\n\n3. नाइट्राइल दस्ताने और सुरक्षा चश्मा पहनें। खुले बिजली के हिस्सों को न छुएं।\n\n4. स्वीकृत 70% IPA घोल से कोटिंग पैन साफ करें।`
  },
  manufacturing: {
    language: "Hindi",
    source: `1. Stop the conveyor and isolate the main power supply.\n\n2. Never open the safety guard while the motor is running.\n\n3. Maintain a minimum clearance of 20 cm from the cutting blade.`,
    target: `1. कन्वेयर बंद करें और मुख्य बिजली आपूर्ति अलग करें।\n\n2. मोटर चलते समय सुरक्षा गार्ड खोलें।\n\n3. कटिंग ब्लेड से कम से कम 20 सेंटीमीटर की दूरी बनाए रखें।`
  },
  delivery: {
    language: "Hindi",
    source: `1. Verify the customer name and order number before handover.\n\n2. Do not share the OTP over a phone call.\n\n3. Keep frozen items below 0°C during transit.`,
    target: `1. सामान सौंपने से पहले ग्राहक का नाम और ऑर्डर नंबर सत्यापित करें।\n\n2. फोन कॉल पर OTP साझा न करें।\n\n3. यात्रा के दौरान जमे हुए सामान को 0°C से नीचे रखें।`
  }
};

const sourceText = document.querySelector("#source-text");
const targetText = document.querySelector("#target-text");
const targetLanguage = document.querySelector("#target-language");
const targetLabel = document.querySelector(".editor-card:nth-child(2) .editor-label");
const auditButton = document.querySelector("#audit-button");
const results = document.querySelector("#results");
const exampleSelect = document.querySelector("#example-select");

function wordCount(text) { return text.trim() ? text.trim().split(/\s+/u).length : 0; }
function updateCounts() {
  document.querySelector("#source-count").textContent = `${wordCount(sourceText.value)} words`;
  document.querySelector("#target-count").textContent = `${wordCount(targetText.value)} words`;
}
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function highlight(text, needle) {
  const safeText = escapeHtml(text);
  if (!needle) return safeText;
  const safeNeedle = escapeHtml(needle);
  return safeText.replace(safeNeedle, `<mark>${safeNeedle}</mark>`);
}
function loadExample(key) {
  const example = examples[key];
  sourceText.value = example.source;
  targetText.value = example.target;
  targetLanguage.value = example.language;
  targetLabel.innerHTML = `<span class="language-dot target"></span> ${example.language} translation`;
  results.classList.remove("visible");
  results.setAttribute("aria-hidden", "true");
  updateCounts();
}

function findingMarkup(finding, sourceLanguage, translationLanguage) {
  const stepLabel = finding.step ? `Step ${finding.step}` : "Document level";
  return `
    <article class="finding-card ${finding.severity}" data-finding-id="${escapeHtml(finding.id)}">
      <div class="finding-topline">
        <div class="finding-title-group">
          <span class="severity-badge">${finding.severity.toUpperCase()}</span>
          <div><h3>${escapeHtml(finding.title)}</h3><p>${stepLabel} · ${escapeHtml(finding.category)}</p></div>
        </div>
        <span class="confidence">${Math.round(finding.confidence * 100)}% confidence</span>
      </div>
      <div class="comparison-grid">
        <div class="comparison-block"><span>ORIGINAL · ${escapeHtml(sourceLanguage).toUpperCase()}</span><p>${highlight(finding.source, finding.sourceHighlight)}</p></div>
        <div class="comparison-divider" aria-hidden="true">≠</div>
        <div class="comparison-block translated"><span>TRANSLATION · ${escapeHtml(translationLanguage).toUpperCase()}</span><p>${highlight(finding.target, finding.targetHighlight)}</p></div>
      </div>
      <div class="explanation"><span class="alert-icon" aria-hidden="true">!</span><div><strong>Why this was flagged</strong><p>${escapeHtml(finding.explanation)}</p></div></div>
      <div class="suggestion"><div><span>SUGGESTED ACTION</span><p>${escapeHtml(finding.suggestion)}</p></div><button class="copy-button" type="button" data-copy="${escapeHtml(finding.suggestion)}">Copy suggestion</button></div>
      <div class="review-actions"><p>Awaiting human review</p><div><button class="secondary-button dismiss-finding" type="button">Dismiss finding</button><button class="resolve-button resolve-finding" type="button">Mark as resolved</button></div></div>
    </article>`;
}

function renderResults(audit, aiReview) {
  const statusCopy = audit.status === "blocked" ? "Publication blocked" : audit.status === "review" ? "Review required" : "Ready for review";
  const findingCopy = audit.findings.length === 1 ? "One issue found" : `${audit.findings.length} issues found`;
  const cards = audit.findings.length
    ? audit.findings.map((finding) => findingMarkup(finding, "English", targetLanguage.value)).join("")
    : `<article class="success-state"><span>✓</span><div><h3>No safety mismatches found</h3><p>Deterministic checks and semantic review passed. Human review is still recommended.</p></div></article>`;
  const aiNote = aiReview.ok
    ? `<p class="ai-review-note"><span>AI</span> Semantic review completed with ${escapeHtml(aiReview.provider)} · ${escapeHtml(aiReview.model)}</p>`
    : `<p class="ai-review-note degraded"><span>!</span> ${escapeHtml(aiReview.error)} Deterministic findings are still shown.</p>`;
  results.innerHTML = `
    <div class="results-heading"><div><p class="section-kicker">AUDIT COMPLETE</p><h2>${findingCopy}</h2></div><span class="blocked-badge status-${audit.status}"><span></span>${statusCopy}</span></div>
    ${aiNote}
    <div class="metrics-grid">
      <article class="metric-card score-card"><div class="metric-copy"><span>Safety score</span><strong>${audit.score}<span>/100</span></strong></div><div class="score-ring" style="--score:${audit.score}%" aria-label="Safety score ${audit.score} out of 100"><span>${audit.score}</span></div></article>
      <article class="metric-card"><span>Critical issues</span><strong class="danger-text">${audit.criticalCount}</strong><small>${audit.criticalCount ? "Requires review" : "None detected"}</small></article>
      <article class="metric-card"><span>Warnings</span><strong>${audit.warningCount}</strong><small>${audit.warningCount ? "Check before publishing" : "No warnings found"}</small></article>
      <article class="metric-card"><span>Checks passed</span><strong>${audit.passedChecks}</strong><small>Across ${audit.stepCount} steps</small></article>
    </div>
    <div class="findings-list">${cards}</div>
    <p class="disclaimer">AI-assisted prototype analysis. Passing these checks does not guarantee translation accuracy; all findings require human review.</p>`;
  results.classList.add("visible");
  results.setAttribute("aria-hidden", "false");
}

sourceText.addEventListener("input", updateCounts);
targetText.addEventListener("input", updateCounts);
exampleSelect.addEventListener("change", () => loadExample(exampleSelect.value));
targetLanguage.addEventListener("change", () => { targetLabel.innerHTML = `<span class="language-dot target"></span> ${targetLanguage.value} translation`; });

function mergeAuditFindings(deterministicAudit, semanticFindings) {
  const findings = [...deterministicAudit.findings, ...semanticFindings];
  const criticalCount = findings.filter((finding) => finding.severity === "critical").length;
  const warningCount = findings.filter((finding) => finding.severity === "warning").length;
  return {
    ...deterministicAudit,
    findings,
    criticalCount,
    warningCount,
    score: Math.max(0, 100 - criticalCount * 38 - warningCount * 16),
    status: criticalCount ? "blocked" : warningCount ? "review" : "pass"
  };
}

auditButton.addEventListener("click", async () => {
  auditButton.disabled = true;
  auditButton.classList.add("loading");
  auditButton.querySelector(".button-label").textContent = "Running deterministic checks";
  const deterministicAudit = window.GuardrailEngine.auditSop({ sourceText: sourceText.value, targetText: targetText.value, sourceLanguage: "English", targetLanguage: targetLanguage.value });
  auditButton.querySelector(".button-label").textContent = "Running semantic AI review";
  let aiReview;
  let semanticFindings = [];
  try {
    const response = await fetch("/api/semantic-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText: sourceText.value, targetText: targetText.value, sourceLanguage: "English", targetLanguage: targetLanguage.value })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Semantic review unavailable.");
    semanticFindings = Array.isArray(payload.findings) ? payload.findings : [];
    aiReview = { ok: true, provider: payload.provider || "Groq Free", model: payload.model || "Qwen" };
  } catch (error) {
    aiReview = { ok: false, error: error instanceof Error ? error.message : "Semantic review unavailable." };
  }
  renderResults(mergeAuditFindings(deterministicAudit, semanticFindings), aiReview);
  window.setTimeout(() => {
    auditButton.disabled = false;
    auditButton.classList.remove("loading");
    auditButton.querySelector(".button-label").textContent = "Audit again";
    window.setTimeout(() => results.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, 250);
});

results.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) {
    try { await navigator.clipboard.writeText(copyButton.dataset.copy); copyButton.textContent = "Copied"; }
    catch { copyButton.textContent = "Copy unavailable"; }
    window.setTimeout(() => { copyButton.textContent = "Copy suggestion"; }, 1500);
    return;
  }
  const reviewButton = event.target.closest(".resolve-finding, .dismiss-finding");
  if (!reviewButton) return;
  const reviewActions = reviewButton.closest(".review-actions");
  reviewActions.classList.add("reviewed");
  const status = reviewActions.querySelector("p");
  if (reviewButton.classList.contains("resolve-finding")) { status.textContent = "Resolved by reviewer"; reviewButton.textContent = "Resolved ✓"; }
  else status.textContent = "Finding dismissed with reviewer note";
});

loadExample("pharma");
