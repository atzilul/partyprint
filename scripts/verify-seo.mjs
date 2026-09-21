const baseUrl = (process.env.PARTYPRINT_PUBLIC_URL || 'https://partyprint.co.il').replace(/\/$/, '');
const requiredRobots = ['OAI-SearchBot', 'Google-Extended', 'Claude-SearchBot', 'PerplexityBot'];

async function fetchChecked(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {redirect: 'follow'});
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response.text();
}

const robots = await fetchChecked('/robots.txt');
const missingRobots = requiredRobots.filter(token => !robots.includes(token));
if (missingRobots.length) throw new Error(`robots.txt is missing: ${missingRobots.join(', ')}`);
if (!robots.includes(`${baseUrl}/sitemap.xml`)) throw new Error('robots.txt does not advertise the sitemap.');

const sitemap = await fetchChecked('/sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim()).filter(Boolean);
if (urls.length < 20) throw new Error(`Expected at least 20 public sitemap URLs, found ${urls.length}.`);

const llms = await fetchChecked('/llms.txt');
for (const token of ['/guides', '/blog', '/faq', '/sitemap.xml']) {
  if (!llms.includes(`${baseUrl}${token}`)) throw new Error(`llms.txt is missing ${token}.`);
}

console.log(`SEO smoke check passed: ${urls.length} sitemap URLs, AI crawler directives, llms.txt.`);
