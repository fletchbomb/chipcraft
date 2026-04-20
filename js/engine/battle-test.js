import { initializeBattleState } from './combat.js';
import { createId } from './types.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createScenarioShell({ name = 'New Scenario', playerSetup, enemySetup, aiPresetId = null } = {}) {
  return {
    scenarioId: createId('scenario'),
    name,
    notes: '',
    playerSetup: playerSetup ? clone(playerSetup) : null,
    enemySetup: enemySetup ? clone(enemySetup) : null,
    aiPresetId,
  };
}

export function lockScenarioSnapshot(scenario) {
  return {
    lockedAtVersion: 1,
    scenario: clone(scenario),
  };
}

export function startBattleFromLockedSnapshot(lockedSnapshot, content) {
  return initializeBattleState(
    {
      playerSetup: lockedSnapshot.scenario.playerSetup,
      enemySetup: lockedSnapshot.scenario.enemySetup,
    },
    content,
  );
}

export function rematchFromLockedSnapshot(lockedSnapshot, content) {
  return startBattleFromLockedSnapshot(lockedSnapshot, content);
}

export function editScenarioFromLockedSnapshot(lockedSnapshot) {
  return clone(lockedSnapshot.scenario);
}

export function serializeScenario(scenario) {
  return JSON.stringify(scenario);
}

export function deserializeScenario(serialized) {
  return JSON.parse(serialized);
}
