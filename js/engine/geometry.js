function toSpaceKey(col, row) {
  return `${col},${row}`;
}

function parseSpaceKey(spaceKey) {
  const [colText, rowText] = spaceKey.split(',');
  return {
    col: Number(colText),
    row: Number(rowText),
  };
}

function getFrameById(frameId, content) {
  return content.frames.find((frame) => frame.id === frameId) ?? null;
}

function getFrameSpaceKeySet(frameId, content) {
  const frame = getFrameById(frameId, content);
  if (!frame) return new Set();

  return new Set(frame.legalSpaces.map(([col, row]) => toSpaceKey(col, row)));
}

function getShapeOffsets(shape) {
  switch (shape) {
    case 'self':
    case 'dot1':
      return [[0, 0]];
    case 'line2':
      return [[0, -1], [0, -2]];
    case 'line3':
      return [[0, -1], [0, -2], [0, -3]];
    case 'plus1':
      return [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0]];
    case 'radial1':
      return [[0, -1], [1, 0], [0, 1], [-1, 0]];
    default:
      return [[0, 0]];
  }
}

export function getLegalSpacesForFrame(frameId, content) {
  const frame = getFrameById(frameId, content);
  if (!frame) return [];

  return frame.legalSpaces.map(([col, row]) => ({ col, row, key: toSpaceKey(col, row) }));
}

export function getOrthogonalNeighbors(col, row) {
  return [
    { col, row: row - 1, key: toSpaceKey(col, row - 1) },
    { col: col + 1, row, key: toSpaceKey(col + 1, row) },
    { col, row: row + 1, key: toSpaceKey(col, row + 1) },
    { col: col - 1, row, key: toSpaceKey(col - 1, row) },
  ];
}

export function getOccupiedSpaces(sideSetup) {
  return Object.entries(sideSetup.placedChipIdsBySpaceKey).map(([spaceKey, chipInstanceId]) => ({
    ...parseSpaceKey(spaceKey),
    key: spaceKey,
    chipInstanceId,
  }));
}

export function getAffectedSpacesFromShape(originCol, originRow, shape) {
  return getShapeOffsets(shape).map(([dCol, dRow]) => {
    const col = originCol + dCol;
    const row = originRow + dRow;
    return { col, row, key: toSpaceKey(col, row) };
  });
}

export function getFrontierSpaces(sideSetup, content) {
  const legalKeys = getFrameSpaceKeySet(sideSetup.frameId, content);
  const occupiedEntries = Object.entries(sideSetup.placedChipIdsBySpaceKey);
  const occupiedSet = new Set(occupiedEntries.map(([spaceKey]) => spaceKey));

  const frontier = [];
  for (const [spaceKey, chipInstanceId] of occupiedEntries) {
    const { col, row } = parseSpaceKey(spaceKey);
    const forwardKey = toSpaceKey(col, row - 1);

    const forwardIsLegal = legalKeys.has(forwardKey);
    const forwardIsOccupied = occupiedSet.has(forwardKey);
    const isFrontier = !forwardIsLegal || !forwardIsOccupied;

    if (isFrontier) {
      frontier.push({ col, row, key: spaceKey, chipInstanceId });
    }
  }

  return frontier;
}
