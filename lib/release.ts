export type BuildIdentity={
 schemaVersion:1;
 target:'node'|'cloudflare'|'unknown';
 mode:'production'|'development'|'unknown';
 builtAt:string|null;
 sourceState:'clean'|'modified'|'unavailable';
 sourceCommit:string|null;
 sourceFingerprint:string|null;
};
declare const __PARTYPRINT_RELEASE__:BuildIdentity;

// Vite replaces this constant during compilation. Runtime environment values
// cannot relabel an older artifact as a new commit.
export function buildIdentity():BuildIdentity{
 return typeof __PARTYPRINT_RELEASE__!=='undefined'?__PARTYPRINT_RELEASE__:{
  schemaVersion:1,target:'unknown',mode:'unknown',builtAt:null,
  sourceState:'unavailable',sourceCommit:null,sourceFingerprint:null,
 };
}
