import fs from 'node:fs';
const definitions=[
 ['Crea tu tienda virtual','Emprendimiento','Convierte tu idea en una tienda: propuesta de valor, catálogo y primeros clientes.',7,30,'PUBLICADO'],
 ['Clínica de modelos de negocio','Emprendimiento','Valida tu propuesta y recibe retroalimentación en una mentoría práctica.',8,1,'PUBLICADO'],
 ['Finanzas para emprender','Educación','Aprende a calcular costos, precios y flujo de caja con ejercicios guiados.',0.5,20,'PUBLICADO'],
 ['Marketing digital desde cero','Educación','Diseña una campaña y conoce herramientas para medir sus resultados.',10,25,'PUBLICADO'],
 ['Encuentro de aliados','Networking','Conoce proveedores y emprendedores para construir nuevas alianzas.',12,15,'PUBLICADO'],
 ['Ronda comercial de la comunidad','Networking','Presenta tu negocio y comparte oportunidades con la comunidad.',14,15,'PUBLICADO'],
 ['Laboratorio de ideas — cancelado','Emprendimiento','Caso de prueba de evento cancelado: no debe admitir inscripciones.',15,10,'CANCELADO']
];
const now=Date.now();
const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const rows=definitions.map(([nombre,categoria,descripcion,days,capacidad,estado])=>{
 const p=Object.fromEntries(fmt.formatToParts(new Date(now+days*86400000)).map(p=>[p.type,p.value]));
 return {nombre,categoria,descripcion,fecha:p.year+'-'+p.month+'-'+p.day,hora:p.hour+':'+p.minute,lugar:'Bogotá — espacio de pruebas',capacidad,imagen_url:'',organizador:'EventPass Emprende365',estado};
});
fs.mkdirSync('datos_demo/propuestas',{recursive:true});
fs.writeFileSync('datos_demo/propuestas/eventos-para-WF04.json',JSON.stringify(rows,null,2));
const cols=Object.keys(rows[0]);const quote=x=>'"'+String(x).replaceAll('"','""')+'"';
fs.writeFileSync('datos_demo/propuestas/eventos-para-WF04.csv','\uFEFF'+[cols,...rows.map(r=>cols.map(k=>r[k]))].map(row=>row.map(quote).join(',')).join('\n'));
console.log('7 propuestas en datos_demo/propuestas. No se escribió en Sheets. Crea los eventos con WF04; n8n genera sus IDs.');
