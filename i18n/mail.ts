import {LANGUAGES} from './core';
import type {Language} from './core';
import {serverEnvironment} from './env-server';
import {translateHtml,translateLine,translateLines} from './html';

/** A message to a customer, in the language they ordered in. `values` are the parts only this order has. */
export function translateMail<T extends {subject:string;html:string;text:string}>(mail:T,language:string|undefined,values:string[]):T{
 if(!language||language==='he'||!(LANGUAGES as readonly string[]).includes(language))return mail;
 const to=language as Language;
 return {...mail,subject:translateLine(mail.subject,to,serverEnvironment,values),html:translateHtml(mail.html,to,serverEnvironment,values),text:translateLines(mail.text,to,serverEnvironment,values)};
}
