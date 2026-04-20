function getChipByTypeId(chipTypeId, content) {
  return content.chips.find((chip) => chip.id === chipTypeId) ?? null;
}

function isCoreChip(chipTypeId) {
  return chipTypeId.startsWith('core.');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSideCombatState(sideSetup, content) {
  const chipsById = {};

  for (const chipInstance of sideSetup.builtChipInstances) {
    const chipDef = getChipByTypeId(chipInstance.chipTypeId, content);
    if (!chipDef) continue;

    chipsById[chipInstance.chipInstanceId] = {
      chipInstanceId: chipInstance.chipInstanceId,
      chipTypeId: chipInstance.chipTypeId,
      hp: chipDef.hp,
      maxHp: chipDef.hp,
      isDisabled: false,
      energyCost: chipDef.energy ?? 0,
      isCore: isCoreChip(chipDef.id),
    };
  }

  return {
    frameId: sideSetup.frameId,
    placedChipIdsBySpaceKey: { ...sideSetup.placedChipIdsBySpaceKey },
    chipsById,
    energy: 0,
  };
}

function getCoreEnergy(sideState) {
  let total = 0;

  for (const chip of Object.values(sideState.chipsById)) {
    if (chip.isCore && !chip.isDisabled) {
      total += chip.energyCost;
    }
  }

  return total;
}

function getActiveSideKey(turnOwner) {
  return turnOwner === 'player' ? 'player' : 'enemy';
}

function appendLog(state, message) {
  state.actionLog.push(message);
}

export function initializeBattleState(snapshot, content) {
  return {
    round: 1,
    turnOwner: 'player',
    phase: 'turn_start',
    winner: null,
    player: buildSideCombatState(snapshot.playerSetup, content),
    enemy: buildSideCombatState(snapshot.enemySetup, content),
    actionLog: ['battle initialized'],
  };
}

export function advanceCombatPhase(inputState) {
  const state = clone(inputState);
  if (state.winner) return state;

  const activeSideKey = getActiveSideKey(state.turnOwner);
  const activeSide = state[activeSideKey];

  switch (state.phase) {
    case 'turn_start':
      appendLog(state, `${state.turnOwner} turn start`);
      state.phase = 'energy_gain';
      return state;

    case 'energy_gain': {
      const gain = getCoreEnergy(activeSide);
      activeSide.energy += gain;
      appendLog(state, `${state.turnOwner} gains ${gain} energy`);
      state.phase = 'auto_resolution';
      return state;
    }

    case 'auto_resolution':
      appendLog(state, `${state.turnOwner} auto resolution`);
      state.phase = 'activation';
      return state;

    case 'activation':
      appendLog(state, `${state.turnOwner} activation step`);
      state.phase = 'turn_end';
      return state;

    case 'turn_end':
      appendLog(state, `${state.turnOwner} turn end`);
      if (state.turnOwner === 'enemy') {
        state.round += 1;
        state.turnOwner = 'player';
      } else {
        state.turnOwner = 'enemy';
      }
      state.phase = 'turn_start';
      return state;

    default:
      return state;
  }
}

export function applyDamageToChip(inputState, sideKey, chipInstanceId, amount) {
  const state = clone(inputState);
  if (state.winner) return state;

  const side = state[sideKey];
  if (!side) return state;

  const chip = side.chipsById[chipInstanceId];
  if (!chip || chip.isDisabled) return state;

  chip.hp = Math.max(0, chip.hp - amount);
  chip.isDisabled = chip.hp <= 0;
  appendLog(state, `${sideKey} ${chipInstanceId} takes ${amount} damage`);

  if (chip.isCore && chip.isDisabled) {
    state.winner = sideKey === 'player' ? 'enemy' : 'player';
    appendLog(state, `${state.winner} wins (core disabled)`);
  }

  return state;
}
