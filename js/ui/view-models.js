function formatSpaceList(spaces) {
  return spaces.map((space) => `(${space.col},${space.row})`).join(', ');
}

function formatChipPower(chipPowerRows) {
  return chipPowerRows
    .map((chip) => {
      const colorText = chip.colors.length > 0 ? chip.colors.join('/') : 'none';
      return `${chip.chipTypeId}: ${colorText}`;
    })
    .join(' | ');
}

export function buildScreenViewModel(state) {
  const actionPreview = state.combat.actionPreview;

  return {
    route: state.route,
    mode: state.mode,
    chipCount: state.content.chips.length,
    frameCount: state.content.frames.length,
    aiPresetCount: state.content.aiPresets.length,
    statusCount: state.content.statuses.length,
    playerBuiltCount: state.scenario.playerSetup.builtChipInstances.length,
    enemyBuiltCount: state.scenario.enemySetup.builtChipInstances.length,
    playerPlacedCount: Object.keys(state.scenario.playerSetup.placedChipIdsBySpaceKey).length,
    enemyPlacedCount: Object.keys(state.scenario.enemySetup.placedChipIdsBySpaceKey).length,
    playerLayoutValid: state.validation.playerLayout.isValid,
    playerLaunchValid: state.validation.playerLaunch.isValid,
    enemyLayoutValid: state.validation.enemyLayout.isValid,
    enemyLaunchValid: state.validation.enemyLaunch.isValid,
    playerLaunchErrors: state.validation.playerLaunch.errors,
    enemyLaunchErrors: state.validation.enemyLaunch.errors,
    playerFrontierCount: state.geometry.player.frontierSpaces.length,
    enemyFrontierCount: state.geometry.enemy.frontierSpaces.length,
    playerFrontierList: formatSpaceList(state.geometry.player.frontierSpaces),
    playerDotPreview: formatSpaceList(state.geometry.player.dotPreview),
    playerPlusPreview: formatSpaceList(state.geometry.player.plusPreview),
    playerPoweredCount: state.power.player.poweredChipCount,
    enemyPoweredCount: state.power.enemy.poweredChipCount,
    playerPowerSummary: formatChipPower(state.power.player.chips),
    enemyPowerSummary: formatChipPower(state.power.enemy.chips),
    combatRound: state.combat.current.round,
    combatTurnOwner: state.combat.current.turnOwner,
    combatPhase: state.combat.current.phase,
    playerEnergy: state.combat.current.player.energy,
    enemyEnergy: state.combat.current.enemy.energy,
    combatWinner: state.combat.current.winner,
    combatLogTail: state.combat.logTail.join(' | '),
    usableActiveCount: actionPreview.usable.length,
    legalTargetCount: actionPreview.legalTargets.length,
    projectedDamage: actionPreview.projected?.damage ?? 0,
    projectedHp: actionPreview.projected?.predictedTargetHp ?? null,
    projectedDisabled: actionPreview.projected?.predictedTargetDisabled ?? false,
    postActivationLogTail: actionPreview.postActivation.actionLog.slice(-2).join(' | '),
  };
}
