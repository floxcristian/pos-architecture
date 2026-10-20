/* Local parity server for the generated public/ output. Never serves the repository root. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {serveAssistant} = require('./assistant-preview.cjs');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'public');
const configuration = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png', '.mp4':'video/mp4', '.vtt':'text/vtt; charset=utf-8', '.srt':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.json':'application/json', '.ico':'image/x-icon'};
types['.mp3'] = 'audio/mpeg';
Object.assign(types, {'.wasm':'application/wasm', '.woff':'font/woff', '.woff2':'font/woff2', '.webp':'image/webp', '.avif':'image/avif', '.excalidraw':'application/json', '.zip':'application/zip'});

function servePublic(port = Number(process.env.POS_PUBLIC_PORT || 4199)) {
  if (!fs.statSync(output).isDirectory() || fs.lstatSync(output).isSymbolicLink()) throw new Error('Build public/ before previewing it');
  const server = http.createServer((request, response) => {
    let pathname, requestUrl;
    try { requestUrl = new URL(request.url, 'http://localhost'); pathname = decodeURIComponent(requestUrl.pathname); }
    catch { response.writeHead(400); return response.end(); }
    for (const item of configuration.headers || []) {
      const matches = item.source.endsWith('(.*)') ? pathname.startsWith(item.source.slice(0, -4)) : item.source === pathname;
      if (matches) for (const header of item.headers) response.setHeader(header.key, header.value);
    }
    if (pathname === '/api/assistant') { void serveAssistant(request, response); return; }
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405); return response.end(); }
    const redirect = configuration.redirects?.find(item => item.source === pathname);
    if (redirect) { response.writeHead(307, {Location:redirect.destination}); return response.end(); }
    pathname = configuration.rewrites?.find(item => item.source === pathname)?.destination || pathname;
    let file = path.resolve(output, '.' + pathname);
    const relative = path.relative(output, file);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) {
      response.writeHead(404); return response.end();
    }
    let stat;
    try {
      stat = fs.statSync(file);
      if (stat.isDirectory()) {
        if (!pathname.endsWith('/')) { response.writeHead(308, {Location: pathname + '/' + requestUrl.search}); return response.end(); }
        file = path.join(file, 'index.html');
        stat = fs.statSync(file);
      }
      const real = path.relative(fs.realpathSync(output), fs.realpathSync(file));
      if (!stat.isFile() || real.startsWith('..') || path.isAbsolute(real)) throw new Error('Outside output');
    } catch { response.writeHead(404); return response.end(); }
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.setHeader('Accept-Ranges', 'bytes');
    let start = 0, end = stat.size - 1;
    if (request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!match || (!match[1] && !match[2])) { response.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); return response.end(); }
      if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
        response.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); return response.end();
      }
      response.statusCode = 206;
      response.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    }
    response.setHeader('Content-Length', end - start + 1);
    if (request.method === 'HEAD') return response.end();
    const stream = fs.createReadStream(file, {start, end});
    response.once('close', () => stream.destroy());
    stream.once('error', () => response.destroy());
    stream.pipe(response);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (require.main === module) servePublic().then(server => console.log(`Public output: http://127.0.0.1:${server.address().port}/video`));
module.exports = {servePublic};
