# CHIPCRAFT — NPC AI SYSTEM SPEC v2.59

**Non-canonical systems document.** This file defines how NPCs evaluate and choose legal actions during combat. The canonical GDD remains the only source of truth for combat rules, timing, targeting, shapes, effect resolution, power, statuses, and chip behavior. The prototype routing companion remains the source of truth for current prototype scope, authored enemy ships, encounter structure, run-state assumptions, and inventory flow. This file does not replace either document. It routes NPC decision-making through those existing systems.

---

## 1. Purpose of This Document

This document defines:
- the NPC decision pipeline
- the shared legal-action model used by NPCs
- the shared projected-resolution model used to evaluate one legal action
- the normalized score-profile model used to compare legal actions
- support-action evaluation rules
- personality weight presets
- tie-break and controlled-randomness rules
- preview commitment behavior for NPC-selected actions
- implementation-facing AI schemas
- extension rules for adding new personalities or score categories without patchwork

This document does not redefine:
- combat timing windows
- targeting legality
- effect resolution
- chip content behavior
- authored encounter content
- inventory ownership rules
- route structure

---

## 2. Inherited Canonical Assumptions

NPC decision-making in this file depends on the following inherited systems:
- legal actions use canonical activation, targeting, and timing rules
- affected spaces and affected chips use canonical shape and effect-resolution rules
- legal hostile targets use canonical frontier and targeting defaults unless a chip says otherwise
- support and self-target actions use canonical chip entries and effect grammar
- damage, disablement, Shield, statuses, and counters resolve through canonical combat rules
- Preview output must obey the existing Preview Truth Framework
- authored enemy ships, encounter flow, and run-state assumptions come from the prototype routing companion

This document evaluates only legal actions available under those systems.

---

## 3. AI System Goals

The NPC AI system follows these goals:
- use the same rules objects the player uses
- produce readable mid-battle choices
- differ by personality through weights, not bespoke logic trees
- re-evaluate after each resolved action
- avoid hidden future knowledge beyond the current visible board state and committed enemy actions
- allow small controlled randomness only among exact-score ties
- remain extensible through shared categories and schemas rather than enemy-specific patches

---

## 4. Decision Pipeline

NPCs choose actions using one shared turn pipeline.

### Shared NPC Turn Pipeline
1. determine current available Energy
2. gather all usable Active chips for the acting NPC ship
3. enumerate all legal actions for each usable Active chip
4. build one `ProjectedResolution` for each legal action
5. build one normalized `ScoreProfile` for each legal action
6. apply one `PersonalityWeights` table to each `ScoreProfile`
7. choose the highest-scoring legal action
8. commit that chosen action to enemy plan state and Preview output
9. resolve the chosen action through canonical combat rules
10. update board state
11. repeat from step 1 until Energy is exhausted or no legal action remains

### Re-evaluation Rule
NPCs do not lock the full turn in advance. After each resolved action, the AI recalculates:
- available Energy
- usable Active chips
- legal actions
- projected resolutions
- score profiles
- chosen next action

This keeps the AI bound to the current board rather than to stale assumptions.

---

## 5. Legal Action Model

NPCs compare actions through one shared action structure.

### Legal Action Rule
A `LegalAction` is one complete selectable action instance produced by one acting chip under current board state.

A `LegalAction` is fully specified before scoring. That means:
- acting chip is fixed
- target chip is fixed if required
- chosen chips are fixed if required
- affected spaces and affected chips are fixed
- one `LegalAction` represents exactly one final legal choice branch

### Chosen-Chip Branch Rule
If a chip can select different legal chosen-chip outcomes, generate one separate `LegalAction` for each final legal chosen-chip outcome.

### Random-Outcome Rule
If a legal action contains canonical randomness:
- generate one `LegalAction`
- set `hasRandomOutcome = true`
- score the action using expected normalized category values
- do not commit random results to Preview before live resolution

### Self-Target Rule
If a chip targets itself under canonical rules:
- generate a normal `LegalAction`
- set `targetChipId = actingChipId`

### LegalAction Schema
```ts
LegalAction {
  actingChipId
  actionKind // hostile | alliedSupport | selfSupport | selfOnly
  targetChipId | null
  chosenChipIds
  affectedSpaceIds
  affectedChipIds
  hasRandomOutcome
  projectedResolution
  scoreProfile
  finalWeightedScore
}
```

### ActionKind Rules
- `hostile`: action primarily applies hostile pressure to enemy chips
- `alliedSupport`: action primarily preserves or improves allied chips
- `selfSupport`: action primarily improves or protects the acting chip
- `selfOnly`: action has no alternate target choice under current rules

The action model is shared across attacks, repair actions, shielding actions, and other targetable Active effects.

---

## 6. Projected Resolution Model

Each legal action produces one projected one-action outcome snapshot before scoring.

### ProjectedResolution Rule
`ProjectedResolution` is the fully resolved result of one legal action under canonical rules, evaluated on the current board state before live commitment.

`ProjectedResolution` is not a full-turn simulation.

### ProjectedResolution Schema
```ts
ProjectedResolution {
  actingChipId
  actionKind // hostile | alliedSupport | selfSupport | selfOnly
  targetChipId | null
  chosenChipIds
  affectedSpaceIds
  affectedChipIds
  damagePackets
  hpChanges
  shieldChanges
  statusAdds
  statusRemovals
  chipsDisabled
  frontierChanged
  newlyExposedChipIds
  powerChanged
  newlyUnpoweredChipIds
  newlyPoweredChipIds
  coreStillProtected
}
```

### ProjectedResolution Subschemas
```ts
DamagePacket {
  sourceChipId
  targetChipId
  amount
  ignoresShield
}
```

```ts
HPChange {
  chipId
  delta
}
```

```ts
ShieldChange {
  chipId
  delta
}
```

```ts
StatusApplication {
  chipId
  statusName
  amount
}
```

```ts
StatusRemoval {
  chipId
  statusName
  amount
}
```

### Field Rules
- `damagePackets`: ordered list of `DamagePacket` objects created by the legal action
- `hpChanges`: ordered list of `HPChange` objects caused by the legal action
- `shieldChanges`: ordered list of `ShieldChange` objects caused by the legal action
- `statusAdds`: ordered list of `StatusApplication` objects added by the legal action
- `statusRemovals`: ordered list of `StatusRemoval` objects caused by the legal action
- `chipsDisabled`: chip ids projected to become disabled after the legal action resolves
- `frontierChanged`: `true` if frontier membership changes after the legal action
- `newlyExposedChipIds`: chip ids that become newly reachable deeper targets after frontier changes
- `powerChanged`: `true` if live power coverage changes after the legal action
- `newlyUnpoweredChipIds`: chip ids that lose Powered state after the legal action
- `newlyPoweredChipIds`: chip ids that gain Powered state after the legal action
- `coreStillProtected`: `true` if the defending Core remains protected from default hostile targeting after this legal action resolves

Every score category must read from current board state plus `ProjectedResolution` and from explicitly defined helper functions only.

---

## 7. Threat and Value Helper Functions

### 7.1 nextPlayerThreatEstimate(chipId)
This function estimates whether one allied chip would be disabled on the next player turn.

#### Definition
A chip counts as **would be disabled on the next player turn** if:

`current HP + current Shield + projected allied HP gain + projected allied Shield gain <= estimated incoming player damage`

#### estimatedIncomingPlayerDamage
For the evaluated chip, compute the sum of the **two highest single-activation hostile damage outcomes** currently legal against that chip after the evaluated enemy legal action resolves.

#### Selection Rules
- use the post-`ProjectedResolution` board state
- consider only currently usable player Active attack chips
- consider only currently legal hostile targets and canonical shapes
- evaluate each candidate player activation independently on the post-action board
- do not simulate sequential player board changes between the first and second estimated attack
- use at most one activation per currently usable player Attack chip unless canonical rules explicitly allow multiple activations
- ignore hypothetical future player support before attack
- ignore future turns beyond the next player turn
- cap the estimate at 2 activations for current prototype scope
#### Output
- if estimated incoming damage is enough to reduce the chip to 0 or below, return `true`
- otherwise return `false`

### 7.2 projectedCombatValue(chipId)
This function estimates the board value of keeping one allied chip alive for its owner's next turn.

#### Definition
```ts
projectedCombatValue =
  baseRoleValue
  + poweredBonus
  + survivalBonus
  + coreProtectionBonus
```

#### baseRoleValue
- Core: not used in support-target scoring
- Pylon: 3
- Relay: 2
- Attack Active chip: 4
- Support Active chip: 3
- Passive defensive/support chip: 2
- Bulkhead: 1

#### poweredBonus
- +2 if the chip is Powered and the chip is one of:
  - an Attack Active chip
  - a Support Active chip whose canonical payload uses a shape or primaryStat changed by power colors
  - a Passive support chip whose canonical effect expands or strengthens through Powered state
- else +0

#### survivalBonus
- +2 if the chip is projected to survive to its owner's next turn
- else +0

#### coreProtectionBonus
- +2 if disabling this chip would materially reduce Core protection by exposing a nearer lane, removing shielding or repair coverage, or removing live defensive power support
- else +0

This function replaces vague “high-value chip” language everywhere in the AI system.

---

## 8. Score Profile Model

Each legal action is translated into one neutral bounded score object before personality weights apply.

### ScoreProfile Schema
```ts
ScoreProfile {
  projectedCoreDamage
  projectedDisablementValue
  projectedPylonDamage
  projectedRelayDamage
  projectedAttackChipDamage
  projectedSupportChipDamage
  projectedBreachWidening
  projectedPoweredTargetDisruption
  projectedCoreDefenseRemoval
  projectedPoweredThreatPreservation
  projectedCoreDefensePreservation
  projectedRepairValue
  projectedShieldValue
}
```

### Normalization Rule
Every score category must output an integer in the range `0` to `3`.
- `0` = no value
- `1` = low value
- `2` = medium value
- `3` = high value

Raw board outcomes must be normalized to this scale before personality weights apply.

Fields that do not apply to a legal action resolve to `0`.

### Final Weighted Score Rule
For each legal action:

```ts
finalWeightedScore = Σ(categoryValue * categoryWeight)
```

Additional rules:
- category values are normalized integers `0` to `3`
- category weights are integers `0` to `5`
- no floating point is used
- no negative category values are used
- no post-weight normalization is used
- no separate action-kind multiplier is used

---

## 9. Score Category Definitions

### 9.1 projectedCoreDamage
Value produced by hostile Core damage from this legal action.
- `0`: no Core damage
- `1`: 1 Core damage
- `2`: 2 Core damage
- `3`: 3 or more Core damage, or any Core hit that creates immediate lethal threshold pressure

### 9.2 projectedDisablementValue
Value produced by disabling one or more enemy chips during this legal action.
- `0`: disables nothing important
- `1`: disables one low-value non-Core chip
- `2`: disables one medium-value chip or one structural chip
- `3`: disables Core, a key Attack chip, or a key routing/protection chip

### 9.3 projectedPylonDamage
Value produced by damaging enemy Pylons.
- `0`: no Pylon damage
- `1`: minor Pylon damage with no immediate structural effect
- `2`: meaningful Pylon damage or one Pylon disable that weakens coverage
- `3`: Pylon damage that materially reduces enemy live power support to important chips

### 9.4 projectedRelayDamage
Value produced by damaging enemy Relays.
- `0`: no Relay damage
- `1`: minor Relay damage with no immediate routing effect
- `2`: meaningful Relay damage or one Relay disable that weakens routing
- `3`: Relay damage that materially changes enemy live power coverage to important chips

### 9.5 projectedAttackChipDamage
Value produced by damaging enemy Attack chips.
- `0`: no Attack-chip damage
- `1`: low-value damage to one Attack chip
- `2`: meaningful damage to one important Attack chip or minor damage to multiple Attack chips
- `3`: Attack-chip damage that materially reduces enemy offensive output this cycle

### 9.6 projectedSupportChipDamage
Value produced by damaging enemy Support chips.
- `0`: no Support-chip damage
- `1`: low-value damage to one Support chip
- `2`: meaningful damage to one important Support chip or minor damage to multiple Support chips
- `3`: Support-chip damage that materially reduces enemy repair, shielding, or utility support

### 9.7 projectedBreachWidening
Value produced by making deeper enemy chips more reachable after this legal action resolves.
- `0`: no meaningful access change
- `1`: weakens a frontier lane without opening deeper pressure yet
- `2`: opens one new inward path to a deeper occupied chip
- `3`: opens Core-adjacent or routing-critical depth

### 9.8 projectedPoweredTargetDisruption
Value produced by damaging or disabling currently Powered enemy chips, or by removing routing that supports them.
- `0`: no powered-target disruption
- `1`: damages one currently Powered non-Core chip
- `2`: disables one currently Powered non-Core chip or removes one live route from an important chip
- `3`: materially strips Powered state or routing support from one important threat cluster

### 9.9 projectedCoreDefenseRemoval
Value produced by damaging or disabling chips that currently protect enemy Core access.
- `0`: no meaningful Core-defense removal
- `1`: damages one frontier sink or support layer on the Core lane
- `2`: disables one meaningful Core-protecting chip
- `3`: materially exposes a deeper Core lane or collapses one important defensive layer

### 9.10 projectedPoweredThreatPreservation
Value produced by preserving allied Powered Attack chips.
- `0`: preserves no important Powered threat
- `1`: improves survival of one allied Powered Attack chip without crossing disablement threshold
- `2`: prevents projected disablement of one allied Powered Attack chip on the next player turn
- `3`: preserves one especially important Powered threat or multiple Powered Attack chips through one action

### 9.11 projectedCoreDefensePreservation
Value produced by preserving allied chips that currently protect the Core.
- `0`: preserves no meaningful Core defense
- `1`: improves survival of one Core-protecting chip without crossing disablement threshold
- `2`: prevents projected disablement of one Core-protecting chip on the next player turn
- `3`: preserves one critical Core-defense layer or multiple important defense elements through one action

### 9.12 projectedRepairValue
Value produced by repairing allied chips.
- `0`: no meaningful repair value
- `1`: low repair that does not change next-turn survival of an important chip
- `2`: repair preserves an important Powered chip, routing piece, or Core-defense piece
- `3`: repair changes next-player-turn outcome from disabled to survives for an important allied chip

### 9.13 projectedShieldValue
Value produced by shielding allied chips.
- `0`: no meaningful shield value
- `1`: low shield value that does not change next-turn survival of an important chip
- `2`: Shield preserves an important Powered chip or Core-defense piece
- `3`: Shield changes next-player-turn outcome from disabled to survives for an important allied chip

---

## 10. Support-Action Evaluation

Support actions use the same `LegalAction` pipeline and the same weighted score system as hostile actions.

### Shared Support Rule
Allied-target support actions are legal actions and compete directly against hostile actions through the same final weighted score system.

### Support Priority Rule
When an allied-target action is evaluated, produce category values in this order of importance:
1. save an allied chip that `nextPlayerThreatEstimate` marks as disabled next turn
2. preserve one allied Powered Attack chip
3. preserve one allied chip currently protecting the Core
4. preserve one allied Pylon or Relay that maintains live power support
5. preserve the allied chip with the highest `projectedCombatValue`

### Reconstructor Target Priority Rule
When Reconstructor has multiple legal allied targets, choose the target that satisfies the earliest rule in this order:
1. repaired HP changes `nextPlayerThreatEstimate` from `true` to `false`
2. highest `projectedCombatValue` among allied Powered Attack chips
3. highest `projectedCombatValue` among allied chips currently protecting the Core
4. highest `projectedCombatValue` among allied Pylons and Relays maintaining live power support
5. highest `projectedCombatValue` among remaining legal allied targets
6. shared tie-break standard

### Stabilizer Target Priority Rule
When Stabilizer has multiple legal allied targets, choose the target that satisfies the earliest rule in this order:
1. Shield changes `nextPlayerThreatEstimate` from `true` to `false`
2. highest `projectedCombatValue` among allied Powered Attack chips
3. highest `projectedCombatValue` among allied chips currently protecting the Core
4. highest `projectedCombatValue` among allied Pylons and Relays maintaining live power support
5. highest `projectedCombatValue` among remaining legal allied targets
6. shared tie-break standard

### Support-vs-Attack Competition Rule
Support actions do not bypass hostile action scoring. They compete in the same final weighted score space. If one support action has a higher final weighted score than all hostile actions, the AI chooses the support action.

---

## 11. Personality Weight Model

NPC personalities are implemented as weight presets over the shared normalized `ScoreProfile` model.

### PersonalityWeights Schema
```ts
PersonalityWeights {
  projectedCoreDamage
  projectedDisablementValue
  projectedPylonDamage
  projectedRelayDamage
  projectedAttackChipDamage
  projectedSupportChipDamage
  projectedBreachWidening
  projectedPoweredTargetDisruption
  projectedCoreDefenseRemoval
  projectedPoweredThreatPreservation
  projectedCoreDefensePreservation
  projectedRepairValue
  projectedShieldValue
}
```

### Aggressor Weights
```ts
Aggressor = {
  projectedCoreDamage: 5,
  projectedDisablementValue: 4,
  projectedPylonDamage: 2,
  projectedRelayDamage: 1,
  projectedAttackChipDamage: 3,
  projectedSupportChipDamage: 2,
  projectedBreachWidening: 3,
  projectedPoweredTargetDisruption: 2,
  projectedCoreDefenseRemoval: 3,
  projectedPoweredThreatPreservation: 2,
  projectedCoreDefensePreservation: 2,
  projectedRepairValue: 1,
  projectedShieldValue: 1
}
```

### Wrecker Weights
```ts
Wrecker = {
  projectedCoreDamage: 2,
  projectedDisablementValue: 4,
  projectedPylonDamage: 5,
  projectedRelayDamage: 5,
  projectedAttackChipDamage: 2,
  projectedSupportChipDamage: 2,
  projectedBreachWidening: 3,
  projectedPoweredTargetDisruption: 5,
  projectedCoreDefenseRemoval: 3,
  projectedPoweredThreatPreservation: 2,
  projectedCoreDefensePreservation: 2,
  projectedRepairValue: 1,
  projectedShieldValue: 1
}
```

### Bulwark Weights
```ts
Bulwark = {
  projectedCoreDamage: 3,
  projectedDisablementValue: 3,
  projectedPylonDamage: 2,
  projectedRelayDamage: 2,
  projectedAttackChipDamage: 3,
  projectedSupportChipDamage: 2,
  projectedBreachWidening: 2,
  projectedPoweredTargetDisruption: 2,
  projectedCoreDefenseRemoval: 2,
  projectedPoweredThreatPreservation: 4,
  projectedCoreDefensePreservation: 4,
  projectedRepairValue: 4,
  projectedShieldValue: 4
}
```

---

## 12. Tie-Break Rules and Controlled Randomness

### Shared Tie-Break Standard
If multiple legal actions have equal `finalWeightedScore`, break ties in this order:
1. greater `projectedCoreDamage`
2. greater `projectedDisablementValue`
3. greater `projectedBreachWidening`
4. greater `projectedPoweredTargetDisruption`
5. if both tied actions are allied-target support: greater `projectedRepairValue + projectedShieldValue + projectedCoreDefensePreservation`
6. lower acting-chip risk
7. deterministic stable ordering by acting chip id, then target chip id
8. if randomness is explicitly allowed for that personality, random among exact equals only

### Acting-Chip Risk Rule
An action has lower acting-chip risk if, after `ProjectedResolution`, the acting chip is less exposed to hostile pressure on the next player turn under the same `nextPlayerThreatEstimate` function used by support evaluation.

### Controlled Randomness Rule
- randomness is allowed only after weighted scoring and tie-break comparisons still leave exact equals
- randomness must not override a higher final weighted score
- randomness must not change a committed previewed action after commitment unless canonical rules require random target determination inside the committed action itself

---

## 13. Preview Commitment Rules

This file does not redefine Preview. It defines how NPC choice feeds Preview.

### EnemyPlanStep Schema
```ts
EnemyPlanStep {
  stepIndex
  actingChipId
  actionKind
  targetChipId | null
  chosenChipIds
  affectedSpaceIds
  committedVisibleOutcome
  hasRandomOutcome
}
```

### CommittedEnemyPlan Schema
```ts
CommittedEnemyPlan {
  planSteps
  commitmentLevel // full | partial
}
```

### Commitment Rule
After the AI chooses one legal action, generate one `EnemyPlanStep` for that action and append it to the current committed plan.

### Visible Outcome Rule
`committedVisibleOutcome` includes only data already committed under the current board state and canonical Preview rules.

### Partial Commitment Rule
If later actions would depend on unresolved randomness or future legality changes, they are not committed yet. In that case, `commitmentLevel = partial`.

### Rolling Plan Rule
After each live action resolves:
- discard any stale future plan steps
- recompute the next legal action from the new board state
- generate a new `EnemyPlanStep` for the next committed action

Preview therefore represents a rolling committed plan, not a frozen full-turn script.

---

## 14. Mid-Turn Re-evaluation Rules

NPCs do not blindly follow a stale whole-turn plan.

After each resolved action, the AI must recompute:
- available Energy
- canonical board state
- usable Active chips
- legal actions
- projected resolutions
- score profiles
- next committed action

If an earlier action removes the legality of a previously available future action, the future action is discarded and recalculated normally.

---

## 15. Implementation-Facing Schemas

```ts
DamagePacket {
  sourceChipId
  targetChipId
  amount
  ignoresShield
}
```

```ts
HPChange {
  chipId
  delta
}
```

```ts
ShieldChange {
  chipId
  delta
}
```

```ts
StatusApplication {
  chipId
  statusName
  amount
}
```

```ts
StatusRemoval {
  chipId
  statusName
  amount
}
```

```ts
LegalAction {
  actingChipId
  actionKind
  targetChipId | null
  chosenChipIds
  affectedSpaceIds
  affectedChipIds
  hasRandomOutcome
  projectedResolution
  scoreProfile
  finalWeightedScore
}
```

```ts
ProjectedResolution {
  actingChipId
  actionKind
  targetChipId | null
  chosenChipIds
  affectedSpaceIds
  affectedChipIds
  damagePackets
  hpChanges
  shieldChanges
  statusAdds
  statusRemovals
  chipsDisabled
  frontierChanged
  newlyExposedChipIds
  powerChanged
  newlyUnpoweredChipIds
  newlyPoweredChipIds
  coreStillProtected
}
```

```ts
ScoreProfile {
  projectedCoreDamage
  projectedDisablementValue
  projectedPylonDamage
  projectedRelayDamage
  projectedAttackChipDamage
  projectedSupportChipDamage
  projectedBreachWidening
  projectedPoweredTargetDisruption
  projectedCoreDefenseRemoval
  projectedPoweredThreatPreservation
  projectedCoreDefensePreservation
  projectedRepairValue
  projectedShieldValue
}
```

```ts
PersonalityWeights {
  projectedCoreDamage
  projectedDisablementValue
  projectedPylonDamage
  projectedRelayDamage
  projectedAttackChipDamage
  projectedSupportChipDamage
  projectedBreachWidening
  projectedPoweredTargetDisruption
  projectedCoreDefenseRemoval
  projectedPoweredThreatPreservation
  projectedCoreDefensePreservation
  projectedRepairValue
  projectedShieldValue
}
```

```ts
EnemyPlanStep {
  stepIndex
  actingChipId
  actionKind
  targetChipId | null
  chosenChipIds
  affectedSpaceIds
  committedVisibleOutcome
  hasRandomOutcome
}
```

```ts
CommittedEnemyPlan {
  planSteps
  commitmentLevel
}
```

---

## 16. Extension Rules

### Add a New Score Category
To add one new score category:
1. add one new normalized field to `ScoreProfile`
2. define the category in Section 9 using the `0` to `3` scale
3. add one matching weight to `PersonalityWeights`
4. update each personality preset with an explicit weight
5. include the new category in final weighted scoring

### Add a New Personality
To add one new personality:
1. do not change the shared decision pipeline
2. do not change the `LegalAction` model
3. create one new `PersonalityWeights` preset
4. add personality-specific tie-break behavior only if the shared tie-break standard is insufficient

### Add a New Support Evaluator
To add one new support behavior:
1. do not create a separate action-selection engine
2. define any target-priority rule using `nextPlayerThreatEstimate` and `projectedCombatValue`
3. map the action into existing normalized score categories before adding any new category

---

## 17. Open Questions

Remaining open questions are limited to future extension points:
- whether later bosses should use temporary overlay personality weights in addition to ship personality
- whether System Critical should modify `PersonalityWeights` dynamically or remain a board-state-only pressure change
- whether exact-equal randomness should vary by personality or remain global

---

## 18. Recommended Merge Candidates

Potential future merge candidates for the canonical GDD or companion:
- generalized enemy support-target priority rules if they become part of canonical enemy targeting
- standardized AI-facing helper naming once implementation naming is stable
- any later formal link between Preview output objects and implementation-facing UI schemas
