export function renderBuildScreen(appState) {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <h1>Chipcraft Battle Test Scaffold</h1>
    <p>Route: <strong>${appState.route}</strong></p>
    <p>Mode: <strong>${appState.mode}</strong></p>
    <span class="pill">No-build modular app initialized</span>
  `;
  return panel;
}
