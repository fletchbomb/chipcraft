import { loadContentCatalog } from '../content/catalog.js';

export function createInitialAppState() {
  const content = loadContentCatalog();

  return {
    appVersion: '0.2.0-content-foundation',
    route: 'battle-test-setup',
    mode: 'battle-test',
    content,
  };
}
