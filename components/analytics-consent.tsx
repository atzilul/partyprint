'use client';

import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {CONSENT_EVENT, getMetaMode, installInteractionTracking, isExcludedPath, readConsent, saveConsent, startAnalytics, type ConsentChoice, type MetaMode} from '@/lib/analytics';

const PRIVACY_POLICY_PATH = '/privacy-policy';

/**
 * Measurement notice. Google Analytics runs on public pages unless the visitor
 * clicks "לא, תודה". The Meta pixel depends on the visitor's region (see
 * lib/analytics.ts): in Israel it may send PageView before a choice; elsewhere,
 * or when the region is unknown, it does not load until "אישור". The text below
 * says exactly that for each mode and never promises that data already sent is
 * deleted. "הגדרות פרטיות ועוגיות" at the bottom of every public page reopens it.
 */
export default function AnalyticsConsent() {
  const pathname = usePathname() || '/';
  const excluded = isExcludedPath(pathname);
  const [choice, setChoice] = useState<ConsentChoice | null | undefined>(undefined);
  const [mode, setMode] = useState<MetaMode | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (excluded) return;
    installInteractionTracking();
    let active = true;
    const sync = () => setChoice(readConsent());
    void getMetaMode().then(next => { if (!active) return; setMode(next); const current = readConsent(); setChoice(current); if (current === null) setOpen(true); });
    window.addEventListener(CONSENT_EVENT, sync);
    return () => { active = false; window.removeEventListener(CONSENT_EVENT, sync); };
  }, [excluded]);

  useEffect(() => {
    if (!excluded && choice !== undefined && choice !== 'denied') void startAnalytics();
  }, [choice, pathname, excluded]);

  if (excluded || choice === undefined || mode === undefined) return null;

  function decide(next: ConsentChoice) { saveConsent(next); setOpen(false); }
  function reopen() { setOpen(true); requestAnimationFrame(() => firstButton.current?.focus()); }

  return <>
    {open && <section className="consent-banner" role="region" aria-label="הגדרות פרטיות" dir="rtl">
      <div className="consent-copy">
        <strong>עוגיות למדידה ולפרסום</strong>
        {mode === 'notice'
          ? <p>האתר משתמש ב־Google Analytics ובפיקסל של Meta כדי למדוד את השימוש באתר ואת הפרסום שלנו. הפיקסל של Meta עשוי לשלוח אירוע צפייה בעמוד כבר לפני שתבחרו. שאר אירועי Meta נשלחים רק אחרי ״אישור״. ״לא, תודה״ עוצר את אירועי Meta הבאים ואת Google Analytics בדפדפן הזה, והבחירה נשמרת. <a href={PRIVACY_POLICY_PATH}>מדיניות הפרטיות</a></p>
          : <p>האתר משתמש ב־Google Analytics כדי למדוד את השימוש באתר. הפיקסל של Meta (פרסום בפייסבוק ובאינסטגרם) יופעל רק אם תלחצו ״אישור״. ״לא, תודה״ משאיר את Meta כבוי ועוצר גם את Google Analytics בדפדפן הזה, והבחירה נשמרת. <a href={PRIVACY_POLICY_PATH}>מדיניות הפרטיות</a></p>}
        {choice && <small>הבחירה הנוכחית: {choice === 'granted' ? 'מאושר' : 'המדידה כבויה'}. אפשר לשנות בכל עת.</small>}
      </div>
      <div className="consent-actions">
        <button ref={firstButton} type="button" className="consent-accept" onClick={() => decide('granted')}>אישור</button>
        <button type="button" className="consent-reject" onClick={() => decide('denied')}>לא, תודה</button>
      </div>
    </section>}
    <div className="consent-settings"><a href={PRIVACY_POLICY_PATH}>מדיניות פרטיות</a><span aria-hidden="true">·</span><button type="button" onClick={reopen}>הגדרות פרטיות ועוגיות</button></div>
  </>;
}
