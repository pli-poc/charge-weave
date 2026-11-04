# Token-budget dialect for ontology modelling

**Status:** Proposal for future evaluation. This document does not authorize implementation or change the current MCP contract.

## Goal

Reduce the tokens an AI needs to inspect and propose ontology changes while preserving structure, meaning and validation. Measure total task cost and correctness before choosing a format; shorter text does not necessarily tokenize into fewer tokens.

## Candidate dialect

Explore a small, versioned, line-oriented format for ontology annotations and model summaries. Keep names meaningful and reserve short symbols for structure. For example:

```text
@cw 1
entity Customer "A person or organization buying services"
  field name: string ! "Legal or trading name"
  rel owns -> ChargingStation * "Stations owned by this customer"
entity ChargingStation "A location or device providing charging"
  rel operatedBy -> Operator 0..1
```

In this sketch, `entity` introduces a concept; indentation groups fields and relationships; `!` means required; `*` means zero or more; and `0..1` means optional and singular. Quoted text is an annotation. This is illustrative, not a finalized grammar or a claim about the existing model. Define exact cardinality, escaping, identifier resolution, multiline text, namespaces and error behavior before adoption.

A proposed edit might look like:

```text
@cw 1
add entity Contract "Agreement between parties"
add rel Contract.customer -> Customer 1 "Customer bound by the contract"
```

The AI needs the dialect definition and relevant model context. The service would parse and validate a proposal, check permissions and revision, and translate accepted operations into existing typed authoring commands. The format must not bypass validation, source ownership, review or publication boundaries.

## Integration boundary

- Keep MCP's JSON-RPC envelope and tool argument schemas. The dialect, if adopted, would be a string in an explicitly documented tool response or argument; it would not replace the MCP protocol.
- Keep canonical model sources and generated artifacts authoritative. Compact text is a projection or proposal, not a second source of truth.
- Preserve stable identifiers, namespaces, types, cardinalities, descriptions, provenance and semantics needed by the task. Clearly identify omitted details and provide a way to retrieve them.
- Include workspace and revision context and handle stale revisions explicitly. Edits must identify the intended workspace and expected revision.
- Retain typed JSON access and meaningful errors as a fallback for unsupported constructs, ambiguity and clients that do not support the dialect. The UI need not consume it.

## Work packages

1. **Baseline:** Inventory MCP tools, schemas and representative ontology reads, annotations and edit workflows. Capture sanitized, versioned fixtures of different sizes, including relationships, constraints, namespaced identifiers and long descriptions.
2. **Design candidates:** Compare existing JSON, compact JSON, a readable line format such as the sketch, and TOML where it fits. Define grammar, version marker, escaping, defaults, ordering, errors and lossless mapping for supported constructs. Identify unsupported semantics.
3. **Prototype offline:** Build an isolated encoder/parser and canonical intermediate representation. Test round trips for the supported subset, including Unicode, quotes, newlines, ambiguous names, duplicate identifiers and invalid input. Ensure omitted information cannot be mistaken for absent information.
4. **Measure end to end:** Use the actual target model tokenizers and representative tasks. Count request and response tokens, schema and dialect instructions, retries, errors and retrieval calls; measure latency and cost using applicable rates. Compare short and repeated sessions.
5. **Evaluate AI behavior:** On held-out tasks, compare the ability to find and explain concepts, preserve annotations and constraints, and propose correct edits. Check semantic equivalence and successful validation; track ambiguity, repairs and invented identifiers. Independently review failures.
6. **Decide and document:** Adopt only if real workflows show meaningful savings without unacceptable correctness or usability regression. Record results, thresholds, scope, versioning, migration and fallback. If results are inconclusive, retain the current interface.
7. **Implement only after approval:** If separately authorized, expose a versioned opt-in representation through compatible MCP tools, add validation and observability, and test old and new clients. Keep rollout reversible and update documentation and generated artifacts where applicable.

## Acceptance criteria for a future implementation

- A published grammar and examples cover the supported subset; unsupported constructs fail explicitly or use the typed fallback.
- Round-trip and negative tests demonstrate preservation of identifiers, annotations and supported semantics; malformed or ambiguous proposals cannot mutate a workspace.
- Revision conflicts, authorization, validation and review behave as they do for existing typed edits.
- A reproducible benchmark reports token counts and task success for each candidate, including instruction and retry overhead. Savings and quality thresholds are agreed before selecting a winner.
- Existing MCP clients and canonical sources remain compatible, and full underlying information remains available on demand.

## Open decisions

Which annotations and model views produce the largest token costs? Which clients and models need support? Is a compact read-only projection sufficient, or do proposed edits also need the dialect? What measured saving justifies a new parser and maintenance? Answer these with the baseline and benchmark, not character count alone.
