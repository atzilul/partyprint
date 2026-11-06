import {translateDeep} from './core';
import type {Language} from './core';
import {serverEnvironment} from './env.server';

/** For text that never becomes an element: page titles, descriptions and social cards. */
export function translateMetadata<T>(value:T,language:Language):T{return translateDeep(value,language,serverEnvironment);}
export {missingSentences} from './env.server';
