# CPE-CORE-002

## Memory Schema and Retrieval Architecture

### Core Specification v0.1

**Status:** First Draft
**Version:** 0.1
**Date:** June 2026
**Project:** Digital Legacy / Continuous Presence Engine
**Depends on:** CPE-CORE-001 v1.2
**Informed by:** CPE-REF-001 Neuroscience Foundations
**Feeds into:** CPE-CORE-003, CPE-CORE-004, CPE-CORE-005, CPE-CORE-006, CPE-CORE-007

---

# 1. Purpose

CPE-CORE-002 defines the Memory Schema and Retrieval Architecture for the Continuous Presence Engine.

The Memory Layer is responsible for storing, organising, retrieving, governing, and contextualising information required for long-term continuity of personhood representation.

It answers:

> What has happened before, what is known, how certain are we, where did that knowledge come from, and how should it be used?

CPE memory is not a passive archive. It is a governed reconstruction system.

The system must preserve evidence, represent uncertainty, distinguish source types, retrieve associatively, prevent historical corruption, support correction, and maintain temporal honesty about what the represented individual did and did not experience.

---

# 2. Scope

CPE-CORE-002 defines:

1. Memory principles.
2. Memory system taxonomy.
3. Memory record types.
4. Provenance and authority fields.
5. Temporal context and knowledge boundary modelling.
6. Emotional salience.
7. Consolidation status.
8. Relationship graph integration.
9. Multi-facet embedding strategy.
10. Retrieval request model.
11. Retrieval pipeline.
12. Memory candidate and bundle structures.
13. Retrieval state and confidence.
14. Retrieval hypothesis and collaborative cue handling.
15. Contradiction detection and resolution.
16. Interaction memory governance.
17. Storage and index requirements.
18. Latency tiers.
19. Open questions.

CPE-CORE-002 does not define final inter-layer API contracts. Those are defined in CPE-CORE-003 using the objects and concepts introduced here.

CPE-CORE-002 does not define the Identity Layer model, but it defines the memory structures that Identity depends upon.

---

# 3. Design Principles

## CPE-002-001 Memory Persistence

Memory must remain independent of any single model implementation.

The memory store shall not be owned by, embedded inside, or permanently coupled to a foundation model.

Model replacement must not destroy, flatten, reinterpret, or silently mutate memory.

---

## CPE-002-002 Memory as Governed Reconstruction

CPE memory retrieval is reconstruction, not playback.

The system shall not treat memory recall as simple key-value lookup. Retrieval may involve:

1. Semantic similarity.
2. Temporal context.
3. Relationship graph traversal.
4. Emotional salience.
5. Authority-aware ranking.
6. Multi-hop associative retrieval.
7. Progressive retrieval passes.
8. Contradiction detection.
9. Confidence modelling.
10. Collaborative cue processing.

The system may reconstruct a response from multiple memory fragments, but it must preserve the provenance and authority of each fragment.

---

## CPE-002-003 Source Monitoring

The system shall maintain strict source monitoring.

Every memory record must identify where it came from, who supplied it, what authority it carries, and whether it represents:

1. The subject’s lived experience.
2. The subject’s deliberate authorship.
3. Captured material.
4. Interaction-time content.
5. A derived inference.
6. A correction.
7. A collaborative retrieval cue.
8. System metadata.

Source monitoring failure is a critical architectural failure.

The system must not treat interaction memories, derived memories, or collaborative cues as historical memories unless explicitly promoted through governed consolidation or correction procedures.

---

## CPE-002-004 Historical and Interaction Separation

Historical memory and post-capture interaction memory must remain structurally distinct.

The persona may remember conversations it has had after the subject’s knowledge boundary, but those conversations must not be represented as events experienced by the subject.

Interaction memory may support continuity of the persona relationship, but it must not silently alter historical memory or identity.

---

## CPE-002-005 Temporal Honesty

Every memory record must support temporal interpretation.

The system must distinguish:

1. Events experienced by the subject.
2. Facts known by the subject.
3. Events that occurred after the subject’s knowledge boundary.
4. Post-boundary interactions with the persona.
5. Uncertain temporal claims.
6. Retrospective corrections.

The persona must not imply that the subject experienced events beyond the subject’s knowledge boundary.

---

## CPE-002-006 Authority-Aware Memory

Memory authority is not uniform.

The system shall rank, retrieve, consolidate, correct, and suppress memories using authority metadata.

Authority may depend on:

1. Whether the subject authored or approved the memory.
2. Whether the memory is directly evidenced.
3. Whether the source is a trusted family member, reviewer, or system process.
4. Whether the memory conflicts with higher-authority records.
5. Whether the claim is factual, emotional, interpretive, or relational.
6. Whether the claim applies globally or only in context.

---

## CPE-002-007 Emotional Salience

Emotional salience is a first-class retrieval property.

Emotionally central memories may outrank more recent but less important memories.

Emotional salience must not be treated as optional metadata. It participates in retrieval ranking, consolidation decisions, contradiction handling, and progressive recall behaviour.

---

## CPE-002-008 Progressive Recall

The system shall support progressive recall.

In conversational contexts, retrieval may move through states such as searching, partial, converging, hypothesising, complete, and failed.

Latency in retrieval should not always be hidden. When appropriate, the persona may express retrieval-in-progress honestly through the Progressive Recall Response pattern.

---

## CPE-002-009 Collaborative Retrieval

The conversation partner may participate in memory retrieval.

When a user confirms, corrects, rejects, or elaborates on a retrieval hypothesis, that input shall be treated as a collaborative retrieval cue.

Collaborative cues are retrieval inputs, not automatically historical memories.

---

## CPE-002-010 Governed Divergence from Biology

The brain is an inspiration, not a blueprint.

CPE may borrow biological principles such as associative retrieval, staged consolidation, emotional salience, source monitoring, and progressive recall.

CPE must deliberately diverge from the brain where required by:

1. Auditability.
2. Consent.
3. Correction authority.
4. Deletion.
5. Temporal boundary honesty.
6. Multi-party disagreement.
7. Post-death governance.
8. Model portability.

---

# 4. Memory System Taxonomy

CPE shall distinguish memory system categories from memory source types.

Memory system categories describe the kind of information being represented.

Memory source types describe where the information came from.

---

## 4.1 Memory System Categories

### Episodic Memory

Episodic memory represents specific events or experiences bound to time, place, people, and context.

Examples:

1. “The holiday in Cornwall with Sarah.”
2. “The day the subject moved into their first flat.”
3. “The conversation with Maddi after her art exhibition.”

Episodic memories may include sensory, emotional, relational, and temporal fragments.

---

### Semantic Memory

Semantic memory represents facts, concepts, beliefs, statements, preferences, and general knowledge.

Examples:

1. “The subject believed family came before work.”
2. “The subject preferred tea without sugar.”
3. “The subject knew Paris is in France.”

Semantic memories may be derived from multiple episodic memories, authored statements, or captured interviews.

---

### Procedural Memory

Procedural memory represents skills, habits, routines, and repeated behavioural patterns.

Examples:

1. “The subject always checked the back door before bed.”
2. “The subject made coffee in a specific order.”
3. “The subject played guitar by ear.”

Procedural memories may inform embodiment, reasoning, and interaction style.

---

### Emotional / Implicit Memory

Emotional or implicit memory represents affective associations, recurring emotional responses, aversions, attachments, and emotionally charged patterns.

Examples:

1. “The subject became quiet around hospitals.”
2. “Christmas music made the subject nostalgic.”
3. “The subject associated the sea with calm.”

Emotional / implicit memories must be handled carefully because they are often interpretive and may be difficult to verify.

---

### System Memory

System memory represents operational information about the CPE itself.

Examples:

1. Session state.
2. Retrieval history.
3. Configuration.
4. Persona readiness metrics.
5. Model version metadata.
6. Correction workflow state.

System memory must not be confused with subject memory.

---

# 5. Memory Source Types

Memory source types identify the origin and authority class of a record.

```ts
type MemoryType =
  | "historical"
  | "authored"
  | "captured"
  | "interaction"
  | "derived"
  | "correction"
  | "collaborative_cue"
  | "system";
```

---

## 5.1 Historical Memory

A historical memory represents an event, experience, fact, relationship, belief, or preference attributable to the subject during their lifetime or authorised capture period.

Historical memories have high potential authority but still require provenance and confidence.

Historical memories may originate from:

1. The subject directly.
2. Diaries.
3. letters.
4. Photographs.
5. Audio.
6. Video.
7. Trusted records.
8. Witness accounts.

Historical memory must not be created from persona-generated claims without explicit correction or consolidation governance.

---

## 5.2 Authored Memory

An authored memory is deliberately supplied, reviewed, or approved by the subject.

Authored memories carry high authority because they reflect deliberate self-representation.

Examples:

1. A recorded life story.
2. A written memoir fragment.
3. A subject-approved value statement.
4. A subject-reviewed relationship description.

Authored memory may still contain emotional interpretation, exaggeration, omission, or later contradiction. High authority does not mean perfect factual certainty.

---

## 5.3 Captured Memory

A captured memory is extracted from structured capture sessions.

Examples:

1. Diary room sessions.
2. Guided interviews.
3. self-interaction review.
4. Avatar review.
5. Directed capture prompts.

Captured memories must include capture session metadata, quality scores, consent metadata, and extraction confidence.

---

## 5.4 Interaction Memory

An interaction memory is generated during post-capture or runtime interaction between a user and the persona.

Examples:

1. A conversation between the persona and a family member.
2. A user disclosure.
3. A persona response.
4. A shared post-boundary discussion.
5. A clarification made during conversation.

Interaction memories may support continuity of the persona-user relationship.

Interaction memories must not be treated as historical memories.

Interaction memories may not influence Identity Layer parameters unless they pass governed consolidation.

---

## 5.5 Derived Memory

A derived memory is inferred from other memory records.

Examples:

1. “The subject was probably anxious about hospitals.”
2. “The subject seems to have valued independence.”
3. “The subject’s relationship with their brother appears strained in later life.”

Derived memories must retain links to source records.

Derived memories should have lower authority than directly evidenced or authored records.

Derived memories must be clearly marked as inference.

---

## 5.6 Correction Memory

A correction memory records an explicit challenge, amendment, replacement, suppression, or clarification of one or more existing memory records.

Correction memories may be supplied by:

1. The subject.
2. An authorised reviewer.
3. A trusted family member.
4. A legal or governance process.
5. The system through detected contradiction, pending review.

Correction authority depends on the correction source, evidence, scope, and governance status.

Correction memory does not automatically delete or overwrite the original memory. It creates an auditable correction relationship.

---

## 5.7 Collaborative Cue

A collaborative cue is a retrieval input supplied by a conversation partner during progressive recall.

Examples:

1. “No, not Cornwall — it was the one with Uncle Roy.”
2. “Yes, that’s the trip I meant.”
3. “I think it was near Christmas.”
4. “Wasn’t Sarah there too?”

Collaborative cues may guide retrieval but must not automatically become historical memory.

A collaborative cue may later produce a memory candidate if the cue contains new substantive information, but that candidate must pass normal provenance, authority, and consolidation checks.

---

## 5.8 System Memory

System memory stores operational state and metadata.

Examples:

1. Model version.
2. Retrieval trace.
3. Conversation mode.
4. Active embodiment tier.
5. Consent status.
6. Session logs.
7. Readiness metrics.

System memory may guide operation but must not be presented as subject memory.

---

# 6. Core Schema Model

## 6.1 Base Memory Record

All memory records inherit from `BaseMemoryRecord`.

```ts
interface BaseMemoryRecord {
  id: MemoryRecordId;
  subjectId: SubjectId;

  memoryType: MemoryType;
  memorySystem: MemorySystem;

  title?: string;
  summary: string;

  content: MemoryContent;

  provenance: ProvenanceProfile;
  authority: AuthorityProfile;
  confidence: MemoryConfidence;

  temporalContext: TemporalContext;
  knowledgeBoundaryStatus: KnowledgeBoundaryStatus;

  emotionalSalience: EmotionalSalience;

  relationshipRefs: RelationshipRef[];
  entityRefs: EntityRef[];
  placeRefs: PlaceRef[];
  themeRefs: ThemeRef[];

  embeddingSet?: MemoryEmbeddingSet;

  contradictionRefs: ContradictionRef[];
  correctionRefs: CorrectionRef[];

  consolidationStatus: ConsolidationStatus;

  lifecycle: MemoryLifecycle;

  createdAt: string;
  updatedAt: string;
  version: number;
}
```

---

## 6.2 Memory System

```ts
type MemorySystem =
  | "episodic"
  | "semantic"
  | "procedural"
  | "emotional_implicit"
  | "system";
```

---

## 6.3 Episodic Memory Record

```ts
interface EpisodicMemoryRecord extends BaseMemoryRecord {
  memorySystem: "episodic";

  event: {
    temporalRange?: TemporalRange;
    location?: PlaceRef;
    participants: PersonRef[];
    narrative: string;

    sensoryFragments?: SensoryFragment[];
    emotionalContext?: EmotionalContext;
    socialContext?: SocialContext;

    lifeStage?: LifeStageRef;
    timelineRefs?: TimelineRef[];
  };
}
```

Episodic memories should preserve enough contextual structure to support associative retrieval.

---

## 6.4 Semantic Memory Record

```ts
interface SemanticMemoryRecord extends BaseMemoryRecord {
  memorySystem: "semantic";

  statement: {
    text: string;
    domain?: string;
    appliesTo?: EntityRef[];
    validDuring?: TemporalRange;
    supersededBy?: MemoryRecordId[];
    derivedFrom?: MemoryRecordId[];
  };
}
```

Semantic memories may represent facts, beliefs, preferences, values, or generalisations.

---

## 6.5 Procedural Memory Record

```ts
interface ProceduralMemoryRecord extends BaseMemoryRecord {
  memorySystem: "procedural";

  procedure: {
    behaviour: string;
    triggerContext?: string;
    steps?: string[];
    frequency?: "rare" | "occasional" | "regular" | "habitual";
    embodimentRelevance?: EmbodimentRelevance;
  };
}
```

Procedural memory may inform behaviour, mannerisms, and embodied expression.

---

## 6.6 Emotional / Implicit Memory Record

```ts
interface EmotionalImplicitMemoryRecord extends BaseMemoryRecord {
  memorySystem: "emotional_implicit";

  association: {
    trigger: string;
    emotionalResponse: EmotionalContext;
    knownOrigin?: MemoryRecordId[];
    confidenceExplanation?: string;
    caution?: string;
  };
}
```

Emotional / implicit memories require careful provenance because they may be inferred from patterns rather than explicitly stated.

---

## 6.7 Correction Memory Record

```ts
interface CorrectionMemoryRecord extends BaseMemoryRecord {
  memoryType: "correction";

  correction: {
    targetMemoryIds: MemoryRecordId[];
    correctionType:
      | "amend"
      | "replace"
      | "suppress"
      | "restore"
      | "contextualise"
      | "challenge";

    correctionText: string;
    evidenceRefs: EvidenceRef[];
    correctionAuthority: AuthorityProfile;
    governanceStatus:
      | "pending_review"
      | "accepted"
      | "partially_accepted"
      | "rejected"
      | "superseded";

    appliesGlobally: boolean;
    appliesWithin?: TemporalRange | RelationshipContext | ConversationContext;
  };
}
```

Correction records must be auditable.

Correction must not require destructive overwrite of original memory records.

---

## 6.8 Collaborative Cue Record

```ts
interface CollaborativeCueRecord extends BaseMemoryRecord {
  memoryType: "collaborative_cue";

  collaborativeCue: {
    retrievalSessionId: RetrievalSessionId;
    relatedHypothesisId?: RetrievalHypothesisId;

    cueType:
      | "confirmation"
      | "correction"
      | "elaboration"
      | "rejection"
      | "uncertain_association";

    suppliedBy: PersonRef;
    text: string;

    effect:
      | "strengthens_current_candidate"
      | "weakens_current_candidate"
      | "introduces_discriminator"
      | "introduces_new_candidate"
      | "ends_retrieval";
  };
}
```

Collaborative cues participate in retrieval but do not automatically become historical truth.

---

# 7. Provenance Model

Provenance records where a memory came from and how it was produced.

```ts
interface ProvenanceProfile {
  sourceType:
    | "subject_direct"
    | "subject_authored"
    | "capture_session"
    | "document"
    | "photo"
    | "audio"
    | "video"
    | "conversation"
    | "family_testimony"
    | "system_inference"
    | "persona_interaction"
    | "external_record"
    | "unknown";

  sourceRefs: SourceRef[];

  suppliedBy?: PersonRef;
  extractedBy?: ExtractorRef;
  extractionMethod?: string;

  consent: ConsentProfile;

  evidenceQuality:
    | "direct"
    | "strong"
    | "moderate"
    | "weak"
    | "unknown";

  provenanceConfidence: number;
}
```

Provenance must be preserved through all transformations.

Derived memories must retain links to their source memories.

Corrections must retain both the correction source and the corrected target.

---

# 8. Authority Model

Authority describes how strongly a memory may influence retrieval, reasoning, identity, and correction.

```ts
interface AuthorityProfile {
  authorityLevel:
    | "subject_primary"
    | "subject_approved"
    | "authorised_reviewer"
    | "trusted_witness"
    | "supporting_evidence"
    | "system_inferred"
    | "interaction_contextual"
    | "unknown";

  authorityScope:
    | "global"
    | "temporal"
    | "relationship_specific"
    | "contextual"
    | "retrieval_only"
    | "identity_relevant";

  mayInfluenceIdentity: boolean;
  mayCorrectHistoricalMemory: boolean;
  mayAppearInConversation: boolean;
  mayBeUsedForRetrievalExpansion: boolean;

  authorityConfidence: number;
  authorityNotes?: string;
}
```

Authority is contextual.

A family member may have high authority over a shared event but low authority over the subject’s private internal belief.

A system inference may be useful for retrieval but insufficient for confident persona claims.

---

# 9. Confidence Model

Memory confidence describes the reliability of a memory record.

```ts
interface MemoryConfidence {
  factualConfidence: number;
  temporalConfidence: number;
  sourceConfidence: number;
  emotionalConfidence: number;
  interpretationConfidence: number;

  overallConfidence: number;

  confidenceBasis: string[];

  confidenceStatus:
    | "high"
    | "medium"
    | "low"
    | "contested"
    | "unknown";
}
```

Confidence must distinguish factual certainty from interpretive certainty.

Example:

A memory may have high confidence that an event occurred, but low confidence about what the subject felt during it.

---

# 10. Temporal Context

## 10.1 Temporal Range

```ts
interface TemporalRange {
  start?: string;
  end?: string;
  granularity:
    | "exact"
    | "day"
    | "month"
    | "year"
    | "life_stage"
    | "relative"
    | "unknown";

  description?: string;
  confidence: number;
}
```

---

## 10.2 Knowledge Boundary Status

```ts
type KnowledgeBoundaryStatus =
  | "within_subject_lifetime"
  | "within_subject_capture_period"
  | "post_boundary_interaction"
  | "post_boundary_external_event"
  | "unknown"
  | "not_applicable";
```

The knowledge boundary status identifies whether a memory or claim belongs to the subject’s lived knowledge, deliberate capture period, post-boundary persona interaction, or external events beyond the subject’s lived experience.

---

## 10.3 Temporal Rules

The system shall:

1. Preserve event time separately from record creation time.
2. Preserve capture time separately from subject experience time.
3. Preserve correction time separately from corrected event time.
4. Prevent post-boundary interaction memories from being represented as subject-lived memories.
5. Surface uncertainty when temporal confidence is low.
6. Support temporal weighting during retrieval.

---

# 11. Emotional Salience

Emotional salience is a first-class field on memory records.

```ts
interface EmotionalSalience {
  score: number; // 0.0 - 1.0

  valence:
    | "positive"
    | "negative"
    | "mixed"
    | "neutral"
    | "unknown";

  intensity: number; // 0.0 - 1.0

  source:
    | "subject_declared"
    | "captured"
    | "inferred"
    | "reviewer_declared"
    | "interaction_observed"
    | "unknown";

  confidence: number;

  notes?: string;
}
```

Emotional salience participates in:

1. Retrieval ranking.
2. Consolidation decisions.
3. Progressive recall.
4. Contradiction handling.
5. Relationship-sensitive reasoning.
6. Identity signal extraction.

Emotion inferred solely by the system should carry lower authority than subject-declared emotion.

---

# 12. Consolidation Model

Consolidation determines whether a memory candidate becomes durable and whether interaction memories may influence future behaviour.

```ts
type ConsolidationStatus =
  | "not_applicable"
  | "candidate"
  | "pending_consolidation"
  | "eligible_for_review"
  | "consolidated_contextual"
  | "consolidated_identity_relevant"
  | "rejected"
  | "quarantined";
```

---

## 12.1 Consolidation Rules

### Historical, Authored, and Captured Memories

Historical, authored, and captured memories may become durable records when they meet provenance, consent, and confidence requirements.

Subject-authored or subject-approved records may bypass some review steps but must still preserve provenance and temporal metadata.

---

### Interaction Memories

Interaction memories are initially stored as `pending_consolidation`.

Unconsolidated interaction memories may be retrievable for session continuity but shall remain structurally isolated from historical memory.

Interaction memories may become `consolidated_contextual` when they are useful for continuity of relationship or future conversation.

Interaction memories may become `consolidated_identity_relevant` only through explicit governed review.

---

### Derived Memories

Derived memories must remain linked to source memories.

Derived memories may be invalidated if source memories are corrected, suppressed, or contradicted.

---

### Correction Memories

Correction memories require governance status.

A correction may contextualise, challenge, suppress, amend, replace, or restore a target memory.

Correction must not silently mutate historical records.

---

## 12.2 Consolidation Criteria

Consolidation may consider:

1. Source authority.
2. Subject approval.
3. Reviewer authority.
4. Evidence quality.
5. Repetition across sources.
6. Emotional salience.
7. Relationship importance.
8. Temporal relevance.
9. Consistency with existing memory.
10. Contradiction status.
11. Identity relevance.
12. Consent status.

---

# 13. Relationship Graph Integration

The Relationship Graph is a first-class retrieval structure.

It shall represent people, relationships, events, places, organisations, themes, and emotional associations.

The Relationship Graph supports:

1. Retrieval expansion.
2. Associative traversal.
3. Disambiguation.
4. Relationship-sensitive identity expression.
5. Contradiction detection.
6. Collaborative recall.
7. Temporal clustering.

---

## 13.1 Relationship Reference

```ts
interface RelationshipRef {
  personId: PersonId;
  relationshipType:
    | "spouse"
    | "child"
    | "parent"
    | "sibling"
    | "friend"
    | "colleague"
    | "extended_family"
    | "acquaintance"
    | "unknown";

  relationshipLabel?: string;
  relationshipPeriod?: TemporalRange;
  emotionalCloseness?: number;
  confidence: number;
}
```

---

## 13.2 Graph Retrieval

Graph traversal and vector similarity shall be co-equal retrieval paths.

Graph traversal must not be treated only as a fallback after vector search fails.

Retrieval may traverse:

1. Person → memories involving person.
2. Memory → people involved.
3. Person → related people.
4. Event → temporally adjacent events.
5. Place → events at place.
6. Theme → related values or beliefs.
7. Emotion → emotionally similar records.
8. Correction → corrected records.
9. Contradiction → conflicting records.

---

# 14. Multi-Facet Embedding Model

Each memory record may support multiple embeddings.

```ts
interface MemoryEmbeddingSet {
  semantic?: EmbeddingRef;
  temporal?: EmbeddingRef;
  relational?: EmbeddingRef;
  emotional?: EmbeddingRef;
  sensory?: EmbeddingRef;
}
```

---

## 14.1 Embedding Facets

| Facet | Purpose |
|---|---|
| Semantic | Meaning and content similarity |
| Temporal | Life stage, period, sequence, and time proximity |
| Relational | People, relationship roles, and social context |
| Emotional | Emotional tone, valence, and intensity |
| Sensory | Visual, auditory, place, object, smell, music, and other sensory cues |

---

## 14.2 Embedding Rules

The system should not depend on a single vector per memory.

The retrieval architecture must allow multiple parallel searches over different facets.

A memory may retrieve strongly through emotional or relational facets even when semantic similarity is weak.

---

# 15. Retrieval Request Model

Retrieval requests define what is being searched for, how retrieval should behave, and what constraints apply.

```ts
interface MemoryRetrievalRequest {
  id: RetrievalRequestId;
  subjectId: SubjectId;

  query: string;
  queryContext: QueryContext;

  retrievalMode: RetrievalMode;
  retrievalDepth: RetrievalDepth;

  caller:
    | "reasoning_layer"
    | "identity_layer"
    | "capture_subsystem"
    | "correction_workflow"
    | "system";

  constraints: RetrievalConstraints;

  latencyBudgetMs?: number;

  priorRetrievalSessionId?: RetrievalSessionId;
}
```

---

## 15.1 Retrieval Mode

```ts
type RetrievalMode =
  | "focused"
  | "associative"
  | "reflective"
  | "boundary_sensitive"
  | "correction_sensitive";
```

### Focused

Used for specific factual questions.

Focused retrieval narrows the search, raises similarity thresholds, minimises lateral graph spreading, and prefers high-authority records.

### Associative

Used for partial, emotional, vague, or exploratory cues.

Associative retrieval expands the search, lowers similarity thresholds, increases graph traversal, and may surface related memories.

### Reflective

Used for slow, high-fidelity, thematic, or identity-relevant questions.

Reflective retrieval may perform deeper multi-hop retrieval and contradiction analysis.

### Boundary Sensitive

Used when the query may involve post-boundary events or uncertain temporal status.

Boundary-sensitive retrieval must preserve temporal honesty and flag knowledge boundary issues.

### Correction Sensitive

Used during correction, review, contradiction handling, or contested memory workflows.

Correction-sensitive retrieval must surface related corrections, contradictions, provenance, and authority metadata.

---

## 15.2 Retrieval Depth

```ts
type RetrievalDepth =
  | "hot_cache"
  | "fast"
  | "standard"
  | "deep"
  | "post_session";
```

---

# 16. Retrieval Pipeline

The retrieval pipeline shall support reconstruction, not simple lookup.

---

## 16.1 Pipeline Stages

```text
Input cue
  ↓
Classify retrieval intent
  ↓
Select retrieval mode
  ↓
Apply temporal and authority constraints
  ↓
Expand query using identity profile, relationship graph, and context
  ↓
Parallel retrieval
  - semantic vector search
  - temporal retrieval
  - relational graph traversal
  - emotional facet retrieval
  - provenance and authority filtering
  - contradiction lookup
  ↓
Merge candidates
  ↓
Score candidates
  ↓
Assess cross-facet coherence
  ↓
Run progressive retrieval passes if needed
  ↓
Determine confidence zone
  ↓
Return MemoryBundle
```

---

## 16.2 Query Expansion

Query expansion may generate a hypothetical fuller memory from partial cues.

Example input:

> “Something about Dad at Christmas.”

Expanded retrieval cue:

> A Christmas memory involving the subject’s father, likely family-related, emotionally warm or significant, possibly involving a recurring tradition, family home, meal, gift, music, or winter gathering.

Query expansion is used for retrieval only.

Expanded queries must not be stored as memories unless explicitly converted into derived memory candidates through governed review.

---

## 16.3 Progressive Retrieval

Progressive retrieval may run multiple passes.

Pass 1 retrieves initial candidates.

Pass 2 uses candidate clusters to enrich the query.

Pass 3 tests convergence, contradictions, and disambiguation.

Successive passes returning overlapping candidates indicate convergence.

Divergent passes indicate ambiguity or retrieval failure.

---

## 16.4 Pattern Separation

Retrieval must not only complete partial patterns. It must also distinguish similar memories.

Pattern separation prevents memories from blurring together.

Disambiguation criteria may include:

1. Different people.
2. Different places.
3. Different dates.
4. Different life stages.
5. Different emotional tone.
6. Different source authority.
7. Different relationship context.
8. Different contradiction or correction status.

---

# 17. Memory Candidate Model

A memory candidate is a potential retrieval result before final bundle assembly.

```ts
interface MemoryCandidate {
  memoryRecordId: MemoryRecordId;

  matchSources: MatchSource[];

  scores: {
    semantic?: number;
    temporal?: number;
    relational?: number;
    emotional?: number;
    sensory?: number;
    graph?: number;
    authority?: number;
    provenance?: number;
  };

  combinedScore: number;

  confidenceContribution: number;

  supportingFeatures: string[];
  competingFeatures: string[];

  contradictionRefs: ContradictionRef[];
  correctionRefs: CorrectionRef[];

  boundaryWarnings: BoundaryWarning[];
}
```

---

## 17.1 Match Source

```ts
type MatchSource =
  | "semantic_vector"
  | "temporal_index"
  | "relationship_graph"
  | "emotional_facet"
  | "sensory_facet"
  | "provenance_filter"
  | "authority_filter"
  | "contradiction_index"
  | "hot_cache";
```

---

# 18. Memory Bundle Model

The Memory Layer returns a `MemoryBundle`.

```ts
interface MemoryBundle {
  id: MemoryBundleId;
  retrievalSessionId: RetrievalSessionId;

  requestId: RetrievalRequestId;
  subjectId: SubjectId;

  retrievalState: RetrievalState;
  retrievalConfidence: RetrievalConfidence;

  candidates: MemoryCandidate[];

  selectedMemories: MemoryRecordId[];

  retrievalHypothesis?: RetrievalHypothesis;

  relationshipContext?: RelationshipContext;
  temporalContext?: TemporalContextSummary;
  contradictionSummary?: ContradictionSummary;
  boundarySummary?: BoundarySummary;

  collaborativeCueExpected?: boolean;

  retrievalTrace: RetrievalTrace;

  createdAt: string;
}
```

---

# 19. Retrieval State

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

---

## 19.1 Retrieval State Semantics

| State | Meaning |
|---|---|
| `searching` | Retrieval has started but no useful candidate has surfaced |
| `partial` | Some fragments or weak candidates have surfaced |
| `converging` | Multiple retrieval passes are narrowing toward candidate memory or cluster |
| `hypothesising` | A plausible candidate exists but confidence is not high enough to commit |
| `awaiting_collaborative_cue` | A hypothesis has been surfaced and the system is waiting for user confirmation, correction, or elaboration |
| `complete` | Retrieval has converged with sufficient confidence |
| `failed` | Retrieval exhausted without viable candidate |

---

# 20. Retrieval Confidence

Retrieval confidence is distinct from memory confidence.

Memory confidence describes a record.

Retrieval confidence describes whether the current retrieval operation has found the right memory or memory cluster.

```ts
interface RetrievalConfidence {
  score: number;

  zone:
    | "commit"
    | "hypothesise"
    | "admit_failure";

  topCandidateScore: number;
  candidateSpread: number;
  crossFacetCoherence: number;
  authorityAlignment: number;
  temporalCoherence: number;
  emotionalCoherence: number;
  contradictionPenalty: number;
  passStability: number;

  explanation: string;
}
```

---

## 20.1 Three-Zone Threshold Model

| Zone | Behaviour |
|---|---|
| Commit | State the recollection with appropriate confidence |
| Hypothesise | Surface strongest candidate as a hypothesis and request confirmation |
| Admit failure | Acknowledge inability to retrieve and request more information if appropriate |

---

## 20.2 Mode-Specific Thresholds

Conversation mode should use conservative commit thresholds because false memories are emotionally costly.

Capture mode may allow lower hypothesise thresholds because the subject can self-correct.

Reflective mode may use deeper retrieval before admitting failure.

Exact threshold values require empirical calibration.

---

# 21. Retrieval Hypothesis

When retrieval confidence falls into the hypothesise zone, the Memory Layer may return a `RetrievalHypothesis`.

```ts
interface RetrievalHypothesis {
  id: RetrievalHypothesisId;

  candidateMemoryId?: MemoryRecordId;
  candidateCluster?: MemoryRecordId[];

  hypothesisText: string;

  supportingFeatures: string[];
  missingDiscriminators: string[];

  confidence: RetrievalConfidence;

  suggestedCollaborativePrompt?: string;
}
```

Example:

> I think you might be thinking of the Cornwall trip — the one with the boat. Is that the one?

The hypothesis should be warm, uncertain, and personal in Conversation mode.

The hypothesis should not be framed as a database lookup.

---

# 22. Collaborative Cue Processing

Collaborative cues continue the active retrieval session.

They should not start a cold retrieval unless no active retrieval session exists.

---

## 22.1 Cue Flow

```text
Initial cue
  ↓
Partial retrieval
  ↓
Hypothesis surfaced
  ↓
User confirms, corrects, rejects, or elaborates
  ↓
Collaborative cue generated
  ↓
Retrieval resumes with prior candidates retained
  ↓
Candidate confidence recalculated
  ↓
MemoryBundle updated
```

---

## 22.2 Confirmation

A confirmation strengthens the current hypothesis and may move retrieval from `hypothesising` to `complete`.

---

## 22.3 Correction

A correction introduces a discriminating feature and triggers re-retrieval using the previous retrieval context.

Example:

> No, not Cornwall — the one with Uncle Roy.

The cue “Uncle Roy” should suppress candidates lacking Uncle Roy and expand graph traversal through Uncle Roy-related memories.

---

## 22.4 Rejection

A rejection weakens or removes the current hypothesis.

The system may either propose another candidate or admit failure.

---

## 22.5 Elaboration

An elaboration adds additional retrieval features.

Example:

> It was near Christmas, and I remember music playing.

The system should add temporal and sensory facets to the active retrieval session.

---

# 23. Contradiction Model

Contradictions are first-class memory relationships.

A contradiction does not always mean one record is false.

Records may conflict because of:

1. Different perspectives.
2. Different time periods.
3. Different emotional interpretations.
4. Partial memory.
5. Misattribution.
6. Later correction.
7. Genuine false memory.
8. Persona-generated error.
9. Ambiguous source.

---

## 23.1 Contradiction Record

```ts
interface ContradictionRecord {
  id: ContradictionId;

  subjectId: SubjectId;

  memoryIds: MemoryRecordId[];

  contradictionType:
    | "factual"
    | "temporal"
    | "emotional"
    | "relational"
    | "interpretive"
    | "source"
    | "boundary";

  severity:
    | "minor"
    | "moderate"
    | "major"
    | "critical";

  status:
    | "unresolved"
    | "resolved"
    | "contextualised"
    | "superseded"
    | "requires_review";

  preferredRecordId?: MemoryRecordId;

  explanation?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

## 23.2 Contradiction Handling Rules

The system shall determine:

1. Whether records conflict.
2. Whether both records may be true in different contexts.
3. Whether one record supersedes another.
4. Whether authority resolves the contradiction.
5. Whether uncertainty should be surfaced to the Reasoning Layer.
6. Whether correction workflow is required.

The system must not hide significant unresolved contradictions from downstream reasoning.

---

# 24. Knowledge Boundary Handling

The Memory Layer shall identify when retrieval touches the subject’s knowledge boundary.

Boundary warnings may include:

1. Retrieved memory is post-boundary interaction.
2. Retrieved claim concerns an event after the subject’s lifetime or capture period.
3. Temporal status is unknown.
4. User is asking the persona to remember something the subject could not have experienced.
5. Persona has interacted with the user about the topic before, but the subject did not.

---

## 24.1 Boundary Warning

```ts
interface BoundaryWarning {
  type:
    | "post_boundary_event"
    | "post_boundary_interaction"
    | "unknown_temporal_status"
    | "subject_could_not_have_known"
    | "persona_continuity_only";

  severity:
    | "notice"
    | "caution"
    | "block";

  message: string;
}
```

---

# 25. Storage Architecture

CPE memory shall support multiple logical stores.

---

## 25.1 Historical Memory Store

Stores historical, authored, captured, semantic, episodic, procedural, and emotional records attributable to the subject.

---

## 25.2 Interaction Memory Store

Stores persona-user interactions, post-boundary conversations, user disclosures, persona responses, and collaborative cues.

This store must remain distinct from the Historical Memory Store.

---

## 25.3 Correction Store

Stores correction records, contradiction records, review decisions, governance state, and audit trail.

---

## 25.4 Derived Memory Store

Stores inferred memories, thematic summaries, identity-relevant patterns, and generalisations.

Derived memory must retain links to source records.

---

## 25.5 System Memory Store

Stores operational memory, session state, model metadata, retrieval traces, readiness metrics, and configuration.

---

# 26. Required Indexes

The Memory Layer shall support the following indexes:

1. Vector index.
2. Multi-facet embedding indexes.
3. Graph index.
4. Temporal index.
5. Semantic index.
6. Relationship index.
7. Provenance index.
8. Authority index.
9. Contradiction index.
10. Correction index.
11. Knowledge boundary index.
12. Emotional salience index.
13. Hot cache index.

---

# 27. Hot Memory Cache

The hot memory cache supports active conversation.

It is not a simple recency buffer.

It should function as an integrated episode buffer containing:

1. Current conversation context.
2. Recent retrieved memories.
3. Active participants.
4. Active relationship context.
5. Current emotional tone.
6. Active unresolved hypotheses.
7. Recent corrections or clarifications.
8. Boundary warnings.
9. Current embodiment tier.
10. Retrieval state.

The hot memory cache should support low-latency retrieval and progressive update.

---

# 28. Latency Tiers

The Memory Layer shall support tier-aware retrieval.

| Retrieval Depth | Use Case | Expected Behaviour |
|---|---|---|
| `hot_cache` | Active conversation | Immediate access to current episode context |
| `fast` | Voice/avatar conversation | Low-latency approximate retrieval |
| `standard` | Normal text or voice interaction | Balanced recall and latency |
| `deep` | Reflective or high-fidelity mode | Slower, broader, contradiction-aware retrieval |
| `post_session` | Consolidation and review | Offline memory formation and correction |

Partial `MemoryBundle` objects may be streamed before retrieval completes.

---

# 29. Interaction Memory Governance

Interaction memory is necessary for continuity but dangerous for identity drift.

The system shall follow these rules:

1. Store interaction memories separately from historical memory.
2. Mark interaction memories as `pending_consolidation` by default.
3. Allow retrieval for session continuity where appropriate.
4. Prevent unconsolidated interaction memories from influencing identity parameters.
5. Require governed review before identity-relevant consolidation.
6. Preserve persona-generated claims separately from user-provided claims.
7. Treat user confirmations and corrections as collaborative cues unless formally promoted.
8. Audit all promotions from interaction memory to durable contextual or identity-relevant memory.

---

# 30. Correction and Suppression

The system shall support correction without destructive overwrite.

Correction operations include:

1. Challenge.
2. Amend.
3. Replace.
4. Suppress.
5. Restore.
6. Contextualise.

Suppression should hide or de-prioritise a memory while preserving auditability, unless deletion is legally or ethically required.

Deletion semantics shall be defined separately with privacy and consent governance.

---

# 31. Deletion and Forgetting

CPE must not rely on accidental forgetting.

Forgetting is a governance decision.

The system shall distinguish:

1. Deletion.
2. Suppression.
3. De-prioritisation.
4. Archival.
5. Expiry.
6. Legal removal.
7. Consent withdrawal.
8. Identity non-use.

Memory decay may be simulated for conversational realism only if the underlying record remains governed and recoverable where permitted.

---

# 32. Downstream Use

## 32.1 Reasoning Layer

The Reasoning Layer uses `MemoryBundle` objects to ground responses.

It must respect:

1. Retrieval state.
2. Confidence.
3. Authority.
4. Provenance.
5. Boundary warnings.
6. Contradictions.
7. Hypothesis state.
8. Collaborative cue state.

---

## 32.2 Identity Layer

The Identity Layer may use consolidated memory to support personality, values, beliefs, preferences, and relationship-specific expression.

The Identity Layer must not consume unconsolidated interaction memories as identity parameters.

---

## 32.3 Embodiment Layer

The Embodiment Layer may express retrieval state through hesitation, tone, facial expression, pacing, gaze, or gesture.

The Embodiment Layer must not invent confidence beyond the MemoryBundle state.

---

## 32.4 Capture Subsystem

The Capture Subsystem produces memory candidates, correction candidates, identity signals, relationship graph updates, and readiness metrics.

Captured memory must include consent, quality, and provenance metadata.

---

# 33. Example MemoryBundle

```ts
const memoryBundle: MemoryBundle = {
  id: "membundle_001",
  retrievalSessionId: "retr_001",
  requestId: "req_001",
  subjectId: "subject_001",

  retrievalState: "hypothesising",

  retrievalConfidence: {
    score: 0.68,
    zone: "hypothesise",
    topCandidateScore: 0.74,
    candidateSpread: 0.12,
    crossFacetCoherence: 0.61,
    authorityAlignment: 0.82,
    temporalCoherence: 0.58,
    emotionalCoherence: 0.77,
    contradictionPenalty: 0.05,
    passStability: 0.64,
    explanation:
      "One strong candidate emerged, but temporal and relational features are incomplete."
  },

  candidates: [
    {
      memoryRecordId: "mem_123",
      matchSources: [
        "semantic_vector",
        "relationship_graph",
        "emotional_facet"
      ],
      scores: {
        semantic: 0.71,
        relational: 0.83,
        emotional: 0.78,
        authority: 0.88
      },
      combinedScore: 0.74,
      confidenceContribution: 0.68,
      supportingFeatures: [
        "Christmas",
        "father",
        "family home",
        "warm emotional tone"
      ],
      competingFeatures: [
        "date uncertain",
        "multiple Christmas memories involving father"
      ],
      contradictionRefs: [],
      correctionRefs: [],
      boundaryWarnings: []
    }
  ],

  selectedMemories: [],

  retrievalHypothesis: {
    id: "hyp_001",
    candidateMemoryId: "mem_123",
    hypothesisText:
      "I think you might be thinking of the Christmas at the old house — the one where Dad was trying to fix the lights. Is that the one?",
    supportingFeatures: [
      "father",
      "Christmas",
      "family house",
      "warm emotional tone"
    ],
    missingDiscriminators: [
      "exact year",
      "who else was present",
      "whether this involved the lights or dinner"
    ],
    confidence: {
      score: 0.68,
      zone: "hypothesise",
      topCandidateScore: 0.74,
      candidateSpread: 0.12,
      crossFacetCoherence: 0.61,
      authorityAlignment: 0.82,
      temporalCoherence: 0.58,
      emotionalCoherence: 0.77,
      contradictionPenalty: 0.05,
      passStability: 0.64,
      explanation:
        "Candidate is plausible but not strong enough to commit without confirmation."
    },
    suggestedCollaborativePrompt:
      "Is that the one you mean, or was it a different Christmas?"
  },

  collaborativeCueExpected: true,

  retrievalTrace: {
    passes: 2,
    queryExpansionUsed: true,
    graphTraversalDepth: 2,
    indexesUsed: [
      "semantic_vector",
      "relationship_graph",
      "emotional_facet",
      "temporal_index"
    ]
  },

  createdAt: "2026-06-05T15:00:00Z"
};
```

---

# 34. Implementation Notes

## 34.1 Interim Implementation

The interim implementation may use retrieval-augmented generation.

Memory records may be stored externally with structured metadata, graph links, and vector indexes.

Retrieved `MemoryBundle` objects may be injected into the Reasoning Layer context.

The interim implementation must not be reduced to simple vector search.

---

## 34.2 Target Implementation

The target implementation may use a dedicated memory interface.

This may include:

1. Dedicated memory encoders.
2. Cross-attention over memory records.
3. Hierarchical memory access.
4. Persistent memory state.
5. Learned retrieval policies.
6. Graph-native traversal.
7. Structured symbolic and vector fusion.
8. Low-latency hot cache.
9. Memory-aware reasoning models.

The schema must remain valid across interim and target implementations.

---

# 35. Failure Modes

CPE-CORE-002 must explicitly guard against:

1. Treating interaction memory as historical memory.
2. Treating persona-generated claims as subject experience.
3. Losing provenance during summarisation.
4. Overweighting recency over emotional salience.
5. Overconfident retrieval from weak candidates.
6. Blending similar memories.
7. Ignoring contradictions.
8. Silently mutating identity from interactions.
9. Hiding temporal boundary issues.
10. Treating collaborative cues as fact.
11. Inferring emotion beyond evidence.
12. Deleting without audit.
13. Allowing model upgrades to reinterpret memory.

---

# 36. Open Questions

1. What threshold values should define commit, hypothesise, and admit-failure zones?
2. How should emotional salience be scored during capture?
3. How should emotional salience be inferred retrospectively without overclaiming?
4. What evidence is sufficient to promote interaction memory to identity-relevant memory?
5. How should conflicting family testimony be represented?
6. When should correction suppress rather than amend a memory?
7. How should memory deletion interact with derived memory?
8. Should procedural memory be handled inside CPE-CORE-002 or partly deferred to CPE-CORE-006?
9. How should the system handle memories that are emotionally significant but factually uncertain?
10. How should retrieval confidence be calibrated empirically?
11. How should post-boundary persona continuity be represented without implying subject continuity?
12. How should the Relationship Graph represent changing relationships across time?
13. How much retrieval trace should be exposed to users, reviewers, or developers?
14. Should memory decay be simulated at the retrieval layer, embodiment layer, or not at all?
15. What review workflow is required for `consolidated_identity_relevant` interaction memories?

---

# 37. Summary

CPE-CORE-002 defines the Memory Layer as a governed reconstruction architecture.

The system stores memory records with provenance, authority, confidence, temporal context, emotional salience, relationship links, contradiction state, and consolidation status.

Retrieval is not simple lookup. It combines semantic search, temporal weighting, graph traversal, emotional salience, multi-facet embeddings, progressive retrieval, contradiction analysis, and collaborative cue processing.

The Memory Layer must preserve the distinction between what the subject experienced, what the subject authored, what was captured, what was inferred, what was corrected, and what occurred during post-boundary persona interaction.

The Memory Layer exists to enable faithful continuity without uncontrolled drift.

Its central obligation is not merely to remember.

Its obligation is to remember honestly.
