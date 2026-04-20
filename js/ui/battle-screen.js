function renderCombatants(sideState, label) {
  const chips = Object.values(sideState.chipsById);
  const rows = chips
    .map((chip) => {
      const hpWidth = chip.maxHp > 0 ? Math.round((chip.hp / chip.maxHp) * 100) : 0;
      return `
        <li class="combatant-row ${chip.isDisabled ? 'is-disabled' : ''}">
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
  const section = document.createElement('section');
  section.className = 'panel';
  section.innerHTML = `
    <h2>Battle Sandbox</h2>
    <p>Round <strong>${battle.round}</strong> · Turn <strong>${battle.turnOwner}</strong> · Phase <strong>${battle.phase}</strong></p>
    <p>Winner: <strong>${battle.winner ?? 'none'}</strong></p>
    <div class="button-row">
      <button type="button" class="route-button" data-action="step">Advance Phase</button>
      <button type="button" class="route-button" data-action="turn">Skip to Next Turn</button>
      <button type="button" class="route-button" data-action="reset">Reset Battle</button>
    </div>
    <p>AI Choice Preview: <strong>${vm.aiChoice}</strong> (score ${vm.aiScore})</p>
    <p>Recent events: <strong>${vm.aiLogTail || vm.combatLogTail || 'none'}</strong></p>
    <div class="battle-grid">
      ${renderCombatants(battle.player, 'Player Ship')}
      ${renderCombatants(battle.enemy, 'Enemy Ship')}
    </div>
  `;

  section.querySelector('[data-action="step"]')?.addEventListener('click', controls.stepBattle);
  section.querySelector('[data-action="turn"]')?.addEventListener('click', controls.skipToNextTurn);
  section.querySelector('[data-action="reset"]')?.addEventListener('click', controls.resetBattle);

  return section;
}
