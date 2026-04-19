import { loadContentCatalog } from '../content/catalog.js';
import {
  buildChipInstance,
  createSideSetup,
  placeChipInstance,
  validateLaunchLayout,
  validateShipLayout,
} from '../engine/construction.js';
import { getAffectedSpacesFromShape, getFrontierSpaces } from '../engine/geometry.js';
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

function createGeometryPreview(sideSetup, content) {
  const frontierSpaces = getFrontierSpaces(sideSetup, content);
  const firstFrontier = frontierSpaces[0] ?? { col: 2, row: 3 };

  return {
    frontierSpaces,
    dotPreview: getAffectedSpacesFromShape(firstFrontier.col, firstFrontier.row, 'dot1'),
    plusPreview: getAffectedSpacesFromShape(firstFrontier.col, firstFrontier.row, 'plus1'),
  };
}

export function createInitialAppState() {
  const content = loadContentCatalog();

  const playerSetup = createSeedSide(FRAME_IDS.SCOUT);
  const enemySetup = createSeedSide(FRAME_IDS.SCOUT);

  return {
    appVersion: '0.4.0-geometry-foundation',
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
    geometry: {
      player: createGeometryPreview(playerSetup, content),
      enemy: createGeometryPreview(enemySetup, content),
    },
  };
}
