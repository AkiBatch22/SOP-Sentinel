# Clearlyy Guardrail

Phase 1 interactive prototype for a multilingual SOP safety and localization auditor.

## Run locally

Serve the `dist` directory with any static file server. For example:

```powershell
npx serve dist
```

The current prototype uses a hard-coded pharma example and intentionally performs no network requests or data storage.

## Phase 1 behavior

- Paste or edit source and translated SOP text.
- Run a simulated twelve-check audit.
- Review a critical duration mismatch.
- Copy the suggested correction.
- Mark the finding as resolved or dismissed.

Phase 2 will replace the simulated audit with deterministic number, unit, negation, and terminology checks.
