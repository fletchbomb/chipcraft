export function renderBattleScreen(vm) {
  const section = document.createElement('section');
  section.className = 'panel panel-sub';
  section.innerHTML = `
    <h2>Battle Surface Preview</h2>
    <p>Round <strong>${vm.combatRound}</strong> · Turn <strong>${vm.combatTurnOwner}</strong> · Phase <strong>${vm.combatPhase}</strong></p>
    <p>Player Energy: <strong>${vm.playerEnergy}</strong> | Enemy Energy: <strong>${vm.enemyEnergy}</strong></p>
    <p>Winner: <strong>${vm.combatWinner ?? 'none'}</strong></p>
    <p>AI Choice: <strong>${vm.aiChoice}</strong> (score ${vm.aiScore})</p>
    <p>Recent events: <strong>${vm.aiLogTail || vm.combatLogTail || 'none'}</strong></p>
  `;
  return section;
}
