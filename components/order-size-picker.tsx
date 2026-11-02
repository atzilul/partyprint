'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,ChevronLeft,Shirt,X,LoaderCircle} from 'lucide-react';
import {ShirtOptions,defaultShirts} from './shirt-options';
import {SizeGuide} from '@/app/order-experience';
import {validateShirts} from '@/lib/catalog';
import type {ShirtSelection} from '@/lib/catalog';
import type {Dispatch,SetStateAction} from 'react';
type Props={quantity:number;value:ShirtSelection[]|null;draft:ShirtSelection[];onDraft:Dispatch<SetStateAction<ShirtSelection[]>>;onConfirm:(v:ShirtSelection[]|null)=>void;disabled?:boolean;onOpenChange:(v:boolean)=>void};
export default function OrderSizePicker({quantity,value,draft,onDraft,onConfirm,disabled=false,onOpenChange}:Props){
 const dialog=useRef<HTMLDialogElement>(null);const [open,setOpen]=useState(false),[attempt,setAttempt]=useState(0),[error,setError]=useState('');const complete=validateShirts(value,quantity);
 useEffect(()=>{const node=dialog.current;if(!node)return;if(open&&!node.open)node.showModal();else if(!open&&node.open)node.close();onOpenChange(open);return()=>{};},[open]);
 const active=Array.from({length:quantity},(_,i)=>draft[i]??defaultShirts(1)[0]);
 const change:Dispatch<SetStateAction<ShirtSelection[]>>=update=>{onDraft(previous=>{const visible=Array.from({length:quantity},(_,i)=>previous[i]??defaultShirts(1)[0]);const next=typeof update==='function'?update(visible):update;return [...next,...previous.slice(quantity)];});setError('');};
 function show(){if(disabled)return;setAttempt(0);setError('');if(complete)onDraft(previous=>[...value.map(v=>({...v})),...previous.slice(quantity)]);setOpen(true);}
 function confirm(){if(!validateShirts(active,quantity)){setError('בחרו גיל לכל חולצת ילד לפני אישור המידות.');setAttempt(v=>v+1);return;}onConfirm(active.map(v=>({...v})));setOpen(false);}
 return <div className="pp-size-choice" data-complete={complete}>
 <button type="button" className="pp-size-entry" data-state={disabled?'loading':complete?'success':'default'} aria-busy={disabled} aria-haspopup="dialog" aria-controls="order-size-dialog" disabled={disabled} onClick={show}><span className="pp-size-entry-icon" aria-hidden="true">{disabled?<LoaderCircle className="pp-spinner" size={24}/>:complete?<Check size={24}/>:<Shirt size={24}/>}<span className="pp-size-entry-swatches"><i/><i/><i/></span></span><span><b>מידות וצבעים</b><small>{complete?(quantity===1?'המידה והצבע נבחרו':'נבחרו מידות ל־'+quantity+' חולצות'):'אפשר לבחור עכשיו, או להשלים אחרי השליחה'}</small></span><ChevronLeft size={18}/></button>
 {complete&&<button type="button" className="pp-text-button" disabled={disabled} onClick={()=>onConfirm(null)}>נשלים מידות בהמשך</button>}
 <dialog id="order-size-dialog" ref={dialog} className="pp-order-flow pp-size-dialog" aria-labelledby="order-size-dialog-title" onCancel={e=>{e.preventDefault();setOpen(false);}} onClose={()=>setOpen(false)}>
 <header><div><h2 id="order-size-dialog-title">מידות וצבעים לחולצות</h2><p>{quantity===1?'חולצה אחת':quantity+' חולצות'} · אפשר לשנות כל חולצה בנפרד</p></div><button type="button" className="pp-text-button" aria-label="סגירת בחירת המידות" onClick={()=>setOpen(false)}><X size={20}/></button></header>
 <div className="pp-size-dialog-body">{open&&<><ShirtOptions items={active} onChange={change} validationAttempt={attempt}/><div className="pp-size-guide"><SizeGuide/></div></>}{error&&<p className="pp-error" role="alert">{error}</p>}</div>
 <footer><button type="button" className="pp-primary" onClick={confirm}>אישור המידות לבקשה<Check size={17}/></button><button type="button" className="pp-text-button" onClick={()=>setOpen(false)}>חזרה לטופס</button><p className="pp-help">הבחירה תישמר עם פרטי הקשר או בשליחת הבקשה. אפשר לשנות לפני אישור ההדפסה.</p></footer>
 </dialog></div>;
}
