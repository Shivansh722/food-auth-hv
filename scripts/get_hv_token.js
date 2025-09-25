#!/usr/bin/env node
// Dev helper: Exchange appId + appKey for an access token
// Usage: node scripts/get_hv_token.js <appId> <appKey> [expirySeconds]

const https = require('https');

const [,, appId, appKey, expiry='3600'] = process.argv;
if (!appId || !appKey) {
  console.error('Usage: node scripts/get_hv_token.js <appId> <appKey> [expirySeconds]');
  process.exit(2);
}

const data = JSON.stringify({ appId, appKey, expiry: Number(expiry) });

const options = {
  hostname: 'auth.hyperverge.co',
  port: 443,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (parsed && parsed.result && parsed.result.token) {
        console.log(parsed.result.token);
      } else {
        console.error('Unexpected response:', body);
        process.exit(3);
      }
    } catch (err) {
      console.error('Failed to parse response:', body);
      process.exit(4);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
  process.exit(5);
});

req.write(data);
req.end();
