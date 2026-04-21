import { applyActivation, buildProjectedResolution, getLegalTargetsForChip, getUsableActiveChips } from './actions.js';

function getPresetById(content, presetId) {
  return content.aiPresets.find((preset) => preset.id === presetId) ?? null;
}

function getDefaultPreset(content) {
  return content.aiPresets[0] ?? null;
}

function getEffectiveWeights(content, presetId) {
  const preset = getPresetById(content, presetId) ?? getDefaultPreset(content);
  if (!preset) {
    return {
      coreDamage: 1,
      totalDamage: 1,
      disableBonus: 1,
    };
  }

  return {
    coreDamage: preset.weights.coreDamage ?? 1,
    totalDamage: preset.weights.attackDamage ?? 1,
    disableBonus: preset.weights.finish ?? 1,
  };
}

function isCoreChip(sideState, chipInstanceId) {
  return Boolean(sideState.chipsById[chipInstanceId]?.isCore);
}

function enumerateLegalActivations(battleState, sideKey, content) {
  const usable = getUsableActiveChips(battleState, sideKey, content);
  const activations = [];

  for (const acting of usable) {
    const targets = getLegalTargetsForChip(battleState, sideKey, acting.chipInstanceId, content);

    for (const target of targets) {
      const projected = buildProjectedResolution(
        battleState,
        sideKey,
        acting.chipInstanceId,
        target.chipInstanceId,
        content,
      );
      if (!projected) continue;

      activations.push({
        acting,
        target,
        projected,
      });
    }
  }

  return activations;
}

function scoreActivation(activation, battleState, sideKey, weights) {
  const enemySideKey = sideKey === 'player' ? 'enemy' : 'player';
  const enemySide = battleState[enemySideKey];

  const coreDamage = isCoreChip(enemySide, activation.target.chipInstanceId) ? activation.projected.damage : 0;
  const disableBonus = activation.projected.predictedTargetDisabled ? 1 : 0;

  const score =
    coreDamage * weights.coreDamage +
    activation.projected.damage * weights.totalDamage +
    disableBonus * weights.disableBonus;

  return {
    score,
    tieBreaker: `${activation.acting.chipInstanceId}:${activation.target.chipInstanceId}`,
  };
}

export function chooseEnemyAction(battleState, content, presetId = null) {
  const sideKey = 'enemy';
  const weights = getEffectiveWeights(content, presetId);
  const legal = enumerateLegalActivations(battleState, sideKey, content);

  if (legal.length === 0) {
    return null;
  }

  let best = null;

  for (const activation of legal) {
    const scoreData = scoreActivation(activation, battleState, sideKey, weights);

    if (!best) {
      best = { activation, ...scoreData };
      continue;
    }

    if (scoreData.score > best.score) {
      best = { activation, ...scoreData };
      continue;
    }

    if (scoreData.score === best.score && scoreData.tieBreaker < best.tieBreaker) {
      best = { activation, ...scoreData };
    }
  }

  return {
    sideKey,
    actingChipInstanceId: best.activation.acting.chipInstanceId,
    targetChipInstanceId: best.activation.target.chipInstanceId,
    projected: best.activation.projected,
    score: best.score,
  };
}

export function applyEnemyAction(battleState, content, presetId = null) {
  const choice = chooseEnemyAction(battleState, content, presetId);
  if (!choice) {
    return {
      choice: null,
      nextState: battleState,
    };
  }

  const nextState = applyActivation(
    battleState,
    choice.sideKey,
    choice.actingChipInstanceId,
    choice.targetChipInstanceId,
    content,
  );

  return {
    choice,
    nextState,
  };
}
