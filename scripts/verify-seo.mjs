const baseUrl = (process.env.PARTYPRINT_PUBLIC_URL || 'https://partyprint.co.il').replace(/\/$/, '');
const requiredRobots = ['OAI-SearchBot', 'Google-Extended', 'Claude-SearchBot', 'PerplexityBot'];
const requiredRoutes = ['/', '/about', '/work', '/guides', '/blog', '/faq', '/policies/shipping', '/policies/returns', '/blog/feed.xml'];

async function fetchChecked(path) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const response = await fetch(url, {redirect: 'follow'});
  const body = await response.text();
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return {body, contentType: response.headers.get('content-type') || '', response};
}

function assertHtmlQuality(path, result) {
  if (path.endsWith('/feed.xml')) return;
  if (!/<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i.test(result.body)) throw new Error(`${path} is missing a title.`);
  if (!/<link[^>]+rel=["']canonical["']/i.test(result.body)) throw new Error(`${path} is missing a canonical link.`);
}

const robotsResult = await fetchChecked('/robots.txt');
const missingRobots = requiredRobots.filter(token => !robotsResult.body.includes(token));
if (missingRobots.length) throw new Error(`robots.txt is missing: ${missingRobots.join(', ')}`);
if (!robotsResult.body.includes(`${baseUrl}/sitemap.xml`)) throw new Error('robots.txt does not advertise the sitemap.');

const sitemapResult = await fetchChecked('/sitemap.xml');
const urls = [...sitemapResult.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim()).filter(Boolean);
if (urls.length < 20) throw new Error(`Expected at least 20 public sitemap URLs, found ${urls.length}.`);
if (new Set(urls).size !== urls.length) throw new Error('sitemap.xml contains duplicate URLs.');
if (urls.some(url => !url.startsWith(`${baseUrl}/`) && url !== `${baseUrl}/`)) throw new Error('sitemap.xml contains a URL outside the public site.');

for (const path of requiredRoutes) {
  const result = await fetchChecked(path);
  assertHtmlQuality(path, result);
}

const llms = await fetchChecked('/llms.txt');
for (const token of ['/about', '/work', '/guides', '/blog', '/faq', '/sitemap.xml']) {
  if (!llms.body.includes(`${baseUrl}${token}`)) throw new Error(`llms.txt is missing ${token}.`);
}

const htmlSitemapUrls = urls.filter(url => !url.endsWith('/feed.xml'));
for (let index = 0; index < htmlSitemapUrls.length; index += 6) {
  const batch = htmlSitemapUrls.slice(index, index + 6);
  const results = await Promise.all(batch.map(url => fetchChecked(url)));
  results.forEach((result, batchIndex) => assertHtmlQuality(batch[batchIndex], result));
}

console.log(`SEO smoke check passed: ${urls.length} unique sitemap URLs, ${htmlSitemapUrls.length} HTML pages, AI crawler directives, llms.txt and canonical metadata.`);
