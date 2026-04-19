function formatSpaceList(spaces) {
  return spaces.map((space) => `(${space.col},${space.row})`).join(', ');
}

export function buildScreenViewModel(state) {
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
  };
}
