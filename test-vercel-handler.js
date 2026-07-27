require('reflect-metadata');
const http = require('http');

async function main() {
  const handlerModule = require('./api/index.ts');
  const handler = handlerModule.default || handlerModule;

  const server = http.createServer((req, res) => handler(req, res));

  await new Promise((resolve) => server.listen(9999, resolve));
  console.log('Test server listening on 9999');

  const body = JSON.stringify({ email: 'test@example.com', password: 'wrongpass' });
  const res = await fetch('http://127.0.0.1:9999/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const text = await res.text();
  console.log('STATUS', res.status, 'BODY', text);

  server.close();
}

main().catch((err) => {
  console.error('HANDLER TEST FAILED:', err);
  process.exit(1);
});
