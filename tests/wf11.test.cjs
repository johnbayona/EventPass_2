const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),test=require('node:test');
const w=JSON.parse(fs.readFileSync('n8n/WF11_checkin_digital.json','utf8'));
const code=w.nodes.find(n=>n.name==='Validar check-in').parameters.jsCode;
function run(opts={}){
 const tables={Usuarios:[{usuario_id:'U1',estado:'ACTIVO'}],Sesiones:[{usuario_id:'U1',session_token:'t',estado:'ACTIVA',expira_en:'2099-01-01'}],Eventos:[{evento_id:'E1',nombre:'Taller',estado:'PUBLICADO'},{evento_id:'E2',estado:'PUBLICADO'}],Inscripciones:[{inscripcion_id:'I1',usuario_id:'U1',evento_id:'E1',estado:'CONFIRMADA'}],Checkins:[],...opts.tables};
 const ctx={config:{workflowNotificaciones:'wf9'},request:{inscripcion_id:'I1',evento_id:'E1',...opts.req},headers:{authorization:'Bearer t',...opts.headers}};
 const $=name=>({first:()=>({json:name==='Configuración'?ctx:{uuid:'uuid'}}),all:()=>tables[name.replace('Leer ','')].map(json=>({json}))});
 return vm.runInNewContext('(function(){'+code+'})()',{$,Date,Error})[0].json;
}
test('Confirmada cambia solo su ID, genera éxito y aviso estable',()=>{let p=run();assert.equal(p.status,201);assert.equal(p.update.inscripcion_id,'I1');assert.equal(p.update.estado,'ASISTIO');assert.equal(p.notification.clave_idempotencia,'CHECKIN|I1');});
test('Segundo intento conserva datos, registra DUPLICADO y no avisa',()=>{let p=run({tables:{Checkins:[{inscripcion_id:'I1',resultado:'EXITOSO',checkin_id:'C1'}],Inscripciones:[{inscripcion_id:'I1',usuario_id:'U1',evento_id:'E1',estado:'ASISTIO'}]}});assert.equal(p.log.resultado,'DUPLICADO');assert.equal(p.update,null);assert.equal(p.notification,null);});
for(const estado of ['CANCELADA','LISTA_ESPERA','OTRO'])test('Rechaza '+estado,()=>{let p=run({tables:{Inscripciones:[{inscripcion_id:'I1',usuario_id:'U1',evento_id:'E1',estado}]}});assert.equal(p.status,409);assert.equal(p.log.resultado,'RECHAZADO');assert.equal(p.update,null);});
test('Evento diferente existente',()=>assert.equal(run({req:{evento_id:'E2'}}).status,409));
test('Evento inexistente',()=>assert.equal(run({req:{evento_id:'E9'}}).status,404));
test('Inscripción inexistente',()=>assert.equal(run({req:{inscripcion_id:'I9'}}).status,404));
test('Sin sesión',()=>assert.equal(run({headers:{authorization:''}}).status,401));
test('Otra persona',()=>assert.equal(run({tables:{Inscripciones:[{inscripcion_id:'I1',usuario_id:'U2',evento_id:'E1',estado:'CONFIRMADA'}]}}).status,403));
test('ASISTIO sin historial no crea nuevo éxito y avisa inconsistencia',()=>{let p=run({tables:{Inscripciones:[{inscripcion_id:'I1',usuario_id:'U1',evento_id:'E1',estado:'ASISTIO'}]}});assert.equal(p.log.resultado,'DUPLICADO');assert.ok(p.response.advertencia);});
test('Campos vacíos',()=>assert.equal(run({req:{inscripcion_id:''}}).status,400));
test('No hay nodos desconectados ni referencias inexistentes',()=>{const names=new Set(w.nodes.map(n=>n.name));let seen=new Set();function walk(n){if(seen.has(n))return;seen.add(n);for(const branch of w.connections[n]?.main||[])for(const edge of branch){assert.ok(names.has(edge.node));walk(edge.node);}}walk('Webhook');assert.equal(seen.size,names.size);});
test('WF09 no requiere módulos y sus lecturas se ejecutan una vez',()=>{const nine=JSON.parse(fs.readFileSync('n8n/WF09_notificaciones.json'));assert.ok(!JSON.stringify(nine).includes("require('crypto')"));for(const n of nine.nodes.filter(n=>n.type.endsWith('googleSheets')&&n.parameters.operation==='read'))assert.equal(n.executeOnce,true);});
