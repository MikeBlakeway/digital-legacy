from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import runpod
from sentence_transformers import SentenceTransformer

NETWORK_VOLUME_PATH = Path(os.getenv("NETWORK_VOLUME_PATH", "/runpod-volume"))
MODEL_PATH = NETWORK_VOLUME_PATH / "nomic-embed-text"

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model

    if _model is None:
        _model = SentenceTransformer(str(MODEL_PATH), trust_remote_code=True)

    return _model


def handler(job: dict[str, Any]) -> dict[str, list[list[float]]]:
    input_data = get_input(job)
    texts = require_texts(input_data)

    embeddings = get_model().encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )

    return {"embeddings": embeddings.astype(float).tolist()}


def get_input(job: dict[str, Any]) -> dict[str, Any]:
    input_data = job.get("input")

    if not isinstance(input_data, dict):
        raise ValueError("RunPod job must include an input object.")

    return input_data


def require_texts(input_data: dict[str, Any]) -> list[str]:
    value = input_data.get("texts")

    if not isinstance(value, list) or not value:
        raise ValueError("input.texts must be a non-empty string array.")

    texts: list[str] = []

    for index, text in enumerate(value):
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"input.texts[{index}] must be a non-empty string.")

        texts.append(text.strip())

    return texts


if os.getenv("EAGER_LOAD_MODELS", "1") != "0":
    get_model()


runpod.serverless.start({"handler": handler})
