/* The JSX runtime the site's own code is built against: React's, behind the translation gate. */
import * as real from 'react/jsx-runtime';
import {createGate} from './gate';
import {clientEnvironment} from './env.client';

type Run=(type:unknown,props:Record<string,unknown>,key?:unknown)=>unknown;
const react=real as unknown as {Fragment:unknown;jsx:Run;jsxs:Run};
const gate=createGate(clientEnvironment);
export const Fragment=react.Fragment;
export const jsx:Run=(type,props,key)=>react.jsx(type,gate(type,props,react.jsx) as Record<string,unknown>,key);
export const jsxs:Run=(type,props,key)=>react.jsxs(type,gate(type,props,react.jsx) as Record<string,unknown>,key);
