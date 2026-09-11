# Digital Legacy — Avatar & Conversational AI Research Summary

**Session date:** June 2026  
**Author:** Mike Blakeway  
**Status:** Research notes — inform Phase 2 and Phase 3 architecture decisions  
**Scope:** Real-time avatar synthesis, full-duplex conversation, persona fidelity, Presence Ladder implementation

---

## 1. Context and framing

This session examined the technical feasibility of implementing each tier of the Presence Ladder — the four-tier conversation architecture defined in the vision document — with specific focus on the avatar (Tier 1), the latency problem, and the conflict between conversational naturalness and persona fidelity. The conclusions reached here supersede earlier conservative estimates that were calibrated for time-to-market constraints. This project is not time-constrained; quality and correctness of representation are the primary goals.

### The Presence Ladder (reference)

| Tier | Name | UX metaphor | Delivery |
|---|---|---|---|
| 1 | Full avatar | Sharing a physical scene | Buffered |
| 2 | Lipsync avatar | Video call | Sentence-level streaming |
| 3 | Voice | Phone call | Sentence-level streaming |
| 4 | Text | Messaging | Token streaming |

---

## 2. Tier 1 avatar requirements

### Must do
- Produce video of the subject's face and upper body, lip-synced to audio output
- Run entirely on Modal serverless infrastructure — no third-party service receives the subject's video
- Work from real footage captured in diary room sessions, not synthetic generation
- Maintain consistent subject identity across all sessions
- Support buffered delivery (full response generated before playback begins)
- Fail gracefully — if synthesis fails, fall back to the next tier without breaking the conversation
- Support idle states using directed capture footage for between-response fills

### Should do
- Render the subject in a recorded scene background (their actual living room, garden, etc.)
- Show some expressiveness beyond mechanical lip movement — eye movement, head pose, subtle emotion correlation
- Improve quality automatically as more diary footage is captured
- Support multiple reference clips per subject, selected contextually based on emotional register of the response
- Show full body visible in scene (Tier 1 distinction from Tier 2)

### Must not do
- Send any video footage, audio, or generated output to external services (ElevenLabs, HeyGen, Synthesia, D-ID, Runway, or similar)
- Produce obviously synthetic artifacts that break the illusion
- Require per-subject model training before first use — fine-tuning improves quality but is not a prerequisite
- Exceed economically viable per-response compute cost on Modal
- Require real-time inference — Tier 1 is buffered, which is a significant advantage

**Key clarification:** Tier 1 is buffered, not real-time. The complete audio response is generated before video synthesis begins. The latency budget for video synthesis sits inside the "scene establishing" warm-up state, which can run for as long as the experience remains plausible. This substantially widens the viable model set compared to a real-time requirement.

---

## 3. The latency problem: root cause and solution space

### Root cause

The current pipeline architecture is a sequential cascade:

```
User speaks → STT → LLM → TTS → video synthesis → MP4 → browser
```

Every step waits for the previous step to complete. This treats conversation as complete-turn → process → complete-turn. Human conversation is a continuous audio stream where both participants listen and generate simultaneously. The architecture is the mismatch, not the speed of any individual model.

### Two separate problems

The latency problem is actually two problems requiring different solutions.

**Problem 1 — Speech latency (language understanding and generation)**  
Largely solved by 2024 research. Full-duplex speech models (see section 4) eliminate the sequential STT → LLM → TTS chain by processing audio end-to-end without a text intermediate. First-response latency drops dramatically; true barge-in and mid-sentence adjustment become possible.

**Problem 2 — Video synthesis latency**  
Harder, and the frontier research area. The most promising path is 3D Gaussian Splatting (3DGS), which separates a slow one-time fitting step (hours, run once per subject from diary footage) from a fast real-time rendering step. Once fitted, rendering is essentially a graphics operation rather than a neural inference, and can run at 100fps or faster.

---

## 4. Full-duplex speech models

### Moshi (Kyutai, September 2024)
- Full-duplex spoken dialogue model — listens and speaks simultaneously
- Dual-stream architecture: Helium (7B language backbone) + Mimi (neural audio codec)
- Handles interruptions and barge-in natively
- Runs in real-time on a single A100
- Apache 2.0 licence — weights, training code, inference code all released
- **Limitation for this project:** Generates audio in its own voice; no slot for dynamic RAG context injection; no custom voice clone
- **HuggingFace:** `kyutai/moshi`

### LLaMA-Omni (FudanNLP, August 2024)
- Built on Llama 3.1 8B Instruct — the same base model already in use in this project
- Adds a speech encoder on the input side and a streaming speech decoder on the output side
- Response audio begins generating before the full text response is formulated
- Open source — weights and training code on HuggingFace/GitHub
- **Key advantage:** Shared base model means LoRA adapters from persona fine-tuning work may be directly compatible or close to it
- **Limitation:** Voice output baked into model training; no separate swappable TTS for voice cloning
- **This is the recommended base for further adaptation (see section 7)**

### Mini-Omni
- Smaller, faster proof-of-concept in the same direction as LLaMA-Omni
- Demonstrates "think-while-speaking" capability at smaller scale
- Less mature than LLaMA-Omni; useful as a reference implementation

### SpiritLM (Meta)
- Interleaves text and speech tokens
- Shows that text reasoning and speech generation can coexist in the same token stream
- Relevant as an architectural reference for the context injection problem

---

## 5. Video synthesis model landscape

### Portrait animation (audio → talking head)

**EMO (Alibaba Research, 2024)**  
Single reference image → highly expressive talking head video driven by audio. Excellent expression quality, natural eye movement, head pose variation. Very slow: 3–5× real-time on A100. For a 30-second response, expect 90–150 seconds of synthesis. Upper end of viable for Tier 1's buffered delivery.  
- Weights available; no official deployment support

**Hallo / Hallo2 (Fudan University)**  
Similar to EMO, better temporal consistency, more controllable expression. 2–4× real-time on A100. Open source, HuggingFace weights available. Good quality ceiling for a family application. Viable for Tier 1 in a buffered pipeline.

**EchoMimic**  
Positioned between EMO and MuseTalk in the quality/speed tradeoff. Supports head and upper body (not just face). Newer; worth tracking.

**MuseTalk (Microsoft Research)**  
Designed specifically for streaming and near-real-time use. Processes frames online rather than whole-clip. ~Real-time on A10G. Limited expressiveness — primarily lip region, minimal head movement, no emotion correlation. Best speed-to-quality ratio for Tier 2 (lipsync avatar). Viable for Tier 1 MVP if quality expectations are managed.

### Video reenactment (video → face transfer)

**LivePortrait**  
Motion-driven face reenactment (not audio-driven directly). ~100ms per frame on GPU. Excellent identity preservation. Needs a driving video for motion, not audio. Can be combined with an audio-to-motion model as a two-step pipeline. Best quality-to-speed ratio in this category.

**FOMM (First Order Motion Model)**  
Older, faster, lower quality than LivePortrait. Stable and predictable; useful as a fallback reference.

### Lip sync (video in → lip-synced video out)

**Wav2Lip**  
Most widely deployed lip sync model. Fast, reliable, works on existing video. Quality limitation: mouth region visibly lower quality than surrounding face. Acceptable for Tier 2; too limited for Tier 1 quality bar.

**LatentSync**  
Improved Wav2Lip using latent diffusion for the mouth region. Better blending with surrounding face. Reasonable starting point for Tier 1 combined with a head motion model.

**SyncTalk**  
NeRF-based, subject-specific. Requires ~1–2 hours of training on a specific person's footage; after training, inference is fast and identity preservation is excellent. The per-subject requirement is a feature here — diary room footage provides exactly the training data needed. **Relevant for Phase 3 per-subject fine-tuning.**

### Real-time avatar rendering

**3D Gaussian Splatting (GaussianTalker, SplattingAvatar, related work)**  
Fit a 3DGS model of the subject's face and head from video footage. This fitting runs once, takes hours, uses diary room recordings as input. After fitting, rendering is a graphics rasterisation operation — ~100fps or faster on GPU, not neural inference. A small, fast expression network translates audio to expression coefficients that drive the Gaussian model in real-time. Papers demonstrating this approach exist and code is available. **This is the target architecture for Tier 1's video layer.**

### Full-body animation

**AnimateAnyone / MagicAnimate, Champ, CyberHost**  
Full-body avatar synthesis from reference image and motion/audio. Quality significantly behind face-only synthesis. Not recommended for MVP Tier 1. Defer until models mature. The practical Tier 1 approach is face and upper body composited into a scene background, which delivers the "sharing a physical scene" experience without requiring full-body synthesis.

---

## 6. Tier feasibility assessment

### Tier 4 — Text
Already implemented. No further work required in this research area.

### Tier 3 — Voice (phone call)
**Achievable now, with two distinct approaches:**

**Route B — Streaming pipeline with VAD barge-in** (lower risk, start here)  
Keep XTTS v2 for voice fidelity. Restructure pipeline to work sentence-by-sentence: stream LLM tokens → detect sentence boundaries → synthesise per-sentence → begin playback while next sentence generates. Add VAD-based barge-in: detect user speech, stop playback, cancel current generation, restart. First audio in ~3–4 seconds. This is half-duplex with fast turn-taking, not true full-duplex. The avatar cannot incorporate mid-sentence interruptions into an ongoing response, but stops and responds quickly enough to feel natural. Voice clone fidelity preserved.

**Route A — LLaMA-Omni + real-time voice conversion** (more complex, the right long-term direction)  
Replace the Whisper → Llama → XTTS chain with LLaMA-Omni. Add a real-time voice conversion layer (RVC, ~150–200ms additional latency) to map LLaMA-Omni's output audio to the subject's cloned voice. True full-duplex with barge-in and mid-sentence adjustment. Voice quality slightly degraded by the conversion step versus direct XTTS v2 output.

**Recommended sequence:** Build Route B first as infrastructure scaffolding (the WebSocket connection, VAD, audio streaming, session management are needed regardless). Transition to Route A as LLaMA-Omni adaptation matures (see section 7).

### Tier 2 — Lipsync avatar (video call)
**Somewhat achievable now** using a streaming cascade with MuseTalk:
- Extend the Route B streaming pipeline with MuseTalk synthesis per sentence chunk
- Stitch chunks with head pose consistency at boundaries to avoid visible jump cuts
- First video appears in 5–8 seconds; subsequent sentences stream before current finishes

Quality ceiling is limited — primarily lip region, limited expressiveness — but clears the bar for a face-forward video call metaphor. Chunk stitching without jump cuts is the main engineering challenge; no off-the-shelf solution exists for this specific pipeline.

### Tier 1 — Full avatar (sharing a physical scene)
**The 3DGS path is the right target.** Timeline estimate: 12–18 months to a production-ready private implementation, but:
- The fitting work can begin now as diary footage accumulates
- Expression network models will improve in parallel
- Revisit synthesis technology in 6 months with more footage and better models available

**Interim approach:** Use Hallo2 or EchoMimic on A100 in a buffered pipeline. The scene warm-up state covers the generation time. Compositing pipeline (segmentation + background integration) sits on top of whichever synthesis model is used and is shared infrastructure regardless.

---

## 7. The persona fidelity problem

### The core conflict
Full-duplex speech models (Moshi, LLaMA-Omni) achieve natural conversation by processing audio end-to-end without a text intermediate. This is also what prevents them from accepting dynamically injected RAG context. When Llama 3.1 8B responds, it receives a system prompt containing the persona's identity, biographical facts, retrieved memories, and conversation history. Moshi has no equivalent slot. It generates responses based on its training, not on a dynamically injected context about a specific person.

For most conversational AI products, full-duplex mechanics are more valuable than context injection. For Digital Legacy, persona fidelity is the product. Sacrificing it for conversational naturalness is the wrong tradeoff.

### The three adaptation paths

**Path 1 — LoRA fine-tune the language backbone on persona data** (weeks, solo feasible)  
Apply QLoRA to Helium (Moshi) or the Llama backbone (LLaMA-Omni) using the persona's text data — diary transcripts, interview responses, memory training pairs. The full-duplex audio behaviour lives in the model architecture and is not disturbed by language backbone fine-tuning. The model gains persona personality and knowledge at the language level. Voice identity remains a separate problem (real-time voice conversion still required). This is the same skill as the existing Llama fine-tuning, applied to a new target.

**Path 2 — Fine-tune audio generation components on subject's voice** (months, requires ML experience)  
The audio decoder in Mimi (Moshi's codec) or LLaMA-Omni's speech decoder is where voice character lives. Low-rank adaptation of these components on the subject's voice samples (diary room recordings) would embed the subject's voice directly into the model rather than converting it in post. More tightly coupled to the full-duplex architecture than Path 1; requires careful surgical fine-tuning to avoid breaking the audio-language coordination. Techniques exist in the literature for audio codec fine-tuning for speaker adaptation.

**Path 3 — Cross-attention context injection** (months, genuinely novel)  
Fork LLaMA-Omni. Add a text context encoder that processes RAG-retrieved memories as a sequence. Add cross-attention from the Llama backbone to this context encoder output. At inference time, the model attends to retrieved persona memories while generating its response. The full-duplex audio behaviour is preserved; persona conditioning is injected through the attention mechanism. This is an architectural modification that has not been publicly implemented for a full-duplex speech model. If it works, it solves the core problem cleanly. This is real research work with genuine unknowns.

**LLaMA-Omni is the right fork target** because the shared Llama 3.1 8B backbone means LoRA adapters from existing persona fine-tuning work may transfer directly or with minimal additional training. The Moshi route requires parallel investment in an unrelated model family.

---

## 8. Target architecture

Given no time constraint and a commitment to building correctly:

**Speech layer:** LLaMA-Omni, forked and adapted  
- Path 1 (LoRA persona fine-tuning) applied first  
- Path 2 (voice fine-tuning) following sufficient diary footage accumulation  
- Path 3 (context injection) as the primary research goal

**Video layer (Tier 2):** MuseTalk in streaming cascade with chunk stitching  
**Video layer (Tier 1):** 3DGS per-subject model fitted from diary footage, driven by a real-time expression network  
**Compositing:** Custom pipeline (MediaPipe segmentation + background integration + lighting match) sits on top of whichever synthesis model is active; shared across tiers

**Infrastructure:**  
- Streaming pipeline built first as scaffolding (Route B mechanics: WebSocket, VAD, sentence-level audio streaming, barge-in handling)
- LLaMA-Omni adaptation introduced behind the same interface once mature
- 3DGS fitting triggered as a background job when sufficient diary footage is available

---

## 9. Recommended learning sequence

Given existing AI domain knowledge and basic ML engineering background:

1. **LoRA fine-tuning mechanics** — develop through the planned Llama 3.1 8B persona fine-tuning. This is the foundation everything else builds on.
2. **LLaMA-Omni architecture study** — understand how the speech encoder and audio decoder attach to the Llama backbone; read the training code; understand the token interleaving.
3. **Apply LoRA to LLaMA-Omni** — Path 1. Same skill as step 1, new target. Verify persona knowledge transfers.
4. **Audio codec architecture** — study Mimi (Moshi) and LLaMA-Omni's audio components; read relevant papers on audio codec fine-tuning for speaker adaptation.
5. **Voice fine-tuning experiments** — Path 2. Run training experiments on diary room audio. Expect iteration.
6. **Cross-attention mechanisms** — study how retrieval-augmented generation injects context via cross-attention in text models; design the equivalent for LLaMA-Omni's architecture.
7. **Context injection implementation** — Path 3. Fork, modify, train, evaluate.
8. **3DGS avatar fitting** (parallel track) — study GaussianTalker and SplattingAvatar; begin fitting experiments as diary footage accumulates; does not depend on the speech model work.

---

## 10. Key models and resources

| Model | Organisation | Licence | HuggingFace / GitHub |
|---|---|---|---|
| Moshi | Kyutai | Apache 2.0 | `kyutai/moshi` |
| LLaMA-Omni | FudanNLP | Apache 2.0 | `ICTNLP/LLaMA-Omni` |
| Mini-Omni | Zhifei Xie | Apache 2.0 | `gpt-omni/mini-omni` |
| Hallo2 | Fudan University | Apache 2.0 | `fudan-generative-ai/hallo2` |
| MuseTalk | Microsoft Research | Apache 2.0 | `TMElyralab/MuseTalk` |
| LivePortrait | KwaiVGI | Apache 2.0 | `KwaiVGI/LivePortrait` |
| EchoMimic | Ant Research | Apache 2.0 | `BadToBest/EchoMimic` |
| LatentSync | ByteDance | Apache 2.0 | `bytedance/LatentSync` |
| SyncTalk | ZiqiaoPeng | Apache 2.0 | `ZiqiaoPeng/SyncTalk` |
| GaussianTalker | Various | Check repo | Search HuggingFace `GaussianTalker` |
| RVC (voice conversion) | RVC-Boss | MIT | `RVC-Boss/GPT-SoVITS` |

### Key papers to read
- Moshi: *Moshi: a speech-text foundation model for real-time dialogue* (Kyutai, 2024)
- LLaMA-Omni: *LLaMA-Omni: Seamless Speech Interaction with Large Language Models* (FudanNLP, 2024)
- 3DGS avatars: *GaussianTalker: Real-Time High-Fidelity Talking Head Synthesis with Audio-Driven 3D Gaussian Splatting* (2024)
- SpiritLM: *SpiritLM: Interleaved Spoken and Written Language Model* (Meta, 2024) — relevant for understanding text-speech token interleaving

---

## 11. Open questions for further research

| Question | Why it matters |
|---|---|
| Can LLaMA-Omni's LoRA adapter accept fine-tuning on persona text data without degrading audio capabilities? | Determines viability of Path 1 as a starting point |
| What is the minimum diary room footage required for a usable 3DGS fit? | Determines when to trigger the first fitting job |
| Can RVC voice conversion quality be brought close enough to XTTS v2 output to be acceptable for Tier 3? | Determines whether Route A is viable as a near-term step |
| Has anyone attempted cross-attention context injection into a full-duplex speech model? | Scoping Path 3 — are there published attempts to build on? |
| What is the compounding artifact quality of: LLaMA-Omni → RVC voice conversion → MuseTalk lip sync? | Determines whether the stacked pipeline degrades too much for Tier 2 |
| What expression network architectures are used in GaussianTalker for audio-to-Gaussian driving? | Design input for the Tier 1 video layer |
| Can the chunk stitching problem for Tier 2 streaming video be solved with a simple head pose lock, or does it require a more sophisticated approach? | Scoping the Tier 2 engineering task |

---

*Generated from research session, June 2026. Update as findings progress.*
