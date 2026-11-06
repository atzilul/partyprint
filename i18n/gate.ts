import {DIRECTION,hasHebrew,translateDeep,translateText} from './core';
import type {GateEnvironment,Language} from './core';

/**
 * The gate itself: it sits where React elements are created (the JSX runtime), so it sees
 * every piece of text a page or component puts on the screen, wherever that text was
 * written or computed. On a Hebrew address it returns the props untouched.
 */
type Props=Record<string,unknown>;
type Make=(type:unknown,props:Props,key?:unknown)=>unknown;

/** Attributes that are read by people, on elements and on components alike. */
const SPOKEN=['alt','placeholder','aria-label'];
/** Further attributes that are text only on real elements; on a component they may be data. */
const ELEMENT_ONLY=['title','aria-description','aria-roledescription','label'];

export function createGate(environment:GateEnvironment){
 const text=(value:string,language:Language)=>translateText(value,language,environment);

 /**
  * Neighbouring strings and numbers are one sentence that the code happened to write in
  * pieces ("כל סבב נוסף עולה ", fee, " ₪."). They are translated together and the result
  * takes the first place; the other places stay, empty, so no sibling changes position.
  */
 function children(list:unknown[],language:Language):unknown[]{
  let out=list;
  const put=(index:number,value:unknown)=>{if(out===list)out=list.slice();out[index]=value;};
  for(let start=0;start<list.length;start++){
   const item=list[start];
   if(Array.isArray(item)){const inner=item.map(entry=>typeof entry==='string'?text(entry,language):entry);if(inner.some((entry,index)=>entry!==item[index]))put(start,inner);continue;}
   if(typeof item!=='string'&&typeof item!=='number')continue;
   let end=start;
   while(end+1<list.length&&(typeof list[end+1]==='string'||typeof list[end+1]==='number'))end++;
   const run=list.slice(start,end+1) as (string|number)[];
   const joined=run.join('');
   if(hasHebrew(joined)){
    const translated=text(joined,language);
    if(translated!==joined){put(start,translated);for(let index=start+1;index<=end;index++)put(index,null);}
   }
   start=end;
  }
  return out;
 }

 function structuredData(props:Props,language:Language):Props{
  const html=(props.dangerouslySetInnerHTML as {__html?:unknown}|undefined)?.__html;
  if(props.type!=='application/ld+json'||typeof html!=='string'||!hasHebrew(html))return props;
  try{
   const translated=JSON.stringify(translateDeep(JSON.parse(html),language,environment)).replace(/</g,'\\u003c');
   return {...props,dangerouslySetInnerHTML:{__html:translated}};
  }catch{return props;}
 }

 return function gate(type:unknown,props:Props|null,make:Make):Props|null{
  if(!props)return props;
  const language=environment.language();
  if(language==='he')return props;
  if(type==='style')return props;
  if(type==='script')return structuredData(props,language);
  let out=props;
  const set=(name:string,value:unknown)=>{if(out===props)out={...props};out[name]=value;};
  if(type==='html'){set('lang',language);set('dir',DIRECTION[language]);}
  const inner=props.children;
  if(typeof inner==='string'){const translated=text(inner,language);if(translated!==inner)set('children',translated);}
  else if(Array.isArray(inner)){const translated=children(inner,language);if(translated!==inner)set('children',translated);}
  const host=typeof type==='string';
  for(const name of host?[...SPOKEN,...ELEMENT_ONLY]:SPOKEN){
   const value=props[name];
   if(typeof value==='string'){const translated=text(value,language);if(translated!==value)set(name,translated);}
  }
  // The browser needs the same dictionary before it takes over the page.
  if(type==='body'){
   const script=environment.dictionaryScript(language);
   if(script){const current=out.children;set('children',[make('script',{src:script},'partyprint-i18n'),...(Array.isArray(current)?current:[current])]);}
  }
  return out;
 };
}
