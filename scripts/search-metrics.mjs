import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function parseCsv(text){
 text=text.replace(/^\uFEFF/,'');
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(value);value='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}
  else value+=c;
 }
 if(quoted)throw Error('Unclosed CSV quote');
 if(value||row.length){row.push(value);if(row.some(Boolean))rows.push(row);}
 const header=rows.shift()?.map(value=>value.trim());
 if(!header||new Set(header).size!==header.length)throw Error('Missing or duplicate CSV headers');
 return rows.map(r=>{if(r.length!==header.length)throw Error('CSV column mismatch');return Object.fromEntries(header.map((k,i)=>[k.trim(),r[i]]));});
}
function numeric(value,name,optional=false){
 if(value===undefined||value===null||String(value).trim()===''){if(optional)return null;throw Error('Missing '+name+'; missing is not zero');}
 const n=Number(value);if(!Number.isFinite(n)||n<0)throw Error('Invalid '+name);
 return n;
}
function date(value){const s=String(value||'').replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s).toISOString().slice(0,10)!==s)throw Error('Expected a complete ISO date');return s;}
function page(value){
 const raw=String(value||'').trim();
 if(!raw)throw Error('Missing page path');
 if(!raw.startsWith('/')&&!/^https?:\/\//i.test(raw))throw Error('Expected a rooted page path or absolute site URL; quarantine unknown landing pages');
 const url=new URL(raw,'https://partyprint.co.il');
 if(url.username||url.password||url.port||!['partyprint.co.il','www.partyprint.co.il'].includes(url.hostname)||!['https:','http:'].includes(url.protocol))throw Error('Export contains another site');
 if(/^\/(?:admin|api|track|design)(?:\/|$)/.test(decodeURIComponent(url.pathname)))return null;
 return url.origin+decodeURIComponent(url.pathname).replace(/\/$/,'');
}
export function analyze(gsc=[],ga4=[]){
 const report={gsc:{rows:0,excludedPrivateRows:0,clicks:0,impressions:0,ctr:null,position:null,positionCoverageImpressions:0,pages:[]},ga4:{rows:0,excludedPrivateRows:0,sessions:0,leadSessions:null,generateLeadEvents:null,leadSessionRate:null,pages:[]},notes:['Aggregate analysis only. Search queries are not joined to individual leads. Missing metrics remain null.']};
 const gsPages=new Map(),gaPages=new Map(),seenGs=new Set(),seenGa=new Set();
 let positionSum=0,positionComplete=true;
 for(const r of gsc){
  const d=date(r.date),p=page(r.page);if(!p){report.gsc.excludedPrivateRows++;continue;}
  const key=[d,r.query||'',p,r.country||'',r.device||''].join('|');
  if(seenGs.has(key))throw Error('Duplicate GSC grain; check export dimensions');seenGs.add(key);
  const clicks=numeric(r.clicks,'clicks'),impressions=numeric(r.impressions,'impressions'),position=numeric(r.position,'position',true);
  report.gsc.rows++;report.gsc.clicks+=clicks;report.gsc.impressions+=impressions;
  if(position!==null){positionSum+=position*impressions;report.gsc.positionCoverageImpressions+=impressions;}else if(impressions>0)positionComplete=false;
  const x=gsPages.get(p)||{page:p,clicks:0,impressions:0};
  x.clicks+=clicks;x.impressions+=impressions;gsPages.set(p,x);
 }
 report.gsc.ctr=report.gsc.impressions?report.gsc.clicks/report.gsc.impressions:null;
 report.gsc.position=positionComplete&&report.gsc.impressions?positionSum/report.gsc.impressions:null;
 report.gsc.pages=[...gsPages.values()].map(x=>({...x,ctr:x.impressions?x.clicks/x.impressions:null}));
 let leads=0,events=0,leadComplete=true,eventComplete=true;
 for(const r of ga4){
  const d=date(r.date),p=page(r.landing_page);if(!p){report.ga4.excludedPrivateRows++;continue;}
  const key=[d,p,r.source_medium||'',r.device||''].join('|');
  if(seenGa.has(key))throw Error('Duplicate GA4 grain; check export dimensions');seenGa.add(key);
  const sessions=numeric(r.sessions,'sessions'),lead=numeric(r.lead_sessions,'lead_sessions',true),count=numeric(r.generate_lead_events,'generate_lead_events',true);
  if(lead!==null&&lead>sessions)throw Error('lead_sessions cannot exceed sessions; do not map event counts into session counts');
  report.ga4.rows++;report.ga4.sessions+=sessions;
  if(lead===null)leadComplete=false;else leads+=lead;
  if(count===null)eventComplete=false;else events+=count;
  const x=gaPages.get(p)||{page:p,sessions:0};x.sessions+=sessions;gaPages.set(p,x);
 }
 report.ga4.leadSessions=ga4.length&&leadComplete?leads:null;
 report.ga4.generateLeadEvents=ga4.length&&eventComplete?events:null;
 report.ga4.leadSessionRate=report.ga4.sessions&&report.ga4.leadSessions!==null?report.ga4.leadSessions/report.ga4.sessions:null;
 report.ga4.pages=[...gaPages.values()];
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2),value=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
 const gscPath=value('--gsc'),ga4Path=value('--ga4');
 if(!gscPath&&!ga4Path)throw Error('Provide --gsc and/or --ga4 normalized CSV exports. See docs/search-execution/data-import.md');
 const gsc=gscPath?parseCsv(await readFile(gscPath,'utf8')):[],ga4=ga4Path?parseCsv(await readFile(ga4Path,'utf8')):[];
 if(gscPath&&!gsc.length||ga4Path&&!ga4.length)throw Error('An empty export is not a measured zero baseline');
 const report=analyze(gsc,ga4);
 report.generatedAt=new Date().toISOString();
 await mkdir('data/search-private',{recursive:true});
 await writeFile('data/search-private/search-summary.json',JSON.stringify(report,null,2));
 console.log('Imported '+report.gsc.rows+' GSC rows and '+report.ga4.rows+' GA4 rows. Private report: data/search-private/search-summary.json');
}
