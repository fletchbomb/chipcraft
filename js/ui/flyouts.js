export function getFlyoutModel(appState) {
  return {
    title: 'Battle-Test Quick Flyout',
    items: [
      `Player launch valid: ${appState.validation.playerLaunch.isValid}`,
      `Enemy launch valid: ${appState.validation.enemyLaunch.isValid}`,
      `Player powered chips: ${appState.power.player.poweredChipCount}`,
      `Enemy powered chips: ${appState.power.enemy.poweredChipCount}`,
    ],
  };
}
