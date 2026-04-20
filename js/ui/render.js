import { renderBattleScreen } from './battle-screen.js';
import { renderBuildScreen } from './build-screen.js';
import { getFlyoutModel } from './flyouts.js';
import { getOverlayModel } from './overlays.js';
import { buildScreenViewModel } from './view-models.js';

function renderMetaPanel(appState) {
  const flyout = getFlyoutModel(appState);
  const overlay = getOverlayModel(appState);

  const section = document.createElement('section');
  section.className = 'panel panel-sub';

  const flyoutItems = flyout.items.map((item) => `<li>${item}</li>`).join('');

  section.innerHTML = `
    <h2>${overlay.title}</h2>
    <p>${overlay.summary}</p>
    <p>${overlay.status}</p>

    <h3>${flyout.title}</h3>
    <ul>${flyoutItems}</ul>
  `;

  return section;
}

function renderNav(appState, controls) {
  const nav = document.createElement('section');
  nav.className = 'panel panel-sub nav-panel';

  nav.innerHTML = `
    <h2>Mode Surface</h2>
    <p>Current route: <strong>${appState.route}</strong></p>
  `;

  const buttonRow = document.createElement('div');
  buttonRow.className = 'button-row';

  const entries = [
    ['Build', controls.routes.BUILD],
    ['Battle', controls.routes.BATTLE],
    ['Loop', controls.routes.LOOP],
  ];

  for (const [label, route] of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `route-button${appState.route === route ? ' is-active' : ''}`;
    button.textContent = label;
    button.addEventListener('click', () => controls.setRoute(route));
    buttonRow.appendChild(button);
  }

  nav.appendChild(buttonRow);
  return nav;
}

export function renderApp(root, appState, controls) {
  root.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'layout-stack';

  const vm = buildScreenViewModel(appState);

  shell.appendChild(renderNav(appState, controls));

  if (appState.route === controls.routes.BUILD) {
    shell.appendChild(renderBuildScreen(appState, controls));
  }

  if (appState.route === controls.routes.BATTLE) {
    shell.appendChild(renderBattleScreen(appState, vm, controls));
  }

  if (appState.route === controls.routes.LOOP) {
    shell.appendChild(renderMetaPanel(appState));
  }

  root.appendChild(shell);
}
