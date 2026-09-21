'use client';
import {usePathname} from 'next/navigation';
import SeoFooterLinks from './seo-footer-links';

export default function SiteSeoFooter() {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  return <footer className="site-seo-footer"><SeoFooterLinks/></footer>;
}
