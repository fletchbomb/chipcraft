import assert from 'node:assert/strict';

import { loadContentCatalog } from '../content/catalog.js';
import { AI_PRESET_IDS, CHIP_TYPE_IDS, FRAME_IDS } from '../content/ids.js';
import {
  buildChipInstance,
  createSideSetup,
  placeChipInstance,
  validateLaunchLayout,
} from '../engine/construction.js';
import { getFrontierSpaces } from '../engine/geometry.js';
import { getPowerColorsByChip } from '../engine/power.js';
import { initializeBattleState } from '../engine/combat.js';
import { getUsableActiveChips, getLegalTargetsForChip, buildProjectedResolution } from '../engine/actions.js';
import { chooseEnemyAction } from '../engine/ai.js';
import { createScenarioShell, lockScenarioSnapshot, rematchFromLockedSnapshot } from '../engine/battle-test.js';

function buildSeedSide() {
  let side = createSideSetup(FRAME_IDS.SCOUT);
  side = buildChipInstance(side, CHIP_TYPE_IDS.CORE_SCOUT);
  side = buildChipInstance(side, CHIP_TYPE_IDS.CANNON_I);
  side = buildChipInstance(side, CHIP_TYPE_IDS.PYLON_RED_I);
  side = buildChipInstance(side, CHIP_TYPE_IDS.RELAY_I);

  const [core, cannon, pylon, relay] = side.builtChipInstances;
  side = placeChipInstance(side, core.chipInstanceId, 3, 4);
  side = placeChipInstance(side, cannon.chipInstanceId, 2, 2);
  side = placeChipInstance(side, pylon.chipInstanceId, 1, 3);
  side = placeChipInstance(side, relay.chipInstanceId, 2, 3);
  return side;
}

function run() {
  const content = loadContentCatalog();

  const player = buildSeedSide();
  const enemy = buildSeedSide();

  // Construction invariants.
  assert.equal(validateLaunchLayout(player, content).isValid, true, 'player launch should be valid');
  assert.equal(validateLaunchLayout(enemy, content).isValid, true, 'enemy launch should be valid');

  // Geometry and power should produce non-empty signals.
  const frontier = getFrontierSpaces(enemy, content);
  assert.ok(frontier.length > 0, 'enemy frontier should not be empty');

  const colorMap = getPowerColorsByChip(player, content);
  assert.ok(colorMap.size > 0, 'power color map should not be empty');

  // Battle and action legality.
  const battle = initializeBattleState({ playerSetup: player, enemySetup: enemy }, content);
  battle.player.energy = 10;
  const usable = getUsableActiveChips(battle, 'player', content);
  assert.ok(usable.length > 0, 'player should have at least one usable active chip with energy');

  const actingId = usable[0].chipInstanceId;
  const legalTargets = getLegalTargetsForChip(battle, 'player', actingId, content);
  assert.ok(legalTargets.length > 0, 'acting chip should have legal targets');

  const projected = buildProjectedResolution(battle, 'player', actingId, legalTargets[0].chipInstanceId, content);
  assert.ok(projected && projected.damage > 0, 'projected resolution should include positive damage');

  // AI should pick legal action when enemy can act.
  battle.enemy.energy = 10;
  const aiChoice = chooseEnemyAction(battle, content, AI_PRESET_IDS.AGGRESSOR);
  assert.ok(aiChoice, 'enemy AI should choose an action');

  // Locked snapshots rematch to fresh round 1.
  const scenario = createScenarioShell({
    playerSetup: player,
    enemySetup: enemy,
    aiPresetId: AI_PRESET_IDS.AGGRESSOR,
  });
  const locked = lockScenarioSnapshot(scenario);
  const rematch = rematchFromLockedSnapshot(locked, content);
  assert.equal(rematch.round, 1, 'rematch should restart at round 1');
  assert.equal(rematch.turnOwner, 'player', 'rematch should start on player turn');

  console.log('engine smoke tests passed');
}

run();
