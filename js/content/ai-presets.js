import { AI_PRESET_IDS } from './ids.js';

export const AI_PRESETS = [
  {
    id: AI_PRESET_IDS.AGGRESSOR,
    name: 'Aggressor',
    weights: {
      coreDamage: 5,
      pylonDamage: 2,
      relayDamage: 1,
      attackDamage: 3,
      breachWidening: 2,
      finish: 2,
    },
  },
  {
    id: AI_PRESET_IDS.WRECKER,
    name: 'Wrecker',
    weights: {
      coreDamage: 2,
      pylonDamage: 5,
      relayDamage: 4,
      attackDamage: 2,
      breachWidening: 3,
      finish: 2,
    },
  },
  {
    id: AI_PRESET_IDS.BULWARK,
    name: 'Bulwark',
    weights: {
      coreDamage: 3,
      pylonDamage: 2,
      relayDamage: 2,
      attackDamage: 4,
      breachWidening: 2,
      finish: 4,
    },
  },
];
