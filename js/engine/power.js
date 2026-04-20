import { getAffectedSpacesFromShape, getOrthogonalNeighbors } from './geometry.js';

function toSpaceKey(col, row) {
  return `${col},${row}`;
}

function getChipByTypeId(chipTypeId, content) {
  return content.chips.find((chip) => chip.id === chipTypeId) ?? null;
}

function buildOccupancyIndex(sideSetup, content) {
  const builtById = new Map(sideSetup.builtChipInstances.map((chip) => [chip.chipInstanceId, chip]));
  const positionByChipId = new Map();
  const chipIdByPosition = new Map();
  const chipDefByInstanceId = new Map();

  for (const [spaceKey, chipInstanceId] of Object.entries(sideSetup.placedChipIdsBySpaceKey)) {
    const built = builtById.get(chipInstanceId);
    if (!built) continue;

    const [colText, rowText] = spaceKey.split(',');
    const col = Number(colText);
    const row = Number(rowText);
    const chipDef = getChipByTypeId(built.chipTypeId, content);
    if (!chipDef) continue;

    positionByChipId.set(chipInstanceId, { col, row, key: spaceKey });
    chipIdByPosition.set(spaceKey, chipInstanceId);
    chipDefByInstanceId.set(chipInstanceId, chipDef);
  }

  return {
    positionByChipId,
    chipIdByPosition,
    chipDefByInstanceId,
  };
}

function addColor(colorMap, chipInstanceId, color) {
  if (!colorMap.has(chipInstanceId)) {
    colorMap.set(chipInstanceId, new Set());
  }
  colorMap.get(chipInstanceId).add(color);
}

export function getPowerColorsByChip(sideSetup, content) {
  const { positionByChipId, chipIdByPosition, chipDefByInstanceId } = buildOccupancyIndex(sideSetup, content);

  const colorMap = new Map();

  // Direct pylon coverage.
  for (const [chipInstanceId, chipDef] of chipDefByInstanceId.entries()) {
    if (!chipDef.pylonColor) continue;

    const sourcePos = positionByChipId.get(chipInstanceId);
    if (!sourcePos) continue;

    const shape = chipDef.pylonCoverageShape ?? 'plus1';
    const coveredSpaces = getAffectedSpacesFromShape(sourcePos.col, sourcePos.row, shape);

    for (const space of coveredSpaces) {
      const coveredChipId = chipIdByPosition.get(space.key);
      if (!coveredChipId) continue;
      addColor(colorMap, coveredChipId, chipDef.pylonColor);
    }
  }

  // Relay propagation (orthogonal pass-through).
  const relayQueue = [];
  const relaySeen = new Set();

  for (const [chipInstanceId, chipDef] of chipDefByInstanceId.entries()) {
    if (!chipDef.isRelay) continue;
    const colors = colorMap.get(chipInstanceId);
    if (!colors || colors.size === 0) continue;

    relayQueue.push(chipInstanceId);
    relaySeen.add(chipInstanceId);
  }

  while (relayQueue.length > 0) {
    const relayId = relayQueue.shift();
    const relayPos = positionByChipId.get(relayId);
    const relayColors = colorMap.get(relayId);
    if (!relayPos || !relayColors) continue;

    for (const neighbor of getOrthogonalNeighbors(relayPos.col, relayPos.row)) {
      const neighborChipId = chipIdByPosition.get(toSpaceKey(neighbor.col, neighbor.row));
      if (!neighborChipId) continue;

      for (const color of relayColors) {
        addColor(colorMap, neighborChipId, color);
      }

      const neighborDef = chipDefByInstanceId.get(neighborChipId);
      if (neighborDef?.isRelay && !relaySeen.has(neighborChipId)) {
        relaySeen.add(neighborChipId);
        relayQueue.push(neighborChipId);
      }
    }
  }

  return colorMap;
}

export function getPowerColorsForChip(sideSetup, chipInstanceId, content) {
  const colorMap = getPowerColorsByChip(sideSetup, content);
  return [...(colorMap.get(chipInstanceId) ?? new Set())];
}

export function getColorLevelsForChip(sideSetup, chipInstanceId, content) {
  const colors = getPowerColorsForChip(sideSetup, chipInstanceId, content);

  return {
    red: colors.includes('red') ? 1 : 0,
    blue: colors.includes('blue') ? 1 : 0,
    green: colors.includes('green') ? 1 : 0,
    totalColors: colors.length,
  };
}

export function getPoweredStateTagsForChip(sideSetup, chipInstanceId, content) {
  const colors = getPowerColorsForChip(sideSetup, chipInstanceId, content);
  if (colors.length === 0) return [];

  const tags = ['Powered'];
  for (const color of colors) {
    tags.push(`Powered(${color})`);
  }

  return tags;
}
