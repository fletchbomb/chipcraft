import assert from 'node:assert/strict';

import { loadContentCatalog } from '../content/catalog.js';
import { CHIP_TYPE_IDS, FRAME_IDS } from '../content/ids.js';
import { buildChipInstance, createSideSetup, placeChipInstance, validateLaunchLayout } from '../engine/construction.js';

function run() {
  const content = loadContentCatalog();

  // Case 1: no Core placed => invalid launch.
  let side = createSideSetup(FRAME_IDS.SCOUT);
  side = buildChipInstance(side, CHIP_TYPE_IDS.CANNON_I);
  const cannonId = side.builtChipInstances[0].chipInstanceId;
  side = placeChipInstance(side, cannonId, 2, 2);

  const noCore = validateLaunchLayout(side, content);
  assert.equal(noCore.isValid, false, 'launch should be invalid without a placed core');
  assert.ok(
    noCore.errors.some((error) => error.includes('requires exactly 1 placed Core')),
    'missing-core error should be reported',
  );

  // Case 2: two Cores placed => invalid launch.
  side = buildChipInstance(side, CHIP_TYPE_IDS.CORE_SCOUT);
  side = buildChipInstance(side, CHIP_TYPE_IDS.CORE_SCOUT);
  const core1 = side.builtChipInstances[1].chipInstanceId;
  const core2 = side.builtChipInstances[2].chipInstanceId;
  side = placeChipInstance(side, core1, 3, 4);
  side = placeChipInstance(side, core2, 2, 3);

  const twoCores = validateLaunchLayout(side, content);
  assert.equal(twoCores.isValid, false, 'launch should be invalid with multiple cores');
  assert.ok(
    twoCores.errors.some((error) => error.includes('requires exactly 1 placed Core')),
    'multi-core error should be reported',
  );

  // Case 3: exactly one Core and legal spaces => valid launch.
  let valid = createSideSetup(FRAME_IDS.SCOUT);
  valid = buildChipInstance(valid, CHIP_TYPE_IDS.CORE_SCOUT);
  valid = buildChipInstance(valid, CHIP_TYPE_IDS.CANNON_I);
  const vCore = valid.builtChipInstances[0].chipInstanceId;
  const vCannon = valid.builtChipInstances[1].chipInstanceId;
  valid = placeChipInstance(valid, vCore, 3, 4);
  valid = placeChipInstance(valid, vCannon, 2, 2);

  const good = validateLaunchLayout(valid, content);
  assert.equal(good.isValid, true, 'launch should be valid with one placed core and legal placements');

  console.log('construction validation cases passed');
}

run();
