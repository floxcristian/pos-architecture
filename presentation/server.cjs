// Servidor de previsualización local. Expone solo presentation/ y docs/.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const docs = path.resolve(root, '..', 'docs');
const port = Number(process.env.POS_ATLAS_PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mmd':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
const server = http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let url;
  try{url=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
  const isDocs=url.startsWith('/docs/');
  const base=isDocs?docs:root;
  const suffix=isDocs?url.slice(6):url==='/'?'index.html':url.replace(/^\/presentation\//,'').replace(/^\//,'');
  const file=path.resolve(base,suffix);
  const relative=path.relative(base,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)||!types[path.extname(file).toLowerCase()]||relative.split(path.sep).some(x=>x.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    fs.realpath(file,(realErr,real)=>{
      const relReal=realErr?'..':path.relative(base,real);
      if(realErr||relReal.startsWith('..')||path.isAbsolute(relReal)){res.writeHead(403);res.end('Forbidden');return;}
      res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()],'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
      if(req.method==='HEAD'){res.end();return;}
      const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
    });
  });
});
server.on('error',err=>{console.error(`No se pudo abrir la vista local: ${err.message}`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`POS Atlas: http://127.0.0.1:${port}`));
