// Shared by the listing and export so exported rows match the selected filters.
export function israelDay(now=new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function orderQuery(params:URLSearchParams, today=israelDay()) {
 const clauses:string[]=[],args:string[]=[];
 const status=params.get('status')||'',q=(params.get('q')||'').trim().slice(0,100);
 if(status){clauses.push('status=?');args.push(status)}
 if(q){const search='%'+q.replace(/[\\%_]/g,'\\$&')+'%';clauses.push("(json_extract(data,'$.name') LIKE ? ESCAPE '\\' OR json_extract(data,'$.phone') LIKE ? ESCAPE '\\' OR id LIKE ? ESCAPE '\\' OR json_extract(data,'$.email') LIKE ? ESCAPE '\\')");args.push(search,search,search,search)}
 const due="coalesce(json_extract(data,'$.dueDate'),'')";
 const focus=params.get('focus')||'';
 if(focus==='overdue'){clauses.push(`status!='shipped' AND ${due}!='' AND ${due}<?`);args.push(today)}
 if(focus==='today'){clauses.push(`status!='shipped' AND ${due}=?`);args.push(today)}
 if(focus==='no_mail')clauses.push("coalesce(json_extract(data,'$.emailStatus'),'')!='accepted'");
 if(focus==='open')clauses.push("status!='shipped'");
 if(focus==='lead')clauses.push("json_extract(data,'$.mode')='lead'");
 // Calendar filters refer to the agreed target date, not the request creation date.
 for(const [key,op] of [['from','>='],['to','<=']]){const day=params.get(key)||'';if(/^\d{4}-\d{2}-\d{2}$/.test(day)){clauses.push(`${due}!='' AND ${due}${op}?`);args.push(day)}}
 const sorts:Record<string,string>={newest:'created_at DESC,id DESC',oldest:'created_at ASC,id ASC',updated:'updated_at DESC,id DESC',due:`CASE WHEN ${due}='' THEN 1 ELSE 0 END,${due} ASC,created_at DESC`,value:"CAST(json_extract(data,'$.price') AS REAL) DESC,created_at DESC"};
 return {where:clauses.join(' AND ')||'1=1',args,sort:sorts[params.get('sort')||'']||sorts.newest};
}
// Neutralize spreadsheet formula injection, including whitespace-prefixed formulas.
export function csvCell(value:unknown){let s=String(value??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
