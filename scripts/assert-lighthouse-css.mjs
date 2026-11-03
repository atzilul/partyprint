import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';

const manifestPath=resolve('artifacts/lighthouse-ci/manifest.json');
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const maxCssBytes=60*1024;
const checked=[];
const checkedPaths=new Set();

for(const entry of manifest){
  const path=resolve(entry.jsonPath||'');
  const report=JSON.parse(readFileSync(path,'utf8'));
  try{checkedPaths.add(new URL(entry.url).pathname)}catch{}
  const requests=report.audits?.['network-requests']?.details?.items||[];
  const stylesheets=requests.filter(item=>String(item.resourceType||'').toLowerCase()==='stylesheet');
  assert(stylesheets.length>0,`No stylesheet requests found for ${entry.url||report.finalDisplayedUrl}`);
  const cssBytes=stylesheets.reduce((sum,item)=>sum+(Number(item.transferSize)||0),0);
  assert(cssBytes<=maxCssBytes,`Initial CSS transfer is ${cssBytes} bytes for ${entry.url||report.finalDisplayedUrl}; maximum is ${maxCssBytes}`);
  checked.push({url:entry.url||report.finalDisplayedUrl,cssTransferBytes:cssBytes,lcpMs:report.audits?.['largest-contentful-paint']?.numericValue,totalTransferBytes:report.audits?.['total-byte-weight']?.numericValue});
}

assert(checked.length>=2,'Expected Lighthouse reports for / and /lp/bride.');
assert(checkedPaths.has('/')&&checkedPaths.has('/lp/bride'),'Lighthouse must measure both / and /lp/bride.');
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/lighthouse-summary.json',JSON.stringify({maxCssTransferBytes:maxCssBytes,reports:checked},null,2)+'\n');
console.log(JSON.stringify({maxCssTransferBytes:maxCssBytes,reports:checked},null,2));
