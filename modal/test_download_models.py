import unittest

from download_models_impl import download_models_impl


class DownloadModelsTests(unittest.TestCase):
    def test_download_models_skips_existing_model_dirs(self) -> None:
        base = "/model-weights"
        existing = {
            f"{base}/llama-3.1-8b-instruct",
            f"{base}/llama-3.1-8b-instruct/.download-complete",
        }
        snapshot_calls: list[dict[str, object]] = []

        result = download_models_impl(
            snapshot_download=lambda **kwargs: snapshot_calls.append(kwargs),
            path_exists=lambda path: path in existing,
            list_dir=lambda path: ["weights.bin"] if path in existing else [],
            make_dirs=lambda *_args, **_kwargs: None,
            write_text=lambda *_args, **_kwargs: None,
            commit=lambda: None,
            base_path=base,
            hf_token="token-abc",
            logger=lambda _message: None,
        )

        repos = [call["repo_id"] for call in snapshot_calls]
        self.assertNotIn("meta-llama/Llama-3.1-8B-Instruct", repos)
        self.assertEqual(result["skipped"], 1)

    def test_download_models_commits_after_each_model(self) -> None:
        snapshot_calls: list[dict[str, object]] = []
        commit_count = 0

        def commit() -> None:
            nonlocal commit_count
            commit_count += 1

        download_models_impl(
            snapshot_download=lambda **kwargs: snapshot_calls.append(kwargs),
            path_exists=lambda _path: False,
            list_dir=lambda _path: [],
            make_dirs=lambda *_args, **_kwargs: None,
            write_text=lambda *_args, **_kwargs: None,
            commit=commit,
            base_path="/model-weights",
            hf_token="token-abc",
            logger=lambda _message: None,
        )

        self.assertEqual(len(snapshot_calls), 4)
        self.assertEqual(commit_count, 5)

    def test_download_models_creates_adapters_directory(self) -> None:
        mkdir_calls: list[dict[str, object]] = []

        download_models_impl(
            snapshot_download=lambda **_kwargs: None,
            path_exists=lambda _path: True,
            list_dir=lambda _path: ["existing"],
            make_dirs=lambda path, exist_ok=False: mkdir_calls.append(
                {"path": path, "exist_ok": exist_ok}
            ),
            write_text=lambda *_args, **_kwargs: None,
            commit=lambda: None,
            base_path="/model-weights",
            hf_token="token-abc",
            logger=lambda _message: None,
        )

        self.assertIn(
            {"path": "/model-weights/adapters", "exist_ok": True},
            mkdir_calls,
        )

    def test_download_models_requires_hf_token_for_gated_repo(self) -> None:
        with self.assertRaisesRegex(ValueError, "HF_TOKEN is required"):
            download_models_impl(
                snapshot_download=lambda **_kwargs: None,
                path_exists=lambda _path: False,
                list_dir=lambda _path: [],
                make_dirs=lambda *_args, **_kwargs: None,
                write_text=lambda *_args, **_kwargs: None,
                commit=lambda: None,
                base_path="/model-weights",
                hf_token=None,
                logger=lambda _message: None,
            )

    def test_download_models_passes_token_only_to_gated_repo(self) -> None:
        snapshot_calls: list[dict[str, object]] = []

        download_models_impl(
            snapshot_download=lambda **kwargs: snapshot_calls.append(kwargs),
            path_exists=lambda _path: False,
            list_dir=lambda _path: [],
            make_dirs=lambda *_args, **_kwargs: None,
            write_text=lambda *_args, **_kwargs: None,
            commit=lambda: None,
            base_path="/model-weights",
            hf_token="token-abc",
            logger=lambda _message: None,
        )

        token_by_repo = {call["repo_id"]: call["token"] for call in snapshot_calls}
        self.assertEqual(token_by_repo["meta-llama/Llama-3.1-8B-Instruct"], "token-abc")
        self.assertIsNone(token_by_repo["coqui/XTTS-v2"])
        self.assertIsNone(token_by_repo["Systran/faster-whisper-large-v3"])
        self.assertIsNone(token_by_repo["nomic-ai/nomic-embed-text-v1.5"])

    def test_download_models_non_marker_dir_is_not_skipped(self) -> None:
        base = "/model-weights"
        existing = {f"{base}/llama-3.1-8b-instruct"}
        snapshot_calls: list[dict[str, object]] = []

        download_models_impl(
            snapshot_download=lambda **kwargs: snapshot_calls.append(kwargs),
            path_exists=lambda path: path in existing,
            list_dir=lambda _path: ["partial.bin"],
            make_dirs=lambda *_args, **_kwargs: None,
            write_text=lambda *_args, **_kwargs: None,
            commit=lambda: None,
            base_path=base,
            hf_token="token-abc",
            logger=lambda _message: None,
        )

        repos = [call["repo_id"] for call in snapshot_calls]
        self.assertIn("meta-llama/Llama-3.1-8B-Instruct", repos)


if __name__ == "__main__":
    unittest.main()
