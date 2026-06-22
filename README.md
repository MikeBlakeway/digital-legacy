# Digital Legacy

A self-hosted web application for preserving a person's personality, voice, memories, and values — and making them reachable by future generations through natural conversation with an AI persona.

A *persona* is built from interviews, voice memos, diary entries, and photos. The system analyses that material to extract a personality model, embeds the memories into a vector store, and uses them to ground a fine-tuned LLM that speaks in that person's voice. Family members can then have text or voice conversations with the persona, with the system retrieving the most relevant memories on each turn and synthesising responses that sound — and, gradually, feel — like the person they knew.

---

## How it works

### The data model

Everything is organised around a `persona` — a named representation of a real person. Each persona owns:

- **Memories** — text fragments from any source (interview answer, voice memo transcript, diary entry, photo caption), each stored with a 768-dimensional embedding and a privacy flag
- **Media assets** — photos and videos in Backblaze B2 storage, with AI-generated captions that feed back into the memory store
- **Voice samples** — short WAV recordings used to clone the persona's voice for speech synthesis
- **Conversations** — multi-turn conversation sessions; each message records which memories were retrieved to inform that response

Persona owners can grant other users (family members) access to their persona via the `persona_access` table. Row-level security is enforced on every table — no unauthenticated access, no cross-persona data leakage.

### Memory ingestion

New memories enter from five sources: guided interview answers, transcribed voice memos, free text, AI-generated media captions, and diary entries. Each text fragment is passed to the `embed` endpoint, which runs `nomic-embed-text-v1.5` to produce a 768-dim embedding, stored with an HNSW index in Supabase pgvector.

```sql
-- Fast cosine similarity retrieval at query time
create index memories_embedding_hnsw_idx
  on public.memories using hnsw (embedding vector_cosine_ops);
```

At conversation time, the user's message is embedded and matched against the persona's memory store using `match_persona_memories` — a SQL function that runs a cosine similarity search, respects privacy flags, and returns ranked results with similarity scores. The IDs of retrieved memories are stored on each message for provenance tracking.

### Personality analysis

When a persona has accumulated enough material, the `analyse` endpoint processes their interview and diary corpus and returns two things:

**Trait inference** — a structured personality model:

| Dimension | Description |
|---|---|
| Big Five (OCEAN) | Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism — each 0–1 |
| Narrative agency | How much the person positions themselves as an active agent in their own story |
| Narrative communion | How much the person orients their story around relationships and belonging |
| Narrative redemption | Whether the person frames difficult experiences as leading to growth |
| Dominant values | Free-form array of the values that recur most strongly in their language |
| Identity block | A ready-to-use first-person description for the persona's system prompt |

**Emotion classification** — on each generated response, the system can classify its emotional register across eight labels (warm, sad, frustrated, anxious, amused, tender, indignant, reflective) with a 0–1 intensity score. This enables downstream features like response tone monitoring or adaptive UI.

Both tasks use structured output via vLLM's `StructuredOutputsParams` with Outlines-constrained decoding, with a retry pass if JSON parsing fails.

### The interview system

The primary memory capture mechanism is a guided interview. Five themed tracks are available, each with its own interviewer persona and opening question:

| Theme | Focus |
|---|---|
| What I Believe | Deeply held principles and convictions |
| The People Who Shaped Me | Significant relationships |
| What I've Carried | Fears, regrets, the weight of certain things |
| Stories From My Life | Narrative-rich episodes from their history |
| What Made Me | Childhood, upbringing, formative experiences |

The interview agent is not a generic chatbot. It follows explicit constraints: one question per turn, follow emotionally resonant threads before moving on, avoid excessive affirmation, prefer open-ended and narrative-focused questions. The system prompt is constructed differently for an opening question vs a follow-up, and the full conversation history is passed on every turn.

### Persona system prompt construction

When a family member starts a conversation, the system assembles the persona's system prompt from three parts:

1. **Identity block** — either the auto-generated block from trait inference, or constructed from the persona's structured fields (name, birth year, birthplace, locations lived)
2. **Relevant memories** — the top-k memories retrieved by vector similarity for the current message, formatted as a bullet list of "things you remember that are relevant to this conversation"
3. **Closing instruction** — `"You are speaking to members of your family. Speak in first person, in your natural voice. Do not refer to yourself as an AI."`

### Voice: cloning and synthesis

The TTS endpoint uses XTTS v2 for zero-shot voice cloning. Given a voice sample WAV (fetched from Backblaze B2 by its storage key), it synthesises speech in that person's voice. The output is base64-encoded WAV with duration metadata. Voice samples for cloning are uploaded separately and stored with transcripts.

The STT endpoint runs `faster-whisper-large-v3` on CUDA with float16 compute for transcribing voice memos and interview responses — accepting base64-encoded audio and returning transcript text with duration.

### Per-persona LoRA adapters

The inference endpoint supports per-persona LoRA adapters mounted on top of Llama 3.1 8B Instruct. When a `persona_slug` is provided, the endpoint checks for a fine-tuned adapter at `/model-weights/adapters/{slug}/current` and loads it as a `LoRARequest` into vLLM if present. This allows the model to be fine-tuned on a persona's writing style and voice as enough material accumulates, without needing to run a separate model per persona.

---

## AI endpoints (Modal)

Five serverless endpoints are deployed via Modal, each in an isolated container image with its own dependency set and GPU configuration:

| Endpoint | Model | GPU | Purpose |
|---|---|---|---|
| `embed` | nomic-embed-text-v1.5 | T4 | Embed memory text into 768-dim vectors |
| `stt` | faster-whisper large-v3 | T4 | Transcribe audio to text |
| `tts` | XTTS v2 | A10G | Synthesise speech with voice cloning |
| `infer` | Llama 3.1 8B Instruct + LoRA | A10G | Generate persona responses |
| `analyse` | Llama 3.1 8B Instruct | A10G | Trait inference and emotion classification |

Model weights are downloaded once into a named Modal volume (`digital-legacy-weights`) and shared across all endpoints. The download script handles gated models (Llama 3.1 requires a Hugging Face token), skips already-downloaded models, and commits the volume after each download.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 |
| Auth & database | Supabase (Auth, Postgres, pgvector, RLS) |
| Vector search | pgvector with HNSW index (cosine similarity, 768 dims) |
| Media storage | Backblaze B2 via AWS SDK (S3-compatible) |
| AI inference | Modal serverless (Python 3.11, vLLM, sentence-transformers) |
| LLM | Llama 3.1 8B Instruct + per-persona LoRA adapters via vLLM |
| Voice synthesis | XTTS v2 (zero-shot voice cloning) |
| Transcription | faster-whisper large-v3 |
| Embeddings | nomic-embed-text-v1.5 |
| E2E tests | Playwright |
| Deployment | Vercel (web app) + Modal (AI endpoints) |

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with pgvector enabled
- A [Modal](https://modal.com) account
- A [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) bucket
- A [Hugging Face](https://huggingface.co) account with access to `meta-llama/Llama-3.1-8B-Instruct`

### 1. Clone and install

```bash
git clone https://github.com/MikeBlakeway/digital-legacy.git
cd digital-legacy
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the required values — Supabase project URL and keys, B2 bucket credentials, and the Modal endpoint URLs (generated in step 4).

### 3. Run Supabase migrations

```bash
supabase db push
```

This applies all migrations: the core schema (personas, memories, media assets, voice samples, conversations, messages, persona access), RLS policies, HNSW index, and the `match_persona_memories` vector search function.

### 4. Deploy Modal endpoints

```bash
# Deploy all five AI endpoints
modal deploy modal/app.py
```

Modal prints the URL for each endpoint after deployment. Copy these into your `.env.local` as `MODAL_EMBED_URL`, `MODAL_STT_URL`, `MODAL_TTS_URL`, `MODAL_INFER_URL`, and `MODAL_ANALYSE_URL`.

### 5. Download model weights (one-time, 60–90 minutes)

```bash
# Bootstraps all four models into the Modal volume
modal run modal/app.py::download_models
```

Downloads Llama 3.1 8B Instruct (gated — requires `HF_TOKEN`), XTTS v2, faster-whisper large-v3, and nomic-embed-text-v1.5. Already-downloaded models are skipped on subsequent runs.

### 6. Validate endpoints

```bash
npm run validate:modal
```

Runs smoke tests against all five deployed endpoints to confirm they are reachable and returning expected response shapes.

### 7. Start the app

```bash
npm run dev
```

---

## Testing

```bash
# Run Playwright E2E tests (requires a running dev server and test account)
npm run test:e2e

# Interactive Playwright UI mode
npm run test:e2e:ui
```

E2E test credentials are configured via the `PLAYWRIGHT_*` environment variables in `.env.local`.
