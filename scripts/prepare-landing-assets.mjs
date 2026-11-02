// Recompress existing artwork only. Originals are retained; no external image generation.
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire('/tmp/partyprint-assets/package.json');
const sharp=require('sharp');
const names=['party-crew','family-shared-v2','bride-shared-v2','groom-shared-v2','tech-team'];
const widths=[640,960,1280,1536];
mkdirSync('public/landing',{recursive:true});
const report={tool:sharp.versions,quality:78,widths,images:[]};
for(const name of names){
 const input='public/'+name+'.webp',data=readFileSync(input),meta=await sharp(data).metadata();
 for(const width of widths){
  const path='public/landing/'+name+'-'+width+'.webp';
  await sharp(data).rotate().resize({width,withoutEnlargement:true}).webp({quality:78,effort:6}).toFile(path);
  const result=await sharp(path).metadata();
  if(result.width!==Math.min(width,meta.width)||Math.abs(result.width/result.height-meta.width/meta.height)>.005)throw Error('Artwork dimensions changed');
  report.images.push({source:input,sourceBytes:data.length,sourceSha256:createHash('sha256').update(data).digest('hex'),path,bytes:statSync(path).size,width:result.width,height:result.height});
 }
}
writeFileSync('public/landing/asset-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
