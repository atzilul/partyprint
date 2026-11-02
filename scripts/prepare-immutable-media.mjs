import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire('/tmp/partyprint-assets/package.json');const sharp=require('sharp');
const manifest={schemaVersion:1,images:{},wow:{},logos:{}};const report={sharp:sharp.versions,images:[],wow:[],logos:[]};
const sha=data=>createHash('sha256').update(data).digest('hex').slice(0,16);
function save(data,stem,format){const path='public/landing/'+stem+'.'+sha(data)+'.'+format;writeFileSync(path,data);return '/'+path.slice(7)}
for(const name of ['party-crew','family-shared-v2','bride-shared-v2','groom-shared-v2','tech-team']){
 const source='/'+name+'.webp',meta=await sharp('public'+source).metadata(),item={width:meta.width,height:meta.height,avif:[],webp:[]};
 for(const width of [640,960,1254])for(const format of ['avif','webp']){const data=readFileSync('public/landing/'+name+'-'+width+'.'+format);item[format].push({src:save(data,name+'-'+width,format),width,bytes:data.length})}
 manifest.images[source]=item;
}
for(const name of ['shirts','review-shirts-v1','statement-family-fixed']){
 const input=readFileSync('public/'+name+'.webp'),meta=await sharp(input).metadata(),item={width:meta.width,height:meta.height,avif:[],webp:[]};
 for(const width of [...new Set([480,768,1080].map(w=>Math.min(w,meta.width)))])for(const format of ['avif','webp']){
  let processor=sharp(input).rotate().resize({width,withoutEnlargement:true});
  const data=await (format==='avif'?processor.avif({quality:50,effort:6}):processor.webp({quality:78,effort:6})).toBuffer();
  const src=save(data,name+'-'+width,format);item[format].push({src,width,bytes:data.length});
  report.images.push({source:name,sourceBytes:input.length,format,width,bytes:data.length,src});
 }
 manifest.images['/'+name+'.webp']=item;
}
const source=readFileSync('public/transformation.webp'),meta=await sharp(source).metadata();report.triptych={width:meta.width,height:meta.height,bytes:source.length};
if(meta.width%3!==0)throw Error('Wow source is not an exact triptych');
const sliceWidth=meta.width/3;
for(const [index,key] of ['reference','art','shirt'].entries()){
 const item={width:sliceWidth,height:meta.height,avif:[],webp:[]};
 for(const width of [...new Set([256,sliceWidth])])for(const format of ['avif','webp']){
  let processor=sharp(source).extract({left:index*sliceWidth,top:0,width:sliceWidth,height:meta.height}).resize({width,withoutEnlargement:true});
  const data=await(format==='avif'?processor.avif({quality:50,effort:6}):processor.webp({quality:78,effort:6})).toBuffer();
  const src=save(data,'wow-'+key+'-'+width,format);item[format].push({src,width,bytes:data.length});report.wow.push({key,format,width,bytes:data.length,src});
 }
 manifest.images['wow-'+key]=item;manifest.wow[key]='wow-'+key;
}
for(const [key,name] of [['header','logo-header'],['footer','logo']]){const data=readFileSync('public/landing/'+name+'.webp');manifest.logos[key]=save(data,name,'webp');report.logos.push({key,src:manifest.logos[key],bytes:data.length})}
writeFileSync('lib/landing-media.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync('docs/performance/optimized-media-report.json',JSON.stringify(report,null,2)+'\n');
console.log('MEDIA_REPORT '+JSON.stringify(report));
