const ctx = $('Configuración').first().json;
const request = ctx.request;
const req = request && typeof request === 'object' && !Array.isArray(request) ? request : {};
const cfg = ctx.config;
const seed = $('Generar ID consulta').first().json.consulta_uuid;
if (!seed) throw new Error('Falta consulta_uuid en Generar ID consulta');
const now = new Date();
const iso = now.toISOString();
let status = 200;
let response;
const eventColumns = ['evento_id','nombre','categoria','descripcion','fecha','hora','lugar','capacidad','imagen_url','organizador','estado','fecha_creacion','fecha_actualizacion'];
function fail(code, message) { const error = new Error(message); error.http = code; throw error; }
function rows(sheet) {
  return $('Leer ' + sheet).all().map(item => item.json)
    .filter(row => row && Object.keys(row).some(key => key !== 'row_number'));
}
function eventTime(event) {
  const date = String(event.fecha || '');
  const hour = String(event.hora || '').slice(0,5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hour)) fail(500, 'Fecha u hora inválida en Eventos; revisa WF04');
  const calendar = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0,10) !== date) fail(500, 'Fecha inválida en Eventos; revisa WF04');
  const value = Date.parse(date + 'T' + hour + ':00' + cfg.eventTimezoneOffset);
  if (!Number.isFinite(value)) fail(500, 'Zona horaria inválida en Configuración');
  return value;
}
const op = String(req.operacion || 'listado').trim().toLowerCase();
try {
  if (!request || typeof request !== 'object' || Array.isArray(request)) fail(400, 'Envía un objeto JSON');
  if (!['listado','detalle','filtro'].includes(op)) fail(400, 'Operación permitida: listado, detalle, filtro');
  let events = rows('Eventos').filter(event =>
    ['PUBLICADO','CERRADO','CANCELADO'].includes(event.estado) &&
    String(event.categoria || '').trim().toUpperCase() === 'EMPRENDIMIENTO');
  if (op === 'detalle') {
    if (typeof req.evento_id !== 'string' || !req.evento_id.trim()) fail(400, 'evento_id requerido');
    events = events.filter(event => event.evento_id === req.evento_id.trim());
    if (!events.length) fail(404, 'Evento no encontrado o no publicable');
  }
  if (op === 'filtro' || req.categoria !== undefined) {
    if (typeof req.categoria !== 'string' || req.categoria.trim().length < 2 || req.categoria.trim().length > 80) fail(400, 'categoria debe ser texto entre 2 y 80 caracteres');
    const category = req.categoria.trim().toUpperCase();
    events = events.filter(event => String(event.categoria).trim().toUpperCase() === category);
    if (op === 'detalle' && !events.length) fail(404, 'Evento no encontrado en esa categoría');
  }
  const registrations = rows('Inscripciones');
  const confirmed = new Map();
  for (const r of registrations) if (r.estado === 'CONFIRMADA') confirmed.set(r.evento_id, (confirmed.get(r.evento_id) || 0) + 1);
  const data = events.map(event => {
    const timestamp = eventTime(event);
    const capacity = Number(event.capacidad);
    if (!Number.isInteger(capacity) || capacity < 1) fail(500, 'Capacidad inválida en Eventos; revisa WF04');
    const clean = {};
    for (const key of eventColumns) clean[key] = event[key] ?? '';
    return {...clean, capacidad:capacity, cupos_disponibles:Math.max(0, capacity - (confirmed.get(event.evento_id) || 0)), acepta_inscripciones:event.estado === 'PUBLICADO' && timestamp > now.getTime()};
  }).sort((a,b) => eventTime(a) - eventTime(b));
  response = op === 'detalle' ? {ok:true, evento:data[0]} : {ok:true, eventos:data, total:data.length};
} catch(error) {
  status = error.http || 500;
  response = {ok:false, mensaje:error.http ? error.message : 'Error interno; revisa la ejecución en n8n'};
}
const log = {
  consulta_id:'CON_' + seed, fecha:iso, tipo:op.toUpperCase().slice(0,30),
  evento_id:String(req.evento_id || '').slice(0,150), categoria:String(req.categoria || '').slice(0,80),
  resultado_count:response.total ?? (response.evento ? 1 : 0),
  visitor_id:String(req.visitor_id || ('VIS_' + seed)).slice(0,100), status_http:status
};
return [{json:{writes:{Consultas_Catalogo:[log]},notifications:[],status,response,mode:'http',chat_id:''}}];
