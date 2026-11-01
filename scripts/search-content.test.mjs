import test from 'node:test';
import assert from 'node:assert/strict';
import {SEO_PAGES,SEO_PAGE_ALIASES,getSeoPage} from '../lib/seo-pages.ts';
test('all existing guide addresses stay unique and resolve their aliases',()=>{
 assert.equal(SEO_PAGES.length,22);
 const slugs=new Set(SEO_PAGES.map(p=>p.slug));
 assert.equal(slugs.size,SEO_PAGES.length);
 for(const [alias,target] of Object.entries(SEO_PAGE_ALIASES)){
  assert.ok(slugs.has(target),target);
  assert.equal(getSeoPage(alias)?.slug,target);
  assert.ok(!slugs.has(alias),'An alias must not create a duplicate indexable page');
 }
 assert.equal(getSeoPage('__missing__'),null);
});
test('related content forms valid navigable links',()=>{
 for(const page of SEO_PAGES){
  assert.ok(page.relatedSlugs.length>=2,page.slug);
  for(const related of page.relatedSlugs){
   assert.notEqual(related,page.slug);
   assert.ok(getSeoPage(related),page.slug+' links to missing '+related);
  }
 }
});
test('metadata, visible answers and editorial dates are complete',()=>{
 assert.equal(new Set(SEO_PAGES.map(p=>p.seoTitle)).size,SEO_PAGES.length);
 const questions=[];
 for(const p of SEO_PAGES){
  assert.ok(p.title&&p.seoDescription&&p.intro&&p.audience,p.slug);
  assert.ok(['service','planning','inspiration'].includes(p.intent));
  assert.ok(Number.isFinite(new Date(p.updatedAt).getTime()));
  assert.ok(new Date(p.updatedAt).getTime()<=Date.now(),'Do not invent future modification dates');
  assert.ok(p.sections.length>=3);
  assert.ok(p.sections.every(s=>s.title&&s.body.length>80));
  assert.ok(p.faqs.every(f=>f.question&&f.answer.length>40));
  questions.push(...p.faqs.map(f=>f.question));
  assert.ok(p.heroImage.startsWith('/')&&!p.heroImage.startsWith('//'));
 }
 assert.equal(new Set(questions).size,questions.length,'Each audience must have its own useful questions');
});
