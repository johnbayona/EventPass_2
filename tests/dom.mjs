// Integración del DOM en memoria con API simulada; no verifica diseño visual ni n8n.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.JSDOM_MODULE||'jsdom');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dom=new JSDOM(fs.readFileSync(path.join(root,'frontend/index.html'),'utf8'),{url:'http://localhost:5173/#/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;w.scrollTo=()=>{};
w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
w.HTMLDialogElement.prototype.close=function(value='no'){this.returnValue=value;this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
let linked=false,failCatalog=false,user={usuario_id:'U1',nombre:'Ana Prueba',email_normalizado:'ana@example.test',estado:'ACTIVO',fecha_registro:'2026-10-06T10:00:00Z'};
const regs=[],calls=[];
const events=[{evento_id:'E1',nombre:'Crea tu tienda',categoria:'Emprendimiento',descripcion:'Aprende a construir una tienda virtual.',fecha:'2099-01-01',hora:'14:00',lugar:'Bogotá',capacidad:10,cupos_disponibles:10,estado:'PUBLICADO',acepta_inscripciones:true,organizador:'Comunidad'},{evento_id:'E2',nombre:'Conecta con aliados',categoria:'Networking',descripcion:'Comparte tu proyecto.',fecha:'2099-01-02',hora:'14:00',lugar:'Bogotá',capacidad:1,cupos_disponibles:0,estado:'PUBLICADO',acepta_inscripciones:true,organizador:'Comunidad'}];
w.fetch=async(url,opts)=>{
 const body=JSON.parse(opts.body);const domain=new URL(url).pathname.split('/').pop();calls.push({domain,body,headers:opts.headers});let status=200,data={ok:true};
 if(domain==='catalogo'){
  if(failCatalog){status=503;data={ok:false,mensaje:'Fallo de prueba'};}
  else data=body.operacion==='detalle'?{ok:true,evento:events.find(e=>e.evento_id===body.evento_id)}:{ok:true,eventos:body.categoria?events.filter(e=>e.categoria===body.categoria):events};
 }
 if(domain==='usuarios'){
  if(body.operacion==='crear'){status=201;data={ok:true,usuario:user};}
  if(body.operacion==='consultar')data={ok:true,usuario:user};
  if(body.operacion==='actualizar'){user={...user,nombre:body.nombre,email_normalizado:body.email};data={ok:true,usuario:user};}
 }
 if(domain==='auth')data=body.operacion==='login'?{ok:true,usuario:user,session_token:'TEST_TOKEN'}:body.operacion==='validar'?{ok:true,usuario:user}:{ok:true};
 if(domain==='telegram')data=body.operacion==='generar_codigo'?{ok:true,codigo:'ABCDEF123456',expira_en:'2099-01-01T00:00:00Z'}:{ok:true,vinculado:linked};
 if(domain==='inscripciones'){
  if(body.operacion==='consultar')data={ok:true,inscripciones:regs};
  if(body.operacion==='crear'){const r={inscripcion_id:'I'+regs.length,evento_id:body.evento_id,estado:body.evento_id==='E2'?'LISTA_ESPERA':'CONFIRMADA',nombre_acreditacion:user.nombre,observaciones:'',fecha_inscripcion:new Date().toISOString()};regs.push(r);data={ok:true,inscripcion:r,notificaciones:[{gmail_estado:'ENVIADO',telegram_estado:'ERROR'}]};}
  if(body.operacion==='actualizar'){const r=regs.find(x=>x.inscripcion_id===body.inscripcion_id);r.nombre_acreditacion=body.nombre_acreditacion;r.observaciones=body.observaciones;data={ok:true,inscripcion:r};}
  if(body.operacion==='cancelar'){const r=regs.find(x=>x.inscripcion_id===body.inscripcion_id);r.estado='CANCELADA';data={ok:true,inscripcion:r};}
 }
 if(domain==='chat')data={output:'Respuesta informativa <img src=x onerror="alert(1)">'};
 return {ok:status<400,status,json:async()=>data};
};
const source=name=>fs.readFileSync(path.join(root,'frontend',name),'utf8').replace(/^import .*;\n/gm,'').replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const))/g,'');
w.eval("const config={n8nBaseUrl:'https://n8n.test',chatUrl:'https://n8n.test/chat',telegramBotUsername:'demo',endpoints:{}};\n"+source('utils.js')+'\nconst esc=escapeHtml;\n'+source('api.js')+'\n'+source('app.js'));
async function wait(condition){for(let i=0;i<100;i++){if(condition())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Timeout DOM: '+d.querySelector('#view').textContent.slice(0,180));}
async function go(route){if(w.location.hash==='#'+route)w.dispatchEvent(new w.HashChangeEvent('hashchange'));else w.location.hash=route;await new Promise(r=>setTimeout(r,25));}
function fill(name,value,form=d){const input=form.querySelector('input[name="'+name+'"]');assert.ok(input,name);input.value=value;}
function submit(form){form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
let passed=0;function ok(label){passed++;console.log('DOM OK '+label);}
try{
 await wait(()=>d.querySelectorAll('.event-card').length===2);d.querySelector('.skip').click();assert.equal(d.activeElement.id,'contenido');assert.equal(w.location.hash,'#/');ok('Inicio carga catálogo y enlace accesible conserva ruta');
 await go('/eventos');await wait(()=>d.querySelector('#category-filter'));d.querySelector('#category-filter').value='Networking';d.querySelector('#category-filter').dispatchEvent(new w.Event('change',{bubbles:true}));await wait(()=>d.querySelectorAll('.event-card').length===1);assert.ok(calls.some(c=>c.body.categoria==='Networking'));ok('Categoría consulta WF05');
 d.querySelector('#event-search').value='NO_EXISTE';d.querySelector('#event-search').dispatchEvent(new w.Event('input',{bubbles:true}));await wait(()=>d.querySelector('[data-action=clear-filters]'));d.querySelector('[data-action=clear-filters]').click();await wait(()=>d.querySelectorAll('.event-card').length===2);ok('Limpiar filtros recupera catálogo');
 await go('/registro');const register=d.querySelector('form[data-form=registro]');fill('nombre','Ana Prueba',register);fill('email','ana@example.test',register);fill('password','Solo-Prueba-2026!',register);fill('confirm_password','Distinta-2026!',register);submit(register);await wait(()=>!register.querySelector('.form-error').hidden);assert.equal(calls.filter(c=>c.body.operacion==='crear'&&c.domain==='usuarios').length,0);ok('Contraseña distinta no envía registro');
 fill('confirm_password','Solo-Prueba-2026!',register);submit(register);await wait(()=>d.querySelector('form[data-form=login]'));ok('Registro conduce a login');
 const login=d.querySelector('form[data-form=login]');fill('email','ana@example.test',login);fill('password','Solo-Prueba-2026!',login);submit(login);await wait(()=>d.querySelector('form[data-form=perfil]'));assert.equal(w.sessionStorage.getItem('ep_token'),'TEST_TOKEN');ok('Login conserva sesión de pestaña');
 const profile=d.querySelector('form[data-form=perfil]');fill('nombre','Ana Actualizada',profile);submit(profile);await wait(()=>user.nombre==='Ana Actualizada');ok('Perfil actualiza nombre');
 await go('/evento/E1');await wait(()=>d.querySelector('[data-action=enroll]'));d.querySelector('[data-action=enroll]').click();await wait(()=>d.querySelector('[data-action=generate-code]'));assert.equal(regs.length,0);ok('Reserva sin Telegram redirige a vinculación');
 d.querySelector('[data-action=generate-code]').click();await wait(()=>d.querySelector('#link-code code'));assert.match(d.querySelector('#link-code code').textContent,/ABCDEF123456/);linked=true;d.querySelector('[data-action=check-link]').click();await wait(()=>d.querySelector('.connection-card h2')?.textContent.includes('Ya estás conectado'));ok('Código y comprobación de Telegram');
 await go('/evento/E1');await wait(()=>d.querySelector('[data-action=enroll]'));d.querySelector('[data-action=enroll]').click();await wait(()=>d.querySelector('.registration-card'));assert.equal(regs.length,1);assert.ok(calls.some(c=>c.domain==='inscripciones'&&c.headers.Authorization==='Bearer TEST_TOKEN'));assert.ok(d.querySelector('#toasts').textContent.includes('uno de los avisos no pudo enviarse'));ok('Reserva con sesión y aviso de fallo parcial');
 const edit=d.querySelector('form[data-form=editar-inscripcion]');fill('nombre_acreditacion','Nombre entrada',edit);submit(edit);await wait(()=>regs[0].nombre_acreditacion==='Nombre entrada');ok('Edición de inscripción');
 d.querySelector('[data-action=cancel-registration]').click();await wait(()=>d.querySelector('#confirm-dialog').open);d.querySelector('#confirm-dialog').close('yes');await wait(()=>d.querySelector('.registration-card .status')?.textContent==='Cancelada');ok('Cancelación con confirmación');
 await go('/evento/E2');await wait(()=>d.querySelector('[data-action=enroll]'));assert.ok(d.querySelector('[data-action=enroll]').textContent.includes('lista de espera'));d.querySelector('[data-action=enroll]').click();await wait(()=>d.querySelectorAll('.registration-card').length===2);assert.equal(regs[1].estado,'LISTA_ESPERA');ok('Evento lleno entra a espera');
 d.querySelector('#chat-toggle').click();d.querySelector('#chat-input').value='¿Qué eventos hay?';submit(d.querySelector('#chat-form'));await wait(()=>d.querySelector('#chat-messages').textContent.includes('Respuesta informativa'));assert.equal(d.querySelectorAll('#chat-messages img').length,0);ok('Chat presenta texto sin ejecutar HTML');
 d.querySelector('[data-action=logout]').click();await wait(()=>!w.sessionStorage.getItem('ep_token'));ok('Logout limpia token');
 failCatalog=true;await go('/');await wait(()=>d.querySelector('.inline-error'));assert.equal(d.querySelectorAll('.event-card').length,0);failCatalog=false;d.querySelector('[data-action=retry]').click();await wait(()=>d.querySelectorAll('.event-card').length===2);ok('Error de servicio y recuperación sin datos ficticios');
 console.log(passed+' recorridos DOM superados. API simulada; sin navegador real, diseño visual ni servicios externos.');
}finally{w.close();}
