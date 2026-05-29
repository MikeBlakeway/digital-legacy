# Digital Legacy — Setup & First Build Tasks

> **How to use this document**  
> Work through phases in order. Each task has numbered steps and a verification check.  
> Complete all of Phase 0 before writing any code. Collect every credential into `.env.local` as you go.  
> Phase 1 tasks are designed to be handed to an AI coding agent with the architecture doc as context.

---

## Phase overview

| Phase | Name | Who | Code? |
|---|---|---|---|
| **0** | Infrastructure provisioning | You | No |
| **1** | Foundation code | Coding agent | Yes |
| **2** | Feature development | Coding agent | Yes |

---

# Phase 0 — Infrastructure Provisioning

## Task 0.1 — GitHub Repository

**Prerequisites:** GitHub account

### Steps

1. Go to github.com → New repository
2. Name: `digital-legacy`
3. Visibility: **Private**
4. Initialise with a README: **yes**
5. .gitignore template: **Node**
6. Clone to your local machine:
   ```bash
   git clone git@github.com:YOUR_USERNAME/digital-legacy.git
   cd digital-legacy
   ```
7. Create the docs directory and add the architecture document:
   ```bash
   mkdir docs
   # copy digital-legacy-architecture.md into docs/
   ```
8. Create `.env.example` with the following content (values intentionally blank):
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

   # RunPod
   RUNPOD_API_KEY=
   RUNPOD_INFER_ENDPOINT_ID=
   RUNPOD_TTS_ENDPOINT_ID=
   RUNPOD_STT_ENDPOINT_ID=
   RUNPOD_EMBED_ENDPOINT_ID=
   RUNPOD_NETWORK_VOLUME_ID=
   ```
9. Confirm `.gitignore` contains `.env.local` (it should by default with the Node template)
10. Commit and push:
    ```bash
    git add .
    git commit -m "chore: initial project structure and docs"
    git push origin main
    ```

**✓ Verification:** Repository visible at github.com/YOUR_USERNAME/digital-legacy with docs and .env.example present.

---

## Task 0.2 — Supabase Project

**Prerequisites:** Supabase account (supabase.com)

### Steps

1. Go to supabase.com → New project
2. Name: `digital-legacy`
3. Database password: generate a strong password and **save it to your password manager**
4. Region: choose based on your RunPod region decision (see Task 0.4 note)
   - If RunPod → US-TX-3: choose **US East (N. Virginia)** or **US West (Oregon)**
   - If RunPod → EU-RO-1: choose **EU Central (Frankfurt)**
5. Click Create project and wait ~2 minutes for provisioning

6. Enable the pgvector extension — go to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   Click Run. You should see "Success. No rows returned."

7. Disable public sign-ups:
   - Go to **Authentication → Settings**
   - Under "User Signups", toggle **"Enable Sign Ups"** to **OFF**
   - Click Save

8. Collect credentials — go to **Settings → API Keys**:
   - Copy **Project URL** from Settings → Data API → `NEXT_PUBLIC_SUPABASE_URL`
   - Click the **API Keys** tab (not the Legacy tab)
   - If no keys exist yet, click **Create new API Keys**
   - Copy the **Publishable key** value (`sb_publishable_xxx`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Copy the **Secret key** value (`sb_secret_xxx`) → `SUPABASE_SECRET_KEY`

   > **Note:** If you see `eyJ...` JWT-format keys you are on the Legacy tab. Use the API Keys tab instead for `sb_publishable_xxx` and `sb_secret_xxx` format keys.

9. Add these to `.env.local` in your repo root (create this file — it is gitignored):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   SUPABASE_SECRET_KEY=sb_secret_xxx
   ```

**✓ Verification:** SQL Editor shows pgvector extension active. Auth settings show sign-ups disabled.

---

## Task 0.3 — Backblaze B2

**Prerequisites:** Backblaze account (backblaze.com), Python installed locally

### Steps

**A. Create bucket**

1. Log in → go to **B2 Cloud Storage → Buckets**
2. Click **Create a Bucket**
3. Bucket name: `digital-legacy-media` (must be globally unique — add a suffix if taken)
4. Files in bucket: **Private**
5. Default encryption: enabled (recommended)
6. Click Create Bucket
7. On the bucket list, note the **Endpoint** shown under your bucket (e.g. `s3.us-west-004.backblazeb2.com`) → this is `B2_ENDPOINT`
8. Note the region portion (e.g. `us-west-004`) → this is `B2_REGION`

**B. Create application keys**

9. Go to **Account → Application Keys**
10. Click **Add a New Application Key**
11. Name: `digital-legacy-app`
12. Allow access to bucket: **digital-legacy-media** (restrict to this bucket only)
13. Type of access: **Read and Write**
14. Leave other options default → click **Create New Key**
15. **Copy the keyID and applicationKey immediately** — the applicationKey is shown only once
    - `keyID` → `B2_KEY_ID`
    - `applicationKey` → `B2_APP_KEY`

**C. Configure CORS** (required for direct browser uploads)

16. Install the B2 CLI:
    ```bash
    pip install b2
    ```
17. Authorise the CLI:
    ```bash
    b2 authorize-account YOUR_KEY_ID YOUR_APP_KEY
    ```
18. Create a file called `cors.json` on your local machine:
    ```json
    [
      {
        "corsRuleName": "digital-legacy-uploads",
        "allowedOrigins": ["*"],
        "allowedHeaders": ["*"],
        "allowedOperations": ["s3_put", "s3_get", "s3_head"],
        "maxAgeSeconds": 3600
      }
    ]
    ```
19. Apply the CORS rules to your bucket:
    ```bash
    b2 bucket update \
      --cors-rules "$(cat cors.json)" \
      digital-legacy-media allPrivate
    ```
    You should see the bucket details printed with `corsRules` included.

20. Add to `.env.local`:
    ```env
    B2_KEY_ID=your_key_id
    B2_APP_KEY=your_app_key
    B2_BUCKET_NAME=digital-legacy-media
    B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
    B2_REGION=us-west-004
    ```

**✓ Verification:** Run `b2 ls b2://digital-legacy-media` — should return empty (no error).

---

## Task 0.4 — RunPod

**Prerequisites:** RunPod account (runpod.io), payment method or prepaid credit

> **Region note:** Your network volume and serverless endpoints must be in the same datacenter.  
> Recommended: **US-TX-3** (good GPU availability). EU alternative: **EU-RO-1**.  
> Pick one and use it consistently throughout.

### Steps

**A. Account and funding**

1. Log in to runpod.io
2. Go to **Billing** → add a credit card or prepay credit
   - Recommended starting credit: **$20** (sufficient for setup and initial testing)
3. Go to **Settings → API Keys** → create a new API key
   - Name: `digital-legacy`
   - Copy the key → `RUNPOD_API_KEY`

**B. Create Network Volume**

4. Go to **Storage → Network Volumes** → click **+ New Volume**
5. Configuration:
   - Name: `digital-legacy-weights`
   - Size: **50 GB**
   - Datacenter: your chosen region (e.g. **US-TX-3**)
   - Storage class: **SSD**
6. Click Deploy → wait for provisioning (~1 minute)
7. Note the **Volume ID** shown in the volume list → `RUNPOD_NETWORK_VOLUME_ID`

8. Add to `.env.local`:
   ```env
   RUNPOD_API_KEY=your_api_key
   RUNPOD_NETWORK_VOLUME_ID=vol-xxxxxxxxxxxx
   ```

> **Note:** Endpoint IDs (`RUNPOD_INFER_ENDPOINT_ID` etc.) are added after Phase 1 Task 1.4.  
> Leave those blank in `.env.local` for now.

**✓ Verification:** Network volume shows status **Ready** in the RunPod console.

---

## Task 0.5 — Vercel Project

**Prerequisites:** Vercel account (vercel.com), Task 0.1 complete

### Steps

1. Go to vercel.com → **Add New → Project**
2. Import your `digital-legacy` GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: leave as `/` (default)
5. Click **Deploy** — the initial deploy will fail (no Next.js app yet); that is expected
6. Go to your project → **Settings → Environment Variables**
7. Add each variable from `.env.example`, one at a time:
   - Fill in real values for variables you already have (Supabase, B2, RunPod API key)
   - Leave RunPod endpoint IDs blank for now (enter a placeholder like `pending`)
   - Set environment scope to: **Production**, **Preview**, and **Development**
8. Note your Vercel project URL (e.g. `digital-legacy-xxx.vercel.app`)
9. Go back to Supabase → **Authentication → Settings → Site URL**
   - Set to your Vercel URL: `https://digital-legacy-xxx.vercel.app`

**✓ Verification:** Vercel project settings page shows all environment variables listed (even if not all have values yet).

---

## Task 0.6 — HuggingFace Access (Llama 3.1)

**Prerequisites:** HuggingFace account (huggingface.co)

Llama 3.1 is a gated model — Meta requires you to accept a licence agreement before downloading.

### Steps

1. Go to huggingface.co and log in (create account if needed)
2. Visit: `huggingface.co/meta-llama/Llama-3.1-8B-Instruct`
3. Click **Agree and access repository** — fill in the form and submit
4. Approval is usually instant or within minutes
5. Go to **Settings → Access Tokens** → **New token**
   - Name: `digital-legacy-download`
   - Role: **Read**
6. Copy the token — you will need this in Phase 1 Task 1.3
7. Store it securely in your password manager (not in `.env.local` — it is only needed for the one-time model download)

**✓ Verification:** `huggingface.co/meta-llama/Llama-3.1-8B-Instruct` shows the model files are accessible (no gating warning).

---

## Phase 0 complete — credentials checklist

Before moving to Phase 1, confirm `.env.local` contains real values for:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SECRET_KEY`
- [ ] `B2_KEY_ID`
- [ ] `B2_APP_KEY`
- [ ] `B2_BUCKET_NAME`
- [ ] `B2_ENDPOINT`
- [ ] `B2_REGION`
- [ ] `RUNPOD_API_KEY`
- [ ] `RUNPOD_NETWORK_VOLUME_ID`

Pending until Phase 1:
- [ ] `RUNPOD_INFER_ENDPOINT_ID`
- [ ] `RUNPOD_TTS_ENDPOINT_ID`
- [ ] `RUNPOD_STT_ENDPOINT_ID`
- [ ] `RUNPOD_EMBED_ENDPOINT_ID`

---

# Phase 1 — Foundation Code

> These tasks are designed to be executed by an AI coding agent.  
> For each task, provide the agent with: this document, the architecture doc, and your `.env.example`.  
> One task per agent session is recommended.

---

## Task 1.1 — Initialise Next.js App and Supabase Schema

**Agent brief:**

> Using the architecture document as reference, initialise a Next.js 14 App Router project with TypeScript and Tailwind CSS. Then write and apply the Supabase database migrations for all tables defined in section 6 of the architecture doc, including RLS policies.

**What the agent produces:**

- Full Next.js app scaffold (`app/`, `components/`, `lib/` directories)
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_pgvector_index.sql`
- `lib/supabase/client.ts` (browser Supabase client)
- `lib/supabase/server.ts` (server Supabase client using service role)
- `middleware.ts` (auth route protection)

**Key schema requirements to include in agent context:**

```sql
-- 001_initial_schema.sql must include:
CREATE EXTENSION IF NOT EXISTS vector;  -- already enabled, but idempotent is safe

CREATE TABLE personas ( ... );
CREATE TABLE memories (
  ...
  embedding vector(768),  -- nomic-embed-text output dimension
  ...
);
CREATE TABLE media_assets ( ... );
CREATE TABLE voice_samples ( ... );
CREATE TABLE conversations ( ... );
CREATE TABLE messages (
  ...
  retrieved_memory_ids uuid[],  -- array of memory IDs used in this response
  ...
);
CREATE TABLE persona_access ( ... );

-- 003_pgvector_index.sql must include:
CREATE INDEX ON memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**How to apply migrations:**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

Alternatively, paste each migration file into the Supabase SQL Editor and run manually.

**✓ Verification:**
- `supabase db diff` shows no pending changes
- All 7 tables visible in Supabase Table Editor
- pgvector index visible in Database → Indexes
- Test RLS: authenticated user can read their own persona; cannot read another user's

---

## Task 1.2 — Core Library Modules

**Agent brief:**

> Write the core library modules for B2 storage access and RunPod endpoint calls. Use the architecture document section 7.3 for the exact RunPod request/response contracts. All modules must be fully typed TypeScript.

**What the agent produces:**

```
lib/
├── b2/
│   └── client.ts           -- S3Client configured for B2, presigned URL helpers
├── runpod/
│   ├── client.ts           -- base fetch wrapper with error handling
│   ├── infer.ts            -- typed wrapper for /infer endpoint
│   ├── tts.ts              -- typed wrapper for /tts endpoint
│   ├── stt.ts              -- typed wrapper for /stt endpoint
│   └── embed.ts            -- typed wrapper for /embed endpoint
└── rag/
    ├── embed.ts            -- embed text using RunPod, upsert to pgvector
    └── retrieve.ts         -- cosine similarity search against memories table
```

**Key implementation notes for the agent:**

`lib/b2/client.ts` — use `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. B2 is S3-compatible; only the endpoint URL differs.

`lib/runpod/client.ts` — RunPod serverless uses `runsync` for synchronous calls. Base URL pattern:
```
POST https://api.runpod.ai/v2/{endpointId}/runsync
Authorization: Bearer {RUNPOD_API_KEY}
Body: { "input": { ...params } }
Response: { "status": "COMPLETED", "output": { ...result } }
```

`lib/rag/retrieve.ts` — pgvector cosine similarity query pattern:
```sql
SELECT id, content, media_asset_id, 1 - (embedding <=> $1) AS similarity
FROM memories
WHERE persona_id = $2
  AND is_private = false
ORDER BY embedding <=> $1
LIMIT $3;
```

**✓ Verification:** TypeScript compiles without errors (`tsc --noEmit`). Each module exports typed functions matching the contracts in the architecture doc.

---

## Task 1.3 — RunPod Handler Code and Dockerfiles

**Agent brief:**

> Write four RunPod serverless handler files and their Dockerfiles. Each handler loads its model from `/runpod-volume` at startup and processes requests using the RunPod Python SDK. Use the request/response contracts from section 7.3 of the architecture document.

**What the agent produces:**

```
runpod/
├── infer/
│   ├── handler.py
│   ├── Dockerfile
│   └── requirements.txt
├── tts/
│   ├── handler.py
│   ├── Dockerfile
│   └── requirements.txt
├── stt/
│   ├── handler.py
│   ├── Dockerfile
│   └── requirements.txt
└── embed/
    ├── handler.py
    ├── Dockerfile
    └── requirements.txt
```

**Key implementation notes for the agent:**

All handlers follow the RunPod serverless pattern:
```python
import runpod

def handler(job):
    input_data = job['input']
    # ... process ...
    return { "output_key": output_value }

runpod.serverless.start({"handler": handler})
```

**infer/handler.py** — use `vllm` with `enable_lora=True`. Load base model at startup from `/runpod-volume/llama-3.1-8b-instruct`. Accept `persona_slug` in input to dynamically load LoRA adapter from `/runpod-volume/adapters/{persona_slug}/current/` if it exists. Construct the prompt in ChatML format from `system_prompt` and `messages` array.

**tts/handler.py** — use `TTS` from the `TTS` package (Coqui). Load XTTS v2 model at startup from `/runpod-volume/xtts-v2`. Download speaker reference WAV from B2 using `boto3` before synthesis. Return audio as base64-encoded WAV.

**stt/handler.py** — use `faster_whisper.WhisperModel`. Load from `/runpod-volume/faster-whisper-large-v3`. Accept audio as base64-encoded bytes, decode to a temp file, transcribe, return transcript string.

**embed/handler.py** — use `sentence_transformers.SentenceTransformer`. Load from `/runpod-volume/nomic-embed-text`. Accept `texts` array, return `embeddings` array of float arrays. Normalise embeddings (`normalize_embeddings=True`).

**Base Dockerfile pattern:**
```dockerfile
FROM runpod/base:0.6.2-cuda12.1.0

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py .

CMD ["python", "-u", "handler.py"]
```

**After the agent produces these files:**

Build and push each image to Docker Hub (create a Docker Hub account if needed):

```bash
# Login to Docker Hub
docker login

# Build and push each image
docker build -t YOUR_DOCKERHUB_USERNAME/digital-legacy-infer:latest ./runpod/infer
docker push YOUR_DOCKERHUB_USERNAME/digital-legacy-infer:latest

docker build -t YOUR_DOCKERHUB_USERNAME/digital-legacy-tts:latest ./runpod/tts
docker push YOUR_DOCKERHUB_USERNAME/digital-legacy-tts:latest

docker build -t YOUR_DOCKERHUB_USERNAME/digital-legacy-stt:latest ./runpod/stt
docker push YOUR_DOCKERHUB_USERNAME/digital-legacy-stt:latest

docker build -t YOUR_DOCKERHUB_USERNAME/digital-legacy-embed:latest ./runpod/embed
docker push YOUR_DOCKERHUB_USERNAME/digital-legacy-embed:latest
```

**✓ Verification:** All four images visible in Docker Hub. Each `docker run` locally prints the RunPod handler startup message.

---

## Task 1.4 — RunPod Endpoint Creation and Model Download

This task is manual (RunPod console) plus one scripted step.

### Part A — Create serverless endpoints (RunPod console)

Repeat these steps four times, once per endpoint.

**For each endpoint:**

1. Go to RunPod Console → **Serverless → + New Endpoint**
2. Select **Custom** → **Container Image**
3. Enter the Docker image URL (from Task 1.3):
   - Infer: `YOUR_DOCKERHUB_USERNAME/digital-legacy-infer:latest`
   - TTS: `YOUR_DOCKERHUB_USERNAME/digital-legacy-tts:latest`
   - STT: `YOUR_DOCKERHUB_USERNAME/digital-legacy-stt:latest`
   - Embed: `YOUR_DOCKERHUB_USERNAME/digital-legacy-embed:latest`
4. Endpoint name:
   - `digital-legacy-infer`, `digital-legacy-tts`, `digital-legacy-stt`, `digital-legacy-embed`
5. GPU configuration:
   - Infer: **RTX 4090** (24GB VRAM required for Llama 3.1 8B + LoRA)
   - TTS: **RTX 3090** or RTX 4090
   - STT: **RTX 3090** or RTX 4090
   - Embed: **RTX 3090** (model is small)
6. Datacenter: **must match your network volume** (e.g. US-TX-3)
7. Workers:
   - Min: **0** (scale to zero when idle)
   - Max: **1** (sufficient for family app)
   - Keep-warm workers: **0** (accept cold start for MVP)
8. Volume mount: select **digital-legacy-weights** → mount path `/runpod-volume`
9. Environment variables — add via the Secrets section:
   ```
   B2_KEY_ID          = your value
   B2_APP_KEY         = your value
   B2_BUCKET_NAME     = your value
   B2_ENDPOINT        = your value
   NETWORK_VOLUME_PATH = /runpod-volume
   ```
10. Click **Deploy**
11. Once active, copy the **Endpoint ID** (format: `xxxxxxxxxxxxxxxx`)

After all four endpoints are created, update `.env.local` and Vercel environment variables:
```env
RUNPOD_INFER_ENDPOINT_ID=xxxxxxxxxxxxxxxx
RUNPOD_TTS_ENDPOINT_ID=xxxxxxxxxxxxxxxx
RUNPOD_STT_ENDPOINT_ID=xxxxxxxxxxxxxxxx
RUNPOD_EMBED_ENDPOINT_ID=xxxxxxxxxxxxxxxx
```

### Part B — Download models to network volume

This is a one-time operation. You spin up a temporary pod with the volume mounted, run the download script, then terminate the pod.

**Agent brief for the download script:**

> Write a Python script `scripts/download_models.py` that downloads all four required model repositories from HuggingFace to `/runpod-volume` using `huggingface_hub.snapshot_download`. Models: `meta-llama/Llama-3.1-8B-Instruct` (requires HF_TOKEN), `coqui/XTTS-v2`, `Systran/faster-whisper-large-v3`, `nomic-ai/nomic-embed-text-v1.5`. After downloading, create the directory `/runpod-volume/adapters`. Print disk usage summary at the end.

**Run the script:**

1. Go to RunPod Console → **Pods → + GPU Pod**
2. Select a pod with the same datacenter as your volume
3. Template: **RunPod PyTorch** (any recent version)
4. Volume: attach **digital-legacy-weights** → mount at `/runpod-volume`
5. GPU: any available (A100 is fastest for large downloads, but any will work)
6. Click **Deploy On-Demand**
7. Once running, click **Connect → SSH Terminal**
8. In the SSH terminal:
   ```bash
   pip install huggingface_hub
   git clone https://github.com/YOUR_USERNAME/digital-legacy.git
   cd digital-legacy
   HF_TOKEN=your_huggingface_token python scripts/download_models.py
   ```
9. Wait for all downloads to complete (~45–90 minutes depending on connection)
10. Verify directory sizes:
    ```bash
    du -sh /runpod-volume/*/
    ```
    Expected output:
    ```
    ~16G    /runpod-volume/llama-3.1-8b-instruct/
    ~2.1G   /runpod-volume/xtts-v2/
    ~3.1G   /runpod-volume/faster-whisper-large-v3/
    ~540M   /runpod-volume/nomic-embed-text/
    ```
11. **Terminate the pod** (important — you are billed per minute)

**✓ Verification:** Test each endpoint via the RunPod console "Test" button with a minimal payload. Each should return a valid response (expect 30–60 second cold start on first call).

---

## Task 1.5 — Smoke Test All Endpoints

**Agent brief:**

> Write a script `scripts/test_endpoints.ts` that calls each of the four RunPod endpoints with minimal test payloads and logs the responses. Use the typed wrappers from `lib/runpod/`. Run with `npx tsx scripts/test_endpoints.ts`.

**What the script should test:**

```typescript
// embed: embed a short string, confirm vector length is 768
// infer: send a single-turn message as 'Mike', confirm text response
// stt: encode a short WAV file as base64, confirm transcript returned
// tts: synthesise a short phrase, confirm audio_base64 returned
```

**✓ Verification:** All four endpoints return valid responses in the test script output. The stack is ready for feature development.

---

## Phase 1 complete — what you now have

- [ ] Next.js app scaffold committed to GitHub
- [ ] Supabase schema deployed with pgvector index and RLS policies
- [ ] All four RunPod endpoints deployed and tested
- [ ] Model weights on network volume (Llama 3.1, XTTS v2, Whisper, nomic-embed)
- [ ] Core library modules (B2, RunPod, RAG) written and typed
- [ ] All environment variables populated in `.env.local` and Vercel
- [ ] Smoke tests passing for all endpoints

**First feature task (Phase 2 Task 2.1):** Persona creation flow — the UI and API route for a subject to create their first persona and set an identity prompt.

---

## Reference — Recommended agent session structure

| Session | Task | Context to provide |
|---|---|---|
| 1 | Next.js scaffold + Supabase migrations | Architecture doc + `.env.example` |
| 2 | Core library modules (B2, RunPod, RAG) | Architecture doc sections 7.2, 7.3 |
| 3 | RunPod handlers + Dockerfiles | Architecture doc section 7.3 |
| 4 | Model download script | This document Task 1.4B |
| 5 | Smoke test script | Architecture doc + `lib/runpod/` files |

Keep sessions focused. One task per session produces better output than multi-task sessions.

---

*Last updated: May 2026*
