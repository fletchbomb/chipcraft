import { buildScreenViewModel } from './view-models.js';

function renderErrorList(errors) {
  if (errors.length === 0) {
    return '<li>none</li>';
  }

  return errors.map((error) => `<li>${error}</li>`).join('');
}

export function renderBuildScreen(appState) {
  const vm = buildScreenViewModel(appState);

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <h1>Chipcraft Battle Test — Geometry Foundations</h1>
    <p>Route: <strong>${vm.route}</strong></p>
    <p>Mode: <strong>${vm.mode}</strong></p>
    <p>Frames loaded: <strong>${vm.frameCount}</strong></p>
    <p>Chip types loaded: <strong>${vm.chipCount}</strong></p>
    <p>AI presets loaded: <strong>${vm.aiPresetCount}</strong></p>
    <p>Status definitions loaded: <strong>${vm.statusCount}</strong></p>

    <h2>Construction + Validation</h2>
    <p>Player built chips: <strong>${vm.playerBuiltCount}</strong>, placed: <strong>${vm.playerPlacedCount}</strong></p>
    <p>Enemy built chips: <strong>${vm.enemyBuiltCount}</strong>, placed: <strong>${vm.enemyPlacedCount}</strong></p>
    <p>Player launch valid: <strong>${vm.playerLaunchValid}</strong></p>
    <p>Enemy launch valid: <strong>${vm.enemyLaunchValid}</strong></p>

    <h2>Geometry Preview</h2>
    <p>Player frontier count: <strong>${vm.playerFrontierCount}</strong></p>
    <p>Enemy frontier count: <strong>${vm.enemyFrontierCount}</strong></p>
    <p>Player frontier spaces: <strong>${vm.playerFrontierList || 'none'}</strong></p>
    <p>Dot(1) from first frontier: <strong>${vm.playerDotPreview || 'none'}</strong></p>
    <p>Plus(1) from first frontier: <strong>${vm.playerPlusPreview || 'none'}</strong></p>

    <p><strong>Player launch errors</strong></p>
    <ul>${renderErrorList(vm.playerLaunchErrors)}</ul>

    <p><strong>Enemy launch errors</strong></p>
    <ul>${renderErrorList(vm.enemyLaunchErrors)}</ul>

    <span class="pill">Geometry evaluation active</span>
  `;
  return panel;
}
