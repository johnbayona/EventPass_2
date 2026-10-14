import fs from 'node:fs';
import path from 'node:path';
import {root} from './config.mjs';
const base=process.argv[2];
if(!base)throw new Error('Uso: node scripts/configurar-local.mjs http://localhost:5678');
const u=new URL(base);
if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Usa solo el origen de n8n, sin /webhook ni credenciales');
const file=path.join(root,'.env');const previous=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
const values={};for(const line of previous.split(/\r?\n/)){const m=line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$/);if(m)values[m[1]]=m[2];}
values.VITE_N8N_BASE_URL=u.origin;
values.VITE_FRONTEND_URL='http://localhost:5173';
for(const key of ['USUARIOS','AUTH','TELEGRAM','CATALOGO','INSCRIPCIONES','CHECKIN'])values['VITE_'+key+'_URL']='';
values.VITE_EVENTPASS_CHAT_URL||='';values.VITE_TELEGRAM_BOT_USERNAME||='';
const backup=file+'.backup-'+Date.now();if(previous)fs.writeFileSync(backup,previous,{flag:'wx'});
fs.writeFileSync(file,'# Configuración local: usa webhooks de producción de workflows publicados.\n'+Object.entries(values).map(([k,v])=>k+'='+v).join('\n')+'\n');
console.log('Actualizado .env. Backup anterior: '+(previous?path.basename(backup):'no existía .env'));
console.log('Se conservaron chat y bot. Verifica que el chat use su Production URL. Reinicia npm run dev.');
