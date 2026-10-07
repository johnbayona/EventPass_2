// E2E del frontend con respuestas simuladas. No envía correo ni llama n8n real.
// Requiere Playwright opcional y npm run dev en otro terminal.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let linked=false,failCatalog=false,registered=false,logged=false;
let user={usuario_id:'USR_TEST',nombre:'Ana Emprende',email_normalizado:'ana@example.test',estado:'ACTIVO',fecha_registro:'2026-10-01T12:00:00Z'};
const registrations=[];const calls=[];
const categories=['Emprendimiento','Emprendimiento','Educación','Educación','Networking','Networking'];
const events=categories.map((categoria,i)=>({evento_id:'EVT_'+i,nombre:['Crea tu tienda virtual','Mentoría de negocios','Finanzas para emprender','Marketing digital','Encuentro de aliados','Ronda comercial'][i],categoria,descripcion:'Un encuentro para construir y aprender con la comunidad.',fecha:'2099-11-12',hora:'15:00',lugar:'Bogotá',capacidad:10,imagen_url:'',organizador:'Emprende365',estado:i===3?'CANCELADO':i===5?'CERRADO':'PUBLICADO',cupos_disponibles:i===1?0:10,acepta_inscripciones:![3,5].includes(i)}));
await page.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:"export default {n8nBaseUrl:'https://n8n.test',chatUrl:'https://n8n.test/chat',telegramBotUsername:'eventpass_demo_bot',endpoints:{}};"}));
await page.route('https://n8n.test/**',async route=>{
 const req=route.request();const body=req.postDataJSON();const domain=new URL(req.url()).pathname.split('/').pop();calls.push({domain,body,headers:req.headers()});
 let data={ok:true};let status=200;
 if(domain==='catalogo'){
  if(failCatalog){status=503;data={ok:false,mensaje:'Fallo simulado'};}
  else if(body.operacion==='detalle')data={ok:true,evento:events.find(e=>e.evento_id===body.evento_id)};
  else data={ok:true,eventos:body.categoria?events.filter(e=>e.categoria===body.categoria):events};
 }
 if(domain==='usuarios'){
  if(body.operacion==='crear'){registered=true;user={...user,nombre:body.nombre,email_normalizado:body.email};status=201;data={ok:true,usuario:user};}
  if(body.operacion==='consultar')data={ok:true,usuario:user};
  if(body.operacion==='actualizar'){user={...user,nombre:body.nombre,email_normalizado:body.email};data={ok:true,usuario:user};}
 }
 if(domain==='auth'){
  if(body.operacion==='login'){logged=true;data={ok:true,session_token:'TEST_SESSION',usuario:user};}
  if(body.operacion==='validar')data={ok:true,usuario:user};
  if(body.operacion==='logout')logged=false;
 }
 if(domain==='telegram')data=body.operacion==='generar_codigo'?{ok:true,codigo:'ABCDEF123456',expira_en:'2099-11-12T18:00:00Z'}:{ok:true,vinculado:linked,telegram_username:linked?'ana_test':''};
 if(domain==='inscripciones'){
  if(body.operacion==='crear'){const r={inscripcion_id:'INS_'+registrations.length,usuario_id:user.usuario_id,evento_id:body.evento_id,estado:body.evento_id==='EVT_1'?'LISTA_ESPERA':'CONFIRMADA',nombre_acreditacion:user.nombre,observaciones:'',fecha_inscripcion:new Date().toISOString()};registrations.push(r);data={ok:true,inscripcion:r,notificaciones:[{gmail_estado:'ENVIADO',telegram_estado:'ERROR'}]};}
  if(body.operacion==='consultar')data={ok:true,inscripciones:registrations};
  if(body.operacion==='actualizar'){const r=registrations.find(x=>x.inscripcion_id===body.inscripcion_id);Object.assign(r,{nombre_acreditacion:body.nombre_acreditacion,observaciones:body.observaciones});data={ok:true,inscripcion:r};}
  if(body.operacion==='cancelar'){const r=registrations.find(x=>x.inscripcion_id===body.inscripcion_id);r.estado='CANCELADA';data={ok:true,inscripcion:r};}
 }
 if(domain==='chat')data={output:'Puedes explorar los eventos. <img src=x onerror="alert(1)">'};
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data),headers:{'Access-Control-Allow-Origin':'*'}});
});
async function go(hash){await page.goto('http://localhost:5173/'+hash);}
const screenshotDir=process.env.SCREENSHOT_DIR||'';if(screenshotDir)fs.mkdirSync(screenshotDir,{recursive:true});
try{
 await go('#/');await page.locator('#home-events .event-card').first().waitFor();assert.equal(await page.locator('#home-events .event-card').count(),3);
 if(screenshotDir)await page.screenshot({path:screenshotDir+'/inicio-desktop.png',fullPage:true});
 await page.getByRole('link',{name:'Explorar eventos',exact:true}).click();await page.locator('#catalog-grid .event-card').first().waitFor();assert.equal(await page.locator('.event-card').count(),6);
 await page.locator('#category-filter').selectOption('Educación');await page.waitForFunction(()=>document.querySelectorAll('.event-card').length===2);assert.ok(calls.some(c=>c.body.operacion==='filtro'&&c.body.categoria==='Educación'));
 await page.locator('#event-search').fill('NO_EXISTE');await page.getByRole('button',{name:'Limpiar filtros'}).click();await page.waitForFunction(()=>document.querySelectorAll('.event-card').length===6);
 await page.locator('#available-filter').check();assert.equal(await page.locator('.event-card').count(),3);
 await page.getByRole('link',{name:'Crear cuenta',exact:false}).first().click();
 await page.locator('input[name=nombre]').fill('Ana Emprende');await page.locator('input[name=email]').fill('ana@example.test');await page.locator('input[name=password]').fill('Solo-Prueba-2026!');await page.locator('input[name=confirm_password]').fill('Distinta-Prueba-2026!');
 await page.getByRole('button',{name:'Crear mi cuenta',exact:false}).click();await page.getByRole('alert').filter({hasText:'Las contraseñas no coinciden'}).waitFor();assert.equal(registered,false);
 await page.locator('input[name=confirm_password]').fill('Solo-Prueba-2026!');await page.getByRole('button',{name:'Crear mi cuenta',exact:false}).click();await page.getByRole('heading',{name:'Ingresa a EventPass'}).waitFor();assert.equal(registered,true);
 await page.locator('input[name=email]').fill('ana@example.test');await page.locator('input[name=password]').fill('Solo-Prueba-2026!');await page.getByRole('button',{name:'Ingresar',exact:false}).click();await page.getByRole('heading',{name:'Tu perfil',exact:true}).waitFor();assert.equal(logged,true);
 await page.locator('input[name=nombre]').fill('Ana Actualizada');await page.getByRole('button',{name:'Guardar cambios',exact:false}).click();await page.waitForFunction(()=>document.querySelector('.nav-profile')?.textContent.includes('Ana'));assert.equal(user.nombre,'Ana Actualizada');
 await go('#/evento/EVT_0');await page.getByRole('button',{name:'Reservar mi lugar',exact:false}).click();await page.getByRole('heading',{name:'Tus eventos, también en Telegram.'}).waitFor();assert.equal(registrations.length,0);
 await page.getByRole('button',{name:'Generar mi código',exact:false}).click();await page.locator('#link-code code').waitFor();assert.match(await page.locator('#link-code code').textContent(),/\/vincular ABCDEF123456/);
 linked=true;await page.getByRole('button',{name:'Comprobar vinculación',exact:false}).click();await page.getByRole('heading',{name:'Ya estás conectado'}).waitFor();
 await go('#/evento/EVT_0');await page.getByRole('button',{name:'Reservar mi lugar',exact:false}).click();await page.locator('.registration-card').waitFor();assert.equal(registrations.length,1);await page.locator('.toast').filter({hasText:'uno de los avisos no pudo enviarse'}).waitFor();
 assert.ok(calls.some(c=>c.domain==='inscripciones'&&c.headers.authorization==='Bearer TEST_SESSION'));
 await page.locator('.registration-edit summary').click();await page.locator('input[name=nombre_acreditacion]').fill('Ana para entrada');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.waitForTimeout(100);assert.equal(registrations[0].nombre_acreditacion,'Ana para entrada');
 await page.getByRole('button',{name:'Cancelar inscripción',exact:true}).click();await page.locator('#confirm-accept').click();await page.locator('.registration-card .status').filter({hasText:'Cancelada'}).waitFor();assert.equal(registrations[0].estado,'CANCELADA');
 await page.getByRole('button',{name:'Abrir asistente EventPass'}).click();await page.locator('#chat-input').fill('¿Qué eventos hay?');await page.getByRole('button',{name:'Enviar pregunta'}).click();await page.locator('.bubble.assistant').filter({hasText:'Puedes explorar los eventos.'}).waitFor();assert.equal(await page.locator('#chat-messages img').count(),0);await page.getByRole('button',{name:'Cerrar asistente'}).click();
 await go('#/evento/EVT_1');await page.getByRole('button',{name:'Unirme a la lista de espera',exact:false}).click();await page.locator('.registration-card .status').filter({hasText:'Lista de espera'}).waitFor();assert.equal(registrations[1].estado,'LISTA_ESPERA');
 await page.getByRole('button',{name:'Salir',exact:true}).click();await page.getByRole('link',{name:'Ingresar',exact:true}).waitFor();assert.equal(logged,false);assert.equal(await page.evaluate(()=>sessionStorage.getItem('ep_token')),null);
 failCatalog=true;await go('#/');await page.getByRole('heading',{name:'El catálogo está temporalmente no disponible'}).waitFor();assert.equal(await page.locator('.event-card').count(),0);
 failCatalog=false;await page.getByRole('button',{name:'Volver a intentar'}).click();await page.locator('.event-card').first().waitFor();
 await page.setViewportSize({width:390,height:844});await go('#/');await page.locator('.event-card').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow móvil');
 if(screenshotDir)await page.screenshot({path:screenshotDir+'/inicio-movil.png',fullPage:true});
 await page.getByRole('button',{name:'Abrir menú'}).click();await page.getByRole('link',{name:'Explorar eventos',exact:true}).click();await page.locator('#catalog-grid .event-card').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow catálogo móvil');
 assert.deepEqual(errors,[]);console.log('E2E OK: catálogo, filtros, registro, login, perfil, Telegram simulado, inscripción, edición, cancelación, espera, chat seguro, logout, error/red y móvil.');
}finally{await browser.close();}
