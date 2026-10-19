# Clearlyy Guardrail

Interactive prototype for a multilingual SOP safety and localization auditor.

## Run locally

Serve the `dist` directory with any static file server. For example:

```powershell
npx serve dist
```

The current prototype performs deterministic analysis entirely in the browser and intentionally makes no network requests or stores data.

## Current behavior

- Paste or edit source and translated SOP text.
- Detect changed numbers, units, percentages, and durations.
- Detect missing safety negations.
- Check protected uppercase technical terms.
- Flag missing or additional procedural steps.
- Try pharma, manufacturing, and delivery examples.
- Copy the suggested correction.
- Mark the finding as resolved or dismissed.

## Tests

```powershell
node tests/engine.test.js
```

Phase 3 can add an LLM semantic comparison layer after these deterministic checks.
