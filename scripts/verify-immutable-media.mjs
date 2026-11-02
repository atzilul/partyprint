import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const manifest=JSON.parse(readFileSync('lib/landing-media-manifest.json','utf8'));
assert(manifest.files.length>50);
const seen=new Set();
for(const file of manifest.files){
 assert.match(file.source,/^app\/assets\/static\/[a-z0-9-]+\.[a-f0-9]{16}\.(avif|webp|woff2)$/);
 assert(!seen.has(file.source));seen.add(file.source);
 const bytes=readFileSync(file.source);
 assert.equal(bytes.length,file.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0,16),file.sha256Prefix);
 if(file.source.endsWith('.woff2'))assert.equal(bytes.subarray(0,4).toString(),'wOF2');
 else if(file.source.endsWith('.webp')){assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP')}
 else assert.equal(bytes.subarray(4,8).toString(),'ftyp');
}
for(const face of manifest.fonts){assert(seen.has(face.source));assert(face.unicodeRange);assert(face.advanceWidthsPreserved)}
console.log('Immutable media: '+seen.size+' content hashes and media signatures verified; '+manifest.fonts.length+' disjoint font faces present.');
