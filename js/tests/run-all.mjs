import { spawnSync } from 'node:child_process';

const tests = [
  'js/tests/engine-smoke.mjs',
  'js/tests/app-state-smoke.mjs',
  'js/tests/projection-ai-consistency.mjs',
  'js/tests/construction-validation-cases.mjs',
  'js/tests/persistence-safety-cases.mjs',
];

let failed = false;

for (const test of tests) {
  const result = spawnSync(process.execPath, [test], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed = true;
    break;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`all smoke tests passed (${tests.length})`);
