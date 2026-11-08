/**
 * Translation gate (experiment). The site is written in Hebrew and stays that way. Every
 * string on its way to the screen passes through one function; on a translated address
 * (/ar/...) the function swaps the Hebrew sentence for its translation. Nothing in the
 * pages or components knows about languages.
 *
 * A sentence is looked up by its Hebrew text with the numbers masked ("מ־{0} ₪ לחולצה"),
 * so one translation serves every price and quantity, and a changed Hebrew sentence is a
 * new key: its old translation simply no longer matches, and the sentence is reported as
 * missing instead of going stale silently.
 */
export const LANGUAGES=['ar','en','ru','fr'] as const;
export type Language=(typeof LANGUAGES)[number]|'he';
export type Dictionary=Record<string,string>;
export const DIRECTION:Record<Language,'rtl'|'ltr'>={he:'rtl',ar:'rtl',en:'ltr',ru:'ltr',fr:'ltr'};

const HEBREW=/[֐-׿]/;
export const hasHebrew=(text:string)=>HEBREW.test(text);

/**
 * The languages the site is translated into today. An address that starts with one of them
 * (/ar/..., /en/...) is a translated page; every other address is Hebrew.
 */
export const TRANSLATED:readonly Language[]=['ar','en'];
/** The language of an address: /ar/lp/team is Arabic, everything without a translated prefix is Hebrew. */
export function languageOfPath(pathname:string|null|undefined):Language{
 if(!pathname)return 'he';
 const first=pathname.split('/')[1];
 return (TRANSLATED as readonly string[]).includes(first)?first as Language:'he';
}

/** "מ־80 ₪ לחולצה" becomes the key "מ־{0} ₪ לחולצה" and the numbers ["80"]. */
export function maskNumbers(text:string):{key:string;numbers:string[]}{
 const numbers:string[]=[];
 // The numbered places of elements (<0>, </0>, <0/>) and of private values ({v0}) are not numbers of the sentence.
 const key=text.replace(/<\/?\d+\/?>|\{v\d+\}|\d+(?:[.,]\d+)*/g,found=>{if(found[0]==='<'||found[0]==='{')return found;numbers.push(found);return '{'+(numbers.length-1)+'}';});
 return {key,numbers};
}

/** A short, stable name for a sentence. The browser's dictionary is keyed by it, to stay small. */
export function hashKey(text:string):string{
 let high=0xdeadbeef,low=0x41c6ce57;
 for(let index=0;index<text.length;index++){
  const code=text.charCodeAt(index);
  high=Math.imul(high^code,2654435761);low=Math.imul(low^code,1597334677);
 }
 high=Math.imul(high^(high>>>16),2246822507)^Math.imul(low^(low>>>13),3266489909);
 low=Math.imul(low^(low>>>16),2246822507)^Math.imul(high^(high>>>13),3266489909);
 return (4294967296*(2097151&low)+(high>>>0)).toString(36);
}

/**
 * A noun counted by a number changes with the number in some languages: Arabic says
 * "4 تيشيرتات" and "20 تيشيرت". A translation writes such a pair as {0:tshirt}, and the
 * language's noun table gives the form for each plural category ({n} is the number).
 * {0#tshirt} gives the noun alone, in the form that number calls for, when the page shows
 * the number somewhere else.
 */
export type Nouns=Record<string,Partial<Record<Intl.LDMLPluralRule,string>>>;
const rules=new Map<string,Intl.PluralRules>();
function counted(language:Language,noun:Nouns[string],number:string,alone:boolean):string{
 let rule=rules.get(language);if(!rule){rule=new Intl.PluralRules(language);rules.set(language,rule);}
 const form=noun[rule.select(Number(number.replace(/,/g,'')))]??noun.other??'{n}';
 return alone?form.replace('{n}','').trim():form.replace('{n}',number);
}
export function fillNumbers(text:string,numbers:string[],language:Language='he',nouns:Nouns={}):string{
 return text.replace(/\{(\d+)(?:([:#])([a-z]+))?\}/g,(whole,index,mark,name)=>{
  const number=numbers[Number(index)];
  if(number===undefined)return whole;
  return name&&nouns[name]?counted(language,nouns[name],number,mark==='#'):number;
 });
}

export type GateEnvironment={
 language:()=>Language;
 /** The translation of a masked Hebrew sentence, if there is one. */
 lookup:(language:Language,key:string)=>string|undefined;
 nouns:(language:Language)=>Nouns|undefined;
 missing:(language:Language,key:string)=>void;
 /** Scripts the browser needs before it takes over the page: the dictionary, and the collect flag. */
 scripts:(language:Language)=>{src?:string;code?:string;async?:boolean}[];
};
export type Lookup=Pick<GateEnvironment,'lookup'|'missing'|'nouns'>;

/**
 * The translation of one sentence with its numbers still masked, or null when there is none
 * (the sentence is then reported). Leading and trailing spaces are not part of the sentence.
 */
export function findTranslation(text:string,language:Language,environment:Lookup):{before:string;after:string;translated:string;numbers:string[]}|null{
 const parts=/^(\s*)([\s\S]*?)(\s*)$/.exec(text);
 if(!parts||!parts[2])return null;
 const {key,numbers}=maskNumbers(parts[2]);
 const found=environment.lookup(language,key);
 if(found===undefined){environment.missing(language,key);return null;}
 return {before:parts[1],after:parts[3],translated:found,numbers};
}

/** One sentence. Text without Hebrew is returned as it is; an unknown sentence stays Hebrew and is reported. */
/** A page address or a link (no spaces, starts with / or http). It is led to its language by i18n/routes.ts, never by the dictionary. */
export const isAddress=(text:string)=>/^(?:https?:\/\/|\/)\S*$/.test(text);
export function translateText(text:string,language:Language,environment:Lookup):string{
 if(language==='he'||!hasHebrew(text)||isAddress(text))return text;
 const found=findTranslation(text,language,environment);
 return found?found.before+fillNumbers(found.translated,found.numbers,language,environment.nouns(language))+found.after:text;
}

/** Every string inside a value (metadata, structured data). An address goes through `address` when one is given, and is otherwise left as it is. */
export function translateDeep<T>(value:T,language:Language,environment:Lookup,address?:(value:string)=>string):T{
 const walk=(item:unknown):unknown=>{
  if(typeof item==='string')return address&&isAddress(item)?address(item):translateText(item,language,environment);
  if(Array.isArray(item))return item.map(walk);
  if(item&&typeof item==='object'&&Object.getPrototypeOf(item)===Object.prototype)return Object.fromEntries(Object.entries(item).map(([name,entry])=>[name,walk(entry)]));
  return item;
 };
 return walk(value) as T;
}

/**
 * A sentence that the page writes around small elements ("עוד 3 חולצות ויורדים ל־<b>93 ₪</b>")
 * is one message with numbered places for the elements: "עוד {0} חולצות ויורדים ל־<0>{1} ₪</0>".
 * A translation may move the places to where its grammar needs them.
 */
export type RichPart=string|{slot:number;children:RichPart[]|null};
export function parseRich(text:string):RichPart[]|null{
 const root:RichPart[]=[],stack:{slot:number;children:RichPart[]}[]=[];
 const tag=/<(\d+)\/>|<(\d+)>|<\/(\d+)>/g;
 let last=0;
 const here=()=>stack.length?stack[stack.length-1].children:root;
 for(let match;(match=tag.exec(text));){
  if(match.index>last)here().push(text.slice(last,match.index));
  last=tag.lastIndex;
  if(match[1]!==undefined)here().push({slot:Number(match[1]),children:null});
  else if(match[2]!==undefined){const node={slot:Number(match[2]),children:[] as RichPart[]};here().push(node);stack.push(node);}
  else{const open=stack.pop();if(!open||open.slot!==Number(match[3]))return null;}
 }
 if(stack.length)return null;
 if(last<text.length)root.push(text.slice(last));
 return root;
}
