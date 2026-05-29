from __future__ import annotations

from collections.abc import Callable


def download_models_impl(
    *,
    snapshot_download: Callable[..., object],
    path_exists: Callable[[str], bool],
    list_dir: Callable[[str], list[str]],
    make_dirs: Callable[..., object],
    write_text: Callable[[str, str], object],
    commit: Callable[[], object],
    base_path: str,
    hf_token: str | None,
    logger: Callable[[str], object] = print,
) -> dict[str, int]:
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
        for model in models:
            if model["token_required"]:
                raise ValueError("HF_TOKEN is required for gated model downloads.")

    downloaded = 0
    skipped = 0

    for model in models:
        local_dir = model["local_dir"]
        marker_path = f"{local_dir}/.download-complete"

        if path_exists(local_dir) and path_exists(marker_path):
            logger(f"[SKIP] {model['repo_id']}")
            skipped += 1
            continue

        logger(f"[DOWNLOADING] {model['repo_id']}")
        snapshot_download(
            repo_id=model["repo_id"],
            local_dir=local_dir,
            token=model["token"],
        )
        write_text(marker_path, "ok\n")
        commit()
        logger(f"[DONE] {model['repo_id']}")
        downloaded += 1

    make_dirs(f"{base_path}/adapters", exist_ok=True)
    commit()
    logger("Download complete.")

    return {"downloaded": downloaded, "skipped": skipped}
