# Digital Legacy — Architecture & Requirements

> **Working title:** Digital Legacy  
> **Status:** Pre-development — architecture finalised, implementation pending  
> **Author:** Mike Blakeway  
> **Purpose:** Primary reference document for AI coding agents and developer context. All implementation decisions should be traceable to this document.

---

## 1. Project Overview

Digital Legacy is a private, self-hosted web application that captures a person's personality, voice, memories, and values, and makes them accessible to future generations through natural conversation with an AI persona trained on that person's data.

Each subject (a living person) builds their persona over time through structured interviews, voice recordings, uploaded media, and free-form memory entries. After the subject's death, authorised family members can hold voice and text conversations with an AI representation of that person — asking questions, hearing stories, and viewing photos and videos surfaced contextually by the persona.

The system is designed for long-term durability, minimal ongoing cost, and complete data sovereignty. No third-party AI service processes personal data. All inference runs on private GPU infrastructure.

### 1.1 Primary Users

| Role | Description |
|---|---|
| **Subject** | The living person being recorded. Creates and maintains their own persona. Has full read/write access to their data. |
| **Family member** | Authorised user who converses with a persona. Read-only access. May be the subject themselves during their lifetime. |
| **Admin** | System owner (Mike). Manages user accounts, personas, and infrastructure. Not a day-to-day role. |

### 1.2 Core Principles

- **Privacy above all** — no personal data, voice, or memories leave the controlled infrastructure stack
- **Local-first logic** — business logic and AI inference run on owned/rented private compute, not third-party AI APIs
- **Longevity by design** — architecture must remain functional and maintainable over decades; avoid deep lock-in to any single vendor
- **Graceful degradation** — if a RunPod endpoint is cold or unavailable, text fallback must always work
- **Emotional considered design** — the conversation UI is used by grieving family members; UX decisions must reflect this

---

## 2. Functional Requirements

### 2.1 Persona Management

- The system supports multiple independent personas (e.g. Mike, Deepisha)
- Each persona is isolated: separate memory corpus, voice model, LoRA adapter, and conversation history
- A subject can view, edit, and delete any of their own memories
- A subject can review what the model "knows" about them via a memory browser
- Personas are not publicly discoverable; access is invitation-only

### 2.2 Capture Mode (Subject-facing)

Capture mode is the data ingestion interface used by living subjects.

**Voice recording**
- Subject can record voice samples directly in the browser (minimum target: 30 minutes of clean audio)
- Recordings are segmented, labelled, and uploaded to B2
- A voice readiness indicator shows progress toward a usable clone

**Structured interviews**
- The app presents guided question prompts (e.g. "What do you believe that most people around you don't?")
- Subject responds by text or voice (voice is transcribed automatically)
- Responses are stored as memories with the originating question as metadata
- Interview sets are grouped by theme (values, fears, life stories, relationships, advice, etc.)

**Free-form memory entry**
- Subject can add a memory at any time as text, voice memo, or both
- Optional metadata: approximate date, people involved, location, mood tags
- Optional media attachment: photos or video clips associated with the memory

**Media upload**
- Photos and videos can be uploaded in bulk or individually
- Each asset is stored in B2 and automatically captioned using a vision model
- Captions are stored as memory embeddings in pgvector, making media searchable
- Subject can edit or override auto-generated captions

**Memory browser**
- A searchable, filterable view of all captured memories
- Shows what the model "knows" — essentially the training corpus in human-readable form
- Subject can mark memories as private (excluded from family conversations)
- Subject can delete memories

### 2.3 Conversation Mode (Family-facing)

Conversation mode is the interaction interface for family members.

**Text conversation**
- Standard chat interface
- The persona responds in the subject's voice and style, drawing on retrieved memories
- Relevant media (photos, video) is surfaced inline when contextually appropriate

**Voice conversation**
- User speaks; audio is transcribed by Whisper (STT)
- Persona response is synthesised using the subject's cloned voice (TTS)
- Audio plays back in the browser
- Full voice conversation loop: speak → transcribe → LLM → synthesise → play

**Memory surfacing**
- When a memory is retrieved during a conversation, the associated media (if any) is shown alongside the response
- User can ask to see photos from a specific period, place, or event

**Conversation history**
- Each family member's conversation history is stored per-persona
- History is used for within-session context only (not injected into subsequent sessions by default)
- User can browse past conversations

### 2.4 Authentication & Access Control

- Supabase Auth handles all authentication
- Two primary roles: `subject` and `family`
- A subject can also hold a `family` role for other personas (e.g. Mike can converse with Deepisha's persona)
- Family members must be explicitly invited by an admin; no self-registration
- All routes are protected; unauthenticated requests redirect to login
- Persona access is scoped: a family member can only access the personas they have been granted access to

---

## 3. Non-Functional Requirements

### 3.1 Privacy & Data Sovereignty

- All AI inference (LLM, TTS, STT, embeddings) runs on RunPod private GPU instances
- No OpenAI, Anthropic, Google, or other third-party AI APIs are called with personal data
- Media is stored on Backblaze B2 under a private bucket; no public URLs are generated
- All B2 access uses pre-signed URLs with a 15-minute expiry
- Supabase is used for structured data only; row-level security enforces per-user data isolation

### 3.2 Performance Targets (MVP)

| Operation | Target latency |
|---|---|
| Text response (first token) | < 3 seconds (warm RunPod worker) |
| Full text response | < 10 seconds |
| STT transcription (30s audio) | < 5 seconds |
| TTS synthesis (150-word response) | < 8 seconds |
| Memory retrieval (pgvector search) | < 200ms |
| Media upload (per file) | Direct-to-B2, no server bottleneck |

Cold start latency (RunPod serverless worker spin-up) is acknowledged and acceptable for MVP. Workers should be configured to maintain at least one warm instance during expected usage hours.

### 3.3 Reliability

- RunPod endpoint failures must degrade gracefully: text conversation falls back to response without voice
- The app must display a clear status indicator when AI services are unavailable
- Supabase free tier provides adequate uptime for a low-traffic family application
- B2 provides 99.9% availability SLA

### 3.4 Longevity

- All AI model weights and LoRA adapters are stored in B2 as the source of truth
- No reliance on any model vendor's hosted inference; all models are open-weights
- The application must be re-deployable from scratch using stored weights and a fresh RunPod account
- Dependencies are pinned and documented

---

## 4. Technology Stack

### 4.1 Frontend

| Component | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Established stack; SSR for auth-protected routes; API routes for backend logic |
| Language | TypeScript | Type safety for complex data models |
| Styling | Tailwind CSS | Consistent with existing projects |
| Hosting | Vercel | Zero-config deployment; free tier sufficient |
| Auth UI | Supabase Auth UI or custom | Thin wrapper over Supabase Auth |

### 4.2 Backend / API

All backend logic lives in Next.js API routes. There is no separate backend service for MVP.

API routes are responsible for:
- Authenticating requests (Supabase session validation)
- Orchestrating calls to RunPod endpoints
- Generating pre-signed B2 URLs for media upload/download
- Writing to and reading from Supabase

### 4.3 Database & Auth

| Component | Technology | Rationale |
|---|---|---|
| Database | Supabase Postgres | Managed Postgres; familiar; RLS for data isolation |
| Vector store | Supabase pgvector | Eliminates separate vector DB; memory retrieval co-located with structured data |
| Auth | Supabase Auth | Role-based access; integrates with RLS policies |

### 4.4 AI Inference (RunPod Serverless)

All AI inference runs as RunPod serverless endpoints. Each endpoint is a Docker container with a Python handler using the RunPod SDK.

| Endpoint | Model | Hardware | Notes |
|---|---|---|---|
| `/infer` | Llama 3.1 8B + LoRA adapter | RTX 4090 | vLLM serving; persona adapter loaded at startup |
| `/tts` | XTTS v2 | RTX 3090 / 4090 | Cloned voice; speaker reference loaded from B2 |
| `/stt` | faster-whisper (large-v3) | RTX 3090 | Audio transcription |
| `/embed` | nomic-embed-text | RTX 3090 | Text → vector for pgvector ingestion |

**Model weights** are stored on a **RunPod Network Volume** for fast loading. B2 is the backup/source-of-truth for weights; the network volume is operational working storage.

**Fine-tuning** is a separate on-demand pod job (not serverless), triggered manually. Uses Unsloth + QLoRA on an RTX 4090 or A100 pod. Output adapter is saved to B2 and copied to the network volume.

### 4.5 Storage

| Component | Technology | Rationale |
|---|---|---|
| Media (photos, video) | Backblaze B2 | S3-compatible; ~$6/TB/month; free egress via Cloudflare |
| Voice samples | Backblaze B2 | Stored under `/voice-samples/{persona_id}/` |
| TTS audio cache | Backblaze B2 | Rendered audio responses cached to avoid re-synthesis |
| Model weights (archive) | Backblaze B2 | Source of truth for all model files |
| Model weights (operational) | RunPod Network Volume | Fast-access working storage for active endpoints |

B2 is accessed via the S3-compatible API using `@aws-sdk/client-s3` pointed at the B2 endpoint. No Backblaze-specific SDK required.

---

## 5. Infrastructure Topology

```
Browser
  └── Vercel (Next.js frontend + API routes)
        ├── Supabase
        │     ├── Auth (sessions, roles)
        │     ├── Postgres (personas, memories, metadata)
        │     └── pgvector (memory embeddings)
        ├── Backblaze B2 (media, voice, weights archive)
        │     └── Pre-signed URLs only — client uploads/downloads directly
        └── RunPod Serverless
              ├── /infer  (LLM + LoRA)
              ├── /tts    (XTTS v2)
              ├── /stt    (Whisper)
              └── /embed  (nomic-embed-text)
                    └── RunPod Network Volume (operational model weights)
```

---

## 6. Data Architecture

### 6.1 Core Entities

**`personas`**
Represents a subject. Each persona has its own isolated memory corpus, voice model, and LoRA adapter.

```
id               uuid PK
name             text
slug             text unique         -- used in routes e.g. /persona/mike
owner_user_id    uuid FK → auth.users
lora_adapter_key text                -- B2 path to current adapter
voice_sample_key text                -- B2 path to voice reference file
created_at       timestamptz
updated_at       timestamptz
```

**`memories`**
Atomic units of knowledge about a persona. Everything the model can retrieve goes through this table.

```
id               uuid PK
persona_id       uuid FK → personas
content          text                -- the raw memory text
source           enum                -- interview | voice_memo | free_text | media_caption
question_prompt  text nullable       -- originating interview question if applicable
embedding        vector(768)         -- nomic-embed-text output
media_asset_id   uuid nullable FK → media_assets
is_private       boolean default false
created_at       timestamptz
```

**`media_assets`**
Photos and videos uploaded by a subject.

```
id               uuid PK
persona_id       uuid FK → personas
b2_key           text                -- full B2 object key
media_type       enum                -- photo | video
caption          text nullable       -- auto-generated or manual
caption_status   enum                -- pending | complete | manual
taken_at         timestamptz nullable
uploaded_by      uuid FK → auth.users
created_at       timestamptz
```

**`voice_samples`**
Individual voice recording segments uploaded during capture.

```
id               uuid PK
persona_id       uuid FK → personas
b2_key           text
duration_seconds integer
transcript       text nullable       -- Whisper transcript for quality checking
created_at       timestamptz
```

**`conversations`**
Stores conversation sessions between a family member and a persona.

```
id               uuid PK
persona_id       uuid FK → personas
user_id          uuid FK → auth.users
created_at       timestamptz
updated_at       timestamptz
```

**`messages`**
Individual turns within a conversation.

```
id               uuid PK
conversation_id  uuid FK → conversations
role             enum                -- user | assistant
content          text
audio_b2_key     text nullable       -- cached TTS audio for this response
retrieved_memory_ids uuid[]          -- memories used in this response
created_at       timestamptz
```

**`persona_access`**
Controls which family members can access which personas.

```
persona_id       uuid FK → personas
user_id          uuid FK → auth.users
granted_by       uuid FK → auth.users
granted_at       timestamptz
PRIMARY KEY (persona_id, user_id)
```

### 6.2 Row-Level Security Summary

- `personas`: owner can read/write; family members with access can read
- `memories`: owner can read/write; family members cannot directly access (accessed only via inference layer)
- `media_assets`: owner can read/write; family members with access can read (via pre-signed URLs)
- `conversations`: user can read/write their own only
- `messages`: user can read/write their own only
- `persona_access`: admin only can insert/delete

---

## 7. API Design

### 7.1 Next.js API Routes

All routes are under `/app/api/`. Authentication is validated on every request via Supabase session.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/personas` | List personas accessible to the current user |
| `GET` | `/api/personas/[slug]` | Get persona metadata |
| `POST` | `/api/personas` | Create a new persona (subject only) |
| `GET` | `/api/personas/[slug]/memories` | List memories for a persona (subject only) |
| `POST` | `/api/personas/[slug]/memories` | Add a memory (subject only) |
| `DELETE` | `/api/personas/[slug]/memories/[id]` | Delete a memory (subject only) |
| `POST` | `/api/personas/[slug]/chat` | Send a message and get a persona response |
| `POST` | `/api/personas/[slug]/transcribe` | Transcribe uploaded audio via STT endpoint |
| `POST` | `/api/upload/voice-sample` | Get pre-signed B2 URL for voice sample upload |
| `POST` | `/api/upload/media` | Get pre-signed B2 URL for media upload |
| `POST` | `/api/media/[id]/caption` | Trigger auto-captioning for a media asset |

### 7.2 `/api/personas/[slug]/chat` — Core Inference Route

This is the most critical API route. It orchestrates the full RAG + inference pipeline.

**Request**
```typescript
{
  message: string          // user's text input (or transcribed voice)
  conversation_id: string  // existing conversation to continue, or 'new'
  mode: 'text' | 'voice'  // voice mode triggers TTS on response
}
```

**Server-side pipeline**
1. Validate session and persona access
2. Embed the user message via RunPod `/embed`
3. Retrieve top-K relevant memories from pgvector (k=8)
4. Retrieve any associated media assets for retrieved memories
5. Build system prompt with persona context and retrieved memories
6. Call RunPod `/infer` with full message history + context
7. If `mode === 'voice'`: call RunPod `/tts` with response text; store audio to B2
8. Store user message and assistant response in `messages`
9. Return response text, audio URL (if voice), and surfaced media assets

**Response**
```typescript
{
  message: string            // persona's text response
  audio_url?: string         // pre-signed B2 URL to audio (voice mode only)
  media_assets?: {           // contextually relevant media
    id: string
    url: string              // pre-signed B2 URL
    caption: string
  }[]
  conversation_id: string
}
```

### 7.3 RunPod Endpoint Contracts

**`POST /infer`**
```json
{
  "input": {
    "system_prompt": "string",
    "messages": [{"role": "user|assistant", "content": "string"}],
    "max_tokens": 512,
    "temperature": 0.7
  }
}
```
Response: `{ "output": { "text": "string" } }`

**`POST /tts`**
```json
{
  "input": {
    "text": "string",
    "speaker_wav_b2_key": "string",
    "language": "en"
  }
}
```
Response: `{ "output": { "audio_base64": "string", "duration_seconds": 0.0 } }`

**`POST /stt`**
```json
{
  "input": {
    "audio_base64": "string",
    "language": "en"
  }
}
```
Response: `{ "output": { "transcript": "string", "duration_seconds": 0.0 } }`

**`POST /embed`**
```json
{
  "input": {
    "texts": ["string"]
  }
}
```
Response: `{ "output": { "embeddings": [[0.0, ...]] } }`

---

## 8. Persona System Prompt Design

The system prompt is constructed at inference time and has three parts:

**1. Static identity block** (stored in `personas`, written by subject)
```
You are [name]. You were born in [year] and lived in [places].
You are speaking to members of your family after your death.
Respond as yourself — in your own voice, with your own opinions and memories.
Do not pretend to be an AI. If you don't remember something, say so honestly.
Never make up memories you are not given. Speak naturally, not formally.
```

**2. Injected memory block** (retrieved per-query from pgvector)
```
Here are some things you remember that are relevant to this conversation:

- [memory 1]
- [memory 2]
...
```

**3. Conversation history** (from `messages` for current session)
Standard `[{role, content}]` array appended as prior turns.

---

## 9. Fine-tuning Pipeline

Fine-tuning is a manual, occasional process run on a RunPod on-demand pod.

### 9.1 Training Data Format

Memories and interview responses are converted to instruction-response pairs:

```json
[
  {
    "instruction": "What do you think about money and how the economy works?",
    "response": "Most people assume government spending is funded by tax collection, but I think that's got it backwards..."
  }
]
```

A minimum of 500 pairs is required before fine-tuning produces a noticeable personality shift. Target: 1,000–2,000 pairs per subject.

### 9.2 Training Configuration

- Base model: `meta-llama/Llama-3.1-8B-Instruct`
- Method: QLoRA via Unsloth
- Rank: r=16, alpha=32
- Target modules: `q_proj, k_proj, v_proj, o_proj`
- Epochs: 3
- Batch size: 4 (gradient accumulation steps: 4)
- Learning rate: 2e-4 with cosine schedule

### 9.3 Output

Trained adapter (`.safetensors`) is saved to:
- B2: `adapters/{persona_slug}/v{n}/adapter.safetensors` (archive)
- RunPod Network Volume: `adapters/{persona_slug}/current/` (active)

Updating the active adapter requires restarting the RunPod serverless worker (or a rolling restart via the RunPod API).

---

## 10. Environment Variables

### Next.js (Vercel)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Backblaze B2
B2_KEY_ID=
B2_APP_KEY=
B2_BUCKET_NAME=
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004

# RunPod
RUNPOD_API_KEY=
RUNPOD_INFER_ENDPOINT_ID=
RUNPOD_TTS_ENDPOINT_ID=
RUNPOD_STT_ENDPOINT_ID=
RUNPOD_EMBED_ENDPOINT_ID=
```

### RunPod Docker Containers

```env
# Each container reads from RunPod secrets
RUNPOD_API_KEY=
B2_KEY_ID=
B2_APP_KEY=
B2_BUCKET_NAME=
B2_ENDPOINT=
NETWORK_VOLUME_PATH=/runpod-volume
```

---

## 11. Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   ├── capture/          -- Capture mode UI
│   │   │   ├── [slug]/
│   │   │   │   ├── interview/
│   │   │   │   ├── memories/
│   │   │   │   ├── voice/
│   │   │   │   └── media/
│   │   └── talk/             -- Conversation mode UI
│   │       └── [slug]/
│   └── api/
│       ├── personas/
│       ├── upload/
│       └── media/
├── components/
│   ├── capture/
│   └── conversation/
├── lib/
│   ├── supabase/             -- client, server, middleware helpers
│   ├── b2/                   -- S3 client configured for B2
│   ├── runpod/               -- typed wrappers for each endpoint
│   └── rag/                  -- embed, retrieve, build-context helpers
├── runpod/                   -- Docker containers for RunPod endpoints
│   ├── infer/
│   │   ├── Dockerfile
│   │   └── handler.py
│   ├── tts/
│   │   ├── Dockerfile
│   │   └── handler.py
│   ├── stt/
│   │   ├── Dockerfile
│   │   └── handler.py
│   └── embed/
│       ├── Dockerfile
│       └── handler.py
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── docs/
    └── architecture.md       -- this document
```

---

## 12. MVP Scope

### In scope

- [x] Two-role auth (subject, family)
- [x] Single-subject persona (Mike) — second persona (Deepisha) added in v1.1
- [x] Free-form memory entry (text)
- [x] Structured interview flow (10 question sets)
- [x] Text conversation with persona
- [x] Voice conversation (STT + TTS) — full loop
- [x] Photo upload with auto-captioning
- [x] Memory browser (subject)
- [x] Media surfacing in conversation
- [x] pgvector RAG retrieval
- [x] RunPod serverless endpoints for all four AI functions
- [x] B2 storage for all media

### Out of scope (post-MVP)

- [ ] Video upload and playback (photos only for MVP)
- [ ] Talking avatar / animated face
- [ ] Fine-tuning UI (manual process for MVP)
- [ ] Mobile app (responsive web only)
- [ ] Multiple language support
- [ ] Shared family memory annotations
- [ ] Export / backup UI
- [ ] Offline mode

---

## 13. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | What is the final project name? | Mike | Open |
| 2 | Should voice conversation be synchronous (stream tokens → TTS) or buffered (full response → TTS)? Streaming is more natural but more complex. | Architecture | Open |
| 3 | How should cold starts be managed — keep-warm worker, or accept latency and show a status indicator? | Infrastructure | Open |
| 4 | What is the UI tone for the conversation screen? (ambient, minimal, photo-forward?) | Design | Open |
| 5 | Should conversation history be injected into subsequent sessions, or start fresh each time? | Product | Open |
| 6 | How are private memories (marked by subject as hidden from family) handled — excluded from RAG entirely, or excluded only from responses? | Privacy | Open |

---

## 14. Key Technical Decisions Log

| Decision | Rationale | Alternatives considered |
|---|---|---|
| RunPod serverless over self-hosted GPU | Deployable without dedicated hardware; pay-per-use suitable for low-traffic app; no hardware maintenance | Local GPU (rejected: not portable); cloud GPU via AWS/GCP (rejected: cost) |
| Backblaze B2 over S3 | ~75% cheaper than S3; S3-compatible API; free egress to Cloudflare | AWS S3 (rejected: cost); Cloudflare R2 (viable alternative) |
| Supabase pgvector over dedicated vector DB | Eliminates separate service; co-located with structured data; sufficient for <100k memories | Qdrant (rejected: extra service); ChromaDB (rejected: not production-ready) |
| Llama 3.1 8B over larger models | Fits RTX 4090 comfortably with LoRA; fast inference; quality sufficient for persona task | Llama 3.1 70B (rejected: cost/latency); Mistral 7B (viable fallback) |
| XTTS v2 over ElevenLabs | Fully local; no data leaves infrastructure; one-time voice clone, no API cost | ElevenLabs (rejected: privacy); Coqui XTTS is successor to Coqui TTS |
| Next.js API routes over separate backend | Simplifies deployment; sufficient for expected load; consistent with existing skills | FastAPI backend (rejected: extra service to maintain) |
| QLoRA over full fine-tune | Fits consumer GPU; fast; minimal catastrophic forgetting; adapter is small and swappable | Full fine-tune (rejected: hardware requirement); RAG-only without fine-tune (viable fallback for early MVP) |

---

*Last updated: May 2026*
