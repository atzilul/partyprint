const baseUrl = (process.env.PARTYPRINT_PUBLIC_URL || 'https://partyprint.co.il').replace(/\/$/, '');
const ignoredPrefixes = ['/admin', '/api', '/_next', '/signin', '/signout', '/design', '/track'];

async function fetchText(url) {
  const response = await fetch(url, {redirect: 'follow'});
  const body = await response.text();
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return body;
}

const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(match => match[1].trim())
  .filter(url => !url.endsWith('/feed.xml'));
const links = new Set();

for (let index = 0; index < pages.length; index += 6) {
  const batch = pages.slice(index, index + 6);
  const html = await Promise.all(batch.map(fetchText));
  html.forEach(body => {
    for (const match of body.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) continue;
      try {
        const url = new URL(raw, baseUrl);
        if (url.origin !== baseUrl || !url.pathname.startsWith('/')) continue;
        if (ignoredPrefixes.some(prefix => url.pathname.startsWith(prefix))) continue;
        if (url.pathname.match(/\.(?:png|jpe?g|webp|gif|svg|ico|css|js|xml|txt)$/i)) continue;
        links.add(`${baseUrl}${url.pathname}`);
      } catch {
        throw new Error(`Invalid internal link found: ${raw}`);
      }
    }
  });
}

const targets = [...links];
for (let index = 0; index < targets.length; index += 6) {
  await Promise.all(targets.slice(index, index + 6).map(async url => {
    const response = await fetch(url, {redirect: 'follow'});
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    await response.arrayBuffer();
  }));
}

console.log(`Public link check passed: ${targets.length} unique internal destinations from ${pages.length} sitemap pages.`);
