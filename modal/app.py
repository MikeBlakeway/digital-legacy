import modal


def require_non_empty_string(item: dict, key: str) -> str:
    value = item.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} must be a non-empty string")
    return value.strip()


def require_texts(item: dict) -> list[str]:
    texts = item.get("texts")
    if not isinstance(texts, list) or not texts:
        raise ValueError("texts must be a non-empty string array")

    cleaned: list[str] = []
    for index, text in enumerate(texts):
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"texts[{index}] must be a non-empty string")
        cleaned.append(text.strip())

    return cleaned


def require_messages(item: dict) -> list[dict[str, str]]:
    messages = item.get("messages")
    if not isinstance(messages, list):
        raise ValueError("messages must be an array")

    validated: list[dict[str, str]] = []
    for index, message in enumerate(messages):
        if not isinstance(message, dict):
            raise ValueError(f"messages[{index}] must be an object")

        role = message.get("role")
        content = message.get("content")

        if role not in {"user", "assistant"}:
            raise ValueError(f"messages[{index}].role must be user or assistant")
        if not isinstance(content, str) or not content.strip():
            raise ValueError(f"messages[{index}].content must be non-empty")

        validated.append({"role": role, "content": content.strip()})

    return validated


def normalize_persona_slug(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    slug = value.strip()
    if not slug:
        return None

    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789-_")
    if any(char not in allowed for char in slug.lower()):
        raise ValueError("persona_slug contains invalid characters")

    return slug


app = modal.App("digital-legacy")

volume = modal.Volume.from_name(
    "digital-legacy-weights",
    create_if_missing=True,
)

base_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(["huggingface_hub", "boto3", "fastapi[standard]"])
)

cuda12_library_path = (
    "/usr/local/lib/python3.11/site-packages/nvidia/cublas/lib:"
    "/usr/local/lib/python3.11/site-packages/nvidia/cudnn/lib:"
    "/usr/local/nvidia/lib64:"
    "/usr/local/cuda/lib64"
)

embed_image = base_image.pip_install([
    "einops",
    "sentence-transformers",
    "torch",
])

stt_image = (
    base_image.pip_install([
        "faster-whisper",
        "nvidia-cublas-cu12",
        "nvidia-cudnn-cu12",
    ])
    .env({"LD_LIBRARY_PATH": cuda12_library_path})
)

tts_image = base_image.pip_install([
    "TTS",
    "torch",
    "torchaudio",
])

infer_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "vllm",
        "huggingface_hub",
        "fastapi[standard]",
    ])
)

analyse_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "vllm",
        "huggingface_hub",
        "fastapi[standard]",
    ])
)


@app.function(
    image=base_image,
    volumes={"/model-weights": volume},
    timeout=7200,
    secrets=[
        modal.Secret.from_name("digital-legacy-b2"),
        modal.Secret.from_name("huggingface"),
    ],
)
def download_models() -> None:
    import os
    from pathlib import Path

    from huggingface_hub import snapshot_download

    def write_text(path: str, content: str) -> None:
        Path(path).write_text(content, encoding="utf-8")

    base_path = "/model-weights"
    hf_token = os.environ.get("HF_TOKEN")
    models = [
        {
            "repo_id": "meta-llama/Llama-3.1-8B-Instruct",
            "local_dir": f"{base_path}/llama-3.1-8b-instruct",
            "token": hf_token,
            "token_required": True,
        },
        {
            "repo_id": "coqui/XTTS-v2",
            "local_dir": f"{base_path}/xtts-v2",
            "token": None,
            "token_required": False,
        },
        {
            "repo_id": "Systran/faster-whisper-large-v3",
            "local_dir": f"{base_path}/faster-whisper-large-v3",
            "token": None,
            "token_required": False,
        },
        {
            "repo_id": "nomic-ai/nomic-embed-text-v1.5",
            "local_dir": f"{base_path}/nomic-embed-text",
            "token": None,
            "token_required": False,
        },
    ]

    if not hf_token:
        raise ValueError("HF_TOKEN is required for gated model downloads.")

    for model in models:
        local_dir = model["local_dir"]
        marker_path = f"{local_dir}/.download-complete"

        if os.path.exists(local_dir) and os.path.exists(marker_path):
            print(f"[SKIP] {model['repo_id']}")
            continue

        print(f"[DOWNLOADING] {model['repo_id']}")
        snapshot_download(
            repo_id=model["repo_id"],
            local_dir=local_dir,
            token=model["token"],
        )
        write_text(marker_path, "ok\n")
        volume.commit()
        print(f"[DONE] {model['repo_id']}")

    os.makedirs(f"{base_path}/adapters", exist_ok=True)
    volume.commit()
    print("Download complete.")


@app.function(
    image=embed_image,
    gpu="T4",
    volumes={"/model-weights": volume},
    secrets=[modal.Secret.from_name("digital-legacy-b2")],
    timeout=120,
    scaledown_window=30,
)
@modal.fastapi_endpoint(method="POST")
def embed(item: dict) -> dict:
    from sentence_transformers import SentenceTransformer

    texts = require_texts(item)
    model = SentenceTransformer(
        "/model-weights/nomic-embed-text",
        trust_remote_code=True,
    )
    embeddings = model.encode(texts, normalize_embeddings=True)
    return {"embeddings": embeddings.tolist()}


@app.function(
    image=stt_image,
    gpu="T4",
    volumes={"/model-weights": volume},
    secrets=[modal.Secret.from_name("digital-legacy-b2")],
    timeout=120,
    scaledown_window=120,
)
@modal.fastapi_endpoint(method="POST")
def stt(item: dict) -> dict:
    import base64
    import os
    import tempfile

    from faster_whisper import WhisperModel

    audio_bytes = base64.b64decode(require_non_empty_string(item, "audio_base64"))
    language = item.get("language", "en")
    if not isinstance(language, str) or not language.strip():
        raise ValueError("language must be a non-empty string")

    model = WhisperModel(
        "/model-weights/faster-whisper-large-v3",
        device="cuda",
        compute_type="float16",
    )

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
        temp_file.write(audio_bytes)
        temp_path = temp_file.name

    try:
        segments, info = model.transcribe(temp_path, language=language.strip())
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

    transcript = " ".join(segment.text for segment in segments).strip()

    return {
        "transcript": transcript,
        "duration_seconds": info.duration,
    }


@app.function(
    image=tts_image,
    gpu="A10G",
    volumes={"/model-weights": volume},
    secrets=[modal.Secret.from_name("digital-legacy-b2")],
    timeout=120,
    scaledown_window=120,
)
@modal.fastapi_endpoint(method="POST")
def tts(item: dict) -> dict:
    import base64
    import os
    import tempfile
    import wave

    import boto3
    from fastapi import HTTPException
    from TTS.api import TTS as CoquiTTS

    text = require_non_empty_string(item, "text")
    speaker_b2_key = item.get("speaker_wav_b2_key")
    language = item.get("language", "en")
    if not isinstance(language, str) or not language.strip():
        raise ValueError("language must be a non-empty string")
    if speaker_b2_key is not None and (
        not isinstance(speaker_b2_key, str) or not speaker_b2_key.strip()
    ):
        raise ValueError("speaker_wav_b2_key must be null or a non-empty string")
    if speaker_b2_key is None:
        raise HTTPException(
            status_code=400,
            detail="speaker_wav_b2_key is required until a default voice sample is configured.",
        )

    speaker_path = None
    if speaker_b2_key:
        s3 = boto3.client(
            "s3",
            endpoint_url=os.environ["B2_ENDPOINT"],
            aws_access_key_id=os.environ["B2_KEY_ID"],
            aws_secret_access_key=os.environ["B2_APP_KEY"],
        )
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            speaker_path = temp_file.name
            s3.download_fileobj(os.environ["B2_BUCKET_NAME"], speaker_b2_key.strip(), temp_file)

    model = CoquiTTS(
        model_path="/model-weights/xtts-v2/model.pth",
        config_path="/model-weights/xtts-v2/config.json",
    )
    model.to("cuda")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as output_file:
        output_path = output_file.name

    try:
        model.tts_to_file(
            text=text,
            speaker_wav=speaker_path,
            language=language.strip(),
            file_path=output_path,
        )

        with open(output_path, "rb") as output_file:
            audio_b64 = base64.b64encode(output_file.read()).decode()
        with wave.open(output_path, "rb") as wav_file:
            duration_seconds = wav_file.getnframes() / float(wav_file.getframerate())
    finally:
        if os.path.exists(output_path):
            os.unlink(output_path)
        if speaker_path and os.path.exists(speaker_path):
            os.unlink(speaker_path)

    return {"audio_base64": audio_b64, "duration_seconds": duration_seconds}


@app.function(
    image=infer_image,
    gpu="A10G",
    volumes={"/model-weights": volume},
    secrets=[
        modal.Secret.from_name("digital-legacy-b2"),
        modal.Secret.from_name("huggingface"),
    ],
    timeout=600,
    scaledown_window=600,
)
@modal.fastapi_endpoint(method="POST")
def infer(item: dict) -> dict:
    import os

    os.environ.setdefault("VLLM_USE_FLASHINFER_SAMPLER", "0")

    from vllm import LLM, SamplingParams
    from vllm.lora.request import LoRARequest

    system_prompt = require_non_empty_string(item, "system_prompt")
    messages = require_messages(item)
    max_tokens = item.get("max_tokens", 512)
    temperature = item.get("temperature", 0.7)
    persona_slug = normalize_persona_slug(item.get("persona_slug"))

    prompt = f"<|system|>\n{system_prompt}\n"
    for message in messages:
        role = message["role"]
        content = message["content"]
        prompt += f"<|{role}|>\n{content}\n"
    prompt += "<|assistant|>\n"

    llm = LLM(
        model="/model-weights/llama-3.1-8b-instruct",
        enable_lora=True,
        max_model_len=8192,
    )

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


@app.function(
    image=analyse_image,
    gpu="A10G",
    volumes={"/model-weights": volume},
    secrets=[
        modal.Secret.from_name("digital-legacy-b2"),
        modal.Secret.from_name("huggingface"),
    ],
    timeout=600,
    scaledown_window=600,
)
@modal.fastapi_endpoint(method="POST")
def analyse(item: dict) -> dict:
    import json
    import os

    os.environ.setdefault("VLLM_USE_FLASHINFER_SAMPLER", "0")

    from vllm import LLM, SamplingParams

    retry_instruction = "Your response must be valid JSON only. No preamble, no explanation."
    emotion_labels = [
        "warm",
        "sad",
        "frustrated",
        "anxious",
        "amused",
        "tender",
        "indignant",
        "reflective",
    ]
    trait_schema = {
        "type": "object",
        "properties": {
            "openness": {"type": "number", "minimum": 0, "maximum": 1},
            "conscientiousness": {"type": "number", "minimum": 0, "maximum": 1},
            "extraversion": {"type": "number", "minimum": 0, "maximum": 1},
            "agreeableness": {"type": "number", "minimum": 0, "maximum": 1},
            "neuroticism": {"type": "number", "minimum": 0, "maximum": 1},
            "narrative_agency": {"type": "number", "minimum": 0, "maximum": 1},
            "narrative_communion": {"type": "number", "minimum": 0, "maximum": 1},
            "narrative_redemption": {"type": "number", "minimum": 0, "maximum": 1},
            "dominant_values": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "summary_prose": {"type": "string"},
            "identity_block": {"type": "string"},
        },
        "required": [
            "openness",
            "conscientiousness",
            "extraversion",
            "agreeableness",
            "neuroticism",
            "narrative_agency",
            "narrative_communion",
            "narrative_redemption",
            "dominant_values",
            "summary_prose",
            "identity_block",
        ],
        "additionalProperties": False,
    }
    emotion_schema = {
        "type": "object",
        "properties": {
            "emotion_label": {"type": "string", "enum": emotion_labels},
            "intensity": {"type": "number", "minimum": 0, "maximum": 1},
        },
        "required": ["emotion_label", "intensity"],
        "additionalProperties": False,
    }

    task = item.get("task")
    if not isinstance(task, str) or task not in {"trait_inference", "emotion_classify"}:
        raise ValueError("task must be trait_inference or emotion_classify")

    input_text = require_non_empty_string(item, "input")
    schema = trait_schema if task == "trait_inference" else emotion_schema
    max_tokens = 1024 if task == "trait_inference" else 64

    def build_prompt(extra_instruction: str | None = None) -> str:
        if task == "trait_inference":
            system_prompt = """You are a careful personality psychologist analysing a corpus of diary entries and interview subject turns.
Return only valid JSON matching the requested schema.
Score all numeric fields from 0.0 to 1.0.
Write summary_prose as a concise prose analysis.
Write identity_block as a static first-person identity description suitable for a persona system prompt."""
            user_prompt = f"Analyse this corpus:\n\n{input_text}"
        else:
            system_prompt = """You classify the emotional register of a short generated response.
Return only valid JSON matching the requested schema.
Choose exactly one emotion_label from: warm, sad, frustrated, anxious, amused, tender, indignant, reflective.
Score intensity from 0.0 to 1.0."""
            user_prompt = f"Classify this passage:\n\n{input_text}"

        if extra_instruction:
            system_prompt = f"{system_prompt}\n{extra_instruction}"

        return f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n"

    def create_sampling_params() -> SamplingParams:
        try:
            from vllm.sampling_params import StructuredOutputsParams

            return SamplingParams(
                temperature=0.2,
                max_tokens=max_tokens,
                structured_outputs=StructuredOutputsParams(
                    json=schema,
                    backend="outlines",
                ),
            )
        except (ImportError, TypeError):
            from vllm.sampling_params import GuidedDecodingParams

            return SamplingParams(
                temperature=0.2,
                max_tokens=max_tokens,
                guided_decoding=GuidedDecodingParams.from_optional(
                    json=schema,
                    backend="outlines",
                ),
            )

    def parse_model_json(text: str) -> dict:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`").strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()

        result = json.loads(cleaned)
        if not isinstance(result, dict):
            raise ValueError("model output must be a JSON object")
        return result

    def validate_unit_number(value: object, field: str) -> float:
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise ValueError(f"{field} must be a number")
        normalized = float(value)
        if normalized < 0 or normalized > 1:
            raise ValueError(f"{field} must be between 0 and 1")
        return normalized

    def validate_result(value: dict) -> dict:
        if task == "trait_inference":
            result = {
                "openness": validate_unit_number(value.get("openness"), "openness"),
                "conscientiousness": validate_unit_number(
                    value.get("conscientiousness"),
                    "conscientiousness",
                ),
                "extraversion": validate_unit_number(
                    value.get("extraversion"),
                    "extraversion",
                ),
                "agreeableness": validate_unit_number(
                    value.get("agreeableness"),
                    "agreeableness",
                ),
                "neuroticism": validate_unit_number(
                    value.get("neuroticism"),
                    "neuroticism",
                ),
                "narrative_agency": validate_unit_number(
                    value.get("narrative_agency"),
                    "narrative_agency",
                ),
                "narrative_communion": validate_unit_number(
                    value.get("narrative_communion"),
                    "narrative_communion",
                ),
                "narrative_redemption": validate_unit_number(
                    value.get("narrative_redemption"),
                    "narrative_redemption",
                ),
            }
            dominant_values = value.get("dominant_values")
            summary_prose = value.get("summary_prose")
            identity_block = value.get("identity_block")

            if (
                not isinstance(dominant_values, list)
                or not dominant_values
                or not all(
                    isinstance(entry, str) and entry.strip()
                    for entry in dominant_values
                )
            ):
                raise ValueError("dominant_values must be a non-empty string array")
            if not isinstance(summary_prose, str) or not summary_prose.strip():
                raise ValueError("summary_prose must be a non-empty string")
            if not isinstance(identity_block, str) or not identity_block.strip():
                raise ValueError("identity_block must be a non-empty string")

            result["dominant_values"] = [
                entry.strip() for entry in dominant_values if entry.strip()
            ]
            result["summary_prose"] = summary_prose.strip()
            result["identity_block"] = identity_block.strip()
            return result

        emotion_label = value.get("emotion_label")
        if emotion_label not in emotion_labels:
            raise ValueError("emotion_label is invalid")

        return {
            "emotion_label": emotion_label,
            "intensity": validate_unit_number(value.get("intensity"), "intensity"),
        }

    llm = LLM(
        model="/model-weights/llama-3.1-8b-instruct",
        max_model_len=8192,
    )
    sampling_params = create_sampling_params()

    for attempt in range(2):
        prompt = build_prompt(retry_instruction if attempt == 1 else None)
        outputs = llm.generate([prompt], sampling_params)
        text = outputs[0].outputs[0].text.strip()

        try:
            return {"result": validate_result(parse_model_json(text))}
        except (json.JSONDecodeError, ValueError):
            if attempt == 1:
                return {"error": "parse_failed"}

    return {"error": "parse_failed"}
