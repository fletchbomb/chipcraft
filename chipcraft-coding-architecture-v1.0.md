# CHIPCRAFT — CODING ARCHITECTURE & IMPLEMENTATION ROADMAP v1.0

**Implementation-only companion document.** This file defines how to code Chipcraft cleanly from the current design documents.

The canonical GDD remains the only source of truth for gameplay rules, terminology, construction legality, content definitions, combat systems, and mode-independent state concepts.

The NPC AI spec remains the source of truth for AI scoring, weighting, tie-breaks, commitment behavior, and AI-side evaluation rules.

The UI framework companion remains the source of truth for screen architecture, interaction grammar, contextual surfaces, preview presentation, overlays, and motion language.

The battle-test companion remains the source of truth for battle-test mode flow, scenario setup, launch rules, rematch / edit / new-scenario behavior, and battle-test save / load behavior.

This file does **not** create or modify gameplay rules. It defines code ownership, module boundaries, shared pathways, implementation order, testing rules, and anti-patchwork practices for coding.

---

## 1. Purpose

This document exists to:
- translate the current document stack into a clean code architecture
- define which code layer owns which kind of logic
- define the canonical shared pathways the whole codebase must use
- define the implementation order for building the first playable battle-test version
- define testing and regression rules that prevent patchwork
- define change-management rules so future updates stay system-first

This document does **not** exist to:
- invent new gameplay rules
- reinterpret existing design documents
- move UI rules into engine code
- move mode flow into canonical combat systems
- create a second source of truth beside the GDD and current companion docs

---

## 2. Source-of-Truth Map

### 2.1 Canonical GDD
The GDD owns:
- gameplay rules
- terminology
- construction legality
- content definitions
- geometry and access rules
- power and Energy rules
- combat timing
- statuses and counters
- damage, disablement, and win / loss rules
- canonical helper naming and validation invariants

### 2.2 NPC AI Spec
The AI spec owns:
- legal-action evaluation rules
- projected-resolution scoring rules
- personality weights
- tie-break behavior
- controlled randomness rules
- commitment and AI preview-output rules

### 2.3 UI Framework Companion
The UI framework owns:
- screen architecture
- interaction grammar
- contextual flyouts
- overlays
- preview presentation
- battle / rebuild surface behavior
- motion language
- implementation-facing UI state contracts

### 2.4 Battle-Test Companion
The battle-test companion owns:
- battle-test mode flow
- scenario setup rules
- setup validation timing
- side lock / launch rules
- rematch / edit / new-scenario behavior
- scenario save / load behavior

### 2.5 This File
This file owns:
- code-module boundaries
- engine ownership rules
- shared implementation pathways
- implementation order
- testing and regression rules
- debugging and change-management rules
- anti-patchwork coding requirements

---

## 3. Core Coding Principles

### 3.1 One-Directional Ownership Rule
Code must mirror document ownership.

- engine rules follow the GDD
- AI consumes canonical legal actions and projected outcomes
- UI renders canonical engine truth and local interaction state
- battle-test mode composes shared systems without redefining gameplay

### 3.2 Shared-Pathway Rule
Any gameplay computation needed by more than one system must be implemented once in a canonical engine pathway and consumed everywhere else.

Required shared pathways include:
- layout validation
- battle initialization
- legal-action enumeration
- projected-resolution building
- preview-truth generation
- power evaluation
- frontier evaluation
- activation resolution

### 3.3 No UI-Owned Gameplay Rule
UI must not determine:
- legality
- target validity
- affected spaces
- affected chips
- validation success
- preview truth
- combat resolution

UI may only render those outputs and manage local interaction state.

### 3.4 No Mode-Owned Combat Rule
Mode code must not define:
- alternate combat rules
- alternate timing rules
- alternate AI semantics
- alternate preview truth
- alternate damage or status resolution

Mode code may define:
- setup flow
- scenario packaging
- lock / launch flow
- save / load flow
- routing between shared surfaces

### 3.5 Data-Driven Content Rule
Chip behavior should be expressed through content data plus shared resolution grammar whenever possible.

Do not create bespoke chip-specific resolution pathways unless the GDD truly requires an exception that the shared grammar cannot express cleanly.

### 3.6 Derived-State Rule
Derived values should be computed from canonical state rather than stored as separate mutable truth wherever possible.

Examples:
- frontier state
- powered state
- color levels
- valid layout state
- legal target set
- affected spaces
- preview outcomes

If a derived value is cached for performance, the cache must have one clear invalidation owner.

### 3.7 Root-Fix Rule
When a bug appears, fix it at the layer that owns the rule rather than at the symptom layer.

Examples:
- geometry bug → geometry layer
- power bug → power layer
- preview bug → projected-resolution / preview layer
- AI choice bug → AI evaluation layer
- UI visual bug → UI layer

### 3.8 Test-Backed Change Rule
Every bug fix or rule change must add or update a test at the owning layer.

---

## 4. Runtime Architecture

### 4.1 Content Layer
Static content and authored definitions.

Owns:
- chip definitions
- frame definitions
- AI personality presets
- status metadata where useful
- static labels and identifiers

Suggested folder:
- `content/`

### 4.2 Construction Layer
Mode-neutral ship-construction state and placement logic.

Owns:
- chip-instance creation and deletion
- placement, movement, and removal
- layout validation
- launch validation
- setup-side state transforms

Suggested folder:
- `engine/construction/`

### 4.3 Geometry Layer
Spatial rules independent of UI.

Owns:
- frame legality
- adjacency
- local-grid positions
- combat-space transforms
- shape expansion
- affected-space computation
- frontier computation

Suggested folder:
- `engine/geometry/`

### 4.4 Power Layer
Canonical color and routing logic.

Owns:
- pylon coverage
- relay propagation
- color union
- level computation
- fusion derivation
- powered-state derivation
- max-HP changes from Green
- shape-step changes from Blue
- primaryStat changes from Red

Suggested folder:
- `engine/power/`

### 4.5 Combat Layer
Canonical mutable battle state and timing flow.

Owns:
- battle state
- phase progression
- turn-start / Energy / auto / activation / turn-end sequencing
- damage pipeline
- status lifecycle
- disablement handling
- win / loss checks

Suggested folder:
- `engine/combat/`

### 4.6 Action Layer
Canonical legal-action and resolution logic.

Owns:
- usable Active-chip enumeration
- legal target enumeration
- target filtering
- affected-chip resolution
- chosen-chip resolution
- projected-resolution building
- truthful-preview generation
- activation resolution

Suggested folder:
- `engine/actions/`

### 4.7 AI Layer
NPC evaluation built on canonical action outputs.

Owns:
- legal-action consumption
- score-profile generation
- weight application
- tie-break resolution
- controlled randomness
- committed-plan output

Suggested folder:
- `engine/ai/`

### 4.8 Battle-Test Mode Layer
Thin mode shell for sandbox setup.

Owns:
- battle-test scenario creation
- side setup state
- side locking
- scenario snapshot creation
- rematch / edit / new-scenario flow
- save / load wiring

Suggested folder:
- `engine/modes/battleTest/`

### 4.9 UI Layer
Presentation and interaction only.

Owns:
- board rendering
- build surface rendering
- battle surface rendering
- flyouts
- overlays
- playback presentation
- local drag / focus / preview / confirm input state
- view-model rendering adapters

Suggested folders:
- `ui/battle/`
- `ui/build/`
- `ui/shared/`

### 4.10 App Layer
Top-level application routing and persistence wiring.

Owns:
- mode switching
- top-level scene / screen routing
- save slot wiring
- developer toggles
- startup / boot flow

Suggested folder:
- `app/`

---

## 5. Canonical State Model

### 5.1 Definition Data
Immutable authored data.

Includes:
- `ChipDefinition`
- `FrameDefinition`
- AI preset definitions
- static status metadata

Definition data must not be mutated during play.

### 5.2 Construction State
Mode-neutral setup data before battle.

Includes:
- chip instances
- placed layout
- unplaced chip instances
- selected frame
- side lock state

Construction state must stay separate from combat mutation.

### 5.3 Scenario State
Reusable mode package.

Includes:
- battle-test scenario
- player setup
- enemy setup
- AI preset assignment
- metadata such as scenario name and notes

### 5.4 Combat State
Mutable rules state used during battle.

Includes:
- chip HP
- statuses
- counters
- Energy
- turn / phase state
- power-derived state
- battle-end flags

### 5.5 AI Evaluation State
Transient evaluation outputs.

Includes:
- legal actions
- projected resolutions
- score profiles
- final weighted scores
- committed enemy plan output

### 5.6 UI State
Local interaction state only.

Includes:
- focus
- drag state
- preview selection
- flyout visibility / mode
- overlay visibility
- local animation state

UI state must not replace engine truth.

### 5.7 State-Separation Rule
Definition data, construction state, scenario state, combat state, AI evaluation state, and UI state must remain distinct.

Do not collapse them into one giant mutable object.

---

## 6. Canonical Shared Pathways

### 6.1 Construction Pathways
Implement once and reuse everywhere:
- create chip instance
- delete chip instance
- place chip instance
- move chip instance
- remove chip instance from layout
- validate side layout
- validate launch layout

### 6.2 Geometry Pathways
Implement once and reuse everywhere:
- legal spaces for frame
- combat-space transform
- adjacency
- shape expansion
- affected-space calculation
- frontier calculation

### 6.3 Power Pathways
Implement once and reuse everywhere:
- colors reaching a chip
- relay traversal
- color levels
- fusion state
- modified shape
- modified primaryStat
- powered max HP
- powered / fusion tags

### 6.4 Action Pathways
Implement once and reuse everywhere:
- usable Active chips
- legal targets for a chip
- target filters
- affected chips from a target and shape
- chosen-chip resolution
- projected resolution
- truthful preview
- action resolution

### 6.5 Combat Pathways
Implement once and reuse everywhere:
- battle initialization from setup snapshot
- turn progression
- auto resolution
- damage pipeline
- status application / removal
- disablement update
- win / loss check

### 6.6 AI Pathways
Implement once and reuse everywhere:
- evaluate legal actions
- build score profile
- apply weights
- apply tie-breaks
- commit visible AI plan output

### 6.7 Reset / Snapshot Pathways
Implement once and reuse everywhere:
- lock setup into a scenario snapshot
- restore setup from locked snapshot
- initialize fresh combat from locked snapshot

---

## 7. Battle-Test Implementation Contract

### 7.1 Battle-Test Is a Thin Mode
Battle test is a scenario-construction and launch shell over shared systems.

### 7.2 Battle-Test Owns
Battle test may:
- create or load a scenario
- create chip instances under battle-test availability rules
- place and remove chip instances
- validate and lock each side
- launch a normal battle from a locked snapshot
- rematch, edit, or discard scenarios
- save and load battle-test scenarios

### 7.3 Battle-Test Does Not Own
Battle test must not:
- define combat rules
- define targeting legality
- define power rules
- define alternate preview rules
- define alternate AI behavior
- define progression or economy logic

### 7.4 Availability-Policy Rule
Battle test may use a battle-test-specific chip-availability policy, but that policy must feed the same construction engine used by other modes.

The construction layer must remain mode-neutral.

---

## 8. AI Integration Contract

### 8.1 AI Consumes Canonical Legal Actions
AI must not invent its own action semantics.

AI receives:
- usable Active chips
- legal targets
- canonical affected spaces / chips
- canonical projected resolutions

### 8.2 AI Does Not Own Gameplay Legality
AI must not define:
- hostile targeting legality
- support targeting legality
- effect resolution
- damage semantics
- disablement semantics
- status timing

### 8.3 AI Preview Contract
Committed enemy preview output is downstream of:
- AI choice
- canonical commitment rules
- canonical preview-truth rules

UI renders the output. AI does not own the UI surface.

---

## 9. UI Integration Contract

### 9.1 UI Renders Truth
UI consumes engine outputs and local interaction state.

### 9.2 UI Must Ask Canonical Pathways
UI must ask shared pathways for:
- legal placements
- validation failures
- legal targets
- affected spaces
- affected chips
- preview outcomes
- lock / launch validity

### 9.3 UI Must Not Recalculate Rules
UI must not infer:
- frontier
- powered state
- legal action sets
- damage legality
- validation truth

### 9.4 Shared View-Model Rule
Formatted text, compact preview summaries, overflow indicators, and similar display transforms should be produced by shared view-model helpers rather than handwritten inside individual components.

### 9.5 Battle-Test Surface Reuse Rule
Battle-test setup should reuse the rebuild interaction language and normal battle surface behavior defined by the UI framework wherever possible.

---

## 10. Implementation Milestones

### 10.1 Milestone 1 — Definition and State Foundations
Build:
- chip definitions
- frame definitions
- core state schemas
- serialization-safe ids
- content loading

Deliverable:
- definitions load and validate successfully

### 10.2 Milestone 2 — Construction Engine
Build:
- instance creation and deletion
- placement / movement / removal
- layout validation
- launch validation
- side lock state

Deliverable:
- one side can be assembled legally and invalid states surface explicit reasons

### 10.3 Milestone 3 — Geometry Engine
Build:
- legal-space lookup
- adjacency
- combat-space positions
- shapes
- shape steps
- frontier evaluation

Deliverable:
- target spaces and frontier states evaluate correctly from frame + occupancy

### 10.4 Milestone 4 — Power Engine
Build:
- pylon coverage
- relay propagation
- color union
- levels
- fusion
- modified stats / shape / max HP

Deliverable:
- powered and unpowered board states update correctly from layout

### 10.5 Milestone 5 — Combat State Machine
Build:
- battle initialization
- phase progression
- Energy gain
- auto resolution
- activation step
- turn end
- win / loss

Deliverable:
- a battle can begin and advance through turns with canonical timing

### 10.6 Milestone 6 — Action Resolution and Preview
Build:
- usable Active-chip enumeration
- legal target enumeration
- projected resolution
- truthful preview generation
- activation resolution

Deliverable:
- one chosen action can preview truthfully and resolve canonically

### 10.7 Milestone 7 — AI
Build:
- score profiles
- weights
- tie-breaks
- commitment output
- repeated action selection through available Energy

Deliverable:
- enemy can take a full turn using canonical legal-action outputs

### 10.8 Milestone 8 — Battle-Test Mode Shell
Build:
- new scenario
- player setup
- enemy setup
- side lock
- launch
- rematch
- edit
- save / load

Deliverable:
- full sandbox loop works from setup to battle to rematch / edit

### 10.9 Milestone 9 — UI Polish and Shared Surfaces
Build:
- battle flyouts
- build flyout reuse
- overlays
- playback sequencing
- validation messaging
- interaction polish

Deliverable:
- battle test becomes readable and pleasant without changing engine truth

---

## 11. Testing Strategy

### 11.1 Unit Invariant Tests
Write invariant tests for shared systems.

Required invariants include:
- no legal space contains more than one placed chip instance
- one placed chip instance appears in at most one space
- launch-valid layout contains exactly one placed Core
- illegal spaces cannot accept placed chips
- same-color duplicate power does not stack
- relay traversal is cycle-safe
- disabled chips open access
- preview never offers illegal targets
- battle initialization from a locked snapshot yields fresh clean state

### 11.2 Scenario Tests
Write small scenario tests for known interactions.

Examples:
- Scout Core launches and grants correct Energy
- Cannon hits one legal frontier target correctly
- destroyed frontier chip exposes correct next frontier
- Pylon + Relay power an intended Attack chip
- Reconstructor preserves an allied chip when legal
- AI chooses the higher-scoring action in a controlled board state

### 11.3 Regression Tests
Every fixed bug becomes a named regression test at the layer that owns the rule.

### 11.4 Test-Ownership Rule
If a bug fix changes multiple files, the regression test still belongs to the engine layer that owns the rule.

---

## 12. Debugging Rules

### 12.1 Symptom-to-Owner Rule
Every bug report must be assigned to an owning layer before the fix begins.

| Symptom | Likely owner |
|---|---|
| illegal placement accepted / rejected | construction |
| wrong frontier or exposure | geometry |
| wrong power state or fusion | power |
| wrong preview or affected spaces | actions / projected resolution |
| wrong damage / status timing | combat |
| wrong AI choice | AI |
| wrong flyout, highlight, or animation only | UI |
| wrong launch / rematch / save flow | battle-test mode |

### 12.2 No Symptom Patches
Do not fix an engine bug by hardcoding a UI workaround or a mode-specific exception.

### 12.3 Fix-and-Lock Rule
Every fix must:
1. identify owner
2. fix owner layer
3. add or update regression test
4. verify downstream systems now behave correctly through the shared pathway

---

## 13. Change-Management Rules

### 13.1 Doc-First Change Rule
If a gameplay rule changes, update the source-of-truth document first.

### 13.2 Ownership-First Implementation Rule
After the document update:
1. update the owning code layer
2. update tests
3. update consuming layers only if their interfaces changed

### 13.3 Shared-Pathway Expansion Rule
If a new feature needs a computation that already exists elsewhere, unify the computation before adding a second implementation.

### 13.4 No Hidden Drift Rule
Do not change gameplay behavior silently inside UI polish, AI refactors, or mode routing.

---

## 14. Anti-Patterns

Do not do the following:
- duplicate legality checks in UI and engine
- duplicate preview logic in AI and UI
- store derived state as independent truth without invalidation ownership
- create battle-test-only combat rules
- create UI-only targeting logic
- create AI-only effect semantics
- patch one chip with one-off code when the real fix belongs in shared action grammar
- patch one mode with special-case resolution when the real fix belongs in combat or construction
- let presentation objects become owners of rule logic

---

## 15. Delivery Expectations for Coding Passes

Every meaningful coding pass should report:
- which layer changed
- which shared pathway changed
- which downstream systems now benefit automatically
- which tests were added or updated
- which files changed
- whether any source-of-truth document now needs updating

If a change adds behavior but cannot identify its owning layer, the change is not ready.

---

## 16. First-Playable Build Target

The first coded target is not the full game. It is:

- battle-test setup
- normal battle launch
- canonical combat resolution
- canonical AI turn behavior
- truthful preview
- rematch / edit / new-scenario loop

This target is sufficient to test:
- ship-building quality
- chip interaction quality
- power routing clarity
- frontier gameplay
- AI readability
- overall combat feel

It is not intended to prove campaign pacing, economy balance, or route structure.

---

## 17. Summary Rule

Chipcraft should be coded as a small set of canonical engines consumed by thin mode and UI layers.

Any gameplay computation used by more than one system must be implemented once in a shared pathway and reused everywhere else.

That is the primary anti-patchwork rule for the project.
