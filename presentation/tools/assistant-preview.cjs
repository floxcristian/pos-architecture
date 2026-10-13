/* Adapt the same Web Request handler used by Vercel to the loopback preview.
 * Local runs remain unavailable: the production WAF cannot be bypassed here. */
'use strict';
const {Readable} = require('node:stream');

async function serveAssistant(request, response) {
  const abort = new AbortController();
  response.once('close', () => { if (!response.writableEnded) abort.abort(); });
  try {
    const {default: handler} = await import('../../api/assistant.mjs');
    const origin = `http://127.0.0.1:${request.socket.localPort}`;
    const options = {method:request.method, headers:request.headers, signal:abort.signal};
    if (!['GET','HEAD'].includes(request.method)) {
      options.body = Readable.toWeb(request);
      options.duplex = 'half';
    }
    const result = await handler.fetch(new Request(new URL(request.url, origin), options));
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(await result.text());
  } catch {
    if (!response.headersSent) response.writeHead(503, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
    response.end(JSON.stringify({error:'UNAVAILABLE',message:'El asistente no está configurado en esta vista local.'}));
  }
}
module.exports = {serveAssistant};
