from __future__ import annotations

import base64
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import runpod
from faster_whisper import WhisperModel

NETWORK_VOLUME_PATH = Path(os.getenv("NETWORK_VOLUME_PATH", "/runpod-volume"))
MODEL_PATH = NETWORK_VOLUME_PATH / "faster-whisper-large-v3"

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model

    if _model is None:
        _model = WhisperModel(
            str(MODEL_PATH),
            device=os.getenv("WHISPER_DEVICE", "cuda"),
            compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "float16"),
        )

    return _model


def handler(job: dict[str, Any]) -> dict[str, str | float]:
    input_data = get_input(job)
    audio_base64 = require_string(input_data, "audio_base64")
    language = input_data.get("language", "en")

    if not isinstance(language, str) or not language.strip():
        raise ValueError("input.language must be a non-empty string.")

    with TemporaryDirectory() as temp_dir:
        audio_path = Path(temp_dir) / "input_audio"
        audio_path.write_bytes(base64.b64decode(audio_base64))

        segments, info = get_model().transcribe(
            str(audio_path),
            language=language.strip(),
            vad_filter=True,
        )
        transcript = " ".join(segment.text.strip() for segment in segments).strip()

    return {
        "transcript": transcript,
        "duration_seconds": float(info.duration or 0.0),
    }


def get_input(job: dict[str, Any]) -> dict[str, Any]:
    input_data = job.get("input")

    if not isinstance(input_data, dict):
        raise ValueError("RunPod job must include an input object.")

    return input_data


def require_string(input_data: dict[str, Any], key: str) -> str:
    value = input_data.get(key)

    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"input.{key} must be a non-empty string.")

    return value.strip()


if os.getenv("EAGER_LOAD_MODELS", "1") != "0":
    get_model()


runpod.serverless.start({"handler": handler})
