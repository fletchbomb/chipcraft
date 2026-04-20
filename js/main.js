import { APP_ROUTES, isValidRoute } from './app/routes.js';
import {
  advanceToPlayerActivation,
  clearBattleSelection,
  confirmBattleAction,
  createInitialAppState,
  launchBattle,
  lockSetupSide,
  placeChipFromPalette,
  resetBattlePhase,
  selectBattleActor,
  selectBattleTarget,
  setEnemyAiPreset,
  setUiSelection,
  stepBattlePhase,
  unlockSetupSide,
} from './app/state.js';
import { renderApp } from './ui/render.js';

const root = document.getElementById('app');

if (!root) {
  throw new Error('App root element #app was not found.');
}

let appState = createInitialAppState();

function setRoute(nextRoute) {
  if (!isValidRoute(nextRoute)) return;

  appState = {
    ...appState,
    route: nextRoute,
  };
  render();
}

function selectSide(sideKey) {
  appState = setUiSelection(appState, { selectedSide: sideKey });
  render();
}

function selectChipType(chipTypeId) {
  appState = setUiSelection(appState, { selectedChipTypeId: chipTypeId });
  render();
}

function placeChip(payload) {
  appState = placeChipFromPalette(appState, payload);
  render();
}

function lockSide(sideKey) {
  appState = lockSetupSide(appState, sideKey);
  render();
}

function unlockSide(sideKey) {
  appState = unlockSetupSide(appState, sideKey);
  render();
}

function chooseAiPreset(aiPresetId) {
  appState = setEnemyAiPreset(appState, aiPresetId);
  render();
}

function launch() {
  appState = launchBattle(appState);
  render();
}

function stepBattle() {
  appState = advanceToPlayerActivation(appState);
  render();
}

function skipToNextTurn() {
  appState = stepBattlePhase(appState, 5);
  render();
}

function resetBattle() {
  appState = resetBattlePhase(appState);
  render();
}

function chooseBattleActor(chipInstanceId) {
  appState = selectBattleActor(appState, chipInstanceId);
  render();
}

function chooseBattleTarget(chipInstanceId) {
  appState = selectBattleTarget(appState, chipInstanceId);
  render();
}

function clearActionSelection() {
  appState = clearBattleSelection(appState);
  render();
}

function confirmAction() {
  appState = confirmBattleAction(appState);
  appState = advanceToPlayerActivation(appState);
  render();
}

function render() {
  renderApp(root, appState, {
    setRoute,
    selectSide,
    selectChipType,
    placeChip,
    lockSide,
    unlockSide,
    chooseAiPreset,
    launch,
    stepBattle,
    skipToNextTurn,
    resetBattle,
    chooseBattleActor,
    chooseBattleTarget,
    clearActionSelection,
    confirmAction,
    routes: APP_ROUTES,
  });
}

render();
