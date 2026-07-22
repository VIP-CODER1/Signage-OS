# API conventions reference

Loaded by `feature-implementation` when touching HTTP handlers, API endpoints, or external integrations.

<!-- TODO: Customize to match your project's actual API style. -->

## URL conventions
- Nouns, not verbs: `/users/:id`, not `/getUser`.
- Plural for collections: `/orders`, `/orders/:id/items`.
- Lowercase, hyphen-separated: `/user-settings`, not `/userSettings`.
- Versioning at the root: `/v1/`, `/v2/`. Don't sprinkle it.

## Methods
- `GET` — safe, idempotent, no side effects. Never mutates.
- `POST` — create, or an action that doesn't fit REST. Not idempotent.
- `PUT` — replace an entire resource. Idempotent.
- `PATCH` — partial update. Document whether it's JSON Merge Patch or JSON Patch.
- `DELETE` — remove. Idempotent (deleting a deleted thing returns 404 or 204, consistently).

## Status codes — the ones that matter
- `200 OK` — success with body
- `201 Created` — POST that created something. Include `Location` header.
- `204 No Content` — success, nothing to return
- `400 Bad Request` — client sent something malformed
- `401 Unauthorized` — not authenticated (confusingly named)
- `403 Forbidden` — authenticated but not allowed
- `404 Not Found` — resource doesn't exist (or you're hiding that it does)
- `409 Conflict` — request conflicts with current state (duplicate create, stale update)
- `422 Unprocessable Entity` — syntactically valid but semantically wrong
- `429 Too Many Requests` — rate limited. Include `Retry-After`.
- `500 Internal Server Error` — your fault. Log it.
- `503 Service Unavailable` — degraded. Include `Retry-After`.

## Error response shape
Consistent shape across all errors:
```json
{
  "error": {
    "code": "user.email_exists",
    "message": "A user with that email already exists.",
    "details": { "email": "foo@bar.com" }
  }
}
```

- `code` — machine-readable, dot-namespaced, stable.
- `message` — human-readable, safe to show in UI.
- `details` — optional structured context.

Never leak stack traces, SQL, or internal identifiers in error responses.

## Pagination
Cursor-based for anything that can grow:
```json
{ "data": [...], "next_cursor": "opaque-token-or-null" }
```

Offset-based is fine for small, bounded sets.

## Idempotency
For any non-idempotent endpoint (`POST /payments`, `POST /emails`), accept an `Idempotency-Key` header. Store the result for 24h; replay returns the stored response.

## Rate limits
Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. 429 with `Retry-After` when exceeded.

## Auth
- Never accept credentials in URL query strings (they end up in logs).
- Bearer tokens in `Authorization` header.
- Document the token format and expiry.
