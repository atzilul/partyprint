// Prints the addresses of the translated pages in a language, one per line, for the sync and the check:
//   node scripts/i18n-pages.mjs ar
// The list follows i18n/routes.ts and the slug file, so a new page or slug needs no second list.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const language=process.argv[2];
const slugs=JSON.parse(readFileSync(root+'i18n/'+language+'.slugs.json','utf8'));
const source=readFileSync(root+'i18n/routes.ts','utf8');
const list=name=>{const found=source.match(new RegExp('(?<![A-Z_])'+name+'=\\[(.+?)\\] as const'));return found?[...found[1].matchAll(/'([^']+)'/g)].map(match=>match[1]):[];};
// Which lists a language has: the line "const PAGES ... ={ar:PATTERNS,en:[...PATTERNS,...CONTENT_PATTERNS]}".
const pagesLine=source.match(/const PAGES[^=]*=\{([^\n]+)\};/)[1];
const entry=pagesLine.match(new RegExp('\\b'+language+':(\\[[^\\]]*\\]|[A-Z_]+)'));
if(!entry)throw new Error('No pages for '+language);
const patterns=[...entry[1].matchAll(/[A-Z_]{4,}/g)].flatMap(match=>list(match[0]));
const sections={'/bundle-sale/[slug]':'lib/bundle-answers.ts','/prices/[slug]':'lib/price-answers.ts','/guides/[slug]':'lib/seo-pages.ts','/work/[slug]':'lib/studio-pages.ts'};
const pages=[];
for(const pattern of patterns){
 if(pattern.includes('[id]'))continue;
 if(!pattern.includes('[slug]')){pages.push('/'+language+(pattern==='/'?'':pattern));continue;}
 // Only the slugs of this section: the Hebrew source says which pages it holds.
 const own=new Set([...readFileSync(root+sections[pattern],'utf8').matchAll(/^\s*["']?slug["']?\s*:\s*["']([^"']+)["']/gm)].map(match=>match[1]));
 for(const [hebrew,translated] of Object.entries(slugs))if(own.has(hebrew))pages.push('/'+language+pattern.replace('[slug]',encodeURIComponent(translated)));
}
console.log(pages.join('\n'));
