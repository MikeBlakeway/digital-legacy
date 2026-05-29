# Digital Legacy

Private, self-hosted AI persona capture and conversation platform.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database

Supabase migrations live in `supabase/migrations`.

The initial migration creates the section 6 data model from
`docs/digital-legacy-architecture.md`, including pgvector, indexes, triggers,
and row-level security policies.

```bash
supabase db push
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth/Postgres/pgvector/RLS

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
