export function getOverlayModel(appState) {
  const events = appState.combat.current.actionLog.slice(-4).join(' | ') || 'none';

  return {
    title: 'Systems Overlay',
    summary: `Round ${appState.combat.current.round} • ${appState.combat.current.turnOwner} • ${appState.combat.current.phase}`,
    status: appState.combat.current.winner
      ? `Winner: ${appState.combat.current.winner}`
      : `No winner yet • Recent: ${events}`,
  };
}
