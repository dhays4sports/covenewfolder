const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const checks = [];
const check = (condition, message) => {
  checks.push({ pass: Boolean(condition), message });
  if (!condition) throw new Error(message);
};

const version = read('VERSION').trim();
const versionParts = version.split('.').map(Number);
check(versionParts[0] > 3 || (versionParts[0] === 3 && (versionParts[1] > 15 || (versionParts[1] === 15 && versionParts[2] >= 4))), 'VERSION is 3.15.4 or newer');
check(read('CHANGELOG.md').includes('3.15.4 — WR-1B.10 Production Candidate'), 'Changelog includes WR-1B.10');
check(read('ROADMAP.md').includes('[x] WR-1B.10 Production Candidate'), 'Roadmap marks WR-1B.10 complete');
check(read('ROADMAP.md').includes('[x] WR-1B UI, Accessibility & Performance Polish'), 'Roadmap marks WR-1B complete');

[
  'SPRINT-WR-1B.10.md',
  'WR1B_PRODUCTION_CANDIDATE.md',
  'WR1B_PRODUCTION_CHECKLIST.md',
  'WR1B_ACCESSIBILITY_REPORT.md',
  'WR1B_PERFORMANCE_REPORT.md',
  'WR1B_REGRESSION_REPORT.md'
].forEach((name) => check(fs.existsSync(path.join(root, name)), `${name} exists`));

const candidate = read('WR1B_PRODUCTION_CANDIDATE.md');
check(candidate.includes('Production Candidate'), 'Candidate report identifies production-candidate status');
check(candidate.includes('Known limitations'), 'Candidate report documents known limitations');
check(candidate.includes('WR-1C'), 'Candidate report identifies WR-1C as the next gate');

const checklist = read('WR1B_PRODUCTION_CHECKLIST.md');
check(checklist.includes('Regression'), 'Production checklist covers regression');
check(checklist.includes('Accessibility'), 'Production checklist covers accessibility');
check(checklist.includes('Performance'), 'Production checklist covers performance');
check(checklist.includes('Responsive'), 'Production checklist covers responsive behavior');

const qa = read('QA.md');
check(qa.includes('WR-1B.10 Production Candidate'), 'QA documentation includes WR-1B.10');

console.log(JSON.stringify({ suite: 'WR-1B.10 Production Candidate', checks: checks.length, passed: checks.length }, null, 2));
