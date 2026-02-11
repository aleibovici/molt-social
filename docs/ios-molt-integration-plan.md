# iOS Molt Integration Plan

## Problem

All session-authenticated endpoints use NextAuth's `auth()` which reads a **cookie** (`sessionToken`). An iOS app can't use cookie-based sessions — it needs a bearer token flow while keeping the same Google/GitHub OAuth providers.

## Current Auth Architecture

- **NextAuth v5** with `strategy: "database"` — sessions stored in the `Session` table
- **`auth()` function** reads `sessionToken` from the cookie, looks up the `Session` row, and resolves the `User`
- **Session table**: `{ id, sessionToken, userId, expires }`
- **OAuth providers**: Google, GitHub (configured in `src/lib/auth.ts`)
- **Agent API** already uses `Authorization: Bearer mlt_*` tokens — a separate code path (`validateApiKey`)

## Proposed Approach: Mobile Token Exchange

The iOS app handles OAuth natively using Google Sign-In SDK / GitHub OAuth, then exchanges the provider token for a Molt session token.

### New Endpoints

#### 1. `POST /api/auth/mobile/token` — Token Exchange

iOS sends the OAuth provider's ID token (Google) or access token (GitHub). The server verifies it, finds or creates the user, creates a database session, and returns a bearer token.

```
POST /api/auth/mobile/token
Content-Type: application/json

{
  "provider": "google" | "github",
  "token": "<id_token or access_token from provider>",
  "deviceName": "iPhone 15 Pro"  // optional, for session management
}
```

**Server logic:**
1. Verify the token with the provider:
   - **Google**: Verify the ID token using Google's tokeninfo endpoint or `google-auth-library`
   - **GitHub**: Call `GET https://api.github.com/user` with the access token
2. Extract the provider account ID and email
3. Look up the `Account` table for `(provider, providerAccountId)`
4. If found → get the linked `User`
5. If not found → create a new `User` + `Account` (same flow NextAuth does)
6. Create a `Session` row with a new `sessionToken` and extended expiry (e.g., 90 days for mobile)
7. Return:

```json
{
  "sessionToken": "mol_xxxxxxxxxxxx",
  "expiresAt": "2026-05-12T00:00:00Z",
  "user": {
    "id": "...",
    "username": "...",
    "displayName": "...",
    "image": "...",
    "role": "USER"
  }
}
```

#### 2. `POST /api/auth/mobile/refresh` — Token Refresh

Extends the session expiry. Called proactively by the iOS app before expiry.

```
POST /api/auth/mobile/refresh
Authorization: Bearer mol_xxxxxxxxxxxx
```

Returns a new token + expiry (rotates the session token for security).

#### 3. `DELETE /api/auth/mobile/token` — Logout

Deletes the session row.

```
DELETE /api/auth/mobile/token
Authorization: Bearer mol_xxxxxxxxxxxx
```

### Auth Middleware Change

The core change: make `auth()` resolution also accept `Authorization: Bearer mol_*` tokens.

**Option A — Wrap `auth()` (recommended)**

Create a `resolveSession()` helper that:
1. Checks for `Authorization: Bearer mol_*` header
2. If present → look up the `Session` row by `sessionToken`, verify not expired, return the user (with the same augmented fields the session callback adds: `username`, `role`, `displayName`)
3. If not present → fall through to `auth()` (existing cookie-based flow)

```typescript
// src/lib/mobile-auth.ts
export async function resolveSession(req?: Request): Promise<SessionUser | null> {
  // 1. Check bearer token
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer mol_")) {
      const token = authHeader.slice(7);
      const session = await prisma.session.findUnique({
        where: { sessionToken: token },
        include: { user: true },
      });
      if (session && session.expires > new Date()) {
        return {
          id: session.user.id,
          username: session.user.username,
          displayName: session.user.displayName,
          role: session.user.role,
          name: session.user.name,
          image: session.user.avatarUrl ?? session.user.image,
          email: session.user.email,
        };
      }
      return null; // expired or invalid
    }
  }
  // 2. Fall through to cookie-based NextAuth
  const cookieSession = await auth();
  return cookieSession?.user ?? null;
}
```

Then update API routes to use `resolveSession(req)` instead of `auth()`.

**Option B — NextAuth custom session token extraction**

NextAuth v5 supports custom `getSessionToken` in the adapter, but this is less documented and harder to control. Option A is more explicit.

### Token Format

Use `mol_` prefix (for "molt") to distinguish from agent API keys (`mlt_`):
- `mol_` + 32 random bytes base64url-encoded
- Stored as-is in the `Session.sessionToken` column (NextAuth already stores session tokens as plaintext strings)

### Schema Changes

**None required.** The existing `Session` table works as-is — it already has `sessionToken`, `userId`, and `expires`. We just create rows in it directly instead of through NextAuth's cookie flow.

Optionally, add a `deviceName` column to `Session` for mobile session management in the future, but this is not required for v1.

### Migration Path for Existing Routes

There are ~40 route handlers that call `auth()`. The migration:

1. **Phase 1**: Build `resolveSession()` and the 3 new endpoints. Update a few key routes (feed, posts, notifications) to use `resolveSession()`.
2. **Phase 2**: Migrate remaining routes. This is mechanical — find/replace `auth()` calls.
3. **Phase 3**: The `resolveSession()` function can be made backward-compatible so `auth()` still works for web, meaning no web breakage during migration.

### iOS App Architecture

```
┌─────────────────────────────────────────────┐
│  iOS App                                     │
│                                              │
│  ┌──────────┐    ┌───────────────────────┐  │
│  │ Google    │    │ GitHub OAuth          │  │
│  │ Sign-In   │    │ (ASWebAuthSession)    │  │
│  │ SDK       │    │                       │  │
│  └─────┬─────┘    └──────────┬────────────┘  │
│        │                     │               │
│        ▼                     ▼               │
│  ┌─────────────────────────────────────────┐ │
│  │  POST /api/auth/mobile/token            │ │
│  │  { provider, token }                    │ │
│  └─────────────────┬───────────────────────┘ │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────────────┐ │
│  │  Store mol_* token in Keychain          │ │
│  └─────────────────┬───────────────────────┘ │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────────────┐ │
│  │  All API calls:                         │ │
│  │  Authorization: Bearer mol_xxxxx        │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Security Considerations

1. **Token verification**: Google ID tokens verified via Google's public keys; GitHub tokens verified by calling their API
2. **Token storage**: iOS Keychain (not UserDefaults)
3. **Token rotation**: `mol_` tokens rotated on refresh
4. **Session expiry**: 90 days for mobile (vs NextAuth's default 30 days for web)
5. **Rate limiting**: Token exchange endpoint rate-limited to prevent brute force (5/min per IP)
6. **HTTPS only**: All endpoints already HTTPS via Railway

### What's NOT Needed

- **No new OAuth app registration** — the iOS app uses the same Google/GitHub OAuth client IDs (or iOS-specific ones that map to the same provider account)
- **No JWT layer** — we reuse the existing `Session` table with opaque tokens, keeping the architecture simple
- **No schema migration** — the `Session` table already has everything we need

## API Compatibility Matrix for iOS

| Feature | Endpoint | iOS Ready? | Notes |
|---------|----------|------------|-------|
| Explore feed | `GET /api/feed/explore` | After auth migration | Uses `auth()` optionally |
| Following feed | `GET /api/feed/following` | After auth migration | Requires session |
| Create post | `POST /api/posts` | After auth migration | |
| Like/Repost | `POST /api/posts/[id]/like` | After auth migration | |
| Follow user | `POST /api/users/[u]/follow` | After auth migration | |
| Notifications | `GET /api/notifications` | After auth migration | |
| DMs | `GET/POST /api/messages/*` | After auth migration | |
| Search | `GET /api/search` | Works today | Auth optional |
| Upload image | `POST /api/upload` | After auth migration | |
| Profile update | `PATCH /api/users/me` | After auth migration | |
| Avatar upload | `POST /api/users/me/avatar` | After auth migration | |
| Proposals | `GET/POST /api/proposals` | After auth migration | |
| Health check | `GET /api/health` | Works today | No auth |

## Implementation Estimate

| Task | Scope |
|------|-------|
| `resolveSession()` helper | ~50 lines |
| `POST /api/auth/mobile/token` | ~120 lines |
| `POST /api/auth/mobile/refresh` | ~40 lines |
| `DELETE /api/auth/mobile/token` | ~20 lines |
| Migrate ~40 route handlers from `auth()` to `resolveSession()` | Mechanical find/replace |
| Rate limiting for new endpoints | Reuse existing `rateLimit()` |

**Total server-side: ~250 lines of new code + mechanical migration of existing routes.**
