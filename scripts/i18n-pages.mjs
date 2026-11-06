// Prints the addresses of the purchase path in a language, one per line, for the sync and the check:
//   node scripts/i18n-pages.mjs ar
// The list follows i18n/routes.ts and the slug file, so a new page or slug needs no second list.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const language=process.argv[2];
const slugs=JSON.parse(readFileSync(root+'i18n/'+language+'.slugs.json','utf8'));
const source=readFileSync(root+'i18n/routes.ts','utf8');
const patterns=[...source.match(/PATTERNS=\[(.+)\] as const/)[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
const sections={'/bundle-sale/[slug]':'lib/bundle-answers.ts','/prices/[slug]':'lib/price-answers.ts'};
const pages=[];
for(const pattern of patterns){
 if(pattern.includes('[id]'))continue;
 if(!pattern.includes('[slug]')){pages.push('/'+language+(pattern==='/'?'':pattern));continue;}
 // Only the slugs of this section: the Hebrew source says which answers it holds.
 const own=new Set([...readFileSync(root+sections[pattern],'utf8').matchAll(/^\s*slug:'([^']+)'/gm)].map(match=>match[1]));
 for(const [hebrew,translated] of Object.entries(slugs))if(own.has(hebrew))pages.push('/'+language+pattern.replace('[slug]',encodeURIComponent(translated)));
}
console.log(pages.join('\n'));
