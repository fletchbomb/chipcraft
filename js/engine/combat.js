export function initializeBattleState(snapshot) {
  return {
    snapshot,
    turnOwner: 'player',
    round: 1,
  };
}
