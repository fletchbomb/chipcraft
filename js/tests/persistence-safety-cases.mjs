import assert from 'node:assert/strict';

import {
  clearScenarioSnapshot,
  loadAppState,
  loadScenarioSnapshot,
  saveAppState,
  saveScenarioSnapshot,
} from '../app/persistence.js';

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
  const storage = createMockStorage();

  // Happy path save/load.
  assert.equal(saveAppState({ route: 'battle-test-build' }, storage), true, 'app state should save');
  assert.deepEqual(loadAppState(storage), { route: 'battle-test-build' }, 'app state should load');

  assert.equal(saveScenarioSnapshot({ scenarioId: 'scenario-1', name: 'Test' }, storage), true, 'scenario should save');
  assert.deepEqual(
    loadScenarioSnapshot(storage),
    { scenarioId: 'scenario-1', name: 'Test' },
    'scenario should load',
  );

  // Corrupt JSON should fail safely.
  storage.setItem('chipcraft.battleTest.scaffold.state', '{not json');
  storage.setItem('chipcraft.battleTest.scenario.v1', '{not json');
  assert.equal(loadAppState(storage), null, 'corrupt app state JSON should return null');
  assert.equal(loadScenarioSnapshot(storage), null, 'corrupt scenario JSON should return null');

  // Clear should remove scenario key.
  assert.equal(clearScenarioSnapshot(storage), true, 'clear scenario should succeed');
  assert.equal(loadScenarioSnapshot(storage), null, 'cleared scenario should be null');

  console.log('persistence safety cases passed');
}

run();
