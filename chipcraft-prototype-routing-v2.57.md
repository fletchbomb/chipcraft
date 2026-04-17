# CHIPCRAFT — PROTOTYPE ROUTING COMPANION v2.57

**Non-canonical document.** This file is a staging and prototype-routing companion to the canonical GDD: **CHIPCRAFT — SHIP COMBAT DESIGN DOCUMENT v2.51**. The canonical GDD remains the only source of truth for approved rules, terminology, formatting style, conventions, systems structure, and implementation-facing language. This file does not override, replace, or fork the GDD. Its purpose is to organize the remaining design work required to produce a fully playable first prototype in a form that can later merge into the GDD with minimal rework.

---

## 1. Purpose of This Document

This document exists to:
- identify the remaining systems required for a playable first prototype
- preserve alignment with the canonical GDD's language, ownership boundaries, and rule structure
- stage merge-ready proposed additions before they are approved into the GDD
- separate approved assumptions, prototype proposals, open questions, and current-scope assumptions

Where a proposal depends on missing canonical rules, that dependency is stated explicitly.

---

## 2. Use Rules for This File

- Treat the canonical GDD as authoritative for all approved rules.
- Reuse canonical terms exactly where the GDD already defines them.
- Do not rewrite approved sections here unless a short approved assumption is needed to route a prototype proposal.
- Route new ideas into existing system ownership whenever possible.
- Any proposal that would change approved GDD rules must be labeled explicitly.
- Draft proposed additions in language that can later merge into the GDD with minimal structural change.

---

## 3. Staging Status Legend

Use these labels consistently in this document.

**Approved assumption**
- Carried over from the canonical GDD.
- Included only when needed to route a prototype proposal.

**Proposed prototype addition**
- Drafted in merge-ready rule language.
- Not approved until merged into the canonical GDD.

**Open question**
- Unresolved design dependency.
- Must not be read as finalized rule text.

**Current-scope assumption**
- Used for the current prototype content scope.
- Not approved until merged into the canonical GDD.

---

## 4. Locked Assumptions Inherited from the GDD

The following are treated as approved assumptions carried over from the canonical GDD and are not redefined here:
- core terminology and ownership boundaries
- ship geometry, frontier, access, and targeting defaults
- power colors, fusion, relay propagation, and Energy rules
- chip classes, shape vocabulary, and effect-resolution grammar
- content catalog entries already present in the Chip Registry and chip definitions
- modifier categories, status definitions, and timing hooks
- combat timing framework, damage pipeline, win / loss conditions, and Systems Critical
- persistence, prefixes, suffixes, flaws, repair, and display-name rules for non-Core chips
- economy structure, cost bands, route grammar, and balance targets already authored
- enemy targeting framework and archetype weighting language
- implementation specification naming and schema style
- validation philosophy and canonical invariant style

This document may propose additions required to make the current ruleset playable, but any proposal that conflicts with or changes the above must be labeled as requiring a GDD update.

---

## 5. Prototype Decisions to Support a First Playable Loop

### 5.1 Run Start — Player Ship Construction

**Approved assumption**
- A ship frame is the fixed set of legal spaces available to a ship.
- Each ship has 1 Core.
- Chips are the only gameplay-bearing objects placed in spaces.
- Between combats, chips may be rearranged among legal spaces unless another rule forbids it.

**Proposed prototype addition**

#### Starting Loadout Rule
At run start, the player begins with:
- 1 predefined ship frame
- 1 matching Core
- a fixed owned chip inventory
- starting scrap equal to 0

The first prototype uses one starter loadout only.

#### Starting Inventory — Scout Prototype
Starting frame: Scout Frame.  
Starting Core: Scout Core.

Starting owned chip pool:
- 1 Pylon
- 1 Relay
- 2 Cannon
- 1 Shield Emitter
- 1 Plating
- 1 Bulkhead
- 1 Stabilizer

#### Opening Build Rule
Before tutorial combat begins, the player must submit 1 legal Scout layout using the starting owned chip pool.

Tutorial combat cannot begin until:
- Scout Core is placed in a legal Scout space
- every placed non-Core chip occupies a legal Scout space
- no space contains more than 1 chip

The opening build screen uses the same layout-building pathway as all later pre-combat rebuilds.

**Current-scope assumption**
- The first prototype does not include starter-loadout selection, class selection, or random starting ships.

---

### 5.2 Reserve and Pre-Combat Rebuild

**Approved assumption**
- Between combats, chips may be rearranged among legal spaces unless another rule forbids it.

**Proposed prototype addition**

#### Pre-Combat Rebuild Rule
Before every combat encounter, the player may freely rearrange owned chips into any legal ship layout for the current ship frame.

#### Active Layout Rule
For a given combat encounter, only chips placed in legal spaces are part of the active ship layout.

#### Derived Reserve Rule
Owned chips not placed in legal spaces for that combat remain in reserve.

Reserve is not stored as its own state bucket. Reserve for the current combat is always:
- every chip in `ownedChipIds` that is not in `activeLayoutChipIds`

Reserve chips:
- remain owned
- are not in the active ship layout
- do not provide combat effects
- do not count as occupying spaces

#### Placement Constraint Rule
The limiting factor on active ship construction is legal ship-frame space count, not owned chip count.

**Current-scope assumption**
- The current content scope allows free and unlimited between-combat rebuild.
- The current content scope does not impose a reserve cap.

---

### 5.3 Enemy Ship Construction

**Approved assumption**
- Enemy ships use the same shared targeting system and weight presets only.
- No enemy uses custom targeting logic outside that framework.
- Core and Pylon are chip types, not special space types.

**Proposed prototype addition**

#### Enemy Construction Rule
Each enemy ship is authored as a legal ship layout built from:
- 1 ship frame
- 1 Core
- a fixed chip list
- fixed initial chip placements
- 1 archetype weight preset from Section 12 of the canonical GDD

Enemy ships follow the same geometry, power, frontier, combat, timing, and disablement rules as the player unless an approved content rule says otherwise.

#### Enemy Authoring Standard
Each prototype enemy entry declares:
- frame
- Core type
- archetype preset
- chip list
- default layout
- combat ask
- layout rule
- tuning goal

Enemy entries do not invent bespoke targeting, custom timing windows, or custom access rules.

**Current-scope assumption**
- The current content scope uses fixed enemy layouts only.

**Open question**
- The canonical GDD currently provides enemy targeting logic but not a merge-ready enemy-ship catalog format. That likely needs a future appendix or encounter-authoring section.

---

### 5.4 Encounter Generation

**Approved assumption**
- The canonical GDD already defines node grammar including standard combat, elite combat, boss, shop, event, and Dry Dock.

**Proposed prototype addition**

#### Encounter Entry Rule
Each combat encounter is generated from an authored encounter entry.

```ts
EncounterEntry {
  id
  tier // tutorial | standard | elite | boss
  enemyShipId
  rewardBand // standard | elite | boss
  poolTag // tutorial | standard | elite | boss
  uniqueUntilPoolExhausted // boolean
}
```

#### Encounter Pool Rule
Combat encounters are grouped into authored encounter pools.

```ts
EncounterPool {
  poolTag
  encounterIds
}
```

#### Route Request Rule
Each combat node requests 1 `EncounterEntry` from the `EncounterPool` matching that node's tier.

#### Reward Routing Rule
Reward payout uses `rewardBand`, not ad hoc node logic.

#### Duplicate Prevention Rule
If `uniqueUntilPoolExhausted = true`, an encounter entry may not repeat until all other legal entries in that pool have been used once.

#### Encounter Teaching Sequence Rule
The first playable route uses encounter roles that test different rebuild priorities.

Prototype encounter roles:
- tutorial combat = opening-board readability and first legal build
- standard combat A = Powered-chip punishment test
- standard combat B = Core-depth and breach-focus test
- elite combat = scaling and preview-response test
- boss combat = larger-frame routing and defended-lane test

**Current-scope assumption**
- Event nodes may be omitted until the combat, shop, and Dry Dock loop is stable.

---

### 5.5 First Prototype Enemy Roster

**Approved assumption**
- Existing archetype presets are Aggressor, Wrecker, and Bulwark.

**Proposed prototype addition**

#### Prototype Enemy Roster Standard
The first prototype includes a small authored roster that demonstrates the targeting presets and the current chip catalog without adding new combat systems.

#### Standard Encounter Roster

**Raider Skiff**
- frame: Scout Frame
- Core: Scout Core
- archetype: Aggressor
- chip list:
  - 1 Breacher
  - 2 Cannon
  - 1 Pylon
  - 2 Bulkhead
- combat ask: can the player win a simple frontier damage race
- layout rule: 2 forward pressure Attack chips, minimal interior protection, readable first breach lane
- tuning goal: if the player delays damage too long, tempo loss becomes visible immediately
- default layout:
  - (2,0) = Breacher
  - (1,1) = Cannon
  - (2,1) = Pylon
  - (3,1) = Cannon
  - (1,2) = Bulkhead
  - (2,2) = Scout Core
  - (3,2) = Bulkhead

**Breaker Skiff**
- frame: Scout Frame
- Core: Scout Core
- archetype: Wrecker
- chip list:
  - 1 Saboteur
  - 1 Cannon
  - 1 Scope
  - 1 Pylon
  - 1 Relay
  - 1 Bulkhead
- combat ask: can the player protect Powered chips and reroute around weak frontier placement
- layout rule: the forward attack lane punishes exposed Powered chips rather than relying on direct infrastructure sniping
- tuning goal: by early combat, shallow Powered placement creates visible punishment
- default layout:
  - (2,0) = Saboteur
  - (1,1) = Cannon
  - (2,1) = Pylon
  - (3,1) = Scope
  - (1,2) = Relay
  - (2,2) = Scout Core
  - (3,2) = Bulkhead

**Guard Skiff**
- frame: Scout Frame
- Core: Scout Core
- archetype: Bulwark
- chip list:
  - 1 Shield Emitter
  - 1 Reconstructor
  - 1 Cannon
  - 1 Pylon
  - 2 Bulkhead
- combat ask: can the player create a breach instead of trading shallow frontier hits indefinitely
- layout rule: defensive shell with protected targeted repair support
- tuning goal: focused breach pressure beats even damage spread
- default layout:
  - (2,0) = Bulkhead
  - (1,1) = Shield Emitter
  - (2,1) = Pylon
  - (3,1) = Bulkhead
  - (1,2) = Reconstructor
  - (2,2) = Scout Core
  - (3,2) = Cannon

#### Elite Encounter Roster

**Siege Skiff**
- frame: Scout Frame
- Core: Scout Core
- archetype: Aggressor
- chip list:
  - 1 Siege Gun
  - 2 Cannon
  - 1 Pylon
  - 1 Relay
  - 2 Bulkhead
- combat ask: can the player answer scaling pressure before delay becomes fatal
- layout rule: protect at least 1 scaling Attack chip behind a first breach layer
- tuning goal: passive stalling fails
- default layout:
  - (2,0) = Bulkhead
  - (1,1) = Cannon
  - (2,1) = Pylon
  - (3,1) = Bulkhead
  - (1,2) = Relay
  - (2,2) = Siege Gun
  - (3,2) = Cannon
  - (2,3) = Scout Core

**Wiretap Skiff**
- frame: Scout Frame
- Core: Scout Core
- archetype: Wrecker
- chip list:
  - 1 Piercer
  - 1 Saboteur
  - 1 Scope
  - 1 Cannon
  - 1 Pylon
  - 1 Relay
  - 1 Bulkhead
- combat ask: can the player use preview and placement to manage targeted disruption
- layout rule: attack lanes threaten Powered support or routing-critical chips
- tuning goal: enemy preview becomes tactically valuable, not decorative
- default layout:
  - (2,0) = Piercer
  - (1,1) = Saboteur
  - (2,1) = Pylon
  - (3,1) = Scope
  - (1,2) = Relay
  - (2,2) = Scout Core
  - (3,2) = Cannon
  - (2,3) = Bulkhead

**Bastion Skiff**
- frame: Scout Frame
- Core: Scout Core
- archetype: Bulwark
- chip list:
  - 1 Shield Emitter
  - 1 Reconstructor
  - 1 Beam
  - 1 Plating
  - 1 Pylon
  - 2 Bulkhead
- combat ask: can the player defeat a durable ship with protected repair and sustained pressure
- layout rule: durable shell with protected targeted repair support and 1 interior scaling threat
- tuning goal: focused pressure beats random chip trading
- default layout:
  - (2,0) = Bulkhead
  - (1,1) = Shield Emitter
  - (2,1) = Pylon
  - (3,1) = Bulkhead
  - (1,2) = Reconstructor
  - (2,2) = Scout Core
  - (3,2) = Beam
  - (2,3) = Plating

**Current-scope assumption**
- The first roster keeps standard and elite encounters on Scout Frame even if the boss escalates to a larger frame.

---

### 5.6 Enemy Preview for Prototype Play

**Approved assumption**
- The canonical GDD already defines Preview, Preview Truth Framework, and enemy targeting behavior.

**Proposed prototype addition**

#### Enemy Preview Operational Rule
At the start of the player turn, compute the enemy's next turn sequence from the current board state and current available Energy using the existing enemy targeting framework.

#### Preview Contents Rule
Where truthful under existing preview rules, preview shows for each committed enemy activation:
- acting chip
- target chip
- affected spaces
- chosen chips if already deterministic from current information
- raw payload result if current information makes that result committed

#### Preview Limitation Rule
If later enemy activations depend on unresolved randomness or unresolved earlier state changes, preview shows only the committed information allowed by the Preview Truth Framework.

#### Preview Scope Rule
Preview is a gameplay information system for the current content scope. This companion describes the full preview rules required for that scope.

---

### 5.6A Enemy Support-Target Scoring

**Proposed prototype addition**

#### Enemy Support Activation Scoring Rule
When an enemy Active chip targets allied chips, score legal support activations in this order:
1. prevent projected disablement on the next player turn
2. preserve a Powered allied Attack chip
3. preserve an allied chip currently protecting the Core
4. preserve an allied Pylon or Relay that maintains live power colors
5. preserve the allied chip with the highest projected next-turn combat value
6. apply the shared tie-break standard

#### Reconstructor Target Priority Rule
When Reconstructor has multiple legal allied targets, choose in this order:
1. a target whose repaired HP changes projected survival from disabled next turn to survives next turn
2. otherwise the highest-value Powered allied Attack chip
3. otherwise the highest-value allied defensive or support chip protecting the Core
4. otherwise the most damaged allied chip
5. apply the shared tie-break standard

#### Routing Note
This section extends the existing enemy-targeting framework to allied-target support activations. It does not create custom enemy logic per ship.

**Open question**
- If the canonical GDD keeps enemy scoring restricted to hostile-output categories only, this support-target scoring branch would require a GDD update before defensive enemy ships can behave as authored.

---

### 5.7 Shop Rules and Content Flow

**Approved assumption**
- The canonical GDD already defines chip values, tier cost bands, shop generation counts, repair availability, reroll cost, and infrastructure-offer structure.

**Proposed prototype addition**

#### Shop Entry Rule
When the player enters a shop node, generate 1 shop inventory using the existing Inventory Rules and Availability Rules from the canonical GDD.

#### Shop Inventory Presentation Rule
A shop inventory contains:
- 2 chip offers
- 1 infrastructure offer
- 1 wildcard offer
- 1 repair action offered separately
- 1 reroll action

#### Shop Role Bucket Rule
For the first prototype, shop generation usually presents:
- 1 damage-pressure option
- 1 defense or support option
- 1 layout or routing option
- 1 flexible fourth option

#### Prototype Shop Slot Rule
For the first prototype, inventory generation targets this structure:
- slot 1 = Attack offer
- slot 2 = Support offer
- slot 3 = Infrastructure offer
- slot 4 = wildcard weighted by run progress

#### Purchase Rule
On purchase:
- spend scrap equal to the authored cost
- add the purchased chip to owned chip inventory
- do not require immediate placement if no legal space is available

Purchased chips that are not placed remain in reserve until the next pre-combat rebuild or other layout-management timing.

**Current-scope assumption**
- Shop value is tuned around placement competition and frame-fit pressure rather than inventory scarcity.

---

### 5.7A Owned Inventory, Active Layout, and Run State

**Proposed prototype addition**

#### Run State Rule
Prototype run-state stores ownership and active layout directly.

```ts
RunState {
  scrap
  frameClass
  ownedChipIds
  activeLayoutChipIds
  routePosition
  encounterHistory
}
```

Field meanings:
- `scrap`: current spendable run currency
- `frameClass`: current ship frame class
- `ownedChipIds`: all non-Core chips currently owned in the run
- `activeLayoutChipIds`: owned chips currently placed in the active ship layout
- `routePosition`: current node position in the run route
- `encounterHistory`: ordered list of resolved `EncounterEntry.id` values already used during the run

#### Inventory Window Rule
The inventory window displays all owned chips.

Inventory window display state:
- chips in `activeLayoutChipIds` are marked as placed
- all other owned chips are marked as unplaced

#### Inventory Interaction Rule
- buying a chip adds that chip to `ownedChipIds`
- buying a chip does not auto-place it
- placing a chip into the ship adds it to `activeLayoutChipIds`
- removing a chip from the ship removes it from `activeLayoutChipIds`
- a combat uses only chips in `activeLayoutChipIds`
- all other owned chips are inactive for that combat

---

### 5.8 Dry Dock / Repair / Upgrade Rules

**Approved assumption**
- Dry Dock generation already exists in the canonical GDD.
- Repair one Flaw is already defined as a costed action.
- Frigate and Cruiser upgrades already exist as economy purchases.

**Proposed prototype addition**

#### Dry Dock Entry Rule
When the player enters a Dry Dock node, generate 1 Dry Dock inventory containing:
- 1 repair action
- 1 pylon offer
- 1 frame-upgrade offer if eligible
- 1 infrastructure or support offer oriented toward layout utility

#### Repair Action
Remove 1 Flaw from 1 owned chip for the existing authored repair cost.

#### Pylon Offer Rule
Dry Dock may offer 1 Pylon for the existing authored pylon cost.

#### Frame Upgrade Rule
A frame upgrade service replaces the player's current ship frame with the next larger frame size and automatically inserts the matching Core required by that frame size.

Scout to Frigate upgrade:
- remove Scout Core
- replace Scout Frame with Frigate Frame
- add Frigate Core

Frigate to Cruiser upgrade:
- remove Frigate Core
- replace Frigate Frame with Cruiser Frame
- add Cruiser Core

#### Core Upgrade Rule
Core is a structural ship component for frame-class progression. Core does not participate in history, Flaws, prefixes, suffixes, or non-Core persistence processing.

#### Upgrade Migration Rule
When a frame upgrade occurs:
- all non-Core owned chips remain owned
- the player must produce a legal post-upgrade layout before leaving Dry Dock
- newly added legal spaces begin empty unless filled during rearrangement
- chip history, Flaws, and persistent tracked data remain on surviving non-Core owned chips

#### Upgrade Pacing Target
Current content-scope economy targets this progression:
- a strong run may afford Scout to Frigate after node 4
- a good run usually sees 1 meaningful chance to buy Scout to Frigate by node 7
- Frigate to Cruiser remains mostly outside normal first-prototype balance

**Current-scope assumption**
- Between-combat rearrangement is free and unlimited, making Dry Dock valuable mainly for repair, pylon acquisition, and frame upgrade.

---

### 5.9 Between-Combat Reset and Persistence Cleanup

**Approved assumption**
- The canonical GDD already defines persistence history, flaws, repair, prefix and suffix updates, and some combat-end reset behavior such as Beam charge and Siege reset timing.

**Proposed prototype addition**

#### Non-Core Persistence Ownership Rule
Between-combat persistence processing applies to non-Core owned chips only.

Core is excluded from:
- history
- Flaws
- prefixes
- suffixes
- all non-Core persistence updates

#### Between-Combat Cleanup Rule
After a combat win and before the next combat begins, process cleanup in this order:
1. apply combat result
2. update non-Core persistence history
3. add Flaws for non-Core chips disabled this combat
4. destroy non-Core chips if Flaw rules require it
5. clear combat-only statuses
6. clear combat-only counters unless a chip rule says otherwise
7. restore surviving non-Core owned chips to current max HP
8. clear temporary Shield
9. clear preview state
10. allow pre-combat rebuild before the next encounter

#### Combat-Only Clearing Standard
For the current content scope, treat the following as clearing between combats:
- Mark
- Shield
- Shock
- Fire
- Jammed
- Overload
- Beam charge
- Siege
- activation-used flags
- preview state

#### Post-Combat Survival Rule
A disabled non-Core chip that survives combat remains owned unless flaw rules destroy it after combat.

**Current-scope assumption**
- Full HP restoration between combats is used to isolate ship-building, power, routing, and targeting decisions from campaign HP attrition.

**Open question**
- Resetting HP to current max HP after combat is not explicitly stated in the canonical GDD. Approving that behavior would require a GDD update.

---

### 5.10 Boss Design for the First Prototype

**Approved assumption**
- Boss combat already exists in the route.
- Prefixes and persistence reference surviving a boss.

**Proposed prototype addition**

#### Prototype Boss Standard
The first prototype boss is authored through the same pathway as other enemy ships:
- fixed frame
- fixed Core
- fixed archetype
- fixed chip list
- fixed legal layout
- fixed boss encounter entry

The first prototype boss does not use bespoke phase scripting, adds, invulnerability windows, or custom targeting logic.

#### Boss Entry — Bastion Cruiser
- frame: Frigate Frame
- Core: Frigate Core
- archetype: Bulwark
- combat ask: can the player break a defended lane, disrupt a live power network, and survive sustained pressure long enough to reach the Core
- chip list:
  - 2 Pylons
  - 2 Relays
  - 1 Beam
  - 1 Cannon
  - 1 Shield Emitter
  - 1 Reconstructor
  - 2 Bulkheads
- default layout:
  - (4,0) = Beam
  - (3,1) = Shield Emitter
  - (4,1) = Relay
  - (5,1) = Bulkhead
  - (1,2) = Relay
  - (2,2) = Frigate Core
  - (4,2) = Cannon
  - (1,3) = Pylon
  - (3,3) = Reconstructor
  - (4,3) = Pylon
  - (5,3) = Bulkhead

#### Boss Reward Rule
Defeating the first prototype boss ends the run and counts as boss survival for non-Core persistence history.

---

### 5.11 Run Loop for the First Prototype

**Approved assumption**
- The canonical GDD already defines a full 15-node route.

**Proposed prototype addition**

#### First Prototype Route Rule
The first playable loop may use a shortened route while preserving canonical node grammar.

Recommended current route:
1. tutorial combat
2. standard combat A
3. shop
4. standard combat B
5. Dry Dock
6. elite combat
7. shop
8. boss

#### Elite Reward Positioning Rule
For the current content scope:
- elite combat awards the upper half of the existing elite scrap band
- the next node after elite combat is Shop in the current route

#### Prototype Win Condition
The run is won by defeating the prototype boss.

#### Prototype Loss Condition
The run is lost if the allied Core is disabled during a combat encounter.

#### Tutorial Combat Standard
The tutorial combat is readable and solvable from any legal opening Scout layout built from the starting chip pool.

**Current-scope assumption**
- Event nodes may be omitted from the current route until event content exists.

**Open question**
- If the 15-node structure is intended to be canonically required even for first-playable validation, this shortened route must remain a current-scope assumption rather than a merge candidate.

---

### 5.12 Prototype Scope Boundaries

**Proposed prototype addition**

#### Included in Current Scope
The current playable scope includes:
- 1 fixed starter chip pool and legal opening-build requirement
- pre-combat rebuild before every combat
- reserve as unplaced owned chips
- authored standard, elite, and boss encounters
- 1 small enemy roster using current archetypes
- shops, Dry Dock, repair, and frame upgrade
- persistence, flaws, and post-combat cleanup
- 1 authored playable run loop ending in a fixed boss encounter

#### Excluded from Current Scope
The current playable scope does not require:
- multiple starter ships
- class selection
- randomized enemy ship construction
- bespoke boss subsystems
- event-content completion
- custom enemy targeting logic outside the shared framework
- metaprogression systems
- narrative or faction layers
- additional reward currencies

---

## 6. Proposed Content Additions

### 6.1 Prototype Chip Candidate

**Proposed prototype addition**

#### Volley Gun
role: lane-pressure weapon  
category: Attack  
chipClass: Active  
HP: 4  
primaryStat: damage  
value: 3

target: 1 legal enemy frontier chip.  
shape: Fan  
chosen chips: choose up to 2 enemy affected chips.  
payload: Deal 1 damage to each chosen chip.

**Open question**
- Adding Volley Gun would require a GDD update to the Chip Registry, Attack chip catalog, backend value references, and implementation-facing content tables.

## 7. Open Questions / Unresolved Items

- full-sequence preview display rules are not yet implementation-facing
- between-combat HP restoration is not yet approved in the canonical GDD

## 8. Tuning Pending

- Bastion Cruiser may require coordinate tuning after repeated combat testing if live play shows its pressure lanes or shell depth are not producing the intended fight
- Breaker Skiff may require 1 further authored-coordinate adjustment if repeated testing shows its Powered-target punishment is not visible enough from the opening board state

## 9. Current-Scope Assumptions

These assumptions make the current playable loop possible but should not be treated as approved without GDD merge.

- full rebuild is allowed before every combat
- reserve has no cap
- event nodes may be omitted from the current route
- the current route may use 8 nodes instead of the canonical full route
- full HP restoration occurs between combats
- the first roster keeps standard and elite encounters on Scout Frame
- the first boss uses no bespoke scripting
- a successful run is expected to have 1 meaningful chance to purchase Scout to Frigate before the boss

## 10. Recommended Next Merge Candidates for the GDD

Most ready:
1. pre-combat rebuild and derived reserve definitions
2. between-combat cleanup pipeline
3. frame-upgrade migration rule
4. encounter entry and enemy authoring standards
5. enemy support-target scoring rule

Next after tuning:
6. prototype enemy roster and layout catalog once tuning validates the authored layouts
7. Frigate-frame boss entry once tuning validates the authored layout
8. shortened current route rule, if kept
9. full-sequence enemy preview operational language
10. Volley Gun, if testing shows it fills a real content gap cleanly
