const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const excluded = new Set(['RUN_REGRESSION_SUITE.js']);
const tests = fs.readdirSync(root)
  .filter((name) => (name.endsWith('_QA.js') || name.endsWith('_QA.mjs')) && !excluded.has(name))
  .sort();

const results = [];
for (const test of tests) {
  const run = spawnSync(process.execPath, [path.join(root, test)], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, COVERAGEFIT_REGRESSION: '1' }
  });
  results.push({
    test,
    pass: run.status === 0,
    status: run.status,
    stdout: (run.stdout || '').trim(),
    stderr: (run.stderr || '').trim()
  });
}

const failed = results.filter((result) => !result.pass);
const summary = {
  suite: 'CoverageFit Regression Suite',
  version: fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim(),
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results: results.map(({ test, pass, status }) => ({ test, pass, status }))
};

console.log(JSON.stringify(summary, null, 2));
if (failed.length) {
  for (const failure of failed) {
    console.error(`\n--- ${failure.test} ---`);
    if (failure.stdout) console.error(failure.stdout);
    if (failure.stderr) console.error(failure.stderr);
  }
  process.exit(1);
}
