const fs = require('fs');
const path = require('path');

const root = __dirname;
const routes = [
  'index.html',
  'agent/workspace/index.html',
  'agent/consultation/index.html',
  'home/index.html',
  'home/report/index.html',
  'business/index.html',
  'business/assessment/index.html',
  'landlord/index.html',
  'assessment/index.html',
  'privacy/index.html',
  'terms/index.html',
  'transition/index.html'
];

const checks = [];
function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
  if (!pass) throw new Error(`${name}${detail ? `: ${detail}` : ''}`);
}

for (const route of routes) {
  check(`route exists: ${route}`, fs.existsSync(path.join(root, route)));
}

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
})(root);

const attrPattern = /(?:src|href)=["']([^"']+)["']/gi;
const ignored = /^(?:https?:|mailto:|tel:|sms:|data:|javascript:|#)/i;
let referencesChecked = 0;
const missing = [];

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  let match;
  while ((match = attrPattern.exec(html))) {
    let ref = match[1].trim();
    if (!ref || ignored.test(ref)) continue;
    ref = ref.split('#')[0].split('?')[0];
    if (!ref) continue;
    referencesChecked += 1;
    const target = ref.startsWith('/')
      ? path.join(root, ref.replace(/^\/+/, ''))
      : path.resolve(path.dirname(htmlFile), ref);
    const candidates = [target, path.join(target, 'index.html')];
    if (!candidates.some(fs.existsSync)) {
      missing.push(`${path.relative(root, htmlFile)} -> ${match[1]}`);
    }
  }
}

check('HTML files discovered', htmlFiles.length > 0, `${htmlFiles.length}`);
check('local HTML references resolve', missing.length === 0, missing.join('; '));

const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
check('release version is valid semver', /^\d+\.\d+\.\d+$/.test(version), version);
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
check('changelog contains current release', changelog.includes(`## ${version} `), version);

console.log(JSON.stringify({
  suite: 'STATIC_RELEASE_QA',
  passed: checks.length,
  htmlFiles: htmlFiles.length,
  referencesChecked,
  checks
}, null, 2));
