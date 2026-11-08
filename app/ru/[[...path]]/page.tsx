import {translatedPage} from '@/lib/translated-page';

// The site in Russian: see lib/translated-page.tsx.
const page=translatedPage('ru');
export const dynamic='force-dynamic';
export const generateMetadata=page.generateMetadata;
export default page.Page;
