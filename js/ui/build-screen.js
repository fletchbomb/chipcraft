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

function getValidationGuidance(appState) {
  if (!appState.validation.playerLaunch.isValid) {
    return 'Player setup is invalid. Place exactly one legal Core and ensure placements are legal.';
  }
  if (!appState.validation.enemyLaunch.isValid) {
    return 'Enemy setup is invalid. Place exactly one legal Core and ensure placements are legal.';
  }
  if (!appState.setup.playerLocked) {
    return 'Player setup is valid. Lock Player Setup to continue.';
  }
  if (!appState.setup.enemyLocked) {
    return 'Enemy setup is valid. Lock Enemy Setup to enable launch.';
  }
  return 'Both setups are locked and valid. Launch battle when ready.';
}

function createRebuildScene(appState, controls) {
  const section = document.createElement('section');
  section.className = 'panel rebuild-scene';

  const selectedSide = appState.ui.selectedSide;
  const selectedChipTypeId = appState.ui.selectedChipTypeId;
  const isSelectedLocked = selectedSide === 'player' ? appState.setup.playerLocked : appState.setup.enemyLocked;

  const sideSetup = appState.scenario[`${selectedSide}Setup`];
  const frame = appState.content.frames.find((f) => f.id === sideSetup.frameId);
  const legalSet = new Set(frame.legalSpaces.map(([c, r]) => `${c},${r}`));
  const builtById = new Map(sideSetup.builtChipInstances.map((chip) => [chip.chipInstanceId, chip]));
  const maxCol = Math.max(...frame.legalSpaces.map(([col]) => col));
  const maxRow = Math.max(...frame.legalSpaces.map(([, row]) => row));

  section.innerHTML = `
    <div class="rebuild-header">
      <div>
        <h2>Rebuild Surface</h2>
        <p>Editing: <strong>${selectedSide}</strong> · Locked: <strong>${isSelectedLocked}</strong></p>
      </div>
      <div class="button-row">
        <button type="button" class="route-button${selectedSide === 'player' ? ' is-active' : ''}" data-side="player">Player</button>
        <button type="button" class="route-button${selectedSide === 'enemy' ? ' is-active' : ''}" data-side="enemy">Enemy</button>
      </div>
    </div>
    <div class="rebuild-body">
      <section class="rebuild-board-wrap">
        <div class="board-grid rebuild-board" data-board></div>
      </section>
      <section class="rebuild-inventory">
        <h3>Chip Inventory</h3>
        <div class="chip-palette" data-palette></div>
      </section>
    </div>
  `;

  section.querySelectorAll('[data-side]').forEach((button) => {
    button.addEventListener('click', () => controls.selectSide(button.dataset.side));
  });

  const board = section.querySelector('[data-board]');
  board.style.gridTemplateColumns = `repeat(${maxCol + 1}, 44px)`;

  for (let row = 0; row <= maxRow; row += 1) {
    for (let col = 0; col <= maxCol; col += 1) {
      const key = `${col},${row}`;
      const isLegal = legalSet.has(key);
      const occupantId = sideSetup.placedChipIdsBySpaceKey[key];

      const cell = document.createElement('button');
      cell.type = 'button';
      const previewOpen = isLegal && !occupantId && !isSelectedLocked;
      cell.className = `board-cell${isLegal ? ' is-legal' : ''}${previewOpen ? ' is-preview' : ''}`;
      cell.disabled = !isLegal;

      if (occupantId) {
        const built = builtById.get(occupantId);
        cell.textContent = built ? built.chipTypeId.split('.').at(-1).toUpperCase() : 'X';
      }

      if (isLegal && !isSelectedLocked) {
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

  const palette = section.querySelector('[data-palette]');
  for (const chip of appState.content.chips) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `route-button chip-choice${selectedChipTypeId === chip.id ? ' is-active' : ''}`;
    btn.textContent = createChipTypeLabel(chip.id);
    btn.addEventListener('click', () => controls.selectChipType(chip.id));
    palette.appendChild(btn);
  }

  return section;
}

export function renderBuildScreen(appState, controls) {
  const vm = buildScreenViewModel(appState);
  const playerLockLabel = appState.setup.playerLocked ? 'Unlock Player Setup' : 'Lock Player Setup';
  const enemyLockLabel = appState.setup.enemyLocked ? 'Unlock Enemy Setup' : 'Lock Enemy Setup';
  const setupPhaseLabel = appState.setup.phase;
  const guidanceText = getValidationGuidance(appState);

  const aiOptions = appState.content.aiPresets
    .map(
      (preset) => `
      <option value="${preset.id}" ${preset.id === appState.ui.enemyAiPresetId ? 'selected' : ''}>
        ${preset.id}
      </option>
    `,
    )
    .join('');

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <h1>Chipcraft Battle Test — Rebuild</h1>
    <div class="button-row">
      <button type="button" class="route-button" data-action="toggle-debug">
        ${appState.ui.showDebugPanel ? 'Hide Debug' : 'Show Debug'}
      </button>
      <button type="button" class="route-button" data-action="lock-player">${playerLockLabel}</button>
      <button type="button" class="route-button" data-action="lock-enemy">${enemyLockLabel}</button>
      <button type="button" class="route-button" data-action="launch" ${appState.setup.canLaunch ? '' : 'disabled'}>
        Launch Battle
      </button>
    </div>

    <div class="status-chips">
      <span class="hud-chip">phase: ${setupPhaseLabel}</span>
      <span class="hud-chip muted">${guidanceText}</span>
      <span class="hud-chip muted">status: ${appState.loop.persistenceNotice || 'none'}</span>
    </div>

    <details class="utility-menu">
      <summary>Scenario Tools</summary>
      <div class="button-row utility-buttons">
        <button type="button" class="route-button" data-action="save-scenario">Save Scenario</button>
        <button type="button" class="route-button" data-action="load-scenario">Load Scenario</button>
        <button type="button" class="route-button" data-action="new-scenario">New Scenario</button>
      </div>

      <label class="field-label">
        Enemy AI Preset
        <select class="route-button ai-select" data-action="ai-preset">
          ${aiOptions}
        </select>
      </label>
    </details>

    ${
      appState.ui.showDebugPanel
        ? `<p><strong>Player launch errors</strong></p>
           <ul>${renderErrorList(vm.playerLaunchErrors)}</ul>
           <p><strong>Enemy launch errors</strong></p>
           <ul>${renderErrorList(vm.enemyLaunchErrors)}</ul>`
        : ''
    }
  `;

  panel.querySelector('[data-action="toggle-debug"]')?.addEventListener('click', controls.toggleDebug);
  panel.querySelector('[data-action="lock-player"]')?.addEventListener('click', () => {
    if (appState.setup.playerLocked) {
      controls.unlockSide('player');
      return;
    }
    controls.lockSide('player');
  });

  panel.querySelector('[data-action="lock-enemy"]')?.addEventListener('click', () => {
    if (appState.setup.enemyLocked) {
      controls.unlockSide('enemy');
      return;
    }
    controls.lockSide('enemy');
  });

  panel.querySelector('[data-action="launch"]')?.addEventListener('click', controls.launch);
  panel.querySelector('[data-action="save-scenario"]')?.addEventListener('click', controls.saveCurrentScenario);
  panel.querySelector('[data-action="load-scenario"]')?.addEventListener('click', controls.loadSavedScenario);
  panel.querySelector('[data-action="new-scenario"]')?.addEventListener('click', controls.startNewScenario);
  panel.querySelector('[data-action="ai-preset"]')?.addEventListener('change', (event) => {
    controls.chooseAiPreset(event.target.value);
  });

  panel.appendChild(createRebuildScene(appState, controls));
  return panel;
}
