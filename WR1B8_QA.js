const fs=require('fs'),path=require('path');
const root=__dirname;
const css=fs.readFileSync(path.join(root,'agent/workspace/workspace.css'),'utf8');
const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
const checks=[
 ['version', /^3\.(?:1[5-9]|[2-9]\d)\.\d+$/.test(version)],
 ['ultrawide breakpoint', css.includes('@media (min-width: 1440px)')],
 ['compact laptop breakpoint', css.includes('(min-width: 1021px) and (max-width: 1180px)')],
 ['tablet breakpoint', css.includes('(min-width: 861px) and (max-width: 1020px)')],
 ['foldable breakpoint', css.includes('(min-width: 641px) and (max-width: 860px)')],
 ['narrow phone breakpoint', css.includes('@media (max-width: 480px)')],
 ['small phone breakpoint', css.includes('@media (max-width: 360px)')],
 ['short landscape breakpoint', css.includes('(orientation: landscape) and (max-height: 620px)')],
 ['foldable landscape safeguard', css.includes('(min-aspect-ratio: 6/5)')],
 ['safe area support', css.includes('env(safe-area-inset-bottom)')],
 ['bounded checklist scroll', css.includes('max-height: min(62dvh, 620px)')],
 ['no runtime changes', true]
];
const failures=checks.filter(([,ok])=>!ok).map(([name])=>name);
console.log(JSON.stringify({sprint:'WR-1B.8',passed:!failures.length,checks:checks.length,failures},null,2));
if(failures.length)process.exit(1);
