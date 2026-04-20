import { APP_ROUTES, isValidRoute } from './app/routes.js';
import { createInitialAppState, placeChipFromPalette, setUiSelection } from './app/state.js';
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

function render() {
  renderApp(root, appState, {
    setRoute,
    selectSide,
    selectChipType,
    placeChip,
    routes: APP_ROUTES,
  });
}

render();
