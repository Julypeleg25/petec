# Petec

Petec is a management system for a veterinary hospital, designed to handle animal patients and their medical records efficiently.

## AI-assisted case suggestions

The case table includes a reusable, inline suggestion framework for approved clinical list items. The framework is intentionally read-only during generation: selecting `+` only fills the existing unsaved table form, and staff must use the normal save action afterward.

### Safety architecture

Suggestions are produced in three separate layers:

1. Existing active lists are the canonical candidate source for every selector-backed category in the case table.
2. A category handler applies deterministic missing-data, duplicate, calculation, and permission rules.
3. Aggregate usage from similar completed cases creates the eligible historical candidate pool.
4. Groq ranks only those prevalidated candidates from limited current-case features and aggregate counts. No AI-generated reasoning or explanation is returned to the user.

Active, non-deleted medicines, fluids, procedure types, examination types, and food-extra types are directly eligible. Medicines and fluids must also contain sufficient existing route, frequency, and calculation data. Deleting or disabling the underlying application item always removes it from suggestions.

### Enabled categories

The category registry is in `backend/src/services/caseSuggestion/caseSuggestion.registry.ts`.

- `medication` uses the existing medicine list and a medication-specific handler.
- `fluid` uses the existing fluid and fluid-extra medicine categories and a fluid-specific handler.
- `procedure` uses procedure types.
- `diagnostic_test` uses examination types.
- `nutrition` uses food-extra types.

`treatment`, `laboratory_test`, `imaging`, `monitoring`, `precaution`, and `other` are explicitly disabled because the current case table has no matching selector for them. Enable one only after adding a real existing data source, explicit result schema, handler, permissions, and form adapter.

### Existing data

For medications and fluids, the engine reuses the existing `medicines` and `medicine_categories` data, including route, frequency, unit, fixed amount, and per-weight range. The stored midpoint calculation follows the existing medicine picker behavior. Items without enough existing data to calculate a value safely are omitted. Historical matching selects supported candidates, and Groq ranks that fixed allowlist. Clicking `+` adds the item only to the open modal draft; normal modal approval and patient save are still required.

Do not add fictional medicines, doses, fluids, or procedures to production source lists. Test fixtures must remain fictional and deidentified. Changes to active source lists invalidate previously generated references.

Medication and fluid amounts are calculated only by backend handlers from existing stored values. If required allergy, weight, route, frequency, or calculation data is unavailable, the candidate is blocked instead of guessed.

### Groq ranking

Groq receives candidate IDs, names, categories, aggregate similar-case counts, and limited current-case clinical features. Patient IDs, case IDs, private comments, allergy details, doses, routes, frequencies, and writable form values are not sent. Structured output constrains the response to the supplied candidate IDs, and the backend rejects duplicated, unknown, incomplete, or malformed rankings.

Groq is a ranking layer only. It cannot introduce a medicine or other list item, change calculations, bypass validation, or write to the patient record. Provider errors, timeouts, invalid output, and rate limits fall back to deterministic historical ordering.

Production configuration:

```env
AI_CASE_SUGGESTIONS_ENABLED=true
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_TIMEOUT_MS=8000
```

The server refuses to start with suggestions enabled and no Groq API key. Keep the key only in backend environment variables and never expose it through the frontend.

### API

```http
POST /api/patients/:patientId/case-suggestions/:category
Cache-Control: no-store
```

The request body is empty. It does not accept prompts, patient records, weights, candidates, or calculation rules. The endpoint authenticates and authorizes the current user, loads the latest stored patient case and active existing selector items, limits output to five suggestions, and performs no patient-record write.

Rate limiting starts at ten requests per user per hour, with one active request per user and one active request per patient/category. Manual table entry remains available when suggestions or Groq are unavailable.

### Normal save revalidation

An inserted suggestion carries a separate reference containing the suggestion, patient-data, and candidate-data versions. The existing patient save endpoint reloads the user, patient context, candidate item, handler, and calculations. It rejects changed or unsafe suggestions with HTTP `409` and code `CASE_SUGGESTION_STALE`. Suggestion metadata never bypasses existing write permissions or approval workflows.

### Adding a category

1. Add or identify a real list-backed case-table selector and existing source collection.
2. Add its explicit authoritative-values Zod schema in `packages/shared/src/dtos/caseSuggestion.dto.ts`.
3. Enable and configure it in the category registry, including its source list, roles, and required patient fields.
4. Implement its category handler and deterministic validator/calculator.
5. Register the handler and historical item path.
6. Add a frontend category adapter, labels, icon, and authoritative field rendering.
7. Add safety, ranking, stale-save, permission, and form-population tests.
8. Have the clinic review the source data and behavior before enabling it in production.

### Testing

```bash
npm run typecheck
npm run -w backend test -- --runInBand
npm run -w frontend test
npm run build
```

The frontend tests verify the shared component, five-result limit, form-only insertion, invalidation, safe failure, and patient changes. Backend tests cover category safety rules, deterministic calculations, duplicate blocking, Groq allowlisting and fallback, bounded historical ranking, maximum results, and stale-save revalidation.
