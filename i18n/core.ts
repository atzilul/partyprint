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

/** The language of an address: /ar/lp/team is Arabic, everything without a prefix is Hebrew. */
export function languageOfPath(pathname:string|null|undefined):Language{
 if(!pathname)return 'he';
 const first=pathname.split('/')[1];
 return (LANGUAGES as readonly string[]).includes(first)?first as Language:'he';
}

/** "מ־80 ₪ לחולצה" becomes the key "מ־{0} ₪ לחולצה" and the numbers ["80"]. */
export function maskNumbers(text:string):{key:string;numbers:string[]}{
 const numbers:string[]=[];
 const key=text.replace(/\d+(?:[.,]\d+)*/g,found=>{numbers.push(found);return '{'+(numbers.length-1)+'}';});
 return {key,numbers};
}
/**
 * A noun counted by a number changes with the number in some languages: Arabic says
 * "4 تيشيرتات" and "20 تيشيرت". A translation writes such a pair as {0:tshirt}, and the
 * language's noun table gives the form for each plural category ({n} is the number).
 */
export type Nouns=Record<string,Partial<Record<Intl.LDMLPluralRule,string>>>;
const rules=new Map<string,Intl.PluralRules>();
function counted(language:Language,noun:Nouns[string],number:string):string{
 let rule=rules.get(language);if(!rule){rule=new Intl.PluralRules(language);rules.set(language,rule);}
 const form=noun[rule.select(Number(number.replace(/,/g,'')))]??noun.other??'{n}';
 return form.replace('{n}',number);
}
export function fillNumbers(text:string,numbers:string[],language:Language='he',nouns:Nouns={}):string{
 return text.replace(/\{(\d+)(?::([a-z]+))?\}/g,(whole,index,name)=>{
  const number=numbers[Number(index)];
  if(number===undefined)return whole;
  return name&&nouns[name]?counted(language,nouns[name],number):number;
 });
}

export type GateEnvironment={
 language:()=>Language;
 dictionary:(language:Language)=>Dictionary|undefined;
 nouns:(language:Language)=>Nouns|undefined;
 missing:(language:Language,key:string)=>void;
 /** Address of the dictionary the browser loads, or null where the browser needs none. */
 dictionaryScript:(language:Language)=>string|null;
};

/** One sentence. Text without Hebrew is returned as it is; an unknown sentence stays Hebrew and is reported. */
type Lookup=Pick<GateEnvironment,'dictionary'|'missing'|'nouns'>;
export function translateText(text:string,language:Language,environment:Lookup):string{
 if(language==='he'||!hasHebrew(text))return text;
 const parts=/^(\s*)([\s\S]*?)(\s*)$/.exec(text);
 if(!parts||!parts[2])return text;
 const {key,numbers}=maskNumbers(parts[2]);
 const found=environment.dictionary(language)?.[key];
 if(found===undefined){environment.missing(language,key);return text;}
 return parts[1]+fillNumbers(found,numbers,language,environment.nouns(language))+parts[3];
}

/** Every string inside a value (metadata, structured data). Addresses and other non-Hebrew strings pass through. */
export function translateDeep<T>(value:T,language:Language,environment:Lookup):T{
 const walk=(item:unknown):unknown=>{
  if(typeof item==='string')return translateText(item,language,environment);
  if(Array.isArray(item))return item.map(walk);
  if(item&&typeof item==='object'&&Object.getPrototypeOf(item)===Object.prototype)return Object.fromEntries(Object.entries(item).map(([name,entry])=>[name,walk(entry)]));
  return item;
 };
 return walk(value) as T;
}
