# CPE-CORE-002 Review Notes

## Review of Memory Schema and Retrieval Architecture v0.1

**Document under review:** CPE-CORE-002 v0.1  
**Review date:** June 2026  
**Review type:** First draft architectural review  
**Reviewer:** Claude (Architect / Task Orchestrator)  
**Action target:** Documentation agent — produce CPE-CORE-002 v0.2

---

## Instructions for Documentation Agent

You are updating CPE-CORE-002 (Memory Schema and Retrieval Architecture) from v0.1 to v0.2.

The document is a formal architectural specification for the Continuous Presence Engine (CPE), part of the Digital Legacy project. It defines memory record schemas, retrieval architecture, provenance, authority, confidence, and governance rules for an AI persona system.

Work through the numbered items below in order. Items are grouped by category. Each item states what is missing or wrong and what the corrected version should contain. Do not change anything not covered by these notes. Preserve the document's formatting conventions, TypeScript interface style, and numbered principles notation (CPE-002-001 etc.).

Update the document header:
- Change **Version** from `0.1` to `0.2`
- Change **Status** from `First Draft` to `Draft`

---

## Category 1 — Critical Gaps (Undefined Types)

These types are referenced in existing interfaces but never defined. Add a definition for each.

---

### Item 1.1 — Define `MemoryContent`

**Location:** Referenced in `BaseMemoryRecord` as `content: MemoryContent`. Currently undefined.

**Action:** Add a new subsection after §6.1 (or at the end of §6) titled **6.x Memory Content** containing the following definition:

```ts
type MemoryContent =
  | { type: "text"; text: string }
  | { type: "transcript"; text: string; audioRef?: MediaRef }
  | { type: "media"; mediaRef: MediaRef; caption?: string }
  | { type: "structured"; data: Record<string, unknown> };
```

Add a note: `MemoryContent` represents the primary stored content of a memory record. `MediaRef` is a reference to an asset stored in external media storage (Backblaze B2 in the interim implementation).

---

### Item 1.2 — Define `ConsentProfile`

**Location:** Referenced in `ProvenanceProfile` as `consent: ConsentProfile`. Currently undefined.

**Action:** Add a new section **§7.1 Consent Profile** immediately after the existing §7 Provenance Model section, containing:

```ts
interface ConsentProfile {
  consentedBy: PersonRef;
  consentedAt: string;

  scope: {
    mayUseInConversation: boolean;
    mayUseForTraining: boolean;
    mayShareWithFamily: boolean;
    retentionPeriod?: string;
  };

  withdrawnAt?: string;
  withdrawalReason?: string;
}
```

Add a note: Consent may be withdrawn by the subject or their designated representative. Withdrawal does not automatically delete records but must trigger governed review of affected memory records.

---

### Item 1.3 — Define `MemoryLifecycle`

**Location:** Referenced in `BaseMemoryRecord` as `lifecycle: MemoryLifecycle`. Currently undefined.

**Action:** Add a new subsection in §6 titled **6.x Memory Lifecycle** containing:

```ts
type MemoryLifecycle =
  | "draft"
  | "active"
  | "under_review"
  | "suppressed"
  | "archived"
  | "deleted"
  | "pending_legal_review";
```

Add a note distinguishing lifecycle from consolidation status: `MemoryLifecycle` describes the operational state of a record (whether it is active, hidden, or removed). `ConsolidationStatus` describes the epistemological state of a record (how authoritative and durable it is). These are independent dimensions. A record may be `consolidated_identity_relevant` and `suppressed` simultaneously.

---

### Item 1.4 — Define `EmbeddingRef`

**Location:** Used in `MemoryEmbeddingSet` for all five facets. Currently undefined.

**Action:** Add a new subsection in §14 titled **14.x Embedding Reference** containing:

```ts
interface EmbeddingRef {
  modelName: string;
  modelVersion: string;
  dimensions: number;
  vector?: number[];
  storageRef?: string;
  createdAt: string;
}
```

Add a note: In the interim implementation, `modelName` is `nomic-embed-text`, `dimensions` is `768`, and `storageRef` points to the pgvector index entry.

---

## Category 2 — Critical Gaps (Substantive Specification)

These are substantive architectural gaps that require new specification content, not just type definitions.

---

### Item 2.1 — Relationship Graph Schema

**Location:** §13 describes the Relationship Graph as a first-class retrieval structure and §13.2 describes traversal patterns, but the graph schema itself (nodes and edges) is never defined.

**Action:** Add a new subsection **§13.x Relationship Graph Schema** containing the following:

```ts
type GraphNodeType =
  | "person"
  | "place"
  | "event"
  | "organisation"
  | "theme"
  | "emotion"
  | "object"
  | "period";

interface GraphNode {
  id: GraphNodeId;
  subjectId: SubjectId;
  nodeType: GraphNodeType;
  label: string;
  aliases?: string[];
  temporalRange?: TemporalRange;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

type GraphEdgeType =
  | "involves"
  | "located_at"
  | "related_to"
  | "preceded_by"
  | "caused"
  | "associated_with"
  | "contradicts"
  | "corrects"
  | "emotionally_linked";

interface GraphEdge {
  id: GraphEdgeId;
  subjectId: SubjectId;
  fromNodeId: GraphNodeId;
  toNodeId: GraphNodeId;
  edgeType: GraphEdgeType;
  label?: string;
  weight: number; // 0.0 - 1.0
  temporalRange?: TemporalRange;
  confidence: number;
  createdAt: string;
}
```

Add a note: The full graph schema, traversal algorithms, and graph storage requirements will be detailed in a named appendix or sub-specification. This section defines the minimal graph objects sufficient for CPE-CORE-003 interface contracts.

---

### Item 2.2 — Interaction Memory Promotion Workflow

**Location:** §29 (Interaction Memory Governance) states that interaction memories may become `consolidated_identity_relevant` through "explicit governed review" but provides no further specification. This is also listed as Open Question 15.

**Action:** Add a new subsection **§29.x Promotion Workflow** with the following minimum content:

The promotion pathway from `pending_consolidation` to `consolidated_identity_relevant` requires:

1. A review initiator (system, subject, or authorised reviewer) flags the interaction memory as a promotion candidate.
2. The memory is moved to `eligible_for_review` consolidation status.
3. A reviewer with `authorityLevel` of at least `authorised_reviewer` evaluates the record against:
   - Evidence that the claim reflects genuine subject belief, value, or experience.
   - Absence of contradiction with existing high-authority historical memory.
   - Explicit subject intent or reasonable inference from captured material.
4. The reviewer records an accept, partial accept, or reject decision.
5. On acceptance, the record moves to `consolidated_identity_relevant` and an audit entry is created.
6. On rejection, the record is moved to `rejected` consolidation status and must not influence Identity Layer parameters.
7. The original interaction memory record is preserved in all cases. Promotion creates a governed copy or tagged amendment; it does not overwrite the original.

Remove Open Question 15 from §36 and replace with: "What tooling and UI is required to make the promotion review workflow accessible to non-technical reviewers? Deferred to CPE-CORE-007."

---

### Item 2.3 — Post-Death Correction Authority

**Location:** This is not addressed anywhere in the document despite being flagged as a required concern in CPE-CORE-001 v1.2. The `AuthorityProfile` includes `mayCorrectHistoricalMemory` but does not specify who holds that permission after the subject dies.

**Action:** Add a new subsection **§8.x Post-Death Authority** with the following content:

After the subject's death, correction authority passes according to the following order of precedence:

1. Subject-designated correction authority (named in advance by the subject during capture).
2. Authorised estate representative (requires legal designation).
3. Trusted family reviewer (limited scope — may challenge or contextualise but not replace).
4. System governance process (for technical contradictions or detected errors only).

No correction authority created post-death may increase the `authorityLevel` of a memory record beyond `trusted_witness`.

A correction made post-death must carry `memoryType: "correction"` with a `correctionAuthority` field identifying the post-death authority source.

Add to §36 Open Questions: "What legal or contractual mechanism should govern the designation of post-death correction authority? Refer to CPE-CORE-004 and legal/consent architecture."

---

## Category 3 — Schema Design Issues

---

### Item 3.1 — Add Range Annotations to Numeric Fields

**Location:** Multiple numeric fields across the document lack `// 0.0 - 1.0` annotations. `EmotionalSalience` correctly includes them; apply the same convention consistently.

**Action:** Add `// 0.0 - 1.0` inline comments to the following fields:

- `RelationshipRef.emotionalCloseness?: number`
- `RelationshipRef.confidence: number`
- `ProvenanceProfile.provenanceConfidence: number`
- `AuthorityProfile.authorityConfidence: number`
- `MemoryConfidence.factualConfidence: number`
- `MemoryConfidence.temporalConfidence: number`
- `MemoryConfidence.sourceConfidence: number`
- `MemoryConfidence.emotionalConfidence: number`
- `MemoryConfidence.interpretationConfidence: number`
- `MemoryConfidence.overallConfidence: number`
- `TemporalRange.confidence: number`
- `GraphEdge.weight: number` (once added per Item 2.1)
- `GraphNode.confidence: number` (once added per Item 2.1)

---

### Item 3.2 — Document `passStability` in `RetrievalConfidence`

**Location:** `RetrievalConfidence.passStability: number` is used in the schema and in the §33 example but is not explained.

**Action:** Add an inline comment to the field:

```ts
passStability: number; // 0.0 - 1.0. Measures candidate ranking consistency across progressive retrieval passes. High stability indicates convergence; low stability indicates ambiguity or divergent candidates.
```

---

### Item 3.3 — Document base record timestamps

**Location:** `BaseMemoryRecord` has `createdAt` and `updatedAt` at the base level. §10.3 stresses the importance of preserving event time separately from record management time, but the base-level timestamps carry no annotation to make this distinction clear.

**Action:** Add inline comments to both fields in `BaseMemoryRecord`:

```ts
createdAt: string; // Record creation time (management timestamp — not event time)
updatedAt: string; // Last record update time (management timestamp — not event time)
```

---

### Item 3.4 — Clarify `selectedMemories` in §33 example

**Location:** The §33 example MemoryBundle has `selectedMemories: []` which is correct for `hypothesising` state but may read as a mistake.

**Action:** Add an inline comment to that line in the example:

```ts
selectedMemories: [], // Empty — retrieval is in hypothesising state; no memory committed yet
```

---

## Category 4 — Structural Issues

---

### Item 4.1 — Update §2 Scope

**Location:** §2 (Scope) enumerates 19 items, but the document contains 37 sections.

**Action:** Update the scope enumeration in §2 to reflect the full document. Add the following items to the existing list:

20. Downstream use contracts (Reasoning, Identity, Embodiment, Capture).
21. Example MemoryBundle.
22. Implementation notes (interim and target).
23. Failure modes.
24. Open questions.
25. Summary.

---

### Item 4.2 — Note multi-facet embedding implementation delta in §34.1

**Location:** §34.1 (Interim Implementation) describes memory records stored with vector indexes but does not acknowledge the gap between the five-facet embedding model specified in §14 and the current single-pipeline implementation.

**Action:** Add the following paragraph to §34.1 after the existing content:

The interim implementation uses a single embedding pipeline (nomic-embed-text, 768 dimensions) stored in a single pgvector index. This represents a subset of the multi-facet embedding model specified in §14. In the interim implementation, the `embeddingSet.semantic` facet is populated; other facets (`temporal`, `relational`, `emotional`, `sensory`) are deferred. Retrieval queries against those facets must fall back to semantic search and graph traversal until the full embedding pipeline is implemented. The `MemoryEmbeddingSet` schema remains valid; unpopulated facets are represented as absent optional fields.

---

### Item 4.3 — Add current schema mapping to §34.1

**Location:** §34.1 does not reference the currently deployed Supabase schema, making it harder to understand the delta between the live implementation and the full spec.

**Action:** Add a subsection **§34.1.x Interim Schema Mapping** with the following table:

| Supabase Table | CPE-CORE-002 Concept | Notes |
|---|---|---|
| `diary_entries` | `CapturedMemoryRecord` | `memoryType: "captured"`, `memorySystem: "episodic"` |
| `interview_sessions` | `CapturedMemoryRecord` | `memoryType: "captured"`, `memorySystem: "semantic"` |
| `persona_traits` | `DerivedMemoryRecord` (semantic) | `memoryType: "derived"`, requires full provenance fields in target schema |
| `emotional_voice_samples` | `CapturedMemoryRecord` | `memorySystem: "emotional_implicit"`, includes capture quality metadata |

The target implementation will migrate or extend these tables to conform to the full `BaseMemoryRecord` schema.

---

## Category 5 — Minor Corrections

---

### Item 5.1 — Capitalisation typo in §5.1

**Location:** §5.1 (Historical Memory), numbered source list, item 3.

**Current text:** `3. letters.`

**Corrected text:** `3. Letters.`

---

### Item 5.2 — Unclear phrase in §5.3

**Location:** §5.3 (Captured Memory), numbered source list, item 3.

**Current text:** `3. self-interaction review.`

**Corrected text:** `3. Subject self-review.`

---

## Acceptance Criteria for v0.2

The updated document should satisfy all of the following:

1. All six types named in Category 1 are defined (`MemoryContent`, `ConsentProfile`, `MemoryLifecycle`, `EmbeddingRef`, `GraphNode`, `GraphEdge`).
2. The interaction memory promotion workflow in §29 is substantively specified.
3. Post-death correction authority is addressed in §8.
4. §2 Scope accurately reflects the full document structure.
5. §34.1 documents the multi-facet embedding implementation delta and includes the schema mapping table.
6. All numeric fields carry `// 0.0 - 1.0` range annotations.
7. `passStability` has an inline comment explaining its meaning.
8. The two minor typos are corrected.
9. The document version header reads `v0.2` and status reads `Draft`.
10. No existing content outside the scope of these notes has been altered.

---

*Review notes prepared June 2026. Target document: CPE-CORE-002 v0.2.*
