import assert from 'node:assert/strict';

import { createInitialAppState, lockSetupSide, launchBattle, selectBattleActor, selectBattleTarget } from '../app/state.js';
import { getFlyoutModel } from '../ui/flyouts.js';
import { getOverlayModel } from '../ui/overlays.js';
import { buildScreenViewModel } from '../ui/view-models.js';

function run() {
  let state = createInitialAppState();
  state = lockSetupSide(state, 'player');
  state = lockSetupSide(state, 'enemy');
  state = launchBattle(state);

  // Select first legal actor/target to populate tactical UI models.
  const actor = state.combat.actionPreview.usable[0]?.chipInstanceId;
  if (actor) {
    state = selectBattleActor(state, actor);
    const target = state.combat.actionPreview.legalTargets[0]?.chipInstanceId;
    if (target) {
      state = selectBattleTarget(state, target);
    }
  }

  const flyout = getFlyoutModel(state);
  assert.equal(flyout.title.includes('Tactical'), true, 'flyout should be tactical-focused');
  assert.equal(flyout.items.length >= 5, true, 'flyout should include multiple tactical lines');
  assert.equal(flyout.items.some((item) => item.startsWith('Selected actor:')), true, 'flyout should show selected actor');

  const overlay = getOverlayModel(state);
  assert.equal(overlay.title, 'Systems Overlay', 'overlay title should be stable');
  assert.equal(typeof overlay.summary, 'string', 'overlay summary should be present');
  assert.equal(typeof overlay.status, 'string', 'overlay status should be present');

  const vm = buildScreenViewModel(state);
  assert.equal(typeof vm.combatRound, 'number', 'view model should expose combat round');
  assert.equal(typeof vm.playerLaunchValid, 'boolean', 'view model should expose validation booleans');
  assert.equal(typeof vm.aiChoice, 'string', 'view model should expose ai choice summary');

  console.log('ui model smoke tests passed');
}

run();
