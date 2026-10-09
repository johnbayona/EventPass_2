import fs from 'node:fs';
import path from 'node:path';
// Run after exporting the actual current workflows to n8n/. Writes separate copies.
const output='n8n_compatibles_asistio';fs.mkdirSync(output,{recursive:true});
let count=0;
for(const name of fs.readdirSync('n8n').filter(n=>/^WF0[567].*\.json$/.test(n))){
 let w;try{w=JSON.parse(fs.readFileSync(path.join('n8n',name),'utf8'));}catch{console.error('JSON inválido, exporta nuevamente:',name);process.exitCode=1;continue;}
 let changes=0;
 for(const n of w.nodes||[]){let s=n.parameters?.jsCode;if(!s)continue;const before=s;
 // In these workflows CONFIRMADA equality is used to count occupied seats.
 s=s.replace(/r\.estado\s*===\s*'CONFIRMADA'/g,"['CONFIRMADA','ASISTIO'].includes(r.estado)");
 // Duplicate detection includes attendance, without enabling cancel/update for ASISTIO.
 if(/^WF06/.test(name))s=s.replace('&& activeRegistration(r)',"&& (activeRegistration(r) || r.estado==='ASISTIO')");
 if(s!==before){n.parameters.jsCode=s;changes++;}
 }
 if(changes){fs.writeFileSync(path.join(output,name),JSON.stringify(w,null,2));console.log(name+': '+changes+' nodos ajustados → '+output);count++;}
 else console.log(name+': sin patrón reconocido; revisar manualmente antes de continuar');
}
if(!count){console.error('No se generaron cambios. Verifica tus exportaciones.');process.exitCode=1;}
