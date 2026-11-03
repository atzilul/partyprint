'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {CONSENT_EVENT, getMetaMode, installInteractionTracking, isExcludedPath, readConsent, saveConsent, startAnalytics, type ConsentChoice, type MetaMode} from '@/lib/analytics';

const PRIVACY_POLICY_PATH = '/privacy-policy';

/**
 * Measurement notice. PageView is sent before a choice. In strict mode all
 * other events are buffered in memory until approval; notice mode also sends
 * Meta behavior events that contain no form fields or contact details. Refusal drops the
 * unsent queue. "הגדרות פרטיות ועוגיות" reopens the settings.
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
    void getMetaMode().then(next => { if (!active) return; setMode(next); const current = readConsent(); setChoice(current); if (current === null) setOpen(true); });
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
          ? <p>לפני הבחירה Meta מקבלת צפייה בעמוד, צפייה במוצר, התחלת בקשה והתקדמות בין שלבים. לא נשלחים שדות טופס, פרטי קשר או תמונות. אירועי שימוש אחרים ו־Google Analytics נשמרים זמנית בזיכרון ונשלחים רק אחרי ״אישור״. ״לא, תודה״ מונע את שליחתם. <a href={PRIVACY_POLICY_PATH}>מדיניות הפרטיות</a></p>
          : <p>לפני הבחירה נשלחת צפייה בעמוד בלבד. יתר אירועי השימוש נשמרים זמנית בזיכרון ונשלחים ל־Google Analytics ול־Meta רק אחרי ״אישור״. ״לא, תודה״ מוחק אותם. <a href={PRIVACY_POLICY_PATH}>מדיניות הפרטיות</a></p>}
        {choice && <small>הבחירה הנוכחית: {choice === 'granted' ? 'מאושר' : 'המדידה כבויה'}. אפשר לשנות בכל עת.</small>}
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
