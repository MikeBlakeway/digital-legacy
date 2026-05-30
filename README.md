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
npm run validate:modal
```

## AI Endpoints (Modal)

This project uses Modal web endpoints for AI inference:

- `infer` (Llama 3.1 + LoRA)
- `tts` (XTTS v2)
- `stt` (faster-whisper)
- `embed` (nomic-embed-text)

Deploy the Modal app:

```bash
modal deploy modal/app.py
```

Bootstrap model weights into the Modal volume (one-time, 60-90 minutes):

```bash
modal run modal/app.py::download_models
```

## Vercel Environment Variables

After `modal deploy`, Modal prints four endpoint URLs. Add them to Vercel project environment variables and local `.env.local`:

- `MODAL_INFER_URL`
- `MODAL_TTS_URL`
- `MODAL_STT_URL`
- `MODAL_EMBED_URL`

Example pattern:

- `https://mikeblakeway--digital-legacy-infer.modal.run`
- `https://mikeblakeway--digital-legacy-tts.modal.run`
- `https://mikeblakeway--digital-legacy-stt.modal.run`
- `https://mikeblakeway--digital-legacy-embed.modal.run`

Run the endpoint smoke test:

```bash
npx tsx scripts/test_endpoints.ts
```
