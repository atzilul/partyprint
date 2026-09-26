const aiCrawlers = ['OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'Google-Extended', 'GoogleOther', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Applebot-Extended', 'Amazonbot', 'Bytespider'];
const privatePaths = ['/admin', '/api', '/design/', '/track/', '/signin-with-chatgpt', '/signout-with-chatgpt', '/chatgpt-auth'];

export default function robots(){
  return {
    rules: [{userAgent: ['*', ...aiCrawlers], allow: '/', disallow: privatePaths}],
    sitemap: 'https://partyprint.co.il/sitemap.xml',
    host: 'https://partyprint.co.il',
  };
}
