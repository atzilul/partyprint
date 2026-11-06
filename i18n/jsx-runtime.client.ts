/* The JSX runtime the site's own code is built against: React's, behind the translation gate. */
import * as real from 'react/jsx-runtime';
import {createGate} from './gate';
import {clientEnvironment} from './env.client';

type Props=Record<string,unknown>;
type Run=(type:unknown,props:Props,key?:unknown)=>unknown;
const react=real as unknown as {Fragment:unknown;jsx:Run;jsxs:Run};
const wrap=createGate(clientEnvironment);
export const Fragment=react.Fragment;
export const jsx=wrap(react.jsx,react.jsx);
export const jsxs=wrap(react.jsxs,react.jsxs);
