// Translation sync (experiment). Each step is safe to repeat:
//   collect  <language> <base> <path...>   render the pages and list the sentences that have no translation
//   scan     <language> <file...>          add whole Hebrew strings from source files (states a page shows only sometimes)
//   merge    <language> <file>             add translations (an array in the order of the missing list) to the dictionary
//   publish  <language>                    write the dictionary the browser loads
// The Hebrew text in the code is the only source. A sentence is keyed by its Hebrew text with
// the numbers masked, so an edited sentence is a new key and shows up in the missing list.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const root=fileURLToPath(new URL('../',import.meta.url));
const [step,language,...rest]=process.argv.slice(2);
const dictionaryFile=root+'i18n/'+language+'.json',missingFile=root+'i18n/'+language+'.missing.json',candidatesFile=root+'i18n/'+language+'.candidates.json';
const read=file=>existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null;
const write=(file,value)=>writeFileSync(file,JSON.stringify(value,null,1)+'\n');
const HEBREW=/[\u0590-\u05ff]/;
const mask=text=>{let index=0;return text.replace(/<\/?\d+\/?>|\{v\d+\}|\d+(?:[.,]\d+)*/g,found=>found[0]==='<'||found[0]==='{'?found:'{'+(index++)+'}');};
/** The numbered places of a sentence: numbers ({0}, {0:noun}) and elements (<0>, </0>, <0/>). {0#noun} prints a noun only and is extra. */
const places=text=>[...text.matchAll(/\{(v?\d+)(?::[a-z]+)?\}/g)].map(match=>'n'+match[1]).concat([...text.matchAll(/<\/?(\d+)\/?>/g)].map(match=>match[0])).sort().join(' ');
// The same hash as i18n/core.ts.
function hashKey(text){
 let high=0xdeadbeef,low=0x41c6ce57;
 for(let index=0;index<text.length;index++){const code=text.charCodeAt(index);high=Math.imul(high^code,2654435761);low=Math.imul(low^code,1597334677);}
 high=Math.imul(high^(high>>>16),2246822507)^Math.imul(low^(low>>>13),3266489909);
 low=Math.imul(low^(low>>>16),2246822507)^Math.imul(high^(high>>>13),3266489909);
 return (4294967296*(2097151&low)+(high>>>0)).toString(36);
}

if(step==='collect'){
 const [base,...paths]=rest;
 for(const path of paths){const response=await fetch(base+path);await response.text();if(response.status!==200)throw new Error(path+' answered '+response.status);}
 const response=await fetch(base+'/api/i18n-missing');
 if(response.status!==200)throw new Error('The server is not in collect mode (PP_I18N_COLLECT=1).');
 const dictionary=read(dictionaryFile)||{};
 // The server lists what it and the browser met since it started; add the scanned candidates and keep what has no translation.
 const missing=[...new Set([...((await response.json())[language]||[]),...(read(candidatesFile)||[])])].filter(key=>!(key in dictionary));
 write(missingFile,missing);
 const words=missing.join(' ').split(/\s+/).filter(Boolean).length;
 console.log(language+': '+missing.length+' sentences without a translation ('+words+' words) -> i18n/'+language+'.missing.json');
}else if(step==='scan'){
 // Read the source as the compiler does. A string that is glued to others with "+" or sits in a
 // template with values is skipped: the page shows the glued result, which rendering collects.
 const known=new Set(read(candidatesFile)||[]),before=known.size;
 // Words joined by hyphens with no space are an address of a page, not a sentence.
 const address=/^[^\s]+(?:-[^\s]+)+$/;
 // So is a link; and copy that still holds a named place ({designFee}) is filled in before it is shown.
 const unshown=/^https?:\/\/|\{[a-zA-Z]+\}/;
 const add=text=>{const clean=text.replace(/\s+/g,' ').trim();if(clean&&HEBREW.test(clean)&&!address.test(clean)&&!unshown.test(clean))known.add(mask(clean));};
 for(const file of rest){
  const source=ts.createSourceFile(file,readFileSync(root+file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const visit=node=>{
   if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)||ts.isTypeNode(node))return;
   if(ts.isJsxText(node)){
    // Text that shares its element with a computed value is a piece of a sentence, not a sentence.
    const pieces=node.parent.children?.some(child=>ts.isJsxExpression(child)&&child.expression&&!ts.isStringLiteral(child.expression));
    if(!pieces)add(node.getText(source).split('\n').map(line=>line.trim()).filter(Boolean).join(' '));
   }
   else if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){
    const parent=node.parent;
    const glued=ts.isBinaryExpression(parent)&&parent.operatorToken.kind===ts.SyntaxKind.PlusToken;
    const compared=ts.isBinaryExpression(parent)&&[ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(parent.operatorToken.kind);
    const name=ts.isPropertyAssignment(parent)&&parent.name===node;
    if(!glued&&!compared&&!name)add(node.text);
   }
   ts.forEachChild(node,visit);
  };
  visit(source);
 }
 write(candidatesFile,[...known]);
 console.log(language+': '+(known.size-before)+' candidate sentences added from '+rest.length+' source files ('+known.size+' in all)');
}else if(step==='merge'){
 const missing=read(missingFile),translations=read(rest[0]);
 if(!Array.isArray(missing)||!Array.isArray(translations)||missing.length!==translations.length)throw new Error('The translations must be an array as long as the missing list ('+(missing||[]).length+').');
 const dictionary=read(dictionaryFile)||{},problems=[];
 missing.forEach((key,index)=>{
  const value=translations[index];
  if(typeof value!=='string'||!value.trim())problems.push('empty: '+key);
  else if(HEBREW.test(value))problems.push('Hebrew left in the translation: '+key);
  else if(places(key)!==places(value))problems.push('numbers or element places do not match: '+key+' -> '+value);
  else dictionary[key]=value;
 });
 write(dictionaryFile,dictionary);
 write(missingFile,missing.filter(key=>!(key in dictionary)));
 console.log(language+': '+Object.keys(dictionary).length+' sentences in the dictionary; '+problems.length+' rejected');
 for(const problem of problems.slice(0,20))console.log('  '+problem);
}else if(step==='publish'){
 const dictionary=read(dictionaryFile)||{},nouns=read(root+'i18n/'+language+'.nouns.json')||{},hashed={};
 for(const [key,value] of Object.entries(dictionary)){
  const hash=hashKey(key);
  if(hash in hashed)throw new Error('Two sentences share a hash: '+key);
  hashed[hash]=value;
 }
 mkdirSync(root+'public/i18n',{recursive:true});
 const body='window.__PP_I18N='+JSON.stringify({language,dictionary:hashed,nouns}).replace(/</g,'\\u003c')+';\n';
 writeFileSync(root+'public/i18n/'+language+'.js',body);
 // The address of the dictionary carries a hash of its content, so a browser never keeps an older one.
 const versions=read(root+'i18n/versions.json')||{};versions[language]=hashKey(body);write(root+'i18n/versions.json',versions);
 console.log(language+': published '+Object.keys(dictionary).length+' sentences to public/i18n/'+language+'.js ('+Math.round(Buffer.byteLength(body)/1024)+'KB)');
}else throw new Error('Expected collect, scan, merge or publish.');
