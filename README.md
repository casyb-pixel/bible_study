# Bible Study

A private, hands-free Christian theology study application for family use.

The application is built for continuous voice-led reading of the Legacy Standard Bible, with precise progress tracking so study can stop and resume at book, chapter, and verse. Writings that the Bible itself references may be included later for historical context; they are never treated as Scripture.

This is a family study tool, not a public platform.

## Purpose

- Read and study the Legacy Standard Bible from Genesis onward by default.
- Support hands-free use (continuous microphone, spoken responses, barge-in, and resumable placeholders) once the voice layer is added.
- Track each user’s exact place in the text, including placeholders and chapter completions.
- Keep all study content inside the text and its immediate historical context.

## Purity principles

These are non-negotiable:

1. **Scripture alone is authoritative.** The Legacy Standard Bible is the base text.
2. **Referenced writings only as history.** Books or writings the Bible itself mentions (for example, the Book of Jasher, the Book of the Wars of the Lord, or material quoted in Jude) may be included for historical reference. They must always be clearly labeled as historical only.
3. **No modern framing.** No cultural accommodation, progressive or conservative branding, contemporary theological trends, or worldly commentary in application content or AI responses.
4. **Stay in the text.** Responses and study aids must remain inside the biblical text and immediate historical context.

## Tech stack

| Layer | Choice |
| --- | --- |
| App framework | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Hosting | Vercel (planned / target) |
| Database | Neon (serverless Postgres) via Drizzle ORM |
| Auth | Not implemented yet (Clerk or Better Auth planned) |
| Voice | Not implemented yet (Grok Voice planned) |

## Current status

Built so far:

- Next.js 15 project foundation
- Neon database with Drizzle schema for `users`, `progress`, `placeholders`, and `chapter_completions`
- API routes for progress, placeholders, and chapter completions
- Minimal landing page and project documentation

Not built yet:

- Authentication
- Reading engine / LSB text layer
- Voice input and TTS
- PWA / offline support
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

Set `DATABASE_URL` in `.env.local` to your Neon connection string.

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

Pass `userId` directly. Create a user row in Neon first, then call:

- `GET /api/progress?userId=...`
- `POST /api/progress`
- `GET /api/placeholders?userId=...`
- `POST /api/placeholders`
- `POST /api/completions`

## Repository

https://github.com/casyb-pixel/bible_study.git
