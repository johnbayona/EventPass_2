const SCHEMAS={"Usuarios": ["usuario_id", "nombre", "email_normalizado", "password_hash", "password_salt", "estado", "fecha_registro", "fecha_actualizacion"], "Auditoria_Usuarios": ["auditoria_id", "usuario_id", "accion", "fecha", "resultado", "detalle"], "Sesiones": ["session_id", "usuario_id", "session_token", "creada_en", "expira_en", "estado", "cerrada_en", "ultima_validacion"], "Codigos_Vinculacion": ["codigo_id", "usuario_id", "codigo", "creado_en", "expira_en", "estado", "usado_en"], "Vinculaciones": ["vinculacion_id", "usuario_id", "chat_id", "telegram_username", "fecha_vinculacion", "estado"], "Eventos": ["evento_id", "nombre", "categoria", "descripcion", "fecha", "hora", "lugar", "capacidad", "imagen_url", "organizador", "estado", "fecha_creacion", "fecha_actualizacion"], "Auditoria_Eventos": ["auditoria_id", "evento_id", "accion", "fecha", "resultado", "detalle"], "Consultas_Catalogo": ["consulta_id", "fecha", "tipo", "evento_id", "categoria", "resultado_count", "visitor_id", "status_http"], "Inscripciones": ["inscripcion_id", "usuario_id", "evento_id", "estado", "fecha_inscripcion", "fecha_actualizacion", "nombre_acreditacion", "observaciones", "origen", "orden_espera"], "Auditoria_Inscripciones": ["auditoria_id", "inscripcion_id", "usuario_id", "evento_id", "accion", "estado_anterior", "estado_nuevo", "fecha", "resultado", "detalle"], "Reasignaciones": ["reasignacion_id", "evento_id", "inscripcion_id", "usuario_id", "fecha", "orden_lista", "estado_anterior", "estado_nuevo", "resultado_notificacion"], "Recordatorios": ["recordatorio_id", "usuario_id", "evento_id", "inscripcion_id", "tipo_recordatorio", "fecha_programada", "fecha_envio", "estado", "clave_idempotencia"], "Notificaciones": ["notificacion_id", "usuario_id", "tipo", "titulo", "mensaje", "evento_id", "inscripcion_id", "fecha", "gmail_estado", "telegram_estado", "gmail_error", "telegram_error", "clave_idempotencia"], "Conversaciones": ["conversation_id", "usuario_id", "visitor_id", "fecha_inicio", "fecha_ultima_interaccion", "estado"], "Mensajes": ["message_id", "conversation_id", "usuario_id", "visitor_id", "rol", "mensaje", "timestamp"]};
const operationUuid = $('Generar ID operación').first().json.operacion_uuid;
let idCounter = 0;
if (!operationUuid) throw new Error('Falta el UUID de Generar ID operación');
const ctx = $('Configuración').first().json;
const req = ctx.request || {};
const cfg = ctx.config;
const now = new Date();
const iso = now.toISOString();
const writes = {};
const notifications = [];
let status = 200;
let response = {};
function rows(sheet) {
  return $('Leer ' + sheet).all().map(x => x.json).filter(x => x && Object.keys(x).some(k => k !== 'row_number'));
}
function id(prefix) { return prefix + '_' + operationUuid + '_' + (++idCounter); }
function put(sheet, row) {
  const cols = SCHEMAS[sheet];
  const clean = {};
  for (const k of cols) clean[k] = row[k] === undefined || row[k] === null ? '' : row[k];
  (writes[sheet] ||= []).push(clean);
  return clean;
}
function fail(code, message) { const e = new Error(message); e.http = code; throw e; }
function text(value, name, min=1, max=200) {
  if (typeof value !== 'string') fail(400, name + ' debe ser texto');
  const s = value.trim();
  if (s.length < min || s.length > max) fail(400, name + ' tiene una longitud inválida');
  return s;
}
function email(value) {
  const s = text(value, 'email', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail(400, 'Email inválido');
  return s;
}
function number(value, name, min=0, max=100000) {
  if (value === '' || value === null || value === undefined || typeof value === 'boolean') fail(400, name + ' es obligatorio');
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) fail(400, name + ' inválido');
  return n;
}
function publicUser(u) {
  const { usuario_id, nombre, email_normalizado, estado, fecha_registro, fecha_actualizacion } = u;
  return { usuario_id, nombre, email_normalizado, estado, fecha_registro, fecha_actualizacion };
}
function token() {
  return String(ctx.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim() || String(req.session_token || '').trim();
}
function auth() {
  const t = token();
  if (!t) fail(401, 'Sesión requerida');
  const s = rows('Sesiones').find(x => x.session_token === t);
  if (!s || s.estado !== 'ACTIVA' || !Number.isFinite(Date.parse(s.expira_en)) || Date.parse(s.expira_en) <= now.getTime()) fail(401, 'Sesión inválida o expirada');
  const u = rows('Usuarios').find(x => x.usuario_id === s.usuario_id && x.estado === 'ACTIVO');
  if (!u) fail(401, 'Usuario inactivo o inexistente');
  if (req.usuario_id && req.usuario_id !== u.usuario_id) fail(403, 'No puedes acceder al perfil de otra persona');
  return { user:u, session:s };
}
function linked(uid) { return rows('Vinculaciones').find(x => x.usuario_id === uid && x.estado === 'ACTIVA'); }
function eventTime(e) {
  const s = String(e.fecha) + 'T' + String(e.hora).slice(0,5) + ':00' + cfg.eventTimezoneOffset;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) fail(400, 'Fecha u hora del evento inválida');
  return t;
}
function activeRegistration(r) { return ['CONFIRMADA','LISTA_ESPERA'].includes(r.estado); }
function available(e, registrations) {
  return Math.max(0, Number(e.capacidad) - registrations.filter(r => r.evento_id === e.evento_id && r.estado === 'CONFIRMADA').length);
}
function notify(uid, type, title, message, eid='', iid='', key='') {
  notifications.push({usuario_id:uid,tipo:type,titulo:title,mensaje:message,evento_id:eid,inscripcion_id:iid,clave_idempotencia:key || [uid,type,eid,iid,iso].join('|')});
}
function auditUser(uid, action, detail) {
  put('Auditoria_Usuarios',{auditoria_id:id('AUD'),usuario_id:uid,accion:action,fecha:iso,resultado:'EXITOSO',detalle:detail});
}
function auditRegistration(r, action, previous) {
  put('Auditoria_Inscripciones',{auditoria_id:id('AUD'),inscripcion_id:r.inscripcion_id,usuario_id:r.usuario_id,evento_id:r.evento_id,accion:action,estado_anterior:previous,estado_nuevo:r.estado,fecha:iso,resultado:'EXITOSO',detalle:'Operación validada en n8n'});
}
function result() { return [{json:{writes,notifications,status,response,mode:ctx.mode,chat_id:ctx.chat_id || ''}}]; }

try {
  const op=String(req.operacion||'').toUpperCase();
  const all=rows('Eventos');
  const old=op==='CREATE'?undefined:all.find(x=>x.evento_id===req.evento_id);
  if(op==='READ') {
    if(req.evento_id && !old) fail(404,'Evento no encontrado');
    response={ok:true,eventos:req.evento_id?[old]:all};
  } else {
    if(!['CREATE','UPDATE','CANCEL','CLOSE'].includes(op)) fail(400,'Operación permitida: CREATE, READ, UPDATE, CANCEL, CLOSE');
    if(op!=='CREATE' && !old) fail(404,'Evento no encontrado');
    if(old && rows('Inscripciones').some(r=>r.evento_id===old.evento_id && activeRegistration(r)) && (!cfg.workflowNotificaciones || cfg.workflowNotificaciones.startsWith('SELECCIONAR_'))) fail(409,'Configura WF09 antes de modificar un evento con inscripciones activas');
    let e;
    if(op==='CREATE' || op==='UPDATE') {
      const get=k=>(req[k]!==undefined && req[k]!=='')?req[k]:old?.[k];
      const categoria=text(get('categoria'),'categoria',2,80).toUpperCase();
      if(categoria!=='EMPRENDIMIENTO') fail(400,'La categoría debe ser EMPRENDIMIENTO');
      const state=String(get('estado')||'BORRADOR').toUpperCase();
      if(!['BORRADOR','PUBLICADO','CERRADO','CANCELADO'].includes(state)) fail(400,'Estado inválido');
      e={evento_id:old?.evento_id||id('EVT'),nombre:text(get('nombre'),'nombre',3,150),categoria,descripcion:text(get('descripcion'),'descripcion',5,3000),fecha:text(get('fecha'),'fecha',10,10),hora:text(get('hora'),'hora',5,5),lugar:text(get('lugar'),'lugar',3,200),capacidad:number(get('capacidad'),'capacidad',1),imagen_url:String(get('imagen_url')||''),organizador:text(get('organizador'),'organizador',2,150),estado:state,fecha_creacion:old?.fecha_creacion||iso,fecha_actualizacion:iso};
      if(!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.hora)) fail(400,'Usa fecha AAAA-MM-DD y hora HH:mm');
      const parsedDate=new Date(e.fecha+'T12:00:00Z');
      if(!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0,10)!==e.fecha) fail(400,'Fecha de calendario inválida');
      if(e.imagen_url && !/^https:\/\//i.test(e.imagen_url)) fail(400,'imagen_url debe ser HTTPS');
      if(state==='PUBLICADO' && eventTime(e)<=now.getTime()) fail(400,'Un evento publicado debe tener fecha futura');
      const confirmed=rows('Inscripciones').filter(r=>r.evento_id===e.evento_id && r.estado==='CONFIRMADA').length;
      if(e.capacidad<confirmed) fail(409,'Capacidad inferior a inscripciones confirmadas');
    } else e={...old,estado:op==='CANCEL'?'CANCELADO':'CERRADO',fecha_actualizacion:iso};
    put('Eventos',e);
    put('Auditoria_Eventos',{auditoria_id:id('AUD'),evento_id:e.evento_id,accion:op,fecha:iso,resultado:'EXITOSO',detalle:'Administración exclusiva por formulario protegido'});
    if(old) for(const r of rows('Inscripciones').filter(r=>r.evento_id===e.evento_id && activeRegistration(r))) {
      if(e.estado==='CANCELADO') {
        const next=put('Inscripciones',{...r,estado:'CANCELADA',fecha_actualizacion:iso});
        auditRegistration(next,'CANCELACION_EVENTO',r.estado);
      }
      notify(r.usuario_id,e.estado==='CANCELADO'?'EVENTO_CANCELADO':'EVENTO_ACTUALIZADO','Cambio en '+e.nombre,e.estado==='CANCELADO'?'El evento fue cancelado. Tu inscripción quedó cancelada.':'El organizador modificó el evento. Consulta los detalles actualizados.',e.evento_id,r.inscripcion_id,[r.usuario_id,e.evento_id,'CAMBIO',iso].join('|'));
    }
    response={ok:true,evento:e};status=op==='CREATE'?201:200;
  }
} catch(e) { for(const key of Object.keys(writes)) delete writes[key]; notifications.length=0; status=e.http||500;response={ok:false,mensaje:e.http?e.message:'Error interno; revisa la ejecución en n8n'}; }
return result();
