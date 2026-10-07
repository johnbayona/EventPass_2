import {test} from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml,safeImage,canEnroll,filterEvents,notificationWarning,dateLabel} from '../frontend/utils.js';
import {post,ApiError,endpoint} from '../frontend/api.js';
const event={fecha:'2099-01-01',hora:'14:30',estado:'PUBLICADO',acepta_inscripciones:true,cupos_disponibles:2,nombre:'Tienda virtual',descripcion:'Aprende ventas',lugar:'Bogotá',categoria:'Emprendimiento'};
test('Contenido remoto se escapa antes de interpolarse',()=>assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
test('Solo se aceptan imágenes HTTPS',()=>{assert.equal(safeImage('javascript:alert(1)'),'');assert.equal(safeImage('http://example.test/x.png'),'');assert.equal(safeImage('https://example.test/x.png'),'https://example.test/x.png');});
test('Solo eventos publicados y futuros admiten inscripción',()=>{assert.equal(canEnroll(event),true);assert.equal(canEnroll({...event,estado:'CANCELADO'}),false);assert.equal(canEnroll({...event,fecha:'2000-01-01'}),false);assert.equal(canEnroll({...event,acepta_inscripciones:false}),false);});
test('Búsqueda y cupos filtran datos reales',()=>{assert.equal(filterEvents([event],{query:'VENTAS',availableOnly:true}).length,1);assert.equal(filterEvents([{...event,cupos_disponibles:0}],{availableOnly:true}).length,0);});
test('Fecha usa zona Colombia',()=>assert.match(dateLabel(event),/2099/));
test('Fallo de notificaciones se distingue del éxito de la inscripción',()=>{assert.equal(notificationWarning([{gmail_estado:'ENVIADO',telegram_estado:'ERROR'}]),true);assert.equal(notificationWarning([{gmail_estado:'ENVIADO',telegram_estado:'ENVIADO'}]),false);});
test('POST transmite JSON y Bearer sin cookies',async()=>{
 let captured;const data=await post('https://n8n.test/a',{operacion:'consultar'},{token:'TOKEN',fetchImpl:async(url,opts)=>{captured=opts;return {ok:true,status:200,json:async()=>({ok:true,usuario:{nombre:'Ana'}})};}});
 assert.equal(captured.headers.Authorization,'Bearer TOKEN');assert.equal(captured.credentials,'omit');assert.equal(JSON.parse(captured.body).operacion,'consultar');assert.equal(data.usuario.nombre,'Ana');
});
test('POST transforma error de validación en ApiError',async()=>{await assert.rejects(post('https://n8n.test/a',{}, {fetchImpl:async()=>({ok:false,status:409,json:async()=>({ok:false,mensaje:'Email duplicado'})})}),e=>e instanceof ApiError&&e.status===409&&e.message==='Email duplicado');});
test('Errores 500 no revelan mensajes internos',async()=>{await assert.rejects(post('https://n8n.test/a',{}, {fetchImpl:async()=>({ok:false,status:500,json:async()=>({ok:false,mensaje:'SECRET_STACK'})})}),e=>!e.message.includes('SECRET_STACK'));});
test('Respuesta no JSON no se trata como éxito',async()=>{await assert.rejects(post('https://n8n.test/a',{}, {fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw new Error('HTML');}})}),ApiError);});
test('Error de red es visible sin reintentar mutaciones',async()=>{let count=0;await assert.rejects(post('https://n8n.test/a',{}, {fetchImpl:async()=>{count++;throw new TypeError('Failed');}}),ApiError);assert.equal(count,1);});
test('Timeout cancela la solicitud y pide verificar resultado',async()=>{
 await assert.rejects(post('https://n8n.test/a',{}, {timeout:10,fetchImpl:async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('Abort'),{name:'AbortError'}))))}),e=>e.message.includes('Revisa su resultado'));
});
test('Sin configuración el endpoint no inventa un backend',()=>assert.throws(()=>endpoint('usuarios'),ApiError));
