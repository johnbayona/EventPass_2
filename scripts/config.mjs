import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function getConfig(){
  const values={};
  const file=path.join(root,'.env');
  if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const m=line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$/);
    if(m){let v=m[2];if(/^(['"]).*\1$/.test(v))v=v.slice(1,-1);values[m[1]]=v;}
  }
  const get=k=>process.env[k]??values[k]??'';
  return {
    n8nBaseUrl:get('VITE_N8N_BASE_URL').replace(/\/+$/,''),
    chatUrl:get('VITE_EVENTPASS_CHAT_URL'),
    telegramBotUsername:get('VITE_TELEGRAM_BOT_USERNAME').replace(/^@/,''),
    endpoints:{usuarios:get('VITE_USUARIOS_URL'),auth:get('VITE_AUTH_URL'),telegram:get('VITE_TELEGRAM_URL'),catalogo:get('VITE_CATALOGO_URL'),inscripciones:get('VITE_INSCRIPCIONES_URL'),checkin:get('VITE_CHECKIN_URL')}
  };
}
export function configModule(){return 'export default '+JSON.stringify(getConfig(),null,2)+';\n';}
