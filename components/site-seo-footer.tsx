'use client';
import {usePathname} from 'next/navigation';
import SeoFooterLinks from './seo-footer-links';
import BusinessDetails from '@/components/business-details';
import type {BusinessDetailsData} from '@/lib/business-details';

export default function SiteSeoFooter({details}:{details:BusinessDetailsData}) {
  const pathname = usePathname();
  // The home page in every language; landing pages keep their own short footer.
  if (!['/','/en','/ar'].includes(pathname)) return null;
  return <footer className="site-seo-footer"><SeoFooterLinks/><BusinessDetails details={details}/></footer>;
}
