import assert from 'node:assert/strict';

import { loadContentCatalog } from '../content/catalog.js';
import { CHIP_TYPE_IDS, FRAME_IDS, AI_PRESET_IDS } from '../content/ids.js';
import { createSideSetup, buildChipInstance, placeChipInstance } from '../engine/construction.js';
import { initializeBattleState } from '../engine/combat.js';
import { applyActivation, buildProjectedResolution, getLegalTargetsForChip, getUsableActiveChips } from '../engine/actions.js';
import { chooseEnemyAction } from '../engine/ai.js';

function buildSeedSide() {
  let side = createSideSetup(FRAME_IDS.SCOUT);
  side = buildChipInstance(side, CHIP_TYPE_IDS.CORE_SCOUT);
  side = buildChipInstance(side, CHIP_TYPE_IDS.CANNON_I);
  side = buildChipInstance(side, CHIP_TYPE_IDS.PYLON_RED_I);

  const [core, cannon, pylon] = side.builtChipInstances;
  side = placeChipInstance(side, core.chipInstanceId, 3, 4);
  side = placeChipInstance(side, cannon.chipInstanceId, 2, 2);
  side = placeChipInstance(side, pylon.chipInstanceId, 1, 3);
  return side;
}

function checkProjectionMatchesResolution(battleState, sideKey, content) {
  const usable = getUsableActiveChips(battleState, sideKey, content);
  assert.ok(usable.length > 0, `${sideKey} should have at least one usable active chip`);

  for (const actor of usable) {
    const targets = getLegalTargetsForChip(battleState, sideKey, actor.chipInstanceId, content);
    for (const target of targets) {
      const projected = buildProjectedResolution(
        battleState,
        sideKey,
        actor.chipInstanceId,
        target.chipInstanceId,
        content,
      );
      assert.ok(projected, 'projected resolution should exist for legal activation');

      const enemySide = sideKey === 'player' ? 'enemy' : 'player';
      const before = battleState[enemySide].chipsById[target.chipInstanceId];
      const resolved = applyActivation(battleState, sideKey, actor.chipInstanceId, target.chipInstanceId, content);
      const after = resolved[enemySide].chipsById[target.chipInstanceId];

      assert.equal(after.hp, Math.max(0, before.hp - projected.damage), 'projected damage should match applied HP loss');
      assert.equal(after.isDisabled, projected.predictedTargetDisabled, 'projected disablement should match applied disablement');
    }
  }
}

function run() {
  const content = loadContentCatalog();
  const playerSetup = buildSeedSide();
  const enemySetup = buildSeedSide();

  const battle = initializeBattleState({ playerSetup, enemySetup }, content);
  battle.player.energy = 20;
  battle.enemy.energy = 20;

  checkProjectionMatchesResolution(battle, 'player', content);
  checkProjectionMatchesResolution(battle, 'enemy', content);

  const aiChoice = chooseEnemyAction(battle, content, AI_PRESET_IDS.AGGRESSOR);
  assert.ok(aiChoice, 'AI should choose an action when enemy has energy and legal targets');

  const enemyUsable = getUsableActiveChips(battle, 'enemy', content).map((c) => c.chipInstanceId);
  assert.ok(enemyUsable.includes(aiChoice.actingChipInstanceId), 'AI acting chip must be a usable active chip');

  const legalTargetIds = getLegalTargetsForChip(battle, 'enemy', aiChoice.actingChipInstanceId, content).map(
    (target) => target.chipInstanceId,
  );
  assert.ok(legalTargetIds.includes(aiChoice.targetChipInstanceId), 'AI target must be legal for selected acting chip');

  console.log('projection/ai consistency tests passed');
}

run();
