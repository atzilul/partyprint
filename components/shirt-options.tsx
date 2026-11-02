'use client';
import {useEffect,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import {Check} from 'lucide-react';
import {SIZES,CHILD_SIZES,COLORS,COLOR_LABELS,shirtSizeLabel,validateShirts} from '@/lib/catalog';
import type {ShirtSelection} from '@/lib/catalog';
export const defaultShirts=(quantity:number):ShirtSelection[]=>Array.from({length:quantity},()=>({sizeType:'adult',size:'M',color:'black'}));
export function ShirtOptions({items,onChange,disabled=false,restored=false}:{items:ShirtSelection[];onChange:Dispatch<SetStateAction<ShirtSelection[]>>;disabled?:boolean;restored?:boolean}){
 const [active,setActive]=useState(0);useEffect(()=>{setActive(i=>Math.max(0,Math.min(i,items.length-1)))},[items.length]);
 const selected=items[active],ready=items.filter(s=>validateShirts([s],1)).length;
 function update(index:number,change:Partial<ShirtSelection>){onChange(previous=>previous.map((s,i)=>i===index?{...s,...change}:s));}
 return <fieldset className="shirt-options compact-shirts" disabled={disabled}><legend>המידות שלכם, בקצב שלכם</legend>
 <div className="shirt-progress"><span>{ready===items.length?items.length+' חולצות מוכנות, שנו מה שצריך':'נשאר לבחור מידות ילדים'}</span><b>{ready}/{items.length}</b></div>
 <p>{restored?'החזרנו את בחירת המידות מהטיוטה.':'התחלנו במבוגר M בצבע שחור.'} אלה הצעות בלבד; המידות נשמרות רק בלחיצה על ״שמירת המידות״.</p>
 <div className="shirt-bulk-choice"><div><b>רוב הקבוצה באותה מידה?</b><span>בחרו חולצה והחילו את הבחירה, ואז שנו את החריגות.</span></div><button type="button" disabled={disabled||!selected||!validateShirts([selected],1)} onClick={()=>onChange(previous=>{const source=previous[active];return source&&validateShirts([source],1)?previous.map(()=>({...source})):previous;})}>החלת הבחירה מחולצה {active+1} על כולן <Check size={15}/></button></div>
 <div className="shirt-option-list">{items.map((item,i)=><div id={'shirt-row-'+i} className={'shirt-row '+(active===i?'editing':'')} key={i}>
 <button type="button" className="shirt-row-summary" aria-expanded={active===i} aria-controls={'shirt-editor-'+i} onClick={()=>setActive(i)}><span className="shirt-number">{validateShirts([item],1)?<Check size={15}/>:i+1}</span><b>חולצה {i+1}</b><span>{item.size?shirtSizeLabel(item):'בחרו גיל'} · {COLOR_LABELS[item.color as keyof typeof COLOR_LABELS]}</span><span className="shirt-edit-label">שינוי</span></button>
 {active===i&&<div id={'shirt-editor-'+i} className="shirt-editor"><div className="shirt-size-type"><span>מידה עבור:</span><div className="shirt-size-toggle" role="group" aria-label={'סוג המידה לחולצה '+(i+1)}><button type="button" aria-pressed={item.sizeType!=='child'} onClick={()=>update(i,{sizeType:'adult',size:item.sizeType==='child'?'M':item.size})}>מבוגר</button><button type="button" aria-pressed={item.sizeType==='child'} onClick={()=>{if(item.sizeType!=='child')update(i,{sizeType:'child',size:''})}}>ילד</button></div></div>
 {item.sizeType==='child'?<label className="child-age-choice"><span>מידת ילד לפי גיל</span><select aria-label={'גיל הילד לחולצה '+(i+1)} value={item.size} onChange={e=>update(i,{size:e.target.value})}><option value="">בחרו גיל</option>{CHILD_SIZES.map(s=><option key={s} value={s}>גיל {s}</option>)}</select></label>:<div className="size-pills" role="group" aria-label={'מידת מבוגר, חולצה '+(i+1)}>{SIZES.map(s=><button type="button" className={item.size===s?'selected':''} aria-pressed={item.size===s} key={s} onClick={()=>update(i,{size:s})}>{s}</button>)}</div>}
 <div className="color-pills" role="group" aria-label={'צבע חולצה '+(i+1)}>{COLORS.map(c=><button type="button" className={item.color===c?'selected':''} aria-pressed={item.color===c} key={c} onClick={()=>update(i,{color:c})}><i style={{background:c==='white'?'#fff':c==='black'?'#202020':'#aaa'}}/>{COLOR_LABELS[c]}</button>)}</div></div>}
 </div>)}</div></fieldset>;
}
