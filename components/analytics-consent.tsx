'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {CONSENT_EVENT, getMetaMode, installInteractionTracking, isExcludedPath, readConsent, saveConsent, startAnalytics, type ConsentChoice, type MetaMode} from '@/lib/analytics';

const PRIVACY_POLICY_PATH = '/privacy-policy';

/**
 * Privacy settings. Nothing opens automatically (owner's decision, Nov 2026):
 * Google Analytics and, in Israel, the Meta pixel run on public pages by default,
 * and "הגדרות פרטיות ועוגיות" at the bottom of every public page opens this panel
 * for anyone who wants to stop measurement. Outside Israel, or when the region is
 * unknown, the Meta pixel stays off until the visitor opens the panel and chooses
 * "אישור" (see lib/analytics.ts). The text never promises that data already sent
 * is deleted.
 */
export default function AnalyticsConsent() {
  const pathname = usePathname() || '/';
  const excluded = isExcludedPath(pathname);
  const [choice, setChoice] = useState<ConsentChoice | null | undefined>(undefined);
  const [mode, setMode] = useState<MetaMode | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (excluded) return;
    installInteractionTracking();
    let active = true;
    const sync = () => setChoice(readConsent());
    void getMetaMode().then(next => { if (!active) return; setMode(next); setChoice(readConsent()); });
    window.addEventListener(CONSENT_EVENT, sync);
    return () => { active = false; window.removeEventListener(CONSENT_EVENT, sync); };
  }, [excluded]);

  useEffect(() => {
    if (!excluded && choice !== undefined && choice !== 'denied') void startAnalytics();
  }, [choice, pathname, excluded]);

  if (excluded || choice === undefined || mode === undefined) return null;

  function decide(next: ConsentChoice) { saveConsent(next); setOpen(false); setDetailsOpen(false); }
  function reopen() { setDetailsOpen(false); setOpen(true); requestAnimationFrame(() => firstButton.current?.focus()); }

  return <>
    {open && <section className="consent-banner" role="region" aria-label="הגדרות פרטיות" dir="rtl">
      <div className="consent-copy">
        <p>אנחנו משתמשים בעוגיות למדידה ולפרסום.</p>
      </div>
      <div className="consent-details" id={detailsId} hidden={!detailsOpen}>
        {mode === 'notice'
          ? <p>האתר משתמש ב־Google Analytics ובפיקסל של Meta כדי למדוד את השימוש באתר ואת הפרסום שלנו. המדידה פועלת כברירת מחדל. ״לא, תודה״ עוצר את Google Analytics ואת אירועי Meta בדפדפן הזה, והבחירה נשמרת. ״אישור״ מחזיר את המדידה. <a href={PRIVACY_POLICY_PATH}>מדיניות הפרטיות</a></p>
          : <p>האתר משתמש ב־Google Analytics כדי למדוד את השימוש באתר. הפיקסל של Meta (פרסום בפייסבוק ובאינסטגרם) יופעל רק אם תלחצו ״אישור״. ״לא, תודה״ משאיר את Meta כבוי ועוצר גם את Google Analytics בדפדפן הזה, והבחירה נשמרת. <a href={PRIVACY_POLICY_PATH}>מדיניות הפרטיות</a></p>}
        <small>הבחירה הנוכחית: {choice === 'granted' ? 'מאושר' : choice === 'denied' ? 'המדידה כבויה' : mode === 'notice' ? 'המדידה פועלת כברירת מחדל' : 'Google Analytics פועל, Meta כבוי עד אישור'}. אפשר לשנות בכל עת.</small>
      </div>
      <div className="consent-actions">
        <button ref={firstButton} type="button" className="consent-accept" onClick={() => decide('granted')}>אישור</button>
        <button type="button" className="consent-reject" onClick={() => decide('denied')}>לא, תודה</button>
        <button type="button" className="consent-details-toggle" aria-expanded={detailsOpen} aria-controls={detailsId} onClick={() => setDetailsOpen(current => !current)}>{detailsOpen ? 'פחות פרטים' : 'פרטים'}</button>
      </div>
    </section>}
    <div className="consent-settings"><a href={PRIVACY_POLICY_PATH}>מדיניות פרטיות</a><span aria-hidden="true">·</span><button type="button" onClick={reopen}>הגדרות פרטיות ועוגיות</button></div>
  </>;
}
