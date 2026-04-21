import { applyDamageToChip } from './combat.js';
import { getFrontierSpaces } from './geometry.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getChipByTypeId(chipTypeId, content) {
  return content.chips.find((chip) => chip.id === chipTypeId) ?? null;
}

function getEnemySideKey(sideKey) {
  return sideKey === 'player' ? 'enemy' : 'player';
}

function getPlacedChipIds(sideState) {
  return new Set(Object.values(sideState.placedChipIdsBySpaceKey));
}

function toSideSetupLike(sideState) {
  return {
    frameId: sideState.frameId,
    placedChipIdsBySpaceKey: sideState.placedChipIdsBySpaceKey,
  };
}

export function getUsableActiveChips(battleState, sideKey, content) {
  const side = battleState[sideKey];
  if (!side) return [];

  const placedIds = getPlacedChipIds(side);
  const usable = [];

  for (const chip of Object.values(side.chipsById)) {
    const chipDef = getChipByTypeId(chip.chipTypeId, content);
    if (!chipDef) continue;

    const isActive = chipDef.chipClass === 'active';
    const hasEnergy = side.energy >= (chipDef.energy ?? 0);
    const isPlaced = placedIds.has(chip.chipInstanceId);

    if (isActive && !chip.isDisabled && isPlaced && hasEnergy) {
      usable.push({
        chipInstanceId: chip.chipInstanceId,
        chipTypeId: chip.chipTypeId,
        energyCost: chipDef.energy ?? 0,
        damage: chipDef.damage ?? 0,
      });
    }
  }

  return usable;
}

export function getLegalTargetsForChip(battleState, sideKey, actingChipInstanceId, content) {
  const side = battleState[sideKey];
  const enemySideKey = getEnemySideKey(sideKey);
  const enemySide = battleState[enemySideKey];
  if (!side || !enemySide) return [];

  const actingChip = side.chipsById[actingChipInstanceId];
  if (!actingChip || actingChip.isDisabled) return [];

  const frontier = getFrontierSpaces(toSideSetupLike(enemySide), content);
  return frontier
    .map((space) => ({
      chipInstanceId: space.chipInstanceId,
      col: space.col,
      row: space.row,
    }))
    .filter((target) => !enemySide.chipsById[target.chipInstanceId]?.isDisabled);
}

export function buildProjectedResolution(battleState, sideKey, actingChipInstanceId, targetChipInstanceId, content) {
  const usable = getUsableActiveChips(battleState, sideKey, content);
  const acting = usable.find((chip) => chip.chipInstanceId === actingChipInstanceId);
  if (!acting) return null;

  const enemySideKey = getEnemySideKey(sideKey);
  const targetChip = battleState[enemySideKey].chipsById[targetChipInstanceId];
  if (!targetChip) return null;

  const predictedHp = Math.max(0, targetChip.hp - acting.damage);

  return {
    sideKey,
    actingChipInstanceId,
    targetChipInstanceId,
    energyCost: acting.energyCost,
    damage: acting.damage,
    predictedTargetHp: predictedHp,
    predictedTargetDisabled: predictedHp <= 0,
  };
}

export function applyActivation(battleState, sideKey, actingChipInstanceId, targetChipInstanceId, content) {
  const side = battleState[sideKey];
  if (!side) return battleState;

  const projection = buildProjectedResolution(
    battleState,
    sideKey,
    actingChipInstanceId,
    targetChipInstanceId,
    content,
  );
  if (!projection) return battleState;

  const next = clone(battleState);

  next[sideKey].energy = Math.max(0, next[sideKey].energy - projection.energyCost);
  next.actionLog.push(
    `${sideKey} activates ${actingChipInstanceId} -> ${targetChipInstanceId} (${projection.damage} dmg)`,
  );

  return applyDamageToChip(next, getEnemySideKey(sideKey), targetChipInstanceId, projection.damage);
}
