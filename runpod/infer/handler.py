from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import runpod
from vllm import LLM, SamplingParams
from vllm.lora.request import LoRARequest

NETWORK_VOLUME_PATH = Path(os.getenv("NETWORK_VOLUME_PATH", "/runpod-volume"))
MODEL_PATH = NETWORK_VOLUME_PATH / "llama-3.1-8b-instruct"
ADAPTERS_PATH = NETWORK_VOLUME_PATH / "adapters"

_llm: LLM | None = None


def get_llm() -> LLM:
    global _llm

    if _llm is None:
        _llm = LLM(
            model=str(MODEL_PATH),
            enable_lora=True,
            max_lora_rank=int(os.getenv("MAX_LORA_RANK", "16")),
            trust_remote_code=True,
        )

    return _llm


def handler(job: dict[str, Any]) -> dict[str, str]:
    input_data = get_input(job)
    system_prompt = require_string(input_data, "system_prompt")
    messages = require_messages(input_data)
    max_tokens = int(input_data.get("max_tokens", 512))
    temperature = float(input_data.get("temperature", 0.7))
    persona_slug = input_data.get("persona_slug")

    prompt = build_chatml_prompt(system_prompt, messages)
    sampling_params = SamplingParams(max_tokens=max_tokens, temperature=temperature)
    lora_request = get_lora_request(persona_slug)

    outputs = get_llm().generate(
        [prompt],
        sampling_params,
        lora_request=lora_request,
    )
    text = outputs[0].outputs[0].text.strip()

    return {"text": text}


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


def require_messages(input_data: dict[str, Any]) -> list[dict[str, str]]:
    value = input_data.get("messages")

    if not isinstance(value, list):
        raise ValueError("input.messages must be an array.")

    messages: list[dict[str, str]] = []

    for index, message in enumerate(value):
        if not isinstance(message, dict):
            raise ValueError(f"input.messages[{index}] must be an object.")

        role = message.get("role")
        content = message.get("content")

        if role not in {"user", "assistant"}:
            raise ValueError(f"input.messages[{index}].role must be user or assistant.")

        if not isinstance(content, str) or not content.strip():
            raise ValueError(f"input.messages[{index}].content must be non-empty.")

        messages.append({"role": role, "content": content.strip()})

    return messages


def build_chatml_prompt(system_prompt: str, messages: list[dict[str, str]]) -> str:
    parts = [
        "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n",
        system_prompt,
        "<|eot_id|>",
    ]

    for message in messages:
        parts.extend(
            [
                f"<|start_header_id|>{message['role']}<|end_header_id|>\n\n",
                message["content"],
                "<|eot_id|>",
            ]
        )

    parts.append("<|start_header_id|>assistant<|end_header_id|>\n\n")
    return "".join(parts)


def get_lora_request(persona_slug: Any) -> LoRARequest | None:
    if not isinstance(persona_slug, str) or not persona_slug.strip():
        return None

    adapter_path = ADAPTERS_PATH / persona_slug.strip() / "current"

    if not adapter_path.exists():
        return None

    return LoRARequest(persona_slug.strip(), 1, str(adapter_path))


if os.getenv("EAGER_LOAD_MODELS", "1") != "0":
    get_llm()


runpod.serverless.start({"handler": handler})
