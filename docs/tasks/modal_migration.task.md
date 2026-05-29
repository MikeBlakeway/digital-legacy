## Task: Migrate all four AI endpoints from RunPod to Modal

The project is moving from RunPod serverless to Modal for reliability reasons.
The four Docker-based RunPod handlers need to be rewritten as Modal functions.
The core model loading and inference logic stays the same — only the
serving layer changes.

Reference: Modal docs at <https://modal.com/docs>

## Architecture overview

Modal replaces RunPod entirely. Each of the four AI functions becomes a
Modal web endpoint. Next.js API routes call these endpoints via fetch —
same pattern as before, just different URLs.

                Next.js API routes
                       ↓
              Modal web endpoints
              ├── /infer    (Llama 3.1 8B + LoRA via vLLM)
              ├── /embed    (nomic-embed-text)
              ├── /stt      (faster-whisper)
              └── /tts      (XTTS v2)
                       ↓
              Modal Volume (model weights)

## Step 1 — Create Modal volume for model weights

In modal/app.py, define the volume:

  import modal

  volume = modal.Volume.from_name(
      "digital-legacy-weights",
      create_if_missing=True
  )

Then write a download function that populates it. This replaces
the RunPod temporary pod + scripts/download_models.py approach:

  @app.function(
      volumes={"/model-weights": volume},
      timeout=7200,  # 2 hours
      secrets=[modal.Secret.from_name("digital-legacy-b2")],
  )
  def download_models():
      from huggingface_hub import snapshot_download
      import os

      HF_TOKEN = os.environ.get("HF_TOKEN")
      base = "/model-weights"

      models = [
          {
              "repo_id": "meta-llama/Llama-3.1-8B-Instruct",
              "local_dir": f"{base}/llama-3.1-8b-instruct",
              "token": HF_TOKEN,
          },
          {
              "repo_id": "coqui/XTTS-v2",
              "local_dir": f"{base}/xtts-v2",
              "token": None,
          },
          {
              "repo_id": "Systran/faster-whisper-large-v3",
              "local_dir": f"{base}/faster-whisper-large-v3",
              "token": None,
          },
          {
              "repo_id": "nomic-ai/nomic-embed-text-v1.5",
              "local_dir": f"{base}/nomic-embed-text",
              "token": None,
          },
      ]

      for m in models:
          if os.path.exists(m["local_dir"]) and os.listdir(m["local_dir"]):
              print(f"[SKIP] {m['repo_id']}")
              continue
          print(f"[DOWNLOADING] {m['repo_id']}")
          snapshot_download(
              repo_id=m["repo_id"],
              local_dir=m["local_dir"],
              token=m["token"],
          )
          volume.commit()  # persist after each model
          print(f"[DONE] {m['repo_id']}")

      os.makedirs(f"{base}/adapters", exist_ok=True)
      volume.commit()
      print("Download complete.")

## Step 2 — Write the four Modal web endpoint functions

Create modal/app.py with all four functions.
Use the following specifications:

### App and shared config

  app = modal.App("digital-legacy")

# Shared volume (models live here)

  volume = modal.Volume.from_name("digital-legacy-weights")

# Base image with common dependencies

  base_image = (
      modal.Image.debian_slim(python_version="3.11")
      .pip_install(["huggingface_hub", "boto3"])
  )

### Function 1 — embed

  embed_image = base_image.pip_install([
      "sentence-transformers",
      "torch",
  ])

  @app.function(
      image=embed_image,
      gpu="T4",                          # small model, T4 sufficient
      volumes={"/model-weights": volume},
      secrets=[modal.Secret.from_name("digital-legacy-b2")],
      timeout=120,
      scaledown_window=30,
  )
  @modal.web_endpoint(method="POST")
  def embed(item: dict) -> dict:
      from sentence_transformers import SentenceTransformer
      texts = item["texts"]
      model = SentenceTransformer(
          "/model-weights/nomic-embed-text",
          trust_remote_code=True,
      )
      embeddings = model.encode(texts, normalize_embeddings=True)
      return {"embeddings": embeddings.tolist()}

### Function 2 — stt

  stt_image = base_image.pip_install([
      "faster-whisper",
      "torch",
  ])

  @app.function(
      image=stt_image,
      gpu="T4",
      volumes={"/model-weights": volume},
      secrets=[modal.Secret.from_name("digital-legacy-b2")],
      timeout=120,
      scaledown_window=30,
  )
  @modal.web_endpoint(method="POST")
  def stt(item: dict) -> dict:
      from faster_whisper import WhisperModel
      import base64, tempfile, os

      audio_bytes = base64.b64decode(item["audio_base64"])
      language = item.get("language", "en")

      model = WhisperModel(
          "/model-weights/faster-whisper-large-v3",
          device="cuda",
          compute_type="float16",
      )

      with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
          f.write(audio_bytes)
          tmp_path = f.name

      segments, info = model.transcribe(tmp_path, language=language)
      os.unlink(tmp_path)
      transcript = " ".join(s.text for s in segments).strip()

      return {
          "transcript": transcript,
          "duration_seconds": info.duration,
      }

### Function 3 — tts

  tts_image = base_image.pip_install([
      "TTS",
      "torch",
      "torchaudio",
  ])

  @app.function(
      image=tts_image,
      gpu="A10G",                        # XTTS needs more VRAM
      volumes={"/model-weights": volume},
      secrets=[modal.Secret.from_name("digital-legacy-b2")],
      timeout=120,
      scaledown_window=60,
  )
  @modal.web_endpoint(method="POST")
  def tts(item: dict) -> dict:
      from TTS.api import TTS as CoquiTTS
      import boto3, base64, tempfile, os

      text = item["text"]
      speaker_b2_key = item.get("speaker_wav_b2_key")
      language = item.get("language", "en")

      # Download speaker reference from B2 if provided
      speaker_path = None
      if speaker_b2_key:
          s3 = boto3.client(
              "s3",
              endpoint_url=os.environ["B2_ENDPOINT"],
              aws_access_key_id=os.environ["B2_KEY_ID"],
              aws_secret_access_key=os.environ["B2_APP_KEY"],
          )
          with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
              s3.download_fileobj(os.environ["B2_BUCKET_NAME"], speaker_b2_key, f)
              speaker_path = f.name

      model = CoquiTTS("tts_models/multilingual/multi-dataset/xtts_v2")
      model.to("cuda")

      with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out:
          out_path = out.name

      model.tts_to_file(
          text=text,
          speaker_wav=speaker_path,
          language=language,
          file_path=out_path,
      )

      with open(out_path, "rb") as f:
          audio_b64 = base64.b64encode(f.read()).decode()

      os.unlink(out_path)
      if speaker_path:
          os.unlink(speaker_path)

      return {"audio_base64": audio_b64}

### Function 4 — infer

  infer_image = (
      modal.Image.debian_slim(python_version="3.11")
      .pip_install([
          "vllm",
          "huggingface_hub",
      ])
  )

  @app.function(
      image=infer_image,
      gpu="A10G",
      volumes={"/model-weights": volume},
      secrets=[modal.Secret.from_name("digital-legacy-b2")],
      timeout=600,
      scaledown_window=600,              # keep warm 10 min during conversations
  )
  @modal.web_endpoint(method="POST")
  def infer(item: dict) -> dict:
      from vllm import LLM, SamplingParams
      from vllm.lora.request import LoRARequest
      import os

      system_prompt = item["system_prompt"]
      messages = item["messages"]
      max_tokens = item.get("max_tokens", 512)
      temperature = item.get("temperature", 0.7)
      persona_slug = item.get("persona_slug")

      # Build prompt in ChatML format
      prompt = f"<|system|>\n{system_prompt}\n"
      for msg in messages:
          role = msg["role"]
          content = msg["content"]
          prompt += f"<|{role}|>\n{content}\n"
      prompt += "<|assistant|>\n"

      # Load base model
      llm = LLM(
          model="/model-weights/llama-3.1-8b-instruct",
          enable_lora=True,
          max_model_len=8192,
      )

      # Load LoRA adapter if available for this persona
      lora_request = None
      if persona_slug:
          adapter_path = f"/model-weights/adapters/{persona_slug}/current"
          if os.path.exists(adapter_path):
              lora_request = LoRARequest(persona_slug, 1, adapter_path)

      sampling_params = SamplingParams(
          temperature=temperature,
          max_tokens=max_tokens,
      )

      outputs = llm.generate(
          [prompt],
          sampling_params,
          lora_request=lora_request,
      )

      return {"text": outputs[0].outputs[0].text.strip()}

## Step 3 — Update Next.js lib/runpod/ to call Modal

Rename src/lib/runpod/ to src/lib/ai/ and update each wrapper to call
the Modal web endpoint URLs instead of RunPod endpoints.

Modal web endpoint URLs follow this pattern after deployment:
  <https://mikeblakeway--digital-legacy-{function-name}.modal.run>

Update environment variables:
  Remove: RUNPOD_INFER_ENDPOINT_ID, RUNPOD_TTS_ENDPOINT_ID,
          RUNPOD_STT_ENDPOINT_ID, RUNPOD_EMBED_ENDPOINT_ID
  Add:    MODAL_INFER_URL
          MODAL_TTS_URL
          MODAL_STT_URL
          MODAL_EMBED_URL

For infer specifically: since Modal web endpoints are synchronous
(they wait for the function to complete), the async polling logic
in infer.ts can be removed. Replace with a simple fetch() with
a 600 second timeout.

Update src/lib/ai/infer.ts to use MODAL_INFER_URL directly:
  const response = await fetch(process.env.MODAL_INFER_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(590_000),
  })

## Step 4 — Deploy

# Deploy all functions

  modal deploy modal/app.py

# Run model download (one-time, will take 60-90 minutes)

# User will provide HF_TOKEN when prompted

  modal run modal/app.py::download_models

After deploy, Modal prints the web endpoint URLs for each function.
Collect those URLs and add them to .env.local and Vercel env vars.

## Step 5 — Update .env.example

Replace all RUNPOD_* endpoint variables with:
  MODAL_INFER_URL=
  MODAL_TTS_URL=
  MODAL_STT_URL=
  MODAL_EMBED_URL=

Keep RUNPOD_NETWORK_VOLUME_ID removed — Modal volume is managed
internally and doesn't need an env var.

## Step 6 — Smoke test

After deploy and model download, re-run:
  npx tsx scripts/test_endpoints.ts

Update the test script to use MODAL_*_URL env vars instead of
RunPod endpoint IDs. The request/response shape stays identical.
