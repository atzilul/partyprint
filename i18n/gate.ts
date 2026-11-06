import {DIRECTION,fillNumbers,findTranslation,hasHebrew,localizedHref,parseRich,translateDeep,translateText} from './core';
import type {GateEnvironment,Language,RichPart} from './core';

/**
 * The gate itself: it sits where React elements are created (the JSX runtime), so it sees
 * every piece of text a page or component puts on the screen, wherever that text was
 * written or computed. On a Hebrew address it returns the props untouched.
 */
type Props=Record<string,unknown>;
type Element={type:unknown;props:Props;key:unknown};
type Create=(type:unknown,props:Props,key?:unknown)=>unknown;

/** Attributes that are read by people, on elements and on components alike. */
const SPOKEN=['alt','placeholder','aria-label'];
/** Further attributes that are text only on real elements; on a component they may be data. */
const ELEMENT_ONLY=['title','aria-description','aria-roledescription','label'];
/** Elements that sit inside a sentence. Anything else ends the sentence. */
const INLINE=new Set(['b','i','strong','em','span','bdi','bdo','small','u','mark','a','br','wbr','sup','sub','q','abbr','time']);
const LONGEST_SENTENCE=600;
/**
 * A sentence is really split when an element inside it carries words or a number, or when
 * text continues on both sides of an element (a line break). An icon before a line of text
 * is not a split sentence; its text is translated as it is.
 */
const SPLIT=/<\d+>[^<]*[֐-׿\d][^<]*<\/\d+>|[֐-׿][^<]*<\d+\/>[^<]*[֐-׿]/;

const isElement=(value:unknown):value is Element=>!!value&&typeof value==='object'&&'$$typeof' in value&&'props' in value&&'type' in value;

export function createGate(environment:GateEnvironment){
 /** An element whose text the gate changed remembers the Hebrew it was made from. */
 const hebrew=new WeakMap<object,unknown>();
 const text=(value:string,language:Language)=>translateText(value,language,environment);

 /** The Hebrew sentence that runs through these children, with a numbered place for each element. */
 function sentence(list:unknown[],places:Element[],depth:number):string|null{
  let out='';
  for(const item of list){
   if(item===null||item===undefined||typeof item==='boolean')continue;
   if(typeof item==='string'||typeof item==='number'){out+=item;continue;}
   if(!isElement(item))return null;
   const host=typeof item.type==='string';
   if(host&&!INLINE.has(item.type as string))return null;
   const inner=hebrew.has(item)?hebrew.get(item):item.props.children;
   const place=places.push(item)-1;
   if(inner===undefined||inner===null){out+='<'+place+'/>';continue;}
   if(depth>=2)return null;
   const body=sentence(Array.isArray(inner)?inner:[inner],places,depth+1);
   if(body===null)return null;
   out+='<'+place+'>'+body+'</'+place+'>';
  }
  return out.length>LONGEST_SENTENCE?null:out;
 }

 /** A sentence written around small elements is translated whole; the elements move with it. */
 function whole(list:unknown[],language:Language,create:Create):unknown[]|null{
  if(!list.some(isElement)||!list.some(item=>typeof item==='string'&&hasHebrew(item)))return null;
  const places:Element[]=[],source=sentence(list,places,0);
  if(source===null||!SPLIT.test(source))return null;
  const found=findTranslation(source,language,environment);
  if(!found)return null;
  const parts=parseRich(found.translated);
  if(!parts)return null;
  const nouns=environment.nouns(language);
  let broken=false;
  const build=(nodes:RichPart[]):unknown[]=>nodes.map(node=>{
   if(typeof node==='string')return fillNumbers(node,found.numbers,language,nouns);
   const element=places[node.slot];
   if(!element){broken=true;return null;}
   return node.children===null?element:create(element.type,{...element.props,children:build(node.children)},element.key??undefined);
  });
  const built=build(parts);
  if(broken)return null;
  return [found.before,...built,found.after].filter(part=>part!=='');
 }

 /**
  * Neighbouring strings and numbers are one sentence that the code happened to write in
  * pieces ("כל סבב נוסף עולה ", fee, " ₪."). They are translated together and the result
  * takes the first place; the other places stay, empty, so no sibling changes position.
  */
 function pieces(list:unknown[],language:Language):unknown[]{
  let out=list;
  const put=(index:number,value:unknown)=>{if(out===list)out=list.slice();out[index]=value;};
  for(let start=0;start<list.length;start++){
   const item=list[start];
   if(Array.isArray(item)){const inner=item.map(entry=>typeof entry==='string'?text(entry,language):entry);if(inner.some((entry,index)=>entry!==item[index]))put(start,inner);continue;}
   if(typeof item!=='string'&&typeof item!=='number')continue;
   let end=start;
   while(end+1<list.length&&(typeof list[end+1]==='string'||typeof list[end+1]==='number'))end++;
   const joined=(list.slice(start,end+1) as (string|number)[]).join('');
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

 function translate(type:unknown,props:Props,language:Language,create:Create):Props{
  // The standard HTML attribute: this element is not to be translated (a language's own name, a brand).
  if(type==='style'||props.translate==='no')return props;
  if(type==='script')return structuredData(props,language);
  let out=props;
  const set=(name:string,value:unknown)=>{if(out===props)out={...props};out[name]=value;};
  if(type==='html'){set('lang',language);set('dir',DIRECTION[language]);}
  const inner=props.children;
  if(typeof inner==='string'){const translated=text(inner,language);if(translated!==inner)set('children',translated);}
  else if(Array.isArray(inner)){const translated=whole(inner,language,create)??pieces(inner,language);if(translated!==inner)set('children',translated);}
  const host=typeof type==='string';
  for(const name of host?[...SPOKEN,...ELEMENT_ONLY]:SPOKEN){
   const value=props[name];
   if(typeof value==='string'){const translated=text(value,language);if(translated!==value)set(name,translated);}
  }
  if(typeof props.href==='string'){const href=localizedHref(language,props.href);if(href!==props.href)set('href',href);}
  if(type==='body'){
   const scripts=environment.scripts(language).map((script,index)=>create('script',script.src?{src:script.src}:{dangerouslySetInnerHTML:{__html:script.code}},'partyprint-i18n-'+index));
   if(scripts.length){const current=out.children;set('children',[...scripts,...(Array.isArray(current)?current:[current])]);}
  }
  return out;
 }

 /** Wraps one of React's element makers. `create` makes the elements the gate itself adds. */
 return function wrap<Rest extends unknown[]>(make:(type:unknown,props:Props,key:unknown,...rest:Rest)=>unknown,create:Create){
  return (type:unknown,props:Props,key?:unknown,...rest:Rest):unknown=>{
   if(!props)return make(type,props,key,...rest);
   const language=environment.language();
   if(language==='he')return make(type,props,key,...rest);
   const translated=translate(type,props,language,create);
   const element=make(type,translated,key,...rest);
   if(translated.children!==props.children&&element&&typeof element==='object')hebrew.set(element,props.children);
   return element;
  };
 };
}
