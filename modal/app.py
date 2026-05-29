import modal


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
    raise NotImplementedError("Implemented in Phase 2")


@app.function(
    image=embed_image,
    gpu="T4",
    volumes={"/model-weights": volume},
    secrets=[modal.Secret.from_name("digital-legacy-b2")],
    timeout=120,
    scaledown_window=30,
)
@modal.web_endpoint(method="POST")
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
@modal.web_endpoint(method="POST")
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
@modal.web_endpoint(method="POST")
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
@modal.web_endpoint(method="POST")
def infer(item: dict) -> dict:
    raise NotImplementedError("Implemented in Phase 3")
