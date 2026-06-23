# Interval Guard

[![Build](https://github.com/leonoronhas/interval_project/actions/workflows/build.yml/badge.svg)](https://github.com/leonoronhas/interval_project/actions/workflows/build.yml)
[![Lint](https://github.com/leonoronhas/interval_project/actions/workflows/lint.yml/badge.svg)](https://github.com/leonoronhas/interval_project/actions/workflows/lint.yml)
[![Tests](https://github.com/leonoronhas/interval_project/actions/workflows/test.yml/badge.svg)](https://github.com/leonoronhas/interval_project/actions/workflows/test.yml)
[![Prettier](https://github.com/leonoronhas/interval_project/actions/workflows/prettier.yml/badge.svg)](https://github.com/leonoronhas/interval_project/actions/workflows/prettier.yml)

An AI-powered collections outreach tool that generates factually verified customer messages — and deliberately demonstrates what happens when those guardrails are removed.

---

## What it does

Interval Guard lets a collections agent select a customer with an overdue account and generate an outreach message (email, SMS, or call script) using an AI provider of their choice.

The core feature is a **guarded vs. unguarded** generation mode:

| Mode          | How it works                                                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guarded**   | The AI is given the exact verified customer record and instructed to use only those values. A second AI pass then audits the output for factual violations (wrong name, wrong amount, wrong date, etc.). |
| **Unguarded** | The AI receives minimal context and is free to fill in details — deliberately producing hallucinations so violations can be observed.                                                                    |

Every generation — its mode, provider, output, verification result, and any violations — is logged to the database for auditing.

---

## Tech stack

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router)                                             |
| Language     | TypeScript                                                          |
| Database     | PostgreSQL via [Supabase](https://supabase.com)                     |
| ORM          | Drizzle ORM                                                         |
| Auth         | Supabase Auth                                                       |
| AI providers | Anthropic Claude, OpenAI GPT, Google Gemini (swappable via env var) |
| Styling      | Tailwind CSS v4                                                     |
| Testing      | Vitest + Testing Library                                            |

---

## Project structure

```
app/
  api/generate-message/    # POST endpoint — generates and verifies a message
  dashboard/               # Protected dashboard (customer table + activity feed)
  customers/[id]/          # Protected customer detail + generation panel
  login/                   # Auth page
components/
  GeneratePanel.tsx         # Slide-in panel for selecting type and mode
  OutreachLogDetail.tsx     # Shared modal for viewing a logged generation
  ViolationHighlighter.tsx  # Highlights detected factual violations in the output
  ActivityFeed.tsx          # Recent outreach log sidebar
lib/
  ai/
    groundingEngine.ts     # Core guarded/unguarded generation + verification logic
    provider.ts            # Adapter selector + provider fallback chain
    providers/             # Thin wrappers for Anthropic, OpenAI, Gemini
  auth/dal.ts              # Data Access Layer — enforces auth close to the data
  db/
    schema.ts              # Drizzle schema — customers + outreach_log tables
    queries.ts             # Typed query helpers
  format.ts                # Money formatting
  supabase/                # Server/client/middleware Supabase instances
supabase/schema.sql        # Canonical SQL schema — tables, RLS policies, seed data
__tests__/                 # Unit tests mirroring the source structure
```

---

## Getting started

### Prerequisites

- Node.js 22+
- A [Supabase](https://supabase.com) project (free tier works)
- An API key for at least one AI provider (Anthropic, OpenAI, or Gemini)

### 1. Clone and install

```bash
git clone https://github.com/leonoronhas/interval_project.git
cd interval_project
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# AI provider — pick one: "anthropic" | "openai" | "gemini" (default: gemini)
# Only the key for the selected provider is required.
AI_PROVIDER=gemini
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 3. Set up the database

Apply [`supabase/schema.sql`](supabase/schema.sql) to your Supabase project — paste it into the Supabase SQL Editor, or run it with `psql`:

```bash
psql "$DATABASE_URL" -f supabase/schema.sql
```

This creates the `customers` and `outreach_log` tables, enables Row-Level Security with the documented policies, and seeds a set of demo customers so the dashboard has data on first load.

**Schema source of truth:** `supabase/schema.sql` is canonical — it also carries the RLS policies and seed data. `lib/db/schema.ts` is the Drizzle mirror that backs the app's typed query layer; keep the two in sync if you change either.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the login page. Sign up via Supabase Auth, then land on the dashboard.

---

## Available scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start the Next.js development server |
| `npm run build`         | Production build                     |
| `npm run start`         | Start the production server          |
| `npm run test`          | Run tests in watch mode              |
| `npm run test:coverage` | Run tests once with coverage report  |
| `npm run migrate`       | Apply pending database migrations    |
| `npm run lint`          | Run ESLint                           |
| `npm run format`        | Auto-format all files with Prettier  |

---

## Running tests

```bash
# Run in watch mode during development
npm run test

# Run all tests once with coverage report (CI mode)
npm run test:coverage
```

Tests live in `__tests__/` and mirror the `app/`, `components/`, `hooks/`, and `lib/` directories. They use Vitest with jsdom and Testing Library. All external API and database calls are mocked so no real credentials are required to run the test suite.

### Coverage

Async Server Components and infrastructure modules (`lib/db`, `lib/supabase`) are excluded from the coverage scope — those are covered by integration and E2E tests. The table below reflects the in-scope unit-testable surface.

| Metric     | Coverage | Threshold |
| ---------- | -------- | --------- |
| Statements | 98.97%   | 70%       |
| Branches   | 88.09%   | 70%       |
| Functions  | 100%     | 70%       |
| Lines      | 98.95%   | 70%       |

---

## Switching AI providers

Set `AI_PROVIDER` in your `.env.local` to any of the supported values:

```bash
AI_PROVIDER=gemini      # Gemini (default — has a free tier, so the app runs without a paid key)
AI_PROVIDER=anthropic   # Claude
AI_PROVIDER=openai      # GPT
```

If `AI_PROVIDER` is unset, the app defaults to `gemini`. Whichever provider you pick, the others act as an automatic fallback chain if the primary call fails.

The adapter pattern in `lib/ai/provider.ts` means adding a new provider is a matter of implementing the `AIAdapter` interface and registering it — no changes needed in the generation or verification logic.

---

## Security model

Authentication and authorization are enforced at three layers:

| Layer          | Mechanism                                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pages**      | `proxy.ts` refreshes the Supabase session cookie on every request and redirects unauthenticated users away from `/dashboard` and `/customers/*`                                                                 |
| **API routes** | `/api/generate-message` calls `auth.getUser()` and returns `401` if no valid session is present                                                                                                                 |
| **Database**   | `DATABASE_URL` must be configured with a **least-privilege Postgres role** — SELECT on `customers`, SELECT + INSERT on `outreach_log`. Do not use a superuser or the Supabase service role for this connection. |

**Important — RLS note:** `supabase/schema.sql` defines Row-Level Security policies on both tables. These policies are **not enforced** by the Drizzle queries in this app, which connect via `DATABASE_URL` using a direct Postgres role rather than the Supabase JS client. Security relies on the application-layer checks above and the role permissions on the database connection string.

---

## CI / Quality gates

Every push and pull request runs four independent checks via GitHub Actions:

| Check        | What it enforces                                          |
| ------------ | --------------------------------------------------------- |
| **Prettier** | Consistent code formatting (`prettier --check`)           |
| **Lint**     | ESLint rules including Next.js and Prettier compatibility |
| **Tests**    | Full Vitest suite must pass                               |
| **Build**    | Next.js production build must compile without errors      |

A pre-commit hook (Husky + lint-staged) runs ESLint fix and Prettier on staged files before every local commit, keeping the CI green from the start.
