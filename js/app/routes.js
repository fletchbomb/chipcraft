export const APP_ROUTES = {
  BUILD: 'battle-test-build',
  BATTLE: 'battle-test-battle',
  LOOP: 'battle-test-loop',
};

export function isValidRoute(route) {
  return Object.values(APP_ROUTES).includes(route);
}
