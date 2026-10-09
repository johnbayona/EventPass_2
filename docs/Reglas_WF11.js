const ctx=$('Configuración').first().json, req=ctx.request;
const rows=name=>$('Leer '+name).all().map(x=>x.json).filter(x=>x && Object.keys(x).some(k=>k!=='row_number'));
const now=new Date().toISOString();
const clean=v=>typeof v==='string'?v.trim().slice(0,120):'';
const iid=clean(req?.inscripcion_id),eid=clean(req?.evento_id);
const log={checkin_id:'CHK_'+$('Generar ID').first().json.uuid,inscripcion_id:iid,evento_id:eid,usuario_id:'',fecha_checkin:now,resultado:'RECHAZADO',detalle:''};
let status=400,response={},update=null,notification=null;
function reject(s,m){const e=new Error(m);e.status=s;throw e;}
try {
 if(!req||Array.isArray(req)||typeof req!=='object'||!iid||!eid)reject(400,'Envía inscripcion_id y evento_id');
 const token=String(ctx.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
 const session=rows('Sesiones').find(x=>token && x.session_token===token && x.estado==='ACTIVA' && Date.parse(x.expira_en)>Date.now());
 const user=session && rows('Usuarios').find(x=>x.usuario_id===session.usuario_id && x.estado==='ACTIVO');
 if(!user)reject(401,'Inicia sesión nuevamente');
 const matches=rows('Inscripciones').filter(x=>x.inscripcion_id===iid);
 if(!matches.length)reject(404,'Inscripción inexistente');
 if(matches.length!==1)reject(409,'ID de inscripción repetido en Sheets; requiere revisión');
 const r=matches[0];
 if(r.usuario_id!==user.usuario_id)reject(403,'Solo puedes registrar tu propia asistencia');
 log.usuario_id=r.usuario_id;
 const events=rows('Eventos').filter(x=>x.evento_id===eid);
 if(!events.length)reject(404,'Evento inexistente');
 if(events.length!==1)reject(409,'ID de evento repetido en Sheets; requiere revisión');
 const event=events[0];
 if(r.evento_id!==eid)reject(409,'La inscripción pertenece a otro evento');
 const previous=rows('Checkins').find(x=>x.inscripcion_id===iid && x.resultado==='EXITOSO');
 if(previous || r.estado==='ASISTIO') {
  log.resultado='DUPLICADO';log.detalle='El ingreso ya había sido registrado';
  status=200;response={ok:true,resultado:'DUPLICADO',mensaje:log.detalle,checkin_id:previous?.checkin_id||null,inscripcion_id:iid,evento_id:eid};
  if(!previous || r.estado!=='ASISTIO')response.advertencia='Datos parciales: revisar Checkins e Inscripciones antes de continuar';
 } else {
  if(r.estado!=='CONFIRMADA')reject(409,'La inscripción debe estar CONFIRMADA; estado actual: '+r.estado);
  if(['CANCELADO','BORRADOR'].includes(event.estado))reject(409,'El evento no permite asistencia');
  if(!ctx.config.workflowNotificaciones || ctx.config.workflowNotificaciones.includes('SELECCIONAR'))reject(503,'Configura WF09 antes de registrar asistencia');
  log.resultado='EXITOSO';log.detalle='Ingreso validado; CONFIRMADA → ASISTIO';
  update={inscripcion_id:iid,estado:'ASISTIO',fecha_actualizacion:now};
  notification={usuario_id:r.usuario_id,tipo:'CHECKIN',titulo:'Ingreso registrado: '+event.nombre,mensaje:'Tu asistencia fue registrada correctamente.',evento_id:eid,inscripcion_id:iid,clave_idempotencia:'CHECKIN|'+iid};
  status=201;response={ok:true,resultado:'EXITOSO',mensaje:'Check-in realizado correctamente',checkin_id:log.checkin_id,inscripcion_id:iid,evento_id:eid,fecha_checkin:now,estado:'ASISTIO'};
 }
} catch(e) {status=e.status||500;log.detalle=e.status?e.message:'Error interno de validación';response={ok:false,resultado:'RECHAZADO',mensaje:log.detalle};update=null;notification=null;}
return [{json:{log,status,response,update,notification}}];