const https = require('https');
const FIRECRAWL_KEY = process.env.FIRECRAWL_FIRECRAWL_API_KEY;

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : https;
    const req = lib.request({
      hostname: u.hostname, port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function testFirecrawl() {
  if (!FIRECRAWL_KEY) {
    console.error('Missing FIRECRAWL_FIRECRAWL_API_KEY');
    return;
  }
  
  console.log('Testing Firecrawl with google.com');
  try {
    const res = await request('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_KEY}`,
        'Content-Type': 'application/json',
      },
    }, {
      url: 'https://google.com',
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 15000,
    });
    
    console.log('Firecrawl status:', res.status);
    if (res.status === 200 && res.body?.data) {
      console.log('Firecrawl raw output length:', res.body.data.markdown.length);
      console.log('Successfully scraped google.com');
    } else {
      console.error('Firecrawl failed to scrape google.com:', JSON.stringify(res.body));
    }
  } catch (e) {
    console.error('Firecrawl test error:', e.message);
  }
}

testFirecrawl().catch(console.error);
