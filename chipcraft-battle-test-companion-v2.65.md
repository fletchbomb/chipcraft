# CHIPCRAFT — BATTLE TEST COMPANION v2.65

**Non-canonical companion document.** This file defines a focused sandbox battle-test mode for Chipcraft.

The canonical GDD remains the only source of truth for combat rules, terminology, formatting style, systems structure, implementation-facing language, chip behavior, targeting legality, timing, power, statuses, and ship-construction legality.

The NPC AI spec remains the source of truth for enemy action evaluation, legal-action scoring, personality weighting, committed-plan behavior, and AI preview limits.

The UI framework companion remains the source of truth for surface behavior, contextual flyouts, preview presentation, input flow, motion language, and screen architecture.

The prototype routing companion remains a separate non-canonical document for first-playable run structure, authored encounters, inventory flow, route flow, shops, and Dry Dock. This battle-test companion does not depend on prototype routing to function.

---

## 1. Purpose of This Document

This document exists to:
- define a small, focused sandbox mode for testing ship construction and combat
- allow the player to assemble both sides directly from currently implemented content
- stress-test chip interactions, ship geometry, power routing, targeting, frontier access, and AI decision-making without requiring campaign structure
- keep battle-test setup separate from run progression, authored encounters, inventory ownership, and economy systems
- provide implementation-facing setup flow and state boundaries for direct coding

This document does **not** exist to:
- replace the first-playable prototype route
- rewrite approved combat rules
- redefine chip content behavior
- create alternate AI rules for sandbox
- create alternate UI truth rules for sandbox
- introduce campaign progression shortcuts under a different name

---

## 2. Core Dependency Rules

### 2.1 Canonical Combat Dependency Rule
If battle test needs a combat rule, legality check, targeting rule, shape rule, disablement rule, damage rule, power rule, or timing rule, it must consume that rule from the canonical GDD.

### 2.2 Canonical AI Dependency Rule
If battle test needs enemy decision behavior, action scoring, tie-break behavior, committed-plan behavior, or enemy preview limits, it must consume that rule from the NPC AI spec.

### 2.3 Canonical UI Dependency Rule
If battle test needs screen layout behavior, contextual-surface behavior, preview presentation, flyout behavior, confirmation flow, or shared motion language, it must consume that rule from the UI framework companion.

### 2.4 No Prototype-Layer Rule
Battle test is not layered on top of prototype routing. Prototype routing remains a separate mode owner for run structure, authored content, inventory flow, shops, and Dry Dock. Battle test may reuse implementation pathways that prototype also uses, but it must not inherit prototype-only assumptions as document dependencies.

---

## 3. Ownership Boundaries

### 3.1 This Document Owns
This document owns only:
- battle-test mode goals
- battle-test setup flow
- player-side sandbox ship construction flow
- enemy-side sandbox ship construction flow
- battle launch rules for sandbox mode
- reset, rematch, edit, and scenario-save behavior for sandbox mode
- implementation-facing state required to support sandbox setup and launch

### 3.2 This Document Does Not Own
This document does not own:
- combat resolution
- chip content definitions
- power propagation logic
- preview truth rules
- enemy action logic
- run start loadouts
- owned inventory
- reserve as a progression concept
- route flow
- shops
- Dry Dock
- scrap or economy flow
- authored encounter progression
- persistence rewards or flaw-cleanup flow

### 3.3 Shared-Pathway Rule
Where battle test and another mode require the same underlying behavior, the implementation should prefer one shared pathway rather than parallel mode-specific rule logic.

Examples:
- one legal-layout validator
- one battle-state initializer
- one legal-action enumerator
- one projected-resolution builder
- one preview-truth pipeline

---

## 4. Battle-Test Mode Goals

Battle test exists to quickly validate ship-building quality, combat interactions, power routing, frontier play, and AI behavior before campaign balance is finalized.

Battle test is a **combat-and-construction laboratory**, not a progression simulator.

---

## 5. Mode Scope for the First Battle-Test Version

### 5.1 Included in Current Scope
The first battle-test version includes:
- choose player ship frame
- build player ship from currently implemented chips
- choose enemy ship frame
- build enemy ship from currently implemented chips
- choose enemy AI personality preset
- launch one battle
- reset the battle to the same setup
- return to edit mode with the same setup preserved
- save and load battle-test scenarios

### 5.2 Excluded from Current Scope
The first battle-test version excludes:
- route map
- shops
- Dry Dock
- scrap
- chip purchasing
- inventory scarcity
- reserve as a run-state bucket
- post-battle rewards
- run persistence
- random encounter generation
- authored campaign progression
- campaign balance conclusions derived from sandbox mode alone

### 5.3 Current-Scope Assumption
Battle test exposes all **currently implemented** battle-legal chip types for direct setup use. It does not expose placeholder or not-yet-coded content purely because that content exists in planning documents.

---

## 6. Battle-Test Flow

The battle-test mode follows one shared setup-to-battle loop.

### 6.1 Entry Flow
1. enter Battle Test mode
2. create new scenario or load saved scenario
3. move into player setup

### 6.2 Player Setup Flow
1. choose player ship frame
2. create player-side chip instances from currently implemented battle-legal chip types
3. place player chip instances into legal player-frame spaces
4. validate player layout
5. lock player setup and move into enemy setup

### 6.3 Enemy Setup Flow
1. choose enemy ship frame
2. create enemy-side chip instances from currently implemented battle-legal chip types
3. place enemy chip instances into legal enemy-frame spaces
4. choose enemy AI personality preset
5. validate enemy layout
6. lock enemy setup and move into battle launch

### 6.4 Battle Launch Flow
1. confirm both sides are valid and locked
2. build one sandbox scenario snapshot from the locked setup
3. initialize battle state from that snapshot using canonical battle-init rules
4. enter battle surface
5. resolve combat normally through canonical combat and AI systems

### 6.5 Post-Battle Flow
After a battle ends, battle test offers only these immediate outcomes:
- **Rematch**: reinitialize the same locked scenario from fresh pre-battle state
- **Edit Scenario**: return to setup with the last locked scenario loaded for editing
- **New Scenario**: discard current scenario and return to empty setup

---

## 7. Ship Construction Rules for Battle Test

### 7.1 Legal Construction Rule
Both player and enemy layouts must obey the same canonical ship-construction legality rules.

### 7.2 Symmetry Rule
Player and enemy setup use the same object model:
- ship frame
- built chip instances
- placed layout
- unplaced built instances

This symmetry is required so battle test exercises the real combat system rather than separate player and enemy construction models.

### 7.3 Built-Instance Rule
A side's built chip instances are exactly the chip instances currently created for that side during setup.

### 7.4 Placement Rule
Only chip instances placed in legal spaces become part of the active starting layout for that side.

### 7.5 Unplaced-Instance Rule
Unplaced built chip instances remain setup-only state. They do not become reserve, do not produce combat effects, and do not imply campaign ownership.

### 7.6 Core Placement Rule
A side is launch-valid only when it has exactly 1 placed currently implemented battle-legal Core in a legal space.

### 7.7 Duplicate Rule
Battle test allows duplicate non-Core chip instances unless a canonical chip-specific restriction explicitly forbids duplication.

### 7.8 Build Submission Rule
A side's build is launch-valid only when:
- its frame is selected
- it has exactly 1 placed battle-legal Core
- every placed non-Core chip instance occupies a legal space
- no legal space contains more than 1 chip instance
- every placed chip instance is currently implemented battle-legal content

---

## 8. Enemy Configuration Rules

### 8.1 AI-Controlled Enemy Rule
In current scope, the enemy side is AI-controlled once battle begins.

### 8.2 Personality Preset Rule
Before battle launch, the scenario stores one enemy AI personality preset chosen from the currently implemented presets defined by the NPC AI spec.

### 8.3 No Sandbox-Only AI Rule
Battle test must not introduce enemy-only sandbox heuristics that bypass the shared NPC action-evaluation model.

### 8.4 Preview Commitment Rule
Enemy committed actions shown during battle test still obey the same preview-truth and AI commitment constraints used elsewhere.

---

## 9. Battle Start-State Rules

### 9.1 Fresh-State Rule
Battle test initializes both sides from a clean pre-battle state.

- all placed chips begin undamaged
- all placed chips begin enabled
- no carryover modifiers from prior battles are present
- no persistence rewards are applied
- no flaws are carried in from route progression
- no shop, Dry Dock, or economy effects are applied

### 9.2 Start-Side Rule
Battle test uses player-first turn order.

### 9.3 Canonical Initialization Rule
Once battle begins, state initialization must produce a normal combat state object, not a special sandbox-only combat ruleset.

---

## 10. Reset, Rematch, and Edit Rules

### 10.1 Locked-Scenario Snapshot Rule
When battle launches, the mode stores one locked scenario snapshot. Rematch and Edit Scenario operate from that snapshot, not from mutated mid-battle state.

### 10.2 Rematch Rule
Rematch rebuilds a fresh combat state from the locked scenario snapshot and does not preserve any mid-battle changes.

### 10.3 Edit Rule
Edit Scenario returns to setup mode with the locked scenario snapshot loaded into the setup surfaces for further changes.

### 10.4 Reset-Within-Setup Rule
While still in setup mode, Reset clears the in-progress side being edited back to its current last-saved or last-loaded scenario state if one exists; otherwise it clears to empty setup.

---

## 11. Scenario Save and Load Rules

### 11.1 Scenario Role
A saved battle-test scenario is a reusable setup package for repeated direct-combat testing.

### 11.2 Scenario Content Rule
A saved scenario stores only battle-test setup data required to reconstruct the pre-battle sandbox state.

### 11.3 Scenario Must Store
- scenario name
- player frame id
- player built chip instance list
- player placed layout
- enemy frame id
- enemy built chip instance list
- enemy placed layout
- enemy AI personality preset id
- optional notes field

### 11.4 Scenario Must Not Store
- route position
- shop inventory
- scrap
- unlock state
- owned campaign inventory
- post-battle rewards
- prior battle damage carryover
- prototype-run assumptions

### 11.5 Scenario Compatibility Rule
If a saved scenario references content no longer available in the current implementation, the mode must surface that incompatibility explicitly rather than silently mutating the setup.

---

## 12. UI Routing for Battle Test

### 12.1 UI Dependency Rule
Battle test uses the UI framework companion for all general presentation, preview, flyout, inspection, overlay, and motion-language behavior.

### 12.2 New Surface Rule
Battle test adds one new top-level mode flow with three setup surfaces:
- player setup
- enemy setup
- battle

### 12.3 Builder Surface Rule
The player-setup and enemy-setup surfaces should reuse the rebuild interaction language where that language already fits:
- chip-first interaction
- live legality feedback
- live power feedback on the current side's ship
- contextual flyout behavior
- subtle board treatment
- shared motion and tactile feedback

### 12.4 No Campaign-Surface Leakage Rule
Battle test setup must not require route, shop, or Dry Dock surfaces to function.

### 12.5 Side Editing Rule
Only one side is edited at a time. The inactive side's current scenario state remains visible when helpful, but only the active side accepts construction input.

### 12.6 Battle Surface Rule
Once battle starts, battle test uses the normal battle surface rather than a special debug battle screen.

---

## 13. Validation Rules

### 13.1 Shared Validation Rule
Battle test should call the same core validators used by other modes wherever those validators already match canonical legality.

### 13.2 Scenario Validation Timing
Validation occurs:
- when frame changes
- when Core changes
- when a chip instance is created or deleted during setup
- when a chip instance is placed, moved, or removed from the layout
- when the user attempts to lock a side
- when the user attempts to launch battle
- when a saved scenario is loaded

### 13.3 Explicit Failure Rule
When setup is invalid, the mode must surface explicit reasons rather than a generic launch failure.

Examples:
- missing Core placement
- illegal occupied space
- duplicate forbidden content if future canonical rules disallow it
- missing content referenced by saved scenario
- side not locked

---

## 14. Implementation-Facing State Outline

### 14.1 BattleTestScenario
```ts
BattleTestScenario {
  scenarioId
  name
  notes
  playerSetup
  enemySetup
}
```

### 14.2 SideSetup
```ts
SideSetup {
  frameId
  builtChipInstances
  placedLayoutBySpaceId
  aiPresetId | null
  isLocked
}
```

### 14.3 BuiltChipInstance
```ts
BuiltChipInstance {
  chipInstanceId
  chipTypeId
}
```

### 14.4 placedLayoutBySpaceId
```ts
placedLayoutBySpaceId: Record<SpaceId, ChipInstanceId>
```

### 14.5 LockedBattleTestSnapshot
```ts
LockedBattleTestSnapshot {
  scenario
  lockedAtVersion
}
```

### 14.6 Ownership Rule for State Shapes
These schemas describe only sandbox setup state. They must not redefine the canonical combat-state schema, AI schema, or UI state contracts already owned elsewhere.

---

## 15. Guardrails

- all launchable states must pass canonical validators
- battle test must not absorb progression, economy, or route systems
- battle test must not add sandbox-only combat or AI rules
- scenario setup should stay declarative and replayable rather than growing into a loose cheat/debug panel

---

## 16. Implementation Priority Order

Build battle test in this order:
1. scenario data model
2. player-side builder with shared legality validation
3. enemy-side builder with shared legality validation
4. scenario lock and battle launch pipeline
5. normal battle handoff using canonical combat state
6. rematch / edit / new-scenario loop
7. save / load scenarios
8. setup-surface polish, filtering, and quality-of-life improvements

This order keeps the mode small, testable, and structurally honest.

---

## 17. Summary Rule

Battle test is a **separate sandbox setup mode** that directly depends on the canonical GDD, the NPC AI spec, and the UI framework companion.

It exists to test ship construction and combat quickly.

It must not become a hidden second prototype route.
