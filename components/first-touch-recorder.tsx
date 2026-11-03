'use client';
import {useEffect} from 'react';
import {marketingAttributionAllowed} from '@/lib/analytics';
import {readFirstTouchAttribution} from '@/lib/attribution';

export default function FirstTouchRecorder() {
  useEffect(() => {
    readFirstTouchAttribution(false);
    let active = true;
    void marketingAttributionAllowed().then(allowed => {
      if (active && allowed) readFirstTouchAttribution(true);
    });
    return () => { active = false; };
  }, []);
  return null;
}
