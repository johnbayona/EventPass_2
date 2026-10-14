export function validateConfig(config,{production=false}={}){
 const paths={usuarios:'usuarios',auth:'auth',telegram:'telegram',catalogo:'catalogo',inscripciones:'inscripciones',checkin:'checkin'};
 for(const [key,path] of Object.entries(paths)){
  const raw=config.endpoints?.[key] || (config.n8nBaseUrl && config.n8nBaseUrl+'/webhook/eventpass/'+path);
  if(!raw){if(production)throw new Error('Falta URL de '+key);continue;}
  check(raw,key,production);
 }
 if(config.chatUrl)check(config.chatUrl,'chat',production);
 else if(production)throw new Error('Falta VITE_EVENTPASS_CHAT_URL');
 if(production&&!config.telegramBotUsername)throw new Error('Falta VITE_TELEGRAM_BOT_USERNAME');
}
function check(raw,key,production){
 const u=new URL(raw);
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('URL pública inválida: '+key);
 if(production&&(u.protocol!=='https:'||['localhost','127.0.0.1','[::1]'].includes(u.hostname)||u.pathname.includes('webhook-test')||u.pathname.includes('chat-test')))throw new Error('Producción requiere HTTPS público y URL de producción: '+key);
}
