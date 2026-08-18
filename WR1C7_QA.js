const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const required = [
  'RELEASE_NOTES_v3.15.md',
  'RELEASE_HIGHLIGHTS.md',
  'MIGRATION_GUIDE_v3.15.md',
  'SPRINT-WR-1C.7.md',
  'WR1C_API_BASELINE.json',
  'WR1C_API_BASELINE.md'
];
let checks = 0;
for (const file of required) {
  assert(fs.existsSync(path.join(root, file)), `${file} must exist`);
  checks += 1;
}
const version = read('VERSION').trim();
const atLeast = (actual, minimum) => { const a=actual.split('.').map(Number), b=minimum.split('.').map(Number); for(let i=0;i<3;i+=1){ if((a[i]||0)>(b[i]||0)) return true; if((a[i]||0)<(b[i]||0)) return false; } return true; };
assert(atLeast(version, '3.15.8'), `version ${version} must be v3.15.8 or later`); checks += 1;
const notes = read('RELEASE_NOTES_v3.15.md');
for (const phrase of ['AW-5A', 'AW-5B', 'WR-1A', 'WR-1B', 'Compatibility Baseline', 'Known Limitations', 'AW-6']) {
  assert(notes.includes(phrase), `release notes must include ${phrase}`);
  checks += 1;
}
const migration = read('MIGRATION_GUIDE_v3.15.md');
for (const phrase of ['WR1C_API_BASELINE.json', 'event', 'persistence', 'Business', 'Landlord', 'Life', 'RUN_REGRESSION_SUITE.js']) {
  assert(migration.includes(phrase), `migration guide must include ${phrase}`);
  checks += 1;
}
const changelog = read('CHANGELOG.md');
assert(changelog.includes('## 3.15.8 — WR-1C.7 Release Notes'), 'changelog must retain WR-1C.7'); checks += 1;
const roadmap = read('ROADMAP.md');
assert(roadmap.includes('Completed — WR-1C.7 Release Notes'), 'roadmap must mark WR-1C.7 complete'); checks += 1;
console.log(JSON.stringify({ suite: 'WR-1C.7 Release Notes', version, checks, passed: checks }, null, 2));
