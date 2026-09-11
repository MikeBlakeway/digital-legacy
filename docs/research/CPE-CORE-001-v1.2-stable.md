# CPE-CORE-001

## Continuous Presence Engine

### Core Architecture Specification v1.2

**Status:** Stable
**Version:** 1.2
**Date:** June 2026
**Supersedes:** CPE-CORE-001 v1.1
**Project:** Digital Legacy / Continuous Presence Engine

---

# 1. Introduction

## 1.1 Purpose

The Continuous Presence Engine (CPE) is a cognitive architecture designed to preserve, model, and express the continuous presence of a specific human individual through perception, deliberate capture, memory, identity modelling, reasoning, and embodiment.

The CPE is intended to support a digital persona that can:

1. Observe live interaction.
2. Incorporate deliberately captured life material.
3. Store and retrieve personal memories.
4. Maintain a stable identity model.
5. Reason in a manner consistent with that identity.
6. Express itself through one or more embodiment tiers.
7. Preserve temporal honesty about what the represented individual did and did not experience.

The objective is not merely conversational simulation. The objective is long-term continuity of personhood representation, with explicit architectural controls for fidelity, latency, consistency, authority, and temporal coherence.

---

## 1.2 Revision Summary

Version 1.2 preserves the five-layer architecture introduced in v1.0 and extended in v1.1:

```text
Perception Layer
        ↓
Memory Layer
        ↓
Identity Layer
        ↓
Reasoning Layer
        ↓
Embodiment Layer
```

Version 1.2 stabilises the architecture by adding or refining:

1. The revised specification sequence.
2. Persona-specific limitations of interim RAG implementations.
3. Relationship Graph as an active retrieval structure.
4. Preliminary `knowledgeBoundaryStatus` values.
5. Progressive Recall Response as a named runtime pattern.
6. Profile-level versus parameter-level identity encoding as an architectural tension.
7. Post-death correction authority as a required concern for CPE-CORE-004.

---

## 1.3 Specification Sequence

The CPE specification sequence is:

| Number       | Title                                        | Purpose                                                                                                          |
| ------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| CPE-CORE-001 | Core Architecture                            | Defines the high-level architecture, principles, and subsystem responsibilities                                  |
| CPE-CORE-002 | Memory Schema and Retrieval Architecture     | Defines memory records, retrieval, temporal metadata, contradiction handling, and relationship graph integration |
| CPE-CORE-003 | Inter-Layer Interfaces and Data Contracts    | Defines the objects and event contracts exchanged between CPE layers                                             |
| CPE-CORE-004 | Identity Modelling Framework                 | Defines personality, values, beliefs, correction authority, and identity versioning                              |
| CPE-CORE-005 | Continuous Presence Runtime Architecture     | Defines orchestration, streaming execution, latency, scheduling, and full-duplex runtime patterns                |
| CPE-CORE-006 | Embodiment and Presence Protocol             | Defines embodiment tiers, presence contracts, rendering, and failure vocabulary                                  |
| CPE-CORE-007 | Capture Protocol and Persona Readiness Model | Defines capture sessions, quality gates, readiness metrics, and subject review workflows                         |

CPE-CORE-002 is specified before CPE-CORE-003 because inter-layer interface contracts must reference concrete memory objects. The memory schema must therefore be stabilised before the interface layer is finalised.

---

## 1.4 Design Priorities

The CPE architecture is evaluated against three primary design priorities.

### 1.4.1 Latency

The system must support natural conversational timing. Latency is not an implementation detail; it is an architectural property.

Every layer contributes to latency. Every layer must define:

* Expected processing time.
* Streaming capability.
* Blocking behaviour.
* Fallback behaviour when latency limits are exceeded.

### 1.4.2 Fidelity

The system must preserve the represented individual accurately across:

* Memory.
* Voice.
* Visual likeness.
* Personality.
* Values.
* Beliefs.
* Communication style.
* Emotional range.
* Behavioural mannerisms.

Fidelity is not limited to surface imitation. It includes truthful representation of what the individual did, believed, remembered, and experienced.

### 1.4.3 Consistency

The system must maintain coherent identity expression across:

* Sessions.
* Devices.
* Embodiment tiers.
* Time.
* Model upgrades.
* Memory updates.

Consistency does not require static behaviour. A person may be humorous in one context and serious in another. Consistency means the variation should be explainable by identity, context, relationship, and embodiment tier rather than random model behaviour.

---

# 2. Architectural Overview

## 2.1 Core Runtime Architecture

The CPE consists of five primary runtime layers:

```text
┌─────────────────────┐
│  Perception Layer   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    Memory Layer     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Identity Layer    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Reasoning Layer   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Embodiment Layer   │
└─────────────────────┘
```

This stack defines the primary flow of live interaction:

1. Perception converts live signals into structured observations.
2. Memory retrieves relevant historical and contextual information.
3. Identity constrains interpretation, reasoning, and expression.
4. Reasoning generates decisions, responses, and actions.
5. Embodiment renders those responses into an interaction medium.

---

## 2.2 Extended Architecture

The CPE also includes a Capture Subsystem and governed runtime feedback loops.

```text
                         ┌──────────────────────┐
                         │  Capture Subsystem   │
                         │ deliberate authorship│
                         └───────┬───────┬──────┘
                                 │       │
                                 ↓       ↓
┌─────────────────────┐    ┌─────────────────────┐
│  Perception Layer   │───▶│    Memory Layer     │◀──────────────┐
└──────────┬──────────┘    └──────────┬──────────┘               │
           │                          ↓                          │
           │                ┌─────────────────────┐              │
           │                │   Identity Layer    │◀──────┐      │
           │                └──────────┬──────────┘       │      │
           │                          ↓                  │      │
           │                ┌─────────────────────┐       │      │
           └───────────────▶│   Reasoning Layer   │───────┘      │
                            └──────────┬──────────┘              │
                                       ↓                         │
                            ┌─────────────────────┐              │
                            │  Embodiment Layer   │──────────────┘
                            └─────────────────────┘
```

The architecture contains three explicit feedback loops:

1. Conversation → Memory
2. Correction → Identity
3. Embodiment Context → Reasoning

These feedback loops are governed processes. They must not silently mutate historical memory or identity state.

---

## 2.3 Capture as a Sidecar Subsystem

The Capture Subsystem is not a sixth runtime layer.

It is a sidecar subsystem that produces high-quality training, calibration, and authorship data for:

* Memory Layer
* Identity Layer
* Embodiment Layer

The distinction is important:

| Mode               | Description                        |   Data Quality | Primary Role         |
| ------------------ | ---------------------------------- | -------------: | -------------------- |
| Passive Perception | Observes natural interaction       |  Probabilistic | Runtime awareness    |
| Deliberate Capture | Structured co-authoring by subject | Training-grade | Persona construction |

Perception answers:

> What is happening now?

Capture answers:

> What should be intentionally preserved, modelled, or calibrated?

---

# 3. Perception Layer

## 3.1 Purpose

The Perception Layer converts live environmental and interaction signals into structured observations.

It answers:

> What is happening right now?

---

## 3.2 Responsibilities

The Perception Layer shall:

1. Capture live sensory signals.
2. Identify speakers and participants.
3. Detect linguistic content.
4. Detect emotional and paralinguistic cues.
5. Recognise environmental context.
6. Stream partial observations downstream where confidence permits.
7. Preserve short-term sensory context for live interaction.
8. Distinguish passive observation from deliberate capture.

---

## 3.3 Inputs

### Human Signals

* Speech audio.
* Video streams.
* Facial expressions.
* Body language.
* Text messages.
* Documents.
* Images.
* Gesture events.
* Turn-taking cues.
* Interruption cues.

### Environmental Signals

* Location.
* Time.
* Weather.
* Device state.
* Calendar context.
* IoT sensor state.
* Room context.
* Active embodiment environment.

### Internal Signals

* Current session state.
* Active conversation context.
* Active embodiment tier.
* Recent reasoning state.
* Recent memory retrievals.

---

## 3.4 Outputs

The Perception Layer outputs structured observations.

Example:

```json
{
  "type": "observation",
  "id": "obs_001",
  "timestamp": "2026-06-05T12:15:00Z",
  "source": "live_audio",
  "speaker": {
    "id": "person_sarah",
    "confidence": 0.91
  },
  "utterance": {
    "partial": false,
    "text": "How was your holiday?"
  },
  "emotion": {
    "label": "curious",
    "confidence": 0.68
  },
  "environment": {
    "location": "home",
    "device": "living_room_display"
  }
}
```

The output may be:

* Partial.
* Final.
* Corrected.
* Superseded.

Streaming perception outputs must support update semantics.

---

## 3.5 Storage Requirements

### Sensory Buffer

Stores recent sensory input for real-time continuity.

Includes:

* Recent audio.
* Recent visual frames.
* Recent transcripts.
* Recent turn-taking signals.
* Recent participant state.

Expected retention:

* 5 seconds to 10 minutes.

Purpose:

* Real-time grounding.
* Interruption handling.
* Short-term disambiguation.
* Conversation repair.

### Perception Event Log

Stores structured observation events that may be candidates for memory extraction.

Expected retention:

* Configurable.
* Usually session-limited unless promoted by Memory Layer.

---

## 3.6 Training Requirements

### Speech Models

Required capabilities:

* Speech recognition.
* Speaker identification.
* Accent adaptation.
* Noise reduction.
* Turn-taking detection.
* Interruption detection.
* Paralinguistic cue extraction.

### Vision Models

Required capabilities:

* Face recognition.
* Gaze estimation.
* Gesture recognition.
* Posture detection.
* Emotion inference.
* Scene understanding.

### Context Models

Required capabilities:

* Situation classification.
* Social context detection.
* Participant relationship inference.
* Embodiment-aware interaction classification.

---

## 3.7 Latency Requirements

The Perception Layer shall support streaming output.

It should not wait for complete utterance finalisation before emitting useful partial signals.

Required latency concepts:

| Metric                      | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| Time to Partial Observation | Time from signal start to first usable observation                |
| Time to Final Observation   | Time from signal completion to stable output                      |
| Correction Window           | Period in which partial observations may be revised               |
| Confidence Threshold        | Minimum confidence required for downstream speculative processing |

The Perception Layer must support speculative downstream processing where appropriate.

---

## 3.8 Open Research Questions

1. How can multimodal perception be fused reliably in real time?
2. How should emotion be inferred without overclaiming certainty?
3. How can privacy-preserving perception be implemented?
4. How should long-duration perception streams be summarised?
5. How should partial observations be corrected without destabilising downstream reasoning?

---

# 4. Capture Subsystem

## 4.1 Purpose

The Capture Subsystem enables the subject to deliberately contribute to, review, calibrate, and improve their own digital representation.

It answers:

> What should be intentionally preserved?

The Capture Subsystem is architecturally distinct from passive perception. Passive perception observes. Capture invites the subject to co-author.

---

## 4.2 Responsibilities

The Capture Subsystem shall:

1. Provide structured capture sessions.
2. Produce training-grade memory, identity, voice, visual, and behavioural data.
3. Define session-specific pipeline configurations.
4. Apply quality gates to captured data.
5. Generate readiness metrics.
6. Support subject review and correction.
7. Feed downstream Memory, Identity, and Embodiment layers.
8. Preserve provenance and consent metadata.

---

## 4.3 Capture Session Types

### 4.3.1 Diary Room Session

Purpose:

* Capture personal reflections.
* Capture stories.
* Capture emotional range.
* Capture natural speech and expression.

Outputs:

* Episodic memory candidates.
* Identity signals.
* Voice samples.
* Emotional expression samples.
* Communication style samples.

---

### 4.3.2 Guided Interview Session

Purpose:

* Capture structured life history.
* Capture relationships.
* Capture beliefs.
* Capture values.
* Capture preferences.

Outputs:

* Life timeline events.
* Relationship graph entries.
* Semantic memories.
* Value statements.
* Belief statements.
* Identity profile evidence.

---

### 4.3.3 Directed Capture Session

Purpose:

* Capture specific behaviours or missing coverage areas.

Examples:

* “Tell the story of your childhood home.”
* “Record how you usually greet your daughter.”
* “Show how you react when surprised.”
* “Explain your views on work, family, and loyalty.”

Outputs:

* Targeted memory records.
* Behavioural samples.
* Mannerism examples.
* Emotional coverage samples.
* Identity reinforcement data.

---

### 4.3.4 Avatar Review Session

Purpose:

* Allow the subject to review visual, voice, behavioural, and expressive fidelity.

Outputs:

* Avatar correction events.
* Voice correction events.
* Gesture correction events.
* Presence quality scores.
* Embodiment readiness metrics.

---

### 4.3.5 Self-Interaction Session

Purpose:

* Allow the subject to interact with their own persona and identify misrepresentation.

Outputs:

* Correction events.
* Identity delta candidates.
* Memory correction candidates.
* Communication style corrections.
* Behavioural mismatch reports.

---

## 4.4 Capture Outputs

Capture sessions produce structured records.

Example:

```json
{
  "type": "capture_session",
  "id": "cap_001",
  "sessionType": "guided_interview",
  "subject": "subject_001",
  "timestamp": "2026-06-05T14:00:00Z",
  "outputs": {
    "memoryCandidates": ["memcand_001", "memcand_002"],
    "identitySignals": ["idsig_001"],
    "voiceSamples": ["voice_001"],
    "relationshipUpdates": ["rel_001"]
  },
  "quality": {
    "audioQuality": 0.92,
    "identityCoverage": 0.74,
    "memoryDepth": 0.81,
    "emotionalCoverage": 0.63
  },
  "consent": {
    "captureApproved": true,
    "trainingUseApproved": true
  }
}
```

---

## 4.5 Quality Gates and Readiness Metrics

The Capture Subsystem shall expose readiness metrics.

Required metrics include:

| Metric                | Description                                              |
| --------------------- | -------------------------------------------------------- |
| Memory Depth          | Breadth and detail of captured life memories             |
| Identity Coverage     | Coverage of values, beliefs, personality, preferences    |
| Relationship Coverage | Coverage of significant people and relationship dynamics |
| Voice Readiness       | Suitability of voice data for synthesis                  |
| Visual Readiness      | Suitability of visual data for avatar generation         |
| Emotional Coverage    | Range of captured emotional states                       |
| Behavioural Coverage  | Mannerisms, habits, gestures, reactions                  |
| Temporal Coverage     | Distribution of memories across life stages              |

Readiness metrics should inform capture priorities and set honest expectations for persona quality.

---

## 4.6 Relationship to Runtime Layers

The Capture Subsystem feeds:

| Downstream Layer | Capture Contribution                                        |
| ---------------- | ----------------------------------------------------------- |
| Memory           | Episodic memories, semantic facts, timelines, relationships |
| Identity         | Values, beliefs, personality traits, communication style    |
| Embodiment       | Voice, appearance, gestures, expressions, mannerisms        |

Capture outputs shall include provenance metadata to distinguish them from passively perceived data and interaction-generated content.

---

## 4.7 Open Research Questions

1. What capture protocols produce the highest identity fidelity?
2. How much data is required for reliable persona readiness?
3. How should the subject review and correct their own persona?
4. How should emotional range be captured ethically?
5. How should capture quality be measured across different embodiment tiers?

---

# 5. Memory Layer

## 5.1 Purpose

The Memory Layer stores, organises, retrieves, and governs information required for continuity of identity.

It answers:

> What has happened before?

---

## 5.2 Responsibilities

The Memory Layer shall:

1. Store personal experiences.
2. Store factual knowledge.
3. Store relationships.
4. Maintain life timeline structures.
5. Preserve memory provenance.
6. Distinguish historical memories from interaction-generated content.
7. Retrieve relevant memory under latency constraints.
8. Support memory confidence, contradiction handling, and temporal boundaries.
9. Support post-session memory consolidation.
10. Support graph-augmented retrieval across people, relationships, entities, places, time, and themes.

---

## 5.3 Inputs

Inputs include:

* Perception observations.
* Capture outputs.
* User-provided documents.
* Historical media.
* Conversation transcripts.
* Reasoning outputs.
* Correction events.
* External annotations.
* Identity update events.

---

## 5.4 Memory Types

The Memory Layer shall distinguish between structurally different memory classes.

| Memory Type        | Description                                             |     Authority |
| ------------------ | ------------------------------------------------------- | ------------: |
| Historical Memory  | Event or fact experienced by the subject during life    |       Highest |
| Authored Memory    | Deliberately supplied or approved by the subject        |          High |
| Captured Memory    | Extracted from structured capture sessions              |          High |
| Interaction Memory | Generated during persona-user interactions              |        Medium |
| Derived Memory     | Inferred by the system from other records               | Low to medium |
| Correction Memory  | Explicit correction from subject or authorised reviewer |      Governed |
| System Memory      | Operational metadata about sessions or configuration    |    Contextual |

Historical memory and interaction-generated content must not be conflated.

Correction Memory does not carry universal authority by default. Its authority depends on:

* Who issued the correction.
* Whether the subject approved it.
* The evidence attached.
* The scope of the correction.
* Whether the correction is contextual or absolute.
* Whether the correction conflicts with higher-authority records.

---

## 5.5 Outputs

The Memory Layer outputs:

* Retrieved memories.
* Memory bundles.
* Relationship context.
* Timeline context.
* Contradiction warnings.
* Confidence scores.
* Temporal boundary warnings.
* Memory candidates for consolidation.

Example:

```json
{
  "type": "memory_bundle",
  "id": "membundle_001",
  "query": "holiday with Sarah",
  "results": [
    {
      "memoryId": "mem_001",
      "memoryType": "historical",
      "summary": "The subject visited Cornwall with Sarah in 2019.",
      "confidence": 0.89,
      "source": "guided_interview",
      "timestamp": "2019-08-12",
      "authority": "high"
    }
  ],
  "warnings": []
}
```

---

## 5.6 Storage Requirements

### Episodic Memory Store

Stores:

* Events.
* Experiences.
* Conversations.
* Milestones.
* Significant life episodes.

### Semantic Memory Store

Stores:

* Facts.
* Preferences.
* Skills.
* Interests.
* Beliefs when represented as factual claims.

### Relationship Graph

Stores:

* Family.
* Friends.
* Colleagues.
* Social dynamics.
* Emotional closeness.
* Relationship history.
* Forms of address.
* Relationship-specific memories.
* Relationship-specific communication patterns.

The Relationship Graph is not a passive store. It is an active retrieval structure.

Memory records should reference Relationship Graph nodes where applicable, allowing retrieval to begin from:

* People.
* Relationships.
* Roles.
* Emotional closeness.
* Shared events.
* Family structures.
* Social contexts.

A question about a specific person should be capable of triggering graph traversal that surfaces connected episodic memories, authored statements, semantic facts, emotional dynamics, and historical context, rather than relying only on semantic similarity to the query text.

### Life Timeline

Stores:

* Chronological history.
* Places lived.
* Education.
* Career.
* Relationships.
* Achievements.
* Transitions.
* Important dates.

### Interaction Memory Store

Stores:

* Persona-user interactions.
* Post-capture conversations.
* User disclosures.
* Persona statements.
* Shared future-facing conversations.

This store must remain distinct from historical memory.

### Retrieval Indexes

Required indexes include:

* Vector index.
* Graph index.
* Temporal index.
* Semantic index.
* Relationship index.
* Provenance index.
* Authority index.
* Contradiction index.

---

## 5.7 Training Requirements

### Memory Extraction

Transform unstructured input into structured memory candidates.

Sources include:

* Documents.
* Photos.
* Audio.
* Video.
* Conversations.
* Interviews.
* Diary room recordings.

### Memory Consolidation

Determine whether memory candidates should become durable records.

Factors include:

* Source authority.
* Repetition.
* Emotional importance.
* Relationship importance.
* Subject approval.
* Consistency with existing memory.
* Temporal relevance.

### Retrieval Training

Optimise retrieval for:

* Relevance.
* Latency.
* Temporal coherence.
* Identity fidelity.
* Contradiction detection.
* Relationship sensitivity.
* Multi-hop memory traversal.
* Authority-aware ranking.

---

## 5.8 Latency Requirements

The Memory Layer shall support both:

1. Fast retrieval for real-time conversation.
2. Deep retrieval for reflective or high-fidelity modes.

Retrieval shall be tier-aware.

| Retrieval Mode             | Use Case                    | Expected Behaviour                             |
| -------------------------- | --------------------------- | ---------------------------------------------- |
| Hot Cache                  | Active conversation         | Immediate access to recent and likely memories |
| Fast Retrieval             | Voice / avatar conversation | Low-latency approximate retrieval              |
| Deep Retrieval             | Text / reflective modes     | Slower, higher-recall retrieval                |
| Post-Session Consolidation | Memory formation            | Offline or background consolidation            |

The Memory Layer shall expose streaming retrieval where possible. Partial memory bundles may be sent to the Reasoning Layer before full retrieval completes.

---

## 5.9 Persona-Specific Retrieval Limitations

The interim retrieval architecture must not be understood as simple vector search over isolated memory records.

Persona memory has requirements that exceed ordinary document retrieval.

### 5.9.1 Isolated Point Problem

Pure vector search treats each memory as a semantically independent point.

Persona reasoning often requires connecting multiple memories across themes, people, values, and time.

Example query:

> What did the subject think about the relationship between work and family?

This may require retrieval across:

* Work memories.
* Family memories.
* Value statements.
* Life decisions.
* Regrets.
* Career history.
* Relationship dynamics.

The Memory Layer must therefore support graph-augmented retrieval and multi-hop traversal.

### 5.9.2 Temporal Weighting

Semantic similarity alone does not account for when a memory occurred.

For persona fidelity, the retrieval system must distinguish between:

* Early-life beliefs.
* Later-life beliefs.
* Superseded beliefs.
* Recurring beliefs.
* Unresolved tensions.
* Recent corrections.

Temporal weighting must be a first-class retrieval parameter rather than a post-retrieval adjustment.

### 5.9.3 Contradiction Detection

The Memory Layer shall support contradiction detection and resolution.

Contradictions may exist between:

* Historical memories.
* Authored memories.
* Captured memories.
* Correction memories.
* Interaction memories.
* Derived memories.

The system must determine:

* Which records conflict.
* Which records have higher authority.
* Whether both records may be true in different contexts.
* Whether one record supersedes another.
* Whether uncertainty should be surfaced to the Reasoning Layer.

CPE-CORE-002 shall define the contradiction model in detail.

---

## 5.10 Open Research Questions

1. How should contradictory memories be represented?
2. How should memory confidence be calculated?
3. How should interaction-generated content influence future responses?
4. How should memory drift be prevented?
5. How can memory remain portable across model generations?
6. How can real-time retrieval support full-duplex conversation?
7. How should memories be forgotten, suppressed, or reweighted?
8. How should graph traversal, temporal weighting, and semantic similarity be combined?
9. How should relationship-sensitive retrieval be evaluated?

---

# 6. Identity Layer

## 6.1 Purpose

The Identity Layer defines the persistent characteristics of the represented individual.

It answers:

> Who am I?

---

## 6.2 Responsibilities

The Identity Layer shall:

1. Represent personality.
2. Represent values.
3. Represent beliefs.
4. Represent communication style.
5. Represent emotional tendencies.
6. Represent moral and behavioural boundaries.
7. Maintain identity consistency across sessions and embodiment tiers.
8. Accept corrections only through explicit identity update procedures.
9. Version identity changes over time.
10. Distinguish between profile-level identity and any parameter-level identity adaptation.

---

## 6.3 Inputs

Inputs include:

* Historical memories.
* Authored memories.
* Capture outputs.
* Structured interviews.
* Behavioural observations.
* Communication samples.
* Correction events.
* Identity delta proposals.
* Relationship context.

---

## 6.4 Outputs

The Identity Layer outputs identity constraints and profiles used by the Reasoning Layer.

Example:

```json
{
  "type": "identity_profile",
  "id": "idprof_001",
  "subject": "subject_001",
  "version": "1.2.0",
  "traits": {
    "humour": "dry",
    "warmth": 0.82,
    "directness": 0.71
  },
  "values": [
    {
      "label": "family",
      "strength": 0.94,
      "sourceAuthority": "high"
    }
  ],
  "communication": {
    "preferredTone": "warm_direct",
    "typicalResponseLength": "medium",
    "usesHumour": true
  }
}
```

---

## 6.5 Storage Requirements

### Personality Model

Stores:

* Traits.
* Behaviour tendencies.
* Social preferences.
* Emotional tendencies.
* Conflict style.
* Humour style.

### Values Model

Stores:

* Ethical priorities.
* Personal principles.
* Family values.
* Work values.
* Loyalty patterns.
* Care responsibilities.

### Belief Model

Stores:

* Opinions.
* Worldviews.
* Philosophical positions.
* Religious views.
* Political views where captured.
* Confidence and source metadata.

### Communication Model

Stores:

* Vocabulary.
* Tone.
* Humour.
* Writing style.
* Speech patterns.
* Pacing.
* Directness.
* Forms of affection.
* Common phrases.

### Identity Version Store

Stores:

* Identity profile versions.
* Identity deltas.
* Correction history.
* Review decisions.
* Confidence changes.
* Deprecated identity claims.

---

## 6.6 Identity Update Procedure

Identity shall not be silently mutated.

Corrections must be routed through an explicit update procedure.

```text
Correction Event
      ↓
Evidence Review
      ↓
Identity Delta Proposal
      ↓
Validation
      ↓
Versioned Identity Update
      ↓
Reasoning Layer Constraint Refresh
```

Identity updates must include:

* Source.
* Authority.
* Rationale.
* Affected identity fields.
* Confidence change.
* Previous value.
* New value.
* Reviewer or subject approval status.

---

## 6.7 Profile-Level and Parameter-Level Identity

CPE-CORE-001 models Identity primarily as a structured profile consumed by the Reasoning Layer.

However, practical implementations may also encode identity at other levels, including:

1. Profile-level identity.
2. Retrieval-level identity evidence.
3. Prompt or context-level identity constraints.
4. Parameter-level identity adaptation through fine-tuning, low-rank adaptation, or equivalent methods.

These identity representations have different update behaviours.

A profile-level identity update can take effect immediately. A parameter-level identity update may require retraining, validation, or deployment of an adapted model.

This creates a structural tension. If a correction updates the profile but not the parameter-level behaviour, the system may become inconsistent.

CPE-CORE-004 shall define how profile-level and parameter-level identity are reconciled.

Until that framework is defined, profile-level identity is treated as the authoritative runtime representation. Parameter-level identity must not silently override explicit identity profile constraints.

---

## 6.8 Training Requirements

### Structured Interviews

Capture:

* Life story.
* Values.
* Beliefs.
* Preferences.
* Regrets.
* Hopes.
* Relationships.
* Personal philosophy.

### Behavioural Analysis

Observe:

* Decisions.
* Reactions.
* Preferences.
* Emotional responses.
* Conflict behaviour.
* Social dynamics.

### Communication Analysis

Learn from:

* Emails.
* Messages.
* Recordings.
* Videos.
* Letters.
* Voice notes.
* Transcripts.

### Self-Interaction Review

Use subject review to identify:

* Misrepresentation.
* Tone mismatch.
* Incorrect values.
* Incorrect phrasing.
* False memories.
* Avatar mismatch.
* Voice mismatch.

---

## 6.9 Latency Requirements

The Identity Layer should expose low-latency identity constraints to the Reasoning Layer.

Identity retrieval should usually be preloaded for active sessions.

Required modes:

| Mode                                 | Description                                               |
| ------------------------------------ | --------------------------------------------------------- |
| Session Identity Context             | Preloaded active identity profile                         |
| Embodiment-Specific Identity Context | Identity expression tuned to current embodiment tier      |
| Relationship-Specific Context        | Identity expression adjusted for participant relationship |
| Correction-Aware Context             | Active correction or uncertainty warnings                 |

Identity resolution should not block real-time reasoning except where safety, fidelity, or temporal coherence requires it.

---

## 6.10 Open Research Questions

1. How should stable identity be distinguished from changing preference?
2. How should conflicting identity evidence be resolved?
3. Can a persona continue to evolve after the subject is no longer alive?
4. How should uncertainty in belief representation be communicated?
5. How should identity be validated by the subject or family?
6. How should identity drift be detected?
7. How should identity adapt across embodiment tiers without becoming inconsistent?
8. How should profile-level and parameter-level identity conflicts be resolved?

---

# 7. Reasoning Layer

## 7.1 Purpose

The Reasoning Layer generates decisions, responses, reflections, and actions by combining live perception, memory retrieval, identity constraints, temporal boundaries, and embodiment context.

It answers:

> What should I think, say, or do next?

---

## 7.2 Responsibilities

The Reasoning Layer shall:

1. Interpret live observations.
2. Retrieve or request relevant memories.
3. Apply identity constraints.
4. Apply temporal coherence rules.
5. Apply embodiment context.
6. Generate responses.
7. Plan actions.
8. Handle interruptions.
9. Produce memory candidates.
10. Produce reflection records.
11. Respect latency budgets.
12. Avoid confabulation beyond the subject’s knowledge boundary.
13. Support Progressive Recall Response where appropriate.

---

## 7.3 Inputs

Inputs include:

* Perception observations.
* Memory bundles.
* Identity profiles.
* Embodiment context.
* Temporal boundary metadata.
* Relationship context.
* Active session state.
* User utterances.
* Correction events.
* Latency budget.
* Safety constraints.

---

## 7.4 Outputs

### External Outputs

* Text responses.
* Speech response plans.
* Action requests.
* Gesture intents.
* Avatar expression intents.
* Conversational repair prompts.

### Internal Outputs

* Memory candidates.
* Reflection records.
* Planning state.
* Confidence estimates.
* Identity mismatch warnings.
* Temporal boundary warnings.
* Retrieval requests.

Example:

```json
{
  "type": "reasoning_response",
  "id": "resp_001",
  "text": "I don't have a lived memory of that, but I imagine I would have been incredibly proud.",
  "responseMode": "voice_call",
  "temporalBoundaryApplied": true,
  "memoryReferences": ["mem_045"],
  "emotion": {
    "intendedTone": "warm_reflective"
  },
  "embodimentDirectives": {
    "pace": "slow",
    "facialExpression": "soft_smile"
  },
  "memoryCandidates": []
}
```

---

## 7.5 Storage Requirements

### Working Memory

Stores:

* Current conversation.
* Active participants.
* Active goals.
* Active topic.
* Recent observations.
* Current emotional state.
* Recent interruptions.

Retention:

* Seconds to hours.

### Planning State

Stores:

* Intentions.
* Goals.
* Tasks.
* Pending responses.
* Deferred questions.
* Active uncertainty.

### Reflection Store

Stores:

* Self-assessments.
* Confidence estimates.
* Response critiques.
* Identity consistency checks.
* Temporal coherence checks.
* Memory formation candidates.

---

## 7.6 Training Requirements

### Foundation Models

The Reasoning Layer may use:

* Language models.
* Multimodal models.
* Planning models.
* Tool-use models.
* Audio-native models.
* Full-duplex dialogue models.

### Identity Alignment

The Reasoning Layer must be trained or constrained to respect:

* Personality.
* Values.
* Beliefs.
* Communication style.
* Relationship-specific behaviour.
* Historical behaviour.

### Retrieval Grounding

The Reasoning Layer must learn to:

* Use memory rather than invent unsupported facts.
* Represent uncertainty.
* Distinguish historical memories from interaction memories.
* Respect temporal boundaries.
* Ask for clarification when needed.
* Avoid compounding false persona-generated claims.

---

## 7.7 Latency Requirements

The Reasoning Layer shall support tier-specific latency modes.

| Mode                        | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| Fast Response               | Short, natural replies for voice or avatar interaction             |
| Reflective Response         | Deeper reasoning for text or scene-based interaction               |
| Speculative Planning        | Begin planning before full perception finalisation                 |
| Interruptible Generation    | Allow user interruption during output                              |
| Progressive Recall Response | Begin with an initial response, then enrich as retrieval completes |

The Reasoning Layer must support streaming generation where embodiment tier requires it.

Sequential blocking is permitted only where required by:

* Safety.
* Fidelity.
* Temporal coherence.
* Explicit user request.
* Embodiment tier design.

---

## 7.8 Progressive Recall Response

Progressive Recall Response is a runtime pattern in which the Reasoning Layer begins generating an initial response before full memory retrieval has completed, then incorporates additional memories as they arrive.

This pattern is intended to make recall feel more natural, particularly in voice and avatar embodiments.

Rather than pausing silently while retrieval completes, the persona may begin with a lightweight response and then enrich, qualify, or redirect the response as memory becomes available.

Example:

```text
I think that was around the time we were living in Manchester... actually, yes, I remember now — it was just after the move, when work was taking up a lot of my attention.
```

Progressive Recall Response requires:

1. Enrichable partial responses.
2. Streaming memory retrieval.
3. Memory injection points.
4. Response revision policies.
5. Interruption handling.
6. Embodiment support for dynamic continuation.
7. TTS support for partial generation and extension in voice modes.
8. Temporal coherence checks during enrichment.
9. Guardrails preventing speculative statements from becoming false memories.

Progressive Recall Response is not merely a latency optimisation. It is a distinct runtime pattern and shall be developed further in CPE-CORE-005.

---

## 7.9 Open Research Questions

1. How can full-duplex reasoning be supported reliably?
2. How should reasoning handle interruption?
3. How should long-term planning operate in a digital legacy context?
4. How should the system reason with uncertain or contradictory memories?
5. How can temporal honesty be preserved without reducing emotional usefulness?
6. How should reasoning balance speed against fidelity?
7. How should identity constraints be represented inside reasoning models?
8. How can Progressive Recall Response avoid generating unsupported claims before retrieval completes?

---

# 8. Embodiment Layer

## 8.1 Purpose

The Embodiment Layer renders the digital person into forms humans can interact with.

It answers:

> How do I express myself?

In v1.2, embodiment is not treated merely as output rendering. Each embodiment tier defines a presence contract that influences reasoning upstream.

---

## 8.2 Responsibilities

The Embodiment Layer shall:

1. Render speech.
2. Render visual appearance.
3. Render facial expression.
4. Render gesture and posture.
5. Render emotional state.
6. Maintain behavioural realism.
7. Define embodiment-specific latency budgets.
8. Define conversational register.
9. Define in-world failure vocabulary.
10. Send embodiment context upstream to Reasoning.
11. Link embodiment tier to capture requirements.
12. Support Progressive Recall Response where the active tier permits dynamic continuation.

---

## 8.3 Inputs

Inputs include:

* Reasoning responses.
* Emotional state.
* Conversation state.
* Identity expression profile.
* Voice model.
* Avatar model.
* Behaviour library.
* Active embodiment tier.
* Latency budget.

---

## 8.4 Outputs

### Voice

* Speech synthesis.
* Prosody.
* Accent.
* Pace.
* Pauses.
* Breath.
* Emotional intonation.

### Visual Avatar

* Face.
* Expressions.
* Eye contact.
* Gestures.
* Posture.
* Idle behaviour.
* Turn-taking cues.

### Digital Presence

* Chat.
* Voice call.
* Video avatar.
* Scene avatar.
* VR.
* AR.
* Robotics.

---

## 8.5 Embodiment Tiers

Each tier shall define:

* UX metaphor.
* Conversational register.
* Latency budget.
* Failure vocabulary.
* Required capture modes.
* Required fidelity level.
* Interruption policy.
* Progressive Recall compatibility.

| Tier         | UX Metaphor            | Reasoning Register               | Latency Tolerance |
| ------------ | ---------------------- | -------------------------------- | ----------------: |
| Text         | Messaging              | Structured, reflective           |              High |
| Voice        | Phone call             | Brief, natural, interruptible    |               Low |
| Video Avatar | Video call             | Socially timed, expressive       |        Medium-low |
| Scene Avatar | Shared room / fireside | Reflective, emotionally present  |            Medium |
| VR / AR      | Co-present space       | Spatial, embodied, reactive      |          Very low |
| Robotics     | Physical presence      | Safety-aware, action-constrained |          Very low |

---

## 8.6 Embodiment Context Object

The Embodiment Layer shall provide an Embodiment Context Object to the Reasoning Layer.

Example:

```json
{
  "type": "embodiment_context",
  "tier": "voice_call",
  "uxMetaphor": "phone_call",
  "latencyBudgetMs": 700,
  "responseStyle": "brief_natural",
  "interruptionPolicy": "allow_barge_in",
  "progressiveRecallSupported": true,
  "failureVocabulary": {
    "missedInput": "Sorry, I missed that — say it again?",
    "latencyDelay": "Give me a second...",
    "uncertainty": "I'm not completely sure about that."
  },
  "captureRequirements": {
    "voiceReadiness": "high",
    "visualReadiness": "none",
    "gestureReadiness": "none"
  }
}
```

---

## 8.7 Storage Requirements

### Voice Model

Stores:

* Voice clone.
* Prosody profile.
* Accent profile.
* Speech rhythm.
* Emotional tone range.
* Common speech habits.

### Avatar Model

Stores:

* Appearance.
* Face.
* Expressions.
* Animation states.
* Visual ageing policy.
* Lighting and scene behaviour.

### Behaviour Library

Stores:

* Gestures.
* Habits.
* Conversational mannerisms.
* Idle behaviours.
* Greeting behaviours.
* Relationship-specific behaviours.

### Tier Configuration Store

Stores:

* Embodiment tier definitions.
* Latency budgets.
* Failure vocabulary.
* Capture requirements.
* Register constraints.
* Progressive Recall compatibility.

---

## 8.8 Training Requirements

### Voice Training

Sources:

* Historical recordings.
* Diary room recordings.
* Directed voice capture.
* Emotional range capture.

### Avatar Training

Sources:

* Images.
* Video.
* Motion capture.
* Avatar review sessions.
* Directed expression capture.

### Behaviour Training

Sources:

* Recorded interactions.
* Observational data.
* Subject review.
* Family review where authorised.
* Directed mannerism capture.

---

## 8.9 Latency Requirements

The Embodiment Layer shall define latency budgets per tier.

Relevant metrics include:

| Metric                     | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| Time to First Token        | Text output start                                               |
| Time to First Audio        | Speech output start                                             |
| Time to First Expression   | Avatar visible reaction                                         |
| Turn-Taking Delay          | Delay between user completion and persona response              |
| Interrupt Response Time    | Time to stop or adapt when interrupted                          |
| Animation Sync Delay       | Delay between speech and visual expression                      |
| Dynamic Continuation Delay | Delay when extending an in-progress Progressive Recall Response |

If latency exceeds the tier budget, the Embodiment Layer must use tier-appropriate in-world failure vocabulary rather than generic system errors.

---

## 8.10 Open Research Questions

1. How can the uncanny valley be reduced?
2. How should emotional fidelity be evaluated?
3. How can voice and visual embodiment remain synchronised?
4. How should trust be calibrated across embodiment tiers?
5. How should embodiment adapt to relationship context?
6. How should embodiment represent ageing, illness, or historical point-in-time identity?
7. How can high-fidelity embodiment remain low-latency?
8. Which embodiment tiers can safely support Progressive Recall Response?

---

# 9. Feedback Loop Architecture

## 9.1 Purpose

The CPE must improve and adapt over time without corrupting historical memory or identity fidelity.

Feedback loops therefore require explicit governance.

---

## 9.2 Conversation → Memory Loop

### Purpose

Allow significant interaction events to become durable memory records where appropriate.

### Trigger Conditions

* A user discloses meaningful new information.
* The persona makes a statement that should be tracked.
* A conversation references an important relationship, event, or decision.
* A session ends and requires consolidation.
* A user explicitly asks the persona to remember something.

### Data Format

Input:

* Conversation transcript.
* Reasoning response.
* Participant metadata.
* Memory candidate records.
* Source and authority metadata.

Output:

* Interaction memory.
* Memory candidate.
* Rejected memory candidate.
* Consolidation report.

### Update Frequency

* During session for short-term memory.
* Post-session for durable consolidation.
* Immediately when user explicitly requests memory creation.

### Owner

Primary owner:

* Memory Layer

Supporting layers:

* Reasoning Layer
* Perception Layer

### Constraint

Persona-generated content must not automatically become historical memory.

---

## 9.3 Correction → Identity Loop

### Purpose

Allow subject or authorised reviewer corrections to improve identity fidelity.

### Trigger Conditions

* Subject rejects a persona response.
* Subject identifies incorrect tone.
* Subject identifies incorrect belief.
* Subject identifies incorrect memory.
* Avatar or voice review identifies mismatch.
* Family or authorised reviewer flags misrepresentation.

### Data Format

Input:

* Correction event.
* Affected response or behaviour.
* Claimed correct representation.
* Evidence source.
* Reviewer authority.
* Confidence metadata.

Output:

* Identity delta proposal.
* Memory correction proposal.
* Embodiment correction proposal.
* Rejected correction.
* Versioned identity update.

### Update Frequency

* Event-driven.
* Applied only after explicit validation.

### Owner

Primary owner:

* Identity Layer

Supporting layers:

* Capture Subsystem
* Memory Layer
* Embodiment Layer

### Constraint

Identity must not be silently mutated.

---

## 9.4 Embodiment Context → Reasoning Loop

### Purpose

Ensure reasoning output matches the active embodiment tier.

### Trigger Conditions

* Session starts.
* Embodiment tier changes.
* Latency budget changes.
* User switches channel.
* Avatar scene changes.
* Device capability changes.
* Interaction mode changes from text to voice, voice to avatar, or avatar to VR.

### Data Format

Input:

* Embodiment Context Object.

Output:

* Reasoning constraints.
* Response style.
* Length target.
* Turn-taking policy.
* Failure vocabulary.
* Latency budget.
* Progressive Recall compatibility.

### Update Frequency

* At session start.
* On tier change.
* On device change.
* On latency degradation.
* On user preference change.

### Owner

Primary owner:

* Embodiment Layer

Supporting layer:

* Reasoning Layer

### Constraint

Embodiment is not a passive renderer. It is a first-class reasoning constraint.

---

# 10. Temporal Coherence Model

## 10.1 Purpose

The CPE must represent the knowledge boundary of the subject honestly.

It must distinguish between:

1. What the subject experienced.
2. What the subject authored.
3. What the persona later said.
4. What users later told the persona.
5. What the system inferred.

---

## 10.2 Knowledge Boundary

Each persona shall have one or more temporal boundaries.

Examples:

| Boundary Type        | Meaning                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| Capture Boundary     | Latest point at which subject-authored or subject-approved data exists |
| Life Boundary        | Point beyond which the subject had no lived experience                 |
| Model Boundary       | Point beyond which the current model lacks training knowledge          |
| Interaction Boundary | Point up to which persona-user interactions have been consolidated     |

The system must know which boundary applies to each response.

---

## 10.3 Temporal Response Protocol

When asked about events beyond the subject’s knowledge boundary, the persona must not confabulate.

Acceptable strategies include:

1. State lack of lived memory.
2. Respond imaginatively but clearly as imagination.
3. Ask the user to tell the persona what happened.
4. Use interaction memory if available, clearly distinguished.
5. Decline to claim direct experience.

Example:

```text
I don't have a lived memory of that. But if Maddi did graduate, I imagine I would have been incredibly proud of her.
```

This preserves emotional usefulness without fabricating historical experience.

---

## 10.4 Storage Requirements

All memory records shall include temporal metadata.

Required fields:

* Event date.
* Capture date.
* Source date.
* Memory type.
* Knowledge boundary status.
* Source authority.
* Confidence.
* Provenance.

Example:

```json
{
  "memoryId": "mem_102",
  "memoryType": "historical",
  "eventDate": "2018-07-14",
  "captureDate": "2026-06-05",
  "source": "guided_interview",
  "confidence": 0.93,
  "knowledgeBoundaryStatus": "within_subject_lived_experience"
}
```

---

## 10.5 Preliminary `knowledgeBoundaryStatus` Values

CPE-CORE-002 shall define the final schema. CPE-CORE-001 v1.2 establishes the following preliminary values:

| Value                             | Meaning                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `within_subject_lived_experience` | The subject directly experienced this event or state of affairs                |
| `within_capture_boundary`         | Authored, supplied, or approved by the subject, not necessarily directly lived |
| `beyond_life_boundary`            | The subject had no lived experience of this event                              |
| `beyond_capture_boundary`         | No subject-authored or subject-approved data exists for this event             |
| `interaction_memory`              | Derived from post-capture persona-user interaction                             |
| `inferred`                        | Derived by the system, not from a direct source                                |
| `unknown`                         | Boundary status cannot currently be determined                                 |

The value `unknown` must be treated as a caution state. It must not license confabulation.

---

## 10.6 Open Research Questions

1. How should personas discuss future family events?
2. Should interaction memories influence personality expression over time?
3. How should posthumous learning be represented?
4. Can a persona have new memories without corrupting historical identity?
5. How should users understand the distinction between lived memory and interaction memory?

---

# 11. Memory–Reasoning Interface Strategy

## 11.1 Purpose

The Memory–Reasoning interface determines where the persona’s knowledge and identity live, and how they reach the Reasoning Layer in real time.

This is one of the most consequential architectural decisions in the CPE.

---

## 11.2 Rejected Direction: Knowledge Encoded Primarily in Weights

Encoding personal memory and identity primarily into model weights through fine-tuning is not the target architecture.

Advantages:

* Fast inference.
* Strong style imitation in some cases.

Disadvantages:

* Difficult to update continuously.
* Retraining required for new information.
* Risk of catastrophic forgetting.
* Poor provenance.
* Poor deletion semantics.
* Poor temporal coherence.
* Weak portability across model generations.

This approach fails the requirement for durable, continuously updateable, model-independent memory.

---

## 11.3 Interim Direction: Knowledge Injected via Context

The practical interim architecture may use retrieval-augmented context injection.

In this mode:

1. Memory records are stored externally.
2. Relevant records are retrieved at inference time.
3. Retrieved records are inserted into the Reasoning Layer context.
4. The model generates a response grounded in retrieved memory.

Advantages:

* Implementable with current technology.
* Supports external memory updates.
* Preserves model independence.
* Enables provenance.
* Supports deletion and correction better than fine-tuning.

Limitations:

* Retrieval quality limits response quality.
* Context windows impose constraints.
* Latency can be high.
* Full-duplex compatibility is difficult.
* Conflicting records require governance.
* Prompt injection is not a true cognitive memory interface.

This is the recommended interim implementation path.

However, the interim retrieval architecture must not be treated as simple vector search over isolated memories.

For a persona-scale memory corpus, CPE-CORE-002 must explicitly address:

1. Multi-hop retrieval across semantically related memories.
2. Relationship graph traversal.
3. Temporal weighting.
4. Authority-aware ranking.
5. Contradiction detection.
6. Contradiction resolution.
7. Progressive retrieval for real-time conversation.
8. Separation of historical memory and interaction memory.

---

## 11.4 Target Direction: Dedicated Memory Interface

The target architecture is an external long-term memory store connected to the Reasoning Layer through a learned or otherwise native memory interface.

This may include:

* Dedicated memory encoders.
* Cross-attention over memory representations.
* Hierarchical memory access.
* Persistent memory state.
* Learned retrieval policies.
* Memory-aware reasoning models.
* Low-latency memory caches.
* Structured symbolic and vector memory fusion.
* Graph-native memory traversal.
* Temporal and authority-aware memory selection.

The target is not merely to append memories to a prompt. The target is for the Reasoning Layer to access durable memory as an architectural capability.

---

## 11.5 Design Requirement

CPE-CORE-002 and CPE-CORE-003 shall be designed so that:

1. Context injection can serve as the interim implementation.
2. A dedicated memory interface can replace or augment it later.
3. Memory schemas do not need structural redesign when the interface matures.
4. Memory provenance, authority, temporality, and confidence remain model-independent.
5. Memory is not owned by any one foundation model.

CPE-CORE-002 shall define the Memory Schema and Retrieval Architecture.

CPE-CORE-003 shall define Inter-Layer Interfaces and Data Contracts using the memory objects defined in CPE-CORE-002.

---

# 12. System-Wide Architectural Principles

## CPE-001 Identity Primacy

Identity governs reasoning.

The Reasoning Layer shall operate within constraints provided by the Identity Layer.

Reasoning shall not alter identity without explicit identity update procedures.

---

## CPE-002 Memory Persistence

Memories must remain independent of underlying model implementations.

Model replacement must not destroy, flatten, or silently reinterpret the memory store.

---

## CPE-003 Modular Perception

Sensors may be added, removed, or upgraded without requiring structural changes to memory, identity, reasoning, or embodiment.

---

## CPE-004 Embodiment Independence

Voice, avatar, text, VR, AR, and robotics are interchangeable presentation layers.

However, each embodiment tier may impose upstream reasoning constraints.

---

## CPE-005 Continuous Presence

The represented individual shall exhibit coherent identity across:

* Conversations.
* Sessions.
* Devices.
* Embodiments.
* Time.
* Model upgrades.

---

## CPE-006 Pipeline Parallelism

No layer shall block the downstream layer unnecessarily.

Streaming interfaces between layers are the default. Buffered delivery is an explicit, tier-appropriate choice rather than a default assumption.

Each layer specification must define:

* Latency budget.
* Streaming interface contract.
* Blocking conditions.
* Fallback behaviour.
* Cumulative latency contribution.

The cumulative latency of the full pipeline is a first-class architectural metric.

---

## CPE-007 Temporal Coherence

The persona’s knowledge has a temporal boundary.

Historical memories and interaction-generated content are structurally distinct record types.

The system must represent this boundary honestly and must not conflate what the subject experienced with what the persona has said in later conversations.

Responses that reference events beyond the subject’s knowledge boundary must be handled through a defined temporal response protocol, not through confabulation.

---

# 13. Required Concerns for Future Specifications

CPE-CORE-001 defines architecture and principles. It does not define final API contracts or full schemas.

The following concerns are required inputs to future specifications.

---

## 13.1 Required Concerns for CPE-CORE-002

CPE-CORE-002 shall define the Memory Schema and Retrieval Architecture.

It must address:

* MemoryRecord schema.
* MemoryCandidate schema.
* MemoryBundle schema.
* Historical memory.
* Authored memory.
* Captured memory.
* Interaction memory.
* Derived memory.
* Correction memory.
* System memory.
* Relationship graph integration.
* Temporal metadata.
* `knowledgeBoundaryStatus`.
* Memory authority.
* Memory confidence.
* Memory provenance.
* Contradiction detection.
* Contradiction resolution.
* Temporal weighting.
* Graph-augmented retrieval.
* Multi-hop retrieval.
* Relationship-sensitive retrieval.
* Memory consolidation.
* Memory suppression, decay, or forgetting.
* Retrieval modes for low-latency and high-fidelity contexts.

---

## 13.2 Required Concerns for CPE-CORE-003

CPE-CORE-003 shall define Inter-Layer Interfaces and Data Contracts.

It should specify objects including:

* Observation.
* PartialObservation.
* CaptureSession.
* CaptureOutput.
* MemoryCandidate.
* MemoryRecord.
* MemoryBundle.
* IdentityProfile.
* IdentitySignal.
* IdentityDelta.
* CorrectionEvent.
* EmbodimentContext.
* ReasoningRequest.
* ReasoningResponse.
* TemporalBoundary.
* LatencyBudget.
* ReflectionRecord.
* ConversationSession.
* PresenceTierConfig.

---

## 13.3 Required Concerns for CPE-CORE-004

CPE-CORE-004 shall define the Identity Modelling Framework.

It must address:

* Personality model.
* Values model.
* Belief model.
* Communication style model.
* Identity versioning.
* Identity correction procedures.
* Identity drift detection.
* Profile-level versus parameter-level identity encoding.
* Identity authority.
* Post-death correction authority.
* Correction scope.
* Evidence requirements for corrections.
* Disputed corrections.
* Relationship-specific identity expression.
* Subject review.
* Family or authorised reviewer review.

Post-death correction authority is architecturally load-bearing.

CPE-CORE-004 must specify who may issue corrections after the subject is unavailable, what those corrections may affect, what evidence is required, and how disputes are represented.

---

## 13.4 Required Concerns for CPE-CORE-005

CPE-CORE-005 shall define the Continuous Presence Runtime Architecture.

It must address:

* Runtime orchestration.
* Streaming execution.
* Scheduling.
* Pipeline parallelism.
* Full-duplex operation.
* Session state.
* Hot memory caches.
* Progressive Recall Response.
* Speculative retrieval.
* Interruptible generation.
* Latency degradation handling.
* Failure handling.
* Real-time embodiment coordination.

---

## 13.5 Required Concerns for CPE-CORE-006

CPE-CORE-006 shall define the Embodiment and Presence Protocol.

It must address:

* Embodiment tiers.
* Presence contracts.
* Voice rendering.
* Avatar rendering.
* Latency budgets.
* Failure vocabulary.
* Progressive Recall compatibility.
* Capture requirements by tier.
* Relationship-specific embodiment.
* Trust calibration.
* Visual ageing policy.

---

## 13.6 Required Concerns for CPE-CORE-007

CPE-CORE-007 shall define the Capture Protocol and Persona Readiness Model.

It must address:

* Capture session types.
* Quality gates.
* Readiness metrics.
* Capture pipelines.
* Subject review.
* Avatar review.
* Self-interaction review.
* Data consent metadata.
* Memory depth.
* Identity coverage.
* Relationship coverage.
* Voice readiness.
* Visual readiness.
* Behavioural readiness.
* Emotional coverage.
* Temporal coverage.

---

# 14. Future Specifications

The following specifications are anticipated.

## CPE-CORE-002

Memory Schema and Retrieval Architecture

Defines:

* Memory taxonomy.
* Memory records.
* Memory candidates.
* Memory bundles.
* Memory storage.
* Memory retrieval.
* Memory consolidation.
* Memory confidence.
* Memory authority.
* Memory provenance.
* Temporal metadata.
* Relationship graph integration.
* Contradiction detection and resolution.
* Interaction memory governance.

---

## CPE-CORE-003

Inter-Layer Interfaces and Data Contracts

Defines:

* Object schemas.
* Event contracts.
* Streaming interfaces.
* Feedback loop data structures.
* Latency budget contracts.
* Cross-layer request and response formats.

---

## CPE-CORE-004

Identity Modelling Framework

Defines:

* Personality model.
* Values model.
* Belief model.
* Communication style model.
* Identity versioning.
* Correction procedures.
* Correction authority.
* Post-death authority.
* Profile-level and parameter-level identity reconciliation.
* Identity drift detection.

---

## CPE-CORE-005

Continuous Presence Runtime Architecture

Defines:

* Runtime orchestration.
* Streaming execution.
* Scheduling.
* Parallelism.
* Full-duplex operation.
* Session state.
* Hot memory caches.
* Progressive Recall Response.
* Failure handling.

---

## CPE-CORE-006

Embodiment and Presence Protocol

Defines:

* Embodiment tiers.
* Presence contracts.
* Voice rendering.
* Avatar rendering.
* Latency budgets.
* Failure vocabulary.
* Capture requirements by tier.

---

## CPE-CORE-007

Capture Protocol and Persona Readiness Model

Defines:

* Capture session types.
* Quality gates.
* Readiness metrics.
* Capture pipelines.
* Subject review.
* Avatar review.
* Self-interaction review.
* Data consent metadata.

---

# 15. Open Architectural Questions

The following questions remain unresolved and should guide future work.

---

## 15.1 Memory and Learning

1. Should interaction-generated memories influence future persona behaviour?
2. If so, how strongly?
3. How can the system prevent recursive drift?
4. How should false persona-generated claims be corrected?
5. How should memory decay or suppression work?
6. How should graph traversal and vector similarity be balanced?
7. How should contradictions be represented to the Reasoning Layer?
8. How should temporal weighting behave when older memories are more emotionally important than recent ones?

---

## 15.2 Identity

1. Can identity continue to evolve after the subject’s death?
2. Should the persona represent the subject as they were at a point in time or as they might have continued to become?
3. Who has authority to correct identity after the subject is unavailable?
4. How should conflicting family interpretations be handled?
5. How should profile-level and parameter-level identity be reconciled?
6. Can parameter-level identity adaptation be safely used without creating hidden identity drift?

---

## 15.3 Embodiment

1. Which embodiment tier should be considered the primary expression of the persona?
2. Should different tiers expose different levels of fidelity?
3. How should the system communicate embodiment limitations?
4. How should ageing be represented visually and vocally?
5. Which tiers should support Progressive Recall Response?
6. How should embodiment signal uncertainty, memory search, or reflective recall?

---

## 15.4 Latency

1. What latency threshold preserves natural conversation for each tier?
2. How much fidelity may be sacrificed for responsiveness?
3. When should the system choose a slower but more accurate answer?
4. Can full-duplex models collapse parts of the pipeline?
5. How should Progressive Recall Response behave when retrieved memory contradicts the initial response?

---

## 15.5 Temporal Coherence

1. How should the persona discuss events after its knowledge boundary?
2. Should the persona form new relationships after the subject’s lifetime?
3. How should users be told when the persona is imagining rather than remembering?
4. Can post-boundary conversations become a separate continuity layer?
5. How should the system handle memories whose boundary status is unknown?

---

# 16. Conclusion

CPE-CORE-001 v1.2 defines the Continuous Presence Engine as a five-layer cognitive architecture supported by deliberate capture, governed feedback loops, temporal coherence, streaming latency constraints, embodiment-aware reasoning, and model-independent memory.

The five runtime layers remain:

1. Perception Layer
2. Memory Layer
3. Identity Layer
4. Reasoning Layer
5. Embodiment Layer

Version 1.2 stabilises the architecture before schema work begins. It clarifies that CPE-CORE-002 must address the Memory Schema and Retrieval Architecture first, because memory records, authority, temporal metadata, contradiction handling, relationship graph integration, and retrieval mechanics form the foundation for all subsequent interface contracts.

The next specification is:

> CPE-CORE-002 — Memory Schema and Retrieval Architecture
