/* Development build of the same runtime. */
import * as real from 'react/jsx-dev-runtime';
import {createGate} from './gate';
import {clientEnvironment} from './env.client';

type Dev=(type:unknown,props:Record<string,unknown>,key?:unknown,...rest:unknown[])=>unknown;
const react=real as unknown as {Fragment:unknown;jsxDEV:Dev};
const gate=createGate(clientEnvironment);
export const Fragment=react.Fragment;
export const jsxDEV:Dev=(type,props,key,...rest)=>react.jsxDEV(type,gate(type,props,(t,p,k)=>react.jsxDEV(t,p,k,false)) as Record<string,unknown>,key,...rest);
