(function () {
  const STORAGE_KEY = "sop-sentinel-audits-v1";
  const cases = window.GuardrailPilotCases || [];
  const caseSelect = document.querySelector("#pilot-case-select");
  const casePreview = document.querySelector("#pilot-case-preview");
  const progress = document.querySelector("#pilot-progress");
  const reviewerPanel = document.querySelector("#reviewer-panel");
  let activeRecordId = null;

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }

  function writeHistory(records) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50))); }
    catch { /* Metrics remain visible for the current session when storage is unavailable. */ }
  }

  function selectedCase() { return cases.find((testCase) => testCase.id === caseSelect.value) || cases[0]; }

  function renderCasePreview() {
    const testCase = selectedCase();
    if (!testCase) return;
    casePreview.innerHTML = `<div><span>${escapeHtml(testCase.domain)} · ${escapeHtml(testCase.kind)}</span><strong>${escapeHtml(testCase.label)}</strong></div><p><b>Expected signal</b>${escapeHtml(testCase.expected.replaceAll("_", " "))}</p>`;
  }

  function outcomeFor(record, testCase) {
    if (!record || !testCase) return null;
    const types = record.audit.findings.map((finding) => finding.type);
    const passed = testCase.expected === "pass" ? types.length === 0 : types.includes(testCase.expected);
    return { passed, actual: types[0] || "pass" };
  }

  function latestPilotRecords() {
    const byCase = new Map();
    for (const record of readHistory()) if (record.pilotCaseId && !byCase.has(record.pilotCaseId)) byCase.set(record.pilotCaseId, record);
    return byCase;
  }

  function renderProgress() {
    const records = latestPilotRecords();
    progress.innerHTML = cases.map((testCase, index) => {
      const outcome = outcomeFor(records.get(testCase.id), testCase);
      const state = !outcome ? "untested" : outcome.passed ? "matched" : "missed";
      return `<button type="button" class="pilot-progress-dot ${state}" data-pilot-id="${escapeHtml(testCase.id)}" title="${escapeHtml(testCase.label)}: ${state}">${index + 1}</button>`;
    }).join("");
  }

  function calculateMetrics() {
    const history = readHistory();
    const verdicts = history.flatMap((record) => Object.values(record.reviews || {}));
    const labeled = verdicts.filter((verdict) => verdict === "confirmed" || verdict === "false_positive");
    const confirmed = labeled.filter((verdict) => verdict === "confirmed").length;
    const precision = labeled.length ? Math.round((confirmed / labeled.length) * 100) : null;
    const pilotRecords = latestPilotRecords();
    const positiveCases = cases.filter((testCase) => testCase.expected !== "pass" && pilotRecords.has(testCase.id));
    const detected = positiveCases.filter((testCase) => outcomeFor(pilotRecords.get(testCase.id), testCase)?.passed).length;
    const recall = positiveCases.length ? Math.round((detected / positiveCases.length) * 100) : null;
    const latencies = history.map((record) => record.latencyMs).filter((value) => Number.isFinite(value));
    const latency = latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null;
    return { reviewed: labeled.length, precision, recall, latency, auditedCases: pilotRecords.size };
  }

  function renderMetrics() {
    const metrics = calculateMetrics();
    document.querySelector("#metric-reviewed").textContent = String(metrics.reviewed);
    document.querySelector("#metric-precision").textContent = metrics.precision === null ? "—" : `${metrics.precision}%`;
    document.querySelector("#metric-recall").textContent = metrics.recall === null ? "—" : `${metrics.recall}%`;
    document.querySelector("#metric-latency").textContent = metrics.latency === null ? "—" : metrics.latency < 1000 ? `${metrics.latency}ms` : `${(metrics.latency / 1000).toFixed(1)}s`;
    const state = document.querySelector("#evidence-state");
    state.innerHTML = `<i></i> ${metrics.auditedCases ? `${metrics.auditedCases}/${cases.length} cases audited` : "Awaiting reviewer data"}`;
    state.classList.toggle("active", metrics.auditedCases > 0);
  }

  function renderReviewer(record) {
    if (!record) return;
    activeRecordId = record.id;
    const testCase = cases.find((entry) => entry.id === record.pilotCaseId);
    const heading = testCase ? `${testCase.label} · expected ${testCase.expected.replaceAll("_", " ")}` : "Custom audit";
    const cards = record.audit.findings.length ? record.audit.findings.map((finding) => {
      const verdict = record.reviews?.[finding.id] || "";
      return `<article class="review-verdict" data-finding-id="${escapeHtml(finding.id)}"><div><span>${escapeHtml(finding.severity)}</span><strong>${escapeHtml(finding.title)}</strong><p>${escapeHtml(finding.explanation)}</p></div><div class="verdict-buttons"><button class="${verdict === "confirmed" ? "selected" : ""}" data-verdict="confirmed" type="button">Correct finding</button><button class="${verdict === "false_positive" ? "selected" : ""}" data-verdict="false_positive" type="button">False positive</button><button class="${verdict === "uncertain" ? "selected" : ""}" data-verdict="uncertain" type="button">Unsure</button></div></article>`;
    }).join("") : '<div class="reviewer-empty"><span>✓</span><div><strong>No findings to label</strong><p>This case contributes to recall through its known expected outcome.</p></div></div>';
    reviewerPanel.innerHTML = `<div class="reviewer-heading"><div><span>BILINGUAL REVIEW</span><h3>${escapeHtml(heading)}</h3></div><small>Verdicts stay in this browser</small></div><div class="review-verdicts">${cards}</div>`;
  }

  function loadCase(testCase) {
    if (!testCase) return;
    window.GuardrailPilotCurrentCaseId = testCase.id;
    const source = document.querySelector("#source-text");
    const target = document.querySelector("#target-text");
    const targetLanguage = document.querySelector("#target-language");
    source.value = testCase.source;
    target.value = testCase.target;
    targetLanguage.value = testCase.targetLanguage;
    source.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("input", { bubbles: true }));
    targetLanguage.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#audit-title").scrollIntoView({ behavior: "smooth" });
  }

  caseSelect.innerHTML = cases.map((testCase, index) => `<option value="${escapeHtml(testCase.id)}">${String(index + 1).padStart(2, "0")} · ${escapeHtml(testCase.domain)} · ${escapeHtml(testCase.label)}</option>`).join("");
  caseSelect.addEventListener("change", renderCasePreview);
  document.querySelector("#load-pilot-case").addEventListener("click", () => loadCase(selectedCase()));
  progress.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pilot-id]");
    if (!button) return;
    caseSelect.value = button.dataset.pilotId;
    renderCasePreview();
  });

  document.addEventListener("guardrail:audit-complete", () => {
    const newest = readHistory()[0];
    if (newest) renderReviewer(newest);
    renderProgress();
    renderMetrics();
  });

  reviewerPanel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-verdict]");
    const card = event.target.closest("[data-finding-id]");
    if (!button || !card || !activeRecordId) return;
    const history = readHistory();
    const record = history.find((entry) => entry.id === activeRecordId);
    if (!record) return;
    record.reviews = { ...(record.reviews || {}), [card.dataset.findingId]: button.dataset.verdict };
    writeHistory(history);
    renderReviewer(record);
    renderMetrics();
  });

  function technicalBrief() {
    const metrics = calculateMetrics();
    return `# SOP Sentinel — two-week validation brief\n\n## Hypothesis\nA hybrid rule-and-LLM guardrail can focus bilingual reviewers on safety-critical translation changes without becoming an autonomous certification system.\n\n## Pilot scope\n- 30 consented SOP pairs across three frontline workflows\n- One agreed target language and qualified bilingual reviewers\n- Deterministic checks for numbers, units, negations, protected terms, and structure\n- Semantic review for omissions, reversed meaning, unsafe simplification, and dependency order\n\n## Success metrics\n- Finding precision and issue recall against reviewer ground truth\n- Median end-to-end latency and reviewer time saved\n- False-positive categories and model/rule failure modes\n- Cost per audited SOP after the free-tier prototype\n\n## Current prototype evidence\n- Synthetic regression agreement: 18/18\n- Pilot-style cases audited in this browser: ${metrics.auditedCases}/${cases.length}\n- Reviewer-labeled findings: ${metrics.reviewed}\n- Observed precision: ${metrics.precision === null ? "Not enough data" : `${metrics.precision}%`}\n- Observed recall: ${metrics.recall === null ? "Not enough data" : `${metrics.recall}%`}\n- Average latency: ${metrics.latency === null ? "Not enough data" : `${metrics.latency} ms`}\n\n## Decision rule\nProceed only if the system improves review speed while meeting an agreed recall threshold for critical errors. All publication decisions remain human-owned.\n`;
  }

  document.querySelector("#download-brief").addEventListener("click", () => {
    const blob = new Blob([technicalBrief()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sop-sentinel-pilot-brief.md";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("#copy-outreach").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try { await navigator.clipboard.writeText(document.querySelector("#outreach-copy").textContent.trim()); button.textContent = "Copied ✓"; }
    catch { button.textContent = "Copy unavailable"; }
    window.setTimeout(() => { button.textContent = "Copy outreach note"; }, 1600);
  });

  renderCasePreview();
  renderProgress();
  renderMetrics();
})();
