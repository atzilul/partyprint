// Translation check: node scripts/i18n-check.mjs <base> <language> <path...>
// Reads each translated page as a visitor's browser receives it and fails when something
// did not follow the Hebrew source: Hebrew letters left in the text, in spoken attributes,
// in the page's title and description or in its structured data; the wrong language on the
// page; or sentences the server met without a translation. It does not trust the mechanism:
// it looks at the result. Run it against a local build before a release and against the
// live site afterwards.
const [base,language,...paths]=process.argv.slice(2);
if(!base||!language||!paths.length)throw new Error('Usage: i18n-check.mjs <base> <language> <path...>');
const HEBREW=/[֐-׿]/;
const problems=[];
const note=(path,kind,sample)=>problems.push(decodeURI(path)+' | '+kind+(sample?' | '+sample.replace(/\s+/g,' ').slice(0,110):''));

for(const path of paths){
 const response=await fetch(base+path);
 const html=await response.text();
 if(response.status!==200){note(path,'answered '+response.status);continue;}
 const tag=html.match(/<html[^>]*>/)?.[0]||'';
 if(!tag.includes('lang="'+language+'"'))note(path,'the page is not marked as '+language,tag);
 const structured=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>match[1]);
 for(const block of structured)if(HEBREW.test(block))note(path,'Hebrew in structured data',block.match(/[^"]*[֐-׿][^"]*/)?.[0]);
 // An element marked translate="no" keeps its text on purpose (a language's own name).
 const page=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<(\w+)[^>]*\stranslate="no"[^>]*>[\s\S]*?<\/\1>/g,'');
 for(const line of page.replace(/<!-- -->/g,'').replace(/<[^>]+>/g,'\n').split('\n'))if(HEBREW.test(line))note(path,'Hebrew in the text',line.trim());
 for(const match of page.matchAll(/\s(alt|title|placeholder|aria-label|content)="([^"]*[֐-׿][^"]*)"/g))note(path,'Hebrew in '+match[1],match[2]);
 const title=html.match(/<title>([^<]*)/)?.[1]||'';
 if(HEBREW.test(title))note(path,'Hebrew in the title',title);
}
const collected=await fetch(base+'/api/i18n-missing');
if(collected.status===200){
 const missing=(await collected.json())[language]||[];
 for(const key of missing)note('(any page)','sentence without a translation',key);
}else if(process.env.PP_I18N_COLLECT==='1')note('/api/i18n-missing','the list of sentences without a translation did not arrive: HTTP '+collected.status);
console.log(language+': checked '+paths.length+' pages; '+problems.length+' problems');
for(const problem of problems.slice(0,40))console.log('  '+problem);
if(problems.length)process.exitCode=1;
