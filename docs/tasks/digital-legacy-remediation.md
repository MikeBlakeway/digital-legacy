# Digital Legacy — Pre-Phase 2 Remediation

> **Purpose:** Documents every gap between the Phase 0/1 output and the architecture required to begin Phase 2 tasks. Work through all items in order before starting Task 2.1.
>
> **Why these gaps exist:** Phase 0 and Phase 1 were written before the personality inference architecture was designed and before the RunPod → Modal migration was finalised. The gaps fall into three categories:
> - **RunPod → Modal cleanup** — stale credentials, env vars, and directory structure from the original RunPod design
> - **Schema updates** — four new tables and three new columns required by Phase 2
> - **New infrastructure** — the `/analyse` Modal endpoint does not exist yet and must be built and deployed before Task 2.5 can run

---

## Summary checklist

| # | Area | Work | Who | Code? |
|---|---|---|---|---|
| R0.1 | `.env.example` | Remove RunPod vars, add `MODAL_ANALYSE_URL` | You | No |
| R0.2 | `.env.local` | Remove stale RunPod values, confirm Modal URLs present | You | No |
| R0.3 | Vercel env vars | Remove RunPod vars, add `MODAL_ANALYSE_URL` | You | No |
| R0.4 | Supabase schema | Apply migrations 004 and 005 | You | No (SQL only) |
| R1.1 | `lib/` namespace | Confirm or rename `lib/runpod/` → `src/lib/ai/` | You / Agent | Maybe |
| R1.2 | `lib/ai/tts.ts` | Add optional `emotion_b2_key` parameter | Coding agent | Yes |
| R1.3 | `lib/ai/analyse.ts` | Create new typed wrapper for `/analyse` endpoint | Coding agent | Yes |
| R1.4 | `modal/` structure | Confirm modal handlers follow `modal/app.py` pattern, not RunPod handlers | You | No |
| R1.5 | `/analyse` endpoint | Build, deploy, and smoke test the new Modal endpoint | Coding agent + You | Yes |
| R1.6 | Smoke test script | Extend `scripts/test_endpoints.ts` to cover `/analyse` | Coding agent | Yes |

---

## R0.1 — Update `.env.example`

**Who:** You (manual edit)
**Prerequisite:** None

The `.env.example` committed to the repository still contains RunPod variables from the original Phase 0 design. These are incorrect and will confuse anyone (or any agent) using the file as a reference.

**Remove these variables entirely:**
```
RUNPOD_API_KEY
RUNPOD_INFER_ENDPOINT_ID
RUNPOD_TTS_ENDPOINT_ID
RUNPOD_STT_ENDPOINT_ID
RUNPOD_EMBED_ENDPOINT_ID
RUNPOD_NETWORK_VOLUME_ID
```

**Replace the inference section with:**
```env
# Modal AI inference
MODAL_INFER_URL=
MODAL_ANALYSE_URL=
MODAL_TTS_URL=
MODAL_STT_URL=
MODAL_EMBED_URL=
```

The final `.env.example` should contain exactly:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Backblaze B2
B2_KEY_ID=
B2_APP_KEY=
B2_BUCKET_NAME=
B2_ENDPOINT=
B2_REGION=

# Modal AI inference
MODAL_INFER_URL=
MODAL_ANALYSE_URL=
MODAL_TTS_URL=
MODAL_STT_URL=
MODAL_EMBED_URL=
```

Commit and push.

**✓ Verification:** `.env.example` in the repo contains no `RUNPOD_*` variables.

---

## R0.2 — Update `.env.local`

**Who:** You (manual edit — file is gitignored)
**Prerequisite:** Phase 1 Modal migration complete (Modal URLs exist)

**Remove:**
```
RUNPOD_API_KEY
RUNPOD_NETWORK_VOLUME_ID
RUNPOD_INFER_ENDPOINT_ID
RUNPOD_TTS_ENDPOINT_ID
RUNPOD_STT_ENDPOINT_ID
RUNPOD_EMBED_ENDPOINT_ID
```

**Confirm the following are present and populated with real values:**
```env
MODAL_INFER_URL=https://<your-modal-app>--infer.modal.run
MODAL_TTS_URL=https://<your-modal-app>--tts.modal.run
MODAL_STT_URL=https://<your-modal-app>--stt.modal.run
MODAL_EMBED_URL=https://<your-modal-app>--embed.modal.run
```

**Add (value populated in R1.5 after `/analyse` endpoint is deployed):**
```env
MODAL_ANALYSE_URL=
```

**✓ Verification:** `.env.local` contains no `RUNPOD_*` variables. All four existing `MODAL_*` URLs are populated. `MODAL_ANALYSE_URL` is present (value can be blank until R1.5).

---

## R0.3 — Update Vercel Environment Variables

**Who:** You (Vercel dashboard)
**Prerequisite:** R0.2 complete

1. Go to Vercel → your `digital-legacy` project → **Settings → Environment Variables**
2. **Delete** any variables beginning with `RUNPOD_`
3. **Confirm** these are present and populated (they should be from Phase 1):
   - `MODAL_INFER_URL`
   - `MODAL_TTS_URL`
   - `MODAL_STT_URL`
   - `MODAL_EMBED_URL`
4. **Add** `MODAL_ANALYSE_URL` — leave value as `pending` for now (populated after R1.5)
5. Ensure scope is set to **Production, Preview, and Development** for all Modal vars

**✓ Verification:** Vercel environment variables page shows no `RUNPOD_*` entries. All five `MODAL_*` variables are listed.

---

## R0.4 — Apply Phase 2 Database Migrations

**Who:** You (Supabase SQL Editor or CLI)
**Prerequisite:** R0.1 complete (repo updated)

Two migration files are defined in the Phase 2 task briefs. Apply them both before any Phase 2 code is written.

### Migration 004 — Phase 2 schema additions

Create `supabase/migrations/004_phase2_schema.sql` in the repo with the following content, then apply it:

```sql
-- Biographical facts on persona (replaces identity_prompt concept)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS birth_year integer;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS birth_place text;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS locations_lived text[];

-- memories.source enum: add 'diary' value
-- If source is stored as a Postgres enum type:
ALTER TYPE memory_source ADD VALUE IF NOT EXISTS 'diary';
-- If source is stored as plain text with a CHECK constraint, update the constraint:
-- ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_source_check;
-- ALTER TABLE memories ADD CONSTRAINT memories_source_check
--   CHECK (source IN ('interview', 'voice_memo', 'free_text', 'media_caption', 'diary'));

-- Diary entries
CREATE TABLE IF NOT EXISTS diary_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id          uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  content             text,
  voice_b2_key        text,
  transcript          text,
  emotion_label       text,
  emotion_updates     jsonb,
  word_count          integer,
  processed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Interview sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id          uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  theme               text NOT NULL,
  messages            jsonb NOT NULL DEFAULT '[]',
  turn_count          integer NOT NULL DEFAULT 0,
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Persona trait profiles (versioned, one current per persona)
CREATE TABLE IF NOT EXISTS persona_traits (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id               uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  version                  integer NOT NULL DEFAULT 1,
  openness                 float,
  conscientiousness        float,
  extraversion             float,
  agreeableness            float,
  neuroticism              float,
  narrative_agency         float,
  narrative_communion      float,
  narrative_redemption     float,
  dominant_values          text[],
  summary_prose            text,
  identity_block           text,
  diary_entries_analysed   integer NOT NULL DEFAULT 0,
  interview_turns_analysed integer NOT NULL DEFAULT 0,
  computed_at              timestamptz NOT NULL DEFAULT now(),
  is_current               boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS persona_traits_current_idx
  ON persona_traits(persona_id)
  WHERE is_current = true;

-- Emotional voice sample library
CREATE TABLE IF NOT EXISTS emotional_voice_samples (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id       uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  emotion_label    text NOT NULL,
  b2_key           text NOT NULL,
  duration_seconds float NOT NULL,
  quality_score    float,
  created_at       timestamptz NOT NULL DEFAULT now()
);
```

> **Note on `memory_source` enum:** The Phase 1 migration defined `source` as an enum. Check your `001_initial_schema.sql` to confirm whether it uses `CREATE TYPE` or a CHECK constraint, and use the appropriate branch of the ALTER above. If you are unsure, run this in the SQL Editor to check:
> ```sql
> SELECT column_name, data_type, udt_name
> FROM information_schema.columns
> WHERE table_name = 'memories' AND column_name = 'source';
> ```
> If `data_type` is `USER-DEFINED`, it is an enum type. If it is `text` or `character varying`, it is a check constraint.

### Migration 005 — Phase 2 RLS policies

Create `supabase/migrations/005_phase2_rls.sql` and apply:

```sql
-- diary_entries: owner read/write only
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON diary_entries
  USING (persona_id IN (
    SELECT id FROM personas WHERE owner_user_id = auth.uid()
  ));

-- interview_sessions: owner read/write only
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON interview_sessions
  USING (persona_id IN (
    SELECT id FROM personas WHERE owner_user_id = auth.uid()
  ));

-- persona_traits: owner read only; writes via service role only
ALTER TABLE persona_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_read" ON persona_traits FOR SELECT
  USING (persona_id IN (
    SELECT id FROM personas WHERE owner_user_id = auth.uid()
  ));

-- emotional_voice_samples: owner read/write only
ALTER TABLE emotional_voice_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON emotional_voice_samples
  USING (persona_id IN (
    SELECT id FROM personas WHERE owner_user_id = auth.uid()
  ));
```

**Apply both migrations:**
```bash
supabase db push
```
Or paste each file into the Supabase SQL Editor and run manually.

**✓ Verification:**
- Supabase Table Editor shows all four new tables
- `personas` table shows `birth_year`, `birth_place`, `locations_lived` columns
- `memories.source` accepts the value `'diary'` without error (test: `INSERT INTO memories (source...) VALUES ('diary'...)` in SQL Editor)
- `persona_traits_current_idx` visible under Database → Indexes
- All four new tables show RLS enabled with their policies in Authentication → Policies

---

## R1.1 — Confirm `lib/ai/` Namespace

**Who:** You (inspect the repo)
**Prerequisite:** None

The Phase 1 task brief specified `lib/runpod/` as the AI library namespace. The architecture document specifies `src/lib/ai/`. One of these is what was actually built — check the repo now.

**Open the repo and look for:**
```
src/lib/ai/        ← correct per architecture doc
lib/runpod/        ← incorrect, needs renaming
```

**If `lib/runpod/` exists and `src/lib/ai/` does not:**

This is a coding agent task. Provide the agent with this instruction:

> Rename the directory `lib/runpod/` to `src/lib/ai/` (or `lib/ai/` if the project does not use an `src/` root). Update all import paths across the codebase that reference `lib/runpod/` to reference `lib/ai/` instead. Files to rename:
> - `client.ts` → keep as `client.ts` (base fetch wrapper)
> - `infer.ts` → keep as `infer.ts`
> - `tts.ts` → keep as `tts.ts`
> - `stt.ts` → keep as `stt.ts`
> - `embed.ts` → keep as `embed.ts`
>
> After renaming, run `tsc --noEmit` to confirm no broken imports remain.

**If `src/lib/ai/` already exists:** no action needed. Proceed to R1.2.

**✓ Verification:** `grep -r "lib/runpod" src/` returns no results.

---

## R1.2 — Update `lib/ai/tts.ts` for Emotional Reference

**Who:** Coding agent
**Prerequisite:** R1.1 complete

The existing `tts.ts` wrapper was written to the original `/tts` contract:
```typescript
{ text: string, speaker_wav_b2_key: string, language: string }
```

The updated contract (architecture doc section 7.3) adds an optional `emotion_b2_key` parameter:
```typescript
{ text: string, speaker_wav_b2_key: string, language: string, emotion_b2_key?: string }
```

**Agent brief:**

> Update `lib/ai/tts.ts`. The `/tts` Modal endpoint now accepts an optional `emotion_b2_key` parameter. When present, XTTS uses this clip for emotional prosody reference rather than the neutral `speaker_wav_b2_key`.
>
> Update the TypeScript wrapper function signature to:
> ```typescript
> export async function synthesiseSpeech(params: {
>   text: string
>   speaker_wav_b2_key: string
>   language: string
>   emotion_b2_key?: string    // optional emotional reference clip
> }): Promise<{ audio_base64: string }>
> ```
>
> Pass `emotion_b2_key` through to the Modal endpoint request body when present. Do not pass it when undefined — omit the key from the request body entirely rather than sending `emotion_b2_key: undefined`.
>
> Run `tsc --noEmit` to confirm no type errors.

**✓ Verification:** `tts.ts` accepts `emotion_b2_key` as an optional parameter. TypeScript compiles without errors.

---

## R1.3 — Create `lib/ai/analyse.ts`

**Who:** Coding agent
**Prerequisite:** R1.1 complete

The `/analyse` endpoint does not have a TypeScript wrapper yet. This wrapper is required by the trait inference pipeline (Task 2.5) and the emotion classification step in the voice conversation pipeline (Task 2.11).

**Agent brief:**

> Create `lib/ai/analyse.ts`. This is a typed wrapper for the Modal `/analyse` endpoint, which is called via `MODAL_ANALYSE_URL` from the environment.
>
> The endpoint accepts two tasks differentiated by the `task` field:
>
> **Task: `trait_inference`**
> Input: a corpus of text (diary entries + interview responses concatenated).
> Output: Big Five scores, narrative signals, values, prose summary, and a generated identity block for the persona's system prompt.
>
> **Task: `emotion_classify`**
> Input: a short text passage (the persona's response text, one to three sentences).
> Output: an emotion label (one of 8 values) and an intensity score.
>
> Implement the following exports:
>
> ```typescript
> export type TraitInferenceResult = {
>   openness: number              // 0.0–1.0
>   conscientiousness: number
>   extraversion: number
>   agreeableness: number
>   neuroticism: number
>   narrative_agency: number
>   narrative_communion: number
>   narrative_redemption: number
>   dominant_values: string[]     // top 3–5 Schwartz value labels
>   summary_prose: string         // human-readable summary shown to subject
>   identity_block: string        // first-person system prompt identity block
> }
>
> export type EmotionClassifyResult = {
>   emotion_label: 'warm' | 'sad' | 'frustrated' | 'anxious' | 'amused' | 'tender' | 'indignant' | 'reflective'
>   intensity: number             // 0.0–1.0
> }
>
> export async function inferTraits(corpus: string): Promise<TraitInferenceResult>
> export async function classifyEmotion(text: string): Promise<EmotionClassifyResult>
> ```
>
> Both functions POST to `process.env.MODAL_ANALYSE_URL`. The request body shape is:
> ```json
> { "task": "trait_inference" | "emotion_classify", "input": "<text>" }
> ```
> The response body shape is:
> ```json
> { "result": { ...task-specific object... } }
> ```
>
> Throw a descriptive typed error if the response is non-200, if `result` is missing, or if the endpoint returns `{ "error": "parse_failed" }`.
>
> Run `tsc --noEmit` to confirm no type errors. No `any` types.

**✓ Verification:** `lib/ai/analyse.ts` exports `inferTraits` and `classifyEmotion` with correct types. `tsc --noEmit` passes.

---

## R1.4 — Confirm Modal Handler Structure

**Who:** You (inspect the repo)
**Prerequisite:** None

The Phase 1 task brief produced `runpod/infer/handler.py`, `runpod/tts/handler.py`, etc. — RunPod-style handlers. The architecture doc specifies `modal/app.py` as the correct structure for Modal deployments.

**Check the repo for one of these structures:**

```
modal/
└── app.py          ← Modal-native (correct)
```
```
runpod/
├── infer/handler.py   ← RunPod-native (needs replacing)
├── tts/handler.py
├── stt/handler.py
└── embed/handler.py
```

**If `modal/app.py` exists with Modal-native functions** (`@app.function`, `@modal.web_endpoint`): no action needed. Proceed to R1.5.

**If `runpod/` directory exists with RunPod-pattern handlers:** the Modal migration did not fully complete. This is a significant coding agent task — the four RunPod handlers need to be rewritten as Modal web endpoint functions. Flag this before proceeding and raise it as a separate remediation task with a full agent brief. The Phase 1 setup tasks document (Task 1.3) contains the handler logic; the agent would need to translate that logic to Modal's deployment pattern.

> In practice, if the smoke tests from Phase 1 (Task 1.5) passed against live Modal endpoints, the Modal handlers almost certainly exist correctly. The RunPod directory may simply not have been deleted. Confirm by checking whether `modal/app.py` is present — if it is, the RunPod directory is a leftover and can be deleted.

**✓ Verification:** `modal/app.py` exists and contains function definitions for `/infer`, `/tts`, `/stt`, and `/embed`. If a `runpod/` directory exists alongside it, delete it.

---

## R1.5 — Build and Deploy the `/analyse` Modal Endpoint

**Who:** Coding agent (handler) + You (deployment)
**Prerequisite:** R1.4 confirmed, Phase 1 Modal Volume with model weights accessible

This is the most substantial remediation task. The `/analyse` endpoint is entirely new and does not exist in any form yet.

### Part A — Coding agent: write the handler

**Agent brief:**

> Add a new Modal web endpoint function to `modal/app.py` for the `/analyse` task. This endpoint uses the same base Llama 3.1 8B model as `/infer` but with different configuration: no LoRA adapter, temperature 0.2, and vLLM guided decoding with forced JSON output.
>
> The endpoint must handle two tasks differentiated by the `task` field in the request body.
>
> **Request contract:**
> ```json
> { "task": "trait_inference" | "emotion_classify", "input": "string" }
> ```
>
> **For `trait_inference`:**
> System prompt (include verbatim):
> ```
> You are an expert personality psychologist conducting a linguistic analysis.
> Analyse the following text corpus, which consists of diary entries and interview responses
> from a single individual. Based solely on the language, themes, and patterns in the text,
> score the individual on the Big Five personality dimensions and identify their narrative
> patterns and dominant values.
>
> Return ONLY a JSON object matching this exact schema. No preamble, no explanation:
> {
>   "openness": <float 0.0-1.0>,
>   "conscientiousness": <float 0.0-1.0>,
>   "extraversion": <float 0.0-1.0>,
>   "agreeableness": <float 0.0-1.0>,
>   "neuroticism": <float 0.0-1.0>,
>   "narrative_agency": <float 0.0-1.0>,
>   "narrative_communion": <float 0.0-1.0>,
>   "narrative_redemption": <float 0.0-1.0>,
>   "dominant_values": [<string>, ...],
>   "summary_prose": "<2-3 sentence human-readable personality summary>",
>   "identity_block": "<first-person system prompt identity description>"
> }
> ```
> `max_tokens`: 1024. Temperature: 0.2.
>
> **For `emotion_classify`:**
> System prompt (include verbatim):
> ```
> Classify the emotional register of the following text. Return ONLY a JSON object. No preamble:
> { "emotion_label": "<warm|sad|frustrated|anxious|amused|tender|indignant|reflective>", "intensity": <float 0.0-1.0> }
> ```
> `max_tokens`: 64. Temperature: 0.2.
>
> **JSON parse error handling:** If the model output cannot be parsed as valid JSON, retry once by appending to the prompt: `"\n\nYour previous response was not valid JSON. Return ONLY the JSON object, no other text."` If it fails again, return `{ "error": "parse_failed" }`.
>
> **Response contract:**
> ```json
> { "result": { ...task output... } }
> ```
> or on parse failure:
> ```json
> { "error": "parse_failed" }
> ```
>
> Use vLLM's `guided_decoding` with `outlines` backend to enforce the JSON schema for each task type. The schema objects should match the response structures above.
>
> The function should be decorated as a Modal web endpoint and exposed at the path `/analyse`. It loads the model from `/model-weights/llama-3.1-8b-instruct` on the Modal Volume — the same volume used by `/infer`. No LoRA adapter is loaded.
>
> After writing the handler, run `modal deploy modal/app.py` to deploy. Copy the resulting `/analyse` endpoint URL.

### Part B — You: update environment variables

After the agent deploys the endpoint:

1. Copy the `/analyse` URL from the Modal console (format: `https://<app>--analyse.modal.run`)
2. Add to `.env.local`: `MODAL_ANALYSE_URL=https://<app>--analyse.modal.run`
3. Update Vercel: replace the `pending` placeholder with the real URL

**✓ Verification:** Modal console shows the `analyse` function deployed and active. Calling the endpoint manually via curl with a `trait_inference` payload returns a valid JSON result. `MODAL_ANALYSE_URL` is populated in both `.env.local` and Vercel.

---

## R1.6 — Extend Smoke Test Script

**Who:** Coding agent
**Prerequisite:** R1.3 and R1.5 complete, `MODAL_ANALYSE_URL` populated

The existing `scripts/test_endpoints.ts` tests four endpoints. It needs two new test cases covering the `/analyse` endpoint's two tasks.

**Agent brief:**

> Extend `scripts/test_endpoints.ts` to add smoke tests for the `/analyse` endpoint using the typed wrappers from `lib/ai/analyse.ts`.
>
> Add these two test cases:
>
> ```typescript
> // analyse — trait_inference: pass a short sample corpus, confirm result shape
> // Minimum check: all 8 float fields present and between 0.0–1.0,
> // dominant_values is a non-empty array,
> // summary_prose and identity_block are non-empty strings
> const sampleCorpus = `
>   I've always believed that most people are fundamentally good, even when they do bad things.
>   Growing up, my father taught me that you judge a person not by what they say but by what
>   they do when no one is watching. I've tried to live by that. I've failed sometimes.
>   The times I'm most ashamed of are the times I chose the easy path over the right one.
> `
> const traitResult = await inferTraits(sampleCorpus)
> // log result and assert shape
>
> // analyse — emotion_classify: pass a short sentence, confirm valid emotion label returned
> const emotionResult = await classifyEmotion("Oh my goodness, is little Freddy okay?")
> // log result and assert emotion_label is one of the 8 valid values
> ```
>
> Run with `npx tsx scripts/test_endpoints.ts`. All six endpoint tests should pass.

**✓ Verification:** `npx tsx scripts/test_endpoints.ts` runs to completion with all six tests passing, including both `/analyse` tasks.

---

## Completion checklist

Before starting Phase 2 Task 2.1, confirm all of the following:

**Environment**
- [ ] `.env.example` in repo contains no `RUNPOD_*` variables
- [ ] `.env.local` contains no `RUNPOD_*` variables
- [ ] `.env.local` has all five `MODAL_*` URLs populated with real values
- [ ] Vercel has no `RUNPOD_*` variables
- [ ] Vercel has all five `MODAL_*` URLs populated

**Database**
- [ ] `personas` table has `birth_year`, `birth_place`, `locations_lived` columns
- [ ] `memories.source` accepts value `'diary'`
- [ ] `diary_entries` table exists with correct columns
- [ ] `interview_sessions` table exists with correct columns
- [ ] `persona_traits` table exists with `is_current` unique partial index
- [ ] `emotional_voice_samples` table exists
- [ ] RLS enabled and policies applied for all four new tables

**Code**
- [ ] `lib/ai/` namespace confirmed (no `lib/runpod/` references)
- [ ] `lib/ai/tts.ts` accepts optional `emotion_b2_key` parameter
- [ ] `lib/ai/analyse.ts` exists with `inferTraits` and `classifyEmotion` exports
- [ ] `tsc --noEmit` passes across the whole project

**Modal**
- [ ] `modal/app.py` contains `/analyse` function
- [ ] `/analyse` endpoint live in Modal console
- [ ] All five endpoints return valid responses in smoke test script

---

*Last updated: June 2026*
