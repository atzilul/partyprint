import {fileURLToPath} from 'node:url';
import type {Plugin} from 'vite';

/**
 * Builds the site's own code against the translation gate (i18n/gate.ts) instead of
 * React's JSX runtime directly. Libraries keep React's runtime; they hold no site text.
 */
const slashes=(path:string)=>path.split('\\').join('/');
const root=slashes(fileURLToPath(new URL('../',import.meta.url))).toLowerCase();
const RUNTIMES:Record<string,string>={'react/jsx-runtime':'jsx-runtime','react/jsx-dev-runtime':'jsx-dev-runtime'};
export function i18nGate():Plugin{
 return {
  name:'partyprint-i18n-gate',
  enforce:'pre',
  resolveId(source,importer){
   const runtime=RUNTIMES[source];
   if(!runtime||!importer)return null;
   const from=slashes(importer).split('?')[0].toLowerCase();
   if(!from.startsWith(root)||from.includes('/node_modules/'))return null;
   if(!/^(app|components|lib)\//.test(from.slice(root.length)))return null;
   const side=this.environment?.name==='client'?'client':'server';
   return root+'i18n/'+runtime+'.'+side+'.ts';
  },
 };
}
