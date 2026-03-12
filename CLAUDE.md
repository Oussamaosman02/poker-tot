# CLAUDE.md — Web App

This file provides guidance to Claude Code (claude.ai/code) when working in `/web`.

## Commands

```bash
pnpm dev                          # Start dev server on localhost:3000
pnpm build                        # Production build
pnpm lint                         # ESLint

# Prisma — always use pnpm exec (Prisma 6), never pnpm dlx (pulls Prisma 7)
pnpm exec prisma migrate dev      # Create and apply a new migration
pnpm exec prisma db push          # Push schema changes directly (no migration file)
pnpm exec prisma generate         # Regenerate Prisma client after schema changes
pnpm exec prisma studio           # Open Prisma Studio GUI on localhost:5555

tsx prisma/seed.ts                # Run seed: creates first user, migrates orphaned data
```

No test suite is configured.

## Environment Variables

```
OPEN_ROUTER_API_KEY=   # Required: OpenRouter API key for AI opponents
DATABASE_URL=          # Required: PostgreSQL connection string (Neon)
AUTH_SECRET=           # Required: secret for Auth.js JWT + mobile Bearer tokens
```

All three must also be set in Netlify site environment variables.

## Architecture

Next.js 16 App Router poker training app. All game logic runs client-side; the server handles AI decisions, auth, and persistence.

---

## Authentication

### How it works
- **Auth.js v5** (`next-auth`) with Credentials provider and JWT session strategy
- **Web sessions**: cookie-based JWT, managed by Auth.js
- **Mobile tokens**: `POST /api/auth/token` returns a 30-day signed JWT; stored in AsyncStorage; sent as `Authorization: Bearer <token>`
- Both paths share the same `AUTH_SECRET` for signing

### File split — CRITICAL for Netlify Edge
```
auth.config.ts   ← No Prisma/bcrypt. JWT callbacks + pages only. Used by proxy.ts.
auth.ts          ← Full config with Prisma user lookup. Used by API routes only.
proxy.ts         ← Imports auth.config.ts (NOT auth.ts). Safe for Netlify Edge.
```

**Never import `auth.ts`, `prisma`, or `bcrypt` from `proxy.ts`**. Netlify Edge Functions can't run native C++ addons (Prisma's `libquery_engine.so`). If you add middleware logic, always import from `auth.config.ts`.

### Auth utility
`lib/auth-utils.ts` exports `getUserId(req)` — checks Bearer token first, then falls back to Auth.js session cookie. Use this in every protected API route.

```typescript
const userId = await getUserId(req);
if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

---

## API Routes

| Route | Auth | Description |
|---|---|---|
| `POST /api/auth/[...nextauth]` | No | Auth.js handler (sign in, sign out, session) |
| `POST /api/auth/token` | No | Mobile JWT endpoint — `{ login, password }` → `{ token, userId, username, email }` |
| `POST /api/register` | No | Open registration — `{ email, username, password }` |
| `GET /api/session` | Yes | List user's active (non-ended) sessions |
| `POST /api/session` | Yes | `action: start/save/end` — scoped to userId |
| `GET /api/stats` | Yes | User's PlayerStats + last 10 sessions with hands |
| `POST /api/stats` | Yes | Save a completed hand + upsert aggregate stats |
| `GET /api/quiz` | Yes | User's quiz stats |
| `POST /api/quiz` | Yes | Save quiz result |
| `POST /api/ai-action` | No | LLM decision for AI opponent (public — no user data) |
| `POST /api/hand-review` | No | AI coaching feedback (public — no user data) |

---

## Database

Prisma 6 + PostgreSQL (Neon). Schema at `prisma/schema.prisma`.

### Models

**`User`**
- `id`, `email` (unique), `username` (unique), `passwordHash`, `createdAt`, `updatedAt`

**`PlayerStats`**
- Per-user aggregate; `userId String? @unique`
- Upsert always with `where: { userId }` — the old `where: { id: "singleton" }` pattern is gone
- Fields: `totalHands`, `handsWon/Lost/Folded`, `totalProfit`, `biggestPot/Win`, `vpipHands`, `pfrHands`, `advisorFollowed/Shown`, `sessionsPlayed`, `correctDecisions`, `totalDecisions`, `totalPlaytimeSeconds`, `quizAnswered/Correct/PlaytimeSeconds`

**`Session`**
- `userId String?` (nullable for legacy pre-auth sessions)
- All queries filter `where: { userId }`
- `savedState` stores full `GameState` JSON

**`Hand`**
- Belongs to `Session` via `sessionId`
- `holeCards`, `communityCards`, `actions` stored as JSON strings (use `JSON.stringify/parse`)

**`AIUsageRecord`**
- `userId String?` (nullable — set if user is authenticated, null if public API call)
- `model String` — exact OpenRouter model name (e.g. `google/gemini-2.0-flash-001`)
- `operationType String` — `"AI_ACTION"` or `"HAND_REVIEW"`
- `promptTokens`, `completionTokens`, `totalTokens Int`
- `cost Float?` — USD from OpenRouter metadata

---

## AI Usage Tracking

`lib/ai-usage-tracking.ts` provides two functions:

```typescript
// Normalize token data from AI SDK response
extractUsage(usage: RawUsage, providerMetadata?: unknown): UsageData

// Fire-and-forget DB write — never await this
trackAIUsage(usage: UsageData, ctx: { userId?, model, operationType }): void
```

**Always call without `await`** — it must never delay an AI response. Errors go to `console.error` only.

Cost is extracted from `providerMetadata.openrouter.usage.cost` (OpenRouter includes it automatically).

Usage in `generateObject`:
```typescript
const { object, usage, providerMetadata } = await generateObject({ ... });
trackAIUsage(extractUsage(usage, providerMetadata), { userId, model, operationType: "AI_ACTION" });
```

Usage in `generateText`:
```typescript
const { text, usage, providerMetadata } = await generateText({ ... });
trackAIUsage(extractUsage(usage, providerMetadata), { userId, model, operationType: "HAND_REVIEW" });
```

---

## Pages

| Path | File | Auth | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Public | Landing: hero, features grid, AI opponents, game modes, APK download, CTA |
| `/login` | `app/login/page.tsx` | Public (redirect to /home if logged in) | Login form |
| `/register` | `app/register/page.tsx` | Public (redirect to /home if logged in) | Registration form; auto-signs in on success |
| `/home` | `app/home/page.tsx` | Protected | Mode selector, resume sessions, quiz entry, sign-out |
| `/game` | `app/game/page.tsx` | Protected | Main poker table |
| `/stats` | `app/stats/page.tsx` | Protected | Profit chart, stat cards, recent hands table |
| `/quiz` | `app/quiz/page.tsx` | Protected | Pre-flop GTO quiz |

---

## Game Logic Layer (`lib/poker/`)

Pure TypeScript — no React. Ported 1:1 to `mobile/src/lib/`. **Update both when changing rules.**

- **`types.ts`** — `GameState`, `Player`, `Card`, `GamePhase`, `GameMode`, `AIPersonality`, `AvailableActions`
- **`game-engine.ts`** — Immutable state machine: `createInitialState` → `startHand` → `applyAction` / `getAvailableActions`
- **`hand-evaluator.ts`** — Best 5-card hand evaluation
- **`odds-calculator.ts`** — Monte Carlo win probability + preflop hand strength
- **`deck.ts`** — Deck creation, shuffling, card-to-string
- **`tournament.ts`** — 10 blind levels (50/100 → 2500/5000), 6 hands/level, 10k starting stack
- **`preflop-quiz.ts`** — GTO-based preflop scenarios

---

## State Management (`hooks/use-poker-game.ts`)

`usePokerGame(mode, sessionId, enableAdvisor, resumeState)` orchestrates the entire game:
- Triggers AI turns when `gameState.isWaitingForAI === true`
- Artificial 0.8–2.5s delay per AI action
- Win odds computed after each state change via Monte Carlo
- Builds `HandSummaryData` at showdown → auto-saves to `POST /api/stats`

---

## UI Components

- **`components/poker/`** — `PokerTable`, `PlayerSeat`, `PlayingCard`, `ActionBar`, `ChipStack`, `CommunityCards`, `InfoBar`, `HandReviewModal`, `PipWindow`, `MobileGameView`
- **`components/ui/`** — shadcn/ui; do not edit manually — use `pnpm dlx shadcn add <component>`

---

## Android APK

The APK is committed at `public/PokerTraining.apk` and served at `/PokerTraining.apk` (linked from the landing page and `/home`). Rebuild with `bash build-apk.sh` in `mobile/` then copy the output to `public/`.

---

## Design Tokens

```
Background:  #020810    Table green: #0d3320
Gold:        #c9a84c    Card back:   #1a3a6b
FOLD:        #b91c1c    CALL:        #1d4ed8    RAISE: #15803d
```

Number formatting: `toLocaleString('de-DE')` → `$10.000` (dots as thousands separator).
