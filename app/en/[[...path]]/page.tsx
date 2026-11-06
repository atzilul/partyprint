import {translatedPage} from '@/lib/translated-page';

// The site in English: see lib/translated-page.tsx.
const page=translatedPage('en');
export const dynamic='force-dynamic';
export const generateMetadata=page.generateMetadata;
export default page.Page;
