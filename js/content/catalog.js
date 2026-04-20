import { AI_PRESETS } from './ai-presets.js';
import { CHIP_DEFINITIONS } from './chip-definitions.js';
import { FRAME_DEFINITIONS } from './frame-definitions.js';
import { STATUS_DEFINITIONS } from './status-definitions.js';

function assertUniqueIds(values, label) {
  const seen = new Set();

  for (const value of values) {
    if (seen.has(value.id)) {
      throw new Error(`${label} has duplicate id: ${value.id}`);
    }
    seen.add(value.id);
  }
}

export function loadContentCatalog() {
  assertUniqueIds(CHIP_DEFINITIONS, 'chip definitions');
  assertUniqueIds(FRAME_DEFINITIONS, 'frame definitions');
  assertUniqueIds(AI_PRESETS, 'AI presets');
  assertUniqueIds(STATUS_DEFINITIONS, 'status definitions');

  return {
    chips: CHIP_DEFINITIONS,
    frames: FRAME_DEFINITIONS,
    aiPresets: AI_PRESETS,
    statuses: STATUS_DEFINITIONS,
  };
}
