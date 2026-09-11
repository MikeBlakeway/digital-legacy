# CPE-CORE-003

## Inter-Layer Interfaces and Data Contracts

### Core Specification v0.1

**Status:** Draft
**Version:** 0.1
**Date:** August 2026
**Project:** Digital Legacy / Continuous Presence Engine
**Depends on:** CPE-CORE-001 v1.2, CPE-CORE-002 v0.3
**Informed by:** CPE-REF-001 Neuroscience Foundations
**Feeds into:** CPE-CORE-004, CPE-CORE-005, CPE-CORE-006, CPE-CORE-007

**Revision history:**

- v0.1: Initial specification defining inter-layer ownership, canonical runtime contracts, streaming and revision semantics, epistemic propagation requirements, latency and failure contracts, and compatibility rules.

---

# 1. Purpose

CPE-CORE-003 defines the interfaces and data contracts exchanged between Continuous Presence Engine layers and supporting subsystems.

CPE-CORE-001 defines the architectural layers and their responsibilities.

CPE-CORE-002 defines the canonical Memory Layer schema and retrieval model.

CPE-CORE-003 defines how information crosses architectural boundaries.

It answers:

> What may each layer send or receive, what does that information mean, how may it change while in flight, and which properties must remain intact as it moves through the system?

The objective is to make the CPE architecture internally interoperable without coupling its layers to a particular:

1. Foundation model.
2. Model provider.
3. Vector database.
4. Graph database.
5. Message transport.
6. Orchestration framework.
7. Runtime process model.
8. Speech system.
9. Avatar system.
10. Physical embodiment.

The interfaces defined here are semantic contracts.

Transport protocols and implementation technologies may change without changing the meaning of the contracts.

---

# 2. Scope

CPE-CORE-003 defines:

1. Contract design principles.
2. Contract ownership and directionality.
3. Common identifiers and contract metadata.
4. Schema versioning and compatibility.
5. Observation contracts.
6. Partial observation and correction semantics.
7. Capture session and capture output contracts.
8. Memory interface contracts using CPE-CORE-002 objects.
9. Identity profile and runtime identity contracts.
10. Identity signal contracts.
11. Identity delta contracts.
12. Correction event contracts.
13. Temporal boundary contracts.
14. Conversation session contracts.
15. Embodiment context contracts.
16. Presence tier configuration contracts.
17. Latency budget contracts.
18. Reasoning request contracts.
19. Reasoning response contracts.
20. Streaming reasoning response contracts.
21. Reflection record contracts.
22. Inter-layer event contracts.
23. Progressive update semantics.
24. Epistemic propagation rules.
25. Blocking and fallback semantics.
26. Cancellation and supersession.
27. Error and degradation contracts.
28. End-to-end conversational flow.
29. Collaborative retrieval flow.
30. Correction flow.
31. Implementation compatibility requirements.
32. Failure modes.
33. Open questions.

CPE-CORE-003 does not define:

1. The internal storage architecture of any layer.
2. Foundation-model prompts.
3. Model-specific token formats.
4. REST, gRPC, WebSocket, Kafka, NATS, or other transport selection.
5. Runtime scheduling algorithms.
6. The full Identity Modelling Framework.
7. Final embodiment behaviour and rendering rules.
8. Final Capture Protocol and readiness metrics.

Those concerns belong to later specifications.

---

# 3. Architectural Principle

The defining principle of CPE-CORE-003 is:

> Layers exchange meaning through stable contracts rather than exposing their internal implementation.

A layer may change how it produces an output without requiring downstream consumers to understand that implementation.

For example:

- Memory retrieval may initially use PostgreSQL, pgvector, graph traversal, and context injection.
- A future implementation may use a learned native memory interface.
- The Reasoning Layer should still consume the same semantic memory contract.

Likewise:

- Reasoning may use one foundation model today and another later.
- Embodiment should not depend on model-specific response structures.
- Perception may replace its speech-recognition system without changing the meaning of an `Observation`.

---

# 4. Contract Design Principles

## CPE-003-001 Contract-First Boundaries

Every inter-layer boundary shall expose defined contract objects.

Layers shall not require access to another layer's internal database schema, model state, prompt representation, or proprietary runtime object.

---

## CPE-003-002 Semantic Stability

Contracts describe semantic meaning rather than implementation representation.

A contract may be serialised differently across implementations provided its semantics are preserved.

---

## CPE-003-003 Streaming by Default

Where useful information becomes available progressively, the interface shall permit progressive delivery.

Streaming contracts are required for:

1. Perception.
2. Memory retrieval.
3. Reasoning generation.
4. Embodiment-compatible output where supported.

Buffered completion is permitted where the active presence tier or operation requires it.

---

## CPE-003-004 Explicit Finality

Consumers must be able to distinguish:

1. Preliminary information.
2. Revised information.
3. Final information.
4. Superseded information.
5. Cancelled information.

A partial value must never be mistaken for a final value.

---

## CPE-003-005 Epistemic Preservation

Information about certainty and origin is part of the data.

Downstream layers shall preserve materially relevant:

1. Provenance.
2. Authority.
3. Confidence.
4. Temporal status.
5. Knowledge-boundary status.
6. Contradiction state.
7. Correction state.
8. Retrieval state.

A downstream layer may refine or add epistemic information.

It shall not silently strengthen it.

---

## CPE-003-006 Identity Primacy

The Reasoning Layer shall consume identity constraints produced by the Identity Layer.

It shall not silently create, modify, or persist authoritative identity state.

Any proposed identity change must leave the Reasoning Layer through an explicit correction, reflection, signal, or delta workflow.

---

## CPE-003-007 Historical Integrity

Post-boundary interaction data must remain distinguishable from subject-lived or subject-authored historical information across every interface.

No contract transformation may erase the distinction.

---

## CPE-003-008 Progressive Recall Compatibility

The interface architecture shall permit generation to begin before memory retrieval is complete where the active presence tier permits Progressive Recall Response.

Memory state must therefore remain observable while reasoning and embodiment are active.

---

## CPE-003-009 Transport Independence

This specification defines:

- semantic requests
- responses
- snapshots
- deltas
- events
- states

It does not prescribe how those contracts are transported.

---

## CPE-003-010 Explicit Ownership

Every persistent or authoritative contract shall have a single owning layer or subsystem.

Other layers may consume the contract but may not silently mutate authoritative state owned elsewhere.

---

# 5. Contract Categories

CPE distinguishes five interaction categories.

```ts
type ContractInteractionKind =
  | "command"
  | "request"
  | "snapshot"
  | "delta"
  | "event";
```

## 5.1 Command

A command requests a state-changing operation.

Examples:

- submit correction
- cancel response
- end session

Commands do not imply that the requested state change succeeded.

---

## 5.2 Request

A request asks a layer to compute or retrieve information.

Examples:

- memory retrieval
- identity context resolution
- reasoning generation

Requests should be correlated with their outputs.

---

## 5.3 Snapshot

A snapshot represents the current state of a logical object.

Examples:

- `MemoryBundle`
- `IdentityContext`
- `ConversationSession`

A later snapshot may replace an earlier snapshot for the same logical operation.

---

## 5.4 Delta

A delta represents an explicit proposed or accepted change.

Examples:

- `IdentityDelta`
- partial observation revision
- streaming reasoning response update

A delta must identify the state it changes.

---

## 5.5 Event

An event records that something happened.

Events are historical statements about system activity and should not be interpreted as commands.

Examples:

- retrieval completed
- response cancelled
- correction submitted

---

# 6. Common Types

The following aliases are illustrative strongly typed identifiers.

Implementations may encode them as UUIDs, ULIDs, or equivalent globally unique identifiers.

```ts
type Brand<T, TBrand extends string> = T & {
  readonly __brand: TBrand;
};

type ContractId = Brand<string, "ContractId">;
type CorrelationId = Brand<string, "CorrelationId">;
type CausationId = Brand<string, "CausationId">;

type SubjectId = Brand<string, "SubjectId">;
type PersonId = Brand<string, "PersonId">;
type ConversationSessionId = Brand<string, "ConversationSessionId">;
type TurnId = Brand<string, "TurnId">;

type ObservationId = Brand<string, "ObservationId">;
type CaptureSessionId = Brand<string, "CaptureSessionId">;
type CaptureOutputId = Brand<string, "CaptureOutputId">;

type IdentityProfileId = Brand<string, "IdentityProfileId">;
type IdentitySignalId = Brand<string, "IdentitySignalId">;
type IdentityDeltaId = Brand<string, "IdentityDeltaId">;

type CorrectionEventId = Brand<string, "CorrectionEventId">;
type ReasoningRequestId = Brand<string, "ReasoningRequestId">;
type ReasoningResponseId = Brand<string, "ReasoningResponseId">;
type ReflectionRecordId = Brand<string, "ReflectionRecordId">;

type SchemaVersion = `${number}.${number}`;
type ISO8601Timestamp = string;
```

Domain identifiers defined by CPE-CORE-002 remain owned by that specification.

---

# 7. Common Contract Envelope

Transported CPE objects should carry a common envelope.

```ts
interface ContractEnvelope<
  TType extends string,
  TPayload
> {
  contractId: ContractId;

  contractType: TType;
  schemaVersion: SchemaVersion;

  interactionKind: ContractInteractionKind;

  correlationId: CorrelationId;
  causationId?: CausationId;

  subjectId?: SubjectId;
  conversationSessionId?: ConversationSessionId;
  turnId?: TurnId;

  emittedAt: ISO8601Timestamp;

  producer: CPEComponent;

  payload: TPayload;
}
```

```ts
type CPEComponent =
  | "perception_layer"
  | "memory_layer"
  | "identity_layer"
  | "reasoning_layer"
  | "embodiment_layer"
  | "capture_subsystem"
  | "correction_workflow"
  | "runtime_orchestrator"
  | "governance_service"
  | "system";
```

The envelope is logical.

An in-process implementation may avoid physically serialising every field where equivalent correlation and tracing guarantees exist.

---

# 8. Correlation and Causation

`correlationId` groups contracts participating in one logical operation.

For a conversational turn, this may include:

```text
Observation
    ↓
MemoryRetrievalRequest
    ↓
MemoryBundle
    ↓
IdentityContext
    ↓
ReasoningRequest
    ↓
ReasoningResponse
```

These may share one correlation identifier.

`causationId` identifies the contract or event that directly caused another contract to exist.

This distinction allows reconstruction of system behaviour without requiring a single synchronous call stack.

---

# 9. Contract Ownership Matrix

| Contract | Authoritative owner | Primary consumers |
| --- | --- | --- |
| `Observation` | Perception Layer | Memory, Reasoning, Runtime |
| `PartialObservation` | Perception Layer | Memory, Reasoning, Runtime |
| `CaptureSession` | Capture Subsystem | Perception, Memory, Identity, Runtime |
| `CaptureOutput` | Capture Subsystem | Memory, Identity |
| `MemoryRecord` | Memory Layer | Memory, Identity, Reasoning |
| `MemoryCandidate` | Memory Layer | Memory, Reasoning |
| `MemoryBundle` | Memory Layer | Reasoning, Identity |
| `IdentityProfile` | Identity Layer | Reasoning, Capture review |
| `IdentitySignal` | Identity Layer / Capture Subsystem as proposal | Identity, Reasoning |
| `IdentityDelta` | Identity Layer | Identity, Governance, Reasoning refresh |
| `CorrectionEvent` | Correction Workflow | Memory, Identity, Embodiment, Governance |
| `TemporalBoundary` | Runtime / governed subject profile | Memory, Identity, Reasoning |
| `EmbodimentContext` | Embodiment Layer | Reasoning, Runtime, Memory |
| `PresenceTierConfig` | Embodiment Layer / configuration | Runtime, Reasoning, Perception, Memory |
| `LatencyBudget` | Runtime / Presence Tier | All runtime layers |
| `ConversationSession` | Runtime | All runtime layers |
| `ReasoningRequest` | Runtime / Reasoning boundary | Reasoning Layer |
| `ReasoningResponse` | Reasoning Layer | Embodiment, Runtime, Memory |
| `ReflectionRecord` | Reasoning Layer | Memory, Identity review, Runtime |

Ownership does not imply exclusive read access.

Ownership identifies which subsystem controls authoritative mutation.

---

# 10. Contract Revision State

Streaming or revisable contracts shall use explicit revision state.

```ts
interface RevisionMetadata {
  revision: number;

  state:
    | "partial"
    | "final"
    | "corrected"
    | "superseded"
    | "cancelled";

  supersedesRevision?: number;

  emittedAt: ISO8601Timestamp;
}
```

Revision numbers shall increase monotonically within a logical contract stream.

A consumer receiving revision `n + 1` must not later replace it with revision `n`.

---

# 11. Perception Contracts

# 11.1 Observation

An `Observation` represents Perception Layer interpretation of current sensory or interaction input.

It answers:

> What does the Perception Layer currently believe happened?

```ts
type ObservationSource =
  | "live_audio"
  | "live_video"
  | "text_input"
  | "gesture"
  | "document"
  | "image"
  | "environment"
  | "device"
  | "system";

interface Observation {
  id: ObservationId;

  subjectId: SubjectId;
  conversationSessionId?: ConversationSessionId;
  turnId?: TurnId;

  observedAt: ISO8601Timestamp;

  source: ObservationSource;

  participant?: {
    personId?: PersonId;
    role:
      | "subject"
      | "conversation_partner"
      | "observer"
      | "unknown";
    confidence: number;
  };

  linguistic?: {
    text: string;
    language?: string;
  };

  paralinguistic?: {
    emotion?: string;
    emotionConfidence?: number;
    speakingRate?: number;
    interruptionDetected?: boolean;
  };

  environment?: ObservationEnvironment;

  confidence: number;

  revision: RevisionMetadata;
}
```

```ts
interface ObservationEnvironment {
  locationLabel?: string;
  deviceType?: string;
  activePresenceTier?: PresenceTier;
  localTimestamp?: ISO8601Timestamp;
}
```

`Observation` is not durable autobiographical memory.

It may later produce memory candidates.

---

# 11.2 PartialObservation

`PartialObservation` supports speculative downstream processing before perception is final.

```ts
interface PartialObservation {
  observationId: ObservationId;

  subjectId: SubjectId;
  conversationSessionId?: ConversationSessionId;
  turnId?: TurnId;

  fragment: {
    text?: string;
    participantId?: PersonId;
    emotion?: string;
  };

  confidence: number;

  revision: RevisionMetadata;
}
```

A partial observation may be revised or withdrawn.

Downstream layers acting speculatively on a partial observation must retain enough correlation state to invalidate work if that observation is materially corrected.

---

# 11.3 Observation Update Rules

The Perception Layer may emit:

```text
partial revision 1
        ↓
partial revision 2
        ↓
corrected revision 3
        ↓
final revision 4
```

A downstream layer must not treat revision 1 as historically authoritative once revision 4 has superseded it.

Derived work based exclusively on a superseded observation should be:

1. cancelled;
2. recalculated; or
3. explicitly marked as based on stale perception.

---

# 12. Capture Contracts

Capture is not one of the five primary runtime layers, but it is a first-class subsystem feeding Memory and Identity.

The detailed Capture Protocol is defined by CPE-CORE-007.

CORE-003 defines only the minimum interoperable boundary.

---

# 12.1 CaptureSession

```ts
type CaptureSessionMode =
  | "structured_interview"
  | "free_recall"
  | "life_story"
  | "relationship"
  | "values"
  | "beliefs"
  | "voice"
  | "visual"
  | "behavioural"
  | "self_review"
  | "correction_review"
  | "mixed";

type CaptureSessionState =
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "abandoned"
  | "under_review";

interface CaptureSession {
  id: CaptureSessionId;
  subjectId: SubjectId;

  mode: CaptureSessionMode;
  state: CaptureSessionState;

  startedAt?: ISO8601Timestamp;
  endedAt?: ISO8601Timestamp;

  participantIds: PersonId[];

  consentRef: string;

  activePresenceTier?: PresenceTier;

  purpose?: string;
}
```

Capture-specific quality gates and readiness scoring are deferred to CPE-CORE-007.

---

# 12.2 CaptureOutput

```ts
interface CaptureOutput {
  id: CaptureOutputId;
  captureSessionId: CaptureSessionId;
  subjectId: SubjectId;

  generatedAt: ISO8601Timestamp;

  sourceObservationIds: ObservationId[];

  memoryCandidateRefs: MemoryCandidateRef[];
  identitySignals: IdentitySignal[];
  correctionEvents: CorrectionEvent[];

  relationshipSignalRefs: string[];

  reviewStatus:
    | "unreviewed"
    | "subject_reviewed"
    | "reviewer_reviewed"
    | "accepted"
    | "partially_accepted"
    | "rejected";

  quality?: {
    overall: number;
    notes?: string[];
  };
}
```

```ts
interface MemoryCandidateRef {
  candidateId: string;
}
```

CaptureOutput does not itself create authoritative memory or identity.

Memory candidates are governed by the Memory Layer.

Identity signals are governed by the Identity Layer.

---

# 13. Memory Interface Contracts

Memory schema semantics are defined normatively by CPE-CORE-002.

CORE-003 shall not redefine those structures.

The following CPE-CORE-002 types are imported as canonical contracts:

```ts
type MemoryRecord =
  | EpisodicMemoryRecord
  | SemanticMemoryRecord
  | ProceduralMemoryRecord
  | EmotionalImplicitMemoryRecord
  | CorrectionMemoryRecord
  | CollaborativeCueRecord;

interface MemoryCandidate {
  // Defined by CPE-CORE-002.
}

interface MemoryBundle {
  // Defined by CPE-CORE-002.
}

interface MemoryRetrievalRequest {
  // Defined by CPE-CORE-002.
}

interface RetrievalConfidence {
  // Defined by CPE-CORE-002.
}

type RetrievalState =
  | "searching"
  | "partial"
  | "converging"
  | "hypothesising"
  | "awaiting_collaborative_cue"
  | "complete"
  | "failed";
```

If CORE-002 and CORE-003 appear to conflict regarding a memory field or memory semantic, CORE-002 is authoritative for the memory object itself and CORE-003 is authoritative for the way that object crosses layer boundaries.

---

# 13.1 Memory Retrieval Request Boundary

The Reasoning Layer, Identity Layer, Capture Subsystem, correction workflow, or system may request memory retrieval using the CPE-CORE-002 `MemoryRetrievalRequest`.

The caller must not specify:

1. database tables;
2. SQL;
3. vector-index names;
4. embedding implementation;
5. graph database queries;
6. model-specific retrieval prompts.

It specifies retrieval intent and semantic constraints.

---

# 13.2 MemoryBundle Delivery

`MemoryBundle` may be emitted more than once for one retrieval session.

Example:

```text
MemoryBundle: searching
        ↓
MemoryBundle: partial
        ↓
MemoryBundle: converging
        ↓
MemoryBundle: hypothesising
        ↓
MemoryBundle: awaiting_collaborative_cue
        ↓
MemoryBundle: converging
        ↓
MemoryBundle: complete
```

Each update represents the current retrieval state.

Downstream layers must not assume that the first useful bundle is final.

---

# 13.3 Memory Selection Rule

`MemoryCandidate` and `selectedMemories` have different semantics.

A candidate is:

> Something retrieval considers potentially relevant.

A selected memory is:

> A memory that retrieval has committed as sufficiently relevant under the current retrieval state.

Reasoning must not represent a candidate as confirmed autobiographical recall merely because it appears in a bundle.

---

# 13.4 Memory Epistemic Rule

When consuming a `MemoryBundle`, downstream layers must respect:

1. record confidence;
2. retrieval confidence;
3. retrieval state;
4. provenance;
5. authority;
6. contradictions;
7. corrections;
8. boundary warnings;
9. consolidation status.

`retrievalConfidence` does not replace the confidence stored on each memory record.

They answer different questions.

---

# 14. Identity Interface Contracts

The complete internal Identity Model is deferred to CPE-CORE-004.

CORE-003 defines the minimum stable contract required to consume identity at runtime.

---

# 14.1 IdentityProfile

`IdentityProfile` represents the authoritative versioned profile-level identity available to runtime systems.

```ts
interface IdentityProfile {
  id: IdentityProfileId;
  subjectId: SubjectId;

  version: string;

  personality: IdentityPersonalityProfile;
  values: IdentityValue[];
  beliefs: IdentityBelief[];
  communication: IdentityCommunicationProfile;

  emotionalTendencies?: IdentityEmotionalProfile;

  boundaries: IdentityBehaviouralBoundary[];

  provenanceRefs: string[];
  correctionRefs: CorrectionEventId[];

  createdAt: ISO8601Timestamp;
  supersededAt?: ISO8601Timestamp;
}
```

The concrete internal schemas of the following types are provisional until CPE-CORE-004:

```ts
interface IdentityPersonalityProfile {
  traits: readonly IdentityTrait[];
}

interface IdentityTrait {
  key: string;
  expression: string | number | boolean;
  confidence: number;
  evidenceRefs: readonly string[];
}

interface IdentityValue {
  key: string;
  strength: number;
  confidence: number;
  evidenceRefs: readonly string[];
}

interface IdentityBelief {
  key: string;
  statement: string;
  confidence: number;
  temporalContextRef?: string;
  evidenceRefs: readonly string[];
}

interface IdentityCommunicationProfile {
  preferredTone?: string;
  typicalResponseLength?: "short" | "medium" | "long";
  humourStyle?: string;
  directness?: number;
  vocabularySignals?: readonly string[];
}

interface IdentityEmotionalProfile {
  tendencies: readonly {
    context: string;
    tendency: string;
    confidence: number;
  }[];
}

interface IdentityBehaviouralBoundary {
  key: string;
  description: string;
  strength: "preference" | "strong" | "hard";
  evidenceRefs: readonly string[];
}
```

CORE-004 may replace or extend these nested structures.

It must preserve the interface-level purpose of `IdentityProfile`.

---

# 14.2 IdentitySignal

Identity is not only a static profile.

`IdentitySignal` represents contextual identity evidence or runtime modulation.

```ts
type IdentitySignalKind =
  | "personality"
  | "value"
  | "belief"
  | "communication"
  | "emotional_tendency"
  | "relationship_expression"
  | "behavioural_boundary"
  | "identity_uncertainty"
  | "identity_mismatch";

interface IdentitySignal {
  id: IdentitySignalId;
  subjectId: SubjectId;

  kind: IdentitySignalKind;

  statement: string;

  strength: number;
  confidence: number;

  scope:
    | "global"
    | "temporal"
    | "relationship_specific"
    | "conversation_specific"
    | "embodiment_specific";

  relationshipRef?: string;
  conversationSessionId?: ConversationSessionId;
  presenceTier?: PresenceTier;

  evidenceRefs: string[];

  status:
    | "candidate"
    | "active"
    | "contested"
    | "deprecated";

  generatedAt: ISO8601Timestamp;
}
```

An `IdentitySignal` is not automatically an authoritative identity mutation.

---

# 14.3 IdentityContext

For runtime reasoning, the Identity Layer should expose a resolved contextual view.

```ts
interface IdentityContext {
  subjectId: SubjectId;

  profileId: IdentityProfileId;
  profileVersion: string;

  activeSignals: IdentitySignal[];

  relationshipContext?: {
    relationshipRef: string;
    expressionNotes?: string[];
  };

  embodimentContext?: {
    presenceTier: PresenceTier;
    expressionNotes?: string[];
  };

  activeWarnings: IdentityWarning[];

  resolvedAt: ISO8601Timestamp;
}
```

```ts
interface IdentityWarning {
  type:
    | "contested_identity"
    | "low_confidence_identity"
    | "identity_memory_conflict"
    | "pending_correction"
    | "parameter_profile_mismatch";

  severity:
    | "notice"
    | "caution"
    | "block";

  message: string;

  evidenceRefs?: string[];
}
```

`IdentityContext` is the preferred runtime boundary between Identity and Reasoning.

This avoids forcing Reasoning to reconstruct relationship-sensitive or embodiment-sensitive identity expression itself.

---

# 15. IdentityDelta

Identity must not be silently mutated.

An `IdentityDelta` represents an explicit versioned proposed or applied change.

```ts
type IdentityDeltaKind =
  | "growth"
  | "correction"
  | "contextualisation"
  | "confidence_change"
  | "deprecation"
  | "contradiction";

interface IdentityDelta {
  id: IdentityDeltaId;
  subjectId: SubjectId;

  baseProfileId: IdentityProfileId;
  baseProfileVersion: string;

  kind: IdentityDeltaKind;

  changes: IdentityFieldChange[];

  evidenceRefs: string[];
  correctionEventRefs: CorrectionEventId[];

  rationale: string;

  authorityRef: string;

  reviewStatus:
    | "proposed"
    | "under_review"
    | "accepted"
    | "partially_accepted"
    | "rejected"
    | "superseded";

  proposedAt: ISO8601Timestamp;
  resolvedAt?: ISO8601Timestamp;

  resultingProfileId?: IdentityProfileId;
  resultingProfileVersion?: string;
}
```

```ts
interface IdentityFieldChange {
  path: string;

  operation:
    | "add"
    | "replace"
    | "remove"
    | "contextualise"
    | "change_confidence";

  previousValueSummary?: string;
  proposedValueSummary?: string;

  confidenceBefore?: number;
  confidenceAfter?: number;
}
```

The detailed governance rules for identity deltas are defined by CPE-CORE-004.

---

# 16. CorrectionEvent

A `CorrectionEvent` represents a claim that some aspect of the persona, memory, identity, reasoning behaviour, or embodiment requires correction or review.

It is a governance input.

It is not itself proof that the correction is valid.

```ts
type CorrectionTargetType =
  | "memory"
  | "identity"
  | "reasoning_response"
  | "embodiment"
  | "relationship"
  | "temporal_boundary"
  | "system";

interface CorrectionEvent {
  id: CorrectionEventId;

  subjectId: SubjectId;

  raisedAt: ISO8601Timestamp;
  raisedBy: PersonId;

  target: {
    type: CorrectionTargetType;
    refs: string[];
  };

  claim: {
    issue: string;
    proposedCorrection?: string;
  };

  evidenceRefs: string[];

  authorityRef: string;

  context?: {
    conversationSessionId?: ConversationSessionId;
    turnId?: TurnId;
  };

  status:
    | "submitted"
    | "under_review"
    | "accepted"
    | "partially_accepted"
    | "rejected"
    | "superseded";
}
```

Accepted correction events may produce:

1. correction memory records;
2. identity delta proposals;
3. embodiment corrections;
4. relationship graph changes;
5. system fixes.

No layer may interpret `status: "submitted"` as an accepted correction.

---

# 17. TemporalBoundary

`TemporalBoundary` describes the temporal limit of subject-lived or subject-captured knowledge.

It is session-relevant governance context rather than simply a date.

```ts
interface TemporalBoundary {
  subjectId: SubjectId;

  boundaryAt?: ISO8601Timestamp;

  boundaryType:
    | "death"
    | "capture_end"
    | "preservation_freeze"
    | "configured"
    | "unknown";

  confidence: number;

  policy: {
    mayDiscussPostBoundaryEvents: boolean;
    mayUsePostBoundaryInteractionMemory: boolean;
    mustExplicitlyDistinguishPersonaContinuity: boolean;
  };

  evidenceRefs: string[];

  updatedAt: ISO8601Timestamp;
}
```

`TemporalBoundary` is distinct from CPE-CORE-002 `KnowledgeBoundaryStatus`.

`TemporalBoundary` describes the subject-level boundary.

`KnowledgeBoundaryStatus` describes how an individual memory relates to that boundary.

---

# 18. PresenceTierConfig

A presence tier describes the active interaction metaphor and the constraints it places on the rest of the system.

```ts
type PresenceTier =
  | "text"
  | "voice"
  | "video_avatar"
  | "scene_avatar"
  | "vr_ar"
  | "robotics";

interface PresenceTierConfig {
  tier: PresenceTier;

  uxMetaphor:
    | "messaging"
    | "phone_call"
    | "video_call"
    | "shared_scene"
    | "co_present_space"
    | "physical_presence";

  responseStyle:
    | "structured_reflective"
    | "brief_natural"
    | "socially_timed"
    | "emotionally_present"
    | "spatial_reactive"
    | "safety_constrained";

  interruptionPolicy:
    | "none"
    | "allow_cancel"
    | "allow_barge_in"
    | "continuous";

  progressiveRecallSupported: boolean;

  renderingCapabilities: {
    text: boolean;
    voice: boolean;
    face: boolean;
    gaze: boolean;
    gesture: boolean;
    spatialAction: boolean;
    physicalAction: boolean;
  };

  latencyProfileRef: string;

  failureVocabularyProfileRef: string;
}
```

Final tier semantics belong to CPE-CORE-006.

---

# 19. EmbodimentContext

The Embodiment Layer supplies `EmbodimentContext` upstream so Reasoning can generate responses suitable for the active presence.

```ts
interface EmbodimentContext {
  subjectId: SubjectId;
  conversationSessionId: ConversationSessionId;

  presenceTier: PresenceTier;
  config: PresenceTierConfig;

  state: {
    currentlySpeaking: boolean;
    currentlyRendering: boolean;

    interruptible: boolean;

    visibleToUser: boolean;
    audibleToUser: boolean;
  };

  expressionCapabilities: {
    speech: boolean;
    prosody: boolean;
    facialExpression: boolean;
    gaze: boolean;
    gesture: boolean;
    posture: boolean;
    physicalAction: boolean;
  };

  failureVocabulary: {
    missedInput?: string;
    latencyDelay?: string;
    uncertainty?: string;
    interruption?: string;
  };

  generatedAt: ISO8601Timestamp;
}
```

Reasoning must not generate required expression modalities that the current embodiment cannot support.

---

# 20. LatencyBudget

Latency is an explicit runtime contract.

```ts
type LatencyDisposition =
  | "continue"
  | "degrade"
  | "fallback"
  | "cancel";

interface LayerLatencyBudget {
  targetMs: number;
  softLimitMs: number;
  hardLimitMs: number;
}

interface LatencyBudget {
  total: LayerLatencyBudget;

  perception?: LayerLatencyBudget;
  memory?: LayerLatencyBudget;
  identity?: LayerLatencyBudget;
  reasoning?: LayerLatencyBudget;
  embodiment?: LayerLatencyBudget;

  onSoftLimit:
    | "continue"
    | "emit_progress"
    | "degrade_depth"
    | "begin_progressive_response";

  onHardLimit: LatencyDisposition;

  issuedAt: ISO8601Timestamp;
}
```

A latency budget is not permission to fabricate a result.

Fidelity, temporal honesty, and epistemic integrity remain constraints when latency is exceeded.

---

# 21. ConversationSession

`ConversationSession` represents the runtime scope of an active interaction.

```ts
type ConversationSessionState =
  | "initialising"
  | "active"
  | "paused"
  | "ending"
  | "ended"
  | "failed";

interface ConversationParticipant {
  personId: PersonId;

  role:
    | "subject"
    | "conversation_partner"
    | "observer"
    | "operator";

  relationshipRef?: string;
}

interface ConversationSession {
  id: ConversationSessionId;

  subjectId: SubjectId;

  state: ConversationSessionState;

  participants: ConversationParticipant[];

  presenceTier: PresenceTier;

  temporalBoundary: TemporalBoundary;

  latencyBudget: LatencyBudget;

  startedAt: ISO8601Timestamp;
  endedAt?: ISO8601Timestamp;

  activeTurnId?: TurnId;

  activeRetrievalSessionIds: string[];

  activeIdentityProfileVersion?: string;
}
```

`ConversationSession` is runtime state.

It is not itself autobiographical memory.

Significant session events may later become interaction memory candidates through governed consolidation.

---

# 22. ReasoningRequest

The runtime passes a `ReasoningRequest` to the Reasoning Layer.

A reasoning request may be issued before all dependencies are final.

```ts
interface ReasoningRequest {
  id: ReasoningRequestId;

  subjectId: SubjectId;
  conversationSessionId: ConversationSessionId;
  turnId: TurnId;

  observation: Observation;

  memory: ReasoningMemoryInput;

  identity: IdentityContext;

  temporalBoundary: TemporalBoundary;

  embodiment: EmbodimentContext;

  latencyBudget: LatencyBudget;

  safetyConstraints: SafetyConstraint[];

  mode:
    | "fast_response"
    | "reflective_response"
    | "speculative_planning"
    | "progressive_recall"
    | "repair"
    | "action_planning";

  issuedAt: ISO8601Timestamp;
}
```

```ts
type ReasoningMemoryInput =
  | {
      status: "not_requested";
    }
  | {
      status: "pending";
      retrievalSessionId: string;
      latestBundle?: MemoryBundle;
    }
  | {
      status: "available";
      bundle: MemoryBundle;
    };
```

```ts
interface SafetyConstraint {
  key: string;
  instruction: string;
  severity: "advisory" | "required" | "blocking";
}
```

The use of `ReasoningMemoryInput` explicitly permits parallel reasoning and memory retrieval.

---

# 23. ReasoningResponse

`ReasoningResponse` is the semantic output of the Reasoning Layer.

It is not a voice waveform, avatar animation, or transport-specific token stream.

```ts
type ReasoningResponseKind =
  | "answer"
  | "acknowledgement"
  | "clarification"
  | "retrieval_hypothesis"
  | "retrieval_failure"
  | "conversation_repair"
  | "action_proposal"
  | "boundary_response";

interface ReasoningResponse {
  id: ReasoningResponseId;

  requestId: ReasoningRequestId;
  subjectId: SubjectId;
  conversationSessionId: ConversationSessionId;
  turnId: TurnId;

  kind: ReasoningResponseKind;

  content: ReasoningContent;

  grounding: ResponseGrounding;

  identity: ResponseIdentityGrounding;

  temporal: ResponseTemporalGrounding;

  expression: ExpressionIntent;

  confidence: ResponseConfidence;

  memoryCandidates: MemoryFormationCandidate[];

  reflection?: ReflectionRecord;

  revision: RevisionMetadata;
}
```

---

# 23.1 Reasoning Content

```ts
interface ReasoningContent {
  text: string;

  speechActs?: Array<
    | "inform"
    | "ask"
    | "acknowledge"
    | "remember"
    | "hypothesise"
    | "clarify"
    | "apologise"
    | "decline"
    | "act"
  >;
}
```

---

# 23.2 Response Grounding

```ts
interface ResponseGrounding {
  memoryBundleId?: string;

  selectedMemoryRefs: string[];

  candidateMemoryRefs: string[];

  retrievalState?: RetrievalState;

  retrievalConfidence?: number;

  contradictionRefs: string[];

  correctionRefs: string[];

  provenanceRefs: string[];

  unsupportedInferenceUsed: boolean;

  inferenceNotes?: string[];
}
```

A response must not represent `candidateMemoryRefs` as confirmed recall merely because they were available during reasoning.

---

# 23.3 Identity Grounding

```ts
interface ResponseIdentityGrounding {
  identityProfileId: IdentityProfileId;
  identityProfileVersion: string;

  appliedSignalRefs: IdentitySignalId[];

  warningRefs: string[];

  mismatchDetected: boolean;
}
```

---

# 23.4 Temporal Grounding

```ts
interface ResponseTemporalGrounding {
  boundaryApplied: boolean;

  status:
    | "within_boundary"
    | "boundary_adjacent"
    | "post_boundary"
    | "mixed"
    | "unknown";

  postBoundaryKnowledgeUsed: boolean;

  personaContinuityDistinguished: boolean;

  warnings: string[];
}
```

---

# 23.5 Expression Intent

Reasoning communicates semantic expressive intent.

Embodiment decides how to render it.

```ts
interface ExpressionIntent {
  intendedTone?: string;

  pacing?:
    | "quick"
    | "natural"
    | "slow"
    | "hesitant"
    | "reflective";

  affect?:
    | "neutral"
    | "warm"
    | "amused"
    | "sad"
    | "uncertain"
    | "concerned"
    | "reflective";

  progressiveRecallPhase?:
    | "none"
    | "searching"
    | "partial"
    | "approaching_recall"
    | "hypothesis"
    | "recollection"
    | "failure";

  gestureIntent?: string;
  facialIntent?: string;

  allowDynamicContinuation: boolean;
}
```

This contract communicates intent rather than renderer-specific animation identifiers.

---

# 23.6 Response Confidence

```ts
interface ResponseConfidence {
  overall: number;

  factual?: number;
  identity?: number;
  temporal?: number;
  retrieval?: number;

  status:
    | "high"
    | "medium"
    | "low"
    | "contested"
    | "unknown";

  explanation?: string[];
}
```

Response confidence must not exceed available evidence without an explicit reason.

---

# 24. Streaming Reasoning Response

Reasoning may emit progressive updates.

```ts
interface ReasoningResponseUpdate {
  responseId: ReasoningResponseId;

  requestId: ReasoningRequestId;

  operation:
    | "append_content"
    | "replace_content"
    | "update_grounding"
    | "update_expression"
    | "update_confidence"
    | "complete"
    | "cancel";

  textDelta?: string;

  grounding?: Partial<ResponseGrounding>;
  expression?: Partial<ExpressionIntent>;
  confidence?: Partial<ResponseConfidence>;

  revision: RevisionMetadata;
}
```

An implementation may stream tokens internally.

The CPE contract is semantic.

A model token is not itself a CPE inter-layer contract.

---

# 25. Dynamic Memory Injection

During Progressive Recall Response, a Reasoning operation may receive newer `MemoryBundle` snapshots after generation has started.

Example:

```text
Reasoning starts
    │
    ├── MemoryBundle: searching
    │
    ├── Reasoning: "Give me a second..."
    │
    ├── MemoryBundle: partial
    │
    ├── Reasoning expression becomes hesitant/fragmentary
    │
    ├── MemoryBundle: converging
    │
    ├── MemoryBundle: complete
    │
    └── Reasoning continues with grounded recollection
```

The runtime must correlate the new `MemoryBundle` with the active reasoning operation.

The Reasoning Layer must not assume the retrieval state that existed at request creation remains current.

Exact orchestration is deferred to CPE-CORE-005.

---

# 26. Collaborative Retrieval Contract

When retrieval enters the hypothesise zone, Reasoning may surface the hypothesis to the conversation partner.

If the partner responds, Perception produces a normal observation.

Reasoning or the Memory Layer classifies that observation as a collaborative cue associated with the existing retrieval session.

```text
MemoryBundle
[hypothesising]
        ↓
ReasoningResponse
[retrieval_hypothesis]
        ↓
Embodiment
        ↓
Partner response
        ↓
Observation
        ↓
CollaborativeCueRecord
        ↓
Existing retrieval session resumes
        ↓
Updated MemoryBundle
```

A collaborative cue must reference the existing retrieval session whenever possible.

It must not automatically become historical memory.

---

# 27. Memory Formation Candidate

Reasoning may identify information that should be considered for later memory formation.

It must not directly create authoritative durable memory.

```ts
interface MemoryFormationCandidate {
  source:
    | "user_disclosure"
    | "persona_statement"
    | "shared_interaction"
    | "reasoning_inference"
    | "explicit_remember_request";

  summary: string;

  participantRefs: PersonId[];

  sourceObservationRefs: ObservationId[];

  confidence: number;

  recommendedMemoryType:
    | "interaction"
    | "derived"
    | "collaborative_cue";

  requiresReview: boolean;
}
```

These are inputs to the Memory Layer's governed memory-creation process.

---

# 28. ReflectionRecord

A `ReflectionRecord` represents Reasoning Layer assessment of its own output or behaviour.

It is not historical autobiographical memory.

```ts
interface ReflectionRecord {
  id: ReflectionRecordId;

  subjectId: SubjectId;
  conversationSessionId?: ConversationSessionId;
  turnId?: TurnId;

  responseId?: ReasoningResponseId;

  generatedAt: ISO8601Timestamp;

  assessments: {
    identityConsistency?: number;
    memoryGrounding?: number;
    temporalCoherence?: number;
    communicationFidelity?: number;
    embodimentSuitability?: number;
  };

  warnings: ReflectionWarning[];

  proposedActions: ReflectionAction[];

  evidenceRefs: string[];
}
```

```ts
interface ReflectionWarning {
  type:
    | "identity_mismatch"
    | "possible_confabulation"
    | "boundary_risk"
    | "memory_contradiction"
    | "tone_mismatch"
    | "low_confidence"
    | "embodiment_mismatch";

  severity:
    | "notice"
    | "caution"
    | "critical";

  description: string;
}
```

```ts
interface ReflectionAction {
  type:
    | "create_memory_candidate"
    | "request_deeper_retrieval"
    | "propose_identity_review"
    | "propose_correction_review"
    | "request_capture"
    | "no_action";

  rationale: string;
}
```

Reflection records may trigger governed review.

They shall not silently alter identity or historical memory.

---

# 29. Inter-Layer Event Envelope

System events use a common event structure.

```ts
interface CPEEvent<
  TType extends string,
  TPayload
> {
  eventId: ContractId;
  eventType: TType;

  schemaVersion: SchemaVersion;

  correlationId: CorrelationId;
  causationId?: CausationId;

  subjectId?: SubjectId;
  conversationSessionId?: ConversationSessionId;
  turnId?: TurnId;

  producer: CPEComponent;

  occurredAt: ISO8601Timestamp;

  payload: TPayload;
}
```

Events describe completed or observed transitions.

They should normally use past-tense semantic names.

---

# 30. Standard Event Families

## 30.1 Perception Events

```ts
type PerceptionEventType =
  | "observation.started"
  | "observation.updated"
  | "observation.corrected"
  | "observation.finalised"
  | "observation.cancelled";
```

---

## 30.2 Memory Events

```ts
type MemoryEventType =
  | "memory.retrieval_started"
  | "memory.retrieval_updated"
  | "memory.hypothesis_generated"
  | "memory.awaiting_collaborative_cue"
  | "memory.retrieval_completed"
  | "memory.retrieval_failed"
  | "memory.candidate_created"
  | "memory.consolidation_requested"
  | "memory.consolidation_completed"
  | "memory.corrected"
  | "memory.suppressed";
```

---

## 30.3 Identity Events

```ts
type IdentityEventType =
  | "identity.context_resolved"
  | "identity.signal_created"
  | "identity.delta_proposed"
  | "identity.delta_accepted"
  | "identity.delta_rejected"
  | "identity.profile_versioned"
  | "identity.warning_detected";
```

---

## 30.4 Reasoning Events

```ts
type ReasoningEventType =
  | "reasoning.started"
  | "reasoning.updated"
  | "reasoning.response_started"
  | "reasoning.response_completed"
  | "reasoning.response_cancelled"
  | "reasoning.reflection_created"
  | "reasoning.memory_candidate_proposed";
```

---

## 30.5 Embodiment Events

```ts
type EmbodimentEventType =
  | "embodiment.rendering_started"
  | "embodiment.rendering_updated"
  | "embodiment.rendering_completed"
  | "embodiment.rendering_cancelled"
  | "embodiment.rendering_failed"
  | "embodiment.interruption_detected";
```

---

## 30.6 Governance Events

```ts
type GovernanceEventType =
  | "correction.submitted"
  | "correction.review_started"
  | "correction.accepted"
  | "correction.partially_accepted"
  | "correction.rejected";
```

The definitive transport binding of events is deferred to CPE-CORE-005.

---

# 31. Epistemic Propagation Rules

Epistemic state is load-bearing CPE data.

It shall not be treated as diagnostic metadata that downstream layers may discard.

---

# 31.1 No Silent Confidence Inflation

If Memory reports:

```text
retrieval zone = hypothesise
```

Reasoning must not state the candidate as certain autobiographical memory unless new evidence changes the state.

If Reasoning does transform the confidence interpretation, that transformation must be explicit and traceable.

---

# 31.2 Provenance Preservation

When a Reasoning response relies on memory records, the response grounding must retain references sufficient to recover their provenance.

The Reasoning Layer need not duplicate the full provenance object.

It must not sever the reference.

---

# 31.3 Authority Preservation

A system inference with low authority must not become high-authority persona knowledge merely because an LLM expressed it fluently.

Fluency is not authority.

---

# 31.4 Temporal Preservation

Post-boundary information must remain identifiable as post-boundary through:

```text
Memory
    ↓
Identity
    ↓
Reasoning
    ↓
Embodiment
```

Embodiment may make the language natural.

It may not erase the temporal distinction.

---

# 31.5 Contradiction Preservation

Significant unresolved contradictions surfaced by Memory must remain available to Reasoning.

Reasoning may contextualise contradiction.

It shall not silently resolve it by selecting whichever record produces the most convenient response.

---

# 31.6 Correction Preservation

Accepted corrections override behaviour according to their governed scope.

Pending or disputed corrections remain warnings rather than unquestioned truth.

---

# 31.7 Consolidation Preservation

Unconsolidated interaction memory may support conversational continuity where CORE-002 permits it.

It shall not be represented to Identity as authoritative identity evidence unless its consolidation status permits identity influence.

---

# 32. Blocking Semantics

Streaming by default does not mean nothing may block.

A layer may block downstream progression where continuing would materially risk:

1. temporal dishonesty;
2. major identity misrepresentation;
3. use of prohibited or withdrawn data;
4. critical contradiction;
5. unsafe physical action;
6. invalid correction authority;
7. loss of required consent;
8. critical confidence failure.

Blocking conditions must be explicit.

---

# 33. Non-Blocking Semantics

A layer should not block merely because:

1. deeper retrieval is still running;
2. optional enrichment has not completed;
3. a low-priority reflection has not been generated;
4. post-session consolidation is pending;
5. non-critical analytics are unavailable.

Where the presence tier permits it, Progressive Recall Response should be preferred over unnecessary silence.

---

# 34. Fallback Semantics

Fallback must preserve epistemic honesty.

Examples of valid fallback:

```text
Deep retrieval exceeds soft latency limit
        ↓
Use fast retrieval result
        ↓
Retain "partial" or low-confidence state
        ↓
Generate appropriately uncertain response
```

Invalid fallback:

```text
Retrieval times out
        ↓
Invent plausible autobiographical answer
```

A fallback may reduce fidelity or richness.

It must not create false certainty.

---

# 35. Error Contract

Operational failure should be represented separately from epistemic uncertainty.

```ts
type CPEErrorCode =
  | "timeout"
  | "cancelled"
  | "dependency_unavailable"
  | "invalid_contract"
  | "unsupported_schema_version"
  | "permission_denied"
  | "consent_restricted"
  | "boundary_block"
  | "governance_block"
  | "safety_block"
  | "internal_failure";

interface CPEError {
  code: CPEErrorCode;

  message: string;

  retryable: boolean;

  degradedOperationAvailable: boolean;

  correlationId: CorrelationId;

  occurredAt: ISO8601Timestamp;
}
```

`memory.retrieval_failed` because no memory could be recalled is not necessarily an infrastructure error.

It is an epistemic retrieval outcome.

That distinction must be preserved.

---

# 36. Cancellation

Live conversation requires cancellation.

A new observation, interruption, correction, or session transition may invalidate active work.

```ts
interface CancellationRequest {
  targetContractId: ContractId;

  reason:
    | "user_interrupted"
    | "observation_corrected"
    | "newer_request"
    | "session_ended"
    | "latency_budget_exceeded"
    | "safety"
    | "governance"
    | "system";

  requestedAt: ISO8601Timestamp;
}
```

A cancelled operation should emit a final cancellation state or event where the transport permits it.

---

# 37. Supersession

Supersession differs from cancellation.

Cancellation means:

> Stop this work.

Supersession means:

> A newer result should replace this one.

Examples:

- a corrected transcription supersedes a partial transcription;
- IdentityProfile v1.3 supersedes v1.2;
- a later MemoryBundle snapshot supersedes an earlier retrieval snapshot.

Historical audit records may remain available.

Runtime consumers should use the newest valid state.

---

# 38. Idempotency

State-changing commands should support idempotent processing.

Repeated delivery of the same `CorrectionEvent`, identity delta acceptance, or consolidation command must not create duplicate authoritative state.

The precise mechanism is transport-specific.

The contract identifier should be usable as an idempotency key where appropriate.

---

# 39. Ordering

Ordering guarantees are local to a logical stream.

CPE does not require total global event ordering.

The following streams require monotonic logical ordering:

1. revisions of one observation;
2. snapshots of one retrieval session;
3. updates of one reasoning response;
4. versions of one identity profile;
5. state changes of one correction event;
6. lifecycle changes of one conversation session.

Timestamps alone should not be relied upon for conflict resolution.

---

# 40. Schema Versioning

Every externally exchanged contract must have a schema version.

Versioning follows:

```text
major.minor
```

Examples:

```text
1.0
1.1
2.0
```

---

# 40.1 Minor Changes

A minor version may:

1. add optional fields;
2. add non-breaking metadata;
3. add enum values where consumers are required to support unknown future values safely;
4. clarify semantics without changing meaning.

---

# 40.2 Major Changes

A major version is required when:

1. a required field is removed;
2. a required field changes meaning;
3. field interpretation changes incompatibly;
4. state-machine semantics change incompatibly;
5. ownership moves between layers in a breaking way.

---

# 40.3 Unknown Fields

Consumers should ignore unknown optional fields unless policy requires rejection.

They must not reinterpret them.

---

# 40.4 Unknown Enum Values

Implementations should prefer explicit fallback handling over unsafe assumptions.

Where schemas support extensibility, an unrecognised enum value should produce:

```text
unsupported / unknown
```

rather than being mapped silently to the closest known value.

---

# 41. Layer Boundary Summary

The primary live interaction flow is:

```text
┌────────────────────┐
│ Perception Layer   │
└─────────┬──────────┘
          │
          │ Observation / PartialObservation
          ▼
┌────────────────────┐
│ Runtime / Memory   │
└─────────┬──────────┘
          │
          │ MemoryRetrievalRequest
          ▼
┌────────────────────┐
│ Memory Layer       │
└─────────┬──────────┘
          │
          │ MemoryBundle stream
          ▼
┌────────────────────┐
│ Identity Layer     │
└─────────┬──────────┘
          │
          │ IdentityContext
          ▼
┌────────────────────┐
│ Reasoning Layer    │◄──────── EmbodimentContext
└─────────┬──────────┘
          │
          │ ReasoningResponse stream
          ▼
┌────────────────────┐
│ Embodiment Layer   │
└────────────────────┘
```

This diagram is conceptual.

CORE-005 may execute portions in parallel.

---

# 42. Standard Conversational Turn

A normal turn may proceed as follows.

```text
1. ConversationSession active

2. Perception emits PartialObservation

3. Runtime may begin:
   - speculative memory retrieval
   - speculative reasoning preparation

4. Perception emits final Observation

5. Retrieval request is confirmed or revised

6. Memory emits:
   searching
   → partial
   → converging
   → complete

7. Identity resolves:
   profile
   + relationship context
   + embodiment context
   + correction warnings

8. Runtime creates ReasoningRequest

9. Reasoning generates ReasoningResponse updates

10. Embodiment begins rendering where tier permits

11. ReasoningResponse completes

12. Reasoning may emit:
   - MemoryFormationCandidate
   - ReflectionRecord

13. Session state is updated

14. Post-session consolidation may occur later
```

Steps may overlap.

The sequence does not imply synchronous execution.

---

# 43. Progressive Recall Turn

A Progressive Recall turn may operate as follows.

```text
User asks partial autobiographical question
        ↓
Observation finalised
        ↓
Associative MemoryRetrievalRequest
        ↓
MemoryBundle: searching
        ↓
Reasoning begins retrieval-aware expression
        ↓
"Give me a second..."
        ↓
MemoryBundle: partial
        ↓
Reasoning may surface fragments cautiously
        ↓
MemoryBundle: converging
        ↓
A. Confidence reaches commit zone
        │
        └──► MemoryBundle: complete
             ↓
             Confident recollection

OR

B. Confidence reaches hypothesise zone
        │
        └──► RetrievalHypothesis
             ↓
             ReasoningResponse: retrieval_hypothesis
             ↓
             Embodiment expresses uncertainty
             ↓
             Partner supplies collaborative cue
             ↓
             Existing retrieval resumes
             ↓
             complete or failed
```

This flow requires streaming contracts.

It must not be implemented as artificial hesitation over an already-complete lookup.

---

# 44. Correction Flow

```text
CorrectionEvent submitted
        ↓
Authority + evidence review
        ↓
Target classification
        │
        ├── Memory
        │      ↓
        │   CorrectionMemoryRecord
        │
        ├── Identity
        │      ↓
        │   IdentityDelta proposal
        │
        ├── Embodiment
        │      ↓
        │   Embodiment review/update
        │
        └── System
               ↓
            Technical remediation
        ↓
Governed resolution
        ↓
Versioned state update
        ↓
Affected runtime contexts refreshed
```

The original state must remain auditable where governance requires it.

Correction is not destructive rewriting.

---

# 45. Identity Refresh Flow

When an accepted IdentityDelta creates a new IdentityProfile version:

```text
IdentityProfile v1.2
        ↓
IdentityDelta accepted
        ↓
IdentityProfile v1.3
        ↓
identity.profile_versioned
        ↓
Active ConversationSession notified
        ↓
IdentityContext refreshed
        ↓
Subsequent ReasoningRequest uses v1.3
```

An in-progress response may continue using the identity version with which it started unless the delta is marked critical.

Critical refresh semantics are deferred to CPE-CORE-005 and CPE-CORE-004.

---

# 46. Embodiment Feedback

Embodiment is not a passive sink.

It may report runtime state upstream.

Examples:

1. user interruption;
2. renderer delay;
3. loss of voice capability;
4. avatar unavailable;
5. physical action unavailable;
6. presence tier changed;
7. rendering cancelled.

These changes may alter:

- latency budget;
- response length;
- interruption handling;
- Progressive Recall support;
- reasoning register.

An embodiment implementation must not alter semantic content simply to hide an upstream epistemic failure.

---

# 47. Data Minimisation

Contracts should carry the information required by the consumer rather than exposing an entire layer's internal state.

For example:

Reasoning may need:

- selected memory references;
- candidate references;
- confidence;
- provenance references;
- contradiction warnings.

It does not necessarily need:

- database partition identifiers;
- raw vector representations;
- graph-engine execution plans.

Similarly, Embodiment does not need the full memory record merely to render uncertainty.

---

# 48. Sensitive Data and Consent Propagation

Where a contract references governed memory, consent restrictions must remain enforceable downstream.

A contract must not turn a restricted memory into unrestricted free text solely to bypass consent policy.

Consumers should receive either:

1. authorised content;
2. an authorised projection;
3. a reference with restricted access;
4. a governed denial.

Detailed access-control architecture is outside the scope of v0.1.

---

# 49. Interim Implementation Compatibility

The interim CPE implementation may use retrieval-augmented generation.

A typical mapping is:

```text
MemoryRetrievalRequest
        ↓
Memory service
        ↓
Vector / graph / temporal / authority retrieval
        ↓
MemoryBundle
        ↓
Reasoning adapter
        ↓
Model context
```

The Reasoning adapter may translate CPE contracts into model-specific prompts or context representations.

That translation is internal implementation.

Model-specific prompt structures must not leak back into the canonical inter-layer contract.

---

# 50. Target Memory Interface Compatibility

A future reasoning model may consume external memory through:

1. cross-attention;
2. learned memory tokens;
3. dedicated memory encoders;
4. persistent native memory state;
5. graph-native interfaces;
6. structured symbolic memory channels.

In that architecture:

```text
MemoryBundle
```

may be mapped to a model-native memory representation instead of prompt text.

The semantic contract remains valid.

---

# 51. Contract Validation

Every layer boundary should validate:

1. required fields;
2. schema version compatibility;
3. identifier type;
4. subject consistency;
5. session consistency;
6. revision ordering;
7. enum validity;
8. confidence range;
9. temporal format;
10. ownership assumptions.

Validation failure should produce an explicit contract error rather than silent coercion where coercion could affect fidelity.

---

# 52. Contract Invariants

The following invariants are normative.

## INV-001

A `MemoryCandidate` is not equivalent to a committed memory retrieval.

## INV-002

A `RetrievalHypothesis` is not equivalent to remembered fact.

## INV-003

A `CollaborativeCueRecord` is not automatically historical memory.

## INV-004

An unconsolidated interaction memory must not silently influence persistent identity parameters.

## INV-005

A pending correction is not an accepted correction.

## INV-006

A Reasoning response must preserve material temporal-boundary state.

## INV-007

Embodiment must not express greater certainty than the semantic response supports.

## INV-008

Reasoning must not directly authoritatively mutate Identity.

## INV-009

Reasoning must not directly create durable historical memory.

## INV-010

A partial observation may be superseded by later perception.

## INV-011

A partial MemoryBundle may be superseded by a later retrieval snapshot.

## INV-012

Schema transport details must not define domain semantics.

## INV-013

A model-generated inference does not gain authority merely by being generated.

## INV-014

Post-boundary interaction continuity must remain distinguishable from subject-lived history.

## INV-015

Operational failure and epistemic uncertainty are distinct states.

---

# 53. Failure Modes

## 53.1 Contract Leakage

A layer exposes implementation-specific objects downstream.

Example:

> Reasoning depends directly on pgvector row format.

Impact:

- tight coupling;
- poor portability;
- future migration difficulty.

---

## 53.2 Epistemic Flattening

Confidence, provenance, contradiction, or boundary state is discarded during transformation.

Impact:

- false certainty;
- confabulation;
- loss of source monitoring.

---

## 53.3 Candidate-as-Memory Error

A retrieved candidate is treated as committed recollection.

Impact:

- false autobiographical claims.

---

## 53.4 Interaction-as-History Error

A post-boundary interaction becomes indistinguishable from subject-lived memory.

Impact:

- historical corruption;
- identity drift.

---

## 53.5 Identity Bypass

Reasoning invents or overrides personality constraints without Identity Layer governance.

Impact:

- identity inconsistency.

---

## 53.6 Stale Revision Consumption

A downstream layer acts on a superseded partial observation or retrieval result.

Impact:

- incorrect response;
- conversational incoherence.

---

## 53.7 Latency-Induced Fabrication

A layer substitutes an unsupported answer because retrieval exceeds a latency budget.

Impact:

- fidelity failure.

---

## 53.8 Transport-Coupled Schema

Contract design assumes one broker, database, API style, or foundation model.

Impact:

- architectural lock-in.

---

## 53.9 Hidden Correction

Existing state is destructively overwritten without an auditable correction event or version.

Impact:

- loss of provenance;
- governance failure.

---

## 53.10 Confidence Inflation

A downstream layer expresses stronger certainty than upstream evidence supports.

Impact:

- trust degradation;
- false memory presentation.

---

# 54. Deferred Decisions

The following are intentionally deferred.

## To CPE-CORE-004

1. Final IdentityProfile schema.
2. Personality representation.
3. Values model.
4. Belief model.
5. Narrative continuity semantics.
6. Identity authority rules.
7. Full IdentityDelta governance.
8. Relationship-specific identity resolution.
9. Post-death identity correction policy.
10. Profile-level versus parameter-level reconciliation.

---

## To CPE-CORE-005

1. Runtime topology.
2. Service boundaries.
3. Scheduling.
4. Concurrency primitives.
5. Full-duplex transport.
6. Back-pressure implementation.
7. Retry scheduling.
8. Hot-cache orchestration.
9. Speculative execution.
10. Interrupt timing.
11. Dynamic memory injection implementation.
12. Exact latency degradation policy.
13. Event transport binding.

---

## To CPE-CORE-006

1. Final PresenceTierConfig semantics.
2. Voice rendering contract.
3. Visual rendering contract.
4. Gesture vocabulary.
5. Failure vocabulary.
6. Progressive Recall embodiment behaviour.
7. Trust calibration.
8. Robotics action constraints.

---

## To CPE-CORE-007

1. Capture quality gates.
2. Readiness metrics.
3. Capture workflow states.
4. Capture review protocol.
5. Required consent model by capture mode.
6. Capture coverage metrics.
7. Self-interaction review protocol.

---

# 55. Open Questions

## OQ-001 — Contract Envelope

Should the common contract envelope be normative across all deployments, or should it define logical fields that an in-process runtime may supply implicitly?

Recommended v0.1 position:

> Treat the fields as logically normative while allowing equivalent in-process representation.

---

## OQ-002 — Snapshot vs Delta Memory Streaming

Should progressive `MemoryBundle` delivery transmit:

1. complete replacement snapshots; or
2. delta updates?

Recommended v0.1 position:

> Treat `MemoryBundle` semantically as a snapshot. A transport may optimise it into deltas provided the consumer can reconstruct the same snapshot deterministically.

This minimises ambiguity in early implementations.

---

## OQ-003 — IdentityContext

Should `IdentityContext` become a first-class CORE-003 contract even though CORE-001 explicitly lists only `IdentityProfile` and `IdentitySignal`?

Recommended v0.1 position:

> Yes. Reasoning requires a resolved runtime identity view, and making Reasoning resolve raw identity evidence would violate Identity Primacy.

---

## OQ-004 — ReasoningRequest Ownership

Should Runtime construct `ReasoningRequest`, or should Reasoning expose an API accepting each dependency independently?

Recommended v0.1 position:

> Treat `ReasoningRequest` as the logical invocation boundary. CORE-005 may implement dynamic updates to its constituent inputs during execution.

---

## OQ-005 — Dynamic Memory Injection

Should a running Reasoning operation accept MemoryBundle updates directly, or should Runtime cancel and restart generation?

Recommended v0.1 position:

> The contract should permit updates. CORE-005 should determine which reasoning implementations can consume them natively and which require restart or continuation.

---

## OQ-006 — Generic JSON Extension Fields

Should contracts expose unrestricted `metadata: Record<string, unknown>` extension fields?

Recommended v0.1 position:

> No by default. Arbitrary metadata encourages hidden contracts and implementation leakage. Extensions should use explicitly versioned namespaces where a genuine need emerges.

---

## OQ-007 — Correction Authority

Should `CorrectionEvent` embed the complete authority object or reference governed authority state?

Recommended v0.1 position:

> Reference the authority object while preserving a historically auditable authority snapshot at the governance layer.

---

## OQ-008 — Event Sourcing

Should all CPE state be reconstructable solely from events?

Recommended v0.1 position:

> No requirement yet. Contracts must be auditable and replay-friendly, but full event sourcing is an implementation decision for CORE-005.

---

## OQ-009 — Identity Refresh During Active Response

When identity changes during an active response, under what circumstances must the response be cancelled?

Deferred to CORE-004 and CORE-005.

---

## OQ-010 — Physical Action Contracts

Should robotics use the same `ReasoningResponse` plus Expression Intent, or require a separate governed action-intent contract?

Recommended direction:

> Physical action likely requires a dedicated contract because action safety and conversational expression have materially different consequences. Final decision belongs to CORE-006.

---

# 56. Recommended v0.2 Work

Before CPE-CORE-003 is marked stable:

1. Validate every memory reference against CPE-CORE-002 v0.3.
2. Draft CPE-CORE-004 far enough to validate `IdentityProfile`, `IdentitySignal`, `IdentityContext`, and `IdentityDelta`.
3. Draft the CORE-005 runtime sequence model against the streaming contracts.
4. Validate `EmbodimentContext` and `PresenceTierConfig` during CORE-006 design.
5. Validate Capture contracts against initial CORE-007 design.
6. Define machine-readable JSON Schema or TypeScript reference schemas.
7. Add normative state diagrams for:
   - Observation revisions.
   - Memory retrieval.
   - Reasoning response lifecycle.
   - Conversation session lifecycle.
   - Correction lifecycle.
8. Define compatibility test cases.
9. Define example end-to-end contract payloads.
10. Resolve open questions that affect interoperability.

---

# 57. Summary

CPE-CORE-003 defines the semantic boundary between Continuous Presence Engine layers.

The architecture is contract-first.

Perception communicates observations rather than sensor implementation.

Memory communicates governed memory and retrieval state rather than storage implementation.

Identity communicates authoritative profiles and contextual identity constraints rather than model parameters.

Reasoning communicates semantically grounded responses rather than model tokens.

Embodiment communicates capabilities and renders expression without owning semantic truth.

Capture produces candidates and signals rather than silently creating authoritative memory or identity.

Governance applies correction through explicit auditable events and versioned change.

The key architectural requirements are:

1. Stable semantic contracts.
2. Explicit ownership.
3. Streaming and revision support.
4. Progressive Recall compatibility.
5. Epistemic-state preservation.
6. Temporal-boundary preservation.
7. Historical and interaction-memory separation.
8. Identity Primacy.
9. Explicit correction and versioning.
10. Transport independence.
11. Model independence.
12. Honest degradation under latency or failure.

The most important invariant is:

> No downstream transformation may silently convert uncertainty, inference, interaction history, or a retrieval hypothesis into authoritative autobiographical truth.

CPE-CORE-003 therefore acts as the architectural membrane between otherwise replaceable CPE subsystems.

Implementations may change.

The meaning crossing the boundary must remain stable.
