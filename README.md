# Petec

Petec is a management system for a veterinary hospital, designed to handle animal patients and their medical records efficiently.

## AI veterinary clinical summary

The patient record includes an optional, read-only Hebrew clinical summary. The frontend sends only the patient ID to the authenticated `POST /api/v1/patient/:patientId/clinical-summary` endpoint. The backend reads the latest non-deleted case with an explicit field projection, builds and size-limits an allowlisted clinical object, and sends it to GroqCloud using strict JSON-schema output. The result is validated again before it reaches the browser.

The feature does not save summaries or call patient update, archive, delete, upload, or document-save paths. Results remain only in React memory and are cleared when the patient changes. Responses use `Cache-Control: no-store`; prompts and summaries must not be logged or sent to analytics.

### Backend environment

Set these variables on the protected backend service only:

```env
GROQ_API_KEY=your-groq-key
GROQ_MODEL=openai/gpt-oss-120b
AI_SUMMARY_ENABLED=true
```

Do not expose `GROQ_API_KEY` to the frontend. Set `AI_SUMMARY_ENABLED=false` to disable inference safely. Provider failures, timeouts, invalid output, disabled configuration, and rate limits return a generic unavailable error confirming that the patient record was not changed.

### Privacy and safety

Only allowlisted clinical fields are sent to the provider. Owner and staff identity, contact information, MongoDB IDs, photos, documents, URLs, authentication data, audit records, and billing data are excluded. Recursive sanitization is applied as a secondary defense.

Before using real patient records, enable Zero Data Retention in GroqCloud, disable provider features that require persistence, and complete the veterinary review checklist in `backend/tests/fixtures/clinical-summary-review-checklist.md`.

The model has no tools, web access, database access, persistent conversation, or application actions. Clinical notes are treated as untrusted data. Output is rendered as React text, not raw HTML or Markdown, and is informational only.

Dates displayed in the generated clinical summary use the `dd/mm/yyyy` format.

### Verification

```powershell
npm run typecheck
npm run -w backend test -- --runInBand
npm run -w frontend test:ci
```
