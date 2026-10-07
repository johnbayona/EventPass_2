export function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function safeImage(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:'';}catch{return '';}}
export function eventDate(event){const d=new Date(`${event.fecha}T${String(event.hora).slice(0,5)}:00-05:00`);return Number.isNaN(d.getTime())?null:d;}
export function dateLabel(event){const d=eventDate(event);return d?new Intl.DateTimeFormat('es-CO',{day:'numeric',month:'long',year:'numeric',timeZone:'America/Bogota'}).format(d):'Fecha por confirmar';}
export function timeLabel(event){return String(event.hora||'').slice(0,5);}
export function timestampLabel(value){const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Bogota'}).format(d);}
export function canEnroll(event,now=Date.now()){const d=eventDate(event);return event.estado==='PUBLICADO'&&event.acepta_inscripciones!==false&&!!d&&d.getTime()>now;}
export function filterEvents(events,{query='',availableOnly=false}={}){const q=query.trim().toLocaleLowerCase('es');return events.filter(e=>(!q||[e.nombre,e.descripcion,e.lugar,e.categoria].some(v=>String(v||'').toLocaleLowerCase('es').includes(q)))&&(!availableOnly||(canEnroll(e)&&Number(e.cupos_disponibles)>0)));}
export function stateLabel(value){return ({PUBLICADO:'Abierto',CERRADO:'Cerrado',CANCELADO:'Cancelado',BORRADOR:'Borrador',CONFIRMADA:'Confirmada',LISTA_ESPERA:'Lista de espera',CANCELADA:'Cancelada'})[value]||value||'—';}
export function notificationWarning(results){return Array.isArray(results)&&results.some(r=>r.gmail_estado!=='ENVIADO'||r.telegram_estado!=='ENVIADO');}
