'use client';
import {useSyncExternalStore} from 'react';
import {Clock} from 'lucide-react';
import {RESPONSE_PROMISE_STATIC,responsePromiseText} from '@/lib/response-promise';

// Re-evaluates once a minute so a visitor who lingers past closing time sees the right promise.
function subscribe(onChange:()=>void){const timer=window.setInterval(onChange,60000);return()=>window.clearInterval(timer);}
function current(){return responsePromiseText();}
function onServer(){return RESPONSE_PROMISE_STATIC;}

/** Renders the static promise on the server, then the time-aware version in the browser. */
export default function ResponsePromise({className=''}:{className?:string}){
 const text=useSyncExternalStore(subscribe,current,onServer);
 return <p className={'pp-response-promise '+className} role="note"><Clock size={15} aria-hidden="true"/><span>{text}</span></p>;
}
