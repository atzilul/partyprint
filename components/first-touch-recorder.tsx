'use client';
import {useEffect} from 'react';
import {CONSENT_EVENT, isExcludedPath, marketingAttributionAllowed, readConsent} from '@/lib/analytics';
import {readFirstTouchAttribution} from '@/lib/attribution';

export default function FirstTouchRecorder() {
  useEffect(() => {
    if (isExcludedPath(location.pathname)) return;
    readFirstTouchAttribution(false);
    let active = true;
    const refresh = () => {
      if (readConsent() === 'denied') { readFirstTouchAttribution(false); return; }
      void marketingAttributionAllowed().then(allowed => {
        if (active && allowed) readFirstTouchAttribution(true);
      });
    };
    refresh();
    window.addEventListener(CONSENT_EVENT, refresh);
    return () => { active = false; window.removeEventListener(CONSENT_EVENT, refresh); };
  }, []);
  return null;
}
