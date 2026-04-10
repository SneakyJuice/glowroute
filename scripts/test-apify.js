const https = require('https');

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : https;
    const req = lib.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function test() {
  const APIFY_KEY = process.env.APIFY_APIFY_API_KEY;
  console.log('Key exists:', !!APIFY_KEY);
  
  // Test getting actor info
  const info = await request(
    `https://api.apify.com/v2/acts/compass~crawler-google-places?token=${APIFY_KEY}`,
    { method: 'GET' }
  );
  console.log('Actor info status:', info.status);
  console.log('Actor info body:', JSON.stringify(info.body, null, 2));
}

test().catch(console.error);