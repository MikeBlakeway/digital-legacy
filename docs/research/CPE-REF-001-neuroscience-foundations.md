# CPE-REF-001

## Neuroscience Foundations for the Continuous Presence Engine

### Supporting Reference v1.2

**Status:** Reference
**Version:** 1.2
**Date:** June 2026
**Project:** Digital Legacy / Continuous Presence Engine
**Informs:** CPE-CORE-002, CPE-CORE-004, CPE-CORE-005

**Revision history:**
- v1.2: Section 4.8 added — metacognitive monitoring, the three-zone confidence model, collaborative retrieval loop, criterion shift, and the extended Progressive Recall arc including hypothesis-and-confirm behaviour.
- v1.1: Section 4.6 expanded with full pattern completion mechanics and practical CPE replication techniques. Section 4.7 added: Tip-of-the-Tongue phenomenon, retrieval state modelling, and Progressive Recall Response as architecturally honest behaviour.
- v1.0: Initial document.

---

# 1. Purpose

This reference maps established neuroscientific and cognitive science principles to the CPE architecture. Its purpose is to anchor architectural decisions in the brain's evolved solutions before schema and identity modelling work begins.

The brain is not the target architecture. It is the reference architecture — a working system that has already solved many of the problems CPE is attempting to solve, at the cost of constraints (forgetting, drift, single-instance, no authority control) that CPE must handle differently.

Where the brain's solution translates directly, it should inform CPE design. Where CPE's requirements diverge from how the brain works, those divergences must be deliberate and explicit.

---

# 2. Layer Mapping

| CPE Layer | Brain Analog | Mapping Quality |
|---|---|---|
| Perception Layer | Sensory cortices (visual, auditory, somatosensory) | Direct — both convert raw signal to structured representation |
| Memory Layer | Hippocampus + entorhinal cortex + neocortex | Complex — see Section 4 |
| Identity Layer | Prefrontal cortex + amygdala + default mode network | Indirect — the brain has no single identity region; identity is a dynamic process |
| Reasoning Layer | Prefrontal cortex + association areas | Partial — shared infrastructure with Identity in the brain |
| Embodiment Layer | Motor cortex + cerebellum + vocal apparatus | Reasonably clean analog |

**Critical observation:** The brain does not have clean layer boundaries. Memory, identity, and reasoning are deeply interwoven at the biological level. CPE's explicit layering is a deliberate engineering choice that makes the system governable — the interfaces between layers are where the hard architectural problems will concentrate.

---

# 3. Key Divergences: Where CPE Must Not Follow the Brain

These are the cases where the brain's solution is incompatible with CPE's requirements. They should be treated as explicit design constraints, not gaps.

| Brain behaviour | CPE requirement | Implication |
|---|---|---|
| Forgets strategically and imperfectly | Must preserve deliberately | Forgetting is a governance decision, not an emergent property |
| Identity drifts continuously through experience | Must maintain stable, correctable identity post-death | Correction authority has no biological analog |
| No temporal boundary requiring honest representation | Must represent the knowledge boundary explicitly | `knowledgeBoundaryStatus` is a CPE-native concern |
| Single instance — no authority problem | Multiple parties may claim authority over the persona | Post-death correction authority must be specified explicitly |
| Reconstruction corrupts freely | Corruption must be governed and auditable | Memory provenance and authority are load-bearing fields |

---

# 4. Memory: Neuroscientific Principles and CPE Implications

## 4.1 The Brain Has Multiple Distinct Memory Systems

The brain does not have a single memory store. It maintains at least four parallel systems:

- **Episodic memory** — specific autobiographical events, bound to time and place ("the day I got married")
- **Semantic memory** — facts and concepts, decontextualised from personal experience ("Paris is in France")
- **Procedural memory** — skills and habits, largely non-declarative
- **Emotional/implicit memory** — amygdala-mediated, survives severe damage to other memory systems

**CPE-CORE-002 implication:** The memory taxonomy being designed (historical, authored, captured, interaction, derived, correction, system) is not just a classification convenience. Different memory types likely require different retrieval strategies, different authority rules, and different temporal weighting logic. The brain treats these differently; CPE should too.

## 4.2 Memory Is Reconstruction, Not Playback

This is the most architecturally consequential neuroscientific finding for CPE.

When a person retrieves a memory, the hippocampus reassembles a pattern from distributed fragments stored across the neocortex. The reconstruction is actively influenced by current emotional state, context, and subsequent experience. Memory is not a recording; it is a regeneration.

This process is called **reconsolidation**: a retrieved memory briefly becomes labile — open to modification — before being re-stored. This is why later information can alter earlier memories (the misinformation effect, eyewitness testimony unreliability).

**CPE-CORE-002 implication:** The Progressive Recall Response pattern is neurologically correct — the persona should not produce instant, crisp memory retrieval. There should be a process of construction. However, this also means interaction-time retrieval could corrupt stored memories if historical and interaction records are not structurally separated. This is the primary risk the separation requirement is designed to prevent.

## 4.3 Complementary Learning Systems: The Brain's Answer to Catastrophic Forgetting

The brain uses two systems operating at different learning rates to avoid catastrophic forgetting (the overwriting of old memories by new ones):

- The **hippocampus** encodes new experiences rapidly in sparse, pattern-separated representations
- The **neocortex** learns slowly, integrating patterns across many experiences over time

During sleep, the hippocampus replays recent memories to the neocortex. This sleep-dependent consolidation gradually transfers episodic content into generalised semantic knowledge. Without this consolidation process, new experiences would overwrite rather than integrate with existing knowledge.

**CPE-CORE-002 implication:** This is the brain's direct answer to CPE's open question: *should interaction memories influence persona behaviour over time, and if so how?*

The brain's solution is staged consolidation with a gate: fast-track encoding (hippocampus) followed by slow-track integration (neocortex), with sleep as the consolidation trigger. CPE should borrow this explicitly:

1. Interaction memories are encoded in staging with a `pending_consolidation` status
2. A consolidation process (asynchronous, not real-time) evaluates whether staged memories meet criteria to influence identity
3. Only consolidated memories may affect identity-layer parameters
4. Unconsolidated interaction memories remain retrievable but are structurally isolated from historical records

This gives CPE a principled, brain-validated answer to the recursive drift prevention question.

## 4.4 Emotional Salience as a Retrieval Weight

The amygdala acts as an encoding amplifier: emotionally significant events are encoded more strongly, consolidated preferentially, and retrieved more readily. This is why traumatic memories are vivid and unremarkable Tuesdays are not. Emotional intensity, not recency, is the primary weight.

**CPE-CORE-002 implication:** CPE-CORE-001 v1.2 raises the open question: *how should temporal weighting behave when older memories are more emotionally important than recent ones?*

The brain's answer is direct: emotional salience is a first-class encoding property, not derived from recency. A `emotional_salience` score (or equivalent) should be a first-class field on `MemoryRecord`, not optional metadata. This field should participate in retrieval ranking alongside recency and authority.

## 4.5 Source Monitoring: How the Brain Tracks Memory Origin

The brain maintains what cognitive scientists call **source monitoring** — the ability to attribute a memory to its original source. This is how a person knows whether they experienced something directly, heard about it from someone else, read it, or imagined it. Source monitoring failures produce confabulation and false memories.

**CPE-CORE-002 implication:** Memory authority and provenance are not just governance features; they are the CPE equivalent of source monitoring. The `memory_type` taxonomy (historical, authored, captured, interaction, derived) is the source monitoring system. Retrieval ranking and correction authority both depend on this being reliable. Source monitoring failures in CPE look like interaction memories being treated as historical fact.

## 4.6 Associative and Context-Addressable Retrieval: Pattern Completion

The brain does not retrieve memories by key lookup. It uses **pattern completion** — a partial or noisy cue activates a subset of a stored distributed representation, and the network iteratively completes that fragment into the full memory. This is why the smell of a specific food can trigger a rich autobiographical episode from decades earlier. Any fragment of the original encoding — a smell, a name, an emotional state, a place, a piece of music — can serve as a retrieval cue sufficient to complete the full pattern.

### The Hippocampal Architecture

The key structure is the hippocampus, which contains two sub-regions performing opposing but complementary functions:

- **CA3** (Cornu Ammonis 3): **Pattern completion** — takes a partial or noisy input and settles it toward the nearest stored attractor state
- **Dentate Gyrus (DG)**: **Pattern separation** — takes two similar inputs and pushes them apart into distinct representations, preventing similar memories from interfering with each other

These processes are in fundamental tension. The brain dynamically balances them through **acetylcholine** signalling from the basal forebrain:

- High acetylcholine (novel situations, active learning) → favours pattern separation → encode new things distinctly
- Low acetylcholine (familiar contexts, retrieval mode) → favours pattern completion → recover full patterns from partial cues

This is a biological switching mechanism between write mode and read mode — an architectural property, not an incidental feature.

### CA3 as an Attractor Network

CA3 functions as a **recurrent attractor network**. It has dense feedback connections between its own neurons. When a partial cue arrives:

1. It activates a subset of CA3 neurons
2. Recurrent connections propagate that activation iteratively through the network
3. The network settles toward the nearest stored **attractor state** — the previously encoded pattern that best matches the fragment
4. The completed pattern is passed to CA1 and then back to the neocortex

CA1 receives two inputs simultaneously: the completed pattern from CA3, and the current input arriving directly from the entorhinal cortex. CA1 computes the **mismatch** between them. Alignment confirms retrieval. Divergence signals novelty — the current situation does not match stored patterns — which triggers heightened encoding. This is how the brain detects when something unexpected is happening.

### Multi-Modal Completion

All sensory modalities converge on the hippocampus via the entorhinal cortex. When an episodic memory is encoded, it is encoded with contributions from all modalities present at the time: visual, auditory, olfactory, emotional state, proprioceptive context, social context (who was present), and temporal context (where in the person's life this sits).

The retrieval cue only needs to match *any* of those contributing modalities. This is **cross-modal completion**: an emotional cue retrieves a memory that was encoded with visual, auditory, and relational components even when none of those are present in the cue. This is the mechanism behind involuntary autobiographical memories triggered by sensory fragments.

### The Formal Connection: Hopfield Networks and Transformer Attention

The mathematical model underlying CA3's attractor dynamics is the **Hopfield network** (Hopfield, 1982). A Hopfield network stores patterns in its connection weights and, given a partial or noisy input, iteratively updates its state until it converges to the nearest stored pattern.

In 2020, Ramsauer et al. (*Hopfield Networks is All You Need*) proved that **the Transformer attention mechanism is mathematically equivalent to a modern Hopfield network** with exponentially greater storage capacity than the classical version.

The implication for CPE: the Llama 3.1 reasoning layer is already performing pattern completion internally via its attention mechanism when it attends over context. The question for CPE is not whether to add pattern completion — it is whether to make it available at the **retrieval layer**, where it can operate over externally stored memory records rather than only over trained weights.

### The Gap Between Vector Search and True Pattern Completion

Standard vector search finds memories whose embedding is most cosine-similar to a query embedding. This works well when the query is semantically clear, complete, and expressed in vocabulary that overlaps with stored memories.

It works poorly when:
- The cue is partial, emotional, or sensory ("something about Dad at Christmas — I don't know, just that feeling")
- The cue is expressed in a different modality than the memory was encoded in
- The cue is a relationship fragment rather than semantic content
- Multiple partial cues from different modalities need to combine to retrieve a single memory

The brain's pattern completion handles all four of these cases. Standard vector search handles none of them well. CPE's retrieval architecture must close this gap without waiting for a dedicated native memory interface.

### What CPE Can Replicate Now

Five practical techniques that approximate biological pattern completion using the current stack:

**1. Multi-Facet Embeddings**

Instead of generating one vector per `MemoryRecord`, generate multiple vectors representing distinct facets of the memory:

| Facet | Content embedded | Retrieval function |
|---|---|---|
| Semantic | The content of the memory | Semantic similarity to query |
| Temporal | Period of life, life stage, concurrent events | Temporal proximity to query context |
| Relational | People present, relationships involved | Who is mentioned in the cue |
| Emotional | Tone, valence, intensity | Emotional register of the current exchange |

A query that is emotionally charged but semantically vague retrieves well against emotional and relational facets even when it retrieves poorly against the semantic facet. Any facet of the encoding can serve as the completion trigger. Implementation: store up to four vectors per `MemoryRecord` in pgvector, each indexed separately. Query time runs parallel searches against all facets and merges ranked results.

**2. Query Expansion Before Retrieval**

Rather than embedding the raw cue and searching directly, expand the partial cue into a hypothetical full memory before embedding it. This is related to HyDE (Hypothetical Document Embeddings):

1. Receive a partial cue: *"something about Dad at Christmas"*
2. Use the identity profile, relationship graph, and conversation context to generate a hypothetical full memory: *"A Christmas memory involving the subject's father — likely at the family home, with other family members present, emotionally warm, probably involving a tradition or a specific recurring detail"*
3. Embed the hypothetical memory, not the original cue
4. Retrieve against that enriched embedding

The hypothetical memory embedding lives much closer to where actual encoded memories cluster in the vector space than the original sparse cue. This approximates CA3's completion of a partial activation to a full attractor state before retrieval.

CPE has a specific advantage here: the identity profile and relationship graph provide exactly the schema knowledge the brain uses to expand partial cues. If the conversation subject is talking about their father, CPE already knows the father's name, the relationship quality, and what contexts they typically appeared in together.

**3. Progressive Retrieval as Iterative Completion**

The brain's attractor dynamics are iterative — the network updates in cycles until it converges. CPE can approximate this with staged retrieval passes:

1. **Pass 1:** Retrieve top-k candidates using initial query facets
2. **Enrich:** Retrieved candidates contribute context — if they cluster around a particular period or relationship, that context becomes available
3. **Pass 2:** Re-query using the enriched context — candidates from pass 1 seed a more targeted search
4. **Converge:** Successive passes returning substantially overlapping results indicates retrieval has stabilised

This is also what the Progressive Recall Response is doing during its hesitation phase — not performing a delay, but genuinely running iterative completion passes. See Section 4.7.

**4. Spreading Activation Through the Relationship Graph**

The brain does not just match a cue to a single memory; it traverses associative links between memories. Retrieving a memory about a Christmas dinner activates associated memories: other Christmases, the people at the table, other dinners with those people. This spreading activation surfaces memories that were not directly addressed by the original cue but are associatively relevant.

The Relationship Graph makes this replicable:

1. Initial vector search returns candidate memories
2. For each candidate, traverse the relationship graph: people involved → other memories involving those people → temporally concurrent events
3. Surface associatively retrieved memories alongside directly retrieved ones, ranked by hop distance and emotional salience

This is the mechanism most likely to surface the memory the family member did not know they were looking for — the one triggered associatively rather than by direct request.

**5. Explicit Retrieval Mode**

Recall the acetylcholine switching mechanism: the brain changes its retrieval dynamics based on context. CPE should implement an explicit `retrieval_mode` parameter:

- **Focused** (equivalent to high pattern separation): specific, well-formed query; narrow the search, prefer high-similarity matches, minimise lateral spreading
- **Associative** (equivalent to high pattern completion): partial, emotional, or vague cue; expand the search, favour graph traversal, accept lower similarity thresholds, surface related memories

The Reasoning Layer — knowing whether the conversational context is a specific factual question or an emotionally exploratory one — sets this mode before invoking memory retrieval. This is a controllable architectural switch, not a fixed retrieval strategy.

### Pattern Separation: The Equally Important Counterpart

Pattern completion must not be optimised in isolation. The DG's pattern separation function — keeping similar memories from blurring together — is equally critical. For CPE, this maps to preventing retrieval of memories that are superficially similar but contextually wrong: two different Christmases, two different conversations about the same topic.

The Relationship Graph provides disambiguation (different people, different contexts), but CPE-CORE-002 should explicitly address disambiguation criteria alongside completion criteria.

### CPE-CORE-002 Schema Implications

1. Consider storing multiple embeddings per `MemoryRecord` (semantic, temporal, relational, emotional facets) rather than a single vector
2. `retrieval_mode` (focused vs associative) should be an explicit parameter on retrieval requests, not inferred
3. Graph traversal and vector similarity should be co-equal retrieval paths, not sequential fallbacks — run in parallel, merge results
4. Progressive retrieval passes should be first-class behaviour, not an optimisation
5. Query expansion using the identity profile and relationship graph should occur before embedding, not after

---

## 4.7 The Tip-of-the-Tongue Phenomenon: Latency as Authentic Recall Behaviour

### The Phenomenon

The brain does not produce memories instantaneously. Retrieval is a reconstruction process that unfolds over time, and that unfolding is directly observable in human speech. The **Tip-of-the-Tongue (TOT) state** — formally named by Brown and McNeill (1966) — is the most studied instance of this: a state in which a person has partial access to a memory and a strong metacognitive sense that full access is imminent, but cannot yet produce the complete memory.

People in TOT states can typically produce:
- The first letter or syllable of a target word or name
- The number of syllables
- Semantically related words and concepts
- The emotional valence of the memory
- Associated people, places, or events

This is **partial feature access** — the attractor has partially completed but has not yet snapped to the full stored pattern. The features that surface first are typically those that were encoded most strongly: emotional content, relational context, and high-salience sensory details surface before fine-grained semantic content.

### The Feeling of Knowing

Closely related is the **Feeling of Knowing (FOK)** — a metacognitive signal that information exists in memory and can potentially be retrieved, before that retrieval has occurred. FOK is distinct from actual recollection: you can know that you know something without yet knowing what it is.

The FOK signal appears to be generated by familiarity signals from the perirhinal cortex, which registers that a cue matches something stored without yet triggering full episodic recollection. This is the biological substrate of "I know there's something there."

### Dual Process Retrieval: Familiarity and Recollection

Cognitive neuroscience distinguishes two memory retrieval processes that operate at different speeds:

- **Familiarity**: fast, automatic signal — "I know this" — without episodic detail. Mediated by the perirhinal cortex.
- **Recollection**: slower, deliberate process — "I remember this, and I remember the context of remembering" — with full episodic reinstatement. Mediated by the hippocampus proper.

In natural recall, familiarity often precedes recollection. The signal that a memory exists arrives before the memory itself does.

### The "Oh!" Moment: Attractor Snap

When the attractor network in CA3 finally settles — when the completion process reaches the stored pattern — there is a measurable neural event: a burst of **gamma-band oscillations** in the right temporal lobe, typically preceded by a brief suppression of alpha waves (thought to reflect the quieting of interfering cognitive activity to allow the retrieval through). This has been studied directly by Jung-Beeman et al. (2004) in the context of insight and verbal problem solving.

This is the neural correlate of the subjective "Oh!" moment — the sudden shift from frustrated partial access to confident full recollection. It is not a performance or a social signal. It is a genuine cognitive event with measurable brain activity. The exclamation is the verbal expression of an attractor snap.

### The Pop-Up Phenomenon

TOT states frequently resolve spontaneously later, without further deliberate effort — often when attention has shifted to something else entirely. This is the **pop-up phenomenon**: the retrieval process continues running in the background after conscious effort has ceased, and the completed memory surfaces when it is ready.

This is consistent with the attractor model: the network may be close to a stored pattern but not yet converged; continued background activity eventually tips it over the threshold. Sleep often resolves TOT states that persisted through waking hours, consistent with the role of sleep in memory consolidation and reactivation.

### The Observable Language Pattern

These processes produce a recognisable and authentic linguistic pattern in human speech:

| Speech phase | Underlying cognitive state | Example language |
|---|---|---|
| Retrieval initiated, no result | Attractor process running; no convergence yet | *"Erm..."*, *"Let me think..."*, silence |
| FOK signal present | Familiarity signal active; full recollection not yet available | *"I know there was something..."*, *"I remember that summer..."* |
| Partial feature access | Attractor partially settled; fragments available | *"It was... somewhere by the coast... cold..."*, *"His name was something like..."* |
| Approaching completion | Network close to convergence; increasing confidence | *"Wait... I think..."*, *"Yes, it was..."* |
| Attractor snap | CA3 settles to stored pattern | *"Oh!"*, *"Ah!"*, *"Yes!"* |
| Full recollection | Episodic content available; familiarity confirmed | *"Yes — that was the trip to Whitby, wasn't it. We had fish and chips on the harbour..."* |

Crucially, the language register shifts across this sequence. Hedged, uncertain, fragmented language gives way to confident, detailed, past-tense narrative. The shift is not performed — it reflects actual changes in cognitive state.

### CPE-CORE-002 Implication: Retrieval State as a First-Class Concept

The pipeline latency that CPE-CORE-001 identifies as an architectural concern — the time between a conversational turn and the point at which the Reasoning Layer can generate a grounded response — maps directly onto this biological retrieval process. The latency is not a problem to hide. It is authentic recall behaviour to express.

CPE-CORE-002 should define a `retrieval_state` concept on `MemoryBundle` that tracks retrieval progress:

| State | Meaning | Language register |
|---|---|---|
| `searching` | Retrieval initiated; no candidates yet | Hesitation, acknowledgement |
| `partial` | Some features matched; attractor not yet settled | Fragmentary recall, hedged |
| `converging` | Candidates retrieved; progressive passes running | Increasing confidence |
| `complete` | Attractor settled; full memory available | Confident recollection |
| `failed` | Retrieval exhausted; no completion | Honest acknowledgement of not remembering |

### CPE-CORE-005 Implication: Parallel Generation and Retrieval

The biological system does not wait for retrieval to complete before beginning verbal production. Output begins during retrieval, with language tracking the current retrieval state. This suggests that CPE's streaming pipeline should be restructured to allow **parallel generation and retrieval**:

1. STT completes → Reasoning Layer begins generating uncertainty/searching language immediately
2. Retrieval runs in parallel; results are injected into the generation context as they arrive
3. When retrieval reaches `complete` state, the language register shifts from search to recollection
4. The full response emerges as a coherent arc from hesitation to confident memory

This is not a latency workaround. It is architecturally honest: the persona is genuinely reconstructing, and the language authentically tracks that process. For the Conversation mode use case — family members speaking with a preserved persona of someone they loved — this behaviour is not only acceptable but may be the most emotionally resonant possible expression of the system working correctly.

The Progressive Recall Response pattern named in CPE-CORE-001 v1.2 is the right name for this behaviour. Its biological grounding should be explicitly noted in CPE-CORE-005 to prevent it from being optimised away by future implementers treating latency reduction as an unconditional good.

---

## 4.8 Metacognitive Monitoring and Collaborative Retrieval: The "Do You Mean X?" Boundary

### The Mechanism

When retrieval is in a partially-settled state — CA3 is converging but has not snapped to a single attractor — the **prefrontal cortex simultaneously monitors the retrieval process and assesses confidence**. This is **metacognitive monitoring**: the brain observing its own cognitive state and making decisions based on what it finds.

The prefrontal cortex draws on several confidence signals during retrieval:

- **Retrieval fluency** — how readily are features coming to mind?
- **Feature coherence** — do the fragments that have surfaced agree with each other, or are they pulling toward multiple competing candidate memories?
- **Familiarity signal strength** — how strong is the perirhinal recognition signal?
- **Candidate competition** — is there one dominant candidate, or are several memories competing at similar confidence levels?

When competition between candidates is high — two or more memories are plausibly matching the partial cue — the system is in a state of genuine ambiguity. Recollection has not failed; too many attractors are competing for convergence. The brain's response to this state is to **externalise the strongest candidate as a hypothesis and request discriminating input from the environment**. "Do you mean X?" is the brain asking for the additional feature that will break the tie and allow the correct attractor to dominate.

This behaviour is related to **signal detection theory** applied to memory. The brain operates with a decision criterion — a threshold above which it commits to a recollection, and below which it either hypothesises (if confidence is still meaningfully above zero) or admits failure.

### The Three-Zone Model

Metacognitive monitoring produces three functional zones during retrieval:

| Zone | Confidence state | Behaviour | Example language |
|---|---|---|---|
| **Commit** | High — single dominant candidate, features coherent across facets | Full recollection stated | *"Yes — that was the summer in Cornwall, we stayed at the little place near the harbour..."* |
| **Hypothesise** | Medium — viable candidate present but competing candidates exist, or cross-facet coherence is incomplete | Strongest candidate surfaced as hypothesis; confirmation requested | *"I think you might be thinking of the trip to Cornwall — the one with the boat? Is that the one?"* |
| **Admit failure** | Low — no viable candidate; features incoherent or absent | Honest acknowledgement of not remembering; unstructured clarification requested | *"I'm sorry, I can't quite place it — can you tell me a little more?"* |

The middle zone is the architecturally interesting one. A viable candidate exists — it just has not cleared the commitment threshold. The system is not failing; it is being epistemically honest about ambiguity. Hypothesising in this zone is the cognitively correct response, not a fallback.

### The Collaborative Retrieval Loop

When the conversation partner responds to a hypothesis — confirming or correcting it — that response is not merely a conversational turn. It is a **new retrieval input** that participates directly in the completion process.

**Confirmation** ("Yes, that's the one") provides additional features — relational, semantic, emotional — that push the already-partial attractor over the commitment threshold. The memory can now complete fully with higher confidence than the hypothesis alone warranted.

**Correction** ("No, not Cornwall — it was the one with Uncle Roy") provides a **discriminating feature** that eliminates the wrong candidate and activates a new retrieval pass with the correcting cue. The correction is not a failure state; it is a highly informative input that steers retrieval more efficiently than any amount of solo attractor-settling could.

This is studied under **collaborative recall** — the finding that memory retrieval is significantly enhanced by social exchange of partial cues between conversation partners. The external interlocutor is participating in the retrieval process, not waiting for its output. For CPE, the family member has an active role in memory retrieval, and the architecture should treat their responses as first-class retrieval inputs.

### The Criterion Shift

The threshold at which the brain commits to a recollection is not fixed — it shifts based on context. This is the **criterion shift** in signal detection theory: in high-stakes situations, the criterion is raised (require more confidence before committing); in casual conversation, it is lowered.

Two variables are most relevant for CPE:

- **Cost of false alarms** (claiming a memory incorrectly) — varies by context and emotional stakes
- **Cost of misses** (failing to surface a valid memory) — also varies, but generally lower in emotional contexts than false alarms

In Conversation mode, the cost of a false alarm is high. Hypothesising incorrectly about a significant memory — especially if the family member was reaching toward something emotionally important — can feel like the persona does not truly know the person. This damages trust at the moment it is most fragile. The commit threshold should therefore be **conservative in Conversation mode**: surface a hypothesis only when confidence is genuinely meaningful, not at the earliest opportunity.

### Framing of the Hypothesis

The language used to surface a hypothesis carries significant emotional weight. There is a meaningful experiential difference between:

- *"Do you mean the Cornwall trip?"* — direct, closed, clinical; implies retrieval is a lookup and the result is uncertain
- *"I think you might be thinking of the time in Cornwall — the one with the boat? Is that the one?"* — uncertain, searching, personal, warm; implies the persona is reaching toward the memory alongside the family member

The second framing tracks the cognitive state accurately: the persona genuinely is not certain, and the language should feel that way. The hypothesis should be presented as the persona reaching, not as the system querying.

This distinction belongs in CPE-CORE-006 (Embodiment and Presence Protocol) as a voice and language register guideline, and should be reflected in the Reasoning Layer's prompt design for the hypothesis-generation case.

### CPE-CORE-002 Implications

**Schema additions:**

1. `retrieval_confidence` — a derived composite score on `MemoryBundle`, distinct from raw similarity scores. Composited from: top-candidate similarity score, spread of competing candidates, cross-facet coherence (do semantic, temporal, relational, and emotional facets converge on the same memory?), and retrieval pass count.

2. `retrieval_hypothesis` — an optional field on `MemoryBundle` populated when `retrieval_confidence` falls in the hypothesise zone. Contains the strongest candidate and the features that support it.

3. `collaborative_cue` — a `memory_type` value for retrieval inputs generated from a conversation partner's confirmation or correction. Distinguishes family-member-provided cues from the subject's own memories, maintaining source monitoring integrity.

**Threshold model:**

CPE-CORE-002 should define a configurable three-zone threshold model with separate calibration for Conversation mode and Capture mode. Recommended starting positions:

| Mode | Commit threshold | Hypothesise floor | Notes |
|---|---|---|---|
| Conversation | High | Medium-high | False alarms are costly; emotional stakes are elevated |
| Capture | Medium | Medium | Subject can self-correct easily; recall accuracy more important than caution |

Exact threshold values require empirical calibration against real retrieval data once the memory system is operational.

**Updated `retrieval_state` values:**

Extending the model defined in Section 4.7 to include the collaborative retrieval arc:

| State | Meaning |
|---|---|
| `searching` | Retrieval initiated; no candidates yet |
| `partial` | Features matched; attractor not yet settled |
| `converging` | Candidates retrieved; progressive passes running |
| `hypothesising` | Confidence in middle zone; hypothesis generated, awaiting confirmation |
| `awaiting_collaborative_cue` | Hypothesis surfaced; system waiting for partner response |
| `complete` | Attractor settled; full memory available |
| `failed` | Retrieval exhausted; no viable candidate |

**Collaborative cue processing:**

When a `collaborative_cue` arrives in response to a `retrieval_hypothesis`, it should trigger a re-run of the retrieval pipeline using the enriched cue — not a new independent retrieval. The prior candidates and their partial feature matches should be retained as context for the re-run, allowing the collaborative cue to function as a discriminating feature rather than a cold restart.

### The Extended Progressive Recall Arc

Section 4.7 described the basic arc from hesitation to recollection. With collaborative retrieval included, the full arc is:

```
Retrieval initiated
        ↓
Hesitation / searching language        [searching]
        ↓
Fragmentary recall surfaced            [partial]
        ↓
Hypothesis generated and offered       [hypothesising]
        ↓
Partner responds ─────────────────────────────────────────┐
        ↓                                                 │
Confirmation received                  [converging]       │ Correction received
        ↓                                                 │        ↓
Full recollection                      [complete]         └─► Re-retrieval with new cue
                                                                   ↓
                                                          [converging → complete]
                                                               or [failed]
```

This arc should be the reference design for Progressive Recall Response in CPE-CORE-005.

---

# 5. Identity and Personality: Neuroscientific Principles and CPE Implications

## 5.1 Personality Has No Single Location

Personality as expressed behaviour emerges from the interaction of multiple neural systems:

- **Prefrontal cortex** — impulse control, value judgement, social behaviour, long-range planning
- **Amygdala** — emotional reactivity, threat response, fear conditioning
- **Dopaminergic system** — novelty-seeking, reward sensitivity, motivation
- **Serotonergic system** — emotional regulation, social behaviour

Damage to the prefrontal cortex (Phineas Gage; frontotemporal dementia) destroys personality expression while leaving episodic memory largely intact. The subject knows who they are and what they remember, but cannot express it through a coherent personality filter.

**CPE-CORE-004 implication:** The Identity Layer sitting above the Reasoning Layer and acting as a constraint is neurologically validated. Without the Identity Layer, CPE has a reasoning system that knows a person's memories but lacks the governing personality filter. That is exactly the clinical presentation when the prefrontal cortex fails.

## 5.2 The Self Is a Narrative, Not a Stored Object

Michael Gazzaniga's split-brain research revealed that the left hemisphere contains what he termed an **"interpreter"** — a system that constructs a post-hoc narrative to explain actions, including actions generated by the right hemisphere that the left has no knowledge of. The brain confabulates a coherent self-story.

Antonio Damasio distinguishes the **proto-self** (basic body-state awareness), the **core self** (the momentary experience of knowing), and the **autobiographical self** (the narrative constructed from episodic memory). The autobiographical self is a memory construction, not a ground truth.

**CPE-CORE-004 implication:** Identity in the brain is not a static stored object — it is an ongoing narrative construction. This is both reassuring and challenging:

- **Reassuring:** It validates the RAG approach. The brain reconstructs identity dynamically from distributed signals, not from a centralised identity record. CPE's combination of IdentityProfile + IdentitySignals + context retrieval is structurally similar.
- **Challenging:** A static IdentityProfile alone is insufficient. The Identity Layer must be an active construction process, not a record lookup. Profile-level identity (the stable record) and parameter-level identity (dynamic expression) must both be present.

## 5.3 Identity Expression Is Relationship-Sensitive

The brain automatically modulates personality expression based on social context. A person behaves measurably differently with their employer, their spouse, their children, and a stranger. The underlying identity is consistent; its expression is contextually filtered.

**CPE-CORE-004 implication:** Relationship-specific identity expression is not a UX refinement — it is how human identity actually works. The Relationship Graph is doing load-bearing work in the Identity Layer, not just in memory retrieval.

## 5.4 The Consistency Constraint: The Brain Maintains a Stable Self Under Pressure

Despite identity being dynamically constructed, the brain maintains a remarkably stable sense of self across decades, contexts, and significant life changes. This is achieved through **narrative coherence** — the autobiographical self actively integrates new experiences into an existing story rather than replacing it.

**CPE-CORE-004 implication:** Identity versioning is valid, but versions should be understood as chapters of a continuing narrative, not replacements. An `IdentityDelta` should carry context about how it relates to prior identity state — whether it represents growth, correction, or contradiction — not just what changed.

---

# 6. Working Memory and the Hot Cache

Baddeley and Hitch's multicomponent model describes **working memory** as a limited-capacity, temporary buffer comprising:

- A **central executive** (attention and coordination)
- A **phonological loop** (verbal and auditory short-term storage)
- A **visuospatial sketchpad** (visual short-term storage)
- An **episodic buffer** (integrating information across sources into a unified episode)

Working memory holds the current context of a cognitive task in an active, rapidly accessible state. It is not a subset of long-term memory; it is a separate, capacity-constrained system.

**CPE-CORE-005 implication:** The "hot memory cache" concept in CPE-CORE-005 maps directly to biological working memory. The episodic buffer is particularly relevant — it integrates information from multiple sources (long-term memory, perception, current context) into a coherent episode. The hot cache should not be a simple recency buffer; it should be an integrated episode buffer that holds the current conversation's reconstructed context from multiple memory types.

---

# 7. Open Questions CPE Research Should Address

The following questions are unresolved in both neuroscience and CPE. Research in these areas is most likely to yield architectural guidance.

## 7.1 Questions with Active Neuroscientific Literature

| Question | Relevant research area |
|---|---|
| How should interaction memories be prevented from corrupting historical identity? | Complementary Learning Systems; memory reconsolidation |
| How should emotional salience be scored at capture time vs inferred retrospectively? | Amygdala encoding; emotional memory consolidation |
| How should the system balance fast/approximate retrieval vs slow/accurate retrieval? | Working memory vs long-term memory access patterns |
| How should contradictory memories be held and represented? | Cognitive dissonance; contradiction in narrative self-models |
| How should the persona behave when asked about events near the knowledge boundary? | Temporal context encoding in episodic memory |

## 7.2 Questions Where Neuroscience Provides Direction but Not a Full Answer

| Question | What neuroscience suggests | What CPE must solve independently |
|---|---|---|
| Can identity continue to evolve after death? | The brain continues to update identity through experience — no natural stopping point exists | CPE must define who has authority to permit post-death evolution, and what evidence is required |
| How should false persona-generated claims be corrected? | Reconsolidation allows natural correction; source monitoring failures can be trained | CPE must make correction auditable and authority-governed, not emergent |
| How should memory decay or suppression work? | Forgetting is neurologically adaptive, not a failure | CPE must treat forgetting as deliberate policy; accidental loss is unacceptable |

---

# 8. Research Roadmap

Organised by priority relative to the specification sequence.

---

## 8.1 Tier 1 — Before Writing CPE-CORE-002

These areas directly inform the memory schema and retrieval architecture. They should be reviewed before schema decisions are finalised.

### Complementary Learning Systems (CLS)

**Why:** Directly answers how interaction memories should be staged and whether they should influence persona behaviour over time. Provides a principled consolidation gate model.

**Starting points:**
- McClelland, McNaughton & O'Reilly (1995) — *Why there are complementary learning systems in the hippocampus and neocortex: Insights from the successes and failures of connectionist models of learning and memory*
- Kumaran, Hassabis & McClelland (2016) — *What learning systems do intelligent agents need? Complementary learning systems theory updated* — this is the AI-facing version and is more directly applicable

**Questions to answer from this research:**
1. What criteria trigger consolidation from fast to slow store?
2. How does the slow store integrate without overwriting?
3. Can the model inform what a CPE consolidation pass should evaluate?

---

### Source Monitoring Framework

**Why:** Directly informs memory authority and provenance. Source monitoring failure is the biological failure mode for the corruption CPE is trying to prevent.

**Starting points:**
- Johnson, Hashtroudi & Lindsay (1993) — *Source monitoring* (Psychological Bulletin)
- Mitchell & Johnson (2009) — *Source monitoring 15 years later: What have we learned from fMRI about the neural mechanisms of source memory?*

**Questions to answer:**
1. What cues does the brain use to attribute memory origin?
2. What conditions increase source monitoring failure?
3. How should CPE's `memory_type` taxonomy be designed to minimise source confusion?

---

### Memory Reconsolidation

**Why:** Retrieved memories becoming labile is both an opportunity (correction mechanisms) and a risk (interaction corruption). CPE's correction architecture should be informed by this.

**Starting points:**
- Nader, Schafe & LeDoux (2000) — *Fear memories require protein synthesis in the amygdala for reconsolidation after retrieval* (Nature) — the foundational paper
- Hupbach et al. (2007) — *Reconsolidation of episodic memories: A subtle reminder triggers integration of new information*

**Questions to answer:**
1. What triggers reconsolidation in the brain?
2. Should CPE allow correction at retrieval time or only through explicit correction events?
3. How should lability windows be bounded in the CPE correction protocol?

---

### Temporal Context Encoding in Episodic Memory

**Why:** Directly relevant to `knowledgeBoundaryStatus`, temporal tagging on `MemoryRecord`, and how the persona should behave when discussing events near the knowledge boundary.

**Starting points:**
- Eichenbaum (2014) — *Time cells in the hippocampus: A new dimension for mapping memories* (Nature Reviews Neuroscience)
- Howard & Kahana (2002) — *A distributed representation of temporal context*

**Questions to answer:**
1. How does the brain encode when an event occurred vs what occurred?
2. Should temporal context be a separate field on `MemoryRecord` or embedded in the vector representation?
3. What does boundary-proximate retrieval look like when temporal context is uncertain?

---

### Emotional Memory and Amygdala Encoding

**Why:** Provides the biological basis for `emotional_salience` as a first-class retrieval weight. Also relevant to the Capture subsystem — what makes a memory sticky at encoding time.

**Starting points:**
- McGaugh (2004) — *The amygdala modulates the consolidation of memories of emotionally arousing experiences* (Annual Review of Neuroscience)
- LeDoux (2015) — *Anxious: Using the Brain to Understand and Treat Fear and Anxiety* — accessible treatment of amygdala-memory interaction

**Questions to answer:**
1. How is emotional salience encoded alongside episodic content?
2. How does emotional salience interact with recency in retrieval priority?
3. Can emotional salience be inferred retrospectively, or must it be captured at encoding time?

---

### False Memory Research

**Why:** Understanding how memories are corrupted is essential for designing memory authority, provenance, and the correction protocol in CPE-CORE-002.

**Starting points:**
- Loftus & Pickrell (1995) — *The formation of false memories* (Psychiatric Annals) — foundational and accessible
- Schacter (2001) — *The Seven Sins of Memory* — broader accessible treatment

**Questions to answer:**
1. What conditions make memory corruption most likely?
2. What structural properties protect memories from corruption?
3. How should CPE represent a memory that has been challenged but not formally corrected?

---

## 8.2 Tier 2 — Before Writing CPE-CORE-004

These areas directly inform the identity modelling framework, personality model, and post-death correction architecture.

### The Default Mode Network and Self-Referential Processing

**Why:** The DMN is the brain's identity construction engine — active during self-referential thought, social cognition, and mental time travel (imagining past and future). Understanding what it does informs what the Identity Layer should compute.

**Starting points:**
- Buckner, Andrews-Hanna & Schacter (2008) — *The brain's default network: Anatomy, function, and relevance to disease* (Annals of the New York Academy of Sciences)
- Andrews-Hanna (2012) — *The brain's default network and its adaptive role in internal mentation*

**Questions to answer:**
1. What does self-referential processing involve computationally?
2. How does the DMN integrate memory into an ongoing identity narrative?
3. What does this suggest about the relationship between the Identity Layer and the Memory Layer?

---

### Narrative Self and the Interpreter

**Why:** Gazzaniga's interpreter and Damasio's autobiographical self are the most direct neuroscientific models of what CPE is trying to preserve. Both argue that identity is a construction, not a record — with significant implications for CPE-CORE-004.

**Starting points:**
- Gazzaniga (2000) — *Cerebral specialization and interhemispheric communication: Does the corpus callosum enable the human condition?* (Brain)
- Damasio (1999) — *The Feeling of What Happens: Body and Emotion in the Making of Consciousness* (book) — Chapters 7–10 most relevant
- Damasio (2010) — *Self Comes to Mind: Constructing the Conscious Brain* (book) — more directly applicable to the autobiographical self model

**Questions to answer:**
1. What is the minimal data required to support a narrative self construction?
2. How does the interpreter handle contradictions in the self-narrative?
3. What does Damasio's layered self model (proto → core → autobiographical) suggest about the structure of CPE-CORE-004's identity model?

---

### Personality Neuroscience

**Why:** The Big Five personality model (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) has documented neural correlates. This is directly applicable to the personality model CPE-CORE-004 must define.

**Starting points:**
- DeYoung et al. (2010) — *Testing predictions from personality neuroscience: Brain structure and the Big Five* (Psychological Science)
- Depue & Collins (1999) — *Neurobiology of the structure of personality: Dopamine, facilitation of incentive motivation, and extraversion*

**Questions to answer:**
1. Are the Big Five traits a reasonable basis for CPE-CORE-004's personality model, or is a different decomposition better suited?
2. Can trait-based personality representation produce consistent behaviour across relationship contexts?
3. How stable are personality traits over a lifespan — and what does this imply for identity versioning?

---

### The Narrative Self: Philosophical Perspective

**Why:** The philosophical literature on personal identity is directly relevant to the hardest questions in CPE-CORE-004: what constitutes identity continuity, who has authority to correct it, and whether a persona should be allowed to evolve after the subject's death.

**Starting points:**
- Parfit (1984) — *Reasons and Persons*, Part III: Personal Identity (book) — the most rigorous treatment of what personal identity actually requires for continuity
- Schechtman (1996) — *The Constitution of Selves* (book) — the narrative identity theory, directly applicable to how autobiographical memory and personality form a unified self
- Strawson (1997) — *The self* (Journal of Consciousness Studies) — shorter; argues against narrative identity; useful counterpoint

**Questions to answer:**
1. Does Parfit's account of psychological continuity have direct implications for what CPE must preserve?
2. What does narrative identity theory say about when a persona has diverged enough from the subject to no longer constitute the same identity?
3. Does the philosophical literature provide any guidance on post-death correction authority?

---

## 8.3 Tier 3 — Before Writing CPE-CORE-005

### Working Memory and Active Inference

**Why:** Directly informs the hot memory cache architecture and how the Reasoning Layer should maintain conversational context.

**Starting points:**
- Baddeley (2000) — *The episodic buffer: A new component of working memory?* (Trends in Cognitive Sciences) — the update that added the episodic buffer, most relevant to CPE
- Clark (2013) — *Whatever next? Predictive brains, situated agents, and the future of cognitive science* (Behavioral and Brain Sciences) — the most accessible treatment of predictive coding; relevant to how the Reasoning Layer should generate responses under uncertainty

**Questions to answer:**
1. What is the right analogy for the episodic buffer in CPE's hot cache design?
2. Does predictive coding suggest anything about how the Reasoning Layer should pre-load memory before a conversational turn completes?
3. How does the brain interleave perception and memory in real-time conversation?

---

## 8.4 Tier 4 — Broader Context

These are not required before any specific specification, but provide theoretical grounding for the project as a whole.

### The Extended Mind

Clark & Chalmers (1998) — *The Extended Mind* (Analysis). Argues that cognition can extend beyond the brain into external tools and systems. Provides a philosophical frame for understanding Digital Legacy itself: if memory and cognitive function can legitimately extend into external systems, CPE is not merely simulating a person — it may constitute a genuine extension of that person's cognitive presence.

### Grief, Memory, and Continuing Bonds

The psychological literature on grief has become relevant to Digital Legacy's design context. Klass, Silverman & Nickman (1996) — *Continuing Bonds: New Understandings of Grief* — argues that maintaining an ongoing relationship with the deceased is not pathological but normal. This provides a framework for understanding the Conversation mode use case and has implications for UX decisions in CPE-CORE-006.

---

# 9. Summary of Immediate Architectural Recommendations

Based on the mapping in this document, the following should be treated as inputs to CPE-CORE-002 and CPE-CORE-004.

## For CPE-CORE-002

1. Add `emotional_salience` as a first-class field on `MemoryRecord` — not optional metadata. Score range, default value, and inference rules to be defined.
2. Define a staged consolidation model for interaction memories — motivated by CLS theory. Interaction memories should carry a `consolidation_status` field and must not influence Identity Layer parameters until consolidated.
3. Treat `memory_type` as the source monitoring system — not a classification convenience. Source monitoring failure is the primary corruption risk.
4. Separate episodic and semantic memory at the schema level — not just via type tags. Retrieval strategies may differ between them.
5. Design retrieval as reconstruction, not lookup — the Progressive Recall Response pattern is validated by neuroscience and should be the default for conversational contexts.

## For CPE-CORE-004

1. Identity is a dynamic construction process, not a stored record — the Identity Layer must be active, not passive. A static `IdentityProfile` is necessary but not sufficient.
2. Relationship-sensitive identity expression is load-bearing — the Relationship Graph participates in identity expression, not just memory retrieval.
3. The personality model should be grounded in neurologically-validated trait dimensions — the Big Five is the most documented option, but should be evaluated against the project's fidelity requirements.
4. `IdentityDelta` should carry narrative continuity context — versions are chapters, not replacements.
5. Post-death correction authority has no biological analog — it must be fully specified from first principles with no assumption that neuroscience will provide guidance.

---

# 10. References

Full citation list for recommended reading.

Hopfield, J.J. (1982). Neural networks and physical systems with emergent collective computational abilities. *Proceedings of the National Academy of Sciences, 79*(8), 2554–2558.

Ramsauer, H., et al. (2020). Hopfield networks is all you need. *arXiv:2008.02217.*

Brown, R., & McNeill, D. (1966). The "tip of the tongue" phenomenon. *Journal of Verbal Learning and Verbal Behavior, 5*(4), 325–337.

Jung-Beeman, M., et al. (2004). Neural activity when people solve verbal problems with insight. *PLOS Biology, 2*(4), e97.

Yonelinas, A.P. (2002). The nature of recollection and familiarity: A review of 30 years of research. *Journal of Memory and Language, 46*(3), 441–517.

McClelland, J.L., McNaughton, B.L., & O'Reilly, R.C. (1995). Why there are complementary learning systems in the hippocampus and neocortex. *Psychological Review, 102*(3), 419–457.

Kumaran, D., Hassabis, D., & McClelland, J.L. (2016). What learning systems do intelligent agents need? Complementary learning systems theory updated. *Trends in Cognitive Sciences, 20*(7), 512–534.

Johnson, M.K., Hashtroudi, S., & Lindsay, D.S. (1993). Source monitoring. *Psychological Bulletin, 114*(1), 3–28.

Nader, K., Schafe, G.E., & LeDoux, J.E. (2000). Fear memories require protein synthesis in the amygdala for reconsolidation after retrieval. *Nature, 406*, 722–726.

Eichenbaum, H. (2014). Time cells in the hippocampus: A new dimension for mapping memories. *Nature Reviews Neuroscience, 15*, 732–744.

McGaugh, J.L. (2004). The amygdala modulates the consolidation of memories of emotionally arousing experiences. *Annual Review of Neuroscience, 27*, 1–28.

Loftus, E.F., & Pickrell, J.E. (1995). The formation of false memories. *Psychiatric Annals, 25*(12), 720–725.

Schacter, D.L. (2001). *The Seven Sins of Memory.* Houghton Mifflin.

Buckner, R.L., Andrews-Hanna, J.R., & Schacter, D.L. (2008). The brain's default network: Anatomy, function, and relevance to disease. *Annals of the New York Academy of Sciences, 1124*, 1–38.

Gazzaniga, M.S. (2000). Cerebral specialization and interhemispheric communication. *Brain, 123*(7), 1293–1326.

Damasio, A. (1999). *The Feeling of What Happens: Body and Emotion in the Making of Consciousness.* Harcourt.

Damasio, A. (2010). *Self Comes to Mind: Constructing the Conscious Brain.* Pantheon.

DeYoung, C.G., et al. (2010). Testing predictions from personality neuroscience: Brain structure and the Big Five. *Psychological Science, 21*(6), 820–828.

Parfit, D. (1984). *Reasons and Persons.* Oxford University Press. (Part III: Personal Identity)

Schechtman, M. (1996). *The Constitution of Selves.* Cornell University Press.

Baddeley, A. (2000). The episodic buffer: A new component of working memory? *Trends in Cognitive Sciences, 4*(11), 417–423.

Clark, A. (2013). Whatever next? Predictive brains, situated agents, and the future of cognitive science. *Behavioral and Brain Sciences, 36*(3), 181–204.

Clark, A., & Chalmers, D. (1998). The extended mind. *Analysis, 58*(1), 7–19.

Klass, D., Silverman, P.R., & Nickman, S.L. (Eds.) (1996). *Continuing Bonds: New Understandings of Grief.* Taylor & Francis.

Nelson, T.O., & Narens, L. (1990). Metamemory: A theoretical framework and new findings. *Psychology of Learning and Motivation, 26*, 125–173. — foundational treatment of metacognitive monitoring; directly relevant to Section 4.8's confidence signal model.

Weldon, M.S., & Bellinger, K.D. (1997). Collective memory: Collaborative and individual processes in remembering. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 23*(5), 1160–1175. — key paper on collaborative recall; establishes that social exchange of partial cues functions as retrieval input, not merely retrieval output.
