import { APP_ROUTES, isValidRoute } from './app/routes.js';
import { createInitialAppState } from './app/state.js';
import { renderApp } from './ui/render.js';

const root = document.getElementById('app');

if (!root) {
  throw new Error('App root element #app was not found.');
}

const appState = createInitialAppState();

function setRoute(nextRoute) {
  if (!isValidRoute(nextRoute)) return;

  appState.route = nextRoute;
  render();
}

function render() {
  renderApp(root, appState, {
    setRoute,
    routes: APP_ROUTES,
  });
}

render();
