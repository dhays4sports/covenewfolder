const fs=require('fs');
const path='assets/js/assessment-engine.js';
const s=fs.readFileSync(path,'utf8');
const tests=[
 ['consumer firstName',/report\.consumer\s*=\s*\{[\s\S]*?firstName:/],
 ['consumer lastName',/lastName:/],
 ['consumer propertyAddress',/propertyAddress:/],
 ['consumer reviewContext',/reviewContext:\s*report\.reviewContext/],
 ['integration payload',/integration,\s*[\s\S]*?trigger:/],
 ['integration source fallback',/source:\s*report\.integration\?\.source\s*\|\|\s*report\.attribution\?\.source/],
 ['integration session id',/sessionId:\s*report\.integration\?\.sessionId/],
 ['backward compatible name',/name:\s*enteredName/],
 ['backward compatible detail',/detail,\s*[\s\S]*?propertyAddress/],
 ['prospect profile retained',/prospectProfile:\s*prospect/],
 ['prefilled boolean',/prefilled:\s*Boolean\(\(prospect/]
];
let failed=0;for(const [name,re] of tests){const ok=re.test(s);console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log(`CF-INT-1F: ${tests.length}/${tests.length} passed`);
