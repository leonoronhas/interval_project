# Interval Guard

[![Build](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml/badge.svg?label=build&event=push)](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml)
[![Lint](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml/badge.svg?label=lint&event=push)](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml)
[![Tests](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml/badge.svg?label=tests&event=push)](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml)
[![Prettier](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml/badge.svg?label=prettier&event=push)](https://github.com/leonoronhas/interval_project/actions/workflows/ci.yml)

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
  api/generate-message/   # POST endpoint — generates and verifies a message
  dashboard/              # Protected dashboard (customer table + activity feed)
  login/                  # Auth page
components/
  GeneratePanel.tsx        # Slide-in panel for selecting type and mode
  ViolationHighlighter.tsx # Highlights detected factual violations in the output
  ActivityFeed.tsx         # Recent outreach log sidebar
lib/
  ai/
    groundingEngine.ts    # Core guarded/unguarded generation + verification logic
    provider.ts           # Adapter selector (reads AI_PROVIDER env var)
    providers/            # Thin wrappers for Anthropic, OpenAI, Gemini
  db/
    schema.ts             # Drizzle schema — customers + outreach_log tables
    queries.ts            # Typed query helpers
  supabase/               # Server/client/middleware Supabase instances
__tests__/                # Unit tests mirroring the src structure
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

# AI provider — pick one: "anthropic" | "openai" | "gemini"
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

### 3. Run database migrations

```bash
npx drizzle-kit push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the login page. Sign up via Supabase Auth, then land on the dashboard.

---

## Available scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start the Next.js development server |
| `npm run build`  | Production build                     |
| `npm run start`  | Start the production server          |
| `npm run test`   | Run tests in watch mode              |
| `npm run lint`   | Run ESLint                           |
| `npm run format` | Auto-format all files with Prettier  |

---

## Running tests

```bash
# Run all tests once (CI mode)
npx vitest run

# Run in watch mode during development
npm run test
```

Tests live in `__tests__/` and mirror the `app/`, `components/`, `hooks/`, and `lib/` directories. They use Vitest with jsdom and Testing Library. All external API and database calls are mocked so no real credentials are required to run the test suite.

---

## Switching AI providers

Set `AI_PROVIDER` in your `.env.local` to any of the supported values:

```bash
AI_PROVIDER=anthropic   # Claude (default)
AI_PROVIDER=openai      # GPT
AI_PROVIDER=gemini      # Gemini
```

The adapter pattern in `lib/ai/provider.ts` means adding a new provider is a matter of implementing the `AIAdapter` interface and registering it — no changes needed in the generation or verification logic.

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
