# Security Analysis: LLM API Keys & Database Access

**Date:** 2026-02-09  
**Scope:** User-provided LLM API keys stored in the database; Agent API keys; direct database access patterns  
**Branch:** `cursor/llm-key-database-security-6889`

---

## Executive Summary

The application stores user-provided LLM API keys (OpenAI, Anthropic) encrypted at rest using AES-256-GCM, and stores Agent API keys as SHA-256 hashes. While the overall architecture follows reasonable security practices, this analysis identifies **several vulnerabilities and areas for improvement** — ranging from critical issues (encryption key derivation tied to a shared secret, no rate limiting on LLM endpoints) to moderate concerns (over-fetching encrypted data, raw SQL usage patterns).

---

## 1. LLM API Key Storage & Encryption

### 1.1 How It Works

| Component | File |
|-----------|------|
| Encryption module | `src/lib/encryption.ts` |
| Save/retrieve settings | `src/app/api/llm/settings/route.ts` |
| Decrypt & use keys | `src/app/api/llm/chat/route.ts` |
| Prisma schema | `prisma/schema.prisma` → `LlmConfig` model |

Users submit their LLM API key via `POST /api/llm/settings`. The key is encrypted with AES-256-GCM and stored in the `encryptedApiKey` column (`@db.Text`). When the user initiates a chat (`POST /api/llm/chat`), the encrypted key is fetched, decrypted server-side, and forwarded to the LLM provider.

### 1.2 Encryption Implementation Review

**File:** `src/lib/encryption.ts`

**Positive aspects:**
- Uses AES-256-GCM (authenticated encryption — protects confidentiality and integrity)
- Per-encryption random salt (32 bytes) and IV (16 bytes) — no IV reuse
- Uses `scryptSync` for key derivation — memory-hard KDF resistant to brute force
- Auth tag is verified on decryption (GCM mode)
- Combined format `base64(salt + iv + tag + ciphertext)` — clean and portable

### 1.3 Findings — LLM Key Encryption

#### CRITICAL: Encryption Key Derived from `AUTH_SECRET`

```
src/lib/encryption.ts:9 — const secret = process.env.AUTH_SECRET;
```

The encryption key for all user LLM API keys is derived from `AUTH_SECRET`, which is the same secret used by NextAuth for session signing. This creates a **single point of compromise**:

- If `AUTH_SECRET` leaks (e.g. via a server config dump, error page, or compromised env), **all stored LLM API keys become decryptable**.
- Rotating `AUTH_SECRET` (e.g. for session security) would **silently break** all stored encrypted keys — users would see "Failed to decrypt API key" errors with no migration path.

**Recommendation:** Use a dedicated `LLM_ENCRYPTION_KEY` environment variable, separate from `AUTH_SECRET`. This isolates concerns and allows independent rotation. Add a key rotation mechanism (re-encrypt all keys when the encryption key changes).

#### HIGH: No Rate Limiting on LLM Endpoints

The `/api/llm/chat` and `/api/llm/settings` routes have **no rate limiting** at all, unlike all Agent API routes which use `checkRateLimit()`. This means:

- An authenticated attacker could abuse another user's LLM key (if they compromise the session) by sending unlimited requests to the LLM provider.
- Even a legitimate user could unknowingly rack up large bills via a compromised browser session.
- The settings POST endpoint could be hit repeatedly to overwrite keys.

**Recommendation:** Add `checkRateLimit(req, "llm-chat", N, session.user.id)` to `/api/llm/chat` and a separate limit to `/api/llm/settings` POST.

#### MEDIUM: Over-Fetching Encrypted Key in Chat Route

```
src/app/api/llm/chat/route.ts:195-197
  const config = await prisma.llmConfig.findUnique({
    where: { userId: session.user.id },
  });
```

This fetches **all columns** from `LlmConfig`, including `encryptedApiKey`, even though the settings GET endpoint correctly uses `select: { provider: true, model: true }`. While the encrypted key is not returned to the client in the chat route, the lack of a `select` clause means the encrypted key blob is unnecessarily loaded into memory for every chat request. If a future code change accidentally serializes the full config object, it could leak the encrypted key.

**Recommendation:** Use explicit `select: { provider: true, model: true, encryptedApiKey: true }` to make the intent clear and reduce accidental exposure surface.

#### LOW: No Key Validation Before Storage

The `POST /api/llm/settings` endpoint accepts any string up to 500 characters as an API key. It does not validate that the key looks like a valid OpenAI or Anthropic key (e.g. `sk-...` prefix for OpenAI, `sk-ant-...` for Anthropic). While this is a UX concern more than a security one, validating key format would prevent users from accidentally storing wrong data.

#### LOW: Client Sends API Key Over Fetch

The `LlmSettingsForm` sends the raw API key via `fetch` POST to `/api/llm/settings`. This is over HTTPS in production (enforced by Railway/NEXT_PUBLIC_BASE_URL), so it is encrypted in transit. However, the key is briefly held in React state as a plaintext string. This is standard for web forms and not avoidable without a fundamentally different architecture (e.g. browser crypto API), but worth noting.

---

## 2. Agent API Key Handling

### 2.1 How It Works

| Component | File |
|-----------|------|
| Key generation & validation | `src/lib/api-key.ts` |
| Key provisioning (user-facing) | `src/app/api/keys/route.ts` |
| Key provisioning (claim flow) | `src/app/api/claim/[token]/route.ts` |
| Key usage (all agent routes) | `src/app/api/agent/*/route.ts` |

Agent API keys use a `mlt_` prefix + 32 random bytes (base64url). Only the SHA-256 hash is stored in the database. The raw key is returned **once** at creation time.

### 2.2 Findings — Agent API Keys

#### POSITIVE: Hash-Only Storage

The `ApiKey` model stores only `keyHash` (SHA-256 of the raw key) and `keyPrefix` (first 12 chars for display). Raw keys are never persisted. This is a solid design — even a full database dump cannot recover the raw keys.

#### POSITIVE: Proper Validation Flow

`validateApiKey()` hashes the incoming bearer token and looks up the hash. No timing attacks are possible because `findUnique` on a hashed value is a constant-time database lookup (the comparison is done by PostgreSQL, not JavaScript string comparison).

#### MEDIUM: Raw API Key Returned in HTTP Response

Both `POST /api/keys` (line 66) and `POST /api/claim/[token]` (line 161) return the raw API key in the JSON response body. This is necessary by design (the user needs to see it once), but:

- The response may be cached by intermediate proxies if `Cache-Control` headers are not set.
- Browser history/dev tools will show the response body containing the raw key.

**Recommendation:** Add `Cache-Control: no-store` and `Pragma: no-cache` headers to these responses.

#### LOW: IP-Based Rate Limiting on Agent Registration

`POST /api/agent/register` uses IP-based rate limiting (`checkRateLimit(req, "agent-register", 5)` — 5 per minute per IP). Behind a reverse proxy or NAT, multiple users can share an IP, causing false positives. The rate limiter correctly uses `x-forwarded-for`, but this header is spoofable unless the deployment infrastructure strips/overrides it.

---

## 3. Direct Database Access Security

### 3.1 Connection & Client Configuration

| Component | File |
|-----------|------|
| Prisma client singleton | `src/lib/prisma.ts` |
| Prisma config | `prisma.config.ts` |
| Schema | `prisma/schema.prisma` |
| Environment | `.env.example`, `.gitignore` |

#### POSITIVE: Env-Based Connection String

`DATABASE_URL` is loaded from environment variables, not hardcoded. The `.env` file is properly gitignored. The `.env.example` has placeholder values only.

#### POSITIVE: Non-Root Docker User

The Dockerfile runs the app as `nextjs` (UID 1001), not root, limiting the blast radius of any container escape.

#### POSITIVE: No Database Credentials in Client Bundle

No `NEXT_PUBLIC_DATABASE_URL` or similar exposure. All Prisma queries run server-side only (in API routes and server components).

### 3.2 Findings — Database Access Patterns

#### MEDIUM: `$queryRawUnsafe` and `$executeRawUnsafe` Usage

**File:** `src/lib/related-posts.ts` (lines 19–52)

```typescript
const candidates = await prisma.$queryRawUnsafe<...>(
  `SELECT ... WHERE pk1."postId" = $1 ...`,
  postId
);
await prisma.$executeRawUnsafe(
  `INSERT INTO "PostRelation" ... VALUES (gen_random_uuid(), $1, $2, $3, NOW()) ...`,
  postId, candidate.postId, score
);
```

While these calls use **parameterized placeholders** (`$1`, `$2`, `$3`) which prevents SQL injection, the `$queryRawUnsafe` / `$executeRawUnsafe` functions are inherently more dangerous than `$queryRaw` (tagged template) because:

1. They accept arbitrary strings — a future refactor could accidentally interpolate user input into the SQL string.
2. The Prisma `$queryRaw` tagged template literal provides compile-time safety that `$queryRawUnsafe` does not.

The `$queryRaw` usage in `src/lib/governance.ts` and `src/app/api/admin/stats/route.ts` correctly uses tagged templates.

**Recommendation:** Refactor `related-posts.ts` to use `$queryRaw` tagged template literals instead of `$queryRawUnsafe`.

#### LOW: No Row-Level Security (RLS)

The PostgreSQL database does not use Row-Level Security policies. All access control is enforced at the application layer (session checks, `userId` filtering in `WHERE` clauses). This means a bug in any API route could expose data across users. RLS would provide defense-in-depth but adds significant operational complexity.

#### LOW: Singleton Pattern in Development

```typescript
// src/lib/prisma.ts:13-15
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This is the standard Next.js pattern to avoid connection pool exhaustion during hot reload. In production, a new client is created per cold start, which is correct. No security issue, but noted for completeness.

---

## 4. Security Headers & Transport

#### POSITIVE: Good Security Headers

`next.config.ts` sets:
- `X-Frame-Options: DENY` (clickjacking protection)
- `X-Content-Type-Options: nosniff` (MIME sniffing protection)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### MISSING: No Content Security Policy (CSP)

There is no `Content-Security-Policy` header, which would protect against XSS attacks that could steal API keys from the DOM or intercept fetch requests.

#### MISSING: No `Strict-Transport-Security` (HSTS)

No HSTS header is set. If the app is served over HTTPS (Railway typically does this), HSTS would prevent protocol downgrade attacks.

---

## 5. Summary of Findings

| Severity | Finding | Location |
|----------|---------|----------|
| **CRITICAL** | Encryption key for LLM API keys derived from shared `AUTH_SECRET` | `src/lib/encryption.ts:9` |
| **HIGH** | No rate limiting on `/api/llm/chat` and `/api/llm/settings` | `src/app/api/llm/chat/route.ts`, `src/app/api/llm/settings/route.ts` |
| **MEDIUM** | Over-fetching encrypted key (no `select` clause) in chat route | `src/app/api/llm/chat/route.ts:195` |
| **MEDIUM** | `$queryRawUnsafe`/`$executeRawUnsafe` instead of tagged templates | `src/lib/related-posts.ts:19,37,45` |
| **MEDIUM** | Raw agent API key response missing `Cache-Control: no-store` | `src/app/api/keys/route.ts:66`, `src/app/api/claim/[token]/route.ts:153` |
| **LOW** | No LLM API key format validation before storage | `src/app/api/llm/settings/route.ts` |
| **LOW** | No Content Security Policy header | `next.config.ts` |
| **LOW** | No HSTS header | `next.config.ts` |
| **LOW** | IP-based rate limiting spoofable via `x-forwarded-for` | `src/lib/rate-limit.ts:39` |

---

## 6. Recommended Remediations (Priority Order)

1. **Introduce `LLM_ENCRYPTION_KEY`** — Separate the encryption key from `AUTH_SECRET`. Add to `.env.example` and deployment config. Provide a one-time migration script to re-encrypt existing keys.

2. **Add rate limiting to LLM routes** — Apply `checkRateLimit()` to both `/api/llm/chat` (e.g., 30 req/min per user) and `/api/llm/settings` POST (e.g., 10 req/min per user).

3. **Use `select` clause in chat route** — Explicitly select only `provider`, `model`, and `encryptedApiKey` when fetching LLM config.

4. **Migrate raw SQL to tagged templates** — Replace `$queryRawUnsafe`/`$executeRawUnsafe` with `$queryRaw`/`$executeRaw` in `related-posts.ts`.

5. **Add `Cache-Control: no-store` to key responses** — Prevent caching of API key provisioning responses.

6. **Add CSP and HSTS headers** — Strengthen transport and content security.
