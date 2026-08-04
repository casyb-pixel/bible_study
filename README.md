# Bible Study

A private, hands-free Christian theology study application for family use.

The application is built for continuous voice-led Scripture reading, with precise progress tracking so study can stop and resume at book, chapter, and verse. Available translations are NKJV, NIV, and NLT via API.Bible. Writings that the Bible itself references may be included later for historical context; they are never treated as Scripture.

This is a family study tool, not a public platform.

## Purpose

- Read and study Scripture from Genesis onward by default (NKJV, NIV, or NLT).
- Support hands-free use (continuous microphone, spoken responses, barge-in, and resumable placeholders) once the voice layer is added.
- Track each user’s exact place in the text, including placeholders and chapter completions.
- Keep all study content inside the text and its immediate historical context.

## Purity principles

These are non-negotiable:

1. **Scripture alone is authoritative.** The chosen Bible translation text is the base for study.
2. **Referenced writings only as history.** Books or writings the Bible itself mentions (for example, the Book of Jasher, the Book of the Wars of the Lord, or material quoted in Jude) may be included for historical reference. They must always be clearly labeled as historical only.
3. **No modern framing.** No cultural accommodation, progressive or conservative branding, contemporary theological trends, or worldly commentary in application content or AI responses.
4. **Stay in the text.** Responses and study aids must remain inside the biblical text and immediate historical context.

## Tech stack

| Layer | Choice |
| --- | --- |
| App framework | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Hosting | Vercel |
| Database | Neon (serverless Postgres) via Drizzle ORM |
| Scripture text | API.Bible (NKJV, NIV, NLT) |
| Auth | Not implemented yet (Clerk or Better Auth planned) |
| Voice | Not implemented yet (Grok Voice planned) |

## Current status

Built so far:

- Next.js 15 project foundation and basic PWA support
- Neon database with Drizzle schema for `users`, `progress`, `placeholders`, `chapter_completions`, and `chapter_cache`
- API routes for users, progress, placeholders, chapter completions, and chapter text
- Chapter reading with next/previous navigation, progress saving, and per-user translation preference
- Home page resume link and simple `/new-user` creation page

Not built yet:

- Full authentication
- Voice input and TTS
- Offline scripture caching
- Non-canonical historical text labeling UI

## Local setup

### Requirements

- Node.js 20+
- npm
- A Neon Postgres database

### Configure environment

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

- `DATABASE_URL` — Neon connection string
- `API_BIBLE_KEY` — API.Bible access key

Do not commit `.env.local` or any file containing real database credentials. `.env*` files are gitignored except `.env.example`, which contains only placeholder values.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database commands

```bash
npm run db:generate   # create SQL migrations from the Drizzle schema
npm run db:push       # push schema changes to Neon
npm run db:studio     # open Drizzle Studio
```

### Progress API (no auth yet)

Create a user at `/new-user` or via `POST /api/users`, then pass `userId` directly:

- `GET /api/progress?userId=...`
- `POST /api/progress`
- `GET /api/placeholders?userId=...`
- `POST /api/placeholders`
- `POST /api/completions`

## Production (Vercel)

Live site: [https://bible-study-navy.vercel.app/](https://bible-study-navy.vercel.app/)

This application is intended for private family use, not as a public platform.

For the production deployment to work:

1. In the Vercel project settings, set:
   - `DATABASE_URL` — same Neon connection string used locally
   - `API_BIBLE_KEY` — API.Bible access key
2. Redeploy after adding or changing environment variables.
3. Confirm the site can create a user at `/new-user`, choose a translation, open a chapter, and resume from the home page.

Without `DATABASE_URL` or `API_BIBLE_KEY` on Vercel, progress tracking or chapter reading will fail in production.

## Repository

https://github.com/casyb-pixel/bible_study.git
