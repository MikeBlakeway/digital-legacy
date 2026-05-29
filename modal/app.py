import modal

from download_models_impl import download_models_impl


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
    raise NotImplementedError("Implemented in Phase 3")


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
    raise NotImplementedError("Implemented in Phase 3")


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
    raise NotImplementedError("Implemented in Phase 3")


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
    raise NotImplementedError("Implemented in Phase 3")
