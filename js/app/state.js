import { loadContentCatalog } from '../content/catalog.js';
import {
  buildChipInstance,
  createSideSetup,
  placeChipInstance,
  validateLaunchLayout,
  validateShipLayout,
} from '../engine/construction.js';
import { CHIP_TYPE_IDS, FRAME_IDS } from '../content/ids.js';

function createSeedSide(frameId) {
  let sideSetup = createSideSetup(frameId);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.CORE_SCOUT);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.CANNON_I);

  const [core, cannon] = sideSetup.builtChipInstances;
  sideSetup = placeChipInstance(sideSetup, core.chipInstanceId, 2, 3);
  sideSetup = placeChipInstance(sideSetup, cannon.chipInstanceId, 1, 3);

  return sideSetup;
}

export function createInitialAppState() {
  const content = loadContentCatalog();

  const playerSetup = createSeedSide(FRAME_IDS.SCOUT);
  const enemySetup = createSeedSide(FRAME_IDS.SCOUT);

  return {
    appVersion: '0.3.0-construction-foundation',
    route: 'battle-test-setup',
    mode: 'battle-test',
    content,
    scenario: {
      playerSetup,
      enemySetup,
    },
    validation: {
      playerLayout: validateShipLayout(playerSetup, content),
      playerLaunch: validateLaunchLayout(playerSetup, content),
      enemyLayout: validateShipLayout(enemySetup, content),
      enemyLaunch: validateLaunchLayout(enemySetup, content),
    },
  };
}
