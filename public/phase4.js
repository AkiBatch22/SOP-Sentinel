(function () {
  const STORAGE_KEY = "sop-sentinel-audits-v1";
  const historyList = document.querySelector("#history-list");
  const clearHistoryButton = document.querySelector("#clear-history");
  let currentRecord = null;

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }

  function writeHistory(records) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50))); }
    catch { /* Private browsing may disable storage; the audit still works. */ }
  }

  function statusLabel(status) {
    return status === "blocked" ? "Blocked" : status === "review" ? "Review" : "Passed";
  }

  function renderHistory() {
    const records = readHistory();
    clearHistoryButton.hidden = records.length === 0;
    if (!records.length) {
      historyList.innerHTML = '<div class="empty-history"><span>↗</span><div><strong>No saved audits yet</strong><p>Run an audit to create your first browser-local record.</p></div></div>';
      return;
    }
    historyList.innerHTML = records.map((record) => `
      <article class="history-item" data-record-id="${escapeHtml(record.id)}">
        <div class="history-status status-${escapeHtml(record.audit.status)}"><span></span>${statusLabel(record.audit.status)}</div>
        <div class="history-main"><strong>${escapeHtml(record.sourceLanguage)} → ${escapeHtml(record.targetLanguage)}</strong><p>${escapeHtml(new Date(record.createdAt).toLocaleString())} · ${record.audit.findings.length} findings</p></div>
        <div class="history-score"><strong>${record.audit.score}</strong><span>/100</span></div>
        <div class="history-actions"><button type="button" data-history-view>View</button><button type="button" data-history-download>Report</button><button type="button" data-history-delete aria-label="Delete audit">×</button></div>
      </article>`).join("");
  }

  function reportHtml(record) {
    const findings = record.audit.findings.length ? record.audit.findings.map((finding) => `
      <section><h3>${escapeHtml(finding.title)} <small>${escapeHtml(finding.severity.toUpperCase())}</small></h3>
      <p><b>Step:</b> ${finding.step || "Document level"} · <b>Confidence:</b> ${Math.round(finding.confidence * 100)}%</p>
      <div class="evidence"><p><b>Source</b><br>${escapeHtml(finding.source)}</p><p><b>Translation</b><br>${escapeHtml(finding.target)}</p></div>
      <p><b>Reason:</b> ${escapeHtml(finding.explanation)}</p><p><b>Suggested action:</b> ${escapeHtml(finding.suggestion)}</p><p><b>Reviewer verdict:</b> ${escapeHtml(record.reviews?.[finding.id]?.replaceAll("_", " ") || "Not reviewed")}</p></section>`).join("") : "<section><h3>No safety mismatches found</h3><p>Automated checks passed. Human review is still recommended.</p></section>";
    return `<!doctype html><html><head><meta charset="utf-8"><title>SOP Sentinel audit ${escapeHtml(record.id)}</title><style>body{font:15px/1.55 Arial,sans-serif;color:#14231d;max-width:900px;margin:50px auto;padding:0 24px}header{border-bottom:3px solid #1e6148;padding-bottom:22px}h1{margin:0 0 6px}header p{color:#68746f}.score{font-size:42px;font-weight:800;color:#1e6148}section{border:1px solid #dce5e0;border-radius:12px;padding:20px;margin:18px 0}small{color:#a43730}.evidence{display:grid;grid-template-columns:1fr 1fr;gap:12px}.evidence p{background:#f3f6f4;padding:14px;border-radius:8px}footer{margin-top:28px;color:#78837e;font-size:12px}@media print{body{margin:20px auto}}</style></head><body><header><h1>SOP Sentinel</h1><p>Multilingual SOP audit report · ${escapeHtml(new Date(record.createdAt).toLocaleString())}</p><div class="score">${record.audit.score}/100</div><p>${statusLabel(record.audit.status)} · ${record.audit.criticalCount} critical · ${record.audit.warningCount} warnings · ${record.sourceLanguage} → ${record.targetLanguage}</p></header>${findings}<footer>AI-assisted decision support. This report does not certify translation accuracy; bilingual human review is required.</footer></body></html>`;
  }

  function downloadReport(record) {
    const blob = new Blob([reportHtml(record)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sop-sentinel-audit-${record.id}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function saveAudit(detail) {
    const record = { ...detail, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() };
    currentRecord = record;
    writeHistory([record, ...readHistory()]);
    renderHistory();
  }

  document.addEventListener("guardrail:audit-complete", (event) => saveAudit(event.detail));

  document.querySelector("#results").addEventListener("click", (event) => {
    if (event.target.closest("#download-current-report") && currentRecord) {
      const latest = readHistory().find((record) => record.id === currentRecord.id) || currentRecord;
      downloadReport(latest);
    }
  });

  historyList.addEventListener("click", (event) => {
    const item = event.target.closest(".history-item");
    if (!item) return;
    const records = readHistory();
    const record = records.find((entry) => entry.id === item.dataset.recordId);
    if (!record) return;
    if (event.target.closest("[data-history-download]")) return downloadReport(record);
    if (event.target.closest("[data-history-delete]")) {
      writeHistory(records.filter((entry) => entry.id !== record.id));
      renderHistory();
      return;
    }
    if (event.target.closest("[data-history-view]")) {
      document.querySelector("#source-text").value = record.sourceText;
      document.querySelector("#target-text").value = record.targetText;
      document.querySelector("#target-language").value = record.targetLanguage;
      document.querySelector("#audit-title").scrollIntoView({ behavior: "smooth" });
    }
  });

  clearHistoryButton.addEventListener("click", () => {
    writeHistory([]);
    currentRecord = null;
    renderHistory();
  });

  function renderBenchmark() {
    const results = window.GuardrailEvaluation.run(window.GuardrailEngine);
    const passed = results.filter((result) => result.passed).length;
    const percent = Math.round((passed / results.length) * 100);
    document.querySelector("#benchmark-score").innerHTML = `<strong>${percent}%</strong><span>agreement</span>`;
    document.querySelector("#benchmark-summary").innerHTML = `<article><strong>${results.length}</strong><span>Labeled SOP pairs</span></article><article><strong>${passed}</strong><span>Expected outcomes matched</span></article><article><strong>${results.length - passed}</strong><span>Regression failures</span></article>`;
    document.querySelector("#benchmark-grid").innerHTML = results.map((result) => `<article class="benchmark-case ${result.passed ? "passed" : "failed"}"><span>${result.passed ? "✓" : "!"}</span><div><strong>${escapeHtml(result.label)}</strong><p>Expected: ${escapeHtml(result.expected.replaceAll("_", " "))}</p></div></article>`).join("");
  }

  renderHistory();
  renderBenchmark();
})();
