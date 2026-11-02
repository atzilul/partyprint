import {Check,Sparkles} from 'lucide-react';

// Two short input screens, followed by the real saved confirmation.
export default function RequestProgress({stage,onStep,disabled=false}:{stage:0|1|2;onStep?:(step:number)=>void;disabled?:boolean}){
 const labels=['החולצות','הפרטים והרעיון','יוצאים לדרך'];
 return <div className="pp-progress" data-stage={stage+1}>
  <div className="pp-progress-caption"><span><Sparkles size={15} aria-hidden="true"/>{stage===0?'כל רעיון גדול מתחיל בצעד קטן':stage===1?'עוד רגע, והרעיון שלכם אצלנו':'יש! הרעיון שלכם הגיע לסטודיו'}</span><b>{stage===2?'הפנייה נשמרה':'צעד '+(stage+1)+' מתוך 3'}</b></div>
  <div className="pp-progress-track" role="progressbar" aria-label="ההתקדמות שלכם" aria-valuemin={0} aria-valuemax={3} aria-valuenow={stage+1} aria-valuetext={stage===2?'הפנייה נשמרה בסטודיו':'צעד '+(stage+1)+' מתוך 3: '+labels[stage]}><span className={'pp-progress-fill pp-progress-fill-'+stage}/></div>
  <ol className="pp-steps" aria-label="שלבי הפנייה">{labels.map((label,i)=><li key={label} aria-current={stage===i?'step':undefined} className={stage>=i?'is-active':''}>{onStep&&i<2?<button type="button" disabled={disabled} onClick={()=>onStep(i)} aria-label={'שלב '+(i+1)+': '+label}><span aria-hidden="true">{stage>i?<Check size={14}/>:i+1}</span>{label}</button>:<span className="pp-progress-future"><span aria-hidden="true">{stage===2?<Check size={14}/>:i+1}</span>{label}</span>}</li>)}</ol>
 </div>;
}
