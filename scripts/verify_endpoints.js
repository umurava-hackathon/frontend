#!/usr/bin/env node
// Simple endpoint verifier: node scripts/verify_endpoints.js <url>
const http = require('http');
const https = require('https');

function request(url, method = 'POST', body = '{}', headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    };

    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node scripts/verify_endpoints.js <url>');
    process.exit(2);
  }

  try {
    console.log('POST', url);
    const r = await request(url, 'POST', '{}', { 'Origin': 'https://aishortlist-app.vercel.app' });
    console.log('Status:', r.statusCode);
    console.log('Headers:', r.headers);
    console.log('Body:', r.body);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
