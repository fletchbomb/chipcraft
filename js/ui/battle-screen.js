function renderCombatants(sideState, label, options) {
  const { sideKey, usableSet, legalTargetSet, selectedActorId, selectedTargetId } = options;
  const chips = Object.values(sideState.chipsById);
  const rows = chips
    .map((chip) => {
      const hpWidth = chip.maxHp > 0 ? Math.round((chip.hp / chip.maxHp) * 100) : 0;
      const classes = ['combatant-row'];
      if (chip.isDisabled) classes.push('is-disabled');
      if (sideKey === 'player' && usableSet.has(chip.chipInstanceId)) classes.push('is-usable');
      if (sideKey === 'enemy' && legalTargetSet.has(chip.chipInstanceId)) classes.push('is-legal-target');
      if (chip.chipInstanceId === selectedActorId) classes.push('is-selected-actor');
      if (chip.chipInstanceId === selectedTargetId) classes.push('is-selected-target');
      return `
        <li class="${classes.join(' ')}">
          <div><strong>${chip.chipTypeId}</strong> <span class="chip-id">(${chip.chipInstanceId})</span></div>
          <div class="hp-track"><span class="hp-fill" style="width:${hpWidth}%"></span></div>
          <div class="hp-label">${chip.hp}/${chip.maxHp} HP</div>
        </li>
      `;
    })
    .join('');

  return `
    <section class="panel panel-sub battle-side-panel">
      <h3>${label}</h3>
      <p>Energy: <strong>${sideState.energy}</strong></p>
      <ul class="combatant-list">${rows}</ul>
    </section>
  `;
}

export function renderBattleScreen(appState, vm, controls) {
  const battle = appState.combat.current;
  const actionPreview = appState.combat.actionPreview;
  const isPlayerActivation = battle.turnOwner === 'player' && battle.phase === 'activation' && !battle.winner;
  const usableSet = new Set(actionPreview.usable.map((chip) => chip.chipInstanceId));
  const legalTargetSet = new Set(actionPreview.legalTargets.map((target) => target.chipInstanceId));
  const section = document.createElement('section');
  section.className = 'panel';

  const actorButtons = actionPreview.usable
    .map(
      (chip) => `
      <button
        type="button"
        class="route-button${appState.ui.battleActingChipId === chip.chipInstanceId ? ' is-active' : ''}"
        data-actor="${chip.chipInstanceId}">
        ${chip.chipTypeId}
      </button>
    `,
    )
    .join('');

  const targetButtons = actionPreview.legalTargets
    .map(
      (target) => `
      <button
        type="button"
        class="route-button${appState.ui.battleTargetChipId === target.chipInstanceId ? ' is-active' : ''}"
        data-target="${target.chipInstanceId}">
        ${target.chipInstanceId}
      </button>
    `,
    )
    .join('');
  const playbackItems = battle.actionLog.slice(-6).map((event) => `<li>${event}</li>`).join('');

  section.innerHTML = `
    <h2>Battle Sandbox</h2>
    <div class="button-row">
      <button type="button" class="route-button" data-action="toggle-debug">
        ${appState.ui.showDebugPanel ? 'Hide Debug' : 'Show Debug'}
      </button>
    </div>
    <p>Round <strong>${battle.round}</strong> · Turn <strong>${battle.turnOwner}</strong> · Phase <strong>${battle.phase}</strong></p>
    <p>Winner: <strong>${battle.winner ?? 'none'}</strong></p>
    <div class="button-row">
      <button type="button" class="route-button" data-action="step">Advance to Player Action</button>
      <button type="button" class="route-button" data-action="turn">Skip to Next Turn</button>
      <button type="button" class="route-button" data-action="reset">Reset Battle</button>
    </div>
    <div class="button-row">
      <button type="button" class="route-button" data-action="rematch" ${
        appState.loop.hasLockedSnapshot ? '' : 'disabled'
      }>Rematch</button>
      <button type="button" class="route-button" data-action="edit" ${
        appState.loop.hasLockedSnapshot ? '' : 'disabled'
      }>Edit Scenario</button>
      <button type="button" class="route-button" data-action="new">New Scenario</button>
      <button type="button" class="route-button" data-action="save">Save Scenario</button>
      <button type="button" class="route-button" data-action="load">Load Scenario</button>
    </div>
    <p>Scenario status: <strong>${appState.loop.persistenceNotice || 'none'}</strong></p>
    <h3>Player Action</h3>
    <p>${isPlayerActivation ? 'Select actor, then target, then confirm.' : 'Waiting for player activation phase.'}</p>
    <div class="button-row">${actorButtons || '<span class="hint-text">No usable active chips.</span>'}</div>
    <div class="button-row">${targetButtons || '<span class="hint-text">No legal targets selected.</span>'}</div>
    <div class="button-row">
      <button type="button" class="route-button" data-action="confirm" ${
        isPlayerActivation && actionPreview.projected ? '' : 'disabled'
      }>Confirm Action</button>
      <button type="button" class="route-button" data-action="clear">Clear Selection</button>
    </div>
    <p>Projected damage: <strong>${actionPreview.projected?.damage ?? 0}</strong> · Predicted HP: <strong>${
      actionPreview.projected?.predictedTargetHp ?? 'n/a'
    }</strong></p>
    <h3>Playback</h3>
    <ul class="playback-list">${playbackItems || '<li>none</li>'}</ul>
    ${
      appState.ui.showDebugPanel
        ? `<p>AI Choice Preview: <strong>${vm.aiChoice}</strong> (score ${vm.aiScore})</p>
    <p>Recent events: <strong>${vm.aiLogTail || vm.combatLogTail || 'none'}</strong></p>`
        : ''
    }
    <div class="battle-grid">
      ${renderCombatants(battle.player, 'Player Ship', {
        sideKey: 'player',
        usableSet,
        legalTargetSet,
        selectedActorId: appState.ui.battleActingChipId,
        selectedTargetId: appState.ui.battleTargetChipId,
      })}
      ${renderCombatants(battle.enemy, 'Enemy Ship', {
        sideKey: 'enemy',
        usableSet,
        legalTargetSet,
        selectedActorId: appState.ui.battleActingChipId,
        selectedTargetId: appState.ui.battleTargetChipId,
      })}
    </div>
  `;

  section.querySelector('[data-action="toggle-debug"]')?.addEventListener('click', controls.toggleDebug);
  section.querySelector('[data-action="step"]')?.addEventListener('click', controls.stepBattle);
  section.querySelector('[data-action="turn"]')?.addEventListener('click', controls.skipToNextTurn);
  section.querySelector('[data-action="reset"]')?.addEventListener('click', controls.resetBattle);
  section.querySelector('[data-action="confirm"]')?.addEventListener('click', controls.confirmAction);
  section.querySelector('[data-action="clear"]')?.addEventListener('click', controls.clearActionSelection);
  section.querySelector('[data-action="rematch"]')?.addEventListener('click', controls.rematchScenario);
  section.querySelector('[data-action="edit"]')?.addEventListener('click', controls.editScenario);
  section.querySelector('[data-action="new"]')?.addEventListener('click', controls.startNewScenario);
  section.querySelector('[data-action="save"]')?.addEventListener('click', controls.saveCurrentScenario);
  section.querySelector('[data-action="load"]')?.addEventListener('click', controls.loadSavedScenario);
  section.querySelectorAll('[data-actor]').forEach((button) => {
    button.addEventListener('click', () => controls.chooseBattleActor(button.dataset.actor));
  });
  section.querySelectorAll('[data-target]').forEach((button) => {
    button.addEventListener('click', () => controls.chooseBattleTarget(button.dataset.target));
  });

  return section;
}
