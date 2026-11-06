/*
 * The site's own code is built against this instead of next/navigation directly. It is the
 * same module, except that the router leads to the reader's language: after a request is
 * sent from /ar/lp/team, router.push('/thanks') goes to /ar/thanks.
 */
import {useMemo} from 'react';
import {useRouter as useFrameworkRouter} from 'next/navigation';
import {languageOfPath} from './core';
import {localizedHref} from './routes';

export * from 'next/navigation';
const here=()=>languageOfPath(typeof window==='undefined'?undefined:window.location.pathname);
export function useRouter(){
 const router=useFrameworkRouter();
 return useMemo(()=>({
  ...router,
  push:(href:string,options?:Parameters<typeof router.push>[1])=>router.push(localizedHref(here(),href),options),
  replace:(href:string,options?:Parameters<typeof router.replace>[1])=>router.replace(localizedHref(here(),href),options),
  prefetch:(href:string,options?:Parameters<typeof router.prefetch>[1])=>router.prefetch(localizedHref(here(),href),options),
 }),[router]);
}
