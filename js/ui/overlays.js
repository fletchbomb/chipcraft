export function getOverlayModel(appState) {
  return {
    title: 'Systems Overlay',
    summary: `Round ${appState.combat.current.round} • ${appState.combat.current.turnOwner} • ${appState.combat.current.phase}`,
    status: appState.combat.current.winner ? `Winner: ${appState.combat.current.winner}` : 'No winner yet',
  };
}
