## Plan: Migrate AI Endpoints from RunPod to Modal

This plan fully replaces RunPod with Modal across infrastructure, application code, scripts, and documentation. It uses incremental TDD phases to preserve request and response contracts while removing all RunPod code paths. The migration is a direct cutover with no dual-provider compatibility layer.

**Phases 6**
1. **Phase 1: Create Modal App and Shared Runtime**
    - **Objective:** Add the Modal application entrypoint with shared volume, base image config, and deployable structure.
    - **Files/Functions to Modify/Create:** `modal/app.py` (new)
    - **Tests to Write:**
      - `modal_app_exports_expected_symbols`
      - `modal_volume_configured_for_model_weights`
      - `modal_images_build_with_required_packages`
    - **Steps:**
        1. Write failing tests that assert app, volume, and per-function image configuration are defined in `modal/app.py`.
        2. Implement `app = modal.App("digital-legacy")`, `volume = modal.Volume.from_name("digital-legacy-weights", create_if_missing=True)`, and shared image configuration.
      3. Wire secrets in function decorators so each function includes `secrets=[modal.Secret.from_name("digital-legacy-b2")]`.
      4. Ensure `download_models` and `infer` additionally include `modal.Secret.from_name("huggingface")` and create this Modal secret with key `HF_TOKEN` before Phase 2 execution.
      5. Run tests and confirm they pass with the new module structure.

2. **Phase 2: Implement Volume Model Bootstrap Function**
    - **Objective:** Replace the old temporary download approach with a Modal volume bootstrap function.
    - **Files/Functions to Modify/Create:** `modal/app.py` (`download_models`)
    - **Tests to Write:**
      - `download_models_skips_existing_model_dirs`
      - `download_models_commits_after_each_model`
      - `download_models_creates_adapters_directory`
    - **Steps:**
        1. Write failing tests for model skip logic, per-model commit behavior, and adapters directory creation.
        2. Implement `download_models` using `snapshot_download` and `volume.commit()` after each model.
      3. Re-run tests and confirm idempotent behavior.
      4. After tests pass, run `modal run modal/app.py::download_models`.
      5. Monitor progress in Modal Logs, expect 60-90 minutes, and confirm all four model directories exist in the volume before starting Phase 3.

3. **Phase 3: Implement Four Modal Web Endpoints**
    - **Objective:** Build synchronous Modal endpoints for `embed`, `stt`, `tts`, and `infer` using the specified GPU/runtime settings.
    - **Files/Functions to Modify/Create:** `modal/app.py` (`embed`, `stt`, `tts`, `infer`)
    - **Tests to Write:**
      - `embed_returns_embedding_matrix`
      - `stt_decodes_audio_and_returns_transcript`
      - `tts_returns_audio_base64`
      - `infer_builds_prompt_and_returns_text`
      - `infer_uses_lora_when_adapter_exists`
    - **Steps:**
        1. Write failing contract tests for each endpoint payload and response shape.
      2. Implement each endpoint in `modal/app.py` with the specified dependencies and explicit warm-window settings: `infer=600`, `tts=120`, `stt=120`, `embed=30` for `scaledown_window`.
      3. Ensure each endpoint decorator includes `secrets=[modal.Secret.from_name("digital-legacy-b2")]`.
      4. Run tests and verify all contract expectations pass.
      5. Deploy with `modal deploy modal/app.py`, capture the four printed endpoint URLs, and set `.env.local` and Vercel env vars: `MODAL_EMBED_URL`, `MODAL_STT_URL`, `MODAL_TTS_URL`, `MODAL_INFER_URL` before starting Phase 4.

4. **Phase 4: Replace RunPod TypeScript Client with Modal Client**
    - **Objective:** Remove RunPod polling and endpoint-ID patterns, replacing them with direct synchronous Modal URL calls.
    - **Files/Functions to Modify/Create:**
      - `src/lib/runpod/client.ts`
      - `src/lib/runpod/infer.ts`
      - `src/lib/runpod/embed.ts`
      - `src/lib/runpod/stt.ts`
      - `src/lib/runpod/tts.ts`
    - **Tests to Write:**
      - `client_posts_to_modal_url_with_json`
      - `infer_uses_abortsignal_timeout_590_seconds`
      - `wrapper_modules_preserve_contract_shapes`
    - **Steps:**
        1. Write failing tests that prove RunPod async polling is no longer expected.
        2. Refactor the client and wrappers to use `MODAL_INFER_URL`, `MODAL_TTS_URL`, `MODAL_STT_URL`, and `MODAL_EMBED_URL`.
        3. Simplify `infer.ts` to single-request synchronous `fetch` with `AbortSignal.timeout(590_000)`.
        4. Run tests and confirm behavior parity.

5. **Phase 5: Rename Provider Namespace and Remove RunPod Code**
    - **Objective:** Perform direct replacement by renaming provider modules and deleting all RunPod runtime assets.
    - **Files/Functions to Modify/Create:**
      - `src/lib/runpod/` -> `src/lib/ai/` (rename)
      - `src/lib/rag/embed.ts` (imports)
      - `src/lib/rag/retrieve.ts` (imports)
      - `scripts/test_endpoints.ts` (imports/env usage)
      - `runpod/` (delete entire directory)
    - **Tests to Write:**
      - `core_modules_contract_uses_ai_namespace`
      - `rag_modules_import_from_ai_namespace`
      - `no_runpod_imports_remaining`
    - **Steps:**
        1. Write failing import/path tests for `src/lib/ai` migration.
        2. Rename `src/lib/runpod` to `src/lib/ai` and update all imports.
        3. Delete the `runpod/` directory and remove dead references.
        4. Run tests to ensure no runtime/module regressions.

6. **Phase 6: Environment, Validation Script, and Documentation Finalization**
    - **Objective:** Finalize operational setup with new env variables, new validation script name, and deployment/setup documentation.
    - **Files/Functions to Modify/Create:**
      - `.env.example`
      - `README.md`
      - `scripts/validate_modal_task_1_3.mjs` (new)
      - `scripts/test_endpoints.ts`
      - `docs/digital-legacy-architecture.md`
    - **Tests to Write:**
      - `env_example_contains_modal_variables_only`
      - `endpoint_test_script_reads_modal_urls`
      - `validate_modal_script_checks_expected_modal_structure`
    - **Steps:**
        1. Write failing checks for required `MODAL_*_URL` variables and absence of `RUNPOD_*` variables.
        2. Add `scripts/validate_modal_task_1_3.mjs` and retire the RunPod validation script.
        3. Update `README.md` with named Vercel project env setup instructions for all `MODAL_*_URL` variables.
        4. Update architecture docs and run the updated test scripts.

**Open Questions (resolved by user)**
1. RunPod fallback retention: resolved as delete all RunPod code.
2. Namespace strategy: resolved as direct replacement and migration to `src/lib/ai`.
3. Vercel environment guidance: resolved as explicit named env setup in `README.md`.
4. Validation script naming: resolved as a new Modal-specific script.
5. Cutover mode: resolved as direct replacement with no dual-provider period.
