# Clearlyy Guardrail

Interactive prototype for a multilingual SOP safety and localization auditor.

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

## Tests

```powershell
node tests/engine.test.mjs
node tests/evaluation.test.mjs
```

Phase 3 adds semantic comparison using Groq's free-plan `qwen/qwen3.8-27b` model. Failed or rate-limited AI calls fall back safely to deterministic findings.

## Local API configuration

Add your development key to `.env.local`:

```text
GROQ_API_KEY=your_key_here
```

`.env.local` is ignored by Git. Production deployments use the Sites secret environment configuration instead of committing a key.
