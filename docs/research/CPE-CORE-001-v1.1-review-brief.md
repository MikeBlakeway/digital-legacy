# CPE-CORE-001 v1.1 — Review Brief

**Prepared for:** Research agent — CPE-CORE revision and sequencing  
**Date:** June 2026  
**Author:** Mike Blakeway (with architectural advisor)  
**Status:** Post-review discussion notes — second draft

---

## 1. Purpose

This document reviews CPE-CORE-001 v1.1 following a detailed architectural discussion. It identifies what the revision has resolved correctly, raises issues that require further attention either in v1.1 or in upcoming specifications, and records the sequencing decision for CPE-CORE-002 and CPE-CORE-003.

**Specification sequence (updated):**

| Number | Title | Status |
|---|---|---|
| CPE-CORE-001 | Core Architecture | This document |
| CPE-CORE-002 | Memory Schema and Retrieval Architecture | Next — write first |
| CPE-CORE-003 | Inter-Layer Interfaces and Data Contracts | Write after CPE-CORE-002 |
| CPE-CORE-004 | Identity Modelling Framework | Follows CPE-CORE-003 |
| CPE-CORE-005 | Continuous Presence Runtime Architecture | Follows CPE-CORE-004 |
| CPE-CORE-006 | Embodiment and Presence Protocol | Follows CPE-CORE-005 |
| CPE-CORE-007 | Capture Protocol and Persona Readiness Model | Follows CPE-CORE-006 |

**Note for CPE-CORE-001 v1.1:** The current document references the old ordering in Sections 11.5, 13, and 14. These sections currently describe CPE-CORE-002 as Inter-Layer Interfaces and CPE-CORE-003 as Memory Schema. Both sections must be updated to reflect the new sequence before v1.1 is considered stable.

---

## 2. What v1.1 Resolves Correctly

The following decisions are affirmed and should not be revisited without strong reason.

**Capture as a sidecar subsystem.** Treating Capture as a sidecar rather than a sixth runtime layer is the correct structural call. A sixth layer would imply participation in the live inference pipeline. Capture feeds the pipeline; it does not run inside it. The distinction is architecturally important and the current framing preserves it cleanly.

**Section 11 as the central section.** Naming the Memory–Reasoning interface as the most consequential architectural decision is correct. Rejecting Option A (weights-encoded) with explicit reasoning, establishing Option B (context injection) as the interim, and pointing toward Option C (dedicated memory interface) as the target sets the right direction. The design requirement in 11.5 — that schemas should not need structural redesign when the interface matures — is exactly the right engineering constraint to place on CPE-CORE-002 (Memory Schema) and CPE-CORE-003 (Inter-Layer Interfaces).

**Governance language throughout.** The constraints "identity must not be silently mutated" and "persona-generated content must not automatically become historical memory" are not just implementation notes — they are the architectural safeguards that prevent the system from drifting away from the subject over time. These must remain in any future revision.

**Memory type taxonomy with authority levels.** The hierarchy in Section 5.4 (Historical > Authored > Captured > Interaction > Derived > Correction > System) is well-reasoned. The distinction between authority levels gives the retrieval and reasoning layers a principled basis for conflict resolution.

**Temporal Coherence Model with multiple boundary types.** Section 10.2 correctly identifies four distinct boundary types: Capture, Life, Model, and Interaction. The example response ("I don't have a lived memory of that, but I imagine I would have been incredibly proud of her") demonstrates the temporal response protocol working as intended — emotionally useful without fabricating historical experience.

**Embodiment as a first-class reasoning constraint.** The Embodiment Context Object and the statement "Embodiment is not a passive renderer" correctly capture the bidirectional relationship between the Embodiment and Reasoning layers.

**Feedback loops with explicit governance.** Section 9 specifies trigger conditions, data formats, update frequencies, and ownership for all three loops. This level of specificity is appropriate for a core architecture document.

---

## 3. Issues Requiring Attention

### 3.1 RAG Limitations Are Understated for a Persona Use Case

Section 11 correctly identifies retrieval quality as a major challenge. The current framing is accurate but understates how specifically these challenges will manifest for a persona with a rich, growing memory corpus.

**The isolated point problem.** Pure vector search treats each memory as a semantically independent point. A query such as "what did he think about the relationship between work and family?" requires connecting beliefs about work, beliefs about family, and the dynamic between them — a multi-hop inference across related records. Cosine similarity will retrieve the nearest neighbours to the query vector, but has no mechanism for traversing conceptually linked memories or understanding that two records are in tension with one another. For most search applications this is acceptable. For a persona that must reason coherently across a lifetime of interconnected experience, it is a significant limitation.

**Temporal weighting is absent.** Standard cosine similarity has no concept of when a memory occurred. A belief held in 1975 and a belief held in 2023 score equally if they are semantically similar to the query. For a persona, temporal context is often critical — the subject may have revised their position, and the more recent record should generally take precedence. The retrieval architecture needs temporal weighting as a first-class parameter, not a post-retrieval adjustment.

**Contradiction detection is specified as an output but not as a mechanism.** Section 5.5 lists contradiction warnings as a Memory Layer output. This is correct. But the document does not specify how contradictions are detected. The problem is particularly acute when Correction memories coexist with Historical memories about the same event — the system needs to know which record takes precedence, whether the older record should still be surfaced in some contexts, and how to represent genuine historical ambiguity. This mechanism needs designing before CPE-CORE-002 can be written.

**Recommended response.** CPE-CORE-002 (Memory Schema) should address all three of these explicitly. The Memory Schema specification should take a position on graph-augmented retrieval, define temporal weighting parameters, and specify a contradiction detection and resolution model. These are not implementation details — they determine the quality ceiling of the interim RAG architecture.

---

### 3.2 The Relationship Graph Is Not Connected to the Retrieval Architecture

Section 5.6 lists the Relationship Graph as a storage requirement alongside the Episodic, Semantic, and Interaction memory stores. The field list is reasonable. But the document does not specify how the Relationship Graph connects to retrieval.

If memories can be anchored to people and relationships — and retrieved by traversing the relationship graph first — retrieval quality for relationship-sensitive queries improves substantially. A question about a specific person would trigger a graph traversal that surfaces connected episodic memories, authored statements, and semantic facts, rather than relying entirely on semantic similarity to the query string.

This matters for schema design. If memory records do not include relationship graph node references from the start, adding them later requires a structural migration. CPE-CORE-002 should specify the relationship between memory records and relationship graph nodes as part of the core schema, not as an optional extension.

---

### 3.3 The Identity–Reasoning Boundary Conceals a Structural Tension

CPE-CORE-001 models Identity as a constraint layer that produces a profile object, which the Reasoning Layer then consumes. This is architecturally clean and should remain the primary model. However, it does not address the fact that in any practical implementation, identity will also be encoded at the parameter level — through fine-tuning or low-rank adaptation — in addition to being represented in the profile object.

These two encodings behave differently. A profile object can be updated immediately; the update is available to the next request. A parameter-level encoding requires retraining to change, which may take hours or days. The Identity update procedure defined in Section 6.6 is correct for the profile object but incomplete if parameter-level encoding is also in use. An identity correction that updates the profile but not the underlying parameters will produce incoherent behaviour — the system's constraints say one thing, and the model's trained tendencies do another.

This tension does not need to be resolved in CPE-CORE-001. But CPE-CORE-004 (Identity Modelling Framework) must take an explicit position on it. The Identity update procedure will need different branches depending on whether the correction is addressed through profile update alone, or whether it also triggers a parameter-level retraining.

---

### 3.4 The Progressive Response Mode Is Underspecified

Section 7.7 mentions "start with a lightweight response, enrich as retrieval completes" as one of five latency modes. This is listed alongside other modes as if it were a minor variant. It is not. This is a substantively different architectural pattern — and one that is closely related to the long-term goal of natural full-duplex conversation.

The pattern is worth naming clearly: the Reasoning Layer begins generating a response before full memory retrieval has completed, and weaves retrieved memories into the response as they arrive. This is how human recall often works in conversation — speaking before fully formed thought, updating in real time. A persona doing the same would feel significantly more natural than one that pauses, retrieves, and then speaks.

This requires: the Reasoning Layer to produce enrichable partial responses rather than a single complete output; a mechanism to detect when to inject retrieved memory into an in-progress response; and the TTS layer to handle dynamic text extension mid-generation. These are non-trivial engineering problems. They should be elevated to a named research item and flagged for CPE-CORE-005 (Continuous Presence Runtime Architecture) rather than remaining buried in a latency table.

---

### 3.5 The knowledgeBoundaryStatus Field Is Incomplete

Section 10.4 introduces the `knowledgeBoundaryStatus` field and shows one example value: `"within_subject_lived_experience"`. The field is important — the Reasoning Layer must inspect it to decide whether to apply the temporal response protocol. But the full set of possible values is not defined anywhere in the document.

At minimum, CPE-CORE-001 should enumerate the expected values even if the full schema is deferred to CPE-CORE-002. Without this, the field is underspecified for any implementation work that references it.

Suggested values to enumerate (for review):

- `within_subject_lived_experience` — the subject directly experienced this
- `within_capture_boundary` — authored or approved by subject, not necessarily lived
- `beyond_life_boundary` — the subject had no lived experience of this event
- `beyond_capture_boundary` — no subject-authored or subject-approved data exists
- `interaction_memory` — derived from post-capture persona-user interaction
- `inferred` — derived by the system, not from a direct source

---

### 3.6 Post-Death Correction Authority Is Unresolved and Architecturally Load-Bearing

Section 15.2 correctly asks: "Who has authority to correct identity after the subject is unavailable?" This is one of the most important questions in the specification — philosophically and architecturally. The authority hierarchy in Section 5.4 assigns Correction Memory a level of "High, governed" but does not define who can issue a correction once the subject is no longer available.

This is not merely a governance question for a future document. The memory and identity correction systems being designed now will need to enforce these boundaries. If the authority model is undefined, those systems will either be too permissive (accepting corrections from anyone who knew the subject) or too restrictive (accepting no corrections at all after the subject's death).

The question should be elevated from the open questions section into Section 13 as a required concern that CPE-CORE-004 must resolve. CPE-CORE-004 cannot define a complete identity update procedure without an authority model that covers the post-death case.

---

## 4. Sequencing Decision: Memory Schema Before Interface Contracts

CPE-CORE-002 will be the Memory Schema and Retrieval Architecture. CPE-CORE-003 will be the Inter-Layer Interfaces and Data Contracts. This is the reverse of the ordering in CPE-CORE-001 v1.1.

The rationale is straightforward. The interface contracts in CPE-CORE-003 must reference concrete memory objects — MemoryRecord, MemoryBundle, TemporalBoundary, and others. If the interface contracts are written before the memory schema is defined, they will be written against abstract placeholders that may require revision once the schema is settled. Writing the schema first means the interface contracts can be specified against stable, concrete data structures.

The design requirement in Section 11.5 — that schemas must not need structural redesign when the Memory–Reasoning interface matures — reinforces this ordering. CPE-CORE-002 should be written with CPE-CORE-003's interface needs in mind, so that the schema is not designed in isolation.

---

## 5. Direction for v1.1 Revision

The following changes are recommended before v1.1 is considered stable:

1. **Update Sections 11.5, 13, and 14** to reflect the new specification sequence: CPE-CORE-002 is Memory Schema and Retrieval Architecture; CPE-CORE-003 is Inter-Layer Interfaces and Data Contracts.

2. **Enumerate the `knowledgeBoundaryStatus` values** in Section 10.4, even as a preliminary list subject to revision in CPE-CORE-002.

3. **Elevate the Progressive Response pattern** in Section 7.7 from a line item in a latency table to a named architectural pattern with a brief description of what it requires from the Reasoning and Embodiment layers.

4. **Add post-death correction authority to Section 13** as a required concern for CPE-CORE-004, alongside the existing interface objects list.

5. **Add a note to Section 11** acknowledging that the interim RAG architecture has specific limitations in a persona context — particularly multi-hop queries, temporal weighting, and contradiction detection — and that CPE-CORE-002 should address these directly.

6. **Add a note to Section 6** (Identity Layer) acknowledging the tension between profile-level and parameter-level identity encoding, and flagging it as a question CPE-CORE-004 must resolve.

The five-layer architecture, principles CPE-001 through CPE-007, the Capture Subsystem as sidecar, the feedback loop architecture, and the temporal coherence model should all be preserved without change.

---

*Document prepared June 2026. Iteration expected — return to architectural advisor before finalising.*
