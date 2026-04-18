# CHIPCRAFT — NO-BUILD MODULAR BROWSER APP PLAN v1.0

**Implementation planning document.** This file defines how to build the first playable Chipcraft battle-test version as a plain browser app using modular HTML, CSS, and JavaScript files.

The canonical GDD remains the only source of truth for gameplay rules, terminology, construction legality, content definitions, combat systems, and mode-independent state concepts.

The NPC AI spec remains the source of truth for AI scoring, weighting, tie-breaks, commitment behavior, and AI-side evaluation rules.

The UI framework companion remains the source of truth for screen architecture, interaction grammar, contextual surfaces, preview presentation, overlays, and motion language.

The battle-test companion remains the source of truth for battle-test mode flow, scenario setup, launch rules, rematch / edit / new-scenario behavior, and battle-test save / load behavior.

The coding architecture roadmap remains the source of truth for module ownership, shared pathways, testing rules, anti-patchwork requirements, and implementation sequencing.

This file converts that document stack into a delivery format that matches the actual workflow for this project:
- ChatGPT generates finished files
- the files run locally in a browser
- the same files can be uploaded directly to GitHub Pages
- no package installs, build tools, or external dependencies are required

---

## 1. Chosen Delivery Format

Chipcraft should be built as a **no-build modular browser app** using:

- `index.html`
- `styles.css`
- plain JavaScript ES modules
- browser `localStorage` for first-pass persistence
- zero required npm packages
- zero build step

This format is the best fit for the actual process of this project because:
- the deliverable can be opened locally on your machine
- the same deliverable can be uploaded directly to GitHub Pages
- ChatGPT can generate and update the files directly
- the project can still be structured by systems instead of turning into one giant file

---

## 2. What This Means in Plain English

A coder is not setting up a software project for you.

Instead, the build process should produce:
- one folder of finished web files
- that you can double-click locally or serve simply
- and that can be uploaded as-is to GitHub

The game still needs clean internal architecture, but it should not depend on tooling that only makes sense when a human developer is doing project setup and dependency management.

---

## 3. Core Rule for This Build Style

This format must stay **modular**, not become a single giant HTML file unless explicitly chosen later.

That means:
- one HTML shell
- one CSS file or small CSS set
- multiple JavaScript modules grouped by ownership
- one canonical engine pathway per repeated gameplay computation
- one UI layer that renders engine truth
- one thin battle-test mode shell

This keeps the delivery simple without giving up the system-level architecture.

---

## 4. Recommended File Structure

Use this structure:

```text
chipcraft/
  index.html
  styles.css
  js/
    main.js
    app/
      state.js
      persistence.js
      routes.js
    content/
      chip-definitions.js
      frame-definitions.js
      ai-presets.js
      status-definitions.js
      ids.js
    engine/
      types.js
      construction.js
      geometry.js
      power.js
      combat.js
      actions.js
      ai.js
      battle-test.js
    ui/
      build-screen.js
      battle-screen.js
      flyouts.js
      overlays.js
      view-models.js
      render.js
```

This is the recommended first structure. It is small enough to manage directly, but separated enough to stay clean.

---

## 5. What Each Top-Level File Owns

## 5.1 `index.html`
Owns:
- page shell
- root containers
- loading `main.js`
- no gameplay logic

It should stay as thin as possible.

## 5.2 `styles.css`
Owns:
- layout
- sizing
- tokens
- visual states
- reusable UI classes
- no gameplay logic

It should support the current UI framework but not contain hidden rule behavior.

## 5.3 `js/main.js`
Owns:
- app startup
- initial state creation
- first render
- top-level event wiring

It should not become a second app engine.

---

## 6. Module Ownership Plan

## 6.1 `js/content/`
Owns static authored definitions.

Suggested files:
```text
js/content/
  chip-definitions.js
  frame-definitions.js
  ai-presets.js
  status-definitions.js
  ids.js
```

These files should mirror the current source documents and contain:
- chip definitions
- frame definitions
- preset definitions
- canonical ids / names
- static status metadata where helpful

They must remain data-first.

## 6.2 `js/engine/construction.js`
Owns mode-neutral ship construction.

Expected responsibilities:
- create chip instance
- delete chip instance
- place chip instance
- move chip instance
- remove chip instance from layout
- validate side layout
- validate launch layout

This module is shared by battle test now and future build flows later.

## 6.3 `js/engine/geometry.js`
Owns spatial rules.

Expected responsibilities:
- legal spaces for frame
- adjacency
- combat-space transforms
- shape expansion
- affected-space lookup
- frontier exposure

This module must be the only owner of frame and target-space geometry.

## 6.4 `js/engine/power.js`
Owns pylon / relay and all derived power state.

Expected responsibilities:
- pylon coverage
- relay propagation
- cycle-safe color traversal
- color union
- color levels
- fusion state
- powered tags
- modified shape / primaryStat / max HP

This module must be the only owner of shared power computation.

## 6.5 `js/engine/combat.js`
Owns mutable battle state and timing.

Expected responsibilities:
- initialize battle from locked snapshot
- advance turn phases
- handle Energy gain
- handle status lifecycle
- apply damage and Shield logic
- update disablement
- check win/loss

This is the canonical combat engine for the first playable build.

## 6.6 `js/engine/actions.js`
Owns legal actions, preview, and resolution.

Expected responsibilities:
- enumerate usable Active chips
- enumerate legal targets
- apply target filters
- resolve affected spaces and chips
- build projected resolution
- build truthful preview
- resolve confirmed actions

This is one of the most important shared modules.

## 6.7 `js/engine/ai.js`
Owns AI evaluation only.

Expected responsibilities:
- consume canonical legal actions
- build score profiles
- apply weights
- break ties
- choose action
- produce committed plan output

This module must not redefine action legality or resolution semantics.

## 6.8 `js/engine/battle-test.js`
Owns battle-test mode shell only.

Expected responsibilities:
- create scenario state
- manage player setup
- manage enemy setup
- lock side
- build locked snapshot
- restore from snapshot
- rematch / edit / new scenario
- save / load scenarios

This module must remain thin.

## 6.9 `js/engine/types.js`
Owns shared plain-object shape helpers or constructors.

Expected responsibilities:
- standard object factories where helpful
- shape-normalization helpers
- shared id conventions
- runtime assertions if used

This should support consistency, not become a dumping ground.

---

## 7. UI Module Plan

## 7.1 `js/ui/render.js`
Owns top-level screen rendering and delegation.

Expected responsibilities:
- choose which surface to render
- coordinate build screen vs battle screen
- attach shared event listeners where needed

This should be a renderer/controller, not a rules engine.

## 7.2 `js/ui/build-screen.js`
Owns setup surface rendering.

Expected responsibilities:
- draw player setup
- draw enemy setup
- show available actions for the active side
- route button clicks and placement interactions into engine functions
- show validation results from canonical validators

## 7.3 `js/ui/battle-screen.js`
Owns battle surface rendering.

Expected responsibilities:
- draw both ships
- draw top HUD
- show legal targets and preview overlays
- show chip states and statuses
- route player actions into canonical action resolution

## 7.4 `js/ui/flyouts.js`
Owns friendly/enemy/build flyout rendering only.

Expected responsibilities:
- build current flyout content from view models
- render inspect / action / preview / playback detail
- no gameplay rule decisions

## 7.5 `js/ui/overlays.js`
Owns:
- detail overlay
- battle log overlay
- enemy plan overlay

## 7.6 `js/ui/view-models.js`
Owns display formatting only.

Expected responsibilities:
- chip display summaries
- preview summaries
- validation messages
- formatted HUD readouts

Important rule:
view models may summarize engine truth, but they must not invent it.

---

## 8. App Module Plan

## 8.1 `js/app/state.js`
Owns top-level app state container.

This should be a plain JavaScript state object plus focused update helpers.

It should hold:
- active screen
- current scenario
- current setup state
- current battle state
- current UI-local state that truly needs to persist across renders

Important rule:
this file stores state, but the gameplay logic should still live in engine modules.

## 8.2 `js/app/persistence.js`
Owns:
- save scenario to `localStorage`
- load scenario from `localStorage`
- save format version
- incompatibility handling

## 8.3 `js/app/routes.js`
Owns:
- active surface selection
- transitions between setup and battle
- new / rematch / edit flow routing

---

## 9. Persistence Plan

For the first playable version:
- store battle-test scenarios only
- use browser `localStorage`
- store plain JSON only
- avoid storing hidden derived state

Save data should include:
- scenario name
- player frame
- player built instances
- player placed layout
- enemy frame
- enemy built instances
- enemy placed layout
- AI preset
- optional notes

If a saved scenario references missing content, the app must surface that explicitly.

---

## 10. Rendering Strategy

Use direct DOM rendering through JavaScript modules.

That means:
- update the visible screen by re-rendering relevant sections
- keep the render functions deterministic from current app state
- attach event handlers after render where needed
- keep gameplay logic outside render functions

Important rule:
render functions must read from state and engine outputs, not mutate gameplay rules directly.

---

## 11. How Interaction Should Work

### Build interactions
- clicking or dragging should call construction functions
- the construction engine updates setup state
- validation runs through shared validators
- UI re-renders from the updated state

### Battle interactions
- selecting a chip asks the action engine for legal actions/targets
- hovering or selecting a target asks the preview pipeline for truthful preview
- confirming calls canonical action resolution
- battle state updates
- UI re-renders
- if enemy turn, AI consumes canonical legal actions and resolves normally

That is the entire loop.

---

## 12. First Coding Sequence

This is the order ChatGPT should actually build the files.

## Step 1 — Create the shell
Create:
- `index.html`
- `styles.css`
- `js/main.js`
- empty module structure

Deliverable:
- page loads with no game logic yet

## Step 2 — Add content files
Create:
- chip definitions
- frame definitions
- AI presets
- ids/status definitions

Deliverable:
- content can be imported and inspected in browser console

## Step 3 — Build construction engine
Create:
- chip instance creation
- placement
- removal
- movement
- validation

Deliverable:
- one side can be assembled and validated from the console or simple temporary UI

## Step 4 — Build setup screen
Create:
- build screen rendering
- side editing controls
- basic placement interactions
- validation feedback

Deliverable:
- battle-test setup works for both sides before battle exists

## Step 5 — Build geometry engine
Create:
- shapes
- affected spaces
- frontier logic

Deliverable:
- board geometry and target legality can be computed correctly

## Step 6 — Build power engine
Create:
- pylon coverage
- relay propagation
- powered state

Deliverable:
- board power state updates correctly from layouts

## Step 7 — Build combat engine
Create:
- battle initialization
- turn phases
- Energy
- status handling
- damage and disablement
- win/loss checks

Deliverable:
- locked setup can become a live battle state

## Step 8 — Build action and preview engine
Create:
- legal targets
- projected resolutions
- truthful preview
- action confirmation and resolution

Deliverable:
- player can take legal turns with previews

## Step 9 — Build AI engine
Create:
- legal action consumption
- score profiles
- weight application
- tie-breaks
- committed plan output

Deliverable:
- enemy can take a full legal turn

## Step 10 — Build rematch/edit/save loop
Create:
- lock snapshot
- rematch
- edit
- new scenario
- save/load

Deliverable:
- full battle-test loop works end-to-end

## Step 11 — Add flyouts and polish
Create:
- flyouts
- overlays
- better board rendering
- playback clarity
- validation messaging polish

Deliverable:
- first playable battle-test build is usable and readable

---

## 13. Testing Plan Without Tooling Complexity

Even in a no-build app, the code should still be written so it can be tested later.

For the first pass:
- keep engine functions pure where possible
- keep module inputs and outputs clear
- avoid DOM dependencies inside engine modules

This means later automated testing is still possible even if the first delivered version is just browser files.

If lightweight test files are added later, they should target:
- construction invariants
- frontier and shape rules
- power invariants
- action legality
- preview correctness
- AI choice correctness

---

## 14. What This Format Protects Us From

This format keeps the project:
- locally runnable
- GitHub Pages friendly
- easy for ChatGPT to generate
- easy to inspect file-by-file
- safer than one giant HTML file

And it still protects against:
- UI-owned legality
- duplicated preview logic
- AI-owned gameplay rules
- battle-test-owned combat semantics
- patching symptoms instead of root systems

---

## 15. What This Format Does Not Try To Do

This format does **not** try to:
- solve campaign mode yet
- solve asset pipelines
- solve packaging or installers
- solve advanced performance optimization
- force a human-dev workflow with package management
- require you to understand React, Vite, or other tooling

It is chosen specifically so the deliverables match how you actually build with ChatGPT.

---

## 16. Practical Brief For The Next Coding Step

The next coding step is:

Build a no-build modular browser app with:
- `index.html`
- `styles.css`
- modular JavaScript files under `js/`
- engine modules for construction, geometry, power, combat, actions, AI, and battle test
- UI modules for build screen, battle screen, flyouts, overlays, and view models

Do not use npm packages or build tools.
Do not collapse the game into one giant HTML file.
Keep engine logic separate from rendering.
Make battle test the only active mode for the first playable build.

---

## 17. Summary Rule

Chipcraft should now be built as a **modular plain-browser app** that matches the real workflow of this project:
ChatGPT generates finished files, you open them locally or upload them to GitHub, and the internal architecture still stays system-first.
