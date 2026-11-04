// Recompress existing artwork only. Originals are retained; no external image generation.
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,statSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire('/tmp/partyprint-assets/package.json');
const sharp=require('sharp');
const names=['party-crew','family-shared-v2','bride-shared-v2','groom-shared-v2','tech-team','family-heroes','bride-city','groom-crew'];
const widths=[640,960,1254];
mkdirSync('public/landing',{recursive:true});
const report={tool:sharp.versions,webpQuality:78,avifQuality:50,widths,images:[],logos:[]};
for(const name of names){
 const input='public/'+name+'.webp',data=readFileSync(input),meta=await sharp(data).metadata();
 for(const width of [1280,1536])rmSync('public/landing/'+name+'-'+width+'.webp',{force:true});
 for(const width of widths){
  const path='public/landing/'+name+'-'+width+'.webp';
  await sharp(data).rotate().resize({width,withoutEnlargement:true}).webp({quality:78,effort:6}).toFile(path);
  const result=await sharp(path).metadata();
  if(result.width!==Math.min(width,meta.width)||Math.abs(result.width/result.height-meta.width/meta.height)>.005)throw Error('Artwork dimensions changed');
  const avif=path.replace('.webp','.avif');
  await sharp(data).rotate().resize({width,withoutEnlargement:true}).avif({quality:50,effort:6}).toFile(avif);
  report.images.push({avif,avifBytes:statSync(avif).size,source:input,sourceBytes:data.length,sourceSha256:createHash('sha256').update(data).digest('hex'),path,bytes:statSync(path).size,width:result.width,height:result.height});
 }
}
for(const [input,name] of [['public/partyprint-logo-header.png','logo-header'],['public/partyprint-logo.png','logo']]){
 const path='public/landing/'+name+'.webp';await sharp(input).resize({width:600,withoutEnlargement:true}).webp({lossless:true,effort:6}).toFile(path);const meta=await sharp(path).metadata();report.logos.push({source:input,path,bytes:statSync(path).size,width:meta.width,height:meta.height});
}
writeFileSync('public/landing/asset-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
