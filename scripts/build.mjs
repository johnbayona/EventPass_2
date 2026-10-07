import fs from 'node:fs';
import path from 'node:path';
import {root,getConfig,configModule} from './config.mjs';
const config=getConfig();
if(!config.n8nBaseUrl)console.warn('Sin VITE_N8N_BASE_URL: la interfaz compila, pero no podrá consultar n8n.');
for(const url of [config.n8nBaseUrl,config.chatUrl,...Object.values(config.endpoints)].filter(Boolean)){
  const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw new Error('La configuración debe usar HTTP/HTTPS');
  if(parsed.username||parsed.password)throw new Error('No incluyas credenciales en URLs públicas');
}
const dist=path.join(root,'dist');
fs.rmSync(dist,{recursive:true,force:true});
fs.cpSync(path.join(root,'frontend'),dist,{recursive:true});
fs.writeFileSync(path.join(dist,'config.js'),configModule());
console.log('Frontend construido en dist/. Configuración pública incorporada.');
