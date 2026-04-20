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

export function renderApp(root, appState) {
  root.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'layout-stack';

  const vm = buildScreenViewModel(appState);

  shell.appendChild(renderBuildScreen(appState));
  shell.appendChild(renderBattleScreen(vm));
  shell.appendChild(renderMetaPanel(appState));

  root.appendChild(shell);
}
