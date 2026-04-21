import assert from 'node:assert/strict';

import {
  createInitialAppState,
  editLockedScenario,
  launchBattle,
  loadScenario,
  lockSetupSide,
  newScenario,
  rematchLockedScenario,
  saveScenario,
} from '../app/state.js';

function createMockStorage() {
  const bag = new Map();
  return {
    setItem(key, value) {
      bag.set(key, String(value));
    },
    getItem(key) {
      return bag.has(key) ? bag.get(key) : null;
    },
    removeItem(key) {
      bag.delete(key);
    },
  };
}

function run() {
  globalThis.localStorage = createMockStorage();

  let state = createInitialAppState();

  // Lock + launch flow.
  state = lockSetupSide(state, 'player');
  state = lockSetupSide(state, 'enemy');
  assert.equal(state.setup.canLaunch, true, 'state should be launchable after both valid sides are locked');

  state = launchBattle(state);
  assert.equal(state.route, 'battle-test-battle', 'launch should switch to battle route');
  assert.equal(state.loop.hasLockedSnapshot, true, 'launch should create locked snapshot');

  // Rematch should reset to fresh battle state.
  state = rematchLockedScenario(state);
  assert.equal(state.combat.current.round, 1, 'rematch should restart at round 1');
  assert.equal(state.combat.current.turnOwner, 'player', 'rematch should restart on player turn');

  // Edit should move back to build and unlock setup.
  state = editLockedScenario(state);
  assert.equal(state.route, 'battle-test-build', 'edit should return to build route');
  assert.equal(state.setup.playerLocked, false, 'edit should unlock player setup');
  assert.equal(state.setup.enemyLocked, false, 'edit should unlock enemy setup');

  // Save/load flow should round-trip via storage.
  state = saveScenario(state);
  assert.match(state.loop.persistenceNotice, /^Saved scenario /, 'save should report successful scenario save');

  state = newScenario(state);
  assert.equal(state.loop.hasLockedSnapshot, false, 'new scenario should clear locked snapshot');

  state = loadScenario(state);
  assert.match(state.loop.persistenceNotice, /^Loaded scenario /, 'load should restore previously saved scenario');

  console.log('app-state smoke tests passed');
}

run();
