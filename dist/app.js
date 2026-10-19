const sample = {
  source: `1. Switch off the tablet coating machine.\n\n2. Disconnect the machine from power for 15 minutes before cleaning.\n\n3. Wear nitrile gloves and safety goggles. Never touch exposed electrical components.\n\n4. Clean the coating pan with the approved 70% IPA solution.`,
  target: `1. टैबलेट कोटिंग मशीन बंद करें।\n\n2. सफाई से पहले मशीन को 5 मिनट के लिए बिजली से अलग करें।\n\n3. नाइट्राइल दस्ताने और सुरक्षा चश्मा पहनें। खुले बिजली के हिस्सों को न छुएं।\n\n4. स्वीकृत 70% IPA घोल से कोटिंग पैन साफ करें।`,
  suggestion: "सफाई से पहले मशीन को 15 मिनट के लिए बिजली से अलग करें।"
};

const sourceText = document.querySelector("#source-text");
const targetText = document.querySelector("#target-text");
const targetLanguage = document.querySelector("#target-language");
const targetLabel = document.querySelector(".editor-card:nth-child(2) .editor-label");
const auditButton = document.querySelector("#audit-button");
const results = document.querySelector("#results");
const loadExample = document.querySelector("#load-example");
const copySuggestion = document.querySelector("#copy-suggestion");
const resolveButton = document.querySelector("#resolve-button");
const dismissButton = document.querySelector("#dismiss-button");
const reviewActions = document.querySelector(".review-actions");
const reviewStatus = document.querySelector("#review-status");

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

function updateCounts() {
  document.querySelector("#source-count").textContent = `${wordCount(sourceText.value)} words`;
  document.querySelector("#target-count").textContent = `${wordCount(targetText.value)} words`;
}

function resetReview() {
  reviewActions.classList.remove("reviewed");
  reviewStatus.textContent = "Awaiting human review";
  resolveButton.textContent = "Mark as resolved";
}

sourceText.addEventListener("input", updateCounts);
targetText.addEventListener("input", updateCounts);

targetLanguage.addEventListener("change", () => {
  targetLabel.innerHTML = `<span class="language-dot target"></span> ${targetLanguage.value} translation`;
});

loadExample.addEventListener("click", () => {
  sourceText.value = sample.source;
  targetText.value = sample.target;
  targetLanguage.value = "Hindi";
  targetLabel.innerHTML = `<span class="language-dot target"></span> Hindi translation`;
  results.classList.remove("visible");
  results.setAttribute("aria-hidden", "true");
  resetReview();
  updateCounts();
});

auditButton.addEventListener("click", () => {
  auditButton.disabled = true;
  auditButton.classList.add("loading");
  auditButton.querySelector(".button-label").textContent = "Running 12 checks";

  window.setTimeout(() => {
    auditButton.disabled = false;
    auditButton.classList.remove("loading");
    auditButton.querySelector(".button-label").textContent = "Audit again";
    results.classList.add("visible");
    results.setAttribute("aria-hidden", "false");
    resetReview();
    window.setTimeout(() => results.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, 1100);
});

copySuggestion.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(sample.suggestion);
    copySuggestion.textContent = "Copied";
  } catch {
    copySuggestion.textContent = "Select correction above";
  }
  window.setTimeout(() => { copySuggestion.textContent = "Copy correction"; }, 1600);
});

resolveButton.addEventListener("click", () => {
  reviewActions.classList.add("reviewed");
  reviewStatus.textContent = "Resolved by reviewer";
  resolveButton.textContent = "Resolved ✓";
});

dismissButton.addEventListener("click", () => {
  reviewActions.classList.add("reviewed");
  reviewStatus.textContent = "Finding dismissed with reviewer note";
  resolveButton.textContent = "Reopen finding";
});

updateCounts();
