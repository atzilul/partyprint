import {DIRECTION,fillNumbers,findTranslation,hasHebrew,parseRich,translateDeep,translateText} from './core';
import {localizedAddress,localizedHref} from './routes';
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

/*
 * Left to right, the page also reverses two things the Hebrew code writes outside any sentence:
 * a price ("440 ₪" becomes "₪440", also when the number and the sign sit in neighbouring
 * elements), and the "forward" arrows of text the code writes without Hebrew ("BUNDLE SALE ←"
 * becomes "BUNDLE SALE →"). A translation writes its own arrows; ↗ is also a decorative icon
 * on Hebrew pages, so only ← and ↖ turn.
 */
const SHEKEL_AFTER=/^(\s*)(\d[\d,.]*)\s*₪(\s*)$/;
const NUMBER=/^\s*\d[\d,.]*\s*$/;
const forward=(text:string)=>hasHebrew(text)||!/[←↖]/.test(text)?text:text.replace(/←/g,'→').replace(/↖/g,'↗');
function forwardArrows(children:unknown):unknown{
 if(typeof children==='string')return forward(children);
 if(!Array.isArray(children)||!children.some(item=>typeof item==='string'&&/[←↖]/.test(item)))return children;
 // Neighbouring strings are one sentence ("לעמוד ", name, " ←"): a run with Hebrew in it is left for the translation.
 const out=children.slice();
 for(let start=0;start<out.length;start++){
  if(typeof out[start]!=='string'&&typeof out[start]!=='number')continue;
  let end=start;
  while(end+1<out.length&&(typeof out[end+1]==='string'||typeof out[end+1]==='number'))end++;
  if(!hasHebrew(out.slice(start,end+1).join('')))for(let index=start;index<=end;index++)if(typeof out[index]==='string')out[index]=forward(out[index] as string);
  start=end;
 }
 return out.some((item,index)=>item!==children[index])?out:children;
}
/** An English reader reads 1.11.2026 as January 11: a <time> with a machine value is written out ("November 1, 2026", "1 ноября 2026 г."). */
const DATE_LOCALE:Partial<Record<Language,string>>={en:'en-US',ru:'ru-RU'};
/** English writes the sign first (₪440); Russian keeps it after the number (440 ₪), as Hebrew does. */
const SHEKEL_FIRST:ReadonlySet<Language>=new Set<Language>(['en']);
function writtenDate(type:unknown,props:Props,language:Language):string|null{
 const locale=DATE_LOCALE[language];
 if(type!=='time'||!locale||typeof props.dateTime!=='string')return null;
 const date=new Date(props.dateTime);
 return Number.isNaN(date.getTime())?null:new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jerusalem'}).format(date);
}
const numeric=(value:unknown)=>typeof value==='number'||typeof value==='string'&&NUMBER.test(value);
function readingOrder(children:unknown,create:Create):unknown{
 if(typeof children==='string')return children.replace(SHEKEL_AFTER,'$1₪$2$3');
 if(!Array.isArray(children))return children;
 let list=children;
 const put=(index:number,value:unknown)=>{if(list===children)list=children.slice();list[index]=value;};
 const previous=(index:number)=>{for(let at=index-1;at>=0;at--)if(list[at]!==null&&list[at]!==undefined&&list[at]!==false&&list[at]!=='')return at;return -1;};
 for(let start=0;start<list.length;start++){
  const item=list[start];
  if(typeof item==='string'||typeof item==='number'){
   // A run of text and numbers that is a price: "440", " ₪".
   let end=start;
   while(end+1<list.length&&(typeof list[end+1]==='string'||typeof list[end+1]==='number'))end++;
   const joined=list.slice(start,end+1).join('');
   const ordered=joined.replace(SHEKEL_AFTER,'$1₪$2$3');
   if(ordered!==joined){put(start,ordered);for(let index=start+1;index<=end;index++)put(index,null);}
   start=end;continue;
  }
  if(!isElement(item)||typeof item.props.children!=='string')continue;
  const text=item.props.children,before=previous(start),prior=before<0?undefined:list[before];
  // "440" then <small> ₪</small>: the sign goes first.
  if(/^\s*₪\s*$/.test(text)&&numeric(prior)){put(before,create(item.type,{...item.props,children:'₪'},item.key??undefined));put(start,String(prior).trim());continue;}
  // <b>105</b> then <span>₪ per shirt</span>: the sign moves to the number.
  if(/^\s*₪/.test(text)&&isElement(prior)&&numeric(prior.props.children)){
   put(before,create(prior.type,{...prior.props,children:'₪'+String(prior.props.children).trim()},prior.key??undefined));
   put(start,create(item.type,{...item.props,children:text.replace(/^\s*₪\s*/,'')},item.key??undefined));
  }
 }
 return list;
}

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
   return node.children===null?element:create(element.type,{...element.props,children:writtenDate(element.type,element.props,language)??build(node.children)},element.key??undefined);
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
    // A sentence built around a value the site cannot know (a customer's name) has no
    // translation as a whole; its own words are translated and the value stays as it is.
    else if(end>start)for(let index=start;index<=end;index++){
     const piece=list[index];
     if(typeof piece==='string'&&hasHebrew(piece)){const single=text(piece,language);if(single!==piece)put(index,single);}
    }
   }
   start=end;
  }
  return out;
 }

 /** A WhatsApp link carries a ready message; the reader should be able to read what they send. */
 function message(href:string,language:Language):string{
  const found=/^(https:\/\/wa\.me\/\d+\?text=)([^&#]+)(.*)$/.exec(href);
  if(!found)return href;
  try{
   const hebrewText=decodeURIComponent(found[2]);
   // Each line on its own, so that a value on a line of its own (a request number) stays out of the sentence.
   const translated=hebrewText.split('\n').map(line=>text(line,language)).join('\n');
   return translated===hebrewText?href:found[1]+encodeURIComponent(translated)+found[3];
  }catch{return href;}
 }

 function structuredData(props:Props,language:Language):Props{
  const html=(props.dangerouslySetInnerHTML as {__html?:unknown}|undefined)?.__html;
  if(props.type!=='application/ld+json'||typeof html!=='string')return props;
  try{
   const translated=JSON.stringify(translateDeep(JSON.parse(html),language,environment,address=>localizedAddress(language,address))).replace(/</g,'\\u003c');
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
  const date=writtenDate(type,props,language);
  if(date){set('children',date);return out;}
  // An element or a component (a radio group, say) that states the direction of the Hebrew page follows the language of the reader.
  else if(props.dir==='rtl'&&DIRECTION[language]==='ltr')set('dir','ltr');
  let inner=props.children;
  if(DIRECTION[language]==='ltr'){const turned=forwardArrows(inner);if(turned!==inner){set('children',turned);inner=turned;}}
  if(typeof inner==='string'){const translated=text(inner,language);if(translated!==inner)set('children',translated);}
  else if(Array.isArray(inner)){const translated=whole(inner,language,create)??pieces(inner,language);if(translated!==inner)set('children',translated);}
  if(SHEKEL_FIRST.has(language)){const ordered=readingOrder(out.children,create);if(ordered!==out.children)set('children',ordered);}
  const host=typeof type==='string';
  for(const name of host?[...SPOKEN,...ELEMENT_ONLY]:SPOKEN){
   const value=props[name];
   if(typeof value==='string'){const translated=text(value,language);if(translated!==value)set(name,translated);}
  }
  if(typeof props.href==='string'){
   // A link that names the language of its target (hrefLang) is left where it points.
   const elsewhere=typeof props.hrefLang==='string'&&props.hrefLang!==language;
   const href=elsewhere?props.href:message(localizedHref(language,props.href),language);
   if(href!==props.href)set('href',href);
  }
  if(type==='body'){
   const scripts=environment.scripts(language).map((script,index)=>create('script',script.src?(script.async?{src:script.src,async:true}:{src:script.src}):{dangerouslySetInnerHTML:{__html:script.code}},'partyprint-i18n-'+index));
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
