import {translatedPage} from '@/lib/translated-page';

// The site in Arabic: see lib/translated-page.tsx.
const page=translatedPage('ar');
export const dynamic='force-dynamic';
export const generateMetadata=page.generateMetadata;
export default page.Page;
