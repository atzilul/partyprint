'use client';

import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {CONSENT_EVENT, installInteractionTracking, isExcludedPath, readConsent, saveConsent, startAnalytics, type ConsentChoice} from '@/lib/analytics';

/**
 * Analytics consent: nothing is measured until the visitor accepts. The banner
 * stays out of the way of the order form, and "הגדרות פרטיות" at the bottom of
 * every public page reopens it so the choice can be changed at any time.
 */
export default function AnalyticsConsent() {
  const pathname = usePathname() || '/';
  const excluded = isExcludedPath(pathname);
  const [choice, setChoice] = useState<ConsentChoice | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (excluded) return;
    installInteractionTracking();
    const sync = () => setChoice(readConsent());
    const initial = window.setTimeout(() => { const current = readConsent(); setChoice(current); if (current === null) setOpen(true); }, 0);
    window.addEventListener(CONSENT_EVENT, sync);
    return () => { window.clearTimeout(initial); window.removeEventListener(CONSENT_EVENT, sync); };
  }, [excluded]);

  useEffect(() => {
    if (!excluded && choice === 'granted') void startAnalytics();
  }, [choice, pathname, excluded]);

  if (excluded || choice === undefined) return null;

  function decide(next: ConsentChoice) { saveConsent(next); setOpen(false); }
  function reopen() { setOpen(true); requestAnimationFrame(() => firstButton.current?.focus()); }

  return <>
    {open && <section className="consent-banner" role="region" aria-label="הגדרות פרטיות" dir="rtl">
      <div className="consent-copy">
        <strong>סטטיסטיקת שימוש? רק אם תאשרו.</strong>
        <p>נשמח להשתמש ב־Google Analytics ובמונה פנימי כדי לשפר את האתר. לא נשלחים שם, טלפון, מייל, תמונות או תוכן הטופס. ההזמנה עובדת גם בלי אישור.</p>
        {choice && <small>הבחירה הנוכחית: {choice === 'granted' ? 'מאושר' : 'לא מאושר'}. אפשר לשנות בכל עת.</small>}
      </div>
      <div className="consent-actions">
        <button ref={firstButton} type="button" className="consent-accept" onClick={() => decide('granted')}>מאשרים סטטיסטיקה</button>
        <button type="button" className="consent-reject" onClick={() => decide('denied')}>לא, תודה</button>
      </div>
    </section>}
    <div className="consent-settings"><button type="button" onClick={reopen}>הגדרות פרטיות ועוגיות</button></div>
  </>;
}
