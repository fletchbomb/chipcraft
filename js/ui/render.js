import { renderBuildScreen } from './build-screen.js';

export function renderApp(root, appState) {
  root.innerHTML = '';
  root.appendChild(renderBuildScreen(appState));
}
