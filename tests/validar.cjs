// Pruebas sin credenciales ni envíos: ejecutan los Code nodes con Sheets simuladas.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const files=fs.readdirSync(path.join(root,'n8n')).filter(f=>f.endsWith('.json')).sort();
const workflows=files.map(f=>JSON.parse(fs.readFileSync(path.join(root,'n8n',f),'utf8')));
const schemas=JSON.parse(fs.readFileSync(path.join(root,'docs','esquemas.json'),'utf8'));
let passed=0;
function test(name,fn){fn();passed++;console.log('OK '+name);}
function mockMap(data){return name=>({first:()=>({json:(data[name]||[{}])[0]}),all:()=>(data[name]||[{}]).map(json=>({json})),isExecuted:name in data});}
function runNode(wf,name,data,input=[{}]){
 const code=wf.nodes.find(n=>n.name===name)?.parameters.jsCode;
 assert.ok(code,'No existe Code node '+name);
 return new Function('$','$input','require','Buffer',code)(mockMap(data),{first:()=>({json:input[0]}),all:()=>input.map(json=>({json}))},require,Buffer).map(x=>x.json);
}
function run(number,request,db={},overrides={}){
 const wf=workflows[number-1];
 const cfg=runNode(wf,'Configuración',{},[{body:request}])[0];
 Object.assign(cfg,overrides);
 const data={'Configuración':[cfg]};
 for(const [s,v] of Object.entries(db))data['Leer '+s]=v;
 return runNode(wf,'Reglas de negocio',data)[0];
}
function apply(plan,db){
 for(const [sheet,list] of Object.entries(plan.writes||{})){
  const key=schemas[sheet].columnas[0];db[sheet]||=[];
  for(const row of list){const i=db[sheet].findIndex(x=>x[key]===row[key]);if(i<0)db[sheet].push(row);else db[sheet][i]=row;}
 }
}
const future=new Date(Date.now()+20*3600000);
// Fecha/hora Bogotá para que eventTime use -05:00.
function atBogota(date){const d=new Date(date.getTime()-5*3600000);return {fecha:d.toISOString().slice(0,10),hora:d.toISOString().slice(11,16)};}
const event={evento_id:'EVT1',nombre:'Tienda virtual',categoria:'Emprendimiento',descripcion:'Aprende a crear tu tienda',...atBogota(future),lugar:'Bogotá',capacidad:1,imagen_url:'',organizador:'Emprende365',estado:'PUBLICADO',fecha_creacion:new Date().toISOString(),fecha_actualizacion:new Date().toISOString()};
const db={Usuarios:[],Sesiones:[],Vinculaciones:[],Eventos:[event],Inscripciones:[],Recordatorios:[],Notificaciones:[],Codigos_Vinculacion:[]};
let user,token,registration,linkCode;
test('10 workflows inactivos, sin credenciales, nombres y conexiones válidos',()=>{
 assert.equal(workflows.length,10);
 for(const wf of workflows){assert.equal(wf.active,false);const names=new Set(wf.nodes.map(n=>n.name));assert.equal(names.size,wf.nodes.length);const ids=new Set(wf.nodes.map(n=>n.id));assert.equal(ids.size,wf.nodes.length);
  for(const nd of wf.nodes){assert.ok(!nd.credentials);if(nd.type==='n8n-nodes-base.code')new Function('$','$input','require','Buffer',nd.parameters.jsCode);}
  for(const [from,types] of Object.entries(wf.connections)){assert.ok(names.has(from));for(const outputs of Object.values(types))for(const list of outputs)for(const edge of list)assert.ok(names.has(edge.node));}
 }
});
test('Crear: email normalizado, hash+salt, respuesta sin secretos',()=>{
 const p=run(1,{operacion:'crear',nombre:'Ana Emprende',email:' ANA@EXAMPLE.TEST ',password:'Prueba-Solo-2026!'},db);
 assert.equal(p.status,201);const u=p.writes.Usuarios[0];assert.equal(u.email_normalizado,'ana@example.test');assert.equal(u.password_hash.length,128);assert.equal(u.password_salt.length,64);assert.ok(!JSON.stringify(p.response).includes('password'));apply(p,db);user=u;
});
test('Crear repetido devuelve 409 sin una segunda fila',()=>{const p=run(1,{operacion:'crear',nombre:'Ana Emprende',email:'ANA@example.test',password:'Prueba-Solo-2026!'},db);assert.equal(p.status,409);assert.ok(!p.writes.Usuarios);});
test('Contraseña corta rechazada',()=>{assert.equal(run(1,{operacion:'crear',nombre:'Persona',email:'b@example.test',password:'123'},db).status,400);});
test('Consultar sin sesión no revela usuario',()=>{assert.equal(run(1,{operacion:'consultar',usuario_id:user.usuario_id},db).status,401);});
test('Login incorrecto devuelve error genérico',()=>{assert.equal(run(2,{operacion:'login',email:'ana@example.test',password:'Incorrecta-2026!'},db).status,401);});
test('Login correo inexistente no autentica',()=>{assert.equal(run(2,{operacion:'login',email:'nadie@example.test',password:'Prueba-Solo-2026!'},db).status,401);});
test('Login correcto emite sesión aleatoria',()=>{const p=run(2,{operacion:'login',email:'ana@example.test',password:'Prueba-Solo-2026!'},db);assert.equal(p.status,200);token=p.response.session_token;assert.equal(token.length,64);apply(p,db);});
test('Consultar autenticado oculta hash y salt',()=>{const p=run(1,{operacion:'consultar',session_token:token},db);assert.equal(p.status,200);assert.equal(p.response.usuario.usuario_id,user.usuario_id);assert.ok(!JSON.stringify(p.response).includes('password'));});
test('La sesión no permite consultar otro usuario',()=>{assert.equal(run(1,{operacion:'consultar',session_token:token,usuario_id:'OTRO'},db).status,403);});
test('Bearer también funciona',()=>{assert.equal(run(1,{operacion:'consultar'},db,{headers:{authorization:'Bearer '+token}}).status,200);});
test('Actualizar conserva hash, salt y estado',()=>{const p=run(1,{operacion:'actualizar',session_token:token,nombre:'Ana Actualizada',estado:'INACTIVO',password_hash:'ataque'},db);assert.equal(p.status,200);assert.equal(p.writes.Usuarios[0].password_hash,user.password_hash);assert.equal(p.writes.Usuarios[0].estado,'ACTIVO');apply(p,db);});
test('Actualizar rechaza email de otro usuario',()=>{db.Usuarios.push({...user,usuario_id:'USR2',email_normalizado:'otra@example.test'});assert.equal(run(1,{operacion:'actualizar',session_token:token,email:'otra@example.test'},db).status,409);});
test('Actualizar rechaza nombre vacío',()=>{assert.equal(run(1,{operacion:'actualizar',session_token:token,nombre:''},db).status,400);});
test('Inscribirse requiere Telegram',()=>{assert.equal(run(6,{operacion:'crear',session_token:token,evento_id:'EVT1'},db).status,409);});
test('Código de Telegram requiere sesión',()=>{assert.equal(run(3,{operacion:'generar_codigo'},db).status,401);});
test('Generar código temporal',()=>{const p=run(3,{operacion:'generar_codigo',session_token:token},db);assert.equal(p.status,200);linkCode=p.response.codigo;assert.equal(linkCode.length,12);apply(p,db);});
test('Vinculación desde chat privado',()=>{const p=run(3,{text:'/vincular '+linkCode},db,{mode:'telegram',chat_id:'123456',chat_type:'private',telegram_username:'demo'});assert.equal(p.status,200);assert.equal(p.writes.Codigos_Vinculacion[0].estado,'USADO');apply(p,db);});
test('Código usado no se puede reutilizar',()=>{assert.equal(run(3,{text:'/vincular '+linkCode},db,{mode:'telegram',chat_id:'123456',chat_type:'private'}).status,400);});
test('Bot rechaza vinculación en grupo',()=>{assert.equal(run(3,{text:'/vincular '+linkCode},db,{mode:'telegram',chat_id:'123456',chat_type:'group'}).status,400);});
test('Código expirado queda EXPIRADO sin vinculación',()=>{
 const c={codigo_id:'CEX',usuario_id:user.usuario_id,codigo:'ABCDEFABCDEF',creado_en:'2000-01-01T00:00:00Z',expira_en:'2000-01-01T00:01:00Z',estado:'PENDIENTE',usado_en:''};
 const p=run(3,{text:'/vincular ABCDEFABCDEF'},{...db,Codigos_Vinculacion:[c]},{mode:'telegram',chat_id:'123456',chat_type:'private'});assert.equal(p.status,400);assert.equal(p.writes.Codigos_Vinculacion[0].estado,'EXPIRADO');assert.ok(!p.writes.Vinculaciones);
});
test('Crear inscripción confirma un cupo y prepara notificación',()=>{const p=run(6,{operacion:'crear',session_token:token,evento_id:'EVT1'},db);assert.equal(p.status,201);assert.equal(p.response.inscripcion.estado,'CONFIRMADA');assert.equal(p.notifications.length,1);registration=p.response.inscripcion;apply(p,db);});
test('Reintentar inscripción es idempotente',()=>{const p=run(6,{operacion:'crear',session_token:token,evento_id:'EVT1'},db);assert.equal(p.response.idempotente,true);assert.ok(!p.writes.Inscripciones);});
test('Consultar inscripciones solo devuelve propias',()=>{db.Inscripciones.push({...registration,inscripcion_id:'INS_OTRA',usuario_id:'OTRO',evento_id:'OTRO_EVENTO'});const p=run(6,{operacion:'consultar',session_token:token},db);assert.equal(p.response.inscripciones.length,1);});
test('Otro usuario no puede cancelar la inscripción',()=>{assert.equal(run(6,{operacion:'cancelar',session_token:token,inscripcion_id:'INS_OTRA'},db).status,404);});
test('Actualizar inscripción no puede cambiar estado o propietario',()=>{const p=run(6,{operacion:'actualizar',session_token:token,inscripcion_id:registration.inscripcion_id,nombre_acreditacion:'Ana Entrada',estado:'CANCELADA'},db);assert.equal(p.response.inscripcion.estado,'CONFIRMADA');apply(p,db);});
test('Catálogo calcula cupos a partir de confirmadas',()=>{const p=run(5,{operacion:'detalle',evento_id:'EVT1'},db);assert.equal(p.response.evento.cupos_disponibles,0);assert.equal(p.writes.Consultas_Catalogo[0].status_http,200);});
test('Catálogo no publica BORRADOR; sí informa cancelados',()=>{const p=run(5,{operacion:'listado'},{...db,Eventos:[{...event,estado:'BORRADOR'},{...event,evento_id:'CANCEL',estado:'CANCELADO'}]});assert.equal(p.response.total,1);assert.equal(p.response.eventos[0].acepta_inscripciones,false);});
test('Filtro por categoría',()=>{assert.equal(run(5,{operacion:'filtro',categoria:'Educación'},db).response.total,0);});
test('Evento inexistente en catálogo devuelve 404 y registra consulta',()=>{const p=run(5,{operacion:'detalle',evento_id:'NO'},db);assert.equal(p.status,404);assert.equal(p.writes.Consultas_Catalogo[0].status_http,404);});
test('Evento cancelado no acepta inscripciones',()=>{assert.equal(run(6,{operacion:'crear',session_token:token,evento_id:'EVT1'},{...db,Eventos:[{...event,estado:'CANCELADO'}]}).status,409);});
test('Evento pasado no acepta inscripciones',()=>{assert.equal(run(6,{operacion:'crear',session_token:token,evento_id:'EVT1'},{...db,Eventos:[{...event,fecha:'2000-01-01'}]}).status,409);});
test('Cancelar libera cupo sin borrar físicamente',()=>{const p=run(6,{operacion:'cancelar',session_token:token,inscripcion_id:registration.inscripcion_id},db);assert.equal(p.response.inscripcion.estado,'CANCELADA');apply(p,db);assert.equal(run(5,{operacion:'detalle',evento_id:'EVT1'},db).response.evento.cupos_disponibles,1);});
test('Repetir cancelación no notifica dos veces',()=>{const p=run(6,{operacion:'cancelar',session_token:token,inscripcion_id:registration.inscripcion_id},db);assert.equal(p.response.idempotente,true);assert.equal(p.notifications.length,0);});
test('Lista de espera respeta FIFO aunque filas estén desordenadas',()=>{
 const queue=[{...registration,inscripcion_id:'INS_NUEVA',usuario_id:'USR2',estado:'LISTA_ESPERA',fecha_inscripcion:'2026-10-06T12:00:00Z'},{...registration,inscripcion_id:'INS_ANTIGUA',estado:'LISTA_ESPERA',fecha_inscripcion:'2026-10-06T11:00:00Z'}];
 const p=run(7,{},{...db,Inscripciones:queue,Vinculaciones:[...db.Vinculaciones,{usuario_id:'USR2',estado:'ACTIVA',chat_id:'987'}]});assert.equal(p.writes.Inscripciones.length,1);assert.equal(p.writes.Inscripciones[0].inscripcion_id,'INS_ANTIGUA');assert.equal(p.writes.Inscripciones[0].estado,'CONFIRMADA');
});
test('Nuevos usuarios no saltan una cola con cupo libre',()=>{const q={...registration,usuario_id:'USR2',inscripcion_id:'QUEUE',estado:'LISTA_ESPERA'};const p=run(6,{operacion:'crear',session_token:token,evento_id:'EVT1'},{...db,Inscripciones:[q]});assert.equal(p.response.inscripcion.estado,'LISTA_ESPERA');});
test('Evento lleno envía a lista de espera',()=>{const p=run(6,{operacion:'crear',session_token:token,evento_id:'EVT1'},{...db,Inscripciones:[{...registration,usuario_id:'USR2',inscripcion_id:'LLENO',estado:'CONFIRMADA'}]});assert.equal(p.response.inscripcion.estado,'LISTA_ESPERA');});
test('Recordatorio solo a confirmados, con clave estable',()=>{const p=run(8,{},{...db,Inscripciones:[{...registration,estado:'CONFIRMADA'}]});assert.equal(p.notifications.length,1);assert.equal(p.writes.Recordatorios[0].estado,'PENDIENTE');assert.equal(p.writes.Recordatorios[0].clave_idempotencia,user.usuario_id+'|EVT1|ANTES_24H');});
test('Recordatorio ENVIADO no se repite',()=>{const p=run(8,{},{...db,Inscripciones:[{...registration,estado:'CONFIRMADA'}],Recordatorios:[{clave_idempotencia:user.usuario_id+'|EVT1|ANTES_24H',estado:'ENVIADO'}]});assert.equal(p.notifications.length,0);});
test('Recordatorio PENDIENTE no se reenvía automáticamente',()=>{const p=run(8,{},{...db,Inscripciones:[{...registration,estado:'CONFIRMADA'}],Recordatorios:[{clave_idempotencia:user.usuario_id+'|EVT1|ANTES_24H',estado:'PENDIENTE'}]});assert.equal(p.notifications.length,0);});
test('Recordatorio no se programa para eventos cancelados',()=>{const p=run(8,{},{...db,Eventos:[{...event,estado:'CANCELADO'}],Inscripciones:[{...registration,estado:'CONFIRMADA'}]});assert.equal(p.notifications.length,0);});
test('Notificación prepara ambos canales',()=>{const p=run(9,{usuario_id:user.usuario_id,tipo:'PRUEBA',titulo:'Hola',mensaje:'Prueba',clave_idempotencia:'KEY'},db);assert.equal(p.sendGmail,true);assert.equal(p.sendTelegram,true);});
test('Canal ENVIADO se conserva y solo se reintenta canal ERROR',()=>{const p=run(9,{usuario_id:user.usuario_id,tipo:'PRUEBA',titulo:'Hola',mensaje:'Prueba',clave_idempotencia:'KEY'},{...db,Notificaciones:[{notificacion_id:'N',clave_idempotencia:'KEY',gmail_estado:'ENVIADO',telegram_estado:'ERROR'}]});assert.equal(p.sendGmail,false);assert.equal(p.sendTelegram,true);});
test('Notificación PENDIENTE ambigua no se reenvía',()=>{const p=run(9,{usuario_id:user.usuario_id,tipo:'PRUEBA',titulo:'Hola',mensaje:'Prueba',clave_idempotencia:'KEY'},{...db,Notificaciones:[{notificacion_id:'N',clave_idempotencia:'KEY',gmail_estado:'PENDIENTE',telegram_estado:'PENDIENTE'}]});assert.equal(p.sendGmail,false);assert.equal(p.sendTelegram,false);});
test('Gmail falla pero Telegram sigue y se registran separados',()=>{
 const wf=workflows[8];const p=run(9,{usuario_id:user.usuario_id,tipo:'PRUEBA',titulo:'Hola',mensaje:'Prueba'},db);
 const g=runNode(wf,'Resultado Gmail',{'Reglas de negocio':[p]},[{error:'OAuth inválido'}])[0];
 const final=runNode(wf,'Consolidar canales',{'Reglas de negocio':[p],'Resultado Gmail':[g]},[{ok:true,result:{message_id:123}}])[0];
 assert.equal(final.response.gmail_estado,'ERROR');assert.equal(final.response.telegram_estado,'ENVIADO');assert.equal(final.response.ok,false);
});
test('Form UPDATE impide bajar capacidad por debajo de confirmados',()=>{assert.equal(run(4,{operacion:'UPDATE',evento_id:'EVT1',capacidad:1},{...db,Inscripciones:[{...registration,estado:'CONFIRMADA'},{...registration,inscripcion_id:'OTRA',estado:'CONFIRMADA'}]}).status,409);});
test('Form CREATE rechaza fecha inválida',()=>{assert.equal(run(4,{...event,operacion:'CREATE',fecha:'2026-02-30'},db).status,400);});
test('Form CANCEL cancela evento e inscripciones y notifica',()=>{const p=run(4,{operacion:'CANCEL',evento_id:'EVT1'},{...db,Inscripciones:[{...registration,estado:'CONFIRMADA'}]});assert.equal(p.writes.Eventos[0].estado,'CANCELADO');assert.equal(p.writes.Inscripciones[0].estado,'CANCELADA');assert.equal(p.notifications.length,1);});
test('Sesión expirada queda registrada como EXPIRADA',()=>{const p=run(2,{operacion:'validar',session_token:token},{...db,Sesiones:[{...db.Sesiones[0],expira_en:'2000-01-01T00:00:00Z'}]});assert.equal(p.status,401);assert.equal(p.writes.Sesiones[0].estado,'EXPIRADA');});
test('Chat no confía en usuario_id del cliente ni accede a escrituras de negocio',()=>{
 const wf=workflows[9];const cfg=runNode(wf,'Configuración',{},[{chatInput:'¿Qué eventos hay?',sessionId:'DEMO',usuario_id:user.usuario_id}])[0];
 const p=runNode(wf,'Preparar contexto',{'Configuración':[cfg],'Leer Eventos':[event,{...event,estado:'BORRADOR'}],'Leer Conversaciones':[],'Leer Mensajes':[]})[0];
 assert.equal(p.events.length,1);const final=runNode(wf,'Reglas de negocio',{'Preparar contexto':[p]},[{text:'Puedes consultar el catálogo.'}])[0];assert.equal(final.writes.Mensajes.length,2);assert.equal(final.writes.Conversaciones[0].usuario_id,'');assert.deepEqual(Object.keys(final.writes).sort(),['Conversaciones','Mensajes']);
});
test('Desactivar bloquea sesiones existentes',()=>{const p=run(1,{operacion:'desactivar',session_token:token},db);assert.equal(p.status,200);apply(p,db);assert.equal(run(2,{operacion:'validar',session_token:token},db).status,401);});
test('Usuario inactivo no puede iniciar sesión',()=>{assert.equal(run(2,{operacion:'login',email:'ana@example.test',password:'Prueba-Solo-2026!'},db).status,401);});
test('Logout cierra la sesión sin borrarla',()=>{const p=run(2,{operacion:'logout',session_token:token},db);apply(p,db);assert.equal(db.Sesiones[0].estado,'CERRADA');});
console.log('\n'+passed+' pruebas superadas. No se probaron importación real, OAuth, red, Docker ni envíos.');
