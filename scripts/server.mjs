import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {root,configModule} from './config.mjs';
const preview=process.argv.includes('--dist');
const directory=path.join(root,preview?'dist':'frontend');
const port=Number(process.env.PORT||5173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
if(preview&&!fs.existsSync(directory))throw new Error('Ejecuta npm run build antes de npm run preview');
http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!preview && pathname==='/config.js'){res.writeHead(200,{'Content-Type':mime['.js'],'Cache-Control':'no-store'});res.end(configModule());return;}
    const file=path.resolve(directory,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(directory+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('No encontrado');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
  }catch{res.writeHead(400);res.end('Solicitud inválida');}
}).listen(port,'127.0.0.1',()=>console.log('EventPass: http://localhost:'+port+(preview?' (build)':' (desarrollo)')));
