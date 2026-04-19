import { createId } from './types.js';

function toSpaceKey(col, row) {
  return `${col},${row}`;
}

function getFrameById(frameId, content) {
  return content.frames.find((frame) => frame.id === frameId) ?? null;
}

function getChipByTypeId(chipTypeId, content) {
  return content.chips.find((chip) => chip.id === chipTypeId) ?? null;
}

function isCoreChip(chipTypeId) {
  return chipTypeId.startsWith('core.');
}

export function getLegalSpacesForFrame(frameId, content) {
  const frame = getFrameById(frameId, content);
  if (!frame) return [];

  return frame.legalSpaces.map(([col, row]) => ({ col, row, key: toSpaceKey(col, row) }));
}

export function createSideSetup(frameId = null) {
  return {
    frameId,
    builtChipInstances: [],
    placedChipIdsBySpaceKey: {},
    isLocked: false,
  };
}

export function buildChipInstance(sideSetup, chipTypeId) {
  return {
    ...sideSetup,
    builtChipInstances: [
      ...sideSetup.builtChipInstances,
      {
        chipInstanceId: createId('chip-instance'),
        chipTypeId,
      },
    ],
  };
}

export function removeChipInstance(sideSetup, chipInstanceId) {
  const nextBuilt = sideSetup.builtChipInstances.filter((chip) => chip.chipInstanceId !== chipInstanceId);
  const nextPlaced = Object.fromEntries(
    Object.entries(sideSetup.placedChipIdsBySpaceKey).filter(([, placedId]) => placedId !== chipInstanceId),
  );

  return {
    ...sideSetup,
    builtChipInstances: nextBuilt,
    placedChipIdsBySpaceKey: nextPlaced,
  };
}

export function placeChipInstance(sideSetup, chipInstanceId, col, row) {
  const key = toSpaceKey(col, row);

  // Remove this instance from any prior space before placing.
  const nextPlaced = Object.fromEntries(
    Object.entries(sideSetup.placedChipIdsBySpaceKey).filter(([, placedId]) => placedId !== chipInstanceId),
  );
  nextPlaced[key] = chipInstanceId;

  return {
    ...sideSetup,
    placedChipIdsBySpaceKey: nextPlaced,
  };
}

export function clearPlacedChip(sideSetup, chipInstanceId) {
  const nextPlaced = Object.fromEntries(
    Object.entries(sideSetup.placedChipIdsBySpaceKey).filter(([, placedId]) => placedId !== chipInstanceId),
  );

  return {
    ...sideSetup,
    placedChipIdsBySpaceKey: nextPlaced,
  };
}

export function validateShipLayout(sideSetup, content) {
  const errors = [];

  if (!sideSetup.frameId) {
    errors.push('missing frame selection');
    return { isValid: false, errors };
  }

  const frame = getFrameById(sideSetup.frameId, content);
  if (!frame) {
    errors.push(`unknown frame id: ${sideSetup.frameId}`);
    return { isValid: false, errors };
  }

  const legalSpaceKeys = new Set(frame.legalSpaces.map(([col, row]) => toSpaceKey(col, row)));
  const builtInstanceIds = new Set(sideSetup.builtChipInstances.map((chip) => chip.chipInstanceId));
  const placedEntries = Object.entries(sideSetup.placedChipIdsBySpaceKey);
  const seenPlacedIds = new Set();

  for (const [spaceKey, chipInstanceId] of placedEntries) {
    if (!legalSpaceKeys.has(spaceKey)) {
      errors.push(`illegal placement space: ${spaceKey}`);
    }

    if (!builtInstanceIds.has(chipInstanceId)) {
      errors.push(`placed chip instance not built: ${chipInstanceId}`);
    }

    if (seenPlacedIds.has(chipInstanceId)) {
      errors.push(`chip instance placed in multiple spaces: ${chipInstanceId}`);
    }
    seenPlacedIds.add(chipInstanceId);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLaunchLayout(sideSetup, content) {
  const baseValidation = validateShipLayout(sideSetup, content);
  const errors = [...baseValidation.errors];

  const builtById = new Map(sideSetup.builtChipInstances.map((chip) => [chip.chipInstanceId, chip]));

  let coreCount = 0;
  for (const chipInstanceId of Object.values(sideSetup.placedChipIdsBySpaceKey)) {
    const instance = builtById.get(chipInstanceId);
    if (!instance) continue;

    const chipType = getChipByTypeId(instance.chipTypeId, content);
    if (!chipType) {
      errors.push(`unknown chip type on built instance: ${instance.chipTypeId}`);
      continue;
    }

    if (isCoreChip(chipType.id)) {
      coreCount += 1;
    }
  }

  if (coreCount !== 1) {
    errors.push(`launch layout requires exactly 1 placed Core, found ${coreCount}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
