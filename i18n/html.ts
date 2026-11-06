import {DIRECTION,fillNumbers,findTranslation,hasHebrew,parseRich} from './core';
import type {Language,Lookup,RichPart} from './core';

/**
 * The gate for text that is built as a string and never becomes an element: emails.
 * It works on the finished HTML the same way the gate works on elements: a sentence is the
 * text between two block tags, small tags inside it (a span, a link, bold) are numbered
 * places, numbers are masked, and so are the values the site cannot know (a customer's
 * name, an order reference, a private link), which are passed in.
 */
const INLINE=new Set(['span','b','strong','a','em','i','u','bdi','small','br','font','sup','sub']);
const tagName=(tag:string)=>/^<\/?\s*([a-zA-Z0-9]+)/.exec(tag)?.[1].toLowerCase()||'';
/** The email is written for a right-to-left reader; for a left-to-right language its direction and alignment are mirrored. */
function mirror(tag:string,language:Language):string{
 if(DIRECTION[language]!=='ltr'||tag[1]==='/')return tag;
 return tag.replace(/\sdir="rtl"/g,' dir="ltr"').replace(/\salign="right"/g,' align="left"').replace(/text-align:(\s*)right/g,'text-align:$1left');
}
const escapeHtml=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/**
 * "היי דנה," becomes "היי {v1}," for the values given. A value's number is its position in
 * the list the caller passes, so the same sentence always gets the same key, whoever the
 * customer is. Longer values are replaced first, so one value inside another is safe.
 */
function maskValues(text:string,values:string[]):{text:string;found:string[]}{
 const found:string[]=[];
 let out=text;
 const order=values.map((value,index)=>({value,index})).filter(entry=>entry.value&&values.indexOf(entry.value)===entry.index).sort((a,b)=>b.value.length-a.value.length);
 for(const {value,index} of order){
  for(const form of new Set([value,escapeHtml(value)])){
   if(!out.includes(form))continue;
   found[index]=form;
   out=out.split(form).join('{v'+index+'}');
  }
 }
 return {text:out,found};
}
const fillValues=(text:string,found:string[])=>text.replace(/\{v(\d+)\}/g,(whole,index)=>found[Number(index)]??whole);

/** One piece of plain text: a subject line, a line of the text version of an email. */
export function translateLine(line:string,language:Language,environment:Lookup,values:string[]=[]):string{
 if(language==='he'||!hasHebrew(line))return line;
 const masked=maskValues(line,values);
 const found=findTranslation(masked.text,language,environment);
 return found?found.before+fillValues(fillNumbers(found.translated,found.numbers,language,environment.nouns(language)),masked.found)+found.after:line;
}
export const translateLines=(text:string,language:Language,environment:Lookup,values:string[]=[])=>text.split('\n').map(line=>translateLine(line,language,environment,values)).join('\n');

/** A whole HTML document or fragment. */
export function translateHtml(html:string,language:Language,environment:Lookup,values:string[]=[]):string{
 if(language==='he')return html;
 const tokens=html.split(/(<[^>]+>)/);
 const out:string[]=[];
 let run:string[]=[];
 const flush=()=>{
  if(!run.length)return;
  const pieces=run;run=[];
  if(!pieces.some(piece=>piece[0]!=='<'&&hasHebrew(piece))){out.push(...pieces);return;}
  // The sentence with a numbered place for each small tag.
  const tags:{open:string;close:string}[]=[],stack:number[]=[];
  let source='',balanced=true;
  for(const piece of pieces){
   if(piece[0]!=='<'){source+=piece;continue;}
   const name=tagName(piece);
   if(name==='br'||piece.endsWith('/>')){source+='<'+(tags.push({open:piece,close:''})-1)+'/>';}
   else if(piece[1]==='/'){const index=stack.pop();if(index===undefined){balanced=false;break;}tags[index].close=piece;source+='</'+index+'>';}
   else{const index=tags.push({open:piece,close:''})-1;stack.push(index);source+='<'+index+'>';}
  }
  if(balanced&&!stack.length){
   const masked=maskValues(source,values);
   const found=findTranslation(masked.text,language,environment);
   const parts=found&&parseRich(found.translated);
   if(found&&parts){
    const nouns=environment.nouns(language);
    const build=(nodes:RichPart[]):string=>nodes.map(node=>typeof node==='string'?fillValues(fillNumbers(node,found.numbers,language,nouns),masked.found):!tags[node.slot]?'':node.children===null?tags[node.slot].open:tags[node.slot].open+build(node.children)+tags[node.slot].close).join('');
    out.push(found.before+build(parts)+found.after);
    return;
   }
  }
  // No translation for the sentence as a whole: translate the pieces that have one.
  for(const piece of pieces)out.push(piece[0]==='<'?piece:translateLine(piece,language,environment,values));
 };
 let skip='';
 for(const token of tokens){
  if(!token)continue;
  if(skip){out.push(token);if(token[0]==='<'&&token[1]==='/'&&tagName(token)===skip)skip='';continue;}
  if(token[0]!=='<'){run.push(token);continue;}
  const name=tagName(token);
  if(INLINE.has(name)){run.push(token);continue;}
  flush();
  if((name==='style'||name==='script')&&token[1]!=='/')skip=name;
  out.push(name==='html'?token.replace(/\slang="[^"]*"/,' lang="'+language+'"'):token.replace(/\s(alt|title)="([^"]*)"/g,(whole,attribute,value)=>hasHebrew(value)?' '+attribute+'="'+translateLine(value,language,environment,values)+'"':whole));
 }
 flush();
 const result=out.join('');
 // Every tag, the small ones inside sentences included (a link styled as a button).
 return DIRECTION[language]==='ltr'?result.replace(/<[^>]+>/g,tag=>mirror(tag,language)):result;
}
