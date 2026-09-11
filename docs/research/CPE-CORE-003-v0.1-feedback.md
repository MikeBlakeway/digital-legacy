# CPE-CORE-003 v0.1 Feedback

Before the issues — these elements are standout and shouldn't be diluted:

**The five-category interaction taxonomy (§5)** — command / request / snapshot / delta / event — is a clean framing that resolves a lot of architectural ambiguity up front. Making `MemoryBundle` a snapshot and `IdentityDelta` a delta (rather than blurring both into "message") establishes the right mental model for streaming.

**The `ReasoningMemoryInput` three-state discriminated union (§22)** — `not_requested | pending | available` — is one of the strongest design choices in the document. It structurally encodes the parallel-execution reality without forcing every caller through orchestration logic. Keep this exactly as written.

**`ExpressionIntent` (§23.5)** correctly separates semantic intent from renderer-specific animation identifiers. This is exactly the right level of abstraction for keeping the Embodiment Layer swappable, and the `progressiveRecallPhase` enum threads cleanly through to the CORE-002 retrieval state model.

**The distinction between operational failure and epistemic uncertainty in §35** (`memory.retrieval_failed` because no memory could be recalled is not necessarily an infrastructure error) is a subtle point that most specs miss. It's essential to CPE's honesty about not-knowing.

**The Contract Invariants section (§52)** is the load-bearing safety layer of the document. INV-001 through INV-015 are the right statements. Together with the Failure Modes (§53), this is where CORE-003 earns its keep beyond typedef documentation.

**The recommended v0.1 positions on open questions** are decisive and mostly correct — particularly OQ-002 (snapshot semantics with delta transport as optimisation), OQ-005 (permit dynamic memory injection), and OQ-006 (no generic metadata escape hatches). These are the right calls.

---

## Critical Architectural Concerns

These are the items that should block v0.2.

### 1. Presence Ladder deviation — six tiers vs. four

The Presence Ladder in the established architecture is a **four-tier** structure: text (messaging), voice (phone call), lipsync avatar (video call), full avatar (shared scene). This is documented in the CPE architecture and is a defining CPE concept — each tier is a complete metaphor-native experience, not a point on a degradation ladder.

§18 line 1263-1269 defines **six** tiers:

```ts
type PresenceTier =
  | "text"
  | "voice"
  | "video_avatar"
  | "scene_avatar"
  | "vr_ar"
  | "robotics";
```

`vr_ar` and `robotics` are not part of the established Presence Ladder. The `uxMetaphor` enum on line 1274-1280 is internally consistent with itself (six metaphors matching six tiers) but the whole structure has expanded beyond the architecture without explanation.

This is a genuine architectural deviation that must be resolved one of two ways:

- **Reduce to the canonical four tiers.** `vr_ar` and `robotics` are future work; they can be added by minor version bump when they become real. The `renderingCapabilities.physicalAction` flag (§18) and the robotics-related open question (OQ-010) can remain as forward-compatibility hooks without needing dedicated tiers now.
- **Explicitly flag and justify the extension.** If robotics and VR/AR are genuinely being brought into scope, this needs a paragraph in §18 explaining the extension of the Presence Ladder, and CORE-006 needs a note that its scope has grown.

Given the architectural principle that the Presence Ladder is a "complete metaphor-native experience, not a degradation hierarchy," silently adding tiers without corresponding metaphor design is the wrong move. My recommendation is the first option — reduce to four.

### 2. Memory type imports don't match CPE-CORE-002

At §13 line 753-759:

```ts
type MemoryRecord =
  | EpisodicMemoryRecord
  | SemanticMemoryRecord
  | ProceduralMemoryRecord
  | EmotionalImplicitMemoryRecord
  | CorrectionMemoryRecord
  | CollaborativeCueRecord;
```

Two problems:

**Problem A: the union mixes discriminator axes.** In CORE-002, the first four are `memorySystem`-discriminated (episodic, semantic, procedural, emotional_implicit) while `CorrectionMemoryRecord` and `CollaborativeCueRecord` are `memoryType`-discriminated (correction, collaborative_cue). A correction can also be episodic or semantic. The two axes are orthogonal in CORE-002, but the union treats them as parallel. This will confuse implementers.

**Problem B: no way to express memoryType-only records.** CORE-002 also defines `memoryType` values `historical`, `authored`, `captured`, `interaction`, `derived`, `system`. There's no `HistoricalMemoryRecord` interface in CORE-002 — such records are just `BaseMemoryRecord` with a memoryType value plus one of the four memorySystem subtypes. The CORE-003 union doesn't capture this.

**Recommended fix:** simplify to importing `BaseMemoryRecord` as the umbrella type, with a note that its two discriminators (`memoryType` and `memorySystem`) are independent per CORE-002 §5 and §4.1. If a more specific union is genuinely needed, express it as the cross product or drop the union entirely.

### 3. `MemoryCandidateRef` conflicts with CORE-002 terminology

§12.2 line 731-734 defines:

```ts
interface MemoryCandidateRef {
  candidateId: string;
}
```

CORE-002 §17 defines `MemoryCandidate` as a retrieval-time object that references an existing `memoryRecordId`. But in CaptureOutput (§12.2), the "candidates" are *proposed* memories that don't yet have a `memoryRecordId` — they're pre-consolidation.

Two different concepts are sharing the "candidate" name:

- **CORE-002 candidate:** a retrieval result pointing to an existing record.
- **CORE-003 candidate (in CaptureOutput):** a proposed new record awaiting governed acceptance.

Rename the CORE-003 concept to disambiguate. Suggested: `MemoryFormationProposalRef` or `ProposedMemoryRef`. This aligns better with the existing `MemoryFormationCandidate` at §27, which is the same concept flowing from the Reasoning Layer rather than the Capture Subsystem. Consider unifying these two paths under one type name if the payload is genuinely identical.

### 4. Missing wiring to CORE-002 §29.1 promotion workflow

CORE-002 v0.3 established a specific governed workflow for promoting interaction memories to `consolidated_identity_relevant`. CORE-003's job is to define how CORE-002 objects cross layer boundaries — so this workflow should be explicitly wired into CORE-003, but it isn't.

Specifically:

- **§14.2 `IdentitySignal`** should reference the promotion workflow. When an IdentitySignal is generated from an interaction memory, that memory must have passed governed review per CORE-002 §29.1. There's no field on `IdentitySignal` that captures this precondition.
- **§27 `MemoryFormationCandidate`** has a `requiresReview: boolean` field but no reference to the specific governance path from CORE-002 §29.1. When `recommendedMemoryType: "interaction"`, the downstream review pipeline is CORE-002 §29.1 — this should be stated.
- **§30.2 Memory Events** includes `memory.consolidation_requested` and `memory.consolidation_completed` but no event for the specific promotion states (`eligible_for_review`, promoted to `consolidated_identity_relevant`, rejected). Adding `memory.consolidation_review_eligible` and either specialising the completed event or splitting it into `memory.consolidation_accepted` / `memory.consolidation_rejected` / `memory.consolidation_partially_accepted` would make the CORE-002 workflow observable at the event layer.

This is the most important missing wire in the document. CORE-003 must not leave the promotion path implicit.

---

## CORE-002 Consistency Issues

### 5. Retrieval state enum duplication

§13 lines 777-784 redeclares `RetrievalState` inline:

```ts
type RetrievalState =
  | "searching"
  | "partial"
  | "converging"
  | "hypothesising"
  | "awaiting_collaborative_cue"
  | "complete"
  | "failed";
```

The other CORE-002 imports (§13 lines 761-775) use empty interface placeholders with comments. This one is materialised inline. Pick one convention — I'd suggest treating all CORE-002 imports the same way (empty declarations or type aliases pointing to CORE-002). Duplicating the enum body creates a synchronisation risk if CORE-002 later adds a state.

### 6. `MemoryEmbeddingSet` / multi-facet delta unaddressed

CORE-002 v0.3 §34.1 established that the interim implementation populates only `embeddingSet.semantic` and defers the other four facets. CORE-003 §50 (Target Memory Interface Compatibility) mentions "learned memory tokens" and "graph-native interfaces" but doesn't reference the specific interim/target embedding delta from CORE-002. Add a note in §49 (Interim Implementation Compatibility) that consuming layers must not assume all `MemoryEmbeddingSet` facets are populated in the interim implementation. This is a small but important interoperability point.

### 7. Cross-reference tightening in §31.7

§31.7 line 2170-2173:
> "Unconsolidated interaction memory may support conversational continuity where CORE-002 permits it."

Tighten this to an explicit reference: "Unconsolidated interaction memory may support conversational continuity per CORE-002 §29." Vague cross-references degrade over time as documents evolve.

---

## Structural Issues

### 8. Heading level inconsistency in subsections

§5 uses `## 5.1`, `## 5.2` (H2). Sections §11 through §23 use `# 11.1`, `# 12.1`, `# 13.1` (H1) for what should be subsections. This breaks the document outline in any tool that consumes markdown headings (search, navigation, TOC generation).

Normalise to H2 throughout for `.x` subsections: `## 11.1 Observation` rather than `# 11.1 Observation`. This applies to §11, §12, §13, §14, §23, §30, §31, §40, §53, §55.

### 9. Undefined string references without deferred-decision markers

Several fields are typed as `string` with an implied external reference but no type marker:

- `PresenceTierConfig.latencyProfileRef: string` (§18)
- `PresenceTierConfig.failureVocabularyProfileRef: string` (§18)
- `IdentityProfile.provenanceRefs: string[]` (§14.1)
- `ResponseGrounding.provenanceRefs: string[]` (§23.2)
- `IdentitySignal.evidenceRefs: string[]` (§14.2)

These should either become branded types (`type LatencyProfileRef = Brand<string, "LatencyProfileRef">`) or carry a comment noting the reference format is deferred to CORE-006 / CORE-004. The pattern established elsewhere in the document (branded IDs at §6) should apply consistently.

### 10. `EmbodimentContext.expressionCapabilities` vs. `PresenceTierConfig.renderingCapabilities`

§18 defines `renderingCapabilities` on `PresenceTierConfig` (static tier definition). §19 defines `expressionCapabilities` on `EmbodimentContext` (dynamic runtime state). The field name overlap and slightly different member names (`face` vs `facialExpression`, `spatialAction` vs no equivalent, `physicalAction` in both) will cause confusion.

Add a note in §19 explicitly distinguishing static tier capabilities from dynamic runtime state, and consider aligning the field names so a runtime consumer can trivially check `context.expressionCapabilities.X && config.renderingCapabilities.X` without translation.

---

## Minor Corrections

- **§9 ownership table:** `IdentitySignal` owner reads "Identity Layer / Capture Subsystem as proposal". The phrase "as proposal" is doing a lot of work here — the Capture Subsystem proposes signals but doesn't own them. Reword to "Identity Layer (Capture Subsystem may propose)".
- **Line 15:** "Revision history" should be "Revision History" for consistency with CORE-002.
- **§54 Deferred Decisions:** the "To CPE-CORE-004" list at item 9 mentions "Post-death identity correction policy" — this correctly forward-references but should also point to CORE-002 §8.1 which established the initial rules.
- **§56 Recommended v0.2 Work item 6** says "Define machine-readable JSON Schema or TypeScript reference schemas." Given the interim implementation is TypeScript-native, recommend making TypeScript the primary target and JSON Schema optional.

---

## Summary Verdict

The intellectual centre is sound. The invariants, the interaction-kind taxonomy, the streaming semantics, and the epistemic propagation rules are genuinely well-conceived and represent real progress over v0.1 of CORE-002.

The critical blocker is **item 1** (Presence Ladder deviation) — this needs an architectural decision, not just an agent revision. Items 2, 3, and 4 are structural but solvable through the standard revision workflow. Items 5–10 are cleanup.

Once the Presence Ladder question is resolved, this document is on track to become CPE-CORE-003 v0.2 with a clean acceptance-criteria feedback brief to your documentation agent. If you'd like, I can prepare that brief once you've decided on the presence tier scope.
