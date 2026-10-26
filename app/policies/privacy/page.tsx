import {permanentRedirect} from 'next/navigation';

// The privacy policy moved to /privacy-policy (Oct 2026). Keep old links working.
export default function LegacyPrivacyPage(){permanentRedirect('/privacy-policy')}
