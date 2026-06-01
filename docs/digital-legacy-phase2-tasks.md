# Digital Legacy — Phase 2 Task Briefs

> **Status:** Ready for agent execution
> **Prerequisites:** Phase 0 and Phase 1 complete — all Modal endpoints live, Supabase schema deployed, smoke tests passing
> **How to use:** One task per agent session. Provide the agent with this document and `docs/digital-legacy-architecture.md` as context.

---

## Architecture overview for Phase 2

### Core design principle

The persona's voice and personality are **inferred from authentic expression**, not self-declared. Subjects never write about who they are — they tell stories, answer questions, and keep a diary. The system derives personality traits, values, and emotional patterns from that material and uses them to build the persona.

### Personality model

Three layered dimensions are inferred from captured content:

- **Big Five traits** (OCEAN) — Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism. Scored as floats 0.0–1.0. Derived from linguistic analysis of the full content corpus.
- **Narrative identity signals** — agency, communion, redemption, and contamination patterns extracted from stories. Based on McAdams narrative identity theory.
- **Schwartz values** — top 3–5 values inferred from interview content (e.g. security, benevolence, achievement).

These are computed by the `/analyse` Modal endpoint and stored in `persona_traits`. They are used to generate the identity block of the persona's system prompt — not shown to the subject in raw form.

### Modal endpoints (Phase 2 additions)

Two changes to the Modal layer:

**`/analyse`** — new endpoint. Long-context analytical inference. Same base Llama 3.1 8B model, no LoRA adapter, temperature 0.2, vLLM guided decoding (forced JSON output). Accepts a corpus of text, returns structured trait and narrative data. Runs independently of `/infer` so it can be configured and scaled separately.

**`/tts`** — extended. Now accepts an optional `emotion_b2_key` parameter alongside the existing `speaker_wav_b2_key`. When present, XTTS uses the emotional reference clip for prosodic guidance. Falls back to neutral reference when absent.

### Emotional voice synthesis

XTTS v2 inherits the prosodic characteristics (rhythm, pace, intonation) of its reference audio clip. By tagging voice recordings with the subject's emotional state at capture time, we build a per-subject **emotional voice library** — labelled reference clips for each of 8 emotional states. At synthesis time, the system infers the appropriate emotional register for the response text and selects the matching reference clip.

**8 emotional states:**

| Label | Display | When to use |
|---|---|---|
| `warm` | 😊 Warm / happy | General positive, content |
| `sad` | 😔 Sad / heavy | Grief, loss, regret |
| `frustrated` | 😠 Frustrated / angry | Irritation, injustice |
| `anxious` | 😰 Anxious / worried | Concern, uncertainty |
| `amused` | 😂 Amused / laughing | Humour, lightness |
| `tender` | 🥰 Tender / loving | Affection, care |
| `indignant` | 😤 Indignant / principled | Moral conviction, defiance |
| `reflective` | 😌 Calm / reflective | Contemplative, at peace |

**Emotional synthesis in the conversation pipeline uses Option B (parallel execution):**

The `/analyse` (emotion classification) call and the `/tts` call (with neutral reference) are fired simultaneously. If `/analyse` completes before TTS synthesis finishes, the TTS call is cancelled and restarted with the matched emotional reference clip. If `/analyse` does not complete in time, TTS with the neutral reference proceeds. This caps the latency cost while using emotional synthesis the majority of the time.

### AI agent modes

The Modal `/infer` endpoint is used in two distinct modes, differentiated entirely by system prompt:

- **Persona mode** — responds *as* the subject, used in family-facing conversation
- **Interviewer mode** — responds *as* a thoughtful interviewer, used in subject-facing structured interviews. Has no access to the persona's memories. Only knows the interview theme and current exchange thread.

---

## Task sequence and dependencies

| Task | Name | Depends on | Unlocks |
|---|---|---|---|
| **2.1** | Persona creation | Phase 1 | Everything — no persona row means nothing else works |
| **2.2** | Diary room | 2.1 | Emotional voice library, trait corpus, memory corpus |
| **2.3** | Structured interview with AI agent | 2.1 | Richer trait corpus, values signal |
| **2.4** | `/analyse` Modal endpoint | Phase 1 infra | Trait inference pipeline |
| **2.5** | Trait inference pipeline | 2.2, 2.3, 2.4 | Persona system prompt construction |
| **2.6** | Personality profile display | 2.5 | Subject visibility of inferred profile |
| **2.7** | Memory browser | 2.2, 2.3 | Subject management of model knowledge |
| **2.8** | Photo upload + auto-captioning | 2.1 | Media surfacing in conversation |
| **2.9** | Dedicated voice sample recording | 2.1 | Supplements emotional voice library |
| **2.10** | Text conversation (RAG) | 2.5, 2.7 | Core family-facing experience |
| **2.11** | Voice conversation with emotional synthesis | 2.9, 2.10 | Full emotionally-aware voice loop |
| **2.12** | Media surfacing in conversation | 2.8, 2.10 | Photos appear contextually in chat |

> Tasks 2.4, 2.8, and 2.9 can run in parallel with 2.2–2.3 — they do not depend on diary or interview content existing.

---

## Shared context block

> **Copy this context block into every agent session brief. It replaces the per-task context preamble.**

---

You are building a feature for **Digital Legacy**, a private Next.js 16.2.6 (App Router) web application. The full architecture document is at `docs/digital-legacy-architecture.md`. The Supabase schema is already deployed — do not modify existing migrations unless the task explicitly instructs you to add one.

**Stack:** Next.js 16.2.6 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres + pgvector + Auth), Backblaze B2, Modal (AI inference), Vercel.

**Key conventions:**
- All AI library code lives under `src/lib/ai/` — never `src/lib/runpod/`
- Supabase clients: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server/service role)
- Supabase env vars: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` — not legacy JWT keys
- Modal endpoints are called via typed wrappers in `src/lib/ai/` — `infer.ts`, `analyse.ts`, `tts.ts`, `stt.ts`, `embed.ts`
- B2 access via `src/lib/b2/client.ts` — pre-signed URLs only, 15-minute expiry, no public access
- All routes are auth-protected; unauthenticated requests redirect to `/login`
- TypeScript must compile without errors (`tsc --noEmit`); no `any` types in new files

**Persona model — personality is inferred, not self-declared:**
The subject never writes a self-description. Personality traits (Big Five), narrative patterns, and values are derived by the `/analyse` Modal endpoint from diary entries and interview responses. The inferred profile is stored in `persona_traits` and used to construct the persona's system prompt. The subject sees only a high-level prose summary of the inferred profile.

**Emotional voice synthesis:**
Voice recordings are tagged with one of 8 emotional state labels at capture time. These labelled clips build a per-subject emotional voice library stored in `emotional_voice_samples`. At TTS synthesis time, the response text is classified for emotional register via `/analyse`, and the matching reference clip is used. Parallel execution (Option B): `/analyse` and neutral `/tts` fire simultaneously; if `/analyse` resolves first, TTS is restarted with the emotional reference clip.

---

## Schema migrations for Phase 2

Apply these migrations before beginning feature tasks. Each can be run via `supabase db push` or pasted into the Supabase SQL Editor.

**`supabase/migrations/004_phase2_schema.sql`**

```sql
-- Biographical facts on persona (replaces identity_prompt)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS birth_year integer;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS birth_place text;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS locations_lived text[];  -- ordered array, most recent last

-- Diary entries (raw capture, separate from memories)
CREATE TABLE IF NOT EXISTS diary_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id          uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  content             text,                        -- null if voice-only entry not yet transcribed
  voice_b2_key        text,                        -- original audio, nullable
  transcript          text,                        -- whisper transcript of voice, nullable
  emotion_label       text,                        -- pre-session tag, one of 8 labels
  emotion_updates     jsonb,                       -- [{timestamp_seconds: float, emotion_label: text}]
  word_count          integer,
  processed_at        timestamptz,                 -- when trait inference last ran over this entry
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Interview sessions with AI agent
CREATE TABLE IF NOT EXISTS interview_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id          uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  theme               text NOT NULL,               -- 'values' | 'relationships' | 'fears' | 'life_stories' | 'formative'
  messages            jsonb NOT NULL DEFAULT '[]', -- [{role: 'agent'|'subject', content: text, emotion_label: text|null}]
  turn_count          integer NOT NULL DEFAULT 0,
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Inferred personality trait profiles (versioned)
CREATE TABLE IF NOT EXISTS persona_traits (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id              uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  version                 integer NOT NULL DEFAULT 1,
  -- Big Five (0.0–1.0)
  openness                float,
  conscientiousness       float,
  extraversion            float,
  agreeableness           float,
  neuroticism             float,
  -- Narrative identity signals (0.0–1.0)
  narrative_agency        float,
  narrative_communion     float,
  narrative_redemption    float,
  -- Values
  dominant_values         text[],                  -- top 3–5 Schwartz value labels
  -- Generated outputs
  summary_prose           text,                    -- 2–3 sentence human-readable summary
  identity_block          text,                    -- generated system prompt identity block
  -- Metadata
  diary_entries_analysed  integer NOT NULL DEFAULT 0,
  interview_turns_analysed integer NOT NULL DEFAULT 0,
  computed_at             timestamptz NOT NULL DEFAULT now(),
  is_current              boolean NOT NULL DEFAULT false
);

-- Ensure only one current trait profile per persona
CREATE UNIQUE INDEX IF NOT EXISTS persona_traits_current_idx
  ON persona_traits(persona_id)
  WHERE is_current = true;

-- Emotional voice samples library
CREATE TABLE IF NOT EXISTS emotional_voice_samples (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id      uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  emotion_label   text NOT NULL,
  b2_key          text NOT NULL,
  duration_seconds float NOT NULL,
  quality_score   float,                           -- SNR / clarity metric, computed at upload
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**RLS policies to add (`supabase/migrations/005_phase2_rls.sql`):**

```sql
-- diary_entries: owner read/write only
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON diary_entries
  USING (persona_id IN (SELECT id FROM personas WHERE owner_user_id = auth.uid()));

-- interview_sessions: owner read/write only
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON interview_sessions
  USING (persona_id IN (SELECT id FROM personas WHERE owner_user_id = auth.uid()));

-- persona_traits: owner read only (writes via service role only)
ALTER TABLE persona_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_read" ON persona_traits FOR SELECT
  USING (persona_id IN (SELECT id FROM personas WHERE owner_user_id = auth.uid()));

-- emotional_voice_samples: owner read/write only
ALTER TABLE emotional_voice_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON emotional_voice_samples
  USING (persona_id IN (SELECT id FROM personas WHERE owner_user_id = auth.uid()));
```

---

## Task 2.1 — Persona Creation

### What to build

A subject creates their persona through a minimal two-step form. Step 1 captures the name and slug. Step 2 captures biographical facts — the only subject-authored content that feeds directly into the system prompt as factual grounding (not personality).

There is no identity prompt or self-description. Personality is inferred later from diary and interview content.

The flow lives at `/capture/new`. On completion, redirect to `/capture/[slug]` — the capture dashboard (stub page, built out in later tasks).

---

### Files to produce

```
app/(app)/capture/
├── new/
│   └── page.tsx                        -- two-step persona creation page
└── [slug]/
    └── page.tsx                        -- capture dashboard stub

app/api/personas/
└── route.ts                            -- POST: create persona

components/capture/
├── PersonaForm.tsx                     -- step 1: name + slug
└── BiographicalForm.tsx                -- step 2: biographical facts

lib/supabase/
└── personas.ts                         -- typed DB helpers
```

---

### Detailed requirements

**`app/api/personas/route.ts` — POST**

1. Validate Supabase session server-side using the service-role client. Return 401 if unauthenticated.
2. Confirm authenticated user has role `subject` in `auth.users` metadata. Return 403 if not.
3. Accept body:
   ```typescript
   {
     name: string           // e.g. "Mike"
     slug: string           // lowercase alphanumeric + hyphens, 3–40 chars
     birth_year?: number    // optional, e.g. 1978
     birth_place?: string   // optional, e.g. "Manchester, England"
     locations_lived?: string[]  // optional ordered array, most recent last
   }
   ```
4. Validate slug uniqueness. Return 409 `{ error: 'slug_taken' }` if exists.
5. Insert into `personas`. Return 201 with the created row.

**`app/(app)/capture/new/page.tsx`**

Two-step form:

- **Step 1 — Name and slug:** Name field. Slug auto-derived (`name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`), editable, validated inline. Note: *"Used in URLs — cannot be changed later."* Handle 409 slug conflict with inline field error.
- **Step 2 — Biographical facts:** Birth year (number input, optional). Birthplace (text, optional). Places lived (tag-style input — type a place, press Enter to add, click to remove, optional). Helper text: *"This is factual grounding only — it helps the persona speak accurately about where they grew up and lived. Your personality comes through in your stories."*

On success redirect to `/capture/[slug]`. Tone: warm, purposeful.

**`app/(app)/capture/[slug]/page.tsx`**

Stub. Server component, auth-protected, ownership-checked (404 if not owned). Render persona name as heading. Placeholder: *"Your capture dashboard — more coming soon."* Four disabled nav links: Diary, Interviews, Voice, Photos.

**`lib/supabase/personas.ts`**

```typescript
export type Persona = {
  id: string
  name: string
  slug: string
  owner_user_id: string
  birth_year: number | null
  birth_place: string | null
  locations_lived: string[] | null
  lora_adapter_key: string | null
  voice_sample_key: string | null
  created_at: string
  updated_at: string
}

export async function createPersona(client: SupabaseClient, data: {...}): Promise<Persona>
export async function getPersonaBySlug(client: SupabaseClient, slug: string): Promise<Persona | null>
export async function getPersonasByOwner(client: SupabaseClient, owner_user_id: string): Promise<Persona[]>
```

---

### What NOT to do

- Do not add an identity prompt or self-description field — personality is inferred, not declared.
- Do not call any AI endpoints.
- Do not add navigation chrome or sidebar.
- Do not use a third-party form library.

---

### Acceptance criteria

- [ ] POST creates persona row with biographical fields populated
- [ ] Slug conflict returns 409 with inline field error
- [ ] On success, redirects to `/capture/[slug]`
- [ ] `/capture/[slug]` returns 404 if persona not found or not owned by current user
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.2 — Diary Room

### What to build

A private, quiet space at `/capture/[slug]/diary` where the subject records or writes diary entries. Voice is supported from day one — recordings are transcribed by Whisper automatically. Each session is tagged with an emotional state before starting, with optional mid-session re-tagging. Voice recordings tagged with an emotion are stored in the emotional voice library as well as the diary entry.

There is no AI agent in the diary room. No prompts, no questions. Just a blank space with an optional rotating thought starter the subject can ignore. The subject records or writes, saves, and is done.

Diary entries feed the trait inference pipeline (Task 2.5) and produce memories (embedded and stored in `memories` with `source = 'diary'`) for RAG retrieval.

---

### Files to produce

```
app/(app)/capture/[slug]/diary/
├── page.tsx                            -- diary home: entry list + new entry button
└── new/
    └── page.tsx                        -- diary entry page

app/api/personas/[slug]/diary/
└── route.ts                            -- POST: save diary entry; GET: list entries

components/capture/diary/
├── DiaryEntryComposer.tsx              -- main composition component (client)
├── EmotionSelector.tsx                 -- 8-state emotion picker
├── DiaryVoiceRecorder.tsx              -- voice recording with mid-session emotion re-tag
└── DiaryEntryList.tsx                  -- list of past entries

lib/supabase/
└── diary.ts                            -- typed DB helpers for diary_entries
```

---

### Detailed requirements

**`/api/personas/[slug]/diary` — POST**

1. Auth + ownership check.
2. Accept body:
   ```typescript
   {
     content?: string           // text content (null if voice-only)
     voice_b2_key?: string      // B2 key of uploaded audio (null if text-only)
     emotion_label: string      // required — one of 8 labels
     emotion_updates?: { timestamp_seconds: number; emotion_label: string }[]
   }
   ```
3. If `voice_b2_key` is present: fire-and-forget call to Modal `/stt` to transcribe. Store transcript in `diary_entries.transcript` once complete (non-blocking — respond 201 first).
4. Insert `diary_entries` row. Compute and store `word_count` from content or transcript.
5. If `voice_b2_key` is present and `emotion_label` is set: also insert an `emotional_voice_samples` row linking to the same B2 key. This clip contributes to the emotional voice library.
6. Fire-and-forget: embed the content (or transcript when available) and insert into `memories` with `source = 'diary'`, `persona_id` set. Non-blocking — do not fail the save if embed is unavailable.
7. Return 201 with the created `diary_entries` row.

**`/api/personas/[slug]/diary` — GET**

Return entries ordered `created_at DESC`, paginated (page + per_page). Include `word_count`, `emotion_label`, `created_at`. Do not return full content in the list view — truncate to 200 chars.

**`components/capture/diary/EmotionSelector.tsx`**

Displayed before the subject begins a session. Eight buttons, each showing the emoji + short label. Required selection before the compose area is enabled. Selected state clearly highlighted. Subtitle: *"How are you feeling right now? This helps capture the full range of your voice over time."*

**`components/capture/diary/DiaryVoiceRecorder.tsx`**

- Record / pause / stop controls.
- Live duration timer.
- Persistent emotion indicator showing the current tag — tappable to open `<EmotionSelector>` inline for mid-session re-tagging. When re-tagged, append to `emotion_updates` array with current `timestamp_seconds`.
- On stop: show playback controls. Upload to B2 via pre-signed URL (`diary/{persona_id}/{uuid}.webm`). On upload complete, call `onRecordingComplete({ voice_b2_key, duration_seconds })`.

**`components/capture/diary/DiaryEntryComposer.tsx`**

- `<EmotionSelector>` rendered first — blocks composition until emotion is selected.
- Below the selector: two input modes toggled by a tab or icon pair — **Write** and **Record**.
- Write mode: textarea, no character limit, no prompts. Optional thought starter shown in very light placeholder text (rotate from a hardcoded list of 12 fragments — e.g. *"Something I've been thinking about lately..."*, *"A moment I keep returning to..."*, *"Something I've never told anyone..."*). Placeholder disappears on first keystroke.
- Record mode: `<DiaryVoiceRecorder>`.
- Save button: *"Save entry"*. Disabled until emotion is selected and content or recording exists.
- On save: POST to `/api/personas/[slug]/diary`. Show success state, then offer *"Write another"* or *"Back to diary"*.

**`app/(app)/capture/[slug]/diary/page.tsx`**

- Shows total entry count and total word count across all entries.
- Shows emotional coverage: a small grid of the 8 emotion labels, each showing how many entries have been tagged with it. Empty states shown in muted colour. This gives the subject visibility into which emotions are well-represented in their voice library.
- List of past entries via `<DiaryEntryList>` (truncated previews, date, emotion emoji).
- Prominent *"New entry"* button.

---

### What NOT to do

- Do not add AI-generated prompts or questions in the diary room — it must feel like a private space, not an interview.
- Do not fail the save if transcription or embedding fails — degrade gracefully.
- Do not show the subject their inferred personality traits here — that is Task 2.6.

---

### Acceptance criteria

- [ ] Text entry saves diary entry row with correct `emotion_label` and `word_count`
- [ ] Voice entry uploads to B2, saves `voice_b2_key`, triggers background transcription
- [ ] Emotional voice library: voice entries with emotion tag create an `emotional_voice_samples` row
- [ ] Diary content is embedded and stored in `memories` with `source = 'diary'` (non-blocking)
- [ ] Mid-session emotion re-tags are stored in `emotion_updates` jsonb
- [ ] Diary home shows emotional coverage grid
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.3 — Structured Interview with AI Agent

### What to build

A conversational interview experience at `/capture/[slug]/interview`. The subject picks a theme; the AI agent (Modal `/infer` in interviewer mode) opens with a question; the subject responds by text or voice; the agent asks a follow-up based on what they said. This continues for 8–10 turns. The session is stored in `interview_sessions`. Subject turns are also embedded and stored in `memories` with `source = 'interview'`.

The agent is conversational, not clinical. It follows threads, probes depth, and does not move to the next question until the current thread is exhausted. It never validates excessively. It never asks more than one question at a time.

Voice responses are supported — recorded via the browser, transcribed by `/stt` before being submitted to the agent.

Emotion tagging is available on voice responses, identically to the diary room. Voice turns tagged with an emotion contribute to the emotional voice library.

---

### Files to produce

```
app/(app)/capture/[slug]/interview/
├── page.tsx                            -- interview home: theme selection
└── [sessionId]/
    └── page.tsx                        -- active interview session page

app/api/personas/[slug]/interview/
├── route.ts                            -- POST: start new session; GET: list sessions
└── [sessionId]/
    └── route.ts                        -- POST: submit a turn; GET: get session

components/capture/interview/
├── ThemeSelector.tsx                   -- theme cards
├── InterviewSession.tsx                -- main session UI (client component)
├── InterviewTurnInput.tsx              -- text + voice input for subject turn
└── InterviewProgress.tsx              -- turn counter + completion state

lib/supabase/
└── interviews.ts                       -- typed DB helpers for interview_sessions
```

---

### Detailed requirements

**Interview themes**

Defined in `lib/interview-themes.ts`:

| Theme ID | Title | Opening framing |
|---|---|---|
| `values` | What I Believe | Probes deeply-held beliefs and principles |
| `relationships` | The People Who Shaped Me | Explores significant relationships |
| `fears` | What I've Carried | Explores fears, regrets, things that weigh on the subject |
| `life_stories` | Stories From My Life | Surfaces narrative-rich episodes from the subject's history |
| `formative` | What Made Me | Childhood, upbringing, formative experiences |

**`/api/personas/[slug]/interview/route.ts` — POST (start session)**

1. Auth + ownership check.
2. Accept: `{ theme: string }`.
3. Insert `interview_sessions` row with `messages = []`, `turn_count = 0`.
4. Call Modal `/infer` in **interviewer mode** — system prompt constructs as follows:
   ```
   You are a thoughtful, skilled interviewer helping someone record their life story and personality
   for future generations. Your task is to explore the theme of "{theme_title}" through genuine
   conversation.

   Rules you must follow:
   - Ask one question at a time. Never ask multiple questions in a single turn.
   - Follow threads. If the subject says something interesting or emotionally resonant, pursue it
     before moving on.
   - Do not validate or affirm excessively. Avoid "That's wonderful" or "Great answer."
   - Aim for depth over breadth. One profound exchange is worth more than ten surface answers.
   - Keep your questions open-ended and narrative-focused. Prefer "Tell me about a time when..."
     over "Do you believe...?"
   - You are not an AI assistant. You are an interviewer. Do not break character.

   Begin by asking your opening question for the theme of "{theme_title}".
   ```
5. Store the agent's opening question as the first message in `interview_sessions.messages`:
   `{ role: 'agent', content: agentResponse, emotion_label: null }`.
6. Return the session row including the opening question.

**`/api/personas/[slug]/interview/[sessionId]/route.ts` — POST (submit turn)**

1. Auth + ownership check. Confirm session belongs to this persona.
2. Accept:
   ```typescript
   {
     content: string          // subject's response text (or transcript)
     emotion_label?: string   // optional emotion tag on this turn
     voice_b2_key?: string    // optional if voice was used
   }
   ```
3. Append subject turn to `messages`.
4. If `voice_b2_key` and `emotion_label` present: insert `emotional_voice_samples` row.
5. Embed the subject's response and store in `memories` with `source = 'interview'`, `question_prompt` set to the preceding agent message content.
6. If `turn_count >= 9` (10 turns reached): mark session `completed_at = now()`. Return `{ completed: true }` without calling the agent.
7. Otherwise: call Modal `/infer` in interviewer mode with the **full message history** as the conversation context. The agent's follow-up is generated from what the subject actually said — it is not a predetermined question.
8. Append agent follow-up to `messages`. Increment `turn_count`. Return updated session.

**`components/capture/interview/InterviewSession.tsx`**

- Renders the conversation as a clean transcript: agent turns left-aligned, subject turns right-aligned.
- `<InterviewTurnInput>` at the bottom for the subject's response.
- `<InterviewProgress>` shows turn count and a subtle progress indicator.
- Completion state: *"This session is complete."* with a button to start a new session on a different theme or return to the interview home.

**`components/capture/interview/InterviewTurnInput.tsx`**

- Tab toggle: **Write** / **Record**.
- Write: textarea, submit on button click or Cmd+Enter.
- Record: inline voice recorder (same pattern as `DiaryVoiceRecorder` — record, stop, preview, submit). Optional emotion selector shown above recorder. On submit, POST the transcript (transcribed via `/api/personas/[slug]/transcribe`) along with the B2 key and emotion label.
- Disabled while waiting for agent response.

**Interview home page (`/capture/[slug]/interview/page.tsx`)**

- `<ThemeSelector>` — five theme cards showing title, short description, and session count (how many completed sessions for this theme).
- Past sessions list below — showing theme, date, turn count, completion status.

---

### What NOT to do

- Do not use a static question list — the agent generates all questions dynamically from the conversation thread.
- Do not inject the persona's memory corpus into the interviewer system prompt — the agent must not know what memories already exist.
- Do not end the session before 8 turns unless the subject explicitly ends it.

---

### Acceptance criteria

- [ ] New session creates `interview_sessions` row and returns the agent's opening question
- [ ] Subject turn is stored in `messages`, embedded into `memories`, and triggers agent follow-up
- [ ] Agent follow-up is contextually relevant to the subject's preceding response (not a generic next question)
- [ ] Voice turns are transcribed and transcript stored; emotion-tagged voice turns populate `emotional_voice_samples`
- [ ] Session marked `completed_at` after 10 turns
- [ ] Interview home shows per-theme session counts
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.4 — `/analyse` Modal Endpoint

### What to build

A new Modal serverless endpoint (`/analyse`) for long-context analytical inference. This endpoint is used for two distinct tasks:

1. **Trait inference** — takes a corpus of diary and interview content, returns Big Five scores, narrative signals, dominant values, and a prose summary
2. **Emotion classification** — takes a short text passage (a single response sentence), returns an emotion label and intensity score

These are differentiated by the `task` field in the request body.

This endpoint uses the same base Llama 3.1 8B model as `/infer` but with **no LoRA adapter**, **temperature 0.2**, and **vLLM guided decoding** (forced JSON output mode) to ensure structured, parseable responses.

---

### Files to produce

```
modal/
└── analyse/
    ├── handler.py
    ├── Dockerfile
    └── requirements.txt

src/lib/ai/
└── analyse.ts                          -- typed TypeScript wrapper
```

---

### Handler requirements

**`modal/analyse/handler.py`**

Follows the same RunPod/Modal serverless pattern as other handlers. Loads model from `/model-weights/llama-3.1-8b-instruct` at startup. No LoRA adapter loaded.

vLLM configuration differences from `/infer`:
- `temperature=0.2`
- `guided_decoding_backend="outlines"` with JSON schema enforcement per task type
- `max_tokens=1024` for trait inference, `max_tokens=64` for emotion classification

**Request contract:**

```json
{
  "task": "trait_inference" | "emotion_classify",
  "input": "string"
}
```

**For `trait_inference`** — `input` is the full corpus text (diary entries + interview subject turns concatenated with `\n---\n` separators). System prompt instructs the model to analyse the text as a personality psychologist and return this exact JSON schema:

```json
{
  "openness": 0.0,
  "conscientiousness": 0.0,
  "extraversion": 0.0,
  "agreeableness": 0.0,
  "neuroticism": 0.0,
  "narrative_agency": 0.0,
  "narrative_communion": 0.0,
  "narrative_redemption": 0.0,
  "dominant_values": ["string"],
  "summary_prose": "string",
  "identity_block": "string"
}
```

`identity_block` is a generated third-person-to-first-person description suitable for use as the static identity section of the persona's system prompt — e.g. *"You are someone who approaches the world with a high degree of curiosity and openness. You form deep, loyal relationships and feel things intensely..."*

**For `emotion_classify`** — `input` is a short text passage (the persona's generated response text). System prompt instructs the model to classify the emotional register. Returns:

```json
{
  "emotion_label": "warm | sad | frustrated | anxious | amused | tender | indignant | reflective",
  "intensity": 0.0
}
```

**Response contract (both tasks):**

```json
{
  "result": { ...task-specific JSON object above... }
}
```

**Error handling:** If JSON parsing of the model output fails, retry once with an explicit instruction appended to the prompt: *"Your response must be valid JSON only. No preamble, no explanation."* If it fails again, return `{ "error": "parse_failed" }`.

**`src/lib/ai/analyse.ts`**

```typescript
export type TraitInferenceResult = {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  narrative_agency: number
  narrative_communion: number
  narrative_redemption: number
  dominant_values: string[]
  summary_prose: string
  identity_block: string
}

export type EmotionClassifyResult = {
  emotion_label: string
  intensity: number
}

export async function inferTraits(corpus: string): Promise<TraitInferenceResult>
export async function classifyEmotion(text: string): Promise<EmotionClassifyResult>
```

Both functions call `POST {MODAL_ANALYSE_URL}` with the appropriate task type. Throw a typed error on non-200 response or `parse_failed` result.

**After building:**

1. Build and push the Docker image: `docker build -t YOUR_USERNAME/digital-legacy-analyse:latest ./modal/analyse && docker push`
2. Create a new Modal serverless endpoint (`digital-legacy-analyse`) using this image — same configuration as existing endpoints but with an A10G GPU (same as `/infer`; long-context inference benefits from VRAM)
3. Add `MODAL_ANALYSE_URL` to `.env.local` and Vercel environment variables

---

### Acceptance criteria

- [ ] `trait_inference` task returns valid JSON matching the schema above for a 2000-word corpus input
- [ ] `emotion_classify` task returns valid `emotion_label` and `intensity` for a single sentence input
- [ ] JSON parse failure triggers one retry with clarifying instruction
- [ ] `inferTraits()` and `classifyEmotion()` TypeScript wrappers are fully typed with no `any`
- [ ] Endpoint visible and testable in Modal console
- [ ] `tsc --noEmit` passes

---

## Task 2.5 — Trait Inference Pipeline

### What to build

A server-side pipeline that takes all diary entries and completed interview sessions for a persona, runs them through the `/analyse` endpoint's `trait_inference` task, and writes a new `persona_traits` row. For MVP this is triggered manually by the subject via a button on their capture dashboard. It runs as a Next.js API route (not a background worker) since Modal handles the heavy lifting.

Also includes a utility function that constructs the full persona system prompt from the current `persona_traits` row — this is used by the conversation pipeline in Task 2.10.

---

### Files to produce

```
app/api/personas/[slug]/analyse/
└── route.ts                            -- POST: trigger trait inference

lib/
├── supabase/
│   └── traits.ts                       -- typed DB helpers for persona_traits
└── persona-prompt.ts                   -- system prompt construction from trait profile
```

---

### Detailed requirements

**`/api/personas/[slug]/analyse/route.ts` — POST**

1. Auth + ownership check. Subject role only — family members cannot trigger this.
2. Fetch all `diary_entries` for this persona where content or transcript is non-null. Concatenate with `\n---\n` separators.
3. Fetch all `interview_sessions` for this persona where `completed_at` is non-null. Extract subject turns only from `messages` (role = 'subject'). Concatenate.
4. Combine diary and interview content into a single corpus string.
5. If corpus is fewer than 500 words: return 422 `{ error: 'insufficient_content', word_count: n, minimum: 500 }`. The subject needs more material for meaningful inference.
6. Call `inferTraits(corpus)` from `lib/ai/analyse.ts`. This may take 15–60 seconds — the HTTP response should stream or the client should poll. For MVP, use a long timeout (120s) and respond synchronously.
7. Get current `version` for this persona's traits (0 if none). Increment by 1.
8. Set `is_current = false` on all existing `persona_traits` rows for this persona.
9. Insert new `persona_traits` row with all inferred values, `is_current = true`, `computed_at = now()`.
10. Mark all processed `diary_entries` with `processed_at = now()`.
11. Return the new `persona_traits` row.

**`lib/supabase/traits.ts`**

```typescript
export type PersonaTraits = {
  id: string
  persona_id: string
  version: number
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  narrative_agency: number
  narrative_communion: number
  narrative_redemption: number
  dominant_values: string[]
  summary_prose: string
  identity_block: string
  diary_entries_analysed: number
  interview_turns_analysed: number
  computed_at: string
  is_current: boolean
}

export async function getCurrentTraits(client: SupabaseClient, persona_id: string): Promise<PersonaTraits | null>
export async function getTraitHistory(client: SupabaseClient, persona_id: string): Promise<PersonaTraits[]>
```

**`lib/persona-prompt.ts`**

```typescript
export function buildPersonaSystemPrompt(persona: Persona, traits: PersonaTraits | null, memories: Memory[]): string
```

Constructs the three-part system prompt:

**Part 1 — Identity block:**
If `traits` exists: use `traits.identity_block` (generated by `/analyse`).
If `traits` is null (no inference run yet): fall back to a minimal biographical block using only `persona.name`, `persona.birth_year`, `persona.birth_place`, `persona.locations_lived`.

**Part 2 — Memory block:**
```
Here are some things you remember that are relevant to this conversation:

- {memory.content}
...
```
Omit entirely if memories array is empty.

**Part 3 — Closing instruction:**
```
You are speaking to members of your family. Speak in first person, in your natural voice.
Keep responses personal and human. Do not refer to yourself as an AI.
```

---

### Acceptance criteria

- [ ] POST triggers trait inference and inserts new `persona_traits` row
- [ ] Returns 422 with word count if corpus is below 500 words
- [ ] Previous `is_current` row is set to false before new row is inserted
- [ ] `diary_entries.processed_at` is updated for all entries included in the corpus
- [ ] `buildPersonaSystemPrompt` returns correct prompt structure whether or not traits exist
- [ ] Falls back gracefully to biographical-only identity block if no traits available
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.6 — Personality Profile Display

### What to build

A subject-facing view at `/capture/[slug]/profile` showing a high-level, human-readable summary of their inferred personality profile. The subject never sees raw Big Five scores — they see a prose summary and a simple visual representation of dominant characteristics. The view also shows when the profile was last updated and how much content was analysed.

A *"Refresh profile"* button triggers the trait inference pipeline (Task 2.5). If insufficient content exists, an explanatory message is shown with suggestions for what to add.

---

### Files to produce

```
app/(app)/capture/[slug]/profile/
└── page.tsx                            -- profile display page

components/capture/
└── PersonalityProfile.tsx              -- profile display component
```

---

### Detailed requirements

**`app/(app)/capture/[slug]/profile/page.tsx`**

- Server component. Auth + ownership check.
- Fetch current `persona_traits` for this persona (may be null).
- Fetch entry counts: diary entries, completed interview sessions, total word count.
- Pass all to `<PersonalityProfile>`.

**`components/capture/PersonalityProfile.tsx`**

When traits exist:
- **Summary prose** — rendered as a single paragraph in slightly larger text. This is the human-readable personality summary generated by `/analyse`. Example: *"You come across as someone of restless intellectual curiosity, who forms deep bonds with a small circle of people and cares intensely about doing things the right way..."*
- **Dominant values** — shown as simple text tags (e.g. "Family", "Integrity", "Creativity")
- **Profile metadata** — *"Based on X diary entries and Y interview sessions (Z words). Last updated [date]."*
- **Refresh profile** button — POSTs to `/api/personas/[slug]/analyse`. Shows loading state (this takes up to 60 seconds). On completion, refreshes the page data.
- Do not show raw Big Five scores or numerical values. The subject should feel this is a reflection of who they are, not a psychometric test result.

When traits do not exist (no inference run yet):
- Explanatory message: *"Your personality profile hasn't been generated yet. Add diary entries or complete an interview session to get started."*
- Content progress indicators: diary entry count, interview sessions completed, total word count vs 500-word minimum.
- *"Generate profile"* button — disabled if below 500 words, active otherwise.

---

### Acceptance criteria

- [ ] Profile page shows summary prose and dominant values when traits exist
- [ ] Raw numerical scores are not displayed anywhere on the page
- [ ] Refresh/generate button triggers the inference pipeline and reflects updated results
- [ ] Insufficient content state shows progress toward the 500-word minimum
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.7 — Memory Browser

### What to build

A searchable, paginated view at `/capture/[slug]/memories` showing all memories the model can retrieve — drawn from diary entries, interview responses, and (later) media captions. The subject can mark memories private (excluded from family conversation retrieval) and delete them.

---

### Files to produce

```
app/(app)/capture/[slug]/memories/
└── page.tsx                            -- memory browser

app/api/personas/[slug]/memories/
├── route.ts                            -- GET: list memories
└── [id]/
    └── route.ts                        -- PATCH: toggle private; DELETE: remove

components/capture/
├── MemoryList.tsx
├── MemoryCard.tsx
└── MemorySearch.tsx
```

---

### Detailed requirements

**`/api/personas/[slug]/memories` — GET**

Query params: `q` (ilike search on `content`), `page`, `per_page` (max 50), `source` filter (`diary | interview | media_caption | voice_memo`).

Return: `{ memories: Memory[], total: number, page: number, per_page: number }`.

**`/api/personas/[slug]/memories/[id]` — PATCH / DELETE**

- PATCH: `{ is_private: boolean }`. Return updated memory.
- DELETE: hard delete for MVP. Confirm ownership. Return 204.

**`components/capture/MemoryCard.tsx`**

Shows: content (truncated to 3 lines, expandable), source badge, `created_at` (relative), private toggle (eye icon, optimistic update), delete button with inline confirm (*"Delete this memory?"* + Confirm / Cancel inline, no modal).

**`components/capture/MemorySearch.tsx`**

Debounced (300ms), updates `?q=` URL param. Clear button when active.

**`app/(app)/capture/[slug]/memories/page.tsx`**

Total memory count. Source filter tabs (All / Diary / Interviews / Media). `<MemorySearch>`. `<MemoryList>` with pagination.

---

### Acceptance criteria

- [ ] Memories from diary and interview sources appear in the browser
- [ ] `is_private` toggle updates correctly and reflects immediately
- [ ] Delete removes the card without full page reload
- [ ] Source filter tabs correctly filter by `source` field
- [ ] ilike search filters by content
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.8 — Photo Upload and Auto-captioning

### What to build

A subject can upload photos at `/capture/[slug]/media`. Photos upload directly to B2 via pre-signed URL — no file bytes pass through the Next.js server. After upload, a `media_assets` row is created. Caption status is `pending`. The subject can write a manual caption immediately. Auto-captioning (vision model) is deferred — a `TODO` marks the insertion point.

---

### Files to produce

```
app/(app)/capture/[slug]/media/
└── page.tsx                            -- photo upload and gallery page

app/api/
├── upload/media/
│   └── route.ts                        -- POST: pre-signed B2 upload URL
└── personas/[slug]/media/
    ├── route.ts                        -- POST: create media_assets row; GET: list with URLs
    └── [id]/
        └── route.ts                    -- PATCH: update caption

components/capture/
├── PhotoUploader.tsx                   -- drag-and-drop, direct-to-B2, progress per file
└── MediaGrid.tsx                       -- photo grid with inline caption editing
```

---

### Detailed requirements

**Upload flow:**
1. Client selects files via `<PhotoUploader>`.
2. For each file: POST to `/api/upload/media` → `{ upload_url, b2_key }`.
3. Client PUTs bytes directly to B2. Progress tracked via `XMLHttpRequest` upload events.
4. Client POSTs to `/api/personas/[slug]/media` → creates `media_assets` row.
5. New asset appears in `<MediaGrid>`.

**B2 key format:** `media/{persona_id}/{uuid}.{ext}`

**`/api/personas/[slug]/media` — GET**

Returns assets ordered `created_at DESC`. Generates a 15-minute pre-signed GET URL for each asset as `url` field.

**`components/capture/PhotoUploader.tsx`**

Validates: jpeg, png, webp, heic only; max 20MB per file. Multiple concurrent uploads. Per-file progress bar.

**`components/capture/MediaGrid.tsx`**

Responsive grid. Each cell: photo thumbnail + caption below (or *"Add a caption"* if null). Click caption to open inline edit — on blur/Enter, PATCH `/api/personas/[slug]/media/[id]` with `{ caption, caption_status: 'manual' }`.

When a manual caption is saved, fire-and-forget: embed the caption text and insert into `memories` with `source = 'media_caption'` and `media_asset_id` set.

```typescript
// TODO: auto-captioning via vision model
// When vision endpoint is available, call it here instead of prompting for manual caption.
// Set caption_status = 'auto' on the resulting row.
```

---

### Acceptance criteria

- [ ] Photos upload directly to B2; no file bytes pass through Next.js
- [ ] `media_assets` row created with `caption_status = 'pending'`
- [ ] Manual caption saves to `caption` column and creates a memory with `source = 'media_caption'`
- [ ] Pre-signed GET URLs generated server-side for display
- [ ] Per-file upload progress shown
- [ ] File type and size validation runs before upload begins
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.9 — Dedicated Voice Sample Recording

### What to build

A dedicated recording space at `/capture/[slug]/voice` for capturing clean voice samples. This supplements the voice captured in diary and interview sessions. Emotional tagging is required for every recording — each clip is stored in both `voice_samples` (for overall voice reference tracking) and `emotional_voice_samples` (for the emotional voice library). The page shows progress toward the 30-minute target and the emotional coverage grid.

---

### Files to produce

```
app/(app)/capture/[slug]/voice/
└── page.tsx                            -- voice recording page

app/api/
├── upload/voice-sample/
│   └── route.ts                        -- POST: pre-signed B2 URL for audio upload
└── personas/[slug]/voice-samples/
    └── route.ts                        -- POST: create rows + trigger transcription; GET: list + totals

components/capture/
├── VoiceRecorder.tsx                   -- record / stop / playback controls with emotion tag
├── VoiceReadinessIndicator.tsx         -- progress toward 30-minute target
└── EmotionalCoverageGrid.tsx           -- reusable grid (shared with diary room page)
```

---

### Detailed requirements

**Recording:**

`MediaRecorder` with `audio/webm;codecs=opus`. One recording per session. Emotion tag **required** before recording begins — same 8-state `<EmotionSelector>` as the diary room. B2 key format: `voice-samples/{persona_id}/{uuid}.webm`.

**`/api/personas/[slug]/voice-samples` — POST**

1. Auth + ownership check.
2. Accept: `{ b2_key, duration_seconds, emotion_label }`.
3. Insert `voice_samples` row.
4. Insert `emotional_voice_samples` row with the same B2 key and emotion label.
5. Fire-and-forget: call Modal `/stt` with audio fetched from B2, store transcript in `voice_samples.transcript`. Non-blocking.
6. Return 201 with the created `voice_samples` row.

**`/api/personas/[slug]/voice-samples` — GET**

Return `{ samples: VoiceSample[], total_duration_seconds: number, emotional_coverage: { [emotion_label]: number } }` where `emotional_coverage` maps each label to total duration of samples carrying that label.

**`components/capture/EmotionalCoverageGrid.tsx`**

Reusable component (also used on the diary page). Accepts `coverage: { [label]: count_or_duration }`. Renders the 8 emotion cells — well-represented states shown fully coloured, sparse states shown muted. Tooltip on hover: *"X recordings"* or *"X minutes"* depending on the metric passed.

**`components/capture/VoiceRecorder.tsx`**

- `<EmotionSelector>` blocks recording until emotion is chosen.
- Record / stop / playback controls. Live timer.
- Upload button triggers B2 upload and POST to API.
- Shows success state with duration contributed.

**`components/capture/VoiceReadinessIndicator.tsx`**

Progress bar toward 1800 seconds (30 minutes). States: below 600s (*"Keep going — more voice improves quality"*), 600–1800s (*"Good progress — aim for 30 minutes total"*), above 1800s (*"✓ Voice reference ready"*).

---

### Acceptance criteria

- [ ] Recording requires emotion selection before starting
- [ ] Audio uploads directly to B2 via pre-signed URL
- [ ] Both `voice_samples` and `emotional_voice_samples` rows are created
- [ ] Background transcription stores transcript in `voice_samples.transcript`
- [ ] Emotional coverage grid reflects accumulated samples
- [ ] Readiness indicator updates correctly with total duration
- [ ] `EmotionalCoverageGrid` is reusable (diary room page imports it in a later cleanup pass)
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.10 — Text Conversation (RAG)

### What to build

The core family-facing conversation interface at `/talk/[slug]`. Implements the full RAG + inference pipeline. The persona's identity block comes from the inferred `persona_traits` profile (not a self-authored prompt). Conversation history is maintained within a session. Graceful degradation if Modal `/infer` is unavailable.

---

### Files to produce

```
app/(app)/talk/[slug]/
└── page.tsx                            -- conversation page

app/api/personas/[slug]/
└── chat/
    └── route.ts                        -- POST: full RAG + infer pipeline

components/conversation/
├── ChatWindow.tsx                      -- message list, auto-scroll, typing indicator
├── ChatMessage.tsx                     -- individual message bubble
└── ChatInput.tsx                       -- textarea input, send on Enter

lib/
└── persona-prompt.ts                   -- already built in Task 2.5; no changes needed
```

---

### Detailed requirements

**`/api/personas/[slug]/chat` — POST**

Request:
```typescript
{
  message: string
  conversation_id: string | 'new'
  mode: 'text' | 'voice'           // voice mode triggers TTS — handled in Task 2.11
}
```

Pipeline:
1. Validate session. Confirm user has access to this persona via `persona_access` table (or is the owner).
2. If `conversation_id === 'new'`: insert `conversations` row.
3. Embed user message via `lib/ai/embed.ts`.
4. Retrieve top-8 memories from pgvector via `lib/rag/retrieve.ts` — cosine similarity, `is_private = false` only.
5. Fetch `media_asset_id` rows for any retrieved memories that have them.
6. Fetch current `persona_traits` for this persona.
7. Build system prompt via `buildPersonaSystemPrompt(persona, traits, memories)` from `lib/persona-prompt.ts`.
8. Fetch message history for this `conversation_id` from `messages` table.
9. Call Modal `/infer` with system prompt + history + new user message.
10. Store user message and assistant response in `messages` (`retrieved_memory_ids` populated from step 4 results).
11. Return:
    ```typescript
    {
      message: string
      conversation_id: string
      media_assets?: { id: string; url: string; caption: string }[]
    }
    ```
    (No `audio_url` — added in Task 2.11.)

**Graceful degradation:** If `/infer` fails, return 503 `{ error: 'inference_unavailable' }`. UI shows: *"This persona is unavailable right now — please try again in a moment."*

**`app/(app)/talk/[slug]/page.tsx`**

Server component. Validate session and persona access. Create or resume `conversations` row on load. Pass `conversation_id` and persona name to client components.

**`components/conversation/ChatWindow.tsx`**

Scrollable list, newest at bottom, auto-scrolls on new message. Typing indicator (three-dot animation) while POST is in flight. Empty state: *"Say hello."*

**`components/conversation/ChatMessage.tsx`**

User messages right-aligned. Persona messages left-aligned with persona name as label above. Media assets (if any) rendered below the text as thumbnails — click to expand.

**`components/conversation/ChatInput.tsx`**

Auto-resizing textarea (max 4 rows). Send on Enter / Shift+Enter for newline. Send button. Disabled while response is in flight.

---

### Acceptance criteria

- [ ] Messages return persona responses grounded in retrieved memories
- [ ] `is_private = true` memories are excluded from retrieval
- [ ] System prompt uses `traits.identity_block` when traits exist, biographical fallback when not
- [ ] `conversation_id` persists across turns in the same session
- [ ] User and assistant messages stored in `messages` with `retrieved_memory_ids`
- [ ] Inference failure returns 503 and UI shows the unavailability message
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.11 — Voice Conversation with Emotional Synthesis

### What to build

Extend the conversation interface with a voice mode. User speaks → Whisper transcribes → same RAG + infer pipeline as Task 2.10 → emotional synthesis using Option B parallel execution → audio plays in browser.

Option B execution: when the persona response text is available, simultaneously fire:
- Modal `/tts` with the **neutral** voice reference (immediate start)
- Modal `/analyse` with `task: 'emotion_classify'` on the response text

If `/analyse` resolves before `/tts` synthesis completes, cancel the neutral TTS call and restart with the matched emotional reference clip from `emotional_voice_samples`. If `/analyse` does not resolve first, the neutral TTS proceeds uninterrupted.

TTS audio is cached to B2 and the B2 key stored in `messages.audio_b2_key`.

---

### Files to produce

```
app/api/personas/[slug]/
├── chat/
│   └── route.ts                        -- extend: voice mode, emotional TTS synthesis
└── transcribe/
    └── route.ts                        -- POST: audio → STT transcript (thin pass-through)

components/conversation/
├── VoiceModeToggle.tsx                 -- microphone / keyboard toggle
└── AudioPlayer.tsx                     -- plays TTS audio, handles autoplay fallback
```

---

### Detailed requirements

**Extend `/api/personas/[slug]/chat` — voice mode**

When `mode === 'voice'`:

1. After step 9 (infer response text), execute Option B:

```typescript
// Fetch neutral reference and best emotional clip selector
const neutralKey = persona.voice_sample_key
const getEmotionalKey = async (responseText: string): Promise<string | null> => {
  const result = await classifyEmotion(responseText)   // lib/ai/analyse.ts
  // Query emotional_voice_samples for best clip matching result.emotion_label
  // Order by quality_score DESC, return b2_key or null if none exists
}

// Fire both simultaneously
const [ttsResultNeutral, emotionKey] = await Promise.allSettled([
  synthesisWithNeutral(responseText, neutralKey),   // starts TTS immediately
  getEmotionalKey(responseText)                     // classify + DB lookup
])

// If emotion key resolved and TTS not yet done: cancel neutral, re-synthesise with emotional key
// Implementation: use AbortController on the neutral TTS fetch; if classify resolves first and
// emotional key exists, abort and re-call /tts with emotion_b2_key
```

2. Upload resulting WAV to B2: `tts-cache/{message_id}.wav`. Generate 15-min pre-signed GET URL.
3. Store B2 key in `messages.audio_b2_key`.
4. Return `audio_url` in response alongside `message` and `conversation_id`.

**Graceful degradation:** If TTS fails entirely, return text response with `{ tts_failed: true }`. UI shows soft warning: *"Voice unavailable — showing text response."*
If `/analyse` (emotion classify) fails, proceed with neutral TTS — do not degrade the whole voice response.

**`/api/personas/[slug]/transcribe` — POST**

Thin pass-through. Accept `{ audio_base64: string }`. Call Modal `/stt`. Return `{ transcript: string }`. No DB writes.

**`components/conversation/VoiceModeToggle.tsx`**

Toggle button: microphone / keyboard icon. In voice mode:
1. Press and hold (mobile) or click to start / click to stop (desktop) to record.
2. On stop: POST audio to `/transcribe` → get transcript.
3. Insert transcript into chat input and auto-submit to `/chat` with `mode: 'voice'`.
4. When response includes `audio_url`: pass to `<AudioPlayer>` for playback.

**`components/conversation/AudioPlayer.tsx`**

`<audio>` element. Auto-plays on `src` set. Waveform placeholder (simple animated SVG) while loading. If autoplay blocked: show a play button. Falls back silently — never blocks the text response from displaying.

---

### Acceptance criteria

- [ ] Voice recording transcribes correctly and submits as user message
- [ ] TTS audio is synthesised and plays automatically in the browser
- [ ] Emotional reference clip is used when `/analyse` resolves before TTS completes (verify by checking `emotional_voice_samples` is populated and the logic branches correctly)
- [ ] Neutral TTS proceeds uninterrupted when `/analyse` does not resolve first
- [ ] TTS audio is cached in B2 with key stored in `messages.audio_b2_key`
- [ ] TTS failure returns text response with `tts_failed: true` and soft UI warning
- [ ] `tsc --noEmit` passes, no `any` types

---

## Task 2.12 — Media Surfacing in Conversation

### What to build

When RAG retrieval returns memories with an associated `media_asset_id`, the photo is surfaced inline in the conversation alongside the persona's response. Extends the chat pipeline and conversation UI — no new API routes required.

---

### Files to produce

```
app/api/personas/[slug]/chat/
└── route.ts                            -- extend: generate pre-signed URLs for media assets

components/conversation/
├── ChatMessage.tsx                     -- extend: render MediaAttachment
└── MediaAttachment.tsx                 -- photo + caption + lightbox
```

---

### Detailed requirements

**Extend `/api/personas/[slug]/chat`**

After memory retrieval (step 5): for any memory with a non-null `media_asset_id`, fetch the `media_assets` row. Skip assets with `caption = null`. Generate a 15-minute pre-signed GET URL for each. Include in response:

```typescript
media_assets?: {
  id: string
  url: string       // pre-signed GET URL
  caption: string
}[]
```

**`components/conversation/MediaAttachment.tsx`**

Photo with caption beneath. Max display width 320px. Click opens a `<dialog>` lightbox with full-size image. Multiple assets in one response: horizontal scroll row.

---

### Acceptance criteria

- [ ] Photos with captions surface alongside persona responses when retrieved memories reference them
- [ ] `caption = null` assets are excluded
- [ ] Pre-signed URLs generated server-side — no B2 credentials in client
- [ ] Lightbox opens on click
- [ ] Multiple photos render in horizontal scroll row
- [ ] `tsc --noEmit` passes, no `any` types

---

*Last updated: June 2026*
