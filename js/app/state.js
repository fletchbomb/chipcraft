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

function createDefaultScenario() {
  return {
    playerSetup: createSeedSide(FRAME_IDS.SCOUT),
    enemySetup: createSeedSide(FRAME_IDS.SCOUT),
  };
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

function createCombatPreview(currentBattleState, content, ui) {
  const usable = getUsableActiveChips(currentBattleState, 'player', content);
  const selectedActorId = ui.battleActingChipId;
  const selectedActorIsUsable = usable.some((chip) => chip.chipInstanceId === selectedActorId);
  const legalTargets =
    selectedActorIsUsable && selectedActorId
      ? getLegalTargetsForChip(currentBattleState, 'player', selectedActorId, content)
      : [];
  const selectedTargetId = ui.battleTargetChipId;
  const projected =
    selectedActorIsUsable && selectedTargetId
      ? buildProjectedResolution(currentBattleState, 'player', selectedActorId, selectedTargetId, content)
      : null;
  const aiChoice =
    currentBattleState.turnOwner === 'enemy' && currentBattleState.phase === 'activation'
      ? chooseEnemyAction(currentBattleState, content, ui.enemyAiPresetId)
      : null;

  return {
    current: currentBattleState,
    logTail: currentBattleState.actionLog.slice(-5),
    actionPreview: {
      usable,
      legalTargets,
      projected,
      postActivation: currentBattleState,
    },
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
    loop: {
      hasLockedSnapshot: Boolean(ui.lockedScenarioSnapshot),
      lockedScenarioId: ui.lockedScenarioSnapshot?.scenario?.scenarioId ?? null,
      persistenceNotice: ui.persistenceNotice ?? '',
    },
    geometry: {
      player: createGeometryPreview(playerSetup, content),
      enemy: createGeometryPreview(enemySetup, content),
    },
    power: {
      player: createPowerPreview(playerSetup, content),
      enemy: createPowerPreview(enemySetup, content),
    },
    combat: createCombatPreview(currentBattleState, content, ui),
    battleTest,
    persistence: createPersistencePreview(battleTest),
  };
}

export function createInitialAppState() {
  const content = loadContentCatalog();
  const scenario = createDefaultScenario();

  const ui = {
    selectedSide: 'player',
    selectedChipTypeId: CHIP_TYPE_IDS.CANNON_I,
    setupPhase: 'player',
    playerLocked: false,
    enemyLocked: false,
    enemyAiPresetId: AI_PRESET_IDS.AGGRESSOR,
    battleActingChipId: null,
    battleTargetChipId: null,
    lockedScenarioSnapshot: null,
    persistenceNotice: '',
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
      battleActingChipId: null,
      battleTargetChipId: null,
      lockedScenarioSnapshot: null,
      persistenceNotice: '',
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
      battleActingChipId: null,
      battleTargetChipId: null,
      persistenceNotice: '',
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
  const scenarioShell = createScenarioShell({
    name: 'Battle Test Scenario',
    playerSetup: appState.scenario.playerSetup,
    enemySetup: appState.scenario.enemySetup,
    aiPresetId: appState.ui.enemyAiPresetId,
  });
  const lockedScenarioSnapshot = lockScenarioSnapshot(scenarioShell);

  return deriveState({
    route: APP_ROUTES.BATTLE,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      setupPhase: 'ready',
      battleActingChipId: null,
      battleTargetChipId: null,
      lockedScenarioSnapshot,
      persistenceNotice: '',
      battleState: startBattleFromLockedSnapshot(lockedScenarioSnapshot, appState.content),
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
      battleActingChipId: null,
      battleTargetChipId: null,
      persistenceNotice: '',
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
      battleActingChipId: null,
      battleTargetChipId: null,
      persistenceNotice: '',
      battleState: null,
    },
  });
}

export function advanceToPlayerActivation(appState) {
  let next = appState;

  for (let i = 0; i < 20; i += 1) {
    const battle = next.combat.current;
    if (battle.winner) break;
    if (battle.turnOwner === 'player' && battle.phase === 'activation') break;
    next = stepBattlePhase(next, 1);
  }

  return next;
}

export function selectBattleActor(appState, chipInstanceId) {
  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      battleActingChipId: chipInstanceId,
      battleTargetChipId: null,
      persistenceNotice: '',
    },
  });
}

export function selectBattleTarget(appState, chipInstanceId) {
  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      battleTargetChipId: chipInstanceId,
      persistenceNotice: '',
    },
  });
}

export function clearBattleSelection(appState) {
  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      battleActingChipId: null,
      battleTargetChipId: null,
      persistenceNotice: '',
    },
  });
}

export function confirmBattleAction(appState) {
  const battle = appState.ui.battleState ?? initializeBattleState(appState.scenario, appState.content);
  const actorId = appState.ui.battleActingChipId;
  const targetId = appState.ui.battleTargetChipId;
  if (!actorId || !targetId) return appState;
  if (battle.turnOwner !== 'player' || battle.phase !== 'activation') return appState;

  const resolved = applyActivation(battle, 'player', actorId, targetId, appState.content);
  const advanced = advanceCombatPhase(resolved);

  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      battleActingChipId: null,
      battleTargetChipId: null,
      persistenceNotice: '',
      battleState: advanced,
    },
  });
}

export function rematchLockedScenario(appState) {
  if (!appState.ui.lockedScenarioSnapshot) return appState;

  return deriveState({
    route: APP_ROUTES.BATTLE,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      battleActingChipId: null,
      battleTargetChipId: null,
      persistenceNotice: '',
      battleState: rematchFromLockedSnapshot(appState.ui.lockedScenarioSnapshot, appState.content),
    },
  });
}

export function editLockedScenario(appState) {
  if (!appState.ui.lockedScenarioSnapshot) return appState;
  const scenario = editScenarioFromLockedSnapshot(appState.ui.lockedScenarioSnapshot);

  return deriveState({
    route: APP_ROUTES.BUILD,
    content: appState.content,
    scenario: {
      playerSetup: scenario.playerSetup,
      enemySetup: scenario.enemySetup,
    },
    ui: {
      ...appState.ui,
      setupPhase: 'player',
      selectedSide: 'player',
      playerLocked: false,
      enemyLocked: false,
      enemyAiPresetId: scenario.aiPresetId ?? appState.ui.enemyAiPresetId,
      battleActingChipId: null,
      battleTargetChipId: null,
      persistenceNotice: 'Loaded locked scenario into setup',
      battleState: null,
    },
  });
}

export function newScenario(appState) {
  return deriveState({
    route: APP_ROUTES.BUILD,
    content: appState.content,
    scenario: createDefaultScenario(),
    ui: {
      ...appState.ui,
      setupPhase: 'player',
      selectedSide: 'player',
      playerLocked: false,
      enemyLocked: false,
      battleActingChipId: null,
      battleTargetChipId: null,
      lockedScenarioSnapshot: null,
      persistenceNotice: 'Started a new scenario',
      battleState: null,
    },
  });
}

export function saveScenario(appState) {
  const scenario = createScenarioShell({
    name: 'Battle Test Scenario',
    playerSetup: appState.scenario.playerSetup,
    enemySetup: appState.scenario.enemySetup,
    aiPresetId: appState.ui.enemyAiPresetId,
  });
  const ok = saveScenarioSnapshot(scenario);

  return deriveState({
    route: appState.route,
    content: appState.content,
    scenario: appState.scenario,
    ui: {
      ...appState.ui,
      persistenceNotice: ok ? `Saved scenario ${scenario.scenarioId}` : 'Save failed (storage unavailable)',
    },
  });
}

export function loadScenario(appState) {
  const loaded = loadScenarioSnapshot();
  if (!loaded?.playerSetup || !loaded?.enemySetup) {
    return deriveState({
      route: appState.route,
      content: appState.content,
      scenario: appState.scenario,
      ui: {
        ...appState.ui,
        persistenceNotice: 'No saved scenario found',
      },
    });
  }

  return deriveState({
    route: APP_ROUTES.BUILD,
    content: appState.content,
    scenario: {
      playerSetup: loaded.playerSetup,
      enemySetup: loaded.enemySetup,
    },
    ui: {
      ...appState.ui,
      selectedSide: 'player',
      setupPhase: 'player',
      playerLocked: false,
      enemyLocked: false,
      enemyAiPresetId: loaded.aiPresetId ?? appState.ui.enemyAiPresetId,
      battleActingChipId: null,
      battleTargetChipId: null,
      lockedScenarioSnapshot: null,
      persistenceNotice: `Loaded scenario ${loaded.scenarioId ?? 'unknown'}`,
      battleState: null,
    },
  });
}
