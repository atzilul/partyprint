// Translation sync (experiment). Three steps, each safe to repeat:
//   collect  <language> <base> <path...>   render the pages and list the sentences that have no translation
//   merge    <language> <file>             add translations (an array in the order of the missing list) to the dictionary
//   publish  <language>                    write the dictionary the browser loads
// The Hebrew text in the code is the only source. A sentence is keyed by its Hebrew text with
// the numbers masked, so an edited sentence is a new key and shows up in the missing list.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const [step,language,...rest]=process.argv.slice(2);
const dictionaryFile=root+'i18n/'+language+'.json',missingFile=root+'i18n/'+language+'.missing.json';
const read=file=>existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null;
const write=(file,value)=>writeFileSync(file,JSON.stringify(value,null,1)+'\n');
const slots=text=>[...text.matchAll(/\{(\d+)(?::[a-z]+)?\}/g)].map(match=>match[1]).sort().join(',');
const HEBREW=/[\u0590-\u05ff]/;

if(step==='collect'){
 const [base,...paths]=rest;
 for(const path of paths){const response=await fetch(base+path);await response.text();if(response.status!==200)throw new Error(path+' answered '+response.status);}
 const response=await fetch(base+'/api/i18n-missing');
 if(response.status!==200)throw new Error('The server is not in collect mode (PP_I18N_COLLECT=1).');
 const dictionary=read(dictionaryFile)||{};
 // The server lists what it met since it started; keep only what still has no translation.
 const extra=read(root+'i18n/'+language+'.browser.json')||[];
 const missing=[...new Set([...((await response.json())[language]||[]),...extra])].filter(key=>!(key in dictionary));
 write(missingFile,missing);
 const words=missing.join(' ').split(/\s+/).filter(Boolean).length;
 console.log(language+': '+missing.length+' sentences without a translation ('+words+' words) -> i18n/'+language+'.missing.json');
}else if(step==='merge'){
 const missing=read(missingFile),translations=read(rest[0]);
 if(!Array.isArray(missing)||!Array.isArray(translations)||missing.length!==translations.length)throw new Error('The translations must be an array as long as the missing list ('+(missing||[]).length+').');
 const dictionary=read(dictionaryFile)||{},problems=[];
 missing.forEach((key,index)=>{
  const value=translations[index];
  if(typeof value!=='string'||!value.trim())problems.push('empty: '+key);
  else if(HEBREW.test(value))problems.push('Hebrew left in the translation: '+key);
  else if(slots(key)!==slots(value))problems.push('numbers do not match: '+key+' -> '+value);
  else dictionary[key]=value;
 });
 write(dictionaryFile,dictionary);
 write(missingFile,missing.filter(key=>!(key in dictionary)));
 console.log(language+': '+Object.keys(dictionary).length+' sentences in the dictionary; '+problems.length+' rejected');
 for(const problem of problems.slice(0,20))console.log('  '+problem);
}else if(step==='publish'){
 const dictionary=read(dictionaryFile)||{};
 mkdirSync(root+'public/i18n',{recursive:true});
 const nouns=read(root+'i18n/'+language+'.nouns.json')||{};
 writeFileSync(root+'public/i18n/'+language+'.js','window.__PP_I18N='+JSON.stringify({language,dictionary,nouns}).replace(/</g,'\\u003c')+';\n');
 console.log(language+': published '+Object.keys(dictionary).length+' sentences to public/i18n/'+language+'.js');
}else if(step==='scan'){
 // Sentences that show only in some states (an error, a closed-hours notice) are not met by
 // rendering a page once. Whole Hebrew strings in the given source files are added as candidates;
 // a string that is glued to others with "+" is skipped, because the page shows the glued result.
 const browserFile=root+'i18n/'+language+'.browser.json',known=new Set(read(browserFile)||[]),before=known.size;
 const mask=text=>text.replace(/\d+(?:[.,]\d+)*/g,(()=>{let index=0;return()=>'{'+(index++)+'}';})());
 for(const file of rest){
  const source=readFileSync(root+file,'utf8');
  const literal=/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  for(let match;(match=literal.exec(source));){
   const [whole,quote,body]=match;
   if(!HEBREW.test(body)||(quote==='`'&&body.includes('${')))continue;
   const previous=source.slice(0,match.index).trimEnd().slice(-1),next=source.slice(match.index+whole.length).trimStart()[0];
   if(previous==='+'||next==='+')continue;
   known.add(mask(body.replace(/\\(['"`\\])/g,'$1').trim()));
  }
  for(const match of source.matchAll(/>([^<>{}]*[֐-׿][^<>{}]*)</g))known.add(mask(match[1].trim()));
 }
 write(browserFile,[...known]);
 console.log(language+': '+(known.size-before)+' candidate sentences added from '+rest.length+' source files');
}else throw new Error('Expected collect, scan, merge or publish.');
