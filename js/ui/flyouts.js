export function getFlyoutModel(appState) {
  const selectedActor = appState.ui.battleActingChipId ?? 'none';
  const selectedTarget = appState.ui.battleTargetChipId ?? 'none';
  const projected = appState.combat.actionPreview.projected;
  const projectedText = projected
    ? `${projected.damage} dmg (target HP -> ${projected.predictedTargetHp})`
    : 'none';

  return {
    title: 'Battle-Test Tactical Flyout',
    items: [
      `Player launch valid: ${appState.validation.playerLaunch.isValid}`,
      `Enemy launch valid: ${appState.validation.enemyLaunch.isValid}`,
      `Selected actor: ${selectedActor}`,
      `Selected target: ${selectedTarget}`,
      `Projected result: ${projectedText}`,
      `Player powered chips: ${appState.power.player.poweredChipCount}`,
      `Enemy powered chips: ${appState.power.enemy.poweredChipCount}`,
    ],
  };
}
