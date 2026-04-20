const APP_STATE_KEY = 'chipcraft.battleTest.scaffold.state';
const SCENARIO_KEY = 'chipcraft.battleTest.scenario.v1';

function resolveStorage(storageOverride = null) {
  if (storageOverride) return storageOverride;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

export function saveAppState(state, storageOverride = null) {
  const storage = resolveStorage(storageOverride);
  if (!storage) return false;

  storage.setItem(APP_STATE_KEY, JSON.stringify(state));
  return true;
}

export function loadAppState(storageOverride = null) {
  const storage = resolveStorage(storageOverride);
  if (!storage) return null;

  const raw = storage.getItem(APP_STATE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveScenarioSnapshot(scenario, storageOverride = null) {
  const storage = resolveStorage(storageOverride);
  if (!storage) return false;

  storage.setItem(SCENARIO_KEY, JSON.stringify(scenario));
  return true;
}

export function loadScenarioSnapshot(storageOverride = null) {
  const storage = resolveStorage(storageOverride);
  if (!storage) return null;

  const raw = storage.getItem(SCENARIO_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearScenarioSnapshot(storageOverride = null) {
  const storage = resolveStorage(storageOverride);
  if (!storage) return false;

  storage.removeItem(SCENARIO_KEY);
  return true;
}
