import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire((process.env.PARTYPRINT_ASSET_TOOL_ROOT||'/tmp/partyprint-assets')+'/package.json');const sharp=require('sharp');
mkdirSync('app/assets/static',{recursive:true});
const manifest={schemaVersion:1,images:{},wow:{},logos:{}};const report={sharp:sharp.versions,images:[],wow:[],logos:[]};
const sha=data=>createHash('sha256').update(data).digest('hex').slice(0,16);
function save(data,stem,format){const path='app/assets/static/'+stem+'.'+sha(data)+'.'+format;writeFileSync(path,data);return path}
for(const name of ['party-crew','family-shared-v2','bride-shared-v2','groom-shared-v2','tech-team','family-heroes','bride-city','groom-crew']){
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
const fontReport=JSON.parse(readFileSync('docs/performance/font-subsets.json','utf8'));
const paths=new Set(fontReport.faces.map(face=>face.source));
for(const item of Object.values(manifest.images))for(const format of ['avif','webp'])for(const value of item[format])paths.add(value.src);
for(const path of Object.values(manifest.logos))paths.add(path);
const imports=[],variables=new Map(),files=[];
let index=0;
for(const source of [...paths].sort()){
 const data=readFileSync(source),hash=sha(data);if(!source.includes('.'+hash+'.'))throw Error('Asset name hash mismatch');
 files.push({source,bytes:data.length,sha256Prefix:hash});
 if(!source.endsWith('.woff2')){const name='asset'+index++;imports.push('import '+name+' from '+JSON.stringify('../'+source+'?url&no-inline')+';');variables.set(source,name)}
}
let module=JSON.stringify(manifest,null,2);
for(const [source,name] of variables)module=module.replaceAll(JSON.stringify(source),name);
writeFileSync('lib/landing-media.ts',imports.join('\n')+'\nconst media='+module+';\nexport default media;\n');
writeFileSync('lib/landing-media-manifest.json',JSON.stringify({schemaVersion:1,files,fonts:fontReport.faces,coverage:fontReport.coverage},null,2)+'\n');
const faceCss=fontReport.faces.map(face=>"@font-face {\n  font-family: '"+face.family+"';\n  font-style: normal;\n  font-weight: "+face.weight+";\n  font-display: swap;\n  src: url(./assets/static/"+face.source.split('/').at(-1)+"?no-inline) format('woff2');\n  unicode-range: "+face.unicodeRange+";\n}").join('\n')+'\n';
writeFileSync('app/fonts.css',faceCss);
let layout=readFileSync('app/layout.tsx','utf8');
for(const [variable,family,weight] of [['rubikHeroFont','Rubik',900],['assistantTextFont','Assistant',400]]){
 const face=fontReport.faces.find(face=>face.family===family&&face.weight===weight&&face.subset==='hebrew');
 layout=layout.replace(new RegExp('import '+variable+' from [^;\\n]+;'),'import '+variable+' from '+JSON.stringify('./assets/static/'+face.source.split('/').at(-1)+'?url&no-inline')+';');
}
writeFileSync('app/layout.tsx',layout);
for(const [path,prefix] of [['app/globals.css','./'],['app/seo/seo.css','../']]){
 let css=readFileSync(path,'utf8');
 for(const [key,name] of [['header','logo-header'],['footer','logo']]){
  const pattern=new RegExp("url\\(['\"](?:\\.\\.?/)?assets/static/"+name+"\\.[^)'\" ]+['\"]\\)",'g');
  css=css.replace(pattern,"url('"+prefix+"assets/static/"+manifest.logos[key].split('/').at(-1)+"?no-inline')");
 }
 writeFileSync(path,css);
}
writeFileSync('docs/performance/optimized-media-report.json',JSON.stringify(report,null,2)+'\n');
console.log('MEDIA_REPORT '+JSON.stringify(report));
