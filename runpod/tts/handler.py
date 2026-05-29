from __future__ import annotations

import base64
import os
import wave
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import boto3
import runpod
from TTS.api import TTS

NETWORK_VOLUME_PATH = Path(os.getenv("NETWORK_VOLUME_PATH", "/runpod-volume"))
MODEL_PATH = NETWORK_VOLUME_PATH / "xtts-v2"

_tts: TTS | None = None
_s3_client = None


def get_tts() -> TTS:
    global _tts

    if _tts is None:
        config_path = MODEL_PATH / "config.json"
        _tts = TTS(
            model_path=str(MODEL_PATH),
            config_path=str(config_path) if config_path.exists() else None,
            gpu=True,
        )

    return _tts


def get_s3_client():
    global _s3_client

    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=normalize_endpoint(require_env("B2_ENDPOINT")),
            aws_access_key_id=require_env("B2_KEY_ID"),
            aws_secret_access_key=require_env("B2_APP_KEY"),
            region_name=os.getenv("B2_REGION", "us-west-004"),
        )

    return _s3_client


def handler(job: dict[str, Any]) -> dict[str, str | float]:
    input_data = get_input(job)
    text = require_string(input_data, "text")
    speaker_wav_b2_key = require_string(input_data, "speaker_wav_b2_key")
    language = input_data.get("language", "en")

    if not isinstance(language, str) or not language.strip():
        raise ValueError("input.language must be a non-empty string.")

    with TemporaryDirectory() as temp_dir:
        speaker_path = Path(temp_dir) / "speaker.wav"
        output_path = Path(temp_dir) / "response.wav"

        download_b2_object(speaker_wav_b2_key, speaker_path)
        get_tts().tts_to_file(
            text=text,
            speaker_wav=str(speaker_path),
            language=language.strip(),
            file_path=str(output_path),
        )

        audio_bytes = output_path.read_bytes()

    return {
        "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
        "duration_seconds": get_wav_duration_seconds(audio_bytes),
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


def download_b2_object(key: str, destination: Path) -> None:
    get_s3_client().download_file(require_env("B2_BUCKET_NAME"), key, str(destination))


def get_wav_duration_seconds(audio_bytes: bytes) -> float:
    with TemporaryDirectory() as temp_dir:
        audio_path = Path(temp_dir) / "audio.wav"
        audio_path.write_bytes(audio_bytes)

        with wave.open(str(audio_path), "rb") as audio_file:
            frames = audio_file.getnframes()
            frame_rate = audio_file.getframerate()

    return frames / float(frame_rate)


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()

    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")

    return value


def normalize_endpoint(endpoint: str) -> str:
    if endpoint.startswith(("http://", "https://")):
        return endpoint

    return f"https://{endpoint}"


if os.getenv("EAGER_LOAD_MODELS", "1") != "0":
    get_tts()


runpod.serverless.start({"handler": handler})
