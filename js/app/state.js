import { loadContentCatalog } from '../content/catalog.js';
import {
  buildChipInstance,
  createSideSetup,
  placeChipInstance,
  validateLaunchLayout,
  validateShipLayout,
} from '../engine/construction.js';
import { getAffectedSpacesFromShape, getFrontierSpaces } from '../engine/geometry.js';
import { getPowerColorsByChip, getPoweredStateTagsForChip } from '../engine/power.js';
import { advanceCombatPhase, initializeBattleState } from '../engine/combat.js';
import {
  applyActivation,
  buildProjectedResolution,
  getLegalTargetsForChip,
  getUsableActiveChips,
} from '../engine/actions.js';
import { CHIP_TYPE_IDS, FRAME_IDS } from '../content/ids.js';

function createSeedSide(frameId) {
  let sideSetup = createSideSetup(frameId);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.CORE_SCOUT);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.CANNON_I);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.PYLON_RED_I);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.RELAY_I);

  const [core, cannon, pylon, relay] = sideSetup.builtChipInstances;
  sideSetup = placeChipInstance(sideSetup, core.chipInstanceId, 2, 4);
  sideSetup = placeChipInstance(sideSetup, cannon.chipInstanceId, 2, 2);
  sideSetup = placeChipInstance(sideSetup, pylon.chipInstanceId, 1, 3);
  sideSetup = placeChipInstance(sideSetup, relay.chipInstanceId, 2, 3);

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

function createPowerPreview(sideSetup, content) {
  const colorMap = getPowerColorsByChip(sideSetup, content);

  const chips = sideSetup.builtChipInstances.map((chip) => {
    const colors = [...(colorMap.get(chip.chipInstanceId) ?? new Set())];
    const tags = getPoweredStateTagsForChip(sideSetup, chip.chipInstanceId, content);

    return {
      chipInstanceId: chip.chipInstanceId,
      chipTypeId: chip.chipTypeId,
      colors,
      tags,
    };
  });

  return {
    chips,
    poweredChipCount: chips.filter((chip) => chip.colors.length > 0).length,
  };
}

function createActionPreview(battleState, content) {
  const usable = getUsableActiveChips(battleState, 'player', content);
  const actingChip = usable[0] ?? null;

  if (!actingChip) {
    return {
      usable,
      legalTargets: [],
      projected: null,
      postActivation: battleState,
    };
  }

  const legalTargets = getLegalTargetsForChip(battleState, 'player', actingChip.chipInstanceId, content);
  const firstTarget = legalTargets[0] ?? null;

  if (!firstTarget) {
    return {
      usable,
      legalTargets,
      projected: null,
      postActivation: battleState,
    };
  }

  const projected = buildProjectedResolution(
    battleState,
    'player',
    actingChip.chipInstanceId,
    firstTarget.chipInstanceId,
    content,
  );

  const postActivation = applyActivation(
    battleState,
    'player',
    actingChip.chipInstanceId,
    firstTarget.chipInstanceId,
    content,
  );

  return {
    usable,
    legalTargets,
    projected,
    postActivation,
  };
}

function createCombatPreview(snapshot, content) {
  const initial = initializeBattleState(snapshot, content);
  const phase1 = advanceCombatPhase(initial);
  const phase2 = advanceCombatPhase(phase1);
  const phase3 = advanceCombatPhase(phase2);
  const phase4 = advanceCombatPhase(phase3);

  const actionPreview = createActionPreview(phase4, content);

  return {
    current: phase4,
    logTail: phase4.actionLog.slice(-5),
    actionPreview,
  };
}

export function createInitialAppState() {
  const content = loadContentCatalog();

  const playerSetup = createSeedSide(FRAME_IDS.SCOUT);
  const enemySetup = createSeedSide(FRAME_IDS.SCOUT);
  const snapshot = { playerSetup, enemySetup };

  return {
    appVersion: '0.7.0-actions-foundation',
    route: 'battle-test-setup',
    mode: 'battle-test',
    content,
    scenario: snapshot,
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
    power: {
      player: createPowerPreview(playerSetup, content),
      enemy: createPowerPreview(enemySetup, content),
    },
    combat: createCombatPreview(snapshot, content),
  };
}
