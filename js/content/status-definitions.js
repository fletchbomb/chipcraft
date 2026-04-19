import { STATUS_IDS } from './ids.js';

export const STATUS_DEFINITIONS = [
  { id: STATUS_IDS.MARK, lifecycle: 'scheduled', stack: 'stacking' },
  { id: STATUS_IDS.SHIELD, lifecycle: 'intensity', stack: 'stacking' },
  { id: STATUS_IDS.SHOCK, lifecycle: 'intensity-decay', stack: 'stacking' },
  { id: STATUS_IDS.FIRE, lifecycle: 'intensity-decay', stack: 'stacking' },
  { id: STATUS_IDS.JAMMED, lifecycle: 'duration', stack: 'non-stacking' },
  { id: STATUS_IDS.OVERLOAD, lifecycle: 'scheduled', stack: 'non-stacking' },
];
