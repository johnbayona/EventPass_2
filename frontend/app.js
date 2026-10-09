import {request,askAssistant,CONFIG} from './api.js';
import {escapeHtml as esc,safeImage,dateLabel,timeLabel,timestampLabel,eventDate,canEnroll,filterEvents,stateLabel,notificationWarning} from './utils.js';

const view=document.querySelector('#view');
const navigation=document.querySelector('#navigation');
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();document.querySelector('#contenido').focus();});
const storage={get(key){try{return sessionStorage.getItem(key);}catch{return null;}},set(key,value){try{sessionStorage.setItem(key,value);}catch{}},remove(key){try{sessionStorage.removeItem(key);}catch{}}};
const state={token:storage.get('ep_token')||'',user:null,events:[],categories:[],category:'',query:'',availableOnly:false,currentEvent:null,ticket:0};
try{state.user=JSON.parse(storage.get('ep_user')||'null');}catch{storage.remove('ep_user');}
let chatSession=storage.get('ep_chat_session')||crypto.randomUUID();storage.set('ep_chat_session',chatSession);
let visitorId=storage.get('ep_visitor')||crypto.randomUUID();storage.set('ep_visitor',visitorId);
const labelCategory=c=>c==='Educación'?'Aprende':c==='Networking'?'Conecta':'Emprende';
function toast(message,type='success'){
 const item=document.createElement('div');item.className='toast '+type;item.textContent=message;
 document.querySelector('#toasts').append(item);setTimeout(()=>item.remove(),type==='error'?9000:6500);
}
function setUser(user,token=state.token){state.user=user;state.token=token;storage.set('ep_token',token);storage.set('ep_user',JSON.stringify(user));renderNav();}
function clearSession(){state.user=null;state.token='';storage.remove('ep_token');storage.remove('ep_user');renderNav();}
function renderNav(){
 const route=location.hash||'#/';
 navigation.innerHTML=`<a href="#/" ${route==='#/'?'aria-current="page"':''}>Inicio</a><a href="#/eventos" ${route.startsWith('#/eventos')?'aria-current="page"':''}>Explorar eventos</a>${state.user?`<a href="#/inscripciones" ${route==='#/inscripciones'?'aria-current="page"':''}>Mis inscripciones</a><a class="nav-profile" href="#/perfil">${esc(state.user.nombre?.split(' ')[0]||'Mi perfil')} <span class="avatar">${esc(state.user.nombre?.[0]||'U')}</span></a><button class="nav-logout" data-action="logout">Salir</button>`:`<a href="#/login">Ingresar</a><a class="button small primary" href="#/registro">Crear cuenta <span>↗</span></a>`}`;
 document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');navigation.classList.remove('open');
}
function page(title,subtitle,content){return `<section class="container page"><div class="page-heading"><span class="eyebrow">EVENTPASS · EMPRENDE365</span><h1>${title}</h1><p>${subtitle}</p></div>${content}</section>`;}
function loading(title='Estamos preparando todo…'){view.innerHTML=page(title,'Un momento, por favor.',`<div class="skeleton-grid" aria-label="Cargando" aria-busy="true">${'<div class="skeleton-card"></div>'.repeat(3)}</div>`);}
function errorView(error,retry=true){view.innerHTML=page('No pudimos cargar esta página',esc(error.message),`<div class="empty-state"><span class="empty-icon">↻</span><h2>Podemos intentarlo de nuevo</h2><p>Tu información se conserva. Revisa tu conexión y vuelve a intentar.</p><div class="actions">${retry?'<button class="button primary" data-action="retry">Volver a intentar</button>':''}<a class="button secondary" href="#/">Ir al inicio</a></div></div>`);}
function empty(title,description,link='#/eventos',button='Explorar eventos'){return `<div class="empty-state"><span class="empty-icon">✦</span><h2>${title}</h2><p>${description}</p><a class="button primary" href="${link}">${button} ↗</a></div>`;}
function authGuard(){if(!state.token){const next=location.hash.slice(1)||'/perfil';location.hash='/login?next='+encodeURIComponent(next);return false;}return true;}
function nextRoute(){const query=(location.hash.split('?')[1]||'');const candidate=new URLSearchParams(query).get('next');return candidate&&/^\/(perfil|telegram|inscripciones|evento\/[^?#]+)$/.test(candidate)?candidate:'/perfil';}
function formError(form,e){const target=form.querySelector('.form-error');if(target){target.textContent=e.message;target.hidden=false;target.focus();}else toast(e.message,'error');}
function clearError(form){const e=form.querySelector('.form-error');if(e){e.hidden=true;e.textContent='';}}
function card(event,index=0){
 const image=safeImage(event.imagen_url);const open=canEnroll(event);const free=Number(event.cupos_disponibles)||0;
 return `<article class="event-card"><a class="card-art art-${index%4}" href="#/evento/${encodeURIComponent(event.evento_id)}" aria-label="Ver ${esc(event.nombre)}">${image?`<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span class="art-word">${esc(labelCategory(event.categoria))}<span>✳</span></span><span class="category-chip">${esc(event.categoria)}</span></a><div class="card-body"><div class="card-meta"><span>${esc(dateLabel(event))}</span><span class="status ${open?'active':'closed'}">${open?(free?'Cupos disponibles':'Lista de espera'):esc(stateLabel(event.estado))}</span></div><h3><a href="#/evento/${encodeURIComponent(event.evento_id)}">${esc(event.nombre)}</a></h3><p class="description">${esc(event.descripcion)}</p><div class="location">↗ ${esc(event.lugar)}</div><div class="card-bottom"><span>${open?`<strong>${free}</strong> cupos disponibles`:'Inscripciones cerradas'}</span><a class="arrow-link" href="#/evento/${encodeURIComponent(event.evento_id)}" aria-label="Ver detalles de ${esc(event.nombre)}">↗</a></div></div></article>`;
}
async function fetchCatalog(category=''){
 const data=await request('catalogo',{operacion:category?'filtro':'listado',...(category?{categoria:category}:{}),visitor_id:visitorId});
 if(!Array.isArray(data.eventos))throw new Error('El catálogo no está disponible. Intenta nuevamente.');return data.eventos;
}
async function home(ticket){
 view.innerHTML=`<section class="hero container"><div class="hero-copy"><span class="hero-kicker"><span class="online-dot"></span> UNA COMUNIDAD DE IDEAS EN MOVIMIENTO</span><h1>Tu próxima idea<br>merece un <span>encuentro.</span></h1><p>Aprende algo nuevo, encuentra aliados y dale impulso a tu emprendimiento. Tu siguiente paso comienza aquí.</p><div class="actions"><a class="button primary" href="#/eventos">Encuentra tu próximo evento <span>↗</span></a><a class="text-link" href="#/registro">Únete a la comunidad →</a></div><div class="hero-proof"><span class="mini-avatar">e</span><span>Para quienes están empezando.<br><strong>Y quienes quieren ir más lejos.</strong></span></div></div><div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="floating-tag tag-one">Ideas + acción ↗</span><div class="hero-ticket"><span class="ticket-label">TU PRÓXIMO GRAN PASO</span><div class="ticket-star">✳</div><h2>Emprende.<br>Aprende.<br>Conecta.</h2><div class="ticket-line"></div><div class="ticket-footer"><span>EVENTPASS<br><strong>EMPRENDE365</strong></span><span class="barcode"></span></div></div><span class="floating-tag tag-two">Un encuentro puede cambiarlo todo.</span><span class="visual-spark">✦</span></div></section><section class="value-strip"><div class="container"><span>✳ Aprende con propósito</span><span>↗ Construye tu red</span><span>◉ Haz crecer tu negocio</span></div></section><section class="container section"><div class="section-heading"><div><span class="eyebrow">ELIGE TU SIGUIENTE PASO</span><h2>Encuentros que te impulsan</h2></div><a class="text-link" href="#/eventos">Ver todos los eventos ↗</a></div><div id="home-events" class="event-grid">${'<div class="skeleton-card"></div>'.repeat(3)}</div></section><section class="container how-section"><div><span class="eyebrow">ES MÁS FÁCIL DAR EL PRIMER PASO</span><h2>De una idea<br>a una experiencia.</h2><p>Tu cuenta conecta cada encuentro con lo que quieres construir.</p><a class="button secondary" href="#/registro">Comenzar ahora ↗</a></div><ol class="steps"><li><span>01</span><div><h3>Descubre un encuentro</h3><p>Explora eventos de emprendimiento, educación y networking.</p></div></li><li><span>02</span><div><h3>Crea tu cuenta y vincula Telegram</h3><p>Recibe confirmaciones y recordatorios por correo y Telegram.</p></div></li><li><span>03</span><div><h3>Reserva tu lugar</h3><p>Si el evento está lleno, entra a la lista de espera y te avisaremos cuando se libere un cupo.</p></div></li></ol></section>`;
 try{const events=await fetchCatalog();if(ticket!==state.ticket)return;state.events=events;const open=events.filter(e=>canEnroll(e)).slice(0,3);document.querySelector('#home-events').innerHTML=open.length?open.map(card).join(''):empty('Pronto habrá nuevos encuentros','Vuelve al catálogo para conocer todos los eventos.');}
 catch(e){if(ticket===state.ticket)document.querySelector('#home-events').innerHTML=`<div class="inline-error"><h3>El catálogo está temporalmente no disponible</h3><p>${esc(e.message)}</p><button class="button secondary" data-action="retry">Volver a intentar</button></div>`;}
}
function renderCatalog(){
 const result=filterEvents(state.events,state);
 const grid=document.querySelector('#catalog-grid');if(!grid)return;
 document.querySelector('#catalog-count').textContent=`${result.length} ${result.length===1?'encuentro':'encuentros'} para explorar`;
 grid.innerHTML=result.length?result.map(card).join(''):'<div class="empty-state"><span class="empty-icon">✦</span><h2>No encontramos eventos con esos filtros</h2><p>Prueba otra búsqueda o desactiva el filtro de cupos.</p><button class="button primary" data-action="clear-filters">Limpiar filtros</button></div>';
}
async function catalog(ticket){
 loading('Encuentra tu próximo encuentro');
 const events=await fetchCatalog();if(ticket!==state.ticket)return;
 state.events=events;state.categories=[...new Set(events.map(e=>e.categoria).filter(Boolean))].sort();state.category='';
 view.innerHTML=page('Un encuentro. Nuevas posibilidades.','Talleres, conexiones y experiencias para impulsar tu emprendimiento.',`<div class="filters"><div class="search-field"><span aria-hidden="true">⌕</span><label class="sr-only" for="event-search">Buscar eventos</label><input type="search" id="event-search" value="${esc(state.query)}" placeholder="Busca por tema, evento o lugar"></div><label class="select-wrap"><span class="sr-only">Categoría</span><select id="category-filter"><option value="">Todas las categorías</option>${state.categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label class="check-filter"><input type="checkbox" id="available-filter" ${state.availableOnly?'checked':''}> Solo con cupos</label></div><p id="catalog-count" class="results-label"></p><div id="catalog-grid" class="event-grid"></div>`);renderCatalog();
}
async function detail(id,ticket){
 loading('Un gran encuentro está por comenzar');
 const data=await request('catalogo',{operacion:'detalle',evento_id:id,visitor_id:visitorId});if(ticket!==state.ticket)return;
 const e=data.evento;if(!e)throw new Error('Evento no disponible.');state.currentEvent=e;
 const open=canEnroll(e);const free=Number(e.cupos_disponibles)||0;const image=safeImage(e.imagen_url);
 view.innerHTML=`<section class="container page detail-page"><a href="#/eventos" class="back-link">← Volver al catálogo</a><div class="detail-layout"><div><div class="detail-art art-0">${image?`<img src="${esc(image)}" alt="" referrerpolicy="no-referrer">`:''}<span class="art-word">${esc(labelCategory(e.categoria))}<span>✳</span></span><span class="category-chip">${esc(e.categoria)}</span></div><h1>${esc(e.nombre)}</h1><div class="detail-meta"><span>◷ ${esc(dateLabel(e))} · ${esc(timeLabel(e))}</span><span>↗ ${esc(e.lugar)}</span></div><section class="detail-description"><h2>Sobre este encuentro</h2><p>${esc(e.descripcion)}</p><div class="organizer"><span class="avatar">${esc(e.organizador?.[0]||'E')}</span><div><span class="muted">Organizado por</span><strong>${esc(e.organizador)}</strong></div></div></section></div><aside class="booking-panel"><span class="eyebrow">TU PRÓXIMO PASO</span><h2>${open?(free?'Hay un lugar para ti':'Tu oportunidad sigue aquí'):esc(stateLabel(e.estado))}</h2><div class="capacity"><strong>${free}</strong><span>de ${Number(e.capacidad)||0}<br>cupos disponibles</span></div><p>${open?(free?'Reserva tu lugar y prepárate para una nueva experiencia.':'El evento está lleno. Puedes unirte a la lista de espera; te avisaremos cuando se libere un cupo.'):'Este evento ya no admite inscripciones. Explora otros encuentros de la comunidad.'}</p>${open?`<button class="button primary full" data-action="enroll" data-event="${esc(e.evento_id)}">${free?'Reservar mi lugar':'Unirme a la lista de espera'} ↗</button>`:'<a class="button secondary full" href="#/eventos">Explorar otros eventos</a>'}<div class="booking-note">✦ Necesitas una cuenta y Telegram vinculado.<br>Recibirás avisos por correo y Telegram.</div><dl class="booking-details"><div><dt>Fecha</dt><dd>${esc(dateLabel(e))}</dd></div><div><dt>Hora de Colombia</dt><dd>${esc(timeLabel(e))}</dd></div><div><dt>Lugar</dt><dd>${esc(e.lugar)}</dd></div></dl></aside></div></section>`;
}
function authPage(type){
 const register=type==='registro';
 view.innerHTML=`<section class="container auth-layout"><div class="auth-intro"><span class="eyebrow">ESTÁS A UN PASO</span><h1>${register?'Las buenas ideas<br>crecen en <span>comunidad.</span>':'Qué bueno<br>tenerte de <span>vuelta.</span>'}</h1><p>${register?'Crea tu cuenta y encuentra espacios para aprender, conectar y emprender.':'Tus próximos encuentros y nuevas oportunidades te esperan.'}</p><div class="auth-shape" aria-hidden="true">✳</div></div><div class="form-panel"><h2>${register?'Crea tu cuenta':'Ingresa a EventPass'}</h2><p class="muted">${register?'Comienza tu siguiente capítulo.':'Continúa donde lo dejaste.'}</p><form data-form="${type}"><p class="form-error" role="alert" tabindex="-1" hidden></p>${register?'<label>Nombre completo<input name="nombre" autocomplete="name" minlength="2" maxlength="100" placeholder="¿Cómo te llamas?" required></label>':''}<label>Correo electrónico<input name="email" type="email" autocomplete="email" maxlength="254" placeholder="tu@correo.com" required></label><label>Contraseña<div class="password-wrap"><input name="password" type="password" autocomplete="${register?'new-password':'current-password'}" ${register?'minlength="12"':''} maxlength="128" required placeholder="${register?'Mínimo 12 caracteres':'Tu contraseña'}"><button type="button" data-action="show-password" aria-label="Mostrar contraseña">Ver</button></div></label>${register?'<label>Confirma tu contraseña<input name="confirm_password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required placeholder="Repite tu contraseña"></label><p class="field-help">Tu contraseña se almacena protegida. No la compartas con el asistente.</p>':''}<button class="button primary full" type="submit">${register?'Crear mi cuenta':'Ingresar'} ↗</button></form><p class="form-switch">${register?'¿Ya tienes cuenta? <a href="#/login">Ingresa aquí</a>':'¿Aún no tienes cuenta? <a href="#/registro">Únete a la comunidad</a>'}</p></div></section>`;
}
async function profile(ticket){
 if(!authGuard())return;loading('Tu espacio en EventPass');
 const [data,tg]=await Promise.all([request('usuarios',{operacion:'consultar'},state.token),request('telegram',{operacion:'consultar'},state.token)]);if(ticket!==state.ticket)return;
 setUser(data.usuario);const u=data.usuario;
 view.innerHTML=page('Hola, '+esc(u.nombre?.split(' ')[0]||'emprendedor')+'.','Tu perfil, tus conexiones y tu próximo paso.',`<div class="profile-layout"><section class="form-panel"><div class="section-heading"><div><h2>Tu perfil</h2><p class="muted">Mantén tus datos al día.</p></div><span class="avatar large">${esc(u.nombre?.[0]||'U')}</span></div><form data-form="perfil"><p class="form-error" role="alert" tabindex="-1" hidden></p><label>Nombre completo<input name="nombre" autocomplete="name" value="${esc(u.nombre)}" minlength="2" maxlength="100" required></label><label>Correo electrónico<input name="email" type="email" autocomplete="email" value="${esc(u.email_normalizado)}" maxlength="254" required></label><button class="button primary" type="submit">Guardar cambios ↗</button></form><p class="field-help">Miembro desde ${esc(timestampLabel(u.fecha_registro))}</p></section><div class="profile-aside"><section class="connection-card"><span class="eyebrow">MANTENTE AL TANTO</span><h2>Telegram <span class="status ${tg.vinculado?'active':'waiting'}">${tg.vinculado?'Vinculado':'Pendiente'}</span></h2><p>${tg.vinculado?'Tu conexión está lista para recibir confirmaciones y recordatorios.':'Vincula tu cuenta para poder inscribirte y recibir avisos de tus eventos.'}</p><a class="button secondary full" href="#/telegram">${tg.vinculado?'Ver vinculación':'Vincular Telegram'} ↗</a></section><a href="#/inscripciones" class="quick-link"><span>Mis inscripciones<small>Consulta tus próximos encuentros</small></span><span>↗</span></a><section class="danger-zone"><h3>Desactivar cuenta</h3><p>Tu cuenta quedará inactiva y no podrás iniciar sesión. Tus registros se conservan.</p><button class="text-danger" data-action="deactivate">Desactivar mi cuenta</button></section></div></div>`);
}
async function telegram(ticket){
 if(!authGuard())return;loading('Conecta con tus próximos encuentros');
 const data=await request('telegram',{operacion:'consultar'},state.token);if(ticket!==state.ticket)return;
 const username=String(CONFIG.telegramBotUsername||'').replace(/[^a-zA-Z0-9_]/g,'');
 view.innerHTML=page('Tus eventos, también en Telegram.','Vincula tu cuenta para recibir confirmaciones, cambios y recordatorios.',`<div class="telegram-layout"><section class="connection-card"><div class="telegram-symbol" aria-hidden="true">➤</div><h2>${data.vinculado?'Ya estás conectado':'Activa tu conexión'}</h2><p>${data.vinculado?'Tu cuenta de Telegram está vinculada'+(data.telegram_username?' como @'+esc(data.telegram_username):'')+'. Puedes comenzar a reservar tus encuentros.':'Un código temporal conecta tu perfil con el bot de EventPass.'}</p><span class="status ${data.vinculado?'active':'waiting'}">${data.vinculado?'Vinculación activa':'Vinculación pendiente'}</span><div class="actions">${data.vinculado?'<a class="button primary" href="#/eventos">Explorar eventos ↗</a>':'<button class="button primary" data-action="generate-code">Generar mi código ↗</button>'}</div><div id="link-code" aria-live="polite"></div></section><ol class="steps"><li><span>01</span><div><h3>Genera tu código</h3><p>El código dura diez minutos y solo se puede usar una vez.</p></div></li><li><span>02</span><div><h3>Abre el bot en Telegram</h3><p>Inicia un chat privado con el bot y pulsa Iniciar.</p>${username?`<a class="text-link" target="_blank" rel="noopener noreferrer" href="https://t.me/${username}">Abrir @${username} ↗</a>`:''}</div></li><li><span>03</span><div><h3>Envía el comando</h3><p>Copia y envía <code>/vincular CODIGO</code>. Luego comprueba tu conexión aquí.</p><button class="button secondary small" data-action="check-link">Comprobar vinculación ↻</button></div></li></ol></div>`);
}
async function inscriptions(ticket){
 if(!authGuard())return;loading('Tus próximos encuentros');
 const data=await request('inscripciones',{operacion:'consultar'},state.token);let events=[];
 try{events=await fetchCatalog();}catch{/* Las inscripciones siguen disponibles aunque falle el catálogo. */}
 if(ticket!==state.ticket)return;
 const list=data.inscripciones;if(!Array.isArray(list))throw new Error('No pudimos consultar tus inscripciones.');
 const sorted=[...list].sort((a,b)=>new Date(b.fecha_inscripcion)-new Date(a.fecha_inscripcion));
 view.innerHTML=page('Tu agenda de nuevas posibilidades.','Consulta tus reservas, actualiza tu acreditación y organiza tu próximo paso.',sorted.length?`<div class="registration-list">${sorted.map(r=>{
  const event=events.find(e=>e.evento_id===r.evento_id);const active=['CONFIRMADA','LISTA_ESPERA'].includes(r.estado);const manageable=active&&(!event||(eventDate(event)?.getTime()>Date.now()&&event.estado!=='CANCELADO'));
  return `<article class="registration-card"><div class="registration-main"><div class="registration-icon">${r.estado==='CONFIRMADA'?'↗':r.estado==='LISTA_ESPERA'?'◷':'×'}</div><div><span class="status ${r.estado==='CONFIRMADA'?'active':r.estado==='LISTA_ESPERA'?'waiting':'closed'}">${esc(stateLabel(r.estado))}</span><h2>${esc(event?.nombre||'Evento '+r.evento_id)}</h2><p>${event?esc(dateLabel(event))+' · '+esc(timeLabel(event))+' · '+esc(event.lugar):'Los detalles del evento no están disponibles en este momento.'}</p><small>Acreditación: ${esc(r.nombre_acreditacion)}</small>${r.estado==='LISTA_ESPERA'?'<p class="wait-note">Tu lugar se asignará por orden de inscripción cuando se libere un cupo. Te avisaremos.</p>':''}</div></div><div class="registration-actions">${['CONFIRMADA','ASISTIO'].includes(r.estado)?`<a class="button secondary small" href="#/checkin?inscripcion_id=${encodeURIComponent(r.inscripcion_id)}&evento_id=${encodeURIComponent(r.evento_id)}">Check-in</a>`:''}${event?`<a class="button secondary small" href="#/evento/${encodeURIComponent(r.evento_id)}">Ver evento ↗</a>`:''}${manageable?`<button class="text-danger" data-action="cancel-registration" data-id="${esc(r.inscripcion_id)}">Cancelar inscripción</button>`:''}</div>${manageable?`<details class="registration-edit"><summary>Editar datos de acreditación</summary><form data-form="editar-inscripcion" data-id="${esc(r.inscripcion_id)}"><p class="form-error" role="alert" tabindex="-1" hidden></p><div class="form-row"><label>Nombre de acreditación<input name="nombre_acreditacion" value="${esc(r.nombre_acreditacion)}" minlength="2" maxlength="100" required></label><label>Observaciones<input name="observaciones" value="${esc(r.observaciones)}" maxlength="500"></label></div><button class="button secondary small" type="submit">Guardar cambios</button></form></details>`:''}</article>`;
 }).join('')}</div>`:empty('Tu primera experiencia te espera','Aún no tienes inscripciones. Explora el catálogo y encuentra tu próximo encuentro.'));
}
async function route(){
 const ticket=++state.ticket;renderNav();state.currentEvent=null;
 const path=(location.hash.slice(1)||'/').split('?')[0];document.title='EventPass · Emprende365';
 try{
  if(path==='/')await home(ticket);
  else if(path==='/eventos')await catalog(ticket);
  else if(path.startsWith('/evento/'))await detail(decodeURIComponent(path.slice(8)),ticket);
  else if(path==='/login'||path==='/registro'){if(state.token){location.hash='/perfil';return;}authPage(path.slice(1));}
  else if(path==='/perfil')await profile(ticket);
  else if(path==='/telegram')await telegram(ticket);
  else if(path==='/inscripciones')await inscriptions(ticket);
  else if(path==='/checkin'){if(authGuard())checkinPage();}
  else view.innerHTML=page('Este camino aún no existe.','Volvamos a un lugar conocido.',empty('Página no encontrada','Explora las oportunidades disponibles.'));
 }catch(e){if(ticket!==state.ticket)return;if(e.status===401&&state.token){clearSession();toast('Tu sesión terminó. Ingresa nuevamente.','error');location.hash='/login';}else errorView(e);}
}
function confirmAction(title,message,accept){return new Promise(resolve=>{
 const dialog=document.querySelector('#confirm-dialog');document.querySelector('#confirm-title').textContent=title;document.querySelector('#confirm-message').textContent=message;document.querySelector('#confirm-accept').textContent=accept;
 dialog.returnValue='no';dialog.addEventListener('close',()=>resolve(dialog.returnValue==='yes'),{once:true});dialog.showModal();
});}
function notificationFeedback(data){if(notificationWarning(data.notificaciones))toast('La operación se guardó, pero uno de los avisos no pudo enviarse. Consulta tu inscripción aquí.','error');}
document.addEventListener('submit',async event=>{
 const form=event.target;if(!form.matches('form[data-form]'))return;event.preventDefault();clearError(form);
 const previousResult=form.querySelector('#checkin-result');if(previousResult)previousResult.textContent='';
 const type=form.dataset.form;const fields=Object.fromEntries(new FormData(form));const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);form.setAttribute('aria-busy','true');
 try{
  if(type==='checkin'){
   const data=await request('checkin',{inscripcion_id:fields.inscripcion_id.trim(),evento_id:fields.evento_id.trim()},state.token);
   form.querySelector('#checkin-result').textContent=data.mensaje+(data.aviso_pendiente?' La asistencia se guardó; revisa el envío de notificaciones.':'')+(data.advertencia?' '+data.advertencia:'');
  }else if(type==='registro'){
   if(fields.password!==fields.confirm_password)throw new Error('Las contraseñas no coinciden.');
   await request('usuarios',{operacion:'crear',nombre:fields.nombre,email:fields.email,password:fields.password});
   toast('Tu cuenta está creada. Ya puedes ingresar.');location.hash='/login';
  }else if(type==='login'){
   const data=await request('auth',{operacion:'login',email:fields.email,password:fields.password});
   if(!data.session_token||!data.usuario)throw new Error('No pudimos iniciar la sesión.');setUser(data.usuario,data.session_token);toast('Bienvenido a EventPass.');location.hash=nextRoute();
  }else if(type==='perfil'){
   const data=await request('usuarios',{operacion:'actualizar',nombre:fields.nombre,email:fields.email},state.token);setUser(data.usuario);toast('Tu perfil está actualizado.');
  }else if(type==='editar-inscripcion'){
   const data=await request('inscripciones',{operacion:'actualizar',inscripcion_id:form.dataset.id,nombre_acreditacion:fields.nombre_acreditacion,observaciones:fields.observaciones},state.token);toast('Tus datos de acreditación están actualizados.');notificationFeedback(data);
  }
 }catch(e){if(e.status===401&&state.token){clearSession();location.hash='/login';toast('Tu sesión terminó. Ingresa nuevamente.','error');}else formError(form,e);}
 finally{buttons.forEach(b=>b.disabled=false);form.removeAttribute('aria-busy');}
});
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-action]');if(!button)return;
 const action=button.dataset.action;
 if(action==='show-password'){const input=button.parentElement.querySelector('input');const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Ocultar':'Ver';button.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');return;}
 if(action==='retry'){route();return;}
 if(action==='clear-filters'){state.query='';state.availableOnly=false;state.category='';route();return;}
 button.disabled=true;
 try{
  if(action==='logout'){
   let failed=false;try{await request('auth',{operacion:'logout'},state.token);}catch{failed=true;}clearSession();location.hash='/';toast(failed?'Saliste de este dispositivo. No se pudo confirmar el cierre de la sesión en el servicio.':'Sesión cerrada.',failed?'error':'success');
  }else if(action==='enroll'){
   if(!authGuard())return;
   const tg=await request('telegram',{operacion:'consultar'},state.token);if(!tg.vinculado){toast('Vincula Telegram antes de reservar tu lugar.','error');location.hash='/telegram';return;}
   const data=await request('inscripciones',{operacion:'crear',evento_id:button.dataset.event},state.token);
   toast(data.idempotente?'Ya tienes una inscripción para este evento.':data.inscripcion?.estado==='LISTA_ESPERA'?'Estás en la lista de espera. Te avisaremos si se libera un cupo.':'Tu lugar está confirmado.');notificationFeedback(data);location.hash='/inscripciones';
  }else if(action==='generate-code'){
   const data=await request('telegram',{operacion:'generar_codigo'},state.token);
   const command='/vincular '+data.codigo;
   document.querySelector('#link-code').innerHTML=`<div class="code-block"><span class="eyebrow">TU COMANDO DE VINCULACIÓN</span><code>${esc(command)}</code><p>Válido hasta ${esc(timestampLabel(data.expira_en))}. Solo se puede usar una vez.</p><button class="button secondary small" data-action="copy-code" data-code="${esc(command)}">Copiar comando</button></div>`;
  }else if(action==='copy-code'){
   try{await navigator.clipboard.writeText(button.dataset.code);toast('Comando copiado. Pégalo en Telegram.');}catch{toast('Selecciona y copia el comando que aparece en pantalla.','error');}
  }else if(action==='check-link'){
   const data=await request('telegram',{operacion:'consultar'},state.token);toast(data.vinculado?'Telegram está vinculado. Ya puedes inscribirte.':'La vinculación aún no aparece. Envía el comando al bot y vuelve a comprobar.',data.vinculado?'success':'error');if(data.vinculado)route();
  }else if(action==='cancel-registration'){
   if(!await confirmAction('¿Cancelar tu inscripción?','Tu inscripción quedará cancelada. Si tenías un cupo, podrá asignarse a una persona en lista de espera.','Cancelar inscripción'))return;
   const data=await request('inscripciones',{operacion:'cancelar',inscripcion_id:button.dataset.id},state.token);toast('Tu inscripción quedó cancelada.');notificationFeedback(data);route();
  }else if(action==='deactivate'){
   if(!await confirmAction('¿Desactivar tu cuenta?','No podrás iniciar sesión ni inscribirte. Tus registros se conservarán. Esta interfaz no permite reactivar la cuenta.','Desactivar cuenta'))return;
   await request('usuarios',{operacion:'desactivar'},state.token);clearSession();location.hash='/';toast('Tu cuenta quedó desactivada.');
  }
 }catch(e){if(e.status===401&&state.token){clearSession();location.hash='/login';toast('Tu sesión terminó. Ingresa nuevamente.','error');}else toast(e.message,'error');}
 finally{button.disabled=false;}
});
document.addEventListener('input',event=>{if(event.target.id==='event-search'){state.query=event.target.value;renderCatalog();}});
document.addEventListener('change',async event=>{
 if(event.target.id==='available-filter'){state.availableOnly=event.target.checked;renderCatalog();}
 if(event.target.id==='category-filter'){
  const select=event.target;const previous=state.category;state.category=select.value;select.disabled=true;
  const ticket=state.ticket;const grid=document.querySelector('#catalog-grid');grid.setAttribute('aria-busy','true');
  try{const events=await fetchCatalog(state.category);if(ticket!==state.ticket)return;state.events=events;renderCatalog();}
  catch(e){if(ticket===state.ticket){state.category=previous;select.value=previous;toast(e.message,'error');}}
  finally{select.disabled=false;grid.removeAttribute('aria-busy');}
 }
});
document.querySelector('#menu-toggle').addEventListener('click',()=>{const open=navigation.classList.toggle('open');document.querySelector('#menu-toggle').setAttribute('aria-expanded',String(open));});
const chatDialog=document.querySelector('#chat-dialog');
document.querySelector('#chat-toggle').addEventListener('click',()=>chatDialog.showModal());
document.querySelector('#chat-close').addEventListener('click',()=>chatDialog.close());
document.querySelector('#chat-form').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.target;const input=document.querySelector('#chat-input');const message=input.value.trim();if(!message)return;
 const box=document.querySelector('#chat-messages');const add=(text,role)=>{const el=document.createElement('p');el.className='bubble '+role;el.textContent=text;box.append(el);box.scrollTop=box.scrollHeight;return el;};
 add(message,'user');input.value='';const pending=add('Estoy consultando…','assistant');const submit=form.querySelector('button');submit.disabled=true;input.disabled=true;
 try{pending.textContent=await askAssistant(message,chatSession);}catch(e){pending.textContent=e.message;pending.classList.add('chat-error');}
 finally{submit.disabled=false;input.disabled=false;input.focus();box.scrollTop=box.scrollHeight;}
});
window.addEventListener('hashchange',()=>{route();window.scrollTo({top:0,behavior:'instant'});});
async function start(){
 renderNav();
 if(state.token)loading('Preparando tu próxima experiencia');
 if(state.token){try{const data=await request('auth',{operacion:'validar'},state.token);setUser(data.usuario);}catch(e){if(e.status===401||e.status===403)clearSession();}}
 await route();
}
start();

function checkinPage(){
 const q=new URLSearchParams(location.hash.split('?')[1]||'');
 view.innerHTML=page('Check-in digital','Registra tu asistencia con los datos de tu inscripción.',`<section class="form-panel"><form data-form="checkin"><p class="form-error" role="alert" tabindex="-1" hidden></p><label>ID de inscripción<input name="inscripcion_id" value="${esc(q.get('inscripcion_id')||'')}" required maxlength="120"></label><label>ID del evento<input name="evento_id" value="${esc(q.get('evento_id')||'')}" required maxlength="120"></label><button class="button primary" type="submit">Registrar ingreso</button><p id="checkin-result" role="status" aria-live="polite"></p></form><a href="#/inscripciones">Volver a mis inscripciones</a></section>`);
}
