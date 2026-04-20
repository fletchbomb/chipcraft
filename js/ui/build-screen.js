import { buildScreenViewModel } from './view-models.js';

function renderErrorList(errors) {
  if (errors.length === 0) {
    return '<li>none</li>';
  }

  return errors.map((error) => `<li>${error}</li>`).join('');
}

function createChipTypeLabel(chipTypeId) {
  return chipTypeId.replaceAll('.', ' · ');
}

function createBoardSection(appState, controls) {
  const section = document.createElement('section');
  section.className = 'panel panel-sub';

  const selectedSide = appState.ui.selectedSide;
  const selectedChipTypeId = appState.ui.selectedChipTypeId;

  const sideSetup = appState.scenario[`${selectedSide}Setup`];
  const frame = appState.content.frames.find((f) => f.id === sideSetup.frameId);
  const legalSet = new Set(frame.legalSpaces.map(([c, r]) => `${c},${r}`));

  const builtById = new Map(sideSetup.builtChipInstances.map((chip) => [chip.chipInstanceId, chip]));

  const maxCol = Math.max(...frame.legalSpaces.map(([col]) => col));
  const maxRow = Math.max(...frame.legalSpaces.map(([, row]) => row));

  section.innerHTML = `
    <h2>Interactive Setup Board</h2>
    <p>Selected side: <strong>${selectedSide}</strong></p>
    <p>Selected chip type: <strong>${selectedChipTypeId}</strong></p>
  `;

  const sideButtons = document.createElement('div');
  sideButtons.className = 'button-row';
  for (const sideKey of ['player', 'enemy']) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `route-button${selectedSide === sideKey ? ' is-active' : ''}`;
    btn.textContent = sideKey;
    btn.addEventListener('click', () => controls.selectSide(sideKey));
    sideButtons.appendChild(btn);
  }
  section.appendChild(sideButtons);

  const chipButtons = document.createElement('div');
  chipButtons.className = 'button-row';
  for (const chip of appState.content.chips) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `route-button${selectedChipTypeId === chip.id ? ' is-active' : ''}`;
    btn.textContent = createChipTypeLabel(chip.id);
    btn.addEventListener('click', () => controls.selectChipType(chip.id));
    chipButtons.appendChild(btn);
  }
  section.appendChild(chipButtons);

  const board = document.createElement('div');
  board.className = 'board-grid';
  board.style.gridTemplateColumns = `repeat(${maxCol + 1}, 42px)`;

  for (let row = 0; row <= maxRow; row += 1) {
    for (let col = 0; col <= maxCol; col += 1) {
      const key = `${col},${row}`;
      const isLegal = legalSet.has(key);

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `board-cell${isLegal ? ' is-legal' : ''}`;
      cell.disabled = !isLegal;

      const occupantId = sideSetup.placedChipIdsBySpaceKey[key];
      if (occupantId) {
        const built = builtById.get(occupantId);
        const shortLabel = built ? built.chipTypeId.split('.').at(-1).toUpperCase() : 'X';
        cell.textContent = shortLabel;
      }

      if (isLegal) {
        cell.addEventListener('click', () => {
          controls.placeChip({
            sideKey: selectedSide,
            chipTypeId: selectedChipTypeId,
            col,
            row,
          });
        });
      }

      board.appendChild(cell);
    }
  }

  section.appendChild(board);
  return section;
}

export function renderBuildScreen(appState, controls) {
  const vm = buildScreenViewModel(appState);

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <h1>Chipcraft Battle Test — Interactive Foundations</h1>
    <p>Route: <strong>${vm.route}</strong></p>
    <p>Mode: <strong>${vm.mode}</strong></p>
    <p>Frames loaded: <strong>${vm.frameCount}</strong></p>
    <p>Chip types loaded: <strong>${vm.chipCount}</strong></p>

    <h2>Construction + Validation</h2>
    <p>Player built chips: <strong>${vm.playerBuiltCount}</strong>, placed: <strong>${vm.playerPlacedCount}</strong></p>
    <p>Enemy built chips: <strong>${vm.enemyBuiltCount}</strong>, placed: <strong>${vm.enemyPlacedCount}</strong></p>
    <p>Player launch valid: <strong>${vm.playerLaunchValid}</strong></p>
    <p>Enemy launch valid: <strong>${vm.enemyLaunchValid}</strong></p>

    <p><strong>Player launch errors</strong></p>
    <ul>${renderErrorList(vm.playerLaunchErrors)}</ul>

    <p><strong>Enemy launch errors</strong></p>
    <ul>${renderErrorList(vm.enemyLaunchErrors)}</ul>

    <span class="pill">Board clicks place selected chip type</span>
  `;

  panel.appendChild(createBoardSection(appState, controls));
  return panel;
}
