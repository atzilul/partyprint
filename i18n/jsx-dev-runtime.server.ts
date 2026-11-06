/* Development build of the same runtime. */
import * as real from 'react/jsx-dev-runtime';
import {createGate} from './gate';
import {serverEnvironment} from './env.server';

type Props=Record<string,unknown>;
type Dev=(type:unknown,props:Props,key?:unknown,...rest:unknown[])=>unknown;
const react=real as unknown as {Fragment:unknown;jsxDEV:Dev};
const wrap=createGate(serverEnvironment);
export const Fragment=react.Fragment;
export const jsxDEV=wrap(react.jsxDEV,(type,props,key)=>react.jsxDEV(type,props,key,Array.isArray(props.children)));
