# SOP Sentinel

Interactive prototype for a multilingual SOP safety and localization auditor.

## Architecture

```mermaid
flowchart LR
    U[Reviewer in browser] --> UI[Audit interface<br/>guardrail.html and app.js]
    UI --> R[Deterministic rule engine<br/>engine.js]
    R --> M[Finding merger]
    UI --> API[POST /api/semantic-audit]
    API --> S[Server-side audit route<br/>route.ts]
    S --> G[Groq language model]
    G --> S
    S --> M
    M --> V[Evidence and publication decision]
    V --> H[Browser-local audit history]
    V --> P[Pilot validation and reviewer labels]
    V --> D[Downloadable HTML report]
```

The application uses two complementary audit layers:

- **Browser interface:** `public/guardrail.html`, `public/styles.css`, and `public/app.js` collect the source and translated SOPs and present the combined result.
- **Deterministic engine:** `public/engine.js` checks numbers, units, durations, percentages, negations, protected terms, and procedural structure without an external API call.
- **Semantic API:** `app/api/semantic-audit/route.ts` sends meaning-level checks to Groq from the server. The API key remains in the server environment and is never delivered to the browser.
- **Result merger:** `public/app.js` combines rule-based and semantic findings into one evidence model with severity, excerpts, explanations, and suggested corrections.
- **Validation layer:** `public/evaluation.js`, `public/pilot-cases.js`, and `public/pilot.js` run labeled cases, record reviewer verdicts, and calculate recall, precision, and latency.
- **Local persistence:** Recent audits and reviewer labels stay in browser `localStorage`; the prototype does not store customer SOPs in a database.

### Request flow

1. The reviewer provides the original SOP and its translation.
2. The browser runs deterministic checks immediately.
3. The browser calls the semantic audit API for omissions, reversed meaning, unsafe simplification, and reordered dependencies.
4. The API returns structured JSON findings, which are merged with the deterministic result.
5. The UI blocks publication when critical findings exist and shows the exact evidence to a human reviewer.
6. If Groq is unavailable or rate-limited, the request fails safely and the deterministic findings remain visible.

## Run locally

Install dependencies and start the full-stack preview:

```powershell
npm install
npm run dev
```

The deterministic analysis runs in the browser. Semantic analysis runs through a server-side route so the Groq key is never exposed to visitors.

## Current behavior

- Paste or edit source and translated SOP text.
- Detect changed numbers, units, percentages, and durations.
- Detect missing safety negations.
- Check protected uppercase technical terms.
- Flag missing or additional procedural steps.
- Try pharma, manufacturing, and delivery examples.
- Copy the suggested correction.
- Mark the finding as resolved or dismissed.
- Save recent audits in browser-local history.
- Download a self-contained HTML audit report.
- Run an 18-case labeled deterministic regression benchmark.
- Explain the product rationale, architecture, pilot cost, and limitations in a built-in case study.
- Work through a 24-case pilot-style validation queue.
- Capture bilingual reviewer verdicts and calculate observed precision, recall, and latency.
- Download a two-week technical pilot brief and copy a reusable outreach note.

## Tests

```powershell
node tests/engine.test.mjs
node tests/evaluation.test.mjs
node tests/pilot.test.mjs
```

Phase 3 adds semantic comparison using Groq's free-plan `qwen/qwen3.8-27b` model. Failed or rate-limited AI calls fall back safely to deterministic findings.

## Local API configuration

Add your development key to `.env.local`:

```text
GROQ_API_KEY=your_key_here
```

`.env.local` is ignored by Git. Production deployments use the Sites secret environment configuration instead of committing a key.
