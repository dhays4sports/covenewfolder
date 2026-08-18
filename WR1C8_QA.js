const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
let checks = 0;
const required = [
  'WR1C_READINESS_SCORE.md',
  'WR1C_FINAL_PRODUCTION_CERTIFICATION.md',
  'WR1C8_TEST_REPORT.md',
  'SPRINT-WR-1C.8.md',
  'WR1C_API_BASELINE.json',
  'RELEASE_NOTES_v3.15.md'
];
for (const file of required) {
  assert(fs.existsSync(path.join(root, file)), `${file} must exist`);
  checks += 1;
}
const version = read('VERSION').trim();
const atLeast = (actual, minimum) => { const a=actual.split('.').map(Number), b=minimum.split('.').map(Number); for(let i=0;i<3;i+=1){ if((a[i]||0)>(b[i]||0)) return true; if((a[i]||0)<(b[i]||0)) return false; } return true; };
assert(atLeast(version, '3.15.9'), `version ${version} must be v3.15.9 or later`); checks += 1;
const score = read('WR1C_READINESS_SCORE.md');
for (const phrase of ['9.6 / 10', 'Architecture', 'Accessibility', 'Performance', 'Deployment Readiness', 'Remaining Operational Gates', 'AW-6 Printable Consultation Sheet']) {
  assert(score.includes(phrase), `readiness score must include ${phrase}`);
  checks += 1;
}
const certification = read('WR1C_FINAL_PRODUCTION_CERTIFICATION.md');
for (const phrase of ['APPROVED — STABLE PRODUCTION BASELINE', 'controlled production use', 'WR1C_API_BASELINE.json', 'Certification Boundaries', 'WR-1 is complete']) {
  assert(certification.includes(phrase), `certification must include ${phrase}`);
  checks += 1;
}
const roadmap = read('ROADMAP.md');
assert(roadmap.includes('- [x] WR-1 Workspace Production Readiness'), 'WR-1 must be complete'); checks += 1;
assert(roadmap.includes('- [x] WR-1C Documentation, Production Audit & Release Candidate'), 'WR-1C must be complete'); checks += 1;
assert(roadmap.includes('Completed — WR-1C.8'), 'WR-1C.8 completion must be documented'); checks += 1;
const changelog = read('CHANGELOG.md');
assert(changelog.includes('## 3.15.9 — WR-1C.8 Final Production Certification'), 'changelog must retain WR-1C.8'); checks += 1;
const baseline = JSON.parse(read('WR1C_API_BASELINE.json'));
assert(baseline.baselineVersion || baseline.version, 'API baseline must retain a baseline version'); checks += 1;
console.log(JSON.stringify({ suite: 'WR-1C.8 Final Production Certification', version, checks, passed: checks }, null, 2));
