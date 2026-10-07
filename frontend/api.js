import config from './config.js';
export const CONFIG=config;
const paths={usuarios:'usuarios',auth:'auth',telegram:'telegram',catalogo:'catalogo',inscripciones:'inscripciones'};
export class ApiError extends Error{constructor(message,status=0){super(message);this.name='ApiError';this.status=status;}}
export function endpoint(domain){
  const override=config.endpoints?.[domain];
  const raw=override||(config.n8nBaseUrl?config.n8nBaseUrl.replace(/\/+$/,'')+'/webhook/eventpass/'+paths[domain]:'');
  try{const url=new URL(raw);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error();return url.href;}
  catch{throw new ApiError('El servicio no está disponible en este momento. Intenta más tarde.');}
}
export async function post(url,payload,{token='',timeout=45000,fetchImpl=fetch}={}){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const headers={'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '+token;
    const result=await fetchImpl(url,{method:'POST',headers,body:JSON.stringify(payload),signal:controller.signal,cache:'no-store',credentials:'omit'});
    let data;try{data=await result.json();}catch{throw new ApiError('El servicio devolvió una respuesta inesperada. Intenta nuevamente.',result.status);}
    if(Array.isArray(data)&&data.length===1)data=data[0];
    if(!result.ok||data?.ok===false){const message=result.status>=500?'No pudimos completar la solicitud. Intenta nuevamente.':data?.mensaje||'No pudimos completar la solicitud.';throw new ApiError(message,result.status);}
    if(!data||typeof data!=='object')throw new ApiError('La respuesta del servicio no es válida.',result.status);
    return data;
  }catch(e){
    if(e instanceof ApiError)throw e;
    if(e.name==='AbortError')throw new ApiError('La solicitud tardó más de lo esperado. Revisa su resultado antes de repetirla.');
    throw new ApiError('No pudimos conectar con el servicio. Revisa tu conexión e intenta nuevamente.');
  }finally{clearTimeout(timer);}
}
export function request(domain,payload,token=''){return post(endpoint(domain),payload,{token});}
export async function askAssistant(message,sessionId){
  if(!config.chatUrl)throw new ApiError('El asistente está temporalmente fuera de servicio. Puedes consultar el catálogo y tu perfil.');
  const data=await post(config.chatUrl,{action:'sendMessage',sessionId,chatInput:message});
  const answer=data.output||data.text||data.response?.output;
  if(typeof answer!=='string')throw new ApiError('El asistente no pudo responder. Intenta nuevamente.');
  return answer;
}
