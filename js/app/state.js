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
import { applyEnemyAction, chooseEnemyAction } from '../engine/ai.js';
import {
  createScenarioShell,
  deserializeScenario,
  editScenarioFromLockedSnapshot,
  lockScenarioSnapshot,
  rematchFromLockedSnapshot,
  serializeScenario,
  startBattleFromLockedSnapshot,
} from '../engine/battle-test.js';
import {
  clearScenarioSnapshot,
  loadScenarioSnapshot,
  saveAppState,
  saveScenarioSnapshot,
} from './persistence.js';
import { APP_ROUTES } from './routes.js';
import { AI_PRESET_IDS, CHIP_TYPE_IDS, FRAME_IDS } from '../content/ids.js';

function createMemoryStorage() {
  const bag = new Map();

  return {
    setItem(key, value) {
      bag.set(key, value);
    },
    getItem(key) {
      return bag.get(key) ?? null;
    },
    removeItem(key) {
      bag.delete(key);
    },
  };
}

function createSeedSide(frameId) {
  let sideSetup = createSideSetup(frameId);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.CORE_SCOUT);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.CANNON_I);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.PYLON_RED_I);
  sideSetup = buildChipInstance(sideSetup, CHIP_TYPE_IDS.RELAY_I);

  const [core, cannon, pylon, relay] = sideSetup.builtChipInstances;
  sideSetup = placeChipInstance(sideSetup, core.chipInstanceId, 3, 4);
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

function createAiPreview(battleState, content) {
  const enemyTurnStart = advanceCombatPhase(battleState);
  const enemyEnergyGain = advanceCombatPhase(enemyTurnStart);
  const enemyAuto = advanceCombatPhase(enemyEnergyGain);
  const enemyActivation = advanceCombatPhase(enemyAuto);

  const result = applyEnemyAction(enemyActivation, content, AI_PRESET_IDS.AGGRESSOR);

  return {
    enemyActivationState: enemyActivation,
    choice: result.choice,
    postEnemyAction: result.nextState,
    logTail: result.nextState.actionLog.slice(-4),
  };
}

function createBattleTestLoopPreview(playerSetup, enemySetup, aiPresetId, content) {
  const scenario = createScenarioShell({
    name: 'Demo Scenario',
    playerSetup,
    enemySetup,
    aiPresetId,
  });

  const locked = lockScenarioSnapshot(scenario);
  const firstBattle = startBattleFromLockedSnapshot(locked, content);
  const rematchBattle = rematchFromLockedSnapshot(locked, content);
  const editedScenario = editScenarioFromLockedSnapshot(locked);

  const serialized = serializeScenario(scenario);
  const reloaded = deserializeScenario(serialized);

  return {
    scenario,
    locked,
    firstBattle,
    rematchBattle,
    editedScenario,
    reloaded,
    serializationSize: serialized.length,
  };
}

function createPersistencePreview(loopPreview) {
  const memoryStorage = createMemoryStorage();

  const appSaveOk = saveAppState({ scenarioId: loopPreview.scenario.scenarioId }, memoryStorage);
  const scenarioSaveOk = saveScenarioSnapshot(loopPreview.scenario, memoryStorage);
  const loadedScenario = loadScenarioSnapshot(memoryStorage);
  const clearOk = clearScenarioSnapshot(memoryStorage);
  const afterClear = loadScenarioSnapshot(memoryStorage);

  return {
    appSaveOk,
    scenarioSaveOk,
    loadedScenarioName: loadedScenario?.name ?? null,
    clearOk,
    isCleared: afterClear === null,
  };
}

function createCombatPreview(currentBattleState, content) {
  const actionPreview = createActionPreview(currentBattleState, content);
  const aiChoice =
    currentBattleState.turnOwner === 'enemy' && currentBattleState.phase === 'activation'
      ? chooseEnemyAction(currentBattleState, content, AI_PRESET_IDS.AGGRESSOR)
      : null;

  return {
    current: currentBattleState,
    logTail: currentBattleState.actionLog.slice(-5),
    actionPreview,
    aiPreview: {
      enemyActivationState: currentBattleState,
      choice: aiChoice,
      postEnemyAction: currentBattleState,
      logTail: currentBattleState.actionLog.slice(-4),
    },
  };
}

function deriveState({ route, content, scenario, ui }) {
  const { playerSetup, enemySetup } = scenario;
  const snapshot = { playerSetup, enemySetup };
  const currentBattleState = ui.battleState ?? initializeBattleState(snapshot, content);
  const battleTest = createBattleTestLoopPreview(playerSetup, enemySetup, ui.enemyAiPresetId, content);
  const playerLaunch = validateLaunchLayout(playerSetup, content);
  const enemyLaunch = validateLaunchLayout(enemySetup, content);
  const canLaunch = Boolean(ui.playerLocked && ui.enemyLocked && playerLaunch.isValid && enemyLaunch.isValid);

  return {
    appVersion: '1.2.0-interactive-board-foundation',
    route,
    mode: 'battle-test',
    content,
    scenario: snapshot,
    ui,
    validation: {
      playerLayout: validateShipLayout(playerSetup, content),
      playerLaunch,
      enemyLayout: validateShipLayout(enemySetup, content),
      enemyLaunch,
    },
    setup: {
      phase: ui.setupPhase,
      playerLocked: ui.playerLocked,
      enemyLocked: ui.enemyLocked,
      canLaunch,
    },
    geometry: {
      player: createGeometryPreview(playerSetup, content),
      enemy: createGeometryPreview(enemySetup, content),
    },
    power: {
      player: createPowerPreview(playerSetup, content),
      enemy: createPowerPreview(enemySetup, content),
    },
    combat: createCombatPreview(currentBattleState, content),
    battleTest,
    persistence: createPersistencePreview(battleTest),
  };
}

export function createInitialAppState() {
  const content = loadContentCatalog();
  const scenario = {
    playerSetup: createSeedSide(FRAME_IDS.SCOUT),
    enemySetup: createSeedSide(FRAME_IDS.SCOUT),
  };

  const ui = {
    selectedSide: 'player',
    selectedChipTypeId: CHIP_TYPE_IDS.CANNON_I,
    setupPhase: 'player',
    playerLocked: false,
    enemyLocked: false,
    enemyAiPresetId: AI_PRESET_IDS.AGGRESSOR,
    battleState: null,
  };

  return deriveState({
    route: APP_ROUTES.BUILD,
    content,
    scenario,
    ui,
  });
}

export function setUiSelection(appState, patch) {
  const selectedSide = patch.selectedSide ?? appState.ui.selectedSide;
  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      ...patch,
      selectedSide,
    },
  });
}

export function placeChipFromPalette(appState, { sideKey, chipTypeId, col, row }) {
  const sideSetup = appState.scenario[`${sideKey}Setup`];
  if (!sideSetup) return appState;

  let nextSide = buildChipInstance(sideSetup, chipTypeId);
  const lastBuilt = nextSide.builtChipInstances[nextSide.builtChipInstances.length - 1];
  nextSide = placeChipInstance(nextSide, lastBuilt.chipInstanceId, col, row);

  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: {
      ...appState.scenario,
      [`${sideKey}Setup`]: nextSide,
    },
    ui: {
      ...appState.ui,
      selectedSide: sideKey,
      setupPhase: sideKey === 'player' ? 'player' : appState.ui.setupPhase,
      playerLocked: sideKey === 'player' ? false : appState.ui.playerLocked,
      enemyLocked: sideKey === 'enemy' ? false : appState.ui.enemyLocked,
      battleState: null,
    },
  });
}

export function lockSetupSide(appState, sideKey) {
  if (sideKey === 'player' && !appState.validation.playerLaunch.isValid) return appState;
  if (sideKey === 'enemy' && !appState.validation.enemyLaunch.isValid) return appState;

  return deriveState({
    route: APP_ROUTES.BUILD,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      setupPhase: sideKey === 'player' ? 'enemy' : 'ready',
      selectedSide: sideKey === 'player' ? 'enemy' : appState.ui.selectedSide,
      playerLocked: sideKey === 'player' ? true : appState.ui.playerLocked,
      enemyLocked: sideKey === 'enemy' ? true : appState.ui.enemyLocked,
    },
  });
}

export function unlockSetupSide(appState, sideKey) {
  return deriveState({
    route: APP_ROUTES.BUILD,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      setupPhase: sideKey,
      selectedSide: sideKey,
      playerLocked: sideKey === 'player' ? false : appState.ui.playerLocked,
      enemyLocked: sideKey === 'enemy' ? false : appState.ui.enemyLocked,
      battleState: null,
    },
  });
}

export function setEnemyAiPreset(appState, aiPresetId) {
  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      enemyAiPresetId: aiPresetId,
    },
  });
}

export function launchBattle(appState) {
  if (!appState.setup.canLaunch) return appState;

  return deriveState({
    route: APP_ROUTES.BATTLE,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      setupPhase: 'ready',
      battleState: initializeBattleState(appState.scenario, appState.content),
    },
  });
}

export function stepBattlePhase(appState, steps = 1) {
  const snapshot = appState.scenario;
  let nextBattle = appState.ui.battleState ?? initializeBattleState(snapshot, appState.content);

  for (let i = 0; i < steps; i += 1) {
    if (nextBattle.winner) break;

    if (nextBattle.turnOwner === 'enemy' && nextBattle.phase === 'activation') {
      const enemyApplied = applyEnemyAction(nextBattle, appState.content, appState.ui.enemyAiPresetId);
      nextBattle = enemyApplied.nextState;
    }

    nextBattle = advanceCombatPhase(nextBattle);
  }

  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      battleState: nextBattle,
    },
  });
}

export function resetBattlePhase(appState) {
  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      battleState: null,
    },
  });
}
