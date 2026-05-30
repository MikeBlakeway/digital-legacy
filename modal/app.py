import modal

from download_models_impl import download_models_impl


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
    .pip_install(["huggingface_hub", "boto3"])
)

embed_image = base_image.pip_install([
    "sentence-transformers",
    "torch",
])

stt_image = base_image.pip_install([
    "faster-whisper",
    "torch",
])

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

    download_models_impl(
        snapshot_download=snapshot_download,
        path_exists=os.path.exists,
        list_dir=os.listdir,
        make_dirs=os.makedirs,
        write_text=write_text,
        commit=volume.commit,
        base_path="/model-weights",
        hf_token=os.environ.get("HF_TOKEN"),
    )


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

    import boto3
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

    model = CoquiTTS("tts_models/multilingual/multi-dataset/xtts_v2")
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
    finally:
        if os.path.exists(output_path):
            os.unlink(output_path)
        if speaker_path and os.path.exists(speaker_path):
            os.unlink(speaker_path)

    return {"audio_base64": audio_b64}


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
