# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm dlx prisma migrate dev   # Run DB migrations
pnpm dlx prisma generate      # Regenerate Prisma client after schema changes
pnpm dlx prisma studio        # Open Prisma Studio GUI
```

No test suite is configured.

## Environment Variables

```
OPEN_ROUTER_API_KEY=   # Required: OpenRouter API key for AI opponents
DATABASE_URL=          # Required: PostgreSQL connection string
```

## Architecture

This is a **Next.js 16 App Router** Texas Hold'em poker training app. All game logic runs client-side; the server only handles AI decisions and persistence.

### Game Logic Layer (`lib/poker/`)

Pure TypeScript functions with no React dependencies:

- **`types.ts`** — All shared types: `GameState`, `Player`, `Card`, `GamePhase`, `GameMode`, `AIPersonality`, `AvailableActions`
- **`game-engine.ts`** — Immutable state machine. Key exports: `createInitialState`, `startHand`, `applyAction`, `getAvailableActions`. Game phases: `idle → preflop → flop → turn → river → showdown`. Every function takes a `GameState` and returns a new `GameState`.
- **`hand-evaluator.ts`** — Evaluates best 5-card hand from hole cards + community cards, returns `{ score, description }`
- **`odds-calculator.ts`** — Monte Carlo win probability simulation (`calculateOdds`) and preflop hand strength (`preflopHandStrength`)
- **`deck.ts`** — Deck creation, shuffling, card-to-string conversion

### State Management (`hooks/use-poker-game.ts`)

Single hook `usePokerGame(mode, sessionId)` orchestrates the entire game:
- Holds `GameState` in React state
- Triggers AI turns via `useEffect` when `gameState.isWaitingForAI === true`
- Calls `POST /api/ai-action` for each AI decision (with 0.8–2.5s artificial delay)
- Falls back to rule-based logic if the API call fails
- Computes win odds after each state update via `calculateOdds` (300 Monte Carlo simulations)
- Provides advisor hints (pot odds + hand strength) for advisor/training modes
- Auto-saves hand records to DB at showdown via `POST /api/stats`

### AI Integration (`lib/openrouter.ts`, `app/api/ai-action/route.ts`)

AI opponents connect to OpenRouter (OpenAI-compatible API) using the Vercel AI SDK's `generateObject`. Each of the 5 AI players is randomly assigned a model from `AI_MODELS_POOL` and a personality (`TAG`, `LAG`, `nit`, `fish`, `maniac`). The route returns a structured `{ action, amount, reasoning }` object validated by Zod.

### API Routes

- **`POST /api/ai-action`** — Accepts game state snapshot, returns AI player action via LLM
- **`POST /api/session`** — Creates/ends a game session (actions: `"start"` or `"end"`)
- **`GET|POST /api/stats`** — Reads/writes hand records and aggregate `PlayerStats` (singleton row)

### Database (Prisma + PostgreSQL)

Three models: `PlayerStats` (singleton aggregate), `Session`, `Hand`. `holeCards`, `communityCards`, and `actions` fields on `Hand` are stored as JSON strings.

### UI Components

- **`components/poker/`** — Game-specific components: `PokerTable`, `PlayerSeat`, `PlayingCard`, `ActionBar`, `ChipStack`, `CommunityCards`, `InfoBar`, `PipWindow`
- **`components/ui/`** — shadcn/ui component library (do not edit these manually; use `pnpm dlx shadcn add <component>`)

### Pages

- **`/`** (`app/page.tsx`) — Mode selector (normal/vision/advisor/training), starts a session, redirects to `/game?mode=...&session=...`
- **`/game`** (`app/game/page.tsx`) — Main game page, reads query params, renders the poker table
- **`/stats`** (`app/stats/page.tsx`) — Session history and aggregate stats dashboard

### Game Modes

| Mode | Behavior |
|------|----------|
| `normal` | Standard play, hole cards of other players hidden |
| `vision` | All hole cards visible (study mode) |
| `advisor` | Real-time hint shown on human's turn |
| `training` | Advisor hint + post-action feedback comparing player's choice to hint |
