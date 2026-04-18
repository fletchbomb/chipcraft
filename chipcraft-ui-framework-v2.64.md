[chipcraft-ui-framework-v2.65.md](https://github.com/user-attachments/files/26856247/chipcraft-ui-framework-v2.65.md)
# CHIPCRAFT — UI FRAMEWORK COMPANION v2.65
This companion defines how Chipcraft surfaces game state and accepts input across battle, rebuild, route, shop, and Dry Dock.

The canonical GDD remains the only source of truth for gameplay rules, terminology, construction legality, mode-independent state concepts, targeting, timing, shapes, power, statuses, chip behavior, and combat data.

This file owns screen architecture, interaction flow, preview presentation, contextual surfaces, overlays, motion language, and implementation-facing UI state contracts.

Mode companions may determine which surfaces, content sets, and actions are active in a given mode, but they do not become source-of-truth parents for UI behavior.

The NPC AI spec may provide enemy commitment and preview input objects consumed by UI, but it does not own general UI behavior.

UI consumes gameplay truth from those documents and does not re-implement gameplay logic.

---

## 1. Purpose
This file owns:
- screen layout and information placement
- interaction states and input flow
- preview, confirmation, inspection, and overlay behavior
- reusable UI surfaces and components
- implementation-facing UI state contracts

This file translates existing systems into visible and touchable behavior for direct coding.

---

## 2. Core Design Rules

### 2.1 Landscape Rule
Chipcraft is authored for landscape first.

### 2.2 Chip-First Rule
Chips are the primary visual and interactive objects in battle and rebuild.

### 2.3 Subtle Board Rule
Spaces and hull framing support placement, range, and spatial readability without overpowering chips.

### 2.4 Illustrative Hull Rule
Legal ship area is framed by a thematic ship silhouette rather than a loud abstract grid.

### 2.5 Icon-First Rule
Battle state is communicated primarily through chip art, glows, iconography, numerics, and board previews.

### 2.6 Text Restraint Rule
Text appears only for focused detail, compact preview summary, event log messaging, and expanded overlays.

### 2.7 Truthful Preview Rule
Preview shows only outcomes supported by current board state and canonical gameplay rules.

### 2.8 Shared Playback Rule
Player, enemy, passive, and auto actions use one playback language for source, target, effect, and result.

### 2.9 Contextual Surface Rule
Local detail appears only while context is active, updates in place while context persists, and clears when context ends.

### 2.10 Shared Motion-and-Feedback Rule
Transitions, contextual surfaces, battle actions, state changes, glows, overlays, and build interactions use one motion language that is slick, snappy, slightly playful, readable, brief, and satisfying. Motion reinforces clarity and feel without slowing tactical flow.

---

## 3. Information Model

### 3.1 Immediate Layer
Board, chips, HUD, glows, target markers, confirms, and on-chip numerics/icons.

### 3.2 Context Layer
Flyouts and focused detail surfaces.

### 3.3 Expanded Layer
Full-screen overlays for glossary, deep chip detail, and expanded log views.

### 3.4 Battle Always-Visible Information
- both ships and all chips
- chip HP
- chip primary stat
- power state
- ready-state glow for usable Active chips
- on-chip status icons
- both Core HP values
- current source focus
- legal target highlights
- preview overlays
- top HUD

### 3.5 Battle Contextual Information
- confirm anchor
- active contextual flyout content
- focused enemy committed-threat readout
- playback readout

### 3.6 Rebuild Always-Visible Information
- current frame geometry
- active layout on ship
- available chip inventory for the active mode
- live power feedback on ship
- continue control

### 3.7 Rebuild Contextual Information
- legal placement preview for the currently focused or dragged placeable chip
- active rebuild contextual flyout content

---

## 4. Shared Screen Architecture

### 4.1 Primary Surfaces
- battle
- rebuild
- route
- shop
- Dry Dock
- glossary / settings / pause overlays

### 4.2 Surface Style Rule
Battle and rebuild are continuous scenes supported by lightweight floating modules rather than rigid application-style panels.

### 4.3 Overlay Rule
Expanded detail, glossary content, and deep log history open in temporary overlays that return to the exact prior state when dismissed.

---

## 5. Battle Layout

### 5.1 Battle Goal
Battle lets the player read the tactical state, inspect local detail quickly, and commit one legal action at a time with truthful previews.

### 5.2 Spatial Layout
- friendly ship occupies the left half of the screen
- enemy ship occupies the right half of the screen
- a fixed one-row top HUD sits above the board
- friendly contextual flyout anchors bottom-left
- enemy contextual flyout anchors bottom-right
- expanded overlays sit above the battle scene when opened

### 5.3 Board Readability
For every occupied combat space, the player can identify at a glance:
- owner
- art-driven chip identity
- HP state
- primary stat
- disabled state when applicable
- power state
- priority status state

### 5.4 Disabled-Hole Rule
Disabled chips resolve into a stable exposed-hole representation.

### 5.5 Power Readability
Power is readable directly on the board through glow plus icon treatment. Preview also shows power changes caused by the current action when the rules engine supports that preview.

### 5.6 Enemy Committed Threat
Committed enemy threat is visible in two layers:
- board layer for quick tactical reading
- focused enemy-flyout readout when the player taps an enemy chip that has committed to an action
- expanded overlay for ordered committed-plan detail within canonical preview limits

---

## 6. Top HUD

### 6.1 Role
The top HUD owns only global battle state.

### 6.2 Contents
- phase / turn state
- player Energy icon with current / max value
- compact friendly readiness strip
- one-line latest-event ticker
- encounter or boss icon when relevant
- menu / pause access

### 6.3 Layout Rule
Top HUD is a fixed single row.

### 6.4 Readiness Strip
The readiness strip:
- displays mini chip visuals for friendly Active-chip availability
- communicates ready / spent state through visual treatment
- serves as a passive scan surface
- shows up to 5 visible mini-chip icons, then compresses additional items into a chip-shaped +N overflow token

### 6.5 Event Ticker
The event ticker:
- shows the latest event in one line
- opens expanded log history as a top-anchored dropdown overlay
- dropdown uses about 25% of screen height with light separation from the board
- does not change HUD height

### 6.6 Core Readout Rule
Core chips remain the board-native readout for each side’s Energy and Core state.

---

## 7. Battle Interaction Grammar

### 7.1 Focus
Tapping any chip focuses it and updates the corresponding contextual surface.

### 7.2 Focus Modes
- ready friendly Active chip → action focus
- all other chips → inspect focus

### 7.3 Action Flow
- focus source
- choose legal target
- view preview
- confirm
- resolve with animation

### 7.4 Preview
Preview:
- marks chosen target
- shows affected spaces and affected chips
- shows predicted immediate outcomes
- updates the friendly contextual surface

### 7.5 Confirm and Cancel
- targeted actions anchor confirm to the target
- self or no-target actions anchor confirm to the source or contextual action area as appropriate to the action
- cancel lives in the friendly contextual surface during action focus and preview
- confirm never replaces cancel

### 7.6 Post-Action Focus Rule
After a player-confirmed action resolves, source focus clears automatically.

### 7.7 Dismiss Rules
- cancel from preview returns to source action focus
- empty-space tap with focus only clears focus
- empty-space tap during preview clears preview and focus
- when no active context remains, the contextual surface clears

### 7.8 Enemy Playback Focus Rule
Enemy playback can temporarily own the enemy contextual surface during active playback. That playback ownership clears when playback ends. Manual enemy inspection is a separate player-driven focus state.

---

## 8. Contextual Surfaces

### 8.1 Shared Flyout System
Chipcraft uses one shared contextual flyout component system for focused chip detail and action readout. Battle instantiates that system as mirrored lower-left and lower-right flyouts. Rebuild reuses the same flyout system on the lower-right for focused chip detail so visual and structural changes propagate across all flyout uses.

### 8.2 Focused-Detail Ownership
Focused detail surfaces include:
- chip name
- larger chip art
- current core stats
- current state icons
- concise context-relevant text

Text remains support-oriented. Individual flyout text fields should render as a single line where possible and never exceed two short lines. Extended explanation belongs in the expanded overlay layer.

### 8.3 Battle Contextual Surfaces
Battle uses mirrored contextual flyouts.

#### Friendly Flyout
- anchored bottom-left
- appears for friendly chip focus and friendly-side action context
- updates through inspect, action, preview, and playback states

#### Enemy Flyout
- anchored bottom-right
- appears for enemy chip focus, committed-threat readout, and enemy-side playback context
- updates through inspect, committed-threat readout, and playback readout states

### 8.4 Battle Flyout Behavior
Both battle flyouts:
- use corner-console proportions of about 30% of screen width and 24% of screen height
- animate in when context becomes active with short slide-and-fade motion
- enter in about 180–220ms with a quick playful settle
- update in place in about 120–160ms while context persists
- animate out in about 140–180ms when context clears

### 8.5 Flyout Composition Rule
Flyout composition is wide rather than tall.

Chip art carries about 40% of the internal visual emphasis, with the remaining space used for compact stats, state icons, and one short line of contextual information.

### 8.6 Friendly Flyout Content

#### Inspect Focus
- focused-detail ownership fields
- concise effect summary
- details / glossary access

#### Action Focus
- focused-detail ownership fields
- Energy cost
- concise action summary
- concise targeting reminder
- current action state
- cancel

#### Preview
- source chip
- chosen target
- concise preview summary
- compact predicted result summary
- cancel

### 8.7 Enemy Flyout Content

#### Inspect Focus
- focused-detail ownership fields
- concise effect summary

#### Committed-Threat Readout
- focused enemy chip
- committed action readout for that chip
- concise committed-threat summary

#### Playback Readout
- acting chip
- triggered effect
- concise effect summary

### 8.8 Expanded Detail Overlay
Interacting with the details or status area opens a full-screen overlay.

The overlay:
- surfaces the current chip’s relevant statuses at the top
- provides glossary and deeper chip detail below
- returns to the exact prior battle state when closed

---

## 9. Chip Face and On-Board Presentation

### 9.1 Chip Face Owns
- concept art
- HP
- primary stat
- power indicator
- readiness indicator where applicable
- three visible status icon slots in a single footer row
- compact +N overflow marker when visible statuses exceed the slot count

### 9.2 Identity Rule
Normal board presentation identifies chips through art, stat layout, and visual treatment. Chip names appear in focused detail surfaces rather than on the chip face.

### 9.3 Status Visibility Rule
- power state uses dedicated presentation treatment
- readiness state uses dedicated presentation treatment for Active chips
- status icons use three fixed on-chip slots in a single footer row
- visible status slots are assigned by battle-priority order
- additional statuses compress into a compact +N overflow marker
- full status detail appears in contextual surfaces and the expanded overlay

### 9.4 Status Priority Order
1. states that change legality or immediate tactical risk
2. states that change incoming or outgoing combat value
3. other tracked statuses

### 9.5 Power Presentation
Pylon spread appears through colored glow on affected chips and a dedicated power-state icon. Powered-state glows use the shared motion-and-feedback language and remain alive without obscuring the board.

### 9.6 Ready-State Presentation
Ready Active chips use a dedicated energy/readiness glow.

Readiness glows and state changes use the shared motion-and-feedback language.

### 9.7 Preview Presentation
Preview keeps the source visibly focused, marks the target clearly, overlays the affected shape on the board, and displays predicted outcomes on affected chips.

### 9.8 Playback Presentation
All player, enemy, passive, and auto actions animate one at a time in quick readable sequence using the shared motion-and-feedback language.

### 9.9 State-Change Feedback
Status gains, status removals, heat/goop/shiny/sticky-style overlays, hits, disables, repairs, shields, and cleanses use brief legible feedback moments that feel slick, snappy, and slightly playful.

---

## 10. Rebuild Layout and Interaction

### 10.1 Rebuild Goal
Rebuild lets the player assemble the active layout quickly, understand legal placement, and review the resulting ship before combat.

### 10.2 Spatial Layout
- player ship occupies the left half of the screen
- chip inventory occupies the right side of the screen
- rebuild reuses the shared flyout system as a lower-right contextual detail window over the inventory side
- the right-side inventory remains the primary parts region behind that lower-right flyout usage
- continue control remains visible

### 10.3 Rebuild Context Surface
Rebuild uses the shared flyout system on the lower-right.

It shows the currently focused chip from either inventory or ship and reuses the same chip-detail logic as battle focus, adapted for rebuild.

### 10.4 Interaction Flow
- drag chip from right-side inventory to left-side ship to place
- tap chip in inventory then tap legal ship space as alternate placement flow
- drag placed chip from ship to another legal ship space to reposition
- focusing either a tray chip or a placed chip updates the bottom-right detail surface

### 10.5 Placement Feedback
- legal placements preview and snap into place using the shared motion-and-feedback language
- dragging, hover feedback, pickup, and repositioning feel tactile and slightly playful
- live power feedback updates on the ship during placement and movement

### 10.6 Visual Rule
Rebuild keeps the same visual philosophy as battle: chips remain dominant, hull and grid remain supportive, and power state stays readable while assembling the ship.

---

## 11. Shop, Dry Dock, and Route

### 11.1 Shared Comparison Pattern
Shop and Dry Dock use one comparison surface pattern:
- option list
- focused option detail
- comparison against current owned / equipped context
- commit or leave control

### 11.2 Shop
Shop instantiates the shared comparison pattern for purchases and offer evaluation.

### 11.3 Dry Dock
Dry Dock instantiates the shared comparison pattern for repair, Pylon offer, frame upgrade, and Core upgrade actions available in the active mode.

### 11.4 Route
Route is a simple selection surface that owns:
- current route position
- reachable next nodes
- node identity and state
- focused node detail
- confirm / continue when required

---

## 12. Details Consistency
Battle explanation begins on the board, expands through contextual surfaces, and resolves into full-screen overlays only when the player requests deeper detail.

---

## 13. Implementation State Contracts

### 13.1 Battle UI State
```ts
BattleUIState {
  focusedChipId: string | null
  focusedSide: 'friendly' | 'enemy' | null
  focusMode: 'inspect' | 'action' | 'preview' | 'playback' | null
  selectedActionChipId: string | null
  targetKind: 'chip' | 'space' | 'self' | 'none' | null
  previewTargetChipId: string | null
  previewTargetSpaceId: string | null
  affectedSpaceIds: string[]
  affectedChipIds: string[]
  predictedOutcomesByChipId: Record
  confirmAnchor: {
    kind: 'chip' | 'space' | 'source' | 'context'
    id: string | null
  } | null
  leftFlyoutState: {
    visible: boolean
    mode: 'inspect' | 'action' | 'preview' | 'playback' | null
  }
  rightFlyoutState: {
    visible: boolean
    mode: 'inspect' | 'committedThreat' | 'playback' | null
  }
  overlayState: {
    detailOverlay: boolean
    battleLogOverlay: boolean
    enemyPlanOverlay: boolean
  }
  resolutionState: 'idle' | 'animating' | 'locked'
}
```

### 13.2 Rebuild UI State
```ts
BuildUIState {
  focusedChipId: string | null
  focusedSource: 'inventory' | 'board' | null
  selectedInventoryChipId: string | null
  selectedPlacedChipId: string | null
  dragState: {
    chipId: string | null
    source: 'inventory' | 'board' | null
  }
  highlightedLegalPlacementSpaceIds: string[]
  previewPlacementSpaceIds: string[]
}
```

### 13.3 Derived View-Model Rule
Short chip text, badge stacks, formatted log lines, preview summaries, and overflow indicators are generated by shared view-model helpers rather than handwritten inside individual components.

---

## 14. Open Questions
No structural UI questions remain open in this version. Future updates may tune exact art assets, easing curves, and breakpoint tokens without changing the interaction contract.
