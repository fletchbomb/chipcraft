import { buildScreenViewModel } from './view-models.js';

export function renderBuildScreen(appState) {
  const vm = buildScreenViewModel(appState);

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <h1>Chipcraft Battle Test — Foundations</h1>
    <p>Route: <strong>${vm.route}</strong></p>
    <p>Mode: <strong>${vm.mode}</strong></p>
    <p>Frames loaded: <strong>${vm.frameCount}</strong></p>
    <p>Chip types loaded: <strong>${vm.chipCount}</strong></p>
    <p>AI presets loaded: <strong>${vm.aiPresetCount}</strong></p>
    <p>Status definitions loaded: <strong>${vm.statusCount}</strong></p>
    <span class="pill">Content catalog validated</span>
  `;
  return panel;
}
