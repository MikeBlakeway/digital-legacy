# CPE-CORE-001 — Architectural Feedback Brief

**Prepared for:** Research agent — CPE-CORE revision  
**Date:** June 2026  
**Author:** Mike Blakeway (with architectural advisor)  
**Status:** Post-discussion summary — use as input to CPE-CORE-001 revision

---

## 1. Purpose

This document captures the findings of a detailed architectural review of CPE-CORE-001 (Continuous Presence Engine Core Architecture Specification v1.0). It identifies structural gaps, proposes specific additions, and flags where existing Digital Legacy design thinking should be incorporated into the framework.

Three design priorities are used throughout as an evaluation lens, in approximate order of current concern:

- **Latency** — time-to-response and conversational naturalness
- **Fidelity** — accuracy of identity, voice, visual, and memory representation  
- **Consistency** — coherent identity expression across sessions, time, and embodiment tiers

These are directional, not fixed rules.

---

## 2. What CPE-CORE-001 Gets Right

The following should be preserved in any revision:

- The **five-layer architecture** (Perception → Memory → Identity → Reasoning → Embodiment) is correct at the right level of abstraction and survives implementation-level changes.
- **CPE-001 Identity Primacy** — identity governing reasoning is the right hierarchy.
- **CPE-002 Memory Persistence** — memories independent of model implementations is a fundamental durability requirement.
- **CPE-004 Embodiment Independence** — voice, avatar, text, VR as interchangeable presentation layers is correct.
- The open research questions in each layer are honest and should be retained.

---

## 3. Structural Gaps

### 3.1 The Architecture Is Feedforward — Feedback Loops Are Missing

CPE-CORE-001 describes a one-directional flow: Perception → Memory → Identity → Reasoning → Embodiment. A continuously improving system requires explicit feedback loops. Three are currently absent.

**Conversation → Memory**  
Outputs from the Reasoning Layer — what the persona says in conversation — are significant events. Some should become memories. The framework does not model how Reasoning outputs flow back to the Memory Layer. Without this loop, each session begins from the same static corpus regardless of what has been said before.

**Correction → Identity**  
When the subject interacts with their own persona and identifies a misrepresentation, they can correct it directly. This correction is a high-quality identity signal. The framework has no path from a detected error back to an identity model update.

**Embodiment Context → Reasoning**  
The chosen embodiment tier carries a conversational register — a fireside scene implies reflective, longer responses; a phone call implies directness and brevity. The Reasoning Layer must know which embodiment it is generating for, because the form of the response should match the channel. This is currently modelled as a one-way output pipe; it should be bidirectional.

The revised draft should explicitly model these three feedback loops in the architecture diagram and assign responsibility for each to the appropriate layer.

---

### 3.2 Passive Perception and Deliberate Capture Are Not Distinguished

CPE-CORE-001 treats perception as ambient — signals arrive from the environment and are processed. This conflates two fundamentally different data collection modes.

**Passive perception** — the system observes the subject during natural interaction and extracts what it can. Probabilistic, unstructured, continuous.

**Deliberate capture** — the subject actively contributes to building their own persona through structured sessions: diary room recordings, guided interviews, directed capture of specific behaviours and mannerisms, avatar review, and self-interaction. Each session type has a defined purpose, a specific pipeline configuration, and a structured data product. The subject is not being observed; they are co-authoring their own representation.

These two modes should not be modelled as the same layer. A **Capture Subsystem** — distinct from and complementary to the Perception Layer — should be introduced. See Section 4.1.

The distinction matters because deliberate capture produces training-grade data by design, with defined quality gates. Passive perception extracts probabilistically from ambient signal. Conflating them obscures the fact that the quality ceiling of the persona is determined primarily by the deliberate capture protocol, not by ambient observation.

---

### 3.3 Latency Is Absent From the Framework

Latency is the first design priority and is completely unaddressed in CPE-CORE-001. Every layer contributes latency; the framework needs to treat latency budgets as a first-class architectural concern at each interface.

The core problem is the sequential cascade: perception → retrieval → reasoning → synthesis → delivery. Each step waits for the previous step to complete. The cumulative latency makes natural full-duplex conversation structurally impossible at current individual component speeds.

The solution space has two directions: **parallelism** — begin downstream processing before upstream is fully complete, using streaming interfaces between layers — or **architectural collapse** — full-duplex models that eliminate intermediate steps entirely (audio end-to-end, without text as an intermediate representation).

Both directions require the framework to treat latency as a design constraint at every layer interface, not an implementation detail to be resolved later. A new system-wide principle should address this. See Section 4.3.

---

### 3.4 The Embodiment Layer Undersells the Presence Architecture

CPE-CORE-001 lists voice, visual avatar, chat, VR, AR, and robotics as interchangeable output formats. This is correct as a principle (CPE-004) but understates the architectural significance of embodiment tier selection.

Each embodiment tier should carry:

- A **UX metaphor** that sets the register of the entire interaction (sharing a physical scene / video call / phone call / text messaging)
- A **conversational register** that should propagate back to and influence Reasoning Layer output
- A **latency budget**, beyond which the metaphor breaks and an in-world failure vocabulary takes over
- An **in-world failure vocabulary** — technical constraints expressed through the language of the chosen mode rather than generic system errors
- A **corresponding capture mode** in the Capture Subsystem, since each tier requires different training data

The embodiment tier is not a presentation preference. It is a first-class decision that propagates upstream. The Embodiment Layer should be revised to reflect this, and its bidirectional relationship with the Reasoning Layer should be made explicit.

---

### 3.5 No Temporal Coherence Model

The persona represents a specific individual at a specific point in time. Conversations happen in a future that individual may never have experienced. The framework does not address how the persona relates to the passage of time, what it can legitimately claim to know, or how it handles questions about events beyond its knowledge boundary.

A related issue: the Memory Layer should distinguish between:

- **Historical memories** — experiences the subject actually had, captured during their lifetime
- **Interaction-generated content** — statements made by the persona during conversations with family members

Whether interaction-generated content should influence the persona's responses in future conversations is an open design question. But the structural distinction must be made explicitly. Conflating the two erodes the fidelity of the historical record and creates compounding representation drift over time.

A new system-wide principle should address this. See Section 4.4.

---

## 4. Proposed Additions

### 4.1 Capture Subsystem

A new subsystem, distinct from the Perception Layer, covering:

- **Session types** — diary room, interview, directed capture, avatar review, self-interaction. Each has a defined purpose, pipeline configuration, and data product.
- **Structured outputs per session type** — what data each session produces and in what format
- **Quality gates and readiness metrics** — voice readiness, memory depth, emotional coverage, identity coverage. These metrics inform capture priorities and set honest expectations for persona quality.
- **Relationship to downstream layers** — the Capture Subsystem is the primary training data source for the Memory and Identity Layers. This relationship should be made explicit.

The Capture Subsystem is where the subject exercises agency over their own representation. It is architecturally and philosophically distinct from passive perception and should be specified accordingly.

---

### 4.2 Explicit Feedback Loop Architecture

The architecture diagram and layer specifications should be updated to show:

- **Conversation → Memory** — post-session consolidation of conversation outputs into the memory store, with criteria for what qualifies as a durable memory
- **Correction → Identity** — signal path from self-interaction correction events to identity model update procedures, consistent with CPE-001 (only explicit update procedures alter identity)
- **Embodiment context → Reasoning** — register and tonal constraints propagated from the active embodiment tier into the Reasoning Layer at inference time

Each feedback loop should specify: trigger conditions, data format, update frequency, and which layer owns the process.

---

### 4.3 CPE-006 — Pipeline Parallelism

*Proposed new system-wide principle:*

No layer shall block the downstream layer unnecessarily. Streaming interfaces between layers are the default; buffered delivery is an explicit, tier-appropriate choice rather than a default assumption. Each layer specification must define its latency budget and its streaming interface contract. The cumulative latency of the full pipeline is a first-class architectural metric.

---

### 4.4 CPE-007 — Temporal Coherence

*Proposed new system-wide principle:*

The persona's knowledge has a temporal boundary at the point of capture. Historical memories and interaction-generated content are maintained as structurally distinct record types. The system must represent this boundary honestly and must not conflate what the subject experienced with what the persona has said in subsequent conversations. Responses that reference events beyond the knowledge boundary must be handled through a defined protocol, not through confabulation.

---

## 5. The Central Architectural Question the Revision Should Address

The Memory-Reasoning interface is the most consequential unresolved question in CPE-CORE-001. The revised draft, and specifically the future specifications CPE-CORE-002 and CPE-CORE-003, should take an explicit position on the following:

**Where does the persona's knowledge and identity live, and how does it reach the Reasoning Layer in real time?**

Three paradigms exist:

**Option A — Knowledge encoded in weights**  
Identity and knowledge baked into model parameters through fine-tuning. Fast inference; cannot continuously update without retraining; catastrophic forgetting is a structural risk. Fails the continuous improvement requirement. This is the wrong long-term direction.

**Option B — Knowledge injected via context**  
RAG retrieval appended to the system prompt at inference time. The practical current approach. Hard limits on latency, context window length, and full-duplex compatibility. Has a quality ceiling determined by retrieval accuracy and context capacity.

**Option C — Dedicated memory encoder with learned interface**  
An external long-term memory store connected to the Reasoning Layer through trained cross-attention or an equivalent architectural mechanism. Not prompt injection, but architectural integration. Supports continuously growing memory and real-time access without the latency and context-window limits of Option B. Partially an open research problem; the most capable implementations do not yet exist as packaged solutions.

**Recommended direction:** Option C is the correct target architecture. Option B is the practical interim. CPE-CORE-002 (Inter-Layer Interfaces) and CPE-CORE-003 (Memory Schema) should be written with Option C as the target, designed so that Option B can serve as an interim implementation without requiring structural rework when Option C matures.

---

## 6. Direction for the Revised Draft

The revised CPE-CORE-001 should:

1. Add the **Capture Subsystem** as a named architectural component with defined responsibilities, session types, and quality model
2. Add **explicit feedback loop modelling** to the architecture diagram and layer specifications, covering all three loops identified in Section 3.1
3. Add **CPE-006 Pipeline Parallelism** and **CPE-007 Temporal Coherence** as system-wide principles
4. Refine the **Embodiment Layer** to encode tiered presence as a first-class concept with bidirectional relationship to the Reasoning Layer
5. Update the **Memory Layer** to distinguish historical memory from interaction-generated content
6. State the **Memory-Reasoning interface direction** explicitly: Option C as target, Option B as interim
7. Add **latency budgets** as a required element of each layer's specification and interface contract

The five-layer architecture, existing principles CPE-001 through CPE-005, and the open research questions should all be preserved.

---

*Document prepared June 2026. Based on architectural review session between Mike Blakeway and Claude (Anthropic). Return to this document when beginning CPE-CORE-002 specification work.*
